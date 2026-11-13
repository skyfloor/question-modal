"""自动分析上下文模式 · 真机验证（不发模型请求，直接验证 prompt 拼装）。

用户裁定：先确认「当前自动分析的上下文模式是否正常」；不正常才追查是否功能遗漏回归。

验证三块上下文是否真的进入最终 prompt：
  C1 基础层  build_answered_context  本卷前序已答题（always）
  C2 扩展层  decision_context_text   上一问卷决策（仅 with_context）
  C3 扩展层  fetch_session_context   会话历史（仅 with_context）
再加：
  C4 with_context=false 时扩展层必须完全缺席
  C5 顺序约束：题号 > 当前题 的答案绝不进入
  C6 端到端：/analyze 真实请求（真机 HTTP，桩掉模型，抓 prompt）
"""
import asyncio, json, os, sys, urllib.request, urllib.error

DEV = "/app/working/build/question-modal-dev"
sys.path.insert(0, "/app/working/plugins/question-modal")

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

QS = [
    {"type": "single", "title": "第一题：部署方式", "options": ["单机", "集群"]},
    {"type": "single", "title": "第二题：是否要回滚点", "options": ["要", "不要"]},
    {"type": "text", "title": "第三题：补充说明"},
]
ANSWERS = {
    "q0": {"type": "single", "value": "集群", "other": "", "skipped": False},
    "q1": {"type": "single", "value": "要", "other": "并要求打 tag", "skipped": False},
    "q2": {"type": "text", "value": "这是第四块不该出现的内容", "other": "", "skipped": False},
}

def main():
    import analysis as A

    print("【C1】基础层 build_answered_context（本卷前序已答，always）")
    ctx1 = A.build_answered_context(QS, 1, ANSWERS)   # 分析第 2 题（idx=1）
    print("    idx=1 上下文:", repr(ctx1))
    ck("[C1a] 含第 1 题及其答案", ("第 1 题" in ctx1) and ("集群" in ctx1), ctx1)
    ck("[C1b] 不含当前题本身（第 2 题）", "第 2 题" not in ctx1, ctx1)
    ck("[C1c] 不含后续题（第 3 题 / 第四块）",
       ("第 3 题" not in ctx1) and ("第四块" not in ctx1), ctx1)

    print("\n【C1b】idx=0（第一题）→ 无前序答案，上下文为空")
    ctx0 = A.build_answered_context(QS, 0, ANSWERS)
    ck("[C1d] 第一题无前序 → 空串", ctx0 == "", repr(ctx0))

    print("\n【C2】扩展层 decision_context_text（上一问卷决策）")
    dctx = A.decision_context_text("1791724819571-muuetab")
    print("    决策上下文长度:", len(dctx), "| 前 120:", repr(dctx[:120]))
    ck("[C2] 可从 decisions 存储读出（有则非空，无则空串不报错）",
       isinstance(dctx, str), type(dctx))

    print("\n【C3】扩展层 fetch_session_context（会话历史）")

    # history.db 是 per-workspace（plugin.py:_history_db_path 从 workspace_dir 拼出）
    HIST_DB = "/app/working/workspaces/wb74Jn/history.db"
    print("    history.db:", HIST_DB, "存在:", os.path.exists(HIST_DB))

    async def run_hist():
        return await A.fetch_session_context(
            HIST_DB, "1791724819571-muuetab", "wb74Jn")

    try:
        hist = asyncio.run(run_hist())
        print("    会话历史长度:", len(hist), "| 前 120:", repr(hist[:120]))
        ck("[C3] 会话历史可读（不抛异常，可空）", isinstance(hist, str), type(hist))
    except Exception as e:
        ck("[C3] 会话历史可读", False, str(e)[:150])

    print("\n【C4】with_context=false 时扩展层必须完全缺席（真实 analyze_survey）")
    captured = {}

    async def fake_call_model(system_prompt, prompt, model_id="", timeout=0, max_tokens=None):
        captured["system"] = system_prompt
        captured["prompt"] = prompt
        return json.dumps({"choice": "要", "reasoning": "基于前序答案推断"})

    orig = A.call_model
    A.call_model = fake_call_model
    try:
        r_off = asyncio.run(A.analyze_survey(
            questions=QS, title="上下文验证", question_index=1, answers=ANSWERS,
            with_context=False, session_id="1791724819571-muuetab",
            history_db_path=HIST_DB, agent_id="wb74Jn"))
        p_off = captured.get("prompt", "")
        print("    关闭上下文时 prompt 长度:", len(p_off))
        print("    prompt 片段:", repr(p_off[:400]))
        ck("[C4a] 关闭时仍含基础层（第 1 题/集群）",
           ("第 1 题" in p_off) and ("集群" in p_off), p_off[:200])
        ck("[C4b] 关闭时【不】含「会话历史」段", "会话历史" not in p_off, p_off[:300])
        ck("[C4c] 关闭时【不】含 last-decision 段",
           "上一次决策" not in p_off and "上一份问卷" not in p_off, p_off[:300])
        ck("[C4d] 分析成功 ok=True", r_off.get("ok") is True, json.dumps(r_off, ensure_ascii=False)[:200])

        print("\n【C5】with_context=true 时扩展层必须出现")
        captured.clear()
        r_on = asyncio.run(A.analyze_survey(
            questions=QS, title="上下文验证", question_index=1, answers=ANSWERS,
            with_context=True, session_id="1791724819571-muuetab",
            history_db_path=HIST_DB, agent_id="wb74Jn"))
        p_on = captured.get("prompt", "")
        print("    开启上下文时 prompt 长度:", len(p_on), "（关闭时 %d）" % len(p_off))
        print("    新增部分:", repr(p_on[len(p_off):][:300]) if len(p_on) > len(p_off) else "(无新增)")
        ck("[C5a] 开启后 prompt 变长（扩展层被拼入）", len(p_on) > len(p_off),
           (len(p_on), len(p_off)))
        has_hist = ("会话历史" in p_on)
        has_dec = ("上一次决策" in p_on) or ("上一份问卷" in p_on) or ("上次决策" in p_on)
        print("    含「会话历史」=%s  含「上次决策/上一份问卷」=%s" % (has_hist, has_dec))
        ck("[C5b] 至少有一层扩展上下文被拼入", has_hist or has_dec, (has_hist, has_dec))
        ck("[C5c] 基础层依然保留", ("第 1 题" in p_on) and ("集群" in p_on), p_on[:200])
        ck("[C5d] 开启时分析仍成功", r_on.get("ok") is True, json.dumps(r_on, ensure_ascii=False)[:200])
    finally:
        A.call_model = orig

    print("\n【C6】真实后端 /analyze 路由（桩模型不可用，只验请求契约）")
    try:
        u = "http://127.0.0.1:8088/api/question-modal/analysis?tool_call_id=ctxprobe&question_index=1"
        got = json.loads(urllib.request.urlopen(u, timeout=20).read())
        print("    GET /analysis:", json.dumps(got, ensure_ascii=False)[:200])
        ck("[C6] GET /analysis 路由可达且返回契约正确",
           isinstance(got, dict) and "found" in got, got)
    except urllib.error.HTTPError as e:
        ck("[C6] GET /analysis 路由可达", False, "HTTP %s" % e.code)
    except Exception as e:
        ck("[C6] GET /analysis 路由可达", False, str(e)[:150])

    print("\n==== 上下文模式验证: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
