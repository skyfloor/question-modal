// ══════════════════════════════════════════════════════════════════
// PROBE — 用户报告的两个新症状（只读取证，不改插件代码）
//
//  症状1：问卷卡片先出现、选项 3-10 秒后才出现
//  症状2：点选一个选项后，клик「下一步/被取消」，已选内容消失
//
// 手法：复用 harness_rescue.mjs 的整套假宿主运行时（假 React / 虚拟时钟 /
//       localStorage / fetch）。做法是把 harness 的公共部分抽出来不可能，
//       因此这里直接以「粘贴最小运行时」的方式独立复现，只依赖 dist/index.js。
// ══════════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.join(HERE, "dist", "index.js");
if (!fs.existsSync(bundlePath)) { console.error("dist/index.js missing"); process.exit(1); }

// ── virtual clock ──
const realSetTimeout = global.setTimeout.bind(global);
let nowMs = 1_700_000_000_000, seq = 0, timers = new Map();
function fakeSetTimeout(fn, ms = 0) { const id = ++seq; timers.set(id, { at: nowMs + ms, fn }); return id; }
function fakeClearTimeout(id) { timers.delete(id); }
async function flush(n = 60) { for (let i = 0; i < n; i++) await Promise.resolve(); }
function realTick() { return new Promise((r) => realSetTimeout(r, 0)); }
async function advance(ms) {
  const target = nowMs + ms;
  while (true) {
    const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at);
    if (!due.length) break;
    const [id, t] = due[0]; nowMs = Math.max(nowMs, t.at); timers.delete(id); t.fn();
    await flush(); await realTick(); await flush();
  }
  nowMs = target; await flush();
}

// ── fake React ──
let hooks = [], hookIdx = 0, currentNode = null, lastTree = null, dirty = false;
function createElement(type, props, ...children) {
  return { type, props: props || {}, children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false && c !== "") };
}
function useState(init) {
  const i = hookIdx++;
  if (!(i in hooks)) hooks[i] = typeof init === "function" ? init() : init;
  return [hooks[i], (v) => { hooks[i] = typeof v === "function" ? v(hooks[i]) : v; scheduleRender(); }];
}
function useRef(init) { const i = hookIdx++; if (!(i in hooks)) hooks[i] = { current: init }; return hooks[i]; }
function useEffect(fn, deps) {
  const slot = "__eff" + hookIdx; const i = hookIdx++;
  const prev = hooks[slot];
  const changed = !prev || !deps || (prev.deps || []).some((d, k) => d !== deps[k]) || (prev.deps || []).length !== (deps || []).length;
  if (!changed) return;
  if (prev && typeof prev.cleanup === "function") { try { prev.cleanup(); } catch (_) {} }
  let cleanup = null;
  try { cleanup = fn() || null; } catch (e) { console.log("  [effect error]", e.message); }
  hooks[slot] = { deps: deps || [], cleanup };
}
const FakeReact = { createElement, useState, useRef, useEffect };
function scheduleRender() { if (dirty || !currentNode) return; dirty = true; realSetTimeout(() => { dirty = false; if (currentNode) renderNow(currentNode); }, 0); }
function renderNow(node) { hookIdx = 0; lastTree = Card({ data: node }); return lastTree; }
function runCleanups() { for (const k of Object.keys(hooks)) { if (k.startsWith("__eff") && hooks[k] && typeof hooks[k].cleanup === "function") { try { hooks[k].cleanup(); } catch (_) {} } } }
function mount(node) { runCleanups(); currentNode = node; hooks = []; lastTree = null; return renderNow(node); }
function remount(node) { runCleanups(); currentNode = node; hooks = []; lastTree = null; return renderNow(node); }

