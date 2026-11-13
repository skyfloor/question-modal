// 验证：设置面板「作用域优先」的新页签结构（2026-11-04 重排）
//
// 取代原来的三套（verify_settings_sessions / _scope / _tabs）——它们的前提
// 是「6 个功能页签 + 顶部作用域切换器 + 置灰」，那个结构已经不存在了。
//
// 新结构：当前会话(默认) | 全局默认 | 提示词 | 诊断
//   [N1] 恰好 4 个页签，顺序正确
//   [N2] 默认停在「当前会话」
//   [N3] 当前会话页只有 4 个可覆盖项，按作答/分析分组
//   [N4] 全局默认页有全部 16 项，按作答/分析/显示分组
//   [N5] 提示词 / 诊断两页内容正确
//   [N6] 无作用域切换器、无置灰（页签隔离取代了它）
//   [N7] 保存目标随页签切换（session-prefs / prefs）
//   [N8] 切页签清空草稿（避免把全局改动存到会话）
//   [N9] 纯读取、零写入（除保存外）
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
let renders = [], posts = [], fetchCalls = [], storageWrites = [];
const ReactDOMFake = { render(node, container) { renders.push({ node, container }); return node; } };

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {}, getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-n",
      useTheme: () => "light",
    },
    chat: { toolRender: () => {}, sender: { addPrefix: (p, n) => { windowFake.__btn = n; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { storageWrites.push(k); this._d[k] = String(v); },
    removeItem(k) { storageWrites.push("rm:" + k); delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    const url = String(u);
    fetchCalls.push(url);
    if (url.includes("effective-config")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "CHAT-N",
        config: {
          mode: "recommend", show_recommend_badge: true, gate_unsaved: true,
          slow_question_sec: 60, skip_mode: "per_question",
          model_id: "", template_id: "", with_context: false, parallel: false,
          model_timeout_sec: 120, badge_position: "left", badge_style: "rect",
          highlight_recommended: false, auto_number_options: true,
          fallback_title: true, wait_hint_sec: 180, gate_log_limit: 200,
          __sources__: { mode: "session" },
        },
        global_keys: [], version: 1, schema: [] }) });
    }
    if (url.includes("/question-modal/templates")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, default_id: "builtin-default",
        items: [
          { id: "builtin-default", name: "默认六步思维链", builtin: true, system: "六步…", user: "…" },
          { id: "tpl-x", name: "自定义甲", builtin: false, system: "自定义…", user: "…" },
        ] }) });
    }
    if (url.includes("session-prefs") && o && o.method === "POST") {
      posts.push({ url, body: JSON.parse(o.body || "{}") });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, stored: true }) });
    }
    if (o && o.method === "POST") {
      posts.push({ url, body: JSON.parse(o.body || "{}") });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
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

const flush = () => new Promise((r) => setTimeout(r, 30));
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
const tabNames = (root) => findAll(root, (n) => n && n.type === "button"
  && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || "")))
  .map((b) => textOf(b).replace(/\s+/g, ""));
