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
import logging
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

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


class QuestionService:
    """Singleton service managing pending questions.

    The agent blocks on ``PendingQuestion.future``; the REST API resolves
    it when the user submits answers.
    """

    _instance: QuestionService | None = None

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._pending: dict[str, PendingQuestion] = {}

    @classmethod
    def get_instance(cls) -> QuestionService:
        """Get or create the singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

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
        if pq.future and not pq.future.done():
            pq.future.set_result(result)

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
            pq.status = "skipped"
            pq.resolved_at = time.time()

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
            logger.info(
                "Cancelled %d questions for session %s",
                count, session_id[:8],
            )
        return count

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
            if pq.status != "pending" and now - pq.created_at > _GC_MAX_AGE_SECONDS:
                to_remove.append(rid)
            elif (
                pq.status == "pending"
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


def get_question_service() -> QuestionService:
    """Convenience accessor for the singleton."""
    return QuestionService.get_instance()
