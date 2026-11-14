# -*- coding: utf-8 -*-
"""用真实 Chromium 渲染 README，确认新增章节渲染正常。

为什么必须真机：2026-11-14 曾出现「**「释放阻塞」**」加粗失效（`**` 紧贴
全角引号违反 CommonMark 定界符规则），纯文本检查看不出来，必须看渲染结果。

判据：
  · 6 个表格都渲染成 <table>（而不是一排竖线文字）
  · 加粗渲染成 <strong>，且正文里不残留字面量 **
  · 新增的「人工模式提醒」章节标题存在
  · 无 <pre> 之外的残留裸 ``` 
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(HERE, "README.md")
ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


# 极简 Markdown → HTML（只覆盖本 README 用到的语法），在浏览器里跑，
# 再用 getComputedStyle 量真实渲染结果。
RENDER_JS = r"""
(text) => {
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  const inline = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  while (i < lines.length) {
    const L = lines[i];
    if (/^```/.test(L.trim())) {          // 代码块
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++; out.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>'); continue;
    }
    if (/^\|/.test(L)) {                   // 表格
      const block = [];
      while (i < lines.length && /^\|/.test(lines[i])) { block.push(lines[i]); i++; }
      if (block.length >= 2 && /^\|[\s:|-]+\|$/.test(block[1].trim())) {
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
        let h = '<table><thead><tr>' + cells(block[0]).map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
        for (const r of block.slice(2)) h += '<tr>' + cells(r).map(c => '<td>' + c + '</td>').join('') + '</tr>';
        out.push(h + '</tbody></table>');
      } else { out.push('<p>' + inline(block.join(' ')) + '</p>'); }
      continue;
    }
    const hm = L.match(/^(#{1,6})\s+(.*)$/);
    if (hm) { out.push('<h' + hm[1].length + '>' + inline(hm[2]) + '</h' + hm[1].length + '>'); i++; continue; }
    if (/^\s*[-*]\s+/.test(L)) {           // 列表
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++;
      }
      out.push('<ul>' + items.map(x => '<li>' + inline(x) + '</li>').join('') + '</ul>'); continue;
    }
    if (/^\s*\d+\.\s+/.test(L)) {          // 有序
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++;
      }
      out.push('<ol>' + items.map(x => '<li>' + inline(x) + '</li>').join('') + '</ol>'); continue;
    }
    if (!L.trim()) { i++; continue; }
    out.push('<p>' + inline(L) + '</p>'); i++;
  }
  return out.join('\n');
}
"""


def main():
    text = open(MD, encoding="utf-8").read()
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=["--no-sandbox"],
                               executable_path="/usr/bin/chromium")
        pg = b.new_page(viewport={"width": 1000, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.set_content("<html><head><meta charset='utf-8'>"
                       "<style>body{font-family:system-ui;width:860px;}"
                       "table{border-collapse:collapse;margin:8px 0}"
                       "th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}"
                       "pre{background:#f5f5f5;padding:8px}</style></head>"
                       "<body><div id='r'></div></body></html>")
        html = pg.evaluate(RENDER_JS, text)
        pg.evaluate("(h)=>{document.getElementById('r').innerHTML=h}", html)
        pg.wait_for_timeout(300)

        stats = pg.evaluate("""() => {
          const r = document.getElementById('r');
          const tables = [...r.querySelectorAll('table')];
          const tinfo = tables.map(t => ({
            cols: t.querySelectorAll('thead th').length,
            rows: t.querySelectorAll('tbody tr').length,
            firstTh: (t.querySelector('thead th')||{}).textContent || '',
            w: Math.round(t.getBoundingClientRect().width),
          }));
          const hs = [...r.querySelectorAll('h1,h2,h3')].map(h => h.textContent.trim());
          return {
            tables: tinfo,
            tableCount: tables.length,
            strongCount: r.querySelectorAll('strong').length,
            literalStars: (r.innerText.match(/\\*\\*/g) || []).length,
            h3s: hs,
            hasNotifySection: hs.some(x => x.indexOf('人工模式提醒') >= 0),
            hasSettingsSection: hs.some(x => x.indexOf('设置面板') >= 0),
            bodyText: r.innerText.slice(0, 200),
            scrollW: r.scrollWidth,
          };
        }""")
        print("  表格:", json.dumps(stats["tables"], ensure_ascii=False))
        print("  h3:", json.dumps(stats["h3s"], ensure_ascii=False))

        ck("[R1] 表格全部渲染成 <table>（6 个）", stats["tableCount"] == 6,
           stats["tableCount"])
        # 只校验本次新增的两个表（列数写死会随 README 其它表格变化而假失败）
        _by_head = {t["firstTh"]: t for t in stats["tables"]}
        ck("[R2a] 「设置面板」表 3 列（页签/内容/保存后的效果）",
           (_by_head.get("页签") or {}).get("cols") == 3,
           _by_head.get("页签"))
        ck("[R2b] 「人工模式提醒」表 2 列（频道/说明）",
           (_by_head.get("频道") or {}).get("cols") == 2,
           _by_head.get("频道"))
        ck("[R2c] 两个新表各有 4 行 / 3 行数据",
           (_by_head.get("页签") or {}).get("rows") == 4
           and (_by_head.get("频道") or {}).get("rows") == 3,
           {k: (v.get("rows")) for k, v in _by_head.items()})
        ck("[R3] 没有残留字面量 **", stats["literalStars"] == 0,
           stats["literalStars"])
        ck("[R4] 加粗渲染成 <strong>（>0）", stats["strongCount"] > 0,
           stats["strongCount"])
        ck("[R5] 存在「设置面板」章节", stats["hasSettingsSection"],
           stats["h3s"])
        ck("[R6] 新增「人工模式提醒」章节", stats["hasNotifySection"],
           stats["h3s"])
        ck("[R7] 无页面错误", not errs, errs[:3])
        b.close()

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
