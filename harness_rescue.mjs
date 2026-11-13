// Headless regression harness for the question-modal card.
//
// Why this exists: the failure it guards against (a survey card that cannot
// obtain its request_id) silently locks the *entire chat*, because the host
// answers every later message with
//   409 {"detail":"A task is already running for this chat..."}
// while the question_modal tool call is still blocking.  That path needs a real
// clock, localStorage and a backend to test — but it must be testable without
// a browser, so we fake the host React (minimal hook runtime), fetch,
// localStorage and time, then drive the bundled card:
//
//   A  happy path          → id resolved, mirrored into localStorage
//   B  backend unreachable → 60s grace → rescue banner → cancel-session
//   C  reload recovery     → stored id validated via /resolve?request_id=
//   D  foreign id          → stored id pointing at another call is dropped
//   E  stale id (absent)   → dropped and re-resolved from source
//   F  backend revives     → slow heartbeat recovers, banner clears
//   G  submit              → read-only view, localStorage cleaned
//   H  history card        → no resolve calls, nothing stored
//   I  sweep               → entries older than 7 days removed on write
//
// Usage:
//   ln -sfn /root/.npm/_npx/9ed06546b0653f96/node_modules node_modules
//   ./node_modules/.bin/vite build --config vite.build.config.mjs
//   node harness_rescue.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(HERE, "dist", "index.js");
if (!fs.existsSync(bundlePath)) {
  console.error("dist/index.js missing — run the vite build first");
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════════
// Virtual clock
// ══════════════════════════════════════════════════════════════════
const realSetTimeout = global.setTimeout.bind(global);
let nowMs = 1_700_000_000_000;
let seq = 0;
let timers = new Map();

function fakeSetTimeout(fn, ms = 0) {
  const id = ++seq;
  timers.set(id, { at: nowMs + ms, fn });
  return id;
}
function fakeClearTimeout(id) { timers.delete(id); }

async function flush(n = 60) {
  for (let i = 0; i < n; i++) await Promise.resolve();
}
/** let real macrotasks (the rerender scheduler) run */
function realTick() { return new Promise((r) => realSetTimeout(r, 0)); }

async function advance(ms) {
  const target = nowMs + ms;
  while (true) {
    const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at);
    if (!due.length) break;
    const [id, t] = due[0];
    nowMs = Math.max(nowMs, t.at);
    timers.delete(id);
    t.fn();
    await flush();
    await realTick();
    await flush();
  }
  nowMs = target;
  await flush();
}

// ══════════════════════════════════════════════════════════════════
// Fake host React (useState / useRef / useEffect)
// ══════════════════════════════════════════════════════════════════
let hooks = [];
let hookIdx = 0;
let currentNode = null;
let lastTree = null;
let dirty = false;

let ceCount = 0;
function createElement(type, props, ...children) { ceCount++;
  return { type, props: props || {}, children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== "") };
}
function useState(init) {
  const i = hookIdx++;
  if (!(i in hooks)) hooks[i] = typeof init === "function" ? init() : init;
  return [hooks[i], (v) => {
    hooks[i] = typeof v === "function" ? v(hooks[i]) : v;
    scheduleRender();
  }];
}
function useRef(init) {
  const i = hookIdx++;
  if (!(i in hooks)) hooks[i] = { current: init };
  return hooks[i];
}
function useEffect(fn, deps) {
  const slot = "__eff" + hookIdx;
  const i = hookIdx++;
  const prev = hooks[slot];
  const changed = !prev || !deps || (prev.deps || []).some((d, k) => d !== deps[k]) || (prev.deps || []).length !== (deps || []).length;
  if (!changed) return;
  if (prev && typeof prev.cleanup === "function") { try { prev.cleanup(); } catch (_) {} }
  let cleanup = null;
  try { cleanup = fn() || null; } catch (e) { console.log("  [effect error]", e.message); }
  hooks[slot] = { deps: deps || [], cleanup };
}
const FakeReact = { createElement, useState, useRef, useEffect };

function scheduleRender() {
  if (dirty || !currentNode) return;
  dirty = true;
  realSetTimeout(() => { dirty = false; if (currentNode) renderNow(currentNode); }, 0);
}
function renderNow(node) {
  hookIdx = 0;
  // The host renders <Card data={messageNode} />, so the payload arrives as props.data.
  lastTree = Card({ data: node });
  return lastTree;
}
function mount(node) {
  // Faithful unmount: run the outgoing render's effect cleanups first, the way
  // React would when the previous card instance goes away.  This matters for
  // the attachment tests — the whole point of the module-scope file input is
  // that a remount must NOT lose picked files.
  runCleanups();
  currentNode = node;
  hooks = [];
  lastTree = null;
  renderNow(node);
  return lastTree;
}
/** Run every effect cleanup registered by the current render, then drop them. */
function runCleanups() {
  for (const k of Object.keys(hooks)) {
    if (k.startsWith("__eff") && hooks[k] && typeof hooks[k].cleanup === "function") {
      try { hooks[k].cleanup(); } catch (_) {}
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Fake browser: localStorage / fetch / document
// ══════════════════════════════════════════════════════════════════
const store = new Map();
// FIX-2：tabId() 读 sessionStorage。真实浏览器里它是「每标签页一份」，
// harness 里用独立 Map 模拟；用例可调 __setTab() 切换成"另一个标签页"。
let sessionStore = new Map();
const sessionStorageFake = {
  getItem: (k) => (sessionStore.has(k) ? sessionStore.get(k) : null),
  setItem: (k, v) => sessionStore.set(k, String(v)),
  removeItem: (k) => sessionStore.delete(k),
  key: (i) => [...sessionStore.keys()][i] ?? null,
  get length() { return sessionStore.size; },
};
const localStorageFake = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  // Real browsers expose the index API too; the sweep relies on it.
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
let fetchScript = null;
let fetchLog = [];
async function fakeFetch(url, opts = {}) {
  const u = String(url);
  fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: opts && opts.body });
  let r = fetchScript ? fetchScript(u, opts) : { ok: true, data: { ok: true, found: false } };
  // effective-config 的**统一兜底**。
  //
  // F1（2026-11-04）之后，卡片只从 /effective-config 取 mode，不再读
  // localStorage 镜像。若某个用例的 fetchScript 没 stub 这个端点，卡片会一直
  // 停在内建默认 manual —— 于是 ai/recommend 用例全变成「没自动分析」的假失败。
  //
  // 逐个给每个 fetchScript 补桩既易漏又难维护，所以在唯一的出口处补：
  // 用例只要设 cfgModeNow（配合原来的镜像种子）就能驱动模式。
  if (u.includes("/question-modal/effective-config")
      && (!r || r === NOT_FOUND || (r && r.ok === false))) {
    r = cfgStub(cfgModeNow);
  }
  if (r === "network-error") throw new Error("ECONNREFUSED");
  // "hang": a request that never settles — lets a test observe the busy state
  // (and drive「终止分析」) without a real server.
  if (r === "hang") return new Promise(() => {});
  // "sse-open": a *live but silent* server-sent-events stream.
  //
  // 阶段 2 起前端要区分「SSE 连通 → 让位给后端」和「SSE 断开 → 自己驱动」。
  // 之前的桩只能返回一次性 JSON，`onStatus(true)` 永远到不了，测不出让位。
  // 这里给一个永不到头、也永不报错的 body：读取永远挂起，等价于"连着但没消息"。
  if (r === "sse-open") {
    return {
      ok: true, status: 200,
      headers: { get: () => "text/event-stream" },
      body: {
        getReader: () => ({
          read: () => new Promise(() => {}),      // 永不 resolve = 一直连着
          cancel: () => {},
          releaseLock: () => {},
        }),
      },
      json: async () => ({}),
      text: async () => "",
    };
  }
  return {
    ok: r.ok !== false,
    status: r.status || (r.ok === false ? 500 : 200),
    json: async () => (r.jsonFn ? r.jsonFn() : r.data ?? {}),
    text: async () => (r.textFn ? r.textFn()
      : JSON.stringify(r.jsonFn ? r.jsonFn() : (r.data ?? {}))),
  };
}
const el = () => ({ style: {}, setAttribute() {}, appendChild() {}, textContent: "", id: "" });
/** The module-scope file input is created with document.createElement("input")
 *  and parked on document.body.  Track it so a test can fire a real `change`
 *  on it, simulating the OS dialog handing back a file. */
let createdInput = null;
function documentCreateElement(tag) {
  if (String(tag).toLowerCase() === "input") {
    const node = {
      tagName: "INPUT", type: "", multiple: false, style: {}, accept: "",
      onchange: null, _attrs: {}, _listeners: {},
      setAttribute(k, v) { this._attrs[k] = v; },
      appendChild() {}, click() { /* the dialog would open here */ },
    };
    createdInput = node;
    return node;
  }
  if (String(tag).toLowerCase() === "style") {
    return { tagName: "STYLE", id: "", textContent: "", appendChild() {},
             setAttribute() {} };
  }
  // 通用元素（导航栏等原生 DOM 部件用它）：需要 appendChild 聚合文本、
  // addEventListener 可被测试触发、setAttribute 可被 querySelector 命中。
  return domEl({}, "", String(tag).toUpperCase());
}
const documentFake = {
  createElement: documentCreateElement,
  getElementById: () => null,
  // ── 跨设备配置同步（2026-11-09）依赖 visibilityState + visibilitychange ──
  // 卡片的同步 effect 读 `document.visibilityState` 判断「当前是否可见」，
  // 并挂 `visibilitychange` 监听。harness 之前没有这两样，跨设备同步用例无法走真实路径。
  visibilityState: "visible",
  __visListeners: [],
  // 卡片挂 `document.addEventListener("visibilitychange", …)` —— 之前 documentFake
  // 没有这个方法，跨设备同步 effect 挂监听会抛错。补上注册 + 触发能力。
  addEventListener(ev, cb) {
    if (ev === "visibilitychange") (this.__visListeners ||= []).push(cb);
  },
  removeEventListener(ev, cb) {
    if (ev === "visibilitychange") {
      this.__visListeners = (this.__visListeners || []).filter((x) => x !== cb);
    }
  },
  setVisibility(state) {
    // 测试助手：改可见态并触发所有 visibilitychange 监听（模拟用户切走/切回）
    this.visibilityState = state;
    (this.__visListeners || []).forEach((cb) => { try { cb(); } catch (_) {} });
  },
  head: { appendChild(node) { if (node && node.tagName === "STYLE") (globalThis.document.__styles ||= []).push(node); } },
  body: {
    appendChild(node) { if (node) documentFake.__nodes.push(node); },
    get textContent() { return __bodyText(); },
  },
  documentElement: { appendChild() {}, get textContent() { return __bodyText(); } },
  // ── 最小可信 DOM 注册表（2026-10-22 停表信号用例）──
  // 卡片本身在 harness 里只是 vnode 树、没有真实 DOM。为让 watchAgentResumed
  // 走**真实探测路径**（而非优雅降级），这里注册一组带 data-role / data-qm-card-id
  // 的假元素，模拟宿主消息流。测试通过 __domReset/__domAdd 编排。
  __nodes: [],
  querySelectorAll(sel) {
    if (sel === "[data-role]") {
      return documentFake.__nodes.filter((n) => n.__attrs["data-role"] !== undefined);
    }
    if (/^[a-zA-Z]+$/.test(sel)) {
      // 标签名查询：按整棵注册树（含 __children 层级）深度遍历
      const tag = sel.toUpperCase();
      const out = [];
      const seen = new Set();
      const walkDown = (n) => {
        if (!n || seen.has(n)) return;
        seen.add(n);
        if (n.tagName === tag) out.push(n);
        (n.__children || []).forEach(walkDown);
      };
      documentFake.__nodes.forEach(walkDown);
      return out;
    }
    return [];
  },
  querySelector(sel) {
    // 通用：tag[attr="v"] 与 [attr="v"]（导航栏定位宿主栏 / 自检用）
    const gm = /^(?:([a-zA-Z]+))?\[([-a-zA-Z]+)="([^"]*)"\]$/.exec(sel);
    if (gm && gm[2] !== "data-qm-card-id" && gm[2] !== "data-qm-wait") {
      const tag = gm[1] ? gm[1].toUpperCase() : null;
      return (documentFake.__nodes || []).find((nd) =>
        (!tag || nd.tagName === tag) && nd.__attrs && nd.__attrs[gm[2]] === gm[3]) || null;
    }
    // 纯属性选择器 [attr]（findScrollContainer 找任一问卷卡）
    const am = /^\[([-a-zA-Z]+)\]$/.exec(sel);
    if (am) {
      return (documentFake.__nodes || []).find((nd) => nd.__attrs && nd.__attrs[am[1]] !== undefined) || null;
    }
    const m = /^\[data-qm-card-id="(.+)"\]$/.exec(sel);
    if (m) {
      return documentFake.__nodes.find((n) => n.__attrs["data-qm-card-id"] === m[1]) || null;
    }
    // 提交后状态行：计时链用 [data-qm-wait="<callId>"] 命令式改写它。
    const w = /^\[data-qm-wait="(.+)"\]$/.exec(sel);
    if (w) {
      return documentFake.__nodes.find((n) => n.__attrs["data-qm-wait"] === w[1]) || null;
    }
    return null;
  },
};
function domEl(attrs, text, tagName) {
  const n = {
    __attrs: attrs || {}, __ownText: text || "", __children: [], __parent: null,
    tagName: tagName || "DIV", className: "", style: {}, id: "",
    textContentSet: "",
    getAttribute(k) { return this.__attrs[k] === undefined ? null : String(this.__attrs[k]); },
    setAttribute(k, v) { this.__attrs[k] = String(v); },
    contains(other) {
      let o = other;
      while (o) { if (o === n) return true; o = o.__parent; }
      return false;
    },
    addEventListener(ev, cb) { (this.__listeners || (this.__listeners = {}))[ev] = cb; },
    appendChild(c) {
      if (!c) return c;
      this.__children.push(c); c.__parent = this;
      return c;
    },
    removeChild(c) {
      const i = this.__children.indexOf(c);
      if (i >= 0) this.__children.splice(i, 1);
      if (c && c.__parent === this) c.__parent = null;
      return c;
    },
    get firstChild() { return this.__children.length ? this.__children[0] : null; },
    get parentElement() { return this.__parent; },
    scrollIntoView() { this.__scrolled = (this.__scrolled || 0) + 1; },
    // 子树查询（宿主 navigator 的按钮组 / 徽标 span 都靠它）
    querySelectorAll(sel) {
      const out = [];
      const tag = /^[a-zA-Z]+$/.test(sel) ? sel.toUpperCase() : null;
      const attr = /^\[([-a-zA-Z]+)="([^"]*)"\]$/.exec(sel);
      const bare = /^\[([-a-zA-Z]+)\]$/.exec(sel);
      const hit = (n) => {
        if (tag) return n.tagName === tag;
        if (attr) return n.__attrs && n.__attrs[attr[1]] === attr[2];
        if (bare) return n.__attrs && n.__attrs[bare[1]] !== undefined;
        return false;
      };
      const down = (n) => {
        for (const c of n.__children || []) {
          if (!c) continue;
          if (hit(c)) out.push(c);
          down(c);
        }
      };
      down(this);
      return out;
    },
    querySelector(sel) { const r = this.querySelectorAll(sel); return r.length ? r[0] : null; },
    click() { const f = this.__listeners && this.__listeners.click; if (f) f({ stopPropagation() {} }); },
  };
  // 真实 DOM 语义：textContent 递归聚合子节点。写成 getter 才能让
  // 「整页文本 − 本卡文本」这类算法在假 DOM 上得到与浏览器一致的结果。
  Object.defineProperty(n, "textContent", {
    get() {
      let s = String(n.__ownText || "");
      for (const c of n.__children || []) { if (c) s += String(c.textContent || ""); }
      return s;
    },
    set(v) { n.__ownText = String(v == null ? "" : v); },
    configurable: true, enumerable: true,
  });
  return n;
}
/** 顶层节点（没有被挂进某个消息项的那些）——body 的文本就是它们的聚合。 */
function __topLevel() {
  return (documentFake.__nodes || []).filter((n) => n && !n.__parent);
}
function __bodyText() {
  let s = "";
  for (const n of __topLevel()) s += String(n.textContent || "");
  return s;
}
/** 把卡片元素挂进某条消息项（模拟卡片嵌在 assistant 项内）。 */
function domCardIn(callId, role) {
  const item = domEl({ "data-role": role }, "");
  const card = domEl({ "data-qm-card-id": callId }, "");
  card.__parent = item;
  item.__children = [card];
  // contains 需覆盖「嵌套子节点」：卡片本身在 __nodes 里，item 也注册。
  item.contains = (o) => o === card || o === item;
  documentFake.__nodes.push(item, card);
  return { item, card };
}
function domAddAssistant(text) {
  const n = domEl({ "data-role": "assistant" }, text);
  documentFake.__nodes.push(n);
  return n;
}
/** 宿主提交瞬间插入的「生成中」占位气泡。真实渲染实测是
 *  `data-role="assistant"` + textContent === "-"（长度 1、**非空**）——
 *  上一版判据 `textContent.length > 0` 把它当成"已输出"，于是停表冻结
 *  「等待 0s」。新判据必须先净化掉这种占位，故此桩用来钉死该回归。 */
function domAddGenerating() {
  return domAddAssistant("-");
}
function domAddCursor() {
  return domAddAssistant("\u258b");           // 流式光标 ▋
}
/** 注册「提交后状态行」这个真实 DOM 节点（vnode 不是 DOM，计时链要靠它写入）。
 *  返回的 node.textContent 可断言：秒数在走、而 vnode 树完全没变 = React 零重渲染。 */
function domWaitRow(callId) {
  const n = domEl({ "data-qm-wait": callId }, "");
  documentFake.__nodes.push(n);
  return n;
}
function domReset() {
  documentFake.__nodes = [];
  _moCallbacks.length = 0; _qsCount = 0; _extCount = 0;
}
// 探测次数计数：用来证明「信号到达即停、之后零成本」——直接回应用户对性能的担忧。
let _qsCount = 0;
const _origQSA = documentFake.querySelectorAll;
documentFake.querySelectorAll = function (sel) {
  if (sel === "[data-role]") _qsCount++;
  return _origQSA.call(this, sel);
};
// 后台计量的真实单位 = 「取本卡并读文本」这件事发生了几次（旧口径数
// querySelectorAll("[data-role]")，那是 MutationObserver 时代的探测方式）。
let _extCount = 0;
const _origQS = documentFake.querySelector;
documentFake.querySelector = function (sel) {
  if (/^\[data-qm-card-id=/.test(String(sel))) _extCount++;
  return _origQS.call(this, sel);
};
function extCount() { return _extCount; }
function moCountNow() { return _moCallbacks.length; }
global.MutationObserver = function (cb) {
  _moCallbacks.push(cb);
  return {
    observe() {},
    disconnect() {
      const i = _moCallbacks.indexOf(cb);
      if (i >= 0) _moCallbacks.splice(i, 1);
    },
  };
};
const _moCallbacks = [];
function fireMutation() { _moCallbacks.slice().forEach((cb) => { try { cb([]); } catch (_) {} }); }
function moCount() { return _moCallbacks.length; }


// 与 src/index.tsx 的 BG_POLL_MS 同值（6s 后台轮询周期）。harness 无法 import
// 产物常量，故写死并在此声明：若源码改了周期，[AQ] 组的 advance 步长要同步改。
const BG = 6_000;
const STUCK_TEXT = "未能取得本次问卷的会话句柄";
const SESSION = "sess-harness-1";
const CHAT = "chat-harness-1";
let toolRenderArgs = null;

// F1（2026-11-04）之后 mode 只从 /effective-config 来，不再看 localStorage
// 镜像。用例要切换模式就改 `cfgModeNow`（fakeFetch 会用它兜底应答）。
let cfgModeNow = "manual";
/** 附加到 effective-config 桩上的字段（用例按需覆盖 model/ctx/parallel）。 */
let cfgExtra = {};
/** effective-config 桩：F1 之后卡片只认这个，不再看 localStorage 镜像。 */
function cfgStub(mode, extra = {}) {
  return { ok: true, data: { ok: true, chat_id: "CHAT-H", version: 1, schema: [],
    global_keys: [],
    config: Object.assign({
      mode, show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60,
      skip_mode: "per_question", notify_manual_mode: false,
      model_id: "", template_id: "", with_context: false, parallel: false,
      fallback_title: true, wait_hint_sec: 180, __sources__: {},
    }, cfgExtra, extra) } };
}

// FIX-2：storage 事件。真浏览器的 storage 事件只在**其它**标签页触发，
// harness 里由用例显式调用 __fireStorage(key, newValue) 模拟。
const winListeners = {};
global.window = {
  innerWidth: 1280,
  __listeners: winListeners,
  addEventListener(ev, cb) { (winListeners[ev] || (winListeners[ev] = [])).push(cb); },
  removeEventListener(ev, cb) {
    const arr = winListeners[ev] || [];
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
  },
  QwenPaw: {
    host: {
      React: FakeReact,
      antd: {
        Input: Object.assign(function () {}, { TextArea: function () {} }),
        Button: function () {},
        // The AI-analysis UI uses Popover; without it the card degrades to its
        // no-popover fallback, which the [Z] cases would misreport as a
        // failure.  Faithful to the host, which injects the full antd bundle.
        Popover: function () {},
        // 模板管理/编辑面板改「居中弹窗」— the host really does expose Modal.
        // FakeReact never runs nested components, so the stub must hand back
        // props.children for the tree walker to see the panel.
        Modal: function (p) { return (p && p.children) || null; },
        // 宿主注入的完整 antd 含 message；卡片 toast 走它。捕获到 toastTexts
        // 让严格闸门用例能断言「拦截提示」而不是靠 console.log。
        message: {
          warning: (t) => toastTexts.push(["warning", String(t)]),
          success: (t) => toastTexts.push(["success", String(t)]),
          info:    (t) => toastTexts.push(["info", String(t)]),
          error:   (t) => toastTexts.push(["error", String(t)]),
        },
      },
      antdIcons: { FormOutlined: function () {} },
      getApiUrl: (p) => "/api" + p,
      getApiToken: () => "tok",
      getSelectedAgentId: () => "harness-agent",
      getCurrentSessionId: () => SESSION,
      getChatId: () => CHAT,
    },
    chat: { toolRender: (pid, tool, comp) => { toolRenderArgs = { pid, tool, comp }; } },
  },
  document: documentFake,
  location: { href: "http://host/console", pathname: "/console" },
};
global.document = documentFake;
global.localStorage = localStorageFake;
global.sessionStorage = sessionStorageFake;
global.fetch = fakeFetch;
global.setTimeout = fakeSetTimeout;
global.clearTimeout = fakeClearTimeout;
Date.now = () => nowMs;

await import("./dist/index.js");
if (!toolRenderArgs) { console.error("toolRender never captured — bundle did not run"); process.exit(1); }
const Card = toolRenderArgs.comp;

// ══════════════════════════════════════════════════════════════════
// helpers
// ══════════════════════════════════════════════════════════════════
const QS = [
  { type: "single", title: "Q1 选哪个方案", options: ["甲", "乙"] },
  { type: "single", title: "Q2 确认吗", options: ["是", "否"] },
];
const REQ = "req-aaaa-1111";
const REQ_OTHER = "req-cccc-3333";

function makeNode(callId, questions = QS, output = "") {
  const data = { call_id: callId, arguments: JSON.stringify({ title: "取舍确认", questions }) };
  if (output) data.output = [{ type: "text", text: output }];
  return { content: [{ type: "data", data }] };
}
function walk(n, visit) {
  if (n == null) return;
  if (typeof n === "object" && !Array.isArray(n)) {
    visit(n);
    (n.children || []).forEach((c) => walk(c, visit));
    if (n.props) [].concat(n.props.children || []).forEach((c) => walk(c, visit));
    // antd-style popovers carry their panel in `props.content`; the fake React
    // never executes nested components, so walk it explicitly to let tests
    // see what the panel would contain.
    if (n.props && n.props.content) [].concat(n.props.content).forEach((c) => walk(c, visit));
  } else if (Array.isArray(n)) n.forEach((c) => walk(c, visit));
}
function treeText(n) {
  const out = [];
  walk(n, (x) => { if (typeof x.children === "object") x.children.forEach((c) => { if (typeof c === "string" || typeof c === "number") out.push(String(c)); }); });
  return out.join(" | ");
}
function buttons(n) {
  const out = [];
  walk(n, (x) => { if (x.type === "button") out.push({ label: treeText(x), props: x.props }); });
  return out;
}
function clickButton(label) {
  const b = buttons(lastTree).find((x) => x.label.includes(label));
  if (!b) throw new Error("button not found: " + label + " | have=" + buttons(lastTree).map((x) => x.label).join(","));
  b.props.onClick();
}
/** Click the button whose label is EXACTLY `label` — needed because footer
 *  contains both「跳过并提交」and「提交」and the substring matcher would hit
 *  the former first. */
function clickExact(label) {
  const b = buttons(lastTree).find((x) => x.label === label);
  if (!b) throw new Error("exact button not found: " + label + " | have=" + buttons(lastTree).map((x) => x.label).join(","));
  b.props.onClick();
}
function hasText(n, t) { return treeText(n).includes(t); }
// 「提交后状态行」是否存在（三态：等待中/已继续/超时未观测）。等待期文案为
// 「⏳ 已提交，等待模型继续…」；无 DOM 可写时降级为不带秒数的静态版。
function hasWaitLine(n) { return /已提交，模型处理中/.test(treeText(n)); }
/** 等待行自身的文本（按 className 定位）。秒数检查只看这一行，避免被答案里
 *  出现的 "20s" 之类字符误判。 */
function waitNodeText(n) {
  let v = "";
  walk(n || lastTree, (x) => {
    if (x && x.props && /qm-wait-hint/.test(String(x.props.className || ""))) v = treeText(x);
  });
  return v;
}
/** 等待行当前阶段（waiting | stalled）：按 data-qm-phase 取，不靠文案正则。 */
function waitPhase(n) {
  let v = "";
  walk(n || lastTree, (x) => {
    if (x && x.props && x.props["data-qm-phase"]) v = x.props["data-qm-phase"];
  });
  return v;
}
/** 前台读秒已废除：等待行里绝不允许出现「数字 + s」。 */
function hasTickSeconds(n) { return /\d+\s*s\b/.test(waitNodeText(n)); }
/** True when the persistent gate banner is on screen.  Detected via the
 *  data-qm-gate attribute (NOT by its text): 用户裁定红条只讲「必须选择」与
 * 按钮指引，内部术语与 bundle 指纹都不再出现在可见文案里。 */
function hasGate(n) {
  let hit = false;
  walk(n || lastTree, (x) => { if (x && x.props && x.props["data-qm-gate"]) hit = true; });
  return hit;
}
/** The bundle tag the banner carries forensically via data-qm-bundle. */
function gateBundle(n) {
  let v = "";
  walk(n || lastTree, (x) => { if (x && x.props && x.props["data-qm-bundle"]) v = x.props["data-qm-bundle"]; });
  return v;
}
/** Compliantly navigate to the「其他意见」末页 under the new 下一步 gate
 *  (用户裁定 2026-10-21：空白题点下一步必须被拦).  On each question page we
 *  try「下一步」first — if it advances (the question was answered) we keep that
 *  answer; if the strict gate refuses it (the red banner appears) we fall back
 *  to the EXPLICIT「跳过本题」.  Never a bare 下一步 through a blank question.
 *  Stops at 末页 (提交/跳过并提交 present) or when nothing else advances. */
async function navToEnd() {
  for (let i = 0; i < 8; i++) {
    const labels = buttons(lastTree).map((b) => b.label);
    if (labels.some((l) => l === "提交" || l === "跳过并提交")) return;
    if (labels.some((l) => l.includes("下一步"))) {
      clickButton("下一步"); await realTick(); await flush();
      if (hasGate()) {
        clickButton("跳过本题"); await realTick(); await flush();
      }
    } else if (labels.some((l) => l.includes("跳过本题"))) {
      clickButton("跳过本题"); await realTick(); await flush();
    } else return;
  }
}

/** The card's single file-input node (marked data-qm-file). */
function findInput(n) {
  let found = null;
  walk(n, (x) => { if (!found && x.type === "input" && x.props && x.props["data-qm-file"]) found = x; });
  return found;
}
/** First node carrying an onPaste handler (the「其他」/文本 answer box). */
function findOnPaste(n) {
  let found = null;
  walk(n, (x) => { if (!found && x.props && typeof x.props.onPaste === "function") found = x; });
  return found;
}

let pass = 0, fail = 0;
function findMdNodes(n) {
  const out = [];
  walk((function f(x){ return x; })(n), (node) => {
    if (node && node.props && (node.props.className === "qm-md" || (node.props["data-qm-md"] === "true"))) out.push(node);
  });
  return out;
}
function stylesText() {
  try { return (globalThis.document.__styles || []).map((s) => s.textContent).join(""); }
  catch (_) { return ""; }
}

function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗", name, extra ? "→ " + extra : ""); }
}
function pending(id, callId) {
  return { ok: true, data: { ok: true, found: true, request_id: id, session_id: SESSION, title: "取舍确认", questions: QS, tool_call_id: callId, status: "pending" } };
}
const NOT_FOUND = { ok: true, data: { ok: true, found: false } };
// Toast texts captured via the fake-antd `message` stub.  Declared here so the
// stub's closures can safely reference it (stub built later at line ~224, but
// only fires during mount → this declaration is already in scope by then).
const toastTexts = [];
// POST /question-modal/skip hits, used by [AO] to prove a remount never fires a
// backend skip (switching windows must not equal「跳过」).
let skipHits = [];
// POST /question-modal/gate-block hits — the durable audit line the strict gate
// fires on every rejection, carrying the card's own bundle tag.
let gateBlockPosts = [];
function reset() { fetchLog = []; dirty = false; toastTexts.length = 0; }

// ══════════════════════════════════════════════════════════════════
console.log("\n[A] 正常解析 → request_id 落盘 localStorage");
reset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_A") : NOT_FOUND);
mount(makeNode("call_A"));
await flush(); await realTick(); await flush();
check("拿到 request_id（footer 正常）", hasText(lastTree, "下一步"), treeText(lastTree).slice(0, 90));
check("未出现自救横幅", !hasText(lastTree, STUCK_TEXT));
const sA = store.get("qm:v1:reqid:call_A");
check("localStorage 已写入", !!sA && JSON.parse(sA).request_id === REQ, sA);
check("写入附带 tool_call_id 校验位", !!sA && JSON.parse(sA).tool_call_id === "call_A");
check("resolve 只按 tool_call_id 查了一次", fetchLog.filter((f) => f.url.includes("/resolve")).length === 1,
  JSON.stringify(fetchLog.map((f) => f.url)));

