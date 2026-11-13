# -*- coding: utf-8 -*-
"""真实浏览器：卡片实际显示值 vs /effective-config（设置页数据源）。

用当前真实后端状态驱动，不造数据，直接量出分歧。
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"

def eff():
    u = (BASE + "/api/question-modal/effective-config?session_id=%s&agent_id=%s" % (SID, AG))
    return json.loads(urllib.request.urlopen(u, timeout=20).read())["config"]

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
 const g=h.querySelector("i");h.remove();if(g){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_DIV",arguments:JSON.stringify({title:"对照",questions:QS})}}]}}),h);};
window.__read=()=>{
  const btns=[...document.querySelectorAll('button, .qm-capsule, [class*=capsule]')]
    .map(b=>(b.textContent||'').trim()).filter(Boolean);
  return btns;
};
window.__ready=true;
</script></body></html>
"""

def main():
    c = eff()
    print("═══ /effective-config（设置页「当前会话」页显示的依据）═══")
    for k in ("mode", "model_id", "template_id", "with_context", "parallel"):
        print("   %-14s = %r" % (k, c.get(k)))

    p = "/app/working/plugins/question-modal/dist/__div.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__div.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")
            pg.wait_for_timeout(2600)

            texts = pg.evaluate("window.__read()")
            print("\n═══ 卡片实际渲染出的按钮/胶囊文本 ═══")
            for t in texts[:12]:
                print("   ", repr(t))

            blob = " | ".join(texts)
            print("\n═══ 逐项比对 ═══")
            # model
            want_model = c.get("model_id") or ""
            card_has_model = bool(want_model and want_model.split(":")[-1] in blob)
            print("   model_id : 设置页=%r  卡片含该模型=%s" % (want_model, card_has_model))
            if not want_model:
                follow = "跟随当前对话模型" in blob or "跟随" in blob
                has_any_model = any(":" in t for t in texts)
                print("             → model_id 为空；卡片显示跟随对话模型=%s  (%r)"
                      % (follow, [t for t in texts if ":" in t][:2]))
            # template
            print("   template_id : 设置页=%r  卡片模板胶囊=%r"
                  % (c.get("template_id"), [t for t in texts if "▾" in t][:2]))
            # mode
            modes = [t for t in texts if t in ("自动分析", "只用推荐", "人工")]
            print("   mode : 设置页=%r  卡片三键=%r" % (c.get("mode"), modes))

            print("\n   JS 异常:", errs[:2] if errs else "无")
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    return 0

if __name__ == "__main__":
    sys.exit(main())
