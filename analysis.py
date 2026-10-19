# -*- coding: utf-8 -*-
"""AI analysis engine for the question-modal plugin.

Adds an optional "let a model answer this survey for me" capability on top of
the blocking questionnaire:

* the user picks a model (a "capsule") in the card header,
* flips the switch to **AI automation**, and the survey is analysed as soon as
  it appears (per product decision: analyse on open, so the recommendation is
  ready when the user looks at the card),
* the analysis follows a fixed six-step chain of thought and returns, for each
  choice-type question, the recommended option plus the reasoning behind it.

Model access reuses the host's own factory — exactly the channel the
``prompt-forge`` plugin already ships in production:

    create_model_and_formatter_async(model_slot_override="<provider>:<model>")
    await consume_model_response(model, messages)

Decision records live in ``decisions.json`` next to the plugin (atomic write,
same pattern as ``answered_results.json``) so a later survey can be analysed
"with context": the previous decision(s) and the session history become part
of the prompt.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
import uuid
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

_PLUGIN_DIR = Path(__file__).parent.resolve()
_DECISIONS_FILE = _PLUGIN_DIR / "decisions.json"
_ANALYSIS_FILE = _PLUGIN_DIR / "analysis_results.json"

_DECISIONS_MAX = 200
_ANALYSIS_MAX = 200

# Bound a single model call so a hung provider cannot pin the event loop or
# leave the card spinning forever.
_MODEL_TIMEOUT_SECS = 120.0

# Process-wide cap on concurrent analysis model calls.  Serial mode never
# exceeds 1; parallel mode is bounded by this so a large survey cannot open
# dozens of simultaneous provider connections (SOUL.md: control concurrency).
_MAX_PARALLEL_CALLS = 4

# Cap on output tokens for ONE analysis.
#
# ⚠️ 回归教训（2026-10-15）：这个值一度设为 1200，本意是"防超长解析拖慢速度"，
# 结果对**推理型模型**（如 deepseek-v4.1-flash）直接制造了空结果——它们的
# ``max_tokens`` 同时约束「思考 token + 正文输出」，复杂题的思考吃掉额度后，
# 正文 JSON 被挤空/截断 → ``_parse_model_json`` 兜底成 ``{"reasoning": text}``
# → ``choice`` 恒空 → 前端只渲染标题、"套用推荐"无效。
# 实测同一长题：1200→原文 len=0（空）、4000→830 字正常、8192→685 字正常。
# 故放宽到 4000：足够容纳完整六步 + 正式 JSON，又仍能拦住语义失控的超长输出。
_ANALYSIS_MAX_TOKENS = 4000


# ══════════════════════════════════════════════════════════════════════
# Persistence helpers (atomic tmp + replace; failures never break a request)
# ══════════════════════════════════════════════════════════════════════

def _atomic_write(path: Path, payload: Any) -> None:
    try:
        tmp = path.parent / (path.name + ".tmp")
        tmp.write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8",
        )
        tmp.replace(path)
    except Exception:  # noqa: BLE001 - cache best effort only
        logger.warning("question_modal: could not persist %s", path.name,
                       exc_info=True)


def _read_json(path: Path, default: Any) -> Any:
    try:
        if not path.exists():
            return default
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not read %s", path.name,
                       exc_info=True)
        return default


# ── decision records (questionnaire level, with per-question results) ──

_DECISIONS: list[dict] = []


def _load_decisions() -> None:
    data = _read_json(_DECISIONS_FILE, [])
    if isinstance(data, list):
        _DECISIONS[:] = data
        logger.info("question_modal: restored %d decision records",
                    len(_DECISIONS))


def _persist_decisions() -> None:
    if len(_DECISIONS) > _DECISIONS_MAX:
        del _DECISIONS[: len(_DECISIONS) - _DECISIONS_MAX]
    _atomic_write(_DECISIONS_FILE, _DECISIONS)


def record_decision(record: dict) -> dict:
    """Append a decision record (questionnaire level) and persist."""
    entry = {
        "id": record.get("id") or uuid.uuid4().hex[:12],
        "created_at": record.get("created_at") or time.time(),
        **{k: v for k, v in record.items() if k not in ("id", "created_at")},
    }
    _DECISIONS.append(entry)
    _persist_decisions()
    return entry


def list_decisions(session_id: str = "", limit: int = 50) -> list[dict]:
    items = _DECISIONS
    if session_id:
        items = [d for d in items if d.get("session_id") == session_id]
    return items[-max(1, int(limit)):][::-1]


def latest_decision(session_id: str = "") -> Optional[dict]:
    for d in reversed(_DECISIONS):
        if not session_id or d.get("session_id") == session_id:
            return d
    return None


_load_decisions()


# ── analysis results (in flight + finished), keyed by request/tool_call id ──

_ANALYSIS: dict[str, dict] = {}


def _load_analysis() -> None:
    data = _read_json(_ANALYSIS_FILE, {})
    if isinstance(data, dict):
        _ANALYSIS.update(data)
        logger.info("question_modal: restored %d analysis results", len(_ANALYSIS))


def _persist_analysis() -> None:
    if len(_ANALYSIS) > _ANALYSIS_MAX:
        ordered = sorted(_ANALYSIS.items(), key=lambda kv: kv[1].get("at", 0))
        for k, _ in ordered[: len(_ANALYSIS) - _ANALYSIS_MAX]:
            _ANALYSIS.pop(k, None)
    _atomic_write(_ANALYSIS_FILE, _ANALYSIS)


_load_analysis()


def get_analysis(*keys: str) -> Optional[dict]:
    for k in keys:
        if k and k in _ANALYSIS:
            return _ANALYSIS[k]
    return None


def get_question_analysis(key: str, index: Optional[int] = None) -> Optional[dict]:
    """Read a stored analysis, optionally narrowed to one question.

    Results are stored per (card, question) so a rerun overwrites only that
    question and always leaves exactly one (latest) result behind (REQ-007).
    ``index is None`` returns the stored envelope for the whole card.
    """
    if not key:
        return None
    if index is None:
        return _ANALYSIS.get(key)
    entry = _ANALYSIS.get(question_key(key, index))
    if entry is not None:
        return entry
    # Tolerate the envelope shape: an entry may carry several questions.
    env = _ANALYSIS.get(key)
    if env:
        for p in env.get("per_question") or []:
            if p.get("index") == index:
                return {**env, "per_question": [p], "question_index": index}
    return None


def question_key(key: str, index: int) -> str:
    """Storage key for one question of a card: ``<card key>#q<index>``."""
    return f"{key}#q{int(index)}"


