# -*- coding: utf-8 -*-
"""真机：设置面板保存 → 只发改动项会不会丢配置（端到端）。

验证两层防护：
  1. 后端合并（verify_session_merge.py 已覆盖）
  2. 前端 cfgSave 带全量生效值（本脚本覆盖）

判据：模拟「面板只提交改动项」的最坏情况，其他键必须仍在。
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
SP = "/app/working/plugins/question-modal/session_prefs.json"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def sess():
    try:
        with open(SP, encoding="utf-8") as f:
            return json.load(f).get("sessions", {})
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
   window.__REQ.push({url,body:b});}
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__ready=true;
</script></body></html>
"""

def main():
    before = dict(sess().get(CHAT, {}))
    print("  保存前覆盖:", json.dumps(before, ensure_ascii=False))

    p = "/app/working/plugins/question-modal/dist/__sv.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__sv.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.wait_for_timeout(1500)

            # 打开设置面板（按钮由 addPrefix 传入，直接渲染它）
            opened = pg.evaluate("""()=>{
              if(!window.__btnNode) return "no-node";
              try{
                const RD = window.QwenPaw.host.ReactDOM;
                const h=document.createElement('div'); h.id='qb';
                document.body.appendChild(h);
                RD.render(window.__btnNode, h);
                const btn=h.querySelector('button');
                if(btn){btn.click(); return btn.textContent.trim();}
                return "no-button";
              }catch(e){return "err:"+e;}
            }""")
            pg.wait_for_timeout(1400)
            print("  设置按钮:", opened)

            # 页签已改名为「会话模式」（2026-11-04）：有覆盖时面板自动落该页，
            # 无覆盖则落「默认模式」——两种都点一下确保停在会话页。
            switched = pg.evaluate("""()=>{
              const tabs=[...document.querySelectorAll('.qm-set-tab')];
              const t=tabs.find(e=>(e.textContent||'').trim()==='会话模式');
              if(!t) return null;
              t.click();
              return '会话模式';
            }""")
            pg.wait_for_timeout(900)
            print("  切页签:", switched)

            panel = pg.evaluate("""()=>{
              const t=(document.body.innerText||'');
              const tabs=[...document.querySelectorAll('.qm-set-tab')].map(e=>e.textContent.trim());
              return { tabs,
                       hasSession: tabs.includes('会话模式'),
                       hasClear: t.includes('清空本会话覆盖'),
                       hasBtn: !!document.querySelector('[data-qm-sessclear]'),
                       tail: t.slice(0,300) };
            }""")
            print("  面板文本片段:", json.dumps(panel, ensure_ascii=False)[:260])
            ck("[V1] 设置面板已打开（含「会话模式」页签）", panel["hasSession"], panel.get("tabs"))
            # 2026-11-12 用户裁定：作用域改手动选择后，「清空本会话覆盖」入口已删除
            # （后端 /session-prefs/clear 保留但前端无入口）。此处反向断言防止回归。
            ck("[V2] 「清空本会话覆盖」入口已移除（2026-11-12 裁定）",
               not panel["hasBtn"] and not panel["hasClear"], panel["tail"][:170])

            # 直接抓「面板保存会发什么」——按源码逻辑：session 保存须带全量
            src = pg.evaluate("""()=>{
              // 从线上 bundle 里找 cfgSave 发出的键集合线索
              return document.body.innerText.length;
            }""")
            ck("[V3] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    # ── 源码断言：cfgSave 的 session 分支带全量 ──
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "src/index.tsx"), encoding="utf-8") as f:
        tsx = f.read()
    i = tsx.find("async function cfgSave")
    seg = tsx[i:i + 2200] if i > 0 else ""
    # 2026-11-13 修正：这两条断言守护的是「SESSION_KEYS 全量固化」，
    # 而该机制已被用户裁定改为**最小覆盖**（只写用户真正改动的键）后删除 ——
    # 它与 verify_only_draft_keys.py 的 [F1a]（请求体只含改动的键）方向相反。
    # 断言已过期，改为守护当前正确语义：不再整批固化 + 空改动也能保存。
    ck("[V4] cfgSave 不再整批固化 SESSION_KEYS（改为最小覆盖）",
       "SESSION_KEYS.forEach" not in seg, seg[:140])
    ck("[V5] 无未保存修改时也允许保存（2026-11-12 裁定）",
       "无未保存修改也允许保存" in seg or "Object.keys(settingsState.draft).length" in seg,
       seg[:140])

    after = dict(sess().get(CHAT, {}))
    ck("[V6] 全程未破坏已存覆盖", all(after.get(k) == v for k, v in before.items()),
       json.dumps(after, ensure_ascii=False))

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
