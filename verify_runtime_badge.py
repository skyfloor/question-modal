# -*- coding: utf-8 -*-
"""验证 2026-11-13 用户报告的场景（真 Chromium + 真后端）。

用户原话：
  1、会话1 运行模式为会话模式，并点击保存。
  2、会话2 运行模式为默认模式，并点击保存，
  3、会话1 也变成默认模式了。

已定性：保存数据本身没被串改（后端隔离正确），问题在**右上角胶囊显示**：
它读的是 scopeChoice（= 正在编辑哪个页签，存在全局 localStorage，跨会话共享），
而不是 has_session（= 本会话实际有没有覆盖）。

用户裁定：
  q0 胶囊显示真实运行模式（has_session）
  q1 完全不记页签（每次打开按 has_session 决定初始页签）
  q2 修胶囊 + 页签记忆，并补真机测试守住

断言：
  [M1] 有覆盖的会话 → 胶囊只显示「会话模式」（无「当前运行：」前缀）
  [M2] 无覆盖的会话 → 胶囊只显示「默认模式」
  [M3] 在无覆盖会话点「默认模式」页签并保存后，
       切回有覆盖的会话 → 胶囊**仍显示会话模式**（这是用户报的 bug）
  [M4] 产物中不再读写 qm:v1:scopeChoice（彻底删记忆）
  [M5] 有覆盖会话打开面板 → 初始页签=会话模式；无覆盖 → 默认模式
  [M6] 保存数据隔离：会话2 保存不改会话1 的覆盖
  [M7] 无页面错误
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
C1 = "0489fc54-8a83-4621-984b-0239e944bfc7"   # 会话1（将设覆盖）
C2 = "348b16bc-64f8-42ab-becc-88d6d0e47745"   # 会话2（无覆盖）
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
 getCurrentSessionId:()=>window.__sid||"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__open=()=>{
  // 每次用全新容器 + 卸载旧树，保证按钮重新挂载、onClick 重新绑定
  const old=document.getElementById("root"); if(old) old.remove();
  const h=document.createElement("div"); h.id="root"; document.body.appendChild(h);
  const ND=RD.createRoot||null;
  if(ND){ RD.createRoot(h).render(window.__btnNode); }
  else { RD.render(window.__btnNode, h); }
  setTimeout(()=>{ const b=h.querySelector("button"); if(b)b.click(); }, 60);
  return "scheduled";
};
window.__tab=(label)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label; t.click(); return "tab:"+label;
};
window.__activeTab=()=>[...root().querySelectorAll(".qm-set-tab")]
  .filter(x=>/qm-set-tabon/.test(x.className)).map(x=>(x.textContent||"").trim());
window.__runtime=()=>{
  const el=root().querySelector("[data-qm-runtime]");
  return el?(el.textContent||"").trim():null;
};
window.__runtimeScope=()=>{
  const el=root().querySelector("[data-qm-runtime]");
  return el?el.getAttribute("data-qm-runtime"):null;
};
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label; btn.click(); return "clicked:"+label;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "clicked"; };
window.__dist = ()=>{
  const el=root().querySelector("[data-qm-runtime]");
  const tabs=[...root().querySelectorAll(".qm-set-tab")]
    .filter(x=>/qm-set-tabon/.test(x.className)).map(x=>(x.textContent||"").trim());
  return { runtime: el?(el.textContent||"").trim():null,
           scope: el?el.getAttribute("data-qm-runtime"):null,
           tabs };
};
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__runtime.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__runtime.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            # 基线：全局 manual；会话1 有覆盖(ai)，会话2 无覆盖
            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {C1: {"mode": "ai"}}, "updated_at": 1})

            # ═══ [M1][M5a] 会话1（有覆盖）═══
            print("\n===== [M1] 会话1（有会话覆盖）=====")
            pg.evaluate("window.__sid='%s'" % SID)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % C1)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            rt1 = pg.evaluate("window.__runtime()")
            sc1 = pg.evaluate("window.__runtimeScope()")
            tab1 = pg.evaluate("window.__activeTab()")
            print("    胶囊:", rt1, " scope:", sc1, " 初始页签:", tab1)
            ck("[M1a] 胶囊只显示「会话模式」（无前缀）",
               (rt1 or "").strip() == "会话模式", rt1)
            ck("[M1b] data-qm-runtime=session", sc1 == "session", sc1)
            ck("[M5a] 初始页签=会话模式", tab1 == ["会话模式"], tab1)

            # ═══ [M2][M5b] 会话2（无覆盖）═══
            print("\n===== [M2] 会话2（无会话覆盖）=====")
            pg.evaluate("window.__sid='1794410957635-v0mrkpr'")
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % C2)
            print("    实际 pathname:", pg.evaluate("location.pathname"))
            import urllib.parse as _up
            _u = (BASE + "/api/question-modal/effective-config?chat_id="
                  + _up.quote(C2) + "&session_id=&agent_id=" + AG)
            _r = urllib.request.Request(_u, headers={"X-Agent-Id": AG})
            with urllib.request.urlopen(_r, timeout=15) as _resp:
                _d = json.loads(_resp.read().decode() or "{}")
            print("    后端 C2 has_session =", _d.get("has_session"),
                  " session_prefs 条目:", list((rd(SP).get("sessions") or {}).keys()))
            pg.evaluate("window.__open()")
            for _w in (500, 1000, 2000, 3000):
                pg.wait_for_timeout(500 if _w == 500 else 500)
                print("    +%dms:" % _w, pg.evaluate("window.__dist()"))
            rt2 = pg.evaluate("window.__runtime()")
            sc2 = pg.evaluate("window.__runtimeScope()")
            tab2 = pg.evaluate("window.__activeTab()")
            print("    胶囊:", rt2, " scope:", sc2, " 初始页签:", tab2)
            _af = pg.evaluate("window.__allFetch||[]")
            print("    全部请求:", [x.split('/api/')[-1][:60] for x in _af][-6:])
            print("    effective-config 次数:", sum(1 for x in _af if 'effective-config' in x))
            ck("[M2a] 胶囊只显示「默认模式」（无前缀）",
               (rt2 or "").strip() == "默认模式", rt2)
            ck("[M2b] data-qm-runtime=default", sc2 == "default", sc2)
            ck("[M5b] 初始页签=默认模式", tab2 == ["默认模式"], tab2)

            # ═══ [M3] 关键：会话2 保存后，切回会话1 胶囊仍是会话模式 ═══
            print("\n===== [M3] 会话2 在默认模式页保存 → 切回会话1 =====")
            pg.evaluate("window.__tab('默认模式')")
            pg.wait_for_timeout(700)
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            print("    会话2 保存完成，全局 mode =", rd(GP).get("mode"))

            pg.evaluate("window.__sid='%s'" % SID)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % C1)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            rt3 = pg.evaluate("window.__runtime()")
            tab3 = pg.evaluate("window.__activeTab()")
            print("    切回会话1 → 胶囊:", rt3, " 页签:", tab3)
            ck("[M3a] 会话1 胶囊仍是「会话模式」（不被会话2 串）",
               (rt3 or "").strip() == "会话模式", rt3)
            ck("[M3b] 会话1 初始页签仍是会话模式", tab3 == ["会话模式"], tab3)

            sess = rd(SP).get("sessions") or {}
            ck("[M6a] 会话1 的覆盖仍在且 mode=ai",
               (sess.get(C1) or {}).get("mode") == "ai",
               (sess.get(C1) or {}).get("mode"))
            # D1：点过保存的会话会留下一条「标记记录」，所以不能用
            # 「键是否存在」判断；真正的判据是 active_scope / has_session。
            _c2 = (sess.get(C2) or {}).get("__active_scope__")
            ck("[M6b] 会话2 未变成会话模式（标记非 session）", _c2 != "session",
               (_c2, list(sess.keys())))

            # ═══ [M4] 产物不再读写 scopeChoice ═══
            print("\n===== [M4] 产物不再有 qm:v1:scopeChoice =====")
            dist = open(PLUG + "/dist/index.js", encoding="utf-8", errors="ignore").read()
            ck("[M4a] 产物中 scopeChoice 键为 0 处",
               dist.count("qm:v1:scopeChoice") == 0,
               dist.count("qm:v1:scopeChoice"))

            ck("[M7] 无页面错误", not errs, errs[:2])
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
