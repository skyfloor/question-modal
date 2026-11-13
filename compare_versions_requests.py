# -*- coding: utf-8 -*-
"""对比测量：旧版（无 SSE）vs 新版（有 SSE）在反代被拦截时的后台请求量。

用户说「之前的版本没有这个问题」。本脚本用同一套失败场景，分别跑
两个 dist 产物，量化差异 —— 证明问题由哪一版引入、差多少。

做法：把待测 dist 临时放到一个独立文件名下，页面从该文件名加载，
避免反复覆盖线上正在服务的 index.js。
"""
import json
import os
import shutil
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG_DIST = "/app/working/plugins/question-modal/dist"
SERVED = "/api/frontend_plugin/question-modal/files/dist"

CUR = PLUG_DIST + "/index.js"
OLD = None
for cand in ("index.js.bak-0859-prePhase1", "index.js.bak-1910-preLastQ",
             "index.js.bak-1748-preFix2"):
    p = PLUG_DIST + "/" + cand
    if os.path.exists(p):
        OLD = p
        break


def page(entry_name: str, scen: str) -> str:
    return r"""
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
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}},
 Modal:function(p){return (p&&p.open===false)?null:((p&&p.children)||null);},
 Popover:function(p){return (p&&p.children)||null;}};
antd.Modal.info=()=>{};
window.Notification=undefined; localStorage.clear();
window.__HITS=[];
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("question-modal")){
   window.__HITS.push({t:Date.now(), ep:(url.split("/question-modal/")[1]||"?").split("?")[0]});
   const s="__SCEN__";
   if(s==="html") return Promise.resolve(new Response(
     "<!doctype html><html><body>WAF</body></html>",
     {status:200,headers:{"Content-Type":"text/html"}}));
   if(s==="502") return Promise.resolve(new Response("Bad Gateway",{status:502}));
   if(s==="429") return Promise.resolve(new Response("Too Many",{status:429}));
 }
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
   config:{mode:"manual",model_id:"",template_id:"",with_context:false,parallel:false,
     notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
     slow_question_sec:60,skip_mode:"per_question",fallback_title:true,wait_hint_sec:180,
     __sources__:{}},
   has_session:false,active_scope:"default",session_config:{},global_config:{},key_ts:{}}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"wd",model:"x"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[]}),{status:200}));
 return rf(u,o);};
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const src=await (await rf("__ENTRY__")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_CMP",arguments:JSON.stringify({title:"对比",questions:QS})}}]}}),h);};
window.__ready=true;
</script></body></html>
"""


def measure(pw, entry_name, scen, wait_ms=12000):
    tag = entry_name.replace(".js", "").replace(".", "_")
    html = "dist/__cmp_%s_%s.html" % (tag, scen)
    open(PLUG_DIST + "/" + html.split("dist/")[1], "w", encoding="utf-8").write(
        page(entry_name, scen).replace("__SCEN__", scen).replace("__ENTRY__", SERVED + "/" + entry_name))
    try:
        b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
        pg = b.new_page()
        pg.goto(BASE + SERVED + "/" + html.split("dist/")[1], wait_until="load")
        pg.wait_for_function("window.__ready===true", timeout=30000)
        pg.evaluate("window.__HITS=[]")
        pg.evaluate("window.__mount()")
        pg.wait_for_timeout(wait_ms)
        hits = pg.evaluate("window.__HITS")
        b.close()
        return hits
    finally:
        try:
            os.remove(PLUG_DIST + "/" + html.split("dist/")[1])
        except Exception:
            pass


def agg(hits):
    d = {}
    for h in hits:
        d.setdefault(h["ep"], []).append(h["t"])
    return {ep: len(ts) for ep, ts in d.items()}


def main():
    if not OLD:
        print("没有找到旧版产物，无法对比")
        return 1
    print("旧版产物:", os.path.basename(OLD))
    print("新版产物: index.js (%.0f KB)" % (os.path.getsize(CUR) / 1024))
    print("旧版大小: %.0f KB" % (os.path.getsize(OLD) / 1024))

    # 把旧版放到同目录下另一个名字，供 served 路径访问
    old_copy = PLUG_DIST + "/__cmp_old.js"
    shutil.copyfile(OLD, old_copy)
    try:
        with sync_playwright() as pw:
            for scen, label in (("html", "WAF 返回 HTML"), ("502", "网关 502"), ("429", "限流 429")):
                print("\n===== 场景：%s（12 秒窗口）=====" % label)
                h_old = measure(pw, "__cmp_old.js", scen)
                h_new = measure(pw, "index.js", scen)
                a_old, a_new = agg(h_old), agg(h_new)
                print("  旧版：总量=%-3d 明细=%s" % (len(h_old), a_old))
                print("  新版：总量=%-3d 明细=%s" % (len(h_new), a_new))
                if len(h_old) or len(h_new):
                    ratio = (len(h_new) / len(h_old)) if h_old else float("inf")
                    print("  倍数：%s" % ("∞（旧版 0 请求）" if not h_old else "%.1fx" % ratio))
    finally:
        try:
            os.remove(old_copy)
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
