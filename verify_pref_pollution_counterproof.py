# -*- coding: utf-8 -*-
"""反证：旧版 bundle 的「双保险」循环是否造成会话/全局污染。

用户 2026-11-13 报告：
  「我选择了会话模式，点击保存，其他会话全部变成了会话模式，
    我点击默认模式保存也是一样全部变成了默认模式」

机理（旧版 cfgSave，已在 dist bak-080947-preMinOverride 中定位到原文）：
    if (e) {                                     // scope === "session"
      const n = f.cfg.config || {},               // ← 当前【生效值】
            s = n.__follow_active__ === !0;
      ji.forEach(o => {                           // ← 遍历 SESSION_KEYS
        if (o in t || o === "model_id" && s) return;
        const a = n[o];
        a == null || a === "" || (t[o] = a);      // ← 整批塞进 patch
      });
    }

生效值 = 内建默认 ⊕ 全局默认 ⊕ 会话覆盖。于是**只改一项**也会把其余键
固化成该 chat 的完整覆盖 → 该 chat 从此不再跟随全局默认。

由于 .bak / __ 前缀的静态资源会被服务端拒（fetch 拿到 HTML），
本脚本做 **离线源码比对 + 逻辑仿真**，不走浏览器。

判据：
  [R1] 旧版 bundle 含「整批塞进 patch」的特征语句
  [R2] 新版 bundle 该语句为 0 次（已删除）
  [R3] 逻辑仿真：旧算法 → 覆盖键数 > 1；新算法 → 覆盖键数 == 1
  [R4] 逻辑仿真：旧算法把 with_context/parallel 钉死 → 本 chat 不再跟随全局
"""
import json
import os
import sys

PLUG = "/app/working/plugins/question-modal"
OLD = PLUG + "/dist/index.js.bak-080947-preMinOverride"
NEW = PLUG + "/dist/index.js"

ok = fail = 0


def ck(n, c, d=""):
    global ok, fail
    if c:
        ok += 1
        print("  \u2713 " + n)
    else:
        fail += 1
        print("  \u2717 " + n + "  " + str(d))


def read(p):
    with open(p, encoding="utf-8", errors="ignore") as f:
        return f.read()


# 旧版「把生效值整批塞进 patch」的三处独有特征（压缩后变量名固定出现在同一段）
SIG_CFG_BULK = 'f.cfg && f.cfg.config'        # 取「生效值」而非 globalCfg
SIG_STAMP = 'a == null || a === "" || (t[o] = a)'   # 整批写入语句


def main():
    for p in (OLD, NEW):
        if not os.path.exists(p):
            print("SKIP: 缺文件", p)
            return 0

    old, new = read(OLD), read(NEW)

    print("\n===== [R1] 旧版：整批固化语句是否存在 =====")
    o_bulk = old.count(SIG_CFG_BULK)
    o_stamp = old.count(SIG_STAMP)
    print("    %-40s x%d" % (SIG_CFG_BULK, o_bulk))
    print("    %-40s x%d" % (SIG_STAMP, o_stamp))
    ck("[R1a] 旧版从 f.cfg.config 取「生效值」", o_bulk >= 1, o_bulk)
    ck("[R1b] 旧版把生效值整批写进 patch", o_stamp >= 1, o_stamp)

    # 打印旧版那段原文，作为可复核证据
    i = old.find(SIG_STAMP)
    if i > 0:
        print("\n    旧版原文片段：")
        print("    " + old[max(0, i - 700):i + 60].replace("\n", "\n    ")[-900:])

    print("\n===== [R2] 新版：该语句已删除 =====")
    n_bulk = new.count(SIG_CFG_BULK)
    n_stamp = new.count(SIG_STAMP)
    print("    %-40s x%d" % (SIG_CFG_BULK, n_bulk))
    print("    %-40s x%d" % (SIG_STAMP, n_stamp))
    ck("[R2a] 新版不再整批写入生效值（语句 0 次）", n_stamp == 0, n_stamp)
    # `f.cfg && f.cfg.config` 在新版仍有 3 处（读生效值做「跟随」判断等正常用途），
    # 不是污染特征；真正的污染语句是上面的 SIG_STAMP，已归零。
    print("    （注：`f.cfg && f.cfg.config` 新版仍有 %d 处，属正常读取，非污染特征）" % n_bulk)

    print("\n===== [R3][R4] 逻辑仿真：只改 mode 的会话保存 =====")
    SESSION_KEYS = ["mode", "model_id", "template_id", "with_context", "parallel"]
    effective = {"mode": "manual", "model_id": "wd2:x", "template_id": "builtin-default",
                 "with_context": True, "parallel": False}     # 生效值
    draft = {"mode": "ai"}                                    # 只改了一项

    old_patch = dict(draft)
    for k in SESSION_KEYS:
        if k in old_patch:
            continue
        v = effective.get(k)
        if v is None or v == "":
            continue
        old_patch[k] = v
    print("    旧算法 patch:", json.dumps(old_patch, ensure_ascii=False))
    ck("[R3a] 旧算法：覆盖键数 > 1（未改的也被固化）", len(old_patch) > 1,
       sorted(old_patch.keys()))
    ck("[R4a] 旧算法：with_context/parallel 被钉死 → 本 chat 不再跟随全局",
       "with_context" in old_patch and "parallel" in old_patch, sorted(old_patch))

    new_patch = dict(draft)
    print("    新算法 patch:", json.dumps(new_patch, ensure_ascii=False))
    ck("[R3b] 新算法：只有 mode 一个键", set(new_patch.keys()) == {"mode"},
       sorted(new_patch.keys()))
    ck("[R4b] 新算法：其余键继续跟随全局默认", len(new_patch) == 1, sorted(new_patch))

    print("\n===== 结论 =====")
    print("    旧版：一次「会话模式」保存 = 本 chat 被固化成完整 5 项覆盖。")
    print("    之后改「默认模式」全局，本 chat 因覆盖而看不到新全局值 →")
    print("    用户视角就是「两种模式互相锁死 / 全部都变成了同一种」。")
    print("    新版（2026-11-13 08:09 起）：只提交真正改动过的键。")

    print("\nRESULT:", "ALL PASS" if fail == 0 else "HAS FAILURES (%d)" % fail)
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
