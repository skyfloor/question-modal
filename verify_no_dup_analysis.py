"""验证「不重复分析」——**纯服务端判定，无需任何浏览器 console**。

## 为什么需要这套（用户裁定 2026-11-07）

用户明确：「无法在浏览器中的 console 输入内容，该验证方式以后不要提供」。
所以判定必须由我从**服务端日志 + 落盘状态**得出，不依赖用户转述任何前端信息。

## 缺陷背景（阶段 4）

后端 `_runner_loop` 会对每道 ai 题调一次 `analyze_survey`（结果用于填答案）。
而前端自动分析 effect 也曾对**同一题**再发一次 `POST /analyze`（结果只渲染气泡）
→ 同一题烧两份模型配额。用户当天被 429 限流数百次，这会直接加剧
「抢不到配额 → 看门狗 60s 释放」的故障。

已给前端加 `!backendDown` 守卫让位。但**仅看界面无法证伪**：两份结果只影响
气泡渲染，用户看不出差别。故在服务端两侧各打一行来源标记：

  • `analyze-request: ... (via=analyze-http)`  ← plugin.py 的 /analyze 入口
  • `analyze-request: ... (via=runner)`        ← question_service 的 runner

同一 `tcid` + 同一 `q` 若出现 `via=analyze-http` **且**该问卷当时是自动模式，
即为重复分析。

## 本套件怎么判

不猜日志，直接从**代码结构**判定（可重复、不依赖运行时是否恰好有问卷）：

  ① 自动分析 effect 必须有 `!backendDown` 守卫
  ② 驱动推进 effect 也必须有（两者必须对称）
  ③ 降级路径必须存在（SSE 断 → 前端恢复自分析，不能把问卷打死）
  ④ 两侧的 `analyze-request` 日志标记都存在（可观测性锚点）

再加一条**运行时**检查：后端跑一次真实 ai 问卷，数模型调用次数应 == 题数
（不多不少），用落盘状态与 stub 计数直接判定。
"""
import ast
import os
import re
import sys
import tempfile
from pathlib import Path

os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    os.path.join(tempfile.gettempdir(), "qm_no_dup_analysis.json"),
)

PLUG = Path("/app/working/plugins/question-modal")
SRC = Path("/app/working/build/question-modal-dev/src/index.tsx")
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
    code = SRC.read_text(encoding="utf-8")

    print("[1] 两处守卫必须对称（推进让位 + 分析让位）")
    # 定位自动分析 effect：以 `if (anMode !== "ai") return;` 起
    i = code.find('if (anMode !== "ai") return;')
    ck("[1] 找到自动分析 effect", i > 0)
    an_block = code[i:i + 1400]
    guard = "if (!backendDown) return;"
    ck("[2] 自动分析 effect 有 !backendDown 守卫（= 不重复分析）",
       guard in an_block, "缺守卫 → 后端在线时前端仍会重复分析")
    ck("[3] 驱动推进 effect 有同样的守卫（两者必须对称）",
       'anMode === "recommend" || anMode === "ai") && !backendDown' in code)

    print("\n[2] 守卫必须放在 backendDown 定义之后（否则 TDZ 崩溃）")
    i_def = code.find("const [backendDown, setBackendDown]")
    i_use = code.find(guard)
    ck("[4] backendDown 定义早于使用点", 0 < i_def < i_use,
       f"def@{i_def} use@{i_use}（use 更早会 Cannot access before initialization）")

    print("\n[3] 降级路径必须保留（SSE 断 → 前端自己分析）")
    dep = re.search(r"backendDown\]\);", code[i:i + 1600])
    ck("[5] backendDown 在自动分析 effect 的依赖数组里", bool(dep),
       "漏了会永远停在让位状态（连不上也不分析）")
    # BK3 用例守着降级路径
    h = Path("/app/working/build/question-modal-dev/harness_rescue.mjs").read_text(encoding="utf-8")
    ck("[6] harness 有「SSE 断开恢复自分析」用例", "[BK3]" in h)
    ck("[7] harness 有「后端在线不发 /analyze」用例", "[BK1]" in h)

    print("\n[4] 可观测性锚点：两侧都必须打来源标记")
    plug_src = (PLUG / "plugin.py").read_text(encoding="utf-8")
    qs_src = (PLUG / "question_service.py").read_text(encoding="utf-8")
    ck("[8] /analyze 入口记录 via=analyze-http",
       "via=analyze-http" in plug_src)
    ck("[9] runner 记录 via=runner", "via=runner" in qs_src)

    print("\n[5] 运行时：后端 runner 每题只调 1 次模型")
    sys.path.insert(0, str(PLUG))
    import question_service as qs  # noqa: E402
    import analysis  # noqa: E402

    calls = []
    _orig = analysis.analyze_survey

    async def stub(**kw):
        calls.append(kw.get("question_index"))
        return {"ok": True, "per_question": [
            {"index": kw.get("question_index"), "choice": "甲", "failed": False}]}

    analysis.analyze_survey = stub

    import asyncio

    async def run():
        svc = qs.get_question_service()
        tag = "nodup"
        qs3 = [{"type": "single", "title": f"Q{i}", "options": ["甲", "乙"]}
               for i in range(3)]
        pq = await svc.create(session_id="s", agent_id="a", title="t",
                              questions=qs3, tool_call_id=tag, mode="ai",
                              prefs={})
        svc._sync_runners(tag)
        for _ in range(100):
            await asyncio.sleep(0.05)
            if pq.future.done():
                break
        st = svc.get_survey(tag)
        out = (len(calls), len(st.answers or {}), st.status)
        svc.stop_runner(tag)
        svc.stop_watchdog(tag)
        svc._surveys().pop(tag, None)
        svc._persist_surveys()
        return out

    n_calls, n_ans, status = asyncio.run(run())
    analysis.analyze_survey = _orig
    print(f"    3 题问卷：模型调用 {n_calls} 次，答案 {n_ans} 条，status={status}")
    ck("[10] 每题恰 1 次模型调用（3 题 = 3 次，不多不少）",
       n_calls == 3, n_calls)
    ck("[11] 三题全部答上", n_ans == 3, n_ans)
    ck("[12] 整卷已提交", status == "submitted", status)

    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
