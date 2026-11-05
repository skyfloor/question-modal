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
import threading
import time
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

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

# ── Empty-answer gate audit trail ─────────────────────────────────
# The strict gate (用户裁定 2026-10-21) rejects a「提交」while any visible
# question is unanswered.  A rejection fires NO network request the backend
# normally sees, and the toast is transient — so "was it actually blocked?"
# had no hard evidence either way.  The card POSTs one line here every time
# the gate fires, carrying its OWN bundle tag: that lets us tell apart
#   (a) the gate logic not running  vs
#   (b) the browser executing a stale bundle (a reload that didn't take).
_GATE_FILE = _PLUGIN_DIR / "gate_blocks.json"


def _remember_gate_block(payload: dict) -> None:
    """Append one gate-rejection record (bounded) and log it.

    Best-effort: a broken audit file must never break a live survey, so every
    failure is swallowed to a warning.  Kept to the last 200 entries.
    """
    try:
        items: list[dict] = []
        if _GATE_FILE.is_file():
            data = json.loads(_GATE_FILE.read_text(encoding="utf-8"))
            if isinstance(data, list):
                items = data
        items.append(payload)
        # d5：上限读全局配置 gate_log_limit（0 = 不保留）。每次写入现读，
        # 改完立即生效，不必等 reload。
        try:
            limit = int(_load_prefs().get("gate_log_limit", 200) or 200)
        except (TypeError, ValueError):
            limit = 200
        limit = max(0, min(1000, limit))
        if limit <= 0:
            items = []
        elif len(items) > limit:
            items = items[-limit:]
        tmp = _GATE_FILE.parent / (_GATE_FILE.name + ".tmp")
        tmp.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
        tmp.replace(_GATE_FILE)
    except Exception:  # noqa: BLE001 — audit trail is non-critical
        logger.warning("question_modal: could not persist gate block", exc_info=True)
    logger.info(
        "question_modal: GATE-BLOCK card=%s bundle=%s missing=%s answered=%s/%s",
        str(payload.get("tool_call_id") or "")[:24],
        payload.get("bundle"),
        payload.get("missing"),
        payload.get("answered"),
        payload.get("total"),
    )



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
# Serialises background writers so two submissions cannot interleave their
# tmp-file write + replace (each already uses a unique tmp name; this just
# keeps the number of concurrent open writes at one).
_PERSIST_LOCK = threading.Lock()


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
    """Read the persisted global prefs, falling back to the defaults.

    IMPORTANT: this used to copy only the keys listed in ``_PREFS_DEFAULTS``,
    which silently DROPPED any newer schema key (``slow_question_sec`` was
    written to disk but never read back — a setting that "saves" yet never
    takes effect).  Every schema key present on disk is now kept, so adding a
    setting needs no edit here.
    """
    try:
        if _PREFS_FILE.is_file():
            data = json.loads(_PREFS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                out = dict(_PREFS_DEFAULTS)
                for k in set(list(_PREFS_DEFAULTS) + list(SETTINGS_SCHEMA)):
                    if k in data:
                        out[k] = data[k]
                return out
    except Exception:  # noqa: BLE001 — a broken prefs file must not break a survey
        logger.warning("question_modal: could not read prefs", exc_info=True)
    return dict(_PREFS_DEFAULTS)


def _save_prefs(patch: dict) -> dict:
    """Merge a whitelisted patch into the prefs file (atomic write)."""
    cur = _load_prefs()
    # Every schema key is accepted here (validated + clamped by
    # ``sanitize_settings``), so adding a setting no longer means editing this
    # function — one schema, one validator, one merge path.
    cur.update(sanitize_settings(patch))
    cur["updated_at"] = time.time()
    try:
        tmp = _PREFS_FILE.parent / (_PREFS_FILE.name + ".tmp")
        tmp.write_text(json.dumps(cur, ensure_ascii=False), encoding="utf-8")
        tmp.replace(_PREFS_FILE)
    except Exception:  # noqa: BLE001 — the card keeps a localStorage mirror
        logger.warning("question_modal: could not persist prefs", exc_info=True)
    return cur


# ── Cache files (diagnostics tab) ───────────────────────────────────────
# The front-end bundle is injected at runtime, so seeing a new build normally
# means Ctrl+Shift+R.  These files are the plugin-side state that survives it;
# clearing them is what makes the refresh actually start from a clean slate.
#
# Two tiers, because they are NOT equally safe:
#   safe  — derived data.  Losing it loses nothing the user can still use.
#   risky — anything holding an UNSUBMITTED survey or its answers.  Clearing it
#           silently would destroy in-progress work, so the UI must opt in.
_PURGE_HINTS = {
    "gate_blocks.json": "拦截日志（用于排查，可随时重建）",
    "decisions.json": "AI 决策记录（历史，用于「携带上下文」参考）",
    "answered_results.json": "历史问卷答案（历史卡片回看依赖它）",
    "pending_questions.json": "尚未答完的问卷（清掉等于放弃它们）",
}

# Configuration and the template library are NOT caches: purging them would
# silently reset the user's settings, so they are hard-excluded from the
# whitelist and reported separately for the UI to display.
_PROTECTED_FILES = ("analysis_prefs.json", "session_prefs.json", "templates.json")

# ── Settings schema: the single source of truth for what is configurable ──
#
# Every entry keeps its default, accepted type/values and the range guard that
# stops a bad value from breaking a run.  ``scope`` says which layers may hold
# it: "both" = global default AND per-session override, "global" = global only.
#
# Hard-won guards:
#   * ``model_timeout_sec`` has a 30s floor — a timeout that is too tight makes
#     every analysis fail with an empty result (same failure mode as an
#     over-tight max_tokens).
#   * ``slow_question_sec`` = 0 means "off", so 0 is legal while negative is not.
SETTINGS_SCHEMA: dict[str, dict] = {
    # ── 作答 (batch 1) ──
    "mode": {
        "default": "manual", "type": "enum", "values": ["ai", "recommend", "manual"],
        "scope": "both", "batch": 1, "label": "默认答题模式",
    },
    "show_recommend_badge": {
        "default": True, "type": "bool", "scope": "both", "batch": 1,
        "label": "显示 AI 推荐标记",
    },
    "gate_unsaved": {
        "default": True, "type": "bool", "scope": "both", "batch": 1,
        "label": "未作答时拦截翻页",
    },
    "slow_question_sec": {
        "default": 60, "type": "int", "min": 0, "max": 600, "scope": "both",
        "batch": 1, "label": "题级计时提示",
    },
    "skip_mode": {
        "default": "per_question", "type": "enum",
        "values": ["per_question", "whole"], "scope": "both", "batch": 1,
        "label": "跳过方式",
    },
    # ── 分析 (batch 2) ──
    "model_id": {
        "default": "", "type": "str", "maxlen": 200, "scope": "both",
        "batch": 2, "label": "默认模型",
    },
    "template_id": {
        "default": "", "type": "str", "maxlen": 120, "scope": "both",
        "batch": 2, "label": "提示词模板",
    },
    "with_context": {
        "default": False, "type": "bool", "scope": "both", "batch": 2,
        "label": "携带上下文",
    },
    "parallel": {
        "default": False, "type": "bool", "scope": "both", "batch": 2,
        "label": "并行分析各题",
    },
    "model_timeout_sec": {
        "default": 120, "type": "int", "min": 30, "max": 600, "scope": "both",
        "batch": 2, "label": "单题分析超时",
    },
    # ── 显示 (batch 3) ──
    "badge_position": {
        "default": "left", "type": "enum", "values": ["left", "right"],
        "scope": "both", "batch": 3, "label": "推荐徽章位置",
    },
    "badge_style": {
        "default": "rect", "type": "enum", "values": ["rect", "round"],
        "scope": "both", "batch": 3, "label": "徽章外观",
    },
    "highlight_recommended": {
        "default": False, "type": "bool", "scope": "both", "batch": 3,
        "label": "推荐项底色",
    },
    "auto_number_options": {
        "default": True, "type": "bool", "scope": "both", "batch": 3,
        "label": "选项自动编号",
    },
    "fallback_title": {
        "default": True, "type": "bool", "scope": "both", "batch": 3,
        "label": "缺题干时显示「第 N 题」",
    },
    # ── 通知 (batch 5) ──
    "notify_manual_mode": {
        "default": False, "type": "bool", "scope": "both", "batch": 5,
        "label": "人工模式时提醒",
    },
    # ── 诊断 (batch 4) ──
    "wait_hint_sec": {
        "default": 180, "type": "int", "min": 30, "max": 3600, "scope": "both",
        "batch": 4, "label": "等待提示阈值",
    },
    "gate_log_limit": {
        "default": 200, "type": "int", "min": 0, "max": 1000, "scope": "global",
        "batch": 4, "label": "拦截记录条数",
    },
}


def _resolve_chat_id(
    chat_id: str = "", session_id: str = "", agent_id: str = "",
) -> str:
    """Turn whatever the front end has into the chat UUID we key on.

    The host exposes only ``session_id`` to front-end code, but ``session_id``
    is NOT unique across agents (two agents can own a chat with the same
    session_id), so every stored override is keyed by chat UUID.  This lookup
    bridges the two: an explicit chat_id wins, otherwise match on
    (session_id, agent_id), preferring an exact agent match.
    """
    if chat_id:
        return chat_id
    if not session_id:
        return ""
    rows = _iter_agent_chats()
    exact = [r for r in rows
             if r.get("session_id") == session_id and r.get("agent_id") == agent_id]
    if exact:
        return exact[0]["chat_id"]
    loose = [r for r in rows if r.get("session_id") == session_id]
    if len(loose) == 1:
        return loose[0]["chat_id"]
    return ""   # ambiguous or unknown — caller falls back to global only


def schema_defaults() -> dict:
    """The built-in defaults — layer ③ of the resolution chain."""
    return {k: v["default"] for k, v in SETTINGS_SCHEMA.items()}


def _coerce_setting(key: str, value: Any) -> tuple[bool, Any]:
    """Validate+cushion one value against the schema.

    Returns ``(ok, normalized)``.  Out-of-range numbers are CLAMPED (a user who
    types 5 into the timeout box gets the 30s floor, not a broken run); values
    of the wrong type are rejected outright.
    """
    spec = SETTINGS_SCHEMA.get(key)
    if not spec:
        return False, None
    kind = spec.get("type")
    if kind == "bool":
        if isinstance(value, bool):
            return True, value
        return False, None
    if kind == "int":
        # bool is a subclass of int — reject it explicitly.
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return False, None
        try:
            num = int(value)
        except (TypeError, ValueError):
            return False, None
        lo, hi = spec.get("min"), spec.get("max")
        if lo is not None and num < lo:
            num = lo
        if hi is not None and num > hi:
            num = hi
        return True, num
    if kind == "str":
        if not isinstance(value, str):
            return False, None
        cap = spec.get("maxlen")
        return True, (value[:cap] if cap else value)
    if kind == "enum":
        allowed = spec.get("values") or []
        if isinstance(value, str) and value in allowed:
            return True, value
        return False, None
    return False, None


def sanitize_settings(patch: Any) -> dict:
    """Keep only schema-known keys with valid (or clamped) values."""
    if not isinstance(patch, dict):
        return {}
    clean: dict = {}
    for key, value in patch.items():
        ok, norm = _coerce_setting(key, value)
        if ok:
            clean[key] = norm
    return clean


def _session_model_id(chat_id: str) -> str:
    """The model THIS conversation is using — the host's own definition.

    宿主前端那个模型胶囊显示的就是它：``runtime_context.model``
    （``qwenpaw/services/session_thinking.py:172`` 的 ``session_model()``，
    注释原文 "Read the selected model owned by this conversation"）。

    之前这里读的是 agent.json 的 ``active_model``，那是**agent 级**默认值。
    实测三者并不相同：
        会话 runtime_context.model → wd:deepseek-v4.1-flash   ← 用户界面上看到的
        agent.json active_model    → sensenova:deepseek-flash ← 旧实现读的（错）
    于是用户选「跟随当前对话模型」，卡片却显示另一个模型 —— 这就是
    「选择的是会话跟随，结果还是被强制更改成其他」的根因。

    读不到就返回空串，交给调用方回落到 agent 级。
    """
    if not chat_id:
        return ""
    try:
        from qwenpaw.services.session_thinking import session_model
    except Exception:  # noqa: BLE001
        return ""
    try:
        meta = _chat_meta(chat_id)
        slot = session_model(meta)
        pid = getattr(slot, "provider_id", "") or ""
        mdl = getattr(slot, "model", "") or ""
        return ("%s:%s" % (pid, mdl)) if pid and mdl else ""
    except Exception:  # noqa: BLE001
        logger.debug("question_modal: session_model lookup failed", exc_info=True)
        return ""


def _chat_meta(chat_id: str) -> dict:
    """``meta`` of one chat (holds ``runtime_context``), {} when unavailable.

    走 `_iter_agent_chats()`（直接读各 workspace 的 chats.json）而不是宿主的
    `get_chat_manager()`：后者是 **async** 函数且挂在 `app.chats.api` 上，
    同步调用只会静默抛异常 → 跟随逻辑永远回落到 agent 级（本轮踩过）。
    这条路径插件里已验证可用（/session-prefs 列表就在用它）。
    """
    if not chat_id:
        return {}
    try:
        for row in _iter_agent_chats():
            if row.get("chat_id") == chat_id:
                meta = row.get("_meta")
                return dict(meta) if isinstance(meta, dict) else {}
    except Exception:  # noqa: BLE001
        logger.debug("question_modal: chat meta lookup failed", exc_info=True)
    return {}


async def _agent_model_id(request: Any, agent_id: str) -> str:
    """Fallback: the agent's own default model (``agent.json active_model``)."""
    if request is None:
        return ""
    try:
        from qwenpaw.app.routers.providers import _load_agent_model
        slot = await _load_agent_model(request, agent_id)
        pid = getattr(slot, "provider_id", "") or ""
        mdl = getattr(slot, "model", "") or ""
        return ("%s:%s" % (pid, mdl)) if pid and mdl else ""
    except Exception:  # noqa: BLE001
        logger.debug("question_modal: could not load agent model", exc_info=True)
        return ""


async def _fill_follow_active(
    cfg: dict, request: Any = None, agent_id: str = "", chat_id: str = "",
) -> dict:
    """Fill「跟随当前对话模型」and the template-library default, SERVER-SIDE.

    用户裁定（2026-11-04）：卡片与设置页必须显示同一个值。此前卡片自己兜底
    （model_id 为空就去问 `/models/active`），而设置页没有这条路径 → 卡片显示
    `sensenova:deepseek-flash`、设置页显示空。两条独立的兜底 = 必然分叉。

    现在唯一的兜底在这里，两处都只读 `/effective-config` 的返回值：
      • ``model_id`` 为空 → 用该会话 agent 配置的对话模型（不写盘！）
      • ``template_id`` 为空 → 用模板库默认（``DEFAULT_TEMPLATE_ID``）

    返回值里只是「解析后的实际值」，磁盘上的选择保持为空 —— 这样「用户显式配了
    什么」与「实际用了什么」不会互相污染。``__follow_active__`` 标记让 UI 能显示
    「跟随当前对话模型（xxx）」而不是让用户以为是自己配的。
    """
    cfg["__follow_active__"] = False
    try:
        if not cfg.get("model_id"):
            model_id = _session_model_id(chat_id) or await _agent_model_id(
                request, agent_id,
            )
            if model_id:
                cfg["model_id"] = model_id
                cfg["__follow_active__"] = True
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: follow-active failed", exc_info=True)

    # Template: an unset selection means "use the library default".  The card
    # used to resolve this itself from its own list; doing it here means both
    # surfaces read the same id.
    try:
        if not cfg.get("template_id"):
            default_id = getattr(
                _analysis, "DEFAULT_TEMPLATE_ID", "builtin-default",
            )
            if default_id:
                cfg["template_id"] = default_id
    except Exception:  # noqa: BLE001
        pass
    return cfg


def resolve_effective(chat_id: str = "") -> dict:
    """Layer ③ → ② → ① merge.  THE ONLY entry point for reading settings.

    Nothing else in the plugin may splice these layers by hand: two independent
    merge implementations is exactly how a setting silently stops working.

    NOTE: this is the *merge* only (disk-backed layers).  The「跟随当前对话模型」
    resolution needs the request to reach the host, so it lives in
    :func:`_fill_follow_active` and is applied by the HTTP route.  Keeping them
    apart means a sync caller still gets a pure merge.
    """
    out = schema_defaults()

    # ② global defaults (analysis_prefs.json)
    try:
        out.update(sanitize_settings(_load_prefs()))
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not merge global prefs", exc_info=True,
        )

    # ① per-session override
    if chat_id:
        try:
            overrides = _load_session_prefs()
            sess = overrides.get(chat_id) if isinstance(overrides, dict) else None
            if isinstance(sess, dict):
                out.update(sanitize_settings(sess))
        except Exception:  # noqa: BLE001
            logger.warning(
                "question_modal: could not merge session prefs", exc_info=True,
            )

    # Report which keys came from an override so the UI can badge them.
    sources: dict = {}
    try:
        overrides = _load_session_prefs() if chat_id else {}
        sess = overrides.get(chat_id) if isinstance(overrides, dict) else None
        if isinstance(sess, dict):
            for key in sanitize_settings(sess):
                sources[key] = "session"
    except Exception:  # noqa: BLE001
        pass
    out["__sources__"] = sources
    return out


