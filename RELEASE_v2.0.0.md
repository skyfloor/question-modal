# RELEASE v2.0.0 — question-modal

发布日期：2026-10-19
GitHub：`5eff2d5`（历史 10 commit）
平台：https://platform.agentscope.io/plugins/question-modal （HTTP 200，published）
包：`/app/working/build/publish/question-modal-2.0.0.zip`，87,456 B，sha256 `313ad5142d7189a8`

## 发布前修复的 P0 缺陷（差点漏发）

`release.py` 的 `PACKAGE_FILES` **漏了 `analysis.py`**，而题级分析 / 提示词模板 /
六步思维链 / max_tokens 修复全在该文件 → 发布包装上后 AI 分析会 ImportError。
已加入白名单（74,858 B → 87,456 B），并解包验证含：
- `build_answered_context`
- `BUILTIN_TEMPLATES`
- `_ANALYSIS_MAX_TOKENS = 4000`

**流程教训：发布前必须解包核对文件清单，不能只看「打包成功」。**

## 元数据补全
- `plugin.json` description：153 → 174 字（原描述没提「只用推荐」，用户装上等于看不到新能力）
- README：141 → 189 行，新增「推荐标记 recommended」「三种驱动模式」「AI 分析（题级）」
  「提示词模板」四节 + 亮点 11–13 条

## 复测依据（用户人工确认）
- 徽章正常显示在推荐项右侧 ✅
- 「只用推荐」零请求 + 自动点选 ✅
- 翻页 + 末页自动提交已验证正常 ✅（用户补答）
- 「无推荐不出徽章」用户选择不补测（未验证）

## 版本号同步
`release.py` 只 bump dev 副本的 plugin.json → 已安装目录仍显示 1.4.0。
已 cp 同步 plugin.json + README 并重载，本机现为 **2.0.0**。

## ⚠️ 遗留问题（第四次踩到，建议修）
`enable_tool.py` 把 agent.json 的工具描述**写回 504 字旧版**，每次都丢 recommended 段。
reload 后必须手工把 `plugin.py` 的 description（635 字）重写进 default/wb74Jn。
**改进方向：让 enable_tool.py 从 plugin.py 解析 description，而不是硬编码旧文案。**

## 最终一致性
| 文件 | md5 前 8 |
|---|---|
| plugin.py | `e2d88d77` |
| analysis.py | `d9b13b34` |
| question_service.py | `f8f5f21b` |
| tools/__init__.py | `1bb74d8a` |
| dist/index.js | `7c0989da` |
| plugin.json | `9b902c95` |
| README.md | `8844d9aa` |

dev = installed = served 全一致；`version=2.0.0 loaded=True enabled=True`；pending=0。
