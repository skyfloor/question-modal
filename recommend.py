"""recommend 模式的后端推进引擎（阶段 2）。

## 为什么需要这个文件

阶段 1 把「state 权威」搬到了后端（answers / cursor / mode 单一副本），
但**推进动作仍由前端 React effect 发出** —— 页面一关，没人发 action，
问卷就停在那里。用户的核心诉求是「关掉会话窗口，它应该继续推进」。

阶段 2 把 recommend 模式的推进决策搬到后端循环：后端自己算「下一题该填什么」，
填完广播，页面关着也照样走完。

## 与前端的关系（用户裁定 2026-11-07）

- recommend 模式下**前端驱动自动让位**，只渲染后端的推送
- 只有 SSE 断开（backendDown）时前端才退回本地驱动，保持今天的可用性

## 为什么这些函数是「逐条对齐」而不是「重新设计」

前端的这 9 个纯函数是 20+ 轮真机踩坑沉淀下来的：
`showIf` 隐藏级联、`=精确` 匹配、子串双向容错、value↔label 双向映射、
`推荐 · 乙` 前缀清洗、markdown 包裹、`ai_recommended` 别名、按真实题号取缓存……
**任何一处不等价，后端就会填错答案或提前提交**，而这比"不推进"难查得多。

所以本文件的每个函数都在 docstring 里写明它对应前端哪个函数、为什么这样写，
并有 `verify_recommend_parity.py` 做同输入同输出的差分测试。
"""
from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

# 「其他」选项的哨兵值，与前端 `const OTHER = "__other__"` 一致。
OTHER = "__other__"

_CHOICE_TYPES = {"single", "multi", "text"}


# ══════════════════════════════════════════════════════════════
# 基础取值
# ══════════════════════════════════════════════════════════════

def q_type(question: dict | None) -> str:
    """题型，容错缺失的 `type`。

    对齐前端 `qType()`（src/index.tsx:1339）与 `analysis.infer_qtype()`：
    模型经常省略 `type`（schema 里可选）却给了 `options`。三者必须同一规则，
    否则「渲染是单选、推进按问答处理」这类错位会静默发生。
    """
    if not question:
        return "text"
    declared = question.get("type")
    if isinstance(declared, str) and declared.strip().lower() in _CHOICE_TYPES:
        return declared.strip().lower()
    if question.get("options"):
        return "multi" if question.get("multiple") is True else "single"
    return "text"


def opt_value(o: Any) -> str:
    """选项的「值」。对齐前端 `optValue()`。"""
    if isinstance(o, dict):
        v = o.get("value")
        return str(v if v is not None else (o.get("label") or ""))
    return str(o)


def opt_label(o: Any) -> str:
    """选项的「显示文本」。对齐前端 `optLabel()`。"""
    if isinstance(o, dict):
        v = o.get("label")
        return str(v if v is not None else (o.get("value") or ""))
    return str(o)


def _strip_rec_prefix(s: str) -> str:
    """去掉「推荐 · 乙」这类前缀。对齐前端 isRecommendedOption 的 canon()。"""
    return re.sub(r"^\s*推荐\s*[·:：\-]\s*", "", str(s or ""))


def _canon(s: str) -> str:
    """规范化用于比较的文本：去推荐前缀、去 markdown 强调与引号。"""
    s = _strip_rec_prefix(s)
    return re.sub(r"[*_`\"'\u300c\u300d\u300e\u300f]", "", s)


def chosen_tokens(question: dict, ans: dict) -> set[str]:
    """一题已选的 token 集合（value + label + other）。

    对齐前端 `chosenTokens()`（src/index.tsx:1380）。
    **必须同时放 value 和 label**：模型写 showIf 条件时可能用任一种，
    只放一种会让条件恒假、整条分支被静默隐藏。
    """
    out: set[str] = set()

    def add(x: Any) -> None:
        if x is not None and x != "":
            out.add(str(x))

    opts = question.get("options") or []
    vals = ans.get("value")
    if q_type(question) == "multi":
        for v in (vals if isinstance(vals, list) else []):
            add(v)
            for o in opts:
                if opt_value(o) == str(v):
                    add(opt_label(o))
                    break
            if str(v) == OTHER and ans.get("other"):
                add(ans.get("other"))
    else:
        add(vals)
        for o in opts:
            if opt_value(o) == str(vals):
                add(opt_label(o))
                break
        if str(vals) == OTHER and ans.get("other"):
            add(ans.get("other"))
    return out


