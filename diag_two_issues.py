"""诊断两个用户报的问题（只诊断，不改代码）。

## 问题 1：只用推荐，最后一题能跳过，但跳过前停住 2-3 秒

现象：末题（无推荐）该「立即跳过」，实际要先卡 2-3 秒。

候选原因：
  a) 后端 runner 每步 `asyncio.sleep(0)` 不该有秒级延迟 → 若是后端，不符
  b) 前端驱动路径（backendDown 降级）可能有 effect 链延迟
  c) `_persist_surveys()` 每步写盘（含 json 序列化 + fsync）在题多时可累积
  d) SSE 广播 + 前端重渲染往返

本套件用**时间戳**测后端 runner 每一跳的间隔，直接看延迟出现在哪。

## 问题 2：ai 分析中手动「停止分析」→ 切「只用推荐」→ 问卷不自动处理

候选原因（重点）：
  `_sync_runners` → `ensure_runner` 里：
      cur = table.get(tool_call_id)
      if cur is not None and not cur.done():
          return            # ← 旧 runner 还在，直接不启动
  而「停止分析」取消的是**前端那次** `/analyze`；
  后端 runner 自己 `await analyze_survey(...)` 的那次调用**没有被告知**。
  于是切 recommend 后：旧 runner 仍 park 在慢模型调用上 → 看起来「不自动开始」。

本套件直接钉死这条：慢模型在飞 → set_mode(recommend) → 观察
  ① 是否立即开始按推荐推进（不等慢模型跑完）
  ② 旧 runner task 是否被复用/重启
"""
import asyncio
import os
import sys
import tempfile
import time

os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    os.path.join(tempfile.gettempdir(), "qm_diag_two.json"),
)

sys.path.insert(0, "/app/working/plugins/question-modal")
import question_service as qs  # noqa: E402
import analysis  # noqa: E402
import recommend as rec  # noqa: E402

_orig = analysis.analyze_survey


def cleanup(svc, tag):
    svc.stop_runner(tag)
    svc.stop_watchdog(tag)
    svc._surveys().pop(tag, None)
    svc._persist_surveys()


Q = lambda i, rec_opt=None: (
    {"type": "single", "title": f"Q{i}", "options": ["甲", "乙"],
     **({"recommended": rec_opt} if rec_opt else {})}
)


async def diag_problem1():
    """问题1：只用推荐 + 末题无推荐，量每步间隔。"""
    print("=" * 60)
    print("问题 1：recommend 模式，5 题（末题无推荐）逐跳耗时")
    print("=" * 60)

    svc = qs.get_question_service()
    tag = "diag1"
    # 前 4 题有推荐、末题无推荐 → 触发「跳过」
    qs5 = [Q(i, "甲") for i in range(4)] + [Q(4, None)]
    pq = await svc.create(session_id="s", agent_id="a", title="t",
                          questions=qs5, tool_call_id=tag,
                          mode="recommend", prefs={})
    svc.ensure_watchdog(tag)

    marks = []
    t0 = time.time()
    svc._sync_runners(tag)
    last_ans = 0
    last_cursor = 0
    for _ in range(300):
        await asyncio.sleep(0.01)
        st = svc.get_survey(tag)
        if st is None:
            break
        a, c = len(st.answers or {}), st.cursor
        if a != last_ans or c != last_cursor:
            marks.append((round(time.time() - t0, 3), a, c,
                          list((st.answers or {}).keys())[-1:]))
            last_ans, last_cursor = a, c
        if st.status != "pending":
            break

    st = svc.get_survey(tag)
    total = time.time() - t0
    print(f"  总耗时 {total:.3f}s  status={st.status} by={st.submitted_by}")
    print("  每步时间戳（秒, 答案数, cursor, 最新键）:")
    prev = 0.0
    for m in marks:
        print(f"    +{m[0]:>6.3f}s (Δ{m[0]-prev:>5.3f}) ans={m[1]} cur={m[2]} {m[3]}")
        prev = m[0]
    print(f"  末题答案: {(st.answers or {}).get('q4')}")

    gaps = [marks[i][0] - marks[i - 1][0] for i in range(1, len(marks))]
    if gaps:
        print(f"  最大单步间隔 = {max(gaps):.3f}s")
    cleanup(svc, tag)
    return total, max(gaps) if gaps else 0.0