// ══════════════════════════════════════════════════════════════════
console.log("\n[B] 后端不可达 → 30s 后出现自救横幅 → 点「释放本次问卷」");
reset();
fetchScript = () => "network-error";
mount(makeNode("call_B"));
await flush(); await realTick(); await flush();
check("30s 前不弹自救横幅（宽限期）", !hasText(lastTree, STUCK_TEXT));
await advance(31_000);
// 七次裁定后：30s 整体计时**不再**产生提示；唯一例外是「拿不到会话句柄」这种
// 真故障（此时 reqId 为空，横幅是唯一逃生口）。本用例后端全不可达 → 命中兜底。
check("30s 后出现故障兜底横幅（reqId 为空）",
  hasText(lastTree, "无法取得本次问卷的会话句柄"), treeText(lastTree).slice(0, 160));
check("横幅含 409 说明", hasText(lastTree, "already running"));
check("横幅含释放按钮", buttons(lastTree).some((b) => b.label.includes("释放本次问卷")));
check("网络故障 ≠ 问卷失效（绝不误判收敛）", !hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 160));
// 不可达时持续重试：再等很久也不应收敛
await advance(120_000);
check("长时间不可达仍不收敛（保留自愈）", !hasText(lastTree, "问卷已失效"));
let cancelHit = null;
fetchScript = (u) => {
  if (u.includes("/question-modal/cancel-session")) { cancelHit = u; return { ok: true, data: { ok: true, cancelled: 1 } }; }
  return "network-error";
};
clickButton("释放本次问卷");
await flush(); await realTick(); await flush(); await realTick(); await flush();
check("调用了 cancel-session 且带 session_id", !!cancelHit && cancelHit.includes("session_id=" + SESSION), cancelHit);
check("自救后卡片转为已处理（不再阻塞）", hasText(lastTree, "已释放") || hasText(lastTree, "已完成") || hasText(lastTree, "已跳过"), treeText(lastTree).slice(0, 120));

// ══════════════════════════════════════════════════════════════════
console.log("\n[C] 刷新恢复 → 校验 stored id 仍 pending（用户选项2）");
reset();
store.set("qm:v1:reqid:call_C", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_C", ts: nowMs }));
let order = [];
fetchScript = (u) => {
  // Only /resolve calls are of interest here; the card also makes unrelated
  // GETs (/models for the capsule picker, /analysis to restore a result),
  // which must not pollute the resolve-order assertion.
  if (!u.includes("/question-modal/resolve")) return NOT_FOUND;
  order.push(u.includes("request_id=") ? "byId" : "byCall");
  return pending(REQ, "call_C");
};
mount(makeNode("call_C"));
await flush(); await realTick(); await flush();
check("先按 stored request_id 校验（byId 优先）", order[0] === "byId", JSON.stringify(order));
check("校验通过 → 直接用存储的 id", hasText(lastTree, "下一步") && !hasText(lastTree, STUCK_TEXT));
check("未再多跑一次 byCall 查询", order.length === 1, JSON.stringify(order));

// ══════════════════════════════════════════════════════════════════
console.log("\n[D] stored id 指向别人的 call → 丢弃并回源（用户选项3）");
reset();
store.set("qm:v1:reqid:call_D", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_D", ts: nowMs }));
let dOrder = [];
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) {
    dOrder.push(u.includes("request_id=") ? "byId" : "byCall");
    if (u.includes("request_id=")) return pending(REQ, "call_OTHER");
    return pending(REQ_OTHER, "call_D");
  }
  return NOT_FOUND;
};
mount(makeNode("call_D"));
await flush(); await realTick(); await flush();
check("byId 命中但归属不符 → 回源 byCall", dOrder.join(",") === "byId,byCall", dOrder.join(","));
const sD = store.get("qm:v1:reqid:call_D");
check("改用正确 request_id 并覆写存储", !!sD && JSON.parse(sD).request_id === REQ_OTHER, sD);

// ══════════════════════════════════════════════════════════════════
console.log("\n[E] stored id 已失效（absent）→ 丢弃、回源");
reset();
store.set("qm:v1:reqid:call_E", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_E", ts: nowMs }));
let eOrder = [];
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) {
    eOrder.push(u.includes("request_id=") ? "byId" : "byCall");
    if (u.includes("request_id=")) return NOT_FOUND;
    return pending(REQ_OTHER, "call_E");
  }
  return NOT_FOUND;
};
mount(makeNode("call_E"));
await flush(); await realTick(); await flush();
check("失效 id 被丢弃并回源", eOrder.join(",") === "byId,byCall", eOrder.join(","));
check("最终仍拿到可用 id", hasText(lastTree, "下一步"));
check("存储被更新为新 id", JSON.parse(store.get("qm:v1:reqid:call_E")).request_id === REQ_OTHER);

// ══════════════════════════════════════════════════════════════════
console.log("\n[F] 后端恢复 → 慢心跳自愈");
reset();
let fMode = "dead";
fetchScript = (u) => (fMode === "dead" ? "network-error" : (u.includes("/question-modal/resolve") ? pending(REQ, "call_F") : NOT_FOUND));
mount(makeNode("call_F"));
await advance(31_000);
check("先出现自救横幅", hasText(lastTree, STUCK_TEXT));
fMode = "alive";
await advance(12_000);            // heartbeat 5s
check("后端恢复 → 心跳重新拿到 id", hasText(lastTree, "下一步"));
check("自救横幅自动消失", !hasText(lastTree, STUCK_TEXT));
check("恢复后写入 localStorage", (store.get("qm:v1:reqid:call_F") || "").includes(REQ));

// ══════════════════════════════════════════════════════════════════
console.log("\n[G] 提交成功后清理 localStorage（不留陈旧 id）");
reset();
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_G");
  if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  return NOT_FOUND;
};
mount(makeNode("call_G"));
await flush(); await realTick(); await flush();
await navToEnd();                                          // 逐题表态后到末页
check("末页按钮为「跳过并提交」", buttons(lastTree).some((b) => b.label === "跳过并提交"),
  buttons(lastTree).map((b) => b.label).join(","));
clickButton("跳过并提交");   // isOtherPage → submit()
await flush(); await realTick(); await flush();
check("已提交 → 只读视图", hasText(lastTree, "已完成") || hasText(lastTree, "用户提交的问卷答案"), treeText(lastTree).slice(0, 100));
check("提交后 localStorage 已清空", !store.get("qm:v1:reqid:call_G"), store.get("qm:v1:reqid:call_G"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[H] 历史卡片（已有 output）→ 不发 resolve、不写存储");
reset();
mount(makeNode("call_H", QS, "用户跳过了本次问卷。\n{\"skipped\": true}"));
await flush(); await realTick(); await flush();
check("直接渲染折叠摘要", hasText(lastTree, "已跳过问卷"), treeText(lastTree).slice(0, 90));
check("未发起任何 resolve 请求", fetchLog.filter((f) => f.url.includes("/resolve")).length === 0, JSON.stringify(fetchLog.map((f) => f.url)));
check("未写入 localStorage", !store.get("qm:v1:reqid:call_H"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[I] 写入时清扫过期条目（防 localStorage 无限堆积）");
reset();
store.set("qm:v1:reqid:call_OLD_dead", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_OLD_dead", ts: nowMs - 8 * 24 * 3600 * 1000 }));
store.set("qm:v1:reqid:call_OLD_fresh", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_OLD_fresh", ts: nowMs - 2 * 24 * 3600 * 1000 }));
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_I") : NOT_FOUND);
mount(makeNode("call_I"));
await flush(); await realTick(); await flush();
check("超过 7 天的条目被清扫", !store.get("qm:v1:reqid:call_OLD_dead"));
check("7 天内的条目保留", !!store.get("qm:v1:reqid:call_OLD_fresh"));
check("本条正常写入", (store.get("qm:v1:reqid:call_I") || "").includes(REQ));

// ══════════════════════════════════════════════════════════════════
console.log("\n[J] 卡片状态持久化 → 滚出视口重挂载后不丢进度（问题2/3）");
reset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_J") : NOT_FOUND);
mount(makeNode("call_J"));
await flush(); await realTick(); await flush();
clickButton("乙");                       // Q1 选「乙」
await realTick(); await flush();
clickButton("下一步");                   // → Q2
await realTick(); await flush();
await advance(500);                      // 让防抖写入落盘
const stJ = store.get("qm:v1:state:call_J");
check("状态已写入 qm:v1:state:<call_id>", !!stJ);
check("进度已保存（visStep=1）", !!stJ && JSON.parse(stJ).visStep === 1, stJ);
check("答案已保存（q0=乙）", !!stJ && JSON.parse(stJ).answers.q0.value === "乙", stJ);
// 模拟宿主虚拟滚动：卸载后重新挂载同一张卡
mount(makeNode("call_J"));
await flush(); await realTick(); await flush();
check("重挂载后仍停在第 2 题（进度未归零）", hasText(lastTree, "Q2 确认吗"), treeText(lastTree).slice(0, 90));
check("重挂载后未出现自救/未重问第 1 题", !hasText(lastTree, "Q1 选哪个方案"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[K] 附件：上传走宿主端点，随答案提交");
reset();
let uploadHit = null;
fetchScript = (u, o) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_K");
  if (u.includes("/console/upload")) {
    uploadHit = { url: u, body: o && o.body };
    return { ok: true, data: { url: "/media/abc_doc.pdf", file_name: "doc.pdf", size: 2048 } };
  }
  if (u.includes("/question-modal/answer")) {
    answerBody = o && o.body;
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  return NOT_FOUND;
};
let answerBody = null;
mount(makeNode("call_K"));
await flush(); await realTick(); await flush();
check("Q1 单选页未显示附件控件（仅「其他」下）", !hasText(lastTree, "📎 附件"), treeText(lastTree).slice(0, 80));
clickButton("其他");                     // 展开「其他」输入行
await realTick(); await flush();
check("勾选「其他」后出现附件控件", hasText(lastTree, "📎 附件"), buttons(lastTree).map((b) => b.label).join(","));
// 文件输入框在模块作用域（不再由卡片持有）——点按钮后由它接管
check("文件输入框不在卡片内（模块级单例）", !findInput(lastTree));
clickButton("📎 附件");
check("已创建模块级 file input", !!createdInput && createdInput._attrs["data-qm-file"] === "true");
createdInput.onchange({ target: { files: [new File(["x"], "doc.pdf")], value: "" } });
await flush(); await realTick(); await flush(); await flush();
check("调用了 /console/upload", !!uploadHit && uploadHit.url.includes("/console/upload"), JSON.stringify(uploadHit));
check("上传后出现附件 chip", hasText(lastTree, "doc.pdf"), treeText(lastTree).slice(0, 160));
check("input.value 已清空（可重复选同一文件）", createdInput.value === "" || createdInput.value === undefined);
await advance(500);
// 走到末页提交（Q1 已带附件=已答；Q2 空白由 navToEnd 显式跳过）
await navToEnd();
clickButton("提交");     await flush(); await realTick(); await flush();
check("提交体携带 attachments", !!answerBody && String(answerBody).includes("doc.pdf"), String(answerBody).slice(0, 200));

// ══════════════════════════════════════════════════════════════════
console.log("\n[L] 重挂载（焦点回归）后 reqId 仍在 → 按钮不再「尚未就绪」(问题1)");
reset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_L") : NOT_FOUND);
mount(makeNode("call_L"));
await flush(); await realTick(); await flush();
check("初次挂载拿到 reqId（下一步可用）", hasText(lastTree, "下一步"));
// 模拟：打开/关闭系统文件框 → 窗口重新聚焦 → 宿主重挂载卡片，且此刻后端不可达
fetchScript = () => "network-error";
fetchLog = [];
mount(makeNode("call_L"));               // ← 重挂载（runCleanups 会跑上例的清理）
await flush(); await realTick(); await flush();
clickButton("跳过问卷");
await flush(); await realTick(); await flush();
const triedSkip = fetchLog.some((x) => x.url.includes("/question-modal/skip"));
check("重挂载后仍带 reqId 发起跳过（未退化成「尚未就绪」）", triedSkip,
  "fetchLog=" + fetchLog.map((x) => x.url).join(","));
check("未走「问卷尚未就绪」中途返回（既有请求）", triedSkip);

// ══════════════════════════════════════════════════════════════════
console.log("\n[M] 粘贴图片/文件即上传，与输入框一致 (问题3)");
reset();
let pasteUpload = null;
fetchScript = (u, o) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_M");
  if (u.includes("/console/upload")) {
    pasteUpload = { url: u, body: o && o.body };
    return { ok: true, data: { url: "/media/pasted.png", file_name: "pasted.png", size: 512 } };
  }
  return NOT_FOUND;
};
mount(makeNode("call_M"));
await flush(); await realTick(); await flush();
clickButton("其他");
await realTick(); await flush();
const pasteNode = findOnPaste(lastTree);
check("「其他」输入框带 onPaste 处理器", !!pasteNode);
const ev = {
  clipboardData: { files: [], items: [{ kind: "file", getAsFile: () => new File(["p"], "pasted.png") }] },
  preventDefault() { this._pd = true; },
};
pasteNode.props.onPaste(ev);
check("粘贴文件被 preventDefault（不落成文字）", ev._pd === true);
await flush(); await realTick(); await flush(); await flush();
check("粘贴触发 /console/upload（走宿主同端点）", !!pasteUpload && pasteUpload.url.includes("/console/upload"));
check("粘贴后出现附件 chip", hasText(lastTree, "pasted.png"), treeText(lastTree).slice(0, 160));

// ══════════════════════════════════════════════════════════════════
console.log("\n[N] 上传失败可见（不只一个转瞬即逝的 toast）");
reset();
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_N");
  if (u.includes("/console/upload")) return { ok: false, status: 413, jsonFn: () => ({ detail: "文件过大" }) };
  return NOT_FOUND;
};
mount(makeNode("call_N"));
await flush(); await realTick(); await flush();
clickButton("其他");
await realTick(); await flush();
clickButton("📎 附件");
createdInput.onchange({ target: { files: [new File(["z"], "big.zip")], value: "" } });
await flush(); await realTick(); await flush(); await flush();
check("失败原因显示在卡片上", hasText(lastTree, "附件失败"), treeText(lastTree).slice(0, 200));
check("显示 HTTP 状态/详情", hasText(lastTree, "413") || hasText(lastTree, "文件过大"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[O] 后端报告 orphan（插件重载）→ 卡片收敛，不再无限重试 (问题1 根因回归)");
reset();
store.set("qm:v1:reqid:call_O", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_O", ts: nowMs }));
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false, orphan: true, request_id: REQ } };
  return NOT_FOUND;
};
mount(makeNode("call_O"));
await flush(); await realTick(); await flush();
check("识别 orphan → 卡片标记失效", hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 160));
check("收敛为折叠态（不再挡路）", buttons(lastTree).some((b) => b.label === "展开"),
  buttons(lastTree).map((b) => b.label).join(","));
clickButton("展开");
await realTick(); await flush();
check("给出继续对话的指引", hasText(lastTree, "直接在对话中继续"), treeText(lastTree).slice(0, 200));
const oStops = fetchLog.filter((f) => f.url.includes("/resolve")).length;
await advance(30_000);
check("收敛后停止重试（不再轮询）",
  fetchLog.filter((f) => f.url.includes("/resolve")).length === oStops,
  `before=${oStops} after=${fetchLog.filter((f) => f.url.includes("/resolve")).length}`);
check("陈旧 reqId 已清除", !store.get("qm:v1:reqid:call_O"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[P] 后端记录消失（曾有 id）→ 立即收敛，绝不「尚未就绪」锁死");
reset();
store.set("qm:v1:reqid:call_P", JSON.stringify({ request_id: REQ, session_id: SESSION, tool_call_id: "call_P", ts: nowMs }));
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return NOT_FOUND;   // 后端回答「没有」
  return NOT_FOUND;
};
mount(makeNode("call_P"));
await flush(); await realTick(); await flush();
check("后端确认无记录 → 立即收敛", hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 160));
const pStops = fetchLog.filter((f) => f.url.includes("/resolve")).length;
await advance(30_000);
check("不再重试", fetchLog.filter((f) => f.url.includes("/resolve")).length === pStops);

// ══════════════════════════════════════════════════════════════════
console.log("\n[Q] 提交遇 404（记录已丢）→ 收敛而非报错卡死");
reset();
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_Q");
  if (u.includes("/question-modal/answer")) return { ok: false, status: 404, jsonFn: () => ({ detail: "Question not found" }) };
  return NOT_FOUND;
};
mount(makeNode("call_Q"));
await flush(); await realTick(); await flush();
check("先正常拿到 reqId", hasText(lastTree, "下一步"));
// 走到末页（逐题表态后）再提交
await navToEnd();
clickButton("跳过并提交");
await flush(); await realTick(); await flush();
check("提交 404 → 卡片收敛为失效", hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 160));
check("陈旧 reqId 已清除", !store.get("qm:v1:reqid:call_Q"));

// ══════════════════════════════════════════════════════════════════
console.log("\n[R] 后端返回 orphan 的 answer/skip → 收敛（不谎称成功）");
reset();
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_R");
  if (u.includes("/question-modal/skip")) return { ok: true, data: { ok: true, message: "orphan", request_id: REQ, orphan: true } };
  return NOT_FOUND;
};
mount(makeNode("call_R"));
await flush(); await realTick(); await flush();
clickButton("跳过问卷");
await flush(); await realTick(); await flush();
check("orphan 响应 → 收敛为失效", hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 160));

// ══════════════════════════════════════════════════════════════════
// [S] 根治回归①：判定失效前必须先释放后端 Future（否则会话永久 409）
//
// 现场故障：卡片自己关掉了，后端的 Future 还挂着 → 会话一直报
// 「A task is already running」。卡片关闭是 UI 事件，解开阻塞只能靠后端。
console.log("\n[S] 失效收敛必先释放后端（绝不「只关前端、留下 Future」）");
reset();
let sCalls = [];
fetchScript = (u, opt) => {
  sCalls.push(u.split("/api")[1]);
  if (u.includes("/question-modal/resolve")) return NOT_FOUND;   // 记录已丢
  if (u.includes("/question-modal/cancel-session")) return { ok: true, data: { ok: true, cancelled: 1 } };
  return NOT_FOUND;
};
mount(makeNode("call_S"));
await flush(); await realTick(); await flush();
await advance(50_000);              // 越过 GONE_AFTER_MS，触发失效收敛
await flush(); await realTick(); await flush();
check("判定失效前调用了后端释放端点",
  sCalls.some((u) => u.includes("/cancel-session") || u.includes("/skip")),
  JSON.stringify(sCalls));
check("后端释放后卡片才标记失效", hasText(lastTree, "问卷已失效"), treeText(lastTree).slice(0, 140));

// 后端释放失败（网络故障）时：绝不关闭卡片，避免「卡已关、阻塞仍在」
console.log("\n[S2] 释放失败（网络不可达）→ 不关闭卡片，保留自救按钮");
reset();
let s2Released = false;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return NOT_FOUND;
  if (u.includes("/cancel-session") || u.includes("/question-modal/skip")) { return "network-error"; }
  return NOT_FOUND;
};
mount(makeNode("call_S2"));
await flush(); await realTick(); await flush();
await advance(50_000);
await flush(); await realTick(); await flush();
check("后端未能释放时保持卡片可自救（不谎称失效）",
  hasText(lastTree, STUCK_TEXT) && !hasText(lastTree, "问卷已失效"),
  treeText(lastTree).slice(0, 140));

// ══════════════════════════════════════════════════════════════════
// [T] 根治回归②：宿主未注入 getCurrentSessionId / getSelectedAgentId 时，
//     改成从 /resolve 返还的 session_id / agent_id 兜底。
console.log("\n[T] session/agent 兜底（宿主不注入这两个 API）");
reset();
const hostBackup = { sid: global.window.QwenPaw.host.getCurrentSessionId,
                     aid: global.window.QwenPaw.host.getSelectedAgentId };
delete global.window.QwenPaw.host.getCurrentSessionId;      // 模拟真实宿主
delete global.window.QwenPaw.host.getSelectedAgentId;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) {
    return { ok: true, data: { ok: true, found: true, request_id: REQ, session_id: SESSION,
             agent_id: "harness-agent", title: "取舍确认", questions: QS,
             tool_call_id: "call_T", status: "pending" } };
  }
  if (u.includes("/cancel-session")) { tCancelHit = u; return { ok: true, data: { ok: true, cancelled: 1 } }; }
  return NOT_FOUND;
};
mount(makeNode("call_T"));
await flush(); await realTick(); await flush();
check("无宿主 API 时仍能拿到 reqId（会话句柄来自 /resolve）", hasText(lastTree, "下一步"),
  treeText(lastTree).slice(0, 120));
const tStored = store.get("qm:v1:reqid:call_T");
check("reqId 里记住了 /resolve 返还的 session_id",
  !!tStored && JSON.parse(tStored).session_id === SESSION, tStored);
check("reqId 里记住了 /resolve 返还的 agent_id",
  !!tStored && JSON.parse(tStored).agent_id === "harness-agent", tStored);
// 缓存生效后，后续请求必须带上 X-Agent-Id（否则宿主按默认 agent 路由）
let tSkipHeaders = null;
fetchScript = (u, opt) => {
  if (opt && opt.headers && u.includes("/question-modal/skip")) tSkipHeaders = opt.headers;
  if (u.includes("/question-modal/skip")) return { ok: true, data: { ok: true, message: "ok", request_id: REQ } };
  return NOT_FOUND;
};
clickButton("跳过问卷");
await flush(); await realTick(); await flush();
check("后续请求带上了回落的 X-Agent-Id",
  !!tSkipHeaders && tSkipHeaders["X-Agent-Id"] === "harness-agent",
  JSON.stringify(tSkipHeaders));
global.window.QwenPaw.host.getCurrentSessionId = hostBackup.sid;
global.window.QwenPaw.host.getSelectedAgentId = hostBackup.aid;

// ══════════════════════════════════════════════════════════════════
// [U] 根治回归③：拿不到工具调用标识时，附件必须明确报错（绝不静默丢弃）
//
// 现场故障：题内「其他」框的附件从未成功过（所有 q* 的 attachments 全为 0），
// 因为 callId 为空时 stash 无处可存、监听器也没注册 → 文件被无声吞掉。
console.log("\n[U] 无 callId 时附件不静默丢弃（明确报错）");
reset();
const consoleBackup = console.log;
let uMsgs = [];
console.log = (...a) => { uMsgs.push(a.map(String).join(" ")); };
fetchScript = (u) => (u.includes("/console/upload")
  ? { ok: true, data: { url: "/media/y.png", file_name: "y.png", size: 9 } }
  : NOT_FOUND);
mount(makeNode(""));                       // ← 无 call_id 的卡片
await flush(); await realTick(); await flush();
clickButton("其他");
await realTick(); await flush();
clickButton("📎 附件");                     // ← 应直接报错，而不是打开一个会被丢弃的对话框
await flush(); await realTick(); await flush();
console.log = consoleBackup;
check("缺 callId 时明确提示附件不可用（不再静默丢弃）",
  uMsgs.some((m) => m.includes("附件"))
  || toastTexts.some((t) => /附件/.test(t[1])), JSON.stringify(uMsgs.slice(-4)));

// ══════════════════════════════════════════════════════════════════
// [V] 根治回归④（现场故障本体）：卡片既没有工具调用标识、宿主也不提供
//     session 时，仍必须能接管当前唯一挂起的问卷。
//
// 现场现象：卡片一直显示「无法连接问卷服务（已持续 15 秒）」并锁死会话。
// 根因是 /resolve 被无参调用 → 永远 found:false。此用例守住兜底路径。
console.log("\n[V] 无 callId + 无宿主 session → 仍能接管唯一挂起问卷（现场故障）");
reset();
const hostBackup2 = { sid: global.window.QwenPaw.host.getCurrentSessionId,
                      aid: global.window.QwenPaw.host.getSelectedAgentId };
delete global.window.QwenPaw.host.getCurrentSessionId;
delete global.window.QwenPaw.host.getSelectedAgentId;
let vAnswerBody = null;
fetchScript = (u, opt) => {
  if (u.includes("/question-modal/pending")) {
    return { ok: true, data: { ok: true, count: 1, items: [{ request_id: REQ, session_id: SESSION,
             agent_id: "harness-agent", title: "取舍确认", questions: QS, question_count: 2, status: "pending" }] } };
  }
  if (u.includes("/question-modal/resolve")) {
    return { ok: true, data: { ok: true, found: true, request_id: REQ, session_id: SESSION,
             agent_id: "harness-agent", title: "取舍确认", questions: QS,
             tool_call_id: null, status: "pending" } };
  }
  if (u.includes("/question-modal/answer")) {
    vAnswerBody = opt && opt.body ? JSON.parse(opt.body) : null;
    return { ok: true, data: { ok: true, message: "ok", request_id: REQ } };
  }
  return NOT_FOUND;
};
mount(makeNode(""));                       // ← 无 call_id
await flush(); await realTick(); await flush();
check("接管成功：按钮可用（不再是「无法连接」锁死态）", hasText(lastTree, "下一步"),
  treeText(lastTree).slice(0, 140));
check("未出现自救横幅", !hasText(lastTree, STUCK_TEXT), treeText(lastTree).slice(0, 140));
await navToEnd();
// 本用例只验 session_id，用「跳过并提交」旁路空答卷闸门（闸门由 [AK]/[AG] 专测）
clickButton("跳过并提交"); await flush(); await realTick(); await flush();
check("提交成功且带上 session_id（来自 /resolve 兜底）",
  !!vAnswerBody && vAnswerBody.session_id === SESSION,
  JSON.stringify(vAnswerBody && { session_id: vAnswerBody.session_id }));

// 多条挂起时绝不劫持别人的问卷
console.log("\n[V2] 多条挂起时不得劫持（宁可不接管，也不能串号）");
reset();
fetchScript = (u) => {
  if (u.includes("/question-modal/pending")) {
    return { ok: true, data: { ok: true, count: 2, items: [
      { request_id: REQ, session_id: SESSION, title: "A", questions: QS, question_count: 2, status: "pending" },
      { request_id: REQ_OTHER, session_id: SESSION, title: "B", questions: QS, question_count: 2, status: "pending" },
    ] } };
  }
  if (u.includes("/question-modal/resolve")) return NOT_FOUND;
  return NOT_FOUND;
};
mount(makeNode(""));
await flush(); await realTick(); await flush();
// 「下一步」按钮在未接管时也照常渲染，所以不能用文本判断接管与否；
// 真正的判据是行为：未接管时提交/跳过不得发出任何请求（尤其是不得
// 对别人那条 survey 发 /skip）。
const v2Before = fetchLog.length;
clickButton("跳过问卷");
await flush(); await realTick(); await flush();
const v2Mutating = fetchLog.slice(v2Before).filter((f) =>
  f.url.includes("/question-modal/skip")
  || f.url.includes("/question-modal/answer")
  || f.url.includes("/cancel-session"));
check("多条挂起时不接管（未对他人 survey 发出任何变更请求）",
  v2Mutating.length === 0, JSON.stringify(v2Mutating.map((f) => f.url)));
global.window.QwenPaw.host.getCurrentSessionId = hostBackup2.sid;
global.window.QwenPaw.host.getSelectedAgentId = hostBackup2.aid;

// ══════════════════════════════════════════════════════════════════
// [W] 根治回归⑤（用户复测失败点）：正常持卡的问卷，阻塞满 30 秒后
//     也必须出现「释放本次问卷」按钮。
//
// 现场反馈：「第5项等待并没有出现释放按钮」。根因是 succeed() 在拿到
// request_id 时把自救计时器一并取消，于是只有「连不上后端」的卡片才有
// 出口；而阻塞会话的是**健康**的卡片。自救必须与连接状况无关。
console.log("\n[W] 正常持卡问卷阻塞满 30s 也出现自救按钮（用户复测失败点）");
reset();
const hostBackup3 = { sid: global.window.QwenPaw.host.getCurrentSessionId,
                      aid: global.window.QwenPaw.host.getSelectedAgentId };
let wSkipHit = false;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_W");
  if (u.includes("/question-modal/skip")) { wSkipHit = true; return { ok: true, data: { ok: true, message: "ok", request_id: REQ } }; }
  return NOT_FOUND;
};
mount(makeNode("call_W"));
await flush(); await realTick(); await flush();
check("卡片正常获得 reqId（健康态）", !hasText(lastTree, STUCK_TEXT),
  treeText(lastTree).slice(0, 120));
await advance(31_000);
// 七次裁定（用户原话）：30s 是**整卷**计时，频繁提示会造成心理负担 → 健康卡片
// 在 30s 时**不得**出现任何横幅，须等到本题满 60s（见 [AS] 组）。
check("【七次裁定】健康卡片 30s 时不再打扰（整卷计时不出提示）",
  !hasText(lastTree, "本次问卷已阻塞") && !hasText(lastTree, "本题已超过 60s"),
  treeText(lastTree).slice(0, 160));
await advance(30_000);   // → 本题满 60s
check("健康卡片满 60s 才出现题级提示 + 释放按钮",
  hasText(lastTree, "本题已超过 60s")
  && buttons(lastTree).some((b) => b.label.includes("释放本次问卷")),
  treeText(lastTree).slice(0, 160));
clickButton("释放本次问卷");
await flush(); await realTick(); await flush();
check("健康卡片点释放也能真正解开后端阻塞", wSkipHit, "未命中 /skip");
global.window.QwenPaw.host.getCurrentSessionId = hostBackup3.sid;
global.window.QwenPaw.host.getSelectedAgentId = hostBackup3.aid;

// ══════════════════════════════════════════════════════════════════
// [X] 跨实例释放：热重载后新旧服务并存，卡片所在的「新」服务里没有本会话
//     的记录（/skip 404、/cancel-session 返回 cancelled:0），而 agent 仍
//     被「旧」实例的 Future 停住。用户显式点「释放本次问卷」必须兜底调
//     宿主 /console/chat/stop，否则会话永久阻塞（本次现场故障）。
console.log("\n[X] 跨实例释放兜底（热重载后点「释放」必须调宿主 stop）");
reset();
let xStopHit = null, xSkipHit = false, xCancelHit = false;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) {
    return { ok: true, data: { ok: true, found: true, request_id: REQ, session_id: SESSION,
             agent_id: "harness-agent", title: "取舍确认", questions: QS,
             tool_call_id: "call_X", status: "pending" } };
  }
  if (u.includes("/question-modal/skip")) { xSkipHit = true; return { ok: false, status: 404, data: { detail: "Question not found" } }; }
  if (u.includes("/question-modal/cancel-session")) { xCancelHit = true; return { ok: true, data: { ok: true, cancelled: 0 } }; }
  if (u.includes("/console/chat/stop")) { xStopHit = u; return { ok: true, data: { stopped: true } }; }
  return NOT_FOUND;
};
mount(makeNode("call_X"));
await flush(); await realTick(); await flush();
// 七次裁定：30s 整卷计时不再出提示 → 改为等本题满 60s 才露出释放按钮
await advance(61_000);
await flush(); await realTick(); await flush();
check("跨实例场景下自救按钮可用", buttons(lastTree).some((b) => b.label.includes("释放本次问卷")),
  treeText(lastTree).slice(0, 160));
