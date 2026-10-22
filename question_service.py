# -*- coding: utf-8 -*-
"""Question service for the question-modal plugin.

Manages pending questions with asyncio Futures — an agent's tool call
blocks on the Future until the user submits answers (or skips) via the
plugin's REST API.

Adapted for QwenPaw 2.x: unchanged in spirit from the upstream MIT
implementation, but the caller is now an ``on_acting`` middleware
instead of a monkey-patched ``QwenPawAgent._acting``.
"""
from __future__ import annotations

import asyncio
import json
import logging
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PLUGIN_DIR = Path(__file__).parent.resolve()
# Pending records must outlive the module: the host hot-reloads plugins, and
# a reload used to wipe an open questionnaire, stranding its card forever.
_PENDING_FILE = _PLUGIN_DIR / "pending_questions.json"

# Where the process-wide *state* lives.  Deliberately NOT prefixed with the
# plugin's module name (``plugin_question_modal``), so it survives the loader's
# hot-reload sweep of ``sys.modules`` — see QuestionService.__init__.
_SHARED_MODULE_KEY = "_question_modal_shared_state"


class _SharedState:
    """Process-wide mutable state, deliberately re-loadable.

    Only the *data* lives here (the pending table and its lock) — never the
    service object itself.  Sharing the whole instance would freeze its method
    code at first creation, so a hot reload could never pick up new backend
    code.  Keeping the container shared and letting each reload build a fresh
    ``QuestionService`` gives us both: unreleased Futures survive, and new
    logic takes effect.
    """

    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.pending: dict[str, Any] = {}
        # Set once the on-disk records have been reconciled.  A reload must
        # NOT re-run that step: the records in memory still own live Futures,
        # and re-reading the file would turn them into unreachable orphans.
        self.restored = False

# GC thresholds
_GC_MAX_AGE_SECONDS = 3600.0
_GC_MAX_COMPLETED = 200
# A *pending* questionnaire is an intentionally blocking interaction: the
# agent's coroutine is parked on its Future until the user answers.  Aging
# it out would silently destroy the record while the agent is still waiting,
# so a survey left unanswered overnight could no longer be submitted (the
# REST call would 404 with "Question not found").  Effectively never expire;
# capacity is still bounded by _GC_MAX_PENDING below.
_GC_PENDING_MAX_AGE_SECONDS = 365 * 24 * 3600.0
# Records restored after a reload are "orphan": their Future died with the
# old process, so nothing can ever be resolved by them.  They only exist so a
# stranded card can discover the survey is over and close itself — a week is
# plenty for that, and keeps the file from growing without bound.
_GC_ORPHAN_MAX_AGE_SECONDS = 7 * 24 * 3600.0
_GC_MAX_PENDING = 100


@dataclass
class QuestionDef:
    """Definition of a single question."""

    type: str          # "single" | "multi" | "text"
    title: str
    options: list[str] | None = None  # for single/multi only
    answer: Any | None = None
    other: str = ""


@dataclass
class PendingQuestion:
    """In-memory record for one pending questionnaire."""

    request_id: str
    session_id: str = ""
    agent_id: str = ""
    user_id: str = ""
    channel: str = ""
    title: str = ""
    questions: list[dict] = field(default_factory=list)
    # The tool-call id this questionnaire belongs to.  Several question_modal
    # cards can coexist in one chat history, so the frontend must match
    # its own card against the right pending record — otherwise a stale
    # card resolves (or fails to resolve) someone else's question.
    tool_call_id: str = ""
    created_at: float = 0.0
    future: asyncio.Future | None = None
    status: str = "pending"
    resolved_at: float | None = None
    skip_reason: str = ""
    # True when this record was re-read from disk after a plugin reload: its
    # Future (and the agent turn parked on it) no longer exists, so the survey
    # can only be closed, never answered.
    orphan: bool = False

    def to_json(self) -> dict:
        """Serialisable form (the Future is deliberately not included)."""
        return {
            "request_id": self.request_id,
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "channel": self.channel,
            "title": self.title,
            "questions": self.questions,
            "tool_call_id": self.tool_call_id,
            "created_at": self.created_at,
            "status": self.status,
            "resolved_at": self.resolved_at,
            "skip_reason": self.skip_reason,
        }