async def diag_problem2():
    """问题2：ai 慢分析在飞时切 recommend，看是否立即推进。"""
    print()
    print("=" * 60)
    print("问题 2：ai 分析在飞 → 切 recommend → 是否立即推进")
    print("=" * 60)

    started = {"t": 0.0}
    aborted = {"v": False}

    async def slow(**kw):
        started["t"] = time.time()
        try:
            await asyncio.sleep(8.0)          # 模拟慢模型
            return {"ok": True, "per_question": [
                {"index": kw.get("question_index"), "choice": "乙",
                 "failed": False}]}
        except asyncio.CancelledError:
            aborted["v"] = True
            raise

    analysis.analyze_survey = slow

    svc = qs.get_question_service()
    tag = "diag2"
    qs3 = [Q(0, "甲"), Q(1, "甲"), Q(2, "甲")]   # 都有推荐 → 切 recommend 应立即推进
    pq = await svc.create(session_id="s", agent_id="a", title="t",
                          questions=qs3, tool_call_id=tag,
                          mode="ai", prefs={})
    svc.ensure_watchdog(tag)
    svc._sync_runners(tag)
    await asyncio.sleep(0.3)                   # 让慢分析真的在飞

    print(f"  ai 分析已开始: {started['t'] > 0}")
    st_before = svc.get_survey(tag)
    print(f"  切之前: mode={st_before.mode} ans={len(st_before.answers or {})} "
          f"cursor={st_before.cursor}")
    task_before = svc._runners().get(tag)
    print(f"  runner task 存在且未完成: "
          f"{task_before is not None and not task_before.done()}")

    # 用户点「停止分析」 → 切「只用推荐」
    t_switch = time.time()
    svc.apply_action(tag, "set_mode", {"mode": "recommend"})

    # 观察 3 秒内是否开始按推荐推进（推荐是即时的，不该等 8 秒的慢模型）
    progressed_at = None
    for _ in range(300):
        await asyncio.sleep(0.01)
        st = svc.get_survey(tag)
        if st and (st.answers or {}):
            progressed_at = time.time() - t_switch
            break

    st = svc.get_survey(tag)
    task_after = svc._runners().get(tag)
    print(f"  切之后 3s 内答案数 = {len(st.answers or {})} "
          f"(cursor={st.cursor})")
    print(f"  开始推进的耗时: "
          f"{'未在 3 秒内推进' if progressed_at is None else f'{progressed_at:.3f}s'}")
    print(f"  慢分析是否被中断: {aborted['v']}")
    print(f"  runner task 仍是同一个: {task_after is task_before}")
    print(f"  runner task 状态: "
          f"{'未完成' if task_after and not task_after.done() else '已完成/无'}")

    # 再等一会看最终能不能走完
    for _ in range(600):
        await asyncio.sleep(0.01)
        st = svc.get_survey(tag)
        if st and st.status != "pending":
            break
    st = svc.get_survey(tag)
    print(f"  最终: status={st.status} ans={len(st.answers or {})} "
          f"(总耗时 {time.time()-t_switch:.1f}s)")
    print(f"  答案内容: {list((st.answers or {}).values())}")

    verdict_ok = progressed_at is not None and progressed_at < 1.0
    print()
    if verdict_ok:
        print("  ✅ 切 recommend 后立即推进（问题 2 在服务层未复现）")
    else:
        print("  ❌ **复现问题 2**：切 recommend 后没有立即推进 ——")
        print("     旧 runner 仍 park 在 ai 慢分析上，ensure_runner 因"
              " `not done()` 直接 return。")

    cleanup(svc, tag)
    return verdict_ok


async def main():
    total, maxgap = await diag_problem1()
    ok2 = await diag_problem2()
    analysis.analyze_survey = _orig

    print()
    print("=" * 60)
    print("结论摘要")
    print("=" * 60)
    print(f"  问题1 recommend 全程 {total:.3f}s，最大单步间隔 {maxgap:.3f}s")
    if maxgap >= 1.0:
        print("        → 确有秒级停顿，需定位来源（见上面时间戳）")
    else:
        print("        → 后端 runner 无秒级停顿；若用户体感 2-3s，"
              "延迟可能在前端渲染/SSE 往返")
    print(f"  问题2 切 recommend 立即推进: {ok2}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
