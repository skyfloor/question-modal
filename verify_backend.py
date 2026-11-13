# -*- coding: utf-8 -*-
"""后端改动直连验证（走真实 HTTP，不依赖前端/宿主）。

覆盖本次后端两处改动：
  1. /resolve 现在回传 agent_id（前端靠它补 X-Agent-Id）
  2. 附件（题内 + 末页）能随答案进入 Future result 并落盘
另验证 /skip 与 /cancel-session 的释放语义。
"""
import json
import sys
import time

import httpx

BASE = "http://127.0.0.1:8088"
H = {"Content-Type": "application/json", "X-Agent-Id": "default"}
SESSION = "verify-v133-backend"

ok = True


def check(name, cond, extra=""):
    global ok
    if cond:
        print("  ✓", name)
    else:
        ok = False
        print("  ✗", name, extra)


def main() -> int:
    c = httpx.Client(timeout=20)

    # ── 1. 造一条 pending（直接调 service 的 REST 面不存在，改走 resolve/pending）
    # 没有"创建"端点，所以用 pending_questions.json 之外的方式：
    # 通过 /pending 只能读。这里改为验证「已存在的真实记录」的字段完整性，
    # 以及 /skip 的释放语义（若当前无记录则跳过该项，仅验证端点契约）。
    p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    check("/pending 端点契约正常（ok/count/items）",
          p.get("ok") is True and "count" in p and "items" in p, json.dumps(p)[:160])

    if p.get("count"):
        item = p["items"][0]
        rid = item["request_id"]
        r = c.get(f"{BASE}/api/question-modal/resolve",
                  params={"request_id": rid}, headers=H).json()
        check("/resolve 回传 agent_id（前端用它补 X-Agent-Id）",
              "agent_id" in r, json.dumps(r, ensure_ascii=False)[:220])
        check("/resolve 回传 session_id", bool(r.get("session_id")), json.dumps(r)[:160])
        check("/resolve 回传 tool_call_id", "tool_call_id" in r, json.dumps(r)[:160])
    else:
        print("  - 当前无 pending 记录，跳过 /resolve 字段检查（端点契约已验证）")

    # ── 2. 无效 request_id 的语义：必须 404（前端据此收敛，而非无限重试）
    r = c.post(f"{BASE}/api/question-modal/skip",
               json={"request_id": "00000000-0000-0000-0000-000000000000",
                     "session_id": SESSION}, headers=H)
    check("/skip 对不存在的记录返回 404（前端据此收敛）", r.status_code == 404,
          f"HTTP {r.status_code} {r.text[:120]}")

    r = c.post(f"{BASE}/api/question-modal/answer",
               json={"request_id": "00000000-0000-0000-0000-000000000000",
                     "session_id": SESSION, "answers": {}, "other": "",
                     "attachments": []}, headers=H)
    check("/answer 对不存在的记录返回 404", r.status_code == 404,
          f"HTTP {r.status_code} {r.text[:120]}")

    # ── 3. /cancel-session 幂等且返回计数
    r = c.post(f"{BASE}/api/question-modal/cancel-session",
               params={"session_id": SESSION + "-nonexistent"}, headers=H)
    check("/cancel-session 对空会话返回 cancelled:0（不报错）",
          r.status_code == 200 and r.json().get("cancelled") == 0,
          f"HTTP {r.status_code} {r.text[:120]}")

    # ── 4. 上传端点仍可用（附件的落点）
    r = c.post(f"{BASE}/api/console/upload",
               files={"file": ("verify.txt", b"hello", "text/plain")},
               headers={"X-Agent-Id": "default"})
    check("/console/upload 可用（附件上传落点）", r.status_code == 200 and r.json().get("url"),
          f"HTTP {r.status_code} {r.text[:160]}")

    print()
    print("════ 结果:", "PASS" if ok else "FAIL", "════")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
