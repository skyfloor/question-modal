"""阶段 3 验证：ai 模式的后端推进（主链路）。

## 为什么用 stub 模型而不是真调

真调一次 7-12 秒，且我们刚刚撞过 **429 tpm exhausted**。
本套件关心的是**推进逻辑**（何时调、失败怎么办、何时停摆、会不会误杀看门狗），
这些都能用 stub 精确构造 —— 而且只有 stub 才能可靠复现"429 / 空结果 / 超时"
这类失败路径。真实模型调用由后续真机验证覆盖。

stub 的做法：monkeypatch `analysis.analyze_survey`，按脚本返回预设结果。
"""
import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, "/app/working/plugins/question-modal")

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
import analysis  # noqa: E402
import recommend as rec  # noqa: E402

PASS = FAIL = 0
FAILS = []


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  \u2705 {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  \u274c {name} {detail}")


QS = [
    {"type": "single", "title": "Q1 选哪个", "options": ["甲", "乙"]},
    {"type": "single", "title": "Q2 确认", "options": ["是", "否"]},
    {"type": "text", "title": "Q3 补充"},
]

_orig = analysis.analyze_survey
CALLS: list = []


def stub_ok(choice_map=None, fail_times=0, always_fail=False):
    """造一个 stub：按题号返回预设 choice，可指定前 N 次失败。"""
    choice_map = choice_map or {}
    state = {"n": 0}

    async def _stub(**kw):
        CALLS.append(kw.get("question_index"))
        state["n"] += 1
        if always_fail or state["n"] <= fail_times:
            return {"ok": False, "error": "429 tpm exhausted",
                    "per_question": [], "question_index": kw.get("question_index")}
        idx = kw.get("question_index")
        ch = choice_map.get(idx, f"答案{idx}")
        return {
            "ok": True, "error": "", "question_index": idx,
            "per_question": [{
                "index": idx, "choice": ch, "confidence": "high",
                "reasoning": "stub reasoning", "failed": False,
            }],
        }

    return _stub


async def run_survey(mode="ai", questions=None, prefs=None, wait=6.0):
    svc = qs.get_question_service()
    tag = f"p3-{int(time.time()*1000)}-{mode}"
    pq = await svc.create(
        session_id="s", agent_id="a", title="阶段3",
        questions=questions or QS, tool_call_id=tag, mode=mode,
        prefs=prefs or {},
    )
    svc._sync_runners(tag)
    deadline = time.time() + wait
    while time.time() < deadline:
        await asyncio.sleep(0.05)
        st = svc.get_survey(tag)
        if st and (st.status == "submitted"
                   or (st.watchdog_reason or "").startswith("AI 分析累计")):
            break
        t = svc._runners().get(tag)
        if t is not None and t.done() and st and st.cursor >= len(
                rec.visible_indices(st.questions, st.answers)):
            break
    st = svc.get_survey(tag)
    out = {
        "status": st.status if st else None,
        "cursor": st.cursor if st else 0,
        "answers": dict(st.answers) if st else {},
        "per_question": dict(st.per_question or {}) if st else {},
        "watchdog_reason": st.watchdog_reason if st else "",
        "submitted_by": st.submitted_by if st else "",
        "future_done": pq.future.done(),
        "result": (pq.future.result() if pq.future.done()
                   and not pq.future.cancelled() else None),
    }
    # 清理
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()
    return out


async def main():
    print("[1] ai 模式：后端自己分析并填完 3 题")
    CALLS.clear()
    analysis.analyze_survey = stub_ok({0: "乙", 1: "是", 2: "补充内容"})
    r = await run_survey("ai")
    print(f"    status={r['status']} cursor={r['cursor']} "
          f"answers={len(r['answers'])} 调用题号={CALLS}")
    ck("[1] 走完并提交", r["status"] == "submitted", r["status"])
    ck("[2] Q1 填成 stub 的「乙」",
       (r["answers"].get("q0") or {}).get("value") == "乙", r["answers"].get("q0"))
    ck("[3] Q2 填成 stub 的「是」",
       (r["answers"].get("q1") or {}).get("value") == "是", r["answers"].get("q1"))
    ck("[4] Q3 问答被填", (r["answers"].get("q2") or {}).get("value") == "补充内容",
       r["answers"].get("q2"))
    ck("[5] 每题各分析一次（3 次调用）", len(CALLS) == 3, CALLS)
    ck("[6] 分析结果写入 per_question", len(r["per_question"]) == 3, r["per_question"].keys())
    ck("[7] Future 被 resolve 且携真答案",
       r["future_done"] and not (r["result"] or {}).get("skipped"),
       {"done": r["future_done"], "skipped": (r["result"] or {}).get("skipped")})

    print("\n[2] 单题失败一次 → 重试后成功（用户裁定 q1）")
    CALLS.clear()
    analysis.analyze_survey = stub_ok({0: "乙", 1: "是", 2: "补充"}, fail_times=1)
    r = await run_survey("ai")
    print(f"    status={r['status']} cursor={r['cursor']} answers={len(r['answers'])}")
    ck("[8] 首次失败后被重试救回，整卷仍走完",
       r["status"] == "submitted" and len(r["answers"]) == 3,
       {"status": r["status"], "answers": r["answers"]})

    print("\n[3] 某题持续失败 → 重试 1 次后跳过该题，不卡整卷（q1）")
    CALLS.clear()

    async def fail_q0_forever(**kw):
        CALLS.append(kw.get("question_index"))
        if kw.get("question_index") == 0:
            return {"ok": False, "error": "429", "per_question": []}
        ch = {1: "是", 2: "补充"}.get(kw.get("question_index"), "")
        return {"ok": True, "error": "", "per_question": [
            {"index": kw.get("question_index"), "choice": ch, "failed": False}]}

    analysis.analyze_survey = fail_q0_forever
    r = await run_survey("ai")
    a0 = r["answers"].get("q0") or {}
    print(f"    status={r['status']} answers={list(r['answers'])} q0={a0}")
    ck("[9] q0 被标记 ai_failed 并跳过",
       a0.get("skipped") is True and a0.get("skipped_by") == "ai_failed", a0)
    ck("[10] 其余题仍被填（不卡整卷）",
       (r["answers"].get("q1") or {}).get("value") == "是", r["answers"].get("q1"))
    ck("[11] 整卷仍然走完", r["status"] == "submitted", r["status"])
    ck("[12] 失败原因被记录便于排查", bool(a0.get("ai_error")), a0.get("ai_error"))
    q0_calls = [c for c in CALLS if c == 0]
    ck("[13] q0 恰好尝试 2 次（首次 + 重试 1 次）",
       len(q0_calls) == rec.AI_MAX_ATTEMPTS_PER_QUESTION, q0_calls)

    print("\n[4] 全部失败 → 累计 10 次后停摆交给用户（q2）")
    CALLS.clear()
    analysis.analyze_survey = stub_ok(always_fail=True)
    many = [{"type": "single", "title": f"Q{i}", "options": ["a", "b"]}
            for i in range(8)]
    r = await run_survey("ai", questions=many, wait=10.0)
    print(f"    status={r['status']} cursor={r['cursor']} "
          f"调用次数={len(CALLS)} reason={r['watchdog_reason'][:50]}")
    ck("[14] 累计尝试不超过上限 10 次",
       len(CALLS) <= rec.AI_MAX_TOTAL_ATTEMPTS, len(CALLS))
    ck("[15] 停摆原因写进 watchdog_reason", "累计尝试" in r["watchdog_reason"],
       r["watchdog_reason"])
    ck("[16] 停摆时不提交（停在当前题等用户）", r["status"] == "pending", r["status"])

    print("\n[5] 看门狗：ai 推进每步刷新 progress_at，不会被误杀")
    CALLS.clear()

    async def slow_ok(**kw):
        CALLS.append(kw.get("question_index"))
        await asyncio.sleep(0.3)
        return {"ok": True, "error": "", "per_question": [
            {"index": kw.get("question_index"), "choice": "乙", "failed": False}]}

    analysis.analyze_survey = slow_ok
    svc = qs.get_question_service()
    tag = f"p3-wd-{int(time.time()*1000)}"
    pq = await svc.create(session_id="s", agent_id="a", title="wd",
                          questions=QS[:2], tool_call_id=tag, mode="ai", prefs={})
    svc.ensure_watchdog(tag)
    svc._sync_runners(tag)
    base = time.time()
    for _ in range(60):
        await asyncio.sleep(0.1)
        st = svc.get_survey(tag)
        if st and st.status == "submitted":
            break
    st = svc.get_survey(tag)
    ck("[17] 慢推进也能走完（没被 60s 看门狗误杀）",
       st.status == "submitted", st.status)
    ck("[18] 没有被看门狗释放",
       not (st.watchdog_reason or "").startswith("自动推进"), st.watchdog_reason)
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()

    print("\n[6] recommend 模式不受影响（回归）")
    CALLS.clear()
    analysis.analyze_survey = stub_ok({})
    qs_rec = [{"type": "single", "title": "R", "options": ["甲", "乙"],
               "recommended": "乙"}]
    r = await run_survey("recommend", questions=qs_rec)
    ck("[19] recommend 仍走 step_once（零模型调用）",
       len(CALLS) == 0 and (r["answers"].get("q0") or {}).get("value") == "乙",
       {"calls": CALLS, "ans": r["answers"]})

    print("\n[7] manual 模式不推进（回归）")
    CALLS.clear()
    svc = qs.get_question_service()
    tag = f"p3-man-{int(time.time()*1000)}"
    await svc.create(session_id="s", agent_id="a", title="man",
                     questions=QS[:1], tool_call_id=tag, mode="manual", prefs={})
    svc._sync_runners(tag)
    await asyncio.sleep(2.0)
    st = svc.get_survey(tag)
    ck("[20] manual 仍 pending 且无人分析",
       st.status == "pending" and not st.answers and len(CALLS) == 0,
       {"status": st.status, "ans": st.answers, "calls": CALLS})
    svc._surveys().pop(tag, None)
    svc._persist_surveys()

    print("\n[8] 跨代际旧实例缺 prefs 字段 → 必须自动补齐（真机抓到的 bug）")
    #
    # 真机实测（2026-11-07）：给 SurveyState 加了 `prefs` 字段后，第 2、3 题报
    # `AttributeError: 'SurveyState' object has no attribute 'prefs'` 被跳过，
    # 而第 1 题正常 —— 因为前两题用 `create()` 新建实例、其余走的是
    # `_SharedState` 里跨 reload 存活的**旧代际实例**。
    class _OldState:
        """模拟上一代 SurveyState：没有 prefs 字段。"""
        def __init__(self, **kw):
            for k, v in kw.items():
                setattr(self, k, v)

    svc = qs.get_question_service()
    tag = f"p3-legacy-{int(time.time()*1000)}"
    legacy = _OldState(
        tool_call_id=tag, session_id="s", agent_id="a", title="legacy",
        questions=QS[:1], answers={}, cursor=0, mode="ai",
        status="pending", per_question={}, created_at=time.time(),
        updated_at=time.time(), orphan=False, rev=0,
    )
    svc._surveys()[tag] = legacy
    got = svc.get_survey(tag)
    ck("[21] 旧实例缺 prefs 时 get_survey 自动补齐",
       isinstance(getattr(got, "prefs", None), dict), getattr(got, "prefs", "MISSING"))
    ck("[22] 补齐后不再抛 AttributeError",
       getattr(got, "prefs", None) == {}, getattr(got, "prefs", "MISSING"))
    svc._surveys().pop(tag, None)
    svc._persist_surveys()

    analysis.analyze_survey = _orig
    print(f"\n{'='*54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
