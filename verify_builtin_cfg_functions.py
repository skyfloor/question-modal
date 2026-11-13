"""9 项内置默认配置 · 功能有效性验证（UI 不恢复，只验功能是否真的生效）。

方法：真实 Chromium + served bundle，`effective-config` 桩按 `window.__CFG`
返回不同配置值，对比同一份问卷在「开/关」两种取值下的卡片渲染或行为差异。
每一项都必须产生**可观测的差异**；取值切换后无差异 = 该配置已成死配置。

覆盖：
  [B1] show_recommend_badge    显示 AI 推荐标记
  [B2] badge_position          推荐徽章位置
  [B3] badge_style             徽章外观
  [B4] highlight_recommended   推荐项底色
  [B5] auto_number_options     选项自动编号
  [C4] fallback_title          缺题干时显示
  [C1] gate_unsaved            未作答时拦截翻页
  [C2] skip_mode               跳过方式
  [C3] slow_question_sec       题级计时提示
"""
import json, os, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID, AG = "1791724819571-muuetab", "wb74Jn"
PLUG = "/app/working/plugins/question-modal"

ok = fail = 0
def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

BASE_CFG = {
    "mode": "manual", "show_recommend_badge": True, "gate_unsaved": True,
    "slow_question_sec": 60, "skip_mode": "per_question", "model_id": "",
    "template_id": "", "with_context": False, "parallel": False,
    "fallback_title": True, "wait_hint_sec": 180, "model_timeout_sec": 120,
    "badge_position": "left", "badge_style": "rect", "highlight_recommended": False,
    "auto_number_options": True, "notify_manual_mode": False, "gate_log_limit": 200,
    "__sources__": {},
}

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
 const good=h.querySelector("i");h.remove();if(good){R=r;RD=d;}}catch(e){} if(R)break;}if(R)break;}
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:Object.assign(p=>(p&&p.children)||null,{confirm:()=>{}}),
 Popover:p=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(p,t,c)=>{window.__card=c;},sender:{addPrefix:()=>{}}}};
const rf=window.fetch.bind(window);
window.__CFG=null; window.__REQ=[];
window.fetch=(u,o)=>{const url=String(u);const meth=((o&&o.method)||"GET").toUpperCase();
 if(meth!=="GET") window.__REQ.push({url,meth,body:(()=>{try{return JSON.parse((o&&o.body)||"null")}catch(e){return String((o&&o.body)||"")}})()});
 if(url.includes("effective-config"))return Promise.resolve(new Response(JSON.stringify({
   ok:true,chat_id:"C",version:1,schema:[],global_keys:[],sources:{},config:window.__CFG}),{status:200}));
 if(url.includes("question-modal/resolve"))return Promise.resolve(new Response(JSON.stringify({ok:true,found:true,request_id:"req-fn",state:"pending"}),{status:200}));
 if(url.includes("question-modal/answer"))return Promise.resolve(new Response(JSON.stringify({ok:true,request_id:"req-fn"}),{status:200}));
 if(url.includes("question-modal/templates"))return Promise.resolve(new Response(JSON.stringify({ok:true,
   default_id:"builtin-default",items:[{id:"builtin-default",name:"默认六步",builtin:true,system:"s",user:"u"}]}),{status:200}));
 if(url.includes("question-modal/prefs")||url.includes("session-prefs"))
   return Promise.resolve(new Response(JSON.stringify({ok:true,stored:true}),{status:200}));
 if(url.includes("/api/models/active"))return Promise.resolve(new Response(JSON.stringify({active_llm:{provider_id:"o",model:"m"}}),{status:200}));
 if(url.includes("/api/models"))return Promise.resolve(new Response(JSON.stringify({providers:[
   {id:"wd",name:"WD",is_active:true,models:["deepseek-v4-pro"]}]}),{status:200}));
 return rf(u,o);};
