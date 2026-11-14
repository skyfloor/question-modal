# -*- coding: utf-8 -*-
"""真机验证：5 页签结构（2026-11-04 拆页）。

  [T1] 恰好 5 个页签：当前会话/默认配置/全局配置/提示词/诊断
  [T2] 「默认配置」页含作答+分析行为项（mode/model/template/ctx/parallel/超时/拦截…）
  [T3] 「全局配置」页含显示类（徽章位置/外观/底色/编号/缺题干）+ 杂项（等待阈值/拦截记录）
  [T4] 「全局默认」旧页签不再存在
  [T5] 无覆盖 → 自动落在「默认配置」页；有覆盖 → 「当前会话」页
  [T6] 两页都写全局：源码确认 cfgSave scope 判定不变
  [T7] 诊断页不再含 d4/d5（等待阈值/拦截记录已挪到全局配置）
"""
import json, os, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
SP = "/app/working/plugins/question-modal/session_prefs.json"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
HERE = os.path.dirname(os.path.abspath(__file__))

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def set_sess(vals):
    payload = {"sessions": {CHAT: vals} if vals else {}, "updated_at": 1}
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, SP)

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
window.__modalCancel=null;
function FakeModal(p){window.__modalCancel=p&&p.onCancel?p.onCancel:null;return (p&&p.children)||null;}
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
  setTimeout(()=>{const b=h.querySelector("button"); if(b){b.click();window.__lastOpen="clicked";}else window.__lastOpen="no-button";},50);
  return "scheduled";
};
window.__tab=(name)=>{
  const tabs=[...document.querySelectorAll("#qm-settings-root .qm-set-tab")];
  const t=tabs.find(x=>x.textContent.trim()===name);
  if(t){t.click();return "ok";}
  return "not-found:"+tabs.map(x=>x.textContent.trim()).join(",");
};
window.__state=()=>{
  const root=document.getElementById("qm-settings-root")||document.body;
  const tabs=[...root.querySelectorAll(".qm-set-tab")].map(t=>t.textContent.trim());
  const active=[...root.querySelectorAll(".qm-set-tabon")].map(t=>t.textContent.trim());
  return { tabs, active, text:(root.innerText||"") };
};
window.__ready=true;
</script></body></html>
"""

def main():
    p = "/app/working/plugins/question-modal/dist/__tabs.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))

            # ── 场景一：无覆盖 → 默认配置页 ──
            set_sess({})
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__tabs.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            s1 = pg.evaluate("window.__state()")
            print("  页签:", json.dumps(s1["tabs"], ensure_ascii=False))
            print("  激活:", json.dumps(s1["active"], ensure_ascii=False))

            # 2026-11-04 用户裁定删除「诊断」页签 → 现为 4 页签。
            ck("[T1] 恰好 4 页签且顺序正确",
               s1["tabs"] == ["会话模式", "默认模式", "全局配置", "提示词"],
               json.dumps(s1["tabs"], ensure_ascii=False))
            ck("[T4] 旧「全局默认/当前会话/默认配置」页签不存在",
               "全局默认" not in s1["tabs"] and "当前会话" not in s1["tabs"]
               and "默认配置" not in s1["tabs"], s1["tabs"])
            ck("[T5a] 无覆盖 → 自动落「默认模式」页",
               s1["active"] and s1["active"][0] == "默认模式", s1["active"])

            # 默认配置页内容
            t1 = s1["text"]
            # 2026-11-13 新规则：全局 mode=recommend（只用推荐）时隐藏 4 行
            with urllib.request.urlopen(BASE + "/api/question-modal/prefs", timeout=10) as r:
                gmode = json.loads(r.read().decode() or "{}").get("prefs", {}).get("mode", "manual")
            if gmode == "recommend":
                ck("[T2a] 默认模式页只用推荐 → 仅显示答题模式（隐藏 4 行）",
                   "默认答题模式" in t1
                   and not any(k in t1 for k in ("默认模型", "提示词模板", "携带上下文", "并行分析各题")),
                   gmode)
            else:
                ck("[T2a] 默认模式页含 5 项（与会话页一致）",
                   all(k in t1 for k in ("默认答题模式", "默认模型", "提示词模板", "携带上下文", "并行分析各题")),
                   gmode)
            ck("[T2b] 默认模式页【不】含迁走的 6 项",
               not any(k in t1 for k in ("未作答时拦截翻页", "跳过方式", "单题分析超时", "人工模式时提醒", "显示 AI 推荐标记", "题级计时提示")), "")

            # ── 切到全局配置页 ──
            pg.evaluate("window.__tab('全局配置')")
            pg.wait_for_timeout(900)
            s2 = pg.evaluate("window.__state()")
            t2 = s2["text"]
            print("  全局配置页激活:", json.dumps(s2["active"], ensure_ascii=False))
            # 2026-11-05 用户裁定：显示类 5 项属内置默认值，不展示、不提供入口。
            ck("[T3a] 全局配置页【不】含显示类 5 项（按裁定隐藏）",
               not any(k in t2 for k in ("推荐徽章位置", "徽章外观", "推荐项底色", "选项自动编号", "缺题干时显示")), "")
            ck("[T3b] 全局配置页含杂项（等待阈值/拦截记录）",
               "等待提示阈值" in t2 and "拦截记录" in t2, "")
            ck("[T3c] 全局配置页【不】含默认模式页的 5 项",
               "默认答题模式" not in t2 and "默认模型" not in t2, "")
            # 其中 4 项为内置默认值（不展示），行为项仍可配置。
            # 2026-11-14：标签由「人工模式时提醒」升级为「人工模式提醒频道」
            # （布尔开关→单选枚举，见 plugin.py notify_channel）。
            ck("[T3e] 全局配置页含行为项（人工模式提醒频道 / 单题分析超时）",
               "人工模式提醒" in t2 and "单题分析超时" in t2, "")
            ck("[T3f] 内置默认值 4 项不出现在 UI（按裁定隐藏）",
               not any(k in t2 for k in ("显示 AI 推荐标记", "未作答时拦截翻页", "题级计时提示", "跳过方式")), "")
            ck("[T3d] 全局配置页无多余说明文字（已移除）",
               "显示类与杂项的全局设置" not in t2, t2[:160])

            # ── 诊断页：2026-11-04 用户裁定整页删除 ──
            r = pg.evaluate("window.__tab('诊断')")
            ck("[T7] 「诊断」页签已不存在（按裁定删除）", str(r).startswith("not-found"), r)
            ck("[T7b] 缓存清理入口随之消失", "缓存清理" not in t2, t2[-120:])

            # ── 场景二：有覆盖 → 当前会话页 ──
            set_sess({"mode": "manual"})
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2000)
            s4 = pg.evaluate("window.__state()")
            print("  有覆盖激活:", json.dumps(s4["active"], ensure_ascii=False))
            ck("[T5b] 有覆盖 → 自动落「会话模式」页",
               s4["active"] and s4["active"][0] == "会话模式", s4["active"])

            ck("[B0] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    set_sess({"mode": "manual"})
    print("\n  已恢复会话覆盖 {mode: manual}")

    # ── 源码断言：保存目标不变 ──
    with open(os.path.join(HERE, "src/index.tsx"), encoding="utf-8") as f:
        tsx = f.read()
    ck("[T6] TAB_IS_SESSION 判定不变（default/global 都写全局）",
       'const TAB_IS_SESSION = (tab: string): boolean => tab === "session"' in tsx, "")
    ck("[T6b] onTabChange 对 default/global 都拉全局值",
       'if (t === "global" || t === "default") void loadGlobalCfg();' in tsx, "")

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
