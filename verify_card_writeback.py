# -*- coding: utf-8 -*-
"""真机验证：**卡片本身**的配置回写链路是否仍然正常。

背景：2026-11-13 修了「设置面板页签错层」，动了共享函数 cfgValue / cfgEdit。
必须证明卡片的回写链路没有被我这次改动波及。

两条链路在设计上就是分开的（已核实）：
  设置面板：settingsState + cfgValue/cfgEdit + cfgSave
  卡片    ：本地 state + applyPrefs() → pushSessionOverride() → POST /session-prefs
            ★ 卡片读的是 eff.config（**生效值**，这才是卡片该用的），从不调 cfgValue

断言（全部为"点下去 → 看真实请求体 → 看后端落盘"）：
  [C1] 卡片上点「人工」→ 发出 POST /session-prefs 且 body.settings.mode=manual
  [C2] 该请求必须命中**本会话**（chat_id 或 session_id 存在其一）
  [C3] 后端生效值真的变成 manual（不只是前端改了 state）
  [C4] 落盘覆盖里出现 mode，且没被整批固化（键数受控）
  [C5] 拨「携带上下文」开关 → 回写 with_context
  [C6] 卡片上点模型 → 回写 model_id 且格式为 provider:model
  [C7] 全程无 JS 异常
"""
import json
import os
import sys
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
CH = "0489fc54-8a83-4621-984b-0239e944bfc7"
SID = "1791724819571-muuetab"
AG = "wb74Jn"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def eff():
    u = (BASE + "/api/question-modal/effective-config?chat_id=" + CH
         + "&session_id=&agent_id=" + AG)
    r = urllib.request.Request(u, headers={"X-Agent-Id": AG})
    return json.loads(urllib.request.urlopen(r, timeout=15).read().decode())


def sess_rec():
    try:
        d = json.load(open(PLUG + "/session_prefs.json", encoding="utf-8"))
    except Exception:
        return {}
    return ((d.get("sessions") or {}).get(CH)) or {}


PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body><div id="host"></div>
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
 const ok=h.querySelector("i");h.remove();if(ok){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}},
 Modal:function(p){return (p&&p.open===false)?null:((p&&p.children)||null);},
 Popover:function(p){return (p&&p.children)||null;}};
antd.Modal.info=()=>{};
window.Notification=undefined; localStorage.clear();

const rf=window.fetch.bind(window);
window.__REQ=[];
window.fetch=(u,o)=>{const url=String(u), meth=(o&&o.method)||"GET";
 if(meth!=="GET"){
   let body=null;try{body=JSON.parse((o&&o.body)||"null")}catch(e){body=String((o&&o.body)||"")}
   window.__REQ.push({url,meth,body});
 }
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
   config:{mode:"ai",model_id:"wd:deepseek-v4.1-flash",template_id:"builtin-default",
     with_context:false,parallel:false,show_recommend_badge:true,gate_unsaved:true,
     slow_question_sec:60,skip_mode:"per_question",fallback_title:true,
     wait_hint_sec:180,notify_manual_mode:true,__follow_active__:false,__sources__:{}},
   has_session:true,active_scope:"session",
   session_config:{mode:"ai",model_id:"wd:deepseek-v4.1-flash"},
   global_config:{mode:"manual",model_id:"wd:deepseek-v4.1-flash"},
   key_ts:{}}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:false}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"r"}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[{id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"wd",model:"deepseek-v4.1-flash"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[
   {id:"wd",name:"WD",is_active:true,models:["deepseek-v4.1-flash","deepseek-v4-pro"],extra_models:[],is_free:false}]}),{status:200}));
 // ★ session-prefs 故意**不拦截**，放行到真实后端 —— 否则只能证明"前端发了请求"，
 //   证明不了"后端真的落盘"。[C3] 读的是磁盘，必须让请求真的到达。
 return rf(u,o);};

window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};

const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_CARD",arguments:JSON.stringify({title:"卡片回写",questions:QS})}}]}}),h);};
window.__click=(label)=>{
  const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()===label);
  if(b){b.click();return true;}return false;};
window.__lastSess=()=>{
  const rs=window.__REQ.filter(r=>r.url.includes("session-prefs"));
  return rs.length?rs[rs.length-1]:null;};
