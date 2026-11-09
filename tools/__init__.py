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

            # 题干（必做，硬性要求）：**每一道题都必须写 title（题干文字）**，
            # 不允许只给 options 而省略 title——否则用户只会看到一排选项、
            # 不知道这题在问什么。title 是一句完整的疑问/待裁定陈述，
            # 不是空串、不是仅一个编号。缺 title 的题即便前端会兜底显示"第 N 题"，
            # 也已造成体验缺陷。
            {"type": "single", "title": "本次改动是否只碰 pm-new？", "options": ["A", "B"]}

            # 推荐选项（默认必做）：每道选择题都应标注你推荐的选项原文，
            # 单选用字符串，多选用数组；只有确实完全无法取舍时才留空。
            {"type": "single", "title": "...", "options": ["A", "B"],
             "recommended": "B"}
            {"type": "multi",  "title": "...", "options": ["A", "B", "C"],
             "recommended": ["A", "C"]}

            # 条件题：只有当前置条件成立时该题才显示（可多层嵌套联动）
            {"type": "single", "title": "...", "options": ["A", "B"],
             "showIf": {"q0": ["B"]}}

        recommended 说明（默认应填写）：
            - 值为选项原文（label 或 value 均可匹配）
            - 标注后，用户切到「只用推荐」模式时无需调用模型即可自动采纳
            - 注意：options 必须保持**纯字符串数组**，不要把 recommended
              塞进 options 元素里（后端会 join(options)，对象会报错）

        requires_human 说明（观察题必标，**默认应填写**）：
            - 当某题的答案**只有真人亲眼看到界面/屏幕才能给出**时，把它标为
              `{"type": "single", "title": "你看到推荐徽章了吗？",
                "options": [...], "requires_human": true}`
            - 典型观察题：「你看到了什么」「界面上显示的是什么」「徽章标在哪一项」
            - **不要**给征求意见/判断的题标它：「你觉得这个方案可行吗」
              「你认为哪个更好」—— 那些模型完全可以回答
            - 为什么必须标：ai / 只用推荐 两种自动模式由**模型**作答，而模型无法
              看到用户的屏幕，只能凭题面猜。不标的话，模型会**编造**一个具体但
              错误的观察结果（实测：AI 答"徽章在 B 项"，用户实际"在 A 左侧"）。
              编造比留空有害得多 —— 留空看得出没人答，编造会让后续决策建立在
              假事实上。
            - 标注后：自动模式会跳过该题（留空并标注「AI 跳过：需人工观察」），
              绝不替你编答案；人工模式下照常显示给你作答。
            - 未标注时还有一层关键词兜底（题干含"你看到/你观察到"等），
              但兜底**宁可漏跳不可误跳**，所以请显式标注。

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
