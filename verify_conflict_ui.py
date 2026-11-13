# -*- coding: utf-8 -*-
"""前端验证：需求 2 的「并发覆盖提示」+ 需求 3/4 的「只发改动键」。

用户裁定（2026-11-13）：
  q0 = 同一个键后写胜 + 提示（合并语义不变）
  q1 = 不弹窗，只在页面上标注「设置已于 xx 时间被其它位置修改」
  q2 = 修整批固化 + 并发提示，一次交付

断言（真 Chromium + 真后端）：
  [S1] 会话页保存只发改动键（无整批固化）
  [S2] 请求体带 seen（打开面板时的 key_ts）
  [S3] 正常保存（无他人改动）→ 不显示冲突提示
  [S4] 他人改过同一键后再保存 → 显示「设置已于 … 被其它位置修改」
  [S5] 冲突提示不阻断保存（仍提示「已保存」）
  [S6] 连点两次保存 → 第二次不误报冲突（成功后已同步基线）
  [S7] 无页面错误
"""
import json
import os
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
SP = PLUG + "/session_prefs.json"
GP = PLUG + "/analysis_prefs.json"
AG = "wb74Jn"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"
SID = "1791724819571-muuetab"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def rd(p):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def wr(p, d):
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False)
    os.replace(tmp, p)


