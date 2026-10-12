const Dt = "question-modal", qt = "question_modal";
function j() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.host) || {};
}
function Ft() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.chat) || null;
}
function Tt() {
  return j().antd || {};
}
function Jt() {
  return j().antdIcons || {};
}
const Qt = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function At(e) {
  const t = Jt();
  for (const n of Qt) {
    const a = t[n];
    if (a)
      return e.createElement(a, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return e.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Vt() {
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
function T(e) {
  try {
    const t = j();
    if (typeof t.getApiUrl == "function") return t.getApiUrl(e);
  } catch {
  }
  return "/api" + e;
}
function R() {
  const e = { "Content-Type": "application/json" };
  try {
    const t = j(), n = typeof t.getApiToken == "function" ? t.getApiToken() : "";
    n && (e.Authorization = "Bearer " + n);
    const a = typeof t.getSelectedAgentId == "function" ? t.getSelectedAgentId() : "";
    a && (e["X-Agent-Id"] = a);
  } catch {
  }
  return e;
}
function N() {
  try {
    const e = j();
    if (typeof e.getCurrentSessionId == "function") return e.getCurrentSessionId() || "";
  } catch {
  }
  return window.currentSessionId || "";
}
function S(e, t) {
  try {
    const n = Tt().message;
    if (n && typeof n[e] == "function") {
      n[e](t);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", e, t);
}
const I = "__other__";
function C(e) {
  return String(e && typeof e == "object" ? e.value ?? e.label ?? "" : e);
}
function O(e) {
  return String(e && typeof e == "object" ? e.label ?? e.value ?? "" : e);
}
function Xt(e, t) {
  const n = /* @__PURE__ */ new Set(), a = (i) => {
    i != null && i !== "" && n.add(String(i));
  }, r = e.options || [];
  if (e.type === "multi")
    (Array.isArray(t.value) ? t.value : []).forEach((u) => {
      a(u);
      const f = r.find((l) => C(l) === String(u));
      f && a(O(f)), String(u) === I && t.other && a(t.other);
    });
  else {
    a(t.value);
    const i = r.find((u) => C(u) === String(t.value));
    i && a(O(i)), String(t.value) === I && t.other && a(t.other);
  }
  return n;
}
function Gt(e, t) {
  return (Array.isArray(e) ? e : [e]).some((a) => {
    const r = String(a);
    if (r.startsWith("=")) return t.has(r.slice(1));
    if (t.has(r)) return !0;
    for (const i of Array.from(t))
      if (i && (i.indexOf(r) !== -1 || r.indexOf(i) !== -1)) return !0;
    return !1;
  });
}
function Kt(e, t) {
  const n = /^q(\d+)$/i.exec(e.trim());
  if (n) {
    const r = parseInt(n[1], 10);
    if (r >= 0 && r < t.length) return r;
  }
  return t.findIndex((r) => (r.title || "").trim() === e.trim());
}
function Rt(e, t, n) {
  const a = t[e], r = a && a.showIf;
  if (!r || typeof r != "object" || !Object.keys(r).length) return !0;
  for (const i of Object.keys(r)) {
    const u = Kt(i, t);
    if (u < 0) continue;
    const f = t[u];
    if (!f) continue;
    if (f.showIf && !Rt(u, t, n)) return !1;
    const l = n[`q${u}`];
    if (!l || !Gt(r[i], Xt(f, l))) return !1;
  }
  return !0;
}
function K(e, t) {
  const n = [];
  return e.forEach((a, r) => {
    Rt(r, e, t) && n.push(r);
  }), n;
}
function Yt(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data && t[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function Zt(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function te(e) {
  try {
    const t = e && e.content || [], n = t[0] && t[0].data, a = n && n.output;
    return a ? typeof a == "string" ? a : Array.isArray(a) ? a.map((r) => r && (r.text || r.content) || "").join(`
`) : String(a) : "";
  } catch {
    return "";
  }
}
async function ee(e, t) {
  try {
    const n = new URLSearchParams();
    e && n.set("tool_call_id", e), t && n.set("session_id", t);
    const a = await fetch(
      T("/question-modal/resolve") + "?" + n.toString(),
      { headers: R() }
    );
    if (!a.ok) return null;
    const r = await a.json();
    return r && r.found ? r : null;
  } catch {
    return null;
  }
}
async function ne(e) {
  if (!e) return null;
  try {
    const t = await fetch(
      T("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(e),
      { headers: R() }
    );
    if (!t.ok) return null;
    const n = await t.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
const Y = "qm:v1:reqid:", re = 6e4;
function A(e) {
  if (e)
    try {
      localStorage.removeItem(Y + e);
    } catch {
    }
}
function oe() {
  try {
    const e = [];
    for (let r = 0; r < localStorage.length; r++) {
      const i = localStorage.key(r);
      i && i.indexOf(Y) === 0 && e.push(i);
    }
    const t = 7 * 24 * 3600 * 1e3, n = [];
    e.forEach((r) => {
      let i = null;
      try {
        i = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        i = null;
      }
      !i || !i.request_id || !i.ts || Date.now() - i.ts > t ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 50;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, i) => r.ts - i.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
function ae(e, t, n) {
  if (!(!e || !t))
    try {
      localStorage.setItem(Y + e, JSON.stringify({
        request_id: t,
        session_id: n || "",
        tool_call_id: e,
        ts: Date.now()
      })), oe();
    } catch {
    }
}
function It(e) {
  if (!e) return null;
  try {
    const t = localStorage.getItem(Y + e);
    if (!t) return null;
    const n = JSON.parse(t);
    return !n || !n.request_id || n.tool_call_id !== e ? (A(e), null) : n;
  } catch {
    return null;
  }
}
async function se(e) {
  try {
    const t = await fetch(
      T("/question-modal/resolve") + "?request_id=" + encodeURIComponent(e),
      { headers: R() }
    );
    if (!t.ok) return { kind: "error" };
    const n = await t.json();
    return n && n.found ? { kind: "found", data: n } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function ie(e, t, n) {
  const a = ["【用户提交的问卷答案】"], r = new Set(K(e, t));
  return e.forEach((i, u) => {
    if (!r.has(u)) return;
    const f = t[`q${u}`];
    if (!f) return;
    let l = f.value;
    if (Array.isArray(l))
      l = l.filter((y) => y !== I).map((y) => {
        const v = (i.options || []).find((Z) => C(Z) === String(y));
        return v ? O(v) : y;
      }).join("、");
    else {
      const y = (i.options || []).find((v) => C(v) === String(l));
      y && (l = O(y)), String(f.value) === I && (l = "");
    }
    const z = i.type === "single" ? "单选" : i.type === "multi" ? "多选" : "问答", g = !!String(l || "").trim() || !!String(f.other || "").trim(), $ = f.skipped || !g ? "（用户跳过本题）" : l;
    let b = `- q${u} [${z}] ${$}`;
    f.other && !f.skipped && (b += `（其他：${f.other}）`), a.push(b);
  }), n && a.push(`- 其他意见：${n}`), a.join(`
`);
}
function ce(e) {
  return e.map((t, n) => {
    const a = t.type === "single" ? "单选" : t.type === "multi" ? "多选" : "问答", r = (t.options || []).map(O).join("、");
    return `${n + 1}. [${a}] ${t.title}${r ? "（" + r + "）" : ""}`;
  }).join(`
`);
}
function le(e) {
  const t = j().React, n = Tt(), { Input: a, Button: r } = n, i = a.TextArea, u = e.data || {}, f = Yt(u), l = Zt(u), z = te(u), g = f.questions || [], $ = f.title || "问卷", [b, y] = t.useState(!!z), [v, Z] = t.useState(""), [w, B] = t.useState(0), [L, st] = t.useState(() => {
    const o = {};
    return g.forEach((s, c) => {
      o[`q${c}`] = { type: s.type, value: s.type === "multi" ? [] : "", other: "" };
    }), o;
  }), [tt, Ct] = t.useState(""), [E, M] = t.useState(!1), [Ot, W] = t.useState(""), [H, U] = t.useState(
    () => /跳过了本次问卷/.test(z || "")
  ), [it, ct] = t.useState(!1), [jt, D] = t.useState(!1), et = t.useRef(0);
  t.useEffect(() => {
    if (b) return;
    let o = !0, s = 0, c = 0, d = 0;
    et.current || (et.current = Date.now());
    const k = (h) => {
      !o || !h || !h.request_id || (Z(h.request_id), D(!1), c && (clearTimeout(c), c = 0), d && (clearTimeout(d), d = 0), ae(l, h.request_id, h.session_id || N()));
    }, X = It(l), G = async () => {
      if (!X) return !1;
      const h = await se(X.request_id);
      if (!o) return !0;
      if (h.kind === "found") {
        const q = h.data;
        return q.tool_call_id && l && q.tool_call_id !== l ? (A(l), !1) : (k(q), !0);
      }
      return h.kind === "absent" && A(l), !1;
    }, Ut = () => {
      o && (s += 1, c = setTimeout(kt, s < 8 ? 700 : 5e3));
    }, _t = () => {
      ee(l, N()).then((h) => {
        if (o) {
          if (h) {
            k(h);
            return;
          }
          ne(l).then((q) => {
            if (o) {
              if (q) {
                q.kind === "skipped" && !q.answers && U(!0), y(!0), A(l);
                return;
              }
              Ut();
            }
          });
        }
      });
    }, kt = () => {
      if (o) {
        if (!X) {
          _t();
          return;
        }
        G().then((h) => {
          !o || h || _t();
        });
      }
    };
    return d = setTimeout(() => {
      o && D(!0);
    }, re), kt(), () => {
      o = !1, c && clearTimeout(c), d && clearTimeout(d);
    };
  }, [b, l]);
  const zt = async () => {
    const o = N();
    M(!0);
    try {
      const s = It(l);
      if (s && o) {
        const c = await fetch(
          T("/question-modal/skip"),
          {
            method: "POST",
            headers: R(),
            body: JSON.stringify({ request_id: s.request_id, session_id: o })
          }
        );
        if (!c.ok) throw new Error((await c.json().catch(() => ({}))).detail || "HTTP " + c.status);
        A(l), U(!0), W("用户跳过了本次问卷。"), y(!0), D(!1), S("info", "已释放本次问卷，会话可继续");
      } else if (o) {
        const c = await fetch(
          T("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(o),
          { method: "POST", headers: R() }
        );
        if (!c.ok) throw new Error("HTTP " + c.status);
        U(!0), W("已释放本会话的问卷阻塞（同时释放本会话其他未答问卷）。"), y(!0), D(!1), S("info", "已释放本会话的问卷，会话可继续");
      } else
        throw new Error("拿不到当前会话 id");
    } catch (s) {
      S("error", "释放失败: " + (s && s.message ? s.message : s));
    } finally {
      M(!1);
    }
  }, lt = K(g, L), P = lt.length, _ = w >= P, x = _ ? -1 : lt[w], m = x >= 0 ? g[x] : null, ut = `q${x}`, p = x >= 0 && L[ut] || { type: m && m.type || "text", value: m && m.type === "multi" ? [] : "", other: "" }, F = (o) => st((s) => {
    const c = { ...o, skipped: !1 }, d = { ...s, [ut]: c }, k = K(g, d);
    return g.forEach((X, G) => {
      k.indexOf(G) === -1 && delete d[`q${G}`];
    }), d;
  });
  t.useEffect(() => {
    w > P && B(P);
  }, [P, w]);
  const dt = async (o, s) => {
    M(!0);
    try {
      const c = await fetch(T(o), {
        method: "POST",
        headers: R(),
        body: JSON.stringify(s)
      });
      if (!c.ok) {
        const d = await c.json().catch(() => ({}));
        throw new Error(d && d.detail || "HTTP " + c.status);
      }
    } finally {
      M(!1);
    }
  }, ft = async () => {
    if (!v) {
      S("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await dt("/question-modal/answer", {
        request_id: v,
        session_id: N(),
        answers: L,
        other: tt
      }), S("success", "✓ 已提交答案"), A(l), W(ie(g, L, tt)), y(!0);
    } catch (o) {
      S("error", "提交失败: " + o.message);
    }
  }, $t = () => {
    x < 0 || (st((o) => {
      const s = { ...o };
      s[`q${x}`] = {
        type: (o[`q${x}`] || {}).type || m && m.type || "text",
        value: ((o[`q${x}`] || {}).type || m && m.type) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const c = K(g, s);
      return g.forEach((d, k) => {
        c.indexOf(k) === -1 && delete s[`q${k}`];
      }), s;
    }), B((o) => o + 1));
  }, Pt = async () => {
    if (!v) {
      S("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await dt("/question-modal/skip", {
        request_id: v,
        session_id: N()
      }), S("info", "已跳过问卷"), A(l), U(!0), W("用户跳过了本次问卷。"), y(!0);
    } catch (o) {
      S("error", "跳过失败: " + o.message);
    }
  }, nt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, pt = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, mt = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, rt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, ht = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Nt = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, ot = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Bt = { display: "flex", flexDirection: "column", gap: 8 }, yt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, J = {
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
  }, gt = {
    ...J,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Lt = {
    ...J,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, bt = {
    ...J,
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
  }, Mt = {
    // Restored to the original look (user asked for options to stay as-is).
    ...bt,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Wt = { height: 32, fontSize: 13, borderRadius: 8 }, vt = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, St = (o) => {
    const s = C(o);
    return p.type === "multi" ? Array.isArray(p.value) && p.value.indexOf(s) !== -1 : p.value === s;
  }, xt = St(I), wt = (o) => {
    if (b || E) return;
    const s = C(o);
    if (p.type === "multi") {
      const c = Array.isArray(p.value) ? p.value.slice() : [], d = c.indexOf(s);
      d === -1 ? c.push(s) : c.splice(d, 1), F({ ...p, value: c, other: c.indexOf(I) !== -1 ? p.other : "" });
    } else
      F({ ...p, value: s });
  }, Et = (o, s, c, d) => t.createElement("button", {
    key: d,
    type: "button",
    disabled: b || E,
    style: s ? Mt : bt,
    onClick: c
  }, (s ? "✓ " : "") + o);
  if (b)
    return H && !it ? t.createElement(
      "div",
      {
        style: {
          ...nt,
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
        { style: { ...rt, flex: 1, opacity: 0.75 } },
        $
      ),
      t.createElement("button", {
        type: "button",
        style: {
          ...gt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => ct(!0)
      }, "展开")
    ) : t.createElement(
      "div",
      { style: nt, className: "qm-card", "data-qm-card": "true" },
      t.createElement(
        "div",
        { style: { ...pt, marginBottom: 8, paddingBottom: 8 } },
        t.createElement(
          "div",
          { style: mt },
          At(t),
          t.createElement("span", { style: rt }, $)
        ),
        t.createElement(
          "span",
          { style: { ...ht, color: "var(--app-success-text, #389e0d)" } },
          H ? "已跳过" : "已完成"
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
      }, H ? `已跳过本次问卷。

` + ce(g) : Ot || z),
      H && it ? t.createElement(
        "div",
        { style: yt },
        t.createElement("button", {
          type: "button",
          style: gt,
          onClick: () => ct(!1)
        }, "收起")
      ) : null
    );
  let Q = null;
  if (_)
    Q = t.createElement(
      "div",
      null,
      t.createElement("div", { style: ot }, "其他意见（可选）"),
      t.createElement(i, {
        rows: 2,
        placeholder: "补充意见（可选）",
        value: tt,
        style: vt,
        onChange: (o) => Ct(o.target.value)
      })
    );
  else if (m && m.type === "text")
    Q = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...ot, fontSize: 13, color: "var(--app-text, inherit)" } }, m.title),
      t.createElement(i, {
        rows: 2,
        placeholder: "请输入...",
        value: typeof p.value == "string" ? p.value : "",
        style: vt,
        onChange: (o) => F({ ...p, value: o.target.value, other: "" })
      })
    );
  else if (m) {
    const o = (m.options || []).map((s, c) => Et(O(s), St(s), () => wt(s), "o" + c));
    o.push(Et("其他", xt, () => wt(I), "other")), xt && o.push(t.createElement(a, {
      key: "oi",
      placeholder: "请填写",
      value: p.other,
      style: { ...Wt, marginTop: 2 },
      onChange: (s) => F({ ...p, other: s.target.value })
    })), Q = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...ot, fontSize: 13, color: "var(--app-text, inherit)" } }, m.title),
      t.createElement("div", { style: { ...Bt, marginTop: 8 } }, o)
    );
  }
  const at = P + 1, Ht = _ ? at + "/" + at : w + 1 + "/" + at, V = {
    ...J,
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
    { style: nt, className: "qm-card", "data-qm-card": "true" },
    t.createElement(
      "div",
      { style: pt },
      t.createElement(
        "div",
        { style: mt },
        At(t),
        t.createElement("span", { style: rt }, $)
      ),
      t.createElement("span", { style: ht }, Ht)
    ),
    t.createElement("div", { style: Nt }, Q),
    // ── self-rescue banner: cannot obtain this survey's request_id ──
    jt && !b ? t.createElement(
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
        "⚠️ 无法连接问卷服务（已持续 " + Math.max(1, Math.round((Date.now() - (et.current || Date.now())) / 1e3)) + " 秒）。问卷阻塞着整个会话，此时发新消息会报「A task is already running」。"
      ),
      t.createElement("button", {
        type: "button",
        disabled: E,
        style: {
          ...V,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: zt,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    t.createElement(
      "div",
      { style: yt },
      t.createElement("button", {
        type: "button",
        disabled: w === 0 || E,
        style: { ...V, marginRight: "auto", opacity: w === 0 ? 0.5 : 1 },
        onClick: () => B((o) => o - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      t.createElement("button", {
        type: "button",
        disabled: E,
        style: V,
        onClick: _ ? ft : $t
      }, _ ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      t.createElement("button", {
        type: "button",
        disabled: E,
        style: V,
        onClick: Pt
      }, "跳过问卷"),
      t.createElement("button", {
        type: "button",
        disabled: E,
        style: Lt,
        onClick: () => {
          _ ? ft() : B((o) => o + 1);
        }
      }, _ ? "提交" : "下一步")
    )
  );
}
function ue() {
  const e = Ft();
  if (!e || typeof e.toolRender != "function") return !1;
  try {
    return Vt(), e.toolRender(Dt, qt, le), console.log("[question-modal] registered via chat.toolRender for", qt), !0;
  } catch (t) {
    return console.error("[question-modal] toolRender failed:", t), !1;
  }
}
(function e(t) {
  if (!ue()) {
    if (t > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => e(t + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v5 — native toolRender, approval styling)");
