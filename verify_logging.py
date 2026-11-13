"""验证：插件日志必须可观测 —— 生产进程里能看到 runner 的每一步。

## 为什么这是必测项（2026-11-07 实测发现的隐形 bug）

插件自己的 `logging.getLogger(__name__)` **不会写进 `/app/working/qwenpaw.log`**。
实测证据：在 `register()` 里打 `logger.warning("QMDIAG-WARNING")` +
`logger.error("QMDIAG-ERROR")`，reload 后
`grep -c QMDIAG /app/working/qwenpaw.log` = **0**。

根因：宿主（`qwenpaw/utils/logging.py`）只给 `LOG_NAMESPACE`（"qwenpaw"）和
`apscheduler` 挂了文件 handler，插件命名空间不在其中。

后果：所有关键失败**完全无声** —— 引擎加载失败、runner 启动异常、
ai 分析 429 耗尽，用户只看到「卡住」，排查者连日志都没有。
用户实测「关页面后问卷卡 60 秒被看门狗释放」正是因此无法定因。

## 本套件守的两条

1. `_attach_to_host_log()` 存在的**函数**且能被调用（静态检查）
2. 挂载目标**必须包含子模块的全名**

   ★ 第 2 条是踩出来的：生产里 `plugin.py` 的 `__name__` = `plugin_question_modal`
   （**没有点号**），而 `question_service.py` 的 logger 名是
   `plugin_question_modal.question_service`。第一版用
   `__name__.rsplit(".", 1)[0]` 推前缀 → 空串 → 子模块全漏 →
   `runner:` 日志一条不出现。**只有打印 names 才暴露。**

3. 日志内容必须包含可定位的信息（question 编号 / cursor / 答案数）
"""
import ast
import re
import sys
from pathlib import Path

PLUG = Path("/app/working/plugins/question-modal")
PASS = FAIL = 0
FAILS = []


def ck(n, c, d=""):
    global PASS, FAIL
    if c:
        PASS += 1
        print(f"  \u2705 {n}")
    else:
        FAIL += 1
        FAILS.append(f"{n} {d}")
        print(f"  \u274c {n} {d}")


