// 验证：真机验证中发现的 4 项修复
//   [F1] 徽标如实反映接入状态（已接作答 → 不再说「未接功能」）
//   [F2] 切页签清掉保存提示（不跨页签误导）
//   [F3] 降级路径（无 antd.Modal）必须自带关闭出口
//   [F4] 开关 aria-checked 反映真实值，且可键盘操作
//   反证：分别破坏这四项，断言必须精准失败
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUNDLE = path.join(HERE, "dist/index.js");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? " → " + d : "")); }
};

function mkEl(tag) {
  return { tagName: String(tag).toUpperCase(), nodeType: 1, style: {}, id: "", className: "",
    children: [], _text: "", parentNode: null, value: "",
    appendChild(c) { this.children.push(c); if (c) c.parentNode = this; return c; },
    removeChild(c) { return c; }, setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); } };
}
const documentFake = {
  body: mkEl("body"), head: mkEl("head"),
  createElement: (t) => mkEl(t), createTextNode: (t) => ({ nodeType: 3, _t: String(t) }),
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
};
let inComp = 0;
const R = {
  createElement(type, props, ...children) {
    if (typeof type === "function" && inComp < 10) {
      inComp++;
      try { return type({ ...(props || {}), children: children.length <= 1 ? children[0] : children }); }
      finally { inComp--; }
    }
    return { __reactEl: true, type, props: props || {}, children: children.flat(9) };
  },
  useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }),
  useEffect: () => {}, useMemo: (f) => f(), useCallback: (f) => f(), Fragment: "Fragment",
};
const ReactDOMFake = { render: (n) => n };
let renders = [], posts = [], HAS_MODAL = false;

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      get antd() {
        return HAS_MODAL
          ? { Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) }
          : {};   // ← 降级路径
      },
      antdIcons: {}, getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-x",
      useTheme: () => "light",
    },
    chat: { toolRender: () => {}, sender: { addPrefix: (p, n) => { windowFake.__btn = n; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    if (String(u).includes("effective-config")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "U1",
        config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true,
                  slow_question_sec: 60, skip_mode: "per_question", __sources__: {} },
        global_keys: [], version: 1, schema: [] }) });
    }
    if (o && o.method === "POST") { posts.push({ url: String(u), body: JSON.parse(o.body || "{}") });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }); }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 2)),
  clearTimeout, setInterval: () => 0, clearInterval: () => {},
  MutationObserver: class { observe() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {}, console,
};
windowFake.window = windowFake;
ReactDOMFake.render = (node, container) => { renders.push({ node, container }); return node; };

const src = fs.readFileSync(BUNDLE, "utf8");
new Function("window", "document", "localStorage", "navigator", "location", "console",
  "fetch", "self", "globalThis", "module", "exports", "require",
  src + "\n;return {};")(windowFake, documentFake, windowFake.localStorage, windowFake.navigator,
  windowFake.location, console, windowFake.fetch, windowFake, windowFake, { exports: {} }, {});

const flush = () => new Promise((r) => setTimeout(r, 25));
function childList(n) {
  const a = Array.isArray(n.children) ? n.children : [];
  const p = n.props && n.props.children;
  return a.concat(Array.isArray(p) ? p : (p != null ? [p] : []));
}
function findAll(root, pred, out = []) {
  if (!root || typeof root !== "object") return out;
  if (pred(root)) out.push(root);
  childList(root).forEach((c) => findAll(c, pred, out));
  return out;
}
function textOf(n) {
  if (typeof n === "string") return n;
  if (!n || typeof n !== "object") return "";
  return childList(n).map(textOf).join("");
}
const last = () => renders[renders.length - 1].node;

console.log("\n[F] 真机发现缺陷的修复验证");

// ── 降级路径打开 ──
HAS_MODAL = false;
windowFake.__btn.props.onClick();
await flush();
const root = last();

