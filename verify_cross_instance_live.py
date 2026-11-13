# -*- coding: utf-8 -*-
"""决定性实验：排除 shutdown hook 干扰，验证跨实例释放。

为什么需要它：force-reinstall 会先 unload 插件，shutdown hook 的 release_all()
会把当时的 pending 全部 resolve。若在 reload **之前**就弹好问卷，hook 会「顺手」
解开它，从而掩盖跨实例问题——上一个 e2e 就踩了这个坑。

因此本实验把时序倒过来，精确复刻用户现场：
  1. 起一个长 run（先 sleep 30）并触发真实热重载 —— **此刻 pending 为空**，
     hook 无事可做（用户现场 20:36 正是如此）。
  2. run 在 reload **之后**才调用 question_modal，于是问卷被创建在
     「仍被宿主保留存活的旧实例」上 (日志: Tasks are still active for old instance)。
  3. 从 HTTP 路由（新实例）观察与释放 —— 修复前必然 404，修复后必须命中。

断言：
  · reload 期间 pending 为空（证明本实验不受 hook 影响）
  · 问卷出现且是「新实例 HTTP 视角」可见的（共享 state 生效）
  · /skip 返回 orphan:false（命中的是活着的 Future，不是盘上副本）
  · SSE 流被解开、会话可继续
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
LOG = "/app/working/qwenpaw.log"


def sh(cmd: str) -> str:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout


def pending(sid_filter: str = ""):
    d = httpx.get(f"{BASE}/api/question-modal/pending", headers=H, timeout=30).json()
    items = d.get("items", [])
    if sid_filter:
        items = [i for i in items if i.get("session_id") == sid_filter]
    return items


def main() -> int:
    c = httpx.Client(timeout=200)
    fails = []

    def check(label, cond, extra=""):
        print(("  ✓ " if cond else "  ✗ ") + label + (f"  [{extra}]" if extra else ""))
        if not cond:
            fails.append(label)

    sess = f"cross-{int(time.time())}"
    print(f"session = {sess}\n")

    ev: "queue.Queue" = queue.Queue()
    closed = threading.Event()

    def consume():
        try:
            with c.stream("POST", f"{BASE}/api/console/chat", json={
                "channel": "console", "user_id": "default", "session_id": sess,
                "input": [{"role": "user", "content": [{"type": "text", "text":
                    "请严格按顺序做两件事：\n"
                    "第一步：用 execute_shell_command 执行 `sleep 30`（必须真的执行，等待 30 秒）。\n"
                    "第二步：sleep 结束后，**立即**调用一次 question_modal 工具向我提问，"
                    "标题用「跨实例现场复现」，只问 1 道单选「选一个？」，选项 [甲, 乙]。\n"
                    "不要做任何其他事，不要先解释。"}]}],
            }, headers=H) as r:
                for line in r.iter_lines():
                    if line:
                        ev.put(line)
        except Exception as e:  # noqa: BLE001
            ev.put(f"ERR {e}")
        finally:
            closed.set()

    threading.Thread(target=consume, daemon=True).start()

    # ── 等 run 真的起来（有事件流动），此时它正在 sleep 30 ──
    for _ in range(30):
        if ev.qsize() > 0:
            break
        time.sleep(1)
    print(f"run 已启动（事件数={ev.qsize()}），模型应在 sleep 30 中…")

    # ── 关键：在 pending 必然为空的窗口内热重载 ──
    before = pending()
    print(f"\n[热重载] reload 前 pending={len(before)}（必须为 0，才能排除 hook 干扰）")
    check("重载前 pending 为空（本实验不受 shutdown hook 影响）", len(before) == 0,
          f"count={len(before)}")

    t0 = time.time()
    log_mark = sh(f"wc -l < {LOG}").strip()
    sh("curl -s -X POST http://127.0.0.1:8088/api/plugins/install "
       "-H 'Content-Type: application/json' -H 'X-Agent-Id: default' "
       "-d '{\"source\":\"/app/working/plugins/question-modal\",\"force\":true}'")
    # 确认确实卸载了（即 hook 确实跑过，但当时无 pending 可释放）
    tail = sh(f"tail -n +{int(log_mark)+1} {LOG} 2>/dev/null | grep -a 'Unloaded plugin' | tail -1")
    print(f"  卸载证据: {tail.strip()[-70:] or '(未见)'}")
    check("reload 确实卸载了插件（hook 跑过但无 pending）", "Unloaded plugin" in tail)

    # ── 等问卷出现（它应创建于「保留存活的旧实例」，但走新实例的 HTTP 可见）──
    print("\n[等待] 旧实例上的 run 何时弹出问卷…")
    rid = None
    for i in range(75):
        time.sleep(2)
        mine = pending(sess)
        if mine:
            rid = mine[0]["request_id"]
            print(f"  ✅ t={time.time()-t0:.0f}s 问卷出现 request={rid[:8]} "
                  f"status={mine[0].get('status')}")
            break
        if closed.is_set():
            print("  ! 流已结束，未能弹问卷"); break
        if i % 8 == 7:
            kept = sh(f"grep -a 'Tasks are still active for old instance {AGENT}' {LOG} | tail -1")
            print(f"  t={time.time()-t0:.0f}s 仍无问卷 | 旧实例保留中={'是' if kept.strip() else '未观察'}")

    if not rid:
        print("\n✗ 未能构造出跨实例问卷，实验不成立")
        return 1

    check("问卷经新实例 HTTP 可见（共享 state 生效）", bool(rid))
    # 旧实例保留证据 —— 证明问卷确实诞生在旧实例上
    kept = sh(f"grep -a 'Tasks are still active for old instance {AGENT}' {LOG} | tail -1")
    check("宿主确实在保留旧实例（问卷诞生于旧实例 → 真·跨实例）",
          "Tasks are still active" in kept, kept.strip()[-60:])

    # ── 释放：HTTP 在新实例，Future 在旧实例 ──
    print("\n[释放] 从新实例的 HTTP 路由调 /skip …")
    rr = c.post(f"{BASE}/api/question-modal/skip",
                json={"request_id": rid, "session_id": sess}, headers=H)
    body = rr.json() if rr.status_code == 200 else {}
    print(f"  /skip -> HTTP {rr.status_code} {rr.text[:130]}")
    check("/skip 命中活 Future（orphan:false = 不是盘上副本）",
          rr.status_code == 200 and body.get("ok") and not body.get("orphan"),
          f"orphan={body.get('orphan')} http={rr.status_code}")

    t1 = time.time()
    ended = closed.wait(timeout=120)
    print(f"[{time.time()-t1:.1f}s] SSE 流结束（agent 被唤醒并收尾）: {ended}")
    check("agent 被唤醒、流结束", ended)

    r2 = c.post(f"{BASE}/api/console/chat", json={
        "channel": "console", "user_id": "default", "session_id": sess,
        "input": [{"role": "user", "content": [{"type": "text", "text": "ok"}]}],
        "reconnect": True}, headers=H)
    print(f"  重连 HTTP: {r2.status_code}")
    check("会话未被阻塞（非 409）", r2.status_code != 409)

    print()
    if fails:
        print(f"✗ 失败 {len(fails)}: {fails}")
        return 1
    print("✓ 决定性验证通过：问卷诞生于旧实例、由新实例 HTTP 释放成功（A 方案真实生效）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