// ── fake browser ──
const store = new Map();
const localStorageFake = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
let fetchScript = null, fetchLog = [];
async function fakeFetch(url, opts = {}) {
  const u = String(url);
  fetchLog.push({ url: u, method: (opts && opts.method) || "GET", body: opts && opts.body });
  const r = fetchScript ? fetchScript(u, opts) : { ok: true, data: { ok: true, found: false } };
  if (r === "network-error") throw new Error("ECONNREFUSED");
  return {
    ok: r.ok !== false,
    status: r.status || (r.ok === false ? 500 : 200),
    json: async () => (r.jsonFn ? r.jsonFn() : r.data ?? {}),
    text: async () => (r.textFn ? r.textFn() : JSON.stringify(r.jsonFn ? r.jsonFn() : (r.data ?? {}))),
  };
}
const el = () => ({ style: {}, setAttribute() {}, appendChild() {}, textContent: "", id: "" });
let createdInput = null;
function documentCreateElement(tag) {
  if (String(tag).toLowerCase() === "input") {
    const node = {
      tagName: "INPUT", type: "", multiple: false, style: {}, accept: "", onchange: null, _attrs: {}, _listeners: {},
      setAttribute(k, v) { this._attrs[k] = v; }, appendChild() {}, click() {},
      addEventListener(t, f) { (this._listeners[t] ||= []).push(f); },
      removeEventListener(t, f) { this._listeners[t] = (this._listeners[t] || []).filter((x) => x !== f); },
    };
    createdInput = node; return node;
  }
  return el();
}
const documentFake = {
  createElement: documentCreateElement, getElementById: () => null,
  head: { appendChild() {} }, body: { appendChild() {} }, documentElement: { appendChild() {} },
  addEventListener() {}, removeEventListener() {},
};
const SESSION = "sess-probe-1", CHAT = "chat-probe-1";
let toolRenderArgs = null;
global.window = {
  QwenPaw: {
    host: {
      React: FakeReact,
      antd: { Input: Object.assign(function () {}, { TextArea: function () {} }), Button: function () {} },
      antdIcons: { FormOutlined: function () {} },
      getApiUrl: (p) => "/api" + p, getApiToken: () => "tok",
      getSelectedAgentId: () => "probe-agent", getCurrentSessionId: () => SESSION, getChatId: () => CHAT,
    },
    chat: { toolRender: (pid, tool, comp) => { toolRenderArgs = { pid, tool, comp }; } },
  },
  document: documentFake, location: { href: "http://host/console", pathname: "/console" },
  addEventListener() {}, removeEventListener() {},
};
global.document = documentFake;
global.localStorage = localStorageFake;
global.fetch = fakeFetch;
global.setTimeout = fakeSetTimeout;
global.clearTimeout = fakeClearTimeout;
Date.now = () => nowMs;

await import("./dist/index.js");
const Card = toolRenderArgs.comp;

// ── helpers ──
const QS = [
  { type: "single", title: "Q1 选哪个方案", options: ["甲", "乙"] },
  { type: "single", title: "Q2 确认吗", options: ["是", "否"] },
];
const REQ = "req-probe-1111";
function makeNode(callId, questions = QS, output = "") {
  const data = { call_id: callId, arguments: JSON.stringify({ title: "取舍确认", questions }) };
  if (output) data.output = [{ type: "text", text: output }];
  return { content: [{ type: "data", data }] };
}
function walk(n, visit) {
  if (n == null) return;
  if (typeof n === "object" && !Array.isArray(n)) {
    visit(n); (n.children || []).forEach((c) => walk(c, visit));
    if (n.props) [].concat(n.props.children || []).forEach((c) => walk(c, visit));
  } else if (Array.isArray(n)) n.forEach((c) => walk(c, visit));
}
function treeText(n) { const out = []; walk(n, (x) => { if (typeof x.children === "object") x.children.forEach((c) => { if (typeof c === "string" || typeof c === "number") out.push(String(c)); }); }); return out.join(" | "); }
// 选项按钮的孩子是元素（徽章 span + 文字），直接 join 会得到 "[object Object]"。
// 必须递归取全部文本 —— 与 harness 的 clickRow(子树文本) 同思路。
function deepText(n) {
  const out = [];
  const rec = (x) => {
    if (typeof x === "string" || typeof x === "number") { out.push(String(x)); return; }
    if (Array.isArray(x)) { x.forEach(rec); return; }
    if (x && typeof x === "object") {
      if (Array.isArray(x.children)) rec(x.children);
      if (x.props) rec(x.props.children);
    }
  };
  rec(n);
  return out.join("");
}
function buttons(n) { const out = []; walk(n, (x) => { if (x.type === "button") out.push({ label: deepText(x), props: x.props }); }); return out; }
function clickButton(label) {
  const bs = buttons(lastTree);
  const b = bs.find((x) => x.label.includes(label));
  if (!b) throw new Error("button not found: " + label + " | have=" + bs.map((x) => x.label).join(","));
  b.props.onClick();
}
function hasText(n, t) { return treeText(n).includes(t); }
function isSelected(label) {
  // 选中态渲染为「✓ <编号>. <文字>」（自动编号开启）或「✓ <文字>」。
  // 用「✓ 与 label 出现在同一段落」判定，不依赖编号是否存在。
  const btns = buttons(lastTree).map((b) => b.label);
  return btns.some((t) => t.includes("✓") && t.includes(label));
}

