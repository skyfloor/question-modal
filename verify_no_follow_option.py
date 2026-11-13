# -*- coding: utf-8 -*-
"""真机验证：会话模式/默认模式页的模型选择器不再有「跟随当前对话模型」选项。"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
ok = fail = 0

def ck(n, c, d=""):
    global ok, fail
    if c: ok += 1; print("  ✓ " + n)
    else: fail += 1; print("  ✗ " + n + "  " + str(d))

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="root"></div>
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
function FakeModal(p){return (p&&p.children)||null;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  RD.render(R.cloneElement(window.__btnNode),h);
  setTimeout(()=>{const b=h.querySelector("button"); if(b)b.click();},50);
};
window.__providers=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const sels=[...root.querySelectorAll("select")];
  return sels.map(s=>({
    options:[...s.options].map(o=>({v:o.value,t:o.textContent.trim(),disabled:o.disabled})),
    value:s.value,
    title:s.title,
  }));
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__nf.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__nf.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)

            # 默认模式页（无覆盖自动落此页）
            provs = pg.evaluate("window.__providers()")
            print("  下拉列表:", json.dumps(provs, ensure_ascii=False)[:400])

            # 厂商下拉的选项
            provider_sel = next((s for s in provs if "厂商" in (s["title"] or "") or any(o["t"] in ("厂商",) for o in s["options"])), None)
            # 直接找第一个含「未配置」或厂商名的 select
            has_follow = any("跟随" in (o["t"] or "") for s in provs for o in s["options"])
            has_placeholder = any((o["t"] or "") == "未配置" for s in provs for o in s["options"])
            ck("[R1] 厂商下拉不再有「跟随当前对话模型」选项", not has_follow, "")
            ck("[R2] 空值时显示「未配置」占位", has_placeholder, "")

            # 切到会话模式页再验一次
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='会话模式');
              if(t)t.click();
            }""")
            pg.wait_for_timeout(1000)
            provs2 = pg.evaluate("window.__providers()")
            has_follow2 = any("跟随" in (o["t"] or "") for s in provs2 for o in s["options"])
            ck("[R3] 会话模式页同样无「跟随」选项", not has_follow2, "")
            ck("[R4] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
