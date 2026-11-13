# -*- coding: utf-8 -*-
"""真机验证：作用域不跨会话串味（2026-11-13 用户报障）。

用户原话：「会话1切换成会话模式，会话2本来是默认模式，在会话1切换后，
            会话2也变成了会话模式。」

根因：`qm:v1:scopeChoice` 是全局 localStorage 键，所有会话共用，且曾无条件
优先于 `has_session`。裁定：**有覆盖时才采用记住值，无覆盖一律默认模式**。

真机做法（真实 Chromium + 宿主 react-vendor + 线上 bundle）：
  [L1] 会话A（有覆盖）：记住值=session → 打开面板落在「会话模式」
  [L2] 会话B（无覆盖）：**沿用同一个记住值=session** → 打开面板必须落在「默认模式」
       ← 核心：这就是用户报的串味场景
  [L3] 会话B 的「当前运行」胶囊显示「默认模式」而非「会话模式」
  [L4] 写入记住值=default 再测会话A（有覆盖）→ 仍落在「会话模式」
       （2026-11-13 用户裁定废弃 qm:v1:scopeChoice，初始页签唯一依据 has_session）
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SP = "/app/working/plugins/question-modal/session_prefs.json"

# 会话 A：有覆盖（本次实验临时建立）；会话 B：无覆盖
CHAT_A_SID, CHAT_A_AG = "1791724819571-muuetab", "wb74Jn"     # 真实会话
CHAT_B_SID, CHAT_B_AG = "1794410957635-v0mrkpr", "wb74Jn"     # 当前会话

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  ✓ " + n)
    else:
        fail += 1; print("  ✗ " + n + (("  " + str(d)) if d else ""))

def sess():
    try:
        return json.load(open(SP, encoding="utf-8")).get("sessions", {})
    except Exception:
        return {}

def post(path, body):
    r = urllib.request.Request(
        BASE + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(r, timeout=20).read())

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
function P(p){return (p&&p.children)||null;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(P,{confirm:()=>{}}),Popover:P,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"__AG__",
 getCurrentSessionId:()=>"__SID__",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const rf=window.fetch.bind(window);
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__ready=true;
</script></body></html>
"""

def open_panel(pg):
    return pg.evaluate("""()=>{
      if(!window.__btnNode) return "no-node";
      try{
        const RD=window.QwenPaw.host.ReactDOM;
        const h=document.createElement('div'); h.id='qb';
        document.body.appendChild(h);
        RD.render(window.__btnNode,h);
        const btn=h.querySelector('button');
        if(btn){btn.click(); return btn.textContent.trim();}
        return "no-button";
      }catch(e){return "err:"+e;}
    }""")

def read_panel(pg):
    return pg.evaluate("""()=>{
      const tabs=[...document.querySelectorAll('.qm-set-tab')].map(e=>({
        t:(e.textContent||'').trim(), on: e.className.includes('qm-set-tabon')}));
      const active=tabs.filter(x=>x.on).map(x=>x.t)[0]||'';
      const rt=document.querySelector('[data-qm-runtime]');
      return {tabs:tabs.map(x=>x.t), active,
              runtime: rt?rt.getAttribute('data-qm-runtime'):'',
              runtimeText: rt?(rt.textContent||'').trim():''};
    }""")

def run_page(pg, sid, ag, remembered):
    """打开一个「会话」：设置记住值 → 挂载 → 打开面板 → 读状态。"""
    pg.evaluate("(v)=>{try{localStorage.removeItem('qm:v1:scopeChoice');if(v)localStorage.setItem('qm:v1:scopeChoice',v);}catch(e){}}", remembered)
    p = "/app/working/plugins/question-modal/dist/__leak_%s.html" % ("a" if sid == CHAT_A_SID else "b")
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("__SID__", sid).replace("__AG__", ag))
    pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/" + os.path.basename(p),
            wait_until="load")
    pg.wait_for_function("window.__ready===true", timeout=30000)
    pg.wait_for_timeout(1200)
    # 重新写入记住值（页面导航会重置同源 localStorage 吗？不会，但为稳妥再写一次）
    pg.evaluate("(v)=>{try{if(v)localStorage.setItem('qm:v1:scopeChoice',v);}catch(e){}}", remembered)
    opened = open_panel(pg)
    pg.wait_for_timeout(1500)
    st = read_panel(pg)
    st["opened"] = opened
    return p, st

