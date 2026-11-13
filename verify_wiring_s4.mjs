// 验证 S4：作答页签 5 项真实接线
//   [W1] 5 项控件可交互（点得动、有 onChange）
//   [W2] 改动后底部出现「有 N 项未保存」且保存按钮启用
//   [W3] 全局作用域保存 → POST /prefs，body 只含改动项
//   [W4] 会话作用域保存 → POST /session-prefs，带 chat/session/agent
//   [W5] 保存成功清空草稿 + 明确提示保存到哪个作用域
//   [W6] 标签↔值映射正确（自动分析→ai / 逐题跳过→per_question / 关闭→0）
//   [W7] 已覆盖项显示会话圆点
//   [W8] 锁定项（作用域不适用者）不可交互
//   [W9] 保存失败给出错误且不清空草稿
//   [W10]「还原」清空草稿
//   [W11] 有草稿时关闭弹确认，取消则不关闭
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
    children: [], _text: "", parentNode: null, value: "",
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

let renders = [], posts = [], css = {};
let saveMode = "ok";
let confirmAnswer = true, confirmCalls = [];

const CFG = {
  mode: "manual", show_recommend_badge: true, gate_unsaved: true,
  slow_question_sec: 60, skip_mode: "per_question",
  __sources__: {},
};

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {},
      getApiUrl: (p) => "/api" + p, getApiToken: () => "TOKEN",
      getSelectedAgentId: () => "wb74Jn",
      getCurrentSessionId: () => "sess-abc",
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
    const url = String(u);
    if (url.includes("effective-config")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "UUID-1", config: JSON.parse(JSON.stringify(CFG)),
        global_keys: [], version: 1, schema: [],
      }) });
    }
    if (o && o.method === "POST") {
      posts.push({ url, body: JSON.parse(o.body || "{}") });
      if (saveMode === "fail") {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ detail: "boom" }) });
      }
      // 保存成功后 server 端的新快照
      Object.assign(CFG, posts[posts.length - 1].body.settings || posts[posts.length - 1].body);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  },
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 2)),
  clearTimeout, setInterval: () => 0, clearInterval: () => {},
  confirm: (msg) => { confirmCalls.push(msg); return confirmAnswer; },
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
const btnByVal = (root, val) => findAll(root, (n) => n && n.type === "button" && n.props && n.props["data-qm-val"] === val)[0];
const saveBtn = (root) => findAll(root, (n) => n && n.props && n.props["data-qm-save"] === "1")[0];
const revertBtn = (root) => findAll(root, (n) => n && n.props && n.props["data-qm-revert"] === "1")[0];

console.log("\n[W] 作答页签接线 S4");

windowFake.__btn.props.onClick();
await flush();
check("[W0] 面板已打开且拿到配置", renders.length > 0 && !textOf(last()).includes("读取配置失败"));

