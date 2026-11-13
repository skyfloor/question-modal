# -*- coding: utf-8 -*-
"""真机验证：全局配置页删减（显示节全删 + 行为节删 4 项）。"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
SP = "/app/working/plugins/question-modal/session_prefs.json"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
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
window.__state=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  return { text:(root.innerText||"") };
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__opt.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__opt.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)

            # 切到全局配置页
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='全局配置');
              if(t)t.click();
            }""")
            pg.wait_for_timeout(1000)
            t = pg.evaluate("window.__state()")["text"]
            print("  全局配置页文本:", json.dumps(t[:280], ensure_ascii=False))

            GONE = ["推荐徽章位置", "徽章外观", "推荐项底色", "选项自动编号",
                    "缺题干时显示", "显示 AI 推荐标记", "未作答时拦截翻页",
                    "题级计时提示", "跳过方式", "显示"]
            hit = [x for x in GONE if x in t]
            ck("[R1] 显示节 5 项全部移除", not any(x in t for x in
                ("推荐徽章位置","徽章外观","推荐项底色","选项自动编号","缺题干时显示")), hit)
            ck("[R2] 行为节移除 4 项", not any(x in t for x in
                ("显示 AI 推荐标记","未作答时拦截翻页","题级计时提示","跳过方式")), hit)
            ck("[R3] 保留：人工模式时提醒 + 单题分析超时",
               "人工模式时提醒" in t and "单题分析超时" in t, "")
            ck("[R4] 保留：杂项（等待阈值/拦截记录）",
               "等待提示阈值" in t and "拦截记录" in t, "")
            ck("[R5] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