def _eval_condition(cond: Any, tokens: set[str]) -> bool:
    """showIf 单个键的条件求值。对齐前端 `evalCondition()`（1402）。

    规则（三条都必须有，缺一个就有真实问卷判错）：
      • `=x`  → **精确**匹配（模型用它表达"必须正好是 x"，防止子串误命中）
      • `x`   → token 里存在即真
      • 否则  → **双向子串**容错（模型常写长选项的前半句当条件）
    多个值之间是 OR。
    """
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


def _resolve_key(key: str, questions: list[dict]) -> int:
    """showIf 的键 → 题号。对齐前端 `resolveKey()`（1421）。

    支持 `"q2"`（题号）与题干原文（模型两种都写）。
    """
    m = re.match(r"^q(\d+)$", str(key).strip(), re.I)
    if m:
        i = int(m.group(1))
        if 0 <= i < len(questions):
            return i
    target = str(key).strip()
    for i, q in enumerate(questions):
        if str(q.get("title") or "").strip() == target:
            return i
    return -1


def is_visible(
    idx: int, questions: list[dict], answers: dict, _depth: int = 0,
) -> bool:
    """该题当前是否可见。对齐前端 `isVisible()`（1432）。

    ★ 必须支持**隐藏级联**（前端注释里点明的那条）：
      前置题自己也被隐藏 → 它从没被呈现给用户 → 它的条件永远不成立
      → 依赖它的题也必须隐藏（L1 关 ⇒ L2 藏 ⇒ L3 藏）。
      漏了这条，后端会给一道用户根本看不到的题填答案。
    """
    if _depth > 32:          # 条件成环时保底，绝不递归到栈溢出
        return True
    if not (0 <= idx < len(questions)):
        return False
    q = questions[idx]
    cond = q.get("showIf")
    if not isinstance(cond, dict) or not cond:
        return True
    for key, want in cond.items():
        ref = _resolve_key(key, questions)
        if ref < 0:
            continue                       # 引用不明 → 不隐藏（与前端一致）
        rq = questions[ref]
        if rq.get("showIf") and not is_visible(ref, questions, answers, _depth + 1):
            return False                   # 级联隐藏
        ans_ref = answers.get(f"q{ref}")
        if not ans_ref:
            return False                   # 未作答 → 条件不成立
        if not _eval_condition(want, chosen_tokens(rq, ans_ref)):
            return False
    return True


def visible_indices(questions: list[dict], answers: dict) -> list[int]:
    """当前可见题的真实题号列表。对齐前端 `visibleIndices()`（1455）。"""
    return [i for i in range(len(questions)) if is_visible(i, questions, answers)]


def question_recommended(q: Any) -> list[str]:
    """模型出题时标注的推荐。对齐前端 `questionRecommended()`（1255）。

    容忍 `ai_recommended` 别名（早期版本用过这个名字）。
    """
    if not isinstance(q, dict):
        return []
    raw = q.get("recommended")
    if raw is None:
        raw = q.get("ai_recommended")
    if raw is None:
        return []
    items = raw if isinstance(raw, (list, tuple)) else [raw]
    out: list[str] = []
    for x in items:
        s = str("" if x is None else x).strip()
        if s:
            out.append(s)
    return out


