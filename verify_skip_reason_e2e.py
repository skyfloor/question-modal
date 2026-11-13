"""端到端：watchdog 释放 → 原因进 Future payload / 模型文本 / state，且保住已答题目。

独立进程加载真实插件代码，state 文件隔离到临时目录，绝不污染生产。
"""
import asyncio
import importlib.util
import json
import os
import sys
import tempfile
import types

PLUGIN = "/app/working/plugins/question-modal"
_TMP = tempfile.mkdtemp(prefix="qm_skip_e2e_")
os.environ["QM_SURVEY_STATE_FILE"] = os.path.join(_TMP, "survey_states.json")
os.environ["QM_PENDING_FILE"] = os.path.join(_TMP, "pending.json")

_pkg = types.ModuleType("plugin_question_modal")
_pkg.__path__ = [PLUGIN]
sys.modules["plugin_question_modal"] = _pkg
for _m in ("question_service", "plugin"):
    _sp = importlib.util.spec_from_file_location(
        f"plugin_question_modal.{_m}", os.path.join(PLUGIN, _m + ".py"))
    _mod = importlib.util.module_from_spec(_sp)
    sys.modules[_sp.name] = _mod
    _sp.loader.exec_module(_mod)
qs = sys.modules["plugin_question_modal.question_service"]
pl = sys.modules["plugin_question_modal.plugin"]

PASS = FAIL = 0


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} — {detail}")


async def main():
    svc = qs.get_question_service()
    loop = asyncio.get_running_loop()
    fut = loop.create_future()
    pq = qs.PendingQuestion(
        request_id="req-e2e", tool_call_id="tc-e2e",
        session_id="s-e2e", agent_id="default", title="端到端问卷",
        questions=[{"type": "single", "title": "走哪条？", "options": ["甲", "乙"]}],
        future=fut,
    )
    async with svc._lock:
        svc._pending[pq.request_id] = pq
    st = svc.ensure_survey("tc-e2e")
    st.mode = "ai"
    st.answers = {"q0": {"type": "single", "value": "乙"}}   # 已答一题
    svc._surveys()["tc-e2e"] = st

    # 模拟 watchdog 释放（带原因）
    reason = "自动推进 300s 无进展，已自动释放"
    st.watchdog_reason = reason
    await svc.release_survey("tc-e2e", "watchdog", reason=reason)

    payload = fut.result()
    print("\n[1] Future payload（模型侧真相源）")
    ck("skipped=True", payload.get("skipped") is True)
    ck("skipped_by=watchdog", payload.get("skipped_by") == "watchdog")
    ck("skip_reason 原文", payload.get("skip_reason") == reason, str(payload.get("skip_reason")))
    ck("保住已答 q0=乙", (payload.get("answers") or {}).get("q0", {}).get("value") == "乙",
       str(payload.get("answers")))

    print("\n[2] 模型看到的文本（_format_answer_for_llm）")
    text = pl._format_answer_for_llm(payload)
    ck("含真实原因", reason in text, text[:300])
    ck("不再谎报「用户跳过了本次问卷」", "用户跳过了本次问卷" not in text)
    ck("写明系统自动释放", "系统自动释放" in text)
    ck("列出已答题 q0/乙", "q0" in text and "乙" in text, text[:400])

    print("\n[3] 前端卡片可用的 state（/survey-state）")
    st2 = svc.get_survey("tc-e2e")
    ck("state.skip_reason", st2.skip_reason == reason, st2.skip_reason)
    ck("state.submitted_by=watchdog", st2.submitted_by == "watchdog", st2.submitted_by)
    ck("to_json 含 skip_reason", st2.to_json().get("skip_reason") == reason)
    ck("watchdog_reason 也保留", st2.watchdog_reason == reason)

    print("\n[4] 阈值与文案（第 3 项）")
    ck("watchdog=300s", qs._SURVEY_WATCHDOG_SEC == 300.0, str(qs._SURVEY_WATCHDOG_SEC))
    ck("前端 parseSkipReason 能识别的新措辞存在",
       "系统自动释放" in text, "")

    print(f"\n结果：{PASS} 通过 / {FAIL} 失败")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
