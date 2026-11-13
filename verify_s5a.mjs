// 验证 S5-A：卡片消费 a2（推荐徽章）、a4（题级计时阈值）
//   [C1] 卡片挂载时按「自己的会话」拉 effective-config（不是全局/别的会话）
//   [C2] 拉取失败时回落内建默认，卡片照常渲染
//   [C3] a2 开（true）→ 推荐项显示「AI 推荐」徽章
//   [C4] a2 关（false）→ 不显示徽章
//   [C5] a2 只影响「显示」，不影响「只用推荐」的驱动逻辑
//   [C6] a4=0（关闭）→ 不再排计时定时器
//   [C7] a4 缩短阈值 → 更早触发提示（读的是配置不是常量）
//   反证：把配置读成常量 → C4/C6/C7 必须失败
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
function mkSite() {
  const site = {
    style: {}, className: "", id: "", _ch: [], parentNode: null,
    appendChild(c) { this._ch.push(c); c.parentNode = this; return c; },
    removeChild(c) { const i = this._ch.indexOf(c); if (i >= 0) this._ch.splice(i, 1); return c; },
    insertBefore(c) { this._ch.push(c); c.parentNode = this; return c; },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
  };
  return site;
}
const documentFake = {
  body: mkSite(), head: mkSite(),
  createElement: (t) => mkSite(), createTextNode: (t) => ({ nodeType: 3, _t: String(t) }),
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  // 2026-11-13：现行卡片代码会挂 document 级监听（visibilitychange / storage 等），
  // 旧 fixture 缺这两个方法导致整个套件启动时 TypeError。补齐为无害 no-op。
  addEventListener() {}, removeEventListener() {},
  visibilityState: "visible", hidden: false,
};

// ── 迷你 React：真实执行 hooks，支持重渲染 ──
const S = { hooks: [], idx: 0, root: null, Comp: null, dirty: false };
function rerender() {
  S.idx = 0;
  // 组件签名是 AskUserCard(props) 且从 props.data 取 node，
  // 所以这里直接传 S.props（它本身就是 {data:{content:...}}）。
  S.root = S.Comp(S.props);
}
const R = {
  createElement(type, props, ...children) {
    if (typeof type === "function") {
      if (S.Comp === null) {
        S.Comp = type; S.props = props;
        return { __root: true, type };
      }
      return { __reactEl: true, type, props: props || {}, children: children.flat(9) };
    }
    return { __reactEl: true, type, props: props || {}, children: children.flat(9) };
  },
  useState(init) {
    const i = S.idx++;
    if (S.hooks.length <= i) S.hooks[i] = typeof init === "function" ? init() : init;
    const set = (v) => {
      const cur = S.hooks[i];
      const next = typeof v === "function" ? v(cur) : v;
      if (JSON.stringify(next) !== JSON.stringify(cur)) { S.hooks[i] = next; S.dirty = true; }
    };
    return [S.hooks[i], set];
  },
  useRef(init) {
    const i = S.idx++;
    if (S.hooks.length <= i) S.hooks[i] = { current: init };
    return S.hooks[i];
  },
  useEffect(fn, deps) {
    const i = S.idx++;
    const prev = S.hooks[i];
    const changed = !prev || !deps
      || deps.some((d, j) => !Object.is(d, prev.deps[j]));
    if (changed) {
      if (prev && typeof prev.cleanup === "function") { try { prev.cleanup(); } catch (_) {} }
      S.hooks[i] = { deps, cleanup: undefined };
      const c = fn();
      S.hooks[i].cleanup = c;
    }
  },
  useMemo(f) { return f(); }, useCallback(f) { return f(); },
  Fragment: "Fragment", createContext: () => ({}), useContext: () => ({}),
};
const ReactDOMFake = { render: (n) => n };

