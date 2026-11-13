"""阶段 2 决定性真机验证：真实问卷 + 立刻关掉页面，看后端能否自己走完。

对比上一版（`verify_phase2_nopage.py`）：
  那个只验证了"前端不发推进类 action"（让位），用的是后端注入的 state。
  这个走**真实 agent 链路**（真的调模型弹问卷），然后用真实浏览器挂载卡片、
  **立刻关页**，最后看后端 state 是否自主走到 submitted。

判据（用户诉求的直接证据）：
  「如果我关闭会话窗口，当前会话窗口实际也是在继续推进，不会出现停留，
    或者卡顿等待窗口重新打开再执行」
"""
import json
import os
import queue
import sys
import threading
import time
import urllib.parse
import urllib.request

import httpx
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
AGENT_ID = "wb74Jn"
SESSION_ID = "p2-nopage-%d" % int(time.time())
PLUG = "/app/working/plugins/question-modal"
H = {"Content-Type": "application/json", "X-Agent-Id": AGENT_ID}
ok = fail = 0

PROMPT = (
    "请只调用一次 question_modal 工具向我提问，不要先做别的。"
    "标题用「阶段2关页验证」，3 个题，每题的 recommended 字段都必须填："
    "1) 单选「选哪个方案？」，options [甲, 乙]，recommended 填「乙」；"
    "2) 单选「是否确认？」，options [是, 否]，recommended 填「是」；"
    "3) 问答「补充说明」，recommended 填「无补充」。"
    "等我回答后再复述。"
)



# ⚠️ 本脚本是**只读/真机观测**脚本：它不自己创建 state，观测的是真实问卷。
# 因此**不能**调用清理（空 prefix 会删掉无 request_id 的合法历史）。
# helper 保留但不调用，供需要时手工执行。
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



def _all_states():
    import glob
    for f in glob.glob("/app/working/plugins/question-modal/survey_states.json"):
        try:
            return json.load(open(f, encoding="utf-8"))
        except Exception:  # noqa: BLE001
            return {}
    return {}


def _find_tcid(session_id, title):
    """`/pending` 不返回 tool_call_id，从后端 state 反查（按会话+时间取最新）。"""
    rows = [(k, v) for k, v in _all_states().items()
            if v.get("session_id") == session_id
            and (not title or v.get("title") == title)]
    if not rows:
        return None
    rows.sort(key=lambda kv: kv[1].get("created_at") or 0)
    return rows[-1][0]


PAGE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "_p1page.html"), encoding="utf-8").read()


def ask_model():
    """真实的 console/chat 调用，让 agent 自己弹问卷。"""
    payload = {
        "channel": "console", "user_id": "default",
        "session_id": SESSION_ID, "sessionId": SESSION_ID,
        "chatId": SESSION_ID, "stream": True,
        "input": [{"role": "user", "content": [{"type": "text", "text": PROMPT}]}],
    }
    lines: "queue.Queue[str]" = queue.Queue()
    done = threading.Event()

    def reader():
        try:
            with httpx.Client(timeout=None) as c:
                with c.stream("POST", f"{BASE}/api/console/chat",
                              json=payload, headers=H) as resp:
                    print(f"    HTTP {resp.status_code}")
                    for line in resp.iter_lines():
                        if line:
                            lines.put(line)
        except Exception as exc:  # noqa: BLE001
            lines.put(f"[err] {exc}")
        finally:
            done.set()

    threading.Thread(target=reader, daemon=True).start()

    # 等问卷弹出（真实模型调用可能要十几秒）
    deadline = time.time() + 150
    while time.time() < deadline:
        time.sleep(1.0)
        try:
            d = get("/pending")
        except Exception:  # noqa: BLE001
            continue
        items = d.get("items") or []
        if items:
            it = items[0]
            print(f"    问卷已弹出: {it.get('title')} "
                  f"题数={len(it.get('questions') or [])}")
            return it, lines, done
    return None, lines, done


