# -*- coding: utf-8 -*-
"""用真实后端跑「只用推荐」多题问卷，定位「停在末页不自动提交」。

关键差异（上一轮我漏掉的）：
  · 真实后端的 /analyze 会真的调模型 → 慢、可能失败、可能限流
  · 真实后端的 /resolve 需要真实的 pending 记录
  · 真实卡片会真的等 prefsReady 闸门

所以这轮不造假数据：先真的弹一份问卷（由脚本发起 console/chat），
再用浏览器观察它自己怎么走。若无 pending，则退化为「手动造 pending」。
"""
import json, os, sys, time
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
 message:{warning:(t)=>window.__TOAST.push(["w",String(t)]),
          success:(t)=>window.__TOAST.push(["s",String(t)]),
          info:(t)=>window.__TOAST.push(["i",String(t)]),
          error:(t)=>window.__TOAST.push(["e",String(t)])}};
window.__TOAST=[]; window.__ANALYZE=[]; window.__POSTS=[]; window.__RESOLVE=[];
window.Notification=undefined;
localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"wb74Jn",
 getCurrentSessionId:()=>window.__SID,getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
// 只观测，不改写：所有请求原样转发到真实后端
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("question-modal/analyze")&&!url.includes("cancel")){
   try{window.__ANALYZE.push(JSON.parse((o&&o.body)||"{}"))}catch(e){}}
 if(url.includes("question-modal/answer")){
   try{window.__POSTS.push(JSON.parse((o&&o.body)||"{}"))}catch(e){}}
 if(url.includes("question-modal/resolve")){window.__RESOLVE.push(url);}
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__mount=(qs,callId)=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:callId,arguments:JSON.stringify({title:"真机多题",questions:qs})}}]}}),h);};
window.__probe=()=>({
  prog:((document.body.innerText||"").match(/(\d+)\/(\d+)/)||[])[0]||"",
  other:/其他意见/.test(document.body.innerText||""),
  posts:window.__POSTS.length,
  analyze:window.__ANALYZE.length,
  toasts:window.__TOAST.slice(-4),
  resolveCalls:window.__RESOLVE.length,
  ls:(()=>{try{return JSON.parse(localStorage.getItem("qm:v1:state:"+window.__CALL)||"{}")}catch(e){return {}}})()
});
window.__ready=true;
</script></body></html>
"""


def call(method, path, body=None):
    req = urllib.request.Request(BASE + "/api" + path, method=method)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data, timeout=20) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}


def main():
    sid = "1791724819571-muuetab"
    # 先把本会话临时设为「只用推荐」，测完恢复
    before = call("GET", "/question-modal/effective-config?session_id=%s&agent_id=wb74Jn" % sid)
    prev_mode = (before.get("config") or {}).get("mode")
    print("  原模式:", prev_mode)
    call("POST", "/question-modal/session-prefs", {
        "session_id": sid, "agent_id": "wb74Jn",
        "settings": {"mode": "recommend"},
    })

    p = "/app/working/plugins/question-modal/dist/__real.html"
    open(p, "w", encoding="utf-8").write(PAGE)
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__real.html",
                   wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__SID=%r; window.__CALL='call_REAL';" % sid)

            QS = [{"type": "single", "title": "Q%d" % i,
                   "options": ["A%d" % i, "B%d" % i], "recommended": "A%d" % i}
                  for i in range(1, 6)]
            pg.evaluate("(qs)=>{window.__A=qs}", QS)

            # 真后端没有这个 callId 的 pending → 卡片会走 orphan/gone。
            # 所以先手动在服务端造一条 pending 记录（走真实 service，不造假数据）。
            print("  服务端 pending 现状:", call("GET", "/question-modal/pending").get("count"))

            pg.evaluate("window.__mount(window.__A, window.__CALL)")
            trail = []
            for i in range(25):
                pg.wait_for_timeout(250)
                s = pg.evaluate("window.__probe()")
                trail.append((s["prog"], "OTHER" if s["other"] else "", s["posts"],
                              s["analyze"], s["resolveCalls"]))
            print("  轨迹（进度/末页/提交/分析/resolve）:")
            for t in trail[:6]:
                print("   ", t)
            print("   ... 最终:", trail[-1])
            fin = pg.evaluate("window.__probe()")
            print("  toasts:", fin["toasts"])
            print("  state:", json.dumps({k: fin["ls"].get(k)
                  for k in ("visStep", "answered")}, ensure_ascii=False))
            ck("[R1] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
        # 恢复用户原模式
        if prev_mode:
            call("POST", "/question-modal/session-prefs", {
                "session_id": sid, "agent_id": "wb74Jn",
                "settings": {"mode": prev_mode},
            })
            print("  已恢复模式:", prev_mode)
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
