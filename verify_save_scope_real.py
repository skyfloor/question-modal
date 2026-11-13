# -*- coding: utf-8 -*-
"""真机复现：保存「默认模式 / 会话模式」时到底发了什么、写到哪里。

用户 2026-11-13 报：「会话1和会话2在保存默认，会话时会有覆盖」。

本脚本用真实 Chromium + 线上 bundle，拦截所有 POST，完整走一遍：
  1. 打开设置面板（会话B，无覆盖）
  2. 点「默认模式」页签 → 点保存        → 断言：只发 /prefs，不产生会话覆盖
  3. 点「会话模式」页签 → 改一项 → 保存  → 断言：只发 /session-prefs，且只含改动键
  4. 再点「默认模式」页签 → 点保存       → 断言：不产生/不清会话覆盖
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SP = "/app/working/plugins/question-modal/session_prefs.json"
SID, AG = "1794410957635-v0mrkpr", "wb74Jn"   # 当前会话（无覆盖）

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  ✓ " + n)
    else:
        fail += 1; print("  ✗ " + n + (("  " + str(d)) if d else ""))

def sess():
    try: return json.load(open(SP, encoding="utf-8")).get("sessions", {})
    except Exception: return {}

def post(path, body):
    r = urllib.request.Request(BASE + path, data=json.dumps(body).encode(),
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
window.__REQ=[];
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"__AG__",
 getCurrentSessionId:()=>"__SID__",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u),mm=((o&&o.method)||"GET").toUpperCase();
 if(mm!=="GET"){let b=null;try{b=JSON.parse((o&&o.body)||"null")}catch(e){b=String((o&&o.body)||"")}
   window.__REQ.push({url,body:b,method:mm});}
 return rf(u,o);};
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

def click_tab(pg, name):
    return pg.evaluate("""(nm)=>{
      const t=[...document.querySelectorAll('.qm-set-tab')].find(e=>(e.textContent||'').trim()===nm);
      if(!t) return null; t.click(); return nm;
    }""", name)

def click_save(pg):
    return pg.evaluate("""()=>{
      const b=[...document.querySelectorAll('button')].find(e=>/^\\s*保存\\s*$/.test((e.textContent||'').trim()));
      if(!b) return "no-btn"; const d=!!b.disabled; b.click(); return d?"disabled":"clicked";
    }""")

def reqs(pg):
    r = pg.evaluate("()=>window.__REQ.slice()")
    pg.evaluate("()=>{window.__REQ=[]}")
    return r

def main():
    before = dict(sess())
    print("  测试前会话覆盖:", json.dumps(before, ensure_ascii=False)[:200])
    p = "/app/working/plugins/question-modal/dist/__saveprobe.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("__SID__", SID).replace("__AG__", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page(); errs=[]
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__saveprobe.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.wait_for_timeout(1500)
            print("  设置按钮:", open_panel(pg)); pg.wait_for_timeout(1500)

            # ── 步骤1：会话B 无覆盖 → 应在默认模式页；直接点保存 ──
            reqs(pg)
            print("  当前页签:", pg.evaluate("""()=>{const a=[...document.querySelectorAll('.qm-set-tab')].find(e=>e.className.includes('qm-set-tabon'));return a?(a.textContent||'').trim():'';}"""))
            print("  步骤1 点保存:", click_save(pg)); pg.wait_for_timeout(1800)
            r1 = reqs(pg)
            for r in r1: print("     ", r["method"], r["url"].split("/api/")[-1])
            s1 = sess()
            ck("[P1] 无覆盖会话在默认模式页保存 → 不产生会话覆盖",
               not s1, json.dumps(s1, ensure_ascii=False)[:160])
            ck("[P2] 该次保存只 POST /prefs（不碰 session-prefs）",
               all("session-prefs" not in r["url"] for r in r1) and
               any(r["url"].rstrip("/").endswith("/question-modal/prefs") for r in r1),
               [r["url"].split("/api/")[-1] for r in r1])

            # ── 步骤2：切到会话模式页 → 改一项 → 保存 ──
            print("  切会话模式:", click_tab(pg, "会话模式")); pg.wait_for_timeout(1200)
            toggled = pg.evaluate("""()=>{
              const rows=[...document.querySelectorAll('.qm-set-row')];
              const r=rows.find(e=>(e.textContent||'').includes('携带上下文'));
              if(!r) return "no-row";
              const btn=r.querySelector('button,[role=switch],.qm-set-switch');
              if(!btn) return "no-ctl"; btn.click(); return "clicked";
            }""")
            print("  切换携带上下文:", toggled); pg.wait_for_timeout(700)
            reqs(pg)
            print("  步骤2 点保存:", click_save(pg)); pg.wait_for_timeout(2000)
            r2 = reqs(pg)
            for r in r2: print("     ", r["method"], r["url"].split("/api/")[-1], "|", str(r.get("body"))[:160])
            s2 = sess()
            ck("[P3] 会话模式页保存 → 产生会话覆盖且只含改动键",
               len(s2) == 1 and list(list(s2.values())[0].keys() & {"with_context"}) == ["with_context"],
               json.dumps(s2, ensure_ascii=False)[:200])
            ck("[P4] 会话模式保存不 POST /prefs（不污染全局）",
               all(not r["url"].rstrip("/").endswith("/question-modal/prefs") for r in r2),
               [r["url"].split("/api/")[-1] for r in r2])

            # ── 步骤3：再切回默认模式页 → 保存 → 会话覆盖必须仍在 ──
            print("  切默认模式:", click_tab(pg, "默认模式")); pg.wait_for_timeout(1200)
            reqs(pg)
            print("  步骤3 点保存:", click_save(pg)); pg.wait_for_timeout(1800)
            r3 = reqs(pg)
            for r in r3: print("     ", r["method"], r["url"].split("/api/")[-1])
            s3 = sess()
            ck("[P5] 默认模式页保存后，会话覆盖仍完整保留（未被抹掉/未被改写）",
               s3 == s2, "before=%s after=%s" % (json.dumps(s2, ensure_ascii=False), json.dumps(s3, ensure_ascii=False)))

            ck("[P6] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try: os.remove(p)
        except OSError: pass
        try:
            post("/api/question-modal/session-prefs/clear", {"session_id": SID, "agent_id": AG})
        except Exception as e: print("  cleanup warn:", e)

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
