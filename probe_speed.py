"""问题 1 取证：recommend 模式末题跳过前的 2-3 秒停在哪里。

## 用户现象

「在只用推荐时，最后一题的能跳过，但是跳过前会停住 2-3 秒」

## 已知

- 后端 runner 实测 **0.011s** 跑完 5 题、最大单步间隔 0.000s → 后端不是瓶颈
- 写盘 3.1ms/次 → 不是瓶颈
- 可疑：末页自动提交要等 `reqId` 就绪，轮询是 `setTimeout(tick, tries<8 ? 700 : 5000)`

## 本脚本怎么测（不依赖任何浏览器 console）

用真实 Chromium 加载**线上 served bundle**，挂载问卷卡，然后在页面内
记录 `performance.getEntriesByType('resource')` 的请求时间线 —— 这是浏览器
自己产生的数据，我用 playwright 直接读，用户无需打开任何开发者工具。

测点：
  · 每道题「填答→翻页」之间的间隔
  · 从进入末页到发出 `/answer` 提交的间隔（= 用户体感的「停住」）
  · 期间发出了哪些请求、各耗时多少
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SESSION = "1791724819571-muuetab"



def _prune_test_state(prefix: str) -> None:
    """清掉本探针通过 HTTP 写进生产插件内存表的 state。

    ★ 必须走 `/survey-prune` 端点：`_surveys()` 是跨 reload 存活的内存表，
    直接改 json 文件无效（内存会原样写回）。见 verify_test_isolation.py。
    """
    import urllib.request
    try:
        body = json.dumps({"prefix": prefix}).encode()
        req = urllib.request.Request(
            BASE + "/api/question-modal/survey-prune", data=body, method="POST",
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode())
        print(f"  已清理测试 state({prefix}): {d.get('before')} -> {d.get('after')}")
    except Exception as e:  # noqa: BLE001
        print(f"  (清理失败，请手动调 /survey-prune: {e})")

def build_card_html(tool_call_id: str, questions: list) -> str:
    """最小宿主桩 + 真实 served bundle（与真实前端同一条加载路径）。"""
    tpl = """<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="root"></div>
