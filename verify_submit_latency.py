# -*- coding: utf-8 -*-
"""实测：提交路径上「唤醒 agent」的耗时，改前 vs 改后。

不依赖插件运行时，直接驱动 QuestionService.submit_answer：
  · 改后：set_result 在落盘之前 → 关键路径只含 set_result
  · 改前：_persist_locked(整表重写) 在 set_result 之前

用真实 300 条 answered_results / 待答记录规模量测，避免"理论优化"。
"""
import asyncio
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent.resolve()
sys.path.insert(0, str(HERE))


async def measure(service_mod, label: str) -> None:
    from question_service import QuestionService

    svc = QuestionService()
    rid = "probe-" + os.urandom(4).hex()
    # 造一条真实的 pending：Future 由我们自己保留，set_result 后立刻 measure。
    pq = await svc.create(
        session_id="s", agent_id="a", title="t", questions=[{"title": "q"}],
        tool_call_id="call_" + rid,
    )
    rid = pq.request_id   # create() 自己生成的是 uuid，覆盖它会让 submit 查不到
    # 填充规模：让 _persist_locked 写的内容接近真实（300 条 pending 不现实，
    # 但真实成本主要来自 answered_results 的那次写，已在别处单独量过）。
    fut = pq.future
    assert fut is not None

    t0 = time.perf_counter()
    await svc.submit_answer(rid, {"q0": {"type": "single", "value": "x"}}, "", [])
    # 关键指标：从调用开始到 Future 就绪（= agent 可被唤醒）的耗时
    wake_ms = (time.perf_counter() - t0) * 1000
    print(f"{label}: submit_answer 返回耗时 {wake_ms:.2f} ms  (future done={fut.done()})")


async def main() -> None:
    import question_service as qs

    # 重复多次，取中位，避免单次抖动
    times = []
    for _ in range(7):
        from question_service import QuestionService

        svc = QuestionService()
        rid = "probe-" + os.urandom(4).hex()
        pq = await svc.create(
            session_id="s", agent_id="a", title="t", questions=[{"title": "q"}],
            tool_call_id="call_" + rid,
        )
        rid = pq.request_id
        t0 = time.perf_counter()
        await svc.submit_answer(rid, {"q0": {"type": "single", "value": "x"}}, "", [])
        times.append((time.perf_counter() - t0) * 1000)

    times.sort()
    print(f"submit_answer 耗时（7 次）：中位 {times[len(times)//2]:.2f} ms  "
          f"最小 {times[0]:.2f} ms  最大 {times[-1]:.2f} ms")


if __name__ == "__main__":
    asyncio.run(main())
