# -*- coding: utf-8 -*-
"""Dummy ``question_modal`` tool function (QwenPaw 2.x).

Registered via ``api.register_tool`` so the LLM can discover and call it.
The real popup + blocking logic lives in the ``on_acting`` middleware
installed by :mod:`plugin`.  If this body ever actually runs, the
interception failed and we return a marker so the failure is visible
instead of silently hanging.
"""


async def question_modal(questions: list[dict], title: str = "") -> str:
    """向用户弹出一个多页问卷并等待回答。

    调用后会在屏幕上弹出问卷窗口，用户可以逐页回答。
    支持单选（single）、多选（multi）、问答题（text）。
    所有选择题均附带"其他"文本框。
    问卷最后一页有一个与问题同级的"其他意见"文本框。

    Args:
        title: 问卷标题（可选）
        questions: 问题列表，每项为：
            {"type": "single", "title": "...", "options": ["A", "B", ...]}
            {"type": "multi",  "title": "...", "options": ["A", "B", ...]}
            {"type": "text",   "title": "..."}

            # 条件题：只有当前置条件成立时才显示（可多层嵌套联动）
            {"type": "single", "title": "...", "options": ["A", "B"],
             "showIf": {"q0": ["B"]}}

        showIf 说明（可选字段）：
            - 键（key）：引用题目，可用序号 "q0"/"q1"…，或该题的 title 原文
            - 值（value）：字符串或数组
                * 数组 = 其中任一命中即显示（OR）
                * 多个键之间 = 全部成立才显示（AND）
                * 加前缀 "=" 表示精确匹配（默认是宽松包含匹配）
            - 未被选中的分支会被自动跳过；其答案不会提交给模型
            - 示例：先问"用哪种方式实现？"，选"用设计器做表单"后才追问
              "打印页面要不要新建能力？"

    Returns:
        JSON 字符串，格式为：
        {"answers": {qN: {type, value, other}, ...}, "other": "...", "skipped": false}
        或 {"skipped": true}（用户跳过）
    """
    return (
        '{"skipped": true, "error": "question_modal 未被插件中间件拦截，'
        '请检查 question-modal 插件是否正常加载"}'
    )
