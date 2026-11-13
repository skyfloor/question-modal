# -*- coding: utf-8 -*-
"""复现用户报告（第三轮，原话）：
  「保存逻辑还是：当前的模式已经不生效了，某个会话的配置的会话模式，
    将所有的会话的配置都修改，默认模式也一样，覆盖所有的配置」

注意症状与我上轮修的不同：
  · 上轮修的是「整批固化」→ 只让**本会话**被钉死
  · 用户这次说的是「**所有会话**都被改」→ 这是另一条链路

本脚本用纯 HTTP 复现，逐个入口试探「改一个会话，别的会话会不会跟着变」：
  ① 设置面板「会话模式」页 → POST /session-prefs
  ② 设置面板「默认模式」页 → POST /prefs
  ③ 卡片模式切换 → POST /session-prefs（chat_id="" + session_id 反查）

判据：任意一次写操作后，**未被指定的那个 chat** 的 effective 值发生变化 = 污染。

安全：全程备份 session_prefs / analysis_prefs，结束原样恢复。
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

# 两个真实 chat（各自 session_id 唯一）
A = {"chat": "0489fc54-8a83-4621-984b-0239e944bfc7", "sid": "1791724819571-muuetab",
     "name": "问卷弹窗插件的开发与发版"}
B = {"chat": "348b16bc-64f8-42ab-becc-88d6d0e47745", "sid": "1794410957635-v0mrkpr",
     "name": "2题问卷测试"}

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


def eff(chat, sid=""):
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(chat) + "&session_id=" + urllib.parse.quote(sid)
         + "&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"mode": c.get("mode"), "model": c.get("model_id"),
            "ctx": c.get("with_context"), "par": c.get("parallel"),
            "has_session": d.get("has_session"),
            "sources": c.get("__sources__") or {}}


def snap():
    return {"A": eff(A["chat"], A["sid"]), "B": eff(B["chat"], B["sid"])}


def show(tag, s):
    print("    %s" % tag)
    for k in ("A", "B"):
        v = s[k]
        print("      %s %-28s mode=%-9s model=%-24s ctx=%-5s par=%-5s has_sess=%s"
              % (k, "", v["mode"], str(v["model"])[:24], v["ctx"], v["par"],
                 v["has_session"]))


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


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    try:
        # 干净基线：无覆盖，全局 manual
        g = rd(GP)
        g["mode"] = "manual"
        wr(GP, g)
        wr(SP, {"sessions": {}, "updated_at": 1})

        print("\n===== 基线 =====")
        s0 = snap()
        show("初始", s0)

        # ══════════ ① 会话 A 的「会话模式」页：只改 mode ══════════
        print("\n===== ① 会话A 设置面板·会话模式页：改 mode=ai =====")
        st, d = api("/session-prefs", "POST", {
            "chat_id": A["chat"], "session_id": A["sid"], "agent_id": AG,
            "settings": {"mode": "ai"},
        })
        print("    status:", st, " stored:", d.get("stored"))
        s1 = snap()
        show("写后", s1)
        ck("[①-1] A 的 mode 变为 ai（本会话生效）", s1["A"]["mode"] == "ai", s1["A"]["mode"])
        ck("[①-2] B 的 mode 不受影响（仍 manual）", s1["B"]["mode"] == "manual", s1["B"]["mode"])
        ck("[①-3] B 仍 has_session=false", s1["B"]["has_session"] is False,
           s1["B"]["has_session"])
        raw = rd(SP).get("sessions") or {}
        ck("[①-4] 只有 A 一条覆盖", list(raw.keys()) == [A["chat"]], list(raw.keys()))
        ck("[①-5] A 的覆盖里只有 mode", sorted(raw.get(A["chat"], {}).keys()) == ["mode"],
           sorted(raw.get(A["chat"], {}).keys()))

        # ══════════ ② 会话 B 的「会话模式」页：改 mode=recommend ══════════
        print("\n===== ② 会话B 设置面板·会话模式页：改 mode=recommend =====")
        st, d = api("/session-prefs", "POST", {
            "chat_id": B["chat"], "session_id": B["sid"], "agent_id": AG,
            "settings": {"mode": "recommend"},
        })
        print("    status:", st, " stored:", d.get("stored"))
        s2 = snap()
        show("写后", s2)
        ck("[②-1] B 的 mode 变为 recommend", s2["B"]["mode"] == "recommend", s2["B"]["mode"])
        ck("[②-2] A 的 mode 仍是 ai（未被 B 覆盖）", s2["A"]["mode"] == "ai", s2["A"]["mode"])
        raw = rd(SP).get("sessions") or {}
        ck("[②-3] 两个会话各自一条覆盖、互不干扰",
           set(raw.keys()) == {A["chat"], B["chat"]}, list(raw.keys()))

        # ══════════ ③ 卡片模式切换路径（chat_id="" + session_id 反查）══════════
        print("\n===== ③ 卡片模式切换：chat_id='' + session_id 反查 =====")
        st, d = api("/session-prefs", "POST", {
            "chat_id": "", "session_id": A["sid"], "agent_id": AG,
            "settings": {"mode": "manual"},
        })
        print("    status:", st, " chat_id:", d.get("chat_id"), " stored:", d.get("stored"))
        s3 = snap()
        show("写后", s3)
        ck("[③-1] 反查命中 A（不是 B）", d.get("chat_id") == A["chat"], d.get("chat_id"))
        ck("[③-2] A 变 manual", s3["A"]["mode"] == "manual", s3["A"]["mode"])
        ck("[③-3] B 仍是 recommend（未被牵连）", s3["B"]["mode"] == "recommend",
           s3["B"]["mode"])

        # ══════════ ④ 空 settings（保存时无改动）══════════
        print("\n===== ④ 会话B 空 settings 保存（无改动点保存）=====")
        st, d = api("/session-prefs", "POST", {
            "chat_id": B["chat"], "session_id": B["sid"], "agent_id": AG,
            "settings": {},
        })
        print("    status:", st, " stored:", d.get("stored"))
        s4 = snap()
        show("写后", s4)
        raw = rd(SP).get("sessions") or {}
        ck("[④-1] 空 settings 只清掉 B 自己的覆盖", B["chat"] not in raw, list(raw.keys()))
        ck("[④-2] A 的覆盖仍在", A["chat"] in raw, list(raw.keys()))
        ck("[④-3] B 回落到全局 manual", s4["B"]["mode"] == "manual", s4["B"]["mode"])
        ck("[④-4] A 仍是 manual（本会话值）", s4["A"]["mode"] == "manual", s4["A"]["mode"])

        # ══════════ ⑤ 默认模式页写全局 ══════════
        print("\n===== ⑤ 默认模式页：全局 mode=ai =====")
        st, d = api("/prefs", "POST", {"mode": "ai"})
        print("    status:", st)
        s5 = snap()
        show("写后", s5)
        ck("[⑤-1] 全局写入成功", st == 200, st)
        ck("[⑤-2] 无覆盖的 B 跟随全局变 ai", s5["B"]["mode"] == "ai", s5["B"]["mode"])
        ck("[⑤-3] 有覆盖的 A 仍保留 manual（覆盖优先）", s5["A"]["mode"] == "manual",
           s5["A"]["mode"])

    finally:
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)
        print("\n已恢复 session_prefs.json / analysis_prefs.json")

    print("\nRESULT:", "ALL PASS（后端未复现污染）" if fail == 0
          else "HAS FAILURES (%d) —— 后端确实会串会话" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
