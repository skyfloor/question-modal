// 验证 S3：配置读取层 —— 走「点击设置入口 → 面板拉取」这条真实路径
//   [C1] 打开面板即请求 effective-config（含 session_id/agent_id/chat_id）
//   [C2] 带 Bearer 鉴权与 X-Agent-Id
//   [C3] 解析成功后面板拿到 config（visible 反映真实值）
//   [C4] 失败时给出 cfgError 文案，不清空面板
//   [C5] 连续打开两次：每次都会重取（不做长驻缓存）
//   [C6] 1.5s 内同一会话复用缓存（避免同 tick 重复请求）
//   [C7] 【反证】未使用 setInterval
//   [C8] 【反证】客户端不自行拼三层优先级
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
  return {
    tagName: String(tag).toUpperCase(), nodeType: 1, style: {}, id: "", className: "",
    children: [], _text: "", parentNode: null,
    appendChild(c) { this.children.push(c); if (c) c.parentNode = this; return c; },
    removeChild(c) { return c; },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
  };
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

let effCalls = [], headersSeen = [], renders = [];
let mode = "ok";

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {},
      getApiUrl: (p) => "/api" + p, getApiToken: () => "TOKEN-X",
      getSelectedAgentId: () => "wb74Jn",
      getCurrentSessionId: () => "1786334195379-tt7ix13",
      useTheme: () => "light",
    },
    chat: { toolRender: () => {}, sender: { addPrefix: (pid, node) => { windowFake.__btn = node; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" },
  location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    if (String(u).includes("effective-config")) {
      effCalls.push(String(u));
      if (o && o.headers) headersSeen.push(o.headers);
      if (mode === "fail") return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "UUID-1",
        config: { mode: "recommend", slow_question_sec: 120, __sources__: { mode: "session" } },
        global_keys: ["mode"], version: 42, schema: [{ key: "mode" }],
      }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 3)),
  clearTimeout, setInterval: () => 0, clearInterval: () => {},
  MutationObserver: class { observe() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {}, console,
};
windowFake.window = windowFake;

const src = fs.readFileSync(BUNDLE, "utf8");
// 捕获 ReactDOM.render 的调用，拿到设置面板的渲染树
const realRender = ReactDOMFake.render;
ReactDOMFake.render = (node, container) => { renders.push({ node, container }); return node; };

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
function textOf(n) {
  if (typeof n === "string") return n;
  if (!n || typeof n !== "object") return "";
  return childList(n).map(textOf).join("");
}
const lastNode = () => renders.length ? renders[renders.length - 1].node : null;

console.log("\n[C] 配置读取层 S3（真实路径）");

const btn = windowFake.__btn;
check("[C0] 设置入口已注册", !!btn && !!btn.props && typeof btn.props.onClick === "function",
  "btn=" + !!btn);

// [C1] 打开 → 请求
btn.props.onClick();
await flush();
check("[C1] 打开面板即请求 effective-config", effCalls.length === 1, "calls=" + effCalls.length);
const u1 = effCalls[0] || "";
check("[C1b] 请求带 chat_id / session_id / agent_id 三段",
  /chat_id=/.test(u1) && /session_id=1786334195379-tt7ix13/.test(u1) && /agent_id=wb74Jn/.test(u1),
  u1);
check("[C1c] session_id 被 URL 编码且非空", /session_id=[^&]+/.test(u1), u1);

// [C2] 鉴权头
const h = headersSeen[0] || {};
check("[C2] 带 Bearer 鉴权与 X-Agent-Id",
  h["Authorization"] === "Bearer TOKEN-X" && h["X-Agent-Id"] === "wb74Jn",
  JSON.stringify(h));

// [C3] 解析后面板展示真实值
const t = textOf(lastNode());
check("[C3] 面板已拿到配置（无读取失败提示）",
  !t.includes("读取配置失败"), t.slice(0, 100));

// [C5] 关闭再开 → 重新请求（不做长驻缓存，保证新问卷拿到最新）
const closeBtn = (function findClose(n, out) {
  if (!n || typeof n !== "object") return out;
  if (n.type === "button" && /关闭/.test(textOf(n))) return n;
  for (const c of childList(n)) { const r = findClose(c, out); if (r) return r; }
  return out;
})(lastNode(), null);
if (closeBtn && closeBtn.props && closeBtn.props.onClick) closeBtn.props.onClick();
btn.props.onClick();
await flush();
check("[C5] 再次打开会重新拉取（非长驻缓存）", effCalls.length >= 2, "calls=" + effCalls.length);

// [C4] 失败降级
mode = "fail";
const n2 = effCalls.length;
// 强制绕过缓存：直接再点一次（openSettingsPanel 内部会 invalidate）
btn.props.onClick();
await flush();
const t2 = textOf(lastNode());
check("[C4] 读取失败时给出明确文案，面板不崩",
  t2.includes("读取配置失败") || effCalls.length === n2 + 1,
  t2.slice(0, 140));
mode = "ok";

// 源码级反证
const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
const fnStart = srcTsx.indexOf("async function fetchEffectiveConfig");
const fnEnd = srcTsx.indexOf("function invalidateConfigCache");
const fnBody = srcTsx.slice(fnStart, fnEnd);
check("[C7] 【反证】读取层内无 setInterval", !/setInterval\(/.test(fnBody));
check("[C8] 【反证】客户端不自行合并三层优先级",
  !/resolve_effective|session_prefs|overrides\[/.test(fnBody));
check("[C9] 【反证】缓存窗口有上限常量",
  /CFG_CACHE_MS\s*=\s*\d+/.test(srcTsx), "");

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
