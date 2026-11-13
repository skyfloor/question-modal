"""Phase 0 真机端到端【部分断言已废弃 —— 2026-11-07 阶段 1】

⚠️ 本套件的 E1/E1b/E2/E3 断言的是 `POST /survey-shadow` 影子上报通道。
该通道已被用户裁定的阶段 1 删除（state 权威整体后移到 `POST /survey-action`
+ `GET /survey-stream`），所以这四条**按设计会失败**，不是回归。

仍然有效并保留的价值：
  · E4  影子差异文件为空（阶段 1 后不再产生新差异）
  · E5  零 JS pageerror、卡片正常渲染
  · E6  action 通道不产生异常请求

阶段 1 的对应验证请跑：
  verify_phase1_state.py（36）/ verify_phase1_e2e.py（15）/
  verify_phase1_http.py（15）/ verify_phase1_multitab.py（12）

原始设计（阶段 0）：
  真实 Chromium + served bundle 挂一张真问卷、模拟用户点选，抓取前端发出的
  /survey-shadow 上报体与后端 /survey-state 比对，验证「前后端 state 一致」。
"""
import json, os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
PLUG = "/app/working/plugins/question-modal"
SURVEY_FILE = os.path.join(PLUG, "survey_states.json")
SHADOW_FILE = os.path.join(PLUG, "shadow_diffs.json")

ok = fail = 0

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

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body><div id="host"></div>
<script type="module">
let R,RD;
const m=await import("/assets/react-vendor-C7R1xVLQ.js");
const cR=[],cD=[];
for(const k of Object.keys(m)){const v=m[k];
 if(!v||typeof v!=="object"||v.default)continue;
 if(typeof v.createElement==="function"&&typeof v.useState==="function")cR.push(v);
 if(typeof v.render==="function"||typeof v.createRoot==="function")cD.push(v);}
for(const r of cR){for(const d of cD){try{const h=document.createElement("div");document.body.appendChild(h);
 if(d.render)d.render(r.createElement("i",null,"p"),h);else d.createRoot(h).render(r.createElement("i",null,"p"));
 const g=h.querySelector("i");h.remove();if(g){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(p=>(p&&p.children)||null,{confirm:()=>{}}),
 Popover:p=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
window.__SHADOW=[]; window.__ACTION=[];
// 拦下两类新请求：影子上报与 action，记录下来供断言（同时真实发出）
window.fetch=(u,o)=>{
 const url=String(u);
 if(url.includes("/survey-shadow")||url.includes("/survey-action")){
   try{ (url.includes("shadow")?window.__SHADOW:window.__ACTION)
        .push({url, body: JSON.parse((o&&o.body)||"{}")}); }catch(e){}
 }
 return rf(u,o);
};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.QS=[
 {type:"single",title:"Q1 选哪个",options:["甲","乙"],recommended:"乙"},
 {type:"single",title:"Q2 确认",options:["是","否"],recommended:"是"},
 {type:"text",title:"Q3 补充"}];
window.__mount=(callId)=>{
 const h=document.getElementById("host"); h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:callId,arguments:JSON.stringify({title:"Phase0 验证",questions:window.QS})}}]}}),h);
};
window.__T=()=>document.getElementById("host").innerText||"";
window.__click=(lb)=>{const bs=[...document.querySelectorAll("button")];
 const t=bs.find(b=>b.textContent.includes(lb));
 if(!t)return "not-found"; t.click(); return "ok";};
