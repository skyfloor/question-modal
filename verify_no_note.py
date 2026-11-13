# -*- coding: utf-8 -*-
"""真机验证：会话模式/默认模式/全局配置三页的多余说明文字已移除。"""
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

def set_sess(vals):
    payload = {"sessions": {CHAT: vals} if vals else {}, "updated_at": 1}
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, SP)

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
    p = "/app/working/plugins/question-modal/dist/__nn.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            set_sess({})     # 无覆盖 → 默认模式页
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__nn.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)

            BANNED = ["以下改动只保存到「会话模式」", "以下是作答与分析的行为默认值",
                      "以下是显示类与杂项的全局设置", "这五项只对当前会话生效",
                      "只影响当前会话", "想改所有会话的默认值"]
            t1 = pg.evaluate("window.__state()")["text"]
            hit = [x for x in BANNED if x in t1]
            ck("[R1] 默认模式页无多余说明文字", not hit, hit)

            # 切到会话模式页
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='会话模式');
              if(t)t.click();
            }""")
            pg.wait_for_timeout(900)
            t2 = pg.evaluate("window.__state()")["text"]
            hit2 = [x for x in BANNED if x in t2]
            ck("[R2] 会话模式页无多余说明文字", not hit2, hit2)

            # 切到全局配置页
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='全局配置');
              if(t)t.click();
            }""")
            pg.wait_for_timeout(900)
            t3 = pg.evaluate("window.__state()")["text"]
            hit3 = [x for x in BANNED if x in t3]
            ck("[R3] 全局配置页无多余说明文字", not hit3, hit3)

            # 功能仍在：按钮、保存条都健在
            t_all = t1 + t2 + t3
            ck("[R4] 保存按钮文案仍在（操作反馈，非说明文字）",
               "保存" in t_all, "")
            ck("[R5] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass
    set_sess({"mode": "manual"})
    print("  已恢复 {mode: manual}")
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
