# -*- coding: utf-8 -*-
"""诊断：重开后默认页 mode 行为何显示「人工」而全局 mode='ai'。"""
import json, sys
from playwright.sync_api import sync_playwright
BASE="http://127.0.0.1:8088"; SID="1791724819571-muuetab"; AG="wb74Jn"
PAGE=open("/dev/stdin").read() if False else None

HOOKS = r"""
window.__dbg=()=>{
  const r=document.getElementById("qm-settings-root")||document.body;
  const tabs=[...r.querySelectorAll(".qm-set-tab")].map(t=>({t:(t.textContent||"").trim(),on:/qm-set-tabon/.test(t.className)}));
  const rows=[...r.querySelectorAll(".qm-set-row")].map(r=>{
    const segs=[...r.querySelectorAll(".qm-set-segbtn")].map(b=>({l:(b.textContent||"").trim(),on:/qm-set-segon/.test(b.className)}));
    return {title:(r.querySelector(".qm-set-rowtitle")||{}).textContent||"", segs};
  }).filter(x=>x.segs.length||x.title);
  return {tabs, modeRows:rows.filter(x=>(x.title||"").includes("答题模式"))};
};
window.__fetchPrefs=async()=>{
  const r=await fetch("/api/question-modal/prefs",{headers:{"X-Agent-Id":"wb74Jn"}});
  return await r.json();
};
window.__clearMem=()=>{localStorage.removeItem("qm:v1:scopeChoice");return "ok";};
window.__open=()=>{const h=document.getElementById("root");h.innerHTML="";RD.render(window.__btnNode,h);setTimeout(()=>{const b=h.querySelector("button");if(b)b.click();},50);return "s";};
"""

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div>
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
window.QwenPaw={host:{React:R,ReactDOM:RD,antd:{Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(p=>(p&&p.children)||null,{confirm:()=>{}}),Popover:p=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}},antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
%HOOKS%
window.__ready=true;
</script></body></html>
"""

def main():
    html = PAGE.replace("%AG%", AG).replace("%SID%", SID).replace("%HOOKS%", HOOKS)
    p="/app/working/plugins/question-modal/dist/__diag.html"
    open(p,"w",encoding="utf-8").write(html)
    try:
        with sync_playwright() as pw:
            b=pw.chromium.launch(args=["--no-sandbox"],executable_path="/usr/bin/chromium")
            pg=b.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
            pg.goto(BASE+"/api/frontend_plugin/question-modal/files/dist/__diag.html",wait_until="load")
            pg.wait_for_function("window.__ready===true",timeout=30000)
            pg.evaluate("window.__open()"); pg.wait_for_timeout(2200)
            d=pg.evaluate("window.__dbg()")
            print("页签:", json.dumps(d["tabs"],ensure_ascii=False))
            print("mode 行:", json.dumps(d["modeRows"],ensure_ascii=False))
            prefs=pg.evaluate("window.__fetchPrefs()")
            print("页面侧 /prefs.mode =", repr(prefs.get("prefs",{}).get("mode")))
            print("pageerror:",errs[:3])
            b.close()
    finally:
        import os
        try: os.remove(p)
        except OSError: pass

main()
