"""反证：确认新增的 [BF]/[BG]/[BH] 用例真的能捕获缺陷（不是假绿）。

做法：把每处修复临时改回「旧写法」→ 重构建 → 跑 harness → 对应断言必须翻红 →
还原 → 重新构建 → 恢复全绿。产品源码只在反证期间改动，结束后 md5 必须回到基线。
"""
import hashlib, os, re, shutil, subprocess, sys

HERE = "/app/working/build/question-modal-dev"
TSX = os.path.join(HERE, "src/index.tsx")
BAK = "/tmp/revert_probe_3fix"
ok = fail = 0

def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()

def build():
    r = subprocess.run("npx vite build --config vite.build.config.mjs",
                       shell=True, cwd=HERE, capture_output=True, text=True, timeout=600)
    return r.returncode == 0, (r.stdout + r.stderr)[-300:]

def harness():
    r = subprocess.run("node harness_rescue.mjs", shell=True, cwd=HERE,
                       capture_output=True, text=True, timeout=900)
    out = r.stdout + r.stderr
    m = re.search(r"结果: (\d+) passed, (\d+) failed", out)
    return out, (int(m.group(1)), int(m.group(2))) if m else (0, -1)

def main():
    os.makedirs(BAK, exist_ok=True)
    base = md5(TSX)
    dist_base = md5(os.path.join(HERE, "dist/index.js"))
    print("源码基线:", base, "| dist 基线:", dist_base)

    out0, (p0, f0) = harness()
    print("基线 harness: %d passed, %d failed" % (p0, f0))
    ck("[R0] 基线全绿", f0 == 0, (p0, f0))

    # ══════ [R1] 把 FIX-1A 改回 per_question[0] → [BF1]/[BF2] 必须失败 ══════
    print("\n[R1] FIX-1A 回退：per_question[0] 串题")
    shutil.copy2(TSX, os.path.join(BAK, "index.tsx"))
    try:
        s = open(TSX, encoding="utf-8").read()
        old = "    const cachedChoice = choiceForQuestion(qResultsRef.current[qi], realIdx);"
        new = ("    const cachedChoice = (() => { const r: any = qResultsRef.current[qi];\n"
               "      const p = r && r.per_question && r.per_question[0];\n"
               "      return p ? String(p.choice || '').trim() : ''; })();")
        assert old in s, "FIX-1A 锚点未找到"
        open(TSX, "w", encoding="utf-8").write(s.replace(old, new, 1))
        built, msg = build()
        ck("[R1-0] 反证版构建成功", built, msg)
        out, (p, f) = harness()
        ck("[R1] 反证命中：[BF] 串题用例失败", "[BF1]" in out and "✗ [BF1]" in out or
           ("✗ [BF2]" in out), [l for l in out.splitlines() if "✗" in l][:3])
    finally:
        shutil.copy2(os.path.join(BAK, "index.tsx"), TSX)

    # ══════ [R2] 去掉无推荐提示 → [BG1] 必须失败 ══════
    print("\n[R2] FIX-1B 回退：去掉「没有可用的推荐」提示行")
    try:
        s = open(TSX, encoding="utf-8").read()
        s2 = s.replace('}, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）")',
                       '}, "")')
        assert s2 != s, "FIX-1B 锚点未找到"
        open(TSX, "w", encoding="utf-8").write(s2)
        built, msg = build()
        ck("[R2-0] 反证版构建成功", built, msg)
        out, (p, f) = harness()
        ck("[R2] 反证命中：去掉提示后 [BG1] 失败", "✗ [BG1]" in out,
           [l for l in out.splitlines() if "✗" in l][:3])
    finally:
        shutil.copy2(os.path.join(BAK, "index.tsx"), TSX)

    # ══════ [R3] 去掉 remoteSyncRef 防乒乓 → [BH6] 必须失败 ══════
    print("\n[R3] FIX-2 回退：去掉防乒乓跳过")
    try:
        s = open(TSX, encoding="utf-8").read()
        s2 = s.replace("    if (remoteSyncRef.current) { remoteSyncRef.current = false; return; }\n", "")
        assert s2 != s, "FIX-2 锚点未找到"
        open(TSX, "w", encoding="utf-8").write(s2)
        built, msg = build()
        ck("[R3-0] 反证版构建成功", built, msg)
        out, (p, f) = harness()
        ck("[R3] 反证命中：去掉防乒乓后 [BH6] 失败", "✗ [BH6]" in out,
           [l for l in out.splitlines() if "✗" in l][:3])
    finally:
        shutil.copy2(os.path.join(BAK, "index.tsx"), TSX)

    # ══════ [R4] 去掉 isDriver 门 → 驱动不再独占（[BH2]/[BH3] 相关） ══════
    print("\n[R4] FIX-2 回退：驱动不看 isDriver")
    try:
        s = open(TSX, encoding="utf-8").read()
        s2 = s.replace("    // 静默，否则两边同时 setAnswers + submit，用户看到的就是模式来回切。\n    if (!isDriver) return;\n", "")
        assert s2 != s, "isDriver 锚点未找到"
        open(TSX, "w", encoding="utf-8").write(s2)
        built, msg = build()
        ck("[R4-0] 反证版构建成功", built, msg)
        out, (p, f) = harness()
        # 去掉门后，抢不到租约的页面会照样推进 → [BH3] 只读视图断言仍成立（渲染层），
        # 但驱动行为会变：另一个标签页也会把答案填上。
        ck("[R4] 反证命中：去掉门后 [BH] 组至少一项失败", "✗ [BH" in out,
           [l for l in out.splitlines() if "✗" in l][:3])
    finally:
        shutil.copy2(os.path.join(BAK, "index.tsx"), TSX)

    # ══════ 还原与终态校验 ══════
    built, msg = build()
    ck("[R5] 还原后构建成功", built, msg)
    out, (p, f) = harness()
    ck("[R6] 还原后 harness 回到全绿", f == 0, (p, f))
    ck("[R7] src/index.tsx 与基线一致", md5(TSX) == base, (md5(TSX), base))

    print("\n==== 反证结果: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