# ── D4（2026-11-07 用户裁定）：观察题在自动模式下跳过 ──────────────
#
# ## 为什么需要它
#
# ai / recommend 两种自动模式产出的答案都源自**模型**。对「你看到了什么」这类
# 只有真人能回答的观察题，模型只能凭题面猜 —— 实测证据（自检 #1 推理原文）：
#     "当前缺乏具体上下文信息，倾向选择最常见、最理想的表现"
#     "置信度 0.4（因缺乏实际观察信息，谨慎取值）"
# 更严重的是自检 #3：同一道徽章题，AI 答「徽章出现在 B 项」，
# 而用户亲手作答是「在选项 A 左侧」、另一道未标推荐的题用户答「根本没出现」
# —— **AI 编造了一个具体但错误的观察**。
#
# 编造比留空有害得多：留空至少看得出"这题没人答"，编造会让后续所有决策
# 建立在假事实上。
#
# ## 用户裁定（2026-11-07，四项）
#   q0 = A：模型显式标注 `requires_human` **+ 关键词兜底**，且
#            **宁可漏跳，不可误跳** —— 误跳一道真正的判断题，等于剥夺用户选择权
#   q1 = A：跳过并继续推进，最终自动提交；该题留空并标注「AI 跳过（需人工观察）」
#   q2 = A：`ai` 与 `recommend` 两种自动模式行为一致
#   q3 = C：跳过的题必须在卡片/摘要中明确标注（不能冒充「用户跳过本题」）
#
# ## 识别策略（两层，显式优先）
#
# 1. **显式字段**（权威）：`requires_human: true` /
#    `human_only: true` / `observer_only: true`。由模型出题时自己标。
# 2. **关键词兜底**（保守）：题干里出现**第二人称的观察动词**。
#
# 关键词这一层**必须极度保守**，因为误跳的代价是剥夺用户选择权：
#   · 只认「你/您 + 看到/观察到」这类**明确要求第一手感官输入**的说法；
#   · 不认「你觉得/你认为/你看是否」—— 那些是在征求判断，模型有权表态；
#   · 不认光秃秃的「看到」（"你看到本题了吗"之外还有"我认为这个方案可行"）。
_OBSERVE_PATTERNS = (
    # 「你/您」+ 可选副词（先/实际/刚才/现在/目前/有没有/是否…）+ 观察动词。
    # 允许副词是必要的：实测「你先看到的是什么」这种说法很常见，若要求紧邻
    # 会漏掉（漏跳只是放过一题，误跳却剥夺选择权，所以这里宁可放宽动词位置）。
    r"[你您](?:先|后|实际|刚才|刚刚|现在|目前|当时|有没有|是否|能|可以)?"
    r"(?:看到|看见|观察到|注意到|亲眼)",
    r"(?:界面|页面|卡片|屏幕)(?:上|里)?(?:显示|呈现)(?:了)?(?:什么|的是)",
    r"肉眼",
    r"凭(?:你的)?(?:观察|目测|肉眼)",
)

# 这些词一旦出现，说明是**征求意见/判断**，不是征求观察结果 → 不跳。
# 反例：「你觉得这个方案可行吗」「你认为哪个更好」—— 模型完全可以回答。
_JUDGEMENT_HINTS = (
    "觉得", "认为", "建议", "倾向", "是否同意", "偏好",
    "应该", "更好", "可行", "要不要", "选哪",
)

_RE_OBSERVE = re.compile("|".join(_OBSERVE_PATTERNS))
_RE_HUMAN_EXPLICIT = ("requires_human", "human_only", "observer_only")


def requires_human(q: Any) -> bool:
    """该题是否**只能由真人观察作答**（自动模式必须跳过）。

    返回 True 时，ai / recommend 都必须跳过它并把 `skipped_by` 记成
    ``"requires_human"``，绝不能让模型编一个观察结果。

    判定顺序：显式标注 > 关键词兜底；关键词命中但含判断词 → **不跳**
    （宁可漏跳不可误跳，用户裁定 q0）。
    """
    if not isinstance(q, dict):
        return False
    # 1) 显式标注（权威，模型说跳就跳）
    for field in _RE_HUMAN_EXPLICIT:
        if q.get(field) is True:
            return True
    # 2) 关键词兜底（保守）
    title = str(q.get("title") or "")
    if not title:
        return False
    if not _RE_OBSERVE.search(title):
        return False
    # 命中观察词，但同时也是一道"征求意见"的题 → 不跳。
    # 例：「你看到这个按钮了吗，觉得要不要改」→ 后半句是判断题，
    # 跳过会剥夺用户的意见表达机会，属于误跳。
    if any(hint in title for hint in _JUDGEMENT_HINTS):
        return False
    return True


def filled_answer(a: Any) -> bool:
    """这条答案是否"用户/driver 填过"。对齐前端 `filledAnswer()`（1198）。"""
    if not a:
        return False
    if a.get("skipped") is True:
        return True
    v = a.get("value")
    if isinstance(v, list):
        return len(v) > 0
    if str(v if v is not None else "").strip():
        return True
    if str(a.get("other") or "").strip():
        return True
    if a.get("attachments"):
        return True
    return False


def choice_for_question(envelope: Any, real_idx: int) -> str:
    """从分析缓存里取**本题**的推荐。对齐前端 `choiceForQuestion()`（1284）。

    ★ 绝不能取 `per_question[0]`：缓存按【可见位置】索引，而
      `per_question[i].index` 是【真实题号】。含 showIf 隐藏题时两个空间错位，
      取 [0] 会把别的题的结论填到当前题上 —— 2026-11-05 真机复现过
      「问答题被填成第一题的选项值」的串题 bug。

    匹配规则：
      ① 优先按真实题号精确匹配；
      ② 长度恰为 1 时允许取那一条（题级分析只返回一题，此时它就是本题）；
      ③ 其余返回空 —— 宁可不用缓存，也绝不填错（填错比填空更难发现）。
    """
    if not isinstance(envelope, dict):
        return ""
    per = envelope.get("per_question")
    if not isinstance(per, list) or not per:
        return ""
    mine = None
    for p in per:
        try:
            if int(p.get("index")) == int(real_idx):
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