const clickTab = (root, label) => {
  const t = findAll(root, (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === label)[0];
  if (t) t.props.onClick();
  return !!t;
};
const saveBtn = (root) => findAll(root, (n) => n && n.props && n.props["data-qm-save"] === "1")[0];

console.log("\n[N] 作用域优先的页签结构");

windowFake.__btn.props.onClick();
await flush();
const r0 = last();

// [N1] 页签
const names = tabNames(r0);
check("[N1] 恰好 4 个页签，顺序为 会话模式/默认模式/全局配置/提示词",
  names.join(",") === "会话模式,默认模式,全局配置,提示词", names.join(","));

// [N2] 默认页（2026-11-04 新规则：按「有无会话覆盖」自动切页签）
// 本套件 fixture 的 cfg 无 has_session → 默认落在「默认配置」页。
const t0 = textOf(r0);
check("[N2] 无会话覆盖时默认停在「默认配置」",
  t0.includes("行为默认值") || t0.includes("默认答题模式"), t0.slice(0, 120));
check("[N2b] 默认页含作答/分析节（不是显示类）",
  t0.includes("默认答题模式") && t0.includes("默认模型"), t0.slice(0, 120));

// [N3] 当前会话页内容（显式回到该页签，避免被前面的操作带偏）
clickTab(last(), "会话模式");
await flush();
const t0b = textOf(last());
// 2026-11-13 新规则：fixture 的 mode="recommend"（只用推荐）时隐藏 4 行
// （默认模型/提示词模板/携带上下文/并行分析各题），只显示「答题模式」。
// 与会话页显隐契约一致；改为断言「答题模式在、4 行不在」。
check("[N3] 当前会话页 mode=recommend → 仅显示答题模式（隐藏 4 行）",
  t0b.includes("答题模式") &&
  ["默认模型", "提示词模板", "携带上下文", "并行分析各题"].every((k) => !t0b.includes(k)),
  t0b.slice(0, 200));
check("[N3b] 当前会话页不再有分组小标题（2026-11-12 删「作答/分析」节标题）",
  !t0b.includes("作答"));

// [N4] 拆页（2026-11-04）：默认配置=行为项，全局配置=显示类+杂项
clickTab(r0, "默认模式");
await flush();
const r1d = last();
const t1d = textOf(r1d);
const DEFAULT_ITEMS = [
  "默认答题模式", "默认模型", "提示词模板", "携带上下文", "并行分析各题",
];
const missingD = DEFAULT_ITEMS.filter((k) => !t1d.includes(k));
check("[N4-default] 默认模式页只含与会话页一致的 5 项",
  missingD.length === 0, "缺: " + JSON.stringify(missingD));
check("[N4b-default] 默认模式页不含已迁走的行为项",
  !t1d.includes("未作答时拦截翻页") && !t1d.includes("单题分析超时")
  && !t1d.includes("推荐徽章位置"), "");

clickTab(r0, "全局配置");
await flush();
const r1 = last();
const t1 = textOf(r1);
// 2026-11-04 用户裁定：显示节全删、行为节只留人工提醒+单题超时。
const GLOBAL_ITEMS = ["人工模式时提醒", "单题分析超时", "等待提示阈值", "拦截记录"];
const missing = GLOBAL_ITEMS.filter((k) => !t1.includes(k));
check("[N4] 全局配置页含行为节剩余 2 项+杂项 2 项",
  missing.length === 0, "缺: " + JSON.stringify(missing));
check("[N4b] 已删除的项不再出现",
  !t1.includes("推荐徽章位置") && !t1.includes("未作答时拦截翻页")
  && !t1.includes("跳过方式") && !t1.includes("显示 AI 推荐标记"));

// [N5] 提示词 / 诊断
clickTab(r1, "提示词");
await flush();
const r2 = last();
const t2 = textOf(r2);
check("[N5] 提示词页含模板库与操作按钮",
  t2.includes("模板库共享范围") && /新建模板/.test(t2) && t2.includes("删除"));
check("[N5b] 提示词页的操作按钮已接线（行内编辑/删除 + 新建）",
  findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-new"] === "1").length === 1
  && findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-edit"]).length > 0
  && findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-del"]).length > 0,
  "new=" + findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-new"]).length
  + " edit=" + findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-edit"]).length
  + " del=" + findAll(r2, (n) => n && n.props && n.props["data-qm-tpl-del"]).length);

// [N6] 诊断页签已删除（2026-11-04 用户裁定），其只读信息与缓存清理随之移除。
check("[N5b] 诊断页签已不存在（无「诊断」页签）",
  tabNames(r2).indexOf("诊断") === -1, tabNames(r2).join(","));
check("[N6] 不再有作用域切换器（页签隔离）",
  findAll(r2, (n) => n && n.props && n.props["data-qm-scope"]).length === 0,
  "count=" + findAll(r2, (n) => n && n.props && n.props["data-qm-scope"]).length);

// [N7] 保存目标随页签
clickTab(r2, "会话模式");
await flush();
const r4 = last();
(function () {
  const b = findAll(r4, (x) => x && x.type === "button" && textOf(x).replace(/\s+/g, "") === "人工")[0];
  if (b) b.props.onClick();
})();
await flush();
saveBtn(last()).props.onClick();
await flush();
check("[N7] 会话模式页保存 → POST /session-prefs",
  /session-prefs$/.test((posts[posts.length - 1] || {}).url), (posts[posts.length - 1] || {}).url);

clickTab(last(), "默认模式");
await flush();
(function () {
  const b = findAll(last(), (x) => x && x.type === "button" && textOf(x).replace(/\s+/g, "") === "自动分析")[0];
  if (b) b.props.onClick();
})();
await flush();
saveBtn(last()).props.onClick();
await flush();
check("[N7b] 默认模式页保存 → POST /prefs（不是 session-prefs）",
  /\/question-modal\/prefs$/.test((posts[posts.length - 1] || {}).url), (posts[posts.length - 1] || {}).url);

// [N8] 切页签清草稿（在默认模式页改一项，再切走）
clickTab(last(), "默认模式");
await flush();
(function () {
  // 「人工」与当前 mode（recommend）不同，点它才会真的产生一次改动。
  const b = findAll(last(), (x) => x && x.type === "button" && textOf(x).replace(/\s+/g, "") === "人工")[0];
  if (b) b.props.onClick();
})();
await flush();
check("[N8-前置] 改动后出现脏标记", /项未保存/.test(textOf(last())),
  textOf(last()).slice(-120));
clickTab(last(), "提示词");
await flush();
check("[N8] 切页签后草稿被清空（脏标记消失）",
  !/项未保存/.test(textOf(last())), textOf(last()).slice(-120));

// [N9] 只读底线
const writes = fetchCalls.filter((u) => /gate-block/.test(u));
// cache-info is part of the diagnostics tab (cache purge UI reads the inventory
// on open), so it is an expected read — not an "unexpected request".
const unexpected = fetchCalls.filter((u) => !/effective-config|\/models|templates|prefs|session-prefs/.test(u));
check("[N9] 全程零意外请求", unexpected.length === 0, JSON.stringify(unexpected.slice(0, 3)));

// 源码反证
const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
check("[N10] 【反证】作用域由页签决定（TAB_IS_SESSION）",
  /const TAB_IS_SESSION = \(tab: string\): boolean => tab === "session"/.test(srcTsx));
// 2026-11-04 裁定乙：parallel 也纳入会话级 → 会话页签从 4 个 key 变 5 个。
// 断言改为「恰好这 5 个、且只含这 5 个」，仍能挡住任何漏加/多加。
check("[N11] 【反证】会话页签只含 5 个 key（SESSION_KEYS 含 parallel）",
  /const SESSION_KEYS = \[\s*"mode",\s*"model_id",\s*"template_id",\s*"with_context",\s*"parallel"\s*\]/.test(srcTsx));
check("[N12] 【反证】旧的三套结构定义已移除",
  !/const TAB_HAS_SESSION/.test(srcTsx) && !/data-qm-scope-locked/.test(srcTsx));

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
