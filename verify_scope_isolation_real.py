# -*- coding: utf-8 -*-
"""真机复现：设置面板保存到底把什么写进了哪个存储层。

用户 2026-11-13 报：「所有会话模式保存、默认模式保存，都变成了全局的」。

本脚本用真实 Chromium 加载线上 served bundle，注入 fetch 拦截器记录**真实
请求体**，然后分别在「会话模式」「默认模式」页点保存，看：
  [S1] 会话模式页保存 → 必须 POST /session-prefs（不是 /prefs）
  [S2] 会话模式页保存体只能含 draft 里改动的键（最小覆盖）
  [S3] 会话模式保存后，全局 analysis_prefs.json 必须一字不变
  [S4] 默认模式页保存 → POST /prefs（这是设计本意：默认模式 = 全局默认）
  [S5] 会话覆盖不能被默认模式保存抹掉
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1794410957635-v0mrkpr", "wb74Jn"      # 当前会话
SP = "/app/working/plugins/question-modal/session_prefs.json"
GP = "/app/working/plugins/question-modal/analysis_prefs.json"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def sess():
    try:
        return json.load(open(SP, encoding="utf-8")).get("sessions", {})
    except Exception:
        return {}

def glob_sig():
    try:
        g = json.load(open(GP, encoding="utf-8"))
        return {k: g.get(k) for k in
                ("mode", "model_id", "template_id", "with_context", "parallel")}
    except Exception:
        return {}

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
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
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
      const tabs=[...document.querySelectorAll('.qm-set-tab')];
      const t=tabs.find(e=>(e.textContent||'').trim()===nm);
      if(!t) return null; t.click(); return nm;
    }""", name)

def click_save(pg):
    return pg.evaluate("""()=>{
      const b=[...document.querySelectorAll('button')].find(
        e=>/^\s*保存\s*$/.test((e.textContent||'').trim()));
      if(!b) return "no-save-btn";
      const dis = !!b.disabled;
      b.click(); return dis ? "disabled" : "clicked";
    }""")

def main():
    p = "/app/working/plugins/question-modal/dist/__probe_scope.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG).replace("%BASE%", BASE))

    s0, g0 = dict(sess()), glob_sig()
    print("  保存前 会话覆盖:", json.dumps(s0, ensure_ascii=False)[:160])
    print("  保存前 全局:", json.dumps(g0, ensure_ascii=False))

    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__probe_scope.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.wait_for_timeout(1500)

            print("  设置按钮:", open_panel(pg))
            pg.wait_for_timeout(1200)
            tabs = pg.evaluate("""()=>[...document.querySelectorAll('.qm-set-tab')].map(e=>e.textContent.trim())""")
            print("  页签:", tabs)

            # ── 场景 A：会话模式页，只改「携带上下文」一个开关，然后保存 ──
            print("  切到会话模式:", click_tab(pg, "会话模式"))
            pg.wait_for_timeout(900)
            pg.evaluate("window.__REQ=[]")
            toggled = pg.evaluate("""()=>{
              // 找「携带上下文」那一行的开关按钮
              const rows=[...document.querySelectorAll('.qm-set-row')];
              const r=rows.find(e=>(e.textContent||'').includes('携带上下文'));
              if(!r) return "no-row";
              const btn=r.querySelector('button,[role=switch],.qm-set-switch');
              if(!btn) return "no-ctl";
              btn.click(); return "clicked";
            }""")
            print("  切换携带上下文:", toggled)
            pg.wait_for_timeout(600)
            print("  点保存:", click_save(pg))
            pg.wait_for_timeout(2000)

            reqs = pg.evaluate("()=>window.__REQ.slice()")
            print("  会话页发的请求:")
            for r in reqs:
                print("    ", r["method"], r["url"].split("/api/")[-1],
                      "| body:", str(r["body"])[:220])

            sess_posts = [r for r in reqs if "session-prefs" in r["url"] and r["method"] == "POST"]
            glob_posts = [r for r in reqs if r["url"].rstrip("/").endswith("/question-modal/prefs") and r["method"] == "POST"]

            ck("[S1] 会话模式页保存走 POST /session-prefs",
               len(sess_posts) == 1 and not glob_posts,
               "session=%d prefs=%d" % (len(sess_posts), len(glob_posts)))

            if sess_posts:
                body = sess_posts[0]["body"]
                if isinstance(body, str): body = json.loads(body)
                keys = sorted((body.get("settings") or {}).keys())
                ck("[S2] 会话保存体只含改动的键（最小覆盖）", keys == ["with_context"],
                   "实际键=%s" % keys)

            s1 = sess()
            g1 = glob_sig()
            print("  保存后 会话覆盖:", json.dumps(s1, ensure_ascii=False)[:200])
            print("  保存后 全局:", json.dumps(g1, ensure_ascii=False))
            ck("[S3] 会话保存后全局一字未变", g1 == g0, "before=%s after=%s" % (g0, g1))

            # ── 场景 B：默认模式页保存（设计上写全局），不得抹掉会话覆盖 ──
            print("  切到默认模式:", click_tab(pg, "默认模式"))
            pg.wait_for_timeout(1200)
            pg.evaluate("window.__REQ=[]")
            print("  点保存:", click_save(pg))
            pg.wait_for_timeout(2000)
            reqs2 = pg.evaluate("()=>window.__REQ.slice()")
            print("  默认页发的请求:")
            for r in reqs2:
                print("    ", r["method"], r["url"].split("/api/")[-1],
                      "| body:", str(r["body"])[:220])

            glob_posts2 = [r for r in reqs2 if r["url"].rstrip("/").endswith("/question-modal/prefs") and r["method"] == "POST"]
            sess_posts2 = [r for r in reqs2 if "session-prefs" in r["url"] and r["method"] == "POST"]
            # 2026-11-13（D1 机制）：默认模式保存**必须**同时发一条 session-prefs
            # 带 set_scope=default —— 它不写会话值，只把 __active_scope__ 置为
            # default 让会话层暂不生效（切回会话模式可恢复原值）。
            # 原断言「不得出现 session-posts」是 D1 之前的旧语义 → 过期。
            # 正确判据：① 必须写全局 ② 那条 session 请求只能带 set_scope，
            #            不得带任何配置值（否则就是污染会话覆盖）。
            scoped2 = [r for r in sess_posts2
                       if isinstance(r.get("body"), dict)
                       and r["body"].get("set_scope") == "default"]
            payload2 = [r for r in scoped2
                        if any(k != "set_scope" for k in
                               (r.get("body", {}).get("settings") or {}))]
            ck("[S4] 默认模式页保存写全局 + 仅以 set_scope 暂停会话层（不带配置值）",
               len(glob_posts2) >= 1 and bool(scoped2) and not payload2,
               "prefs=%d session=%d scoped=%d 带值的=%d"
               % (len(glob_posts2), len(sess_posts2), len(scoped2), len(payload2)))

            s2 = sess()
            print("  默认保存后 会话覆盖:", json.dumps(s2, ensure_ascii=False)[:200])
            ck("[S5] 默认模式保存未抹掉已有会话覆盖",
               all(k in s2 for k in s1), "before=%s after=%s" % (list(s1), list(s2)))

            ck("[S6] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
        # 清理本次探针造的会话覆盖，恢复「无覆盖=跟随全局」
        try:
            r = urllib.request.Request(
                BASE + "/api/question-modal/session-prefs/clear",
                data=json.dumps({"session_id": SID, "agent_id": AG}).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            urllib.request.urlopen(r, timeout=10).read()
        except Exception as e:
            print("  cleanup warn:", e)

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