function reset() { fetchLog = []; dirty = false; }

let pass = 0, fail = 0;
function check(name, ok, extra) { console.log((ok ? "  ✓ " : "  ✗ ") + name + (extra && !ok ? "  [" + String(extra).slice(0, 200) + "]" : "")); ok ? pass++ : fail++; }

// ══════════════════════════════════════════════════════════════════
console.log("\n[P1] 症状1 — 宿主先给「空 arguments」的卡片：插件会渲染成什么？");
reset();
// 宿主 TOOL_CALL_START 推的是 arguments:"" 的 stub（envelope.py:384）。
// 复现：卡片拿到空 arguments 时的渲染结果。
const emptyNode = { content: [{ type: "data", data: { call_id: "call_E", arguments: "" } }] };
mount(emptyNode);
await flush(); await realTick(); await flush();
console.log("    空参数下渲染文本 =", JSON.stringify(treeText(lastTree).slice(0, 160)));
console.log("    空参数下按钮   =", buttons(lastTree).map((b) => b.label).join(","));
check("[P1a] 【已修复】空 arguments → 显示「准备中」骨架，不再渲染退化页",
  hasText(lastTree, "正在准备题目") && !hasText(lastTree, "其他意见"),
  treeText(lastTree).slice(0, 140));
check("[P1b] 【已修复】空 arguments → 不出现任何提交/跳过按钮（杜绝误点）",
  buttons(lastTree).length === 0, buttons(lastTree).map((b) => b.label).join(","));
check("[P1c] 骨架保留卡片标题（框架在、内容未就绪）",
  hasText(lastTree, "问卷"), treeText(lastTree).slice(0, 100));

// 参数到位（宿主 TOOL_CALL_END 的 final content）
const fullNode = makeNode("call_E");
remount(fullNode);
await flush(); await realTick(); await flush();
check("[P1d] 参数到位 → 骨架切换为真正的问题与选项（甲/乙）", hasText(lastTree, "甲") && hasText(lastTree, "乙"), treeText(lastTree).slice(0, 140));

// ══════════════════════════════════════════════════════════════════
console.log("\n[P2] 症状2 — 点选后立刻重挂载（模拟「阻塞提示出现/焦点回归」），选择是否保留？");
reset();
store.clear();
fetchScript = (u) => (u.includes("/question-modal/resolve") ? { ok: true, data: { found: true, request_id: REQ, session_id: SESSION, agent_id: "probe-agent", tool_call_id: "call_F" } } : { ok: false, status: 404 });
mount(makeNode("call_F"));
await flush(); await realTick(); await flush();
clickButton("乙");                              // 选中「乙」
await realTick(); await flush();
console.log("    勾选后立即（未等防抖）卡片文本 =", JSON.stringify(treeText(lastTree).slice(0, 90)));
const stImmediate = store.get("qm:v1:state:call_F");
check("[P2a] 【已修复】勾选后立刻读 localStorage：已同步写入（无防抖窗口）",
  !!stImmediate && JSON.parse(stImmediate).answers.q0.value === "乙", stImmediate);

remount(makeNode("call_F"));                    // 立刻重挂载（<400ms）
await flush(); await realTick(); await flush();
const kept = isSelected("乙");
check("[P2b] 【已修复】勾选后立刻重挂载 → 选择保留（症状2 已消除）", kept === true,
  "kept=" + kept + " text=" + treeText(lastTree).slice(0, 120));

