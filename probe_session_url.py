# -*- coding: utf-8 -*-
"""决定性取证：宿主 getCurrentSessionId() 在各种 URL 形态下的返回值。

宿主实现（index-DZrIuh3B.js）：
  function ID(e){const t=e.match(/^\/chat\/(.+)$/);...}   // 只认 /chat/<x>
  function C(){ const e=ID(Md(pathname)); if(e) return ue.getSessionIdentity(e).sessionId||null;
                const t=g(pathname); if(!t||!ue.lastActiveChatId) return null; ... }

结论待验证的假设：
  H1  URL 是 /console/chat/<session_id>  → 有值
  H2  URL 是 /console/chat/<chat_uuid>   → 需要 sessionList 已加载
  H3  URL 是 /console/ 或 /console/chats → 返回 null
  H4  带额外路径前缀（子路径反代）        → 返回 null
"""
import json
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8088"
SID = "1791724819571-muuetab"
CHAT = "0489fc54-8a83-4621-984b-0239e944bfc7"

PROBE = """() => {
  const h = (window.QwenPaw && window.QwenPaw.host) || {};
  let v = null, err = null;
  try { v = typeof h.getCurrentSessionId === 'function' ? h.getCurrentSessionId() : '<no fn>'; }
  catch (e) { err = String(e); }
  return {
    pathname: location.pathname,
    href: location.href,
    getCurrentSessionId: v,
    err: err,
    hasFn: typeof h.getCurrentSessionId === 'function',
    hostKeys: Object.keys(h),
  };
}"""

CASES = [
    ("[A] /console/chat/<session_id>", f"/console/chat/{SID}"),
    ("[B] /console/chat/<chat_uuid>", f"/console/chat/{CHAT}"),
    ("[C] /console/chats", "/console/chats"),
    ("[D] /console/ 根", "/console/"),
    ("[E] /chat/<session_id> 无 base", f"/chat/{SID}"),
    ("[F] 子路径前缀 /pm/console/chat/<sid>", f"/pm/console/chat/{SID}"),
]


def main() -> int:
    results = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page()
        for name, path in CASES:
            try:
                pg.goto(BASE + path, wait_until="load", timeout=20000)
                pg.wait_for_timeout(2500)
                r = pg.evaluate(PROBE)
            except Exception as e:  # noqa: BLE001
                r = {"error": str(e)}
            results.append((name, path, r))
            print(f"\n{name}")
            print(f"   path={path}")
            print(f"   {json.dumps(r, ensure_ascii=False)}")
        b.close()

    print("\n==== 汇总 ====")
    for name, path, r in results:
        v = r.get("getCurrentSessionId")
        mark = "有值" if isinstance(v, str) and v else "空/NULL"
        print(f"{name:42s} -> {mark}  ({v!r})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
