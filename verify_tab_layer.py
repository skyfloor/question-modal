# -*- coding: utf-8 -*-
"""真机验证：切到默认模式后，会话页签不得显示成全局数据（错层 bug）。

用户报障（2026-11-13 原话）：
  「如果我之前是会话模式页签，已经保存了数据，但是我后面改成了默认模式页签，
   也保存了，当前的模式是默认模式；当我再次切回到会话模式页签，当前会话模式
   页签的数据仍显示为默认模式的数据，点击保存的时候，页签数据会突然刷新变成了
   原来会话模式的数据」

根因：cfgValue(scope="session") 读的是 settingsState.cfg.config（**当前生效值**）。
切到默认模式后 active_scope=default，生效值 = 全局值 → 会话页签显示全局数据；
点保存时 set_scope 一改，生效值变回会话覆盖，于是"突然刷新"。

修法：后端 effective-config 增加 session_config / global_config 两层原始数据，
前端各页签只读自己那层，与 active_scope 彻底解耦。

本测试用「模式」分段按钮的高亮作为可见证据（会比原生 select 更稳定）：
  会话层 mode=ai（自动分析）  /  全局层 mode=manual（人工）
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
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
<div id="host"></div><div id="sethost"></div>
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
 Modal:function(p){return (p&&p.open===false)?null:((p&&p.children)||null);}};
antd.Modal.info=()=>{};
window.Notification=undefined; localStorage.clear();

// ── 后端状态模拟 ────────────────────────────────────────────────
//   active_scope = default  → 生效值 config == 全局值
//   磁盘上会话层仍留着 mode=ai（用户之前在会话模式保存过）
//   全局层已被用户改成 mode=manual
window.__phase = "default";
window.__REQ = [];
const BASE_CFG={notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
 slow_question_sec:60,skip_mode:"per_question",template_id:"",with_context:false,
 parallel:false,fallback_title:true,wait_hint_sec:180,model_id:""};

function effResp(){
  const active = window.__phase;
  const glob = Object.assign({}, BASE_CFG, {mode:"manual"});   // 全局层
  const sess = {mode:"ai"};                                     // 会话层覆盖
  const eff  = active === "default" ? Object.assign({}, glob)
                                    : Object.assign({}, glob, sess);
  return {ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
    config:eff,
    has_session:(active==="session"), active_scope:active,
    session_config:sess, global_config:glob, key_ts:{}};
}

let bodyRef=null;
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u), meth=(o&&o.method)||"GET";
 if(meth!=="GET"){
   let body=null;try{body=JSON.parse((o&&o.body)||"null")}catch(e){body=String((o&&o.body)||"")}
   window.__REQ.push({url,meth,body});
   if(body&&body.set_scope){window.__phase=body.set_scope;}
 }
 if(url.includes("effective-config"))return Promise.resolve(
   new Response(JSON.stringify(effResp()),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:false}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"r"}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[{id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("session-prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,stored:true,active_scope:window.__phase}),{status:200}));
 if(url.includes("question-modal/prefs"))return Promise.resolve(new Response(JSON.stringify({ok:true,prefs:Object.assign({},BASE_CFG,{mode:"manual"})}),{status:200}));
 if(url.includes("cache-info"))return Promise.resolve(new Response(JSON.stringify({ok:true,items:[],protected:[]}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"wd",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[
   {id:"wd",name:"WD",is_active:true,models:["m"],extra_models:[],is_free:false}]}),{status:200}));
 return rf(u,o);};

window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},
  sender:{addPrefix:(id,node)=>{window.__settingsNode=node;}}}};

const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_TL",arguments:JSON.stringify({title:"分层",questions:QS})}}]}}),h);};

window.__openSettings=()=>{
  if(!window.__settingsNode)return false;
  const host=document.getElementById("sethost");
  host.innerHTML="";
  RD.render(window.__settingsNode,host);
  const b=host.querySelector("button");
  if(b){b.click();return true;}
  return false;
};
window.__clickTab=(label)=>{
  const b=[...document.querySelectorAll("button")].find(x=>(x.textContent||"").trim()===label);
  if(b){b.click();return true;}
  return false;
};
// 面板内「模式」三段按钮的选中项 —— 页签数据来源的可见证据
window.__modeOn=()=>{
  const modal=document.querySelector(".qm-tpl-modal")||document.body;
  const btns=[...modal.querySelectorAll(".qm-set-segbtn")];
  const on=btns.filter(b=>/qm-set-segon/.test(b.className||""));
  return on.map(b=>b.textContent.trim());
};
window.__ready=true;
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__tl.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page(viewport={"width": 1500, "height": 1000})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__tl.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mount()")
            pg.wait_for_timeout(1000)

            opened = pg.evaluate("window.__openSettings()")
            pg.wait_for_timeout(1500)
            ck("[T1] 设置面板可打开", opened is True, opened)

            # 打开时 active_scope=default → 初始页签应是「默认模式」
            init_on = pg.evaluate("""()=>{const t=document.querySelector('.qm-set-tabon');
              return t?t.textContent.trim():null;}""")
            print("  初始页签:", init_on)
            ck("[T2] 初始页签 = 默认模式（按后端 active_scope）",
               str(init_on) == "默认模式", init_on)

            init_mode = pg.evaluate("window.__modeOn()")
            print("  默认页签的模式高亮:", init_mode)
            ck("[T3] 默认页签显示全局层值 mode=manual（人工）",
               init_mode == ["人工"], init_mode)

            # ── ★核心：切到会话页签 ──
            pg.evaluate("window.__clickTab('会话模式')")
            pg.wait_for_timeout(1500)

            sess_mode = pg.evaluate("window.__modeOn()")
            print("  会话页签的模式高亮:", sess_mode)
            ck("[T4] ★核心：会话页签显示【自动分析】(ai)，即会话层自己存的值",
               sess_mode == ["自动分析"], sess_mode)
            ck("[T5] 会话页签没有显示成全局层的【人工】",
               sess_mode != ["人工"], sess_mode)

            before = pg.evaluate("window.__modeOn()")

            # ── 点保存 ──
            saved = pg.evaluate("""()=>{
              const b=[...document.querySelectorAll('button')]
                .find(x=>(x.textContent||'').trim()==='保存');
              if(b){b.click();return true;} return false;}""")
            pg.wait_for_timeout(2000)
            after = pg.evaluate("window.__modeOn()")
            print("  保存前:", before, "| 保存后:", after)
            ck("[T6] ★核心：点保存前后页签数据一致（不再突然刷新）",
               before == after, {"before": before, "after": after})
            ck("[T7] 保存请求确实发出", saved is True, saved)

            # ── 切到默认页签，应仍是全局值 ──
            pg.evaluate("window.__clickTab('默认模式')")
            pg.wait_for_timeout(1500)
            glob_mode = pg.evaluate("window.__modeOn()")
            print("  默认页签的模式高亮:", glob_mode)
            ck("[T8] 默认页签显示全局层【人工】", glob_mode == ["人工"], glob_mode)
            ck("[T9] 默认页签未被会话值污染（不是自动分析）",
               glob_mode != ["自动分析"], glob_mode)

            ck("[T10] 全程无页面异常", len(errs) == 0, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except Exception:
            pass

    print("\n════════ 结果: %d passed, %d failed ════" % (ok, fail))
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
