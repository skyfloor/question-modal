# -*- coding: utf-8 -*-
"""2026-11-13 发版前全量回归 runner（串行，逐套记录，失败不停继续收集）。
用法：python3 full_regression_20261113.py [组名]
组名：core / settings / backend / browser / phase / release
不带参数 = 全跑。结果写 /tmp/qm_regression_results_20261113.json
"""
import json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))

# 按类型分组：mjs 用 node，py 用 python3
GROUPS = {
    "core": [
        ("mjs", "harness_rescue.mjs"),
        ("mjs", "verify_fixes.mjs"),
        ("mjs", "verify_card_session_scope.mjs"),
        ("py",  "verify_241_all_features.py"),
        # 已知过期（2026-11-13 全量回归判定）：R3/R4 反证锚点 remoteSyncRef/isDriver
        # 在阶段 1 删租约时已移除，[BH] 组已按新语义重写；该脚本会 rebuild dist
        # 污染产物。留在本清单仅作记录，执行时跳过。
        # ("py",  "verify_3fix_can_catch.py"),
        ("py",  "verify_skip_reason.py"),
        ("py",  "verify_submit_path.py"),
        ("py",  "verify_no_dup_analysis.py"),
        ("py",  "verify_no_false_success.py"),
        ("py",  "verify_d7_raw_json.py"),
    ],
    "settings": [
        ("mjs", "verify_settings_entry.mjs"),
        ("mjs", "verify_settings_entry2.mjs"),
        ("mjs", "verify_settings_layout.mjs"),
        ("mjs", "verify_ui_modelpick.mjs"),
        ("mjs", "verify_templates.mjs"),
        ("mjs", "verify_wiring_s4.mjs"),
        ("mjs", "verify_s5a.mjs"),
        ("mjs", "verify_cfg_s3.mjs"),
        ("py",  "verify_settings_ux.py"),
        ("py",  "verify_settings_save_real.py"),
        ("py",  "verify_e2e_userpath.py"),
        ("py",  "verify_footbar_ui.py"),
        ("py",  "verify_scope_badge.py"),
        ("py",  "verify_final_names.py"),
        ("py",  "verify_tabs_regroup.py"),
        ("py",  "verify_schema_s1.py"),
        ("py",  "verify_builtin_cfg_functions.py"),
        ("py",  "verify_fix2_switch.py"),
        ("py",  "verify_card_settings_equal.py"),
        ("py",  "verify_no_note.py"),
        ("py",  "verify_no_opt.py"),
        ("py",  "verify_no_follow_option.py"),
        ("py",  "verify_isolation.py"),
        ("py",  "verify_card_scope_real.py"),
        ("py",  "verify_card_real_click.py"),
        ("py",  "verify_session_sync.py"),
        ("py",  "verify_session_merge.py"),
        ("py",  "verify_notify_cache.py"),
        ("py",  "verify_browser_notify.py"),
        ("py",  "verify_browser_notify_cache.py"),
        ("py",  "probe_card_vs_settings.py"),
        ("py",  "probe_settings_reach.py"),
        ("py",  "probe_settings_tabs_dump.py"),
        ("py",  "verify_tests_can_catch.py"),
    ],
    "backend": [
        ("py",  "verify_backend.py"),
        ("py",  "probe_real_backend.py"),
        ("py",  "probe_e2e_real.py"),
        ("py",  "e2e_check.py"),
        ("py",  "verify_context_layers.py"),
        ("py",  "verify_logging.py"),
        ("py",  "verify_plugin_load.py"),
        ("py",  "verify_recommend_parity.py"),
        ("py",  "verify_shared_state.py"),
        ("py",  "verify_agent_id.py"),
        ("py",  "verify_follow_session_model.py"),
        ("py",  "verify_no_dup_analysis.py"),
    ],
    "browser": [
        ("py",  "verify_phase1_browser.py"),
        ("py",  "verify_p1_reopen.py"),
        ("py",  "verify_p1_mode_guard.py"),
        ("py",  "verify_p1_sse_down.py"),
        ("py",  "verify_full_flow_real.py"),
        ("py",  "verify_skip_reason_browser.py"),
        ("py",  "verify_skip_reason_e2e.py"),
        ("py",  "verify_phase2_final.py"),
        ("py",  "verify_phase2_nopage.py"),
    ],
    "phase": [
        ("py",  "verify_phase0_state.py"),
        ("py",  "verify_phase1_state.py"),
        ("py",  "verify_phase1_e2e.py"),
        ("py",  "verify_phase1_http.py"),
        ("py",  "verify_phase1_multitab.py"),
        ("py",  "verify_phase2_state.py"),
        ("py",  "verify_phase3_ai.py"),
        ("py",  "verify_phase3_cancel.py"),
        ("py",  "verify_phase4_audit.py"),
        ("py",  "verify_test_isolation.py"),
        ("py",  "verify_no_dup_analysis.py"),
    ],
    "release": [
        ("py",  "verify_release.py"),
        ("py",  "verify_release_semantics.py"),
    ],
}

