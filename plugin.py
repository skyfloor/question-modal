# -*- coding: utf-8 -*-
"""Ask-User Plugin — Backend entry point, adapted for QwenPaw 2.x.

Upstream (MIT, levodoubt/ask-user-plugin) targeted QwenPaw 1.1.5 and
intercepted ``QwenPawAgent._acting()`` via monkey-patch.  That method no
longer exists: in agentscope 2.0 / QwenPaw 2.x the single funnel is
``Agent._execute_tool_call`` and the *official* interception point is the
``on_acting`` middleware hook (see ``qwenpaw/agents/react_agent.py`` and
``agentscope/agent/_agent.py``).

Adaptation summary
------------------
===========================================  ==========================================
Upstream (1.1.5)                             This port (2.x)
===========================================  ==========================================
monkey-patch ``QwenPawAgent._acting``        ``api.register_middleware`` → ``on_acting``
``setattr(qwenpaw.agents.tools, ...)``       ``api.register_tool(question_modal)``
``await self.print(msg, True)``              (removed — no ``Agent.print`` in 2.x)
return ``None``                              ``yield ToolResponse(...)`` (short-circuit)
``self.memory.add(...)``                     (handled by the agent's context funnel)
===========================================  ==========================================

The blocking semantics are preserved: the tool call's coroutine awaits an
``asyncio.Future`` until the user submits/skips through the REST API.
Because the plugin never registers a per-tool timeout hook and the global
coordinator default is ``None``, the wait is unbounded — matching the
original "no timeout" contract.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from qwenpaw.plugins.api import PluginApi

from .question_service import get_question_service
from . import analysis as _analysis

logger = logging.getLogger(__name__)

_PLUGIN_DIR = Path(__file__).parent.resolve()

_TYPE_LABELS = {"single": "单选", "multi": "多选", "text": "问答"}

# ── Running analyses ───────────────────────────────────────────────
# Keyed by tool_call_id (fallback: request_id) → asyncio.Task.  Lets the card's
#「终止分析」button actually stop a six-step run instead of just hiding it: the
# task is cancelled, which propagates into the in-flight model call.  Entries
# remove themselves in the route's finally block.
_ANALYSIS_TASKS: dict[str, asyncio.Task] = {}


def _analysis_key(tool_call_id: str, request_id: str) -> str:
    return tool_call_id or request_id or ""


def _task_key(key: str, question_index: Optional[int] = None) -> str:
    """Registry key for a running analysis.

    Per-question runs get their own slot (``<card key>#q<index>``) so switching
    questions does not make an in-flight run unfindable, while the card can
    still locate the run of the question it is currently showing.
    """
    if question_index is None:
        return key
    return f"{key}#q{int(question_index)}"


def _cancel_analysis(key: str) -> bool:
    """Cancel a running analysis.  Returns True when something was stopped."""
    task = _ANALYSIS_TASKS.get(key)
    if task is None or task.done():
        _ANALYSIS_TASKS.pop(key, None)
        return False
    task.cancel()
    return True

# ── Answered-results cache ─────────────────────────────────────────
# Keyed by tool_call_id (fallback: request_id).  A card re-rendered after
# a page reload can ask "was my question already answered?" and show the
# result instead of the form again.  Bounded by a simple size guard.
#
# Persisted to disk: the host folds old tool results into a pointer stub
# once a session grows, so a history card's inline answer disappears.  The
# card then relies on this lookup — which would itself be lost on a plugin
# restart if the cache were memory-only.  The file lives next to the plugin
# and is written atomically (tmp + replace).
_RESULTS: dict[str, dict] = {}
_RESULTS_MAX = 300
_RESULTS_FILE = _PLUGIN_DIR / "answered_results.json"


# ══════════════════════════════════════════════════════════════════════
# Capsule preferences (B3) — disk is the single source of truth
# ══════════════════════════════════════════════════════════════════════
#
# Why a file and not localStorage: the card keyed its prefs by tool_call_id,
# and every question_modal call gets a brand-new one, so the model selection
# looked "reset" on each survey.  A per-install JSON file makes the choice
# survive reloads, travel across browsers and stay identical for every card.
#
# Only whitelisted keys are persisted, so the file cannot grow unbounded nor
# be used to stash arbitrary payloads.
_PREFS_FILE = _PLUGIN_DIR / "analysis_prefs.json"
_PREFS_DEFAULTS: dict[str, Any] = {
    "mode": "manual",
    "model_id": "",
    "with_context": False,
    "parallel": False,
}


def _load_prefs() -> dict:
    """Read the persisted prefs, falling back to the defaults."""
    try:
        if _PREFS_FILE.is_file():
            data = json.loads(_PREFS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                out = dict(_PREFS_DEFAULTS)
                for k in _PREFS_DEFAULTS:
                    if k in data:
                        out[k] = data[k]
                return out
    except Exception:  # noqa: BLE001 — a broken prefs file must not break a survey
        logger.warning("question_modal: could not read prefs", exc_info=True)
    return dict(_PREFS_DEFAULTS)


def _save_prefs(patch: dict) -> dict:
    """Merge a whitelisted patch into the prefs file (atomic write)."""
    cur = _load_prefs()
    # `recommend` is the third driving mode: consume the recommendation the
    # model attached while authoring the question, without any model call.
    if patch.get("mode") in ("ai", "recommend", "manual"):
        cur["mode"] = patch["mode"]
    if isinstance(patch.get("model_id"), str):
        cur["model_id"] = patch["model_id"][:200]
    for flag in ("with_context", "parallel"):
        if isinstance(patch.get(flag), bool):
            cur[flag] = patch[flag]
    cur["updated_at"] = time.time()
    try:
        tmp = _PREFS_FILE.parent / (_PREFS_FILE.name + ".tmp")
        tmp.write_text(json.dumps(cur, ensure_ascii=False), encoding="utf-8")
        tmp.replace(_PREFS_FILE)
    except Exception:  # noqa: BLE001 — the card keeps a localStorage mirror
        logger.warning("question_modal: could not persist prefs", exc_info=True)
    return cur


# ── Analysis prompt templates (REQ-001/003/005/006) ────────────────────
#
# Built-in templates ship in code (from ``analysis.BUILTIN_TEMPLATES``); the
# user may EDIT them but not DELETE them.  Custom templates are persisted in
# ``templates.json`` and merged on top, so the library is GLOBAL (one shared
# store across every card — REQ-005); only the *selection* of which template a
# card uses is per-card (REQ-002, stored in the card state on the client).
_TEMPLATES_FILE = _PLUGIN_DIR / "templates.json"


def _load_custom_templates() -> list[dict]:
    """Read the custom (non-builtin) templates persisted on disk."""
    try:
        if _TEMPLATES_FILE.is_file():
            data = json.loads(_TEMPLATES_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return [t for t in data["items"] if isinstance(t, dict)]
    except Exception:  # noqa: BLE001 — a broken file must not break analysis
        logger.warning("question_modal: could not read templates", exc_info=True)
    return []


def _save_custom_templates(items: list[dict]) -> None:
    """Persist the custom templates (atomic write)."""
    payload = {"schema_version": 1, "updated_at": time.time(), "items": items}
    try:
        tmp = _TEMPLATES_FILE.parent / (_TEMPLATES_FILE.name + ".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(_TEMPLATES_FILE)
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not persist templates", exc_info=True)


def _sanitize_template(t: dict) -> dict:
    """Keep only the fields a template owns, with bounded sizes."""
    return {
        "id": str(t.get("id") or "")[:120],
        "name": str(t.get("name") or "")[:120],
        "system": str(t.get("system") or "")[:20000],
        "user": str(t.get("user") or "")[:20000],
        "builtin": bool(t.get("builtin")),
    }


def _all_templates() -> list[dict]:
    """Built-ins first, custom appended; a custom with a builtin id overrides it."""
    builtins = [_sanitize_template(t) for t in _analysis.BUILTIN_TEMPLATES]
    customs = [_sanitize_template(t) for t in _load_custom_templates()]
    merged: list[dict] = []
    by_id: dict[str, int] = {}
    for t in builtins:
        by_id[t["id"]] = len(merged)
        merged.append(t)
    for t in customs:
        # A stored copy of a builtin (edited) overrides the shipped default,
        # exactly like prompt-forge's "builtin as base, custom on top".
        t["builtin"] = t["id"] in by_id or t.get("builtin", False)
        if t["id"] in by_id:
            merged[by_id[t["id"]]] = t
        else:
            by_id[t["id"]] = len(merged)
            merged.append(t)
    return merged


def _persist_results() -> None:
    """Write the results cache to disk (atomic; failures are non-fatal)."""
    try:
        tmp = _RESULTS_FILE.parent / (_RESULTS_FILE.name + ".tmp")
        tmp.write_text(
            json.dumps(_RESULTS, ensure_ascii=False), encoding="utf-8",
        )
        tmp.replace(_RESULTS_FILE)
    except Exception:  # noqa: BLE001 - never break a submission over caching
        logger.warning("question_modal: could not persist results cache",
                       exc_info=True)


def _load_results() -> None:
    """Restore the results cache from disk on import."""
    try:
        if not _RESULTS_FILE.exists():
            return
        data = json.loads(_RESULTS_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            _RESULTS.update(data)
            logger.info("question_modal: restored %d cached answers",
                        len(_RESULTS))
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not restore results cache",
                       exc_info=True)


def _remember_result(key: str, kind: str, payload: dict) -> None:
    if not key:
        return
    _RESULTS[key] = {"kind": kind, "at": time.time(), **payload}
    if len(_RESULTS) > _RESULTS_MAX:
        for k in sorted(_RESULTS, key=lambda x: _RESULTS[x]["at"])[
            : len(_RESULTS) - _RESULTS_MAX
        ]:
            _RESULTS.pop(k, None)
    _persist_results()


_load_results()


def _register_question(request_id: str, session_id: str, questions: list) -> None:
    """No-op kept for symmetry/clarity (pending lives in QuestionService)."""
    return None


def _build_per_question(questions: list, answers: dict) -> list:
    """Pair each question with the answer the user gave (decision record)."""
    out: list[dict] = []
    for i, q in enumerate(questions or []):
        key = f"q{i}"
        a = answers.get(key) if isinstance(answers, dict) else None
        if isinstance(a, dict):
            value = a.get("value")
            other = a.get("other") or ""
            skipped = bool(a.get("skipped"))
        else:
            value, other, skipped = a, "", False
        if isinstance(value, list):
            value = "、".join(str(v) for v in value)
        if other:
            value = (str(value) + "、" + other) if value else other
        out.append({
            "index": i,
            "title": (q or {}).get("title") or f"问题 {i + 1}",
            "type": (q or {}).get("type"),
            "answer": "" if skipped else (value or ""),
            "skipped": skipped,
        })
    return out


async def _history_db_path(request: Any) -> str:
    """Locate the agent's ``history.db`` for session-context reads.

    The path is per-workspace (``<workspace_dir>/history.db``).  Every failure
    is swallowed: analysis must still run without session context.
    """
    try:
        from qwenpaw.app.agent_context import get_agent_for_request
        workspace = await get_agent_for_request(request)
        path = getattr(workspace, "workspace_dir", None)
        return str(Path(path) / "history.db") if path else ""
    except Exception:  # noqa: BLE001
        return ""


# Upper bound on how long a tool call may block waiting for the user.
# 0 = wait forever, which is the DEFAULT and the intended contract:
# question_modal is a *blocking* interaction, so an auto-skip would silently
# discard a decision the user meant to make.  Reopening a session the next
# day to find the question "timed out" is far worse than the agent still
# waiting for the answer.  Set QWENPAW_QUESTION_MODAL_TIMEOUT_SECS to a positive
# value only if you genuinely want an auto-skip guard for unattended use.
_DEFAULT_TIMEOUT_SECS = 0.0


def _resolve_timeout_secs() -> float:
    """Timeout for the blocking wait; overridable via env var."""
    raw = os.environ.get("QWENPAW_QUESTION_MODAL_TIMEOUT_SECS", "")
    if raw.strip() == "":
        return _DEFAULT_TIMEOUT_SECS
    try:
        return max(0.0, float(raw))
    except (TypeError, ValueError):
        logger.warning(
            "invalid QWENPAW_QUESTION_MODAL_TIMEOUT_SECS=%r; using default", raw,
        )
        return _DEFAULT_TIMEOUT_SECS


# ══════════════════════════════════════════════════════════════════════
# REST API schemas
# ══════════════════════════════════════════════════════════════════════

class AnswerRequest(BaseModel):
    request_id: str = Field(..., description="Question request ID")
    session_id: str = Field("", description="Session ID")
    answers: dict = Field(default_factory=dict, description="Question answers")
    other: str = Field("", description="Final 'other' field")
    # Files the user attached to the final「其他意见」box.  Each entry is what
    # the host's own upload endpoint returned: {url, file_name, size}.  Kept
    # as a loose list so an older/newer frontend never fails validation.
    attachments: list = Field(default_factory=list,
                              description="Files attached to the final 'other' box")


class SkipRequest(BaseModel):
    request_id: str = Field(..., description="Question request ID")
    session_id: str = Field("", description="Session ID")


class AnalyzeRequest(BaseModel):
    """Request body for the AI analysis endpoint.

    Everything except ``request_id`` is optional: the card may send the
    question list directly (so a card whose pending record is already gone can
    still be analysed) or rely on the backend's pending record.
    """
    request_id: str = Field("", description="Question request ID")
    tool_call_id: str = Field("", description="Tool call ID")
    session_id: str = Field("", description="Session ID")
    agent_id: str = Field("", description="Agent ID")
    title: str = Field("", description="Survey title")
    questions: list = Field(default_factory=list, description="Question list")
    model_id: str = Field("", description="Capsule model, '<provider>:<model>'")
    mode: str = Field("manual", description="'auto' | 'manual'")
    with_context: bool = Field(
        False, description="Include previous decision + session history",
    )
    parallel: bool = Field(
        False, description="Run per-question calls in parallel (false = serial)",
    )
    # Per-question analysis (REQ-004): when set, only this question is analysed.
    question_index: Optional[int] = Field(
        None, description="Analyse only this question (per-question analysis)",
    )
    # The survey's current answers, used to build the baseline context from the
    # questions answered before `question_index` (REQ-005).
    answers: dict = Field(
        default_factory=dict, description="Answers so far, keyed q0/q1/...",
    )
    # Which prompt template to analyse with (REQ-001/002).  Empty → built-in
    # default, so an older card keeps its exact previous behaviour.
    template_id: str = Field("", description="Prompt template id")


class TemplateBody(BaseModel):
    """A prompt template (create/update).  ``id`` empty → the server assigns one."""
    id: str = Field("", description="Template id (empty = create new)")
    name: str = Field("", description="Display name")
    system: str = Field("", description="System prompt (must keep the JSON contract)")
    user: str = Field("", description="Per-question user-prompt assembly template")


class CancelAnalysisRequest(BaseModel):
    """Identifies the analysis to stop (tool_call_id preferred)."""
    tool_call_id: str = Field("", description="Tool call ID")
    request_id: str = Field("", description="Question request ID")
    # Optional: narrow the cancellation to one question's run.  Switching
    # questions quickly can leave an earlier per-question run in flight, so the
    # card targets its current question precisely.
    question_index: Optional[int] = Field(
        None, description="Cancel only this question's analysis",
    )


class PrefsRequest(BaseModel):
    """Capsule preference patch — every field optional, unknown keys ignored.

    Kept deliberately loose so an older/newer card never fails validation.
    """
    mode: Optional[str] = Field(None, description="'ai' | 'recommend' | 'manual'")
    model_id: Optional[str] = Field(None, description="'<provider>:<model>'")
    with_context: Optional[bool] = Field(None)
    parallel: Optional[bool] = Field(None)


class AnswerResponse(BaseModel):
    ok: bool
    message: str
    request_id: str
    # True when the record existed but had been restored after a plugin
    # reload (its agent turn is gone).  The card treats this as "survey over"
    # and closes itself instead of retrying forever.
    orphan: bool = False


def build_router() -> APIRouter:
    """Build the plugin's REST router (mounted under /api/question-modal)."""
    router = APIRouter()

    @router.get("/resolve")
    async def resolve_pending(
        session_id: str = Query(default=""),
        tool_call_id: str = Query(default=""),
        request_id: str = Query(default=""),
    ):
        """Resolve a question's request_id by tool_call_id (preferred) or
        by session (first pending).  The frontend uses this so its own card
        addresses exactly the right pending record even when older question_modal
        cards linger in the same chat history."""
        svc = get_question_service()
        pq = None
        if tool_call_id:
            pq = await svc.get_by_tool_call(tool_call_id)
        if pq is None and request_id:
            pq = await svc.get_request(request_id)
        if pq is None and session_id:
            items = await svc.list_pending(session_id)
            pq = items[0] if items else None
        if pq is None:
            return {"ok": True, "found": False}
        # An orphan record means the plugin was reloaded while this survey was
        # open: the agent is no longer waiting, so the card must not keep
        # offering a form that can never be submitted.
        if pq.orphan:
            return {
                "ok": True,
                "found": False,
                "orphan": True,
                "request_id": pq.request_id,
                "session_id": pq.session_id,
                "agent_id": pq.agent_id,
                "tool_call_id": pq.tool_call_id,
                "title": pq.title,
            }
        return {
            "ok": True,
            "found": True,
            "request_id": pq.request_id,
            "session_id": pq.session_id,
            # The frontend has no host API for either of these, so echo them
            # back: the card caches them and uses them for the X-Agent-Id
            # header and for session-scoped releases.
            "agent_id": pq.agent_id,
            "title": pq.title,
            "questions": pq.questions,
            "tool_call_id": pq.tool_call_id,
            "status": pq.status,
        }

    @router.get("/result")
    async def get_result(
        tool_call_id: str = Query(default=""),
        request_id: str = Query(default=""),
    ):
        """Return a previously submitted/skipped answer (by tool_call_id).

        Lets a card that is re-rendered after a page reload show its result
        instead of offering the form again."""
        key = tool_call_id or request_id
        if not key:
            return {"ok": True, "found": False}
        item = _RESULTS.get(key)
        if not item:
            return {"ok": True, "found": False}
        return {"ok": True, "found": True, **item}

    @router.post("/answer", response_model=AnswerResponse)
    async def submit_answer(body: AnswerRequest):
        """Submit answers to a pending question."""
        svc = get_question_service()
        pq = await svc.get_request(body.request_id)
        if pq is None:
            raise HTTPException(status_code=404, detail="Question not found")
        if pq.session_id and body.session_id and pq.session_id != body.session_id:
            raise HTTPException(status_code=403, detail="Session mismatch")

        if pq.orphan:
            # The plugin was reloaded while this survey was open, so its agent
            # turn is gone.  Acknowledge so the card can converge and stop
            # answering「问卷尚未就绪」, but do not claim a Future was resolved.
            svc.forget(pq.request_id)
            _remember_result(
                pq.tool_call_id or pq.request_id, "orphan",
                {"request_id": pq.request_id, "answers": body.answers,
                 "other": body.other, "attachments": body.attachments},
            )
            return AnswerResponse(
                ok=True,
                message=f"Question {body.request_id[:8]} no longer active "
                        "(问卷服务已重启，本次问卷已失效)",
                request_id=body.request_id,
                orphan=True,
            )

        resolved = await svc.submit_answer(
            body.request_id, body.answers, body.other, body.attachments,
        )
        if resolved is None:
            # The record existed but had NO live Future — its agent is not
            # parked on anything we can wake (cross-generation reload, already
            # finished, or cancelled).  Saying "answered" here would be a lie:
            # the card would show「✓ 已完成」while the chat kept answering
            # 409.  Answer as orphan so the card reports the truth and keeps
            # its manual release available.
            svc.forget(body.request_id)
            _remember_result(
                pq.tool_call_id or pq.request_id, "orphan",
                {"request_id": pq.request_id, "answers": body.answers,
                 "other": body.other, "attachments": body.attachments},
            )
            return AnswerResponse(
                ok=True,
                message=f"Question {body.request_id[:8]} no longer active "
                        "(没有正在等待的 agent 调用，本次问卷已失效)",
                request_id=body.request_id,
                orphan=True,
            )
        _remember_result(
            pq.tool_call_id or pq.request_id, "answered",
            {"request_id": pq.request_id, "answers": body.answers,
             "other": body.other, "attachments": body.attachments},
        )
        # Record the decision (questionnaire level, with per-question results)
        # so the next survey can be analysed "with context".
        try:
            _analysis.record_decision({
                "session_id": pq.session_id,
                "agent_id": pq.agent_id,
                "request_id": pq.request_id,
                "tool_call_id": pq.tool_call_id,
                "title": pq.title,
                "source": "user",
                "per_question": _build_per_question(pq.questions, body.answers),
                "final_answers": {
                    k: (v.get("value") if isinstance(v, dict) else v)
                    for k, v in (body.answers or {}).items()
                },
                "other": body.other,
            })
        except Exception:  # noqa: BLE001 - never fail a submission over this
            logger.warning("question_modal: record_decision failed", exc_info=True)
        return AnswerResponse(
            ok=True,
            message=f"Question {body.request_id[:8]} answered",
            request_id=body.request_id,
        )

    @router.post("/skip", response_model=AnswerResponse)
    async def skip_question(body: SkipRequest):
        """Skip a pending question."""
        svc = get_question_service()
        pq = await svc.get_request(body.request_id)
        if pq is None:
            raise HTTPException(status_code=404, detail="Question not found")
        if pq.session_id and body.session_id and pq.session_id != body.session_id:
            raise HTTPException(status_code=403, detail="Session mismatch")

        if pq.orphan:
            svc.forget(pq.request_id)
            _remember_result(
                pq.tool_call_id or pq.request_id, "orphan",
                {"request_id": pq.request_id},
            )
            return AnswerResponse(
                ok=True,
                message=f"Question {body.request_id[:8]} no longer active "
                        "(问卷服务已重启，本次问卷已失效)",
                request_id=body.request_id,
                orphan=True,
            )

        resolved = await svc.skip(body.request_id)
        if resolved is None:
            # Same reasoning as /answer: no live Future means nothing was
            # unparked, so do NOT let the card claim「✓ 已跳过」.
            svc.forget(body.request_id)
            _remember_result(
                pq.tool_call_id or pq.request_id, "orphan",
                {"request_id": pq.request_id},
            )
            return AnswerResponse(
                ok=True,
                message=f"Question {body.request_id[:8]} no longer active "
                        "(没有正在等待的 agent 调用，本次问卷已失效)",
                request_id=body.request_id,
                orphan=True,
            )
        _remember_result(
            pq.tool_call_id or pq.request_id, "skipped",
            {"request_id": pq.request_id},
        )
        return AnswerResponse(
            ok=True,
            message=f"Question {body.request_id[:8]} skipped",
            request_id=body.request_id,
        )

    @router.get("/pending")
    async def get_pending(session_id: str = Query(default="")):
        """Return all pending questions, optionally filtered by session."""
        svc = get_question_service()
        items = []
        for pq in await svc.list_pending(session_id):
            items.append({
                "request_id": pq.request_id,
                "session_id": pq.session_id,
                "agent_id": pq.agent_id,
                "title": pq.title,
                "questions": pq.questions,
                "question_count": len(pq.questions),
                "status": pq.status,
            })
        return {"ok": True, "count": len(items), "items": items}

    @router.get("/details")
    async def get_details(request_id: str = Query(...)):
        """Return full details for a pending question by request ID."""
        svc = get_question_service()
        pq = await svc.get_request(request_id)
        if pq is None:
            raise HTTPException(status_code=404, detail="Question not found")
        return {
            "ok": True,
            "request_id": pq.request_id,
            "session_id": pq.session_id,
            "agent_id": pq.agent_id,
            "title": pq.title,
            "questions": pq.questions,
            "question_count": len(pq.questions),
            "status": pq.status,
        }

    @router.post("/cancel-session")
    async def cancel_session(session_id: str = Query(...)):
        """Cancel every pending question of a session (e.g. on interrupt)."""
        svc = get_question_service()
        count = await svc.cancel_all_by_session(session_id)
        return {"ok": True, "cancelled": count}

    # ── AI analysis (optionally automated) ──────────────────────────────
    #
    # The card can hand this survey to a model: it picks a "capsule" model,
    # flips to AI automation, and the survey is analysed as soon as it opens.
    # Model access reuses the host factory — the same channel prompt-forge
    # ships in production.

    @router.post("/analyze")
    async def analyze(body: AnalyzeRequest, request: Request):
        """Analyse a pending survey and (optionally) auto-fill the result.

        ``mode``:
          * ``auto``   — the user chose AI automation; the recommendation is
                         computed and stored, ready to submit.
          * ``manual`` — the user pressed「查看分析」; compute on demand.
        Both paths run the same six-step chain.
        """
        svc = get_question_service()
        pq = await svc.get_request(body.request_id) if body.request_id else None
        questions = body.questions
        title = body.title
        session_id = body.session_id
        agent_id = body.agent_id
        tool_call_id = body.tool_call_id
        if pq is not None:
            questions = questions or pq.questions
            title = title or pq.title
            session_id = session_id or pq.session_id
            agent_id = agent_id or pq.agent_id
            tool_call_id = tool_call_id or pq.tool_call_id
        if not questions:
            # Mirror the reason into `analysis.error` as well, so the card's
            # single error path ("read analysis.error") always has text even
            # when the request is rejected before any analysis runs.
            return {"ok": False, "error": "no questions to analyse",
                    "analysis": {"ok": False, "per_question": [], "error": "问卷没有可分析的题目"}}

        key = _analysis_key(tool_call_id, body.request_id)
        run_key = _task_key(key, body.question_index)

        # Resolve the prompt template (REQ-001).  An unknown/empty id falls back
        # to the built-in default, so a stale card selection never breaks a run.
        tpl = next(
            (t for t in _all_templates() if t["id"] == body.template_id),
            None,
        ) or next(
            t for t in _all_templates() if t["id"] == _analysis.DEFAULT_TEMPLATE_ID
        )
        sys_prompt = tpl.get("system") or ""
        user_tpl = tpl.get("user") or ""

        async def _run() -> dict:
            res = await _analysis.analyze_survey(
                questions=questions,
                title=title,
                model_id=body.model_id,
                with_context=body.with_context,
                parallel=body.parallel,
                session_id=session_id,
                history_db_path=await _history_db_path(request),
                agent_id=agent_id,
                question_index=body.question_index,
                answers=body.answers,
                system_prompt=sys_prompt,
                user_template=user_tpl,
            )
            res = {**res, "request_id": body.request_id,
                   "tool_call_id": tool_call_id, "mode": body.mode,
                   "template_id": tpl.get("id") or ""}
            _analysis.set_analysis(key, res)
            return res

        # Run as a task so「终止分析」can cancel it mid-flight.  Rationale: a
        # six-step chain can take a minute or more (model retries included);
        # without a handle the bubble could only hide its spinner while the run
        # kept burning tokens in the background.
        task = asyncio.ensure_future(_run())
        _ANALYSIS_TASKS[run_key] = task
        try:
            result = await task
        except asyncio.CancelledError:
            # Surface the cancellation as a normal (non-error-looking) payload;
            # the card shows "已终止分析" rather than a scary failure.
            cancelled = {
                "ok": False, "cancelled": True,
                "title": title, "model_id": body.model_id,
                "with_context": body.with_context, "parallel": bool(body.parallel),
                "question_index": body.question_index,
                "per_question": [], "elapsed": 0.0,
                "steps": _analysis.ANALYSIS_STEPS,
                "error": "分析已被用户终止",
                "request_id": body.request_id,
                "tool_call_id": tool_call_id, "mode": body.mode,
            }
            _analysis.set_analysis(key, cancelled)
            return {"ok": False, "cancelled": True,
                    "error": cancelled["error"], "analysis": cancelled}
        finally:
            if _ANALYSIS_TASKS.get(run_key) is task:
                _ANALYSIS_TASKS.pop(run_key, None)

        # The reason lives in `result["error"]` and is surfaced to the user by
        # the card; `ok` mirrors it at the top level for simple clients.
        return {"ok": result.get("ok", False),
                "error": result.get("error", ""),
                "analysis": result}

    @router.post("/analyze/cancel")
    async def cancel_analysis(body: CancelAnalysisRequest):
        """Stop a running analysis.  Idempotent: cancelling an unknown or
        already-finished analysis is reported truthfully via ``cancelled``."""
        key = _analysis_key(body.tool_call_id, body.request_id)
        stopped = _cancel_analysis(_task_key(key, body.question_index))
        if not stopped:
            # Tolerate a caller that omits question_index: fall back to the
            # card-level slot so a running whole-survey run is still stoppable.
            stopped = _cancel_analysis(key)
        return {"ok": True, "cancelled": stopped, "key": key}

    @router.get("/analysis")
    async def get_analysis(
        tool_call_id: str = Query(default=""),
        request_id: str = Query(default=""),
        question_index: Optional[int] = Query(default=None),
    ):
        """Return a stored analysis (so a card reload can re-show it).

        ``question_index`` narrows the lookup to one question's latest result —
        the per-question storage means re-analysing overwrites the previous one
        instead of accumulating history (REQ-007).
        """
        item = _analysis.get_question_analysis(
            _analysis_key(tool_call_id, request_id), question_index,
        )
        if not item:
            return {"ok": True, "found": False}
        return {"ok": True, "found": True, "analysis": item}

    @router.get("/decisions")
    async def get_decisions(
        session_id: str = Query(default=""),
        limit: int = Query(default=50),
    ):
        """List stored decision records (newest first)."""
        return {
            "ok": True,
            "items": _analysis.list_decisions(session_id, limit),
        }

    # ── Capsule preferences (single source of truth = disk) ──────────
    # The card used to keep these in localStorage keyed by tool_call_id, so
    # every new survey started from the defaults and the model selection was
    # "reset" each time.  The file below is shared by every card, every agent
    # and every browser, which is what makes the choice actually stick.
    @router.get("/prefs")
    async def get_prefs():
        return {"ok": True, "prefs": _load_prefs()}

    @router.post("/prefs")
    async def post_prefs(body: PrefsRequest):
        saved = _save_prefs(body.model_dump())
        return {"ok": True, "prefs": saved}

    # ── Prompt templates (REQ-001/003/005/006) ──────────────────────────
    @router.get("/templates")
    async def get_templates():
        """The whole library: built-ins (editable, not deletable) + custom."""
        return {"ok": True, "items": _all_templates(),
                "default_id": _analysis.DEFAULT_TEMPLATE_ID}

    @router.post("/templates")
    async def post_templates(body: TemplateBody):
        """Create or update a custom template (REQ-003).

        The return-format contract is enforced here (REQ-006): a system prompt
        that no longer asks for JSON ``{choice,confidence,reasoning}`` is
        rejected, so a bad edit can never silently produce unparsable output.
        """
        tpl = _sanitize_template(body.model_dump())
        if not tpl["name"].strip():
            return {"ok": False, "error": "模板名称不能为空"}
        err = _analysis.validate_template(tpl)
        if err:
            # 422 mirrors a validation failure; the card surfaces `error`.
            return JSONResponse(status_code=422,
                                content={"ok": False, "error": err})

        customs = _load_custom_templates()
        builtin_ids = {t["id"] for t in _analysis.BUILTIN_TEMPLATES}
        if not tpl["id"]:
            tpl["id"] = "tpl-" + uuid.uuid4().hex[:12]
        tpl["builtin"] = tpl["id"] in builtin_ids
        # Same id → replace (supports editing a builtin, persisted as override).
        replaced = False
        for i, c in enumerate(customs):
            if c.get("id") == tpl["id"]:
                customs[i] = tpl
                replaced = True
                break
        if not replaced:
            customs.append(tpl)
        _save_custom_templates(customs)
        return {"ok": True, "items": _all_templates(), "saved": tpl}

    @router.delete("/templates/{template_id}")
    async def delete_template(template_id: str):
        """Delete a CUSTOM template.  Built-ins cannot be deleted (REQ-003)."""
        builtin_ids = {t["id"] for t in _analysis.BUILTIN_TEMPLATES}
        if template_id in builtin_ids:
            return JSONResponse(
                status_code=403,
                content={"ok": False, "error": "内置模板不可删除，但可以编辑"},
            )
        customs = _load_custom_templates()
        remaining = [c for c in customs if c.get("id") != template_id]
        if len(remaining) == len(customs):
            return JSONResponse(status_code=404,
                                content={"ok": False, "error": "模板不存在"})
        _save_custom_templates(remaining)
        return {"ok": True, "items": _all_templates()}

    return router


# ══════════════════════════════════════════════════════════════════════
# Helpers
# ══════════════════════════════════════════════════════════════════════

def _parse_tool_input(tool_call: Any) -> dict:
    """Return the tool call's input as a dict.

    agentscope 2.x stores ``ToolCallBlock.input`` as a JSON **string**
    (validated by pydantic), so a plain ``getattr(..., "input")`` is not
    enough — it must be decoded.

    Some models (notably DeepSeek-V4-Flash) append trailing garbage after
    an otherwise valid JSON object.  Strict ``json.loads`` rejects that
    with "Extra data", which used to surface as a bogus "questions 不能为空"
    failure.  The host already recovers such payloads via ``raw_decode``
    (see ``qwenpaw/agents/utils/tool_message_utils.py``), so mirror that
    behaviour here instead of giving up.
    """
    raw = getattr(tool_call, "input", None)
    if isinstance(raw, dict):
        return dict(raw)
    if isinstance(raw, str) and raw.strip():
        try:
            parsed = json.loads(raw)
        except (ValueError, TypeError):
            # Recover the leading valid object (tolerates trailing garbage).
            try:
                start = json.decoder.WHITESPACE.match(raw, 0).end()
                parsed, _ = json.JSONDecoder().raw_decode(raw, start)
            except (ValueError, TypeError):
                logger.warning(
                    "question_modal: input is not valid JSON: %r", raw[:200],
                )
                return {}
        return parsed if isinstance(parsed, dict) else {}
    return {}


def _fmt_attachments(items: Any) -> str:
    """Render an attachment list as「名（大小）」, tolerant of odd shapes."""
    if not isinstance(items, list) or not items:
        return ""
    names: list[str] = []
    for it in items:
        if isinstance(it, dict):
            name = str(it.get("file_name") or it.get("name") or "文件")
            size = it.get("size")
        else:
            name, size = str(it), None
        if isinstance(size, (int, float)) and size > 0:
            mb = size / (1024 * 1024)
            size_s = f"{size} B" if size < 1024 else (
                f"{size / 1024:.1f} KB" if size < 1024 * 1024 else f"{mb:.1f} MB"
            )
            names.append(f"{name}（{size_s}）")
        else:
            names.append(name)
    return "、".join(names)


def _format_answer_for_llm(answer: dict) -> str:
    """Render the user's answer as readable text plus the raw JSON.

    The raw JSON is kept because the upstream contract promises it; the
    readable block makes the model's life much easier.
    """
    if answer.get("skipped"):
        return "用户跳过了本次问卷。\n" + json.dumps(
            {"skipped": True}, ensure_ascii=False,
        )

    answers = answer.get("answers") or {}
    lines: list[str] = ["【用户提交的问卷答案】"]
    for key, item in answers.items():
        if not isinstance(item, dict):
            continue
        q_type = item.get("type", "text")
        value = item.get("value", "")
        other = item.get("other", "") or ""
        display = value
        if isinstance(value, list):
            display = "、".join(str(v) for v in value)
        if other:
            display = f"{display}（其他：{other}）" if display else other
        # Files the user attached under this question's「其他」box.
        att_s = _fmt_attachments(item.get("attachments"))
        if att_s:
            display = f"{display}（附件：{att_s}）" if display else f"（附件：{att_s}）"
        # Per-question skip: the user stepped past this one without answering.
        # Keep the line so the model knows the question was *seen and skipped*,
        # rather than silently missing from the answer set.
        if item.get("skipped") or not str(display).strip():
            display = "（用户跳过本题）"
        lines.append(f"- {key} [{_TYPE_LABELS.get(q_type, q_type)}] {display}")

    final_other = answer.get("other") or ""
    if final_other:
        lines.append(f"- 其他意见：{final_other}")

    final_att = _fmt_attachments(answer.get("attachments"))
    if final_att:
        lines.append(f"- 其他意见附件：{final_att}")

    lines.append("")
    lines.append(json.dumps(answer, ensure_ascii=False))
    return "\n".join(lines)


def _opt_text(o: Any) -> str:
    """Render one option as text.

    Options are documented as plain strings, but a model occasionally emits
    ``{"label": ..., "value": ...}``.  ``'、'.join(options)`` raised TypeError
    on those and killed the whole tool call, so normalise defensively.
    """
    if isinstance(o, dict):
        return str(o.get("label") or o.get("value") or "")
    return str(o)


def _build_summary(title: str, questions: list[dict]) -> str:
    """Human-readable question summary (shown in the tool-call bubble)."""
    lines = [f"❓ **{title or '问卷'}**"]
    for i, q in enumerate(questions):
        q_type = q.get("type", "text")
        q_title = q.get("title", f"Q{i + 1}")
        label = _TYPE_LABELS.get(q_type, q_type)
        options = q.get("options") or []
        suffix = f"（{'、'.join(_opt_text(o) for o in options)}）" if options else ""
        # Surface the model's own recommendation to the model on the next turn,
        # so it stays consistent with what the user saw / auto-accepted.
        rec = q.get("recommended")
        if rec:
            rec_txt = "、".join(rec) if isinstance(rec, (list, tuple)) else str(rec)
            suffix += f" ⟨推荐：{rec_txt}⟩"
        lines.append(f"{i + 1}. [{label}] {q_title}{suffix}")
    return "\n".join(lines)


async def _notify_bubble_removed_doc() -> None:  # pragma: no cover
    """Placeholder kept only to document a deliberate REMOVAL.

    The upstream plugin pushed ``question_modal_question:<id>`` into the host's
    ``console_push_store``.  That store feeds the host's own top-right
    notification bubble, whose only affordance is "close" — and closing it
    does NOT resolve this pending question, so the agent stayed blocked
    forever.  The helper was deleted on purpose; the frontend discovers
    questions by polling ``/api/question-modal/pending`` instead.
    """
    return None

# ══════════════════════════════════════════════════════════════════════
# System-prompt guidance (plugin-owned, self-contained)
#
# The tool description alone was not enough: models kept writing plain-text
# option lists ("甲/乙/丙") instead of calling the tool.  This section is
# contributed by the plugin itself through the host's official
# ``register_prompt_section`` hook — it depends on NO skill file, and it
# appears / disappears together with the plugin.
# ══════════════════════════════════════════════════════════════════════

_PROMPT_SECTION = """## question_modal 工具（交互式选项）

当你需要用户做**选择、裁定或澄清**时，使用 `question_modal` 工具以问卷形式收集答案，
**不要**在回复正文里罗列选项后等待用户手打回复。

- 适用场景：二选一/多选一、方案取舍、范围确认、需要用户拍板的阻断项、需要补充说明。
- 用法：把每个选项放进 `questions[].options`；需要用户自由输入时用 `type: "text"`。
- 条件题：后一题依赖前一题答案时加 `showIf`（如 `{"q0": ["选项B"]}`），
  该题会在用户选中前置选项后自动出现，无需另发一轮。
- 选择题会自动附带「其他」输入框；问卷末页有独立的「其他意见」框。
- 判定标准：若你正准备写「甲/乙/丙」「A 还是 B」这类让用户二选一的内容，
  就应该改用 `question_modal` —— 纯文字选项用户无法点选，是无效的交互。
- 用户可跳过本题或整份问卷；跳过或超时后不要再等待，直接基于已有信息继续推进。

示例：

    question_modal(
      title="需求确认",
      questions=[
        {"type": "single", "title": "你要的是哪种实现方式？",
         "options": ["1:1 复刻这份 HTML", "用 pm 设计器做表单"]},
        {"type": "single", "title": "打印页面要新建能力还是先不做？",
         "options": ["新建能力（走需求分析流程）", "先不做"],
         "showIf": {"q0": ["用 pm 设计器做表单"]}},
        {"type": "text", "title": "其他补充说明"}
      ]
    )"""


def _prompt_provider(agent: Any) -> str:  # noqa: ARG001
    """Return the guidance text; the host calls this once per request."""
    return _PROMPT_SECTION



# ══════════════════════════════════════════════════════════════════════
# Middleware (the 2.x replacement for the old _acting monkey-patch)
# ══════════════════════════════════════════════════════════════════════

def _import_agentscope():
    """Import the agentscope primitives used by the middleware."""
    from agentscope.middleware import MiddlewareBase
    from agentscope.tool import ToolResponse

    return MiddlewareBase, ToolResponse


_MiddlewareBase, _ToolResponse = _import_agentscope()


class QuestionModalMiddleware(_MiddlewareBase):
    """Intercept ``question_modal`` tool calls and block until the user answers.

    Every other tool is passed straight through to ``next_handler``.
    """

    async def on_acting(
        self,
        agent: Any,
        input_kwargs: dict[str, Any],
        next_handler: Callable[..., AsyncGenerator[Any, None]],
    ) -> AsyncGenerator[Any, None]:
        tool_call = input_kwargs.get("tool_call")
        name = getattr(tool_call, "name", None)

        if name != "question_modal":
            async for item in next_handler():
                yield item
            return

        params = _parse_tool_input(tool_call)
        questions: list[dict] = params.get("questions") or []
        title: str = params.get("title") or "请回答以下问题"

        if not isinstance(questions, list) or not questions:
            yield _ToolResponse(
                content=[{
                    "type": "text",
                    "text": "question_modal 调用失败：questions 不能为空。",
                }],
            )
            return

        request_context = getattr(agent, "_request_context", None) or {}
        session_id = str(request_context.get("session_id", "") or "")
        agent_id = str(request_context.get("agent_id", "") or "")
        user_id = str(request_context.get("user_id", "") or "")
        channel = str(request_context.get("channel", "") or "")

        svc = get_question_service()
        pending = await svc.create(
            session_id=session_id,
            agent_id=agent_id,
            user_id=user_id,
            channel=channel,
            title=title,
            questions=questions,
            tool_call_id=str(getattr(tool_call, "id", "") or ""),
        )

        # Remember the question list too, so a reloaded card can address the
        # right pending record by tool_call_id instead of guessing.
        _register_question(pending.request_id, session_id, questions)

        # NOTE: do **not** push into the host's console_push_store here.
        # That store feeds the host's own top-right notification bubble,
        # which has a single "close" affordance and — crucially — closing
        # it does NOT resolve this pending question.  Doing so produced a
        # dead-end bubble and left the agent blocked forever.  The frontend
        # panel discovers the question by polling /api/question-modal/pending.

        summary = _build_summary(title, questions)
        logger.info(
            "question_modal intercepted: request=%s session=%s questions=%d",
            pending.request_id[:8], session_id[:8] or "-", len(questions),
        )

        try:
            timeout = _resolve_timeout_secs()
            if timeout > 0:
                answer = await asyncio.wait_for(
                    asyncio.shield(pending.future), timeout=timeout,
                )
            else:
                answer = await pending.future
        except asyncio.TimeoutError:
            # Never leave the agent blocked forever: resolve as skipped
            # and tell the model explicitly so it can carry on.
            try:
                await asyncio.shield(svc.skip(pending.request_id))
            except Exception:  # noqa: BLE001
                logger.debug("skip on timeout failed", exc_info=True)
            logger.warning(
                "question_modal timed out after %.0fs (request=%s) — "
                "auto-skipped so the agent can continue",
                timeout, pending.request_id[:8],
            )
            yield _ToolResponse(content=[{
                "type": "text",
                "text": (
                    f"{summary}\n\n"
                    f"【用户未在 {timeout:.0f} 秒内作答，问卷已自动跳过】\n"
                    '{"skipped": true, "reason": "timeout"}\n'
                    "请不要再等待，直接基于已有信息继续推进；"
                    "如确有必要，可稍后再次调用 question_modal。"
                ),
            }])
            return
        except asyncio.CancelledError:
            # Request interrupted (user pressed stop) — clean the pending
            # entry so it never resolves the REST path later.
            try:
                await asyncio.shield(svc.skip(pending.request_id))
            except Exception:  # noqa: BLE001
                logger.debug("skip on cancel failed", exc_info=True)
            raise
        finally:
            if pending.future is not None and not pending.future.done():
                pending.future.cancel()

        text = f"{summary}\n\n{_format_answer_for_llm(answer or {})}"
        yield _ToolResponse(content=[{"type": "text", "text": text}])


def _middleware_factory(ctx: Any, agent_config: Any) -> Any:
    """Return the middleware instance for every request."""
    try:
        agent_id = getattr(ctx, "agent_id", None) or "-"
        logger.info(
            "question-modal middleware assembled (agent=%s)", agent_id,
        )
        return QuestionModalMiddleware()
    except Exception:  # noqa: BLE001
        logger.exception("question-modal middleware factory failed")
        return None


# ══════════════════════════════════════════════════════════════════════
# Plugin registration
# ══════════════════════════════════════════════════════════════════════

class QuestionModalPlugin:
    """Ask-User plugin (QwenPaw 2.x port)."""

    def register(self, api: PluginApi) -> None:
        logger.info("Registering question-modal plugin (2.x port)...")

        # ── 1. Tool: declare question_modal so the LLM can discover it ──
        try:
            from .tools import question_modal as question_modal_func

            api.register_tool(
                tool_name="question_modal",
                tool_func=question_modal_func,
                description=(
                    "向用户弹出一个多页问卷并等待回答。"
                    "**硬性规则：任何需要用户在若干候选项之间做选择、裁定或确认的场景，"
                    "都必须调用本工具；严禁在回复正文里用编号列表、「甲/乙/丙」「A 还是 B」、"
                    "表格或问句罗列选项让用户手打回复——纯文字选项用户无法点选，属无效交互。**"
                    "判定口诀：若你正准备输出「1. … 2. … 3. …」让用户挑一条，"
                    "或以「是否…？」「要不要…？」「要继续还是暂停？」结尾等待用户回答，"
                    "就该改用 question_modal。"
                    "参数：questions (问题列表), title (标题,可选)。"
                    "问题类型：single(单选), multi(多选), text(问答)。"
                    "**一道题允许勾选多个答案时用 multi（回传为数组），二选一走 single；"
                    "不要为了多选而把它拆成多道是/否单选题。**"
                    "所有选择题均含'其他'文本框，其下可添加附件；"
                    "问卷末页有独立'其他意见'框（同样支持添加附件）。"
                    "支持条件题：任选题可加 showIf（如 {\"q0\":[\"选项B\"]}），"
                    "用户选中前置选项后该题自动出现，实现基于前题答案的动态联动。"
                    "**推荐选项：你可以（也应当在有明确倾向时）为每道选择题标注推荐项，"
                    "字段名 recommended，值是选项原文（多选可用数组，如 [\"A\",\"C\"]，"
                    "单选直接用字符串）。标注后用户可在「只用推荐」模式下不调用模型直接采纳；"
                    "没有明确倾向时不要标注，留空即可。**"
                    "用户可以跳过本题或整份问卷；跳过或超时后不要再等待，"
                    "基于已有信息继续推进。"
                ),
                icon="❓",
                enabled=False,
                tool_type="internal",
            )
        except Exception:  # noqa: BLE001
            logger.exception("failed to register question_modal tool")

        # ── 2. Middleware: the real interception + blocking logic ──
        try:
            api.register_middleware(_middleware_factory, priority=100)
        except Exception:  # noqa: BLE001
            logger.exception("failed to register question-modal middleware")

        # ── 3. REST API for the frontend modal ──
        try:
            api.register_http_router(
                build_router(),
                prefix="/question-modal",
                tags=["question-modal"],
            )
        except Exception:  # noqa: BLE001
            logger.exception("failed to register question-modal HTTP router")

        # ── 4. System-prompt guidance: tell the model WHEN to use the tool ──
        # Self-contained (no skill dependency).  The tool description alone
        # did not prevent models from writing plain-text option lists.
        try:
            api.register_prompt_section(
                name="question-modal-usage",
                after="workspace",
                provider=_prompt_provider,
                priority=100,
            )
            logger.info("✓ question-modal prompt section registered")
        except Exception:  # noqa: BLE001
            logger.exception("failed to register question-modal prompt section")

        # ── 5. Shutdown hook: never leave an agent parked ──
        #
        # Unloading / hot-reloading this plugin destroys the REST routes that
        # would resolve a pending survey, so every parked Future becomes
        # unresolvable.  The host then keeps the old agent instance alive
        # ("Tasks are still active for old instance …") and every new message
        # in those chats answers「A task is already running」— forever.
        # Resolving them as skipped on the way out keeps the chat usable.
        try:
            async def _on_shutdown() -> None:
                try:
                    n = await get_question_service().release_all("plugin_unloaded")
                    if n:
                        logger.info(
                            "question-modal shutdown released %d blocked question(s)", n,
                        )
                except Exception:  # noqa: BLE001
                    logger.exception("question-modal shutdown release failed")

            api.register_shutdown_hook("question-modal_release_pending", _on_shutdown)
            logger.info("✓ question-modal shutdown hook registered")
        except Exception:  # noqa: BLE001
            logger.exception("failed to register question-modal shutdown hook")

        logger.info("✓ question-modal plugin registered")


plugin = QuestionModalPlugin()
