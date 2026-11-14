"""真机验证：通知频道行的布局是否正常（2026-11-14 用户截图报「标签竖排」）。

## 为什么必须用真浏览器测

用户报的症状是「左侧标签每字一行、中间一条长线、面板撑满留大片白」——
这是**排版结果**，不是 DOM 结构能证明的。Node 侧的 harness 用假 React，
没有真实布局引擎，测不出宽度被挤压。必须让 Chromium 真正计算一次几何。

## 判据（都基于 getBoundingClientRect 实测）

  [L1] 标签「人工模式提醒频道」的宽度 > 60px（竖排时约 14px，一望即知）
  [L2] 标签的高度 < 60px（竖排 8 个字会到 ~170px）
  [L3] 标签与控件区不重叠（竖排常伴随挤压重叠）
  [L4] 通知行的总高度 < 260px（撑爆面板时会远超）
  [L5] 结果文案节点宽度 > 100px（被压成竖行时很窄）
  [L6] 结果文案高度 / 宽度比 < 3（长线或竖排都会让比例异常）
"""
import asyncio
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PLUG = "/app/working/plugins/question-modal"
PORT = 8088
BASE = f"http://127.0.0.1:{PORT}"


def _get(path: str) -> str:
    req = urllib.request.Request(BASE + path, headers={"X-Agent-Id": "wb74Jn"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


async def main() -> int:
    from playwright.async_api import async_playwright

    bundle = _get("/api/frontend_plugin/question-modal/files/dist/index.js")
    print(f"bundle 长度: {len(bundle)}")
    # 必须有块布局锚点，否则说明加载的是旧包
    assert "qm-set-rowblock" in bundle, "served bundle 不含 qm-set-rowblock（旧包）"

    # 页面必须与 bundle 同源（宿主 HTTP 端点），否则 file:// 下
    # import "/assets/react-vendor.js" 被 CORS 拦（实测 ERR_FAILED，
    # 表现为 window.__mount 不存在 —— 不是页面写错，是加载失败）。
    #
    # 2026-11-14：夹具曾被 `npx vite build` 清空 dist/ 时删掉，本用例因此
    # 报「页面就绪: False」（不是功能退化）。改为构建前从**仓内 fixtures/**
    # 自动补齐，避免再次静默失效（同 /tmp/repro_payload.json 那次教训）。
    _fixture = os.path.join(HERE, "fixtures", "__layout.html")
    _target = os.path.join(
        PLUG, "dist", "__layout.html")
    if not os.path.isfile(_target) and os.path.isfile(_fixture):
        import shutil
        shutil.copyfile(_fixture, _target)
        print("已从 fixtures 补齐 __layout.html")
    page_path = (BASE + "/api/frontend_plugin/question-modal/files/dist/__layout.html")

    # 在页面里注入：把 served bundle 当脚本执行 + 打开设置面板
    inject = """
    window.__QM_TEST__ = true;
    """

    results = []
    ok_all = True

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("console", lambda m: None)

        # file:// 下 import "/assets/react-vendor.js" 会被 CORS 拦。
        # 用 route 把该请求代理到真实宿主（bundle 本身已经不需要跨域 fetch，
        # 页面是用 blob import 加载它）。
        await page.goto(page_path, wait_until="load")
        await page.wait_for_timeout(1200)

        # 页面自己会用 blob import 加载 served bundle（真实宿主路径），
        # 所以这里只等它就绪，不要重复注入（重复注入会注册两次）。
        for _ in range(40):
            ready = await page.evaluate("() => !!window.__ready")
            if ready:
                break
            await page.wait_for_timeout(250)
        print("页面就绪:", await page.evaluate("() => !!window.__ready"))

        # 挂一张卡片（真实设置入口是卡片触发的），再点设置按钮
        await page.evaluate("() => window.__mount('call_layout')")
        await page.wait_for_timeout(900)
        clicked = await page.evaluate("""() => {
          const n = window.__prefixNode;
          if (!n) return 'no-prefix-node';
          // 入口是 React 元素，直接用真实渲染挂出来再点
          const host = document.createElement('div');
          host.id = 'entryhost';
          document.body.appendChild(host);
          try { window.QwenPaw.host.ReactDOM.render(n, host); } catch (e) { return 'render-fail: ' + e; }
          const btn = host.querySelector('button');
          if (!btn) return 'no-button';
          btn.click();
          return 'ok';
        }""")
        print("打开设置面板:", clicked)
        await page.wait_for_timeout(1200)

        # 切到「全局配置」页（通知频道行在这里）
        await page.evaluate("""() => {
          const tabs = Array.from(document.querySelectorAll('.qm-set-tab'));
          const t = tabs.find((x) => (x.textContent || '').replace(/\\s+/g, '') === '全局配置');
          if (t) t.click();
        }""")
        await page.wait_for_timeout(900)

        geo = await page.evaluate("""() => {
          const norm = (s) => (s || '').replace(/\\s+/g, '');
          const rows = Array.from(document.querySelectorAll('.qm-set-row'));
          const row = rows.find((r) => norm(r.textContent).indexOf('人工模式提醒频道') !== -1);
          if (!row) return { found: false, rowCount: rows.length,
                             texts: rows.map((r) => norm(r.textContent).slice(0, 14)) };
          const label = row.querySelector('.qm-set-rowlabel');
          const ctl = row.querySelector('.qm-set-rowctl');
          const noteEl = row.querySelector('.qm-set-rownote');
          const btn = row.querySelector('[data-qm-notify-test]');
          const selEl = row.querySelector('select');
          const res = row.querySelector('[data-qm-notify-result]');
          const rect = (e) => { if (!e) return null; const b = e.getBoundingClientRect();
            return { w: Math.round(b.width), h: Math.round(b.height),
                     x: Math.round(b.x), y: Math.round(b.y) }; };
          return {
            found: true,
            isBlock: row.getAttribute('data-qm-rowblock') === '1',
            cls: row.className,
            row: rect(row), label: rect(label), ctl: rect(ctl), res: rect(res),
            labelText: norm(label && label.textContent).slice(0, 40),
            note: rect(noteEl), btn: rect(btn), sel: rect(selEl),
            resText: (res && res.textContent || '').slice(0, 80),
            panel: rect(document.querySelector('.qm-set-body') || row.closest('div')),
          };
        }""")

        def chk(name, ok, detail=""):
            nonlocal ok_all
            results.append((name, ok, detail))
            if not ok:
                ok_all = False
            print(("  ✓ " if ok else "  ✗ ") + name + ((" → " + str(detail)) if detail else ""))

        print(f"\n几何数据: {json.dumps(geo, ensure_ascii=False)}")

        if not geo.get("found"):
            chk("[L0] 找到通知频道行", False, geo)
        else:
            lab, ctl, res, rowb = geo["label"], geo["ctl"], geo["res"], geo["row"]
            chk("[L0] 通知行使用块布局", geo.get("isBlock") is True, geo.get("cls"))
            chk("[L1] 标签宽度 > 60px（竖排约 14px）", lab and lab["w"] > 60,
                f"w={lab['w'] if lab else '-'} text={geo.get('labelText')}")
            chk("[L2] 标签高度 < 60px（竖排约 170px）", lab and lab["h"] < 60,
                f"h={lab['h'] if lab else '-'}")
            chk("[L3] 标签与控件区不水平重叠",
                bool(lab and ctl) and (lab["x"] + lab["w"] <= ctl["x"] + 2
                                       or lab["y"] + lab["h"] <= ctl["y"] + 2),
                f"label=({lab['x']},{lab['y']},{lab['w']}x{lab['h']}) "
                f"ctl=({ctl['x']},{ctl['y']},{ctl['w']}x{ctl['h']})" if lab and ctl else "-")
            chk("[L4] 通知行总高度 < 260px", rowb and rowb["h"] < 260,
                f"h={rowb['h'] if rowb else '-'}")
            note = geo.get("note")
            btn = geo.get("btn")
            # ★ 2026-11-14 用户裁定：「下拉框应该左对齐，然后测试信息放到测试这一行」
            selr = geo.get("sel")
            chk("[L7] 下拉框与说明文字左对齐（比较 sel.x，不是 ctl.x）",
                bool(note and selr) and abs(selr["x"] - note["x"]) <= 2,
                f"note.x={note['x'] if note else '-'} sel.x={selr['x'] if selr else '-'}")
            chk("[L8] 测试按钮与下拉框同一行（y 接近）",
                bool(btn and ctl) and abs(btn["y"] - ctl["y"]) <= 10,
                f"btn.y={btn['y'] if btn else '-'} ctl.y={ctl['y'] if ctl else '-'}")
            selr = geo.get("sel")
            chk("[L9] 测试按钮在下拉框右侧（不是换行到下一行）",
                bool(btn and selr) and btn["x"] >= selr["x"] + selr["w"] - 2,
                f"btn.x={btn['x'] if btn else '-'} 下拉右={selr['x']+selr['w'] if selr else '-'}")
            if res and btn:
                chk("[L10] ★测试结果与测试按钮同一行（测试信息放到测试这一行）",
                    abs(res["y"] - btn["y"]) <= 14,
                    f"res.y={res['y']} btn.y={btn['y']}")
            if res:
                chk("[L5] 结果文案宽度 > 100px", res["w"] > 100, f"w={res['w']}")
                ratio = (res["h"] / res["w"]) if res["w"] else 99
                chk("[L6] 结果文案 高/宽 < 3（长线或竖排都会超标）", ratio < 3,
                    f"h/w={ratio:.2f} h={res['h']} w={res['w']}")

        await page.screenshot(
            path="/app/working/build/question-modal-dev/shot_notify_row_fixed.png",
            full_page=False,
        )
        await browser.close()

    print(f"\n════ 结果: {sum(1 for _, o, _ in results if o)} passed, "
          f"{sum(1 for _, o, _ in results if not o)} failed ════")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
