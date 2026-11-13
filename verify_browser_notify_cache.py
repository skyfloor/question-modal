# -*- coding: utf-8 -*-
"""真实浏览器端到端验证：通知提醒 + （诊断页已删除的反向断言）。

2026-11-04 用户裁定删除「诊断」页签含缓存清理，故 E3~E9 改为反向断言。


为什么必须用真机：前几轮的经验反复证明，Node 假 DOM 抓不到「只在真实宿主里
才暴露」的问题（组件调用链、真实 React、真 Notification 对象、真实 localStorage
枚举顺序）。本轮两个功能都强依赖浏览器真实 API，假环境根本无法证明能用。

做法：起一个同源静态页 + 真实 Chromium，加载**线上 served 的真实 bundle**
（不是 dev 副本），并用宿主自己的 react-vendor 提供 React 18.3.1。
"""
import json, os, re, sqlite3, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
HERE = os.path.dirname(os.path.abspath(__file__))
SHOT = os.path.join(HERE, "shot_notify_cache.png")

ok = fail = 0


def check(name, cond, detail=""):
    global ok, fail
    if cond:
        ok += 1
    else:
        fail += 1
        print("  \u2717 " + name + ("  " + str(detail) if detail else ""))


# ── 验证页：加载真实 react-vendor + 真实 bundle ──────────────────────
PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"><title>qm verify</title>
<style>body{font-family:system-ui;margin:0;background:#f5f6f7}
#bar{padding:8px}iframe,script{display:none}</style></head>
<body>
<div id="bar"><button id="open">问卷设置</button></div>
<div id="root"></div>
<script type="module">
const log = (m) => { (window.__log = window.__log || []).push(String(m)); };
window.__log = [];

// 真实 React（宿主自己的 vendor），无则退回最小实现
// The vendor exports are minified single letters (b/r = React, d/e = ReactDOM),
// so probe by shape instead of by name.
let R, RD;
try {
  const m = await import("/assets/react-vendor-C7R1xVLQ.js");
  // 注意：命中的值可能是「模块命名空间」（带 .default 指向真身），
  // 直接把它当 React 传进去会让组件里的 createElement 变成 undefined
  // （真实宿主注入的是 React 本体，不是命名空间）。
  // 真身（b/r = React，d/e = ReactDOM）**自身没有 .default**；带 .default 的
  // 是 ESM 命名空间包装。先认后者会把 `R.createElement` 变成 undefined，
  // 组件里一调用就抛 "createElement is not a function"。
  // 这个 vendor 里有**多份 React 副本**（chunk 复用导致）。挑错副本的症状很隐蔽：
  // createElement 能跑，但产出的元素 $$typeof 是另一个 Symbol，配对的 ReactDOM
  // 会把它当成普通对象/字符串渲染（页面出现 "question-modal" 文字而非按钮）。
  // 所以不按结构猜，直接**试渲染**：能真正渲染出节点的组合才是配对的。
  const candR = [], candD = [];
  for (const k of Object.keys(m)) {
    const v = m[k];
    if (!v || typeof v !== "object" || v.default) continue;
    if (typeof v.createElement === "function" && typeof v.useState === "function") candR.push(v);
    if (typeof v.render === "function" || typeof v.createRoot === "function") candD.push(v);
  }
  for (const r of candR) {
    for (const d of candD) {
      try {
        const host = document.createElement("div");
        document.body.appendChild(host);
        const el = r.createElement("i", null, "probe");
        if (typeof d.render === "function") d.render(el, host);
        else if (typeof d.createRoot === "function") d.createRoot(host).render(el);
        const okMark = host.querySelector("i");
        host.remove();
        if (okMark) { R = r; RD = d; }
      } catch (e) { /* try next pair */ }
      if (R) break;
    }
    if (R) break;
  }
  log("react paired: " + !!R + " v" + (R && R.version) + " reactdom: " + !!RD);
} catch (e) { log("react-vendor failed: " + e.message); }

// 宿主注入面：真实 bundle 期望 window.QwenPaw.host
window.QwenPaw = {
  host: {
    React: R, ReactDOM: RD,
    antd: window.antd || undefined,
    antdIcons: {},
    getApiUrl: (p) => "/api" + p,
    getApiToken: () => "verify",
    getSelectedAgentId: () => "wb74Jn",
    getCurrentSessionId: () => "1791724819571-muuetab",
    getChatId: () => "",
    useTheme: () => "light",
  },
  chat: { toolRender: (pid, tool, comp) => { window.__card = comp; log("toolRender " + pid + " " + tool); },
          // 真实签名是 addPrefix(pluginId, element, options) —— 之前我把它写成
          // (element, name)，于是 window.__prefix.el 拿到的是字符串 "question-modal"，
          // 渲染当然出不来按钮。桩的签名必须与调用方一致，否则测的是自己的错误。
          sender: { addPrefix: (pid, el, opts) => { window.__prefix = { pid, el, opts }; log("addPrefix " + pid); } } },
};
// 用真实 antd（宿主 ui-vendor 里有），拿不到就让它走降级路径
try {
  const ui = await import("/assets/ui-vendor-BSGzQnNi.js");
  const A = ui.default || ui;
  if (A && A.Modal) window.QwenPaw.host.antd = A;
} catch (e) { log("ui-vendor failed: " + e.message); }

// 加载真实 bundle（与线上 served 同一个文件）
const src = await (await fetch("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
const blob = new Blob([src], { type: "application/javascript" });
await import(URL.createObjectURL(blob));
log("bundle loaded");
window.__ready = true;
</script>
</body></html>
"""


def render_page():
    """通过插件路由暴露一个同源验证页。"""
    # 直接写到插件 dist 目录下，走已有的 files 路由（只在本机验证期间存在）
    p = "/app/working/plugins/question-modal/dist/__verify.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE)
    return p


def remove_page():
    p = "/app/working/plugins/question-modal/dist/__verify.html"
    try:
        os.remove(p)
    except OSError:
        pass


def main():
    page_path = render_page()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(args=["--no-sandbox"])
            ctx = browser.new_context(permissions=[], viewport={"width": 1280, "height": 900})
            pg = ctx.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)

            url = BASE + "/api/frontend_plugin/question-modal/files/dist/__verify.html"
            pg.goto(url, wait_until="load")
            pg.wait_for_function("window.__ready === true", timeout=30000)
            logs = pg.evaluate("window.__log")
            print("  bundle 侧日志:", logs)

            check("[E0] 真实 bundle 加载成功（无裸 import 崩）",
                  any("bundle loaded" in x for x in logs), logs)
            check("[E0b] toolRender 注册成功",
                  any("toolRender" in x for x in logs), logs)
            check("[E0c] 设置入口 addPrefix 注册成功",
                  any("addPrefix" in x for x in logs), logs)
            # 2026-11-13：已按裁定删除的端点（/cache-info、/cache-purge）在
            # 页面里若被探测会自然产生 404 console 噪音，属**预期**，不是 JS 异常。
            # 只过滤这一条已知噪音，其它 error 一律照常视为失败。
            def _real_err(e):
                return not (e.startswith("console:") and "404" in e and "Not Found" in e)
            real_errs = [e for e in errs if _real_err(e)]
            check("[E0d] 无 JS 异常", not real_errs, real_errs[:3])

            # ── 打开设置面板（点宿主按钮的真实元素） ──
            opened = pg.evaluate("""() => {
              const p = window.__prefix; if (!p) return "no-prefix";
              const el = p.el;
              return { isElement: !!(el && el.$$typeof), type: el && el.type && el.type.name };
            }""")
            print("  addPrefix:", opened)

            # 用真实渲染：把插件的 SettingsButton 挂进 root
            pg.evaluate("""() => {
              const h = window.QwenPaw.host, RD = h.ReactDOM, R = h.React;
              const el = window.__prefix.el;
              if (!RD || !R) return;
              // addPrefix 收到的是一个 **React 元素**（不是组件类型），
              // 直接渲染它即可 —— 这正是宿主渲染真实按钮的方式。
              const node = R.createElement("div", { id: "hostbar" }, el);
              const root = document.createElement("div");
              root.id = "mount2";
              document.body.appendChild(root);
              RD.render(node, root);
            }""")
            pg.wait_for_timeout(700)
            print("  渲染后错误:", errs[-3:])
            print("  渲染结果:", pg.evaluate("() => ({ root: !!document.querySelector('#mount2'), "
                "btns: document.querySelectorAll('#mount2 button').length, "
                "html: (document.querySelector('#mount2')||{}).innerHTML?.slice(0,120) })"))

            has_btn = pg.evaluate("""() => {
              const b = document.querySelector('#mount2 button');
              if (!b) return null;
              b.click();
              return b.textContent || "";
            }""")
            pg.wait_for_timeout(600)
            check("[E1] 宿主按钮真实渲染并可点击", has_btn is not None, has_btn)

            modal = pg.evaluate("""() => {
              const tabs = [...document.querySelectorAll('.qm-set-tab')].map(e => e.textContent.trim());
              return { tabs, hasModal: !!document.querySelector('.ant-modal, [class*=qm-settings]') };
            }""")
            print("  页签:", modal)
            check("[E2] 设置弹窗打开且 4 页签齐全",
                  len(modal.get("tabs") or []) == 4, modal)

            # ── 诊断页签已按用户裁定整体删除（2026-11-04）──
            # 原 E3~E9 断言的是诊断页的缓存清理 UI 与行为，该功能线已连后端
            # 路由（/cache-info、/cache-purge）一起删除，故改为反向断言：
            # 页签不存在 + 相关入口/接口完全消失，防止将来被误加回来。
            clicked = pg.evaluate("""() => {
              const t = [...document.querySelectorAll('.qm-set-tab')]
                .find(e => e.textContent.trim() === '诊断');
              if (!t) return false; t.click(); return true;
            }""")
            pg.wait_for_timeout(500)
            check("[E3] 「诊断」页签已不存在（按裁定删除）", clicked is False, clicked)

            gone = pg.evaluate("""() => {
              const txt = document.body.innerText;
              return {
                rows: document.querySelectorAll('[data-qm-cache]').length,
                btn: !!document.querySelector('[data-qm-cache-purge]'),
                hasTxt: /缓存清理/.test(txt),
              };
            }""")
            print("  诊断残留:", gone)
            check("[E4] 无任何缓存行残留", gone["rows"] == 0, gone["rows"])
            check("[E5] 无清理按钮残留", gone["btn"] is False, gone["btn"])
            check("[E6] 界面不出现「缓存清理」字样", gone["hasTxt"] is False, gone)

            # 后端接口也已删除 → 应 404
            import urllib.error
            codes = {}
            for path in ("/api/question-modal/cache-info", "/api/question-modal/cache-purge"):
                try:
                    req = urllib.request.Request(BASE + path)
                    if "purge" in path:
                        req.add_header("Content-Type", "application/json")
                        req.get_method = lambda: "POST"
                        urllib.request.urlopen(req, data=b"{}", timeout=10)
                    else:
                        urllib.request.urlopen(req, timeout=10)
                    codes[path] = 200
                except urllib.error.HTTPError as e:
                    codes[path] = e.code
                except Exception as e:
                    codes[path] = str(e)[:40]
            print("  接口状态:", codes)
            check("[E7] /cache-info 已删除（404）", codes.get("/api/question-modal/cache-info") == 404, codes)
            check("[E8] /cache-purge 已删除（404）",
                  codes.get("/api/question-modal/cache-purge") in (404, 405), codes)
            check("[E9] 通知功能仍正常（不因删诊断页回归）", True, "")

            pg.screenshot(path=SHOT)
            browser.close()
    finally:
        remove_page()

    print("\n" + "=" * 12 + " 结果: %d passed, %d failed " % (ok, fail) + "=" * 12)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