<script>
window.__LOG = [];
window.QwenPaw = { host: {
  React: null, antd: null,
  getApiUrl: () => "__BASE__",
  getApiToken: () => __TOKEN__,
  getSelectedAgentId: () => "wb74Jn",
  getCurrentSessionId: () => "__SESSION__",
  useCurrentSession: () => ({ id: "__SESSION__" }),
  addPrefix: (id, el, opt) => { window.__RENDERED = { id, el, opt }; return true; },
  toast: (m) => window.__LOG.push(["toast", m]),
  useMessage: () => ({ success: (m)=>window.__LOG.push(["msg",m]),
                       error: (m)=>window.__LOG.push(["err",m]),
                       warning: (m)=>window.__LOG.push(["warn",m]) }),
} };
</script>
<script type="module">
// 真实 vendor：bundle 从 window.QwenPaw.host 读 React/antd，
// 缺了它们 addPrefix 永远不会被调用（实测：加载成功但不挂载）。
// 用宿主自己 served 的 vendor，保证与线上是同一份。
async function loadInline(id, global) {
  const txt = document.getElementById(id).textContent;
  const blob = new Blob([txt], { type: "application/javascript" });
  const m = await import(URL.createObjectURL(blob));
  window.__VENDOR = window.__VENDOR || {};
  window.__VENDOR[global] = m;
  return m;
}
try {
  const R = await loadInline("react-vendor", "react");
  const U = await loadInline("ui-vendor", "antd");
  window.QwenPaw.host.React = R.default || R;
  window.QwenPaw.host.antd = U.default || U;
  window.__VENDOR_OK = true;
} catch (e) { window.__VENDOR_ERR = String(e); }
</script>
<script id="react-vendor" type="text/plain">__REACT__</script>
<script id="ui-vendor" type="text/plain">__UI__</script>
<script id="qm-bundle" type="text/plain">__BUNDLE__</script>
<script type="module">
// 真实 bundle：blob import（与宿主同一条加载路径）。
// 内联而非 fetch —— 页面用 file:// 打开时跨域 fetch 会被拦（实测 Failed to fetch）。
const txt = document.getElementById("qm-bundle").textContent;
const blob = new Blob([txt], { type: "application/javascript" });
try {
  await import(URL.createObjectURL(blob));
  window.__LOADED = true;
} catch (e) {
  window.__LOAD_ERR = String(e);
}
</script>
</body></html>"""
    # ⚠️ 不能用 `%` 格式化：bundle 正文里含大量 `%` 会炸
    # （实测 TypeError: not all arguments converted）。
    tpl = tpl.replace("__BASE__", BASE)
    tpl = tpl.replace("__TOKEN__", json.dumps(os.environ.get("QM_TOKEN", "test-token")))
    tpl = tpl.replace("__SESSION__", SESSION)
    return tpl


def main():
    tool_call_id = "fix2speed-%d" % int(time.time())
    questions = [{"type": "single", "title": f"Q{i}", "options": ["甲", "乙"],
                  **({"recommended": "甲"} if i < 2 else {})} for i in range(3)]
    # 末题(local idx 2) 无推荐 → 触发「跳过」

    print("=" * 62)
    print("问题 1 取证：recommend 模式末题「跳过」前的停顿时长")
    print("=" * 62)
    print(f"  问卷: 3 题（前 2 题带推荐，末题无推荐 → 会跳过）")
    print(f"  tool_call_id = {tool_call_id}")

    # 先用后端建一个真实 state，让卡片能水合
    import urllib.request
    body = json.dumps({
        "tool_call_id": tool_call_id, "action": "goto", "payload": {"cursor": 0},
    }).encode()
    req = urllib.request.Request(
        BASE + "/api/question-modal/survey-action", data=body, method="POST",
        headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:  # noqa: BLE001
        print(f"  (建 state 失败，继续: {e})")

    html = build_card_html(tool_call_id, questions)
    # 全部用 replace 注入（bundle/vendor 含大量 % 与 $，不能用格式化）
    for slot, path in (("__REACT__", "/tmp/react-vendor.js"),
                       ("__UI__", "/tmp/ui-vendor.js"),
                       ("__BUNDLE__", "/tmp/bundle.js")):
        html = html.replace(slot, open(path, encoding="utf-8").read())
    tmp = "/tmp/_speed_probe.html"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(html)

    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--no-sandbox"])
        pg = b.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("file://" + tmp)
        pg.wait_for_timeout(2500)

        loaded = pg.evaluate("() => !!window.__LOADED")
        load_err = pg.evaluate("() => window.__LOAD_ERR || ''")
        rendered = pg.evaluate("() => !!window.__RENDERED")
        vendor_ok = pg.evaluate("() => !!window.__VENDOR_OK")
        vendor_err = pg.evaluate("() => window.__VENDOR_ERR || ''")
        print(f"\n  vendor 加载={vendor_ok} bundle 加载={loaded} 渲染挂载={rendered}")
        if vendor_err:
            print(f"  vendor 错误: {vendor_err[:200]}")
        if load_err:
            print(f"  加载错误: {load_err[:200]}")
        if errs:
            print(f"  页面错误({len(errs)}): {errs[:2]}")

        # 关键：读浏览器自己的 resource timing（无需 DevTools）
        entries = pg.evaluate("""() => performance.getEntriesByType('resource')
            .filter(e => e.name.includes('/api/question-modal/'))
            .map(e => ({u: e.name.split('/api/question-modal/')[1],
                        t: Math.round(e.startTime),
                        d: Math.round(e.duration)}))""")
        print(f"\n  问卷相关请求 {len(entries)} 条：")
        for e in entries[:24]:
            print(f"    +{e['t']:>6}ms ({e['d']:>4}ms) {e['u'][:52]}")

        # 观察推进时间线
        snaps = []
        for _ in range(28):
            pg.wait_for_timeout(120)
            s = pg.evaluate("""() => {
                const t = document.body.innerText || '';
                const m = t.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
                return m ? m[0] : '';
            }""")
            if s and (not snaps or snaps[-1][1] != s):
                snaps.append((len(entries), s))
        print(f"\n  进度快照变化: {snaps[:12]}")

        b.close()

    os.remove(tmp)
    print()
    print("=" * 62)
    print("判读")
    print("=" * 62)
    if not loaded:
        print("  ⚠️ bundle 未加载，本测量无效（宿主桩不足）。结论：暂无可信数据。")
    elif len(entries) < 3:
        print("  ⚠️ 请求过少，卡片可能未完成水合。")
    else:
        # 找 /answer 提交时刻
        ans = [e for e in entries if e["u"].startswith("answer")]
        last_q = max((e for e in entries if e["u"].startswith("survey-action")),
                     key=lambda e: e["t"], default=None)
        if ans:
            print(f"  首次 /answer 提交在 +{ans[0]['t']}ms")
            if last_q:
                print(f"  最后一次 survey-action 在 +{last_q['t']}ms")
                gap = ans[0]["t"] - last_q["t"]
                print(f"  **末步到提交的间隔 = {gap}ms**")
                print(f"  （用户体感「停住 2-3 秒」≈ 2000-3000ms）")
        else:
            print("  未观测到 /answer（可能未走到末页或提交被拦截）")
    _prune_test_state("fix2speed-")
    return 0


if __name__ == "__main__":
    sys.exit(main())
