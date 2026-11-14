# -*- coding: utf-8 -*-
"""会话跟随修错（2026-11-04）：跟对层级 + 空值不得冻死跟随。

两个已确诊 bug：
  Bug1 「跟随当前对话模型」读的是 agent.json 的 active_model（agent 级），
        而界面/宿主定义的是 chats.json 的 runtime_context.model（会话级）。
        实测两者不同：会话 wd:deepseek-v4.1-flash vs agent sensenova:deepseek-flash。
  Bug2 空串 model_id 被写成会话覆盖并被标成 session，使该键永久钉死，
        后再也不会跟随。来源=前端「双保险」照搬空值。

  [F1] effective-config 的 model_id == 会话级模型（与界面一致）
  [F2] 该值来自会话级而非 agent 级（两者不同时必须取会话级）
  [F3] 跟随值不产生 session 覆盖标记
  [F4] 保存空串不落成覆盖
  [F5] 保存后仍能跟随（不被冻死）
  [F6] 前端源码：双保险整批固化**已被删除**（2026-11-13 裁定，防回归重引）
"""
import json, os, sys, urllib.request

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
SP = "/app/working/plugins/question-modal/session_prefs.json"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
HERE = os.path.dirname(os.path.abspath(__file__))

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def post(path, body):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
                               headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(r, timeout=20).read())

def eff():
    u = BASE + "/api/question-modal/effective-config?session_id=%s&agent_id=%s" % (SID, AG)
    return json.loads(urllib.request.urlopen(u, timeout=20).read())["config"]

def global_file():
    """全局默认（analysis_prefs.json）——「跟随」是否生效取决于它是否为空。"""
    try:
        with open("/app/working/plugins/question-modal/analysis_prefs.json", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def sess():
    try:
        with open(SP, encoding="utf-8") as f:
            return json.load(f).get("sessions", {})
    except Exception:
        return {}

def set_sess(vals):
    payload = {"sessions": {CHAT: vals} if vals else {}, "updated_at": 1}
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, SP)

def main():
    # 会话级 vs agent 级两个真实值
    sys.path.insert(0, "/app/venv/lib/python3.11/site-packages")
    from qwenpaw.services.session_thinking import session_model
    with open("/app/working/workspaces/wb74Jn/chats.json", encoding="utf-8") as f:
        d = json.load(f)
    items = d if isinstance(d, list) else (d.get("chats") or [])
    meta = {}
    for c in items:
        if c.get("id") == CHAT:
            meta = c.get("meta") or {}
    slot = session_model(meta)
    want = "%s:%s" % (slot.provider_id, slot.model) if slot else ""
    agent_cfg = json.load(open("/app/working/workspaces/wb74Jn/agent.json", encoding="utf-8"))
    am = agent_cfg.get("active_model") or {}
    agent_val = "%s:%s" % (am.get("provider_id"), am.get("model")) if am else ""
    print("  会话级(runtime_context.model) =", want)
    print("  agent 级(active_model)        =", agent_val)
    print("  两者是否不同 =", want != agent_val, "(不同时才能区分 bug)")

    # ── [F1][F2] 跟随到会话级 ──
    set_sess({})           # 干净状态
    c = eff()
    print("\n  无覆盖时 model_id =", repr(c.get("model_id")))
    # 「跟随」只在**全局未显式配置**时才发生（plugin.py:504 的设计：
    # 全局有值就是用户选的，不该被对话模型覆盖）。所以断言要按全局是否为空
    # 分支——旧写法写死「必须跟随」，用户一旦在设置里配了全局模型就假失败
    # （2026-11-05 实测：全局是 wd2:deepseek-v4.1-flash 时误报）。
    g_model = str((global_file() or {}).get("model_id") or "")
    if g_model:
        ck("[F1] 全局已显式配置 → model_id 回落到全局值（不跟随）",
           c.get("model_id") == g_model,
           "global=%r got=%r" % (g_model, c.get("model_id")))
        ck("[F3b] 全局已配置 → __follow_active__ 为假（未跟随）",
           c.get("__follow_active__") is not True, c.get("__follow_active__"))
    else:
        ck("[F1] model_id == 会话级模型", c.get("model_id") == want,
           "want=%r got=%r" % (want, c.get("model_id")))
        ck("[F3b] __follow_active__ 为真", c.get("__follow_active__") is True, c.get("__follow_active__"))
    ck("[F2] 不是 agent 级模型（层级正确）",
       bool(g_model) or want == agent_val or c.get("model_id") != agent_val,
       "agent=%r got=%r" % (agent_val, c.get("model_id")))
    ck("[F3] 跟随值不标 session 覆盖",
       (c.get("__sources__") or {}).get("model_id") != "session",
       c.get("__sources__"))

    # ── [F4] 保存空串不落成覆盖 ──
    post("/api/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG,
          "settings": {"model_id": "", "mode": "manual"}})
    s4 = sess().get(CHAT, {})
    print("\n  保存 model_id='' 后落盘 =", json.dumps(s4, ensure_ascii=False))
    ck("[F4] 空串未落成覆盖", "model_id" not in s4, s4)
    ck("[F4b] 同批的 mode 正常写入", s4.get("mode") == "manual", s4)

    # ── [F5] 保存空串后：该键没有被冻成空覆盖，仍按「全局/跟随」正常解析 ──
    # 断言分支同 [F1]：全局有值时回落到全局值是正确行为（跟随只在全局为空时发生）。
    c5 = eff()
    if g_model:
        ck("[F5] 保存空串后不被冻死（回落到全局值，未被冻成空覆盖）",
           c5.get("model_id") == g_model and c5.get("model_id") != "",
           "global=%r got=%r" % (g_model, c5.get("model_id")))
    else:
        ck("[F5] 保存后仍跟随会话模型（未被冻死）",
           c5.get("model_id") == want and c5.get("__follow_active__") is True,
           "got=%r follow=%r" % (c5.get("model_id"), c5.get("__follow_active__")))
    ck("[F5b] 仍不标 session",
       (c5.get("__sources__") or {}).get("model_id") != "session", c5.get("__sources__"))

    # ── [F6] 前端源码：确认「双保险整批固化」**已被删除**（2026-11-13 裁定）──
    #
    # 这两条原断言 'v === ""' / '__follow_active__' 出现在 cfgSave 段内 ——
    # 但那段「会话保存时把其余 SESSION_KEYS 的当前生效值一并塞进 patch」的
    # 双保险代码，已被用户 2026-11-13 裁定**整体删除**。
    # 删除理由（src/index.tsx 内有原文注释）：它把会话固化成 5 项完整覆盖，
    # 之后改「默认模式」该会话再也看不到变化 —— 正是用户报的
    # 「某个会话一改，所有会话都跟着变」的根因。
    #
    # 所以正确判据**反转**：这些痕迹必须**不存在**，防止有人把固化逻辑
    # 再加回来（那会重演旧缺陷）。
    with open(os.path.join(HERE, "src/index.tsx"), encoding="utf-8") as f:
        tsx = f.read()
    i = tsx.find("async function cfgSave")
    seg = tsx[i:i + 2600] if i > 0 else ""
    ck("[F6] 双保险整批固化已删除（不再有跳过空串的特判）",
       'v === ""' not in seg and "v === ''" not in seg, seg[:150])
    ck("[F7] 双保险整批固化已删除（不再有 __follow_active__ 特判）",
       'k === "model_id" && followModel' not in seg, seg[:150])

    # ── 清理 ──
    set_sess({"mode": "manual"})
    print("\n  已恢复:", json.dumps(sess(), ensure_ascii=False))
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
