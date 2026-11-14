# -*- coding: utf-8 -*-
"""验证 2026-11-14 用户裁定：保存"公共项"不得改运行模式。

用户原话：
  「人工模式提醒 / 单题分析超时 / 等待提示阈值等这些设置，不应该跟随默认
    模式，当前的保存时除了保存之外，还会将当前的运行模式直接改成了默认
    模式，所以是错的。这些是对所有模式生效的，所以如果模式数据修改的情况下，
    修改这些内容不应该修改运行模式」

裁定（问卷 q0/q1/q2）：
  q0 = 保持现状：这几项留在独立「全局配置」页，只修「保存时不该切运行模式」
  q1 = 在模式页无改动点保存，**仍然切换**（保留 2026-11-13「保存即切换」）
  q2 = 「提示词」页保存不改运行模式

被测缺陷（旧代码 src/index.tsx:6869）：
    let switchedTo = isSession ? "session" : "default";
  非会话页一律判成 "default" → 无条件 POST set_scope="default" →
  只改一个「等待提示阈值」就把正在跑的会话静默切成默认模式。

真机（真实 Chromium + 宿主 react-vendor + served bundle + 真实后端）。

用例：
  [A] 前置：把本会话置为「会话模式」运行（__active_scope__=session）
  [B] 全局配置页：改「等待提示阈值」→ 保存
      [B1] 值真的落盘（wait_hint_sec 变了）—— 保存没被牺牲
      [B2] 胶囊仍「会话模式」          —— 核心：运行模式未变
      [B3] 后端 __active_scope__ 仍 session
      [B4] has_session 仍 true
      [B5] 页签未被跳走（仍在全局配置）
      [B6] 提示文案如实说「运行模式未变」且不谎报「已切换到默认模式」
      [B7] 底部保存目标说明含「不改运行模式」
  [C] 提示词页：改模板（或直接保存）→ 保存
      [C1] 胶囊仍「会话模式」
      [C2] 后端 __active_scope__ 仍 session
      [C3] 提示文案说「运行模式未变」
  [D] 反向证明「模式页仍会切换」（回归 2026-11-13 裁定，q1=仍然切换）
      [D1] 默认模式页保存（无改动）→ 胶囊变「默认模式」
      [D2] 后端 __active_scope__=default
      [D3] 提示说「已切换到默认模式」
  [E] 会话模式页保存 → 切回「会话模式」
      [E1] 胶囊回「会话模式」
      [E2] 后端 __active_scope__=session
  [F] 无页面错误
"""
import json
import os
import sys
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"
AG = "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
SID = "1791724819571-muuetab"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def rd(p):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def wr(p, d):
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False)
    os.replace(tmp, p)


def eff():
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(CHAT) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {
        "mode": c.get("mode"),
        "wait_hint_sec": c.get("wait_hint_sec"),
        "model_timeout_sec": c.get("model_timeout_sec"),
        "has_session": d.get("has_session"),
    }


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
function FakeModal(p){ return (p&&p.children)||null; }
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
  const old=document.getElementById("root"); if(old) old.remove();
  const h=document.createElement("div"); h.id="root"; document.body.appendChild(h);
  if(RD.createRoot){ RD.createRoot(h).render(window.__btnNode); }
  else { RD.render(window.__btnNode, h); }
  setTimeout(()=>{ const b=h.querySelector("button"); if(b)b.click(); }, 60);
  return "scheduled";
};
window.__pickTab=(label)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label; t.click(); return "ok";
};
window.__activeTab=()=>[...root().querySelectorAll(".qm-set-tab")]
  .filter(x=>/qm-set-tabon/.test(x.className)).map(x=>(x.textContent||"").trim());
