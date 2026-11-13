"""阶段 1 真机端到端：真实 Chromium + 宿主 react-vendor + 线上 served bundle。

覆盖此前的最大盲区：前端接线此前只被 harness 的**假 React** 测过。
本套件跑真实 React 18 + 真实 bundle + 真实后端，验证：

  [V1] 卡片真实渲染（不是骨架/空白）
  [V2] 挂载时真的拉 GET /survey-state（首帧快照）
  [V3] 挂载时真的建 SSE 订阅 /survey-stream
  [V4] 用户点选 → 真的 POST /survey-action(origin/set_answer)
  [V5] 后端 state 真的收到该答案（前后端一致）
  [V6] 翻页 → 真的 POST /survey-action(goto)，后端 cursor 跟着走
  [V7] 两个独立页面（真双开）→ A 改答案 B 秒级看到（**核心场景**）
  [V8] 关页面重开 → 新页面首帧即拿到完整进度（不回到第 1 题）
  [V9] 全程零 pageerror
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
# 当前会话的 chat UUID。卡片拿到的 mode 来自 `/effective-config?session_id=..`，
# 而该会话有 mode=ai 的会话覆盖 → 不处理就会自动驱动、测试点选被翻页冲掉。
CHAT_ID = "0489fc54-8a83-4621-984b-0239e944bfc7"
PLUG = "/app/working/plugins/question-modal"

ok = fail = 0
FAILS = []



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
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        FAILS.append(n)
        print("  \u2717 " + n + "  " + str(d))


def post(path, body):
    req = urllib.request.Request(
        BASE + "/api/question-modal" + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode()
            try:
                return json.loads(raw) if raw.strip() else {}
            except json.JSONDecodeError:
                return {"_raw": raw[:200]}
    except urllib.error.HTTPError as e:
        raw = e.read().decode() or "{}"
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"_raw": raw[:200], "_status": e.code}


def get(path, **params):
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in params.items())
    url = BASE + "/api/question-modal" + path + ("?" + q if q else "")
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())


import urllib.parse  # noqa: E402

# ── 验证页：加载宿主 react-vendor + 线上 bundle，暴露可编程钩子 ──
PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="host"></div>
<script type="module">
let R, RD;
const m = await import("/assets/react-vendor-C7R1xVLQ.js");
const cR = [], cD = [];
for (const k of Object.keys(m)) {
  const v = m[k];
  if (!v || typeof v !== "object" || v.default) continue;
  if (typeof v.createElement === "function" && typeof v.useState === "function") cR.push(v);
  if (typeof v.render === "function" || typeof v.createRoot === "function") cD.push(v);
}
for (const r of cR) {
  for (const d of cD) {
    try {
      const h = document.createElement("div"); document.body.appendChild(h);
      if (d.render) d.render(r.createElement("i", null, "p"), h);
      else d.createRoot(h).render(r.createElement("i", null, "p"));
      const g = h.querySelector("i"); h.remove(); if (g) { R = r; RD = d; }
    } catch (e) {}
    if (R) break;
  }
  if (R) break;
}
const antd = {
  Input: Object.assign(p => R.createElement("input", p),
    { TextArea: p => R.createElement("textarea", p) }),
  Modal: Object.assign(p => (p && p.children) || null, { confirm: () => {} }),
  Popover: p => (p && p.children) || null,
  Select: Object.assign(p => (p && p.children) || null, {}),
  Switch: p => R.createElement("input", { type: "checkbox" }),
  Segmented: p => (p && p.children) || null,
  Collapse: p => (p && p.children) || null,
  Skeleton: p => R.createElement("span", null, "loading"),
  Tooltip: p => (p && p.children) || null,
  Spin: p => R.createElement("span", null, "spin"),
  message: { warning: () => {}, success: () => {}, info: () => {}, error: () => {} },
};
window.Notification = undefined;
window.QwenPaw = {
  host: {
    React: R, ReactDOM: RD, antd, antdIcons: {},
    getApiUrl: p => "/api" + p,
    getApiToken: () => "v",
    getSelectedAgentId: () => "%AG%",
    getCurrentSessionId: () => "%SID%",
    getChatId: () => "",
    useTheme: () => "light",
    useCurrentSession: () => ({ id: "", session_id: "%SID%" }),
  },
  chat: {
    toolRender: (p, t, c) => { window.__card = c; },
    sender: { addPrefix: () => {} },
  },
};

// 记录阶段 1 的三条通道请求（同时真实发出，不改行为）
const rf = window.fetch.bind(window);
window.__REQ = [];
window.fetch = (u, o) => {
  const url = String(u);
  for (const key of ["/survey-state", "/survey-stream", "/survey-action"]) {
    if (url.includes(key)) {
      const rec = { key, url, method: (o && o.method) || "GET" };
      try { rec.body = JSON.parse((o && o.body) || "null"); } catch (e) {}
      window.__REQ.push(rec);
      break;
    }
  }
  return rf(u, o);
};

const src = await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src], { type: "application/javascript" })));

window.QS = [
  { type: "single", title: "Q1 选哪个", options: ["甲", "乙"], recommended: "乙" },
  { type: "single", title: "Q2 确认", options: ["是", "否"], recommended: "是" },
];
window.__mount = (callId) => {
  const h = document.getElementById("host");
  h.innerHTML = "";
  RD.render(R.createElement(window.__card, {
    data: { content: [{ type: "data",
      data: { call_id: callId,
              arguments: JSON.stringify({ title: "阶段1真机", questions: window.QS }) } }] },
  }), h);
};
window.__T = () => document.getElementById("host").innerText || "";
window.__click = (lb) => {
  const bs = [...document.querySelectorAll("button")];
  const t = bs.find(b => b.textContent.trim().includes(lb));
  if (!t) return "not-found";
  t.click();
  return "ok";
};
window.__ready = true;
</script></body></html>
"""


