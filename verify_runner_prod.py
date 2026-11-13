"""在**真实插件进程**里验证 recommend runner（走 HTTP，不碰测试进程的服务实例）。

为什么必须这样测（本轮教训）：
  `verify_phase2_state.py` / `verify_phase2_final.py` 都是**测试进程内**建问卷 +
  自己起 runner，所以它们用的是**测试进程的 QuestionService 实例**与**测试进程的
  sys.path**。而生产是：插件以**包**加载、插件目录不在 sys.path、
  runner 由 `plugin.py` 在问卷创建时启动。

  裸 `import recommend` 的缺陷就是这样被完全掩盖的：测试脚本 `sys.path.insert`
  了插件目录 → 裸 import 命中 → 全绿；生产里必然 ModuleNotFoundError →
  runner 静默不工作。**只有从 HTTP 外部驱动、由插件进程内部的代码去跑**，
  才能覆盖真实加载路径。

本套件的做法：
  1. 用 `POST /survey-action` 的 set_mode 把某份 state 切成 recommend
  2. 直接在后端 state 里注入题面（走 `/survey-state` 的既有能力/或预置文件）
  3. **只通过 HTTP 反复查询** `/survey-state`，看 cursor / answers 是否自己前进
  4. 判据是 HTTP 能看到的变化 —— 任何插件进程内的代码路径都必须是真实的
"""
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8088"
PLUG = "/app/working/plugins/question-modal"
PASS = FAIL = 0
FAILS = []

QS = [
    {"type": "single", "title": "Q1 选哪个", "options": ["甲", "乙"], "recommended": "乙"},
    {"type": "single", "title": "Q2 确认", "options": ["是", "否"], "recommended": "是"},
    {"type": "text", "title": "Q3 补充", "recommended": "无补充"},
]



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
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


def get(path, **p):
    q = "&".join(f"{k}={urllib.parse.quote(str(v))}" for k, v in p.items())
    with urllib.request.urlopen(f"{BASE}/api/question-modal{path}?{q}", timeout=10) as r:
        return json.loads(r.read().decode())


def post(path, body):
    req = urllib.request.Request(
        f"{BASE}/api/question-modal{path}", data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:  # noqa: BLE001
        return {"_err": str(e)}


def seed_state(tag):
    """把一份 recommend 模式的问卷写进后端 state 文件（插件进程会读到它）。

    注意：这里直接改**磁盘上的 state 文件**是刻意的 —— 它模拟"问卷已经存在"。
    真正的 runner 启动必须由插件进程自己完成，所以随后调 set_mode 触发
    `_sync_runners`（走 `/survey-action`，生产代码路径）。
    """
    p = f"{PLUG}/survey_states.json"
    data = json.load(open(p, encoding="utf-8"))
    data[tag] = {
        "tool_call_id": tag, "request_id": "", "session_id": "p2real",
        "agent_id": "wb74Jn", "title": "runner 生产路径验证",
        "questions": QS, "answers": {}, "cursor": 0,
        "mode": "manual",            # 先 manual，随后用 set_mode 切
        "status": "pending", "per_question": {},
        "created_at": time.time(), "updated_at": time.time(),
        "submitted_at": None, "orphan": False, "rev": 0,
        "progress_at": time.time(), "released": False,
    }
    json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def main():
    tag = "call_p2prod_%d" % int(time.time())

    print("[1] 预置一份 manual 问卷（runner 不应启动）")
    seed_state(tag)
    st = get("/survey-state", tool_call_id=tag).get("state") or {}
    ck("[1] state 可读", st.get("mode") == "manual", st.get("mode"))

    print("\n[2] 通过 HTTP 切到 recommend（触发生产代码里的 _sync_runners）")
    r = post("/survey-action", {"tool_call_id": tag, "action": "set_mode",
                                "payload": {"mode": "recommend"}})
    print(f"    accepted={r.get('accepted')}")

    print("\n[3] 只查 HTTP，看后端是否自己推进（★ 核心：插件进程内真实路径）")
    advanced = False
    last = {}
    for i in range(30):
        time.sleep(0.4)
        last = get("/survey-state", tool_call_id=tag).get("state") or {}
        ans = last.get("answers") or {}
        print(f"    +{(i+1)*0.4:.1f}s cursor={last.get('cursor')} "
              f"answers={len(ans)} status={last.get('status')}")
        if len(ans) > 0 or (last.get("cursor") or 0) > 0:
            advanced = True
            break

    ans = last.get("answers") or {}
    ck("[3] 后端自己推进了（裸 import 缺陷会让这里恒为 0）", advanced,
       {"cursor": last.get("cursor"), "answers": ans})
    if advanced:
        ck("[4] Q1 被填成推荐「乙」", (ans.get("q0") or {}).get("value") == "乙", ans.get("q0"))
        ck("[5] Q2 被填成推荐「是」", (ans.get("q1") or {}).get("value") == "是", ans.get("q1"))

    print("\n[6] 检查插件日志有无「recommend engine unavailable」")
    try:
        log = open("/app/working/qwenpaw.log", encoding="utf-8", errors="ignore").read()
        bad = log.count("recommend engine unavailable")
        ck("[6] 日志里没有引擎不可用的报错", bad == 0, f"{bad} 次")
    except Exception as e:  # noqa: BLE001
        print(f"    (跳过：读不到日志 {e})")

    # 清理
    post("/survey-action", {"tool_call_id": tag, "action": "release",
                            "payload": {"by": "cleanup"}})
    try:
        p = f"{PLUG}/survey_states.json"
        data = json.load(open(p, encoding="utf-8"))
        data.pop(tag, None)
        json.dump(data, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception as e:  # noqa: BLE001
        print(f"    清理失败: {e}")

    print(f"\n结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    _prune_test_state("call_p2prod_")

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
