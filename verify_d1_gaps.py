# -*- coding: utf-8 -*-
"""验证 D1 五项遗漏修复（2026-11-13 用户裁定「全修」）。

用户发现的问题：是否还有其他遗漏没处理？
排查出 5 处，已全部修复：

  ① __sources__ 未尊重 active_scope
     切默认模式后生效值已回落全局，sources 仍标 session → UI 显示
     「此项已被会话覆盖」，显示与事实不符。
  ② 卡片即时操作不发送 set_scope
     靠「有记录无标记→视为 session」的兼容分支碰巧对，严格判定后会失效。
  ③ /session-prefs 列表把「只有标记」的记录当成有效覆盖（误导排查）。
  ⑤ 历史兼容分支歧义：只含内部字段的记录被误判为会话模式（用户选「严格」）。
  ⑥ clear 端点破坏性操作无确认门槛（与「切模式」语义相邻，易误用）。

断言：
  [G1] 会话模式：__sources__ 标 session
  [G2] 切默认模式：__sources__ **不再**标 session（① 核心）
  [G3] 切默认模式：生效值来自全局
  [G4] 切回会话模式：__sources__ 恢复标 session
  [G5] 只有 __keyts__ 的记录 → 视为 default（⑤ 严格判定）
  [G6] 只有真实值项、无标记的记录 → 视为 session（兼容历史数据）
  [G7] 列表端点返回 active_scope 字段（③）
  [G8] clear 不带 confirm → 400
  [G9] clear 带 confirm → 成功删除
  [G10] 卡片路径带 set_scope=session → 真正生效（② 的后端侧验证）
"""
import json
import os
import sys
import urllib.error
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
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}


def eff():
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(CHAT) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"model": c.get("model_id"), "has": d.get("has_session"),
            "scope": d.get("active_scope"), "src": c.get("__sources__") or {}}


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    try:
        wr(GP, {"mode": "manual", "model_id": "global:model",
                "template_id": "g-tpl", "with_context": False,
                "parallel": False, "updated_at": 1})

        # ═══ [G1][G2][G3][G4] ① __sources__ 尊重 active_scope ═══
        print("\n===== ① __sources__ 与 active_scope 一致 =====")
        wr(SP, {"sessions": {}, "updated_at": 1})
        api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                               "set_scope": "session",
                               "settings": {"model_id": "session:model"}})
        e1 = eff()
        print("    会话模式:", e1)
        ck("[G1] 会话模式：sources 标 model_id=session",
           e1["src"].get("model_id") == "session", e1["src"])
        ck("[G1b] 生效值是会话值", e1["model"] == "session:model", e1["model"])

        api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                               "set_scope": "default", "settings": {}})
        e2 = eff()
        print("    默认模式:", e2)
        ck("[G2] ★ 切默认后 sources 不再标 session（① 核心）",
           "model_id" not in e2["src"], e2["src"])
        ck("[G3] 切默认后生效值来自全局", e2["model"] == "global:model", e2["model"])

        api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                               "set_scope": "session", "settings": {}})
        e3 = eff()
        print("    切回会话模式:", e3)
        ck("[G4] 切回后 sources 恢复标 session",
           e3["src"].get("model_id") == "session", e3["src"])
        ck("[G4b] 切回后值是会话值（数据未丢）",
           e3["model"] == "session:model", e3["model"])

        # ═══ [G5][G6] ⑤ 严格判定 ═══
        print("\n===== ⑤ 历史数据严格判定 =====")
        wr(SP, {"sessions": {CHAT: {"__keyts__": {"mode": 1.0}}}, "updated_at": 1})
        e5 = eff()
        print("    只有 __keyts__:", e5)
        ck("[G5] 只有内部字段 → 视为 default",
           e5["has"] is False and e5["scope"] == "default", (e5["has"], e5["scope"]))

        wr(SP, {"sessions": {CHAT: {"model_id": "legacy:model"}}, "updated_at": 1})
        e6 = eff()
        print("    有真实值项无标记:", e6)
        ck("[G6] 有真实值项无标记 → 视为 session（兼容历史）",
           e6["has"] is True and e6["scope"] == "session", (e6["has"], e6["scope"]))
        ck("[G6b] 历史数据仍生效", e6["model"] == "legacy:model", e6["model"])

        # ═══ [G7] ③ 列表端点带 active_scope ═══
        print("\n===== ③ 列表端点 =====")
        st, lst = api("/session-prefs")
        items = lst.get("sessions") or []
        me = [x for x in items if x.get("chat_id") == CHAT]
        print("    本会话条目:", json.dumps(me[:1], ensure_ascii=False)[:160])
        ck("[G7a] 列表可达", st == 200, st)
        ck("[G7b] 条目含 active_scope 字段",
           bool(me) and "active_scope" in me[0], me[:1])
        ck("[G7c] 条目含 active 布尔",
           bool(me) and "active" in me[0], me[:1])

        # ═══ [G8][G9] ⑥ clear 需 confirm ═══
        print("\n===== ⑥ clear 破坏性确认 =====")
        st8, d8 = api("/session-prefs/clear", {"chat_id": CHAT})
        print("    不带 confirm:", st8)
        ck("[G8] 不带 confirm → 400", st8 == 400, st8)
        ck("[G8b] 错误提示说明如何切模式",
           "set_scope" in json.dumps(d8, ensure_ascii=False),
           str(d8)[:120])
        ck("[G8c] 数据未被删除（拒绝生效）",
           CHAT in (rd(SP).get("sessions") or {}),
           list((rd(SP).get("sessions") or {}).keys()))

        st9, d9 = api("/session-prefs/clear", {"chat_id": CHAT, "confirm": True})
        print("    带 confirm:", st9, d9)
        ck("[G9] 带 confirm → 成功", st9 == 200 and d9.get("ok") is True, (st9, d9))
        ck("[G9b] 数据已删除",
           CHAT not in (rd(SP).get("sessions") or {}),
           list((rd(SP).get("sessions") or {}).keys()))

        # ═══ [G10] ② 卡片路径（带 set_scope=session）═══
        print("\n===== ② 卡片即时操作路径 =====")
        wr(SP, {"sessions": {}, "updated_at": 1})
        api("/session-prefs", {"chat_id": "", "session_id": "1791724819571-muuetab",
                               "agent_id": AG, "set_scope": "session",
                               "settings": {"model_id": "card:picked"}})
        e10 = eff()
        print("    卡片改模型后:", e10)
        ck("[G10a] 卡片操作带上 set_scope 后真正生效",
           e10["model"] == "card:picked" and e10["scope"] == "session", e10)
        ck("[G10b] sources 标 session", e10["src"].get("model_id") == "session",
           e10["src"])
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
