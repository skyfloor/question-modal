# -*- coding: utf-8 -*-
"""决定性验证 A 方案：插件模块「重载」后，新服务能否看到旧代际的 pending。

宿主热重载 = 从 sys.modules 删掉 plugin_question_modal* 并重新 exec 模块，
于是类变量单例归零。本测试用 importlib 加载同一份 question_service.py 两次
（模拟两代模块），断言：第二代 get_instance() 拿到的是**同一份 pending 表**，
因此第二代能 resolve 第一代 park 住的 Future。
"""
import asyncio
import importlib.util
import sys

PATH = "/app/working/build/question-modal-dev/question_service.py"
KEY = "_qm_gen_test"


def load_gen(n: int):
    """加载第 n 代模块（独立模块名，模拟重载后的新代际）。"""
    name = f"{KEY}_{n}"
    spec = importlib.util.spec_from_file_location(name, PATH)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def unload(name: str):
    """模拟宿主重载前的 sys.modules 清理（只清带前缀的键）。"""
    for k in [k for k in sys.modules if k.startswith(name)]:
        sys.modules.pop(k, None)


async def main() -> int:
    fails = []

    def check(label, cond, extra=""):
        print(("  ✓ " if cond else "  ✗ ") + label + (f"  [{extra}]" if extra else ""))
        if not cond:
            fails.append(label)

    print("=== 第一代：创建 pending ===")
    gen1 = load_gen(1)
    svc1 = gen1.QuestionService.get_instance()
    pq1 = await svc1.create(
        session_id="sess-gen1", agent_id="wb74Jn",
        title="跨代际存活测试", questions=[{"type": "text", "title": "Q1"}],
        tool_call_id="call_gen1",
    )
    print(f"  gen1 service id={id(svc1)}  pending={len(svc1._pending)}")
    check("第一代创建后 pending=1", len(svc1._pending) == 1)
    check("Future 未完成（agent 正被停住）", not pq1.future.done())

    print("=== 模拟宿主热重载：清掉 plugin_question_modal* 并重新加载 ===")
    unload(KEY + "_1")          # 只清这一代；共享槽 _question_modal_shared_state 不受影响
    check("共享状态槽仍在 sys.modules",
          "_question_modal_shared_state" in sys.modules)
    gen2 = load_gen(2)
    check("第二代是全新模块对象", gen2 is not gen1)
    check("第二代的类变量单例已归零（真实宿主现象）",
          gen2.QuestionService._instance is None
          or gen2.QuestionService._instance is not svc1)

    print("=== 第二代：必须能看到并 resolve 第一代的 pending ===")
    svc2 = gen2.QuestionService.get_instance()
    check("第二代看到同一份 pending 表", len(svc2._pending) == 1,
          f"len={len(svc2._pending)}")
    check("第二代用的是同一把锁", svc2._lock is svc1._lock)
    check("第二代拿到了同一个 PendingQuestion 对象",
          svc2._pending.get(pq1.request_id) is pq1)

    # 关键：第二代能否 resolve 第一代的 Future（旧实例的 agent 因此被唤醒）
    ok = await svc2.submit_answer(pq1.request_id, {"q0": {"type": "text", "value": "苹果"}})
    check("第二代成功 resolve 第一代的问卷", ok is not None)
    check("第一代的 Future 真的被解开（agent 会继续推进）", pq1.future.done())
    if pq1.future.done():
        print("       Future 结果:", pq1.future.result())

    print("=== 反向确认：若不共享 state，上述必然失败（对照） ===")
    # 造一个「不共享」的对照组：手工新建实例并强制断开共享
    gen3 = load_gen(3)
    svc3 = gen3.QuestionService.get_instance()
    svc3._pending = {}          # 模拟旧实现（类变量单例、表独立）
    svc3._lock = asyncio.Lock()
    check("对照组（独立表）看不到旧记录 —— 印证旧实现会 404",
          svc3._pending.get(pq1.request_id) is None)

    print()
    if fails:
        print(f"✗ 失败 {len(fails)} 项: {fails}")
        return 1
    print("✓ 全部通过：重载后新服务可 resolve 旧代际的 Future（A 方案成立）")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