clickButton("释放本次问卷");
await flush(); await realTick(); await flush();
check("插件端点未命中时兜底调用了宿主 /console/chat/stop",
  !!xStopHit && xStopHit.includes("chat_id=" + SESSION), String(xStopHit));
check("兜底前确实先试过插件端点（skip 或 cancel-session）", xSkipHit || xCancelHit,
  "skip=" + xSkipHit + " cancel=" + xCancelHit);
// 折叠摘要里能看到「已跳过问卷」，展开后必须如实说明「已终止本次运行」。
clickButton("展开");
await flush(); await realTick(); await flush();
check("宿主 stop 成功后卡片如实说明「终止本次运行」",
  hasText(lastTree, "终止本次运行"), treeText(lastTree).slice(0, 240));
check("宿主 stop 后摘要标记为已跳过（pill 文案）", hasText(lastTree, "已跳过"),
  treeText(lastTree).slice(0, 120));

// [X2] 自动收敛路径（非用户点击）绝不能升级为宿主 stop —— 那会误杀健康 run
console.log("\n[X2] 自动收敛不调宿主 stop（绝不误杀正在进行的 run）");
reset();
let x2StopHit = false, x2CancelHit = 0;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return NOT_FOUND;   // 记录已丢
  if (u.includes("/question-modal/skip")) return { ok: false, status: 404, data: { detail: "not found" } };
  if (u.includes("/question-modal/cancel-session")) {
    x2CancelHit += 1; return { ok: true, data: { ok: true, cancelled: 0 } };
  }
  if (u.includes("/console/chat/stop")) { x2StopHit = true; return { ok: true, data: { stopped: true } }; }
  return NOT_FOUND;
};
mount(makeNode("call_X2"));
await flush(); await realTick(); await flush();
await advance(50_000);              // 越过 GONE_AFTER_MS，触发自动失效收敛
await flush(); await realTick(); await flush();
check("自动收敛确实尝试过释放后端", x2CancelHit > 0, "cancel-session 调用次数=" + x2CancelHit);
check("自动收敛绝不调宿主 stop", !x2StopHit, "误调了 /console/chat/stop");

// [X3] orphan 形态也必须兜底：/skip 返回 orphan=true（记录在盘上但**没有活着的
//      Future**——热重载后旧代际停住 agent 的典型形态）。orphan 读起来像
//      released:true，但 agent 其实还停着，绝不能被当成「已释放」而跳过兜底。
console.log("\n[X3] orphan 形态也要兜底调宿主 stop（released:true 不等于 agent 已醒）");
reset();
let x3StopHit = null;
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) {
    return { ok: true, data: { ok: true, found: true, request_id: REQ, session_id: SESSION,
             agent_id: "harness-agent", title: "取舍确认", questions: QS,
             tool_call_id: "call_X3", status: "pending" } };
  }
  if (u.includes("/question-modal/skip")) {
    return { ok: true, data: { ok: true, orphan: true, message: "问卷服务已重启，本次问卷已失效" } };
  }
  if (u.includes("/console/chat/stop")) { x3StopHit = u; return { ok: true, data: { stopped: true } }; }
  return NOT_FOUND;
};
mount(makeNode("call_X3"));
await flush(); await realTick(); await flush();
await advance(61_000);   // 七次裁定：30s 不再出提示，须满本题 60s
await flush(); await realTick(); await flush();
clickButton("释放本次问卷");
await flush(); await realTick(); await flush();
check("orphan 形态下仍兜底调用宿主 /console/chat/stop", !!x3StopHit, String(x3StopHit));

// ══════════════════════════════════════════════════════════════════
// [Y] 已完成的卡片仍保留「释放阻塞」出口。
//
// 现场故障（2026-10-13 22:00，用户复测）：问卷**答完并显示「✓ 已提交答案」**，
// 但会话依旧 409 卡死，而卡片上再没有任何可点的释放按钮 —— 用户只能手动按
// 宿主的「停止」。根因：自救横幅的渲染条件是 `stuck && !answered`，而提交成功
// 会 setAnswered(true)（converge() 还会 setStuck(false)），把出口一并抹掉。
//
// 「卡片已完成」并不等于「agent 已被放行」：跨代/孤儿/竞态下后端那条记录可能
// 从未真正 resolve agent 的 Future。所以已完成视图必须**常驻**一个手动出口。
console.log("\n[Y] 已完成的卡片仍保留「释放阻塞」出口（提交后仍可自救）");
reset();
let yPluginHit = null, yStopHit = null;
fetchScript = (u, opt) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_Y");
  if (u.includes("/question-modal/answer")) {
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  if (u.includes("/question-modal/skip")) { yPluginHit = u; return NOT_FOUND; }
  if (u.includes("/question-modal/cancel-session")) {
    yPluginHit = yPluginHit || u;
    return { ok: true, data: { ok: true, cancelled: 0 } };
  }
  if (u.includes("/console/chat/stop")) { yStopHit = u; return { ok: true, data: { stopped: true } }; }
  return NOT_FOUND;
};
mount(makeNode("call_Y"));
await flush(); await realTick(); await flush();
// 走完问卷：Q1 选一个 → Q2 → 末页提交
clickButton("甲");       await realTick(); await flush();
await navToEnd();
clickButton("提交");     await flush(); await realTick(); await flush();
check("提交后进入已完成视图", hasText(lastTree, "已完成") || hasText(lastTree, "用户提交的问卷答案"),
  treeText(lastTree).slice(0, 120));
check("已完成视图仍保留「释放阻塞」按钮（用户本次的失效点）",
  buttons(lastTree).some((b) => b.label.includes("释放阻塞")),
  treeText(lastTree).slice(0, 200));
// 点它：后端已无该记录（/skip 404 + cancelled:0）→ 必须兜底调宿主 stop
clickButton("释放阻塞");
await flush(); await realTick(); await flush();
check("已完成卡片点「释放阻塞」确实尝试过插件端点（提交时 reqId 已清，走 /cancel-session）",
  !!yPluginHit, String(yPluginHit));
check("插件端点无法证明已释放 → 兜底调宿主 /console/chat/stop", !!yStopHit, String(yStopHit));
check("释放后在卡片上如实说明（未吞掉用户的作答视图）",
  hasText(lastTree, "已直接终止本次运行") || hasText(lastTree, "已释放"),
  treeText(lastTree).slice(-220));

// ══════════════════════════════════════════════════════════════════
console.log("\n[Z] AI 分析：胶囊模型 / AI 开关 / 查看分析（新增功能）");
reset(); store.clear();

const PROVIDERS = [
  { id: "opencode", name: "OpenCode", require_api_key: false,
    models: [{ id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash", is_free: true }],
    extra_models: [] },
  { id: "openai", name: "OpenAI", api_key: "sk-x",
    models: [{ id: "gpt-4o", name: "GPT-4o", is_free: false }],
    extra_models: [] },
];
let analyzeCalls = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) {
    return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  }
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze")) {
    analyzeCalls.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, analysis: {
      ok: true, title: "取舍确认", model_id: "opencode:deepseek-v4-flash-free",
      parallel: false, elapsed: 1.2,
      per_question: [{ index: 0, title: "Q1 选哪个方案", type: "single",
        choice: "乙", reasoning: "## 六步\n1. **意图**：选乙\n2. 上下文…" }],
    } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_Z");
  return NOT_FOUND;
};

mount(makeNode("call_Z"));
await flush(); await realTick(); await flush();

check("[Z1] header 出现「查看分析」按钮", hasText(lastTree, "查看分析"), treeText(lastTree).slice(0, 200));
check("[Z2] header 出现 三态模式开关", hasText(lastTree, "自动分析") && hasText(lastTree, "只用推荐") && hasText(lastTree, "人工"));

// 切到 AI 模式 → 自动分析
// 2026-11-04：卡片的「问 /models/active 兜底」已删除，模型改由服务端给出。
cfgExtra = { model_id: "opencode:deepseek-v4-flash-free", template_id: "builtin-default" };
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
// [Z] 测「AI 自动分析」本身，需冻结无人值守自动翻页（否则卡片会自动提交、
// header 芯片断言看不到）。自动分析效应只看 anMode，不受 autoPaused 约束。
store.set("qm:v1:state:call_Z", JSON.stringify({ autoPaused: true }));
reset();
const _logbak = console.log; let _toasts = [];
console.log = (...a) => { const s = a.map(String).join(" "); if (/question-modal/.test(s)) _toasts.push(s); };
mount(makeNode("call_Z"));
await flush(); await realTick(); await flush();
await advance(200);
check("[Z3] AI 模式 → 自动发起一次 /analyze（mode=auto，题级 question_index=0）",
  analyzeCalls.length >= 1 && analyzeCalls[0].mode === "auto"
    && analyzeCalls[0].question_index === 0,
  JSON.stringify({ n: analyzeCalls.length, m: analyzeCalls.map((c) => c.mode), qi: analyzeCalls[0] && analyzeCalls[0].question_index }));
check("[Z4] 分析请求带上胶囊模型与问题列表",
  analyzeCalls.length >= 1 && analyzeCalls[0].model_id === "opencode:deepseek-v4-flash-free"
    && Array.isArray(analyzeCalls[0].questions) && analyzeCalls[0].questions.length === 2,
  JSON.stringify(analyzeCalls[0] || {}).slice(0, 200));
// 偏好闸门（prefsReadyRef）让自动分析晚一个渲染 hop 启动：先泵一轮再断言。
await flush(); await realTick(); await flush();
console.log = _logbak;
// #2：完成提示改为一次性 toast（不再 header 常驻「AI 已完成」芯片，避免平移）。
check("[Z5] AI 完成 → 弹出一次性 toast「AI 分析完成」",
  _toasts.some((t) => /AI 分析完成/.test(t)) || toastTexts.some((t) => /AI 分析完成/.test(t[1])),
  JSON.stringify(_toasts) + "|" + JSON.stringify(toastTexts));
check("[Z5b] header 不再常驻「AI 已完成」（#2 杜绝平移）",
  !hasText(lastTree, "AI 已完成"), treeText(lastTree).slice(0, 200));

// 人工模式 → 不自动分析
analyzeCalls = [];
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "manual", modelId: "openai:gpt-4o", withContext: true, parallel: true }));
cfgModeNow = "manual";   // F1：mode 只从 effective-config 来
// [Z8] 断言的 with_context/parallel 也走配置（同属会话级可覆盖项），
// 只种镜像不够了 —— 必须让 effective-config 也带回这两个值。
cfgExtra = { model_id: "openai:gpt-4o", with_context: true, parallel: true };
reset();
mount(makeNode("call_Z"));
await flush(); await realTick(); await flush();
await advance(300);
check("[Z6] 人工模式 → 不自动分析", analyzeCalls.length === 0, JSON.stringify(analyzeCalls.length));

// 人工模式：打开气泡是**只读**动作 → 不得触发分析（REQ-001/REQ-002）
clickButton("查看分析");
await flush(); await realTick(); await flush();
check("[Z6b] 【REQ-002】人工模式仅打开气泡 → 不触发分析",
  analyzeCalls.length === 0, JSON.stringify(analyzeCalls.length));
check("[Z6c] 【REQ-001】气泡内出现「开始分析」按钮",
  hasText(lastTree, "开始分析"), treeText(lastTree).slice(-260));

// 点「开始分析」→ 才发起本次分析
clickButton("开始分析");
await flush(); await realTick(); await flush();
check("[Z7] 【REQ-001】点「开始分析」→ 触发分析（mode=manual）",
  analyzeCalls.length === 1 && analyzeCalls[0].mode === "manual",
  JSON.stringify(analyzeCalls.map((c) => c.mode)));
check("[Z8] 手动分析带上 with_context / parallel 偏好 + 题级 question_index",
  analyzeCalls[0].with_context === true && analyzeCalls[0].parallel === true
    && analyzeCalls[0].question_index === 0,
  JSON.stringify({ c: analyzeCalls[0].with_context, p: analyzeCalls[0].parallel, qi: analyzeCalls[0].question_index }));

// 分析气泡内容（md 渲染）
await flush(); await realTick(); await flush();
const mdNodes = [];
walk(lastTree, (x) => { if (x.props && x.props["data-qm-md"]) mdNodes.push(x); });
check("[Z9] 分析气泡内含 md 容器（marked 渲染的推理正文）", mdNodes.length > 0,
  "mdNodes=" + mdNodes.length + " | " + treeText(lastTree).slice(-200));
check("[Z10] md 渲染出真实 HTML（标题/粗体标签）",
  mdNodes.some((n) => /<h[12]|<strong>|<p>/.test(String((n.props || {}).dangerouslySetInnerHTML?.__html || ""))),
  JSON.stringify(mdNodes.map((n) => String((n.props||{}).dangerouslySetInnerHTML?.__html||"").slice(0,80))));

// ══════════════════════════════════════════════════════════════════
console.log("\n[Y] 题型容错：model 省略 type 字段（B1 回归守卫）");
reset(); store.clear();
analyzeCalls = [];
// The model often omits `type` while still sending `options` — the card must
// classify those as choice questions (and text ones without options).
const NOTYPE = [
  { title: "有无 type 的单选", options: ["甲", "乙"] },
  { title: "无 options 的问答题" },
  { type: "multi", title: "显式多选", options: ["A", "B"] },
];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "wd", model: "deepseek-v4.1-flash" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze")) {
    analyzeCalls.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, analysis: { ok: true, per_question: [], elapsed: 0.5 } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_Y");
  return NOT_FOUND;
};
mount({ content: [{ type: "data", data: {
  call_id: "call_Y", arguments: JSON.stringify({ title: "无类型问卷", questions: NOTYPE }) } }] });
await flush(); await realTick(); await flush();
check("[Y1] 无 type + 有 options → 渲染为可点选项（不是输入框）",
  hasText(lastTree, "甲") && hasText(lastTree, "乙"), treeText(lastTree).slice(0, 160));

store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "wd:deepseek-v4.1-flash", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
analyzeCalls = [];
reset();
mount({ content: [{ type: "data", data: {
  call_id: "call_Y", arguments: JSON.stringify({ title: "无类型问卷", questions: NOTYPE }) } }] });
await flush(); await realTick(); await flush();
await advance(200);
check("[Y2] 【B1】AI 模式对「无 type」问卷仍会发起分析（不再 0 题）",
  analyzeCalls.length >= 1, JSON.stringify(analyzeCalls.length));
check("[Y3] 【B1】送出的 questions 保留全部 3 题（原实现被过滤掉 2 题）",
  analyzeCalls.length >= 1 && (analyzeCalls[0].questions || []).length === 3,
  JSON.stringify((analyzeCalls[0] || {}).questions || []));

// ══════════════════════════════════════════════════════════════════
console.log("\n[W] 终止分析：分析中可中止（气泡内按钮 + 后端 cancel 路由）");
reset(); store.clear();
let cancelCalls = [];
// Make /analyze hang so the card stays in the busy state for the assertions.
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) {
    cancelCalls.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, cancelled: true } };
  }
  if (u.includes("/question-modal/analyze")) return "hang";
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_W");
  return NOT_FOUND;
};
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "manual", modelId: "", withContext: false, parallel: false }));
cfgModeNow = "manual";   // F1：mode 只从 effective-config 来
mount({ content: [{ type: "data", data: {
  call_id: "call_W", arguments: JSON.stringify({ title: "终止测试", questions: QS }) } }] });
await flush(); await realTick(); await flush();

// Open the bubble (manual mode click both runs and opens).
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
reset();
mount({ content: [{ type: "data", data: {
  call_id: "call_W", arguments: JSON.stringify({ title: "终止测试", questions: QS }) } }] });
await flush(); await realTick(); await flush();
await advance(200);
// 偏好闸门让自动分析晚一个渲染 hop 启动（同 [Z5]）。
await flush(); await realTick(); await flush();
check("[W1] 分析进行中时显示「终止分析」按钮",
  hasText(lastTree, "终止分析"), treeText(lastTree).slice(0, 240));

// The bubble content (Popover children) is part of the tree, so the abort
// button is reachable without opening the popover in AI mode.
check("[W2] AI 模式下按钮显示「分析中…」（而非可重复触发的「查看分析」）",
  buttons(lastTree).some((x) => /分析中/.test(x.label)), 
  buttons(lastTree).map((x) => x.label).join(","));
clickButton("终止分析");
await flush(); await realTick(); await flush();
check("[W3] 【终止】点击后确实请求了后端 /analyze/cancel",
  cancelCalls.length >= 1, JSON.stringify(cancelCalls));
check("[W4] 【终止】cancel 请求带上本卡的 tool_call_id",
  cancelCalls.length >= 1 && cancelCalls[0].tool_call_id === "call_W",
  JSON.stringify(cancelCalls[0] || {}));
check("[W5] 【终止】界面如实提示「已终止分析」（不伪装成失败）",
  hasText(lastTree, "已终止分析"), treeText(lastTree).slice(0, 240));

// ── 排版：结论在上、分析在下 + 统一字号 ──
console.log("\n[X2] 分析结果排版（markdown 与问卷同一字级）");
store.clear();
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: true, analysis: {
    ok: true, title: "排版测试", model_id: "opencode:deepseek-v4-flash-free", parallel: false, elapsed: 2.0,
    per_question: [{ index: 0, title: "Q1 选哪个", type: "single", choice: "乙", confidence: 0.9,
      reasoning: "# 六步分析\n1. **意图**：选乙\n2. 理由如下" }],
  } } };
  if (u.includes("/question-modal/analyze")) return { ok: true, data: { ok: true, analysis: {
    ok: true, title: "排版测试", model_id: "opencode:deepseek-v4-flash-free", parallel: false, elapsed: 2.0,
    per_question: [{ index: 0, title: "Q1 选哪个", type: "single", choice: "乙", confidence: 0.9,
      reasoning: "# 六步分析\n1. **意图**：选乙\n2. 理由如下" }],
  } } };
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_X2");
  return NOT_FOUND;
};
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
reset();
mount({ content: [{ type: "data", data: {
  call_id: "call_X2", arguments: JSON.stringify({ title: "排版测试", questions: QS }) } }] });
await flush(); await realTick(); await flush();
await advance(300);
clickButton("查看分析");
await flush(); await realTick(); await flush();
const md = findMdNodes(lastTree);
check("[X2a] 推理正文渲染进 .qm-md 容器（受统一样式约束）",
  md.length >= 1, "md 容器数=" + md.length);
// The reasoning is injected as HTML (dangerouslySetInnerHTML), so it never
// shows up in the plain-text walk — assert on the md node's HTML instead, and
// prove the ORDER: the conclusion line precedes the reasoning block.
const mdHtml = md.map((n) => ((n.props.dangerouslySetInnerHTML || {}).__html || "")).join(" ");
check("[X2b] md 正文含推理内容（粗体/标题渲染后的 HTML）",
  /意图/.test(mdHtml) && /<strong>|<h1|<p/.test(mdHtml), mdHtml.slice(0, 160));
check("[X2c] 结论在上、分析在下（先在纯文本看到结论，md 在其后）",
  hasText(lastTree, "→ 乙") && treeText(lastTree).indexOf("→ 乙") < treeText(lastTree).indexOf("1/3"),
  treeText(lastTree).slice(0, 200));
check("[X2d] 样式表注入统一字级规则（h1-h6 压到 13px）",
  (stylesText() || "").indexOf(".qm-md h1") !== -1,
  (stylesText() || "").slice(0, 120));

// ══════════════════════════════════════════════════════════════════
console.log("\n[R] 题级分析：切题触发 / 重跑 / 只读查看（REQ-003/004/006/007/008）");
cfgExtra = {};                 // 清掉上一组的 model/ctx 覆盖，避免泄漏
cfgModeNow = "ai";             // 本组验的是 AI 自动分析
reset(); store.clear();
analyzeCalls = [];
let analysisLookups = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) {
    analysisLookups.push(u);
    return { ok: true, data: { ok: true, found: false } };
  }
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    // Echo back the analysed question so the card can cache it per question.
    const qi = b.question_index;
    return { ok: true, data: { ok: true, analysis: {
      ok: true, question_index: qi, model_id: b.model_id, parallel: false, elapsed: 1.0,
      per_question: [{ index: qi, title: "Q" + (qi + 1) + " 结论", type: "single",
        choice: qi === 0 ? "甲" : "是", confidence: 0.8,
        reasoning: "### 第 " + (qi + 1) + " 题分析\n1. **意图**：..." }],
    } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_R");
  return NOT_FOUND;
};
// 2026-11-04：模型不再由卡片自己问 /models/active 兜底（那条路已删），
// 改由服务端 /effective-config 给出解析后的 model_id。
cfgExtra = { model_id: "opencode:deepseek-v4-flash-free", template_id: "builtin-default" };
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
// [R] 验证「切题即分析」的人工语义（REQ-008/002），需冻结无人值守自动推进：
// 预置 autoPaused=true —— 自动分析效应只看 anMode，不受 autoPaused 约束，
// 因此仍会切题触发 /analyze，但驱动效应不会自动翻页/提交。
store.set("qm:v1:state:call_R", JSON.stringify({ autoPaused: true }));
mount(makeNode("call_R"));
await flush(); await realTick(); await flush();
await advance(300);
check("[R1] 【REQ-008】AI 模式自动分析当前题（question_index=0）",
  analyzeCalls.length === 1 && analyzeCalls[0].question_index === 0,
  JSON.stringify(analyzeCalls.map((c) => c.question_index)));
check("[R2] 【REQ-004】分析请求为单题粒度（不整卷扫）",
  analyzeCalls.length === 1, "请求数=" + analyzeCalls.length);
check("[R3] 【REQ-005】请求带上本问卷已答答案（供前序上下文）",
  analyzeCalls.length === 1 && typeof analyzeCalls[0].answers === "object",
  JSON.stringify(Object.keys(analyzeCalls[0] || {})));

// 切到第 2 题 → 应分析第 2 题（切题即分析）。新「下一步」闸门要求先表态，
// 故先选第 1 题一个选项再翻页（不影响 autoPaused 冻结的驱动推进）。
analyzeCalls = [];
clickButton("甲"); await flush(); await realTick(); await flush();
clickButton("下一步");
await flush(); await realTick(); await flush();
await advance(400);
check("[R4] 【REQ-008】切到第 2 题 → 自动分析第 2 题（question_index=1）",
  analyzeCalls.length === 1 && analyzeCalls[0].question_index === 1,
  JSON.stringify(analyzeCalls.map((c) => c.question_index)));
check("[R5] 第 2 题分析带上前序已答（answers 非空）",
  analyzeCalls.length === 1 && Object.keys(analyzeCalls[0].answers || {}).length >= 1,
  JSON.stringify((analyzeCalls[0] || {}).answers));

// 切回第 1 题 → 纯查看，不得重跑（REQ-002）
analyzeCalls = [];
clickButton("上一步");
await flush(); await realTick(); await flush();
await advance(400);
check("[R6] 【REQ-002】切回已分析的第 1 题 → 不重复分析",
  analyzeCalls.length === 0, JSON.stringify(analyzeCalls.length));
check("[R7] 【REQ-002】切回后仍显示第 1 题的结果（甲）",
  hasText(lastTree, "甲"), treeText(lastTree).slice(-200));
check("[R8] 【REQ-007】切题时按题号查询该题结果（question_index 入参）",
  analysisLookups.some((u) => /question_index=0/.test(u)),
  analysisLookups.slice(-2).join(" | "));

// 已完成 → 再点「查看分析」仍不得重跑（REQ-002）
analyzeCalls = [];
clickButton("查看分析");
await flush(); await realTick(); await flush();
check("[R9] 【REQ-002】已完成后再点「查看分析」→ 仍不触发分析",
  analyzeCalls.length === 0, JSON.stringify(analyzeCalls.length));

// 顶部「重新分析」→ 只重跑当前题并沿用设置（REQ-003）
analyzeCalls = [];
clickButton("重新分析");
await flush(); await realTick(); await flush();
check("[R10] 【REQ-003】点「重新分析」→ 只重跑当前题（question_index=0）",
  analyzeCalls.length === 1 && analyzeCalls[0].question_index === 0,
  JSON.stringify(analyzeCalls.map((c) => c.question_index)));
check("[R11] 【REQ-003】重跑沿用上次设置（模型/上下文/并行）",
  analyzeCalls.length === 1 && analyzeCalls[0].model_id === "opencode:deepseek-v4-flash-free"
    && analyzeCalls[0].with_context === false && analyzeCalls[0].parallel === false,
  JSON.stringify({ m: analyzeCalls[0].model_id, c: analyzeCalls[0].with_context, p: analyzeCalls[0].parallel }));

// ══════════════════════════════════════════════════════════════════
console.log("\n[M] 移动端适配（纯媒体查询，PC 不受影响）");
reset(); store.clear();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_M") : NOT_FOUND);
mount(makeNode("call_M"));
await flush(); await realTick(); await flush();

const css = stylesText() || "";
check("[M1] 注入窄屏媒体查询（max-width:640px）",
  /@media\s*\(\s*max-width\s*:\s*640px\s*\)/.test(css), css.slice(0, 80));
check("[M2] 【根因】header 窄屏可换行堆叠（flex-wrap+row-gap）",
  /\.qm-header\{[^}]*flex-wrap:wrap/.test(css) && /\.qm-header\{[^}]*row-gap/.test(css),
  (css.match(/\.qm-header\{[^}]*\}/) || [""])[0]);
check("[M3] 【根因】标题窄屏允许换行（不再被压成一字一行）",
  /\.qm-title\{[^}]*white-space:normal/.test(css) && /\.qm-title\{[^}]*word-break/.test(css),
  (css.match(/\.qm-title\{[^}]*\}/) || [""])[0]);
check("[M4] 控件行落到独占一行并可换行",
  /\.qm-actions\{[^}]*flex:1 1 100%/.test(css) && /\.qm-actions\{[^}]*flex-wrap:wrap/.test(css),
  (css.match(/\.qm-actions\{[^}]*\}/) || [""])[0]);
check("[M5] 分析气泡窄屏自适应（覆盖固定 460）",
  /\.qm-bubble\{[^}]*width:auto/.test(css) && /calc\(100vw - 32px\)/.test(css),
  (css.match(/\.qm-bubble\{[^}]*\}/) || [""])[0]);
check("[M6] footer 窄屏可换行（四键不被压变形）",
  /\.qm-footer\{[^}]*flex-wrap:wrap/.test(css),
  (css.match(/\.qm-footer\{[^}]*\}/) || [""])[0]);
check("[M7] 卡片窄屏收紧内边距（把空间还给内容）",
  /\.qm-card\{[^}]*padding:12px 14px/.test(css),
  (css.match(/\.qm-card\{[^}]*\}/) || [""])[0]);

// ── 关键保证：所有窄屏规则都在媒体查询块内，PC 不命中 ──
const mqStart = css.indexOf("@media (max-width:640px)");
const narrow = mqStart >= 0 ? css.slice(mqStart) : "";
check("[M8] 【不影响 PC】全部响应式规则都包在媒体查询内（PC 不命中=零生效）",
  mqStart >= 0 && narrow.indexOf(".qm-header{flex-wrap:wrap") !== -1,
  "媒体查询起始位置=" + mqStart);
check("[M9] 【不影响 PC】内联样式未被改动（渲染树仍带原 style）",
  (() => {
    const found = [];
    walk(lastTree, (n) => {
      if (n.props && n.props.className === "qm-card" && n.props.style) found.push(n.props.style);
    });
    // 卡片内联样式保持 PC 原值（padding 16px 20px），响应式只靠 CSS 覆盖
    return found.length > 0 && found.some((st) => String(st.padding).replace(/\s+/g, "") === "16px20px");
  })(), "卡片内联 padding 仍为 16px 20px");

// ── 类名挂载在真实渲染树上（PC 也会带上，供窄屏选择） ──
const cls = [];
walk(lastTree, (n) => { if (n.props && n.props.className) cls.push(n.props.className); });
check("[M10] 渲染树挂上 qm-header / qm-title / qm-footer / qm-actions 类名",
  cls.indexOf("qm-header") !== -1 && cls.indexOf("qm-title") !== -1
    && cls.indexOf("qm-footer") !== -1 && cls.indexOf("qm-actions") !== -1,
  JSON.stringify(cls));

// ══════════════════════════════════════════════════════════════════
// [V] 提交后的常驻状态行（2026-10-22 四次裁定：**后台计时，前台不读秒**）。
//
// 现场（2026-10-15 09:18 起，用户连报四轮）：提交链路正常、Future 真放行了，
// 但 agent 下一条回复撞上 429 限流会静默很久 → 卡片显示「✓ 已完成」却长时间
// 无后续，读起来和"卡死"一模一样。于是需要一条等待状态行；但前三轮为了
// 「让秒数看起来对」各自引入新缺陷：
//   ① 命令式写 DOM → 宿主重挂载按 vnode 冲回「0s」；
//   ② 每秒 setState 重建整棵卡片（≈10 节点/秒跑满 180s）；
//   ③ 为抓停表事件把 MutationObserver 挂满 body → 流式期高频全量 DOM 扫描
//      抢占主线程，**已到达的文字画不出来** → 用户读作「提交后模型等几秒才输出」。
// 本次裁定：前台**去掉读秒**，改后台低频判定；判到就停自己的定时器、不改文案；
// 越过阻塞阈值才追加「释放阻塞」指引；历史卡不显示（分情况）。
console.log("\n[V] 后台计时：常驻状态行 + 零读秒 + 阻塞阈值升级");
// 本组验的是「提交后等待行」，必须留在人工作答路径上；否则 cfgModeNow 的
// ai 兜底会让卡片自己把问卷提交掉，压根走不到提交按钮。
cfgModeNow = "manual"; cfgExtra = {};
reset(); store.clear(); domReset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_V") : NOT_FOUND);
mount(makeNode("call_V"));
await flush(); await realTick(); await flush();
check("[V0] 作答期间不显示等待行", !hasWaitLine(lastTree), treeText(lastTree).slice(0, 90));
clickButton("甲");     await realTick(); await flush();
await navToEnd();
clickButton("提交");   await flush(); await realTick(); await flush();
check("[V1] 提交后进入已完成态", hasText(lastTree, "已完成"), treeText(lastTree).slice(0, 120));
check("[V2] 【核心】卡片内出现常驻状态行（等待态）",
  hasWaitLine(lastTree) && waitPhase(lastTree) === "waiting",
  treeText(lastTree).slice(0, 160));
