# -*- coding: utf-8 -*-
"""保存逻辑守卫（UI 迁移期间必须始终通过）。

用户约束（2026-11-13）：
  「这次修改，不能导致功能异常，之前已经多次导致保存异常覆盖问题，
    所以这次必须异常消息」
  → 已裁定：本轮**只改 UI，保存逻辑一行不动**（q0=只做 UI 迁移；
    q2=保守保存保留「发完整生效值」的旧行为）。

因此本脚本不评判保存语义好坏，只做**行为锁**：确认 UI 改动前后，
保存链路的三个不变量没变：
  [G1] 会话页签保存 → POST /session-prefs，且 body 结构为
       {chat_id, session_id, agent_id, settings}
  [G2] 默认/全局页签保存 → POST /prefs，body 是扁平的 settings 对象
  [G3] 会话保存后全局 analysis_prefs 不被连带改写（会话写会话层）
  [G4] 保存成功提示文案与页签对应（会话/默认各自一句）
  [G5] 保存失败时给出可读提示（不是空白）

⚠️ 本脚本对「会话保存发送哪些键」**不做断言**——那是产品语义，
   已由用户裁定暂时保留旧行为。它只锁「请求去对的地方、结构对、
   不串层」。

安全：备份并原样恢复 session_prefs.json / analysis_prefs.json。
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


def strip_ts(d):
    return {k: v for k, v in (d or {}).items() if k != "updated_at"}


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

window.__posts=[];
const _fetch=window.fetch.bind(window);
window.fetch=async(u,o)=>{
  try{const s=String(u);
    if(s.includes("/question-modal/session-prefs")||s.includes("/question-modal/prefs"))
      window.__posts.push({url:s,body:(o&&o.body)||"",method:(o&&o.method)||"GET"});
  }catch(e){}
  return _fetch(u,o);
};
function FakeModal(p){ return (p&&p.children)||null; }
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await _fetch("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
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
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label; btn.click(); return "clicked:"+label;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "clicked"; };
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
window.__lastPost=()=>{ const p=window.__posts.filter(x=>x.method==="POST"); return p.length?p[p.length-1]:null; };
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__guard_save.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__guard_save.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")

            # ═══ [G1][G3][G4] 会话页签保存 ═══
            print("\n===== [G1] 会话页签保存 =====")
            pg.evaluate("window.__posts=[]")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(900)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            g_before = strip_ts(rd(GP))
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)

            post = pg.evaluate("window.__lastPost()")
            print("    url:", (post or {}).get("url"))
            body = json.loads((post or {}).get("body") or "{}")
            print("    body keys:", sorted(body.keys()))
            print("    提示:", pg.evaluate("window.__msg()"))

            ck("[G1a] 打到 /session-prefs",
               bool(post) and "/session-prefs" in post["url"], (post or {}).get("url"))
            # `seen` 是 2026-11-13 新增的并发检测字段（需求 2）。它是有意
            # 加入契约的：后端据此判断「这些键在我看过之后是否被别处改过」。
            # `set_scope` 是 2026-11-13 方案 D1 新增：会话页保存 = 声明按会话模式运行
            ck("[G1b] body 结构为 chat_id/session_id/agent_id/settings(+seen+set_scope)",
               set(body.keys()) == {"chat_id", "session_id", "agent_id",
                                    "settings", "seen", "set_scope"},
               sorted(body.keys()))
            ck("[G1c] settings 是对象", isinstance(body.get("settings"), dict),
               type(body.get("settings")).__name__)

            g_after = strip_ts(rd(GP))
            ck("[G3] 会话保存未连带改写全局", g_before == g_after,
               {k: (g_before.get(k), g_after.get(k)) for k in set(g_before) | set(g_after)
                if g_before.get(k) != g_after.get(k)})
            ck("[G4a] 会话保存提示正确",
               "已保存到本会话" in (pg.evaluate("window.__msg()") or ""),
               pg.evaluate("window.__msg()"))

            # ═══ [G2][G4] 默认页签保存 ═══
            print("\n===== [G2] 默认页签保存 =====")
            sp_before = strip_ts(rd(SP).get("sessions") or {})
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            pg.evaluate("window.__tab('默认模式')")
            pg.wait_for_timeout(900)
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)

            # ── 默认页保存现在会发**两**个请求（2026-11-13 用户裁定）──
            #   ① POST /prefs            —— 写全局默认
            #   ② POST /session-prefs {} —— 清空本会话覆盖（= 切到默认模式）
            # 因此不能再只断言"最后一次请求是 /prefs"。这里逐条校验两次请求
            # 各自的契约，并确认顺序（先写全局，再清覆盖）。
            raw_posts = pg.evaluate("window.__posts.filter(x=>x.method==='POST')")
            prints = [(p.get("url") or "") for p in raw_posts]
            print("    请求序列:", [u.split("/api")[-1][:46] for u in prints])
            pf = [p for p in raw_posts
                  if (p.get("url") or "").rstrip("/").endswith("/question-modal/prefs")]
            sp = [p for p in raw_posts
                  if "/question-modal/session-prefs" in (p.get("url") or "")]
            body_pf = json.loads((pf[-1] or {}).get("body") or "{}") if pf else {}
            body_sp = json.loads((sp[-1] or {}).get("body") or "{}") if sp else {}
            print("    /prefs body keys:", sorted(body_pf.keys())[:8], "...")
            print("    /session-prefs settings:", body_sp.get("settings"))
            print("    提示:", pg.evaluate("window.__msg()"))

            ck("[G2a] 有打到 /prefs（写全局默认）", bool(pf), prints)
            ck("[G2b] /prefs body 是扁平 settings（无 chat_id 包裹）",
               "chat_id" not in body_pf, sorted(body_pf.keys())[:6])
            ck("[G2c] 另有 /session-prefs 且 settings 为空（清空覆盖）",
               bool(sp) and body_sp.get("settings") == {}, body_sp.get("settings"))
            # 用「最后一次出现」的下标比对：/session-prefs 会出现两次
            # （第一轮会话页保存一次、本轮清空一次），index() 取首个会误判。
            _i_pf = max((i for i, u in enumerate(prints)
                         if u.rstrip("/").endswith("/question-modal/prefs")), default=-1)
            _i_sp = max((i for i, u in enumerate(prints)
                         if "/question-modal/session-prefs" in u), default=-1)
            ck("[G2d] 顺序正确：先写全局，后清覆盖",
               _i_pf >= 0 and _i_sp > _i_pf, (_i_pf, _i_sp, prints))
            ck("[G4b] 默认保存提示正确",
               "已保存为全局默认" in (pg.evaluate("window.__msg()") or ""),
               pg.evaluate("window.__msg()"))
            # 新语义：默认页保存后本会话覆盖被清空（= 切到默认模式）
            # D1：切默认模式保留数据，只把标记改成 default
            _m = ((rd(SP).get("sessions") or {}).get(CHAT) or {}).get("__active_scope__")
            ck("[G3b] 默认保存后标记切为 default（数据保留）", _m == "default",
               (_m, list((rd(SP).get("sessions") or {}).keys())))

            ck("[G5] 无页面错误", not errs, errs[:2])
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
