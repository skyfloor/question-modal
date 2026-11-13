"""真机验证：真实 Chromium + 宿主 react-vendor + 线上 served bundle，
确认「跳过原因」真的显示在折叠行与展开块，而不是只被 Node 假 React 测过。

用法：python3 verify_skip_reason_browser.py
"""
import json
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
CALL = "call_AR_BROWSER"
REASON = "系统自动释放（自动推进看门狗）：自动推进 300s 无进展，已自动释放"
OUT = ('❓ **测试问卷**\n1. [单选] 走哪条？（甲、乙）\n\n'
       + REASON + '\n{"skipped": true}')

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  ✓ " + n)
    else:
        fail += 1
        print("  ✗ " + n + "  " + str(d))


PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="host"></div>
<script type="module">
let R, RD;
const m = await import("/assets/react-vendor-C7R1xVLQ.js");
const cR = [], cD = [];
for (const k of Object.keys(m)) {
  const v = m[k];
  if (!v || typeof v !== "object" || v.default) continue;
  if (typeof v.createElement === "function" && typeof v.useState === "function") cR.push(v);
  if (typeof v.render === "function" || typeof v.createRoot === "function") cD.push(v);
}
for (const r of cR) {
  for (const d of cD) {
    try {
      const h = document.createElement("div"); document.body.appendChild(h);
      if (d.render) d.render(r.createElement("i", null, "p"), h);
      else d.createRoot(h).render(r.createElement("i", null, "p"));
      const g = h.querySelector("i"); h.remove(); if (g) { R = r; RD = d; }
    } catch (e) {}
    if (R) break;
  }
  if (R) break;
}
const antd = {
  Input: Object.assign(p => R.createElement("input", p),
    { TextArea: p => R.createElement("textarea", p) }),
  Modal: Object.assign(p => (p && p.children) || null, { confirm: () => {} }),
  Popover: p => (p && p.children) || null,
  Select: Object.assign(p => (p && p.children) || null, {}),
  Switch: p => R.createElement("input", { type: "checkbox" }),
  Segmented: p => (p && p.children) || null,
  Collapse: p => (p && p.children) || null,
  Skeleton: p => R.createElement("span", null, "loading"),
  Tooltip: p => (p && p.children) || null,
  Spin: p => R.createElement("span", null, "spin"),
  message: { warning: () => {}, success: () => {}, info: () => {}, error: () => {} },
};
window.Notification = undefined;
window.QwenPaw = {
  host: {
    React: R, ReactDOM: RD, antd, antdIcons: {},
    getApiUrl: p => "/api" + p,
    getApiToken: () => "v",
    getSelectedAgentId: () => "%AG%",
    getCurrentSessionId: () => "%SID%",
    getChatId: () => "",
    useTheme: () => "light",
    useCurrentSession: () => ({ id: "", session_id: "%SID%" }),
  },
  chat: {
    toolRender: (p, t, c) => { window.__card = c; },
    sender: { addPrefix: () => {} },
  },
};
const rf = window.fetch.bind(window);
window.fetch = (u, o) => {
  const url = String(u);
  if (url.includes("/api/question-modal/")) return Promise.resolve({
    ok: true, status: 200,
    json: async () => ({ ok: true, found: false }),
    text: async () => "{}",
  });
  return rf(u, o);
};
const blob = new Blob([await (await fetch("/api/frontend_plugin/question-modal/files/dist/index.js")).text()],
  { type: "application/javascript" });
await import(URL.createObjectURL(blob));
window.__ready = true;
</script></body></html>
""".replace("%AG%", AG).replace("%SID%", SID)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(BASE)
        page.set_content(PAGE)
        page.wait_for_function("window.__ready === true", timeout=30000)

        def mount(output, call=CALL, clear=True):
            page.evaluate("""([cid, out, doClear]) => {
              const c = window.__card;
              const d = window.QwenPaw.host.ReactDOM;
              const R = window.QwenPaw.host.React;
              const node = { content: [{ type: "data", data: {
                call_id: cid,
                arguments: JSON.stringify({ title: "取舍确认", questions: [
                  { type: "single", title: "走哪条？", options: ["甲", "乙"] } ] }),
                output: [{ type: "text", text: out }] } }] };
              if (doClear) localStorage.removeItem("qm:v1:state:" + cid);
              const host = document.getElementById("host");
              host.innerHTML = "";
              const root = d.createRoot(host);
              root.render(R.createElement(c, { data: node }));
            }""", [call, output, clear])
            page.wait_for_timeout(900)

        print("\n[B1] 折叠行显示跳过原因")
        mount(OUT)
        txt = page.inner_text("#host")
        ck("[B1] 卡片渲染出「已跳过问卷」", "已跳过问卷" in txt, txt[:200])
        ck("[B2] 折叠行含原因原文", "自动推进 300s 无进展" in txt, txt[:260])
        ck("[B3] 原因是「系统自动释放」而非伪装成用户",
           "系统自动释放" in txt and "用户跳过了本次问卷" not in txt, txt[:260])
        ck("[B4] data-qm-skip-reason 锚点存在",
           page.locator("[data-qm-skip-reason]").count() > 0)

        print("\n[B5] 展开后卡片内有「跳过原因：」块")
        btns = page.locator("#host button")
        for i in range(btns.count()):
            if btns.nth(i).inner_text().strip() == "展开":
                btns.nth(i).click()
                break
        page.wait_for_timeout(400)
        txt2 = page.inner_text("#host")
        ck("[B5] 展开视图含「跳过原因：」", "跳过原因：" in txt2, txt2[:300])
        ck("[B6] data-qm-skip-reason-block 锚点存在",
           page.locator("[data-qm-skip-reason-block]").count() > 0)

        print("\n[B7] 原因落盘，刷新重挂后仍显示")
        st = page.evaluate("localStorage.getItem('qm:v1:state:%s')" % CALL)
        ck("[B7] skipReason 写入卡片状态", st and "自动推进 300s" in st, str(st)[:200])
        # 模拟宿主重挂载（改 key / 虚拟列表滚回）：不清 localStorage，
        # 输出文本换成无原因的旧版措辞，卡片仍应显示落盘的原因。
        mount("用户跳过了本次问卷。\n{\"skipped\": true}", clear=False)
        txt3 = page.inner_text("#host")
        ck("[B8] 重挂后仍显示落盘的原因（不被旧输出覆盖）",
           "自动推进 300s 无进展" in txt3, txt3[:260])

        print("\n[B9] 全程零 pageerror")
        ck("[B9] 无 JS 异常", len(errors) == 0, "; ".join(errors[:3]))

        browser.close()
    print(f"\n结果：{ok} 通过 / {fail} 失败")
    return 1 if fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
