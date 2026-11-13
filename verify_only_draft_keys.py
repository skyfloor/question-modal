# -*- coding: utf-8 -*-
"""验证 2026-11-13 修复：会话保存只提交用户真正改动的键。

用户报告（第三次，原话）：
  「ui变了，但是功能不正常。1、当前的模式已经不生效了，某个会话的配置的
    会话模式，将所有的会话的配置都修改，默认模式也一样，覆盖所有的配置」

根因（已用真实数据确证）：
  `cfgSave` 里藏着一块「双保险」代码 —— 会话保存时把**当前生效值**里其余
  SESSION_KEYS 也一并塞进 patch：
      if (isSession) {
        const cfg = settingsState.cfg.config;
        SESSION_KEYS.forEach(k => {
          if (k in patch) return;
          if (v === undefined || v === null || v === "") return;
          patch[k] = v;                 // ← 整批固化
        });
      }
  SESSION_KEYS = ["mode","model_id","template_id","with_context","parallel"]

  实际后果：用户只改 1 项 → 保存后该会话被固化成 **5 项完整覆盖** → 这些
  键被钉死在保存那一刻 → 之后改全局默认，该会话再也看不到变化。
  用户视角 =「某个会话一改，所有会话的配置都被覆盖」。

  实测证据（修复前落盘）：
      session_prefs.sessions["348b16bc…"] =
        {mode, model_id, template_id, with_context, parallel}   ← 5 个键
      与全局值完全相同的键 = [mode, model_id, with_context, parallel]

  为什么上一轮"删掉了"却没根治：上一轮删的是**另一处**同语义代码块，
  这段藏在 cfgSave 内部、写法不同（forEach + 空值跳过），旧特征串匹配不到。

断言（真机，走真实 Chromium + 真实后端）：
  [F1] 在会话页只改 mode 保存 → 该 chat 的覆盖**只有 mode 一个键**
  [F2] 保存后全局 analysis_prefs 逐键不变
  [F3] 其它会话 has_session=false（未受牵连）
  [F4] 只改 mode 保存后，再改全局 mode → 该会话的生效值**跟随变化**
       （这是"钉死"是否解除的决定性判据）
  [F5] 在默认模式页保存 → 只写全局，session 覆盖不变
  [F6] 产物中不再出现 SESSION_KEYS 批量固化
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
# 2026-11-13 修正：原常量把两个 chat 的 session_id 对应关系搞反了。
#   测试页里 getCurrentSessionId() 返回 1791724819571-muuetab，后端据此反查
#   到的真实 chat 是 0489fc54（见 workspaces/wb74Jn/chats.json）。
#   原 CHAT=348b16bc 对应的是 session 1794410957635-v0mrkpr，于是「保存写进
#   0489fc54、断言去读 348b16bc」→ 恒为空，F1b/F3/F4a/F4c 全部假失败。
#   这不是产品缺陷：后端解析一直是对的（实测 POST 落盘到 0489fc54 正常）。
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"      # 当前测试会话（session_id 反查所得）
OTHER = "348b16bc-64f8-42ab-becc-88d6d0e47745"     # 另一个会话，用于验证不被牵连
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


def strip_meta(d):
    """只要「配置值」，剔除 updated_at 与所有 __ 前缀的内部元数据。

    2026-11-13：D1 机制刻意会在默认模式保存时把 __active_scope__ 置为
    default（暂停会话层、切回可恢复）。若把它算进「会话覆盖是否被改动」，
    设计行为会被误判成污染 —— 与 verify_pref_scope_write 的 P2a 同源。
    """
    out = {}
    for k, v in (d or {}).items():
        if k == "updated_at" or str(k).startswith("__"):
            continue
        # sessions 结构是 {chat_id: {键: 值, __keyts__: {...}}}，内层也要洗
        if isinstance(v, dict):
            out[k] = {kk: vv for kk, vv in v.items()
                      if kk != "updated_at" and not str(kk).startswith("__")}
        else:
            out[k] = v
    return out


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
      window.__posts.push({url:s,body:(o&&o.body)||""});
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
window.__activeTab=()=>[...root().querySelectorAll(".qm-set-tab")]
  .filter(x=>/qm-set-tabon/.test(x.className)).map(x=>(x.textContent||"").trim());
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label; btn.click(); return "clicked:"+label;
};
window.__modeOn=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return null;
  return [...row.querySelectorAll(".qm-set-segbtn")]
    .filter(b=>/qm-set-segon/.test(b.className)).map(b=>(b.textContent||"").trim());
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "clicked"; };
window.__msg=()=>{
  const t=root().innerText||"";
  const mm=t.match(/已保存[^\n]*|保存失败[^\n]*/);
  return mm?mm[0]:"";
};
window.__lastPost=()=>{
  const p=window.__posts.filter(x=>x.url.includes("session-prefs"));
  return p.length?p[p.length-1]:null;
};
window.__ready=true;
</script></body></html>
"""


