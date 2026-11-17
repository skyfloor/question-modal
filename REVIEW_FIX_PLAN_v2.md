# 需求评审修订：执行计划 v2

> 修订依据：需求评审报告 R-1~R-5（2026-11-17）
> 原计划 7 个任务 → 修订后 **9 个任务**（新增 TASK-008 工具 schema、TASK-009 补写跳过条目）

## 任务清单 v2

| 任务ID | 来源 | 描述 | 前置 | 复杂度 | 修订说明 |
|:--|:--|:--|:--|:--:|:--|
| TASK-001 | REQ-001 | 契约层识别：`isOptional(q)` 实现 5 级优先级（显式字段双向优先 + 双词表） | — | S | **优先级排序已按 R-1 修正** |
| TASK-008 | REQ-001 | `tools/__init__.py` docstring 补 `optional` 段（模型可见性） | — | S | **新增（R-2）** |
| TASK-002 | REQ-001 | 前端 `missingOf` 排除可选题 | TASK-001 | M | 不变 |
| TASK-003 | REQ-001 | 后端 `recommend.py` 同源对齐（同词表同优先级） | TASK-001 | M | 不变 |
| TASK-009 | REQ-001 | 前端 `fillOptionalSkips()` + 两步合并顺序（先补后 reconcile） | TASK-002 | M | **新增（R-3）** |
| TASK-004 | REQ-002 | `sanitize_settings` 改签名返回 `(clean, rejected)`，**11 处调用点一并改** | — | **M** | 复杂度 S→M（R-4） |
| TASK-005 | REQ-002 | 前端**全部 5 处** `POST /prefs` 改判 `ok`/`rejected` | TASK-004 | **M** | 范围扩大（R-5），S→M |
| TASK-006 | REQ-003 | 进页签即拉当前阈值填入 `st.threshold` | — | S | 不变 |
| TASK-007 | REQ-003 | 该页改草稿模式 + 底部保存真生效 | TASK-006 | M | 不变 |

## 关键路径

TASK-001 → TASK-002 → TASK-009 → 全部收口
（TASK-008 / 003 可与 002/009 并行；TASK-004 → 005 独立线）

## TASK-004 的 11 处调用点（必须逐个改）

| # | 行号 | 上下文 | 改动 |
|:--:|:--:|:--|:--|
| 1 | `:329` | `_save_prefs_locked` | 取 clean + 收集 rejected 返回给 `post_prefs` |
| 2 | `:768` | `resolve_effective` 全局层 | `clean, _ = ...` 丢弃 rejected |
| 3 | `:787` | `resolve_effective` 会话层 | 同上 |
| 4 | `:807` | `__sources__` 计算 | 同上 |
| 5 | `:1491` | 会话保存路径 | 同上 |
| 6 | `:3126` | `global_keys` | 同上 |
| 7 | `:3152` | `_has_real_value` | 同上 |
| 8 | `:3176` | `session_config` | 同上 |
| 9 | `:3180` | `global_config` | 同上 |
| 10 | `:3348` | scope 判定 | 同上 |
| 11 | `:3357` | scope 判定 | 同上 |

> 🔴 `:768/787/807` 在 `resolve_effective()` 的**读路径**上，改错会波及所有配置读取（卡片、设置面板全受影响）。这 3 处必须重点回归。

## TASK-005 的 5 处前端调用点（必须逐个改）

| # | 行号 | 上下文 | 现状 | 改动 |
|:--:|:--:|:--|:--|:--|
| 1 | `:904` | 配置读取附带保存 | 未判 ok | 判 `d.ok`，false 时提示 rejected |
| 2 | `:921` | 同上（fire-and-forget） | 未判 ok | 至少 console.error 留痕 |
| 3 | `:1355` | `staleSetThreshold` | 只看 `resp.ok` | 判 `d.ok`，false 回滚下拉并显示 rejected 原因 |
| 4 | `:6994` | 偏好加载路径 | 未判 ok | 同上 |
| 5 | `:7148` | `cfgSave` | 判 `resp.ok` 但未判 body.ok | 判 `d.ok`，false 时显示哪些键被拒 |

> 🔴 只改 `:1355` 等于只修了一个入口，其余 4 处仍会把 `ok:false` 当成功 —— 而本次修的正是「界面说谎」。

## 验收补充（来自评审）

| AC | 新增判据 |
|:--|:--|
| AC-5b | `optional:true` + 题干含「必须」⇒ **放行**（R-1 双向优先） |
| AC-9 | `showIf` 隐藏的可选题**不**被补写 |
| AC-10 | 另一标签页已答内容不被补写覆盖（两步合并顺序正确） |
| AC-11 | `tools/__init__.py` docstring 含 `optional` |
