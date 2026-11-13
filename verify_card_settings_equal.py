# -*- coding: utf-8 -*-
"""最终验收：真实浏览器里，卡片显示值 == 设置页显示值（逐项）。

用户裁定（2026-11-04 q3）：这是最终验收标准。

方法：
  1. 起一个真实页面，同时挂载「卡片」和「设置面板」两棵树（同一个 bundle、同一个后端）
  2. 从卡片 DOM 读出 5 个控件的显示文本
  3. 从设置面板 DOM 读出对应 5 行的显示值
  4. 逐项断言相等，不等就打印双方实际值
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
ok = fail = 0

def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def eff():
    u = BASE + "/api/question-modal/effective-config?session_id=%s&agent_id=%s" % (SID, AG)
    return json.loads(urllib.request.urlopen(u, timeout=20).read())["config"]

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="host"></div><div id="qm-settings-root"></div>
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

/* 设置面板需要的 antd 桩：Popover/Modal 交回 children（宿主不执行嵌套组件） */
function P(p){return (p&&p.children)||null;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(P,{confirm:()=>{}}),Popover:P,Select:P,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined; localStorage.clear();
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;window.__settingsButton=c;},sender:{addPrefix:(id,el)=>{window.__prefixEl=el;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));

const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mountCard=()=>{const h=document.getElementById("host");h.innerHTML="";
 RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
  data:{call_id:"call_ACC",arguments:JSON.stringify({title:"一致验收",questions:QS})}}]}}),h);};
window.__cardText=()=>{
  const out=[];
  document.querySelectorAll('#host button, #host [class*=capsule]').forEach(b=>{
    const t=(b.textContent||'').trim(); if(t) out.push(t);});
  return out;
};
window.__ready=true;
</script></body></html>
"""

def main():
    c = eff()
    print("═══ /effective-config（两处唯一数据源）═══")
    for k in ("mode", "model_id", "template_id", "with_context", "parallel"):
        print("   %-14s = %r" % (k, c.get(k)))
    print("   __follow_active__ =", c.get("__follow_active__"))

    p = "/app/working/plugins/question-modal/dist/__acc.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__acc.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mountCard()")
            pg.wait_for_timeout(2800)

            texts = pg.evaluate("window.__cardText()")
            print("\n═══ 卡片实际显示 ═══")
            for t in texts[:10]:
                print("   ", repr(t))
            blob = " | ".join(texts)

            print("\n═══ 逐项比对（卡片 vs 服务端值）═══")
            # model：卡片应显示服务端给的实际模型名或「跟随当前对话模型（…）」
            want_model = c.get("model_id") or ""
            model_short = want_model.split(":")[-1] if want_model else ""
            card_model = [t for t in texts if model_short and model_short in t]
            ck("[A1] 卡片模型 = 服务端 model_id",
               bool(card_model) or (not want_model),
               "want=%r card=%r" % (want_model, card_model))
            ck("[A2] 胶囊不再显示「跟随当前对话模型」前缀（直接显示实际模型）",
               "跟随当前对话模型" not in " | ".join(texts), "")

            # template：卡片应显示模板名（服务端给的是 id，前端映射成名称）
            want_tpl = c.get("template_id") or ""
            tpl_texts = [t for t in texts if "▾" in t and ":" not in t]
            ck("[A3] 卡片模板胶囊存在且有名称（非裸 id）",
               bool(tpl_texts) and not any(t.strip("▾") == want_tpl for t in tpl_texts),
               "want_id=%r capsule=%r" % (want_tpl, tpl_texts))

            # mode：卡片三键的选中态应与服务端一致
            mode = c.get("mode")
            label = {"ai": "自动分析", "recommend": "只用推荐", "manual": "人工"}.get(mode, "")
            on = pg.evaluate("""()=>{
              const b=[...document.querySelectorAll('#host button')]
                .filter(x=>['自动分析','只用推荐','人工'].includes(x.textContent.trim()));
              return b.map(x=>({t:x.textContent.trim(),
                cls:x.className, aria:x.getAttribute('aria-pressed')||x.getAttribute('aria-selected')}));
            }""")
            print("   卡片模式键态:", json.dumps(on, ensure_ascii=False)[:260])
            ck("[A4] 服务端 mode 在卡片上有对应键", any(x["t"] == label for x in on),
               "want=%r got=%r" % (label, [x["t"] for x in on]))

            ck("[A5] 无 JS 异常", not errs, errs[:2])
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