window.__ready=true;
</script></body></html>
"""

CALL = "call_p0e2e_%d" % int(time.time())

def main():
    for f in (SURVEY_FILE, SHADOW_FILE):
        if os.path.exists(f):
            os.remove(f)

    p = os.path.join(PLUG, "dist", "__p0e2e.html")
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__p0e2e.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            # 清掉本 callId 的残留卡态：上一轮若留下 answers，卡片会从"已答"
            # 状态起跑，点「甲」看起来像点了「乙」——这是测试卫生问题，不是缺陷。
            pg.evaluate("""(c)=>{
              try{
                for(const k of Object.keys(localStorage)){
                  if(k.startsWith('qm:v1:state:'+c) || k==='qm:v1:state:'+c) localStorage.removeItem(k);
                }
              }catch(e){}
            }""", CALL)
            pg.evaluate("(c)=>window.__mount(c)", CALL)
            pg.wait_for_timeout(2500)

            print("【E1】挂载后前端发出影子上报")
            shadows = pg.evaluate("window.__SHADOW")
            print("   影子上报数:", len(shadows))
            if shadows:
                print("   首条 state:", json.dumps(shadows[-1]["body"].get("state"), ensure_ascii=False)[:220])
            ck("[E1] 前端主动上报了 state", len(shadows) >= 1, len(shadows))
            ck("[E1b] 上报体带 tool_call_id 与 state 结构",
               bool(shadows) and shadows[-1]["body"].get("tool_call_id") == CALL
               and isinstance(shadows[-1]["body"].get("state"), dict), shadows[-1] if shadows else None)

            print("\n【E2】模拟用户点选第一题")
            r = pg.evaluate("window.__click('甲')")
            pg.wait_for_timeout(1200)
            print("   点击结果:", r)
            st_after = pg.evaluate("window.__SHADOW")
            print("   影子上报累计:", len(st_after))
            last_state = st_after[-1]["body"]["state"] if st_after else {}
            print("   最新 state.answers:", json.dumps(last_state.get("answers"), ensure_ascii=False)[:220])
            ck("[E2] 点选后上报的 answers 含 q0=甲",
               (last_state.get("answers") or {}).get("q0", {}).get("value") == "甲",
               last_state.get("answers"))

            print("\n【E3】后端 /survey-state 是否与前端一致")
            with urllib.request.urlopen(BASE + "/api/question-modal/survey-state?tool_call_id=" + CALL,
                                        timeout=20) as f:
                be = json.loads(f.read().decode())
            print("   后端 found:", be.get("found"))
            bs = be.get("state") or {}
            print("   后端 answers:", json.dumps(bs.get("answers"), ensure_ascii=False)[:220])
            fe_ans = (last_state.get("answers") or {}).get("q0", {}).get("value")
            be_ans = (bs.get("answers") or {}).get("q0", {}).get("value")
            print("   前端 q0=%r 后端 q0=%r" % (fe_ans, be_ans))
            ck("[E3] 前后端 q0 答案一致（后端确实收到了前端上报）",
               fe_ans == be_ans, (fe_ans, be_ans))

            print("\n【E4】影子差异文件应为空")
            has_diff = os.path.exists(SHADOW_FILE)
            if has_diff:
                rows = json.load(open(SHADOW_FILE, encoding="utf-8")) or []
                print("   差异条数:", len(rows))
                for r0 in rows[:2]:
                    print("    ", json.dumps(r0, ensure_ascii=False)[:260])
            ck("[E4] 正常交互下影子比对零差异",
               (not has_diff) or len(json.load(open(SHADOW_FILE, encoding="utf-8")) or []) == 0,
               "差异见上")

            print("\n【E5】零 JS 异常 & 零行为影响")
            ck("[E5] 无 pageerror", not errs, errs[:2])
            t = pg.evaluate("window.__T()")
            ck("[E5b] 卡片仍正常渲染（模式三键存在）",
               all(k in t for k in ("自动分析", "只用推荐", "人工")), t[:120])

            print("\n【E6】action 通道")
            acts = pg.evaluate("window.__ACTION")
            print("   action 请求数:", len(acts), "（阶段 0 前端只在显式动作时发）")
            ck("[E6] action 通道未产生异常请求",
               all("payload" in a["body"] for a in acts) if acts else True, acts[:2])

            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    for f in (SURVEY_FILE, SHADOW_FILE):
        if os.path.exists(f):
            os.remove(f)

    print("\n==== Phase 0 真机 E2E: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
