# -*- coding: utf-8 -*-
"""复现并验证用户 2026-11-13 报告（真 Chromium + 真后端）。

用户原话：
  「我点击会话模式并保存，右上角的并没有切换到会话模式，还是上次的默认模式，
    且我在关闭 ui 后再次激活 ui 时，自动切换到默认模式」

根因：在「会话模式」页**不改任何设置**直接点保存 → patch = {}
  → POST /session-prefs 的空 settings 语义是「清空整条覆盖」
  → has_session 变 false → 胶囊显示默认模式 → 重开仍是默认模式
  → 用户的操作意图（"我现在要按会话模式运行"）与结果完全相反

修法：会话页无改动保存时，用当前生效值填充 patch，真正写出覆盖。

断言（关键：全程**不做任何设置改动**，只切页签 + 点保存）：
  [Q1] 会话模式页，零改动点保存 → session_prefs 里出现本会话覆盖
  [Q2] 胶囊立即变「会话模式」
  [Q3] 关闭再重开面板 → 仍在「会话模式」页、胶囊仍是会话模式（用户第 2 个症状）
  [Q4] 后端 has_session=true
  [Q5] 默认模式页零改动保存 → 覆盖被清空、胶囊变默认模式（反向仍成立）
  [Q6] 再重开 → 停在默认模式
  [Q7] 反复切换多次都稳定（不回弹）
  [Q8] 无页面错误
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


def eff():
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(CHAT) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    return {"mode": (d.get("config") or {}).get("mode"),
            "has_session": d.get("has_session")}


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
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__open=()=>{
  const old=document.getElementById("root"); if(old) old.remove();
  const h=document.createElement("div"); h.id="root"; document.body.appendChild(h);
  if(RD.createRoot){ RD.createRoot(h).render(window.__btnNode); }
  else { RD.render(window.__btnNode, h); }
  setTimeout(()=>{ const b=h.querySelector("button"); if(b)b.click(); }, 60);
  return "scheduled";
};
window.__close=()=>{ if(typeof window.__modalCancel==="function"){try{window.__modalCancel()}catch(e){}} return "closed"; };
window.__pickTab=(label)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label; t.click(); return "ok";
};
window.__activeTab=()=>[...root().querySelectorAll(".qm-set-tab")]
  .filter(x=>/qm-set-tabon/.test(x.className)).map(x=>(x.textContent||"").trim());
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "ok"; };
window.__badge=()=>{
  const cap=root().querySelector("[data-qm-runtime]");
  return cap?(cap.textContent||"").trim():null;
};
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__emptysave.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__emptysave.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})

            # ═══ 起点：无覆盖 = 默认模式 ═══
            print("\n===== 起点：无覆盖 =====")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            print("    页签:", pg.evaluate("window.__activeTab()"),
                  " 胶囊:", pg.evaluate("window.__badge()"))
            ck("[Q0] 起点胶囊=默认模式", pg.evaluate("window.__badge()") == "默认模式",
               pg.evaluate("window.__badge()"))

            # ═══ [Q1][Q2][Q4] 会话页：零改动直接保存（用户的操作）═══
            print("\n===== [Q1] 会话模式页 · 不做任何改动 · 直接点保存 =====")
            pg.evaluate("window.__pickTab('会话模式')")
            pg.wait_for_timeout(1000)
            print("    切到会话页后胶囊:", pg.evaluate("window.__badge()"))
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(3000)

            bd = pg.evaluate("window.__badge()")
            e = eff()
            sess = rd(SP).get("sessions") or {}
            print("    胶囊:", bd, " 后端:", e, " 覆盖:", list(sess.keys()))
            print("    覆盖内容:", json.dumps(
                {k: v for k, v in (sess.get(CHAT) or {}).items()
                 if k not in ("updated_at", "__keyts__")}, ensure_ascii=False))
            print("    提示:", pg.evaluate("window.__msg()"))

            ck("[Q1a] 本会话覆盖已建立（零改动保存也写覆盖）", CHAT in sess, list(sess.keys()))
            # 方案 D1：零改动保存**只打标记、不写入任何值项**，
            # 未设置的键继续跟随全局（避免把全局值钉死在这个会话上）。
            _vals = {k: v for k, v in (sess.get(CHAT) or {}).items()
                     if k not in ("updated_at", "__keyts__", "__active_scope__")}
            ck("[Q1b] 零改动保存未写入任何值项（只打标记）", _vals == {}, _vals)
            ck("[Q1c] 标记为 session",
               (sess.get(CHAT) or {}).get("__active_scope__") == "session",
               (sess.get(CHAT) or {}).get("__active_scope__"))
            ck("[Q2] 胶囊立即变「会话模式」", bd == "会话模式", bd)
            ck("[Q4] 后端 has_session=true", e["has_session"] is True, e["has_session"])

            # ═══ [Q3] 关闭再重开（用户第 2 个症状）═══
            print("\n===== [Q3] 关闭 UI 后再次激活 =====")
            pg.evaluate("window.__close()")
            pg.wait_for_timeout(600)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2800)
            tab3 = pg.evaluate("window.__activeTab()")
            bd3 = pg.evaluate("window.__badge()")
            print("    重开后 页签:", tab3, " 胶囊:", bd3)
            ck("[Q3a] 重开后仍在「会话模式」页签", tab3 == ["会话模式"], tab3)
            ck("[Q3b] 重开后胶囊仍是「会话模式」", bd3 == "会话模式", bd3)

            # ═══ [Q7] 反复开关 3 次都稳定 ═══
            print("\n===== [Q7] 反复开关 3 次 ═══")
            stable = True
            for i in range(3):
                pg.evaluate("window.__close()")
                pg.wait_for_timeout(400)
                pg.evaluate("window.__open()")
                pg.wait_for_timeout(2400)
                _t = pg.evaluate("window.__activeTab()")
                _b = pg.evaluate("window.__badge()")
                print("    第%d次: 页签=%s 胶囊=%s" % (i + 1, _t, _b))
                if _t != ["会话模式"] or _b != "会话模式":
                    stable = False
            ck("[Q7] 3 次开关后仍稳定为会话模式", stable, "")

            # ═══ [Q5][Q6] 反向：默认页零改动保存 ═══
            print("\n===== [Q5] 默认模式页 · 零改动保存（反向）=====")
            pg.evaluate("window.__pickTab('默认模式')")
            pg.wait_for_timeout(1200)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(3000)
            bd5 = pg.evaluate("window.__badge()")
            e5 = eff()
            sess5 = rd(SP).get("sessions") or {}
            print("    胶囊:", bd5, " 后端:", e5, " 覆盖:", list(sess5.keys()))
            # 方案 D1：切默认模式**保留**会话数据，只改标记（切回即恢复）。
            _m5 = (sess5.get(CHAT) or {}).get("__active_scope__")
            ck("[Q5a] 标记切为 default（数据保留，非删除）", _m5 == "default",
               (_m5, list(sess5.keys())))
            ck("[Q5b] 胶囊变「默认模式」", bd5 == "默认模式", bd5)
            ck("[Q5c] 后端 has_session=false", e5["has_session"] is False, e5["has_session"])

            print("\n===== [Q6] 重开仍是默认模式 =====")
            pg.evaluate("window.__close()")
            pg.wait_for_timeout(500)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2600)
            ck("[Q6a] 重开后页签=默认模式",
               pg.evaluate("window.__activeTab()") == ["默认模式"],
               pg.evaluate("window.__activeTab()"))
            ck("[Q6b] 重开后胶囊=默认模式",
               pg.evaluate("window.__badge()") == "默认模式",
               pg.evaluate("window.__badge()"))

            ck("[Q8] 无页面错误", not errs, errs[:2])
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
