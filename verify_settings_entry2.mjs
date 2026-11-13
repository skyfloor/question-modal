// 验证：问卷设置入口（按 prompt-forge 稳定方式）
//
// 上次事故的教训：旧测试只断言"元素树里有没有按钮"，完全测不出
// 「把 DOM 节点交给 addPrefix + ReactDOM.render 到宿主树内节点」会炸页面。
// 所以本文件的核心断言是【形态与所有权】：
//   [OWN] addPrefix 收到的必须是 React 元素，绝不能是 DOM 节点
//   [ROOT] 我们的 ReactDOM.render 目标必须是 body 下的独立容器，
//          绝不能是宿主已渲染的节点
// 只要这两条成立，就与 prompt-forge（长期稳定）同构。
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUNDLE = path.join(HERE, "dist/index.js");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? " → " + d : "")); }
};

// ── 假 DOM（带 body 归属关系，用于判定"渲染目标在不在宿主树里"）──
let bodyChildren = [];
function mkEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), nodeType: 1, style: {}, id: "",
    children: [], _text: "", parentNode: null,
    appendChild(c) {
      this.children.push(c); c.parentNode = this;
      if (this === documentFake.body) bodyChildren.push(c);
      return c;
    },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
      const j = bodyChildren.indexOf(c);
      if (j >= 0) bodyChildren.splice(j, 1);
      c.parentNode = null; return c;
    },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); this.children = []; },
  };
  return el;
}
const documentFake = {
  body: mkEl("body"), head: mkEl("head"),
  createElement: (t) => mkEl(t),
  createTextNode: (t) => ({ nodeType: 3, _t: String(t) }),
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
};

// ── 假 React：记录 createElement 产物；执行函数组件以便断言内容 ──
let inComp = 0;
const R = {
  createElement(type, props, ...children) {
    if (typeof type === "function" && inComp < 8) {
      inComp++;
      try { return type({ ...(props || {}), children: children.length <= 1 ? children[0] : children }); }
      finally { inComp--; }
    }
    return { __reactEl: true, type, props: props || {}, children: children.flat(9) };
  },
  useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }),
  useEffect: () => {}, useMemo: (f) => f(), useCallback: (f) => f(),
  Fragment: "Fragment",
};

// ── 假 ReactDOM：记录每次 render 的 (node, container) ──
let renders = [];
const ReactDOMFake = {
  render(node, container) { renders.push({ node, container }); return node; },
};

let addPrefixCalls = [];
const hostEl = { // 宿主内可能存在的"已被 React 渲染"的节点
  __hostOwned: true, tagName: "DIV", appendChild() { throw new Error("must not append into host node"); },
};

