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

外置目录优先级（按真实环境解析，不硬编码猜测）：
  QM_DATA_DIR 环境变量 > /app/working/plugin_data/question-modal > 安装目录兜底
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PLUGIN_DIR = Path(__file__).parent.resolve()

# 已知持久化文件清单（配置类 + 运行态类一并外置，避免下次更新又丢挂起问卷）。
DATA_FILES: tuple[str, ...] = (
    "analysis_prefs.json",       # 全局偏好：模式/通知渠道/阈值
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


def data_dir() -> Path:
    """返回外置数据根目录（不创建、不迁移，纯解析）。

    优先环境变量（供测试与部署自定义），其次与同机 prompt-optimizer-plus
    一致的 /app/working/plugin_data/<plugin_id>，最后回退安装目录（极端兜底，
    保证在只读外置目录的环境里插件仍可用，仅失去「更新不丢配置」的保护）。
    """
    override = os.environ.get("QM_DATA_DIR", "").strip()
    if override:
        return Path(override)
    # 确认候选根可写；不可写则回退安装目录（不静默假定成功）。
    base = Path("/app/working/plugin_data")
    try:
        base.mkdir(parents=True, exist_ok=True)
        probe = base / ".qm-probe"
        probe.touch()
        probe.unlink()
    except OSError:
        return _PLUGIN_DIR
    return base / "question-modal"


def resolve(name: str) -> Path:
    """返回某个数据文件在外置目录中的路径（纯计算，import 期可安全调用）。"""
    return data_dir() / name


def legacy_path(name: str) -> Path:
    """旧安装目录里的同名文件路径（迁移来源，仅 ensure_migrated 使用）。"""
    return _PLUGIN_DIR / name


class MigrationPath(type(Path())):
    """Path 子类：任何文件访问前先确保迁移完成（惰性 / 串行 / once）。

    插件各数据文件常量改用本类构造后，**所有现有 load/save 函数零改动**
    即自动走「外置目录 + 首次访问迁移」。覆盖全部会读写文件的方法；
    `with_name`/`with_suffix` 由 Path 保持子类类型，配合原子写临时文件。

    构造期只按 data_dir() 拼路径字符串（无数据搬运），真正迁移发生在
    第一次 is_file/read_text/write_text 等访问时的 ensure_migrated()。
    """

    def __new__(cls, name: str):
        return super().__new__(cls, str(data_dir() / name))

    def _migrate(self) -> None:
        ensure_migrated()

    def is_file(self) -> bool:
        self._migrate(); return super().is_file()

    def exists(self) -> bool:
        self._migrate(); return super().exists()

    def stat(self):
        self._migrate(); return super().stat()

    def read_text(self, *a, **k):
        self._migrate(); return super().read_text(*a, **k)

    def read_bytes(self):
        self._migrate(); return super().read_bytes()

    def write_text(self, *a, **k):
        self._migrate(); return super().write_text(*a, **k)

    def write_bytes(self, *a, **k):
        self._migrate(); return super().write_bytes(*a, **k)

    def open(self, *a, **k):
        self._migrate(); return super().open(*a, **k)

    def unlink(self, *a, **k):
        self._migrate(); return super().unlink(*a, **k)

    def touch(self, *a, **k):
        self._migrate(); return super().touch(*a, **k)

    def glob(self, *a, **k):
        self._migrate(); return super().glob(*a, **k)


def ensure_migrated() -> None:
    """惰性迁移：把旧目录里存在而外置缺失的文件搬到外置目录。

    · 锁内串行 + once 标志，避免并发重复搬运；
    · 只搬「外置不存在」的文件，绝不覆盖用户在新位置已改过的配置；
    · 用「临时文件 + 原子 replace」保证搬运中途失败不留半截文件；
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
            src = legacy_path(name)
            dst = dst_dir / name
            if dst.exists() or not src.is_file():
                continue
            tmp = dst.with_name(name + ".mig-tmp")
            try:
                shutil.copy2(src, tmp)
                tmp.replace(dst)        # 原子落位
                logger.warning("qm_storage: migrated %s -> %s", src.name, dst)
            except OSError as e:
                try:
                    if tmp.exists():
                        tmp.unlink()
                except OSError:
                    pass
                logger.warning("qm_storage: migrate %s failed: %s", name, e)
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
