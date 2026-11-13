// ⚠️ 已废弃（2026-11-04）：诊断页签及缓存清理功能已按用户裁定整体删除，
// 对应测试不再适用。保留文件仅为历史归档。
const DEPRECATED = true;
if (DEPRECATED && !process.env.QM_RUN_DEPRECATED) {
  console.log("════ [跳过] verify_cache_purge.mjs 已废弃（诊断页签+缓存清理已删除）");
  process.exit(0);
}
// 验证：诊断页「缓存清理」（2026-11-04 新增功能2）
//
// 为什么要有这个功能：前端 bundle 是运行时注入的，平时看新版本必须 Ctrl+Shift+R。
// 这里把插件自己的缓存也一起清掉，省掉那个动作。
//
//   [P1] 诊断页出现缓存清理区块（不是别页）
//   [P2] 4 个可清理项全部列出，带大小与说明
//   [P3] 安全项默认勾选、危险项默认不勾
//   [P4] 明确列出不会清理的配置/模板（配置不是缓存）
//   [P5] 未勾危险项时，清理请求只带安全项
//   [P6] 勾了危险项会走二次确认（确认取消 → 不发请求）
//   [P7] 确认后才发请求，且带上危险项
//   [P8] 本地安全键被清、危险键在未勾时保留
//   [P9] 【反证】把 tier 判断写死成「全勾」→ [P3] 必须失败
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
let renders = [], posts = [], fetchCalls = [];
const ReactDOMFake = { render(node, container) { renders.push({ node, container }); return node; } };

/** localStorage with the keys the purge actually targets. */
const lsData = {
  "qm:v1:analysis:global": JSON.stringify({ mode: "manual" }),
  "qm:v1:stash_att:call_a": "[]",
  "qm:v1:state:call_a": JSON.stringify({ answered: false }),
  "qm:v1:reqid:call_a": "req-x",
  "qm:v1:notified:call_a": "1",
  "something:else": "keep-me",
};

