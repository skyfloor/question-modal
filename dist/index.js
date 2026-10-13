const Nt = "question-modal", it = "question_modal";
function X() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Bt() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function pt() {
  return X().antd || {};
}
function Ft() {
  return X().antdIcons || {};
}
const Mt = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function ct(t) {
  const e = Ft();
  for (const n of Mt) {
    const a = e[n];
    if (a)
      return t.createElement(a, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Lt() {
  try {
    const t = "question-modal-styles";
    if (document.getElementById(t)) return;
    const e = document.createElement("style");
    e.id = t, e.textContent = [
      // Match the composer input: 1px solid --app-border-strong, radius 12,
      // --app-surface-raised fill (see `.qwenpaw-sender-content` / `.ant-input`).
      ".qm-card{",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45))!important;",
      "border-radius:12px!important;",
      "background:var(--app-surface-raised,#fff)!important;",
      "transition:border-color .16s ease,box-shadow .16s ease}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function q(t) {
  try {
    const e = X();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let ht = "", mt = "";
function Me(t, e) {
  t && (mt = t), e && (ht = e);
}
function R() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = X(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let a = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    a || (a = ht), a && (t["X-Agent-Id"] = a);
  } catch {
  }
  return t;
}
function gt() {
  try {
    const e = X();
    if (typeof e.getCurrentSessionId == "function") {
      const n = e.getCurrentSessionId() || "";
      if (n) return n;
    }
  } catch {
  }
  const t = window.currentSessionId;
  return typeof t == "string" && t ? t : mt;
}
function $(t) {
  const e = te(t);
  return e && e.session_id ? e.session_id : gt();
}
function y(t, e) {
  try {
    const n = pt().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const M = "__other__";
function J(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function U(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function Dt(t, e) {
  const n = /* @__PURE__ */ new Set(), a = (i) => {
    i != null && i !== "" && n.add(String(i));
  }, r = t.options || [];
  if (t.type === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((f) => {
      a(f);
      const d = r.find((c) => J(c) === String(f));
      d && a(U(d)), String(f) === M && e.other && a(e.other);
    });
  else {
    a(e.value);
    const i = r.find((f) => J(f) === String(e.value));
    i && a(U(i)), String(e.value) === M && e.other && a(e.other);
  }
  return n;
}
function Wt(t, e) {
  return (Array.isArray(t) ? t : [t]).some((a) => {
    const r = String(a);
    if (r.startsWith("=")) return e.has(r.slice(1));
    if (e.has(r)) return !0;
    for (const i of Array.from(e))
      if (i && (i.indexOf(r) !== -1 || r.indexOf(i) !== -1)) return !0;
    return !1;
  });
}
function yt(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const r = parseInt(n[1], 10);
    if (r >= 0 && r < e.length) return r;
  }
  return e.findIndex((r) => (r.title || "").trim() === t.trim());
}
function bt(t, e, n) {
  const a = e[t], r = a && a.showIf;
  if (!r || typeof r != "object" || !Object.keys(r).length) return !0;
  for (const i of Object.keys(r)) {
    const f = yt(i, e);
    if (f < 0) continue;
    const d = e[f];
    if (!d) continue;
    if (d.showIf && !bt(f, e, n)) return !1;
    const c = n[`q${f}`];
    if (!c || !Wt(r[i], Dt(d, c))) return !1;
  }
  return !0;
}
function fe(t, e) {
  const n = [];
  return t.forEach((a, r) => {
    bt(r, t, e) && n.push(r);
  }), n;
}
function Ht(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function Jt(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function Ut(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, a = n && n.output;
    return a ? typeof a == "string" ? a : Array.isArray(a) ? a.map((r) => r && (r.text || r.content) || "").join(`
`) : String(a) : "";
  } catch {
    return "";
  }
}
function Xt(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function Gt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers)
    return `已跳过本次问卷。

` + he(t);
  const n = e && e.answers || {}, a = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((r) => {
    const i = n[r];
    if (!i || typeof i != "object") return;
    const f = yt(r, t), d = f >= 0 ? t[f] : null, c = d ? d.type === "single" ? "单选" : d.type === "multi" ? "多选" : "问答" : "问答", b = d ? d.title : r;
    let m = i.value;
    Array.isArray(m) && (m = m.join("、")), i.other && (m = (m ? m + "、" : "") + i.other), i.skipped ? a.push(`- ${r} [${c}] ${b}（用户跳过本题）`) : a.push(`- ${r} [${c}] ${b}：${m === "" || m == null ? "（空）" : m}`);
  }), e.other && a.push("", `其他意见：${e.other}`), a.join(`
`);
}
async function Qt(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const a = await fetch(
      q("/question-modal/resolve") + "?" + n.toString(),
      { headers: R() }
    );
    if (!a.ok) return { kind: "error" };
    const r = await a.json();
    return r && Me(r.session_id, r.agent_id), r && r.found ? { kind: "found", data: r } : r && r.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function ze(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      q("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: R() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function Vt(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = R();
    delete n["Content-Type"];
    const a = await fetch(
      q("/console/upload"),
      { method: "POST", headers: n, body: e }
    );
    if (!a.ok) {
      const i = await a.text().catch(() => "");
      let f = "HTTP " + a.status;
      try {
        const d = JSON.parse(i);
        d && d.detail && (f = d.detail);
      } catch {
      }
      return { ok: !1, error: `${t.name}: ${f}` };
    }
    const r = await a.json();
    return !r || !r.url ? { ok: !1, error: `${t.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(r.url), file_name: String(r.file_name || t.name), size: r.size }
    };
  } catch (e) {
    return { ok: !1, error: `${t.name}: ${e && e.message || e}` };
  }
}
const me = "qm:v1:stash_att:", lt = 25 * 1024 * 1024, de = /* @__PURE__ */ new Map(), pe = /* @__PURE__ */ new Map();
let ge = null, ye = 0, Ne = null;
function ut() {
  const t = ye > 0;
  pe.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function Kt() {
  if (Ne) return Ne;
  if (typeof document > "u" || !document.createElement) return null;
  let t = null;
  try {
    t = document.createElement("input");
  } catch {
    return null;
  }
  if (!t) return null;
  try {
    t.type = "file", t.multiple = !0, t.setAttribute("data-qm-file", "true"), t.style.display = "none";
  } catch {
  }
  t.onchange = async (e) => {
    let n = [];
    try {
      n = Array.from(e && e.target && e.target.files || []);
    } catch {
      n = [];
    }
    try {
      e && e.target && (e.target.value = "");
    } catch {
    }
    const a = ge;
    ge = null, !(!a || !n.length) && await vt(n, a.callId, a.target, a.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Ne = t, t;
}
function Yt(t, e, n) {
  if (!t) {
    y("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  ge = { callId: t, target: e, key: n };
  const a = Kt();
  if (a && typeof a.click == "function")
    try {
      a.click();
      return;
    } catch {
    }
  a || (ge = null);
}
async function vt(t, e, n, a) {
  ye += 1, ut();
  const r = [], i = [];
  try {
    for (const d of t) {
      if (d.size && d.size > lt) {
        i.push(`${d.name}: 文件过大（上限 ${Math.round(lt / 1024 / 1024)} MB）`);
        continue;
      }
      const c = await Vt(d);
      c.ok ? r.push(c.att) : i.push(c.error);
    }
  } finally {
    ye -= 1, ut();
  }
  const f = de.get(e);
  if (r.length || i.length) {
    const d = n === "final" ? "final" : "q";
    if (!e) {
      y(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (f)
      try {
        f(r, d, a, i);
      } catch {
      }
    else r.length && Zt(e, r, d, a);
  }
}
function Zt(t, e, n, a) {
  if (!(!t || !e.length))
    try {
      const r = localStorage.getItem(me + t), i = r ? JSON.parse(r) : [], f = (Array.isArray(i) ? i : []).concat(
        e.map((d) => ({ att: d, target: n, key: a }))
      );
      localStorage.setItem(me + t, JSON.stringify(f));
    } catch {
    }
}
function en(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(me + t);
    if (!e) return [];
    localStorage.removeItem(me + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function tn(t) {
  const e = t && t.clipboardData;
  if (!e) return [];
  let n = [];
  try {
    n = Array.from(e.files || []);
  } catch {
    n = [];
  }
  if (!n.length)
    try {
      n = Array.from(e.items || []).filter((a) => a && a.kind === "file").map((a) => a.getAsFile ? a.getAsFile() : null).filter((a) => !!a);
    } catch {
      n = [];
    }
  return n;
}
function nn(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Be(t, e) {
  const n = e || $(t), a = te(t), r = a && a.request_id ? a.request_id : "";
  if (r)
    try {
      const i = await fetch(q("/question-modal/skip"), {
        method: "POST",
        headers: R(),
        body: JSON.stringify({ request_id: r, session_id: n || "" })
      });
      if (i.ok) {
        const f = await i.json().catch(() => ({}));
        return A(t), {
          ok: !0,
          released: !0,
          reason: f && f.orphan ? "orphan" : "skipped"
        };
      }
      if (i.status === 404)
        return A(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const i = await fetch(
        q("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: R() }
      );
      if (i.ok) {
        const f = await i.json().catch(() => ({})), d = f && typeof f.cancelled == "number" ? f.cancelled : 0;
        return A(t), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + i.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function ft(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      q("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: R() }
    );
    if (!e.ok) return { ok: !1, released: !1, reason: "http " + e.status };
    const n = await e.json().catch(() => ({}));
    return {
      ok: !0,
      released: !!n.stopped,
      reason: n && n.stopped ? "host-stop" : "gone"
    };
  } catch {
    return { ok: !1, released: !1, reason: "network" };
  }
}
async function rn() {
  try {
    const t = await fetch(
      q("/question-modal/pending"),
      { headers: R() }
    );
    if (!t.ok) return null;
    const e = await t.json(), n = e && e.items || [];
    if (!Array.isArray(n) || n.length !== 1) return null;
    const a = n[0];
    if (!a || !a.request_id) return null;
    const r = await fetch(
      q("/question-modal/resolve") + "?request_id=" + encodeURIComponent(a.request_id),
      { headers: R() }
    );
    if (!r.ok) return null;
    const i = await r.json();
    return i && Me(i.session_id, i.agent_id), i && i.found ? i : null;
  } catch {
    return null;
  }
}
const be = "qm:v1:reqid:", on = 3e4, an = 45e3;
function A(t) {
  if (t)
    try {
      localStorage.removeItem(be + t);
    } catch {
    }
}
function sn() {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const i = localStorage.key(r);
      i && i.indexOf(be) === 0 && t.push(i);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((r) => {
      let i = null;
      try {
        i = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        i = null;
      }
      !i || !i.request_id || !i.ts || Date.now() - i.ts > e ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 50;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, i) => r.ts - i.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
function cn(t, e, n, a) {
  if (!(!t || !e))
    try {
      localStorage.setItem(be + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: a || "",
        tool_call_id: t,
        ts: Date.now()
      })), sn();
    } catch {
    }
}
function te(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(be + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (A(t), null) : n;
  } catch {
    return null;
  }
}
const Le = "qm:v1:state:";
function St(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Le + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function dt(t, e) {
  if (t)
    try {
      const a = { ...St(t) || {}, ...e, ts: Date.now() };
      localStorage.setItem(Le + t, JSON.stringify(a)), ln();
    } catch {
    }
}
function ln() {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const i = localStorage.key(r);
      i && i.indexOf(Le) === 0 && t.push(i);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((r) => {
      let i = null;
      try {
        i = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        i = null;
      }
      !i || !i.ts || Date.now() - i.ts > e ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 80;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, i) => r.ts - i.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
async function un(t) {
  try {
    const e = await fetch(
      q("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: R() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && Me(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function fn(t, e, n, a) {
  const r = ["【用户提交的问卷答案】"], i = new Set(fe(t, e));
  return t.forEach((f, d) => {
    if (!i.has(d)) return;
    const c = e[`q${d}`];
    if (!c) return;
    let b = c.value;
    if (Array.isArray(b))
      b = b.filter((p) => p !== M).map((p) => {
        const v = (f.options || []).find((z) => J(z) === String(p));
        return v ? U(v) : p;
      }).join("、");
    else {
      const p = (f.options || []).find((v) => J(v) === String(b));
      p && (b = U(p)), String(c.value) === M && (b = "");
    }
    const m = f.type === "single" ? "单选" : f.type === "multi" ? "多选" : "问答", O = !!String(b || "").trim() || !!String(c.other || "").trim() || !!(c.attachments && c.attachments.length), k = c.skipped || !O ? "（用户跳过本题）" : b;
    let P = `- q${d} [${m}] ${k}`;
    c.other && !c.skipped && (P += `（其他：${c.other}）`), c.attachments && c.attachments.length && (P += `（附件：${c.attachments.map((p) => p.file_name).join("、")}）`), r.push(P);
  }), n && r.push(`- 其他意见：${n}`), a && a.length && r.push(`- 其他意见附件：${a.map((f) => f.file_name).join("、")}`), r.join(`
`);
}
function he(t) {
  return t.map((e, n) => {
    const a = e.type === "single" ? "单选" : e.type === "multi" ? "多选" : "问答", r = (e.options || []).map(U).join("、");
    return `${n + 1}. [${a}] ${e.title}${r ? "（" + r + "）" : ""}`;
  }).join(`
`);
}
function Fe(t) {
  const { R: e, files: n, disabled: a, uploading: r, error: i, onPick: f, onRemove: d } = t, c = {
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
  }, b = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: a || r ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: a || r ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    n.map((m, O) => e.createElement(
      "span",
      { key: "att" + O, style: c },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: m.file_name
      }, m.file_name + (m.size ? "（" + nn(m.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          a || d(O);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: a || r,
      style: b,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: f
    }, r ? "上传中…" : "📎 附件"),
    i ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + i) : null
  );
}
function dn(t) {
  const e = X().React, n = pt(), { Input: a, Button: r } = n, i = a.TextArea, f = t.data || {}, d = Ht(f), c = Jt(f), b = Ut(f), m = Xt(b), O = m ? "" : b, k = d.questions || [], P = d.title || "问卷", p = St(c), [v, z] = e.useState(
    () => !!(p && p.answered) || !!O || m
  ), [ve, kt] = e.useState(""), [N, _t] = e.useState(() => {
    const o = te(c);
    return o && o.request_id ? o.request_id : p && typeof p.reqId == "string" ? p.reqId : "";
  }), [x, ne] = e.useState(
    () => p && typeof p.visStep == "number" && p.visStep >= 0 ? p.visStep : 0
  ), [L, Se] = e.useState(() => {
    const o = {};
    k.forEach((u, l) => {
      o[`q${l}`] = { type: u.type, value: u.type === "multi" ? [] : "", other: "" };
    });
    const s = p && p.answers;
    return s && typeof s == "object" && Object.keys(s).forEach((u) => {
      o[u] && (o[u] = { ...o[u], ...s[u] });
    }), o;
  }), [G, wt] = e.useState(
    () => p && typeof p.finalOther == "string" ? p.finalOther : ""
  ), [w, C] = e.useState(!1), [Q, ke] = e.useState(""), [V, _e] = e.useState(
    () => p && typeof p.localResult == "string" ? p.localResult : ""
  ), [D, re] = e.useState(
    () => !!(p && p.skippedAll) || /跳过了本次问卷/.test(O || "")
  ), [K, De] = e.useState(
    () => p && Array.isArray(p.finalOtherAtt) ? p.finalOtherAtt : []
  ), [oe, We] = e.useState(
    () => !!(p && p.expanded)
  ), [xt, ae] = e.useState(!1), se = e.useRef(0), [we, Et] = e.useState(""), B = (o, s, u = !1) => {
    Et(o), re(!0), _e(s), ae(!1), z(!0), A(c), u && dt(c, { backendReleased: !0 });
  }, At = async (o, s) => {
    const u = await Be(c, $(c));
    return u.ok ? (B(o, s, u.released), !0) : (ae(!0), Ee(!1), !1);
  }, Y = e.useRef(0);
  e.useEffect(() => (Y.current && clearTimeout(Y.current), Y.current = setTimeout(() => {
    dt(c, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: N,
      visStep: x,
      answers: L,
      finalOther: G,
      finalOtherAtt: K,
      answered: v,
      skippedAll: D,
      expanded: oe,
      localResult: V
    });
  }, 400), () => {
    Y.current && clearTimeout(Y.current);
  }), [
    c,
    N,
    x,
    L,
    G,
    K,
    v,
    D,
    oe,
    V
  ]);
  const [xe, Ee] = e.useState(!1), [Ae, He] = e.useState(""), Je = (o, s, u) => {
    o.length && (s === "final" ? De((l) => l.concat(o)) : Se((l) => {
      const S = u || `q${x}`, I = l[S] || { type: "text", value: "", other: "" };
      return { ...l, [S]: { ...I, attachments: (I.attachments || []).concat(o) } };
    }));
  };
  e.useEffect(() => {
    if (!c) return;
    const o = (l, S, I, E) => {
      Je(l, S, I), E && E.length ? He(E.join("；")) : He("");
    }, s = (l) => Ee(l);
    de.set(c, o), pe.set(c, s);
    const u = en(c);
    return u.length && u.forEach((l) => Je([l.att], l.target, l.key)), Ee(ye > 0), () => {
      de.get(c) === o && de.delete(c), pe.get(c) === s && pe.delete(c);
    };
  }, [c, x]);
  const qe = (o, s) => Yt(c, o, s), Re = (o, s, u) => {
    const l = tn(o);
    if (l.length) {
      try {
        o.preventDefault();
      } catch {
      }
      vt(l, c, s, u);
    }
  };
  e.useEffect(() => {
    if (!m || ve) return;
    let o = !0;
    return ze(c).then((s) => {
      !o || !s || (s.kind === "skipped" && !s.answers && re(!0), kt(Gt(k, s)));
    }), () => {
      o = !1;
    };
  }, [m, c, ve]), e.useEffect(() => {
    if (v) return;
    let o = !0, s = 0, u = 0, l = 0;
    se.current || (se.current = Date.now());
    let S = !!te(c);
    const I = (h) => {
      !o || !h || !h.request_id || (S = !0, _t(h.request_id), ae(!1), u && (clearTimeout(u), u = 0), cn(
        c,
        h.request_id,
        h.session_id || gt(),
        h.agent_id
      ));
    }, E = (h) => {
      o && (u && (clearTimeout(u), u = 0), l && (clearTimeout(l), l = 0), At(
        h,
        h === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, $e = te(c), zt = async () => {
      if (!$e) return !1;
      const h = await un($e.request_id);
      if (!o) return !0;
      if (h.kind === "found") {
        const T = h.data;
        return T.tool_call_id && c && T.tool_call_id !== c ? (A(c), !1) : (I(T), !0);
      }
      return h.kind === "orphan" ? (E("orphan"), !0) : (h.kind === "absent" && A(c), !1);
    }, Pe = (h = !1) => {
      if (o) {
        if (s += 1, h) {
          if (S) {
            E("gone");
            return;
          }
          const T = Date.now() - (se.current || Date.now());
          if (s >= 12 && T >= an) {
            E("gone");
            return;
          }
        }
        u = setTimeout(st, s < 8 ? 700 : 5e3);
      }
    }, at = () => {
      Qt(c, $(c)).then((h) => {
        if (o) {
          if (h.kind === "found") {
            I(h.data);
            return;
          }
          if (h.kind === "orphan") {
            E("orphan");
            return;
          }
          if (h.kind === "error") {
            Pe(!1);
            return;
          }
          rn().then((T) => {
            if (o) {
              if (T) {
                if (T.tool_call_id && c && T.tool_call_id !== c) {
                  ze(c).then((ee) => {
                    if (o) {
                      if (ee) {
                        z(!0), A(c);
                        return;
                      }
                      Pe(!0);
                    }
                  });
                  return;
                }
                I(T);
                return;
              }
              ze(c).then((ee) => {
                if (o) {
                  if (ee) {
                    ee.kind === "skipped" && !ee.answers && re(!0), z(!0), A(c);
                    return;
                  }
                  Pe(!0);
                }
              });
            }
          });
        }
      });
    }, st = () => {
      if (o) {
        if (!$e) {
          at();
          return;
        }
        zt().then((h) => {
          !o || h || at();
        });
      }
    };
    return l = setTimeout(() => {
      o && ae(!0);
    }, on), st(), () => {
      o = !1, u && clearTimeout(u), l && clearTimeout(l);
    };
  }, [v, c]);
  const qt = async () => {
    C(!0);
    try {
      const o = $(c);
      let s = await Be(c, o);
      if ((!s.released || s.reason === "orphan") && s.reason !== "network" && o) {
        const l = await ft(o);
        l.ok && l.released ? s = l : l.ok && !s.ok && (s = { ok: !0, released: !1, reason: "gone" });
      }
      if (!s.ok)
        throw new Error(
          s.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + s.reason + "）"
        );
      if (s.released) {
        const l = s.reason === "host-stop";
        B(
          s.reason === "orphan" ? "orphan" : "",
          s.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : l ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), y(
          "info",
          l ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        B(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), y("info", "本次问卷已失效，已关闭");
    } catch (o) {
      y("error", "释放失败: " + (o && o.message ? o.message : o));
    } finally {
      C(!1);
    }
  }, Ue = async () => {
    C(!0);
    try {
      const o = $(c);
      let s = await Be(c, o);
      if ((!s.released || s.reason === "orphan") && s.reason !== "network" && o) {
        const l = await ft(o);
        l.ok && l.released ? s = l : l.ok && !s.ok && (s = { ok: !0, released: !1, reason: "gone" });
      }
      if (!s.ok) {
        ke(s.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + s.reason + "）。"), y("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (s.released) {
        const l = s.reason === "host-stop";
        ke(l ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), y("info", l ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        ke("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), y("info", "后端已无此阻塞，无需释放");
    } catch (o) {
      y("error", "释放失败: " + (o && o.message ? o.message : o));
    } finally {
      C(!1);
    }
  }, Xe = fe(k, L), Z = Xe.length, F = x >= Z, j = F ? -1 : Xe[x], _ = j >= 0 ? k[j] : null, W = `q${j}`, g = j >= 0 && L[W] || { type: _ && _.type || "text", value: _ && _.type === "multi" ? [] : "", other: "" }, H = (o) => Se((s) => {
    const u = { ...o, skipped: !1 }, l = { ...s, [W]: u }, S = fe(k, l);
    return k.forEach((I, E) => {
      S.indexOf(E) === -1 && delete l[`q${E}`];
    }), l;
  });
  e.useEffect(() => {
    x > Z && ne(Z);
  }, [Z, x]);
  const Ge = async (o, s) => {
    const u = await fetch(q(o), {
      method: "POST",
      headers: R(),
      body: JSON.stringify(s)
    }), l = await u.json().catch(() => ({}));
    if (!u.ok) {
      const S = new Error(l && l.detail || "HTTP " + u.status);
      throw S.status = u.status, S;
    }
    return l;
  }, Qe = async () => {
    if (!N) {
      y("warning", "问卷尚未就绪，请稍候");
      return;
    }
    C(!0);
    try {
      const o = await Ge("/question-modal/answer", {
        request_id: N,
        session_id: $(c),
        answers: L,
        other: G,
        attachments: K
      });
      if (o && o.orphan) {
        fetch(
          q("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent($(c)),
          { method: "POST", headers: R() }
        ).catch(() => {
        }), B(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), y("info", "本次问卷已失效，已关闭");
        return;
      }
      y("success", "✓ 已提交答案"), A(c), _e(fn(k, L, G, K)), z(!0);
    } catch (o) {
      if (o && o.status === 404) {
        B(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), y("info", "本次问卷已失效，已关闭");
        return;
      }
      y("error", "提交失败: " + o.message);
    } finally {
      C(!1);
    }
  }, Rt = () => {
    j < 0 || (Se((o) => {
      const s = { ...o };
      s[`q${j}`] = {
        type: (o[`q${j}`] || {}).type || _ && _.type || "text",
        value: ((o[`q${j}`] || {}).type || _ && _.type) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const u = fe(k, s);
      return k.forEach((l, S) => {
        u.indexOf(S) === -1 && delete s[`q${S}`];
      }), s;
    }), ne((o) => o + 1));
  }, Tt = async () => {
    if (!N) {
      y("warning", "问卷尚未就绪，请稍候");
      return;
    }
    C(!0);
    try {
      const o = await Ge("/question-modal/skip", {
        request_id: N,
        session_id: $(c)
      });
      if (o && o.orphan) {
        B(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), y("info", "本次问卷已失效，已关闭");
        return;
      }
      y("info", "已跳过问卷"), A(c), re(!0), _e("用户跳过了本次问卷。"), z(!0);
    } catch (o) {
      if (o && o.status === 404) {
        B(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), y("info", "本次问卷已失效，已关闭");
        return;
      }
      y("error", "跳过失败: " + o.message);
    } finally {
      C(!1);
    }
  }, Te = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Ve = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Ke = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Ie = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Ye = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, It = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Oe = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Ot = { display: "flex", flexDirection: "column", gap: 8 }, Ce = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, ie = {
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
  }, ce = {
    ...ie,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Ct = {
    ...ie,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Ze = {
    ...ie,
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
  }, jt = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Ze,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, $t = { height: 32, fontSize: 13, borderRadius: 8 }, et = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, tt = (o) => {
    const s = J(o);
    return g.type === "multi" ? Array.isArray(g.value) && g.value.indexOf(s) !== -1 : g.value === s;
  }, nt = tt(M), rt = (o) => {
    if (v || w) return;
    const s = J(o);
    if (g.type === "multi") {
      const u = Array.isArray(g.value) ? g.value.slice() : [], l = u.indexOf(s);
      l === -1 ? u.push(s) : u.splice(l, 1), H({ ...g, value: u, other: u.indexOf(M) !== -1 ? g.other : "" });
    } else
      H({ ...g, value: s });
  }, ot = (o, s, u, l) => e.createElement("button", {
    key: l,
    type: "button",
    disabled: v || w,
    style: s ? jt : Ze,
    onClick: u
  }, (s ? "✓ " : "") + o);
  if (v)
    return D && !oe ? e.createElement(
      "div",
      {
        style: {
          ...Te,
          padding: "8px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        },
        className: "qm-card",
        "data-qm-card": "true"
      },
      e.createElement("span", {
        style: { color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "›"),
      e.createElement(
        "span",
        { style: { fontSize: 13, fontWeight: 500 } },
        we ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      e.createElement("span", {
        style: { ...Ie, flex: Q ? 0 : 1, opacity: 0.75 }
      }, P),
      Q ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Q) : null,
      e.createElement("button", {
        type: "button",
        style: {
          ...ce,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => We(!0)
      }, "展开"),
      // Escape hatch for the「already finished but the chat is still locked」
      // shape: the card can be settled while the agent's Future was never
      // actually resolved (orphaned record / cross-generation reload / race),
      // so the chat keeps answering 409 and the user has nothing left to
      // click.  This button therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      e.createElement("button", {
        type: "button",
        disabled: w,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...ce,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Ue
      }, "释放阻塞")
    ) : e.createElement(
      "div",
      { style: Te, className: "qm-card", "data-qm-card": "true" },
      e.createElement(
        "div",
        { style: { ...Ve, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Ke },
          ct(e),
          e.createElement("span", { style: Ie }, P)
        ),
        e.createElement(
          "span",
          { style: { ...Ye, color: we ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          we ? "已失效" : D ? "已跳过" : "已完成"
        )
      ),
      e.createElement("pre", {
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
      }, D ? V ? V + `

` + he(k) : `已跳过本次问卷。

` + he(k) : V || ve || O || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + he(k)),
      D && oe ? e.createElement(
        "div",
        { style: Ce },
        e.createElement("button", {
          type: "button",
          style: ce,
          onClick: () => We(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Ce, marginTop: 8, gap: 10 } },
        Q ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Q) : null,
        e.createElement("button", {
          type: "button",
          disabled: w,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...ce, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Ue
        }, "释放阻塞")
      )
    );
  let le = null;
  if (F)
    le = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Oe }, "其他意见（可选）"),
      e.createElement(i, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: G,
        style: et,
        onChange: (o) => wt(o.target.value),
        onPaste: (o) => Re(o, "final", "final")
      }),
      Fe({
        R: e,
        files: K,
        disabled: v || w,
        uploading: xe,
        error: Ae,
        onPick: () => qe("final", "final"),
        onRemove: (o) => De((s) => s.filter((u, l) => l !== o))
      })
    );
  else if (_ && _.type === "text")
    le = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Oe, fontSize: 13, color: "var(--app-text, inherit)" } }, _.title),
      e.createElement(i, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof g.value == "string" ? g.value : "",
        style: et,
        onChange: (o) => H({ ...g, value: o.target.value, other: "" }),
        onPaste: (o) => Re(o, "q", W)
      }),
      Fe({
        R: e,
        files: g.attachments || [],
        disabled: v || w,
        uploading: xe,
        error: Ae,
        onPick: () => qe("q", W),
        onRemove: (o) => H({
          ...g,
          attachments: (g.attachments || []).filter((s, u) => u !== o)
        })
      })
    );
  else if (_) {
    const o = (_.options || []).map((s, u) => ot(U(s), tt(s), () => rt(s), "o" + u));
    o.push(ot("其他", nt, () => rt(M), "other")), nt && (o.push(e.createElement(a, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: g.other,
      style: { ...$t, marginTop: 2 },
      onChange: (s) => H({ ...g, other: s.target.value }),
      onPaste: (s) => Re(s, "q", W)
    })), o.push(Fe({
      R: e,
      files: g.attachments || [],
      disabled: v || w,
      uploading: xe,
      error: Ae,
      onPick: () => qe("q", W),
      onRemove: (s) => H({
        ...g,
        attachments: (g.attachments || []).filter((u, l) => l !== s)
      })
    }))), le = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Oe, fontSize: 13, color: "var(--app-text, inherit)" } }, _.title),
      e.createElement("div", { style: { ...Ot, marginTop: 8 } }, o)
    );
  }
  const je = Z + 1, Pt = F ? je + "/" + je : x + 1 + "/" + je, ue = {
    ...ie,
    minWidth: 0,
    height: 32,
    padding: "0 14px",
    fontSize: 12,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  };
  return e.createElement(
    "div",
    { style: Te, className: "qm-card", "data-qm-card": "true" },
    e.createElement(
      "div",
      { style: Ve },
      e.createElement(
        "div",
        { style: Ke },
        ct(e),
        e.createElement("span", { style: Ie }, P)
      ),
      e.createElement("span", { style: Ye }, Pt)
    ),
    e.createElement("div", { style: It }, le),
    // ── escape hatch: a survey blocks the whole chat while it is open ──
    // Shown after STUCK_AFTER_MS regardless of whether the card is healthy:
    // as long as the agent is parked, every new message in this chat answers
    // 409, so the user must always have a way out.
    xt && !v ? e.createElement(
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
      e.createElement(
        "span",
        { style: { flex: 1, minWidth: 180 } },
        "⚠️ 本次问卷已阻塞会话 " + Math.max(1, Math.round((Date.now() - (se.current || Date.now())) / 1e3)) + " 秒。阻塞期间发新消息会报「A task is already running」；" + (N ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: w,
        style: {
          ...ue,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: qt,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    e.createElement(
      "div",
      { style: Ce },
      e.createElement("button", {
        type: "button",
        disabled: x === 0 || w,
        style: { ...ue, marginRight: "auto", opacity: x === 0 ? 0.5 : 1 },
        onClick: () => ne((o) => o - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement("button", {
        type: "button",
        disabled: w,
        style: ue,
        onClick: F ? Qe : Rt
      }, F ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: w,
        style: ue,
        onClick: Tt
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: w,
        style: Ct,
        onClick: () => {
          F ? Qe() : ne((o) => o + 1);
        }
      }, F ? "提交" : "下一步")
    )
  );
}
function pn() {
  const t = Bt();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return Lt(), t.toolRender(Nt, it, dn), console.log("[question-modal] registered via chat.toolRender for", it), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!pn()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
