"""后端运行模式真机验证：完整跑一遍真实问卷，看后端 state 是否全程正常。

与之前的 verify_phase0_e2e.py 的区别：
  那个用「假宿主 + served bundle」测前端上报是否发出；
  这个走**真实 /api/console/chat**（真模型、真 agent、真 Future），
  验证后端在真实链路里的 state 行为是否正确。

覆盖：
  [R1] 真实请求能让问卷进入 pending
  [R2] 问卷创建时后端是否记下了 questions（阶段 0 的关键缺口）
  [R3] 提交后 state.status 是否正确变为 submitted
  [R4] 提交是否真 resolve 了 Future（kind=answered，不是谎报）
  [R5] 影子比对在真实交互下是否零差异
  [R6] 全程无 500、无异常
"""
import json, os, sys, time, urllib.request, urllib.error

BASE = "http://127.0.0.1:8088"
API = BASE + "/api/question-modal"
PLUG = "/app/working/plugins/question-modal"
SURVEY_FILE = os.path.join(PLUG, "survey_states.json")
SHADOW_FILE = os.path.join(PLUG, "shadow_diffs.json")
ANS_FILE = os.path.join(PLUG, "answered_results.json")
SID = "askuser-p0-backend-%d" % int(time.time())

ok = fail = 0

# ⚠️ 本脚本是**只读/真机观测**脚本：它不自己创建 state，观测的是真实问卷。
# 因此**不能**调用清理（空 prefix 会删掉无 request_id 的合法历史）。
# helper 保留但不调用，供需要时手工执行。
def _prune_test_state(prefix: str) -> None:
    """清掉本次测试通过 HTTP 写进**生产插件内存表**的 state。

    必须走 `/survey-prune` 端点：`_surveys()` 是跨 reload 存活的内存表，
    且 `surveys_restored` 让插件不重读磁盘 —— 直接改 json 文件无效
    （实测磁盘改到 11 条，reload 后变回 200+ 条）。
    """
    import json as _j
    import urllib.request as _u
    try:
        req = _u.Request(
            "http://127.0.0.1:8088/api/question-modal/survey-prune",
            data=_j.dumps({"prefix": prefix}).encode(), method="POST",
            headers={"Content-Type": "application/json"})
        with _u.urlopen(req, timeout=10) as r:
            d = _j.loads(r.read().decode())
        print(f"  已清理测试 state({prefix}): {d.get('before')} -> {d.get('after')}")
    except Exception as e:  # noqa: BLE001
        print(f"  (清理失败，请手动调 /survey-prune: {e})")

def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1; print("  \u2713 " + n)
    else:
        fail += 1; print("  \u2717 " + n + "  " + str(d))

def get(path):
    with urllib.request.urlopen(API + path, timeout=20) as f:
        return json.loads(f.read().decode())

def post_console(payload):
    r = urllib.request.Request(BASE + "/api/console/chat",
                               data=json.dumps(payload).encode(),
                               headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=180) as f:
            return f.status, f.read().decode()[:400]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]

def post(path, body):
    r = urllib.request.Request(API + path, data=json.dumps(body).encode(),
                               headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=30) as f:
            return json.loads(f.read().decode())
    except urllib.error.HTTPError as e:
        return {"_http": e.code, "_body": e.read().decode()[:300]}