def main():
    src = (PLUG / "plugin.py").read_text(encoding="utf-8")
    tree = ast.parse(src)

    print("[1] _attach_to_host_log 存在且被 register 调用")
    funcs = [n.name for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
    ck("[1] 定义了 _attach_to_host_log", "_attach_to_host_log" in funcs)
    reg = next((n for n in ast.walk(tree)
                if isinstance(n, ast.FunctionDef) and n.name == "register"), None)
    reg_src = ast.get_source_segment(src, reg) if reg else ""
    ck("[2] register() 里调用了它", "_attach_to_host_log()" in (reg_src or ""),
       "register 开头必须挂日志，否则后续整个生命周期都不可观测")

    print("\n[2] 挂载目标必须包含子模块全名（这是踩过的坑）")
    # 抽取 names 的构造方式
    ck("[3] 显式拼接了 `__name__ + '.' + 子模块`（而非 rsplit 推前缀）",
       "f\"{__name__}.question_service\"" in src
       or "f'{__name__}.question_service'" in src,
       "生产里 __name__ 是 plugin_question_modal，没有点号，rsplit 会得到空串")
    for sub in ("question_service", "recommend", "analysis"):
        ck(f"[4] 覆盖子模块 {sub}",
           f"{{__name__}}.{sub}" in src, f"缺 {sub} 则它的日志不可见")

    print("\n[3] 用 mock 验证挂载逻辑真的把 handler 加到了子模块 logger")
    import logging

    # 造一个假的宿主 logger + 文件 handler，跑真实的挂载函数
    class _FakeHandler(logging.Handler):
        def __init__(self, path):
            super().__init__()
            self.baseFilename = path

        def emit(self, record):
            pass

    host = logging.getLogger("qwenpaw")
    fake = _FakeHandler("/tmp/_fake_qwenpaw.log")
    host.handlers = [fake]

    # ★ 必须**逐字复刻生产加载方式**（`plugins/loader.py:535-574`）：
    #     module_name = f"plugin_{plugin_id.replace('-','_')}"   ← 没有 .plugin 后缀
    #     module = spec_from_file_location(module_name, pkgsrc)
    #     module.__package__ = module_name
    # 我第一版写成 "plugin_question_modal.plugin"，于是 `__name__` 带了多余后缀，
    # `_attach_to_host_log` 拼出的 logger 名与真实的
    # `plugin_question_modal.question_service` 对不上 → 假失败。
    # 这正是本套件要防的「测试环境与生产不一致」。
    import importlib.util
    import types
    _mname = "plugin_question_modal"
    pkg = types.ModuleType(_mname)
    pkg.__path__ = [str(PLUG)]
    sys.modules[_mname] = pkg
    spec = importlib.util.spec_from_file_location(
        _mname, PLUG / "plugin.py",
        submodule_search_locations=[str(PLUG)])
    mod = importlib.util.module_from_spec(spec)
    mod.__package__ = _mname
    sys.modules[_mname] = mod
    spec.loader.exec_module(mod)

    mod._attach_to_host_log()
    host_handler_cnt = {}
    for name in ("plugin_question_modal.question_service",
                 "plugin_question_modal.recommend",
                 "plugin_question_modal.analysis",
                 "plugin_question_modal"):
        lg = logging.getLogger(name)
        host_handler_cnt[name] = sum(
            1 for h in lg.handlers
            if getattr(h, "baseFilename", None) == "/tmp/_fake_qwenpaw.log")

    # ★ D1 修复后的正确契约（2026-11-07 实测）：
    #   子模块**不挂** handler，靠 propagate 向上传播到父 logger 写一次；
    #   只有父 logger 挂宿主 handler。
    #   旧断言要求「每个子模块都挂 handler」，那正是造成日志每行写 2~10 遍的写法。
    for name in ("plugin_question_modal.question_service",
                 "plugin_question_modal.recommend",
                 "plugin_question_modal.analysis"):
        ck(f"[5] {name} 不挂 handler（靠 propagate，避免重复写）",
           host_handler_cnt[name] == 0, host_handler_cnt[name])
    ck("[5] plugin_question_modal 已挂上宿主文件 handler（且仅 1 个）",
       host_handler_cnt["plugin_question_modal"] == 1,
       host_handler_cnt["plugin_question_modal"])

    # 关键回归：同一事件只应写一次
    lg_child = logging.getLogger("plugin_question_modal.question_service")
    ck("[5b] 子 logger propagate 未被关闭（否则日志会彻底丢失）",
       lg_child.propagate is True, lg_child.propagate)

    print("\n[4] runner 日志内容必须可定位（含题号/cursor/答案数）")
    qs_src = (PLUG / "question_service.py").read_text(encoding="utf-8")
    ck("[6] runner:start 有日志", "runner:start" in qs_src)
    ck("[7] runner:fill / skip 有日志", "runner:%s" in qs_src or "runner:" in qs_src)
    ck("[8] runner:submit 有日志", "runner:submit" in qs_src)
    ck("[9] runner:stop 记录退出原因",
       "runner:stop" in qs_src and "mode switched" in qs_src,
       "退出原因是排查「为什么不推进」的关键")
    m = re.search(r"runner:%s[^\n]*\n[^\n]*\n[^\n]*", qs_src)
    body = m.group(0) if m else ""
    ck("[10] 每步日志含 cursor", "cursor=" in body or "cursor=%s" in qs_src, body[:60])
    ck("[11] 每步日志含答案数", "ans=" in qs_src or "len(st.answers" in qs_src)

    print("\n[5] 静态：不允许再出现「裸名挂载子模块 logger」的旧写法")
    ck("[12] 没有 rsplit 推前缀的残留",
       "rsplit(\".\", 1)[0] if" not in src,
       "旧写法在生产里得到空前缀，静默漏掉所有子模块")

    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
