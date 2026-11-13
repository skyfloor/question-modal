"""探针：dump 设置面板四个页签的真实文本，确认 17 项设置是否都还在。

用途：verify_tabs_regroup.py 有 5 项失败，需判定是「用例过期」还是「设置项丢失」。
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
HERE = os.path.dirname(os.path.abspath(__file__))

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
function FakeModal(p){return (p&&p.children)||null;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  const fresh=window.QwenPaw.host.React.cloneElement(window.__btnNode);
  RD.render(fresh,h);
  setTimeout(()=>{const b=h.querySelector("button"); if(b)b.click();},50);
  return "scheduled";
};
window.__tabs=()=>[...document.querySelectorAll("#qm-settings-root .qm-set-tab")].map(t=>t.textContent.trim());
window.__tab=(name)=>{
  const tabs=[...document.querySelectorAll("#qm-settings-root .qm-set-tab")];
  const t=tabs.find(x=>x.textContent.trim()===name);
  if(t){t.click();return "ok";}
  return "not-found";
};
window.__text=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  return root.innerText||"";
};
window.__rows=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  return [...root.querySelectorAll(".qm-set-row")].map(r=>{
    const lbl=r.querySelector(".qm-set-label");
    return (lbl?lbl.textContent.trim():"?").slice(0,40);
  });
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__probe_tabs.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__probe_tabs.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            tabs = pg.evaluate("window.__tabs()")
            print("页签:", json.dumps(tabs, ensure_ascii=False))
            for t in tabs:
                pg.evaluate("window.__tab(%s)" % json.dumps(t))
                pg.wait_for_timeout(800)
                rows = pg.evaluate("window.__rows()")
                print("\n=== [%s] 行数=%d ===" % (t, len(rows)))
                for r in rows:
                    print("   ·", r)
            # 全量设置项关键词探测
            KEYS = {
                "a1 默认答题模式": "答题模式",
                "a2 默认模型": "默认模型",
                "a3 提示词模板": "提示词模板",
                "a4 携带上下文": "携带上下文",
                "a5 并行分析各题": "并行分析",
                "b1 显示 AI 推荐标记": "显示 AI 推荐标记",
                "b2 推荐徽章位置": "推荐徽章位置",
                "b3 徽章外观": "徽章外观",
                "b4 推荐项底色": "推荐项底色",
                "b5 选项自动编号": "选项自动编号",
                "c1 未作答时拦截翻页": "未作答时拦截翻页",
                "c2 跳过方式": "跳过方式",
                "c3 题级计时提示": "题级计时提示",
                "c4 缺题干时显示": "缺题干时显示",
                "c5 人工模式时提醒": "人工模式时提醒",
                "d4 等待提示阈值": "等待提示阈值",
                "d5 拦截记录条数": "拦截记录",
            }
            alltext = ""
            for t in tabs:
                pg.evaluate("window.__tab(%s)" % json.dumps(t))
                pg.wait_for_timeout(600)
                alltext += "\n" + pg.evaluate("window.__text()")
            print("\n=== 设置项关键词全量探测（四页签合并文本）===")
            # 2026-11-05 用户裁定：以下 9 项为内置默认值，功能保留但**不展示 UI**
            # （功能由 verify_builtin_cfg_functions.py 19/19 验证），故它们「缺失」
            # 是正确行为，不能当失败。其余项必须在 UI 可达。
            BUILTIN_HIDDEN = {
                "b1 显示 AI 推荐标记", "b2 推荐徽章位置", "b3 徽章外观",
                "b4 推荐项底色", "b5 选项自动编号", "c1 未作答时拦截翻页",
                "c2 跳过方式", "c3 题级计时提示", "c4 缺题干时显示",
            }
            miss = []
            hidden_ok = []
            for name, kw in KEYS.items():
                hit = kw in alltext
                if name in BUILTIN_HIDDEN:
                    # 反向断言：内置默认项不应出现在 UI
                    print(("  ✗ " if hit else "  ✓ ") + name + ("  <应隐藏却出现>" if hit else "  <按裁定隐藏>"))
                    if hit: miss.append(name)
                    else: hidden_ok.append(name)
                else:
                    print(("  ✓ " if hit else "  ✗ ") + name + ("  <" + kw + ">" if not hit else ""))
                    if not hit: miss.append(name)
            print("\n应展示但缺失项数:", len(miss), miss)
            print("按裁定隐藏的内置项数:", len(hidden_ok), "/", len(BUILTIN_HIDDEN))
            print("JS 异常:", errs[:3])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

if __name__ == "__main__":
    main()
