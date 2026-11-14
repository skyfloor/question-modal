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
from starlette.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from qwenpaw.plugins.api import PluginApi

from .question_service import get_question_service
from . import analysis as _analysis
from . import question_service as _qs_mod

logger = logging.getLogger(__name__)


def _resolve_working_dir() -> Path:
    """宿主的 WORKING_DIR —— 唯一来源，不自己拼路径。

    为什么不硬编码工作目录字面量：部署形态可变（compose 挂载点、测试用的
    临时目录）。取不到时退回 `Path.cwd()`，并且只在**调用点**降级，
    绝不在模块导入期抛异常（导入期失败会让整个插件装不上）。
    """
    try:
        from qwenpaw.constant import WORKING_DIR  # noqa: PLC0415

        return Path(str(WORKING_DIR))
    except Exception:  # noqa: BLE001
        return Path.cwd()


_WORKING_DIR = _resolve_working_dir()


def _attach_to_host_log() -> None:
    """把插件 logger 挂到宿主的日志 handler 上 —— 否则所有日志不可观测。

    ## 为什么必须这么做（2026-11-07 实测）

    插件自己的 `logging.getLogger(__name__)` 拿到的 logger **不会写进
    宿主的主日志文件**（`<WORKING_DIR>/qwenpaw.log`）。实测：在 `register()`
    里打 `logger.warning("QMDIAG-WARNING")` + `logger.error("QMDIAG-ERROR")`，
    重载插件后 `grep -c QMDIAG <主日志>` = **0**。

    原因是宿主（`qwenpaw/utils/logging.py`）只给 `LOG_NAMESPACE`（= "qwenpaw"）
    和 `apscheduler` 挂了文件 handler（`_attach_logger_file_handler`），
    插件命名空间不在其中。

    ## 后果有多严重

    所有关键失败都**完全无声**：
      • `_runner_loop` 引擎加载失败 → runner 静默不工作
      • `ensure_runner` 抛异常被 except 吞掉 → 问卷不推进
      • ai 分析 429 重试耗尽 → 用户只看到「卡住」
    用户实测「关页面后问卷卡 60 秒被看门狗释放」，我**无法从日志确认原因**，
    只能靠推断 —— 这就是这个缺口的直接代价。

    ## 做法

    找到宿主 namespace logger 的文件 handler，挂到本插件 logger 上
    （保留 propagate，仍然会去 root/stderr）。找不到就静默跳过 ——
    日志不可观测是缺陷，但**绝不能因此让插件起不来**。
    """
    try:
        host = logging.getLogger("qwenpaw")
        file_handler = None
        for h in host.handlers:
            if getattr(h, "baseFilename", None):
                file_handler = h
                break
        if file_handler is None:
            # 宿主还没配好（比如日志初始化顺序靠后）—— 下次 register 再试
            return
        # 注意：子模块 logger 的真实名字带包前缀，而**这个前缀就是 `__name__`**。
        #
        # 生产实测：`plugin.py` 的 `__name__` 是 `plugin_question_modal`（没有点号，
        # 因为宿主把插件文件当成包顶层加载），而 `question_service.py` 的 logger 名
        # 是 `plugin_question_modal.question_service`。
        # 我第一版用 `__name__.rsplit(".")[0]` 推前缀 → 得到空串 → 子模块全漏掉，
        # 表现为 `runner:` 日志一条都不出现（诊断打印 names 才暴露）。
        # ★ 只挂**父** logger，子 logger 靠 propagate 上来写 —— 绝不重复挂。
        #
        # 2026-11-07 实测（问卷自检 D1）：早先这里同时给父
        # `plugin_question_modal` 和子 `plugin_question_modal.question_service`
        # 挂了**同一个** file_handler，而子 logger 的 `propagate` 默认为 True
        # → 一条子模块日志先被自己的 handler 写一次，再向上传播给父的同一个
        # handler 写第二次。全日志 `uniq -c` 显示 13 组 "2 份"，而宿主自身日志
        # 全是单条 —— 这就是判据。
        #
        # 复现（3 行纯 stdlib）：父+子同挂 = 2 行；只挂父、子靠 propagate = 1 行。
        #
        # 代价不只是日志翻倍：所有基于日志条数的取证都会被放大一倍（我就在
        # 「runner 是不是起了两次」上险些误判）。
        #
        # 只设 level、不挂 handler：子模块仍能进父 handler（propagate），
        # 也不会丢掉 DEBUG 以下的过滤能力。
        for name in (f"{__name__}.question_service", f"{__name__}.recommend",
                     f"{__name__}.analysis"):
            logger_ = logging.getLogger(name)
            logger_.setLevel(logging.INFO)
            # 防御：若上一代代码已经给它挂过同一个 handler，主动摘掉
            # （reload 时 logger 对象是跨代际复用的，旧 handler 会留着）。
            base = getattr(file_handler, "baseFilename", None)
            for h in list(logger_.handlers):
                if getattr(h, "baseFilename", None) == base:
                    logger_.removeHandler(h)
        logging.getLogger(__name__).setLevel(logging.INFO)
        base = getattr(file_handler, "baseFilename", None)
        if not any(getattr(x, "baseFilename", None) == base
                   for x in logger.handlers):
            logger.addHandler(file_handler)


    except Exception:  # noqa: BLE001 — 观测失败不能影响插件加载
        pass

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
        # 唯一 tmp 名（固定名在多进程并发下会互相移走/截断）
        tmp = _GATE_FILE.parent / (
            f"{_GATE_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
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

# Serialises the read-modify-write cycle of the SETTINGS files.
#
# 2026-11-13（用户需求 2）：此前两个 save 都是「读整份 → 改 → 写整份」且
# **没有任何锁**。两个标签页同时保存时，后写者拿的是自己读到的旧快照，
# 会把先写者的改动整个抹掉（丢失更新）—— 与「后写为准」正好相反。
_PREFS_LOCK = threading.RLock()


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
    """Merge a whitelisted patch into the prefs file (atomic write).

    2026-11-13：整个「读 → 合并 → 写」放在 ``_PREFS_LOCK`` 里，否则并发
    保存会互相覆盖（详见 ``_PREFS_LOCK`` 的注释）。
    """
    with _PREFS_LOCK:
        return _save_prefs_locked(patch)


def _save_prefs_locked(patch: dict) -> dict:
    """Body of :func:`_save_prefs`; caller must hold ``_PREFS_LOCK``."""
    cur = _load_prefs()
    # Every schema key is accepted here (validated + clamped by
    # ``sanitize_settings``), so adding a setting no longer means editing this
    # function — one schema, one validator, one merge path.
    cur.update(sanitize_settings(patch))
    cur["updated_at"] = time.time()
    try:
        tmp = _PREFS_FILE.parent / (
            f"{_PREFS_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
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
    #
    # 2026-11-14 用户裁定：由布尔开关升级为「通知频道」单选枚举。
    # 键名刻意保留 `notify_manual_mode`（不改成 notify_channel），因为盘上
    # 已有该键的历史值；旧值 true/false 在 enum 校验下会被拒 → 回落
    # default "off"，语义等价（都是关），无破坏性迁移。
    #
    # 选项与可用性（q5 纯全局：不允许会话级覆盖）：
    #   off        关闭
    #   browser    浏览器通知（仅页面存活时有效）
    #   wechat     微信（需先通过测试发送才允许启用，见 /notify/test）
    #   dingtalk   钉钉（需 client_id + client_secret 成对，见 _CHANNEL_REQUIRED_CREDS）
    #   feishu     飞书（需 app_id + app_secret 成对）
    #   任一渠道未启用/缺凭据/无真实会话 → 面板置灰并写明缺什么
    #
    # 为什么是单选而非多选：q6 裁定「一次只能选 1 个频道」，避免同一提醒
    # 在多处重复打扰；浏览器与频道通知的取舍由用户显式选择。
    "notify_channel": {
        "default": "off", "type": "enum", "scope": "global", "batch": 5,
        "values": ["off", "browser", "wechat", "dingtalk", "feishu"],
        "label": "人工模式提醒频道",
    },
    # 向后兼容：老配置里可能存着 notify_manual_mode=true。保留该键作为
    # **只读的迁移来源**（resolve 时若 notify_channel 仍为 off 且旧键为
    # true，则视为 browser），避免用户升级后静默失去提醒。
    "notify_manual_mode": {
        "default": False, "type": "bool", "scope": "global", "batch": 5,
        "label": "（旧）人工模式时提醒",
    },
    # 频道测试闸门（q4 裁定）：所有频道必须先发测试数据、测试通过才允许
    # 真正投递。这里存「已通过测试的频道集合」，由 /notify/test 写入。
    "notify_verified": {
        "default": "", "type": "str", "scope": "global", "batch": 5,
        "label": "已通过测试的频道",
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


def _req_agent_id(request, explicit: str = "") -> str:
    """确定本次请求属于哪个 agent（读通知频道配置的唯一正确来源）。

    2026-11-14 实测缺陷（必须记住）：插件跑在宿主的**单一进程**里，而一台机器
    上常配了多个 agent（本机实测 3 个）。若靠「config.json
    里只有一个 agent 就猜它」，猜测返回空串 → 路径退化成不存在的
    ``<WORKING_DIR>/config.json`` → 微信被判「未启用或缺凭据」，而它其实是
    可用的。**隔离探针 ready=True、线上端点 ready=False** 就是这条引起的。

    回退顺序：显式参数 → 请求头 X-Agent-Id → 环境变量 → 空（调用方再兜底）。
    """
    if explicit:
        return explicit
    try:
        head = request.headers.get("x-agent-id") or ""
        if head:
            return head.strip()
    except Exception:  # noqa: BLE001
        pass
    return _current_agent_id()


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
    #
    # 2026-11-13 方案 D1：只有当本会话的 `__active_scope__` 不是 "default"
    # 时才把会话层叠上去。切到默认模式后，覆盖数据仍留在磁盘（切回即恢复），
    # 但**不参与生效值计算** —— 否则"切了默认模式却还在用会话值"，
    # 用户看到的就是"切了没效果"。
    if chat_id:
        try:
            overrides = _load_session_prefs()
            sess = overrides.get(chat_id) if isinstance(overrides, dict) else None
            if isinstance(sess, dict) and str(
                sess.get("__active_scope__") or ""
            ).strip() != "default":
                out.update(sanitize_settings(sess))
        except Exception:  # noqa: BLE001
            logger.warning(
                "question_modal: could not merge session prefs", exc_info=True,
            )

    # Report which keys came from an override so the UI can badge them.
    #
    # 2026-11-13 方案 D1：标 session 的前提是"会话层**真的参与了**生效值计算"。
    # 若本会话 active_scope=default（切到了默认模式），覆盖数据虽然还留在
    # 磁盘上，却不生效 —— 此时若仍标 session，UI 会显示「此项已被会话覆盖」，
    # 而实际用的是全局值，显示与事实不符（实测：切默认后 model_id 明明是
    # 全局值，sources 却是 {'model_id': 'session'}）。
    sources: dict = {}
    try:
        overrides = _load_session_prefs() if chat_id else {}
        sess = overrides.get(chat_id) if isinstance(overrides, dict) else None
        if isinstance(sess, dict) and str(
            sess.get("__active_scope__") or ""
        ).strip() != "default":
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


# ── Notification channels ──────────────────────────────────────────────
#
# 2026-11-14 用户裁定（pm-req 8 项阻断澄清后）：
#   q1 开着浏览器时可选浏览器或频道通知；**关掉浏览器时只能走频道通知**
#      → 频道投递必须由**后端**发起（前端 effect 关页即失效）
#   q2 频道可用判定 = enabled + 有凭据 + **且有真实会话**（三者都要）
#   q4 所有频道必须先发测试数据、测试通过才允许真正投递
#   q5 纯全局作用域（不允许会话级覆盖）
#   q6 单选：一次只能选 1 个频道
#
# 为什么走 HTTP 回环而不是直接 import 宿主内部函数：
#   1. 插件进程与宿主之间没有现成的对象引用（插件是子进程/受限上下文）；
#   2. `/api/messages/send` 是宿主的**公开契约**，比 import 私有函数稳定；
#   3. 端口由环境变量 `QWENPAW_INTERNAL_HOST_API_PORT` 提供，不硬编码。
#
# ⚠️ 已知上游缺陷（2026-11-14 实测，用户裁定「等官方修、不碰插件」）：
# wechat 渠道的 `_check_result` 要求响应含 ret/errcode，而 iLink 成功时只返回
# `{"message_id": <int>}` → 每次**已成功送达**的发送都会抛
# `PLATFORM_RESULT_UNKNOWN`（用户实测 5/5 全部收到）。故这里把该错误码
# 视为「已送达」，仅记日志，绝不因此丢弃提醒。

# 频道显示名（面板与日志共用；缺省回落 channel key）
# 2026-11-14 用户裁定：删除 Slack / Discord 两个选项
# （原话「其他的选项，例如：slack,discord这2个删掉」）。
# 保留微信 + 钉钉 + 飞书三种远程频道。
_NOTIFY_CHANNEL_LABELS = {
    "browser": "浏览器通知",
    "wechat": "微信",
    "dingtalk": "钉钉",
    "feishu": "飞书",
}

# 本插件「频道通知」路径覆盖的远程频道（browser 不是宿主频道）
_NOTIFY_REMOTE_CHANNELS = ("wechat", "dingtalk", "feishu")

# 上游 wechat 渠道的已知误报：实际已送达但返回失败。
# 只认这一个错误码，其它失败必须如实上报（绝不吞掉真实故障）。
_KNOWN_FALSE_NEGATIVE = "PLATFORM_RESULT_UNKNOWN"


def _host_api_port() -> int:
    """宿主 HTTP 端口（供插件回环调用）。"""
    for name in ("QWENPAW_INTERNAL_HOST_API_PORT", "QWENPAW_PORT"):
        raw = os.environ.get(name, "").strip()
        if raw.isdigit():
            return int(raw)
    return 8088


def _host_api_base() -> str:
    return "http://127.0.0.1:" + str(_host_api_port())


def _notify_verified_set(cfg: dict) -> set[str]:
    """已通过测试闸门的频道集合（逗号分隔存在全局配置里）。"""
    raw = cfg.get("notify_verified") or ""
    if not isinstance(raw, str):
        return set()
    return {part.strip() for part in raw.split(",") if part.strip()}


def _notify_channel_state(channel: str, cfg: dict, agent_id: str = "") -> dict:
    """判定一个频道的可用状态。

    返回 ``{channel, label, ready, reason, verified}``：
      ready=False 时 reason 说明为什么（面板据此置灰并显示原因）。
    """
    label = _NOTIFY_CHANNEL_LABELS.get(channel, channel)
    state = {
        "channel": channel,
        "label": label,
        "ready": False,
        "reason": "",
        "verified": channel in _notify_verified_set(cfg),
    }
    if channel == "off":
        # 「关闭」永远可用（它就是"不发通知"）。
        # 虽然 /notify/channels 对 off 有单独分支，但这里也处理一下，
        # 避免任何直接调用（测试/诊断）落到"未知频道"的误导性分支。
        state["ready"] = True
        state["verified"] = True
        return state
    if channel == "browser":
        # 浏览器通知不依赖宿主频道配置，但同样要过测试闸门（q4）。
        state["ready"] = True
        if not state["verified"]:
            state["reason"] = "尚未通过测试发送"
        return state

    if channel not in _NOTIFY_REMOTE_CHANNELS:
        state["reason"] = "未知频道"
        return state

    try:
        info = _host_channel_info(channel, agent_id)
    except Exception as exc:  # noqa: BLE001
        state["reason"] = "无法读取宿主频道配置：" + type(exc).__name__
        return state

    if not info.get("configured"):
        if not info.get("enabled"):
            state["reason"] = "宿主未启用该频道"
        else:
            miss = info.get("missing") or []
            state["reason"] = "缺少凭据：" + "、".join(miss) if miss else "缺少凭据"
        return state
    if not info.get("sessions"):
        # q2 裁定：三者都要满足，缺会话即不可用（不知道发给谁）
        state["reason"] = "该频道还没有任何会话，无法确定收件人"
        return state
    state["ready"] = True
    if not state["verified"]:
        state["reason"] = "尚未通过测试发送"
    return state


# 每个 IM 渠道的**成对**必填凭据。缺任意一项即视为未配置。
#
# 为什么要成对：钉钉/飞书都是 OAuth 客户端模型，AppKey 与 AppSecret 必须
# 同时存在才能换取 access_token；只配一半时宿主也能启动渠道，但发送必然
# 401 —— 在面板上把它显示为「可用」会误导用户。
_CHANNEL_REQUIRED_CREDS = {
    "wechat": ("bot_token",),
    "dingtalk": ("client_id", "client_secret"),
    "feishu": ("app_id", "app_secret"),
}


def _missing_credentials(channel: str, chan: dict) -> list:
    """返回该渠道缺失的凭据字段名列表（空列表 = 齐备）。"""
    need = _CHANNEL_REQUIRED_CREDS.get(channel)
    if not need:
        return ["<unknown-channel>"]
    return [k for k in need if not str(chan.get(k) or "").strip()]


def _host_channel_info(channel: str, agent_id: str = "") -> dict:
    """读宿主频道配置 + 会话数（同步，供 resolve 与 UI 共用）。

    只读磁盘上的 agent 配置与会话表，不触发宿主启动渠道 —— 面板探测不应
    有副作用（启动一个未运行的渠道代价很高）。
    """
    info = {"configured": False, "sessions": 0, "target_user": "", "enabled": False}
    try:
        cfg = _current_agent_config(agent_id)
        channels = (cfg or {}).get("channels") or {}
        chan = channels.get(channel) or {}
        enabled = bool(chan.get("enabled"))
        info["enabled"] = enabled
        missing = _missing_credentials(channel, chan)
        info["missing"] = missing
        # 每个渠道的凭据字段不同，必须按**该渠道自己的必填对**判断：
        #   微信   bot_token
        #   钉钉   client_id + client_secret（缺一不可，AppKey 与 AppSecret 成对）
        #   飞书   app_id + app_secret
        # 2026-11-14 教训：原实现只取「任意一个非空 token」，钉钉只配了
        # client_secret 或只配 client_id 也会被当成「已配置」，发出去必然失败。
        info["configured"] = bool(enabled and not missing)
        if not info["configured"]:
            return info
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not read host channel %s", channel,
            exc_info=True,
        )
        return info

    # 真实会话（q2 的第三项）：取该频道最近一条会话，其 user_id 即收件人。
    try:
        rows = _list_chats(agent_id)
        mine = [r for r in rows if (r.get("channel") or "") == channel]
        info["sessions"] = len(mine)
        if mine:
            mine.sort(
                key=lambda r: str(
                    r.get("updated_at") or r.get("created_at") or "",
                ),
                reverse=True,
            )
            info["target_user"] = str(mine[0].get("user_id") or "")
            info["target_session"] = str(mine[0].get("session_id") or "")
            info["chat_id"] = str(mine[0].get("id") or "")
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not list chats for %s", channel,
            exc_info=True,
        )
    return info


def _current_agent_config(agent_id: str = "") -> dict:
    """当前 agent 的 agent.json（频道配置来源）。"""
    # 插件在宿主进程内运行时，当前工作目录即 agent workspace；
    # 但更可靠的是从已知路径推导：<WORKING_DIR>/workspaces/<agent>/agent.json。
    path = _agent_config_path(agent_id)
    if not path.is_file():
        return {}
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data if isinstance(data, dict) else {}


def _agent_config_path(agent_id: str = "") -> Path:
    """定位某个 agent 的 agent.json。

    2026-11-14 修正（决定性）：**必须由调用方传入 agent_id**。此前靠
    「config.json 里只有一个 agent 就猜它」——多 agent 机器上猜测直接返回
    空串，于是路径退化成
    ``<WORKING_DIR>/config.json``（不存在）→ 读不到频道配置 → 微信被判
    「未启用或缺凭据」，而实际上它是可用的。实测症状：隔离探针 ready=True，
    线上端点 ready=False。

    回退顺序：显式环境变量 → 传入的 agent_id → 请求头推导（见调用点）。
    """
    explicit = os.environ.get("QWENPAW_QUESTION_MODAL_AGENT_CONFIG", "").strip()
    if explicit:
        return Path(explicit)
    if agent_id:
        cand = _WORKING_DIR / "workspaces" / agent_id / "agent.json"
        if cand.is_file():
            return cand
    return _WORKING_DIR / "config.json"


def _current_agent_id() -> str:
    """零参数兜底（仅用于日志/内部调用）；HTTP 路由一律传 agent_id。"""
    explicit = os.environ.get("QWENPAW_QUESTION_MODAL_AGENT_ID", "").strip()
    if explicit:
        return explicit
    try:
        raw = _WORKING_DIR / "config.json"
        if raw.is_file():
            with open(raw, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            agents = ((data.get("agents") or {}).get("profiles") or {})
            if len(agents) == 1:
                return next(iter(agents))
    except Exception:  # noqa: BLE001
        pass
    return ""


def _list_chats(agent_id: str = "") -> list[dict]:
    """某个 agent 的会话表（chats.json）。"""
    path = _agent_config_path(agent_id).parent / "chats.json"
    if not path.is_file():
        return []
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:  # noqa: BLE001
        return []
    items = data if isinstance(data, list) else (data.get("chats") or [])
    return [r for r in items if isinstance(r, dict)]


def _post_host_api(
    path: str, payload: dict, timeout: float = 20.0, agent_id: str = "",
) -> tuple[int, Any]:
    """POST 到宿主的 HTTP API（回环）。返回 ``(status, body)``。

    只用标准库：插件不打包 httpx，宿主也不保证提供。阻塞调用交给调用方
    放进线程池（`asyncio.to_thread`），避免卡住事件循环。

    ⚠️ ``agent_id`` 必须由调用方传真实值。2026-11-14 实测踩坑：缺省时用
    ``_current_agent_id() or "default"``，在多 agent 机器上 `_current_agent_id()`
    返回空串 → 请求头变成 ``X-Agent-Id: default`` → 宿主去 **default 那个
    agent 的 workspace** 找渠道 → 报 ``Channel not found: wechat``（渠道
    实际挂在另一个 agent 上）。同一次发送，带对的 agent 报「已送达」，带
    default 报「渠道不存在」——这就是根因。
    """
    import urllib.error
    import urllib.request

    aid = agent_id or _current_agent_id()
    if not aid:
        # 不能瞎填 "default"：那会让宿主去错的 workspace 找渠道。
        return 0, "无法确定 agent_id（多 agent 环境下必须显式传入）"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        _host_api_base() + path,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Agent-Id": aid,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")
    except Exception as exc:  # noqa: BLE001
        return 0, f"{type(exc).__name__}: {exc}"


def _is_known_false_negative(status: int, body: str) -> bool:
    """上游 wechat 渠道的已知误报（**已送达**却返回失败）。

    2026-11-14 实测：iLink `sendmessage` 成功时只返回
    ``{"message_id": <int>}``，而 channel 的 ``_check_result`` 要求响应含
    ret/errcode → 抛 ``PLATFORM_RESULT_UNKNOWN``。用户实测 5/5 条全部收到。
    用户裁定「等官方修、不碰插件」，故此处按已送达处理。

    只认这一个错误码：其它 5xx / 网络错误必须如实上报。
    """
    return status >= 400 and _KNOWN_FALSE_NEGATIVE in (body or "")


def _is_context_token_expired(body: str) -> bool:
    """context_token 过期（微信协议限制，**不是故障**）。

    2026-11-14 实测：iLink 对过期 token 返回 ``{"ret": -2, "errmsg":
    "prepare failed"}``，宿主渠道翻译成 ``CONTEXT_TOKEN_INVALID``。

    为什么必须单独识别：微信的 context_token 只在**用户主动给机器人发消息**
    时由平台下发，没有独立的刷新接口（已实测 `getupdates` 在无新消息时
    只返回空列表、不刷新 token）。所以这不是配置错误，把「请重新绑定」
    这类误导性提示给用户是错的 —— 正确提示是「请给机器人发一条消息」。
    """
    return "CONTEXT_TOKEN_INVALID" in (body or "")


async def _send_via_channel(
    channel: str, text: str, info: dict, agent_id: str = "",
) -> dict:
    """通过宿主将文本投递到某个频道。返回投递结果描述。

    ``agent_id`` 必须透传到宿主：宿主按它选 workspace，选错就报
    ``Channel not found``（详见 :func:`_post_host_api`）。
    """
    target_user = info.get("target_user") or ""
    target_session = info.get("target_session") or ""
    if not target_user:
        return {"ok": False, "delivered": False, "error": "缺少收件人（该频道没有会话）"}

    status, body = await asyncio.to_thread(
        _post_host_api,
        "/api/messages/send",
        {
            "channel": channel,
            "target_user": target_user,
            "target_session": target_session,
            "text": text,
        },
        20.0,
        agent_id,
    )
    if 200 <= status < 300:
        return {"ok": True, "delivered": True, "http": status, "body": body[:300]}
    if _is_known_false_negative(status, body):
        # 已送达，仅是渠道返回值格式误判。如实记账但不算失败。
        logger.info(
            "question_modal: notify %s delivered despite %s (known upstream bug)",
            channel, _KNOWN_FALSE_NEGATIVE,
        )
        return {
            "ok": True, "delivered": True, "http": status,
            "note": "已送达（渠道响应格式异常，按已送达处理）",
            "body": body[:300],
        }
    if _is_context_token_expired(body):
        # 微信协议限制：token 只能由用户发消息刷新，没有刷新接口。
        # 明确告知「该去做什么」，不要误导成配置错误。
        hint = "微信会话凭证已过期（微信限制：只有你给机器人发过消息后才能主动推送）。请先在微信里给机器人发一条消息，再点「测试」。"
        logger.warning(
            "question_modal: notify %s failed, context token expired", channel,
        )
        return {
            "ok": False, "delivered": False, "http": status,
            "error": hint, "expired": True, "body": body[:300],
        }
    logger.warning(
        "question_modal: notify %s failed HTTP %s: %s", channel, status, body[:200],
    )
    return {"ok": False, "delivered": False, "http": status, "error": body[:300]}


async def _notify_test(channel: str, text: str = "", agent_id: str = "") -> dict:
    """测试发送（q4 闸门）：成功即把该频道记为已验证。

    ## 2026-11-14 用户报缺陷后的修正
    「可见测试按钮和测试结果，但切换成下拉后这 2 个内容丢失了」
    → 每次测试（成功/失败）都必须**落盘**并可从 `GET /notify/test-log` 查回。
    测试结果不是一次性副作用，而是可事后查证的诊断证据。
    """
    out = await _do_notify_test(channel, text, agent_id)
    # 无论成败都记一条 —— 失败原因同样是要给用户看的信息。
    rec = {
        "at": time.time(),
        "at_text": time.strftime("%Y-%m-%d %H:%M:%S"),
        "ok": bool(out.get("ok")),
        "delivered": bool(out.get("delivered")),
        "http": out.get("http"),
        "note": out.get("note") or "",
        "error": out.get("error") or "",
        "expired": bool(out.get("expired")),
    }
    log = _append_test_log(channel, rec)
    # 把该频道的最新记录随响应带回，前端无需再请求一次即可显示。
    out["last"] = rec
    out["history"] = log.get(channel, [])[:_TEST_LOG_MAX]
    return out


async def _do_notify_test(channel: str, text: str, agent_id: str) -> dict:
    """实际执行一次测试发送（不含记账）。"""
    cfg = resolve_effective("")
    if channel == "browser":
        # 浏览器通知由前端执行，后端无从代发；这里只做「允许登记」，
        # 实际的 Notification 弹窗由前端测试按钮触发并回报。
        _mark_notify_verified("browser", True)
        return {"ok": True, "channel": channel, "delivered": True,
                "note": "浏览器通知已允许（测试弹窗由前端触发）"}

    state = _notify_channel_state(channel, cfg, agent_id)
    if not state["ready"]:
        return {"ok": False, "channel": channel, "delivered": False,
                "error": state["reason"] or "频道不可用"}

    info = _host_channel_info(channel, agent_id)
    msg = text or f"【QwenPaw 通知测试】{_NOTIFY_CHANNEL_LABELS.get(channel, channel)}频道连通性验证，收到即表示配置正确。"
    result = await _send_via_channel(channel, msg, info, agent_id)
    if result.get("delivered"):
        _mark_notify_verified(channel, True)
    return {"ok": bool(result.get("ok")), "channel": channel, **result}


# 每个频道保留最近 N 次测试记录（磁盘）。上限存在的理由：无上限会让
# notify_test_log.json 无限增长，且用户实际只会看最近几条。
_TEST_LOG_MAX = 20
_TEST_LOG_FILE = _PLUGIN_DIR / "notify_test_log.json"


def _load_test_log() -> dict:
    """读取各频道的测试历史 ``{channel: [record, ...]}``（新的在前）。"""
    try:
        if not _TEST_LOG_FILE.is_file():
            return {}
        with open(_TEST_LOG_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else {}
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not read notify test log", exc_info=True)
        return {}


def _append_test_log(channel: str, record: dict) -> dict:
    """把一次测试结果追加到磁盘日志（原子写，失败不阻断测试本身）。

    ## 为什么必须落盘（2026-11-14 用户报缺陷）
    「可见测试按钮和测试结果，但是你现在切换成下拉后，这 2 个内容丢失了」
    —— 第一版结果只写 `settingsState.notifyMsg`（前端内存），刷新即丢，
    且只对「当前选中频道」可见。测试结果本质是**诊断证据**，必须能事后查。
    """
    try:
        log = _load_test_log()
        items = log.get(channel)
        if not isinstance(items, list):
            items = []
        items.insert(0, record)
        log[channel] = items[:_TEST_LOG_MAX]
        tmp = _TEST_LOG_FILE.parent / (
            f"{_TEST_LOG_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
        tmp.write_text(json.dumps(log, ensure_ascii=False), encoding="utf-8")
        tmp.replace(_TEST_LOG_FILE)
        return log
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not persist notify test log", exc_info=True)
        return {}


def _mark_notify_verified(channel: str, ok: bool) -> None:
    """维护「已通过测试的频道」集合（全局配置项 notify_verified）。"""
    try:
        prefs = _load_prefs()
        current = _notify_verified_set({"notify_verified": prefs.get("notify_verified", "")})
        if ok:
            current.add(channel)
        else:
            current.discard(channel)
        prefs = dict(prefs)
        prefs["notify_verified"] = ",".join(sorted(current))
        _save_prefs(prefs)
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not persist notify_verified", exc_info=True,
        )


def _agent_display_name(agent_id: str = "") -> str:
    """该 agent 的展示名（用于通知文案「来自 xxx 智能体」）。

    2026-11-14 用户要求：推送消息除现有内容外，还要带上
    「来自xxx智能体-年月日时分秒」，这样多 agent 时能一眼看出是谁发的。

    取值顺序（都读磁盘，不触发宿主启动）：
      1. ``<workspace>/agent.json`` 的 ``name``（本机 example：'后端开发'）
      2. ``agent.json`` 的 ``display_name``（未来若有）
      3. 回退 agent_id 本身（宁可显示 id，也不要显示空）

    注意 ``config.json`` 的 ``agents.profiles.<id>`` 在本机**没有** name 字段
    （实测全为 None），所以不能只读那里 —— 真正的名字在 workspace 的
    agent.json 里。读不到一律回退，绝不抛异常打断通知。
    """
    try:
        path = _agent_config_path(agent_id)
        if path.is_file():
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                for key in ("name", "display_name"):
                    val = str(data.get(key) or "").strip()
                    if val:
                        return val
    except Exception:  # noqa: BLE001 — 取名失败绝不能阻断通知
        logger.debug("question_modal: could not read agent name", exc_info=True)
    return str(agent_id or "").strip()


def _notify_stamp(agent_id: str = "") -> str:
    """通知尾部的时间戳行：「来自后端开发智能体-2026-11-14 12:40:33」。

    刻意用**本地时间**（用户看的是自己时钟），格式固定到秒，
    这样钉钉里连收几条也能分辨先后。
    """
    name = _agent_display_name(agent_id)
    who = (name + "智能体") if name else "智能体"
    return f"来自{who}-{time.strftime('%Y-%m-%d %H:%M:%S')}"


async def notify_survey_pending(
    call_id: str, title: str, count: int, agent_id: str = "",
) -> dict:
    """提醒用户「有一份问卷在等你作答」。

    由**后端**调用（q1 裁定的关键：关掉浏览器时只能走频道通知，前端
    effect 关页即失效）。频道为单选（q6），且必须已过测试闸门（q4）。

    文案（q0 裁定）：与浏览器通知同口径 —— 「问卷名」有 N 道题等你作答。
    注意：只发标题与题数，**不发题目正文**（2026-11-13 安全红线）。
    """
    cfg = resolve_effective("")
    channel = str(cfg.get("notify_channel") or "off")

    # 旧键迁移：老配置可能只有 notify_manual_mode=true
    if channel == "off" and cfg.get("notify_manual_mode"):
        channel = "browser"

    if channel == "off":
        return {"ok": True, "delivered": False, "channel": "off",
                "reason": "通知频道已关闭"}

    state = _notify_channel_state(channel, cfg, agent_id)
    if not state["ready"]:
        return {"ok": False, "delivered": False, "channel": channel,
                "reason": state["reason"] or "频道不可用"}
    if not state["verified"]:
        # q4：未通过测试的频道一律不许真正投递。
        return {"ok": False, "delivered": False, "channel": channel,
                "reason": "该频道尚未通过测试发送，请先在设置里点「测试」"}

    # ── 文案（2026-11-14 用户要求追加来源与时间）──────────────────────
    #
    # 用户原话：「推送的消息，除了现有的内容外，还需要增加以下内容：
    # 来自xxx智能体-年月日时分秒」。
    # 于是定稿为两行：
    #   「问卷标题」有 N 道题等你作答
    #   来自后端开发智能体-2026-11-14 12:40:33
    # 仍**不带题目正文**（2026-11-13 安全红线不变）。
    base = (
        f"「{title}」有 {count} 道题等你作答" if count > 0
        else f"「{title}」等你作答"
    )
    stamp = _notify_stamp(agent_id)
    body = base + "\n" + stamp
    if channel == "browser":
        # 浏览器通知只能前端发；后端标记为「交由前端处理」。
        return {"ok": True, "delivered": False, "channel": "browser",
                "delegated": True, "text": body}

    info = _host_channel_info(channel, agent_id)
    return await _send_via_channel(channel, body, info, agent_id)


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
    # `__keyts__` 是逐键写入时间戳（并发冲突检测，2026-11-13）。它不是用户
    # 设置项、不在 SETTINGS_SCHEMA 里，`sanitize_settings` 会把它当未知键丢掉
    # —— 那样时间戳永远存不下来，冲突检测也就永不触发。这里原样保留。
    if isinstance(settings, dict) and isinstance(settings.get("__keyts__"), dict):
        clean["__keyts__"] = {
            str(k): float(v) for k, v in settings["__keyts__"].items()
            if isinstance(v, (int, float))
        }
    # `__active_scope__` = 本会话当前用哪套配置（2026-11-13 方案 D1）。
    # 它不是用户设置项、不在 SETTINGS_SCHEMA 里，同样要在 sanitize 之后原样
    # 放行，否则「切到默认模式」的标记存不下来，has_session 永远算不对
    # （切了跟没切一样）。
    if isinstance(settings, dict):
        _mark = str(settings.get("__active_scope__") or "").strip()
        if _mark in ("session", "default"):
            clean["__active_scope__"] = _mark
    return clean


def _save_session_prefs(sessions: dict) -> None:
    """Atomic write of the whole session-prefs map.

    Every entry is re-filtered through ``_session_writable`` on the way in, so a
    hand-written or legacy file cannot smuggle in a global-only key.

    2026-11-13（用户需求 2）：写入放在 ``_PREFS_LOCK`` 内。路由层已在同一把
    锁里完成「读 → 改」，这里再挡一层，避免任何绕过路由的写入（脚本 / 未来
    调用方）让两份整表互相覆盖。
    """
    with _PREFS_LOCK:
        try:
            if isinstance(sessions, dict):
                sessions = {
                    k: _session_writable(v) for k, v in sessions.items()
                    if isinstance(k, str) and k
                }
                sessions = {k: v for k, v in sessions.items() if v}
            payload = {"sessions": sessions, "updated_at": time.time()}
            tmp = _SESSION_PREFS_FILE.parent / (
                f"{_SESSION_PREFS_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
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
        tmp = _TEMPLATES_FILE.parent / (
            f"{_TEMPLATES_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
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
        # 多选：先剔除前端哨兵 `__other__` 再拼接，否则决策记录里会出现
        # 「甲、__other__」这种把实现细节写进答案的内容（2026-11-14 实测）。
        if isinstance(value, list):
            value = "、".join(str(v) for v in value if str(v) != "__other__")
        elif str(value) == "__other__":
            value = ""
        # 同上（2026-11-14）：value 已是具体选项时，other 是用户改选后遗留的
        # 残留，不得并入答案，否则决策记录里也会留下用户没表达过的内容。
        # value 为空（= 用户只选了「其他」并写了文字）时，other 才是真答案。
        has_option = bool(str(value).strip())
        if other and not has_option:
            value = other
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


class NotifyTestRequest(BaseModel):
    """测试发送一个通知频道（q4 闸门）。"""
    model_config = ConfigDict(extra="forbid")

    channel: str = Field(..., description="频道 key，如 wechat / browser")
    text: Optional[str] = Field(None, description="自定义测试文案（留空用默认）")


class NotifySendRequest(BaseModel):
    """投递一条问卷待作答提醒。"""
    model_config = ConfigDict(extra="forbid")

    tool_call_id: str = Field("", description="问卷卡片标识（用于日志追踪）")
    title: str = Field("", description="问卷标题（不发题目正文）")
    count: int = Field(0, description="未作答题数")


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

        # 用户主动点「跳过问卷」/「跳过并提交」也是一类来源，必须带原因，
        # 否则卡片与模型仍只看到光秃秃的「跳过」二字。
        resolved = await svc.skip(
            body.request_id, reason="用户在卡片上点了「跳过问卷」",
            by="user",
        )
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
            {"request_id": pq.request_id,
             "skip_reason": "用户在卡片上点了「跳过问卷」",
             "skipped_by": "user"},
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
                # `tool_call_id` 是问卷卡片在宿主消息流里的唯一标识，也是
                # `/survey-state` 的查询键。此前这里不返回它，导致任何"从 pending
                # 反查问卷进度"的调用方（含验证脚本）都必须去扫 survey_states.json，
                # 而那份文件在问卷刚弹出时可能还没落盘 → 反查失败。
                # 补上它不改变任何既有语义，只是把本来就有的字段暴露出来。
                "tool_call_id": pq.tool_call_id,
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

        # ★ 记录每一次分析请求的**来源线索**，用于判定「是否重复分析」。
        #
        # 背景（阶段 4）：后端 runner 会自己调 `analyze_survey`，前端也曾对
        # 同一题再发一次 `POST /analyze` → 同一题烧两份配额。已给前端加
        # `!backendDown` 守卫让位，但**仅靠观察界面无法证伪**「前端是否偷偷
        # 又发了一次」：两份结果只影响气泡渲染，用户看不出差别。
        #
        # 这段日志让判定变成纯读日志，不需要任何浏览器 console：
        #   • `via=analyze-http` + `mode=auto` 且**该题后端也在跑** → 重复
        #   • 同一 tool_call_id 同一题出现两次 `analyze-http` → 重复
        #   • 正常情况：每题只应有一条来自后端的 `runner:fill`
        logger.info(
            "analyze-request: tcid=%s q=%s mode=%s model=%s (via=analyze-http)",
            (tool_call_id or "-")[:24], body.question_index, body.mode or "-",
            (body.model_id or "default")[:24],
        )

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

    # ── 后端权威的问卷推进状态 ─────────────────────────────────────
    #
    # 用户裁定（2026-11-05）：推进权应从「前端 React effect」搬到后端，
    # 前端只读 + 发 action —— 因为两个标签页会各持一份前端状态互相抢占，
    # 而没有页面在跑时推进循环根本不存在。
    #
    # 阶段 0（已完成）：只做「后端也有这份 state」+ 影子比对，零行为变化。
    # 阶段 1（2026-11-07 用户裁定）：**state 权威整体后移** —— answers /
    # cursor / mode 全部以后端为唯一真值，前端退化为渲染 + 发 action。

    @router.get("/survey-state")
    async def get_survey_state(tool_call_id: str = Query(default="")):
        """Return the backend's record of how far this survey has got.

        阶段 1 起这是**权威快照**：前端挂载时先拉它拿首帧，再订阅
        /survey-stream 拿增量。两条通道缺一不可 —— 只有 SSE 会在连接前
        丢事件，只有 GET 则无法感知后续变化。
        """
        import traceback as _tb
        try:
            return _survey_state_impl(tool_call_id)
        except BaseException as exc:      # noqa: BLE001 — 排障用
            return JSONResponse(
                status_code=200,
                content={"ok": False, "error": repr(exc),
                         "trace": _tb.format_exc()[-1500:]},
            )

    def _survey_state_impl(tool_call_id: str):
        st = get_question_service().get_survey(tool_call_id)
        if st is None:
            return {"ok": True, "found": False}
        # 跨 reload 存活的旧代际实例仍是旧类：to_json() 里没有新增的
        # skip_reason。统一补齐，让历史卡片也能从 /survey-state 读到原因。
        try:
            _skip = str(getattr(st, "skip_reason", "") or "")
        except Exception:  # noqa: BLE001
            _skip = ""
        return {"ok": True, "found": True, "rev": st.rev, "state": {
            **st.to_json(), "orphan": st.orphan, "skip_reason": _skip,
        }}

    @router.get("/survey-stream")
    async def get_survey_stream(
        tool_call_id: str = Query(default=""),
        since_rev: int = Query(default=0),
    ):
        """SSE: replay this survey's state, then stream every subsequent change.

        为什么要 SSE 而不是轮询：多个标签页轮询会把请求量按标签数放大，
        而且轮询间隔内的跳步对"自动推进"是可见的卡顿。SSE 让后端一写就推，
        多标签各自订阅、各自渲染同一份 state —— 这正是宿主 run 的做法
        （`app/task_tracker.py` 的 attach + buffer 重放 + detach）。

        ★ 断开只摘订阅者，**不停问卷**。这就是"关掉窗口仍在推进"的机制前提。
        """
        svc = get_question_service()

        async def event_gen():
            queue, replay = svc.subscribe(tool_call_id)
            try:
                # 首帧：先补一份完整快照，避免「连接前的变更」丢失。
                st = svc.get_survey(tool_call_id)
                if st is not None:
                    # 同 _survey_state_impl：旧代际实例的 to_json 没有 skip_reason
                    try:
                        _skip = str(getattr(st, "skip_reason", "") or "")
                    except Exception:  # noqa: BLE001
                        _skip = ""
                    payload = {"kind": "snapshot", "rev": st.rev,
                               "state": {**st.to_json(), "orphan": st.orphan,
                                         "skip_reason": _skip}}
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                else:
                    yield ('data: ' + json.dumps(
                        {"kind": "snapshot", "rev": 0, "state": None},
                        ensure_ascii=False) + "\n\n")
                # 重放订阅登记之前已发生的变更（since_rev 之后的）
                for ev in replay:
                    if int(ev.get("rev") or 0) > int(since_rev or 0):
                        yield ("data: " + json.dumps(
                            {"kind": "change", **ev}, ensure_ascii=False) + "\n\n")
                while True:
                    try:
                        ev = await asyncio.wait_for(queue.get(), timeout=15.0)
                    except asyncio.TimeoutError:
                        # 心跳：既保住中间代理，也让前端能区分「静默」与「断线」
                        yield 'data: {"kind":"ping"}\n\n'
                        continue
                    yield ("data: " + json.dumps(
                        {"kind": "change", **ev}, ensure_ascii=False) + "\n\n")
            except asyncio.CancelledError:
                raise
            except Exception:  # noqa: BLE001
                logger.debug("survey stream ended", exc_info=True)
            finally:
                svc.unsubscribe(tool_call_id, queue)

        return StreamingResponse(
            event_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive",
                     "X-Accel-Buffering": "no"},
        )

    @router.post("/survey-action")
    async def post_survey_action(body: dict):
        """Apply one user action to the backend state — the backend decides.

        阶段 1 起这里是**裁决者**：写入 state、广播给所有标签页、并在
        `submit` / `release` 时真正 resolve 掉等待中的 agent。

        ★ 幂等保证（双开的根本）：同一份问卷第二次 submit 返回
        `already_submitted`，绝不重复 resolve —— `submit_answer()` 的
        `_pending.pop()` 本身就保证了这点，这里只是把它明确成契约。
        """
        tool_call_id = str((body or {}).get("tool_call_id") or "")
        action = str((body or {}).get("action") or "")
        payload = (body or {}).get("payload") or {}
        if not isinstance(payload, dict):
            payload = {}
        # 发起变更的标签页 id。前端靠它区分「自己的回声」与「别人的修改」：
        # 回声不能覆盖本地 state（否则正在输入的文本被旧值冲掉）。
        origin = str((body or {}).get("origin") or "")
        svc = get_question_service()

        # 终态问卷不再接受任何写入（幂等 + 防覆盖已提交的答案）
        cur = svc.get_survey(tool_call_id)
        if cur is not None and cur.status == "submitted" and action != "release":
            return {"ok": True, "accepted": False,
                    "reason": "already_submitted",
                    "state": cur.to_json()}

        if action == "release":
            released = await svc.release_survey(
                tool_call_id, str(payload.get("by") or "user"), origin,
                reason=str(payload.get("reason") or "")
                       or "用户在卡片上点了「释放阻塞」",
            )
            st = svc.get_survey(tool_call_id)
            return {"ok": True, "accepted": bool(released),
                    "reason": "" if released else "already_submitted",
                    "state": st.to_json() if st is not None else None}

        st = svc.apply_action(tool_call_id, action, payload, origin)
        if st is None:
            return {"ok": False, "accepted": False,
                    "error": "survey state not found"}
        # ★ `submit` 只记录「这份问卷已提交」这个**事实**并广播，绝不在这里
        # 唤醒 agent。
        #
        # 原因（2026-11-07 自查发现的设计错误）：唤醒 agent 的唯一正确通道是
        # `POST /answer`，因为只有它带着 answers / other / attachments。
        # 若在这里调 `release_survey()`（内部走 `skip()`），agent 收到的会是
        # `{"skipped": true}` —— **用户的全部答案被丢弃**，而卡片却显示
        # 「已提交」。这正是本项目历史上反复出现的"谎报成功"类缺陷。
        #
        # 职责划分：
        #   · /answer   → 携带答案，真正 resolve（幂等由 _pending.pop 保证）
        #   · /survey-action{submit} → 只记状态 + 广播，让另一个标签页同步看到
        #   · /survey-action{release} → 显式放弃，按 skip 语义释放（见上面分支）
        return {"ok": True, "accepted": True, "reason": "",
                "state": st.to_json()}

    @router.post("/survey-shadow")
    async def post_survey_shadow(body: dict):
        """Compare the frontend's state against the backend's (diagnostic only).

        前端在每次推进后 fire-and-forget 上报，这里只比对与落盘差异。
        **无论比对结果如何都不影响问卷**：失败静默，绝不阻塞作答。
        """
        tool_call_id = str((body or {}).get("tool_call_id") or "")
        reported = (body or {}).get("state") or {}
        svc = get_question_service()
        result = svc.compare_shadow(tool_call_id, reported if isinstance(reported, dict) else {})
        svc.record_shadow_diff(tool_call_id, result)
        return {"ok": True, "match": bool(result.get("match")),
                "diffs": result.get("diffs") or [],
                "reason": result.get("reason") or ""}

    @router.get("/survey-shadow")
    async def get_survey_shadow(limit: int = Query(default=50)):
        """Read the recorded shadow diffs (empty file = frontend matches backend)."""
        try:
            if not _qs_mod._SHADOW_FILE.exists():
                return {"ok": True, "count": 0, "items": []}
            rows = json.loads(_qs_mod._SHADOW_FILE.read_text(encoding="utf-8")) or []
            if not isinstance(rows, list):
                rows = []
        except Exception:  # noqa: BLE001
            return {"ok": True, "count": 0, "items": [], "error": "unreadable"}
        return {"ok": True, "count": len(rows), "items": rows[-max(1, int(limit)):]}

    @router.post("/survey-prune")
    async def post_survey_prune(body: dict | None = None):
        """清掉测试/僵尸 survey state —— **必须走这里，不能改文件**。

        ## 为什么不能直接改 survey_states.json（2026-11-07 实测）

        `QuestionService._surveys()` 返回的是 `_SharedState` 上的**内存表**，
        它跨插件 reload 存活（保住 parked Future 的关键设计），并且
        `surveys_restored` 标志也在共享容器上 —— 所以插件**不会**重读磁盘。

        后果：我手工把 `survey_states.json` 从 221 条删到 11 条，然后 reload，
        插件内存里仍是那 221 条 → 下次 `_persist_surveys()` **原样写回**，
        磁盘清理完全无效（实测 11 条 reload 后立刻变回 200+ 条）。

        所以清理必须**同时作用于内存表**，这正是本端点的存在理由。

        ## 安全约束（默认只删测试残留）

        判据：`request_id` 为空 ⇒ 该 state 不是由 `plugin.py` 的中间件创建的
        （中间件创建时一律带 request_id），只可能是验证脚本进程内 `create()`
        的产物。真实问卷**一定**带 request_id，因此默认清理**不可能**删掉真实数据。

        `include_pending_with_request_id=false`（默认）时，连"带 request_id 但
        已 submitted"的历史记录也一并清掉会更有风险，故保持保守：只清无 id 的。
        需要清空全部时显式传 `purge_all=true`（危险，需人工确认）。
        """
        payload = body if isinstance(body, dict) else {}
        purge_all = bool(payload.get("purge_all"))
        # 按前缀清理：测试脚本用这个精准删掉自己造的键，
        # 不需要（也不应该）碰真实记录。
        prefix = str(payload.get("prefix") or "")
        svc = get_question_service()
        table = svc._surveys()
        before = len(table)
        removed = []
        for k in list(table.keys()):
            st = table[k]
            has_req = bool(getattr(st, "request_id", ""))
            hit = (
                purge_all
                or (prefix and k.startswith(prefix))
                or not has_req
            )
            if hit:
                removed.append(k)
                table.pop(k, None)
        # 一并清掉对应的 runner（对应 state 已不存在，留着就是僵尸 task）
        try:
            svc._prune_stale_runners()
        except Exception:  # noqa: BLE001
            logger.warning("prune runners failed after survey prune", exc_info=True)
        svc._persist_surveys()
        after = len(table)
        logger.info("survey-prune: purge_all=%s prefix=%r %d -> %d",
                    purge_all, prefix, before, after)
        return {
            "ok": True,
            "purge_all": purge_all,
            "prefix": prefix,
            "before": before,
            "after": after,
            "removed": len(removed),
            "removed_sample": removed[:10],
        }

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

    @router.get("/engine-status")
    async def get_engine_status():
        """后端推进引擎是否可用 —— 生产加载路径的真实自检。

        为什么需要这个端点（2026-11-07）：`_runner_loop` 早期写成裸
        `import recommend`，在生产（插件以**包**加载、插件目录不在 sys.path）
        必然 ModuleNotFoundError，且被 except 吞成一条 **插件 logger 的
        warning —— 而插件的 logger 输出不进主日志**，于是这个致命缺陷
        完全不可观测，外部只表现为「关掉页面就不推进了」。

        这个端点把自检结果暴露成可查询的 JSON，任何人（含验证脚本）都能
        一眼确认引擎状态，而不必依赖日志。
        """
        info: dict = {"ok": True, "available": False, "missing": [],
                      "import_style": "relative", "error": ""}
        try:
            # ★ 必须走 **runner 用的同一个入口**，否则自检会在真缺陷前报正常
            info["entry"] = "_load_recommend_engine"
            rec = _qs_mod._load_recommend_engine()
            info["available"] = True
            info["module_file"] = getattr(rec, "__file__", "")
            # 记录插件的真实模块名 —— 宿主用 `plugin_<id>` 命名空间加载，
            # 这个字段能证明引擎是在**生产加载路径**下解析的
            info["plugin_module"] = __name__
            need = ("step_once", "prune_hidden", "visible_indices", "is_visible",
                    "chosen_tokens", "question_recommended",
                    "choice_for_question", "filled_answer", "q_type",
                    "opt_value", "opt_label")
            info["missing"] = [fn for fn in need
                               if not callable(getattr(rec, fn, None))]
            if info["missing"]:
                info["available"] = False
        except Exception as e:  # noqa: BLE001
            info["error"] = f"{type(e).__name__}: {e}"
        try:
            svc = get_question_service()
            info["runners_live"] = len(svc._runners())
        except Exception:  # noqa: BLE001
            info["runners_live"] = -1
        return info

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

        # ── 「会话模式 vs 默认模式」的判据（2026-11-13 方案 D1 改造）──────
        #
        # 用户裁定：来回切换**不能丢数据**。
        #   切到默认模式 = 只把「本会话当前用哪套」标成 default，
        #   会话里自定义过的那几项**原样保留**；切回会话模式立刻恢复。
        #
        # 所以判据不能再是「有没有覆盖条目」——旧实现里"删掉条目"既是切模式
        # 又是丢数据，两件事被绑死。改为读显式标记 `__active_scope__`：
        #   · "session" → 会话模式
        #   · "default" → 默认模式（覆盖数据仍在磁盘上，随时可切回）
        #   · 无标记（历史数据）→ 有覆盖即视为 session，兼容旧数据
        has_session = False
        active_scope = "default"
        try:
            ov = _load_session_prefs()
            sess = ov.get(chat_id) if (chat_id and isinstance(ov, dict)) else None
            if isinstance(sess, dict):
                mark = str(sess.get("__active_scope__") or "").strip()
                # 2026-11-13 用户裁定（严格判定）：历史数据没有标记时，
                # **必须真的存在至少一个用户值项**才算会话模式。
                # 否则一条只含内部字段（__keyts__ 等）的记录会被误判成
                # 会话模式 —— 那种记录不含任何用户选择，语义上是"没设过"。
                _has_real_value = bool(sanitize_settings(sess))
                if mark in ("session", "default"):
                    active_scope = mark
                    has_session = (mark == "session")
                elif _has_real_value:
                    has_session = True
                    active_scope = "session"
                else:
                    has_session = False
                    active_scope = "default"
        except Exception:  # noqa: BLE001
            pass

        # 分层原始数据（见下方 return 里的说明）。
        #   session_config = 该会话**显式覆盖过**的键（不掺全局、不受
        #                    active_scope 影响 —— 即使现在不是会话模式，
        #                    磁盘上留着的这些值也要能如实显示）
        #   global_config  = 全局层的原始值（磁盘上的 analysis_prefs）
        session_config: dict = {}
        global_config: dict = {}
        try:
            _all = _load_session_prefs() if chat_id else {}
            _sess = _all.get(chat_id) if isinstance(_all, dict) else None
            if isinstance(_sess, dict):
                session_config = sanitize_settings(_sess)
        except Exception:  # noqa: BLE001
            session_config = {}
        try:
            global_config = sanitize_settings(_load_prefs())
        except Exception:  # noqa: BLE001
            global_config = {}

        # 本会话各键的最后写入时间（并发冲突检测用，2026-11-13 需求 2）。
        # 前端打开面板时记下它，保存时作为 `seen` 发回；后端据此判断
        # 「这个键在我看过之后是否被别处改过」，从而给出
        # 「设置已于 xx 时间被其它位置修改」的标注。
        key_ts: dict = {}
        try:
            if chat_id:
                _all = _load_session_prefs()
                _sess = _all.get(chat_id) if isinstance(_all, dict) else None
                if isinstance(_sess, dict) and isinstance(_sess.get("__keyts__"), dict):
                    key_ts = {
                        str(k): float(v)
                        for k, v in _sess["__keyts__"].items()
                        if isinstance(v, (int, float))
                    }
        except Exception:  # noqa: BLE001 — 提示数据缺失绝不能影响读配置
            key_ts = {}

        return {
            "ok": True,
            "chat_id": chat_id,
            "config": cfg,
            "has_session": has_session,
            # 显式标记，供前端判断"当前用哪套"（与 has_session 同义但更明确）
            "active_scope": active_scope,
            # ── 分层原始数据（2026-11-13 用户报「页签数据显示错层」）───────
            #
            # 问题：切到默认模式后 active_scope=default，生效值 config 就等于
            # 全局值。前端会话页签原本读的是 `config`（生效值），于是显示成
            # 全局数据；点保存时 set_scope 一改，生效值立刻切成会话覆盖，
            # 页签内容"突然刷新"。
            #
            # 修法：把两层原始数据分别返回，前端各页签读自己那层，与"当前
            # 生效哪套"彻底解耦 —— 会话页签永远显示会话层，默认页签永远
            # 显示全局层，不管现在 active_scope 是什么。
            "session_config": session_config,
            "global_config": global_config,
            "global_keys": global_keys,
            "key_ts": key_ts,
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

    # ── Notification channels (2026-11-14) ────────────────────────────────
    #
    # 三个端点分工：
    #   GET  /notify/channels  面板探测：每个频道是否可用、为何不可用、是否已验证
    #   POST /notify/test      测试发送（q4 闸门），成功即登记已验证
    #   POST /notify/send      真正投递一条提醒（供前端/后端内部调用）
    #
    # 为什么可用性判定在后端：q2 裁定要「enabled + 凭据 + 有真实会话」三者
    # 同时满足，这三项数据都在宿主侧（agent.json / chats.json），前端拿不到。
    @router.get("/notify/channels")
    async def get_notify_channels(
        request: Request,
        agent_id: str = Query(default=""),
    ) -> dict:
        """列出所有可选通知频道及其可用状态。

        ⚠️ agent_id 必须从请求取（请求头 X-Agent-Id 或显式参数）：本机有多个
        agent，靠「猜唯一 workspace」会读到错误的 agent.json —— 实测症状是
        微信明明可用却被判 ready=False。``_req_agent_id`` 统一做这个回退。
        """
        aid = _req_agent_id(request, agent_id)
        cfg = resolve_effective("")
        current = str(cfg.get("notify_channel") or "off")
        channels = []
        for key in ("off",) + tuple(_NOTIFY_REMOTE_CHANNELS) + ("browser",):
            if key == "off":
                channels.append({
                    "channel": "off", "label": "关闭", "ready": True,
                    "reason": "", "verified": True,
                })
                continue
            ch_state = _notify_channel_state(key, cfg, aid)
            # 附带该频道最近一次测试结果：面板打开即可看到上次测试的结论，
            # 不用先点一次「测试」才知道状态（2026-11-14 用户报缺陷后补）。
            hist = _load_test_log().get(key) or []
            if hist:
                ch_state["last_test"] = hist[0]
            channels.append(ch_state)
        return {
            "ok": True,
            "current": current,
            # 旧键迁移后的有效值（前端据此显示，避免「明明开着却显示关闭」）
            "effective": (
                "browser" if current == "off" and cfg.get("notify_manual_mode")
                else current
            ),
            "channels": channels,
        }

    @router.post("/notify/test")
    async def post_notify_test(body: NotifyTestRequest, request: Request) -> dict:
        """测试发送一个频道；通过后才允许真正投递（q4 裁定）。"""
        return await _notify_test(
            body.channel, body.text or "", _req_agent_id(request, ""),
        )

    @router.post("/notify/send")
    async def post_notify_send(body: NotifySendRequest, request: Request) -> dict:
        """投递一条问卷待作答提醒（幂等由调用方负责）。"""
        return await notify_survey_pending(
            body.tool_call_id, body.title or "问卷", int(body.count or 0),
            _req_agent_id(request, ""),
        )

    @router.get("/notify/test-log")
    async def get_notify_test_log(channel: str = Query(default="")) -> dict:
        """各频道的测试历史（磁盘持久化，刷新/换设备都查得到）。

        2026-11-14 用户报缺陷后新增：测试结果此前只写在前端内存里，
        下拉框一重渲染就丢、切到别的频道也看不到。这里改为落盘 + 可查询。
        """
        log = _load_test_log()
        if channel:
            return {"ok": True, "channel": channel,
                    "items": log.get(channel, [])[:_TEST_LOG_MAX],
                    "limit": _TEST_LOG_MAX}
        return {"ok": True, "log": log, "limit": _TEST_LOG_MAX}

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
                    "active_scope": str(
                        (values or {}).get("__active_scope__") or ""
                    ).strip() or ("session" if sanitize_settings(values or {})
                                  else "default"),
                })
                continue
            # 2026-11-13：带上作用域标记。切到默认模式的会话虽然仍有一条
            # 记录（保留数据用），但它**不在会话模式下运行** —— 不带标记的话
            # 这个列表会把它列成"有会话覆盖"，误导排查。
            _mark = str((values or {}).get("__active_scope__") or "").strip()
            if _mark not in ("session", "default"):
                _mark = "session" if sanitize_settings(values or {}) else "default"
            out.append({
                "chat_id": chat_id,
                "session_id": info["session_id"],
                "agent_id": info["agent_id"],
                "agent_name": info["agent_name"],
                "updated_at": (values or {}).get("updated_at", 0),
                "missing": False,
                "active_scope": _mark,
                "active": (_mark == "session"),
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
        # ── 模式切换（2026-11-13 方案 D1：切默认模式**不删数据**）──────
        #
        # 请求体可带 `set_scope: "session" | "default"`：
        #   · "default" → 只打标记，会话自定义项原样保留；切回即恢复
        #   · "session" → 打标记，会话覆盖继续生效
        #
        # 不能沿用「空 settings = 清空」来做切换：实测会把会话里设过的
        # 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
        _set_scope = str((body or {}).get("set_scope") or "").strip()
        if _set_scope not in ("session", "default"):
            _set_scope = ""

        # 只带 set_scope 而 settings 为空 = 单纯切模式，**不能**当成清空，
        # 否则 D1 的核心（切默认模式保留数据）立刻失效。
        clear_all = (not settings) and (not _set_scope)

        # 整个「读 → 合并 → 写」在同一把锁内完成。
        #
        # 2026-11-13（用户需求 2）：此前无锁，两个标签页同时保存时各自基于
        # 自己读到的旧快照写回，后写者会**抹掉**先写者的改动（丢失更新），
        # 与「后写为准」正好相反。加锁后每次写入都建立在最新磁盘状态上，
        # 「最后一次为准」才成立。
        with _PREFS_LOCK:
            sessions = _load_session_prefs()

            # ── 显式删除的键要**先**捞出来 ────────────────────────────
            #
            # `sanitize_settings` 把 None 视为非法值直接丢弃（它只认 schema
            # 声明的类型），所以「传 null 表示删掉这一项」必须在 sanitize
            # 之前识别，否则永远传不进来。这里只接受 scope=both 的键，
            # 避免借删除通道动全局专属键。
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

            # ── MERGE, never replace ──────────────────────────────────────
            #
            # 曾经写成 `sessions[chat_id] = clean`，即**整体替换**：请求里没带
            # 的键会被直接抹掉，然后回落到全局默认值。用户报的「保存后被强制
            # 设置成某个默认值」就是这条 —— 实测：有 5 项覆盖，只改
            # wait_hint_sec 保存后，记录只剩 {"wait_hint_sec": 200}，
            # mode 回落到全局 recommend。
            #
            # 现在改为与现存值合并。显式删除某个键请用空值（见下）；
            # 清空整条覆盖请调 POST /session-prefs/clear。
            existing = sessions.get(chat_id)
            merged: dict = dict(existing) if isinstance(existing, dict) else {}
            merged.pop("updated_at", None)

            # ── 逐键写入时间戳（并发冲突检测，2026-11-13 需求 2）──────────
            #
            # 用户裁定：「同一会话多处写入，以最后一次为准，并提示
            # 「设置已于 xx 时间被其它位置修改」」。
            #
            # 判定依据是**逐键**时间戳 `__keyts__`，而不是文件 mtime：
            # mtime 粒度太粗（同一秒内多次写入无法区分），也无法回答
            # 「具体哪几个键被别处改了」，前端就无从给出有用提示。
            keyts: dict = {}
            if isinstance(existing, dict) and isinstance(
                existing.get("__keyts__"), dict
            ):
                keyts = dict(existing["__keyts__"])
            merged.pop("__keyts__", None)

            # 客户端「看过」的键时间戳（可选）。有它才能断定「这次覆盖了别处
            # 的改动」而不是「用户自己刚改的」。没带 seen 的调用方（卡片上的
            # 即时切换、脚本）不做判定 —— 它们本来就不展示提示。
            seen = (body or {}).get("seen")
            if not isinstance(seen, dict):
                seen = {}

            _now = time.time()
            conflicts: list[dict] = []

            # 显式删除：回到全局默认，并清掉时间戳，避免「已删的键还留着
            # 旧时间」被误判成冲突。
            for key in explicit_del:
                merged.pop(key, None)
                keyts.pop(key, None)

            # 其余键合并写入（不触碰未提交的键）。
            #
            # 空串**不**落成覆盖：字符串类设置的空值只表示「没有偏好」，
            # 等同于删掉该键。否则一个空 model_id 会被 __sources__ 标成
            # session，UI 便永远认为「用户显式设过」，跟随/回落逻辑被永久冻死。
            for key, value in clean.items():
                prev_ts = keyts.get(key, 0)
                seen_ts = seen.get(key)
                if (
                    isinstance(seen_ts, (int, float))
                    and prev_ts
                    and float(prev_ts) > float(seen_ts) + 1e-6
                ):
                    conflicts.append({
                        "key": key,
                        "previous": merged.get(key),
                        "at": float(prev_ts),
                    })
                if isinstance(value, str) and value.strip() == "":
                    merged.pop(key, None)
                    keyts.pop(key, None)
                else:
                    merged[key] = value
                    keyts[key] = _now

            # 施加作用域标记（D1）。只切模式时除标记外不写任何值，
            # 未设置的键天然继续跟随全局。
            if _set_scope:
                merged["__active_scope__"] = _set_scope

            if clear_all:
                sessions.pop(chat_id, None)
                merged = {}
                keyts = {}
            elif merged:
                merged["updated_at"] = _now
                merged["__keyts__"] = keyts
                sessions[chat_id] = merged
            else:
                # 合并后没剩任何键 → 这条覆盖已无意义，整条移除。
                sessions.pop(chat_id, None)

            _save_session_prefs(sessions)

        return {
            "ok": True, "chat_id": chat_id, "stored": bool(merged),
            "values": merged,
            "key_ts": keyts if not clear_all else {},
            # 前端据此标注「设置已于 <at> 被其它位置修改」，不阻断保存
            # （用户裁定 q1：不弹窗、只标注；q0：后写为准）。
            "conflicts": conflicts,
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

        # ── 破坏性操作必须显式确认（2026-11-13 用户裁定 q2）──────────────
        #
        # 这个端点会**真的删掉**用户在该会话里的全部自定义设置，且无法撤销。
        # 而 D1 上线后「切到默认模式」已改为只打标记、保留数据 —— 两者语义
        # 相邻，很容易被误用（例如把"切模式"写成调这里，静默丢数据）。
        # 因此要求调用方显式传 ``confirm: true``，让"删数据"永远是一个
        # 有意识的动作，而不是顺手调错。
        if not bool((body or {}).get("confirm")):
            raise HTTPException(
                status_code=400,
                detail=(
                    "clearing a session override is destructive; pass "
                    '{"confirm": true} to proceed. To just switch to the '
                    "default mode, use POST /session-prefs with "
                    '{"set_scope": "default"} instead - it keeps the data.'
                ),
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


def _sanitize_sentinel(obj: Any, _depth: int = 0) -> Any:
    """深拷贝 ``obj``，并把前端内部哨兵 ``__other__`` 归一掉。

    ## 为什么需要（2026-11-07 实测缺陷）

    `__other__` 是**前端**用来表示「用户选了『其他』并自己写了文字」的哨兵
    （`src/index.tsx` 的 `const OTHER`）。它属于实现细节，绝不该出现在给模型的
    文本里 —— 否则模型会以为用户真选了一个叫 `__other__` 的选项。

    D7 首轮修复只把哨兵从**可读块**（局部变量 ``display``）里剔除了，
    但函数末尾 `json.dumps(answer)` 序列化的是**原始入参**，于是同一段文本里
    后半截仍然带着 ``"value": "__other__"``。实测证据：

        【用户提交的问卷答案】
        - q0 [单选] 没有看到徽章          ← 可读块已剔除
        {"answers": {"q0": {"value": "__other__", ...}}}   ← raw JSON 仍泄露

    修复方式是**在序列化前深拷贝一份净化版**，原始 ``answer`` 保持不动
    （它可能被上层别处引用，就地修改会引入隐性副作用）。

    ## 归一规则（与可读块、recommend.py 保持一致）

      * 字符串 ``"__other__"``  → ``""``（空串；真实内容在 ``other`` 字段里）
      * 列表中的 ``"__other__"`` → 从列表剔除（保留用户真正选中的其余项）

    ``other`` 字段本身**照常保留** —— 用户打的字必须原样送到模型。

    递归深度上限保护：答案结构固定很浅，设上限只为防御异常输入
    （例如某上层误传了自引用结构），避免无限递归把工具调用拖死。
    """
    if _depth > 8:
        return obj
    if isinstance(obj, str):
        return "" if obj == "__other__" else obj
    if isinstance(obj, list):
        return [
            _sanitize_sentinel(x, _depth + 1)
            for x in obj
            if not (isinstance(x, str) and x == "__other__")
        ]
    if isinstance(obj, dict):
        return {k: _sanitize_sentinel(v, _depth + 1) for k, v in obj.items()}
    if isinstance(obj, tuple):
        return tuple(_sanitize_sentinel(x, _depth + 1) for x in obj)
    return obj


def _skip_reason_text(answer: dict) -> str:
    """把「谁跳的、为什么」写成一句人话，供卡片与模型共用。

    用户裁定 2026-11-08 第 1+4 项：旧实现无条件写「用户跳过了本次问卷」，
    把 watchdog / 超时 / 释放阻塞 这些**系统行为**伪装成用户意愿，模型据此
    继续决策 = 建立在假事实上。这里按 skipped_by 分流，并带上真实原因。
    """
    by = str(answer.get("skipped_by") or "")
    reason = str(answer.get("skip_reason") or "").strip()
    if by == "watchdog":
        head = "系统自动释放（自动推进看门狗）"
    elif by == "timeout":
        head = "系统自动跳过（问卷作答超时）"
    elif by in ("release", "user_release"):
        head = "用户手动释放阻塞"
    elif by in ("skip", "", "user"):
        head = "用户跳过了本次问卷"
    else:
        head = f"问卷已跳过（来源：{by}）"
    return head + ("：" + reason if reason else "")


def _format_answer_for_llm(answer: dict) -> str:
    """Render the user's answer as readable text plus the raw JSON.

    The raw JSON is kept because the upstream contract promises it; the
    readable block makes the model's life much easier.
    """
    if answer.get("skipped"):
        # 保留已有答案：watchdog 释放前 AI 可能已填好若干题（实测
        # chatcmpl-tool-9fa5a40ffabe2bca 的 q0 就被旧版裸 skip 丢掉了）。
        # 不能让模型以为「一个字都没答」，也不能把系统跳过说成用户主动。
        kept = answer.get("answers") or {}
        lines: list[str] = [_skip_reason_text(answer)]
        if kept:
            lines.append("【跳过前已作答的题目（仍然有效，请勿忽略）】")
            for key, item in kept.items():
                if not isinstance(item, dict):
                    continue
                val = item.get("value", "")
                if isinstance(val, list):
                    val = "、".join(str(v) for v in val)
                other = item.get("other") or ""
                if other:
                    val = f"{val}（其他：{other}）" if val else other
                if item.get("skipped"):
                    val = "（跳过本题）"
                lines.append(f"- {key}: {val or '（未作答）'}")
            lines.append("")
        lines.append(json.dumps(_sanitize_sentinel(answer), ensure_ascii=False))
        return "\n".join(lines)

    answers = answer.get("answers") or {}
    lines: list[str] = ["【用户提交的问卷答案】"]
    for key, item in answers.items():
        if not isinstance(item, dict):
            continue
        q_type = item.get("type", "text")
        value = item.get("value", "")
        other = item.get("other", "") or ""
        # ── D7：绝不把前端内部哨兵 `__other__` 回传给模型 ──────────────
        #
        # `__other__` 是**前端**用来表示「用户选了『其他』并自己写了文字」的
        # 哨兵（src/index.tsx:1174 `const OTHER`）。后端只有 recommend.py:36
        # 认得它，这个渲染函数原先不认 → 单选「其他」时原样拼成
        #   `q1 [单选] __other__（其他：没有看到徽章）`
        # 把实现细节泄露给模型，也让模型误以为用户选了某个叫 __other__ 的选项。
        #
        # 前端渲染侧（src/index.tsx:2235/2241）早已把哨兵剔除并把 value 归一成
        # label；这里与之对齐。真实内容在 `other` 里，剔除哨兵后自然走下面
        # `if display else other` 那条既有分支，不会丢信息。
        if isinstance(value, list):
            value = [v for v in value if str(v) != "__other__"]
            display = "、".join(str(v) for v in value)
        else:
            display = "" if str(value) == "__other__" else value
        # ── 2026-11-14 用户报障：只在「真的选了其他」时拼接 other ────────
        # 场景：用户在「其他」里写了文字，随后改选普通选项，前端旧实现没清
        # `other` → 这里会拼成「甲（其他：用户手写文字）」，模型读成「用户
        # 选了甲并补充了这句话」，而用户根本没补充。
        # 判据与前端 `sanitizeOther` 一致：value 为空或仍是哨兵 `__other__`
        # （说明用户没选任何普通选项，内容确实在 other 里）才拼接；value 是
        # 具体选项时 other 属残留，忽略。
        # 这样既修掉脏数据，又不破坏合法场景（选「其他」时 value 已被上面
        # 归一成 ""，仍会拼上）。
        value_is_option = bool(str(display).strip())
        if other and not value_is_option:
            display = other
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
        #
        # ── D4（用户裁定 2026-11-07 q1/q3）：跳过有三种来源，措辞必须分开 ──
        #
        # 原先任何 `skipped` 都写成「（用户跳过本题）」，于是 AI 自动跳过观察题
        # 会被模型读成"用户主动放弃了这题" —— 事实相反：用户**根本没被问过**。
        # 这类误述会让后续决策建立在错误归因上（"用户不想回答" vs
        # "系统没让用户答"），所以必须按 `skipped_by` 分流：
        #   · requires_human → 自动模式因「只能真人观察」而跳过（用户没被问）
        #   · no_recommend   → 自动模式因无可用推荐而跳过（用户没被问）
        #   · 其它/缺省       → 真的是用户点了「跳过本题」
        _skip_by = str(item.get("skipped_by") or "")
        if item.get("skipped"):
            if _skip_by == "requires_human":
                display = "（AI 跳过：需人工观察，未交给用户作答）"
            elif _skip_by == "no_recommend":
                display = "（AI 跳过：无可用推荐）"
            else:
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
    # raw JSON 也要净化：D7 首轮只改了上面的可读块，这里序列化的仍是原始
    # 入参 → `"value": "__other__"` 照样送到模型眼前。深拷贝后再净化，
    # 原始 answer 不受影响（见 `_sanitize_sentinel` 的说明）。
    lines.append(json.dumps(_sanitize_sentinel(answer), ensure_ascii=False))
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
    # 延迟 import：recommend 是可选引擎（`_load_recommend_engine` 有降级路径），
    # 顶层 import 会让「引擎缺失」从「推进不工作」升级成「插件加载失败」。
    try:
        from .recommend import question_recommended as _qrec
    except Exception:  # noqa: BLE001 — 摘要渲染绝不能因为可选引擎而崩
        _qrec = None
    lines = [f"❓ **{title or '问卷'}**"]
    for i, q in enumerate(questions):
        # D8a：题型必须走 infer_qtype，与卡片/分析器同一真相源。
        # 原先 `q.get("type", "text")` 不做推断 → 模型省略 type 但有 options 的题
        # （很常见，schema 里 type 是可选）会在气泡里被标成 `[问答]`，
        # 而卡片实际渲染成单选题 —— 摘要与真实界面不一致（自检 #2/#3 实测）。
        try:
            q_type = _analysis.infer_qtype(q)
        except Exception:  # noqa: BLE001
            q_type = q.get("type", "text")
        q_title = q.get("title", f"Q{i + 1}")
        label = _TYPE_LABELS.get(q_type, q_type)
        options = q.get("options") or []
        suffix = f"（{'、'.join(_opt_text(o) for o in options)}）" if options else ""
        # Surface the model's own recommendation to the model on the next turn,
        # so it stays consistent with what the user saw / auto-accepted.
        #
        # D8b：必须复用 question_recommended()，它才认 `ai_recommended` 别名
        # （早期版本用过这个名字，模型偶尔还在用）。原实现只读 `recommended`
        # → 用别名的推荐不会出现在 ⟨推荐：…⟩ 里，模型下一轮就看不到自己标过什么。
        rec = _qrec(q) if _qrec is not None else _legacy_rec_list(q)
        if rec:
            suffix += f" ⟨推荐：{'、'.join(rec)}⟩"
        lines.append(f"{i + 1}. [{label}] {q_title}{suffix}")
    return "\n".join(lines)


def _legacy_rec_list(q: Any) -> list[str]:
    """Fallback when the optional recommend engine cannot be imported.

    Kept deliberately tiny — it mirrors ``recommend.question_recommended`` so the
    summary never silently loses the recommendation just because the engine
    module failed to load.
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

        # ★ 必须把当前生效的 mode 一起传下去（2026-11-07 真机抓出的缺陷）。
        #
        # `svc.create()` 早在阶段 0 就支持 mode 参数，但这里的调用**一直没传**，
        # 于是每份真实问卷的后端 state 都停在默认 `manual` —— 后端推进循环
        # （阶段 2）看到 mode != recommend 就直接 return，**永不推进**。
        # 用后端注入 state 的测试发现不了这个问题（那时 mode 是测试自己设的），
        # 只有走真实 agent 链路弹问卷才暴露：卡片显示「只用推荐」，state 却是 manual。
        #
        # 解析链与会话设置一致：session_id → chat UUID → resolve_effective 三层合并。
        #
        # 中间件运行在 agent 内部，`_iter_agent_chats()`（要访问宿主 chat manager）
        # 不一定可用，所以再加一层兜底：直接扫覆盖文件里 **键就是 session_id**
        # 的记录。用户在前端面板保存时，如果拿不到 chat UUID 就会用 session_id 当键，
        # 这一层保证那种情况下 mode 也能取到。
        _chat_id = ""
        try:
            _chat_id = _resolve_chat_id("", session_id, agent_id)
            _eff = resolve_effective(_chat_id).get("mode") if _chat_id else None
            if not _eff:
                _ov = _load_session_prefs()
                if isinstance(_ov, dict):
                    for _k in (session_id, f"{session_id}:{agent_id}"):
                        _s = _ov.get(_k)
                        if isinstance(_s, dict) and _s.get("mode"):
                            _eff = _s["mode"]
                            break
            _mode = str(_eff or "manual")
            # 诊断（2026-11-13）：mode 解析结果必须可见，否则"问卷秒被自动答完"
            # 无法区分是「配置读错」还是「配置本身如此」。
            # 保留为 INFO：这条是"问卷被秒自动答完"类故障的唯一快速判据
            # （2026-11-13 实测：正是靠它一眼区分"配置读错"与"配置本身如此"）。
            # 每份问卷只打一次，不构成日志噪音。
            logger.info(
                "survey-mode resolve: session=%s agent=%s chat=%s eff=%r -> %s",
                session_id[:12] or "-", agent_id or "-",
                _chat_id[:8] or "-", _eff, _mode,
            )
            if _mode not in ("ai", "recommend", "manual"):
                _mode = "manual"
        except Exception:  # noqa: BLE001 — 取不到就用保守默认，绝不阻挡问卷
            logger.warning("could not resolve survey mode", exc_info=True)
            _mode = "manual"

        # ★ 同时把「生效设置快照」一起传下去（阶段 3）。
        #
        # `ai` 推进要在**完全没有页面**的情况下调模型，因此它必须自带
        # 用哪个模型 / 要不要带上下文 / 超时多少。存快照而不是让推进循环现查：
        # 现查要反读文件 + 反查 chat UUID，而且用户在问卷进行中改了设置
        # 会让正在跑的问卷**中途换模型** —— 一道题用一个模型，结果不可比。
        _prefs: dict = {}
        try:
            _cfg = resolve_effective(_chat_id) if _chat_id else {}
            _prefs = {
                "model_id": str(_cfg.get("model_id") or ""),
                "with_context": bool(_cfg.get("with_context")),
                "model_timeout_sec": float(_cfg.get("model_timeout_sec") or 0),
                "template_id": str(_cfg.get("template_id") or ""),
            }
        except Exception:  # noqa: BLE001 — 取不到就用默认，绝不阻挡问卷
            logger.warning("could not resolve survey prefs", exc_info=True)

        pending = await svc.create(
            session_id=session_id,
            agent_id=agent_id,
            user_id=user_id,
            channel=channel,
            title=title,
            questions=questions,
            tool_call_id=str(getattr(tool_call, "id", "") or ""),
            mode=_mode,
            prefs=_prefs,
        )

        # Remember the question list too, so a reloaded card can address the
        # right pending record by tool_call_id instead of guessing.
        _register_question(pending.request_id, session_id, questions)

        # ── 阶段 1：给这份问卷挂看门狗（只对自动模式生效）────────────
        # 用户裁定（2026-11-07）：手动释放 + 看门狗 60s 无进展释放。
        # 判据在 question_service._watchdog_loop 里按 mode 二次过滤：
        # manual 不干预（人工作答本来就会停顿），只有 ai/recommend
        # 这种「本该自己动」的模式卡住才回收。
        try:
            svc.ensure_watchdog(pending.tool_call_id)
        except Exception:  # noqa: BLE001 — 看门狗起不来不能阻挡问卷弹出
            logger.warning("could not start survey watchdog", exc_info=True)

        # ── 阶段 2：recommend 模式的后端推进 ─────────────────────────
        # 用户裁定（2026-11-07）：recommend 模式下由**后端**逐题推进并广播，
        # 前端只渲染；这样关掉所有页面问卷也能走完。manual 等人操作、
        # ai 要调模型（阶段 3），所以这里只对 recommend 起循环。
        try:
            svc._prune_stale_runners()   # 先清上一代代码的僵尸 task
            svc._sync_runners(pending.tool_call_id)
        except Exception:  # noqa: BLE001 — 推进起不来不能阻挡问卷弹出
            logger.warning("could not start survey runner", exc_info=True)

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
            _to_reason = f"问卷作答超时（{timeout:.0f} 秒未作答），系统自动跳过"
            try:
                await asyncio.shield(svc.skip(
                    pending.request_id, reason=_to_reason, by="timeout"))
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
                    f"【{_to_reason}】\n"
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
                await asyncio.shield(svc.skip(
                    pending.request_id,
                    reason="用户停止了本轮会话，等待中的问卷被取消",
                    by="cancel"))
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
        _attach_to_host_log()
        logger.info("Registering question-modal plugin (2.x port)...")
        # 清掉上一代代码遗留的 runner task（它们跑的是旧代码对象，
        # 曾导致 survey_states.json 被旧版固定 tmp 名并发写没）
        try:
            get_question_service()._prune_stale_runners()
        except Exception:  # noqa: BLE001
            logger.warning("could not prune stale runners", exc_info=True)

        # ── 0. 引擎自检：确认 recommend 推进引擎在**生产加载方式**下可用 ──
        #
        # 为什么在这里做（2026-11-07 真机抓出的缺陷）：`_runner_loop` 里若写成
        # 裸 `import recommend`，在生产环境（插件以**包**加载、插件目录不在
        # sys.path）必然 ModuleNotFoundError，且被 except 吞掉 → **runner
        # 静默不工作**，外部只看到「关掉页面就不推进了」。
        #
        # 这类失败必须**在启动时大声报出来**，而不是等到用户关掉页面才发生。
        # 用相对导入（`.recommend`）保证能命中，并在这里显式验证一次。
        try:
            from . import recommend as _rec_check
            _missing = [fn for fn in ("step_once", "prune_hidden",
                                      "visible_indices", "is_visible",
                                      "chosen_tokens", "question_recommended",
                                      "choice_for_question", "filled_answer")
                        if not callable(getattr(_rec_check, fn, None))]
            if _missing:
                logger.error(
                    "question_modal: recommend engine loaded but missing %s "
                    "— backend driving will NOT work", _missing)
            else:
                logger.info(
                    "question_modal: recommend engine ready "
                    "(backend driving available)")
        except Exception:  # noqa: BLE001
            logger.error(
                "question_modal: recommend engine FAILED to load — "
                "backend driving unavailable, surveys will stall when the "
                "page closes", exc_info=True)

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
                    "**观察题（必标）：若某题的答案只有用户亲眼看到界面才能给出"
                    "（如「你看到了什么」「徽章标在哪一项」），必须在该题加 "
                    "requires_human: true。自动模式（ai/只用推荐）由模型作答，"
                    "而模型看不到用户屏幕，只能凭题面猜——不标就会编造一个具体但错误的"
                    "观察结果（实测 AI 答\"徽章在 B 项\"、用户实际\"在 A 左侧\"）。"
                    "标了之后自动模式会跳过该题并标注「AI 跳过：需人工观察」，"
                    "绝不替你编答案。征求意见/判断题（「你觉得」「你认为哪个更好」）"
                    "**不要**标 requires_human——那些你可以回答。**"
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
