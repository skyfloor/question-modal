# -*- coding: utf-8 -*-
"""测量：打开设置面板时，「默认页签」先渲染多久才切到「会话模式」。

用户报障（2026-11-13）：
  「在加载的时候，如果当前为会话模式，在渲染ui时会先出现默认页签，
   然后再切换到会话模式，这个是否可以优化」

本脚本只测量不改代码：
  记录时间轴 —— 面板首次挂载 / 首次看到「默认模式」高亮 / 首次看到「会话模式」高亮
"""
import os, sys, time
from playwright.sync_api import sync_playwright
BASE="http://127.0.0.1:8088"; PLUG="/app/working/plugins/question-modal"

PAGE=r"""<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="host"></div><div id="sethost"></div>
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
 if(h.querySelector("i")){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}},
 Modal:function(p){
   if(p&&p.open===false)return null;
   const w=(p&&p.style&&p.style.maxWidth)||"92vw";
   return R.createElement("div",{className:(p&&p.wrapClassName)||"",style:{position:"fixed",inset:0,zIndex:p&&p.zIndex}},
     R.createElement("div",{className:"ant-modal",style:{width:(p&&p.width)||w,maxWidth:w,margin:"0 auto",top:"8%",position:"relative"}},
       R.createElement("div",{className:"ant-modal-content"},(p&&p.children)||null)));
 },
 Popover:function(p){return (p&&p.children)||null;},
 Switch:function(p){return R.createElement("input",{type:"checkbox"});}};
antd.Modal.info=()=>{};
window.Notification=undefined; localStorage.clear();

window.__T0=0; window.__marks=[]; window.__delay=0;
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("effective-config")){
   // 模拟真实网络延迟（默认 0，外部可调）
   const body=JSON.stringify({
     ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
     config:{mode:"manual",model_id:"",template_id:"",with_context:false,parallel:false,
       notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
       slow_question_sec:60,skip_mode:"per_question",fallback_title:true,wait_hint_sec:180,
       __sources__:{}},
     has_session:true, active_scope:"session",
     session_config:{mode:"manual"}, global_config:{}, key_ts:{}});
   const dly=window.__delay;
   return new Promise(res=>setTimeout(()=>res(new Response(body,{status:200})),dly));
 }
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,default_id:"builtin-default",items:[{id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("question-modal/prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,prefs:{}}),{status:200}));
 if(url.includes("session-prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,sessions:[],count:0}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"wd",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[{id:"wd",name:"WD",is_active:true,models:["m"],extra_models:[],is_free:false}]}),{status:200}));
 return rf(u,o);};

window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},
  sender:{addPrefix:(id,node)=>{window.__settingsNode=node;}}}};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));

window.__renderEntry=()=>{
  const h=document.getElementById("sethost");h.innerHTML="";
  RD.render(window.__settingsNode,h);
  return !!h.querySelector("button");
};
window.__openAndWatch=()=>{
  window.__marks=[]; window.__T0=performance.now();
  const rec=(tag)=>{
    const active=document.querySelector('.qm-set-tabon');
    const cur=document.querySelector('.qm-set-scopepick-on');
    window.__marks.push({t:Math.round(performance.now()-window.__T0),
      tag, tab:active?active.textContent.trim():null,
      pick:cur?cur.textContent.trim():null});
  };
  rec("before-open");
  const h=document.getElementById("sethost");
  h.querySelector("button").click();
  // 以 10ms 粒度采样，直到出现「会话模式」或 1500ms 超时
  return new Promise(res=>{
    const t0=performance.now();
    const tick=()=>{
      rec("sample");
      const last=window.__marks[window.__marks.length-1];
      if(last.tab==="会话模式"){ rec("settled"); return res(window.__marks); }
      if(performance.now()-t0>1500){ rec("timeout"); return res(window.__marks); }
      requestAnimationFrame(()=>setTimeout(tick,0));
    };
    tick();
  });
};
window.__ready=true;
</script></body></html>"""

def analyze(marks, delay):
    tabs=[m for m in marks if m["tag"] in ("sample","settled","timeout")]
    first_any=next((m for m in tabs if m["tab"]), None)
    first_session=next((m for m in tabs if m["tab"]=="会话模式"), None)
    first_default=next((m for m in tabs if m["tab"]=="默认模式"), None)
    print("\n=== fetch 延迟 = %d ms ===" % delay)
    print("  首帧页签        :", first_any["tab"] if first_any else "未渲染", "@%sms" % (first_any["t"] if first_any else "-"))
    if first_default: print("  出现「默认模式」  : @%sms" % first_default["t"])
    if first_session: print("  切到「会话模式」  : @%sms" % first_session["t"])
    if first_default and first_session:
        print("  ★ 闪烁时长      : %d ms（先默认后会话）" % (first_session["t"]-first_default["t"]))
        return first_session["t"]-first_default["t"]
    if first_session and not first_default:
        print("  ✓ 无闪烁：全程只有会话模式")
        return 0
    print("  ⚠ 未观测到会话模式（超时或未切换）")
    return None

def main():
    p=PLUG+"/dist/__flash.html"; open(p,"w",encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(args=["--no-sandbox"],executable_path="/usr/bin/chromium")
            for delay in (0, 120, 400):
                pg=b.new_page(viewport={"width":1280,"height":900})
                pg.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__flash.html",wait_until="load")
                pg.wait_for_function("window.__ready===true",timeout=30000)
                pg.evaluate("window.__delay=%d" % delay)
                pg.evaluate("window.__renderEntry()")
                mk=pg.evaluate("window.__openAndWatch()")
                analyze(mk, delay)
                pg.close()
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass

main()
