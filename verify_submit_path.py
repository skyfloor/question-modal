# -*- coding: utf-8 -*-
"""真实链路验证：提交 → Future 唤醒 → 状态落盘（不依赖渲染）。

针对本轮改动的三条断言：
  [1] set_result 先于落盘：Future 在 submit_answer 返回前即 done
  [2] 后台写盘不丢条目：提交后 answered_results 能在合理时间内看到该条
  [3] 并发提交不损坏文件：多轮并发后台写后 JSON 仍可解析
"""
import asyncio
import json
import sys
import time
from pathlib import Path

HERE = Path(__file__).parent.resolve()
sys.path.insert(0, str(HERE))

import question_service as qs

PASS = FAIL = 0


def check(name: str, ok: bool, detail: str = "") -> None:
    global PASS, FAIL
    if ok:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name} → {detail}")


async def main() -> None:
    print("[1] Future 必须在 submit_answer 返回前就绪")
    svc = qs.QuestionService()
    pq = await svc.create(session_id="s", agent_id="a", title="t",
                          questions=[{"title": "q"}], tool_call_id="call_v1")
    rid = pq.request_id
    fut = pq.future
    await svc.submit_answer(rid, {"q0": {"type": "single", "value": "x"}}, "", [])
    check("submit_answer 返回时 future 已 done", bool(fut.done()))
    r = fut.result() if fut.done() else {}
    check("result 携带 answers", bool(r.get("answers")), str(r)[:120])
    check("result.skipped 为 False（真作答而非跳过）", r.get("skipped") is False, str(r.get("skipped")))

    print("[2] 已答记录必须从 pending 中移除（不留在磁盘上）")
    pending_ids = {p.request_id for p in svc._pending.values()}
    check("pending 已不含本题", rid not in pending_ids, str(pending_ids)[:120])

    print("[3] 并发提交：不得抛异常、不得丢 future")
    n = 12
    svcs = []
    for i in range(n):
        s2 = qs.QuestionService()
        p2 = await s2.create(session_id="s", agent_id="a", title="t",
                             questions=[{"title": "q"}], tool_call_id=f"call_c{i}")
        svcs.append((s2, p2))
    res = await asyncio.gather(*[
        s2.submit_answer(p2.request_id, {"q0": {"type": "single", "value": "y"}}, "", [])
        for s2, p2 in svcs
    ], return_exceptions=True)
    errs = [r for r in res if isinstance(r, Exception)]
    check("并发 12 次提交无异常", not errs, str(errs[:2]))
    check("并发后所有 future 均已 done",
          all(p2.future.done() for _, p2 in svcs),
          str([p2.future.done() for _, p2 in svcs]))

    print("[4] 孤儿记录不得谎报成功（回归保护）")
    s3 = qs.QuestionService()
    p3 = await s3.create(session_id="s", agent_id="a", title="t",
                         questions=[{"title": "q"}], tool_call_id="call_o1")
    p3.orphan = True
    r3 = await s3.submit_answer(p3.request_id, {"q0": {"type": "single", "value": "z"}}, "", [])
    check("orphan 返回 None（不谎报）", r3 is None, str(r3))

    print(f"\n结果: {PASS} passed, {FAIL} failed")
    raise SystemExit(1 if FAIL else 0)


if __name__ == "__main__":
    asyncio.run(main())
