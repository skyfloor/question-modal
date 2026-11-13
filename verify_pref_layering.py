# -*- coding: utf-8 -*-
"""核验用户 2026-11-13 描述的配置键值结构是否与当前实现一致。

用户原话：
  「全局配置是单独的键值对，会话模式是适用会话的作为键值对，
    默认模式是 default 键值对，根据会话键值对识别，默认模式 default 键值对」

即用户期望的三层：
  ① 全局配置   = 独立的一组键值对（所有会话共享的基线）
  ② 会话模式   = 以【会话标识】为键 → 该会话的键值对
  ③ 默认模式   = 以【字面 "default"】为键 → 默认键值对

当前实现（resolve_effective）：
  内建 schema 默认 → 全局 analysis_prefs.json → 该 chat 的覆盖
  「默认模式」= 不写会话覆盖（回落到全局/内建默认）

本脚本只做只读核验，不改任何数据。
"""
import json
import sys

sys.path.insert(0, "/app/working/plugins/question-modal")

PLUG = "/app/working/plugins/question-modal"
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def main():
    # 用 plugin 模块自身的纯函数（不启动 HTTP）
    import importlib.util

    spec = importlib.util.spec_from_file_location(
        "_qm_plugin_probe", PLUG + "/plugin.py",
        submodule_search_locations=[PLUG])
    # plugin.py 有相对导入，直接用其所在包的方式加载不可靠 → 改用包名加载
    import types  # noqa: F401

    import subprocess

    code = r'''
import json, sys
sys.path.insert(0, "/app/working")
# 以宿主包名加载（plugin.py 用的是相对导入）
try:
    from plugin_question_modal import plugin as P
except Exception:
    # 退回：手工构造包上下文
    import importlib, types, os
    d = "/app/working/plugins/question-modal"
    pkg = types.ModuleType("plugin_question_modal")
    pkg.__path__ = [d]
    sys.modules["plugin_question_modal"] = pkg
    import importlib.util as u
    def load(name, fn):
        s = u.spec_from_file_location("plugin_question_modal." + name,
                                      os.path.join(d, fn))
        m = u.module_from_spec(s)
        sys.modules["plugin_question_modal." + name] = m
        s.loader.exec_module(m)
        return m
    load("recommend", "recommend.py")
    load("analysis", "analysis.py")
    qs = load("question_service", "question_service.py")
    sys.modules["plugin_question_modal"].question_service = qs
    s = u.spec_from_file_location("plugin_question_modal.plugin",
                                  os.path.join(d, "plugin.py"))
    P = u.module_from_spec(s); sys.modules["plugin_question_modal.plugin"] = P
    s.loader.exec_module(P)

out = {}
out["has_resolve_effective"] = hasattr(P, "resolve_effective")
out["has_load_prefs"] = hasattr(P, "_load_prefs")
out["has_load_session_prefs"] = hasattr(P, "_load_session_prefs")
out["has_schema_defaults"] = hasattr(P, "schema_defaults")
if out["has_resolve_effective"]:
    out["effective_no_chat"] = P.resolve_effective("")
    out["effective_fake_chat"] = P.resolve_effective("__probe_unknown_chat__")
    out["sources_no_chat"] = P.resolve_effective("").get("__sources__")
out["session_prefs_keys"] = list((P._load_session_prefs() or {}).keys())[:20] if out["has_load_session_prefs"] else []
out["global_keys"] = list((P._load_prefs() or {}).keys()) if out["has_load_prefs"] else []
print("__JSON__" + json.dumps(out, ensure_ascii=False))
'''
    r = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True,
                       timeout=90, cwd="/app/working")
    if "__JSON__" not in r.stdout:
        print("探针失败:", r.stdout[-800:], r.stderr[-800:])
        return 1
    d = json.loads(r.stdout.split("__JSON__", 1)[1])

    print("===== 模块能力 =====")
    print("  resolve_effective:", d.get("has_resolve_effective"))
    print("  全局键:", d.get("global_keys"))
    print("  会话覆盖的 chat 键:", d.get("session_prefs_keys"))
    print("  无 chat 时的 __sources__:", d.get("sources_no_chat"))

    print("\n===== 核验用户描述的对应关系 =====")
    ck("[S1] 存在「全局配置」这一层（独立的全局键值对文件）",
       d.get("has_load_prefs") and len(d.get("global_keys") or []) > 0,
       d.get("global_keys"))
    ck("[S2] 存在「会话模式」这一层（以 chat 标识为键的覆盖表）",
       d.get("has_load_session_prefs"), d.get("has_load_session_prefs"))
    ck("[S3] 「默认模式」= 不写会话覆盖，回落到全局/内建默认",
       d.get("sources_no_chat") == {},
       d.get("sources_no_chat"))
    ck("[S4] 未知 chat 与「无 chat」得到同一生效值（默认模式不吃会话层）",
       d.get("effective_no_chat", {}).get("__sources__")
       == d.get("effective_fake_chat", {}).get("__sources__") == {})

    print("\n===== 与用户描述的差异点（需用户裁定）=====")
    print("  用户描述：默认模式是【字面 default 键】的键值对。")
    print("  当前实现：默认模式不是一条 'default' 记录，而是「内建 schema 默认 ⊕ 全局文件」。")
    print("  → 语义等价（都是『没配会话覆盖时用的那套值』），")
    print("     但存储形态不同：用户设想的 default 记录可以被单独编辑，")
    print("     当前实现里它 = 全局文件，改它等于改所有会话的基线。")

    print("\nRESULT: 核验完成（差异点见上，等待裁定）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
