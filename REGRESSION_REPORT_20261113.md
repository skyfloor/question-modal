# 发版前全量回归报告 — 2026-11-13（question-modal）

## 结论
**77 套回归：67 PASS / 8 观察型探针 / 2 环境性 / 0 功能回归。**
发布闸门「人工复测」未通过 → **本次停下，未推送 GitHub、未发平台**。
用户裁定：先去 Ctrl+Shift+R 人工复测，通过后再放行 2.4.4。

## 基线（批次 0）
- dist `167921fe1b0f5722033aaba60f3f8f6c`，dev=installed=served 三处一致；裸 import 0。
- 后端 5 文件 dev=installed 一致：plugin `a04eaae1` / question_service `99546b51` /
  analysis `b6ecfb3e` / recommend `6012a126` / tools `__init__` `7c71688d`。
- 插件 loaded/enabled、pending=0；平台最新 **2.4.3 published is_latest**；
  GitHub 远端 HEAD `4b448a3`。

## 发布范围（与平台 2.4.3 托管包逐文件比对）
**只有 `dist/index.js` 一个文件变化**（`aaeecafd` → `167921fe`）。
其余 10 个文件（plugin.py/question_service.py/analysis.py/recommend.py/plugin.json/
README/requirements/LICENSE/tools/__init__.py）逐字节相同。纯前端改动，无后端变更。

## 全量成绩（按 runner 分组）
| 组 | 套数 | 结果 |
|:--|:--|:--|
| core | 9 | 9 PASS（harness 407/407、verify_241 83/83、d7 35/35 等） |
| settings | 34 | 30 PASS + 4 观察型探针（今晚改动主战场全绿） |
| backend | 12 | 9 PASS + 2 环境 + 1 观察型 |
| browser | 9 | 8 PASS + 1 已修（假桩用例同步架构） |
| phase | 11 | 11 PASS（含 phase2_state 25/25、phase2_final 11/11） |
| release | 2 | 1 PASS + 1 环境 |

## 逐个归因（10 项非 PASS，全部非功能缺陷）
1. **8 个观察型/废弃探针**（rc=0、无失败断言）：`verify_settings_entry.mjs`（明确标记废弃）、
   `probe_card_vs_settings.py`、`probe_settings_reach.py`、`probe_settings_tabs_dump.py`、
   `verify_backend.py`、`verify_shared_state.py`、`verify_agent_id.py`、`verify_release.py`。
2. **2 个环境性**：
   - `e2e_check.py` / `verify_release_semantics.py`：自动模式下后端 runner 在轮询间隙
     已把问卷答完，pending 转瞬即逝 → 抓不到；**SSE 里 `question_modal` state=success**。
   - 决定性补验：临时切 manual 重跑 e2e_check → 问卷成功弹出、阻塞验证通过、答案
     「苹果」回传 True；`answered_results.json` 落盘记录里**每题附件 + 末页附件齐全**；
     唯一 `hit_att=False` 是 `MODEL_QUOTA_EXCEEDED / tpm exhausted`（429），
     agent 没能把回传文本继续生成，非附件功能缺陷。测后会话覆盖按开局备份复位。

## 本轮修复的「过期用例」（非产品代码改动，共 11 处）
遵循「不能把过期用例当功能回归」，逐个同步到当前契约：
- `verify_d7_raw_json.py`：exec 列表补 `_skip_reason_text`（产品里存在，脚本漏 exec）。
- `verify_settings_layout.mjs` [N3]：fixture mode=recommend → 断言「仅显示答题模式，隐藏 4 行」。
- `verify_wiring_s4.mjs`：删「还原」按钮 → 改断言「取消」清草稿；W5c 改「保存始终可点」；
  W4-页签改显隐契约。
- `verify_s5a.mjs`：假 DOM 补 `addEventListener/removeEventListener/visibilityState`。
- `verify_notify_cache.py`：`/cache-info`、`/cache-purge` 已按裁定删除 → 整份改为反向断言。
- `verify_browser_notify_cache.py` [E0d]：过滤已删端点 404 的 console 噪音。
- `probe_settings_reach.py`：磁盘缺 `template_id` = 走后端默认值（非失败）。
- `probe_settings_tabs_dump.py`：9 项内置默认配置按裁定不展示 UI → 反向断言。
- `verify_phase4_audit.py`：守卫窗口 400→1600 字符，改正向断言（阶段 4 已修）。
- `_p1page.html`：**关键** — 共享 fixture 仍引用旧 `react-vendor-DgUiRFgt.js`，
  宿主已升级 `C7R1xVLQ` → 5 个真机脚本全 30s 超时；改后全部恢复
  （p1_reopen 4/4、mode_guard 5/5、sse_down 5/5、phase2_final 11/11、nopage 4/4）。
- `verify_full_flow_real.py` / `probe_e2e_real.py`：假桩期望前端自动推进 recommend，
  阶段 2 后推进权在后端 runner、前端让位 → 改为断言「后端在线时前端让位」。

## 状态卫生
- 开局备份 `/tmp/qm_regression_backup_20261113/`（9 个状态文件）。
- 收尾复位：`session_prefs.json`、`analysis_prefs.json` 与开局**逐字节一致**；
  `analysis_results.json`/`templates.json` 未变；`pending` 当前 0（开局那 2 条
  `fix2-*` 测试残留已被测试清理，属改善，未复活）。
- 其余增量（gate_blocks 8→12、survey_states 206→210、answered_results +1）为测试
  正常产物；`survey_states` 里 5 条 pending 是 11-07 历史遗留，开局即存在，未动。
- 版本号 `plugin.json` 曾临时改 2.4.4，因发布未放行**已回退 2.4.3**，
  README 安装示例同步回 2.4.3；dev=installed 一致。

## 发布前核验（已就绪，等人工复测放行）
- 产物形态：裸 import 0；敏感串复刻 release.py 正则扫白名单 10 文件 → **0 命中**。
- 平台最新 2.4.3 → 目标 **2.4.4**；GitHub 远端 HEAD `4b448a3`。
- `release.py --version 2.4.4` 已被「人工复测闸门」正确拦截，**未绕过**。
  放行方式：`python3 release.py --version 2.4.4 --human-verified "用户复测通过 <日期>" ...`

## 人工复测清单（用户执行，需 Ctrl+Shift+R 硬刷新）
1. 设置面板整体视觉（胶囊页签/圆角弹窗/iOS 开关/灰底下拉/蓝色高亮保存按钮）。
2. 右上角「当前运行」只出现 1 个胶囊且可点击切换；切换后跳对应页签，
   底部保存目标文案随之变化（会话模式 / 全局默认）。
3. 答题模式切「只用推荐」→ 默认模型/提示词模板/携带上下文/并行分析 4 行隐藏；
   切「自动分析」「人工」→ 4 行恢复。会话模式页与默认模式页都验。
4. 并行分析提示语 = 「逐题并发调用模型，更快，但更耗额度。」；
   默认模式页说明无「（可被会话覆盖）」。
5. 提示词页文字与参考 HTML 一致；保存按钮始终蓝底高亮、可保存。
