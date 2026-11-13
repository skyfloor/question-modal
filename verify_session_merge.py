# -*- coding: utf-8 -*-
"""会话设置保存：合并语义（2026-11-04 修「保存后被强制成默认值」）。

真机打后端，验证：
  [M1] 单键保存不得抹掉其它已存覆盖  ← 核心（用户报的 bug）
  [M2] 多次单键保存后，所有键仍在
  [M3] 显式传 null 可删掉单个键
  [M4] 空 settings 仍能清空整条（旧语义保留）
  [M5] /session-prefs/clear 清空整条
  [M6] 全局默认全程不被会话保存污染
  [M7] 清理后全局仍未变
  [M8] 前端 cfgSave **只写改动的键**（源码断言；2026-11-13 最小覆盖裁定）
  [M9] 反证：旧版「双保险」写法必须被判为不合格（防止回归）
"""
import json, os, sys, urllib.request

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
SP = "/app/working/plugins/question-modal/session_prefs.json"
GP = "/app/working/plugins/question-modal/analysis_prefs.json"

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

def sess():
    try:
        with open(SP, encoding="utf-8") as f:
            return json.load(f).get("sessions", {})
    except Exception:
        return {}

def chat():
    return list(sess().keys())[0] if sess() else ""

def glob_sig():
    with open(GP, encoding="utf-8") as f:
        g = json.load(f)
    return {k: g.get(k) for k in ("mode", "model_id", "with_context", "parallel")}

CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"

def reset(vals):
    """直接写文件（不走 chat()——空文件时 chat() 会读失败）。"""
    payload = {"sessions": {CHAT: vals} if vals else {}, "updated_at": 1}
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, SP)

