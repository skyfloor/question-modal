# -*- coding: utf-8 -*-
"""需求 1-5 的实现验证（2026-11-13 用户裁定）。

用户需求：
  1. 配置以后台保存的数据为准，不以本地为准
  2. 同一会话多处写入 → 提示会被覆盖，以最后一次为准
  3. 会话模式数据各自会话隔离保存
  4. 默认模式不污染会话数据，隔离保存
  5. 全局参数（全局/提示词）独立保存，作为基础数据对两种模式生效

本轮改动：
  · 前端删除 SESSION_KEYS 整批固化（需求 3/4）
  · 后端加 _PREFS_LOCK 串行化「读-改-写」（需求 2 前提：最后写者必须基于
    最新磁盘状态，否则是「随机丢写」而非「后写为准」）
  · 后端新增逐键时间戳 __keyts__ + conflicts 返回（需求 2 提示）
  · _session_writable 放行 __keyts__（否则时间戳被 sanitize 丢掉）

断言：
  [A1] 只提交 1 个键 → 落盘只有 1 个键（需求 3 核心）
  [A2] 该会话未改的键继续跟随全局（需求 4 核心）
  [A3] 另一个会话完全不受影响（需求 3 隔离）
  [A4] 默认模式（/prefs）不写 session_prefs（需求 4）
  [A5] 全局参数对无覆盖会话生效（需求 5）
  [A6] 并发 20 次写不同键 → 全部保留（需求 2：无丢失更新）
  [A7] seen 早于实际 → 返回 conflicts（需求 2 提示数据源）
  [A8] 不带 seen → conflicts 为空（卡片即时切换不产生噪音提示）
  [A9] __keyts__ 被持久化且含刚写入的键
  [A10] 模板库独立文件，不受 prefs 写入影响（需求 5）
"""
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"
TP = PLUG + "/templates.json"
AG = "wb74Jn"
A = "0489fc54-8a83-4621-984b-0239e944bfc7"
B = "348b16bc-64f8-42ab-becc-88d6d0e47745"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def api(path, method="GET", body=None, timeout=20):
    url = BASE + "/api/question-modal" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json",
                                          "X-Agent-Id": AG})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
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


def strip_meta(d):
    return {k: v for k, v in (d or {}).items()
            if k not in ("updated_at", "__keyts__")}


