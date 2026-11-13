# THREE_ISSUES — 用户报的三个运行时问题：定性结论（2026-11-05）

> 本文只记录**根因定性**，不含修复。修复需 HITL 确认后再动手。

复现工具：`probe_three_issues_cases.mjs`（生成 `__probe_three.mjs`，复用 harness 的假宿主运行时）
当前产物：dist `f9dd94a9`（v2.4.0 已发布版）· 插件 loaded/enabled

---

## 问题 1「点击分析时切换模式，会导致问卷题目自动使用推荐」

### 用户描述与实测的差异

实测**不能复现「切到人工后仍自动采纳」**（[P1b]/[P1c-1] 全绿）：
- AI 分析进行中切「人工」→ 已选仍为空、未推进、未提交 ✅ 正确
- 人工模式点「开始分析」→ 分析落定 → 不自动采纳 ✅ 正确

**但复现出两个真实缺陷**（比用户描述更具体）：

### 1A 切到「自动分析」会立刻把整卷跑完并提交，且答错题

实测（[P1c-2]）：

```
人工模式 → 点「开始分析」→ 分析落定（不采纳，正确）
→ 点「自动分析」→ answered=true, visStep=3, 提交 1 次
   提交体: q0="乙", q1="丁", q2="乙"   ← q2 是【问答题】，被填成 "乙"
```

`q2` 是开放题（`type:"text"`），却拿到了 `"乙"`——这是**第一题的选项值**。

### 1B 根因：缓存按「可见位置」存，却取 `per_question[0]`

`src/index.tsx:4481-4483`：

```ts
const resolved = qResultsRef.current[qi];
const p0 = resolved && resolved.per_question && resolved.per_question[0];
const cachedChoice = p0 ? String(p0.choice || "").trim() : "";
```

`per_question[0]` 永远取**数组第一条**，而不是「本题」那一条。当后端返回的
envelope 含多题（`get_question_analysis` 的 `index is None` 分支、或
`env.per_question` 容错分支）时，缓存里的 `per_question[0]` 可能是另一题的结论 →
**串题**：问答题被填上选择题的选项。

后端 `analysis.py:228-239` 确认了这条路径：
- `index is None` → 返回整卡 envelope（多题）
- `index` 有值但 `#qN` 键不存在 → 遍历 `env.per_question` 找 `p.index == index`，
  找不到就 `return None`。所以**正常**情况不会串。
- 真正串的来源是前端：`qResultsRef` 按 `visStep`（**可见位置**）存，而
  `per_question[i].index` 是**真实题号**。可见列表会因 `showIf` 收窄，
  两个编号空间一旦不等（有隐藏题），`per_question[0]` 与 `visStep` 就对不上。

### 1C 隐藏题让两个编号空间错位（可证）

`build_answered_context` 与驱动均按 `visList` 映射；`qResultsRef.current[visStep]`
用可见位置，`per_question[0].index` 用真实题号。含 `showIf` 的问卷必错位。

### 1D 另一个独立缺陷：切到「只用推荐」会把整卷跳过并提交

实测（[P1b-1]）：
```
AI 分析进行中 → 切「只用推荐」→ 已选: []  answered: true  visStep: 3  answer: 1 次
```
三题全被标 `skipped: true` 提交。原因：`recommend` 模式的推荐来源是
`questionRecommended(question)`（出题时标注）+ 缓存；测试问卷 q1 有 `recommended`
但 q0/q2 没有。**用户投诉的「自动使用推荐」很可能就是此模式**：切到只用推荐等于
「三题全跳过」——问卷被静默答完，用户看不到任何推荐被采纳。

---

## 问题 2「多个浏览器标签页数据冲突，在推荐和自动中不停切换」

### 已实测确认（[P2b-1] / [P2b-2]）

```
标签页A 选「甲」→ localStorage answers.q0="甲"
标签页B 挂载同一 call_id → 继承 "甲"
标签页B 改选「乙」→ answers.q0="乙"（覆盖 A）
标签页A 回到前台 → 看到 "乙"（A 的选择被悄悄改掉）
```

