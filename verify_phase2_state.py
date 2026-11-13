"""阶段 2 后端推进验证：recommend 模式在**没有任何页面**时能走完整卷。

这是用户核心诉求的直接判据：
  「如果我关闭会话窗口，当前会话窗口实际也是在继续推进，不会出现停留，
    或者卡顿等待窗口重新打开再执行」

本套件不打开任何浏览器、不挂任何卡片 —— 只创建问卷、设 mode=recommend，
然后**什么都不做**，看后端能否自己把 qu 卷走完并唤醒 agent。
"""
import asyncio
import sys
import time
from pathlib import Path

# ★ 测试隔离：把问卷 state 写到临时文件，**绝不能碰生产文件**。
#
# 事故记录（2026-11-07）：验证脚本在独立进程里跑，内存表里只有自己造的几条；
# 结尾调 `_persist_surveys()` 时把那份近乎空的内存表写出去，
# **直接覆盖了生产进程的真实 state**（实测曾变成 0 条）。更难查的一次是
# 多个测试进程并发写同一个固定 `.tmp` 名，导致正式文件被整体移走/消失。
# 现在 `question_service._resolve_survey_file()` 支持环境变量覆盖 + tmp 名唯一，
# 设上它，生产文件完全不被触碰。
import os as _os
import tempfile as _tempfile
_os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    _os.path.join(_tempfile.gettempdir(), "qm_test_survey_states.json"),
)
sys.path.insert(0, "/app/working/plugins/question-modal")
import question_service as qs  # noqa: E402
import recommend as rec  # noqa: E402

PASS = FAIL = 0
FAILS = []


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  ❌ {name} {detail}")


QS = [
    {"type": "single", "title": "Q1 选哪个", "options": ["甲", "乙"], "recommended": "乙"},
    {"type": "single", "title": "Q2 确认", "options": ["是", "否"], "recommended": "是"},
    {"type": "text", "title": "Q3 补充", "recommended": "无需补充"},
]


