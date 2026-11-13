// 验证：①行布局不再移位（固定网格）②模型选择为厂商+模型双联动
//
//   [L1] 行的 label 列与控件列是固定结构（grid，不是 flex+space-between）
//   [L2] 控件列有 min-width，开关与下拉不会再造成右边界漂移
//   [L3] label 有 min-width:0（长文本可省略，不撑破列）
//   [M1] 厂商下拉含「跟随当前对话模型」+ 每个厂商
//   [M2] 未选厂商时模型下拉禁用
//   [M3] 选厂商后模型下拉启用且只列该厂商的模型
//   [M4] 换厂商时模型列表整体替换（不残留上一家）
//   [M5] 同名模型不串位（不同厂商各自独立）
//   [M6] 选厂商自动选中首个模型（不会存成 `provider:` 空模型）
//   [M7] 切回「跟随当前对话模型」→ 存空字符串
//   [M8] 存量 model_id 的厂商已不存在 → 回落「跟随当前对话模型」
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUNDLE = path.join(HERE, "dist/index.js");
const SRCTX = path.join(HERE, "src/index.tsx");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? " → " + d : "")); }
};

// ── 假 DOM（够跑设置面板即可）──
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
let renders = [];
const ReactDOMFake = { render(n, c) { renders.push({ node: n, container: c }); return n; } };

// 两家厂商，其中 deepseek-v4.1-flash 同名
const PROVIDERS = [
  { id: "aaa", name: "厂A", api_key: "k", models: [{ name: "m-one" }, { name: "shared" }], extra_models: [] },
  { id: "bbb", name: "厂B", api_key: "k", models: [{ name: "shared" }, { name: "m-two" }, { name: "m-three" }], extra_models: [] },
  { id: "ccc", name: "无模型厂", api_key: "k", models: [], extra_models: [] },
];