// [F1] 徽标（2026-11-04 改为作用域徽章，取代「分批接入中」）
const t = textOf(root);
check("[F1] 徽标显示作用域（会话模式 / 默认模式）",
  t.includes("会话模式") || t.includes("默认模式"), t.slice(0, 140));
check("[F1b] 旧徽章「分批接入中/预览版」已移除",
  !t.includes("分批接入中") && !t.includes("预览版"), t.slice(0, 140));

// [F3] 降级关闭出口
const closeBtns = findAll(root, (n) => n && n.props && n.props["data-qm-fallback-close"] === "1");
check("[F3] 降级路径带独立关闭按钮", closeBtns.length === 1, "count=" + closeBtns.length);
check("[F3b] 关闭按钮有可访问名", !!closeBtns[0] && !!closeBtns[0].props["aria-label"],
  closeBtns[0] && closeBtns[0].props["aria-label"]);
check("[F3c] 降级容器有可定位标记",
  findAll(root, (n) => n && n.props && n.props["data-qm-fallback"] === "1").length === 1);

// 作用域优先的页签（2026-11-04 重排）：开关只出现在「全局默认」页签里，
// 先切过去再验 aria 与保存提示。
(function goGlobal() {
  const t = findAll(root, (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === "全局默认")[0];
  if (t) t.props.onClick();
})();
await flush();
const rootG = last();

// [F4] 开关 aria
const switches = findAll(rootG, (n) => n && n.props && n.props.role === "switch");
check("[F4] 每个开关都有 aria-checked", switches.length > 0
  && switches.every((s) => s.props["aria-checked"] === "true" || s.props["aria-checked"] === "false"),
  JSON.stringify(switches.map((s) => s.props["aria-checked"])));
check("[F4b] aria-checked 与 data-qm-on 一致",
  switches.every((s) => (s.props["aria-checked"] === "true") === (s.props["data-qm-on"] === "1")),
  JSON.stringify(switches.map((s) => [s.props["aria-checked"], s.props["data-qm-on"]])));
check("[F4c] 可交互开关具备键盘可达性",
  switches.every((s) => s.props.tabIndex === 0 && typeof s.props.onKeyDown === "function"));

// [F2] 切页签清提示
(function () {
  const seg = findAll(last(), (n) => n && n.props && n.props["data-qm-val"] === "自动分析")[0];
  if (seg) seg.props.onClick();
})();
await flush();
const saveB = findAll(last(), (n) => n && n.props && n.props["data-qm-save"] === "1")[0];
saveB.props.onClick();
await flush();
await flush();
const afterSave = textOf(last());
check("[F2-前置] 保存后出现结果提示",
  /已保存/.test(afterSave), afterSave.slice(-160));

// 切页签
const tabs = findAll(last(), (n) => n && n.type === "button"
  && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || "")));
tabs[1].props.onClick();
await flush();
const afterTab = textOf(last());
check("[F2] 切页签后不再显示上一个页签的保存提示",
  !/新问卷生效/.test(afterTab), afterTab.slice(-200));

// 降级关闭：真的能关
const closeNow = findAll(last(), (n) => n && n.props && n.props["data-qm-fallback-close"] === "1")[0];
const beforeRenders = renders.length;
closeNow.props.onClick();
await flush();
check("[F3d] 点击降级关闭按钮后面板消失（返回 null）",
  last() === null || renders.length > beforeRenders && last() === null,
  "last=" + (last() === null ? "null" : typeof last()));

// 源码级反证
const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
check("[F5] 【反证】批次状态有唯一常量源（WIRED_BATCHES）",
  /const WIRED_BATCHES: number\[\]\s*=\s*\[1\]/.test(srcTsx) && /BATCH1_WIRED/.test(srcTsx));
check("[F6] 【反证】切页签确有清 saveMsg",
  /settingsState\.saveMsg = "";\s*\n\s*settingsRenderPanel\(\);/.test(
    srcTsx.slice(srcTsx.indexOf("onTabChange:"), srcTsx.indexOf("scope: settingsState.scope"))));

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