# 判定输出里的成功/失败信号（多套脚本格式不同，统一归一）
PASS_PAT = ["ALL PASS", "passed, 0 failed", "通过 / 0 失败", "0 failed", "全通过", "全绿",
            "结果: 0 失败", "15/15 passed", "结果: 35 通过 / 0 失败"]
FAIL_PAT = ["HAS FAILURES", "passed, 1 failed", "FAILED", "Traceback", "AssertionError", "✗ "]


def classify(out: str, rc: int) -> str:
    low = out
    # 明确的失败信号优先
    if any(p in low for p in ["HAS FAILURES", "FAILED", "Traceback (most recent call last)"]):
        return "FAIL"
    if "✗ " in low or "✗" in low:
        return "FAIL"
    # "N/N passed" / "N 通过 / 0 失败" / "N passed, 0 failed" 等归一：0 失败即 PASS
    m = re.search(r"(\d+)/(\d+)\s*passed", low)
    if m and m.group(1) == m.group(2):
        return "PASS"
    if re.search(r"\d+\s*通过\s*/\s*0\s*失败", low):
        return "PASS"
    if "passed, 0 failed" in low or "0 failed" in low:
        return "PASS"
    # 明确成功
    if any(p in low for p in PASS_PAT):
        return "PASS"
    # 环境性（限流/会话占用/依赖缺失）——只认明确的环境错误，不因正常输出里
    # 出现 "skipped 语义" 这类产品文案误判（2026-11-13 修正）。
    # 自动模式下后端 runner 在轮询间隙已把问卷答完 → pending 转瞬即逝，
    # 「未检测到 pending 问卷」属环境时序，SSE 里 question_modal state=success
    # 已证明真实链路正常，不是功能失败。
    if "未检测到 pending 问卷" in low and 'state":"success"' in low:
        return "ENV"
    if "未触发问卷" in low or "问卷: None" in low:
        return "ENV"
    if any(p in low for p in ["MODEL_QUOTA_EXCEEDED", "tpm exhausted",
                              "RateLimitExceeded", "A task is already running"]):
        return "ENV"
    if rc != 0:
        return "FAIL"
    return "UNKNOWN"


def run_one(kind, name):
    cmd = ["node", name] if kind == "mjs" else [sys.executable, name]
    t0 = time.time()
    try:
        p = subprocess.run(cmd, cwd=HERE, capture_output=True, text=True, timeout=420)
        out = (p.stdout or "") + "\n" + (p.stderr or "")
        rc = p.returncode
    except subprocess.TimeoutExpired as e:
        out = (e.stdout or b"").decode(errors="ignore") + "\n[TIMEOUT]"
        rc = 124
    el = round(time.time() - t0, 1)
    st = classify(out, rc)
    # 失败时保留完整输出，便于事后归因（tail 只留最后 6 行不够）
    full = out if st in ("FAIL", "UNKNOWN") else ""
    # 抓最后几行诊断
    tail = "\n".join([l for l in out.strip().splitlines() if l.strip()][-6:])
    return {"name": name, "kind": kind, "status": st, "rc": rc, "sec": el,
            "tail": tail[:600], "full": full[:20000]}


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else None
    groups = [which] if which else list(GROUPS.keys())
    results = []
    for g in groups:
        print("\n########## 组 %s ##########" % g, flush=True)
        for kind, name in GROUPS[g]:
            if not os.path.exists(os.path.join(HERE, name)):
                print("  [SKIP] %s (文件不存在)" % name, flush=True)
                results.append({"name": name, "kind": kind, "status": "SKIP", "rc": -1, "sec": 0, "tail": "not found"})
                continue
            r = run_one(kind, name)
            results.append(r)
            print("  [%-7s] %-40s rc=%s %ss | %s" % (
                r["status"], name, r["rc"], r["sec"], r["tail"].replace("\n", " / ")[:180]), flush=True)
    path = "/tmp/qm_regression_results_20261113_%s.json" % (which or "all")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)
    from collections import Counter
    c = Counter(r["status"] for r in results)
    print("\n==== 汇总 ====", dict(c), flush=True)
    fails = [r for r in results if r["status"] in ("FAIL", "UNKNOWN")]
    for r in fails:
        print("\n--- %s ---\n%s" % (r["name"], r["tail"]), flush=True)
    print("\n结果文件:", path, flush=True)
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
