"""守护：验证脚本绝不允许污染生产的 survey_states.json。

## 事故记录（2026-11-07）

验证脚本在**独立进程**里跑：它 restore 出生产的 68 条 state，加上自己造的几条，
`persist` 时写回去 —— 于是生产文件里混进了 `p3-xxx`、`call_phase0_xxx` 这类
测试 key。实测累积到 **221 条**，其中 121 条是没有任何 `request_id` 的僵尸
pending（37 条 `mode=ai`）。

僵尸 ai pending 的危害：任何一次 `_sync_runners` 唤醒都会让它们去调模型，
与真实问卷抢 TPM 配额 —— 用户实测「问卷卡 60 秒被看门狗释放」就发生在这种
配额被抢占的时段。

更糟的一次：`_persist_surveys()` 在内存表**近乎空**的进程里被调用，
直接把磁盘覆盖成 **0 条**（备份文件也只有 2 字节）。

## 修法

`question_service._resolve_survey_file()` 支持
`QM_SURVEY_STATE_FILE` 环境变量；所有验证脚本在 import 之前设它指向临时文件。

本套件检查两件事：
  ① 每个会调 `_persist_surveys` 的脚本都设了隔离
  ② 隔离真的生效（生产文件路径不会被这些脚本写到）

反证：删掉某个脚本里的隔离 → `[1]` 必须失败。
"""
import os
import re
import subprocess
import sys
from pathlib import Path

DEV = Path("/app/working/build/question-modal-dev")
PROD_STATE = Path("/app/working/plugins/question-modal/survey_states.json")
PASS = FAIL = 0
FAILS = []


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


def main():
    print("[1] 所有脚本都必须有隔离手段（二选一）")
    # 隔离有两条合法路径，判据要认两者，不能只认环境变量：
    #   ① 进程内直接 import question_service → 必须设 QM_SURVEY_STATE_FILE
    #   ② 走真实 HTTP 打生产插件 → state 由插件写它自己的文件，
    #      无法用环境变量隔离，必须在结尾调 `/survey-prune` 清理
    # 我第一版只认 ①，于是把走 ② 的两个脚本 + 插件本体误判成"未隔离"。
    dirty = []
    for p in sorted(DEV.glob("*.py")):
        if p.name.startswith("verify_logging"):
            continue          # 只做静态检查，不碰 state
        src = p.read_text(encoding="utf-8")
        touches = "_persist_surveys" in src or "_surveys()" in src \
            or "/survey-action" in src or "/survey-shadow" in src
        if not touches:
            continue
        path_a = "QM_SURVEY_STATE_FILE" in src
        path_b = "survey-prune" in src
        if not (path_a or path_b):
            dirty.append(p.name)
    ck("[1] 无遗漏（环境变量或 /survey-prune 清理）", not dirty,
       f"两种隔离都没有: {dirty}")

    print("\n[2] 隔离必须在 import question_service 之前设置")
    order_bad = []
    for p in sorted(DEV.glob("*.py")):
        src = p.read_text(encoding="utf-8")
        if "QM_SURVEY_STATE_FILE" not in src:
            continue
        i_env = src.find("QM_SURVEY_STATE_FILE")
        i_imp = min([x for x in
                     (src.find("import question_service"),
                      src.find("from question_service")) if x >= 0] or [10 ** 9])
        if i_env > i_imp:
            order_bad.append(p.name)
    ck("[2] 环境变量在 import 之前", not order_bad, f"顺序错: {order_bad}")

    print("\n[3] _resolve_survey_file 支持覆盖，默认仍是生产路径")
    code = (
        "import sys; sys.path.insert(0,'/app/working/plugins/question-modal');"
        "import question_service as qs;"
        "print(qs._resolve_survey_file())"
    )
    r = subprocess.run([sys.executable, "-c", code], capture_output=True,
                       text=True, cwd="/tmp")
    default_path = r.stdout.strip()
    ck("[3] 默认指向生产文件",
       default_path.endswith("survey_states.json")
       and "/plugins/question-modal/" in default_path, default_path)

    env = dict(os.environ, QM_SURVEY_STATE_FILE="/tmp/_qm_probe_state.json")
    r2 = subprocess.run([sys.executable, "-c", code], capture_output=True,
                        text=True, cwd="/tmp", env=env)
    ck("[4] 环境变量可改变路径",
       r2.stdout.strip() == "/tmp/_qm_probe_state.json", r2.stdout.strip())

    print("\n[4] 生产 state 文件当前没有测试残留")
    if PROD_STATE.exists():
        import json
        d = json.loads(PROD_STATE.read_text(encoding="utf-8"))
        junk = [k for k in d if re.match(
            r"^(p[0-9]-|p2|p3-|call_phase|call_p0|dbg|diag-|repro-|logtest|proof)", k)]
        ck("[5] 无测试 key 残留", not junk, f"残留 {len(junk)} 条: {junk[:5]}")
        zombie = [k for k, v in d.items()
                  if v.get("status") == "pending" and not v.get("request_id")]
        ck("[6] 无僵尸 pending（无 request_id 的 pending）", not zombie,
           f"{len(zombie)} 条: {zombie[:5]}")
        print(f"    （当前 state 总数 {len(d)}）")
    else:
        ck("[5] 生产 state 文件存在", False, str(PROD_STATE))

    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
