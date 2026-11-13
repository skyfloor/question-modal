# -*- coding: utf-8 -*-
"""端到端复检：模拟用户完整操作路径（含硬刷新），逐项验证两轮共 7 项改动。
每轮关键操作后都 reload 页面（等价用户 Ctrl+Shift+R），确保验证的是
「从服务器新拉的 bundle」而不是页面内残留状态。"""
import json, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
ok_all = True

def check(name, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("  ✓ " if cond else "  ✗ ") + name + ((" | " + str(extra)) if extra else ""))

def api(path, method="GET", body=None):
    req = urllib.request.Request(BASE + "/api" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw.strip() else {}

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
function FakeModal(p){window.__modalCancel=p&&p.onCancel?p.onCancel:null;return (p&&p.children)||null;}
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
  RD.render(window.__btnNode, h);
  setTimeout(()=>{const btn=h.querySelector("button"); if(btn)btn.click();},50);
  return "scheduled";
};
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__state=()=>{
  const r=root();
  const tabs=[...r.querySelectorAll(".qm-set-tab")];
  const on=tabs.find(x=>/qm-set-tabon/.test(x.className));
  const active=on?(on.textContent||"").trim():null;
  // 2026-11-12：右上角只保留一个「当前运行」状态胶囊；作用域选择入口 = 页签本身
  return { sel:active, active:active,
    runtimePills:r.querySelectorAll(".qm-set-runtime").length,
    scopePicks:r.querySelectorAll("[data-qm-scope-pick]").length,
    runtime:(r.querySelector("[data-qm-runtime]")||{}).textContent||null,
    sections:r.querySelectorAll(".qm-set-section").length };
};
window.__pickScope=(c)=>{
  const label=c==="session"?"会话模式":"默认模式";
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(t){t.click();return "ok";}return "no";
};
window.__pickTab=(label)=>{const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);if(t){t.click();return "ok";}return "no";};
window.__modeRow=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  return row?[...row.querySelectorAll(".qm-set-segbtn")].map(b=>({label:(b.textContent||"").trim(),on:/qm-set-segon/.test(b.className)})):null;
};
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  const btn=row&&[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no"; btn.click(); return "ok";
};
window.__saveState=()=>{
  const r=root(); const s=r.querySelector("[data-qm-save]"); const c=r.querySelector("[data-qm-cancel]");
  const txt=r.innerText||"";
  return { saveDisabled:s?s.disabled:null, cancelDisabled:c?c.disabled:null,
    dirtyHint:(txt.match(/有 \d+ 项未保存/)||[""])[0],
    saveMsg:(txt.match(/已保存[^\n]*|保存失败[^\n]*/)||[""])[0] };
};
window.__clickSave=()=>{const b=root().querySelector("[data-qm-save]");if(!b)return "no";b.click();return "ok";};
window.__tabOnStyle=()=>{const t=root().querySelector(".qm-set-tabon");if(!t)return null;
  const cs=getComputedStyle(t);return {bg:cs.backgroundColor,bb:cs.borderBottomColor,br:cs.borderBottomLeftRadius};};