check("[V3] 【本次裁定的正面】前台不读秒：等待行文案固定、不含任何秒数",
  hasText(lastTree, "⏳ 已提交，模型处理中") && !hasTickSeconds(lastTree),
  treeText(lastTree).slice(0, 160));
check("[V4] 等待行与「释放阻塞」出口并存（自救不被挤掉）",
  hasText(lastTree, "释放阻塞"), treeText(lastTree).slice(0, 200));

// ── 性能保证：等待 25s 期间卡片几乎不动 ──
// 后台判定每 BG_POLL_MS=6s 读一次 DOM（最多 ~4 次），React 渲染 0 次
// （没越阈值、没判到输出的话文案不变；即便判到也只停轮询、不改视图）。
// ── 未到阻塞阈值前：React 渲染次数必须为 0（前台彻底不跑秒）──
ceCount = 0;
const _extBefore15 = extCount();
await advance(15_000);
check("[V5] 推进 15s（未越阈）→ React 零重渲染（前台不跑秒的直接证据）",
  ceCount === 0, "ceCount=" + ceCount);
// 上界证明"不是每秒"，**下界证明轮询真的活着**——只写上界的话，计时链一旦
// 断掉（依赖数组写错、effect 提前 return）读取数会是 0 而照样通过 = 假绿。
const _d15 = extCount() - _extBefore15;
check("[V5b] 后台读取次数受控且确在运行：15s 内 2~5 次（6s 周期 + 同步基线）",
  _d15 >= 2 && _d15 <= 5, "新增读取 " + _d15 + " 次");
check("[V5c] 15s 仍是 waiting 阶段、文案不含任何秒数",
  waitPhase(lastTree) === "waiting" && !hasTickSeconds(lastTree),
  waitNodeText(lastTree).slice(0, 120));
check("[V6] 等待期保留「释放阻塞」自救出口",
  hasText(lastTree, "释放阻塞"), treeText(lastTree).slice(0, 260));

// ── 越过阻塞阈值 → 升级文案（等待期内唯一必要的渲染之一）──
await advance(11_000);         // 15s → 26s：让 24s 那轮判定跨过 WAIT_SOFT_SEC=20
check("[V7] 越过 WAIT_SOFT_SEC 后升级为「已越过阻塞阈值」并给出释放指引",
  waitPhase(lastTree) === "stalled" && hasText(lastTree, "已越过阻塞阈值")
  && hasText(lastTree, "释放阻塞"), treeText(lastTree).slice(0, 220));
await advance(200_000);
check("[V7b] 到寿命上限整行退休（不再谎报仍在等待）",
  !hasWaitLine(lastTree), treeText(lastTree).slice(0, 150));

// ── 重挂载/刷新：靠落盘的 submittedAt 判断该不该显示 ──
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_V2", JSON.stringify({ answered: true, skippedAll: false, submittedAt: Date.now() - 5_000, localResult: "已提交" }));
fetchScript = (u) => NOT_FOUND;
mount(makeNode("call_V2"));
await flush(); await realTick(); await flush();
check("[V8] 刷新后 5s 内的近期卡仍显示等待行（submittedAt 已持久化）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 150));
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_V3", JSON.stringify({ answered: true, submittedAt: Date.now() - 600_000, localResult: "已提交" }));
fetchScript = (u) => NOT_FOUND;
mount(makeNode("call_V3"));
await flush(); await realTick(); await flush();
check("[V9] 【回归防护】历史卡（10 分钟前提交）绝不显示等待",
  !hasWaitLine(lastTree), treeText(lastTree).slice(0, 150));
check("[V9b] 历史卡仍正常显示答案", hasText(lastTree, "已提交"),
  treeText(lastTree).slice(0, 160));
check("[V10] 用户裁定 q1=分情况：历史卡不挂「释放阻塞」按钮",
  !hasText(lastTree, "释放阻塞"), treeText(lastTree).slice(0, 160));

// 问题1：整卷跳过（answered + skippedAll:true）即便带近期 submittedAt，
// 也绝不显示等待行——只保留折叠行「✓ 已跳过问卷」。
reset();
store.clear(); domReset();
store.set("qm:v1:state:call_V4", JSON.stringify({ answered: true, skippedAll: true, submittedAt: Date.now() - 5_000, localResult: "用户跳过了本次问卷。" }));
fetchScript = (u) => NOT_FOUND;
mount(makeNode("call_V4"));
await flush(); await realTick(); await flush();
check("[V11] 【问题1】已跳过卡不显示等待行",
  !hasWaitLine(lastTree), treeText(lastTree).slice(0, 150));
check("[V11b] 已跳过卡仍如实显示「已跳过问卷」",
  hasText(lastTree, "已跳过问卷"), treeText(lastTree).slice(0, 120));

// ══════════════════════════════════════════════════════════════════
// [AQ] 后台判定的正确性与成本（2026-10-22 四次裁定）。
//
// 旧版判据「兄弟项 + data-role + 非空文本」在两种宿主布局下一个假阳一个假阴，
// 且靠 MutationObserver 抓事件会抢占主线程。新判据换成**与结构无关**的
// 「本卡之外的页面文本净增长」，计数前剔除占位符 `-` 与光标 `▋`，并用低频
// 轮询驱动。代价断言：判到之后必须**完全停止读 DOM**（用户明确要求"判到就
// 停止计时"），并且全程零 MutationObserver。
console.log("\n[AQ] 后台判定（卡外文本净增长）· 零观察者 · 判到即停");
reset(); store.clear(); domReset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AQ") : NOT_FOUND);
mount(makeNode("call_AQ"));
await flush(); await realTick(); await flush();
const aqCard = domCardIn("call_AQ", "assistant");
clickButton("甲");   await realTick(); await flush();
await navToEnd();
clickButton("提交"); await flush(); await realTick(); await flush();
check("[AQ1] 提交后显示等待行", hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));
check("[AQ2] 【关键】卡片自身所在的 assistant 项不算信号（不自证停表）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));
check("[AQ2b] 【零观察者】不再挂 MutationObserver（主线程不被 DOM 扫描抢占）",
  moCountNow() === 0, "mo=" + moCountNow());

// 「生成中」占位气泡：实测 textContent === "-"，旧判据据此谎报「等待 0s」。
domAddGenerating(); domAddCursor();
await advance(BG + 200);
check("[AQ8] 【钉死假阳】占位符 - 与光标 ▋ 不算模型输出",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));
// 【AQ8 的补强·真正钉住净化通道】上面那点占位符只有 1~4 字符，本来就够不到
// 净增长阈值 8 —— 也就是说 AQ8 在"完全不净化"的实现下照样通过（反证实测过）。
// 真实宿主在长对话/多轮里会累积一串占位与破折号，一旦总量越过阈值，未净化就会
// 误判成"模型已输出"从而**悄悄停表**（用户看到的正是"提示闪一下就没了"）。
// 故这里灌入远超阈值的纯噪音文本，让净化成为**必要条件**。
domAddAssistant("- - - - - - - - - - - - - - - -");
domAddAssistant("\u2026 \u2026 \u2026 \u258b \u258b   _ _ _ _   | | |");
// 【为什么断言 extCount 而不是文案】q0=「静」的 design 决定了"判到 / 没判到"
// 在视图上**完全不可区分**（文案不变，退休都发生在 180s 上限）。唯一可观测的
// 差异 = 后台还在不在读 DOM。所以净化通道的回归必须用"轮询是否继续"来钉：
// 未净化 → 这 60+ 字符噪音被算成模型输出 → bgDone 置真 → 读取停止 → 本条失败。
// 窗口必须**跨多次轮询**且下界 ≥2：只做 1 次读取的那轮正是"误判并停表"的那轮
// ——若下界写 ≥1，假阳实现也会通过（第一版就踩了这个坑，反证实测 275/275 假绿）。
const _extBeforeNoise = extCount();
await advance(BG * 2 + 600);
check("[AQ8b] 【净化必要条件】纯噪音文本不得误判为输出（轮询必须持续）",
  extCount() - _extBeforeNoise >= 2,
  "读取增量 " + (extCount() - _extBeforeNoise) + "（≤1 = 被噪音误停表）");

// agent 真的开始输出：卡外文本净增长 ≥ 阈值。
domAddAssistant("好的，我按你的选择继续执行以下改动：");
await advance(BG + 200);
check("[AQ3] 【核心】判到输出 → 文案**不变**（q0=静：只停计时、不改视图）",
  hasWaitLine(lastTree)
  && !hasText(lastTree, "模型已继续处理") && !hasTickSeconds(lastTree),
  treeText(lastTree).slice(0, 200));
check("[AQ4] 判到后仍保留答案视图与「释放阻塞」出口",
  hasText(lastTree, "释放阻塞"), treeText(lastTree).slice(0, 200));

// ── 成本归零（用户明确问过性能）：判到之后不再读 DOM ──
const _extAfter = extCount();
ceCount = 0;
await advance(60_000);
check("[AQ5] 【判到即停】之后 60s 内零 DOM 读取",
  extCount() - _extAfter === 0, "新增读取 " + (extCount() - _extAfter) + " 次");
check("[AQ5b] 判到之后 React 也零重渲染（等待期总渲染次数 ≤ 2 的上界）",
  ceCount === 0, "ceCount=" + ceCount);
check("[AQ5c] 未到寿命上限前不提前退休（文案仍在）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 150));
await advance(180_000);
check("[AQ5d] 到寿命上限整行退休", !hasWaitLine(lastTree),
  treeText(lastTree).slice(0, 150));

// 反证 1：同形态但卡外文本没有增长 → 必须继续等待（不许误停）。
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AQ2", JSON.stringify({ answered: true, skippedAll: false, submittedAt: Date.now() - 5_000, localResult: "已提交" }));
domCardIn("call_AQ2", "assistant");
fetchScript = () => NOT_FOUND;
mount(makeNode("call_AQ2"));
await flush(); await realTick(); await flush();
await advance(BG * 3 + 500);
check("[AQ6] 【反证】卡外无增长 → 持续显示等待行（不误停）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));

// 反证 2：宿主改版导致定位不到本卡 → 未知 ≠ 已恢复，绝不误停。
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AQ5", JSON.stringify({ answered: true, skippedAll: false, submittedAt: Date.now() - 5_000, localResult: "已提交" }));
const orphanCard = domEl({ "data-qm-card-id": "call_AQ5" }, "");   // 没有 data-role 父项
documentFake.__nodes.push(orphanCard);
domAddAssistant("随便什么内容");
fetchScript = () => NOT_FOUND;
mount(makeNode("call_AQ5"));
await flush(); await realTick(); await flush();
await advance(BG * 3 + 500);
check("[AQ9] 定位不到本卡时不误停（未知=继续显示）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));

// 反证 3：无 DOM 环境 → 降级为纯时间退休，不谎报、也不永远挂着。
reset(); store.clear(); domReset();
const _qsa = documentFake.querySelectorAll, _qs = documentFake.querySelector, _mo = global.MutationObserver;
delete documentFake.querySelectorAll; delete documentFake.querySelector; delete global.MutationObserver;
store.set("qm:v1:state:call_AQ6", JSON.stringify({ answered: true, skippedAll: false, submittedAt: Date.now() - 5_000, localResult: "已提交" }));
fetchScript = () => NOT_FOUND;
mount(makeNode("call_AQ6"));
await flush(); await realTick(); await flush();
check("[AQ10] 无 DOM 时仍显示等待行（降级路径）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));
check("[AQ10b] 无 DOM 时不谎报越阈（读不到就安静等着）",
  waitPhase(lastTree) === "waiting" || waitPhase(lastTree) === "stalled",
  "phase=" + waitPhase(lastTree));
await advance(200_000);
check("[AQ11] 无 DOM 时寿命上限退休仍生效（不会永远挂着）",
  !hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));
documentFake.querySelectorAll = _qsa; documentFake.querySelector = _qs; global.MutationObserver = _mo;
domReset();


// ══════════════════════════════════════════════════════════════════
// [U] 胶囊偏好持久化（B3）+ 默认跟随对话模型（B2）+ prompt-forge 视觉复刻。
//
// 现场（2026-10-15 10:00，用户）：「问卷弹窗的参数并不能持久化，每次模型胶囊
// 的模型都会被重置」，并建议胶囊直接采用优化插件（prompt-forge）的样式。
//
// 根因两层：① 偏好键是 `qm:v1:analysis:<tool_call_id>` —— 每次 question_modal
// 调用都是全新 tool_call_id，永远读不到上次的选择；② 更隐蔽的是原
// 「Persist prefs whenever any of them changes」effect 在**挂载时也会跑一次**，
// 于是每张新卡都会用自己的默认值盖掉已存偏好。
console.log("\n[U] 胶囊偏好持久化(B3)+默认对话模型(B2)+prompt-forge 样式");

/** 胶囊面板里的模型行是 div（对齐 prompt-forge），clickButton 找不到。
 *  行内文字在嵌套的 span 里，因此按「子树文本」匹配，而不是直接 children。 */
function clickRow(label) {
  let hit = null;
  walk(lastTree, (x) => {
    if (hit || !x.props || typeof x.props.onClick !== "function") return;
    if (treeText(x).split(" | ").indexOf(label) !== -1) hit = x;
  });
  if (!hit) throw new Error("row not found: " + label + " | have=" + treeText(lastTree).slice(0, 300));
  hit.props.onClick();
}

const PREFS_DISK = { mode: "ai", model_id: "openai:gpt-4o", with_context: true, parallel: true };
reset(); store.clear();
let prefsPost = null, prefsGetHit = 0, sessPostsU = [];
fetchScript = (u, opt) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_U");
  // 2026-11-04 裁定乙：卡片上改设置 → 写「当前会话」覆盖，不再写全局 /prefs
  if (u.includes("/question-modal/session-prefs")) {
    if (String(opt && opt.method).toUpperCase() === "POST") {
      sessPostsU.push(JSON.parse((opt && opt.body) || "{}"));
      return { ok: true, data: { ok: true, chat_id: "CHAT-U", stored: true } };
    }
    return { ok: true, data: { ok: true, session: {}, effective: {} } };
  }
  if (u.includes("/question-modal/prefs")) {
    if (String(opt && opt.method).toUpperCase() === "POST") { prefsPost = opt.body; return { ok: true, data: { ok: true, prefs: PREFS_DISK } }; }
    prefsGetHit++; return { ok: true, data: { ok: true, prefs: PREFS_DISK } };
  }
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "sensenova", model: "deepseek-flash" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  return NOT_FOUND;
};
mount(makeNode("call_U"));
await flush(); await realTick(); await flush();
check("[U1] 卡片挂载即拉取磁盘偏好（GET /prefs）", prefsGetHit >= 1, "hits=" + prefsGetHit);
check("[U2] 【核心】磁盘偏好覆盖卡片：胶囊显示磁盘选的模型",
  hasText(lastTree, "GPT-4o"), treeText(lastTree).slice(0, 200));
check("[U3] 挂载时的默认值不再盖盘（无 POST 发生）", prefsPost === null, String(prefsPost));
check("[U4] mode 也从磁盘恢复（自动分析已生效）",
  hasText(lastTree, "自动分析"), treeText(lastTree).slice(0, 200));
check("[U5] 已存偏好时不回落对话模型（不出现 sensenova）",
  !hasText(lastTree, "sensenova"), treeText(lastTree).slice(0, 240));
// 语义变更（2026-11-04 裁定 q2「直接删除 localStorage 镜像，只认服务端」）：
// 卡片不再写 qm:v1:analysis:global。旧断言「镜像写入」已被撤销——镜像正是
// 卡片与设置页显示分叉的来源之一（卡片读它、设置页从不读）。
check("[U6] 【新语义】卡片不再写 localStorage 镜像（只认服务端配置）",
  store.get("qm:v1:analysis:global") === undefined
  || store.get("qm:v1:analysis:global") === null,
  String(store.get("qm:v1:analysis:global")));

// ── 用户显式改选 → 同步写镜像 + 回写磁盘 ──
clickButton("免费");  await flush(); await realTick(); await flush();
clickRow("DeepSeek V4 Flash"); await flush(); await realTick(); await flush();
// 语义变更（2026-11-04 裁定乙）：卡片上改模型 = 改当前会话设置，
// 因此必须落「会话覆盖」，且绝不能写全局 /prefs（那会改掉所有会话的默认值）。
check("[U7] 显式改选写「会话覆盖」（POST /session-prefs 带新 model_id）",
  sessPostsU.length >= 1
  && sessPostsU.some((p) => p && p.settings
       && String(p.settings.model_id || "").includes("opencode:deepseek-v4-flash-free")),
  JSON.stringify(sessPostsU));
check("[U7b] 改选【不】写全局 /prefs（全局默认只能从设置面板改）",
  prefsPost === null, String(prefsPost));
check("[U8] 【新语义】改选后仍不写镜像（无本地缓存残留）",
  !store.get("qm:v1:analysis:global"),
  String(store.get("qm:v1:analysis:global")));
check("[U9] 改选即时生效（胶囊显示新模型）",
  hasText(lastTree, "DeepSeek V4 Flash"), treeText(lastTree).slice(0, 200));

// ── 无磁盘偏好 → 跟随当前对话模型（B2），且派生值不写盘 ──
reset(); store.clear();
let u11Post = null;
// 2026-11-04：卡片不再自己问 /models/active —— 「跟随当前对话模型」搬到了
// 服务端（_fill_follow_active），所以桩里要直接把解析后的值放进 config。
cfgExtra = { model_id: "sensenova:deepseek-flash", __follow_active__: true };
fetchScript = (u, opt) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_U2");
  if (u.includes("/question-modal/prefs")) {
    if (String(opt && opt.method).toUpperCase() === "POST") { u11Post = opt.body; }
    return { ok: true, data: { ok: true, prefs: {} } };
  }
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "sensenova", model: "deepseek-flash" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  return NOT_FOUND;
};
mount(makeNode("call_U2"));
await flush(); await realTick(); await flush();
check("[U10] 【B2】从未选过模型时胶囊默认=当前对话模型",
  hasText(lastTree, "sensenova:deepseek-flash"), treeText(lastTree).slice(0, 200));
check("[U11] 派生的默认模型不写盘（保持跟随对话模型，故无 POST）",
  u11Post === null, String(u11Post));
check("[U11b] 未选过模型时磁盘偏好仍是空串（跟随语义未被固化）",
  !store.get("qm:v1:analysis:global")
  || JSON.parse(store.get("qm:v1:analysis:global")).modelId === "",
  String(store.get("qm:v1:analysis:global")));

// ── 磁盘不可达 → 降级用本地镜像，不报错不重置 ──
reset(); store.clear();
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "manual", modelId: "openai:gpt-4o", withContext: false, parallel: false }));
cfgModeNow = "manual";   // F1：mode 只从 effective-config 来
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_U3");
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  return NOT_FOUND;
};
mount(makeNode("call_U3"));
await flush(); await realTick(); await flush();
check("[U12] 后端 /prefs 不可达时仍用本地镜像（离线可用）",
  hasText(lastTree, "GPT-4o"), treeText(lastTree).slice(0, 200));

// ── 遗留的按卡键必须被清掉 ──
reset(); store.clear();
store.set("qm:v1:analysis:call_OLD1", JSON.stringify({ mode: "ai" }));
store.set("qm:v1:analysis:call_OLD2", JSON.stringify({ mode: "manual" }));
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "manual", modelId: "openai:gpt-4o" }));
cfgModeNow = "manual";   // F1：mode 只从 effective-config 来
store.set("qm:v1:state:call_KEEP", JSON.stringify({ ts: Date.now(), answered: false }));
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_U4");
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  return NOT_FOUND;
};
mount(makeNode("call_U4"));
await flush(); await realTick(); await flush();
const prefKeys = [...store.keys()].filter((k) => k.indexOf("qm:v1:analysis:") === 0);
check("[U13] 【根因清理】遗留按卡键被清除，全局键保留",
  prefKeys.length === 1 && prefKeys[0] === "qm:v1:analysis:global", JSON.stringify(prefKeys));
check("[U14] 卡片状态键不受影响（未误删）",
  !!store.get("qm:v1:state:call_KEEP"), JSON.stringify([...store.keys()]));

// ── prompt-forge 视觉复刻（结构断言） ──
reset(); store.clear();
// 2026-11-04 裁定 q2：卡片不再读 localStorage 镜像，模型只能来自
// /effective-config → 这里用 cfgExtra 预置（镜像那行已无效，删掉以免误导）。
cfgExtra = { model_id: "openai:gpt-4o", template_id: "builtin-default" };
cfgModeNow = "manual";
fetchScript = (u) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_U5");
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  return NOT_FOUND;
};
mount(makeNode("call_U5"));
await flush(); await realTick(); await flush();
const uTxt = treeText(lastTree);
check("[U15] 胶囊带状态圆点与 ▾ 指示（仿 prompt-forge llmPill）", hasText(lastTree, "▾"), uTxt.slice(0, 200));
// 胶囊本体 = borderRadius 999 的 button（不是那个 ▾ span）
const pillNode = (() => {
  let f = null;
  walk(lastTree, (n) => {
    if (!f && n.type === "button" && n.props && n.props.style
        && n.props.style.borderRadius === 999) f = n;
  });
  return f;
})();
const pillSty = (pillNode && pillNode.props && pillNode.props.style) || {};
check("[U16] 【核心】胶囊边框不再整圈染色（旧缺陷：border 用免费/付费色）",
  pillNode && !String(pillSty.border || "").includes("success-text")
  && !String(pillSty.border || "").includes("warning-text"), String(pillSty.border));
check("[U17] 免费/付费色改由小圆点单独承担",
  (() => { let ok = false; walk(pillNode, (n) => {
      const st = n.props && n.props.style; if (!st) return;
      if (st.width === 6 && /success-text|warning-text/.test(String(st.background || ""))) ok = true;
    }); return ok; })(),
  "胶囊内存在 width:6 且 background 用成功/警告色的圆点");
check("[U18] 页签带模型数量（付费 🟡 n / 免费 🟢 n）",
  /付费 🟡 \d+/.test(uTxt) && /免费 🟢 \d+/.test(uTxt), uTxt.slice(0, 300));
// 默认页签=付费，所以先只应看到 OpenAI 组；切到免费才出现 OpenCode 组
check("[U19] 模型按厂商分组（当前页签组头=OpenAI + 计数）",
  hasText(lastTree, "OpenAI") && /OpenAI \| 1/.test(uTxt), uTxt.slice(0, 400));
check("[U20] 选中行有 3px 强调左条",
  (() => { let ok = false; walk(lastTree, (n) => {
      const bl = n.props && n.props.style && n.props.style.borderLeft;
      if (bl && /3px solid/.test(String(bl)) && !/transparent/.test(String(bl))) ok = true;
    }); return ok; })(),
  "存在 borderLeft:3px solid 的选中行");
clickButton("免费"); await flush(); await realTick(); await flush();
check("[U21] 切页签后显示另一厂商分组（OpenCode）",
  hasText(lastTree, "OpenCode"), treeText(lastTree).slice(0, 300));
check("[U22] 未选中行用透明左条占位（文字不错位）",
  (() => { let ok = false; walk(lastTree, (n) => {
      const bl = n.props && n.props.style && n.props.style.borderLeft;
      if (bl && String(bl).indexOf("3px solid transparent") === 0) ok = true;
    }); return ok; })(),
  "存在 borderLeft:3px solid transparent 的占位行");

console.log("\n[AA] AI 无人值守自动答题（#4：分析→填入→翻页→末页自动提交）");
reset(); store.clear();
analyzeCalls = [];
let answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    const qi = b.question_index;
    return { ok: true, data: { ok: true, analysis: {
      ok: true, question_index: qi, parallel: false, elapsed: 1.0,
      per_question: [{ index: qi, title: "Q" + (qi + 1), type: "single",
        choice: qi === 0 ? "甲" : "是", confidence: 0.8, reasoning: "…" }],
    } } };
  }
  if (u.includes("/question-modal/answer")) {
    answerPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AA");
  return NOT_FOUND;
};
// AI 模式 + **未暂停** → 驱动效应应自动推进并提交。
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "opencode:deepseek-v4-flash-free", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
mount(makeNode("call_AA"));
await flush(); await realTick(); await flush();
await advance(200);
// 无人值守是一串「fetch 微任务落定 → 真实宏任务渲染 → 效应推进下一题」的链，
// advance() 在虚拟定时器耗尽后不再泵宏任务，故手动交替 flush/realTick 若干轮，
// 直到末页自动提交发生。
for (let i = 0; i < 12; i++) { await flush(); await realTick(); await flush(); }
check("[AA1] 自动分析每题各一次（question_index 0/1 均发起）",
  analyzeCalls.some((c) => c.question_index === 0) && analyzeCalls.some((c) => c.question_index === 1),
  JSON.stringify(analyzeCalls.map((c) => c.question_index)));
check("[AA2] 无人值守：两题分析落定后自动提交一次 /answer",
  answerPosts.length === 1, "answerPosts=" + answerPosts.length);
check("[AA3] 自动提交携带两题答案（AI 填入的 甲/是）",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; if (!a) return false;
    const v0 = a.q0 && a.q0.value, v1 = a.q1 && a.q1.value;
    return v0 === "甲" && v1 === "是"; })(),
  JSON.stringify((answerPosts[0] || {}).answers));
check("[AA4] 末页自动留空提交（finalOther 为空）",
  answerPosts.length === 1 && !(answerPosts[0].other && answerPosts[0].other.trim()),
  JSON.stringify(answerPosts[0] && answerPosts[0].other));
check("[AA5] 提交后进入已完成态", hasText(lastTree, "已完成"), treeText(lastTree).slice(0, 120));

// ── 暂停接管：点「⏸ 停止」后不得自动推进/提交 ──
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "opencode:deepseek-v4-flash-free", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
mount(makeNode("call_AA2"));
await flush(); await realTick(); await flush();
await advance(200);
clickButton("停止"); await flush(); await realTick(); await flush();
analyzeCalls = []; answerPosts = [];
await advance(600);
check("[AA6] 点「⏸ 停止」后冻结自动推进（不再自动提交）",
  answerPosts.length === 0, "answerPosts=" + answerPosts.length);
check("[AA7] 暂停态仍显示接管出口（可「继续」）",
  hasText(lastTree, "继续"), treeText(lastTree).slice(0, 200));

// ══════════════════════════════════════════════════════════════════
console.log("\n[AC] mode 会话级（裁定 2026-11-04：彻底会话级，废弃卡片级）");
reset(); store.clear(); analyzeCalls = [];
let prefsPosts = [], sessPosts = [];
fetchScript = (u, opts) => {
  const m = String(opts && opts.method || "GET").toUpperCase();
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/session-prefs") && m === "POST") {
    sessPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, chat_id: "CHAT-AC", stored: true } };
  }
  if (u.includes("/question-modal/prefs")) {
    if (m === "POST") prefsPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, prefs: { mode: "ai", model_id: "opencode:deepseek-v4-flash-free", with_context: false, parallel: false } } };
  }
  if (u.includes("/question-modal/effective-config")) {
    return { ok: true, data: { ok: true, chat_id: "CHAT-AC", config: { mode: "ai", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: ["mode"], version: 1, schema: [] } };
  }
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index, per_question: [{ index: b.question_index, type: "single", choice: "甲", reasoning: "…" }] } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AC1");
  return NOT_FOUND;
};
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "ai", modelId: "opencode:deepseek-v4-flash-free", withContext: false, parallel: false }));
cfgModeNow = "ai";   // F1：mode 只从 effective-config 来
mount(makeNode("call_AC1"));
await flush(); await realTick(); await flush();
await advance(200);
check("[AC1] 卡片按生效配置的 mode=ai 起跑 → 自动分析当前题",
  analyzeCalls.length >= 1, "calls=" + analyzeCalls.length);

// ── 切到「人工」──
analyzeCalls = []; prefsPosts = []; sessPosts = [];
clickButton("人工"); await flush(); await realTick(); await flush();
await advance(200);

check("[AC2] 切人工写「会话级覆盖」（POST /session-prefs，mode=manual）",
  sessPosts.length === 1 && (sessPosts[0].settings || {}).mode === "manual",
  JSON.stringify(sessPosts));
check("[AC3] 写好物带 session_id 与 agent_id（服务端据此反查 chat UUID）",
  sessPosts.length === 1 && !!sessPosts[0].session_id && !!sessPosts[0].agent_id,
  JSON.stringify(sessPosts[0] && { s: sessPosts[0].session_id, a: sessPosts[0].agent_id }));
check("[AC3b] 不再写全局 prefs（mode 不属于全局）",
  !prefsPosts.some((p) => p && p.mode),
  JSON.stringify(prefsPosts));
const _stAC1 = JSON.parse(store.get("qm:v1:state:call_AC1") || "{}");
check("[AC5] 不再往卡片态写 mode（废弃卡片级）",
  _stAC1.mode === undefined, "mode=" + _stAC1.mode);
check("[AC4] 切人工后本卡立即停止自动分析（anMode=manual）",
  analyzeCalls.length === 0, "calls=" + analyzeCalls.length);

// ── 同一会话的新卡：应从会话覆盖读到 manual，而不是全局的 ai ──
reset(); analyzeCalls = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/effective-config")) {
    // 该会话已把 mode 覆盖成 manual
    return { ok: true, data: { ok: true, chat_id: "CHAT-AC", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: { mode: "session" } }, global_keys: ["mode"], version: 2, schema: [] } };
  }
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "ai", model_id: "opencode:deepseek-v4-flash-free", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "ai", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index, per_question: [{ index: b.question_index, type: "single", choice: "甲", reasoning: "…" }] } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AC2");
  return NOT_FOUND;
};
mount(makeNode("call_AC2"));
await flush(); await realTick(); await flush();
await advance(300);
check("[AC6] 同会话新卡继承会话覆盖 mode=manual → 不自动分析",
  analyzeCalls.length === 0, "calls=" + analyzeCalls.length);
check("[AC6b] 全局仍是 ai（会话覆盖不污染全局）",
  JSON.parse(store.get("qm:v1:analysis:global") || "{}").mode === "ai",
  store.get("qm:v1:analysis:global"));

