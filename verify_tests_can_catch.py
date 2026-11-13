"""反证：确认 6 套修好的用例「真的能捕获缺陷」，不是改成永远为真的假绿。

做法：对每套用例，临时把被测对象改回「错误/旧」状态（备份→改→跑→还原），
确认对应断言从「通过」翻转为「失败」。全部命中 = 用例有效。

反证清单：
  [R1] verify_final_names.py     N1b  —— 把「诊断」页签加回 SETTINGS_TABS
  [R2] verify_tabs_regroup.py    T7   —— 同上
  [R3] verify_browser_notify_cache.py E3 —— 同上（诊断页签被加回后必失败）
  [R4] verify_settings_save_real.py V1 —— 页签改回「当前会话」
  [R5] verify_isolation.py       I1   —— 「默认模式」页签改名，前置断言必失败
  [R6] probe_symptoms.mjs        P2b  —— 断言退回硬匹配「✓ 乙」

注意：只改测试代码，产品代码（src/dist/plugin.py）一律不动；
反证临时改动的文件全部从备份还原并校验 md5。
"""
import hashlib, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TSX = os.path.join(HERE, "src/index.tsx")
BAK = "/tmp/revert_probe"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def md5(p):
    with open(p, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def run(cmd, timeout=300):
    try:
        r = subprocess.run(cmd, shell=True, cwd=HERE, capture_output=True, text=True, timeout=timeout)
        return r.stdout + r.stderr
    except subprocess.TimeoutExpired:
        return "[TIMEOUT]"

def main():
    os.makedirs(BAK, exist_ok=True)

    # ══════ 产品代码前置快照（反证绝不动产品代码）══════
    prod = {
        "src/index.tsx": md5(TSX),
        "dist/index.js": md5(os.path.join(HERE, "dist/index.js")),
        "plugin.py": md5(os.path.join(HERE, "plugin.py")),
    }
    print("产品代码基线:", prod)

    installed_tsx = "/app/working/plugins/question-modal/dist/index.js"
    installed_md5 = md5(installed_tsx)

    # ══════════════════════════════════════════════════════════════
    # [R1]-[R3] 把「诊断」页签加回 src/index.tsx → 三套都应失败
    # ══════════════════════════════════════════════════════════════
    shutil.copy2(TSX, os.path.join(BAK, "index.tsx"))
    try:
        s = open(TSX, encoding="utf-8").read()
        old = '''  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
];'''
        new = '''  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
  { key: "diag", label: "诊断", hint: "只读信息" },
];'''
        assert old in s, "SETTINGS_TABS 锚点未找到"
        open(TSX, "w", encoding="utf-8").write(s.replace(old, new, 1))
        print("\n[反证已注入] SETTINGS_TABS 加回「诊断」页签")

        # 需要重建 dist 才能让真机脚本看到变化
        b = run("npm run build 2>&1 | tail -6", timeout=600)
        print("  构建:", b.strip().splitlines()[-1] if b.strip() else "(no output)")
        if os.path.exists(os.path.join(HERE, "dist/index.js")):
            shutil.copy2(os.path.join(HERE, "dist/index.js"), installed_tsx)
            print("  已部署反证 bundle 到已安装目录")

        print("\n  ▶ [R1] verify_final_names.py（期望 N1b/N6b/N7b 失败）")
        out = run("python3 verify_final_names.py", 300)
        ck("[R1] 反证命中：诊断页签加回后 N1b 失败", "✗ [N1b]" in out,
           [l for l in out.splitlines() if "✗" in l][:3])

        print("\n  ▶ [R2] verify_tabs_regroup.py（期望 T1/T7 失败）")
        out2 = run("python3 verify_tabs_regroup.py", 300)
        ck("[R2] 反证命中：T1 或 T7 失败", ("✗ [T1]" in out2) or ("✗ [T7]" in out2),
           [l for l in out2.splitlines() if "✗" in l][:3])

        print("\n  ▶ [R3] verify_browser_notify_cache.py（期望 E3 失败）")
        out3 = run("python3 verify_browser_notify_cache.py", 300)
        ck("[R3] 反证命中：诊断页签加回后 E3 失败", "✗ [E3]" in out3,
           [l for l in out3.splitlines() if "✗" in l][:3])
    finally:
        shutil.copy2(os.path.join(BAK, "index.tsx"), TSX)
        print("\n[反证已还原] src/index.tsx")

    # 还原 dist：重新构建一次（src 已是原版）
    run("npm run build 2>&1 | tail -4", 600)
    shutil.copy2(os.path.join(HERE, "dist/index.js"), installed_tsx)
    ck("[R0] 产品代码已完全还原（src/dist 与基线一致）",
       md5(TSX) == prod["src/index.tsx"] and md5(os.path.join(HERE, "dist/index.js")) == prod["dist/index.js"],
       (md5(TSX), md5(os.path.join(HERE, "dist/index.js")), prod))

    # ══════════════════════════════════════════════════════════════
    # [R4] 测试代码内注入错误页签名 → V1 必须失败
    # ══════════════════════════════════════════════════════════════
    print("\n[R4] verify_settings_save_real.py：断言页签名改回「当前会话」")
    f4 = os.path.join(HERE, "verify_settings_save_real.py")
    shutil.copy2(f4, os.path.join(BAK, "save_real.py"))
    try:
        s = open(f4, encoding="utf-8").read()
        s2 = s.replace('hasSession: tabs.includes(\'会话模式\')', 'hasSession: tabs.includes(\'当前会话\')')
        open(f4, "w", encoding="utf-8").write(s2)
        out4 = run("python3 verify_settings_save_real.py", 300)
        ck("[R4] 反证命中：断言旧页签名 → V1 失败", "✗ [V1]" in out4,
           [l for l in out4.splitlines() if "✗" in l][:2])
    finally:
        shutil.copy2(os.path.join(BAK, "save_real.py"), f4)

    # ══════ 还原后复跑，确认恢复全绿 ══════
    out4b = run("python3 verify_settings_save_real.py", 300)
    ck("[R4b] 还原后 V1 重新通过", "✗ [V1]" not in out4b, "")

    # ══════════════════════════════════════════════════════════════
    # [R5] verify_isolation.py：前置断言改为找不存在的页签名 → 必失败
    # ══════════════════════════════════════════════════════════════
    print("\n[R5] verify_isolation.py：把「默认模式」改成不存在的页签名")
    f5 = os.path.join(HERE, "verify_isolation.py")
    shutil.copy2(f5, os.path.join(BAK, "isolation.py"))
    try:
        s = open(f5, encoding="utf-8").read()
        s2 = s.replace("e.textContent.trim()==='默认模式'", "e.textContent.trim()==='不存在页签'")
        open(f5, "w", encoding="utf-8").write(s2)
        out5 = run("python3 verify_isolation.py", 300)
        ck("[R5] 反证命中：页签找不到 → I1-前置失败", "✗ [I1-前置]" in out5,
           [l for l in out5.splitlines() if "✗" in l][:2])
    finally:
        shutil.copy2(os.path.join(BAK, "isolation.py"), f5)

    out5b = run("python3 verify_isolation.py", 300)
    ck("[R5b] 还原后 I1-前置 重新通过", "✗ [I1-前置]" not in out5b, "")

    # ══════════════════════════════════════════════════════════════
    # [R6] probe_symptoms.mjs：断言退回硬匹配「✓ 乙」→ P2b 必失败
    # ══════════════════════════════════════════════════════════════
    print("\n[R6] probe_symptoms.mjs：选择保留断言退回硬匹配「✓ 乙」")
    f6 = os.path.join(HERE, "probe_symptoms.mjs")
    shutil.copy2(f6, os.path.join(BAK, "symptoms.mjs"))
    try:
        s = open(f6, encoding="utf-8").read()
        s2 = s.replace('const kept = isSelected("乙");', 'const kept = hasText(lastTree, "✓ 乙");')
        open(f6, "w", encoding="utf-8").write(s2)
        out6 = run("node probe_symptoms.mjs", 300)
        ck("[R6] 反证命中：硬匹配旧文案 → P2b 失败", "✗ [P2b]" in out6,
           [l for l in out6.splitlines() if "✗" in l][:2])
    finally:
        shutil.copy2(os.path.join(BAK, "symptoms.mjs"), f6)

    out6b = run("node probe_symptoms.mjs", 300)
    ck("[R6b] 还原后 P2b 重新通过", "✗ [P2b]" not in out6b, "")

    # ══════ 终态校验：产品代码与已安装目录均未变 ══════
    print("\n[终态] 产品代码一致性")
    ck("[R7] src/index.tsx 与基线一致", md5(TSX) == prod["src/index.tsx"],
       (md5(TSX), prod["src/index.tsx"]))
    ck("[R8] dist/index.js 与基线一致", md5(os.path.join(HERE, "dist/index.js")) == prod["dist/index.js"],
       (md5(os.path.join(HERE, "dist/index.js")), prod["dist/index.js"]))
    ck("[R9] plugin.py 未被触碰", md5(os.path.join(HERE, "plugin.py")) == prod["plugin.py"], "")
    ck("[R10] 已安装目录 dist 与基线一致", md5(installed_tsx) == installed_md5,
       (md5(installed_tsx), installed_md5))

    print("\n==== 反证结果: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