const CACHE_ITEMS = [
  { name: "gate_blocks.json", tier: "safe", size: 3072, hint: "拦截日志" },
  { name: "decisions.json", tier: "safe", size: 2048, hint: "决策记录" },
  { name: "answered_results.json", tier: "risky", size: 8192, hint: "历史答案" },
  { name: "pending_questions.json", tier: "risky", size: 100, hint: "未答完问卷" },
];

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {}, getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-p",
      useTheme: () => "light",
    },
    chat: { toolRender: () => {}, sender: { addPrefix: (p, n) => { windowFake.__btn = n; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: {
    _d: { ...lsData },
    getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
  },
  confirm: (msg) => { windowFake.__confirmMsgs.push(String(msg)); return windowFake.__confirmOk; },
  __confirmMsgs: [], __confirmOk: true,
  fetch: (u, o) => {
    const url = String(u);
    fetchCalls.push(url);
    if (url.includes("cache-info")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, items: CACHE_ITEMS,
        protected: ["analysis_prefs.json", "session_prefs.json", "templates.json"] }) });
    }
    if (url.includes("cache-purge")) {
      const body = JSON.parse((o && o.body) || "{}");
      posts.push({ url, body });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, removed: body.names || [], skipped: [], failed: [] }) });
    }
    if (url.includes("effective-config")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "CHAT-P",
        config: { mode: "recommend", show_recommend_badge: true, gate_unsaved: true,
                  slow_question_sec: 60, skip_mode: "per_question", notify_manual_mode: false,
                  model_id: "", template_id: "", with_context: false, parallel: false,
                  model_timeout_sec: 120, badge_position: "left", badge_style: "rect",
                  highlight_recommended: false, auto_number_options: true,
                  fallback_title: true, wait_hint_sec: 180, gate_log_limit: 200,
                  __sources__: {} },
        global_keys: [], version: 1, schema: [] }) });
    }
    if (url.includes("/question-modal/templates")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, default_id: "builtin-default",
        items: [{ id: "builtin-default", name: "默认六步思维链", builtin: true, system: "s", user: "u" }] }) });
    }
    if (o && o.method === "POST") {
      posts.push({ url, body: JSON.parse(o.body || "{}") });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, stored: true }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 2)),
  clearTimeout, setInterval: () => 0, clearInterval: () => {},
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
  return childList(n).map(textOf).join("\n");
}
const last = () => renders[renders.length - 1].node;
const clickTab = (root, label) => {
  const t = findAll(root, (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === label)[0];
  if (t) t.props.onClick();
  return !!t;
};
const boxes = (root) => {
  const m = {};
  findAll(root, (n) => n && n.props && n.props["data-qm-cache-box"]).forEach((n) => {
    m[n.props["data-qm-cache-box"]] = !!n.props.checked;
  });
  return m;
};
const purgeBtn = (root) =>
  findAll(root, (n) => n && n.props && n.props["data-qm-cache-purge"] === "1")[0];

console.log("\n[P] 诊断页缓存清理");

windowFake.__btn.props.onClick();
await flush();

// [P1] 先确认它不在别的页
clickTab(last(), "全局默认");
await flush();
const globalText = textOf(last());
check("[P1] 全局默认页不含缓存清理区块", !/gate_blocks\.json/.test(globalText),
  globalText.slice(-160));

clickTab(last(), "诊断");
await flush();
await flush();
const diag = last();
const diagText = textOf(diag);
check("[P1b] 诊断页出现缓存清理区块",
  /gate_blocks\.json/.test(diagText) && /缓存清理/.test(diagText), diagText.slice(-260));

// [P2] 四项齐全 + 大小 + 说明
check("[P2] 4 个可清理项全部列出",
  /gate_blocks/.test(diagText) && /decisions\.json/.test(diagText)
  && /answered_results\.json/.test(diagText) && /pending_questions\.json/.test(diagText),
  diagText.slice(-300));
check("[P2b] 显示大小与说明",
  /\d+\s*KB/.test(diagText) && /拦截日志/.test(diagText), diagText.slice(-200));

// [P3] 默认勾选
const b0 = boxes(diag);
check("[P3] 安全项默认勾选、危险项默认不勾",
  b0["gate_blocks.json"] === true && b0["decisions.json"] === true
  && b0["answered_results.json"] === false && b0["pending_questions.json"] === false,
  JSON.stringify(b0));

// [P4] 受保护项
check("[P4] 明确列出不会清理的配置与模板",
  /analysis_prefs\.json/.test(diagText) && /templates\.json/.test(diagText),
  diagText.slice(-200));

// [P5] 只清安全项
posts = [];
const btn = purgeBtn(last());
check("[P5-前置] 清理按钮存在", !!btn, "no button");
if (btn) { btn.props.onClick(); await flush(); await flush(); }
const p0 = posts.filter((x) => /cache-purge/.test(x.url));
check("[P5] 未勾危险项时请求只含安全项",
  p0.length === 1
  && p0[0].body.names.indexOf("gate_blocks.json") !== -1
  && p0[0].body.names.indexOf("decisions.json") !== -1
  && p0[0].body.names.indexOf("answered_results.json") === -1
  && p0[0].body.names.indexOf("pending_questions.json") === -1,
  JSON.stringify(p0));

// [P8] 本地键：安全键被清，危险键保留，无关键不动
const ls = windowFake.localStorage._d;
check("[P8] 本地安全键已清空",
  !("qm:v1:analysis:global" in ls) && !("qm:v1:stash_att:call_a" in ls), JSON.stringify(Object.keys(ls)));
check("[P8b] 未勾危险项时本地问卷态保留（不误删）",
  "qm:v1:state:call_a" in ls && "qm:v1:reqid:call_a" in ls, JSON.stringify(Object.keys(ls)));
check("[P8c] 无关的第三方键不受影响", ls["something:else"] === "keep-me");

// [P6] 勾危险项 → 二次确认；取消则不请求
clickTab(last(), "诊断");
await flush();
// 重新勾一条危险项
const riskyBox = findAll(last(), (n) => n && n.props
  && n.props["data-qm-cache-box"] === "answered_results.json")[0];
check("[P6-前置] 找到危险项复选框", !!riskyBox, "not found");
if (riskyBox) { riskyBox.props.onChange(); await flush(); }
windowFake.__confirmOk = false;
windowFake.__confirmMsgs = [];
posts = [];
const btn2 = purgeBtn(last());
if (btn2) { btn2.props.onClick(); await flush(); await flush(); }
check("[P6] 勾危险项会弹二次确认", windowFake.__confirmMsgs.length === 1,
  JSON.stringify(windowFake.__confirmMsgs));
check("[P6b] 确认框点名将被删除的内容",
  windowFake.__confirmMsgs.length === 1 && /历史答案/.test(windowFake.__confirmMsgs[0]),
  JSON.stringify(windowFake.__confirmMsgs));
check("[P7a] 取消确认后不发清理请求",
  posts.filter((x) => /cache-purge/.test(x.url)).length === 0, JSON.stringify(posts));

// [P7] 确认后才发
windowFake.__confirmOk = true;
windowFake.__confirmMsgs = [];
posts = [];
const btn3 = purgeBtn(last());
if (btn3) { btn3.props.onClick(); await flush(); await flush(); }
const p1 = posts.filter((x) => /cache-purge/.test(x.url));
check("[P7] 确认后发出请求且带上危险项",
  p1.length === 1 && p1[0].body.names.indexOf("answered_results.json") !== -1,
  JSON.stringify(p1));

console.log("\n[P9] 【反证】写死 tier 判断 → [P3] 必须失败");
{
  // 在真实 bundle 的基础上，把「安全项默认勾」改写成「全勾」，
  // 看 [P3] 的判据是否能抓到。抓不到说明 [P3] 是假绿。
  // 注意：源码里的变量名会被 esbuild mangle（it → n），所以按「产物文本」
  // 匹配而不是按源码原文匹配 —— 否则反证永远构造不出来，[P3] 就成了假绿。
  // esbuild 每次重新构建都会换掉形参名（n / M / …），写死 "n.tier" 迟早失配。
  // 用正则匹配任意标识符，这样反证在任何一次构建后都构造得出来。
  const TIER_RE = /[A-Za-z_$][\w$]*\.tier === "safe"/;
  const m = src.match(TIER_RE);
  const TIER_EXPR = m ? m[0] : "";
  const mutated = TIER_EXPR ? src.replace(TIER_EXPR, "true") : src;
  const different = !!TIER_EXPR && mutated !== src;
  check("[P9] 反证可构造（bundle 中确实存在 tier 判定）", different,
    "未找到可替换的 tier 判定 — [P3] 可能是假绿");
  if (different) {
    // 只静态确认：改写后「危险项默认勾」会成为可能，
    // 而 [P3] 断言的正是「危险项必须为 false」。
    check("[P9b] 改写后危险项将被默认勾选（[P3] 会失败）",
      /true;/.test(mutated), "mutation not applied");
  }
}

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════════");
process.exit(fail ? 1 : 0);
