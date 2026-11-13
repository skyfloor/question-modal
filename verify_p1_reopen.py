"""定点验证：前进到第 2 题后关掉页面重开，进度是否保持。

这是「关闭会话窗口后重开不会卡顿、不会回到起点」这条用户诉求的最小判据。
单独成文件，避免被大套件里的其它交互干扰。
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
    tag = "call_p1v8_%d" % int(time.time())
    post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                            "settings": {"mode": "manual"}})
    post("/survey-action", {"tool_call_id": tag, "action": "goto", "payload": {"cursor": 0}})
    post("/survey-action", {"tool_call_id": tag, "action": "set_answer",
                            "payload": {"key": "q0",
                                        "answer": {"type": "single", "value": "甲"}}})

    html = os.path.join(PLUG, "dist", "__p1v8.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            # ① 打开，前进到第 2 题
            pg = b.new_page()
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1v8.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)
            pg.evaluate("(c)=>window.__mount(c)", tag)
            pg.wait_for_timeout(2200)
            print("[起始]", pg.evaluate("()=>window.__T()")[:60].replace("\n", " | "))
            pg.evaluate("()=>window.__click('下一步')")
            pg.wait_for_timeout(1800)
            t2 = pg.evaluate("()=>window.__T()")
            step2 = pg.evaluate(
                "()=>{const t=document.getElementById('host').innerText||'';"
                "const m=t.match(/(\\d+)\\s*\\/\\s*(\\d+)/);return m?m[1]+'/'+m[2]:'?';}")
            print(f"[前进后] step={step2}  {t2[:70].replace(chr(10),' | ')}")
            ck("[1] 前进到第 2 题", step2.startswith("2"), step2)
            st = get("/survey-state", tool_call_id=tag)
            ck("[2] 后端 cursor 也是 1", (st.get("state") or {}).get("cursor") == 1,
               (st.get("state") or {}).get("cursor"))

            # ② 关掉页面
            pg.close()
            time.sleep(1.0)

            # ③ 重开（新页面，无本地缓存依赖）
            pg2 = b.new_page()
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1v8.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready===true", timeout=30000)
            pg2.evaluate("(c)=>window.__mount(c)", tag)
            pg2.wait_for_timeout(2500)
            t3 = pg2.evaluate("()=>window.__T()")
            step3 = pg2.evaluate(
                "()=>{const t=document.getElementById('host').innerText||'';"
                "const m=t.match(/(\\d+)\\s*\\/\\s*(\\d+)/);return m?m[1]+'/'+m[2]:'?';}")
            print(f"[重开后] step={step3}  {t3[:80].replace(chr(10),' | ')}")
            ck("[3] 重开后仍停在第 2 题（进度未回退）", step3.startswith("2"),
               {"step": step3, "text": t3[:160]})
            # 第 2 题页面上本来就不显示第 1 题的选项，所以不能按文本找"甲"。
            # 正确判据：回退到第 1 题看它是否仍被选中（答案只在渲染那一题时可见）。
            pg2.evaluate("()=>window.__click('上一步')")
            pg2.wait_for_timeout(1500)
            t4 = pg2.evaluate("()=>window.__T()")
            print(f"[回退看答案] {t4[:80].replace(chr(10),' | ')}")
            ck("[4] 第 1 题的答案仍在（回退后可见选中态）",
               "✓ 1. 甲" in t4 or "✓ 甲" in t4, t4[:200])
            b.close()
    finally:
        try:
            os.remove(html)
        except OSError:
            pass
        post("/survey-action", {"tool_call_id": tag, "action": "release",
                                "payload": {"by": "cleanup"}})

    print(f"\n结果: {ok} 通过 / {fail} 失败")
    return 0 if fail == 0 else 1


    _prune_test_state("call_p1v8_")

if __name__ == "__main__":
    sys.exit(main())
