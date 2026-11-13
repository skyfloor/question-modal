# -*- coding: utf-8 -*-
"""验证 [E]：shutdown hook 能否真正释放被阻塞的 Future。

不依赖宿主：直接把 QuestionService 拿来，建一个 pending，挂上真实
asyncio.Future，再调 release_all()，确认 Future 被解开且状态落盘。
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from question_service import QuestionService  # noqa: E402

ok = True


def check(name, cond, extra=""):
    global ok
    if cond:
        print("  ✓", name)
    else:
        ok = False
        print("  ✗", name, extra)


async def main():
    svc = QuestionService()

    # ① 创建一个真实阻塞的 pending（模拟 agent 正在等）
    pq = await svc.create(
        session_id="sess-release-test",
        agent_id="default",
        user_id="default",
        channel="console",
        title="测试释放",
        questions=[{"type": "single", "title": "继续?", "options": ["是", "否"]}],
        tool_call_id="call_release_test",
    )

    waiter = asyncio.ensure_future(_wait(pq.future))
    await asyncio.sleep(0.05)
    check("Future 处于等待中（模拟 agent 被阻塞）", not waiter.done())

    # ② 卸载释放
    released = await svc.release_all("plugin_unloaded")
    check("release_all 报告释放了 1 条", released == 1, f"got {released}")

    # ③ Future 真的被解开（阻塞的 agent 能继续）
    await asyncio.wait_for(waiter, timeout=2)
    check("被阻塞的等待者已被解开（会话不再 409）", waiter.done() and not waiter.cancelled())
    result = waiter.result()
    check("结果是 skipped 语义（不是错误）",
          isinstance(result, dict) and result.get("skipped") is True, repr(result))

    # ④ 记录保留了（卡片能据此收敛），状态为 skipped
    got = await svc.get_request(pq.request_id)
    check("记录仍保留供卡片收敛", got is not None)
    check("状态标记为 skipped", got is not None and got.status == "skipped",
          getattr(got, "status", None))

    # ⑤ 落盘
    p = Path(__file__).parent / "pending_questions.json"
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
        entry = [x for x in raw if x.get("request_id") == pq.request_id]
        check("状态已落盘（重载后可读）", len(entry) == 1 and entry[0]["status"] == "skipped",
              json.dumps(entry, ensure_ascii=False)[:200])
    except Exception as e:  # noqa: BLE001
        check("状态已落盘（重载后可读）", False, str(e))

    # ⑥ 幂等：再释放一次不应报错、也不重复计数
    again = await svc.release_all("plugin_unloaded")
    check("重复释放是安全的（幂等）", again == 0, f"got {again}")

    svc.forget(pq.request_id)
    print()
    print("════ 结果:", "PASS" if ok else "FAIL", "════")
    return 0 if ok else 1


async def _wait(fut):
    return await fut


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
