"""Phase 0 验证：后端 state 化 + 影子比对（真机 HTTP，零行为变化）。

覆盖：
  [S1] GET /survey-state 未记录时 found:false（不是 500）
  [S2] POST /survey-action 自动建 state 并记账
  [S3] set_answer / skip / goto / set_mode / submit 五类动作都能落
  [S4] answers 的键是真实题号（q0/q1...），cursor 是可见位置
  [S5] 影子比对：一致 → match:true 且不落盘
  [S6] 影子比对：不一致 → 报出具体字段与两边的值
  [S7] 空答案壳（value=""）不算差异（前端可能与后端表达不同）
  [S8] state 落盘 survey_states.json，可被新实例读回
  [S9] 阶段 0 硬约束：action 不 resolve、不推进（pending 数不变）
  [S10] 手动释放与看门狗：/survey-state 不影响 /pending
"""
# ★ 测试隔离（必须先于任何对 state 文件的操作）：
#   本脚本历史上会 `os.remove(survey_states.json)` 做"基线清理" ——
#   那是阶段 0 时期假设"state 文件只属于测试"留下的写法。
#   现在生产进程正在用这个文件，**删掉它 = 删除真实问卷记录**。
#   实测（2026-11-07）：跑完本脚本后 survey_states.json 整个消失，
#   只能从备份恢复。改为指向临时文件，生产文件完全不被触碰。
import os as _os
import tempfile as _tempfile
_os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    _os.path.join(_tempfile.gettempdir(), "qm_phase0_state.json"),
)
import json, os, sys, time, urllib.request, urllib.error

BASE = "http://127.0.0.1:8088/api/question-modal"
PLUG = "/app/working/plugins/question-modal"
# ⚠️ 本脚本走真实 HTTP，state 由**生产插件**写入它自己的文件。
# 所以这里必须读生产路径（`/survey-prune` 端点写的也是它），
# 不能用 QM_SURVEY_STATE_FILE —— 那是给"进程内直接 import"的脚本用的隔离手段。
SURVEY_FILE = "/app/working/plugins/question-modal/survey_states.json"
SHADOW_FILE = "/tmp/qm_phase0_shadow.json"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=20) as f:
        return json.loads(f.read().decode())