### 根因

1. **卡片状态键只按 `call_id`**（`src/index.tsx:1882` `STATE_LS_PREFIX`）。
   同一张问卷在两个标签页渲染 = 两个实例共用**同一条 localStorage 记录**，
   每个实例的事件处理都 `mergeCardState()` 全量写回 → 后写覆盖先写。
2. **完全没有跨标签页协调**：`addEventListener("storage")` / `BroadcastChannel` /
   `visibilitychange` 出现次数均为 **0**。
3. **模式写盘无版本/无锁**：`pushSessionOverride` 是 fire-and-forget POST，
   两个标签页各自的 `applyPrefs` 都能写 → 最后到达的获胜，表现就是「不停切换」。
4. **配置只读一次**：`fetchEffectiveConfig` 仅在挂载时调用一次，另一个标签页改了
   模式后，本标签页**不会重读**，于是两边各按各的模式驱动 → 两边都在自动推进 →
   都去提交 → 互相覆盖。

---

## 问题 3「问卷在后台（未打开会话页面）不会继续执行」

### 已实测确认（[P3b]）

**在无 DOM 的假环境下卡片仍能自行推进并提交**（answer 请求 2~4 次、进入「已完成」）。
`document.querySelector` 全部返回 null 也不影响驱动。

### 所以问题 3 不是「依赖 DOM」，而是架构层面：

**整个驱动循环活在前端 React effect 里**。标签页关闭 / 浏览器后台时：
- 浏览器会**节流甚至冻结**后台标签页的定时器（Chrome: 后台 1 次/分钟，
  长时间后台整个 tab 被 freeze），自动提交的重试、`setVisStep` 链都会停摆；
- 用户关闭标签页 → 该标签页的 JS 上下文**直接消失**，驱动彻底停止；
- 后端确认**没有任何驱动/自动提交逻辑**（`plugin.py` / `question_service.py`
  里 `auto_submit` / `auto_drive` / `autofill` 命中数 = 0）。

结论：**问卷的自动推进完全依赖「有活跃浏览器页面」**，与用户期望的
「问卷属于上下文，不受页面影响」直接冲突。要真正满足需要把驱动搬到后端
（或至少由后端定时推进 + 前端只是视图）。

---

## 汇总表

| # | 用户描述 | 实测是否复现 | 定性 |
|:--|:--|:--|:--|
| 1 | 点击分析时切模式→自动使用推荐 | **部分**：切人工不会；但切「自动分析」会串题填错、切「只用推荐」会整卷跳过提交 | 前端缓存**串题**（`per_question[0]` vs `visStep`）+ recommend 模式静默跳过语义 |
| 2 | 多标签页数据冲突、模式来回切 | **是**（决定性复现） | 卡片状态键仅 `call_id`、零跨标签协调、配置只读一次 |
| 3 | 后台不打开会话就不执行 | **否**（无 DOM 仍能跑）| **架构问题**：驱动全在前端 effect，标签页关闭/被 freeze 即停；后端无驱动逻辑 |

## 待用户裁定的修复方向（未动手）

1. **1B 串题**：缓存按真实题号索引（`per_question.find(p => p.index === realIdx)`），
   并统一 `qResultsRef` 的键空间。属明确缺陷，建议直接修。
2. **1D recommend 整卷跳过**：需要在「无推荐」时给出可见提示而非静默跳过；
   或改为停留在该题等用户处理。
3. **2 多标签**：三种可选——
   a) 最小：`call_id` + 标签页 id 组成状态键（各标签独立）；
   b) 中等：加 `storage` 事件监听 + 以 `ts` 判新旧，冲突时提示；
   c) 彻底：状态收归后端（服务端持有单一副本，前端只读）。
4. **3 后台执行**：需把驱动搬到后端。改动面最大，需单独设计。
