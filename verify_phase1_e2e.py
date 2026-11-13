"""阶段 1 端到端：/answer 必须带着答案唤醒 agent（不能退化成 skip）。

这是 2026-11-07 自查发现的设计陷阱的守门测试：
若 `/survey-action{submit}` 内部走了 release_survey→skip，用户答案会被
`{"skipped": true}` 顶掉，而卡片仍显示「已提交」= 谎报成功。
本测试直接驱动 QuestionService，断言 Future 的 result 携带真实答案。
"""
import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

# ★ 测试隔离：把问卷 state 写到临时文件，**绝不能碰生产文件**。
#
# 事故记录（2026-11-07）：验证脚本在独立进程里跑，内存表里只有自己造的几条；
# 结尾调 `_persist_surveys()` 时把那份近乎空的内存表写出去，
# **直接覆盖了生产进程的 221 条真实 state**（实测变成 0 条）。
# 现在 `question_service._resolve_survey_file()` 支持这个环境变量覆盖，
# 设上它，生产文件完全不被触碰。
import os as _os
import tempfile as _tempfile
_os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    _os.path.join(_tempfile.gettempdir(), "qm_test_survey_states.json"),
)
import question_service as qs  # noqa: E402

PASS = FAIL = 0
FAILS = []


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  ❌ {name} {detail}")


async def main():
    svc = qs.get_question_service()
    tag = f"verify-p1e2e-{int(time.time())}"

    print("[1] 正常提交路径：答案必须完整到达 agent")
    pq = await svc.create(
        session_id="sess-e2e", agent_id="agent-e2e", title="答案保真",
        questions=[{"type": "single", "title": "选一个", "options": ["甲", "乙"]},
                   {"type": "text", "title": "备注"}],
        tool_call_id=tag, mode="manual",
    )
    svc.apply_action(tag, "set_answer",
                     {"key": "q0", "answer": {"type": "single", "value": "乙"}})
    svc.apply_action(tag, "set_answer",
                     {"key": "q1", "answer": {"type": "text", "value": "这是备注"}})
    svc.apply_action(tag, "submit",
                     {"by": "user", "answers": svc.get_survey(tag).answers})

    # 正确通道：submit_answer 带答案
    answers = svc.get_survey(tag).answers
    await svc.submit_answer(pq.request_id, answers, "末页意见", [])
    await asyncio.sleep(0.05)

    check("Future 已完成", pq.future.done())
    res = pq.future.result()
    check("不是 skipped", not res.get("skipped"), f"got={res}")
    check("q0 答案保真", res["answers"]["q0"]["value"] == "乙",
          f"got={res['answers'].get('q0')}")
    check("q1 答案保真", res["answers"]["q1"]["value"] == "这是备注",
          f"got={res['answers'].get('q1')}")
    check("末页意见保真", res.get("other") == "末页意见", f"got={res.get('other')}")

    st = svc.get_survey(tag)
    check("state 已终态", st.status == "submitted")
    check("released 已标记", st.released is True)

    print("\n[2] 双开竞争：第二次 /answer 不覆盖第一次的答案")
    tag2 = f"{tag}-b"
    pq2 = await svc.create(session_id="s", agent_id="a", title="双开",
                           questions=[{"type": "single", "title": "q", "options": ["甲", "乙"]}],
                           tool_call_id=tag2, mode="manual")
    # 标签页 A 先提交
    first = await svc.submit_answer(pq2.request_id, {"q0": {"type": "single", "value": "甲"}})
    check("A 提交成功", first is not None)
    # 标签页 B 后提交（同一个 request_id）
    second = await svc.submit_answer(pq2.request_id, {"q0": {"type": "single", "value": "乙"}})
    check("B 提交被拒（返回 None）", second is None, f"got={second}")
    await asyncio.sleep(0.05)
    check("A 的答案未被 B 覆盖",
          pq2.future.result()["answers"]["q0"]["value"] == "甲",
          f"got={pq2.future.result()['answers'].get('q0')}")

    print("\n[3] release_survey 不会被 apply_action(submit) 误判为已释放")
    tag3 = f"{tag}-c"
    pq3 = await svc.create(session_id="s", agent_id="a", title="误判",
                           questions=[{"type": "text", "title": "q"}],
                           tool_call_id=tag3, mode="manual")
    svc.apply_action(tag3, "submit", {"by": "user"})   # 前端点提交那一刻
    check("submit 后 status=submitted", svc.get_survey(tag3).status == "submitted")
    ok = await svc.release_survey(tag3, "user")
    check("release_survey 仍返回 True（没被 status 骗）", ok is True)
    await asyncio.sleep(0.05)
    check("Future 真的被放行", pq3.future.done())

    print("\n[4] 第二个标签页能看到第一页的修改（广播重放）")
    tag4 = f"{tag}-d"
    await svc.create(session_id="s", agent_id="a", title="重放",
                     questions=[{"type": "single", "title": "q", "options": ["甲", "乙"]}],
                     tool_call_id=tag4, mode="manual")
    svc.apply_action(tag4, "set_answer",
                     {"key": "q0", "answer": {"type": "single", "value": "甲"}})
    svc.apply_action(tag4, "goto", {"cursor": 1})
    q_new, replay = svc.subscribe(tag4)      # 模拟后开的标签页
    check("重放包含历史变更", len(replay) >= 2, f"got={len(replay)}")
    check("重放最终答案正确",
          replay[-1]["state"]["answers"]["q0"]["value"] == "甲"
          or any(e["state"]["answers"].get("q0", {}).get("value") == "甲" for e in replay))
    svc.unsubscribe(tag4, q_new)

    for t in (tag, tag2, tag3, tag4):
        svc.stop_watchdog(t)
        svc._surveys().pop(t, None)
    svc._persist_surveys()

    print(f"\n{'='*50}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  ❌", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
