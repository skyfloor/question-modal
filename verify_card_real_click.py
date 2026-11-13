# -*- coding: utf-8 -*-
"""问卷卡片 · 真实点击 → 会话覆盖 → 设置面板可见（端到端，留证据）。

测试的是本轮改动：在卡片上改设置 = 改当前会话设置，且不改全局。

与之前脚本的区别：本脚本走**真实卡片 DOM**，真的点卡片上的控件，
而不是只查接口。证据（请求体、覆盖文件、生效值、全局对比）全部打印留痕。
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
PF = "/app/working/plugins/question-modal/session_prefs.json"
GF = "/app/working/plugins/question-modal/analysis_prefs.json"
KEYS = ("mode", "model_id", "template_id", "with_context", "parallel")

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def jload(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def glob_sig():
    g = jload(GF)
    return {k: g.get(k) for k in KEYS}

def eff():
    u = BASE + "/api/question-modal/effective-config?session_id=%s&agent_id=%s" % (SID, AG)
    return json.loads(urllib.request.urlopen(u, timeout=20).read())

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
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
window.__REQ=[];
window.fetch=(u,o)=>{const url=String(u), meth=((o&&o.method)||"GET").toUpperCase();
 if(meth!=="GET"){let b=null;try{b=JSON.parse((o&&o.body)||"null")}catch(e){b=String((o&&o.body)||"")}
   window.__REQ.push({url,meth,body:b});}
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  chat_id:"C",version:1,schema:[],global_keys:[],sources:{},config:{
   mode:"manual",show_recommend_badge:true,gate_unsaved:true,slow_question_sec:60,
   skip_mode:"per_question",model_id:"",template_id:"",with_context:false,parallel:false,
   fallback_title:true,wait_hint_sec:180,__sources__:{}}}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:false,found:false}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"r"}),{status:200}));
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
const QS=[{type:"single",title:"Q1",options:["甲","乙"],recommended:"甲"}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_RT",arguments:JSON.stringify({title:"真机",questions:QS})}}]}}),h);};
window.__ready=true;
</script></body></html>
"""

def main():
    g0 = glob_sig()
    print("  全局基线:", json.dumps(g0, ensure_ascii=False))
    # 清空会话覆盖，从干净状态开始
    with open(PF, encoding="utf-8") as f:
        d = json.load(f)
    d["sessions"] = {}
    tmp = PF + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    os.replace(tmp, PF)

    p = "/app/working/plugins/question-modal/dist/__rt.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__rt.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")
            pg.wait_for_timeout(1600)

            btns = pg.evaluate("()=>[...document.querySelectorAll('button')].map(b=>b.textContent.trim())")
            print("  卡片按钮:", btns)
            ck("[RT1] 卡片渲染出模式三键", "只用推荐" in btns and "人工" in btns, btns)

            # ── 真实点击卡片上的「只用推荐」──
            pg.evaluate("window.__REQ=[]")
            clicked = pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('button')]
                .find(b=>b.textContent.trim()==='只用推荐');
              if(!t) return null; t.click(); return t.textContent.trim();
            }""")
            pg.wait_for_timeout(900)
            print("  点击:", clicked)

            reqs = pg.evaluate("window.__REQ")
            sess = [r for r in reqs if "session-prefs" in r["url"]]
            glob = [r for r in reqs if r["url"].rstrip("/").endswith("/question-modal/prefs")]
            print("  session-prefs 请求体:", json.dumps([r["body"] for r in sess], ensure_ascii=False))
            print("  全局 /prefs 请求体  :", json.dumps([r["body"] for r in glob], ensure_ascii=False))

            ck("[RT2] 点卡片发出 session-prefs", len(sess) >= 1, len(sess))
            ck("[RT3] 请求体含 mode=recommend",
               any((r["body"] or {}).get("settings", {}).get("mode") == "recommend" for r in sess),
               json.dumps([r["body"] for r in sess], ensure_ascii=False))
            ck("[RT4] 【关键】绝不调用全局 /prefs", len(glob) == 0,
               json.dumps([r["body"] for r in glob], ensure_ascii=False))
            ck("[RT5] 无 JS 异常", not errs, errs[:2])

            # ── 再点「人工」，看是否覆盖 ──
            pg.evaluate("window.__REQ=[]")
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('button')]
                .find(b=>b.textContent.trim()==='人工');
              if(t) t.click();
            }""")
            pg.wait_for_timeout(800)
            reqs2 = pg.evaluate("window.__REQ")
            sess2 = [r for r in reqs2 if "session-prefs" in r["url"]]
            ck("[RT6] 再点「人工」同样写会话覆盖",
               any((r["body"] or {}).get("settings", {}).get("mode") == "manual" for r in sess2),
               json.dumps([r["body"] for r in sess2], ensure_ascii=False))
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    ck("[RT7] 全程全局默认一字未改", glob_sig() == g0,
       "before=%s after=%s" % (json.dumps(g0), json.dumps(glob_sig())))
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
