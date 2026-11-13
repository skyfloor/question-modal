# -*- coding: utf-8 -*-
"""真机验证：打开设置面板不得「先渲染默认页签再跳到会话模式」。

用户报障（2026-11-13）：
  「在加载的时候，如果当前为会话模式，在渲染ui时会先出现默认页签，
   然后再切换到会话模式，这个是否可以优化」

改前实测闪烁：229ms(0ms 延迟) / 296ms(120ms) / 454ms(400ms)，网络越慢越明显。

修复（用户裁定方案A）：
  · 首帧 tab=""（未定）→ 页签条不高亮任何项
  · 内容区渲染骨架，不画半成品设置行
  · 数据到达后一次性定鼎
  · 加载失败/网络异常必须兜底解除骨架（否则面板永远卡住）

判据：
  [N1] 会话模式下：全程**从不**出现「默认模式」高亮（核心）
  [N2] 首帧不误高亮任何页签（要么没高亮，要么直接正确）
  [N3] 等待期间出现过骨架（证明未定态真的生效，而非碰巧没渲染）
  [N4] 骨架期间不渲染任何设置行（不显示半成品）
  [N5] 最终稳定在「会话模式」
  [N6] 全流程无 JS 异常
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
window.__delay=0; window.__fail=false;
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("effective-config")){
   if(window.__fail) return Promise.resolve(new Response("nope",{status:500}));
   const body=JSON.stringify({
     ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
     config:{mode:"manual",model_id:"",template_id:"",with_context:false,parallel:false,
       notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
       slow_question_sec:60,skip_mode:"per_question",fallback_title:true,wait_hint_sec:180,
       __sources__:{}},
     has_session:true, active_scope:"session",
     session_config:{mode:"manual"}, global_config:{}, key_ts:{}});
   return new Promise(res=>setTimeout(()=>res(new Response(body,{status:200})),window.__delay));
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
  return !!h.querySelector("button");};
window.__watch=()=>{
  const marks=[]; const t0=performance.now();
  const snap=()=>{
    const on=document.querySelector('.qm-set-tabon');
    const sk=document.querySelector('[data-qm-skeleton]');
    const rows=document.querySelectorAll('.qm-set-row').length;
    marks.push({t:Math.round(performance.now()-t0),
      tab:on?on.textContent.trim():null, skel:!!sk, rows:rows});
  };
  snap();
  document.getElementById("sethost").querySelector("button").click();
  return new Promise(res=>{
    const t1=performance.now();
    const loop=()=>{
      snap();
      const last=marks[marks.length-1];
      if(last.tab==="会话模式" || performance.now()-t1>2500) return res(marks);
      requestAnimationFrame(()=>setTimeout(loop,0));
    };
    loop();
  });
};
window.__ready=true;
</script></body></html>"""

def run_case(b, delay=0, fail=False):
    pg=b.new_page(viewport={"width":1280,"height":900})
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__nf.html",wait_until="load")
    pg.wait_for_function("window.__ready===true",timeout=30000)
    pg.evaluate("window.__delay=%d; window.__fail=%s"%(delay,"true" if fail else "false"))
    pg.evaluate("window.__renderEntry()")
    marks=pg.evaluate("window.__watch()")
    pg.wait_for_timeout(300)
    return pg, marks, errs

def main():
    p=PLUG+"/dist/__nf.html"; open(p,"w",encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(args=["--no-sandbox"],executable_path="/usr/bin/chromium")

            print("\n===== 场景1：会话模式 + 400ms 慢网络（最容易闪烁）=====")
            pg,marks,errs=run_case(b,400,False)
            tabs=[m["tab"] for m in marks]
            saw_default=any(t=="默认模式" for t in tabs)
            saw_skel=any(m["skel"] for m in marks)
            skel_had_rows=any(m["skel"] and m["rows"]>0 for m in marks)
            print("  采样 %d 帧，页签序列(去重): %s" % (len(marks), list(dict.fromkeys(tabs))[:6]))
            ck("[N1] 全程从不出现「默认模式」高亮", not saw_default, [t for t in set(tabs)])
            ck("[N2] 首帧不误高亮（首帧为 None 或直接正确）",
               marks[0]["tab"] in (None,"会话模式"), marks[0])
            ck("[N3] 等待期间出现过骨架（未定态确实生效）", saw_skel, saw_skel)
            ck("[N4] 骨架期间不渲染设置行（无半成品）", not skel_had_rows,
               [m for m in marks if m["skel"] and m["rows"]>0][:2])
            ck("[N5] 最终稳定在「会话模式」", tabs[-1]=="会话模式", tabs[-1])
            ck("[N6] 无 JS 异常", not errs, errs[:2])
            pg.close()

            print("\n===== 场景2：加载失败（必须有兜底，不能永远卡骨架）=====")
            pg2,marks2,errs2=run_case(b,0,True)
            pg2.wait_for_timeout(600)
            final=pg2.evaluate("""()=>{
              const on=document.querySelector('.qm-set-tabon');
              const sk=document.querySelector('[data-qm-skeleton]');
              return {tab:on?on.textContent.trim():null, skel:!!sk,
                      rows:document.querySelectorAll('.qm-set-row').length};
            }""")
            print("  失败后状态:",final)
            ck("[N7] 失败后不再停在骨架", final["skel"] is False, final)
            ck("[N8] 失败后页签有兜底高亮（不留空白）", bool(final["tab"]), final)
            ck("[N9] 失败后仍有可用设置行", final["rows"]>0, final)
            ck("[N10] 失败场景无 JS 异常", not errs2, errs2[:2])
            pg2.close()
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass
    print("\n════════ 结果: %d passed, %d failed ════"%(ok,fail))
    return 0 if fail==0 else 1

if __name__=="__main__":
    sys.exit(main())
