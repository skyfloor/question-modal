# -*- coding: utf-8 -*-
"""视觉迁移验证：比对实现与设计稿的关键度量 + 输出截图。

设计稿 = deepseek_html_20261113_7c1203.html（用户提供）
本轮只改 UI，保存逻辑由 verify_save_guard.py 守住。

断言（读真实 computed style，不是读源码）：
  [V1] 弹窗 max-height = 90vh
  [V2] 弹窗宽度 = 680px
  [V3] header padding-top = 24px / 左右 28px
  [V4] tabs padding = 10px 28px 20px
  [V5] setting-row 上下 padding = 22px
  [V6] switch 宽 = 44px、激活时 knob 位移 = 22px
  [V7] footer padding-top = 20px
  [V8] 胶囊页签激活态 = 蓝底白字（设计稿 .tab-item.active）
  [V9] 保存按钮 = 蓝底白字（设计稿 .btn-save）
  [V10] 分段选择激活项 = 白底蓝字（设计稿 .radio-btn.active）
  [V11] 无页面错误
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"
AG = "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
SID = "1791724819571-muuetab"
SHOT = "/app/working/build/question-modal-dev/shot_ui_migrate.png"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


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
/* 假 Modal 桩：antd Modal 会给内容层套一个 width 受限的容器。
   纯返回 children 会让 .qm-set-wrap 撑满整页 → 宽度/高度度量失去意义。
   这里按 props.width 复刻一个等价容器（仅测试用，不影响真实渲染）。 */
function FakeModal(p){
  const w = (p && typeof p.width === "number") ? p.width : 520;
  return R.createElement("div", {
    style: { width: w + "px", maxWidth: "calc(100vw - 32px)", margin: "0 auto" }
  }, (p&&p.children)||null);
}
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
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  RD.render(window.__btnNode, h);
  setTimeout(()=>{ const b=h.querySelector("button"); if(b)b.click(); }, 50);
  return "scheduled";
};
window.__tab=(label)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label; t.click(); return "tab:"+label;
};
/* 读真实计算样式 */
window.__metrics=()=>{
  const r=root();
  const cs=(el)=>{ if(!el) return null; const s=getComputedStyle(el); return s; };
  const wrap=r.querySelector(".qm-set-wrap")||r;
  const head=r.querySelector(".qm-set-head");
  const tabs=r.querySelector(".qm-set-tabs");
  const row=r.querySelector(".qm-set-row");
  const sw=r.querySelector(".qm-set-switch");
  const foot=r.querySelector(".qm-set-foot");
  const tabOn=r.querySelector(".qm-set-tabon");
  const segOn=r.querySelector(".qm-set-segon");
  const saveBtn=r.querySelector("[data-qm-save]");
  const swOn=r.querySelector(".qm-set-switch-on");
  const knob=swOn?swOn.querySelector(".qm-set-knob"):null;
  const g=(el,p)=>{ const s=cs(el); return s?s.getPropertyValue(p).trim():null; };
  return {
    wrapMaxH: parseFloat(g(wrap,"max-height")) || 0,
    wrapWidth: wrap.getBoundingClientRect().width,
    headPadTop: g(head,"padding-top"),
    headPadLeft: g(head,"padding-left"),
    tabsPadTop: g(tabs,"padding-top"),
    tabsPadLeft: g(tabs,"padding-left"),
    tabsPadBottom: g(tabs,"padding-bottom"),
    rowPadTop: g(row,"padding-top"),
    rowPadBottom: g(row,"padding-bottom"),
    swWidth: g(sw,"width"),
    swHeight: g(sw,"height"),
    knobLeft: knob?getComputedStyle(knob).left:null,
    footPadTop: g(foot,"padding-top"),
    tabOnBg: g(tabOn,"background-color"),
    tabOnColor: g(tabOn,"color"),
    segOnBg: g(segOn,"background-color"),
    segOnColor: g(segOn,"color"),
    saveBg: g(saveBtn,"background-color"),
    saveColor: g(saveBtn,"color"),
  };
};
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__ui_metrics.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page(viewport={"width": 900, "height": 1000})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__ui_metrics.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(1000)

            m = pg.evaluate("window.__metrics()")
            print("\n===== 实测度量 =====")
            for k, v in m.items():
                print("    %-14s %s" % (k, v))

            print("\n===== 断言 =====")
            # computed style 会把 90vh 解析成像素值（视口 1000px → 900px），
            # 所以按「视口高度的 90%」比对，而不是比对 "90vh" 字面量。
            _vh = 1000
            ck("[V1] 弹窗 max-height = 90vh（=视口 90%%=%dpx）" % int(_vh * 0.9),
               abs((m["wrapMaxH"] or 0) - _vh * 0.9) <= 2, m["wrapMaxH"])
            ck("[V2] 弹窗宽度 ≈ 680px", abs((m["wrapWidth"] or 0) - 680) <= 2, m["wrapWidth"])
            ck("[V3a] header padding-top = 24px", m["headPadTop"] == "24px", m["headPadTop"])
            ck("[V3b] header padding-left = 28px", m["headPadLeft"] == "28px", m["headPadLeft"])
            ck("[V4a] tabs padding-top = 10px", m["tabsPadTop"] == "10px", m["tabsPadTop"])
            ck("[V4b] tabs padding-left = 28px", m["tabsPadLeft"] == "28px", m["tabsPadLeft"])
            ck("[V4c] tabs padding-bottom = 20px", m["tabsPadBottom"] == "20px", m["tabsPadBottom"])
            ck("[V5a] row padding-top = 22px", m["rowPadTop"] == "22px", m["rowPadTop"])
            ck("[V5b] row padding-bottom = 22px", m["rowPadBottom"] == "22px", m["rowPadBottom"])
            ck("[V6a] switch 宽 = 44px", m["swWidth"] == "44px", m["swWidth"])
            ck("[V6b] switch 高 = 24px", m["swHeight"] == "24px", m["swHeight"])
            ck("[V6c] 激活 knob 位移 = 22px", m["knobLeft"] == "22px", m["knobLeft"])
            ck("[V7] footer padding-top = 20px", m["footPadTop"] == "20px", m["footPadTop"])
            ck("[V8a] 激活页签蓝底 rgb(59,130,246)",
               m["tabOnBg"] == "rgb(59, 130, 246)", m["tabOnBg"])
            ck("[V8b] 激活页签白字", m["tabOnColor"] in ("rgb(255, 255, 255)", "#fff"),
               m["tabOnColor"])
            ck("[V9a] 保存按钮蓝底", m["saveBg"] == "rgb(59, 130, 246)", m["saveBg"])
            ck("[V9b] 保存按钮白字", m["saveColor"] in ("rgb(255, 255, 255)", "#fff"),
               m["saveColor"])
            ck("[V10a] 分段激活白底", m["segOnBg"] in ("rgb(255, 255, 255)", "rgb(248, 250, 252)"),
               m["segOnBg"])
            ck("[V10b] 分段激活蓝字", m["segOnColor"] == "rgb(59, 130, 246)", m["segOnColor"])
            ck("[V11] 无页面错误", not errs, errs[:2])

            pg.screenshot(path=SHOT, full_page=True)
            print("\n    截图: " + SHOT)
            b.close()
    finally:
        try:
            os.remove(hp)
        except OSError:
            pass
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
