# -*- coding: utf-8 -*-
"""D7 修复验证：raw JSON 不得再含 __other__。

⚠️ 关键：断言必须落在**整段返回文本**上。
上一轮只断言可读块（display），才让 raw JSON 的泄露漏过去了。
"""
import ast, json, re, typing

SRC = "/app/working/plugins/question-modal/plugin.py"
src = open(SRC, encoding="utf-8").read()
tree = ast.parse(src)


def seg(name):
    for n in ast.walk(tree):
        if isinstance(n, ast.FunctionDef) and n.name == name:
            return ast.get_source_segment(src, n)
    raise AssertionError(f"找不到函数 {name}")


ns = {"json": json, "Any": typing.Any, "Optional": typing.Optional}
ns["_TYPE_LABELS"] = {"single": "单选", "multi": "多选", "text": "问答"}
for f in ("_sanitize_sentinel", "_fmt_attachments", "_skip_reason_text", "_format_answer_for_llm"):
    exec(seg(f), ns)
fmt = ns["_format_answer_for_llm"]

ok = fail = 0


def ck(name, cond, extra=""):
    global ok, fail
    if cond:
        ok += 1
        print(f"  PASS  {name}")
    else:
        fail += 1
        print(f"  FAIL  {name}   {str(extra)[:170]}")


CASES = [
    ("单选-其他", {"answers": {"q0": {"type": "single", "value": "__other__", "other": "没有看到徽章"}}}),
    ("多选-混入哨兵", {"answers": {"q0": {"type": "multi", "value": ["甲", "__other__"], "other": "补充说明"}}}),
    ("正常单选", {"answers": {"q0": {"type": "single", "value": "乙"}}}),
    ("只选其他未填", {"answers": {"q0": {"type": "single", "value": "__other__", "other": ""}}}),
    ("纯多选", {"answers": {"q0": {"type": "multi", "value": ["甲", "丙"]}}}),
    ("无type", {"answers": {"q0": {"value": "乙"}}}),
    ("末页其他意见", {"answers": {"q0": {"type": "single", "value": "乙"}}, "other": "整体意见"}),
]

print("[D7] 整段返回文本不得含 __other__")
for name, payload in CASES:
    out = fmt(payload)
    ck(f"{name}：全文无 __other__", "__other__" not in out, out[-140:])

print("\n[D7] 净化不能丢信息")
out = fmt(CASES[0][1])
ck("单选其他：other 真实内容仍在", "没有看到徽章" in out, out[-120:])
ck("单选其他：可读块显示 other 文案", "没有看到徽章" in [l for l in out.splitlines() if l.startswith("- q0")][0])
out2 = fmt(CASES[1][1])
ck("多选：保留用户真选的 甲", '"甲"' in out2, out2[-140:])
ck("多选：other 补充仍在", "补充说明" in out2, out2[-120:])
out3 = fmt(CASES[6][1])
ck("末页其他意见保留", "整体意见" in out3, out3[-100:])

print("\n[D7] raw JSON 仍是合法 JSON 且结构未变")
for name, payload in CASES:
    out = fmt(payload)
    raw = out.splitlines()[-1]
    try:
        d = json.loads(raw)
        good = True
    except Exception as e:
        good = False
        d = None
    ck(f"{name}：末行是合法 JSON", good, raw[:100])
    if good and "answers" in payload:
        ck(f"{name}：answers 键保留", "answers" in d, list(d or {}))

print("\n[D7] 单选哨兵归一成空串（而非占位符）")
out = fmt(CASES[0][1])
d = json.loads(out.splitlines()[-1])
ck("value 归一为 \"\"", d["answers"]["q0"]["value"] == "", repr(d["answers"]["q0"]["value"]))
ck("type 字段保留", d["answers"]["q0"].get("type") == "single", d["answers"]["q0"])
ck("other 字段保留", d["answers"]["q0"].get("other") == "没有看到徽章", d["answers"]["q0"])

print("\n[D7] 原始 answer 不被就地修改（深拷贝契约）")
orig = {"answers": {"q0": {"type": "single", "value": "__other__", "other": "x"}}}
snapshot = json.dumps(orig, ensure_ascii=False)
fmt(orig)
ck("调用后原始 dict 未变", json.dumps(orig, ensure_ascii=False) == snapshot, orig)

print("\n[D7] skipped 分支不受影响")
out = fmt({"skipped": True})
ck("跳过文案正常", "用户跳过了本次问卷" in out, out[:60])
ck("跳过分支不含哨兵", "__other__" not in out)

print("\n[D7] 边界：附件 / 嵌套 / 异常结构不崩")
out = fmt({"answers": {"q0": {"type": "single", "value": "__other__", "other": "o",
                              "attachments": [{"name": "a.txt", "size": 10}]}}})
ck("带附件不崩且无哨兵", "__other__" not in out and "a.txt" in out, out[-120:])
out = fmt({"answers": {"q0": {"type": "multi", "value": ["__other__"]}}})
d = json.loads(out.splitlines()[-1])
ck("多选只选哨兵 → 归一为空列表", d["answers"]["q0"]["value"] == [], d["answers"]["q0"])
ck("多选只选哨兵 → 全文无哨兵", "__other__" not in out, out[-100:])

print("\n" + "=" * 56)
print(f"结果: {ok} 通过 / {fail} 失败")
raise SystemExit(0 if fail == 0 else 1)
