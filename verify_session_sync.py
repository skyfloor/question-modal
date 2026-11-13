# -*- coding: utf-8 -*-
"""真机：卡片改设置后，设置面板「当前会话」页能否看到同一个值。

裁定 q2：「卡片改了 → 设置面板『当前会话』页立即同步显示」。
这不是靠前端猜——两处都从同一个后端 `/effective-config` 取值，
所以只要证明「卡片写进会话覆盖 → effective-config 立刻返回新值」，同步就成立。
"""
import json, sys
import urllib.request

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))


def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=20).read())


def get(path):
    return json.loads(urllib.request.urlopen(BASE + path, timeout=20).read())


def eff():
    return get("/api/question-modal/effective-config?session_id=%s&agent_id=%s" % (SID, AG))


def sess_file():
    with open("/app/working/plugins/question-modal/session_prefs.json", encoding="utf-8") as f:
        return json.load(f)


def global_file():
    with open("/app/working/plugins/question-modal/analysis_prefs.json", encoding="utf-8") as f:
        return json.load(f)


def main():
    g0 = global_file()
    g0s = {k: g0.get(k) for k in ("mode", "model_id", "with_context", "parallel")}
    print("  全局初始:", json.dumps(g0s, ensure_ascii=False))

    # ── 模拟「卡片上改模型 + 打开上下文 + 并行」──
    r = post("/api/question-modal/session-prefs",
             {"session_id": SID, "agent_id": AG,
              "settings": {"model_id": "openai:gpt-4o-mini",
                           "with_context": True, "parallel": True}})
    ck("[S1] 会话覆盖写入成功", r.get("stored") is True, r)

    e = eff(); c = e.get("config", {})
    ck("[S2] 卡片端生效（effective-config 返回新 model_id）",
       c.get("model_id") == "openai:gpt-4o-mini", c.get("model_id"))
    ck("[S3] with_context 生效", c.get("with_context") is True, c.get("with_context"))
    ck("[S4] parallel 生效（裁定乙：并行也进会话级）",
       c.get("parallel") is True, c.get("parallel"))

    # 设置面板与卡片读同一来源 → 同步成立
    ck("[S5] 设置面板值 = 卡片值（同一 /effective-config，天然同步）",
       c.get("model_id") == "openai:gpt-4o-mini"
       and c.get("with_context") is True and c.get("parallel") is True,
       json.dumps({k: c.get(k) for k in ("model_id", "with_context", "parallel")}, ensure_ascii=False))

    # 全局绝不能被改
    g1 = global_file()
    g1s = {k: g1.get(k) for k in ("mode", "model_id", "with_context", "parallel")}
    ck("[S6] 【关键】全局默认完全没被污染", g1s == g0s,
       "before=%s after=%s" % (json.dumps(g0s), json.dumps(g1s)))

    # 会话覆盖确实落到 chat UUID 键下
    sf = sess_file().get("sessions", {})
    key = [k for k, v in sf.items() if v.get("model_id") == "openai:gpt-4o-mini"]
    ck("[S7] 覆盖落在 chat UUID 键下（不是 session_id 字面）",
       len(key) == 1 and "-" in key[0] and len(key[0]) > 20, key)
    ck("[S8] 覆盖键 ≠ session_id 字面（说明后端做了反查）",
       SID not in sf, list(sf.keys())[:2])

    # ── 清理 ──
    import io, os
    P = "/app/working/plugins/question-modal/session_prefs.json"
    d = json.load(io.open(P, encoding="utf-8"))
    for k in list(d.get("sessions", {})):
        if d["sessions"][k].get("model_id") == "openai:gpt-4o-mini":
            d["sessions"].pop(k)
    tmp = P + ".tmp"
    io.open(tmp, "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, indent=2))
    os.replace(tmp, P)
    e2 = eff(); c2 = e2.get("config", {})
    # 清理会话覆盖后的回落目标取决于「全局 model_id 是否为空」，两种都正确：
    #   • 全局为空  → 服务端解析成「跟随当前对话模型」，__follow_active__=True
    #   • 全局有值  → 回落到那个全局值，__follow_active__=False（用户显式配过）
    # 旧断言写死「必须 follow=True」，一旦用户真的在设置里配了全局模型就会假失败
    # （2026-11-05 实测：全局是 qoder:DeepSeek-Flash 时误报）。
    g_model = str(global_file().get("model_id") or "")
    if g_model:
        ck("[S9] 全局已显式配置 → 清理后回落到该全局值（非 follow）",
           c2.get("model_id") == g_model and c2.get("__follow_active__") is not True,
           "global=%r got=%r follow=%r" % (g_model, c2.get("model_id"), c2.get("__follow_active__")))
    else:
        ck("[S9] 全局为空 → 清理后解析成「跟随当前对话模型」",
           c2.get("__follow_active__") is True and ":" in str(c2.get("model_id") or ""),
           "model_id=%r follow=%r" % (c2.get("model_id"), c2.get("__follow_active__")))
    ck("[S10] 清理后全局仍是你原来的值",
       {k: global_file().get(k) for k in ("mode", "model_id", "with_context", "parallel")} == g0s,
       "")

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
