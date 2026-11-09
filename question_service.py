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
import os
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def _vis_desc(st: Any) -> str:
    """一行描述「可见题 / 已答数」，用于 runner 退出日志的归因。

    ★ 为什么不直接 f-string 拼 questions：`_vis_desc` 会在**所有** runner
    退出路径上调用，包括异常/半初始化状态。此处任何异常都会掩盖真正的
    退出原因，所以整体 try 包住、失败时返回 "-" 而非抛出。

    排查价值：`runner:stop ... (recommend step=None; cursor=3 ans=2 vis=3/3)`
    能立刻区分三种"不动"：
      • `ans < vis` → 有题没答（可能是 showIf 隐藏题的判定异常）
      • `ans == vis` → 都答完了但没提交（提交门/末页判定问题）
      • `vis=0/0`     → 题面为空（上游出题就有问题）
    这三种在日志里长得完全一样，没有它就只能靠猜。
    """
    try:
        rec = _load_recommend_engine()
        vis = rec.visible_indices(st.questions, st.answers or {})
        answered = len([k for k, v in (st.answers or {}).items()
                        if _ans_meaningful(v)])
        return f"{answered}/{len(vis)}"
    except Exception:  # noqa: BLE001 — 诊断信息绝不能影响主流程
        return "-"

def _load_analysis_engine():
    """阶段 3：ai 推进需要的分析引擎（同样是模块级唯一入口）。

    与 `_load_recommend_engine` 一样要兼容两种加载方式：
      生产 → 包内相对导入；验证脚本 → 顶层模块裸导入。
    """
    try:
        from . import analysis as mod
        return mod
    except ImportError:
        import analysis as mod  # type: ignore[no-redef]
        return mod


def _load_recommend_engine():
    """THE single entry point for the recommend engine (production path).

    ★ 为什么抽成模块级函数，而不是在 `_runner_loop` 里就地 import：
      自检（`GET /engine-status`）与真正的推进循环必须**走同一条加载路径**，
      否则自检会在真缺陷面前报「一切正常」。抽成唯一入口，两者无法分叉。

    ★ 为什么用**相对导入** `from . import recommend`：
      宿主以 `plugin_<id>` 命名空间加载插件（实测
      `qs_module = plugin_question_modal.question_service`）。相对导入明确
      落在同一个包里，不依赖任何隐式重定向。

    ⚠️ 实测更正（2026-11-07）：裸 `import recommend` 在这个宿主里**也能工作** ——
      宿主 `qwenpaw/plugins/module_isolation.py` 有 import redirector，会把插件
      树内的裸 import 重定向到 `plugin_<id>.<name>`。所以"裸 import 是致命缺陷"
      这个我一度写在这里的判断**是错的**（实测反证：改成裸 import 后
      `/engine-status` 仍报 available=true）。

      但相对导入仍更可取：它不依赖宿主内部机制，宿主若改掉 redirector 行为
      也不会突然失效。属于"少一层隐式依赖"，不是"修 bug"。

    ★ 为什么还要保留裸 import 兜底：本仓库的**验证脚本**（`verify_phase2_state.py`
      等）是把插件目录 `sys.path.insert` 后以**顶层模块**加载 `question_service`
      的 —— 那种加载方式里 `from . import recommend` 没有包上下文，必然
      `ImportError`。只写相对导入会让这些测试全红，而它们测的是真实推进逻辑。
      两道都留着，两种加载方式都能工作。
    """
    try:
        from . import recommend as rec
        return rec
    except ImportError:
        # 顶层模块加载（无包上下文）—— 仅出现在验证脚本里，不是生产路径
        import recommend as rec  # type: ignore[no-redef]
        return rec

_PLUGIN_DIR = Path(__file__).parent.resolve()
# Pending records must outlive the module: the host hot-reloads plugins, and
# a reload used to wipe an open questionnaire, stranding its card forever.
_PENDING_FILE = _PLUGIN_DIR / "pending_questions.json"
# Phase 0（2026-11-05）：后端权威的问卷推进状态。
#
# 为什么需要它：当前「自动推进」（分析→采纳→翻页→提交）完全跑在前端 React
# effect 里，于是 ① 两个标签页各持一份状态、互相抢占覆盖；② 没有任何页面在跑时
# 推进循环根本不存在。用户裁定：推进权归后端，前端只读 + 发 action。
#
# 阶段 0 只做「后端也有这份 state」并做影子比对 —— 前端驱动一行不改，行为零变化。
# 这样能先验证「后端拿到的 state 与前端算出的完全一致」这个地基，再谈接管。
def _resolve_survey_file() -> "Path":
    """问卷 state 的落盘路径，可用环境变量改到临时文件。

    ## 为什么需要可覆盖（2026-11-07 事故）

    验证脚本在**独立进程**里跑：它新建自己的 ``QuestionService``，内存表里几乎
    只有自己造的那几条。脚本结尾调用 ``_persist_surveys()`` 时，写出去的就是
    「这份近乎空的内存表」——**直接覆盖掉生产进程的 221 条真实 state**。

    实测后果：跑了一轮测试脚本后 `survey_states.json` 从 221 条变成 **0 条**
    （备份文件也只有 2 字节，说明覆盖发生在我意识到之前）。只能从更早的备份
    恢复，且丢失了期间的真实记录。

    ## 修法

    测试脚本设置 ``QM_SURVEY_STATE_FILE=/tmp/xxx.json``，把 state 写到临时文件，
    生产文件完全不被触碰。默认值不变，**生产行为零变化**。
    """
    override = os.environ.get("QM_SURVEY_STATE_FILE", "").strip()
    if override:
        return Path(override)
    return _PLUGIN_DIR / "survey_states.json"
# 影子比对差异（阶段 0 的诊断产物；接管完成后可删）。
_SHADOW_FILE = _PLUGIN_DIR / "shadow_diffs.json"
# 阶段 1：每份问卷保留最近多少个广播事件用于重放。
# 太小 → 刷新页面/新标签页拿不到足够历史；太大 → 内存随问卷数线性增长。
# 问卷的语义字段有限（answers 键数 = 题数），200 条足以覆盖任何正常作答过程。
_SURVEY_EVENT_BUFFER = 200
# 阶段 1 看门狗：**只针对自动推进模式**（ai / recommend）。
#
# 为什么 manual 不适用（用户 2026-11-07 两次裁定的交集）：
#   上一轮用户裁定「没人打开页面时 manual 问卷保持等待」= 人工作答本来就需要人；
#   本轮裁定「60 秒无进展就释放」是为了防**驱动循环卡死**。
#   两者若同时套用同一模式会自相矛盾 —— 人停顿 60 秒就被强制交卷。
#   故看门狗只在「本该自己动、却不动了」时才介入。
# ── 阈值 60 → 300（用户裁定 2026-11-08「按建议来」第 3 项）────────
#
# 60s 与 AI 链路的预算严重不匹配，这是"自动模式整卷被跳"的直接根因：
#   · 单题模型超时 `_MODEL_TIMEOUT_SECS = 120`（analysis.py）
#   · 每题允许尝试 `AI_MAX_ATTEMPTS_PER_QUESTION = 2`（recommend.py）
#   · 429 限流时宿主还会 `global pause 5.0s` + 重试
# 一次正常的「超时 → 重试」最少 120s×2 = 240s，而旧阈值 60s 就会把
# **正在正常重试的问卷**判成卡死并整卷释放。实测（2026-11-07/08 四例：
# chatcmpl-tool-97 / b5 / 9f / a6）每题尝试间隔 51~58s，全部死在这条上。
#
# 但真正根治的不是数字，而是下面的 `_note_inflight`：**"分析在飞"本身就是
# 进展**。旧实现只在答案落地时推进 `progress_at`，于是"模型慢"和"循环死"
# 在判据上长得一模一样，任何阈值都只是碰运气。
_SURVEY_WATCHDOG_SEC = 300.0
_SURVEY_WATCHDOG_TICK = 5.0
# 设置项非法 / 读不到时的兜底值（与上面的常量保持单一真相源）。
_WATCHDOG_SEC_DEFAULT = _SURVEY_WATCHDOG_SEC
_WATCHDOG_SEC_MIN = 30.0
_WATCHDOG_SEC_MAX = 1800.0

# Where the process-wide *state* lives.  Deliberately NOT prefixed with the
# plugin's module name (``plugin_question_modal``), so it survives the loader's
# hot-reload sweep of ``sys.modules`` — see QuestionService.__init__.
_SHARED_MODULE_KEY = "_question_modal_shared_state"


