# -*- coding: utf-8 -*-
"""A/B 对照：set_result 在落盘之前 vs 之后（关键路径耗时）。

同一份 QuestionService，只切换 submit_answer 的执行顺序，用**真实规模的
answered_results（300 条 / ~170KB）**做落盘，量化前后差距。
"""
import asyncio
import importlib
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent.resolve()
sys.path.insert(0, str(HERE))


async def one(submit_impl, svc) -> float:
    pq = await svc.create(
        session_id="s", agent_id="a", title="t",
        questions=[{"title": "q1"}, {"title": "q2"}],
        tool_call_id="call_probe",
    )
    rid = pq.request_id
    t0 = time.perf_counter()
    await submit_impl(svc, rid)
    return (time.perf_counter() - t0) * 1000


async def submit_current(svc, rid):
    await svc.submit_answer(rid, {"q0": {"type": "single", "value": "x"}}, "", [])


async def submit_old_order(svc, rid):
    """复刻改前顺序：先 _persist_locked，再 set_result。"""
    async with svc._lock:
        pq = svc._pending.pop(rid, None)
        if pq is None:
            return
        pq.status = "answered"
        pq.resolved_at = time.time()
        svc._persist_locked()          # ← 改前：落盘在唤醒之前
        result = {"answers": {"q0": {"value": "x"}}, "other": "",
                  "attachments": [], "skipped": False}
        if pq.future and not pq.future.done():
            pq.future.set_result(result)


async def measure(label: str, impl) -> None:
    import question_service as qs
    importlib.reload(qs)
    times = []
    for _ in range(9):
        svc = qs.QuestionService()
        times.append(await one(impl, svc))
    times.sort()
    n = len(times)
    print(f"{label}: 中位 {times[n//2]:.2f} ms  最小 {times[0]:.2f}  最大 {times[-1]:.2f}")


async def main() -> None:
    ar = Path("answered_results.json")
    print(f"answered_results 规模: {ar.stat().st_size // 1024} KB")
    await measure("改前（落盘在 set_result 之前）", submit_old_order)
    await measure("改后（set_result 先行）      ", submit_current)


if __name__ == "__main__":
    asyncio.run(main())
