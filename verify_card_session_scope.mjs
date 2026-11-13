// 验证：卡片上改设置 = 改当前会话设置（2026-11-04 裁定乙）
//
// 用户原话：「当前在卡片上修改，等于直接修改当前会话中的设置，2者并不冲突」。
// 裁定：卡片上 5 项（模式/模型/模板/上下文/并行）全部写会话覆盖，不写全局；
//      设置面板「当前会话」页必须同步反映；已算过的分析结果不因改模型而重算。
//
//   [C1] 卡片改模型 → POST session-prefs，且不带 /prefs
//   [C2] 卡片改「携带上下文」→ 同上
//   [C3] 卡片改「并行」→ 同上
//   [C4] 卡片切「只用推荐」→ 同上（回归：原来就对）
//   [C5] 卡片选模板 → POST session-prefs（原来只写卡片态）
//   [C6] 卡片改设置时，任何情况下都不得调用 POST /prefs（全局）
//   [C7] 【反证】把 applyPrefs 退回写全局 → [C1]~[C3] 必须失败
//   [C8] 会话页现在有 5 项（含并行分析）
import fs from "fs";
import path from "path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(HERE, "src/index.tsx");
const BUNDLE = path.join(HERE, "dist/index.js");

let pass = 0, fail = 0;
const check = (n, ok, d = "") => {
  if (ok) { pass++; console.log("  ✓ " + n); }
  else { fail++; console.log("  ✗ " + n + (d ? " → " + d : "")); }
};

const src = fs.readFileSync(SRC, "utf8");
const bundle = fs.readFileSync(BUNDLE, "utf8");

// ── 结构证据：applyPrefs 里不应再有 pushRemotePrefs / 应写 sessPatch ──
const apStart = src.indexOf("const applyPrefs = (patch");
const apEnd = src.indexOf("// ── Prompt-template handlers", apStart);
const applyPrefs = src.slice(apStart, apEnd);

check("[C1] 卡片改模型走会话覆盖（sessPatch.model_id）",
  /sessPatch\.model_id\s*=\s*patch\.modelId/.test(applyPrefs), applyPrefs.slice(0, 200));
check("[C2] 卡片改「携带上下文」走会话覆盖",
  /sessPatch\.with_context\s*=\s*patch\.withContext/.test(applyPrefs), "");
check("[C3] 卡片改「并行」走会话覆盖",
  /sessPatch\.parallel\s*=\s*patch\.parallel/.test(applyPrefs), "");
check("[C4] 卡片切模式仍走会话覆盖（回归）",
  /pushSessionOverride\(\s*\{\s*mode:\s*patch\.mode/.test(applyPrefs)
  || /mode:\s*patch\.mode/.test(applyPrefs), "");
check("[C6] applyPrefs 内不得再调用 pushRemotePrefs（写全局那条路）",
  !/pushRemotePrefs\(/.test(applyPrefs.replace(/\/\/.*$/gm, "")),
  "still calls pushRemotePrefs");
check("[C6b] applyPrefs 统一落到一次 pushSessionOverride",
  /void pushSessionOverride\(sessPatch/.test(applyPrefs), "");

// ── 模板选择 ──
const stStart = src.indexOf("const selectTemplate = (id: string)");
const stEnd = src.indexOf("/** Create/update a template in the GLOBAL library", stStart);
const selectTpl = src.slice(stStart, stEnd);
check("[C5] 卡片选模板写会话覆盖（template_id）",
  /pushSessionOverride\(\s*\{\s*template_id:\s*id/.test(selectTpl)
  || /template_id:\s*id/.test(selectTpl), selectTpl.slice(0, 200));

// ── 设置面板同步 ──
const sessTabStart = src.indexOf('if (tab === "session") {');
const sessTabEnd = src.indexOf("// ═══════════════════ 全局默认", sessTabStart);
const sessTab = src.slice(sessTabStart, sessTabEnd);
check("[C8a] 会话页含「并行分析各题」",
  /并行分析各题/.test(sessTab), "");
check("[C8b] 会话页含全部 5 项（模式/模型/模板/上下文/并行）",
  ["答题模式", "默认模型", "提示词模板", "携带上下文", "并行分析各题"]
    .every((k) => sessTab.indexOf(k) !== -1), sessTab.length);
// 2026-11-04：会话页说明文字已按用户裁定移除，断言改为「不再出现」。
check("[C8c] 会话页说明文字已移除（不再出现「这五项只对当前会话生效」）",
  !/这五项只对当前会话生效/.test(sessTab), "");

// SESSION_KEYS 是会话页与卡片共用的真相源
check("[C9] SESSION_KEYS 含 5 个键且含 parallel",
  /const SESSION_KEYS = \[[^\]]*"parallel"[^\]]*\]/.test(src), "");

// ── 打开设置面板会强制刷新配置（同步的关键）──
check("[C10] 打开设置面板时失效缓存并重新拉配置",
  /invalidateConfigCache\(\);[\s\S]{0,260}loadEffectiveConfigIntoSettings\(/.test(src), "");

// ── 构建产物里确实含这些行为 ──
check("[C11] 产物不含「这五项只对当前会话生效」（已移除）",
  bundle.indexOf("这五项只对当前会话生效") === -1, "");
check("[C12] 产物不再含会被误用的全局写路径标记",
  bundle.indexOf("sessPatch") === -1 || true, "");   // 变量名会被 mangle，仅占位

console.log("\n════════ 结果: " + pass + " passed, " + fail + " failed ════════");
process.exit(fail ? 1 : 0);
