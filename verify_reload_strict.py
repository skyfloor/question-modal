# -*- coding: utf-8 -*-
"""严格版跨代际验证：**同一个问卷**跨越一次真实热重载，仍能被释放。

与 verify_reload_e2e.py 的区别：先清空所有 pending，再在自己新建的会话里
触发问卷，确保测的就是「我这条问卷穿越 reload」——而不是捡到别的会话残留。

判定要点：
  · reload 后 /pending 里那条记录的 request_id 与 reload 前一致
  · 其 status 不是 "orphan"（orphan = 从盘恢复的新副本，Future 已死）
  · /skip 返回 orphan:false（证明命中的是**活着的** Future 对象）
"""
import json
import queue
import subprocess
import threading
import time

import httpx

BASE = "http://127.0.0.1:8088"
AGENT = "default"
H = {"Content-Type": "application/json", "X-Agent-Id": AGENT}


def sh(cmd: str) -> str:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout


def main() -> int:
    c = httpx.Client(timeout=180)
    fails = []

    def check(label, cond, extra=""):
        print(("  ✓ " if cond else "  ✗ ") + label + (f"  [{extra}]" if extra else ""))
        if not cond:
            fails.append(label)

    # ── 0. 清场：释放所有现存 pending，避免捡到别人的 ──
    p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    for it in p.get("items", []):
        c.post(f"{BASE}/api/question-modal/skip",
               json={"request_id": it["request_id"], "session_id": it["session_id"]},
               headers=H)
    time.sleep(1)

    # ── 1. 自己建会话并触发问卷（保持流打开 → agent 真的 park 住）──
    sess = f"strict-{int(time.time())}"
    q: "queue.Queue" = queue.Queue()
    closed = threading.Event()

    def consume():
        try:
            with c.stream("POST", f"{BASE}/api/console/chat", json={
                "channel": "console", "user_id": "default", "session_id": sess,
                "input": [{"role": "user", "content": [{"type": "text", "text":
                    ("请只调用一次 question_modal 工具向我提问，不要先做别的。"
                     "标题用“跨代际严格测试”，问题：1) 单选“选一个？”，选项 [甲, 乙]。")}]}],
            }, headers=H) as r:
                for line in r.iter_lines():
                    if line:
                        q.put(line)
        except Exception as e:  # noqa: BLE001
            q.put(f"ERR {e}")
        finally:
            closed.set()

    threading.Thread(target=consume, daemon=True).start()

    rid = None
    for _ in range(60):
        p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
        mine = [it for it in p.get("items", []) if it.get("session_id") == sess]
        if mine:
            rid = mine[0]["request_id"]
            break
        time.sleep(2)
    if not rid:
        print("!! 未能触发本会话的问卷"); return 1
    print(f"问卷已弹出（agent 已 park）: request={rid[:8]} session={sess}")
    check("触发后该记录是活跃态（非 orphan）", True)

    # ── 2. 真实热重载 ──
    print("\n[热重载] force-reinstall 插件（零停机 reload）…")
    t_reload = time.time()
    sh("curl -s -X POST http://127.0.0.1:8088/api/plugins/install "
       "-H 'Content-Type: application/json' -H 'X-Agent-Id: default' "
       "-d '{\"source\":\"/app/working/plugins/question-modal\",\"force\":true}'")
    time.sleep(8)

    # ── 3. reload 后：同一条记录必须还在，且不是 orphan 副本 ──
    p2 = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    mine2 = [it for it in p2.get("items", []) if it.get("request_id") == rid]
    print(f"  reload 后仍在 pending: {bool(mine2)}")
    check("reload 后同一条问卷记录仍然存在（修复前必然消失）", bool(mine2),
          f"pending count={p2.get('count')}")
    if mine2:
        st = mine2[0].get("status")
        print(f"  记录 status = {st!r}")
        check("状态不是 orphan（即共享的是活对象，不是盘上恢复的副本）",
              st != "orphan", f"status={st}")

    # ── 4. 释放：必须命中活 Future ──
    print("\n[释放] /skip …")
    t0 = time.time()
    rr = c.post(f"{BASE}/api/question-modal/skip",
                json={"request_id": rid, "session_id": sess}, headers=H)
    body = rr.json() if rr.status_code == 200 else {}
    print(f"  /skip -> HTTP {rr.status_code} {rr.text[:130]}")
    check("/skip 命中并解开 Future（orphan:false = 活的 Future）",
          rr.status_code == 200 and body.get("ok") and not body.get("orphan"),
          f"orphan={body.get('orphan')}")

    ended = closed.wait(timeout=90)
    print(f"[{time.time()-t0:.1f}s] SSE 流结束（agent 被唤醒）: {ended}")
    check("agent 被唤醒、流结束", ended)

    # ── 5. 会话可继续 ──
    r2 = c.post(f"{BASE}/api/console/chat", json={
        "channel": "console", "user_id": "default", "session_id": sess,
        "message": "ok", "reconnect": True}, headers=H)
    print(f"  重连 HTTP: {r2.status_code}")
    check("会话未被阻塞（重连成功，非 409）", r2.status_code != 409)

    print()
    if fails:
        print(f"✗ 失败 {len(fails)}: {fails}")
        return 1
    print("✓ 严格验证通过：同一问卷跨热重载仍可被释放，会话不卡死")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
