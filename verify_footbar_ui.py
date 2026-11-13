# -*- coding: utf-8 -*-
"""真机验证：设置面板保存条重排 + 移除覆盖圆点/作用域标签/清空按钮（2026-11-12）。

用户裁定：
  1. 删「清空本会话覆盖」按钮（右上角选择器改手动后语义冗余）。
  2. 保存按钮移到右下角且高亮；删「还原」按钮；新增「取消」按钮（丢弃未保存修改）。
  3. 覆盖标记圆点（qm-set-srcdot）整体移除；行内「会话/全局」作用域小标签移除；
     选中态由既有高亮（qm-set-segon 等）表达。

断言：
  [F1] 无「清空本会话覆盖」按钮/文本（默认页 + 会话页）
  [F2] 无「还原」按钮
  [F3] 取消按钮存在，初始（无改动）禁用；保存按钮存在、primary、禁用
  [F4] 保存按钮位于面板右下角，取消按钮在其左侧
  [F5] 无 qm-set-srcdot 圆点；无「会话/全局/全局·可覆盖」行内标签
  [F6] 点开关 → dirty 提示出现、取消解禁；点取消 → 值恢复、dirty 消失、取消再禁用
安全：只点开关后取消，绝不点保存；不写 session_prefs.json（无备份恢复需求）。
"""
import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

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
window.__modalCancel=null;
function FakeModal(p){
  window.__modalCancel = p && p.onCancel ? p.onCancel : null;
  return (p&&p.children)||null;
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

window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  const fresh = window.QwenPaw.host.React.cloneElement
    ? window.QwenPaw.host.React.cloneElement(window.__btnNode)
    : window.__btnNode;
  RD.render(fresh, h);
  setTimeout(()=>{
    const btn=h.querySelector("button");
    if(btn){ btn.click(); window.__lastOpen="clicked"; }
    else window.__lastOpen="no-button";
  }, 50);
  return "scheduled";
};
window.__pick=(c)=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const label=c==="session"?"会话模式":"默认模式";
  const t=[...root.querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(t){ t.click(); return "picked-tab:"+label; }
  return "no-tab:"+label;
};
window.__foot=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const q=(s)=>root.querySelector(s);
  const cancel=q("[data-qm-cancel]"), save=q("[data-qm-save]"), revert=q("[data-qm-revert]");
  const sessClear=q("[data-qm-sessclear]");
  const wrap=q(".qm-set-wrap");
  const fr=save?save.getBoundingClientRect():null;
  const wr=wrap?wrap.getBoundingClientRect():null;
  const cr=cancel?cancel.getBoundingClientRect():null;
  const tags=[...root.querySelectorAll(".qm-set-scopetag")].map(t=>t.textContent.trim());
  // 用户 2026-11-12 报「保存按钮需要保持与 html 的高亮」：必须断言计算样式
  // 真的是蓝底 #3b82f6（类名存在 ≠ 视觉高亮；CSS 顺序/特异性错就会变灰）。
  const sbg=save?getComputedStyle(save).backgroundColor:"";
  const scolor=save?getComputedStyle(save).color:"";
  return {
    hasCancel: !!cancel, cancelDisabled: cancel?cancel.disabled:null,
    hasSave: !!save, saveDisabled: save?save.disabled:null,
    savePrimary: save?/qm-set-btnprimary/.test(save.className):null,
    saveBg: sbg, saveColor: scolor,
    saveLabel: save?(save.textContent||"").trim():"",
    hasRevert: !!revert, revertText: (root.innerText||"").includes("还原"),
    hasSessClear: !!sessClear, sessClearText: (root.innerText||"").includes("清空本会话覆盖"),
    srcdotCount: root.querySelectorAll(".qm-set-srcdot").length,
    scopeTags: tags,
    dirtyText: (root.innerText||"").match(/有 \d+ 项未保存/)?(root.innerText.match(/有 \d+ 项未保存/)[0]):"",
    saveRightGap: (fr&&wr)?Math.round(wr.right-fr.right):-1,
    saveBottomGap: (fr&&wr)?Math.round(wr.bottom-fr.bottom):-1,
    cancelLeftOfSave: (cr&&fr)?(cr.right<=fr.left+1):-1,
  };
};
window.__toggleParallel=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const rows=[...root.querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("并行分析"));
  if(!row) return "no-row";
  const sw=row.querySelector(".qm-set-switch");
  if(!sw) return "no-switch";
  const before=sw.getAttribute("data-qm-on");
  sw.click();
  return "toggled-from:"+before;
};
window.__parallelState=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const rows=[...root.querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("并行分析"));
  const sw=row?row.querySelector(".qm-set-switch"):null;
  return sw?sw.getAttribute("data-qm-on"):"?";
};
window.__cancel=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const b=root.querySelector("[data-qm-cancel]");
  if(b){ b.click(); return "cancelled"; }
  return "no-cancel";
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__footbar.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"],
                                   executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__footbar.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(1800)
            f1 = pg.evaluate("window.__foot()")
            print("\n  [打开面板·默认模式页]", json.dumps(f1, ensure_ascii=False))

            ck("[F1] 无「清空本会话覆盖」按钮与文本",
               not f1["hasSessClear"] and not f1["sessClearText"], "")
            ck("[F2] 无「还原」按钮与文本",
               not f1["hasRevert"] and not f1["revertText"], "")
            ck("[F3a] 取消按钮存在且初始禁用",
               f1["hasCancel"] and f1["cancelDisabled"] is True, f1["cancelDisabled"])
            ck("[F3b] 保存按钮存在、primary 高亮、无修改也可点（2026-11-12 裁定）",
               f1["hasSave"] and f1["savePrimary"] and f1["saveDisabled"] is False,
               (f1["savePrimary"], f1["saveDisabled"]))
            ck("[F3c] 保存按钮计算样式=蓝底白字（对齐 HTML 稿 .btn-save，非灰底）",
               "59, 130, 246" in f1["saveBg"] and "255, 255, 255" in f1["saveColor"],
               (f1["saveBg"], f1["saveColor"]))
            ck("[F4a] 保存按钮贴面板右缘（右下角）",
               f1["saveRightGap"] is not None and 0 <= f1["saveRightGap"] < 60,
               f1["saveRightGap"])
            ck("[F4b] 保存按钮位于底部区域",
               f1["saveBottomGap"] is not None and 0 <= f1["saveBottomGap"] < 80,
               f1["saveBottomGap"])
            ck("[F4c] 取消按钮在保存按钮左侧",
               f1["cancelLeftOfSave"] is True, f1["cancelLeftOfSave"])
            ck("[F5a] 无覆盖圆点 qm-set-srcdot", f1["srcdotCount"] == 0, f1["srcdotCount"])
            bad_tags = [t for t in f1["scopeTags"] if t in ("会话", "全局", "全局·可覆盖")]
            ck("[F5b] 无「会话/全局/全局·可覆盖」行内标签",
               len(bad_tags) == 0, f1["scopeTags"])

            # ── 会话模式页签：同样无清空按钮 ──
            pg.evaluate("window.__pick('session')")
            pg.wait_for_timeout(700)
            f2 = pg.evaluate("window.__foot()")
            print("  [切到会话模式页]", json.dumps(f2, ensure_ascii=False))
            ck("[F1b] 会话页签也无「清空本会话覆盖」",
               not f2["hasSessClear"] and not f2["sessClearText"], "")
            ck("[F5c] 会话页签也无覆盖圆点/行内会话标签",
               f2["srcdotCount"] == 0 and
               not [t for t in f2["scopeTags"] if t in ("会话", "全局", "全局·可覆盖")],
               (f2["srcdotCount"], f2["scopeTags"]))

            # ── 交互：点「并行分析」开关 → dirty → 取消恢复 ──
            t = pg.evaluate("window.__toggleParallel()")
            pg.wait_for_timeout(500)
            f3 = pg.evaluate("window.__foot()")
            print("  [点开关后]", t, json.dumps(f3, ensure_ascii=False))
            ck("[F6a] 点开关后出现未保存提示", "有 1 项未保存" in f3["dirtyText"],
               f3["dirtyText"])
            ck("[F6b] 取消按钮解禁", f3["cancelDisabled"] is False, f3["cancelDisabled"])
            ck("[F6c] 保存按钮解禁", f3["saveDisabled"] is False, f3["saveDisabled"])

            c = pg.evaluate("window.__cancel()")
            pg.wait_for_timeout(500)
            f4 = pg.evaluate("window.__foot()")
            pstate = pg.evaluate("window.__parallelState()")
            print("  [点取消后]", c, "parallel=", pstate, json.dumps(f4, ensure_ascii=False))
            ck("[F6d] 取消后未保存提示消失", f4["dirtyText"] == "", f4["dirtyText"])
            ck("[F6e] 取消后取消按钮重新禁用", f4["cancelDisabled"] is True,
               f4["cancelDisabled"])
            ck("[F6f] 取消后保存按钮仍可点（只丢改动，不禁用保存；2026-11-12 裁定）",
               f4["saveDisabled"] is False,
               f4["saveDisabled"])
            ck("[F6g] 取消后开关恢复原值（未保存的修改被丢弃）", pstate == "0", pstate)
            ck("[F6h] 取消后仍无圆点/还原/清空",
               f4["srcdotCount"] == 0 and not f4["hasRevert"] and not f4["hasSessClear"], "")

            ck("[F0] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            import os
            os.remove(p)
        except OSError:
            pass

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