class QuestionService:
    """Singleton service managing pending questions.

    The agent blocks on ``PendingQuestion.future``; the REST API resolves
    it when the user submits answers.
    """

    _instance: QuestionService | None = None

    @staticmethod
    def _shared() -> _SharedState:
        """Fetch (or create) the process-wide state container.

        Parks it in a dedicated ``sys.modules`` slot whose key is unrelated to
        the plugin's module name, so the loader's hot-reload sweep of
        ``plugin_question_modal`` / ``plugin_question_modal.*`` leaves it alone.
        """
        holder = sys.modules.get(_SHARED_MODULE_KEY)
        if holder is None:
            holder = type(sys)(_SHARED_MODULE_KEY)
            sys.modules[_SHARED_MODULE_KEY] = holder
        state = getattr(holder, "state", None)
        if state is None:
            state = _SharedState()
            holder.state = state
        return state

    def __init__(self) -> None:
        # Adopt the process-wide containers instead of fresh ones, so this
        # reloaded service resolves the *same* pending Futures the previous
        # generation parked.  Without this, releasing a survey hit an empty
        # table (404) while the old instance's agent stayed parked forever.
        shared = self._shared()
        self._lock = shared.lock
        self._pending = shared.pending
        if not shared.restored:
            # First service in this process: reconcile against the disk copy.
            self._restore_from_disk()
            shared.restored = True

    @classmethod
    def get_instance(cls) -> QuestionService:
        """Return this module generation's service instance.

        The *instance* is rebuilt on each hot reload (so new backend code takes
        effect) while the *state* it operates on is shared process-wide — see
        :meth:`_shared`.  Together these keep the two failure modes apart:
        reloads neither strand a parked Future nor freeze old code.
        """
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── persistence ────────────────────────────────────────────────
    #
    # The plugin module is re-imported on every hot reload / reinstall, which
    # creates a brand-new singleton.  A purely in-memory `_pending` therefore
    # vanished, and any card still on screen lost its request_id permanently:
    # every lookup returned found:false, so submit / skip answered
    # 「问卷尚未就绪，请稍候」 forever and the chat stayed blocked.
    #
    # Records are now mirrored to disk.  Anything restored this way is marked
    # `orphan` — the blocking Future is gone — and is reported to the frontend
    # as no-longer-pending so a stranded card can close itself out.

    def _restore_from_disk(self) -> None:
        """Load previously pending records (best effort; never raises)."""
        try:
            if not _PENDING_FILE.is_file():
                return
            raw = json.loads(_PENDING_FILE.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001 — a corrupt file must not break startup
            logger.warning("could not read %s; starting empty", _PENDING_FILE.name)
            return
        if not isinstance(raw, list):
            return
        now = time.time()
        for item in raw:
            try:
                if not isinstance(item, dict) or not item.get("request_id"):
                    continue
                pq = PendingQuestion(
                    request_id=str(item["request_id"]),
                    session_id=str(item.get("session_id", "") or ""),
                    agent_id=str(item.get("agent_id", "") or ""),
                    user_id=str(item.get("user_id", "") or ""),
                    channel=str(item.get("channel", "") or ""),
                    title=str(item.get("title", "") or ""),
                    questions=item.get("questions") or [],
                    tool_call_id=str(item.get("tool_call_id", "") or ""),
                    created_at=float(item.get("created_at") or now),
                    future=None,
                    status="orphan",
                    orphan=True,
                )
                self._pending[pq.request_id] = pq
            except Exception:  # noqa: BLE001
                continue
        if self._pending:
            logger.info(
                "Restored %d orphan questionnaire record(s) from disk "
                "(plugin was reloaded while they were pending)",
                len(self._pending),
            )
        self._gc_locked()

    def _persist_locked(self) -> None:
        """Mirror the current records to disk (atomic; failures non-fatal).

        Must be called while holding ``_lock``.
        """
        try:
            payload = [pq.to_json() for pq in self._pending.values()]
            tmp = _PENDING_FILE.parent / (_PENDING_FILE.name + ".tmp")
            tmp.write_text(
                json.dumps(payload, ensure_ascii=False), encoding="utf-8",
            )
            tmp.replace(_PENDING_FILE)
        except Exception:  # noqa: BLE001 — blocking a survey over I/O would be worse
            logger.warning("could not persist %s", _PENDING_FILE.name, exc_info=True)

    def forget(self, request_id: str) -> None:
        """Drop a record outright (used once a card has consumed its notice)."""
        self._pending.pop(request_id, None)
        self._persist_locked()

    async def create(self, **kwargs) -> PendingQuestion:
        """Create a new pending question record with an unresolved Future."""
        loop = asyncio.get_running_loop()
        pq = PendingQuestion(
            request_id=str(uuid.uuid4()),
            session_id=kwargs.get("session_id", ""),
            agent_id=kwargs.get("agent_id", ""),
            user_id=kwargs.get("user_id", ""),
            channel=kwargs.get("channel", ""),
            title=kwargs.get("title", ""),
            questions=kwargs.get("questions", []),
            tool_call_id=kwargs.get("tool_call_id", ""),
            created_at=time.time(),
            future=loop.create_future(),
        )

        async with self._lock:
            self._pending[pq.request_id] = pq
            self._gc_locked()
            self._persist_locked()

        logger.info(
            "Question pending: request_id=%s agent=%s q_count=%d",
            pq.request_id[:8], pq.agent_id, len(pq.questions),
        )
        return pq

    async def submit_answer(
        self, request_id: str, answers: dict, other: str = "",
        attachments: list | None = None,
    ) -> PendingQuestion | None:
        """Resolve a pending question with the user's answers."""
        async with self._lock:
            pq = self._pending.pop(request_id, None)
            if pq is None:
                logger.warning("Question %s not found", request_id[:8])
                return None
            if pq.orphan or pq.future is None or pq.future.done():
                # No LIVE Future to resolve.  Three shapes land here:
                #   • orphan  — restored from disk after a plugin reload, so the
                #               agent that asked is long gone;
                #   • None    — the record survived a cross-generation reload
                #               while its Future belonged to the old loop;
                #   • done    — the waiting call already finished or was
                #               cancelled, so nobody is parked on it any more.
                # In every case the caller MUST NOT report success: doing so is
                # exactly how the card showed「✓ 已完成」while the chat stayed
                # locked at 409 forever.  Return None so the route can answer
                # "orphan" and let the card tell the user the truth.
                self._persist_locked()
                logger.info(
                    "Question %s has no live future (%s); acknowledging "
                    "without resolving",
                    request_id[:8],
                    "orphan" if pq.orphan else ("no-future" if pq.future is None else "already-done"),
                )
                return None
            pq.status = "answered"
            pq.resolved_at = time.time()

        result = {
            "answers": answers,
            "other": other,
            # Files attached to the final「其他意见」box.  Must ride along in
            # the Future result, otherwise the model never sees them (the
            # per-question ones live inside `answers` and survive either way).
            "attachments": attachments or [],
            "skipped": False,
        }
        # ── Wake the parked agent FIRST ────────────────────────────────
        # 2026-10-22: `set_result` used to run *after* `_persist_locked()`
        # (which rewrites the whole pending file) and after the results cache
        # was written (~170 KB).  Every millisecond spent there is dead time
        # between the user pressing「提交」and the model resuming — and it is
        # pure spinning: the agent has everything it needs from `result`.
        # Resolving the Future first also lets the host start the (expensive)
        # model call while the bookkeeping below finishes.
        if pq.future and not pq.future.done():
            pq.future.set_result(result)

        # Bookkeeping after the wake-up: status mirror + results cache.
        # NOTE `self._lock` is an **asyncio.Lock**, so it must be awaited —
        # a plain `with` raises TypeError and would leave the pending file
        # stale (the record stays on disk after being answered).
        async with self._lock:
            self._persist_locked()

        logger.info(
            "Question %s answered (%d answers)",
            request_id[:8], len(answers),
        )
        return pq

    async def skip(self, request_id: str) -> PendingQuestion | None:
        """Resolve a pending question with a skip marker."""
        async with self._lock:
            pq = self._pending.pop(request_id, None)
            if pq is None:
                return None
            if pq.orphan or pq.future is None or pq.future.done():
                # No live Future to resolve (see submit_answer for the three
                # shapes).  Return None so the route does not claim「已跳过」.
                self._persist_locked()
                logger.info(
                    "Question %s skip-acknowledged without a live future",
                    request_id[:8],
                )
                return None
            pq.status = "skipped"
            pq.resolved_at = time.time()
            self._persist_locked()

        if pq.future and not pq.future.done():
            pq.future.set_result({"skipped": True})

        logger.info("Question %s skipped", request_id[:8])
        return pq

    async def get_by_tool_call(self, tool_call_id: str) -> PendingQuestion | None:
        """Find a pending question by the tool-call id it belongs to."""
        if not tool_call_id:
            return None
        async with self._lock:
            for pq in self._pending.values():
                if pq.tool_call_id == tool_call_id:
                    return pq
        return None

    async def cancel_all_by_session(self, session_id: str) -> int:
        """Cancel all pending questions for a session."""
        count = 0
        async with self._lock:
            to_remove = [
                rid for rid, pq in self._pending.items()
                if pq.session_id == session_id
            ]
            for rid in to_remove:
                pq = self._pending.pop(rid)
                pq.status = "cancelled"
                if pq.future and not pq.future.done():
                    pq.future.set_result({"skipped": True})
                count += 1
            if count:
                self._persist_locked()
        if count:
            logger.info(
                "Cancelled %d questions for session %s",
                count, session_id[:8],
            )
        return count

    async def release_all(self, reason: str = "plugin_unloaded") -> int:
        """Resolve every outstanding Future so no agent stays parked.

        Called from the plugin's shutdown hook.  Without it, unloading or
        hot-reloading the plugin leaves each blocked ``question_modal`` call
        waiting on a Future that can never be resolved (the REST route that
        would resolve it is gone with the module), so the host keeps the old
        agent instance alive and every new message in that chat answers
        「A task is already running」— permanently.

        Records are *skipped*, not deleted, so a card still on screen gets a
        coherent「本次问卷已失效」notice on its next probe.
        """
        released = 0
        async with self._lock:
            for pq in self._pending.values():
                if pq.orphan:
                    continue
                pq.status = "skipped"
                pq.resolved_at = time.time()
                pq.skip_reason = reason
                fut = pq.future
                if fut is not None and not fut.done():
                    try:
                        fut.set_result({"skipped": True, "reason": reason})
                        released += 1
                    except Exception:  # noqa: BLE001 — loop may already be gone
                        logger.debug(
                            "could not resolve future for %s", pq.request_id[:8],
                            exc_info=True,
                        )
            self._persist_locked()
        if released:
            logger.info(
                "Released %d outstanding questionnaire(s) on shutdown (%s)",
                released, reason,
            )
        return released

    async def get_request(self, request_id: str) -> PendingQuestion | None:
        """Get a pending request by ID."""
        async with self._lock:
            return self._pending.get(request_id)

    async def list_pending(self, session_id: str = "") -> list[PendingQuestion]:
        """Snapshot of pending requests, optionally filtered by session."""
        async with self._lock:
            items = list(self._pending.values())
        if session_id:
            items = [pq for pq in items if pq.session_id == session_id]
        return items

    def _gc_locked(self) -> None:
        """Clean up stale entries (must hold _lock)."""
        now = time.time()
        to_remove = []
        for rid, pq in self._pending.items():
            if pq.orphan and now - pq.created_at > _GC_ORPHAN_MAX_AGE_SECONDS:
                # Its only purpose was to let a stranded card converge.
                to_remove.append(rid)
            elif pq.status != "pending" and now - pq.created_at > _GC_MAX_AGE_SECONDS:
                to_remove.append(rid)
            elif (
                pq.status == "pending"
                and not pq.orphan
                and now - pq.created_at > _GC_PENDING_MAX_AGE_SECONDS
            ):
                to_remove.append(rid)

        for rid in to_remove:
            self._pending.pop(rid, None)

        # Hard cap
        if len(self._pending) > _GC_MAX_PENDING:
            sorted_oldest = sorted(
                self._pending.items(), key=lambda x: x[1].created_at,
            )
            for rid, _ in sorted_oldest[: len(self._pending) - _GC_MAX_PENDING]:
                self._pending.pop(rid, None)
            self._persist_locked()


def get_question_service() -> QuestionService:
    """Convenience accessor for the singleton."""
    return QuestionService.get_instance()