def eff(chat):
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(chat) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"mode": c.get("mode"), "model": c.get("model_id"),
            "ctx": c.get("with_context"), "par": c.get("parallel"),
            "has_session": d.get("has_session"),
            "src": c.get("__sources__") or {}}


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    b_tp = open(TP, encoding="utf-8").read() if os.path.exists(TP) else None
    try:
        # 干净基线
        g = rd(GP); g["mode"] = "manual"; g["model_id"] = "base:model"
        g["with_context"] = False; g["parallel"] = False
        wr(GP, g)
        wr(SP, {"sessions": {}, "updated_at": 1})

        print("\n===== [A1][A3] 只改 1 项 → 只落 1 个键 =====")
        st, d = api("/session-prefs", "POST", {
            "chat_id": A, "session_id": "", "agent_id": AG,
            "settings": {"mode": "ai"},
        })
        print("    status:", st, " stored:", d.get("stored"))
        sess = rd(SP).get("sessions") or {}
        keysA = sorted(strip_meta(sess.get(A) or {}).keys())
        print("    A 覆盖键:", keysA)
        ck("[A1] 只改 mode 时覆盖只有 mode（无整批固化）", keysA == ["mode"], keysA)
        ck("[A3a] 只有 A 有覆盖，B 无", list(sess.keys()) == [A], list(sess.keys()))

        print("\n===== [A2] A 未改的键继续跟随全局 =====")
        eA = eff(A)
        print("    A:", eA)
        ck("[A2a] A 的 mode 是覆盖值 ai", eA["mode"] == "ai", eA["mode"])
        ck("[A2b] A 的 model 来自全局 base:model", eA["model"] == "base:model", eA["model"])
        ck("[A2c] __sources__ 只有 mode 是 session",
           eA["src"].get("mode") == "session" and "model_id" not in eA["src"], eA["src"])

        print("\n===== [A3b] 另一个会话不受影响 =====")
        eB = eff(B)
        print("    B:", eB)
        ck("[A3b] B has_session=false", eB["has_session"] is False, eB["has_session"])
        ck("[A3c] B mode 跟随全局 manual", eB["mode"] == "manual", eB["mode"])

        print("\n===== [A4] 默认模式不写 session_prefs =====")
        sp_before = json.dumps(rd(SP), sort_keys=True)
        st, d = api("/prefs", "POST", {"mode": "recommend"})
        sp_after = json.dumps(rd(SP), sort_keys=True)
        ck("[A4a] POST /prefs 成功", st == 200, st)
        ck("[A4b] session_prefs 逐字节未变", sp_before == sp_after, "changed")
        ck("[A4c] 全局 mode 已变 recommend",
           rd(GP).get("mode") == "recommend", rd(GP).get("mode"))

        print("\n===== [A5] 全局对无覆盖会话生效 =====")
        eB2 = eff(B)
        eA2 = eff(A)
        ck("[A5a] B（无覆盖）跟随全局 → recommend", eB2["mode"] == "recommend",
           eB2["mode"])
        ck("[A5b] A（有覆盖）仍保持自己的 ai", eA2["mode"] == "ai", eA2["mode"])

        print("\n===== [A6] 并发 17 次写不同键 → 无丢失 =====")
        wr(SP, {"sessions": {}, "updated_at": 1})
        # ⚠️ 2026-11-14 修正：这里原来含 `notify_manual_mode`，但它是
        # **global-only 键**（SETTINGS_SCHEMA 里 scope="global"），
        # `_session_writable` 会**按设计拒绝**把它写进会话覆盖 ——
        # 于是「所有键都在」恒不成立（少了它），属用例过期而非产品缺陷。
        # 并发丢键检查必须只用可写进会话层（scope="both"）的键。
        keys = ["mode", "model_id", "template_id", "with_context", "parallel",
                "show_recommend_badge", "gate_unsaved", "slow_question_sec",
                "skip_mode", "badge_position", "badge_style",
                "highlight_recommended", "auto_number_options", "fallback_title",
                "wait_hint_sec", "model_timeout_sec"]
        results = []

        def worker(k):
            val = {"mode": "ai", "model_id": "c:model", "template_id": "tpl-c",
                   "with_context": True, "parallel": True,
                   "show_recommend_badge": False, "gate_unsaved": False,
                   "slow_question_sec": 30, "skip_mode": "whole",
                   "badge_position": "right", "badge_style": "round",
                   "highlight_recommended": True, "auto_number_options": False,
                   "fallback_title": False,
                   "wait_hint_sec": 60, "model_timeout_sec": 300}[k]
            results.append(api("/session-prefs", "POST", {
                "chat_id": B, "session_id": "", "agent_id": AG,
                "settings": {k: val},
            })[0])

        ths = [threading.Thread(target=worker, args=(k,)) for k in keys]
        for t in ths:
            t.start()
        for t in ths:
            t.join()
        sess = rd(SP).get("sessions") or {}
        got = set(strip_meta(sess.get(B) or {}).keys())
        print("    期望键数:", len(keys), " 实际:", len(got))
        print("    缺失:", sorted(set(keys) - got))
        ck("[A6a] 20 个并发写全部返回 200", all(c == 200 for c in results), results)
        ck("[A6b] 无丢失更新（所有键都在）", set(keys) <= got,
           sorted(set(keys) - got))

        print("\n===== [A7][A8] conflicts 判定 =====")
        wr(SP, {"sessions": {}, "updated_at": 1})
        # 先写一次，拿到 keyts
        st, d1 = api("/session-prefs", "POST", {
            "chat_id": A, "session_id": "", "agent_id": AG,
            "settings": {"mode": "manual"},
        })
        ts1 = (d1.get("key_ts") or {}).get("mode", 0)
        print("    第一次写入 mode ts:", ts1)
        time.sleep(0.05)
        # 另一个「窗口」在不知情的情况下改了同一键
        api("/session-prefs", "POST", {
            "chat_id": A, "session_id": "", "agent_id": AG,
            "settings": {"mode": "recommend"},
        })
        time.sleep(0.05)
        # 本窗口带着「我看过的旧 ts」再写 → 应报冲突
        st, d2 = api("/session-prefs", "POST", {
            "chat_id": A, "session_id": "", "agent_id": AG,
            "seen": {"mode": ts1},
            "settings": {"mode": "ai"},
        })
        conf = d2.get("conflicts") or []
        print("    conflicts:", json.dumps(conf, ensure_ascii=False)[:200])
        ck("[A7a] 返回 conflicts 列表", isinstance(conf, list), type(conf).__name__)
        ck("[A7b] 检出 mode 冲突", any(c.get("key") == "mode" for c in conf),
           [c.get("key") for c in conf])
        ck("[A7c] 冲突项含被覆盖的旧值 recommend",
           any(c.get("previous") == "recommend" for c in conf), conf)
        ck("[A7d] 后写仍生效（mode=ai）",
           strip_meta((rd(SP).get("sessions") or {}).get(A) or {}).get("mode") == "ai",
           (rd(SP).get("sessions") or {}).get(A))

        st, d3 = api("/session-prefs", "POST", {
            "chat_id": A, "session_id": "", "agent_id": AG,
            "settings": {"with_context": True},
        })
        ck("[A8] 不带 seen → conflicts 为空", (d3.get("conflicts") or []) == [],
           d3.get("conflicts"))

        print("\n===== [A9] __keyts__ 持久化 =====")
        raw = (rd(SP).get("sessions") or {}).get(A) or {}
        kts = raw.get("__keyts__")
        print("    __keyts__:", json.dumps(kts, ensure_ascii=False))
        ck("[A9a] 落盘含 __keyts__ 且是对象", isinstance(kts, dict), type(kts).__name__)
        ck("[A9b] 含刚写入的 with_context", "with_context" in (kts or {}), list((kts or {}).keys()))
        ck("[A9c] __keyts__ 不污染 __sources__",
           "__keyts__" not in (eff(A)["src"] or {}), eff(A)["src"])

        print("\n===== [A10] 模板库独立 =====")
        tp_before = json.dumps(rd(TP), sort_keys=True)
        api("/prefs", "POST", {"mode": "ai"})
        api("/session-prefs", "POST", {
            "chat_id": B, "session_id": "", "agent_id": AG,
            "settings": {"template_id": "tpl-x"},
        })
        tp_after = json.dumps(rd(TP), sort_keys=True)
        ck("[A10] prefs 写入不影响 templates.json", tp_before == tp_after, "changed")
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
