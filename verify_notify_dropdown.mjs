// 验证：通知频道设置行 = 下拉框（2026-11-14 用户裁定）
//
// ## 为什么有这个用例
//
// 第一版把 7 个频道纵向排成 7 行（每行状态点 + 原因 + 测试按钮）。用户实测：
// 「通知的选择应该采用下拉框的方式……如果当前选择过多，最终会导致界面异常」。
// 改成 <select> 之后必须锁死三件事，否则很容易被后续改动悄悄退化回纵向列表：
//
//   [NC1] 渲染出 <select>（不是 N 个可点行）
//   [NC2] 选项文本内联状态（待测试 / 不可用），不额外占行高
//   [NC3] 不可用频道是 <option disabled>（真禁用，不是只画灰）
//   [NC4] 改选 → 写入草稿 notify_channel（可保存）
//   [NC5] 测试按钮只在「已就绪 + 未验证 + 可远程投递」时出现
//   [NC6] 选项数量多也不增加行数（结构层面防止界面被撑变形）
//   [NC7] 反证：把实现换回纵向列表，[NC1]/[NC6] 必须失败
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
const ReactDOMFake = { render(node) { renders.push({ node }); return node; } };

// 频道清单刻意给 7 个（真实数量），用来证明「多也不撑高」。
const CHANNELS = [
  { channel: "off", label: "关闭", ready: true, reason: "", verified: true },
  // 关键 fixture：**verified=true（历史通过过）+ 最近一次失败**。
  // 这是 2026-11-14 实测的不一致场景：界面会同时显示「已通过测试」+ 红色失败。
  { channel: "wechat", label: "微信", ready: true, reason: "", verified: true,
    last_test: { at: 1, at_text: "2026-11-14 10:02:00", ok: false, delivered: false,
      http: 500, error: "微信会话凭证已过期（需要先给机器人发消息）", note: "" } },
  { channel: "dingtalk", label: "钉钉", ready: false, reason: "宿主未启用该频道或缺少凭据", verified: false },
  // 关键 fixture：可用 **且已验证** —— 用户报障正是「测试通过后按钮消失」，
  // 若所有可远程频道都 verified=false，这个场景根本测不到（反证会假通过）。
  { channel: "feishu", label: "飞书", ready: true, reason: "", verified: true,
    last_test: { at: 3, at_text: "2026-11-14 10:10:00", ok: true, delivered: true,
      http: 500, note: "已送达（渠道响应格式异常，按已送达处理）", error: "" } },
  // 2026-11-14 用户裁定删除 Slack / Discord；新增钉钉（凭据齐全但无会话 → 不可用）
  { channel: "dingtalk", label: "钉钉", ready: false, reason: "该频道还没有任何会话，无法确定收件人", verified: false },
  { channel: "browser", label: "浏览器通知", ready: true, reason: "", verified: false },
];

const TEST_HISTORY = [
  { at: 2, at_text: "2026-11-14 10:05:00", ok: true, delivered: true, http: 500,
    note: "已送达（渠道响应格式异常，按已送达处理）", error: "" },
  { at: 1, at_text: "2026-11-14 10:02:00", ok: false, delivered: false, http: 500,
    error: "微信会话凭证已过期（需要先给机器人发消息）", note: "" },
];

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
    setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; },
    key(i) { return Object.keys(this._d)[i] ?? null; }, get length() { return Object.keys(this._d).length; } },
  fetch: (u, o) => {
    const url = String(u);
    fetchCalls.push(url);
    if (url.includes("/question-modal/notify/test-log")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, items: TEST_HISTORY, limit: 20 }) });
    }
    if (url.includes("/question-modal/notify/channels")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, current: "off", effective: "off", channels: CHANNELS }) });
    }
    if (url.includes("effective-config")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, chat_id: "CHAT-N",
        config: {
          mode: "manual", notify_channel: "off",
          model_id: "", template_id: "", with_context: false, parallel: false,
          model_timeout_sec: 120, wait_hint_sec: 180, gate_log_limit: 200,
          __sources__: {},
        },
        global_keys: [], version: 1, schema: [] }) });
    }
    if (url.includes("/question-modal/templates")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({
        ok: true, default_id: "builtin-default", items: [
          { id: "builtin-default", name: "默认六步思维链", builtin: true, system: "s", user: "u" },
        ] }) });
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
const clickTab = (root, label) => {
  const t = findAll(root, (n) => n && n.type === "button"
    && /qm-set-tab(\s|$)/.test(String(n.props && n.props.className || ""))
    && textOf(n).replace(/\s+/g, "") === label)[0];
  if (t) t.props.onClick();
  return !!t;
};