def _ans_meaningful(ans: Any) -> bool:
    """Is this answer worth comparing in the shadow diff?

    前端可能用「缺键」表示未作答，后端可能用「空对象」表示同一件事 ——
    那是同一语义的两种表示，不能算差异。只有真的填了值 / 显式跳过 / 有附件
    才算"有意义"。否则影子比对会被一堆空壳淹没，看不出真正的问题。
    """
    if not isinstance(ans, dict):
        return False
    if ans.get("skipped"):
        return True
    if ans.get("attachments"):
        return True
    if str(ans.get("other") or "").strip():
        return True
    v = ans.get("value")
    if isinstance(v, list):
        return any(str(x).strip() for x in v)
    return bool(str(v or "").strip())


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

    def __getattr__(self, name: str) -> Any:
        """Lazily materialise fields added AFTER this container was created.

        ★ 热重载陷阱（2026-11-05 实测）：`_SharedState` 活在 ``sys.modules``
        里，跨插件 reload 存活 —— 这是它存在的目的（保住 pending 的 Future）。
        但代价是：给类新增字段时，**已存在的旧实例不会有那个字段**。
        阶段 0 新增 ``surveys`` 时就踩了这个坑，``get_survey()`` 直接
        AttributeError → 端点 500，而单测（新建实例）却完全正常。

        ``__getattr__`` 只在常规属性查找失败时被调用，所以它只影响"新字段"，
        不会干扰既有字段。这样新代码在旧实例上也能正确初始化。
        """
        if name == "surveys":
            value: dict[str, Any] = {}
            self.__dict__["surveys"] = value
            return value
        if name == "surveys_restored":
            self.__dict__["surveys_restored"] = False
            return False
        # ── 阶段 1：state 权威后移所需的运行时设施 ──────────────────
        # 全部走「按需创建」，理由同上：旧容器上没有这些字典。
        if name == "survey_subs":
            value: dict[str, list[Any]] = {}
            self.__dict__["survey_subs"] = value
            return value
        if name == "survey_events":
            value: dict[str, list[dict]] = {}
            self.__dict__["survey_events"] = value
            return value
        if name == "survey_rev":
            value: dict[str, int] = {}
            self.__dict__["survey_rev"] = value
            return value
        if name == "survey_watchdogs":
            value: dict[str, Any] = {}
            self.__dict__["survey_watchdogs"] = value
            return value
        if name == "survey_runners":
            value: dict[str, Any] = {}
            self.__dict__["survey_runners"] = value
            return value
        raise AttributeError(
            f"{type(self).__name__!r} object has no attribute {name!r}"
        )

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


# 每个 SurveyState 字段的默认值，用于给**跨代际旧实例**补齐缺失字段。
# 见 `get_survey` 的注释：给 dataclass 加字段不会影响已存在的实例。
_STATE_FIELD_DEFAULTS: dict = {
    "answers": dict, "cursor": 0, "mode": "manual", "status": "pending",
    "per_question": dict, "created_at": 0.0, "updated_at": 0.0,
    "submitted_at": None, "orphan": False, "rev": 0, "submitted_by": "",
    "progress_at": 0.0, "watchdog_reason": "", "skip_reason": "",
    "released": False, "prefs": dict,
}


