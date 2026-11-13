# -*- coding: utf-8 -*-
"""真机验证：设置面板右上角「当前运行」状态胶囊 + 页签即作用域选择（2026-11-12 新语义）。

用户 2026-11-12 反馈「右上角的运行模式出现了 2 个」：旧版是
状态胶囊 + 手动作用域选择器并排，视觉重复。参考 HTML 稿头部只有一个
status-pill，故删掉选择器；作用域切换能力由「会话模式 / 默认模式」页签承担。

  [B1] 有会话覆盖时打开 → 状态胶囊=会话模式 + 落在「会话模式」页签
  [B2] 无会话覆盖时打开 → 状态胶囊=默认模式 + 落在「默认模式」页签
  [B3] 手动点「默认模式」页签 → 页签切到默认模式（胶囊仍如实反映覆盖）
  [B3b] 手动点「会话模式」页签 → 同理切回
  [B4] 切到「提示词」页签 → 状态胶囊保持不变（只有点击胶囊才变）
  [B5] 旧徽章文案「分批接入中 / 预览版」不再出现
  [B6] 右上角只有 1 个运行模式胶囊、无重复选择器（本次修复的核心断言）
  [B7] 记住手动选择：点默认模式 → 重开仍默认模式（不被 has_session 弹回）
安全：测试前备份 session_prefs.json 全文、测试后原样恢复；只改动本测试
chat 的键，绝不覆盖其他会话的覆盖（吸取「清理清掉用户真实配置」的教训）。
"""
import json, os, sys
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

def load_all():
    try:
        with open(SP, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def write_all(data):
    tmp = SP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, SP)

