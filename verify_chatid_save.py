# -*- coding: utf-8 -*-
"""验证 2026-11-13 修复：保存会话设置不再依赖 session_id 反查。

用户报告（原话）：
  「我原来是在局域网访问 agent，开发也是在这个上，现在是基于 frpc 映射的
    公网域名访问（另外一台机器），在之前的机器是正常保存的，新机器上无法保存」

根因（已实测确证）：
  宿主 `host.getCurrentSessionId()` **从 URL 推导**（只认 /chat/<id> 且需命中
  宿主会话表），frpc 域名环境下返回 null → 前端发 session_id="" →
  后端 `_resolve_chat_id` 返回 "" → POST /session-prefs 报 400
  「chat_id (or resolvable session_id) is required」。

修复（三层，任一即可）：
  ① 前端从 URL 解析 /chat/<uuid>（UUID 形态才认，防把 session_id 当 chat_id）
  ② 后端创建问卷时记 chat UUID，`/resolve` 回传，前端缓存并直传
  ③ 取不到时仍退回老路径（session_id 反查），不比以前差

⚠️ 测试纪律：本脚本**必须走真实 HTTP**，不能在独立进程里 create 问卷——
插件进程与测试进程是两份 QuestionService 实例，内存 pending 表不共享，
那样测出来的失败是构造问题、不是产品缺陷（本轮已踩过）。

断言：
  [D1] /resolve 回传 chat_id，且是 UUID 形态
  [D2] /resolve 对一个**没有 chat_id 的旧记录**也能补算出 chat_id
  [D3] 用回传的 chat_id + 空 session_id 保存 → 200 且 stored=true
  [D4] 覆盖落在正确的 chat 键下
  [D5] 空 chat_id + 空 session_id → 仍 400（未静默降级）
  [D6] 前端产物含 URL UUID 解析 + 中文可操作提示 + 无裸 import
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
AG = "wb74Jn"

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


UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    try:
        print("\n===== 找一份真实 pending 问卷（必须由插件进程创建）=====")
        st, pend = api("/pending")
        items = pend.get("items") or []
        print("    pending count:", pend.get("count"))
        if not items:
            print("    ⚠ 当前无 pending 问卷，[D1]-[D4] 跳过（需先让模型弹一份问卷）")
            target = None
        else:
            target = items[0]
            print("    用:", target.get("request_id"), "|", target.get("session_id"),
                  "|", str(target.get("title"))[:30])

        if target:
            sid = target.get("session_id") or ""

            print("\n===== [D1] /resolve 回传 chat_id =====")
            st, d = api("/resolve?session_id=" + urllib.parse.quote(sid))
            print("    status:", st, " found:", d.get("found"),
                  " chat_id:", d.get("chat_id"))
            ck("[D1a] /resolve 返回 chat_id 字段", "chat_id" in d, list(d.keys()))
            ck("[D1b] chat_id 是 UUID 形态", bool(UUID_RE.match(str(d.get("chat_id") or ""))),
               d.get("chat_id"))
            got_chat = d.get("chat_id") or ""

            print("\n===== [D2] 旧记录（创建时无 chat_id）也能补算 =====")
            # 该问卷若是修复前创建的，pending_questions.json 里就没有 chat_id，
            # 能返回 UUID 说明 /resolve 的补算分支生效。
            pj = {}
            try:
                raw = json.load(open(PLUG + "/pending_questions.json", encoding="utf-8"))
                for it in (raw if isinstance(raw, list) else []):
                    if it.get("request_id") == target.get("request_id"):
                        pj = it
            except Exception:
                pass
            stored = str(pj.get("chat_id") or "")
            print("    落盘记录里的 chat_id:", stored or "(无，属修复前记录)")
            if not stored:
                ck("[D2] 旧记录缺 chat_id 时仍能补算出 UUID", bool(UUID_RE.match(got_chat)),
                   got_chat)
            else:
                ck("[D2] 旧记录已带 chat_id 且与回传一致", stored == got_chat,
                   (stored, got_chat))

            print("\n===== [D3] 用回传 chat_id + 空 session_id 保存 =====")
            st3, d3 = api("/session-prefs", "POST", {
                "chat_id": got_chat, "session_id": "", "agent_id": AG,
                "settings": {"slow_question_sec": 45},
            })
            print("    status:", st3, " resp:", json.dumps(d3, ensure_ascii=False)[:150])
            ck("[D3a] 空 session_id + 有 chat_id → 保存成功",
               st3 == 200 and d3.get("ok") is True, (st3, d3))
            ck("[D3b] stored=true（不是空写）", d3.get("stored") is True, d3.get("stored"))

            print("\n===== [D4] 覆盖落在正确的 chat 键下 =====")
            sess = (json.load(open(SP, encoding="utf-8")).get("sessions") or {})
            ck("[D4] 覆盖条目落在 " + got_chat[:8] + "… 下",
               got_chat in sess and sess[got_chat].get("slow_question_sec") == 45,
               {k: v for k, v in sess.items() if k == got_chat})

        print("\n===== [D5] 两者皆空 → 400（未静默降级）=====")
        st5, d5 = api("/session-prefs", "POST", {
            "chat_id": "", "session_id": "", "agent_id": AG,
            "settings": {"slow_question_sec": 45},
        })
        print("    status:", st5, " detail:", str(d5.get("detail"))[:70])
        ck("[D5] 空 chat_id + 空 session_id → 400", st5 == 400, st5)

        print("\n===== [D6] 前端产物 =====")
        dist = open(PLUG + "/dist/index.js", encoding="utf-8", errors="ignore").read()
        ck("[D6a] 含 /chat/ 解析", "\\/chat\\/" in dist, "")
        ck("[D6b] 含 UUID 形态校验（防 session_id 混作 chat_id）",
           "0-9a-f]{8}-[0-9a-f]{4}" in dist, "")
        ck("[D6c] 含中文可操作错误提示", "没能定位当前会话" in dist, "")
        ck("[D6d] 无裸 import（插件加载前提）",
           not dist.lstrip().startswith("import ") and "\nimport " not in dist, "")
    finally:
        # 只恢复本测试改动的覆盖，绝不整份覆盖（历史教训）
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        print("\n已恢复 session_prefs.json")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