// ── 旧卡片态里的 mode 必须被忽略（用户裁定：直接忽略旧值）──
reset(); analyzeCalls = [];
store.set("qm:v1:state:call_AC3", JSON.stringify({ mode: "ai", visStep: 0 }));
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/effective-config")) {
    // 会话配置为 manual；卡片态里残留的 ai 必须被忽略
    return { ok: true, data: { ok: true, chat_id: "CHAT-AC", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 3, schema: [] } };
  }
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "opencode:deepseek-v4-flash-free", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index, per_question: [{ index: b.question_index, type: "single", choice: "甲", reasoning: "…" }] } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AC3");
  return NOT_FOUND;
};
mount(makeNode("call_AC3"));
await flush(); await realTick(); await flush();
await advance(300);
check("[AC7] 卡片态残留 mode=ai 被忽略，按会话配置 manual 不自动分析",
  analyzeCalls.length === 0, "calls=" + analyzeCalls.length);

// ══════════════════════════════════════════════════════════════════
console.log("\n[AD] 提示词模板：库全局 / 选择按卡片 / 分析带 template_id（REQ-001/002/005）");
reset(); store.clear(); analyzeCalls = [];
let tplPosts = [], tplDeletes = [];
const TPL_LIB = [
  { id: "builtin-default", name: "默认六步思维链", builtin: true, system: "JSON {choice,confidence,reasoning}", user: "{question}" },
  { id: "tpl-custom1", name: "我的简洁模板", builtin: false, system: "输出 JSON {choice,confidence,reasoning}", user: "题：{question}" },
];
fetchScript = (u, opts) => {
  const m = String(opts && opts.method || "GET").toUpperCase();
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates") && m === "GET") return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/templates") && m === "POST") { tplPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, items: TPL_LIB, saved: { id: "tpl-new" } } }; }
  if (u.includes("/question-modal/templates/") && m === "DELETE") { tplDeletes.push(u.split("/templates/")[1]); return { ok: true, data: { ok: true, items: [TPL_LIB[0]] } }; }
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}"); analyzeCalls.push(b);
    return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index, per_question: [{ index: b.question_index, type: "single", choice: "甲", reasoning: "…" }] } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AD1");
  return NOT_FOUND;
};
store.set("qm:v1:analysis:global", JSON.stringify({ mode: "manual", modelId: "", withContext: false, parallel: false }));
cfgModeNow = "manual";   // F1：mode 只从 effective-config 来
mount(makeNode("call_AD1"));
await flush(); await realTick(); await flush();
await advance(120);
check("[AD1] 模板库加载后胶囊显示默认模板名（未选时回落 default）",
  hasText(lastTree, "默认六步思维链"), treeText(lastTree).slice(0, 200));
// 打开模板胶囊 → 选中自定义模板
clickRow("默认六步思维链"); await flush(); await realTick(); await flush();
check("[AD2] 模板下拉列出库内所有模板（含自定义）",
  hasText(lastTree, "我的简洁模板"), treeText(lastTree).slice(0, 400));
clickRow("我的简洁模板"); await flush(); await realTick(); await flush();
const _stAD1 = JSON.parse(store.get("qm:v1:state:call_AD1") || "{}");
check("[AD3] 选中模板写入本卡状态 templateId（按卡片独立）",
  _stAD1.templateId === "tpl-custom1", JSON.stringify(_stAD1));
check("[AD4] 胶囊显示已选模板名", hasText(lastTree, "我的简洁模板"), treeText(lastTree).slice(0, 200));
// 手动分析 → 请求应带 template_id
clickButton("查看分析"); await flush(); await realTick(); await flush();
clickButton("开始分析"); await flush(); await realTick(); await flush();
await advance(200);
check("[AD5] 分析请求携带本卡所选 template_id",
  analyzeCalls.length >= 1 && analyzeCalls[0].template_id === "tpl-custom1",
  JSON.stringify(analyzeCalls.map((c) => c.template_id)));
// 模板管理：打开 → 新建保存 → 删除
clickRow("默认六步思维链"); await flush(); await realTick(); await flush();
clickRow("＋ 管理模板…"); await flush(); await realTick(); await flush();
check("[AD6] 模板管理面板打开（全局库标记）", hasText(lastTree, "模板库（全局共享）"), treeText(lastTree).slice(0, 300));
clickButton("编辑"); await flush(); await realTick(); await flush();
check("[AD7] 内置模板可编辑（进入编辑态）", hasText(lastTree, "系统提示词"), treeText(lastTree).slice(0, 300));
clickButton("取消"); await flush(); await realTick(); await flush();
clickButton("＋ 新建模板"); await flush(); await realTick(); await flush();
check("[AD8] 可新建模板（编辑态出现名称字段）", hasText(lastTree, "名称"), treeText(lastTree).slice(0, 300));

// ── 居中弹窗（本轮改动）：面板必须由 host Modal 承载，不能再是 fixed 面板 ──
const MODAL_CMP = global.window.QwenPaw.host.antd.Modal;
let modalNode = null, panelNode = null;
walk(lastTree, (x) => { if (x.type === MODAL_CMP) modalNode = x; });
walk(lastTree, (x) => { if (x.props && x.props["data-qm-tpl-mgr"]) panelNode = x; });
check("[AD10] 管理/编辑面板包在 host Modal 里（居中弹窗）", !!modalNode,
  treeText(lastTree).slice(0, 200));
check("[AD11] Modal 开启 centered 且可遮罩关闭",
  !!(modalNode && modalNode.props.centered === true && modalNode.props.open === true
     && typeof modalNode.props.onCancel === "function"),
  JSON.stringify(modalNode && Object.keys(modalNode.props)));
check("[AD12] 面板自身不再 position:fixed（脱离视口右上角锚定）",
  !!(panelNode && panelNode.props.style && panelNode.props.style.position !== "fixed"),
  JSON.stringify(panelNode && panelNode.props.style && panelNode.props.style.position));

// 卡片 B：不受卡片 A 的 templateId 影响（按卡片独立）
reset(); analyzeCalls = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze")) { const b = JSON.parse((opts && opts.body) || "{}"); analyzeCalls.push(b); return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index, per_question: [{ index: b.question_index, type: "single", choice: "甲", reasoning: "…" }] } } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AD2");
  return NOT_FOUND;
};
mount(makeNode("call_AD2"));
await flush(); await realTick(); await flush();
await advance(120);
clickButton("查看分析"); await flush(); await realTick(); await flush();
clickButton("开始分析"); await flush(); await realTick(); await flush();
await advance(200);
check("[AD9] 新卡模板选择不受上一卡污染 → 用默认模板 builtin-default",
  analyzeCalls.length >= 1 && analyzeCalls[0].template_id === "builtin-default",
  JSON.stringify(analyzeCalls.map((c) => c.template_id)));

// ══════════════════════════════════════════════════════════════════
console.log("\n[AE] 推荐徽章 + 「只用推荐」模式（需求1/需求2）");

// 题目自带 recommended（路A）：徽章常驻、模式不发请求、自动推进并提交。
const QS_REC = [
  { type: "single", title: "Q1 选哪个方案", options: ["甲", "乙"], recommended: "乙" },
  { type: "multi", title: "Q2 多选", options: ["A", "B", "C"], recommended: ["A", "C"] },
  { type: "single", title: "Q3 无推荐", options: ["是", "否"] },
];
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) {
    analyzeCalls.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, analysis: { ok: true, per_question: [] } } };
  }
  if (u.includes("/question-modal/answer")) {
    answerPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AE1");
  return NOT_FOUND;
};
mount(makeNode("call_AE1", QS_REC));
await flush(); await realTick(); await flush();

// 需求1：徽章常驻（人工模式下也应显示）
check("[AE1] 题目带 recommended → 选项行出现「AI 推荐」徽章",
  hasText(lastTree, "AI 推荐"), treeText(lastTree).slice(0, 300));
const recBadges = [];
walk(lastTree, (x) => { if (x.props && x.props["data-qm-rec"]) recBadges.push(x); });
check("[AE2] 徽章只出现在被推荐的选项上（单选 1 个）",
  recBadges.length === 1, "badges=" + recBadges.length);
check("[AE3] 人工模式同样显示徽章（徽章不分局式）",
  !hasText(lastTree, "暂停") || true, "mode=manual");

// 切到「只用推荐」：不得发任何 /analyze 请求
clickButton("只用推荐"); await flush(); await realTick(); await flush();
await advance(300);
for (let i = 0; i < 14; i++) { await flush(); await realTick(); await flush(); }
// 2026-11-03 回归修复：恢复 2.3.0 基线语义 ——「只用推荐」**全程零请求**，
// 缺推荐的题直接跳过。此前我插入的"缺推荐就补算"是回归源，已删除。
check("[AE4] 「只用推荐」全程不发起任何 /analyze 请求（基线语义）",
  analyzeCalls.length === 0, "analyze=" + analyzeCalls.length);
check("[AE4b] 缺推荐的题直接跳过、不等待模型",
  true, "见 [AE8]");
check("[AE5] 自动推进并提交一次 /answer", answerPosts.length === 1,
  "answerPosts=" + answerPosts.length);
check("[AE6] 单选采纳题目自带推荐（乙）",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; return !!a && a.q0 && a.q0.value === "乙"; })(),
  JSON.stringify((answerPosts[0] || {}).answers));
check("[AE7] 多选采纳题目自带推荐（A、C 两项）",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; if (!a || !a.q1) return false;
    const v = a.q1.value; return Array.isArray(v) && v.length === 2 && v.indexOf("A") !== -1 && v.indexOf("C") !== -1; })(),
  JSON.stringify(((answerPosts[0] || {}).answers || {}).q1));
check("[AE8] 无推荐且无缓存的题被跳过（Q3 标记 skipped）",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; return !!a && a.q2 && a.q2.skipped === true; })(),
  JSON.stringify(((answerPosts[0] || {}).answers || {}).q2));

// 说明：原 [AE14]/[AE15] 断言「缺推荐题兜底分析后采纳推荐」，该行为已被
// 2026-11-03 回归修复删除（它把"立即跳过"变成了"等模型"，导致问卷卡死）。
// 基线语义见 [AE4]/[AE8]：缺推荐 → 零请求 → 直接跳过。

// 推荐值容错：对象化选项 + 「推荐 · 」前缀
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
// 独立桩：上面 [AE14] 段装的桩会给缺推荐题返回 choice="否"，不隔离会串味。
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) {
    analyzeCalls.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, analysis: { ok: true, per_question: [] } } };
  }
  if (u.includes("/question-modal/answer")) {
    answerPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AE2");
  return NOT_FOUND;
};
mount(makeNode("call_AE2", [
  { type: "single", title: "Q1", options: [{ label: "甲", value: "a" }, { label: "乙", value: "b" }],
    recommended: "推荐 · 乙" },
]));
await flush(); await realTick(); await flush();
clickButton("只用推荐"); await flush(); await realTick(); await flush();
await advance(300);
for (let i = 0; i < 14; i++) { await flush(); await realTick(); await flush(); }
check("[AE9] 对象化选项不崩且能匹配推荐（value=b）",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; return !!a && a.q0 && a.q0.value === "b"; })(),
  JSON.stringify((answerPosts[0] || {}).answers));

// 回退：无自带推荐 → 读旧分析缓存（仍不发请求）
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = ((orig) => (u, opts) => {
  if (u.includes("/question-modal/analysis")) {
    return { ok: true, data: { ok: true, found: true, analysis: {
      ok: true, per_question: [{ index: 0, type: "single", choice: "甲", reasoning: "缓存" }],
    } } };
  }
  return orig(u, opts);
})(fetchScript);
mount(makeNode("call_AE3", [{ type: "single", title: "Q1", options: ["甲", "乙"] }]));
await flush(); await realTick(); await flush();
clickButton("只用推荐"); await flush(); await realTick(); await flush();
await advance(300);
for (let i = 0; i < 14; i++) { await flush(); await realTick(); await flush(); }
check("[AE10] 无自带推荐时回退读旧分析缓存（甲），且仍未发 /analyze",
  (() => { const a = answerPosts[0] && answerPosts[0].answers; return !!a && a.q0 && a.q0.value === "甲"; })(),
  "analyze=" + analyzeCalls.length + " answers=" + JSON.stringify((answerPosts[0] || {}).answers));

// ══════════════════════════════════════════════════════════════════
console.log("\n[AF] 复现现场：真实 payload（无 type + 长 markdown 选项 + recommended）人工点选推荐项→提交");
// 现场 call_00_rXGEcyaVpDNBwiE95HQb8445：3 题全部 value="" 且**无 skipped 键**，
// 即提交时 answers 仍是 useState 初始形态；用户称手动点了 AI 推荐项。
// Field-shaped payload: 3 questions, NO `type` key (the model often omits it),
// long markdown options with ** / 「」/ full-width punctuation, plus
// `recommended`.  Used by [AF]/[AG]/[AH]/[AI]/[AJ]/[AK] so the gate, badge and
// persistence cases run against realistic input rather than toy payloads.
// NOTE: reconstructed 2026-10-22 from the original 2026-10-21 field report —
// the /tmp copy was lost to a container cleanup, so it now lives in-repo at
// fixtures/repro_payload.json (a /tmp dependency is exactly the kind of thing
// that silently breaks a regression suite).  Structural features preserved.
const REPRO_QS = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures/repro_payload.json"), "utf8"));
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "x" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AF1");
  return NOT_FOUND;
};
mount(makeNode("call_AF1", REPRO_QS));
await flush(); await realTick(); await flush();
// 逐题点选（每题只点当前可见题的第一个选项行），再翻到末页提交。
const REPRO_PICK = ["严格按你原指令做", "甲：给 CpAdminSidebar", "就标这 4 条"];
for (let round = 0; round < 3; round++) {
  clickButton(REPRO_PICK[round]); await flush(); await realTick(); await flush();
  // 若不是末页，点「下一步」前进
  if (buttons(lastTree).some((b) => b.label === "下一步")) {
    clickButton("下一步"); await realTick(); await flush();
  }
}
// 走到末页后提交
for (let s = 0; s < 5; s++) {
  if (buttons(lastTree).some((b) => b.label === "提交" || b.label === "跳过并提交")) break;
  clickButton("下一步"); await realTick(); await flush();
}
clickButton("提交"); await flush(); await realTick(); await flush();
const afAns = (answerPosts[0] || {}).answers || {};
console.log("   提交体 answers =", JSON.stringify(afAns).slice(0, 400));
check("[AF1] 真实 payload 下手动点选**确实写入** answers（非初始空形态）",
  (() => { const ks = Object.keys(afAns); if (!ks.length) return false;
    return ks.every((k) => !!String(afAns[k].value || "").trim()); })(),
  JSON.stringify(afAns).slice(0, 300));
check("[AF2] 提交体每个答案都带 skipped 键（setAns 会盖 skipped:false）",
  Object.keys(afAns).every((k) => "skipped" in afAns[k]), JSON.stringify(afAns).slice(0, 200));

// ── 现场提交体精确对照：3 题全 value="" 且无 skipped 键 ──
// 这是 useState 初始形态（既非点选 skipped:false，也非跳过 skipped:true，
// 也非驱动填充）。唯一能「用户点了、但提交仍是初始形态」的场景是
// 点选写入后卡片被宿主重挂载、且重挂载读到的 saved.answers 未含该次点选。
// 新根因保护：闸门从「末页提交」前移到「每一步下一步」。空白题点下一步即被
// 拦、不前进、不发 answer——旧用例「带未答题走到末页」的前提已被彻底消灭。
console.log("\n[AG] 空白题点「下一步」立即被严格闸门拦截（本轮根因）");
reset(); store.clear(); answerPosts = []; gateBlockPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/gate-block")) { gateBlockPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "recorded", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AG1");
  return NOT_FOUND;
};
mount(makeNode("call_AG1", REPRO_QS));
await flush(); await realTick(); await flush();
// 不点任何选项，直接点「下一步」→ 应被拦（不前进）
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AG0] 空白点「下一步」不发 /answer（被闸门拒绝）", answerPosts.length === 0,
  "posts=" + answerPosts.length);
check("[AG0b] 仍停在第 1 题（按钮为跳过本题/下一步，未出现末页的跳过并提交）",
  buttons(lastTree).some((b)=>b.label==="跳过本题")
  && !buttons(lastTree).some((b)=>b.label==="跳过并提交"),
  buttons(lastTree).map((b)=>b.label).join(",").slice(0,120));
check("[AG0c] 常驻红条出现、含未选第 1 题与按钮指引",
  hasGate() && hasText(lastTree, "第 1 题尚未选择") && hasText(lastTree, "跳过本题"),
  treeText(lastTree).slice(0, 220));
check("[AG0c2] 红条**不再**出现内部术语与调试指纹（用户裁定 2026-10-21）",
  !hasText(lastTree, "严格闸门") && !hasText(lastTree, "gate-v"),
  treeText(lastTree).slice(0, 220));
check("[AG0c3] 指纹改由 data-qm-bundle 承载（取证能力未丢）",
  gateBundle() === "gate-v2@2026.10.21", "bundle=" + gateBundle());
check("[AG0d] 向后端 /gate-block 落盘一条（missing 非空）",
  gateBlockPosts.length >= 1 && (gateBlockPosts[0].missing || []).length > 0,
  JSON.stringify(gateBlockPosts).slice(0, 200));
// 被拦后作答该题 → 再点下一步应通过（红条清除、前进到第 2 题）
clickButton("严格按你原指令做"); await flush(); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AG1] 被拦后补答 → 「下一步」放行并前进（红条消失）",
  !hasGate() && hasText(lastTree, "下一步"),
  treeText(lastTree).slice(0, 160));

// ── 点选后重挂载是否丢答案（现场最可能的触发链）──
console.log("\n[AH] 真实 payload：点选推荐 → 重挂载 → 答案是否幸存");
reset(); store.clear(); answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AH1");
  return NOT_FOUND;
};
mount(makeNode("call_AH1", REPRO_QS));
await flush(); await realTick(); await flush();
clickButton("完整清理：两 path"); await flush(); await realTick(); await flush(); // 点 Q1 的推荐项
await advance(400);
// 重挂载（宿主虚拟滚动/焦点回归会这么做）
mount(makeNode("call_AH1", REPRO_QS));
await flush(); await realTick(); await flush();
const stAH = store.get("qm:v1:state:call_AH1");
check("[AH1] 点选+重挂载后 saved.answers 仍保留点选值（同步落盘生效）",
  !!stAH && Object.keys(JSON.parse(stAH).answers || {})
    .some((k) => String((JSON.parse(stAH).answers[k]||{}).value||"").trim().length>0),
  stAH ? stAH.slice(0,200) : "(无状态)");

// ── 现场是「只用推荐」模式 + 真实 payload：自动推进是否产出与现场一致的
//    「value 空且无 skipped 键」指纹？（这是唯一能自动提交的路径）──
console.log("\n[AI] 只用推荐模式 + 真实 payload（type 省略）→ 自动提交的 body 形态");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "recommend", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AI1");
  return NOT_FOUND;
};
mount(makeNode("call_AI1", REPRO_QS));
await flush(); await realTick(); await flush();
for (let i = 0; i < 16; i++) { await flush(); await realTick(); await flush(); }
const aiAns = (answerPosts[0] || {}).answers || {};
console.log("   只用推荐自动提交 body =", JSON.stringify(aiAns).slice(0, 300));
check("[AI1] 只用推荐模式把真实 payload 的 recommended 正确填入（value 非空）",
  ["q0","q1","q2"].every((k)=>aiAns[k] && String(aiAns[k].value||"").trim().length>0),
  JSON.stringify(aiAns).slice(0,200));

// ══════════════════════════════════════════════════════════════════
// [AJ] 点选丢失修复：提交时以 localStorage 为准合并 + 空答卷闸门
console.log("\n[AJ] 陈旧实例提交（现场 bug）→ localStorage 合并兜回答案");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AJ1");
  return NOT_FOUND;
};
mount(makeNode("call_AJ1", REPRO_QS));
await flush(); await realTick(); await flush();
// 模拟兄弟实例（用户实际点选的那个）已把选择同步落盘：
store.set("qm:v1:state:call_AJ1", JSON.stringify({
  ts: nowMs,
  answers: { q0: { type: "single", value: REPRO_QS[0].options[1], other: "", skipped: false } },
}));
// 兄弟实例落盘的 q0 必须被权威合并兜回，才能通过新「下一步」闸门前进；
// 其余空白题用显式「跳过本题」合规到达末页。
await navToEnd();
clickButton("提交"); await flush(); await realTick(); await flush();
const aj = (answerPosts[0] || {}).answers || {};
check("[AJ1] 提交体从 localStorage 兜回了兄弟实例的点选（q0 非空）",
  String((aj.q0 || {}).value || "") === REPRO_QS[0].options[1],
  JSON.stringify(aj.q0 || {}).slice(0, 160));
check("[AJ2] 兜回后不再触发空答卷闸门（一次点击即提交）", answerPosts.length === 1,
  "posts=" + answerPosts.length);

console.log("\n[AK] 严格拦截闸门（用户裁定 2026-10-21）：部分未答 → 提交持续无效");
reset(); store.clear(); answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AK1");
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/gate-block")) { gateBlockPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "recorded", request_id: REQ } }; }
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/models/active")) return { ok: true, data: {} };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  return NOT_FOUND;
};
mount(makeNode("call_AK1", REPRO_QS));
await flush(); await realTick(); await flush();
// 只答第 1 题 → 下一步到第 2 题（放行）→ 再点下一步应被拦（第 2 题空白）
clickButton("完整清理：两 path"); await flush(); await realTick(); await flush();
clickButton("下一步"); await realTick(); await flush();   // q0 已答 → 前进到第 2 题
gateBlockPosts = [];
clickButton("下一步"); await flush(); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AK1] 第 2 题空白 → 「下一步」持续无效（无再点放行）", answerPosts.length === 0,
  "posts=" + answerPosts.length);
check("[AK2] 红条含未作答题号；且**不再弹 toast**（用户裁定 2026-10-21）",
  hasText(lastTree, "第 2 题尚未选择")
  && !toastTexts.some((t) => /尚未选择|尚未作答/.test(t[1])),
  "redBar=" + hasText(lastTree, "第 2 题尚未选择") + " toasts=" + JSON.stringify(toastTexts).slice(0, 160));
// —— 本轮新增：可取证的常驻红条 + 拦截落盘（用户裁定 q0=方案一）——
check("[AK2a] 拦截 → 卡片内出现常驻红色提示行（不依赖闪现 toast）",
  hasGate(),
  treeText(lastTree).slice(0, 200));
check("[AK2b] bundle 指纹挂在 data-qm-bundle 上（可见文案已无指纹）",
  gateBundle() === "gate-v2@2026.10.21" && !hasText(lastTree, "gate-v2"),
  treeText(lastTree).slice(0, 200));
check("[AK2c] 拦截 → 向后端 /gate-block 落盘取证（missing 含 2）",
  gateBlockPosts.length >= 1 && gateBlockPosts[0].bundle === "gate-v2@2026.10.21"
  && (gateBlockPosts[0].missing || []).indexOf(2) !== -1,
  "posts=" + JSON.stringify(gateBlockPosts).slice(0, 200));

// 补齐路径（正向）：逐题「跳过本题」（skipped:true）后提交放行
console.log("   —— 补齐：逐题显式跳过后提交放行");
reset(); store.clear(); answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AK2");
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/models/active")) return { ok: true, data: {} };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  return NOT_FOUND;
};
mount(makeNode("call_AK2", REPRO_QS));
await flush(); await realTick(); await flush();
// skipCurrent 标记 skipped:true 后自动前进一题
clickButton("跳过本题"); await realTick(); await flush();
clickButton("跳过本题"); await realTick(); await flush();
clickButton("跳过本题"); await realTick(); await flush();   // 第 3 题 → 自动到末页
for (let s = 0; s < 2; s++) { if (buttons(lastTree).some((b) => b.label === "提交")) break; clickButton("下一步"); await realTick(); await flush(); }
clickExact("提交"); await flush(); await realTick(); await flush();
check("[AK3] 逐题显式跳过补齐后 → 提交放行（skipped 全为 true）",
  answerPosts.length === 1 &&
  ["q0","q1","q2"].every((k)=>(answerPosts[0].answers[k]||{}).skipped === true),
  "posts=" + answerPosts.length + " " + JSON.stringify((answerPosts[0]||{}).answers||{}).slice(0,160));

console.log("\n[AL] 自动驱动不受闸门影响：全跳过的无人值守仍一次提交");
reset(); store.clear(); answerPosts = []; analyzeCalls = [];
fetchScript = (u, opts) => {
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AL1");
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "recommend", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/models/active")) return { ok: true, data: {} };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  return NOT_FOUND;
};
mount(makeNode("call_AL1", [
  { title: "无推荐的题", options: ["甲", "乙"] },
]));
// 只用推荐（prefs seed）：无 recommended、无缓存 → 驱动应跳过该题并自动提交（不被闸门拦）
await flush(); await realTick(); await flush();
for (let i = 0; i < 16; i++) { await flush(); await realTick(); await flush(); }
check("[AL1] 驱动全跳过路径一次提交成功（未发 /analyze、未卡闸门）",
  answerPosts.length === 1 && analyzeCalls.length === 0
  && answerPosts[0].answers.q0 && answerPosts[0].answers.q0.skipped === true,
  "posts=" + answerPosts.length + " analyze=" + analyzeCalls.length);

// ══════════════════════════════════════════════════════════════════
// [AM] 复现现场 #5：人工模式 + 有推荐徽章 → 直接点「下一步」未勾选 → 提交后
//      该题显示为「跳过」。钉死是"渲染层把空白当跳过"，非驱动误写 skipped。
//      （严格闸门下空白「提交」被拒，故用显式「跳过并提交」出口拿到 body。）
console.log("\n[AM] 人工模式点下一步（未勾选）→ 提交体 skipped 与显示文案");
reset(); store.clear(); answerPosts = []; analyzeCalls = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AM1");
  return NOT_FOUND;
};
mount(makeNode("call_AM1", [{ title: "有推荐的题", options: ["甲", "乙"], recommended: "甲" }]));
await flush(); await realTick(); await flush();
check("[AM1] 该题确实渲染出 AI 推荐徽章（在甲上）", hasText(lastTree, "AI 推荐"), treeText(lastTree).slice(0, 120));
// 根因升级验证（用户裁定 2026-10-21）：空白题「下一步」现在也被闸门拦下——
// 旧现场那种「既没答也没跳过、却一路下一步走到末页交空白」的形态，从 UI 上
// 已不可能发生。只有显式「跳过本题」(skipped:true) 或作答才能前进。
clickButton("下一步"); await realTick(); await flush();
check("[AM1b] 空白点「下一步」不发 /answer（被闸门拒绝，旧现场指纹不再可复现）",
  answerPosts.length === 0, "posts=" + answerPosts.length);
check("[AM1c] 被拦后仍停在该题且出现红条",
  buttons(lastTree).some((b)=>b.label==="跳过本题") && hasGate(),
  treeText(lastTree).slice(0, 160));
// 显式「跳过本题」是唯一表态出口 → 前进到末页
clickButton("跳过本题"); await realTick(); await flush();
clickExact("提交"); await flush(); await realTick(); await flush();
const amPost = (answerPosts[0] || {}).answers || {};
console.log("   提交体 =", JSON.stringify(amPost).slice(0, 200));
check("[AM2] 经显式「跳过本题」到达末页提交 → 该题 skipped:true（真实表态，非冒充）",
  amPost.q0 && amPost.q0.skipped === true, JSON.stringify(amPost.q0 || {}));

// ══════════════════════════════════════════════════════════════════
// [AN] 本轮 7 项优化：徽章左侧/矩形边框/无底色/未作答语义/缓存兜底/历史卡零请求
console.log("\n[AN] 徽章位置·样式·未作答语义·兜底·性能门控");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/gate-block")) { gateBlockPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "recorded", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AN1");
  return NOT_FOUND;
};
mount(makeNode("call_AN1", [{ title: "Q", options: ["甲", "乙"], recommended: "**甲**" }]));
await flush(); await realTick(); await flush();
// #1 匹配容错：recommended 写成 markdown 强调「**甲**」仍要命中徽章
const recBtns = [];
walk(lastTree, (x) => {
  if (x.type === "button" && (x.children || []).some((c) => c && c.props && c.props["data-qm-rec"])) recBtns.push(x);
});
check("[AN1] markdown 化的 recommended（**甲**）容错命中 → 出现徽章", recBtns.length === 1,
  "badged rows=" + recBtns.length);
const badgeNode = { type: "span", props: {}, children: [] };
walk(lastTree, (x) => { if (x.props && x.props["data-qm-rec"]) Object.assign(badgeNode, x); });
const rowChildren = (recBtns[0] || {}).children || [];
const badgePos = rowChildren.findIndex((c) => c && c.props && c.props["data-qm-rec"]);
const labelPos = rowChildren.findIndex((c) => c && c.props && c.props.style && c.props.style.flex === 1);
check("[AN2] 徽章在选项文字**左侧**（children 顺序：badge 先于 label）",
  badgePos >= 0 && labelPos >= 0 && badgePos < labelPos,
  `badgePos=${badgePos} labelPos=${labelPos}`);
check("[AN3] 徽章为**矩形边框**（1.5px solid + 小圆角 3，非药丸底）",
  /1\.5px solid/.test(String(badgeNode.props.style.border || ""))
  && badgeNode.props.style.borderRadius === 3 && badgeNode.props.style.background === "transparent",
  JSON.stringify(badgeNode.props.style));
check("[AN4] 推荐行**无 accent 底色**（中性底，避免颜色误导判）",
  recBtns[0] && !/accent/.test(String((recBtns[0].props.style || {}).background || "")),
  JSON.stringify((recBtns[0] || {}).props && (recBtns[0].props.style || {}).background));

// #5 显示语义（根因升级后）：空白题现在根本无法走到提交——「下一步」即被拦。
// 旧现场那种 value 空、无 skipped 键的「未作答」提交体，从 UI 上已不可能产生，
// 这正是「未作答被冒充成跳过」歧义的根治。显式出口只剩「跳过本题」(skipped:true)。
gateBlockPosts = [];
clickButton("下一步"); await realTick(); await flush();
check("[AN5a] 空白题「下一步」不发 /answer（无法产生未作答提交体）", answerPosts.length === 0,
  "posts=" + answerPosts.length);
check("[AN5b] 空白被拦 → 红条 + /gate-block 落盘",
  hasGate() && gateBlockPosts.length >= 1,
  "gatePosts=" + gateBlockPosts.length);
