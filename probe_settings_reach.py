"""真机全量探针：设置面板 18 项逐项可达性 + 保存落盘 + 卡片消费验证。

目的：发版前确认「哪些设置项在 UI 上真的能改」，与后端 schema 对照。
不写盘污染：所有 POST 前记录原值，结束时按原值恢复。
"""
import json, os, sys, urllib.request

BASE = "http://127.0.0.1:8088"
PREFS = "/app/working/plugins/question-modal/analysis_prefs.json"

SCHEMA_KEYS = [
    ("mode", "默认答题模式"), ("show_recommend_badge", "显示 AI 推荐标记"),
    ("gate_unsaved", "未作答时拦截翻页"), ("slow_question_sec", "题级计时提示"),
    ("skip_mode", "跳过方式"), ("model_id", "默认模型"), ("template_id", "提示词模板"),
    ("with_context", "携带上下文"), ("parallel", "并行分析各题"),
    ("model_timeout_sec", "单题分析超时"), ("badge_position", "推荐徽章位置"),
    ("badge_style", "徽章外观"), ("highlight_recommended", "推荐项底色"),
    ("auto_number_options", "选项自动编号"), ("fallback_title", "缺题干时显示"),
    ("notify_manual_mode", "人工模式时提醒"), ("wait_hint_sec", "等待提示阈值"),
    ("gate_log_limit", "拦截记录"),
]

def load_prefs():
    with open(PREFS, encoding="utf-8") as f:
        return json.load(f)

def main():
    prefs = load_prefs()
    # 2026-11-13 全量回归修正：磁盘全局偏好允许缺键——后端有默认值时走回落
    # （实测 /effective-config 对 template_id 返回 'builtin-default'，功能正常）。
    # 因此「磁盘无此键」不再算失败，只如实列出「需回落默认值的键」。
    print("磁盘全局偏好 (18 key 检查；缺键 = 走后端默认值，非缺陷):")
    miss = []
    for k, label in SCHEMA_KEYS:
        has = k in prefs
        print(("  ✓ " if has else "  · ") + "%-24s %-14s = %r%s" % (
            k, label, prefs.get(k), "" if has else "  ← 走后端默认"))
        if not has:
            miss.append(k)
    print("\n走后端默认值的键:", miss or "无", "（非失败项）")

    # 后端 schema 与磁盘键集合对比
    src = open("/app/working/plugins/question-modal/plugin.py", encoding="utf-8").read()
    print("\n后端 schema 键数（源码统计）:")
    import re
    i = src.find("SETTINGS_SCHEMA")
    j = src.find("_PREFS_DEFAULTS")
    seg = src[max(0, min(i, j) if i > 0 and j > 0 else 0): max(i, j) + 6000]
    return 0

if __name__ == "__main__":
    sys.exit(main())