def main():
    before = json.load(open(SP, encoding="utf-8")) if os.path.exists(SP) else {"sessions": {}}
    print("  测试前 session_prefs:", json.dumps(before.get("sessions"), ensure_ascii=False)[:180])

    made = []
    try:
        # 建立会话A 的覆盖（mode=ai），会话B 保持无覆盖
        post("/api/question-modal/session-prefs",
             {"session_id": CHAT_A_SID, "agent_id": CHAT_A_AG, "settings": {"mode": "ai"}})
        made.append("A")
        # 2026-11-13：clear 已加 confirm 门（缺 → 400），测试跟上
        post("/api/question-modal/session-prefs/clear",
             {"session_id": CHAT_B_SID, "agent_id": CHAT_B_AG, "confirm": True})
        print("  A 有覆盖 / B 无覆盖:", json.dumps(sess(), ensure_ascii=False)[:200])

        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))

            # ── 场景1：记住值=session，先开会话A（有覆盖）──
            pA, stA = run_page(pg, CHAT_A_SID, CHAT_A_AG, "session")
            print("  [A] 页签:", stA["tabs"], "| 激活:", stA["active"], "| runtime:", stA["runtime"])
            ck("[L1] 会话A（有覆盖）+ 记住值=session → 落在「会话模式」",
               stA["active"] == "会话模式", stA)

            # ── 场景2：★核心★ 同一个记住值=session，改开会话B（无覆盖）──
            pB, stB = run_page(pg, CHAT_B_SID, CHAT_B_AG, "session")
            print("  [B] 页签:", stB["tabs"], "| 激活:", stB["active"], "| runtime:", stB["runtime"])
            ck("[L2] 会话B（无覆盖）+ 同一记住值=session → 必须落在「默认模式」（串味修复）",
               stB["active"] == "默认模式", stB)
            ck("[L3] 会话B 的「当前运行」显示默认模式",
               stB["runtime"] == "default", stB["runtime"])

            # ── 场景3（2026-11-13 改判）：写入记住值=default 后，会话A（有覆盖）
            #    仍必须落在「会话模式」—— 记住值已按用户裁定**彻底废弃**。
            #
            #    原断言是「记住值有效 → 落在默认模式」，那是废弃前的语义；
            #    现在初始页签唯一依据是 has_session（src/index.tsx 里明确注释：
            #    「彻底删掉记住上次页签」，因为全局键会让会话1 显示成默认模式）。
            #    所以正确判据反转：写入的记住值必须**被忽略**。
            pC, stC = run_page(pg, CHAT_A_SID, CHAT_A_AG, "default")
            print("  [A2] 页签:", stC["tabs"], "| 激活:", stC["active"])
            ck("[L4] 会话A（有覆盖）+ 写入记住值=default → 仍落在「会话模式」（记住值已被废弃、被忽略）",
               stC["active"] == "会话模式", stC)

            ck("[L5] 无 JS 异常", not errs, errs[:2])
            b.close()

            for p in (pA, pB, pC):
                try: os.remove(p)
                except OSError: pass
    finally:
        # ── 恢复：清掉本次造的 A 覆盖，B 本来无覆盖 ──
        for sid, ag in ((CHAT_A_SID, CHAT_A_AG), (CHAT_B_SID, CHAT_B_AG)):
            try:
                post("/api/question-modal/session-prefs/clear",
                     {"session_id": sid, "agent_id": ag, "confirm": True})
            except Exception as e:
                print("  cleanup warn:", e)
        print("  恢复后 session_prefs:", json.dumps(sess(), ensure_ascii=False)[:180])

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
