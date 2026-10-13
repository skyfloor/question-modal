const le = "question-modal", Mt = "question_modal";
function W() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.host) || {};
}
function ue() {
  var e;
  return ((e = window.QwenPaw) == null ? void 0 : e.chat) || null;
}
function Jt() {
  return W().antd || {};
}
function de() {
  return W().antdIcons || {};
}
const fe = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Lt(e) {
  const t = de();
  for (const r of fe) {
    const a = t[r];
    if (a)
      return e.createElement(a, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return e.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function pe() {
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
function $(e) {
  try {
    const t = W();
    if (typeof t.getApiUrl == "function") return t.getApiUrl(e);
  } catch {
  }
  return "/api" + e;
}
function z() {
  const e = { "Content-Type": "application/json" };
  try {
    const t = W(), r = typeof t.getApiToken == "function" ? t.getApiToken() : "";
    r && (e.Authorization = "Bearer " + r);
    const a = typeof t.getSelectedAgentId == "function" ? t.getSelectedAgentId() : "";
    a && (e["X-Agent-Id"] = a);
  } catch {
  }
  return e;
}
function G() {
  try {
    const e = W();
    if (typeof e.getCurrentSessionId == "function") return e.getCurrentSessionId() || "";
  } catch {
  }
  return window.currentSessionId || "";
}
function E(e, t) {
  try {
    const r = Jt().message;
    if (r && typeof r[e] == "function") {
      r[e](t);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", e, t);
}
const P = "__other__";
function M(e) {
  return String(e && typeof e == "object" ? e.value ?? e.label ?? "" : e);
}
function L(e) {
  return String(e && typeof e == "object" ? e.label ?? e.value ?? "" : e);
}
function he(e, t) {
  const r = /* @__PURE__ */ new Set(), a = (i) => {
    i != null && i !== "" && r.add(String(i));
  }, n = e.options || [];
  if (e.type === "multi")
    (Array.isArray(t.value) ? t.value : []).forEach((u) => {
      a(u);
      const p = n.find((l) => M(l) === String(u));
      p && a(L(p)), String(u) === P && t.other && a(t.other);
    });
  else {
    a(t.value);
    const i = n.find((u) => M(u) === String(t.value));
    i && a(L(i)), String(t.value) === P && t.other && a(t.other);
  }
  return r;
}
function me(e, t) {
  return (Array.isArray(e) ? e : [e]).some((a) => {
    const n = String(a);
    if (n.startsWith("=")) return t.has(n.slice(1));
    if (t.has(n)) return !0;
    for (const i of Array.from(t))
      if (i && (i.indexOf(n) !== -1 || n.indexOf(i) !== -1)) return !0;
    return !1;
  });
}
function Ut(e, t) {
  const r = /^q(\d+)$/i.exec(e.trim());
  if (r) {
    const n = parseInt(r[1], 10);
    if (n >= 0 && n < t.length) return n;
  }
  return t.findIndex((n) => (n.title || "").trim() === e.trim());
}
function Xt(e, t, r) {
  const a = t[e], n = a && a.showIf;
  if (!n || typeof n != "object" || !Object.keys(n).length) return !0;
  for (const i of Object.keys(n)) {
    const u = Ut(i, t);
    if (u < 0) continue;
    const p = t[u];
    if (!p) continue;
    if (p.showIf && !Xt(u, t, r)) return !1;
    const l = r[`q${u}`];
    if (!l || !me(n[i], he(p, l))) return !1;
  }
  return !0;
}
function st(e, t) {
  const r = [];
  return e.forEach((a, n) => {
    Xt(n, e, t) && r.push(n);
  }), r;
}
function ge(e) {
  try {
    const t = e && e.content || [], r = t[0] && t[0].data && t[0].data.arguments;
    return r ? typeof r == "string" ? JSON.parse(r) : r : {};
  } catch {
    return {};
  }
}
function ye(e) {
  try {
    const t = e && e.content || [], r = t[0] && t[0].data;
    return r && r.call_id || "";
  } catch {
    return "";
  }
}
function be(e) {
  try {
    const t = e && e.content || [], r = t[0] && t[0].data, a = r && r.output;
    return a ? typeof a == "string" ? a : Array.isArray(a) ? a.map((n) => n && (n.text || n.content) || "").join(`
`) : String(a) : "";
  } catch {
    return "";
  }
}
function ve(e) {
  return e ? /\[scroll folded\]/.test(e) : !1;
}
function Se(e, t) {
  if (!t) return "";
  if (t.kind === "skipped" && !t.answers)
    return `已跳过本次问卷。

` + yt(e);
  const r = t && t.answers || {}, a = ["【用户提交的问卷答案】"];
  return Object.keys(r).forEach((n) => {
    const i = r[n];
    if (!i || typeof i != "object") return;
    const u = Ut(n, e), p = u >= 0 ? e[u] : null, l = p ? p.type === "single" ? "单选" : p.type === "multi" ? "多选" : "问答" : "问答", y = p ? p.title : n;
    let m = i.value;
    Array.isArray(m) && (m = m.join("、")), i.other && (m = (m ? m + "、" : "") + i.other), i.skipped ? a.push(`- ${n} [${l}] ${y}（用户跳过本题）`) : a.push(`- ${n} [${l}] ${y}：${m === "" || m == null ? "（空）" : m}`);
  }), t.other && a.push("", `其他意见：${t.other}`), a.join(`
`);
}
async function xe(e, t) {
  try {
    const r = new URLSearchParams();
    e && r.set("tool_call_id", e), t && r.set("session_id", t);
    const a = await fetch(
      $("/question-modal/resolve") + "?" + r.toString(),
      { headers: z() }
    );
    if (!a.ok) return null;
    const n = await a.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function Wt(e) {
  if (!e) return null;
  try {
    const t = await fetch(
      $("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(e),
      { headers: z() }
    );
    if (!t.ok) return null;
    const r = await t.json();
    return r && r.found ? r : null;
  } catch {
    return null;
  }
}
async function we(e) {
  try {
    const t = new FormData();
    t.append("file", e);
    const r = z();
    delete r["Content-Type"];
    const a = await fetch(
      $("/console/upload"),
      { method: "POST", headers: r, body: t }
    );
    if (!a.ok) {
      const i = await a.text().catch(() => "");
      let u = "HTTP " + a.status;
      try {
        const p = JSON.parse(i);
        p && p.detail && (u = p.detail);
      } catch {
      }
      throw new Error(u);
    }
    const n = await a.json();
    if (!n || !n.url) throw new Error("上传响应缺少 url");
    return { url: String(n.url), file_name: String(n.file_name || e.name), size: n.size };
  } catch (t) {
    return E("error", "附件上传失败: " + (t && t.message ? t.message : t)), null;
  }
}
function Ee(e) {
  return !e && e !== 0 ? "" : e < 1024 ? e + " B" : e < 1024 * 1024 ? (e / 1024).toFixed(1) + " KB" : (e / 1024 / 1024).toFixed(1) + " MB";
}
const it = "qm:v1:reqid:", _e = 6e4;
function j(e) {
  if (e)
    try {
      localStorage.removeItem(it + e);
    } catch {
    }
}
function ke() {
  try {
    const e = [];
    for (let n = 0; n < localStorage.length; n++) {
      const i = localStorage.key(n);
      i && i.indexOf(it) === 0 && e.push(i);
    }
    const t = 7 * 24 * 3600 * 1e3, r = [];
    e.forEach((n) => {
      let i = null;
      try {
        i = JSON.parse(localStorage.getItem(n) || "null");
      } catch {
        i = null;
      }
      !i || !i.request_id || !i.ts || Date.now() - i.ts > t ? localStorage.removeItem(n) : r.push(n);
    });
    const a = 50;
    if (r.length <= a) return;
    r.map((n) => ({ k: n, ts: (JSON.parse(localStorage.getItem(n) || "{}") || {}).ts || 0 })).sort((n, i) => n.ts - i.ts).slice(0, r.length - a).forEach((n) => localStorage.removeItem(n.k));
  } catch {
  }
}
function Ae(e, t, r) {
  if (!(!e || !t))
    try {
      localStorage.setItem(it + e, JSON.stringify({
        request_id: t,
        session_id: r || "",
        tool_call_id: e,
        ts: Date.now()
      })), ke();
    } catch {
    }
}
function Dt(e) {
  if (!e) return null;
  try {
    const t = localStorage.getItem(it + e);
    if (!t) return null;
    const r = JSON.parse(t);
    return !r || !r.request_id || r.tool_call_id !== e ? (j(e), null) : r;
  } catch {
    return null;
  }
}
const bt = "qm:v1:state:";
function Gt(e) {
  if (!e) return null;
  try {
    const t = localStorage.getItem(bt + e);
    if (!t) return null;
    const r = JSON.parse(t);
    return !r || typeof r != "object" ? null : r;
  } catch {
    return null;
  }
}
function Re(e, t) {
  if (e)
    try {
      const a = { ...Gt(e) || {}, ...t, ts: Date.now() };
      localStorage.setItem(bt + e, JSON.stringify(a)), Te();
    } catch {
    }
}
function Te() {
  try {
    const e = [];
    for (let n = 0; n < localStorage.length; n++) {
      const i = localStorage.key(n);
      i && i.indexOf(bt) === 0 && e.push(i);
    }
    const t = 7 * 24 * 3600 * 1e3, r = [];
    e.forEach((n) => {
      let i = null;
      try {
        i = JSON.parse(localStorage.getItem(n) || "null");
      } catch {
        i = null;
      }
      !i || !i.ts || Date.now() - i.ts > t ? localStorage.removeItem(n) : r.push(n);
    });
    const a = 80;
    if (r.length <= a) return;
    r.map((n) => ({ k: n, ts: (JSON.parse(localStorage.getItem(n) || "{}") || {}).ts || 0 })).sort((n, i) => n.ts - i.ts).slice(0, r.length - a).forEach((n) => localStorage.removeItem(n.k));
  } catch {
  }
}
async function Ie(e) {
  try {
    const t = await fetch(
      $("/question-modal/resolve") + "?request_id=" + encodeURIComponent(e),
      { headers: z() }
    );
    if (!t.ok) return { kind: "error" };
    const r = await t.json();
    return r && r.found ? { kind: "found", data: r } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function qe(e, t, r, a) {
  const n = ["【用户提交的问卷答案】"], i = new Set(st(e, t));
  return e.forEach((u, p) => {
    if (!i.has(p)) return;
    const l = t[`q${p}`];
    if (!l) return;
    let y = l.value;
    if (Array.isArray(y))
      y = y.filter((d) => d !== P).map((d) => {
        const b = (u.options || []).find((I) => M(I) === String(d));
        return b ? L(b) : d;
      }).join("、");
    else {
      const d = (u.options || []).find((b) => M(b) === String(y));
      d && (y = L(d)), String(l.value) === P && (y = "");
    }
    const m = u.type === "single" ? "单选" : u.type === "multi" ? "多选" : "问答", T = !!String(y || "").trim() || !!String(l.other || "").trim() || !!(l.attachments && l.attachments.length), g = l.skipped || !T ? "（用户跳过本题）" : y;
    let w = `- q${p} [${m}] ${g}`;
    l.other && !l.skipped && (w += `（其他：${l.other}）`), l.attachments && l.attachments.length && (w += `（附件：${l.attachments.map((d) => d.file_name).join("、")}）`), n.push(w);
  }), r && n.push(`- 其他意见：${r}`), a && a.length && n.push(`- 其他意见附件：${a.map((u) => u.file_name).join("、")}`), n.join(`
`);
}
function yt(e) {
  return e.map((t, r) => {
    const a = t.type === "single" ? "单选" : t.type === "multi" ? "多选" : "问答", n = (t.options || []).map(L).join("、");
    return `${r + 1}. [${a}] ${t.title}${n ? "（" + n + "）" : ""}`;
  }).join(`
`);
}
function Ht(e) {
  const { R: t, files: r, disabled: a, uploading: n, inputRef: i, onPick: u, onChange: p, onAdd: l, onRemove: y } = e, m = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    maxWidth: 220,
    padding: "2px 6px 2px 8px",
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.4,
    background: "var(--app-surface-subtle, rgba(127,127,127,0.07))",
    border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.22))",
    color: "var(--app-text-secondary, inherit)"
  }, T = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: a || n ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: a || n ? 0.6 : 1
  };
  return t.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    r.map((g, w) => t.createElement(
      "span",
      { key: "att" + w, style: m },
      t.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: g.file_name
      }, g.file_name + (g.size ? "（" + Ee(g.size) + "）" : "")),
      t.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          a || y(w);
        }
      }, "×")
    )),
    t.createElement("button", {
      type: "button",
      disabled: a || n,
      style: T,
      title: "与输入框相同的附件限制",
      onClick: u
    }, n ? "上传中…" : "📎 附件"),
    t.createElement("input", {
      "data-qm-file": "true",
      ref: i,
      type: "file",
      multiple: !0,
      style: { display: "none" },
      onChange: p
    })
  );
}
function Oe(e) {
  const t = W().React, r = Jt(), { Input: a, Button: n } = r, i = a.TextArea, u = e.data || {}, p = ge(u), l = ye(u), y = be(u), m = ve(y), T = m ? "" : y, g = p.questions || [], w = p.title || "问卷", d = Gt(l), [b, I] = t.useState(
    () => !!(d && d.answered) || !!T || m
  ), [ct, Qt] = t.useState(""), [Q, Vt] = t.useState(""), [_, V] = t.useState(
    () => d && typeof d.visStep == "number" && d.visStep >= 0 ? d.visStep : 0
  ), [N, lt] = t.useState(() => {
    const o = {};
    g.forEach((c, f) => {
      o[`q${f}`] = { type: c.type, value: c.type === "multi" ? [] : "", other: "" };
    });
    const s = d && d.answers;
    return s && typeof s == "object" && Object.keys(s).forEach((c) => {
      o[c] && (o[c] = { ...o[c], ...s[c] });
    }), o;
  }), [D, Kt] = t.useState(
    () => d && typeof d.finalOther == "string" ? d.finalOther : ""
  ), [k, K] = t.useState(!1), [ut, Y] = t.useState(
    () => d && typeof d.localResult == "string" ? d.localResult : ""
  ), [B, H] = t.useState(
    () => !!(d && d.skippedAll) || /跳过了本次问卷/.test(T || "")
  ), [J, dt] = t.useState(
    () => d && Array.isArray(d.finalOtherAtt) ? d.finalOtherAtt : []
  ), [Z, vt] = t.useState(
    () => !!(d && d.expanded)
  ), [Yt, tt] = t.useState(!1), ft = t.useRef(0), U = t.useRef(0);
  t.useEffect(() => (U.current && clearTimeout(U.current), U.current = setTimeout(() => {
    Re(l, {
      visStep: _,
      answers: N,
      finalOther: D,
      finalOtherAtt: J,
      answered: b,
      skippedAll: B,
      expanded: Z,
      localResult: ut
    });
  }, 400), () => {
    U.current && clearTimeout(U.current);
  }), [
    l,
    _,
    N,
    D,
    J,
    b,
    B,
    Z,
    ut
  ]);
  const et = t.useRef(null), [St, xt] = t.useState(!1), wt = async (o, s) => {
    const c = Array.from(o.target.files || []);
    if (o.target.value = "", !!c.length) {
      xt(!0);
      for (const f of c) {
        const x = await we(f);
        x && (s === "final" ? dt((A) => A.concat([x])) : lt((A) => {
          const O = A[nt] || { type: h.type, value: h.type === "multi" ? [] : "", other: "" };
          return { ...A, [nt]: { ...O, attachments: (O.attachments || []).concat([x]) } };
        }));
      }
      xt(!1);
    }
  }, Et = () => {
    et.current && et.current.click();
  };
  t.useEffect(() => {
    if (!m || ct) return;
    let o = !0;
    return Wt(l).then((s) => {
      !o || !s || (s.kind === "skipped" && !s.answers && H(!0), Qt(Se(g, s)));
    }), () => {
      o = !1;
    };
  }, [m, l, ct]), t.useEffect(() => {
    if (b) return;
    let o = !0, s = 0, c = 0, f = 0;
    ft.current || (ft.current = Date.now());
    const x = (S) => {
      !o || !S || !S.request_id || (Vt(S.request_id), tt(!1), c && (clearTimeout(c), c = 0), f && (clearTimeout(f), f = 0), Ae(l, S.request_id, S.session_id || G()));
    }, A = Dt(l), O = async () => {
      if (!A) return !1;
      const S = await Ie(A.request_id);
      if (!o) return !0;
      if (S.kind === "found") {
        const C = S.data;
        return C.tool_call_id && l && C.tool_call_id !== l ? (j(l), !1) : (x(C), !0);
      }
      return S.kind === "absent" && j(l), !1;
    }, ce = () => {
      o && (s += 1, c = setTimeout(Ft, s < 8 ? 700 : 5e3));
    }, Bt = () => {
      xe(l, G()).then((S) => {
        if (o) {
          if (S) {
            x(S);
            return;
          }
          Wt(l).then((C) => {
            if (o) {
              if (C) {
                C.kind === "skipped" && !C.answers && H(!0), I(!0), j(l);
                return;
              }
              ce();
            }
          });
        }
      });
    }, Ft = () => {
      if (o) {
        if (!A) {
          Bt();
          return;
        }
        O().then((S) => {
          !o || S || Bt();
        });
      }
    };
    return f = setTimeout(() => {
      o && tt(!0);
    }, _e), Ft(), () => {
      o = !1, c && clearTimeout(c), f && clearTimeout(f);
    };
  }, [b, l]);
  const Zt = async () => {
    const o = G();
    K(!0);
    try {
      const s = Dt(l);
      if (s && o) {
        const c = await fetch(
          $("/question-modal/skip"),
          {
            method: "POST",
            headers: z(),
            body: JSON.stringify({ request_id: s.request_id, session_id: o })
          }
        );
        if (!c.ok) throw new Error((await c.json().catch(() => ({}))).detail || "HTTP " + c.status);
        j(l), H(!0), Y("用户跳过了本次问卷。"), I(!0), tt(!1), E("info", "已释放本次问卷，会话可继续");
      } else if (o) {
        const c = await fetch(
          $("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(o),
          { method: "POST", headers: z() }
        );
        if (!c.ok) throw new Error("HTTP " + c.status);
        H(!0), Y("已释放本会话的问卷阻塞（同时释放本会话其他未答问卷）。"), I(!0), tt(!1), E("info", "已释放本会话的问卷，会话可继续");
      } else
        throw new Error("拿不到当前会话 id");
    } catch (s) {
      E("error", "释放失败: " + (s && s.message ? s.message : s));
    } finally {
      K(!1);
    }
  }, _t = st(g, N), X = _t.length, q = _ >= X, R = q ? -1 : _t[_], v = R >= 0 ? g[R] : null, nt = `q${R}`, h = R >= 0 && N[nt] || { type: v && v.type || "text", value: v && v.type === "multi" ? [] : "", other: "" }, F = (o) => lt((s) => {
    const c = { ...o, skipped: !1 }, f = { ...s, [nt]: c }, x = st(g, f);
    return g.forEach((A, O) => {
      x.indexOf(O) === -1 && delete f[`q${O}`];
    }), f;
  });
  t.useEffect(() => {
    _ > X && V(X);
  }, [X, _]);
  const kt = async (o, s) => {
    K(!0);
    try {
      const c = await fetch($(o), {
        method: "POST",
        headers: z(),
        body: JSON.stringify(s)
      });
      if (!c.ok) {
        const f = await c.json().catch(() => ({}));
        throw new Error(f && f.detail || "HTTP " + c.status);
      }
    } finally {
      K(!1);
    }
  }, At = async () => {
    if (!Q) {
      E("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await kt("/question-modal/answer", {
        request_id: Q,
        session_id: G(),
        answers: N,
        other: D,
        attachments: J
      }), E("success", "✓ 已提交答案"), j(l), Y(qe(g, N, D, J)), I(!0);
    } catch (o) {
      E("error", "提交失败: " + o.message);
    }
  }, te = () => {
    R < 0 || (lt((o) => {
      const s = { ...o };
      s[`q${R}`] = {
        type: (o[`q${R}`] || {}).type || v && v.type || "text",
        value: ((o[`q${R}`] || {}).type || v && v.type) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const c = st(g, s);
      return g.forEach((f, x) => {
        c.indexOf(x) === -1 && delete s[`q${x}`];
      }), s;
    }), V((o) => o + 1));
  }, ee = async () => {
    if (!Q) {
      E("warning", "问卷尚未就绪，请稍候");
      return;
    }
    try {
      await kt("/question-modal/skip", {
        request_id: Q,
        session_id: G()
      }), E("info", "已跳过问卷"), j(l), H(!0), Y("用户跳过了本次问卷。"), I(!0);
    } catch (o) {
      E("error", "跳过失败: " + o.message);
    }
  }, pt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Rt = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Tt = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, ht = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, It = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, ne = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, mt = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, re = { display: "flex", flexDirection: "column", gap: 8 }, qt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, rt = {
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
  }, Ot = {
    ...rt,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, oe = {
    ...rt,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Ct = {
    ...rt,
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
  }, ae = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Ct,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, se = { height: 32, fontSize: 13, borderRadius: 8 }, jt = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, $t = (o) => {
    const s = M(o);
    return h.type === "multi" ? Array.isArray(h.value) && h.value.indexOf(s) !== -1 : h.value === s;
  }, zt = $t(P), Pt = (o) => {
    if (b || k) return;
    const s = M(o);
    if (h.type === "multi") {
      const c = Array.isArray(h.value) ? h.value.slice() : [], f = c.indexOf(s);
      f === -1 ? c.push(s) : c.splice(f, 1), F({ ...h, value: c, other: c.indexOf(P) !== -1 ? h.other : "" });
    } else
      F({ ...h, value: s });
  }, Nt = (o, s, c, f) => t.createElement("button", {
    key: f,
    type: "button",
    disabled: b || k,
    style: s ? ae : Ct,
    onClick: c
  }, (s ? "✓ " : "") + o);
  if (b)
    return B && !Z ? t.createElement(
      "div",
      {
        style: {
          ...pt,
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
        { style: { ...ht, flex: 1, opacity: 0.75 } },
        w
      ),
      t.createElement("button", {
        type: "button",
        style: {
          ...Ot,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => vt(!0)
      }, "展开")
    ) : t.createElement(
      "div",
      { style: pt, className: "qm-card", "data-qm-card": "true" },
      t.createElement(
        "div",
        { style: { ...Rt, marginBottom: 8, paddingBottom: 8 } },
        t.createElement(
          "div",
          { style: Tt },
          Lt(t),
          t.createElement("span", { style: ht }, w)
        ),
        t.createElement(
          "span",
          { style: { ...It, color: "var(--app-success-text, #389e0d)" } },
          B ? "已跳过" : "已完成"
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
      }, B ? `已跳过本次问卷。

` + yt(g) : ut || ct || T || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + yt(g)),
      B && Z ? t.createElement(
        "div",
        { style: qt },
        t.createElement("button", {
          type: "button",
          style: Ot,
          onClick: () => vt(!1)
        }, "收起")
      ) : null
    );
  let ot = null;
  if (q)
    ot = t.createElement(
      "div",
      null,
      t.createElement("div", { style: mt }, "其他意见（可选）"),
      t.createElement(i, {
        rows: 2,
        placeholder: "补充意见（可选）",
        value: D,
        style: jt,
        onChange: (o) => Kt(o.target.value)
      }),
      Ht({
        R: t,
        files: J,
        disabled: b || k,
        uploading: St,
        inputRef: et,
        onPick: Et,
        onChange: (o) => wt(o, "final"),
        onAdd: (o) => dt((s) => s.concat([o])),
        onRemove: (o) => dt((s) => s.filter((c, f) => f !== o))
      })
    );
  else if (v && v.type === "text")
    ot = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...mt, fontSize: 13, color: "var(--app-text, inherit)" } }, v.title),
      t.createElement(i, {
        rows: 2,
        placeholder: "请输入...",
        value: typeof h.value == "string" ? h.value : "",
        style: jt,
        onChange: (o) => F({ ...h, value: o.target.value, other: "" })
      })
    );
  else if (v) {
    const o = (v.options || []).map((s, c) => Nt(L(s), $t(s), () => Pt(s), "o" + c));
    o.push(Nt("其他", zt, () => Pt(P), "other")), zt && (o.push(t.createElement(a, {
      key: "oi",
      placeholder: "请填写",
      value: h.other,
      style: { ...se, marginTop: 2 },
      onChange: (s) => F({ ...h, other: s.target.value })
    })), o.push(Ht({
      R: t,
      files: h.attachments || [],
      disabled: b || k,
      uploading: St,
      inputRef: et,
      onPick: Et,
      onChange: (s) => wt(s, "q"),
      onAdd: (s) => F({
        ...h,
        attachments: (h.attachments || []).concat([s])
      }),
      onRemove: (s) => F({
        ...h,
        attachments: (h.attachments || []).filter((c, f) => f !== s)
      })
    }))), ot = t.createElement(
      "div",
      null,
      t.createElement("div", { style: { ...mt, fontSize: 13, color: "var(--app-text, inherit)" } }, v.title),
      t.createElement("div", { style: { ...re, marginTop: 8 } }, o)
    );
  }
  const gt = X + 1, ie = q ? gt + "/" + gt : _ + 1 + "/" + gt, at = {
    ...rt,
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
    { style: pt, className: "qm-card", "data-qm-card": "true" },
    t.createElement(
      "div",
      { style: Rt },
      t.createElement(
        "div",
        { style: Tt },
        Lt(t),
        t.createElement("span", { style: ht }, w)
      ),
      t.createElement("span", { style: It }, ie)
    ),
    t.createElement("div", { style: ne }, ot),
    // ── self-rescue banner: cannot obtain this survey's request_id ──
    Yt && !b ? t.createElement(
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
        "⚠️ 无法连接问卷服务（已持续 " + Math.max(1, Math.round((Date.now() - (ft.current || Date.now())) / 1e3)) + " 秒）。问卷阻塞着整个会话，此时发新消息会报「A task is already running」。"
      ),
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: {
          ...at,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Zt,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    t.createElement(
      "div",
      { style: qt },
      t.createElement("button", {
        type: "button",
        disabled: _ === 0 || k,
        style: { ...at, marginRight: "auto", opacity: _ === 0 ? 0.5 : 1 },
        onClick: () => V((o) => o - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: at,
        onClick: q ? At : te
      }, q ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: at,
        onClick: ee
      }, "跳过问卷"),
      t.createElement("button", {
        type: "button",
        disabled: k,
        style: oe,
        onClick: () => {
          q ? At() : V((o) => o + 1);
        }
      }, q ? "提交" : "下一步")
    )
  );
}
function Ce() {
  const e = ue();
  if (!e || typeof e.toolRender != "function") return !1;
  try {
    return pe(), e.toolRender(le, Mt, Oe), console.log("[question-modal] registered via chat.toolRender for", Mt), !0;
  } catch (t) {
    return console.error("[question-modal] toolRender failed:", t), !1;
  }
}
(function e(t) {
  if (!Ce()) {
    if (t > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => e(t + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.0 — card-state persistence + attachments)");
