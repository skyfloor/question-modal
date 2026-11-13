# -*- coding: utf-8 -*-
"""真机验证：设置面板紧凑化 + 小屏自适应 + 入口改图标。

用户需求（2026-11-13）：
  ① 设置面板过大，小屏不适配
  ② 按钮「问卷设置」改为图标（类似问卷标题的图标）
  ③ 追加：界面间隔过大，内容不多却过于宽松

判据：
  [U1] 入口按钮**不再显示文字**「问卷设置」
  [U2] 入口按钮渲染出图标（svg 或 antd icon 组件）
  [U3] 入口带 title / aria-label（纯图标必须可发现）
  [U4] 桌面宽度 = 680（未误伤大屏体验）
  [U5] 手机 390px 下面板宽度 ≤ 92vw（不溢出）
  [U6] 每行高度明显低于改前的 85px（间距收紧生效）
  [U7] 面板整体高度占屏 ≤ 65%（桌面）
  [U8] 无 JS 异常
"""
import os, sys
from playwright.sync_api import sync_playwright

BASE="http://127.0.0.1:8088"; PLUG="/app/working/plugins/question-modal"
ok=fail=0
def ck(n,c,d=""):
    global ok,fail
    if c: ok+=1; print("  ✓ "+n)
    else: fail+=1; print("  ✗ "+n+"  "+str(d))

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
// 真实宿主那样的图标组件：返回一个 svg，带 data-icon-name 便于断言
function mkIcon(name){return function(props){
  return R.createElement("svg",Object.assign({"data-icon-name":name,viewBox:"0 0 1024 1024",
    width:"1em",height:"1em",fill:"currentColor"},props||{}),
    R.createElement("path",{d:"M0 0h1024v1024H0z"}));};}
const antdIcons={FormOutlined:mkIcon("FormOutlined"),
  ProfileOutlined:mkIcon("ProfileOutlined"),
  CheckSquareOutlined:mkIcon("CheckSquareOutlined"),
  SettingOutlined:mkIcon("SettingOutlined")};
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
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u);
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
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons,getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},
  sender:{addPrefix:(id,node)=>{window.__settingsNode=node;}}}};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__renderEntry=()=>{
  if(!window.__settingsNode)return null;
  const h=document.getElementById("sethost");h.innerHTML="";
  RD.render(window.__settingsNode,h);
  const b=h.querySelector("button");
  return b?{text:(b.textContent||"").trim(),
            title:b.getAttribute("title"),
            aria:b.getAttribute("aria-label"),
            html:b.innerHTML.slice(0,160),
            hasSvg:!!b.querySelector("svg"),
            iconName:(b.querySelector("svg")||{}).getAttribute
              ? b.querySelector("svg").getAttribute("data-icon-name") : null}:null;
};
window.__openSettings=()=>{
  const h=document.getElementById("sethost");
  const b=h.querySelector("button");
  if(b){b.click();return true;} return false;
};
window.__box=()=>{
  const p=document.querySelector(".ant-modal")||document.querySelector("[data-qm-fallback]");
  if(!p)return null;
  const r=p.getBoundingClientRect();
  const rows=[...document.querySelectorAll(".qm-set-row")];
  const hs=rows.map(x=>Math.round(x.getBoundingClientRect().height));
  return {w:Math.round(r.width),h:Math.round(r.height),
    pct:Math.round(r.height/window.innerHeight*100),
    rows:rows.length,
    avg:hs.length?Math.round(hs.reduce((a,b)=>a+b,0)/hs.length):0};
};
window.__ready=true;
</script></body></html>"""

def main():
    p=PLUG+"/dist/__ui.html"; open(p,"w",encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(args=["--no-sandbox"],executable_path="/usr/bin/chromium")
            # ── 入口按钮（改图标）──
            pg=b.new_page(viewport={"width":1440,"height":900})
            errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
            pg.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__ui.html",wait_until="load")
            pg.wait_for_function("window.__ready===true",timeout=30000)
            ent=pg.evaluate("window.__renderEntry()")
            print("  入口按钮:",ent)
            ck("[U1] 入口不再显示文字「问卷设置」",
               ent and "问卷设置" not in (ent.get("text") or ""), ent)
            ck("[U2] 入口渲染出图标",ent and ent.get("hasSvg") is True,ent)
            ck("[U2b] 图标与问卷标题同源（FormOutlined）",
               ent and ent.get("iconName")=="FormOutlined",ent)
            ck("[U3] 有 title 提示",bool(ent and ent.get("title")),ent)
            ck("[U3b] 有 aria-label（读屏可用）",bool(ent and ent.get("aria")),ent)

            # 2026-11-13 用户两次要求缩小：图形 15→13→12，
            # 但按钮热区必须仍是 28px（只缩图形、不牺牲可点性）。
            dim=pg.evaluate("""()=>{
              const b=document.querySelector('#sethost button');
              if(!b)return null;
              const svg=b.querySelector('svg');
              const r=b.getBoundingClientRect();
              const br=svg?svg.getBoundingClientRect():null;
              return {btnH:Math.round(r.height),btnW:Math.round(r.width),
                      svgFont:svg?(svg.style.fontSize||getComputedStyle(svg).fontSize):null,
                      svgW:br?Math.round(br.width):null};
            }""")
            print("  图标尺寸:",dim)
            # 2026-11-13 用户第二次要求缩小：13 → 12
            ck("[U3c] 图标字号已缩到 12px",
               dim and "12" in str(dim.get("svgFont")),dim)
            ck("[U3d] 按钮热区仍为 28px 高（未牺牲可点性）",
               dim and dim.get("btnH")==28,dim)

            # ── 面板尺寸 ──
            pg.evaluate("window.__openSettings()"); pg.wait_for_timeout(1400)
            box=pg.evaluate("window.__box()")
            print("  桌面 1440x900:",box)
            ck("[U4] 桌面宽度=680（未误伤大屏）",box and box["w"]==680,box)
            ck("[U6] 每行高 < 80px（改前 85px）",box and box["avg"]<80,box)
            ck("[U7] 面板占屏 ≤ 65%",box and box["pct"]<=65,box)
            ck("[U8] 无 JS 异常",not errs,errs[:2])
            pg.close()

            # ── 小屏自适应 ──
            pg2=b.new_page(viewport={"width":390,"height":844})
            e2=[]; pg2.on("pageerror",lambda e:e2.append(str(e)))
            pg2.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__ui.html",wait_until="load")
            pg2.wait_for_function("window.__ready===true",timeout=30000)
            pg2.evaluate("window.__renderEntry()")
            pg2.evaluate("window.__openSettings()"); pg2.wait_for_timeout(1400)
            b2=pg2.evaluate("window.__box()")
            print("  手机 390x844:",b2)
            limit=390*0.92+1
            ck("[U5] 手机面板宽 ≤ 92vw（不溢出）",b2 and b2["w"]<=limit,b2)
            ck("[U9] 手机无 JS 异常",not e2,e2[:2])
            pg2.close(); b.close()
    finally:
        try: os.remove(p)
        except OSError: pass

    print("\n════════ 结果: %d passed, %d failed ════"%(ok,fail))
    return 0 if fail==0 else 1

if __name__=="__main__":
    sys.exit(main())
