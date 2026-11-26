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
import re
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

# ── 外置持久化层（2026-11-25 配置丢失修复）──────────────────────────
# 兼容两种加载方式：生产走包内相对导入；验证脚本以顶层模块加载时裸导入兜底
# （与 recommend/analysis 的既有口径一致）。
try:
    from . import qm_storage as _store
except ImportError:  # pragma: no cover — 顶层加载（验证脚本）
    import qm_storage as _store  # type: ignore[no-redef]

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
_GATE_FILE = _store.MigrationPath("gate_blocks.json")


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
_RESULTS_FILE = _store.MigrationPath("answered_results.json")
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
_PREFS_FILE = _store.MigrationPath("analysis_prefs.json")
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
    """Body of :func:`_save_prefs`; caller must hold ``_PREFS_LOCK``.

    ★ 2026-11-17：返回值追加 ``__rejected__``（被拒键列表）。
      ``post_prefs`` 用它把「部分成功」如实回传给调用方；读路径上的调用者
      只看 ``__rejected__`` 之外的键，行为与旧版一致。
    """
    cur = _load_prefs()
    # Every schema key is accepted here (validated + clamped by
    # ``sanitize_settings``), so adding a setting no longer means editing this
    # function — one schema, one validator, one merge path.
    _clean, _rejected = sanitize_settings(patch)
    cur.update(_clean)
    cur["updated_at"] = time.time()
    try:
        tmp = _PREFS_FILE.parent / (
            f"{_PREFS_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
        tmp.write_text(json.dumps(cur, ensure_ascii=False), encoding="utf-8")
        tmp.replace(_PREFS_FILE)
    except Exception:  # noqa: BLE001 — the card keeps a localStorage mirror
        logger.warning("question_modal: could not persist prefs", exc_info=True)
    # 🔴 __rejected__ 只放进**返回副本**，绝不能写进磁盘 ——
    #    否则它会被当成一个「设置项」持久化，下次 _load_prefs 读回来
    #    再传给 sanitize_settings（未知键静默忽略）虽不致命，但会让
    #    analysis_prefs.json 里混入非配置数据。
    out = dict(cur)
    out["__rejected__"] = _rejected
    return out


# ── 子代理模式运行参数（2026-11-26，full 档，契约 v1.2）──────────────
# 独立文件 subagent_prefs.json（外置目录，已登记 qm_storage.DATA_FILES）。
# 只在子代理会话生效、优先级最高；主代理会话完全不读这一层。
_SUBAGENT_PREFS_FILE = _store.MigrationPath("subagent_prefs.json")
_SUBAGENT_PARAM_KEYS = (
    "mode", "model_id", "template_id", "with_context", "parallel",
)
_SUBAGENT_DEFAULTS: dict[str, Any] = {
    "mode": "recommend",   # boss 定稿：只用推荐，服务端自答不卡死
    "model_id": "",
    "template_id": "",
    "with_context": False,
    "parallel": False,
}


def _load_subagent_params() -> dict:
    """读子代理参数；文件缺失/损坏一律回内置默认，绝不写空值覆盖。"""
    out = dict(_SUBAGENT_DEFAULTS)
    try:
        if _SUBAGENT_PREFS_FILE.is_file():
            data = json.loads(_SUBAGENT_PREFS_FILE.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                for k in _SUBAGENT_PARAM_KEYS:
                    if k in data:
                        out[k] = data[k]
    except Exception:  # noqa: BLE001 — 配置损坏不能挡住问卷
        logger.warning("question_modal: could not read subagent params",
                       exc_info=True)
    return out


def _save_subagent_params(patch: Any) -> dict:
    """merge 写入子代理参数（参数化 save 变体，R5）。

    复用 _save_prefs_locked 的同一套：sanitize_settings 校验（白名单拒绝
    非法值）+ _PREFS_LOCK 串行 + 原子 replace + __rejected__ 回传。
    仅目标文件从 analysis_prefs.json 换成 subagent_prefs.json。
    """
    with _PREFS_LOCK:
        cur = _load_subagent_params()
        clean, rejected = sanitize_settings(patch)
        # 只接受子代理参数键，其它一律拒绝（sanitize 已过滤未知键，这里
        # 再挡掉 SETTINGS_SCHEMA 中不属于子代理参数的键，避免混装）。
        clean = {k: v for k, v in clean.items() if k in _SUBAGENT_PARAM_KEYS}
        extra = [k for k in (patch or {})
                 if k in SETTINGS_SCHEMA and k not in _SUBAGENT_PARAM_KEYS]
        for k in extra:
            rejected.append({"key": k, "reason": "not a subagent param"})
        cur.update(clean)
        cur["updated_at"] = time.time()
        try:
            tmp = _SUBAGENT_PREFS_FILE.parent / (
                f"{_SUBAGENT_PREFS_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
            tmp.write_text(json.dumps(cur, ensure_ascii=False), encoding="utf-8")
            tmp.replace(_SUBAGENT_PREFS_FILE)
        except Exception:  # noqa: BLE001
            logger.warning("question_modal: could not persist subagent params",
                           exc_info=True)
        out = dict(cur)
        out["__rejected__"] = rejected
        return out


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
        "label": "（旧）人工模式提醒频道",
    },
    # ── 双场景通知频道（2026-11-19，boss 需求：通知不再固定单选）──────
    #
    # 旧 `notify_channel` 是全局单选，无法区分「人在 PC 前」与「页面已关」
    # 两种场景。现拆成两个场景键，发送时按**页面心跳**自动选择：
    #   notify_channel_pc  PC 端打开时（前端轮询 _PC_ALIVE_SEC 内有过触达）
    #                      可选 browser / wechat / dingtalk / feishu
    #   notify_channel_bg  后台运行时（页面关闭或长时间切后台）
    #                      只可选 wechat / dingtalk / feishu —— **无 browser**：
    #                      页面都不在了，浏览器通知必然无效。
    #
    # 旧键保留为只读迁移源（见 `_migrate_notify_channels`）：新键从未被
    # 显式设置时从旧键推导；显式设置过（哪怕设成 off）一律尊重显式值。
    "notify_channel_pc": {
        "default": "off", "type": "enum", "scope": "global", "batch": 5,
        "values": ["off", "browser", "wechat", "dingtalk", "feishu", "custom_api"],
        "label": "PC 端打开时提醒频道",
    },
    "notify_channel_bg": {
        "default": "off", "type": "enum", "scope": "global", "batch": 5,
        "values": ["off", "wechat", "dingtalk", "feishu", "custom_api"],
        "label": "后台运行时提醒频道",
    },
    # ── 自定义 API 渠道（2026-11-23）────────────────────────────────
    #
    # 缺陷背景（boss 原话）：「当前的实现方式不满足……用户不知道哪些是属于
    # 必传项，是否符合大部分的 API 请求以及参数要求」。原实现是纯 UI 占位卡，
    # 固定 4 字段，无法补上对方 API 要求的必传参数。
    #
    # 定位：**简单消息推送**，只发标题 + 脱敏摘要，不做通用 Webhook 编排。
    # 明确排除（boss 裁定）：嵌套对象自动构造、数组参数、条件映射、重试队列、
    # 多套渠道并存。复杂需求走「高级模式」由用户自己写 body 模板。
    #
    # 双模式（boss 裁定 C）：
    #   basic    参数行 [{key,value,required}] → 扁平平铺成 body
    #   advanced 用户自写整段 body 模板 → 只做占位符插值
    #
    # 占位符（boss 裁定 4 个 + token）：{{title}} {{content}} {{count}}
    # {{stamp}} {{token}}
    "custom_api_enabled": {
        "default": False, "type": "bool", "scope": "global", "batch": 5,
        "label": "启用自定义 API 渠道",
    },
    "custom_api_url": {
        "default": "", "type": "str", "scope": "global", "batch": 5,
        "maxlen": 2048,
        "label": "自定义 API 请求地址",
    },
    "custom_api_method": {
        "default": "post_json", "type": "enum", "scope": "global", "batch": 5,
        "values": ["post_json", "get_query"],
        "label": "自定义 API 请求方法",
    },
    "custom_api_mode": {
        "default": "basic", "type": "enum", "scope": "global", "batch": 5,
        "values": ["basic", "advanced"],
        "label": "自定义 API 参数模式",
    },
    "custom_api_params": {
        "default": [], "type": "json", "scope": "global", "batch": 5,
        "max_items": 20, "label": "自定义 API 参数行",
    },
    "custom_api_body": {
        "default": "", "type": "str", "scope": "global", "batch": 5,
        "maxlen": 8192,
        "label": "自定义 API body 模板（高级模式）",
    },
    "custom_api_token": {
        "default": "", "type": "str", "scope": "global", "batch": 5,
        "maxlen": 4096, "secret": True,
        "label": "自定义 API Token",
    },
    "custom_api_token_pos": {
        "default": "none", "type": "enum", "scope": "global", "batch": 5,
        "values": ["none", "bearer", "query"],
        "label": "自定义 API Token 位置",
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
    # ── 挂起自动释放（P0-1，2026-11-15）────────────────────────────
    #
    # 用户裁定（2026-11-15）：把原本硬编码的 30 分钟兜底超时做成可配，
    # 并**保留「关闭」**（= 0，永不自动释放）。boss 明确知情并接受代价：
    # 关闭后挂起问卷会一直保留，对应会话发新消息持续 409，只能到
    # 「挂起清理」页签手动释放。
    #
    # 为什么 scope 是 global 而非 both：释放策略是"这台机器怎么对待所有
    # 挂起问卷"的运维决策，不是单个会话的作答偏好；会话级覆盖会让
    # 「同一个后台循环对不同问卷用不同阈值」，排查时无法用一句话解释。
    #
    # 为什么 max 是 28800（8 小时）而非更大：正常一天内必然有人值守。
    # 超过 8 小时仍未处理，说明是人主动放着，此时手动释放比自动更好
    # —— 自动释放反而是替用户做了他没做的决定。
    "release_after_sec": {
        "default": 1800, "type": "int", "min": 0, "max": 28800,
        "scope": "global", "batch": 4, "label": "挂起自动释放",
        # ★ 越界拒绝而不是夹紧：min=0 且 0 表示「关闭」，把 -5 夹成 0
        #   等于把一次输错静默升级为"永不释放"。见 `_coerce_setting` 注释。
        "clamp": False,
        # 只允许 UI 提供的五个档位；1.5 之类的值在区间内但无意义，直接拒。
        "choices": (0, 1800, 3600, 14400, 28800),
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
        # ── `clamp: False` 语义（2026-11-15，为 release_after_sec 引入）──
        #
        # 默认行为是「越界夹紧」（用户输 5 到超时框 → 得到 30 秒下限，
        # 而不是一个坏掉的运行）。但对**边界值本身有强语义**的设置项，
        # 夹紧是危险的：
        #
        #   release_after_sec: min=0 且 0 = 「关闭自动释放」
        #   脏数据 -5 → 夹到 0 → **静默变成最危险的档位**
        #   （永不释放 → 会话可能永久 409）。
        #
        # 把「一次输错」静默升级成「系统永久改变行为」是典型的兜底陷阱
        # （工作区纪律：该报错就报错，别让失败以成功的样子出现）。
        # 故此类项一律**越界即拒绝**，由调用方看到 ok=False 并回报错误。
        if spec.get("clamp", True) is False:
            if (lo is not None and num < lo) or (hi is not None and num > hi):
                return False, None
            allowed = spec.get("choices")
            if allowed is not None and num not in allowed:
                return False, None
            return True, num
        if lo is not None and num < lo:
            num = lo
        if hi is not None and num > hi:
            num = hi
        # 可选：限定只能取这几个值（如挂起释放的 0/1800/3600/14400/28800）。
        # 与 `clamp: False` 配合时，落在区间内但不属于允许集合的值也会被拒
        # （例如 1.5 → int 1，在 [0,28800] 内却不是一个有意义的档位）。
        allowed = spec.get("choices")
        if allowed is not None and num not in allowed:
            return False, None
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
    if kind == "json":
        # ── `json` 类型（2026-11-23，为 custom_api_params 引入）──
        #
        # 为什么必须新增这一支：`sanitize_settings` 是白名单机制，
        # 未在 SETTINGS_SCHEMA 声明的键一律**静默丢弃**（见其 docstring）。
        # 若把参数行做成任意 dict 直接塞进 prefs，用户填的参数会在保存时
        # 无声消失 —— 界面上「保存成功」，实际没存，正是本插件反复纠治
        # 的「界面说谎」（参见 2026-11-17 的 release_after_sec 事故）。
        #
        # 这里做**结构白名单**深校验：只接受约定的字段，多余字段丢弃，
        # 不合法的整行拒绝（由调用方回报 rejected），绝不静默改写用户数据。
        #
        # 注意：本支只有 custom_api_params 使用（数组型）。它与 int 分支
        # 的 `choices`、enum 分支的 `values` 完全隔离，不影响既有类型校验。
        return _coerce_json_list(value, spec)
    return False, None


_PARAM_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_.\-]*$")


def _coerce_json_list(value: Any, spec: dict) -> tuple[bool, Any]:
    """校验 `custom_api_params` 这类「对象数组」配置项。

    规则（与设计方案逐条对应）：
      · 顶层必须是 list
      · 行数 ≤ spec["max_items"]（默认 20）
      · 每行是 dict，只保留 key / value / required 三个字段
      · key 非空、≤64 字符、匹配 `^[A-Za-z_][A-Za-z0-9_.\\-]*$`
      · value ≤512 字符（非字符串一律转 str 后截断——用户填数字/布尔很常见）
      · required 强制转 bool
      · **键名重复整行拒绝**（不静默覆盖，避免「我填了两行只发出去一行」）
      · 整体序列化 ≤ 8KB（防单条配置撑爆 prefs 文件）

    返回 ``(ok, cleaned)``：任一行不合法即整体 ok=False（调用方据此报
    rejected），不做「部分行保留」——参数行之间可能互相依赖，静默丢一半
    比整体报错更难排查。
    """
    if not isinstance(value, list):
        return False, None
    max_items = int(spec.get("max_items") or 20)
    if len(value) > max_items:
        return False, None
    out: list = []
    seen: set = set()
    for row in value:
        if not isinstance(row, dict):
            return False, None
        k = str(row.get("key") or "").strip()
        if not k or len(k) > 64 or not _PARAM_KEY_RE.match(k):
            return False, None
        if k in seen:
            return False, None          # 键名重复：整行拒绝
        seen.add(k)
        v = row.get("value")
        if v is None:
            v = ""
        elif not isinstance(v, str):
            v = str(v)
        if len(v) > 512:
            return False, None
        out.append({"key": k, "value": v, "required": bool(row.get("required"))})
    try:
        if len(json.dumps(out, ensure_ascii=False).encode("utf-8")) > 8192:
            return False, None
    except (TypeError, ValueError):
        return False, None
    return True, out


def sanitize_settings(patch: Any) -> tuple[dict, list[dict]]:
    """Keep only schema-known keys with valid (or clamped) values.

    Returns ``(clean, rejected)``.

    ★ 2026-11-17（REQ-2026-0072 / API_CONTRACT_v5 CHG-001）签名变更：
      旧签名只返回 ``clean``，于是被拒绝的值**静默消失** ——
      `POST /prefs {"release_after_sec": 7200}` 返回 200 + ok:true，
      但值根本没写进去（实测：回读仍为 1800）。用户看到的「保存成功」
      是假的，这是典型的「界面说谎」。

      改成返回二元组后，调用方既能拿到清理结果，也能把**每个被拒的键**
      连同原因回传。boss 2026-11-17 裁定：「部分成功：200 + ok:false +
      逐项 rejected，合法项照写、非法项报错」。

    ★ 为什么直接改签名而不是新增一个 _detailed 版本（评审 R-4 曾建议后者）：
      boss 明确裁定「直接改签名，11 处一并改」。改完每一处都显式丢弃
      rejected，等于强制后来者在读路径上也看一眼「这里会有被拒的键」，
      比悄悄保留一个旧签名更容易发现遗漏。

    🔴 注意 ``rejected`` 里**不含** schema 之外的未知键：那类键历来是
       静默忽略的（调用方可能传 UI 的临时字段），把它们当「被拒」会
       制造噪音。只有「schema 认识但值不合法」才算 rejected。
    """
    if not isinstance(patch, dict):
        return {}, []
    clean: dict = {}
    rejected: list[dict] = []
    for key, value in patch.items():
        if key not in SETTINGS_SCHEMA:
            continue                      # 未知键：静默忽略（既有语义，不算 rejected）
        ok, norm = _coerce_setting(key, value)
        if ok:
            clean[key] = norm
        else:
            rejected.append({
                "key": key,
                "value": value,
                "reason": _reject_reason(key, value),
            })
    return clean, rejected


def _reject_reason(key: str, value: Any) -> str:
    """给被拒的键生成人类可读原因（必须含合法取值域，否则用户不知怎么改）。"""
    spec = SETTINGS_SCHEMA.get(key) or {}
    typ = spec.get("type")
    if typ == "enum":
        return "只接受 %s" % "/".join(str(v) for v in spec.get("values") or [])
    if typ in ("int", "float"):
        choices = spec.get("choices")
        if choices:
            return "不在允许档位 %s" % "/".join(str(c) for c in choices)
        lo, hi = spec.get("min"), spec.get("max")
        if lo is not None and hi is not None:
            return "需为 %s~%s 之间的整数" % (lo, hi)
        return "取值不合法"
    if typ == "bool":
        return "只接受 true / false"
    if typ == "str":
        maxlen = spec.get("maxlen")
        return "需为字符串%s" % (("且不超过 %d 字" % maxlen) if maxlen else "")
    return "取值不合法"


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
    """统一配置 ⊕ 命中的时间策略 —— 读设置**唯一**入口。

    ## 2026-11-23 架构变更（boss 裁定）
    旧实现是「内建默认 ⊕ 全局 ⊕ **会话覆盖**」两层作用域，对应界面上
    「默认模式 / 会话模式」两个页签。boss 裁定取消会话级配置：

    > 「不再采用会话模式或者默认模式，全部采用统一的配置，所有的会话都生效
    >  同一种配置…… 所有的设置参数，直接使用时间段这个策略来匹配」

    新链路：

        out  = schema_defaults()
        out ⊕= prefs                      ← 唯一一份基础配置，所有会话共用
        out ⊕= 命中时间策略引用的参数组    ← 时段覆盖（仅答题相关字段）
        out ⊕= 命中时间策略引用的通知配置  ← 时段覆盖（仅通知渠道）

    `chat_id` 参数**保留但不再参与配置合并**：调用方遍布全插件，全部改签名
    风险大于收益；且保留它便于日志区分来源。它仍会影响「跟随当前对话模型」
    的解析（那需要 chat_id 去宿主查当前模型），所以不能真的删掉。

    ## 层叠优先级（boss 二.「时段优先」裁定）
    时段命中时**盖过**基础配置——用户配了时段就是希望自动切换。没有「会话
    显式覆盖」这一层与之竞争（那层已整体移除），所以不存在歧义。

    ## NOTE
    this is the *merge* only (disk-backed layers).  「跟随当前对话模型」的
    解析需要请求到达宿主，所以它在 :func:`_fill_follow_active` 里、由 HTTP
    路由应用。分开意味着同步调用方拿到的是纯 merge。
    """
    out = schema_defaults()

    # ① 基础配置（唯一一份，所有会话共用）
    try:
        out.update(sanitize_settings(_load_prefs())[0])
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not merge global prefs", exc_info=True,
        )

    # ② 命中的时间策略 → 参数组 + 通知配置
    #
    # 用 try 包住：库文件损坏时宁可退回基础配置，也不能让整个读配置入口抛错
    # （那样连卡片都渲染不出来）。但必须留 WARNING，不能静默降级。
    matched: dict | None = None
    # 策略层**显式**设置过的键。要让 _migrate_notify_channels 知道
    # 哪些键是被策略覆盖的（否则旧键迁移会把它盖掉，实测过）。
    sched_set: set = set()
    try:
        matched = match_schedule()
        if matched:
            ps_id = str(matched.get("param_set_id") or "")
            if ps_id:
                for ps in load_param_sets():
                    if ps.get("id") != ps_id:
                        continue
                    params = ps.get("params") or {}
                    # 只用白名单字段覆盖，绝不整块 update（参数组里混入的
                    # 任何非答题字段都不该影响全局配置）
                    for key in _PARAM_SET_KEYS:
                        if key in params:
                            out[key] = params[key]
                            sched_set.add(key)
                    break
            np_id = str(matched.get("notify_profile_id") or "")
            if np_id:
                for prof in load_notify_profiles():
                    if prof.get("id") != np_id:
                        continue
                    ch = prof.get("channels") or {}
                    if ch.get("pc"):
                        out["notify_channel_pc"] = ch["pc"]
                        sched_set.add("notify_channel_pc")
                    if ch.get("bg"):
                        out["notify_channel_bg"] = ch["bg"]
                        sched_set.add("notify_channel_bg")
                    break
            # 把命中信息一并回传：前端要显示「当前生效：第N条 夜间值守」，
            # 后端日志也需要它来回答「为什么现在是这个行为」。
            out["__schedule__"] = {
                "id": str(matched.get("id") or ""),
                "name": str(matched.get("name") or ""),
            }
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not apply schedule layer", exc_info=True,
        )
    if not matched:
        out["__schedule__"] = None

    # ③ 通知渠道旧单选 → 双场景只读迁移（2026-11-19）
    # 必须在**所有**合并之后做：只看磁盘 prefs 里「新键是否被显式设置过」，
    # 显式值（哪怕 off）优先，绝不覆盖用户选择或时段覆盖的结果。
    try:
        _migrate_notify_channels(out, sched_set)
    except Exception:  # noqa: BLE001 — 迁移失败回落默认值，绝不阻断读配置
        logger.warning(
            "question_modal: notify channel migration failed", exc_info=True,
        )

    # ④ 来源标注
    #
    # 2026-11-23：会话层已移除，sources 只可能来自「时间策略」。
    # 保留这个键是因为前端仍用它渲染「本项由时段覆盖」的提示；键名沿用
    # 历史值 "schedule"（不是 "session"），让 UI 与日志能一眼分清来源。
    sources: dict = {}
    if matched:
        try:
            ps_id = str(matched.get("param_set_id") or "")
            for ps in load_param_sets():
                if ps.get("id") == ps_id:
                    for key in (ps.get("params") or {}):
                        if key in _PARAM_SET_KEYS:
                            sources[key] = "schedule"
                    break
            np_id = str(matched.get("notify_profile_id") or "")
            for prof in load_notify_profiles():
                if prof.get("id") == np_id:
                    for key in (prof.get("channels") or {}):
                        sources["notify_channel_" + key] = "schedule"
                    break
        except Exception:  # noqa: BLE001
            pass
    out["__sources__"] = sources
    # ── Token 打码（2026-11-23，custom_api_token）──────────────────
    #
    # SECRET 类配置一律**不把原文送进通用读路径**：resolve_effective 的结果
    # 会经 /prefs 等接口整体回给前端，若原样下发就等于把凭据明文暴露在
    # 浏览器与日志里（与 client_secret 的处理口径保持一致）。
    #
    # 约定：回给调用方的是 `custom_api_token_set`（布尔，供 UI 判断「已设置」）
    # 加一个掩码串；真实值只在投递时由 :func:`_custom_api_token_value` 从
    # 磁盘直读。空值时不下发掩码，避免 UI 显示「已设置」。
    _tok = str(out.get("custom_api_token") or "")
    out["custom_api_token_set"] = bool(_tok)
    out["custom_api_token"] = ("*" * 8) if _tok else ""
    return out


def _custom_api_token_value() -> str:
    """从磁盘直读 custom_api_token 的真实值（不经 resolve_effective 打码）。

    只供投递路径使用。故意不放进 resolve_effective：那条路径的结果会被
    接口整体下发给前端，一旦混入真实凭据就等于永久泄密。
    """
    try:
        raw = _load_prefs()
        ok, val = _coerce_setting("custom_api_token", raw.get("custom_api_token"))
        return val if ok else ""
    except Exception:  # noqa: BLE001
        logger.warning(
            "question_modal: could not read custom api token", exc_info=True,
        )
        return ""


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

# ── 前端页面心跳（双场景判定信号，2026-11-19）───────────────────────────
#
# 「PC 端打开」vs「后台运行」的判定依据：前端问卷面板本来就以秒级轮询
# ``GET /pending``（页面关闭或长时间切后台会停轮询），后端在该接口入口
# 记录每个会话的最近触达时间。发通知时：
#   距上次触达 ≤ _PC_ALIVE_SEC → PC 端打开 → 用 notify_channel_pc
#   否则                       → 后台运行 → 用 notify_channel_bg
#
# 已知取舍（boss 知情）：会话的第一份问卷在创建瞬间，前端面板尚未开始
# 轮询，若该会话此前从无触达记录，会被判为「后台」→ 走 IM 渠道。
# 误判方向是「宁发 IM、不丢通知」，可接受。
_FRONTEND_SEEN: dict[str, float] = {}
_FRONTEND_SEEN_LOCK = threading.Lock()
_PC_ALIVE_SEC = 120


def _mark_frontend_seen(session_id: str) -> None:
    """记录一次前端触达（pending 轮询等）。内存态即可，重启丢失无妨。"""
    sid = str(session_id or "").strip()
    if not sid:
        return
    with _FRONTEND_SEEN_LOCK:
        _FRONTEND_SEEN[sid] = time.time()
        # 防无限增长：只保留活跃窗口相关的会话。
        if len(_FRONTEND_SEEN) > 512:
            cutoff = time.time() - _PC_ALIVE_SEC * 4
            for stale in [k for k, v in _FRONTEND_SEEN.items() if v < cutoff]:
                _FRONTEND_SEEN.pop(stale, None)


def _frontend_recently_seen(session_id: str) -> bool:
    """该会话的页面最近是否活跃（≤ _PC_ALIVE_SEC 内有过前端触达）。"""
    sid = str(session_id or "").strip()
    if not sid:
        return False
    with _FRONTEND_SEEN_LOCK:
        ts = _FRONTEND_SEEN.get(sid)
    return bool(ts and (time.time() - ts) <= _PC_ALIVE_SEC)


def _migrate_notify_channels(out: dict, schedule_set: set | None = None) -> None:
    """旧单选 ``notify_channel`` → 双场景（pc/bg）的**只读**迁移。

    仅当新键**从未被显式设置**时才从旧键推导；用户显式设置过（哪怕设成
    off）一律尊重显式值，绝不覆盖。

    推导规则：
      旧 off / 缺失                    → pc=off, bg=off（与旧行为一致：不发）
      旧 browser                       → pc=browser, bg=off
        （后台没有浏览器通知的语义；旧配置选 browser 时页面一关通知本就
         失效，bg=off 是忠实迁移，不臆造渠道）
      旧 wechat / dingtalk / feishu    → pc=旧值, bg=旧值（两边都走该频道）
      仅有更老的 notify_manual_mode=true → 视同旧 browser（沿用原迁移链）

    ## schedule_set（2026-11-23 新增）
    由调用方传入「本次被时间策略显式设置的键集合」。

    为什么需要这个额外参数：`out` 在调用本函数时已经过 `schema_defaults()`，
    所以每个键**总是存在**（默认值 "off"）。因此「键在不在 out 里」根本
    无法区分「默认值」与「策略设过的值」—— 端到端实测正是踩在这里：
    策略设 pc=browser，迁移认为"用户没设过"，用旧键 off 盖掉，读回 off。

    判据必须是「有没有被某层**显式**设置」，而策略层的显式性只有调用方
    知道（它刚做过覆盖），所以在那里算好传进来，而不是在这函数里猜。
    """
    try:
        raw = _load_prefs()
        if not isinstance(raw, dict):
            raw = {}
    except Exception:  # noqa: BLE001 — 迁移失败回落默认，绝不阻断读配置
        raw = {}
    legacy = str(raw.get("notify_channel") or "").strip()
    if not legacy and raw.get("notify_manual_mode"):
        legacy = "browser"
    if not legacy:
        return
    from_sched = schedule_set or set()
    if "notify_channel_pc" not in raw and "notify_channel_pc" not in from_sched:
        out["notify_channel_pc"] = (
            legacy if legacy in ("browser", "wechat", "dingtalk", "feishu")
            else "off"
        )
    if "notify_channel_bg" not in raw and "notify_channel_bg" not in from_sched:
        out["notify_channel_bg"] = (
            legacy if legacy in ("wechat", "dingtalk", "feishu") else "off"
        )


# 频道显示名（面板与日志共用；缺省回落 channel key）
# 2026-11-14 用户裁定：删除 Slack / Discord 两个选项
# （原话「其他的选项，例如：slack,discord这2个删掉」）。
# 保留微信 + 钉钉 + 飞书三种远程频道。
_NOTIFY_CHANNEL_LABELS = {
    "browser": "浏览器通知",
    "wechat": "微信",
    "dingtalk": "钉钉",
    "feishu": "飞书",
    # 2026-11-23：用户自建 HTTP 端点。**不**在 _NOTIFY_REMOTE_CHANNELS 里——
    # 那条集合是「走宿主 /api/messages/send 的 IM 渠道」，自定义 API 是插件
    # 自己发 HTTP，判定与投递路径完全不同，混在一起会让 _host_channel_info
    # 去宿主配置里找一个永远不存在的频道。
    "custom_api": "自定义 API",
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
        # 机判字段：前端/脚本据此分流处置，不必解析中文文案。
        # 取值：missing_agent_id / channel_disabled / missing_credentials /
        #       no_sessions / read_failed / 空（可用或无特殊原因）
        "reason_code": "",
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

    if channel == "custom_api":
        # ── 自定义 API（2026-11-23）──
        # 就绪条件 = 已启用 + URL 合法（含 SSRF 校验）+ 必传参数齐全。
        # 与 _custom_api_required_missing / _custom_api_url_error 同源判定，
        # 保证「面板说可用」与「后端真能发」不会各说各话。
        if not bool(cfg.get("custom_api_enabled")):
            state["reason_code"] = "channel_disabled"
            state["reason"] = "自定义 API 渠道未启用"
            return state
        # 地址合法性：带 {{...}} 占位符的模板跳过这里（域名里不可能有花括号），
        # 由 builder 在插值后再校验；不带占位符的照常校验。
        # 跳过不等于放行——真发送时 builder 一定会验一次，这里只避免
        # 「面板只因用了占位符就显示地址非法」这种假告警。
        _raw_u = str(cfg.get("custom_api_url") or "")
        if "{{" not in _raw_u:
            url_err = _custom_api_url_error(_raw_u)
            if url_err:
                state["reason_code"] = "invalid_url"
                state["reason"] = url_err
                return state
        missing = _custom_api_required_missing(cfg)
        if missing:
            state["reason_code"] = "missing_required_params"
            state["reason"] = "缺少必传参数：" + "、".join(missing)
            state["missing"] = missing
            return state
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
        state["reason_code"] = "read_failed"
        state["reason"] = "无法读取宿主频道配置：" + type(exc).__name__
        return state

    # ★★ 先判定「读到的是不是该读的那份配置」（2026-11-17，boss 要求明确报错）。
    #
    #   若调用方没给 agent_id，_agent_config_source 会退化成全局模板
    #   <WORKING_DIR>/config.json。那份文件里 channels 全部 enabled=false、
    #   无凭据 —— 于是下面会报「宿主未启用该频道」，把用户引去翻宿主设置，
    #   而真实原因是**请求缺 agent_id**。两种情况的修法完全不同，必须先分开。
    #
    #   这里刻意**不自动兜底某个 agent**（比如猜 "default"）：多 agent 机器上
    #   猜错会把 A 的频道状态显示成 B 的，比报错更糟。让调用方把 agent_id 传对。
    if info.get("config_source") == "fallback_global":
        state["reason_code"] = "missing_agent_id"
        state["reason"] = (
            "无法确定当前 agent：本次请求未携带 agent_id，插件只能读取全局配置"
            "模板（%(path)s），该模板不含任何已启用的频道，因此无法判断该频道"
            "是否可用。请在请求中携带 agent_id（查询参数 agent_id=… 或请求头 "
            "X-Agent-Id: …）后重试。"
            % {"path": info.get("config_path") or "<WORKING_DIR>/config.json"}
        )
        return state

    if info.get("config_source") == "agent_not_found":
        state["reason_code"] = "agent_not_found"
        state["reason"] = (
            "找不到该 agent 的配置文件：%(path)s 不存在。"
            "请确认 agent_id=%(aid)r 是否正确（可查看 %(root)s/workspaces/ 下"
            "有哪些 agent 目录）。"
            % {"path": info.get("config_path"),
               "aid": agent_id,
               "root": str(_WORKING_DIR)}
        )
        return state

    if not info.get("configured"):
        if not info.get("enabled"):
            # 到了这里说明读的是**该 agent 自己的** agent.json，
            # 那 enabled=false 就是用户真的没启用 —— 这条文案可信。
            state["reason_code"] = "channel_disabled"
            state["reason"] = "宿主未启用该频道（已读取 %s）" % (
                info.get("config_path") or "agent.json")
        else:
            miss = info.get("missing") or []
            state["reason_code"] = "missing_credentials"
            state["reason"] = ("缺少凭据：" + "、".join(miss)) if miss else "缺少凭据"
        return state
    if not info.get("sessions"):
        # q2 裁定：三者都要满足，缺会话即不可用（不知道发给谁）
        state["reason_code"] = "no_sessions"
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
    info = {"configured": False, "sessions": 0, "target_user": "", "enabled": False,
            "config_source": "", "config_path": ""}
    try:
        src = _agent_config_source(agent_id)
        # ★ 把「配置是从哪读来的」一并带出去（2026-11-17）。
        #   没有这个字段，调用方只能看到 enabled=False，无法区分
        #   「用户真的没启用」与「读错了文件」——这两种情况的修法完全不同：
        #   前者让用户去宿主设置里开，后者让调用方补 agent_id。
        info["config_source"] = src["source"]
        info["config_path"] = str(src["path"])
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


def _agent_config_source(agent_id: str = "") -> dict:
    """定位 agent.json 并**说明这份配置是怎么来的**。

    返回 ``{path: Path, source: str, agent_id: str}``，``source`` 取值：

    | source | 含义 | 频道配置可信度 |
    |:--|:--|:--|
    | ``explicit_env`` | 环境变量显式指定 | 可信 |
    | ``agent`` | 按 agent_id 命中 ``workspaces/<id>/agent.json`` | **可信** |
    | ``fallback_global`` | 没拿到 agent_id，退化成 ``<WORKING_DIR>/config.json`` | **不可信** |

    ★★ 为什么需要这个函数（2026-11-17 实测事故，boss 报"用明确的报错来显示"）：

      我调用 ``POST /notify/test`` 时**没带 agent_id**，插件退化成读
      ``<WORKING_DIR>/config.json``。那个文件**确实存在**，但它是**全局配置
      模板**：``channels.dingtalk.enabled = false``、无任何凭据。于是插件
      报「宿主未启用该频道」—— 而真相是宿主**启用得好好的**（
      ``workspaces/default/agent.json`` 里 ``enabled=true`` 且
      client_id/client_secret 齐备）。

      这条错误文案把用户引向完全错误的方向：用户会去宿主设置里翻钉钉配置，
      而问题其实出在**调用方没带 agent_id**。实测我第一次就被带偏了，差点
      判定"用户的钉钉配置有问题"。

      修法不是换一句更长的文案，而是**先判定读到的是不是该读的那份文件**，
      再根据判定结果给出各自明确的错误。
    """
    explicit = os.environ.get("QWENPAW_QUESTION_MODAL_AGENT_CONFIG", "").strip()
    if explicit:
        return {"path": Path(explicit), "source": "explicit_env", "agent_id": agent_id}
    if agent_id:
        cand = _WORKING_DIR / "workspaces" / agent_id / "agent.json"
        if cand.is_file():
            return {"path": cand, "source": "agent", "agent_id": agent_id}
        # ★ 传了 agent_id 但找不到该 agent 的配置 —— 必须与"没传"区分开
        #   （2026-11-17 自查发现：首版把两者都归成 fallback_global，于是
        #   传了个不存在的 agent_id 时，报错却说"未携带 agent_id"，同样误导）。
        return {"path": cand, "source": "agent_not_found", "agent_id": agent_id}
    return {"path": _WORKING_DIR / "config.json", "source": "fallback_global",
            "agent_id": agent_id}


def _agent_config_path(agent_id: str = "") -> Path:
    """定位某个 agent 的 agent.json。

    2026-11-14 修正（决定性）：**必须由调用方传入 agent_id**。此前靠
    「config.json 里只有一个 agent 就猜它」——多 agent 机器上猜测直接返回
    空串，于是路径退化成 ``<WORKING_DIR>/config.json`` → 读不到**该 agent 的**
    频道配置 → 微信被判「未启用或缺凭据」，而实际上它是可用的。
    实测症状：隔离探针 ready=True，线上端点 ready=False。

    2026-11-17 补注：本机 ``<WORKING_DIR>/config.json`` **是存在的**（全局
    模板，含 channels 但全部 enabled=false、无凭据），所以"退化"不会报文件
    不存在，而是**静默读到一份不含该 agent 频道配置的文件** —— 比文件缺失
    更隐蔽。判定细节见 :func:`_agent_config_source`。

    回退顺序：显式环境变量 → 传入的 agent_id → 请求头推导（见调用点）。
    """
    return _agent_config_source(agent_id)["path"]


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
    return _send_host_request(req, timeout)


def _post_host_api_query(
    path: str, params: dict, agent_id: str = "", timeout: float = 20.0,
) -> tuple[int, Any]:
    """POST 到宿主 API，参数走 **query string** 而非 JSON body。

    为什么需要这一支：宿主有些端点只声明 query 参数（如
    `POST /console/chat/stop?chat_id=...&cancel_reason=...`），给它发 JSON
    body 会因缺必填 query 而 422。复用 `_post_host_api_query` 的其余约定
    （回环地址、X-Agent-Id、只用标准库、返回 ``(status, body)``）。

    body 显式给空字节：`urllib` 在 data 为 None 时会把方法降级成 GET。
    """
    import urllib.parse
    import urllib.request

    aid = agent_id or _current_agent_id()
    if not aid:
        return 0, "无法确定 agent_id（多 agent 环境下必须显式传入）"
    qs = urllib.parse.urlencode({k: v for k, v in params.items() if v != ""})
    url = _host_api_base() + path + (("?" + qs) if qs else "")
    req = urllib.request.Request(
        url, data=b"", method="POST",
        headers={"Content-Type": "application/json", "X-Agent-Id": aid},
    )
    return _send_host_request(req, timeout)


def _send_host_request(req: Any, timeout: float) -> tuple[int, Any]:
    """执行一次宿主请求，统一异常翻译成 ``(status, body)``（不抛）。"""
    import urllib.error
    import urllib.request

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
        # reason_code 一并回传：调用方（脚本/前端）据此分流处置，
        # 不必解析中文文案。2026-11-17 加，配合「缺 agent_id」的明确报错。
        return {"ok": False, "channel": channel, "delivered": False,
                "reason_code": state.get("reason_code") or "",
                "error": state["reason"] or "频道不可用"}

    # ── 自定义 API：测试走真实 HTTP（2026-11-23）──
    # 与线上投递共用 _send_via_custom_api，区别只在文案与 title/count 取值：
    # 测试时没有真实问卷，title 用「测试」、count 用 0，让用户能立刻看到
    # 对方 API 收到什么形态。
    if channel == "custom_api":
        _cfg = dict(cfg)
        _cfg["__notify_title__"] = "自定义 API 测试"
        _cfg["__notify_count__"] = "0"
        msg = text or (
            f"【QwenPaw 通知测试】{_NOTIFY_CHANNEL_LABELS.get(channel, channel)}"
            "频道连通性验证，收到即表示配置正确。"
        )
        result = await _send_via_custom_api(msg, _cfg, agent_id)
        if result.get("delivered"):
            _mark_notify_verified("custom_api", True)
        return {"ok": bool(result.get("ok")), "channel": channel, **result}

    info = _host_channel_info(channel, agent_id)
    msg = text or f"【QwenPaw 通知测试】{_NOTIFY_CHANNEL_LABELS.get(channel, channel)}频道连通性验证，收到即表示配置正确。"
    result = await _send_via_channel(channel, msg, info, agent_id)
    if result.get("delivered"):
        _mark_notify_verified(channel, True)
    return {"ok": bool(result.get("ok")), "channel": channel, **result}


# 每个频道保留最近 N 次测试记录（磁盘）。上限存在的理由：无上限会让
# notify_test_log.json 无限增长，且用户实际只会看最近几条。
_TEST_LOG_MAX = 20
_TEST_LOG_FILE = _store.MigrationPath("notify_test_log.json")


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


# ══════════════════════════════════════════════════════════════════════
# 自定义 API 渠道（2026-11-23）
# ══════════════════════════════════════════════════════════════════════
#
# 缺陷背景（boss 原话）：「当前的实现方式不满足……用户不知道哪些是属于必传
# 项，是否符合大部分的 API 请求以及参数要求」。原实现是纯 UI 占位卡。
#
# 定位（boss 明确收窄）：**简单消息推送**，只发标题 + 脱敏摘要。
# 不做嵌套对象自动构造、数组参数、条件映射、重试队列、多套渠道并存。
# 复杂需求走「高级模式」由用户自己写整段 body 模板。

# 内置占位符（boss 裁定：4 个系统占位符 + token）。
# 语法刻意用 `{{name}}` 单层花括号对，不做嵌套表达式——插值就是纯字符串替换，
# 用户写什么就是什么，不引入模板引擎（避免"看起来能写表达式"的假能力）。
_CUSTOM_API_PLACEHOLDERS = ("title", "content", "count", "stamp", "token")

# 内网/回环地址判定用的保留网段（SSRF 防护，2026-11-23 boss 裁定要做）。
# 只按解析后的 IP 判定——域名可以通过 DNS 指向内网，只查字符串必然漏。
_CUSTOM_API_BLOCKED_V4 = (
    "0.0.0.0/8",        # "本网络"
    "10.0.0.0/8",       # 私有
    "100.64.0.0/10",    # 运营商级 NAT
    "127.0.0.0/8",      # 回环
    "169.254.0.0/16",   # 链路本地（含云元数据 169.254.169.254）
    "172.16.0.0/12",    # 私有
    "192.168.0.0/16",   # 私有
)


def _custom_api_url_error(url: str) -> str:
    """校验自定义 API 请求地址。返回空串 = 合法，否则返回人不友好的原因。

    SSRF 防护（boss 2026-11-23 裁定「要：禁止内网/回环地址」）：
      1. scheme 只允许 http/https
      2. host 必须存在、不能是空串或纯端口
      3. **逐个解析 IP**（含所有 A/AAAA 记录）并落到保留网段即拒绝 ——
         只看 hostname 字符串会被「127.0.0.1.nip.io」这类解析型域名绕过
      4. 解析失败按「不可用」拒绝（宁可拦错，不可放行到未知目标）

    注意：本函数在**发送前与保存时各调一次**，两处判定必须同源，
    否则会出现「保存时拦住了但发送时没拦」的缺口。
    """
    import ipaddress
    import socket
    from urllib.parse import urlparse

    if not url or not url.strip():
        return "请求地址不能为空"
    try:
        parsed = urlparse(url.strip())
    except ValueError:
        return "请求地址格式无法解析"
    if parsed.scheme not in ("http", "https"):
        return "请求地址必须以 http:// 或 https:// 开头"
    host = parsed.hostname or ""
    if not host:
        return "请求地址缺少主机名"

    # 先排除字面量回环/私有 IP（无需 DNS）
    try:
        direct = ipaddress.ip_address(host)
        if direct.is_private or direct.is_loopback or direct.is_link_local \
                or direct.is_multicast or direct.is_unspecified:
            return "不允许请求内网/回环地址"
        if direct.version == 4 and host.startswith("0."):
            return "不允许请求内网/回环地址"
        return ""
    except ValueError:
        pass  # 不是字面 IP，按域名继续解析

    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return "域名无法解析：" + host
    except Exception:  # noqa: BLE001
        return "域名解析失败：" + host
    blocked = [ipaddress.ip_network(n) for n in _CUSTOM_API_BLOCKED_V4]
    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            return "域名解析结果异常：" + host
        if ip.version == 6:
            if ip.is_private or ip.is_loopback or ip.is_link_local \
                    or ip.is_unspecified or ip.is_multicast:
                return "不允许请求内网/回环地址"
            continue
        for net in blocked:
            if ip in net:
                return "不允许请求内网/回环地址"
    return ""


def _custom_api_required_missing(cfg: dict) -> list:
    """列出还缺的必传项（供 UI 置灰「发送测试」与投递前闸门共用）。

    两处调用同一函数，避免「界面说可以发、后端却拒绝」的口径分叉。
    URL 永远是必传；参数行里 `required=true` 且值为空的行也算缺。
    """
    missing: list = []
    if not str(cfg.get("custom_api_url") or "").strip():
        missing.append("请求地址")
    params = cfg.get("custom_api_params")
    if isinstance(params, list):
        for row in params:
            if not isinstance(row, dict):
                continue
            if row.get("required") and not str(row.get("value") or "").strip():
                missing.append(str(row.get("key") or "未命名参数"))
    return missing


def _custom_api_fill(text: str, values: dict) -> str:
    """把 `{{name}}` 占位符替换成对应值。未识别的占位符原样保留。

    为什么保留未识别的：用户可能就是要发给对方 API 一个字面量 `{{x}}`
    （例如对方自己也会做模板替换）。静默删掉比留着更糟——留着他能一眼
    看出「这里没替换成功」。
    """
    out = str(text or "")
    for name in _CUSTOM_API_PLACEHOLDERS:
        out = out.replace("{{" + name + "}}", str(values.get(name) or ""))
    return out


def _custom_api_build_request(cfg: dict, values: dict) -> tuple[str, dict, bytes | None, str]:
    """按配置拼出最终请求。返回 ``(url, headers, body_bytes, error)``。

    两种模式（boss 裁定 C：基础 + 高级都要）：
      basic     参数行扁平平铺成 JSON：{"key": "插值后的值", ...}
      advanced  用户写的整段 body 模板 → 只做占位符插值 → 原样发送

    两种模式都叠加「系统字段」：title / content 始终写入，即便用户没在
    参数行里列——它们是这条通知的语义本体，缺了对方 API 也读不懂。
    用户显式写了同名参数行时以用户的为准（允许覆盖，不静默改写）。
    """
    from urllib.parse import quote, urlencode, urlparse, urlunparse, parse_qsl

    # ── URL 占位符插值（2026-11-23 boss 需求 2）──────────────────
    #
    # 需求原文（2026-11-23）：「对于 get 接口，api 地址可以使用类似
    # https://api.example.com/push/{{title}}/{{content}}，这种自动插值的
    # 方式，而对于 post，除了地址外，data 参数也可以这种方式插值」。
    # （示例 URL 已脱敏：真实测试端点不写入仓库/发布包）
    #
    # 所以**两种方法都先对 URL 做插值**，不只是 GET。典型用途是 Bark/Server酱
    # 这类「消息内容直接拼在路径里」的服务。
    #
    # 🔴 关键：插值进 URL **路径**时必须 percent-encode，不能直接字符串塞入：
    #   问卷标题/正文常含空格、斜杠、中文、`?`、`#`，直接拼会破坏 URL 结构
    #   （`#` 之后整段变成 fragment，对方收不到；空格会让请求行非法）。
    #   但整条 URL 不能整体 encode（会把 `://` 也编码掉），所以只对**替换值**
    #   编码，模板骨架保持原样。这是本函数最容易写错的一点。
    #
    # 先做占位符替换，再做 URL 合法性校验——否则含未填占位符的地址会被
    # 误判为非法。
    raw_url = str(cfg.get("custom_api_url") or "").strip()
    encoded_values = {
        k: quote(str(v or ""), safe="") for k, v in values.items()
    }
    url = _custom_api_fill(raw_url, encoded_values)

    error = _custom_api_url_error(url)
    if error:
        return "", {}, None, error

    method = str(cfg.get("custom_api_method") or "post_json")
    mode = str(cfg.get("custom_api_mode") or "basic")
    headers: dict = {"User-Agent": "question-modal/notify"}

    # ── body ──
    payload: dict = {}
    # 系统字段先落，保证一定存在
    payload["title"] = values.get("title") or ""
    payload["content"] = values.get("content") or ""

    if mode == "advanced":
        raw = _custom_api_fill(str(cfg.get("custom_api_body") or ""), values)
        if not raw.strip():
            return "", {}, None, "高级模式未填写 body 模板"
        body_bytes = raw.encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    else:
        params = cfg.get("custom_api_params")
        if isinstance(params, list):
            for row in params:
                if not isinstance(row, dict):
                    continue
                key = str(row.get("key") or "").strip()
                if not key:
                    continue          # 空参数名：不校验、不发送（用户可能正删到一半）
                payload[key] = _custom_api_fill(row.get("value") or "", values)
        body_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    # ── token ──
    token = str(values.get("token") or "")
    token_pos = str(cfg.get("custom_api_token_pos") or "none")
    if token:
        if token_pos == "bearer":
            headers["Authorization"] = "Bearer " + token
        elif token_pos == "query":
            parsed = urlparse(url)
            q = parse_qsl(parsed.query, keep_blank_values=True)
            q.append(("token", token))
            url = urlunparse(parsed._replace(query=urlencode(q)))

    # ── GET：参数全部进 query，不带 body ──
    if method == "get_query":
        merged: list = []
        if mode == "basic":
            merged = [(k, str(v)) for k, v in payload.items()]
        else:
            # 高级模式配 GET 没有 body 可发，参数行仍按基础口径带上
            params = cfg.get("custom_api_params") or []
            for row in params:
                if isinstance(row, dict) and str(row.get("key") or "").strip():
                    merged.append((
                        str(row["key"]), _custom_api_fill(row.get("value") or "", values),
                    ))
        if merged:
            parsed = urlparse(url)
            q = parse_qsl(parsed.query, keep_blank_values=True)
            q.extend(merged)
            url = urlunparse(parsed._replace(query=urlencode(q)))
        return url, headers, None, ""

    return url, headers, body_bytes, ""


async def _send_via_custom_api(
    text: str, cfg: dict, agent_id: str = "", *,
    values_override: dict | None = None,
) -> dict:
    """向用户自定义的 API 地址投递一条简单消息。

    策略（boss 2026-11-23 裁定）：**超时 10s、失败不重试、仅记日志**。
    通知类消息过期即失去意义，堆积重试只会让用户收到一堆迟到提醒。
    """
    import urllib.error
    import urllib.request

    url_err = _custom_api_url_error(str(cfg.get("custom_api_url") or ""))
    if url_err:
        # 含 {{...}} 占位符的地址在这里会被判非法（域名里不可能有花括号）。
        # 这是**预期行为**而非缺陷：占位符只在真正发送时才有值可填，
        # 此处的校验只负责「未插值形态下能不能连通」这一层；带占位符的地址
        # 改由 :func:`_custom_api_build_request` 在插值后再校验一次。
        # 若整条地址就是带占位符的模板，跳过这里的预检，交给 builder。
        if "{{" not in str(cfg.get("custom_api_url") or ""):
            return {"ok": False, "delivered": False, "channel": "custom_api",
                    "reason": url_err, "reason_code": "invalid_url"}

    missing = _custom_api_required_missing(cfg)
    if missing:
        return {"ok": False, "delivered": False, "channel": "custom_api",
                "reason": "缺少必传参数：" + "、".join(missing),
                "reason_code": "missing_required_params", "missing": missing}

    if not bool(cfg.get("custom_api_enabled")):
        return {"ok": False, "delivered": False, "channel": "custom_api",
                "reason": "自定义 API 渠道未启用", "reason_code": "disabled"}

    # 占位符取值：text 是已拼好的提醒正文（标题 + 摘要 + 时间戳）
    values = {
        "title": str((cfg.get("__notify_title__") or "")),
        "content": text,
        "count": str(cfg.get("__notify_count__") or ""),
        "stamp": _notify_stamp(agent_id),
        "token": _custom_api_token_value(),
    }
    if values_override:
        values.update(values_override)
    # title 缺省时从 text 首行推断，避免 body.title 为空
    if not values["title"]:
        values["title"] = str(text).split("\n", 1)[0]

    url, headers, body_bytes, build_err = _custom_api_build_request(cfg, values)
    if build_err:
        return {"ok": False, "delivered": False, "channel": "custom_api",
                "reason": build_err, "reason_code": "build_failed"}

    method = "GET" if str(cfg.get("custom_api_method")) == "get_query" else "POST"
    started = time.time()

    def _do() -> tuple[int, str]:
        req = urllib.request.Request(url, data=body_bytes, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                return int(resp.status), resp.read(2000).decode("utf-8", "replace")
        except urllib.error.HTTPError as exc:
            try:
                detail = exc.read(2000).decode("utf-8", "replace")
            except Exception:  # noqa: BLE001
                detail = ""
            return int(exc.code), detail
        except urllib.error.URLError as exc:
            return 0, "连接失败：" + str(getattr(exc, "reason", exc))
        except Exception as exc:  # noqa: BLE001
            return 0, type(exc).__name__ + "：" + str(exc)

    try:
        status, detail = await asyncio.to_thread(_do)
    except Exception as exc:  # noqa: BLE001
        status, detail = 0, type(exc).__name__ + "：" + str(exc)
    elapsed_ms = int((time.time() - started) * 1000)

    if 200 <= status < 300:
        return {"ok": True, "delivered": True, "channel": "custom_api",
                "http": status, "elapsed_ms": elapsed_ms, "body": detail[:300],
                "url": url}
    if status == 0:
        reason = "请求超时（10 秒）" if "timeout" in detail.lower() else detail
    else:
        reason = "对方返回 HTTP %d：%s" % (status, detail[:200])
    logger.warning(
        "question_modal: custom api notify failed status=%s url=%s detail=%s",
        status, url, str(detail)[:200],
    )
    return {"ok": False, "delivered": False, "channel": "custom_api",
            "http": status, "elapsed_ms": elapsed_ms,
            "reason": reason, "reason_code": "http_failed", "url": url}


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
    session_id: str = "",
) -> dict:
    """提醒用户「有一份问卷在等你作答」（双场景，2026-11-19）。

    由**后端**调用（q1 裁定的关键：关掉浏览器时只能走频道通知，前端
    effect 关页即失效）。频道必须已过测试闸门（q4）。

    ## 双场景渠道选择（2026-11-19 boss 需求：通知不再固定单选）

    按**页面心跳**判定场景，再取对应场景的配置频道：
      PC 端打开（_PC_ALIVE_SEC 内前端轮询过）→ notify_channel_pc
      后台运行（页面关闭/长时间切后台）      → notify_channel_bg

    文案（q0 裁定）：与浏览器通知同口径 —— 「问卷名」有 N 道题等你作答。
    注意：只发标题与题数，**不发题目正文**（2026-11-13 安全红线）。
    """
    cfg = resolve_effective("")
    scene = "pc" if _frontend_recently_seen(session_id) else "bg"
    scene_label = "PC 端打开" if scene == "pc" else "后台运行"
    channel = str(
        cfg.get("notify_channel_pc" if scene == "pc" else "notify_channel_bg")
        or "off",
    )

    if channel == "off":
        return {"ok": True, "delivered": False, "channel": "off",
                "scene": scene,
                "reason": "通知频道已关闭（%s）" % scene_label}

    state = _notify_channel_state(channel, cfg, agent_id)
    if not state["ready"]:
        return {"ok": False, "delivered": False, "channel": channel,
                "scene": scene,
                "reason_code": state.get("reason_code") or "",
                "reason": state["reason"] or "频道不可用"}
    if not state["verified"]:
        # q4：未通过测试的频道一律不许真正投递。
        return {"ok": False, "delivered": False, "channel": channel,
                "scene": scene,
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
        # （只有 pc 场景可能选到 browser：bg 枚举本就不含 browser。）
        return {"ok": True, "delivered": False, "channel": "browser",
                "scene": scene, "delegated": True, "text": body}

    if channel == "custom_api":
        # ── 自定义 API（2026-11-23）──
        # 不走宿主 /api/messages/send，插件自己发 HTTP。
        # title/count 通过 __notify_* 临时键带进 builder：那里要拼 body 的
        # title 字段与 {{count}} 占位符，但 cfg 本身不含这两个运行时值。
        _cfg = dict(cfg)
        _cfg["__notify_title__"] = str(title)
        _cfg["__notify_count__"] = str(count)
        out = await _send_via_custom_api(body, _cfg, agent_id)
        if isinstance(out, dict):
            out.setdefault("scene", scene)
        return out

    info = _host_channel_info(channel, agent_id)
    out = await _send_via_channel(channel, body, info, agent_id)
    # 场景标记随结果返回：调用方/日志可查证「这次为什么走这个渠道」。
    if isinstance(out, dict):
        out.setdefault("scene", scene)
    return out


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
_SESSION_PREFS_FILE = _store.MigrationPath("session_prefs.json")


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
    for key, value in sanitize_settings(settings)[0].items():
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
# ══════════════════════════════════════════════════════════════════════
# 策略库（US-024，2026-11-23 架构重构）
# ══════════════════════════════════════════════════════════════════════
#
# ## 这次重构推翻了什么
#
# 旧架构是「两层作用域」：
#
#     生效值 = 内建默认 ⊕ 全局(analysis_prefs.json) ⊕ 会话覆盖(session_prefs.json)
#
# 界面上对应「默认模式」页签和「会话模式」页签——同一批设置画两遍。
#
# boss 2026-11-23 裁定改为「统一配置 + 时间策略」：
#
#     生效值 = 基础配置(prefs) ⊕ 命中的时间策略所引用的参数组
#
# - **没有会话级覆盖**：所有会话共用一份配置（`/session-prefs` 三个接口下线）
# - **时间策略**：按时间段匹配，命中则用其引用的参数组 + 通知配置覆盖基础配置
# - **参数组 / 通知配置**：独立命名库，被策略「引用」而不是复制
#
# ## 为什么用独立 json 文件而不是塞进 prefs
#
# 仿 `templates.json` 先例：库级数据（可增删的命名条目）与单值配置是两种
# 不同性质的数据。prefs 的 `sanitize_settings` 是「键→值」白名单，塞数组进去
# 要开 json 类型特例；而库需要自己的 schema 版本与条目级校验。分开存更清晰，
# 也避免 prefs 备份/会话覆盖那套机制误伤库数据。
#
# 三个库：
#   parameter_sets.json    问卷参数组（模式/模型/提示词/上下文/并行）
#   notify_profiles.json   命名通知配置（pc + bg 两个渠道）
#   schedules.json         时间策略（时段 + 引用参数组 + 引用通知配置）

_PARAM_SETS_FILE = _store.MigrationPath("parameter_sets.json")
_NOTIFY_PROFILES_FILE = _store.MigrationPath("notify_profiles.json")
_SCHEDULES_FILE = _store.MigrationPath("schedules.json")

# 参数组允许承载的字段（白名单）。刻意**不含**任何库级/全局类配置：
# 参数组是「一套答题参数」，不是「另一份完整设置的副本」，否则策略就变成
# 第二份全局配置，又回到重复配置的老问题。
_PARAM_SET_KEYS = ("mode", "model_id", "template_id", "with_context", "parallel")


def _read_lib(path) -> list[dict]:
    """读一个库文件，返回条目列表。文件损坏按空库处理并留 WARNING。

    不抛异常：库文件坏掉不该让整个设置面板打不开（与 templates.json 同口径）。
    但必须留日志——静默读成空库会让用户以为「我的配置全没了」却查不到原因。
    """
    try:
        if path.is_file():
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return [x for x in data["items"] if isinstance(x, dict)]
            logger.warning("question_modal: lib %s has unexpected shape", path.name)
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not read lib %s", path.name, exc_info=True)
    return []


def _write_lib(path, items: list[dict]) -> None:
    """原子写库文件（tmp + replace），避免半截文件。"""
    payload = {"schema_version": 1, "updated_at": time.time(), "items": items}
    try:
        tmp = path.parent / f"{path.name}.{os.getpid()}.{time.time_ns()}.tmp"
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(path)
    except Exception:  # noqa: BLE001
        logger.warning("question_modal: could not persist lib %s", path.name, exc_info=True)


def _new_lib_id(prefix: str) -> str:
    """库条目 id：前缀 + 短随机串。前缀让日志/引用一眼能看出是哪类库。"""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ── 问卷参数组 ───────────────────────────────────────────────────────

def _sanitize_param_set(raw: dict, *, keep_id: bool = True) -> dict:
    """校验一个参数组条目。非法字段丢弃、越界值拒绝（不静默改写）。

    与 `sanitize_settings` 的关键差别：这里是**条目级**校验，返回的 dict 直接
    作为策略引用的实体；而 sanitize_settings 是「键→值」白名单，两者职责不同，
    所以不复用（复用会让参数组的字段集合被全局 schema 绑死）。
    """
    out: dict = {}
    # keep_id=False 表示「这是一次新建」：忽略调用方传入的 id，**但仍然要生成
    # 一个**。早期版本把整段 if 跳过，导致新建条目没有 id —— 实测立刻暴露：
    # 这样的条目既不能被时间策略引用，也没法再被更新/删除（找不到主键）。
    pid = str(raw.get("id") or "").strip() if keep_id else ""
    out["id"] = pid if pid else _new_lib_id("ps")
    name = str(raw.get("name") or "").strip()
    out["name"] = name[:60] if name else "未命名参数组"
    params = raw.get("params")
    params = params if isinstance(params, dict) else {}
    cleaned: dict = {}
    for key in _PARAM_SET_KEYS:
        if key not in params:
            continue
        v = params[key]
        if key in ("with_context", "parallel"):
            cleaned[key] = bool(v)
        else:
            cleaned[key] = str(v or "")[:200]
    out["params"] = cleaned
    return out


def load_param_sets() -> list[dict]:
    items = [_sanitize_param_set(x) for x in _read_lib(_PARAM_SETS_FILE)]
    seen: set = set()
    out: list[dict] = []
    for it in items:
        if it["id"] in seen:
            continue          # 重复 id 只保留第一条，避免引用指向歧义
        seen.add(it["id"])
        out.append(it)
    return out


def save_param_sets(items: list[dict]) -> None:
    _write_lib(_PARAM_SETS_FILE, [_sanitize_param_set(x) for x in items])


# ── 命名通知配置 ─────────────────────────────────────────────────────

# 通知配置只承载「渠道选择」，不承载渠道凭据（Token/Webhook 仍归各渠道
# 自身的设置项）。这样一条通知配置可以安全地被多条策略引用，而改凭据
# 只需改一处。
_NOTIFY_PROFILE_KEYS = ("pc", "bg")


def _sanitize_notify_profile(raw: dict, *, keep_id: bool = True) -> dict:
    out: dict = {}
    # 同 _sanitize_param_set：新建时必须生成 id，否则条目无主键、不可引用。
    pid = str(raw.get("id") or "").strip() if keep_id else ""
    out["id"] = pid if pid else _new_lib_id("np")
    name = str(raw.get("name") or "").strip()
    out["name"] = name[:60] if name else "未命名通知配置"
    ch = raw.get("channels")
    ch = ch if isinstance(ch, dict) else {}
    channels: dict = {}
    for key in _NOTIFY_PROFILE_KEYS:
        v = str(ch.get(key) or "off").strip()
        allowed = SETTINGS_SCHEMA.get(
            "notify_channel_pc" if key == "pc" else "notify_channel_bg", {},
        ).get("values") or []
        channels[key] = v if v in allowed else "off"
    out["channels"] = channels
    return out


def load_notify_profiles() -> list[dict]:
    items = [_sanitize_notify_profile(x) for x in _read_lib(_NOTIFY_PROFILES_FILE)]
    seen: set = set()
    out: list[dict] = []
    for it in items:
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        out.append(it)
    return out


def save_notify_profiles(items: list[dict]) -> None:
    _write_lib(_NOTIFY_PROFILES_FILE, [_sanitize_notify_profile(x) for x in items])


# ── 时间策略 ─────────────────────────────────────────────────────────

# 2026-11-24 boss 需求 4：时间策略加秒 —— 秒为可选段（HH:mm[:ss]）。
# 旧 HH:mm 值完全兼容（秒按 0）；结束时间默认 23:59:59，消除 23:59:01~23:59:59
# 这一段的空缺。
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$")


def _valid_hhmm(v: str) -> bool:
    return bool(_TIME_RE.match(str(v or "").strip()))


def _sanitize_schedule(raw: dict, *, keep_id: bool = True) -> dict:
    """校验一条时间策略。

    字段：name / start / end / param_set_id / notify_profile_id
    时段语义：左闭右开 [start, end)；start > end 视为**跨零点**（如 22:00→08:00）。
    """
    out: dict = {}
    # 同 _sanitize_param_set：新建时必须生成 id，否则条目无主键、不可引用。
    sid = str(raw.get("id") or "").strip() if keep_id else ""
    out["id"] = sid if sid else _new_lib_id("sc")
    name = str(raw.get("name") or "").strip()
    out["name"] = name[:60] if name else "未命名策略"
    start = str(raw.get("start") or "").strip()
    end = str(raw.get("end") or "").strip()
    out["start"] = start if _valid_hhmm(start) else "00:00"
    out["end"] = end if _valid_hhmm(end) else "24:00" if end == "24:00" else (
        end if _valid_hhmm(end) else "23:59")
    out["param_set_id"] = str(raw.get("param_set_id") or "").strip()[:64]
    out["notify_profile_id"] = str(raw.get("notify_profile_id") or "").strip()[:64]
    return out


def load_schedules() -> list[dict]:
    items = [_sanitize_schedule(x) for x in _read_lib(_SCHEDULES_FILE)]
    seen: set = set()
    out: list[dict] = []
    for it in items:
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        out.append(it)
    return out


def save_schedules(items: list[dict]) -> None:
    _write_lib(_SCHEDULES_FILE, [_sanitize_schedule(x) for x in items])


def _seconds_of(hhmm: str) -> int:
    """'HH:MM[:SS]' → 当天秒数。'24:00' 特殊处理为 86400（表示到当天结束）。

    2026-11-24 粒度从分钟升级为秒（时间策略加秒，开始默认 :00、结束默认 :59）；
    旧 HH:mm 值秒按 0 计，匹配结果与原先一致。
    """
    s = str(hhmm or "").strip()
    if s == "24:00":
        return 86400
    m = _TIME_RE.match(s)
    if not m:
        return -1
    sec = int(m.group(3)) if m.group(3) else 0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + sec


def match_schedule(now_seconds: int | None = None) -> dict | None:
    """返回当前命中的时间策略（按列表顺序，命中第一条即返回）。

    匹配规则（与 UI 说明一致）：
      · 左闭右开 [start, end)，避免相邻时段在边界上双重命中
      · start < end  普通时段，如 08:00→18:00
      · start > end  跨零点，如 22:00→08:00 ⇒ [22:00,24:00) ∪ [00:00,08:00)
      · start == end 视为「全天」（用户把两端填成一样时的合理语义）

    都不命中返回 None，调用方据此回落到基础配置。

    2026-11-24：比较粒度从分钟改为秒（时间策略加秒，开始默认 :00、结束默认
    :59，23:59:59 完整覆盖到当天最后一秒）。旧 HH:mm 值秒按 0 处理，行为不变。
    """
    if now_seconds is None:
        lt = time.localtime()
        now_seconds = lt.tm_hour * 3600 + lt.tm_min * 60 + lt.tm_sec
    for sched in load_schedules():
        s = _seconds_of(sched.get("start"))
        e = _seconds_of(sched.get("end"))
        if s < 0 or e < 0:
            continue
        if s == e:
            return sched                      # 全天
        if s < e:
            if s <= now_seconds < e:
                return sched
        else:
            # 跨零点：先看今天尾部，再看今天开头
            if now_seconds >= s or now_seconds < e:
                return sched
    return None


_TEMPLATES_FILE = _store.MigrationPath("templates.json")


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


class ConfigBackupBody(BaseModel):
    """创建一个配置备份（label 仅作人读备注）。"""
    label: str = Field("", description="备份备注")


class ConfigRestoreBody(BaseModel):
    """按备份文件名恢复；导入走 config/import 端点。"""
    name: str = Field("", description="backups/ 目录下的备份文件名")


class ConfigImportBody(BaseModel):
    """从本地文件导入的完整配置对象（qm-config-backup 格式）。"""
    payload: dict = Field(default_factory=dict, description="导出的配置对象")


class TemplateBody(BaseModel):
    """A prompt template (create/update).  ``id`` empty → the server assigns one."""
    id: str = Field("", description="Template id (empty = create new)")
    name: str = Field("", description="Display name")
    system: str = Field("", description="System prompt (must keep the JSON contract)")
    user: str = Field("", description="Per-question user-prompt assembly template")


class SurveyModelOverrideBody(BaseModel):
    """卡片模型胶囊临时覆盖（US-003）。

    ``tool_call_id`` 定位当前卡片问卷；``model_id`` 为空串表示清除覆盖，
    回落到该问卷 prefs.model_id 运行参数快照。仅写当前问卷 state，不碰
    analysis_prefs.json / 运行参数 / 其它问卷。
    """
    tool_call_id: str = Field("", description="卡片唯一标识（定位 SurveyState）")
    model_id: str = Field("", description="'<provider>:<model>'；空串=清除覆盖")


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

    ⚠️ 它们**不是**真实设置项，只作为 pydantic 的字段容器存在 ——
    真正写入时要经 ``_prefs_payload()`` 剔除"调用方没传的"和"显式 None"的键。
    详见该函数的注释（2026-11-17 回归事故）。
    """
    model_config = ConfigDict(extra="allow")

    mode: Optional[str] = Field(None, description="'ai' | 'recommend' | 'manual'")
    model_id: Optional[str] = Field(None, description="'<provider>:<model>'")
    with_context: Optional[bool] = Field(None)
    parallel: Optional[bool] = Field(None)


def _prefs_payload(body: "PrefsRequest") -> dict:
    """把请求体变成「只有调用方真正想设置的那些键」。

    ★ 2026-11-17 回归事故（我自己引入又修掉的，记录在此防复发）：

      `PrefsRequest` 把 mode / model_id / with_context / parallel 声明成
      ``Optional[...] = None`` 作为字段容器。``model_dump()`` 会**把没传的
      字段也输出成 None**。在 sanitize_settings 改成返回 rejected 之前，
      这些 None 被旧代码静默丢弃，所以看不出问题；一旦开始如实回报被拒项，
      它们立刻变成 4 条噪音：

          POST {"release_after_sec": 7200}
          → rejected 里多出 mode/model_id/with_context/parallel（值 None）

      真实后果比噪音严重得多：前端 `pushRemotePrefs()` 每次都发全 4 个键
      （其中未改的是 undefined → JSON 里直接没有该键，但一旦某个调用方
      传了 null 就会变成"显式非法值"），界面就会弹出「部分设置未生效」，
      而用户其实什么都没改错。

    ★ 两条剔除规则，缺一不可：
      1. ``exclude_unset`` —— 调用方**根本没传**的键不该出现（否则等于
         凭空给它塞了个值）。
      2. 「值为 None」也剔除 —— 显式传 null 在 merge 语义下应当等同
         「没设置这一项」。prefs 没有「清空某键」的协议（那是 session-prefs
         的 explicit_del 干的事），把一个 null 当"值"去校验只会误报。

      注：空串**不**剔除 —— 空串在 resolve_effective 那边本来就等价于
      「没有偏好」（会回落全局/默认），由它自己处理，这里不越界。
    """
    raw = body.model_dump(exclude_unset=True)
    return {k: v for k, v in raw.items() if v is not None}


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
    session_id: str = Field("", description="会话 ID（双场景心跳判定依据，2026-11-19）")


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
        # 前端页面心跳（2026-11-19）：问卷面板以秒级轮询本接口，入口处
        # 记录触达时间，供通知发送时判定「PC 端打开 vs 后台运行」。
        _mark_frontend_seen(session_id)
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

    @router.post("/survey-model-override")
    async def post_survey_model_override(body: SurveyModelOverrideBody):
        """Set the card's temporary model override for one running survey (US-003).

        卡片切模型胶囊后前端回写到这里：仅覆盖**当前卡片本次**的自动分析
        （mode=ai 服务端推进），优先于问卷创建时的运行参数快照
        （`SurveyState.prefs.model_id`）。只写目标问卷 state，不碰
        analysis_prefs.json / 运行参数 / 其它问卷。

        语义（契约 v1.1）：
          · ``model_id`` 空串 = 清除覆盖，回落 prefs.model_id 快照。
          · 仅对**未分析的题**生效；对已在飞的那次分析调用不生效（其 model_id
            已在调用启动时确定），也不重跑任何已分析题。
          · 终态（submitted）问卷：定位成功、写入覆盖，但返回
            ``accepted=false + reason='already_submitted'``（无未分析题，覆盖
            无实际效果；与 /survey-action 终态守卫语义统一，写入仍幂等友好）。
        """
        tool_call_id = str(body.tool_call_id or "")
        if not tool_call_id:
            raise HTTPException(status_code=400, detail="tool_call_id required")
        svc = get_question_service()
        st = svc.get_survey(tool_call_id)
        if st is None:
            raise HTTPException(status_code=404, detail="Survey state not found")

        override = str(body.model_id or "")
        # 终态问卷：写入覆盖（幂等），但明确告知前端「无未分析题、覆盖无实际效果」。
        terminal = getattr(st, "status", "") == "submitted"
        st.model_override = override
        svc.upsert_survey(st)

        # effective_model_id 按 override 优先口径：override 非空则等于它，
        # 否则回落该问卷 prefs.model_id 快照（prefs 亦空则空 → runner 用宿主 active model）。
        effective = override or (getattr(st, "prefs", None) or {}).get("model_id") or ""
        return {
            "ok": True,
            "accepted": not terminal,
            "reason": "already_submitted" if terminal else "",
            "tool_call_id": tool_call_id,
            "model_override": override,
            "effective_model_id": effective,
        }

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

    # ── 挂起问卷扫描 / 释放 / 终止会话（2026-11-15 新增）─────────────
    #
    # 背景（实测，非推测）：manual 问卷本该 30 分钟自动释放
    # （question_service._SURVEY_MANUAL_WATCHDOG_SEC=1800），但
    # `release_survey` 的 `_reason` UnboundLocalError 使 watchdog
    # 「判定超时 → 调用释放 → 崩溃」三段式走不完，问卷永远停在 pending。
    # bug 已修，但**历史残骸**不会自己好：
    #   · pending_questions.json 记录已丢失、只剩 survey_states 的孤儿；
    #   · 对应的会话文件早已不存在，没有任何对象可「终止」。
    # 故需要一组端点把残骸显式扫出来并手动处置。
    #
    # 与 `/survey-prune` 的关系：那个按「有没有 request_id / 前缀」批量删；
    # 这里按「是否 pending 且静默超阈值」逐条列出，**先看清再动手**。

    def _stale_rows_all() -> list[dict]:
        """**不去重阈值**的全部 pending 行（P1-b 分组用，2026-11-15）。

        与 `_stale_rows(older_than_sec)` 的区别只在过滤时机：本函数一次性
        把所有「仍在等答复」的行算好（含 idle 与在场判据），由调用方按阈值
        切成「已超阈值 / 未超阈值」两组。

        ★ 为什么要重构而不是让前端自己过滤：`idle_sec` 的算法（base 取
          progress_at/created_at/now 三者）、`has_live_future` 的判定、
          `reason_code` 的分类都在后端一处实现；前端再算一遍必然漂移，
          而「哪条能释放」是安全判据，漂移一次就是替用户交卷。
        """
        svc = get_question_service()
        now = time.time()
        states = svc._surveys()
        # request_id / tool_call_id 双索引，孤儿可能只有其中一个能对上
        pending_by_tcid: dict[str, Any] = {}
        pending_by_rid: dict[str, Any] = {}
        for pq in list(svc._pending.values()):
            if getattr(pq, "tool_call_id", ""):
                pending_by_tcid[str(pq.tool_call_id)] = pq
            pending_by_rid[str(pq.request_id)] = pq

        subs = svc._subs()
        rows: list[dict] = []
        for tcid, st in list(states.items()):
            if getattr(st, "status", "") != "pending":
                continue
            if getattr(st, "released", False):
                continue
            base = (getattr(st, "progress_at", 0) or 0) or (
                getattr(st, "created_at", 0) or 0) or now
            idle = now - base
            pq = pending_by_tcid.get(str(tcid)) or pending_by_rid.get(
                str(getattr(st, "request_id", "") or ""))
            future = getattr(pq, "future", None) if pq is not None else None
            has_live = bool(pq is not None and future is not None
                            and not future.done()
                            and not getattr(pq, "orphan", False))
            if pq is None:
                code = "orphan-no-pending"
            elif getattr(pq, "orphan", False):
                code = "orphan-future-dead"
            elif future is None:
                code = "no-future"
            elif future.done():
                code = "future-done"
            else:
                code = "stale-pending"
            rows.append({
                "tool_call_id": str(tcid),
                "request_id": str(getattr(st, "request_id", "") or ""),
                "session_id": str(getattr(st, "session_id", "") or ""),
                "agent_id": str(getattr(st, "agent_id", "") or ""),
                # 2026-11-25 boss 需求：清理卡片「打开会话」要在新标签页打开
                # 宿主会话页 /chat/<chat UUID>。前端只有 session_id（非 UUID、
                # 跨 agent 可能重复），这里用既有只读桥接解析出 chat UUID 一并返回；
                # 解析不到留空，前端据此禁用按钮，绝不猜 URL。
                "chat_id": _resolve_chat_id(
                    "", str(getattr(st, "session_id", "") or ""),
                    str(getattr(st, "agent_id", "") or "")),
                "title": str(getattr(st, "title", "") or ""),
                "mode": str(getattr(st, "mode", "") or ""),
                # `idle_sec` 参与分组判定，必须是**未取整**的原值；
                # 展示用 `idle_text`。取整会让"卡在阈值上一秒"的问卷
                # 在两组之间抖动。
                "idle_sec": idle,
                "idle_text": _hm(idle),
                "created_at": getattr(st, "created_at", None),
                "progress_at": getattr(st, "progress_at", None),
                "has_pending": pq is not None,
                "has_live_future": has_live,
                # 性质二分（2026-11-18 boss 裁定）：唯一判据 = has_live_future。
                # blocking = 有活 Future，agent 真在等作答；residual = 已无等待方、
                # 仅状态未收尾（孤儿/无句柄/已 done）。reason_code 只作展示标签，
                # 不参与分类，避免两处判据打架。
                "nature": "blocking" if has_live else "residual",
                # P1-b：有页面正在看这份问卷（SSE 订阅非空）。
                # 前端据此标红「正在作答」，避免用户把别人正在答的问卷释放掉。
                "has_live_subscriber": bool(subs.get(str(tcid))),
                "in_flight": float(getattr(st, "inflight_at", 0.0) or 0.0) > 0,
                "reason_code": code,
                # 「释放」永远可做（就是把这个 state 收尾）；
                # 「终止会话」只有存在活 Future（真要唤醒/杀掉什么）时才有意义，
                # 其余情况宿主会返回 stopped=false，前端据此置灰并说明原因。
                "releasable": True,
                "terminable": has_live and bool(
                    getattr(st, "session_id", "") or getattr(pq, "chat_id", "")),
            })
        rows.sort(key=lambda r: r["idle_sec"], reverse=True)
        return rows

    def _stale_split(
        threshold_sec: float,
    ) -> tuple[list[dict], list[dict]]:
        """按阈值切成 ``(已超阈值, 未超阈值)`` 两组（P1-b，2026-11-15）。

        ★ `threshold_sec <= 0`（自动释放关闭）时**不分组**：全部归入
          「未超阈值」，已超阈值组恒为空。理由（boss 2026-11-15 裁定 D11）：
          关闭后"超阈值"没有意义 —— 没有任何东西会在阈值处被释放，
          把它们标成"已超阈值"会让用户以为后台要动手。
          此时前端用橙色警示条说明"永不自动释放"，而不是靠分组表达。
        """
        rows = _stale_rows_all()
        if threshold_sec <= 0:
            return [], rows
        exceeded = [r for r in rows if r["idle_sec"] >= threshold_sec]
        within = [r for r in rows if r["idle_sec"] < threshold_sec]
        return exceeded, within

    def _stale_rows(older_than_sec: float) -> list[dict]:
        """汇总所有静默超过阈值的 pending 问卷（只读，不改任何状态）。

        ★ 2026-11-15 起降级为薄封装：真正实现移到 `_stale_rows_all()`
          （一次性算全量，由 `_stale_split` 切组）。保留本函数是为了不动
          既有调用点与返回结构（`items` 字段仍向后兼容）。

        ★ 判据只允许有一份实现。`idle` 基准（progress_at/created_at/now
          三者取最大）、`has_live_future`、`reason_code` 都是"哪条能释放"
          的安全判据 —— 前端或第二份后端实现再算一遍必然漂移，漂移一次
          就是替用户交卷。
        """
        return [r for r in _stale_rows_all() if r["idle_sec"] >= older_than_sec]

    def _hm(sec: float) -> str:
        """秒 → 「1天2小时」这类人读文本（只用于展示，不参与判断）。"""
        sec = int(max(0, sec))
        if sec < 60:
            return f"{sec} 秒"
        if sec < 3600:
            return f"{sec // 60} 分钟"
        if sec < 86400:
            return f"{sec // 3600} 小时 {sec % 3600 // 60} 分钟"
        return f"{sec // 86400} 天 {sec % 86400 // 3600} 小时"

    @router.get("/stale-surveys")
    async def get_stale_surveys(
        older_than_sec: float = Query(default=-1.0),
    ):
        """列出挂起问卷，按「已超阈值 / 未超阈值」分两组（P1-b，2026-11-15）。

        **只读**：不释放、不清数据、不改任何 state。先看清再决定动哪条。

        参数 `older_than_sec`：
          · 不传（-1）→ 用生效设置 `release_after_sec`（单一真相源）；
          · 显式传数值 → 覆盖设置，用于"我想看看若阈值是 X 会怎样"。
            `older_than_sec=0` 会列出全部 pending（用于排查）。

        ★ 为什么默认值不再是 1800：硬编码 1800 会在用户把阈值改成 1 小时
          后仍然按 30 分钟分组 —— 用户改了设置、页面却按旧值说话，
          属于「检查目标的影子」。默认必须读设置。
        """
        if older_than_sec is None or older_than_sec < 0:
            raw = resolve_effective("").get("release_after_sec")
            if raw is None:
                raw = SETTINGS_SCHEMA["release_after_sec"]["default"]
            threshold = float(raw)
        else:
            threshold = float(older_than_sec)

        exceeded, within = _stale_split(threshold)
        rows = exceeded + within
        # 性质二分（2026-11-18 boss 裁定）：blocking = 正在阻塞会话（有活
        # Future，agent 真在等）；residual = 已结束但状态未收尾（孤儿残留）。
        # 与阈值分组正交：两刀切的是同一批 rows，blocking+residual 恒等于
        # exceeded+within，前端据此分区渲染、按类给操作按钮。
        blocking = [r for r in rows if r.get("nature") == "blocking"]
        residual = [r for r in rows if r.get("nature") != "blocking"]
        return {
            "ok": True,
            "threshold_sec": threshold,
            "threshold_disabled": threshold <= 0,
            "older_than_sec": threshold,     # 向后兼容旧字段
            "count": len(rows),
            "exceeded_count": len(exceeded),
            "within_count": len(within),
            "exceeded": exceeded,
            "within": within,
            "blocking": blocking,
            "residual": residual,
            "blocking_count": len(blocking),
            "residual_count": len(residual),
            # 向后兼容：旧调用方只读 items / count / releasable / terminable
            "items": rows,
            "releasable": sum(1 for r in rows if r["releasable"]),
            "terminable": sum(1 for r in rows if r["terminable"]),
        }

    @router.post("/stale-surveys/release")
    async def post_stale_release(body: dict | None = None):
        """释放指定（或全部）挂起问卷：收尾 state + 清 pending + 唤醒 Future。

        与「终止会话」是**两件事**（用户 2026-11-15 裁定分开给）：
          · 释放 = 让插件这边不再认为它在等人，会话可以继续；
          · 终止 = 让宿主的 chat 真正停下来（见下一个端点）。

        幂等：已 released 的直接返回 already，不重复写盘。
        """
        payload = body if isinstance(body, dict) else {}
        ids = [str(x) for x in (payload.get("tool_call_ids") or []) if str(x)]
        want_all = bool(payload.get("all"))
        svc = get_question_service()

        if not ids and not want_all:
            raise HTTPException(
                status_code=400,
                detail="必须传 tool_call_ids 或 all=true，拒绝无目标操作",
            )
        if want_all:
            # ── D10（boss 2026-11-15 裁定）：批量释放**只作用于已超阈值组** ──
            #
            # ★ 绝不把观察期内的问卷一起释放。历史依据
            #   （question_service.py:821 注释原文）：
            #     「强制释放等于替用户交卷（违反上一轮『manual 无页面时
            #       保持等待』的裁定）」
            #   观察期内的问卷很可能正被另一个标签页作答（has_live_subscriber），
            #   批量把它释放 = 替人交卷 + 把用户正在填的答案丢掉。
            #
            # ★ 阈值不读请求体（旧实现读 payload.older_than_sec，默认 1800）：
            #   那样前端传个 0 就能把未超阈值的也一并释放，等于把安全约束
            #   交给调用方。此处一律用服务端生效设置。
            raw = resolve_effective("").get("release_after_sec")
            if raw is None:
                raw = SETTINGS_SCHEMA["release_after_sec"]["default"]
            threshold = float(raw)
            if threshold <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "自动释放已关闭（release_after_sec=0），"
                        "无法批量释放；请逐条指定 tool_call_ids"
                    ),
                )
            exceeded, _within = _stale_split(threshold)
            ids = [r["tool_call_id"] for r in exceeded]
            if not ids:
                return {
                    "ok": True,
                    "released": 0,
                    "failed": 0,
                    "results": [],
                    "note": "当前没有超过阈值的挂起问卷（观察期内的不参与批量释放）",
                }

        results = []
        for tcid in ids:
            st = svc.get_survey(tcid)
            if st is None:
                results.append({"tool_call_id": tcid, "ok": False,
                                "result": "state-not-found"})
                continue
            if getattr(st, "released", False):
                results.append({"tool_call_id": tcid, "ok": True,
                                "result": "already"})
                continue
            try:
                changed = await svc.release_survey(
                    tcid, "manual-admin",
                    reason="管理员在「问卷清理」页签手动释放",
                )
                results.append({"tool_call_id": tcid,
                                "ok": bool(changed),
                                "result": "released" if changed else "no-change"})
            except Exception as exc:  # noqa: BLE001
                # 单条失败不能中断整批，但必须如实回报，不许吞成成功。
                logger.warning("stale release failed for %s", tcid[:16],
                               exc_info=True)
                results.append({"tool_call_id": tcid, "ok": False,
                                "result": f"{type(exc).__name__}: {exc}"})
        ok_n = sum(1 for r in results if r["ok"])
        # ★ 「本次真正释放」与「本来就是终态」必须分开计数。
        #   实测踩坑：重复释放同一条时返回 result=already，而 released 仍按
        #   ok_n 计成 1 → 前端显示「已释放 1 条」，用户会以为这次又清掉一条。
        #   判据分三层：released=本次新收尾的；already=之前就收过尾的；
        #   failed=没成功（含 state-not-found 与异常），三者之和 = requested。
        changed_n = sum(1 for r in results if r["result"] == "released")
        already_n = sum(1 for r in results if r["result"] == "already")
        failed_n = len(results) - changed_n - already_n
        logger.info(
            "stale-surveys release: changed=%d already=%d failed=%d (all=%s)",
            changed_n, already_n, failed_n, want_all,
        )
        return {
            "ok": True,
            "requested": len(ids),
            "released": changed_n,
            "already": already_n,
            "failed": failed_n,
            "ok_count": ok_n,
            "results": results,
        }

    @router.post("/stale-surveys/terminate")
    async def post_stale_terminate(body: dict | None = None):
        """兜底：调宿主 `/console/chat/stop` 真正终止会话进程。

        ⚠️ 实测常见结果是 **stopped=false**：orphan 问卷对应的会话往往早已
        不存在（3/3 条实测如此），此时没有任何东西可停。**必须如实返回**，
        绝不能因为「反正数据也清了」就报成功——那会让后继排障建立在假事实上。
        """
        payload = body if isinstance(body, dict) else {}
        ids = [str(x) for x in (payload.get("tool_call_ids") or []) if str(x)]
        if not ids:
            raise HTTPException(
                status_code=400, detail="必须传 tool_call_ids，拒绝无目标操作",
            )
        svc = get_question_service()
        results = []
        for tcid in ids:
            st = svc.get_survey(tcid)
            if st is None:
                results.append({"tool_call_id": tcid, "ok": False,
                                "stopped": False, "result": "state-not-found"})
                continue
            session_id = str(getattr(st, "session_id", "") or "")
            agent_id = str(getattr(st, "agent_id", "") or "")
            # 优先用 chat_id；orphan 记录 chat_id 常为空串，宿主支持用
            # session_id 兜底反查（console.py:605-618），故两者任一都可。
            chat_id = str(payload.get("chat_id") or "") or session_id
            if not chat_id:
                results.append({"tool_call_id": tcid, "ok": False,
                                "stopped": False, "result": "no-session-id"})
                continue
            try:
                status, text = await asyncio.to_thread(
                    _post_host_api_query,
                    "/api/console/chat/stop",
                    {"chat_id": chat_id, "cancel_reason": "user",
                     "initiator": "question-modal:stale-cleanup"},
                    agent_id,
                )
            except Exception as exc:  # noqa: BLE001
                results.append({"tool_call_id": tcid, "ok": False,
                                "stopped": False,
                                "result": f"{type(exc).__name__}: {exc}"})
                continue
            stopped = False
            try:
                stopped = bool(json.loads(text or "{}").get("stopped"))
            except Exception:  # noqa: BLE001
                stopped = False
            results.append({
                "tool_call_id": tcid,
                "ok": status == 200,
                "http": status,
                "stopped": stopped,
                # 如实把「没停到」翻译成一句人话，前端直接展示。
                "result": ("stopped" if stopped
                           else "session-gone-or-idle"),
            })
        logger.info("stale-surveys terminate: %s",
                    [(r["tool_call_id"][:12], r.get("stopped")) for r in results])
        return {"ok": True, "requested": len(ids), "results": results}


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
        # ── P0-2/P0-3 可见性（2026-11-15）────────────────────────────
        # 巡检与 pending 堆积必须能被外部查询到：
        #   · `sweep_alive`      —— 全局巡检循环是否在跑（false = 后台不释放了）
        #   · `sweep_generation` —— 第几代循环（热重载后应 +1；不增 = 旧代还在）
        #   · `pending_count`    —— 挂起堆积量（关闭自动释放后无上限，只能靠看）
        #   · `release_after_sec`—— 当前生效阈值（0 = 关闭）
        try:
            svc = get_question_service()
            info["sweep_alive"] = bool(svc._sweep_alive())
            info["sweep_generation"] = int(
                getattr(svc._shared(), "sweep_generation", 0) or 0)
            info["pending_count"] = len(svc._pending)
            info["release_after_sec"] = float(svc._release_after_sec())
        except Exception:  # noqa: BLE001
            info["sweep_alive"] = False
            info["sweep_generation"] = -1
            info["pending_count"] = -1
            info["release_after_sec"] = -1.0
        return info

    @router.post("/prefs")
    async def post_prefs(body: PrefsRequest):
        """写入全局设置（merge 语义，只更新传入的键）。

        ★ 2026-11-17 契约变更（API_CONTRACT_v5 CHG-001，REQ-2026-0072）：

        响应体新增 ``rejected``，且 ``ok`` 的定义改为 **``rejected`` 为空**。

        旧行为（缺陷）：``sanitize_settings`` 把非法值静默丢掉，这里无条件
        返回 ``{"ok": True}``。实测 ``POST {"release_after_sec": 7200}`` 得到
        200 + ok:true，但回读仍是 1800 —— 任何被拒的值，调用方都会以为保存成功。

        新行为：合法项照写，非法项不写并逐项回传原因；
        ``ok = (rejected 为空)``，调用方必须判这个字段（不能只看 HTTP 200）。

        HTTP 状态码始终 200：这是批量 merge，部分合法是常态，用 4xx 会让
        调用方无法区分「整个请求坏了」与「其中一项值不合法」。
        """
        saved = _save_prefs(_prefs_payload(body))
        rejected = saved.pop("__rejected__", []) or []
        return {"ok": not rejected, "prefs": saved, "rejected": rejected}

    # ── 子代理模式参数（2026-11-26 full 档，契约 v1.2）────────────────
    @router.get("/subagent-params")
    async def get_subagent_params() -> dict:
        """读子代理参数（独立文件 subagent_prefs.json）。"""
        return {"ok": True, "params": _load_subagent_params()}

    @router.post("/subagent-params")
    async def post_subagent_params(body: PrefsRequest) -> dict:
        """写子代理参数（merge）。沿用 /prefs 的 ok/rejected 语义。"""
        saved = _save_subagent_params(_prefs_payload(body))
        rejected = saved.pop("__rejected__", []) or []
        return {"ok": not rejected, "params": saved, "rejected": rejected}

    # ── Effective settings (the ONLY read path for cards + settings UI) ──
    @router.get("/effective-config")
    async def get_effective_config(
        request: Request,
        chat_id: str = "", session_id: str = "", agent_id: str = "",
    ) -> dict:
        """返回当前生效的设置。

        ## 2026-11-23 架构变更（boss 裁定：「全部采用统一的配置」）
        旧实现返回三层数据（server / session_config / global_config）并带
        `active_scope`，因为界面上有「会话模式 / 默认模式」两个页签。boss 裁定
        取消会话级配置后：

          · 生效值 = 基础配置 ⊕ 命中的时间策略（见 resolve_effective）
          · `config`      —— 生效值（前端基础配置页读它）
          · `base_config` —— 基础配置原始值（不含时段覆盖，用于「还原」与
                             「时段未命中时用哪份」的展示）
          · `schedule`    —— 当前命中的时间策略（null = 未命中，回落基础配置）
          · `libraries`   —— 策略库快照（参数组 / 通知配置 / 时间策略）

        为兼容仍然读旧键的调用方，`global_config` 保留为 `base_config` 的别名；
        `session_config` 恒为空 dict、`active_scope` 恒为 "global"、`has_session`
        恒 False —— 它们已无实际语义，但保留可避免旧前端崩在 undefined 上。
        """
        # Accept session_id+agent_id too: the host never hands the front end a
        # chat UUID, so the caller cannot always supply one.（保留：chat_id 仍
        # 参与「跟随当前对话模型」的解析，只是不再参与配置合并）
        chat_id = _resolve_chat_id(chat_id, session_id, agent_id)
        cfg = resolve_effective(chat_id)
        cfg = await _fill_follow_active(cfg, request, agent_id, chat_id)

        # 基础配置原始值（不含时段覆盖）
        base_config: dict = {}
        global_keys: list[str] = []
        try:
            base_config = sanitize_settings(_load_prefs())[0]
            global_keys = list(base_config.keys())
        except Exception:  # noqa: BLE001
            logger.warning(
                "question_modal: could not read base config", exc_info=True,
            )

        # 策略库快照：前端渲染「参数库」「时间策略」两个页签需要它
        libraries: dict = {"param_sets": [], "notify_profiles": [], "schedules": []}
        try:
            libraries = {
                "param_sets": load_param_sets(),
                "notify_profiles": load_notify_profiles(),
                "schedules": load_schedules(),
            }
        except Exception:  # noqa: BLE001
            logger.warning(
                "question_modal: could not read libraries", exc_info=True,
            )

        return {
            "ok": True,
            "chat_id": chat_id,
            "config": cfg,
            "base_config": base_config,
            # 兼容别名（旧字段，语义 = base_config）
            "global_config": base_config,
            "global_keys": global_keys,
            # 已废弃字段：保留空值避免旧前端崩在 undefined 上
            "session_config": {},
            "active_scope": "global",
            "has_session": False,
            "key_ts": {},
            # 当前命中的时间策略（null = 未命中）
            "schedule": cfg.get("__schedule__"),
            "libraries": libraries,
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
        # 2026-11-24 boss 需求 2：custom_api 加入可选渠道列表（它是一种
        # 自定义通知方式，不是独立页签之外的第三形态）。仍**不**进
        # _NOTIFY_REMOTE_CHANNELS——那条集合专指「走宿主 /api/messages/send
        # 的 IM 渠道」，custom_api 的状态判定与投递都走自己的分支。
        for key in ("off",) + tuple(_NOTIFY_REMOTE_CHANNELS) + ("custom_api", "browser"):
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
            # 双场景当前值（2026-11-19）：迁移已在 resolve_effective 内完成，
            # 这两个值就是「此刻实际会用的渠道」。
            "pc_current": str(cfg.get("notify_channel_pc") or "off"),
            "bg_current": str(cfg.get("notify_channel_bg") or "off"),
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
            session_id=str(body.session_id or ""),
        )

    @router.post("/heartbeat")
    async def post_heartbeat(request: Request) -> dict:
        """前端页面心跳（2026-11-19 双场景通知）。

        前端页面存活期间每 30s 打一次（独立于问卷面板，SSE 期间也有），
        后端据此判定「PC 端打开 vs 后台运行」选择通知渠道。幂等、无副作用。
        """
        try:
            body = await request.json()
        except Exception:  # noqa: BLE001 — 空/坏 body 按缺省处理
            body = {}
        sid = str((body or {}).get("session_id") or "") if isinstance(body, dict) else ""
        _mark_frontend_seen(sid)
        return {"ok": True}

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

    # ── 会话级覆盖：已下线（2026-11-23 架构重构，boss 裁定）──────────────
    #
    # boss 原话：「不再采用会话模式或者默认模式，全部采用统一的配置，所有的
    # 会话都生效同一种配置」。
    #
    # 因此「会话覆盖」这个数据源不再参与任何生效值计算（见 resolve_effective）。
    # 三个旧端点保留为**显式 410**，而不是直接删掉：
    #
    #   · 直接 404：旧版前端/脚本会得到一个"路由不存在"的含糊错误，看不出是
    #     "功能已下线"还是"插件装坏了"，排查方向会跑偏。
    #   · 410 + 迁移说明：明确告诉调用方"这个能力被移除了，该改用哪个"，
    #     与 MEMORY 里「写入静默丢弃/退化猜错」两条铁律同向 —— 宁可显式拒绝，
    #     也不要让调用方以为操作成功了。
    #
    # **磁盘上的 session_prefs.json 不删除**：里面是用户历史配置，属不可再生
    # 数据。保留原文件，万一 boss 将来要回看/导出仍有据可查。
    _DEPRECATED_SESSION_MSG = (
        "会话级配置已于 2026-11-23 移除：所有会话统一使用「基础配置」，"
        "按时段生效请改用「时间策略」（/schedules）。"
        "磁盘上的历史 session_prefs.json 已保留但不再参与生效值计算。"
    )

    @router.get("/session-prefs")
    async def list_session_prefs() -> dict:
        """已下线：会话级覆盖不再参与生效值计算。"""
        raise HTTPException(status_code=410, detail=_DEPRECATED_SESSION_MSG)

    @router.post("/session-prefs")
    async def post_session_prefs(body: dict) -> dict:
        """已下线：会话级覆盖不再参与生效值计算。

        保留这个签名（而不是删掉路由）是为了让旧调用方拿到明确的 410，
        而不是「404 路由不存在」这种会误导排查的响应。
        """
        raise HTTPException(status_code=410, detail=_DEPRECATED_SESSION_MSG)

    @router.post("/session-prefs/clear")
    async def clear_session_prefs(body: dict) -> dict:
        """已下线：会话级覆盖不再参与生效值计算。"""
        raise HTTPException(status_code=410, detail=_DEPRECATED_SESSION_MSG)

    # ══ 策略库 CRUD（US-024，2026-11-23）══════════════════════════════
    #
    # 三个库：参数组 / 通知配置 / 时间策略。接口形态统一为
    #     GET    /<lib>           列表（含引用检查信息）
    #     POST   /<lib>           新建或更新（带 id = 更新，无 id = 新建）
    #     DELETE /<lib>           删除（被引用时拒绝，除非 force=true）
    #
    # 为什么删除要检查引用：时间策略按 id 引用参数组/通知配置。「删了还在被
    # 引用的参数组」会让那条策略静默退化成"什么都不覆盖" —— 用户以为策略还在
    # 生效，实际已经空了。这是典型的静默降级，必须拦下来（AGENTS.md §4.1）。
    # 确实要删时 force=true 会**同时清空引用它的策略的对应字段**，并回报改了
    # 哪些策略，而不是让策略坏在半路。

    def _param_set_refs(ps_id: str) -> list[dict]:
        return [
            {"id": s["id"], "name": s["name"]}
            for s in load_schedules() if s.get("param_set_id") == ps_id
        ]

    def _notify_profile_refs(np_id: str) -> list[dict]:
        return [
            {"id": s["id"], "name": s["name"]}
            for s in load_schedules() if s.get("notify_profile_id") == np_id
        ]

    @router.get("/libs")
    async def get_libs() -> dict:
        """一次取回三个策略库 + 当前命中的策略 id。

        为什么单独开这个端点（而非只靠 /effective-config）：前端写库成功后
        只需要刷新库列表，/effective-config 会连带把整份生效配置重算一遍，
        在编辑态里重拉会把用户正在填的草稿冲掉。窄口径刷新避免这类误伤。

        返回结构与 /effective-config 的 `libraries` 保持一致（外加 active_id），
        前端两条路径可以共用一个解析函数。
        """
        active = match_schedule()
        return {
            "ok": True,
            "libraries": {
                "param_sets": load_param_sets(),
                "notify_profiles": load_notify_profiles(),
                "schedules": load_schedules(),
            },
            "active_id": (active or {}).get("id") if active else None,
        }

    @router.get("/param-sets")
    async def get_param_sets() -> dict:
        """列出全部问卷参数组，附带每条被哪些时间策略引用。"""
        items = load_param_sets()
        for it in items:
            it["used_by"] = _param_set_refs(it["id"])
        return {"ok": True, "items": items}

    @router.post("/param-sets")
    async def post_param_set(body: dict) -> dict:
        """新建（无 id）或更新（有 id）一个参数组。

        更新时只覆盖请求里带了的字段，没有 id 就新建。返回落库后的整条记录，
        调用方据此刷新列表（不猜后端做了什么）。
        """
        body = body or {}
        items = load_param_sets()
        pid = str(body.get("id") or "").strip()
        if pid:
            for i, it in enumerate(items):
                if it["id"] == pid:
                    merged = dict(it)
                    if "name" in body:
                        merged["name"] = body.get("name")
                    if "params" in body:
                        merged["params"] = body.get("params")
                    items[i] = _sanitize_param_set(merged)
                    save_param_sets(items)
                    return {"ok": True, "item": items[i]}
            raise HTTPException(status_code=404, detail=f"参数组不存在: {pid}")
        item = _sanitize_param_set(body, keep_id=False)
        items.append(item)
        save_param_sets(items)
        return {"ok": True, "item": item}

    @router.delete("/param-sets")
    async def delete_param_set(id: str = "", force: bool = False) -> dict:
        """删除参数组。被时间策略引用时默认拒绝，force=true 连带清空引用。"""
        if not id:
            raise HTTPException(status_code=400, detail="id is required")
        items = load_param_sets()
        target = next((x for x in items if x["id"] == id), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"参数组不存在: {id}")
        refs = _param_set_refs(id)
        if refs and not force:
            names = "、".join(r["name"] or r["id"] for r in refs)
            raise HTTPException(
                status_code=409,
                detail=(
                    f"该参数组正被 {len(refs)} 条时间策略引用（{names}）。"
                    "请先解除引用，或传 force=true 让这些策略的参数组被清空。"
                ),
            )
        touched: list[str] = []
        if refs:
            scheds = load_schedules()
            for s in scheds:
                if s.get("param_set_id") == id:
                    s["param_set_id"] = ""
                    touched.append(s.get("name") or s.get("id") or "")
            save_schedules(scheds)
        save_param_sets([x for x in items if x["id"] != id])
        return {"ok": True, "deleted": id, "cleared_in": touched}

    @router.get("/notify-profiles")
    async def get_notify_profiles() -> dict:
        """列出全部命名通知配置，附带被引用情况。"""
        items = load_notify_profiles()
        for it in items:
            it["used_by"] = _notify_profile_refs(it["id"])
        return {"ok": True, "items": items}

    @router.post("/notify-profiles")
    async def post_notify_profile(body: dict) -> dict:
        """新建或更新一条命名通知配置（pc / bg 两个渠道）。"""
        body = body or {}
        items = load_notify_profiles()
        pid = str(body.get("id") or "").strip()
        if pid:
            for i, it in enumerate(items):
                if it["id"] == pid:
                    merged = dict(it)
                    if "name" in body:
                        merged["name"] = body.get("name")
                    if "channels" in body:
                        merged["channels"] = body.get("channels")
                    items[i] = _sanitize_notify_profile(merged)
                    save_notify_profiles(items)
                    return {"ok": True, "item": items[i]}
            raise HTTPException(status_code=404, detail=f"通知配置不存在: {pid}")
        item = _sanitize_notify_profile(body, keep_id=False)
        items.append(item)
        save_notify_profiles(items)
        return {"ok": True, "item": item}

    @router.delete("/notify-profiles")
    async def delete_notify_profile(id: str = "", force: bool = False) -> dict:
        """删除通知配置。被时间策略引用时默认拒绝，force=true 连带清空引用。"""
        if not id:
            raise HTTPException(status_code=400, detail="id is required")
        items = load_notify_profiles()
        target = next((x for x in items if x["id"] == id), None)
        if not target:
            raise HTTPException(status_code=404, detail=f"通知配置不存在: {id}")
        refs = _notify_profile_refs(id)
        if refs and not force:
            names = "、".join(r["name"] or r["id"] for r in refs)
            raise HTTPException(
                status_code=409,
                detail=(
                    f"该通知配置正被 {len(refs)} 条时间策略引用（{names}）。"
                    "请先解除引用，或传 force=true 让这些策略的通知配置被清空。"
                ),
            )
        touched: list[str] = []
        if refs:
            scheds = load_schedules()
            for s in scheds:
                if s.get("notify_profile_id") == id:
                    s["notify_profile_id"] = ""
                    touched.append(s.get("name") or s.get("id") or "")
            save_schedules(scheds)
        save_notify_profiles([x for x in items if x["id"] != id])
        return {"ok": True, "deleted": id, "cleared_in": touched}

    @router.get("/schedules")
    async def get_schedules() -> dict:
        """列出全部时间策略，并标出「此刻命中的是哪一条」。

        `active_id` 让前端能直接高亮当前生效项，而不必自己再算一遍时段匹配
        （两处各算一份必然漂移 —— 见 resolve_effective 的同类注释）。
        """
        items = load_schedules()
        active = match_schedule()
        return {
            "ok": True,
            "items": items,
            "active_id": (active or {}).get("id") if active else None,
        }

    @router.post("/schedules")
    async def post_schedule(body: dict) -> dict:
        """新建或更新一条时间策略。

        引用校验：`param_set_id` / `notify_profile_id` 若给了值，必须指向真实
        存在的库条目 —— 否则这条策略从建立那一刻起就是坏的（命中后什么都
        覆盖不到），而用户从界面上看不出区别。
        """
        body = body or {}
        items = load_schedules()
        sid = str(body.get("id") or "").strip()

        ps_id = str(body.get("param_set_id") or "").strip()
        if ps_id and not any(x["id"] == ps_id for x in load_param_sets()):
            raise HTTPException(
                status_code=400, detail=f"引用的参数组不存在: {ps_id}",
            )
        np_id = str(body.get("notify_profile_id") or "").strip()
        if np_id and not any(x["id"] == np_id for x in load_notify_profiles()):
            raise HTTPException(
                status_code=400, detail=f"引用的通知配置不存在: {np_id}",
            )

        if sid:
            for i, it in enumerate(items):
                if it["id"] == sid:
                    merged = dict(it)
                    for key in ("name", "start", "end",
                                "param_set_id", "notify_profile_id"):
                        if key in body:
                            merged[key] = body.get(key)
                    items[i] = _sanitize_schedule(merged)
                    save_schedules(items)
                    return {"ok": True, "item": items[i]}
            raise HTTPException(status_code=404, detail=f"时间策略不存在: {sid}")
        item = _sanitize_schedule(body, keep_id=False)
        items.append(item)
        save_schedules(items)
        return {"ok": True, "item": item}

    @router.delete("/schedules")
    async def delete_schedule(id: str = "") -> dict:
        """删除一条时间策略。

        策略是引用方、不是被引用方，删它不会破坏别处，因此无需强制确认 ——
        但会回报「删除后当前是否还有策略命中」，让前端立刻知道生效值变了。
        """
        if not id:
            raise HTTPException(status_code=400, detail="id is required")
        items = load_schedules()
        if not any(x["id"] == id for x in items):
            raise HTTPException(status_code=404, detail=f"时间策略不存在: {id}")
        save_schedules([x for x in items if x["id"] != id])
        active = match_schedule()
        return {
            "ok": True,
            "deleted": id,
            "active_id": (active or {}).get("id") if active else None,
        }

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

    # ── 配置备份 / 恢复（2026-11-25 boss 需求 2）─────────────────────
    # 背景：商店更新整目录替换曾清空全部配置。备份落在**外置**目录，
    # 与代码安装解耦，更新后仍可列出并恢复。
    @router.get("/config/backups")
    async def get_config_backups():
        return {"ok": True, "items": _store.list_backups(),
                "data_dir": str(_store.data_dir())}

    @router.post("/config/backup")
    async def post_config_backup(body: ConfigBackupBody):
        return _store.create_backup(body.label)

    @router.post("/config/restore")
    async def post_config_restore(body: ConfigRestoreBody):
        # 恢复是破坏性操作：存储层强制「恢复前自动快照」，这里不额外放手。
        return _store.restore_backup(body.name)

    @router.delete("/config/backup")
    async def delete_config_backup(body: ConfigRestoreBody):
        # 删除备份不可逆：前端必须先弹二次确认；后端再做路径越界校验。
        return _store.delete_backup(body.name)

    @router.get("/config/export")
    async def get_config_export():
        return {"ok": True, "payload": _store.export_config()}

    @router.post("/config/import")
    async def post_config_import(body: ConfigImportBody):
        return _store.import_config(body.payload)

    @router.get("/config/status")
    async def get_config_status():
        """诊断：配置根目录 + 迁移状态 + 各数据文件是否就位。"""
        files = {name: _store.resolve(name).is_file() for name in _store.DATA_FILES}
        return {"ok": True, "data_dir": str(_store.data_dir()),
                "files": files, "migrated": _store._migrated}

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

        # 题目规范化（2026-11-19 boss 报障后的根治点）：模型生成的题目结构
        # 偶发畸形——options 自带「其他」与插件注入的「其他」重复、题干写
        # 「可多选」却标 single、type 声明与 options 矛盾。在创建入口统一
        # 修正（幂等、保守：不造 options、不改题干、不动 showIf/recommended）。
        questions = _analysis.normalize_questions(questions)

        request_context = getattr(agent, "_request_context", None) or {}
        session_id = str(request_context.get("session_id", "") or "")
        agent_id = str(request_context.get("agent_id", "") or "")
        user_id = str(request_context.get("user_id", "") or "")
        channel = str(request_context.get("channel", "") or "")

        # ★ 子代理会话识别（2026-11-26 full 档，契约 v1.2 §4.3 / R2）
        # 主判据 = _spawn_subagent 显式标志（fork 路径也带，sub- 前缀会被
        # fork_session_id 覆盖，故前缀只能兜底）；agent_id 主/子同为 default，
        # 不做判据。判据结果在此算出，mode/prefs/source 全部据此分支。
        _spawn_flag = request_context.get("_spawn_subagent")
        is_subagent = (_spawn_flag is True) or session_id.startswith("sub-")

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
            # 2026-11-23：会话层已整体移除，mode 只可能来自「基础配置 ⊕ 时段」。
            # 原先这里还有一段「resolve_effective 拿不到就回读会话覆盖」的兜底，
            # 现在那个数据源不存在了，兜底会永远拿到空字典 —— 属于死代码，
            # 留着会让后来者以为还有会话层。直接删掉。
            _eff = resolve_effective(_chat_id).get("mode") if _chat_id else None
            _mode = str(_eff or "manual")
            if _mode not in ("ai", "recommend", "manual"):
                _mode = "manual"
            # 记录「配置 mode」（覆盖前），供日志三字段对比。
            _configured_mode = _mode
            # ★ 子代理会话：用子代理参数覆盖 mode（优先级最高，盖过时段/全局）。
            # 只在拦截点覆盖，不进 resolve_effective —— 主代理路径零改动（R2）。
            if is_subagent:
                _sa = _load_subagent_params()
                _sa_mode = str(_sa.get("mode") or "recommend")
                _mode = _sa_mode if _sa_mode in ("ai", "recommend", "manual") \
                    else "recommend"
            # 诊断（2026-11-13；2026-11-26 补 is_subagent/配置 mode/生效 mode）：
            # 这条是"问卷秒被自动答完"与"子代理模式是否生效"两类故障的快速判据。
            # 每份问卷只打一次，不构成日志噪音。
            logger.info(
                "survey-mode resolve: session=%s agent=%s chat=%s "
                "is_subagent=%s configured=%r eff=%r -> %s",
                session_id[:12] or "-", agent_id or "-",
                _chat_id[:8] or "-", is_subagent, _configured_mode, _eff, _mode,
            )
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
            # ★ 子代理会话用子代理参数组装快照（与主代理 resolve_effective 隔离）。
            _cfg = _load_subagent_params() if is_subagent else (
                resolve_effective(_chat_id) if _chat_id else {})
            _prefs = {
                "model_id": str(_cfg.get("model_id") or ""),
                "with_context": bool(_cfg.get("with_context")),
                "model_timeout_sec": float(_cfg.get("model_timeout_sec") or 0),
                "template_id": str(_cfg.get("template_id") or ""),
            }
        except Exception:  # noqa: BLE001 — 取不到就用默认，绝不阻挡问卷
            logger.warning("could not resolve survey prefs", exc_info=True)

        # ★ 来源标识（R3）：子代理问卷传 source='subagent'，主代理传空串。
        _source = "subagent" if is_subagent else ""

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
            source=_source,
        )

        # Remember the question list too, so a reloaded card can address the
        # right pending record by tool_call_id instead of guessing.
        _register_question(pending.request_id, session_id, questions)

        # ── 频道提醒（#91 接线，2026-11-14）───────────────────────────
        # 问卷创建的瞬间由后端主动提醒一次。前端 effect 只在页面存活时才跑
        # （关掉浏览器即失效），频道通知（钉钉/微信）必须由后端发才能覆盖
        # 「页面已关」的场景 —— 这是 #91 q1 裁定的核心诉求。
        # 仅 manual 模式发：ai/recommend 会自己推进，提醒「等你作答」会误导
        # （与前端 effect 的 mode 判定保持同一口径）。显式传 agent_id：
        # _current_agent_id() 在多 agent 环境会返回空串导致选错 workspace
        # （Channel not found 假象），svc.create 的作用域里已有权威 agent_id。
        if _mode == "manual":
            try:
                await notify_survey_pending(
                    call_id=pending.tool_call_id,
                    title=title,
                    count=len(questions),
                    agent_id=agent_id,
                    # 双场景判定依据：该会话前端页面是否活跃（2026-11-19）。
                    session_id=session_id,
                )
            except Exception:  # noqa: BLE001 — 提醒失败绝不能阻挡问卷本身
                logger.warning(
                    "could not send survey pending notification", exc_info=True,
                )

        # ── 阶段 1：全局巡检（P0-2，2026-11-15 取代 per-survey watchdog）──
        # 旧形态每份问卷起一个协程，关闭自动释放后永不退出、manual 按 5s
        # 空转 360 次、reload 后的 orphan 完全无人纳管。
        # 现在是进程内唯一一个 `_sweep_loop`，幂等调用（`ensure_sweep`
        # 内部先 cancel 旧代再起新代，见 R3）。
        try:
            svc.ensure_sweep()
        except Exception:  # noqa: BLE001 — 巡检起不来不能阻挡问卷弹出
            logger.warning("could not start sweep loop", exc_info=True)

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

        # ── 全局巡检接线（P0-2，2026-11-15）───────────────────────────
        # ① 注入「读阈值」读取器：设置解析在 plugin 侧，question_service
        #    不能反向 import（循环依赖）。读取失败由 service 侧回落默认值。
        # ② 启动巡检：`ensure_sweep` 幂等，且会先 cancel 上一代 task
        #    （热重载后旧 task 跑的是旧代码对象，两代并行会双重释放）。
        try:
            _svc = get_question_service()

            def _release_provider() -> float:
                """当前生效的挂起自动释放阈值（秒）；0 = 关闭。

                ⚠️ 不能用 `cfg.get(k) or default`：那是 falsy 判断，会把
                合法的 0（= 关闭）吞成默认值，用户选「关闭」后后台照样释放。
                反之用 `or 0` 又会在 key 缺失时**误判为关闭**，静默停掉所有
                兜底释放（会话永久 409）。所以必须显式区分「缺 key/None」与 0。
                `resolve_effective` 从 `schema_defaults()` 起算，key 一定存在；
                这里的 None 判断只是防御未知的写入路径。
                """
                cfg = resolve_effective("")
                raw = cfg.get("release_after_sec")
                if raw is None:
                    return float(SETTINGS_SCHEMA["release_after_sec"]["default"])
                return float(raw)

            _svc.set_release_provider(_release_provider)
            _svc.ensure_sweep()
        except Exception:  # noqa: BLE001 — 巡检起不来不能拖垮整个插件加载
            logger.warning("could not wire sweep loop", exc_info=True)

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
