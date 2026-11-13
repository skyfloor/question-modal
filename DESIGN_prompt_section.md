---
name: ask-user 插件「使用指引」注入方案（v1 设计）
description: 用插件自持的 register_prompt_section 向系统提示词注入 ask_user 使用指引；不依赖任何技能文件
---

# 背景 / 问题

`default` 智能体的对话中，模型遇到"需要用户做选择"时**输出纯文本选项**（甲/乙/丙），
**不调用 `ask_user` 工具** → 弹窗不出现。

实测证据：
- 该会话中 `ask_user` 仅被调用过 1 次；同一轮"甲/乙/丙"文本出现 14 次，工具调用 0 次。
- 插件链路本身正常（我用真实请求对 `default` 测通：创建 pending → 阻塞 → 提交 → 完成）。

根因（两条，均为"模型不知道该用"）：
1. **工具描述过短**（`default` 只剩 117 字），只说"能弹问卷"，未说"何时该弹"。
2. **系统提示词中无任何指引**：`default` 的 SOUL/PROFILE 中 `ask_user` 提及 0 次。

# 约束（用户明确）

> 这是一个插件，**不应该直接去依赖其他技能**，只需要 agent 本身的一个内容。

→ 禁止改 `pm-req` 等技能文件；指引必须由**插件自持**。

# 方案

用宿主官方扩展点 **`api.register_prompt_section()`**（`plugins/api.py:1151`）：

```python
api.register_prompt_section(
    name="ask-user-usage",
    after="workspace",            # 必须用宿主 anchor：workspace|multimodal|env_context
    provider=lambda agent: SECTION_TEXT,
    agent_id=None,                # None = 全局，对所有 agent 生效
)
```

- 注入位置：系统提示词中 `workspace` 锚点之后（`agents/prompt_builder.py:30`）。
- 由**插件自己**提供文本，与任何技能解耦；插件卸载即消失。
- **无需改任何 agent 配置**（不写 `agent.json`）→ 零权限风险、随插件版本自动更新。

# 注入文本（草稿）

```
## ask_user 工具使用指引
当需要用户做选择、确认分支或澄清歧义时，使用 ask_user 工具以问卷形式收集答案，
而不是在回复正文里罗列选项。

- 适用：二选一/多选一/需要用户裁定的事项、方案取舍、范围确认、需要用户拍板的阻断项。
- 做法：把每个选项写成 questions 里的选项；需要用户补充说明时用 text 类型问题。
- 条件题：后一题依赖前一题答案时，用 showIf（如 {"q0":["选项B"]}）让它在选择后自动出现。
- 不要：先用文字列出"甲/乙/丙"再等用户手打回复——那是无效选项，用户无法点选。
```

# 验证方式

1. 重装插件 → 观察日志出现 `registered prompt section 'ask-user-usage' after 'workspace'`。
2. 组装后的系统提示词包含该段（可用 `PromptBuilder` 或向 agent 发实际请求观察是否开始调用工具）。
3. 端到端：向 `default` 发一个"需要二选一"的请求，观察是否改为调用 `ask_user`。

# 风险 / 边界

- 提示词注入会略微增加 token 消耗（约 200 字/请求），可接受。
- 对所有 agent 生效（含无需该工具的 agent）；如需限定，可用 `agent_id` 或 `condition` 参数。
- 若宿主 anchor 名变化，注册会抛 `ValueError`（会记录日志并跳过）——需回归确认。
