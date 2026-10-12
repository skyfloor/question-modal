const Kt = "question-modal", Rt = "question_modal";
function z() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.host) || {};
}
function Yt() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.chat) || null;
}
function $t() {
  return z().antd || {};
}
function Zt() {
  return z().antdIcons || {};
}
const te = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Tt(e) {
  const t = Zt();
  for (const n of te) {
    const a = t[n];
    if (a)
      return e.createElement(a, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return e.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function ee() {
  try {
    const e = "question-modal-styles";
    if (document.getElementById(e)) return;
    const t = document.createElement("style");
    t.id = e, t.textContent = [
      // Match the composer input: 1px solid --app-border-strong, radius 12,
      // --app-surface-raised fill (see `.qwenpaw-sender-content` / `.ant-input`).
      ".qm-card{",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45))!important;",
      "border-radius:12px!important;",
      "background:var(--app-surface-raised,#fff)!important;",
      "transition:border-color .16s ease,box-shadow .16s ease}"
    ].join(""), document.head.appendChild(t);
  } catch {
  }
}
function C(e) {
  try {
    const t = z();
    if (typeof t.getApiUrl == "function") return t.getApiUrl(e);
  } catch {
  }
  return "/api" + e;
}
function O() {
  const e = { "Content-Type": "application/json" };
  try {
    const t = z(), n = typeof t.getApiToken == "function" ? t.getApiToken() : "";
    n && (e.Authorization = "Bearer " + n);
    const a = typeof t.getSelectedAgentId == "function" ? t.getSelectedAgentId() : "";
    a && (e["X-Agent-Id"] = a);
  } catch {
  }
  return e;
}
function L() {
  try {
    const e = z();
    if (typeof e.getCurrentSessionId == "function") return e.getCurrentSessionId() || "";
  } catch {
  }
  return window.currentSessionId || "";
}
function S(e, t) {
  try {
    const n = $t().message;
    if (n && typeof n[e] == "function") {
      n[e](t);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", e, t);
}
const T = "__other__";
function $(e) {
  return String(e && typeof e == "object" ? e.value ?? e.label ?? "" : e);
}
function j(e) {
  return String(e && typeof e == "object" ? e.label ?? e.value ?? "" : e);
}
function ne(e, t) {
  const n = /* @__PURE__ */ new Set(), a = (s) => {
    s != null && s !== "" && n.add(String(s));
  }, r = e.options || [];
  if (e.type === "multi")
    (Array.isArray(t.value) ? t.value : []).forEach((d) => {
      a(d);
      const u = r.find((c) => $(c) === String(d));
      u && a(j(u)), String(d) === T && t.other && a(t.other);
    });
  else {
    a(t.value);
    const s = r.find((d) => $(d) === String(t.value));
    s && a(j(s)), String(t.value) === T && t.other && a(t.other);
  }
  return n;
}
function re(e, t) {
  return (Array.isArray(e) ? e : [e]).some((a) => {
    const r = String(a);
    if (r.startsWith("=")) return t.has(r.slice(1));
    if (t.has(r)) return !0;
    for (const s of Array.from(t))
      if (s && (s.indexOf(r) !== -1 || r.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function jt(e, t) {
  const n = /^q(\d+)$/i.exec(e.trim());
  if (n) {
    const r = parseInt(n[1], 10);
    if (r >= 0 && r < t.length) return r;
  }
  return t.findIndex((r) => (r.title || "").trim() === e.trim());
}
function zt(e, t, n) {
  const a = t[e], r = a && a.showIf;
  if (!r || typeof r != "object" || !Object.keys(r).length) return !0;
  for (const s of Object.keys(r)) {
    const d = jt(s, t);
    if (d < 0) continue;
    const u = t[d];
    if (!u) continue;
    if (u.showIf && !zt(d, t, n)) return !1;
    const c = n[`q${d}`];
    if (!c || !re(r[s], ne(u, c))) return !1;
  }
  return !0;
}
function Z(e, t) {
  const n = [];
  return e.forEach((a, r) => {
    zt(r, e, t) && n.push(r);
  }), n;
}
function oe(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data && t[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function ae(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function se(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data, a = n && n.output;
    return a ? typeof a == "string" ? a : Array.isArray(a) ? a.map((r) => r && (r.text || r.content) || "").join(`
`) : String(a) : "";
  } catch {
    return "";
  }
}
function ie(e) {
  return e ? /\[scroll folded\]/.test(e) : !1;
}
function ce(e, t) {
  if (!t) return "";
  if (t.kind === "skipped" && !t.answers)
    return `已跳过本次问卷。

` + ct(e);
  const n = t && t.answers || {}, a = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((r) => {
    const s = n[r];
    if (!s || typeof s != "object") return;
    const d = jt(r, e), u = d >= 0 ? e[d] : null, c = u ? u.type === "single" ? "单选" : u.type === "multi" ? "多选" : "问答" : "问答", w = u ? u.title : r;
    let p = s.value;
    Array.isArray(p) && (p = p.join("、")), s.other && (p = (p ? p + "、" : "") + s.other), s.skipped ? a.push(`- ${r} [${c}] ${w}（用户跳过本题）`) : a.push(`- ${r} [${c}] ${w}：${p === "" || p == null ? "（空）" : p}`);
  }), t.other && a.push("", `其他意见：${t.other}`), a.join(`
`);
}
async function le(e, t) {
  try {
    const n = new URLSearchParams();
    e && n.set("tool_call_id", e), t && n.set("session_id", t);
    const a = await fetch(
      C("/question-modal/resolve") + "?" + n.toString(),
      { headers: O() }
    );
    if (!a.ok) return null;
    const r = await a.json();
    return r && r.found ? r : null;
  } catch {
    return null;
  }
}
async function Ct(e) {
  if (!e) return null;
  try {
    const t = await fetch(
      C("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(e),
      { headers: O() }
    );
    if (!t.ok) return null;
    const n = await t.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
const tt = "qm:v1:reqid:", ue = 6e4;
function R(e) {
  if (e)
    try {
      localStorage.removeItem(tt + e);
    } catch {
    }
}
function de() {
  try {
    const e = [];
    for (let r = 0; r < localStorage.length; r++) {
      const s = localStorage.key(r);
      s && s.indexOf(tt) === 0 && e.push(s);
    }
    const t = 7 * 24 * 3600 * 1e3, n = [];
    e.forEach((r) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        s = null;
      }
      !s || !s.request_id || !s.ts || Date.now() - s.ts > t ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 50;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, s) => r.ts - s.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
function fe(e, t, n) {
  if (!(!e || !t))
    try {
      localStorage.setItem(tt + e, JSON.stringify({
        request_id: t,
        session_id: n || "",
        tool_call_id: e,
        ts: Date.now()
      })), de();
    } catch {
    }
}
function Ot(e) {
  if (!e) return null;
  try {
    const t = localStorage.getItem(tt + e);
    if (!t) return null;
    const n = JSON.parse(t);
    return !n || !n.request_id || n.tool_call_id !== e ? (R(e), null) : n;
  } catch {
    return null;
  }
}
async function pe(e) {
  try {
    const t = await fetch(
      C("/question-modal/resolve") + "?request_id=" + encodeURIComponent(e),
      { headers: O() }
    );
    if (!t.ok) return { kind: "error" };
    const n = await t.json();
    return n && n.found ? { kind: "found", data: n } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function he(e, t, n) {
  const a = ["【用户提交的问卷答案】"], r = new Set(Z(e, t));
  return e.forEach((s, d) => {
    if (!r.has(d)) return;
    const u = t[`q${d}`];
    if (!u) return;
    let c = u.value;
    if (Array.isArray(c))
      c = c.filter((b) => b !== T).map((b) => {
        const v = (s.options || []).find((E) => $(E) === String(b));
        return v ? j(v) : b;
      }).join("、");
    else {
      const b = (s.options || []).find((v) => $(v) === String(c));
      b && (c = j(b)), String(u.value) === T && (c = "");
    }
    const w = s.type === "single" ? "单选" : s.type === "multi" ? "多选" : "问答", p = !!String(c || "").trim() || !!String(u.other || "").trim(), P = u.skipped || !p ? "（用户跳过本题）" : c;
    let y = `- q${d} [${w}] ${P}`;
    u.other && !u.skipped && (y += `（其他：${u.other}）`), a.push(y);
  }), n && a.push(`- 其他意见：${n}`), a.join(`
`);
}
function ct(e) {
  return e.map((t, n) => {
    const a = t.type === "single" ? "单选" : t.type === "multi" ? "多选" : "问答", r = (t.options || []).map(j).join("、");
    return `${n + 1}. [${a}] ${t.title}${r ? "（" + r + "）" : ""}`;
  }).join(`
`);
}
function ye(e) {
  const t = z().React, n = $t(), { Input: a, Button: r } = n, s = a.TextArea, d = e.data || {}, u = oe(d), c = ae(d), w = se(d), p = ie(w), P = p ? "" : w, y = u.questions || [], b = u.title || "问卷", [v, E] = t.useState(!!P || p), [et, Pt] = t.useState(""), [M, Nt] = t.useState(""), [_, W] = t.useState(0), [H, lt] = t.useState(() => {
    const o = {};
    return y.forEach((i, l) => {
      o[`q${l}`] = { type: i.type, value: i.type === "multi" ? [] : "", other: "" };
    }), o;
  }), [nt, Bt] = t.useState(""), [k, U] = t.useState(!1), [Lt, D] = t.useState(""), [F, N] = t.useState(
    () => /跳过了本次问卷/.test(P || "")
  ), [ut, dt] = t.useState(!1), [Mt, J] = t.useState(!1), rt = t.useRef(0);
  t.useEffect(() => {
    if (!p || et) return;
    let o = !0;
    return Ct(c).then((i) => {
      !o || !i || (i.kind === "skipped" && !i.answers && N(!0), Pt(ce(y, i)));
    }), () => {
      o = !1;
    };
  }, [p, c, et]), t.useEffect(() => {
    if (v) return;
    let o = !0, i = 0, l = 0, f = 0;
    rt.current || (rt.current = Date.now());
    const A = (m) => {
      !o || !m || !m.request_id || (Nt(m.request_id), J(!1), l && (clearTimeout(l), l = 0), f && (clearTimeout(f), f = 0), fe(c, m.request_id, m.session_id || L()));
    }, K = Ot(c), Y = async () => {
      if (!K) return !1;
      const m = await pe(K.request_id);
      if (!o) return !0;
      if (m.kind === "found") {
        const I = m.data;
        return I.tool_call_id && c && I.tool_call_id !== c ? (R(c), !1) : (A(I), !0);
      }
      return m.kind === "absent" && R(c), !1;
    }, Gt = () => {
      o && (i += 1, l = setTimeout(It, i < 8 ? 700 : 5e3));
    }, At = () => {
      le(c, L()).then((m) => {
        if (o) {
          if (m) {
            A(m);
            return;
          }
          Ct(c).then((I) => {
            if (o) {
              if (I) {
                I.kind === "skipped" && !I.answers && N(!0), E(!0), R(c);
                return;
              }
              Gt();
            }
          });
        }
      });
    }, It = () => {
      if (o) {
        if (!K) {
          At();
          return;
        }
        Y().then((m) => {
          !o || m || At();
        });
      }
    };
    return f = setTimeout(() => {
      o && J(!0);
    }, ue), It(), () => {
      o = !1, l && clearTimeout(l), f && clearTimeout(f);
    };
  }, [v, c]);
  const Wt = async () => {
    const o = L();
    U(!0);
    try {
      const i = Ot(c);
      if (i && o) {
        const l = await fetch(
          C("/question-modal/skip"),
          {
            method: "POST",
            headers: O(),
            body: JSON.stringify({ request_id: i.request_id, session_id: o })
          }
        );
        if (!l.ok) throw new Error((await l.json().catch(() => ({}))).detail || "HTTP " + l.status);
        R(c), N(!0), D("用户跳过了本次问卷。"), E(!0), J(!1), S("info", "已释放本次问卷，会话可继续");
      } else if (o) {
        const l = await fetch(
          C("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(o),
          { method: "POST", headers: O() }
        );
        if (!l.ok) throw new Error("HTTP " + l.status);
        N(!0), D("已释放本会话的问卷阻塞（同时释放本会话其他未答问卷）。"), E(!0), J(!1), S("info", "已释放本会话的问卷，会话可继续");
      } else
        throw new Error("拿不到当前会话 id");
    } catch (i) {
      S("error", "释放失败: " + (i && i.message ? i.message : i));
    } finally {
      U(!1);
    }
  }, ft = Z(y, H), B = ft.length, q = _ >= B, x = q ? -1 : ft[_], g = x >= 0 ? y[x] : null, pt = `q${x}`, h = x >= 0 && H[pt] || { type: g && g.type || "text", value: g && g.type === "multi" ? [] : "", other: "" }, Q = (o) => lt((i) => {
    const l = { ...o, skipped: !1 }, f = { ...i, [pt]: l }, A = Z(y, f);
    return y.forEach((K, Y) => {
      A.indexOf(Y) === -1 && delete f[`q${Y}`];
    }), f;
  });
  t.useEffect(() => {
    _ > B && W(B);
  }, [B, _]);
  const ht = async (o, i) => {
    U(!0);
    try {
      const l = await fetch(C(o), {
        method: "POST",
        headers: O(),
        body: JSON.stringify(i)
      });
      if (!l.ok) {
        const f = await l.json().catch(() => ({}));
        throw new Error(f && f.detail || "HTTP " + l.status);
      }
    } finally {
      U(!1);
    }
  }, yt = async () => {
    if (!M) {
      S("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await ht("/question-modal/answer", {
        request_id: M,
        session_id: L(),
        answers: H,
        other: nt
      }), S("success", "✓ 已提交答案"), R(c), D(he(y, H, nt)), E(!0);
    } catch (o) {
      S("error", "提交失败: " + o.message);
    }
  }, Ht = () => {
    x < 0 || (lt((o) => {
      const i = { ...o };
      i[`q${x}`] = {
        type: (o[`q${x}`] || {}).type || g && g.type || "text",
        value: ((o[`q${x}`] || {}).type || g && g.type) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const l = Z(y, i);
      return y.forEach((f, A) => {
        l.indexOf(A) === -1 && delete i[`q${A}`];
      }), i;
    }), W((o) => o + 1));
  }, Ut = async () => {
    if (!M) {
      S("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await ht("/question-modal/skip", {
        request_id: M,
        session_id: L()
      }), S("info", "已跳过问卷"), R(c), N(!0), D("用户跳过了本次问卷。"), E(!0);
    } catch (o) {
      S("error", "跳过失败: " + o.message);
    }
  }, ot = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, gt = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, mt = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, at = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, bt = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Dt = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, st = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Ft = { display: "flex", flexDirection: "column", gap: 8 }, vt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, V = {
    minWidth: 88,
    height: 36,
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 8,
    padding: "0 20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer"
  }, St = {
    ...V,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Jt = {
    ...V,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, xt = {
    ...V,
    width: "100%",
    justifyContent: "flex-start",
    minWidth: 0,
    borderRadius: 8,
    fontSize: 13,
    padding: "6px 12px",
    background: "var(--app-surface-subtle, rgba(127,127,127,0.05))",
    border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
    color: "var(--app-text-secondary, inherit)",
    // Prose-style options (a whole sentence) must wrap, not truncate.
    whiteSpace: "normal",
    textAlign: "left",
    lineHeight: 1.45,
    height: "auto",
    minHeight: 32,
    alignItems: "center"
  }, Qt = {
    // Restored to the original look (user asked for options to stay as-is).
    ...xt,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Vt = { height: 32, fontSize: 13, borderRadius: 8 }, wt = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Et = (o) => {
    const i = $(o);
    return h.type === "multi" ? Array.isArray(h.value) && h.value.indexOf(i) !== -1 : h.value === i;
  }, _t = Et(T), kt = (o) => {
    if (v || k) return;
    const i = $(o);
    if (h.type === "multi") {
      const l = Array.isArray(h.value) ? h.value.slice() : [], f = l.indexOf(i);
      f === -1 ? l.push(i) : l.splice(f, 1), Q({ ...h, value: l, other: l.indexOf(T) !== -1 ? h.other : "" });
    } else
      Q({ ...h, value: i });
  }, qt = (o, i, l, f) => t.createElement("button", {
    key: f,
    type: "button",
    disabled: v || k,
    style: i ? Qt : xt,
    onClick: l
  }, (i ? "✓ " : "") + o);
  if (v)
    return F && !ut ? t.createElement(
      "div",
      {
        style: {
          ...ot,
          padding: "8px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        },
        className: "qm-card",
        "data-qm-card": "true"
      },
      t.createElement("span", {
        style: { color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "›"),
      t.createElement(
        "span",
        { style: { fontSize: 13, fontWeight: 500 } },
        "✓ 已跳过问卷"
      ),
      t.createElement(
        "span",
        { style: { ...at, flex: 1, opacity: 0.75 } },
        b
      ),
      t.createElement("button", {
        type: "button",
        style: {
          ...St,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => dt(!0)
      }, "展开")
    ) : t.createElement(
      "div",
      { style: ot, className: "qm-card", "data-qm-card": "true" },
      t.createElement(
        "div",
        { style: { ...gt, marginBottom: 8, paddingBottom: 8 } },
        t.createElement(
          "div",
          { style: mt },
          Tt(t),
          t.createElement("span", { style: at }, b)
        ),
        t.createElement(
          "span",
          { style: { ...bt, color: "var(--app-success-text, #389e0d)" } },
          F ? "已跳过" : "已完成"
        )
      ),
      t.createElement("pre", {
        style: {
          margin: 0,
          padding: "10px 12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: 12,
          lineHeight: 1.6,
          background: "var(--app-surface-subtle, rgba(127,127,127,0.05))",
          border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
          borderRadius: 6,
          color: "var(--app-text-secondary, inherit)",
          fontFamily: "SF Mono,Monaco,Consolas,monospace"
        }
      }, F ? `已跳过本次问卷。

` + ct(y) : Lt || et || P || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + ct(y)),
      F && ut ? t.createElement(
        "div",
        { style: vt },
        t.createElement("button", {
          type: "button",
          style: St,
          onClick: () => dt(!1)
        }, "收起")
      ) : null
    );
  let X = null;
  if (q)
    X = t.createElement(
      "div",
      null,
      t.createElement("div", { style: st }, "其他意见（可选）"),
      t.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选）",
        value: nt,
        style: wt,
        onChange: (o) => Bt(o.target.value)
      })
    );
  else if (g && g.type === "text")
    X = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...st, fontSize: 13, color: "var(--app-text, inherit)" } }, g.title),
      t.createElement(s, {
        rows: 2,
        placeholder: "请输入...",
        value: typeof h.value == "string" ? h.value : "",
        style: wt,
        onChange: (o) => Q({ ...h, value: o.target.value, other: "" })
      })
    );
  else if (g) {
    const o = (g.options || []).map((i, l) => qt(j(i), Et(i), () => kt(i), "o" + l));
    o.push(qt("其他", _t, () => kt(T), "other")), _t && o.push(t.createElement(a, {
      key: "oi",
      placeholder: "请填写",
      value: h.other,
      style: { ...Vt, marginTop: 2 },
      onChange: (i) => Q({ ...h, other: i.target.value })
    })), X = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...st, fontSize: 13, color: "var(--app-text, inherit)" } }, g.title),
      t.createElement("div", { style: { ...Ft, marginTop: 8 } }, o)
    );
  }
  const it = B + 1, Xt = q ? it + "/" + it : _ + 1 + "/" + it, G = {
    ...V,
    minWidth: 0,
    height: 32,
    padding: "0 14px",
    fontSize: 12,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  };
  return t.createElement(
    "div",
    { style: ot, className: "qm-card", "data-qm-card": "true" },
    t.createElement(
      "div",
      { style: gt },
      t.createElement(
        "div",
        { style: mt },
        Tt(t),
        t.createElement("span", { style: at }, b)
      ),
      t.createElement("span", { style: bt }, Xt)
    ),
    t.createElement("div", { style: Dt }, X),
    // ── self-rescue banner: cannot obtain this survey's request_id ──
    Mt && !v ? t.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          margin: "0 0 12px",
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--app-warning-soft, rgba(250,173,20,0.12))",
          border: "1px solid var(--app-warning-border, rgba(250,173,20,0.45))",
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--app-text-secondary, inherit)"
        }
      },
      t.createElement(
        "span",
        { style: { flex: 1, minWidth: 180 } },
        "⚠️ 无法连接问卷服务（已持续 " + Math.max(1, Math.round((Date.now() - (rt.current || Date.now())) / 1e3)) + " 秒）。问卷阻塞着整个会话，此时发新消息会报「A task is already running」。"
      ),
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: {
          ...G,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Wt,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    t.createElement(
      "div",
      { style: vt },
      t.createElement("button", {
        type: "button",
        disabled: _ === 0 || k,
        style: { ...G, marginRight: "auto", opacity: _ === 0 ? 0.5 : 1 },
        onClick: () => W((o) => o - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: G,
        onClick: q ? yt : Ht
      }, q ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: G,
        onClick: Ut
      }, "跳过问卷"),
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: Jt,
        onClick: () => {
          q ? yt() : W((o) => o + 1);
        }
      }, q ? "提交" : "下一步")
    )
  );
}
function ge() {
  const e = Yt();
  if (!e || typeof e.toolRender != "function") return !1;
  try {
    return ee(), e.toolRender(Kt, Rt, ye), console.log("[question-modal] registered via chat.toolRender for", Rt), !0;
  } catch (t) {
    return console.error("[question-modal] toolRender failed:", t), !1;
  }
}
(function e(t) {
  if (!ge()) {
    if (t > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => e(t + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v5 — native toolRender, approval styling)");
