# -*- coding: utf-8 -*-
"""复现用户 2026-11-13 报告：「我选择了会话模式，点击保存，其他会话全部变成了
会话模式，我点击默认模式保存也是一样全部变成了默认模式」。

断言的核心是**写入目标**，不是 UI 显示：
  [P1] 在「会话模式」页签保存 → 只写 session_prefs（本 chat 一条覆盖），
       全局 analysis_prefs 必须**逐键不变**
  [P2] 在「默认模式」页签保存 → 只写 analysis_prefs，session_prefs 必须不变
  [P3] 会话覆盖存在时，另一个 chat 的生效值必须**不受影响**（=不变成会话模式的值）

安全：全程备份两个状态文件，结束时原样恢复。
"""
import hashlib
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"

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
window.__modalCancel=null;
function FakeModal(p){ window.__modalCancel=p&&p.onCancel?p.onCancel:null; return (p&&p.children)||null; }
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
  if(!t) return "no-tab:"+label;
  t.click(); return "tab:"+label;
};
window.__activeTab=()=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].filter(x=>/qm-set-tabon/.test(x.className));
  return t.map(x=>(x.textContent||"").trim());
};
/* 改「默认答题模式」那一行：点某个模式按钮 */
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label;
  btn.click(); return "clicked:"+label;
};
window.__modeOn=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return null;
  return [...row.querySelectorAll(".qm-set-segbtn")]
    .filter(b=>/qm-set-segon/.test(b.className))
    .map(b=>(b.textContent||"").trim());
};
window.__dirty=()=>{
  const t=root().innerText||"";
  const m=t.match(/有 (\d+) 项未保存/);
  return m?parseInt(m[1],10):0;
};
window.__save=()=>{
  const b=root().querySelector("[data-qm-save]");
  if(!b) return "no-save";
  b.click(); return "clicked";
};
window.__msg=()=>{
  const t=root().innerText||"";
  const m=t.match(/已保存[^\n]*|保存失败[^\n]*|无法[^\n]*/);
  return m?m[0]:"";
};
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None

    hp = "/app/working/plugins/question-modal/dist/__prefscope.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))

    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__prefscope.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            # 干净起点：无会话覆盖，全局 mode=manual
            g0 = rd(GP)
            g0["mode"] = "manual"
            wr(GP, g0)
            wr(SP, {"sessions": {}, "updated_at": 1})
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")

            # ══════ 场景 A：在「会话模式」页签改 mode 并保存 ══════
            print("\n===== 场景 A：会话模式页签保存 =====")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            print("  打开后页签:", pg.evaluate("window.__activeTab()"))

            r = pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(900)
            print("  点会话模式页签:", r, "->", pg.evaluate("window.__activeTab()"))
            print("  mode 当前高亮:", pg.evaluate("window.__modeOn()"))

            r2 = pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(500)
            print("  点「自动分析」:", r2, " 高亮:", pg.evaluate("window.__modeOn()"),
                  " 未保存项:", pg.evaluate("window.__dirty()"))

            g_before = strip_ts(rd(GP))
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2200)
            g_after = strip_ts(rd(GP))
            sp_after = rd(SP)

            print("  保存提示:", pg.evaluate("window.__msg()"))
            print("  全局 mode: ", g_before.get("mode"), "->", g_after.get("mode"))
            print("  session 覆盖:", json.dumps(strip_ts(sp_after.get("sessions") or {}),
                                              ensure_ascii=False)[:200])

            ck("[P1a] 会话模式保存后全局 analysis_prefs 逐键不变",
               g_before == g_after,
               {k: (g_before.get(k), g_after.get(k)) for k in set(g_before) | set(g_after)
                if g_before.get(k) != g_after.get(k)})
            ck("[P1b] 会话模式保存写入了本 chat 的覆盖",
               bool((sp_after.get("sessions") or {}).get(CHAT)),
               sp_after.get("sessions"))

            # ══════ 场景 B：另一 chat 的生效值不受影响 ══════
            print("\n===== 场景 B：其它会话是否被连带 ══════")
            import urllib.request

            def eff(session_id, agent_id="wb74Jn"):
                u = (BASE + "/api/question-modal/effective-config?chat_id=&session_id="
                     + urllib.parse.quote(session_id) + "&agent_id=" + agent_id)
                req = urllib.request.Request(u, headers={"X-Agent-Id": agent_id})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return json.loads(resp.read().decode("utf-8"))

            import urllib.parse
            e_other = eff("1794410957635-v0mrkpr")      # 另一个真实会话
            print("  其它会话 chat_id:", e_other.get("chat_id"),
                  " has_session:", e_other.get("has_session"),
                  " mode:", e_other.get("config", {}).get("mode"))
            ck("[P3a] 其它会话 has_session=false（未被连带成会话模式）",
               e_other.get("has_session") is False, e_other.get("has_session"))
            ck("[P3b] 其它会话 mode 不受本会话覆盖影响",
               e_other.get("config", {}).get("mode") == g_after.get("mode"),
               (e_other.get("config", {}).get("mode"), g_after.get("mode")))

            # ══════ 场景 C：在「默认模式」页签保存 ══════
            print("\n===== 场景 C：默认模式页签保存 =====")
            sp_before_c = strip_ts(rd(SP).get("sessions") or {})
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            print("  重开页签:", pg.evaluate("window.__activeTab()"))
            pg.evaluate("window.__tab('默认模式')")
            pg.wait_for_timeout(900)
            print("  点默认模式页签 ->", pg.evaluate("window.__activeTab()"),
                  " mode 高亮:", pg.evaluate("window.__modeOn()"))
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(500)
            print("  点「自动分析」后高亮:", pg.evaluate("window.__modeOn()"),
                  " 未保存项:", pg.evaluate("window.__dirty()"))
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2200)
            sp_after_c = strip_ts(rd(SP).get("sessions") or {})
            g_after_c = strip_ts(rd(GP))
            print("  保存提示:", pg.evaluate("window.__msg()"))
            print("  全局 mode ->", g_after_c.get("mode"))

            # 2026-11-13：断言本意是「会话层的**配置值**不被默认模式保存连带改写」。
            # 但 D1 机制刻意会在默认模式保存时把 __active_scope__ 置为 default
            # （让会话层暂不生效、切回会话模式可恢复），这是设计行为不是污染。
            # 原断言整条记录逐字比对，把这一处设计变更当成了失败 → 过期断言。
            # 现只比对「值」，作用域标记单独校验。
            def _vals(d):
                out = {}
                for cid, rec in (d or {}).items():
                    if not isinstance(rec, dict):
                        out[cid] = rec
                        continue
                    out[cid] = {k: v for k, v in rec.items()
                                if not k.startswith("__")}
                return out
            _bv, _av = _vals(sp_before_c), _vals(sp_after_c)
            ck("[P2a] 默认模式保存后 session 配置值不变（未被连带写）",
               _bv == _av,
               {k: (_bv.get(k), _av.get(k)) for k in set(_bv) | set(_av)
                if _bv.get(k) != _av.get(k)})
            _sc = {cid: rec.get("__active_scope__") for cid, rec in
                   (sp_after_c or {}).items() if isinstance(rec, dict)}
            ck("[P2a2] 默认模式保存后会话层被暂停（__active_scope__=default）",
               all(v == "default" for v in _sc.values()) if _sc else False, _sc)
            ck("[P2b] 默认模式保存确实写进全局",
               g_after_c.get("mode") == "ai", g_after_c.get("mode"))

            # 兜底：其它会话仍未被污染
            e_other2 = eff("1794410957635-v0mrkpr")
            ck("[P3c] 默认模式保存后其它会话仍 has_session=false",
               e_other2.get("has_session") is False, e_other2.get("has_session"))

            print("\n  pageerror:", errs[:3])
            ck("[P0] 无页面错误", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(hp)
        except OSError:
            pass
        # 原样恢复两个状态文件
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)
        print("\n已恢复 session_prefs.json / analysis_prefs.json")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
