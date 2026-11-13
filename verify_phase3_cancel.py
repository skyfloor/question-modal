"""阶段 3 第二步：切人工时必须中止**在飞**的模型调用。

## 背景

阶段 3 让 ai 模式的后端 runner 逐题调模型分析（7-12 秒/题）。若用户此时
切到「人工」，正在等的那次 `analyze_survey` 不该继续：

  ① 白烧配额（用户今天已被 429 限流数百次）
  ② 结果回来后会**覆盖用户手填的答案**（最严重）
  ③ 整卷可能在被取消的题上留下 `ai_failed` 脏标记

## 现状（本轮先取证，不预设）

`apply_action("set_mode")` → `_sync_runners` → 切 manual 走 `stop_runner`
→ `task.cancel()`。`_runner_loop` 的 `except asyncio.CancelledError: raise`。
所以**理论上**取消会传播到 `await analyze_survey(...)` 里。

但"理论上"不算数，本套件用可控的慢模型把真实时序钉死。
"""
import asyncio
import json
import os
import sys
import tempfile
import time

os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    os.path.join(tempfile.gettempdir(), "qm_phase3_cancel.json"),
)

sys.path.insert(0, "/app/working/plugins/question-modal")
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


QS3 = [
    {"type": "single", "title": "Q1", "options": ["甲", "乙"]},
    {"type": "single", "title": "Q2", "options": ["丙", "丁"]},
]


async def make(tag, mode="ai"):
    svc = qs.get_question_service()
    pq = await svc.create(session_id="s", agent_id="a", title="t",
                          questions=QS3, tool_call_id=tag, mode=mode, prefs={})
    return svc, pq


def cleanup(svc, tag):
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()


async def main():
    svc = qs.get_question_service()

    # ── 场景 1：模型慢（2s），中途切 manual ─────────────────────────
    print("[1] ai 分析在飞时切 manual → 必须中止")
    cancelled_flag = {"v": False}
    started = {"t": 0.0}
    finished = {"t": 0.0}

    async def slow(**kw):
        started["t"] = time.time()
        try:
            await asyncio.sleep(2.0)
            finished["t"] = time.time()
            return {"ok": True, "per_question": [
                {"index": kw.get("question_index"), "choice": "甲",
                 "failed": False}]}
        except asyncio.CancelledError:
            cancelled_flag["v"] = True
            raise

    analysis.analyze_survey = slow
    tag = "cancel1"
    svc2, pq = await make(tag)
    svc2.ensure_watchdog(tag)
    svc2._sync_runners(tag)
    await asyncio.sleep(0.15)                     # 让分析真的开始
    ck("[1] 分析已开始（模型在飞）", started["t"] > 0, started)

    t_switch = time.time()
    svc2.apply_action(tag, "set_mode", {"mode": "manual"})
    await asyncio.sleep(0.5)                      # 给取消传播的时间

    elapsed_after_switch = time.time() - t_switch
    ck("[2] 模型调用在切人工后 0.5s 内被取消（不是等它自然跑完 2s）",
       cancelled_flag["v"], f"cancelled={cancelled_flag['v']}")
    ck("[3] 模型确实没跑完（未记录 finished 时刻）",
       finished["t"] == 0.0, f"finished={finished['t']}")
    ck("[4] 切人工后答案里**没有**被 AI 填进去的内容",
       not (svc2.get_survey(tag).answers or {}), svc2.get_survey(tag).answers)
    ck("[5] 切人工后状态仍是 pending（没被误提交）",
       svc2.get_survey(tag).status == "pending", svc2.get_survey(tag).status)
    st = svc2.get_survey(tag)
    ck("[6] 没有留下 ai_failed 脏标记",
       not any((a or {}).get("skipped_by") == "ai_failed"
               for a in (st.answers or {}).values()), st.answers)
    cleanup(svc2, tag)

    # ── 场景 2：切人工后用户手答，答案必须保持（不被在飞结果覆盖）──
    print("\n[2] 切人工 + 用户手答 → 手答内容不得被覆盖")
    cancelled_flag["v"] = False
    finished["t"] = 0.0
    started["t"] = 0.0
    tag = "cancel2"
    svc3, pq3 = await make(tag)
    svc3.ensure_watchdog(tag)
    svc3._sync_runners(tag)
    await asyncio.sleep(0.15)
    svc3.apply_action(tag, "set_mode", {"mode": "manual"})
    # ★ 参数名必须是 `key` + `answer`（见 question_service.apply_action），
    # 不是 `index` + `value`。我第一版写错了，于是 [7] 报 got=None ——
    # 那是**测试的错**，不是产品丢答案。这种"假失败"会误导定性，必须核对协议。
    svc3.apply_action(tag, "set_answer",
                      {"key": "q0", "answer": {"type": "single",
                                               "value": "乙", "other": ""}})
    await asyncio.sleep(2.5)                      # 超过慢模型时长，看会不会被回填
    st3 = svc3.get_survey(tag)
    got = ((st3.answers or {}).get("q0") or {}).get("value")
    ck("[7] 用户手答「乙」保持不变", got == "乙", f"got={got!r}")
    ck("[8] 仍是 pending，没有被自动提交",
       st3.status == "pending", st3.status)
    cleanup(svc3, tag)

    # ── 场景 3：切回 ai 应能重新开始推进 ─────────────────────────────
    print("\n[3] 切回 ai → 重新启动推进并答完")
    calls = {"n": 0}

    async def fast(**kw):
        calls["n"] += 1
        return {"ok": True, "per_question": [
            {"index": kw.get("question_index"),
             "choice": "甲" if kw.get("question_index") == 0 else "丙",
             "failed": False}]}

    analysis.analyze_survey = fast
    tag = "cancel3"
    svc4, pq4 = await make(tag)
    svc4.ensure_watchdog(tag)
    svc4._sync_runners(tag)
    for _ in range(60):
        await asyncio.sleep(0.1)
        if pq4.future.done():
            break
    a = svc4.get_survey(tag).answers or {}
    ck("[9] 切回后能正常答完（说明 stop/start 对称）",
       len(a) == 2, a)
    ck("[10] 答案内容正确",
       (a.get("q0") or {}).get("value") == "甲"
       and (a.get("q1") or {}).get("value") == "丙", a)
    cleanup(svc4, tag)

    # ── 场景 4：切 manual 时**没有**在飞调用（幂等）────────────────
    print("\n[4] 无在飞调用时切 manual 不应报错")
    tag = "cancel4"
    svc5, pq5 = await make(tag, mode="recommend")
    try:
        svc5.apply_action(tag, "set_mode", {"mode": "manual"})
        svc5.apply_action(tag, "set_mode", {"mode": "manual"})
        ok = True
        err = ""
    except Exception as e:  # noqa: BLE001
        ok, err = False, f"{type(e).__name__}: {e}"
    ck("[11] 重复切 manual 不抛异常", ok, err)
    cleanup(svc5, tag)

    analysis.analyze_survey = _orig
    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