const windowFake = {
  QwenPaw: {
    host: {
      React: R, ReactDOM: ReactDOMFake,
      antd: { Button: function B(p) { return { __reactEl: true, type: "Button", props: p }; },
              Modal: function M(p) { return { __reactEl: true, type: "Modal", props: p }; } },
      antdIcons: {},
      getApiUrl: (p) => "/api" + p, getApiToken: () => "t", useTheme: () => "light",
    },
    chat: {
      toolRender: () => {},
      sender: { addPrefix: (pid, node, opts) => addPrefixCalls.push({ pid, node, opts }) },
    },
  },
  document: documentFake,
  navigator: { userAgent: "headless" },
  location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  setTimeout: (f, ms) => setTimeout(f, Math.min(ms || 0, 5)),
  clearTimeout, setInterval: () => 0, clearInterval: () => {},
  MutationObserver: class { observe() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {}, console,
};
windowFake.window = windowFake;

const src = fs.readFileSync(BUNDLE, "utf8");
new Function("window", "document", "localStorage", "navigator", "location", "console",
  "fetch", "self", "globalThis", "module", "exports", "require",
  src + "\n;return {};")(windowFake, documentFake, windowFake.localStorage,
  windowFake.navigator, windowFake.location, console, windowFake.fetch,
  windowFake, windowFake, { exports: {} }, {});

console.log("\n[SB] 问卷设置入口（prompt-forge 同构验证）");

// ── 形态与所有权（上次事故的直接护栏）──
const call = addPrefixCalls[0] || {};
check("[SB1] addPrefix 被调用一次", addPrefixCalls.length === 1, "calls=" + addPrefixCalls.length);
check("[SB2] 传入本插件 pluginId", call.pid === "question-modal", "got=" + call.pid);
check("[SB3] 扩展点 id 正确", call.opts && call.opts.id === "question-modal.settings-btn",
  JSON.stringify(call.opts));
check("[SB4] order=12（避开 prompt-forge 10 / todo-panel 11）",
  call.opts && call.opts.order === 12, "order=" + (call.opts || {}).order);

// ★ 核心护栏 1：交给宿主的必须是 React 元素
const nodeIsReact = !!call.node && call.node.__reactEl === true && typeof call.node.type === "object"
  ? true : (!!call.node && call.node.__reactEl === true);
check("[SB5] 【护栏】addPrefix 收到 React 元素（不是 DOM 节点）", nodeIsReact,
  "node=" + JSON.stringify(call.node)?.slice(0, 120));
check("[SB6] 【护栏】addPrefix 收到的不是 DOM 元素（无 appendChild/tagName）",
  !(call.node && (typeof call.node.appendChild === "function" || call.node.tagName)),
  "node keys=" + Object.keys(call.node || {}).join(","));

// ★ 核心护栏 2：初始不应有 render（弹窗未打开）
check("[SB7] 初始不渲染弹窗（render 次数为 0）", renders.length === 0, "renders=" + renders.length);

// 点击按钮 → 触发 render
const btn = call.node;   // 已被假 React 执行 → 是 Button 产物
check("[SB8] 按钮为 antd Button（type=text）", btn && btn.type === "Button" && btn.props.type === "text",
  JSON.stringify(btn && { type: btn.type, t: btn.props && btn.props.type }));
const btnText = JSON.stringify(btn);
check("[SB9] 按钮文案为「问卷设置」", btnText.includes("问卷设置"));

btn.props.onClick();
check("[SB10] 点击后触发一次渲染", renders.length === 1, "renders=" + renders.length);

// ★ 核心护栏 3：渲染容器必须是 body 下的独立节点，不能是宿主节点
const r0 = renders[0] || {};
check("[SB11] 【护栏】渲染容器不是宿主已持有的节点", r0.container !== hostEl,
  "container=hostEl? " + (r0.container === hostEl));
check("[SB12] 【护栏】渲染容器挂在 document.body 下",
  !!r0.container && r0.container.parentNode === documentFake.body,
  "parent=" + (r0.container && r0.container.parentNode && r0.container.parentNode.tagName));
check("[SB13] 渲染容器是专用容器（id=qm-settings-root）",
  !!r0.container && r0.container.id === "qm-settings-root", "id=" + (r0.container || {}).id);

// 弹窗内容（居中，非抽屉）
const t = JSON.stringify(r0.node);
check("[SB14] 弹窗含标题「问卷设置」", t.includes("问卷设置"));
// 徽标必须描述真实接入状态：措辞随批次推进而变，但不得自相矛盾。
check("[SB15] 弹窗徽标为作用域徽章（会话模式 / 默认模式）",
  t.includes("会话模式") || t.includes("默认模式"), t.slice(0, 200));
check("[SB15b] 旧「预览版/分批接入中」文案已移除",
  !t.includes("预览版") && !t.includes("分批接入中"), t.slice(0, 200));
check("[SB16] 使用居中 Modal（centered:true，非抽屉）",
  t.includes('"centered":true') || t.includes('"centered":!0'), t.slice(0, 200));
check("[SB17] 无 footer（不是带确认按钮的抽屉/表单）",
  t.includes('"footer":null') || t.includes('"footer":!1'));

// 关闭 → 再渲染一次且 open=false
const modalProps = r0.node && r0.node.props;
if (modalProps && typeof modalProps.onCancel === "function") {
  modalProps.onCancel();
  // 关闭后 SettingsPanel(open=false) 会返回 null（这是正确行为），
  // 因此判据是「又渲染了一次，且这次产出为空（弹窗消失）」。
  const second = renders[1] && renders[1].node;
  check("[SB18] 关闭后再渲染一次且弹窗消失（返回 null）",
    renders.length === 2 && (second === null || second === undefined),
    "renders=" + renders.length + " second=" + JSON.stringify(second)?.slice(0, 60));
} else {
  check("[SB18] 关闭后再次渲染且 open=false", false, "onCancel 缺失");
}

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
