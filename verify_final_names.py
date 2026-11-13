# -*- coding: utf-8 -*-
"""真机验证：页签改名 + 项迁移 + 徽章 + 胶囊直接显示模型（2026-11-04 第四轮）。"""
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

def api(path):
    with urllib.request.urlopen(BASE + "/api" + path, timeout=10) as r:
        return json.loads(r.read().decode() or "{}")

def set_sess(vals):
    payload = {"sessions": {CHAT: vals} if vals else {}, "updated_at": 1}
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, SP)

PAGE = r"""
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="root"></div><div id="card"></div>
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
window.__modalCancel=null;
function FakeModal(p){window.__modalCancel=p&&p.onCancel?p.onCancel:null;return (p&&p.children)||null;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.__card=null;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},
   sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));

const QS=[{type:"single",title:"Q1",options:["甲","乙"]}];
window.__mountCard=()=>{
  const h=document.getElementById("card"); h.innerHTML="";
  RD.render(R.createElement(window.__card,{data:{content:[{type:"data",
    data:{call_id:"call_FN",arguments:JSON.stringify({title:"改名验证",questions:QS})}}]}}),h);
};
window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  RD.render(R.cloneElement(window.__btnNode),h);
  setTimeout(()=>{const b=h.querySelector("button"); if(b){b.click();} },50);
};
window.__state=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const tabs=[...root.querySelectorAll(".qm-set-tab")].map(t=>t.textContent.trim());
  const active=[...root.querySelectorAll(".qm-set-tabon")].map(t=>t.textContent.trim());
  // 2026-11-12：右上角只保留一个「当前运行」状态胶囊（旧的手动作用域选择器已删），
  // 作用域选择入口 = 页签本身。徽章字段现返回该胶囊的文本值。
  const badge=root.querySelector("[data-qm-runtime]");
  const on=badge?(badge.textContent||"").trim():"";
  const picks=root.querySelectorAll("[data-qm-scope-pick]").length;
  const pills=root.querySelectorAll(".qm-set-runtime").length;
  return {tabs,active,badge:on,runtimePills:pills,scopePicks:picks,text:(root.innerText||"")};
};
window.__cardState=()=>{
  const c=document.getElementById("card");
  return {text:(c.innerText||""), html:(c.innerHTML||"").slice(0,300)};
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__fn.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))

            # 有覆盖 → 会话模式页 + 徽章
            set_sess({"mode": "manual"})
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__fn.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__mountCard()")
            pg.wait_for_timeout(1200)
            cs = pg.evaluate("window.__cardState()")
            print("  卡片文本片段:", json.dumps(cs["text"][:120], ensure_ascii=False))

            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            s1 = pg.evaluate("window.__state()")
            print("  页签:", json.dumps(s1["tabs"], ensure_ascii=False))
            print("  激活:", json.dumps(s1["active"], ensure_ascii=False))
            print("  徽章:", json.dumps(s1["badge"], ensure_ascii=False))

            # 2026-11-04 用户裁定删除「诊断」页签 → 现为 4 页签。
            ck("[N1] 页签为 会话模式/默认模式/全局配置/提示词",
               s1["tabs"] == ["会话模式", "默认模式", "全局配置", "提示词"],
               json.dumps(s1["tabs"], ensure_ascii=False))
            ck("[N1b] 「诊断」页签已按裁定移除",
               "诊断" not in s1["tabs"], json.dumps(s1["tabs"], ensure_ascii=False))
            ck("[N2] 有覆盖 → 状态胶囊=会话模式", s1["badge"].strip() == "会话模式", s1["badge"])
            ck("[N2b] 右上角只有 1 个运行模式胶囊、无重复选择器",
               s1["runtimePills"] == 1 and s1["scopePicks"] == 0,
               (s1["runtimePills"], s1["scopePicks"]))
            ck("[N3] 有覆盖 → 落「会话模式」页",
               s1["active"] and s1["active"][0] == "会话模式", s1["active"])

            # 切到默认模式页验证 5 项
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='默认模式');
              if(t) t.click();
            }""")
            pg.wait_for_timeout(900)
            s2 = pg.evaluate("window.__state()")
            t2 = s2["text"]
            print("  默认模式页包含项检查")
            # 2026-11-13 新规则：全局 mode=recommend（只用推荐）时隐藏 4 行，
            # 其余两模式（自动分析/人工）全显示。按实时全局值分支断言。
            gmode2 = api("/question-modal/prefs").get("prefs", {}).get("mode", "manual")
            if gmode2 == "recommend":
                ck("[N4] 默认模式页只用推荐 → 仅显示答题模式（隐藏 4 行）",
                   "默认答题模式" in t2 and not any(k in t2 for k in ("默认模型","提示词模板","携带上下文","并行分析各题")),
                   gmode2)
            else:
                ck("[N4] 默认模式页含 5 项（与会话页一致）",
                   all(k in t2 for k in ("默认答题模式","默认模型","提示词模板","携带上下文","并行分析各题")),
                   gmode2)
            ck("[N5] 默认模式页不含迁走的 6 项",
               not any(k in t2 for k in ("显示 AI 推荐标记","未作答时拦截翻页","题级计时提示","跳过方式","人工模式时提醒","单题分析超时")),
               "")

            # 切到全局配置页验证 6 项已迁入
            pg.evaluate("""()=>{
              const t=[...document.querySelectorAll('#qm-settings-root .qm-set-tab')]
                .find(x=>x.textContent.trim()==='全局配置');
              if(t) t.click();
            }""")
            pg.wait_for_timeout(900)
            s3 = pg.evaluate("window.__state()")
            t3 = s3["text"]
            # 2026-11-05 用户裁定：这 4 项属内置默认值，不展示、不提供入口
            # （功能由 verify_builtin_cfg_functions.py 验证仍生效）。
            ck("[N6] 全局配置页含 2 项可配置行为（人工提醒/单题超时）",
               "人工模式时提醒" in t3 and "单题分析超时" in t3, "")
            ck("[N6b] 内置默认值 4 项不出现在 UI（按裁定隐藏）",
               not any(k in t3 for k in ("显示 AI 推荐标记","未作答时拦截翻页","题级计时提示","跳过方式")),
               "")
            # 显示类 5 项同为内置默认值 → 不展示；杂项「等待提示阈值」仍可配。
            ck("[N7] 全局配置页含杂项「等待提示阈值」",
               "等待提示阈值" in t3, "")
            ck("[N7b] 显示类 5 项不出现在 UI（按裁定隐藏）",
               not any(k in t3 for k in ("推荐徽章位置","徽章外观","推荐项底色","选项自动编号","缺题干时显示")),
               "")

            # 无覆盖 → 默认模式页 + 徽章=默认模式
            set_sess({})
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            s4 = pg.evaluate("window.__state()")
            print("  无覆盖徽章:", json.dumps(s4["badge"], ensure_ascii=False), " 激活:", json.dumps(s4["active"], ensure_ascii=False))
            ck("[N8] 无覆盖 → 状态胶囊=默认模式", s4["badge"].strip() == "默认模式", s4["badge"])
            ck("[N9] 无覆盖 → 落「默认模式」页",
               s4["active"] and s4["active"][0] == "默认模式", s4["active"])

            # 卡片胶囊不再显示「跟随当前对话模型」
            pg.evaluate("window.__mountCard()")
            pg.wait_for_timeout(1500)
            cs2 = pg.evaluate("window.__cardState()")
            ck("[N10] 卡片胶囊不显示「跟随当前对话模型」前缀",
               "跟随当前对话模型" not in cs2["text"], cs2["text"][:160])
            # 胶囊应直接显示实际模型名（deepseek）
            has_model = ("deepseek" in cs2["text"].lower())
            ck("[N11] 胶囊直接显示实际模型名", has_model, cs2["text"][:160])

            ck("[B0] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
    set_sess({"mode": "manual"})
    print("  已恢复 {mode: manual}")
    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
