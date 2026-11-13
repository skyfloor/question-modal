"""差分测试：后端 recommend.py 与前端同款算法必须逐条等价。

为什么这是本轮最关键的测试：
前端的 9 个纯函数是 20+ 轮真机踩坑沉淀的（showIf 级联、`=精确`、子串双向、
value↔label、推荐前缀、markdown 包裹、别名、按真实题号取缓存）。
后端要接管 recommend 的推进权，**任何一处不等价 → 填错答案或提前提交**，
而且比"不推进"难查得多。

做法：把前端的算法在 Python 里**逐字复刻**（下方 `fe_*` 函数，一行一行对照
`src/index.tsx` 的对应函数），然后用同一批输入分别喂两边，比对输出。
复刻的依据是源码，不是我的理解 —— 每个函数都标了行号。
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, "/app/working/plugins/question-modal")
import recommend as be  # noqa: E402

PASS = FAIL = 0
FAILS = []


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  ❌ {name} {detail}")


# ══════════════════════════════════════════════════════════════
# 前端算法复刻（逐行对照 src/index.tsx，行号即出处）
# ══════════════════════════════════════════════════════════════
import re  # noqa: E402

OTHER = "__other__"


def fe_qType(q):                                    # :1339
    declared = (q or {}).get("type")
    if declared in ("single", "multi", "text"):
        return declared
    if q and (q.get("options") or []):
        return "multi" if q.get("multiple") is True else "single"
    return "text"


def fe_optValue(o):                                 # :1187
    if isinstance(o, dict):
        v = o.get("value")
        return str(v if v is not None else (o.get("label") or ""))
    return str(o)


def fe_optLabel(o):                                 # :1374
    if isinstance(o, dict):
        v = o.get("label")
        return str(v if v is not None else (o.get("value") or ""))
    return str(o)


def fe_chosenTokens(q, ans):                        # :1380
    out = set()

    def add(x):
        if x is not None and x != "":
            out.add(str(x))

    optList = q.get("options") or []
    if fe_qType(q) == "multi":
        vals = ans.get("value") if isinstance(ans.get("value"), list) else []
        for v in vals:
            add(v)
            hit = next((o for o in optList if fe_optValue(o) == str(v)), None)
            if hit is not None:
                add(fe_optLabel(hit))
            if str(v) == OTHER and ans.get("other"):
                add(ans.get("other"))
    else:
        add(ans.get("value"))
        hit = next((o for o in optList if fe_optValue(o) == str(ans.get("value"))), None)
        if hit is not None:
            add(fe_optLabel(hit))
        if str(ans.get("value")) == OTHER and ans.get("other"):
            add(ans.get("other"))
    return out


def fe_evalCondition(cond, tokens):                 # :1402
    wanted = cond if isinstance(cond, list) else [cond]
    for w in wanted:
        s = str(w)
        if s.startswith("="):
            if s[1:] in tokens:
                return True
            continue
        if s in tokens:
            return True
        for t in tokens:
            if t and (s in t or t in s):
                return True
    return False


def fe_resolveKey(key, questions):                  # :1421
    m = re.match(r"^q(\d+)$", str(key).strip(), re.I)
    if m:
        i = int(m.group(1))
        if 0 <= i < len(questions):
            return i
    for i, q in enumerate(questions):
        if str(q.get("title") or "").strip() == str(key).strip():
            return i
    return -1


def fe_isVisible(idx, questions, answers, depth=0):  # :1432
    if depth > 32:
        return True
    q = questions[idx]
    cond = q.get("showIf")
    if not isinstance(cond, dict) or not cond:
        return True
    for key, want in cond.items():
        ref = fe_resolveKey(key, questions)
        if ref < 0:
            continue
        rq = questions[ref]
        if rq.get("showIf") and not fe_isVisible(ref, questions, answers, depth + 1):
            return False
        ansRef = answers.get(f"q{ref}")
        if not ansRef:
            return False
        if not fe_evalCondition(want, fe_chosenTokens(rq, ansRef)):
            return False
    return True


def fe_visibleIndices(questions, answers):          # :1455
    return [i for i in range(len(questions)) if fe_isVisible(i, questions, answers)]


def fe_questionRecommended(q):                      # :1255
    if not isinstance(q, dict):
        return []
    raw = q["recommended"] if q.get("recommended") is not None else q.get("ai_recommended")
    if raw is None:
        return []
    lst = raw if isinstance(raw, list) else [raw]
    return [str("" if x is None else x).strip() for x in lst
            if str("" if x is None else x).strip()]


def fe_choiceForQuestion(envelope, realIdx):        # :1284
    if not isinstance(envelope, dict):
        return ""
    per = envelope.get("per_question")
    if not isinstance(per, list) or not per:
        return ""
    mine = None
    for p in per:
        try:
            if int(p.get("index")) == int(realIdx):
                mine = p
                break
        except (TypeError, ValueError):
            continue
    if mine is None and len(per) == 1:
        mine = per[0]
    if mine is None:
        return ""
    c = mine.get("choice")
    return str("" if c is None else c).strip()


def fe_filledAnswer(a):                             # :1198
    if not a:
        return False
    if a.get("skipped") is True:
        return True
    if isinstance(a.get("value"), list):
        return len(a["value"]) > 0
    if str(a.get("value") or "").strip():
        return True
    if str(a.get("other") or "").strip():
        return True
    if a.get("attachments"):
        return True
    return False


# ══════════════════════════════════════════════════════════════
# 测试用例
# ══════════════════════════════════════════════════════════════

CASES_VISIBLE = [
    ("无 showIf 全部可见", [
        {"type": "single", "title": "A", "options": ["甲", "乙"]},
        {"type": "text", "title": "B"},
    ], {}, [0, 1]),
    ("showIf 未答 → 隐藏", [
        {"type": "single", "title": "A", "options": ["甲", "乙"]},
        {"title": "B", "options": ["是", "否"], "showIf": {"q0": "乙"}},
    ], {}, [0]),
    ("showIf 命中 → 可见", [
        {"type": "single", "title": "A", "options": ["甲", "乙"]},
        {"title": "B", "options": ["是", "否"], "showIf": {"q0": "乙"}},
    ], {"q0": {"type": "single", "value": "乙"}}, [0, 1]),
    ("showIf 未命中 → 隐藏", [
        {"type": "single", "title": "A", "options": ["甲", "乙"]},
        {"title": "B", "options": ["是", "否"], "showIf": {"q0": "乙"}},
    ], {"q0": {"type": "single", "value": "甲"}}, [0]),
    ("showIf 用题干当键", [
        {"type": "single", "title": "要开工吗", "options": ["是", "否"]},
        {"title": "B", "options": ["x"], "showIf": {"要开工吗": "是"}},
    ], {"q0": {"type": "single", "value": "是"}}, [0, 1]),
    ("showIf 精确 =", [
        {"type": "single", "title": "A", "options": ["开工", "开工但不推送"]},
        {"title": "B", "options": ["x"], "showIf": {"q0": "=开工"}},
    ], {"q0": {"type": "single", "value": "开工但不推送"}}, [0]),
    ("showIf 子串容错", [
        {"type": "single", "title": "A", "options": ["先做后端逻辑再加前端"]},
        {"title": "B", "options": ["x"], "showIf": {"q0": "先做后端"}},
    ], {"q0": {"type": "single", "value": "先做后端逻辑再加前端"}}, [0, 1]),
    ("showIf 数组 OR", [
        {"type": "single", "title": "A", "options": ["甲", "乙", "丙"]},
        {"title": "B", "options": ["x"], "showIf": {"q0": ["甲", "丙"]}},
    ], {"q0": {"type": "single", "value": "丙"}}, [0, 1]),
    ("隐藏级联：L1 关 ⇒ L2 藏 ⇒ L3 藏", [
        {"type": "single", "title": "L1", "options": ["关", "开"]},
        {"type": "single", "title": "L2", "options": ["是", "否"], "showIf": {"q0": "开"}},
        {"type": "single", "title": "L3", "options": ["好"], "showIf": {"q1": "是"}},
    ], {"q0": {"type": "single", "value": "关"}}, [0]),
    ("隐藏级联：L1 开 ⇒ 全可见", [
        {"type": "single", "title": "L1", "options": ["关", "开"]},
        {"type": "single", "title": "L2", "options": ["是", "否"], "showIf": {"q0": "开"}},
        {"type": "single", "title": "L3", "options": ["好"], "showIf": {"q1": "是"}},
    ], {"q0": {"type": "single", "value": "开"},
        "q1": {"type": "single", "value": "是"}}, [0, 1, 2]),
    ("多选 value↔label 双向", [
        {"type": "multi", "title": "A", "options": [{"label": "甲项", "value": "a"}]},
        {"title": "B", "options": ["x"], "showIf": {"q0": "甲项"}},
    ], {"q0": {"type": "multi", "value": ["a"]}}, [0, 1]),
    ("隐藏后重算（先答后改）", [
        {"type": "single", "title": "A", "options": ["甲", "乙"]},
        {"title": "B", "options": ["是"], "showIf": {"q0": "乙"}},
    ], {"q0": {"type": "single", "value": "甲"}, "q1": {"value": "是"}}, [0]),
]

CASES_RECOMMENDED = [
    ("无 recommended", {"title": "x"}, []),
    ("字符串", {"recommended": "乙"}, ["乙"]),
    ("数组", {"recommended": ["甲", "丙"]}, ["甲", "丙"]),
    ("别名 ai_recommended", {"ai_recommended": "乙"}, ["乙"]),
    ("空串过滤", {"recommended": ["", " 乙 "]}, ["乙"]),
    ("recommended 优先于别名", {"recommended": "甲", "ai_recommended": "乙"}, ["甲"]),
]

CASES_CHOICE = [
    ("按真实题号取值（防串题）",
     {"per_question": [{"index": 0, "choice": "乙"}, {"index": 2, "choice": "丙"}]}, 2, "丙"),
    ("只返回一题时允许取", {"per_question": [{"index": 7, "choice": "丁"}]}, 0, "丁"),
    ("多题且无匹配 → 空（绝不填错）",
     {"per_question": [{"index": 0, "choice": "乙"}, {"index": 1, "choice": "丙"}]}, 5, ""),
    ("空 envelope", {}, 0, ""),
    ("choice 为 None", {"per_question": [{"index": 0, "choice": None}]}, 0, ""),
]


def main():
    print("[1] visibleIndices 差分（前端 vs 后端）")
    for name, qs, ans, want in CASES_VISIBLE:
        a = fe_visibleIndices(qs, ans)
        b = be.visible_indices(qs, ans)
        ck(f"{name}",
           a == b == want, f"前端={a} 后端={b} 期望={want}")

    print("\n[2] questionRecommended 差分")
    for name, q, want in CASES_RECOMMENDED:
        a = fe_questionRecommended(q)
        b = be.question_recommended(q)
        ck(name, a == b == want, f"前端={a} 后端={b} 期望={want}")

    print("\n[3] choiceForQuestion 差分（防串题）")
    for name, env, idx, want in CASES_CHOICE:
        a = fe_choiceForQuestion(env, idx)
        b = be.choice_for_question(env, idx)
        ck(name, a == b == want, f"前端={a} 后端={b} 期望={want}")

    print("\n[4] qType / filledAnswer 差分")
    for q in [{"type": "single"}, {"options": ["a"]}, {"options": ["a"], "multiple": True},
              {"type": "text"}, {}, None]:
        ck(f"qType({json.dumps(q, ensure_ascii=False)})",
           fe_qType(q) == be.q_type(q), f"{fe_qType(q)} vs {be.q_type(q)}")
    for a in [None, {}, {"value": ""}, {"value": "x"}, {"value": []},
              {"value": ["a"]}, {"skipped": True}, {"other": "备注"},
              {"attachments": [{}]}]:
        ck(f"filledAnswer({json.dumps(a, ensure_ascii=False)})",
           fe_filledAnswer(a) == be.filled_answer(a),
           f"{fe_filledAnswer(a)} vs {be.filled_answer(a)}")

    print("\n[5] step_once：单选归一化")
    qs = [{"type": "single", "title": "A",
           "options": [{"label": "甲项", "value": "a"}, "乙"],
           "recommended": "甲项"}]
    r = be.step_once({"questions": qs, "answers": {}, "cursor": 0})
    ck("label 推荐归一化到 value",
       r["answer"]["value"] == "a", r["answer"])

    print("\n[6] step_once：推荐带「推荐 · 」前缀")
    qs = [{"type": "single", "title": "A", "options": ["甲", "乙"],
           "recommended": "推荐 · 乙"}]
    r = be.step_once({"questions": qs, "answers": {}, "cursor": 0})
    ck("前缀被清洗后仍匹配到选项",
       r["answer"]["value"] == "乙", r["answer"])

    print("\n[7] step_once：多选拆分")
    qs = [{"type": "multi", "title": "A", "options": ["甲", "乙", "丙"],
           "recommended": ["甲", "丙"]}]
    r = be.step_once({"questions": qs, "answers": {}, "cursor": 0})
    ck("多选拆成列表",
       r["answer"]["value"] == ["甲", "丙"], r["answer"])

    print("\n[8] step_once：无推荐 → 跳过而非卡住")
    qs = [{"type": "single", "title": "A", "options": ["甲", "乙"]}]
    r = be.step_once({"questions": qs, "answers": {}, "cursor": 0})
    ck("标记 skipped_by=no_recommend",
       r["answer"].get("skipped") is True
       and r["answer"].get("skipped_by") == "no_recommend", r["answer"])
    ck("游标仍前进（不卡整卷）", r["cursor"] == 1, r["cursor"])

    print("\n[9] step_once：已有答案不覆盖（用户手答优先）")
    qs = [{"type": "single", "title": "A", "options": ["甲", "乙"],
           "recommended": "乙"}]
    r = be.step_once({"questions": qs,
                      "answers": {"q0": {"type": "single", "value": "甲"}},
                      "cursor": 0})
    ck("不覆盖用户已答的「甲」",
       r.get("answer") is None and r.get("already") is True, r)
    ck("游标仍前进", r["cursor"] == 1, r["cursor"])

    print("\n[10] step_once：走完 → done")
    qs = [{"type": "single", "title": "A", "options": ["甲"], "recommended": "甲"}]
    r = be.step_once({"questions": qs,
                      "answers": {"q0": {"type": "single", "value": "甲"}},
                      "cursor": 1})
    ck("done=True", r.get("done") is True, r)

    print("\n[11] step_once：用缓存（per_question）而非推荐")
    qs = [{"type": "single", "title": "A", "options": ["甲", "乙"]}]
    r = be.step_once({"questions": qs, "answers": {}, "cursor": 0,
                      "per_question": {"0": {"choice": "乙"}}})
    ck("缓存 choice 被采用", r["answer"]["value"] == "乙", r["answer"])

    print("\n[12] prune_hidden：隐藏题答案被清除")
    qs = [{"type": "single", "title": "A", "options": ["甲", "乙"]},
          {"title": "B", "options": ["是"], "showIf": {"q0": "乙"}}]
    ans = {"q0": {"type": "single", "value": "甲"}, "q1": {"type": "single", "value": "是"}}
    out = be.prune_hidden(qs, ans)
    ck("q1 被删除（已不可见）", "q1" not in out, out)
    ck("q0 保留", out.get("q0", {}).get("value") == "甲", out)

    print(f"\n{'='*54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  ❌", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
