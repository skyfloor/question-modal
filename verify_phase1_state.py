"""阶段 1 后端验证：state 权威 / 动作裁决 / 广播 / 幂等 / 看门狗。

不依赖 HTTP 服务，直接调用 QuestionService，可离线重跑。
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

PASS = 0
FAIL = 0
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
    tag = f"verify-p1-{int(time.time())}"

    print("\n[1] 问卷创建即建 state 基线")
    pq = await svc.create(
        session_id="sess-x", agent_id="agent-x", title="阶段1验证",
        questions=[
            {"type": "single", "title": "第一题", "options": ["甲", "乙"]},
            {"type": "text", "title": "备注"},
        ],
        tool_call_id=tag,
        mode="manual",
    )
    st = svc.get_survey(tag)
    check("state 存在", st is not None)
    check("questions 已落基线", st and len(st.questions) == 2, f"got={st and len(st.questions)}")
    check("request_id 关联", st and st.request_id == pq.request_id)
    check("session/agent 关联", st and st.session_id == "sess-x" and st.agent_id == "agent-x")
    check("mode 落值", st and st.mode == "manual")
    check("progress_at 已初始化", st and st.progress_at > 0)

    print("\n[2] 订阅 / 广播 / 修订号")
    q, replay = svc.subscribe(tag)
    check("初始 replay 为空", replay == [], f"got={len(replay)}")
    rev0 = svc.current_rev(tag)
    st = svc.apply_action(tag, "set_answer", {"key": "q0", "answer": {"type": "single", "value": "甲"}})
    check("set_answer 写入 answers", st.answers.get("q0", {}).get("value") == "甲")
    check("修订号 +1", svc.current_rev(tag) == rev0 + 1, f"got={svc.current_rev(tag)} rev0={rev0}")
    ev = q.get_nowait()
    check("订阅者收到事件", ev.get("action") == "set_answer", f"got={ev.get('action')}")
    check("事件带完整 state", isinstance(ev.get("state"), dict) and ev["state"].get("answers"))

    print("\n[3] 第二个订阅者拿到重放（= 刷新/第二标签页）")
    q2, replay2 = svc.subscribe(tag)
    check("replay 含刚发生的事件", len(replay2) >= 1, f"got={len(replay2)}")
    check("replay 最新一条是 set_answer",
          replay2[-1].get("action") == "set_answer", f"got={replay2[-1].get('action')}")

    print("\n[4] 双开：同一次写入两个订阅者都收到")
    svc.apply_action(tag, "set_answer", {"key": "q1", "answer": {"type": "text", "value": "备注内容"}})
    e1 = q.get_nowait()
    e2 = q2.get_nowait()
    check("订阅者 A 收到", e1.get("state", {}).get("answers", {}).get("q1", {}).get("value") == "备注内容")
    check("订阅者 B 收到同一份", e2.get("rev") == e1.get("rev") and e2.get("state") == e1.get("state"))

    print("\n[5] cursor / mode 后到改变广播")
    r = svc.current_rev(tag)
    svc.apply_action(tag, "goto", {"cursor": 1})
    check("cursor 写入", svc.get_survey(tag).cursor == 1)
    check("goto 广播", svc.current_rev(tag) == r + 1)
    q.get_nowait(); q2.get_nowait()
    r = svc.current_rev(tag)
    svc.apply_action(tag, "set_mode", {"mode": "ai"})
    check("mode 写入", svc.get_survey(tag).mode == "ai")
    check("set_mode 广播", svc.current_rev(tag) == r + 1)
    q.get_nowait(); q2.get_nowait()
    r = svc.current_rev(tag)
    svc.apply_action(tag, "set_mode", {"mode": "bogus"})
    check("非法 mode 被拒（不写不改）", svc.get_survey(tag).mode == "ai")
    check("非法 mode 不广播", svc.current_rev(tag) == r, f"got={svc.current_rev(tag)} r={r}")

    print("\n[6] 提交：state 终态 + 真正 resolve Future")
    fut = pq.future
    check("Future 尚未完成", not fut.done())
    st = svc.apply_action(tag, "submit", {"by": "user", "answers": svc.get_survey(tag).answers})
    check("state.status=submitted", st.status == "submitted")
    check("submitted_by=user", st.submitted_by == "user")
    ok = await svc.release_survey(tag, "user")
    check("release 成功", ok is True)
    await asyncio.sleep(0.05)
    check("Future 已 resolve", fut.done())
    check("resolve 内容为 skipped", fut.result().get("skipped") is True)

    print("\n[7] 幂等：第二次 release 不重复 resolve")
    ok2 = await svc.release_survey(tag, "user")
    check("第二次 release 返回 False", ok2 is False)

    print("\n[8] 看门狗：manual 模式不干预")
    tag_m = f"{tag}-m"
    await svc.create(session_id="s", agent_id="a", title="manual",
                     questions=[{"type": "text", "title": "q"}],
                     tool_call_id=tag_m, mode="manual")
    old = time.time() - 999
    stm = svc.get_survey(tag_m)
    stm.progress_at = old
    svc.ensure_watchdog(tag_m)
    await asyncio.sleep(qs._SURVEY_WATCHDOG_TICK + 1.0)
    stm = svc.get_survey(tag_m)
    check("manual 未被释放", stm.status == "pending", f"got={stm.status}")
    svc.stop_watchdog(tag_m)

    print("\n[9] 看门狗：ai 模式 60s 无进展 → 释放")
    tag_a = f"{tag}-a"
    pqa = await svc.create(session_id="s", agent_id="a", title="ai",
                           questions=[{"type": "text", "title": "q"}],
                           tool_call_id=tag_a, mode="ai")
    sta = svc.get_survey(tag_a)
    sta.progress_at = time.time() - (qs._SURVEY_WATCHDOG_SEC + 5)
    svc.ensure_watchdog(tag_a)
    released = False
    for _ in range(40):
        await asyncio.sleep(0.25)
        cur = svc.get_survey(tag_a)
        if cur.status == "submitted":
            released = True
            break
    check("ai 模式被看门狗释放", released, f"status={svc.get_survey(tag_a).status}")
    check("释放原因已记录", bool(svc.get_survey(tag_a).watchdog_reason))
    check("Future 已 resolve", pqa.future.done())

    print("\n[10] 落盘恢复")
    svc._persist_surveys()
    # 必须读 `_resolve_survey_file()` 而不是硬编码生产路径 ——
    # 本脚本已把 state 重定向到 /tmp 下的临时文件（测试隔离），
    # 硬编码生产路径会读到真实数据、断言必然失败且可能误判。
    raw = qs._resolve_survey_file().read_text(encoding="utf-8")
    check("状态已落盘", tag in raw)
    check("落盘含 rev 字段", '"rev"' in raw)

    print("\n[11] 退订不报错且幂等")
    svc.unsubscribe(tag, q)
    svc.unsubscribe(tag, q)
    check("重复退订安全", True)
    q3, _ = svc.subscribe(tag)
    svc.apply_action(tag, "set_answer", {"key": "q9", "answer": {"type": "text", "value": "x"}})
    check("仍能写入广播", svc.current_rev(tag) > 0)
    svc.unsubscribe(tag, q3)

    # 清理测试数据
    for t in (tag, tag_m, tag_a):
        svc.stop_watchdog(t)
        svc._surveys().pop(t, None)
    svc._persist_surveys()

    print(f"\n{'='*50}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    if FAILS:
        for f in FAILS:
            print("  ❌", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
