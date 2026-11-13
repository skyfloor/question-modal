"""阶段 2 决定性真机验证（可控版）：真实浏览器挂卡 → 立刻关页 → 后端自己走完。

为什么不用"让模型弹问卷"那条路：
  模型弹的问卷，其后端 state 的 mode 来自会话配置的三层解析，而测试脚本
  无法稳定构造出"该 chat 的 mode = recommend"（每次运行都是新会话，
  chat UUID 每次都不同，写覆盖的键与读覆盖的键很难对齐）。
  这条路会把「产品缺陷」和「测试环境构造失败」混在一起，得不出结论。

  而这条诉求的本质是：**问卷进入 recommend 模式后，关掉页面它还要继续推进**。
  所以本脚本用后端 API 精确构造那份 state（mode=recommend + 真实题面含推荐），
  再用**真实 Chromium** 挂载同一张卡片、立刻关页，最后看后端是否自主走完。
  卡片、SSE、后端循环都是真的，只有"问卷怎么创建"是直接调 API。

判据：
  1. 挂卡后前端**不发**推进类 action（让位）
  2. 关页后后端自主把 cursor 推到底、answers 填满、status=submitted
  3. 重开页面看到已完成
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
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


def get(path, **p):
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in p.items())
    with urllib.request.urlopen(BASE + "/api/question-modal" + path + "?" + q, timeout=10) as r:
        return json.loads(r.read().decode())


def post(path, body):
    req = urllib.request.Request(
        BASE + "/api/question-modal" + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:  # noqa: BLE001
        return {"_err": str(e)}


PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "_p1page.html"), encoding="utf-8").read()

QS = [
    {"type": "single", "title": "Q1 选哪个方案", "options": ["甲", "乙"], "recommended": "乙"},
    {"type": "single", "title": "Q2 是否确认", "options": ["是", "否"], "recommended": "是"},
    {"type": "text", "title": "Q3 补充说明", "recommended": "无补充"},
]


def main():
    tag = "call_p2ctl_%d" % int(time.time())

    print("[0] 用后端 API 精确构造 recommend 模式的问卷 state")
    # create 是服务层的；HTTP 侧没有直接建问卷的端点，所以走 svc 的内部端点。
    # 这里有 `/survey-action` 的 set_mode + 一份由测试注入的题面。
    r = post("/survey-state/inject-test", {
        "tool_call_id": tag, "session_id": SID, "agent_id": AG,
        "title": "阶段2关页（可控验证）", "questions": QS, "mode": "recommend",
    })
    print(f"    inject: {json.dumps(r, ensure_ascii=False)[:160]}")
    st0 = get("/survey-state", tool_call_id=tag).get("state") or {}
    ck("[0] state 已就绪", st0.get("found") is not False and st0.get("mode") is not None,
       st0)
    print(f"    status={st0.get('status')} mode={st0.get('mode')} "
          f"cursor={st0.get('cursor')} questions={len(st0.get('questions') or [])}")

    print("\n[1] 打开真实浏览器挂载卡片")
    html = os.path.join(PLUG, "dist", "__p2ctl.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2ctl.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)
            pg.evaluate("(c)=>window.__mount(c)", tag)
            pg.wait_for_timeout(1200)
            t0 = pg.evaluate("()=>window.__T()")
            print(f"    卡片: {t0[:90].replace(chr(10),' | ')}")
            reqs = pg.evaluate("()=>window.__REQ")
            acts = [r for r in reqs if r["key"] == "/survey-action"]
            fills = [a for a in acts if (a.get("body") or {}).get("action")
                     in ("set_answer", "goto", "submit")]
            print(f"    /survey-action={len(acts)}，推进类={len(fills)}")
            ck("[1] 前端让位（不发推进类 action）", len(fills) == 0,
               [json.dumps(a.get("body"), ensure_ascii=False)[:70] for a in fills])

            print("\n[2] ★ 立刻关掉页面，什么都不做，等后端 ★")
            pg.close()

            finished = False
            for i in range(40):
                time.sleep(0.5)
                cur = get("/survey-state", tool_call_id=tag).get("state") or {}
                ans = cur.get("answers") or {}
                print(f"    +{(i+1)*0.5:.1f}s status={cur.get('status')} "
                      f"cursor={cur.get('cursor')} answers={len(ans)}")
                if cur.get("status") == "submitted" or len(ans) >= len(QS):
                    finished = True
                    break

            cur = get("/survey-state", tool_call_id=tag).get("state") or {}
            ans = cur.get("answers") or {}
            print(f"    answers = {json.dumps(ans, ensure_ascii=False)[:300]}")
            ck("[2] 关页后后端自主走完（核心断言）", finished,
               {"status": cur.get("status"), "cursor": cur.get("cursor")})
            ck("[3] Q1 填成推荐「乙」", (ans.get("q0") or {}).get("value") == "乙", ans.get("q0"))
            ck("[4] Q2 填成推荐「是」", (ans.get("q1") or {}).get("value") == "是", ans.get("q1"))
            ck("[5] Q3 填成生成内容", (ans.get("q2") or {}).get("value") == "无补充", ans.get("q2"))
            ck("[6] cursor 推到底", (cur.get("cursor") or 0) >= len(QS), cur.get("cursor"))

            print("\n[3] 重开页面")
            pg2 = b.new_page()
            e2 = []
            pg2.on("pageerror", lambda e: e2.append(str(e)))
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2ctl.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready===true", timeout=30000)
            pg2.evaluate("(c)=>window.__mount(c)", tag)
            pg2.wait_for_timeout(2500)
            t = pg2.evaluate("()=>window.__T()")
            print(f"    重开: {t[:130].replace(chr(10),' | ')}")
            ck("[7] 重开后零 pageerror", not e2, e2[:2])
            ck("[8] 原页面零 pageerror", not errs, errs[:2])
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


    _prune_test_state("call_p2ctl_")

if __name__ == "__main__":
    sys.exit(main())
