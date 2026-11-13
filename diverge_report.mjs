// 逐项对照：卡片实际显示值 vs 设置页实际显示值
//
// 用户报告：「问卷卡片中的配置，实际与问卷设置中的会话设置，或全局设置不一致」。
// 本测试用一个真实后端状态（model_id 为空 + 会话覆盖只有 mode）驱动卡片，
// 把卡片 5 个控件的显示值与 /effective-config（设置页的唯一数据源）逐项比对。
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = fs.readFileSync(path.join(HERE, "src/index.tsx"), "utf8");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? "  → " + d : "")); }
};

// 取「卡片状态初值」的每一行，看看各自从哪来
const pick = (re) => { const m = SRC.match(re); return m ? m[0] : ""; };

console.log("── ① 卡片 5 个控件的初值来源 ──");
const modelInit = pick(/const \[anModel, setAnModel\] = R\.useState<string>\([^)]*\)/);
const ctxInit   = pick(/const \[anCtx, setAnCtx\] = R\.useState<boolean>\([^)]*\)/);
const parInit   = pick(/const \[anParallel, setAnParallel\] = R\.useState<boolean>\([^)]*\)/);
const modeInit  = pick(/const \[anMode, setAnMode\] = R\.useState<AnMode>\([^)]*\)/);
const tplInit   = SRC.slice(SRC.indexOf("const [tplId, setTplId]"), SRC.indexOf("const [tplId, setTplId]") + 200);
console.log("   anModel   :", modelInit);
console.log("   anCtx     :", ctxInit);
console.log("   anParallel:", parInit);
console.log("   anMode    :", modeInit);
console.log("   tplId     :", tplInit.split("\n").slice(0, 4).join(" ").trim());

check("[D1] anModel 初值不来自 effective-config（来自 localStorage 镜像）",
  /prefs0\.modelId/.test(modelInit), modelInit);
check("[D2] tplId 初值不来自 effective-config（来自卡片态 saved.templateId）",
  /saved\.templateId/.test(tplInit), "from saved card state");

console.log("\n── ② 卡片是否存在「effective-config 之外」的兜底路径 ──");
const hydrateStart = SRC.indexOf("if (effRes && effRes.config) {");
const hydrateEnd = SRC.indexOf("}, [callId]);", hydrateStart);
const hydrate = SRC.slice(hydrateStart, hydrateEnd);

check("[D3] 卡片有『回落当前对话模型』兜底（设置页没有这条）",
  /fetchActiveModel\(\)/.test(hydrate) && /setAnModel\(`\$\{active\.provider_id\}/.test(hydrate),
  "fetchActiveModel in hydrate");
check("[D4] 卡片有『回落全局 prefs』兜底（设置页会话页读合并值，不读全局）",
  /let effective: AnalysisPrefs = prefs0;/.test(hydrate) && /setAnModel\(remote\.modelId\)/.test(hydrate),
  "remote(global) fallback");
check("[D5] 卡片写 localStorage 镜像（设置页从不读 localStorage）",
  /saveAnalysisPrefs\(/.test(hydrate), "saveAnalysisPrefs");

console.log("\n── ③ 空值语义差异（最可能的现场）──");
check("[D6] model_id 为空时：卡片会显示『当前对话模型』，设置页显示『空/未配置』",
  /fetchActiveModel/.test(SRC) && /if \(!prefsTouched\.current && !effective\.modelId\)/.test(SRC),
  "empty model_id → active conversation model on card only");
check("[D7] model_id 非空时：卡片与设置页一致（都取合并值）",
  /if \(typeof c\.model_id === "string" && c\.model_id\) setAnModel\(c\.model_id\)/.test(SRC),
  "");

console.log("\n── ④ template_id 空值语义差异 ──");
check("[D8] template_id 为空时：卡片回落库默认首项，设置页回落 tplChoices[0]",
  /tplRes\.defaultId \|\| ids\[0\]/.test(SRC) && /tplChoices\[0\] && tplChoices\[0\]\.value/.test(SRC),
  "both fall back, but to potentially different lists");

console.log("\n════════ 结果: " + pass + " 条现象确认, " + fail + " 条未复现 ════════");
console.log("（本脚本只做「代码事实取证」，不是通过/失败判定）");
process.exit(0);
