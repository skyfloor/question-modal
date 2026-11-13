"""守卫 A/B/C 三处修复（2026-11-07 用户报的两个问题）。

## 用户报的现象

1. 「只用推荐」末题能跳过，但跳过前停 2-3 秒（**本轮只取证，未改**）
2. ai 分析中手动「停止分析」→ 切「只用推荐」→ 问卷不自动处理

## 本轮修的三处

### A. 崩溃：`UnboundLocalError: step`
`_runner_loop` 的日志用
`(step.get("question_index") if st.mode == "recommend" else tgt.get("index"))`，
但 `step` 只在 recommend 分支定义。**切模式后旧迭代的 `st.mode` 已变成
recommend** → 去取从未赋值的 `step` → runner 崩。
修法：两个分支统一赋 `qidx`，日志只用 `qidx`。

### B. 切模式必须重启 runner
`ensure_runner` 开头 `if cur is not None and not cur.done(): return` —— 旧 runner
仍 park 在 `await analyze_survey`（8-12s），新模式永远起不来。
实测：切后 3s 零推进、9.2s 才动、慢分析**未被中断**。
修法：`_sync_runners` 比较 task 的 `_qm_mode` 标记，模式不同就 stop + 重新起。
实测修后：**0.012s** 立即推进、慢分析被中断、3 题全填。

### C. 「停止分析」要通知后端
前端 abort 只中止自己那次 `/analyze`，触达不到后端 runner 的分析。
新增 `cancel_analysis` action：stop_runner + 按当前 mode 重新同步。
"""
import ast
import asyncio
import os
import re
import sys
import tempfile
import time
from pathlib import Path

os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    os.path.join(tempfile.gettempdir(), "qm_fix2.json"),
)

PLUG = Path("/app/working/plugins/question-modal")
DEV = Path("/app/working/build/question-modal-dev")
PASS = FAIL = 0
FAILS = []


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


Q = lambda i, r=None: ({"type": "single", "title": f"Q{i}",
                        "options": ["甲", "乙"], **({"recommended": r} if r else {})})


def cleanup(svc, tag):
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()


def static_checks():
    print("[A] 崩溃点已消除：日志不再依赖分支内局部变量")
    qs_src = (PLUG / "question_service.py").read_text(encoding="utf-8")
    ck("[A1] runner 日志用统一的 qidx",
       re.search(r'"runner:%s %s q%s cursor=%s ans=%s"', qs_src) is not None
       and "qidx, st.cursor" in qs_src)
    ck("[A2] 不再出现 `step.get(...) if st.mode ==` 这种跨分支取值",
       'step.get("question_index") if st.mode' not in qs_src,
       "这句在切模式后必崩（UnboundLocalError）")
    ck("[A3] 两个分支都显式初始化 step/tgt/qidx",
       "step = None" in qs_src and "tgt = None" in qs_src
       and "qidx: int | None = None" in qs_src)

    print("\n[B] 切模式必须重启 runner")
    ck("[B1] `_sync_runners` 有 restart 逻辑",
       "runner:restart" in qs_src)
    ck("[B2] runner task 打 _qm_mode 标记", "_qm_mode" in qs_src)
    ck("[B3] 模式不同就 stop_runner 再 ensure_runner",
       re.search(r"if alive:\s*\n\s*logger\.info\(\s*\n?\s*\"runner:restart", qs_src) is not None
       or ("if alive:" in qs_src and "self.stop_runner(tool_call_id)"
           in qs_src.split("runner:restart")[-1][:400]))

    print("\n[C] 「停止分析」通知后端")
    ck("[C1] 后端有 cancel_analysis action",
       'action == "cancel_analysis"' in qs_src)
    ck("[C2] cancel_analysis 会 stop_runner 并重新同步",
       "runner:cancel-analysis" in qs_src)
    idx_src = (DEV / "src/index.tsx").read_text(encoding="utf-8")
    ck("[C3] 前端 stopAnalysis 发 cancel_analysis",
       'postSurveyActionAsync(callId, "cancel_analysis"' in idx_src)

    print("\n[额外] 三个修复都不能破坏原有的「切人工中止分析」")
    ck("[D1] 仍保留 CancelledError 传播（切走要中断在飞调用）",
       "except asyncio.CancelledError:\n            raise" in qs_src)