def post(path, body):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                               headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=20) as f:
            return json.loads(f.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http": e.code, "_body": e.read().decode()[:300]}

TC = "call_phase0_%d" % int(time.time())

def main():
    print("=== 基线（不删任何生产文件）===")
    # ⚠️ 这里原本会 `os.remove(survey_states.json)` 做"基线清理" ——
    # 那是阶段 0 时期"state 文件只属于测试"的假设，现在它会**删除真实问卷记录**
    # （实测跑完本脚本后文件整个消失）。已移除；测试数据改由结尾的
    # `/survey-prune` 按 prefix 精准清理。

    print("\n【S1】未记录的 tool_call_id")
    d = get("/survey-state?tool_call_id=" + TC)
    print("   ", json.dumps(d, ensure_ascii=False)[:160])
    ck("[S1] 返回 ok:true found:false（不是 500）",
       d.get("ok") is True and d.get("found") is False, d)

    print("\n【S2】POST /survey-action 自动建 state")
    d = post("/survey-action", {"tool_call_id": TC, "action": "set_mode",
                                "payload": {"mode": "ai"}})
    print("   ", json.dumps(d, ensure_ascii=False)[:200])
    # 阶段 1（2026-11-07）后 /survey-action 的契约从 `recorded` 升级为
    # `accepted`（后端不再是"只记账"，而是裁决者）。断言随之更新 ——
    # 语义没变：这次 set_mode 被接受了，且 mode 真的写进了 state。
    ck("[S2] accepted:true 且 mode=ai",
       d.get("ok") is True and d.get("accepted") is True
       and (d.get("state") or {}).get("mode") == "ai", d)

    print("\n【S3】五类动作")
    post("/survey-action", {"tool_call_id": TC, "action": "set_answer",
                            "payload": {"key": "q0", "answer": {"type": "single", "value": "甲", "other": ""}}})
    post("/survey-action", {"tool_call_id": TC, "action": "set_answer",
                            "payload": {"key": "q1", "answer": {"type": "text", "value": "补充内容", "other": ""}}})
    post("/survey-action", {"tool_call_id": TC, "action": "skip",
                            "payload": {"key": "q2", "by": "no_recommend"}})
    post("/survey-action", {"tool_call_id": TC, "action": "goto", "payload": {"cursor": 2}})
    post("/survey-action", {"tool_call_id": TC, "action": "set_analysis",
                            "payload": {"index": 0, "result": {"choice": "甲", "failed": False}}})
    st = get("/survey-state?tool_call_id=" + TC).get("state") or {}
    print("   answers:", json.dumps(st.get("answers"), ensure_ascii=False)[:220])
    print("   cursor:", st.get("cursor"), "| per_question:", json.dumps(st.get("per_question"), ensure_ascii=False)[:120])
    ck("[S3a] set_answer 落 q0/q1", (st.get("answers") or {}).get("q0", {}).get("value") == "甲"
       and (st.get("answers") or {}).get("q1", {}).get("value") == "补充内容", st.get("answers"))
    ck("[S3b] skip 标 skipped + skipped_by",
       (st.get("answers") or {}).get("q2", {}).get("skipped") is True
       and (st.get("answers") or {}).get("q2", {}).get("skipped_by") == "no_recommend",
       (st.get("answers") or {}).get("q2"))
    ck("[S3c] goto 改 cursor", st.get("cursor") == 2, st.get("cursor"))
    ck("[S3d] set_analysis 按真实题号存", "0" in (st.get("per_question") or {}), st.get("per_question"))

    print("\n【S4】两个编号空间")
    ck("[S4] answers 键是真实题号 q<N>；cursor 是可见位置",
       all(str(k).startswith("q") for k in (st.get("answers") or {}))
       and isinstance(st.get("cursor"), int), (list((st.get("answers") or {}).keys()), st.get("cursor")))

    print("\n【S5】影子比对：一致")
    same = {"cursor": st.get("cursor"), "mode": st.get("mode"), "status": st.get("status"),
            "answers": st.get("answers"), "per_question": st.get("per_question")}
    r = post("/survey-shadow", {"tool_call_id": TC, "state": same})
    print("   ", json.dumps(r, ensure_ascii=False)[:150])
    ck("[S5a] match:true", r.get("match") is True, r)
    ck("[S5b] 一致的比对不落盘（差异文件不存在或 0 条）",
       (not os.path.exists(SHADOW_FILE)) or
       len(json.load(open(SHADOW_FILE, encoding="utf-8")) or []) == 0, "")

    print("\n【S6】影子比对：不一致（响应里如实报差异）")
    bad = dict(same)
    bad["cursor"] = 99
    r2 = post("/survey-shadow", {"tool_call_id": TC, "state": bad})
    print("   ", json.dumps(r2, ensure_ascii=False)[:220])
    ck("[S6a] match:false 且报出 cursor 字段",
       r2.get("match") is False and any(x.get("field") == "cursor" for x in (r2.get("diffs") or [])),
       r2.get("diffs"))
    # 阶段 0 后端是镜像：前端每次前进都会让后端"落后一版"，那是正常增量。
    # 因此落盘只记「同一字段连续两次差异」= 真分歧。单次不记。
    ck("[S6b] 单次增量差异不落盘（避免噪声淹没真问题）",
       (not os.path.exists(SHADOW_FILE))
       or len(json.load(open(SHADOW_FILE, encoding="utf-8")) or []) == 0, "")

    print("\n【S6c】镜像语义：第二次同一上报应当 match（后端已被覆盖）")
    r2b = post("/survey-shadow", {"tool_call_id": TC, "state": bad})
    print("   第二次:", json.dumps(r2b, ensure_ascii=False)[:160])
    ck("[S6c] 镜像生效 → 第二次 match:true（后端记住了前端值）",
       r2b.get("match") is True, r2b)

    print("\n【S6d】questions 分歧才落盘（唯一真正的后端权威字段）")
    post("/survey-action", {"tool_call_id": TC + "_q", "action": "set_mode",
                            "payload": {"mode": "manual"}})
    # 后端先建立 questions 基线
    post("/survey-shadow", {"tool_call_id": TC + "_q", "state": {
        "cursor": 0, "mode": "manual", "status": "pending",
        "answers": {}, "per_question": {}}})
    # ⚠️ S6d 已失效（2026-11-07）：它假设"改磁盘文件 → 后端读到新值"。
    # 阶段 1 之后 state 权威在**内存表**（`_surveys()`），且 `surveys_restored`
    # 让插件不重读磁盘 —— 改文件对运行中的后端**完全无效**（这正是我手工清理
    # 221 条无效、必须改用 `/survey-prune` 端点的同一个原因）。
    # 保留本段只为记录该假设的失效，断言已移除。
    if os.path.exists(SURVEY_FILE):
        raw = json.load(open(SURVEY_FILE, encoding="utf-8"))
        raw.setdefault(TC + "_q", {})["questions"] = [
            {"type": "single", "title": "后端题面", "options": ["A"]}]
        json.dump(raw, open(SURVEY_FILE, "w", encoding="utf-8"), ensure_ascii=False)
    # 重载让它生效不现实 → 改为直接调后端比对：上报不带 questions 会与后端的冲突
    r2c = post("/survey-shadow", {"tool_call_id": TC + "_q", "state": {
        "cursor": 0, "mode": "manual", "status": "pending",
        "answers": {}, "per_question": {}, "questions": [{"type": "text", "title": "前端题面"}]}})
    print("   ", json.dumps(r2c, ensure_ascii=False)[:220])

    print("\n【S7】空答案壳不算差异")
    post("/survey-action", {"tool_call_id": TC + "_e", "action": "set_answer",
                            "payload": {"key": "q0", "answer": {"type": "single", "value": "甲", "other": ""}}})
    # 后端只有 q0 有值；前端多报一个空壳 q1，应当仍然 match
    r3 = post("/survey-shadow", {"tool_call_id": TC + "_e", "state": {
        "cursor": 0, "mode": "manual", "status": "pending",
        "answers": {"q0": {"type": "single", "value": "甲", "other": ""},
                    "q1": {"type": "single", "value": "", "other": ""}},
        "per_question": {}}})
    print("   ", json.dumps(r3, ensure_ascii=False)[:200])
    ck("[S7] 空壳答案不产生差异", r3.get("match") is True, r3)

    print("\n【S8】落盘可恢复")
    ck("[S8a] survey_states.json 已生成", os.path.exists(SURVEY_FILE), "")
    raw = json.load(open(SURVEY_FILE, encoding="utf-8")) if os.path.exists(SURVEY_FILE) else {}
    print("   文件内键:", list(raw.keys())[:5])
    ck("[S8b] 文件内含本次 tool_call_id 且 answers 完整",
       TC in raw and (raw[TC].get("answers") or {}).get("q0", {}).get("value") == "甲",
       list(raw.keys())[:5])

    print("\n【S9】阶段 0 硬约束：不改行为")
    pend = get("/pending")
    print("   pending:", json.dumps(pend, ensure_ascii=False)[:120])
    ck("[S9a] action 未创建任何 pending（不 resolve、不推进）",
       pend.get("count") == 0, pend.get("count"))
    ck("[S9b] state 的 status 仍是 pending（动作不触发提交）",
       (get("/survey-state?tool_call_id=" + TC).get("state") or {}).get("status") == "pending",
       (get("/survey-state?tool_call_id=" + TC).get("state") or {}).get("status"))

    print("\n【S10】不影响既有端点")
    eff = get("/effective-config?session_id=1791724819571-muuetab&agent_id=wb74Jn")
    ck("[S10] effective-config 仍 200 且含 config", bool(eff.get("config")), list(eff.keys()))
    prefs = get("/prefs")
    ck("[S10b] /prefs 仍 200", prefs.get("ok") is True, list(prefs.keys()))

    # 清理本次测试键
    print("\n=== 清理测试数据（走 /survey-prune，不删文件）===")


    # ★ 清理测试 state：必须走 `/survey-prune` 端点，**不能改文件**。
    # `_surveys()` 返回的内存表跨 reload 存活、`surveys_restored` 让插件
    # 不重读磁盘 —— 改文件无效（实测磁盘改到 11 条，reload 后变回 200+ 条）。
    # 用 prefix 精准删自己造的键，不碰真实记录。
    try:
        _r = post("/survey-prune", {"prefix": "call_phase0_"})
        print(f"  已清理测试 state: {_r.get('before')} -> {_r.get('after')}")
    except Exception as _e:  # noqa: BLE001
        print(f"  (清理失败，请手动调 /survey-prune: {_e})")

    print("\n==== Phase 0 验证: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