def api(path, body=None):
    url = BASE + "/api/question-modal" + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if body is not None else "GET",
        headers={"Content-Type": "application/json", "X-Agent-Id": AG})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or "{}")


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
window.__posts=[];
const _fetch=window.fetch.bind(window);
window.fetch=async(u,o)=>{
  try{const s=String(u);
    if(s.includes("/question-modal/session-prefs")||s.includes("/question-modal/prefs"))
      window.__posts.push({url:s,body:(o&&o.body)||"",method:(o&&o.method)||"GET"});
  }catch(e){}
  return _fetch(u,o);
};
function FakeModal(p){ return (p&&p.children)||null; }
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(FakeModal,{confirm:()=>{}}),Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:()=>{},sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await _fetch("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
const root=()=>document.getElementById("qm-settings-root")||document.body;
window.__open=()=>{
  const h=document.getElementById("root"); h.innerHTML="";
  RD.render(window.__btnNode, h);
  setTimeout(()=>{ const b=h.querySelector("button"); if(b)b.click(); }, 50);
  return "scheduled";
};
window.__close=()=>{ const m=window.__modalCancel; if(typeof m==="function"){try{m()}catch(e){}} return "closed"; };
window.__tab=(label)=>{
  const t=[...root().querySelectorAll(".qm-set-tab")].find(x=>(x.textContent||"").trim()===label);
  if(!t) return "no-tab:"+label; t.click(); return "tab:"+label;
};
window.__pickMode=(label)=>{
  const rows=[...root().querySelectorAll(".qm-set-row")];
  const row=rows.find(r=>(r.innerText||"").includes("答题模式"));
  if(!row) return "no-mode-row";
  const btn=[...row.querySelectorAll(".qm-set-segbtn")].find(b=>(b.textContent||"").trim()===label);
  if(!btn) return "no-btn:"+label; btn.click(); return "clicked:"+label;
};
window.__save=()=>{ const b=root().querySelector("[data-qm-save]"); if(!b)return "no-save"; b.click(); return "clicked"; };
window.__lastPost=()=>{ const p=window.__posts.filter(x=>x.method==="POST"); return p.length?p[p.length-1]:null; };
window.__conflict=()=>{
  const el=root().querySelector("[data-qm-conflict]");
  return el?(el.textContent||"").trim():null;
};
window.__msg=()=>{ const t=root().innerText||""; const m=t.match(/已保存[^\n]*|保存失败[^\n]*/); return m?m[0]:""; };
window.__ready=true;
</script></body></html>
"""


def main():
    b_sp = open(SP, encoding="utf-8").read() if os.path.exists(SP) else None
    b_gp = open(GP, encoding="utf-8").read() if os.path.exists(GP) else None
    hp = PLUG + "/dist/__conflict.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", SID))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/chromium")
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__conflict.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/%s')" % CHAT)

            g = rd(GP); g["mode"] = "manual"; wr(GP, g)
            wr(SP, {"sessions": {}, "updated_at": 1})
            # 先写一次，造出 key_ts 基线
            api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                                   "settings": {"mode": "manual"}})
            pg.evaluate("try{localStorage.removeItem('qm:v1:scopeChoice')}catch(e){}")

            # ═══ [S1][S2][S3] 正常保存 ═══
            print("\n===== [S1][S2][S3] 正常保存（无他人改动）=====")
            pg.evaluate("window.__posts=[]")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(900)
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)

            post = pg.evaluate("window.__lastPost()")
            body = json.loads((post or {}).get("body") or "{}")
            print("    settings:", json.dumps(body.get("settings"), ensure_ascii=False))
            print("    seen:", json.dumps(body.get("seen"), ensure_ascii=False))
            print("    conflict:", pg.evaluate("window.__conflict()"))

            ck("[S1] 只发改动键 mode（无整批固化）",
               (body.get("settings") or {}).keys() == {"mode"} or
               set((body.get("settings") or {}).keys()) == {"mode"},
               body.get("settings"))
            ck("[S2a] 请求体含 seen 字段", "seen" in body, sorted(body.keys()))
            ck("[S2b] seen 是对象且含 mode", isinstance(body.get("seen"), dict)
               and "mode" in (body.get("seen") or {}), body.get("seen"))
            ck("[S3] 无冲突 → 不显示冲突提示",
               pg.evaluate("window.__conflict()") is None,
               pg.evaluate("window.__conflict()"))
            ck("[S3b] 仍显示已保存",
               "已保存到本会话" in (pg.evaluate("window.__msg()") or ""),
               pg.evaluate("window.__msg()"))

            # ═══ [S6] 连点两次保存 → 第二次不误报 ═══
            print("\n===== [S6] 紧接着再保存一次（不误报）=====")
            pg.evaluate("window.__pickMode('人工')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)
            print("    conflict:", pg.evaluate("window.__conflict()"))
            ck("[S6] 自己连写两次不误报冲突",
               pg.evaluate("window.__conflict()") is None,
               pg.evaluate("window.__conflict()"))

            # ═══ [S4][S5] 他人改过同一键 → 冲突提示 ═══
            print("\n===== [S4][S5] 打开面板后，别处改了同一键 =====")
            pg.evaluate("window.__close()")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__posts=[]")
            pg.evaluate("window.__open()")
            pg.wait_for_timeout(2500)
            pg.evaluate("window.__tab('会话模式')")
            pg.wait_for_timeout(900)
            # 模拟「另一个窗口」在同一会话上改了 mode
            time.sleep(0.1)
            api("/session-prefs", {"chat_id": CHAT, "session_id": "", "agent_id": AG,
                                   "settings": {"mode": "recommend"}})
            print("    （已由别处写入 mode=recommend）")
            pg.evaluate("window.__pickMode('自动分析')")
            pg.wait_for_timeout(400)
            pg.evaluate("window.__save()")
            pg.wait_for_timeout(2500)

            conf = pg.evaluate("window.__conflict()")
            msg = pg.evaluate("window.__msg()")
            print("    conflict:", conf)
            print("    msg:", msg)
            ck("[S4a] 显示冲突提示", bool(conf), conf)
            ck("[S4b] 提示含「被其它位置修改」",
               "被其它位置修改" in (conf or ""), conf)
            ck("[S4c] 提示含时间（xx-xx hh:mm:ss）",
               bool(conf and ("：" in conf or ":" in conf)), conf)
            ck("[S4d] 提示含被覆盖的键名 mode", "mode" in (conf or ""), conf)
            ck("[S5] 冲突不阻断保存（仍提示已保存）",
               "已保存到本会话" in (msg or ""), msg)

            # 后写确实生效
            raw = (rd(SP).get("sessions") or {}).get(CHAT) or {}
            ck("[S5b] 后写生效（mode=ai）", raw.get("mode") == "ai", raw.get("mode"))
            # D1 增加了 __active_scope__（作用域标记），不属于用户值项。
            ck("[S5c] 落盘的值项仍只有 mode（无固化）",
               sorted(k for k in raw
                      if k not in ("updated_at", "__keyts__", "__active_scope__")) == ["mode"],
               sorted(raw.keys()))

            ck("[S7] 无页面错误", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(hp)
        except OSError:
            pass
        if b_sp is not None:
            with open(SP, "w", encoding="utf-8") as f:
                f.write(b_sp)
        if b_gp is not None:
            with open(GP, "w", encoding="utf-8") as f:
                f.write(b_gp)
        print("\n已恢复状态文件")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