async def runtime_checks():
    sys.path.insert(0, str(PLUG))
    import question_service as qs
    import analysis

    _orig = analysis.analyze_survey

    print("\n[R1] ai 慢分析在飞 → 切 recommend → 必须立即推进")
    aborted = {"v": False}

    async def slow(**kw):
        try:
            await asyncio.sleep(8.0)
            return {"ok": True, "per_question": [
                {"index": kw.get("question_index"), "choice": "乙", "failed": False}]}
        except asyncio.CancelledError:
            aborted["v"] = True
            raise

    analysis.analyze_survey = slow
    svc = qs.get_question_service()
    tag = "fix2-switch"
    pq = await svc.create(session_id="s", agent_id="a", title="t",
                          questions=[Q(0, "甲"), Q(1, "甲"), Q(2, "甲")],
                          tool_call_id=tag, mode="ai", prefs={})
    svc.ensure_watchdog(tag)
    svc._sync_runners(tag)
    await asyncio.sleep(0.3)
    task_before = svc._runners().get(tag)
    ck("[R1] 切前旧 runner 在跑且未完成",
       task_before is not None and not task_before.done())

    t_switch = time.time()
    svc.apply_action(tag, "set_mode", {"mode": "recommend"})
    progressed = None
    for _ in range(300):
        await asyncio.sleep(0.01)
        st = svc.get_survey(tag)
        if st and (st.answers or {}):
            progressed = time.time() - t_switch
            break
    st = svc.get_survey(tag)
    print(f"    切后推进耗时 = "
          f"{'未推进' if progressed is None else f'{progressed:.3f}s'}，"
          f"答案 {len(st.answers or {})}，慢分析被中断={aborted['v']}")
    ck("[R2] 切 recommend 后 1 秒内开始推进", progressed is not None and progressed < 1.0,
       progressed)
    ck("[R3] 慢分析被中断（不再白烧配额）", aborted["v"])
    ck("[R4] 切后是三题按推荐填入", len(st.answers or {}) == 3, st.answers)

    # ★ 提交是**下一步**，不能和「填满」同时断言。
    #
    # 我第一版在这里直接读 status，于是偶发失败：三题填满的那一刻 runner 还没
    # 走到 `_runner_submit`（它要先 bump/广播再下一轮循环）。这不是产品缺陷，
    # 是断言写早了一步 —— 判据必须对齐「后端 cursor 推进到末尾并提交」这个
    # 最终状态，而不是填答瞬间的快照。
    for _ in range(300):
        await asyncio.sleep(0.01)
        st = svc.get_survey(tag)
        if st is not None and st.status != "pending":
            break
    ck("[R5] 整卷自动提交", st.status == "submitted", st.status)
    ck("[R6] 填入的是推荐值「甲」而非慢模型的「乙」",
       all((a or {}).get("value") == "甲" for a in st.answers.values()),
       st.answers)
    cleanup(svc, tag)

    print("\n[R2] cancel_analysis：ai 在飞时手动停止 → 不能崩、要能重新起")
    aborted["v"] = False
    analysis.analyze_survey = slow
    tag2 = "fix2-cancel"
    pq2 = await svc.create(session_id="s", agent_id="a", title="t",
                           questions=[Q(0, "甲")], tool_call_id=tag2,
                           mode="ai", prefs={})
    svc.ensure_watchdog(tag2)
    svc._sync_runners(tag2)
    await asyncio.sleep(0.3)
    try:
        svc.apply_action(tag2, "cancel_analysis", {})
        ok = True
        err = ""
    except Exception as e:  # noqa: BLE001
        ok, err = False, f"{type(e).__name__}: {e}"
    ck("[R7] cancel_analysis 不抛异常", ok, err)
    await asyncio.sleep(0.4)
    st2 = svc.get_survey(tag2)
    ck("[R8] 取消后状态仍 pending（没被误提交）",
       st2.status == "pending", st2.status)
    ck("[R9] 取消后 ai 模式下已重新起 runner（会重试分析）",
       svc._runners().get(tag2) is not None,
       "取消不改变 mode，应重新分析而非永久停摆")
    cleanup(svc, tag2)


    print("\n[E] get_by_tool_call 必须优先返回**有活 Future** 的记录")
    # 真实缺陷（2026-11-07 实测）：插件 reload 把未完成记录恢复成 orphan，
    # 它与新建的同 tool_call_id 记录同时在 _pending 里。旧实现返回遍历到的
    # 第一条（可能是 orphan）→ runner 把答案提交给 orphan → submit_answer
    # 对 orphan 直接返回不 resolve → 问卷永远停在 pending。
    # 症状误导性极强：日志里 fill×3 + submit 都在，只有 status 不动。
    tag_orphan = "fix2-orphan"
    pq_real = await svc.create(session_id="s", agent_id="a", title="t",
                               questions=[Q(0, "甲")], tool_call_id=tag_orphan,
                               mode="manual", prefs={})
    # 伪造一条同 tool_call_id 的 orphan（排在有活记录之前，模拟最坏顺序）
    from question_service import PendingQuestion
    fake = PendingQuestion(request_id="orphan-req", session_id="s",
                           agent_id="a", title="t",
                           questions=[Q(0, "甲")],
                           tool_call_id=tag_orphan, created_at=0.0,
                           future=None)
    fake.orphan = True
    # 插到 dict 最前面（Python 3.7+ 保持插入顺序）
    svc._pending = {"orphan-req": fake, **svc._pending}
    got = await svc.get_by_tool_call(tag_orphan)
    ck("[E1] 返回有活 Future 的那条，而不是 orphan",
       got is not None and got is pq_real, 
       f"got={'orphan' if got is not None and getattr(got, 'orphan', False) else got}")
    ck("[E2] 返回的记录 request_id 正确",
       got is not None and got.request_id == pq_real.request_id,
       getattr(got, "request_id", None))
    svc._pending.pop("orphan-req", None)
    cleanup(svc, tag_orphan)

    print("\n[R3] ai 正常路径不能因 A 的改动而崩（回归）")
    calls = []

    async def fast(**kw):
        calls.append(kw.get("question_index"))
        return {"ok": True, "per_question": [
            {"index": kw.get("question_index"), "choice": "乙", "failed": False}]}

    analysis.analyze_survey = fast
    tag3 = "fix2-ai"
    pq3 = await svc.create(session_id="s", agent_id="a", title="t",
                           questions=[Q(0), Q(1), Q(2)], tool_call_id=tag3,
                           mode="ai", prefs={})
    svc.ensure_watchdog(tag3)
    svc._sync_runners(tag3)
    for _ in range(200):
        await asyncio.sleep(0.02)
        if pq3.future.done():
            break
    st3 = svc.get_survey(tag3)
    ck("[R10] ai 模式三题答完并提交",
       len(st3.answers or {}) == 3 and st3.status == "submitted",
       {"ans": len(st3.answers or {}), "st": st3.status})
    ck("[R11] 每题恰一次模型调用", len(calls) == 3, calls)
    cleanup(svc, tag3)

    analysis.analyze_survey = _orig


def main():
    static_checks()
    asyncio.run(runtime_checks())
    print(f"\n{'=' * 56}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
