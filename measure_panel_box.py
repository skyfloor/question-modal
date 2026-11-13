# -*- coding: utf-8 -*-
"""量设置面板的真实占屏：宽 / 高 / 每行高 / 可视行数。
用于回答用户「内容不多但界面过于宽松，有没有调整空间」。
纯只读测量，不改代码。
"""
import os
from playwright.sync_api import sync_playwright
BASE="http://127.0.0.1:8088"
PLUG="/app/working/plugins/question-modal"

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
   // 模拟宿主 Modal：外层 .ant-modal 承接 width，内层 .ant-modal-content 承接其 CSS
   return R.createElement("div",{className:(p&&p.wrapClassName)||"",style:{position:"fixed",inset:0,zIndex:p&&p.zIndex}},
     R.createElement("div",{className:"ant-modal",style:{width:(p&&p.width)||w,maxWidth:w,margin:"0 auto",top:"8%",position:"relative"}},
       R.createElement("div",{className:"ant-modal-content"},(p&&p.children)||null)));
 },
 Popover:function(p){return (p&&p.children)||null;},
 Switch:function(p){return R.createElement("input",{type:"checkbox"});}};
antd.Modal.info=()=>{};
window.Notification=undefined; localStorage.clear();
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u),mth=(o&&o.method)||"GET";
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
   config:{mode:"manual",model_id:"",template_id:"",with_context:false,parallel:false,
     notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
     slow_question_sec:60,skip_mode:"per_question",fallback_title:true,wait_hint_sec:180,
     __sources__:{}},has_session:true,active_scope:"session",
   session_config:{},global_config:{},key_ts:{}}),{status:200}));
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
window.__openSettings=()=>{
  if(!window.__settingsNode)return false;
  const h=document.getElementById("sethost"); h.innerHTML="";
  RD.render(window.__settingsNode,h);
  const b=h.querySelector("button"); if(b){b.click();return true;} return false;};
window.__dump=()=>{
  // 打印所有含 qm-set 类的元素，找出面板容器
  return [...document.querySelectorAll('[class*="qm-set"]')]
    .map(e=>({cls:e.className, tag:e.tagName,
              w:Math.round(e.getBoundingClientRect().width),
              h:Math.round(e.getBoundingClientRect().height)}))
    .filter(x=>x.w>200).slice(0,12);
};
window.__box=()=>{
  const p=document.querySelector(".ant-modal")
        || document.querySelector("[data-qm-fallback]");
  if(!p)return null;
  const r=p.getBoundingClientRect();
  const rows=[...document.querySelectorAll(".qm-set-row")];
  const hs=rows.map(x=>Math.round(x.getBoundingClientRect().height));
  const vh=window.innerHeight;
  return {w:Math.round(r.width),h:Math.round(r.height),
          pctOfViewport:Math.round(r.height/vh*100),
          rowCount:rows.length, rowHeights:hs,
          avgRow: hs.length?Math.round(hs.reduce((a,b)=>a+b,0)/hs.length):0};
};
window.__ready=true;
</script></body></html>"""

def main():
    p=PLUG+"/dist/__box.html"
    open(p,"w",encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(args=["--no-sandbox"],executable_path="/usr/bin/chromium")
            for vw,vh,label in ((1440,900,"桌面 1440x900"),(1280,720,"笔记本 1280x720"),(390,844,"手机 390x844")):
                pg=b.new_page(viewport={"width":vw,"height":vh})
                pg.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__box.html",wait_until="load")
                pg.wait_for_function("window.__ready===true",timeout=30000)
                ok=pg.evaluate("window.__openSettings()")
                pg.wait_for_timeout(1500)
                dump=pg.evaluate("window.__dump()")
                print("  候选容器:", dump)
                box=pg.evaluate("window.__box()")
                print("\n=== %s （打开成功=%s）===" % (label, ok))
                if not box:
                    print("  未取到面板"); pg.close(); continue
                print("  面板宽 = %dpx (视口宽 %dpx)" % (box["w"], vw))
                print("  面板高 = %dpx (占屏 %d%%)" % (box["h"], box["pctOfViewport"]))
                print("  行数 = %d，平均行高 = %dpx" % (box["rowCount"], box["avgRow"]))
                if box["rowHeights"]: print("  各行高 =", box["rowHeights"])
                pg.close()
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass

main()
