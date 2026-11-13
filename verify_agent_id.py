# -*- coding: utf-8 -*-
"""验证 /resolve 新增的 agent_id 字段（v1.3.3 关键改动）。

前端无宿主 API 可拿 session/agent，改由 /resolve 回传并缓存 —— 这是
「提交/释放带不上 X-Agent-Id 和 session_id」的根治手段，必须实测。
"""
import sys

import httpx

BASE = "http://127.0.0.1:8088"
H = {"Content-Type": "application/json", "X-Agent-Id": "default"}
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
    p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    if not p.get("count"):
        print("当前无 pending；用上一次提交过的 tool_call_id 反查")
        # 从 answered_results 找最近一条的 tool_call_id
        import json
        from pathlib import Path
        f = Path("/app/working/plugins/question-modal/answered_results.json")
        d = json.loads(f.read_text(encoding="utf-8"))
        keys = sorted(d, key=lambda k: d[k].get("at", 0))
        if not keys:
            print("  ✗ 无任何记录可供反查"); return 1
        tcid = keys[-1]
        r = c.get(f"{BASE}/api/question-modal/resolve",
                  params={"tool_call_id": tcid}, headers=H).json()
        print("  （该记录已提交，resolve 应为 found:false）:", json.dumps(r)[:120])
        res = c.get(f"{BASE}/api/question-modal/result",
                    params={"tool_call_id": tcid}, headers=H).json()
        check("/result 能取回已提交记录（历史卡片可恢复）", res.get("found") is True,
              json.dumps(res, ensure_ascii=False)[:200])
        print()
        print("════ 结果:", "PASS" if ok else "FAIL", "════")
        return 0 if ok else 1

    item = p["items"][0]
    rid = item["request_id"]
    r = c.get(f"{BASE}/api/question-modal/resolve",
              params={"request_id": rid}, headers=H).json()
    print("  /resolve 响应:", json.dumps(r, ensure_ascii=False)[:300])
    check("/resolve 回传 agent_id（前端补 X-Agent-Id 的唯一来源）", "agent_id" in r)
    check("agent_id 非空", bool(r.get("agent_id")), repr(r.get("agent_id")))
    check("/resolve 回传 session_id", bool(r.get("session_id")))
    check("/resolve 回传 tool_call_id", bool(r.get("tool_call_id")))
    # 清理，避免留下未答问卷
    c.post(f"{BASE}/api/question-modal/cancel-session",
           params={"session_id": r.get("session_id", "")}, headers=H)
    print()
    print("════ 结果:", "PASS" if ok else "FAIL", "════")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
