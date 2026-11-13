# -*- coding: utf-8 -*-
"""2.4.1 全部功能逐项实测（不依赖模型配额，全部真实调用真实模块）。

覆盖：
  A1 后端权威 state     A2 SSE 广播        A3 apply_action 裁决
  A4 recommend 推进     A6 看门狗          A7 跨实例共享
  B2 submitted_by       B7 __other__ 哨兵  B8a infer_qtype  B8b 推荐别名
  C  requires_human     D1 摘要渲染        D2 题干兜底
"""
import asyncio, json, os, sys, time, uuid, logging

os.environ["QM_SURVEY_STATE_FILE"] = "/tmp/qm_verify241_states.json"
logging.basicConfig(level=logging.CRITICAL)  # 静音，只看断言
sys.path.insert(0, "/app/working/plugins/question-modal")
try:
    os.remove("/tmp/qm_verify241_states.json")
except OSError:
    pass

import question_service as qs
import recommend as rc
import analysis as an

ok = fail = 0
def ck(name, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS  {name}")
    else: fail += 1; print(f"  FAIL  {name}  {str(extra)[:150]}")

QS = [
    {"type": "single", "title": "Q1 单选", "options": ["甲", "乙", "丙"], "recommended": "乙"},
    {"type": "multi", "title": "Q2 多选", "options": ["A", "B", "C"], "recommended": ["A", "C"]},
    {"type": "text", "title": "Q3 问答"},
]


async def main():
    svc = qs.QuestionService()

    print("\n[A1] 后端权威 state：create 即建基线，字段齐全")
    t1 = "a1-" + uuid.uuid4().hex[:6]
    await svc.create(request_id="r-a1", session_id="s-a1", agent_id="wb74Jn",
                     title="A1", questions=QS, mode="recommend", tool_call_id=t1)
    st = svc.get_survey(t1)
    ck("create 后 state 存在", st is not None)
    ck("初始 status=pending", st and st.status == "pending", st and st.status)
    ck("初始 cursor=0", st and st.cursor == 0, st and st.cursor)
    ck("mode 落到后端", st and st.mode == "recommend", st and st.mode)
    ck("有 rev 字段", st is not None and hasattr(st, "rev"))
    ck("有 progress_at", st and bool(st.progress_at))
    ck("有 submitted_by 字段", st is not None and hasattr(st, "submitted_by"))
    ck("有 released 字段（阶段1修的幂等判据）", st is not None and hasattr(st, "released"))
    ck("questions 完整保留", st and len(st.questions) == 3, st and len(st.questions or []))

    print("\n[A3] apply_action 裁决（后端是唯一真相）")
    # 手动作答 → 应记入后端 state 并 bump rev（同步方法）
    rev0 = st.rev
    svc.apply_action(t1, "set_answer", {"key": "q0", "answer": {"type": "single", "value": "甲"}})
    st = svc.get_survey(t1)
    ck("set_answer 写入后端 answers", (st.answers or {}).get("q0", {}).get("value") == "甲",
       st.answers)
    ck("set_answer 触发 rev 递增", st.rev > rev0, f"{rev0}->{st.rev}")
    # goto（注意：payload 字段名是 cursor，不是 index）
    svc.apply_action(t1, "goto", {"cursor": 2})
    st = svc.get_survey(t1)
    ck("goto 改后端 cursor", st.cursor == 2, st.cursor)
    # set_mode
    svc.apply_action(t1, "set_mode", {"mode": "manual"})
    st = svc.get_survey(t1)
    ck("set_mode 改后端 mode", st.mode == "manual", st.mode)

    print("\n[A6] 看门狗：manual 必须不超时，ai/recommend 才计时")
    await asyncio.sleep(0.3)
    st = svc.get_survey(t1)
    ck("manual 模式不会被动超时释放", st.status == "pending" and not st.watchdog_reason,
       f"status={st.status} reason={st.watchdog_reason!r}")

    print("\n[A4] recommend 推进：连跑 3 份，全部自主完成")
    for i in (1, 2, 3):
        tag = f"a4-{i}-" + uuid.uuid4().hex[:5]
        await svc.create(request_id=f"r-a4{i}", session_id=f"s-a4{i}", agent_id="wb74Jn",
                         title=f"A4#{i}", questions=QS, mode="recommend", tool_call_id=tag)
        svc._prune_stale_runners()
        svc._sync_runners(tag)
        t0 = time.time()
        s = None
        for _ in range(60):
            await asyncio.sleep(0.2)
            s = svc.get_survey(tag)
            if s and s.status != "pending": break
        el = time.time() - t0
        ans = {k: (v.get("value") if isinstance(v, dict) else v) for k, v in (s.answers or {}).items()}
        ck(f"[A4#{i}] 自动走完并提交 ( {el:.2f}s )", s.status == "submitted", s.status)
        ck(f"[A4#{i}] submitted_by=backend", s.submitted_by == "backend", s.submitted_by)
        ck(f"[A4#{i}] 单选题填推荐值 乙", ans.get("q0") == "乙", ans.get("q0"))
        ck(f"[A4#{i}] 多选题填推荐组合", ans.get("q1") == ["A", "C"], ans.get("q1"))
        ck(f"[A4#{i}] 看门狗未介入", not s.watchdog_reason, s.watchdog_reason)
        ck(f"[A4#{i}] cursor 走到底", s.cursor == 3, s.cursor)
        ck(f"[A4#{i}] rev = 题数+提交", s.rev >= 4, s.rev)

    print("\n[A2] SSE 广播：订阅者能收到逐题事件")
    tag = "a2-" + uuid.uuid4().hex[:5]
    await svc.create(request_id="r-a2", session_id="s-a2", agent_id="wb74Jn",
                     title="A2", questions=QS[:2], mode="recommend", tool_call_id=tag)
    q, replay = svc.subscribe(tag)
    ck("订阅返回 queue", q is not None)
    ck("订阅有重放 buffer（刷新即全量）", isinstance(replay, list), type(replay))
    svc._sync_runners(tag)
    frames = list(replay)
    deadline = time.time() + 8
    while time.time() < deadline:
        try:
            frames.append(await asyncio.wait_for(q.get(), timeout=0.3))
        except asyncio.TimeoutError:
            s = svc.get_survey(tag)
            if s and s.status != "pending": break
    ck("收到广播帧 > 0", len(frames) > 0, len(frames))
    if frames:
        txt = json.dumps(frames, ensure_ascii=False, default=str)
        ck("广播含推进事件（fill/submit/rev）",
           any(k in txt for k in ("fill", "submit", "rev", "answers")), txt[:160])
    try: svc.unsubscribe(tag, q)
    except Exception: pass

    print("\n[A7] 跨实例共享：新实例能看见旧实例创建的 state")
    svc2 = qs.QuestionService()
    same = svc2.get_survey(tag)
    ck("新实例读到同一 state", same is not None and same.tool_call_id == tag)

    print("\n[B7] __other__ 哨兵：可读块必须剔除")
    import ast as _ast
    src = open("/app/working/plugins/question-modal/plugin.py", encoding="utf-8").read()
    tree = _ast.parse(src)
    def _seg(n):
        for x in _ast.walk(tree):
            if isinstance(x, _ast.FunctionDef) and x.name == n:
                return _ast.get_source_segment(src, x)
    ns = {"json": json}
    import typing
    ns.update({"Any": typing.Any, "Optional": typing.Optional})
    import re as _re
    m = _re.search(r'^_TYPE_LABELS = \{.*?\}$', src, _re.M)
    exec(m.group(0), ns)
    exec(_seg("_sanitize_sentinel"), ns)   # D7 修复后 _format_answer_for_llm 依赖它
    exec(_seg("_fmt_attachments"), ns)
    exec(_seg("_format_answer_for_llm"), ns)
    fmt = ns["_format_answer_for_llm"]
    out = fmt({"answers": {"q0": {"type": "single", "value": "__other__", "other": "自己写的"}}})
    readable = "\n".join(l for l in out.splitlines() if l.startswith("- q0"))
    ck("可读块的 value 已剔除哨兵", "__other__" not in readable, readable)
    ck("可读块保留了 other 真实内容", "自己写的" in readable, readable)
    raw = [l for l in out.splitlines() if l.strip().startswith("{")]
    # 2026-11-07 修复后：raw JSON 也必须干净（此前这里断言的正是缺陷本身）
    ck("raw JSON 也已剔除哨兵（D7 完整修复）", raw and "__other__" not in raw[0],
       raw[0] if raw else "无 raw 行")
    ck("整段返回文本零哨兵", "__other__" not in out, out[-140:])

    print("\n[B8a] infer_qtype：无 type 也必须正确推断")
    ck("有 options 无 type → single", an.infer_qtype({"title": "t", "options": ["a", "b"]}) == "single")
    ck("multiple=True → multi", an.infer_qtype({"title": "t", "options": ["a"], "multiple": True}) == "multi")
    ck("无 options → text", an.infer_qtype({"title": "t"}) == "text")
    ck("空 options → text", an.infer_qtype({"title": "t", "options": []}) == "text")

    print("\n[B8b] 推荐来源：官方字段与别名都要认")
    ck("recommended 字符串", rc.question_recommended({"options": ["甲", "乙"], "recommended": "乙"}) == ["乙"])
    ck("ai_recommended 别名", rc.question_recommended({"options": ["甲", "乙"], "ai_recommended": "乙"}) == ["乙"])
    ck("recommended 数组", rc.question_recommended({"options": ["甲", "乙"], "recommended": ["甲", "乙"]}) == ["甲", "乙"])
    ck("无推荐 → 空", rc.question_recommended({"options": ["甲", "乙"]}) == [])

    print("\n[C] requires_human：观察题必跳，判断题必不跳")
    should = [
        ("显式 requires_human", {"title": "x", "requires_human": True}),
        ("显式 human_only", {"title": "x", "human_only": True}),
        ("显式 observer_only", {"title": "x", "observer_only": True}),
        ("你看到", {"title": "你看到徽章了吗？"}),
        ("您观察到", {"title": "您观察到倒计时几秒？"}),
        ("屏幕上显示", {"title": "屏幕上显示的是什么？"}),
        ("肉眼", {"title": "肉眼能分辨吗？"}),
        ("凭观察", {"title": "凭你的观察顺序对吗？"}),
    ]
    shouldnt = [
        ("觉得", {"title": "你觉得可行吗？"}),
        ("认为", {"title": "你认为哪个更好？"}),
        ("建议", {"title": "你建议先做哪步？"}),
        ("偏好", {"title": "你偏好哪种？"}),
        ("要不要", {"title": "要不要推送？"}),
        ("选哪", {"title": "选哪个模型？"}),
        ("是否同意", {"title": "你是否同意？"}),
        ("普通确认", {"title": "是否只碰插件目录？"}),
        ("复合句看到+觉得", {"title": "你看到按钮了吗，觉得要不要改？"}),
    ]
    for n, q in should:
        ck(f"应跳: {n}", rc.requires_human(q) is True, rc.requires_human(q))
    for n, q in shouldnt:
        ck(f"不跳: {n}", rc.requires_human(q) is False, rc.requires_human(q))

    print("\n[C2] 观察题在 recommend 推进中真的被跳过并标注")
    tag = "c2-" + uuid.uuid4().hex[:5]
    qs_obs = [
        {"type": "single", "title": "你看到徽章标在哪一项？", "options": ["甲", "乙"], "recommended": "甲"},
        {"type": "single", "title": "下一步做什么？", "options": ["甲", "乙"], "recommended": "乙"},
    ]
    await svc.create(request_id="r-c2", session_id="s-c2", agent_id="wb74Jn",
                     title="C2", questions=qs_obs, mode="recommend", tool_call_id=tag)
    svc._prune_stale_runners(); svc._sync_runners(tag)
    s = None
    for _ in range(60):
        await asyncio.sleep(0.15)
        s = svc.get_survey(tag)
        if s and s.status != "pending": break
    a0 = (s.answers or {}).get("q0") or {}
    a1 = (s.answers or {}).get("q1") or {}
    ck("观察题被跳过(skipped_by=requires_human)", a0.get("skipped_by") == "requires_human", a0)
    ck("观察题没有采纳推荐值 甲", a0.get("value") != "甲", a0.get("value"))
    ck("判断题正常采纳推荐 乙", a1.get("value") == "乙", a1.get("value"))
    ck("整卷仍能提交", s.status == "submitted", s.status)

    print("\n[D1] 摘要渲染：对象化 option 不能崩（_opt_text 防御）")
    ns2 = dict(ns)
    exec(_seg("_opt_text"), ns2)
    opt = ns2["_opt_text"]
    ck("字符串原样", opt("甲") == "甲")
    ck("对象取 label", opt({"label": "标签甲", "value": "v1"}) == "标签甲")
    ck("对象取 value 兜底", opt({"value": "v2"}) == "v2")

    print("\n[D2] 摘要：缺题干必须兜底成「第 N 题」")
    exec(_seg("_legacy_rec_list"), ns2)
    exec(_seg("_build_summary"), ns2)
    bs = ns2["_build_summary"]
    summ = bs("", [{"type": "single", "options": ["甲", "乙"]}])
    ck("摘要不崩且含兜底标题", isinstance(summ, str) and len(summ) > 0, summ[:80])
    # 注：气泡摘要的兜底是 Q1（不是「第 1 题」——后者是前端卡片的兜底）
    ck("气泡摘要兜底为 Q1", "Q1" in summ, summ[:100])
    # 正常题干照常显示
    summ2 = bs("", [{"type": "single", "title": "真题干", "options": ["甲"]}])
    ck("有题干时用题干", "真题干" in summ2, summ2[:100])
    # 带推荐要显示 ⟨推荐：X⟩
    summ3 = bs("", [{"type": "single", "title": "t", "options": ["甲", "乙"], "recommended": "乙"}])
    ck("摘要标出推荐项", "推荐" in summ3 and "乙" in summ3, summ3[:120])

    print("\n[A5] ai 推进：用 stub 模型验证 429 也能走完（不烧真实配额）")
    import analysis as _an
    orig = _an.analyze_survey
    async def stub_429(**kw):
        return {"ok": False, "error": "429 stub", "per_question": []}
    _an.analyze_survey = stub_429
    try:
        tag = "a5-" + uuid.uuid4().hex[:5]
        await svc.create(request_id="r-a5", session_id="s-a5", agent_id="wb74Jn",
                         title="A5", questions=QS[:1], mode="ai", tool_call_id=tag,
                         prefs={"model_id": "stub"})
        svc._prune_stale_runners(); svc._sync_runners(tag)
        s = None
        for _ in range(80):
            await asyncio.sleep(0.15)
            s = svc.get_survey(tag)
            if s and s.status != "pending": break
        a0 = (s.answers or {}).get("q0") or {}
        ck("ai 模式 429 仍能走完整卷", s.status == "submitted", s.status)
        ck("429 时标 ai_failed 而非卡死", a0.get("skipped_by") == "ai_failed", a0)
        ck("429 时不靠看门狗兜底", not s.watchdog_reason, s.watchdog_reason)
    finally:
        _an.analyze_survey = orig

    print(f"\n{'='*56}\n结果: {ok} 通过 / {fail} 失败\n{'='*56}")
    return 0 if fail == 0 else 1


sys.exit(asyncio.run(main()))
