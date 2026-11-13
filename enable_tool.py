"""question-modal 插件安装后启用脚本（每次 plugin install 后都要跑）。

背景：宿主 _sync_plugin_tools_to_agents()（app/routers/plugins.py:286）对插件
新注册的工具一律写死 enabled=False，且描述取 plugin.json 自带文本；卸载时条目被
_remove_tool_plugin_from_agents() 删除。因此每次安装（目录或 zip）后必须手工：
  1) enabled = True（default / wb74Jn）
  2) description 覆盖为 330 字增强版（plugin.json 只有 252 字，缺 multi 场景引导）
用法：python3 enable_tool.py
"""
import json
import pathlib

TOOL = "question_modal"

# 比 plugin.json 多出的一句：multi 场景引导。缺了它，模型会把多选需求拆成
# 多道是/否单选（实测历史 31 次出题 multi 出现 0 次）。
# 与 plugin.py / plugin.json 保持逐字一致（宿主 _sync_plugin_tools_to_agents
# 只补建缺失条目、不更新既有描述，故每次安装后必须用本脚本覆盖）。
DESC = (
    "向用户弹出一个多页问卷并等待回答。"
    "**硬性规则：任何需要用户在若干候选项之间做选择、裁定或确认的场景，"
    "都必须调用本工具；严禁在回复正文里用编号列表、「甲/乙/丙」「A 还是 B」、"
    "表格或问句罗列选项让用户手打回复——纯文字选项用户无法点选，属无效交互。**"
    "判定口诀：若你正准备输出「1. … 2. … 3. …」让用户挑一条，"
    "或以「是否…？」「要不要…？」「要继续还是暂停？」结尾等待用户回答，"
    "就该改用 question_modal。"
    "参数：questions (问题列表), title (标题,可选)。"
    "问题类型：single(单选), multi(多选), text(问答)。"
    "**一道题允许勾选多个答案时用 multi（回传为数组），二选一走 single；"
    "不要为了多选而把它拆成多道是/否单选题。**"
    "所有选择题均含'其他'文本框，其下可添加附件；"
    "问卷末页有独立'其他意见'框（同样支持添加附件）。"
    "支持条件题：任选题可加 showIf（如 {\"q0\":[\"选项B\"]}），"
    "用户选中前置选项后该题自动出现，实现基于前题答案的动态联动。"
    "用户可以跳过本题或整份问卷；跳过或超时后不要再等待，"
    "基于已有信息继续推进。"
)

WORKSPACES = pathlib.Path("/app/working/workspaces")
ENABLE = ["default", "wb74Jn"]          # QwenPaw_QA_Agent_0.2 按既往裁定保持关闭


def main() -> None:
    for agent_id in ENABLE:
        path = WORKSPACES / agent_id / "agent.json"
        if not path.exists():
            print(f"  跳过 {agent_id}（无 agent.json）")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        tools = data.setdefault("tools", {}).setdefault("builtin_tools", {})
        entry = tools.get(TOOL)
        if entry is None:
            print(f"  ❌ {agent_id}: 没有 {TOOL} 条目 —— 插件未安装或未加载")
            continue
        old_enabled = entry.get("enabled")
        old_len = len(entry.get("description") or "")
        entry["enabled"] = True
        entry["description"] = DESC
        entry.setdefault("icon", "❓")
        entry.setdefault("display_to_user", True)
        path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(
            f"  ✓ {agent_id}: enabled {old_enabled} -> True | "
            f"desc {old_len} -> {len(DESC)} 字"
        )
    print("提示：配置改动需重启会话生效（新对话立即生效，旧对话仍用缓存）。")


if __name__ == "__main__":
    main()
