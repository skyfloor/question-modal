# -*- coding: utf-8 -*-
"""真实端到端复现：问卷阻塞期间热重载，然后点「释放本次问卷」。

步骤（全部走真实宿主链路，不 mock）：
  1. 安装修复版插件（触发零停机热重载，与用户现场一致）
  2. 触发一次真实问卷（agent 阻塞在旧实例的 Future 上）
  3. 确认旧实例被宿主「保留存活」（日志 Tasks are still active for old instance）
  4. 调 /skip —— 修复前必然 404（新实例看不到旧实例的 pending）
  5. 断言：修复后 /skip 命中并解开 Future，SSE 流结束、会话可继续
"""
import json
import queue
import subprocess
import threading
import time

import httpx

BASE = "http://127.0.0.1:8088"
H = {"Content-Type": "application/json", "X-Agent-Id": "default"}
AGENT = "default"


def sh(cmd: str) -> str:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout


def main() -> int:
    c = httpx.Client(timeout=180)
    sess = f"reload-e2e-{int(time.time())}"
    print(f"session = {sess}")

    # ── 1. 起流 + 触发问卷 ──
    events: "queue.Queue" = queue.Queue()
    done = threading.Event()

    def consume():
        try:
            with c.stream("POST", f"{BASE}/api/console/chat", json={
                "channel": "console", "user_id": "default", "session_id": sess,
                "message": ("请只调用一次 question_modal 工具向我提问，不要先做别的。"
                            "标题用“热重载测试”，问题：1) 单选“选一个？”，选项 [甲, 乙]。"),
            }, headers=H) as r:
                for line in r.iter_lines():
                    if line:
                        events.put(line)
        except Exception as e:  # noqa: BLE001
            events.put(f"ERR {e}")
        finally:
            done.set()

    threading.Thread(target=consume, daemon=True).start()

    rid = sid = None
    deadline = time.time() + 120
    while time.time() < deadline:
        p = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
        if p.get("count"):
            rid, sid = p["items"][0]["request_id"], p["items"][0]["session_id"]
            break
        if done.is_set():
            break
        time.sleep(1)
    if not rid:
        print("!! 未能触发问卷"); return 1
    print(f"[OK] 问卷已弹出 request={rid[:8]} session={sid}")

    # ── 2. 热重载：模拟用户现场（我在复测期间装了插件）──
    print("\n[热重载] 重新安装插件（触发零停机 reload）…")
    out = sh("curl -s -X POST http://127.0.0.1:8088/api/plugins/install "
             "-H 'Content-Type: application/json' -H 'X-Agent-Id: default' "
             "-d '{\"source\":\"/app/working/plugins/question-modal\",\"force\":true}'")
    print("  install ->", out[:200])
    time.sleep(3)

    # 等宿主报告旧实例仍被保留
    kept = False
    for _ in range(20):
        log = sh("grep -a 'Tasks are still active for old instance' "
                 "/app/working/qwenpaw.log | tail -1")
        if AGENT in log:
            kept = True
            print("  [证据] 宿主日志:", log.strip()[-90:])
            break
        time.sleep(2)
    print(f"  旧实例仍被保留存活: {kept}")

    # ── 3. 确认新实例的 pending 表状态 ──
    p2 = c.get(f"{BASE}/api/question-modal/pending", headers=H).json()
    print(f"  重载后 /pending count={p2.get('count')}（修复前这里必然是 0）")

    # ── 4. 关键断言：/skip 必须能解开阻塞 ──
    print("\n[释放] 调 /skip（= 用户点「释放本次问卷」）…")
    t0 = time.time()
    r = c.post(f"{BASE}/api/question-modal/skip",
               json={"request_id": rid, "session_id": sid}, headers=H)
    print(f"  /skip -> HTTP {r.status_code}  {r.text[:150]}")
    check_skip = r.status_code == 200 and r.json().get("ok")
    if check_skip and r.json().get("orphan"):
        print("  ⚠ 被判为 orphan（说明 state 未共享成功）")

    # 流是否结束 = agent 是否被唤醒
    ended = done.wait(timeout=90)
    print(f"[{time.time()-t0:.1f}s] SSE 流结束: {ended}")

    # ── 5. 会话能否继续 ──
    r2 = c.post(f"{BASE}/api/console/chat", json={
        "channel": "console", "user_id": "default", "session_id": sess,
        "message": "ok", "reconnect": True}, headers=H)
    print(f"  重连 HTTP: {r2.status_code}")

    print("\n=== 判定 ===")
    ok = check_skip and ended
    print(f"  /skip 命中并解开 Future : {check_skip}")
    print(f"  agent 被唤醒、流结束    : {ended}")
    print("  " + ("✓ 修复生效：热重载后释放可正常解锁会话" if ok
                  else "✗ 仍失败，需继续排查"))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