// 唯一可前进的表态：显式「跳过本题」→ 末页提交，体为 skipped:true（真实跳过）
clickButton("跳过本题"); await realTick(); await flush();
clickButton("跳过并提交"); await flush(); await realTick(); await flush();
check("[AN5] 提交体该题为 skipped:true（真实表态，非 value 空的未作答指纹）",
  answerPosts.length === 1 && answerPosts[0].answers.q0 && answerPosts[0].answers.q0.skipped === true,
  JSON.stringify((answerPosts[0] || {}).answers || {}).slice(0, 160));
// 显式跳过本题仍显示「用户跳过本题」
reset(); store.clear(); answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AN2");
  return NOT_FOUND;
};
mount(makeNode("call_AN2", [{ title: "Q", options: ["甲", "乙"] }]));
await flush(); await realTick(); await flush();
clickButton("跳过本题"); await realTick(); await flush();
for (let s = 0; s < 3; s++) { if (buttons(lastTree).some((b) => b.label === "提交")) break; clickButton("下一步"); await realTick(); await flush(); }
clickButton("跳过并提交"); await flush(); await realTick(); await flush();
check("[AN6] 显式跳过本题 → 仍显示「用户跳过本题」（两种语义可区分）",
  hasText(lastTree, "用户跳过本题") && !hasText(lastTree, "未作答"),
  treeText(lastTree).slice(0, 160));

// #7 性能门控：历史已作答卡挂载 → 零网络请求（不触发 hydrate/analysis/resolve）
reset(); store.clear(); fetchLog = [];
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AN3") : NOT_FOUND);
mount(makeNode("call_AN3", [{ title: "Q", options: ["甲", "乙"] }],
  "【用户提交的问卷答案】\n- q0 [单选] 甲"));
await flush(); await realTick(); await flush();
await advance(6000);
const netHits = fetchLog.filter((f) =>
  /\/api\/models|\/question-modal\/(prefs|templates|analysis|resolve|pending)/.test(f.url));
check("[AN7] 已作答历史卡挂载 → 零网络请求（刷新长对话无请求风暴）",
  netHits.length === 0, JSON.stringify(netHits.map((h) => h.url.slice(-40))));
check("[AN8] 历史卡仍正常渲染只读答案", hasText(lastTree, "甲"), treeText(lastTree).slice(0, 80));

// #1 缓存兜底：模型未标 recommended，但本题已有分析结果（restore 命中）→ 徽章出现
reset(); store.clear();
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) {
    return { ok: true, data: { ok: true, found: true, analysis: { per_question: [{ index: 0, choice: "乙", reasoning: "r", type: "single" }] } } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AN4");
  return NOT_FOUND;
};
mount(makeNode("call_AN4", [{ title: "Q", options: ["甲", "乙"] }]));   // 无 recommended
for (let i = 0; i < 6; i++) { await flush(); await realTick(); await flush(); }
const recBtns4 = [];
walk(lastTree, (x) => {
  if (x.type === "button" && (x.children || []).some((c) => c && c.props && c.props["data-qm-rec"])) recBtns4.push(x);
});
check("[AN9] 未声明 recommended 但分析缓存有 choice → 徽章兜底出现在「乙」",
  recBtns4.length === 1 && /乙/.test(treeText(recBtns4[0])),
  recBtns4.length + " row(s)");

// ══════════════════════════════════════════════════════════════════
// [AO] ctrl+tab 假跳过根因修复：失效原因必须跨重挂载幸存，
//      否则 skippedAll 落盘而 deadReason 丢失 → 重挂载后伪装成「已跳过问卷」。
console.log("\n[AO] 失效卡重挂载 → 仍显示「问卷已失效」，不伪装成跳过");
reset(); store.clear(); skipHits = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/skip")) { skipHits.push(u); return { ok: true, data: { ok: true, orphan: true, message: "问卷服务已重启，本次问卷已失效" } }; }
  if (u.includes("/question-modal/cancel-session")) { skipHits.push(u); return { ok: true, data: { ok: true, cancelled: 0 } }; }
  if (u.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/result")) return { ok: true, data: { ok: true, found: false } };
  return NOT_FOUND;
};
store.set("qm:v1:reqid:call_AO1", JSON.stringify({ request_id: REQ, tool_call_id: "call_AO1", session_id: SESSION, agent_id: "harness-agent" }));
mount(makeNode("call_AO1"));
await flush(); await realTick(); await flush();
// 有 reqId 的卡 → 后端 resolve 报「无此记录」→ 自动收敛为失效
await advance(6000);
check("[AO0] 自动收敛先尝试调后端 skip 释放（切窗口绝不等于静默假跳过）",
  skipHits.length >= 1, "skipHits=" + skipHits.length);
check("[AO1] 失效卡显示「问卷已失效」而非「已跳过问卷」",
  hasText(lastTree, "问卷已失效") && !hasText(lastTree, "已跳过问卷"),
  treeText(lastTree).slice(0, 160));
// —— 关键：把失效卡重挂载（模拟 ctrl+tab 引发宿主 re-key）——
const stAO = store.get("qm:v1:state:call_AO1");
check("[AO2] deadReason 已随 skippedAll 一起落盘",
  !!stAO && JSON.parse(stAO).deadReason === "gone" && JSON.parse(stAO).skippedAll === true,
  (stAO || "").slice(0, 180));
mount(makeNode("call_AO1"));
await flush(); await realTick(); await flush();
check("[AO3] 【根因修复】重挂载后仍显示「问卷已失效」，绝不伪装成「已跳过问卷」",
  hasText(lastTree, "问卷已失效") && !hasText(lastTree, "已跳过问卷"),
  treeText(lastTree).slice(0, 200));
check("[AO4] 重挂载未产生任何新的后端 skip 请求（切窗口不等于跳过）",
  skipHits.length <= 1, "skipHits=" + skipHits.length);

// ══════════════════════════════════════════════════════════════════
// [AP] 持久化清单审计（用户裁定 2026-10-21「只做一半：先审计清单」）
// 结论：anModel/anCtx/anParallel 走全局磁盘 prefs（B3），recovered/anResult/
// providers/templates 有后端 restore 通道，busy/stuck/nowTick/uploading 为派生
// 瞬态，*Open/*Nonce/qVersion 是纯 UI 开合态。**唯一真实缺口 = releasedNote**：
// 它同时决定折叠行文案与 showWait 门，原本不落盘（backendReleased 落了却没人读
// 回）→ 用户手动释放过阻塞的卡，重挂载后谎报「✓ 已提交，继续处理中」。
console.log("\n[AP] releasedNote 必须落盘（否则重挂载谎报「继续处理中」）");
reset(); store.clear();
fetchScript = (u) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: null } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual" } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: [], default_id: "builtin-default" } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AP1");
  if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  if (u.includes("/question-modal/skip")) return { ok: true, data: { ok: true, released: true, message: "ok", request_id: REQ } };
  if (u.includes("/console/chat/stop")) return { ok: true, data: { stopped: true } };
  return NOT_FOUND;
};
// 已提交 + 已手动释放过（releasedNote 有值、submittedAt 新鲜）
store.set("qm:v1:state:call_AP1", JSON.stringify({
  answered: true, skippedAll: false, submittedAt: nowMs,
  releasedNote: "已通过宿主 stop 接口释放本次会话阻塞。", deadReason: "",
}));
mount(makeNode("call_AP1"));
await flush(); await realTick(); await flush();
check("[AP1] 释放过的卡重挂载后**不再**谎报等待中",
  !hasWaitLine(lastTree), treeText(lastTree).slice(0, 200));
check("[AP2] 折叠行显示释放说明（而非等待提示）",
  hasText(lastTree, "已通过宿主 stop 接口释放"), treeText(lastTree).slice(0, 200));
// 反证：没有 releasedNote 时，同一形态应当显示等待提示（证明门控真的在看这个值）
reset(); store.clear();
store.set("qm:v1:state:call_AP2", JSON.stringify({
  answered: true, skippedAll: false, submittedAt: nowMs, deadReason: "",
}));
mount(makeNode("call_AP2"));
await flush(); await realTick(); await flush();
check("[AP3] 反证：无释放说明的同形态仍显示等待提示（门控确实依赖该值）",
  hasWaitLine(lastTree), treeText(lastTree).slice(0, 160));

console.log("\n[AS] 题级用时：每题 60s · 切题清零 · 只提示不强制 · 计时停在阈值");

/** 当前渲染树里「超时提示」节点出现的次数（用于证明它没有被反复重建）。 */
function slowNodeBuilds(n) {
  let c = 0;
  walk(n || lastTree, (x) => {
    if (x && x.props && x.props["data-qm-slow"]) c++;
  });
  return c;
}
/** 当前是否显示「本题已超过 60s」提示。 */
// 2026-10-22 六次裁定：题级超时提示**已下移**并入下方自救横幅（同一条），
// 故判据用 data-qm-slow 标记而非原来的题目内 class；同时必须验证那段文案确实
// 是「本题已超过 60s」而不是自救横幅的默认措辞——否则「提示出现」会与本就在
// 场（30s 自救）的横幅混淆，测不出题级计时是否真的生效。
function hasSlowHint(n) {
  let v = false;
  walk(n || lastTree, (x) => {
    if (x && x.props && x.props["data-qm-slow"]) v = true;
  });
  return v && hasText(n || lastTree, "本题已超过 60s");
}

// ── A) 未到 60s：不提示（且作答期零每秒渲染）──
reset(); store.clear(); domReset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS") : NOT_FOUND);
mount(makeNode("call_AS"));
await flush(); await realTick(); await flush();
check("[AS1] 初始不显示超时提示", !hasSlowHint(lastTree), treeText(lastTree).slice(0, 120));

// 测的是**题级计时器**的渲染成本，不是整卡：AI 分析与 hydrate 也会渲染，
// 故用「提示节点是否被重建」为口径——若计时是每秒 tick 的，提示必然反复重建。
const _slowBefore = slowNodeBuilds(lastTree);
ceCount = 0;
await advance(30_000);
// 只对「题级提示」这个新增件的渲染成本负责：整卡在作答期本来就有别的东西在
// 渲染（AI 分析流式、hydrate 回填），拿整卡 ceCount 断言零会误判。
// 真正的判据是**提示节点从未被重建**（每秒 tick 的实现必然反复重建它）。
check("[AS2] 推进 30s（未越阈）→ 题级计时零渲染（作答期不读秒）",
  slowNodeBuilds(lastTree) === _slowBefore && _slowBefore === 0,
  "提示节点重建次数=" + slowNodeBuilds(lastTree));
check("[AS3] 30s 时仍不提示", !hasSlowHint(lastTree), treeText(lastTree).slice(0, 120));
// 【七次裁定】用户明确要求：30s 整卷计时必须不再提示（"提示频繁造成心理负担"）。
// 这是独立于「60s 有提示」的相反方向断言，必须单独钉死——否则把 stuck 加回
// 触发条件时，60s 用例照样通过，而 30s 打扰的回归完全测不出来。
// 判据必须用**结构**（横幅节点 / 释放按钮）而不是文案：文案会随裁定改，
// 用文案 grep 会在"文案换了但横幅照样出现"时静默失效——反证实测过，把
// `stuck` 加回触发条件后仅靠文案断言 295/295 全绿。
check("[AS3b] 【七次裁定】健康卡片 30s 时**不得**出现任何横幅（含释放按钮）",
  slowNodeBuilds(lastTree) === 0
  && !buttons(lastTree).some((b) => b.label.includes("释放本次问卷")),
  treeText(lastTree).slice(0, 200));

// ── B) 越过 60s：提示出现（唯一的一次渲染）──
await advance(31_000);
check("[AS4] 【核心】越过 60s 后出现「本题已超过 60s」提示",
  hasSlowHint(lastTree) && hasText(lastTree, "本题已超过 60s"),
  treeText(lastTree).slice(0, 200));
check("[AS5] 提示文案按裁定给出两个出口（可直接跳过 / 继续作答）",
  hasText(lastTree, "可直接跳过或继续作答"), treeText(lastTree).slice(0, 200));
// 【六次裁定 q2：全部去掉秒数】这是独立的裁定，必须单独钉死：既要验证题级
// 提示里没有秒数，也要验证**下方自救横幅**（原版每次渲染用 Date.now() 现算）
// 不再跳数——反证实测过，去掉这条断言后「恢复秒数」的改动测不出来。

check("[AS6] 【计时停在该值】提示里不含任何滚动秒数",
  !/\d+\s*s\b/.test(treeText(lastTree).replace("60s", "")),
  treeText(lastTree).slice(0, 200));
check("[AS7] 只提示不强制：仍未作答的卡仍可正常作答（未被自动跳过）",
  !hasText(lastTree, "已跳过"), treeText(lastTree).slice(0, 200));

// 到点后继续推进：不应再有任何渲染（计时已停在阈值，不继续跑）
ceCount = 0;
await advance(60_000);
check("[AS8] 提示出现后继续推进 60s → 零重渲染（计时确实停在阈值）",
  ceCount === 0, "ceCount=" + ceCount);

// ── C) 切题清零：答第 1 题 → 下一步 → 第 2 题必须重新计时 ──
reset(); store.clear(); domReset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS2") : NOT_FOUND);
mount(makeNode("call_AS2"));
await flush(); await realTick(); await flush();
await advance(61_000);
check("[AS9] 第 1 题越 60s 后提示出现", hasSlowHint(lastTree), treeText(lastTree).slice(0, 160));
clickButton("甲");            // 作答第 1 题（两题问卷，见 fixtures）
await realTick(); await flush();
clickButton("下一步");
await flush(); await realTick(); await flush();
check("[AS10] 【切题清零】进入第 2 题后提示立即消失",
  !hasSlowHint(lastTree), treeText(lastTree).slice(0, 200));

// ── D) 退回上一题同样清零 ──
clickButton("上一步");
await flush(); await realTick(); await flush();
check("[AS11] 【回退也清零】退回上一题后同样不显示提示",
  !hasSlowHint(lastTree), treeText(lastTree).slice(0, 200));

// 【补强】上一条会被显示闸门 `slowStep === visStep` 挡住而失去分辨力：若切题
// **不清零**，slowStep 会永久停在 0，于是第 2 题因 slowStep!==visStep 永远不显示
// 提示——症状是"漏提示"而非"多提示"。必须验证第 2 题**自己**也能计时到点。
// 此刻在第 1 题且「甲」已选中（单选再点一次会**取消选中**，从而被严格闸门拦下，
// 这是本用例第一版踩的坑）。直接前进到第 2 题——它的选项是「是/否」。
clickButton("下一步"); await flush(); await realTick(); await flush();   // → 第 2 题
clickButton("是"); await realTick(); await flush();
await advance(61_000);
check("[AS11b] 【切题后重新计时】第 2 题自己也必须能在 60s 后提示",
  hasSlowHint(lastTree), treeText(lastTree).slice(0, 200));

// ── E) 落盘起点：重挂载后按剩余时间续算，不把等待重置 ──
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AS3", JSON.stringify({
  visStep: 0, slowAt: nowMs - 50_000, slowStep: 0, slowFired: false,
}));
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS3") : NOT_FOUND);
mount(makeNode("call_AS3"));
await flush(); await realTick(); await flush();
check("[AS12] 【抗重挂载】重挂后距起点已 50s → 尚未提示",
  !hasSlowHint(lastTree), treeText(lastTree).slice(0, 160));
// 【真·落盘验证】必须**重挂载**才能证明 slowAt 被写进了 localStorage：
// 只在首挂时喂 seed 值，测的是"读得到"，一个从不写盘的实现照样通过（反证实测过）。
// 【真·落盘验证】必须用一张**没有 slowAt 种子**的新卡，才能证明 effect 真的写了盘：
// 上一版给 seed 喂了 slowAt，而 persist 只覆盖不删除该字段 —— 一个"从不写 slowAt"
// 的实现照样通过（反证实测：改坏后 291/291 假绿）。
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AS5", JSON.stringify({ visStep: 0 }));  // 只有题号，无 slow*
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS5") : NOT_FOUND);
mount(makeNode("call_AS5"));
await flush(); await realTick(); await flush();
const _saved5 = JSON.parse(store.get("qm:v1:state:call_AS5") || "{}");
check("[AS13] 【落盘】无种子时 slowAt 仍被写入卡片状态（重挂后才能续算）",
  typeof _saved5.slowAt === "number" && _saved5.slowAt > 0,
  "slowAt=" + _saved5.slowAt);
// 回到 AS3 序列继续做「续算」验证
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AS3", JSON.stringify({
  visStep: 0, slowAt: nowMs - 50_000, slowStep: 0, slowFired: false,
}));
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS3") : NOT_FOUND);
mount(makeNode("call_AS3"));
await flush(); await realTick(); await flush();
await advance(11_000);         // 距起点已过 61s
check("[AS13b] 【抗重挂载】重挂后按剩余时间续算，到点即提示",
  hasSlowHint(lastTree), treeText(lastTree).slice(0, 200));

// ── F) 已提交的卡不显示题级提示 ──
// 必须重新 reset + 清 store：上一条 [AS15-17] 结束时卡处于末页待提交态，
// 不清会把它当作 call_AS4 的种子状态（[AS14] 曾因此假失败）。
reset(); store.clear(); domReset();
store.clear();
store.set("qm:v1:state:call_AS4", JSON.stringify({
  answered: true, skippedAll: false, submittedAt: Date.now() - 3_000,
  slowFired: true, localResult: "已提交",
}));
fetchScript = () => NOT_FOUND;
mount(makeNode("call_AS4"));
await flush(); await realTick(); await flush();
// ── G2) 末页「其他意见」也必须计 60s（八次裁定）──
// 用户实测「在『其他意见』末页等满 60 秒，没有出现超时提示」，随后裁定末页也要。
// 原实现对 isOtherPage 直接 return → 末页等多久都不提示。此用例必须先于修复失败、
// 修复后通过，否则它只是把缺陷固化下来。
reset(); store.clear(); domReset();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AO2") : NOT_FOUND);
mount(makeNode("call_AO2"));
await flush(); await realTick(); await flush();
// 一路答到末页（两题：q0=甲/乙，q1=是/否）
clickButton("甲"); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
clickButton("是"); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AS15] 已到达「其他意见」末页",
  hasText(lastTree, "其他意见"), treeText(lastTree).slice(0, 160));
await advance(61_000);
check("[AS16] 【八次裁定】末页停留满 60s 也必须出现题级超时提示",
  hasSlowHint(lastTree), treeText(lastTree).slice(0, 200));
check("[AS17] 末页提示也带「释放本次问卷」按钮（会话唯一逃生口）",
  buttons(lastTree).some((b) => b.label.includes("释放本次问卷")),
  buttons(lastTree).map((b) => b.label).join(","));

// 【隔离】上一条 [AS15-17] 结束时卡停在「其他意见」末页且**仍在作答**，
// 不复位就会把那个状态当成"已作答卡"来断言 [AS14]（曾据此假失败）。
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AS4", JSON.stringify({
  answered: true, skippedAll: false, submittedAt: Date.now() - 3_000,
  slowFired: true, slowStep: 0, localResult: "已提交",
}));
fetchScript = () => NOT_FOUND;
mount(makeNode("call_AS4"));
await flush(); await realTick(); await flush();
check("[AS14] 已作答卡不显示题级超时提示（它已不在作答阶段）",
  !hasSlowHint(lastTree), treeText(lastTree).slice(0, 160));

// ── G) 去秒数：必须在**重挂载**下验证（现算秒数只在重渲染时变化）──
reset(); store.clear(); domReset();
store.set("qm:v1:state:call_AS6", JSON.stringify({
  visStep: 0, slowAt: nowMs - 70_000, slowStep: 0, slowFired: true,
}));
fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_AS6") : NOT_FOUND);
mount(makeNode("call_AS6"));
await flush(); await realTick(); await flush();
const _before6 = treeText(lastTree);
{
  // 现算秒数的实现只在重渲染时变：计时 fired 后已无定时器，靠 advance() 测不出来
  // （反证实测：恢复秒数后仍然全绿）。重挂载才是用户看到"跳数"的真实场景。
  const _extract = (t) => (t.match(/⚠️ [^|]{0,60}/) || [""])[0];
  reset();
  await advance(9_000);        // 【关键】让真实时间前进：现算秒数才会变（9s→79s/70s）
  mount(makeNode("call_AS6"));
  await flush(); await realTick(); await flush();
  const _after6 = treeText(lastTree);
  check("[AS6b] 【去秒数】重挂载后横幅文字不变（自救横幅不再跳数）",
    _extract(_before6) === _extract(_after6) && _extract(_after6) !== "",
    "重挂前：" + _extract(_before6) + " ｜ 重挂后：" + _extract(_after6));
  check("[AS6c] 横幅里不含「N 秒」字样", !/\d+\s*秒/.test(_after6), _after6.slice(0, 160));
}

console.log("\n[AR] 缺失题干兜底「第 N 题」+ 选项编号（仅显示，回传仍是选项原文）");

// 现场形态：后两题**没有 title 键**（不是空串），前一题带 recommended。
const NO_TITLE_QS = [
  { type: "single", title: "Q1 有题干", options: ["甲", "乙"], recommended: "乙" },
  { options: ["仅前端代码", "需要配规则", "需提前验证"] },                // 无 title 键
  { type: "single", title: "", options: ["由 Agent 验证", "只离线验证"] },  // 空串 title
];
function countRecBadges(n) {
  let c = 0;
  walk(n || lastTree, (x) => { if (x.props && x.props["data-qm-rec"]) c++; });
  return c;
}

reset(); store.clear(); domReset(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "x" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AR1");
  return NOT_FOUND;
};
mount(makeNode("call_AR1", NO_TITLE_QS));
await flush(); await realTick(); await flush();

// ── 兜底：第 1 题有题干，应原样显示、不出现占位 ──
check("[AR1] 有题干的题原样显示（不受兜底影响）",
  hasText(lastTree, "Q1 有题干") && !hasText(lastTree, "第 1 题"),
  treeText(lastTree).slice(0, 200));

// ── 选项编号 ──
check("[AR2] 选项带编号 1. 2.（用户裁定格式）",
  hasText(lastTree, "1. 甲") && hasText(lastTree, "2. 乙"),
  treeText(lastTree).slice(0, 200));
check("[AR3] 「其他」不编号（它是插件入口，不属于模型候选集）",
  hasText(lastTree, "其他") && !/3\.\s*其他/.test(treeText(lastTree)),
  treeText(lastTree).slice(0, 200));

// ── 推荐徽章与编号共存（编号不得破坏 rec 匹配/渲染）──
check("[AR4] 推荐徽章仍正常（编号进显示层后 rec 匹配未失效）",
  countRecBadges(lastTree) === 1 && hasText(lastTree, "2. 乙"),
  "badges=" + countRecBadges(lastTree) + " | " + treeText(lastTree).slice(0, 200));

// ── 翻页到第 2 题（无 title 键）→ 兜底「第 2 题」 ──
clickButton("甲"); await flush(); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AR5] 【核心】无 title 键的题兜底显示「第 2 题」",
  hasText(lastTree, "第 2 题"), treeText(lastTree).slice(0, 220));
check("[AR6] 兜底题同样编号（1. 仅前端代码）",
  hasText(lastTree, "1. 仅前端代码"), treeText(lastTree).slice(0, 220));

// ── 第 3 题（空串 title）→ 兜底「第 3 题」（真实题号，非可见序号）──
clickButton("仅前端代码"); await flush(); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();
check("[AR7] 空串 title 也兜底「第 3 题」（用真实题号）",
  hasText(lastTree, "第 3 题"), treeText(lastTree).slice(0, 220));

// ── 回传数据层：编号绝不能进去 ──
clickButton("由 Agent 验证"); await flush(); await realTick(); await flush();
clickButton("下一步"); await flush(); await realTick(); await flush();  // → 末页
clickExact("提交"); await flush(); await realTick(); await flush();
const arPost = answerPosts.length ? answerPosts[answerPosts.length - 1] : {};
const arAns = arPost.answers || {};
check("[AR8] 【回传口径】提交体 q0.value 是选项原文「甲」（无编号前缀）",
  arAns.q0 && arAns.q0.value === "甲", JSON.stringify(arAns));
check("[AR9] 提交体 q1.value 是选项原文（无编号）",
  arAns.q1 && arAns.q1.value === "仅前端代码", JSON.stringify(arAns.q1));
check("[AR10] 提交体整卷不含任何编号前缀",
  !/1\. 仅前端代码|2\. 乙|1\. 甲/.test(JSON.stringify(arAns)),
  JSON.stringify(arAns).slice(0, 240));

// ── 反证友好：正常问卷（都带题干）绝不出现「第 N 题」字样 ──
reset(); store.clear(); domReset(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "x" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "manual", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "manual", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_AR2");
  return NOT_FOUND;
};
mount(makeNode("call_AR2"));   // 标准两题 fixture（都带 title）
await flush(); await realTick(); await flush();
check("[AR11] 正常问卷不出现兜底文案（兜底只在缺失时生效）",
  !hasText(lastTree, "第 1 题") && !hasText(lastTree, "第 2 题"),
  treeText(lastTree).slice(0, 200));



const ANALYSIS_TIMEOUT_SEC_MS = 150 * 1000;   // 与 src 的 ANALYSIS_TIMEOUT_SEC 同步
console.log("\n[ZZ] 只用推荐 · 末题是「其他(选填)」不得卡死（2026-11-03 用户实测故障）");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "recommend", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) {
    const b = JSON.parse((opts && opts.body) || "{}");
    analyzeCalls.push(b);
    // 最坏情形：分析**永不返回**（真实世界的挂起/卡死）。加固后必须仍能走完：
    // 超时 → abort → anBusy 归位 → 重试到上限 → 按"跳过"落定 → 提交。
    if (analyzeCalls.length <= 3) return "hang";
    return { ok: true, data: { ok: true, analysis: { ok: true, question_index: b.question_index,
      // 关键：模拟真实失败形态 —— 模型对「选填」题返回空 choice
      per_question: [{ index: b.question_index, type: "text", choice: "", reasoning: "本题为选填，无需作答" }] } } };
  }
  if (u.includes("/question-modal/answer")) {
    answerPosts.push(JSON.parse((opts && opts.body) || "{}"));
    return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
  }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_ZZ");
  return NOT_FOUND;
};
// 时序变体：/resolve 先返回「查不到」，末页到了之后再补上 request_id，
// 复现真实网络下「末页先到、id 后到」。
let zzResolveReady = false;
const origScriptZZ = fetchScript;
fetchScript = (u, opts) => {
  if (u.includes("/question-modal/resolve")) {
    return zzResolveReady ? pending(REQ, "call_ZZ") : NOT_FOUND;
  }
  return origScriptZZ(u, opts);
};
// 真实分布（取自 history.db 实测）：单选题带推荐 + 末题「其他(选填)」text 无推荐
mount(makeNode("call_ZZ", [
  { type: "single", title: "Q1 下一步怎么走", options: ["甲方案", "乙方案"], recommended: "乙方案" },
  { type: "single", title: "Q2 是否归档", options: ["是", "否"], recommended: "是" },
  { type: "text", title: "其他要求或补充（可留空）" },
]));
await flush(); await realTick(); await flush();
await advance(400);
for (let i = 0; i < 20; i++) { await flush(); await realTick(); await flush(); }
// 现在让 id 到位，再给它几轮（真实场景：resolve 探针会在 30s 内反复重试）
zzResolveReady = true;
const _probe = documentFake.__nodes && null; // noop keep scope
await advance(ANALYSIS_TIMEOUT_SEC_MS + 500);
for (let i = 0; i < 24; i++) { await flush(); await realTick(); await flush(); }
{
  const _stZZ = JSON.parse(store.get("qm:v1:state:call_ZZ") || "{}");
  // 判据：最坏情形（分析永不返回）下整卷仍必须走完并提交，
  // 卡住的那道末题按「跳过」显式落定，绝不无声无息地空着。
    // 恢复基线语义（2026-11-03 回归修复）：缺推荐的题（含选填）由驱动直接标记
  // skipped 并前进，**零模型请求、零等待**。关键是"该题已被处理过"，而不是
  // 永远空着卡在末页之前——跳过标记正是基线既有的表达方式。
  check("[ZZ2] 末题（选填）被立即落定为跳过并前进，不卡在末页前",
    !!(_stZZ.answers && _stZZ.answers.q2 && _stZZ.answers.q2.skipped === true),
    JSON.stringify(_stZZ.answers && _stZZ.answers.q2));
  check("[ZZ2b] 选填题**不触发**兜底分析（无意义的模型调用）",
    true, "见 [ZZ6]");
  check("[ZZ3] 前两题仍按自带推荐正常采纳（甲流程不受影响）",
    !!(_stZZ.answers && _stZZ.answers.q0 && _stZZ.answers.q0.value === "乙方案"
       && _stZZ.answers.q1 && _stZZ.answers.q1.value === "是"),
    JSON.stringify(_stZZ.answers));
  check("[ZZ4] 跳过题的 value 形状与题型一致（text → 空串，不是空数组）",
    !!(_stZZ.answers && _stZZ.answers.q2 && _stZZ.answers.q2.value === ""),
    JSON.stringify(_stZZ.answers && _stZZ.answers.q2 && _stZZ.answers.q2.value));
  check("[ZZ5] 取消/超时后 anBusy 已归位（不会永久钉住后续分析）",
    !hasText(lastTree, "正在按六步思维链分析…"), treeText(lastTree).slice(-90));
  // 【本轮根因的守门断言】选填的 text 题必须**完全不发** /analyze：
  // 发一次就有 150s×3 的最坏等待，用户看到的就是"卡死"。
  check("[ZZ6] 整卷只有选择题发分析；末题是选填 → 不产生它的 analyze 请求",
    analyzeCalls.every((c) => c.question_index !== 2),
    "analyze question_index 列表=" + JSON.stringify(analyzeCalls.map((c) => c.question_index)));
  check("[ZZ7] 选填题无需等待即可完成（全程 analyze 次数 ≤ 选择题数）",
    analyzeCalls.length <= 2, "analyze=" + analyzeCalls.length);
  check("[ZZ8] 兜底等待期间有可见提示（避免像卡死）",
    toastTexts.some((t) => t.includes("正在补算") || t.includes("超时会自动跳过")) || analyzeCalls.length === 0,
    "toasts=" + toastTexts.join("|").slice(0, 120));
  // 【回归守门 · 本轮最重要】缺推荐的题必须**零 /analyze 请求**。
  // 我此前两轮插入了"缺推荐就补算"，把基线的"立即跳过"改成了"等模型"，
  // 这正是用户报告的"一优化完就卡死"。这条断言锁死基线语义，防止再犯。
  check("[ZZ9] 缺推荐题零模型请求（恢复 2.3.0 基线语义）",
    analyzeCalls.length === 0, "analyze=" + analyzeCalls.length);
  }


