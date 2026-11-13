"""跳过原因修复的定向验证（独立进程，隔离生产 state）。

用法：python3 verify_skip_reason.py
覆盖：Future payload 带原因+已有答案 / state 落盘 / 文案按来源分流 / 阈值 300。
"""
import asyncio
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN = "/app/working/plugins/question-modal"
sys.path.insert(0, os.path.dirname(PLUGIN))   # 让 plugin_question_modal 可作为包导入
sys.path.insert(0, PLUGIN)

# 关键：隔离 state 文件，绝不污染生产数据
_TMP = tempfile.mkdtemp(prefix="qm_skip_reason_")
os.environ["QM_SURVEY_STATE_FILE"] = os.path.join(_TMP, "survey_states.json")
os.environ["QM_PENDING_FILE"] = os.path.join(_TMP, "pending.json")

PASS = 0
FAIL = 0


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} — {detail}")


def main():
    import importlib.util
    import types as _types
    # 与生产一致：宿主把插件树挂成 plugin_question_modal 包（目录名带
    # 连字符，不能靠 sys.path 直接 import，需构造虚拟包 + __path__）。
    _pkg = _types.ModuleType("plugin_question_modal")
    _pkg.__path__ = [PLUGIN]
    sys.modules["plugin_question_modal"] = _pkg
    _qs_spec = importlib.util.spec_from_file_location(
        "plugin_question_modal.question_service",
        os.path.join(PLUGIN, "question_service.py"))
    qs = importlib.util.module_from_spec(_qs_spec)
    sys.modules[_qs_spec.name] = qs
    _qs_spec.loader.exec_module(qs)
    _pl_spec = importlib.util.spec_from_file_location(
        "plugin_question_modal.plugin", os.path.join(PLUGIN, "plugin.py"))
    pl = importlib.util.module_from_spec(_pl_spec)
    sys.modules[_pl_spec.name] = pl
    _pl_spec.loader.exec_module(pl)

    print("\n[1] 阈值与字段")
    ck("watchdog 阈值 = 300s", qs._SURVEY_WATCHDOG_SEC == 300.0,
       str(qs._SURVEY_WATCHDOG_SEC))
    ck("_STATE_FIELD_DEFAULTS 含 skip_reason",
       "skip_reason" in qs._STATE_FIELD_DEFAULTS,
       str(qs._STATE_FIELD_DEFAULTS))
    ck("SurveyState.to_json 含 skip_reason",
       "skip_reason" in qs.SurveyState("x").to_json(),
       str(qs.SurveyState("x").to_json().keys()))
    ck("SurveyState.from_json 恢复 skip_reason",
       qs.SurveyState.from_json({"skip_reason": "abc"}).skip_reason == "abc")

    print("\n[2] 文案按来源分流（模型侧不再伪装成用户）")
    ck("watchdog 文案",
       "系统自动释放" in pl._skip_reason_text(
           {"skipped_by": "watchdog", "skip_reason": "自动推进 300s 无进展"}),
       pl._skip_reason_text({"skipped_by": "watchdog", "skip_reason": "x"}))
    ck("timeout 文案",
       "系统自动跳过" in pl._skip_reason_text(
           {"skipped_by": "timeout", "skip_reason": "作答超时"}))
    ck("user 文案仍是「用户跳过了本次问卷」",
       "用户跳过了本次问卷" in pl._skip_reason_text({"skipped_by": "user"}))
    ck("原因原文带上", "自动推进 300s" in pl._skip_reason_text(
        {"skipped_by": "watchdog", "skip_reason": "自动推进 300s 无进展"}))
    ck("旧 payload 无 skipped_by 仍安全回落",
       "用户跳过了本次问卷" in pl._skip_reason_text({"skipped": True}))

    print("\n[3] _format_answer_for_llm：不丢已有答案 + 不谎报")
    out = pl._format_answer_for_llm({
        "skipped": True, "skipped_by": "watchdog",
        "skip_reason": "自动推进 300s 无进展，已自动释放",
        "answers": {"q0": {"type": "single", "value": "乙"}},
    })
    ck("含真实原因", "自动推进 300s" in out)
    ck("含已有答案 q0/乙", "q0" in out and "乙" in out, out[:300])
    ck("不再写死「用户跳过了本次问卷」", "用户跳过了本次问卷" not in out)
    ck("raw JSON 保留 skipped_by", '"skipped_by": "watchdog"' in out)
    out2 = pl._format_answer_for_llm({"skipped": True})
    ck("无答案时也不谎报系统来源", "用户跳过" in out2, out2[:200])

    print("\n[4] service.skip()：payload + state 落盘")
    async def run():
        svc = qs.get_question_service()
        fut = asyncio.get_running_loop().create_future()
        pq = qs.PendingQuestion(
            request_id="req-skip-1", tool_call_id="tc-skip-1",
            session_id="s1", agent_id="default", title="t",
            questions=[{"type": "single", "title": "q", "options": ["甲", "乙"]}],
            future=fut,
        )
        async with svc._lock:
            svc._pending[pq.request_id] = pq
        st = svc.ensure_survey("tc-skip-1")
        st.answers = {"q0": {"type": "single", "value": "乙"}}
        svc._surveys()["tc-skip-1"] = st
        r = await svc.skip("req-skip-1", reason="测试原因", by="watchdog")
        return fut, r, svc.get_survey("tc-skip-1")

    fut, r, st = asyncio.run(run())
    ck("skip 返回 pq", r is not None)
    payload = fut.result()
    ck("payload skipped=True", payload.get("skipped") is True)
    ck("payload skipped_by=watchdog", payload.get("skipped_by") == "watchdog")
    ck("payload skip_reason=测试原因", payload.get("skip_reason") == "测试原因")
    ck("payload 保住 q0 答案", (payload.get("answers") or {}).get("q0", {}).get("value") == "乙",
       str(payload.get("answers")))
    ck("state.skip_reason 已写", st.skip_reason == "测试原因", st.skip_reason)
    ck("state.submitted_by=watchdog", st.submitted_by == "watchdog", st.submitted_by)
    ck("to_json 带 skip_reason（前端 /survey-state 可读）",
       st.to_json().get("skip_reason") == "测试原因")

    print(f"\n结果：{PASS} 通过 / {FAIL} 失败")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