@dataclass
class SurveyState:
    """后端权威的「这份问卷现在到哪一步了」。

    阶段 0 里它只被「影子比对」写入和读取，**不参与任何裁决** —— 前端驱动照旧。
    阶段 1 起它才成为唯一真值，前端退化为渲染 + 发 action。

    字段刻意与前端 state 同构，否则影子比对会全是噪声、失去诊断价值。
    ``cursor`` 用**可见位置**而非真实题号（前端 visStep/visList 都是可见位置空间，
    ``showIf`` 会收窄列表），``answers`` 的键才是真实题号 ``q<idx>``。这两个空间
    必须在文档里说清楚 —— 上一轮「串题」bug 就是混用它们造成的。
    """

    tool_call_id: str = ""
    request_id: str = ""
    session_id: str = ""
    agent_id: str = ""
    title: str = ""
    questions: list[dict] = field(default_factory=list)
    answers: dict = field(default_factory=dict)
    cursor: int = 0
    mode: str = "manual"
    status: str = "pending"
    per_question: dict = field(default_factory=dict)
    created_at: float = 0.0
    updated_at: float = 0.0
    submitted_at: float | None = None
    # 从磁盘恢复的记录：其 Future 已随旧进程消失，只能被关闭不能作答。
    orphan: bool = False
    # ── 阶段 1 新增 ────────────────────────────────────────────────
    # 单调递增的修订号。前端据此丢弃乱序/重复的广播 —— 没有它，SSE 重连
    # 时的重放与新事件的交错会让界面来回跳。每次写入 state 都 +1。
    rev: int = 0
    # 谁把这份问卷推进到 submitted 的：`user`（人点提交）/ `backend`
    # （看门狗或后端驱动）。排查「问卷自己提交了」时必须能分辨。
    submitted_by: str = ""
    # 上一次「有实质进展」的时间。看门狗看的是它，不是 updated_at ——
    # 前端渲染心跳也会碰 updated_at，拿它判卡死会永远不触发。
    progress_at: float = 0.0
    # 看门狗已释放的原因（空 = 没触发过）。
    watchdog_reason: str = ""
    # ── 跳过原因（用户裁定 2026-11-08 第 1 项）──────────────────────
    # 任何把问卷以「跳过」收掉的来源都往这里写一句**人话**，卡片直接显示它。
    # 与 `watchdog_reason` 的区别：那个只有看门狗会写；这个是统一容器，
    # 覆盖 用户手动跳过 / 中间件超时 / 失效收敛 / 释放阻塞 / 看门狗 五类来源。
    # 必须进 `to_json()` —— `/survey-state` 与 SSE 广播都靠它把原因送到前端。
    skip_reason: str = ""
    # ── 阶段 3 新增 ────────────────────────────────────────────────
    # 这份问卷的生效设置快照（model_id / with_context / model_timeout_sec 等）。
    #
    # 为什么存快照而不是每次现查：后端 `ai` 推进要在**没有页面**的情况下调模型，
    # 而 `resolve_effective` 每次都读文件、还要反查 chat UUID。存快照让推进循环
    # 与"用户当时看到的设置"严格一致 —— 用户中途改设置不该让正在跑的问卷换模型。
    prefs: dict = field(default_factory=dict)
    # ★ 关键：Future 是否**真的**被 resolve 过。
    # 不能用 `status == "submitted"` 判幂等 —— `apply_action("submit")` 会先把
    # status 置成 submitted（前端点提交那一刻），此后 release_survey 若拿它当
    # 判据就会误判"已释放"而**永不唤醒 agent**（2026-11-07 实测踩到，Future
    # 一直挂着，chat 永久 409）。两者是不同的事：state 终态 ≠ agent 被放行。
    released: bool = False

    def to_json(self) -> dict:
        return {
            "tool_call_id": self.tool_call_id,
            "request_id": self.request_id,
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "title": self.title,
            "questions": self.questions,
            "answers": self.answers,
            "cursor": self.cursor,
            "mode": self.mode,
            "status": self.status,
            "per_question": self.per_question,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "submitted_at": self.submitted_at,
            "rev": self.rev,
            "submitted_by": self.submitted_by,
            "progress_at": self.progress_at,
            "watchdog_reason": self.watchdog_reason,
            "skip_reason": self.skip_reason,
            "released": self.released,
        }

    @classmethod
    def from_json(cls, raw: dict) -> "SurveyState":
        return cls(
            tool_call_id=str(raw.get("tool_call_id") or ""),
            request_id=str(raw.get("request_id") or ""),
            session_id=str(raw.get("session_id") or ""),
            agent_id=str(raw.get("agent_id") or ""),
            title=str(raw.get("title") or ""),
            questions=list(raw.get("questions") or []),
            answers=dict(raw.get("answers") or {}),
            cursor=int(raw.get("cursor") or 0),
            mode=str(raw.get("mode") or "manual"),
            status=str(raw.get("status") or "pending"),
            per_question=dict(raw.get("per_question") or {}),
            created_at=float(raw.get("created_at") or 0),
            updated_at=float(raw.get("updated_at") or 0),
            submitted_at=raw.get("submitted_at"),
            rev=int(raw.get("rev") or 0),
            submitted_by=str(raw.get("submitted_by") or ""),
            progress_at=float(raw.get("progress_at") or 0),
            watchdog_reason=str(raw.get("watchdog_reason") or ""),
            skip_reason=str(raw.get("skip_reason") or ""),
            released=bool(raw.get("released")),
            orphan=True,        # 从盘恢复 ⇒ Future 已死
        )

    def snapshot(self) -> dict:
        """影子比对用的「可比较视图」。

        只保留**语义**字段，刻意排除时间戳/请求 id 这类天然不同的量 ——
        否则每次比对都"有差异"，影子比对就失去意义。
        """
        return {
            "cursor": self.cursor,
            "mode": self.mode,
            "status": self.status,
            "answers": self.answers,
            "per_question": self.per_question,
            # ★ `released` 刻意不放进快照：
            # 它是「后端是否为这份问卷 resolve 过 Future」这个**纯后端概念**，
            # 前端从来没有（也不该有）这个概念，放进来会让每次比对都报一条
            # 假差异 `released: backend=False / frontend=None`，把真正有意义的
            # 分歧淹掉（实测：阶段 0 套件从 19/19 掉到 15/19）。
            # 判断"这次 action 是否改了东西"用的是 apply_action 自己的前后
            # 快照对比，那里仍能看到 released 的变化（release 走的是
            # release_survey，本来就无条件广播）。
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
        # Phase 0：恢复后端推进状态。与 pending 不同，state 从盘恢复是安全的
        # —— 它不持有 Future，只是「这份问卷到哪一步了」的记录，恢复后仍可被
        # 新的 action / 影子比对读写。
        self._restore_surveys_locked()

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
            # 唯一 tmp 名（固定名在多进程并发下会互相移走/截断，见 _persist_surveys 注释）
            tmp = _PENDING_FILE.parent / (
                f"{_PENDING_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
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

    # ── Phase 0：后端权威的推进状态（影子比对用，暂不参与裁决）────────
    #
    # 这些方法在阶段 0 里只被 GET /survey-state、POST /survey-action、
    # POST /survey-shadow 使用。**没有任何代码路径会因它们改变问卷行为** ——
    # 前端驱动照旧。这是刻意的：先证明「后端能拿到与前端一致的 state」，
    # 再谈把裁决权搬过来。

    def _surveys(self) -> dict[str, Any]:
        """Return the survey-state table, creating it on a legacy container.

        ★ 必须用这个方法而不是 `self._shared().surveys`：

        `_SharedState` 活在 ``sys.modules`` 里跨插件 reload 存活（这是保住
        pending Future 的关键设计），代价是**给类新增字段时旧实例没有它**。
        而且旧实例引用的还是旧的 *类对象*，所以在类上加 ``__getattr__`` 也救不了
        —— 那个方法定义在新类上，旧实例查不到。

        实测（2026-11-05）：直接 `shared.surveys` → AttributeError → 端点 500，
        而新建实例的单测完全正常。用这个方法把"字段存在性检查"放在**调用点**，
        跨代际才安全。
        """
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("surveys")
        if not isinstance(table, dict):
            table = {}
            try:
                shared.surveys = table
            except Exception:  # noqa: BLE001
                logger.warning("could not materialise surveys table", exc_info=True)
        return table

    def get_survey(self, tool_call_id: str) -> SurveyState | None:
        """Read the state for one card (None when nothing was recorded yet).

        ★ 返回前补齐**新增字段**。
        `_SharedState` 里的 ``SurveyState`` 实例可能是**上一代类**创建的（插件
        reload 时旧实例仍存活）。给类加字段救不了这些已存在的实例 —— 它们的
        ``__dict__`` 里没有那个键，访问就是 AttributeError。

        真机实测（2026-11-07，阶段 3）：加了 ``prefs`` 字段后，第 2、3 题报
        ``AttributeError: 'SurveyState' object has no attribute 'prefs'`` 并被
        标记 ``ai_failed`` 跳过，而第 1 题正常（那是 ``create()`` 新建的实例）。
        这种"有的题好有的题坏"最难查 —— 统一在出口补齐，比在每个调用点写
        ``getattr`` 更可靠，也不容易漏。
        """
        if not tool_call_id:
            return None
        st = self._surveys().get(tool_call_id)
        if st is None:
            return None
        for name, default in _STATE_FIELD_DEFAULTS.items():
            if not hasattr(st, name):
                try:
                    setattr(st, name, default() if callable(default) else default)
                except Exception:  # noqa: BLE001 — 补齐失败不能影响读取
                    pass
        return st

    def upsert_survey(self, state: SurveyState) -> SurveyState:
        """Insert or replace the whole state (used by the shadow report)."""
        if not state.tool_call_id:
            return state
        state.updated_at = time.time()
        self._surveys()[state.tool_call_id] = state
        self._persist_surveys()
        return state

    def ensure_survey(
        self, tool_call_id: str, **fields: Any,
    ) -> SurveyState:
        """Create the state on first touch, then merge ``fields``.

        问卷创建时就调它，于是后续任何一条 action / shadow 都不会因为
        「先到的写入者不知道题面」而丢掉 questions。
        """
        cur = self.get_survey(tool_call_id)
        if cur is None:
            cur = SurveyState(tool_call_id=tool_call_id, created_at=time.time())
        for k, v in fields.items():
            if v is not None and hasattr(cur, k):
                setattr(cur, k, v)
        cur.updated_at = time.time()
        self._surveys()[tool_call_id] = cur
        self._persist_surveys()
        return cur

    def apply_action(
        self, tool_call_id: str, action: str, payload: dict,
        origin: str = "",
    ) -> SurveyState | None:
        """Record one user action into the state.

        ★ 阶段 1（2026-11-07 用户裁定）：**state 权威整体后移** —— answers /
        cursor / mode 全部以后端为唯一真值，前端只渲染并发 action。

        为什么范围要从「只搬 manual 提交」扩大：实测发现 `submit_answer()`
        本来就靠 `self._pending.pop()` 天然幂等（双开同点提交只会 resolve 一次），
        所以「提交裁决」搬过来对双开毫无改善 —— 真正的竞争在 **answers 本身**：
        两个窗口各持一份、靠 localStorage storage 事件互抄，于是出现「在推荐和
        自动之间来回切」。只有让答案只有一个副本，双开才真的只有一个结果。

        state 不存在时**自动创建**：前端可能比后端先动（问卷刚弹出、state 还没
        落），若这里返回 None，前端就永远拿不到基线。
        """
        st = self.get_survey(tool_call_id)
        if st is None:
            if not tool_call_id:
                return None
            st = SurveyState(tool_call_id=tool_call_id, created_at=time.time())
        # 记录进入前的快照，用于判断这次 action 是否真的改了东西。
        # 非法输入（未知 action / 非法 mode / 空 key）必须**不广播** ——
        # 否则每次误调用都会让所有标签页重渲染一遍，且修订号被噪声推高，
        # 前端基于 rev 的乱序丢弃逻辑会失去意义。
        before = json.dumps(st.snapshot(), sort_keys=True, ensure_ascii=False)
        if action == "set_answer":
            key = str(payload.get("key") or "")
            ans = payload.get("answer")
            if key and isinstance(ans, dict):
                st.answers[key] = ans
        elif action == "skip":
            key = str(payload.get("key") or "")
            if key:
                cur = dict(st.answers.get(key) or {})
                cur.update({"type": cur.get("type") or "single", "value": "",
                            "other": "", "skipped": True})
                if payload.get("by"):
                    cur["skipped_by"] = str(payload["by"])
                st.answers[key] = cur
        elif action == "goto":
            try:
                st.cursor = max(0, int(payload.get("cursor") or 0))
            except (TypeError, ValueError):
                pass
        elif action == "set_mode":
            mode = str(payload.get("mode") or "")
            if mode in ("ai", "recommend", "manual"):
                st.mode = mode
        elif action == "submit":
            st.status = "submitted"
            st.submitted_at = time.time()
            st.submitted_by = str(payload.get("by") or "user")
            if isinstance(payload.get("answers"), dict):
                st.answers = dict(payload["answers"])
        elif action == "set_analysis":
            try:
                idx = int(payload.get("index"))
            except (TypeError, ValueError):
                idx = -1
            if idx >= 0 and isinstance(payload.get("result"), dict):
                st.per_question[str(idx)] = payload["result"]
        elif action == "cancel_analysis":
            # ★ 用户在卡片上点「停止分析」时要**真正**停掉后端的分析。
            #
            # 为什么需要这个 action（2026-11-07 用户实测）：
            #   卡片上的「停止分析」只中止**前端那次** `POST /analyze`
            #   （AbortController）。但阶段 3 起 ai 分析由**后端 runner** 发起，
            #   它在 `await analyze_survey(...)` 里跑，前端 abort 根本触达不到。
            #   结果：用户以为停了，实际后端还在烧模型配额，且 runner 仍 park
            #   在那次调用上 —— 切模式时又因为「旧 task 未完成」而起不来新模式
            #   （见 `_sync_runners`）。
            #
            # 语义：取消当前在飞的分析任务，然后**按当前 mode 重新同步 runner**
            #   · ai 模式 → 重新起一个 runner（会重新分析当前题）
            #   · recommend 模式 → 若原本能推进就继续推进（推荐是即时的）
            #   · manual → 停掉 runner，什么都不做
            # 不改 answers/cursor/mode，所以 in-flight 的分析结果即使已落定也
            # 不会覆盖用户后续手填的内容（答案只在 runner 填的那一刻写入）。
            self.stop_runner(tool_call_id)
            # 让 progress_at 前进，避免看门狗把「用户主动操作」误判成卡死
            st.progress_at = time.time()
            self._surveys()[tool_call_id] = st
            self._persist_surveys()
            self._bump_rev(tool_call_id, st, action, origin)
            self._sync_runners(tool_call_id)
            logger.info("runner:cancel-analysis %s mode=%s",
                        tool_call_id[:16], st.mode)
            return st
        st.updated_at = time.time()
        # 只有「实质进展」才推进 progress_at —— 看门狗看的是它。
        # 渲染心跳（前端反复上报同一份 state）不该让卡死的问卷看起来还活着。
        if action in ("set_answer", "skip", "goto", "submit", "set_analysis"):
            st.progress_at = st.updated_at
        self._surveys()[tool_call_id] = st
        self._persist_surveys()
        after = json.dumps(st.snapshot(), sort_keys=True, ensure_ascii=False)
        if after != before:
            self._bump_rev(tool_call_id, st, action, origin)
            # 阶段 2：模式切到 recommend → 启动后端推进；切走 / 提交 → 停。
            # 放在 `if after != before` 里面：无效 action 不会无谓地起停任务。
            if action in ("set_mode", "submit", "set_answer", "skip",
                          "set_analysis"):
                self._sync_runners(tool_call_id)
        return st

    # ── 阶段 1：看门狗（只盯自动模式）────────────────────────────────
    #
    # 用户裁定（2026-11-07）：手动释放 + 看门狗超时，60 秒无进展释放。
    # 但「60 秒无进展」对 manual 模式是错的判据 —— 人工作答本来就会停顿，
    # 强制释放等于替用户交卷（违反上一轮「manual 无页面时保持等待」的裁定）。
    # 故：watchdog 只回收「本该自己动、却不动了」的问卷，即 ai / recommend。

    # ── 阶段 2：recommend 后端推进（关掉所有页面也走完）────────────────
    #
    # 用户裁定（2026-11-07）：
    #   q0 recommend 模式下前端驱动**自动让位**，只渲染；SSE 断开才退回本地
    #   q1 **逐个推进并每步广播**（前端能看到逐题过程，与今天行为一致）
    #   q2 复用 per_question 已有缓存（不调模型，仍是零模型调用）
    #
    # 为什么必须搬到后端：阶段 1 只把 state 搬到后端，但**推进动作仍由前端
    # effect 发出** —— 页面一关，没人发 action，问卷就停在那里。用户的诉求
    # 是「关掉会话窗口它继续推进」，只有后端自己会动才成立。

    def _runners(self) -> dict[str, Any]:
        """Runner task 表（跨实例共享，见 `_SharedState`）。"""
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("survey_runners")
        if not isinstance(table, dict):
            table = {}
            shared.survey_runners = table
        return table

    def _prune_stale_runners(self) -> None:
        """清掉**上一代代码**留下的 runner task。

        ★ 为什么必须清（2026-11-07 实测事故）：
          `_SharedState` 让 runner 表跨插件 reload 存活，于是旧实例创建的
          `asyncio.Task` 仍在这个表里。它们跑的是**旧版的代码对象** ——
          比如旧版 `_persist_surveys` 用固定的 `<name>.tmp` 文件名。

          实测后果：重载后 `runners_live` 报 **9**，而实际 pending 只有 5 份。
          多出来的 4 个旧 task 在后续 persist 时与新版并发写同一个 tmp 名，
          导致 `survey_states.json` **整个文件消失**（只能从备份恢复）。

          这类"僵尸 task 跑旧代码"极难归因：磁盘上的代码是新的、日志正常、
          但行为像旧版。必须主动清掉。

        判据：只保留 `not done()` 且**其 tool_call_id 仍在 pending** 的；
        其余一律 cancel（它们要么已结束，要么对应问卷早已不在待答状态）。
        """
        table = self._runners()
        try:
            surveys = self._surveys()
        except Exception:  # noqa: BLE001
            return
        total = len(table)
        alive = 0
        for tcid, task in list(table.items()):
            st = surveys.get(tcid)
            keep = (task is not None and not task.done()
                    and st is not None and st.status == "pending")
            if keep:
                alive += 1
                continue
            table.pop(tcid, None)
            try:
                if task is not None and not task.done():
                    task.cancel()
            except Exception:  # noqa: BLE001
                pass
        logger.info("runner:prune kept=%d dropped=%d", alive, total - alive)

    def ensure_runner(self, tool_call_id: str) -> None:
        """Start the driver loop for this survey if not already running.

        创建的 task 上会打 `_qm_mode` 标记（当前模式快照），供 `_sync_runners`
        判断「这个 task 是否符合现在的模式」。没有它就只能知道「有个 task 在跑」，
        无法区分它是按 ai 逻辑还是 recommend 逻辑在跑 —— 那正是
        「切到只用推荐后不推进」的成因之一（见 `_sync_runners` 的注释）。
        """
        if not tool_call_id:
            return
        table = self._runners()
        cur = table.get(tool_call_id)
        if cur is not None and not cur.done():
            return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        st = self.get_survey(tool_call_id)
        task = loop.create_task(self._runner_loop(tool_call_id))
        # `asyncio.Task` 不允许直接 setattr 任意属性（某些版本会抛 AttributeError），
        # 故用 try 包住 —— 标记只是优化，失败就退化成「重启一次」。
        try:
            task._qm_mode = getattr(st, "mode", None)  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass
        table[tool_call_id] = task

    def stop_runner(self, tool_call_id: str) -> None:
        """Stop the recommend driver for this survey.

        ★ 不能 cancel **自己**：runner 走完会调 `submit_answer()` → 这里 →
        若把自己 cancel 掉，CancelledError 会在那一刻插进 `_runner_submit`
        的 await 点，把它标记成"被取消"而不是"正常完成"，日志和后续诊断都
        会被误导。让它自然 return 即可。
        """
        task = self._runners().pop(tool_call_id, None)
        if task is None or task.done():
            return
        try:
            current = asyncio.current_task()
        except RuntimeError:
            current = None
        if task is current:
            return              # 自己请求停止 → 交给循环里的 return 自行收尾
        task.cancel()

    async def _runner_loop(self, tool_call_id: str) -> None:
        """Drive an automated survey one question at a time.

        两种自动模式共用这一个骨架，差别只在**推荐从哪来**：

        ==========  ============================  ==========  ==========
        模式        推荐来源                      耗时        失败概率
        ==========  ============================  ==========  ==========
        recommend   出题时自带的 `recommended`    毫秒级      几乎为零
        ai          现场调模型分析当前题           7-12 秒/题  有（429/超时）
        ==========  ============================  ==========  ==========

        所以「填入 / 归一化 / 推进 / 广播」全部共用，只有取推荐那一步分叉。

        每步之间 ``await asyncio.sleep(0)`` 让出事件循环：SSE 订阅者能逐题
        收到广播，界面表现与前端驱动一致（用户裁定 q1）。
        """
        # 引擎通过模块级入口加载（见 `_load_recommend_engine`）—— 自检端点
        # 与这里走**同一条**路径，所以 `/engine-status` 报的可用性就是真实情况。
        try:
            rec = _load_recommend_engine()
        except Exception:  # noqa: BLE001
            logger.warning("recommend engine unavailable; runner disabled",
                           exc_info=True)
            return
        total_ai_attempts = 0
        logger.info("runner:start %s mode=%s", tool_call_id[:16],
                    getattr(self.get_survey(tool_call_id), "mode", "?"))
        try:
            while True:
                st = self.get_survey(tool_call_id)
                if st is None or st.status != "pending" or st.orphan:
                    logger.info("runner:stop %s (state gone / not pending: %s)",
                                tool_call_id[:16],
                                None if st is None else st.status)
                    return
                if st.mode not in ("recommend", "ai"):
                    logger.info("runner:stop %s (mode switched to %s)",
                                tool_call_id[:16], st.mode)
                    return

                # 本轮要处理的题号。两个分支各自赋值，日志统一用它。
                #
                # ★ 不能用 `step` 或 `tgt` 直接写日志（真实崩溃，2026-11-07）：
                # `step` 只在 recommend 分支定义，`tgt` 只在 ai 分支定义。
                # 而日志里那句三元表达式 `step.get(...) if st.mode == "recommend"`
                # 在**切模式之后**会取错分支：旧迭代从 ai 进来（step 未定义），
                # 用户切到 recommend，走到日志时 st.mode 已是 "recommend" →
                # 去取从未赋值的 step → `UnboundLocalError`，**runner 直接崩**。
                # 表现为「切到只用推荐后问卷彻底不动」，且日志只有一行
                # "survey runner crashed"，看不出跟切模式有关。
                step = None
                tgt = None
                qidx: int | None = None

                if st.mode == "recommend":
                    step = rec.step_once({
                        "questions": st.questions,
                        "answers": st.answers,
                        "cursor": st.cursor,
                        "per_question": st.per_question,
                    })
                    if step is None:
                        # 无剩余可推进步骤。记下**为什么**——否则「问卷不动」
                        # 只能靠猜（本轮之前这里静默 return，实测排查时完全
                        # 没有线索）。
                        logger.info(
                            "runner:stop %s (recommend step=None; cursor=%s ans=%s vis=%s)",
                            tool_call_id[:16], st.cursor, len(st.answers or {}),
                            _vis_desc(st),
                        )
                        return
                    if step.get("done"):
                        await self._runner_submit(tool_call_id)
                        return
                    if step.get("answer") is not None:
                        st.answers = rec.prune_hidden(
                            st.questions,
                            {**st.answers,
                             f"q{step['question_index']}": step["answer"]},
                        )
                    st.cursor = int(step.get("cursor") or 0)
                    qidx = step.get("question_index")
                    kind = "runner:skip" if step.get("skipped") else "runner:fill"
                else:
                    # ── ai：先分析，再填 ────────────────────────────────
                    tgt = rec.next_ai_target({
                        "questions": st.questions,
                        "answers": st.answers,
                        "cursor": st.cursor,
                    })
                    if tgt is None:
                        logger.info(
                            "runner:stop %s (ai target=None; cursor=%s ans=%s vis=%s)",
                            tool_call_id[:16], st.cursor, len(st.answers or {}),
                            _vis_desc(st),
                        )
                        return
                    if tgt.get("done"):
                        await self._runner_submit(tool_call_id)
                        return
                    qidx = tgt.get("index")
                    if tgt.get("skip_forward"):
                        # 这道题已有答案（用户手答过）→ 不分析、不覆盖，只前进
                        st.cursor = int(tgt["cursor"]) + 1
                        kind = "runner:forward"
                    elif tgt.get("human_skip"):
                        # ── D4：观察题，自动模式必须跳过（不调模型）──
                        # 用户裁定 q1=A：继续推进并最终自动提交；该题留空，
                        # `skipped_by="requires_human"` 让摘要标注为
                        # 「AI 跳过（需人工观察）」而不是冒充「用户跳过」。
                        # 不调模型也是裁定的一部分意图：注定跳过的题没必要
                        # 烧配额（逐题分析 7-12 秒且有限流风险）。
                        _q = st.questions[tgt["index"]]
                        st.answers = rec.prune_hidden(
                            st.questions,
                            {**st.answers, f"q{tgt['index']}": {
                                "type": rec.q_type(_q),
                                "value": [], "other": "",
                                "skipped": True,
                                "skipped_by": "requires_human",
                                "at": time.time(),
                            }},
                        )
                        st.cursor = int(tgt["cursor"]) + 1
                        kind = "runner:human-skip"
                        logger.info(
                            "runner:human-skip %s q%s (观察题，不调模型)",
                            tool_call_id[:16], tgt["index"],
                        )
                    else:
                        # ★ 计数口径必须是**真实模型调用次数**，不是"处理了几题"。
                        #
                        # 第一版在外层每道题只 +1，而 `_ai_analyse_one` 内部会
                        # 重试 1 次 —— 于是"上限 10 次"实际会打出 16+ 次调用，
                        # 用户裁定的"不烧无限额度"落空（verify_phase3 实测抓到）。
                        # 现在把预算传进去，由内层按每次真实调用扣减。
                        answer, analysis, used, exhausted = await self._ai_analyse_one(
                            tool_call_id, st, tgt["index"], rec,
                            budget=rec.AI_MAX_TOTAL_ATTEMPTS - total_ai_attempts,
                        )
                        total_ai_attempts += used
                        if exhausted:
                            # 预算用完 → 停摆交给用户（用户裁定 q2）。
                            # 绝不无限重试：限流时会把配额烧干，而用户看到的只是
                            # "问卷一直不动"，没人知道正在被烧。
                            st.watchdog_reason = (
                                f"AI 分析累计尝试已达 "
                                f"{rec.AI_MAX_TOTAL_ATTEMPTS} 次，已停止自动推进"
                            )
                            st.skip_reason = st.watchdog_reason
                            st.progress_at = time.time()
                            self._surveys()[tool_call_id] = st
                            self._persist_surveys()
                            self._bump_rev(tool_call_id, st, "runner:giveup")
                            return
                        if analysis is not None:
                            st.per_question = {
                                **(st.per_question or {}),
                                str(tgt["index"]): analysis,
                            }
                        st.answers = rec.prune_hidden(
                            st.questions,
                            {**st.answers, f"q{tgt['index']}": answer},
                        )
                        st.cursor = int(tgt["cursor"]) + 1
                        kind = ("runner:skip" if answer.get("skipped")
                                else "runner:fill")

                st.updated_at = time.time()
                st.progress_at = st.updated_at      # 免被看门狗误判卡死
                self._surveys()[tool_call_id] = st
                self._persist_surveys()
                self._bump_rev(tool_call_id, st, kind)
                logger.info(
                    "runner:%s %s q%s cursor=%s ans=%s",
                    kind.split(":", 1)[-1], tool_call_id[:16],
                    qidx, st.cursor, len(st.answers or {}),
                )
                await asyncio.sleep(0)              # 让订阅者先收到这一步
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 — 驱动异常绝不能拖垮问卷
            logger.warning("survey runner crashed for %s",
                           tool_call_id[:16], exc_info=True)

    async def _ai_analyse_one(
        self, tool_call_id: str, st, real_idx: int, rec, budget: int = 10,
    ) -> tuple[dict, dict | None, int, bool]:
        """分析一道题并返回 ``(answer, analysis_or_None)``。

        失败策略（用户裁定 q1）：**重试 1 次**，仍失败就标记跳过继续下一题 ——
        不卡住整卷（2026-11-04 教训：停下等 = 整卷卡死，是更糟的失败形态）。

        但整卷还有一个**总尝试上限**（`AI_MAX_TOTAL_ATTEMPTS`），由调用方控制，
        因为"每题都失败"时逐题重试仍然会把配额烧干。
        """
        # ★ 必须用 getattr 兜底，不能直接 `st.prefs`。
        #
        # `SurveyState` 是 dataclass，而 `_SharedState` 里的旧实例（跨插件 reload
        # 存活）**没有新加的字段** —— 给类加字段救不了已存在的实例，因为它们的
        # `__dict__` 里根本没这个键。真机实测（2026-11-07）：
        #   AttributeError: 'SurveyState' object has no attribute 'prefs'
        # 表现为第 2、3 题被判 `ai_failed` 跳过，而第 1 题正常 —— 因为第 1 题
        # 走的是 `create()` 新建的实例。这种"看起来像随机失败"的现象最难查。
        _prefs: dict = getattr(st, "prefs", None) or {}
        last_err = ""
        used = 0
        for attempt in range(rec.AI_MAX_ATTEMPTS_PER_QUESTION):
            if used >= budget:
                # 整卷预算已耗尽 → 不再发起调用，交由调用方停摆
                break
            used += 1
            try:
                # 与 plugin.py 的 `analyze-request: ... via=analyze-http` 对照：
                # 这里是**后端 runner 自己**发起的分析。同一 tool_call_id + 同一题
                # 若同时出现两行（via=runner 和 via=analyze-http），就是重复分析。
                logger.info("analyze-request: tcid=%s q=%s (via=runner)",
                            tool_call_id[:24], real_idx)
                res = await _load_analysis_engine().analyze_survey(
                    questions=st.questions,
                    title=st.title or "",
                    model_id=str(_prefs.get("model_id") or ""),
                    with_context=bool(_prefs.get("with_context")),
                    session_id=st.session_id,
                    agent_id=st.agent_id,
                    question_index=real_idx,
                    answers=st.answers or {},
                    timeout_sec=float(_prefs.get("model_timeout_sec") or 0),
                )
                per = (res or {}).get("per_question") or []
                mine = per[0] if per else None
                if mine and not mine.get("failed") and mine.get("choice"):
                    return rec.apply_choice(
                        st.questions, real_idx, str(mine["choice"]).strip(),
                    ), mine, used, False
                last_err = (res or {}).get("error") or "模型未返回有效推荐"
            except asyncio.CancelledError:
                raise
            except Exception as e:  # noqa: BLE001
                last_err = f"{type(e).__name__}: {e}"
            logger.warning(
                "ai analysis attempt %d/%d failed for %s#q%d: %s",
                attempt + 1, rec.AI_MAX_ATTEMPTS_PER_QUESTION,
                tool_call_id[:12], real_idx, last_err,
            )
        # 两次都失败 → 标记跳过（不卡整卷），并把原因写进答案便于排查
        ans = rec.apply_choice(st.questions, real_idx, "")
        ans["skipped_by"] = "ai_failed"
        ans["ai_error"] = last_err[:200]
        # `used == 0` 表示一次都没敢调（预算已被前面的题吃光）—— 这种情况
        # 交回 `exhausted=True`，让调用方停摆而不是继续标记跳题。
        exhausted = (used == 0)
        return ans, None, used, exhausted

    async def _runner_submit(self, tool_call_id: str) -> None:
        """Submit a survey the runner finished, carrying the real answers."""
        st = self.get_survey(tool_call_id)
        if st is None or st.status == "submitted":
            return
        logger.info("runner:submit %s q=%d",
                    tool_call_id[:16], len(st.answers or {}))
        pq = await self.get_by_tool_call(tool_call_id)
        payload = st.answers or {}
        if pq is not None:
            # 走 submit_answer：它是**唯一**带答案唤醒 agent 的通道。
            # 不能走 skip（那会让 agent 收到 {"skipped": true} 而答案全丢）。
            # by="backend"：这是后端 runner 答的，不是人答的（见 submit_answer
            # 的 by 参数说明）；不传就会落成 "user"，让 AI 代答冒充真人作答。
            await self.submit_answer(pq.request_id, payload, by="backend")
        else:
            st.status = "submitted"
            st.submitted_by = "backend"
            st.submitted_at = time.time()
            st.updated_at = st.submitted_at
            self._surveys()[tool_call_id] = st
            self._persist_surveys()
            self._bump_rev(tool_call_id, st, "runner:submit")

    def _sync_runners(self, tool_call_id: str) -> None:
        """Reconcile the runner task with the survey's current mode.

        ★ 换模式时必须**先停旧 runner 再起新的**，不能只看「有没有活的」。

        真实缺陷（2026-11-07 用户实测复现）：
          用户在 ai 模式下点「停止分析」，然后切到「只用推荐」。
          旧写法走 `ensure_runner`，而它开头是:
              cur = table.get(tool_call_id)
              if cur is not None and not cur.done(): return   # ← 直接跳过
          此时旧 runner 仍 **park 在 `await analyze_survey(...)`** 上（慢模型
          8-12 秒），于是「只用推荐」根本起不来 —— 用户看到的是「切了也不动」，
          必须等那次 ai 分析自然结束才有反应。实测：切后 3 秒零推进，
          9.2 秒后才动第一题。

          更隐蔽的是：那句 `return` 让新模式的推进**完全丢失**，而界面上的
          mode 已经显示成「只用推荐」，看起来像功能坏了。

        修法：mode 变了就把旧的取消掉再起一个。取消是安全的 ——
        `stop_runner` 明确「不 cancel 自己」，且 `_runner_loop` 里
        `except CancelledError: raise` 会把取消传播进在飞的模型调用
        （这正是用户想要的：切走就不要再烧那次分析的配额）。
        """
        st = self.get_survey(tool_call_id)
        if st is None:
            return
        want_run = (st.mode in ("recommend", "ai")
                    and st.status == "pending" and not st.orphan)
        table = self._runners()
        cur = table.get(tool_call_id)
        alive = cur is not None and not cur.done()

        if not want_run:
            self.stop_runner(tool_call_id)
            return

        # 记录 runner 启动时的 mode 快照，用于判断「模式变了要重启」。
        #
        # 为什么需要它：`ensure_runner` 只保证「有一个 task 在跑」，而旧 task
        # 是按**旧模式**的逻辑在跑（ai 分支 park 在模型上）。模式一换，
        # 旧 task 不能代表新模式，必须换掉。
        want_mode = st.mode
        running_mode = getattr(cur, "_qm_mode", None) if cur is not None else None
        if cur is not None and running_mode is None:
            # 旧代码创建的 task 没有 mode 标记 → 无法证明它符合当前模式，
            # 保守起见重启（代价只是一次 task 重建，远小于「切了不动」）。
            running_mode = "__unknown__"

        if alive and running_mode == want_mode:
            return                      # 同模式且还活着 → 无需动作

        if alive:
            logger.info(
                "runner:restart %s (%s -> %s)",
                tool_call_id[:16], running_mode, want_mode,
            )
            self.stop_runner(tool_call_id)
        self.ensure_runner(tool_call_id)

    def _watchdogs(self) -> dict[str, Any]:
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("survey_watchdogs")
        if not isinstance(table, dict):
            table = {}
            shared.survey_watchdogs = table
        return table

    def ensure_watchdog(self, tool_call_id: str) -> None:
        """Start a watchdog for this survey if one is not already running."""
        if not tool_call_id:
            return
        table = self._watchdogs()
        if tool_call_id in table:
            cur = table.get(tool_call_id)
            if cur is not None and not cur.done():
                return
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return          # 没有事件循环（纯同步上下文）→ 无看门狗，不报错
        table[tool_call_id] = loop.create_task(
            self._watchdog_loop(tool_call_id),
        )

    def stop_watchdog(self, tool_call_id: str) -> None:
        task = self._watchdogs().pop(tool_call_id, None)
        if task is not None and not task.done():
            task.cancel()

    async def _watchdog_loop(self, tool_call_id: str) -> None:
        """Release a survey whose AUTOMATED driver stopped making progress."""
        try:
            while True:
                await asyncio.sleep(_SURVEY_WATCHDOG_TICK)
                st = self.get_survey(tool_call_id)
                if st is None:
                    return
                if st.status != "pending" or st.orphan:
                    return
                if st.mode not in ("ai", "recommend"):
                    # 用户随时可能把模式切回自动，所以不要退出循环 —— 只是本轮
                    # 不判卡死。切回自动后从那一刻起重新计时（见下面的基线）。
                    st.progress_at = time.time()
                    continue
                now = time.time()
                base = st.progress_at or st.created_at or now
                idle = now - base
                if idle < _SURVEY_WATCHDOG_SEC:
                    continue
                # 看着像卡死 → 真的释放它（resolve Future），并明确告知模型。
                st.watchdog_reason = (
                    f"自动推进 {int(idle)}s 无进展，已自动释放"
                )
                logger.warning(
                    "survey watchdog released %s after %.0fs idle (mode=%s)",
                    tool_call_id[:16], idle, st.mode,
                )
                # 把原因一并交给 release_survey → skip() 会写进 Future payload
                # 与 SurveyState.skip_reason，卡片和模型才能看到「为什么」。
                # 不传的话原因只留在 watchdog_reason，前端卡片读不到。
                await self.release_survey(
                    tool_call_id, "watchdog", reason=st.watchdog_reason,
                )
                return
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 — 看门狗自身绝不能拖垮问卷
            logger.warning("survey watchdog crashed for %s",
                           tool_call_id[:16], exc_info=True)

    async def release_survey(
        self, tool_call_id: str, by: str = "user", origin: str = "",
        reason: str = "",
    ) -> bool:
        """Resolve the parked agent for this survey and mark it submitted.

        ★ 幂等靠 `st.released` 而不是 `st.status`：前者表示"Future 真被放行过"，
        后者只是"state 语义上终态了"。两者会在正常路径上分离 ——
        前端点提交时先 `apply_action("submit")`（status 立刻变 submitted），
        再调 release 去唤醒 agent。若用 status 判幂等，第二步会被误判成
        "已经释放过了"直接返回 False，于是 **Future 永不 resolve，chat 永久 409**
        （2026-11-07 实测：`release 成功` 断言失败 + `Future 已 resolve` 失败）。

        ★ 即使 state 不存在也要尝试唤醒：问卷可能因 reload 丢了 state 但
        pending 记录还在。先 resolve，再补 state，顺序不能反。
        """
        st = self.get_survey(tool_call_id)
        if st is not None and st.released:
            return False            # 真的放行过了 → 幂等返回
        pq = await self.get_by_tool_call(tool_call_id)

        if pq is not None:
            try:
                # ★ 把释放者与原因一并交给 skip()，让它写进回传给模型的
                #   payload（用户裁定 2026-11-08 第 1 项）。此前这里只传
                #   request_id，`by`/原因在释放那一刻被丢弃，卡片与模型都
                #   只能看到「跳过」，无从判断是谁、为什么。
                _reason = str(reason or "") or (
                    (st.watchdog_reason if st is not None else "") or "")
                await self.skip(pq.request_id, reason=_reason, by=by or "user")
            except Exception:  # noqa: BLE001
                logger.debug("release skip failed", exc_info=True)

        now = time.time()
        if st is None:
            if not tool_call_id:
                return pq is not None
            st = SurveyState(tool_call_id=tool_call_id, created_at=now)
        st.status = "submitted"
        st.submitted_by = str(by or "user")
        # 用与 skip() 同一个 _reason（可能来自 st.watchdog_reason 兜底），
        # 否则 watchdog 不显式传 reason 时卡片仍看不到「为什么」。
        if _reason:
            st.skip_reason = _reason
        st.submitted_at = st.submitted_at or now
        st.updated_at = now
        st.progress_at = now
        st.released = True
        self._surveys()[tool_call_id] = st
        self._persist_surveys()
        self._bump_rev(tool_call_id, st, f"release:{by}", origin)
        self.stop_watchdog(tool_call_id)
        return True

    #
    # 完全复刻宿主 `app/task_tracker.py` 的做法，因为那边的语义已经被验证过：
    #   · 每个订阅者一个 asyncio.Queue（慢订阅者不会拖住写入方）
    #   · 保留一份 buffer，新订阅者（刷新 / 第二个标签页 / 断线重连）先重放
    #   · 断开只摘队列，**不停**问卷 —— 这正是"关掉窗口仍在推进"的机制前提
    #
    # 与宿主的差异：问卷不需要单独的后台 producer 协程（阶段 1 的推进仍由
    # action 驱动），所以这里只做「写入即广播」。

    def _subs(self) -> dict[str, list[Any]]:
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("survey_subs")
        if not isinstance(table, dict):
            table = {}
            shared.survey_subs = table
        return table

    def _events(self) -> dict[str, list[dict]]:
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("survey_events")
        if not isinstance(table, dict):
            table = {}
            shared.survey_events = table
        return table

    def _revs(self) -> dict[str, int]:
        shared = self._shared()
        table = getattr(shared, "__dict__", {}).get("survey_rev")
        if not isinstance(table, dict):
            table = {}
            shared.survey_rev = table
        return table

    def subscribe(self, tool_call_id: str) -> tuple[asyncio.Queue, list[dict]]:
        """Register a subscriber; returns its queue plus the replay buffer.

        重放 buffer 让「刷新页面」和「开第二个标签页」都不必先等下一次变更：
        连上的瞬间就能把当前进度补齐，然后只靠增量推进。
        """
        q: asyncio.Queue = asyncio.Queue()
        self._subs().setdefault(tool_call_id, []).append(q)
        replay = list(self._events().get(tool_call_id, []))[-_SURVEY_EVENT_BUFFER:]
        return q, replay

    def unsubscribe(self, tool_call_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscriber. Idempotent, like the host's detach."""
        subs = self._subs().get(tool_call_id)
        if not subs:
            return
        try:
            subs.remove(queue)
        except ValueError:
            pass
        if not subs:
            self._subs().pop(tool_call_id, None)

    def _bump_rev(
        self, tool_call_id: str, st: SurveyState, action: str,
        origin: str = "",
    ) -> None:
        """Advance the revision counter and broadcast one change event.

        ``origin`` 是发起这次变更的标签页 id（前端传入）。它让前端能区分
        「这是我刚做的操作的回声」和「另一个标签页改的」：

        · 回声 → 只同步 rev，**不覆盖本地 state**。否则用户正在输入框里打字，
          SSE 回来的旧值会把刚敲的字冲掉、光标跳到行首。
        · 别人改的 → 覆盖本地 state（这正是多标签一致性的来源）。

        没有这个字段就只能靠「本地是否 busy」猜，而猜错的代价是丢用户输入。
        """
        revs = self._revs()
        nxt = int(revs.get(tool_call_id, 0)) + 1
        revs[tool_call_id] = nxt
        st.rev = nxt
        # 旧代际实例的 to_json() 没有 skip_reason，增量广播会漏掉原因；
        # 补一次，保证双开另一屏与 /survey-state 看到同一份数据。
        try:
            _skip = str(getattr(st, "skip_reason", "") or "")
        except Exception:  # noqa: BLE001
            _skip = ""
        event = {
            "rev": nxt,
            "action": action,
            "at": time.time(),
            "origin": str(origin or ""),
            "state": {**st.to_json(), "skip_reason": _skip},
        }
        buf = self._events().setdefault(tool_call_id, [])
        buf.append(event)
        if len(buf) > _SURVEY_EVENT_BUFFER:
            del buf[: len(buf) - _SURVEY_EVENT_BUFFER]
        for q in list(self._subs().get(tool_call_id) or []):
            try:
                q.put_nowait(event)
            except Exception:  # noqa: BLE001 — 慢订阅者不能拖住写入方
                logger.debug("survey broadcast dropped a subscriber", exc_info=True)

    def current_rev(self, tool_call_id: str) -> int:
        return int(self._revs().get(tool_call_id, 0))

    def compare_shadow(
        self, tool_call_id: str, reported: dict,
    ) -> dict:
        """Diff the frontend's idea of the state against the backend's.

        阶段 0 的语义是「镜像 + 比对」：
          · 后端还没有这条记录 → 用前端上报的 state **建立基线**，
            然后返回 ``adopted: True``（这不是差异，是第一次对齐）
          · 后端已有记录 → 逐字段比对；**无论一致与否都用前端值覆盖**
            （阶段 0 前端是权威，后端只是镜像；到阶段 1 才反过来）

        ★ 为什么必须写入而不是只比对：如果不镜像，后端永远只知道
        「问卷创建时那一刻」的状态（甚至什么都不知道），后续所有比对都会
        报 ``not_recorded`` —— 那影子比对就成了一条只会刷日志的死通道。
        实测（2026-11-05）就是这个结果：3 条差异全是 not_recorded，
        而后端 state 里连用户点的答案都没有。
        """
        st = self.get_survey(tool_call_id)
        first = st is None
        if first:
            st = SurveyState(tool_call_id=tool_call_id, created_at=time.time())

        def _norm_field(name: str, value: Any) -> Any:
            # 只保留"有意义"的答案，抹掉前后端对空值的不同表示
            if name == "answers" and isinstance(value, dict):
                return {k: v for k, v in value.items() if _ans_meaningful(v)}
            if name == "per_question" and isinstance(value, dict):
                return {str(k): v for k, v in value.items() if isinstance(v, dict)}
            return value

        diffs: list[dict] = []
        if not first:
            mine = st.snapshot()
            for k, want in mine.items():
                got = reported.get(k)
                w = _norm_field(k, want)
                g = _norm_field(k, got)
                if w != g:
                    diffs.append({"field": k, "backend": w, "frontend": g})

        # 镜像（阶段 0：前端权威）
        try:
            if reported.get("cursor") is not None:
                st.cursor = max(0, int(reported["cursor"]))
            mode = str(reported.get("mode") or st.mode)
            if mode in ("ai", "recommend", "manual"):
                st.mode = mode
            status = str(reported.get("status") or st.status)
            if status in ("pending", "submitted", "skipped"):
                st.status = status
            if isinstance(reported.get("answers"), dict):
                st.answers = dict(reported["answers"])
            if isinstance(reported.get("per_question"), dict):
                st.per_question = {str(k): v for k, v in reported["per_question"].items()}
            st.updated_at = time.time()
            self._surveys()[tool_call_id] = st
            self._persist_surveys()
        except Exception:  # noqa: BLE001
            logger.warning("could not mirror shadow state", exc_info=True)

        return {"match": not diffs, "diffs": diffs, "adopted": first}

    def record_shadow_diff(self, tool_call_id: str, result: dict) -> None:
        """Append one shadow diff to disk (bounded; silent on failure).

        ★ 阶段 0 里什么才算「值得记录的差异」（2026-11-05 实测后修正）：

        后端此时是**镜像** —— 每次比对完就用前端值覆盖自己。于是
        cursor / answers / mode / status / per_question 这些「前端会主动推进」
        的字段，必然在每条新上报里短暂落后一版。那是正常增量，**不是分歧**，
        记下来只会把文件刷成噪声。

        实测反证：连报两次同一个 cursor=99，第二次就已经 match:true
        （后端被覆盖了），所以"连续两次同字段"这种判据在镜像语义下永远不会命中。

        真正的分歧只剩一种：**后端写入过、而前端从不写的字段**。
        目前只有 ``questions``（问卷创建时后端知道完整题面，前端只上报进度）。
        若两者题面不一致，说明前端在跑另一份问卷 —— 那才是必须人看的错误。
        因此本方法只对 ``questions`` 落地差异，其余一律忽略。
        """
        if result.get("match"):
            return
        try:
            bad = [d for d in (result.get("diffs") or [])
                   if str(d.get("field") or "") == "questions"]
            if not bad:
                return      # 只有前端会推进的字段有差异 → 正常增量，不记

            rows: list[dict] = []
            if _SHADOW_FILE.exists():
                try:
                    rows = json.loads(_SHADOW_FILE.read_text(encoding="utf-8")) or []
                    if not isinstance(rows, list):
                        rows = []
                except Exception:  # noqa: BLE001
                    rows = []
            rows.append({
                "at": time.time(),
                "tool_call_id": tool_call_id,
                "diffs": bad,
            })
            # 只留最近 200 条：这是诊断产物，不是审计账本。
            if len(rows) > 200:
                rows = rows[-200:]
            tmp = _SHADOW_FILE.parent / (
                f"{_SHADOW_FILE.name}.{os.getpid()}.{time.time_ns()}.tmp")
            tmp.write_text(json.dumps(rows, ensure_ascii=False, indent=2),
                           encoding="utf-8")
            tmp.replace(_SHADOW_FILE)
        except Exception:  # noqa: BLE001
            logger.warning("could not persist %s", _SHADOW_FILE.name, exc_info=True)

    def _persist_surveys(self) -> None:
        """Mirror survey states to disk (atomic; failures non-fatal).

        ★ tmp 文件名必须**唯一**，不能用固定的 `<name>.tmp`。

        事故（2026-11-07，本仓库已犯第二次）：验证脚本是**多个独立进程**，
        它们和插件进程共用同一个 `survey_states.json`。固定 tmp 名下会出现：

          进程A 写 tmp → 进程B 也写 tmp（覆盖）→ 进程A replace(tmp→正式)
          → 进程B 再 replace 时 tmp 已被移走 → 抛 FileNotFoundError

        更糟的是交错写入本身就会产出**半截 JSON**；如果恰好发生在 replace 前后，
        正式文件会消失或被截断（实测：`survey_states.json` 整个不见了，
        只能从备份恢复）。

        用 pid + 随机后缀让每个进程各有自己的 tmp，再 replace —— 原子且互不干扰。
        """
        try:
            payload = {k: v.to_json() for k, v in self._surveys().items()}
            _f = _resolve_survey_file()
            _f.parent.mkdir(parents=True, exist_ok=True)
            tmp = _f.parent / f"{_f.name}.{os.getpid()}.{time.time_ns()}.tmp"
            tmp.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
            tmp.replace(_f)
        except Exception:  # noqa: BLE001
            logger.warning("could not persist survey states", exc_info=True)

    def _restore_surveys_locked(self) -> None:
        """Load persisted survey states once per process (best effort)."""
        shared = self._shared()
        # 同 _surveys() 的理由：旧容器上没有 `surveys_restored` 这个新字段，
        # 直接 getattr 读它也不会 AttributeError（getattr 有默认值），
        # 但赋值会落到旧实例上——那正是我们要的（标记住"已恢复过"）。
        if getattr(shared, "surveys_restored", False):
            return
        try:
            shared.surveys_restored = True
        except Exception:  # noqa: BLE001
            pass
        try:
            _f = _resolve_survey_file()
            if not _f.exists():
                return
            raw = json.loads(_f.read_text(encoding="utf-8")) or {}
            if not isinstance(raw, dict):
                return
            table = self._surveys()
            for k, v in raw.items():
                if isinstance(v, dict):
                    table[k] = SurveyState.from_json(v)
        except Exception:  # noqa: BLE001
            logger.warning("could not restore survey states", exc_info=True)


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

        # ── 阶段 1：问卷一创建就把后端 state 建好 ────────────────────
        # 阶段 0 时 state 是「前端上报才有」的镜像，于是后端在问卷弹出到第一次
        # 上报之间存在一个空窗：此时前端若问 GET /survey-state 会得到 found:false，
        # 而它现在要靠这份 state 渲染。改为创建即落基线。
        if pq.tool_call_id:
            _mode = str(kwargs.get("mode") or "manual")
            if _mode not in ("ai", "recommend", "manual"):
                _mode = "manual"
            self.ensure_survey(
                pq.tool_call_id,
                request_id=pq.request_id,
                session_id=pq.session_id,
                agent_id=pq.agent_id,
                title=pq.title,
                questions=pq.questions,
                mode=_mode,
                status="pending",
                # 阶段 3：ai 推进要在无页面时调模型，必须知道用哪个模型、
                # 要不要带上下文、超时多少。存快照保证与用户当时看到的设置一致。
                prefs=dict(kwargs.get("prefs") or {}),
            )
            st = self.get_survey(pq.tool_call_id)
            if st is not None and not st.progress_at:
                st.progress_at = time.time()
                self._persist_surveys()

        logger.info(
            "Question pending: request_id=%s agent=%s q_count=%d",
            pq.request_id[:8], pq.agent_id, len(pq.questions),
        )
        return pq

    async def submit_answer(
        self, request_id: str, answers: dict, other: str = "",
        attachments: list | None = None,
        by: str = "user",
    ) -> PendingQuestion | None:
        """Resolve a pending question with the user's answers.

        ``by`` 记录**是谁**提交的，落进 ``SurveyState.submitted_by``：

          · ``"user"``    — 人在卡片上点的提交/末页「其他意见」提交
          · ``"backend"`` — ai / recommend 模式下后端 runner 自动答完

        为什么必须区分（D2，2026-11-07 真机实测）：runner 走的是同一条
        ``submit_answer``（它是唯一带答案唤醒 agent 的通道），而镜像处写的是
        ``st.submitted_by = st.submitted_by or "user"`` → runner 提交的四份问卷
        全部落成 ``submitted_by="user"``。后果是从落盘无法区分「AI 代答」与
        「真人作答」，而这两者的可信度天差地别（ai 对观察类题目会编造，见 D4），
        事后复盘等于失去了唯一的判据。
        """
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
        # ── 阶段 1：提交也要反映到后端 state 并广播 ──────────────────
        # 否则第二个标签页仍显示「待作答」，而 agent 其实早就被唤醒了。
        if pq.tool_call_id:
            try:
                st = self.get_survey(pq.tool_call_id)
                if st is None:
                    st = self.ensure_survey(pq.tool_call_id)
                st.status = "submitted"
                st.submitted_by = st.submitted_by or (by or "user")
                st.submitted_at = st.submitted_at or time.time()
                st.updated_at = time.time()
                st.progress_at = st.updated_at
                st.released = True      # submit_answer 已经 set_result 过
                self._surveys()[pq.tool_call_id] = st
                self._persist_surveys()
                self._bump_rev(pq.tool_call_id, st, "answer")
            except Exception:  # noqa: BLE001 — 语义镜像失败不影响提交
                logger.warning("could not mirror submit into survey state",
                               exc_info=True)
            self.stop_watchdog(pq.tool_call_id)
            self.stop_runner(pq.tool_call_id)
        return pq

    async def skip(
        self, request_id: str, reason: str = "", by: str = "skip",
    ) -> PendingQuestion | None:
        """Resolve a pending question with a skip marker.

        ── 用户裁定 2026-11-08（第 1+2 项）────────────────────────────
        旧实现在这里无条件 `set_result({"skipped": True})`，造成两个后果：

        1. **已答内容被整个丢弃**。实测 `chatcmpl-tool-9fa5a40ffabe2bca`：
           看门狗释放前 q0 已由 AI 正常填入（`cursor=1 ans=1`），但模型收到
           的仍是裸 `{"skipped": true}`，那一题的答案凭空蒸发。
        2. **原因完全不可见**。卡片、模型、会话历史三处只剩「跳过」两个字，
           用户与模型都无法判断是"人点了跳过"还是"系统自己放弃了"。
           更糟的是措辞写死成「用户跳过了本次问卷」，把系统行为伪装成用户
           意愿 —— 模型据此继续决策，等于建立在假事实上（实测模型 thinking
           「问卷第 4 次被跳过。按『不推送』默认处理」= 它只能自己替用户拍板）。

        所以：payload 现在带 `skip_reason` / `skipped_by`，并在已有答案时
        一并回传。**跳过仍然是跳过**（`skipped: True` 保留，向后兼容），
        只是不再谎报是谁跳的、也不再丢数据。
        """
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
            pq.skip_reason = str(reason or "")
            self._persist_locked()

        # ── 组装回传给模型的 payload：原因 + 已有的真实答案 ──────────
        result: dict = {"skipped": True, "skipped_by": by or "skip"}
        if reason:
            result["skip_reason"] = str(reason)
        keep: dict = {}
        try:
            st_q = self.get_survey(pq.tool_call_id or "")
            for k, v in ((st_q.answers or {}) if st_q else {}).items():
                if _ans_meaningful(v):
                    keep[k] = v
        except Exception:  # noqa: BLE001 — 保答案绝不能反过来阻断放行
            logger.debug("could not collect partial answers", exc_info=True)
        if keep:
            result["answers"] = keep

        if pq.future and not pq.future.done():
            pq.future.set_result(result)

        # 阶段 1：跳过同样是终态，必须反映到后端 state（另一窗口要看到）
        if pq.tool_call_id:
            try:
                st = self.get_survey(pq.tool_call_id) or self.ensure_survey(pq.tool_call_id)
                st.status = "submitted"
                st.submitted_by = st.submitted_by or (by or "skip")
                if reason:
                    st.skip_reason = str(reason)
                st.submitted_at = st.submitted_at or time.time()
                st.updated_at = time.time()
                st.progress_at = st.updated_at
                st.released = True      # skip 也已经 set_result 过
                self._surveys()[pq.tool_call_id] = st
                self._persist_surveys()
                self._bump_rev(pq.tool_call_id, st, "skip")
            except Exception:  # noqa: BLE001
                logger.warning("could not mirror skip into survey state",
                               exc_info=True)
            self.stop_watchdog(pq.tool_call_id)
            self.stop_runner(pq.tool_call_id)

        logger.info(
            "Question %s skipped (by=%s reason=%s kept_answers=%d)",
            request_id[:8], by or "skip", (reason or "-")[:60], len(keep),
        )
        return pq

    async def get_by_tool_call(self, tool_call_id: str) -> PendingQuestion | None:
        """Find the **live** pending question for this tool-call id.

        ★ 必须优先返回「有活 Future 的非 orphan」，不能返回遍历到的第一条。

        真实缺陷（2026-11-07 实测，导致问卷永不交卷）：
          插件 reload 时会把未完成的记录从磁盘恢复成 `orphan=True`（它们的
          Future 属于旧事件循环，永远不可能被 resolve）。这些 orphan 与**新建**
          的同 tool_call_id 记录会同时躺在 `_pending` 里（同一次对话重试同一个
          tool_call 就会这样）。

          旧实现只 return 第一条命中的，实测返回了 orphan：
              get_by_tool_call 命中=True 同一对象=False orphan=True
          于是 `_runner_submit` 拿 orphan 的 request_id 去 `submit_answer`，
          而 `submit_answer` 对 orphan 是**直接返回不 resolve**的 →
          runner 自己走完了、答案也填好了（cursor=3 ans=3），
          但问卷状态永远停在 `pending`，agent 永远等不到答案。

          症状极具误导性：日志里有 `runner:fill` 三行 + `runner:submit` 一行，
          看起来一切正常，只有 `status` 不动。

        排序规则：非 orphan + Future 未完成 优先；否则退回任意一条（保持旧的
        兜底行为，避免调用方拿到 None 而静默失败）。
        """
        if not tool_call_id:
            return None
        async with self._lock:
            best = None
            for pq in self._pending.values():
                if pq.tool_call_id != tool_call_id:
                    continue
                fut = getattr(pq, "future", None)
                live = (not getattr(pq, "orphan", False)
                        and fut is not None and not fut.done())
                if live:
                    return pq          # 有活的，立刻返回（最理想）
                if best is None:
                    best = pq          # 兜底：记住第一条非活的
            return best

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
                    pq.future.set_result({
                        "skipped": True, "skipped_by": "cancel",
                        "skip_reason": "会话被停止或取消，等待中的问卷被放弃",
                    })
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
                        fut.set_result({
                            "skipped": True, "skipped_by": "shutdown",
                            "skip_reason": reason or "插件关闭，等待中的问卷被释放",
                            "reason": reason,   # 向后兼容旧断言
                        })
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
