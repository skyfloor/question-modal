# -*- coding: utf-8 -*-
"""S1 离线单测：三层优先级 / 越界钳制 / 非法值 / 全局键不再被丢弃。"""
import json, types, logging, pathlib, ast, time, sys, os

P = "/app/working/plugins/question-modal/plugin.py"
src = open(P, encoding="utf-8").read()
tree = ast.parse(src)

names = ("_load_prefs", "_save_prefs", "_load_session_prefs", "_save_session_prefs",
         "_iter_agent_chats", "schema_defaults", "_coerce_setting",
         "sanitize_settings", "_session_writable", "resolve_effective",
         "_config_version")
keep = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names]

mod = types.ModuleType("p")
mod.__dict__.update({
    "logger": logging.getLogger("qm_s1"), "json": json, "time": time,
    "os": os,
    "Path": pathlib.Path, "Any": object,
    "_PLUGIN_DIR": pathlib.Path("/tmp/qms1"),
    "_PREFS_FILE": pathlib.Path("/tmp/qms1/analysis_prefs.json"),
    "_SESSION_PREFS_FILE": pathlib.Path("/tmp/qms1/session_prefs.json"),
})
pathlib.Path("/tmp/qms1").mkdir(exist_ok=True)
for n in tree.body:
    tgt = None
    if isinstance(n, ast.Assign) and isinstance(n.targets[0], ast.Name):
        tgt = n.targets[0].id
    elif isinstance(n, ast.AnnAssign) and isinstance(n.target, ast.Name):
        tgt = n.target.id
    if tgt in ("_PREFS_DEFAULTS", "SETTINGS_SCHEMA"):
        exec(compile(ast.Module(body=[n], type_ignores=[]), "<c>", "exec"), mod.__dict__)
exec(compile(ast.unparse(ast.Module(body=keep, type_ignores=[])), "<t>", "exec"),
     mod.__dict__)

for f in ("analysis_prefs.json", "session_prefs.json"):
    p = pathlib.Path("/tmp/qms1") / f
    if p.exists():
        p.unlink()

pass_ = fail = 0
def ck(name, ok, detail=""):
    global pass_, fail
    if ok:
        pass_ += 1; print("  ✓ " + name)
    else:
        fail += 1; print("  ✗ " + name + (" → " + str(detail) if detail else ""))

print("\n[S1] 配置解析层")

# ① 全默认
e = mod.resolve_effective("")
ck("[S1-1] 空存储时全部回落内建默认",
   e["mode"] == "manual" and e["slow_question_sec"] == 60
   and e["gate_unsaved"] is True and e["skip_mode"] == "per_question"
   and e["show_recommend_badge"] is True)
ck("[S1-2] 无覆盖时 __sources__ 为空", e["__sources__"] == {}, e["__sources__"])

# ② 全局层：本轮修复的核心 —— 新 schema 键必须能读回
mod._save_prefs({"mode": "ai", "slow_question_sec": 30, "skip_mode": "whole"})
e = mod.resolve_effective("")
ck("[S1-3] 全局层新键能读回（此前会被静默丢弃）",
   e["mode"] == "ai" and e["slow_question_sec"] == 30 and e["skip_mode"] == "whole",
   (e["mode"], e["slow_question_sec"], e["skip_mode"]))

# ③ 会话覆盖 > 全局
mod._save_session_prefs({"c1": {"mode": "recommend", "slow_question_sec": 120}})
e1 = mod.resolve_effective("c1")
e2 = mod.resolve_effective("c2")
ck("[S1-4] 会话覆盖优先于全局",
   e1["mode"] == "recommend" and e1["slow_question_sec"] == 120,
   (e1["mode"], e1["slow_question_sec"]))
ck("[S1-5] 无覆盖的会话回落全局（不受他人覆盖影响）",
   e2["mode"] == "ai" and e2["slow_question_sec"] == 30,
   (e2["mode"], e2["slow_question_sec"]))
ck("[S1-6] __sources__ 正确标注来源键",
   e1["__sources__"] == {"mode": "session", "slow_question_sec": "session"},
   e1["__sources__"])
ck("[S1-7] 未被覆盖的键不出现在 __sources__", "skip_mode" not in e1["__sources__"])

# ④ 越界钳制
ck("[S1-8] timeout 低于下限被钳到 30（不是直接失败）",
   mod._coerce_setting("model_timeout_sec", 5) == (True, 30))
ck("[S1-9] timeout 高于上限被钳到 600",
   mod._coerce_setting("model_timeout_sec", 9999) == (True, 600))
ck("[S1-10] slow=0 合法（0 表示关闭提示）",
   mod._coerce_setting("slow_question_sec", 0) == (True, 0))
ck("[S1-11] 负数被钳到下限", mod._coerce_setting("slow_question_sec", -5) == (True, 0))

# ⑤ 非法值
ck("[S1-12] 非法枚举被拒", mod._coerce_setting("mode", "bogus") == (False, None))
ck("[S1-13] 字符串冒充 bool 被拒", mod._coerce_setting("parallel", "yes") == (False, None))
ck("[S1-14] 未知键被拒", mod._coerce_setting("evil", "x") == (False, None))
ck("[S1-15] sanitize 只保留合法键",
   mod.sanitize_settings({"mode": "ai", "evil": 1, "parallel": "x",
                          "slow_question_sec": "60"}) == {"mode": "ai"},
   mod.sanitize_settings({"mode": "ai", "evil": 1, "parallel": "x"}))

# ⑥ 会话覆盖不能写 global-only 键
mod._save_session_prefs({"c3": {"gate_log_limit": 500, "mode": "ai"}})
raw = mod._load_session_prefs()
ck("[S1-16] 会话覆盖拒绝 global-only 键（gate_log_limit）",
   "gate_log_limit" not in (raw.get("c3") or {}), raw.get("c3"))

# ⑦ 版本号随写入变化
v1 = mod._config_version()
time.sleep(0.01)
mod._save_prefs({"parallel": True})
v2 = mod._config_version()
ck("[S1-17] 版本号随配置写入变化", v2 != v1, (v1, v2))

# ⑧ schema 完整性
ck("[S1-18] schema 共 18 项可配置（p0 只读说明不计入；含 notify_manual_mode）", len(mod.SETTINGS_SCHEMA) == 18, len(mod.SETTINGS_SCHEMA))
ck("[S1-19] 第 1 批 5 项标 batch=1",
   sorted(k for k, v in mod.SETTINGS_SCHEMA.items() if v.get("batch") == 1)
   == ["gate_unsaved", "mode", "show_recommend_badge",
       "skip_mode", "slow_question_sec"],
   [k for k, v in mod.SETTINGS_SCHEMA.items() if v.get("batch") == 1])
ck("[S1-20] 每项都有 default/type/scope",
   all("default" in v and "type" in v and "scope" in v
       for v in mod.SETTINGS_SCHEMA.values()))

print(f"\n════ 结果: {pass_} passed, {fail} failed ════")
sys.exit(1 if fail else 0)