console.log("\n[NC] 通知频道 = 下拉框");

windowFake.__btn.props.onClick();
await flush();
clickTab(last(), "全局配置");
await flush();
const root = last();

// [NC1] 必须渲染出 <select data-qm-notify-select>
const sel = findAll(root, (n) => n && n.type === "select"
  && n.props && n.props["data-qm-notify-select"] === "1")[0];
check("[NC1] 渲染原生 <select>（下拉框）", !!sel, "未找到 data-qm-notify-select");

// R.createElement 把子节点放在 el.children（fake React 的行为），不是 props.children。
// 用统一的 childList 取，避免依赖具体位置。
const opts = sel ? childList(sel).filter((o) => o && o.type === "option") : [];
const optTexts = opts.map((o) => textOf(o)).filter(Boolean);

// [NC2] 状态内联在选项文本里
check("[NC2] 选项文本内联状态（待测试）", optTexts.some((t) => t.indexOf("（待测试）") !== -1),
  JSON.stringify(optTexts));
check("[NC2b] 选项文本内联状态（不可用）", optTexts.some((t) => t.indexOf("（不可用）") !== -1),
  JSON.stringify(optTexts));

// [NC3] 不可用频道必须真 disabled
const dis = opts.filter((o) => o && o.props && o.props.disabled === true);
check("[NC3] 不可用频道为 <option disabled>", dis.length === 2,
  "disabled 数量=" + dis.length + "（期望 2：钉钉无会话 / 飞书未配置）");
check("[NC3b] 「关闭」与「微信」可选（未 disabled）",
  opts.filter((o) => o && o.props && o.props.value === "off" && !o.props.disabled).length === 1,
  "off 选项状态异常");

// [NC4] 改选写回草稿
let changed = false;
if (sel) {
  const r = sel.props.onChange({ target: { value: "wechat" } });
  changed = true;
}
await flush();
const sel2 = findAll(last(), (n) => n && n.type === "select"
  && n.props && n.props["data-qm-notify-select"] === "1")[0];
check("[NC4] 改选微信 → 下拉停在新值（草稿已写入）",
  changed && !!sel2 && sel2.props.value === "wechat",
  "value=" + (sel2 && sel2.props.value));

// [NC5] 微信已就绪但未验证 → 应出现「测试」按钮
const testBtn = findAll(last(), (n) => n && n.type === "button"
  && n.props && n.props["data-qm-notify-test"] === "wechat")[0];
check("[NC5] 微信待测试 → 出现「测试」按钮", !!testBtn,
  JSON.stringify(findAll(last(), (n) => n && n.type === "button").map((b) => textOf(b)).slice(0, 6)));

// [NC6] 结构层面：7 个频道只占 **1 个** select，不是 7 个可点行
const rows = findAll(root, (n) => n && n.props && String(n.props["data-qm-notify"] || "") !== "");
check("[NC6] 7 个频道只渲染 1 个下拉，不再逐个成行", rows.length === 0,
  "残留纵向行数=" + rows.length);

// ══ 2026-11-14 用户第二次报缺陷：下拉后「测试按钮」与「测试结果」丢失 ══
//
// 用户原话：「可见测试按钮和测试结果，但是你现在切换成下拉后，这 2 个内容
// 丢失了，无法查看测试和测试结果」。
// 根因：v2 把按钮条件写成「仅未验证时显示」→ 测试通过后按钮永久消失
// （token 过期时无法重测）；结果只写前端内存 → 刷新即丢、切频道看不到。
//
// 所以必须锁死：**按钮常驻** + **结果常驻且来自落盘数据**。

// 切到微信（已就绪但有 last_test 失败记录）
const selNow = findAll(last(), (n) => n && n.type === "select"
  && n.props && n.props["data-qm-notify-select"] === "1")[0];
if (selNow) selNow.props.onChange({ target: { value: "wechat" } });
await flush();
const root2 = last();

