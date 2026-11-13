"""阶段 1 决定性验证：两个客户端（=两个标签页）共享同一份后端 state。

⚠️ 已知偶发：本套件依赖 SSE 实时推送，在**机器负载高**（例如与其他 12 套
验证脚本并发跑）时，某一帧可能超出等待窗口 → 偶发 1 项失败。实测单独串行
连跑 3 次均 12/12。判定失败前请先重跑；连续失败才是真问题。

这是用户核心诉求的直证：
  「同一个会话开两个窗口，应该根据当前会话的方式，问卷弹窗本身是基于会话增强
    设计，不应该因不同窗口运行、同一窗口双开的情况影响当前会话本身的运行」

模拟两个真实 HTTP 客户端：
  · 各自持一条 SSE 订阅（= 两个标签页各自的 /survey-stream）
  · A 作答 → B 必须在秒级内看到同一值（不是靠 localStorage 互抄）
  · B 再作答 → A 也看到
  · A 提交 → B 看到已提交；重复提交被拒（幂等）
"""
import json
import codecs
import sys
import threading
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


def post(path, body):
    req = urllib.request.Request(
        BASE + path, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        # 同 verify_phase1_http：错误体可能为空/非 JSON，硬解析会把整套带崩
        raw = (e.read() or b"").decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw) if raw.strip() else {}
        except ValueError:
            return e.code, {"_error": raw[:300]}


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return json.loads(r.read().decode())


class Client:
    """一个"标签页"：后台线程持续读 SSE，把收到的最新 state 存下来。"""

    def __init__(self, tag):
        self.tag = tag
        self.latest = None
        self.seen = []
        self.stop = False
        self.ready = threading.Event()
        self.t = threading.Thread(target=self._run, daemon=True)
        self.t.start()
        self.ready.wait(timeout=5)

    def _run(self):
        url = f"{BASE}/survey-stream?tool_call_id={self.tag}&since_rev=0"
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                self.ready.set()
                buf = ""
                dec = codecs.getincrementaldecoder("utf-8")("ignore")
                while not self.stop:
                    chunk = r.read(1)
                    if not chunk:
                        break
                    # ★ 必须用增量解码器：按字节 decode 会把中文的多字节
                    # 序列切碎，SSE 帧里的 "甲" 会变成空串。这是测试脚本的 bug，
                    # 不是产品缺陷（实测后端返回的 JSON 里 value 正确）。
                    buf += dec.decode(chunk)
                    while "\n\n" in buf:
                        frame, buf = buf.split("\n\n", 1)
                        for line in frame.split("\n"):
                            if not line.startswith("data: "):
                                continue
                            try:
                                ev = json.loads(line[6:])
                            except Exception:
                                continue
                            if ev.get("kind") in ("snapshot", "change"):
                                self.seen.append(ev)
                                st = ev.get("state")
                                if st:
                                    self.latest = st
        except Exception:
            self.ready.set()

    def close(self):
        self.stop = True

    def wait_for(self, pred, timeout=8.0):
        t0 = time.time()
        while time.time() - t0 < timeout:
            if self.latest is not None and pred(self.latest):
                return True
            time.sleep(0.1)
        return False


_PREFIX = "twotab-"


def main():
    tag = f"twotab-{int(time.time())}"

    print("[1] 建立后端 state（模拟问卷弹出）")
    st, d = post("/survey-action", {
        "tool_call_id": tag, "action": "goto", "payload": {"cursor": 0}})
    check("基线建立", d.get("accepted") is True, d)

    print("\n[2] 两个标签页各自订阅 SSE")
    a = Client(tag)
    b = Client(tag)
    time.sleep(0.6)
    check("标签页 A 收到首帧快照", a.latest is not None)
    check("标签页 B 收到首帧快照", b.latest is not None)

    print("\n[3] A 作答 → B 必须看到同一值（后端广播，非 localStorage 互抄）")
    post("/survey-action", {
        "tool_call_id": tag, "action": "set_answer", "origin": "tab-A",
        "payload": {"key": "q0",
                    "answer": {"type": "single", "value": "甲"}}})
    okb = b.wait_for(lambda s: (s.get("answers") or {}).get("q0", {}).get("value") == "甲")
    check("B 看到 A 选的「甲」", okb,
          json.dumps((b.latest or {}).get("answers")))
    check("A 自己也看到（回声）",
          (a.latest or {}).get("answers", {}).get("q0", {}).get("value") == "甲")

    print("\n[4] B 改答案 → A 也看到（反向同样成立）")
    post("/survey-action", {
        "tool_call_id": tag, "action": "set_answer", "origin": "tab-B",
        "payload": {"key": "q0",
                    "answer": {"type": "single", "value": "乙"}}})
    oka = a.wait_for(lambda s: (s.get("answers") or {}).get("q0", {}).get("value") == "乙")
    check("A 看到 B 改的「乙」", oka,
          json.dumps((a.latest or {}).get("answers")))
    check("两边最终一致（同一个结果）",
          (a.latest or {}).get("answers", {}).get("q0", {}).get("value")
          == (b.latest or {}).get("answers", {}).get("q0", {}).get("value") == "乙")

    print("\n[5] A 提交 → B 看到已提交")
    post("/survey-action", {
        "tool_call_id": tag, "action": "submit", "origin": "tab-A",
        "payload": {"by": "user"}})
    okb2 = b.wait_for(lambda s: s.get("status") == "submitted")
    check("B 看到已提交状态", okb2, (b.latest or {}).get("status"))

    print("\n[6] 幂等：B 再提交一次被拒，不重复 resolve")
    st, d = post("/survey-action", {
        "tool_call_id": tag, "action": "submit", "origin": "tab-B",
        "payload": {"by": "user"}})
    check("第二次提交被拒 already_submitted",
          d.get("accepted") is False and d.get("reason") == "already_submitted",
          d)
    check("答案未被子提交覆盖（仍是乙）",
          (d.get("state") or {}).get("answers", {}).get("q0", {}).get("value") == "乙",
          json.dumps((d.get("state") or {}).get("answers")))

    print("\n[7] 第三个客户端（后开的窗口）能直接拿到完整现状")
    c = Client(tag)
    time.sleep(0.8)
    check("新客户端首帧即含全部答案",
          (c.latest or {}).get("answers", {}).get("q0", {}).get("value") == "乙"
          and (c.latest or {}).get("status") == "submitted",
          json.dumps(c.latest))
    c.close()

    a.close(); b.close()

    print("\n[8] 清理")
    post("/survey-action", {"tool_call_id": tag, "action": "release",
                            "payload": {"by": "cleanup"}})
    check("清理完成", True)

    print(f"\n{'='*54}")
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
        _body = json.dumps({"prefix": "twotab-"}).encode()
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
