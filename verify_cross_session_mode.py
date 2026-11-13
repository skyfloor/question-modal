# -*- coding: utf-8 -*-
"""复现用户 2026-11-13 报告的场景：
  1. 会话1 运行模式为「会话模式」，点击保存
  2. 会话2 运行模式为「默认模式」，点击保存
  3. 会话1 也变成默认模式了

本脚本只做**只读取证**（不改代码、不弹窗），用真实后端复现并定性。

同时回答用户的第 4 个问题：
  在会话模式下修改「全局配置 / 提示词」是否也会覆盖？

断言方向（先取证，不预设立场）：
  [R1] 会话1 保存「会话模式」后，session_prefs 里是否有会话1 的条目
  [R2] 会话2 保存「默认模式」后，会话1 的条目是否被删除/串改
  [R3] 「运行模式」胶囊的显示值来源 = scopeChoice（编辑页签）还是 has_session（真实状态）
  [R4] /global 与 /templates 写入是否触碰 session_prefs
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
TP = PLUG + "/templates.json"
AG = "wb74Jn"
C1 = "0489fc54-8a83-4621-984b-0239e944bfc7"
C2 = "348b16bc-64f8-42ab-becc-88d6d0e47745"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def api(path, method="GET", body=None):
    url = BASE + "/api/question-modal" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json",
                                          "X-Agent-Id": AG})
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


def eff(chat):
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(chat) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"mode": c.get("mode"), "has_session": d.get("has_session"),
            "src": c.get("__sources__") or {}}


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    b_tp = open(TP, encoding="utf-8").read() if os.path.exists(TP) else None
    try:
        print("=" * 66)
        print("第一部分：请用户描述的场景能否复现")
        print("=" * 66)

        g = rd(GP); g["mode"] = "manual"; wr(GP, g)
        wr(SP, {"sessions": {}, "updated_at": 1})

        # 步骤 1：会话1 在「会话模式」页保存 mode=ai
        print("\n[步骤1] 会话1 · 会话模式页 · 保存 mode=ai")
        st, d = api("/session-prefs", "POST", {
            "chat_id": C1, "session_id": "", "agent_id": AG,
            "settings": {"mode": "ai"},
        })
        e1 = eff(C1)
        sess = rd(SP).get("sessions") or {}
        print("    写入:", st, " stored:", d.get("stored"))
        print("    会话1 生效:", e1)
        print("    session_prefs 条目:", list(sess.keys()))
        ck("[R1a] 会话1 有覆盖条目", C1 in sess, list(sess.keys()))
        ck("[R1b] 会话1 has_session=true", e1["has_session"] is True, e1["has_session"])
        ck("[R1c] 会话1 mode=ai", e1["mode"] == "ai", e1["mode"])

        # 步骤 2：会话2 在「默认模式」页保存（写全局）
        print("\n[步骤2] 会话2 · 默认模式页 · 保存全局 mode=manual")
        st, d = api("/prefs", "POST", {"mode": "manual"})
        e1b = eff(C1)
        e2 = eff(C2)
        sess2 = rd(SP).get("sessions") or {}
        print("    全局写入:", st, " 全局 mode:", rd(GP).get("mode"))
        print("    会话1 生效:", e1b)
        print("    会话2 生效:", e2)
        print("    session_prefs 条目:", list(sess2.keys()))

        ck("[R2a] 会话1 的覆盖仍在（未被会话2 删除）", C1 in sess2, list(sess2.keys()))
        ck("[R2b] 会话1 mode 仍是 ai（未被全局覆盖）", e1b["mode"] == "ai", e1b["mode"])
        ck("[R2c] 会话1 has_session 仍为 true", e1b["has_session"] is True,
           e1b["has_session"])
        ck("[R2d] 会话2 仍无覆盖（默认模式）", e2["has_session"] is False,
           e2["has_session"])

        print("\n  → 数据层结论: 上面的后端行为是「隔离正确」的。")
        print("     若用户看到「会话1 变成默认模式」，问题在**前端显示**，")
        print("     而不是保存数据被串改。详见第二部分。")

        print("\n" + "=" * 66)
        print("第二部分：为什么界面会显示「会话1 也变成默认模式」")
        print("=" * 66)
        src = open("/app/working/build/question-modal-dev/src/index.tsx",
                   encoding="utf-8").read()
        # 关键：runtimeLabel 的取值来源
        i = src.find('const currentScope = props.scopeChoice === "session"')
        assert i > 0, "runtimeLabel source not found"
        seg = src[max(0, i - 700):i + 400]
        print("\n  「当前运行」胶囊的判定代码：")
        for ln in seg.split("\n"):
            if ("hasSess" in ln or "currentScope" in ln
                    or "runtimeLabel" in ln or "scopeChoice" in ln):
                print("    " + ln.strip())
        ck("[R3a] 显示值取 scopeChoice（编辑页签）而非 has_session（真实状态）",
           "props.scopeChoice" in seg and "currentScope = props.scopeChoice" in seg,
           "")
        ck("[R3b] 算出 hasSess 但未用于标签",
           "const hasSess" in seg and "runtimeLabel" in seg
           and "hasSess ?" not in seg, "")

        print("\n  → 根因: 胶囊显示的是「你正在编辑哪个页签」，")
        print("     不是「这个会话实际按哪套配置运行」。")
        print("     scopeChoice 存在 localStorage（qm:v1:scopeChoice），")
        print("     **跨会话共享**：在会话2 选了默认模式，切回会话1 仍显示默认模式。")

        print("\n" + "=" * 66)
        print("第三部分：会话模式下改「全局配置 / 提示词」是否覆盖会话数据")
        print("=" * 66)
        sp_before = json.dumps(rd(SP), sort_keys=True)
        st1, _ = api("/prefs", "POST", {
            "gate_log_limit": 200, "notify_manual_mode": True,
            "wait_hint_sec": 180, "model_timeout_sec": 120,
        })
        sp_mid = json.dumps(rd(SP), sort_keys=True)
        st2, _ = api("/templates", "POST", {
            "id": "probe-cov-tpl", "name": "覆盖探针",
            "system": "返回 JSON {choice,confidence,reasoning}",
            "user": "{question}",
        })
        sp_after = json.dumps(rd(SP), sort_keys=True)

        print("    写全局配置:", st1, " 写模板:", st2)
        ck("[R4a] 写 /prefs（全局配置）不改 session_prefs",
           sp_before == sp_mid, "changed")
        ck("[R4b] 写 /templates（提示词）不改 session_prefs",
           sp_mid == sp_after, "changed")
        ck("[R4c] 会话1 覆盖仍完好",
           C1 in (rd(SP).get("sessions") or {}), list((rd(SP).get("sessions") or {}).keys()))

        # 清理探针模板
        try:
            req = urllib.request.Request(
                BASE + "/api/question-modal/templates/probe-cov-tpl",
                method="DELETE", headers={"X-Agent-Id": AG})
            urllib.request.urlopen(req, timeout=15)
        except Exception:
            pass
    finally:
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)
        if b_tp is not None:
            with open(TP, "w", encoding="utf-8") as f:
                f.write(b_tp)
        print("\n已恢复 session_prefs / analysis_prefs / templates")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