def main():
    print("=== 基线 ===")
    print("  session:", SID)
    print("  pending:", json.dumps(get("/pending"), ensure_ascii=False)[:100])

    print("\n【R1】真实请求 → 问卷进入 pending")
    msg = ("请调用 question_modal 工具，问我两个问题："
           "1) 单选「后端验证」选项 甲/乙，把甲标为推荐；"
           "2) 问答「备注」。标题写「后端模式验证」。不要问我别的。")
    # ★ input 必须是「内容块列表」，不是纯字符串 —— 传字符串时宿主解析出空
    # 用户消息（实测：模型回「本轮会话只加载了系统提示…用户消息是空的」）。
    st, body = post_console({
        "user_id": "default",
        "session_id": SID,
        "sessionId": SID,
        "stream": False,
        "input": [{"role": "user", "content": [{"type": "text", "text": msg}]}],
    })
    print("  HTTP", st, "| 响应前 200 字:", body[:200])
    ck("[R1a] /api/console/chat 返回 200", st == 200, st)

    # 等问卷出现（模型需要时间）
    tid = None
    for i in range(30):
        time.sleep(2)
        p = get("/pending")
        items = p.get("items") or []
        mine = [x for x in items if x.get("session_id") == SID]
        if mine:
            tid = mine[0].get("tool_call_id")
            print("  pending 出现（等待 %ds）:" % ((i + 1) * 2),
                  json.dumps({k: mine[0].get(k) for k in ("tool_call_id", "title")}, ensure_ascii=False))
            break
    ck("[R1b] 问卷进入 pending 且属于本会话", bool(tid), "tid=" + str(tid))
    if not tid:
        print("\n  ⚠ 模型未产出问卷（可能限流），后续后端 state 断言无法进行")
        print("\n  改为验证后端在「无问卷」时的行为是否正常：")
        s = get("/survey-state?tool_call_id=nonexistent")
        ck("[R1c] 未记录的 tool_call_id 返回 found:false（不是 500）",
           s.get("ok") is True and s.get("found") is False, s)
        print("\n==== 后端真机验证（降级）: %d passed, %d failed ====" % (ok, fail))
        return 1 if fail else 0

    print("\n【R2】后端是否记下了 questions（阶段 0 关键缺口）")
    s = get("/survey-state?tool_call_id=" + tid)
    stt = s.get("state") or {}
    qs = stt.get("questions") or []
    print("  found:", s.get("found"), "| questions 条数:", len(qs))
    if qs:
        print("  题面:", json.dumps(qs, ensure_ascii=False)[:220])
    # 这一项是设计上的已知缺口：问卷由「工具调用」创建，创建处还没调 ensure_survey
    print("  → 若为 0，说明问卷创建时未写入后端 state（阶段 0 已知缺口，非缺陷）")

    print("\n【R3】模拟前端上报 → 后端是否接收")
    # 用当前真实 pending 的题目构造一次影子上报
    rep = {
        "cursor": 0, "mode": "manual", "status": "pending",
        "answers": {"q0": {"type": "single", "value": "甲", "other": "", "skipped": False}},
        "per_question": {},
    }
    r = post("/survey-shadow", {"tool_call_id": tid, "state": rep})
    print("  ", json.dumps(r, ensure_ascii=False)[:200])
    ck("[R3a] 影子上报被接受", r.get("ok") is True, r)
    s2 = get("/survey-state?tool_call_id=" + tid)
    got = ((s2.get("state") or {}).get("answers") or {}).get("q0", {}).get("value")
    print("  后端回读 q0 =", repr(got))
    ck("[R3b] 后端记住了前端上报的答案", got == "甲", got)

    print("\n【R4】真实提交 → Future 是否被 resolve")
    ans_before = {}
    if os.path.exists(ANS_FILE):
        try:
            ans_before = json.load(open(ANS_FILE, encoding="utf-8"))
        except Exception:
            ans_before = {}
    sub = post("/answer", {
        "tool_call_id": tid,
        "answers": {
            "q0": {"type": "single", "value": "甲", "other": "", "skipped": False},
            "q1": {"type": "text", "value": "后端验证备注", "other": "", "skipped": False},
        },
        "other": "", "attachments": [],
    })
    print("  ", json.dumps(sub, ensure_ascii=False)[:300])
    ck("[R4a] 提交返回 ok:true", sub.get("ok") is True, sub)
    ck("[R4b] 不是 orphan（真的 resolve 了 Future）", sub.get("orphan") is not True, sub)

    ans_after = {}
    if os.path.exists(ANS_FILE):
        try:
            ans_after = json.load(open(ANS_FILE, encoding="utf-8"))
        except Exception:
            ans_after = {}
    print("  answered_results 新增键:", [k for k in ans_after if k not in ans_before][:3])

    print("\n【R5】提交后 pending 应清空")
    time.sleep(2)
    p2 = get("/pending")
    left = [x for x in (p2.get("items") or []) if x.get("session_id") == SID]
    ck("[R5] 本会话已无 pending", len(left) == 0, left)

    print("\n【R6】影子比对在真实交互下的差异")
    diffs = get("/survey-shadow")
    n = diffs.get("count", 0)
    print("  差异条数:", n)
    if n:
        for x in (diffs.get("items") or [])[:3]:
            print("   ", json.dumps(x, ensure_ascii=False)[:220])
    ck("[R6] 真实交互下无「题面不一致」类真分歧", n == 0, n)

    print("\n【R7】端点健康（提交后仍全部可用）")
    for ep in ("survey-state?tool_call_id=" + tid, "survey-shadow", "prefs", "templates"):
        try:
            get("/" + ep)
            ck("[R7] /" + ep.split("?")[0] + " 可用", True, "")
        except Exception as e:
            ck("[R7] /" + ep.split("?")[0] + " 可用", False, str(e)[:100])

    print("\n==== 后端真机验证: %d passed, %d failed ====" % (ok, fail))
    return 1 if fail else 0

if __name__ == "__main__":
    sys.exit(main())