def set_chat(vals):
    """只增删本测试 chat 这一条键，保留其他会话的覆盖。"""
    data = load_all()
    sess = data.get("sessions") if isinstance(data.get("sessions"), dict) else {}
    if vals:
        sess[CHAT] = dict(vals)
    else:
        sess.pop(CHAT, None)
    write_all({"sessions": sess, "updated_at": 1})

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
// 假 Modal：交回 children，同时把 onCancel 存到 window 供测试触发
window.__modalCancel=null;
function FakeModal(p){
  window.__modalCancel = p && p.onCancel ? p.onCancel : null;
  return (p&&p.children)||null;
}
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
  const fresh = window.QwenPaw.host.React.cloneElement
    ? window.QwenPaw.host.React.cloneElement(window.__btnNode)
    : window.__btnNode;
  RD.render(fresh, h);
  setTimeout(()=>{
    const btn=h.querySelector("button");
    if(btn){ btn.click(); window.__lastOpen="clicked"; }
    else window.__lastOpen="no-button";
  }, 50);
  return "scheduled";
};
const root=()=>document.getElementById("qm-settings-root")||document.body;
// 点击作用域页签（选择器删除后，页签本身就是作用域选择入口）
window.__pick=(c)=>{
  const label=c==="session"?"会话模式":"默认模式";
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(t){ t.click(); return "picked:"+c; }
  return "no-tab:"+c;
};
window.__tab=(name)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===name);
  if(t){ t.click(); return "tab:"+name; }
  return "no-tab:"+name;
};
// 清掉「记住的作用域选择」，让 [B1]/[B2] 走「首次使用按 has_session 兜底」路径
window.__clearScopeMem=()=>{ localStorage.removeItem("qm:v1:scopeChoice"); return "cleared"; };
window.__scopeMem=()=>localStorage.getItem("qm:v1:scopeChoice");
window.__runtime=()=>{
  const el=root().querySelector("[data-qm-runtime]");
  return el?(el.textContent||"").trim():null;
};
window.__state=()=>{
  const r=root();
  const tabs=[...r.querySelectorAll(".qm-set-tab")];
  const active=tabs.filter(t=>/qm-set-tabon/.test(t.className)).map(t=>t.textContent.trim());
  return {
    active: active,
    runtimePills: r.querySelectorAll(".qm-set-runtime").length,
    scopePicks: r.querySelectorAll("[data-qm-scope-pick]").length,
    hasOld: (r.innerText||"").includes("分批接入中"),
    hasPreview: (r.innerText||"").includes("预览版") };
};
window.__ready=true;
</script></body></html>
"""

def main():
    backup = None
    if os.path.exists(SP):
        with open(SP, encoding="utf-8") as f:
            backup = f.read()
    p = "/app/working/plugins/question-modal/dist/__badge.html"
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"],
                                   executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__badge.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            # ── 场景一：有会话覆盖 → 初始落「会话模式」页签（首次使用，无记忆）──
            set_chat({"mode": "manual"})
            pg.evaluate("window.__clearScopeMem()")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(1800)
            s1 = pg.evaluate("window.__state()")
            print("\n  [场景一·有覆盖]", json.dumps(s1, ensure_ascii=False))
            ck("[B1] 有覆盖 → 落在「会话模式」页签",
               s1["active"] and s1["active"][0] == "会话模式", s1["active"])
            ck("[B5] 旧徽章文案（分批接入中/预览版）已移除",
               not s1["hasOld"] and not s1["hasPreview"], "")
            ck("[B5b] 胶囊=会话模式",
               pg.evaluate("window.__runtime()").strip() == "会话模式",
               pg.evaluate("window.__runtime()"))
            ck("[B6] 右上角只有 1 个运行模式胶囊、无重复选择器",
               s1["runtimePills"] == 1 and s1["scopePicks"] == 0,
               (s1["runtimePills"], s1["scopePicks"]))

            # ── 场景二：手动点「默认模式」页签 → 页签切换 ──
            r2 = pg.evaluate("window.__pick('default')")
            pg.wait_for_timeout(600)
            s2 = pg.evaluate("window.__state()")
            print("  [场景二·手动点默认模式]", r2, json.dumps(s2, ensure_ascii=False))
            ck("[B3] 手动点「默认模式」→ 页签切到默认模式",
               s2["active"] and s2["active"][0] == "默认模式", s2["active"])

            # ── 场景三：再手动点「会话模式」页签 → 切回 ──
            pg.evaluate("window.__pick('session')")
            pg.wait_for_timeout(600)
            s3 = pg.evaluate("window.__state()")
            print("  [场景三·手动点会话模式]", json.dumps(s3, ensure_ascii=False))
            ck("[B3b] 手动点「会话模式」→ 页签切回会话模式",
               s3["active"] and s3["active"][0] == "会话模式", s3["active"])

            # ── 场景四：切到「提示词」页签 → 状态胶囊保持不变 ──
            rt_before = pg.evaluate("window.__runtime()")
            pg.evaluate("window.__tab('提示词')")
            pg.wait_for_timeout(700)
            s4 = pg.evaluate("window.__state()")
            rt_after = pg.evaluate("window.__runtime()")
            print("  [场景四·切提示词页签后]", json.dumps(s4, ensure_ascii=False))
            ck("[B4] 切到提示词页签后运行标注保持不变",
               rt_before.strip() == "会话模式" and rt_before == rt_after, (rt_before, rt_after))
            ck("[B4b] 提示词页仍只有 1 个运行模式胶囊",
               s4["runtimePills"] == 1 and s4["scopePicks"] == 0,
               (s4["runtimePills"], s4["scopePicks"]))

            # ── 场景五：无覆盖 → 初始落「默认模式」页签 ──
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            set_chat({})
            pg.evaluate("window.__clearScopeMem()")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(1800)
            s5 = pg.evaluate("window.__state()")
            print("  [场景五·无覆盖]", json.dumps(s5, ensure_ascii=False))
            ck("[B2] 无覆盖 → 落在「默认模式」页签",
               s5["active"] and s5["active"][0] == "默认模式", s5["active"])
            ck("[B5c] 无覆盖 → 胶囊=默认模式",
               pg.evaluate("window.__runtime()").strip() == "默认模式",
               pg.evaluate("window.__runtime()"))

            # ── 场景六：**不再记住页签**（2026-11-13 用户裁定）──────────
            #
            # 用户要求：胶囊只显示、不可点；每次打开面板按本会话真实状态决定
            # 初始页签（有覆盖→会话，无→默认）。曾实现的「记住手动选择」
            # 写的是全局 localStorage 键，会让会话2 的选择串到会话1，
            # 正是用户报的「会话1 也变成默认模式」，故已彻底移除。
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            set_chat({"mode": "manual"})
            pg.evaluate("window.__clearScopeMem()")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(1800)
            pre6 = pg.evaluate("window.__state()")
            ck("[B6pre] 有覆盖时初始=会话模式",
               pre6["active"] and pre6["active"][0] == "会话模式", pre6["active"])
            # 手动切到默认模式页签（只影响本次编辑，不落任何记忆）
            pg.evaluate("window.__pick('default')")
            pg.wait_for_timeout(500)
            _mem_after = pg.evaluate("window.__scopeMem()")
            # ★ 用户真实路径是「关掉页面/刷新后重新打开设置」，而不是在
            # 面板已打开的情况下再点一次入口。用 reload 复现真实路径。
            pg.reload(wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            s6 = pg.evaluate("window.__state()")
            print("  [场景六·不记忆] mem=", _mem_after, json.dumps(s6, ensure_ascii=False))
            ck("[B7] 页签不记忆：重开后回到「会话模式」（按 has_session 决定）",
               s6["active"] and s6["active"][0] == "会话模式", s6["active"])
            ck("[B7b] 胶囊如实显示「会话模式」（覆盖仍在）",
               pg.evaluate("window.__runtime()").strip() == "会话模式",
               pg.evaluate("window.__runtime()"))
            ck("[B7c] 从未写入 localStorage 记忆", not _mem_after, _mem_after)
            print("    [seq log]", pg.evaluate("window.__qmSeqLog||[]"))

            ck("[B0] 无 JS 异常", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass
        # 恢复备份（原样写回，不臆造恢复值）
        if backup is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(backup)
            print("\n  已原样恢复 session_prefs.json 备份")

    print("\n==== %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
