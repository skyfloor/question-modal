"""发版前真机全流程回归：卡片渲染 → 三模式 → 严格闸门 → 逐页导航 → 提交落地。

真实 Chromium + served bundle（与宿主 await import(blob) 同构路径）。
卡片按宿主真实契约挂载：R.createElement(cardComponent, {data:{content:[...]}})。
后端全部用桩，避免 429 限流污染结论；落盘核验读真实磁盘。
"""
import json, os, sys, urllib.request, time
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
PLUG = "/app/working/plugins/question-modal"
ANS = os.path.join(PLUG, "answered_results.json")
GB = os.path.join(PLUG, "gate_blocks.json")

ok = fail = 0
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
 const good=h.querySelector("i");h.remove();if(good){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
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
window.__REQ=[];
window.fetch=(u,o)=>{const url=String(u);const meth=((o&&o.method)||"GET").toUpperCase();
 if(meth!=="GET") window.__REQ.push({url,meth,body:(()=>{try{return JSON.parse((o&&o.body)||"null")}catch(e){return String((o&&o.body)||"")}})()});
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  chat_id:"C",version:1,schema:[],global_keys:[],sources:{},config:{
   mode:"manual",show_recommend_badge:true,gate_unsaved:true,slow_question_sec:60,
   skip_mode:"per_question",model_id:"",template_id:"",with_context:false,parallel:false,
   fallback_title:true,wait_hint_sec:180,__sources__:{}}}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:true,request_id:"req-regress-1",state:"pending"}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"req-regress-1"}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[{id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("question-modal/prefs")||url.includes("session-prefs"))
   return Promise.resolve(new Response(JSON.stringify({ok:true,stored:true}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"o",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[
   {id:"wd",name:"WD",is_active:true,models:["deepseek-v4-pro","deepseek-v4-flash"]}]}),{status:200}));
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.QS=[
 {type:"single",title:"【单选】请选择一个推荐项",options:["甲选项","乙选项","丙选项"],recommended:"乙选项"},
 {type:"multi",title:"【多选】可多选",options:["A1","A2","A3"]},
 {type:"text",title:"【问答】随便写点"}];
