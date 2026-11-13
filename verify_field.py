# -*- coding: utf-8 -*-
"""现场故障复现验证：问卷打开 → 附件框打开又关闭 → 提交。

关键观察点：不再出现「无法连接问卷服务」，且提交能成功、会话不被永久阻塞。
本脚本只做后端链路（前端行为由 harness 覆盖），确认：
  1. 问卷能正常创建
  2. 等待期间／提交后 pending 状态正确
  3. 提交后 agent 解除阻塞（SSE 正常结束）
  4. 会话随后可继续发消息（不再 409）
"""
import json
import queue
import threading
import sys
import time

import httpx

BASE = "http://127.0.0.1:8088"
H = {"Content-Type": "application/json", "X-Agent-Id": "wb74Jn"}
SESSION = f"field-repro-{int(time.time())}"

ok = True


def check(name, cond, extra=""):
    global ok
    if cond:
        print("  ✓", name)
    else:
        ok = False
        print("  ✗", name, extra)


def main() -> int:
    c = httpx.Client(timeout=90)
    payload = {
        "channel": "console", "user_id": "default", "session_id": SESSION,
        "message": ("请只调用一次 question_modal 工具向我提问，不要先做别的。"
                    "标题用“E2E 测试”，问题："
                    "1) 单选“你更喜欢哪个？”，选项 [苹果, 香蕉]；"
                    "2) 问答“说一句话”。"
                    "等我回答后，用一句话复述我选的答案。"),
    }

    # 必须并发：SSE 流本身是阻塞读取，直到问卷被回答才会继续。因此把流放在
    # 后台线程里消费，主线程轮询 pending —— 与 e2e_check.py 同一套做法。
    events: "queue.Queue" = queue.Queue()
    stream_done = threading.Event()

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
            stream_done.set()

    th = threading.Thread(target=consume, daemon=True)
    th.start()

    # 等 HTTP 状态 + 问卷出现
    rid = None
    status = None
    deadline = time.time() + 90
    while time.time() < deadline:
        try:
            k, v = events.get_nowait()
            if k == "status":
                status = v
        except queue.Empty:
            pass
        p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
        if p.get("count"):
            rid = p["items"][0]["request_id"]
            break
        if stream_done.is_set() and not rid:
            time.sleep(1)
            p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
            if p.get("count"):
                rid = p["items"][0]["request_id"]
            break
        time.sleep(1)

    check("发起真实对话（HTTP 200）", status == 200, f"HTTP {status}")
    check("问卷已创建并处于 pending", bool(rid), json.dumps(p)[:160])
    if not rid:
        return 1

    info = c.get(f"{BASE}/api/question-modal/resolve",
                 params={"request_id": rid}, headers=H).json()
    check("/resolve 回传 session_id + agent_id（前端据此带对参数）",
          bool(info.get("session_id")) and bool(info.get("agent_id")),
          json.dumps(info, ensure_ascii=False)[:220])

    # 模拟用户带附件提交（题内「其他」+ 末页）
    body = {
        "request_id": rid, "session_id": info.get("session_id") or SESSION,
        "answers": {"q0": {"type": "single", "value": "是", "other": "",
                           "attachments": [{"url": "/media/a.txt", "file_name": "a.txt", "size": 5}]}},
        "other": "现场复现：附件框打开又关闭",
        "attachments": [{"url": "/media/b.png", "file_name": "b.png", "size": 9}],
    }
    resp = c.post(f"{BASE}/api/question-modal/answer", json=body, headers=H)
    check("提交成功（HTTP 200 且非 orphan）",
          resp.status_code == 200 and resp.json().get("orphan") is False,
          f"HTTP {resp.status_code} {resp.text[:160]}")

    # 等流结束（agent 解除阻塞）
    check("agent 解除阻塞，SSE 流结束", stream_done.wait(timeout=120),
          "流未在 120s 内结束")

    # 会话可继续（不再 409）
    p2 = c.post(f"{BASE}/api/console/chat",
                json={"channel": "console", "user_id": "default", "session_id": SESSION,
                      "message": "ok", "reconnect": True}, headers=H)
    check("提交后会话不再被 409 阻塞", p2.status_code == 200,
          f"HTTP {p2.status_code} {p2.text[:160]}")

    # 无残留阻塞
    p3 = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    check("无遗留 pending（不阻塞后续会话）", p3.get("count") == 0, json.dumps(p3)[:160])

    print()
    print("════ 结果:", "PASS" if ok else "FAIL", "════")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
