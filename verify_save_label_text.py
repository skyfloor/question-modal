# -*- coding: utf-8 -*-
"""验证保存目标说明文案修复（2026-11-13 用户裁定）。

用户原话：「会话模式中，保存到会话模式（覆盖全局默认，仅本会话），这个提示有歧义，需修改」

原文案的两处歧义：
  ① 「覆盖全局默认」容易被读成"把全局默认值改掉了"，而实际全局一点没动
  ② D1 之后会话层只覆盖**用户改过的那几项**，其余仍跟随全局，
     说"覆盖全局默认"与事实不符

默认模式那句同理：D1 后全局值只对**没有会话覆盖**的会话生效。

断言：
  [L1] 会话页：目标说明 = 「保存到本会话（只覆盖你改过的项，不改全局）」
  [L2] 会话页：不再出现「覆盖全局默认」
  [L3] 会话页：说明里明确"不改全局"
  [L4] 默认页：目标说明 = 「保存为全局默认（对未设会话的会话生效）」
  [L5] 默认页：不再出现「对所有会话生效」（D1 后不准确）
  [L6] 保存成功后提示与会话页目标说明同口径
  [L7] 默认页保存后提示明确"原会话设置仍保留，切回可恢复"
  [L8] 全产物不含旧歧义文案
"""
import json
import os
import sys
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
window.__target=()=>{
  const el=root().querySelector(".qm-set-scopetarget");
  return el?(el.textContent||"").trim():null;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "ok"; };
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__label.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        # ═══ [L8] 产物不含旧歧义文案 ═══
        print("\n===== [L8] 产物检查 =====")
        dist = open(PLUG + "/dist/index.js", encoding="utf-8", errors="ignore").read()
        ck("[L8a] 不含「覆盖全局默认」", "覆盖全局默认" not in dist,
           dist.count("覆盖全局默认"))
        ck("[L8b] 不含「对所有会话生效」", "对所有会话生效" not in dist,
           dist.count("对所有会话生效"))

        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__label.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            # ═══ [L4][L5] 默认模式页（初始无覆盖 → 落在默认页）═══
            print("\n===== [L4][L5] 默认模式页的目标说明 =====")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2600)
            t_def = pg.evaluate("window.__target()")
            print("    目标说明:", t_def)
            ck("[L4] 默认页 = 保存为全局默认（对未设会话的会话生效）",
               t_def == "保存为全局默认（对未设会话的会话生效）", t_def)
            ck("[L5] 默认页不含「对所有会话生效」",
               "对所有会话生效" not in (t_def or ""), t_def)

            # ═══ [L7] 默认页保存后的提示 ═══
            print("\n===== [L7] 默认页保存后提示 =====")
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(3000)
            msg_def = pg.evaluate("window.__msg()")
            print("    提示:", msg_def)
            ck("[L7a] 提示说明原会话设置仍保留",
               "仍保留" in (msg_def or "") or "可恢复" in (msg_def or ""), msg_def)
            ck("[L7b] 提示不含「对所有会话生效」",
               "对所有会话生效" not in (msg_def or ""), msg_def)

            # ═══ [L1][L2][L3] 会话模式页 ═══
            print("\n===== [L1][L2][L3] 会话模式页的目标说明 =====")
            pg.evaluate("window.__pickTab('会话模式')")
            pg.wait_for_timeout(1200)
            t_sess = pg.evaluate("window.__target()")
            print("    目标说明:", t_sess)
            ck("[L1] 会话页 = 保存到本会话（只覆盖你改过的项，不改全局）",
               t_sess == "保存到本会话（只覆盖你改过的项，不改全局）", t_sess)
            ck("[L2] 会话页不含「覆盖全局默认」",
               "覆盖全局默认" not in (t_sess or ""), t_sess)
            ck("[L3] 会话页明确「不改全局」", "不改全局" in (t_sess or ""), t_sess)

            # ═══ [L6] 会话页保存后提示同口径 ═══
            print("\n===== [L6] 会话页保存后提示 =====")
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(3000)
            msg_sess = pg.evaluate("window.__msg()")
            print("    提示:", msg_sess)
            ck("[L6a] 提示开头为「已保存到本会话」",
               "已保存到本会话" in (msg_sess or ""), msg_sess)
            ck("[L6b] 提示说明全局未被修改",
               "全局默认未被修改" in (msg_sess or "") or "不改全局" in (msg_sess or ""),
               msg_sess)
            ck("[L6c] 提示说明未改动的项仍跟随全局",
               "仍跟随全局" in (msg_sess or ""), msg_sess)

            ck("[L0] 无页面错误", not errs, errs[:2])
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
