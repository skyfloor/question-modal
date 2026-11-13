// 验证：提示词页的模板 CRUD 已真实接入
//   [T1] 列表来自服务端（不是写死两行）
//   [T2] 每行有「编辑」「删除」，内置行删除禁用
//   [T3] 「＋ 新建模板」打开编辑器（三个字段 + 保存/取消）
//   [T4] 编辑现有模板时三个字段被预填
//   [T5] 保存走 POST /templates，且字段名是 system/user（不是 system_prompt）
//   [T6] 名称为空时前端拦下，不发请求
//   [T7] 删除先确认，取消则不删
//   [T8] 内置模板不可删除（前端禁 + 后端 403）
//   [T9] 保存/删除后列表重新拉取
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
let renders = [], posts = [], dels = [], tplGets = 0, saveShouldFail = false;
let confirmAnswer = true, confirmCalls = [];
const ReactDOMFake = { render(n, c) { renders.push({ node: n, container: c }); return n; } };

let TEMPLATES = [
  { id: "builtin-default", name: "默认六步思维链", builtin: true, system: "六步思维链…", user: "{question}" },
  { id: "tpl-a", name: "自定义甲", builtin: false, system: "自定义系统提示…", user: "{question}" },
];

const windowFake = {
  QwenPaw: {
    host: { React: R, ReactDOM: ReactDOMFake,
      antd: { Button: (p) => ({ __reactEl: true, type: "Button", props: p }),
              Modal: (p) => ({ __reactEl: true, type: "Modal", props: p }) },
      antdIcons: {}, getApiUrl: (p) => "/api" + p, getApiToken: () => "T",
      getSelectedAgentId: () => "wb74Jn", getCurrentSessionId: () => "sess-t",
      useTheme: () => "light" },
    chat: { toolRender: () => {}, sender: { addPrefix: (p, n) => { windowFake.__btn = n; } } },
  },
  document: documentFake, navigator: { userAgent: "headless" }, location: { pathname: "/chat/t" },
  localStorage: { _d: {}, getItem(k) { return k in this._d ? this._d[k] : null; },
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    const url = String(u);
    const m = (o && o.method || "GET").toUpperCase();
    if (url.includes("/question-modal/templates")) {
      if (m === "POST") {
        posts.push(JSON.parse((o && o.body) || "{}"));
        if (saveShouldFail) return Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({ ok: false, error: "校验失败" }) });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      if (m === "DELETE") {
        dels.push(url);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
      }
      tplGets++;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, default_id: "builtin-default", items: TEMPLATES }) });
    }
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
  confirm: (msg) => { confirmCalls.push(msg); return confirmAnswer; },
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
    && childList(n).map((x) => (typeof x === "string" ? x : "")).join("").replace(/\s+/g, "") === label)[0];
  if (t) t.props.onClick();
  return !!t;
};
const byAttr = (root, attr) => findAll(root, (n) => n && n.props && n.props[attr] !== undefined);

console.log("\n[T] 提示词页模板 CRUD");

windowFake.__btn.props.onClick();
await flush();
clickTab(last(), "提示词");
await flush();
let root = last();

// [T1] 列表来自服务端
const t1 = textOf(root);
check("[T1] 列表渲染服务端返回的模板（含名称与标记）",
  t1.includes("默认六步思维链") && t1.includes("自定义甲") && t1.includes("内置"),
  t1.slice(0, 200));

// [T2] 行内按钮
const edits = byAttr(root, "data-qm-tpl-edit");
const delsBtns = byAttr(root, "data-qm-tpl-del");
check("[T2] 每行都有「编辑」", edits.length === 2, "count=" + edits.length);
check("[T2b] 每行都有「删除」", delsBtns.length === 2, "count=" + delsBtns.length);
check("[T2c] 内置行的删除按钮禁用",
  delsBtns[0].props.disabled === true, "disabled=" + delsBtns[0].props.disabled);
check("[T2d] 自定义行的删除可用", delsBtns[1].props.disabled !== true);

// [T3] 新建编辑器
byAttr(root, "data-qm-tpl-new")[0].props.onClick();
await flush();
root = last();
check("[T3] 新建打开编辑器",
  byAttr(root, "data-qm-tpl-field").length === 3
  && !!byAttr(root, "data-qm-tpl-save")[0] && !!byAttr(root, "data-qm-tpl-cancel")[0],
  "fields=" + byAttr(root, "data-qm-tpl-field").length);

// [T6] 空名称拦截
const before = posts.length;
byAttr(root, "data-qm-tpl-save")[0].props.onClick();
await flush();
check("[T6] 名称为空时前端拦下，不发请求",
  posts.length === before, "posts=" + posts.length);
check("[T6b] 给出提示", /不能为空/.test(textOf(last())), textOf(last()).slice(-80));