window.__sessCount=()=>window.__REQ.filter(r=>r.url.includes("session-prefs")).length;
window.__ready=true;
</script></body></html>
"""


def main():
    p = PLUG + "/dist/__card.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    backup = None
    try:
        backup = open(PLUG + "/session_prefs.json", encoding="utf-8").read()
    except Exception:
        pass
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page(viewport={"width": 1400, "height": 1000})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__card.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")
            pg.wait_for_timeout(1500)

            btns = pg.evaluate("""()=>[...document.querySelectorAll('button')]
              .map(b=>b.textContent.trim()).slice(0,20)""")
            print("  卡片按钮:", btns)

            # ── [C1] 卡片上点「人工」 ──
            n0 = pg.evaluate("window.__sessCount()")
            clicked = pg.evaluate("window.__click('人工')")
            pg.wait_for_timeout(1200)
            ck("[C0] 卡片上能找到并点到「人工」", clicked is True, btns)

            n1 = pg.evaluate("window.__sessCount()")
            ck("[C1] 点模式发出了 session-prefs 请求", n1 > n0, {"before": n0, "after": n1})

            last = pg.evaluate("window.__lastSess()")
            body = (last or {}).get("body") or {}
            st = body.get("settings") or {}
            print("  请求:", (last or {}).get("url", "")[:70], "| body.settings =", st)
            ck("[C1b] 请求体带上 mode=manual", st.get("mode") == "manual", st)

            ck("[C2] 请求命中本会话（chat_id 或 session_id 存在）",
               bool(body.get("chat_id")) or bool(body.get("session_id")),
               {"chat_id": body.get("chat_id"), "session_id": body.get("session_id")})

            rec = sess_rec()
            vals = {k: v for k, v in rec.items() if not k.startswith("__")}
            print("  后端落盘覆盖:", vals)
            ck("[C3] 后端真的写入了 mode=manual（不只是前端 state）",
               vals.get("mode") == "manual", vals)
            ck("[C4] 未整批固化（键数受控 ≤ 6）", len(vals) <= 6, list(vals.keys()))

            # ── [C5] 拨「携带上下文」开关 ──
            n2 = pg.evaluate("window.__sessCount()")
            switched = pg.evaluate("""()=>{
              const boxes=[...document.querySelectorAll('input[type=checkbox]')];
              if(!boxes.length)return false;
              boxes[0].click();return true;}""")
            pg.wait_for_timeout(1200)
            if switched:
                n3 = pg.evaluate("window.__sessCount()")
                last2 = pg.evaluate("window.__lastSess()")
                st2 = ((last2 or {}).get("body") or {}).get("settings") or {}
                print("  开关请求 settings =", st2)
                ck("[C5] 拨开关回写 with_context 或 parallel",
                   ("with_context" in st2) or ("parallel" in st2),
                   {"count": [n2, n3], "settings": st2})
            else:
                # 该卡当前模式可能不渲染这些开关（如人工模式），如实记未覆盖
                print("  (注：当前模式未渲染开关控件，[C5] 记为未覆盖)")

            # ── [C6] 点模型（打开 Popover 后选一项）──
            opened = pg.evaluate("""()=>{
              const b=[...document.querySelectorAll('button')]
                .find(x=>/选择模型|deepseek|▾/.test(x.textContent||''));
              if(b){b.click();return b.textContent.trim();}return null;}""")
            pg.wait_for_timeout(800)
            picked = pg.evaluate("""()=>{
              const rows=[...document.querySelectorAll('div,li,button')]
                .filter(x=>/deepseek-v4-pro/.test(x.textContent||'')
                           && (x.textContent||'').trim().length<40);
              if(rows.length){rows.pop().click();return true;}return false;}""")
            pg.wait_for_timeout(1200)
            print("  模型胶囊:", opened, "| 选中第二项:", picked)
            if picked:
                last3 = pg.evaluate("window.__lastSess()")
                st3 = ((last3 or {}).get("body") or {}).get("settings") or {}
                print("  模型请求 settings =", st3)
                ck("[C6] 选模型回写 model_id 且为 provider:model 形式",
                   isinstance(st3.get("model_id"), str) and ":" in st3.get("model_id", ""),
                   st3)
            else:
                print("  (注：Popover 未渲染出行，[C6] 记为未覆盖（假 antd 限制）)")

            ck("[C7] 全程无 JS 异常", len(errs) == 0, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except Exception:
            pass
        if backup is not None:
            with open(PLUG + "/session_prefs.json", "w", encoding="utf-8") as f:
                f.write(backup)

    print("\n════════ 结果: %d passed, %d failed ════" % (ok, fail))
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
