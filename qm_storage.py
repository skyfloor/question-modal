# -*- coding: utf-8 -*-
"""question-modal 插件的共享持久化层（配置外置 + 备份恢复）。

2026-11-25 boss 需求：商店更新后所有设置配置丢失。
根因：所有数据文件都写在插件**安装目录** ``_PLUGIN_DIR`` 内，而商店更新
是整目录替换 —— 数据随代码目录一起被清掉。
修法：把数据根迁到安装目录之外的持久目录，与代码安装彻底解耦。

设计硬约束（顾问评审 2026-11-25 通过条件）：
1. 路径解析是**纯计算**（import 期只算路径，不做任何 IO）；
2. 迁移**惰性触发** —— 首次读/写时经 ``ensure_migrated()`` 在锁内串行执行，
   迁移成功前禁止任何写入；
3. 迁移只搬「外置不存在、旧目录存在」的文件，**绝不反向覆盖**新数据；
4. 读取失败绝不写回空默认值 —— 由各 load 层保证，本模块只提供路径与迁移。

数据目录优先级（2026-11-28 boss 裁定，绑定到当前智能体 workspace）：
  QM_DATA_DIR 环境变量
    > <WORKING_DIR>/workspaces/<当前智能体>/plugin_data/question-modal
    > 旧全局外置目录兜底（新目录不可写时）

迁移链（惰性、只搬不覆盖）：安装目录 → 旧全局外置目录 → 当前智能体数据目录。
"当前智能体"在进程启动时解析一次并缓存（进程级单例目录），保证没有请求
context 的后台协程（watchdog / runner）与 HTTP 请求写到同一目录。
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PLUGIN_DIR = Path(__file__).parent.resolve()


def _resolve_working_dir() -> Path:
    """宿主 WORKING_DIR —— 与 plugin.py 同口径，不硬编码绝对路径。"""
    try:
        from qwenpaw.constant import WORKING_DIR  # noqa: PLC0415

        return Path(str(WORKING_DIR))
    except Exception:  # noqa: BLE001 — 导入期绝不抛，保插件可装
        return Path.cwd()


def _resolve_agent_workspace() -> Path:
    """当前智能体的 workspace 目录（进程启动时解析一次，进程级单例）。

    boss 2026-11-28 裁定：数据落到「当前智能体所在路径」下。插件是单进程
    服务多 agent，而 13 个数据文件都是 import 期固定的全局单例；若按每次
    请求身份动态换目录，没带 context 的后台 watchdog / runner 会写到错误
    目录，且挂起问卷跨 agent 恢复会错乱。故这里只解析一次并缓存。

    解析顺序：宿主 agent context（get_current_agent_id）→ 活动 agent
    （get_active_agent_id）→ 环境变量 → default。取不到则回退 WORKING_DIR。
    """
    agent_id = ""
    try:
        from qwenpaw.app.agent_context import (  # noqa: PLC0415
            get_active_agent_id,
            get_current_agent_id,
        )

        agent_id = (get_current_agent_id() or get_active_agent_id() or "").strip()
    except Exception:  # noqa: BLE001
        pass
    if not agent_id:
        agent_id = os.environ.get("QWENPAW_QUESTION_MODAL_AGENT_ID", "").strip()
    agent_id = agent_id or "default"
    return _resolve_working_dir() / "workspaces" / agent_id


# 进程启动时一次性解析，后续全程复用（含无请求 context 的后台协程）。
_AGENT_WORKSPACE = _resolve_agent_workspace()

# 已知持久化文件清单（配置类 + 运行态类一并外置，避免下次更新又丢挂起问卷）。
DATA_FILES: tuple[str, ...] = (
    "analysis_prefs.json",       # 全局偏好：模式/通知渠道/阈值
    "subagent_prefs.json",       # 子代理模式运行参数（优先级最高的子代理专用配置）
    "session_prefs.json",        # 会话层偏好
    "parameter_sets.json",       # 问卷参数组
    "notify_profiles.json",      # 通知配置
    "schedules.json",            # 时间策略
    "templates.json",            # 自定义提示词模板
    "notify_test_log.json",      # 通知测试记录
    "gate_blocks.json",          # 空答拦截审计
    "answered_results.json",     # 作答结果
    "pending_questions.json",    # 挂起问卷
    "survey_states.json",        # 问卷推进状态
    "shadow_diffs.json",         # 影子比对诊断
)

# 备份格式标识与版本（带 schema 版本，便于后续演进与兼容性拒绝）。
_BACKUP_FORMAT = "qm-config-backup"
_BACKUP_VERSION = 1

_lock = threading.RLock()
_migrated = False


def atomic_write_text(path: Path, data: str, *, encoding: str = "utf-8") -> None:
    """原子写文本，兼容群晖共享文件夹；写后回读校验，失败一律抛错。

    背景（2026-11-27 群晖实测）：部分 NAS 共享文件夹（如 ``@appshare``）
    对 ``Path.replace()`` 的原子重命名支持不完整，会抛 OSError。旧实现用
    ``except: pass`` 吞掉 → 接口仍返回 ``ok:true``，但文件根本没落盘
    （``config/status`` 全 false）——典型「HTTP 200 ≠ 数据真写入」假成功。

    策略：
      1. 优先 tmp + replace（原子，避免半截文件）；
      2. replace 失败 → 降级为直接覆写目标（群晖兼容）；
      3. 任一步真失败 → 抛 OSError，**绝不再静默吞掉**；
      4. 写后回读比对，内容不符也算失败。
    调用方（各 save_* / CRUD 端点）据此可向用户返回真实失败。
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.parent / f"{path.name}.{os.getpid()}.{time.time_ns()}.tmp"
    try:
        tmp.write_text(data, encoding=encoding)
        try:
            tmp.replace(path)
        except OSError:
            # 群晖共享文件夹不支持原子 rename → 降级直接覆写
            path.write_text(data, encoding=encoding)
    finally:
        try:
            tmp.unlink(missing_ok=True)
        except OSError:
            pass
    # 回读校验：写进去的东西必须能读回来，否则视为失败
    if path.read_text(encoding=encoding) != data:
        raise OSError(f"回读校验失败：{path.name} 写入内容与期望不符")


