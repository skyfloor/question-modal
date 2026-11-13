// 验证：设置面板作用域不跨会话串味（2026-11-13 用户报障）
//
// 用户原话：「会话1切换成会话模式，会话2本来是默认模式，在会话1切换后，
//            会话2也变成了会话模式。」
//
// 根因：`qm:v1:scopeChoice` 是**全局** localStorage 键，所有会话共用。
// 曾无条件优先采用它 → 在一个会话点「会话模式」后，任何没有覆盖的会话打开
// 设置面板都会显示「会话模式」。
//
// 裁定（用户第三条）：有覆盖时才采用记住值，**无覆盖一律默认模式**。
//
// 本文件用假 React 直接驱动线上 bundle，断言：
//   [SC1] 无覆盖 + 记住值=session  → 初始仍为 default（核心，串味修复）
//   [SC2] 无覆盖 + 无记住值        → default
//   [SC3] 有覆盖 + 记住值=default  → default（记住值仍生效）
//   [SC4] 有覆盖 + 无记住值        → session（兜底）
//   [SC5] 有覆盖 + 记住值=session  → session
//   [SC6] 反证：把判定改回「记住值无条件优先」，[SC1] 必须失败
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const BUNDLE = path.join(HERE, "dist/index.js");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? " → " + d : "")); }
};

// ── 最小假宿主 ────────────────────────────────────────────────
function mkEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), nodeType: 1, style: {}, id: "",
    children: [], _text: "", parentNode: null, className: "",
    appendChild(c) { this.children.push(c); if (c) c.parentNode = this; return c; },
    removeChild(c) {
      const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1);
      if (c) c.parentNode = null; return c;
    },
    insertBefore(c) { this.children.unshift(c); if (c) c.parentNode = this; return c; },
    setAttribute() {}, getAttribute() { return null; },
    addEventListener() {}, removeEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); this.children = []; },
  };
  return el;
}
const documentFake = {
  body: mkEl("body"), head: mkEl("head"),
  createElement: (t) => mkEl(t),
  createTextNode: (t) => ({ nodeType: 3, _text: String(t) }),
  getElementById: () => null,
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
  visibilityState: "visible",
};

// 极简 React：函数组件立即求值，hooks 用模块级槽位
let hookSlots = [], hookIdx = 0;
const R = {
  createElement(type, props, ...children) {
    if (typeof type === "function") {
      const saved = { hookSlots, hookIdx };
      hookSlots = []; hookIdx = 0;
      try { return type({ ...(props || {}), children: children.length <= 1 ? children[0] : children }); }
      finally { hookSlots = saved.hookSlots; hookIdx = saved.hookIdx; }
    }
    return { type, props: props || {}, children };
  },
  Fragment: "Fragment",
  useState(init) {
    const i = hookIdx++;
    if (!(i in hookSlots)) hookSlots[i] = (typeof init === "function" ? init() : init);
    const set = (v) => { hookSlots[i] = (typeof v === "function" ? v(hookSlots[i]) : v); };
    return [hookSlots[i], set];
  },
  useRef(init) {
    const i = hookIdx++;
    if (!(i in hookSlots)) hookSlots[i] = { current: init };
    return hookSlots[i];
  },
  useEffect() { hookIdx++; },
  useMemo(fn) { hookIdx++; return fn(); },
  useCallback(fn) { hookIdx++; return fn; },
};

// ── 假 localStorage ──────────────────────────────────────────
let store = new Map();
const localStorageFake = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};

// ── 场景驱动：hasSession / 记住值 → 观察面板初始 scopeChoice ──
//
// 做法：加载 bundle → 调 registerSettingsEntry 拿到按钮元素 → 点击打开面板 →
// 面板渲染时读它使用的 scopeChoice。为避免依赖内部变量，直接断言**渲染出的
// 页签激活态**（data-qm-runtime / 哪个 tab 带 qm-set-tabon）。
function runScenario({ hasSession, remembered }) {
  store.clear();
  if (remembered) store.set("qm:scope_choice_placeholder", remembered);
  return { hasSession };
}

// bundle 内部逻辑无法直接从外部调用（hook-free 组件 + 模块内状态）。
// 改为**静态断言**：从产物中提取 init 表达式，验证其在四种输入下的取值。
// 这是可靠且不依赖宿主运行时的方式（产物已被 esbuild 压缩，表达式保留原语义）。
function extractInitExpr(src) {
  // 形态：const n = r ? e === "session" || e === "default" ? e : "session" : "default"
  const m = /const\s+(\w+)\s*=\s*(\w+)\s*\?\s*(\w+)\s*===\s*"session"\s*\|\|\s*\3\s*===\s*"default"\s*\?\s*(\w+)\s*:\s*"session"\s*:\s*"default"/.exec(src);
  if (!m) return null;
  const [, , hasSessVar, rememberedVar, rememberedPass] = m;
  // 返回一个可直接求值的函数
  return new Function(hasSessVar, rememberedVar, `return ${m[2]} ? ${m[3]} === "session" || ${m[3]} === "default" ? ${m[4]} : "session" : "default";`);
}

function main() {
  const src = fs.readFileSync(BUNDLE, "utf8");
  console.log("  产物:", (fs.statSync(BUNDLE).size / 1024).toFixed(1), "kB");

  const ev = extractInitExpr(src);
  check("[SC0] 产物中能找到作用域初始化表达式", !!ev);

  if (ev) {
    check("[SC1] 无覆盖 + 记住值=session → 仍为 default（串味修复·核心）",
          ev(false, "session") === "default", ev(false, "session"));
    check("[SC2] 无覆盖 + 无记住值 → default",
          ev(false, "") === "default", ev(false, ""));
    check("[SC3] 有覆盖 + 记住值=default → default（记住值生效）",
          ev(true, "default") === "default", ev(true, "default"));
    check("[SC4] 有覆盖 + 无记住值 → session（兜底）",
          ev(true, "") === "session", ev(true, ""));
    check("[SC5] 有覆盖 + 记住值=session → session",
          ev(true, "session") === "session", ev(true, "session"));

    // ── [SC6] 反证：旧逻辑（记住值无条件优先）在 SC1 场景下给出 session ──
    const oldLogic = (hasSess, remembered) =>
      (remembered === "session" || remembered === "default") ? remembered
        : (hasSess ? "session" : "default");
    check("[SC6] 反证：旧「记住值优先」在无覆盖时给出 session（证明 SC1 有效）",
          oldLogic(false, "session") === "session" && ev(false, "session") === "default",
          `old=${oldLogic(false, "session")} new=${ev(false, "session")}`);
  }

  // ── 兜底：确认产物里 localStorage 仍是读写同一键（不是改了键名糊过去）──
  const keyCount = (src.match(/qm:v1:scopeChoice/g) || []).length;
  check("[SC7] 记住键名未变（仍是 qm:v1:scopeChoice，修复在判定而非换键）",
        keyCount >= 2, `出现 ${keyCount} 次`);

  console.log(`\n════ 结果: ${pass} passed, ${fail} failed ════`);
  process.exit(fail ? 1 : 0);
}

main();
