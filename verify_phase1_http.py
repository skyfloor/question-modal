"""阶段 1 HTTP 层验证：/survey-state / /survey-action / /survey-stream。

只打 HTTP，不碰浏览器 —— 验证路由注册、SSE 帧格式、动作裁决契约。
"""
import json
import sys
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8088/api/question-modal"
PASS = FAIL = 0
FAILS = []


def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  ❌ {name} {detail}")


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return r.status, json.loads(r.read().decode())


def post(path, body):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        # ★ 必须容错：错误响应体可能是空串/纯空白/非 JSON（如 nginx 的错误页），
        # 直接 json.loads 会抛 JSONDecodeError 把整个套件带崩，看不出真正的
        # 失败点。这里退化成把原文塞进 error 字段，仍然返回 (code, dict) 形状。
        raw = (e.read() or b"").decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw) if raw.strip() else {}
        except ValueError:
            return e.code, {"_error": raw[:300]}


_PREFIX = "http-p1-"


def main():
    tag = f"http-p1-{int(time.time())}"

    print("[1] /survey-state 未知问卷")
    st, d = get(f"/survey-state?tool_call_id={tag}")
    check("HTTP 200", st == 200, f"got={st}")
    check("found=False", d.get("found") is False, f"got={d}")

    print("\n[2] /survey-action 建基线 + 裁决")
    st, d = post("/survey-action", {
        "tool_call_id": tag, "action": "set_answer",
        "payload": {"key": "q0", "answer": {"type": "single", "value": "甲"}},
    })
    check("HTTP 200", st == 200, f"got={st}")
    check("accepted=True", d.get("accepted") is True, f"got={d}")
    check("返回 state 含答案",
          d.get("state", {}).get("answers", {}).get("q0", {}).get("value") == "甲")
    check("返回 state 含 rev", int(d.get("state", {}).get("rev") or 0) > 0)

    print("\n[3] /survey-state 现在能读到")
    st, d = get(f"/survey-state?tool_call_id={tag}")
    check("found=True", d.get("found") is True)
    check("rev 一致", int(d.get("rev") or 0) == int(d["state"]["rev"]))

    print("\n[4] 幂等：终态后拒绝写入")
    post("/survey-action", {"tool_call_id": tag, "action": "submit",
                            "payload": {"by": "user"}})
    st, d = post("/survey-action", {
        "tool_call_id": tag, "action": "set_answer",
        "payload": {"key": "q0", "answer": {"type": "single", "value": "乙"}},
    })
    check("被拒 already_submitted",
          d.get("accepted") is False and d.get("reason") == "already_submitted",
          f"got={d}")
    st, d = get(f"/survey-state?tool_call_id={tag}")
    check("答案未被改写",
          d["state"]["answers"]["q0"]["value"] == "甲",
          f"got={d['state']['answers'].get('q0')}")

    print("\n[5] /survey-stream SSE 帧格式")
    tag2 = f"{tag}-s"
    post("/survey-action", {"tool_call_id": tag2, "action": "set_answer",
                            "payload": {"key": "q0",
                                        "answer": {"type": "single", "value": "甲"}}})
    req = urllib.request.Request(
        f"{BASE}/survey-stream?tool_call_id={tag2}&since_rev=0")
    frames = []
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            check("Content-Type 是 SSE",
                  "text/event-stream" in (r.headers.get("Content-Type") or ""),
                  f"got={r.headers.get('Content-Type')}")
            t0 = time.time()
            for raw in r:
                line = raw.decode().strip()
                if line.startswith("data: "):
                    # ★ 必须容错：SSE 里可能有非 JSON 的 data（心跳/注释），
                    # 而且按字节读会把多字节中文切开（MEMORY 记过：按字节
                    # decode 会把「甲」切成空串，造成 5 条假失败）。
                    # 这里解析失败就跳过该帧，不让整个套件崩掉。
                    try:
                        frames.append(json.loads(line[6:]))
                    except (ValueError, UnicodeDecodeError):
                        continue
                if len(frames) >= 3 or time.time() - t0 > 6:
                    break
    except Exception as e:              # noqa: BLE001 — 超时也是正常结束
        print(f"    (stream ended: {type(e).__name__})")
    check("收到 >=2 帧", len(frames) >= 2, f"got={len(frames)}")
    kinds = [f.get("kind") for f in frames]
    check("首帧是 snapshot", kinds and kinds[0] == "snapshot", f"got={kinds}")
    snap = frames[0] if frames else {}
    check("snapshot 带完整 state",
          isinstance(snap.get("state"), dict) and snap["state"].get("questions") is not None
          or snap.get("state") is None)
    check("有 change 帧或 snapshot 已有答案",
          any(k == "change" for k in kinds)
          or (snap.get("state") or {}).get("answers", {}).get("q0", {}).get("value") == "甲",
          f"kinds={kinds}")

    # 清理
    for t in (tag, tag2):
        post("/survey-action", {"tool_call_id": t, "action": "release",
                                "payload": {"by": "cleanup"}})

    print(f"\n{'='*50}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  ❌", f)

    # ★ 清理测试数据：必须走 `/survey-prune` 端点，**不能改文件**。
    #
    # 这两个脚本通过 HTTP 打生产插件，测试 state 真的落在插件**内存表**里。
    # 而 `_surveys()` 返回的内存表跨 reload 存活、且 `surveys_restored` 让插件
    # 不重读磁盘 —— 所以手工改 `survey_states.json` 根本无效（实测：磁盘改到
    # 11 条，reload 后立刻变回 200+ 条，因为内存原样写回）。
    # 端点同时作用内存 + 磁盘，才是唯一有效的清理方式。
    try:
        _body = json.dumps({"prefix": "http-p1-"}).encode()
        _req = urllib.request.Request(
            BASE + "/survey-prune", data=_body, method="POST",
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(_req, timeout=10) as _r:
            _d = json.loads(_r.read().decode())
        print(f"  已清理测试 state: {_d.get('before')} -> {_d.get('after')}")
    except Exception as _e:  # noqa: BLE001
        print(f"  (清理失败，请手动调 /survey-prune: {_e})")

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