def _global_data_dir() -> Path:
    """旧全局外置目录（迁移来源 + 新目录不可写时的兜底）。"""
    # 工作区根 = 安装目录的上两级（<root>/plugins/<plugin_id>/ → <root>）。
    # 用相对定位而非硬编码宿主绝对路径，避免发布包命中路径敏感串。
    return _PLUGIN_DIR.parent.parent / "plugin_data" / "question-modal"


def data_dir() -> Path:
    """返回数据根目录（不创建、不迁移，纯解析）。

    boss 2026-11-28 裁定：数据落在「当前智能体所在路径」下
    ``<WORKING_DIR>/workspaces/<agent>/plugin_data/question-modal``。
    优先级：QM_DATA_DIR 环境变量 > 当前智能体目录 > 旧全局外置目录兜底。
    新目录若不可用（不可写），回退旧全局目录，保证插件仍可用。
    """
    override = os.environ.get("QM_DATA_DIR", "").strip()
    if override:
        return Path(override)
    target = _AGENT_WORKSPACE / "plugin_data" / "question-modal"
    try:
        probe = _AGENT_WORKSPACE / "plugin_data"
        probe.mkdir(parents=True, exist_ok=True)
        marker = probe / ".qm-probe"
        marker.touch()
        marker.unlink()
        # 群晖等共享文件夹环境实测（2026-11-27）：父目录可 touch，但数据子目录
        # 若不存在，写入用的 tmp.write_text 会因父目录缺失静默失败，一并创建。
        target.mkdir(parents=True, exist_ok=True)
        return target
    except OSError as e:
        logger.warning("qm_storage: agent workspace data dir %s unusable (%s); "
                       "fallback to global dir", target, e)
        return _global_data_dir()


def resolve(name: str) -> Path:
    """返回某个数据文件在外置目录中的路径（纯计算，import 期可安全调用）。"""
    return data_dir() / name


def legacy_path(name: str) -> Path:
    """安装目录里的同名文件（最老一代迁移来源，仅 ensure_migrated 使用）。"""
    return _PLUGIN_DIR / name


def migration_sources(name: str) -> tuple[Path, ...]:
    """按优先级返回所有迁移来源（仅 ensure_migrated 使用）。

    迁移链：旧全局外置目录（v3.0.2 起，数据最全）→ 安装目录（原始源码旁）。
    只搬「目标不存在」的文件，绝不反向覆盖，保证历史数据完整搬过去。
    """
    return (_global_data_dir() / name, _PLUGIN_DIR / name)


# 2026-11-28 治本修复：删除原 MigrationPath（Path 子类）。
# 它在 Python 3.11 正常，但 3.12 的 pathlib 会调 self.stat(follow_symlinks=...)
# 且用 type(self)(完整路径) 重建实例，与自定义 __new__(name)/stat() 冲突，
# 导致「保存通知配置 500」「could not persist pending_questions.json」等连锁失败。
# 数据文件常量一律用 resolve() 返回**普通 Path**（跨版本稳定），
# 迁移改为 register() 启动时显式调用 ensure_migrated() 一次（进程级）。