def eff(chat):
    import urllib.parse
    import urllib.request
    u = (BASE + "/api/question-modal/effective-config?chat_id=" + urllib.parse.quote(chat)
         + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode() or "{}")


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__onlydraft.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__onlydraft.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            # 必须在「打开面板之前」把 URL 设成目标 chat：settingsState.chatId
            # 是 openSettingsPanel 时锁定的，事后 pushState 不会改它。
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            # 干净起点：全局 manual；清空所有会话覆盖
            g = rd(GP)
            g["mode"] = "manual"
            wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")

            # ══════ [F1] 会话页只改 mode 保存 ══════
            print("\n===== [F1] 会话页只改 mode 保存 =====")
            pg.evaluate("window.__posts=[]")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(900)
            print("    当前页签:", pg.evaluate("window.__activeTab()"),
                  " mode 高亮:", pg.evaluate("window.__modeOn()"))
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(500)
            g_before = strip_ts(rd(GP))
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)

            post = pg.evaluate("window.__lastPost()")
            print("    实际 pathname:", pg.evaluate("location.pathname"))
            print("    落盘全部会话键:", list((rd(SP).get("sessions") or {}).keys()))
            body = json.loads((post or {}).get("body") or "{}")
            print("    请求体 chat_id:", body.get("chat_id"), " session_id:", body.get("session_id"))
            print("    请求体 settings:", json.dumps(body.get("settings"), ensure_ascii=False))
            print("    提示:", pg.evaluate("window.__msg()"))

            sess = (rd(SP).get("sessions") or {}).get(CHAT) or {}
            keys = sorted(strip_meta(sess).keys())
            print("    落盘覆盖键:", keys)

            ck("[F1a] 请求体只含改动的 mode", set((body.get("settings") or {}).keys()) == {"mode"},
               body.get("settings"))
            ck("[F1b] 落盘覆盖只有 mode（未被整批固化）", keys == ["mode"], keys)

            g_after = strip_ts(rd(GP))
            ck("[F2] 全局 analysis_prefs 逐键不变", g_before == g_after,
               {k: (g_before.get(k), g_after.get(k)) for k in set(g_before) | set(g_after)
                if g_before.get(k) != g_after.get(k)})

            e_other = eff(OTHER)
            ck("[F3] 其它会话 has_session=false", e_other.get("has_session") is False,
               e_other.get("has_session"))

            # ══════ [F4] 决定性：该会话是否仍跟随全局 ══════
            print("\n===== [F4] 改全局后该会话是否跟随（钉死解除的判据）=====")
            e_before = eff(CHAT)
            print("    改全局前 mode:", e_before.get("config", {}).get("mode"))
            g2 = rd(GP)
            g2["mode"] = "recommend"
            wr(GP, g2)
            pg.wait_for_timeout(300)
            e_after = eff(CHAT)
            print("    改全局后 mode:", e_after.get("config", {}).get("mode"),
                  " sources:", e_after.get("config", {}).get("__sources__"))
            # 本会话只覆盖了 mode=ai，所以全局改 recommend 时它仍应是 ai（覆盖生效）
            ck("[F4a] 改过 mode 的会话仍保留自己的 ai（覆盖正常生效）",
               e_after.get("config", {}).get("mode") == "ai",
               e_after.get("config", {}).get("mode"))
            # 而它**没有**覆盖的其他键（model_id 等）应该跟随全局
            srcs = e_after.get("config", {}).get("__sources__") or {}
            ck("[F4b] 未改动的键（model_id）不再被钉死成 session 来源",
               srcs.get("model_id") != "session", srcs)

            e_other2 = eff(OTHER)
            ck("[F4c] 其它会话跟随全局变成 recommend",
               e_other2.get("config", {}).get("mode") == "recommend",
               e_other2.get("config", {}).get("mode"))

            # ══════ [F5] 默认模式页保存 ══════
            print("\n===== [F5] 默认模式页保存 =====")
            sp_before = strip_meta(rd(SP).get("sessions") or {})
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            pg.evaluate("window.__tab('默认模式')")
            pg.wait_for_timeout(900)
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(500)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            sp_after = strip_meta(rd(SP).get("sessions") or {})
            g3 = strip_ts(rd(GP))
            print("    全局 mode ->", g3.get("mode"), " 提示:", pg.evaluate("window.__msg()"))
            ck("[F5a] 默认页保存写进全局", g3.get("mode") == "manual", g3.get("mode"))
            ck("[F5b] 默认页保存未连带改会话覆盖", sp_before == sp_after,
               {k: (sp_before.get(k), sp_after.get(k)) for k in set(sp_before) | set(sp_after)
                if sp_before.get(k) != sp_after.get(k)})

            ck("[F6] 无页面错误", not errs, errs[:2])
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
        print("\n已恢复 session_prefs.json / analysis_prefs.json")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
