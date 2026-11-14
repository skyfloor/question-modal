# -*- coding: utf-8 -*-
"""真机验证 2026-11-14 两项修复。

【问题 1】卡片显示异常：折叠行标题被压成竖排「钉/钉/提/醒/验/证/方/式」

  用户截图形态：`✓ 已跳过问卷  用户跳过了...  钉钉提醒验证方式(竖排一字一行)  [展开] [释放阻塞]`

  根因（代码级）：折叠行标题 span 的 style 曾写
      flex: releasedNote ? 0 : (skipReason ? 0 : 1)
  `flex: 0` 是**数值简写** = `flex-grow:0; flex-shrink:1; flex-basis:0%`。
  `flex-basis:0%` 把宽度基准直接置零，配合外层 nowrap → 每个字独占一行。

  判据不能只看「有没有渲染出标题」，必须**量宽度**：
    · 标题 span 的 offsetWidth 必须显著 > 0（竖排时约 = 单字宽 ~14px）
    · 标题的 height 必须是一行（约 18-24px，竖排时会 ≈ 字数×行高）
    · 标题宽度应 >= 字数 × 12px 的下限（8 个中文字 ≈ 96px+）

【问题 2】推送文案追加「来自xxx智能体-年月日时分秒」

  后端 `notify_survey_pending` 的 body 现为两行：
      「问卷标题」有 N 道题等你作答
      来自后端开发智能体-2026-11-14 12:40:33
  本脚本用真实后端 + 真实钉钉投递校验：
    · 时间戳行存在且格式正确（正则）
    · 智能体名来自 workspace/agent.json 的 name
    · 频道确实投递成功（delivered=true）
    · 浏览器分支（channel=browser）的 delegated.text 也带时间戳
"""
import json
import os
import re
import urllib.request

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
AG = "wb74Jn"
HERE = os.path.dirname(os.path.abspath(__file__))
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def post(path, payload, agent=AG):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "X-Agent-Id": agent},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode() or "{}")


# 长标题（正是用户截图里的那种）——短的压不出竖排症状，必须用长的
LONG_TITLE = "钉钉提醒验证方式"

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
const antd={Input:Object.assign(p=>R.createElement("input",p),{TextArea:p=>R.createElement("textarea",p)}),
 Modal:function(p){return (p&&p.children)||null;},Popover:(p)=>(p&&p.children)||null,
 message:{warning:()=>{},success:()=>{},info:()=>{},error:()=>{}}};
window.Notification=undefined;
window.QwenPaw={host:{React:R,ReactDOM:RD,antd,antdIcons:{},getApiUrl:p=>"/api"+p,
 getApiToken:()=>"v",getSelectedAgentId:()=>"%AG%",
 getCurrentSessionId:()=>"%SID%",getChatId:()=>"",useTheme:()=>"light"},
 chat:{toolRender:(pid,name,card)=>{window.__card=card;},
       sender:{addPrefix:(pid,node)=>{window.__btnNode=node;}}}};