def set_analysis(key: str, payload: dict) -> None:
    """Store an analysis result.

    A single-question result is written under its own per-question key and the
    card envelope is refreshed with just that question, so re-analysing a
    question replaces its previous result instead of accumulating history
    (REQ-007).  A whole-survey result stores every question individually.
    """
    if not key:
        return
    stamp = time.time()
    per = payload.get("per_question") or []
    single = payload.get("question_index")
    if single is not None and len(per) == 1:
        idx = int(single)
        _ANALYSIS[question_key(key, idx)] = {"at": stamp, **payload}
        # Refresh the envelope so a reload can still find "the card's result",
        # holding only this question (the latest one).
        _ANALYSIS[key] = {"at": stamp, **payload}
    else:
        _ANALYSIS[key] = {"at": stamp, **payload}
        for p in per:
            if isinstance(p.get("index"), int):
                _ANALYSIS[question_key(key, p["index"])] = {
                    "at": stamp, **payload, "question_index": p["index"],
                    "per_question": [p],
                }
    _persist_analysis()


# ══════════════════════════════════════════════════════════════════════
# Model access (mirrors prompt-forge/backend/optimizer.py)
# ══════════════════════════════════════════════════════════════════════

async def _build_model(model_id: str = ""):
    """Create a chat model, preferring the caller's capsule selection.

    ``model_id`` is ``"<provider_id>:<model>"``.  Falls back to the globally
    active model when none is given, so AI automation still works before the
    user has picked a capsule.
    """
    try:
        from qwenpaw.agents.model_factory import create_model_and_formatter_async
        slot_override = model_id or None
        model, _ = await create_model_and_formatter_async(
            model_slot_override=slot_override,
        )
        if model is not None:
            return model
    except Exception as exc:  # noqa: BLE001
        logger.warning("question_modal: create_model(%s) failed: %s",
                       model_id or "-", exc)
    # Fallback: the active model, reusing the provider manager directly.
    if not model_id:
        try:
            from qwenpaw.providers.provider_manager import ProviderManager
            pm = ProviderManager.get_instance()
            return pm.get_active_chat_model()
        except Exception as exc:  # noqa: BLE001
            logger.warning("question_modal: active model lookup failed: %s", exc)
    return None