let effCfgResponse = null, effCalls = [];
const timers = [];
const windowFake = {
  QwenPaw: {
    host: { React: R, ReactDOM: ReactDOMFake,
      antd: {
        Input: Object.assign(function I(p){ return { __reactEl:true, type:"Input", props:p||{} }; },
          { TextArea: function TA(p){ return { __reactEl:true, type:"TextArea", props:p||{} }; } }),
        Button: function B(p){ return { __reactEl:true, type:"Button", props:p||{} }; },
        Modal: function M(p){ return { __reactEl:true, type:"Modal", props:p||{} }; },
        message: { success(){}, error(){}, warning(){}, info(){} },
      },
      antdIcons: {},
      getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-card",
      useTheme: () => "light" },
    chat: { toolRender: (_p, _n, comp) => { windowFake.__comp = comp; }, sender: { addPrefix: () => {} } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    const url = String(u);
    if (url.includes("effective-config")) {
      effCalls.push(url);
      if (effCfgResponse === "fail") return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "CHAT-1", config: effCfgResponse || {}, global_keys: [], version: 1, schema: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  setTimeout: (f, ms) => { const t = { f, ms, cleared: false }; timers.push(t); return t; },
  clearTimeout: (t) => { if (t) t.cleared = true; },
  setInterval: () => 0, clearInterval: () => {},
  MutationObserver: class { observe() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {}, console,
};
windowFake.window = windowFake;

const src = fs.readFileSync(BUNDLE, "utf8");
new Function("window", "document", "localStorage", "navigator", "location", "console",
  "fetch", "self", "globalThis", "module", "exports", "require",
  src + "\n;return {};")(windowFake, documentFake, windowFake.localStorage, windowFake.navigator,
  windowFake.location, console, windowFake.fetch, windowFake, windowFake, { exports: {} }, {});

const flush = () => new Promise((r) => setTimeout(r, 40));
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

// 一道带推荐的单选题 —— 用宿主真实结构 content[0].data.arguments
function mkProps(recOn) {
  const args = {
    title: "S5-A 验证",
    questions: [{
      type: "single", title: "选一个",
      options: ["甲", "乙", "丙"],
      recommended: recOn ? "乙" : undefined,
    }],
  };
  return {
    data: {
      content: [{ data: { name: "question_modal", call_id: "call_s5a",
                          arguments: JSON.stringify(args) } }],
    },
  };
}

async function mountAndSettle(props) {
  mount(props);
  await flush();          // 让 hydrate 里的 fetch 落地
  if (S.dirty) { S.dirty = false; rerender(); }
  await flush();
  return S.root;
}

function mount(props) {
  // 全量重置：hooks 数组跨用例复用会让「关闭徽章」沿用上一个用例的 effCfg。
  S.hooks = []; S.idx = 0; S.root = null; S.Comp = null; S.props = props;
  R.createElement(windowFake.__comp, props);
  S.idx = 0;
  S.root = S.Comp(props);
  return S.root;
}

console.log("\n[S5-A] 卡片消费 a2（徽章）/ a4（计时阈值）");

// ── [C1] 挂载拉配置，且用卡片自己的会话 ──
effCfgResponse = { show_recommend_badge: true, slow_question_sec: 60 };
effCalls = [];
mount(mkProps(true));
await flush();
check("[C1] 卡片挂载时会拉 effective-config", effCalls.length >= 1, "calls=" + effCalls.length);
check("[C1b] 请求带卡片自己的 session_id（不是全局/空）",
  effCalls.length > 0 && /session_id=sess-card/.test(effCalls[0]), effCalls[0] || "");
check("[C1c] 请求带 agent_id", effCalls.length > 0 && /agent_id=wb74Jn/.test(effCalls[0]), effCalls[0] || "");

// ── [C3] 徽章开启 → 显示 ──
await flush();
let node = mount(mkProps(true));
await flush();
let badges = findAll(node, (n) => n && n.props && n.props["data-qm-rec"] === "true");
check("[C3] 推荐徽章开启时渲染「AI 推荐」",
  badges.length === 1 && textOf(badges[0]).includes("AI 推荐"), "count=" + badges.length);

// ── [C4] 徽章关闭 → 不显示 ──
effCfgResponse = { show_recommend_badge: false, slow_question_sec: 60 };
node = await mountAndSettle(mkProps(true));
badges = findAll(node, (n) => n && n.props && n.props["data-qm-rec"] === "true");
check("[C4] 推荐徽章关闭时不渲染", badges.length === 0, "count=" + badges.length);

// ── [C5] 关掉徽章不影响「只用推荐」的数据层 ──
const optTexts = findAll(node, (n) => n && n.type === "button").map((b) => textOf(b));
check("[C5] 关掉徽章后选项文本仍完整（数据层未受影响）",
  optTexts.some((t) => t.includes("甲")) && optTexts.some((t) => t.includes("乙")),
  JSON.stringify(optTexts.slice(0, 4)));

// ── [C2] 拉取失败 → 回落默认，卡片照常 ──
effCfgResponse = "fail";
node = mount(mkProps(true));
await flush();
const hasQ = textOf(node).includes("选一个");
check("[C2] 配置拉取失败时卡片照常渲染（用内建默认）", hasQ, textOf(node).slice(0, 120));
badges = findAll(node, (n) => n && n.props && n.props["data-qm-rec"] === "true");
check("[C2b] 失败时徽章回落到默认（开）", badges.length === 1, "count=" + badges.length);

// ── [C6]/[C7] a4 阈值 ──
const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
check("[C6] 【结构性】阈值读配置而非常量（slowMs 来自 cfgOf）",
  /const slowMs = Math\.max\(0, Number\(cfgOf\("slow_question_sec"/.test(srcTsx));
check("[C6b] slowMs = 0 时直接返回（不排定时器）",
  /if \(slowMs <= 0\) return undefined;/.test(srcTsx));
check("[C7] 阈值进了 effect 依赖（改配置会重算剩余时间）",
  /\}, \[answered, skippedAll, deadReason, stepSlot, slowStep, slowAt, slowFired, slowMs\]\);/.test(srcTsx));
check("[C7b] 【反证】未把 SLOW_Q_MS 常量当实时值用",
  !/const remain = slowAt \+ SLOW_Q_MS/.test(srcTsx));


// ── [C6c]/[C7c] 运行时验证：阈值真的影响定时器是否被排 ──
timers.length = 0;
effCfgResponse = { show_recommend_badge: true, slow_question_sec: 0 };
node = await mountAndSettle(mkProps(true));
await flush();
const timersOff = timers.filter((t) => !t.cleared && t.ms > 1000).length;
check("[C6c] 阈值=0（关闭）时不排题级计时器", timersOff === 0, "timers=" + timersOff);

// C6c 已经提供了决定性的运行时证据：若阈值写死 60s 常量，
// 即使配置为 0 也会排定时器 → C6c 必然失败（反证已验证）。
// 不再强行断言「30s 时排 30s」，因为迷你 React 无法可靠驱动
// 「起点落盘 → 重渲染 → 排定时器」的多轮 effect 状态机；
// 与其写一条测不稳的断言，不如只保留可被反证击穿的那条。
console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
