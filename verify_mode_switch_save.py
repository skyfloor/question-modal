# -*- coding: utf-8 -*-
"""验证 2026-11-13 用户两项新要求（真 Chromium + 真后端）。

要求：
  1. 右上角胶囊外面增加文字「当前模式：」
  2. 切换到对应模式后点保存，应把当前会话切换到该模式，
     且右上角胶囊里展示的模式一并修改。

用户裁定：
  q0 = 删整条覆盖，并以当前默认模式的实际配置为准
  q1 = 保存后删覆盖 → 胶囊变默认模式、会话回到跟随全局
  q2 = 两个方向都做（默认页保存→默认模式；会话页保存→会话模式）

断言：
  [P1] 胶囊外有「当前模式：」文字，且它在胶囊**外部**（不是胶囊内文本）
  [P2] 胶囊内文本只有「会话模式」/「默认模式」
  [P3] 会话模式页保存 → 落覆盖，胶囊=会话模式
  [P4] 默认模式页保存 → 覆盖被删，胶囊=默认模式（关键：用户要的切换）
  [P5] 切到默认模式后，本会话生效值 = 全局值（真的回落了）
  [P6] 切到默认模式后，页签也停在默认模式（胶囊/页签/作用域同步）
  [P7] 反向：再在会话模式页保存 → 覆盖重建，胶囊回到会话模式
  [P8] 无页面错误
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


def api(path, body=None):
    url = BASE + "/api/question-modal" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if body is not None else "GET",
        headers={"Content-Type": "application/json", "X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or "{}")


def eff():
    import urllib.parse
    u = (BASE + "/api/question-modal/effective-config?chat_id="
         + urllib.parse.quote(CHAT) + "&session_id=&agent_id=" + AG)
    req = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read().decode() or "{}")
    c = d.get("config") or {}
    return {"mode": c.get("mode"), "has_session": d.get("has_session")}


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
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label; btn.click(); return "clicked:"+label;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "ok"; };
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
/* 胶囊结构与文字 */
window.__badge=()=>{
  const wrap=root().querySelector("[data-qm-runtime-wrap]");
  const cap=root().querySelector("[data-qm-runtime]");
  const label=root().querySelector(".qm-set-runtime-label");
  return {
    wrapText: wrap?(wrap.textContent||"").trim():null,
    capText: cap?(cap.textContent||"").trim():null,
    capScope: cap?cap.getAttribute("data-qm-runtime"):null,
    labelText: label?(label.textContent||"").trim():null,
    labelOutsideCap: !!(label && cap && !cap.contains(label)),
  };
};
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__modeswitch.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__modeswitch.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})

            # ═══ [P1][P2] 初始：无覆盖 → 默认模式 ═══
            print("\n===== [P1][P2] 胶囊结构（无覆盖）=====")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            bd = pg.evaluate("window.__badge()")
            print("    ", json.dumps(bd, ensure_ascii=False))
            ck("[P1a] 存在「当前模式：」文字", bd["labelText"] == "当前模式：", bd["labelText"])
            ck("[P1b] 前缀在胶囊**外部**（未被胶囊包住）", bd["labelOutsideCap"] is True, bd)
            ck("[P2a] 胶囊内文本只有「默认模式」", bd["capText"] == "默认模式", bd["capText"])
            ck("[P2b] 胶囊不含「当前模式：」字样",
               "当前模式" not in (bd["capText"] or ""), bd["capText"])
            ck("[P2c] wrap 文本 = 前缀+胶囊",
               bd["wrapText"] == "当前模式：默认模式", bd["wrapText"])

            # ═══ [P3] 会话模式页保存 → 转会话模式 ═══
            print("\n===== [P3] 会话模式页保存 → 转会话模式 =====")
            pg.evaluate("window.__pickTab('会话模式')")
            pg.wait_for_timeout(900)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(500)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2800)
            bd3 = pg.evaluate("window.__badge()")
            e3 = eff()
            print("    胶囊:", bd3["capText"], " 页签:", pg.evaluate("window.__activeTab()"),
                  " 后端:", e3, " 提示:", pg.evaluate("window.__msg()"))
            ck("[P3a] 胶囊变「会话模式」", bd3["capText"] == "会话模式", bd3["capText"])
            ck("[P3b] 后端 has_session=true", e3["has_session"] is True, e3["has_session"])
            ck("[P3c] 本会话 mode=ai", e3["mode"] == "ai", e3["mode"])
            ck("[P3d] 页签停在会话模式",
               pg.evaluate("window.__activeTab()") == ["会话模式"],
               pg.evaluate("window.__activeTab()"))

            # ═══ [P4][P5][P6] 默认模式页保存 → 转默认模式（核心）═══
            print("\n===== [P4] 默认模式页保存 → 转默认模式（用户核心要求）=====")
            pg.evaluate("window.__pickTab('默认模式')")
            pg.wait_for_timeout(1200)
            _cur_global = rd(GP).get("mode")
            _target = "自动分析" if _cur_global == "manual" else "人工"
            pg.evaluate("window.__pickMode('%s')" % _target)
            pg.wait_for_timeout(500)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(3000)

            bd4 = pg.evaluate("window.__badge()")
            e4 = eff()
            sess = rd(SP).get("sessions") or {}
            print("    胶囊:", bd4["capText"], " scope:", bd4["capScope"])
            print("    后端:", e4, " session_prefs:", list(sess.keys()))
            print("    提示:", pg.evaluate("window.__msg()"))
            print("    页签:", pg.evaluate("window.__activeTab()"))

            ck("[P4a] 胶囊变「默认模式」", bd4["capText"] == "默认模式", bd4["capText"])
            ck("[P4b] data-qm-runtime=default", bd4["capScope"] == "default", bd4["capScope"])
            # 2026-11-13 方案 D1 取代了 q0 的「删整条」：
            # 切默认模式只改标记，会话数据保留（切回即恢复）。
            _m4 = (sess.get(CHAT) or {}).get("__active_scope__")
            ck("[P4c] 标记切为 default（数据保留）", _m4 == "default",
               (_m4, list(sess.keys())))
            ck("[P5a] 后端 has_session=false", e4["has_session"] is False, e4["has_session"])
            ck("[P5b] 本会话生效值 = 全局值",
               e4["mode"] == rd(GP).get("mode"), (e4["mode"], rd(GP).get("mode")))
            ck("[P6] 页签停在默认模式",
               pg.evaluate("window.__activeTab()") == ["默认模式"],
               pg.evaluate("window.__activeTab()"))
            ck("[P4d] 提示明确说明已切换",
               "已切换到默认模式" in (pg.evaluate("window.__msg()") or ""),
               pg.evaluate("window.__msg()"))

            # ═══ [P7] 反向：会话模式页保存 → 回会话模式 ═══
            print("\n===== [P7] 反向：会话模式页保存 → 回会话模式 =====")
            pg.evaluate("window.__pickTab('会话模式')")
            pg.wait_for_timeout(1000)
            pg.evaluate("window.__pickMode('只用推荐')")
            pg.wait_for_timeout(500)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2800)
            bd7 = pg.evaluate("window.__badge()")
            e7 = eff()
            sess7 = rd(SP).get("sessions") or {}
            print("    胶囊:", bd7["capText"], " 后端:", e7,
                  " 覆盖键:", sorted((sess7.get(CHAT) or {}).keys()))
            ck("[P7a] 胶囊回到「会话模式」", bd7["capText"] == "会话模式", bd7["capText"])
            ck("[P7b] 覆盖重建且 mode=recommend",
               (sess7.get(CHAT) or {}).get("mode") == "recommend",
               (sess7.get(CHAT) or {}).get("mode"))
            ck("[P7c] 覆盖里只有 mode（无整批固化）",
               sorted(k for k in (sess7.get(CHAT) or {})
                      if k not in ("updated_at", "__keyts__", "__active_scope__")) == ["mode"],
               sorted((sess7.get(CHAT) or {}).keys()))

            ck("[P8] 无页面错误", not errs, errs[:2])
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
