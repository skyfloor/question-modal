# -*- coding: utf-8 -*-
"""验证方案 D1：来回切换模式**不丢数据**（2026-11-13 用户裁定）。

用户原话（问题）：
  「会话模式的五项是会话模式的数据，默认模式的五项是默认模式的数据，
    2者不产生影响，如果当前模式从会话模式改成了默认模式，这种情况当前的
    处理方式是什么，以及如果从默认模式切换到会话模式的时候，数据怎么处理」

用户裁定：
  q0 = 切换到默认模式时【保留】会话自定义数据，只标记「当前用默认」，
       切回来数据原样恢复（方案 D1）
  q1 = 会话模式的数据 = 会话页五项 + 全局配置 + 提示词
  q2 = 本轮只修「切回会话模式后数据丢失」

断言：
  [D1] 会话模式写入自定义 5 项 → 生效值来自会话层
  [D2] 切到默认模式 → 生效值变为全局值，且 has_session=false
  [D3] **关键**：切到默认模式后，磁盘上会话自定义数据仍然存在（只是不生效）
  [D4] 切回会话模式 → 自定义 5 项原样恢复（数据没丢）
  [D5] 零改动切到会话模式（此前完全没设过）→ 不写入任何值项，
       只有标记；未设置的键继续跟随全局
  [D6] active_scope 字段随切换正确变化
  [D7] 清空端点仍能真正删除数据（与"切模式"语义区分开）
"""
import json
import os
import sys
import urllib.request

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"
AG = "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def rd(p):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def wr(p, d):
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False)
    os.replace(tmp, p)


def api(path, body=None):
    url = BASE + "/api/question-modal" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if body is not None else "GET",
        headers={"Content-Type": "application/json", "X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or "{}")


def eff():
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(CHAT) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"mode": c.get("mode"), "model": c.get("model_id"),
            "tpl": c.get("template_id"), "ctx": c.get("with_context"),
            "par": c.get("parallel"),
            "has": d.get("has_session"), "scope": d.get("active_scope")}


def ov():
    """本会话磁盘上的覆盖（去掉内部标记）。"""
    s = (rd(SP).get("sessions") or {}).get(CHAT) or {}
    return {k: v for k, v in s.items()
            if k not in ("updated_at", "__keyts__", "__active_scope__")}


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    try:
        # 基线
        wr(GP, {"mode": "manual", "model_id": "global:model",
                "template_id": "global-tpl", "with_context": False,
                "parallel": False, "updated_at": 1})
        wr(SP, {"sessions": {}, "updated_at": 1})

        print("\n===== [D1] 会话模式写入 5 项自定义 =====")
        api("/session-prefs", {
            "chat_id": CHAT, "session_id": "", "agent_id": AG,
            "set_scope": "session",
            "settings": {"mode": "ai", "model_id": "session:model",
                         "template_id": "session-tpl", "with_context": True,
                         "parallel": True},
        })
        e1 = eff()
        print("    生效:", e1)
        print("    磁盘覆盖:", json.dumps(ov(), ensure_ascii=False))
        ck("[D1a] 生效值来自会话层", e1["mode"] == "ai" and e1["model"] == "session:model",
           (e1["mode"], e1["model"]))
        ck("[D1b] has_session=true", e1["has"] is True, e1["has"])
        ck("[D1c] active_scope=session", e1["scope"] == "session", e1["scope"])
        ck("[D1d] 磁盘有 5 项自定义", len(ov()) == 5, sorted(ov().keys()))

        print("\n===== [D2][D3] 切到默认模式（关键：数据不能丢）=====")
        api("/session-prefs", {
            "chat_id": CHAT, "session_id": "", "agent_id": AG,
            "set_scope": "default", "settings": {},
        })
        e2 = eff()
        print("    生效:", e2)
        print("    磁盘覆盖:", json.dumps(ov(), ensure_ascii=False))
        ck("[D2a] 生效值变为全局值",
           e2["mode"] == "manual" and e2["model"] == "global:model",
           (e2["mode"], e2["model"]))
        ck("[D2b] has_session=false", e2["has"] is False, e2["has"])
        ck("[D2c] active_scope=default", e2["scope"] == "default", e2["scope"])
        ck("[D3] ★ 磁盘上会话自定义数据仍在（未丢失）", len(ov()) == 5,
           sorted(ov().keys()))
        ck("[D3b] 保留的是原值", ov().get("model") is None and ov().get("model_id") == "session:model",
           ov().get("model_id"))

        print("\n===== [D4] 切回会话模式 → 数据原样恢复 =====")
        api("/session-prefs", {
            "chat_id": CHAT, "session_id": "", "agent_id": AG,
            "set_scope": "session", "settings": {},
        })
        e3 = eff()
        print("    生效:", e3)
        ck("[D4a] mode 恢复为 ai", e3["mode"] == "ai", e3["mode"])
        ck("[D4b] model 恢复为 session:model", e3["model"] == "session:model",
           e3["model"])
        ck("[D4c] template 恢复为 session-tpl", e3["tpl"] == "session-tpl", e3["tpl"])
        ck("[D4d] with_context 恢复为 True", e3["ctx"] is True, e3["ctx"])
        ck("[D4e] parallel 恢复为 True", e3["par"] is True, e3["par"])
        ck("[D4f] active_scope=session", e3["scope"] == "session", e3["scope"])

        print("\n===== [D5] 零改动切会话模式（此前从未设过）=====")
        wr(SP, {"sessions": {}, "updated_at": 1})
        api("/session-prefs", {
            "chat_id": CHAT, "session_id": "", "agent_id": AG,
            "set_scope": "session", "settings": {},
        })
        e5 = eff()
        print("    生效:", e5)
        print("    磁盘覆盖:", json.dumps(ov(), ensure_ascii=False))
        ck("[D5a] has_session=true（模式已切到会话）", e5["has"] is True, e5["has"])
        ck("[D5b] ★ 没有写入任何值项（未钉死全局值）", len(ov()) == 0,
           sorted(ov().keys()))
        ck("[D5c] 未设置的键跟随全局",
           e5["model"] == "global:model" and e5["tpl"] == "global-tpl",
           (e5["model"], e5["tpl"]))

        print("\n===== [D6] 标记随切换变化 =====")
        api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                               "set_scope": "default", "settings": {}})
        ck("[D6a] → default", eff()["scope"] == "default", eff()["scope"])
        api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                               "set_scope": "session", "settings": {}})
        ck("[D6b] → session", eff()["scope"] == "session", eff()["scope"])

        print("\n===== [D7] 清空端点仍能真正删数据（与切模式区分）=====")
        api("/session-prefs", {
            "chat_id": CHAT, "session_id": "", "agent_id": AG,
            "settings": {"mode": "ai", "model_id": "x:y"},
        })
        ck("[D7a] 有覆盖", len(ov()) == 2, sorted(ov().keys()))
        # 2026-11-13 用户裁定 q2：清空是破坏性操作，必须显式 confirm
        r = api("/session-prefs/clear", {"chat_id": CHAT, "confirm": True})
        print("    clear 返回:", json.dumps(r, ensure_ascii=False)[:120])
        ck("[D7b] 清空后覆盖完全消失",
           CHAT not in (rd(SP).get("sessions") or {}),
           list((rd(SP).get("sessions") or {}).keys()))
        ck("[D7c] has_session=false", eff()["has"] is False, eff()["has"])
    finally:
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)
        print("\n已恢复状态文件")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
