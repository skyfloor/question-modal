// ============================================================================
// Ask-User Plugin — Frontend (QwenPaw 2.x, v5)
//
// Two changes in this version:
//
// 1. NATIVE, EVENT-DRIVEN TRIGGER (no polling, no anchor hacks)
//    Registers through the host's tool-render channel:
//        window.QwenPaw.chat.toolRender(pluginId, "question_modal", Component)
//    The host's chat pipeline renders our component INSIDE the `question_modal`
//    tool message — the same place the approval card lives — and passes
//    `{ data }` whose `content[0].data.arguments` is the tool input and
//    `content[1].data.output` the tool result.  Rendering is driven by the
//    SSE stream, so it appears the moment the tool call arrives: no 2s poll,
//    no fixed-position layer, and it survives page reloads.
//
// 2. STYLING COPIED FROM THE HOST APPROVAL CARD
//    Verified against `ApprovalCard-ByshDbY1.css`:
//      card   : --app-surface-raised / --app-border / radius 12px /
//               --app-shadow-sm / padding 16px 20px
//      header : border-bottom 1px --app-border-subtle, icon --app-accent,
//               title 14px/600 --app-text, timer pill --app-fill-subtle
//      actions: flex, gap 8, justify-end, border-top --app-border-subtle
//      buttons: min-width 88px, height 36px, radius 8px, 13px/500;
//               secondary = transparent + 1.5px --app-border-strong;
//               primary   = linear-gradient(135deg, accent, accent-active)
//
// Requests: window.fetch + Authorization: Bearer <getApiToken()>.
// UI:       components from host.antd (never bundled).
//
// 3. AI ANALYSIS (v1.4.0)
//    The card header can carry a model "capsule", an AI/manual switch and a
//    「查看分析」button.  Markdown (`marked`, bundled — the host injects antd
//    but exposes no markdown renderer) renders the six-step recommendation in
//    a Popover bubble.
// ============================================================================

import { marked } from "marked";

const PLUGIN_ID = "question-modal";
const TOOL_NAME = "question_modal";

// Build tag baked into the bundle and posted on every strict-gate rejection.
// A「提交被拦」fires NO normal request and its toast is transient, so "the
// gate didn't fire" was impossible to distinguish from "the browser is still
// running the PREVIOUS bundle" (both leave no durable trace).  The card stamps
// its own tag onto the audit line so the two are told apart by evidence.
/** 自动提交最多尝试次数；用尽后停在末页等用户手动提交（裁定 q1）。 */
const AUTO_SUBMIT_MAX_TRIES = 3;

const BUNDLE_TAG = "gate-v2@2026.10.21";

function host(): any { return (window as any).QwenPaw?.host || {}; }
function chatApi(): any { return (window as any).QwenPaw?.chat || null; }
function antdLib(): any { return host().antd || {}; }
function iconLib(): any { return host().antdIcons || {}; }

// Title icon: an antd icon instead of the "❓" glyph.  Only names that exist
// in the host's 447-icon registry may be used (a missing one throws
// React #130), hence the guarded lookup with a text fallback.
const TITLE_ICON_NAMES = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];

function titleIconNode(R: any): any {
  const icons = iconLib();
  for (const name of TITLE_ICON_NAMES) {
    const Cmp = icons[name];
    if (Cmp) {
      return R.createElement(Cmp, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 },
      });
    }
  }
  return R.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}

// One-time stylesheet.  Injected at module scope (NOT inside a React effect)
// per the host's hook constraint.  Kept intentionally minimal: the user asked
// for the options to keep their original look, so only the card border is
// touched — and it now mirrors the composer input's own border.
function injectStyles(): void {
  try {
    const id = "question-modal-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = [
      // Match the composer input: 1px solid --app-border-strong, radius 12,
      // --app-surface-raised fill (see `.qwenpaw-sender-content` / `.ant-input`).
      ".qm-card{",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45))!important;",
      "border-radius:12px!important;",
      "background:var(--app-surface-raised,#fff)!important;",
      "transition:border-color .16s ease,box-shadow .16s ease}",
      // ── Analysis markdown typography ──
      // The model's six-step reasoning comes back as markdown whose default
      // heading sizes (h1 2em, h2 1.5em…) dwarf the survey text and made the
      // bubble look like a different UI.  The user asked for ONE typographic
      // voice: the same size/colour/family as the questionnaire's own text
      // (option rows are 13px, body colour --app-text).  Every element is
      // therefore pinned to that scale; hierarchy is carried by weight and
      // spacing instead of size, and headings never exceed the body.
      ".qm-md{font-size:13px;line-height:1.65;color:var(--app-text,inherit);",
      "word-break:break-word}",
      ".qm-md>*:first-child{margin-top:0}",
      ".qm-md>*:last-child{margin-bottom:0}",
      ".qm-md h1,.qm-md h2,.qm-md h3,.qm-md h4,.qm-md h5,.qm-md h6{",
      "font-size:13px!important;font-weight:600!important;line-height:1.65!important;",
      "margin:10px 0 4px!important;color:var(--app-text,inherit)!important}",
      ".qm-md p,.qm-md li,.qm-md span,.qm-md div,.qm-md td,.qm-md th{",
      "font-size:13px!important;color:var(--app-text,inherit)}",
      ".qm-md ul,.qm-md ol{margin:4px 0!important;padding-left:20px}",
      ".qm-md li{margin:2px 0}",
      ".qm-md strong,.qm-md b{font-weight:600;color:var(--app-text,inherit)}",
      ".qm-md em{font-style:italic}",
      ".qm-md code{font-family:SF Mono,Monaco,Consolas,monospace;font-size:12px;",
      "background:var(--app-surface-subtle,rgba(127,127,127,0.1));",
      "border-radius:4px;padding:1px 4px}",
      ".qm-md pre{background:var(--app-surface-subtle,rgba(127,127,127,0.08));",
      "border-radius:8px;padding:8px 10px;overflow:auto;margin:6px 0}",
      ".qm-md pre code{background:transparent;padding:0}",
      ".qm-md blockquote{margin:6px 0;padding:2px 0 2px 10px;",
      "border-left:2px solid var(--app-border-strong,rgba(127,127,127,0.45));",
      "color:var(--app-text-secondary,inherit)}",
      ".qm-md hr{border:none;border-top:1px solid var(--app-border-subtle,rgba(127,127,127,0.18));",
      "margin:8px 0}",
      ".qm-md a{color:var(--app-accent,#ff7f16);text-decoration:none}",
      // ── 查看分析弹层：隐藏滚动条但保留滚轮/触控滚动（问题2）──
      // 面板用 maxHeight + overflow:auto 裁长内容，浏览器会画出可见滚动条；
      // 这里与模型列表 (:1436 scrollbarWidth:none) 保持一致——隐藏滚动条槽、
      // 仍可滚动。::-webkit-scrollbar 是伪元素，inline style 写不了，必须走 CSS。
      ".qm-bubble{scrollbar-width:none;-ms-overflow-style:none}",
      ".qm-bubble::-webkit-scrollbar{width:0;height:0;display:none}",
      // ── Narrow screens (phones) ──
      // On a phone the card's content box is only ~320px wide, yet the header's
      // right-hand control cluster (model capsule + AI/manual switch + view
      // button) measures ~319px and refuses to shrink (flex:none).  The title
      // therefore collapsed to a single character per line and the view button
      // was clipped off the card edge.
      //
      // Every rule below lives inside a media query, so a desktop viewport
      // (which never matches) renders exactly as before — the inline styles the
      // component sets are untouched, and only the `.qm-*` hooks are new.
      // `!important` is required because the component styles are inline.
      "@media (max-width:640px){",
      // Give the content back the space the wide padding was consuming.
      ".qm-card{padding:12px 14px!important}",
      // Stack the header: the title takes a full row and the controls drop to
      // a second one, so nothing has to be squeezed.
      ".qm-header{flex-wrap:wrap!important;align-items:flex-start!important;",
      "row-gap:10px!important}",
      ".qm-title{white-space:normal!important;word-break:break-word!important}",
      // Controls: full-width row of their own, wrapping instead of clipping.
      ".qm-actions{flex:1 1 100%!important;flex-wrap:wrap!important;",
      "justify-content:flex-start!important;gap:6px!important}",
      // The analysis bubble was a fixed 460px, which cannot fit a phone.
      ".qm-bubble{width:auto!important;min-width:0!important;",
      "max-width:calc(100vw - 32px)!important}",
      // Footer keeps its four actions on one or two rows without squashing.
      ".qm-footer{flex-wrap:wrap!important;row-gap:8px!important}",
      "}",
      // ── 设置弹窗 UI（2026-11-12 柔和通透风，参照用户 HTML 稿）──
      // 字体沿用宿主继承（用户要求保持原字体）；颜色/圆角/布局对齐参考稿：
      // primary #3b82f6、主文字 #1e293b、次要 #64748b、分隔线 #f1f5f9、输入底 #f8fafc。
      ".qm-set-wrap{font-size:13px;color:var(--app-text-primary,#1e293b);",
      "max-height:90vh;display:flex;flex-direction:column;overflow:hidden}",
      // 中间内容区滚动（参考稿 .tab-content：flex:1 + 自身滚动），footer 不随内容滚走
      ".qm-set-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-width:none}",
      ".qm-set-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      // Modal 内容层归零内边距，由头部/页签/内容/底部各自控制留白（对齐参考稿 28px 栅格）
      ".qm-set-modal .ant-modal-content{padding:0;border-radius:20px;",
      "box-shadow:0 20px 40px -10px rgba(0,0,0,0.08);overflow:hidden}",
      ".qm-set-head{display:flex;align-items:center;justify-content:space-between;",
      "gap:12px;padding:18px 24px 6px;margin:0}",
      // 「当前模式：」前缀 + 胶囊 组成一个右对齐的横向组（2026-11-13）。
      ".qm-set-runtime-wrap{display:inline-flex;align-items:center;gap:6px;",
      "white-space:nowrap}",
      ".qm-set-runtime-label{font-size:12px;font-weight:400;",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-runtime{font-size:12px;font-weight:500;color:#3b82f6;",
      "background:#eff6ff;padding:6px 12px;border-radius:20px;white-space:nowrap}",
      // 2026-11-13：胶囊改为纯展示（不可点），toggle 相关样式已移除。
      ".qm-set-title{font-size:20px;font-weight:600;line-height:1.3;letter-spacing:-0.5px}",
      ".qm-set-badge{font-size:11px;padding:2px 9px;border-radius:999px;",
      "background:var(--app-fill-subtle,rgba(127,127,127,0.14));",
      "color:var(--app-text-secondary,#4e5969);white-space:nowrap}",
      // 胶囊页签（参考稿 .tab-item）：灰底胶囊，激活 = 蓝底白字 + 柔光
      ".qm-set-tabs{display:flex;gap:8px;padding:10px 28px 20px;margin:0;border-bottom:0}",
      ".qm-set-tab{background:var(--app-fill-subtle,#f8fafc);border:0;cursor:pointer;",
      "font-size:13px;line-height:1;padding:8px 18px;border-radius:20px;",
      "color:var(--app-text-secondary,#64748b);font-weight:500;border-bottom:0;",
      "transition:all .2s cubic-bezier(.4,0,.2,1)}",
      ".qm-set-tab:hover{color:var(--app-text-primary,#1e293b);",
      "background:var(--app-fill-strong,#e2e8f0)}",
      // 选中态 = 参考稿激活胶囊：蓝底白字 + 投影（类名/结构不变，仅换视觉）。
      // hover 规则 specificity 更高，需显式钉住已选中项的悬停色。
      ".qm-set-tabon{background:#3b82f6;color:#fff;border-bottom:0;border-radius:20px;",
      "font-weight:500;box-shadow:0 4px 12px rgba(59,130,246,.25)}",
      ".qm-set-tabon:hover{background:#3b82f6;color:#fff}",
      ".qm-set-subhint{font-size:12px;color:var(--app-text-tertiary,#86909c);margin:0 28px 6px}",
      // 加载骨架脉动（2026-11-13 方案A）：内容未定时占位，不渲染半成品设置行。
      // 尊重系统「减少动态效果」偏好：开启时不做动画，静态灰块同样能表达"加载中"。
      "@keyframes qm-set-pulse{0%,100%{opacity:.45}50%{opacity:.9}}",
      "@media (prefers-reduced-motion: reduce){",
      ".qm-set-skeleton>div{animation:none!important}}",
      // ── 作用域切换条 ──
      ".qm-set-scopebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;margin:0 0 12px;border:1px solid var(--app-border-subtle,rgba(127,127,127,.28));border-radius:8px;background:var(--app-bg-secondary,rgba(127,127,127,.05))}",
      ".qm-set-scopebarlabel{font-size:12px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-scopeseg{display:inline-flex;border:1px solid var(--app-border-subtle,rgba(127,127,127,.35));border-radius:6px;overflow:hidden}",
      ".qm-set-scopebtn{appearance:none;border:0;background:transparent;color:inherit;font-size:12px;line-height:1;padding:6px 12px;cursor:pointer}",
      ".qm-set-scopebtn + .qm-set-scopebtn{border-left:1px solid var(--app-border-subtle,rgba(127,127,127,.28))}",
      ".qm-set-scopebtn:hover{background:rgba(127,127,127,.12)}",
      ".qm-set-scopebtnon{background:rgba(64,128,255,.16);font-weight:600}",
      ".qm-set-scopebarhint{font-size:12px;color:var(--app-text-tertiary,#86909c);margin-left:auto}",
      ".qm-set-scopenote{margin:0 0 12px;padding:7px 10px;border-radius:7px;font-size:12px;line-height:1.5;color:#a86400;background:rgba(255,170,40,.12);border:1px solid rgba(255,170,40,.34)}",
      // ── 每项作用域标签 ──
      ".qm-set-rowtitle{display:inline-flex;align-items:center;gap:6px}",
      ".qm-set-scopetag{display:inline-block;font-size:10px;line-height:1;padding:2px 5px;border-radius:3px;letter-spacing:.02em;border:1px solid rgba(127,127,127,.36);background:transparent;color:var(--app-text-tertiary,#86909c);white-space:nowrap}",
      ".qm-set-scopesession{border-color:rgba(28,111,208,.45);background:rgba(28,111,208,.1);color:#1c6fd0;font-weight:600}",
      ".qm-set-scopero{border-color:rgba(138,138,138,.3);background:rgba(138,138,138,.08);color:#8a8a8a}",
      ".qm-set-scopeboth{border-color:rgba(28,111,208,.3);background:rgba(28,111,208,.06);color:#3b7dd8}",
      ".qm-set-static{font-size:12px;color:var(--app-text-secondary,#4e5969)}",
      // ── 模板列表行内操作 ──
      ".qm-set-itemspacer{flex:1 1 auto}",
      ".qm-set-mini{font-size:11px;line-height:1;padding:4px 8px;border-radius:5px;cursor:pointer;",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.32));background:transparent;",
      "color:var(--app-text-secondary,#4e5969);margin-left:6px}",
      ".qm-set-mini:hover{background:rgba(127,127,127,.1)}",
      ".qm-set-minidis{opacity:.4;cursor:not-allowed}",
      ".qm-set-minidis:hover{background:transparent}",
      // ── 模板编辑器 ──
      ".qm-set-editor{margin-top:14px;padding:12px;border-radius:10px;",
      "border:1px solid var(--app-border-subtle,#f1f5f9);",
      "background:var(--app-fill-subtle,rgba(127,127,127,.05))}",
      ".qm-set-editortitle{font-size:13px;font-weight:600;margin-bottom:8px;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-field{margin-bottom:8px}",
      ".qm-set-fieldlabel{font-size:11px;color:var(--app-text-tertiary,#64748b);margin-bottom:3px}",
      ".qm-set-input,.qm-set-textarea{width:100%;box-sizing:border-box;font:inherit;font-size:12px;",
      "padding:7px 10px;border-radius:8px;border:1px solid transparent;",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1e293b);outline:none;resize:vertical}",
      ".qm-set-input:focus,.qm-set-textarea:focus{border-color:#3b82f6}",
      ".qm-set-editorbtns{display:flex;gap:8px;margin-top:4px}",
      // ── 缓存清理 ──
      ".qm-set-cachehint{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin:0 0 8px}",
      ".qm-set-cacherow{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;",
      "column-gap:8px;padding:7px 2px;border-bottom:1px dashed var(--app-border-subtle,rgba(127,127,127,.18))}",
      ".qm-set-cacherow:last-child{border-bottom:0}",
      ".qm-set-check{margin-top:2px;cursor:pointer;flex:0 0 auto}",
      ".qm-set-cachetext{min-width:0}",
      ".qm-set-cachename{display:flex;align-items:center;gap:6px;font-size:12px;",
      "color:var(--app-text-primary,#1f2329);flex-wrap:wrap}",
      ".qm-set-cachesize{font-size:11px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-tagrisky{color:#b5401f;border-color:rgba(181,64,31,.4);background:rgba(181,64,31,.08)}",
      ".qm-set-cachepick{font-size:11px;color:var(--app-text-tertiary,#86909c);margin-left:4px}",
      ".qm-set-cachesafe{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:8px}",
      // ── 置灰：不适用当前作用域的项 ──
      ".qm-set-rowlocked{opacity:.5}",
      ".qm-set-rowlocked .qm-set-rowctl{pointer-events:none}",
      ".qm-set-lockhint{font-size:10px;line-height:1;padding:2px 5px;border-radius:3px;color:#8a8a8a;border:1px dashed rgba(138,138,138,.45)}",
      ".qm-set-scopebtndis{opacity:.45;cursor:not-allowed}",
      ".qm-set-scopebtndis:hover{background:transparent}",
      // ── 会话页签 ──
      ".qm-set-sesshead{display:flex;gap:12px;padding:0 2px 6px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,.28));font-size:12px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-sesscol1{flex:1 1 auto;min-width:0}",
      ".qm-set-sesscol2{flex:0 0 190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-sesslist{margin:2px 0 8px}",
      ".qm-set-sessrow{display:flex;gap:12px;align-items:flex-start;padding:8px 2px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,.16))}",
      ".qm-set-sessid{font-size:13px;color:var(--app-text-primary,#1f2329);word-break:break-all}",
      ".qm-set-sessuuid{font-size:11px;color:var(--app-text-tertiary,#86909c);font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all;margin-top:2px}",
      ".qm-set-sessgone{font-size:11px;color:#a86400;margin-top:2px}",
      ".qm-set-sessempty{padding:22px 2px;text-align:center;font-size:13px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-sessnote{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:6px}",
      // ── 页签内分节小标题（作答 / 分析 / 显示）──
      // （分组小标题样式一并移除，见 settingsTabBody 注释）
      // 全局页签的说明条（与橙色警示区分：这是中性的）
      ".qm-set-scopeglobalnote{margin:0 0 10px;padding:7px 10px;border-radius:7px;font-size:12px;line-height:1.5;color:var(--app-text-secondary,#4e5969);background:var(--app-fill-subtle,rgba(127,127,127,.08));border:1px solid var(--app-border-subtle,rgba(127,127,127,.24))}",
      ".qm-set-sesshint{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:10px}",
      // ── 可交互控件 + 会话覆盖标识 ──
      ".qm-set-ctrldis{opacity:.45;pointer-events:none}",
      ".qm-set-segbtn{display:inline-flex;align-items:center;gap:4px}",
      ".qm-set-selectlive{display:inline-flex;align-items:center;gap:6px;padding:0}",
      // 下拉 = 参考稿 select：灰底、无边框、自绘箭头；悬停/聚焦浮起 + 蓝色光晕
      ".qm-set-native{font:inherit;font-size:13px;line-height:1.4;padding:7px 28px 7px 12px;",
      "border-radius:8px;border:1px solid transparent;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "outline:none;cursor:pointer;transition:all .2s;appearance:none;-webkit-appearance:none;",
      "background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\");",
      "background-repeat:no-repeat;background-position:right 10px center}",
      ".qm-set-native:hover,.qm-set-native:focus{background-color:var(--app-bg-elevated,#fff);",
      "border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}",
      // ── 厂商 + 模型双联动 ──
      // 双联动是「包一层的 div」，不像单 <select> 那样本身就是 rowctl 的直接子项：
      // 宽度由内容决定时它会靠左摆，视觉上就没贴右边界（截图里的错位就是这个）。
      // 这里显式撑满父容器、内部右对齐，并允许两个下拉在窄面板里等比收缩，
      // 保证无论面板多宽，整体右边界都跟其他行一致。
      ".qm-set-modelpick{display:flex !important;align-items:center;justify-content:flex-end;",
      "gap:4px;padding:0;border:0 !important;border-radius:0;background:transparent;",
      "flex:1 1 auto;width:100%;max-width:none;min-width:0;",
      "box-sizing:border-box;overflow:hidden}",
      ".qm-set-nativep{flex:1 1 auto;min-width:0;max-width:150px}",
      ".qm-set-nativem{flex:1 1 auto;min-width:0;max-width:170px}",
      ".qm-set-native{max-width:100%;box-sizing:border-box}",
      ".qm-set-native:disabled{opacity:.55;cursor:not-allowed}",
      ".qm-set-picksep{color:var(--app-text-tertiary,#86909c);font-size:11px;flex:0 0 auto}",
      // ── 未保存提示 ──
      ".qm-set-dirty{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#a86400}",
      ".qm-set-dirtydot{width:6px;height:6px;border-radius:50%;background:#ff9d00}",
      // 底部保存条 = 参考稿 modal-footer：左提示右按钮，上方浅分隔线；固定不滚动
      ".qm-set-foot{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:10px;",
      "margin:8px 28px 0;padding:20px 0;border-top:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-footleft{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto}",
      ".qm-set-footbtns{display:flex;align-items:center;gap:12px;flex:0 0 auto}",
      ".qm-set-scopetarget{font-size:12px;color:var(--app-text-tertiary,#64748b)}",
      ".qm-set-saveMsg{margin:4px 28px 10px;padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.5;color:#1a6b3c;background:rgba(52,168,83,.1);border:1px solid rgba(52,168,83,.3)}",
      // 并发覆盖提示（2026-11-13 需求 2）：橙色警示，与绿色「已保存」区分。
      // 不阻断保存、不弹窗 —— 用户裁定只做页面标注。
      ".qm-set-conflict{margin:4px 28px 10px;padding:8px 12px;border-radius:8px;",
      "font-size:12px;line-height:1.5;color:#a86400;background:rgba(255,170,40,.12);",
      "border:1px solid rgba(255,170,40,.34)}",
      ".qm-set-badgeon{background:rgba(59,130,246,.12);color:#3b82f6;font-weight:500}",
      ".qm-set-badgeglobal{background:rgba(127,127,127,.12);color:var(--app-text-tertiary,#6b7280);font-weight:500}",
      ".qm-set-fallbackclose{position:absolute;top:8px;right:10px;width:24px;height:24px;line-height:1;border:0;border-radius:6px;background:transparent;color:inherit;font-size:14px;cursor:pointer;opacity:.6}",
      ".qm-set-fallbackclose:hover{opacity:1;background:rgba(127,127,127,.14)}",
      ".qm-set-fallback{position:fixed}",
      ".qm-set-tabbody{display:flex;flex-direction:column;gap:2px;padding:0 28px}",
      // ── 行布局：固定网格，彻底消除「控件宽度不同 → 每行错位」──
      // label 列弹性、控件列右对齐；行距与分隔线对齐参考稿（实线浅分隔）。
      ".qm-set-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;",
      // 行密度（2026-11-13 用户反馈「内容不多但界面过于宽松，占据很大空间」）：
      // padding 22px→13px，实测每行 85px→65px，一屏能多看 1~2 行；
      // 标签 14px + 说明 12px 的行内呼吸感未动，观感仍"舒适"不"拥挤"。
      "column-gap:20px;padding:13px 0;",
      "border-bottom:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-row:last-child{border-bottom:0}",
      ".qm-set-rowlabel{display:flex;flex-direction:column;gap:4px;font-size:14px;",
      "font-weight:500;min-width:0;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-rownote{font-size:12px;font-weight:400;color:var(--app-text-tertiary,#64748b);line-height:1.5}",
      // 控件列定宽右对齐：无论里面是开关还是下拉，右边界都落在同一条竖线上。
      ".qm-set-rowctl{display:flex;align-items:center;justify-content:flex-end;",
      "min-width:180px;flex-shrink:0}",
      // setRow 的第 8 个参数 wide=true 时给容器加这个类：内容需要整行宽度
      // 右对齐（双联动下拉），此时不能被 min-width 限制住。
      ".qm-set-rowctlwide{flex:1 1 auto;min-width:0;justify-content:flex-end}",

      // 分段选择 = 参考稿 radio-group：灰底圆角容器 + 白色激活块（蓝字）
      ".qm-set-seg{display:inline-flex;border:0;border-radius:10px;overflow:hidden;",
      "background:var(--app-fill-subtle,#f8fafc);padding:4px;gap:2px}",
      ".qm-set-segbtn{background:transparent;border:0;cursor:pointer;font-size:13px;padding:6px 14px;",
      "border-radius:8px;color:var(--app-text-secondary,#64748b);",
      "border-right:0;transition:all .2s}",
      ".qm-set-segbtn:last-child{border-right:0}",
      ".qm-set-segon{background:var(--app-bg-elevated,#fff);",
      "color:#3b82f6;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,.04)}",
      // 开关 = 参考稿 iOS 风格（放大到 42x24，激活蓝）
      ".qm-set-switch{width:44px;height:24px;border-radius:24px;cursor:pointer;position:relative;",
      "background:var(--app-fill-strong,#cbd5e1);transition:background .2s;flex-shrink:0}",
      ".qm-set-switch-on{background:#3b82f6}",
      ".qm-set-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;",
      "background:#fff;transition:left .2s;box-shadow:0 2px 4px rgba(0,0,0,.12)}",
      ".qm-set-switch-on .qm-set-knob{left:22px}",
      // 容器本身不画边框：真正的控件（<select> / 胶囊）自己带底色。
      // justify-content:flex-end 必须有：容器有 min-width:150px，而内部的
      // <select> 通常只有 ~120px，inline-flex 默认从左侧排布 → 选择框停在容器
      // 左边、右侧留出一段空白，视觉上就是「这一行没贴右」。
      ".qm-set-select{display:inline-flex;align-items:center;justify-content:flex-end;",
      "gap:6px;cursor:pointer;font-size:12px;",
      "border:0;background:transparent;padding:0;color:var(--app-text-primary,#1e293b);",
      "max-width:100%;min-width:150px;box-sizing:border-box}",
      // 只读展示态（无 <select>）由容器承担灰底，且文本左对齐更自然。
      ".qm-set-select:not(.qm-set-selectlive){border:1px solid transparent;",
      "border-radius:8px;padding:7px 12px;justify-content:flex-start;",
      "background:var(--app-fill-subtle,#f8fafc)}",
      ".qm-set-selecttext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-selectarrow{color:var(--app-text-tertiary,#64748b);font-size:10px}",
      ".qm-set-list{display:flex;flex-direction:column;gap:10px}",
      // 模板卡 = 参考稿 prompt-card：浅边框圆角卡，悬停轻微浮起
      ".qm-set-item{border:1px solid var(--app-border-subtle,#f1f5f9);",
      "border-radius:10px;padding:14px 16px;transition:all .2s;background:var(--app-bg-elevated,#fff)}",
      ".qm-set-item:hover{border-color:var(--app-border-strong,#cbd5e1);",
      "box-shadow:0 4px 12px rgba(0,0,0,.03)}",
      ".qm-set-itemhead{display:flex;align-items:center;gap:8px;margin-bottom:6px}",
      ".qm-set-itemname{font-size:14px;font-weight:600;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-tag{font-size:11px;padding:2px 8px;border-radius:6px;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-secondary,#64748b)}",
      ".qm-set-tagbuiltin{background:var(--app-fill-subtle,rgba(127,127,127,0.24))}",
      // 模板卡预览 = 参考稿 prompt-preview：最多两行，超出省略
      ".qm-set-itemdesc{font-size:13px;line-height:1.6;color:var(--app-text-tertiary,#64748b);",
      "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".qm-set-toolbar{display:flex;gap:8px;margin-top:14px}",
      // 通用按钮 = 参考稿 .btn：灰底无边框圆角 8；主按钮见下方复合选择器
      ".qm-set-btn{font-size:14px;padding:9px 22px;height:auto;cursor:pointer;border-radius:8px;",
      "border:0;background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "transition:all .2s}",
      ".qm-set-btn:hover{background:var(--app-fill-strong,#e2e8f0)}",
      // 保存按钮 = 参考稿 .btn-save：蓝底白字 + 蓝色柔光，hover 加深。
      // 必须用复合选择器且声明在 .qm-set-btn 之后：两条同特异性规则按顺序
      // 覆盖，否则通用按钮的灰底会压过这里的蓝底（用户报「保存按钮不高亮」的根因）。
      ".qm-set-btn.qm-set-btnprimary{background:#3b82f6;color:#fff;",
      "box-shadow:0 4px 12px rgba(59,130,246,.2)}",
      ".qm-set-btn.qm-set-btnprimary:hover{background:#2563eb}",
      ".qm-set-btn.qm-set-btnprimary:disabled{opacity:.45}",
      // 新建模板按钮 = 参考稿 btn-new-template：虚线边框，悬停转蓝
      ".qm-set-btnnew{border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:var(--app-bg-elevated,#fff)}",
      ".qm-set-btnnew:hover{border-color:#3b82f6;color:#3b82f6;",
      "background:rgba(59,130,246,.06)}",
      ".qm-set-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;",
      "color:var(--app-text-secondary,#4e5969)}",
    ].join("");
    document.head.appendChild(el);
  } catch (_) { /* ignore */ }
}

function apiUrl(path: string): string {
  try {
    const h = host();
    if (typeof h.getApiUrl === "function") return h.getApiUrl(path);
  } catch (_) { /* ignore */ }
  return "/api" + path;
}

// The host injects only {React, ReactDOM, antd, antdIcons, apiBaseUrl,
// getApiUrl, getApiToken, prepareBrowserSession, usesBrowserSession} into
// window.QwenPaw.host — verified in the shipped bundle.  There is NO
// getSelectedAgentId and NO getCurrentSessionId, so both used to resolve to
// "" and every request went out unaddressed.  Anything we learn about the
// live chat is therefore cached here and reused (see cacheHostContext).
let _hostAgentId = "";
let _hostSessionId = "";

/** Remember what the backend told us about the live chat.
 *  /question-modal/resolve returns both `session_id` and `agent_id`, which is
 *  the only reliable source available to an injected card. */
function cacheHostContext(sessionId?: string, agentId?: string): void {
  if (sessionId) _hostSessionId = sessionId;
  if (agentId) _hostAgentId = agentId;
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const h = host();
    const token = typeof h.getApiToken === "function" ? h.getApiToken() : "";
    if (token) headers["Authorization"] = "Bearer " + token;
    let agentId =
      typeof h.getSelectedAgentId === "function" ? h.getSelectedAgentId() : "";
    if (!agentId) agentId = _hostAgentId;         // learned from /resolve
    if (agentId) headers["X-Agent-Id"] = agentId;
  } catch (_) { /* ignore */ }
  return headers;
}

function currentSessionId(): string {
  try {
    const h = host();
    if (typeof h.getCurrentSessionId === "function") {
      const v = h.getCurrentSessionId() || "";
      if (v) return v;
    }
  } catch (_) { /* ignore */ }
  const w = (window as any).currentSessionId;
  if (typeof w === "string" && w) return w;
  return _hostSessionId;                          // learned from /resolve
}

/** Agent id for this card's requests.
 *
 *  `_hostAgentId` is only learned after a `/resolve` round-trip, so on the very
 *  first mount it is still empty — passing it verbatim sent `agent_id=` (blank)
 *  and made the server's session_id→chat_uuid lookup ambiguous whenever two
 *  agents share a session_id.  Ask the host first; fall back to the learned id.
 */
function currentAgentId(): string {
  try {
    const h = host();
    const v = typeof h.getSelectedAgentId === "function" ? (h.getSelectedAgentId() || "") : "";
    if (v) return v;
  } catch (_) { /* ignore */ }
  return _hostAgentId;
}

// ── Manual-mode reminder (Web Notification) ────────────────────────────
//
// The browser cannot call Win32 APIs; `Notification` is the only channel that
// surfaces outside the tab (Windows shows it in the action centre).  Three
// constraints shape the implementation:
//   1. permission is per-origin and can be denied → fall back to an in-page
//      highlight instead of failing silently;
//   2. it only fires while the page is alive — nothing can be delivered once
//      the tab is closed;
//   3. it must fire ONCE per survey: a reminder that repeats on every question
//      becomes the thing you want to silence.

/** Cards already notified, so a remount does not re-notify. */
const _notifiedCards: Record<string, boolean> = {};

/** Show the reminder for one card.  Returns how it was delivered. */
async function notifyManualSurvey(
  callId: string, title: string, count: number,
): Promise<"system" | "inpage" | "skipped"> {
  if (typeof window === "undefined") return "skipped";
  if (_notifiedCards[callId]) return "skipped";

  // Cross-reload guard: a page refresh remounts the card with the same callId,
  // and re-notifying after a refresh is exactly the "nagging" behaviour to avoid.
  try {
    const key = "qm:v1:notified:" + callId;
    if (window.localStorage && window.localStorage.getItem(key) === "1") {
      _notifiedCards[callId] = true;
      return "skipped";
    }
    window.localStorage.setItem(key, "1");
  } catch (_) { /* private mode: fall through, in-memory guard still applies */ }
  _notifiedCards[callId] = true;

  const body = count > 0
    ? ("「" + title + "」有 " + count + " 道题等你作答")
    : ("「" + title + "」等你作答");

  const N = (window as any).Notification;
  if (!N) return "inpage";

  try {
    // Ask only when we actually need it (裁定 q2): prompting on first use keeps
    // the permission dialog attached to a user-visible action.
    if (N.permission === "default") {
      const got = await new Promise<string>((resolve) => {
        let settled = false;
        const done = (v: string) => { if (!settled) { settled = true; resolve(v); } };
        try {
          const p = N.requestPermission((v: string) => done(v));
          if (p && typeof p.then === "function") p.then(done).catch(() => done("denied"));
        } catch (_) { done("denied"); }
        // A browser that never settles must not hang the card.
        setTimeout(() => done(N.permission || "denied"), 8000);
      });
      if (got !== "granted") return "inpage";
    }
    if (N.permission !== "granted") return "inpage";

    const n = new N("问卷等待作答", { body, tag: "qm-" + callId, renotify: false });
    // Clicking the notification should bring the tab back, otherwise the user
    // still has to hunt for it.
    n.onclick = () => {
      try { (window as any).focus(); } catch (_) { /* ignore */ }
      try { n.close(); } catch (_) { /* ignore */ }
    };
    return "system";
  } catch (_) {
    return "inpage";
  }
}

/** The session this card belongs to, with fallbacks that do not depend on a
 *  host API that does not exist.  Preference order: the id the backend bound
 *  to this very tool call → whatever /resolve reported globally → the host. */
function cardSessionId(callId: string): string {
  const stored = recallReqId(callId);
  if (stored && stored.session_id) return stored.session_id;
  return currentSessionId();
}

// ══════════════════════════════════════════════════════════════════
// 「agent 已恢复输出」后台判定（2026-10-22 四次裁定：改后台计时）
// ══════════════════════════════════════════════════════════════════
//
// 为什么重做（前三轮都失败的记录，别再走回头路）：
//   · 判据 1「兄弟项 + data-role + 非空文本」在两种宿主布局下**一个假阳一个假阴**：
//     提交瞬间宿主会插入「生成中」占位气泡（实测 `textContent === "-"`，长度 1 却
//     非空）→ 立刻停表冻结「等待 0s」；反过来，当正文与卡片被合并进**同一个**消息
//     项时，「只向后看」永远找不到 → 永不停表。
//   · 判据 2 为了抓住事件把 MutationObserver 挂在**整个 body** 上。流式输出每秒
//     产生大量 mutation，每次都触发一次全量 DOM 扫描，**抢主线程** → 文字明明已经
//     到达却画不出来，用户视角就是「提交问卷后模型等了几秒才输出」。
//   · 前台每秒读秒本身又带来「重挂载把命令式文本冲回 0」这一类问题。
//
// 用户裁定（本次）：前台**去掉读秒**，改**后台计时**——不需要精准，只要判到前台
// 已有模型输出就停掉自己的定时器；越过阻塞阈值才追加「释放阻塞」指引；计时本身
// 绝不允许再干扰模型输出。
//
// 由此确立的三条硬约束：
//  1. **零观察者**：不挂 MutationObserver。改为低频轮询（BG_POLL_MS），且优先排在
//     浏览器空闲时段（requestIdleCallback）跑，主线程忙时自动让路。
//  2. **判据与 DOM 结构无关**：只看「本张卡片之外的文本净增长」，不再假设卡片是
//     兄弟项还是同项；计数前剔掉宿主占位符 `-`、流式光标 `▋` 等噪音，避免假阳。
//  3. **宁可迟停，不可谎报**：判不出来就不动（最多到寿命上限整行退休）。因为前台
//     **不再显示任何秒数**，结构上不可能再出现「等待 0s」这类谎报。
//
// 成本对照（这次是真正归零的那部分）：等待期内 React 渲染次数 = 至多 2 次
// （越过软阈值追加一次提示、到上限退休一次），旧版是每秒重建整棵卡片 ≈10 节点/秒。

// 等待行的寿命上限（秒）。模块级常量 = 唯一口径：渲染、计时链、退休判定与文案
// 函数都用它，禁止在任一处再写死数字。
/** 等待提示阈值的内建默认（秒）。实时值来自生效配置的 wait_hint_sec；
 *  这个常量只在配置尚未解析时兜底，避免出现「读不到就 0 秒」的退化。 */
const WAIT_HINT_DEFAULT_SEC = 180;


// 阻塞阈值（秒）：越过它才在等待行追加「多为限流/报错 + 点右侧释放阻塞」的指引。
// 2026-10-22 用户裁定把 180 收紧到 20——真限流时等 3 分钟才提示等于没提示。
const WAIT_SOFT_SEC = 20;
// 后台轮询间隔（毫秒）。180s 窗口内最多 ~30 次判定，每次只读两个 textContent 长度。
const BG_POLL_MS = 6000;
// 单题用时提示阈值（毫秒）。用户 2026-10-22 裁定：每题独立 60s，切题/回题清零，
// 超时**只提示**（不强制跳题），且计时停在该值——因此无需每秒读秒，一个定时器足够。
/** Schema default for「题级计时提示」(seconds).  0 = 提示关闭.
 *  The live value comes from the effective config; this is only the fallback
 *  so the constant can never drift from SETTINGS_SCHEMA silently. */
const SLOW_Q_SEC_DEFAULT = 60;
const SLOW_Q_MS = SLOW_Q_SEC_DEFAULT * 1000;
// 「卡外文本净增长」多少字符才算模型真的产出了内容。取 8：短于一句话的开头，
// 又长到不会被「展开/收起」之类的按钮文案抖动误触发。
const RESUME_MIN_GROWTH = 8;

function _dom(): any {
  try {
    return typeof document !== "undefined" && document
      && typeof document.querySelectorAll === "function" ? document : null;
  } catch (_) { return null; }
}

// 宿主占位符与流式光标：这些出现时模型其实**还没有**产出可读内容，
// 计长度前一律剔除（16:33 现场取到的真实样本就是 `data-role="assistant"` + "-"）。
const _NOISE_RE = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;

function _meaningfulLen(s: any): number {
  try { return String(s || "").replace(_NOISE_RE, "").length; } catch (_) { return 0; }
}

/** 本卡**之外**的页面文本长度；返回 -1 = 定位不到本卡（未知 ≠ 已恢复）。
 *  用「整页 − 本卡」而不是「本卡之后的兄弟项」，就是为了对宿主怎么排 DOM
 *  不再做任何假设——那套假设已经被两次线上现象证伪了。 */
function externalTextLen(callId: string): number {
  const d = _dom();
  if (!d) return -1;
  let cardEl: any = null;
  try { cardEl = d.querySelector('[data-qm-card-id="' + callId + '"]'); }
  catch (_) { return -1; }
  if (!cardEl) return -1;
  let page = -1;
  try {
    page = _meaningfulLen((d.body || d.documentElement || {}).textContent);
  } catch (_) { return -1; }
  return page - _meaningfulLen(cardEl.textContent);
}

/** 等待行的**唯一文案真相源**（纯函数，无 hooks）。
 *  用户裁定 q0=「静」：等待期**全程一句固定文案、不显示秒数**，只有越过阻塞
 *  阈值才追加释放指引。后台判定到「模型已继续输出」时**只停自己的定时器、
 *  不改文案**（该行随即按寿命上限退休），因此不可能出现任何假阳/假阴的数字。
 *  phase: "waiting" 正常等待 | "stalled" 越过阻塞阈值 */
function waitPhaseText(phase: string): string {
  if (phase === "stalled") {
    return "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；"
      + "若发新消息报「A task is already running」，点右侧「释放阻塞」";
  }
  return "⏳ 已提交，模型处理中";
}

/** 卡片当前该不该显示等待行。返回 null = 不显示（失效卡 / 跳过卡 / 未提交 /
 *  用户已手动释放 / 后台计时已在寿命上限处退休 / 历史卡）。
 *  `observed` = 本实例真的在等这段（刚提交，或挂载仍在寿命窗口内的近期卡）。
 *  这一条必须有：前台不再读秒后，`elapsed` 已经不参与渲染，若不加闸门，一张
 *  十分钟前的历史卡会因为「submittedAt 存在且未退休」而显示「模型处理中」——
 *  那就是谎报（用户裁定 q1=分情况：历史卡不显示）。
 *  `retired` = 整行退休；它与「后台判定成功」无关——判定成功只停轮询、不改视图。 */
function waitLineFor(st: {
  submittedAt: number; deadReason: string; releasedNote: string;
  skippedAll: boolean; retired: boolean; pastSoft: boolean; observed: boolean;
}): { phase: string } | null {
  if (!st.submittedAt || st.deadReason || st.skippedAll) return null;
  if (!st.observed) return null;
  // 用户手动释放过 → 让位给释放说明（releasedNote 本身渲染在同一个槽位）。
  if (st.releasedNote) return null;
  if (st.retired) return null;
  return { phase: st.pastSoft ? "stalled" : "waiting" };
}

/** 把一次判定排在浏览器空闲时段跑，避免与流式渲染抢主线程（用户要求「计时不许
 *  影响模型继续输出」的落点）。**节奏由外层 setTimeout(BG_POLL_MS) 保证**，这里
 *  只决定"这一次在什么时候执行"，所以没有 requestIdleCallback 时立即执行即可
 *  ——若在这里再补一个 BG_POLL_MS，轮询周期会莫名翻倍（harness 无 rIC 即中招）。 */
function whenIdle(fn: () => void): void {
  try {
    const w: any = typeof window !== "undefined" ? window : null;
    if (w && typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(fn, { timeout: BG_POLL_MS });
      return;
    }
  } catch (_) { /* fall through */ }
  try { setTimeout(fn, 0); } catch (_) { /* ignore */ }
}

// ══════════════════════════════════════════════════════════════════
// AI analysis — model capsules, preferences, markdown
// ══════════════════════════════════════════════════════════════════

/** Analysis preferences.
 *
 *  These are **global**, not per card.  Keying them by tool-call id (the old
 *  behaviour) made every new survey start from the defaults, so the capsule's
 *  model selection appeared to "reset" on each question_modal call — a new
 *  call always means a new tool_call_id.
 *
 *  Disk (`analysis_prefs.json`, via GET/POST /question-modal/prefs) is the
 *  single source of truth so the choice is identical across browsers, agents
 *  and plugin restarts.  localStorage is only an instant mirror: it lets a
 *  card paint the right capsule before the GET lands, and keeps things working
 *  if the backend is unreachable.
 */
const AN_PREF_KEY = "qm:v1:analysis:global";
const AN_PREF_PREFIX = "qm:v1:analysis:";

/** How a survey card is driven.
 *
 *  - ``ai``        — analyse the question on screen with a model call, then
 *                    auto-fill → advance → auto-submit (the original #4 flow).
 *  - ``recommend`` — consume the recommendation that the MODEL already attached
 *                    when it authored the question (``recommended``), falling
 *                    back to a previously cached analysis.  **Never fires a
 *                    model call**, and drives the same fill → advance → submit
 *                    loop.  Questions with no recommendation are skipped.
 *  - ``manual``    — the user answers by hand.
 */
type AnMode = "ai" | "recommend" | "manual";

interface AnalysisPrefs {
  mode: AnMode;                 // three-way driving mode (see AnMode)
  modelId: string;              // "<provider>:<model>" capsule selection
  withContext: boolean;         // use previous decision + session history
  parallel: boolean;            // per-question calls in parallel vs. serial
}

const AN_PREF_DEFAULTS: AnalysisPrefs = {
  mode: "manual",
  modelId: "",
  withContext: false,
  parallel: false,
};

/** Coerce an arbitrary value into a driving mode.  Single place that decides
 *  what a legal mode is — the schema validator on the server agrees with it. */
function normMode(v: any): AnMode {
  return v === "ai" || v === "recommend" ? v : "manual";
}

function normPrefs(v: any): AnalysisPrefs {
  if (!v || typeof v !== "object") return { ...AN_PREF_DEFAULTS };
  // Backend spells the fields `model_id` / `with_context`; the localStorage
  // mirror keeps camelCase.  Accept both so either side can seed a card.
  const mid = v.modelId !== undefined ? v.modelId : v.model_id;
  const wc = v.withContext !== undefined ? v.withContext : v.with_context;
  return {
    // Three-way mode.  Anything unrecognised (including legacy payloads that
    // only ever wrote "ai"/"manual") degrades to "manual" — the safe default
    // that never drives the form on its own.
    mode: v.mode === "ai" || v.mode === "recommend" ? v.mode : "manual",
    modelId: typeof mid === "string" ? mid : "",
    withContext: !!wc,
    parallel: !!v.parallel,
  };
}

/** Instant read of the localStorage mirror (never blocks the first paint). */
function loadAnalysisPrefs(): AnalysisPrefs {
  try {
    const raw = localStorage.getItem(AN_PREF_KEY);
    if (!raw) return { ...AN_PREF_DEFAULTS };
    return normPrefs(JSON.parse(raw));
  } catch (_) { return { ...AN_PREF_DEFAULTS }; }
}

function saveAnalysisPrefs(prefs: AnalysisPrefs): void {
  try {
    localStorage.setItem(AN_PREF_KEY, JSON.stringify(prefs));
  } catch (_) { /* best effort — quota / private mode */ }
}

/** Drop the legacy per-card prefs (`qm:v1:analysis:<tool_call_id>`).
 *
 *  Those were the source of the「模型胶囊每次被重置」report: a new tool_call_id
 *  never matched the old key.  Nothing reads them any more and nothing else
 *  sweeps them, so without this they would accumulate one entry per survey
 *  forever.
 */
function sweepLegacyPrefs(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(AN_PREF_PREFIX) === 0 && k !== AN_PREF_KEY) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch (_) { /* best effort */ }
}

/** Pull the authoritative prefs from disk; null when unreachable. */
async function fetchRemotePrefs(): Promise<AnalysisPrefs | null> {
  try {
    const resp = await fetch(apiUrl("/question-modal/prefs"), { headers: authHeaders() });
    if (!resp.ok) return null;
    const d = await resp.json();
    if (!d || !d.ok || !d.prefs) return null;
    return normPrefs(d.prefs);
  } catch (_) { return null; }
}

/** Push one patch to disk (fire-and-forget; the mirror is already updated). */
function pushRemotePrefs(patch: Partial<AnalysisPrefs>): void {
  const body = {
    mode: patch.mode,
    model_id: patch.modelId,
    with_context: patch.withContext,
    parallel: patch.parallel,
  };
  try {
    fetch(apiUrl("/question-modal/prefs"), {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    }).catch(() => { /* keep the localStorage mirror; retry on next change */ });
  } catch (_) { /* ignore */ }
}

/** Load the global prompt-template library (REQ-001/005).  Returns [] when the
 *  backend is unreachable — the card then simply keeps its built-in behaviour. */
async function fetchTemplates(): Promise<{ items: any[]; defaultId: string }> {
  try {
    const resp = await fetch(apiUrl("/question-modal/templates"), { headers: authHeaders() });
    if (!resp.ok) return { items: [], defaultId: "" };
    const d = await resp.json();
    const items = (d && Array.isArray(d.items)) ? d.items : [];
    return { items, defaultId: (d && d.default_id) || "" };
  } catch (_) { return { items: [], defaultId: "" }; }
}

/** Persist a session-level override for one key.
 *
 *  Fire-and-forget on purpose: the card switches its own mode immediately (the
 *  user asked for that click to take effect NOW, not after a round-trip), and
 *  the write only decides what the NEXT survey in this chat starts from.  A
 *  failed write is logged, not surfaced — it cannot corrupt the current card.
 */
// ── 阶段 1（2026-11-07 用户裁定）：后端是唯一真值，前端只渲染 + 发 action ──
//
// 为什么要换掉阶段 0 的做法：阶段 0 只是「上报 + 影子比对」，前端仍然是权威，
// 于是一份问卷在两个标签页里就有两份真相，靠 localStorage storage 事件互抄
// （用户看到的「在推荐和自动之间不停切换」）。用户裁定：state 权威整体后移。
//
// 现在三条通道各司其职：
//   ① GET  /survey-state    首帧快照（SSE 连上之前的窗口期靠它）
//   ② GET  /survey-stream   SSE 增量（连上后所有变化都由它推）
//   ③ POST /survey-action   前端动作 → 后端裁决 → 广播回所有标签页
//
// `origin` 字段是这套机制的关键：本页的操作会立刻收到自己的回声，如果无脑
// 用它覆盖本地 state，用户正在输入的文本会被旧值冲掉、光标跳到行首。所以
// 回声只同步 rev，别人的修改才覆盖本地。

/** 把用户动作发给后端裁决。返回后端的裁决结果（不抛错）。 */
async function postSurveyActionAsync(
  callId: string, action: string, payload: Record<string, any>,
): Promise<{ accepted: boolean; reason: string; state: any } | null> {
  if (!callId) return null;
  try {
    const resp = await fetch(apiUrl("/question-modal/survey-action"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        tool_call_id: callId, action, payload, origin: tabId(),
      }),
    });
    const d = await resp.json().catch(() => ({}));
    if (!resp.ok) return null;
    return {
      accepted: d.accepted !== false,
      reason: String(d.reason || ""),
      state: d.state || null,
    };
  } catch (_) {
    return null;        // 网络失败：调用方决定是否降级本地处理
  }
}

/** 读一次后端权威快照（SSE 连上之前的首帧）。 */
async function fetchSurveyState(
  callId: string,
): Promise<{ found: boolean; rev: number; state: any } | null> {
  if (!callId) return null;
  try {
    const resp = await fetch(
      apiUrl("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(callId)),
      { headers: authHeaders() },
    );
    if (!resp.ok) return null;
    const d = await resp.json().catch(() => ({}));
    if (!d || d.ok === false) return null;
    return {
      found: !!d.found,
      rev: parseInt(d.rev || 0, 10) || 0,
      state: d.state || null,
    };
  } catch (_) {
    return null;
  }
}

/**
 * 订阅后端 state 流。
 *
 * 为什么用 SSE 而不是轮询：多个标签页轮询会把请求量按标签数放大，而轮询
 * 间隔内的跳步对「自动推进」是肉眼可见的卡顿。SSE 让后端一写就推，每个
 * 标签页各自订阅、各自渲染同一份 state —— 这正是宿主 run 的做法。
 *
 * 断线自动重连（指数退避，上限 10s），并在重连时带上 `since_rev` 让后端
 * 只补发缺的事件；`unreachable` 回调用于让调用方降级到本地驱动。
 */
function openSurveyStream(
  callId: string,
  handlers: {
    onSnapshot: (rev: number, state: any) => void;
    onChange: (ev: any) => void;
    onStatus: (connected: boolean) => void;
  },
): () => void {
  if (!callId) return () => { /* nothing to close */ };
  let closed = false;
  let es: any = null;
  let retry = 0;
  let timer: any = null;
  let sinceRev = 0;
  // 已彻底放弃重连（后端不支持 SSE，例如旧版本只返回 404）。
  let gaveUp = false;
  // 连续网络失败计数（2026-11-13）：用于分档退避，见 NET_* 常量。
  // 成一次流即清零，所以正常运行不受影响。
  let netFails = 0;
  let firstNetFailAt = 0;
  // 上一次上报给调用方的连接状态。**必须去重**：重连循环里每次失败都调
  // onStatus(false)，若不去重，空闲期每几秒就 setState 一次 → 整卡反复重建
  // （实测：静置 60s 触发 336 次 createElement）。这是纯粹的浪费，
  // 而且会让「计时已停在阈值、不再渲染」这类性能契约失效。
  let lastStatus: boolean | null = null;
  const emitStatus = (connected: boolean) => {
    if (closed || lastStatus === connected) return;
    lastStatus = connected;
    handlers.onStatus(connected);
  };

  const connect = () => {
    if (closed) return;
    try {
      // EventSource 不能自定义 header（鉴权走 fetch 的 Bearer），所以这里
      // 用 fetch + ReadableStream 手动解析 SSE，与宿主前端一致。
      const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      const url = apiUrl("/question-modal/survey-stream")
        + "?tool_call_id=" + encodeURIComponent(callId)
        + "&since_rev=" + sinceRev;
      const opts: any = { headers: authHeaders() };
      if (ctrl) opts.signal = ctrl.signal;
      const closer = () => { try { ctrl && ctrl.abort(); } catch (_) { /* ignore */ } };
      es = closer;

      fetch(url, opts).then(async (resp) => {
        // ★ 反代/WAF 拦截识别（2026-11-13）。
        //
        // 被拦截时反代常返回 **200 + HTML**（登录页 / WAF 页 / 跳转页）。
        // 旧逻辑只看 resp.ok，于是把它当成"流已建立"→ 读完立刻重连 →
        // 实测 1 秒一次，比 502 更凶（12s 打 12 次）。必须判内容类型。
        const blocked = looksIntercepted(resp);
        if (!resp.ok || !resp.body || blocked) {
          // 后端明确不支持（404/501）→ SSE 只是增强通道，直接放弃重连，
          // 让调用方长期留在「降级到本地驱动」的确定状态。反复重试一个
          // 永远不存在的端点毫无意义，还会持续制造渲染。
          if (resp.status === 404 || resp.status === 501 || resp.status === 405) {
            gaveUp = true;
            emitStatus(false);
            return;
          }
          if (blocked) netFails += 1;   // 计入连续失败，交由 scheduleRetry 分档
          throw new Error(blocked ? "blocked" : ("HTTP " + resp.status));
        }
        retry = 0;
        netFails = 0;                 // 真建立了流 → 失败计数清零
        emitStatus(true);
        const reader = resp.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        const pump = () => {
          reader.read().then(({ done, value }: any) => {
            if (done) { scheduleRetry(); return; }
            buf += dec.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf("\n\n")) >= 0) {
              const chunk = buf.slice(0, idx);
              buf = buf.slice(idx + 2);
              chunk.split("\n").forEach((line: string) => {
                if (!line.startsWith("data: ")) return;
                let ev: any = null;
                try { ev = JSON.parse(line.slice(6)); } catch (_) { return; }
                if (!ev) return;
                if (ev.kind === "snapshot") {
                  sinceRev = Math.max(sinceRev, parseInt(ev.rev || 0, 10) || 0);
                  handlers.onSnapshot(sinceRev, ev.state || null);
                } else if (ev.kind === "change") {
                  sinceRev = Math.max(sinceRev, parseInt(ev.rev || 0, 10) || 0);
                  handlers.onChange(ev);
                }
                // kind === "ping" → 心跳，什么也不做
              });
            }
            if (!closed) pump();
          }).catch(() => { scheduleRetry(); });
        };
        pump();
      }).catch(() => { scheduleRetry(); });
    } catch (_) {
      scheduleRetry();
    }
  };

  const scheduleRetry = () => {
    if (closed || gaveUp) { return; }
    emitStatus(false);
    // 计入连续失败（只在"没拿到流"时才会走到这里）
    netFails += 1;
    if (!firstNetFailAt) firstNetFailAt = Date.now();

    // 与 resolve 探测同一套分档（用户裁定方案C）：
    //   前几次 → 指数退避（最长 10s，原手感）
    //   达阈值 → 60s 低频探活
    //   超 15 分钟 → 彻底停（SSE 只是增强通道，停了就永久走本地驱动）
    if (netFails >= NET_FAIL_BEFORE_SLOW) {
      const failingFor = Date.now() - (firstNetFailAt || Date.now());
      if (failingFor >= NET_GIVEUP_AFTER_MS) {
        // 明确放弃：调用方会收到 onStatus(false) 并长期降级到本地驱动，
        // 不再产生任何 SSE 请求。这是设计允许的确定状态。
        gaveUp = true;
        emitStatus(false);
        return;
      }
      timer = setTimeout(connect, NET_SLOW_PROBE_MS);
      return;
    }
    retry = Math.min(retry + 1, 6);
    const delay = Math.min(10000, 500 * Math.pow(2, retry));
    timer = setTimeout(connect, delay);
  };

  connect();
  return () => {
    closed = true;
    if (timer) { try { clearTimeout(timer); } catch (_) { /* ignore */ } }
    if (es) { try { es(); } catch (_) { /* ignore */ } }
    lastStatus = null;
    handlers.onStatus(false);
  };
}

async function pushSessionOverride(
  patch: Record<string, any>, sessionId: string, agentId: string,
): Promise<boolean> {
  try {
    const resp = await fetch(apiUrl("/question-modal/session-prefs"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        chat_id: "",              // server resolves session_id → chat UUID
        session_id: sessionId,
        agent_id: agentId,
        settings: patch,
        // 2026-11-13 方案 D1：卡片上的即时操作（切模型/上下文/并行/模式）
        // 语义就是"在本会话里应用这项设置"，必须显式声明会话模式。
        //
        // 不声明会踩坑：本会话若处于 default，写进去的值不会生效；
        // 旧代码只是"碰巧对"（靠后端「有记录无标记→视为 session」的兼容
        // 分支），一旦那条分支按严格判定收敛，这里就会变成"改了没反应"。
        set_scope: "session",
      }),
    });
    return resp.ok;
  } catch (_) {
    return false;
  }
}

// ── Effective settings (single read path) ──────────────────────────────
//
// The server owns the three-layer merge (defaults → global → session); the
// client must NOT re-implement it.  Two places read settings (a card, and the
// settings panel), so they share this one function.
//
// Caching rule: the cache is MEMORY-ONLY and short-lived, and every card mount
// re-fetches.  That is deliberate — the agreed behaviour is "a saved change
// applies to new surveys; the card already on screen keeps its values", so a
// long-lived client cache would be the only thing able to serve stale data.
type EffectiveConfig = {
  config: Record<string, any>;
  globalKeys: string[];
  version: number;
  schema: any[];
  /** 后端给的判定：本 chat 是否已存在会话覆盖条目（唯一权威，不前端推导）。
   *  对应「会话模式 vs 默认模式」徽章与自动切页签。 */
  has_session: boolean;
  /** 本会话各键的最后写入时间（后端 `__keyts__`）。
   *  2026-11-13（需求 2）：打开面板时记下，保存时作为 `seen` 发回，
   *  后端据此判断「这个键在我看过之后是否被别处改过」。 */
  keyTs: Record<string, number>;
  /** 会话层的**原始**覆盖值（只含本会话显式改过的键）。
   *  2026-11-13：页签数据分层读取，不再共用"当前生效值" —— 否则切到默认
   *  模式后会话页签会显示成全局数据，点保存才突然跳回会话值。 */
  sessionConfig?: Record<string, any>;
  /** 全局层的**原始**值（磁盘 analysis_prefs）。 */
  globalConfig?: Record<string, any>;
};

let _cfgCache: { chatId: string; at: number; data: EffectiveConfig } | null = null;
const CFG_CACHE_MS = 1500;   // just enough to collapse same-tick double reads

async function fetchEffectiveConfig(
  chatId: string, force?: boolean, sessionId?: string, agentId?: string,
): Promise<EffectiveConfig | null> {
  const key = chatId || "";
  const extra = "&session_id=" + encodeURIComponent(sessionId || "")
    + "&agent_id=" + encodeURIComponent(agentId || "");
  if (!force && _cfgCache && _cfgCache.chatId === key
      && (Date.now() - _cfgCache.at) < CFG_CACHE_MS) {
    return _cfgCache.data;
  }
  try {
    const url = apiUrl(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(key) + extra,
    );
    const resp = await fetch(url, { headers: authHeaders() });
    if (!resp.ok) return null;
    const d = await resp.json();
    if (!d || d.ok !== true) return null;
    const data: EffectiveConfig = {
      config: (d.config || {}) as Record<string, any>,
      globalKeys: Array.isArray(d.global_keys) ? d.global_keys : [],
      version: typeof d.version === "number" ? d.version : 0,
      schema: Array.isArray(d.schema) ? d.schema : [],
      has_session: d.has_session === true,
      keyTs: (d.key_ts && typeof d.key_ts === "object") ? d.key_ts : {},
      // 分层原始数据（2026-11-13）：缺失时回落 {}，cfgValue 再用老路径兜底，
      // 保证旧后端（不返回这两字段）也不会白屏。
      sessionConfig: (d.session_config && typeof d.session_config === "object")
        ? d.session_config : undefined,
      globalConfig: (d.global_config && typeof d.global_config === "object")
        ? d.global_config : undefined,
    };
    _cfgCache = { chatId: key, at: Date.now(), data };
    return data;
  } catch (_) {
    return null;   // caller falls back to its built-in defaults
  }
}

/** Forget the cache.  Called after a save so the NEXT card cannot read the
 *  pre-save snapshot, and by tests. */
function invalidateConfigCache(): void {
  _cfgCache = null;
}


/** Chats that carry a session-level override (read-only for now). */
async function fetchSessionPrefs(): Promise<{ items: any[]; count: number; ok: boolean }> {
  try {
    const resp = await fetch(apiUrl("/question-modal/session-prefs"), { headers: authHeaders() });
    if (!resp.ok) return { items: [], count: 0, ok: false };
    const d = await resp.json();
    const items = (d && Array.isArray(d.sessions)) ? d.sessions : [];
    return { items, count: (d && d.count) || items.length, ok: true };
  } catch (_) { return { items: [], count: 0, ok: false }; }
}

/** Create/update a custom template.  Resolves to {ok,error?,items?} so the
 *  caller can surface the REQ-006 contract-validation message verbatim. */
async function saveTemplate(tpl: any): Promise<any> {
  try {
    const resp = await fetch(apiUrl("/question-modal/templates"), {
      method: "POST", headers: authHeaders(), body: JSON.stringify(tpl),
    });
    const d = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: (d && d.error) || ("保存失败（" + resp.status + "）") };
    return { ok: true, items: (d && d.items) || [], saved: d && d.saved };
  } catch (e: any) {
    return { ok: false, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}

/** Delete a custom template (built-ins are rejected server-side, REQ-003). */
async function deleteTemplate(id: string): Promise<any> {
  try {
    const resp = await fetch(apiUrl("/question-modal/templates/" + encodeURIComponent(id)), {
      method: "DELETE", headers: authHeaders(),
    });
    const d = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: (d && d.error) || ("删除失败（" + resp.status + "）") };
    return { ok: true, items: (d && d.items) || [] };
  } catch (e: any) {
    return { ok: false, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}

/** Model list for the capsule picker, from the host's own /models endpoint.
 *  Shape mirrors what prompt-forge consumes: ProviderInfo[] with
 *  models/extra_models, each ModelInfo carrying {id, name, is_free}. */
async function fetchProviders(): Promise<any[]> {
  try {
    const resp = await fetch(apiUrl("/models"), { headers: authHeaders() });
    if (!resp.ok) return [];
    const data = await resp.json();
    const list = Array.isArray(data) ? data : [];
    return list.filter((p: any) => {
      const models = [...(p.models || []), ...(p.extra_models || [])];
      const hasModels = models.length > 0;
      const active = !!p.api_key || p.require_api_key === false
        || p.is_local || p.is_custom;
      return hasModels && active;
    });
  } catch (_) { return []; }
}

/** Current active model, so a fresh card can pre-select something sensible. */
async function fetchActiveModel(): Promise<{ provider_id?: string; model?: string }> {
  try {
    const resp = await fetch(apiUrl("/models/active"), { headers: authHeaders() });
    if (!resp.ok) return {};
    const data = await resp.json();
    return data?.active_llm || {};
  } catch (_) { return {}; }
}

/** Render markdown to HTML.  `marked` is bundled (the host exposes no
 *  markdown component to plugins).  Output is escaped-then-formatted by
 *  marked's own defaults; we never feed it untrusted raw HTML. */
function renderMarkdown(md: string): string {
  if (!md) return "";
  try {
    return String(marked.parse(md, { async: false, breaks: true }));
  } catch (_) {
    // Never let a render error hide the analysis — fall back to a <pre>.
    return "<pre style='white-space:pre-wrap'>"
      + md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      + "</pre>";
  }
}

function toast(kind: string, text: string): void {
  try {
    const m = antdLib().message;
    if (m && typeof m[kind] === "function") { m[kind](text); return; }
  } catch (_) { /* ignore */ }
  console.log("[question-modal]", kind, text);
}

// ── Types ──────────────────────────────────────────────────────────
// An option is either a plain string ("苹果") or an object with an explicit
// label/value pair — both shapes are accepted, no caller adaptation needed.
type OptDef = string | { label: string; value?: string };

interface QDef {
  /** Optional: the model often omits it (it is optional in the tool schema)
   *  while still sending `options`.  Always read it through `qType()`. */
  type?: "single" | "multi" | "text";
  title: string;
  options?: OptDef[];
  /** Hint used when `type` is omitted: true = pick several. */
  multiple?: boolean;
  /** Conditional visibility, e.g. { "q0": ["用 pm 设计器做表单"] }.
   *  Keys may be an index ("q0") or a question title; several keys = AND,
   *  several values on one key = OR.  Reference to a hidden/unknown
   *  question is treated as satisfied, so nothing hides by accident. */
  showIf?: Record<string, string | string[]>;
}
interface QA { type: string; value: string | string[]; other: string; skipped?: boolean;
  /** Why it was skipped.  `"no_recommend"` = the unattended driver skipped it
   *  because neither the question nor a cached analysis offered a choice.
   *  `"requires_human"` = the driver skipped an observation-only question
   *  (user decision 2026-11-07): only a real person can report what they saw,
   *  so the model must not fabricate an answer.
   *  Absent = the user clicked「跳过本题」.  Kept apart so the回传 can tell
   *  「用户主动跳过」from「自动跳过」— they used to look identical. */
  skipped_by?: "no_recommend" | "requires_human" | "user";
  /** Files the user attached under this question's「其他」box.  Each entry is
   *  what `/api/console/upload` returned: {url, file_name, size}. */
  attachments?: Attachment[]; }
/** One uploaded file, exactly as the host's upload endpoint reports it. */
interface Attachment { url: string; file_name: string; size?: number; }
interface PendingItem {
  request_id: string; session_id: string; title: string;
  questions: QDef[]; status: string;
}

const OTHER = "__other__";

// ══════════════════════════════════════════════════════════════════
// Condition evaluation for `showIf`
//
// Lenient by design: the agent writes questions in whatever natural shape
// it likes and this layer adapts.  Accepted key/value forms:
//   keys   : "q2" (index) | "打印页面要新建能力吗" (title)
//   values : "选项文字" | "=选项文字" (exact) | 任意数组 (= OR)
//   options: ["A","B"] | [{label, value}]
// ══════════════════════════════════════════════════════════════════

/** The value recorded for an option (defaults to its own label). */
function optValue(o: OptDef): string {
  if (o && typeof o === "object") return String((o as any).value ?? (o as any).label ?? "");
  return String(o);
}

/** Does a single answer entry carry *anything* the user (or a driver) put in?
 *  Covers chosen options, free text, attachments and an explicit skip — all of
 *  which count as "this question was touched".  An entry that is none of those
 *  is the pristine `useState` initializer, i.e. untouched.  Shared by the
 *  submit-time localStorage reconcile and the empty-answer gate so they can
 *  never disagree about what "answered" means. */
function filledAnswer(a: any): boolean {
  if (!a) return false;
  if (a.skipped === true) return true;
  if (Array.isArray(a.value)) return a.value.length > 0;
  if (String(a.value ?? "").trim()) return true;
  if (String(a.other ?? "").trim()) return true;
  if (a.attachments && a.attachments.length) return true;
  return false;
}

/** Reconcile a live `answers` map against the durable localStorage copy.
 *
 *  Root cause this guards against: the host re-mounts a card with a NEW React
 *  key (virtual-list scroll / input+output merge), so the fresh instance's
 *  in-memory `answers` starts from the pristine initializer and never receives
 *  the click the user made on the outgoing instance.  Submitting straight from
 *  that instance ships an all-empty survey the model reads as「用户跳过」— the
 *  reported bug.  Worse, the stale instance's persist effect then writes its
 *  empty answers over the sibling's good copy, silently destroying the choice
 *  the user saw ticked ✓.
 *
 *  Policy — the `touched` set is what makes this safe:
 *    • a key THIS instance has never written  → adopt the persisted entry when
 *      it is filled (a sibling recorded the real interaction; this instance
 *      simply has no information for the key);
 *    • a key this instance HAS written        → live always wins, so a
 *      deliberate deselect / clear is never resurrected from storage. */
function reconcileWithPersisted(
  live: Record<string, QA>, persistedRaw: any, touched?: Set<string>,
): Record<string, QA> {
  const out: Record<string, QA> = { ...live };
  if (!persistedRaw || typeof persistedRaw !== "object") return out;
  Object.keys(persistedRaw).forEach((k) => {
    if (touched && touched.has(k)) return;   // edited here → we know best
    // Only adopt into a key this instance actually HAS (as an empty entry).
    // Keys deliberately deleted here (showIf re-hiding after a new selection)
    // must NOT be resurrected from storage — that would submit answers for
    // questions the current flow no longer even shows.
    if (!Object.prototype.hasOwnProperty.call(out, k)) return;
    const p = persistedRaw[k];
    if (!p || typeof p !== "object") return;
    if (!filledAnswer(out[k]) && filledAnswer(p)) out[k] = { ...p };
  });
  return out;
}

/** Recommended option values for a question, as the MODEL declared them.
 *
 *  The model marks its recommendation while *authoring* the questionnaire via
 *  the optional `recommended` field (a string for single/text, an array for
 *  multi).  This is deliberately a QUESTION-level field, never a property of
 *  `options`: the backend joins options with `'、'.join(options)`, so turning
 *  an option into an object would raise TypeError and fail the whole call.
 *
 *  Tolerant by design — accepts a single string, an array, or the
 *  single-element shorthand, and matches both option labels and values.
 */
function questionRecommended(q: any): string[] {
  if (!q || typeof q !== "object") return [];
  const raw = (q as any).recommended !== undefined
    ? (q as any).recommended
    : (q as any).ai_recommended;      // tolerated alias
  if (raw === undefined || raw === null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map((x: any) => String(x === undefined || x === null ? "" : x).trim())
    .filter((s: string) => s.length > 0);
}

/** Pick the cached analysis choice that belongs to ONE question.
 *
 *  ★ 为什么不能简单地取 `per_question[0]`：缓存是按【可见位置】索引的
 *  （`qResultsRef[visStep]`），而 `per_question[i].index` 是【真实题号】。
 *  一旦问卷含 `showIf` 隐藏题，可见列表被收窄，两个编号空间就错位 ——
 *  取 `[0]` 会把别的题的结论填到当前题上。
 *
 *  真机复现（2026-11-05）：3 题（单选/单选/问答）切「自动分析」后提交体是
 *  `q0="乙" q1="丁" q2="乙"`，问答题被填成第一题的选项值。
 *
 *  匹配规则：
 *    ① 优先按真实题号精确匹配 `p.index === realIdx`；
 *    ② 长度恰为 1 时允许取那一条 —— 题级分析（`question_index` 有值）后端
 *       只返回一题，此时它就是本题；
 *    ③ 其余情况**返回空**：宁可不用缓存（该题按未作答/跳过处理），
 *       也绝不填错。填错比填空更难被发现。
 */
function choiceForQuestion(envelope: any, realIdx: number): string {
  if (!envelope || typeof envelope !== "object") return "";
  const per = Array.isArray(envelope.per_question) ? envelope.per_question : [];
  if (!per.length) return "";
  const mine = per.find((p: any) => Number(p && p.index) === Number(realIdx))
    || (per.length === 1 ? per[0] : null);
  if (!mine) return "";
  return String(mine.choice === undefined || mine.choice === null ? "" : mine.choice).trim();
}

/** True when `opt` is (one of) the model-declared recommendation(s).
 *
 *  #1: matching is deliberately tolerant.  A model that meant to mark an
 *  option can miss by whitespace, by wrapping the option in markdown emphasis
 *  (`**全部**`), by appending a trailing explanation, or by quoting only the
 *  leading clause of a long prose option.  Any of those silently dropped the
 *  badge — the reported「某些情况下没有出现 AI 推荐标记」.  So besides the exact
 *  and prefix-stripped forms we also accept:
 *    • equal after stripping markdown emphasis / surrounding quotes / spaces;
 *    • one is a substring of the other (min length guard so tiny shared tokens
 *      like「是」never cause a false badge).
 */
function isRecommendedOption(q: any, opt: OptDef, recs: string[]): boolean {
  if (!recs.length) return false;
  const canon = (s: string) => String(s || "")
    .replace(/^\s*推荐\s*[·:：\-]\s*/, "")   // 「推荐 · 乙」前缀
    .replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "")  // markdown 强调 / 引号
    .replace(/\s+/g, "")
    .trim();
  const val = optValue(opt);
  const lab = optLabel(opt);
  const cVal = canon(val);
  const cLab = canon(lab);
  return recs.some((r) => {
    const cR = canon(r);
    if (!cR) return false;
    if (r === val || r === lab) return true;          // exact (fast path)
    if (cR === cVal || cR === cLab) return true;       // normalised equal
    // substring fallback — guard against trivial 1-char overlaps.
    const min = Math.min(cR.length, cVal.length, cLab.length);
    if (min >= 4) {
      if (cR.length >= 4 && (cVal.includes(cR) || cR.includes(cVal))) return true;
      if (cR.length >= 4 && (cLab.includes(cR) || cR.includes(cLab))) return true;
    }
    return false;
  });
}

/** Resolve a question's type, tolerating an omitted `type` field.
 *
 *  The model regularly calls the tool without `type` (optional in the schema)
 *  while still sending `options`.  Mirroring the backend's `infer_qtype`, so
 *  the card and the analyser can never classify the same question differently:
 *  options present → choice question (`multi` when `multiple` is set, else
 *  `single`); no options → free text. */
function qType(q: QDef | null | undefined): "single" | "multi" | "text" {
  const declared = q && (q as any).type;
  if (declared === "single" || declared === "multi" || declared === "text") return declared;
  if (q && (q.options || []).length) return (q as any).multiple === true ? "multi" : "single";
  return "text";
}

/** Question stem with a positional fallback.
 *
 *  模型确实会**漏写题干**（实测：一份 6 题问卷的 q4/q5 只有 options，连 `title`
 *  键都不存在）。此前渲染直接用 `q.title` → undefined → 卡片上只剩一排选项而没有
 *  题目，即用户报的「部分题目缺失题干」。后端 `_build_summary` 早有 `Q{i+1}` 兜底
 *  （那个兜底的存在本身说明这是已知复发问题），前端却没有。
 *  用户裁定 2026-10-23：兜底文案用「第 N 题」。
 *
 *  只影响**显示**：答案键是位置式 `q${index}`，回传数据与推荐匹配都不经过这里。
 */
/** Module-level flag for the「缺题干兜底」setting (c5).
 *
 *  qTitle() is called from the card AND from the read-only history views, some
 *  of which run outside the component (so they have no access to card state).
 *  A module-level switch is the only place that reaches all of them; the card
 *  sets it from the effective config on every render.
 *
 *  Default true = the historical behaviour (fallback to「第 N 题」).
 */
let _fallbackTitle = true;

function qTitle(q: QDef, i: number): string {
  const t = String((q && (q as any).title) || "").trim();
  if (t) return t;
  return _fallbackTitle ? "第 " + (i + 1) + " 题" : "";
}

/** The text shown for an option. */
function optLabel(o: OptDef): string {
  if (o && typeof o === "object") return String((o as any).label ?? (o as any).value ?? "");
  return String(o);
}

/** All chosen tokens of a question: values + labels, plus the raw text. */
function chosenTokens(q: QDef, ans: QA): Set<string> {
  const out = new Set<string>();
  const add = (x: any) => { if (x !== undefined && x !== null && x !== "") out.add(String(x)); };
  const optList = (q.options || []);
  if (qType(q) === "multi") {
    const vals = Array.isArray(ans.value) ? ans.value : [];
    vals.forEach((v) => {
      add(v);
      // map value -> label for tolerance
      const hit = optList.find((o) => optValue(o) === String(v));
      if (hit) add(optLabel(hit));
      if (String(v) === OTHER && ans.other) add(ans.other);
    });
  } else {
    add(ans.value);
    const hit = optList.find((o) => optValue(o) === String(ans.value));
    if (hit) add(optLabel(hit));
    if (String(ans.value) === OTHER && ans.other) add(ans.other);
  }
  return out;
}

function evalCondition(
  cond: string | string[],
  tokens: Set<string>,
): boolean {
  const wanted = Array.isArray(cond) ? cond : [cond];
  // OR across the values of a single key.
  return wanted.some((w) => {
    const s = String(w);
    if (s.startsWith("=")) return tokens.has(s.slice(1));
    if (tokens.has(s)) return true;
    // lenient substring match (both directions), for prose-style options
    for (const t of Array.from(tokens)) {
      if (t && (t.indexOf(s) !== -1 || s.indexOf(t) !== -1)) return true;
    }
    return false;
  });
}

/** Resolve a showIf key ("q0" | question title) to an index, else -1. */
function resolveKey(key: string, questions: QDef[]): number {
  const m = /^q(\d+)$/i.exec(key.trim());
  if (m) {
    const i = parseInt(m[1], 10);
    if (i >= 0 && i < questions.length) return i;
  }
  const byTitle = questions.findIndex((q) => (q.title || "").trim() === key.trim());
  return byTitle;
}

/** Is a question currently visible?  All keys must hold (AND). */
function isVisible(
  idx: number, questions: QDef[], answers: Record<string, QA>,
): boolean {
  const q = questions[idx];
  const cond = q && q.showIf;
  if (!cond || typeof cond !== "object" || !Object.keys(cond).length) return true;
  for (const key of Object.keys(cond)) {
    const ref = resolveKey(key, questions);
    if (ref < 0) continue;                 // unknown reference → don't hide
    const rq = questions[ref];
    if (!rq) continue;
    // If the prerequisite question is itself currently hidden, it was never
    // put to the user — so this condition can never be satisfied.  Hiding
    // must therefore cascade down the chain (L1 off ⇒ L2 hidden ⇒ L3 hidden).
    if (rq.showIf && !isVisible(ref, questions, answers)) return false;
    const ansRef = answers[`q${ref}`];
    if (!ansRef) return false;             // not answered yet → not satisfied
    if (!evalCondition((cond as any)[key], chosenTokens(rq, ansRef))) return false;
  }
  return true;
}

/** Indices of all currently visible questions, in order. */
function visibleIndices(
  questions: QDef[], answers: Record<string, QA>,
): number[] {
  const out: number[] = [];
  questions.forEach((_, i) => { if (isVisible(i, questions, answers)) out.push(i); });
  return out;
}

// ══════════════════════════════════════════════════════════════════
// Parser helpers for the host-provided message payload
// ══════════════════════════════════════════════════════════════════
function parseArgs(node: any): { title?: string; questions?: QDef[] } {
  try {
    const blocks = (node && node.content) || [];
    const raw = blocks[0] && blocks[0].data && blocks[0].data.arguments;
    if (!raw) return {};
    if (typeof raw === "string") return JSON.parse(raw);
    return raw;
  } catch (_) { return {}; }
}

/** Are this card's tool arguments COMPLETE yet?
 *
 *  The host announces a tool call before its arguments exist: the SSE stream
 *  opens with `arguments: ""` and then appends fragments, so the card is
 *  mounted while the JSON is still empty or half-written (`TOOL_CALL_END`
 *  finally delivers the whole string — see runtime/envelope.py, EventType.
 *  TOOL_CALL_START → TOOL_CALL_DELTA → TOOL_CALL_END).
 *
 *  Rendering that intermediate state produced the reported symptom: the card
 *  frame appeared instantly but showed a bogus degenerate page
 *  (「其他意见 1/1」) for however long the model took to stream its questions
 *  (3–10s on a large survey).  We instead show a loading skeleton until the
 *  payload is parseable AND carries its questions.
 *
 *  A genuinely question-less call is NOT a loading state — the middleware
 *  rejects it server-side, and a history card for one must still render — so
 *  this returns true for a parsed object whose `questions` key is present
 *  (even if empty).  Only an unparsable/absent payload counts as "not ready". */
function argsReady(args: { title?: string; questions?: QDef[] }): boolean {
  return Array.isArray(args.questions);
}

/** The tool-call id, used to address exactly this card's pending record. */
function toolCallId(node: any): string {
  try {
    const blocks = (node && node.content) || [];
    const d = blocks[0] && blocks[0].data;
    return (d && d.call_id) || "";
  } catch (_) { return ""; }
}

/** The tool result.  The host puts call and output in the SAME block's
 *  `data` (chat-vendor: FunctionCallOutput(call_id=block.id, output=...)),
 *  so read `content[0].data.output` — not `content[1]`. */
function toolOutputText(node: any): string {
  try {
    const blocks = (node && node.content) || [];
    const d = blocks[0] && blocks[0].data;
    const out = d && d.output;
    if (!out) return "";
    if (typeof out === "string") return out;
    if (Array.isArray(out)) {
      return out.map((b: any) => (b && (b.text || b.content)) || "").join("\n");
    }
    return String(out);
  } catch (_) { return ""; }
}

/** Detect the host's context-scroll pointer stub.
 *
 *  When a session grows, the host replaces old tool results with a short
 *  marker ("[scroll folded] old tool result content cleared; recover with
 *  recall_history(...)", see qwenpaw/agents/context/scroll/manager.py).
 *  That stub must never be rendered as if it were the survey's answer — the
 *  card looks up the real result through `/question-modal/result` instead. */
function isFoldStub(text: string): boolean {
  if (!text) return false;
  return /\[scroll folded\]/.test(text);
}

/** 从工具输出文本里抽出「跳过原因」。
 *
 *  后端现在会把原因写进结果文本（如「系统自动释放（自动推进看门狗）：自动推进
 *  300s 无进展…」），也可能只留旧版的「用户跳过了本次问卷。」。这里两种都认，
 *  并把系统来源与用户来源分开，卡片才不会把系统行为说成用户主动。
 *  只取结果区（末尾）的一行，避免题面/摘要里出现「跳过」字样被误抓。 */
function parseSkipReason(text: string): string {
  if (!text) return "";
  const lines = String(text).split("\n").map((l) => l.trim()).filter(Boolean);
  // 新的写实措辞：整行就是「来源：原因」
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(l)
        && !/^\{/.test(l) && !/^\s*"skipped"/.test(l) && l.length < 400) {
      return l.replace(/^【|】$/g, "").trim();
    }
  }
  // 兼容旧版裸 JSON 里的 reason（如 {"skipped": true, "reason": "timeout"}）
  const m = String(text).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  if (m && m[1] && m[1] !== "timeout") return m[1];
  return "";
}

/** Render a stored `/question-modal/result` payload as readable text.
 *
 *  Used when the inline tool output is unusable (folded into a pointer stub
 *  by the host) but the backend still remembers the answer.  Mirrors the
 *  backend's own「【用户提交的问卷答案】」layout so history cards read the
 *  same as freshly submitted ones. */
function formatStoredResult(questions: QDef[], item: any): string {
  if (!item) return "";
  if (item.kind === "skipped" && !item.answers) {
    const by = String(item.skipped_by || "");
    const reason = String(item.skip_reason || "").trim();
    const head = reason
      ? `${by === "watchdog" ? "系统自动释放" : by === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${reason}`
      : "已跳过本次问卷。";
    return head + "\n\n" + summarizeQuestions(questions);
  }
  const answers = (item && item.answers) || {};
  const lines: string[] = ["【用户提交的问卷答案】"];
  Object.keys(answers).forEach((key) => {
    const a = answers[key];
    if (!a || typeof a !== "object") return;
    const idx = resolveKey(key, questions);
    const q = idx >= 0 ? questions[idx] : null;
    const label = q
      ? (qType(q) === "single" ? "单选" : qType(q) === "multi" ? "多选" : "问答")
      : "问答";
    const head = q ? qTitle(q, idx) : key;
    let v = a.value;
    if (Array.isArray(v)) v = v.join("、");
    if (a.other) v = (v ? v + "、" : "") + a.other;
    if (a.skipped) {
      // D4：与后端摘要逐字一致（见只读视图处的同一说明）。
      const sb = String((a as any).skipped_by || "");
      const why = sb === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）"
        : sb === "no_recommend" ? "（AI 跳过：无可用推荐）"
        : "（用户跳过本题）";
      lines.push(`- ${key} [${label}] ${head}${why}`);
    } else {
      lines.push(`- ${key} [${label}] ${head}：${v === "" || v == null ? "（空）" : v}`);
    }
  });
  if (item.other) lines.push("", `其他意见：${item.other}`);
  return lines.join("\n");
}

/** Ask the backend which pending question belongs to this tool call.
 *
 *  Returns a discriminated result so the caller can tell apart the three
 *  cases that used to be conflated: still pending (`found`), genuinely gone
 *  (`absent`), gone *because the plugin was reloaded* (`orphan`), and we
 *  simply could not reach the backend (`error`).  Only the first two mean
 *  anything about the survey's liveness; an `error` must keep retrying. */
async function resolvePending(
  callId: string, sid: string,
): Promise<{ kind: "found" | "absent" | "orphan" | "error"; data?: PendingItem }> {
  try {
    const params = new URLSearchParams();
    if (callId) params.set("tool_call_id", callId);
    if (sid) params.set("session_id", sid);
    const resp = await fetch(apiUrl("/question-modal/resolve") + "?" + params.toString(),
      { headers: authHeaders() });
    if (!resp.ok) return { kind: "error" };
    const d = await resp.json();
    // The backend echoes the chat it bound the survey to — this is the only
    // trustworthy source for session/agent, since the host injects neither.
    if (d) cacheHostContext(d.session_id, d.agent_id);
    if (d && d.found) return { kind: "found", data: d };
    if (d && d.orphan) return { kind: "orphan" };
    return { kind: "absent" };
  } catch (_) { return { kind: "error" }; }
}

/** Was this tool call already answered/skipped? (survives page reload) */
async function fetchStoredResult(callId: string): Promise<any> {
  if (!callId) return null;
  try {
    const resp = await fetch(
      apiUrl("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(callId),
      { headers: authHeaders() });
    if (!resp.ok) return null;
    const d = await resp.json();
    return d && d.found ? d : null;
  } catch (_) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// Attachments
//
// The user asked to be able to drop a file into a survey's「其他」box (each
// question's, plus the final「其他意见」).  Rather than inventing a store we
// reuse the host's own upload endpoint — the very one the composer uses —
// so the size limit (`upload_max_size_mb`) and type handling are, by
// construction, identical to what the input box accepts.  The endpoint
// returns {url, file_name, size}; we send those through with the answer.
// ══════════════════════════════════════════════════════════════════

/** Upload one file via the host endpoint.
 *
 *  Returns a discriminated result instead of `Attachment | null` so the card
 *  can *show* why an upload failed (a transient toast was easy to miss and
 *  left "选了附件但没有附件" with no visible cause). */
async function uploadAttachment(file: File): Promise<
  { ok: true; att: Attachment } | { ok: false; error: string }
> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    // NOTE: no Content-Type header — the browser must set the multipart
    // boundary itself.  Auth headers only.
    const h = authHeaders();
    delete (h as any)["Content-Type"];
    const resp = await fetch(apiUrl("/console/upload"),
      { method: "POST", headers: h, body: fd });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      let msg = "HTTP " + resp.status;
      try { const j = JSON.parse(detail); if (j && j.detail) msg = j.detail; } catch (_) { /* raw */ }
      return { ok: false, error: `${file.name}: ${msg}` };
    }
    const d = await resp.json();
    if (!d || !d.url) return { ok: false, error: `${file.name}: 上传响应缺少 url` };
    return {
      ok: true,
      att: { url: String(d.url), file_name: String(d.file_name || file.name), size: d.size },
    };
  } catch (e: any) {
    return { ok: false, error: `${file.name}: ${(e && e.message) || e}` };
  }
}

// ══════════════════════════════════════════════════════════════════
// Upload plumbing — MODULE scope on purpose
//
// The card lives in the host's virtualised message list and is unmounted
// whenever it scrolls out of view.  Worse, opening the OS file chooser blurs
// the window, and closing it re-focuses, which makes the host re-fetch its
// messages (ui-vendor: refreshOnWindowFocus) and remount every card.
//
// A file <input> *owned by the card* therefore loses its `change` event: by
// the time the user picks a file, that element has been detached and
// React's root-level listener never sees the event — the upload is silently
// never sent (observed: no file ever reached the media directory).
//
// So the input, the in-flight bookkeeping and the hand-off are all kept at
// module scope, where they outlive any single mount.  Picked files are sent
// immediately; the resulting attachments are then either delivered to the
// live card or stashed for the next mount to pick up.
// ══════════════════════════════════════════════════════════════════

const STASH_LS_PREFIX = "qm:v1:stash_att:";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;      // sane browser-side guard

/** callId → deliver freshly uploaded attachments to the mounted card.
 *  Signature: (attachments, target, key, failures). */
const _attListeners = new Map<
  string,
  (atts: Attachment[], target: string, key: string, failed?: string[]) => void
>();
/** callId → setUploading, so a remount shows the spinner again. */
const _busyListeners = new Map<string, (busy: boolean) => void>();
/** What the currently-open file dialog belongs to. */
let _pendingPick: { callId: string; target: string; key: string } | null = null;
let _uploadBusy = 0;
let _fileInputEl: any = null;

function _notifyBusy(): void {
  const busy = _uploadBusy > 0;
  _busyListeners.forEach((fn) => { try { fn(busy); } catch (_) { /* ignore */ } });
}

/** The single, never-unmounted file input.  Created lazily and parked on
 *  `document.body` so nothing the card does can detach it. */
function getFileInput(): any {
  if (_fileInputEl) return _fileInputEl;
  if (typeof document === "undefined" || !document.createElement) return null;
  let inp: any = null;
  try { inp = document.createElement("input"); } catch (_) { return null; }
  if (!inp) return null;
  try {
    inp.type = "file";
    inp.multiple = true;
    inp.setAttribute("data-qm-file", "true");
    inp.style.display = "none";
  } catch (_) { /* ignore */ }
  inp.onchange = async (e: any) => {
    // Capture the File list FIRST — the element may be re-used before the
    // uploads settle, and `value` must be cleared so the same file can be
    // picked twice in a row.
    let files: File[] = [];
    try { files = Array.from((e && e.target && e.target.files) || []) as File[]; } catch (_) { files = []; }
    try { if (e && e.target) e.target.value = ""; } catch (_) { /* ignore */ }
    const pick = _pendingPick;
    _pendingPick = null;
    if (!pick || !files.length) return;
    await deliverPickedFiles(files, pick.callId, pick.target, pick.key);
  };
  try {
    const parent = document.body || (document as any).documentElement;
    if (parent && typeof parent.appendChild === "function") parent.appendChild(inp);
  } catch (_) { /* ignore */ }
  _fileInputEl = inp;
  return inp;
}

/** Open the OS file dialog on behalf of `callId`. */
function requestFilePick(callId: string, target: string, key: string): void {
  if (!callId) {
    // Same reason as in deliverPickedFiles: with no id the picked file could
    // never be routed back, so refuse up front rather than opening a dialog
    // whose result would be silently dropped.
    toast("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  _pendingPick = { callId, target, key };
  const inp = getFileInput();
  if (inp && typeof inp.click === "function") { try { inp.click(); return; } catch (_) { /* fall through */ } }
  // No clickable element (or click refused): drop the pending pick so a later
  // stray change event cannot deliver files to the wrong card.
  if (!inp) _pendingPick = null;
}

/** Upload every picked file, then route the results to the live card or to
 *  the stash (if the card is between mounts right now). */
async function deliverPickedFiles(
  files: File[], callId: string, target: string, key: string,
): Promise<void> {
  _uploadBusy += 1;
  _notifyBusy();
  const got: Attachment[] = [];
  const failed: string[] = [];
  try {
    for (const f of files) {
      if (f.size && f.size > MAX_UPLOAD_BYTES) {
        failed.push(`${f.name}: 文件过大（上限 ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB）`);
        continue;
      }
      const r = await uploadAttachment(f);
      if (r.ok) got.push(r.att);
      else failed.push(r.error);
    }
  } finally {
    _uploadBusy -= 1;
    _notifyBusy();
  }
  const fn = _attListeners.get(callId);
  if (got.length || failed.length) {
    const payload = target === "final" ? "final" : "q";
    if (!callId) {
      // Without a tool-call id there is no card to hand the files to and no
      // stash key the card would ever read back — the files would simply
      // vanish (the old behaviour).  Say so loudly instead: the user must
      // know the attachment was NOT attached.
      toast("error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。");
      return;
    }
    if (fn) {
      try { fn(got, payload, key, failed); } catch (_) { /* ignore */ }
    } else if (got.length) {
      // Card is unmounted right now — keep the attachments for its next mount.
      stashAttachments(callId, got, payload, key);
    }
  }
}

/** Park attachments until the card remounts and can consume them. */
function stashAttachments(
  callId: string, atts: Attachment[], target: string, key: string,
): void {
  if (!callId || !atts.length) return;
  try {
    const raw = localStorage.getItem(STASH_LS_PREFIX + callId);
    const cur = raw ? JSON.parse(raw) : [];
    const next = (Array.isArray(cur) ? cur : []).concat(
      atts.map((a) => ({ att: a, target, key })),
    );
    localStorage.setItem(STASH_LS_PREFIX + callId, JSON.stringify(next));
  } catch (_) { /* best effort */ }
}

/** Read (and clear) anything parked for this card. */
function takeStashedAttachments(callId: string): Array<{ att: Attachment; target: string; key: string }> {
  if (!callId) return [];
  try {
    const raw = localStorage.getItem(STASH_LS_PREFIX + callId);
    if (!raw) return [];
    localStorage.removeItem(STASH_LS_PREFIX + callId);
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch (_) { return []; }
}

/** Files from a paste event, mirroring the host's own logic:
 *  prefer clipboardData.files, then fall back to items with kind==="file". */
function pasteFiles(e: any): File[] {
  const dt = e && e.clipboardData;
  if (!dt) return [];
  let files: File[] = [];
  try { files = Array.from(dt.files || []) as File[]; } catch (_) { files = []; }
  if (!files.length) {
    try {
      files = Array.from(dt.items || [])
        .filter((it: any) => it && it.kind === "file")
        .map((it: any) => (it.getAsFile ? it.getAsFile() : null))
        .filter((x: any) => !!x) as File[];
    } catch (_) { files = []; }
  }
  return files;
}

/** Human-readable size (e.g. "1.2 MB"). */
function humanSize(n?: number): string {
  if (!n && n !== 0) return "";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

/** Release the *backend* block for this card's survey.
 *
 *  This is the fix for the worst failure mode found in the field: the card
 *  closed itself out (either because the record looked gone, or because the
 *  user pressed「释放本次问卷」) while the agent's Future was still parked, so
 *  the chat answered「A task is already running」forever.  Closing the card is
 *  a UI event; only the backend can unpark the agent.
 *
 *  Preference: /skip by request_id (releases exactly this survey), falling
 *  back to /cancel-session (releases every survey blocking the chat).  A
 *  network error is NOT a release — the caller decides what to do, so we
 *  report the outcome instead of pretending success. */
async function releaseBackend(
  callId: string, sessionId: string,
): Promise<{ ok: boolean; released: boolean; reason: string }> {
  const sid = sessionId || cardSessionId(callId);
  const stored = recallReqId(callId);
  const rid = stored && stored.request_id ? stored.request_id : "";

  if (rid) {
    try {
      const r = await fetch(apiUrl("/question-modal/skip"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ request_id: rid, session_id: sid || "" }),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        forgetReqId(callId);
        return {
          ok: true, released: true,
          reason: d && d.orphan ? "orphan" : "skipped",
        };
      }
      // 404 = the record is genuinely gone; nothing is left to release.
      // 403 = session mismatch, so fall through to the session-wide release.
      if (r.status === 404) {
        forgetReqId(callId);
        return { ok: true, released: false, reason: "gone" };
      }
    } catch (_) {
      return { ok: false, released: false, reason: "network" };
    }
  }

  if (sid) {
    try {
      const r = await fetch(
        apiUrl("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(sid),
        { method: "POST", headers: authHeaders() });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        const n = d && typeof d.cancelled === "number" ? d.cancelled : 0;
        forgetReqId(callId);
        // n === 0 is a *definitive* answer from the record owner: "no survey
        // of mine blocks this session".  Report it as ok/no-release so the
        // automatic paths converge (nothing left to wait for) — they must NOT
        // escalate to a run-cancelling host stop.  The user-initiated rescue
        // path reads the same signal and may escalate; see `rescue`.
        return { ok: true, released: n > 0, reason: n > 0 ? "cancelled" : "none" };
      }
      return { ok: false, released: false, reason: "http " + r.status };
    } catch (_) {
      // A network failure is NOT proof of release; keep the card alive.
      return { ok: false, released: false, reason: "network" };
    }
  }

  return { ok: false, released: false, reason: "no-handle" };
}

/** Last-resort release driven by the host, not by this plugin.
 *
 *  Used when no plugin-side record can be reached (cross-instance reload), so
 *  the chat would otherwise stay blocked forever.  /console/chat/stop cancels
 *  the run itself, which is exactly the escape hatch the user's manual "停止"
 *  button exercises; the host resolves the session id to a chat id for us.
 *
 *  Call this ONLY from an explicit user「释放本次问卷」click: it terminates the
 *  whole run, and the automatic convergence paths cannot distinguish "the
 *  service forgot this survey" from "the user is fine and this card merely
 *  lost its handle". */
async function hostStopFallback(
  sid: string,
): Promise<{ ok: boolean; released: boolean; reason: string }> {
  if (!sid) return { ok: false, released: false, reason: "no-handle" };
  try {
    const r = await fetch(
      apiUrl("/console/chat/stop") + "?chat_id=" + encodeURIComponent(sid),
      { method: "POST", headers: authHeaders() });
    if (!r.ok) return { ok: false, released: false, reason: "http " + r.status };
    const d = await r.json().catch(() => ({}));
    // stopped=true → a run really was cancelled, so the block is gone.
    // stopped=false → no run was active; either way nothing is blocking now.
    return {
      ok: true, released: !!d.stopped,
      reason: d && d.stopped ? "host-stop" : "gone",
    };
  } catch (_) {
    return { ok: false, released: false, reason: "network" };
  }
}

/** Last-resort lookup: ask for *any* pending survey.
 *
 *  Why this exists: the card is addressed by tool-call id, and the backend
 *  echoes session/agent only *after* a successful lookup.  But a card whose
 *  inline call id is missing (host payload shape) and whose host exposes no
 *  session id has literally nothing to query with — /resolve would be called
 *  with no parameters, always answer found:false, and the card would sit
 *  stuck until the rescue banner appeared.  That is exactly the field report.
 *
 *  So when the addressed lookup fails and there is no session handle, fall
 *  back to the global pending list.  If exactly one survey is pending, it can
 *  only be this one; with several we stay hands-off (never guess another
 *  card's survey) but still learn nothing harmful.  Returns null when the
 *  answer is ambiguous, so a wrong survey is never hijacked. */
async function resolveSolePending(): Promise<PendingItem | null> {
  try {
    const resp = await fetch(apiUrl("/question-modal/pending"),
      { headers: authHeaders() });
    if (!resp.ok) return null;
    const d = await resp.json();
    const items = (d && d.items) || [];
    if (!Array.isArray(items) || items.length !== 1) return null;
    const only = items[0];
    if (!only || !only.request_id) return null;
    const full = await fetch(
      apiUrl("/question-modal/resolve") + "?request_id="
        + encodeURIComponent(only.request_id),
      { headers: authHeaders() });
    if (!full.ok) return null;
    const r = await full.json();
    if (r) cacheHostContext(r.session_id, r.agent_id);
    return r && r.found ? r : null;
  } catch (_) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// request_id persistence (localStorage)
//
// Why this exists: the card addresses the backend with a request_id that it
// only ever learns from /resolve.  If that lookup fails (transient network
// error, backend restart, timing), the id is lost for the whole page
// lifetime — submit/skip then stall at「问卷尚未就绪」and, since the survey
// blocks with **no timeout** by design, the agent stays parked forever.
// The host then answers every new message in that chat with
//   409 {"detail":"A task is already running for this chat..."}
// i.e. one broken panel locks the entire conversation.
//
// So every successfully-resolved id is mirrored into localStorage keyed by
// the tool-call id, and re-validated on the next mount: we only trust a
// stored id once /resolve confirms it is still pending AND belongs to this
// exact tool call; a stale/foreign id is dropped and re-resolved.
// ══════════════════════════════════════════════════════════════════

const REQID_LS_PREFIX = "qm:v1:reqid:";
/** How long to tolerate "no request_id" before offering self-rescue. */
const STUCK_AFTER_MS = 30000;
// How long a card keeps probing before concluding the survey is gone.  A
// never-seen record may still be racing the backend's create() call, so it
// gets this grace period; a record we *had* and lost converges immediately.
// Kept comfortably above STUCK_AFTER_MS so the「释放本次问卷」button is on
// screen long enough for the user to actually press it.
const GONE_AFTER_MS = 45000;

// ══════════════════════════════════════════════════════════════════
// 后台轮询的网络退避（2026-11-13 用户报障：域名访问被拦截）
//
// 故障：经域名 + 反代访问时，两条循环永不停止 ——
//   · resolve 探测：前 8 次 700ms，之后**每 5 秒一次、永远**
//   · SSE 重连：失败后最长 10 秒一次重试，同样没有终点
// 实测 70 秒打了 36 次（无休止迹象），外推 1 小时约 1100 次。
// 这足以让 WAF/CDN 判定为异常流量并升级封禁，于是「越打越封、越封越打」，
// 最终整个站点无法访问 —— 而局域网直连没有中间层，所以只有域名场景炸。
//
// 修复（用户 2026-11-13 问卷裁定 = 方案C）：
//   阶段1 SLOW：连续失败达阈值 → 转「分钟级低频探活」（保留自愈能力）
//   阶段2 STOP：持续失败超过更长时间 → 彻底停（不再产生任何请求）
// 保留自愈是硬要求：直接删掉会重演「问卷卡死、会话 409 永久锁死」的历史事故。
const NET_FAIL_BEFORE_SLOW = 6;          // 连续失败多少次后转低频
const NET_SLOW_PROBE_MS = 60000;         // 低频探活周期：60 秒一次（用户裁定"1分钟量级"）
const NET_GIVEUP_AFTER_MS = 15 * 60000;  // 持续失败超过 15 分钟 → 彻底停止
const NET_FAST_RETRY_MS = 700;           // 前几次快速重试（保持原手感）
const NET_MAX_FAST_TRIES = 8;

/** 反代/WAF 拦截的特征识别（用户裁定 q2：命中即降级为静默）。
 *
 *  为什么必须识别：被拦截时反代往往**返回 200 但内容是 HTML**（登录页、
 *  WAF 拦截页、跳转页）。只看 `resp.ok` 会把它当成"流已建立"，于是读完
 *  立刻重连 —— 实测该场景 SSE 是 **1 秒一次**，比 502 更凶（12s 内 12 次）。
 */
function looksIntercepted(resp: any): boolean {
  try {
    const ct = String((resp.headers && resp.headers.get
      ? resp.headers.get("content-type") : "") || "").toLowerCase();
    if (ct.indexOf("text/html") >= 0) return true;
    // 限流/风控类状态码，一律按"被拦截"处理
    const st = Number(resp.status || 0);
    if (st === 429 || st === 403 || st === 407 || st === 451) return true;
    return false;
  } catch (_) { return false; }
}

/** 分类一次请求结果，供两条循环统一决定退避节奏。 */
type NetVerdict = "ok" | "blocked" | "fail";
function netVerdict(resp: any): NetVerdict {
  try {
    if (!resp) return "fail";
    if (looksIntercepted(resp)) return "blocked";
    if (!resp.ok) return "fail";
    return "ok";
  } catch (_) { return "fail"; }
}

function forgetReqId(callId: string): void {
  if (!callId) return;
  try { localStorage.removeItem(REQID_LS_PREFIX + callId); } catch (_) { /* ignore */ }
}

/** Bound what we leave behind: an answered survey must not linger in the
 *  browser forever.  Sweeps stale entries on each write (cheap — the key
 *  space is one per tool call). */
function sweepStoredReqIds(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(REQID_LS_PREFIX) === 0) keys.push(k);
    }
    // Anything older than a week cannot still be blocking a chat: the agent
    // run behind it would have been stopped or the page long since closed.
    const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
    const fresh: string[] = [];
    keys.forEach((k) => {
      let v: any = null;
      try { v = JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { v = null; }
      if (!v || !v.request_id || !v.ts || Date.now() - v.ts > MAX_AGE_MS) localStorage.removeItem(k);
      else fresh.push(k);
    });
    // Hard cap, oldest first, if something is generating calls abnormally.
    const MAX_ENTRIES = 50;
    if (fresh.length <= MAX_ENTRIES) return;
    fresh
      .map((k) => ({ k, ts: (JSON.parse(localStorage.getItem(k) || "{}") || {}).ts || 0 }))
      .sort((a, b) => a.ts - b.ts)
      .slice(0, fresh.length - MAX_ENTRIES)
      .forEach((x) => localStorage.removeItem(x.k));
  } catch (_) { /* best effort */ }
}

function rememberReqId(
  callId: string, requestId: string, sessionId: string, agentId?: string,
): void {
  if (!callId || !requestId) return;
  try {
    localStorage.setItem(REQID_LS_PREFIX + callId, JSON.stringify({
      request_id: requestId,
      session_id: sessionId || "",
      agent_id: agentId || "",
      tool_call_id: callId,
      ts: Date.now(),
    }));
    sweepStoredReqIds();
  } catch (_) {
    // private mode / quota exceeded — persistence is best-effort only; the
    // card still works via the live /resolve lookup.
  }
}

/** Read a stored id, dropping anything that does not belong to this call. */
function recallReqId(callId: string): any {
  if (!callId) return null;
  try {
    const raw = localStorage.getItem(REQID_LS_PREFIX + callId);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || !v.request_id || v.tool_call_id !== callId) {
      forgetReqId(callId);
      return null;
    }
    return v;
  } catch (_) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// Card-state persistence (localStorage)
//
// Why this exists: every bit of the card's own progress lived in React
// state only (visStep / answers / finalOther / expanded / answered /
// skippedAll).  The host renders messages in a VIRTUALISED list, so a card
// that scrolls out of view is unmounted and, when it comes back, remounted
// with brand-new state.  The user's half-filled survey then snapped back to
// question 1 with every choice wiped — reported as「只勾了一题没提交，过一会
// 又被打回问卷」and「答完了又发一次问卷」(the answered flag resetting when the
// inline tool output had been folded into a pointer stub).
//
// So the whole interaction state is mirrored into localStorage keyed by the
// tool-call id (a card's stable identity) and restored on mount.  Writes are
// debounced by the caller; reads are best-effort (private mode → no store).
// ══════════════════════════════════════════════════════════════════

const STATE_LS_PREFIX = "qm:v1:state:";

/** Read the persisted interaction state for this card (or null). */
function loadCardState(callId: string): any {
  if (!callId) return null;
  try {
    const raw = localStorage.getItem(STATE_LS_PREFIX + callId);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    return v;
  } catch (_) { return null; }
}

// ══════════════════════════════════════════════════════════════════
// 多标签页协调（FIX-2，2026-11-05）
//
// 问题现场：同一会话在两个标签页打开 → 两个卡片实例共用同一条
// `qm:v1:state:<call_id>` 记录，各自的全量写回互相覆盖；同时两边都在执行
// 自动推进（effect 循环），于是都在 setAnswers、都在 submit → 用户看到的是
// 「问卷在推荐和自动之间不停切换」。实测证据：A 选「甲」→ B 改「乙」→
// A 回前台看到的是「乙」。
//
// 三层解法：
//   ① 每次写入带 `origin`（本标签页 id）→ 收到 storage 事件时能识别「是我
//      自己写的」，绝不回写（否则两标签页乒乓）。
//   ② 自动推进用 localStorage 租约独占：同一 call_id 只有一个标签页驱动，
//      其余的退化为只读视图（用户裁定 q1=甲）。
//   ③ 可见性变化 / 收到别处配置写入时重读 `/effective-config`，让本页跟上
//      最新的 mode（此前只在挂载时读一次，另一页改了模式本页不知道）。
// ══════════════════════════════════════════════════════════════════

/** 本标签页的随机标识。sessionStorage 保证「每个标签页一份、刷新不变」——
 *  用 localStorage 会让所有标签页共用一个 id，就失去了区分能力。 */
function tabId(): string {
  try {
    let v = sessionStorage.getItem("qm:v1:tab");
    if (!v) {
      v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem("qm:v1:tab", v);
    }
    return v;
  } catch (_) {
    return "tab-anon";     // sessionStorage 不可用 → 退化为单标签语义
  }
}
const MY_TAB = tabId();

/** 其它页面写入了本卡的会话偏好（不是本页写的）时触发一次重读。 */
const SESSION_PREFS_KEY = "qm:v1:sessionprefs-ping";

// ── 阶段 1（2026-11-07）：驱动租约整段删除 ──────────────────────────
//
// 旧方案用一个 localStorage 租约在同一份问卷的多个标签页之间选「唯一驱动者」，
// 抢不到的降级成只读视图。用户裁定它是治标而非治本：
//   「根本在于当前是基于前端推进，而不是后端推进……因为同时开同一个会话导致
//     竞争的情况，应该是基于后端运行的同一个结果，而不是前端 2 者都在抢占」
//
// 现在后端持有唯一 state，前端操作走 POST /survey-action 由后端幂等裁决，
// 所以不需要互斥，也不需要 TTL / 续租 / 崩溃接管这一整套脚手架。

/** Merge a partial state into the persisted entry for this card.
 *
 *  `origin` 记录是哪个标签页写的。跨标签页的 storage 事件处理用它识别
 *  「这是我自己的写入」并跳过——不回写是对抗来回覆盖（乒乓）的关键。 */
function mergeCardState(callId: string, patch: Record<string, any>): void {
  if (!callId) return;
  try {
    const cur = loadCardState(callId) || {};
    const next = { ...cur, ...patch, ts: Date.now(), origin: MY_TAB };
    localStorage.setItem(STATE_LS_PREFIX + callId, JSON.stringify(next));
    sweepStoredStates();
  } catch (_) { /* best effort — quota / private mode */ }
}

function forgetCardState(callId: string): void {
  if (!callId) return;
  try { localStorage.removeItem(STATE_LS_PREFIX + callId); } catch (_) { /* ignore */ }
}

/** Keep the state store bounded: drop entries older than a week and cap the
 *  total count (the key space is one entry per card, so this is cheap). */
function sweepStoredStates(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(STATE_LS_PREFIX) === 0) keys.push(k);
    }
    const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
    const fresh: string[] = [];
    keys.forEach((k) => {
      let v: any = null;
      try { v = JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { v = null; }
      if (!v || !v.ts || Date.now() - v.ts > MAX_AGE_MS) localStorage.removeItem(k);
      else fresh.push(k);
    });
    const MAX_ENTRIES = 80;
    if (fresh.length <= MAX_ENTRIES) return;
    fresh
      .map((k) => ({ k, ts: (JSON.parse(localStorage.getItem(k) || "{}") || {}).ts || 0 }))
      .sort((a, b) => a.ts - b.ts)
      .slice(0, fresh.length - MAX_ENTRIES)
      .forEach((x) => localStorage.removeItem(x.k));
  } catch (_) { /* best effort */ }
}

/** Ask the backend about a *known* request_id.
 *  Distinguishes "not pending" from "could not tell" so a network blip
 *  never throws away a possibly-good id. */
async function checkPendingById(
  requestId: string,
): Promise<{ kind: "found" | "absent" | "orphan" | "error"; data?: any }> {
  try {
    const resp = await fetch(
      apiUrl("/question-modal/resolve") + "?request_id=" + encodeURIComponent(requestId),
      { headers: authHeaders() });
    if (!resp.ok) return { kind: "error" };
    const d = await resp.json();
    if (d) cacheHostContext(d.session_id, d.agent_id);
    if (d && d.found) return { kind: "found", data: d };
    if (d && d.orphan) return { kind: "orphan" };
    return { kind: "absent" };
  } catch (_) { return { kind: "error" }; }
}

/** Human-readable summary of submitted answers (visible questions only). */
function formatAnswers(
  questions: QDef[], answers: Record<string, QA>, other: string,
  finalOtherAtt?: Attachment[],
): string {
  const lines: string[] = ["【用户提交的问卷答案】"];
  const vis = new Set(visibleIndices(questions, answers));
  questions.forEach((q, i) => {
    if (!vis.has(i)) return;                // hidden → never submitted
    const a = answers[`q${i}`];
    if (!a) return;
    let v: any = a.value;
    if (Array.isArray(v)) {
      v = v.filter((x) => x !== OTHER)
        .map((x) => { const hit = (q.options || []).find((o) => optValue(o) === String(x)); return hit ? optLabel(hit) : x; })
        .join("、");
    } else {
      const hit = (q.options || []).find((o) => optValue(o) === String(v));
      if (hit) v = optLabel(hit);
      if (String(a.value) === OTHER) v = "";
    }
    const label = qType(q) === "single" ? "单选" : qType(q) === "multi" ? "多选" : "问答";
    // Mirror the backend rendering: an unanswered (skipped) question is shown
    // explicitly so the read-only view matches what the model received.
    // Note: choosing "其他" + typing a note leaves `value` empty but is NOT a
    // skip — only a fully empty answer (or an explicit skip) counts.
    const hasText = !!String(v || "").trim() || !!String(a.other || "").trim()
      || !!(a.attachments && a.attachments.length);
    // Mirror the backend rendering.  #5: an EMPTY answer the user merely
    // stepped past (clicked 下一步 without choosing) is「未作答」— NOT a skip.
    // Only an explicit per-question skip (跳过本题 / driver skip) reads as
    // 「用户跳过本题」.  Conflating the two made "next question" look like a
    // skip, which is what the user objected to.
    // D4（用户裁定 2026-11-07 q3）：跳过有三种来源，措辞必须分开。
    // 原先任何 skipped 都写「用户跳过本题」，于是 AI 自动跳过观察题会被读成
    // "用户主动放弃了这题"——事实相反：用户**根本没被问过**。必须与后端
    // `_format_answer_for_llm` 保持逐字一致，否则卡片显示与回传摘要会打架。
    const skipBy = String((a as any).skipped_by || "");
    const shown = !a.skipped ? (!hasText ? "（未作答）" : v)
      : skipBy === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）"
      : skipBy === "no_recommend" ? "（AI 跳过：无可用推荐）"
      : "（用户跳过本题）";
    let line = `- q${i} [${label}] ${shown}`;
    if (a.other && !a.skipped) line += `（其他：${a.other}）`;
    if (a.attachments && a.attachments.length) {
      line += `（附件：${a.attachments.map((f) => f.file_name).join("、")}）`;
    }
    lines.push(line);
  });
  if (other) lines.push(`- 其他意见：${other}`);
  if (finalOtherAtt && finalOtherAtt.length) {
    lines.push(`- 其他意见附件：${finalOtherAtt.map((f) => f.file_name).join("、")}`);
  }
  return lines.join("\n");
}

/** Compact question list, used when a skipped survey is expanded. */
function summarizeQuestions(questions: QDef[]): string {
  return questions.map((q, i) => {
    const label = qType(q) === "single" ? "单选" : qType(q) === "multi" ? "多选" : "问答";
    const opts = (q.options || []).map(optLabel).join("、");
    return `${i + 1}. [${label}] ${qTitle(q, i)}${opts ? "（" + opts + "）" : ""}`;
  }).join("\n");
}

/** A small「📎 附件」control plus the chips of already-uploaded files.
 *
 *  Deliberately a plain render *function*, not a component: the card's
 *  host-facing tree is inspected as-is by the headless harness (which does
 *  not execute nested components), so keeping it inline makes the attachment
 *  path observable in tests.  The file input itself is NOT here — it lives at
 *  module scope so it survives the card being remounted (see getFileInput). */
function AttachRow(props: {
  R: any; files: Attachment[]; disabled?: boolean; uploading?: boolean;
  error?: string; key?: string;
  onPick: () => void;
  onRemove: (i: number) => void;
}): any {
  const { R, files, disabled, uploading, error, onPick, onRemove } = props;

  const chip: any = {
    display: "inline-flex", alignItems: "center", gap: 4,
    maxWidth: 220, padding: "2px 6px 2px 8px", borderRadius: 6,
    fontSize: 12, lineHeight: 1.4,
    background: "var(--app-surface-subtle, rgba(127,127,127,0.07))",
    border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.22))",
    color: "var(--app-text-secondary, inherit)",
  };
  const pick: any = {
    display: "inline-flex", alignItems: "center", gap: 4,
    height: 26, padding: "0 10px", fontSize: 12, borderRadius: 6,
    cursor: disabled || uploading ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: disabled || uploading ? 0.6 : 1,
  };

  return R.createElement("div", {
    style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  },
    files.map((f, i) => R.createElement("span", { key: "att" + i, style: chip },
      R.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: f.file_name,
      }, f.file_name + (f.size ? "（" + humanSize(f.size) + "）" : "")),
      R.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => { if (!disabled) onRemove(i); },
      }, "×"))),
    R.createElement("button", {
      type: "button", disabled: disabled || uploading, style: pick,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: onPick,
    }, uploading ? "上传中…" : "📎 附件"),
    error ? R.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 },
    }, "附件失败：" + error) : null);
}

// ══════════════════════════════════════════════════════════════════
// Analysis UI — capsule model picker, AI/manual switch, view button
// ══════════════════════════════════════════════════════════════════

/** A compact model "capsule" button that opens a picker of providers/models.
 *  Visually modelled on the host's own LLM pill (and prompt-forge's capsule):
 *  one pill showing the current model, tinted by free/paid.
 *
 *  Deliberately HOOK-FREE: it is invoked as a plain function from the card
 *  body (the harness's fake React does not execute nested components), so its
 *  open/tab state lives in the parent.  Adding useState here would break
 *  React's rules of hooks, because the card's loading skeleton renders a
 *  different number of components than its ready state. */
/** Model capsule — visual language mirrored from prompt-forge's llmPill.
 *
 *  Deliberately hook-free (the card invokes it as a plain function), so the
 *  popover's open state and the paid/free tab are passed in by the caller.
 *
 *  What made prompt-forge read as「更清晰」, and is replicated here:
 *  - the pill itself stays NEUTRAL and carries only a small status dot
 *    (green = free, amber = paid) instead of dyeing its whole border;
 *  - the tab bar shows the per-tab model COUNT (付费 🟡 12 / 免费 🟢 5);
 *  - models are GROUPED BY PROVIDER with a dim header + count, instead of a
 *    flat "model · provider" list;
 *  - the selected row gets a 3px accent bar + selected background.
 */
function ModelCapsule(props: {
  /** 服务端说「这个 model_id 是跟随当前对话模型得来的」，纯展示用。 */
  followActive?: boolean;
  R: any; providers: any[]; modelId: string;
  onChange: (id: string) => void; disabled?: boolean;
  open: boolean; onOpenChange: (v: boolean) => void;
  tab: "paid" | "free"; onTabChange: (t: "paid" | "free") => void;
}): any {
  const { R, providers, modelId, onChange, disabled,
          open, onOpenChange, tab, onTabChange } = props;
  const antd = antdLib();
  const Popover = antd.Popover;

  // Flatten to {providerId, providerName, modelId, modelName, free}.
  const flat: any[] = [];
  providers.forEach((p: any) => {
    [...(p.models || []), ...(p.extra_models || [])].forEach((m: any) => {
      flat.push({
        providerId: p.id, providerName: p.name || p.id,
        modelId: m.id, modelName: m.name || m.id, free: !!m.is_free,
      });
    });
  });
  const cur = flat.find((x) => `${x.providerId}:${x.modelId}` === modelId);
  const label = cur ? cur.modelName : (modelId || "选择模型");
  // 2026-11-04 用户裁定：不再显示「跟随当前对话模型」前缀，直接显示实际模型。
  // 服务端已把「未配置」解析成当前会话真实模型，胶囊直接呈现它，与用户
  // 在宿主模型选择器里看到的名称一致。
  const capsuleTitle = label;
  // Status dot only — the pill stays neutral so long model names stay legible.
  const dotColor = cur
    ? (cur.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)")
    : "var(--app-text-tertiary, rgba(0,0,0,0.25))";

  const pillStyle: any = {
    display: "inline-flex", alignItems: "center", gap: 4,
    height: 22, padding: "1px 8px", boxSizing: "border-box",
    borderRadius: 999, fontSize: 12, lineHeight: "1",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "var(--app-bg-container, rgba(127,127,127,0.04))",
    color: "var(--app-text, inherit)",
    cursor: disabled ? "default" : "pointer",
    maxWidth: 170, overflow: "hidden", whiteSpace: "nowrap",
  };

  const freeCount = flat.filter((x) => x.free).length;
  const paidCount = flat.length - freeCount;

  // Provider groups for the active tab (order preserved, empty groups dropped).
  const groups: any[] = [];
  providers.forEach((p: any) => {
    const ms = [...(p.models || []), ...(p.extra_models || [])]
      .map((m: any) => ({
        providerId: p.id, providerName: p.name || p.id,
        modelId: m.id, modelName: m.name || m.id, free: !!m.is_free,
      }))
      .filter((x: any) => (tab === "free" ? x.free : !x.free));
    if (ms.length) groups.push({ id: p.id, name: p.name || p.id, models: ms });
  });

  const tabBtn = (t: "paid" | "free", text: string) =>
    R.createElement("button", {
      key: t, type: "button",
      style: {
        flex: 1, textAlign: "center", padding: "5px 12px", border: "none",
        borderRadius: 4, fontSize: 12, cursor: "pointer",
        background: tab === t ? "var(--app-bg-container, #fff)" : "transparent",
        color: tab === t
          ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
        fontWeight: tab === t ? 600 : 400,
        boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
        whiteSpace: "nowrap", fontFamily: "inherit",
      },
      onClick: () => onTabChange(t),
    }, text);

  const content = R.createElement("div", {
    style: { width: 268, maxHeight: "min(60vh, 340px)", overflowY: "auto", scrollbarWidth: "none" },
  },
    // segmented tab bar
    R.createElement("div", {
      style: {
        display: "flex", gap: 2, padding: 3, margin: "4px 6px 2px",
        borderRadius: 6, boxSizing: "border-box",
        background: "var(--app-surface-subtle, rgba(127,127,127,0.08))",
      },
    },
      tabBtn("paid", "付费 🟡 " + paidCount),
      tabBtn("free", "免费 🟢 " + freeCount)),
    groups.length
      ? R.createElement("div", null, groups.map((g, gIdx) =>
          // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
          R.createElement("div", {
            key: g.id,
            style: { marginBottom: 2 },
          },
            R.createElement("div", {
              style: {
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", fontSize: 11, fontWeight: 600,
                color: "var(--app-text-tertiary, inherit)",
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
              },
            },
              R.createElement("span", { style: { flex: 1 } }, g.name),
              R.createElement("span", { style: { fontWeight: 400 } }, g.models.length)),
            g.models.map((m: any) => {
              const active = `${m.providerId}:${m.modelId}` === modelId;
              return R.createElement("div", {
                key: `${m.providerId}:${m.modelId}`,
                style: {
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", paddingLeft: 18, cursor: "pointer",
                  borderLeft: "3px solid " + (active
                    ? "var(--app-accent, #1677ff)" : "transparent"),
                  borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                  background: active ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent",
                },
                onClick: () => { onChange(`${m.providerId}:${m.modelId}`); onOpenChange(false); },
              },
                R.createElement("span", {
                  style: {
                    width: 6, height: 6, borderRadius: 3, flexShrink: 0,
                    background: gIdx % 2 === 0
                      ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)",
                  },
                }),
                R.createElement("span", {
                  style: {
                    fontSize: 12, flex: 1, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  },
                }, m.modelName));
            }))))
      : R.createElement("div", {
          style: { fontSize: 12, padding: 16, textAlign: "center",
                   color: "var(--app-text-tertiary, inherit)" },
        }, "暂无模型"));

  if (!Popover) {
    // Degrade gracefully if the host ever stops injecting antd.Popover.
    return R.createElement("button", {
      type: "button", style: pillStyle, disabled,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const nxt = flat.find((x) => `${x.providerId}:${x.modelId}` !== modelId);
        if (nxt) onChange(`${nxt.providerId}:${nxt.modelId}`);
      },
    },
      R.createElement("span", {
        style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: dotColor },
      }),
      R.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, capsuleTitle),
      R.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" },
      }, "▾"));
  }
  return R.createElement(Popover, {
    content, trigger: "click", open, onOpenChange,
    placement: "bottomLeft",
  }, R.createElement("button", {
    type: "button", style: pillStyle, disabled,
    title: "选择 AI 分析使用的模型",
  },
    R.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: dotColor },
    }),
    R.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, capsuleTitle),
    R.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" },
    }, "▾")));
}

/** The AI/manual switch rendered as a two-segment control. */
function ModeSwitch(props: {
  R: any; mode: AnMode; onChange: (m: AnMode) => void;
  disabled?: boolean;
}): any {
  const { R, mode, onChange, disabled } = props;
  // Short labels keep all three segments on one line next to the capsules.
  // 「只用推荐」 neither analyses nor waits: it ticks the option the model
  // already marked as recommended while authoring the question.
  const LABELS: Record<AnMode, string> = {
    ai: "自动分析", recommend: "只用推荐", manual: "人工",
  };
  const TIPS: Record<AnMode, string> = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发任何模型请求：直接采用出题时已标注的推荐，自动填入、翻页、提交",
    manual: "由你手动作答",
  };
  const seg = (val: AnMode) =>
    R.createElement("button", {
      key: val, type: "button", disabled,
      style: {
        height: 22, padding: "0 8px", fontSize: 11, borderRadius: 10,
        cursor: disabled ? "default" : "pointer", border: "none",
        whiteSpace: "nowrap",
        background: mode === val
          ? "var(--app-accent, #ff7f16)" : "transparent",
        color: mode === val
          ? "var(--app-text-inverse, #fff)"
          : "var(--app-text-secondary, inherit)",
      },
      title: TIPS[val],
      onClick: () => onChange(val),
    }, LABELS[val]);
  return R.createElement("div", {
    style: {
      display: "inline-flex", alignItems: "center", gap: 2, padding: 2,
      borderRadius: 12, background: "var(--app-surface-subtle, rgba(127,127,127,0.08))",
      border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.2))",
    },
  }, seg("ai"), seg("recommend"), seg("manual"));
}

/** The prompt-template picker: a pill that opens a Popover listing every
 *  template (built-ins first) plus a「管理模板」entry.  Hook-free by design —
 *  `open`/`mgrOpen`/`edit` live in the parent card (see ModelCapsule). */
function TemplateCapsule(props: {
  R: any; templates: any[]; value: string;
  open: boolean; onOpenChange: (v: boolean) => void;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onManage: () => void;
}): any {
  const { R, templates, value, open, onOpenChange, disabled, onSelect, onManage } = props;
  const antd = antdLib();
  const Popover = antd.Popover;

  const cur = (templates || []).find((t: any) => t.id === value);
  const label = cur ? cur.name : "默认模板";
  const pillStyle: any = {
    display: "inline-flex", alignItems: "center", gap: 4,
    height: 22, padding: "1px 8px", boxSizing: "border-box",
    borderRadius: 999, fontSize: 12, lineHeight: "1",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "var(--app-bg-container, rgba(127,127,127,0.04))",
    color: "var(--app-text, inherit)",
    cursor: disabled ? "default" : "pointer",
    maxWidth: 160, overflow: "hidden", whiteSpace: "nowrap",
  };

  const content = R.createElement("div", {
    style: { width: 240, maxHeight: "min(60vh, 320px)", overflowY: "auto",
             scrollbarWidth: "none" },
  },
    (templates || []).map((t: any) =>
      R.createElement("div", {
        key: t.id,
        style: {
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", cursor: "pointer",
          borderLeft: "3px solid " + (t.id === value
            ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: t.id === value ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent",
        },
        onClick: () => { onSelect(t.id); onOpenChange(false); },
      },
        R.createElement("span", {
          style: { fontSize: 12, flex: 1, overflow: "hidden",
                   textOverflow: "ellipsis", whiteSpace: "nowrap" },
        }, t.name),
        t.builtin
          ? R.createElement("span", {
              style: { fontSize: 10, padding: "0 5px", borderRadius: 3,
                       color: "var(--app-text-tertiary, inherit)",
                       border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.3))" },
            }, "内置")
          : null)),
    R.createElement("div", {
      style: { padding: "6px 12px", cursor: "pointer", fontSize: 12,
               color: "var(--app-accent, #1677ff)",
               borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))" },
      onClick: () => { onOpenChange(false); onManage(); },
    }, "＋ 管理模板…"));

  const btn = R.createElement("button", {
    type: "button", style: pillStyle, disabled,
    title: "选择本题分析使用的提示词模板",
  },
    R.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, label),
    R.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾"));

  if (!Popover) return btn;   // degrade: manage entry is unreachable, but the card works
  return R.createElement(Popover, {
    content, trigger: "click", open, onOpenChange, placement: "bottomLeft",
  }, btn);
}

/** Template library manager: list + create/edit/delete.  Hook-free; all state
 *  (mgrOpen / edit draft) lives in the parent card.
 *
 *  2026-10-15: the panel used to be a `position:fixed` box anchored to the
 *  top-right of the viewport, which sat over the survey and — together with the
 *  template Popover opening downwards — made the long prompt textareas
 *  unreadable ("气泡已经挤入输入框，无法查看具体内容").  Per product decision it
 *  is now a **centered Modal**, fully independent of where the card sits, so
 *  the editing surface has the whole screen.  The `qm-bubble` class reuses the
 *  existing hidden-scrollbar rule.  If the host does not expose `Modal`, fall
 *  back to the old fixed panel so the card never breaks. */
function TemplateManager(props: {
  R: any; open: boolean; templates: any[]; value: string;
  edit: any; onEditChange: (e: any) => void;
  onClose: () => void; onSelect: (id: string) => void;
  onSave: (tpl: any) => void; onDelete: (id: string) => void;
}): any {
  const { R, open, templates, value, edit, onEditChange, onClose, onSelect, onSave, onDelete } = props;
  if (!open) return null;
  const antd = antdLib();
  const { Input, Modal } = antd;
  const panel: any = {
    maxHeight: "60vh", overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10, padding: 12, fontSize: 12,
  };
  // Fallback (no host Modal) keeps the old self-contained look: Modal brings
  // its own surface, the inline panel must bring its own.
  if (!Modal) {
    panel.position = "fixed"; panel.right = 24; panel.top = 80; panel.width = 420;
    panel.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))";
    panel.zIndex = 1100; panel.boxShadow = "0 6px 24px rgba(0,0,0,0.18)";
  }
  const rowBtn: any = {
    height: 22, padding: "0 8px", fontSize: 11, borderRadius: 6, cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent", color: "var(--app-text, inherit)",
  };

  const editing = !!edit;
  const ta = (val: string, onChange: (v: string) => void, rows: number, ph: string) => {
    if (Input && Input.TextArea) {
      return R.createElement(Input.TextArea, {
        value: val, rows, placeholder: ph,
        onChange: (e: any) => onChange(e && e.target ? e.target.value : ""),
      });
    }
    return R.createElement("textarea", {
      value: val, rows, placeholder: ph,
      style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
      onInput: (e: any) => onChange(e && e.target ? e.target.value : ""),
      onChange: (e: any) => onChange(e && e.target ? e.target.value : ""),
    });
  };

  const body = R.createElement("div", { style: panel, className: "qm-tpl-mgr qm-bubble",
                                       "data-qm-tpl-mgr": "true" },
    R.createElement("div", {
      style: { display: "flex", alignItems: "center", marginBottom: 8, gap: 8 },
    },
      R.createElement("span", { style: { fontWeight: 600, flex: 1 } },
        editing ? (edit.id ? "编辑模板" : "新建模板") : "模板库（全局共享）"),
      R.createElement("button", { type: "button", style: rowBtn, onClick: onClose }, "关闭")),

    editing
      ? R.createElement("div", null,
          R.createElement("div", { style: { marginBottom: 6 } }, "名称"),
          ta(edit.name || "", (v) => onEditChange({ ...edit, name: v }), 1, "模板名称"),
          R.createElement("div", { style: { margin: "8px 0 6px" } },
            "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"),
          ta(edit.system || "", (v) => onEditChange({ ...edit, system: v }), 8, "系统提示词"),
          R.createElement("div", { style: { margin: "8px 0 6px" } },
            "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"),
          ta(edit.user || "", (v) => onEditChange({ ...edit, user: v }), 6, "用户提示词模板"),
          R.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
            R.createElement("button", {
              type: "button",
              style: { ...rowBtn, borderColor: "var(--app-accent, #1677ff)",
                       color: "var(--app-accent, #1677ff)" },
              onClick: () => onSave(edit),
            }, "保存"),
            R.createElement("button", {
              type: "button", style: rowBtn, onClick: () => onEditChange(null),
            }, "取消")))
      : R.createElement("div", null,
          (templates || []).map((t: any) =>
            R.createElement("div", {
              key: t.id,
              style: { display: "flex", alignItems: "center", gap: 6,
                       padding: "6px 4px",
                       borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))" },
            },
              R.createElement("span", { style: { flex: 1, overflow: "hidden",
                                                 textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                t.name + (t.builtin ? "（内置）" : "") + (t.id === value ? " · 使用中" : "")),
              R.createElement("button", {
                type: "button", style: rowBtn, title: "设为本题使用",
                onClick: () => onSelect(t.id),
              }, "选用"),
              R.createElement("button", {
                type: "button", style: rowBtn,
                onClick: () => onEditChange({ id: t.id, name: t.name,
                                              system: t.system, user: t.user }),
              }, "编辑"),
              t.builtin
                ? null
                : R.createElement("button", {
                    type: "button", style: rowBtn,
                    onClick: () => onDelete(t.id),
                  }, "删除")),
          ),
          R.createElement("div", { style: { marginTop: 10 } },
            R.createElement("button", {
              type: "button",
              style: { ...rowBtn, borderColor: "var(--app-accent, #1677ff)",
                       color: "var(--app-accent, #1677ff)" },
              onClick: () => onEditChange({ id: "", name: "", system: "", user: "" }),
            }, "＋ 新建模板"))));

  // Centered modal: the editing surface owns the middle of the screen instead
  // of floating over the survey card.  The panel keeps its own header (title +
  // 「关闭」), so the modal chrome is deliberately empty — one title, not two.
  // Mask click / ESC still close it via `onCancel`.  Without host `Modal` the
  // panel renders inline, exactly as before (never break the card).
  if (!Modal) return body;
  return R.createElement(Modal, {
    open: true, centered: true, footer: null, title: null, closeIcon: null,
    onCancel: onClose, destroyOnClose: true,
    width: "min(620px, 92vw)", zIndex: 1200, style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal",
  }, body);
}

/** The analysis bubble: a button that opens a Popover showing THIS question's
 *  recommendation + markdown reasoning.  Hook-free by design (see
 *  ModelCapsule) — the open flag lives in the parent card.
 *
 *  Interaction contract (per product decision):
 *   • opening the bubble NEVER starts a run — in manual mode the user presses
 *     「开始分析」 inside it (REQ-001), and a finished question is pure viewing
 *     (REQ-002);
 *   • a finished question offers 「重新分析」 at the top, which reruns only this
 *     question with the settings the user last chose (REQ-003). */
function AnalysisBubble(props: {
  R: any; busy: boolean; result: any; error: string;
  mode: AnMode; onRun: () => void; onApply: () => void;
  onCancel?: () => void; onRerun?: () => void;
  disabled?: boolean; children?: any;
  open: boolean; onOpenChange: (v: boolean) => void;
}): any {
  const { R, busy, result, error, mode, onRun, onApply, onCancel, onRerun,
          disabled, children, open, onOpenChange } = props;
  const antd = antdLib();
  const Popover = antd.Popover;

  const btn = R.createElement("button", {
    type: "button", disabled,
    style: {
      display: "inline-flex", alignItems: "center", gap: 4,
      height: 24, padding: "0 10px", borderRadius: 12, fontSize: 12,
      border: "1px solid var(--app-accent, #ff7f16)",
      color: "var(--app-accent, #ff7f16)", background: "transparent",
      cursor: disabled ? "default" : "pointer",
    },
    title: mode === "ai"
      ? "查看本题的 AI 分析过程与推荐（已自动分析）"
      : (mode === "recommend"
        ? "查看本题分析；「只用推荐」模式下不会自动调用模型"
        : "查看本题分析：未分析时可在气泡内点「开始分析」"),
    onClick: () => {
      // Viewing only.  Starting a run is an explicit action inside the bubble,
      // so re-opening a finished question can never fire another model call.
      onOpenChange(!open);
    },
  }, busy ? "分析中…" : "查看分析");

  if (!Popover) {
    return R.createElement("div", null, btn,
      result && open ? R.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" },
      }, String((result.per_question || []).map((p: any) => p.reasoning).join("\n\n")))
        : null);
  }

  const hasResult = !!(result && (result.per_question || []).length);
  // Small shared button style for the in-bubble actions.
  const actionBtn = (label: string, onClick: () => void, primary?: boolean) => {
    return R.createElement("button", {
      type: "button",
      style: {
        fontSize: 12, height: 28, padding: "0 14px", borderRadius: 8,
        cursor: "pointer",
        border: primary ? "none" : "1px solid var(--app-accent, #ff7f16)",
        background: primary
          ? "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, "
            + "var(--app-accent-active, #d96a10) 100%)"
          : "transparent",
        color: primary
          ? "var(--app-text-inverse, #fff)"
          : "var(--app-accent, #ff7f16)",
      },
      onClick,
    }, label);
  };

  const body = R.createElement("div", {
    className: "qm-bubble",
    style: { width: 460, maxHeight: 460, overflow: "auto", fontSize: 13 },
  },
    busy
      ? R.createElement("div", {
          style: { padding: 12, display: "flex", alignItems: "center", gap: 10,
                   color: "var(--app-text-tertiary, inherit)" },
        },
          R.createElement("span", null, "正在按六步思维链分析…"),
          onCancel
            ? R.createElement("button", {
                type: "button",
                style: {
                  marginLeft: "auto", fontSize: 11, height: 22, padding: "0 8px",
                  borderRadius: 6, cursor: "pointer",
                  border: "1px solid var(--app-danger-text, #d4380d)",
                  background: "transparent", color: "var(--app-danger-text, #d4380d)",
                },
                // Stops the six-step run server-side (cancels the in-flight
                // model call) instead of only hiding the spinner.
                onClick: () => { try { onCancel(); } catch (_) { /* ignore */ } },
              }, "终止分析")
            : null)
      : null,
    error
      ? R.createElement("div", {
          style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" },
        }, error)
      : null,
    result
      ? R.createElement("div", null,
          R.createElement("div", {
            style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                     paddingBottom: 8,
                     borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))" },
          },
            R.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, "AI 分析结果"),
            R.createElement("span", {
              style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" },
            }, `${result.model_id || "默认模型"} · ${result.elapsed || 0}s`),
            // Only the answered, non-running state offers the two actions.
            hasResult && !busy
              ? R.createElement("button", {
                  type: "button",
                  style: {
                    marginLeft: "auto", fontSize: 11, height: 22, padding: "0 8px",
                    borderRadius: 6, cursor: "pointer",
                    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
                    background: "transparent",
                    color: "var(--app-text-secondary, inherit)",
                  },
                  // Reruns THIS question only, reusing the stored preferences
                  // (model / context / parallel) — REQ-003.
                  onClick: () => { try { (onRerun || onRun)(); } catch (_) { /* ignore */ } },
                  title: "只重新分析本题（沿用当前模型与选项设置）",
                }, "重新分析")
              : null,
            hasResult && !busy
              ? R.createElement("button", {
                  type: "button",
                  style: {
                    marginLeft: hasResult ? 6 : "auto", fontSize: 11, height: 22,
                    padding: "0 8px", borderRadius: 6, cursor: "pointer",
                    border: "1px solid var(--app-accent, #ff7f16)",
                    background: "transparent", color: "var(--app-accent, #ff7f16)",
                  },
                  onClick: () => { onApply(); onOpenChange(false); },
                }, "套用推荐")
              : null),
          ((result.per_question || []) as any[]).map((p: any) =>
            R.createElement("div", { key: p.index, style: { marginBottom: 14 } },
              // ── Conclusion first ──
              // The user asked for「结论在上，分析在下」: the recommendation is
              // now a single prominent line, and the six-step reasoning is
              // demoted to the supporting detail underneath it.  Typography for
              // both comes from the .qm-md scale above, so nothing in the bubble
              // is larger/greyer than the survey text anymore.
              R.createElement("div", {
                style: { display: "flex", alignItems: "baseline", gap: 8,
                         flexWrap: "wrap" },
              },
                R.createElement("span", {
                  style: { fontSize: 13, fontWeight: 600, color: "var(--app-text, inherit)" },
                }, p.title),
                p.choice
                  ? R.createElement("span", {
                      style: { fontSize: 13, fontWeight: 600,
                               color: "var(--app-accent-text, var(--app-accent, #ff7f16))" },
                    }, "→ " + p.choice)
                  : null,
                typeof p.confidence === "number"
                  ? R.createElement("span", {
                      style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" },
                    }, `置信度 ${Math.round(p.confidence <= 1 ? p.confidence * 100 : p.confidence)}%`)
                  : null),
              R.createElement("div", {
                className: "qm-md",
                "data-qm-md": "true",
                style: { marginTop: 4 },
                dangerouslySetInnerHTML: { __html: renderMarkdown(p.reasoning || "") },
              }))))
      : (busy || error ? null
        : R.createElement("div", {
            style: { padding: 16, display: "flex", flexDirection: "column",
                     alignItems: "center", gap: 10 },
          },
            R.createElement("div", {
              style: { fontSize: 12, color: "var(--app-text-tertiary, inherit)" },
            }, mode === "ai"
              ? "本题尚未生成分析。"
              : "本题尚未分析。点击下方按钮，用所选模型分析本题并给出推荐。"),
            // Manual mode: analysis starts on an explicit press — opening the
            // bubble is a read-only action (REQ-001).
            actionBtn("开始分析", () => { try { onRun(); } catch (_) { /* ignore */ } }, true))),
    // The「携带上下文」and 并行/串行 options live in the bubble footer, per the
    // user's request that context use be "放到按钮中".
    R.createElement("div", {
      style: { marginTop: 10, paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 12,
               borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
               fontSize: 12 },
    }, children));

  return R.createElement(Popover, {
    content: body, trigger: "click", open, onOpenChange,
    placement: "bottomRight",
  }, btn);
}

// ══════════════════════════════════════════════════════════════════
// Card — visual spec mirrored from the host approval card
// ══════════════════════════════════════════════════════════════════

function AskUserCard(props: { data?: any }) {
  const R = host().React;
  const antd = antdLib();
  const { Input, Button } = antd;
  const TextArea = Input.TextArea;

  const node = props.data || {};
  const args = parseArgs(node);
  const callId = toolCallId(node);
  const rawOutput = toolOutputText(node);
  // The host folds old tool results into a pointer stub once the context
  // grows.  Treat that as "no usable inline output" so the card falls back to
  // the backend result instead of rendering the stub as the answer.
  const folded = isFoldStub(rawOutput);
  const outputText = folded ? "" : rawOutput;
  const questions: QDef[] = args.questions || [];
  const title = args.title || "问卷";

  // State saved by a previous mount of this same card.  The host's
  // virtualised message list unmounts a card that scrolls out of view, so
  // without this the survey snapped back to question 1 with every choice
  // wiped (reported as "被打回问卷" / "重发问卷").
  const saved = loadCardState(callId);

  const [answered, setAnswered] = R.useState(
    () => !!(saved && saved.answered) || !!outputText || folded,
  );
  // Text of a result recovered from the backend when the inline output was
  // folded away.  Kept separate from `outputText` so a later successful fetch
  // does not fight with a re-render.
  const [recovered, setRecovered] = R.useState("");
  // The request_id is the ONLY thing submit/skip need, and it used to live in
  // component state alone.  That made it vanish on every remount — and the
  // host remounts this card when the window regains focus (which is exactly
  // what closing the OS file dialog does), so simply opening the attachment
  // picker left「提交」/「跳过」answering「问卷尚未就绪，请稍候」forever.
  //
  // Seed synchronously so the buttons are usable the instant the card paints.
  // Preference order: the verified store (it re-checks the tool_call_id
  // binding in recallReqId) → the card state blob → nothing.
  const [reqId, setReqId] = R.useState<string>(() => {
    const verified = recallReqId(callId);
    if (verified && verified.request_id) return verified.request_id;
    if (saved && typeof saved.reqId === "string") return saved.reqId;
    return "";
  });
  const [visStep, setVisStep] = R.useState(
    () => (saved && typeof saved.visStep === "number" && saved.visStep >= 0 ? saved.visStep : 0),
  );

  // ── 题级用时提示（2026-10-22 五次裁定：每题 60s，切题清零）──
  // 用户原话：「将问卷的阻塞阈值调整为每题，每题阈值设置为 60 秒，超过时才提示，
  // 当前阈值为整个问卷，当前不符合实际体验，如果切换题目则计时清零，重新开始」。
  // 追问三项裁定：q0=作答过程中每题计时、切题/回题都清零；q1=**只提示**，不强制
  // 跳题（与既有「严格闸门」不冲突）；q2=提示形如「本题已超过 60s，可直接跳过或
  // 继续作答」，且**计时停在该值**。
  //
  // 关键设计：q2「计时停在 60s」意味着**永远不需要显示走过的秒数** → 只需一个
  // 60s 单次定时器，到点渲染一次即可，作答期间 React 零每秒渲染（延续上一轮
  // 「避免跑秒造成性能」的裁定）。若将来要显示实时秒数，才需要引入每秒 tick。
  //
  // MUST 落盘「起点」而不是「已超时」布尔值：宿主会因 tool result 合并改 key、
  // 虚拟列表滚出滚回、页面刷新而反复重挂本卡（这是前三轮反复踩的坑）。只存布尔
  // 值的话，用户等 59 秒后随手滚一下卡片 → 定时器丢失 → 再等整整一分钟；
  // 存 `{step, at}` 就能在重挂后按剩余时间续算，且 step 对不上即视为已清零。
  const [slowAt, setSlowAt] = R.useState<number>(
    () => (saved && typeof saved.slowAt === "number" ? saved.slowAt : 0),
  );
  const [slowStep, setSlowStep] = R.useState<number>(
    () => (saved && typeof saved.slowStep === "number" ? saved.slowStep : -1),
  );
  const [slowFired, setSlowFired] = R.useState<boolean>(
    () => !!(saved && saved.slowFired === true),
  );
  const [answers, setAnswers] = R.useState<Record<string, QA>>(() => {
    const init: Record<string, QA> = {};
    questions.forEach((q, i) => {
      init[`q${i}`] = { type: qType(q), value: qType(q) === "multi" ? [] : "", other: "" };
    });
    // Overlay the saved selections (answers may carry `attachments` too).
    const sv = saved && saved.answers;
    if (sv && typeof sv === "object") {
      Object.keys(sv).forEach((k) => {
        if (init[k]) init[k] = { ...init[k], ...sv[k] };
      });
    }
    return init;
  });
  const [finalOther, setFinalOther] = R.useState(
    () => (saved && typeof saved.finalOther === "string" ? saved.finalOther : ""),
  );
  const [busy, setBusy] = R.useState(false);
  // Outcome line for the answered-card escape hatch ("释放阻塞").  Kept apart
  // from `localResult`, which holds the answer summary itself.
  //
  // MUST persist (持久化清单审计 2026-10-21): `showWait` is gated on
  // `!releasedNote`, so a card the user already force-released came back
  // claiming「⏳已提交，模型思考中…」after any host remount — the same
  // family as the deadReason/ctrl+tab flip.  (`backendReleased` was already
  // being written but nothing read it back; the note text itself is what the
  // collapsed row and the wait gate actually look at.)
  const [releasedNote, setReleasedNote] = R.useState(
    () => (saved && typeof saved.releasedNote === "string" ? saved.releasedNote : ""),
  );
  const [localResult, setLocalResult] = R.useState(
    () => (saved && typeof saved.localResult === "string" ? saved.localResult : ""),
  );
  // True when the whole survey was skipped → render the collapsed summary
  // line instead of the full read-only card (user asked for this).
  // Seed from the tool output already present in the message: a card rendered
  // from history never hits the /result lookup (it starts out `answered`),
  // so reloads must recognise the skip from the text itself.  The backend's
  // whole-survey phrase is「跳过了本次问卷」, distinct from the per-question
  // 「（用户跳过本题）」that appears inside a normal submission.
  const [skippedAll, setSkippedAll] = R.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!((saved && saved.skippedAll))
          || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(outputText || ""),
  );
  // 跳过原因（用户裁定 2026-11-08 第 1 项）：卡片必须显示「为什么被跳过」，
  // 便于复盘自动模式整卷跳过。来源优先级 = 本卡落盘 > 工具输出文本 > /result。
  // MUST 落盘：宿主会因 tool result 合并改 key / 虚拟列表滚出滚回 / 刷新而
  // 反复重挂（与 deadReason/releasedNote 同族），丢了这个值卡片又只剩「跳过」。
  const [skipReason, setSkipReason] = R.useState(
    () => (saved && typeof saved.skipReason === "string" ? saved.skipReason : "")
          || parseSkipReason(outputText || ""),
  );
  // Attachments dropped into the final「其他意见」box (one upload per file).
  const [finalOtherAtt, setFinalOtherAtt] = R.useState<Attachment[]>(
    () => (saved && Array.isArray(saved.finalOtherAtt) ? saved.finalOtherAtt : []),
  );
  // Whether the collapsed summary is currently expanded by the user.
  const [expanded, setExpanded] = R.useState(
    () => !!(saved && saved.expanded),
  );
  // True once we go too long without a usable request_id → show self-rescue.
  const [stuck, setStuck] = R.useState(false);
  // When the current resolve attempt started, so the rescue can report how
  // long the panel has been unable to reach the backend.
  const firstTryAt = R.useRef(0);
  // Set when the backend tells us this survey is definitively over — either
  // the plugin was reloaded while it was open (orphan) or the record is gone
  // and was never answerable.  Without this the card retried forever and
  // submit/skip kept answering「问卷尚未就绪，请稍候」.
  // Restored from the persisted card state so a host remount cannot disguise an
  // already-dead survey as「✓ 已跳过问卷」(the ctrl+tab complaint).  See the
  // persist effect — deadReason is written there for exactly this reason.
  const [deadReason, setDeadReason] = R.useState(
    () => (saved && typeof saved.deadReason === "string" ? saved.deadReason : ""),
  );

  // ── Strict-gate rejection banner ──
  // When「提交」is refused because some visible question is unanswered, the
  // transient antd toast can be missed entirely (用户反馈「没看到任何提示」).
  // Mirror the same verdict into a PERSISTENT red line inside the card, and
  // stamp it with BUNDLE_TAG so it doubles as proof of which bundle is running:
  // if a stale pre-gate bundle is loaded, this line can never appear at all.
  // It is cleared by the next real interaction (an option click / skip /
  // submit that gets through).  Persisted so a host remount doesn't lose it.
  const [gateBlocked, setGateBlocked] = R.useState<string>(
    () => (saved && typeof saved.gateBlocked === "string" ? saved.gateBlocked : ""),
  );

  // ── Post-submit "model is thinking" hint ──
  // The card shows「✓ 已完成」the instant the answer is handed back, but the
  // agent still has to generate its next reply — a slow LLM call (429 rate
  // limit, long context) looks identical to「the survey is still blocking」.
  // Record WHEN the survey was settled so the answered card can honestly say
  // "已提交，模型思考中…（N 秒）", and auto-retire the hint so a historical
  // card never claims to be waiting.
  const [submittedAt, setSubmittedAt] = R.useState(
    () => (saved && typeof saved.submittedAt === "number" ? saved.submittedAt : 0),
  );

  // ── 等待行的生命周期标志（2026-10-22 四次裁定：改**后台计时**）──
  // 前台**不再读秒**：原 `waitSec`（每秒 setState）与 `resumeWaited`（冻结秒数）
  // 一并删除。前三轮都是为了"让秒数看起来对"而引入新缺陷（命令式写 DOM 被宿主
  // 重挂冲回 0s / 每秒重建整棵卡片 / 为抓事件把 MutationObserver 挂满 body 抢占
  // 主线程，反而拖慢已到达文字的绘制）。用户裁定 q0=「静」：等待期一句固定文案、
  // 不显示秒数；后台判到模型已输出时**只停自己的定时器、不改任何可见文字**。
  //   pastSoft     = 越过阻塞阈值 WAIT_SOFT_SEC → 文案升级为「释放阻塞」指引。
  //   waitRetired  = 到寿命上限 waitHintSec → 整行退休。注意它**不是**
  //                  「后台判定成功」的标志——判定成功只停轮询、不改视图，否则
  //                  就成了"提示闪一下就没了"（用户第二次裁定明确否决过）。
  // 两者都属「视图语义」标志，与 deadReason/releasedNote 同族，MUST persist：
  // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂本卡，
  // 丢标志 = 已退休的行重亮 / 已升级的文案退回（持久化清单审计那条教训）。
  const [pastSoft, setPastSoft] = R.useState(
    () => !!(saved && saved.pastSoft === true),
  );
  const [waitRetired, setWaitRetired] = R.useState(
    () => !!(saved && saved.waitRetired === true),
  );

  // 本实例是否处于「可以后台观测这段等待」的状态：本实例真的提交过，**或**挂载了
  // 一张仍在寿命窗口内的近期卡（刷新/重挂载后继续观测同一段等待）。超出窗口 =
  // 历史卡：它的 elapsed 是卡片年龄而不是等待时长，既不显示等待行、也不挂释放
  // 按钮（用户裁定 q1=分情况）。useState 初值只跑一次，重挂载即重算。
  const observedWaitRef = R.useRef(
    !!(saved && typeof saved.submittedAt === "number"
       && saved.submittedAt > 0
       && Date.now() - saved.submittedAt < WAIT_HINT_DEFAULT_SEC * 1000),
  );
  // 后台计时是否已结束（判定到卡外文本增长，或到寿命上限）。用 **ref 而非 state**：
  // 停表完全不需要渲染，这正是"避免跑秒造成性能"的落点。重挂载后重跑一轮无害
  // ——判定幂等，且新基线会让它很快停下。
  const bgDoneRef = R.useRef(false);
  // 「越阈提示已发过一次」的守门：pastSoft 是 state，若把它放进轮询 effect 的
  // 依赖数组，setState → 依赖变化 → 整条链重启、文本基线重置，判定会被推晚一个
  // 轮询周期。用 ref 守就把这次渲染与计时链解耦（初值跟随已落盘的 pastSoft）。
  const pastSoftFiredRef = R.useRef(!!(saved && saved.pastSoft === true));

  // ── AI analysis state ──
  // Preferences persist per card; the analysis result is cached in state and
  // (server-side) in analysis_results.json so a reload can re-show it.
  // (prefs0 已移除：初值不再读 localStorage 镜像 —— 见下方 useState 注释)

  // ── Effective settings (schema-driven, server-merged) ──
  //
  // Card-local snapshot of `GET /effective-config`.  The card keeps its OWN
  // copy instead of reading a module global: two cards can belong to different
  // conversations, so a shared snapshot would let one card's chat leak into the
  // other's display.
  //
  // Deliberately starts from the built-in defaults and fills in after the
  // fetch resolves: a card must render correctly on the very first paint, even
  // offline.  Only the read-only display settings are consumed so far (batch 1
  // wiring covers the 作答 tab; behaviour flags follow in their own batch).
  const [effCfg, setEffCfg] = R.useState<Record<string, any>>(() => ({
    show_recommend_badge: true,
    slow_question_sec: 60,
  }));
  const effCfgRef = R.useRef<Record<string, any>>(effCfg);
  const setEff = (next: Record<string, any>) => {
    effCfgRef.current = next;
    setEffCfg(next);
  };
  /** Read one effective setting with a schema-default fallback. */
  const cfgOf = (key: string, fallback: any): any => {
    const v = effCfg[key];
    return v === undefined || v === null ? fallback : v;
  };
  // c5 是模块级开关（qTitle 在卡片外也被调用），每次渲染同步一次。
  _fallbackTitle = !!cfgOf("fallback_title", true);
  /** d4：等待提示阈值（秒）。读配置并非捕获——设置面板改完后，正在跑的
   *  等待链也要按新阈值判定，否则用户改了没反应。 */
  const waitHintSec = Math.max(30, Number(cfgOf("wait_hint_sec", WAIT_HINT_DEFAULT_SEC)) || WAIT_HINT_DEFAULT_SEC);
  // `mode` is PER-CARD (问题2): a card remembers its own AI/manual choice and a
  // switch here never leaks into the next survey.  The global prefs (model /
  // withContext / parallel) stay disk-backed (B3).  A fresh card seeds its mode
  // from the global default, then diverges on its own.
  // `mode` is SESSION-scoped (裁定 2026-11-04: 彻底会话级、废弃卡片级).
  //
  // It used to be seeded from this card's own saved state, which made the same
  // conversation behave differently per survey depending on which card the
  // user happened to toggle last.  Now it comes from the effective config
  // (会话覆盖 > 全局默认 > 内建), so one chat = one driving mode.
  //
  // `saved.mode` is deliberately IGNORED rather than migrated: the user chose
  // "直接忽略旧值，回落全局默认" over a one-off migration, and reading it here
  // would reintroduce the per-card divergence we just removed.
  // mode 是**会话级**配置，唯一权威是 `/effective-config`。
  //
  // 曾经写成 `normMode(cfgOf("mode", prefs0.mode))`：首帧 `effCfg` 只有内建
  // 默认值（不含 mode），于是回落到 `prefs0.mode` —— 也就是 localStorage 镜像
  // 里的旧值。用户报「已经配置了人工，实际却按只用推荐运行」就是这条链：
  // 全局默认是 recommend，镜像里存着 recommend，卡片便以 recommend 起跑并
  // 开始自动推进，等配置到达再 `setAnMode("manual")` 已经晚了。
  //
  // 现在首帧一律取内建默认 manual（不驱动、不会自动推进的保守值），真实模式
  // 只由 `/effective-config` 落地。代价是多等一次 round-trip 才开始（裁定 q2）。
  const initialMode: AnMode = "manual";
  const [anMode, setAnMode] = R.useState<AnMode>(initialMode);
  // 阶段 1（2026-11-07）：`isDriver` / `remoteSyncRef` / `shadowStateRef` 全部移除。
  // 三者都属于旧的前端权威方案：
  //   · isDriver     —— localStorage 租约选唯一驱动者（后端权威后不需要互斥）
  //   · remoteSyncRef—— 阻断 storage 事件乒乓（跨标签同步已删）
  //   · shadowStateRef —— 影子比对上报快照（已被 SSE 双向同步取代）
  // 初值一律为空占位，真实值只来自 `/effective-config`
  // （用户裁定 2026-11-04：卡片必须与设置页显示同一个值，禁止自己兜底）。
  // 旧实现读 `prefs0`（localStorage 镜像），会在配置到达前先显示一个可能过期的值。
  const [anModel, setAnModel] = R.useState<string>("");
  // 服务端标记「这个 model_id 是跟随当前对话模型得来的，不是用户显式配置的」。
  // 纯展示用：让用户看得出这个模型是哪来的，不参与任何判断逻辑。
  const [followActive, setFollowActive] = R.useState<boolean>(false);
  const [anCtx, setAnCtx] = R.useState<boolean>(false);
  const [anParallel, setAnParallel] = R.useState<boolean>(false);
  const [providers, setProviders] = R.useState<any[]>([]);
  const [anBusy, setAnBusy] = R.useState(false);
  const [anResult, setAnResult] = R.useState<any>(null);
  const [anError, setAnError] = R.useState("");
  const [anOpen, setAnOpen] = R.useState(false);
  // Popover open/state for the capsule picker lives here (its component is
  // hook-free by design — see ModelCapsule).
  const [capOpen, setCapOpen] = R.useState(false);
  const [capTab, setCapTab] = R.useState<"paid" | "free">("paid");
  // Per-question analysis (REQ-004): results are cached by question index so
  // stepping between questions is a pure read, and `analysedRef` records which
  // questions have already been analysed (REQ-008: analyse the question on
  // screen, once).
  const qResultsRef = R.useRef<Record<number, any>>({});
  const analysedRef = R.useRef<Record<number, boolean>>({});
  // Mirrors `visStep` for use inside async callbacks (avoids stale closures
  // without re-creating the callbacks on every question change).
  const visStepRef = R.useRef(0);
  // Holds the AbortController of the in-flight analysis fetch (null when idle),
  // so「终止分析」can release the pending request.
  const anAbortRef = R.useRef<any>(null);
  // Bumped whenever the user changes something that must invalidate a previous
  // auto-analysis (model switch), so the effect below re-runs even though its
  // other dependencies are unchanged.
  const [anNonce, setAnNonce] = R.useState(0);

  // ── Prompt templates (REQ-001/002/003) ──
  // The LIBRARY is global (one shared store on the server); only the SELECTION
  // is per-card: `templateId` persists in this card's state and a fresh card
  // falls back to the library default, so one card's choice never leaks into
  // the next survey (same discipline as `mode`).
  const [templates, setTemplates] = R.useState<any[]>([]);
  // 只来自 `/effective-config` 的 template_id（服务端已把「未配置」解析成库默认）。
  const [tplId, setTplId] = R.useState<string>("");
  const tplIdRef = R.useRef(tplId);
  tplIdRef.current = tplId;
  // Popover/edit state for the template picker — hoisted into the parent card
  // because the picker component is called as a plain function (hook-free).
  const [tplOpen, setTplOpen] = R.useState(false);
  const [tplMgrOpen, setTplMgrOpen] = R.useState(false);
  const [tplEdit, setTplEdit] = R.useState<any>(null);   // {id,name,system,user} | null

  // ── AI autopilot (无人值守自动答题) ──
  // When AI mode is on and NOT paused, each analysed question is auto-filled
  // with the model's recommendation and the card advances to the next question,
  // ending in an auto-submit.  `autoPaused` is the takeover latch (#4): the
  // user can stop it without changing the model preference.  It persists with
  // the card so a remount (virtual-scroll / reload) does not silently resume a
  // run the user had stopped.
  const [autoPaused, setAutoPaused] = R.useState<boolean>(
    () => !!(saved && saved.autoPaused),
  );
  const autoPausedRef = R.useRef(autoPaused);
  autoPausedRef.current = autoPaused;
  // Guards against double-submitting the last question once the driver reaches
  // the 其他意见 page.
  const autoSubmitRef = R.useRef(false);
  /** 自动提交失败重试次数（裁定 q1：上限 3 次，用尽交给用户手动提交）。
   *  这是对「一次性锁存」的修正：旧实现置位后永不复位，只要第一次提交失败
   *  （限流/瞬时 500）整张卡就永久停在末页，用户看到的就是「卡在最后一题」。 */
  const autoSubmitTriesRef = R.useRef(0);
  /** 1B（2026-11-05）：哪些题是「因为没有推荐」被自动跳过的（真实题号）。
   *  只用于显示与摘要；数据侧的权威记录是 answers[..].skipped_by。
   *  用 ref + version 而不是 state 数组：驱动是 effect 里连跑的，
   *  setState 不会立刻反映到本轮循环，而这里需要在同轮内多次写入。 */
  const noRecRef = R.useRef<Record<number, boolean>>({});
  const [noRecVersion, setNoRecVersion] = R.useState(0);
  // Question keys THIS instance has written at least once (manual click, skip,
  // analysis-apply, driver fill).  Untouched keys are empty *because this
  // instance never saw the interaction* — a host remount created a fresh
  // instance while the user's clicks live on the outgoing one.  Persist and
  // submit both reconcile those keys against localStorage instead of clobbering
  // the sibling's recorded answer with our pristine initializer.
  const touchedRef = R.useRef<Set<string>>(new Set());
  const markTouched = (k: string) => { if (k) touchedRef.current.add(k); };
  // Records which questions the autopilot has already auto-advanced past, so a
  // re-render never double-fills or double-steps the same question.
  const appliedRef = R.useRef<Record<number, boolean>>({});
  // Bumped whenever a per-question result lands in `qResultsRef` so the
  // autopilot effect (which reads that ref, not state) re-runs deterministically.
  const [qVersion, setQVersion] = R.useState(0);
  // Marks a question whose analysis has SETTLED — successfully, with a failed
  // recommendation, or by explicit cancel.  The autopilot waits on this (not
  // on a result object) so a failed question auto-skips instead of stalling
  // the whole survey.
  const doneRef = R.useRef<Record<number, boolean>>({});

  // `backendDown`：SSE 是否断开（后端推送不可用）。
  //
  // ★ 声明位置必须**早于所有用到它的 effect**，否则触发 TDZ
  //   （`Cannot access 'backendDown' before initialization`）—— 组件体里
  //   `const` 也是按顺序求值的，hooks 闭包同样如此。
  //
  // 三处消费者：
  //   ① 自动分析 effect（:3796，阶段 4 新增守卫）—— 后端在线就不重复分析
  //   ② 驱动推进 effect（:4778，阶段 2 起）—— 后端在线就不重复推进
  //   ③ 双向同步 effect —— backendDown 只作降级提示，**不作上报闸门**
  //      （阶段 1 教训：SSE 是接收通道，POST 是发送通道，两者必须解绑）
  const [backendDown, setBackendDown] = R.useState(false);
  const backendDownRef = R.useRef(false);
  backendDownRef.current = backendDown;


  // ── Prefs: explicit writes only ──
  // The old code persisted on every change **including the one that fires at
  // mount**, keyed by tool_call_id.  Both halves of that were wrong: a fresh
  // card stamped its defaults over the stored choice, and the per-card key
  // meant nothing could be found anyway — the reported「模型每次被重置」.
  // Now a card only writes when the user actually touches a control.
  const prefsTouched = R.useRef(false);

  // Set once the hydrate effect below has settled (disk value applied, or the
  // backend was unreachable and the local mirror stands).  The AI auto-analysis
  // waits for it: firing on a stale mirror could run the survey in the wrong
  // mode and burn a model call that the 429 limiter is likely to eat.  Kept as
  // a ref and paired with an `anNonce` bump so the gate costs no extra render
  // round-trip.
  // ── FIX-2: 把「重读生效配置」抽成一个可重复调用的函数 ─────────────
  //
  // hydrate 只在挂载时跑一次；另一个标签页改了模式后本页不会知道，于是两边
  // 各按各的模式驱动。这个函数让本页在收到跨标签信号时能跟上。
  // 只覆盖 mode / model / ctx / parallel（与 hydrate 的语义一致），
  // 不动模板选择（卡片级，REQ-002）。
  const refreshEffective = async (): Promise<void> => {
    try {
      const eff = await fetchEffectiveConfig(
        "", true, cardSessionId(callId), currentAgentId(),
      );
      if (!eff || !eff.config) return;
      const c: any = eff.config;
      setEff(c);
      if (c.mode !== undefined) setAnMode(normMode(c.mode));
      if (typeof c.model_id === "string" && c.model_id) setAnModel(c.model_id);
      if (typeof c.with_context === "boolean") setAnCtx(c.with_context);
      if (typeof c.parallel === "boolean") setAnParallel(c.parallel);
      // 模式变了 → 让分析/驱动重新评估当前题（否则新模式下不会重新起跑）。
      setAnNonce((n: number) => n + 1);
    } catch (_) { /* 读不到就保持现状，卡片绝不因配置不可达而报错 */ }
  };

  const prefsReadyRef = R.useRef(false);

  const applyPrefs = (patch: Partial<AnalysisPrefs>) => {
    // ── mode is SESSION-scoped (裁定 2026-11-04) ──
    //
    // Two separate effects on one click, both intended:
    //   ① this card switches immediately — the user expects the mode they just
    //      clicked to drive THIS survey, not to wait for a round-trip;
    //   ② the choice persists as a per-session override, so the NEXT survey in
    //      this chat starts from it.
    //
    // It is NOT written to the card state any more: that store was the old
    // per-card source of truth, and keeping it would let a stale card value
    // beat the session setting on the next mount.
    if (patch.mode !== undefined) {
      setAnMode(patch.mode);
      void pushSessionOverride(
        { mode: patch.mode }, cardSessionId(callId), currentAgentId(),
      );
      // FIX-2：通知其它标签页「模式变了」。storage 事件只在**别的**标签页
      // 触发，所以本页不会收到自己的通知，无回声风险。
      try { localStorage.setItem(SESSION_PREFS_KEY, MY_TAB + ":" + Date.now()); }
      catch (_) { /* quota — 忽略 */ }
    }
    // ── 其余四项也一律写「当前会话」，不再写全局（2026-11-04 裁定乙）──
    //
    // 用户原话：「当前在卡片上修改，等于直接修改当前会话中的设置，2者并不冲突」。
    // 旧实现把 model/ctx/parallel 写到**全局** `POST /prefs`（磁盘
    // analysis_prefs.json），于是「在卡片上改一次模型」会悄悄改掉所有会话的
    // 默认值 —— 与会话级设置面板显示的值也会不一致。
    //
    // 现在四项都进会话覆盖（后端 SETTINGS_SCHEMA 里它们的 scope 都是 both，
    // 实测可写入）；全局默认只能从「全局默认」页改，两条路互不干扰。
    const sessPatch: Record<string, any> = {};
    if (patch.modelId !== undefined) sessPatch.model_id = patch.modelId;
    if (patch.withContext !== undefined) sessPatch.with_context = patch.withContext;
    if (patch.parallel !== undefined) sessPatch.parallel = patch.parallel;
    if (!Object.keys(sessPatch).length) return;

    // 先改本卡的即时状态（用户点了就该立刻看到生效），再落会话覆盖。
    if (patch.modelId !== undefined) setAnModel(patch.modelId);
    if (patch.withContext !== undefined) setAnCtx(patch.withContext);
    if (patch.parallel !== undefined) setAnParallel(patch.parallel);

    // 不再写 localStorage 镜像（用户裁定 2026-11-04 追问 q2：直接删除，
    // 以后只认服务端配置）。镜像曾是两处显示分叉的来源之一：卡片读它、
    // 设置页从不读它，一旦它比服务端旧，两处就必然不同。

    void pushSessionOverride(sessPatch, cardSessionId(callId), currentAgentId());
  };

  // ── Prompt-template handlers (REQ-001/002/003) ──
  /** Select the template for THIS card.  Card-scoped: never global (REQ-002).
   *  A new template invalidates cached recommendations, like a model change. */
  const selectTemplate = (id: string) => {
    if (!id || id === tplId) return;
    setTplId(id);
    tplIdRef.current = id;
    // 会话级（裁定 2026-11-04 q1）：改模板等于改本会话设置，下一份问卷照样用它。
    // 仍保留卡片态一份，让本卡在宿主重挂载后不丢选择。
    mergeCardState(callId, { templateId: id });
    void pushSessionOverride(
      { template_id: id }, cardSessionId(callId), currentAgentId(),
    );
    setAnResult(null);
    qResultsRef.current = {};
    analysedRef.current = {};
    setAnNonce((n: number) => n + 1);
  };

  /** Create/update a template in the GLOBAL library (REQ-003/005).  The
   *  backend enforces the JSON contract (REQ-006); its message is shown as-is. */
  const onSaveTemplate = async (tpl: any) => {
    const res: any = await saveTemplate({
      id: tpl.id || "", name: tpl.name || "",
      system: tpl.system || "", user: tpl.user || "",
    });
    if (!res.ok) { toast("error", res.error || "保存失败"); return; }
    setTemplates(res.items || []);
    setTplEdit(null);
    toast("success", "模板已保存");
  };

  /** Delete a custom template (built-ins are refused by the backend). */
  const onDeleteTemplate = async (id: string) => {
    const res: any = await deleteTemplate(id);
    if (!res.ok) { toast("warning", res.error || "删除失败"); return; }
    setTemplates(res.items || []);
    // If the deleted template was in use here, fall back to a safe default.
    const ids = (res.items || []).map((t: any) => t.id);
    if (ids.indexOf(tplIdRef.current) === -1) {
      const fallback = ids[0] || "";
      setTplId(fallback);
      tplIdRef.current = fallback;
      mergeCardState(callId, { templateId: fallback });
    }
    toast("success", "模板已删除");
  };

  // ── 阶段 1（2026-11-07）：删除驱动租约 + 跨标签页 localStorage 同步 ──
  //
  // 旧方案（FIX-2）三层：origin 防乒乓、localStorage 租约选唯一驱动者、只读横幅。
  // 用户裁定它是治标：租约只是让两个错误的前端"选一个来跑"，需要 TTL/续租/
  // 崩溃接管恰恰证明状态放错了地方。现在由后端单一 state + SSE 广播承担，
  // 这三层全部失效并被移除（见上方「与后端权威 state 双向同步」effect）。
  //
  // 保留的一小段：其它标签页改了**会话偏好**时重读生效配置。偏好不属于
  // 问卷推进状态，仍走 localStorage 通知（成本最低、无需后端参与）。
  R.useEffect(() => {
    if (answered) return undefined;
    const onStorage = (ev: any) => {
      try {
        if (String(ev && ev.key || "") === SESSION_PREFS_KEY) {
          void refreshEffective();
        }
      } catch (_) { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, callId]);


  // Hydrate once per card: model list + the prefs stored on disk.  Disk wins
  // over this browser's mirror (the choice may have been made elsewhere), and
  // when nothing was ever picked the capsule follows **this conversation's own
  // model** (B2).  That derived default is deliberately NOT persisted, so the
  // capsule keeps tracking the conversation until an explicit choice is made.
  R.useEffect(() => {
    // #7 perf: a card rendered from HISTORY (answered) shows only its read-only
    // view — it never renders the model capsule / template pill / analysis
    // bubble, so hydrating providers / prefs / templates / active-model would
    // fire 4-5 useless requests *per historical card* on every page refresh.
    // A long chat with many old surveys turned that into a mount-time request
    // storm (the reported「长对话刷新是否假死」concern).  Skip entirely.
    if (answered) return;
    let alive = true;
    sweepLegacyPrefs();
    (async () => {
      const [list, remote, tplRes, effRes] = await Promise.all([
        fetchProviders(), fetchRemotePrefs(), fetchTemplates(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        fetchEffectiveConfig(
          "", true, cardSessionId(callId), currentAgentId(),
        ),
      ]);
      if (!alive) return;
      setProviders(list);
      // Prompt templates (REQ-001/005): the library is global; this card only
      // remembers WHICH one it selected.  An unset/vanished selection falls
      // back to the library default so a stale id never breaks a run.
      setTemplates(tplRes.items);
      // Effective settings for THIS chat.  Failure keeps the built-in
      // defaults already in state — a card must never block on settings.
      //
      // The RESOLVED mode is applied right here, not further down: `mode` is
      // session-scoped, and the global prefs fetched below carry their own
      // `mode` (the GLOBAL default).  Applying that one would silently undo a
      // session override — exactly the bug [AC6] pinned: the same chat's next
      // card started in `ai` although the chat had been switched to `manual`.
      if (effRes && effRes.config) {
        const c = effRes.config;
        setEff(c);
        // EVERY session-scoped key resolves here, from the merged config
        // (会话覆盖 > 全局默认 > 内建) — never from the global prefs record
        // below, which only knows the global default.  Reading a key from
        // `remote` would silently undo a session override (the [AC6] bug).
        if (c.mode !== undefined) setAnMode(normMode(c.mode));
        if (typeof c.model_id === "string" && c.model_id) setAnModel(c.model_id);
        if (typeof c.with_context === "boolean") setAnCtx(c.with_context);
        if (typeof c.parallel === "boolean") setAnParallel(c.parallel);
        // Template selection is card-scoped by design (REQ-002), but the
        // library default may come from the session override.
        if (typeof c.template_id === "string" && c.template_id) {
          setTplId(c.template_id); tplIdRef.current = c.template_id;
        }
        // 注意：这里刻意只在**配置提供了值**时才覆盖，不写成「否则回落库默认」。
        // 用户在本卡里刚选过模板（卡片态里有值）时，库默认会把它盖回去。
      }
      const ids = tplRes.items.map((t: any) => t.id);
      if (!tplIdRef.current || ids.indexOf(tplIdRef.current) === -1) {
        const fallback = tplRes.defaultId || ids[0] || "";
        if (fallback) { setTplId(fallback); tplIdRef.current = fallback; }
      }
      // ⚠️ 这里刻意【没有任何兜底】。
      //
      // 用户裁定（2026-11-04）：卡片与设置页必须显示同一个值，因此两边都只认
      // `/effective-config` 的返回值。曾经存在的三条额外路径——localStorage
      // 镜像 `prefs0`、全局 prefs `remote`、以及「model_id 为空就去问
      // `/models/active`」——正是两处显示不一致的全部来源（实测：卡片显示
      // `sensenova:deepseek-flash`，设置页 `model_id` 为空）。
      //
      // 「跟随当前对话模型」没有消失，它的解析搬到了服务端
      // （`_fill_follow_active`），返回 `__follow_active__` 供 UI 标注。
      // 后端不可达时卡片就是空值：这是「只认服务端配置」的既定代价（裁定 q2）。
      if (effRes && effRes.config) {
        const c2 = effRes.config as any;
        setFollowActive(c2.__follow_active__ === true);
      }
      prefsReadyRef.current = true;
      // The gate flipped after the analysis effect already ran (and skipped),
      // so nudge it — reuses anNonce, which the effect already depends on.
      setAnNonce((n: number) => n + 1);
    })();
    return () => { alive = false; };
    // Intentionally runs once per card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Restore a previously computed analysis (e.g. after a page reload).
  // The question-scoped lookup happens in the `visStep` effect below, which
  // already fetches the result belonging to the question on screen — a
  // card-level restore here would show another question's recommendation.
  // Keep `visStepRef` in step with the visible question so async analysis
  // callbacks can tell whether their question is still the one on screen.
  R.useEffect(() => { visStepRef.current = visStep; }, [visStep]);

  /** Ask the backend to analyse **the question currently on screen** with the
   *  chosen capsule model.
   *
   *  Analysis is per question (REQ-004): the request carries `question_index`
   *  plus the answers given so far, so the backend can ground the
   *  recommendation in this survey's earlier answers (REQ-005) and the result
   *  is stored per question, where a rerun simply overwrites it (REQ-007). */
  const runAnalysis = async (mode: "auto" | "manual") => {
    if (anBusy) return;
    const qi = visStep;                    // the question being analysed
    setAnBusy(true);
    setAnError("");
    // One controller per run: aborting the fetch stops *us* waiting, while the
    // matching POST /analyze/cancel stops the model calls server-side (a fetch
    // abort alone cannot reach a request already handing in the backend).
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    anAbortRef.current = ctrl;
    try {
      const resp = await fetch(apiUrl("/question-modal/analyze"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          request_id: reqId,
          tool_call_id: callId,
          session_id: cardSessionId(callId),
          title,
          questions,
          model_id: anModel,
          mode,
          with_context: anCtx,
          parallel: anParallel,
          question_index: qi,
          answers,
          template_id: tplIdRef.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(cfgOf("model_timeout_sec", 120)) || 120,
        }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      const d = await resp.json().catch(() => ({}));
      // The backend puts the reason in `analysis.error` (with a generic
      // `ok:false` at the top level) — reading the top level only used to fall
      // through to "分析失败 HTTP 200", which told the user nothing.  Surface the
      // real reason, and keep the status only as a last resort.
      const analysis = (d && d.analysis) || null;
      const reason = (analysis && analysis.error) || (d && d.error) || "";
      if ((d && d.cancelled) || (analysis && analysis.cancelled)) {
        // User stopped it on purpose — say so plainly, never as a failure.
        setAnError("已终止分析。");
      } else if (!resp.ok || !d || d.ok === false || (analysis && analysis.ok === false)) {
        setAnError(reason || ("分析失败（服务返回 " + resp.status + "）"));
      } else if (analysis) {
        // Cache per question, and only surface it when that question is still
        // the one on screen (the user may have moved on while it ran).
        qResultsRef.current[qi] = analysis;
        analysedRef.current[qi] = true;
        if (visStepRef.current === qi) setAnResult(analysis);
        // #2: a one-shot toast replaces the permanent header chip, so the
        // header row never shifts width when an analysis finishes.
        toast("success", "第 " + (qi + 1) + " 题 AI 分析完成");
      }
    } catch (e: any) {
      // An intentional abort surfaces as an AbortError; report it as such.
      const aborted = anAbortRef.current === ctrl && ctrl && ctrl.signal.aborted;
      if (aborted || (e && e.name === "AbortError")) {
        setAnError("已终止分析。");
      } else {
        setAnError("分析请求失败：" + (e && e.message ? e.message : e));
      }
    } finally {
      if (anAbortRef.current === ctrl) anAbortRef.current = null;
      setAnBusy(false);
      // The question has now settled (result / empty / failure / cancel).  Tell
      // the autopilot so it can advance — a failed question auto-skips rather
      // than stalling the survey — and wake the driver effect.
      doneRef.current[qi] = true;
      setQVersion((v: number) => v + 1);
    }
  };

  /** Rerun the question on screen, reusing the stored preferences (REQ-003). */
  const rerunAnalysis = () => {
    const qi = visStep;
    // Drop the previous result so the bubble shows the fresh run, not stale
    // text; the backend overwrites the stored record as well (REQ-007).
    delete qResultsRef.current[qi];
    setAnResult(null);
    setAnError("");
    void runAnalysis("manual");
  };

  /** Cancel the in-flight analysis WITHOUT touching the visible error slot.
   *
   *  Used by the skip paths (#3): stepping past a question or abandoning the
   *  survey must also abort the model call that is still running for it —
   *  otherwise the backend keeps the slot busy and the NEXT question can never
   *  reach the LLM, and for a whole-survey skip the parked request keeps the
   *  chat locked (409 on every later message).  `qi` defaults to the question
   *  currently on screen, read synchronously before the caller advances. */
  const stopAnalysis = (qi?: number) => {
    const idx = qi !== undefined ? qi : visStepRef.current;
    // Fire-and-forget the server-side cancel first so the model call itself is
    // interrupted, not just our wait on it.
    try {
      void fetch(apiUrl("/question-modal/analyze/cancel"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          tool_call_id: callId, request_id: reqId, question_index: idx,
        }),
      }).catch(() => { /* abort below is the user-visible part */ });
    } catch (_) { /* ignore */ }
    // ★ 同时通知**后端 runner** 停掉它自己那次分析（`cancel_analysis`）。
    //
    // 上面那个 `/analyze/cancel` 只作用于同名 task 表 —— 而阶段 3 起 ai 分析
    // 由后端 runner 在 `await analyze_survey(...)` 里跑，它的 task key 不同，
    // 前端中止请求根本触达不到。用户实测的后果：点了「停止分析」，后端仍在
    // 烧配额，且 runner 继续 park 在那次调用上；随后切「只用推荐」时
    // `_sync_runners` 因「旧 task 未完成」而起不来的旧行为会让问卷彻底不动。
    //
    // 后端收到后会 stop_runner（取消在飞分析）并**按当前 mode 重新同步**：
    // ai → 重新分析当前题；recommend → 立刻按推荐推进；manual → 静默。
    try {
      void postSurveyActionAsync(callId, "cancel_analysis", {});
    } catch (_) { /* 上报失败不阻断本地中止 */ }
    try { anAbortRef.current?.abort(); } catch (_) { /* ignore */ }
    setAnBusy(false);
  };

  /** Stop a running analysis and tell the user (the explicit 「终止分析」 button). */
  const cancelAnalysis = () => {
    stopAnalysis();
    setAnError("已终止分析。");
  };

  /** Take over from the autopilot (#4).  Pausing halts the fill→advance loop
   *  and stops any analysis in flight; resuming clears the per-question guards
   *  so the survey drives itself again from the question on screen. */
  const toggleAutoPause = () => {
    if (!autoPaused) {
      stopAnalysis();            // halt the current model call too
      setAutoPaused(true);
      toast("info", "已暂停自动答题，你可以手动作答");
    } else {
      appliedRef.current = {};
      doneRef.current = {};
      analysedRef.current = {};
      autoSubmitRef.current = false;
      setAutoPaused(false);
      setAnNonce((n: number) => n + 1);   // re-trigger analysis of this question
      toast("info", "已恢复自动答题");
    }
  };

  // Show the result belonging to the question on screen.  Switching is a pure
  // cache lookup — it must never fire a model call by itself (REQ-002), and a
  // question analysed earlier keeps its own result instead of re-running.
  R.useEffect(() => {
    // #7 perf: answered (history) cards never show the analysis bubble, so the
    // per-question /analysis lookup is a useless request for them — and on a
    // refreshed long chat it multiplies across every historical survey.
    if (answered) return;
    const cached = qResultsRef.current[visStep];
    setAnResult(cached || null);
    const q = "?tool_call_id=" + encodeURIComponent(callId)
      + "&question_index=" + visStep;
    let alive = true;
    fetch(apiUrl("/question-modal/analysis") + q, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d || !d.found || !d.analysis) return;
        qResultsRef.current[visStep] = d.analysis;
        if (visStepRef.current === visStep) setAnResult(d.analysis);
      })
      .catch(() => { /* ignore */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, visStep]);

  // AI automation analyses **the question on screen**, and does so as the user
  // moves between questions (REQ-008) — never a whole-survey sweep.  Each
  // question is analysed at most once per card, so stepping back to an
  // already-analysed question is a pure read (REQ-002).
  R.useEffect(() => {
    if (answered) return;
    if (!prefsReadyRef.current) return;    // wait for the authoritative mode
    if (anMode !== "ai") return;
    // ★ 阶段 4（2026-11-07）：后端在线时**让位**，不要重复分析。
    //
    // 这里的守卫此前是缺失的 —— 而下面「驱动推进」effect（:4761）从阶段 2
    // 起就有对称的守卫。两者不对称的后果实测确证（verify_phase4_audit.py）：
    //
    //   后端 `_runner_loop` 对每道 ai 题调一次 `analyze_survey`（结果用于
    //   填答案）；前端这个 effect 又对同一题 `POST /analyze` 一次（结果只
    //   用于渲染气泡）。**同一题烧两份配额**，而用户当天已被 429 限流数百次，
    //   这正是「抢不到配额 → 看门狗 60s 释放」的同类故障。
    //
    // 让位后气泡怎么填？后端把每题结果写进 `per_question` 并广播，前端通过
    // 已有的 `/analysis` 回查路径（`qResultsRef` restore）拿到，语义不变。
    //
    // 降级：SSE 断开 → `backendDown=true` → 前端恢复自分析，与改动前一致。
    // 这是必须保留的降级路径：SSE 一挂就完全不分析的话，用户会看到空气泡。
    if (!backendDown) return;
    if (!argsReady(args) || !questions.length) return;
    if (analysedRef.current[visStep]) return;
    if (busy) return;                       // a run is already in flight
    analysedRef.current[visStep] = true;
    void runAnalysis("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, anMode, callId, anNonce, anCtx, anParallel, questions, visStep,
      // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
      // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
      backendDown]);

  /** Apply the model's recommendation for the CURRENT question, so the user
   *  can accept it and continue (the analysis is per question, REQ-004). */
  const applyAnalysis = () => {
    const per = (anResult && anResult.per_question) || [];
    if (!per.length) return;
    // 加固①：「套用推荐」只有在**真的取到 choice** 时才算成功。若本题分析
    // 失败/被截断（choice 为空，卡片只剩标题），此前会照常弹「已套用成功」
    // 却什么都没填——空操作假成功。这里改为如实告知，绝不谎报。
    const usable = per.some((p: any) => {
      if (p.type === "multi") {
        return String(p.choice || "").split(/[、,，]/).map((s) => s.trim()).filter(Boolean).length > 0;
      }
      return String(p.choice || "").trim().length > 0;
    });
    if (!usable) {
      toast("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    setAnswers((prev) => {
      const next: Record<string, QA> = { ...prev };
      per.forEach((p: any) => {
        const key = `q${p.index}`;
        markTouched(key);
        const cur = next[key] || { type: p.type, value: "", other: "" };
        if (p.type === "multi") {
          const chosen = String(p.choice || "")
            .split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
          next[key] = { ...cur, value: chosen };
        } else {
          next[key] = { ...cur, value: p.choice || cur.value };
        }
      });
      return next;
    });
    toast("success", "已套用 AI 推荐（可继续手工调整后提交）");
  };

  /** Close the card out: the survey can no longer be answered.
   *
   *  `released` records whether the *backend* block was already lifted.  It
   *  is informational only — every caller must go through `convergeAfterRelease`
   *  (or an explicit backend ack) so a card can never close while the agent is
   *  still parked, which is what left chats answering
   *  「A task is already running」forever. */
  const converge = (reason: string, notice: string, released = false) => {
    // Closing the card must also stop any analysis the AI is still running,
    // or the parked model request keeps the chat locked (#3).
    stopAnalysis();
    setDeadReason(reason);
    setSkippedAll(true);
    setLocalResult(notice);
    setStuck(false);
    setAnswered(true);
    forgetReqId(callId);
    // Deliberately KEEP the card-state blob (answered/skippedAll/localResult):
    // it makes the convergence stick across remounts and page reloads, so a
    // stranded card shows the notice instead of probing again.
    if (released) mergeCardState(callId, { backendReleased: true });
  };

  /** Lift the backend block, then close the card.  The card is only closed
   *  once the backend confirms it (or confirms the record is gone); a network
   *  failure leaves the card probing, because the survey may still be alive
   *  behind a temporary outage.  Returns true when the card was closed. */
  const convergeAfterRelease = async (
    reason: string, notice: string,
  ): Promise<boolean> => {
    const rel = await releaseBackend(callId, cardSessionId(callId));
    if (!rel.ok) {
      // Could not lift the block — keep the card (and the rescue button) so
      // the user can retry, instead of pretending the survey is over.
      setStuck(true);
      setUploading(false);
      return false;
    }
    converge(reason, notice, rel.released);
    return true;
  };

  // ── Persist the whole interaction state on every change ──
  //
  // The card lives in a virtualised list and is unmounted whenever it scrolls
  // out of view; the host also remounts it when a message is re-keyed (it
  // merges a tool call and its output into ONE list item, so the React key
  // changes the moment the output arrives — chat-vendor `mergeToolMessages`).
  // Every field that drives the UI is therefore mirrored to localStorage,
  // keyed by the tool call id.
  //
  // Written IMMEDIATELY (no debounce).  This used to be a 400ms trailing
  // debounce, which left a window in which a remount silently discarded a
  // selection the user had just made — the reported 「点击选项后被取消」.
  // A click's state update commits in the same tick, so persisting here is
  // durable well before any host-driven remount (which needs a fresh SSE
  // event) can occur.
  R.useEffect(() => {
    // 阶段 1：`remoteSyncRef` 已随 localStorage 跨标签同步一起移除。
    // 现在「别处写入」走 SSE → adopt() → 它会重建 localStorage，
    // 而本 effect 回写的是同一份数据（值相同），不会再形成乒乓。
    // Reconcile against the durable copy BEFORE writing it back: keys this
    // instance never touched must keep whatever a sibling instance recorded.
    // Without this, a remounted (pristine) instance would immediately overwrite
    // the user's persisted click with its empty initializer — destroying the
    // very evidence the submit-time reconcile needs.
    const stored = loadCardState(callId)?.answers;
    mergeCardState(callId, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId,
      visStep,
      answers: reconcileWithPersisted(answers, stored, touchedRef.current),
      finalOther, finalOtherAtt,
      answered, skippedAll, expanded, localResult, submittedAt, skipReason,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft, waitRetired,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt, slowStep, slowFired,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason,
      gateBlocked,
      releasedNote,
      autoPaused, templateId: tplId,
    });
  }, [callId, reqId, visStep, answers, finalOther, finalOtherAtt,
      answered, skippedAll, expanded, localResult, submittedAt, skipReason,
      pastSoft, waitRetired, slowAt, slowStep, slowFired,
      deadReason, autoPaused, tplId,
      gateBlocked, releasedNote]);

  // ── 等待行的后台生命周期（2026-10-22 四次裁定：去掉前台读秒）──
  // 一条 effect、一个低频定时器（BG_POLL_MS）、**零 MutationObserver**。
  // 每轮只做三件事，全部排在浏览器空闲时段（whenIdle）跑：
  //   1. 到寿命上限 → 整行退休（必要渲染之一）；
  //   2. 越过阻塞阈值 → 文案升级为释放指引（必要渲染之二，只做一次）；
  //   3. 「卡外文本」比基线净增长 ≥ RESUME_MIN_GROWTH → 判到 agent 已继续输出，
  //      **只停轮询、不改视图**（用户裁定 q0=静）。于是既不可能谎报「等待 0s」，
  //      也不会"闪一下就消失"让用户以为没有反馈。
  // 成本：等待期内 React 渲染次数 ≤ 2；旧版每秒重建整棵卡片（≈10 节点/秒跑满
  // 180s），且 MutationObserver 在流式输出期高频做全量 DOM 扫描抢占主线程——
  // 用户说的「提交后模型等几秒才输出」正是被这个抢占拖住渲染（后端放行时刻
  // 有 kind=answered 记录为证，与前端无关）。现在两条都归零。
  R.useEffect(() => {
    if (!answered || !submittedAt || waitRetired) return undefined;
    // 只服务「本实例真的提交过 / 或挂载仍在寿命窗口内的近期卡」；历史卡零计时。
    if (!observedWaitRef.current) return undefined;
    let id = 0;
    let dead = false;
    // 基线**同步**采集，不等第一次轮询：越晚采集，提交后立刻恢复的那段输出就被
    // 算进基线而"看不见"，于是 20s 后被误报成「已越过阻塞阈值，多为限流」。
    // 这一刻卡片刚切到只读态，宿主顶多有个「生成中」占位气泡（textContent="-"），
    // 已被 _meaningfulLen 净化，不会污染基线。-1 = 定位不到本卡，轮询里会重试。
    let base = externalTextLen(callId);

    const round = () => {
      if (dead) return;
      const waited = Math.floor((Date.now() - submittedAt) / 1000);
      // 1) 寿命上限：整行退休，后台计时随之结束。
      if (waited >= waitHintSec) {
        bgDoneRef.current = true;
        setWaitRetired(true);
        return;
      }
      // 2) 后台判定：卡片之外是否已出现可读的模型输出。**必须先于**下面的越阈
      //    升级——否则同一轮里"明明已判到模型在输出"却紧接着显示"已越过阻塞
      //    阈值，多为模型限流/报错"，那就是彻头彻尾的假警报。
      if (!bgDoneRef.current) {
        const ext = externalTextLen(callId);
        if (ext >= 0) {
          if (base < 0) base = ext;
          else if (ext - base >= RESUME_MIN_GROWTH) bgDoneRef.current = true;
        }
      }
      // 3) 越过阻塞阈值：**仅在没判到输出时**才升级文案。用 ref 守（pastSoft 不
      //    进依赖数组），否则 setState → 依赖变化 → 整条轮询链重启、基线被重置，
      //    判定被推晚一个轮询周期。
      if (!bgDoneRef.current && waited >= WAIT_SOFT_SEC && !pastSoftFiredRef.current) {
        pastSoftFiredRef.current = true;
        setPastSoft(true);
      }
      if (bgDoneRef.current) {
        // 判到了 → **彻底停止轮询**（用户要求"判到前台已有输出则停止计时"）。
        // 剩下唯一一次排程是到上限把这一行退休，期间零回调、零 DOM 访问。
        id = setTimeout(() => { if (!dead) setWaitRetired(true); },
                        Math.max(1000, (waitHintSec - waited) * 1000));
        return;
      }
      id = setTimeout(() => { if (!dead) whenIdle(round); }, BG_POLL_MS);
    };

    whenIdle(round);
    return () => { dead = true; clearTimeout(id); };
  }, [answered, submittedAt, waitRetired]);


  // ── Attachment plumbing ──
  //
  // The file input itself lives at module scope (see getFileInput): opening
  // the OS dialog blurs the window, and re-focusing it makes the host remount
  // this card, so a card-owned <input> would be detached before its `change`
  // ever fired.  Here we only SUBSCRIBE to the module-level delivery channel.
  const [uploading, setUploading] = R.useState(false);
  const [attError, setAttError] = R.useState("");

  // Apply attachments to whichever question is on screen at delivery time.
  const applyAtts = (atts: Attachment[], target: string, key: string) => {
    if (!atts.length) return;
    if (target === "final") {
      setFinalOtherAtt((prev) => prev.concat(atts));
    } else {
      setAnswers((prev) => {
        const k = key || `q${visStep}`;
        markTouched(k);
        const cur = prev[k] || { type: "text", value: "", other: "" };
        return { ...prev, [k]: { ...cur, attachments: (cur.attachments || []).concat(atts) } };
      });
    }
  };

  R.useEffect(() => {
    if (!callId) return;
    const onAtts = (atts: Attachment[], target: string, key: string, failed?: string[]) => {
      applyAtts(atts, target, key);
      if (failed && failed.length) setAttError(failed.join("；"));
      else setAttError("");
    };
    const onBusy = (b: boolean) => setUploading(b);
    _attListeners.set(callId, onAtts);
    _busyListeners.set(callId, onBusy);
    // Pick up anything that finished while this card was unmounted.
    const stashed = takeStashedAttachments(callId);
    if (stashed.length) {
      stashed.forEach((s) => applyAtts([s.att], s.target, s.key));
    }
    setUploading(_uploadBusy > 0);
    return () => {
      if (_attListeners.get(callId) === onAtts) _attListeners.delete(callId);
      if (_busyListeners.get(callId) === onBusy) _busyListeners.delete(callId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, visStep]);

  const openPicker = (target: "q" | "final", key: string) =>
    requestFilePick(callId, target, key);

  /** Paste a file anywhere in the「其他」box / text answer, like the composer. */
  const onPasteFiles = (e: any, target: "q" | "final", key: string) => {
    const files = pasteFiles(e);
    if (!files.length) return;                 // plain text → let it through
    try { e.preventDefault(); } catch (_) { /* ignore */ }
    // Paste has no OS dialog and no remount in between; go straight to upload.
    void deliverPickedFiles(files, callId, target, key);
  };

  // ── Folded history card → recover the real answer from the backend ──
  //
  // The host replaces old tool results with a pointer stub once the session
  // grows, so a card rendered from history has no inline answer to show.
  // Look it up by tool_call_id; if the backend no longer remembers it (the
  // result cache lives in memory and dies with a restart), degrade to a
  // neutral notice — never render the English stub as if it were the answer.
  R.useEffect(() => {
    if (!folded || recovered) return;
    let alive = true;
    fetchStoredResult(callId).then((r) => {
      if (!alive || !r) return;
      if (r.kind === "skipped" && !r.answers) setSkippedAll(true);
      // 后端 /result 现在带 skip_reason / skipped_by；折叠历史卡也要能显示原因。
      const rr = String(r.skip_reason || "").trim();
      if (rr) setSkipReason((prev) => prev || rr);
      setRecovered(formatStoredResult(questions, r));
    });
    return () => { alive = false; };
  }, [folded, callId, recovered]);
  // `useEffect` above intentionally depends only on these primitives; adding
  // `questions` would re-run on every render (new array identity).

  // ── ★ 历史卡救援：挂载即问后端「这张卡是否已经答过」(2026-11-09) ──
  //
  // 用户报障：历史卡片明明已正常结束，却渲染成**可点上下题的答题态**，
  // 部分还提示「问卷已失效」。
  //
  // 根因是 `answered` 的三条判据同时失效：
  //   ① `saved`（localStorage 卡片态）会被 `sweepStoredStates()` 清掉 ——
  //      **超 7 天删除**、**超 80 条按最旧淘汰** → 老卡片拿不到；
  //   ② 长会话里宿主会把旧 tool result **整个裁剪**（不是折叠成 stub）→
  //      `outputText=""` 且 `folded=false`；
  //   ③ ⇒ `answered=false` → 按「新问卷」渲染 → 答题按钮回来了。
  // 接着它以「未答」身份去轮询 `/survey-state`，而该表是**内存表**（及可被
  // prune 清理的落盘），查不到 → 12 次 + 45s 后 `die("gone")` → 「已失效」。
  //
  // `/result` 是**磁盘持久化**的已答记录（`answered_results.json`，按
  // tool_call_id 存），不受内存清理影响 —— 这是唯一可靠的真相源。
  // 所以挂载时直接问它：有记录就立刻切只读，不再走探测/收敛那条路。
  //
  // 注意门控 `!answered`：已是只读的卡不重复请求（历史卡零请求原则）。
  R.useEffect(() => {
    if (answered || !callId) return;
    // 有内联 output 的卡不需要救援：那本来就是宿主给的真实结果。
    if (outputText) return;
    let alive = true;
    fetchStoredResult(callId).then((r) => {
      if (!alive || !r) return;
      if (r.kind === "skipped" && !r.answers) setSkippedAll(true);
      const rr = String(r.skip_reason || "").trim();
      if (rr) setSkipReason((prev) => prev || rr);
      // 答案文本既用于只读渲染，也是「这张卡真的答过」的证据。
      setRecovered((prev) => prev || formatStoredResult(questions, r));
      setLocalResult(formatStoredResult(questions, r));
      setAnswered(true);
      forgetReqId(callId);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, answered, outputText]);

  // Resolve THIS card's pending record (matched by tool_call_id, so stale
  // cards in the same history can never resolve someone else's question),
  // and detect an answer given before a page reload.
  //
  // Order: restore a remembered request_id and *validate* it → fall back to
  // a fresh lookup by tool_call_id → keep whatever we learn in localStorage.
  R.useEffect(() => {
    if (answered) return;
    let alive = true;
    let tries = 0;
    // 连续网络失败计数（成功一次即清零）。用于把「无限 5 秒心跳」改成
    // 用户裁定的方案C：先转分钟级低频探活，超时再彻底停。见 NET_* 常量。
    let netFails = 0;
    let firstNetFailAt = 0;
    let netStopped = false;
    let wakeBound = false;
    let timer: any = 0;
    let stuckTimer: any = 0;
    if (!firstTryAt.current) firstTryAt.current = Date.now();

    // Did this card ever hold a usable id?  A record that *was* pending and
    // is now gone is definitively over — no need to keep probing.  A record
    // we have never seen may simply be racing the backend's create(), so
    // that case gets a grace period instead of instant convergence.
    let everHadId = !!recallReqId(callId);
    // `/result` 救援只做一次（见 retryLater）：避免轮询变成两个端点的双倍流量。
    let rescueTried = false;

    const succeed = (p: any) => {
      if (!alive || !p || !p.request_id) return;
      everHadId = true;
      // 成功即清零：正常的创建竞态不该被计入"持续失败"，否则会误降频。
      netFails = 0;
      firstNetFailAt = 0;
      netStopped = false;
      setReqId(p.request_id);
      setStuck(false);
      // Stop probing — we have a usable id now.
      //
      // NOTE: the rescue countdown is deliberately NOT cancelled here.  It
      // used to be, which meant the「释放本次问卷」button only ever appeared
      // when the card could not reach the backend at all — a *healthy* card
      // blocking the chat had no escape hatch, and that is exactly what the
      // user reported ("等待并没有出现释放按钮").  The countdown is about the
      // chat being parked, not about connectivity, so it keeps running.
      if (timer) { clearTimeout(timer); timer = 0; }
      rememberReqId(callId, p.request_id,
                    p.session_id || currentSessionId(), p.agent_id);
    };

    /** The backend says this survey can never be answered again.
     *
     *  "Gone"/"orphan" describes the *record*; it does NOT prove the agent
     *  stopped waiting.  The card must therefore lift the backend block before
     *  it disappears, otherwise the chat stays locked with「A task is already
     *  running」— the exact field failure this guards against. */
    const die = (reason: string) => {
      if (!alive) return;
      if (timer) { clearTimeout(timer); timer = 0; }
      if (stuckTimer) { clearTimeout(stuckTimer); stuckTimer = 0; }
      void convergeAfterRelease(reason,
        reason === "orphan"
          ? "本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。\n"
            + "无需再操作，请直接在对话中继续。"
          : "本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。\n"
            + "无需再操作，请直接在对话中继续。");
    };

    // ① A stored id is only trusted after the backend confirms it is still
    //    pending and still belongs to this very tool call.
    const stored = recallReqId(callId);
    const verifyStored = async () => {
      if (!stored) return false;
      const chk = await checkPendingById(stored.request_id);
      if (!alive) return true;               // torn down; stop quietly
      if (chk.kind === "found") {
        const d = chk.data;
        // Option 3: reject an id that now points at someone else's call.
        if (d.tool_call_id && callId && d.tool_call_id !== callId) {
          forgetReqId(callId);
          return false;
        }
        succeed(d);
        return true;
      }
      if (chk.kind === "orphan") { die("orphan"); return true; }
      if (chk.kind === "absent") forgetReqId(callId);  // stale → re-resolve
      return false;                                     // error → try source
    };

    // Keep probing — with no timeout by design, a dead panel would strand
    // the whole chat, so we must revive ourselves when the backend returns:
    // fast for the first few tries, then a slow 5s heartbeat forever.
    //
    // `absentOnly` marks the one case that can end in convergence: the
    // backend ANSWERED and said it has no such record.  A network failure
    // must never be mistaken for that — the survey may be perfectly alive
    // behind a temporary outage, so that path retries indefinitely.
    const retryLater = (absentOnly = false) => {
      if (!alive) return;
      tries += 1;
      // absentOnly=true 代表**后端答了话**（明确说没有这条记录），属确定性结果，
      // 不能算网络失败 —— 否则会把本该收敛的路径误降频。
      if (!absentOnly) {
        netFails += 1;
        if (!firstNetFailAt) firstNetFailAt = Date.now();
      }
      if (absentOnly) {
        // ★ 判「失效」之前必须先问 `/result`（2026-11-09）。
        //
        // `absentOnly` 只说明 **`/survey-state` 这张内存表**里没有该记录，
        // ≠「问卷没答过」。真实故障：已答记录在 `/result`（磁盘持久化）
        // 里好好的，但 state 表被清理过（prune / 插件重启 / 我这轮就清掉了
        // 110 条），于是旧逻辑直接 `die("gone")`，用户看到「问卷已失效」——
        // 而答案其实一直可查。
        //
        // 所以：先查 `/result`，有记录就**立刻切只读**（这才是如实状态）；
        // 确实没有才继续走原来的收敛判定。用 `rescueTried` 保证只查一次，
        // 不把轮询变成两个端点的双倍流量。
        if (!rescueTried) {
          rescueTried = true;
          fetchStoredResult(callId).then((r) => {
            if (!alive) return;
            if (r) {
              if (r.kind === "skipped" && !r.answers) setSkippedAll(true);
              const rr = String(r.skip_reason || "").trim();
              if (rr) setSkipReason((prev) => prev || rr);
              setRecovered(formatStoredResult(questions, r));
              setLocalResult(formatStoredResult(questions, r));
              setAnswered(true);
              forgetReqId(callId);
              return;                     // 已确定答过 → 不再判 gone
            }
            retryLater(true);             // 确认没答过 → 走原判定
          });
          return;
        }
        // Definitive-miss escape hatch.  Without it a lost record meant the
        // card probed forever while「提交」/「跳过」answered「尚未就绪」.
        if (everHadId) { die("gone"); return; }
        const elapsed = Date.now() - (firstTryAt.current || Date.now());
        if (tries >= 12 && elapsed >= GONE_AFTER_MS) { die("gone"); return; }
      }
      // ── 退避决策（2026-11-13 反代拦截修复）──────────────────────
      //
      // 旧实现：`tries < 8 ? 700 : 5000` —— 前 8 次 700ms，之后**永远 5 秒**。
      // 后者在域名被 WAF 拦截时会持续制造请求，进而触发更严格的封禁。
      //
      // 新实现按「连续网络失败」而不是「总尝试次数」分档（成功会自动清零，
      // 所以正常的"问卷还没建好"竞态仍走快速重试，手感不变）：
      //   前 N 次失败   → 700ms 快速重试（正常竞态）
      //   达阈值        → 60s 低频探活（保留自愈，请求量降到 1/60）
      //   持续超 15 分钟 → 彻底停止（不再产生任何请求）
      if (netFails >= NET_FAIL_BEFORE_SLOW) {
        const failingFor = Date.now() - (firstNetFailAt || Date.now());
        if (failingFor >= NET_GIVEUP_AFTER_MS) {
          // 停止探测。卡片保留现状与「释放本次问卷」出口，不再打后端。
          // 用户切回标签页 / 手动点「释放」仍可恢复（见下面的 focus 唤醒）。
          netStopped = true;
          // 彻底停也要留一条**用户可触发**的恢复通道：切回标签页即重新探一次。
          // 用户裁定方案C 的"彻底停"是"不再自动产生请求"，不是"永久瘫痪"。
          if (!wakeBound) {
            wakeBound = true;
            try {
              if (typeof document !== "undefined" && document.addEventListener) {
                document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible") return;
                    if (!alive || !netStopped) return;
                    // 用户回来了 → 清零计数、重新快速探测一轮。
                    netStopped = false;
                    netFails = 0;
                    firstNetFailAt = 0;
                    tries = 0;
                    tick();
                  } catch (_) { /* ignore */ }
                });
              }
            } catch (_) { /* 无 DOM 环境（harness）→ 仅保留低频探活语义 */ }
          }
          return;
        }
        timer = setTimeout(tick, NET_SLOW_PROBE_MS);
        return;
      }
      timer = setTimeout(tick, tries < NET_MAX_FAST_TRIES ? NET_FAST_RETRY_MS : 5000);
    };

    // ② Fresh lookup by tool_call_id (+ session), then the "already answered
    //    in a previous page load" probe.
    const fromSource = () => {
      resolvePending(callId, cardSessionId(callId)).then((res) => {
        if (!alive) return;
        if (res.kind === "found") { succeed(res.data); return; }
        if (res.kind === "orphan") { die("orphan"); return; }
        if (res.kind === "error") { retryLater(false); return; }  // unreachable
        // absent → we may simply have had nothing to ask with (no call id and
        // no host-provided session).  Try the sole-pending fallback before
        // concluding anything.
        resolveSolePending().then((sole) => {
          if (!alive) return;
          if (sole) {
            // Refuse a survey that belongs to a *different* tool call: that is
            // another card's question, and answering it here would hijack it.
            if (sole.tool_call_id && callId && sole.tool_call_id !== callId) {
              fetchStoredResult(callId).then((r) => {
                if (!alive) return;
                if (r) { setAnswered(true); forgetReqId(callId); return; }
                retryLater(true);
              });
              return;
            }
            succeed(sole);
            return;
          }
          // absent → maybe already answered in a previous page load.
          fetchStoredResult(callId).then((r) => {
            if (!alive) return;
            if (r) {
              if (r.kind === "skipped" && !r.answers) setSkippedAll(true);
              const rr = String(r.skip_reason || "").trim();
              if (rr) setSkipReason((prev) => prev || rr);
              setAnswered(true);
              forgetReqId(callId);
              return;
            }
            retryLater(true);
          });
        });
      });
    };

    const tick = () => {
      if (!alive) return;
      if (!stored) { fromSource(); return; }
      verifyStored().then((handled) => {
        if (!alive || handled) return;
        fromSource();
      });
    };

    // Countdown to the escape hatch.  Measured from the moment the card
    // appears, not from a failure: while a survey is blocking, the chat
    // answers every new message with 409「A task is already running」, so the
    // user must always be able to release it — even when the card itself is
    // perfectly healthy.  `succeed()` intentionally leaves this running.
    stuckTimer = setTimeout(() => { if (alive) setStuck(true); }, STUCK_AFTER_MS);

    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      if (stuckTimer) clearTimeout(stuckTimer);
    };
  }, [answered, callId]);

  // Self-rescue: the survey is blocking the whole chat, and this card cannot
  // reach the backend for its request_id.  Release the block so the host
  // stops answering 409「A task is already running for this chat」and the
  // user can keep talking.  Skips THIS tool call only — other pending
  // surveys in the same session are untouched.
  const rescue = async () => {
    setBusy(true);
    try {
      // Explicit user action → two stages.  First the plugin's own endpoints
      // (/skip by request_id, then the session-wide /cancel-session).  If they
      // cannot actually release anything, escalate to the host's run stop,
      // because only that can unpark an agent whose Future lives in an older
      // service.  That escalation is deliberately kept OUT of
      // `releaseBackend` so the automatic convergence paths can never cancel a
      // healthy run.
      //
      // Note the cross-instance shape: localStorage still holds the old
      // request_id, so /skip runs and answers 404 (the new service never had
      // that record) → reason "gone"/"none" with released=false.  Those are
      // exactly the cases that must escalate.
      const sid = cardSessionId(callId);
      let rel = await releaseBackend(callId, sid);
      // Escalate whenever the plugin could not *prove* it unparked anything.
      //
      // "orphan" is the treacherous one: the record was found on disk but has
      // no live Future in the answering service — the classic shape after a
      // hot reload, where the parked Future belongs to the *older* module
      // generation.  It reads as released:true, yet the agent is still parked,
      // so it must escalate too.
      //
      // A network failure is deliberately NOT escalated: the survey may be
      // perfectly alive behind a transient outage, and cancelling the run
      // would be strictly worse than telling the user to retry.
      const unproven = !rel.released || rel.reason === "orphan";
      if (unproven && rel.reason !== "network" && sid) {
        const hs = await hostStopFallback(sid);
        if (hs.ok && hs.released) rel = hs;
        else if (hs.ok && !rel.ok) rel = { ok: true, released: false, reason: "gone" };
      }
      if (!rel.ok) {
        throw new Error(
          rel.reason === "network"
            ? "网络不可达，未能释放；请稍后重试"
            : "未能取得问卷句柄（" + rel.reason + "）");
      }
      if (rel.released) {
        // The agent is unparked; close the card out.  A user-initiated
        // release is a *skip*, not a failure — only a dead record earns the
        //「已失效」styling.  The host-stop path is different: it cancels the
        // run outright, so the agent will NOT resume — say so plainly instead
        // of promising「会话可继续」.
        const viaHost = rel.reason === "host-stop";
        converge(rel.reason === "orphan" ? "orphan" : "",
          rel.reason === "orphan"
            ? "本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。\n"
              + "无需再操作，请直接在对话中继续。"
            : viaHost
              ? "本次问卷已释放：已直接终止本次运行，会话可继续对话。\n"
                + "（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）"
              : "用户跳过了本次问卷。",
          true);
        toast("info",
          viaHost ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续");
      } else {
        // Nothing was pending any more — the block is already gone.
        converge("gone",
          "本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。\n"
          + "无需再操作，请直接在对话中继续。",
          true);
        toast("info", "本次问卷已失效，已关闭");
      }
    } catch (e: any) {
      toast("error", "释放失败: " + (e && e.message ? e.message : e));
    } finally { setBusy(false); }
  };

  // Escape hatch for a card that already shows its answer/skip summary but
  // whose chat is *still* locked (409).  Same two-stage backend release as
  // `rescue`, deliberately WITHOUT calling `converge`: an answered card must
  // keep showing the user's submission, so the outcome goes to a side note.
  const releaseBlocked = async () => {
    setBusy(true);
    try {
      const sid = cardSessionId(callId);
      let rel = await releaseBackend(callId, sid);
      const unproven = !rel.released || rel.reason === "orphan";
      if (unproven && rel.reason !== "network" && sid) {
        const hs = await hostStopFallback(sid);
        if (hs.ok && hs.released) rel = hs;
        else if (hs.ok && !rel.ok) rel = { ok: true, released: false, reason: "gone" };
      }
      if (!rel.ok) {
        setReleasedNote(rel.reason === "network"
          ? "网络不可达，未能释放；请稍后重试。"
          : "未能取得问卷句柄（" + rel.reason + "）。");
        toast("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (rel.released) {
        const viaHost = rel.reason === "host-stop";
        setReleasedNote(viaHost
          ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）"
          : "已释放本次问卷的阻塞，会话可继续。");
        toast("info", viaHost ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else {
        setReleasedNote("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。"
          + "若发新消息仍报 A task is already running，请点宿主输入框的「停止」。");
        toast("info", "后端已无此阻塞，无需释放");
      }
    } catch (e: any) {
      toast("error", "释放失败: " + (e && e.message ? e.message : e));
    } finally { setBusy(false); }
  };

  // Conditional visibility: only questions whose `showIf` currently holds
  // are shown.  Navigation, the progress counter and submission all work on
  // that visible list, so a question can appear/disappear as answers change.
  const visList = visibleIndices(questions, answers);
  const totalVis = visList.length;
  const isOtherPage = visStep >= totalVis;
  const curIdx = !isOtherPage ? visList[visStep] : -1;

  // 阶段 1：`shadowStateRef` 快照写入已移除（影子比对通道被 SSE 双向同步取代）。

  // 题级计时用的"当前槽位"：真实题目用其位置 visStep，「其他意见」末页用
  // totalVis（真实题号恒 < totalVis，故永不冲突）。这样末页与普通题共享同一
  // 套"切页即清零"的逻辑，无需第二份状态。
  const stepSlot = isOtherPage ? totalVis : visStep;

  // ── 题级用时计时（2026-10-22 五次裁定）──
  // 每题独立 60s：切到下一题或退回上一题都清零重计（q0）；超时只提示、不强制
  // 不跳题（q1）；到点后计时停在该值，故**不需要每秒渲染**（q2）。
  // 「切题清零」的落点就是把起点绑到当前 visStep：`slowStep !== visStep` 即视为
  // 本题从未计过时，立刻从此刻重新起算。
  // ── 人工模式提醒（裁定：仅人工模式 + 每份问卷只弹一次）──
  //
  // Deliberately an effect rather than inline in render: it must run AFTER the
  // effective config resolves (that is what tells us the mode), and it must not
  // fire on every re-render.  `_notifiedCards` + the localStorage marker make it
  // once-per-survey even across remounts and page reloads.
  R.useEffect(() => {
    // 必须先等 effective-config 真正解析完再判断模式。
    // 首帧 `effCfg` 只有内建默认值（没有 `mode`），此时 `cfgOf("mode", …)`
    // 会回落到 prefs 镜像的默认值（manual）——于是「AI 模式」的问卷会在
    // 配置到达之前先弹一次提醒，等 setAnMode("ai") 落地已经来不及收回。
    // 真机实测的失败形态：切到 AI 模式后仍收到「有 2 道题等你作答」。
    // harness 抓不到，因为它的微任务顺序让 hydrate 先于 effect 完成。
    // 判定必须读 **配置里的 mode**，不能读 `anMode` 状态。
    // 真机探针证据：同一次渲染里 effCfg.mode 已是 "ai"，而 anMode 还是旧的
    // "manual" —— 因为 hydrate 的 setEff(c) 与 setAnMode(...) 在同一次更新里
    // 提交，effect 看到的是「新 effCfg + 旧 anMode」，于是给 AI 模式的问卷发了
    // 提醒（真实失败形态：切到 AI 后仍收到「有 2 道题等你作答」）。
    // harness 的微任务顺序让 setAnMode 先落地，所以它一直是绿的。
    const cfgModeNow = normMode(cfgOf("mode", "manual"));
    if (cfgModeNow !== "manual") return;       // AI/只用推荐 会自己推进，不需要提醒
    if (!cfgOf("notify_manual_mode", false)) return;
    if (answered || skippedAll || deadReason) return;  // 已经不在等作答
    if (!argsReady(args) || !questions.length) return; // 题还没到手
    // 用页面已有的 filledAnswer 判定（与「未作答拦截」同一套规则），
    // 避免另造一套判定导致两处结论不一致。
    const pending = visibleIndices(questions, answers)
      .filter((i: number) => !filledAnswer(answers[`q${i}`])).length;
    void notifyManualSurvey(callId, title, pending);
    // 依赖只放「判定是否还需要提醒」的量；questions 的内容变化不该重复触发，
    // 真正的去重靠 notifyManualSurvey 内部的 callId 标记。
  }, [effCfg, answered, skippedAll, deadReason, stepSlot]);

  // 阈值来自生效配置（会话覆盖 > 全局默认 > 内建）。0 = 用户关闭了提示。
  // 变化的阈值必须让 effect 重算剩余时间，否则改成更长的阈值后这一题会
  // 沿用旧起点、提前/延后触发——所以它进了依赖数组。
  const slowMs = Math.max(0, Number(cfgOf("slow_question_sec", SLOW_Q_SEC_DEFAULT)) || 0) * 1000;
  /** Same threshold, rendered: the warning text must quote the CONFIGURED
   *  number (a 5s setting must not announce "60s"). */
  const slowSecShown = Math.round(slowMs / 1000);

  R.useEffect(() => {
    // 已提交/已跳过/已失效的卡不再计题级用时（它已经不在作答阶段）。
    if (answered || skippedAll || deadReason) return undefined;
    // 「关闭」= 0 秒：用户把提示关掉了，不该再白排一个定时器。
    if (slowMs <= 0) return undefined;
    // 八次裁定（用户实测：「在『其他意见』末页等满 60 秒，没有出现超时提示」，
    // 随后裁定「末页也要算 60s」）。原实现对末页 `return undefined`，等于末页
    // 等多久都不提示——这是设计遗漏，不是偶发故障。
    // 末页复用同一套题级状态，题号槽位取 `OTHER_STEP`（= totalVis，永不与真实题号
    // 冲突），因此「末页 → 回上一题 → 再回末页」也和切题一样会清零重计。
    // 切题（含进出末页）→ 起点归零，从当前时刻重新计时。
    if (slowStep !== stepSlot) {
      setSlowStep(stepSlot);
      setSlowAt(Date.now());
      setSlowFired(false);
      return undefined;   // 下一轮 render 会以新起点继续排定时器
    }
    if (!slowAt) { setSlowAt(Date.now()); return undefined; }
    if (slowFired) return undefined;              // 已提示过且计时停在阈值
    const remain = slowAt + slowMs - Date.now();
    if (remain <= 0) { setSlowFired(true); return undefined; }
    // 单次定时器：到点只渲染一次。注意 remain 在重挂载后是**剩余**时间，
    // 所以「等 59s 后滚一下卡片」不会把等待清零（只存布尔值就会）。
    let dead = false;
    const id = setTimeout(() => { if (!dead) setSlowFired(true); }, remain);
    return () => { dead = true; clearTimeout(id); };
  }, [answered, skippedAll, deadReason, stepSlot, slowStep, slowAt, slowFired, slowMs]);

  const q = curIdx >= 0 ? questions[curIdx] : null;
  const key = `q${curIdx}`;
  const ans: QA = (curIdx >= 0 && answers[key])
    || { type: qType(q), value: qType(q) === "multi" ? [] : "", other: "" };
  const setAns = (a: QA) => {
    // Any active interaction (choosing an option / typing text) revives a
    // question the user had stepped past, so clear its skip marker.  Without
    // this, "跳过本题 → 上一步 → 重新作答" would still be rendered as
    // （用户跳过本题） in the submitted answers.
    if (gateBlocked) setGateBlocked("");   // a real answer clears the banner
    if (curIdx >= 0) markTouched(`q${curIdx}`);
    const next: Record<string, QA> = { ...answers, [key]: { ...a, skipped: false } };
    // Drop answers of questions the new selection just hid, so no stale
    // answer is submitted for a question the user can no longer see.
    const vis = visibleIndices(questions, next);
    questions.forEach((_q, i) => {
      if (vis.indexOf(i) === -1) delete next[`q${i}`];
    });
    // WRITE-THROUGH: persist synchronously inside the event handler, not just
    // via the deferred effect.  The reported field loss happened because the
    // host unmounted this instance BEFORE the passive effect flushed — the ✓
    // painted but localStorage never got the click, so the fresh instance had
    // nothing to restore.  A synchronous write makes the click durable in the
    // same tick it is made, immune to the remount race.
    mergeCardState(callId, {
      answers: reconcileWithPersisted(next, loadCardState(callId)?.answers, touchedRef.current),
    });
    setAnswers(next);
  };

  // Keep the cursor in range when a change shrinks the visible list.
  R.useEffect(() => {
    if (visStep > totalVis) setVisStep(totalVis);
  }, [totalVis, visStep]);

  /** POST and return the parsed body; throws with the server's detail. */
  const doPostJson = async (path: string, body: object): Promise<any> => {
    const resp = await fetch(apiUrl(path), {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const err: any = new Error((data && data.detail) || ("HTTP " + resp.status));
      err.status = resp.status;
      throw err;
    }
    return data;
  };

  /** Reconcile the live `answers` with the durable localStorage copy.  Returns
   *  the authoritative map (persisted wins for any key this instance never
   *  touched — see `reconcileWithPersisted`).  Called at submit/skip time so a
   *  host-driven remount cannot ship an all-empty survey. */
  const authoritativeAnswers = (): Record<string, QA> =>
    reconcileWithPersisted(answers, loadCardState(callId)?.answers, touchedRef.current);

  /** True when every visible question is still the pristine initializer (no
   *  value / other / attachment / skip).  Such a submit is almost always a lost
   *  selection (the remount bug) or an accidental empty click — never intentional. */
  /** Which VISIBLE questions are still unanswered (no value/other/att/skip)?
   *  Shared by the submit gate and the 下一步 gate so both reject identically
   *  and emit the same durable evidence (用户裁定 2026-10-21：逐题必须表态). */
  /** 未作答拦截开关（设置 → 作答 → 未作答时拦截翻页）。
   *
   *  Read LIVE from the effective config on every gate call rather than being
   *  captured once: the setting is edited in a separate React tree, and a
   *  captured constant would keep enforcing the old rule until the card
   *  remounts.  Defaulting to `true` keeps the historical behaviour for any
   *  card whose config never resolves.
   */
  const gateEnabled = (): boolean => !!cfgOf("gate_unsaved", true);

  const missingOf = (eff: Record<string, QA>, only?: number): number[] => {
    // 关掉拦截 = 允许空题直接前进；返回空数组让所有调用点自然放行，
    // 闸门代码本身不需要第二套分支。
    if (!gateEnabled()) return [];
    const out: number[] = [];
    if (typeof only === "number") {
      if (visibleIndices(questions, eff).indexOf(only) !== -1
          && !filledAnswer(eff[`q${only}`])) out.push(only + 1);
      return out;
    }
    const vis = new Set(visibleIndices(questions, eff));
    questions.forEach((_q, i) => {
      if (vis.has(i) && !filledAnswer(eff[`q${i}`])) out.push(i + 1);
    });
    return out;
  };

  /** Show the persistent red banner + POST one audit line.  Doubles as proof
   *  of which bundle ran: a stale pre-gate bundle can never draw this line. */
  const fireGate = (missing: number[], eff: Record<string, QA>, verb: string) => {
    // 用户裁定（2026-10-21）：红条只说「必须选择」+ 按钮指引，不出现内部术语
    // （"严格闸门拦截"）与调试指纹。指纹改挂 DOM 属性 data-qm-bundle —— 用户
    // 看不到，但仍可取证（区分「闸门没生效」vs「浏览器跑旧包」），且后端
    // /gate-block 落盘照旧带 bundle 字段。
    const nums = "第 " + missing.join("、") + " 题";
    const hint = verb === "提交"
      ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。"
      : "请选择后再继续；如需跳过，请点「跳过本题」。";
    setGateBlocked("⛔ " + nums + "尚未选择。" + hint);
    const visN = visibleIndices(questions, eff).length;
    void doPostJson("/question-modal/gate-block", {
      request_id: reqId, tool_call_id: callId, session_id: cardSessionId(callId),
      missing, answered: visN - missing.length, total: visN, bundle: BUNDLE_TAG,
    }).catch(() => { /* audit is best-effort */ });
  };

  const submit = async (
    effAnswers?: Record<string, QA>, allowEmpty = false,
  ): Promise<"sent" | "not-ready" | "blocked"> => {
    // 返回值的意义：调用方（尤其是自动驱动）需要区分「真的发出去了」和
    // 「根本没发」——旧实现一律返回 undefined，驱动无法判断，只能靠锁存
    // 猜，于是 reqId 暂缺时第一次尝试就永久放弃（见 QM_FIX2）。
    if (!reqId) {
      toast("warning", "问卷尚未就绪，请稍候");
      return "not-ready";
    }
    const eff = effAnswers || authoritativeAnswers();
    // 严格拦截闸门（用户裁定 2026-10-21）：只要有可见题未作答（既没选、也没
    // 显式「跳过本题」），「提交」一律无效——没有「再点一次放行」。出路只有
    // 三种：补答 / 对未答题逐题「跳过本题」/ 用「跳过并提交」显式把空白当跳过
    // 表态。allowEmpty 旁路仅保留给这两个显式出口与自动驱动。
    if (!allowEmpty) {
      const missing = missingOf(eff);
      if (missing.length) { fireGate(missing, eff, "提交"); return "blocked"; }
      setGateBlocked("");
    }
    setBusy(true);
    try {
      const d = await doPostJson("/question-modal/answer", {
        request_id: reqId, session_id: cardSessionId(callId), answers: eff,
        other: finalOther, attachments: finalOtherAtt,
      });
      if (d && d.orphan) {
        // The backend already acknowledged and dropped the record, so it
        // reports itself as released; still, sweep the session so any *other*
        // stranded survey in this chat cannot keep it locked.
        void fetch(apiUrl("/question-modal/cancel-session")
          + "?session_id=" + encodeURIComponent(cardSessionId(callId)),
          { method: "POST", headers: authHeaders() }).catch(() => {});
        converge("orphan",
          "本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。\n"
          + "无需再操作，请直接在对话中继续。", true);
        toast("info", "本次问卷已失效，已关闭");
        return "sent";          // 卡片已收敛，驱动不应再重试
      }
      // 用户裁定 q1（2026-10-22 二次）：去掉「✓ 已提交答案」顶部浮层，
      // 只保留卡片内的常驻状态行——同一件事不给两个反馈通道。
      forgetReqId(callId);
      setLocalResult(formatAnswers(questions, eff, finalOther, finalOtherAtt));
      setSubmittedAt(Date.now());
      // Fresh submission → the wait window starts now, regardless of what a
      // previous state snapshot carried.
      setPastSoft(false);
      setWaitRetired(false);
      bgDoneRef.current = false;
      pastSoftFiredRef.current = false;
      // 本实例确实从这一刻开始等 → 才允许显示等待行与常驻释放按钮。
      observedWaitRef.current = true;
      setAnswered(true);
      return "sent";
    } catch (e: any) {
      // 404 = the backend no longer has this record at all (already resolved,
      // cancelled, or never there).  Nothing is left to release, so close the
      // card instead of leaving a dead one on screen.
      if (e && e.status === 404) {
        converge("gone",
          "本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。\n"
          + "无需再操作，请直接在对话中继续。", true);
        toast("info", "本次问卷已失效，已关闭");
        return "blocked";       // 卡已失效，重试没有意义
      }
      toast("error", "提交失败: " + e.message);
      // 自动提交失败必须能重试，否则一次性锁存会把整张卡永久钉在末页
      // （用户报的「只用推荐最终卡在最后一题」）。仅复位自动驱动的那次锁存；
      // 手动提交失败不需要动它。
      if (allowEmpty) {
        autoSubmitRef.current = false;
        autoSubmitTriesRef.current += 1;
        if (autoSubmitTriesRef.current >= AUTO_SUBMIT_MAX_TRIES) {
          toast("warning",
            "自动提交连续失败 " + AUTO_SUBMIT_MAX_TRIES + " 次，已停止重试。"
            + "请手动点「提交」，或检查网络/模型限额后重试。");
        }
        setQVersion((v: number) => v + 1);   // 唤醒驱动效应再试
        return "not-ready";     // 未成功，允许驱动再试（受上限约束）
      }
      return "blocked";
    } finally { setBusy(false); }
  };

  // ── Skip THIS question only (purely local; the survey stays open) ──
  // Marks the current question as skipped, clears any partial answer to it,
  // and moves to the next visible question.  Nothing is sent to the backend
  // yet — question_modal resolves the whole survey once, on submit.
  /** 「跳过方式」是否设为整卷跳过。读配置而非捕获，理由同 gateEnabled。 */
  const skipWholeMode = (): boolean => cfgOf("skip_mode", "per_question") === "whole";

  const skipCurrent = () => {
    if (curIdx < 0) return;                 // already on the 其他意见 page
    if (gateBlocked) setGateBlocked("");     // 显式表态（跳过本题）→ 清除拦截提示
    // Abandoning this question aborts the model call still running for it, so
    // the next question can actually reach the LLM (#3).  visStepRef is still
    // the question being skipped — read it before advancing below.
    stopAnalysis(visStepRef.current);
    // Mark this question as handled so the auto-driver does not re-analyse it.
    analysedRef.current[visStepRef.current] = true;
    markTouched(`q${curIdx}`);
    setAnswers((prev) => {
      const next: Record<string, QA> = { ...prev };
      next[`q${curIdx}`] = {
        type: (prev[`q${curIdx}`] || {}).type || qType(q),
        value: ((prev[`q${curIdx}`] || {}).type || qType(q)) === "multi" ? [] : "",
        other: "",
        skipped: true,
      };
      // Drop answers of questions the change may have hidden.
      const vis = visibleIndices(questions, next);
      questions.forEach((_q, i) => { if (vis.indexOf(i) === -1) delete next[`q${i}`]; });
      return next;
    });
    setVisStep((s: number) => s + 1);
  };

  // ── 下一步 with the SAME strict gate as 提交 ──
  // 用户裁定 2026-10-21：「其他按钮不应该触发直接跳过的操作」。此前闸门只挂在
  // 末页「提交」上，逐页的「下一步」是裸 setVisStep+1，于是空白题能一路静默翻
  // 到末页——那才是真正的「不拦截」根因（用户全程点的都是「下一步」，submit()
  // 从未被触发）。现在：当前题未作答且未显式跳过 → 拒绝翻页 + 常驻红条 + 落盘。
  // 出口不变：作答，或点「跳过本题」(skipCurrent，显式表态后才允许前进)。
  const goNext = () => {
    if (isOtherPage) { submit(); return; }   // 末页交给 submit 的整卷闸门
    const eff = authoritativeAnswers();
    const missing = missingOf(eff, curIdx);
    if (missing.length) { fireGate(missing, eff, "下一步"); return; }
    if (gateBlocked) setGateBlocked("");
    setVisStep((s: number) => s + 1);
  };

  // ── Skip the WHOLE survey: resolve + collapse the card away ──
  const skipAll = async () => {
    if (!reqId) { toast("warning", "问卷尚未就绪，请稍候"); return; }
    // Abandoning the survey must stop any analysis still in flight, or the
    // parked model call keeps the chat locked after the skip (#3).
    stopAnalysis();
    setBusy(true);
    try {
      const d = await doPostJson("/question-modal/skip", {
        request_id: reqId, session_id: cardSessionId(callId),
      });
      if (d && d.orphan) {
        converge("orphan",
          "本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。\n"
          + "无需再操作，请直接在对话中继续。", true);
        toast("info", "本次问卷已失效，已关闭");
        return;
      }
      toast("info", "已跳过问卷");
      forgetReqId(callId);
      setSkippedAll(true);
      // 用户主动跳过也是一类来源，卡片要明写「谁跳的、为什么」。
      setSkipReason("用户跳过了本次问卷（在卡片上点了「跳过问卷」）");
      setLocalResult("用户跳过了本次问卷。");
      setSubmittedAt(Date.now());
      setPastSoft(false);
      setWaitRetired(false);
      bgDoneRef.current = false;
      pastSoftFiredRef.current = false;
      // 跳过路径按裁定不显示等待行（waitLineFor 对 skippedAll 返回 null），
      // 但仍记录"本实例刚结过这张卡"，让释放按钮按 q1 常驻。
      observedWaitRef.current = true;
      setAnswered(true);
    } catch (e: any) {
      if (e && e.status === 404) {
        converge("gone",
          "本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。\n"
          + "无需再操作，请直接在对话中继续。", true);
        toast("info", "本次问卷已失效，已关闭");
        return;
      }
      toast("error", "跳过失败: " + e.message);
    } finally { setBusy(false); }
  };

  // ── AI autopilot: fill the analysed question, advance, and submit ──
  //
  // Runs only in AI mode while NOT paused.  For each question on screen it
  // waits until the analysis has RESOLVED (a cached result exists, which the
  // analysis effect triggers and `runAnalysis`/the restore effect record),
  // then silently fills the model's recommendation and steps forward.  A
  // failed/empty recommendation is recorded as skipped so the loop never
  // stalls.  Reaching the 其他意见 page (every visible question resolved)
  // triggers one auto-submit.  Free-text questions take the generated
  // `choice`; attachment questions are skipped (AI cannot upload).

  R.useEffect(() => {
    // Two auto-driving modes share this loop:
    //   • "ai"        — waits for the model's per-question analysis to settle
    //                   (doneRef), then fills its `choice`.
    //   • "recommend" — never waits: the recommendation was declared by the
    //                   model while authoring the question.  It falls back to
    //                   a previously cached analysis, and skips the question
    //                   when neither exists (product decision q2), so the
    //                   loop can never stall on a missing model call.
    if (answered || (anMode !== "ai" && anMode !== "recommend") || autoPaused) return;
    // 阶段 2/3（2026-11-07 用户裁定 q0）：**自动模式下前端让位给后端**。
    //
    // 后端有自己的推进循环（`recommend.py` + `_runner_loop`），好处是关掉所有
    // 页面问卷也能走完。若前端同时也推进，同一题会被"填两次、翻两次页"
    // （两次 setVisStep 叠加），表现为跳题或越过末页。
    //
    // 判据用 `backendDown`（SSE 连通性）：这也是设计里明确要求的降级路径 ——
    // SSE 一断，本页收不到后端推送，必须自己动起来，否则用户看到的是
    // 一张永远不动的问卷。两者必须择一，不能同时进行。
    //
    // 阶段 3 起 `ai` 也搬到了后端（它要调模型，失败/限流/停摆都由后端裁决），
    // 所以这里覆盖 recommend + ai 两种自动模式；manual 仍然完全由用户驱动。
    if ((anMode === "recommend" || anMode === "ai") && !backendDown) return;
    if (!argsReady(args) || !questions.length) return;
    if (busy) return;

    if (isOtherPage) {
      // On the 其他意见 page: auto-submit once every visible question has
      // settled (success OR failure — a failed question is skipped, not a
      // reason to wait forever).  The final page itself is left empty per the
      // product decision (q2).
      if (autoSubmitRef.current) return;
      // 次数用尽 → 不再自动重试，停留在末页交给用户手动提交（裁定 q1）。
      // 没有这道门，失败后的 setQVersion 唤醒会变成无限重试，限流时会一直烧额度。
      if (autoSubmitTriesRef.current >= AUTO_SUBMIT_MAX_TRIES) return;
      // doneRef is keyed by visible POSITION (0..totalVis-1), the same space
      // `visStep`/`appliedRef` use — not by the real question index held in
      // visList.  Every position must have settled before the auto-submit.
      // 「已落定」有两个来源，缺一不可：
      //   ① doneRef —— 自动驱动处理过该位置（AI 分析落定 / recommend 填充）
      //   ② 该题本身已有答案 —— 用户**人工**答的题
      //
      // 只看 ① 会漏掉一条真实路径（2026-11-04 用户实测复现）：先人工答完
      // 几题，到末页觉得麻烦，点了「只用推荐」想让它收尾 —— 此时 doneRef
      // 是空的（人工作答不会置位），allSettled 恒假，于是永远不提交，
      // 就卡在「其他意见」。用户原话：「我在卡片的时候手动点击了只用推荐，
      // 它自动跳过了，但是现在最后的其他意见，这个又卡主了」。
      const effForGate = authoritativeAnswers();
      const allSettled = visList.every(
        (real, pos) => !!doneRef.current[pos] || filledAnswer(effForGate[`q${real}`]),
      );
      if (!allSettled) return;

      // ★ 关键：reqId 没就绪时**不要锁存、不要计数**，等它到了再试。
      //
      // 这是一处真实的竞态（2026-11-04 真机复现）：「只用推荐」是纯本地
      // 填充 + 推进，几毫秒就能把 5 题全推完；而 reqId 要等一次
      // /question-modal/resolve 往返。旧写法先 `autoSubmitRef = true` 再调
      // submit，submit 因 `!reqId` 直接 return —— 锁存已置位，之后 reqId
      // 到了也不会再提交，卡片就永久停在末页（用户报的「题都选好了，就是
      // 不自动提交」）。
      //
      // 把 reqId 放进依赖数组后，reqId 一到就会重跑本 effect，届时正常提交。
      if (!reqId) return;

      autoSubmitRef.current = true;
      // allowEmpty: the driver has already decided fill-or-skip for every
      // question on THIS instance, so the manual empty-answer safety gate must
      // not stall the unattended flow.
      void submit(undefined, true).then((r) => {
        // 没真正发出去 → 解除锁存，让 reqId 到达后的那一轮能重试。
        // 只有 "sent"（真的提交/已收敛）才保持锁存。
        if (r === "not-ready") autoSubmitRef.current = false;
      });
      return;
    }

    const qi = visStep;
    if (appliedRef.current[qi]) return;        // already handled this step
    // In "ai" mode the analysis must have landed first; in "recommend" mode
    // there is nothing to wait for.
    if (anMode === "ai" && !doneRef.current[qi]) return;

    const realIdx = visList[qi];
    const question = questions[realIdx];
    const qt = qType(question);
    // Recommendation source, in priority order (product decision q0):
    //   1. the suggestion the model attached when it authored the question;
    //   2. a cached analysis from an earlier run (a cache READ — still no
    //      model call);
    //   3. nothing → the question is skipped.
    const declared = questionRecommended(question);
    // ★ 只能取「本题」的结论，绝不能取数组第一条。
    //
    // `qResultsRef` 是按【可见位置 qi】缓存的，而 `per_question[i].index` 是
    // 【真实题号】—— 两者只有在没有隐藏题时才相等。`showIf` 一收窄可见列表，
    // 直接取 `per_question[0]` 就会把别的题的 choice 填到当前题上。
    //
    // 真机复现（2026-11-05）：3 题问卷（单选/单选/问答），切「自动分析」后
    // 提交体是 q0="乙"、q1="丁"、q2="乙" —— q2 是问答题，却拿到了第一题的
    // 选项值。用户报的「切模式后题目自动使用了推荐」就是这个串题。
    const cachedChoice = choiceForQuestion(qResultsRef.current[qi], realIdx);
    // In "ai" mode the analysis must have landed first.
    if (anMode === "ai" && !doneRef.current[qi]) return;

    appliedRef.current[qi] = true;
    const choice = declared.length
      ? declared.join("、")
      : cachedChoice;
    const usable = !!choice;

    markTouched(`q${realIdx}`);
    if (!usable) {
      // ★ 无推荐 → 标记被自动跳过（1B，2026-11-05 用户裁定 q2=甲）
      //
      // 产品决定仍然「不卡住整卷」（2026-11-04 教训：停下等 = 整卷卡死，
      // 这是更糟的失败形态），但**必须让用户看得见**：此前三题全跳过并
      // 自动提交，用户只看到「问卷自己答完了、什么都没选」。
      //
      // 三条可见化：① 本题上方提示行（noRecRef 驱动渲染）
      //            ② 末页摘要列出题号
      //            ③ toast 一次性告知
      // 数据上用 skipped_by 区分「用户主动跳过」与「无推荐被跳过」，
      // 回传里两者不再混为一谈。
      noRecRef.current[realIdx] = true;
      setNoRecVersion((v: number) => v + 1);
      toast("warning", "第 " + (realIdx + 1) + " 题没有可用的推荐，已标记为未作答");
    }
    setAnswers((prev) => {
      const next: Record<string, QA> = { ...prev };
      const key = `q${realIdx}`;
      const base = next[key] || { type: qt, value: qt === "multi" ? [] : "", other: "" };
      if (!usable) {
        // No usable recommendation → skip the question so the loop continues.
        next[key] = { ...base, type: qt, value: qt === "multi" ? [] : "", other: "",
          skipped: true, skipped_by: "no_recommend" };
      } else if (qt === "multi") {
        const opts = (question.options || []) as OptDef[];
        const norm = (x: string) => String(x).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        next[key] = { ...base, type: qt, value: choice.split(/[、,，]/)
          .map((s) => norm(s)).filter(Boolean)
          .map((tok) => {
            const hit = opts.find((o) => optValue(o) === tok || optLabel(o) === tok);
            return hit ? optValue(hit) : tok;
          }) };
      } else if (qt === "single") {
        // Normalise a single choice onto the option's VALUE.  The model may
        // write the label (or 「推荐 · 乙」) instead of the value, and storing
        // that raw text would neither tick the row nor match `isChosen`.
        const opts = (question.options || []) as OptDef[];
        const norm = (x: string) => String(x).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        const hit = opts.find((o) => optValue(o) === choice || optLabel(o) === choice)
          || opts.find((o) => optValue(o) === norm(choice) || optLabel(o) === norm(choice));
        next[key] = { ...base, type: qt, value: hit ? optValue(hit) : choice };
      } else {
        // Free-text: fill the generated content verbatim.
        next[key] = { ...base, type: qt, value: choice };
      }
      // Re-evaluate conditional visibility after the fill.
      const vis = visibleIndices(questions, next);
      questions.forEach((_q, i) => { if (vis.indexOf(i) === -1) delete next[`q${i}`]; });
      return next;
    });
    analysedRef.current[qi] = true;
    // Mark this position settled as well: in "recommend" mode no analysis runs,
    // so nothing else would ever set doneRef and the auto-submit gate on the
    // 其他意见 page (`visList.every(pos => doneRef[pos])`) would never open.
    doneRef.current[qi] = true;
    setVisStep((s: number) => s + 1);
    // qVersion bumps so the loop re-evaluates for the question we just moved to
    // (in "recommend" mode the analysis effect never fires, so nothing else
    // would wake this effect up).
    setQVersion((v: number) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, anMode, autoPaused, busy, callId, visStep, qVersion, totalVis, args,
      // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
      // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
      // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
      reqId, backendDown]);

  // ── 阶段 1：与后端权威 state 双向同步（首帧 GET + SSE 增量）─────────
  //
  // 语义分工（2026-11-07 用户裁定）：
  //   · 后端是唯一真值：answers / cursor / mode 都以它为准
  //   · 本页的操作 → POST action（自带 origin）
  //   · 收到**别人的**修改 → 覆盖本地 state（多标签一致性的来源）
  //   · 收到**自己的**回声 → 只同步 rev，不覆盖本地（否则正在输入的文本被冲掉）
  //
  // `backendDown` 是降级开关：SSE 一直连不上时置 true，本地驱动继续跑，
  // 不让后端单点故障把问卷打死（这是设计里明确要求保留的容错）。
  const remoteApplyRef = R.useRef(false);
  const revRef = R.useRef(0);
  // ★ 首帧快照是否已采纳完成。
  //
  // 为什么必须有这道闸门（2026-11-07 真机复现的真实 bug）：
  // 卡片挂载时 `anMode` 初值是内建默认 "manual"（故意的保守值，真实模式要等
  // `/effective-config` 落地）。而下面的 mode/answers/cursor 三个上报 effect
  // 会在挂载后立刻跑 —— 于是它把 "manual" 发给了后端，**把后端真实的 mode
  // 覆盖掉**。真机证据：卡片挂载后 `GET /survey-state` 的 mode 从 ai 变成 manual。
  // 后果是用户设置的自动/推荐模式在每次刷新后被静默降级，且第二个标签页
  // 会跟着被改成 manual —— 正是用户报的「模式来回 switch」家族的问题。
  //
  // 同时它也防止另一类污染：初始的空白 answers 被当成"用户清空了答案"上报。
  const surveyHydratedRef = R.useRef(false);
  // 上报用的去重表。**必须提前声明**：adopt() 在 hydrate 时要写它（见下），
  // 而 adopt 定义在 effect 内部、effect 又在上报 effect 之前跑。
  const lastPostedRef = R.useRef<Record<string, string>>({});

  R.useEffect(() => {
    if (answered || !callId) return undefined;
    let alive = true;

    /** 用后端 state 覆盖本地（只覆盖后端权威的字段）。 */
    const adopt = (st: any) => {
      if (!alive || !st) return;
      remoteApplyRef.current = true;
      // ★ 先置水合标志再处理字段：上报闸门只关心"快照已经到手"，
      // 不关心每个字段是否都成功写入。若把标记放在 try 末尾，任何一个
      // 字段处理抛错（touchedRef/mergeCardState 等）都会让标志永远为 false，
      // 后果是**该卡片此后永不向后端上报**——静默的 fail-closed，
      // 比字段写失败严重得多（harness 实测：BH2/BH2b/BH3 全变 0 请求）。
      surveyHydratedRef.current = true;
      try {
        if (Array.isArray(st.questions) && st.questions.length
            && (!questions || !questions.length)) {
          // 题面只在后端有（本地解析失败/骨架态）时补，避免覆盖本地新解析的结果
        }
        if (st.answers && typeof st.answers === "object") {
          setAnswers((prev: Record<string, QA>) => {
            const next: Record<string, QA> = { ...prev };
            Object.keys(st.answers).forEach((k) => {
              const inbound = st.answers[k];
              if (!inbound || typeof inbound !== "object") return;
              // 跳过本实例改过的键：本地是更新的真相（用户可能正在输入）
              if (touchedRef.current.has(k)) return;
              next[k] = { ...(next[k] || { type: "single", value: "", other: "" }),
                          ...inbound };
            });
            return next;
          });
          // 远端答案也要落盘，否则刷新后 localStore 又回到旧值
          mergeCardState(callId, { answers: st.answers });
        }
        if (typeof st.cursor === "number" && st.cursor >= 0) {
          setVisStep(st.cursor);
        }
        if (typeof st.mode === "string" && st.mode) {
          const m = normMode(st.mode);
          setAnMode((cur: AnMode) => (cur === m ? cur : m));
        }
        if (st.per_question && typeof st.per_question === "object") {
          Object.keys(st.per_question).forEach((k) => {
            const idx = parseInt(k, 10);
            if (!isNaN(idx) && st.per_question[k]) {
              qResultsRef.current[idx] = st.per_question[k];
            }
          });
        }
        if (st.status === "submitted") {
          // 另一个标签页已提交 → 本页直接进入已完成视图
          setSubmittedAt((v: number) => v || Date.now());
          if (st.released) mergeCardState(callId, { backendReleased: true });
          // ★ 必须同时置 answered（2026-11-09 用户报障的直接原因）。
          //
          // 用户：「查看历史卡片时，明明卡片已经正常结束了，但查看卡片却不是
          // 正常的可见答案状态，却是可以点击上下题的答题状态」。
          //
          // 根因就在这一处：后端权威 state 明确说 `status="submitted"`，
          // 但这里**只设了 submittedAt，没设 answered** → 渲染仍走答题分支
          // → 上下题按钮还在。而且它会**一直停在这个状态**（用户实测
          // 「不会自己恢复」），因为 answered 是渲染的唯一开关。
          //
          // 为什么以前没暴露：写这段时假设「提交动作都由本卡发起，本地
          // setAnswered 已经置过」。但还有三条路径能拿到 submitted 而不经过
          // 本地提交：① 另一个标签页提交后 SSE 推过来；② 卡片重挂载时
          // 首帧快照就是 submitted；③ 后端 runner 自动答完后推进来。
          // 这三种情况下 answered 从来没被置位。
          setAnswered(true);
          forgetReqId(callId);
        }
        // 后端 state 里的跳过原因（watchdog / 超时 / 释放阻塞 / 用户跳过）。
        // 主要通道是工具输出文本；这里补一条双开/SSE 增量路径，保证另一屏
        // 也能立刻看到原因，而不是只靠自己那张卡的本地推断。
        const sr = String(st.skip_reason || "").trim();
        if (sr) setSkipReason((prev: string) => prev || sr);
        // ★ 采纳完成后把「当前真实值」写进去重表，否则接下来的上报 effect
        // 会把刚采纳的值当成"本地新变化"再发回后端（回声），白白多一轮请求，
        // 在 mode 上还会跟别的标签页形成来回覆盖。
        if (typeof st.mode === "string" && st.mode) {
          lastPostedRef.current.mode = normMode(st.mode);
        }
        Object.keys(st.answers || {}).forEach((k) => {
          lastPostedRef.current["a:" + k] = JSON.stringify(st.answers[k] || {});
        });
        if (typeof st.cursor === "number") {
          lastPostedRef.current.cursor = "c:" + st.cursor;
        }
        surveyHydratedRef.current = true;
        setQVersion((v: number) => v + 1);
      } finally {
        // 让"answers 变了就发 action"的 effect 跳过这一轮（远程同步不是本地操作）
        setTimeout(() => { remoteApplyRef.current = false; }, 0);
      }
    };

    // ① 首帧快照（SSE 连上之前的窗口期靠这条）
    void fetchSurveyState(callId).then((r) => {
      if (!alive || !r || !r.found || !r.state) return;
      revRef.current = Math.max(revRef.current, r.rev);
      adopt(r.state);
    });

    // ② SSE 增量
    const close = openSurveyStream(callId, {
      onSnapshot: (rev, st) => {
        revRef.current = Math.max(revRef.current, rev);
        if (st) adopt(st);
      },
      onChange: (ev) => {
        const rev = parseInt(ev.rev || 0, 10) || 0;
        if (rev && rev <= revRef.current && ev.origin !== tabId()) return;
        revRef.current = Math.max(revRef.current, rev);
        // 自己的回声：本地已经是这个状态了，覆盖只会打断输入
        if (ev.origin && ev.origin === tabId()) return;
        adopt(ev.state);
      },
      onStatus: (ok) => {
        if (!alive) return;
        // 只在**真的变化**时 setState。线上 React 对同值 setState 会跳过重渲染，
        // 但这层守卫仍值得留：它让意图显式，也让测试环境的假 React（不做同值
        // 优化）不会因为重连循环把整卡反复重建。
        setBackendDown((prev: boolean) => (prev === !ok ? prev : !ok));
      },
    });
    return () => { alive = false; close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, callId]);

  // ── 本地 state 变化 → 上报给后端（后端裁决 + 广播给其它标签页）──────
  //
  // 三个字段分开上报，理由：后端 action 语义是"单一事实"（set_answer /
  // goto / set_mode），合并上报会让后端无法判断哪一项真的变了，也就无法
  // 只广播有意义的变化。
  //
  // ★ 上报**不**以 SSE 连通为前提（2026-11-07 真机+harness 双重实测发现）：
  //   `backendDown`（SSE 断开）绝不能再当上报闸门。SSE 只是**接收**通道，
  //   POST /survey-action 是**发送**通道，两者独立。
  //   把它们绑在一起的后果：SSE 一旦不可用，本页的每次作答都不同步给后端，
  //   后端的 state 停在旧值 → 另一个标签页、以及"关页面重开"看到的都是过时
  //   进度，双开一致性彻底失效。而 HTTP POST 明明还有效。
  //   （harness 实测：BH 组让 SSE 返 404 测降级，结果 survey-action 请求数
  //    直接变 0，正是这个绑定造成的。）
  //   `remoteApplyRef` 仍是屏障：它表示"这一轮变更来自远端采纳"，避免回声。
  R.useEffect(() => {
    // ★ 必须等首帧快照采纳完成（surveyHydratedRef）：否则会把挂载时的
    // 初始值（anMode="manual"、answers={}、visStep=0）当成"用户刚改的"
    // 上报给后端，覆盖掉真实状态。真机实测：卡片挂载后后端 mode 从 ai
    // 被静默改成 manual。
    if (answered || !callId || remoteApplyRef.current) return;
    if (!surveyHydratedRef.current) return;
    // 答案：逐键比较，只发变化的那一题
    Object.keys(answers || {}).forEach((k) => {
      const payload = JSON.stringify(answers[k] || {});
      if (lastPostedRef.current["a:" + k] === payload) return;
      lastPostedRef.current["a:" + k] = payload;
      void postSurveyActionAsync(callId, "set_answer",
                                 { key: k, answer: answers[k] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, callId, JSON.stringify(answers)]);

  R.useEffect(() => {
    if (answered || !callId || remoteApplyRef.current) return;
    if (!surveyHydratedRef.current) return;      // 同上：别用初值污染后端
    const key = "c:" + visStep;
    if (lastPostedRef.current.cursor === key) return;
    lastPostedRef.current.cursor = key;
    void postSurveyActionAsync(callId, "goto", { cursor: visStep });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, callId, visStep]);

  R.useEffect(() => {
    if (answered || !callId || remoteApplyRef.current) return;
    if (!surveyHydratedRef.current) return;      // 同上：别用初值污染后端
    if (lastPostedRef.current.mode === anMode) return;
    lastPostedRef.current.mode = anMode;
    void postSurveyActionAsync(callId, "set_mode", { mode: anMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, callId, anMode]);

  // ── styles: exact ApprovalCard-module values ──
  const card: any = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13,
  };
  const header: any = {
    marginBottom: 14, paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex", alignItems: "center", justifyContent: "space-between",
  };
  const titleRow: any = { flex: 1, display: "flex", alignItems: "center", gap: 8 };
  const icon: any = {
    color: "var(--app-accent, #ff7f16)",
    display: "flex", alignItems: "center", flex: "none",
  };
  const titleStyle: any = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" };
  const pill: any = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none",
  };
  const content: any = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 };
  const qLabel: any = {
    fontSize: 12, color: "var(--app-text-tertiary, inherit)", fontWeight: 500,
  };
  const opts: any = { display: "flex", flexDirection: "column", gap: 8 };
  const actions: any = {
    display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
  };
  const btnBase: any = {
    minWidth: 88, height: 36, fontSize: 13, fontWeight: 500, borderRadius: 8,
    padding: "0 20px", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 4, cursor: "pointer",
  };
  const btnSecondary: any = {
    ...btnBase, background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)", boxShadow: "none",
  };
  const btnPrimary: any = {
    ...btnBase, border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, "
      + "var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))",
  };
  const btnRow: any = {
    ...btnBase, width: "100%", justifyContent: "flex-start",
    minWidth: 0, borderRadius: 8, fontSize: 13, padding: "6px 12px",
    background: "var(--app-surface-subtle, rgba(127,127,127,0.05))",
    border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
    color: "var(--app-text-secondary, inherit)",
    // Prose-style options (a whole sentence) must wrap, not truncate.
    whiteSpace: "normal", textAlign: "left", lineHeight: 1.45,
    height: "auto", minHeight: 32, alignItems: "center",
  };
  const btnRowOn: any = {
    // Restored to the original look (user asked for options to stay as-is).
    ...btnRow,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))",
  };
  // A recommended row stays visually NEUTRAL — no accent background.  Tinting
  // it looked "selected" and caused misjudgement (#3).  The recommendation is
  // carried entirely by the「AI 推荐」badge on the LEFT, not by the row colour.
  const btnRowRec: any = {};
  // Small, quiet badge — it must not compete with the selected state (which
  // owns the accent border/text), so it uses a muted accent-on-subtle look.
  // 「AI 推荐」徽章（#2/#4）：放在选项**左侧**、带**矩形边框**更显眼。
  // 方角（borderRadius:3）+ 1.5px 实线边框 + 透明底，避免与"选中"混淆。
  const recBadge: any = {
    flex: "none", marginRight: 8, fontSize: 10, lineHeight: "15px",
    padding: "0 5px", borderRadius: 3, whiteSpace: "nowrap",
    color: "var(--app-accent, #ff7f16)",
    background: "transparent",
    border: "1.5px solid var(--app-accent, #ff7f16)",
  };
  // Compact controls must match the option-row metrics exactly:
  // option rows are 32px tall with 13px text, so inputs/textareas do too.
  const inputStyle: any = { height: 32, fontSize: 13, borderRadius: 8 };
  const textAreaStyle: any = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 };

  const isChosen = (opt: OptDef): boolean => {
    const val = optValue(opt);
    return ans.type === "multi"
      ? Array.isArray(ans.value) && ans.value.indexOf(val) !== -1
      : ans.value === val;
  };
  const otherActive = isChosen(OTHER);

  const toggle = (opt: OptDef) => {
    if (answered || busy) return;
    const val = optValue(opt);
    if (ans.type === "multi") {
      const cur = Array.isArray(ans.value) ? ans.value.slice() : [];
      const i = cur.indexOf(val);
      if (i === -1) cur.push(val); else cur.splice(i, 1);
      setAns({ ...ans, value: cur, other: cur.indexOf(OTHER) !== -1 ? ans.other : "" });
    } else {
      setAns({ ...ans, value: val });
    }
  };

  // `recommended` draws a「AI 推荐」badge on the LEFT of the row (#2) — it shows
  // whenever the question carries a recommendation AND the user has the badge
  // enabled (settings → 作答 → 显示 AI 推荐标记).  The badge is a sibling SPAN
  // before the label, so the button's text content stays exactly `label` (plus
  // the ✓ prefix) — harness assertions that match option text keep working.
  //
  // Only the VISUAL badge is gated; `recommended` still drives「只用推荐」
  // driving, so turning the badge off can never change behaviour.
  const showRecBadge = !!cfgOf("show_recommend_badge", true);
  // 徽章位置（c1）与外观（c2）也是显示配置：位置决定徽章排在文字前还是后，
  // 外观决定圆角。两者都只影响渲染，不碰数据层。
  const badgeOnRight = cfgOf("badge_position", "left") === "right";
  const badgeRound = cfgOf("badge_style", "rect") === "round";
  const badgeNode = (recommended?: boolean) =>
    (recommended && showRecBadge)
      ? R.createElement("span", {
          key: "rec", className: "qm-rec-badge", "data-qm-rec": "true",
          style: badgeRound ? { ...recBadge, borderRadius: 999 } : recBadge,
        }, "AI 推荐")
      : null;
  /** 选项自动编号（c4）：默认开。关闭后连显示前缀也没有，回传值本来就不带编号。 */
  const numberOn = !!cfgOf("auto_number_options", true);
  /** 推荐项底色（c3）：默认关。开启时给推荐行一层淡淡的强调底色。 */
  const highlightRec = !!cfgOf("highlight_recommended", false);
  const btnRowRecTint = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" };

  const optionRow = (
    label: string, active: boolean, onClick: () => void, k: string,
    recommended?: boolean,
    // 选项编号（2026-10-23 用户裁定：`1. 2. 3.`，**仅卡片显示**）。
    // 刻意只进显示层：回传值、recommended 匹配、「只用推荐」的勾选、历史卡片
    // 全都仍用选项原文 —— 编号一旦进数据层，出题时标注的推荐会集体失配。
    // 「其他」不编号：它是插件注入的自由文本入口，不属于模型给出的候选集。
    num?: number,
  ) =>
    R.createElement("button", {
      key: k, type: "button", disabled: answered || busy,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: (recommended && highlightRec)
        ? { ...(active ? btnRowOn : btnRow), ...btnRowRecTint }
        : (active ? btnRowOn : btnRow),
      onClick,
    },
      // 徽章位置可配（c1）：默认在选项文字左侧。
      badgeOnRight ? null : badgeNode(recommended),
      R.createElement("span", {
        style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" },
      }, (active ? "✓ " : "") + (num && numberOn ? num + ". " : "") + label),
      badgeOnRight ? badgeNode(recommended) : null);

  // ── not ready yet: loading skeleton ──
  //
  // The host mounts this card as soon as the tool call is announced, while
  // the arguments are still streaming in (empty → fragments → whole JSON).
  // Rendering the form at that point showed a bogus degenerate page
  // (「其他意见 1/1」) for as long as the model took to emit its questions —
  // the reported "卡片先出现、选项 3-10 秒后才出".  Keep the frame, show that
  // we are preparing, and never expose the nonsense intermediate state.
  //
  // Gated on `!answered` so a card rendered from history (whose result is
  // already known) still shows its answer instead of a skeleton.
  if (!answered && !argsReady(args)) {
    return R.createElement("div", { style: card, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": callId },
      R.createElement("div", { style: header, className: "qm-header" },
        R.createElement("div", { style: titleRow },
          titleIconNode(R),
          R.createElement("span", { style: titleStyle, className: "qm-title" }, title)),
        R.createElement("span", { style: pill }, "准备中")),
      R.createElement("div", {
        style: { ...content, color: "var(--app-text-tertiary, inherit)", fontSize: 12 },
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      stuck
        ? R.createElement("div", { style: actions },
            R.createElement("button", {
              type: "button", disabled: busy,
              style: { ...btnSecondary, marginLeft: "auto" },
              title: "释放本次问卷的阻塞，让会话恢复可用",
              onClick: rescue,
            }, "释放本次问卷"))
        : null);
  }

  // ── answered: read-only result view ──
  if (answered) {
    // ── 提交后的**常驻状态行**（2026-10-22 四次裁定：后台计时，前台不读秒）──
    // 存在性由 waitLineFor 决定、文案由 waitPhaseText 决定（真相源唯一，两条
    // 渲染路径不漂移）。关键：这里**不再有任何秒数** —— 渲染不依赖时间，所以
    // 整个等待期内本行只在「越过阻塞阈值」那一次重渲染，其余时间卡片完全静止。
    // 抽成 hook-free 助手（harness 的 FakeReact 不执行嵌套组件，与 btnRow 同源）。
    const waitHintNode = () => {
      const line = waitLineFor({
        submittedAt, deadReason, releasedNote, skippedAll,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: waitRetired, pastSoft,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!observedWaitRef.current,
      });
      if (!line) return null;
      return R.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": callId,
        "data-qm-phase": line.phase,
        style: { fontSize: 12, lineHeight: 1.5,
                 color: line.phase === "stalled"
                   ? "var(--app-warning-text, #d46b08)"
                   : "var(--app-text-secondary, inherit)" },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）",
      }, waitPhaseText(line.phase));
    };

    // 释放按钮的可见性（用户裁定 q1=**分情况**）：只有**本实例真的在等这段**
    // （刚提交过，或挂载了一张仍在寿命窗口内的近期卡）才常驻；纯历史卡不显示，
    // 避免满屏已作答卡都挂一个「释放阻塞」。
    const showRelease = !!observedWaitRef.current;

    // Whole survey skipped → collapse to a single summary line the user can
    // expand to review the questions again.  An ordinary submit keeps the
    // full read-only card.
    if (skippedAll && !expanded) {
      return R.createElement("div", {
        style: {
          ...card, padding: "8px 14px", marginBottom: 8,
          display: "flex", alignItems: "center", gap: 8,
        },
        className: "qm-card", "data-qm-card": "true", "data-qm-card-id": callId,
      },
        R.createElement("span", {
          style: { color: "var(--app-text-tertiary, inherit)", fontSize: 12 },
        }, "›"),
        R.createElement("span", { style: { fontSize: 13, fontWeight: 500 } },
          deadReason ? "⚠ 问卷已失效" : "✓ 已跳过问卷"),
        // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
        // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
        skipReason
          ? R.createElement("span", {
              "data-qm-skip-reason": "true",
              style: { flex: 1, minWidth: 0, fontSize: 12,
                       color: "var(--app-warning-text, #d46b08)",
                       overflow: "hidden", textOverflow: "ellipsis",
                       whiteSpace: "nowrap" },
              title: skipReason,
            }, skipReason)
          : null,
        R.createElement("span", {
          style: { ...titleStyle, flex: releasedNote ? 0 : (skipReason ? 0 : 1), opacity: 0.75 },
        }, title),
        releasedNote
          ? R.createElement("span", {
              style: { flex: 1, minWidth: 0, fontSize: 12,
                       color: "var(--app-text-secondary, inherit)" },
            }, releasedNote)
          : waitHintNode(),
        R.createElement("button", {
          type: "button",
          style: {
            ...btnSecondary, minWidth: 0, height: 26, padding: "0 10px", fontSize: 12,
          },
          onClick: () => setExpanded(true),
        }, "展开"),
        // Escape hatch for the「already finished but the chat is still locked」
        // shape: the card can be settled while the agent's Future was never
        // actually resolved (orphaned record / cross-generation reload / race),
        // so the chat keeps answering 409 and the user has nothing left to
        // click.  This button therefore survives the answered state; it only
        // runs on an explicit click (never automatically), so a healthy run is
        // never cancelled behind the user's back.
        // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
        showRelease ? R.createElement("button", {
          type: "button", disabled: busy,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: {
            ...btnSecondary, minWidth: 0, height: 26, padding: "0 10px", fontSize: 12,
          },
          onClick: releaseBlocked,
        }, "释放阻塞") : null);
    }
    return R.createElement("div", { style: card, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": callId },
      R.createElement("div", { style: { ...header, marginBottom: 8, paddingBottom: 8 } },
        R.createElement("div", { style: titleRow },
          titleIconNode(R),
          R.createElement("span", { style: titleStyle }, title)),
        R.createElement("span", { style: { ...pill, color: deadReason
            ? "var(--app-warning-text, #d46b08)"
            : "var(--app-success-text, #389e0d)" } },
          deadReason ? "已失效" : (skippedAll ? "已跳过" : "已完成"))),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      skippedAll && (skipReason || deadReason)
        ? R.createElement("div", {
            "data-qm-skip-reason-block": "true",
            style: {
              marginBottom: 8, padding: "8px 12px", fontSize: 12, lineHeight: 1.6,
              background: "var(--app-warning-bg, rgba(212,107,8,0.08))",
              border: "1px solid var(--app-warning-text, #d46b08)",
              borderRadius: 6,
              color: "var(--app-warning-text, #d46b08)",
            },
          },
            R.createElement("span", { style: { fontWeight: 600 } }, "跳过原因："),
            String(skipReason || deadReason || "问卷已失效/跳过"))
        : null,
      R.createElement("pre", {
        style: {
          margin: 0, padding: "10px 12px", whiteSpace: "pre-wrap",
          wordBreak: "break-word", fontSize: 12, lineHeight: 1.6,
          background: "var(--app-surface-subtle, rgba(127,127,127,0.05))",
          border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
          borderRadius: 6,
          color: "var(--app-text-secondary, inherit)",
          fontFamily: "SF Mono,Monaco,Consolas,monospace",
        },
      }, skippedAll
        // Whole-survey skip *or* a dead survey → show the notice, then the
        // questions so the record still reads sensibly.  Prefer the caller's
        // exact notice (`localResult`): the generic "已跳过本次问卷" would
        // mislabel a host-stop release, which does NOT hand the answers back.
        ? (localResult
            ? localResult + "\n\n" + summarizeQuestions(questions)
            : "已跳过本次问卷。\n\n" + summarizeQuestions(questions))
        : (localResult || recovered || outputText
           // Inline output was folded away and the backend no longer has the
           // result (restart cleared the in-memory cache).  Say so plainly
           // rather than leaking the host's English pointer stub.
           || "本条问卷的回答已不在插件缓存中（插件可能已重启）。\n"
              + "完整内容可在会话记录/历史中查看。\n\n"
              + summarizeQuestions(questions))),
      skippedAll && expanded
        ? R.createElement("div", { style: actions },
            R.createElement("button", {
              type: "button", style: btnSecondary, onClick: () => setExpanded(false),
            }, "收起"))
        : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      R.createElement("div", { style: { ...actions, marginTop: 8, gap: 10 } },
        releasedNote
          ? R.createElement("span", {
              style: { flex: 1, fontSize: 12, lineHeight: 1.5,
                       color: "var(--app-text-secondary, inherit)" },
            }, releasedNote)
          : waitHintNode(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        showRelease ? R.createElement("button", {
          type: "button", disabled: busy,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...btnSecondary, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: releaseBlocked,
        }, "释放阻塞") : null));
  }

  // 题级超时是否成立（七次裁定：这是横幅唯一的常规触发条件）。
  // 必须带 `slowStep === visStep` —— 切题后 effect 里的 setSlowFired(false) 晚于
  // 渲染，只看 slowFired 会让切题第一帧沿用上一题的结论（[AS10] 钉死过这一帧）。
  // 八次裁定后末页也计时，故不再排除 isOtherPage；比较口径统一用 stepSlot。
  const slowActive = slowFired && slowStep === stepSlot;

  /** 1B：本题是「因为没有推荐」被自动跳过的 → 在题干下方给一条常驻提示。
   *  之前这种题被静默标 skipped 并提交，用户只看到问卷自己答完了。
   *  `noRecVersion` 参与判定是为了建立渲染依赖：ref 变化本身不触发重渲染，
   *  必须有这个 state 才能让提示在同一轮就出现。 */
  const noRecNote = (!answered && !isOtherPage && noRecVersion >= 0 && noRecRef.current[curIdx])
    ? R.createElement("div", {
        key: "norec", className: "qm-norec-note", "data-qm-norec": "true",
        style: {
          marginTop: 8, padding: "6px 9px", borderRadius: 6, fontSize: 12,
          lineHeight: 1.5,
          background: "var(--app-warning-faint, rgba(255,166,0,0.10))",
          border: "1px solid var(--app-warning-border, rgba(255,166,0,0.35))",
          color: "var(--app-text-secondary, #6b6b6b)",
        },
      }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）")
    : null;

  /** 1B：末页提交前，把「无推荐被跳过」的题号明确列出来。 */
  const noRecList = Object.keys(noRecRef.current)
    .map((k) => Number(k))
    .filter((i) => noRecRef.current[i] && Number.isFinite(i))
    .sort((a, b) => a - b);
  const noRecSummary = (isOtherPage && noRecList.length)
    ? R.createElement("div", {
        key: "norec-sum", className: "qm-norec-sum", "data-qm-norec-sum": "true",
        style: {
          marginTop: 10, padding: "7px 10px", borderRadius: 6, fontSize: 12,
          lineHeight: 1.5,
          background: "var(--app-warning-faint, rgba(255,166,0,0.10))",
          border: "1px solid var(--app-warning-border, rgba(255,166,0,0.35))",
          color: "var(--app-text-secondary, #6b6b6b)",
        },
      }, "⚠ 第 " + noRecList.map((i) => i + 1).join("、") +
         " 题没有可用推荐，已按未作答提交")
    : null;

  // ── open: question body ──
  let body: any = null;
  if (isOtherPage) {
    body = R.createElement("div", null,
      R.createElement("div", { style: qLabel }, "其他意见（可选）"),
      noRecSummary,
      R.createElement(TextArea, {
        rows: 2, placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: finalOther,
        style: textAreaStyle,
        onChange: (e: any) => setFinalOther(e.target.value),
        onPaste: (e: any) => onPasteFiles(e, "final", "final"),
      }),
      AttachRow({
        R, files: finalOtherAtt, disabled: answered || busy,
        uploading, error: attError, onPick: () => openPicker("final", "final"),
        onRemove: (i: number) => setFinalOtherAtt((prev) => prev.filter((_, j) => j !== i)),
      }));
  } else if (q && qType(q) === "text") {
    body = R.createElement("div", null,
      R.createElement("div", { style: { ...qLabel, fontSize: 13, color: "var(--app-text, inherit)" } }, qTitle(q, curIdx)),
      noRecNote,
      R.createElement(TextArea, {
        rows: 2, placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof ans.value === "string" ? ans.value : "",
        style: textAreaStyle,
        onChange: (e: any) => setAns({ ...ans, value: e.target.value, other: "" }),
        onPaste: (e: any) => onPasteFiles(e, "q", key),
      }),
      AttachRow({
        R, files: ans.attachments || [], disabled: answered || busy,
        uploading, error: attError, onPick: () => openPicker("q", key),
        onRemove: (i: number) => setAns({
          ...ans, attachments: (ans.attachments || []).filter((_, j) => j !== i),
        }),
      }));
  } else if (q) {
    // Recommendations are QUESTION-level (see questionRecommended).  They show
    // in every mode — the badge is information, not a mode affordance.
    // #1 fallback: when the model did NOT declare `recommended` for this
    // question but an AI analysis result for it exists (cached or just
    // restored), use the analysis' choice as the recommendation source, so
    // the badge appears whenever there IS a defensible recommendation on
    // screen — matching「一般情况下都应该出现 AI 推荐」.
    const recs0 = questionRecommended(q);
    // 徽章的兜底同样必须取「本题」的 choice。`curIdx` 是当前题的真实题号
    // （`visList[visStep]`），据此匹配而不是取 `per_question[0]`——否则含
    // 隐藏题时徽章会标到不属于它的选项上（与驱动串题同源，2026-11-05）。
    const fallbackChoice = choiceForQuestion(anResult, curIdx);
    const recs = recs0.length ? recs0
      : (fallbackChoice ? [fallbackChoice] : recs0);
    const rows: any[] = (q.options || []).map((opt, i) =>
      optionRow(optLabel(opt), isChosen(opt), () => toggle(opt), "o" + i,
        isRecommendedOption(q, opt, recs), i + 1));
    rows.push(optionRow("其他", otherActive, () => toggle(OTHER), "other"));
    if (otherActive) {
      rows.push(R.createElement(Input, {
        key: "oi", placeholder: "请填写（可直接粘贴图片/文件）", value: ans.other,
        style: { ...inputStyle, marginTop: 2 },
        onChange: (e: any) => setAns({ ...ans, other: e.target.value }),
        onPaste: (e: any) => onPasteFiles(e, "q", key),
      }));
      // Attachments ride with the「其他」answer — the user's original ask was
      // to be able to attach a file when explaining "其他" / "其他意见".
      rows.push(AttachRow({
        key: "oa", R, files: ans.attachments || [], disabled: answered || busy,
        uploading, error: attError, onPick: () => openPicker("q", key),
        onRemove: (i: number) => setAns({
          ...ans, attachments: (ans.attachments || []).filter((_, j) => j !== i),
        }),
      }));
    }
    body = R.createElement("div", null,
      R.createElement("div", { style: { ...qLabel, fontSize: 13, color: "var(--app-text, inherit)" } }, qTitle(q, curIdx)),
      noRecNote,
      R.createElement("div", { style: { ...opts, marginTop: 8 } }, rows));
  }

  const total2 = totalVis + 1;
  const stepLabel = isOtherPage ? total2 + "/" + total2 : (visStep + 1) + "/" + total2;

  // Compact secondary button (footer has three of them side by side).
  const btnGhost: any = {
    ...btnBase, minWidth: 0, height: 32, padding: "0 14px", fontSize: 12,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)", boxShadow: "none",
  };

  return R.createElement("div", { style: card, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": callId },
    R.createElement("div", { style: header, className: "qm-header" },
      R.createElement("div", { style: titleRow },
        titleIconNode(R),
        R.createElement("span", { style: titleStyle, className: "qm-title" }, title)),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      R.createElement("div", {
        className: "qm-actions",
        style: { display: "flex", alignItems: "center", gap: 8, flex: "none" },
      },
        ModelCapsule({
          R, providers, modelId: anModel, disabled: answered || busy,
          followActive,   // 服务端标记：此值来自「跟随当前对话模型」
          open: capOpen, onOpenChange: setCapOpen,
          tab: capTab, onTabChange: setCapTab,
          onChange: (id: string) => {
            applyPrefs({ modelId: id });
            // A new model invalidates every cached recommendation: results were
            // produced by a different model, so the card forgets them and the
            // AI effect below re-analyses the question on screen.
            setAnResult(null);
            qResultsRef.current = {};
            analysedRef.current = {};
            setAnNonce((n: number) => n + 1);
          },
        }),
        TemplateCapsule({
          R, templates, value: tplId,
          open: tplOpen, onOpenChange: setTplOpen,
          disabled: answered || busy,
          onSelect: selectTemplate,
          onManage: () => setTplMgrOpen(true),
        }),
        ModeSwitch({
          R, mode: anMode, disabled: answered || busy,
          onChange: (m: AnMode) => {
            applyPrefs({ mode: m });
            if (m === "ai") {
              // Back to automatic analysis: re-analyse the question on screen
              // (the user may have switched away precisely to read the form).
              analysedRef.current = {};
            }
            // Both auto-driving modes ("ai" and "recommend") need a clean
            // driver state — a prior pass may have left questions marked
            // applied/done, which would stall the fill → advance loop.
            if (m === "ai" || m === "recommend") {
              appliedRef.current = {};
              doneRef.current = {};
              autoSubmitRef.current = false;
              setAnNonce((n: number) => n + 1);
            } else {
              // Taking over by hand must stop the model call still running (#3).
              stopAnalysis();
            }
          },
        }),
        AnalysisBubble({
          R, busy: anBusy, result: anResult, error: anError, mode: anMode,
          disabled: answered || busy,
          open: anOpen, onOpenChange: setAnOpen,
          onRun: () => { void runAnalysis("manual"); },
          onRerun: rerunAnalysis,
          onApply: applyAnalysis,
          onCancel: cancelAnalysis,
          // The bubble footer carries the two analysis options (the user asked
          // for the context switch to live "in the button").  Passed inside the
          // props object — a direct function call has no positional children.
          children: [
            R.createElement("label", {
              key: "ctx",
              style: { display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" },
              title: "分析时携带上一次决策与会话历史作为依据",
            },
              R.createElement("input", {
                type: "checkbox", checked: anCtx,
                onChange: (e: any) => applyPrefs({ withContext: !!e.target.checked }),
              }), "携带上下文"),
            R.createElement("label", {
              key: "par",
              style: { display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" },
              title: "多题分析时并发执行（更快）或逐个串行执行（更稳）",
            },
              R.createElement("input", {
                type: "checkbox", checked: anParallel,
                onChange: (e: any) => applyPrefs({ parallel: !!e.target.checked }),
              }), "并行分析"),
          ],
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (anMode === "ai" || anMode === "recommend") && !answered
          ? R.createElement("button", {
              type: "button", key: "qm-auto", disabled: busy,
              onClick: toggleAutoPause,
              style: {
                ...btnGhost, height: 24, padding: "0 10px", fontSize: 12,
                flex: "none",
                ...(autoPaused
                  ? { borderColor: "var(--app-accent, #ff7f16)",
                      color: "var(--app-accent-text, var(--app-accent, #ff7f16))" }
                  : null),
              },
              title: autoPaused
                ? "恢复自动答题"
                : "暂停自动答题，交给你手动作答",
            }, autoPaused ? "▶ 继续" : "⏸ 停止")
          : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        R.createElement("span", { style: pill, key: "qm-step" }, stepLabel))),

    R.createElement("div", { style: content }, body),

    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。

    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    TemplateManager({
      R, open: tplMgrOpen, templates, value: tplId, edit: tplEdit,
      onEditChange: setTplEdit,
      onClose: () => { setTplMgrOpen(false); setTplEdit(null); },
      onSelect: (id: string) => selectTemplate(id),
      onSave: onSaveTemplate,
      onDelete: onDeleteTemplate,
    }),

    // ── escape hatch: a survey blocks the whole chat while it is open ──
    // Shown after STUCK_AFTER_MS regardless of whether the card is healthy:
    // as long as the agent is parked, every new message in this chat answers
    // 409, so the user must always have a way out.
    // 2026-10-22 七次裁定（用户原话：「逻辑与我要求的不对，因为 30 秒是问卷的
    // 总体计时，时间过短，提示频繁，所以我要求将其改成题级，都按 60 秒计算，
    // 切换题目重置，这样不会造成频繁提示给用户心理暗示，造成心理负担」）。
    //
    // 因此：**整卷 30s 计时不再产生任何提示**。原先 `stuck`（30s 总计时）直接
    // 触发横幅，等于每张卡必然在 30 秒时冒出一条警告，正是用户说的"频繁提示 /
    // 心理负担"。现在横幅只由 **本题满 60s** 驱动，且切题即归零。
    //
    // `stuck` 只在**真异常**时兜底：`stuck && !reqId` 表示 30 秒都拿不到本次
    // 问卷的会话句柄（后端不可达 / 无会话），此时「其他意见」页也可能没有题级
    // 计时可依赖，必须保留唯一逃生口——这不是计时提示，而是故障提示。
    //
    // 秒数仍全部去掉（六次裁定 q2）：原横幅每次渲染用 Date.now() 现算，重挂会跳数。
    (slowActive || (stuck && !reqId)) && !answered
      ? R.createElement("div", {
          className: "qm-block-banner",
          "data-qm-slow": slowFired ? callId : undefined,
          style: {
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            margin: "0 0 12px", padding: "10px 12px", borderRadius: 8,
            background: "var(--app-warning-soft, rgba(250,173,20,0.12))",
            border: "1px solid var(--app-warning-border, rgba(250,173,20,0.45))",
            fontSize: 12, lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)",
          },
        },
          R.createElement("span", { style: { flex: 1, minWidth: 180 } },
            // 秒数整体去掉（q2）：「一段时间」不随渲染变化，故重挂不会跳数。
            // 判据必须带 `slowStep === visStep`：setSlowFired(false) 由切题后的
            // effect 执行，而 effect 晚于渲染，只看 slowFired 会让切题第一帧仍按
            // 上一题的超时文案渲染（[AS10] 抓的就是这一帧）。统一收敛到 slowActive。
            // 两个分支各自成立：slowActive=本题满 60s；否则走到这里只可能是
            // `stuck && !reqId`（真故障兜底），此时说"拿不到会话句柄"才准确。
            // 阈值必须来自生效配置：这里原先把 60 写死在文案里，
            // 用户把「题级计时提示」改成 5 秒后，提示仍说「已超过 60s」
            // ——文案与真实判据不符，等于对用户说谎。
            (slowActive
              ? ("⚠️ 本题已超过 " + slowSecShown + "s，可直接跳过或继续作答，")
              : "⚠️ 无法取得本次问卷的会话句柄，")
            + "阻塞期间发新消息会报「A task is already running」；"
            + (reqId
                ? "若你不想继续作答，可点击右侧按钮释放。"
                : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")),
          R.createElement("button", {
            type: "button", disabled: busy,
            style: {
              ...btnGhost, height: 28, padding: "0 12px",
              borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))",
            },
            onClick: rescue,
            title: "释放本次问卷的阻塞，让会话恢复可用",
          }, "释放本次问卷"))
      : null,

    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    gateBlocked && !answered
      ? R.createElement("div", {
          style: {
            margin: "0 0 10px", padding: "10px 12px", borderRadius: 8,
            background: "rgba(217,45,32,0.10)",
            border: "1.5px solid rgba(217,45,32,0.55)",
            fontSize: 12.5, lineHeight: 1.55, color: "#d92d20",
            fontWeight: 500,
          },
          className: "qm-gate-block",
          "data-qm-gate": "true",
          // Forensic bundle tag — invisible to the user, still queryable so a
          // "the gate didn't fire" report can be told apart from a stale bundle.
          "data-qm-bundle": BUNDLE_TAG,
        }, gateBlocked)
      : null,

    R.createElement("div", { style: actions, className: "qm-footer" },
      R.createElement("button", {
        type: "button", disabled: visStep === 0 || busy,
        style: { ...btnGhost, marginRight: "auto", opacity: visStep === 0 ? 0.5 : 1 },
        onClick: () => setVisStep((s: number) => s - 1),
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      R.createElement("button", {
        type: "button", disabled: busy, style: btnGhost,
        // 「跳过并提交」是明确的提交意图，不套空答卷闸门（allowEmpty=true）。
        // 跳过方式的落点（设置 → 作答 → 跳过方式）：
        //   per_question（默认）= 逐题跳过，只表态当前题
        //   whole               = 整卷跳过，直接结束这份问卷
        // 末页始终是「跳过并提交」（跳过整卷的「其他意见」）。
        // 这一个按钮始终是「只处理当前页」的语义：
        //   per_question → 跳过本题（前进，问卷继续）
        //   whole        → 跳过并提交（把当前页留空直接提交，问卷结束）
        // 真正的「整卷跳过」由下面那个常驻按钮负责——把两者都写成
        // 「跳过问卷」会出现两个同名按钮，用户无法分辨点哪个。
        onClick: isOtherPage
          ? (() => submit(undefined, true))
          : (skipWholeMode() ? (() => submit(undefined, true)) : skipCurrent),
      },
        isOtherPage
          ? "跳过并提交"
          : (skipWholeMode() ? "跳过并提交" : "跳过本题")),
      // Skip the whole survey: resolves the tool call and collapses the card.
      R.createElement("button", {
        type: "button", disabled: busy, style: btnGhost, onClick: skipAll,
      }, "跳过问卷"),
      R.createElement("button", {
        type: "button", disabled: busy, style: btnPrimary,
        onClick: goNext,
      }, isOtherPage ? "提交" : "下一步")));
}

// ══════════════════════════════════════════════════════════════════
// Settings button + centered modal (2026-11-04, shell only)
//
// Implementation mirrors prompt-forge, which has run stably for months:
//   • the toolbar button is handed to the host as a REACT ELEMENT
//     (`addPrefix(pid, React.createElement(Btn))`) so the HOST owns rendering;
//   • the modal lives in its own detached container appended to <body> and is
//     rendered with `host.ReactDOM.render`, i.e. OUTSIDE the host's React tree.
//
// Why this matters (2026-11-04 incident): the previous attempt passed a
// hand-made DOM node to `addPrefix` and then called `ReactDOM.render` on a
// node sitting INSIDE the host's tree — that conflicts with the host renderer
// and blew up the whole page. Never render into a host-owned node.
//
// Scope: shell only. No setting is read, written or persisted.
// ══════════════════════════════════════════════════════════════════
const SETTINGS_ORDER = 12;   // prompt-forge=10, todo-panel=11

/** 设置面板「打开」的递增序号：只让最近一次打开的异步回调落地。 */
let _settingsOpenSeq = 0;

const settingsState: {
  visible: boolean; tab: string; scope: string;
  /** 右上角作用域选择器的选中值（用户裁定 2026-11-12：手动选择，不自动识别）。
   *  初始值在 openSettingsPanel 按 has_session 给定；此后只有点选择器才变。 */
  scopeChoice: string;
  /** Scope the user last picked on a tab that actually offers session items.
   *  Restored when returning from a global-only tab, so switching to 显示 and
   *  back does not silently drop the user's "current session" choice. */
  lastScope: string;
  sessData: { items: any[]; count: number; ok: boolean } | null;
  /** Live config snapshot pulled from /effective-config. */
  cfg: EffectiveConfig | null;
  cfgError: string;
  /** Chat the panel was opened for.  Locked for the panel's whole lifetime so
   *  switching conversations mid-edit cannot silently retarget a save. */
  chatId: string;
  sessionId: string;
  agentId: string;
  /** Unsaved edits, keyed by schema key.  Present key = dirty. */
  draft: Record<string, any>;
  saving: boolean;
  saveMsg: string;
  modelOptions: string[];
  templateOptions: string[];
  providerGroups: ProviderGroup[];
  /** Full template records for the 提示词 tab (the id list is not enough to
   *  render names / system prompts / built-in flags). */
  templates: any[];
  /** Open editor: null = closed; {id:"", ...} = 新建; {id:"x", ...} = 编辑. */
  tplEdit: { id: string; name: string; system_prompt: string; user_prompt: string } | null;
  tplBusy: boolean;
  /** 纯全局值（GET /prefs），供「全局默认」页渲染。
   *
   *  为什么要单独存一份：`cfgValue()` 读的是 `/effective-config`——那是
   *  「全局 + 会话覆盖」合并后的值。全局页拿它渲染，就会把本会话的覆盖值
   *  显示成全局值，看起来像"改会话把全局也改了"。用户裁定（2026-11-04）：
   *  会话用 uuid 标注，不属于该 id 的适用全局，**严格数据隔离，避免读写污染**。
   */
  globalCfg: Record<string, any>;
  /** 打开面板那一刻，各键在本会话覆盖里的最后写入时间（`__keyts__`）。
   *
   *  2026-11-13（用户需求 2）：保存时把它作为 `seen` 发给后端，后端比对
   *  「这个键在我看过之后是否被别处改过」。有它才能区分「我覆盖了别人的
   *  改动」和「我自己刚改的」，前者才需要提示。
   */
  keyTs: Record<string, number>;
  /** 保存后后端回报的「被其它位置修改过」的键（不阻断保存，只标注）。 */
  conflictNote: string;
} = {
  visible: false, tab: "answer", scope: "global", lastScope: "global", scopeChoice: "default",
  sessData: null, cfg: null, cfgError: "", chatId: "",
  sessionId: "", agentId: "", draft: {}, saving: false, saveMsg: "",
  modelOptions: [], templateOptions: [], providerGroups: [],
  templates: [], tplEdit: null, tplBusy: false,
  globalCfg: {},
  keyTs: {},
  conflictNote: "",
};
let settingsPanelRoot: any = null;

/** Pull the session-override list once, then repaint.  Read-only: the settings
 *  UI is still a preview and never writes an override. */
let _sessLoading = false;
/** Effective value for one key: unsaved draft first, then the fetched config.
 *
 *  Reading through this function is what makes an edit visible immediately
 *  without a round-trip, while still falling back to the server's merge.
 */
function cfgValue(key: string, fallback?: any, scope?: "global" | "session"): any {
  if (key in settingsState.draft) return settingsState.draft[key];
  if (scope === "global") {
    // 全局页只认磁盘上的全局值；缺键才回落到内建默认，绝不取会话覆盖值。
    // 2026-11-13：优先用后端回的 global_config 原始值（不受会话覆盖干扰），
    // 老后端没这字段时退回 globalCfg。
    const g = (settingsState.cfg && settingsState.cfg.globalConfig)
      || settingsState.globalCfg;
    if (g && key in g) return g[key];
    return fallback;
  }
  // ── 会话页签（2026-11-13 用户报「页签数据显示错层」的修复点）────────
  //
  // 旧写法读 `settingsState.cfg.config`，那是**当前生效值**。切到默认模式
  // 后 active_scope=default，生效值 = 全局值 → 会话页签显示成全局数据；
  // 点保存时 set_scope 一改，生效值立刻变回会话覆盖，页签"突然刷新"。
  //
  // 现在读**会话层原始覆盖**（sessionConfig）：
  //   · 有值 → 显示会话自己存的值（哪怕此刻不是会话模式，磁盘上还在）
  //   · 无值 → 显示 undefined 的语义：这项本会话没覆盖，回落内建默认，
  //            而不是拿全局值冒充"会话值"
  // 仅在老后端（无 sessionConfig 字段）时才退回读生效值。
  const eff = settingsState.cfg && settingsState.cfg.config;
  const sess = settingsState.cfg && settingsState.cfg.sessionConfig;
  if (sess) {
    // 会话页签 = 「本会话实际会用的值」= 会话覆盖 ⊕ 全局继承
    // 本会话没覆盖的键，会话模式下本来就继承全局值，所以要如实显示全局值，
    // 不能显示内建默认（那会和实际生效结果不符）。
    if (key in sess) return sess[key];
    const g = (settingsState.cfg && settingsState.cfg.globalConfig)
      || settingsState.globalCfg;
    if (g && key in g) return g[key];
    return fallback;
  }
  if (eff && key in eff && settingsState.cfg
      && settingsState.cfg.has_session === true) {
    // 兜底：老后端且本会话确实有覆盖，生效值就是会话值，可安全使用。
    return eff[key];
  }
  if (eff && key in eff && !(settingsState.cfg && settingsState.cfg.has_session)) {
    // 老后端 + 无会话覆盖：没有"会话值"可言，按未设置处理。
    return fallback;
  }
  return fallback;
}

/** Is `model_id` the server-resolved「跟随当前对话模型」value?
 *
 *  服务端在 `_fill_follow_active` 里给出 `__follow_active__`：真值表示
 *  `model_id` 不是用户显式配置的，而是解析该会话的对话模型得来。
 *  卡片胶囊和设置页模型行都用它标注来源，两边读同一个标记，不会各说各话。
 */
function cfgFollowActive(): boolean {
  const cfg = settingsState.cfg && settingsState.cfg.config;
  return !!(cfg && (cfg as any).__follow_active__ === true);
}

/** `model_id` was EXPLICITLY stored as empty for this chat (user cleared it).
 *
 *  与「跟随中」是两回事（用户裁定 2026-11-04）：
 *    • 跟随中   → 服务端解析出实际模型 + __follow_active__=true，不标 session
 *    • 显式设空 → 磁盘上真的写过空串（__sources__.model_id === "session" 且值空）
 *  后者是用户主动清掉的选择，提示语必须不同，不能假装还在跟随。
 */
function cfgExplicitEmpty(key: string): boolean {
  const cfg = settingsState.cfg && settingsState.cfg.config;
  if (!cfg) return false;
  const src = (cfg as any).__sources__;
  const v = (cfg as any)[key];
  return !!(src && src[key] === "session" && (v === "" || v === null));
}

/** Record an edit.  Nothing is sent until the user presses save. */
function cfgEdit(key: string, value: any): void {
  // revert 基准必须是「当前页签所写存储层」的现值，不能用生效值一刀切：
  //   默认/全局页写全局磁盘 → 基准 = globalCfg[key]
  //   会话页写会话覆盖     → 基准 = 生效值（与该页显示一致）
  // 旧实现一律拿生效值当基准：默认页把「只用推荐」改成「人工」时，生效值
  // （来自会话覆盖）恰是 manual → 误判成「改回原值」删掉 draft → 高亮不动
  // 且保存按钮灰，用户看到的就是「无法选择人工」（2026-11-12 用户报告）。
  let current: any;
  const _cfg = settingsState.cfg;
  if (settingsState.scope === "global") {
    // 全局页基准 = 全局层原始值（与 cfgValue 的 global 分支同一来源）
    const g = (_cfg && _cfg.globalConfig) || settingsState.globalCfg || {};
    current = key in g ? g[key] : undefined;
  } else {
    // 会话页基准 = 会话覆盖 ⊕ 全局继承（必须与 cfgValue 会话分支逐字一致，
    // 否则「显示值」与「还原基准」不同源，会导致明明改了值却判成未改动，
    // 或反之把没变的键判成脏）。
    const sess = _cfg && _cfg.sessionConfig;
    if (sess) {
      if (key in sess) {
        current = sess[key];
      } else {
        const g = (_cfg && _cfg.globalConfig) || settingsState.globalCfg || {};
        current = key in g ? g[key] : undefined;
      }
    } else {
      // 老后端兜底：无分层数据时才退回生效值
      const cfg = _cfg && _cfg.config;
      current = cfg && key in cfg ? cfg[key] : undefined;
    }
  }
  if (current === value) {
    // Reverting to the saved value clears the dirty mark for this key.
    delete settingsState.draft[key];
  } else {
    settingsState.draft[key] = value;
  }
  settingsState.saveMsg = "";
  settingsRenderPanel();
}

function cfgDirtyCount(): number {
  return Object.keys(settingsState.draft).length;
}

/** Load the PURE global defaults (no session override merged in).
 *
 *  「全局默认」页必须显示磁盘上的全局值本身，而不是本会话的生效值，
 *  否则会话覆盖会看起来"污染"了全局（2026-11-04 用户裁定）。
 */
async function loadGlobalCfg(): Promise<void> {
  try {
    const resp = await fetch(apiUrl("/question-modal/prefs"), { headers: authHeaders() });
    if (!resp.ok) return;
    const d = await resp.json();
    const p = (d && d.prefs) || {};
    settingsState.globalCfg = p && typeof p === "object" ? p : {};
    try { settingsRenderPanel(); } catch (_) { /* closed */ }
  } catch (_) { /* keep whatever we had */ }
}

/** Persist the draft to the ACTIVE scope.
 *
 *  global  → POST /prefs          (all conversations)
 *  session → POST /session-prefs  (this chat only)
 *  A session save of a key that equals its global value is still stored: the
 *  user asked for an override, not for a value.
 */
async function cfgSave(): Promise<void> {
  // 无未保存修改也允许保存（用户裁定 2026-11-12：切到某个作用域后，
  // 即使没有改动也要能点保存，把当前显示值固化到目标作用域）。
  if (settingsState.saving) return;
  const keys = Object.keys(settingsState.draft);
  const isSession = settingsState.scope === "session";
  const patch: Record<string, any> = {};
  keys.forEach((k) => { patch[k] = settingsState.draft[k]; });
  if (!keys.length && !isSession) {
    // 全局页无改动时点保存 = 把当前全局值原样写回（幂等但语义完整）；
    // 后端白名单会过滤掉未知键。
    const g = settingsState.globalCfg || {};
    Object.keys(g).forEach((k) => { if (!(k in patch)) patch[k] = g[k]; });
  }

  if (!keys.length && isSession) {
    // ── 会话页「无改动直接保存」= 切到会话模式（2026-11-13 方案 D1）────
    //
    // 用户原话：「我点击会话模式并保存，右上角的并没有切换到会话模式，
    // 还是上次的默认模式，且我在关闭 ui 后再次激活 ui 时，自动切换到默认模式」。
    //
    // 根因：无改动时 patch = {}，而空 settings 的旧语义是**清空整条覆盖**
    // → has_session 变 false → 胶囊显示默认模式 → 重开仍是默认模式。
    //
    // D1 修法：不再靠"补 5 项值"来建立覆盖（那会把会话钉死在保存那一刻的
    // 全局值上），而是发一个显式标记 `set_scope: "session"`。
    // 覆盖率意味着"这个会话用自己的哪几项"；只切模式时**一项都不用写**，
    // 未设置的键天然继续跟随全局 —— 这正是用户要的
    //「会话模式 = 会话页五项 + 全局配置 + 提示词」。
    //
    // 因此这里刻意什么都不补：patch 保持为空，由 set_scope 完成切换。
  }

  // ── 「双保险」整批固化：已删除（2026-11-13 用户需求 3/4 裁定）────────
  //
  // 这里原有一段：会话保存时，把**当前生效值**里其余 SESSION_KEYS 一并塞进
  // patch，理由是「万一后端又被改回替换语义，也不会抹掉用户其它设置」。
  //
  // 实际后果与初衷相反，是用户反复报告的那条症状的根因：
  //   只改 1 项 → 保存后该会话被固化成 5 项完整覆盖 → 这些键钉死在保存那一刻
  //   → 之后改「默认模式」，该会话再也看不到变化
  //   → 用户视角：「某个会话一改，所有会话都跟着变」「默认模式覆盖所有配置」。
  //
  // 实测证据（修复前）：session_prefs 里两个会话各 5 个键覆盖，
  // 其中 4 个键的值与全局**完全相同**、不同的键为 0 个 —— 纯固化产物，
  // 用户从未选择过它们。
  //
  // 修法原则（用户裁定）：
  //   · 需求 3：会话覆盖 = 用户在该会话里**显式改动**的键，一个不多
  //   · 需求 4：默认模式（全局）与会话层互不污染，各自独立保存
  //   · 后端已是合并语义（POST /session-prefs 只 update 传入的键），
  //     不需要、也不允许前端再补一份「完整生效值」。

  settingsState.saving = true;
  settingsState.saveMsg = "";
  settingsRenderPanel();

  try {
    let url = "/question-modal/prefs";
    let body: any = patch;
    if (isSession) {
      url = "/question-modal/session-prefs";
      body = {
        chat_id: settingsState.chatId,
        session_id: settingsState.sessionId,
        agent_id: settingsState.agentId,
        settings: patch,
        // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
        // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
        seen: settingsState.keyTs || {},
        // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
        // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
        set_scope: "session",
      };
    }
    const resp = await fetch(apiUrl(url), {
      method: "POST", headers: authHeaders(), body: JSON.stringify(body),
    });
    const d = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      settingsState.saving = false;
      settingsState.saveMsg = (d && d.detail) ? String(d.detail) : ("保存失败（" + resp.status + "）");
      settingsRenderPanel();
      return;
    }
    settingsState.saving = false;
    settingsState.draft = {};
    // The next card must not read the pre-save snapshot.
    invalidateConfigCache();

    // ── 并发覆盖提示（2026-11-13 需求 2）──────────────────────────────
    //
    // 用户裁定：不弹窗、不阻断保存（后写为准），只在页面上标注
    // 「设置已于 <时间> 被其它位置修改」。
    // 后端只对「客户端明确看过（seen 里有该键）」的键做判定，所以卡片上的
    // 即时切换、脚本调用都不会产生噪音。
    const conf: any[] = Array.isArray(d && d.conflicts) ? d.conflicts : [];
    settingsState.conflictNote = "";
    if (conf.length) {
      const fmt = (ts: number): string => {
        try {
          const dt = new Date(ts * 1000);
          const pad = (n: number) => (n < 10 ? "0" + n : String(n));
          return (dt.getMonth() + 1) + "-" + pad(dt.getDate()) + " "
            + pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":"
            + pad(dt.getSeconds());
        } catch (_) { return ""; }
      };
      const latest = conf.reduce(
        (mx, c) => Math.max(mx, Number(c && c.at) || 0), 0,
      );
      const names = conf.map((c) => String((c && c.key) || "")).filter(Boolean);
      settingsState.conflictNote = "设置已于 " + fmt(latest)
        + " 被其它位置修改，本次已按后写入的值覆盖"
        + (names.length ? "（" + names.join("、") + "）" : "") + "。";
    }

    // 保存成功后同步新的 key_ts 基线：否则紧接着再保存一次，会把「我自己
    // 刚写的时间」当成「别人改的」而误报冲突。
    try {
      const kt = (d && d.key_ts) || {};
      if (kt && typeof kt === "object") {
        settingsState.keyTs = Object.assign({}, settingsState.keyTs, kt);
      }
    } catch (_) { /* 提示数据缺失不影响保存成功 */ }

    // 保存成功文案统一在下面按 switchedTo 分支给出（原本这里先赋一次
    // "已保存为全局默认（对所有会话生效）"，随后又被覆盖 —— 既与 D1 语义
    // 不符，也是永远不会生效的死代码，一并移除）。
    // 全局值变了要重新读，否则全局页还显示旧值
    if (!isSession) void loadGlobalCfg();

    // ── 保存即切换运行模式（2026-11-13 用户裁定）──────────────────────
    //
    // 用户原话：「切换到对应的模式后，点击保存，应该将当前会话切换到对应
    // 的模式，且右上角的胶囊中展示的模式也一并修改」。
    //
    // 语义：**保存动作本身 = 把本会话切换到该页签代表的模式**。
    //   · 在「会话模式」页保存 → 写会话覆盖 → 本会话 = 会话模式（天然成立）
    //   · 在「默认模式」页保存 → 删掉本会话的整条覆盖 → 本会话回落到跟全局
    //     = 默认模式
    //
    // 为什么必须删覆盖：胶囊的唯一依据是 has_session。只改全局值而不删覆盖，
    // 本会话仍会按旧覆盖运行，胶囊继续显示「会话模式」—— 用户点了「默认模式」
    // 保存却没有任何切换，正是他反复反馈的那类问题。
    //
    // 用户裁定 q0：**删整条**（含会话里自定义过的模型/模板等），并以当前
    // 默认模式的实际配置为准 —— 明确了"切到默认模式 = 放弃本会话覆盖"。
    let switchedTo: "session" | "default" | "" = isSession ? "session" : "default";
    if (!isSession) {
      try {
        const r = await fetch(apiUrl("/question-modal/session-prefs"), {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            chat_id: settingsState.chatId || "",
            session_id: settingsState.sessionId || "",
            agent_id: settingsState.agentId || "",
            // 2026-11-13 方案 D1（用户裁定）：切到默认模式**只打标记**，
            // 不删本会话的自定义项 —— 这样切回会话模式时数据原样恢复。
            //
            // 旧做法是 settings:{}（= 清空整条覆盖），实测会把会话里设过的
            // 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
            settings: {},
            set_scope: "default",
          }),
        });
        if (!r.ok) {
          // 删覆盖失败不能让用户以为已切到默认模式 —— 如实回报。
          settingsState.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（"
            + r.status + "），本会话仍在会话模式。";
          switchedTo = "";
        }
      } catch (e: any) {
        settingsState.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖："
          + (e && e.message ? e.message : e) + "，本会话仍在会话模式。";
        switchedTo = "";
      }
      // 覆盖变了，key_ts 基线一并作废（下次保存重新取）。
      settingsState.keyTs = {};
    }

    // 无论切换到哪个模式，都把页面上的"模式"显示同步过来 —— 胶囊、页签、
    // 作用域三者必须一起变，否则会出现"胶囊说会话、页签写默认"的错乱。
    if (switchedTo) {
      settingsState.scopeChoice = switchedTo;
      settingsState.tab = switchedTo;
      settingsState.scope = switchedTo === "session" ? "session" : "global";
    }
    if (switchedTo === "default") {
      // 与按钮旁「保存为全局默认（对未设会话的会话生效）」同口径：
      // 本会话的会话覆盖已被标记为不生效（数据仍保留），故现在是跟随全局。
      settingsState.saveMsg = "已保存为全局默认；本会话已切换到默认模式"
        + "（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    } else if (switchedTo === "session") {
      // 与按钮旁「保存到本会话（只覆盖你改过的项，不改全局）」同口径。
      settingsState.saveMsg = "已保存到本会话；本会话当前按会话模式运行"
        + "（未改动的项仍跟随全局，全局默认未被修改）。";
    }

    void fetchEffectiveConfig(
      settingsState.chatId, true, settingsState.sessionId, settingsState.agentId,
    ).then((nd) => {
      if (nd) { settingsState.cfg = nd; }
      try { settingsRenderPanel(); } catch (_) {}
    }).catch(() => {});
  } catch (e: any) {
    settingsState.saving = false;
    settingsState.saveMsg = "保存请求失败：" + (e && e.message ? e.message : e);
  }
  try { settingsRenderPanel(); } catch (_) {}
}

/** Discard edits (used by the close-confirm flow). */
function cfgDiscard(): void {
  settingsState.draft = {};
  settingsState.saveMsg = "";
}

// ── 提示词页的模板 CRUD ──────────────────────────────────────────────
//
// The tab used to render three dead buttons (no onClick) over a hard-coded
// two-row list.  Everything now goes through the real endpoints, and the list
// is whatever the server returns, so a newly added template shows up here and
// in the 分析页 template dropdown (both read the same source).

/** Re-pull the template library and repaint. */
function reloadTemplates(): void {
  void fetchTemplates().then((res) => {
    settingsState.templates = ((res && res.items) || []).filter((t: any) => t && t.id);
    settingsState.templateOptions = settingsState.templates.map((t: any) => t.id);
    try { settingsRenderPanel(); } catch (_) { /* panel closed */ }
  }).catch(() => {});
}

function tplStartNew(): void {
  settingsState.tplEdit = {
    id: "", name: "", system_prompt: "", user_prompt: "",
  };
  settingsState.saveMsg = "";
  settingsRenderPanel();
}

function tplStartEdit(id: string): void {
  const t = settingsState.templates.filter((x: any) => x.id === id)[0];
  if (!t) return;
  // 读入时兼容后端字段名（system/user）与旧命名（system_prompt/prompt）。
  // 内部编辑器统一用 system_prompt / user_prompt 作为表单字段名，保存时再映射。
  settingsState.tplEdit = {
    id: String(t.id),
    name: String(t.name || ""),
    system_prompt: String(t.system || t.system_prompt || t.prompt || ""),
    user_prompt: String(t.user || t.user_prompt || ""),
  };
  settingsState.saveMsg = "";
  settingsRenderPanel();
}

function tplEditField(field: string, value: string): void {
  try { (window as any).__qmDbg = ((window as any).__qmDbg || []).concat([field + "=" + String(value).slice(0, 12)]); } catch (_) {}
  if (!settingsState.tplEdit) return;
  (settingsState.tplEdit as any)[field] = value;
  // 受控输入必须重绘，否则 value 会停在旧值、输入看起来被清空。
  // 编辑器块的 key 只随「编辑哪个模板」变化（不随输入变化），
  // 所以重绘不会重挂载 textarea，光标位置得以保留。
  settingsRenderPanel();
}

function tplCancelEdit(): void {
  settingsState.tplEdit = null;
  settingsRenderPanel();
}

async function tplSave(): Promise<void> {
  const e = settingsState.tplEdit;
  if (!e || settingsState.tplBusy) return;
  // 兜底：以 DOM 里的实际值为准。
  // 面板走 ReactDOM.render 重绘，受控 state 与 DOM 之间存在一帧延迟；
  // 用户刚打完字就点保存时读到旧 state 会误判为空。DOM 才是用户真正看到的。
  try {
    const root = typeof document !== "undefined"
      ? document.getElementById("qm-settings-root") : null;
    if (root && typeof root.querySelector === "function") {
      ["name", "system_prompt", "user_prompt"].forEach((k) => {
        const el = root.querySelector('[data-qm-tpl-field="' + k + '"]');
        if (el && typeof el.value === "string" && el.value !== "") (e as any)[k] = el.value;
      });
    }
  } catch (_) { /* DOM 不可用则只用 state */ }
  const name = String(e.name || "").trim();
  // Client-side guard only mirrors the server: an unnamed template cannot be
  // told apart in the 分析页 dropdown, so reject it here for a faster message.
  if (!name) { settingsState.saveMsg = "模板名称不能为空"; settingsRenderPanel(); return; }
  settingsState.tplBusy = true;
  settingsRenderPanel();
  // 字段名必须与后端 TemplateBody 一致：id / name / **system** / **user**。
  // 早前用 system_prompt / user_prompt 发送，服务端按 system 取值 → 恒为空 →
  // 表现为「输入框有内容，保存却提示系统提示词不能为空」。
  const payload = {
    id: e.id || ("tpl-" + Date.now().toString(36)),
    name,
    system: e.system_prompt,
    user: e.user_prompt,
  };
  const res = await saveTemplate(payload);
  settingsState.tplBusy = false;
  if (res && res.ok === false) {
    settingsState.saveMsg = String(res.error || res.detail || "保存失败");
    settingsRenderPanel();
    return;
  }
  settingsState.tplEdit = null;
  settingsState.saveMsg = e.id ? ("模板「" + name + "」已更新") : ("模板「" + name + "」已创建");
  reloadTemplates();
  settingsRenderPanel();
}

async function tplDelete(id: string): Promise<void> {
  const t = settingsState.templates.filter((x: any) => x.id === id)[0];
  const ok = typeof window !== "undefined" && typeof window.confirm === "function"
    ? window.confirm("确定删除模板「" + ((t && t.name) || id) + "」？")
    : false;
  if (!ok) return;
  const res = await deleteTemplate(id);
  if (res && res.ok === false) {
    settingsState.saveMsg = String(res.error || res.detail || "删除失败（内置模板不可删除）");
    settingsRenderPanel();
    return;
  }
  settingsState.saveMsg = "模板已删除";
  reloadTemplates();
  settingsRenderPanel();
}

/** Resolve the chat this panel should target, then PULL the lock.
 *
 *  Locking at open time (not at save time) is what makes a save unambiguous:
 *  the user could hop to another conversation while the modal is open. */
function openSettingsPanel(): void {
  settingsState.visible = true;
  // The host exposes only session_id; the server resolves it to a chat UUID.
  settingsState.chatId = "";          // unknown client-side, resolved server-side
  settingsState.sessionId = currentSessionId();
  // ★ 必须清掉上一次打开时的配置快照（2026-11-13 用户报的场景根因之一）。
  //
  // `settingsState` 是模块级单例，`cfg` 只在拉取成功时被赋值、**从不清空**。
  // 于是：在会话1（有覆盖）关掉面板 → 切到会话2 打开 → 在异步拉取返回前，
  // 胶囊读到的是**会话1 的 cfg.has_session=true** → 显示「会话模式」，
  // 用户看到的就是「会话2 怎么也显示会话模式 / 会话1 变成默认模式」这类错乱。
  // 清空后首帧按「无会话覆盖」渲染（保守），真实值到达再纠正。
  settingsState.cfg = null;
  settingsState.cfgError = "";
  // 模型与模板候选：只在设置面板用，异步补齐即可。
  void loadSettingsOptions();
  settingsState.agentId = _hostAgentId || (() => {
    try { return host().getSelectedAgentId ? host().getSelectedAgentId() : ""; }
    catch (_) { return ""; }
  })();
  invalidateConfigCache();
  // 每次打开面板递增一个序号。异步回调里只有「本次」的回调才允许改页签，
  // 避免上一次打开的迟到回调把这一次的初始页签覆盖掉。
  const openSeq = ++_settingsOpenSeq;
  // ★ 首帧「未定」态：页签条不高亮任何一项，内容区显示加载骨架。
  //
  // 历史演变（务必看完整因果再改）：
  //   2026-11-13 早先：这里同步强制 `tab = "default"` 再等异步纠正。
  //     目的是防「上一会话的页签残留」（从会话1 关掉再开会话2，会先显示
  //     会话1 的页签，观感像串了）。副作用是**当前用户报的闪烁**：
  //     本会话明明是会话模式，却先画「默认模式」再跳过去 ——
  //     实测 229ms(0ms 延迟) / 296ms(120ms) / 454ms(400ms)，网络越慢越明显。
  //
  //   现在（用户 2026-11-13 问卷裁定 = 方案A）：
  //     `tab = ""`（未定）→ 页签条**不高亮任何项**、内容区显示加载骨架。
  //     两个目标同时满足：
  //       · 不会先画错页签（根本没有高亮项，谈不上"错"）
  //       · 也不会显示上一会话残留（残留的是内容，已被骨架取代）
  //     数据到达后在 onDone 里一次性定鼎，全程只呈现一个确定结果。
  settingsState.scopeChoice = "";
  settingsState.tab = "";
  settingsState.scope = "global";
  settingsState.draft = {};
  settingsState.saveMsg = "";
  settingsState.conflictNote = "";
  settingsRenderPanel();
  // 打开时先拉配置，拉到后给定右上角选择器的「初始选中值」与面板初始页签
  // （用户裁定 2026-11-12：右上角不再自动识别切换，改为手动选择；未手动
  // 选择前按「本会话是否有覆盖」给定初始值——有→会话模式，无→默认模式）。
  // loadEffectiveConfigIntoSettings 是 void 的（内部管理加载与回调队列），
  // 用它的 onDone 回调在配置到达后执行初始化。
  loadEffectiveConfigIntoSettings(() => {
    // 迟到的回调（面板已经被重新打开过）不许改页签（2026-11-13）。
    if (openSeq !== _settingsOpenSeq) return;
    const hasSess = !!(settingsState.cfg && settingsState.cfg.has_session);
    // 初始页签 = 本会话的**真实运行模式**，不读任何记忆（2026-11-13 用户裁定）。
    //
    // 规则只有一条：
    //   本会话有覆盖 → 落在「会话模式」页签；无覆盖 → 落在「默认模式」页签。
    //
    // 为什么彻底删掉「记住上次页签」：
    //   `qm:v1:scopeChoice` 是**全局** localStorage 键，所有会话共用一份值。
    //   于是「在会话2 点默认模式」会把这条记忆改成 default，切回会话1 时
    //   会话1 也被显示成默认模式 —— 用户看到的就是「会话1 变成默认模式了」，
    //   而它实际仍按会话覆盖运行（数据没错，只是标签骗人）。
    //   任何"跨会话共享的记忆"都会重演这个问题，所以直接去掉，
    //   让每个会话的显示 100% 由 has_session 决定，无歧义、无残留状态。
    const init = hasSess ? "session" : "default";
    settingsState.scopeChoice = init;
    settingsState.tab = init === "session" ? "session" : "default";
    settingsState.scope = init === "session" ? "session" : "global";
    settingsState.draft = {};
    settingsState.saveMsg = "";
    // 打开面板这一刻的「各键最后写入时间」。保存时原样发回成为 `seen`，
    // 后端比对后就能发现「这个键在我编辑期间被别处改过」（需求 2）。
    // 必须在这里取：之后用户改动 draft 会改值，但「我什么时候看到的」
    // 是固定的，不能随渲染漂移。
    settingsState.keyTs = Object.assign(
      {}, (settingsState.cfg && settingsState.cfg.keyTs) || {},
    );
    settingsState.conflictNote = "";
    settingsRenderPanel();
    // 初始打开也要把「默认模式」页的全局值拉齐：该页 cfgValue 走
    // globalCfg ?? 出厂默认，globalCfg 为空时整页显示的是出厂默认而非
    // 当前磁盘全局值——用户改完保存、重开（未点选择器/页签，不会触发
    // onTabChange 的 loadGlobalCfg）看到的就是出厂默认，像「没保存生效」
    // （2026-11-12 用户多次复测反馈的根因）。
    if (settingsState.tab === "global" || settingsState.tab === "default") {
      void loadGlobalCfg();
    }
  });
}

/** One provider and the models it offers — the two-column picker's data. */
type ProviderGroup = { id: string; name: string; models: string[] };

/** Model / template candidates for the 分析页 dropdowns. */
let _optLoading = false;
function loadSettingsOptions(): void {
  if (_optLoading) return;
  _optLoading = true;
  void Promise.all([fetchProviders(), fetchTemplates()]).then((res) => {
    _optLoading = false;
    const provs: any[] = (res[0] as any[]) || [];
    const tplRes: any = res[1] || {};
    // Grouped form: the picker shows a provider list and a model list side by
    // side, so the flat "provider:model" strings are no longer enough.
    settingsState.providerGroups = provs.map((p: any) => {
      const pid = String((p && (p.id || p.provider_id)) || "");
      const all = ((p && p.models) || []).concat((p && p.extra_models) || []);
      const models = all.filter(Boolean).map((m: any) => {
        const name = typeof m === "string" ? m : (m && (m.name || m.id)) || "";
        return name ? String(name) : "";
      }).filter(Boolean);
      return {
        id: pid,
        name: String((p && (p.name || p.title)) || pid),
        models,
      };
    }).filter((g: ProviderGroup) => g.id && g.models.length > 0);
    // Flat list kept for the "current value" display and for validating a
    // stored model_id that no longer exists in any provider.
    settingsState.modelOptions = settingsState.providerGroups
      .flatMap((g: ProviderGroup) => g.models.map((m) => g.id + ":" + m));
    settingsState.templates = ((tplRes.items || []) as any[]).filter((t: any) => t && t.id);
    settingsState.templateOptions = settingsState.templates.map((t: any) => t.id);
    try { settingsRenderPanel(); } catch (_) { /* panel closed */ }
  }).catch(() => { _optLoading = false; });
}

/** Split a stored `provider:model` value (model names may contain ':' too). */
function splitModelId(v: string): { provider: string; model: string } {
  const s2 = String(v || "");
  const i = s2.indexOf(":");
  if (i <= 0) return { provider: "", model: s2 };
  return { provider: s2.slice(0, i), model: s2.slice(i + 1) };
}

/** Pull the effective config once and repaint. */
let _cfgLoading = false;
/** 正在加载的请求所针对的会话（chatId + sessionId）。
 *
 *  2026-11-13（用户报「会话1 变成默认模式」）：此前只用一个布尔
 *  `_cfgLoading` 判「正在加载」，于是
 *    · 打开会话1 的面板 → 请求 flying，_cfgLoading=true
 *    · 立刻切到会话2 再打开 → 被这个布尔挡住，只登记回调、**不发请求**
 *    · 最终 cfg 永远是会话1 的 has_session=true → 会话2 也显示「会话模式」
 *  现在记下「这次加载是替哪个会话发的」，目标变了就必须重新发。
 */
let _cfgLoadingKey = "";
/** 等待本次配置加载完成的回调（打开面板自动切页签用）。 */
const _cfgDoneCbs: Array<() => void> = [];
function loadEffectiveConfigIntoSettings(onDone?: () => void): void {
  const target = settingsState.chatId;
  const reqKey = (target || "") + "|" + (settingsState.sessionId || "");
  if (_cfgLoading && _cfgLoadingKey === reqKey) {
    // 同一个会话正在加载：只登记回调，完成时一起执行。
    if (onDone) _cfgDoneCbs.push(onDone);
    return;
  }
  _cfgLoading = true;
  _cfgLoadingKey = reqKey;
  const done = () => {
    // 只有当没有更新的请求接管时才清标志，避免把新请求的 loading 状态误清。
    if (_cfgLoadingKey === reqKey) {
      _cfgLoading = false;
      _cfgLoadingKey = "";
    }
    const cbs = _cfgDoneCbs.splice(0);
    try { cbs.forEach((fn) => fn()); } catch (_) {}
  };
  if (onDone) _cfgDoneCbs.push(onDone);
  void fetchEffectiveConfig(
    target, true, settingsState.sessionId, settingsState.agentId,
  ).then((d) => {
    // A late response for a previous panel must not overwrite the live one.
    if (settingsState.chatId !== target) { done(); return; }
    if (d) { settingsState.cfg = d; settingsState.cfgError = ""; }
    else {
      settingsState.cfgError = "读取配置失败（后端不可达）";
      // ★ 失败兜底（2026-11-13 方案A 的必备配套）。
      //   未定态（tab===""）靠"配置到达"来解除；若请求失败且不兜底，
      //   面板会**永远停在骨架**且页签永不高亮 —— 比原来的闪烁严重得多。
      //   这里退回「无覆盖」保守判定（默认模式页），与旧行为一致，
      //   并配合 cfgError 文案让用户知道值可能不是最新的。
      if (!settingsState.tab) {
        settingsState.tab = "default";
        settingsState.scopeChoice = "default";
        settingsState.scope = "global";
      }
    }
    done();
    try { settingsRenderPanel(); } catch (_) { /* panel closed */ }
  }).catch(() => {
    // 网络层异常同样不能让面板卡在骨架态（同 ⑦ 的理由）。
    if (!settingsState.tab) {
      settingsState.tab = "default";
      settingsState.scopeChoice = "default";
      settingsState.scope = "global";
      settingsState.cfgError = "读取配置失败（网络异常）";
    }
    done();
    try { settingsRenderPanel(); } catch (_) { /* panel closed */ }
  });
}

function loadSessionPrefsIntoSettings(): void {
  if (_sessLoading) return;
  _sessLoading = true;
  void fetchSessionPrefs().then((d) => {
    _sessLoading = false;
    settingsState.sessData = d;
    try { settingsRenderPanel(); } catch (_) { /* panel closed */ }
  }).catch(() => { _sessLoading = false; });
}

function settingsRenderPanel(): void {
  const R = host().React;
  const ReactDOM = host().ReactDOM;
  if (!R) return;
  if (!ReactDOM || typeof ReactDOM.render !== "function") {
    // No renderer handle: fall back to an imperative antd dialog so the entry
    // still does something instead of silently doing nothing.
    if (settingsState.visible) {
      try {
        const antd = antdLib();
        if (antd && antd.Modal && typeof antd.Modal.info === "function") {
          antd.Modal.info({
            title: "问卷设置", centered: true, width: 480, okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。",
          });
        }
      } catch (_) { /* ignore */ }
      settingsState.visible = false;
    }
    return;
  }
  if (!settingsPanelRoot) {
    // Detached container under <body> — deliberately outside the host tree.
    settingsPanelRoot = document.createElement("div");
    settingsPanelRoot.id = "qm-settings-root";
    document.body.appendChild(settingsPanelRoot);
  }
  ReactDOM.render(R.createElement(SettingsPanel, {
    R,
    open: settingsState.visible,
    onClose: () => {
      // Unsaved edits must not vanish silently — the user chose an explicit
      // save model, so discarding has to be an explicit choice too.
      if (cfgDirtyCount() > 0) {
        const ok = typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm("有未保存的修改，确定关闭并丢弃吗？")
          : false;
        if (!ok) return;
        cfgDiscard();
      }
      settingsState.visible = false;
      settingsState.saveMsg = "";
      settingsRenderPanel();
    },
    tab: settingsState.tab,
    onTabChange: (t: string) => {
      // Remember the user's real choice before a global-only tab overrides it.
      settingsState.tab = t;
      // 2026-11-12：右上角作用域选择器移除后，「会话模式 / 默认模式」页签
      // 本身就是作用域选择入口。点这两个页签要记住选择（localStorage），
      // 2026-11-13 用户裁定：**不再把页签选择写进 localStorage**。
      // 那条记忆是全局键（所有会话共用），会让「会话2 选了默认模式」串到
      // 会话1 的显示上。现在页签只是"看哪一页"，不持久化；
      // 每次打开面板都按本会话真实的 has_session 决定初始页签。
      if (t === "session" || t === "default") {
        settingsState.scopeChoice = t;
      }
      // Scope follows the tab now (no switcher): 当前会话 writes overrides,
      // every other tab writes the global defaults.
      settingsState.scope = TAB_IS_SESSION(t) ? "session" : "global";
      // The result banner belongs to the save that just happened; leaving it up
      // while browsing another tab reads as "this tab was saved too".
      settingsState.saveMsg = "";
      // Switching scope invalidates the draft: a half-edited global value must
      // not be saved onto the session (or vice versa).
      settingsState.draft = {};
      settingsRenderPanel();
      loadEffectiveConfigIntoSettings();
      // 诊断页需要缓存清单；打开就拉，避免显示「正在读取」后一直空着。
      // default / global 两页都读写全局磁盘值，切过去就刷新。
      if (t === "global" || t === "default") void loadGlobalCfg();
    },
    scope: settingsState.scope,
    scopeChoice: settingsState.scopeChoice,
    sessData: settingsState.sessData,
    cfg: settingsState.cfg,
    cfgError: settingsState.cfgError,
    chatId: settingsState.chatId,
    dirtyCount: cfgDirtyCount(),
    saving: settingsState.saving,
    saveMsg: settingsState.saveMsg,
    conflictNote: settingsState.conflictNote,
    modelOptions: settingsState.modelOptions,
    templateOptions: settingsState.templateOptions,
    providerGroups: settingsState.providerGroups,
    templates: settingsState.templates,
    tplEdit: settingsState.tplEdit,
    tplBusy: settingsState.tplBusy,
  }), settingsPanelRoot);
}

/** The toolbar button. Plain function component; state lives in module scope
 *  so the component itself needs no hooks (this plugin has been bitten by
 *  hook-order issues when components are invoked directly). */
/** 设置入口：只显示图标（2026-11-13 用户裁定 q2=图标单独）。
 *
 *  图标选择：用户点名「类似问卷的图标」→ 复用卡片标题同一套候选
 *  （`TITLE_ICON_NAMES`），视觉上把「入口」和「问卷」绑成一件事。
 *  实测宿主 antdIcons 共 836 个，`FormOutlined`/`ProfileOutlined`/
 *  `CheckSquareOutlined` 均可用；缺任何图标时回落齿轮，最后才回落文字。
 *
 *  ★ 可发现性不能丢：纯图标必须带 title + aria-label，
 *    否则用户（以及读屏软件）不知道这个按钮是干什么的。
 */
function SettingsButton(props: { R: any; onOpen: () => void }): any {
  const { R, onOpen } = props;
  const antd = antdLib();
  const Button = antd && antd.Button;
  const LABEL = "问卷设置";
  const style = { fontSize: 12, padding: "2px 6px", height: 28 };
  const a11y = { title: LABEL, "aria-label": LABEL };

  // 图标：与卡片标题同源，外加齿轮兜底。
  let iconNode: any = null;
  try {
    const icons = iconLib();
    const names = TITLE_ICON_NAMES.concat(["SettingOutlined"]);
    for (const name of names) {
      const Cmp = icons[name];
      if (Cmp) {
        // 图标尺寸 15→13→12（2026-11-13 用户两次要求缩小）。
        // 只缩图形，不动按钮的 height:28 / padding：点击热区保持不变，
        // 避免为了美观牺牲可点性。
        iconNode = R.createElement(Cmp, { style: { fontSize: 12 } });
        break;
      }
    }
  } catch (_) { /* 图标库不可用 → 回落文字 */ }

  if (!iconNode) {
    // 宿主没给图标 → 保持原样文本按钮，绝不渲染空白按钮。
    if (Button) {
      return R.createElement(Button,
        { type: "text", size: "small", style, onClick: onOpen }, LABEL);
    }
    return R.createElement("button",
      { type: "button", className: "qm-set-btn", style, onClick: onOpen }, LABEL);
  }

  if (Button) {
    return R.createElement(Button, {
      type: "text", size: "small", style, onClick: onOpen,
      title: a11y.title, "aria-label": a11y["aria-label"],
    }, iconNode);
  }
  return R.createElement("button", {
    type: "button", className: "qm-set-btn", style, onClick: onOpen,
    title: a11y.title, "aria-label": a11y["aria-label"],
  }, iconNode);
}

// ── 设置页签定义（纯 UI，2026-11-04）──────────────────────────────
// 页签分组对齐插件「当前真实具备的能力」，不凭空发明设置项：
//   作答  ← 三模式(ai/recommend/manual) + 推荐徽章 + 未作答拦截 + 题级计时
//   分析  ← 模型胶囊 + 提示词模板 + 携带上下文 + 并行调用 + 单题超时
//   提示词 ← 内置/自定义模板 + 新增/编辑/删除入口
//   显示  ← 徽章样式 + 选项编号 + 题干兜底 + 历史卡折叠
//   诊断  ← 等待阈值 + 拦截记录 + bundle 指纹（只读）
/** Tabs are SCOPE-FIRST (2026-11-04 重排).
 *
 *  Why: the old layout was six feature tabs plus a scope switcher on top, and
 *  switching to "current session" greyed out most of the form.  That reads as
 *  "the settings are broken", not as "this item is global-only".
 *
 *  Now the SCOPE is the tab, so nothing is ever greyed out:
 *   当前会话 → the four session-overridable items (inherited values shown,
 *              editing creates an override for this chat)
 *   全局默认 → all sixteen configurable items (the defaults for every chat)
 *   提示词 / 诊断 → scope-independent pages
 */
const SETTINGS_TABS: Array<{ key: string; label: string; hint: string }> = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
];

/** Keys a per-session override may hold.
 *
 *  Deliberately just the four the user picked (driving mode + the three
 *  analysis inputs).  Badge / numbering / gate / timing are global behaviour
 *  choices; listing them twice is exactly what made the old layout confusing.
 */
// Session-scope keys — ONE list shared by the settings「当前会话」tab and the
// in-card controls.  Adding a key here makes it overridable per chat on both
// paths at once (2026-11-04 裁定乙：卡片上改任何一项都等于改本会话设置).
const SESSION_KEYS = ["mode", "model_id", "template_id", "with_context", "parallel"];

/** Which tabs contain at least one session-scoped setting.
 *
 *  「作答」「分析」both mix global and session items, so the scope switch
 *  applies there.  The rest are global-only (templates are a shared library;
 *  badge/numbering are display prefs) or read-only diagnostics — switching to
 *  "current session" on those would promise an override that cannot exist, so
 *  the scope is forced back to global and the switch is disabled.
 */
/** Which settings batches are actually WIRED to persistence.
 *
 *  batch 1 = 作答页签 5 项 (mode / show_recommend_badge / gate_unsaved /
 *            slow_question_sec / skip_mode) — real save → disk.
 *  When a later batch is wired, add it here; the badge and any wording that
 *  claims "not wired" should derive from this, never be hard-coded.
 */
const WIRED_BATCHES: number[] = [1];
const BATCH1_WIRED = WIRED_BATCHES.indexOf(1) !== -1;

/** Does this tab write a per-session override instead of the global defaults? */
const TAB_IS_SESSION = (tab: string): boolean => tab === "session";

/** 作用域标签：global = 全局默认，session = 仅当前会话，readonly = 只读信息。
 *  纯展示，点击不改变任何东西（本页签仍是 UI 预览）。 */
function setScopeTag(R: any, key: string, scope: string): any {
  // 2026-11-12 用户裁定：行内「全局 / 会话」作用域小标签全部去掉——信息冗余、
  // 视觉噪音；仅保留「只读」标签，提示该行不可编辑。
  if (scope !== "readonly") return null;
  return R.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero", key,
    title: "只读信息",
  }, "只读");
}

/** 一个小行：左侧标签（+作用域标签） + 右侧控件。纯展示容器。 */
/** A row is locked when the active scope does not govern it.
 *
 *  Rule: a GLOBAL-only item is not editable while scope = session (there is no
 *  per-session version of it to edit).  A SESSION item stays editable under
 *  scale = global, because that is where its default value lives.
 *  Read-only rows are never editable either way.
 */
function setRowLocked(scope: string, itemScope: string): boolean {
  if (itemScope === "readonly") return true;
  return scope === "session" && itemScope === "global";
}

function setRow(
  R: any, key: string, label: string, control: any, note?: string, scope?: string,
  activeScope?: string, wide?: boolean,
): any {
  const itemScope = scope || "global";
  const locked = setRowLocked(activeScope || "global", itemScope);
  const labelKids: any[] = [
    R.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      R.createElement("span", { key: "tt" }, label),
      setScopeTag(R, "sc", itemScope),
      locked && itemScope === "global"
        ? R.createElement("span", {
            className: "qm-set-lockhint", key: "lk",
            title: "该项只有全局设置，当前处于「当前会话」作用域",
          }, "仅全局")
        : null,
    ]),
    note ? R.createElement("span", { className: "qm-set-rownote", key: "n" }, note) : null,
  ];
  const kids: any[] = [
    R.createElement("div", { className: "qm-set-rowlabel", key: "l" }, labelKids),
    R.createElement("div", {
      className: "qm-set-rowctl" + (wide ? " qm-set-rowctlwide" : ""), key: "c",
    }, control),
  ];
  return R.createElement("div", {
    className: "qm-set-row" + (locked ? " qm-set-rowlocked" : ""),
    key,
    "data-qm-locked": locked ? "1" : "0",
  }, kids);
}

/** 分段按钮组：用来自绘「互斥选项」，不依赖宿主的 Segmented/Radio。 */
/** Three small controls, now CONTROLLED.
 *
 *  They used to be decoration (no click handler at all), which is why wiring
 *  them up later would have looked "done" while doing nothing.  Each takes the
 *  current value plus an `onPick`; when `onPick` is absent the control renders
 *  read-only (locked rows pass nothing).
 *
 *  2026-11-12 用户裁定：覆盖标记圆点整体移除；「已选中」由 qm-set-segon
 *  高亮表达（与右上角作用域选择器同一视觉语言）。
 */
function setSeg(
  R: any, key: string, items: string[], active: string,
  onPick?: (v: string) => void,
): any {
  return R.createElement("div", { className: "qm-set-seg", key },
    items.map((it, i) => R.createElement("button", {
      key: "s" + i, type: "button",
      "data-qm-val": it,
      disabled: !onPick,
      className: "qm-set-segbtn" + (it === active ? " qm-set-segon" : "")
        + (onPick ? "" : " qm-set-ctrldis"),
      onClick: () => { if (onPick) onPick(it); },
    }, [
      R.createElement("span", { key: "t" }, it),
    ])));
}

function setSwitch(
  R: any, key: string, on: boolean,
  onPick?: (v: boolean) => void,
): any {
  return R.createElement("div", {
    key,
    className: "qm-set-switch" + (on ? " qm-set-switch-on" : "")
      + (onPick ? "" : " qm-set-ctrldis"),
    "data-qm-on": on ? "1" : "0",
    role: "switch",
    // Self-drawn switch: without these the a11y tree reports an unchecked
    // switch regardless of the real state (observed in a real browser).
    "aria-checked": on ? "true" : "false",
    "aria-disabled": onPick ? "false" : "true",
    tabIndex: onPick ? 0 : -1,
    onClick: () => { if (onPick) onPick(!on); },
    onKeyDown: (e: any) => {
      if (!onPick) return;
      const k = e && e.key;
      if (k === " " || k === "Enter") { e.preventDefault(); onPick(!on); }
    },
  }, [
    R.createElement("span", { key: "k", className: "qm-set-knob" }),
  ]);
}

/** Select — antd's Select is optional at runtime, so this renders a real
 *  <select> when the host provides nothing.  (Kept self-drawn deliberately:
 *  the host does not inject every antd component name.) */
function setSelect(
  R: any, key: string, text: string,
  options?: any[], onPick?: (v: string) => void,
): any {
  if (options && options.length && onPick) {
    // 选项可以是字符串，也可以是 { value, label }：模板下拉里 value 是模板 id，
    // label 是人类可读的名称——只显示 id（builtin-default）用户无法分辨。
    const norm = options.map((o: any, i: number) => {
      if (o && typeof o === "object") {
        return { value: String(o.value), label: String(o.label || o.value) };
      }
      return { value: String(o), label: String(o) };
    });
    return R.createElement("div", { className: "qm-set-select" + " qm-set-selectlive", key }, [
      R.createElement("select", {
        key: "s", className: "qm-set-native",
        value: text,
        onChange: (e: any) => onPick(e && e.target ? e.target.value : ""),
      }, norm.map((o, i) => R.createElement("option", { key: "o" + i, value: o.value }, o.label))),
    ]);
  }
  return R.createElement("div", { className: "qm-set-select", key }, [
    R.createElement("span", { key: "t", className: "qm-set-selecttext" }, text),
    R.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾"),
  ]);
}

/** Two linked dropdowns: provider on the left, that provider's models on the right.
 *
 *  Why not one long list: with 7 providers and 33 models a flat dropdown makes
 *  you scan everything, and two providers can offer the same model NAME
 *  (`deepseek-v4-flash` exists under both sensenova and sensenova-new) so the
 *  name alone cannot identify a choice.  Picking a provider narrows the second
 *  list; the stored value stays the unambiguous `provider:model`.
 *
 *  Neither <select> is disabled: the model list simply follows the provider.
 *  空值（未配置）时服务端自动解析当前会话的对话模型。
 */
function setModelPicker(
  R: any, key: string, value: string,
  groups: ProviderGroup[],
  onPick?: (v: string) => void,
): any {
  const parsed = splitModelId(value);
  const ids = groups.map((g) => g.id);
  // A stored provider that no longer exists falls back to "跟随当前对话模型"
  // rather than silently showing a provider that has no entry in the list.
  const curProvider = ids.indexOf(parsed.provider) >= 0 ? parsed.provider : "";
  const curModels = curProvider
    ? (groups.filter((g) => g.id === curProvider)[0] || { models: [] }).models
    : [];
  const curModel = curModels.indexOf(parsed.model) >= 0 ? parsed.model : "";

  const emit = (pid: string, model: string) => {
    if (!onPick) return;
    onPick(pid ? pid + ":" + model : "");
  };

  const providerSel = R.createElement("select", {
    key: "p", className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: curProvider,
    disabled: !onPick,
    title: "厂商",
    onChange: (e: any) => {
      const pid = e && e.target ? e.target.value : "";
      const list = pid
        ? (groups.filter((g) => g.id === pid)[0] || { models: [] }).models
        : [];
      // Picking a provider auto-selects its first model: leaving the model blank
      // while a provider is chosen would store `provider:` and resolve to
      // nothing, which reads as "the setting was lost".
      emit(pid, pid ? (list[0] || "") : "");
    },
  // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
  // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
  // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [R.createElement("option", { key: "g0", value: "", disabled: true }, "未配置")]
    .concat(groups.map((g, i) =>
      R.createElement("option", { key: "g" + i, value: g.id },
        g.name === g.id ? g.id : g.name + "（" + g.models.length + "）"))));

  const modelSel = R.createElement("select", {
    key: "m", className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: curModel,
    disabled: !onPick || !curProvider,
    title: curProvider ? "选择模型" : "先选厂商",
    onChange: (e: any) => {
      const model = e && e.target ? e.target.value : "";
      emit(curProvider, model);
    },
  }, curProvider
    ? curModels.map((m, i) =>
        R.createElement("option", { key: "m" + i, value: m }, m))
    : [R.createElement("option", { key: "m0", value: "" }, "—")]);

  return R.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key }, [
    providerSel,
    R.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    modelSel,
  ]);
}

/** 「会话」页签：只列「设了会话级配置」的会话 — 会话 id + 所属智能体两列。
 *
 *  Empty state is the normal state right now: the settings UI is still a pure
 *  preview and never writes an override, so nothing has been stored yet.
 */
function sessionsPane(R: any, data: { items: any[]; count: number; ok: boolean } | null): any {
  const rows = (data && data.items) || [];
  const head = R.createElement("div", { className: "qm-set-sesshead", key: "h" }, [
    R.createElement("span", { className: "qm-set-sesscol1", key: "c1" }, "会话 id"),
    R.createElement("span", { className: "qm-set-sesscol2", key: "c2" }, "智能体"),
  ]);

  if (!rows.length) {
    const msg = data && data.ok === false
      ? "读取会话级配置失败（后端暂不可达）"
      : "暂无会话级配置";
    return [
      head,
      R.createElement("div", {
        className: "qm-set-sessempty", key: "e", "data-qm-sess-empty": "1",
      }, msg),
      R.createElement("div", { className: "qm-set-sessnote", key: "n" },
        "只有显式设置过会话级配置的会话才会出现在这里；未出现的会话都沿用全局默认值。"),
    ];
  }

  const items = rows.map((r, i) => R.createElement("div", {
    className: "qm-set-sessrow", key: "r" + i,
    "data-qm-sess-id": r.chat_id || "",
  }, [
    R.createElement("div", { className: "qm-set-sesscol1", key: "c1" }, [
      R.createElement("div", { className: "qm-set-sessid", key: "s" },
        r.session_id || "（无 session_id）"),
      R.createElement("div", {
        className: "qm-set-sessuuid", key: "u", title: "chat UUID（唯一标识）",
      }, r.chat_id || ""),
      r.missing
        ? R.createElement("div", { className: "qm-set-sessgone", key: "g" },
            "会话已不存在，配置仍保留")
        : null,
    ]),
    R.createElement("div", { className: "qm-set-sesscol2", key: "c2" },
      r.agent_name || r.agent_id || "（未知）"),
  ]));

  return [
    head,
    R.createElement("div", { className: "qm-set-sesslist", key: "l" }, items),
    R.createElement("div", { className: "qm-set-sessnote", key: "n" },
      "共 " + rows.length + " 个会话设置了会话级配置。"),
  ];
}

function settingsTabBody(
  R: any, tab: string, activeScope?: string, sessData?: any,
  opts?: { modelOptions?: string[]; templateOptions?: string[]; providerGroups?: ProviderGroup[] },
): any {
  const bodyKids: any[] = [];
  const scope = activeScope === "session" ? "session" : "global";
  const isSession = scope === "session";

  // ── shared value/编辑 helpers ──
  // A row is editable when the CURRENT tab owns it.  With scope-as-tab there
  // is nothing to grey out: 当前会话 shows only overridable keys, 全局默认
  // shows the rest, so every visible control is always live.
  // （分组小标题「作答/分析/行为/杂项」已按用户裁定移除（2026-11-12），
  //   行本身自 explan，无需再分层。）

  // ── option tables（唯一一处标签↔存储值映射）──
  const MODE_BY_LABEL: Record<string, string> = {
    "自动分析": "ai", "只用推荐": "recommend", "人工": "manual",
  };
  const MODE_LABEL: Record<string, string> = {
    ai: "自动分析", recommend: "只用推荐", manual: "人工",
  };
  const SKIP_BY_LABEL: Record<string, string> = {
    "逐题跳过": "per_question", "整卷跳过": "whole",
  };
  const SKIP_LABEL: Record<string, string> = {
    per_question: "逐题跳过", whole: "整卷跳过",
  };
  const SLOW_BY_LABEL: Record<string, number> = {
    "关闭": 0, "30 秒": 30, "60 秒（默认）": 60, "120 秒": 120, "300 秒": 300,
  };
  const SLOW_LABEL: Record<number, string> = {
    0: "关闭", 30: "30 秒", 60: "60 秒（默认）", 120: "120 秒", 300: "300 秒",
  };
  const TO_BY_LABEL: Record<string, number> = {
    "30 秒": 30, "60 秒": 60, "120 秒（默认）": 120, "300 秒": 300, "600 秒": 600,
  };
  const TO_LABEL: Record<number, string> = {
    30: "30 秒", 60: "60 秒", 120: "120 秒（默认）", 300: "300 秒", 600: "600 秒",
  };
  const POS_BY_LABEL: Record<string, string> = { "选项左侧": "left", "选项右侧": "right" };
  const POS_LABEL: Record<string, string> = { left: "选项左侧", right: "选项右侧" };
  const STY_BY_LABEL: Record<string, string> = { "矩形描边": "rect", "圆角填充": "round" };
  const STY_LABEL: Record<string, string> = { rect: "矩形描边", round: "圆角填充" };
  const WAIT_BY_LABEL: Record<string, number> = {
    "30 秒": 30, "60 秒": 60, "120 秒": 120, "180 秒（默认）": 180,
    "300 秒": 300, "600 秒": 600,
  };
  const WAIT_LABEL: Record<number, string> = {
    30: "30 秒", 60: "60 秒", 120: "120 秒", 180: "180 秒（默认）",
    300: "300 秒", 600: "600 秒",
  };

  const tplOpts: string[] = ((opts && opts.templateOptions) || []) as string[];
  const modelOpts: string[] = ((opts && opts.modelOptions) || []) as string[];
  const groups: ProviderGroup[] = ((opts && opts.providerGroups) || []) as ProviderGroup[];

  // 模板下拉的选项：value 是模板 id（存这个），label 是人类可读的名称。
  // 只显示 id 会出现「builtin-default」这种用户看不懂的值。
  // 放在两个作用域分支之外，会话页与全局页共用同一份。
  const tplChoices: any[] = tplOpts.map((id: string) => {
    const t = settingsState.templates.filter((x: any) => String(x.id) === String(id))[0];
    return { value: id, label: (t && (t.name || t.id)) || id };
  });

  // ═══════════════════ 当前会话 ═══════════════════
  // Only the four overridable keys.  Inherited values are SHOWN (so the page is
  // never blank) and editing one creates the override for this chat.
  if (tab === "session") {
    // 2026-11-13 用户澄清后的最终规则（q1 澄清问卷）：
    //   「自动分析」「人工」→ 显示 默认模型 / 提示词模板 / 携带上下文 / 并行分析各题
    //   「只用推荐」        → 隐藏上述 4 行（该模式零模型调用，四项都无关）
    // 两页各按自己的答题模式值判断；cfgValue 优先读 draft，点分段按钮即刻显隐。
    const sessMode = String(cfgValue("mode", "manual"));
    const showAnalysisRows = sessMode !== "recommend";
    bodyKids.push(setRow(R, "s1", "答题模式",
      setSeg(R, "g1", ["自动分析", "只用推荐", "人工"],
        MODE_LABEL[String(cfgValue("mode", "manual"))] || "人工",
        (lb) => cfgEdit("mode", MODE_BY_LABEL[lb] || "manual")),
      "本会话的问卷默认用哪种方式推进", "session", scope));

    if (showAnalysisRows) {
    bodyKids.push(setRow(R, "s2", "默认模型",
      setModelPicker(R, "sel2", String(cfgValue("model_id", "")),
        groups, (v) => cfgEdit("model_id", v)),
      // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
      //   跟随中   → 指明跟的是"本会话"的对话模型
      //   显式设空 → 如实说你清掉了它
      //   其余     → 正常说明
      cfgExplicitEmpty("model_id")
        ? "已显式设为空（本会话不指定模型）"
        : "自动读取当前对话模型；改动即自动切换",
      "session", scope, true));

    const curTplId = String(cfgValue("template_id", "")) || (tplChoices[0] && tplChoices[0].value) || "";
    bodyKids.push(setRow(R, "s3", "提示词模板",
      tplChoices.length
        ? setSelect(R, "sel3", curTplId, tplChoices,
            (v) => cfgEdit("template_id", v))
        : setSelect(R, "sel3", "默认六步思维链"),
      tplChoices.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
      "session", scope));

    bodyKids.push(setRow(R, "s4", "携带上下文",
      setSwitch(R, "s4sw", !!cfgValue("with_context", false),
        (v) => cfgEdit("with_context", v)),
      "附带上次决策与会话历史", "session", scope));

    bodyKids.push(setRow(R, "s5", "并行分析各题",
      setSwitch(R, "s5sw", !!cfgValue("parallel", false),
        (v) => cfgEdit("parallel", v)),
      "逐题并发调用模型，更快，但更耗额度。", "session", scope));
    }

    // sesshint 说明文字已按用户裁定移除（2026-11-04）。
    // 「清空本会话覆盖」按钮已按用户裁定移除（2026-11-12）：右上角作用域
    // 选择器改为手动选择后，该按钮语义冗余；后端 /session-prefs/clear 保留。

  // ═══════════════════ 默认配置 / 全局配置（都写全局磁盘值）═══════════════════
  // 2026-11-04 拆页（用户裁定）：按功能性质分两页 —
  //   default =「默认配置」：作答 + 分析的行为项
  //   global  =「全局配置」：显示类纯展示项 + 杂项（等待阈值/拦截记录）
  // 两页都 POST /prefs 写全局；拆的只是展示，不是作用域。
  } else if (tab === "global" || tab === "default") {
    const isDefaultsTab = tab === "default";
    if (isDefaultsTab) {
    // 2026-11-13 用户裁定：说明去掉「（可被会话覆盖）」，统一用会话模式页原文；
    // 显隐规则同会话页（q1 澄清）：「只用推荐」隐藏 4 行，其余两模式全显示。
    const defMode = String(cfgValue("mode", "manual", "global"));
    const showDefAnalysisRows = defMode !== "recommend";
    bodyKids.push(setRow(R, "a1", "默认答题模式",
      setSeg(R, "g1", ["自动分析", "只用推荐", "人工"],
        MODE_LABEL[String(cfgValue("mode", "manual", "global"))] || "人工",
        (lb) => cfgEdit("mode", MODE_BY_LABEL[lb] || "manual")),
      "本会话的问卷默认用哪种方式推进", "both", scope));

    if (showDefAnalysisRows) {
    bodyKids.push(setRow(R, "b1", "默认模型",
      setModelPicker(R, "sel2", String(cfgValue("model_id", "", "global")),
        groups, (v) => cfgEdit("model_id", v)),
      "自动读取当前对话模型；改动即自动切换", "both", scope, true));

    bodyKids.push(setRow(R, "b2", "提示词模板",
      tplChoices.length
        ? setSelect(R, "sel3", String(cfgValue("template_id", "", "global")) || tplChoices[0].value, tplChoices,
            (v) => cfgEdit("template_id", v))
        : setSelect(R, "sel3", "默认六步思维链"),
      tplChoices.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
      "both", scope));

    bodyKids.push(setRow(R, "b3", "携带上下文",
      setSwitch(R, "s3", !!cfgValue("with_context", false, "global"),
        (v) => cfgEdit("with_context", v)),
      "附带上次决策与会话历史", "both", scope));

    bodyKids.push(setRow(R, "b4", "并行分析各题",
      setSwitch(R, "s4", !!cfgValue("parallel", false, "global"),
        (v) => cfgEdit("parallel", v)),
      "逐题并发调用模型，更快，但更耗额度。", "global", scope));
    }

    } else {
    // ── 全局配置页（显示类 + 杂项）──
    // ──「显示」节已按用户裁定移除（2026-11-04）：这些项固定为当前磁盘值，
    //   不再暴露配置入口（badge_position/left、badge_style/round、
    //   highlight_recommended/off、auto_number_options/on、fallback_title/on）。──

    // ── 行为（2026-11-04：从「默认模式」页迁来 —— 默认模式页只保留与
    // 「会话模式」页一致的 5 项，多出的全局专属行为归到这里。）──
    bodyKids.push(setRow(R, "e5", "人工模式时提醒",
      setSwitch(R, "s8", !!cfgValue("notify_manual_mode", false, "global"),
        (v) => cfgEdit("notify_manual_mode", v), false),
      // 文案保持一行能放下（用户裁定 2026-11-12：位置足够，不要换行）
      "弹出时系统通知（仅人工模式，每卷一次；首次请求通知权限）", "global", scope));
    bodyKids.push(setRow(R, "e6", "单题分析超时",
      setSelect(R, "sel4", TO_LABEL[Number(cfgValue("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
        ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
        (lb) => cfgEdit("model_timeout_sec", TO_BY_LABEL[lb] ?? 120), false),
      "超时后该题按未给出推荐处理（后端保护下限 30 秒）", "global", scope));

    // ── 杂项（行为类，归「全局配置」而非诊断：它们是可编辑的全局设置）──
    bodyKids.push(setRow(R, "d4", "等待提示阈值",
      setSelect(R, "sel5", WAIT_LABEL[Number(cfgValue("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
        ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
        (lb) => cfgEdit("wait_hint_sec", WAIT_BY_LABEL[lb] ?? 180), false),
      "超过后提示可释放（保护下限 30 秒）", "global", scope));
    // d5 是可配置项（后端 gate_log_limit，0 = 不保留记录），此前误标成只读。
    const LOG_OPTS = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"];
    const LOG_MAP: Record<string, number> = {
      "不保留": 0, "最近 50 条": 50, "最近 200 条（默认）": 200,
      "最近 500 条": 500, "最近 1000 条": 1000,
    };
    const LOG_LABEL: Record<number, string> = {
      0: "不保留", 50: "最近 50 条", 200: "最近 200 条（默认）",
      500: "最近 500 条", 1000: "最近 1000 条",
    };
    const lgv = Number(cfgValue("gate_log_limit", 200, "global"));
    bodyKids.push(setRow(R, "d5", "拦截记录",
      setSelect(R, "sel6", LOG_LABEL[lgv] || "最近 200 条（默认）", LOG_OPTS,
        (lb) => cfgEdit("gate_log_limit", LOG_MAP[lb] ?? 200), false),
      "用于排查卡住问题；“不保留”= 不记录", "global", scope));
    }   // ── end else（全局配置页内容）──

  // ═══════════════════ 提示词 ═══════════════════
  } else if (tab === "prompt") {
    // The list is whatever the server returns — same source as the 分析页
    // template dropdown, so a template added here appears there too.
    const tpls = settingsState.templates;
    const editing = settingsState.tplEdit;

    bodyKids.push(setRow(R, "p0", "模板库共享范围",
      R.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立", "global", scope));

    if (!tpls.length) {
      bodyKids.push(R.createElement("div", { className: "qm-set-sessempty", key: "e" },
        "模板库为空（或尚未加载）"));
    } else {
      bodyKids.push(R.createElement("div", { className: "qm-set-list", key: "list" },
        tpls.map((r: any, i: number) => {
          const isBuiltin = !!r.builtin;
          // 描述只做预览：去掉 Markdown 记号（**加粗**、# 标题、`代码`），
          // 压缩空白，再按长度截断并显式加省略号——否则会出现
          // 「把六步**写在 reasoni」这种半截 Markdown 残片。
          const rawDesc = String(r.note || r.desc || "").trim()
            || String(r.system || r.system_prompt || r.prompt || "");
          const cleanDesc = rawDesc
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/[#*_`>]/g, "")
            .replace(/\s+/g, " ")
            .trim();
          const desc = cleanDesc.length > 90
            ? cleanDesc.slice(0, 90) + "…"
            : cleanDesc;
          return R.createElement("div", { className: "qm-set-item", key: "i" + i }, [
            R.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
              R.createElement("span", { className: "qm-set-itemname", key: "n" },
                String(r.name || r.id)),
              R.createElement("span", {
                className: "qm-set-tag" + (isBuiltin ? " qm-set-tagbuiltin" : ""), key: "g",
              }, isBuiltin ? "内置" : "自定义"),
              R.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
              // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
              // 但不可「删除」——删除按钮对内置项置灰。
              R.createElement("button", {
                type: "button", className: "qm-set-mini", key: "ed",
                "data-qm-tpl-edit": String(r.id),
                onClick: () => { tplStartEdit(String(r.id)); },
              }, "编辑"),
              R.createElement("button", {
                type: "button",
                className: "qm-set-mini" + (isBuiltin ? " qm-set-minidis" : ""), key: "del",
                "data-qm-tpl-del": String(r.id),
                disabled: isBuiltin,
                title: isBuiltin ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
                onClick: () => { if (!isBuiltin) void tplDelete(String(r.id)); },
              }, "删除"),
            ]),
            R.createElement("div", { className: "qm-set-itemdesc", key: "d" }, desc),
          ]);
        })));
    }

    // 工具栏不再塞 scope 标签：上面「模板库共享范围」那一行已经标明是全局，
    // 在这里再放一个孤立标签只会变成一个看不懂的空方块。
    bodyKids.push(R.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      R.createElement("button", {
        type: "button", className: "qm-set-btn qm-set-btnnew", key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => { tplStartNew(); },
      }, "＋ 新建模板"),
    ]));

    // ── 编辑器（新建 / 编辑共用）──
    if (editing) {
      // UNCONTROLLED on purpose.
  // The panel repaints via ReactDOM.render (whole tree).  A controlled input
  // whose value comes from that state loses keystrokes: every repaint replaces
  // the node mid-typing and the textarea's DOM value is what the user sees,
  // while `state` keeps the pre-typing value — which shows up as "the field
  // has text but the save says it is empty".  `defaultValue` + onChange-to-state
  // keeps typing native and still captures the value for the save.
  const field = (label: string, key: string, multi: boolean, rows: number, ph: string) =>
        R.createElement("div", { className: "qm-set-field", key: "f-" + key }, [
          R.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, label),
          multi
            ? R.createElement("textarea", {
                key: "c", className: "qm-set-textarea", rows,
                "data-qm-tpl-field": key,
                placeholder: ph,
                value: String((settingsState.tplEdit as any)?.[key] || ""),
                onChange: (e: any) => tplEditField(key, e && e.target ? e.target.value : ""),
              })
            : R.createElement("input", {
                key: "c", className: "qm-set-input",
                "data-qm-tpl-field": key,
                placeholder: ph,
                value: String((settingsState.tplEdit as any)?.[key] || ""),
                onChange: (e: any) => tplEditField(key, e && e.target ? e.target.value : ""),
              }),
        ]);

      // key 只随「编辑哪个模板」变化（不随输入变化）：切换目标时整块重建，
      // 输入过程中不会重挂载，受控 value 与 state 才能保持一致。
      bodyKids.push(R.createElement("div", {
        className: "qm-set-editor", key: "ed-" + (editing.id || "new"),
      }, [
        R.createElement("div", { className: "qm-set-editortitle", key: "t" },
          editing.id ? ("编辑模板：" + (editing.name || editing.id)) : "新建模板"),
        field("模板名称", "name", false, 0, "如：简短结论版"),
        field("系统提示词", "system_prompt", true, 6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"),
        field("用户提示词模板", "user_prompt", true, 5,
          "可用占位符：{question} {options} {context} {title} {index} {total} {type} {showIf}"),
        R.createElement("div", { className: "qm-set-editorbtns", key: "b" }, [
          R.createElement("button", {
            type: "button", className: "qm-set-btn qm-set-btnprimary",
            key: "save", "data-qm-tpl-save": "1",
            disabled: !!settingsState.tplBusy,
            onClick: () => { void tplSave(); },
          }, settingsState.tplBusy ? "保存中…" : "保存"),
          R.createElement("button", {
            type: "button", className: "qm-set-btn", key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => { tplCancelEdit(); },
          }, "取消"),
        ]),
      ]));
    }


  }

  return R.createElement("div", { className: "qm-set-tabbody", key: "tb" }, bodyKids);
}

/** The centered modal (NOT a drawer). Renders nothing while closed. */
function SettingsPanel(props: {
  R: any; open: boolean; onClose: () => void;
  tab?: string; onTabChange?: (t: string) => void;
  scope?: string;
  /** 右上角「当前运行」胶囊：显示值 + 点击切换回调（2026-11-13 恢复可切换）。 */
  scopeChoice?: string;
  sessData?: any;
  cfg?: EffectiveConfig | null; cfgError?: string; chatId?: string;
  dirtyCount?: number; saving?: boolean; saveMsg?: string; conflictNote?: string;
}): any {
  const { R, open, onClose } = props;
  if (!open) return null;
  const antd = antdLib();
  const Modal = antd && antd.Modal;
  // ★ `tab === ""` 表示「配置未到达，页签未定」：此时**不高亮任何页签**，
  //   内容区渲染加载骨架（用户 2026-11-13 裁定方案A）。
  //   绝不能回落成 "session"/"default" —— 那正是"先画错页签再跳"的来源。
  const tabPending = !props.tab;
  const active = props.tab || "";
  // Scope follows the tab — there is no switcher any more, so nothing to lock.
  // 未定时按 global：骨架态不渲染任何可编辑控件，这个值不会被用户看到。
  const scope = TAB_IS_SESSION(active) ? "session" : "global";

  // ── 页签条（自绘，不依赖宿主 Tabs 组件名）──
  const tabBar = R.createElement("div", { className: "qm-set-tabs", key: "tabs" },
    SETTINGS_TABS.map((t) => R.createElement("button", {
      key: t.key, type: "button",
      className: "qm-set-tab"
        + (!tabPending && t.key === active ? " qm-set-tabon" : ""),
      onClick: () => { try { props.onTabChange && props.onTabChange(t.key); } catch (_) {} },
    }, t.label)));

  const activeMeta = SETTINGS_TABS.filter((t) => t.key === active)[0] || SETTINGS_TABS[0];
  // 右上角 = 参考稿头部的状态胶囊（status-pill），只保留「一个」元素：
  // 2026-11-12 用户反馈「运行模式出现了 2 个」→ 删掉并排的手动作用域选择器；
  // 2026-11-13 用户反馈「无法切换，之前是可以切换的」→ 让这个胶囊本身可点击，
  // 点击在「会话模式 / 默认模式」之间切换，并跳到对应页签（q0 裁定：
  // 保存目标与底部提示按页签走，与之前选择器一致）。
  // ── 右上角胶囊：只读状态指示（2026-11-13 用户第二轮裁定）────────────
  //
  // 三条裁定：
  //   ① q0：胶囊**只显示、不可点** —— 去掉 ⇄、去掉 hover/手型，
  //      切换作用域完全靠下方页签。
  //   ② q1+追加确认：胶囊文字**只显示「会话模式」/「默认模式」**，
  //      不带「当前运行：」前缀（用户第二次明确选了去前缀）。
  //   ③ q2：初始页签由本会话真实状态决定（有覆盖→会话，无→默认），
  //      在该页签点保存就写入该层。
  //
  // 为什么唯一依据是 has_session：曾经用 scopeChoice（= 点开了哪个页签）
  // 来显示，而它是跨会话共享的全局 localStorage 键 —— 在会话2 点「默认模式」
  // 就会让会话1 也显示默认模式（数据没错，标签骗人）。
  // 现在胶囊只回答一个问题：**这个会话实际按哪套配置在跑**。
  const hasSess = !!(props.cfg && (props.cfg as any).has_session);
  const currentScope = hasSess ? "session" : "default";
  const runtimeLabel = hasSess ? "会话模式" : "默认模式";
  const head = R.createElement("div", { className: "qm-set-head", key: "h" }, [
    R.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // 「当前模式：」前缀放在胶囊**外面**（2026-11-13 用户裁定）：
    // 胶囊内只保留「会话模式」/「默认模式」四个字，语义标签独立成一个
    // 普通文本节点，避免把说明性文字也算进"状态值"里。
    R.createElement("div", {
      className: "qm-set-runtime-wrap", key: "rtw",
      "data-qm-runtime-wrap": "1",
      title: "本会话实际生效的配置层（有会话覆盖→会话模式，无→默认模式）",
    }, [
      R.createElement("span", {
        className: "qm-set-runtime-label", key: "rtl",
      }, "当前模式："),
      // 纯展示元素（div 而非 button）：不可点、无 onClick、无 hover。
      // 用 div 而不是 disabled button，避免被当成"禁用控件"而显得可点。
      R.createElement("div", {
        className: "qm-set-runtime", key: "rt",
        "data-qm-runtime": currentScope,
        "data-qm-scope-badge": currentScope,
      }, runtimeLabel),
    ]),
  ]);

  const hint = activeMeta.hint
    ? R.createElement("div", { className: "qm-set-subhint", key: "sh" }, activeMeta.hint)
    : null;

  // ── 作用域说明（静态一行，不再是切换器）──
  // The scope is decided by which tab you are on, so there is nothing to
  // toggle.  A single sentence still helps: it says ZERO of what the old
  // switcher said and cannot be mistaken for a control.
  // Banner text is per-tab: only the two scope tabs are about scope. Saying
  // "对所有会话生效的默认值" above a read-only diagnostics list was simply wrong.
  // 2026-11-04 用户裁定：三页的作用域说明文字全部去掉（多余），
  // 页签名与底部保存按钮文案已足够表达语义。
  const noteText = "";
  const sessionNote = noteText
    ? R.createElement("div", {
        className: active === "session" ? "qm-set-scopenote" : "qm-set-scopeglobalnote",
        key: "gn",
      }, noteText)
    : null;

  // ★ 未定态 → 加载骨架（用户 2026-11-13 裁定 q1：不显示"半成品"设置行）。
  //
  // 为什么必须挡住：`settingsTabBody` 会按 schema 默认值画出完整的设置行，
  // 数据到达后再整块换成真实值 —— 用户看到的就是"行先以默认值出现、
  // 再跳成真实值"，与页签闪烁是同一类观感问题，只是发生在内容区。
  // 骨架只占位、不承载任何可操作控件，不会误导也不会被误点。
  const skeleton = tabPending
    ? R.createElement("div", {
        className: "qm-set-skeleton", "data-qm-skeleton": "1",
        key: "skel", style: { padding: "8px 24px 20px" },
      }, [0, 1, 2].map((i) => R.createElement("div", {
        key: "sk" + i,
        style: {
          height: 44, marginBottom: 10, borderRadius: 8,
          background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
          animation: "qm-set-pulse 1.2s ease-in-out infinite",
          animationDelay: (i * 0.15) + "s",
        },
      })))
    : null;

  const tabBody = tabPending
    ? skeleton
    : settingsTabBody(R, active, scope, props.sessData, {
        modelOptions: props.modelOptions,
        templateOptions: props.templateOptions,
        providerGroups: props.providerGroups,
      });

  // ── 底部保存条（2026-11-12 用户裁定重排）──
  // One save button for the whole modal (the agreed model): it persists the
  // accumulated draft to whichever scope is currently selected.
  // 布局：左侧 = 未保存提示 + 保存目标说明；右下角 = 取消 + 保存（高亮）。
  // 「还原」按钮移除（易误点）；「取消」= 丢弃本次未保存的修改（不关闭面板）。
  const dirty = props.dirtyCount || 0;
  // ── 保存目标说明（2026-11-13 用户裁定：原文案有歧义）──────────────────
  //
  // 原文「保存到会话模式（覆盖全局默认，仅本会话）」有两处会被误读：
  //   ① 「覆盖全局默认」→ 读成"把全局默认值改掉了"，实际全局一点没动
  //   ② D1 之后会话层也不再"覆盖整份配置"，只覆盖**用户改过的那几项**，
  //      其余仍跟随全局 —— 说"覆盖全局默认"与事实不符
  //
  // 默认模式那句同理：D1 之后全局值只对**没有会话覆盖**的会话生效，
  // 已经设过会话覆盖的会话不受影响，所以"对所有会话生效"也过头了。
  //
  // 两句统一改成"说清作用范围 + 是否影响全局"的写法，与真实行为一致。
  const targetLabel = scope === "session"
    ? "保存到本会话（只覆盖你改过的项，不改全局）"
    : "保存为全局默认（对未设会话的会话生效）";
  const foot = R.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    R.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      dirty
        ? R.createElement("span", { className: "qm-set-dirty", key: "d" }, [
            R.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
            "有 " + dirty + " 项未保存",
          ])
        : null,
      R.createElement("span", { className: "qm-set-scopetarget", key: "t" }, targetLabel),
    ]),
    R.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      R.createElement("button", {
        key: "cancel", type: "button",
        className: "qm-set-btn", "data-qm-cancel": "1",
        disabled: !dirty || !!props.saving,
        onClick: () => { cfgDiscard(); settingsRenderPanel(); },
      }, "取消"),
      R.createElement("button", {
        key: "save", type: "button",
        className: "qm-set-btn qm-set-btnprimary", "data-qm-save": "1",
        // 保存始终可点（用户裁定 2026-11-12）：即使无未保存修改，也允许
        // 把当前值固化到目标作用域；只有请求进行中才禁用。
        disabled: !!props.saving,
        onClick: () => { void cfgSave(); },
      }, props.saving ? "保存中…" : "保存"),
    ]),
  ]);

  const saveMsgLine = props.saveMsg
    ? R.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, props.saveMsg)
    : null;

  // 并发覆盖提示（data-qm-conflict 供测试断言）。放在成功提示之后，
  // 同一次保存可能两者都有：保存成功 + 覆盖了别处的改动。
  const conflictLine = props.conflictNote
    ? R.createElement("div", {
        className: "qm-set-conflict", key: "cf", "data-qm-conflict": "1",
      }, props.conflictNote)
    : null;

  // 参考稿布局：头部/页签/底部固定，仅中间内容区滚动（footer 永不被裁掉）。
  const scroll = R.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    sessionNote, hint, tabBody, saveMsgLine, conflictLine,
  ]);
  const body = R.createElement("div", { className: "qm-set-wrap" }, [
    head, tabBar, scroll, foot,
  ]);

  if (!Modal) {
    // Fallback when the host injects no antd.Modal.  It MUST provide its own
    // close affordances — the Modal path gets them from onCancel, and a
    // self-drawn panel with no close button traps the user with no way out.
    return R.createElement("div", {
      className: "qm-set-wrap qm-set-fallback",
      "data-qm-fallback": "1",
      style: {
        position: "fixed", left: "50%", top: "8%", transform: "translateX(-50%)",
        width: "min(680px, 92vw)", maxWidth: "92vw",
        zIndex: 1200, padding: 16, borderRadius: 12,
        background: "var(--app-bg-elevated,#fff)",
        border: "1px solid var(--app-border-subtle,rgba(127,127,127,0.35))",
        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
      },
    }, [
      // Close button, wired to the SAME handler as Modal's onCancel so the
      // unsaved-edit confirmation still applies.
      R.createElement("button", {
        key: "close", type: "button",
        className: "qm-set-fallbackclose", "data-qm-fallback-close": "1",
        title: "关闭", "aria-label": "关闭设置",
        onClick: () => { try { onClose(); } catch (_) {} },
      }, "✕"),
      body,
    ]);
  }
  return R.createElement(Modal, {
    open: true, centered: true, footer: null, title: null, closeIcon: null,
    onCancel: onClose, destroyOnClose: true,
    // 小屏适配（2026-11-13 用户反馈）：固定 680 在窄屏会贴边/溢出。
    // min() 让宽度随视口收缩，92vw 两侧各留 4% 呼吸位。
    width: "min(680px, 92vw)", zIndex: 1200, style: { maxWidth: "92vw" },
    wrapClassName: "qm-set-modal",
  }, body);
}

function registerSettingsEntry(chat: any): void {
  try {
    const sender = chat && chat.sender;
    const R = host().React;
    if (!R) return;
    if (!sender || typeof sender.addPrefix !== "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    // Hand the host a REACT ELEMENT (prompt-forge's proven pattern), so the
    // host's own renderer owns the button. We never touch that node.
    const node = R.createElement(SettingsButton, {
      R,
      onOpen: () => { openSettingsPanel(); },
    });
    sender.addPrefix(PLUGIN_ID, node, {
      id: "question-modal.settings-btn", order: SETTINGS_ORDER,
    });
    console.log("[question-modal] settings entry registered (order " + SETTINGS_ORDER + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}

// ══════════════════════════════════════════════════════════════════
// Register through the native tool-render channel
// ══════════════════════════════════════════════════════════════════
function register(): boolean {
  const chat = chatApi();
  if (!chat || typeof chat.toolRender !== "function") return false;
  try {
    injectStyles();
    chat.toolRender(PLUGIN_ID, TOOL_NAME, AskUserCard);
    console.log("[question-modal] registered via chat.toolRender for", TOOL_NAME);
    registerSettingsEntry(chat);
    return true;
  } catch (e) {
    console.error("[question-modal] toolRender failed:", e);
    return false;
  }
}

(function boot(attempt: number) {
  if (register()) return;
  if (attempt > 40) { console.warn("[question-modal] chat.toolRender never available"); return; }
  setTimeout(() => boot(attempt + 1), 500);
})(0);

console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