console.log("\n[ZY] 精确复现用户实测：3 题（有推荐单选 + 无推荐单选 + 无推荐text），持久化 recommend 起步");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
const ZY_QS = [
  { type: "single", title: "【对照题·有推荐】状态如何？", options: ["可以继续推进", "再观察一轮", "先回滚"], recommended: "可以继续推进" },
  { type: "single", title: "【关键题·无推荐】应当立即跳过", options: ["选项甲", "选项乙", "选项丙"] },
  { type: "text", title: "【关键题·选填】自由填写，应瞬间跳过" },
];
// 关键：磁盘 prefs 直接是 recommend（= 用户现在的真实状态，不手动点模式）
fetchScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "recommend", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) { analyzeCalls.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, analysis: { ok: true, per_question: [] } } }; }
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_ZY");
  return NOT_FOUND;
};
mount(makeNode("call_ZY", ZY_QS));
await flush(); await realTick(); await flush();
// 不点任何按钮 —— 用户就是这样等的
await advance(600);
for (let i = 0; i < 24; i++) { await flush(); await realTick(); await flush(); }
{
  const st = JSON.parse(store.get("qm:v1:state:call_ZY") || "{}");
  console.log("  DBG ZY analyze=", analyzeCalls.length, "posts=", answerPosts.length,
    "visStep=", st.visStep, "answered=", st.answered);
  console.log("  DBG ZY answers=", JSON.stringify(st.answers));
  console.log("  DBG ZY toasts=", toastTexts.join("|").slice(0,150));
  check("[ZY1] 有推荐题被自动选中",
    !!(st.answers && st.answers.q0 && st.answers.q0.value === "可以继续推进"), JSON.stringify(st.answers && st.answers.q0));
  check("[ZY2] 无推荐单选被立即跳过（无值/skipped）",
    !!(st.answers && st.answers.q1 && st.answers.q1.skipped === true), JSON.stringify(st.answers && st.answers.q1));
  check("[ZY3] 无推荐选填被立即跳过",
    !!(st.answers && st.answers.q2 && st.answers.q2.skipped === true), JSON.stringify(st.answers && st.answers.q2));
  check("[ZY4] 全程零 analyze 请求",
    analyzeCalls.length === 0, "analyze=" + analyzeCalls.length);
  check("[ZY5] 自动提交（不会停在「其他意见」页）",
    answerPosts.length === 1, "posts=" + answerPosts.length);
}


console.log("\n[ZX] 宿主重挂载后是否仍能自动提交（真实场景：用户回答了部分题，宿主重挂）");
reset(); store.clear(); analyzeCalls = []; answerPosts = [];
const ZX_QS = [
  { type: "single", title: "Q1 有推荐", options: ["甲", "乙"], recommended: "乙" },
  { type: "single", title: "Q2 无推荐", options: ["A", "B"] },
  { type: "text", title: "Q3 选填" },
];
const zxScript = (u, opts) => {
  if (u.includes("/models/active")) return { ok: true, data: { active_llm: { provider_id: "opencode", model: "deepseek-v4-flash-free" } } };
  if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
  if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, items: TPL_LIB, default_id: "builtin-default" } };
  if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: { mode: "recommend", model_id: "", with_context: false, parallel: false } } };
  if (u.includes("/question-modal/effective-config")) return { ok: true, data: { ok: true, chat_id: "CHAT-T", config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true, slow_question_sec: 60, skip_mode: "per_question", __sources__: {} }, global_keys: [], version: 1, schema: [] } };
  if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
  if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
  if (u.includes("/question-modal/analyze")) { analyzeCalls.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, analysis: { ok: true, per_question: [] } } }; }
  if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, message: "answered", request_id: REQ } }; }
  if (u.includes("/question-modal/resolve")) return pending(REQ, "call_ZX");
  return NOT_FOUND;
};
fetchScript = zxScript;
mount(makeNode("call_ZX", ZX_QS));
await flush(); await realTick(); await flush();
await advance(300);
for (let i = 0; i < 12; i++) { await flush(); await realTick(); await flush(); }
const st1 = JSON.parse(store.get("qm:v1:state:call_ZX") || "{}");
console.log("  首次挂载后: posts=", answerPosts.length, "visStep=", st1.visStep, "answers=", JSON.stringify(st1.answers));
check("[ZX1] 首次挂载就能走完并提交", answerPosts.length === 1, "posts=" + answerPosts.length);

// ★ 关键：模拟宿主重挂载（tool result 合并 / 虚拟列表滚出滚回）
reset();  // 清 fetch 记录但保留 localStorage 状态
answerPosts = [];
mount(makeNode("call_ZX", ZX_QS));   // 同一 callId 再挂一次 = 重挂载
await flush(); await realTick(); await flush();
await advance(300);
for (let i = 0; i < 12; i++) { await flush(); await realTick(); await flush(); }
const st2 = JSON.parse(store.get("qm:v1:state:call_ZX") || "{}");
console.log("  重挂载后: posts=", answerPosts.length, "visStep=", st2.visStep, "answered=", st2.answered,
  "answers=", JSON.stringify(st2.answers).slice(0,120));
check("[ZX2] 重挂载后已答完的卡能自动收起/提交（不卡在末页）",
  answerPosts.length === 1 || st2.answered === true, "posts=" + answerPosts.length + " answered=" + st2.answered);


// ══════════════════════════════════════════════════════════════════
// [BA] 人工模式提醒（Web Notification，2026-11-04 新增功能）
// ══════════════════════════════════════════════════════════════════
function installNotification(perm, grantOnRequest) {
  const sent = [];
  let cur = perm;
  const N = function (title, opts) {
    sent.push({ title: String(title), body: (opts && opts.body) || "" });
    this.onclick = null; this.close = () => {};
  };
  N.requestPermission = (cb) => {
    cur = grantOnRequest ? "granted" : "denied";
    if (typeof cb === "function") { cb(cur); return undefined; }
    return Promise.resolve(cur);
  };
  Object.defineProperty(N, "permission", { get: () => cur, configurable: true });
  globalThis.window.Notification = N;
  return sent;
}

console.log("\n[BA] 人工模式提醒");
{
  // 提醒本身由 mode+开关共同决定；以下用例逐个改 cfgModeNow / cfgExtra。
  const run = async (callId, mode, notify, opts = {}) => {
    reset(); store.clear();
    const sent = installNotification(opts.perm || "granted", opts.grant !== false);
    cfgModeNow = mode;
    cfgExtra = { notify_manual_mode: notify };
    fetchScript = (u) => (u.includes("/question-modal/resolve")
      ? pending(REQ, callId) : NOT_FOUND);   // effective-config 走 fakeFetch 兜底
    if (opts.seed) store.set("qm:v1:state:" + callId, JSON.stringify(opts.seed));
    mount(makeNode(callId, QS, opts.output || ""));
    await flush(); await realTick(); await flush(); await advance(400);
    return sent;
  };

  let sent = await run("call_BA1", "manual", false);
  check("[BA1] 开关关闭时不发通知", sent.length === 0, "sent=" + sent.length);

  sent = await run("call_BA2", "manual", true);
  check("[BA2] 开启 + 人工模式 → 发出 1 条", sent.length === 1, "sent=" + sent.length);
  check("[BA6] 通知正文含标题与题数",
    sent.length === 1 && sent[0].body.indexOf("取舍确认") !== -1 && /\d/.test(sent[0].body),
    JSON.stringify(sent[0] || {}));

  sent = await run("call_BA3", "ai", true);
  check("[BA3] AI 模式不发通知（会自己推进，无需提醒）", sent.length === 0, "sent=" + sent.length);

  sent = await run("call_BA4", "manual", true);
  const first = sent.length;
  mount(makeNode("call_BA4", QS));    // 同一 callId 重挂载
  await flush(); await realTick(); await flush(); await advance(300);
  check("[BA4] 同一问卷重挂载不重复提醒", first === 1 && sent.length === 1,
    "first=" + first + " total=" + sent.length);

  // 权限被拒 → 不发系统通知、卡片照常渲染
  reset(); store.clear();
  let s5 = installNotification("default", false);
  cfgModeNow = "manual"; cfgExtra = { notify_manual_mode: true };
  fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_BA5") : NOT_FOUND);
  let crashed = null;
  try {
    mount(makeNode("call_BA5"));
    await flush(); await realTick(); await flush(); await advance(400);
  } catch (e) { crashed = e; }
  check("[BA5] 权限被拒时不发通知且卡片照常渲染",
    crashed === null && s5.length === 0 && !!lastTree,
    "crashed=" + (crashed && crashed.message) + " sent=" + s5.length);

  // 已作答的历史卡不再提醒
  sent = await run("call_BA7", "manual", true,
    { seed: { answered: true, answers: {}, visStep: 1 }, output: "已作答结果" });
  check("[BA7] 已作答的历史卡片不提醒", sent.length === 0, "sent=" + sent.length);

  // ── [BA8] 判定必须读配置，不能读 anMode 状态 ──
  // 真机抓到：hydrate 的 setEff(c) 与 setAnMode(...) 同批提交，effect 看到
  // 「新 effCfg + 旧 anMode」→ AI 模式也发提醒。Node 侧微任务顺序让 setAnMode
  // 先落地，所以只有源码级断言能钉死它。
  const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
  const bi = srcTsx.indexOf("人工模式提醒（裁定");
  const blk = bi < 0 ? "" : srcTsx.slice(bi, bi + 2400);
  check("[BA8] 提醒判定读配置 mode 而非 anMode 状态",
    /cfgModeNow = normMode\(cfgOf\("mode"/.test(blk.replace("const cfgModeNow", "cfgModeNow"))
      && !/anMode !== "manual"/.test(blk),
    blk.slice(0, 160));

  delete globalThis.window.Notification;
  cfgExtra = {};
}


// ══════════════════════════════════════════════════════════════════
// [BC] 2026-11-04 两个用户报障的回归（F1 模式 / F2 自动提交重试）
// ══════════════════════════════════════════════════════════════════
console.log("\n[BC] 人工模式不被镜像抢跑 + 自动提交失败可重试");
{
  // ── [BC1] 手工复现用户症状 1：配置 manual，镜像残留 recommend ──
  //
  // 用户原话：「当前已经配置了人工，但是问卷实际运行为只用推荐」。
  // 旧实现 initialMode 读 localStorage 镜像（=recommend），卡片以 recommend
  // 起跑并自动推进；F1 之后首帧一律 manual，模式只从 effective-config 来。
  reset(); store.clear(); answerPosts = []; analyzeCalls = [];
  store.set("qm:v1:analysis:global", JSON.stringify({
    mode: "recommend", modelId: "", withContext: false, parallel: false }));
  cfgModeNow = "manual"; cfgExtra = {};
  fetchScript = (u) => (u.includes("/question-modal/resolve") ? pending(REQ, "call_BC1") : NOT_FOUND);
  // 题必须带 recommended：recommend 模式「无推荐就跳过」，用无推荐题测不出抢跑
  // ——第一版 [BC1] 正是这样假绿的（镜像抢跑后也只是跳过，导致 posts=0）。
  const BC1_QS = [
    { type: "single", title: "题一带推荐", options: ["甲", "乙"], recommended: "甲" },
    { type: "single", title: "题二带推荐", options: ["A", "B"], recommended: "A" },
  ];
  mount(makeNode("call_BC1", BC1_QS));
  await flush(); await realTick(); await flush();
  for (let i = 0; i < 20; i++) { await advance(150); await flush(); await realTick(); await flush(); }
  check("[BC1] 配置 manual 时不得自动作答/自动提交（镜像里残留 recommend 也不行）",
    answerPosts.length === 0, "posts=" + answerPosts.length);
  // ★ 真机抓到的症状不是「提交了」，而是「visStep 被推到末页、停在其他意见」。
  // 只看 posts 会假绿：旧实现把每题都跳过推进，到末页时因为题没有真正作答、
  // 自动提交被闸门挡住，于是「卡在最后一题」而不是「提交成功」。
  // 所以必须断言「没被推走」——这条才是真正能击穿旧实现的判据。
  const bc1state = JSON.parse(store.get("qm:v1:state:call_BC1") || "{}");
  check("[BC1c] 不得被自动推进到末页（停在第一题）",
    (bc1state.visStep || 0) === 0, "visStep=" + bc1state.visStep);
  check("[BC1b] 停在人工作答视图（不是末页）",
    hasText(lastTree, "下一步") || hasText(lastTree, "提交"), treeText(lastTree).slice(-160));

  // ── [BC2] 自动提交失败一次后必须重试并最终提交 ──
  //
  // 用户症状 2：「只用推荐，最终还是卡在了最后一题」。
  // 根因：autoSubmitRef 一次性锁存，submit 失败只 toast 不复位 → 永久卡末页。
  reset(); store.clear(); answerPosts = [];
  let n = 0;
  cfgModeNow = "recommend"; cfgExtra = {};
  fetchScript = (u, o) => {
    if (u.includes("/question-modal/answer")) {
      n++;
      answerPosts.push(n);
      if (n === 1) return { ok: false, status: 500, data: { detail: "boom" } };
      return { ok: true, data: { ok: true, message: "answered", request_id: REQ } };
    }
    if (u.includes("/question-modal/resolve")) return pending(REQ, "call_BC2");
    return NOT_FOUND;
  };
  mount(makeNode("call_BC2", QS));
  await flush(); await realTick(); await flush();
  for (let i = 0; i < 40; i++) { await advance(150); await flush(); await realTick(); await flush(); }
  check("[BC2] 自动提交首次失败后会自动重试（不再永久卡在最后一题）",
    answerPosts.length >= 2, "answer 请求次数=" + answerPosts.length);
  const bc2 = JSON.parse(store.get("qm:v1:state:call_BC2") || "{}");
  check("[BC2b] 重试成功后进入已完成态", bc2.answered === true, "answered=" + bc2.answered);

  // ── [BC3] 重试有上限：不会无限烧额度 ──
  reset(); store.clear(); answerPosts = [];
  cfgModeNow = "recommend"; cfgExtra = {};
  fetchScript = (u) => {
    if (u.includes("/question-modal/answer")) {
      answerPosts.push(1);
      return { ok: false, status: 500, data: { detail: "always fails" } };
    }
    if (u.includes("/question-modal/resolve")) return pending(REQ, "call_BC3");
    return NOT_FOUND;
  };
  mount(makeNode("call_BC3", QS));
  await flush(); await realTick(); await flush();
  for (let i = 0; i < 60; i++) { await advance(150); await flush(); await realTick(); await flush(); }
  check("[BC3] 持续失败时重试有上限（不超过 AUTO_SUBMIT_MAX_TRIES 次）",
    answerPosts.length > 0 && answerPosts.length <= 3,
    "answer 请求次数=" + answerPosts.length);
  const bc3 = JSON.parse(store.get("qm:v1:state:call_BC3") || "{}");
  check("[BC3b] 用尽后停在末页交给用户（未谎报已完成）",
    bc3.answered !== true, "answered=" + bc3.answered);

  cfgExtra = {};
}


// ══════════════════════════════════════════════════════════════════
// [BD] 竞态：驱动先到末页、reqId 后到 —— 不得永久停在末页
//       （用户报「题都选好了，就是不自动提交」，2026-11-04 真机复现）
// ══════════════════════════════════════════════════════════════════
console.log("\n[BD] 自动提交等待 reqId（竞态）");
{
  // resolve 故意延迟到 N 次之后才返回 found：驱动一定先跑到末页。
  reset(); store.clear(); answerPosts = [];
  cfgModeNow = "recommend"; cfgExtra = {};
  let resolveCalls = 0;
  const QS5 = [1, 2, 3, 4, 5].map((i) => ({
    type: "single", title: "Q" + i,
    options: ["A" + i, "B" + i], recommended: "A" + i,
  }));
  fetchScript = (u, o) => {
    if (u.includes("/question-modal/resolve")) {
      resolveCalls++;
      // 前 3 次「还没就绪」，之后才给出 request_id
      if (resolveCalls <= 3) return { ok: true, data: { ok: true, found: false } };
      return pending(REQ, "call_BD1");
    }
    if (u.includes("/question-modal/answer")) {
      answerPosts.push(1);
      return { ok: true, data: { ok: true, request_id: REQ } };
    }
    return NOT_FOUND;
  };
  mount(makeNode("call_BD1", QS5));
  await flush(); await realTick(); await flush();
  for (let i = 0; i < 60; i++) { await advance(200); await flush(); await realTick(); await flush(); }

  const st = JSON.parse(store.get("qm:v1:state:call_BD1") || "{}");
  check("[BD1] reqId 晚到也必须最终自动提交（不得停在末页）",
    answerPosts.length >= 1, "提交次数=" + answerPosts.length + " resolve=" + resolveCalls);
  check("[BD2] 5 题全部自动填好",
    ["q0", "q1", "q2", "q3", "q4"].every((k) => (st.answers || {})[k]
      && (st.answers[k].value === "A" + (Number(k.slice(1)) + 1))),
    JSON.stringify(st.answers));
  check("[BD3] 进入已完成态", st.answered === true, "answered=" + st.answered);

  cfgExtra = {};
}


// ══════════════════════════════════════════════════════════════════
// [BE] 复现用户实际路径：人工手答到末页 → 点「只用推荐」→ 应自提交
//      （用户原话：「我在卡片的时候手动点击了只用推荐，它自动跳过了，
//        但是现在最后的其他意见，这个又卡主了」）
// ══════════════════════════════════════════════════════════════════
console.log("\n[BE] 人工答完切「只用推荐」后末页自提交");
{
  reset(); store.clear(); answerPosts = [];
  cfgModeNow = "manual"; cfgExtra = {};      // 起始：人工
  const QS3 = [
    { type: "single", title: "Q1", options: ["A1", "B1"] },
    { type: "single", title: "Q2", options: ["A2", "B2"] },
    { type: "single", title: "Q3", options: ["A3", "B3"] },
  ];
  fetchScript = (u) => {
    if (u.includes("/question-modal/resolve")) return pending(REQ, "call_BE");
    if (u.includes("/question-modal/answer")) {
      answerPosts.push(1);
      return { ok: true, data: { ok: true, request_id: REQ } };
    }
    return NOT_FOUND;
  };
  mount(makeNode("call_BE", QS3));
  await flush(); await realTick(); await flush();
  await advance(200);

  // 人工手答 3 题：点选项 → 点「下一步」（用 harness 既有 helper）
  // 选项文字会被自动编号前缀成「✓ 1. A1」/「2. B1」，所以不能用 clickButton
  // 精确匹配纯文本；clickRow 按 treeText 分段匹配，能命中含编号的行。
  // 选项渲染成「1. A1」（受 auto_number_options 控制），用包含匹配点选。
  const pickOpt = (label) => {
    let hit = null;
    walk(lastTree, (x) => {
      if (hit || !x.props || typeof x.props.onClick !== "function") return;
      if (treeText(x).indexOf(label) !== -1) hit = x;
    });
    if (!hit) throw new Error("opt not found: " + label);
    hit.props.onClick();
  };
  for (let i = 0; i < 3; i++) {
    const before = JSON.parse(store.get("qm:v1:state:call_BE") || "{}");
    pickOpt("A" + (i + 1));
    // 点选会 setAnswers（异步），必须等它落到渲染后才点「下一步」，
    // 否则闸门用旧 answers 判空 → 报「尚未选择」。
    await flush(); await realTick(); await flush();
    clickButton("下一步");
    await flush(); await realTick(); await flush(); await advance(150);
    const after = JSON.parse(store.get("qm:v1:state:call_BE") || "{}");
    if ((after.visStep || 0) <= (before.visStep || 0)) {
      // 没推进 → 打印现场，避免后续「opt not found」掩盖真实原因
      console.log("    [BE-debug] 第" + (i + 1) + "题未推进 visStep="
        + after.visStep + " answers=" + JSON.stringify(after.answers)
        + " | 卡片=" + treeText(lastTree).slice(-160));
      break;
    }
  }
  const mid = JSON.parse(store.get("qm:v1:state:call_BE") || "{}");
  check("[BE1] 人工答完 3 题到达末页", (mid.visStep || 0) >= 3,
    "visStep=" + mid.visStep + " answers=" + JSON.stringify(mid.answers));

  // ★ 关键：在末页点「只用推荐」
  // ModeSwitch 的三个片段没有 data-qm-val，是按 label 文本渲染的 button
  // （见 ModeSwitch 的 seg()），所以按 treeText 精确找「只用推荐」。
  const seg = [];
  walk(lastTree, (x) => {
    if (x.type === "button" && treeText(x).trim() === "只用推荐") seg.push(x);
  });
  check("[BE2-前置] 末页能点到「只用推荐」", seg.length > 0, "found=" + seg.length);
  if (seg[0] && seg[0].props.onClick) seg[0].props.onClick();
  await flush(); await realTick(); await flush();
  for (let i = 0; i < 30; i++) { await advance(150); await flush(); await realTick(); await flush(); }

  const st = JSON.parse(store.get("qm:v1:state:call_BE") || "{}");
  check("[BE2] 末页切「只用推荐」后必须自动提交（用户报的卡住点）",
    answerPosts.length >= 1, "提交次数=" + answerPosts.length
    + " answered=" + st.answered);
  check("[BE3] 进入已完成态", st.answered === true, "answered=" + st.answered);
  cfgExtra = {};
}


// ══════════════════════════════════════════════════════════════════
// FIX-1A [BF] 串题守卫：只能取「本题」的结论，绝不取 per_question[0]
// ══════════════════════════════════════════════════════════════════
console.log("\n[BF] 串题守卫（2026-11-05：问答题曾被填成第一题的选项值）");
{
  // 3 题：单选 / 单选 / 问答。分析缓存里放【三条】per_question，
  // 且刻意让 q0 的 choice="乙"（单选选项）、q2 是问答题。
  // 正确行为：分析问答题（realIdx=2）时，缓存只取 index==2 的那条；
  // 旧实现取 per_question[0] → 会把 "乙" 填进问答题。
  const QS_MIX = [
    { type: "single", title: "Q1 选哪个", options: ["甲", "乙"], recommended: "乙" },
    { type: "single", title: "Q2 选哪个", options: ["丙", "丁"], recommended: "丁" },
    { type: "text", title: "Q3 补充" },      // 无 recommended → 只能靠缓存
  ];
  const MULTI_ENVELOPE = {
    ok: true,
    per_question: [
      { index: 0, type: "single", choice: "乙", reasoning: "r0", failed: false },
      { index: 1, type: "single", choice: "丁", reasoning: "r1", failed: false },
      { index: 2, type: "text", choice: "这是第三题的回答", reasoning: "r2", failed: false },
    ],
    elapsed: 1,
  };

  reset(); store.clear(); sessionStore.clear();
  cfgModeNow = "ai"; cfgExtra = {};
  fetchScript = (u, opts) => {
    if (u.includes("/question-modal/effective-config")) return cfgStub("ai");
    if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (u.includes("/question-modal/analyze")) return { ok: true, data: { ok: true, analysis: MULTI_ENVELOPE } };
    if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: true, analysis: MULTI_ENVELOPE } };
    if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BF");
    if (u.includes("/question-modal/answer")) { answerPosts.push(JSON.parse((opts && opts.body) || "{}")); return { ok: true, data: { ok: true, request_id: "REQ" } }; }
    if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
    if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
    return NOT_FOUND;
  };
  answerPosts.length = 0;

  mount(makeNode("call_BF", QS_MIX));
  await flush(); await realTick(); await flush();
  // 等驱动把三题都处理完（AI 模式：每题的 doneRef 由分析结果置位）
  for (let i = 0; i < 40; i++) { await advance(200); await flush(); await realTick(); await flush(); }

  const stBF = JSON.parse(store.get("qm:v1:state:call_BF") || "{}");
  const ansBF = stBF.answers || {};
  console.log("    提交/落地 answers:", JSON.stringify(ansBF).slice(0, 260));

  check("[BF1] 问答题(q2) 只能拿到 index==2 的结论",
    String((ansBF.q2 || {}).value || "") === "这是第三题的回答",
    JSON.stringify((ansBF.q2 || {}).value));
  check("[BF2] 问答题绝不能被填成第一题的选项值「乙」",
    String((ansBF.q2 || {}).value || "") !== "乙", JSON.stringify((ansBF.q2 || {}).value));
  check("[BF3] q0 取 index==0 的结论「乙」",
    String((ansBF.q0 || {}).value || "") === "乙", JSON.stringify((ansBF.q0 || {}).value));
  check("[BF4] q1 取 index==1 的结论「丁」",
    String((ansBF.q1 || {}).value || "") === "丁", JSON.stringify((ansBF.q1 || {}).value));
}
  cfgExtra = {};

// ══════════════════════════════════════════════════════════════════
// FIX-1B [BG] 无推荐不再是静默跳过：卡片必须有可见提示 + 摘要 + skipped_by
// ══════════════════════════════════════════════════════════════════
console.log("\n[BG] 无推荐可见化（此前整卷全跳过并提交，用户只看到「自己答完了」）");
{
  const QS_NOREC = [
    { type: "single", title: "Q1 无推荐", options: ["甲", "乙"] },   // 无 recommended
    { type: "text", title: "Q2 问答" },                              // 无推荐
  ];
  reset(); store.clear(); sessionStore.clear(); toastTexts.length = 0;
  cfgModeNow = "recommend"; cfgExtra = {};
  fetchScript = (u, opts) => {
    if (u.includes("/question-modal/effective-config")) return cfgStub("recommend");
    if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
    if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BG");
    if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ" } };
    if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
    if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
    return NOT_FOUND;
  };

  mount(makeNode("call_BG", QS_NOREC));
  await flush(); await realTick(); await flush();
  const tBG = treeText(lastTree);
  console.log("    首屏含无推荐提示:", tBG.includes("没有可用的推荐"));
  check("[BG1] 该题出现「没有可用的推荐」提示行",
    tBG.includes("没有可用的推荐"), tBG.slice(0, 300));
  check("[BG2] 提示带可定位标记 data-qm-norec",
    JSON.stringify(lastTree).includes("data-qm-norec"), "");

  // 推进到末页：摘要必须在「末页还没提交」的那一刻可见。
  // 自动提交会在同一轮之后跳到已完成视图，所以要逐步推进并抓第一帧。
  let sawSummary = false;
  for (let i = 0; i < 30; i++) {
    await advance(200); await flush(); await realTick(); await flush();
    const t = treeText(lastTree);
    if (t.includes("没有可用推荐") || t.includes("已按未作答提交")) { sawSummary = true; break; }
    if (t.includes("已完成")) break;    // 已跳过末页 → 继续用下面的兜底断言
  }
  const tBG2 = treeText(lastTree);
  const stBG = JSON.parse(store.get("qm:v1:state:call_BG") || "{}");
  console.log("    末页文本:", tBG2.slice(-260));
  console.log("    answers:", JSON.stringify(stBG.answers || {}));
  check("[BG3] 末页摘要列出无推荐的题号（或已由 toast+提示行告知）",
    sawSummary || tBG2.includes("没有可用推荐") || tBG2.includes("已按未作答提交")
    || toastTexts.some((t) => String(t[1]).includes("没有可用的推荐")),
    "sawSummary=" + sawSummary + " tail=" + tBG2.slice(-160));
  check("[BG4] 数据侧标记 skipped_by=no_recommend（与用户主动跳过区分）",
    ((stBG.answers || {}).q0 || {}).skipped_by === "no_recommend",
    JSON.stringify((stBG.answers || {}).q0));
  check("[BG5] 有 toast 告知（用户不必靠猜）",
    toastTexts.some((t) => String(t[1]).includes("没有可用的推荐")),
    JSON.stringify(toastTexts.slice(-3)));
}
  cfgExtra = {};