def main():
    print("[1] 真实链路：让 agent 弹一份问卷（recommend 模式）")
    # 先把本会话的 mode 设成 recommend，问卷一弹出后端就该自己推进
    # 先反查这次对话的真实 chat UUID —— 问卷创建时用的是它，
    # 写覆盖也必须是同一个键，否则 `resolve_effective` 读不到。
    CHAT_UUID = ""
    r0 = post("/session-prefs", {
        "chat_id": SESSION_ID, "session_id": SESSION_ID, "agent_id": AGENT_ID,
        "settings": {},
    })
    CHAT_UUID = (r0 or {}).get("chat_id") or SESSION_ID
    print(f"    会话键 = {CHAT_UUID}")
    r = post("/session-prefs", {
        "chat_id": CHAT_UUID, "session_id": SESSION_ID, "agent_id": AGENT_ID,
        "settings": {"mode": "recommend"},
    })
    print(f"    设置 mode=recommend: {json.dumps(r, ensure_ascii=False)[:120]}")
    # 确认后端解析出的生效值（这是问卷创建时读到的同一份配置）
    try:
        eff = get("/effective-config", session_id=SESSION_ID, agent_id=AGENT_ID)
        print(f"    effective mode = {(eff.get('settings') or {}).get('mode')}")
    except Exception as e:  # noqa: BLE001
        print(f"    effective-config 查询失败: {e}")
    it, lines, done = ask_model()
    if not it:
        print("  \u2717 问卷没弹出（模型未调用工具或超时）")
        for _ in range(8):
            try:
                l = lines.get(timeout=2)
                print("    ", l[:160])
            except queue.Empty:
                break
        return 1

    # `/pending` 现在直接返回 tool_call_id（新增），不再依赖 state 落盘时序
    tcid = it.get("tool_call_id") or _find_tcid(SESSION_ID, "")
    questions = it.get("questions") or []
    declared = [bool(q.get("recommended")) for q in questions]
    print(f"    tool_call_id = {tcid}")
    print(f"    每题是否带 recommended = {declared}")
    ck("[1] 问卷含 3 题", len(questions) == 3, len(questions))

    print("\n[2] 打开页面挂载卡片，然后★立刻关掉★")
    html = os.path.join(PLUG, "dist", "__p2real.html")
    with open(html, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SESSION_ID).replace("%AG%", AGENT_ID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2real.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tcid)
            pg.evaluate("(c)=>window.__mount(c)", tcid)
            pg.wait_for_timeout(900)          # 只给挂载时间，不给推进时间
            t0 = pg.evaluate("()=>window.__T()")
            print(f"    关页前卡片: {t0[:80].replace(chr(10),' | ')}")
            reqs = pg.evaluate("()=>window.__REQ")
            acts = [r for r in reqs if r["key"] == "/survey-action"]
            print(f"    关页前 /survey-action 数 = {len(acts)}")
            pg.close()
            print("    ★ 页面已关闭")

            print("\n[3] 什么都不做，等后端自己推进")
            finished = False
            for i in range(40):
                time.sleep(0.5)
                cur = get("/survey-state", tool_call_id=tcid).get("state") or {}
                ans = cur.get("answers") or {}
                print(f"    +{(i+1)*0.5:.1f}s status={cur.get('status')} "
                      f"cursor={cur.get('cursor')} answers={len(ans)}")
                if cur.get("status") in ("submitted", "resolved") or len(ans) >= 3:
                    finished = True
                    break

            cur = get("/survey-state", tool_call_id=tcid).get("state") or {}
            ans = cur.get("answers") or {}
            print(f"    最终 answers = {json.dumps(ans, ensure_ascii=False)[:300]}")
            ck("[2] 关掉页面后后端自己推进了（核心断言）",
               finished and len(ans) > 0, {"status": cur.get("status"),
                                           "answers": len(ans)})
            ck("[3] 至少一题被自动填入",
               any((v or {}).get("value") not in ("", [], None)
                   for v in ans.values()), ans)

            print("\n[4] 重开页面看结果")
            pg2 = b.new_page()
            e2 = []
            pg2.on("pageerror", lambda e: e2.append(str(e)))
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p2real.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready===true", timeout=30000)
            pg2.evaluate("(c)=>window.__mount(c)", tcid)
            pg2.wait_for_timeout(2500)
            t = pg2.evaluate("()=>window.__T()")
            print(f"    重开文本: {t[:150].replace(chr(10),' | ')}")
            ck("[4] 重开后零 pageerror", not e2, e2[:2])
            ck("[5] 原页面零 pageerror", not errs, errs[:2])
            b.close()

            # agent 是否被唤醒（SSE 流应结束）
            woken = False
            for _ in range(20):
                if done.wait(timeout=1.0):
                    woken = True
                    break
            ck("[6] agent 被唤醒（console/chat 流结束，无 409 卡死）", woken)
    finally:
        try:
            os.remove(html)
        except OSError:
            pass
        post("/survey-action", {"tool_call_id": tcid, "action": "release",
                                "payload": {"by": "cleanup"}})
        try:
            post("/session-prefs/clear", {"chat_id": CHAT_UUID})
        except Exception:  # noqa: BLE001
            pass

    print(f"\n结果: {ok} 通过 / {fail} 失败")
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
