"""守护测试：插件必须以「生产加载方式」可用 —— 不依赖 sys.path 里塞插件目录。

## 为什么必须有这一套

**实测更正（2026-11-07）**：我一度认为 `_runner_loop` 里的裸 `import recommend`
在生产必然 `ModuleNotFoundError` —— **这个判断是错的**。宿主
`qwenpaw/plugins/module_isolation.py` 有 import redirector，会把插件树内的
裸 import 重定向到 `plugin_<id>.<name>`，实测改成裸 import 后
`/engine-status` 仍报 available=true。

但本套件仍然有价值，它守的是**另一个真问题**：插件必须以"包内相对导入"
工作，且不依赖「开发目录恰好等于 CWD / 在 sys.path 里」这种偶然条件。
早期我确实因此得到过与生产不一致的结论（测试脚本 insert 了 sys.path）。

另外它守住了「引擎符号齐全」：`recommend.py` 若被误删/改名/漏同步，
`[P2]` 与 `[P4]` 会立刻失败，而 `/engine-status` 也会如实报不可用。

本套件用**严格的生产加载方式**跑：把插件目录作为包里 `__path__` 挂上去，
**不**修改 `sys.path`，然后断言每个模块都能加载、关键符号都在。

## 反证

把 `from . import recommend as rec` 改回 `import recommend as rec`
→ `[P2]` 必须失败。
"""
import importlib.util
import pathlib
import sys

# ★ 测试隔离：把问卷 state 写到临时文件，**绝不能碰生产文件**。
#
# 事故记录（2026-11-07）：验证脚本在独立进程里跑，内存表里只有自己造的几条；
# 结尾调 `_persist_surveys()` 时把那份近乎空的内存表写出去，
# **直接覆盖了生产进程的 221 条真实 state**（实测变成 0 条）。
# 现在 `question_service._resolve_survey_file()` 支持这个环境变量覆盖，
# 设上它，生产文件完全不被触碰。
import os as _os
import tempfile as _tempfile
_os.environ.setdefault(
    "QM_SURVEY_STATE_FILE",
    _os.path.join(_tempfile.gettempdir(), "qm_test_survey_states.json"),
)
import types

PLUG = pathlib.Path("/app/working/plugins/question-modal")
PASS = FAIL = 0
FAILS = []


