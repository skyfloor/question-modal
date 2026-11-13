# -*- coding: utf-8 -*-
"""纯进程内单测（不连宿主、不起会话）：

验证本次修复的核心保证 —— **没有活 Future 的记录，绝不能被报成「成功」**。

背景（2026-10-13 现场）：卡片显示「✓ 已提交答案」，会话却永久 409。
后端 `plugin.py` 的 /answer、/skip 曾经忽略 `svc.submit_answer()` 的返回值，
只要记录存在就 `_remember_result("answered")` 并返回 ok:true ——
于是「answered_results 有记录 / 卡片显示成功 / agent 从未被放行」。

本测试直接构造三种「无活 Future」形态，断言：
  1) submit_answer / skip 一律返回 None（而不是假装成功）；
  2) 记录被摘除（不会残留成一条「已答」）；
  3) 有活 Future 的正常路径仍然 resolve，且 result 内容完整。
"""
import asyncio
import importlib.util
import pathlib
import sys

PLUGIN_DIR = pathlib.Path(__file__).resolve().parent


def _load_service():
    """按路径加载 question_service，避免与已安装插件互相污染。"""
    spec = importlib.util.spec_from_file_location(
        "_qm_svc_under_test", PLUGIN_DIR / "question_service.py",
    )
    mod = importlib.util.module_from_spec(spec)
    sys.modules["_qm_svc_under_test"] = mod
    spec.loader.exec_module(mod)
    return mod


SVC = _load_service()

failures: list[str] = []
checks = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global checks
    checks += 1
    if cond:
        print(f"  ✓ {name}")
    else:
        failures.append(name)
        print(f"  ✗ {name}" + (f"  → {detail}" if detail else ""))


async def main() -> int:
    svc = SVC.QuestionService.get_instance()

    print("\n[A] 正常路径：有活 Future → 必须 resolve，且 result 完整")
    svc._pending.clear()
    pq = await svc.create(
        session_id="s-ok", agent_id="a", tool_call_id="call_ok",
        questions=[{"type": "text", "title": "q"}],
    )
    check("create 后有活 Future 且非 orphan",
          pq.future is not None and not pq.orphan)
    got = await svc.submit_answer(
        pq.request_id, {"q0": {"type": "text", "value": "hi", "other": ""}},
        "补充", [{"file_name": "a.png", "size": 3}],
    )
    check("正常提交返回记录（不是 None）", got is not None, str(got))
    check("Future 已被 resolve", pq.future.done())
    res = pq.future.result()
    check("result 携带 answers", res.get("answers", {}).get("q0", {}).get("value") == "hi")
    check("result 携带末页 attachments（曾被丢过）", res.get("attachments") == [{"file_name": "a.png", "size": 3}])
    check("result 携带 other", res.get("other") == "补充")

    print("\n[B] orphan 形态（还原自磁盘）→ 必须返回 None，不许假装成功")
    svc._pending.clear()
    raw = [{
        "request_id": "11111111-2222-3333-4444-555555555555",
        "session_id": "s-orphan", "agent_id": "a", "tool_call_id": "call_orphan",
        "questions": [{"type": "text", "title": "q"}],
        # 必须是「刚创建」的时间：还原后会跑一次 GC，过老的 orphan 会当场被回收
        # （这也正是 GC 的设计意图），那样就测不到 submit_answer 的行为了。
        "created_at": __import__("time").time(),
    }]
    SVC._PENDING_FILE.write_text(__import__("json").dumps(raw), encoding="utf-8")
    svc._restore_from_disk()
    rid = "11111111-2222-3333-4444-555555555555"
    check("还原后标记为 orphan 且无 Future",
          svc._pending.get(rid) is not None
          and svc._pending[rid].orphan
          and svc._pending[rid].future is None)
    check("orphan 提交返回 None", await svc.submit_answer(rid, {}) is None)
    check("orphan 记录已被摘除（不残留假成功）", rid not in svc._pending)

    print("\n[C] 无 Future 且非 orphan（跨代共享 pending 表的形态）→ 返回 None")
    svc._pending.clear()
    pq2 = await svc.create(
        session_id="s-nf", agent_id="a", tool_call_id="call_nf", questions=[],
    )
    pq2.future = None                      # 模拟 Future 属于旧事件循环
    pq2.orphan = False
    check("前置：记录存在、非 orphan、无 Future",
          svc._pending.get(pq2.request_id) is not None
          and not pq2.orphan and pq2.future is None)
    check("无 Future 提交返回 None（不报 answered）",
          await svc.submit_answer(pq2.request_id, {}) is None)

    print("\n[D] 已 done 的 Future → 同样返回 None（没人还停在那儿）")
    svc._pending.clear()
    pq3 = await svc.create(
        session_id="s-done", agent_id="a", tool_call_id="call_done", questions=[],
    )
    pq3.future.set_result({"skipped": True})   # 已被别人先 resolve
    check("已 done 提交返回 None", await svc.submit_answer(pq3.request_id, {}) is None)

    print("\n[E] skip 侧同源保证")
    svc._pending.clear()
    pq4 = await svc.create(
        session_id="s-sk", agent_id="a", tool_call_id="call_sk", questions=[],
    )
    pq4.future = None
    check("无 Future 跳过返回 None（不报 skipped）", await svc.skip(pq4.request_id) is None)
    svc._pending.clear()
    pq5 = await svc.create(
        session_id="s-sk2", agent_id="a", tool_call_id="call_sk2", questions=[],
    )
    got5 = await svc.skip(pq5.request_id)
    check("正常跳过返回记录", got5 is not None)
    check("正常跳过 Future 带 skipped:true",
          pq5.future.done() and pq5.future.result().get("skipped") is True)

    svc._pending.clear()
    try:
        SVC._PENDING_FILE.unlink()
    except OSError:
        pass
    return 1 if failures else 0


if __name__ == "__main__":
    rc = asyncio.run(main())
    print(f"\n════════ 结果: {checks - len(failures)}/{checks} passed ════")
    if failures:
        print("失败项：" + ", ".join(failures))
    raise SystemExit(rc)
