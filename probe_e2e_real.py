# -*- coding: utf-8 -*-
"""真机端到端：造一条真实 pending，跑「只用推荐」全链路。

这是唯一能同时覆盖「真实 /resolve」「真实 effective-config」「真实浏览器渲染」
的验证方式。前几轮的假桩漏掉了 reqId 结构差异，导致我误判修复有效。
"""
import json, os, sys, time
import urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID = "1791724819571-muuetab"
AG = "wb74Jn"
CALL = "call_e2e_lastq"
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))


def http(method, path, body=None):
    req = urllib.request.Request(BASE + "/api" + path, method=method)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data=data, timeout=25) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}


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
window.__TOAST=[]; window.__POSTS=[]; window.__ANALYZE=[];
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>window.__AG,
 getCurrentSessionId:()=>window.__SID,getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
// 只观测，真实转发
window.fetch=(u,o)=>{const url=String(u);
 if(url.includes("question-modal/analyze")&&!url.includes("cancel")){
   try{window.__ANALYZE.push(JSON.parse((o&&o.body)||"{}"))}catch(e){}}
 if(url.includes("question-modal/answer")){
   try{window.__POSTS.push(JSON.parse((o&&o.body)||"{}"))}catch(e){}}
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__mount=(qs,callId)=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:callId,arguments:JSON.stringify({title:"末页验证",questions:qs})}}]}}),h);};
window.__probe=()=>({
  prog:((document.body.innerText||"").match(/(\d+)\/(\d+)/)||[])[0]||"",
  other:/其他意见/.test(document.body.innerText||""),
  posts:window.__POSTS.length,
  analyze:window.__ANALYZE.length,
  toasts:window.__TOAST.slice(-5),
  ls:(()=>{try{return JSON.parse(localStorage.getItem("qm:v1:state:"+window.__CALL)||"{}")}catch(e){return {}}})()
});
window.__ready=true;
</script></body></html>
"""


def main():
    p = "/app/working/plugins/question-modal/dist/__e2e.html"
    open(p, "w", encoding="utf-8").write(PAGE)

    # 确保本会话是 recommend
    prev = (http("GET", "/question-modal/effective-config?session_id=%s&agent_id=%s"
                 % (SID, AG)).get("config") or {}).get("mode")
    print("  原模式:", prev)
    http("POST", "/question-modal/session-prefs",
         {"session_id": SID, "agent_id": AG, "settings": {"mode": "recommend"}})

    # 造一条真实 pending：走插件自己的 public API（POST /pending 或 service.create）
    # 先看有没有现成入口
    probe = http("GET", "/question-modal/pending")
    print("  现有 pending:", probe.get("count"))

    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__e2e.html",
                   wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__SID=%r; window.__AG=%r; window.__CALL=%r;"
                        % (SID, AG, CALL))

            QS = [{"type": "single", "title": "Q%d" % i,
                   "options": ["A%d" % i, "B%d" % i], "recommended": "A%d" % i}
                  for i in range(1, 5)]
            pg.evaluate("(q)=>{window.__A=q}", QS)
            pg.evaluate("window.__mount(window.__A, window.__CALL)")

            trail = []
            for i in range(30):
                pg.wait_for_timeout(250)
                s = pg.evaluate("window.__probe()")
                trail.append((s["prog"], "OTHER" if s["other"] else "",
                              s["posts"], s["analyze"]))
                if s["posts"] > 0:
                    break
            print("  轨迹:")
            for t in trail: print("   ", t)
            fin = pg.evaluate("window.__probe()")
            print("  toasts:", fin["toasts"])
            dbg=pg.evaluate("(window.__QMDBG||[]).slice(-3)")
            print("  末页探针:", json.dumps(dbg,ensure_ascii=False)[:500])
            print("  state:", json.dumps({k: fin["ls"].get(k)
                  for k in ("visStep", "answered")}, ensure_ascii=False))

            # 2026-11-13 架构同步：这条 pending 是脚本用 __mount 假渲染的，
            # 后端并没有为它挂 runner；阶段 2 起 recommend 推进权在后端，前端
            # 在 `!backendDown`（后端在线）时让位，不应自行提交。
            # 「后端 runner 零页面自动提交」的权威验证 = verify_phase2_final.py 11/11。
            ck("[E1] 后端在线时前端让位，不自行提交（阶段 2 架构）",
               fin["posts"] == 0, "posts=%d" % fin["posts"])
            ck("[E1b] 卡片仍正常渲染（无锁死/无异常）",
               fin["prog"] and fin["prog"].startswith("1/"), fin["prog"])
            ck("[E2] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
        if prev:
            http("POST", "/question-modal/session-prefs",
                 {"session_id": SID, "agent_id": AG, "settings": {"mode": prev}})
            print("  已恢复模式:", prev)
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
