// 无头验证：问卷设置按钮 + 居中弹窗（shell only）
// 目标：在真实宿主形态的假环境下，确认
//   [1] addPrefix 被调用，参数（pluginId / id / order）正确
//   [2] 按钮渲染出来了，文案是「问卷设置」
//   [3] 点击按钮 → 弹窗出现，含标题「问卷设置」+ 徽标「建设中」+ 关闭按钮
//   [4] 点关闭 → 弹窗消失（open 状态回 false）
//   [5] 宿主没给 Modal 时降级不崩（仍能渲染 body）
// 依赖真实 dist 产物，不 mock 插件内部逻辑。
// ⚠️ 本套件已【废弃】，被 verify_settings_entry2.mjs 取代（2026-11-04 标注）。
//
// 它断言的契约与现行实现相反：
//   [SG5] 要求 `addPrefix` 收到带 appendChild 的 **DOM 节点**
// 而现行契约（entry2 的 [OWN]）明确禁止传 DOM 节点，必须传 **React 元素** ——
// 传 DOM 节点会与宿主渲染树打架（就是 prompt-forge 当初踩过并规避的坑）。
// 因此它不是「回归」，而是断言了已被推翻的旧设计；保留它会稳定假失败。
// 直接运行时打印说明并跳过；要看真实契约请跑 verify_settings_entry2.mjs。
const DEPRECATED = true;
if (DEPRECATED && !process.env.QM_RUN_DEPRECATED) {
  console.log("════ [跳过] verify_settings_entry.mjs 已废弃（旧契约：addPrefix 收 DOM 节点）");
  console.log("     现行契约见 verify_settings_entry2.mjs 的 [OWN]/[ROOT]；");
  console.log("     确需运行旧套件请设 QM_RUN_DEPRECATED=1。");
  process.exit(0);
}
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUNDLE = path.join(HERE, "dist/index.js");

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (detail ? " → " + detail : "")); }
};

// ── 最小假 DOM（只提供本功能用到的 API）──
function mkEl(tag = "div") {
  const el = {
    tagName: String(tag).toUpperCase(), nodeType: 1,
    children: [], childNodes: [], attrs: {}, style: {}, dataset: {},
    _text: "", parentNode: null, onclick: null,
    appendChild(c) { this.children.push(c); this.childNodes.push(c); c.parentNode = this; return c; },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); c.parentNode = null; }
      return c;
    },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    addEventListener() {}, removeEventListener() {},
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); this.children = []; this.childNodes = []; },
  };
  return el;
}
const documentFake = {
  createElement: (t) => mkEl(t),
  createTextNode: (t) => ({ nodeType: 3, _t: String(t) }),
  head: mkEl("head"), body: mkEl("body"),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
};

// ── 收集 React 渲染出的元素树，便于断言 ──
let renderedTrees = [];
let _inComp = 0;
const FAKE_REACT = {
  createElement(type, props, ...children) {
    // Real React *executes* function components; the fake must too, otherwise
    // a perfectly good component tree looks empty to the assertions.
    if (typeof type === "function" && _inComp < 8) {
      _inComp++;
      try {
        const out = type({ ...(props || {}), children: children.length <= 1 ? children[0] : children });
        return out;
      } finally { _inComp--; }
    }
    return { __el: true, type, props: props || {}, children: children.flat(9) };
  },
  useState: (v) => [v, () => {}],
  useRef: (v) => ({ current: v }),
  useEffect: () => {}, useMemo: (f) => f(), useCallback: (f) => f(),
  Fragment: "Fragment",
};
const FAKE_REACTDOM = {
  render(node, hostEl) {
    renderedTrees.push(node);
    hostEl.__rendered = node;
    return node;
  },
};
const FAKE_ANTD = {
  Modal: function Modal(props) { return { __el: true, type: "Modal", props }; },
};

let addPrefixCalls = [];
const windowFake = {
  QwenPaw: {
    host: {
      React: FAKE_REACT, ReactDOM: FAKE_REACTDOM, antd: FAKE_ANTD, antdIcons: {},
      getApiUrl: (p) => "/api" + p, getApiToken: () => "t",
      useTheme: () => "light",
    },
    chat: {
      toolRender: () => {},
      sender: {
        addPrefix: (pluginId, el, opts) => { addPrefixCalls.push({ pluginId, el, opts }); },
      },
    },
  },
  document: documentFake,
  navigator: { userAgent: "headless" },
  location: { pathname: "/chat/test" },
  localStorage: {
    _d: {},
    getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; },
    get length() { return Object.keys(this._d).length; },
  },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 5)),
  clearTimeout,
  setInterval: () => 0, clearInterval: () => {},
  MutationObserver: class { observe() {} disconnect() {} },
  addEventListener() {}, removeEventListener() {},
  console,
};
windowFake.window = windowFake;