// [T5] 填名称+系统提示后保存，字段名必须是 system/user
function fillField(r, key, val) {
  const el = findAll(r, (n) => n && n.props && n.props["data-qm-tpl-field"] === key)[0];
  if (el && el.props.onChange) el.props.onChange({ target: { value: val } });
}
fillField(last(), "name", "新模板乙");
await flush();
fillField(last(), "system_prompt", "系统提示内容");
await flush();
fillField(last(), "user_prompt", "{question}");
await flush();
const getsBeforeSave = tplGets;
byAttr(last(), "data-qm-tpl-save")[0].props.onClick();
await flush();
const p1 = posts[posts.length - 1] || {};
check("[T5] 保存走 POST，且用 system/user 字段名",
  p1.system === "系统提示内容" && p1.user === "{question}" && p1.system_prompt === undefined,
  JSON.stringify(p1).slice(0, 160));
check("[T5b] 名称为用户输入值", p1.name === "新模板乙", p1.name);

// [T9] 保存后重新拉列表（reloadTemplates 是异步的，多等一轮）
for (let i = 0; i < 4; i++) await flush();
check("[T9] 保存后重新拉取模板列表", tplGets > getsBeforeSave,
  "gets=" + tplGets + " beforeSave=" + getsBeforeSave);

// [T4] 编辑预填（走「重新打开面板」以强制重拉列表，模拟真实用户看到最新数据）
TEMPLATES = TEMPLATES.map((t) => t.id === "tpl-a"
  ? { ...t, name: "自定义甲改", system: "改后的系统提示", user: "改后的用户模板" } : t);
windowFake.__btn.props.onClick();       // 重新打开 → 内部再次 loadSettingsOptions
for (let i = 0; i < 4; i++) await flush();
clickTab(last(), "提示词");
for (let i = 0; i < 4; i++) await flush();
byAttr(last(), "data-qm-tpl-edit")[1].props.onClick();
await flush();
const r4 = last();
const valOf = (k) => {
  const el = findAll(r4, (n) => n && n.props && n.props["data-qm-tpl-field"] === k)[0];
  return el ? String(el.props.value || "") : "(missing)";
};
check("[T4] 编辑时三个字段都预填（含 system 的正确映射）",
  valOf("name") === "自定义甲改" && valOf("system_prompt") === "改后的系统提示"
  && valOf("user_prompt") === "改后的用户模板",
  JSON.stringify({ n: valOf("name"), s: valOf("system_prompt"), u: valOf("user_prompt") }));

// [T7] 删除确认
confirmAnswer = false; confirmCalls = [];
const dBefore = dels.length;
byAttr(last(), "data-qm-tpl-del")[1].props.onClick();
await flush();
check("[T7] 删除前弹确认", confirmCalls.length === 1, "calls=" + confirmCalls.length);
check("[T7b] 取消则不删", dels.length === dBefore, "dels=" + dels.length);

confirmAnswer = true; confirmCalls = [];
byAttr(last(), "data-qm-tpl-del")[1].props.onClick();
await flush();
check("[T7c] 确认后发出 DELETE", dels.length === dBefore + 1, "dels=" + dels.length);

// 源码反证
const srx = fs.readFileSync(SRCTX, "utf8");
check("[T8] 【反证】内置模板的删除按钮被禁用（前端硬保护）",
  /disabled: isBuiltin/.test(srx));
check("[T10] 【反证】保存 payload 用 system/user 而非 system_prompt",
  /system: e\.system_prompt/.test(srx) && /user: e\.user_prompt/.test(srx));
check("[T11] 模板描述清洗 Markdown 并加省略号（不留 ** 残片）",
  /replace\(\/\[#\*_`>\]\/g, ""\)/.test(srx) && /cleanDesc\.slice\(0, 90\) \+ "…"/.test(srx));
check("[T12] 工具栏里不再有孤立的作用域标签",
  !/className: "qm-set-toolbar"[\s\S]{0,180}setScopeTag/.test(srx));
check("[T13] tabbody 不再固定最小高度（避免内容少时大片空白）",
  !/\.qm-set-tabbody\{[^}]*min-height/.test(srx));
check("[T14] 模板下拉显示名称、存 id（选项支持 {value,label}）",
  /const norm = options\.map\(\(o: any, i: number\) =>/.test(srx)
  && /label: \(t && \(t\.name \|\| t\.id\)\) \|\| id/.test(srx));
check("[T15] 模板选项在两个作用域分支外共用一份（不会有一个分支拿不到）",
  (function () {
    const iChoices = srx.indexOf("const tplChoices");
    const iSession = srx.indexOf('if (tab === "session")');
    return iChoices > 0 && iSession > 0 && iChoices < iSession;
  })());

console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
process.exit(fail ? 1 : 0);