# ══════════════════════════════════════════════════════════════
# 单步推进
# ══════════════════════════════════════════════════════════════

def step_once(state: dict) -> dict | None:
    """尝试推进一步（填当前可见题），返回要应用的变化；不需要推进时返回 None。

    `state` 形如 ``{"questions": [...], "answers": {...}, "cursor": int,
    "per_question": {...}}``（就是 ``SurveyState`` 的语义字段）。

    返回：``{"question_index": int, "answer": dict|None, "cursor": int,
    "done": bool}``
      • `answer` 为 None 表示该题**无可用推荐 → 标记跳过**（而不是卡住）
      • `done=True` 表示已走完所有可见题，调用方应自动提交

    设计上**一次只走一步**（用户裁定 q1）：调用方每步之间让出事件循环并广播，
    前端才能看到逐题过程，与今天的前端驱动行为一致。
    """
    questions = state.get("questions") or []
    answers = state.get("answers") or {}
    cursor = int(state.get("cursor") or 0)
    per_question = state.get("per_question") or {}
    if not questions:
        return None

    vis = visible_indices(questions, answers)
    if cursor >= len(vis):
        return {"question_index": -1, "answer": None, "cursor": cursor, "done": True}

    real_idx = vis[cursor]
    q = questions[real_idx]
    key = f"q{real_idx}"

    # 已经有答案（用户手工填过，或上一轮已推进过）→ 只前进游标，不覆盖。
    # 绝不覆盖用户已经填好的内容：recommend 是"帮忙收尾"，不是"替用户重答"。
    if filled_answer(answers.get(key)):
        return {"question_index": real_idx, "answer": None,
                "cursor": cursor + 1, "done": False, "already": True}

    # ── D4：观察题必须跳过，绝不编造（用户裁定 2026-11-07 q0/q1/q2）──
    #
    # 放在「取推荐」之前：观察题即便标了 recommended 也不能采纳 —— 那个推荐值
    # 是模型出题时凭空猜的，采纳它等于把编造当结论（实测自检 #3：AI 说「徽章在
    # B 项」，用户答「在 A 左侧」）。
    # `skipped_by="requires_human"` 让回传摘要能标注「AI 跳过（需人工观察）」，
    # 而不是冒充「用户跳过本题」。
    if requires_human(q):
        return {
            "question_index": real_idx,
            "answer": {"type": q_type(q), "value": [],
                       "other": "", "skipped": True,
                       "skipped_by": "requires_human",
                       "at": __import__("time").time()},
            "cursor": cursor + 1, "done": False, "skipped": True,
        }

    declared = question_recommended(q)
    cached = choice_for_question(
        {"per_question": [
            {"index": int(k), **(v if isinstance(v, dict) else {})}
            for k, v in (per_question or {}).items()
            if str(k).lstrip("-").isdigit()
        ]},
        real_idx,
    )
    choice = "、".join(declared) if declared else cached
    qt = q_type(q)

    if not choice:
        # 无可用推荐 → 标记跳过并前进（不卡住整卷，2026-11-04 的产品决定）。
        # `skipped_by` 让回传数据能区分「用户主动跳过」与「无推荐被跳过」。
        return {
            "question_index": real_idx,
            "answer": {"type": qt, "value": [] if qt == "multi" else "",
                       "other": "", "skipped": True,
                       "skipped_by": "no_recommend",
                       "at": __import__("time").time()},
            "cursor": cursor + 1, "done": False, "skipped": True,
        }

    # 「把 choice 变成 answer」复用 `apply_choice` —— 与 ai 路径**同一份实现**，
    # 否则两条路径的归一化规则会各自演化、慢慢漂移。
    ans = apply_choice(questions, real_idx, choice)

    return {"question_index": real_idx, "answer": ans,
            "cursor": cursor + 1, "done": False}



def prune_hidden(questions: list[dict], answers: dict) -> dict:
    """删掉因 showIf 重新收窄而不再可见的题答案。对齐前端 setAnswers 尾部逻辑。

    为什么必须删：条件题在用户改答案后可能重新隐藏，残留的答案会随着提交
    一起发给模型 —— 模型会以为用户答了一道它根本没看到的题。
    """
    vis = set(visible_indices(questions, answers))
    out = dict(answers)
    for i in range(len(questions)):
        if i not in vis:
            out.pop(f"q{i}", None)
    return out