async def main():
    svc = qs.get_question_service()
    tag = f"p2-run-{int(time.time())}"

    print("[1] 创建 recommend 模式的问卷（模拟 agent 弹出）")
    pq = await svc.create(
        session_id="sess-p2", agent_id="agent-p2", title="后端推进验证",
        questions=QS, tool_call_id=tag, mode="recommend",
    )
    st = svc.get_survey(tag)
    ck("state 已建", st is not None)
    ck("mode=recommend", st and st.mode == "recommend", st and st.mode)
    ck("初始 cursor=0、无答案", st and st.cursor == 0 and not st.answers)

    print("\n[2] 启动后端推进（不打开任何页面）")
    svc._sync_runners(tag)
    ck("runner 已启动", tag in svc._runners() and not svc._runners()[tag].done())

    print("\n[3] 什么都不做，等后端自己走完")
    submitted = False
    for _ in range(80):                    # 最多等 8 秒
        await asyncio.sleep(0.1)
        cur = svc.get_survey(tag)
        if cur and cur.status == "submitted":
            submitted = True
            break
    cur = svc.get_survey(tag)
    ck("后端自己把问卷提交了", submitted, cur and cur.status)
    ck("提交来源标记为 user（走 submit_answer）",
       (cur.submitted_by or "") in ("user", "backend"), cur.submitted_by)

    print("\n[4] 答案正确（不是空提交）")
    ans = cur.answers or {}
    print(f"    answers = {ans}")
    ck("Q1 = 乙", (ans.get("q0") or {}).get("value") == "乙", ans.get("q0"))
    ck("Q2 = 是", (ans.get("q1") or {}).get("value") == "是", ans.get("q1"))
    ck("Q3 = 无需补充", (ans.get("q2") or {}).get("value") == "无需补充", ans.get("q2"))

    print("\n[5] agent 真的被唤醒且拿到答案（不是 skipped）")
    await asyncio.sleep(0.1)
    ck("Future 已完成", pq.future.done())
    if pq.future.done() and not pq.future.cancelled():
        res = pq.future.result()
        ck("结果不是 skipped", not res.get("skipped"), res)
        ck("结果携带真实答案",
           (res.get("answers") or {}).get("q0", {}).get("value") == "乙",
           (res.get("answers") or {}).get("q0"))

    print("\n[6] runner 自然结束（不是崩掉）")
    await asyncio.sleep(0.2)
    task = svc._runners().get(tag)
    ck("runner 任务已结束", task is None or task.done(), task)

    # ── 场景：无推荐题必须跳过而不是卡住 ──
    print("\n[7] 无推荐题：跳过而非卡住")
    tag2 = f"{tag}-norec"
    await svc.create(
        session_id="s", agent_id="a", title="无推荐",
        questions=[{"type": "single", "title": "只有题没推荐", "options": ["甲", "乙"]},
                   {"type": "text", "title": "第二题", "recommended": "好"}],
        tool_call_id=tag2, mode="recommend",
    )
    svc._sync_runners(tag2)
    done2 = False
    for _ in range(80):
        await asyncio.sleep(0.1)
        c = svc.get_survey(tag2)
        if c and c.status == "submitted":
            done2 = True
            break
    c2 = svc.get_survey(tag2)
    ck("含无推荐题也能走完（不卡住）", done2, c2 and c2.status)
    a2 = c2.answers or {}
    ck("无推荐题被标记 skipped_by=no_recommend",
       (a2.get("q0") or {}).get("skipped_by") == "no_recommend", a2.get("q0"))
    ck("第二题仍被填上", (a2.get("q1") or {}).get("value") == "好", a2.get("q1"))

    # ── 场景：用户手答优先，不被覆盖 ──
    print("\n[8] 用户手答优先：已有答案不被 recommend 覆盖")
    tag3 = f"{tag}-manual-first"
    await svc.create(
        session_id="s", agent_id="a", title="先答一题",
        questions=[{"type": "single", "title": "Q1", "options": ["甲", "乙"], "recommended": "乙"},
                   {"type": "single", "title": "Q2", "options": ["是", "否"], "recommended": "是"}],
        tool_call_id=tag3, mode="manual",
    )
    # 用户先手工答 Q1=甲
    svc.apply_action(tag3, "set_answer",
                     {"key": "q0", "answer": {"type": "single", "value": "甲"}})
    # 然后切 recommend 让它收尾
    svc.apply_action(tag3, "set_mode", {"mode": "recommend"})
    done3 = False
    for _ in range(80):
        await asyncio.sleep(0.1)
        c = svc.get_survey(tag3)
        if c and c.status == "submitted":
            done3 = True
            break
    c3 = svc.get_survey(tag3)
    ck("切换后能走完", done3, c3 and c3.status)
    a3 = c3.answers or {}
    ck("用户手答的「甲」未被覆盖成「乙」",
       (a3.get("q0") or {}).get("value") == "甲", a3.get("q0"))
    ck("未答的 Q2 被自动填上", (a3.get("q1") or {}).get("value") == "是", a3.get("q1"))

    # ── 场景：manual 模式不会自己动 ──
    print("\n[9] manual 模式：后端不推进（等人）")
    tag4 = f"{tag}-manual"
    await svc.create(
        session_id="s", agent_id="a", title="人工",
        questions=[{"type": "single", "title": "Q", "options": ["甲"], "recommended": "甲"}],
        tool_call_id=tag4, mode="manual",
    )
    svc._sync_runners(tag4)
    await asyncio.sleep(1.5)
    c4 = svc.get_survey(tag4)
    ck("manual 状态仍是 pending", c4.status == "pending", c4.status)
    ck("manual 没有答案（没被自动填）", not c4.answers, c4.answers)
    ck("manual 没起 runner", tag4 not in svc._runners(), svc._runners().keys())

    # ── 场景：showIf 隐藏题不会被填 ──
    print("\n[10] showIf：隐藏题不会被自动填答案")
    tag5 = f"{tag}-showif"
    await svc.create(
        session_id="s", agent_id="a", title="条件题",
        questions=[
            {"type": "single", "title": "要开工吗", "options": ["是", "否"],
             "recommended": "否"},
            {"type": "single", "title": "开工方式", "options": ["先后端", "先前端"],
             "recommended": "先后端", "showIf": {"q0": "是"}},
        ],
        tool_call_id=tag5, mode="recommend",
    )
    svc._sync_runners(tag5)
    for _ in range(80):
        await asyncio.sleep(0.1)
        c = svc.get_survey(tag5)
        if c and c.status == "submitted":
            break
    c5 = svc.get_survey(tag5)
    ck("走完（隐藏题不阻塞）", c5.status == "submitted", c5.status)
    ck("隐藏题 q1 没有被填答案", "q1" not in (c5.answers or {}), c5.answers)
    ck("可见题 q0 被填", (c5.answers or {}).get("q0", {}).get("value") == "否",
       c5.answers)

    # 清理
    for t in (tag, tag2, tag3, tag4, tag5):
        svc.stop_watchdog(t)
        svc.stop_runner(t)
        svc._surveys().pop(t, None)
    svc._persist_surveys()

    print(f"\n{'='*54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  ❌", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