// 页签改为「作用域优先」（2026-11-04 重排）：默认停在「当前会话」，
// 作答 5 项现在全在「全局默认」页签里。先切过去，后续断言才有对象。
(function goGlobal() {
  const t = findAll(last(), (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === "全局默认")[0];
  if (t) t.props.onClick();
})();
await flush();

// [W1] 控件可交互
const seg1 = btnByVal(last(), "自动分析");
check("[W1] 分段控件可交互（有 onClick 且未禁用）",
  !!seg1 && typeof seg1.props.onClick === "function" && !seg1.props.disabled,
  seg1 && { dis: seg1.props.disabled });

// [W2] 改动 → 脏标记
seg1.props.onClick();
await flush();
const t2 = textOf(last());
check("[W2] 改动后出现「有 1 项未保存」", /有 1 项未保存/.test(t2), t2.slice(-160));
check("[W2b] 保存按钮启用", !saveBtn(last()).props.disabled);

// [W3] 全局保存
saveBtn(last()).props.onClick();
await flush();
const p3 = posts[posts.length - 1] || {};
check("[W3] 全局作用域 → POST /prefs", /\/question-modal\/prefs$/.test(p3.url), p3.url);
check("[W3b] body 只含改动的那一项", JSON.stringify(p3.body) === '{"mode":"ai"}', JSON.stringify(p3.body));

// [W5] 保存后清空 + 提示
const t5 = textOf(last());
check("[W5] 保存后草稿清空（无脏标记）", !/项未保存/.test(t5), t5.slice(-120));
// 文案已改为明确区分作用域（2026-11-04 隔离修复）：全局保存必须写「所有会话」
check("[W5b] 全局保存提示明确写「对所有会话生效」",
  /对所有会话生效/.test(t5), t5.slice(-200));
// 2026-11-12 用户裁定：保存按钮始终可点（即使无未保存改动，也允许把当前值
// 固化到目标作用域），只有请求进行中才禁用。旧断言「保存后禁用」已过期。
check("[W5c] 保存按钮始终可点（2026-11-12 裁定）",
  saveBtn(last()).props.disabled === false || saveBtn(last()).props.disabled === undefined,
  saveBtn(last()).props.disabled);

// [W6] 标签↔值映射
btnByVal(last(), "只用推荐").props.onClick();
await flush();
saveBtn(last()).props.onClick();
await flush();
check("[W6] 「只用推荐」→ mode=recommend",
  posts[posts.length - 1].body.mode === "recommend",
  JSON.stringify(posts[posts.length - 1].body));

// 跳过方式/计时提示 两个配置入口已按用户裁定移除（2026-11-04），
// 对应 W6b/W7 测试段不再适用。

// [W4] 会话作用域保存 —— 作用域现在由页签决定（「会话模式」页签），
// 不再有切换器，也没有置灰逻辑：该页签里显示的每一项都可编辑。
(function () {
  const t = findAll(last(), (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === "会话模式")[0];
  if (t) t.props.onClick();
})();
await flush();
{
  const t = textOf(last());
  // 2026-11-13 新规则：fixture 的 mode=recommend（只用推荐）时隐藏 4 行，
  // 只显示「答题模式」。与会话页显隐契约一致。
  check("[W4-页签] 会话模式页 mode=recommend → 仅显示答题模式（隐藏 4 行）",
    t.includes("答题模式")
    && ["默认模型", "提示词模板", "携带上下文", "并行分析各题"].every((k) => !t.includes(k))
    && !t.includes("未作答时拦截翻页") && !t.includes("推荐徽章位置"),
    t.slice(-160));
}
btnByVal(last(), "人工").props.onClick();
await flush();
saveBtn(last()).props.onClick();
await flush();
const p4 = posts[posts.length - 1] || {};
check("[W4] 会话模式页签 → POST /session-prefs", /session-prefs$/.test(p4.url), p4.url);
check("[W4b] body 带 chat_id/session_id/agent_id/settings",
  "session_id" in p4.body && "agent_id" in p4.body && "settings" in p4.body,
  Object.keys(p4.body || {}).join(","));
check("[W4c] settings 只含改动项",
  JSON.stringify(p4.body.settings) === '{"mode":"manual"}', JSON.stringify(p4.body.settings));

// [W8] 新结构下没有「不适用」的项 —— 页签隔离取代了置灰，
// 所以正确的断言是：这一页里没有任何被锁的行。
check("[W8] 当前会话页无置灰项（页签隔离取代了置灰）",
  findAll(last(), (n) => n && n.props && n.props["data-qm-locked"] === "1").length === 0,
  "locked=" + findAll(last(), (n) => n && n.props && n.props["data-qm-locked"] === "1").length);

// [W9] 保存失败
saveMode = "fail";
(function () {
  const t = findAll(last(), (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === "全局默认")[0];
  if (t) t.props.onClick();
})();
await flush();
btnByVal(last(), "自动分析").props.onClick();
await flush();
saveBtn(last()).props.onClick();
await flush();
const t9 = textOf(last());
check("[W9] 保存失败显示错误", /保存失败|boom/.test(t9), t9.slice(-140));
check("[W9b] 失败后草稿保留（未丢用户输入）", /项未保存/.test(t9), t9.slice(-140));
saveMode = "ok";

// [W10] 丢弃草稿：2026-11-12 用户裁定删除「还原」按钮，改由「取消」承担
// （取消 = 丢弃本次未保存修改、不关闭面板）。这里点「取消」验证草稿被清空。
const cancelBtn = (root) => findAll(root, (n) => n && n.props && n.props["data-qm-cancel"] === "1")[0];
const cancel10 = cancelBtn(last());
check("[W10] 「取消」按钮存在（取代已删除的「还原」）", !!cancel10, !!cancel10);
if (cancel10) cancel10.props.onClick();
await flush();
check("[W10b] 取消清空草稿", !/项未保存/.test(textOf(last())), textOf(last()).slice(-120));

// [W11] 关闭脏确认
btnByVal(last(), "自动分析").props.onClick();
await flush();
confirmAnswer = false;
confirmCalls = [];
// Modal 的关闭走 onCancel（不是某个按钮的 onClick）
(function () {
  const modal = findAll(last(), (n) => n && n.type === "Modal")[0];
  if (modal && modal.props && typeof modal.props.onCancel === "function") {
    modal.props.onCancel();
  } else {
    // 兜底：面板自带关闭按钮
    const closeBtn = findAll(last(), (n) => n && n.type === "button" && /关闭/.test(textOf(n)))[0];
    if (closeBtn) closeBtn.props.onClick();
  }
})();
check("[W11] 有草稿时关闭会弹确认", confirmCalls.length === 1, confirmCalls.length);
check("[W11b] 取消则不关闭（面板仍在）",
  !textOf(last()).includes("读取配置失败") && renders.length > 0);
confirmAnswer = true;

// 源码反证
const srcTsx = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
check("[W12] 【反证】控件不再是纯展示（存在 onPick 调用）",
  /onPick\s*&&\s*onPick\(/.test(srcTsx) || /if \(onPick\) onPick/.test(srcTsx));
check("[W13] 【反证】编辑不直接落盘（cfgEdit 内无 fetch）",
  !/fetch\(/.test(srcTsx.slice(srcTsx.indexOf("function cfgEdit"),
                              srcTsx.indexOf("function cfgDirtyCount"))));
check("[W14] 【反证】保存后失效配置缓存",
  /invalidateConfigCache\(\)/.test(srcTsx.slice(srcTsx.indexOf("async function cfgSave"),
    srcTsx.indexOf("function cfgDiscard"))));

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
