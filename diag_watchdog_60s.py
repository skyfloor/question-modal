"""复现并定性：ai 模式下「单题问卷 + 持续 429」时后端会怎样。

## 为什么要单独查这个

用户实测：弹了一份**只有 1 题**的问卷，关掉页面后 60 秒，后端记录是
`submitted_by=watchdog`、`cursor=0`、`answers={}`、`watchdog_reason='自动推进 60s 无进展'`。

用户以为"后台运行成功"，实际是**被看门狗释放、一题都没答**。

时段内日志显示密集 429（TPM/RPM 超限）。要确认的是：这是**环境（限流）导致**，
还是**逻辑缺陷（本可以跳过却卡到超时）**。

关键差异：
  • 设计上「单题失败 → 重试 1 次 → 标记跳过」→ 应该很快走完，不该等到 60s
  • 但如果整卷只有 1 题，`AI_MAX_TOTAL_ATTEMPTS=10` 这个大预算根本用不上，
    而 `AI_MAX_ATTEMPTS_PER_QUESTION=2` 只给 2 次 —— 2 次失败就该跳过了。
    若它没跳过，说明有别的原因在拖。

本套件用 stub 精确构造这两种情形，把行为钉死。
"""
import asyncio
import sys
import time

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
_orig = analysis.analyze_survey


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


async def drive(questions, wait=8.0, mode="ai", prefs=None, watchdog=False):
    svc = qs.get_question_service()
    tag = f"diag-{int(time.time()*1000)}"
    pq = await svc.create(session_id="s", agent_id="a", title="diag",
                          questions=questions, tool_call_id=tag,
                          mode=mode, prefs=prefs or {})
    if watchdog:
        svc.ensure_watchdog(tag)
    svc._sync_runners(tag)
    t0 = time.time()
    resolved_at = None
    while time.time() - t0 < wait:
        await asyncio.sleep(0.1)
        st = svc.get_survey(tag)
        if pq.future.done() and resolved_at is None:
            resolved_at = time.time() - t0
            break
        if st and st.status != "pending":
            break
    st = svc.get_survey(tag)
    out = {
        "elapsed": time.time() - t0,
        "resolved_at": resolved_at,
        "status": st.status if st else None,
        "submitted_by": st.submitted_by if st else "",
        "cursor": st.cursor if st else 0,
        "answers": dict(st.answers) if st else {},
        "watchdog_reason": st.watchdog_reason if st else "",
        "result": (pq.future.result() if pq.future.done()
                   and not pq.future.cancelled() else None),
    }
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()
    return out


ONE = [{"title": "只有一题", "type": "single", "options": ["甲", "乙"]}]


async def main():
    print("[1] 单题 + 模型始终 429 → 应在 2 次尝试后**快速跳过**，不等 60s")
    calls = []

    async def always_429(**kw):
        calls.append(kw.get("question_index"))
        return {"ok": False, "error": "429 tpm exhausted", "per_question": []}

    analysis.analyze_survey = always_429
    r = await drive(ONE, wait=12.0, watchdog=True)
    print(f"    耗时={r['elapsed']:.1f}s status={r['status']} by={r['submitted_by']} "
          f"cursor={r['cursor']} 调用={len(calls)}")
    print(f"    answers={r['answers']}")
    print(f"    watchdog_reason={r['watchdog_reason']!r}")
    ck("[1] 12 秒内就结束了（没等到 60s 看门狗）",
       r["elapsed"] < 10.0, f"{r['elapsed']:.1f}s")
    ck("[2] 不是 watchdog 提交的", r["submitted_by"] != "watchdog", r["submitted_by"])
    ck("[3] 只尝试了 2 次（AI_MAX_ATTEMPTS_PER_QUESTION）",
       len(calls) == rec.AI_MAX_ATTEMPTS_PER_QUESTION, len(calls))
    a0 = r["answers"].get("q0") or {}
    ck("[4] 该题被标记 ai_failed 跳过", a0.get("skipped_by") == "ai_failed", a0)
    ck("[5] 整卷仍然提交了（携提交体）",
       r["status"] == "submitted", r["status"])

    print("\n[2] 对照：模型正常时单题多久走完")
    calls.clear()

    async def ok(**kw):
        calls.append(kw.get("question_index"))
        return {"ok": True, "error": "", "per_question": [
            {"index": kw.get("question_index"), "choice": "乙", "failed": False}]}

    analysis.analyze_survey = ok
    r2 = await drive(ONE, wait=12.0, watchdog=True)
    print(f"    耗时={r2['elapsed']:.1f}s status={r2['status']} "
          f"answers={len(r2['answers'])}")
    ck("[6] 正常情况秒级走完", r2["elapsed"] < 5.0, f"{r2['elapsed']:.1f}s")
    ck("[7] 答案正确", (r2["answers"].get("q0") or {}).get("value") == "乙",
       r2["answers"].get("q0"))

    print("\n[3] prefs 为 None 时（旧代际 state）是否也能工作")
    calls.clear()
    analysis.analyze_survey = ok
    r3 = await drive(ONE, wait=12.0, prefs=None)
    ck("[8] prefs=None 不影响推进（走默认模型配置）",
       r3["status"] == "submitted" and len(r3["answers"]) == 1,
       {"status": r3["status"], "answers": r3["answers"]})

    print("\n[4] ★ 复现用户现场：单题 + 429 + 看门狗 60s")
    calls.clear()
    analysis.analyze_survey = always_429
    r4 = await drive(ONE, wait=70.0, watchdog=True)
    print(f"    最终 status={r4['status']} by={r4['submitted_by']} "
          f"reason={r4['watchdog_reason'][:40]!r}")
    print(f"    是否被看门狗接管的: {r4['submitted_by'] == 'watchdog'}")
    print(f"    → 若上面 [1]-[5] 通过，说明本次是**限流期间恰好撞上**，"
          f"不是逻辑缺陷")

    analysis.analyze_survey = _orig
    print(f"\n{'='*54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
