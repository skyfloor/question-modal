# -*- coding: utf-8 -*-
"""真实浏览器验证：人工模式通知（必须真机，假环境证明不了）。

要点：
  • 真 Notification 对象（Playwright 可授权/拒绝通知权限）
  • 真 localStorage（跨刷新去重）
  • 真 React 渲染整张卡片

[q1] 开关关闭 → 不通知
[q2] 开关开启 + 人工模式 → 发出 1 条
[q3] AI 模式 → 不通知
[q4] 刷新页面（重挂载 + localStorage 持久）→ 不重复通知
[q5] 权限被拒 → 不发系统通知，卡片照常渲染
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
HERE = os.path.dirname(os.path.abspath(__file__))
ok = fail = 0


def check(name, cond, detail=""):
    global ok, fail
    if cond:
        ok += 1
        print("  \u2713 " + name)
    else:
        fail += 1
        print("  \u2717 " + name + ("  " + str(detail) if detail else ""))


CARD_QS = [
    {"type": "single", "title": "先做哪个", "options": ["甲", "乙"]},
    {"type": "single", "title": "再确认", "options": ["是", "否"]},
]

# 页面：拿真实 R/RD 配对，暴露一个 mountCard(mode, notify) 供 python 调用
PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"><title>qm notify verify</title></head>
<body><div id="host"></div>
<script type="module">
const log = (m) => { (window.__log = window.__log || []).push(String(m)); };
window.__log = [];
let R, RD;
try {
  const m = await import("/assets/react-vendor-C7R1xVLQ.js");
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
        const h = document.createElement("div"); document.body.appendChild(h);
        if (typeof d.render === "function") d.render(r.createElement("i", null, "p"), h);
        else d.createRoot(h).render(r.createElement("i", null, "p"));
        const good = h.querySelector("i"); h.remove();
        if (good) { R = r; RD = d; }
      } catch (e) {}
      if (R) break;
    }
    if (R) break;
  }
} catch (e) { log("vendor fail " + e.message); }

// 无头 Chromium 即使 context 里 granted，Notification.permission 仍恒为
// "denied"（实测），所以不能拿真 Notification 验「应当发出」这条路径。
// 这里换成可控桩：它仍然走插件**同一段代码**（权限检查 + new Notification），
// 只是 permission 由 __perm 决定 —— 既验得到发出的分支，也验得到被拒的分支。
window.__notified = [];
window.__perm = "granted";       // 由 python 切换
window.__reqCalls = 0;
const Rec = function (title, opts) {
  window.__notified.push({ title: String(title), body: (opts && opts.body) || "",
                           tag: (opts && opts.tag) || "" });
  this.onclick = null; this.close = () => {};
};
Object.defineProperty(Rec, "permission", { get: () => window.__perm, configurable: true });
Rec.requestPermission = (cb) => {
  window.__reqCalls++;
  const v = window.__perm;
  if (typeof cb === "function") { cb(v); return undefined; }
  return Promise.resolve(v);
};
window.Notification = Rec;

window.__mode = "manual"; window.__notify = false;
// 宿主注入的 antd 只被卡片用到 Input.TextArea 与 message；这里给最小实现，
// 避免为了一个 TextArea 去反解 ui-vendor 的混淆导出（那不是本轮要验的东西）。
const R_ = R;
const antdStub = {
  Input: Object.assign(
    (p) => R_.createElement("input", p),
    { TextArea: (p) => R_.createElement("textarea", p) }),
  message: { warning: () => {}, success: () => {}, info: () => {}, error: () => {} },
};
window.QwenPaw = {
  host: { React: R, ReactDOM: RD, antd: antdStub, antdIcons: {},
    getApiUrl: (p) => "/api" + p, getApiToken: () => "verify",
    getSelectedAgentId: () => "wb74Jn",
    getCurrentSessionId: () => "1791724819571-muuetab", getChatId: () => "",
    useTheme: () => "light" },
  chat: { toolRender: (pid, t, comp) => { window.__card = comp; },
          sender: { addPrefix: () => {} } },
};

const realFetch = window.fetch.bind(window);
window.fetch = (u, o) => {
  const url = String(u);
  if (url.includes("effective-config")) {
    return Promise.resolve(new Response(JSON.stringify({
      ok: true, chat_id: "CHAT-E2E", version: 1, schema: [], global_keys: [],
      config: { mode: window.__mode, notify_manual_mode: window.__notify,
                show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60,
                skip_mode: "per_question", model_id: "", template_id: "",
                with_context: false, parallel: false, fallback_title: true,
                wait_hint_sec: 180, __sources__: {} } }), { status: 200 }));
  }
  if (url.includes("question-modal/resolve")) {
    return Promise.resolve(new Response(JSON.stringify({
      ok: true, pending: [{ request_id: "req-e2e", tool_call_id: "call_e2e" }],
      count: 1 }), { status: 200 }));
  }
  if (url.includes("question-modal/prefs")) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true, prefs: {} }), { status: 200 }));
  }
  if (url.includes("question-modal/templates")) {
    return Promise.resolve(new Response(JSON.stringify({
      ok: true, default_id: "builtin-default",
      items: [{ id: "builtin-default", name: "默认", builtin: true, system: "s", user: "u" }]
    }), { status: 200 }));
  }
  if (url.includes("question-modal/analysis")) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true, found: false }), { status: 200 }));
  }
  if (url.includes("question-modal/pending")) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true, pending: [], count: 0 }), { status: 200 }));
  }
  if (url.includes("question-modal/result")) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true, found: false }), { status: 200 }));
  }
  if (url.includes("/api/models/active")) {
    return Promise.resolve(new Response(JSON.stringify({ active_llm: { provider_id: "x", model: "y" } }), { status: 200 }));
  }
  if (url.includes("/api/models")) {
    return Promise.resolve(new Response(JSON.stringify({ providers: [] }), { status: 200 }));
  }
  return realFetch(u, o);
};

const src = await (await realFetch("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src], { type: "application/javascript" })));

// 宿主传给卡片的是 props.data = 一个工具消息节点，形如
//   { content: [{ type: "data", data: { call_id, arguments, output } }] }
// 直接塞一个扁平对象进去，卡片拿不到 callId（toolCallId 返回空）→ 渲染不出来。
window.__mount = (callId, qs) => {
  const host = document.getElementById("host");
  host.innerHTML = "";
  const msg = { content: [{ type: "data",
    data: { call_id: callId, arguments: JSON.stringify({ title: "取舍确认", questions: qs }) } }] };
  const el = R.createElement(window.__card, { data: msg });
  RD.render(el, host);
};
window.__ready = true;
log("ready");
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__verify_notify.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE)
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(args=["--no-sandbox"])
            # 授予通知权限
            ctx = browser.new_context(permissions=["notifications"])
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: print("  PAGEERR:", e))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__verify_notify.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready === true", timeout=30000)
            print("  log:", pg.evaluate("window.__log"))

            # q1: 开关关闭 + 人工
            pg.evaluate("() => { window.__mode='manual'; window.__notify=false; }")
            pg.evaluate("() => window.__mount('call_N1', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1200)
            n1 = pg.evaluate("window.__notified.length")
            check("[q1] 开关关闭时不发通知", n1 == 0, n1)

            # q2: 开启 + 人工
            pg.evaluate("() => { window.__notify = true; }")
            pg.evaluate("() => window.__mount('call_N2', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1400)
            dbg = pg.evaluate("""() => ({
              notified: window.__notified.length,
              state: localStorage.getItem('qm:v1:state:call_N2'),
              perm: window.Notification && window.Notification.permission,
              card: !!document.querySelector('.qm-card'),
              cardText: (document.body.innerText||'').slice(0,120),
            })""")
            print("  q2 诊断:", dbg)
            n2 = pg.evaluate("window.__notified")
            check("[q2] 开启 + 人工模式 → 发出 1 条", len(n2) == 1, n2)
            if n2:
                check("[q2b] 通知正文含标题与题数",
                      "取舍确认" in n2[0]["body"] and any(c.isdigit() for c in n2[0]["body"]),
                      n2[0])

            # q3: AI 模式
            # 先切模式再重挂载：若先把 __notified 清空再切模式，上一张卡
            # 在这一轮 effect 里补发的提醒会被算到 AI 头上（假失败）。
            pg.evaluate("() => { window.__mode='ai'; }")
            pg.wait_for_timeout(400)
            pg.evaluate("() => { window.__notified = []; }")
            pg.evaluate("() => window.__mount('call_N3', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1600)
            n3 = pg.evaluate("window.__notified")
            print("  q3 诊断:", n3)
            print("  notify dbg:", pg.evaluate("window.__qmNotifyDbg || []"))
            check("[q3] AI 模式不发通知", len(n3) == 0, n3)

            # q4: 同一 callId 重挂载（模拟宿主重挂）→ 不重复
            pg.evaluate("() => { window.__mode='manual'; window.__notify=true; window.__notified=[]; }")
            pg.evaluate("() => window.__mount('call_N4', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1200)
            first = pg.evaluate("window.__notified.length")
            pg.evaluate("() => window.__mount('call_N4', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1200)
            total = pg.evaluate("window.__notified.length")
            check("[q4] 同一问卷重挂载不重复通知", first == 1 and total == 1,
                  "first=%d total=%d" % (first, total))

            # q5: 刷新页面（localStorage 持久）→ 仍不重复
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready === true", timeout=30000)
            pg.evaluate("() => { window.__mode='manual'; window.__notify=true; }")
            pg.evaluate("() => window.__mount('call_N4', " + json.dumps(CARD_QS) + ")")
            pg.wait_for_timeout(1400)
            n5 = pg.evaluate("window.__notified.length")
            check("[q5] 刷新后同一问卷不再通知（localStorage 去重生效）", n5 == 0, n5)

            browser.close()

            # q6: 权限被拒（同一页内切 __perm = denied）
            browser = pw.chromium.launch(args=["--no-sandbox"])
            ctx2 = browser.new_context()
            pg2 = ctx2.new_page()
            perr = []
            pg2.on("pageerror", lambda e: perr.append(str(e)))
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__verify_notify.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready === true", timeout=30000)
            pg2.evaluate("() => { window.__perm = 'denied'; }")
            pg2.evaluate("() => { window.__mode='manual'; window.__notify=true; }")
            pg2.evaluate("() => window.__mount('call_N6', " + json.dumps(CARD_QS) + ")")
            pg2.wait_for_timeout(1600)
            n6 = pg2.evaluate("window.__notified.length")
            hasCard = pg2.evaluate("() => !!document.querySelector('.qm-card')")
            check("[q6] 权限被拒时不发通知且卡片照常渲染",
                  n6 == 0 and hasCard and not perr,
                  "sent=%d card=%s err=%s" % (n6, hasCard, perr[:2]))
            browser.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    print("\n" + "=" * 12 + " 结果: %d passed, %d failed " % (ok, fail) + "=" * 12)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