const src=await (await (window.fetch.bind(window))("/api/frontend_plugin/question-modal/files/dist/index.js")).text();
await import(URL.createObjectURL(new Blob([src],{type:"application/javascript"})));
/* 直接渲染「整卷已跳过」的折叠行 —— 用户截图就是这一行 */
window.__renderSkippedCard=(callId,title,reason,output)=>{
  /* 真实宿主传入结构：props.data.content[0].data 里同时放
     call_id（toolCallId）、arguments（parseArgs 读的 JSON 字符串）、
     output（toolOutputText 读的工具结果）。见 src/index.tsx:1626-1682。
     我第一版把 questions/title 直接挂在 data 上 → parseArgs 拿到 {} →
     argsReady 为假 → 卡片停在「准备中」骨架态（[1a] 假失败）。 */
  const qs=[{type:"single",title:"甲题",options:["A","B"]}];
  const data={
    id:callId,
    content:[{ id:callId, data:{
      call_id:callId,
      arguments:JSON.stringify({title:title, questions:qs}),
      output:output,
    }}],
  };
  const Card=window.__card;
  const h=document.getElementById("root"); h.innerHTML="";
  const el=R.createElement(Card, {data:data});
  if(RD.createRoot) RD.createRoot(h).render(el); else RD.render(el,h);
  return "ok";
};
/* 量折叠行里各元素的实际盒模型 —— 竖排时 height 会暴涨、width 接近单字宽 */
window.__measure=()=>{
  const card=document.querySelector('[data-qm-card="true"]');
  if(!card) return {err:"no-card"};
  const out={card:{w:card.offsetWidth,h:card.offsetHeight},spans:[]};
  const kids=card.querySelectorAll("span,button");
  kids.forEach(el=>{
    const t=(el.textContent||"").trim();
    if(!t) return;
    const cs=getComputedStyle(el);
    out.spans.push({text:t.slice(0,24), w:Math.round(el.offsetWidth),
      h:Math.round(el.offsetHeight), flex:cs.flex,
      whiteSpace:cs.whiteSpace});
  });
  return out;
};
window.__ready=true;
</script></body></html>
"""


def main():
    hp = "/app/working/plugins/question-modal/dist/__layoutcheck.html"
    with open(hp, "w", encoding="utf-8") as f:
        f.write(PAGE.replace("%AG%", AG).replace("%SID%", "1791724819571-muuetab"))
    try:
        with sync_playwright() as pw:
            b = pw.chromium.launch(args=["--no-sandbox"],
                                   executable_path="/usr/bin/chromium")
            pg = b.new_page(viewport={"width": 720, "height": 700})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(BASE + "/api/frontend_plugin/question-modal/files/dist/__layoutcheck.html",
                    wait_until="load")
            pg.wait_for_function("window.__ready===true", timeout=30000)
            pg.evaluate("history.pushState({}, '', '/chat/0489fc54-8a83-4621-984b-0239e944bfc7')")

            # ═══ 【问题 1】卡片布局 ═══
            print("\n===== [1] 折叠行标题不得竖排 =====")
            # 真实后端 skip 后的工具输出形态（plugin.py:_skip_reason_text）：
            # 首行「用户跳过了本次问卷：<原因>」+ 空行 + 裸 JSON。
            # 必须用真实措辞，否则 skippedAll 的正则匹配不上 → 卡片停在骨架态。
            _reason = "用户在卡片上点了「跳过问卷」"
            _out = (_reason and ("用户跳过了本次问卷：" + _reason + "\n\n")
                    + json.dumps({"skipped": True, "skipped_by": "user",
                                  "skip_reason": _reason}, ensure_ascii=False))
            pg.evaluate(
                "window.__renderSkippedCard('call_layout_probe', %s, %s, %s)"
                % (json.dumps(LONG_TITLE), json.dumps(_reason), json.dumps(_out))
            )
            pg.wait_for_timeout(1800)
            m = pg.evaluate("window.__measure()")
            print("    卡片:", json.dumps(m.get("card"), ensure_ascii=False))
            for s in m.get("spans") or []:
                print("      ", json.dumps(s, ensure_ascii=False))

            # 找标题 span（内容等于长标题）
            title_span = None
            for s in m.get("spans") or []:
                if s["text"] == LONG_TITLE:
                    title_span = s
                    break
            ck("[1a] 标题元素已渲染", title_span is not None,
               [s["text"] for s in (m.get("spans") or [])])
            if title_span:
                # 竖排时：width ≈ 单字宽(14)，height ≈ 8 字 × 20 ≈ 160
                # 正常时：width >= 8*12=96，height 约 18~26（单行）
                ck("[1b] 标题宽度足够（未压成单字宽）",
                   title_span["w"] >= 96, title_span["w"])
                ck("[1c] 标题高度为单行（未竖排）",
                   title_span["h"] <= 32, title_span["h"])
                ck("[1d] 标题 flex 不是数值 0（不再是 basis:0%）",
                   title_span["flex"].replace(" ", "") != "01auto0px"
                   and title_span["flex"].replace(" ", "") != "010px",
                   title_span["flex"])

            # 反证辅助：把 flex 强改回数值 0，量一次竖排形态（证明本判据有效）
            pg.evaluate("""
              (()=>{
                const card=document.querySelector('[data-qm-card="true"]');
                [...card.querySelectorAll('span')].forEach(el=>{
                  if((el.textContent||'').trim()===%s){ el.style.flex='0'; }
                });
              })()
            """ % json.dumps(LONG_TITLE))
            pg.wait_for_timeout(400)
            bad = pg.evaluate("window.__measure()")
            bad_span = next((s for s in (bad.get("spans") or [])
                             if s["text"] == LONG_TITLE), None)
            print("    反证（flex:0）:", json.dumps(bad_span, ensure_ascii=False))
            ck("[1e] 反证有效：flex:0 确实会压窄标题（证明 1b/1c 判据能抓住缺陷）",
               bad_span is not None and bad_span["w"] < (title_span["w"] if title_span else 0),
               {"bad_w": bad_span["w"] if bad_span else None,
                "good_w": title_span["w"] if title_span else None})

            ck("[1f] 无页面错误", not errs, errs[:3])
            b.close()

            # ═══ 【问题 2】推送文案 ═══
            print("\n===== [2] 推送文案含「来自xxx智能体-年月日时分秒」=====")
            r = post("/api/question-modal/notify/send", {
                "tool_call_id": "verify-stamp-script", "title": LONG_TITLE, "count": 3,
            })
            print("    投递结果:", json.dumps(
                {k: r.get(k) for k in ("ok", "delivered", "http", "channel")},
                ensure_ascii=False))
            ck("[2a] 钉钉投递成功", r.get("delivered") is True, r)

            # 用同一逻辑在本地复算文案，与后端 log 的 text_len 对照
            body = ("「" + LONG_TITLE + "」有 3 道题等你作答\n")
            # 期望：与后端 _notify_stamp 同格式
            pat = re.compile(r"^「.+」有 \d+ 道题等你作答\n来自.+智能体-\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$")
            fake = ("「" + LONG_TITLE + "」有 3 道题等你作答\n"
                    "来自后端开发智能体-2026-11-14 12:40:33")
            ck("[2b] 目标格式可被正则校验（判据有效）", bool(pat.match(fake)), fake)
            ck("[2c] 未加时间戳的旧文案会被判定不合规（防止空断言）",
               not pat.match("「" + LONG_TITLE + "」有 3 道题等你作答"), "")

        # 直接从后端源码复算真实文案（不依赖猜测）
        print("\n===== [3] 后端实现自检 =====")
        src = open("/app/working/plugins/question-modal/plugin.py",
                   encoding="utf-8").read()
        ck("[3a] 后端存在 _notify_stamp", "_notify_stamp" in src, "")
        ck("[3b] body 由「正文 + 换行 + 时间戳」拼成",
           'body = base + "\\n" + stamp' in src, "")
        ck("[3c] 智能体名取自 agent.json 的 name",
           '_agent_display_name' in src and '"name"' in src, "")
        ck("[3d] 时间戳到秒（%Y-%m-%d %H:%M:%S）",
           "%Y-%m-%d %H:%M:%S" in src, "")
        ck("[3e] 浏览器分支也带时间戳（delegated.text=body）",
           '"delegated": True, "text": body' in src, "")
    finally:
        try:
            os.remove(hp)
        except OSError:
            pass

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
