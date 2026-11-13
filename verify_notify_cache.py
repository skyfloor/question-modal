# -*- coding: utf-8 -*-
"""验证：诊断页「分级缓存清理」的两个端点已按 2026-11-04 用户裁定删除。

原脚本测 `/cache-info` / `/cache-purge` 的分级安全性，但这两个端点连同
诊断页一起被删除（2026-11-04），继续按旧契约断言会产生假失败。
本版改为**反向断言**：两个端点都不再存在（404/405），且不会误删任何状态文件。
"""
import json, os, sys, urllib.error, urllib.request

BASE = "http://127.0.0.1:8088/api"
PLUG = "/app/working/plugins/question-modal"

ok = fail = 0
def check(name, cond, detail=""):
    global ok, fail
    if cond:
        ok += 1; print("  \u2713 " + name)
    else:
        fail += 1; print("  \u2717 " + name + "  " + str(detail))

def call(method, path, body=None):
    req = urllib.request.Request(
        BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read().decode()
            return r.status, (json.loads(raw) if raw.strip() else {})
    except urllib.error.HTTPError as e:
        return e.code, {}
    except Exception as e:
        return -1, {"error": str(e)}


def main():
    # 状态文件快照：任何「清理」动作都不应改变它们
    watched = ["analysis_prefs.json", "session_prefs.json", "templates.json",
               "survey_states.json", "answered_results.json", "gate_blocks.json"]
    before = {}
    for n in watched:
        p = os.path.join(PLUG, n)
        before[n] = os.path.getsize(p) if os.path.exists(p) else None

    print("════ ① 两个端点均已删除 ════")
    for path in ("/question-modal/cache-info", "/question-modal/cache-purge"):
        st, _ = call("GET", path)
        check("GET %s → 已移除（404/405）" % path, st in (404, 405), st)
        st2, _ = call("POST", path, {"names": ["gate_blocks.json"]})
        check("POST %s → 已移除（404/405）" % path, st2 in (404, 405), st2)

    print("════ ② 状态文件未被误删 ════")
    for n in watched:
        p = os.path.join(PLUG, n)
        after = os.path.getsize(p) if os.path.exists(p) else None
        check("状态文件 %s 完好" % n, after == before[n], (before[n], after))

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