# ══════════════════════════════════════════════════════════════
# 阶段 3：ai 模式的后端推进
# ══════════════════════════════════════════════════════════════
#
# 与 recommend 的差别**只在「推荐从哪来」**：
#   recommend → 模型出题时自带的 `recommended` 字段（零模型调用，毫秒级）
#   ai        → 现场调模型分析当前题（每题 7-12 秒，会失败、会限流）
#
# 所以「填入 + 归一化 + 推进」这套必须**复用同一份代码**，只替换推荐来源。
# 否则两条路径的答案格式会慢慢漂移 —— 那是最难查的一类缺陷（前端历史上
# 就出过「单选存了 label，既不勾选也匹配不上」）。

# 单题最多尝试次数（用户裁定 q1：重试 1 次 = 首次 + 1 次重试）
AI_MAX_ATTEMPTS_PER_QUESTION = 2
# 整卷累计尝试上限（用户裁定 q2：10 次后停摆交给用户，不烧无限额度）
AI_MAX_TOTAL_ATTEMPTS = 10


def apply_choice(questions: list[dict], real_idx: int, choice: str) -> dict:
    """把一段推荐文本变成该题的 answer（ai 与 recommend 共用）。

    `step_once` 的后半段就是这段逻辑；抽出来是为了让 ai 路径**逐字复用**，
    不必复制粘贴第二份归一化实现。
    """
    q = questions[real_idx]
    qt = q_type(q)
    opt_list = q.get("options") or []
    now = __import__("time").time()
    if not choice:
        return {"type": qt, "value": [] if qt == "multi" else "",
                "other": "", "skipped": True, "skipped_by": "no_recommend",
                "at": now}
    if qt == "multi":
        vals: list[str] = []
        for tok in re.split(r"[、,，]", choice):
            tok = _strip_rec_prefix(tok).strip()
            if not tok:
                continue
            hit = next((o for o in opt_list
                        if opt_value(o) == tok or opt_label(o) == tok), None)
            vals.append(opt_value(hit) if hit is not None else tok)
        return {"type": "multi", "value": vals, "other": "", "at": now}
    if qt == "single":
        hit = (next((o for o in opt_list
                     if opt_value(o) == choice or opt_label(o) == choice), None)
               or next((o for o in opt_list
                        if opt_value(o) == _strip_rec_prefix(choice)
                        or opt_label(o) == _strip_rec_prefix(choice)), None))
        return {"type": "single",
                "value": opt_value(hit) if hit is not None else choice,
                "other": "", "at": now}
    return {"type": "text", "value": choice, "other": "", "at": now}


def next_ai_target(state: dict) -> dict | None:
    """挑出 ai 模式下**下一步该处理的那道题**。

    返回 ``{"index", "visible", "cursor", "done"?, "skip_forward"?}``；
    无题可处理时返回 None。

    ★ 与 `step_once` 的关键区别：这里**不推进 cursor**。
      ai 要先调模型（几秒），拿到结果才能填。若先推进 cursor，模型调用失败
      时游标已经越过了这一题 —— 那道题会被永久跳过，用户看到的是"问卷答完
      了但有一题空着且没有任何说明"。
    """
    questions = state.get("questions") or []
    answers = state.get("answers") or {}
    cursor = int(state.get("cursor") or 0)
    if not questions:
        return None
    vis = visible_indices(questions, answers)
    if cursor >= len(vis):
        return {"index": -1, "visible": vis, "cursor": cursor, "done": True}
    real_idx = vis[cursor]
    # 已有答案（用户手答过 / 上一轮已填）→ 不必分析，直接前进
    if filled_answer(answers.get(f"q{real_idx}")):
        return {"index": real_idx, "visible": vis, "cursor": cursor,
                "skip_forward": True}
    # ── D4：观察题不进模型，直接标记跳过（用户裁定 2026-11-07）──
    #
    # ★ 关键：**不能**把观察题交给 `_ai_analyse_one`。
    # 一是模型会编造一个具体的观察结果（实测证据见 `requires_human` 注释）；
    # 二是逐题调模型有配额成本，对注定要跳过的题调用纯属浪费
    # （本机 today 曾累计 480 次限流，配额是稀缺资源）。
    #
    # 返回 `human_skip` 而非 `skip_forward`：前者要**写入一条带
    # `skipped_by="requires_human"` 的答案**，后者只是移动游标（不写答案）。
    # 混淆两者会让摘要无法标注「AI 跳过」，退化成「未作答」。
    if requires_human(questions[real_idx]):
        return {"index": real_idx, "visible": vis, "cursor": cursor,
                "human_skip": True}
    return {"index": real_idx, "visible": vis, "cursor": cursor}
