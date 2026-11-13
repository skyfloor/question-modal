#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""question-modal 插件 — 运行时端到端验证脚本。

流程：
  1. POST /api/console/chat（真实宿主链路），提示模型调用 question_modal
  2. 轮询 /api/question-modal/pending 直到问卷出现
  3. POST /api/question-modal/answer 提交答案
  4. 读取 SSE 流直到结束，确认工具已解除阻塞并返回答案

同时通过后台线程观察 pending 状态，证明"未回答前 agent 一直阻塞"。
"""
import json
import queue
import sys
import threading
import time

import httpx

BASE = "http://127.0.0.1:8088"
AGENT_ID = "wb74Jn"
SESSION_ID = "askuser-e2e-002"
CHAT_ID = "askuser-e2e-002"

PROMPT = (
    "请只调用一次 question_modal 工具向我提问，不要先做别的。"
    "标题用“E2E 测试”，问题："
    "1) 单选“你更喜欢哪个？”，选项 [苹果, 香蕉]；"
    "2) 问答“说一句话”。"
    "等我回答后，用一句话复述我选的答案。"
)

H = {"Content-Type": "application/json", "X-Agent-Id": AGENT_ID}


def main() -> int:
    payload = {
        "channel": "console",
        "user_id": "default",
        "session_id": SESSION_ID,
        "sessionId": SESSION_ID,
        "chatId": CHAT_ID,
        "stream": True,
        # content 必须是「内容块列表」（宿主解析器按 list 迭代）
        "input": [
            {"role": "user", "content": [{"type": "text", "text": PROMPT}]},
        ],
    }

    print("① 发送真实请求 POST /api/console/chat ...")
    client = httpx.Client(timeout=None)

    # 用后台线程读流，主线程轮询 pending
    lines: "queue.Queue[str]" = queue.Queue()
    done = threading.Event()

    def reader():
        try:
            with client.stream("POST", f"{BASE}/api/console/chat",
                               json=payload, headers=H) as resp:
                print(f"   HTTP {resp.status_code}")
                for line in resp.iter_lines():
                    if line:
                        lines.put(line)
        except Exception as exc:  # noqa: BLE001
            lines.put(f"[reader error] {exc}")
        finally:
            done.set()

    t = threading.Thread(target=reader, daemon=True)
    t.start()

    # ── 轮询 pending ──
    request_id = None
    saw_question_events = []
    deadline = time.time() + 120
    while time.time() < deadline and request_id is None:
        time.sleep(1.0)
        try:
            r = client.get(f"{BASE}/api/question-modal/pending",
                           params={"session_id": SESSION_ID}, headers=H, timeout=10)
            data = r.json()
            for it in data.get("items", []):
                if it.get("status") == "pending":
                    request_id = it["request_id"]
                    print(f"② 问卷已弹出: {request_id[:8]} "
                          f"q={it['question_count']} title={it['title']!r}")
                    print("   问题清单:", json.dumps(it["questions"], ensure_ascii=False))
                    break
        except Exception as exc:  # noqa: BLE001
            print("   pending 轮询异常:", exc)
        if done.is_set() and request_id is None:
            break

    if request_id is None:
        print("❌ 未检测到 pending 问卷")
        while not lines.empty():
            print("  SSE:", lines.get()[:300])
        return 1

    # ── 阻塞验证：此刻仍在 pending，说明 agent 被挡住 ──
    print("③ 阻塞验证：回答前 agent 应仍在等待（sleep 5s 后再查）")
    time.sleep(5)
    r = client.get(f"{BASE}/api/question-modal/pending",
                   params={"session_id": SESSION_ID}, headers=H, timeout=10)
    still = [i for i in r.json().get("items", []) if i.get("status") == "pending"]
    print(f"   仍处于 pending: {len(still)} -> {'OK（阻塞中）' if still else '异常'}")
    print(f"   SSE 流是否已结束: {done.is_set()} (应为 False)")

    # ── 提交答案（含附件，验证「其他」项附件端到端回传）──
    print("④ 提交答案 POST /api/question-modal/answer（携带附件）...")
    body = {
        "request_id": request_id,
        "session_id": SESSION_ID,
        "answers": {
            "q0": {"type": "single", "value": "苹果", "other": ""},
            "q1": {"type": "text", "value": "这是端到端测试的回答", "other": "",
                   "attachments": [{"file_name": "e2e-附件A.pdf", "size": 2048}]},
        },
        "other": "无补充",
        "attachments": [{"file_name": "e2e-总览.png", "size": 1048576}],
    }
    resp = client.post(f"{BASE}/api/question-modal/answer", json=body, headers=H, timeout=20)
    print("   ->", resp.status_code, resp.text[:200])

    # ── 等流结束 ──
    print("⑤ 等待 SSE 流结束（最多 120s）...")
    if not done.wait(timeout=120):
        print("⚠️  流未在 120s 内结束")
    else:
        print("   ✓ 流已结束")

    texts = []
    while not lines.empty():
        texts.append(lines.get())

    # ── 结果判定 ──
    joined = "\n".join(texts)
    print("\n⑥ SSE 事件数:", len(texts))
    hit_answer = "苹果" in joined
    hit_q = "E2E" in joined or "测试" in joined
    # 附件必须出现在回传给模型的文本里（「其他」项附件 + 末页其他意见附件）
    hit_att = "e2e-附件A.pdf" in joined and "e2e-总览.png" in joined
    print(f"   question_modal 结果回传（含“苹果”）: {hit_answer}")
    print(f"   问卷摘要出现在流中: {hit_q}")
    print(f"   附件出现在回传文本中: {hit_att}")
    print("\n---- SSE 尾部 800 字符 ----")
    print(joined[-800:])

    ok = hit_answer and hit_att
    print("\n" + ("✅ 端到端验证通过" if ok else "❌ 端到端验证未通过"))
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