def ensure_migrated() -> None:
    """惰性迁移：把旧目录里存在而新目录缺失的文件搬到当前智能体数据目录。

    · 锁内串行 + once 标志，避免并发重复搬运；
    · 迁移链 = 旧全局外置目录 → 安装目录（见 migration_sources）；
    · 只搬「目标不存在」的文件，绝不覆盖用户在新位置已改过的配置；
    · 用「临时文件 + 原子 replace」保证搬运中途失败不留半截文件；
      replace 失败（群晖共享文件夹）降级为直接覆写，与 atomic_write_text 同口径；
    · 迁移前不创建任何空文件（避免把空默认误当成用户数据）。
    """
    global _migrated
    if _migrated:
        return
    with _lock:
        if _migrated:
            return
        dst_dir = data_dir()
        try:
            dst_dir.mkdir(parents=True, exist_ok=True)
        except OSError as e:
            logger.warning("qm_storage: cannot create data dir %s: %s", dst_dir, e)
            return                      # 迁移失败：保持未迁移，绝不写空数据
        for name in DATA_FILES:
            dst = dst_dir / name
            if dst.exists():
                continue                # 目标已有，绝不覆盖新位置数据
            for src in migration_sources(name):
                if not src.is_file():
                    continue
                tmp = dst.with_name(name + ".mig-tmp")
                try:
                    shutil.copy2(src, tmp)
                    try:
                        tmp.replace(dst)        # 原子落位
                    except OSError:
                        dst.write_bytes(tmp.read_bytes())  # 群晖降级
                    logger.warning("qm_storage: migrated %s -> %s", src, dst)
                    break                   # 已搬到，不再看更低优先级来源
                except OSError as e:
                    logger.warning("qm_storage: migrate %s from %s failed: %s",
                                   name, src, e)
                finally:
                    try:
                        if tmp.exists():
                            tmp.unlink()
                    except OSError:
                        pass
        _migrated = True


# ── 备份 / 恢复 ────────────────────────────────────────────────────
def backup_dir() -> Path:
    return data_dir() / "backups"


def _read_payload(name: str) -> Any:
    """读取单个数据文件为 JSON 对象；不存在/损坏返回 None（绝不写回）。"""
    p = resolve(name)
    if not p.is_file():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def create_backup(label: str = "") -> dict:
    """把所有存在的数据文件打包成带时间戳的快照，落在外置 backups/ 目录。

    返回 {"ok": bool, "name": str, "files": [...], "error"?: str}。
    快照本身也在外置目录，不会被商店更新清掉。
    """
    ensure_migrated()
    with _lock:
        files: dict[str, Any] = {}
        for name in DATA_FILES:
            val = _read_payload(name)
            if val is not None:
                files[name] = val
        if not files:
            return {"ok": False, "error": "没有可备份的配置数据"}
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        name = "bak-" + ts + ".json"
        payload = {
            "format": _BACKUP_FORMAT,
            "version": _BACKUP_VERSION,
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "label": str(label or ""),
            "files": files,
        }
        d = backup_dir()
        try:
            d.mkdir(parents=True, exist_ok=True)
            tmp = d / (name + ".tmp")
            tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2),
                           encoding="utf-8")
            tmp.replace(d / name)
        except OSError as e:
            return {"ok": False, "error": "写备份失败: " + str(e)}
        return {"ok": True, "name": name, "files": sorted(files)}


def list_backups() -> list[dict]:
    """列出已有快照（按时间倒序），只列格式合法的。"""
    ensure_migrated()
    d = backup_dir()
    if not d.is_dir():
        return []
    out: list[dict] = []
    for p in sorted(d.glob("bak-*.json"), reverse=True):
        try:
            obj = json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if (not isinstance(obj, dict) or obj.get("format") != _BACKUP_FORMAT
                or obj.get("version") != _BACKUP_VERSION
                or not isinstance(obj.get("files"), dict)):
            continue
        out.append({
            "name": p.name,
            "created_at": str(obj.get("created_at", "")),
            "label": str(obj.get("label", "")),
            "files": sorted(obj["files"].keys()),
            "size": p.stat().st_size,
        })
    return out


