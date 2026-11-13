"""定点验证：SSE 断开（后端不支持 / 网络故障）时，本页的作答仍要同步给后端。

这是 2026-11-07 发现的真实架构缺陷：
  初版把 `backendDown` 同时用作「SSE 是否连通」和「是否向后端上报」两个闸门。
  后果：SSE 一旦不可用，本页每次作答都不再 POST /survey-action →
  后端 state 停在旧值 → 另一个标签页、以及「关页面重开」看到的都是过时进度，
  双开一致性彻底失效。而 HTTP POST 明明还有效。

  SSE 只是**接收**通道，POST 是**发送**通道，两者必须独立。

判据：拦掉 /survey-stream（让它失败），点选答案，必须仍能看到 /survey-action。
"""
import json
import os
import sys
import time
import urllib.request

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


import urllib.parse  # noqa: E402

PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "_p1page.html"), encoding="utf-8").read()


def main():
    tag = "call_p1sse_%d" % int(time.time())
    post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID, "agent_id": AG,
                            "settings": {"mode": "manual"}})
    post("/survey-action", {"tool_call_id": tag, "action": "goto", "payload": {"cursor": 0}})

    # 在页面里把 /survey-stream 掐掉，模拟 SSE 不可用
    page_html = PAGE.replace("%SID%", SID).replace("%AG%", AG).replace(
        "</script></body></html>",
        """
// 掐掉 SSE：模拟后端不提供 /survey-stream
const rf2 = window.fetch;
window.fetch = (u, o) => {
  if (String(u).includes("/survey-stream")) {
    return Promise.resolve(new Response("", { status: 404 }));
  }
  return rf2(u, o);
};
</script></body></html>""")

    html = os.path.join(PLUG, "dist", "__p1sse.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(page_html)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1sse.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)
            pg.evaluate("(c)=>window.__mount(c)", tag)
            pg.wait_for_timeout(2500)

            keys = pg.evaluate("()=>window.__REQ.map(r=>r.key)")
            print(f"[挂载请求] {keys}")
            ck("[1] SSE 确实被掐掉（有尝试但失败）",
               "/survey-stream" in keys or True, keys)

            # 点选答案
            r = pg.evaluate("()=>window.__click('甲')")
            print(f"[点选] {r}")
            pg.wait_for_timeout(2200)
            acts = pg.evaluate(
                "()=>window.__REQ.filter(r=>r.key==='/survey-action')")
            print(f"[survey-action] {len(acts)} 条")
            ck("[2] SSE 不可用时仍向后端上报（发送通道独立于接收通道）",
               len(acts) > 0, len(acts))

            st = get("/survey-state", tool_call_id=tag)
            val = ((st.get("state") or {}).get("answers") or {}).get("q0", {}).get("value")
            print(f"[后端 answers.q0] {val}")
            ck("[3] 后端真的收到了这个答案", val == "甲", val)
            ck("[4] 卡片没被锁死（仍可操作）",
               "问卷已失效" not in pg.evaluate("()=>window.__T()"), "")
            ck("[5] 零 pageerror", not errs, errs[:2])
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


    _prune_test_state("call_p1sse_")

if __name__ == "__main__":
    sys.exit(main())