def main():
    g0 = glob_sig()
    print("  全局基线:", json.dumps(g0, ensure_ascii=False))

    # ── [M1] 核心：单键保存不得抹掉其它键 ──
    reset({"mode": "manual", "model_id": "openai:gpt-4o",
           "template_id": "builtin-default", "with_context": True, "parallel": True})
    before = dict(sess()[chat()])
    print("\n  保存前:", json.dumps(before, ensure_ascii=False))
    post("/api/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG, "settings": {"wait_hint_sec": 200}})
    after = dict(sess()[chat()])
    print("  只存 wait_hint_sec 后:", json.dumps(after, ensure_ascii=False))
    for k, v in before.items():
        ck("[M1] 单键保存后 %s 仍保留=%r" % (k, v), after.get(k) == v, after.get(k))
    ck("[M1b] 新键已写入", after.get("wait_hint_sec") == 200, after.get("wait_hint_sec"))

    # ── [M2] 连续多次单键保存 ──
    reset({})
    for k, v in (("mode", "ai"), ("model_id", "wd:deepseek-v4-pro"),
                 ("parallel", True), ("with_context", True)):
        post("/api/question-modal/session-prefs",
             {"session_id": SID, "agent_id": AG, "settings": {k: v}})
    acc = sess()[chat()]
    print("\n  四次单键保存后:", json.dumps(acc, ensure_ascii=False))
    ck("[M2] 四次单键保存后四项齐全",
       acc.get("mode") == "ai" and acc.get("model_id") == "wd:deepseek-v4-pro"
       and acc.get("parallel") is True and acc.get("with_context") is True,
       json.dumps(acc, ensure_ascii=False))

    # ── [M3] 显式 null 删单键 ──
    post("/api/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG, "settings": {"parallel": None}})
    a3 = sess()[chat()]
    print("  传 parallel=null 后:", json.dumps(a3, ensure_ascii=False))
    ck("[M3] 显式 null 删掉该键", "parallel" not in a3, a3)
    ck("[M3b] 其它键不受影响",
       a3.get("mode") == "ai" and a3.get("model_id") == "wd:deepseek-v4-pro", a3)

    # ── [M4] 空 settings 清空整条（旧语义） ──
    post("/api/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG, "settings": {}})
    ck("[M4] 空 settings 清空整条覆盖", chat() == "" or not sess(), sess())

    # ── [M5] /session-prefs/clear ──
    post("/api/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG, "settings": {"mode": "ai", "parallel": True}})
    had = bool(sess())
    # 2026-11-13：清空属破坏性操作，后端已加 confirm 门（缺 confirm → 400）。
    # 测试原未跟上门控 → 请求 400 抛异常。过期用例，补 confirm:true。
    r = post("/api/question-modal/session-prefs/clear",
             {"session_id": SID, "agent_id": AG, "confirm": True})
    print("\n  clear 返回:", json.dumps(r, ensure_ascii=False))
    ck("[M5] clear 端点清空整条", not sess(), sess())
    ck("[M5b] clear 报告原先有无覆盖", r.get("cleared") == had, r)

    # ── [M6] 全局未被污染 ──
    ck("[M6] 全程全局默认未变", glob_sig() == g0,
       "before=%s after=%s" % (json.dumps(g0), json.dumps(glob_sig())))

    # ── 清理 ──
    #
    # ⚠️ 2026-11-13：这里曾经写 `settings={"mode": "manual"}`「恢复」，但那会**
    # 真的留下一条 mode=manual 的会话覆盖**（污染生产数据：用户裁定的目标态是
    # 「没有会话模式的会话一律无覆盖、跟随全局」）。清理必须走 /clear 端点删掉
    # 整条，而不是写一个值。
    post("/api/question-modal/session-prefs/clear",
         {"chat_id": "0489fc54-8a83-4621-984b-0239e944bfc7", "confirm": True})
    print("\n  已清空本会话覆盖（恢复为「跟随全局默认」）:", json.dumps(sess(), ensure_ascii=False))
    ck("[M7] 清理后全局仍未变", glob_sig() == g0, "")
    ck("[M7b] 清理后本会话无任何覆盖（跟随全局）",
       "0489fc54-8a83-4621-984b-0239e944bfc7" not in sess(), sess())

    # ── [M8] 前端 cfgSave 只写「真实改动的键」（2026-11-13 最小覆盖裁定）──
    #
    # 用户报的现象：默认模式把所有会话都改成了默认值，连已配会话模式的也一样。
    # 根因是 cfgSave 里有一段「双保险」把 SESSION_KEYS 的全部生效值塞进 patch，
    # 于是点一次保存（哪怕什么都没改）就把该会话固化成 5 项覆盖、不再跟随全局。
    #
    # 这条断言钉死：cfgSave 体内**不得**再出现「遍历 SESSION_KEYS 补全 patch」，
    # 提交体只能来自 settingsState.draft。
    src = open("/app/working/build/question-modal-dev/src/index.tsx", encoding="utf-8").read()
    i = src.find("async function cfgSave()")
    assert i != -1, "cfgSave 未找到"
    body = src[i:i + 4000]
    # 到下一个顶层函数声明为止
    j = body.find("async function ", 10)
    if j != -1:
        body = body[:j]
    has_key_loop = "SESSION_KEYS.forEach" in body
    ck("[M8] cfgSave 不再遍历 SESSION_KEYS 补全 patch（最小覆盖）",
       not has_key_loop, "仍存在 SESSION_KEYS.forEach → 会被固化成全量覆盖")

    # ── [M9] 反证：把旧写法塞回去必须被 M8 判为不合格 ──
    broken = body.replace(
        "settingsState.saving = true;",
        "SESSION_KEYS.forEach((k) => { patch[k] = 1; });\n  settingsState.saving = true;", 1)
    ck("[M9] 反证：旧「双保险」写法会被 M8 判不合格（用例真的有效）",
       "SESSION_KEYS.forEach" in broken and "SESSION_KEYS.forEach" not in body,
       "反证注入失败，M8 可能是假绿")

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