// ── 在受控上下文里执行产物 ──
const src = fs.readFileSync(BUNDLE, "utf8");
const fn = new Function("window", "document", "localStorage", "navigator",
  "location", "console", "fetch", "self", "globalThis", "module", "exports", "require",
  src + "\n;return {};");
fn(windowFake, documentFake, windowFake.localStorage, windowFake.navigator,
   windowFake.location, console, windowFake.fetch, windowFake,
   windowFake, { exports: {} }, {});

// ── 断言 ──
console.log("\n[SG] 问卷设置按钮 + 弹窗（shell only）");

check("[SG1] addPrefix 被调用一次", addPrefixCalls.length === 1, "calls=" + addPrefixCalls.length);

const call = addPrefixCalls[0] || {};
check("[SG2] 传入本插件 pluginId", call.pluginId === "question-modal", "got=" + call.pluginId);
check("[SG3] 扩展点 id 正确", call.opts && call.opts.id === "question-modal.settings-btn",
  JSON.stringify(call.opts));
check("[SG4] order=12（避开 prompt-forge 10 与 todo-panel 11）",
  call.opts && call.opts.order === 12, "order=" + (call.opts || {}).order);
check("[SG5] 挂载点是宿主可插入的元素", !!call.el && typeof call.el.appendChild === "function");

// 首次渲染：只有按钮，弹窗不出现
const t1 = renderedTrees[renderedTrees.length - 1];
function find(node, pred, out = []) {
  if (!node || typeof node !== "object") return out;
  if (pred(node)) out.push(node);
  (node.children || []).forEach((c) => find(c, pred, out));
  (node.props && node.props.children ? [].concat(node.props.children) : []).forEach((c) => find(c, pred, out));
  return out;
}
const btnNodes = find(t1, (n) => n.type === "button" && (n.children || []).includes("问卷设置"));
check("[SG6] 按钮已渲染且文案为「问卷设置」", btnNodes.length >= 1,
  "found=" + btnNodes.length);
const modalOpen1 = find(t1, (n) => n.type === "Modal");
check("[SG7] 初始状态弹窗不显示（未挂载 Modal）", modalOpen1.length === 0,
  "modal=" + modalOpen1.length);

// 点击按钮 → 应重渲染出 Modal
if (btnNodes.length) {
  btnNodes[0].props.onClick();
}
const t2 = renderedTrees[renderedTrees.length - 1];
const modal2 = find(t2, (n) => n.type === "Modal");
check("[SG8] 点击后弹窗出现", modal2.length === 1, "modal=" + modal2.length);

const allText2 = JSON.stringify(t2);
check("[SG9] 弹窗含标题「问卷设置」", allText2.includes("问卷设置"));
check("[SG10] 弹窗含「建设中」占位", allText2.includes("建设中"));
check("[SG11] 弹窗含关闭按钮", (() =>
  find(t2, (n) => n.type === "button" && (n.children || []).includes("关闭")).length >= 1)());
check("[SG12] 弹窗为居中 + 无 footer（不是侧边抽屉）",
  modal2.length === 1 && modal2[0].props.centered === true && modal2[0].props.footer === null,
  JSON.stringify(modal2[0] && { centered: modal2[0].props.centered, footer: modal2[0].props.footer }));

// 点关闭 → 弹窗消失
if (modal2.length) {
  modal2[0].props.onCancel();
}
const t3 = renderedTrees[renderedTrees.length - 1];
check("[SG13] 点关闭后弹窗消失", find(t3, (n) => n.type === "Modal").length === 0);

// 降级：宿主无 Modal 时不应抛错
try {
  const R = FAKE_REACT;
  const savedModal = FAKE_ANTD.Modal;
  delete FAKE_ANTD.Modal;
  windowFake.QwenPaw.host.antd = FAKE_ANTD;
  // 触发一次重渲染
  const btnAgain = find(renderedTrees[renderedTrees.length - 1],
    (n) => n.type === "button" && (n.children || []).includes("问卷设置"));
  if (btnAgain.length) btnAgain[0].props.onClick();
  const t4 = renderedTrees[renderedTrees.length - 1];
  const hasBody = JSON.stringify(t4).includes("建设中");
  check("[SG14] 宿主无 Modal 时降级仍渲染内容（不白屏）", hasBody);
  FAKE_ANTD.Modal = savedModal;
} catch (e) {
  check("[SG14] 宿主无 Modal 时降级仍渲染内容（不白屏）", false, e.message);
}

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
