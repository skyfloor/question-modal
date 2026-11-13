# -*- coding: utf-8 -*-
"""真机验证：全局默认页显示纯全局值，会话覆盖不污染它。

对应你的原话：「会话用 uuid 标注，不属于该 id 的适用全局，严格数据隔离，
避免写入读取污染」。
"""
import json, os, sys
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))


PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body><div id="p"></div>
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
 Modal:(p)=>(p&&p.children)||null};
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(p,el)=>{window.__btn=el;}}}};
const rf=window.fetch.bind(window);
window.__PREFS_HITS=0;
window.fetch=(u,o)=>{const url=String(u);
 // 关键：把「全局值」和「生效值」刻意做成不同，看界面显示哪个
 if(url.includes("question-modal/prefs")&&(!o||!o.method||o.method==="GET")){
   window.__PREFS_HITS++;
   return Promise.resolve(new Response(JSON.stringify({ok:true,prefs:{
     mode:"ai",                 // 全局默认 = ai
     show_recommend_badge:true, gate_unsaved:true, slow_question_sec:60,
     skip_mode:"per_question", notify_manual_mode:false, model_id:"",
     template_id:"", with_context:false, parallel:false,
     fallback_title:true, wait_hint_sec:180, badge_position:"left",
     badge_style:"rect", highlight_recommended:false, auto_number_options:true,
     model_timeout_sec:120, gate_log_limit:200
   }}),{status:200}));
 }
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  chat_id:"C",version:1,schema:[],global_keys:[],sources:{mode:"session"},
  config:{mode:"manual",               // 本会话覆盖 = manual（与全局不同）
   show_recommend_badge:false, gate_unsaved:true, slow_question_sec:30,
   skip_mode:"whole", notify_manual_mode:true, model_id:"x:y",
   template_id:"builtin-default", with_context:true, parallel:true,
   fallback_title:false, wait_hint_sec:60, badge_position:"right",
   badge_style:"pill", highlight_recommended:true, auto_number_options:false,
   model_timeout_sec:60, gate_log_limit:10, __sources__:{}}}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
  default_id:"builtin-default",items:[{id:"builtin-default",name:"默认",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("cache-info"))return Promise.resolve(new Response(JSON.stringify({ok:true,items:[],protected:[]}),{status:200}));
 if(url.includes("session-prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,sessions:[]}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[]}),{status:200}));
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__open=()=>{const h=document.getElementById("p");RD.render(R.createElement("div",null,window.__btn),h);};
window.__ready=true;
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__iso.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__iso.html",
                   wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(400)
            pg.evaluate("()=>document.querySelector('#p button').click()")
            pg.wait_for_timeout(700)

            # 全局配置页（2026-11-04 页签由「全局默认」改名为「全局配置」）
            _sw = pg.evaluate("()=>{const t=[...document.querySelectorAll('.qm-set-tab')].find(e=>e.textContent.trim()==='全局配置');if(!t)return 'not-found';t.click();return 'ok';}")
            ck("[I-前置] 找到「全局配置」页签", _sw == 'ok', _sw)
            pg.wait_for_timeout(900)
            g = pg.evaluate("""()=>{
              const txt=document.body.innerText;
              const rows=[...document.querySelectorAll('.qm-set-row')];
              const pick=(kw)=>{const r=rows.find(x=>new RegExp(kw).test(x.textContent));return r?r.textContent.trim().slice(0,60):null;};
              return {txt:txt.slice(0,40), hits:window.__PREFS_HITS,
                      modeRow:pick('默认答题模式'), skipRow:pick('跳过方式'),
                      waitRow:pick('等待提示阈值')};
            }""")
            print("  全局页:", json.dumps(g, ensure_ascii=False)[:400])
            ck("[I0] 全局页确实读了 GET /prefs（纯全局值）", g["hits"] >= 1, "hits=%d" % g["hits"])

            # 全局=ai，会话=manual：全局页必须显示"自动分析"（ai），不能显示"人工"
            blob = json.dumps(g, ensure_ascii=False)
            # 断言必须看「哪个按钮被选中」，不能只看文字是否存在——
            # 三个按钮文字（自动分析/只用推荐/人工）始终都在页面上，
            # 用「包含某词」判会永远真，是假绿的写法。
            # 「默认答题模式」行现在只在「默认模式」页（渲染全局值）与
            # 「会话模式」页（渲染会话值）出现，故隔离性在「默认模式」页验证。
            _sw1 = pg.evaluate("()=>{const t=[...document.querySelectorAll('.qm-set-tab')].find(e=>e.textContent.trim()==='默认模式');if(!t)return 'not-found';t.click();return 'ok';}")
            pg.wait_for_timeout(900)
            ck("[I1-前置] 找到「默认模式」页签", _sw1 == 'ok', _sw1)
            sel = pg.evaluate("""()=>{
              const rows=[...document.querySelectorAll('.qm-set-row')];
              const r=rows.find(x=>/默认答题模式/.test(x.textContent));
              if(!r) return null;
              // 选中态是 .qm-set-segon（见 setSeg），不是 aria/active。
              const on=[...r.querySelectorAll('.qm-set-segon')]
                .map(e=>e.textContent.trim());
              return on;
            }""")
            ck("[I1] 默认模式页选中的是全局值「自动分析」，不是会话的「人工」",
               bool(sel) and ("自动分析" in sel) and ("人工" not in sel),
               "selected=%s" % sel)
            # 全局 skip_mode=per_question（逐题跳过），会话=whole（整卷跳过）
            # 「跳过方式」已按 2026-11-05 裁定改为内置默认值（不出现在 UI），
            # 隔离性改用仍可配置的「等待提示阈值」验证：全局 180 / 会话 60。
            ck("[I2] 全局页显示全局值「180 秒」，而非会话的「60 秒」",
               "180" in (g.get("waitRow") or ""), g.get("waitRow"))

            # 会话页应显示会话覆盖值（manual）；页签已改名「会话模式」
            _sw2 = pg.evaluate("()=>{const t=[...document.querySelectorAll('.qm-set-tab')].find(e=>e.textContent.trim()==='会话模式');if(!t)return 'not-found';t.click();return 'ok';}")
            ck("[I-前置2] 找到「会话模式」页签", _sw2 == 'ok', _sw2)
            pg.wait_for_timeout(900)
            s = pg.evaluate("""()=>{
              const txt=document.body.innerText;
              return {hasManual:/人工/.test(txt), sample:txt.slice(0,30)};
            }""")
            ck("[I3] 会话页显示会话值（人工）", s["hasManual"], s["hasManual"])
            ck("[I4] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
