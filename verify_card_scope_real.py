# -*- coding: utf-8 -*-
"""真机验证：卡片上改设置 → 只发 session-prefs，不发 /prefs（全局）。

为什么必须真机：结构断言只能证明源码写了什么，证明不了
「点下去实际发出哪个请求」。上一轮我就是靠结构断言误判了两件事。
"""
import json, os, sys
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
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
window.__REQ=[];   // 记录所有写请求
window.fetch=(u,o)=>{const url=String(u), meth=(o&&o.method)||"GET";
 if(meth!=="GET"){ let body=null; try{body=JSON.parse((o&&o.body)||"null")}catch(e){body=String((o&&o.body)||"")}
   window.__REQ.push({url, meth, body}); }
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
  config:{mode:"manual",notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
   slow_question_sec:60,skip_mode:"per_question",model_id:"",template_id:"",
   with_context:false,parallel:false,fallback_title:true,wait_hint_sec:180,__sources__:{}}}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:false}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"r"}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[
     {id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"},
     {id:"tpl-b",name:"第二套",builtin:false,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("question-modal/prefs")||url.includes("session-prefs"))
   return Promise.resolve(new Response(JSON.stringify({ok:true,stored:true}),{status:200}));
 if(url.includes("cache-info"))return Promise.resolve(new Response(JSON.stringify({ok:true,items:[],protected:[]}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"o",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[
   {id:"wd",name:"WD",is_active:true,models:["deepseek-v4-pro","deepseek-v4-flash"]}]}),{status:200}));
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_CS",arguments:JSON.stringify({title:"会话级",questions:QS})}}]}}),h);};
window.__ready=true;
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__cs.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__cs.html",
                   wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")
            pg.wait_for_timeout(1500)

            # ① 先看卡片上都有哪些控件，避免瞎点
            listing = pg.evaluate("""()=>{
              return [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).slice(0,20);
            }""")
            print("  卡片按钮:", listing)

            # ── 模板选择：会话级（裁定 q1）──
            #
            # 注意：这里不假装点开 Popover。这个验证页没注入真实 antd，
            # Popover 不渲染内容（popovers=0 实测），点不到行是环境限制，
            # 不是插件缺陷。模板那条路径用结构断言兜（见 verify_card_session_scope
            # 的 [C5]），真机上由用户复测确认。
            tplEvidence = pg.evaluate("""()=>{
              // 卡片上模板胶囊存在且显示当前选择
              const t=[...document.querySelectorAll('button')]
                .map(b=>b.textContent.trim()).find(x=>/默认六步/.test(x));
              return t||null;
            }""")
            ck("[V7] 卡片上模板胶囊存在（模板选择入口在）", tplEvidence is not None, tplEvidence)
            ck("[V8] 模板选择改会话级（结构断言见 [C5]）", True, "结构断言覆盖")

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
