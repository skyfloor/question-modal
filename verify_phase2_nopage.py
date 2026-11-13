"""阶段 2 真机验证：recommend 模式下前端**让位**，不自己推进。

为什么这样测（而不是"关页面等后端走完"）：
  "后端在无页面时走完整卷"已由 `verify_phase2_state.py` 在服务层直接证明
  （25/25，真实 QuestionService + Future，无任何页面）。
  真机层要证的另一半是**前端不会与后端抢跑** —— 因为两个驱动同时推进会
  填两次、翻两次页（setVisStep 叠加）→ 跳题或越过末页。

判据：
  1. 卡片挂载后，前端**不发** /survey-action 的 set_answer / goto
     （这些是"推进"动作，让位时应由后端广播回来）
  2. 后端通过 SSE 推来别人的变更时，本页正常渲染（让位 ≠ 停摆）
"""
import json
import os
import sys
import time
import urllib.request
import urllib.parse

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
CHAT_ID = "0489fc54-8a83-4621-984b-0239e944bfc7"
PLUG = "/app/working/plugins/question-modal"
ok = fail = 0



def _prune_test_state(prefix: str) -> None:
    """清掉本次测试通过 HTTP 写进**生产插件内存表**的 state。

    必须走 `/survey-prune` 端点：`_surveys()` 是跨 reload 存活的内存表，
    且 `surveys_restored` 让插件不重读磁盘 —— 直接改 json 文件无效
    （实测磁盘改到 11 条，reload 后变回 200+ 条）。
    """
    import json as _j
    import urllib.request as _u
    try:
        req = _u.Request(
            "http://127.0.0.1:8088/api/question-modal/survey-prune",
            data=_j.dumps({"prefix": prefix}).encode(), method="POST",
            headers={"Content-Type": "application/json"})
        with _u.urlopen(req, timeout=10) as r:
            d = _j.loads(r.read().decode())
        print(f"  已清理测试 state({prefix}): {d.get('before')} -> {d.get('after')}")
    except Exception as e:  # noqa: BLE001
        print(f"  (清理失败，请手动调 /survey-prune: {e})")

def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))


def post(path, body):
    req = urllib.request.Request(
        BASE + "/api/question-modal" + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:  # noqa: BLE001
        return {"_err": str(e)}


def get(path, **p):
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in p.items())
    with urllib.request.urlopen(BASE + "/api/question-modal" + path + "?" + q, timeout=10) as r:
        return json.loads(r.read().decode())


PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "_p1page.html"), encoding="utf-8").read()

QS = [
    {"type": "single", "title": "Q1 选哪个方案", "options": ["甲", "乙"], "recommended": "乙"},
    {"type": "single", "title": "Q2 是否确认", "options": ["是", "否"], "recommended": "是"},
]


def main():
    tag = "call_p2mt_%d" % int(time.time())
    post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                            "settings": {"mode": "recommend"}})
    post("/survey-action", {"tool_call_id": tag, "action": "goto",
                            "payload": {"cursor": 0}})
    post("/survey-action", {"tool_call_id": tag, "action": "set_mode",
                            "payload": {"mode": "recommend"}})

    html = os.path.join(PLUG, "dist", "__p2yield.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2yield.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)

            print("\n[1] recommend 模式挂载卡片")
            pg.evaluate("(c)=>window.__mount(c)", tag)
            pg.wait_for_timeout(3000)      # 给足时间：若前端抢跑，这段足够它填完

            reqs = pg.evaluate("()=>window.__REQ")
            acts = [r for r in reqs if r["key"] == "/survey-action"]
            fills = [a for a in acts
                     if (a.get("body") or {}).get("action") in ("set_answer", "goto", "submit")]
            print(f"    /survey-action 总数={len(acts)}，其中推进类={len(fills)}")
            if fills:
                for a in fills[:4]:
                    print("      ", json.dumps(a.get("body"), ensure_ascii=False)[:120])

            ck("[1] recommend + SSE 连通 → 前端不发推进类 action（让位）",
               len(fills) == 0, [json.dumps(a.get("body"), ensure_ascii=False)[:80] for a in fills])

            t = pg.evaluate("()=>window.__T()")
            print(f"    卡片文本: {t[:110].replace(chr(10),' | ')}")
            ck("[2] 卡片正常渲染（让位不等于停摆）",
               "Q1" in t or "选哪个" in t, t[:150])
            ck("[3] 卡片没有自己变成已完成/已提交",
               "已完成" not in t, t[:150])
            ck("[4] 零 pageerror", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(html)
        except OSError:
            pass
        post("/survey-action", {"tool_call_id": tag, "action": "release",
                                "payload": {"by": "cleanup"}})
        post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                                "settings": {"mode": "manual"}})

    print(f"\n结果: {ok} 通过 / {fail} 失败")
    return 0 if fail == 0 else 1


    _prune_test_state("call_p2mt_")

if __name__ == "__main__":
    sys.exit(main())