const src=await (await rf("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
window.__root=null; window.__box=null;
window.__mount=(qs)=>{
 // 每次都换新容器 + 新 root：复用同一 container 会让 React 认为「同一组件」，
 // 复用旧 state（旧 effCfg），且清 innerHTML 会破坏 React 树 → 后续渲染空白。
 const host=document.getElementById("host");
 host.innerHTML="";
 const box=document.createElement("div"); host.appendChild(box);
 const call="call-fn-"+Math.random().toString(36).slice(2,7);
 const el=R.createElement(window.__card,{data:{content:[{type:"data",
   data:{call_id:call,arguments:JSON.stringify({title:"功能验证",questions:qs})}}]}});
 const root=RD.createRoot?RD.createRoot(box):null;
 if(root) root.render(el); else RD.render(el,box);
 window.__root=root; window.__box=box;
 return call;
};
window.__T=()=>{
 const b=document.querySelector("#host > div:last-child");
 return (b?b.innerText:"")||document.getElementById("host").innerText||"";
};
window.__HTML=()=>{const b=document.querySelector("#host > div:last-child");return b?b.innerHTML:"";};
window.__BTNS=()=>{const b=document.querySelector("#host > div:last-child")||document;
 return [...b.querySelectorAll("button")].map(x=>x.textContent.trim());};
window.__click=(lb,ex)=>{const b=document.querySelector("#host > div:last-child")||document;
 const bs=[...b.querySelectorAll("button")];
 const t=bs.find(x=>ex?x.textContent.trim()===lb:x.textContent.includes(lb));
 if(!t)return "not-found"; t.click(); return "ok";};
window.__recBadges=()=>[...document.querySelectorAll("[data-qm-rec]")];
window.__badgeOrder=()=>{
  const b=document.querySelector("[data-qm-rec]"); if(!b)return null;
  // 判断徽章在选项文字之前还是之后：看父节点内子节点顺序
  const p=b.parentElement; if(!p)return null;
  const kids=[...p.childNodes];
  const bi=kids.indexOf(b);
  const textAfter=kids.slice(bi+1).map(n=>n.textContent||"").join("").trim();
  const textBefore=kids.slice(0,bi).map(n=>n.textContent||"").join("").trim();
  return {kids:kids.length, idx:bi, before:textBefore.slice(0,20), after:textAfter.slice(0,20)};
};
window.__ready=true;
</script></body></html>
"""

QS_STD = [
    {"type": "single", "title": "单选题", "options": ["甲选项", "乙选项", "丙选项"], "recommended": "乙选项"},
    {"type": "text", "title": "问答题"},
]
QS_NOTITLE = [
    {"type": "single", "options": ["选项一", "选项二"], "recommended": "选项一"},
    {"type": "text"},
]

def run(pg, cfg, qs, settle=1500):
    pg.evaluate("(c)=>{window.__CFG=c;}", cfg)
    pg.evaluate("(q)=>window.__mount(q)", qs)
    pg.wait_for_timeout(settle)

def main():
    p = os.path.join(PLUG, "dist", "__fnverify.html")
    with open(p, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%SID%", SID).replace("%AG%", AG))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"])
            pg = b.new_page()
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__fnverify.html", wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)

            def C(**kw):
                c = dict(BASE_CFG); c.update(kw); return c

            # ══════ [B1] show_recommend_badge ══════
            print("\n【B1】显示 AI 推荐标记 show_recommend_badge")
            run(pg, C(show_recommend_badge=True), QS_STD)
            n_on = pg.evaluate("window.__recBadges().length")
            t_on = pg.evaluate("window.__T()")
            run(pg, C(show_recommend_badge=False), QS_STD)
            n_off = pg.evaluate("window.__recBadges().length")
            t_off = pg.evaluate("window.__T()")
            print("    开: 徽章数=%d  「AI 推荐」出现=%s" % (n_on, "AI 推荐" in t_on))
            print("    关: 徽章数=%d  「AI 推荐」出现=%s" % (n_off, "AI 推荐" in t_off))
            ck("[B1a] 开启时徽章存在", n_on >= 1, n_on)
            ck("[B1b] 关闭时徽章消失", n_off == 0, n_off)
            ck("[B1c] 关闭徽章不影响选项文字", all(x in t_off for x in ("甲选项", "乙选项", "丙选项")), t_off[:120])

            # ══════ [B2] badge_position ══════
            print("\n【B2】推荐徽章位置 badge_position（left / right）")
            run(pg, C(badge_position="left", show_recommend_badge=True), QS_STD)
            ord_l = pg.evaluate("window.__badgeOrder()")
            run(pg, C(badge_position="right", show_recommend_badge=True), QS_STD)
            ord_r = pg.evaluate("window.__badgeOrder()")
            print("    left :", json.dumps(ord_l, ensure_ascii=False))
            print("    right:", json.dumps(ord_r, ensure_ascii=False))
            ck("[B2] left/right 产生不同徽章位置",
               ord_l and ord_r and ord_l["idx"] != ord_r["idx"], (ord_l, ord_r))

            # ══════ [B3] badge_style ══════
            print("\n【B3】徽章外观 badge_style（rect / round）")
            run(pg, C(badge_style="rect", show_recommend_badge=True), QS_STD)
            rad_rect = pg.evaluate("()=>{const b=document.querySelector('[data-qm-rec]');return b?getComputedStyle(b).borderRadius:null;}")
            run(pg, C(badge_style="round", show_recommend_badge=True), QS_STD)
            rad_round = pg.evaluate("()=>{const b=document.querySelector('[data-qm-rec]');return b?getComputedStyle(b).borderRadius:null;}")
            print("    rect 圆角=%s   round 圆角=%s" % (rad_rect, rad_round))
            ck("[B3] rect/round 圆角不同", rad_rect and rad_round and rad_rect != rad_round,
               (rad_rect, rad_round))

            # ══════ [B4] highlight_recommended ══════
            print("\n【B4】推荐项底色 highlight_recommended")
            run(pg, C(highlight_recommended=False, show_recommend_badge=True), QS_STD)
            bg_off = pg.evaluate("""()=>{const b=document.querySelector('[data-qm-rec]');
              if(!b)return null; const row=b.closest('button')||b.parentElement;
              return row?getComputedStyle(row).backgroundColor:null;}""")
            run(pg, C(highlight_recommended=True, show_recommend_badge=True), QS_STD)
            bg_on = pg.evaluate("""()=>{const b=document.querySelector('[data-qm-rec]');
              if(!b)return null; const row=b.closest('button')||b.parentElement;
              return row?getComputedStyle(row).backgroundColor:null;}""")
            print("    关=%s   开=%s" % (bg_off, bg_on))
            ck("[B4] 开启后推荐行底色不同", bg_off != bg_on, (bg_off, bg_on))

            # ══════ [B5] auto_number_options ══════
            print("\n【B5】选项自动编号 auto_number_options")
            run(pg, C(auto_number_options=True), QS_STD)
            t_num_on = pg.evaluate("window.__T()")
            run(pg, C(auto_number_options=False), QS_STD)
            t_num_off = pg.evaluate("window.__T()")
            ck("[B5a] 开启时有编号「1. 甲选项」", "1. 甲选项" in t_num_on or "1." in t_num_on, t_num_on[:120])
            ck("[B5b] 关闭时无编号", "1. 甲选项" not in t_num_off, t_num_off[:120])
            ck("[B5c] 关闭编号后选项文字仍在", all(x in t_num_off for x in ("甲选项", "乙选项")), "")

            # ══════ [C4] fallback_title ══════
            print("\n【C4】缺题干时显示 fallback_title（问卷无 title/题干）")
            run(pg, C(fallback_title=True), QS_NOTITLE)
            t_fb_on = pg.evaluate("window.__T()")
            run(pg, C(fallback_title=False), QS_NOTITLE)
            t_fb_off = pg.evaluate("window.__T()")
            has_on = ("第 1 题" in t_fb_on) or ("第1题" in t_fb_on)
            has_off = ("第 1 题" in t_fb_off) or ("第1题" in t_fb_off)
            print("    开: 有「第 N 题」=%s | 关: 有「第 N 题」=%s" % (has_on, has_off))
            ck("[C4] fallback_title 开/关产生差异", has_on != has_off, (has_on, has_off))

            # ══════ [C1] gate_unsaved ══════
            print("\n【C1】未作答时拦截翻页 gate_unsaved")
            run(pg, C(gate_unsaved=True), QS_STD)
            pg.evaluate("window.__REQ=[]")
            pg.evaluate("window.__click('下一步')")
            pg.wait_for_timeout(800)
            t_g_on = pg.evaluate("window.__T()")
            blocked_on = ("尚未" in t_g_on) or ("拦截" in t_g_on) or ("请选择" in t_g_on)
            reqs_on = pg.evaluate("window.__REQ")
            run(pg, C(gate_unsaved=False), QS_STD)
            pg.evaluate("window.__REQ=[]")
            pg.evaluate("window.__click('下一步')")
            pg.wait_for_timeout(800)
            t_g_off = pg.evaluate("window.__T()")
            blocked_off = ("尚未" in t_g_off) or ("拦截" in t_g_off) or ("请选择" in t_g_off)
            reqs_off = pg.evaluate("window.__REQ")
            print("    开: 被拦截=%s  gate-block请求=%d" % (blocked_on, len([r for r in reqs_on if "gate-block" in r["url"]])))
            print("    关: 被拦截=%s  gate-block请求=%d" % (blocked_off, len([r for r in reqs_off if "gate-block" in r["url"]])))
            ck("[C1a] 开启时未作答被拦截", blocked_on, t_g_on[:150])
            ck("[C1b] 开启时发 gate-block 留痕", any("gate-block" in r["url"] for r in reqs_on), "")
            ck("[C1c] 关闭时不再拦截（直接放行）", not blocked_off, t_g_off[:150])
            ck("[C1d] 关闭时不发 gate-block", not any("gate-block" in r["url"] for r in reqs_off), "")

            # ══════ [C2] skip_mode ══════
            print("\n【C2】跳过方式 skip_mode（per_question / whole）")
            run(pg, C(skip_mode="per_question"), QS_STD)
            b_pq = pg.evaluate("window.__BTNS()")
            run(pg, C(skip_mode="whole"), QS_STD)
            b_wh = pg.evaluate("window.__BTNS()")
            has_pq = any("跳过本题" in x for x in b_pq)
            has_wh = any("跳过本题" in x for x in b_wh)
            print("    逐题模式按钮含「跳过本题」=%s | 整卷模式=%s" % (has_pq, has_wh))
            print("    逐题模式全部按钮:", [x for x in b_pq if x][:8])
            print("    整卷模式全部按钮:", [x for x in b_wh if x][:8])
            ck("[C2] skip_mode 开/关产生按钮差异", (has_pq or has_wh) and b_pq != b_wh, (has_pq, has_wh))

            # ══════ [C3] slow_question_sec ══════
            print("\n【C3】题级计时提示 slow_question_sec（阈值实际生效）")
            # 用极小阈值逼出提示，验证「配置值真的进了计时逻辑」而非只是没到时间。
            run(pg, C(slow_question_sec=1), QS_STD, settle=2600)
            t_s1 = pg.evaluate("window.__T()")
            run(pg, C(slow_question_sec=0), QS_STD, settle=2600)
            t_s0 = pg.evaluate("window.__T()")
            print("    1 秒阈值(等 2.6s):", t_s1.replace("\n", " | ")[-160:])
            print("    0 秒(关闭, 等 2.6s):", t_s0.replace("\n", " | ")[-160:])
            ck("[C3a] 1 秒阈值下出现计时提示且引用该秒数",
               ("已超过" in t_s1) and ("1" in t_s1), t_s1[-160:])
            ck("[C3b] 0 秒（关闭）不出现计时提示",
               "已超过" not in t_s0, t_s0[-160:])
            ck("[C3c] 两者文本确有差异（配置驱动行为）", t_s1 != t_s0, "")

            # ══════ 收尾 ══════
            print("\n【X】异常与污染")
            ck("[X1] 全程零 pageerror", not errs, errs[:2])
            b.close()
    finally:
        try:
            os.remove(p)
        except OSError:
            pass

    print("\n==== 9 项内置配置功能验证: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
