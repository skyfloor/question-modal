"""定点验证：卡片挂载不得把后端真实 mode 覆盖成内建默认 manual。

这是 2026-11-07 用真机复现、并用 harness [BI] 组钉住的 bug：
  卡片挂载时 anMode 初值 = "manual"（保守默认），真实模式要等
  /effective-config 落地。上报 effect 若不设闸门，就会把 manual 发给后端，
  **静默覆盖**用户设置的 ai / recommend。

判据：设后端 mode=ai → 卡片挂载 → 等一切 settle → 后端 mode 必须仍是 ai。
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


def main():
    tag = "call_p1mode_%d" % int(time.time())
    # 会话覆盖设成 ai（模拟用户配了自动分析）
    post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                            "settings": {"mode": "ai"}})
    eff = get("/effective-config", chat_id=CHAT_ID, session_id=SID, agent_id=AG)
    backend_mode = (eff.get("config") or {}).get("mode")
    print(f"[准备] /effective-config 的 mode = {backend_mode}")
    ck("[0] 后端生效模式确实是 ai", backend_mode == "ai", backend_mode)

    # 预置问卷 state 的 mode 也是 ai
    post("/survey-action", {"tool_call_id": tag, "action": "set_mode",
                            "payload": {"mode": "ai"}})
    before = (get("/survey-state", tool_call_id=tag).get("state") or {}).get("mode")
    ck("[1] 问卷 state 的 mode 初始是 ai", before == "ai", before)

    html = os.path.join(PLUG, "dist", "__p1mode.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1mode.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)
            pg.evaluate("(c)=>window.__mount(c)", tag)
            # 充分等待：快照 + effective-config + 所有上报 effect 都跑完
            pg.wait_for_timeout(3500)

            after = (get("/survey-state", tool_call_id=tag).get("state") or {}).get("mode")
            print(f"[挂载后] 问卷 state 的 mode = {after}")
            ck("[2] 卡片挂载后 mode 未被降级成 manual（核心断言）",
               after == "ai", {"before": before, "after": after})

            acts = pg.evaluate("()=>window.__REQ.filter(r=>r.key==='/survey-action'"
                               "&&JSON.stringify(r.body||{}).includes('set_mode'))")
            print(f"[set_mode 上报] {json.dumps(acts, ensure_ascii=False)[:180]}")
            bad = [a for a in acts if ((a.get("body") or {}).get("payload") or {}).get("mode") == "manual"]
            ck("[3] 没有把 manual 回写给后端", not bad, bad)
            ck("[4] 零 pageerror", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(html)
        except OSError:
            pass
        post("/survey-action", {"tool_call_id": tag, "action": "release",
                                "payload": {"by": "cleanup"}})
        # 还原会话模式（不把测试用的 ai 留给用户）
        post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                                "settings": {"mode": "manual"}})

    print(f"\n结果: {ok} 通过 / {fail} 失败")
    return 0 if fail == 0 else 1


    _prune_test_state("call_p1mode_")

if __name__ == "__main__":
    sys.exit(main())
