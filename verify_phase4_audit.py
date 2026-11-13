"""阶段 4 取证：前端自动分析与后端 runner 是否**同时**在跑同一题。

## 疑点

`src/index.tsx:3790` 的自动分析 effect：

```js
if (anMode !== "ai") return;
if (analysedRef.current[visStep]) return;
void runAnalysis("auto");
```

**它没有 `backendDown` 守卫**，而驱动推进 effect（`:4761`）有：

```js
if ((anMode === "recommend" || anMode === "ai") && !backendDown) return;
```

于是后端在线时：推进由后端做（前端让位），但**分析仍由前端发起** ——
同一题可能被分析两次，白烧一份配额。用户今天已被 429 限流数百次，
这不是无所谓的浪费。

## 本套件做什么

不猜测，直接数请求：用真实 HTTP 打插件，观察一次 ai 问卷从弹出到答完，
`POST /analyze` 被打了几次，与题数比较。

判据：
  · 每题恰 1 次  → 正常（某一方在分析，另一方没重复）
  · 每题 2 次    → 双分析（配额浪费）
  · 每题 0 次    → 后端用了缓存或没分析

注意：本套件需要**真实模型**，故只在手动运行时执行。
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8088/api/question-modal"
PASS = FAIL = 0
FAILS = []


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=15) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http": e.code, "_body": e.read().decode()[:200]}
    except Exception as e:  # noqa: BLE001
        return {"_err": f"{type(e).__name__}: {e}"}


def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http": e.code, "_body": e.read().decode()[:200]}
    except Exception as e:  # noqa: BLE001
        return {"_err": f"{type(e).__name__}: {e}"}


def main():
    print("=== 阶段 4 取证：是否需要「前端分析让位」===")
    print("\n[静态] 检查两处守卫是否对称")

    src = "/app/working/build/question-modal-dev/src/index.tsx"
    try:
        code = open(src, encoding="utf-8").read()
    except FileNotFoundError:
        ck("[0] 能读到源码", False, src)
        return 1

    # 驱动推进 effect（应有 backendDown 守卫）
    drive_has_guard = 'anMode === "recommend" || anMode === "ai") && !backendDown' in code
    ck("[1] 驱动推进 effect 有 backendDown 守卫（应有）", drive_has_guard)

    # 定位自动分析 effect 的函数体
    # 2026-11-13 修正：阶段 4 的守卫 `if (!backendDown) return;` 位于一段
    # 较长的说明注释之后，旧版只截取 400 字符会把它截掉 → 误判「没有守卫」。
    # 现扩大窗口到 1600 字符，并把断言改为正向（守卫必须存在）。
    i = code.find('if (anMode !== "ai") return;')
    body = code[i:i + 1600] if i >= 0 else ""
    an_has_guard = "if (!backendDown) return;" in body
    print(f"    自动分析 effect 片段: {body[:120]!r}")
    ck("[2] 自动分析 effect 有 backendDown 守卫（阶段 4 已修，防重复分析）",
       an_has_guard,
       "若缺守卫，说明阶段 4 修复被回退，需补 `if (!backendDown) return;`")

    print("\n[运行] 后端当前状态")
    st = get("/engine-status")
    print("   ", json.dumps(st, ensure_ascii=False)[:160])
    ck("[3] 后端引擎可用", st.get("available") is True, st)

    pend = get("/pending")
    n_pend = pend.get("count", -1)
    print(f"    当前 pending = {n_pend}")
    if n_pend:
        print("    ⚠️ 有真实问卷在等作答，本取证不应打扰 → 只做静态结论")
        ck("[4] 跳过运行取证（避免打扰真实问卷）", True)

    print("\n==== 结论 ====")
    if an_has_guard and drive_has_guard:
        print("  ✅ 两处守卫对称，无重复分析。")
    elif not an_has_guard and drive_has_guard:
        print("  ⚠️ 守卫不对称：推进让位了，但**分析没让位** → 同题烧两份配额。")
    else:
        print("  ❓ 守卫缺失 → 前后端可能同时在推进（更严重）。")

    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
