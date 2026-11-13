# -*- coding: utf-8 -*-
"""真机定位：只用推荐模式下，「最后一题停住」是怎么形成的。

采样每一帧的进度数字，看 visStep 走到哪、在哪一步停下。
"""
import json, sys, os
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
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
 const ok=h.querySelector("i");h.remove();if(ok){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"sess-multi",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
window.__POSTS=[];
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  chat_id:"C",version:1,schema:[],global_keys:[],
  config:{mode:"recommend",notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
   slow_question_sec:60,skip_mode:"per_question",model_id:"",template_id:"",
   with_context:false,parallel:false,fallback_title:true,wait_hint_sec:180,__sources__:{}}}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  found:true, request_id:"req-M", tool_call_id:"call_M", session_id:"sess-multi",
  agent_id:"wb74Jn"}),{status:200}));
 if(url.includes("question-modal/answer")){
   window.__POSTS.push(JSON.parse((o&&o.body)||"{}"));
   return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"req-M"}),{status:200}));}
 if(url.includes("question-modal/prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   prefs:{mode:"recommend",model_id:"",with_context:false,parallel:false}}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[{id:"builtin-default",name:"d",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("question-modal/analysis"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:false}),{status:200}));
 if(url.includes("question-modal/pending"))return Promise.resolve(new Response(JSON.stringify({ok:true,pending:[],count:0}),{status:200}));
 if(url.includes("question-modal/result"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:false}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"o",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[]}),{status:200}));
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
// 5 题全部带推荐 —— 这是「只用推荐」最该一路跑完的形态
const QS=[
 {type:"single",title:"Q1",options:["A1","B1"],recommended:"A1"},
 {type:"single",title:"Q2",options:["A2","B2"],recommended:"A2"},
 {type:"single",title:"Q3",options:["A3","B3"],recommended:"A3"},
 {type:"single",title:"Q4",options:["A4","B4"],recommended:"A4"},
 {type:"single",title:"Q5",options:["A5","B5"],recommended:"A5"}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_M",arguments:JSON.stringify({title:"多题",questions:QS})}}]}}),h);};
window.__probe=()=>({
  prog: ((document.body.innerText||"").match(/(\d+)\/(\d+)/)||[])[0] || "",
  title: ((document.body.innerText||"").split("\n").find(x=>/^Q\d$/.test(x))||"") ,
  other: /其他意见/.test(document.body.innerText||""),
  posts: window.__POSTS.length,
  ls: (()=>{try{return JSON.parse(localStorage.getItem("qm:v1:state:call_M")||"{}")}catch(e){return {}}})()
});
window.__ready=true;
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__multi.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__multi.html",
                   wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")

            trail = []
            for i in range(20):
                pg.wait_for_timeout(200)
                s = pg.evaluate("window.__probe()")
                trail.append((s["prog"], s["title"], "OTHER" if s["other"] else "",
                              s["posts"], s["ls"].get("visStep")))
            print("  进度轨迹（进度/当前题/末页/提交数/visStep）:")
            for t in trail:
                print("   ", t)

            final = pg.evaluate("window.__probe()")
            print("  submit 调用记录:", pg.evaluate("window.__QMDBG || []"))
            print("  localStorage 状态:")
            print("   ", json.dumps({k:v for k,v in final["ls"].items()
                  if k in ("visStep","answers","answered","submittedAt")},
                  ensure_ascii=False)[:600])
            ck("[M1] 5 题问卷应当一路自动跑到提交",
               final["posts"] >= 1, "提交数=%d" % final["posts"])
            ck("[M2] 不应停在末页等待人工提交",
               not (final["other"] and final["posts"] == 0),
               "末页=%s 提交数=%d" % (final["other"], final["posts"]))
            ck("[M3] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