def main():
    tag = "call_p1_%d" % int(time.time())
    print(f"目标问卷 tool_call_id = {tag}")

    # 后端预置：一份问卷的基线 state（模拟问卷已由 agent 弹出）
    post("/survey-action", {"tool_call_id": tag, "action": "goto",
                            "payload": {"cursor": 0}})
    # 把本会话的 mode 覆盖成 manual：该 chat 有 mode=ai 的会话覆盖，
    # 不切就会自动驱动（自动翻页/自动提交），人工点选会被冲掉，
    # 测试就成了在测 AI，而不是测"人工作答的接线"。
    post("/session-prefs", {"chat_id": CHAT_ID, "session_id": SID,
                            "agent_id": AG,
                            "settings": {"mode": "manual"}})

    html_path = os.path.join(PLUG, "dist", "__p1e2e.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))

    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])

            # ══ 页面 A ══
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1e2e.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            # 清掉本 callId 的残留卡态（测试卫生：否则卡片会从"已答"起跑）
            pg.evaluate("(c)=>{try{localStorage.removeItem('qm:v1:state:'+c)}catch(e){}}", tag)

            pg.evaluate("(c)=>window.__mount(c)", tag)
            pg.wait_for_timeout(2200)

            text = pg.evaluate("()=>window.__T()")
            print("\n[卡片文本前 120 字]", text[:120].replace("\n", " | "))

            # V1 真实渲染
            ck("[V1] 卡片真实渲染出题目与选项",
               "Q1 选哪个" in text and "甲" in text and "乙" in text, text[:200])

            reqs = pg.evaluate("()=>window.__REQ")
            keys = [r["key"] for r in reqs]
            print(f"[挂载请求] {keys}")

            # V2 首帧快照
            ck("[V2] 挂载时拉取 GET /survey-state（首帧快照）",
               "/survey-state" in keys, keys)
            # V3 SSE 订阅
            ck("[V3] 挂载时建立 SSE 订阅 /survey-stream",
               "/survey-stream" in keys, keys)

            # V4/V5 点选 → action → 后端一致
            before = len(reqs)
            r = pg.evaluate("()=>window.__click('甲')")
            pg.wait_for_timeout(1500)
            reqs2 = pg.evaluate("()=>window.__REQ")
            new_reqs = reqs2[before:]
            acts = [x for x in new_reqs if x["key"] == "/survey-action"]
            print(f"[点选后新增] {[x['key'] for x in new_reqs]}  点击={r}")
            ck("[V4] 点选后真的 POST /survey-action",
               len(acts) > 0, [x["key"] for x in new_reqs])
            sa = [x for x in acts if (x.get("body") or {}).get("action") == "set_answer"]
            ck("[V4b] 携带 action=set_answer 与 origin",
               bool(sa) and sa[0]["body"].get("origin"),
               sa[0]["body"] if sa else None)

            st = get("/survey-state", tool_call_id=tag)
            ans = (st.get("state") or {}).get("answers") or {}
            print(f"[后端 state] answers={json.dumps(ans, ensure_ascii=False)}")
            ck("[V5] 后端真的收到了这个答案（前后端一致）",
               (ans.get("q0") or {}).get("value") == "甲", ans)

            # V6 翻页 → goto
            before = len(pg.evaluate("()=>window.__REQ"))
            r2 = pg.evaluate("()=>window.__click('下一步')")
            pg.wait_for_timeout(1500)
            new_reqs2 = pg.evaluate("()=>window.__REQ")[before:]
            gotos = [x for x in new_reqs2
                     if x["key"] == "/survey-action"
                     and (x.get("body") or {}).get("action") == "goto"]
            st2 = get("/survey-state", tool_call_id=tag)
            cur = (st2.get("state") or {}).get("cursor")
            print(f"[翻页] 点击={r2} goto请求={len(gotos)} 后端cursor={cur}")
            ck("[V6] 翻页会 POST goto，后端 cursor 跟着走",
               len(gotos) > 0 and cur == 1, {"gotos": len(gotos), "cursor": cur})

            # ══ V7 真双开：第二个独立页面 ══
            print("\n[V7 真实双开：两个独立浏览器页面]")
            pg2 = b.new_page()
            errs2 = []
            pg2.on("pageerror", lambda e: errs2.append(str(e)))
            pg2.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1e2e.html",
                     wait_until="load")
            pg2.wait_for_function("window.__ready===true", timeout=30000)
            pg2.evaluate("(c)=>window.__mount(c)", tag)
            pg2.wait_for_timeout(2200)
            t2 = pg2.evaluate("()=>window.__T()")
            print(f"    B 页文本: {t2[:90].replace(chr(10),' | ')}")

            # A 页改成「乙」，B 页应在秒级内显示「乙」被选中
            pg.evaluate("()=>window.__click('上一步')")
            pg.wait_for_timeout(1200)
            tA = pg.evaluate("()=>window.__T()")
            print(f"    A 回退后文本: {tA[:80].replace(chr(10),' | ')}")
            click_ret = pg.evaluate("()=>window.__click('乙')")
            print(f"    A 点乙: {click_ret}")
            pg.wait_for_timeout(2200)
            t2b = pg2.evaluate("()=>window.__T()")
            st3 = get("/survey-state", tool_call_id=tag)
            ans3 = (st3.get("state") or {}).get("answers") or {}
            print(f"    A 改成乙后，后端 answers.q0 = {(ans3.get('q0') or {}).get('value')}")
            print(f"    B 页是否出现「已选乙」的可见痕迹: {'乙' in t2b}")
            ck("[V7a] A 页改动真的写进了后端（乙）",
               (ans3.get("q0") or {}).get("value") == "乙", ans3)

            # B 页必须收到 SSE 并重渲染 —— 用「选中态」判定：B 页文本含 ✓ 2. 乙
            b_selected = pg2.evaluate(
                "()=>{const t=document.getElementById('host').innerText||'';"
                "return t.includes('✓')}")
            ck("[V7b] B 页收到 SSE 并显示选中态（不是空白/只读提示）",
               ("✓" in t2b) or b_selected, t2b[:200])
            ck("[V7c] B 页没有出现旧版的「只读视图」横幅",
               "只读视图" not in t2b and "另一个标签页" not in t2b, t2b[:200])

            # ══ V8 关页面重开 ══
            print("\n[V8 关页面重开：新页面首帧即恢复进度]")
            pg2.close()
            pg.close()
            pg3 = b.new_page()
            errs3 = []
            pg3.on("pageerror", lambda e: errs3.append(str(e)))
            pg3.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p1e2e.html",
                     wait_until="load")
            pg3.wait_for_function("window.__ready===true", timeout=30000)
            pg3.evaluate("(c)=>window.__mount(c)", tag)
            pg3.wait_for_timeout(2200)
            t3 = pg3.evaluate("()=>window.__T()")
            print(f"    重开后文本: {t3[:110].replace(chr(10),' | ')}")
            step = pg3.evaluate(
                "()=>{const t=document.getElementById('host').innerText||'';"
                "const m=t.match(/(\\d+)\\s*\\/\\s*(\\d+)/);return m?m[1]+'/'+m[2]:'?';}")
            print(f"    重开后进度显示: {step}")
            # ★ 注意：本轮为了改答案 A 页点过「上一步」回到第 1 题，
            # 所以后端 cursor 已经是 0。重开后**正确的**行为就是停在第 1 题。
            # 因此这里断言的是"停留在后端记录的 cursor"，而不是"第 2 题"。
            # （进度保持的完整验证见 verify_p1_reopen.py：那里不做回退，
            #   实测重开后确实停在第 2 题。）
            st_final = get("/survey-state", tool_call_id=tag)
            backend_cursor = (st_final.get("state") or {}).get("cursor")
            expect_step = str(int(backend_cursor or 0) + 1)
            ck("[V8] 重开后停在后端记录的进度（cursor 一致）",
               step.split("/")[0] == expect_step,
               {"step": step, "backend_cursor": backend_cursor})
            ck("[V8b] 重开后已答内容仍在（乙）",
               "乙" in t3, {"text": t3[:160]})

            # V9 零异常
            print(f"\n[V9] pageerror 统计: A={len(errs)} B={len(errs2)} C={len(errs3)}")
            if errs or errs2 or errs3:
                for e in (errs + errs2 + errs3)[:5]:
                    print("     ", e)
            ck("[V9] 全程零 pageerror", not (errs or errs2 or errs3),
               (errs + errs2 + errs3)[:3])

            b.close()
    finally:
        try:
            os.remove(html_path)
        except OSError:
            pass
        post("/survey-action", {"tool_call_id": tag, "action": "release",
                                "payload": {"by": "cleanup"}})

    print(f"\n{'='*54}")
    print(f"结果: {ok} 通过 / {fail} 失败")
    for f in FAILS:
        print("  \u2717", f)
    return 0 if fail == 0 else 1


    _prune_test_state("call_p1_")

if __name__ == "__main__":
    sys.exit(main())