/* 找到「标签名 → 行」的容器 */
window.__rowOf=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  return rows.find(r=>(r.innerText||"").includes(label)) || null;
};
/* 改某个下拉（原生 select）：按目标 option 的文本选中 */
window.__pickSelect=(rowLabel,optText)=>{
  const row=window.__rowOf(rowLabel);
  if(!row) return "no-row:"+rowLabel;
  const sel=row.querySelector("select");
  if(!sel) return "no-select:"+rowLabel;
  const opt=[...sel.options].find(o=>(o.textContent||"").trim()===optText);
  if(!opt) return "no-opt:"+optText+"|have:"+[...sel.options].map(o=>o.textContent).join("/");
  sel.value=opt.value;
  sel.dispatchEvent(new Event("change",{bubbles:true}));
  return "picked:"+opt.value;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "ok"; };
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
window.__footTarget=()=>{ const e=root().querySelector(".qm-set-scopetarget"); return e?(e.textContent||"").trim():null; };
window.__badge=()=>{
  const cap=root().querySelector("[data-qm-runtime]");
  return { capText: cap?(cap.textContent||"").trim():null,
           capScope: cap?cap.getAttribute("data-qm-runtime"):null };
};
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__savescope.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"],
                                   executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__savescope.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            # ═══ [A] 前置：本会话 = 会话模式运行 ═══
            print("\n===== [A] 前置：置为会话模式运行 =====")
            g = rd(GP)
            g["mode"] = "manual"
            g["wait_hint_sec"] = 180
            wr(GP, g)
            wr(SP, {"sessions": {CHAT: {
                "mode": "recommend",
                "__active_scope__": "session",
                "updated_at": 1,
                "__keyts__": {"mode": 1},
            }}, "updated_at": 1})
            e0 = eff()
            print("    后端:", json.dumps(e0, ensure_ascii=False))
            ck("[A1] 前置 has_session=true", e0["has_session"] is True, e0["has_session"])
            ck("[A2] 前置 mode=recommend（会话覆盖生效）",
               e0["mode"] == "recommend", e0["mode"])

            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2600)
            bd0 = pg.evaluate("window.__badge()")
            print("    胶囊:", json.dumps(bd0, ensure_ascii=False))
            ck("[A3] 胶囊显示「会话模式」", bd0["capText"] == "会话模式", bd0["capText"])

            # ═══ [B] 全局配置页：改等待提示阈值 → 保存 ═══
            print("\n===== [B] 全局配置页保存：不得改运行模式（核心）=====")
            print("    切页签:", pg.evaluate("window.__pickTab('全局配置')"))
            pg.wait_for_timeout(1500)
            print("    页签:", pg.evaluate("window.__activeTab()"))
            print("    底部说明:", pg.evaluate("window.__footTarget()"))
            r = pg.evaluate("window.__pickSelect('等待提示阈值','300 秒')")
            print("    改等待提示阈值:", r)
            pg.wait_for_timeout(600)
            print("    点保存:", pg.evaluate("window.__save()"))
            pg.wait_for_timeout(3200)

            bd1 = pg.evaluate("window.__badge()")
            e1 = eff()
            sess = rd(SP).get("sessions") or {}
            msg1 = pg.evaluate("window.__msg()") or ""
            tab1 = pg.evaluate("window.__activeTab()")
            print("    胶囊:", json.dumps(bd1, ensure_ascii=False))
            print("    后端:", json.dumps(e1, ensure_ascii=False))
            print("    标记:", (sess.get(CHAT) or {}).get("__active_scope__"))
            print("    提示:", msg1)
            print("    页签:", tab1)

            ck("[B1] 值真的落盘（wait_hint_sec=300）",
               int(rd(GP).get("wait_hint_sec") or 0) == 300,
               rd(GP).get("wait_hint_sec"))
            ck("[B2] 胶囊仍「会话模式」（核心：运行模式未被改）",
               bd1["capText"] == "会话模式", bd1["capText"])
            ck("[B3] 后端标记仍 session",
               (sess.get(CHAT) or {}).get("__active_scope__") == "session",
               (sess.get(CHAT) or {}).get("__active_scope__"))
            ck("[B4] has_session 仍 true", e1["has_session"] is True,
               e1["has_session"])
            ck("[B5] 页签未被跳走（仍在全局配置）",
               tab1 == ["全局配置"], tab1)
            ck("[B6a] 提示如实说「运行模式未变」", "运行模式未变" in msg1, msg1)
            ck("[B6b] 提示不谎报「已切换到默认模式」",
               "已切换到默认模式" not in msg1, msg1)
            ck("[B7] 底部说明含「不改运行模式」",
               "不改运行模式" in (pg.evaluate("window.__footTarget()") or ""),
               pg.evaluate("window.__footTarget()"))

            # ═══ [C] 提示词页：保存不得改运行模式 ═══
            print("\n===== [C] 提示词页保存：不得改运行模式 =====")
            print("    切页签:", pg.evaluate("window.__pickTab('提示词')"))
            pg.wait_for_timeout(1500)
            print("    页签:", pg.evaluate("window.__activeTab()"))
            print("    底部说明:", pg.evaluate("window.__footTarget()"))
            print("    点保存:", pg.evaluate("window.__save()"))
            pg.wait_for_timeout(3000)

            bd2 = pg.evaluate("window.__badge()")
            e2 = eff()
            sess2 = rd(SP).get("sessions") or {}
            msg2 = pg.evaluate("window.__msg()") or ""
            print("    胶囊:", json.dumps(bd2, ensure_ascii=False))
            print("    标记:", (sess2.get(CHAT) or {}).get("__active_scope__"))
            print("    提示:", msg2)
            ck("[C1] 胶囊仍「会话模式」", bd2["capText"] == "会话模式", bd2["capText"])
            ck("[C2] 后端标记仍 session",
               (sess2.get(CHAT) or {}).get("__active_scope__") == "session",
               (sess2.get(CHAT) or {}).get("__active_scope__"))
            ck("[C3] 提示说「运行模式未变」", "运行模式未变" in msg2, msg2)

            # ═══ [D] 反向：模式页仍会切换（q1=仍然切换）═══
            print("\n===== [D] 反向证明：默认模式页保存仍切换 =====")
            print("    切页签:", pg.evaluate("window.__pickTab('默认模式')"))
            pg.wait_for_timeout(1500)
            print("    点保存（无改动）:", pg.evaluate("window.__save()"))
            pg.wait_for_timeout(3200)
            bd3 = pg.evaluate("window.__badge()")
            sess3 = rd(SP).get("sessions") or {}
            msg3 = pg.evaluate("window.__msg()") or ""
            print("    胶囊:", json.dumps(bd3, ensure_ascii=False))
            print("    标记:", (sess3.get(CHAT) or {}).get("__active_scope__"))
            print("    提示:", msg3)
            ck("[D1] 胶囊变「默认模式」（q1：仍然切换）",
               bd3["capText"] == "默认模式", bd3["capText"])
            ck("[D2] 后端标记=default",
               (sess3.get(CHAT) or {}).get("__active_scope__") == "default",
               (sess3.get(CHAT) or {}).get("__active_scope__"))
            ck("[D3] 提示说「已切换到默认模式」",
               "已切换到默认模式" in msg3, msg3)

            # ═══ [E] 会话模式页保存 → 切回会话模式 ═══
            print("\n===== [E] 会话模式页保存 → 切回会话模式 =====")
            print("    切页签:", pg.evaluate("window.__pickTab('会话模式')"))
            pg.wait_for_timeout(1500)
            print("    点保存:", pg.evaluate("window.__save()"))
            pg.wait_for_timeout(3200)
            bd4 = pg.evaluate("window.__badge()")
            sess4 = rd(SP).get("sessions") or {}
            msg4 = pg.evaluate("window.__msg()") or ""
            print("    胶囊:", json.dumps(bd4, ensure_ascii=False))
            print("    标记:", (sess4.get(CHAT) or {}).get("__active_scope__"))
            print("    提示:", msg4)
            ck("[E1] 胶囊回「会话模式」", bd4["capText"] == "会话模式", bd4["capText"])
            ck("[E2] 后端标记=session",
               (sess4.get(CHAT) or {}).get("__active_scope__") == "session",
               (sess4.get(CHAT) or {}).get("__active_scope__"))

            ck("[F] 无页面错误", not errs, errs[:3])
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
        print("\n已恢复状态文件")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