def delete_backup(name: str) -> dict:
    """删除指定备份快照。不可逆操作：调用方须先做二次确认。

    路径安全：只接受纯文件名，解析后必须仍落在 backups/ 目录内；
    拒绝绝对路径、'..'、子目录、符号链接（防越界删除任意文件）。
    """
    ensure_migrated()
    if not name or "/" in name or "\\" in name or ".." in name:
        return {"ok": False, "error": "非法备份名"}
    d = backup_dir()
    p = d / name
    # 解析后必须仍在 backups 目录内（挡住符号链接等越界）
    try:
        # 符号链接一律拒绝（即使指向目录内文件）：删除 symlink 虽不伤目标，
        # 但会留下「备份名可指向任意路径」的口子，统一不认。
        if p.is_symlink():
            return {"ok": False, "error": "备份名不可为符号链接"}
        if p.resolve().parent != d.resolve() or not p.is_file():
            return {"ok": False, "error": "备份不存在或路径越界"}
    except OSError:
        return {"ok": False, "error": "备份路径不可解析"}
    try:
        p.unlink()
    except OSError as e:
        return {"ok": False, "error": "删除失败: " + str(e)}
    return {"ok": True, "deleted": name}


def validate_backup(obj: Any) -> tuple[bool, str]:
    """恢复前的格式校验。返回 (是否合法, 原因)。"""
    if not isinstance(obj, dict):
        return False, "备份文件不是 JSON 对象"
    if obj.get("format") != _BACKUP_FORMAT:
        return False, "不是 question-modal 配置备份"
    if obj.get("version") != _BACKUP_VERSION:
        return False, "备份版本不兼容（需要 v%d）" % _BACKUP_VERSION
    files = obj.get("files")
    if not isinstance(files, dict) or not files:
        return False, "备份里没有配置文件"
    known = set(DATA_FILES)
    unknown = set(files) - known
    if unknown:
        return False, "备份含未知文件: " + ", ".join(sorted(unknown))
    for k, v in files.items():
        if not isinstance(v, (dict, list)):
            return False, "备份文件 %s 内容格式错误" % k
    return True, ""


def restore_backup(name: str) -> dict:
    """恢复指定快照。恢复前**自动先备份当前状态**（防误恢复可回滚）。

    只接受 backups/ 目录内的合法文件名（拒绝路径穿越）。
    """
    ensure_migrated()
    if not name or "/" in name or "\\" in name or ".." in name:
        return {"ok": False, "error": "非法备份名"}
    p = backup_dir() / name
    if not p.is_file():
        return {"ok": False, "error": "备份不存在"}
    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"ok": False, "error": "备份文件损坏"}
    ok, why = validate_backup(obj)
    if not ok:
        return {"ok": False, "error": why}

    # 恢复前自动快照（恢复是破坏性操作，必须先留退路）
    pre = create_backup(label="auto-before-restore-" + name)
    with _lock:
        restored: list[str] = []
        for key, val in obj["files"].items():
            dst = resolve(key)
            tmp = dst.with_name(key + ".restore-tmp")
            try:
                tmp.write_text(json.dumps(val, ensure_ascii=False, indent=2),
                               encoding="utf-8")
                tmp.replace(dst)
                restored.append(key)
            except OSError as e:
                try:
                    if tmp.exists():
                        tmp.unlink()
                except OSError:
                    pass
                return {"ok": False, "error": "恢复 %s 失败: %s" % (key, e),
                        "restored_partial": restored}
    return {"ok": True, "restored": restored,
            "pre_restore_backup": pre.get("name", "")}


def export_config() -> dict:
    """导出当前全部配置为可下载对象（跨机器 / 重装后手动导入用）。"""
    ensure_migrated()
    files: dict[str, Any] = {}
    for name in DATA_FILES:
        val = _read_payload(name)
        if val is not None:
            files[name] = val
    return {
        "format": _BACKUP_FORMAT,
        "version": _BACKUP_VERSION,
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "files": files,
    }


def import_config(payload: Any) -> dict:
    """导入配置对象（来自本地文件）。与 restore 同口径：先自动快照再覆盖。"""
    ok, why = validate_backup(payload)
    if not ok:
        return {"ok": False, "error": why}
    pre = create_backup(label="auto-before-import")
    with _lock:
        restored: list[str] = []
        for key, val in payload["files"].items():
            dst = resolve(key)
            tmp = dst.with_name(key + ".import-tmp")
            try:
                tmp.write_text(json.dumps(val, ensure_ascii=False, indent=2),
                               encoding="utf-8")
                tmp.replace(dst)
                restored.append(key)
            except OSError as e:
                try:
                    if tmp.exists():
                        tmp.unlink()
                except OSError:
                    pass
                return {"ok": False, "error": "导入 %s 失败: %s" % (key, e),
                        "restored_partial": restored}
    return {"ok": True, "restored": restored,
            "pre_restore_backup": pre.get("name", "")}