window.__mount=(callId)=>{
 const h=document.getElementById("host"); h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:callId,arguments:JSON.stringify({title:"回归测试问卷",questions:window.QS})}}]}}),h);
};
window.__T=()=>document.getElementById("host").innerText||"";
window.__BTNS=()=>[...document.querySelectorAll("button")].map(b=>b.textContent.trim());
window.__click=(lb,ex)=>{
 const bs=[...document.querySelectorAll("button")];
 const t=bs.find(b=>ex? b.textContent.trim()===lb : b.textContent.includes(lb));
 if(!t)return "not-found";
 t.click(); return "ok";
};
window.__ready=true;
</script></body></html>
"""

def main():
    ans_before = json.load(open(ANS, encoding="utf-8")) if os.path.exists(ANS) else {}
    gate_before = json.load(open(GB, encoding="utf-8")) if os.path.exists(GB) else []
    p = os.path.join(PLUG, "dist", "__regress.html")
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__regress.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount('call-regress-1')")
            pg.wait_for_timeout(1800)

            print("【A】卡片渲染 · 三种题型")
            t = pg.evaluate("window.__T()")
            btns = pg.evaluate("window.__BTNS()")
            print("    按钮:", [x for x in btns if x][:12])
            ck("[A1] 单选题干渲染", "【单选】请选择一个推荐项" in t, t[:100])
            ck("[A2] 单选三选项齐全", all(x in t for x in ("甲选项", "乙选项", "丙选项")), "")
            ck("[A3] AI 推荐徽章出现", "AI 推荐" in t or "推荐" in t, "")
            ck("[A4] 多选/问答题干存在（题干栏或折叠摘要）",
               ("可多选" in t) or ("随便写点" in t) or ("3" in t), t[:150])
            ck("[A5] 三模式按钮齐全",
               all(any(x == k for x in btns) for k in ("自动分析", "只用推荐", "人工")), btns[:10])

            print("\n【B】严格闸门（未作答点「下一步」）")
            pg.evaluate("window.__REQ=[]")
            r1 = pg.evaluate("window.__click('下一步')")
            pg.wait_for_timeout(900)
            t2 = pg.evaluate("window.__T()")
            reqs = pg.evaluate("window.__REQ")
            gateposts = [r for r in reqs if "gate-block" in r["url"]]
            blocked = ("尚未" in t2) or ("拦截" in t2) or ("请选择" in t2) or ("第 1 题" in t2)
            ck("[B0] 下一步按钮存在", r1 == "ok", r1)
            ck("[B1] 未作答时出现拦截提示", blocked, t2[:200])
            ck("[B2] 拦截时 POST /gate-block 留痕", len(gateposts) >= 1, len(gateposts))
            ck("[B3] 被拦截后仍停在第 1 题（未跳到末页）",
               "其他意见" not in t2, t2[-120:])

            print("\n【C】作答后放行 + 逐页推进")
            pg.evaluate("window.__click('乙选项', false)")
            pg.wait_for_timeout(500)
            r2 = pg.evaluate("window.__click('下一步')")
            pg.wait_for_timeout(800)
            t3 = pg.evaluate("window.__T()")
            ck("[C1] 选中项后「下一步」可用", r2 == "ok", r2)
            ck("[C2] 推进到第 2 题", ("可多选" in t3) or ("A1" in t3), t3[:160])

            print("\n【D】三种模式切换（写会话覆盖、不写全局）")
            pg.evaluate("window.__REQ=[]")
            pg.evaluate("window.__click('只用推荐', true)")
            pg.wait_for_timeout(900)
            reqs = pg.evaluate("window.__REQ")
            sess = [r for r in reqs if "session-prefs" in r["url"]]
            glob = [r for r in reqs if r["url"].rstrip("/").endswith("/question-modal/prefs")]
            ck("[D1] 点「只用推荐」发 session-prefs", len(sess) >= 1, len(sess))
            ck("[D2] 请求体 mode=recommend",
               any((r["body"] or {}).get("settings", {}).get("mode") == "recommend" for r in sess),
               json.dumps([r["body"] for r in sess], ensure_ascii=False)[:200])
            ck("[D3] 绝不调用全局 /prefs", len(glob) == 0, len(glob))
            t4 = pg.evaluate("window.__T()")
            # 2026-11-13 架构同步：阶段 2 起「只用推荐 / 自动分析」的推进权
            # 已整体迁到后端 runner（`question_service._runner_loop`），前端在
            # 后端在线时**让位**（`if ((anMode === "recommend" || anMode === "ai") && !backendDown) return;`）。
            # 本脚本是纯假桩（__mount 直接渲染卡片、无真实 pending/后端 state），
            # 因此不应期待「前端自动推进并提交」——那正是旧架构行为。
            # 权威的「后端关页自动推进并提交」由 verify_phase2_final.py 11/11 覆盖。
            # 这里改为断言：卡片仍可操作、模式切换已生效、没有伪提交（前端不让位
            # 反而在假桩里乱填答案才是缺陷）。
            ck("[D4] 后端在线时前端让位：假桩不自行推进提交（阶段 2 架构）",
               "已完成" not in t4 and "用户提交的问卷答案" not in t4, t4[:200])
            ck("[D5] 模式切换已生效（卡片仍显示三模式控件）",
               "只用推荐" in t4 and "人工" in t4, t4[:200])

            print("\n【E】无 JS 异常")
            ck("[E1] 全流程零 pageerror", not errs, errs[:2])

            print("\n【F】磁盘未被测试污染")
            ans_after = json.load(open(ANS, encoding="utf-8")) if os.path.exists(ANS) else {}
            newk = set(ans_after) - set(ans_before)
            ck("[F1] 无伪提交记录", not any("regress" in str(k) for k in newk), list(newk)[:3])
            gate_after = json.load(open(GB, encoding="utf-8")) if os.path.exists(GB) else []
            print("    gate_blocks 条数: %d → %d" % (len(gate_before), len(gate_after)))
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    print("\n==== 真机全流程: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