// [NC8] 测试按钮必须常驻（不因「已验证」而消失）
const testBtn2 = findAll(root2, (n) => n && n.type === "button"
  && n.props && n.props["data-qm-notify-test"] === "wechat")[0];
check("[NC8] 选中可远程投递频道 → 「测试」按钮常驻", !!testBtn2,
  JSON.stringify(findAll(root2, (n) => n && n.type === "button").map((b) => textOf(b))));

// [NC9] 即使 verified=true（已通过测试），按钮也不得消失
const srcTsx2 = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");
// 用户报障的根因就是这个条件：按钮是否渲染**不得**依赖 verified 状态。
check("[NC9] 源码反证：测试按钮的渲染条件不得含 verified 判断",
  /if \(isRemote && curReady\) \{/.test(srcTsx2)
  && !/if \(isRemote && curReady && !?\s*cur\w*Verified/.test(srcTsx2),
  "按钮渲染条件里仍混入了 verified 判断（会导致测试通过后按钮消失）");

// [NC10] 已落盘的测试结果必须常驻显示（不依赖刚点过测试）
const resNode = findAll(root2, (n) => n && n.props
  && String(n.props["data-qm-notify-result"] || "") !== "")[0];
check("[NC10] 上次测试结果常驻显示", !!resNode,
  "未找到 data-qm-notify-result");
check("[NC10b] 结果内容含失败原因（token 过期提示）",
  !!resNode && /凭证已过期|机器人发消息/.test(textOf(resNode)),
  resNode ? textOf(resNode) : "-");
check("[NC10c] 结果内容带时间戳（可判断上次测试何时）",
  !!resNode && /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(textOf(resNode)),
  resNode ? textOf(resNode) : "-");

// ══ v4（2026-11-14 用户裁定）：测试历史整块移除 ══
// 用户原话：「去掉测试历史，这块内容不需要」。
// 断言反过来：不得再有「查看历史」入口与历史列表节点。
// 但**最近一次结果必须仍在**（NC10 已覆盖），否则会把诊断信息一起删掉。
const logToggle = findAll(root2, (n) => n && n.type === "button"
  && n.props && n.props["data-qm-notify-log-toggle"] !== undefined)[0];
check("[NC11] 不再有「查看历史」入口（用户要求移除）", !logToggle,
  logToggle ? "仍存在 data-qm-notify-log-toggle" : "");

const logBoxAny = findAll(root2, (n) => n && n.props
  && n.props["data-qm-notify-log"] !== undefined)[0];
check("[NC11b] 不再渲染历史列表节点", !logBoxAny,
  logBoxAny ? "仍存在 data-qm-notify-log" : "");

check("[NC11c] 产物内无「查看历史」文案残留",
  src.indexOf("查看历史") === -1 && src.indexOf("qm-set-notify-log") === -1,
  "仍能匹配到历史相关文案/锚点");

check("[NC11d] 最近一次结果仍保留（只删多条历史，不删诊断）",
  !!resNode && textOf(resNode).length > 8,
  resNode ? textOf(resNode).slice(0, 40) : "未找到结果节点");

// [NC12] ★核心回归：切到「已通过测试」的频道，按钮和结果必须都还在
// （这正是用户报障的场景：verified=true 时 v2 的按钮会消失）
const sel3 = findAll(last(), (n) => n && n.type === "select"
  && n.props && n.props["data-qm-notify-select"] === "1")[0];
if (sel3) sel3.props.onChange({ target: { value: "feishu" } });
await flush();
const root3 = last();
const testBtn3 = findAll(root3, (n) => n && n.type === "button"
  && n.props && n.props["data-qm-notify-test"] === "feishu")[0];
check("[NC12] 已验证频道仍显示「测试」按钮（可重测）", !!testBtn3,
  JSON.stringify(findAll(root3, (n) => n && n.type === "button").map((b) => textOf(b))));
const resNode3 = findAll(root3, (n) => n && n.props
  && String(n.props["data-qm-notify-result"] || "") !== "")[0];
check("[NC12b] 已验证频道的成功结果仍常驻显示",
  !!resNode3 && /成功|已送达/.test(textOf(resNode3)),
  resNode3 ? textOf(resNode3) : "-");

// [NC17] ★一致性：verified=true 但最近一次失败时，不得显示「已通过测试」
// （2026-11-14 实测自相矛盾：同时出现「已通过测试」+ 红色失败提示）
const selW = findAll(last(), (n) => n && n.type === "select"
  && n.props && n.props["data-qm-notify-select"] === "1")[0];
if (selW) selW.props.onChange({ target: { value: "wechat" } });
await flush();
const vsNode = findAll(last(), (n) => n && n.props
  && n.props["data-qm-notify-verified"] !== undefined)[0];
check("[NC17] 状态标签以最近一次测试结果为准（失败时不谎报已通过）",
  !!vsNode && textOf(vsNode) !== "已通过测试",
  "标签=" + (vsNode ? textOf(vsNode) : "未找到"));

// [NC7] 反证：产物里不得再有纵向列表的旧锚点
check("[NC7] 反证：旧纵向锚点 data-qm-notify-ready 已移除",
  src.indexOf("data-qm-notify-ready") === -1);

// ══ 2026-11-14 用户截图报「UI 怎么变成这样了」：标签被挤成竖排 ══
//
// 症状（用户截图）：左侧「人工模式提醒频道」每字一行、中间一条长线、
// 面板撑满还留大片白。
// 根因：.qm-set-row 是 grid `minmax(0,1fr) auto`，auto 列按内容 max-content
// 定宽；通知行右侧中文失败原因很长 → auto 列被撑到极宽 → 1fr 标签列被压到
// 几像素宽 → 汉字逐字换行。
// 修法：长内容行改用单列块布局（.qm-set-rowblock），右列不再与标签争宽。
//
// 功能用例测不出这类问题，必须断言**结构**。

// [NC13] 通知行必须使用块布局（单列），不得是两列 grid 争宽
const notifyRow = findAll(root3, (n) => n && n.props
  && n.props["data-qm-rowblock"] !== undefined
  && textOf(n).indexOf("人工模式提醒频道") !== -1)[0];
check("[NC13] 通知行采用块布局（data-qm-rowblock=1）",
  !!notifyRow && notifyRow.props["data-qm-rowblock"] === "1",
  notifyRow ? String(notifyRow.props["data-qm-rowblock"]) : "未找到通知行");

check("[NC13b] 通知行 className 含 qm-set-rowblock",
  !!notifyRow && /qm-set-rowblock/.test(String(notifyRow.props.className || "")),
  notifyRow ? String(notifyRow.props.className) : "-");

// [NC14] CSS 必须为块布局提供单列网格（否则标签仍会被挤）
check("[NC14] CSS 定义了 .qm-set-rowblock 单列网格",
  /\.qm-set-rowblock\{grid-template-columns:minmax\(0,1fr\)/.test(src),
  "CSS 未找到块布局单列定义");

check("[NC14b] 块布局下控件区解除 min-width 限制",
  /\.qm-set-rowblock \.qm-set-rowctl\{min-width:0/.test(src),
  "块布局未解除控件区 min-width:180px（仍会挤标签）");

// [NC15] 失败原因长文案必须可折行（不得 pre-wrap 拉成一条长线）
const resTxt = findAll(root2, (n) => n && n.props
  && String(n.props["data-qm-notify-result"] || "") !== "")[0];
check("[NC15] 结果文案不使用 white-space:pre-wrap",
  /\.qm-set-rowblock/.test(src)
  && !/whiteSpace: "pre-wrap"[^}]*data-qm-notify-result/.test(src),
  "结果文案仍可能被 pre-wrap 撑成长线");

// [NC16] 其它设置行不受影响：仍保持两列布局（不能为了修这一行改坏全部）
const otherRows = findAll(root3, (n) => n && /qm-set-row(\s|$)/.test(String(n.props && n.props.className || "")));
const blockRows = otherRows.filter((n) => /qm-set-rowblock/.test(String(n.props.className || "")));
check("[NC16] 仅通知行使用块布局，其它行仍是两列（未波及全局）",
  blockRows.length === 1,
  "块布局行数=" + blockRows.length + " / 总行数=" + otherRows.length);

// ══ 2026-11-14 用户裁定：接入钉钉/飞书，删除 Slack/Discord ══
// 原话：「将钉钉，飞书这2个也接入…其他的选项，例如：slack,discord这2个删掉」
//
// 断言分两层：
//   1) 后端 schema/常量层面 —— 只允许 off/browser/wechat/dingtalk/feishu；
//   2) 产物层面 —— 不得残留 Slack/Discord 文案。
const backendSrc = fs.readFileSync(path.join(HERE, "plugin.py"), "utf8");

check("[NC18] 后端远程频道仅 wechat/dingtalk/feishu",
  /_NOTIFY_REMOTE_CHANNELS = \("wechat", "dingtalk", "feishu"\)/.test(backendSrc),
  (backendSrc.match(/_NOTIFY_REMOTE_CHANNELS = \([^)]*\)/) || ["未找到"])[0]);

check("[NC18b] schema 枚举值只含 off/browser/wechat/dingtalk/feishu",
  /"values": \["off", "browser", "wechat", "dingtalk", "feishu"\]/.test(backendSrc),
  (backendSrc.match(/"values": \[[^\]]*\]/) || ["未找到"])[0]);

check("[NC18c] 标签表不再含 Slack/Discord",
  !/"slack"\s*:/.test(backendSrc) && !/"discord"\s*:/.test(backendSrc),
  "标签表仍含 slack/discord");

check("[NC19] 产物内无 Slack/Discord 文案残留",
  !/Slack/.test(src) && !/Discord/.test(src),
  "dist 仍出现 Slack/Discord");

// 钉钉/飞书必须在后端有凭据成对校验定义（否则「配一半」会被误判可用）
check("[NC20] 钉钉凭据按 client_id+client_secret 成对校验",
  /"dingtalk": \("client_id", "client_secret"\)/.test(backendSrc),
  "缺少钉钉成对凭据定义");

check("[NC20b] 飞书凭据按 app_id+app_secret 成对校验",
  /"feishu": \("app_id", "app_secret"\)/.test(backendSrc),
  "缺少飞书成对凭据定义");

// 下拉里必须能看到钉钉（fixture 里它是不可用项，但要存在于列表）
check("[NC21] 下拉选项含钉钉", optTexts.some((t) => t.indexOf("钉钉") !== -1),
  JSON.stringify(optTexts));
check("[NC21b] 下拉选项含飞书", optTexts.some((t) => t.indexOf("飞书") !== -1),
  JSON.stringify(optTexts));
check("[NC21c] 下拉选项不再含 Slack/Discord",
  !optTexts.some((t) => /Slack|Discord/.test(t)),
  JSON.stringify(optTexts));

// ══ 2026-11-14 用户裁定（第 5 轮）：结果与记录合并为一段，不再分两处展示 ══
// 原话：「将测试结果，和测试记录在一起，而不是分为 2 个展示，这样也能省一些空间」
//
// 原实现有两个并列节点：独立状态标签（未测试/已通过测试/上次失败）+ 结果文案，
// 两者说的是同一件事、各占一段横向空间。改后只保留结果文案节点。
//
// [NC22] 不得再出现独立状态标签（只能是结果节点的 data-qm-notify-verified）
// [NC23] 「上次失败」这类状态词不得单独成节点（应并入结果文案前缀 ✗）
// [NC24] 结果节点同时携带 verified 状态锚点（合并后信息不丢失）
const verifiedNodes = findAll(last(), (n) => n && n.props
  && n.props["data-qm-notify-verified"] !== undefined);
check("[NC22] 状态与结果合并为单一节点（不再有独立状态标签）",
  verifiedNodes.length === 1,
  "带 verified 锚点的节点数=" + verifiedNodes.length);

const mergedNode = verifiedNodes[0];
check("[NC23] 合并节点同时是结果节点（data-qm-notify-result 存在）",
  !!mergedNode && mergedNode.props["data-qm-notify-result"] !== undefined,
  mergedNode ? JSON.stringify(Object.keys(mergedNode.props)) : "未找到");

check("[NC24] 失败时合并文案以 ✗ 开头（状态词并入文案，不单独显示）",
  !!mergedNode && /^✗/.test(textOf(mergedNode)),
  mergedNode ? textOf(mergedNode).slice(0, 40) : "-");

check("[NC25] 产物内不再残留独立状态标签的文案「上次失败」",
  src.indexOf("上次失败") === -1,
  "仍能匹配到「上次失败」");

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════");
process.exit(fail ? 1 : 0);