async def call_model(
    system_prompt: str,
    user_prompt: str,
    model_id: str = "",
    timeout: float = _MODEL_TIMEOUT_SECS,
    max_tokens: int = _ANALYSIS_MAX_TOKENS,
) -> str:
    """Run one completion and return its text (``""`` on any failure)."""
    model = await _build_model(model_id)
    if model is None:
        return ""
    try:
        from agentscope.message import Msg, TextBlock
        messages = [
            Msg(name="system", role="system",
                content=[TextBlock(type="text", text=system_prompt)]),
            Msg(name="user", role="user",
                content=[TextBlock(type="text", text=user_prompt)]),
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("question_modal: build msgs failed: %s", exc)
        return ""
    try:
        from qwenpaw.utils.model_response import consume_model_response
        # ``max_tokens`` caps the answer so a runaway long ``reasoning`` cannot
        # stall the autopilot.  It is passed as a call kwarg, which every
        # OpenAI-compatible backend merges into the request body.
        text = await asyncio.wait_for(
            consume_model_response(model, messages, max_tokens=max_tokens),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        logger.warning("question_modal: analysis model call timed out")
        return ""
    except Exception as exc:  # noqa: BLE001
        logger.warning("question_modal: analysis model call failed: %s", exc)
        return ""
    return str(text or "").strip()


# ══════════════════════════════════════════════════════════════════════
# The six-step analysis chain
# ══════════════════════════════════════════════════════════════════════

ANALYSIS_STEPS = [
    "分析用户当前状态与意图",
    "回顾历史决策与上下文",
    "评估各个选项",
    "形成推荐逻辑",
    "细化输出结构",
    "最终确定推荐",
]

_SYSTEM_PROMPT = (
    "你是一名严谨的决策分析助手，正在帮助用户回答一份问卷。\n"
    "请严格按以下六步思维链进行分析，并把六步**写在 reasoning 这一个字段里**"
    "（用 Markdown，逐步体现，不要拆成单独的 steps 字段、不要复述题目原文）：\n"
    + "\n".join(f"{i+1}. {s}" for i, s in enumerate(ANALYSIS_STEPS)) + "\n"
    "最终必须明确给出：① 推荐的选择；② 结论的深度解析（即上述六步 reasoning）。\n"
    "reasoning 力求简练，避免冗长复述。\n"
    "必须严格输出 JSON，格式为：\n"
    '{"choice": "<推荐选项的原文，多选则用、连接>", "confidence": 0~1 的数, '
    '"reasoning": "<含六步的 Markdown 深度解析>"}\n'
    "只输出这个 JSON，不要包裹代码块。"
)


# Question types the analyser knows how to answer.
_CHOICE_TYPES = ("single", "multi", "text")


# ══════════════════════════════════════════════════════════════════════
# Prompt templates (REQ-001/003): the analysis prompts are no longer frozen.
# ══════════════════════════════════════════════════════════════════════
#
# A *template* carries two fields:
#   * ``system`` — the system prompt (the six-step chain + output contract).
#   * ``user``   — the per-question user-prompt **assembly template**, rendered
#                  with ``{title}/{index}/{total}/{question}/{type}/{options}/
#                  {showIf}/{context}`` placeholders and ``{{#var}}…{{/var}}``
#                  optional sections.
#
# Built-in templates ship in code (``builtin: True``) and can be EDITED but not
# DELETED; custom templates are stored by the plugin and merged on top (same-id
# overrides a builtin — see plugin.py).  The **return-format contract** (the
# model must emit JSON ``{choice, confidence, reasoning}``) is NOT customisable:
# ``validate_template`` enforces it at save time (REQ-006).

# The default user-prompt template reproduces the pre-template behaviour
# byte-for-byte (verified by a self-check in the harness), so switching to
# this template changes nothing.
_DEFAULT_USER_TEMPLATE = (
    "问卷标题：{title}\n"
    "当前问题（第 {index}/{total} 题）：{question}\n"
    "题型：{type}\n"
    "{{#options}}候选项：\n{options}\n{{/options}}"
    "{{#showIf}}（本题为条件题，显示条件：{showIf}）\n{{/showIf}}"
    "{{#context}}\n可参考的上下文：\n{context}\n{{/context}}"
    "\n请按六步思维链分析并给出这一题的推荐选择与深度解析；"
    "若为问答题（text），请给出推荐的作答内容。"
)

BUILTIN_TEMPLATES: list[dict] = [
    {
        "id": "builtin-default",
        "name": "默认六步思维链",
        "builtin": True,
        "system": _SYSTEM_PROMPT,
        "user": _DEFAULT_USER_TEMPLATE,
    },
]

DEFAULT_TEMPLATE_ID = "builtin-default"

# Placeholders the user template may reference.  Restricting the substitution
# to this whitelist guarantees the JSON braces inside an edited SYSTEM prompt
# (e.g. ``{"choice": …}``) can never be mistaken for a placeholder.
_USER_TEMPLATE_VARS = (
    "title", "index", "total", "question", "type", "options", "showIf", "context",
)

_USER_VAR_RE = re.compile(r"\{(" + "|".join(_USER_TEMPLATE_VARS) + r")\}")
_USER_SECTION_RE = re.compile(
    r"\{\{#(\w+)\}\}(.*?)\{\{/\1\}\}", re.DOTALL,
)


def render_user_template(template: str, values: dict) -> str:
    """Render a user-prompt assembly template.

    Two passes: ``{{#var}}…{{/var}}`` sections are kept only when ``var`` is
    non-empty, then ``{var}`` placeholders are substituted (whitelisted names
    only, so JSON braces elsewhere are untouched).
    """
    text = template or ""

    def _section(match: "re.Match[str]") -> str:
        name, body = match.group(1), match.group(2)
        return body if str(values.get(name, "") or "").strip() else ""

    text = _USER_SECTION_RE.sub(_section, text)

    def _var(match: "re.Match[str]") -> str:
        return str(values.get(match.group(1), "") or "")

    return _USER_VAR_RE.sub(_var, text)


def validate_template(template: dict) -> str:
    """Return an error message when a template breaks the format contract.

    REQ-006: the analysis pipeline parses the model's reply as JSON
    ``{choice, confidence, reasoning}``; a system prompt that no longer asks
    for that contract would produce unparsable output (the old "只有标题"
    failure).  Saving such a template is therefore rejected.  Empty string
    means "valid".
    """
    system = str((template or {}).get("system") or "")
    if not system.strip():
        return "系统提示词不能为空"
    low = system.lower()
    missing = [k for k in ("choice", "reasoning") if k not in low]
    if missing:
        return (
            "系统提示词必须保留返回格式契约：需包含 JSON 字段 "
            + "、".join("“%s”" % k for k in missing)
            + "（choice/confidence/reasoning 不可更名或删除）"
        )
    if "json" not in low:
        return "系统提示词必须要求模型输出 JSON（当前未提及 JSON）"
    return ""



def infer_qtype(question: dict) -> str:
    """Resolve a question's type, tolerating an omitted ``type`` field.

    The model frequently calls the tool without ``type`` (it is optional in the
    tool schema) while still supplying ``options``.  The card renders those
    questions fine — but the analyser used to filter on
    ``q["type"] in ("single","multi","text")`` and therefore dropped EVERY such
    question, producing an empty result ("分析未返回有效结果") even though the
    survey was perfectly answerable.  This is the single source of truth for the
    inference, so analysis and rendering can never disagree again.

    Rule (per product decision): a question carrying ``options`` is a choice
    question — ``multi`` when it also asks for multiple picks, else ``single``;
    without options it is a free-text question.
    """
    declared = question.get("type")
    if isinstance(declared, str) and declared.strip().lower() in _CHOICE_TYPES:
        return declared.strip().lower()
    if question.get("options"):
        # `multiple`/`multi_select` style hints win over the single default.
        multi_hint = question.get("multiple")
        if multi_hint is True:
            return "multi"
        return "single"
    return "text"


def build_answered_context(
    questions: list[dict],
    index: int,
    answers: dict,
) -> str:
    """Base context for analysing question ``index``: the survey's OWN questions
    that come strictly BEFORE it and were already answered.

    Per product decision this is the *baseline* context: some questions are
    chained (a later question only makes sense in light of earlier answers), so
    each analysis must be grounded in the answers already given in THIS survey.
    Scope is strictly ordered — questions after ``index`` are never included,
    and unanswered ones contribute nothing (REQ-005).
    """
    lines: list[str] = []
    for i, q in enumerate(questions or []):
        if i >= index:
            break
        ans = answers.get(f"q{i}") if isinstance(answers, dict) else None
        if not isinstance(ans, dict):
            continue
        if ans.get("skipped"):
            continue
        value = ans.get("value")
        if isinstance(value, list):
            value = "、".join(str(v) for v in value)
        other = ans.get("other") or ""
        parts = [p for p in (str(value or "").strip(), str(other).strip()) if p]
        if not parts:
            # Not answered yet → contributes nothing to the baseline.
            continue
        qtitle = q.get("title") or f"问题 {i + 1}"
        lines.append(f"- 第 {i + 1} 题（{qtitle}）：{'、'.join(parts)}")
    if not lines:
        return ""
    return "本问卷已作答的前序问题（按题号顺序）：\n" + "\n".join(lines)


def build_question_prompt(
    question: dict,
    index: int,
    total: int,
    title: str = "",
    context: str = "",
    user_template: str = "",) -> str:
    """Per-question user prompt (one model call per question).

    When ``user_template`` is given it is rendered via ``render_user_template``
    with the question's fields (REQ-001); an empty template keeps the built-in
    assembly, which is byte-for-byte identical to the pre-template output.
    """
    qtype = infer_qtype(question)
    qtitle = question.get("title") or f"问题 {index + 1}"
    opts = question.get("options") or []
    show_if = question.get("showIf")

    if user_template and str(user_template).strip():
        options_txt = "\n".join(
            f"  {i + 1}. {o}" for i, o in enumerate(opts)
        )
        return render_user_template(user_template, {
            "title": title or "未命名问卷",
            "index": index + 1,
            "total": total,
            "question": qtitle,
            "type": qtype,
            "options": options_txt,
            "showIf": json.dumps(show_if, ensure_ascii=False) if show_if else "",
            "context": context or "",
        })

    lines = [
        f"问卷标题：{title or '未命名问卷'}",
        f"当前问题（第 {index + 1}/{total} 题）：{qtitle}",
        f"题型：{qtype}",
    ]
    if opts:
        lines.append("候选项：")
        for i, o in enumerate(opts):
            lines.append(f"  {i + 1}. {o}")
    if show_if:
        lines.append(f"（本题为条件题，显示条件：{json.dumps(show_if, ensure_ascii=False)}）")
    if context:
        lines.append("\n可参考的上下文：\n" + context)
    lines.append(
        "\n请按六步思维链分析并给出这一题的推荐选择与深度解析；"
        "若为问答题（text），请给出推荐的作答内容。",
    )
    return "\n".join(lines)


def _parse_model_json(text: str) -> dict:
    """Best-effort parse of the model's JSON (tolerates code fences / prose)."""
    if not text:
        return {}
    s = text.strip()
    if s.startswith("```"):
        s = s.strip("`")
        if s.lower().startswith("json"):
            s = s[4:]
    try:
        data = json.loads(s)
        if isinstance(data, dict):
            return data
    except Exception:  # noqa: BLE001
        pass
    # Fall back to the first {...} block.
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end > start:
        try:
            data = json.loads(s[start:end + 1])
            if isinstance(data, dict):
                return data
        except Exception:  # noqa: BLE001
            pass
    return {"reasoning": text}


# ══════════════════════════════════════════════════════════════════════
# Session context (for "回顾历史决策与上下文")
# ══════════════════════════════════════════════════════════════════════

async def fetch_session_context(
    history_db_path: str,
    session_id: str,
    agent_id: str,
    rounds: int = 6,
) -> str:
    """Read the tail of the session's conversation as plain text.

    Uses the same ``MemorySpace`` primitive the host's own scroll machinery
    relies on (verified working in prompt-forge).  Returns ``""`` on any
    failure — analysis must still proceed without context.
    """
    if not session_id or not history_db_path:
        return ""
    try:
        from qwenpaw.agents.context.scroll.memoryspace import MemorySpace
        ms = MemorySpace(
            history_db_path=str(history_db_path),
            session_id=session_id,
            agent_id=agent_id,
        )
        try:
            rows = ms._select(
                "SELECT seq, kind, role, name, content, created_at "
                "FROM hist.conversation_history "
                "WHERE session_id = ? AND (agent_id = ? OR agent_id IS NULL) "
                "AND kind IN ('context_msg', 'model_turn') "
                "ORDER BY seq DESC LIMIT ?",
                (str(session_id), agent_id, int(rounds * 2)),
            )
        finally:
            ms.close()
    except Exception as exc:  # noqa: BLE001
        logger.warning("question_modal: session context read failed: %s", exc)
        return ""

    out: list[str] = []
    for row in reversed(rows or []):
        try:
            role = row["role"] if hasattr(row, "__getitem__") else None
        except Exception:  # noqa: BLE001
            role = None
        content = ""
        try:
            content = row["content"] if hasattr(row, "__getitem__") else ""
        except Exception:  # noqa: BLE001
            content = ""
        text = _content_to_text(content)
        if text:
            out.append(f"[{role or '?'}] {text}")
    joined = "\n".join(out)
    return joined[-6000:] if len(joined) > 6000 else joined


def _content_to_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        s = content
        try:
            parsed = json.loads(s)
        except Exception:  # noqa: BLE001
            return s[:2000]
        return _content_to_text(parsed)
    if isinstance(content, list):
        parts = []
        for b in content:
            if isinstance(b, dict):
                parts.append(b.get("text") or b.get("content") or "")
            elif isinstance(b, str):
                parts.append(b)
        return " ".join(p for p in parts if p)[:2000]
    if isinstance(content, dict):
        return str(content.get("text") or content.get("content") or "")[:2000]
    return str(content)[:2000]


def decision_context_text(session_id: str = "") -> str:
    """Render the most recent decision as context for the next one."""
    prev = latest_decision(session_id)
    if not prev:
        return ""
    lines = [f"上一次决策（{prev.get('title') or '未命名问卷'}）："]
    for qa in (prev.get("per_question") or []):
        choice = qa.get("choice") or qa.get("answer") or ""
        lines.append(f"- {qa.get('title') or ''} → {choice}")
    if prev.get("final_answers"):
        for k, v in prev["final_answers"].items():
            lines.append(f"- {k}: {v}")
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════
# Orchestration
# ══════════════════════════════════════════════════════════════════════

async def analyze_survey(
    *,
    questions: list[dict],
    title: str = "",
    model_id: str = "",
    with_context: bool = False,
    parallel: bool = False,
    session_id: str = "",
    history_db_path: str = "",
    agent_id: str = "",
    question_index: Optional[int] = None,
    answers: Optional[dict] = None,
    system_prompt: str = "",
    user_template: str = "",
) -> dict:
    """Analyse a survey's questions and return the result.

    ``question_index`` selects the single question to analyse — the product
    decision is that analysis is **per question** (each question yields its own
    independent recommendation, so a chained question is judged on its own
    terms).  ``None`` keeps the legacy whole-survey sweep, used by the batch
    path.

    Context is layered (REQ-005 / REQ-006):
      * always: the survey's own answers to questions *before* this one,
      * plus, only when ``with_context`` is set: the previous questionnaire
        (questions + answers + AI conclusions) and the session history.

    ``parallel`` bounds concurrency when several questions are analysed at
    once (whole-survey path); with a single ``question_index`` it is a no-op
    and retained only so the caller can pass its stored preferences verbatim.
    """
    started = time.time()

    # ── baseline context: this survey's earlier answers (always) ──
    def base_context_for(idx: int) -> str:
        return build_answered_context(questions, idx, answers or {})

    # ── extended context: previous questionnaire + session history ──
    extra_context = ""
    if with_context:
        ctx_parts = []
        prev = decision_context_text(session_id)
        if prev:
            ctx_parts.append(prev)
        hist = await fetch_session_context(history_db_path, session_id, agent_id)
        if hist:
            ctx_parts.append("会话历史（节选）：\n" + hist)
        extra_context = "\n\n".join(ctx_parts)

    def context_for(idx: int) -> str:
        parts = [p for p in (base_context_for(idx), extra_context) if p]
        return "\n\n".join(parts)

    # No type-based filtering: `infer_qtype` handles a missing `type`, so every
    # question in the survey is analysed (previously questions without an
    # explicit type were silently dropped, yielding an empty analysis).
    if question_index is not None and 0 <= int(question_index) < len(questions):
        targets = [(int(question_index), questions[int(question_index)])]
    else:
        targets = [(i, q) for i, q in enumerate(questions)]

    async def analyze_one(idx: int, q: dict) -> dict:
        prompt = build_question_prompt(
            q, idx, len(questions), title, context_for(idx),
            user_template=user_template,
        )
        raw = await call_model(system_prompt or _SYSTEM_PROMPT, prompt, model_id)
        parsed = _parse_model_json(raw)
        qtype = infer_qtype(q)
        is_choice = qtype in ("single", "multi")
        choice = parsed.get("choice") or ""
        reasoning = parsed.get("reasoning") or ""
        # Mark a question as failed when it yields nothing usable — and, for a
        # choice question, when it has NO ``choice`` even though it has
        # reasoning.  The latter is the "只有标题 / 套用推荐无效" symptom (the
        # JSON was truncated so ``_parse_model_json`` fell back to raw text):
        # surfacing it here lets ``ok`` go False so the UI says "重试/换模型"
        # instead of silently showing a title-only card.
        failed = (not choice and not reasoning) or (is_choice and not choice)
        return {
            "index": idx,
            "title": q.get("title") or f"问题 {idx + 1}",
            "type": qtype,
            "options": q.get("options") or [],
            "choice": choice,
            "confidence": parsed.get("confidence"),
            "reasoning": reasoning,
            "model_id": model_id,
            "failed": failed,
            "raw": raw[:4000] if not reasoning else "",
        }

    per_question: list[dict] = []
    try:
        if parallel and len(targets) > 1:
            sem = asyncio.Semaphore(_MAX_PARALLEL_CALLS)

            async def guarded(idx: int, q: dict) -> dict:
                async with sem:
                    return await analyze_one(idx, q)

            per_question = list(
                await asyncio.gather(*(guarded(i, q) for i, q in targets)),
            )
        else:
            for i, q in targets:
                per_question.append(await analyze_one(i, q))
    except Exception as exc:  # noqa: BLE001
        logger.warning("question_modal: analysis failed: %s", exc)

    # A question is "good" when it is NOT marked failed — i.e. it produced a
    # usable choice (choice question) or real reasoning (open question).  The
    # raw-text fallback (`{"reasoning": <prose>}`) no longer counts as success
    # for a choice question, so a truncated payload can't masquerade as valid.
    ok = any(not p.get("failed") for p in per_question)
    if ok:
        error = ""
    elif not targets:
        error = "问卷没有任何可分析的题目"
    elif not per_question:
        error = "分析未执行（题目为空）"
    else:
        error = "分析未返回有效结果（模型不可用或超时，请重试或更换模型胶囊）"
    return {
        "ok": ok,
        "title": title,
        "model_id": model_id,
        "with_context": with_context,
        "parallel": bool(parallel),
        "question_index": question_index,
        "per_question": per_question,
        "elapsed": round(time.time() - started, 2),
        "steps": ANALYSIS_STEPS,
        "error": error,
    }
