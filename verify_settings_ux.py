# -*- coding: utf-8 -*-
"""设置面板 5 项 UX 需求的真机验证（2026-11-12 用户报告）。
1 保存按钮始终可点  2 默认页可选人工(保存生效)  3 页签高亮=背景色
4 无分组小标题      5 人工模式提醒 note 单行
会写全局 prefs，测后恢复。"""
import json, sys, urllib.request
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
ok_all = True

def check(name, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("  ✓ " if cond else "  ✗ ") + name + ((" | " + str(extra)) if extra else ""))

def api(path, method="GET", body=None):
    req = urllib.request.Request(BASE + "/api" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw.strip() else {}

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
  RD.render(window.__btnNode, h);
  setTimeout(()=>{const btn=h.querySelector("button"); if(btn)btn.click();},50);
  return "scheduled";
};
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__pickScope=(c)=>{
  const label=c==="session"?"会话模式":"默认模式";
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(t){t.click();return "picked-tab:"+label;} return "no-tab";
};
window.__pickTab=(label)=>{
  const tabs=[...root().querySelectorAll(".qm-set-tab")];
  const t=tabs.find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label+" have:"+tabs.map(x=>(x.textContent||"").trim()).join("|");
  t.click(); return "picked-tab:"+label;
};
window.__modeRow=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return null;
  return [...row.querySelectorAll(".qm-set-segbtn")].map(b=>({
    label:(b.textContent||"").trim(), on:/qm-set-segon/.test(b.className)}));
};
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  const btn=row&&[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn";
  btn.click(); return "clicked";
};
window.__saveState=()=>{
  const save=root().querySelector("[data-qm-save]");
  const cancel=root().querySelector("[data-qm-cancel]");
  const txt=root().innerText||"";
  return { saveDisabled: save?save.disabled:null,
    cancelDisabled: cancel?cancel.disabled:null,
    dirtyHint: (txt.match(/有 \d+ 项未保存/)||[""])[0],
    saveMsg: (txt.match(/已保存[^\n]*|保存失败[^\n]*/)||[""])[0] };
};
window.__clickSave=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-btn"; b.click(); return "clicked"; };
window.__sections=()=>root().querySelectorAll(".qm-set-section").length;
window.__tabOnStyle=()=>{
  const t=root().querySelector(".qm-set-tabon");
  if(!t) return null;
  const cs=getComputedStyle(t);
  return { bg: cs.backgroundColor, color: cs.color, fw: cs.fontWeight,
    bb: cs.borderBottomColor, br: cs.borderBottomLeftRadius, text:(t.textContent||"").trim() };
};
window.__noteLine=()=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  // 2026-11-14：该行标签已由「人工模式时提醒」（布尔开关）升级为
  // 「人工模式提醒频道」（单选枚举，见 plugin.py SETTINGS_SCHEMA.notify_channel）。
  // 旧用例仍查旧文案 → 找不到行 → 恒返回 null → 本项恒失败。
  // 改为按**新旧两种文案**匹配，避免下次再改标签时又假失败。
  const row=rows.find(r=>{
    const t=r.innerText||"";
    return t.includes("人工模式提醒") || t.includes("人工模式时提醒");
  });
  if(!row) return null;
  const note=row.querySelector(".qm-set-rownote")||row;
  const cs=getComputedStyle(note);
  return { h: note.clientHeight, sh: note.scrollHeight, ws: cs.whiteSpace,
    text:(note.innerText||"").slice(0,60) };
};
// 提示词页全部说明文字（用于对齐用户 HTML 稿）
window.__promptText=()=>{
  const r=root();
  return {
    full:(r.innerText||""),
    notes:[...r.querySelectorAll(".qm-set-rownote")].map(x=>(x.textContent||"").trim()),
    hasOldHint:(r.innerText||"").includes("内置与自定义提示词模板"),
  };
};
// 2026-11-13 四项改动专用探针
window.__rows=()=>[...root().querySelectorAll(".qm-set-row")].map(r=>({
  label:(r.querySelector(".qm-set-rowtitle")||{}).textContent||"",
  note:(r.querySelector(".qm-set-rownote")||{}).textContent||""}));
