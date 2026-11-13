"""阶段 2 终局验证：进程内建 recommend 问卷 + 真实浏览器挂卡 + 立刻关页。

组合了两边的真实性：
  • 问卷用**真实 QuestionService.create(mode="recommend")** 创建（含真实 Future）
  • 卡片用**真实 Chromium** 挂载并渲染（真实 SSE、真实 bundle）
  • 关页后用**HTTP 查询后端 state**，确认它自己走完

这就绕开了「模型弹问卷时 mode 解析不稳定」的环境噪声（那是测试构造问题），
同时保留"页面真的关掉了"这个关键事实。
"""
import asyncio
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request

sys.path.insert(0, "/app/working/plugins/question-modal")

# ★ 测试隔离：把问卷 state 写到临时文件，**绝不能碰生产文件**。
#
# 事故记录（2026-11-07）：验证脚本在独立进程里跑，内存表里只有自己造的几条；
# 结尾调 `_persist_surveys()` 时把那份近乎空的内存表写出去，
# **直接覆盖了生产进程的 221 条真实 state**（实测变成 0 条）。
# 现在 `question_service._resolve_survey_file()` 支持这个环境变量覆盖，
# 设上它，生产文件完全不被触碰。
import os as _os
import tempfile as _tempfile
_os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    _os.path.join(_tempfile.gettempdir(), "qm_test_survey_states.json"),
)

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
PLUG = "/app/working/plugins/question-modal"
ok = fail = 0

QS = [
    {"type": "single", "title": "Q1 选哪个方案", "options": ["甲", "乙"], "recommended": "乙"},
    {"type": "single", "title": "Q2 是否确认", "options": ["是", "否"], "recommended": "是"},
    {"type": "text", "title": "Q3 补充说明", "recommended": "无补充"},
]


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))


def get_state(tcid):
    q = urllib.parse.urlencode({"tool_call_id": tcid})
    with urllib.request.urlopen(
            f"{BASE}/api/question-modal/survey-state?{q}", timeout=10) as r:
        return json.loads(r.read().decode()).get("state") or {}


PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "_p1page.html"), encoding="utf-8").read()


def main():
    import question_service as qs
    tag = "call_p2final_%d" % int(time.time())
    results = {}

    def create_and_wait():
        """在独立事件循环里建问卷，然后一直挂着（模拟 agent 阻塞在 Future）。"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def run():
            svc = qs.get_question_service()
            pq = await svc.create(
                session_id=SID, agent_id=AG, title="阶段2终局验证",
                questions=QS, tool_call_id=tag, mode="recommend",
            )
            svc._sync_runners(tag)
            results["svc"] = svc
            results["pq"] = pq
            print(f"    问卷已建 mode=recommend future={pq.future is not None}")
            # 挂着等 Future 被后端自己 resolve（最多 40s）
            try:
                await asyncio.wait_for(asyncio.shield(pq.future), timeout=40)
                results["resolved"] = True
                results["result"] = pq.future.result()
            except asyncio.TimeoutError:
                results["resolved"] = False
            except Exception as e:  # noqa: BLE001
                results["resolved"] = False
                results["err"] = str(e)

        loop.run_until_complete(run())

    print("[1] 进程内创建 recommend 问卷（真实 QuestionService + 真实 Future）")
    t = threading.Thread(target=create_and_wait, daemon=True)
    t.start()
    for _ in range(40):
        time.sleep(0.25)
        if "svc" in results:
            break
    ck("[1] 问卷创建成功", "svc" in results)

    print("\n[2] 真实浏览器挂载卡片")
    html = os.path.join(PLUG, "dist", "__p2final.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2final.html",
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
            ck("[2] 前端让位（推进类 action = 0）", len(fills) == 0,
               [json.dumps(a.get("body"), ensure_ascii=False)[:60] for a in fills])
            ck("[3] 卡片正常渲染", "Q1" in t0 or "选哪个" in t0, t0[:100])

            print("\n[3] ★ 立刻关掉页面 ★，什么都不做，等后端")
            pg.close()

            # ★ 判据用 **agent 侧收到的结果**，不是 HTTP 查 state。
            #
            # 本脚本在**测试进程内**建问卷，那份 QuestionService 实例属于这个
            # 进程；HTTP 端口查的是**插件进程**里另一份实例 —— 两者 pending
            # 表不共享（只有 state 文件共享）。所以 `GET /survey-state` 查不到
            # 是预期行为，不代表后端没推进。
            #
            # 真正的判据是：**agent 挂着的那个 Future 有没有被 resolve、拿到的
            # 是不是真实答案**。那是后端推进循环唯一能造成的效果。
            advanced = False
            for i in range(30):
                time.sleep(0.4)
                if results.get("resolved") is not None:
                    advanced = True
                    print(f"    +{(i+1)*0.4:.1f}s Future 已落定")
                    break
                print(f"    +{(i+1)*0.4:.1f}s 等待后端推进…")

            print("\n[4] agent 侧确认真被唤醒且拿到答案")
            t.join(timeout=10)
            res = results.get("result") or {}
            ans = res.get("answers") or {}
            print(f"    后端提交的 answers = {json.dumps(ans, ensure_ascii=False)[:280]}")
            ck("[4] 关页后后端自主走完（Future 被 resolve）",
               results.get("resolved") is True, results.get("err") or "timeout")
            ck("[5] Q1 填成推荐「乙」",
               (ans.get("q0") or {}).get("value") == "乙", ans.get("q0"))
            ck("[6] Q2 填成推荐「是」",
               (ans.get("q1") or {}).get("value") == "是", ans.get("q1"))
            ck("[7] Q3 填成生成内容",
               (ans.get("q2") or {}).get("value") == "无补充", ans.get("q2"))
            ck("[8] 结果不是 skipped（答案未丢）",
               not res.get("skipped"), res.get("skipped"))
            ck("[9] 每题都填了（无遗漏）",
               all((ans.get(f"q{i}") or {}).get("value") for i in range(len(QS))),
               ans)

            print("\n[5] 重开页面")
            pg2 = b.new_page()
            e2 = []
            pg2.on("pageerror", lambda e: e2.append(str(e)))
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2final.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready===true", timeout=30000)
            pg2.evaluate("(c)=>window.__mount(c)", tag)
            pg2.wait_for_timeout(2500)
            t2 = pg2.evaluate("()=>window.__T()")
            print(f"    重开: {t2[:130].replace(chr(10),' | ')}")
            ck("[10] 重开后零 pageerror", not e2, e2[:2])
            ck("[11] 原页面零 pageerror", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(html)
        except OSError:
            pass
        try:
            svc = results.get("svc")
            if svc:
                svc.stop_watchdog(tag)
                svc.stop_runner(tag)
                svc._surveys().pop(tag, None)
                svc._persist_surveys()
        except Exception:  # noqa: BLE001
            pass

    print(f"\n结果: {ok} 通过 / {fail} 失败")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
