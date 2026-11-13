// probe_three_issues_cases.mjs — 复现用户报的三个运行时问题（不改主 harness）
//
// 复用 harness_rescue.mjs 的假宿主运行时（虚拟时钟 / localStorage / fetch），
// 但单独成一个文件，避免污染既有 352 项基线。
//
// 运行：node probe_three_issues_cases.mjs
//
// 结论一律以「真实渲染树 + 真实 fetch 记录 + 真实 localStorage」判定。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ── 直接把 harness 的运行时部分取出来复用 ──────────────────────────────
// harness 是一个从上跑到下的脚本（含 300+ 用例）。为了复用它的假运行时，
// 这里只抽取「直到日志分组开始之前」的那一段运行时定义，再补上我们自己的
// 用例。这样既不改 harness，也不重复实现 200 行假 React。
const raw = fs.readFileSync(path.join(HERE, "harness_rescue.mjs"), "utf8");
// 去掉 harness 自己的收尾（结果统计 + exit），换成探针自己的收尾
const tail = 'console.log("\\n════════ 结果: " + pass + " passed, " + fail + " failed ════");';
if (raw.indexOf(tail) < 0) { console.error("找不到 harness 收尾"); process.exit(1); }
const runtime = raw.slice(0, raw.indexOf(tail));

const probe = `
// ══════════════════════════════════════════════════════════════════
// 探针用例
// ══════════════════════════════════════════════════════════════════
let pPass = 0, pFail = 0;  // 独立计数，不碰 harness 的 pass/fail
function ck(name, ok, extra) {
  console.log((ok ? "  \\u2713 " : "  \\u2717 ") + name + (extra !== undefined && !ok ? "  [" + String(extra).slice(0, 260) + "]" : ""));
  ok ? pPass++ : pFail++;
}

const QS3 = [
  { type: "single", title: "Q1 选哪个", options: ["甲", "乙"], recommended: "乙" },
  { type: "single", title: "Q2 选哪个", options: ["丙", "丁"], recommended: "丁" },
  { type: "text", title: "Q3 补充" },
];

function mk(callId, questions = QS3) {
  return { content: [{ type: "data", data: { call_id: callId, arguments: JSON.stringify({ title: "三问", questions }) } }] };
}

function rowLabels() {
  const bs = buttons(lastTree).map((b) => b.label);
  return bs;
}
function chosenText() {
  // 选中的行会带 ✓ 前缀
  return buttons(lastTree).filter((b) => b.label.includes("✓")).map((b) => b.label);
}
function progressText() { return treeText(lastTree); }

// ── 统一的桩：effective-config 按 cfgModeNow 应答；analyze 可挂起 ──────
let analyzeResolve = null;
let analyzePending = [];
let sessionPosts = [];
function stubAll({ holdAnalyze = false, mode = "manual" } = {}) {
  cfgModeNow = mode;
  analyzeCalls.length = 0;
  sessionPosts.length = 0;
  fetchScript = (u, opts) => {
    if (u.includes("/question-modal/effective-config")) return cfgStub(mode);
    if (u.includes("/question-modal/analysis")) return { ok: true, data: { ok: true, found: false } };
    if (u.includes("/question-modal/analyze/cancel")) return { ok: true, data: { ok: true, cancelled: true } };
    if (u.includes("/question-modal/analyze")) {
      analyzeCalls.push(JSON.parse((opts && opts.body) || "{}"));
      if (holdAnalyze) {
        // 「分析进行中」：jsonFn 返回一个只有用例能 resolve 的 Promise，
        // 于是卡片的 runAnalysis 停在 await 上（这才是真的挂起）。
        return { ok: true, jsonFn: () => new Promise((res) => {
          analyzePending.push(() => res({ ok: true, analysis: {
            ok: true,
            per_question: [{ index: 0, type: "single", choice: "乙", confidence: 0.9, reasoning: "r", failed: false }],
            elapsed: 1 } }));
        }) };
      }
      return { ok: true, data: { ok: true, analysis: {
        ok: true, per_question: [{ index: 0, type: "single", choice: "乙", confidence: 0.9, reasoning: "r", failed: false }],
        elapsed: 1 } } };
    }
    if (u.includes("/question-modal/templates")) return { ok: true, data: { ok: true, default_id: "builtin-default",
      items: [{ id: "builtin-default", name: "默认六步", builtin: true, system: "s", user: "u" }] } };
    if (u.includes("/question-modal/answer")) return { ok: true, data: { ok: true, request_id: "REQ1" } };
    if (u.includes("/question-modal/resolve")) return { ok: true, data: { ok: true, found: true,
      request_id: "REQ1", session_id: SESSION, title: "三问",
      questions: [ { type: "single", title: "Q1 选哪个", options: ["甲", "乙"], recommended: "乙" },
                   { type: "single", title: "Q2 选哪个", options: ["丙", "丁"], recommended: "丁" },
                   { type: "text", title: "Q3 补充" } ],
      tool_call_id: "call_P1", status: "pending" } };
    if (u.includes("/question-modal/session-prefs")) {
      sessionPosts.push(JSON.parse((opts && opts.body) || "{}"));
      return { ok: true, data: { ok: true, stored: true } };
    }
    if (u.includes("/question-modal/prefs")) return { ok: true, data: { ok: true, prefs: {} } };
    if (u.includes("/api/models/active")) return { ok: true, data: { active_llm: { provider_id: "o", model: "m" } } };
    if (u.includes("/api/models")) return { ok: true, data: PROVIDERS };
    return { ok: true, data: { ok: true, found: false } };
  };
}



async function settle(n = 8) { for (let i = 0; i < n; i++) { await flush(); await realTick(); await flush(); } }

// ══════════════════════════════════════════════════════════════════
console.log("\\n[P1] 分析进行中切换模式 → 不得自动采纳推荐 / 不得自动推进");
// ══════════════════════════════════════════════════════════════════
store.clear();
sessionPosts = [];
reset();                       // 清 harness 的 fetchLog，避免看到上一组的调用
stubAll({ holdAnalyze: true, mode: "ai" });
const mounted = mount(mk("call_P1"));
console.log("    mount 返回非空:", !!mounted, "| 文本:", JSON.stringify(treeText(mounted).slice(0, 120)));
await settle();
console.log("    settle 后文本:", JSON.stringify(treeText(lastTree).slice(0, 160)));
const st = JSON.parse(store.get("qm:v1:state:call_P1") || "{}");
console.log("    卡片持久化状态:", JSON.stringify({answered: st.answered, visStep: st.visStep, mode: st.mode, autoPaused: st.autoPaused}));
const effSeen = fetchLog.filter(f => String(f.url).includes("effective-config"));
console.log("    effective-config 请求次数:", effSeen.length);
console.log("    初始按钮:", rowLabels().slice(0, 8).join(" , "));
console.log("    fetch 调用:", fetchLog.map(f => String(f.url).replace("http://127.0.0.1:8088/api","")).slice(0,10).join(" | "));
console.log("    analyze 调用数:", analyzeCalls.length, "(AI 模式应已发起一次)");
ck("[P1a] AI 模式确实发起了分析", analyzeCalls.length >= 1, analyzeCalls.length);

// 分析仍挂起 → 切到「人工」
clickButton("人工");
await settle();
const afterSwitch = progressText();
const chosenAfterSwitch = chosenText();
console.log("    切人工后 选中行:", JSON.stringify(chosenAfterSwitch));
console.log("    切人工后 是否已到末页(其他意见):", afterSwitch.includes("其他意见"));

// 现在让挂起的分析返回 —— 人工模式下这一份结果不得被自动采纳
analyzePending.forEach((fn) => fn()); analyzePending = [];
await settle();
const afterLand = progressText();
const chosenAfterLand = chosenText();
console.log("    分析落定后 选中行:", JSON.stringify(chosenAfterLand));
ck("[P1b] 切到人工后仍有未作答状态（未自动采纳推荐）", chosenAfterLand.length === 0, chosenAfterLand.join("|"));
ck("[P1c] 切到人工后未自动推进到末页", !afterLand.includes("其他意见"), afterLand.slice(-120));
console.log("    session-prefs 上报:", JSON.stringify(sessionPosts.map(p => p.settings)));

// ══════════════════════════════════════════════════════════════════
console.log("\\n[P2] 两个标签页（两个卡片实例共享 localStorage）→ 模式不得来回翻");
// ══════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════
console.log(""); console.log("[P1b] AI 分析进行中 → 切「只用推荐」→ 是否立刻自动填推荐并推进");
// ══════════════════════════════════════════════════════════════════
store.clear(); sessionPosts = []; analyzePending = []; reset();
stubAll({ holdAnalyze: true, mode: "ai" });
mount(mk("call_P1b"));
await settle();
console.log("    AI 分析中 analyze 调用:", analyzeCalls.length, "| 已选:", JSON.stringify(chosenText()));
clickButton("只用推荐");
await settle();
const p1bChosen = chosenText();
const p1bSt = JSON.parse(store.get("qm:v1:state:call_P1b") || "{}");
console.log("    切「只用推荐」后 已选:", JSON.stringify(p1bChosen));
console.log("    切「只用推荐」后 answered:", p1bSt.answered, "visStep:", p1bSt.visStep);
console.log("    answer 请求数:", fetchLog.filter(f => String(f.url).includes("/answer")).length);
ck("[P1b-1] 分析进行中切「只用推荐」→ 立刻自动填充推荐", p1bChosen.length > 0, p1bChosen.join(" | "));

store.clear(); sessionPosts = []; analyzeCalls.length = 0;
stubAll({ mode: "recommend" });

// 标签页 A：以 recommend 起跑
mount(mk("call_A"));
await settle();
console.log("    标签A 模式按钮高亮:", (() => {
  const t = progressText();
  return ["auto分析", "auto", "recommend", "manual"].map(k => k + "=" + t.includes(k)).join(" ");
})());
console.log("    标签A session-posts:", sessionPosts.length);

// 标签页 B：同一个 chat，同一份 localStorage，另一张卡（不同 call_id）
const storeAfterA = JSON.stringify([...store.keys()]);
mount(mk("call_B"));
await settle();
console.log("    标签B session-posts 累计:", sessionPosts.length,
            "新增:", JSON.stringify(sessionPosts.slice(-2).map(p => p.settings)));
console.log("    标签B 是否用完了A写的镜像:", storeAfterA.length > 2 ? "store 非空" : "store 空");

// 来回挂载 3 轮，观察是否有 mode 被反复写
const before = sessionPosts.length;
let flips = 0;
let lastModes = [];
for (let i = 0; i < 3; i++) {
  mount(mk("call_A"));
  await settle(3);
  lastModes.push(sessionPosts.slice(-1).map(p => (p.settings || {}).mode).join("") || "-");
}
console.log("    3 轮重挂载后 末尾 mode 上报:", JSON.stringify(lastModes));
console.log("    新增 session-posts:", sessionPosts.length - before);
ck("[P2a] 纯重挂载不得反复写 mode（每轮最多 1 次，且值一致）",
   new Set(lastModes).size <= 1, lastModes.join("|"));

// ══════════════════════════════════════════════════════════════════
console.log(""); console.log("[P2b] 两个标签页渲染同一张卡（同 call_id）→ 是否互相覆盖答案/进度");
// ══════════════════════════════════════════════════════════════════
store.clear(); sessionPosts = []; analyzePending = []; reset();
stubAll({ mode: "manual" });

mount(mk("call_SAME"));
await settle(4);
clickButton("甲");
await settle(3);
const aState = JSON.parse(store.get("qm:v1:state:call_SAME") || "{}");
console.log("    A 选「甲」后 answers:", JSON.stringify(aState.answers));
console.log("    A 视觉已选:", JSON.stringify(chosenText()));

mount(mk("call_SAME"));      // 同一 call_id，另一张卡实例（= 另一个标签页）
await settle(4);
console.log("    B 挂载后已选(继承):", JSON.stringify(chosenText()));

clickButton("乙");
await settle(3);
const afterB = JSON.parse(store.get("qm:v1:state:call_SAME") || "{}");
console.log("    B 改选「乙」后 answers:", JSON.stringify(afterB.answers));
ck("[P2b-1] B 的改动覆盖了 A 的选择（同 call_id 共享同一份状态）",
   JSON.stringify(afterB.answers) !== JSON.stringify(aState.answers),
   "A=" + JSON.stringify(aState.answers) + " B=" + JSON.stringify(afterB.answers));

mount(mk("call_SAME"));      // A 回到前台
await settle(4);
const backA = JSON.parse(store.get("qm:v1:state:call_SAME") || "{}");
console.log("    A 回前台后 answers:", JSON.stringify(backA.answers));
ck("[P2b-2] A 回前台看到的是 B 的值（无标签页隔离）",
   JSON.stringify(backA.answers) === JSON.stringify(afterB.answers),
   "backA=" + JSON.stringify(backA.answers));


// ══════════════════════════════════════════════════════════════════
console.log(""); console.log("[P1c] 人工模式点「查看分析」→ 分析落定 → 再切模式 → 是否自动采纳");
// ══════════════════════════════════════════════════════════════════
store.clear(); sessionPosts = []; analyzePending = []; reset();
stubAll({ holdAnalyze: false, mode: "manual" });
mount(mk("call_P1c"));
await settle(4);
console.log("    人工模式初始 已选:", JSON.stringify(chosenText()));
// 人工模式点「查看分析」（气泡里的开始分析，等价于 runAnalysis manual）
clickButton("查看分析");
await settle(2);
const runBtn = buttons(lastTree).map(b => b.label);
console.log("    气泡按钮:", JSON.stringify(runBtn.filter(x => x.includes("分析"))));
if (runBtn.some(x => x.includes("开始分析"))) {
  const b = buttons(lastTree).find(x => x.label.includes("开始分析"));
  b.props.onClick();
  await settle(6);
}
console.log("    分析落定后 已选:", JSON.stringify(chosenText()));
const p1cSt1 = JSON.parse(store.get("qm:v1:state:call_P1c") || "{}");
console.log("    分析落定后 answered:", p1cSt1.answered, "visStep:", p1cSt1.visStep);
ck("[P1c-1] 人工模式下分析落定【不】自动采纳推荐",
   chosenText().length === 0 && !p1cSt1.answered,
   "已选=" + JSON.stringify(chosenText()) + " answered=" + p1cSt1.answered);

// 再切到「自动分析」
clickButton("自动分析");
await settle(8);
const p1cSt2 = JSON.parse(store.get("qm:v1:state:call_P1c") || "{}");
console.log("    切「自动分析」后 已选:", JSON.stringify(chosenText()));
console.log("    切「自动分析」后 answered:", p1cSt2.answered, "visStep:", p1cSt2.visStep);
const ansPost = fetchLog.filter(f => String(f.url).includes("/answer")).pop();
console.log("    提交体 answers:", ansPost ? String(ansPost.body).slice(0, 400) : "(无)");
console.log("    持久化 answers:", JSON.stringify(p1cSt2.answers));
console.log("    answer 请求:", fetchLog.filter(f => String(f.url).includes("/answer")).length);
ck("[P1c-2] 切到自动分析后会采纳缓存推荐（AI 模式应有此行为）",
   chosenText().length > 0 || p1cSt2.answered, JSON.stringify(chosenText()));


// ══════════════════════════════════════════════════════════════════
console.log("\\n[P3] 后台标签页（无 DOM / document 不可用）→ 仍须自行推进并提交");
// ══════════════════════════════════════════════════════════════════
store.clear(); sessionPosts = []; analyzeCalls.length = 0;
stubAll({ mode: "recommend" });
const realDoc = global.document;
try {
  // 模拟「标签页在后台 / 未渲染会话」：有卡片逻辑但 DOM 查询拿不到节点
  global.document = { querySelector: () => null, querySelectorAll: () => [] };
  mount(mk("call_BG"));
  await settle();
  const bgText = progressText();
  const answersPosts = fetchLog.filter(f => f.url.includes("/question-modal/answer")).length;
  console.log("    后台态 是否到末页:", bgText.includes("其他意见"));
  console.log("    后台态 answer 请求数:", answersPosts);
  ck("[P3a] 后台态仍能自动推进（走到末页）", bgText.includes("其他意见"), bgText.slice(-160));
  ck("[P3b] 后台态仍能自动提交", answersPosts >= 1, answersPosts);
} finally {
  global.document = realDoc;
}

console.log("\\n" + "═".repeat(20) + " 探针结果: " + pPass + " passed, " + pFail + " failed " + "═".repeat(20));
process.exit(pFail ? 1 : 0);
`;

const full = runtime + "\n" + probe;
const tmp = path.join(HERE, "__probe_three.mjs");
fs.writeFileSync(tmp, full, "utf8");
console.log("wrote", tmp, full.length, "bytes");