def ck(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  \u2705 {name}")
    else:
        FAIL += 1
        FAILS.append(f"{name} {detail}")
        print(f"  \u274c {name} {detail}")


def load_as_package(pkg_name="qm_prod_sim"):
    """按生产方式加载：包 + 子模块，绝不把插件目录塞进 sys.path。"""
    # 先把可能残留的同名顶层模块清掉，否则会掩盖裸 import 的问题
    for stray in ("recommend", "analysis", "question_service", "plugin"):
        sys.modules.pop(stray, None)

    pkg = types.ModuleType(pkg_name)
    pkg.__path__ = [str(PLUG)]
    sys.modules[pkg_name] = pkg
    mods = {}
    for name in ("question_service", "recommend", "analysis"):
        spec = importlib.util.spec_from_file_location(
            f"{pkg_name}.{name}", PLUG / f"{name}.py")
        m = importlib.util.module_from_spec(spec)
        sys.modules[f"{pkg_name}.{name}"] = m
        try:
            spec.loader.exec_module(m)
            mods[name] = m
        except Exception as e:  # noqa: BLE001
            mods[name] = e
    return mods


def main():
    print("[P0] 前置：消除一切能让「裸 import」命中的路径")
    #
    # ★ 本套件要证明的正是「裸 import 在生产环境会失败」，所以测试环境必须
    # 等价生产。而 Python 的 `sys.path` 里天然有能命中它的位置：
    #   • `sys.path[0]` = 脚本所在目录（本文件常与 recommend.py 同目录）
    #   • `""`           = 当前工作目录
    #   • 插件目录本身（若曾 insert 过）
    # 只要其中任何一个含 recommend.py，裸 import 就"成功"，反证前提被破坏。
    # 本轮就因此假失败过一次 —— 诊断输出点名命中
    # `/app/working/build/question-modal-dev/recommend.py`（开发副本同目录）。
    here = pathlib.Path(__file__).resolve().parent
    drop = {PLUG.resolve(), here, pathlib.Path.cwd().resolve()}
    removed = []
    for entry in list(sys.path):
        try:
            resolved = pathlib.Path(entry or ".").resolve()
        except Exception:  # noqa: BLE001
            continue
        if resolved in drop:
            removed.append(entry)
            sys.path.remove(entry)
    while "" in sys.path:
        sys.path.remove("")
    still = [p for p in sys.path
             if not p or pathlib.Path(p).resolve() in drop]
    ck("[P0] 可能命中裸 import 的目录已全部移除（等价生产）",
       not still, f"仍残留 {still}（已移除 {removed}）")

    print("\n[P1] 以包形式加载三个模块（不塞 sys.path）")
    mods = load_as_package()
    for name in ("question_service", "recommend", "analysis"):
        m = mods.get(name)
        ck(f"[P1] {name} 可加载", isinstance(m, types.ModuleType),
           repr(m) if isinstance(m, Exception) else "")

    qs = mods.get("question_service")
    rec = mods.get("recommend")
    if isinstance(qs, Exception) or isinstance(rec, Exception):
        print("\n模块加载失败，后续跳过")
        return report()

    print("\n[P2] *决定性*：真实 runner 路径能否拿到 recommend 引擎")
    #
    # ★ 这一条必须驱动**生产代码里的那一行**，不能在测试脚本里自己写一句
    # `from qm_prod_sim import recommend` —— 那测的是测试脚本，不是 runner。
    # 本轮就吃过这个亏：把源码改回裸 import 后 [P2] 仍然通过（它测的是自己），
    # 只有 [P5] 的静态检查命中。
    #
    # 做法：建一个最小问卷 → 起 runner → 看它有没有把答案填进去。
    # 拿不到引擎时 `_runner_loop` 会在第一句 import 失败后直接 return，
    # 于是状态永远是 cursor=0 / answers 为空。
    import asyncio

    async def drive():
        svc = qs.get_question_service()
        tag = "call_pluginload_guard"
        svc._surveys().pop(tag, None)
        svc.ensure_survey(
            tag,
            session_id="s", agent_id="a", title="load-guard",
            questions=[{"type": "single", "title": "Q", "options": ["甲", "乙"],
                        "recommended": "乙"}],
            mode="recommend",
        )
        svc.ensure_runner(tag)
        task = svc._runners().get(tag)
        for _ in range(60):
            await asyncio.sleep(0.05)
            st = svc.get_survey(tag)
            if st is not None and (st.answers or st.cursor or st.status != "pending"):
                break
            if task is not None and task.done():
                break
        st = svc.get_survey(tag)
        got = dict(st.answers or {}) if st else {}
        cursor = st.cursor if st else 0
        svc.stop_runner(tag)
        svc.stop_watchdog(tag)
        svc._surveys().pop(tag, None)
        svc._persist_surveys()
        return got, cursor

    filled, cur = asyncio.run(drive())
    ck("[P2] runner 真的跑起来了（把推荐填进答案）",
       filled.get("q0", {}).get("value") == "乙",
       {"answers": filled, "cursor": cur})

    # 反证：裸 import 在生产环境下必须失败（证明 [P2] 不是恒真）
    bare_ok = True
    _hit = "?"
    try:
        import recommend  # noqa: F401,F811
        _hit = getattr(recommend, "__file__", "??")
    except ModuleNotFoundError:
        bare_ok = False
    except Exception as e:  # noqa: BLE001
        bare_ok = False
        _hit = f"err {e}"
    if bare_ok:
        print(f"    [诊断] 裸 import 命中: {_hit}")
        print(f"    [诊断] sys.path[0:3] = {sys.path[:3]}")
        print(f"    [诊断] 顶层 recommend 来源: {sys.modules.get('recommend')}")
    ck("[P3] 裸 import recommend 在无 sys.path 时必须失败（反证前提）",
       bare_ok is False, "裸 import 竟然成功了 → 测试环境被污染")

    print("\n[P4] 关键符号齐全（改坏任一即失败）")
    for fn in ("step_once", "prune_hidden", "visible_indices", "is_visible",
               "chosen_tokens", "question_recommended", "choice_for_question",
               "filled_answer", "q_type", "opt_value", "opt_label"):
        ck(f"[P4] recommend.{fn}", callable(getattr(rec, fn, None)))
    for fn in ("ensure_runner", "stop_runner", "_runner_loop",
               "_runner_submit", "_sync_runners", "_runners"):
        ck(f"[P4] QuestionService.{fn}",
           hasattr(qs.get_question_service(), fn))

    print("\n[P5] 裸 import 只允许出现在 ImportError 兜底里（静态检查）")
    #
    # 合法形态（且仅此一种）：
    #     try:
    #         from . import recommend as rec
    #     except ImportError:
    #         import recommend as rec        ← 顶层模块加载时的兜底
    #
    # 裸 import 出现在别处 = 依赖宿主 redirector 的隐式行为，属于不该有的
    # 耦合。判断方式是看它**前一行的缩进更少且是 except**（兜底块的标志）。
    src = (PLUG / "question_service.py").read_text(encoding="utf-8")
    lines = src.splitlines()
    bad = []
    for i, ln in enumerate(lines):
        body = ln.strip()
        if not body.startswith("import "):
            continue
        name = body.split()[1].split(".")[0]
        if name not in ("recommend", "analysis", "question_service", "plugin"):
            continue
        # 向上找最近的非空、非注释行，必须是 except 子句开头
        j = i - 1
        while j >= 0 and (not lines[j].strip()
                          or lines[j].strip().startswith("#")):
            j -= 1
        prev = lines[j].strip() if j >= 0 else ""
        if not prev.startswith("except"):
            bad.append(f"L{i + 1}: {body}")
    ck("[P5] 无「无保护」的裸同包 import", not bad, bad[:3])

    return report()


def report():
    print(f"\n{'=' * 54}")
    print(f"结果: {PASS} 通过 / {FAIL} 失败")
    for f in FAILS:
        print("  \u274c", f)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
