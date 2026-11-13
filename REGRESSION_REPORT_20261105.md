# 发版前全量回归报告（2026-11-05 · 终版）

基线：dist `f9dd94a9` / plugin.py `4f955a7a` / analysis.py `b6ecfb3e` / question_service.py `81f45308` / plugin.json `b5524957`
（dev = installed = served 三处一致，裸 import 0，v2.3.0，pending=0）

## 一、最终成绩：32 套 / 739 项断言 / 0 失败

| 套件 | 断言数 |
|:--|--:|
| harness_rescue.mjs（主回归） | **352** |
| verify_wiring_s4.mjs | 23 |
| verify_ui_modelpick.mjs | 22 |
| verify_templates.mjs | 22 |
| verify_settings_layout.mjs | 21 |
| verify_schema_s1.py | 20 |
| verify_settings_entry2.mjs | 19 |
| verify_builtin_cfg_functions.py（新增） | 19 |
| verify_full_flow_real.py（新增） | 18 |
| verify_tabs_regroup.py | 17 |
| verify_final_names.py | 15 |
| verify_no_false_success.py | 15 |
| verify_card_session_scope.mjs | 14 |
| verify_session_merge.py | 14 |
| verify_fixes.mjs | 13 |
| verify_s5a.mjs | 13 |
| verify_browser_notify_cache.py | 13 |
| probe_symptoms.mjs | 13 |
| verify_cfg_s3.mjs | 11 |
| verify_session_sync.py | 10 |
| verify_follow_session_model.py | 10 |
| verify_scope_badge.py | 9 |
| verify_isolation.py | 8 |
| verify_browser_notify.py | 7 |
| verify_card_real_click.py | 7 |
| verify_submit_path.py | 7 |
| verify_settings_save_real.py | 6 |
| verify_no_note.py / verify_no_opt.py / verify_card_settings_equal.py | 各 5 |
| verify_no_follow_option.py | 4 |
| verify_card_scope_real.py | 2 |
| verify_backend.py / verify_release.py / verify_agent_id.py | PASS |
| **合计** | **739** |

另有 2 套已按裁定标记废弃（`verify_settings_entry.mjs` 旧契约、`verify_cache_purge.mjs` 诊断页已删）。

## 二、9 项内置默认配置 · 功能有效性（19/19）

用户裁定：这 9 项**属内置默认值，不展示、不提供入口，UI 不恢复**；只验证功能是否正常。
方法：真实 Chromium + served bundle，按 `effective-config` 返回不同取值，对比卡片渲染/行为的可观测差异。

| 配置项 | 断言 | 实测证据 |
|:--|:--|:--|
| `show_recommend_badge` | 3 | 开=1 徽章 / 关=0，选项文字完整 |
| `badge_position` | 1 | left `idx=0`（前）/ right `idx=1`（「2. 乙选项」后） |
| `badge_style` | 1 | rect `3px` / round `999px` |
| `highlight_recommended` | 1 | 关 `rgba(127,127,127,0.05)` / 开 `rgba(255,127,22,0.08)` |
| `auto_number_options` | 3 | 开「1. 甲选项」/ 关无编号、文字仍在 |
| `fallback_title` | 1 | 无 title 问卷：开出「第 1 题」/ 关不出 |
| `gate_unsaved` | 4 | 开=拦截+`gate-block` 1 条 / 关=放行+0 条 |
| `skip_mode` | 1 | 逐题有「跳过本题」/ 整卷无 → 按钮集不同 |
| `slow_question_sec` | 3 | 1s 阈值→「⚠️ 本题已超过 1s…」/ 0s→完全不出现 |
| 异常 | 1 | 零 pageerror |

**每项都有可观测差异 = 无死配置。**

## 三、真机全流程（18/18，新增）

真实 Chromium + served bundle + 宿主同构挂载 `R.createElement(card, {data:{content:[{type:"data",data:{call_id,arguments}}]}})`：

- **A 卡片渲染**：单选题干 / 三选项 / AI 推荐徽章 / 多选问答 / 三模式按钮 —— 5/5
- **B 严格闸门**：未作答点「下一步」→ 拦截提示 + `POST /gate-block` 留痕 + 不跳末页 —— 4/4
- **C 作答放行**：选中后「下一步」可用、推进第 2 题 —— 2/2
- **D 三模式**：点「只用推荐」发 `session-prefs`、body `mode=recommend`、**全局 /prefs 零调用**、自动推进并提交、推荐项「乙选项」被采纳 —— 5/5
- **E/F**：零 pageerror、无伪提交、gate_blocks 真实落盘 —— 2/2

## 四、6 套过期用例已修复 + 反证（14/14）

只改测试代码，产品代码零改动。

| 套件 | 修复方式 | 反证注入 | 反证结果 |
|:--|:--|:--|:--|
| verify_final_names.py | N1→4 页签 + N1b/N6b/N7b 反向断言 | SETTINGS_TABS 加回「诊断」 | ✅ N1b 失败 |
| verify_tabs_regroup.py | T1→4 页签 + T3a/T3f 反向 + T7 页签不存在 | 同上 | ✅ T1/T7 失败 |
| verify_browser_notify_cache.py | E3~E9 改为「诊断页已删」反向断言 + `/cache-info`、`/cache-purge` 实测 404/405 | 同上 | ✅ E3 失败 |
| verify_settings_save_real.py | 页签名「当前会话」→「会话模式」 | 断言改回旧页签名 | ✅ V1 失败 |
| verify_isolation.py | 「全局默认」→「全局配置」、「当前会话」→「会话模式」；I1 移到「默认模式」页；I2 改用仍可配的「等待提示阈值」180/60 | 页签名改为不存在 | ✅ I1-前置 失败 |
| probe_symptoms.mjs | `buttons()` 改 `deepText()` 递归取文本（原 `[].join()` 得 `[object Object]`）；选择断言改 `isSelected()` 不依赖编号 | 断言退回硬匹配「✓ 乙」 | ✅ P2b 失败 |

反证全部命中 + 还原后全部重新通过 + 产品代码 src/dist/plugin.py/已安装目录 md5 全部与基线一致（R7~R10）。

## 五、环境限流 2 项（非缺陷）

- `e2e_check.py`：前 6 步全过（问卷弹出 / 阻塞 / 提交 200 / 流结束 / 「苹果」回传 / 摘要出现），终态 `MODEL_QUOTA_EXCEEDED … tpm exhausted`
- `verify_field.py`：同样 429（今日限流 130 条）

## 六、状态卫生

- `analysis_prefs.json` 与基线逐字节一致
- `session_prefs.json` 恢复用户原值 `{mode: manual}`
- `gate_blocks.json` 清理全部测试记录（4→0）
- `pending = 0`，未打扰任何其他会话
- 产品代码 dev = installed = served 三处一致 `f9dd94a9`

## 七、新增脚本（可复跑）

- `verify_full_flow_real.py` —— 真机全流程 18 项
- `verify_builtin_cfg_functions.py` —— 9 项内置配置功能 19 项
- `verify_tests_can_catch.py` —— 反证有效性 14 项（自动备份/注入/还原/校验）
- `probe_settings_tabs_dump.py` —— 设置页签文本 dump 探针

## 八、结论

**功能层面 0 阻断项，可以发版。**产品代码本轮零改动（仅修测试代码）。