window.__noteLine=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("人工模式时提醒"));
  const note=row&&(row.querySelector(".qm-set-rownote")||row);
  return note?{h:note.clientHeight,sh:note.scrollHeight}:null;
};
window.__clearMem=()=>{localStorage.removeItem("qm:v1:scopeChoice");return "cleared";};
window.__close=()=>{window.__modalCancel&&window.__modalCancel();return "closed";};
window.__ready=true;
</script></body></html>
"""

def launch_page(pw):
    b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
    pg = b.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__verify_e2e.html", wait_until="load")
    pg.wait_for_function("window.__ready===true", timeout=30000)
    return b, pg, errs

def main():
    # 本测试的第 1 轮断言要求「本会话已有覆盖」，因此必须自建前提，
    # 不能依赖外部残留数据（其他测试会把覆盖清空）。
    import json as _json
    _sp = "/app/working/plugins/question-modal/session_prefs.json"
    try:
        _bak = open(_sp, encoding="utf-8").read()
    except Exception:
        _bak = None
    try:
        _cur = _json.loads(_bak) if _bak else {"sessions": {}}
    except Exception:
        _cur = {"sessions": {}}
    _sess = _cur.get("sessions") if isinstance(_cur.get("sessions"), dict) else {}
    _sess[CHAT] = {"mode": "recommend"}
    with open(_sp, "w", encoding="utf-8") as _f:
        _json.dump({"sessions": _sess, "updated_at": 1}, _f, ensure_ascii=False)
    print("已自建前提：本会话覆盖 mode=recommend")

    orig = api("/question-modal/prefs").get("prefs", {})
    print("原全局 mode =", repr(orig.get("mode")), "（用户会话覆盖 mode=recommend 不动）")
    p = "/app/working/plugins/question-modal/dist/__verify_e2e.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b, pg, errs = launch_page(pw)

            print("\n== 第 1 轮：打开面板（模拟硬刷新后首次进入）==")
            pg.evaluate("window.__clearMem()")   # 用户浏览器无历史记忆
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            s1 = pg.evaluate("window.__state()")
            print("  ", json.dumps(s1, ensure_ascii=False))
            check("① 胶囊=会话模式（has_session=true）", s1["runtime"].strip() == "会话模式", s1["runtime"])
            check("①b 右上角只有 1 个运行模式胶囊（用户报出现 2 个）", s1["runtimePills"] == 1 and s1["scopePicks"] == 0, (s1["runtimePills"], s1["scopePicks"]))
            check("② 初始选中=会话模式、页签=会话模式", s1["sel"] == "会话模式" and s1["active"] == "会话模式", (s1["sel"], s1["active"]))
            check("⑨ 无分组小标题", s1["sections"] == 0, s1["sections"])
            st = pg.evaluate("window.__saveState()")
            check("③ 无修改时保存按钮可点", st["saveDisabled"] is False, st)
            pg.evaluate("window.__clickSave()")
            pg.wait_for_timeout(1500)
            st2 = pg.evaluate("window.__saveState()")
            check("③b 空改动保存成功", "已保存" in st2["saveMsg"], st2["saveMsg"])
            ts = pg.evaluate("window.__tabOnStyle()")
            check("⑧ 页签高亮=蓝底胶囊", ts and "59, 130, 246" in ts["bg"] and ts["br"] == "20px", ts)

            print("\n== 第 2 轮：切「默认模式」→ 硬刷新 → 重开（问题 2 用户路径）==")
            pg.evaluate("window.__pickScope('default')")
            pg.wait_for_timeout(1500)
            s2 = pg.evaluate("window.__state()")
            check("④ 点击后选中=默认模式、页签=默认模式", s2["sel"] == "默认模式" and s2["active"] == "默认模式", (s2["sel"], s2["active"]))
            # 硬刷新（等价 Ctrl+Shift+R）
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            s3 = pg.evaluate("window.__state()")
            print("  重开后:", json.dumps(s3, ensure_ascii=False))
            check("⑤ 硬刷新后重开仍=默认模式（不弹回会话）", s3["sel"] == "默认模式" and s3["active"] == "默认模式", (s3["sel"], s3["active"]))
            check("⑤b 右上角仍只有 1 个运行模式胶囊", s3["runtimePills"] == 1 and s3["scopePicks"] == 0, (s3["runtimePills"], s3["scopePicks"]))
            check("⑥ 胶囊=默认模式（覆盖还在但会话无覆盖时）", s3["runtime"].strip() == "默认模式", s3["runtime"])

            print("\n== 第 3 轮：默认页 mode 行显示当前全局值 + 选「人工」保存生效 ==")
            # 期望值 = 此刻真实的全局 mode（不硬编码具体值——用户可能改过全局默认）。
            # 修复要验证的是：默认页显示「当前真实全局值」而非出厂默认「人工」。
            gm = api("/question-modal/prefs").get("prefs", {}).get("mode") or "manual"
            gm_label = {"ai": "自动分析", "recommend": "只用推荐", "manual": "人工"}.get(gm, gm)
            mr = pg.evaluate("window.__modeRow()")
            on0 = [x["label"] for x in (mr or []) if x["on"]]
            print("  默认页 mode 行当前高亮:", on0, "｜全局 mode =", gm)
            check("⑦-修复 默认页显示当前全局值(" + gm_label + ")", on0 == [gm_label], on0)
            # ⑦ 系列断言要求「保存后全局 mode=manual」。点「人工」是否产生
            # dirty 取决于当前全局值 —— 若本来就是人工则无改动，⑦b 的
            # 「1 项未保存」不会出现（假失败）。因此在点之前先把全局置为非人工，
            # 保证「人工」一定是一次真实改动。
            if gm_label == "人工":
                api("/question-modal/prefs", method="POST", body={"mode": "ai"})
                pg.reload(wait_until="load")
                pg.wait_for_function("window.__ready===true", timeout=30000)
                pg.evaluate("window.__open()")
                pg.wait_for_timeout(2000)
                pg.evaluate("window.__pickTab('默认模式')")
                pg.wait_for_timeout(1200)
                gm_label = "自动分析"
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(400)
            mr2 = pg.evaluate("window.__modeRow()")
            on1 = [x["label"] for x in (mr2 or []) if x["on"]]
            check("⑦ 点人工后高亮移动", on1 == ["人工"], on1)
            st3 = pg.evaluate("window.__saveState()")
            check("⑦b 改动后保存可点+未保存提示", st3["saveDisabled"] is False and "1 项未保存" in st3["dirtyHint"], st3)
            pg.evaluate("window.__clickSave()")
            pg.wait_for_timeout(1500)
            now = api("/question-modal/prefs").get("prefs", {})
            check("⑦c 全局 mode=manual 落盘", now.get("mode") == "manual", now.get("mode"))

            print("\n== 第 3b 轮：保存后硬刷新重开（不点选择器/页签）——保存值仍正确显示 ==")
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            mr3 = pg.evaluate("window.__modeRow()")
            on3 = [x["label"] for x in (mr3 or []) if x["on"]]
            check("⑦d 重开默认页显示刚保存的「人工」", on3 == ["人工"], on3)

            print("\n== 第 4 轮：note 单行（全局配置页）==")
            pg.evaluate("window.__pickTab('全局配置')")
            pg.wait_for_timeout(800)
            nl = pg.evaluate("window.__noteLine()")
            check("⑩ 提醒小字单行", nl and nl["h"] <= 20 and nl["sh"] <= 20, nl)

            print("\npageerror:", errs[:3])
            check("⑪ 全程无 JS 异常", not errs, errs[:2])
            pg.evaluate("window.__clearMem()")
            b.close()
    finally:
        import os
        try: os.remove(p)
        except OSError: pass
        api("/question-modal/prefs", "POST", orig)
        print("已恢复全局 mode =", repr(api("/question-modal/prefs").get("prefs", {}).get("mode")))
    print("\nRESULT:", "ALL PASS" if ok_all else "HAS FAILURES")

if __name__ == "__main__":
    sys.exit(main())
