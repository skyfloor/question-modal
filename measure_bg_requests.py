# -*- coding: utf-8 -*-
"""真机测量：反代/域名被拦截时，插件的后台请求频率与是否有休止。

用户报障（2026-11-13）：
  「当前插件是否存在频繁在后台持续请求的情况，在域名访问的情况下，因为持续
   请求会导致被拦截，最终无法正常访问，且请求一直报错，之前的版本没有这个问题，
   只有在局域网访问时，才正常」

本测试只做**测量**，不改代码：
  [M1] SSE 通道遇到 502（反代拦截/网关错误）时，10 秒内的请求次数
  [M2] SSE 通道遇到 200 但返回 HTML（反代登录页/WAF 页）时的请求次数
  [M3] SSE 通道遇到 429（限流）时的请求次数
  [M4] resolve 探测遇到持续网络失败时的请求次数
  [M5] 上述任一场景，请求是否会自行停止（这是本次报障的核心）
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def page_for(scenario: str) -> str:
    """给每个场景生成一个页面：所有 question-modal 请求按 scenario 失败。"""
    return r"""
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

window.__SCEN = "__SCEN__";
window.__HITS = [];          // 每次命中 question-modal 端点的时间戳+端点
const rf = window.fetch.bind(window);
window.fetch=(u,o)=>{const url=String(u), meth=(o&&o.method)||"GET";
 const isQM = url.includes("question-modal");
 if(isQM){
   window.__HITS.push({t:Date.now(), ep:url.split("/question-modal/")[1]||"?", m:meth});
   const s = window.__SCEN;
   if(s==="502")  return Promise.resolve(new Response("Bad Gateway",{status:502}));
   if(s==="429")  return Promise.resolve(new Response("Too Many Requests",{status:429}));
   if(s==="html") return Promise.resolve(new Response(
     "<!doctype html><html><body>Access denied by WAF</body></html>",
     {status:200,headers:{"Content-Type":"text/html"}}));
   if(s==="neterr") return Promise.reject(new TypeError("Failed to fetch"));
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

const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mount=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_NET",arguments:JSON.stringify({title:"网络",questions:QS})}}]}}),h);};
window.__ready=true;
</script></body></html>
"""


def run(pw, scenario, wait_ms=12000):
    p = PLUG + "/dist/__net_%s.html" % scenario
    open(p, "w", encoding="utf-8").write(page_for(scenario).replace("__SCEN__", scenario))
    try:
        b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
        pg = b.new_page()
        pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__net_%s.html" % scenario,
                wait_until="load")
        pg.wait_for_function("window.__ready===true", timeout=30000)
        pg.evaluate("window.__HITS=[]")
        pg.evaluate("window.__mount()")
        # 分两段观察，看请求是否还在继续增长
        pg.wait_for_timeout(wait_ms // 2)
        mid = pg.evaluate("window.__HITS.length")
        pg.wait_for_timeout(wait_ms // 2)
        hits = pg.evaluate("window.__HITS")
        b.close()
        return mid, hits
    finally:
        try:
            os.remove(p)
        except Exception:
            pass


def summarize(hits):
    """按端点聚合：次数 + 首末时间间隔 → 等效周期。"""
    agg = {}
    for h in hits:
        ep = h["ep"].split("?")[0]
        agg.setdefault(ep, []).append(h["t"])
    out = {}
    for ep, ts in agg.items():
        span = (max(ts) - min(ts)) / 1000.0
        out[ep] = {"count": len(ts), "span": round(span, 1),
                   "period": round(span / (len(ts) - 1), 1) if len(ts) > 1 else None}
    return out


def main():
    with sync_playwright() as pw:
        for scen, label in (("502", "反代/网关 502"),
                            ("429", "限流 429"),
                            ("html", "200 但返回 HTML（WAF/登录页）"),
                            ("neterr", "网络层直接失败")):
            print("\n===== 场景：%s =====" % label)
            try:
                mid, hits = run(pw, scen)
            except Exception as e:
                print("  测量失败:", e)
                continue
            s = summarize(hits)
            for ep, v in sorted(s.items(), key=lambda kv: -kv[1]["count"]):
                print("  %-24s 次数=%-3d 跨度=%-5ss 等效周期=%ss"
                      % (ep, v["count"], v["span"], v["period"]))
            total = len(hits)
            print("  12 秒内总请求数:", total, "| 前 6 秒:", mid, "| 后 6 秒:", total - mid)

            # 核心判据：后半段还在不在涨（= 有没有自行休止）
            growing = (total - mid) > 0
            ck("[%s] 12s 内请求总量记录到（%d）" % (scen, total), total >= 0, total)
            if growing:
                print("  → 后 6 秒仍有 %d 次请求：**未自行休止，会持续打**" % (total - mid))
            else:
                print("  → 后 6 秒无新增：已自行休止")

    print("\n════════ 结果: %d passed, %d failed ════" % (ok, fail))
    return 0


if __name__ == "__main__":
    sys.exit(main())