// 对照组：等防抖 400ms 后再重挂载
reset(); store.clear();
mount(makeNode("call_F"));
await flush(); await realTick(); await flush();
clickButton("乙");
await realTick(); await flush();
await advance(500);                              // 越过 400ms 防抖
const stAfter = store.get("qm:v1:state:call_F");
check("[P2c] 状态持续落盘 q0=乙", !!stAfter && JSON.parse(stAfter).answers.q0.value === "乙", stAfter);
remount(makeNode("call_F"));
await flush(); await realTick(); await flush();
check("[P2d] 重挂载 → 选择保留", isSelected("乙"), treeText(lastTree).slice(0, 120));

// ══════════════════════════════════════════════════════════════════
console.log("\n[P3] 症状2 变体 — 「阻塞提示」出现时卡片自身 state 是否会重置？");
reset(); store.clear();
// stuck 定时器 30s 后 setStuck(true)，触发重渲染；检查是否清空选择
mount(makeNode("call_F"));
await flush(); await realTick(); await flush();
clickButton("乙");
await realTick(); await flush();
await advance(31000);                            // 触发 STUCK_AFTER_MS=30000
console.log("    30s 后卡片文本 =", JSON.stringify(treeText(lastTree).slice(0, 140)));
check("[P3a] 阻塞提示出现后仍保留已选「乙」（回归守卫）",
  isSelected("乙"), treeText(lastTree).slice(0, 160));

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════");

// ══════════════════════════════════════════════════════════════════
console.log("\n[P4] 症状1 机制 — 参数「流式半成品」时卡片渲染什么？");
reset(); store.clear();
const FULL = JSON.stringify({ title: "取舍确认", questions: QS });
const partials = [FULL.slice(0, 12), FULL.slice(0, 30), FULL.slice(0, 60)];
partials.forEach((p, i) => {
  const n = { content: [{ type: "data", data: { call_id: "call_G", arguments: p } }] };
  if (i === 0) mount(n); else remount(n);
  console.log("    半成品[" + i + "] len=" + p.length + " → " + JSON.stringify(treeText(lastTree).slice(0, 70)));
});
check("[P4a] 【已修复】参数半成品（JSON 未闭合）→ 一律显示加载骨架，不露退化页",
  hasText(lastTree, "正在准备题目") && !hasText(lastTree, "其他意见"),
  treeText(lastTree).slice(0, 120));
// 最终的完整参数（宿主 TOOL_CALL_END）
remount({ content: [{ type: "data", data: { call_id: "call_G", arguments: FULL } }] });
await flush(); await realTick(); await flush();
check("[P4b] 参数完整 → 显示真正的问题与选项",
  hasText(lastTree, "Q1 选哪个方案") && hasText(lastTree, "甲"),
  treeText(lastTree).slice(0, 140));

// ══════════════════════════════════════════════════════════════════
console.log("\n[P5] 症状2 机制 — 工具结果 stub 到达 → 宿主换 key 重挂载 → 选择丢失");
reset(); store.clear();
fetchScript = (u) => (u.includes("/question-modal/resolve")
  ? { ok: true, data: { found: true, request_id: REQ, session_id: SESSION, agent_id: "probe-agent", tool_call_id: "call_H" } }
  : { ok: false, status: 404 });
// 阶段1：参数完整、还没等 400ms 防抖
mount(makeNode("call_H"));
await flush(); await realTick(); await flush();
clickButton("乙");
await realTick(); await flush();     // 仅一个 microtask，远未到 400ms
// 阶段2：宿主把 PLUGIN_CALL_OUTPUT 的 stub 合并进这条消息（按 output 的 id 作 key）
remount(makeNode("call_H"));
await flush(); await realTick(); await flush();
check("[P5a] 【已修复】结果 stub 到达引起重挂载 → 刚点的「乙」仍在（症状2 已消除）",
  isSelected("乙"), treeText(lastTree).slice(0, 140));

// ══════════════════════════════════════════════════════════════════
console.log("\n[P6] 边界 — 已完成的卡片（有 output、参数缺）不能显示骨架");
reset(); store.clear();
const ansNode = { content: [{ type: "data", data: { call_id: "call_Z", arguments: "", output: "【用户提交的问卷答案】\n- q0 [单选] Q1 选哪个方案：乙" } }] };
mount(ansNode);
await flush(); await realTick(); await flush();
check("[P6a] 有 output 的卡片 → 渲染已完成视图，而非加载骨架",
  hasText(lastTree, "已完成") && !hasText(lastTree, "正在准备题目"),
  treeText(lastTree).slice(0, 140));

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════");
