"""诊断多终端配置不同步：模拟「设备 A 改 → 设备 B 读」完整链路。

## 用户需求
同一会话，设备 A 改了设置，设备 B 访问同一会话应看到相同设置（云同步），
而不是在设备 B 重新设置一次。

## 后端存储模型
- 全局默认：analysis_prefs.json（所有会话共享）
- 会话覆盖：session_prefs.json，**按 chat UUID 键**（每个会话一份）
- 读路径：GET /effective-config，三层合并 内建 → 全局 → 会话覆盖

## 本探针验证什么
设备 A / 设备 B 在本探针里模拟为「两个不同的前端实例，但访问同一个会话」。
关键：两个实例必须解析到**同一个 chat_id**，否则会话覆盖互不可见。

逐环验证：
  环1  设备 A 写会话覆盖（改 model）
  环2  设备 B 用**相同 session_id** 读 effective-config → 应看到设备 A 的 model
  环3  设备 B 用**不同 agent_id** 读（模拟 agent 上下文差异）→ 仍应一致
  环4  设备 B 用**空 session_id** 读（模拟面板拿不到会话）→ 只能回落全局
"""
import json
import sys
import urllib.request

BASE = "http://127.0.0.1:8088/api/question-modal"


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=15) as r:
        return json.loads(r.read().decode())


def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, method="POST",
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode())


PASS = FAIL = 0
FAILS = []


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


def eff(session_id, agent_id=""):
    q = f"?session_id={session_id}&agent_id={agent_id}"
    d = get("/effective-config" + q)
    cfg = d.get("config") or {}
    return d.get("chat_id"), cfg.get("model_id"), d.get("has_session")


def main():
    # 用一个真实存在、但有会话覆盖的 session（从 session_prefs 反查最稳）
    sp = json.load(open("/app/working/plugins/question-modal/session_prefs.json",
                        encoding="utf-8"))
    overrides = sp.get("sessions") or {}
    # 挑一个做实验（记录原值以便还原）
    target_sid, target_cid, orig = None, None, None
    rows = get("/effective-config?session_id=&agent_id=")  # 占位，真正找用下面
    # 直接从 session_prefs + chats 反查一个 session_id
    import types
    sys.path.insert(0, "/app/working/plugins/question-modal")
    for cid, ov in overrides.items():
        if ov.get("model_id"):
            target_cid, orig = cid, ov.get("model_id")
            break
    # 反查 session_id
    mname = "plugin_question_modal"
    import types
    import importlib.util
    pkg = types.ModuleType(mname)
    pkg.__path__ = [str(__import__("pathlib").Path("/app/working/plugins/question-modal"))]
    sys.modules[mname] = pkg
    spec = importlib.util.spec_from_file_location(
        mname, "/app/working/plugins/question-modal/plugin.py",
        submodule_search_locations=[str(__import__("pathlib").Path("/app/working/plugins/question-modal"))])
    mod = importlib.util.module_from_spec(spec)
    mod.__package__ = mname
    sys.modules[mname] = mod
    spec.loader.exec_module(mod)
    for r in mod._iter_agent_chats():
        if r.get("chat_id") == target_cid:
            target_sid = r.get("session_id")
            target_agent = r.get("agent_id")
            break

    print(f"实验会话: chat={target_cid[:12]}… session={target_sid} agent={target_agent}")
    print(f"原始 model_id = {orig!r}\n")

    print("[环0] 基线：两台设备读同一会话，应完全一致")
    a_cid, a_model, a_hs = eff(target_sid, target_agent)   # 设备 A
    b_cid, b_model, b_hs = eff(target_sid, target_agent)   # 设备 B
    print(f"    设备A: chat={a_cid[:12]}… model={a_model!r} has_session={a_hs}")
    print(f"    设备B: chat={b_cid[:12]}… model={b_model!r} has_session={b_hs}")
    ck("环0 设备A/B 解析到同一 chat_id", a_cid == b_cid, f"{a_cid} vs {b_cid}")
    ck("环0 基线配置一致", a_model == b_model, f"{a_model} vs {b_model}")

    print("\n[环1] 设备 A 改 model（写会话覆盖）")
    new_model = "probe-sync-model"
    # ★ 端点认的字段是 `settings`（不是 `prefs`）。第一版探针发的是 `prefs`，
    #    后端 `body.get("settings")` 取到 None → 走「空对象=清空整条覆盖」语义，
    #    结果不是写入而是**清空**，读回的是全局默认值 —— 造成「写入没生效」的假象。
    #    这种「探针字段名错导致假失败」最危险：会让人去修一个不存在的后端 bug。
    r = post("/session-prefs", {
        "session_id": target_sid, "agent_id": target_agent,
        "settings": {"model_id": new_model},
    })
    ck("环1 写入成功", r.get("ok") is True, r)

    print("\n[环2] 设备 B 读同一会话（关键：应看到设备 A 的改动）")
    a_cid, a_model, _ = eff(target_sid, target_agent)
    b_cid, b_model, _ = eff(target_sid, target_agent)
    print(f"    设备A 读到 model={a_model!r}")
    print(f"    设备B 读到 model={b_model!r}")
    ck("环2 设备B 看到设备A 的改动（同会话同步）",
       b_model == new_model and a_model == new_model,
       f"A={a_model} B={b_model}")
    ck("环2 两设备仍解析到同一 chat_id", a_cid == b_cid)

    print("\n[环3] 设备 B 用不同 agent_id 读（模拟 agent 上下文差异）")
    other = "default" if target_agent != "default" else "wb74Jn"
    x_cid, x_model, _ = eff(target_sid, other)
    print(f"    agent={other} → chat={x_cid[:12]}… model={x_model!r}")
    ck("环3 换 agent_id 仍解析到同一 chat 与配置",
       x_cid == a_cid and x_model == new_model, f"{x_cid} {x_model}")

    print("\n[环4] 空 session_id（模拟面板拿不到会话上下文）")
    n_cid, n_model, n_hs = eff("", "")
    print(f"    chat={n_cid[:12] or '空'} model={n_model!r} has_session={n_hs}")
    ck("环4 空会话只能回落全局（不等于会话值，属预期降级）",
       n_cid == "", f"{n_cid}")

    # 还原
    print("\n[还原] 恢复原 model_id")
    post("/session-prefs", {
        "session_id": target_sid, "agent_id": target_agent,
        "settings": {"model_id": orig},
    })
    _, back, _ = eff(target_sid, target_agent)
    print(f"    还原后 model={back!r} (原 {orig!r})")
    ck("还原成功", back == orig, f"{back} vs {orig}")

    print(f"\n{'=' * 56}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
