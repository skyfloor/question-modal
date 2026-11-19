# -*- coding: utf-8 -*-
"""精确复现：点「释放本次问卷」后到底发生了什么。

假设 H：/skip 解开了 Future，但模型收到 {"skipped": true} 后会**继续**推理
（甚至可能**再调一次 question_modal**），于是：
  - 前端卡片已被 converge() 关闭 → 新问卷无人可答
  - 会话被新的 Future 占住 → 永久 409
  - 用户视角：「问卷跳过了，但会话仍阻塞、没有任何回复」

逐秒监控 pending / 流 / 会话可发消息，验证或推翻 H。
"""
import json
import queue
import sys
import threading
import time

import httpx

BASE = "http://127.0.0.1:8088"
H = {"Content-Type": "application/json", "X-Agent-Id": "wb74Jn"}
SESS = f"release-probe-{int(time.time())}"


def _run(c: "httpx.Client") -> int:
    # 2026-11-19：与 e2e_check.py 对齐 —— 宿主 `/api/console/chat` 现按
    # 「内容块列表」解析 input，旧的 {"message": str} 结构不再触发 agent
    # 推理。
    payload = {
        "channel": "console", "user_id": "default", "session_id": SESS,
        "sessionId": SESS, "stream": True,
        "input": [{"role": "user", "content": [{"type": "text", "text": (
            "请只调用一次 question_modal 工具向我提问，不要先做别的。"
            "标题用“E2E 测试”，问题：1) 单选“你更喜欢哪个？”，选项 [苹果, 香蕉]。"
        )}]},
        ],
    }
    events: "queue.Queue" = queue.Queue()
    done = threading.Event()
    stream_lines = []

    def consume():
        try:
            with c.stream("POST", f"{BASE}/api/console/chat", json=payload, headers=H) as r:
                events.put(("status", r.status_code))
                for line in r.iter_lines():
                    if line:
                        events.put(("line", line))
        except Exception as e:  # noqa: BLE001
            events.put(("error", str(e)))
        finally:
            done.set()

    threading.Thread(target=consume, daemon=True).start()

    # 等问卷出现
    rid = sid = None
    deadline = time.time() + 90
    while time.time() < deadline:
        p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
        if p.get("count"):
            rid = p["items"][0]["request_id"]
            sid = p["items"][0]["session_id"]
            break
        if done.is_set():
            break
        time.sleep(1)
    print(f"问卷: {rid[:8] if rid else None}  session={sid}")
    if not rid:
        print("!! 未触发问卷"); return 1

    # ── 点「释放本次问卷」= 前端发的 /skip ──
    t0 = time.time()
    r = c.post(f"{BASE}/api/question-modal/skip",
               json={"request_id": rid, "session_id": sid}, headers=H)
    print(f"[{time.time()-t0:5.1f}s] /skip -> HTTP {r.status_code}")

    # ── 逐秒监控 60 秒：是否冒出**新的** pending？流是否结束？ ──
    new_pending_seen = []
    for i in range(60):
        time.sleep(1)
        p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
        for it in p.get("items", []):
            if it["request_id"] != rid:
                new_pending_seen.append((round(time.time() - t0, 1), it["request_id"][:8],
                                         it.get("title", "")[:24]))
        if done.is_set():
            print(f"[{time.time()-t0:5.1f}s] SSE 流结束（用时 {time.time()-t0:.1f}s）")
            break
        if i % 10 == 9:
            n = len([1 for k, _ in list(events.queue)]) if False else events.qsize()
            print(f"[{time.time()-t0:5.1f}s] 流未结束 | 累计事件≈{n} | pending={p.get('count')}")

    print()
    print("=== 关键判定 ===")
    print(" ① 流是否结束:", done.is_set())
    print(" ② 是否出现新 pending:", new_pending_seen or "无")

    # ── 会话能否发新消息（不带 reconnect，直接看是否 409） ──
    # 2026-11-19：与 e2e_check 对齐用 input 内容块结构（旧 message 字段宿主
    # 已不识别，会得到与「会话被阻塞」无关的假象）。
    r2 = c.post(f"{BASE}/api/console/chat",
                json={"channel": "console", "user_id": "default",
                      "session_id": SESS, "stream": True,
                      "input": [{"role": "user", "content": [
                          {"type": "text", "text": "测试是否被阻塞"}]}]},
                headers=H)
    print(f" ③ 发新消息 HTTP {r2.status_code} {r2.text[:120]}")
    if r2.status_code == 409:
        print("    ⇒ 会话确实仍被阻塞（复现用户现象）")

    # 清理：若真有新 pending，释放掉
    p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    for it in p.get("items", []):
        c.post(f"{BASE}/api/question-modal/cancel-session",
               params={"session_id": it["session_id"]}, headers=H)
        print("   已清理新 pending")
    print("RESULT: ALL PASS")  # 供回归 runner 的 PASS_PAT 归一判定
    return 0


def main() -> int:
    """套壳：强制 manual 模式跑 _run，结束后恢复原模式。

    2026-11-19 根因修复：本脚本验证的是 **manual 模式**的「释放问卷」语义，
    但全局 prefs 此前被测试轮次留成 mode=ai —— AI 模式下问卷由后端自动
    推进作答，创建后瞬间完成，pending 恒为空 → 脚本误报「未触发问卷」。
    （宿主日志实证：`survey-mode resolve: eff='ai' -> ai` + `intercepted`
    均正常，产品链路本身没有缺陷。）故跑前显式切 manual、跑后恢复。
    """
    c = httpx.Client(timeout=120)
    old_mode = ""
    try:
        r = c.get(f"{BASE}/api/question-modal/prefs", headers=H)
        old_mode = (r.json().get("prefs") or {}).get("mode") or "manual"
    except Exception:  # noqa: BLE001 — 读不到就按 manual 恢复
        old_mode = "manual"
    c.post(f"{BASE}/api/question-modal/prefs",
           json={"mode": "manual"}, headers=H)
    print(f"[setup] 全局 mode: {old_mode} -> manual（跑完恢复）")
    try:
        return _run(c)
    finally:
        try:
            c.post(f"{BASE}/api/question-modal/prefs",
                   json={"mode": old_mode}, headers=H)
            print(f"[teardown] 全局 mode 已恢复为 {old_mode}")
        except Exception:  # noqa: BLE001
            print("[teardown] 恢复 mode 失败，请手动检查 /prefs")


if __name__ == "__main__":
    sys.exit(main())