const windowFake = {
  QwenPaw: {
    host: { React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {}, getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-m",
      useTheme: () => "light" },
    chat: { toolRender: () => {}, sender: { addPrefix: (p, n) => { windowFake.__btn = n; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u) => {
    const url = String(u);
    if (url.includes("/models/active")) return Promise.resolve({ ok: true, json: () => Promise.resolve({ active_llm: { provider_id: "aaa", model: "m-one" } }) });
    if (/\/api\/models(\?|$)/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(PROVIDERS) });
    if (url.includes("effective-config")) return Promise.resolve({ ok: true, json: () => Promise.resolve({
      ok: true, chat_id: "C", config: {
        mode: "manual", show_recommend_badge: true, gate_unsaved: true,
        slow_question_sec: 60, skip_mode: "per_question",
        model_id: "", template_id: "", with_context: false, parallel: false,
        model_timeout_sec: 120, badge_position: "left", badge_style: "rect",
        highlight_recommended: false, auto_number_options: true, fallback_title: true,
        wait_hint_sec: 180, gate_log_limit: 200, __sources__: {},
      }, global_keys: [], version: 1, schema: [] }) });
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
const last = () => renders[renders.length - 1].node;
const clickTab = (root, label) => {
  const t = findAll(root, (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && childList(n).map((x) => (typeof x === "string" ? x : "")).join("").replace(/\s+/g, "") === label)[0];
  if (t) t.props.onClick();
  return !!t;
};

console.log("\n[L] 布局对齐  [M] 厂商+模型双联动");

const srx = fs.readFileSync(SRCTX, "utf8");

// ═══ 布局：结构断言（CSS 在构建产物里是字符串，直接查源码更稳）═══
check("[L1] 行用 grid 两列（不再是 flex+space-between）",
  /\.qm-set-row\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/.test(srx));
check("[L2] 控件列有 min-width（开关与下拉右边界对齐）",
  /\.qm-set-rowctl\{[^}]*min-width:180px/.test(srx));
check("[L3] label 有 min-width:0（长文本可省略不撑破列）",
  /\.qm-set-rowlabel\{[^}]*min-width:0/.test(srx));
check("[L4] 【反证】已不再使用 justify-content:space-between 排布行",
  !/\.qm-set-row\{display:flex[^}]*space-between/.test(srx));
check("[L5] 双联动容器撑满并内部右对齐（不是靠内容宽度自然摆放）",
  /\.qm-set-modelpick\{[^}]*justify-content:flex-end/.test(srx)
  && /\.qm-set-modelpick\{[^}]*flex:1 1 auto/.test(srx)
  && /\.qm-set-modelpick\{[^}]*min-width:0/.test(srx));
check("[L6] 两个下拉可收缩（窄面板里不溢出到左侧）",
  /\.qm-set-nativep\{[^}]*flex:1 1 auto[^}]*min-width:0/.test(srx)
  && /\.qm-set-nativem\{[^}]*flex:1 1 auto[^}]*min-width:0/.test(srx));
// 单下拉的容器同样要右对齐：容器有 min-width:150px，而内部 <select> 更窄，
// 缺 justify-content:flex-end 时选择框会停在容器左侧 → 「提示词模板」行看着没对齐。
check("[L8] 单下拉容器显式右对齐（justify-content:flex-end）",
  /\.qm-set-select\{display:inline-flex;align-items:center;justify-content:flex-end/.test(srx));
check("[L8b] 只读展示态恢复左对齐（纯文本不该被推右）",
  /\.qm-set-select:not\(\.qm-set-selectlive\)\{[^}]*justify-content:flex-start/.test(srx));

check("[L7] 模型行的 rowctl 带 wide 类（解除 min-width 限制）",
  srx.indexOf('qm-set-rowctlwide') > 0
  && /wide \? " qm-set-rowctlwide"/.test(srx)
  && srx.indexOf('.qm-set-rowctlwide{') > 0);

// ═══ 打开面板，切到全局页（模型行在那）═══
windowFake.__btn.props.onClick();
await flush();
clickTab(last(), "全局默认");
await flush();

const provSel = () => findAll(last(), (n) => n && n.props && n.props["data-qm-provider"] === "1")[0];
const modelSel = () => findAll(last(), (n) => n && n.props && n.props["data-qm-model"] === "1")[0];

// [M1] 厂商下拉
const p1 = provSel();
check("[M1] 存在厂商下拉", !!p1);
const pOpts = p1 ? findAll(p1, (n) => n && n.props && n.props.value !== undefined)
  .map((o) => o.props.value) : [];
check("[M1b] 厂商下拉首项为「跟随当前对话模型」（值为空）", pOpts[0] === "", JSON.stringify(pOpts));
check("[M1c] 厂商下拉含全部有模型的厂商",
  pOpts.includes("aaa") && pOpts.includes("bbb"), JSON.stringify(pOpts));
check("[M1d] 无模型的厂商不出现", !pOpts.includes("ccc"), JSON.stringify(pOpts));

// [M2] 未选厂商 → 模型禁用
const m1 = modelSel();
check("[M2] 未选厂商时模型下拉禁用", !!m1 && m1.props.disabled === true, "disabled=" + (m1 && m1.props.disabled));

// [M3] 选厂商 aaa
p1.props.onChange({ target: { value: "aaa" } });
await flush();
const m3 = modelSel();
const m3opts = findAll(m3, (n) => n && n.props && n.props.value !== undefined).map((o) => o.props.value);
check("[M3] 选厂商后模型下拉启用", m3.props.disabled === false);
check("[M3b] 只列该厂商的模型",
  m3opts.includes("m-one") && m3opts.includes("shared") && !m3opts.includes("m-two"),
  JSON.stringify(m3opts));
check("[M6] 选厂商自动选中首个模型（不会存成 provider: 空）",
  m3.props.value === "m-one", "value=" + m3.props.value);

// [M4/M5] 换到 bbb —— 同名 shared 不能串位
provSel().props.onChange({ target: { value: "bbb" } });
await flush();
const m4 = modelSel();
const m4opts = findAll(m4, (n) => n && n.props && n.props.value !== undefined).map((o) => o.props.value);
check("[M4] 换厂商后模型列表整体替换（不残留上一家）",
  !m4opts.includes("m-one") && m4opts.includes("m-two") && m4opts.includes("m-three"),
  JSON.stringify(m4opts));
check("[M5] 同名模型按厂商独立（bbb 的 shared 存在且默认选首个）",
  m4opts.includes("shared") && m4.props.value === "shared",
  "value=" + m4.props.value + " opts=" + JSON.stringify(m4opts));

// [M7] 切回跟随当前对话模型
provSel().props.onChange({ target: { value: "" } });
await flush();
const m7 = modelSel();
check("[M7] 切回「跟随当前对话模型」→ 模型下拉重新禁用",
  m7.props.disabled === true);

// [M8] 存量 model_id 的厂商已不存在 → 回落
const srcFn = new Function("splitModelId", "groups", `
  const parsed = splitModelId("gone:m-x");
  const ids = groups.map(g => g.id);
  return ids.indexOf(parsed.provider) >= 0 ? parsed.provider : "";
`);
// 直接用源码里的规则验证（与组件同一条判断）
check("[M8] 厂商已不存在的存量值回落到「跟随当前对话模型」",
  /const curProvider = ids\.indexOf\(parsed\.provider\) >= 0 \? parsed\.provider : "";/.test(srx));

// splitModelId 处理模型名含冒号
check("[M9] splitModelId 只在第一个冒号处分割（模型名可含冒号）",
  /const i = s2\.indexOf\(":"\);/.test(srx) && /model: s2\.slice\(i \+ 1\)/.test(srx));

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
