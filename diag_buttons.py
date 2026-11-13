# -*- coding: utf-8 -*-
"""真实浏览器加载插件 bundle，抓控制台报错 + 检查按钮是否注册。

用户报「优化按钮、问卷设置按钮都不见了」——先确认 bundle 本身是否能跑通、
addPrefix 是否被调用、有没有运行时异常。
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="toolbar"></div>
<script type="module">
window.__LOG=[]; window.__ERR=[];
const _ce=console.error, _cw=console.warn;
console.error=(...a)=>{window.__ERR.push(a.map(String).join(" ")); _ce(...a);};
console.warn=(...a)=>{window.__LOG.push("W "+a.map(String).join(" ")); _cw(...a);};
const _cl=console.log;
console.log=(...a)=>{window.__LOG.push(a.map(String).join(" ")); _cl(...a);};

let R,RD;
try{
  const m=await import("/assets/react-vendor-C7R1xVLQ.js");
  const cR=[],cD=[];
  for(const k of Object.keys(m)){const v=m[k];
   if(!v||typeof v!=="object"||v.default)continue;
   if(typeof v.createElement==="function"&&typeof v.useState==="function")cR.push(v);
   if(typeof v.render==="function"||typeof v.createRoot==="function")cD.push(v);}
  for(const r of cR){for(const d of cD){try{const h=document.createElement("div");document.body.appendChild(h);
   if(d.render)d.render(r.createElement("i",null,"p"),h);else d.createRoot(h).render(r.createElement("i",null,"p"));
   const g=h.querySelector("i");h.remove();if(g){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
}catch(e){ window.__ERR.push("react vendor import failed: "+e); }

const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(p=>R&&((p&&p.children)||null),{confirm:()=>{}}),
 Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;

window.__PREFIX=[];   // addPrefix 调用记录
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(...a)=>{window.__TOOLRENDER=a;},
   sender:{addPrefix:(pid,node,opts)=>{
     const lg=(e)=>{const o={text:e.textContent||"", tag:e.tagName};return o;};
     try{
       RD.render(node, document.getElementById("toolbar"));
       window.__PREFIX.push({pid,opts,rendered:document.getElementById("toolbar").innerText});
     }catch(e){ window.__PREFIX.push({pid,opts,error:String(e)}); }
   }}}};

try{
  const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
  await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
  window.__LOADED=true;
}catch(e){ window.__LOADERR=String(e); }
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__diag.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            pageerrs = []
            pg.on("pageerror", lambda e: pageerrs.append(str(e)))
            cons = []
            pg.on("console", lambda m: cons.append("%s: %s" % (m.type, m.text)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__diag.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.wait_for_timeout(1200)

            d = pg.evaluate("""()=>({
              loaded: window.__LOADED||false,
              loaderr: window.__LOADERR||"",
              prefix: window.__PREFIX||[],
              toolRender: !!window.__TOOLRENDER,
              errs: window.__ERR||[],
              logs: window.__LOG||[],
              toolbar: (document.getElementById('toolbar')||{}).innerText||""
            })""")
            print("═══ bundle 加载 ═══")
            print("  loaded =", d["loaded"], " loaderr =", d["loaderr"] or "(无)")
            print("  toolRender 已注册 =", d["toolRender"])
            print("\n═══ addPrefix 调用 ═══")
            for x in d["prefix"]:
                print("  ", json.dumps(x, ensure_ascii=False)[:300])
            if not d["prefix"]:
                print("   ❌ 完全没有调用 addPrefix")
            print("\n═══ 工具栏渲染结果 ═══")
            print("  ", repr(d["toolbar"])[:300])
            print("\n═══ console.error ═══")
            for e in d["errs"][:8]:
                print("  ", e[:260])
            print("\n═══ 相关 console.log ═══")
            for l in d["logs"]:
                if "question-modal" in l or "settings" in l:
                    print("  ", l[:220])
            print("\n═══ pageerror ═══")
            for e in pageerrs[:5]:
                print("  ", e[:260])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    return 0

if __name__ == "__main__":
    sys.exit(main())