window.__runtimeState=()=>{
  // 2026-11-13 用户裁定：胶囊改为**纯展示、不可点**（切换靠下方页签）。
  const el=root().querySelector("[data-qm-runtime]");
  const tab=[...root().querySelectorAll(".qm-set-tabon")].map(t=>(t.textContent||"").trim());
  return { label:el?(el.textContent||"").trim():"", value:el?el.getAttribute("data-qm-runtime"):"",
    // 仍可点击的旧探针：现在应为 false（胶囊不再是 button、无 toggle 锚点）
    clickable:!!root().querySelector("[data-qm-runtime-toggle]"),
    isButton: el ? (el.tagName||"").toLowerCase() === "button" : false,
    tab:tab[0]||"",
    target:(root().querySelector(".qm-set-scopetarget")||{}).textContent||"" };
};
window.__toggleRuntime=()=>{
  const el=root().querySelector("[data-qm-runtime-toggle]");
  if(!el)return "no-btn"; el.click(); return "clicked";
};
window.__clickRuntime=()=>{
  const el=root().querySelector("[data-qm-runtime]");
  if(!el)return "no-el"; el.click(); return "clicked";
};
window.__ready=true;
</script></body></html>
"""

def main():
    orig = api("/question-modal/prefs").get("prefs", {})
    print("原全局 mode =", repr(orig.get("mode")))
    p = "/app/working/plugins/question-modal/dist/__verify_ux.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__verify_ux.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            # 清掉「记住的作用域选择」，保证初始页签只由 has_session 决定（测试间不互相污染）
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2200)

            print("== [1] 初始页签：无修改时保存可点 ==")
            st = pg.evaluate("window.__saveState()")
            print("  初始状态:", json.dumps(st, ensure_ascii=False))
            check("无修改时保存按钮不禁用", st["saveDisabled"] is False, st)
            pg.evaluate("window.__clickSave()")
            pg.wait_for_timeout(1500)
            st2 = pg.evaluate("window.__saveState()")
            check("空改动保存成功提示", "已保存" in st2["saveMsg"], st2["saveMsg"])

            print("== [4] 分组小标题已移除 ==")
            check(".qm-set-section 数量 = 0", pg.evaluate("window.__sections()") == 0)

            print("== [3] 页签选中高亮 = 背景色 ==")
            ts = pg.evaluate("window.__tabOnStyle()")
            print("  tabon:", json.dumps(ts, ensure_ascii=False))
            check("选中页签背景为蓝色块", ts and "59, 130, 246" in ts["bg"], ts and ts["bg"])
            check("选中页签=胶囊圆角(20px)", ts and ts["br"] == "20px", ts and ts["br"])

            print("== [5] 人工模式提醒 note 单行（全局配置页） ==")
            print("  ", pg.evaluate("window.__pickTab('全局配置')"))
            pg.wait_for_timeout(1500)  # 等 loadGlobalCfg
            nl = pg.evaluate("window.__noteLine()")
            print("  note:", json.dumps(nl, ensure_ascii=False))
            check("note 高度单行", nl and nl["h"] <= 20 and nl["sh"] <= 20, nl and (nl["h"], nl["sh"]))

            print("== [5b] 提示词页文字说明对齐用户 HTML 稿 ==")
            print("  ", pg.evaluate("window.__pickTab('提示词')"))
            pg.wait_for_timeout(900)
            pt = pg.evaluate("window.__promptText()")
            # 参考稿 pane-prompt 只有这一行说明；旧的顶部 hint「内置与自定义提示词模板」已删
            check("提示词页不再有顶部说明行", not pt["hasOldHint"], pt["hasOldHint"])
            check("提示词页含参考稿原文「模板库共享范围」",
                  "模板库共享范围" in pt["full"], pt["full"][:120])
            check("提示词页含参考稿原文说明「模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立」",
                  any("模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立" in n for n in pt["notes"]),
                  pt["notes"])
            check("提示词页含参考稿原文「所有会话共用同一套模板」",
                  "所有会话共用同一套模板" in pt["full"], pt["full"][:160])

            print("== [2] 默认模式页可选人工并保存生效 ==")
            print("  ", pg.evaluate("window.__pickTab('默认模式')"))
            pg.wait_for_timeout(1500)
            mr = pg.evaluate("window.__modeRow()")
            print("  默认页 mode 行:", json.dumps(mr, ensure_ascii=False))
            on_labels = [b["label"] for b in (mr or []) if b["on"]]
            # 期望值动态取当前全局 mode（测试间全局值可能被其他用例改动），
            # 断言语义 = 默认页显示的是全局配置值，而非会话覆盖值。
            gmode = api("/question-modal/prefs").get("prefs", {}).get("mode", "manual")
            glabel = {"ai": "自动分析", "recommend": "只用推荐", "manual": "人工"}.get(gmode, gmode)
            check("默认页显示全局值(" + glabel + ")", on_labels == [glabel], on_labels)
            # dirty = 与基准的差异。若全局本来就是「人工」，再点「人工」不会
            # 产生任何改动，「1 项未保存」就永远不出现（假失败）。
            # 先把全局置成非人工，保证下面这次点击是一次真实改动。
            if glabel == "人工":
                api("/question-modal/prefs", method="POST", body={"mode": "ai"})
                pg.reload(wait_until="load")
                pg.wait_for_function("window.__ready===true", timeout=30000)
                pg.evaluate("window.__open()")
                pg.wait_for_timeout(2000)
                pg.evaluate("window.__pickTab('默认模式')")
                pg.wait_for_timeout(1200)
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(400)
            mr2 = pg.evaluate("window.__modeRow()")
            on2 = [b["label"] for b in (mr2 or []) if b["on"]]
            check("点人工后高亮移动到人工", on2 == ["人工"], on2)
            st3 = pg.evaluate("window.__saveState()")
            check("改动后保存可点且有未保存提示", st3["saveDisabled"] is False and "1 项未保存" in st3["dirtyHint"], st3)
            pg.evaluate("window.__clickSave()")
            pg.wait_for_timeout(1500)
            now = api("/question-modal/prefs").get("prefs", {})
            check("保存后全局 mode=manual", now.get("mode") == "manual", now.get("mode"))

            # ═══ 2026-11-13 四项改动专项验证 ═══
            print("\n== [6] 条件显隐 + 提示语 + 胶囊可切换 ==")
            # 第 1 项：只用推荐 → 隐藏 4 行；自动分析/人工 → 显示 4 行（默认模式页）
            labels_of = lambda rows: [x["label"] for x in rows]
            HID = ["默认模型", "提示词模板", "携带上下文", "并行分析各题"]
            pg.evaluate("window.__pickMode('只用推荐')")
            pg.wait_for_timeout(500)
            rows_rec = labels_of(pg.evaluate("window.__rows()"))
            check("[6a] 只用推荐 → 4 行全部隐藏", not any(h in rows_rec for h in HID), rows_rec)
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(500)
            rows_man = labels_of(pg.evaluate("window.__rows()"))
            check("[6b] 人工 → 4 行全部显示", all(h in rows_man for h in HID), rows_man)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(500)
            rows_ai = pg.evaluate("window.__rows()")
            check("[6c] 自动分析 → 4 行全部显示", all(h in labels_of(rows_ai) for h in HID), labels_of(rows_ai))
            # 第 2 项：并行分析提示语
            par = [x for x in rows_ai if "并行分析各题" in x["label"]]
            check("[6d] 并行分析提示语=逐题并发调用模型，更快，但更耗额度。",
                  par and par[0]["note"] == "逐题并发调用模型，更快，但更耗额度。", par)
            # 第 3 项：默认模式页说明统一会话页原文、不含「可被会话覆盖」
            check("[6e] 默认模式页说明不含「（可被会话覆盖）」",
                  not any("可被会话覆盖" in x["note"] for x in rows_ai), rows_ai)
            check("[6f] 默认模型说明=自动读取当前对话模型；改动即自动切换",
                  any("自动读取当前对话模型；改动即自动切换" in x["note"] for x in rows_ai), "")
            # 会话模式页同样三条规则
            pg.evaluate("window.__pickTab('会话模式')")
            pg.wait_for_timeout(1200)
            check("[6g] 会话模式页也统一「逐题并发调用模型，更快，但更耗额度。」",
                  any(x["note"] == "逐题并发调用模型，更快，但更耗额度。" for x in pg.evaluate("window.__rows()")), "")
            # 第 4 项：右上角胶囊 = **纯展示**（2026-11-13 用户裁定，
            # 去掉主动切换；切换作用域完全靠下方页签）
            rt0 = pg.evaluate("window.__runtimeState()")
            check("[6h] 右上角只剩 1 个胶囊且不可点击",
                  rt0["clickable"] is False, rt0)
            check("[6i] 胶囊不是 button 元素", rt0["isButton"] is False, rt0)
            check("[6i2] 胶囊文字只显示「会话模式」/「默认模式」（无前缀）",
                  rt0["label"] in ("会话模式", "默认模式"), rt0)
            check("[6i3] 胶囊值合法", rt0["value"] in ("session", "default"), rt0)
            # 点它不应有任何反应（不能再切换页签）
            pg.evaluate("window.__clickRuntime()")
            pg.wait_for_timeout(900)
            rt1 = pg.evaluate("window.__runtimeState()")
            check("[6j] 点击胶囊不切换运行模式", rt0["value"] == rt1["value"],
                  (rt0["value"], rt1["value"]))
            check("[6k] 点击胶囊不改变页签", rt0["tab"] == rt1["tab"], (rt0["tab"], rt1["tab"]))
            # 2026-11-13：文案在更早一轮已按用户裁定去歧义
            #   「保存到本会话（只覆盖你改过的项，不改全局）」
            #   「保存为全局默认（对未设会话的会话生效）」
            # 原断言还按旧文案找「会话模式 / 全局默认」，属过期断言（非本轮回归）。
            check("[6l] 底部保存目标按当前页签走",
                  ("保存到本会话" in rt1["target"]) if rt1["tab"] == "会话模式"
                  else ("保存为全局默认" in rt1["target"]),
                  (rt1["tab"], rt1["target"]))

            print("pageerror:", errs[:3])
            check("无页面错误", not errs, errs[:2])
            # 清掉本测试可能留下的作用域记忆，避免污染后续真机测试
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")
            b.close()
    finally:
        import os
        try: os.remove(p)
        except OSError: pass
        api("/question-modal/prefs", "POST", orig)
        print("已恢复全局 mode =", repr(api("/question-modal/prefs").get("prefs", {}).get("mode")))
    print("RESULT:", "ALL PASS" if ok_all else "HAS FAILURES")

if __name__ == "__main__":
    sys.exit(main())
