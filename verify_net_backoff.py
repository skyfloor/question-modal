# -*- coding: utf-8 -*-
"""真机验证：反代/域名被拦截时，后台轮询必须分档收敛，不得无限快打。

用户报障（2026-11-13 原话）：
  「当前插件是否存在频繁在后台持续请求的情况，在域名访问的情况下，因为持续
   请求会导致被拦截，最终无法正常访问，且请求一直报错，之前的版本没有这个
   问题，只有在局域网访问时，才正常」

已证实的根因（本脚本即守护它）：
  · resolve 探测：前 8 次 700ms → 之后**每 5 秒一次、永不停止**
  · SSE 重连：失败最长 10s 一次、同样无终点；且「200 但返回 HTML」被当成
    流已建立 → 1 秒一次，比 502 更凶
  实测 70s 打 36 次、无休止；外推 1 小时 ≈1100 次 → WAF 升级封禁。

修复后判据（用户裁定方案C）：
  [G1] 连续失败达阈值 → 退避到 60 秒量级（不能还是 5 秒）
  [G2] 「200 + HTML」必须被识别为拦截（不能当成功流反复重连）
  [G3] 长时间（>15 分钟）后彻底停 → 不再产生任何请求
  [G4] 恢复正常后仍能自愈（不能把自愈能力改丢）
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG_DIST = "/app/working/plugins/question-modal/dist"
SERVED = "/api/frontend_plugin/question-modal/files/dist"
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
window.__HITS=[]; window.__MODE="html"; window.__recover=false;
const rf=window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("question-modal")){
   window.__HITS.push({t:Date.now(), ep:(url.split("/question-modal/")[1]||"?").split("?")[0]});
   if(!window.__recover){
     if(window.__MODE==="html") return Promise.resolve(new Response(
       "<!doctype html><html><body>WAF</body></html>",
       {status:200,headers:{"Content-Type":"text/html"}}));
     return Promise.resolve(new Response("Bad Gateway",{status:502}));
   }
   // 恢复模式：让 resolve 正常返回 found，验证自愈
   if(url.includes("/resolve")) return Promise.resolve(new Response(JSON.stringify(
     {ok:true,found:true,request_id:"rid-recover",session_id:"1791724819571-muuetab",
      agent_id:"wb74Jn"}),{status:200}));
 }
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},
   config:{mode:"manual",model_id:"",template_id:"",with_context:false,parallel:false,
     notify_manual_mode:false,show_recommend_badge:true,gate_unsaved:true,
     slow_question_sec:60,skip_mode:"per_question",fallback_title:true,wait_hint_sec:180,
     __sources__:{}},
   has_session:false,active_scope:"default",session_config:{},global_config:{},key_ts:{}}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"wd",model:"x"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[]}),{status:200}));
 return rf(u,o);};
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>"1791724819571-muuetab",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const src=await (await rf("__ENTRY__")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_NG",arguments:JSON.stringify({title:"网络守护",questions:QS})}}]}}),h);};
window.__ready=true;
</script></body></html>
"""


def gaps(hits, ep_prefix):
    ts = [h["t"] for h in hits if h["ep"].startswith(ep_prefix)]
    return [round((ts[i + 1] - ts[i]) / 1000.0, 1) for i in range(len(ts) - 1)]


def main():
    html_name = "__netguard.html"
    open(PLUG_DIST + "/" + html_name, "w", encoding="utf-8").write(
        PAGE.replace("__ENTRY__", SERVED + "/index.js"))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + SERVED + "/" + html_name, wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__HITS=[]")
            pg.evaluate("window.__mount()")

            # ── 观察 145 秒，足以覆盖「快速重试 → 60s 低频」的分档 ──
            pg.wait_for_timeout(145000)
            hits = pg.evaluate("window.__HITS")

            g_res = gaps(hits, "resolve")
            print("  resolve 相邻间隔(秒):", g_res)
            slow_seen = any(g >= 50 for g in g_res)
            ck("[G1] 连续失败后出现 60 秒量级退避（不再是 5 秒心跳）",
               slow_seen, g_res)

            fast_phase = [g for g in g_res if g < 5]
            ck("[G1b] 前段仍有快速重试（保留正常创建竞态的手感）",
               len(fast_phase) >= 3, g_res)

            # ── 「200 + HTML」不能被当成成功流 ──
            g_str = gaps(hits, "survey-stream")
            print("  survey-stream 相邻间隔(秒):", g_str)
            # 旧实现此场景是 1 秒一次（连续 1.0 间隔）；修复后必须拉开
            tight = [g for g in g_str if g <= 1.5]
            ck("[G2] 「200+HTML」未被当成成功流反复重连（无 1 秒级连打）",
               len(tight) <= 1, g_str)

            total = len(hits)
            print("  145 秒总请求数:", total)
            ck("[G1c] 145 秒总请求数显著低于旧实现（旧≈75 次）",
               total <= 35, total)

            # ── 自愈：切回可用后端后必须能恢复（netStopped 唤醒）──
            pg.evaluate("window.__recover=true")
            pg.evaluate("window.__HITS=[]")
            pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
            pg.wait_for_timeout(95000)   # 等一个 60s 周期 + 余量
            hits2 = pg.evaluate("window.__HITS")
            print("  恢复后新请求:", [h["ep"] for h in hits2][:6])
            ck("[G4] 后端恢复后仍能自愈（低频探活或切回唤醒打通）",
               len(hits2) >= 1, len(hits2))

            ck("[G0] 全程无 JS 异常", len(errs) == 0, errs[:2])
            b.close()
    finally:
        try:
            os.remove(PLUG_DIST + "/" + html_name)
        except Exception:
            pass

    print("\n════════ 结果: %d passed, %d failed ════" % (ok, fail))
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