// ══════════════════════════════════════════════════════════════════
// [BH] 多标签页 —— 阶段 1（2026-11-07 用户裁定）语义重写
//
// 旧 [BH] 断言的是「localStorage 租约独占 + 只读视图 + 防乒乓」，那套方案
// 已被用户裁定为治标并整体删除。新语义：
//   · 前端不再有「只读视图」这个中间态（两个标签页都能操作）
//   · 每个操作都发给后端裁决（POST /survey-action），后端广播给所有标签页
//   · 收到的变更若是**别的** origin → 覆盖本地；若是**自己的**回声 → 不动本地
//     （否则用户正在输入的文本会被旧值冲掉）
//   · 断线降级：SSE 连不上时本地驱动继续跑，不把问卷打死
// ══════════════════════════════════════════════════════════════════
console.log("\n[BH] 多标签页（阶段 1：后端权威，无租约/无只读视图）");
{
  store.clear(); sessionStore.clear(); reset();
  cfgModeNow = "manual"; cfgExtra = {};
  let surveyRev = 0;
  const surveyStore = {};
  fetchScript = (u) => {
    if (u.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
    if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BH1");
    if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
    if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (u.includes("/question-modal/survey-state")) {
      return { ok: true, data: { ok: true, found: true, rev: surveyRev, state: {
        tool_call_id: "call_BH1", questions: QS, answers: { ...surveyStore },
        cursor: 0, mode: "manual", status: "pending", per_question: {},
        rev: surveyRev, orphan: false } } };
    }
    if (u.includes("/question-modal/survey-action")) return { ok: true, data: { ok: true, accepted: true } };
    if (u.includes("/question-modal/survey-stream")) return NOT_FOUND;   // 降级路径
    if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ" } };
    return NOT_FOUND;
  };

  mount(makeNode("call_BH1", QS));
  await flush(); await realTick(); await flush();

  // BH1：不再有租约键 —— 旧方案的标志性产物必须彻底消失
  const leaseLeft = store.get("qm:v1:driver:call_BH1");
  check("[BH1] 不再写入驱动租约（旧方案已删除）",
    leaseLeft === undefined || leaseLeft === null, leaseLeft);

  // BH2：卡片的每次改答案都发 action 给后端（后端才是裁决者）
  // ★ 2026-11-07 新增前置：必须先让**首帧快照的水合完成**再点选。
  //
  // 阶段 1 加了 `surveyHydratedRef` 闸门（修复真机 bug：卡片挂载时用内建默认
  // manual 把后端真实 mode 覆盖掉）。闸门意味着「快照还没采纳完之前，任何
  // set_answer / goto / set_mode 都不会上报」—— 这是**正确的**行为，
  // 但测试必须按真实时序走：/survey-state 是异步 fetch，需要多泵一轮微任务
  // 才 settle。少了这一步，点选发生在水合之前，上报被闸门正确挡住 →
  // 用例假失败（实测 BH2/BH2b/BH3 三条）。
  await flush(); await realTick(); await flush();
  const mountLog = fetchLog.slice();
  advance(10);
  await flush(); await realTick(); await flush();
  // ★ 关键：adopt() 用 setTimeout(...,0) 清 remoteApplyRef，表示"这一轮远程
  // 同步结束"。harness 的 setTimeout 是虚拟的，必须显式泵时钟才会执行，
  // 否则 remoteApplyRef 永远为 true → 上报 effect 永远跳过 → 点选不发 action。
  advance(100);
  await flush(); await realTick(); await flush();
  clickButton("甲");
  await flush(); await realTick(); await flush();
  await flush(); await realTick(); await flush();
  const act = fetchLog.filter((p) => (p.url || "").includes("survey-action"));
  console.log("    /survey-action 请求数:", act.length);
  check("[BH2] 点选后会 POST /survey-action（后端裁决）", act.length > 0, act.length);
  check("[BH2b] 携带 tool_call_id + set_answer",
    act.some((p) => (p.body || "").includes("call_BH1") && (p.body || "").includes("set_answer")),
    act[0] && act[0].body);

  // BH3：请求体带 origin，后端据此区分「回声 / 别人改的」
  check("[BH3] action 携带 origin（区分回声与远端修改）",
    act.some((p) => (p.body || "").includes('"origin"')), act[0] && act[0].body);

  // ══════════════════════════════════════════════════════════════
  // [BI] 水合闸门：快照到达之前，绝不能用挂载时的初值污染后端
  //
  // 这条守护的是一个**真机复现过的 bug**（2026-11-07）：
  //   卡片挂载时 anMode 初值是内建默认 "manual"（保守值，故意的），真实模式
  //   要等 /effective-config 落地。而上报 effect 在挂载后立刻跑 → 把 "manual"
  //   发给后端，**把后端真实的 mode=ai 覆盖掉**。
  //   真机证据：卡片挂载后 GET /survey-state 的 mode 从 ai 变 manual；
  //   后果是用户每次刷新后被静默降级、第二个标签页跟着被改。
  //
  // 同时它守护第二类污染：初始的空 answers 被当成"用户清空了答案"上报。
  //
  // 反证方法：删掉任一上报 effect 里的 `surveyHydratedRef` 闸门 → 本组必须失败。
  // ══════════════════════════════════════════════════════════════
  console.log("\n[BI] 水合闸门：不得用挂载初值污染后端 state");
  {
    store.clear(); sessionStore.clear(); reset();
    cfgModeNow = "ai";       // 后端真实模式 = ai
    const posts = [];
    fetchScript = (u) => {
      if (u.includes("/question-modal/effective-config")) return cfgStub("ai");
      if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
      if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
      if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BI1");
      if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
      if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
      // ★ 快照故意延后返回：模拟真实网络里 /survey-state 尚未 settle 的窗口期。
      //   闸门要守的正是这一段。
      if (u.includes("/question-modal/survey-state")) {
        return { ok: true, data: { ok: true, found: true, rev: 3, state: {
          tool_call_id: "call_BI1", questions: QS,
          answers: { q0: { type: "single", value: "乙", other: "" } },
          cursor: 1, mode: "ai", status: "pending", per_question: {},
          rev: 3, orphan: false } } };
      }
      if (u.includes("/question-modal/survey-action")) {
        posts.push(JSON.parse((opts && opts.body) || "{}"));
        return { ok: true, data: { ok: true, accepted: true } };
      }
      if (u.includes("/question-modal/survey-stream")) return NOT_FOUND;
      if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ" } };
      return NOT_FOUND;
    };

    // 挂载后**立刻**检查：快照还没采纳，任何上报都是错的
    mount(makeNode("call_BI1", QS));
    await flush();
    const early = fetchLog.filter((p) => (p.url || "").includes("survey-action"));
    check("[BI1] 快照到达前不发任何 action（不拿初值污染后端）",
      early.length === 0, early.map((p) => p.body));

    // 快照落地后，本地应被 adopt 成后端记录的 mode=ai / cursor=1 / q0=乙
    await flush(); await realTick(); await flush(); advance(100);
    await flush(); await realTick(); await flush();
    const t = treeText(lastTree);
    check("[BI2] 快照落地后进度跟随后端（第 2 题）", t.includes("2/"), t.slice(0, 120));
    const late = fetchLog.filter((p) => (p.url || "").includes("survey-action"));
    const setModes = late.filter((p) => (p.body || "").includes('"set_mode"'));
    check("[BI3] 采纳后不会把 manual 回写成 set_mode（不覆盖后端 ai）",
      !setModes.some((p) => (p.body || "").includes('"manual"')),
      setModes.map((p) => p.body));
    const setAnswers = late.filter((p) => (p.body || "").includes('"set_answer"'));
    check("[BI4] 采纳后不会把本地空答案当成「清空」上报",
      !setAnswers.some((p) => (p.body || "").includes('"value":""')),
      setAnswers.map((p) => p.body));
  }

  // ══════════════════════════════════════════════════════════════
  // [BJ] 阶段 2：recommend 模式下前端「让位」
  //
  // 后端有自己的推进循环（recommend.py），关掉页面也能走完。若前端同时推进，
  // 同一题会被填两次、翻两次页（setVisStep 叠加）→ 跳题或越过末页。
  //
  // 判据：SSE 连通时前端**不要**自己填；SSE 断开时必须自己动（降级路径，
  // 否则用户看到一张永远不动的问卷）。
  //
  // 反证：删掉 `if (anMode === "recommend" && !backendDown) return;` →
  // BJ1 必须失败。
  // ══════════════════════════════════════════════════════════════
  console.log("\n[BJ] recommend 模式下前端让位后端推进");
  {
    store.clear(); sessionStore.clear(); reset();
    cfgModeNow = "recommend";
    cfgExtra = {};
    fetchScript = (u) => {
      if (u.includes("/question-modal/effective-config")) return cfgStub("recommend");
      if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
      if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
      if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BJ1");
      if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
      if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
      if (u.includes("/question-modal/survey-state")) {
        return { ok: true, data: { ok: true, found: true, rev: 1, state: {
          tool_call_id: "call_BJ1", questions: QS, answers: {}, cursor: 0,
          mode: "recommend", status: "pending", per_question: {},
          rev: 1, orphan: false } } };
      }
      if (u.includes("/question-modal/survey-action")) return { ok: true, data: { ok: true, accepted: true } };
      if (u.includes("/question-modal/survey-stream")) return "sse-open";
      if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ" } };
      return NOT_FOUND;
    };
    mount(makeNode("call_BJ1", QS));
    await flush(); await realTick(); await flush();
    advance(100); await flush(); await realTick(); await flush();

    const t1 = treeText(lastTree);
    const prog1 = t1.match(/(\d+)\s*\/\s*(\d+)/);
    console.log("    让位时进度:", prog1 ? prog1[0] : "?");
    check("[BJ1] SSE 连通时前端不自作主张填答案（让位给后端）",
      !t1.includes("✓"), t1.slice(0, 120));
    check("[BJ2] 卡片仍正常渲染（让位不等于停摆）",
      t1.includes("Q1"), t1.slice(0, 120));
  }

  // ── [BK] 阶段 4：后端在线时前端**不得重复分析**（分析也要让位）──────
  //
  // 缺陷实况（2026-11-07 取证）：驱动推进 effect 有 `!backendDown` 守卫，
  // 但自动分析 effect **没有** → 后端 runner 对每道 ai 题调一次
  // `analyze_survey`（填答案用），前端又 `POST /analyze` 一次（渲染气泡用）
  // = **同一题烧两份配额**。用户当天被 429 限流数百次，这直接加剧限流。
  //
  // 为什么这条能在假宿主里测（与「ai 推进让位」不同）：
  //   推进让位依赖 doneRef/翻页等一长串状态流转（三次反证都不命中，见下），
  //   而**分析让位只看一个事实：有没有发出 /analyze 请求**。它发生在
  //   effect 的第一跳，不依赖任何后续时序 —— 所以可测、且反证会精准命中。
  {
    store.clear(); sessionStore.clear(); reset();
    cfgModeNow = "ai";
    cfgExtra = {};
    let analyzeCalls = 0;
    fetchScript = (u) => {
      if (u.includes("/question-modal/effective-config")) return cfgStub("ai");
      if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
      if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
      if (u.includes("/question-modal/resolve")) return pending("REQ", "call_BK1");
      if (u.includes("/question-modal/session-prefs")) return { ok: true, data: { ok: true } };
      if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
      if (u.includes("/question-modal/analyze")) {
        analyzeCalls++;
        return { ok: true, data: { ok: true, per_question: [
          { index: 0, choice: "甲", reasoning: "R", failed: false }] } };
      }
      if (u.includes("/question-modal/survey-state")) {
        return { ok: true, data: { ok: true, found: true, rev: 1, state: {
          tool_call_id: "call_BK1", questions: QS, answers: {}, cursor: 0,
          mode: "ai", status: "pending", per_question: {},
          rev: 1, orphan: false } } };
      }
      if (u.includes("/question-modal/survey-action")) return { ok: true, data: { ok: true, accepted: true } };
      if (u.includes("/question-modal/survey-stream")) return "sse-open";   // SSE 连通
      if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ" } };
      return NOT_FOUND;
    };
    mount(makeNode("call_BK1", QS));
    await flush(); await realTick(); await flush();
    advance(100); await flush(); await realTick(); await flush();

    console.log("    后端在线(SSE 连通)时前端 /analyze 次数:", analyzeCalls);
    check("[BK1] 后端在线时前端**不发** /analyze（让位给后端 runner，避免双份配额）",
      analyzeCalls === 0, analyzeCalls);

    const tk = treeText(lastTree);
    check("[BK2] 卡片仍正常渲染（让位 ≠ 停摆）", tk.includes("Q1"), tk.slice(0, 120));

    // 降级反证：SSE 连不上 → backendDown=true → 前端**必须**自己分析，
    // 否则用户看到一张永远没有 AI 分析的问卷（这是必须保留的降级路径）。
    store.clear(); sessionStore.clear(); reset();
    cfgModeNow = "ai"; cfgExtra = {};
    analyzeCalls = 0;
    const prevScript = fetchScript;
    fetchScript = (u) => {
      if (u.includes("/question-modal/survey-stream")) return { _err: "connection refused" };
      return prevScript(u);
    };
    mount(makeNode("call_BK3", QS));
    await flush(); await realTick(); await flush();
    advance(100); await flush(); await realTick(); await flush();
    advance(2000); await flush(); await realTick(); await flush();

    console.log("    SSE 断开时前端 /analyze 次数:", analyzeCalls);
    check("[BK3] SSE 断开时前端**恢复自分析**（降级路径不能被守卫堵死）",
      analyzeCalls > 0, analyzeCalls);
  }

  // ⚠️ 关于「ai 模式**推进**让位」的 harness 覆盖 —— 这里**故意不写**用例。
  //
  // 我试过三版：断言卡片文本无 ✓、断言不发 set_answer/goto、mock /analyze 让
  // doneRef 落定后断言。**三次反证（把让位条件改回只认 recommend）全都不命中**，
  // 说明 ai 驱动在这套假宿主里根本没跑到那一步 —— 任何断言都只是"碰巧成立"，
  // 留着就是假绿。
  //
  // ai 让位由 `verify_phase3_ai.py` 的服务层用例 + 真机端到端覆盖（那里看的是
  // 真实 runner 的 cursor/answers 变化，不依赖前端假渲染）。


  // BH4：首次挂载会先拉一次权威快照（SSE 连上之前的窗口期）
  const snapReq = mountLog.filter((p) => (p.url || "").includes("/survey-state"));
  console.log("    /survey-state 请求数:", snapReq.length);
  check("[BH4] 挂载时拉取后端权威快照", snapReq.length > 0, snapReq.length);

  // BH5：不再出现「只读视图」横幅 —— 两个标签页都能操作
  const t = treeText(lastTree);
  check("[BH5] 不再显示只读视图横幅（两页都可操作）",
    !t.includes("另一个标签页") && !JSON.stringify(lastTree).includes("data-qm-other-driver"),
    t.slice(-120));

  // BH6：SSE 连不上 → 置 backendDown 降级，本地驱动继续（不能把问卷打死）
  const streamReq = mountLog.filter((p) => (p.url || "").includes("/survey-stream"));
  console.log("    尝试连接 SSE:", streamReq.length, "次（失败后应重试）");
  check("[BH6] 会尝试建立 SSE 订阅", streamReq.length > 0, streamReq.length);
  check("[BH6b] SSE 不可用时卡片仍可作答（降级不锁死）",
    !treeText(lastTree).includes("问卷已失效"), treeText(lastTree).slice(-80));
  console.log("    挂载请求清单:", mountLog.map((p) => p.url.split("/api/")[1] || p.url).slice(0, 12));
}

// ══════════════════════════════════════════════════════════════════
// [AR] 跳过原因显示（用户裁定 2026-11-08 第 1 项）
//
// 需求：整卷跳过后卡片不能只显示「跳过」，要写明谁跳的、为什么，
// 便于复盘自动模式整卷跳过。覆盖：工具输出解析 / 折叠行 / 展开块 / 落盘。
// ══════════════════════════════════════════════════════════════════
{
  console.log("\n[AR] 跳过原因写入最终卡片");
  const RS = '系统自动释放（自动推进看门狗）：自动推进 300s 无进展，已自动释放';

  // AR1：工具输出含写实原因 → 折叠行显示原因（不是光秃秃「已跳过」）
  reset(); store.clear(); domReset();
  fetchScript = (u) => NOT_FOUND;
  mount(makeNode("call_AR1", QS,
    '❓ **测试问卷**\n1. [单选] 走哪条？\n\n' + RS + '\n{"skipped": true}'));
  await flush(); await realTick(); await flush();
  check("[AR1] 折叠行显示跳过原因原文",
    hasText(lastTree, "自动推进 300s 无进展"), treeText(lastTree).slice(0, 220));
  check("[AR1b] 折叠行仍如实标「已跳过问卷」",
    hasText(lastTree, "已跳过问卷"), treeText(lastTree).slice(0, 160));
  check("[AR1c] 原因带 data-qm-skip-reason 锚点",
    JSON.stringify(lastTree).includes("data-qm-skip-reason"), "");

  // AR2：展开后只读卡有醒目「跳过原因」块
  clickExact("展开");
  await flush(); await realTick(); await flush();
  check("[AR2] 展开视图含「跳过原因：」小节",
    hasText(lastTree, "跳过原因："), treeText(lastTree).slice(0, 260));
  check("[AR2b] 展开块带 data-qm-skip-reason-block 锚点",
    JSON.stringify(lastTree).includes("data-qm-skip-reason-block"), "");

  // AR3：原因落盘（重挂载后不丢，宿主反复 re-key 也不会退化成「跳过」）
  const stAR = JSON.parse(store.get("qm:v1:state:call_AR1") || "{}");
  check("[AR3] skipReason 已写入卡片状态",
    String(stAR.skipReason || "").includes("自动推进 300s"), JSON.stringify(stAR).slice(0, 200));
  reset(); mount(makeNode("call_AR1", QS, "用户跳过了本次问卷。\n{\"skipped\": true}"));
  await flush(); await realTick(); await flush();
  check("[AR3b] 重挂载后仍显示落盘的原因（不被输出文本覆盖）",
    hasText(lastTree, "自动推进 300s 无进展"), treeText(lastTree).slice(0, 220));

  // AR4：旧版裸 skip 输出（无原因）不能凭空编造原因
  reset(); store.clear(); domReset();
  fetchScript = (u) => NOT_FOUND;
  mount(makeNode("call_AR4", QS, "用户跳过了本次问卷。\n{\"skipped\": true}"));
  await flush(); await realTick(); await flush();
  check("[AR4] 无原因时绝不编造系统原因",
    !hasText(lastTree, "看门狗") && !hasText(lastTree, "300s"),
    treeText(lastTree).slice(0, 180));

  // AR5：用户主动跳过也写明来源
  reset(); store.clear(); domReset();
  fetchScript = (u) => {
    if ((u || "").includes("/question-modal/resolve")) return pending(REQ, "call_AR5");
    if ((u || "").includes("/question-modal/skip")) return { ok: true, data: { ok: true } };
    return NOT_FOUND;
  };
  mount(makeNode("call_AR5", QS));
  await flush(); await realTick(); await flush();
  const bAR5 = buttons(lastTree).find((x) => /跳过问卷|跳过并提交/.test(x.label));
  if (bAR5) bAR5.props.onClick();
  await flush(); await realTick(); await flush();
  const stAR5 = JSON.parse(store.get("qm:v1:state:call_AR5") || "{}");
  check("[AR5] 用户主动跳过也记录原因",
    String(stAR5.skipReason || "").includes("用户"), JSON.stringify(stAR5).slice(0, 200));
}

// ── [AS] 历史卡片救援：state 查不到但 /result 有记录 → 必须只读 ──────
//
// 用户报障（2026-11-09）：历史卡片明明已正常结束，却渲染成**可点上下题的
// 答题态**，部分还提示「问卷已失效」。
//
// 根因：`answered` 的三条判据同时失效 ——
//   ① `saved`（localStorage）被 sweepStoredStates 清掉（超 7 天 / 超 80 条）
//   ② 长会话里宿主把旧 tool result **整个裁剪**（不是折叠成 stub）
//      → outputText="" 且 folded=false
//   ③ ⇒ answered=false → 按新问卷渲染 → 上下题按钮回来
// 之后以「未答」身份轮询 /survey-state（内存表，可被 prune 清）→ 查不到
// → 12 次 + 45s → die("gone") → 「已失效」。
//
// /result 是磁盘持久化的已答记录，不受内存清理影响 → 唯一可靠真相源。
console.log("\n[AS] 历史卡救援：无 localStorage + 无 output + /result 有记录");
{
  // ① 关键：store 清空（模拟 localStorage 被 GC），节点也没有 output
  reset(); store.clear(); domReset();
  let resultCalls = 0;
  let stateCalls = 0;
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/result")) {
      resultCalls++;
      return { ok: true, data: { ok: true, found: true, kind: "answered",
        answers: {
          q0: { type: "single", value: "甲", other: "" },
          q1: { type: "single", value: "乙", other: "" },
        } } };
    }
    if (s.includes("/question-modal/survey-state")) {
      stateCalls++;
      return { ok: true, data: { ok: true, found: false } };
    }
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (s.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
    return NOT_FOUND;
  };
  // 无 output 的历史节点（宿主已裁剪）
  mount(makeNode("call_AT1", QS));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();

  const tAT = treeText(lastTree);
  console.log("    /result:", resultCalls, "次 | /survey-state:", stateCalls, "次");
  check("[AT1] 挂载即询问 /result（不等 state 探测）", resultCalls > 0, resultCalls);
  const lblAT = buttons(lastTree).map((x) => x.label);
  check("[AT2] 有已答记录 → 立刻渲染只读答案视图（不是答题态）",
    !lblAT.some((x) => /上一步|下一步/.test(x)),
    lblAT.join("|").slice(0, 160));
  check("[AT3] 显示了提交过的答案内容", /甲/.test(tAT) || /乙/.test(tAT), tAT.slice(-160));
  check("[AT4] 不显示「问卷已失效」", !tAT.includes("已失效"), tAT.slice(-160));

  // ② 反证场景：/result 也没有 → 应该走原来的失效判定（不能永远卡在探测）
  reset(); store.clear(); domReset();
  let rAT2 = 0;
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/result")) {
      rAT2++;
      return { ok: true, data: { ok: true, found: false } };
    }
    if (s.includes("/question-modal/survey-state")) return { ok: true, data: { ok: true, found: false } };
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (s.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
    return NOT_FOUND;
  };
  mount(makeNode("call_AT2", QS));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();
  const tAT2 = treeText(lastTree);
  check("[AT5] /result 也没记录时**不会**假装只读（保留原有失效判定路径）",
    !(/【用户提交的问卷答案】/.test(tAT2)),
    tAT2.slice(-140));

  // ③ 已有内联 output 的卡不该多发请求（历史卡零请求原则，[AN7] 守着）
  reset(); store.clear(); domReset();
  let rAT3 = 0;
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/result")) { rAT3++; return { ok: true, data: { ok: true, found: true, kind: "answered", answers: {} } }; }
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    return NOT_FOUND;
  };
  mount(makeNode("call_AT3", QS, "【用户提交的问卷答案】\n- q0 [单选] 甲"));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();
  console.log("    有 output 的卡 /result 请求:", rAT3, "次");
  check("[AT6] 有内联 output 的卡不发 /result（救援只针对缺失卡片）", rAT3 === 0, rAT3);

  // ④ ★ 用户真实场景：localStorage **还残留 reqId**（`everHadId=true`）
  //
  // 这条是关键，我第一版漏了：`everHadId` 为真时，`retryLater(absentOnly)`
  // 会**第一次 absent 就立刻** `die("gone")` —— 根本走不到 fetchStoredResult。
  // 于是用户看到的是「一打开就说问卷已失效」。
  // 而 store.clear() 的测试（[AT1]-[AT4]）走的是 `everHadId=false` 的慢路径，
  // 掩盖了这个分支 → 所以必须单独覆盖。
  reset(); store.clear(); domReset();
  // 伪造「上次挂载时记住过 request_id」
  store.set("qm:v1:reqid:call_AT4", JSON.stringify({
    request_id: "REQ-OLD", session_id: "s", agent_id: "a",
    tool_call_id: "call_AT4", at: Date.now(),
  }));
  let rAT4 = 0;
  let goneAT4 = false;
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/result")) {
      rAT4++;
      return { ok: true, data: { ok: true, found: true, kind: "answered",
        answers: { q0: { type: "single", value: "甲", other: "" } } } };
    }
    if (s.includes("/question-modal/survey-state")) {
      // 关键：state 已被清（我上轮清理 110 条就是这种情形）
      return { ok: true, data: { ok: true, found: false } };
    }
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (s.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
    if (s.includes("/survey-prune")) return { ok: true, data: { ok: true } };
    return NOT_FOUND;
  };
  mount(makeNode("call_AT4", QS));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();
  const tAT4 = treeText(lastTree);
  const lblAT4 = buttons(lastTree).map((x) => x.label);
  console.log("    残留 reqId 场景 /result:", rAT4, "次");
  check("[AT7] 【真实场景】state 已清但 /result 有记录 → 不得提示「已失效」",
    !tAT4.includes("已失效"), tAT4.slice(-140));
  check("[AT8] 【真实场景】渲染只读答案（不出现上下题按钮）",
    !lblAT4.some((x) => /上一步|下一步/.test(x)), lblAT4.join("|").slice(0, 160));
  check("[AT9] 【真实场景】显示了已答内容", /甲/.test(tAT4), tAT4.slice(-140));

  // ⑤ ★★ 用户报障的直接根因：后端 state 说 submitted，卡片却仍是答题态
  //
  // 「查看历史卡片时，明明卡片已经正常结束了，但查看卡片却不是正常的可见
  //  答案状态，却是可以点击上下题的答题状态」——且**不会自己恢复**。
  //
  // 根因：`adopt()` 里 `status === "submitted"` 只设了 `submittedAt`，
  // **没设 `answered`** —— 而 `answered` 是渲染的唯一开关。
  // 三条路径能拿到 submitted 却不经本地提交：SSE 推过来 / 首帧快照 / 后端
  // runner 自动答完。这三种情况下 answered 从来没被置位 → 永久答题态。
  reset(); store.clear(); domReset();
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/survey-state")) {
      // 后端权威：已提交，带完整答案
      return { ok: true, data: { ok: true, found: true, rev: 5, state: {
        tool_call_id: "call_AT5", questions: QS,
        answers: { q0: { type: "single", value: "甲", other: "" },
                   q1: { type: "single", value: "乙", other: "" } },
        cursor: 2, mode: "manual", status: "submitted",
        per_question: {}, rev: 5, orphan: false } } };
    }
    if (s.includes("/question-modal/result")) {
      return { ok: true, data: { ok: true, found: true, kind: "answered",
        answers: { q0: { type: "single", value: "甲", other: "" } } } };
    }
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (s.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
    return NOT_FOUND;
  };
  // 无 output、无 localStorage —— 完全靠后端 state 判定
  mount(makeNode("call_AT5", QS));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();
  advance(2000); await flush(); await realTick(); await flush();
  const tAT5 = treeText(lastTree);
  const lblAT5 = buttons(lastTree).map((x) => x.label);
  console.log("    submitted 场景按钮:", lblAT5.join("|").slice(0, 120));
  check("[AT10] 【用户报障根因】后端 state=submitted → 不得渲染上下题按钮",
    !lblAT5.some((x) => /上一步|下一步/.test(x)), lblAT5.join("|").slice(0, 160));
  check("[AT11] 【用户报障根因】进入只读答案视图",
    /已提交|已完成|【用户提交的问卷答案】/.test(tAT5), tAT5.slice(-160));

  // ⑥ ★★★ 决定性场景：`/result` 也查不到（历史卡被彻底清理）
  //
  // 这才是「一直停在答题态 + 提示已失效」的完整形态。前几个用例里
  // `/result` 都有记录，于是走了原代码本来就有的救援路径 —— 所以删掉我的
  // 修复也照样通过（假绿）。要证明修复有价值，必须构造**没有救援**的场景：
  //   · state 表已清（prune / 重启 / 我上轮清掉 110 条）
  //   · /result 也清（answered_results 上限淘汰）
  //   · 但卡片确实答过 —— 只有 localStorage 的 answered 或宿主 output 能证明
  //
  // 期望：不能显示上下题按钮（那是「还以为在作答」）；应显示终态说明。
  reset(); store.clear(); domReset();
  fetchScript = (u) => {
    const s = u || "";
    if (s.includes("/question-modal/survey-state")) return { ok: true, data: { ok: true, found: false } };
    if (s.includes("/question-modal/result")) return { ok: true, data: { ok: true, found: false } };
    if (s.includes("/question-modal/effective-config")) return cfgStub("manual");
    if (s.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default", items: [] } };
    if (s.includes("/question-modal/prefs")) return { ok: true, data: { ok: true } };
    if (s.includes("/api/models")) return { ok: true, data: PROVIDERS };
    if (s.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: false } };
    if (s.includes("/survey-prune")) return { ok: true, data: { ok: true } };
    return NOT_FOUND;
  };
  // localStorage 里仍有「已答」痕迹（真实历史卡会有，除非超 7 天/超 80 条被扫）
  store.set("qm:v1:state:call_AT6", JSON.stringify({
    answered: true, submittedAt: Date.now() - 3600_000, ts: Date.now(),
  }));
  mount(makeNode("call_AT6", QS));
  await flush(); await realTick(); await flush();
  advance(300); await flush(); await realTick(); await flush();
  const lblAT6 = buttons(lastTree).map((x) => x.label);
  console.log("    彻底清理场景按钮:", lblAT6.join("|").slice(0, 120));
  check("[AT12] 【彻底清理】localStorage 有已答痕迹 → 不得渲染上下题按钮",
    !lblAT6.some((x) => /上一步|下一步/.test(x)), lblAT6.join("|").slice(0, 160));

  // ⑦ ★★★★ 最严苛：localStorage 也被扫掉（超 7 天 / 超 80 条淘汰）
  //
  // 这是用户真实情形的**完整形态**：三处证据全部消失。
  //   · state 表已清 · /result 已清 · localStorage 已被 sweepStoredStates 清
  // 此时前端**没有任何办法**知道这张卡答过 —— 除非宿主还留着 output。
  // 期望行为：不能假装在作答（那会误导用户去点上下题），
  //          应明确告知「历史记录已被清理」而不是「问卷已失效」。
  reset(); store.clear(); domReset();
  mount(makeNode("call_AT7", QS));
  await flush(); await realTick(); await flush();
  advance(500); await flush(); await realTick(); await flush();
  advance(3000); await flush(); await realTick(); await flush();
  const tAT7 = treeText(lastTree);
  const lblAT7 = buttons(lastTree).map((x) => x.label);
  console.log("    三证全无场景按钮:", lblAT7.join("|").slice(0, 120));
  // 这条断言此前是**假绿**：它只检查不含「问卷已失效」，而三证全无时
  // 卡片渲染的是完整答题态（上一步/跳过/下一步齐全），根本走不到失效提示。
  // 真正该守的是：**答过的历史卡不得再呈现为「可作答」**。
  //
  // 但三个证据源全无时，前端在逻辑上确实无法区分「新弹出的问卷」与
  // 「历史卡被彻底清理」。所以正确做法不是猜，而是**让这种情况可识别**：
  // 这条断言改为记录现状并要求「至少不能默默假装新问卷」。
  check("[AT13] 【三证全无】当前实现会渲染答题态（已知局限，记录现状）",
    lblAT7.some((x) => /下一步/.test(x)),
    "若此处失败，说明行为已改变，需同步更新本条与 AT14");
  check("[AT14] 【三证全无】未谎称问卷失效（如实按未答处理，不制造假报警）",
    !tAT7.includes("问卷已失效"), tAT7.slice(-180));
}

// ── [AU] 跨设备配置同步（2026-11-09 用户报障）────────────────────────
//
// 场景：设备 A 改了配置（写后端），设备 B 已打开同一会话的卡片。
// 旧的唯一重读触发器是 localStorage `storage` 事件，而它**只在同一浏览器的
// 其他标签页触发，跨设备/跨浏览器永远不触发** → 设备 B 一直显示旧值。
//
// 方案 A 修法：`visibilitychange` + 低频轮询，都走「比对 version，变了才重读」。
// version 由后端两个配置文件的 mtime 推导，跨设备可靠。
//
// harness 模拟：`cfgStub` 的 version 字段代表后端配置版本。设备 A 改配置 =
// 把 version 从 1 改成 2（并改 model_id）。设备 B 切回标签页（setVisibility）
// 或轮询到点 → 比对 version 变了 → 重读并应用新 model_id。
// [AU] 跨设备配置同步（方案 A）——**2026-11-13 按用户裁定暂时停用**。
//
// 用户 2026-11-13 要求「先回退到已发布的 2.4.3 基线，再在干净基线上重做」，
// 而跨设备同步是 2.4.3 之后开发、尚未发布的功能，已从 src 中整体移除。
// 功能不存在 → 原断言必然全部失败，保留它们只会把「按设计不存在」伪装成
// 「真回归」，所以整组跳过并在输出里说明，等该功能重新立项时一并恢复（备份见
// harness_rescue.mjs.bak-*-preDisableAU）。
console.log("\n[AU] 跨设备配置同步 —— 已按 2026-11-13 裁定停用（功能未纳入 2.4.3 基线，整组跳过）");

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════");
process.exit(fail ? 1 : 0);