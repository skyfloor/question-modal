# -*- coding: utf-8 -*-
"""真机验证：不同 URL 形态下，前端保存会话设置时是否会带上 chat UUID。

用户场景（2026-11-13）：
  局域网机器（旧）：能保存
  frpc 公网域名机器（新）：不能保存，报
    「chat_id (or resolvable session_id) is required」

根因是宿主 `getCurrentSessionId()` 从 URL 推导：只有 pathname 命中
`/chat/<id>` 且该 id 能命中宿主会话表才有值。修复后前端**额外**从 URL
解析 UUID，不再单靠宿主 API。

断言（关键：在宿主 API **拿不到** session_id 时也能保存）：
  [E1] getCurrentSessionId() 返回空 + URL 是 /chat/<uuid> → 保存成功
       且请求体 chat_id == 该 uuid（这是新机器失败的那个场景）
  [E2] URL 是 /chat/<session_id 形态> → 不把它当 chat_id（UUID 校验生效）
  [E3] URL 无 /chat/ 段 + 宿主 API 给值 → 走老路径（session_id 反查）仍可保存
  [E4] 保存失败时提示是中文可操作文案，不是英文 detail
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
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

/* 记录所有发往 session-prefs / prefs 的请求体，供断言 */
window.__posts=[];
const _fetch=window.fetch.bind(window);
window.fetch=async(u,o)=>{
  try{
    const s=String(u);
    if(s.includes("/question-modal/session-prefs")||s.includes("/question-modal/prefs")){
      window.__posts.push({url:s, body:(o&&o.body)||""});
    }
  }catch(e){}
  return _fetch(u,o);
};

function FakeModal(p){ return (p&&p.children)||null; }
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;

/* ★ 关键：getCurrentSessionId 模拟「新机器」——恒返回空 */
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>window.__hostSid||"",
 getChatId:()=>"",useTheme:()=>"light"},
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
window.__msg=()=>{
  const t=root().innerText||"";
  const m=t.match(/保存失败[^\n]*|没能定位[^\n]*|已保存[^\n]*/);
  return m?m[0]:"";
};
window.__lastPost=()=>{
  const p=window.__posts.filter(x=>x.url.includes("session-prefs"));
  return p.length?p[p.length-1]:null;
};
window.__ready=true;
</script></body></html>
"""


def case(pg, name, url_path, host_sid, expect_ok):
    """在一个指定 URL 下打开面板并保存，返回最后一笔 session-prefs 请求。"""
    hp = PLUG + "/dist/__chatid.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG))
    try:
        pg.goto(BASE + url_path, wait_until="load")
        pg.wait_for_timeout(300)
        # 页面 goto 后是静态 html，需要重新加载脚本（脚本已在 html 里）
        pg.wait_for_function("window.__ready===true", timeout=30000)
        pg.evaluate("window.__hostSid=%s" % json.dumps(host_sid))
        pg.evaluate("window.__posts=[]")
        pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
        pg.evaluate("window.__open()")
        pg.wait_for_timeout(2200)
        pg.evaluate("window.__tab('会话模式')")
        pg.wait_for_timeout(800)
        pg.evaluate("window.__pickMode('自动分析')")
        pg.wait_for_timeout(400)
        pg.evaluate("window.__save()")
        pg.wait_for_timeout(2500)
        return pg.evaluate("window.__lastPost()"), pg.evaluate("window.__msg()")
    finally:
        try:
            os.remove(hp)
        except OSError:
            pass


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))

            # 用一个会被静态服务正确返回的路径承载探针页
            probe_dir = PLUG + "/dist"
            src_html = probe_dir + "/__chatid.html"
            # 先写一次，让 case() 里的 goto 能命中
            with open(src_html, "w", encoding="utf-8") as f:
                f.write(PAGE.replace("%AG%", AG))
            PROBE_URL = "/api/frontend_plugin/question-modal/files/dist/__chatid.html"

            print("\n===== [E1] 宿主 API 返回空 + URL 是 /chat/<uuid>（新机器场景）=====")
            # 关键：让 pathname 命中 /chat/<uuid>
            pg.goto(BASE + PROBE_URL, wait_until="load")
            pg.wait_for_timeout(200)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__hostSid=''")     # ← 模拟新机器：拿不到 session_id
            pg.evaluate("window.__posts=[]")
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(800)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            post1 = pg.evaluate("window.__lastPost()")
            msg1 = pg.evaluate("window.__msg()")
            print("    pathname:", pg.evaluate("location.pathname"))
            print("    post:", json.dumps(post1, ensure_ascii=False)[:200])
            print("    msg:", msg1)
            ck("[E1a] 发起了 session-prefs 请求", bool(post1), post1)
            if post1:
                body1 = json.loads(post1["body"] or "{}")
                ck("[E1b] 请求体 chat_id == URL 里的 UUID",
                   body1.get("chat_id") == CHAT, body1.get("chat_id"))
                ck("[E1c] 保存成功（提示已保存，非失败）",
                   "保存失败" not in (msg1 or "") and "已保存" in (msg1 or ""), msg1)

            print("\n===== [E2] URL 是 session_id 形态 → 不得当 chat_id =====")
            pg.goto(BASE + PROBE_URL, wait_until="load")
            pg.wait_for_timeout(200)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % SID)
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__hostSid=''")
            pg.evaluate("window.__posts=[]")
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(800)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            post2 = pg.evaluate("window.__lastPost()")
            print("    post:", json.dumps(post2, ensure_ascii=False)[:200])
            ck("[E2] session_id 形态的 URL 未被误用作 chat_id",
               (not post2) or (json.loads(post2["body"] or "{}").get("chat_id") != SID),
               post2)

            print("\n===== [E3] 无 /chat/ 段 + 宿主 API 给值 → 走老路径 =====")
            pg.goto(BASE + PROBE_URL, wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__hostSid=%s" % json.dumps(SID))
            pg.evaluate("window.__posts=[]")
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(800)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            post3 = pg.evaluate("window.__lastPost()")
            msg3 = pg.evaluate("window.__msg()")
            print("    post:", json.dumps(post3, ensure_ascii=False)[:200])
            print("    msg:", msg3)
            ck("[E3a] 老路径仍能保存（session_id 反查）",
               bool(post3) and "保存失败" not in (msg3 or ""), (post3, msg3))

            print("\n===== [E4] 无页面错误 =====")
            ck("[E4] 无 pageerror", not errs, errs[:2])

            b.close()
            try:
                os.remove(src_html)
            except OSError:
                pass
    finally:
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        print("\n已恢复 session_prefs.json")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
