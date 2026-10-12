//#region src/index.tsx
var e = "question_modal";
function t() {
	return window.QwenPaw?.host || {};
}
function n() {
	return window.QwenPaw?.chat || null;
}
function r() {
	return t().antd || {};
}
function i() {
	return t().antdIcons || {};
}
var a = [
	"FormOutlined",
	"ProfileOutlined",
	"CheckSquareOutlined"
];
function o(e) {
	let t = i();
	for (let n of a) {
		let r = t[n];
		if (r) return e.createElement(r, { style: {
			color: "var(--app-accent, #ff7f16)",
			fontSize: 15
		} });
	}
	return e.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function s() {
	try {
		let e = "question-modal-styles";
		if (document.getElementById(e)) return;
		let t = document.createElement("style");
		t.id = e, t.textContent = [
			".qm-card{",
			"border:1px solid var(--app-border-strong,rgba(127,127,127,0.45))!important;",
			"border-radius:12px!important;",
			"background:var(--app-surface-raised,#fff)!important;",
			"transition:border-color .16s ease,box-shadow .16s ease}"
		].join(""), document.head.appendChild(t);
	} catch {}
}
function c(e) {
	try {
		let n = t();
		if (typeof n.getApiUrl == "function") return n.getApiUrl(e);
	} catch {}
	return "/api" + e;
}
function l() {
	let e = { "Content-Type": "application/json" };
	try {
		let n = t(), r = typeof n.getApiToken == "function" ? n.getApiToken() : "";
		r && (e.Authorization = "Bearer " + r);
		let i = typeof n.getSelectedAgentId == "function" ? n.getSelectedAgentId() : "";
		i && (e["X-Agent-Id"] = i);
	} catch {}
	return e;
}
function u() {
	try {
		let e = t();
		if (typeof e.getCurrentSessionId == "function") return e.getCurrentSessionId() || "";
	} catch {}
	return window.currentSessionId || "";
}
function d(e, t) {
	try {
		let n = r().message;
		if (n && typeof n[e] == "function") {
			n[e](t);
			return;
		}
	} catch {}
	console.log("[question-modal]", e, t);
}
var f = "__other__";
function p(e) {
	return String(e && typeof e == "object" ? e.value ?? e.label ?? "" : e);
}
function m(e) {
	return String(e && typeof e == "object" ? e.label ?? e.value ?? "" : e);
}
function h(e, t) {
	let n = /* @__PURE__ */ new Set(), r = (e) => {
		e != null && e !== "" && n.add(String(e));
	}, i = e.options || [];
	if (e.type === "multi") (Array.isArray(t.value) ? t.value : []).forEach((e) => {
		r(e);
		let n = i.find((t) => p(t) === String(e));
		n && r(m(n)), String(e) === f && t.other && r(t.other);
	});
	else {
		r(t.value);
		let e = i.find((e) => p(e) === String(t.value));
		e && r(m(e)), String(t.value) === f && t.other && r(t.other);
	}
	return n;
}
function g(e, t) {
	return (Array.isArray(e) ? e : [e]).some((e) => {
		let n = String(e);
		if (n.startsWith("=")) return t.has(n.slice(1));
		if (t.has(n)) return !0;
		for (let e of Array.from(t)) if (e && (e.indexOf(n) !== -1 || n.indexOf(e) !== -1)) return !0;
		return !1;
	});
}
function _(e, t) {
	let n = /^q(\d+)$/i.exec(e.trim());
	if (n) {
		let e = parseInt(n[1], 10);
		if (e >= 0 && e < t.length) return e;
	}
	return t.findIndex((t) => (t.title || "").trim() === e.trim());
}
function v(e, t, n) {
	let r = t[e], i = r && r.showIf;
	if (!i || typeof i != "object" || !Object.keys(i).length) return !0;
	for (let e of Object.keys(i)) {
		let r = _(e, t);
		if (r < 0) continue;
		let a = t[r];
		if (!a) continue;
		if (a.showIf && !v(r, t, n)) return !1;
		let o = n[`q${r}`];
		if (!o || !g(i[e], h(a, o))) return !1;
	}
	return !0;
}
function y(e, t) {
	let n = [];
	return e.forEach((r, i) => {
		v(i, e, t) && n.push(i);
	}), n;
}
function ee(e) {
	try {
		let t = e && e.content || [], n = t[0] && t[0].data && t[0].data.arguments;
		return n ? typeof n == "string" ? JSON.parse(n) : n : {};
	} catch {
		return {};
	}
}
function te(e) {
	try {
		let t = e && e.content || [], n = t[0] && t[0].data;
		return n && n.call_id || "";
	} catch {
		return "";
	}
}
function ne(e) {
	try {
		let t = e && e.content || [], n = t[0] && t[0].data, r = n && n.output;
		return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((e) => e && (e.text || e.content) || "").join("\n") : String(r) : "";
	} catch {
		return "";
	}
}
async function re(e, t) {
	try {
		let n = new URLSearchParams();
		e && n.set("tool_call_id", e), t && n.set("session_id", t);
		let r = await fetch(c("/question-modal/resolve") + "?" + n.toString(), { headers: l() });
		if (!r.ok) return null;
		let i = await r.json();
		return i && i.found ? i : null;
	} catch {
		return null;
	}
}
async function ie(e) {
	if (!e) return null;
	try {
		let t = await fetch(c("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(e), { headers: l() });
		if (!t.ok) return null;
		let n = await t.json();
		return n && n.found ? n : null;
	} catch {
		return null;
	}
}
var b = "qm:v1:reqid:", ae = 6e4;
function x(e) {
	if (e) try {
		localStorage.removeItem(b + e);
	} catch {}
}
function S() {
	try {
		let e = [];
		for (let t = 0; t < localStorage.length; t++) {
			let n = localStorage.key(t);
			n && n.indexOf(b) === 0 && e.push(n);
		}
		let t = [];
		if (e.forEach((e) => {
			let n = null;
			try {
				n = JSON.parse(localStorage.getItem(e) || "null");
			} catch {
				n = null;
			}
			!n || !n.request_id || !n.ts || Date.now() - n.ts > 6048e5 ? localStorage.removeItem(e) : t.push(e);
		}), t.length <= 50) return;
		t.map((e) => ({
			k: e,
			ts: (JSON.parse(localStorage.getItem(e) || "{}") || {}).ts || 0
		})).sort((e, t) => e.ts - t.ts).slice(0, t.length - 50).forEach((e) => localStorage.removeItem(e.k));
	} catch {}
}
function oe(e, t, n) {
	if (e && t) try {
		localStorage.setItem(b + e, JSON.stringify({
			request_id: t,
			session_id: n || "",
			tool_call_id: e,
			ts: Date.now()
		})), S();
	} catch {}
}
function se(e) {
	if (!e) return null;
	try {
		let t = localStorage.getItem(b + e);
		if (!t) return null;
		let n = JSON.parse(t);
		return !n || !n.request_id || n.tool_call_id !== e ? (x(e), null) : n;
	} catch {
		return null;
	}
}
async function ce(e) {
	try {
		let t = await fetch(c("/question-modal/resolve") + "?request_id=" + encodeURIComponent(e), { headers: l() });
		if (!t.ok) return { kind: "error" };
		let n = await t.json();
		return n && n.found ? {
			kind: "found",
			data: n
		} : { kind: "absent" };
	} catch {
		return { kind: "error" };
	}
}
function le(e, t, n) {
	let r = ["【用户提交的问卷答案】"], i = new Set(y(e, t));
	return e.forEach((e, n) => {
		if (!i.has(n)) return;
		let a = t[`q${n}`];
		if (!a) return;
		let o = a.value;
		if (Array.isArray(o)) o = o.filter((e) => e !== f).map((t) => {
			let n = (e.options || []).find((e) => p(e) === String(t));
			return n ? m(n) : t;
		}).join("、");
		else {
			let t = (e.options || []).find((e) => p(e) === String(o));
			t && (o = m(t)), String(a.value) === f && (o = "");
		}
		let s = e.type === "single" ? "单选" : e.type === "multi" ? "多选" : "问答", c = !!String(o || "").trim() || !!String(a.other || "").trim(), l = `- q${n} [${s}] ${a.skipped || !c ? "（用户跳过本题）" : o}`;
		a.other && !a.skipped && (l += `（其他：${a.other}）`), r.push(l);
	}), n && r.push(`- 其他意见：${n}`), r.join("\n");
}
function ue(e) {
	return e.map((e, t) => {
		let n = e.type === "single" ? "单选" : e.type === "multi" ? "多选" : "问答", r = (e.options || []).map(m).join("、");
		return `${t + 1}. [${n}] ${e.title}${r ? "（" + r + "）" : ""}`;
	}).join("\n");
}
function C(e) {
	let n = t().React, { Input: i, Button: a } = r(), s = i.TextArea, h = e.data || {}, g = ee(h), _ = te(h), v = ne(h), b = g.questions || [], S = g.title || "问卷", [C, w] = n.useState(!!v), [T, de] = n.useState(""), [E, D] = n.useState(0), [O, fe] = n.useState(() => {
		let e = {};
		return b.forEach((t, n) => {
			e[`q${n}`] = {
				type: t.type,
				value: t.type === "multi" ? [] : "",
				other: ""
			};
		}), e;
	}), [k, pe] = n.useState(""), [A, j] = n.useState(!1), [me, M] = n.useState(""), [N, P] = n.useState(() => /跳过了本次问卷/.test(v || "")), [he, ge] = n.useState(!1), [_e, F] = n.useState(!1), ve = n.useRef(0);
	n.useEffect(() => {
		if (C) return;
		let e = !0, t = 0, n = 0, r = 0;
		ve.current ||= Date.now();
		let i = (t) => {
			e && t && t.request_id && (de(t.request_id), F(!1), n &&= (clearTimeout(n), 0), r &&= (clearTimeout(r), 0), oe(_, t.request_id, t.session_id || u()));
		}, a = se(_), o = async () => {
			if (!a) return !1;
			let t = await ce(a.request_id);
			if (!e) return !0;
			if (t.kind === "found") {
				let e = t.data;
				return e.tool_call_id && _ && e.tool_call_id !== _ ? (x(_), !1) : (i(e), !0);
			}
			return t.kind === "absent" && x(_), !1;
		}, s = () => {
			e && (t += 1, n = setTimeout(l, t < 8 ? 700 : 5e3));
		}, c = () => {
			re(_, u()).then((t) => {
				if (e) {
					if (t) {
						i(t);
						return;
					}
					ie(_).then((t) => {
						if (e) {
							if (t) {
								t.kind === "skipped" && !t.answers && P(!0), w(!0), x(_);
								return;
							}
							s();
						}
					});
				}
			});
		}, l = () => {
			if (e) {
				if (!a) {
					c();
					return;
				}
				o().then((t) => {
					e && !t && c();
				});
			}
		};
		return r = setTimeout(() => {
			e && F(!0);
		}, ae), l(), () => {
			e = !1, n && clearTimeout(n), r && clearTimeout(r);
		};
	}, [C, _]);
	let ye = async () => {
		let e = u();
		j(!0);
		try {
			let t = se(_);
			if (t && e) {
				let n = await fetch(c("/question-modal/skip"), {
					method: "POST",
					headers: l(),
					body: JSON.stringify({
						request_id: t.request_id,
						session_id: e
					})
				});
				if (!n.ok) throw Error((await n.json().catch(() => ({}))).detail || "HTTP " + n.status);
				x(_), P(!0), M("用户跳过了本次问卷。"), w(!0), F(!1), d("info", "已释放本次问卷，会话可继续");
			} else if (e) {
				let t = await fetch(c("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(e), {
					method: "POST",
					headers: l()
				});
				if (!t.ok) throw Error("HTTP " + t.status);
				P(!0), M("已释放本会话的问卷阻塞（同时释放本会话其他未答问卷）。"), w(!0), F(!1), d("info", "已释放本会话的问卷，会话可继续");
			} else throw Error("拿不到当前会话 id");
		} catch (e) {
			d("error", "释放失败: " + (e && e.message ? e.message : e));
		} finally {
			j(!1);
		}
	}, I = y(b, O), L = I.length, R = E >= L, z = R ? -1 : I[E], B = z >= 0 ? b[z] : null, be = `q${z}`, V = z >= 0 && O[be] || {
		type: B && B.type || "text",
		value: B && B.type === "multi" ? [] : "",
		other: ""
	}, H = (e) => fe((t) => {
		let n = {
			...e,
			skipped: !1
		}, r = {
			...t,
			[be]: n
		}, i = y(b, r);
		return b.forEach((e, t) => {
			i.indexOf(t) === -1 && delete r[`q${t}`];
		}), r;
	});
	n.useEffect(() => {
		E > L && D(L);
	}, [L, E]);
	let U = async (e, t) => {
		j(!0);
		try {
			let n = await fetch(c(e), {
				method: "POST",
				headers: l(),
				body: JSON.stringify(t)
			});
			if (!n.ok) {
				let e = await n.json().catch(() => ({}));
				throw Error(e && e.detail || "HTTP " + n.status);
			}
		} finally {
			j(!1);
		}
	}, W = async () => {
		if (!T) {
			d("warning", "问卷尚未就绪，请稍候");
			return;
		}
		try {
			await U("/question-modal/answer", {
				request_id: T,
				session_id: u(),
				answers: O,
				other: k
			}), d("success", "✓ 已提交答案"), x(_), M(le(b, O, k)), w(!0);
		} catch (e) {
			d("error", "提交失败: " + e.message);
		}
	}, xe = () => {
		z < 0 || (fe((e) => {
			let t = { ...e };
			t[`q${z}`] = {
				type: (e[`q${z}`] || {}).type || B && B.type || "text",
				value: ((e[`q${z}`] || {}).type || B && B.type) === "multi" ? [] : "",
				other: "",
				skipped: !0
			};
			let n = y(b, t);
			return b.forEach((e, r) => {
				n.indexOf(r) === -1 && delete t[`q${r}`];
			}), t;
		}), D((e) => e + 1));
	}, Se = async () => {
		if (!T) {
			d("warning", "问卷尚未就绪，请稍候");
			return;
		}
		try {
			await U("/question-modal/skip", {
				request_id: T,
				session_id: u()
			}), d("info", "已跳过问卷"), x(_), P(!0), M("用户跳过了本次问卷。"), w(!0);
		} catch (e) {
			d("error", "跳过失败: " + e.message);
		}
	}, G = {
		background: "var(--app-surface-raised, #fff)",
		border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
		borderRadius: 12,
		boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
		padding: "16px 20px",
		marginBottom: 8,
		color: "var(--app-text, inherit)",
		fontSize: 13
	}, K = {
		marginBottom: 14,
		paddingBottom: 12,
		borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between"
	}, q = {
		flex: 1,
		display: "flex",
		alignItems: "center",
		gap: 8
	}, J = {
		fontSize: 14,
		fontWeight: 600,
		color: "var(--app-text, inherit)"
	}, Ce = {
		background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
		borderRadius: 14,
		padding: "2px 10px",
		fontSize: 12,
		fontWeight: 600,
		color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
		fontFamily: "SF Mono,Monaco,Consolas,monospace",
		flex: "none"
	}, we = {
		display: "flex",
		flexDirection: "column",
		gap: 8,
		marginBottom: 14
	}, Y = {
		fontSize: 12,
		color: "var(--app-text-tertiary, inherit)",
		fontWeight: 500
	}, Te = {
		display: "flex",
		flexDirection: "column",
		gap: 8
	}, Ee = {
		display: "flex",
		gap: 8,
		justifyContent: "flex-end",
		alignItems: "center",
		paddingTop: 8,
		borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
	}, X = {
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
	}, De = {
		...X,
		background: "transparent",
		border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
		color: "var(--app-text-secondary, inherit)",
		boxShadow: "none"
	}, Oe = {
		...X,
		border: "none",
		background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
		color: "var(--app-text-inverse, #fff)",
		boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
	}, ke = {
		...X,
		width: "100%",
		justifyContent: "flex-start",
		minWidth: 0,
		borderRadius: 8,
		fontSize: 13,
		padding: "6px 12px",
		background: "var(--app-surface-subtle, rgba(127,127,127,0.05))",
		border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))",
		color: "var(--app-text-secondary, inherit)",
		whiteSpace: "normal",
		textAlign: "left",
		lineHeight: 1.45,
		height: "auto",
		minHeight: 32,
		alignItems: "center"
	}, Ae = {
		...ke,
		border: "1.5px solid var(--app-accent, #ff7f16)",
		color: "var(--app-accent, #ff7f16)",
		background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
	}, je = {
		height: 32,
		fontSize: 13,
		borderRadius: 8
	}, Me = {
		fontSize: 13,
		borderRadius: 8,
		lineHeight: 1.5
	}, Ne = (e) => {
		let t = p(e);
		return V.type === "multi" ? Array.isArray(V.value) && V.value.indexOf(t) !== -1 : V.value === t;
	}, Pe = Ne(f), Fe = (e) => {
		if (C || A) return;
		let t = p(e);
		if (V.type === "multi") {
			let e = Array.isArray(V.value) ? V.value.slice() : [], n = e.indexOf(t);
			n === -1 ? e.push(t) : e.splice(n, 1), H({
				...V,
				value: e,
				other: e.indexOf(f) === -1 ? "" : V.other
			});
		} else H({
			...V,
			value: t
		});
	}, Ie = (e, t, r, i) => n.createElement("button", {
		key: i,
		type: "button",
		disabled: C || A,
		style: t ? Ae : ke,
		onClick: r
	}, (t ? "✓ " : "") + e);
	if (C) return N && !he ? n.createElement("div", {
		style: {
			...G,
			padding: "8px 14px",
			marginBottom: 8,
			display: "flex",
			alignItems: "center",
			gap: 8
		},
		className: "qm-card",
		"data-qm-card": "true"
	}, n.createElement("span", { style: {
		color: "var(--app-text-tertiary, inherit)",
		fontSize: 12
	} }, "›"), n.createElement("span", { style: {
		fontSize: 13,
		fontWeight: 500
	} }, "✓ 已跳过问卷"), n.createElement("span", { style: {
		...J,
		flex: 1,
		opacity: .75
	} }, S), n.createElement("button", {
		type: "button",
		style: {
			...De,
			minWidth: 0,
			height: 26,
			padding: "0 10px",
			fontSize: 12
		},
		onClick: () => ge(!0)
	}, "展开")) : n.createElement("div", {
		style: G,
		className: "qm-card",
		"data-qm-card": "true"
	}, n.createElement("div", { style: {
		...K,
		marginBottom: 8,
		paddingBottom: 8
	} }, n.createElement("div", { style: q }, o(n), n.createElement("span", { style: J }, S)), n.createElement("span", { style: {
		...Ce,
		color: "var(--app-success-text, #389e0d)"
	} }, N ? "已跳过" : "已完成")), n.createElement("pre", { style: {
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
	} }, N ? "已跳过本次问卷。\n\n" + ue(b) : me || v), N && he ? n.createElement("div", { style: Ee }, n.createElement("button", {
		type: "button",
		style: De,
		onClick: () => ge(!1)
	}, "收起")) : null);
	let Z = null;
	if (R) Z = n.createElement("div", null, n.createElement("div", { style: Y }, "其他意见（可选）"), n.createElement(s, {
		rows: 2,
		placeholder: "补充意见（可选）",
		value: k,
		style: Me,
		onChange: (e) => pe(e.target.value)
	}));
	else if (B && B.type === "text") Z = n.createElement("div", null, n.createElement("div", { style: {
		...Y,
		fontSize: 13,
		color: "var(--app-text, inherit)"
	} }, B.title), n.createElement(s, {
		rows: 2,
		placeholder: "请输入...",
		value: typeof V.value == "string" ? V.value : "",
		style: Me,
		onChange: (e) => H({
			...V,
			value: e.target.value,
			other: ""
		})
	}));
	else if (B) {
		let e = (B.options || []).map((e, t) => Ie(m(e), Ne(e), () => Fe(e), "o" + t));
		e.push(Ie("其他", Pe, () => Fe(f), "other")), Pe && e.push(n.createElement(i, {
			key: "oi",
			placeholder: "请填写",
			value: V.other,
			style: {
				...je,
				marginTop: 2
			},
			onChange: (e) => H({
				...V,
				other: e.target.value
			})
		})), Z = n.createElement("div", null, n.createElement("div", { style: {
			...Y,
			fontSize: 13,
			color: "var(--app-text, inherit)"
		} }, B.title), n.createElement("div", { style: {
			...Te,
			marginTop: 8
		} }, e));
	}
	let Q = L + 1, Le = R ? Q + "/" + Q : E + 1 + "/" + Q, $ = {
		...X,
		minWidth: 0,
		height: 32,
		padding: "0 14px",
		fontSize: 12,
		background: "transparent",
		border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
		color: "var(--app-text-secondary, inherit)",
		boxShadow: "none"
	};
	return n.createElement("div", {
		style: G,
		className: "qm-card",
		"data-qm-card": "true"
	}, n.createElement("div", { style: K }, n.createElement("div", { style: q }, o(n), n.createElement("span", { style: J }, S)), n.createElement("span", { style: Ce }, Le)), n.createElement("div", { style: we }, Z), _e && !C ? n.createElement("div", { style: {
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
	} }, n.createElement("span", { style: {
		flex: 1,
		minWidth: 180
	} }, "⚠️ 无法连接问卷服务（已持续 " + Math.max(1, Math.round((Date.now() - (ve.current || Date.now())) / 1e3)) + " 秒）。问卷阻塞着整个会话，此时发新消息会报「A task is already running」。"), n.createElement("button", {
		type: "button",
		disabled: A,
		style: {
			...$,
			height: 28,
			padding: "0 12px",
			borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
		},
		onClick: ye,
		title: "释放本次问卷的阻塞，让会话恢复可用"
	}, "释放本次问卷")) : null, n.createElement("div", { style: Ee }, n.createElement("button", {
		type: "button",
		disabled: E === 0 || A,
		style: {
			...$,
			marginRight: "auto",
			opacity: E === 0 ? .5 : 1
		},
		onClick: () => D((e) => e - 1)
	}, "上一步"), n.createElement("button", {
		type: "button",
		disabled: A,
		style: $,
		onClick: R ? W : xe
	}, R ? "跳过并提交" : "跳过本题"), n.createElement("button", {
		type: "button",
		disabled: A,
		style: $,
		onClick: Se
	}, "跳过问卷"), n.createElement("button", {
		type: "button",
		disabled: A,
		style: Oe,
		onClick: () => {
			R ? W() : D((e) => e + 1);
		}
	}, R ? "提交" : "下一步")));
}
function w() {
	let t = n();
	if (!t || typeof t.toolRender != "function") return !1;
	try {
		return s(), t.toolRender("question-modal", e, C), console.log("[question-modal] registered via chat.toolRender for", e), !0;
	} catch (e) {
		return console.error("[question-modal] toolRender failed:", e), !1;
	}
}
(function e(t) {
	if (!w()) {
		if (t > 40) {
			console.warn("[question-modal] chat.toolRender never available");
			return;
		}
		setTimeout(() => e(t + 1), 500);
	}
})(0), console.log("[question-modal] frontend loaded (v5 — native toolRender, approval styling)");
//#endregion