def _config_version() -> int:
    """Monotonic counter derived from the two files' mtimes.

    The front end only needs "did anything change since I last looked", not a
    durable number, so deriving it from mtimes avoids a third state file.
    """
    total = 0
    for path in (_PREFS_FILE, _SESSION_PREFS_FILE):
        try:
            if path.is_file():
                total += int(path.stat().st_mtime_ns)
        except Exception:  # noqa: BLE001
            pass
    return total


# ── Per-session (per-chat) setting overrides ───────────────────────────
#
# The scope model is "global default + session override": one global set of
# values (``analysis_prefs.json``), plus, for any chat that explicitly
# overrode something, one entry keyed by that chat.
#
# The key MUST be the chat UUID — ``session_id`` is NOT unique across agents
# (verified locally: the same ``session_id`` was observed under two different
# agent workspaces), so keying by it would make two conversations share one
# record.
#
# These helpers only persist and list overrides; reading them into the
# effective config is a later step.
_SESSION_PREFS_FILE = _PLUGIN_DIR / "session_prefs.json"


def _load_session_prefs() -> dict:
    """Read ``{chat_uuid: {...}}``; a broken file degrades to empty."""
    try:
        if _SESSION_PREFS_FILE.is_file():
            data = json.loads(_SESSION_PREFS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                sessions = data.get("sessions")
                if isinstance(sessions, dict):
                    return sessions
    except Exception:  # noqa: BLE001 — a broken file must not break a survey
        logger.warning(
            "question_modal: could not read session prefs", exc_info=True,
        )
    return {}


def _session_writable(settings: Any) -> dict:
    """Keep only keys a SESSION override is allowed to hold.

    Enforced here (the storage layer) rather than at the route, so no caller —
    route, script or future code — can slip a global-only key into an override.
    """
    clean: dict = {}
    for key, value in sanitize_settings(settings).items():
        spec = SETTINGS_SCHEMA.get(key) or {}
        if spec.get("scope", "both") == "both":
            clean[key] = value
    return clean


def _save_session_prefs(sessions: dict) -> None:
    """Atomic write of the whole session-prefs map.

    Every entry is re-filtered through ``_session_writable`` on the way in, so a
    hand-written or legacy file cannot smuggle in a global-only key.
    """
    try:
        if isinstance(sessions, dict):
            sessions = {
                k: _session_writable(v) for k, v in sessions.items()
                if isinstance(k, str) and k
            }
            sessions = {k: v for k, v in sessions.items() if v}
        payload = {"sessions": sessions, "updated_at": time.time()}
        tmp = _SESSION_PREFS_FILE.parent / (_SESSION_PREFS_FILE.name + ".tmp")
        tmp.write_text(
            json.dumps(payload, ensure_ascii=False), encoding="utf-8",
        )
        tmp.replace(_SESSION_PREFS_FILE)
    except Exception:  # noqa: BLE001 — listing still works in-process
        logger.warning(
            "question_modal: could not persist session prefs", exc_info=True,
        )


def _iter_agent_chats() -> list[dict]:
    """Enumerate every chat of every enabled agent.

    Returns ``[{chat_id, session_id, name, agent_id, agent_name}]``.

    Chat records live in ``<workspace_dir>/chats.json``, so the owning agent
    is simply *which workspace file the record came from*.  Everything is read
    defensively — a missing or corrupt file just yields no rows.
    """
    rows: list[dict] = []
    try:
        from qwenpaw.config.utils import load_config
        config = load_config()
        profiles = getattr(config.agents, "profiles", {}) or {}
    except Exception:  # noqa: BLE001 — never let listing break the plugin
        logger.warning(
            "question_modal: could not load agent config", exc_info=True,
        )
        return rows

    for agent_id, profile in profiles.items():
        try:
            if not getattr(profile, "enabled", True):
                continue
            workspace_dir = getattr(profile, "workspace_dir", None)
            if not workspace_dir:
                continue
            path = Path(workspace_dir) / "chats.json"
            if not path.is_file():
                continue
            raw = json.loads(path.read_text(encoding="utf-8"))
            items = raw if isinstance(raw, list) else (raw.get("chats") or [])
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                chat_id = item.get("id")
                if not chat_id:
                    continue
                rows.append({
                    "chat_id": str(chat_id),
                    "session_id": str(item.get("session_id") or ""),
                    "name": str(item.get("name") or ""),
                    # 私有：供 _session_model_id 读 runtime_context.model。
                    # 不对外暴露（/session-prefs 只挑已知字段）。
                    "_meta": item.get("meta") if isinstance(item.get("meta"), dict) else {},
                    "agent_id": str(agent_id),
                    "agent_name": str(
                        getattr(profile, "name", "") or agent_id
                    ),
                })
        except Exception:  # noqa: BLE001
            logger.warning(
                "question_modal: could not read chats for %s", agent_id,
                exc_info=True,
            )
    return rows


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
        # Unique tmp name: since this may now run in a background thread while
        # another submission persists, a FIXED ``answered_results.json.tmp``
        # would let two writers clobber each other mid-write and could publish
        # a truncated JSON (which _load_results would then fail to parse,
        # losing every cached answer).  A per-call suffix removes that race
        # entirely; ``os.replace`` stays atomic.
        tmp = _RESULTS_FILE.parent / (
            f"{_RESULTS_FILE.name}.{os.getpid()}.{threading.get_ident()}.tmp"
        )
        tmp.write_text(
            json.dumps(_RESULTS, ensure_ascii=False), encoding="utf-8",
        )
        tmp.replace(_RESULTS_FILE)
    except Exception:  # noqa: BLE001 - never break a submission over caching
        logger.warning("question_modal: could not persist results cache",
                       exc_info=True)
    finally:
        try:
            tmp.unlink(missing_ok=True)  # type: ignore[possibly-undefined]
        except Exception:  # noqa: BLE001
            pass


def _persist_results_async() -> None:
    """Persist the results cache WITHOUT blocking the submission path.

    Why: the cache is 300 entries (~170 KB), and the card must be woken by
    ``Future.set_result`` as early as possible — every millisecond between the
    user pressing「提交」and the agent being resumed shows up as dead time in
    the UI.  Measured cost of the synchronous write is ~1.5 ms, which is small
    but strictly ahead of the wake-up for no reason.

    Ordering guarantee we deliberately give up: a process crash in the
    microseconds between the wake-up and the write could lose this one entry.
    That only degrades the *history* card (which then falls back to the inline
    tool result), never the live submission.
    """
    def _run() -> None:
        with _PERSIST_LOCK:
            _persist_results()

    try:
        threading.Thread(target=_run, name="qm-persist-results", daemon=True).start()
    except Exception:  # noqa: BLE001
        # Thread creation failing must not cost the user their answer: fall
        # back to the synchronous path (cache correctness > 1.5 ms).
        _persist_results()


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
    # Non-blocking: the caller is the /answer route, which must return to the
    # card (and thereby let the parked agent resume) without waiting on ~170 KB
    # of JSON.  See _persist_results_async for the tradeoff we accept.
    _persist_results_async()


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


class GateBlockRequest(BaseModel):
    """One「提交」rejected by the strict empty-answer gate.

    ``bundle`` is the card's own build tag — the only reliable way to tell a
    logic bug apart from a browser that is still running an older bundle.
    """
    request_id: str = Field("", description="Question request ID")
    tool_call_id: str = Field("", description="Card tool_call_id")
    session_id: str = Field("", description="Session ID")
    missing: list[int] = Field(default_factory=list, description="Unanswered visible question numbers")
    answered: int = Field(0, description="How many visible questions WERE answered")
    total: int = Field(0, description="How many questions are visible")
    bundle: str = Field("", description="Card build tag (proves which bundle ran)")



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
    """Global-defaults patch.

    IMPORTANT: the four original fields are declared, but ``extra="allow"`` is
    REQUIRED — pydantic silently DROPS any key that is not declared here, so
    without it every new schema key (``slow_question_sec``, ``skip_mode``, …)
    would be accepted by the route and then thrown away before reaching
    ``sanitize_settings``.  That failure is invisible: the request returns 200
    and the setting simply never takes effect.
    """
    model_config = ConfigDict(extra="allow")

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

    @router.post("/gate-block", response_model=AnswerResponse)
    async def gate_block(body: GateBlockRequest):
        """Record that the strict empty-answer gate rejected a「提交」.

        Pure audit — nothing is resolved.  The card keeps staying open; this
        only gives us a durable, backend-visible trace carrying the card's own
        bundle tag, so a "the gate didn't fire" report can be checked against
        reality instead of a transient toast.
        """
        _remember_gate_block({
            "at": time.time(),
            "request_id": body.request_id,
            "tool_call_id": body.tool_call_id,
            "session_id": body.session_id,
            "missing": body.missing,
            "answered": body.answered,
            "total": body.total,
            "bundle": body.bundle,
        })
        return AnswerResponse(
            ok=True,
            message="gate-block recorded",
            request_id=body.request_id or "-",
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

    # ── Effective settings (the ONLY read path for cards + settings UI) ──
    @router.get("/effective-config")
    async def get_effective_config(
        request: Request,
        chat_id: str = "", session_id: str = "", agent_id: str = "",
    ) -> dict:
        """Return the merged settings for one chat.

        Layers: ③ built-in defaults → ② global defaults → ① session override,
        then :func:`_fill_follow_active` resolves「跟随当前对话模型」and the
        template-library default.  This endpoint is THE ONLY read path: the card
        and the settings panel both render exactly what it returns, with no
        fallbacks of their own (用户裁定 2026-11-04).
        ``__sources__`` tells the UI which keys came from an override, so it can
        badge them without re-implementing the merge.
        """
        # Accept session_id+agent_id too: the host never hands the front end a
        # chat UUID, so the caller cannot always supply one.
        chat_id = _resolve_chat_id(chat_id, session_id, agent_id)
        cfg = resolve_effective(chat_id)
        # agent_id may be supplied explicitly; otherwise fall back to the
        # request's own agent so「跟随当前对话模型」reads the right one.  An empty
        # id still works (the host resolver defaults to the request agent).
        cfg = await _fill_follow_active(cfg, request, agent_id, chat_id)

        # Which keys the global layer actually holds (vs pure defaults) — lets
        # the UI show "继承自全局" vs "内建默认".
        global_keys: list[str] = []
        try:
            global_keys = list(sanitize_settings(_load_prefs()).keys())
        except Exception:  # noqa: BLE001
            pass

        # 「当前会话模式 vs 全局默认模式」的判据：本 chat 是否已有会话覆盖条目。
        # 唯一权威是 session_prefs.json 里的条目，不推导（用户裁定 2026-11-04）。
        has_session = False
        try:
            ov = _load_session_prefs()
            has_session = bool(chat_id) and chat_id in (ov if isinstance(ov, dict) else {})
        except Exception:  # noqa: BLE001
            pass

        return {
            "ok": True,
            "chat_id": chat_id,
            "config": cfg,
            "has_session": has_session,
            "global_keys": global_keys,
            "version": _config_version(),
            "schema": [
                {
                    "key": k,
                    "type": v.get("type"),
                    "values": v.get("values"),
                    "min": v.get("min"),
                    "max": v.get("max"),
                    "scope": v.get("scope", "both"),
                    "batch": v.get("batch", 0),
                    "label": v.get("label", k),
                    "default": v.get("default"),
                }
                for k, v in SETTINGS_SCHEMA.items()
            ],
        }

    # ── Per-session overrides (global default + session override) ────────
    @router.get("/session-prefs")
    async def list_session_prefs() -> dict:
        """List only the chats that actually carry a session-level override.

        Two columns as requested: the conversation id and the owning agent.
        The chat UUID is included because ``session_id`` is not unique across
        agents (``cron-proxy-check`` exists under both ``default`` and
        another agent workspace).
        """
        overrides = _load_session_prefs()
        if not overrides:
            return {"sessions": [], "count": 0}

        lookup = {row["chat_id"]: row for row in _iter_agent_chats()}
        out: list[dict] = []
        for chat_id, values in overrides.items():
            info = lookup.get(chat_id)
            if not info:
                # The chat was deleted but its override survived.  List it so
                # the stale record stays visible instead of rotting silently.
                out.append({
                    "chat_id": chat_id,
                    "session_id": "",
                    "agent_id": "",
                    "agent_name": "",
                    "updated_at": (values or {}).get("updated_at", 0),
                    "missing": True,
                })
                continue
            out.append({
                "chat_id": chat_id,
                "session_id": info["session_id"],
                "agent_id": info["agent_id"],
                "agent_name": info["agent_name"],
                "updated_at": (values or {}).get("updated_at", 0),
                "missing": False,
            })
        out.sort(key=lambda r: r.get("updated_at") or 0, reverse=True)
        return {"sessions": out, "count": len(out)}

    @router.post("/session-prefs")
    async def write_session_prefs(body: dict) -> dict:
        """Merge one chat's session-level override (never replaces it).

        Semantics (2026-11-04, after the「保存后被强制成默认值」bug):
          • 非空 ``settings`` → **合并**进现存覆盖；未提交的键保持不变。
          • ``{"key": null}`` → 删掉该键的覆盖（回到全局默认）。
          • **空** ``settings`` → 保留旧语义：清空整条覆盖（UI 显式意图）。

        合并语义是根修：旧实现 `sessions[chat_id] = clean` 会抹掉请求里没带的
        键，而前端只提交「改动项」，于是改一项丢一片。
        """
        chat_id = (body or {}).get("chat_id")
        if not chat_id:
            chat_id = _resolve_chat_id(
                "", str((body or {}).get("session_id") or ""),
                str((body or {}).get("agent_id") or ""),
            )
        if not isinstance(chat_id, str) or not chat_id:
            raise HTTPException(
                status_code=400,
                detail="chat_id (or resolvable session_id) is required",
            )

        settings = (body or {}).get("settings")
        if settings is None:
            settings = {}
        if not isinstance(settings, dict):
            raise HTTPException(
                status_code=400, detail="settings must be an object",
            )

        # 「空对象」= 显式清空整条覆盖（旧的、也是 UI 依赖的语义）。
        # 与「合并」并存：有键就合并，没键才清空。
        clear_all = not settings

        sessions = _load_session_prefs()

        # ── 显式删除的键要**先**捞出来 ────────────────────────────────
        #
        # `sanitize_settings` 把 None 视为非法值直接丢弃（它只认 schema 声明的
        # 类型），所以「传 null 表示删掉这一项」必须在 sanitize 之前识别，否则
        # 永远传不进来。这里只接受 scope=both 的键，避免借删除通道动全局专属键。
        explicit_del: set = set()
        try:
            for key, value in (settings or {}).items():
                if value is None:
                    spec = SETTINGS_SCHEMA.get(key) or {}
                    if spec.get("scope", "both") == "both":
                        explicit_del.add(key)
        except Exception:  # noqa: BLE001
            explicit_del = set()

        # ``_session_writable`` also re-checks scope at the storage layer.
        clean: dict = _session_writable({
            k: v for k, v in (settings or {}).items() if v is not None
        })

        # ── MERGE, never replace ──────────────────────────────────────────
        #
        # 曾经写成 `sessions[chat_id] = clean`，即**整体替换**：请求里没带的
        # 键会被直接抹掉，然后回落到全局默认值。用户报的「保存后被强制设置成
        # 某个默认值」就是这条 —— 实测：有 5 项覆盖，只改 wait_hint_sec 保存后，
        # 记录只剩 {"wait_hint_sec": 200}，mode 回落到全局 recommend。
        #
        # 前端设置面板只提交「改动项」，卡片模式切换只提交 {mode}，两者都会
        # 触发这个抹除，于是越用丢得越多。
        #
        # 现在改为与现存值合并。显式删除某个键请用空值（见下）；
        # 清空整条覆盖请调 POST /session-prefs/clear。
        existing = sessions.get(chat_id)
        merged: dict = dict(existing) if isinstance(existing, dict) else {}
        merged.pop("updated_at", None)

        # 显式删除：回到全局默认。
        for key in explicit_del:
            merged.pop(key, None)
        # 其余键合并写入（不触碰未提交的键）。
        #
        # 空串**不**落成覆盖：字符串类设置的空值只表示「没有偏好」，等同于
        # 删掉该键。否则一个空 model_id 会被 __sources__ 标成 session，UI 便
        # 永远认为「用户显式设过」，跟随/回落逻辑被永久冻死。
        for key, value in clean.items():
            if isinstance(value, str) and value.strip() == "":
                merged.pop(key, None)
            else:
                merged[key] = value

        if clear_all:
            sessions.pop(chat_id, None)
            merged = {}
        elif merged:
            merged["updated_at"] = time.time()
            sessions[chat_id] = merged
        else:
            # 合并后没剩任何键 → 这条覆盖已无意义，整条移除。
            sessions.pop(chat_id, None)

        _save_session_prefs(sessions)
        return {
            "ok": True, "chat_id": chat_id, "stored": bool(merged),
            "values": merged,
        }

    @router.post("/session-prefs/clear")
    async def clear_session_prefs(body: dict) -> dict:
        """Drop one chat's ENTIRE session override (UI「清空本会话覆盖」).

        独立端点而不是靠「POST 空 settings」：合并语义上线后，空对象容易被
        误当成「什么都没改」，一个显式动词端点让意图无歧义，也让设置页的按钮
        有明确的后端对应物（而不是隐式依赖空 body 的巧合）。
        """
        chat_id = (body or {}).get("chat_id")
        if not chat_id:
            chat_id = _resolve_chat_id(
                "", str((body or {}).get("session_id") or ""),
                str((body or {}).get("agent_id") or ""),
            )
        if not isinstance(chat_id, str) or not chat_id:
            raise HTTPException(
                status_code=400,
                detail="chat_id (or resolvable session_id) is required",
            )
        sessions = _load_session_prefs()
        existed = chat_id in sessions
        sessions.pop(chat_id, None)
        _save_session_prefs(sessions)
        return {"ok": True, "chat_id": chat_id, "cleared": existed}

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
        # Per-question skip: the user stepped past this one via「跳过本题」.
        # #5: an EMPTY answer the user merely advanced past (下一步 without
        # choosing) is NOT a skip — it is「未作答」.  Conflating the two made
        # the model read "next question" as an explicit skip.  Only an explicit
        # skipped flag reads as跳过; a blank answer keeps its own wording so
        # the model can tell the user saw it but did not decide.
        if item.get("skipped"):
            display = "（用户跳过本题）"
        elif not str(display).strip():
            display = "（未作答）"
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
                    "参数：questions (问题列表), title (整份问卷的标题,可选；"
                    "注意此 title 是问卷总标题，与每道题的 title 无关)。"
                    "**题干（必做）：questions 里每一道题都必须带非空的 title 字段"
                    "（一句完整的疑问或待裁定陈述）；严禁只给 options 而省略题目"
                    "的 title——那样用户只会看到一排选项、不知道在问什么。**"
                    "问题类型：single(单选), multi(多选), text(问答)。"
                    "**一道题允许勾选多个答案时用 multi（回传为数组），二选一走 single；"
                    "不要为了多选而把它拆成多道是/否单选题。**"
                    "所有选择题均含'其他'文本框，其下可添加附件；"
                    "问卷末页有独立'其他意见'框（同样支持添加附件）。"
                    "支持条件题：任选题可加 showIf（如 {\"q0\":[\"选项B\"]}），"
                    "用户选中前置选项后该题自动出现，实现基于前题答案的动态联动。"
                    "**推荐选项（必做）：每道选择题都必须用 recommended 字段标注一个推荐项，"
                    "值是选项原文（多选可用数组，如 [\"A\",\"C\"]，单选直接用字符串）。"
                    "即便各选项都可接受，也要选出你认为最稳妥的一项作为推荐——默认应当出现推荐标记，"
                    "只有确实完全无法取舍时才留空。标注后用户可在「只用推荐」模式下不调用模型直接采纳。**"
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
