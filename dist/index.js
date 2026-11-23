var ri = Object.defineProperty;
var Za = (t) => {
  throw TypeError(t);
};
var ai = (t, e, n) => e in t ? ri(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var X = (t, e, n) => ai(t, typeof e != "symbol" ? e + "" : e, n), si = (t, e, n) => e.has(t) || Za("Cannot " + n);
var Ka = (t, e, n) => e.has(t) ? Za("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var Sn = (t, e, n) => (si(t, e, "access private method"), n);
function ra() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
let pt = ra();
function vs(t) {
  pt = t;
}
const ws = /[&<>"']/, oi = new RegExp(ws.source, "g"), qs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, ii = new RegExp(qs.source, "g"), li = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Qa = (t) => li[t];
function _e(t, e) {
  if (e) {
    if (ws.test(t))
      return t.replace(oi, Qa);
  } else if (qs.test(t))
    return t.replace(ii, Qa);
  return t;
}
const ci = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function di(t) {
  return t.replace(ci, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const pi = /(^|[^\[])\^/g;
function Z(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (a, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(pi, "$1"), n = n.replace(a, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function Va(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Zt = { exec: () => null };
function Xa(t, e) {
  const n = t.replace(/\|/g, (s, o, p) => {
    let i = !1, h = o;
    for (; --h >= 0 && p[h] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), r = n.split(/ \|/);
  let a = 0;
  if (r[0].trim() || r.shift(), r.length > 0 && !r[r.length - 1].trim() && r.pop(), e)
    if (r.length > e)
      r.splice(e);
    else
      for (; r.length < e; )
        r.push("");
  for (; a < r.length; a++)
    r[a] = r[a].trim().replace(/\\\|/g, "|");
  return r;
}
function En(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let a = 0;
  for (; a < r && t.charAt(r - a - 1) === e; )
    a++;
  return t.slice(0, r - a);
}
function ui(t, e) {
  if (t.indexOf(e[1]) === -1)
    return -1;
  let n = 0;
  for (let r = 0; r < t.length; r++)
    if (t[r] === "\\")
      r++;
    else if (t[r] === e[0])
      n++;
    else if (t[r] === e[1] && (n--, n < 0))
      return r;
  return -1;
}
function Ya(t, e, n, r) {
  const a = e.href, s = e.title ? _e(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
  if (t[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const p = {
      type: "link",
      raw: n,
      href: a,
      title: s,
      text: o,
      tokens: r.inlineTokens(o)
    };
    return r.state.inLink = !1, p;
  }
  return {
    type: "image",
    raw: n,
    href: a,
    title: s,
    text: _e(o)
  };
}
function fi(t, e) {
  const n = t.match(/^(\s+)(?:```)/);
  if (n === null)
    return e;
  const r = n[1];
  return e.split(`
`).map((a) => {
    const s = a.match(/^\s+/);
    if (s === null)
      return a;
    const [o] = s;
    return o.length >= r.length ? a.slice(r.length) : a;
  }).join(`
`);
}
class Bn {
  // set by the lexer
  constructor(e) {
    X(this, "options");
    X(this, "rules");
    // set by the lexer
    X(this, "lexer");
    this.options = e || pt;
  }
  space(e) {
    const n = this.rules.block.newline.exec(e);
    if (n && n[0].length > 0)
      return {
        type: "space",
        raw: n[0]
      };
  }
  code(e) {
    const n = this.rules.block.code.exec(e);
    if (n) {
      const r = n[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: n[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? r : En(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], a = fi(r, n[3] || "");
      return {
        type: "code",
        raw: r,
        lang: n[2] ? n[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : n[2],
        text: a
      };
    }
  }
  heading(e) {
    const n = this.rules.block.heading.exec(e);
    if (n) {
      let r = n[2].trim();
      if (/#$/.test(r)) {
        const a = En(r, "#");
        (this.options.pedantic || !a || / $/.test(a)) && (r = a.trim());
      }
      return {
        type: "heading",
        raw: n[0],
        depth: n[1].length,
        text: r,
        tokens: this.lexer.inline(r)
      };
    }
  }
  hr(e) {
    const n = this.rules.block.hr.exec(e);
    if (n)
      return {
        type: "hr",
        raw: n[0]
      };
  }
  blockquote(e) {
    const n = this.rules.block.blockquote.exec(e);
    if (n) {
      let r = n[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`);
      r = En(r.replace(/^ *>[ \t]?/gm, ""), `
`);
      const a = this.lexer.state.top;
      this.lexer.state.top = !0;
      const s = this.lexer.blockTokens(r);
      return this.lexer.state.top = a, {
        type: "blockquote",
        raw: n[0],
        tokens: s,
        text: r
      };
    }
  }
  list(e) {
    let n = this.rules.block.list.exec(e);
    if (n) {
      let r = n[1].trim();
      const a = r.length > 1, s = {
        type: "list",
        raw: "",
        ordered: a,
        start: a ? +r.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      r = a ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`, this.options.pedantic && (r = a ? r : "[*+-]");
      const o = new RegExp(`^( {0,3}${r})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let p = "", i = "", h = !1;
      for (; e; ) {
        let b = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        p = n[0], e = e.substring(p.length);
        let q = n[2].split(`
`, 1)[0].replace(/^\t+/, (I) => " ".repeat(3 * I.length)), m = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = q.trimStart()) : (k = n[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = q.slice(k), k += n[1].length);
        let g = !1;
        if (!q && /^ *$/.test(m) && (p += m + `
`, e = e.substring(m.length + 1), b = !0), !b) {
          const I = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), T = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), E = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), C = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const w = e.split(`
`, 1)[0];
            if (m = w, this.options.pedantic && (m = m.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), E.test(m) || C.test(m) || I.test(m) || T.test(e))
              break;
            if (m.search(/[^ ]/) >= k || !m.trim())
              i += `
` + m.slice(k);
            else {
              if (g || q.search(/[^ ]/) >= 4 || E.test(q) || C.test(q) || T.test(q))
                break;
              i += `
` + m;
            }
            !g && !m.trim() && (g = !0), p += w + `
`, e = e.substring(w.length + 1), q = m.slice(k);
          }
        }
        s.loose || (h ? s.loose = !0 : /\n *\n *$/.test(p) && (h = !0));
        let x = null, y;
        this.options.gfm && (x = /^\[[ xX]\] /.exec(i), x && (y = x[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: p,
          task: !!x,
          checked: y,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += p;
      }
      s.items[s.items.length - 1].raw = p.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let b = 0; b < s.items.length; b++)
        if (this.lexer.state.top = !1, s.items[b].tokens = this.lexer.blockTokens(s.items[b].text, []), !s.loose) {
          const q = s.items[b].tokens.filter((k) => k.type === "space"), m = q.length > 0 && q.some((k) => /\n.*\n/.test(k.raw));
          s.loose = m;
        }
      if (s.loose)
        for (let b = 0; b < s.items.length; b++)
          s.items[b].loose = !0;
      return s;
    }
  }
  html(e) {
    const n = this.rules.block.html.exec(e);
    if (n)
      return {
        type: "html",
        block: !0,
        raw: n[0],
        pre: n[1] === "pre" || n[1] === "script" || n[1] === "style",
        text: n[0]
      };
  }
  def(e) {
    const n = this.rules.block.def.exec(e);
    if (n) {
      const r = n[1].toLowerCase().replace(/\s+/g, " "), a = n[2] ? n[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = n[3] ? n[3].substring(1, n[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : n[3];
      return {
        type: "def",
        tag: r,
        raw: n[0],
        href: a,
        title: s
      };
    }
  }
  table(e) {
    const n = this.rules.block.table.exec(e);
    if (!n || !/[:|]/.test(n[2]))
      return;
    const r = Xa(n[1]), a = n[2].replace(/^\||\| *$/g, "").split("|"), s = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: n[0],
      header: [],
      align: [],
      rows: []
    };
    if (r.length === a.length) {
      for (const p of a)
        /^ *-+: *$/.test(p) ? o.align.push("right") : /^ *:-+: *$/.test(p) ? o.align.push("center") : /^ *:-+ *$/.test(p) ? o.align.push("left") : o.align.push(null);
      for (const p of r)
        o.header.push({
          text: p,
          tokens: this.lexer.inline(p)
        });
      for (const p of s)
        o.rows.push(Xa(p, o.header.length).map((i) => ({
          text: i,
          tokens: this.lexer.inline(i)
        })));
      return o;
    }
  }
  lheading(e) {
    const n = this.rules.block.lheading.exec(e);
    if (n)
      return {
        type: "heading",
        raw: n[0],
        depth: n[2].charAt(0) === "=" ? 1 : 2,
        text: n[1],
        tokens: this.lexer.inline(n[1])
      };
  }
  paragraph(e) {
    const n = this.rules.block.paragraph.exec(e);
    if (n) {
      const r = n[1].charAt(n[1].length - 1) === `
` ? n[1].slice(0, -1) : n[1];
      return {
        type: "paragraph",
        raw: n[0],
        text: r,
        tokens: this.lexer.inline(r)
      };
    }
  }
  text(e) {
    const n = this.rules.block.text.exec(e);
    if (n)
      return {
        type: "text",
        raw: n[0],
        text: n[0],
        tokens: this.lexer.inline(n[0])
      };
  }
  escape(e) {
    const n = this.rules.inline.escape.exec(e);
    if (n)
      return {
        type: "escape",
        raw: n[0],
        text: _e(n[1])
      };
  }
  tag(e) {
    const n = this.rules.inline.tag.exec(e);
    if (n)
      return !this.lexer.state.inLink && /^<a /i.test(n[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(n[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(n[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(n[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: n[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: n[0]
      };
  }
  link(e) {
    const n = this.rules.inline.link.exec(e);
    if (n) {
      const r = n[2].trim();
      if (!this.options.pedantic && /^</.test(r)) {
        if (!/>$/.test(r))
          return;
        const o = En(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = ui(n[2], "()");
        if (o > -1) {
          const i = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + o;
          n[2] = n[2].substring(0, o), n[0] = n[0].substring(0, i).trim(), n[3] = "";
        }
      }
      let a = n[2], s = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(a);
        o && (a = o[1], s = o[3]);
      } else
        s = n[3] ? n[3].slice(1, -1) : "";
      return a = a.trim(), /^</.test(a) && (this.options.pedantic && !/>$/.test(r) ? a = a.slice(1) : a = a.slice(1, -1)), Ya(n, {
        href: a && a.replace(this.rules.inline.anyPunctuation, "$1"),
        title: s && s.replace(this.rules.inline.anyPunctuation, "$1")
      }, n[0], this.lexer);
    }
  }
  reflink(e, n) {
    let r;
    if ((r = this.rules.inline.reflink.exec(e)) || (r = this.rules.inline.nolink.exec(e))) {
      const a = (r[2] || r[1]).replace(/\s+/g, " "), s = n[a.toLowerCase()];
      if (!s) {
        const o = r[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return Ya(r, s, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let a = this.rules.inline.emStrongLDelim.exec(e);
    if (!a || a[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(a[1] || a[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...a[0]].length - 1;
      let p, i, h = o, b = 0;
      const q = a[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (q.lastIndex = 0, n = n.slice(-1 * e.length + o); (a = q.exec(n)) != null; ) {
        if (p = a[1] || a[2] || a[3] || a[4] || a[5] || a[6], !p)
          continue;
        if (i = [...p].length, a[3] || a[4]) {
          h += i;
          continue;
        } else if ((a[5] || a[6]) && o % 3 && !((o + i) % 3)) {
          b += i;
          continue;
        }
        if (h -= i, h > 0)
          continue;
        i = Math.min(i, i + h + b);
        const m = [...a[0]][0].length, k = e.slice(0, o + a.index + m + i);
        if (Math.min(o, i) % 2) {
          const x = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: x,
            tokens: this.lexer.inlineTokens(x)
          };
        }
        const g = k.slice(2, -2);
        return {
          type: "strong",
          raw: k,
          text: g,
          tokens: this.lexer.inlineTokens(g)
        };
      }
    }
  }
  codespan(e) {
    const n = this.rules.inline.code.exec(e);
    if (n) {
      let r = n[2].replace(/\n/g, " ");
      const a = /[^ ]/.test(r), s = /^ /.test(r) && / $/.test(r);
      return a && s && (r = r.substring(1, r.length - 1)), r = _e(r, !0), {
        type: "codespan",
        raw: n[0],
        text: r
      };
    }
  }
  br(e) {
    const n = this.rules.inline.br.exec(e);
    if (n)
      return {
        type: "br",
        raw: n[0]
      };
  }
  del(e) {
    const n = this.rules.inline.del.exec(e);
    if (n)
      return {
        type: "del",
        raw: n[0],
        text: n[2],
        tokens: this.lexer.inlineTokens(n[2])
      };
  }
  autolink(e) {
    const n = this.rules.inline.autolink.exec(e);
    if (n) {
      let r, a;
      return n[2] === "@" ? (r = _e(n[1]), a = "mailto:" + r) : (r = _e(n[1]), a = r), {
        type: "link",
        raw: n[0],
        text: r,
        href: a,
        tokens: [
          {
            type: "text",
            raw: r,
            text: r
          }
        ]
      };
    }
  }
  url(e) {
    var r;
    let n;
    if (n = this.rules.inline.url.exec(e)) {
      let a, s;
      if (n[2] === "@")
        a = _e(n[0]), s = "mailto:" + a;
      else {
        let o;
        do
          o = n[0], n[0] = ((r = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== n[0]);
        a = _e(n[0]), n[1] === "www." ? s = "http://" + n[0] : s = n[0];
      }
      return {
        type: "link",
        raw: n[0],
        text: a,
        href: s,
        tokens: [
          {
            type: "text",
            raw: a,
            text: a
          }
        ]
      };
    }
  }
  inlineText(e) {
    const n = this.rules.inline.text.exec(e);
    if (n) {
      let r;
      return this.lexer.state.inRawBlock ? r = n[0] : r = _e(n[0]), {
        type: "text",
        raw: n[0],
        text: r
      };
    }
  }
}
const mi = /^(?: *(?:\n|$))+/, gi = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, hi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Xt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, bi = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, _s = /(?:[*+-]|\d{1,9}[.)])/, Ss = Z(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, _s).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), aa = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, yi = /^[^\n]+/, sa = /(?!\s*\])(?:\\.|[^\[\]\\])+/, xi = Z(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", sa).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ki = Z(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, _s).getRegex(), Gn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", oa = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, vi = Z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", oa).replace("tag", Gn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Es = Z(aa).replace("hr", Xt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gn).getRegex(), wi = Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Es).getRegex(), ia = {
  blockquote: wi,
  code: gi,
  def: xi,
  fences: hi,
  heading: bi,
  hr: Xt,
  html: vi,
  lheading: Ss,
  list: ki,
  newline: mi,
  paragraph: Es,
  table: Zt,
  text: yi
}, es = Z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Xt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gn).getRegex(), qi = {
  ...ia,
  table: es,
  paragraph: Z(aa).replace("hr", Xt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", es).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Gn).getRegex()
}, _i = {
  ...ia,
  html: Z(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", oa).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Zt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: Z(aa).replace("hr", Xt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Ss).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Cs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Si = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ns = /^( {2,}|\\)\n(?!\s*$)/, Ei = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Yt = "\\p{P}\\p{S}", Ci = Z(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Yt).getRegex(), Ni = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Ti = Z(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Yt).getRegex(), zi = Z("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Yt).getRegex(), Ai = Z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Yt).getRegex(), Ii = Z(/\\([punct])/, "gu").replace(/punct/g, Yt).getRegex(), Oi = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), $i = Z(oa).replace("(?:-->|$)", "-->").getRegex(), Mi = Z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", $i).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Rn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Pi = Z(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Rn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ts = Z(/^!?\[(label)\]\[(ref)\]/).replace("label", Rn).replace("ref", sa).getRegex(), zs = Z(/^!?\[(ref)\](?:\[\])?/).replace("ref", sa).getRegex(), Li = Z("reflink|nolink(?!\\()", "g").replace("reflink", Ts).replace("nolink", zs).getRegex(), la = {
  _backpedal: Zt,
  // only used for GFM url
  anyPunctuation: Ii,
  autolink: Oi,
  blockSkip: Ni,
  br: Ns,
  code: Si,
  del: Zt,
  emStrongLDelim: Ti,
  emStrongRDelimAst: zi,
  emStrongRDelimUnd: Ai,
  escape: Cs,
  link: Pi,
  nolink: zs,
  punctuation: Ci,
  reflink: Ts,
  reflinkSearch: Li,
  tag: Mi,
  text: Ei,
  url: Zt
}, Bi = {
  ...la,
  link: Z(/^!?\[(label)\]\((.*?)\)/).replace("label", Rn).getRegex(),
  reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Rn).getRegex()
}, ea = {
  ...la,
  escape: Z(Cs).replace("])", "~|])").getRegex(),
  url: Z(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Ri = {
  ...ea,
  br: Z(Ns).replace("{2,}", "*").getRegex(),
  text: Z(ea.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Cn = {
  normal: ia,
  gfm: qi,
  pedantic: _i
}, jt = {
  normal: la,
  gfm: ea,
  breaks: Ri,
  pedantic: Bi
};
class Le {
  constructor(e) {
    X(this, "tokens");
    X(this, "options");
    X(this, "state");
    X(this, "tokenizer");
    X(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || pt, this.options.tokenizer = this.options.tokenizer || new Bn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: Cn.normal,
      inline: jt.normal
    };
    this.options.pedantic ? (n.block = Cn.pedantic, n.inline = jt.pedantic) : this.options.gfm && (n.block = Cn.gfm, this.options.breaks ? n.inline = jt.breaks : n.inline = jt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: Cn,
      inline: jt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Le(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Le(n).inlineTokens(e);
  }
  /**
   * Preprocessing
   */
  lex(e) {
    e = e.replace(/\r\n|\r/g, `
`), this.blockTokens(e, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      const r = this.inlineQueue[n];
      this.inlineTokens(r.src, r.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, n = []) {
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (p, i, h) => i + "    ".repeat(h.length));
    let r, a, s, o;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((p) => (r = p.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length), r.raw.length === 1 && n.length > 0 ? n[n.length - 1].raw += `
` : n.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && (a.type === "paragraph" || a.type === "text") ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.list(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.html(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.def(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && (a.type === "paragraph" || a.type === "text") ? (a.raw += `
` + r.raw, a.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
            href: r.href,
            title: r.title
          });
          continue;
        }
        if (r = this.tokenizer.table(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (s = e, this.options.extensions && this.options.extensions.startBlock) {
          let p = 1 / 0;
          const i = e.slice(1);
          let h;
          this.options.extensions.startBlock.forEach((b) => {
            h = b.call({ lexer: this }, i), typeof h == "number" && h >= 0 && (p = Math.min(p, h));
          }), p < 1 / 0 && p >= 0 && (s = e.substring(0, p + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(s))) {
          a = n[n.length - 1], o && a.type === "paragraph" ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r), o = s.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && a.type === "text" ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r);
          continue;
        }
        if (e) {
          const p = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(p);
            break;
          } else
            throw new Error(p);
        }
      }
    return this.state.top = !0, n;
  }
  inline(e, n = []) {
    return this.inlineQueue.push({ src: e, tokens: n }), n;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(e, n = []) {
    let r, a, s, o = e, p, i, h;
    if (this.tokens.links) {
      const b = Object.keys(this.tokens.links);
      if (b.length > 0)
        for (; (p = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          b.includes(p[0].slice(p[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, p.index) + "[" + "a".repeat(p[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (p = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, p.index) + "[" + "a".repeat(p[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (p = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, p.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (h = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((b) => (r = b.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && r.type === "text" && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.link(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && r.type === "text" && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.emStrong(e, o, h)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.codespan(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.br(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.del(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.autolink(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (!this.state.inLink && (r = this.tokenizer.url(e))) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (s = e, this.options.extensions && this.options.extensions.startInline) {
          let b = 1 / 0;
          const q = e.slice(1);
          let m;
          this.options.extensions.startInline.forEach((k) => {
            m = k.call({ lexer: this }, q), typeof m == "number" && m >= 0 && (b = Math.min(b, m));
          }), b < 1 / 0 && b >= 0 && (s = e.substring(0, b + 1));
        }
        if (r = this.tokenizer.inlineText(s)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (h = r.raw.slice(-1)), i = !0, a = n[n.length - 1], a && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
          continue;
        }
        if (e) {
          const b = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(b);
            break;
          } else
            throw new Error(b);
        }
      }
    return n;
  }
}
class jn {
  constructor(e) {
    X(this, "options");
    this.options = e || pt;
  }
  code(e, n, r) {
    var s;
    const a = (s = (n || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, a ? '<pre><code class="language-' + _e(a) + '">' + (r ? e : _e(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : _e(e, !0)) + `</code></pre>
`;
  }
  blockquote(e) {
    return `<blockquote>
${e}</blockquote>
`;
  }
  html(e, n) {
    return e;
  }
  heading(e, n, r) {
    return `<h${n}>${e}</h${n}>
`;
  }
  hr() {
    return `<hr>
`;
  }
  list(e, n, r) {
    const a = n ? "ol" : "ul", s = n && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + a + s + `>
` + e + "</" + a + `>
`;
  }
  listitem(e, n, r) {
    return `<li>${e}</li>
`;
  }
  checkbox(e) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph(e) {
    return `<p>${e}</p>
`;
  }
  table(e, n) {
    return n && (n = `<tbody>${n}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + n + `</table>
`;
  }
  tablerow(e) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e, n) {
    const r = n.header ? "th" : "td";
    return (n.align ? `<${r} align="${n.align}">` : `<${r}>`) + e + `</${r}>
`;
  }
  /**
   * span level renderer
   */
  strong(e) {
    return `<strong>${e}</strong>`;
  }
  em(e) {
    return `<em>${e}</em>`;
  }
  codespan(e) {
    return `<code>${e}</code>`;
  }
  br() {
    return "<br>";
  }
  del(e) {
    return `<del>${e}</del>`;
  }
  link(e, n, r) {
    const a = Va(e);
    if (a === null)
      return r;
    e = a;
    let s = '<a href="' + e + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + r + "</a>", s;
  }
  image(e, n, r) {
    const a = Va(e);
    if (a === null)
      return r;
    e = a;
    let s = `<img src="${e}" alt="${r}"`;
    return n && (s += ` title="${n}"`), s += ">", s;
  }
  text(e) {
    return e;
  }
}
class ca {
  // no need for block level renderers
  strong(e) {
    return e;
  }
  em(e) {
    return e;
  }
  codespan(e) {
    return e;
  }
  del(e) {
    return e;
  }
  html(e) {
    return e;
  }
  text(e) {
    return e;
  }
  link(e, n, r) {
    return "" + r;
  }
  image(e, n, r) {
    return "" + r;
  }
  br() {
    return "";
  }
}
class Be {
  constructor(e) {
    X(this, "options");
    X(this, "renderer");
    X(this, "textRenderer");
    this.options = e || pt, this.options.renderer = this.options.renderer || new jn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new ca();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new Be(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new Be(n).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, n = !0) {
    let r = "";
    for (let a = 0; a < e.length; a++) {
      const s = e[a];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = s, p = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (p !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(o.type)) {
          r += p || "";
          continue;
        }
      }
      switch (s.type) {
        case "space":
          continue;
        case "hr": {
          r += this.renderer.hr();
          continue;
        }
        case "heading": {
          const o = s;
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, di(this.parseInline(o.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const o = s;
          r += this.renderer.code(o.text, o.lang, !!o.escaped);
          continue;
        }
        case "table": {
          const o = s;
          let p = "", i = "";
          for (let b = 0; b < o.header.length; b++)
            i += this.renderer.tablecell(this.parseInline(o.header[b].tokens), { header: !0, align: o.align[b] });
          p += this.renderer.tablerow(i);
          let h = "";
          for (let b = 0; b < o.rows.length; b++) {
            const q = o.rows[b];
            i = "";
            for (let m = 0; m < q.length; m++)
              i += this.renderer.tablecell(this.parseInline(q[m].tokens), { header: !1, align: o.align[m] });
            h += this.renderer.tablerow(i);
          }
          r += this.renderer.table(p, h);
          continue;
        }
        case "blockquote": {
          const o = s, p = this.parse(o.tokens);
          r += this.renderer.blockquote(p);
          continue;
        }
        case "list": {
          const o = s, p = o.ordered, i = o.start, h = o.loose;
          let b = "";
          for (let q = 0; q < o.items.length; q++) {
            const m = o.items[q], k = m.checked, g = m.task;
            let x = "";
            if (m.task) {
              const y = this.renderer.checkbox(!!k);
              h ? m.tokens.length > 0 && m.tokens[0].type === "paragraph" ? (m.tokens[0].text = y + " " + m.tokens[0].text, m.tokens[0].tokens && m.tokens[0].tokens.length > 0 && m.tokens[0].tokens[0].type === "text" && (m.tokens[0].tokens[0].text = y + " " + m.tokens[0].tokens[0].text)) : m.tokens.unshift({
                type: "text",
                text: y + " "
              }) : x += y + " ";
            }
            x += this.parse(m.tokens, h), b += this.renderer.listitem(x, g, !!k);
          }
          r += this.renderer.list(b, p, i);
          continue;
        }
        case "html": {
          const o = s;
          r += this.renderer.html(o.text, o.block);
          continue;
        }
        case "paragraph": {
          const o = s;
          r += this.renderer.paragraph(this.parseInline(o.tokens));
          continue;
        }
        case "text": {
          let o = s, p = o.tokens ? this.parseInline(o.tokens) : o.text;
          for (; a + 1 < e.length && e[a + 1].type === "text"; )
            o = e[++a], p += `
` + (o.tokens ? this.parseInline(o.tokens) : o.text);
          r += n ? this.renderer.paragraph(p) : p;
          continue;
        }
        default: {
          const o = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return r;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, n) {
    n = n || this.renderer;
    let r = "";
    for (let a = 0; a < e.length; a++) {
      const s = e[a];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          r += o || "";
          continue;
        }
      }
      switch (s.type) {
        case "escape": {
          const o = s;
          r += n.text(o.text);
          break;
        }
        case "html": {
          const o = s;
          r += n.html(o.text);
          break;
        }
        case "link": {
          const o = s;
          r += n.link(o.href, o.title, this.parseInline(o.tokens, n));
          break;
        }
        case "image": {
          const o = s;
          r += n.image(o.href, o.title, o.text);
          break;
        }
        case "strong": {
          const o = s;
          r += n.strong(this.parseInline(o.tokens, n));
          break;
        }
        case "em": {
          const o = s;
          r += n.em(this.parseInline(o.tokens, n));
          break;
        }
        case "codespan": {
          const o = s;
          r += n.codespan(o.text);
          break;
        }
        case "br": {
          r += n.br();
          break;
        }
        case "del": {
          const o = s;
          r += n.del(this.parseInline(o.tokens, n));
          break;
        }
        case "text": {
          const o = s;
          r += n.text(o.text);
          break;
        }
        default: {
          const o = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return r;
  }
}
class Kt {
  constructor(e) {
    X(this, "options");
    this.options = e || pt;
  }
  /**
   * Process markdown before marked
   */
  preprocess(e) {
    return e;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(e) {
    return e;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(e) {
    return e;
  }
}
X(Kt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var dt, ta, As;
class ji {
  constructor(...e) {
    Ka(this, dt);
    X(this, "defaults", ra());
    X(this, "options", this.setOptions);
    X(this, "parse", Sn(this, dt, ta).call(this, Le.lex, Be.parse));
    X(this, "parseInline", Sn(this, dt, ta).call(this, Le.lexInline, Be.parseInline));
    X(this, "Parser", Be);
    X(this, "Renderer", jn);
    X(this, "TextRenderer", ca);
    X(this, "Lexer", Le);
    X(this, "Tokenizer", Bn);
    X(this, "Hooks", Kt);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, n) {
    var a, s;
    let r = [];
    for (const o of e)
      switch (r = r.concat(n.call(this, o)), o.type) {
        case "table": {
          const p = o;
          for (const i of p.header)
            r = r.concat(this.walkTokens(i.tokens, n));
          for (const i of p.rows)
            for (const h of i)
              r = r.concat(this.walkTokens(h.tokens, n));
          break;
        }
        case "list": {
          const p = o;
          r = r.concat(this.walkTokens(p.items, n));
          break;
        }
        default: {
          const p = o;
          (s = (a = this.defaults.extensions) == null ? void 0 : a.childTokens) != null && s[p.type] ? this.defaults.extensions.childTokens[p.type].forEach((i) => {
            const h = p[i].flat(1 / 0);
            r = r.concat(this.walkTokens(h, n));
          }) : p.tokens && (r = r.concat(this.walkTokens(p.tokens, n)));
        }
      }
    return r;
  }
  use(...e) {
    const n = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((r) => {
      const a = { ...r };
      if (a.async = this.defaults.async || a.async || !1, r.extensions && (r.extensions.forEach((s) => {
        if (!s.name)
          throw new Error("extension name required");
        if ("renderer" in s) {
          const o = n.renderers[s.name];
          o ? n.renderers[s.name] = function(...p) {
            let i = s.renderer.apply(this, p);
            return i === !1 && (i = o.apply(this, p)), i;
          } : n.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = n[s.level];
          o ? o.unshift(s.tokenizer) : n[s.level] = [s.tokenizer], s.start && (s.level === "block" ? n.startBlock ? n.startBlock.push(s.start) : n.startBlock = [s.start] : s.level === "inline" && (n.startInline ? n.startInline.push(s.start) : n.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (n.childTokens[s.name] = s.childTokens);
      }), a.extensions = n), r.renderer) {
        const s = this.defaults.renderer || new jn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.renderer[p], h = s[p];
          s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q || "";
          };
        }
        a.renderer = s;
      }
      if (r.tokenizer) {
        const s = this.defaults.tokenizer || new Bn(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const p = o, i = r.tokenizer[p], h = s[p];
          s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q;
          };
        }
        a.tokenizer = s;
      }
      if (r.hooks) {
        const s = this.defaults.hooks || new Kt();
        for (const o in r.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.hooks[p], h = s[p];
          Kt.passThroughHooks.has(o) ? s[p] = (b) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, b)).then((m) => h.call(s, m));
            const q = i.call(s, b);
            return h.call(s, q);
          } : s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q;
          };
        }
        a.hooks = s;
      }
      if (r.walkTokens) {
        const s = this.defaults.walkTokens, o = r.walkTokens;
        a.walkTokens = function(p) {
          let i = [];
          return i.push(o.call(this, p)), s && (i = i.concat(s.call(this, p))), i;
        };
      }
      this.defaults = { ...this.defaults, ...a };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, n) {
    return Le.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return Be.parse(e, n ?? this.defaults);
  }
}
dt = new WeakSet(), ta = function(e, n) {
  return (r, a) => {
    const s = { ...a }, o = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const p = Sn(this, dt, As).call(this, !!o.silent, !!o.async);
    if (typeof r > "u" || r === null)
      return p(new Error("marked(): input parameter is undefined or null"));
    if (typeof r != "string")
      return p(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(r) + ", string expected"));
    if (o.hooks && (o.hooks.options = o), o.async)
      return Promise.resolve(o.hooks ? o.hooks.preprocess(r) : r).then((i) => e(i, o)).then((i) => o.hooks ? o.hooks.processAllTokens(i) : i).then((i) => o.walkTokens ? Promise.all(this.walkTokens(i, o.walkTokens)).then(() => i) : i).then((i) => n(i, o)).then((i) => o.hooks ? o.hooks.postprocess(i) : i).catch(p);
    try {
      o.hooks && (r = o.hooks.preprocess(r));
      let i = e(r, o);
      o.hooks && (i = o.hooks.processAllTokens(i)), o.walkTokens && this.walkTokens(i, o.walkTokens);
      let h = n(i, o);
      return o.hooks && (h = o.hooks.postprocess(h)), h;
    } catch (i) {
      return p(i);
    }
  };
}, As = function(e, n) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const a = "<p>An error occurred:</p><pre>" + _e(r.message + "", !0) + "</pre>";
      return n ? Promise.resolve(a) : a;
    }
    if (n)
      return Promise.reject(r);
    throw r;
  };
};
const ct = new ji();
function G(t, e) {
  return ct.parse(t, e);
}
G.options = G.setOptions = function(t) {
  return ct.setOptions(t), G.defaults = ct.defaults, vs(G.defaults), G;
};
G.getDefaults = ra;
G.defaults = pt;
G.use = function(...t) {
  return ct.use(...t), G.defaults = ct.defaults, vs(G.defaults), G;
};
G.walkTokens = function(t, e) {
  return ct.walkTokens(t, e);
};
G.parseInline = ct.parseInline;
G.Parser = Be;
G.parser = Be.parse;
G.Renderer = jn;
G.TextRenderer = ca;
G.Lexer = Le;
G.lexer = Le.lex;
G.Tokenizer = Bn;
G.Hooks = Kt;
G.parse = G;
G.options;
G.setOptions;
G.use;
G.walkTokens;
G.parseInline;
Be.parse;
Le.lex;
const Is = "question-modal", ts = "question_modal", jr = 3, ns = "gate-v2@2026.10.21";
function ze() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Di() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Ve() {
  return ze().antd || {};
}
function Fi() {
  return ze().antdIcons || {};
}
const Wi = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Dr(t) {
  const e = Fi();
  for (const n of Wi) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Hi() {
  try {
    const t = "question-modal-styles";
    if (document.getElementById(t)) return;
    const e = document.createElement("style");
    e.id = t, e.textContent = [
      // Match the composer input: 1px solid --app-border-strong, radius 12,
      // --app-surface-raised fill (see `.qwenpaw-sender-content` / `.ant-input`).
      // ── US-018: 全局盒模型归一 ──
      // 宿主没有 `*,*::before,*::after{box-sizing:border-box}` 重置（实测其
      // index css 只有 9 处零散 border-box），所以本插件所有元素默认是
      // content-box —— 内联 `width:min(460px,90vw)` 只算内容宽，加左右
      // padding 12×2 后实际占 24px 更多，实测 390 视口下算出 346 却占 372，
      // `maxHeight` 同理（内容 726 + padding = 752，溢出 780 视口）。
      // 这就是「宽度设了 90% 还是超、高度设了上限还是溢出」的真因。
      // 在本插件作用域内统一 border-box，后续所有面板的 width/maxHeight
      // 语义才是「含内边距的实际占位」。
      ".qm-card,.qm-card *,.qm-card *::before,.qm-card *::after,",
      ".qm-analysis-panel,.qm-analysis-panel *{box-sizing:border-box}",
      ".qm-card{",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45))!important;",
      "border-radius:12px!important;",
      "background:var(--app-surface-raised,#fff)!important;",
      "transition:border-color .16s ease,box-shadow .16s ease}",
      // ── Analysis markdown typography ──
      // The model's six-step reasoning comes back as markdown whose default
      // heading sizes (h1 2em, h2 1.5em…) dwarf the survey text and made the
      // bubble look like a different UI.  The user asked for ONE typographic
      // voice: the same size/colour/family as the questionnaire's own text
      // (option rows are 13px, body colour --app-text).  Every element is
      // therefore pinned to that scale; hierarchy is carried by weight and
      // spacing instead of size, and headings never exceed the body.
      ".qm-md{font-size:13px;line-height:1.65;color:var(--app-text,inherit);",
      "word-break:break-word}",
      ".qm-md>*:first-child{margin-top:0}",
      ".qm-md>*:last-child{margin-bottom:0}",
      ".qm-md h1,.qm-md h2,.qm-md h3,.qm-md h4,.qm-md h5,.qm-md h6{",
      "font-size:13px!important;font-weight:600!important;line-height:1.65!important;",
      "margin:10px 0 4px!important;color:var(--app-text,inherit)!important}",
      ".qm-md p,.qm-md li,.qm-md span,.qm-md div,.qm-md td,.qm-md th{",
      "font-size:13px!important;color:var(--app-text,inherit)}",
      ".qm-md ul,.qm-md ol{margin:4px 0!important;padding-left:20px}",
      ".qm-md li{margin:2px 0}",
      ".qm-md strong,.qm-md b{font-weight:600;color:var(--app-text,inherit)}",
      ".qm-md em{font-style:italic}",
      ".qm-md code{font-family:SF Mono,Monaco,Consolas,monospace;font-size:12px;",
      "background:var(--app-surface-subtle,rgba(127,127,127,0.1));",
      "border-radius:4px;padding:1px 4px}",
      ".qm-md pre{background:var(--app-surface-subtle,rgba(127,127,127,0.08));",
      "border-radius:8px;padding:8px 10px;overflow:auto;margin:6px 0}",
      ".qm-md pre code{background:transparent;padding:0}",
      // US-001: header 弹出层菜单项 hover 高亮（内联样式无法表达 :hover）。
      ".qm-hdr-menu-item:hover{background:var(--app-surface-subtle,rgba(127,127,127,0.08))}",
      // US-002: 模式下拉选项 hover 高亮（同上，:hover 需全局样式）。
      ".qm-mode-opt:hover{background:var(--app-surface-subtle,rgba(127,127,127,0.08))}",
      // US-005: 释放阻塞 🔒 icon hover（对齐 demo 的 iconbtn.warn:hover：
      // 边框转 warning 实色；内联样式无法表达 :hover）。
      ".qm-release-lock:hover{color:var(--app-warning-text,#d46b08)!important;",
      "border-color:var(--app-warning,#d46b08)!important}",
      ".qm-md blockquote{margin:6px 0;padding:2px 0 2px 10px;",
      "border-left:2px solid var(--app-border-strong,rgba(127,127,127,0.45));",
      "color:var(--app-text-secondary,inherit)}",
      ".qm-md hr{border:none;border-top:1px solid var(--app-border-subtle,rgba(127,127,127,0.18));",
      "margin:8px 0}",
      ".qm-md a{color:var(--app-accent,#ff7f16);text-decoration:none}",
      // ── 查看分析弹层：隐藏滚动条但保留滚轮/触控滚动（问题2）──
      // 面板用 maxHeight + overflow:auto 裁长内容，浏览器会画出可见滚动条；
      // 这里与模型列表 (:1436 scrollbarWidth:none) 保持一致——隐藏滚动条槽、
      // 仍可滚动。::-webkit-scrollbar 是伪元素，inline style 写不了，必须走 CSS。
      ".qm-bubble{scrollbar-width:none;-ms-overflow-style:none}",
      ".qm-bubble::-webkit-scrollbar{width:0;height:0;display:none}",
      // ── Narrow screens (phones) ──
      // On a phone the card's content box is only ~320px wide, yet the header's
      // right-hand control cluster (model capsule + AI/manual switch + view
      // button) measures ~319px and refuses to shrink (flex:none).  The title
      // therefore collapsed to a single character per line and the view button
      // was clipped off the card edge.
      //
      // Every rule below lives inside a media query, so a desktop viewport
      // (which never matches) renders exactly as before — the inline styles the
      // component sets are untouched, and only the `.qm-*` hooks are new.
      // `!important` is required because the component styles are inline.
      "@media (max-width:640px){",
      // Give the content back the space the wide padding was consuming.
      ".qm-card{padding:12px 14px!important}",
      // Stack the header: the title takes a full row and the controls drop to
      // a second one, so nothing has to be squeezed.
      ".qm-header{flex-wrap:wrap!important;align-items:flex-start!important;",
      "row-gap:10px!important}",
      ".qm-title{white-space:normal!important;word-break:break-word!important}",
      // Controls: full-width row of their own, wrapping instead of clipping.
      // US-006: 第二行控件区右对齐（demo v5 形态）。
      ".qm-actions{flex:1 1 100%!important;flex-wrap:wrap!important;",
      "justify-content:flex-end!important;gap:6px!important}",
      // The analysis bubble was a fixed 460px, which cannot fit a phone.
      // US-013: 口径统一为 100vw-44px（对齐 .qm-hdr-pop 与宽面板 width+maxWidth 双保险）。
      ".qm-bubble{width:auto!important;min-width:0!important;",
      "max-width:calc(100vw - 44px)!important}",
      // Footer keeps its four actions on one or two rows without squashing.
      ".qm-footer{flex-wrap:wrap!important;row-gap:8px!important}",
      // US-006: 窄屏下底部两键均分可用宽度（上一步 / 下一步·提交各占一半）。
      // 「上一步」的内联 marginRight:"auto" 在均分布局下必须归零。
      ".qm-footer button{flex:1 1 0!important;min-width:0!important}",
      ".qm-footer button:first-child{margin-right:0!important}",
      // US-006: header 弹出层（更多菜单 / 上下文气泡 / 模板选择 / 跳过确认 /
      // 模式下拉）统一挂 .qm-hdr-pop 类；窄屏下宽度封顶为视口减两侧边距，
      // 面板贴 right:0 与卡片右缘对齐，max-width 兜住不溢出屏幕。
      // US-012: 口径同步为 100vw-44px（对齐 demo v5 移动端 width 口径，与宽
      // 面板内联 width+maxWidth 双保险一致）；宽面板实际宽度由内联
      // style 控制，本规则对其余 .qm-hdr-pop（更多菜单/跳过确认）仅作超窄屏兜底。
      ".qm-hdr-pop{max-width:calc(100vw - 44px);z-index:10000}",
      "}",
      // ── 设置弹窗 UI（2026-11-12 柔和通透风，参照用户 HTML 稿）──
      // 字体沿用宿主继承（用户要求保持原字体）；颜色/圆角/布局对齐参考稿：
      // primary #3b82f6、主文字 #1e293b、次要 #64748b、分隔线 #f1f5f9、输入底 #f8fafc。
      ".qm-set-wrap{font-size:13px;color:var(--app-text-primary,#1e293b);",
      "max-height:90vh;display:flex;flex-direction:column;overflow:hidden}",
      // 中间内容区滚动（参考稿 .tab-content：flex:1 + 自身滚动），footer 不随内容滚走
      ".qm-set-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-width:none}",
      ".qm-set-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      // Modal 内容层归零内边距，由头部/页签/内容/底部各自控制留白（对齐参考稿 28px 栅格）
      ".qm-set-modal .ant-modal-content{padding:0;border-radius:20px;",
      "box-shadow:0 20px 40px -10px rgba(0,0,0,0.08);overflow:hidden}",
      ".qm-set-head{display:flex;align-items:center;justify-content:space-between;",
      "gap:12px;padding:18px 24px 6px;margin:0}",
      // 「当前模式：」前缀 + 胶囊 组成一个右对齐的横向组（2026-11-13）。
      ".qm-set-runtime-wrap{display:inline-flex;align-items:center;gap:6px;",
      "white-space:nowrap}",
      ".qm-set-runtime-label{font-size:12px;font-weight:400;",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-runtime{font-size:12px;font-weight:500;color:#3b82f6;",
      "background:#eff6ff;padding:6px 12px;border-radius:20px;white-space:nowrap}",
      // 头部右侧组：模式胶囊 + ✕ 左右排列（boss 2026-11-15 四轮：间隔 4 → 6px）
      ".qm-set-right{display:flex;align-items:center;flex:0 0 auto;gap:6px;}",
      // ── 入口图标尺寸（boss 2026-11-15 六轮，红框标注「高度不对」）──
      // 真凶（已从宿主 console CSS 实证）：入口按钮位于 ChatActionGroup
      // 容器内，而宿主有一条命中它的规则——
      //   .ChatActionGroup-module__actionGroup__JK6ht button svg{
      //     width:var(--app-icon-md)!important;    /* = calc(16px*font-scale) */
      //     height:var(--app-icon-md)!important;
      //     stroke-width:1.75 }
      // 该规则 specificity=(0,1,2) 且带 !important，因此：
      //   ① SVG 的 width/height **属性**（最低优先级表现属性）无效；
      //   ② 单类名 .qm-entry-icon(0,1,0)+!important 也压不过它。
      // 于是图标被强制按 16px 渲染，永远比按钮文字(12px)高出一截——
      // 这正是红框里看到的现象。
      // 解法：重复类名把 specificity 提到 (0,2,0)+!important > (0,1,2)，
      // 尺寸取 1em → 恒等于按钮 font-size（12px），与文字等高。
      ".qm-entry-icon.qm-entry-icon.qm-entry-icon{",
      "width:1em!important;height:1em!important;",
      "flex:0 0 1em!important;display:inline-block!important;",
      "vertical-align:-0.125em;margin:0!important;padding:0!important;",
      "box-shadow:none!important;background:none}",
      ".qm-set-close{flex:0 0 auto;width:26px;height:26px;",
      "display:inline-flex;align-items:center;justify-content:center;border:0;",
      "border-radius:8px;background:transparent;cursor:pointer;font-size:14px;",
      "line-height:1;padding:0;color:var(--app-text-tertiary,#94a3b8);",
      "transition:background .15s ease,color .15s ease}",
      ".qm-set-close:hover{background:var(--app-fill-subtle,rgba(127,127,127,0.12));",
      "color:var(--app-text-primary,#1e293b)}",
      // 2026-11-13：胶囊改为纯展示（不可点），toggle 相关样式已移除。
      ".qm-set-title{font-size:20px;font-weight:600;line-height:1.3;letter-spacing:-0.5px}",
      ".qm-set-badge{font-size:11px;padding:2px 9px;border-radius:999px;",
      "background:var(--app-fill-subtle,rgba(127,127,127,0.14));",
      "color:var(--app-text-secondary,#4e5969);white-space:nowrap}",
      // 胶囊页签（参考稿 .tab-item）：灰底胶囊，激活 = 蓝底白字 + 柔光
      ".qm-set-tabs{display:flex;gap:8px;padding:10px 28px 20px;margin:0;border-bottom:0}",
      ".qm-set-tab{background:var(--app-fill-subtle,#f8fafc);border:0;cursor:pointer;",
      "font-size:13px;line-height:1;padding:8px 18px;border-radius:20px;",
      "color:var(--app-text-secondary,#64748b);font-weight:500;border-bottom:0;",
      "transition:all .2s cubic-bezier(.4,0,.2,1)}",
      ".qm-set-tab:hover{color:var(--app-text-primary,#1e293b);",
      "background:var(--app-fill-strong,#e2e8f0)}",
      // 选中态 = 参考稿激活胶囊：蓝底白字 + 投影（类名/结构不变，仅换视觉）。
      // hover 规则 specificity 更高，需显式钉住已选中项的悬停色。
      ".qm-set-tabon{background:#3b82f6;color:#fff;border-bottom:0;border-radius:20px;",
      "font-weight:500;box-shadow:0 4px 12px rgba(59,130,246,.25)}",
      ".qm-set-tabon:hover{background:#3b82f6;color:#fff}",
      ".qm-set-subhint{font-size:12px;color:var(--app-text-tertiary,#86909c);margin:0 28px 6px}",
      // 加载骨架脉动（2026-11-13 方案A）：内容未定时占位，不渲染半成品设置行。
      // 尊重系统「减少动态效果」偏好：开启时不做动画，静态灰块同样能表达"加载中"。
      "@keyframes qm-set-pulse{0%,100%{opacity:.45}50%{opacity:.9}}",
      "@media (prefers-reduced-motion: reduce){",
      ".qm-set-skeleton>div{animation:none!important}}",
      // ── 设置面板移动端适配（2026-11-19 boss 反馈：窄屏显示有问题）──────
      // 问题一：5 个页签在 92vw 容器里被 flex 压缩，页签文字逐字竖排。
      // 问题二：表单行 grid「标签 minmax(0,1fr) + 控件 auto」，窄屏下
      //         标签列被控件列挤到每字一行（「默认答题模式」竖排）。
      // 解法：页签换行排布 + 文字不折行；表单行窄屏整体改单列块布局
      //         （复用 .qm-set-rowblock 既有模式：标签在上、控件占满下排）。
      // 仅 max-width:640px 生效，桌面渲染不变。
      "@media (max-width:640px){",
      ".qm-set-head{padding:14px 16px 4px;gap:8px}",
      // US-006: 页签改横向滚动（demo v5 形态）—— nowrap 不换行、超宽可滚；
      // 滚动条隐藏口径与 .qm-set-scroll 一致；页签 flex:0 0 auto 防被压缩。
      ".qm-set-tabs{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;",
      "scrollbar-width:none;padding:10px 16px 14px}",
      ".qm-set-tabs::-webkit-scrollbar{width:0;height:0;display:none}",
      ".qm-set-tab{white-space:nowrap;padding:7px 13px;flex:0 0 auto}",
      ".qm-set-wrap .qm-set-row{grid-template-columns:minmax(0,1fr);row-gap:6px;align-items:start}",
      ".qm-set-wrap .qm-set-row .qm-set-rowctl{min-width:0;flex:1 1 auto;justify-content:flex-start;",
      "flex-wrap:wrap;overflow-wrap:anywhere;word-break:break-word}",
      // 清理页操作按钮：窄屏下按钮被 flex 挤压导致「扫描」等两字竖排，
      // 文字不折行 + 按钮组允许换行排列。
      ".qm-set-stalebtns{flex-wrap:wrap}",
      ".qm-set-stalebtns .qm-set-btn{white-space:nowrap}",
      // US-007：时段卡字段网格窄屏单列；名称不再限宽
      ".qm-set-schedgrid{grid-template-columns:1fr}",
      ".qm-set-schedname{max-width:none}",
      ".qm-set-foot{margin:8px 16px 0;padding:14px 0 16px}",
      "}",
      // ── 作用域切换条 ──
      ".qm-set-scopebar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 10px;margin:0 0 12px;border:1px solid var(--app-border-subtle,rgba(127,127,127,.28));border-radius:8px;background:var(--app-bg-secondary,rgba(127,127,127,.05))}",
      ".qm-set-scopebarlabel{font-size:12px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-scopeseg{display:inline-flex;border:1px solid var(--app-border-subtle,rgba(127,127,127,.35));border-radius:6px;overflow:hidden}",
      ".qm-set-scopebtn{appearance:none;border:0;background:transparent;color:inherit;font-size:12px;line-height:1;padding:6px 12px;cursor:pointer}",
      ".qm-set-scopebtn + .qm-set-scopebtn{border-left:1px solid var(--app-border-subtle,rgba(127,127,127,.28))}",
      ".qm-set-scopebtn:hover{background:rgba(127,127,127,.12)}",
      ".qm-set-scopebtnon{background:rgba(64,128,255,.16);font-weight:600}",
      ".qm-set-scopebarhint{font-size:12px;color:var(--app-text-tertiary,#86909c);margin-left:auto}",
      ".qm-set-scopenote{margin:0 0 12px;padding:7px 10px;border-radius:7px;font-size:12px;line-height:1.5;color:#a86400;background:rgba(255,170,40,.12);border:1px solid rgba(255,170,40,.34)}",
      // ── 每项作用域标签 ──
      ".qm-set-rowtitle{display:inline-flex;align-items:center;gap:6px}",
      ".qm-set-scopetag{display:inline-block;font-size:10px;line-height:1;padding:2px 5px;border-radius:3px;letter-spacing:.02em;border:1px solid rgba(127,127,127,.36);background:transparent;color:var(--app-text-tertiary,#86909c);white-space:nowrap}",
      ".qm-set-scopesession{border-color:rgba(28,111,208,.45);background:rgba(28,111,208,.1);color:#1c6fd0;font-weight:600}",
      ".qm-set-scopero{border-color:rgba(138,138,138,.3);background:rgba(138,138,138,.08);color:#8a8a8a}",
      ".qm-set-scopeboth{border-color:rgba(28,111,208,.3);background:rgba(28,111,208,.06);color:#3b7dd8}",
      ".qm-set-static{font-size:12px;color:var(--app-text-secondary,#4e5969)}",
      // ── 模板列表行内操作 ──
      ".qm-set-itemspacer{flex:1 1 auto}",
      ".qm-set-mini{font-size:11px;line-height:1;padding:4px 8px;border-radius:5px;cursor:pointer;",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.32));background:transparent;",
      "color:var(--app-text-secondary,#4e5969);margin-left:6px}",
      ".qm-set-mini:hover{background:rgba(127,127,127,.1)}",
      ".qm-set-minidis{opacity:.4;cursor:not-allowed}",
      ".qm-set-minidis:hover{background:transparent}",
      // ── 模板编辑器 ──
      ".qm-set-editor{margin-top:14px;padding:12px;border-radius:10px;",
      "border:1px solid var(--app-border-subtle,#f1f5f9);",
      "background:var(--app-fill-subtle,rgba(127,127,127,.05))}",
      ".qm-set-editortitle{font-size:13px;font-weight:600;margin-bottom:8px;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-field{margin-bottom:8px}",
      ".qm-set-fieldlabel{font-size:11px;color:var(--app-text-tertiary,#64748b);margin-bottom:3px}",
      ".qm-set-input,.qm-set-textarea{width:100%;box-sizing:border-box;font:inherit;font-size:12px;",
      "padding:7px 10px;border-radius:8px;border:1px solid transparent;",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1e293b);outline:none;resize:vertical}",
      ".qm-set-input:focus,.qm-set-textarea:focus{border-color:#3b82f6}",
      ".qm-set-editorbtns{display:flex;gap:8px;margin-top:4px}",
      // ── 缓存清理 ──
      ".qm-set-cachehint{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin:0 0 8px}",
      ".qm-set-cacherow{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;",
      "column-gap:8px;padding:7px 2px;border-bottom:1px dashed var(--app-border-subtle,rgba(127,127,127,.18))}",
      ".qm-set-cacherow:last-child{border-bottom:0}",
      ".qm-set-check{margin-top:2px;cursor:pointer;flex:0 0 auto}",
      ".qm-set-cachetext{min-width:0}",
      ".qm-set-cachename{display:flex;align-items:center;gap:6px;font-size:12px;",
      "color:var(--app-text-primary,#1f2329);flex-wrap:wrap}",
      ".qm-set-cachesize{font-size:11px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-tagrisky{color:#b5401f;border-color:rgba(181,64,31,.4);background:rgba(181,64,31,.08)}",
      ".qm-set-cachepick{font-size:11px;color:var(--app-text-tertiary,#86909c);margin-left:4px}",
      ".qm-set-cachesafe{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:8px}",
      // ── 置灰：不适用当前作用域的项 ──
      ".qm-set-rowlocked{opacity:.5}",
      ".qm-set-rowlocked .qm-set-rowctl{pointer-events:none}",
      ".qm-set-lockhint{font-size:10px;line-height:1;padding:2px 5px;border-radius:3px;color:#8a8a8a;border:1px dashed rgba(138,138,138,.45)}",
      ".qm-set-scopebtndis{opacity:.45;cursor:not-allowed}",
      ".qm-set-scopebtndis:hover{background:transparent}",
      // ── 会话页签 ──
      ".qm-set-sesshead{display:flex;gap:12px;padding:0 2px 6px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,.28));font-size:12px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-sesscol1{flex:1 1 auto;min-width:0}",
      ".qm-set-sesscol2{flex:0 0 190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-sesslist{margin:2px 0 8px}",
      ".qm-set-sessrow{display:flex;gap:12px;align-items:flex-start;padding:8px 2px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,.16))}",
      ".qm-set-sessid{font-size:13px;color:var(--app-text-primary,#1f2329);word-break:break-all}",
      ".qm-set-sessuuid{font-size:11px;color:var(--app-text-tertiary,#86909c);font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all;margin-top:2px}",
      ".qm-set-sessgone{font-size:11px;color:#a86400;margin-top:2px}",
      ".qm-set-sessempty{padding:22px 2px;text-align:center;font-size:13px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-sessnote{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:6px}",
      // ── 页签内分节小标题（作答 / 分析 / 显示）──
      // （分组小标题样式一并移除，见 settingsTabBody 注释）
      // 全局页签的说明条（与橙色警示区分：这是中性的）
      ".qm-set-scopeglobalnote{margin:0 0 10px;padding:7px 10px;border-radius:7px;font-size:12px;line-height:1.5;color:var(--app-text-secondary,#4e5969);background:var(--app-fill-subtle,rgba(127,127,127,.08));border:1px solid var(--app-border-subtle,rgba(127,127,127,.24))}",
      ".qm-set-sesshint{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:10px}",
      // ── 可交互控件 + 会话覆盖标识 ──
      ".qm-set-ctrldis{opacity:.45;pointer-events:none}",
      ".qm-set-segbtn{display:inline-flex;align-items:center;gap:4px}",
      ".qm-set-selectlive{display:inline-flex;align-items:center;gap:6px;padding:0}",
      // 下拉 = 参考稿 select：灰底、无边框、自绘箭头；悬停/聚焦浮起 + 蓝色光晕
      ".qm-set-native{font:inherit;font-size:13px;line-height:1.4;padding:7px 28px 7px 12px;",
      "border-radius:8px;border:1px solid transparent;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "outline:none;cursor:pointer;transition:all .2s;appearance:none;-webkit-appearance:none;",
      `background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");`,
      "background-repeat:no-repeat;background-position:right 10px center}",
      ".qm-set-native:hover,.qm-set-native:focus{background-color:var(--app-bg-elevated,#fff);",
      "border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}",
      // ── 厂商 + 模型双联动 ──
      // 双联动是「包一层的 div」，不像单 <select> 那样本身就是 rowctl 的直接子项：
      // 宽度由内容决定时它会靠左摆，视觉上就没贴右边界（截图里的错位就是这个）。
      // 这里显式撑满父容器、内部右对齐，并允许两个下拉在窄面板里等比收缩，
      // 保证无论面板多宽，整体右边界都跟其他行一致。
      ".qm-set-modelpick{display:flex !important;align-items:center;justify-content:flex-end;",
      "gap:4px;padding:0;border:0 !important;border-radius:0;background:transparent;",
      "flex:1 1 auto;width:100%;max-width:none;min-width:0;",
      "box-sizing:border-box;overflow:hidden}",
      ".qm-set-nativep{flex:1 1 auto;min-width:0;max-width:150px}",
      ".qm-set-nativem{flex:1 1 auto;min-width:0;max-width:170px}",
      ".qm-set-native{max-width:100%;box-sizing:border-box}",
      ".qm-set-native:disabled{opacity:.55;cursor:not-allowed}",
      ".qm-set-picksep{color:var(--app-text-tertiary,#86909c);font-size:11px;flex:0 0 auto}",
      // ── 未保存提示 ──
      ".qm-set-dirty{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#a86400}",
      ".qm-set-dirtydot{width:6px;height:6px;border-radius:50%;background:#ff9d00}",
      // 底部保存条 = 参考稿 modal-footer：左提示右按钮，上方浅分隔线；固定不滚动
      ".qm-set-foot{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:10px;",
      "margin:8px 28px 0;padding:20px 0;border-top:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-footleft{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 auto}",
      ".qm-set-footbtns{display:flex;align-items:center;gap:12px;flex:0 0 auto}",
      ".qm-set-scopetarget{font-size:12px;color:var(--app-text-tertiary,#64748b)}",
      ".qm-set-saveMsg{margin:4px 28px 10px;padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.5;color:#1a6b3c;background:rgba(52,168,83,.1);border:1px solid rgba(52,168,83,.3)}",
      // 并发覆盖提示（2026-11-13 需求 2）：橙色警示，与绿色「已保存」区分。
      // 不阻断保存、不弹窗 —— 用户裁定只做页面标注。
      ".qm-set-conflict{margin:4px 28px 10px;padding:8px 12px;border-radius:8px;",
      "font-size:12px;line-height:1.5;color:#a86400;background:rgba(255,170,40,.12);",
      "border:1px solid rgba(255,170,40,.34)}",
      ".qm-set-badgeon{background:rgba(59,130,246,.12);color:#3b82f6;font-weight:500}",
      ".qm-set-badgeglobal{background:rgba(127,127,127,.12);color:var(--app-text-tertiary,#6b7280);font-weight:500}",
      ".qm-set-fallbackclose{position:absolute;top:8px;right:10px;width:24px;height:24px;line-height:1;border:0;border-radius:6px;background:transparent;color:inherit;font-size:14px;cursor:pointer;opacity:.6}",
      ".qm-set-fallbackclose:hover{opacity:1;background:rgba(127,127,127,.14)}",
      ".qm-set-fallback{position:fixed}",
      ".qm-set-tabbody{display:flex;flex-direction:column;gap:2px;padding:0 28px}",
      // ── 挂起清理页签（2026-11-15）────────────────────────────────
      // 表格用和 .qm-set-row 同一套「固定网格」思路：列宽固定，行与行才对得齐。
      ".qm-set-stalehead{display:flex;flex-direction:column;gap:10px;padding:4px 0 12px}",
      // 设置行：**必须复用 .qm-set-row 的网格与字号基准**，不能借表格行类。
      // 2026-11-15 用户报「挂起超时自动释放：这个文字与整体文字不一致」——
      // 根因是我最初把这一行写成 `.qm-set-stalerow`（4 列 1fr/190/96/132px
      // 的表格网格），标签被塞进第一列 `minmax(0,1fr)` 的窄格子里被迫换行，
      // 同时没有继承任何字号（浏览器默认 16px），于是又大又折行，与同行
      // 12px 的下拉框、下方 12px 的说明文字都不一致。
      // 修法：改用 `.qm-set-row`（label 弹性列 + 控件右对齐 auto 列，
      // 标签 14px/500、说明 12px），与本页其它设置项完全同构。
      ".qm-set-stalerowset{margin:0}",
      // 下拉宽度收窄：全局配置页的 `.qm-set-input{width:100%}` 是为整行输入框
      // 设计的，放在 auto 列里会把控件列撑到整行，破坏右对齐竖线。
      ".qm-set-stalerowset .qm-set-rowctl select{width:auto;min-width:150px}",
      ".qm-set-stalehint{font-size:12px;line-height:1.6;",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-stalebtns{display:flex;gap:8px;align-items:center}",
      ".qm-set-stalemsg{font-size:12px;line-height:1.5;padding:8px 12px;border-radius:8px;",
      "margin:0 0 10px;word-break:break-all}",
      ".qm-set-stalemsg[data-qm-stale-msg=ok]{background:#ecfdf5;color:#047857}",
      ".qm-set-stalemsg[data-qm-stale-msg=warn]{background:#fffbeb;color:#b45309}",
      ".qm-set-stalemsg[data-qm-stale-msg=error]{background:#fef2f2;color:#b91c1c}",
      ".qm-set-stalemsg[data-qm-stale-msg=info]{background:var(--app-fill-subtle,#f8fafc);",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-staleempty{font-size:12px;padding:24px 0;text-align:center;",
      "color:var(--app-text-tertiary,#94a3b8)}",
      // 分区标题（2026-11-18 性质二分）：阻塞/残留两区各自一条标题行，
      // 标题加重、说明弱化，与表格的 11~12px 字号体系保持一致。
      ".qm-set-stalesect{display:flex;align-items:baseline;gap:8px;padding:14px 0 6px}",
      ".qm-set-stalesecttitle{font-size:12px;font-weight:600;",
      "color:var(--app-text-primary,#1e293b);white-space:nowrap}",
      ".qm-set-stalesecthint{font-size:11px;line-height:1.5;",
      "color:var(--app-text-tertiary,#94a3b8);min-width:0}",
      // ── 扫描结果卡片（2026-11-19 boss 反馈：表格太拥挤、信息展示不全）──
      // 表格 4 列固定宽（190/96/132px）+ nowrap/ellipsis，标题与会话 ID
      // 都被截断。改为卡片：标题完整换行、会话/问卷 ID 完整展示（可复制）、
      // 每条独占一张卡；性质用左侧色条区分（🔴阻塞红 / ⚪残留灰）。
      ".qm-set-stalecards{display:flex;flex-direction:column;gap:8px;padding:6px 0 2px}",
      ".qm-set-stalecard{border:1px solid var(--app-border,#e5e7eb);border-radius:10px;",
      "background:var(--app-bg-secondary,#fff);padding:10px 12px;",
      "display:flex;flex-direction:column;gap:8px}",
      ".qm-set-stalecard[data-qm-stale-nature=blocking]{border-left:3px solid #ef4444}",
      ".qm-set-stalecard[data-qm-stale-nature=residual]{border-left:3px solid #94a3b8}",
      ".qm-set-stalecardhead{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap}",
      ".qm-set-stalecardtitle{font-size:13px;font-weight:600;line-height:1.45;",
      "color:var(--app-text-primary,#1e293b);flex:1 1 auto;min-width:0;",
      "word-break:break-word}",
      ".qm-set-staletag{font-size:10px;line-height:1;padding:3px 6px;border-radius:4px;",
      "background:#fef3c7;color:#b45309;flex:0 0 auto;white-space:nowrap}",
      ".qm-set-stalecardmeta{display:flex;flex-direction:column;gap:3px;",
      "font-size:11px;line-height:1.5;color:var(--app-text-secondary,#64748b)}",
      ".qm-set-stalemetaitem{display:flex;gap:8px;align-items:baseline;min-width:0}",
      ".qm-set-stalemetalabel{flex:0 0 62px;color:var(--app-text-tertiary,#94a3b8)}",
      ".qm-set-stalemetavalue{flex:1 1 auto;min-width:0;word-break:break-all;",
      "color:var(--app-text-primary,#1e293b)}",
      ".qm-set-stalecardfoot{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}",
      // 分页条（2026-11-15）：与表格同宽、右对齐信息文字，
      // 上下留白与 .qm-set-row 的密度口径一致，避免页面突然变松。
      ".qm-set-stalepager{display:flex;align-items:center;justify-content:flex-end;",
      "gap:10px;padding:12px 0 4px;font-size:11px}",
      ".qm-set-stalepageinfo{color:var(--app-text-tertiary,#94a3b8);white-space:nowrap}",
      // ── 行布局：固定网格，彻底消除「控件宽度不同 → 每行错位」──
      // label 列弹性、控件列右对齐；行距与分隔线对齐参考稿（实线浅分隔）。
      ".qm-set-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;",
      // 行密度（2026-11-13 用户反馈「内容不多但界面过于宽松，占据很大空间」）：
      // padding 22px→13px，实测每行 85px→65px，一屏能多看 1~2 行；
      // 标签 14px + 说明 12px 的行内呼吸感未动，观感仍"舒适"不"拥挤"。
      "column-gap:20px;padding:13px 0;",
      "border-bottom:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-row:last-child{border-bottom:0}",
      ".qm-set-rowlabel{display:flex;flex-direction:column;gap:4px;font-size:14px;",
      "font-weight:500;min-width:0;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-rownote{font-size:12px;font-weight:400;color:var(--app-text-tertiary,#64748b);line-height:1.5}",
      // 控件列定宽右对齐：无论里面是开关还是下拉，右边界都落在同一条竖线上。
      ".qm-set-rowctl{display:flex;align-items:center;justify-content:flex-end;",
      "min-width:180px;flex-shrink:0}",
      // setRow 的第 8 个参数 wide=true 时给容器加这个类：内容需要整行宽度
      // 右对齐（双联动下拉），此时不能被 min-width 限制住。
      ".qm-set-rowctlwide{flex:1 1 auto;min-width:0;justify-content:flex-end}",
      // ── 整行块布局（2026-11-14 用户报「UI 怎么变成这样了」）─────────
      // 症状：左侧标签「人工模式提醒频道」被挤成竖排（每字一行），
      // 中间一段失败文案拉成一条长线，面板被撑满还留大片空白。
      // 根因：.qm-set-row 是 grid `minmax(0,1fr) auto`，auto 列按**内容
      // max-content** 定宽。通知频道行右侧那段中文失败原因很长，把 auto 列
      // 撑到极宽，1fr 的标签列被压到只剩几像素 → 每字一行。
      // 修法：长内容行改用单列块布局（标签在上、控件独占下方整行），
      // 从结构上消除「右列撑爆左列」的可能，而不是靠调宽度碰运气。
      ".qm-set-rowblock{grid-template-columns:minmax(0,1fr);row-gap:6px;align-items:start}",
      ".qm-set-rowblock .qm-set-rowctl{min-width:0;flex:1 1 auto;justify-content:flex-start;",
      "flex-wrap:wrap;overflow-wrap:anywhere;word-break:break-word}",
      // 分段选择 = 参考稿 radio-group：灰底圆角容器 + 白色激活块（蓝字）
      ".qm-set-seg{display:inline-flex;border:0;border-radius:10px;overflow:hidden;",
      "background:var(--app-fill-subtle,#f8fafc);padding:4px;gap:2px}",
      ".qm-set-segbtn{background:transparent;border:0;cursor:pointer;font-size:13px;padding:6px 14px;",
      "border-radius:8px;color:var(--app-text-secondary,#64748b);",
      "border-right:0;transition:all .2s}",
      ".qm-set-segbtn:last-child{border-right:0}",
      ".qm-set-segon{background:var(--app-bg-elevated,#fff);",
      "color:#3b82f6;font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,.04)}",
      // 开关 = 参考稿 iOS 风格（放大到 42x24，激活蓝）
      ".qm-set-switch{width:44px;height:24px;border-radius:24px;cursor:pointer;position:relative;",
      "background:var(--app-fill-strong,#cbd5e1);transition:background .2s;flex-shrink:0}",
      ".qm-set-switch-on{background:#3b82f6}",
      ".qm-set-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;",
      "background:#fff;transition:left .2s;box-shadow:0 2px 4px rgba(0,0,0,.12)}",
      ".qm-set-switch-on .qm-set-knob{left:22px}",
      // 容器本身不画边框：真正的控件（<select> / 胶囊）自己带底色。
      // justify-content:flex-end 必须有：容器有 min-width:150px，而内部的
      // <select> 通常只有 ~120px，inline-flex 默认从左侧排布 → 选择框停在容器
      // 左边、右侧留出一段空白，视觉上就是「这一行没贴右」。
      ".qm-set-select{display:inline-flex;align-items:center;justify-content:flex-end;",
      "gap:6px;cursor:pointer;font-size:12px;",
      "border:0;background:transparent;padding:0;color:var(--app-text-primary,#1e293b);",
      "max-width:100%;min-width:150px;box-sizing:border-box}",
      // 只读展示态（无 <select>）由容器承担灰底，且文本左对齐更自然。
      ".qm-set-select:not(.qm-set-selectlive){border:1px solid transparent;",
      "border-radius:8px;padding:7px 12px;justify-content:flex-start;",
      "background:var(--app-fill-subtle,#f8fafc)}",
      ".qm-set-selecttext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-selectarrow{color:var(--app-text-tertiary,#64748b);font-size:10px}",
      ".qm-set-list{display:flex;flex-direction:column;gap:10px}",
      // 模板卡 = 参考稿 prompt-card：浅边框圆角卡，悬停轻微浮起
      ".qm-set-item{border:1px solid var(--app-border-subtle,#f1f5f9);",
      "border-radius:10px;padding:14px 16px;transition:all .2s;background:var(--app-bg-elevated,#fff)}",
      ".qm-set-item:hover{border-color:var(--app-border-strong,#cbd5e1);",
      "box-shadow:0 4px 12px rgba(0,0,0,.03)}",
      ".qm-set-itemhead{display:flex;align-items:center;gap:8px;margin-bottom:6px}",
      ".qm-set-itemname{font-size:14px;font-weight:600;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-tag{font-size:11px;padding:2px 8px;border-radius:6px;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-secondary,#64748b)}",
      ".qm-set-tagbuiltin{background:var(--app-fill-subtle,rgba(127,127,127,0.24))}",
      // 模板卡预览 = 参考稿 prompt-preview：最多两行，超出省略
      ".qm-set-itemdesc{font-size:13px;line-height:1.6;color:var(--app-text-tertiary,#64748b);",
      "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".qm-set-toolbar{display:flex;gap:8px;margin-top:14px}",
      // 通用按钮 = 参考稿 .btn：灰底无边框圆角 8；主按钮见下方复合选择器
      ".qm-set-btn{font-size:14px;padding:9px 22px;height:auto;cursor:pointer;border-radius:8px;",
      "border:0;background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "transition:all .2s}",
      ".qm-set-btn:hover{background:var(--app-fill-strong,#e2e8f0)}",
      // 保存按钮 = 参考稿 .btn-save：蓝底白字 + 蓝色柔光，hover 加深。
      // 必须用复合选择器且声明在 .qm-set-btn 之后：两条同特异性规则按顺序
      // 覆盖，否则通用按钮的灰底会压过这里的蓝底（用户报「保存按钮不高亮」的根因）。
      ".qm-set-btn.qm-set-btnprimary{background:#3b82f6;color:#fff;",
      "box-shadow:0 4px 12px rgba(59,130,246,.2)}",
      ".qm-set-btn.qm-set-btnprimary:hover{background:#2563eb}",
      ".qm-set-btn.qm-set-btnprimary:disabled{opacity:.45}",
      // 新建模板按钮 = 参考稿 btn-new-template：虚线边框，悬停转蓝
      ".qm-set-btnnew{border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:var(--app-bg-elevated,#fff)}",
      ".qm-set-btnnew:hover{border-color:#3b82f6;color:#3b82f6;",
      "background:rgba(59,130,246,.06)}",
      ".qm-set-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;",
      "color:var(--app-text-secondary,#4e5969)}",
      // ── 时段调度页签（US-007，纯 UI 占位）──
      // 说明块：浅底圆角，与 .qm-set-scopeglobalnote 同族但更完整
      ".qm-set-schednote{font-size:12px;line-height:1.7;color:var(--app-text-secondary,#64748b);",
      "background:var(--app-fill-subtle,#f8fafc);border:1px solid var(--app-border-subtle,#f1f5f9);",
      "border-radius:10px;padding:10px 14px;margin:4px 0 12px}",
      ".qm-set-schednotetitle{font-weight:600;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-schednotedemo{margin-top:4px;font-size:11px;color:var(--app-text-tertiary,#94a3b8)}",
      // 时段卡列表：纵向排列（与 .qm-set-stalecards 同构）
      ".qm-set-schedlist{display:flex;flex-direction:column;gap:10px}",
      // 时段卡 = demo v5 形态：白底、圆角 10、--app-border 边框
      ".qm-set-schedcard{border:1px solid var(--app-border,#e5e7eb);border-radius:10px;",
      "background:var(--app-bg-elevated,#fff);padding:12px 14px;",
      "display:flex;flex-direction:column;gap:10px}",
      ".qm-set-schedhead{display:flex;align-items:center;gap:8px}",
      ".qm-set-schedname{flex:1 1 auto;min-width:0;max-width:260px}",
      ".qm-set-scheddel{flex:0 0 auto;font-size:12px;line-height:1;padding:5px 10px;",
      "border-radius:6px;border:1px solid var(--app-border-subtle,#f1f5f9);",
      "background:transparent;cursor:pointer;color:var(--app-text-secondary,#64748b);",
      "transition:all .15s}",
      ".qm-set-scheddel:hover{color:#d93025;border-color:#f3c2bd;",
      "background:rgba(217,48,37,.06)}",
      // 卡内字段网格：两列；窄屏（640px media 块）改单列
      ".qm-set-schedgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}",
      ".qm-set-schedfield{display:flex;flex-direction:column;gap:4px;min-width:0}",
      ".qm-set-schedfieldlabel{font-size:11px;color:var(--app-text-tertiary,#94a3b8)}",
      ".qm-set-schedfield .qm-set-native,.qm-set-schedfield .qm-set-input{",
      "width:100%;max-width:none;box-sizing:border-box}",
      // 起止时间行：原生 time 输入，样式对齐 .qm-set-native 口径
      ".qm-set-schedtime{display:flex;align-items:center;gap:6px}",
      ".qm-set-schedtimesep{color:var(--app-text-tertiary,#94a3b8);font-size:12px;flex:0 0 auto}",
      ".qm-set-schedtime input[type=time]{font:inherit;font-size:13px;line-height:1.4;",
      "padding:7px 10px;border-radius:8px;border:1px solid transparent;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "outline:none;min-width:0;box-sizing:border-box;transition:all .2s}",
      ".qm-set-schedtime input[type=time]:focus{background:var(--app-bg-elevated,#fff);",
      "border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}",
      ".qm-set-schedadd{align-self:flex-start;margin-top:2px}",
      // ── 自定义 API 通知卡（US-008，纯 UI 占位）──
      // 卡容器/网格/字段复用 .qm-set-sched*（demo v5 同一卡形态），
      // 这里只补 API 卡特有元素：标题徽标 / 启用开关 / 测试按钮。
      ".qm-set-apicard{margin-top:14px}",
      ".qm-set-apititle{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b);",
      "display:inline-flex;align-items:center}",
      // 「新增渠道」徽标 = demo v5 内联样式（accent 底白字小圆角）
      ".qm-set-apibadge{display:inline-block;font-size:10px;font-weight:700;color:#fff;",
      "background:var(--app-accent,#3b82f6);border-radius:4px;padding:1px 6px;",
      "margin-left:8px;vertical-align:2px}",
      // 启用开关 = demo .switch 形态（34×19 胶囊 + 滑动白点），纯演示可点击
      ".qm-set-apiswitch{flex:0 0 auto;margin-left:auto;position:relative;width:34px;",
      "height:19px;border-radius:10px;border:none;padding:0;cursor:pointer;",
      "background:#d9d9d9;transition:background .2s}",
      ".qm-set-apiswitch.on{background:var(--app-accent,#3b82f6)}",
      ".qm-set-apiswitchdot{position:absolute;top:2px;left:2px;width:15px;height:15px;",
      "border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);",
      "transition:left .2s}",
      ".qm-set-apiswitch.on .qm-set-apiswitchdot{left:17px}",
      ".qm-set-apinote{font-size:11px;color:var(--app-text-tertiary,#94a3b8)}",
      // 发送测试 = demo .btn-test 形态（透明底 + border-strong 边框小按钮）
      ".qm-set-apifoot{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}",
      ".qm-set-apitest{min-width:0;height:28px;padding:0 12px;font-size:12px;",
      "border-radius:6px;background:transparent;cursor:pointer;",
      "border:1.5px solid var(--app-border-strong,#cbd5e1);",
      "color:var(--app-text-secondary,#4e5969);transition:all .15s}",
      ".qm-set-apitest:hover{border-color:var(--app-accent,#3b82f6);",
      "color:var(--app-accent,#3b82f6)}",
      // ── 自定义 API · 必传可见性与参数行（US-020，2026-11-23）──
      // boss 核心诉求原文：「用户不知道哪些是属于必传项，是否符合大部分的
      // API 请求以及参数要求」。以下样式全部服务于「必传一眼可见」。
      //
      // 必传星号：红色，与正文有足够对比度（不用 accent 色，避免和「新增」
      // 这类主动作混淆——**危险/必填用红、可选用灰**是本项目的既有口径）。
      ".qm-apireq{color:#d92d20;font-weight:700;margin-left:2px}",
      // 区块图例：一行小字说明「标 * 为必传项」，放在表单顶部
      ".qm-apilegend{font-size:11px;color:var(--app-text-tertiary,#94a3b8);",
      "margin:2px 0 6px}",
      // 顶部汇总条：缺项时橙色告警，齐备时绿色确认。
      // 两种态用同一元素切换 class，避免布局跳动。
      ".qm-apistatus{display:flex;align-items:center;gap:6px;font-size:12px;",
      "padding:6px 10px;border-radius:6px;margin:8px 0}",
      ".qm-apistatus.miss{background:rgba(212,107,8,.08);color:#d46b08;",
      "border:1px solid rgba(212,107,8,.35)}",
      ".qm-apistatus.ok{background:rgba(56,158,13,.08);color:#389e0d;",
      "border:1px solid rgba(56,158,13,.35)}",
      // 系统字段区：锁定不可删，用浅底区分于用户自定义区
      ".qm-apisysblock{background:var(--app-surface-subtle,rgba(127,127,127,.06));",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.18));",
      "border-radius:6px;padding:8px 10px;margin:6px 0}",
      ".qm-apisysrow{display:flex;align-items:center;gap:8px;font-size:12px;",
      "padding:3px 0}",
      ".qm-apisysname{flex:0 0 78px;font-weight:600;",
      "color:var(--app-text-primary,#1e293b)}",
      ".qm-apisysval{flex:1 1 auto;color:var(--app-text-secondary,#4e5969);",
      "font-family:SF Mono,Monaco,Consolas,monospace;font-size:11px}",
      ".qm-apisystag{flex:0 0 auto;font-size:10px;padding:1px 5px;border-radius:3px;",
      "background:rgba(217,45,32,.1);color:#d92d20}",
      // 参数行表格：参数名 / 参数值 / 必填 / 操作 四列
      ".qm-apiparamhead,.qm-apiparamrow{display:flex;align-items:center;gap:6px;",
      "font-size:12px}",
      ".qm-apiparamhead{padding:0 0 4px;color:var(--app-text-tertiary,#94a3b8);",
      "font-size:11px}",
      ".qm-apiparamrow{padding:3px 0;position:relative}",
      ".qm-apiparamrow.miss{padding-left:7px}",
      // 必传未填的整行标红竖条：比只标红色文字更醒目
      ".qm-apiparamrow.miss::before{content:'';position:absolute;left:0;top:2px;",
      "bottom:2px;width:3px;border-radius:2px;background:#d92d20}",
      ".qm-apipk,.qm-apipv{min-width:0;height:26px;padding:0 7px;font-size:12px;",
      "border-radius:5px;border:1px solid var(--app-border-strong,#cbd5e1);",
      "background:var(--app-surface-raised,#fff);color:inherit;font-family:inherit}",
      ".qm-apipk{flex:0 0 34%}",
      ".qm-apipv{flex:1 1 auto}",
      ".qm-apipk.bad,.qm-apipv.bad{border-color:#d92d20}",
      ".qm-apireqbox{flex:0 0 auto;display:inline-flex;align-items:center;gap:3px;",
      "font-size:11px;color:var(--app-text-secondary,#4e5969);cursor:pointer}",
      ".qm-apidel{flex:0 0 auto;width:24px;height:24px;border:none;background:none;",
      "color:var(--app-text-tertiary,#94a3b8);cursor:pointer;font-size:14px;",
      "border-radius:4px}",
      ".qm-apidel:hover{color:#d92d20;background:rgba(217,45,32,.08)}",
      ".qm-apiadd{align-self:flex-start;height:26px;padding:0 10px;font-size:12px;",
      "border-radius:5px;border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:transparent;color:var(--app-accent,#3b82f6);cursor:pointer}",
      ".qm-apiadd:hover{border-color:var(--app-accent,#3b82f6);",
      "background:rgba(59,130,246,.06)}",
      // 请求预览：等宽字体、浅底、可滚动，让用户直接对照对方 API 文档
      ".qm-apipreview{margin:6px 0 0;padding:8px 10px;border-radius:6px;",
      "background:var(--app-surface-subtle,rgba(127,127,127,.06));",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.18));",
      "font-family:SF Mono,Monaco,Consolas,monospace;font-size:11px;",
      "line-height:1.55;white-space:pre-wrap;word-break:break-all;",
      "max-height:180px;overflow:auto;color:var(--app-text-secondary,#4e5969)}",
      ".qm-apipreviewlabel{font-size:11px;color:var(--app-text-tertiary,#94a3b8);",
      "margin-top:8px}",
      // 高级模式开关行
      ".qm-apiadvrow{display:flex;align-items:center;gap:8px;margin:8px 0 4px;",
      "font-size:12px}",
      ".qm-apibody{width:100%;min-height:96px;padding:8px 10px;font-size:12px;",
      "border-radius:6px;border:1px solid var(--app-border-strong,#cbd5e1);",
      "background:var(--app-surface-raised,#fff);color:inherit;",
      "font-family:SF Mono,Monaco,Consolas,monospace;resize:vertical}",
      ".qm-apibody.bad{border-color:#d92d20}",
      // 测试结果行
      ".qm-apitestres{font-size:11px;line-height:1.6;word-break:break-all}",
      ".qm-apitestres.ok{color:#389e0d}",
      ".qm-apitestres.err{color:#d92d20}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function D(t) {
  try {
    const e = ze();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Jn = "", Os = "";
function da(t, e) {
  t && (Os = t), e && (Jn = e);
}
function F() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = ze(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Jn), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function en() {
  try {
    const e = ze();
    if (typeof e.getCurrentSessionId == "function") {
      const n = e.getCurrentSessionId() || "";
      if (n) return n;
    }
  } catch {
  }
  const t = window.currentSessionId;
  if (typeof t == "string" && t) return t;
  try {
    const e = /\/chat\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:[/?#]|$)/.exec(typeof window < "u" && window.location && window.location.pathname || "");
    if (e && e[1]) return e[1].toLowerCase();
  } catch {
  }
  return Os;
}
globalThis.__qmSessionProbe = en;
let rs = null;
function Ui() {
  if (rs) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (rs = t.setInterval(() => {
    try {
      fetch(D("/heartbeat"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({ session_id: en() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
Ui();
function Dt() {
  try {
    const t = ze(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Jn;
}
const Fr = {};
async function Gi(t, e, n) {
  if (typeof window > "u" || Fr[t]) return "skipped";
  try {
    const s = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return Fr[t] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  Fr[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", a = window.Notification;
  if (!a) return "inpage";
  try {
    if (a.permission === "default" && await new Promise((p) => {
      let i = !1;
      const h = (b) => {
        i || (i = !0, p(b));
      };
      try {
        const b = a.requestPermission((q) => h(q));
        b && typeof b.then == "function" && b.then(h).catch(() => h("denied"));
      } catch {
        h("denied");
      }
      setTimeout(() => h(a.permission || "denied"), 8e3);
    }) !== "granted" || a.permission !== "granted") return "inpage";
    const s = new a("问卷等待作答", { body: r, tag: "qm-" + t, renotify: !1 });
    return s.onclick = () => {
      try {
        window.focus();
      } catch {
      }
      try {
        s.close();
      } catch {
      }
    }, "system";
  } catch {
    return "inpage";
  }
}
function ce(t) {
  const e = Qt(t);
  return e && e.session_id ? e.session_id : en();
}
const Wr = 180, Ji = 20, $s = 6e3, Zi = 60, Ki = 8;
function Qi() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Vi = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function as(t) {
  try {
    return String(t || "").replace(Vi, "").length;
  } catch {
    return 0;
  }
}
function ss(t) {
  const e = Qi();
  if (!e) return -1;
  let n = null;
  try {
    n = e.querySelector('[data-qm-card-id="' + t + '"]');
  } catch {
    return -1;
  }
  if (!n) return -1;
  let r = -1;
  try {
    r = as((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - as(n.textContent);
}
function Xi(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右上角 🔒 释放阻塞" : "⏳ 已提交，模型处理中";
}
function Yi(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function os(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: $s });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const el = "qm:v1:analysis:global", tl = "qm:v1:analysis:", nl = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Ft(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function rl(t) {
  if (!t || typeof t != "object") return { ...nl };
  const e = t.modelId !== void 0 ? t.modelId : t.model_id, n = t.withContext !== void 0 ? t.withContext : t.with_context;
  return {
    // Three-way mode.  Anything unrecognised (including legacy payloads that
    // only ever wrote "ai"/"manual") degrades to "manual" — the safe default
    // that never drives the form on its own.
    mode: t.mode === "ai" || t.mode === "recommend" ? t.mode : "manual",
    modelId: typeof e == "string" ? e : "",
    withContext: !!n,
    parallel: !!t.parallel
  };
}
function al() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(tl) === 0 && n !== el && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function sl() {
  try {
    const t = await fetch(D("/question-modal/prefs"), { headers: F() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : rl(e.prefs);
  } catch {
    return null;
  }
}
async function pa() {
  try {
    const t = await fetch(D("/question-modal/templates"), { headers: F() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function Nn(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(D("/question-modal/survey-action"), {
      method: "POST",
      headers: F(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Un()
      })
    }), a = await r.json().catch(() => ({}));
    return r.ok ? {
      accepted: a.accepted !== !1,
      reason: String(a.reason || ""),
      state: a.state || null
    } : null;
  } catch {
    return null;
  }
}
async function ol(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      D("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: F() }
    );
    if (!e.ok) return null;
    const n = await e.json().catch(() => ({}));
    return !n || n.ok === !1 ? null : {
      found: !!n.found,
      rev: parseInt(n.rev || 0, 10) || 0,
      state: n.state || null
    };
  } catch {
    return null;
  }
}
function il(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, a = 0, s = null, o = 0, p = !1, i = 0, h = 0, b = null;
  const q = (g) => {
    n || b === g || (b = g, e.onStatus(g));
  }, m = () => {
    if (!n)
      try {
        const g = typeof AbortController < "u" ? new AbortController() : null, x = D("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, y = { headers: F() };
        g && (y.signal = g.signal), r = () => {
          try {
            g && g.abort();
          } catch {
          }
        }, fetch(x, y).then(async (T) => {
          const E = Ml(T);
          if (!T.ok || !T.body || E) {
            if (T.status === 404 || T.status === 501 || T.status === 405) {
              p = !0, q(!1);
              return;
            }
            throw E && (i += 1), new Error(E ? "blocked" : "HTTP " + T.status);
          }
          a = 0, i = 0, q(!0);
          const C = T.body.getReader(), w = new TextDecoder();
          let P = "";
          const S = () => {
            C.read().then(({ done: L, value: N }) => {
              if (L) {
                k();
                return;
              }
              P += w.decode(N, { stream: !0 });
              let J;
              for (; (J = P.indexOf(`

`)) >= 0; ) {
                const re = P.slice(0, J);
                P = P.slice(J + 2), re.split(`
`).forEach((W) => {
                  if (!W.startsWith("data: ")) return;
                  let B = null;
                  try {
                    B = JSON.parse(W.slice(6));
                  } catch {
                    return;
                  }
                  B && (B.kind === "snapshot" ? (o = Math.max(o, parseInt(B.rev || 0, 10) || 0), e.onSnapshot(o, B.state || null)) : B.kind === "change" && (o = Math.max(o, parseInt(B.rev || 0, 10) || 0), e.onChange(B)));
                });
              }
              n || S();
            }).catch(() => {
              k();
            });
          };
          S();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (n || p)
      return;
    if (q(!1), i += 1, h || (h = Date.now()), i >= Hs) {
      if (Date.now() - (h || Date.now()) >= Gs) {
        p = !0, q(!1);
        return;
      }
      s = setTimeout(m, Us);
      return;
    }
    a = Math.min(a + 1, 6);
    const g = Math.min(1e4, 500 * Math.pow(2, a));
    s = setTimeout(m, g);
  };
  return m(), () => {
    if (n = !0, s)
      try {
        clearTimeout(s);
      } catch {
      }
    if (r)
      try {
        r();
      } catch {
      }
    b = null, e.onStatus(!1);
  };
}
async function Hr(t, e, n) {
  try {
    return (await fetch(D("/question-modal/session-prefs"), {
      method: "POST",
      headers: F(),
      body: JSON.stringify({
        chat_id: "",
        // server resolves session_id → chat UUID
        session_id: e,
        agent_id: n,
        settings: t,
        // 2026-11-13 方案 D1：卡片上的即时操作（切模型/上下文/并行/模式）
        // 语义就是"在本会话里应用这项设置"，必须显式声明会话模式。
        //
        // 不声明会踩坑：本会话若处于 default，写进去的值不会生效；
        // 旧代码只是"碰巧对"（靠后端「有记录无标记→视为 session」的兼容
        // 分支），一旦那条分支按严格判定收敛，这里就会变成"改了没反应"。
        set_scope: "session"
      })
    })).ok;
  } catch {
    return !1;
  }
}
let Ms = null;
async function Vt(t, e, n, r) {
  const a = t || "", s = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  try {
    const o = D(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(a) + s
    ), p = await fetch(o, { headers: F() });
    if (!p.ok) return null;
    const i = await p.json();
    if (!i || i.ok !== !0) return null;
    const h = {
      config: i.config || {},
      globalKeys: Array.isArray(i.global_keys) ? i.global_keys : [],
      version: typeof i.version == "number" ? i.version : 0,
      schema: Array.isArray(i.schema) ? i.schema : [],
      has_session: i.has_session === !0,
      keyTs: i.key_ts && typeof i.key_ts == "object" ? i.key_ts : {},
      // 分层原始数据（2026-11-13）：缺失时回落 {}，cfgValue 再用老路径兜底，
      // 保证旧后端（不返回这两字段）也不会白屏。
      sessionConfig: i.session_config && typeof i.session_config == "object" ? i.session_config : void 0,
      globalConfig: i.global_config && typeof i.global_config == "object" ? i.global_config : void 0
    };
    return Ms = { chatId: a, at: Date.now(), data: h }, h;
  } catch {
    return null;
  }
}
function Ps() {
  Ms = null;
}
async function Zn() {
  const t = await fetch(
    D("/question-modal/stale-surveys"),
    { headers: F() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Kn(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function na(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function ua(t) {
  const e = await fetch(D("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: F(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function ll(t) {
  const e = await fetch(D("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: F(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function cl() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", O();
  const t = Date.now();
  try {
    const e = await Zn();
    Kn(e), c.stale.page = 0, c.stale.resPage = 0;
    const n = c.stale.rows.length, r = c.stale.blocking.length, a = c.stale.residual.length, s = c.stale.exceeded.length, o = c.stale.within.length, p = Date.now() - t;
    c.stale.msgKind = "ok";
    const i = na(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${a} 条；已超阈值 ${s} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${p}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${p}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.blocking = [], c.stale.residual = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, O();
  }
}
async function Ur(t, e = "释放") {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const n = await ua({ tool_call_ids: t }), r = Number(n && n.released) || 0, a = Number(n && n.already) || 0, s = Number(n && n.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `${e} ${r} 条，${s} 条未成功（见日志）` + (a ? `；${a} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (a ? `；${a} 条此前已处理` : "") : `无需${e}：${a || t.length} 条此前已处理`;
    const o = await Zn();
    Kn(o);
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function dl() {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const t = await ua({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, a = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = a === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${a} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const s = await Zn();
    Kn(s);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function pl() {
  const t = (c.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    c.stale.msgKind = "info", c.stale.msg = "当前没有可清理的残留问卷", O();
    return;
  }
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const e = await ua({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, a = Number(e && e.failed) || 0;
    c.stale.msgKind = a > 0 ? "warn" : "ok", c.stale.msg = a > 0 ? `清理 ${n} 条，${a} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const s = await Zn();
    Kn(s), c.stale.resPage = 0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function ul(t) {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const e = await ll(t), n = e && e.results || [], r = n.filter((s) => s && s.stopped).length, a = n.filter((s) => s && !s.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (a ? `；${a} 个会话已不存在` : "") : `${a} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function Ls(t) {
  try {
    const e = await fetch(D("/question-modal/templates"), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Bs(t) {
  try {
    const e = await fetch(D("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: F()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Rs() {
  try {
    const t = await fetch(D("/models"), { headers: F() });
    if (!t.ok) return [];
    const e = await t.json();
    return (Array.isArray(e) ? e : []).filter((r) => {
      const s = [...r.models || [], ...r.extra_models || []].length > 0, o = !!r.api_key || r.require_api_key === !1 || r.is_local || r.is_custom;
      return s && o;
    });
  } catch {
    return [];
  }
}
function fl(t) {
  if (!t) return "";
  try {
    return String(G.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function U(t, e) {
  try {
    const n = Ve().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const ke = "__other__";
function Te(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function St(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Gr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((a) => {
    if (n && n.has(a) || !Object.prototype.hasOwnProperty.call(r, a)) return;
    const s = e[a];
    !s || typeof s != "object" || !St(r[a]) && St(s) && (r[a] = { ...s });
  }), r;
}
function is(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function ls(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((a) => Number(a && a.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function ml(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), a = Te(e), s = Re(e), o = r(a), p = r(s);
  return n.some((i) => {
    const h = r(i);
    return h ? !!(i === a || i === s || h === o || h === p || Math.min(h.length, o.length, p.length) >= 4 && (h.length >= 4 && (o.includes(h) || h.includes(o)) || h.length >= 4 && (p.includes(h) || h.includes(p)))) : !1;
  });
}
function pe(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let js = !0;
function Dn(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (js ? "第 " + (e + 1) + " 题" : "");
}
function Re(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function gl(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (s) => {
    s != null && s !== "" && n.add(String(s));
  }, a = t.options || [];
  if (pe(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const p = a.find((i) => Te(i) === String(o));
      p && r(Re(p)), String(o) === ke && e.other && r(e.other);
    });
  else {
    r(e.value);
    const s = a.find((o) => Te(o) === String(e.value));
    s && r(Re(s)), String(e.value) === ke && e.other && r(e.other);
  }
  return n;
}
function hl(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const a = String(r);
    if (a.startsWith("=")) return e.has(a.slice(1));
    if (e.has(a)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(a) !== -1 || a.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Ds(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const a = parseInt(n[1], 10);
    if (a >= 0 && a < e.length) return a;
  }
  return e.findIndex((a) => (a.title || "").trim() === t.trim());
}
function Fs(t, e, n) {
  const r = e[t], a = r && r.showIf;
  if (!a || typeof a != "object" || !Object.keys(a).length) return !0;
  for (const s of Object.keys(a)) {
    const o = Ds(s, e);
    if (o < 0) continue;
    const p = e[o];
    if (!p) continue;
    if (p.showIf && !Fs(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !hl(a[s], gl(p, i))) return !1;
  }
  return !0;
}
function Ge(t, e) {
  const n = [];
  return t.forEach((r, a) => {
    Fs(a, t, e) && n.push(a);
  }), n;
}
function bl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function Tn(t) {
  return Array.isArray(t.questions);
}
function yl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function xl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((a) => a && (a.text || a.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function kl(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function vl(t) {
  if (!t) return "";
  const e = String(t).split(`
`).map((r) => r.trim()).filter(Boolean);
  for (let r = e.length - 1; r >= 0; r--) {
    const a = e[r];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(a) && !/^\{/.test(a) && !/^\s*"skipped"/.test(a) && a.length < 400)
      return a.replace(/^【|】$/g, "").trim();
  }
  const n = String(t).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return n && n[1] && n[1] !== "timeout" ? n[1] : "";
}
function Wt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const a = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${a === "watchdog" ? "系统自动释放" : a === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + Ln(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((a) => {
    const s = n[a];
    if (!s || typeof s != "object") return;
    const o = Ds(a, t), p = o >= 0 ? t[o] : null, i = p ? pe(p) === "single" ? "单选" : pe(p) === "multi" ? "多选" : "问答" : "问答", h = p ? Dn(p, o) : a;
    let b = s.value;
    if (Array.isArray(b) && (b = b.join("、")), s.other && (b = (b ? b + "、" : "") + s.other), s.skipped) {
      const q = String(s.skipped_by || ""), m = q === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : q === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${a} [${i}] ${h}${m}`);
    } else
      r.push(`- ${a} [${i}] ${h}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function wl(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      D("/question-modal/resolve") + "?" + n.toString(),
      { headers: F() }
    );
    if (!r.ok) return { kind: "error" };
    const a = await r.json();
    return a && da(a.session_id, a.agent_id), a && a.found ? { kind: "found", data: a } : a && a.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Ht(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      D("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: F() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function ql(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = F();
    delete n["Content-Type"];
    const r = await fetch(
      D("/console/upload"),
      { method: "POST", headers: n, body: e }
    );
    if (!r.ok) {
      const s = await r.text().catch(() => "");
      let o = "HTTP " + r.status;
      try {
        const p = JSON.parse(s);
        p && p.detail && (o = p.detail);
      } catch {
      }
      return { ok: !1, error: `${t.name}: ${o}` };
    }
    const a = await r.json();
    return !a || !a.url ? { ok: !1, error: `${t.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(a.url), file_name: String(a.file_name || t.name), size: a.size }
    };
  } catch (e) {
    return { ok: !1, error: `${t.name}: ${e && e.message || e}` };
  }
}
const Fn = "qm:v1:stash_att:", cs = 25 * 1024 * 1024, Mn = /* @__PURE__ */ new Map(), Pn = /* @__PURE__ */ new Map();
let Wn = null, Hn = 0, Jr = null;
function ds() {
  const t = Hn > 0;
  Pn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function _l() {
  if (Jr) return Jr;
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
    const r = Wn;
    Wn = null, !(!r || !n.length) && await Ws(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Jr = t, t;
}
function Sl(t, e, n) {
  if (!t) {
    U("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Wn = { callId: t, target: e, key: n };
  const r = _l();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (Wn = null);
}
async function Ws(t, e, n, r) {
  Hn += 1, ds();
  const a = [], s = [];
  try {
    for (const p of t) {
      if (p.size && p.size > cs) {
        s.push(`${p.name}: 文件过大（上限 ${Math.round(cs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await ql(p);
      i.ok ? a.push(i.att) : s.push(i.error);
    }
  } finally {
    Hn -= 1, ds();
  }
  const o = Mn.get(e);
  if (a.length || s.length) {
    const p = n === "final" ? "final" : "q";
    if (!e) {
      U(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (o)
      try {
        o(a, p, r, s);
      } catch {
      }
    else a.length && El(e, a, p, r);
  }
}
function El(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const a = localStorage.getItem(Fn + t), s = a ? JSON.parse(a) : [], o = (Array.isArray(s) ? s : []).concat(
        e.map((p) => ({ att: p, target: n, key: r }))
      );
      localStorage.setItem(Fn + t, JSON.stringify(o));
    } catch {
    }
}
function Cl(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(Fn + t);
    if (!e) return [];
    localStorage.removeItem(Fn + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function Nl(t) {
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
      n = Array.from(e.items || []).filter((r) => r && r.kind === "file").map((r) => r.getAsFile ? r.getAsFile() : null).filter((r) => !!r);
    } catch {
      n = [];
    }
  return n;
}
function Tl(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Zr(t, e) {
  const n = e || ce(t), r = Qt(t), a = r && r.request_id ? r.request_id : "";
  if (a)
    try {
      const s = await fetch(D("/question-modal/skip"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({ request_id: a, session_id: n || "" })
      });
      if (s.ok) {
        const o = await s.json().catch(() => ({}));
        return xe(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return xe(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const s = await fetch(
        D("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: F() }
      );
      if (s.ok) {
        const o = await s.json().catch(() => ({})), p = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return xe(t), { ok: !0, released: p > 0, reason: p > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function ps(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      D("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: F() }
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
async function zl(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      D("/question-modal/pending") + e,
      { headers: F() }
    );
    if (!n.ok) return null;
    const r = await n.json(), a = r && r.items || [];
    if (!Array.isArray(a) || a.length !== 1) return null;
    const s = a[0];
    if (!s || !s.request_id) return null;
    const o = await fetch(
      D("/question-modal/resolve") + "?request_id=" + encodeURIComponent(s.request_id),
      { headers: F() }
    );
    if (!o.ok) return null;
    const p = await o.json();
    return p && da(p.session_id, p.agent_id), p && p.found ? p : null;
  } catch {
    return null;
  }
}
const Qn = "qm:v1:reqid:", Al = 3e4, Il = 45e3, Hs = 6, Us = 6e4, Gs = 15 * 6e4, Ol = 700, $l = 8;
function Ml(t) {
  try {
    if (String((t.headers && t.headers.get ? t.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const n = Number(t.status || 0);
    return n === 429 || n === 403 || n === 407 || n === 451;
  } catch {
    return !1;
  }
}
function xe(t) {
  if (t)
    try {
      localStorage.removeItem(Qn + t);
    } catch {
    }
}
function Pl() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(Qn) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((a) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(a) || "null");
      } catch {
        s = null;
      }
      !s || !s.request_id || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(a) : n.push(a);
    });
    const r = 50;
    if (n.length <= r) return;
    n.map((a) => ({ k: a, ts: (JSON.parse(localStorage.getItem(a) || "{}") || {}).ts || 0 })).sort((a, s) => a.ts - s.ts).slice(0, n.length - r).forEach((a) => localStorage.removeItem(a.k));
  } catch {
  }
}
function Ll(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Qn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), Pl();
    } catch {
    }
}
function Qt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Qn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (xe(t), null) : n;
  } catch {
    return null;
  }
}
const fa = "qm:v1:state:";
function Jt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(fa + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Un() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const Js = Un(), us = "qm:v1:sessionprefs-ping";
function ot(t, e) {
  if (t)
    try {
      const r = { ...Jt(t) || {}, ...e, ts: Date.now(), origin: Js };
      localStorage.setItem(fa + t, JSON.stringify(r)), Bl();
    } catch {
    }
}
function Bl() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(fa) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((a) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(a) || "null");
      } catch {
        s = null;
      }
      !s || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(a) : n.push(a);
    });
    const r = 80;
    if (n.length <= r) return;
    n.map((a) => ({ k: a, ts: (JSON.parse(localStorage.getItem(a) || "{}") || {}).ts || 0 })).sort((a, s) => a.ts - s.ts).slice(0, n.length - r).forEach((a) => localStorage.removeItem(a.k));
  } catch {
  }
}
async function Rl(t) {
  try {
    const e = await fetch(
      D("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: F() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && da(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function jl(t, e, n, r) {
  const a = ["【用户提交的问卷答案】"], s = new Set(Ge(t, e));
  return t.forEach((o, p) => {
    if (!s.has(p)) return;
    const i = e[`q${p}`];
    if (!i) return;
    let h = i.value;
    if (Array.isArray(h))
      h = h.filter((x) => x !== ke).map((x) => {
        const y = (o.options || []).find((I) => Te(I) === String(x));
        return y ? Re(y) : x;
      }).join("、");
    else {
      const x = (o.options || []).find((y) => Te(y) === String(h));
      x && (h = Re(x)), String(i.value) === ke && (h = "");
    }
    const b = pe(o) === "single" ? "单选" : pe(o) === "multi" ? "多选" : "问答", q = !!String(h || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), m = String(i.skipped_by || ""), k = i.skipped ? m === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : m === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : q ? h : "（未作答）";
    let g = `- q${p} [${b}] ${k}`;
    i.other && !i.skipped && (g += `（其他：${i.other}）`), i.attachments && i.attachments.length && (g += `（附件：${i.attachments.map((x) => x.file_name).join("、")}）`), a.push(g);
  }), n && a.push(`- 其他意见：${n}`), r && r.length && a.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), a.join(`
`);
}
function Dl(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const a = r.value;
    if (Array.isArray(a) ? a.length === 1 && a[0] === ke : String(a ?? "") === ke) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const Fl = ["必须", "务必", "不得为空", "不能为空"], Wl = ["可为空", "可留空", "选填", "可选", "非必填"];
function Zs(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Fl.some((n) => e.indexOf(n) !== -1) ? !1 : Wl.some((n) => e.indexOf(n) !== -1);
}
function Hl(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = Ge(t, n);
  } catch {
    return n;
  }
  return r.forEach((a) => {
    const s = t[a];
    if (!Zs(s)) return;
    const o = `q${a}`, p = n[o];
    if (p && (p.skipped === !0 || St(p))) return;
    const i = pe(s);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function Ln(t) {
  return t.map((e, n) => {
    const r = pe(e) === "single" ? "单选" : pe(e) === "multi" ? "多选" : "问答", a = (e.options || []).map(Re).join("、");
    return `${n + 1}. [${r}] ${Dn(e, n)}${a ? "（" + a + "）" : ""}`;
  }).join(`
`);
}
function Kr(t) {
  const { R: e, files: n, disabled: r, uploading: a, error: s, onPick: o, onRemove: p } = t, i = {
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
  }, h = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: r || a ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: r || a ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    n.map((b, q) => e.createElement(
      "span",
      { key: "att" + q, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: b.file_name
      }, b.file_name + (b.size ? "（" + Tl(b.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || p(q);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: r || a,
      style: h,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, a ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function Ul(t) {
  const {
    R: e,
    providers: n,
    modelId: r,
    onChange: a,
    disabled: s,
    open: o,
    onOpenChange: p,
    tab: i,
    onTabChange: h
  } = t, q = Ve().Popover, m = [];
  n.forEach((S) => {
    [...S.models || [], ...S.extra_models || []].forEach((L) => {
      m.push({
        providerId: S.id,
        providerName: S.name || S.id,
        modelId: L.id,
        modelName: L.name || L.id,
        free: !!L.is_free
      });
    });
  });
  const k = m.find((S) => `${S.providerId}:${S.modelId}` === r), x = k ? k.modelName : r || "选择模型", y = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", I = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 22,
    padding: "1px 8px",
    boxSizing: "border-box",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: "1",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "var(--app-bg-container, rgba(127,127,127,0.04))",
    color: "var(--app-text, inherit)",
    cursor: s ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, T = m.filter((S) => S.free).length, E = m.length - T, C = [];
  n.forEach((S) => {
    const L = [...S.models || [], ...S.extra_models || []].map((N) => ({
      providerId: S.id,
      providerName: S.name || S.id,
      modelId: N.id,
      modelName: N.name || N.id,
      free: !!N.is_free
    })).filter((N) => i === "free" ? N.free : !N.free);
    L.length && C.push({ id: S.id, name: S.name || S.id, models: L });
  });
  const w = (S, L) => e.createElement("button", {
    key: S,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === S ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === S ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === S ? 600 : 400,
      boxShadow: i === S ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => h(S)
  }, L), P = e.createElement(
    "div",
    {
      style: { width: 268, maxHeight: "min(60vh, 340px)", overflowY: "auto", scrollbarWidth: "none" }
    },
    // segmented tab bar
    e.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 2,
          padding: 3,
          margin: "4px 6px 2px",
          borderRadius: 6,
          boxSizing: "border-box",
          background: "var(--app-surface-subtle, rgba(127,127,127,0.08))"
        }
      },
      w("paid", "付费 🟡 " + E),
      w("free", "免费 🟢 " + T)
    ),
    C.length ? e.createElement("div", null, C.map((S, L) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: S.id,
          style: { marginBottom: 2 }
        },
        e.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--app-text-tertiary, inherit)",
              borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))"
            }
          },
          e.createElement("span", { style: { flex: 1 } }, S.name),
          e.createElement("span", { style: { fontWeight: 400 } }, S.models.length)
        ),
        S.models.map((N) => {
          const J = `${N.providerId}:${N.modelId}` === r;
          return e.createElement(
            "div",
            {
              key: `${N.providerId}:${N.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (J ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: J ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                a(`${N.providerId}:${N.modelId}`), p(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: L % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
              }
            }),
            e.createElement("span", {
              style: {
                fontSize: 12,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }
            }, N.modelName)
          );
        })
      )
    ))) : e.createElement("div", {
      style: {
        fontSize: 12,
        padding: 16,
        textAlign: "center",
        color: "var(--app-text-tertiary, inherit)"
      }
    }, "暂无模型")
  );
  return q ? e.createElement(q, {
    content: P,
    trigger: "click",
    open: o,
    onOpenChange: p,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: I,
      disabled: s,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: y }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: I,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const S = m.find((L) => `${L.providerId}:${L.modelId}` !== r);
        S && a(`${S.providerId}:${S.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: y }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Gl(t) {
  const { R: e, mode: n, onChange: r, disabled: a, open: s, onOpenChange: o, popRef: p, panelRef: i } = t, h = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, b = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发模型请求：直接采用出题时已标注的推荐",
    manual: "由你手动作答"
  }, q = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 22,
    padding: "1px 8px",
    boxSizing: "border-box",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: "1",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "var(--app-bg-container, rgba(127,127,127,0.04))",
    color: "var(--app-text, inherit)",
    cursor: a ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, m = e.createElement(
    "svg",
    {
      width: 11,
      height: 11,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      "aria-hidden": "true",
      style: { flexShrink: 0 }
    },
    e.createElement("path", { d: "M4 6h16" }),
    e.createElement("path", { d: "M4 12h16" }),
    e.createElement("path", { d: "M4 18h10" })
  ), k = (y) => {
    const I = n === y;
    return e.createElement(
      "button",
      {
        key: y,
        type: "button",
        disabled: a,
        role: "menuitem",
        className: "qm-mode-opt",
        title: b[y],
        onClick: () => {
          r(y), o(!1);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          cursor: a ? "default" : "pointer",
          padding: "7px 9px",
          borderRadius: 6,
          border: "none",
          // US-010: 选中项淡 accent 底色（boss 反馈 4：选中项要一眼可辨）；
          // 未选中项保持透明底 + CSS hover 高亮（.qm-mode-opt:hover）。
          background: I ? "var(--app-accent-bg, rgba(255,127,22,0.08))" : "transparent",
          color: I ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: I ? 600 : 400
        }
      },
      e.createElement(
        "div",
        {
          style: {
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }
        },
        e.createElement("span", null, h[y]),
        // US-010: 选中项右侧 accent 色 ✓ 勾，强化「当前选中」辨识度。
        I ? e.createElement("span", {
          "aria-hidden": "true",
          style: {
            flex: "none",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
          }
        }, "✓") : null
      ),
      e.createElement("div", {
        style: {
          fontSize: 11,
          marginTop: 1,
          fontWeight: 400,
          color: "var(--app-text-tertiary, inherit)"
        }
      }, b[y])
    );
  }, g = e.createElement(
    "div",
    {
      key: "qm-mode-trigger",
      ref: p,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        flex: "none"
      }
    },
    e.createElement(
      "button",
      {
        type: "button",
        disabled: a,
        style: q,
        title: "运行选择：" + h[n],
        onClick: () => o(!s)
      },
      m,
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis" }
      }, h[n]),
      e.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
      }, "▾")
    )
  ), x = s ? e.createElement(
    "div",
    {
      key: "qm-mode-panel",
      ref: i,
      role: "menu",
      className: "qm-hdr-pop",
      style: {
        position: "absolute",
        top: 30,
        right: 0,
        zIndex: 1e4,
        // US-014: width 固有宽 + maxWidth 视口-44px 双保险（兼容不支持 CSS
        // min() 的旧 WebView 内核），移动端不溢出屏幕。
        width: "220px",
        maxWidth: "calc(100vw - 44px)",
        padding: 6,
        background: "var(--app-surface-raised, #fff)",
        border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
      }
    },
    e.createElement("div", {
      style: {
        position: "absolute",
        top: -5,
        right: 9,
        width: 8,
        height: 8,
        transform: "rotate(45deg)",
        background: "var(--app-surface-raised, #fff)",
        borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
      }
    }),
    e.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 9px 6px",
        color: "var(--app-text-tertiary, inherit)"
      }
    }, "运行选择"),
    k("ai"),
    k("recommend"),
    k("manual")
  ) : null;
  return [g, x];
}
function Jl(t) {
  const { R: e, templates: n, value: r, onSelect: a, onManage: s } = t;
  return e.createElement(
    "div",
    {
      style: {
        width: 240,
        maxHeight: "min(60vh, 320px)",
        overflowY: "auto",
        scrollbarWidth: "none"
      }
    },
    (n || []).map((o) => e.createElement(
      "div",
      {
        key: o.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (o.id === r ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: o.id === r ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        // 关闭弹层由调用方负责（本列表只负责选择/管理两个入口语义）。
        onClick: () => a(o.id)
      },
      e.createElement("span", {
        style: {
          fontSize: 12,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, o.name),
      o.builtin ? e.createElement("span", {
        style: {
          fontSize: 10,
          padding: "0 5px",
          borderRadius: 3,
          color: "var(--app-text-tertiary, inherit)",
          border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.3))"
        }
      }, "内置") : null,
      // US-010: 选中模板行尾 ✓ 勾（accent 色），配合既有选中底色
      // （accent-soft + 左侧 accent 边条），当前选中项一眼可辨。
      o.id === r ? e.createElement("span", {
        "aria-hidden": "true",
        style: {
          flex: "none",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--app-accent, #1677ff)"
        }
      }, "✓") : null
    )),
    e.createElement("div", {
      style: {
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--app-accent, #1677ff)",
        borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))"
      },
      onClick: () => s()
    }, "＋ 管理模板…")
  );
}
function Zl(t) {
  const { R: e, open: n, templates: r, value: a, edit: s, onEditChange: o, onClose: p, onSelect: i, onSave: h, onDelete: b } = t;
  if (!n) return null;
  const q = Ve(), { Input: m, Modal: k } = q, g = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  k || (g.position = "fixed", g.right = 24, g.top = 80, g.width = 420, g.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", g.zIndex = 1100, g.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const x = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, y = !!s, I = (E, C, w, P) => m && m.TextArea ? e.createElement(m.TextArea, {
    value: E,
    rows: w,
    placeholder: P,
    onChange: (S) => C(S && S.target ? S.target.value : "")
  }) : e.createElement("textarea", {
    value: E,
    rows: w,
    placeholder: P,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (S) => C(S && S.target ? S.target.value : ""),
    onChange: (S) => C(S && S.target ? S.target.value : "")
  }), T = e.createElement(
    "div",
    {
      style: g,
      className: "qm-tpl-mgr qm-bubble",
      "data-qm-tpl-mgr": "true"
    },
    e.createElement(
      "div",
      {
        style: { display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }
      },
      e.createElement(
        "span",
        { style: { fontWeight: 600, flex: 1 } },
        y ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: x, onClick: p }, "关闭")
    ),
    y ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      I(s.name || "", (E) => o({ ...s, name: E }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      I(s.system || "", (E) => o({ ...s, system: E }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      I(s.user || "", (E) => o({ ...s, user: E }), 6, "用户提示词模板"),
      e.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...x,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => h(s)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: x,
          onClick: () => o(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (r || []).map(
        (E) => e.createElement(
          "div",
          {
            key: E.id,
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 4px",
              borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))"
            }
          },
          e.createElement(
            "span",
            { style: {
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            } },
            E.name + (E.builtin ? "（内置）" : "") + (E.id === a ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: x,
            title: "设为本题使用",
            onClick: () => i(E.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => o({
              id: E.id,
              name: E.name,
              system: E.system,
              user: E.user
            })
          }, "编辑"),
          E.builtin ? null : e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => b(E.id)
          }, "删除")
        )
      ),
      e.createElement(
        "div",
        { style: { marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...x,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => o({ id: "", name: "", system: "", user: "" })
        }, "＋ 新建模板")
      )
    )
  );
  return k ? e.createElement(k, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    closeIcon: null,
    onCancel: p,
    destroyOnClose: !0,
    width: "min(620px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal"
  }, T) : T;
}
function Kl(t) {
  const {
    R: e,
    busy: n,
    result: r,
    error: a,
    mode: s,
    onRun: o,
    onApply: p,
    onCancel: i,
    onRerun: h,
    disabled: b,
    children: q,
    open: m,
    onOpenChange: k,
    popRef: g,
    panelRef: x
  } = t, I = Ve().Popover, T = e.createElement("button", {
    type: "button",
    disabled: b,
    key: "qm-analysis-trigger",
    ref: g,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      height: 24,
      padding: "0 10px",
      borderRadius: 12,
      fontSize: 12,
      border: "1px solid var(--app-accent, #ff7f16)",
      color: "var(--app-accent, #ff7f16)",
      background: "transparent",
      cursor: b ? "default" : "pointer"
    },
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      k(!m);
    }
  }, n ? "分析中…" : "查看分析");
  if (!I)
    return e.createElement(
      "div",
      null,
      T,
      r && m ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((N) => N.reasoning).join(`

`))) : null
    );
  const E = !!(r && (r.per_question || []).length), C = (N, J, re) => e.createElement("button", {
    type: "button",
    style: {
      fontSize: 12,
      height: 28,
      padding: "0 14px",
      borderRadius: 8,
      cursor: "pointer",
      border: "none",
      background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
      color: "var(--app-text-inverse, #fff)"
    },
    onClick: J
  }, N), w = e.createElement(
    "div",
    {
      className: "qm-bubble",
      style: { width: "100%", flex: "1 1 auto", minHeight: 0, overflowY: "auto", fontSize: 13 }
    },
    n ? e.createElement(
      "div",
      {
        style: {
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--app-text-tertiary, inherit)"
        }
      },
      e.createElement("span", null, "正在按六步思维链分析…"),
      i ? e.createElement("button", {
        type: "button",
        style: {
          marginLeft: "auto",
          fontSize: 11,
          height: 22,
          padding: "0 8px",
          borderRadius: 6,
          cursor: "pointer",
          border: "1px solid var(--app-danger-text, #d4380d)",
          background: "transparent",
          color: "var(--app-danger-text, #d4380d)"
        },
        // Stops the six-step run server-side (cancels the in-flight
        // model call) instead of only hiding the spinner.
        onClick: () => {
          try {
            i();
          } catch {
          }
        }
      }, "终止分析") : null
    ) : null,
    a ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, a) : null,
    r ? e.createElement(
      "div",
      null,
      e.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
          }
        },
        e.createElement("span", { style: { fontSize: 13, fontWeight: 600 } }, "AI 分析结果"),
        e.createElement("span", {
          style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
        }, `${r.model_id || "默认模型"} · ${r.elapsed || 0}s`),
        // Only the answered, non-running state offers the two actions.
        E && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: "auto",
            fontSize: 11,
            height: 22,
            padding: "0 8px",
            borderRadius: 6,
            cursor: "pointer",
            border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
            background: "transparent",
            color: "var(--app-text-secondary, inherit)"
          },
          // Reruns THIS question only, reusing the stored preferences
          // (model / context / parallel) — REQ-003.
          onClick: () => {
            try {
              (h || o)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        E && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: E ? 6 : "auto",
            fontSize: 11,
            height: 22,
            padding: "0 8px",
            borderRadius: 6,
            cursor: "pointer",
            border: "1px solid var(--app-accent, #ff7f16)",
            background: "transparent",
            color: "var(--app-accent, #ff7f16)"
          },
          onClick: () => {
            p(), k(!1);
          }
        }, "套用推荐") : null
      ),
      (r.per_question || []).map((N) => e.createElement(
        "div",
        { key: N.index, style: { marginBottom: 14 } },
        // ── Conclusion first ──
        // The user asked for「结论在上，分析在下」: the recommendation is
        // now a single prominent line, and the six-step reasoning is
        // demoted to the supporting detail underneath it.  Typography for
        // both comes from the .qm-md scale above, so nothing in the bubble
        // is larger/greyer than the survey text anymore.
        e.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              flexWrap: "wrap"
            }
          },
          e.createElement("span", {
            style: { fontSize: 13, fontWeight: 600, color: "var(--app-text, inherit)" }
          }, N.title),
          N.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + N.choice) : null,
          typeof N.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(N.confidence <= 1 ? N.confidence * 100 : N.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: fl(N.reasoning || "") }
        })
      ))
    ) : n || a ? null : e.createElement(
      "div",
      {
        style: {
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10
        }
      },
      e.createElement("div", {
        style: { fontSize: 12, color: "var(--app-text-tertiary, inherit)" }
      }, s === "ai" ? "本题尚未生成分析。" : "本题尚未分析。点击下方按钮，用所选模型分析本题并给出推荐。"),
      // Manual mode: analysis starts on an explicit press — opening the
      // bubble is a read-only action (REQ-001).
      C("开始分析", () => {
        try {
          o();
        } catch {
        }
      })
    )
  ), P = e.createElement("div", {
    style: {
      flex: "none",
      marginTop: 10,
      paddingTop: 8,
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
      fontSize: 12
    }
  }, q), S = e.createElement(
    "div",
    {
      key: "qm-analysis-panel",
      ref: x,
      role: "dialog",
      "aria-label": "题目分析",
      className: "qm-hdr-pop qm-analysis-panel",
      style: {
        position: "absolute",
        top: 30,
        right: 0,
        zIndex: 1e4,
        width: "min(460px, 90%)",
        maxWidth: "100%",
        // 高度：自适应且不得溢出视口。气泡 top:30 是相对 qm-actions 定位的，
        // 手机上 qm-actions 换行后自身已偏离视口顶（实测气泡起点 71px），
        // 所以余量不能按「视口顶 + 30」这种假设来算——直接给足安全边界。
        maxHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        background: "var(--app-surface-raised, #fff)",
        border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
      },
      onMouseDown: (N) => {
        N && N.stopPropagation && N.stopPropagation();
      },
      onClick: (N) => {
        N && N.stopPropagation && N.stopPropagation();
      },
      onKeyDown: (N) => {
        N && N.stopPropagation && N.stopPropagation();
      }
    },
    // 气泡小三角：指向触发器方向（右上）。
    e.createElement("div", {
      style: {
        position: "absolute",
        top: -5,
        right: 9,
        width: 8,
        height: 8,
        transform: "rotate(45deg)",
        background: "var(--app-surface-raised, #fff)",
        borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
      }
    }),
    w,
    P
  );
  return [T, m ? S : null];
}
function Ql(t) {
  const e = ze().React, n = Ve(), { Input: r, Button: a } = n, s = r.TextArea, o = t.data || {}, p = bl(o), i = yl(o), h = xl(o), b = kl(h), q = b ? "" : h, m = p.questions || [], k = p.title || "问卷", g = Jt(i), [x, y] = e.useState(
    () => !!(g && g.answered) || !!q || b
  ), [I, T] = e.useState(""), [E, C] = e.useState(() => {
    const l = Qt(i);
    return l && l.request_id ? l.request_id : g && typeof g.reqId == "string" ? g.reqId : "";
  }), [w, P] = e.useState(
    () => g && typeof g.visStep == "number" && g.visStep >= 0 ? g.visStep : 0
  ), [S, L] = e.useState(
    () => g && typeof g.slowAt == "number" ? g.slowAt : 0
  ), [N, J] = e.useState(
    () => g && typeof g.slowStep == "number" ? g.slowStep : -1
  ), [re, W] = e.useState(
    () => !!(g && g.slowFired === !0)
  ), [B, K] = e.useState(() => {
    const l = {};
    m.forEach((f, u) => {
      l[`q${u}`] = { type: pe(f), value: pe(f) === "multi" ? [] : "", other: "" };
    });
    const d = g && g.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((f) => {
      l[f] && (l[f] = { ...l[f], ...d[f] });
    }), l;
  }), [Ie, ut] = e.useState(
    () => g && typeof g.finalOther == "string" ? g.finalOther : ""
  ), [H, $] = e.useState(!1), [_, Q] = e.useState(
    () => g && typeof g.releasedNote == "string" ? g.releasedNote : ""
  ), [V, R] = e.useState(
    () => g && typeof g.localResult == "string" ? g.localResult : ""
  ), [ee, ve] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(g && g.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(q || "")
  ), [ne, Oe] = e.useState(
    () => (g && typeof g.skipReason == "string" ? g.skipReason : "") || vl(q || "")
  ), [ue, we] = e.useState(
    () => g && Array.isArray(g.finalOtherAtt) ? g.finalOtherAtt : []
  ), [he, je] = e.useState(
    () => !!(g && g.expanded)
  ), [Je, ft] = e.useState(!1), Et = e.useRef(0), [Se, to] = e.useState(
    () => g && typeof g.deadReason == "string" ? g.deadReason : ""
  ), [Xe, Ct] = e.useState(
    () => g && typeof g.gateBlocked == "string" ? g.gateBlocked : ""
  ), [mt, Vn] = e.useState(
    () => g && typeof g.submittedAt == "number" ? g.submittedAt : 0
  ), [Xn, Yn] = e.useState(
    () => !!(g && g.pastSoft === !0)
  ), [Nt, tn] = e.useState(
    () => !!(g && g.waitRetired === !0)
  ), Tt = e.useRef(
    !!(g && typeof g.submittedAt == "number" && g.submittedAt > 0 && Date.now() - g.submittedAt < Wr * 1e3)
  ), Ye = e.useRef(!1), nn = e.useRef(!!(g && g.pastSoft === !0)), [er, no] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), ro = e.useRef(er), ha = (l) => {
    ro.current = l, no(l);
  }, be = (l, d) => {
    const f = er[l];
    return f ?? d;
  };
  js = !!be("fallback_title", !0);
  const ba = Math.max(30, Number(be("wait_hint_sec", Wr)) || Wr), ao = "manual", [se, rn] = e.useState(ao), [ya, tr] = e.useState(""), [kc, so] = e.useState(!1), [nr, rr] = e.useState(!1), [ar, sr] = e.useState(!1), [oo, io] = e.useState([]), [xa, or] = e.useState(!1), [an, gt] = e.useState(null), [lo, et] = e.useState(""), [zt, ir] = e.useState(!1), lr = e.useRef(null), cr = e.useRef(null), ka = e.useRef(0);
  e.useEffect(() => {
    zt && (ka.current = Date.now());
  }, [zt]), e.useEffect(() => {
    if (!zt) return;
    const l = (f) => {
      if (Date.now() - ka.current < 350) return;
      const u = f && f.target;
      lr.current && u && lr.current.contains(u) || cr.current && u && cr.current.contains(u) || ir(!1);
    }, d = (f) => {
      f && f.key === "Escape" && ir(!1);
    };
    return document.addEventListener("mousedown", l), document.addEventListener("keydown", d), () => {
      document.removeEventListener("mousedown", l), document.removeEventListener("keydown", d);
    };
  }, [zt]);
  const [sn, $e] = e.useState(!1), [on, ht] = e.useState(!1), bt = e.useRef(null), dr = e.useRef(null), pr = e.useRef(null);
  e.useEffect(() => {
    if (!sn && !on) return;
    const l = (d) => {
      const f = d && d.target;
      bt.current && f && bt.current.contains(f) || dr.current && f && dr.current.contains(f) || ($e(!1), ht(!1));
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [sn, on]);
  const [ur, yt] = e.useState(!1), fr = e.useRef(null), mr = e.useRef(null);
  e.useEffect(() => {
    if (!ur) return;
    const l = (d) => {
      const f = d && d.target;
      fr.current && f && fr.current.contains(f) || mr.current && f && mr.current.contains(f) || yt(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [ur]);
  const [co, po] = e.useState(!1), [uo, fo] = e.useState("paid"), Ze = e.useRef({}), De = e.useRef({}), xt = e.useRef(0), At = e.useRef(null), [mo, kt] = e.useState(0), [gr, hr] = e.useState([]), [Ke, ln] = e.useState(""), Fe = e.useRef(Ke);
  Fe.current = Ke;
  const [br, Qe] = e.useState(!1), [go, va] = e.useState(!1), [ho, yr] = e.useState(null);
  e.useEffect(() => {
    if (!br) return;
    const l = (d) => {
      const f = d && d.target;
      bt.current && f && bt.current.contains(f) || pr.current && f && pr.current.contains(f) || Qe(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [br]);
  const [xr, We] = e.useState(!1);
  e.useEffect(() => {
    if (!xr) return;
    const l = (d) => {
      const f = bt.current;
      f && d && d.target && f.contains(d.target) || We(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [xr]);
  const [kr, He] = e.useState(!1), cn = e.useRef(null), wa = e.useRef(null);
  e.useEffect(() => {
    if (!kr) return;
    const l = (d) => {
      const f = wa.current;
      if (f && d && d.target && f.contains(d.target)) return;
      const u = d && d.target;
      u && u.closest && u.closest("[data-qm-release-lock]") || He(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [kr]);
  const [Me, qa] = e.useState(
    () => !!(g && g.autoPaused)
  ), bo = e.useRef(Me);
  bo.current = Me;
  const vt = e.useRef(!1), vr = e.useRef(0), dn = e.useRef({}), [yo, xo] = e.useState(0), It = e.useRef(/* @__PURE__ */ new Set()), Ot = (l) => {
    l && It.current.add(l);
  }, pn = e.useRef({}), [ko, un] = e.useState(0), tt = e.useRef({}), [$t, vo] = e.useState(!1), wo = e.useRef(!1);
  wo.current = $t, e.useRef(!1);
  const qo = async () => {
    try {
      const l = await Vt(
        "",
        !0,
        ce(i),
        Dt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      ha(d), d.mode !== void 0 && rn(Ft(d.mode)), typeof d.model_id == "string" && d.model_id && tr(d.model_id), typeof d.with_context == "boolean" && rr(d.with_context), typeof d.parallel == "boolean" && sr(d.parallel), kt((f) => f + 1);
    } catch {
    }
  }, _a = e.useRef(!1), fn = (l) => {
    if (l.mode !== void 0) {
      rn(l.mode), Hr(
        { mode: l.mode },
        ce(i),
        Dt()
      );
      try {
        localStorage.setItem(us, Js + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && tr(l.modelId), l.withContext !== void 0 && rr(l.withContext), l.parallel !== void 0 && sr(l.parallel), Hr(d, ce(i), Dt()));
  }, Sa = (l) => {
    !l || l === Ke || (ln(l), Fe.current = l, ot(i, { templateId: l }), Hr(
      { template_id: l },
      ce(i),
      Dt()
    ), gt(null), Ze.current = {}, De.current = {}, kt((d) => d + 1));
  }, _o = async (l) => {
    const d = await Ls({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      U("error", d.error || "保存失败");
      return;
    }
    hr(d.items || []), yr(null), U("success", "模板已保存");
  }, So = async (l) => {
    const d = await Bs(l);
    if (!d.ok) {
      U("warning", d.error || "删除失败");
      return;
    }
    hr(d.items || []);
    const f = (d.items || []).map((u) => u.id);
    if (f.indexOf(Fe.current) === -1) {
      const u = f[0] || "";
      ln(u), Fe.current = u, ot(i, { templateId: u });
    }
    U("success", "模板已删除");
  };
  e.useEffect(() => {
    if (x) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === us && qo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [x, i]), e.useEffect(() => {
    if (x) return;
    let l = !0;
    return al(), (async () => {
      const [d, f, u, v] = await Promise.all([
        Rs(),
        sl(),
        pa(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Vt(
          "",
          !0,
          ce(i),
          Dt()
        )
      ]);
      if (!l) return;
      if (io(d), hr(u.items), v && v.config) {
        const z = v.config;
        ha(z), z.mode !== void 0 && rn(Ft(z.mode)), typeof z.model_id == "string" && z.model_id && tr(z.model_id), typeof z.with_context == "boolean" && rr(z.with_context), typeof z.parallel == "boolean" && sr(z.parallel), typeof z.template_id == "string" && z.template_id && (ln(z.template_id), Fe.current = z.template_id);
      }
      const A = u.items.map((z) => z.id);
      if (!Fe.current || A.indexOf(Fe.current) === -1) {
        const z = u.defaultId || A[0] || "";
        z && (ln(z), Fe.current = z);
      }
      if (v && v.config) {
        const z = v.config;
        so(z.__follow_active__ === !0);
      }
      _a.current = !0, kt((z) => z + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    xt.current = w;
  }, [w]);
  const wr = async (l) => {
    if (xa) return;
    const d = w;
    or(!0), et("");
    const f = typeof AbortController < "u" ? new AbortController() : null;
    At.current = f;
    try {
      const u = await fetch(D("/question-modal/analyze"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({
          request_id: E,
          tool_call_id: i,
          session_id: ce(i),
          title: k,
          questions: m,
          model_id: ya,
          mode: l,
          with_context: nr,
          parallel: ar,
          question_index: d,
          answers: B,
          template_id: Fe.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(be("model_timeout_sec", 120)) || 120
        }),
        signal: f ? f.signal : void 0
      }), v = await u.json().catch(() => ({})), A = v && v.analysis || null, z = A && A.error || v && v.error || "";
      v && v.cancelled || A && A.cancelled ? et("已终止分析。") : !u.ok || !v || v.ok === !1 || A && A.ok === !1 ? et(z || "分析失败（服务返回 " + u.status + "）") : A && (Ze.current[d] = A, De.current[d] = !0, xt.current === d && gt(A), U("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      At.current === f && f && f.signal.aborted || u && u.name === "AbortError" ? et("已终止分析。") : et("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      At.current === f && (At.current = null), or(!1), tt.current[d] = !0, un((u) => u + 1);
    }
  }, Eo = () => {
    const l = w;
    delete Ze.current[l], gt(null), et(""), wr("manual");
  }, wt = (l) => {
    var f;
    const d = l !== void 0 ? l : xt.current;
    try {
      fetch(D("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: E,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      Nn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (f = At.current) == null || f.abort();
    } catch {
    }
    or(!1);
  }, Co = () => {
    wt(), et("已终止分析。");
  }, No = () => {
    Me ? (pn.current = {}, tt.current = {}, De.current = {}, vt.current = !1, qa(!1), kt((l) => l + 1), U("info", "已恢复自动答题")) : (wt(), qa(!0), U("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (x) return;
    const l = Ze.current[w];
    gt(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + w;
    let f = !0;
    return fetch(D("/question-modal/analysis") + d, { headers: F() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !f || !u || !u.found || !u.analysis || (Ze.current[w] = u.analysis, xt.current === w && gt(u.analysis));
    }).catch(() => {
    }), () => {
      f = !1;
    };
  }, [i, w]), e.useEffect(() => {
    x || _a.current && se === "ai" && $t && (!Tn(p) || !m.length || De.current[w] || H || (De.current[w] = !0, wr("auto")));
  }, [
    x,
    se,
    i,
    mo,
    nr,
    ar,
    m,
    w,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    $t
  ]);
  const To = () => {
    const l = an && an.per_question || [];
    if (!l.length) return;
    if (!l.some((f) => f.type === "multi" ? String(f.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(f.choice || "").trim().length > 0)) {
      U("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    K((f) => {
      const u = { ...f };
      return l.forEach((v) => {
        const A = `q${v.index}`;
        Ot(A);
        const z = u[A] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const ie = String(v.choice || "").split(/[、,，]/).map((ae) => ae.trim()).filter(Boolean);
          u[A] = { ...z, value: ie };
        } else
          u[A] = { ...z, value: v.choice || z.value };
      }), u;
    }), U("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, nt = (l, d, f = !1) => {
    wt(), to(l), ve(!0), R(d), ft(!1), y(!0), xe(i), f && ot(i, { backendReleased: !0 });
  }, zo = async (l, d) => {
    const f = await Zr(i, ce(i));
    return f.ok ? (nt(l, d, f.released), !0) : (ft(!0), _r(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = Jt(i)) == null ? void 0 : d.answers;
    ot(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: E,
      visStep: w,
      answers: Gr(B, l, It.current),
      finalOther: Ie,
      finalOtherAtt: ue,
      answered: x,
      skippedAll: ee,
      expanded: he,
      localResult: V,
      submittedAt: mt,
      skipReason: ne,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Xn,
      waitRetired: Nt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: S,
      slowStep: N,
      slowFired: re,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: Se,
      gateBlocked: Xe,
      releasedNote: _,
      autoPaused: Me,
      templateId: Ke
    });
  }, [
    i,
    E,
    w,
    B,
    Ie,
    ue,
    x,
    ee,
    he,
    V,
    mt,
    ne,
    Xn,
    Nt,
    S,
    N,
    re,
    Se,
    Me,
    Ke,
    Xe,
    _
  ]), e.useEffect(() => {
    if (!x || !mt || Nt || !Tt.current) return;
    let l = 0, d = !1, f = ss(i);
    const u = () => {
      if (d) return;
      const v = Math.floor((Date.now() - mt) / 1e3);
      if (v >= ba) {
        Ye.current = !0, tn(!0);
        return;
      }
      if (!Ye.current) {
        const A = ss(i);
        A >= 0 && (f < 0 ? f = A : A - f >= Ki && (Ye.current = !0));
      }
      if (!Ye.current && v >= Ji && !nn.current && (nn.current = !0, Yn(!0)), Ye.current) {
        l = setTimeout(
          () => {
            d || tn(!0);
          },
          Math.max(1e3, (ba - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || os(u);
      }, $s);
    };
    return os(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [x, mt, Nt]);
  const [qr, _r] = e.useState(!1), [Sr, Ea] = e.useState(""), Ca = (l, d, f) => {
    l.length && (d === "final" ? we((u) => u.concat(l)) : K((u) => {
      const v = f || `q${w}`;
      Ot(v);
      const A = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...A, attachments: (A.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, A, z) => {
      Ca(u, v, A), z && z.length ? Ea(z.join("；")) : Ea("");
    }, d = (u) => _r(u);
    Mn.set(i, l), Pn.set(i, d);
    const f = Cl(i);
    return f.length && f.forEach((u) => Ca([u.att], u.target, u.key)), _r(Hn > 0), () => {
      Mn.get(i) === l && Mn.delete(i), Pn.get(i) === d && Pn.delete(i);
    };
  }, [i, w]);
  const Er = (l, d) => Sl(i, l, d), Cr = (l, d, f) => {
    const u = Nl(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Ws(u, i, d, f);
    }
  };
  e.useEffect(() => {
    if (!b || I) return;
    let l = !0;
    return Ht(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ve(!0);
      const f = String(d.skip_reason || "").trim();
      f && Oe((u) => u || f), T(Wt(m, d));
    }), () => {
      l = !1;
    };
  }, [b, i, I]), e.useEffect(() => {
    if (x || !i || q) return;
    let l = !0;
    return Ht(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ve(!0);
      const f = String(d.skip_reason || "").trim();
      f && Oe((u) => u || f), T((u) => u || Wt(m, d)), R(Wt(m, d)), y(!0), xe(i);
    }), () => {
      l = !1;
    };
  }, [i, x, q]), e.useEffect(() => {
    if (x) return;
    let l = !0, d = 0, f = 0, u = 0, v = !1, A = !1, z = 0, ie = 0;
    Et.current || (Et.current = Date.now());
    let ae = !!Qt(i), Ce = !1;
    const qe = (j) => {
      !l || !j || !j.request_id || (ae = !0, f = 0, u = 0, v = !1, C(j.request_id), ft(!1), z && (clearTimeout(z), z = 0), Ll(
        i,
        j.request_id,
        j.session_id || en(),
        j.agent_id
      ));
    }, fe = (j) => {
      l && (z && (clearTimeout(z), z = 0), ie && (clearTimeout(ie), ie = 0), zo(
        j,
        j === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Bt = Qt(i), st = async () => {
      if (!Bt) return !1;
      const j = await Rl(Bt.request_id);
      if (!l) return !0;
      if (j.kind === "found") {
        const ye = j.data;
        return ye.tool_call_id && i && ye.tool_call_id !== i ? (xe(i), !1) : (qe(ye), !0);
      }
      return j.kind === "orphan" ? (fe("orphan"), !0) : (j.kind === "absent" && xe(i), !1);
    }, Ne = (j = !1) => {
      if (l) {
        if (d += 1, j || (f += 1, u || (u = Date.now())), j) {
          if (!Ce) {
            Ce = !0, Ht(i).then((me) => {
              if (l) {
                if (me) {
                  me.kind === "skipped" && !me.answers && ve(!0);
                  const Rt = String(me.skip_reason || "").trim();
                  Rt && Oe((Rr) => Rr || Rt), T(Wt(m, me)), R(Wt(m, me)), y(!0), xe(i);
                  return;
                }
                Ne(!0);
              }
            });
            return;
          }
          if (ae) {
            fe("gone");
            return;
          }
          const ye = Date.now() - (Et.current || Date.now());
          if (d >= 12 && ye >= Il) {
            fe("gone");
            return;
          }
        }
        if (f >= Hs) {
          if (Date.now() - (u || Date.now()) >= Gs) {
            if (v = !0, !A) {
              A = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, f = 0, u = 0, d = 0, le();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          z = setTimeout(le, Us);
          return;
        }
        z = setTimeout(le, d < $l ? Ol : 5e3);
      }
    }, Ae = () => {
      wl(i, ce(i)).then((j) => {
        if (l) {
          if (j.kind === "found") {
            qe(j.data);
            return;
          }
          if (j.kind === "orphan") {
            fe("orphan");
            return;
          }
          if (j.kind === "error") {
            Ne(!1);
            return;
          }
          zl(ce(i)).then((ye) => {
            if (l) {
              if (ye) {
                if (ye.tool_call_id && i && ye.tool_call_id !== i) {
                  Ht(i).then((me) => {
                    if (l) {
                      if (me) {
                        y(!0), xe(i);
                        return;
                      }
                      Ne(!0);
                    }
                  });
                  return;
                }
                qe(ye);
                return;
              }
              Ht(i).then((me) => {
                if (l) {
                  if (me) {
                    me.kind === "skipped" && !me.answers && ve(!0);
                    const Rt = String(me.skip_reason || "").trim();
                    Rt && Oe((Rr) => Rr || Rt), y(!0), xe(i);
                    return;
                  }
                  Ne(!0);
                }
              });
            }
          });
        }
      });
    }, le = () => {
      if (l) {
        if (!Bt) {
          Ae();
          return;
        }
        st().then((j) => {
          !l || j || Ae();
        });
      }
    };
    return ie = setTimeout(() => {
      l && ft(!0);
    }, Al), le(), () => {
      l = !1, z && clearTimeout(z), ie && clearTimeout(ie);
    };
  }, [x, i]);
  const Na = async () => {
    $(!0);
    try {
      const l = ce(i);
      let d = await Zr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ps(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok)
        throw new Error(
          d.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + d.reason + "）"
        );
      if (d.released) {
        const u = d.reason === "host-stop";
        nt(
          d.reason === "orphan" ? "orphan" : "",
          d.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), U(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        nt(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
    } catch (l) {
      U("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      $(!1);
    }
  }, Ta = async () => {
    $(!0);
    try {
      const l = ce(i);
      let d = await Zr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ps(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok) {
        Q(d.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + d.reason + "）。"), U("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (d.released) {
        const u = d.reason === "host-stop";
        Q(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), U("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        Q("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), U("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      U("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      $(!1);
    }
  }, Ao = e.createElement(
    "svg",
    {
      width: 13,
      height: 13,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    e.createElement("rect", { x: 3, y: 11, width: 18, height: 11, rx: 2 }),
    e.createElement("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })
  ), mn = (l, d) => e.createElement("button", {
    type: "button",
    key: d,
    className: "qm-release-lock",
    "data-qm-release-lock": "true",
    title: "释放阻塞（若发新消息报 A task is already running，点此释放）",
    "aria-label": "释放阻塞",
    disabled: H,
    // US-010: 二次确认——点击不再直接执行，先弹确认气泡；确定后由
    // releaseConfirmPanel 执行原 onClick（rescue / releaseBlocked 零改动）。
    // 打开时同步收起全部 header 弹层（互斥组）。
    onClick: () => {
      cn.current = l, $e(!1), ht(!1), yt(!1), Qe(!1), We(!1), He(!0);
    },
    style: {
      width: 24,
      height: 24,
      padding: 0,
      flex: "none",
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      cursor: H ? "default" : "pointer",
      border: "1px solid var(--app-warning-border, rgba(250,173,20,0.45))",
      background: "transparent",
      color: "var(--app-warning-text, #d46b08)"
    }
  }, Ao), Io = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认释放阻塞",
      ref: wa,
      style: {
        position: "absolute",
        top: 34,
        right: 12,
        zIndex: 1e4,
        width: 260,
        padding: "12px 14px",
        background: "var(--app-surface-raised, #fff)",
        border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
      }
    },
    e.createElement("div", {
      style: {
        position: "absolute",
        top: -5,
        right: 9,
        width: 8,
        height: 8,
        transform: "rotate(45deg)",
        background: "var(--app-surface-raised, #fff)",
        borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
      }
    }),
    e.createElement("div", {
      style: { fontWeight: 600, fontSize: 13, marginBottom: 6 }
    }, "确定释放本次阻塞问卷吗？"),
    e.createElement("div", {
      style: {
        fontSize: 12,
        lineHeight: 1.6,
        color: "var(--app-text-secondary, inherit)"
      }
    }, "释放后问卷将按当前进度收尾，会话恢复正常问答；此操作不可撤销。"),
    e.createElement(
      "div",
      {
        style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }
      },
      e.createElement("button", {
        type: "button",
        className: "qm-hdr-menu-item",
        style: {
          width: "auto",
          padding: "4px 12px",
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
          borderRadius: 6,
          background: "transparent",
          color: "var(--app-text-secondary, inherit)"
        },
        onClick: () => {
          He(!1), cn.current = null;
        }
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: H ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: H ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          const l = cn.current;
          He(!1), cn.current = null, l && l();
        }
      }, "确定")
    )
  ), gn = kr ? Io : null, hn = Ge(m, B), rt = hn.length, Pe = w >= rt, oe = Pe ? -1 : hn[w], Mt = Pe ? rt : w;
  e.useEffect(() => {
    if (Ft(be("mode", "manual")) !== "manual") return;
    let d = String(be("notify_channel_pc", "") || "");
    if (!d) {
      const u = String(be("notify_channel", "off") || "off"), v = !!be("notify_manual_mode", !1);
      d = u === "browser" || (u === "off" || !u) && v ? "browser" : u;
    }
    if (d !== "browser" || x || ee || Se || !Tn(p) || !m.length) return;
    const f = Ge(m, B).filter((u) => !St(B[`q${u}`])).length;
    Gi(i, k, f);
  }, [er, x, ee, Se, Mt]);
  const bn = Math.max(0, Number(be("slow_question_sec", Zi)) || 0) * 1e3, Oo = Math.round(bn / 1e3);
  e.useEffect(() => {
    if (x || ee || Se || bn <= 0) return;
    if (N !== Mt) {
      J(Mt), L(Date.now()), W(!1);
      return;
    }
    if (!S) {
      L(Date.now());
      return;
    }
    if (re) return;
    const l = S + bn - Date.now();
    if (l <= 0) {
      W(!0);
      return;
    }
    let d = !1;
    const f = setTimeout(() => {
      d || W(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(f);
    };
  }, [x, ee, Se, Mt, N, S, re, bn]);
  const Ee = oe >= 0 ? m[oe] : null, qt = `q${oe}`, Y = oe >= 0 && B[qt] || { type: pe(Ee), value: pe(Ee) === "multi" ? [] : "", other: "" }, _t = (l) => {
    var u;
    Xe && Ct(""), oe >= 0 && Ot(`q${oe}`);
    const d = { ...B, [qt]: { ...l, skipped: !1 } }, f = Ge(m, d);
    m.forEach((v, A) => {
      f.indexOf(A) === -1 && delete d[`q${A}`];
    }), ot(i, {
      answers: Gr(d, (u = Jt(i)) == null ? void 0 : u.answers, It.current)
    }), K(d);
  };
  e.useEffect(() => {
    w > rt && P(rt);
  }, [rt, w]);
  const Nr = async (l, d) => {
    const f = await fetch(D(l), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(d)
    }), u = await f.json().catch(() => ({}));
    if (!f.ok) {
      const v = new Error(u && u.detail || "HTTP " + f.status);
      throw v.status = f.status, v;
    }
    return u;
  }, Tr = () => {
    var l;
    return Dl(Gr(
      Hl(m, B),
      (l = Jt(i)) == null ? void 0 : l.answers,
      It.current
    ));
  }, $o = () => !!be("gate_unsaved", !0), Mo = (l) => Zs(l), za = (l, d) => {
    if (!$o()) return [];
    const f = new Set(Ge(m, l)), u = (A) => f.has(A) && !St(l[`q${A}`]) && !Mo(m[A]), v = [];
    return typeof d == "number" ? (u(d) && v.push(d + 1), v) : (m.forEach((A, z) => {
      u(z) && v.push(z + 1);
    }), v);
  }, Aa = (l, d, f) => {
    const u = "第 " + l.join("、") + " 题", v = f === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    Ct("⛔ " + u + "尚未选择。" + v);
    const A = Ge(m, d).length;
    Nr("/question-modal/gate-block", {
      request_id: E,
      tool_call_id: i,
      session_id: ce(i),
      missing: l,
      answered: A - l.length,
      total: A,
      bundle: ns
    }).catch(() => {
    });
  }, zr = async (l, d = !1) => {
    if (!E)
      return U("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const f = Tr();
    if (!d) {
      const u = za(f);
      if (u.length)
        return Aa(u, f, "提交"), "blocked";
      Ct("");
    }
    $(!0);
    try {
      const u = await Nr("/question-modal/answer", {
        request_id: E,
        session_id: ce(i),
        answers: f,
        other: Ie,
        attachments: ue
      });
      return u && u.orphan ? (fetch(
        D("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ce(i)),
        { method: "POST", headers: F() }
      ).catch(() => {
      }), nt(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), U("info", "本次问卷已失效，已关闭"), "sent") : (xe(i), R(jl(m, f, Ie, ue)), Vn(Date.now()), Yn(!1), tn(!1), Ye.current = !1, nn.current = !1, Tt.current = !0, y(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (nt(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), U("info", "本次问卷已失效，已关闭"), "blocked") : (U("error", "提交失败: " + u.message), d ? (vt.current = !1, vr.current += 1, vr.current >= jr && U(
        "warning",
        "自动提交连续失败 " + jr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), un((v) => v + 1), "not-ready") : "blocked");
    } finally {
      $(!1);
    }
  }, Po = () => {
    oe < 0 || (Xe && Ct(""), wt(xt.current), De.current[xt.current] = !0, Ot(`q${oe}`), K((l) => {
      const d = { ...l };
      d[`q${oe}`] = {
        type: (l[`q${oe}`] || {}).type || pe(Ee),
        value: ((l[`q${oe}`] || {}).type || pe(Ee)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const f = Ge(m, d);
      return m.forEach((u, v) => {
        f.indexOf(v) === -1 && delete d[`q${v}`];
      }), d;
    }), P((l) => l + 1));
  }, Lo = () => {
    if (Pe) {
      zr();
      return;
    }
    const l = Tr(), d = za(l, oe);
    if (d.length) {
      Aa(d, l, "下一步");
      return;
    }
    Xe && Ct(""), P((f) => f + 1);
  }, Bo = async () => {
    if (!E) {
      U("warning", "问卷尚未就绪，请稍候");
      return;
    }
    wt(), $(!0);
    try {
      const l = await Nr("/question-modal/skip", {
        request_id: E,
        session_id: ce(i)
      });
      if (l && l.orphan) {
        nt(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
        return;
      }
      U("info", "已跳过问卷"), xe(i), ve(!0), Oe("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), R("用户跳过了本次问卷。"), Vn(Date.now()), Yn(!1), tn(!1), Ye.current = !1, nn.current = !1, Tt.current = !0, y(!0);
    } catch (l) {
      if (l && l.status === 404) {
        nt(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
        return;
      }
      U("error", "跳过失败: " + l.message);
    } finally {
      $(!1);
    }
  };
  e.useEffect(() => {
    if (x || se !== "ai" && se !== "recommend" || Me || (se === "recommend" || se === "ai") && !$t || !Tn(p) || !m.length || H) return;
    if (Pe) {
      if (vt.current || vr.current >= jr) return;
      const ae = Tr();
      if (!hn.every(
        (qe, fe) => !!tt.current[fe] || St(ae[`q${qe}`])
      ) || !E) return;
      vt.current = !0, zr(void 0, !0).then((qe) => {
        qe === "not-ready" && (vt.current = !1);
      });
      return;
    }
    const l = w;
    if (pn.current[l] || se === "ai" && !tt.current[l]) return;
    const d = hn[l], f = m[d], u = pe(f), v = is(f), A = ls(Ze.current[l], d);
    if (se === "ai" && !tt.current[l]) return;
    pn.current[l] = !0;
    const z = v.length ? v.join("、") : A, ie = !!z;
    Ot(`q${d}`), ie || (dn.current[d] = !0, xo((ae) => ae + 1), U("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), K((ae) => {
      const Ce = { ...ae }, qe = `q${d}`, fe = Ce[qe] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!ie)
        Ce[qe] = {
          ...fe,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const st = f.options || [], Ne = (le) => String(le).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ae = z.split(/[、,，]/).map((le) => Ne(le)).filter(Boolean).map((le) => {
          const j = st.find((ye) => Te(ye) === le || Re(ye) === le);
          return j ? Te(j) : le;
        });
        Ce[qe] = {
          ...fe,
          type: u,
          value: Ae,
          other: Ae.length === 1 && Ae[0] === ke ? fe.other : "",
          attachments: Ae.length === 1 && Ae[0] === ke ? fe.attachments : []
        };
      } else if (u === "single") {
        const st = f.options || [], Ne = (j) => String(j).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ae = st.find((j) => Te(j) === z || Re(j) === z) || st.find((j) => Te(j) === Ne(z) || Re(j) === Ne(z)), le = Ae ? Te(Ae) : z;
        Ce[qe] = {
          ...fe,
          type: u,
          value: le,
          other: String(le) === ke ? fe.other : "",
          attachments: String(le) === ke ? fe.attachments : []
        };
      } else
        Ce[qe] = { ...fe, type: u, value: z };
      const Bt = Ge(m, Ce);
      return m.forEach((st, Ne) => {
        Bt.indexOf(Ne) === -1 && delete Ce[`q${Ne}`];
      }), Ce;
    }), De.current[l] = !0, tt.current[l] = !0, P((ae) => ae + 1), un((ae) => ae + 1);
  }, [
    x,
    se,
    Me,
    H,
    i,
    w,
    ko,
    rt,
    p,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    E,
    $t
  ]);
  const Pt = e.useRef(!1), at = e.useRef(0), Lt = e.useRef(!1), Ue = e.useRef({});
  e.useEffect(() => {
    if (x || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        Pt.current = !0, Lt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!m || m.length), u.answers && typeof u.answers == "object" && (K((A) => {
            const z = { ...A };
            return Object.keys(u.answers).forEach((ie) => {
              const ae = u.answers[ie];
              !ae || typeof ae != "object" || It.current.has(ie) || (z[ie] = {
                ...z[ie] || { type: "single", value: "", other: "" },
                ...ae
              });
            }), z;
          }), ot(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && P(u.cursor), typeof u.mode == "string" && u.mode) {
            const A = Ft(u.mode);
            rn((z) => z === A ? z : A);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((A) => {
            const z = parseInt(A, 10);
            !isNaN(z) && u.per_question[A] && (Ze.current[z] = u.per_question[A]);
          }), u.status === "submitted" && (Vn((A) => A || Date.now()), u.released && ot(i, { backendReleased: !0 }), y(!0), xe(i));
          const v = String(u.skip_reason || "").trim();
          v && Oe((A) => A || v), typeof u.mode == "string" && u.mode && (Ue.current.mode = Ft(u.mode)), Object.keys(u.answers || {}).forEach((A) => {
            Ue.current["a:" + A] = JSON.stringify(u.answers[A] || {});
          }), typeof u.cursor == "number" && (Ue.current.cursor = "c:" + u.cursor), Lt.current = !0, un((A) => A + 1);
        } finally {
          setTimeout(() => {
            Pt.current = !1;
          }, 0);
        }
      }
    };
    ol(i).then((u) => {
      !l || !u || !u.found || !u.state || (at.current = Math.max(at.current, u.rev), d(u.state));
    });
    const f = il(i, {
      onSnapshot: (u, v) => {
        at.current = Math.max(at.current, u), v && d(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= at.current && u.origin !== Un() || (at.current = Math.max(at.current, v), !(u.origin && u.origin === Un()) && d(u.state));
      },
      onStatus: (u) => {
        l && vo((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, f();
    };
  }, [x, i]), e.useEffect(() => {
    x || !i || Pt.current || Lt.current && Object.keys(B || {}).forEach((l) => {
      const d = JSON.stringify(B[l] || {});
      Ue.current["a:" + l] !== d && (Ue.current["a:" + l] = d, Nn(
        i,
        "set_answer",
        { key: l, answer: B[l] }
      ));
    });
  }, [x, i, JSON.stringify(B)]), e.useEffect(() => {
    if (x || !i || Pt.current || !Lt.current) return;
    const l = "c:" + w;
    Ue.current.cursor !== l && (Ue.current.cursor = l, Nn(i, "goto", { cursor: w }));
  }, [x, i, w]), e.useEffect(() => {
    x || !i || Pt.current || Lt.current && Ue.current.mode !== se && (Ue.current.mode = se, Nn(i, "set_mode", { mode: se }));
  }, [x, i, se]);
  const yn = {
    // US-010: 锚定 🔒 二次确认气泡（releaseConfirmPanel）的 absolute 定位；
    // 各卡片 return 的根 div 均用本样式（折叠行经 spread 继承）。
    position: "relative",
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Ar = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Ir = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, xn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Or = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Ia = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, $r = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Ro = { display: "flex", flexDirection: "column", gap: 8 }, Mr = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, kn = {
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
  }, Oa = {
    ...kn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, jo = {
    ...kn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Pr = {
    ...kn,
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
  }, $a = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Pr,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Ma = {
    flex: "none",
    marginRight: 8,
    fontSize: 10,
    lineHeight: "15px",
    padding: "0 5px",
    borderRadius: 3,
    whiteSpace: "nowrap",
    color: "var(--app-accent, #ff7f16)",
    background: "transparent",
    border: "1.5px solid var(--app-accent, #ff7f16)"
  }, Do = { height: 32, fontSize: 13, borderRadius: 8 }, Pa = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, La = (l) => {
    const d = Te(l);
    return Y.type === "multi" ? Array.isArray(Y.value) && Y.value.indexOf(d) !== -1 : Y.value === d;
  }, Ba = La(ke), Ra = (l) => {
    if (x || H) return;
    const d = Te(l);
    if (Y.type === "multi") {
      const f = Array.isArray(Y.value) ? Y.value.slice() : [], u = f.indexOf(d);
      u === -1 ? f.push(d) : f.splice(u, 1);
      const v = f.length === 1 && f[0] === ke;
      _t({
        ...Y,
        value: f,
        other: v ? Y.other : "",
        attachments: v ? Y.attachments : []
      });
    } else {
      const f = d === ke;
      _t({
        ...Y,
        value: d,
        other: f ? Y.other : "",
        attachments: f ? Y.attachments : []
      });
    }
  }, Fo = !!be("show_recommend_badge", !0), ja = be("badge_position", "left") === "right", Wo = be("badge_style", "rect") === "round", Da = (l) => l && Fo ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Wo ? { ...Ma, borderRadius: 999 } : Ma
  }, "AI 推荐") : null, Ho = !!be("auto_number_options", !0), Uo = !!be("highlight_recommended", !1), Go = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Fa = (l, d, f, u, v, A) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: x || H,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && Uo ? { ...d ? $a : Pr, ...Go } : d ? $a : Pr,
      onClick: f
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    ja ? null : Da(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (A && Ho ? A + ". " : "") + l),
    ja ? Da(v) : null
  );
  if (!x && !Tn(p))
    return e.createElement(
      "div",
      { style: yn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Ar, className: "qm-header" },
        e.createElement(
          "div",
          { style: Ir },
          Dr(e),
          e.createElement("span", { style: xn, className: "qm-title" }, k)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放本次问卷」
          // 按钮移除，不留多套并存）。准备中的卡同样会把会话锁死，越过
          // stuck 阈值后必须仍有唯一逃生口；点击走基线 rescue 逻辑
          // （converge 收尾 + toast，语义与 334ad7b 逐字一致）。
          Je ? mn(Na, "qm-release-lock-prep") : null,
          e.createElement("span", { style: Or }, "准备中")
        )
      ),
      e.createElement("div", {
        style: { ...Ia, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // US-010: 🔒 二次确认气泡挂卡片根。
      gn
    );
  if (x) {
    const l = () => {
      const f = Yi({
        submittedAt: mt,
        deadReason: Se,
        releasedNote: _,
        skippedAll: ee,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: Nt,
        pastSoft: Xn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!Tt.current
      });
      return f ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": i,
        "data-qm-phase": f.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: f.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, Xi(f.phase)) : null;
    }, d = !!Tt.current;
    return ee && !he ? e.createElement(
      "div",
      {
        style: {
          ...yn,
          padding: "8px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        },
        className: "qm-card",
        "data-qm-card": "true",
        "data-qm-card-id": i
      },
      e.createElement("span", {
        style: { color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "›"),
      e.createElement(
        "span",
        { style: { fontSize: 13, fontWeight: 500 } },
        Se ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      ne ? e.createElement("span", {
        "data-qm-skip-reason": "true",
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-warning-text, #d46b08)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        },
        title: ne
      }, ne) : null,
      // ── 卡片标题（2026-11-14 修复「标题被压成竖排一字一行」）──────────
      //
      // 根因：这里曾写 `flex: releasedNote ? 0 : (skipReason ? 0 : 1)`。
      // `flex: 0` 是**数值简写**，等价 `flex-grow:0; flex-shrink:1;
      // flex-basis:0%` —— `flex-basis:0%` 直接让宽度基准归零，再配合
      // 外层 `white-space:nowrap` 就把它压成「钉/钉/提/醒/验/证/方/式」
      // 一列竖排（用户截图形态）。
      //
      // 正确写法：需要「按内容占宽、但空间不足时可收缩」时用
      // `flex:"0 1 auto"`（grow=0 不抢空间、shrink=1 可收缩、basis=auto
      // 按内容宽度）。**绝不能写数值 `0`**——那会把 basis 变成 0%。
      // 同时补 `minWidth:0 + 省略号`：标题极长时该收缩就收缩并打点，
      // 绝不允许靠"压到 0 宽"这种副作用来腾空间。
      e.createElement("span", {
        style: {
          ...xn,
          flex: _ || ne ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      _ ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, _) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...Oa,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => je(!0)
      }, "展开"),
      // Escape hatch for the「already finished but the chat is still locked」
      // shape: the card can be settled while the agent's Future was never
      // actually resolved (orphaned record / cross-generation reload / race),
      // so the chat keeps answering 409 and the user has nothing left to
      // click.  This entry therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
      // US-005: 释放入口收口到行尾 🔒 icon（原「释放阻塞」按钮移除）。
      d ? mn(Ta, "qm-release-lock-fold") : null,
      // US-010: 🔒 二次确认气泡挂卡片根（折叠行经 card spread 已有 relative）。
      gn
    ) : e.createElement(
      "div",
      { style: yn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Ar, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Ir },
          Dr(e),
          e.createElement("span", { style: xn }, k)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放阻塞」按钮
          // 移除，不留多套并存）；出现条件沿用 showRelease 判定。
          d ? mn(Ta, "qm-release-lock-ans") : null,
          e.createElement(
            "span",
            { style: { ...Or, color: Se ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
            Se ? "已失效" : ee ? "已跳过" : "已完成"
          )
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      ee && (ne || Se) ? e.createElement(
        "div",
        {
          "data-qm-skip-reason-block": "true",
          style: {
            marginBottom: 8,
            padding: "8px 12px",
            fontSize: 12,
            lineHeight: 1.6,
            background: "var(--app-warning-bg, rgba(212,107,8,0.08))",
            border: "1px solid var(--app-warning-text, #d46b08)",
            borderRadius: 6,
            color: "var(--app-warning-text, #d46b08)"
          }
        },
        e.createElement("span", { style: { fontWeight: 600 } }, "跳过原因："),
        String(ne || Se || "问卷已失效/跳过")
      ) : null,
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
      }, ee ? V ? V + `

` + Ln(m) : `已跳过本次问卷。

` + Ln(m) : V || I || q || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + Ln(m)),
      ee && he ? e.createElement(
        "div",
        { style: Mr },
        e.createElement("button", {
          type: "button",
          style: Oa,
          onClick: () => je(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Mr, marginTop: 8, gap: 10 } },
        _ ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, _) : l()
      ),
      // US-010: 🔒 二次确认气泡挂卡片根。
      gn
    );
  }
  const Lr = re && N === Mt, Wa = !x && !Pe && yo >= 0 && dn.current[oe] ? e.createElement("div", {
    key: "norec",
    className: "qm-norec-note",
    "data-qm-norec": "true",
    style: {
      marginTop: 8,
      padding: "6px 9px",
      borderRadius: 6,
      fontSize: 12,
      lineHeight: 1.5,
      background: "var(--app-warning-faint, rgba(255,166,0,0.10))",
      border: "1px solid var(--app-warning-border, rgba(255,166,0,0.35))",
      color: "var(--app-text-secondary, #6b6b6b)"
    }
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Ha = Object.keys(dn.current).map((l) => Number(l)).filter((l) => dn.current[l] && Number.isFinite(l)).sort((l, d) => l - d), Jo = Pe && Ha.length ? e.createElement("div", {
    key: "norec-sum",
    className: "qm-norec-sum",
    "data-qm-norec-sum": "true",
    style: {
      marginTop: 10,
      padding: "7px 10px",
      borderRadius: 6,
      fontSize: 12,
      lineHeight: 1.5,
      background: "var(--app-warning-faint, rgba(255,166,0,0.10))",
      border: "1px solid var(--app-warning-border, rgba(255,166,0,0.35))",
      color: "var(--app-text-secondary, #6b6b6b)"
    }
  }, "⚠ 第 " + Ha.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let vn = null;
  if (Pe)
    vn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: $r }, "其他意见（可选）"),
      Jo,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Ie,
        style: Pa,
        onChange: (l) => ut(l.target.value),
        onPaste: (l) => Cr(l, "final", "final")
      }),
      Kr({
        R: e,
        files: ue,
        disabled: x || H,
        uploading: qr,
        error: Sr,
        onPick: () => Er("final", "final"),
        onRemove: (l) => we((d) => d.filter((f, u) => u !== l))
      })
    );
  else if (Ee && pe(Ee) === "text")
    vn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...$r, fontSize: 13, color: "var(--app-text, inherit)" } }, Dn(Ee, oe)),
      Wa,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof Y.value == "string" ? Y.value : "",
        style: Pa,
        onChange: (l) => _t({ ...Y, value: l.target.value, other: "" }),
        onPaste: (l) => Cr(l, "q", qt)
      }),
      Kr({
        R: e,
        files: Y.attachments || [],
        disabled: x || H,
        uploading: qr,
        error: Sr,
        onPick: () => Er("q", qt),
        onRemove: (l) => _t({
          ...Y,
          attachments: (Y.attachments || []).filter((d, f) => f !== l)
        })
      })
    );
  else if (Ee) {
    const l = is(Ee), d = ls(an, oe), f = l.length ? l : d ? [d] : l, u = (Ee.options || []).map((v, A) => Fa(
      Re(v),
      La(v),
      () => Ra(v),
      "o" + A,
      ml(Ee, v, f),
      A + 1
    ));
    u.push(Fa("其他", Ba, () => Ra(ke), "other")), Ba && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: Y.other,
      style: { ...Do, marginTop: 2 },
      onChange: (v) => _t({ ...Y, other: v.target.value }),
      onPaste: (v) => Cr(v, "q", qt)
    })), u.push(Kr({
      R: e,
      files: Y.attachments || [],
      disabled: x || H,
      uploading: qr,
      error: Sr,
      onPick: () => Er("q", qt),
      onRemove: (v) => _t({
        ...Y,
        attachments: (Y.attachments || []).filter((A, z) => z !== v)
      })
    }))), vn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...$r, fontSize: 13, color: "var(--app-text, inherit)" } }, Dn(Ee, oe)),
      Wa,
      e.createElement("div", { style: { ...Ro, marginTop: 8 } }, u)
    );
  }
  const Br = rt + 1, Zo = Pe ? Br + "/" + Br : w + 1 + "/" + Br, Ua = (l, d, f, u, v) => e.createElement("button", {
    type: "button",
    title: l,
    "aria-label": l,
    onClick: f,
    style: {
      ...v != null && v.text ? { width: "auto", padding: "0 7px" } : { width: 24, padding: 0 },
      height: 24,
      flex: "none",
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      cursor: "pointer",
      border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
      background: d ? "var(--app-surface-subtle, rgba(127,127,127,0.10))" : "transparent",
      color: "var(--app-text-secondary, inherit)"
    }
  }, u), Ko = e.createElement(
    "span",
    {
      style: { display: "inline-flex", alignItems: "center", gap: 3 }
    },
    e.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "更多"),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  ), Qo = e.createElement(
    "svg",
    {
      width: 14,
      height: 14,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    e.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    e.createElement("path", { d: "M12 16v-4" }),
    e.createElement("path", { d: "M12 8h.01" })
  ), wn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 1e4,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, qn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, _n = (l, d) => e.createElement(
    "button",
    {
      type: "button",
      key: l,
      className: "qm-hdr-menu-item",
      role: "menuitem",
      onClick: d && d.onClick ? d.onClick : () => {
        $e(!1);
      },
      disabled: d ? !!d.disabled : !1,
      title: d && d.title ? d.title : void 0,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        textAlign: "left",
        cursor: d && d.disabled ? "default" : "pointer",
        padding: "7px 12px",
        fontSize: 12,
        border: "none",
        background: "transparent",
        color: "var(--app-text, inherit)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 260,
        opacity: d && d.disabled ? 0.5 : 1
      }
    },
    e.createElement("span", {
      style: { overflow: "hidden", textOverflow: "ellipsis" }
    }, l),
    // US-010: 每项右侧淡色「›」提示「可点击进入/执行」（boss 反馈 4）；
    // disabled 项不显示箭头，避免暗示可点。
    !d || !d.disabled ? e.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: "none",
        fontSize: 12,
        lineHeight: 1,
        color: "var(--app-text-tertiary, inherit)"
      }
    }, "›") : null
  ), Ga = (gr || []).find((l) => l.id === Ke), Vo = Ga ? Ga.name : "默认模板", Xo = e.createElement(
    "div",
    { style: wn, role: "menu", className: "qm-hdr-pop" },
    e.createElement("div", { style: qn }),
    _n("选择模板（当前：" + Vo + "）", {
      disabled: x || H,
      onClick: () => {
        $e(!1), ht(!1), yt(!1), We(!1), He(!1), Qe(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    _n("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: x || H || Pe,
      onClick: () => {
        $e(!1), Po();
      }
    }),
    _n("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: x || H,
      onClick: () => {
        $e(!1), zr(void 0, !0);
      }
    }),
    _n("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: x || H,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        $e(!1), We(!0), He(!1);
      }
    })
  ), Yo = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定（点面板内部不关闭）。width 固有宽 + maxWidth 视口-44px 防溢出。
      ref: dr,
      role: "dialog",
      "aria-label": "查看上下文",
      className: "qm-hdr-pop",
      style: { ...wn, width: "300px", maxWidth: "calc(100vw - 44px)", padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: qn }),
    e.createElement("div", {
      style: {
        fontWeight: 600,
        marginBottom: 6,
        color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
      }
    }, "问卷发起原因"),
    e.createElement("div", {
      style: {
        background: "var(--app-accent-soft, rgba(255,127,22,0.16))",
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 8,
        lineHeight: 1.55
      }
    }, "发布「费用报销-部门审批」流程前，需要确认差旅费报销上限是否调整为 5000 元/次。（示例数据，本版不接后端）"),
    e.createElement(
      "div",
      {
        style: { color: "var(--app-text-secondary, inherit)", lineHeight: 1.55 }
      },
      e.createElement("b", {
        style: { color: "var(--app-text, inherit)", fontWeight: 600 }
      }, "最近上下文："),
      e.createElement("br"),
      "用户：把报销流程里的差旅标准改一下，然后走发布。",
      e.createElement("br"),
      "助手：好的，发布前需要与您确认 2 个关键参数。"
    ),
    e.createElement("div", {
      style: { marginTop: 8, fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
    }, "来自本次问卷创建时的会话快照 · 仅本会话可见")
  ), ei = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定。width 248px（内容 240+padding 8）+ maxWidth 视口-44px，不溢出。
      ref: pr,
      role: "dialog",
      "aria-label": "选择模板",
      className: "qm-hdr-pop",
      style: { ...wn, padding: 4, width: "248px", maxWidth: "calc(100vw - 44px)" }
    },
    e.createElement("div", { style: qn }),
    Jl({
      R: e,
      templates: gr,
      value: Ke,
      onSelect: (l) => {
        Sa(l), Qe(!1);
      },
      onManage: () => {
        Qe(!1), va(!0);
      }
    })
  ), ti = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      className: "qm-hdr-pop",
      style: { ...wn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: qn }),
    e.createElement("div", {
      style: { fontWeight: 600, fontSize: 13, marginBottom: 6 }
    }, "确定跳过整份问卷吗？"),
    e.createElement("div", {
      style: {
        fontSize: 12,
        lineHeight: 1.6,
        color: "var(--app-text-secondary, inherit)"
      }
    }, "跳过后本次问卷按「已跳过」结束，未答题目不再收集，不可恢复。"),
    e.createElement(
      "div",
      {
        style: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }
      },
      e.createElement("button", {
        type: "button",
        className: "qm-hdr-menu-item",
        style: {
          width: "auto",
          padding: "4px 12px",
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
          borderRadius: 6,
          background: "transparent",
          color: "var(--app-text-secondary, inherit)"
        },
        onClick: () => We(!1)
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: H ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: H ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          We(!1), Bo();
        }
      }, "确定")
    )
  ), ni = e.createElement(
    "div",
    {
      key: "qm-hdr-pop",
      ref: bt,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "none"
      }
    },
    Ua("更多操作", sn, () => {
      $e((l) => !l), ht(!1), yt(!1), Qe(!1), We(!1), He(!1);
    }, Ko, { text: !0 }),
    Ua("查看上下文", on, () => {
      ht((l) => !l), $e(!1), yt(!1), Qe(!1), We(!1), He(!1);
    }, Qo),
    sn ? Xo : null,
    // US-012: 上下文气泡与模板选择面板（宽面板）不再挂本触发器小容器，
    // 改挂 qm-actions 行容器直下（见 qm-actions children 末尾）——移动端
    // 防错位/溢出（demo v5 参照系）。更多菜单/跳过确认气泡仍挂本容器。
    xr ? ti : null
  ), Ja = {
    ...kn,
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
    { style: yn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Ar, className: "qm-header" },
      e.createElement(
        "div",
        { style: Ir },
        Dr(e),
        e.createElement("span", { style: xn, className: "qm-title" }, k)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          // US-012: position:relative——宽弹出层（模式下拉/上下文气泡/模板选择）
          // 以本行容器为定位参照（top:30 right:0 对齐整行右缘，demo v5 参照系）。
          style: { position: "relative", display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        // US-010: 释放阻塞 🔒 icon 移到 qm-actions 首位（ModelCapsule 之前），
        // 与「更多」⋮ 之间隔开整排控件，避免容器误触（boss 反馈 2）。
        // 出现条件不变（题级 slowActive / stuck 故障兜底）；点击走二次确认
        // → 基线 rescue（converge 收尾 + toast，语义与 334ad7b 逐字一致）。
        Lr || Je && !E ? mn(Na, "qm-release-lock") : null,
        Ul({
          R: e,
          providers: oo,
          modelId: ya,
          disabled: x || H,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: co,
          onOpenChange: po,
          tab: uo,
          onTabChange: fo,
          onChange: (l) => {
            fn({ modelId: l }), gt(null), Ze.current = {}, De.current = {}, kt((d) => d + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        Gl({
          R: e,
          mode: se,
          disabled: x || H,
          open: ur,
          onOpenChange: (l) => {
            yt(l), l && ($e(!1), ht(!1), Qe(!1), We(!1), He(!1));
          },
          popRef: fr,
          panelRef: mr,
          // US-012: 面板独立锚点（面板挂 qm-actions 行容器）
          onChange: (l) => {
            fn({ mode: l }), l === "ai" && (De.current = {}), l === "ai" || l === "recommend" ? (pn.current = {}, tt.current = {}, vt.current = !1, kt((d) => d + 1)) : wt();
          }
        }),
        Kl({
          R: e,
          busy: xa,
          result: an,
          error: lo,
          mode: se,
          disabled: x || H,
          open: zt,
          onOpenChange: ir,
          popRef: lr,
          panelRef: cr,
          // US-013: 触发器/面板双 ref（外部点击关闭）
          onRun: () => {
            wr("manual");
          },
          onRerun: Eo,
          onApply: To,
          onCancel: Co,
          // The bubble footer carries the two analysis options (the user asked
          // for the context switch to live "in the button").  Passed inside the
          // props object — a direct function call has no positional children.
          children: [
            e.createElement(
              "label",
              {
                key: "ctx",
                style: { display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" },
                title: "分析时携带上一次决策与会话历史作为依据"
              },
              e.createElement("input", {
                type: "checkbox",
                checked: nr,
                onChange: (l) => fn({ withContext: !!l.target.checked })
              }),
              "携带上下文"
            ),
            e.createElement(
              "label",
              {
                key: "par",
                style: { display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" },
                title: "多题分析时并发执行（更快）或逐个串行执行（更稳）"
              },
              e.createElement("input", {
                type: "checkbox",
                checked: ar,
                onChange: (l) => fn({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (se === "ai" || se === "recommend") && !x ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: H,
          onClick: No,
          style: {
            ...Ja,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...Me ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: Me ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, Me ? "▶ 继续" : "⏸ 停止") : null,
        // US-001: 「更多」(⋮) 与「查看上下文」(ⓘ) 两个 icon 微按钮 + 弹出层，
        // 纯增量插在现有控件之后、进度 pill 之前（demo v5 形态）。
        ni,
        // US-012: 宽弹出层（上下文气泡/模板选择面板）上移到 qm-actions 行容器
        // 直下——移动端 qm-actions 换行后触发器小容器横向位置不定，挂行容器
        // right:0 对齐整行右缘（≈卡片右缘），修复错位/溢出/被裁（demo v5 口径）。
        // 模式下拉面板由 ModeSwitch 返回数组同步上移；互斥与外部点击关闭逻辑不变。
        on ? Yo : null,
        br ? ei : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Or, key: "qm-step" }, Zo)
      )
    ),
    e.createElement("div", { style: Ia }, vn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Zl({
      R: e,
      open: go,
      templates: gr,
      value: Ke,
      edit: ho,
      onEditChange: yr,
      onClose: () => {
        va(!1), yr(null);
      },
      onSelect: (l) => Sa(l),
      onSave: _o,
      onDelete: So
    }),
    // ── escape hatch: a survey blocks the whole chat while it is open ──
    // Shown after STUCK_AFTER_MS regardless of whether the card is healthy:
    // as long as the agent is parked, every new message in this chat answers
    // 409, so the user must always have a way out.
    // 2026-10-22 七次裁定（用户原话：「逻辑与我要求的不对，因为 30 秒是问卷的
    // 总体计时，时间过短，提示频繁，所以我要求将其改成题级，都按 60 秒计算，
    // 切换题目重置，这样不会造成频繁提示给用户心理暗示，造成心理负担」）。
    //
    // 因此：**整卷 30s 计时不再产生任何提示**。原先 `stuck`（30s 总计时）直接
    // 触发横幅，等于每张卡必然在 30 秒时冒出一条警告，正是用户说的"频繁提示 /
    // 心理负担"。现在横幅只由 **本题满 60s** 驱动，且切题即归零。
    //
    // `stuck` 只在**真异常**时兜底：`stuck && !reqId` 表示 30 秒都拿不到本次
    // 问卷的会话句柄（后端不可达 / 无会话），此时「其他意见」页也可能没有题级
    // 计时可依赖，必须保留唯一逃生口——这不是计时提示，而是故障提示。
    //
    // 秒数仍全部去掉（六次裁定 q2）：原横幅每次渲染用 Date.now() 现算，重挂会跳数。
    (Lr || Je && !E) && !x ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": re ? i : void 0,
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
        // 秒数整体去掉（q2）：「一段时间」不随渲染变化，故重挂不会跳数。
        // 判据必须带 `slowStep === visStep`：setSlowFired(false) 由切题后的
        // effect 执行，而 effect 晚于渲染，只看 slowFired 会让切题第一帧仍按
        // 上一题的超时文案渲染（[AS10] 抓的就是这一帧）。统一收敛到 slowActive。
        // 两个分支各自成立：slowActive=本题满 60s；否则走到这里只可能是
        // `stuck && !reqId`（真故障兜底），此时说"拿不到会话句柄"才准确。
        // 阈值必须来自生效配置：这里原先把 60 写死在文案里，
        // 用户把「题级计时提示」改成 5 秒后，提示仍说「已超过 60s」
        // ——文案与真实判据不符，等于对用户说谎。
        (Lr ? "⚠️ 本题已超过 " + Oo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；若你不想继续作答，点右上角 🔒 释放阻塞。"
      )
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Xe && !x ? e.createElement("div", {
      style: {
        margin: "0 0 10px",
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(217,45,32,0.10)",
        border: "1.5px solid rgba(217,45,32,0.55)",
        fontSize: 12.5,
        lineHeight: 1.55,
        color: "#d92d20",
        fontWeight: 500
      },
      className: "qm-gate-block",
      "data-qm-gate": "true",
      // Forensic bundle tag — invisible to the user, still queryable so a
      // "the gate didn't fire" report can be told apart from a stale bundle.
      "data-qm-bundle": ns
    }, Xe) : null,
    e.createElement(
      "div",
      { style: Mr, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: w === 0 || H,
        style: { ...Ja, marginRight: "auto", opacity: w === 0 ? 0.5 : 1 },
        onClick: () => P((l) => l - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: jo,
        onClick: Lo
      }, Pe ? "提交" : "下一步")
    ),
    // US-010: 🔒 二次确认气泡统一挂卡片根（四处 🔒 共用一个气泡实例）。
    gn
  );
}
const fs = 12;
let ms = 0;
const c = {
  visible: !1,
  tab: "answer",
  scope: "global",
  lastScope: "global",
  scopeChoice: "default",
  sessData: null,
  cfg: null,
  cfgError: "",
  chatId: "",
  sessionId: "",
  agentId: "",
  draft: {},
  saving: !1,
  saveMsg: "",
  modelOptions: [],
  templateOptions: [],
  providerGroups: [],
  templates: [],
  tplEdit: null,
  tplBusy: !1,
  globalCfg: {},
  keyTs: {},
  conflictNote: "",
  notifyChannels: [],
  notifyCurrent: "off",
  pcCurrent: "off",
  bgCurrent: "off",
  notifyTesting: "",
  notifyMsg: {},
  notifyLog: {},
  stale: {
    rows: [],
    scanned: !1,
    busy: !1,
    msg: "",
    msgKind: "info",
    page: 0,
    exceeded: [],
    within: [],
    threshold: null,
    thrBusy: !1,
    blocking: [],
    residual: [],
    resPage: 0,
    copied: ""
  }
};
let Ut = null;
function de(t, e, n) {
  if (t in c.draft) return c.draft[t];
  if (n === "global") {
    const s = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return s && t in s ? s[t] : e;
  }
  const r = c.cfg && c.cfg.config, a = c.cfg && c.cfg.sessionConfig;
  if (a) {
    if (t in a) return a[t];
    const s = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return s && t in s ? s[t] : e;
  }
  return r && t in r && c.cfg && c.cfg.has_session === !0 ? r[t] : (r && t in r && !(c.cfg && c.cfg.has_session), e);
}
function Vl(t) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function te(t, e) {
  let n;
  const r = c.cfg;
  if (c.scope === "global") {
    const a = r && r.globalConfig || c.globalCfg || {};
    n = t in a ? a[t] : void 0;
  } else {
    const a = r && r.sessionConfig;
    if (a)
      if (t in a)
        n = a[t];
      else {
        const s = r && r.globalConfig || c.globalCfg || {};
        n = t in s ? s[t] : void 0;
      }
    else {
      const s = r && r.config;
      n = s && t in s ? s[t] : void 0;
    }
  }
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", O();
}
function gs() {
  return Object.keys(c.draft).length;
}
async function ma() {
  try {
    const t = await fetch(D("/question-modal/prefs"), { headers: F() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    c.globalCfg = n && typeof n == "object" ? n : {};
    try {
      uc(c.globalCfg);
    } catch {
    }
    try {
      O();
    } catch {
    }
  } catch {
  }
}
async function Ks() {
  try {
    const t = await fetch(D("/question-modal/notify/channels"), {
      headers: F()
    });
    if (!t.ok) return;
    const e = await t.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off"), c.pcCurrent = String(e && e.pc_current || "off"), c.bgCurrent = String(e && e.bg_current || "off");
    try {
      O();
    } catch {
    }
  } catch {
  }
}
async function ga(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        D("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: F() }
      );
      if (!e.ok) return;
      const n = await e.json();
      c.notifyLog = {
        ...c.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        O();
      } catch {
      }
    } catch {
    }
}
async function Xl(t) {
  if (!t || t === "off") return;
  c.notifyTesting = t, c.notifyMsg = { ...c.notifyMsg, [t]: "发送中…" };
  try {
    O();
  } catch {
  }
  let e = "", n = null;
  try {
    n = await (await fetch(D("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...F(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: t })
    })).json().catch(() => ({})), n && n.delivered ? e = n.note ? "✓ 已发送（" + n.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (n && (n.error || n.reason) || "测试失败");
  } catch (a) {
    e = "✗ 请求失败：" + String(a && a.message || a);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await Ks(), r || await ga(t);
  try {
    O();
  } catch {
  }
}
async function Qs() {
  if (c.saving) return;
  const t = Object.keys(c.draft), e = c.scope === "session", n = {};
  if (t.forEach((r) => {
    n[r] = c.draft[r];
  }), !t.length && !e) {
    const r = c.globalCfg || {};
    Object.keys(r).forEach((a) => {
      a in n || (n[a] = r[a]);
    });
  }
  t.length, c.saving = !0, c.saveMsg = "", O();
  try {
    let r = "/question-modal/prefs", a = n;
    e && (r = "/question-modal/session-prefs", a = {
      chat_id: c.chatId,
      session_id: c.sessionId,
      agent_id: c.agentId,
      settings: n,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: c.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const s = await fetch(D(r), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(a)
    }), o = await s.json().catch(() => ({}));
    if (!s.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + s.status + "）", O();
      return;
    }
    const p = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (p.length) {
      c.saving = !1;
      const m = p.map((k) => `${k.key}：${k.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + m, O();
      return;
    }
    c.saving = !1, c.draft = {}, Ps();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const m = (x) => {
        try {
          const y = new Date(x * 1e3), I = (T) => T < 10 ? "0" + T : String(T);
          return y.getMonth() + 1 + "-" + I(y.getDate()) + " " + I(y.getHours()) + ":" + I(y.getMinutes()) + ":" + I(y.getSeconds());
        } catch {
          return "";
        }
      }, k = i.reduce(
        (x, y) => Math.max(x, Number(y && y.at) || 0),
        0
      ), g = i.map((x) => String(x && x.key || "")).filter(Boolean);
      c.conflictNote = "设置已于 " + m(k) + " 被其它位置修改，本次已按后写入的值覆盖" + (g.length ? "（" + g.join("、") + "）" : "") + "。";
    }
    try {
      const m = o && o.key_ts || {};
      m && typeof m == "object" && (c.keyTs = Object.assign({}, c.keyTs, m));
    } catch {
    }
    e || ma();
    const b = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let q = "";
    if (b && (q = e ? "session" : "default"), q === "default") {
      try {
        const m = await fetch(D("/question-modal/session-prefs"), {
          method: "POST",
          headers: F(),
          body: JSON.stringify({
            chat_id: c.chatId || "",
            session_id: c.sessionId || "",
            agent_id: c.agentId || "",
            // 2026-11-13 方案 D1（用户裁定）：切到默认模式**只打标记**，
            // 不删本会话的自定义项 —— 这样切回会话模式时数据原样恢复。
            //
            // 旧做法是 settings:{}（= 清空整条覆盖），实测会把会话里设过的
            // 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
            settings: {},
            set_scope: "default"
          })
        });
        m.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + m.status + "），本会话仍在会话模式。", q = "");
      } catch (m) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (m && m.message ? m.message : m) + "，本会话仍在会话模式。", q = "";
      }
      c.keyTs = {};
    }
    if (q && (c.scopeChoice = q, c.tab = q, c.scope = q === "session" ? "session" : "global"), q === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (q === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const m = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + m + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Vt(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((m) => {
      m && (c.cfg = m);
      try {
        O();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    c.saving = !1, c.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    O();
  } catch {
  }
}
function Vs() {
  c.draft = {}, c.saveMsg = "";
}
function Xs() {
  pa().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      O();
    } catch {
    }
  }).catch(() => {
  });
}
function Yl() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", O();
}
function ec(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", O());
}
function hs(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, O());
}
function tc() {
  c.tplEdit = null, O();
}
async function nc() {
  const t = c.tplEdit;
  if (!t || c.tplBusy) return;
  try {
    const a = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    a && typeof a.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((s) => {
      const o = a.querySelector('[data-qm-tpl-field="' + s + '"]');
      o && typeof o.value == "string" && o.value !== "" && (t[s] = o.value);
    });
  } catch {
  }
  const e = String(t.name || "").trim();
  if (!e) {
    c.saveMsg = "模板名称不能为空", O();
    return;
  }
  c.tplBusy = !0, O();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await Ls(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), O();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Xs(), O();
}
async function rc(t) {
  const e = c.templates.filter((a) => a.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await Bs(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), O();
    return;
  }
  c.saveMsg = "模板已删除", Xs(), O();
}
function ac() {
  c.visible = !0, c.chatId = "", c.sessionId = en(), c.cfg = null, c.cfgError = "", oc(), c.agentId = Jn || (() => {
    try {
      return ze().getSelectedAgentId ? ze().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Ps();
  const t = ++ms;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", O(), Ys(() => {
    if (t !== ms) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", O(), (c.tab === "global" || c.tab === "default") && ma(), Ks().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && ga(r);
    });
  });
}
let Qr = !1;
async function sc() {
  if (!Qr) {
    Qr = !0;
    try {
      const t = await Vt(
        "",
        !0,
        c.sessionId,
        c.agentId
      ), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      Qr = !1;
      try {
        O();
      } catch {
      }
    }
  }
}
let zn = !1;
function oc() {
  zn || (zn = !0, Promise.all([Rs(), pa()]).then((t) => {
    zn = !1;
    const e = t[0] || [], n = t[1] || {};
    c.providerGroups = e.map((r) => {
      const a = String(r && (r.id || r.provider_id) || ""), o = (r && r.models || []).concat(r && r.extra_models || []).filter(Boolean).map((p) => {
        const i = typeof p == "string" ? p : p && (p.name || p.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: a,
        name: String(r && (r.name || r.title) || a),
        models: o
      };
    }).filter((r) => r.id && r.models.length > 0), c.modelOptions = c.providerGroups.flatMap((r) => r.models.map((a) => r.id + ":" + a)), c.templates = (n.items || []).filter((r) => r && r.id), c.templateOptions = c.templates.map((r) => r.id);
    try {
      O();
    } catch {
    }
  }).catch(() => {
    zn = !1;
  }));
}
function ic(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let Vr = !1, An = "";
const Xr = [];
function Ys(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (Vr && An === n) {
    t && Xr.push(t);
    return;
  }
  Vr = !0, An = n;
  const r = () => {
    An === n && (Vr = !1, An = "");
    const a = Xr.splice(0);
    try {
      a.forEach((s) => s());
    } catch {
    }
  };
  t && Xr.push(t), Vt(
    e,
    !0,
    c.sessionId,
    c.agentId
  ).then((a) => {
    if (c.chatId !== e) {
      r();
      return;
    }
    if (a) {
      c.cfg = a, c.cfgError = "";
      const s = a.config && a.config.release_after_sec;
      c.stale.threshold = typeof s == "number" && isFinite(s) ? s : null;
    } else
      c.cfgError = "读取配置失败（后端不可达）", c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global");
    r();
    try {
      O();
    } catch {
    }
  }).catch(() => {
    c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global", c.cfgError = "读取配置失败（网络异常）"), r();
    try {
      O();
    } catch {
    }
  });
}
function O() {
  const t = ze().React, e = ze().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
        try {
          const n = Ve();
          n && n.Modal && typeof n.Modal.info == "function" && n.Modal.info({
            title: "问卷设置",
            centered: !0,
            width: 480,
            okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。"
          });
        } catch {
        }
        c.visible = !1;
      }
      return;
    }
    Ut || (Ut = document.createElement("div"), Ut.id = "qm-settings-root", document.body.appendChild(Ut)), e.render(t.createElement(bc, {
      R: t,
      open: c.visible,
      onClose: () => {
        if (gs() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Vs();
        }
        c.visible = !1, c.saveMsg = "", O();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = eo(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, O(), Ys(), (n === "global" || n === "default") && ma(), n === "stale" && sc();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: gs(),
      saving: c.saving,
      saveMsg: c.saveMsg,
      conflictNote: c.conflictNote,
      modelOptions: c.modelOptions,
      templateOptions: c.templateOptions,
      providerGroups: c.providerGroups,
      templates: c.templates,
      tplEdit: c.tplEdit,
      tplBusy: c.tplBusy,
      // ★ 漏传这一行 = 挂起清理页签永远空白（2026-11-15 实测缺陷）：
      //   组件读的是 props.stale，只更新 settingsState 不会触发可见变化。
      stale: c.stale
    }), Ut);
  }
}
function lc(t) {
  const { R: e, onOpen: n } = t, r = Ve(), a = r && r.Button, s = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, p = { title: s, "aria-label": s }, i = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className: "qm-entry-icon",
    style: {
      display: "block",
      boxShadow: "none",
      background: "none",
      flex: "0 0 auto"
    }
  }, h = e.createElement("svg", i, [
    e.createElement("path", {
      key: 1,
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }),
    e.createElement("polyline", { key: 2, points: "14 2 14 8 20 8" }),
    e.createElement("line", { key: 3, x1: 16, y1: 13, x2: 8, y2: 13 }),
    e.createElement("line", { key: 4, x1: 16, y1: 17, x2: 8, y2: 17 }),
    e.createElement("polyline", { key: 5, points: "10 9 9 9 8 9" })
  ]);
  return h ? a ? e.createElement(a, {
    type: "text",
    size: "small",
    style: o,
    onClick: n,
    title: p.title,
    "aria-label": p["aria-label"]
  }, h) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: p.title,
    "aria-label": p["aria-label"]
  }, h) : a ? e.createElement(
    a,
    { type: "text", size: "small", style: o, onClick: n },
    s
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    s
  );
}
const Yr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  // US-007：时段调度页签（位于「默认模式」之后）。本版仅 UI 展示，
  // 不接存储与生效逻辑（生效走读时计算，见需求可行性评估 需求一/四）。
  { key: "schedule", label: "时段调度", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
  // 2026-11-15 新增：挂起问卷清理。背景是 manual 问卷本该 30 分钟自动释放，
  // 但 release_survey 的 _reason UnboundLocalError 让 watchdog 释放失败，
  // 问卷永远停在 pending、对应会话一直 409。bug 已修，但历史残骸不会自愈
  // （pending 记录可能已丢失、只剩 survey_state；会话文件也早已不存在），
  // 所以需要一个能「先看清、再手动处置」的页签。
  { key: "stale", label: "问卷清理", hint: "" }
], eo = (t) => t === "session";
function cc(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function dc(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function bs(t, e, n, r) {
  const a = n === "pc" ? "notify_channel_pc" : "notify_channel_bg", s = c.notifyChannels || [], o = String(
    (n === "pc" ? c.pcCurrent : c.bgCurrent) || "off"
  ), p = String(de(a, "off", "global") || o || "off"), h = ((C) => s.filter((w) => String(w.channel) === C)[0])(p), b = s.filter((C) => n !== "bg" || String(C.channel) !== "browser").map((C) => {
    const w = String(C.channel || ""), P = String(C.label || w), S = C.ready !== !1, L = C.verified === !0 || w === "off";
    let N = "";
    return S ? L || (N = "（待测试）") : N = "（不可用）", { value: w, label: P + N, disabled: !S };
  });
  b.length || b.push({ value: "off", label: "关闭", disabled: !1 });
  const q = !h || h.ready !== !1, m = p !== "off" && p !== "browser", k = c.notifyTesting === p, g = h && h.last_test || null, x = c.notifyMsg[p] || "", y = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: p,
      "data-qm-notify-select": "1",
      "data-qm-notify-scene": n,
      style: { flex: "0 0 auto" },
      onChange: (C) => {
        const w = C && C.target ? String(C.target.value) : "off";
        te(a, w), ga(w);
      }
    }, b.map((C, w) => t.createElement("option", {
      key: "o" + w,
      value: C.value,
      disabled: !!C.disabled
    }, C.label)))
  ];
  if (m && q && y.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: k,
    "data-qm-notify-test": p,
    onClick: (C) => {
      C && C.stopPropagation && C.stopPropagation(), Xl(p);
    },
    style: {
      marginLeft: 8,
      padding: "2px 10px",
      fontSize: 12,
      border: "1px solid #d9d9d9",
      borderRadius: 4,
      background: "#fff",
      cursor: k ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, k ? "发送中…" : "测试")), h && h.ready === !1 && h.reason) {
    const C = h.reason_code === "missing_agent_id" || h.reason_code === "agent_not_found";
    y.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": h.reason_code || "",
      style: C ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, h.reason));
  }
  const I = !!(h && h.verified === !0), T = g || x, E = !!x;
  if (T || m && q && !k) {
    const C = g ? g.delivered === !0 : E ? x.indexOf("✓") === 0 : !1;
    let w;
    E ? w = x : g ? w = C ? "✓ 上次测试成功" + (g.note ? "（" + g.note + "）" : "") : "✗ " + (g.error || g.note || "上次测试失败") : w = "未测试";
    const P = g && g.at_text ? "  ·  " + g.at_text : "", S = T ? C ? "#52c41a" : "#ff4d4f" : "#faad14";
    y.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": T ? C ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": T && (C || I) ? "1" : "0",
      style: {
        flex: "1 1 240px",
        minWidth: 0,
        fontSize: 11,
        lineHeight: "16px",
        color: S,
        // 允许在任意位置断行：失败原因里有很长的中文句子与 URL 形态内容，
        // 不让它撑破容器（也不要 pre-wrap，那会拒绝折行）。
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }
    }, w + P));
  }
  return ge(
    t,
    n === "pc" ? "e5pc" : "e5bg",
    r,
    t.createElement("div", {
      key: "nc",
      // 2026-11-14 用户裁定（第 4 轮 UI 调整）：
      //   「下拉框应该左对齐，然后测试信息放到测试这一行」
      //
      // 上一版把「控件行」和「结果行」拆成上下两块，结果就独占一行并顶到
      // 边距上（截图里那行红字跨满整行）。现在全部收进**同一行**：
      //   下拉框 · 测试按钮 · 状态标签 · 结果文案
      // 空间不够时只让「结果文案」折行（flex-wrap），下拉框与按钮永远排在最左。
      //
      // ⚠️ 不要再包 `qm-set-select`（它带 justify-content:flex-end + 内边距），
      // 那正是上一版下拉框比说明文字缩进 43px 的原因（真机实测 x=79 vs 36）。
      style: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: "6px 8px",
        width: "100%",
        minWidth: 0
      }
    }, y),
    n === "pc" ? "PC 端打开问卷时提醒一次（仅人工模式）。后台场景自动改走下一行配置。" : "页面已关闭或切后台时提醒一次（仅人工模式）。无浏览器选项：页面不在，浏览器通知必然无效。",
    "global",
    e,
    !1,
    !0
  );
}
function ge(t, e, n, r, a, s, o, p, i) {
  const h = s || "global", b = dc(o || "global", h), q = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      cc(t, "sc", h),
      b && h === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    a ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, a) : null
  ], m = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, q),
    t.createElement("div", {
      className: "qm-set-rowctl" + (p ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, r)
  ];
  return t.createElement("div", {
    className: "qm-set-row" + (b ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": b ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, m);
}
function ys(t, e, n, r, a) {
  return t.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    n.map((s, o) => t.createElement("button", {
      key: "s" + o,
      type: "button",
      "data-qm-val": s,
      disabled: !a,
      className: "qm-set-segbtn" + (s === r ? " qm-set-segon" : "") + (a ? "" : " qm-set-ctrldis"),
      onClick: () => {
        a && a(s);
      }
    }, [
      t.createElement("span", { key: "t" }, s)
    ]))
  );
}
function In(t, e, n, r) {
  return t.createElement("div", {
    key: e,
    className: "qm-set-switch" + (n ? " qm-set-switch-on" : "") + (r ? "" : " qm-set-ctrldis"),
    "data-qm-on": n ? "1" : "0",
    role: "switch",
    // Self-drawn switch: without these the a11y tree reports an unchecked
    // switch regardless of the real state (observed in a real browser).
    "aria-checked": n ? "true" : "false",
    "aria-disabled": r ? "false" : "true",
    tabIndex: r ? 0 : -1,
    onClick: () => {
      r && r(!n);
    },
    onKeyDown: (a) => {
      if (!r) return;
      const s = a && a.key;
      (s === " " || s === "Enter") && (a.preventDefault(), r(!n));
    }
  }, [
    t.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function it(t, e, n, r, a) {
  if (r && r.length && a) {
    const s = r.map((o, p) => o && typeof o == "object" ? { value: String(o.value), label: String(o.label || o.value) } : { value: String(o), label: String(o) });
    return t.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      t.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: n,
        onChange: (o) => a(o && o.target ? o.target.value : "")
      }, s.map((o, p) => t.createElement("option", { key: "o" + p, value: o.value }, o.label)))
    ]);
  }
  return t.createElement("div", { className: "qm-set-select", key: e }, [
    t.createElement("span", { key: "t", className: "qm-set-selecttext" }, n),
    t.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function xs(t, e, n, r, a) {
  const s = ic(n), p = r.map((k) => k.id).indexOf(s.provider) >= 0 ? s.provider : "", i = p ? (r.filter((k) => k.id === p)[0] || { models: [] }).models : [], h = i.indexOf(s.model) >= 0 ? s.model : "", b = (k, g) => {
    a && a(k ? k + ":" + g : "");
  }, q = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: p,
    disabled: !a,
    title: "厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "", x = g ? (r.filter((y) => y.id === g)[0] || { models: [] }).models : [];
      b(g, g && x[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((k, g) => t.createElement(
    "option",
    { key: "g" + g, value: k.id },
    k.name === k.id ? k.id : k.name + "（" + k.models.length + "）"
  )))), m = t.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: h,
    disabled: !a || !p,
    title: p ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "";
      b(p, g);
    }
  }, p ? i.map((k, g) => t.createElement("option", { key: "m" + g, value: k }, k)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    q,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    m
  ]);
}
const pc = () => [
  { name: "工作时段", start: "09:00", end: "18:00", mode: "ai", chPc: "", chBg: "" },
  { name: "夜间值守", start: "22:00", end: "06:00", mode: "manual", chPc: "", chBg: "" }
];
let On = pc(), M = {
  enabled: !1,
  url: "",
  method: "post_json",
  tokenPos: "none",
  token: "",
  tokenSet: !1,
  mode: "basic",
  params: [],
  bodyTpl: ""
}, lt = null;
function Gt() {
  try {
    te("custom_api_params", M.params.map((t) => ({
      key: String(t.key || ""),
      value: String(t.value || ""),
      required: !!t.required
    })));
  } catch {
  }
}
function uc(t) {
  if (!t || typeof t != "object") return;
  M.enabled = !!t.custom_api_enabled, M.url = String(t.custom_api_url || ""), M.method = String(t.custom_api_method || "post_json"), M.tokenPos = String(t.custom_api_token_pos || "none"), M.mode = String(t.custom_api_mode || "basic"), M.bodyTpl = String(t.custom_api_body || ""), M.token = "", M.tokenSet = !!t.custom_api_token_set;
  const e = Array.isArray(t.custom_api_params) ? t.custom_api_params : [];
  M.params = e.filter((n) => n && typeof n == "object").map((n) => ({
    key: String(n.key || ""),
    value: String(n.value || ""),
    required: !!n.required
  }));
}
function fc() {
  const t = [];
  return String(M.url || "").trim() || t.push("请求地址"), M.mode === "advanced" ? String(M.bodyTpl || "").trim() || t.push("body 模板") : M.params.forEach((e) => {
    e.required && !String(e.value || "").trim() && t.push(String(e.key || "").trim() || "未命名参数");
  }), t;
}
function mc() {
  const t = {}, e = /* @__PURE__ */ new Set();
  return M.params.forEach((n, r) => {
    const a = String(n.key || "").trim();
    a && (t[a] !== void 0 ? (e.add(r), e.add(t[a])) : t[a] = r);
  }), e;
}
function gc(t) {
  return /^[A-Za-z_][A-Za-z0-9_.\-]*$/.test(t);
}
function ks(t, e) {
  let n = String(t || "");
  return ["title", "content", "count", "stamp", "token"].forEach((r) => {
    n = n.split("{{" + r + "}}").join(e[r] || "");
  }), n;
}
const $n = {
  title: "（问卷标题）",
  content: "「（问卷标题）」有 3 道题等你作答",
  count: "3",
  stamp: "来自智能体-2026-01-01 00:00:00",
  token: M.tokenSet || M.token ? "（已设置的 Token）" : "（未设置 Token）"
};
function hc(t, e, n, r, a) {
  const s = [], o = n === "session" ? "session" : "global", p = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, h = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒（默认）": 120,
    "300 秒": 300,
    "600 秒": 600
  }, b = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, q = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒": 120,
    "180 秒（默认）": 180,
    "300 秒": 300,
    "600 秒": 600
  }, m = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, k = a && a.templateOptions || [];
  a && a.modelOptions;
  const g = a && a.providerGroups || [], x = k.map((y) => {
    const I = c.templates.filter((T) => String(T.id) === String(y))[0];
    return { value: y, label: I && (I.name || I.id) || y };
  });
  if (e === "session") {
    const I = String(de("mode", "manual")) !== "recommend";
    if (s.push(ge(
      t,
      "s1",
      "答题模式",
      ys(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(de("mode", "manual"))] || "人工",
        (T) => te("mode", p[T] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), I) {
      s.push(ge(
        t,
        "s2",
        "默认模型",
        xs(
          t,
          "sel2",
          String(de("model_id", "")),
          g,
          (E) => te("model_id", E)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        Vl("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const T = String(de("template_id", "")) || x[0] && x[0].value || "";
      s.push(ge(
        t,
        "s3",
        "提示词模板",
        x.length ? it(
          t,
          "sel3",
          T,
          x,
          (E) => te("template_id", E)
        ) : it(t, "sel3", "默认六步思维链"),
        x.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), s.push(ge(
        t,
        "s4",
        "携带上下文",
        In(
          t,
          "s4sw",
          !!de("with_context", !1),
          (E) => te("with_context", E)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), s.push(ge(
        t,
        "s5",
        "并行分析各题",
        In(
          t,
          "s5sw",
          !!de("parallel", !1),
          (E) => te("parallel", E)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const T = String(de("mode", "manual", "global")) !== "recommend";
      s.push(ge(
        t,
        "a1",
        "默认答题模式",
        ys(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(de("mode", "manual", "global"))] || "人工",
          (E) => te("mode", p[E] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), T && (s.push(ge(
        t,
        "b1",
        "默认模型",
        xs(
          t,
          "sel2",
          String(de("model_id", "", "global")),
          g,
          (E) => te("model_id", E)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), s.push(ge(
        t,
        "b2",
        "提示词模板",
        x.length ? it(
          t,
          "sel3",
          String(de("template_id", "", "global")) || x[0].value,
          x,
          (E) => te("template_id", E)
        ) : it(t, "sel3", "默认六步思维链"),
        x.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), s.push(ge(
        t,
        "b3",
        "携带上下文",
        In(
          t,
          "s3",
          !!de("with_context", !1, "global"),
          (E) => te("with_context", E)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), s.push(ge(
        t,
        "b4",
        "并行分析各题",
        In(
          t,
          "s4",
          !!de("parallel", !1, "global"),
          (E) => te("parallel", E)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      s.push(bs(t, o, "pc", "PC 端打开时提醒频道")), s.push(bs(t, o, "bg", "后台运行时提醒频道"));
      const I = fc(), T = mc(), E = ($, _, Q, V) => t.createElement("div", { className: "qm-set-schedfield", key: $ }, [
        t.createElement(
          "span",
          { className: "qm-set-schedfieldlabel", key: "l" },
          _,
          V ? t.createElement("span", { key: "r", className: "qm-apireq" }, "*") : null
        ),
        Q
      ]), C = ($, _, Q) => t.createElement("div", { className: "qm-apisysrow", key: "sys-" + $ }, [
        t.createElement("span", { key: "n", className: "qm-apisysname" }, $),
        t.createElement("span", { key: "d", className: "qm-apisysval" }, _),
        t.createElement("span", { key: "t", className: "qm-apisystag" }, Q)
      ]), w = t.createElement("div", { className: "qm-apisysblock", key: "sysblock" }, [
        t.createElement(
          "div",
          { key: "h", className: "qm-set-schedfieldlabel" },
          "系统字段（自动携带，不可删除）"
        ),
        C("title", "{{title}}", "系统必传"),
        C("content", "{{content}}", "系统必传"),
        t.createElement(
          "div",
          {
            key: "tip",
            className: "qm-set-apinote",
            style: { marginTop: 4 }
          },
          "另有 {{count}} 题数、{{stamp}} 时间戳、{{token}} 可在参数值中引用。"
        )
      ]), P = M.params.map(($, _) => {
        const Q = !!String($.key || "").trim() && (!gc($.key) || T.has(_)), V = $.required && !String($.value || "").trim();
        return t.createElement("div", {
          key: "prow-" + _,
          className: "qm-apiparamrow" + (V ? " miss" : ""),
          "data-qm-api-paramrow": String(_)
        }, [
          t.createElement("input", {
            key: "k",
            type: "text",
            className: "qm-apipk" + (Q ? " bad" : ""),
            value: $.key,
            placeholder: "参数名",
            "data-qm-api-paramkey": String(_),
            title: T.has(_) ? "参数名重复" : Q ? "参数名只能包含字母、数字、下划线、点、连字符" : "对方 API 要求的参数名",
            onChange: (R) => {
              M.params[_].key = R && R.target ? String(R.target.value) : "", Gt(), O();
            }
          }),
          t.createElement("input", {
            key: "v",
            type: "text",
            className: "qm-apipv" + (V ? " bad" : ""),
            value: $.value,
            placeholder: "参数值，可写 {{title}}",
            "data-qm-api-paramvalue": String(_),
            title: V ? "必传参数不能为空" : "支持 {{title}} {{content}} {{count}} {{stamp}} {{token}}",
            onChange: (R) => {
              M.params[_].value = R && R.target ? String(R.target.value) : "", Gt(), O();
            }
          }),
          t.createElement("label", {
            key: "r",
            className: "qm-apireqbox",
            title: "勾选后此项为必传，为空时无法发送"
          }, [
            t.createElement("input", {
              key: "c",
              type: "checkbox",
              checked: !!$.required,
              "data-qm-api-paramreq": String(_),
              onChange: (R) => {
                M.params[_].required = !!(R && R.target && R.target.checked), Gt(), O();
              }
            }),
            "必填"
          ]),
          t.createElement("button", {
            key: "d",
            type: "button",
            className: "qm-apidel",
            title: "删除此行",
            "data-qm-api-paramdel": String(_),
            onClick: () => {
              M.params.splice(_, 1), Gt(), O();
            }
          }, "✕")
        ]);
      }), S = t.createElement("div", { key: "ptable" }, [
        t.createElement("div", { key: "head", className: "qm-apiparamhead" }, [
          t.createElement("span", { key: "k", style: { flex: "0 0 34%" } }, "参数名"),
          t.createElement("span", { key: "v", style: { flex: "1 1 auto" } }, "参数值"),
          t.createElement("span", { key: "r", style: { flex: "0 0 44px" } }, "必填"),
          t.createElement("span", { key: "d", style: { flex: "0 0 24px" } }, "")
        ]),
        ...P,
        t.createElement("button", {
          key: "add",
          type: "button",
          className: "qm-apiadd",
          "data-qm-api-paramadd": "1",
          title: "新增一行自定义参数",
          onClick: () => {
            if (M.params.length >= 20) {
              U("warning", "最多 20 个自定义参数");
              return;
            }
            M.params.push({ key: "", value: "", required: !1 }), Gt(), O();
          }
        }, "+ 新增参数行")
      ]), L = String(M.url || "").trim() || "（未填请求地址）";
      let N = "";
      if (M.mode === "advanced")
        N = ks(String(M.bodyTpl || ""), $n) || "（高级模式未填写 body 模板）";
      else {
        const $ = {
          title: $n.title,
          content: $n.content
        };
        M.params.forEach((_) => {
          const Q = String(_.key || "").trim();
          Q && ($[Q] = ks(String(_.value || ""), $n));
        }), N = JSON.stringify($, null, 2);
      }
      const J = t.createElement("div", { key: "preview" }, [
        t.createElement("div", { key: "l1", className: "qm-apipreviewlabel" }, "请求预览"),
        t.createElement(
          "pre",
          {
            key: "u",
            className: "qm-apipreview",
            "data-qm-api-preview": "url"
          },
          (String(M.method) === "get_query" ? "GET " : "POST ") + L
        ),
        String(M.method) === "get_query" ? null : t.createElement("pre", {
          key: "b",
          className: "qm-apipreview",
          "data-qm-api-preview": "body"
        }, N)
      ]), re = t.createElement("div", {
        key: "status",
        className: "qm-apistatus " + (I.length ? "miss" : "ok"),
        "data-qm-api-status": I.length ? "missing" : "ok"
      }, [
        t.createElement("span", { key: "i" }, I.length ? "⚠" : "✓"),
        t.createElement(
          "span",
          { key: "t" },
          I.length ? "还缺 " + I.length + " 项必传参数：" + I.join("、") : "必传项已填齐，可以测试发送"
        )
      ]), W = I.length === 0 && !!String(M.url || "").trim(), B = t.createElement("div", {
        key: "foot",
        className: "qm-set-apifoot",
        style: { flexDirection: "column", alignItems: "stretch", gap: 6 }
      }, [
        t.createElement("div", {
          key: "btnrow",
          style: { display: "flex", gap: 8, justifyContent: "flex-end" }
        }, [
          t.createElement("button", {
            key: "test",
            type: "button",
            className: "qm-set-apitest",
            "data-qm-api-test": "1",
            disabled: !W,
            style: W ? void 0 : { opacity: 0.45, cursor: "not-allowed" },
            title: W ? "按当前配置真实发送一次" : "还缺：" + I.join("、"),
            onClick: () => {
              W && (lt = { ok: !0, text: "正在发送…" }, O(), (async () => {
                try {
                  await Qs();
                  const _ = await (await fetch(D("/question-modal/notify/test"), {
                    method: "POST",
                    headers: F(),
                    body: JSON.stringify({ channel: "custom_api" })
                  })).json(), Q = !!(_ && (_.ok || _.delivered));
                  let V = "";
                  Q ? V = "发送成功" + (_ && _.http ? "（HTTP " + _.http + "）" : "") + (_ && _.elapsed_ms !== void 0 ? " · " + _.elapsed_ms + "ms" : "") : V = "发送失败：" + (_ && (_.reason || _.error) || "未知原因"), lt = { ok: Q, text: V };
                } catch ($) {
                  lt = { ok: !1, text: "发送失败：" + ($ && $.message || $) };
                }
                O();
              })());
            }
          }, "发送测试")
        ]),
        lt ? t.createElement("div", {
          key: "res",
          className: "qm-apitestres " + (lt.ok ? "ok" : "err"),
          "data-qm-api-testresult": lt.ok ? "ok" : "err"
        }, lt.text) : null
      ]);
      s.push(t.createElement("div", {
        className: "qm-set-schedcard qm-set-apicard",
        key: "apicard",
        "data-qm-api-card": "1"
      }, [
        // 顶行：标题 + 徽标 + 启用开关
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement(
            "span",
            { key: "t", className: "qm-set-apititle" },
            "自定义 API 通知",
            t.createElement("span", { key: "badge", className: "qm-set-apibadge" }, "自定义渠道")
          ),
          t.createElement("button", {
            type: "button",
            key: "sw",
            role: "switch",
            className: "qm-set-apiswitch" + (M.enabled ? " on" : ""),
            "data-qm-api-switch": "1",
            "aria-checked": M.enabled ? "true" : "false",
            title: M.enabled ? "已启用" : "已停用",
            onClick: () => {
              M.enabled = !M.enabled, te("custom_api_enabled", M.enabled), O();
            }
          }, t.createElement("span", { className: "qm-set-apiswitchdot", key: "dot" }))
        ]),
        // 图例：必传星号说明（boss 核心诉求的可视化入口）
        t.createElement(
          "div",
          {
            key: "legend",
            className: "qm-apilegend",
            "data-qm-api-legend": "1"
          },
          "标 ",
          t.createElement("span", { key: "s", className: "qm-apireq" }, "*"),
          " 为必传项，未填写时无法发送测试。"
        ),
        re,
        // URL
        E("furl", "请求地址", t.createElement("input", {
          key: "url",
          type: "text",
          className: "qm-set-input",
          value: M.url,
          placeholder: "https://…",
          "data-qm-api-url": "1",
          onChange: ($) => {
            M.url = $ && $.target ? String($.target.value) : "", te("custom_api_url", M.url), O();
          }
        }), !0),
        // 请求方法 + Token 位置
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          E("fmethod", "请求方法", t.createElement("select", {
            key: "method",
            className: "qm-set-native",
            value: M.method,
            "data-qm-api-method": "1",
            onChange: ($) => {
              M.method = $ && $.target ? String($.target.value) : "post_json", te("custom_api_method", M.method), O();
            }
          }, [
            t.createElement("option", { key: "p", value: "post_json" }, "POST（JSON）"),
            t.createElement("option", { key: "g", value: "get_query" }, "GET（query 传参）")
          ])),
          E("ftpos", "Token 位置（可选）", t.createElement("select", {
            key: "tp",
            className: "qm-set-native",
            value: M.tokenPos,
            "data-qm-api-tokenpos": "1",
            onChange: ($) => {
              M.tokenPos = $ && $.target ? String($.target.value) : "none", te("custom_api_token_pos", M.tokenPos), O();
            }
          }, [
            t.createElement("option", { key: "n", value: "none" }, "不携带 token"),
            t.createElement("option", { key: "b", value: "bearer" }, "Authorization: Bearer 头"),
            t.createElement("option", { key: "q", value: "query" }, "query 参数 token=…")
          ]))
        ]),
        // Token
        E(
          "ftoken",
          M.tokenSet ? "Token（已设置，留空则不修改）" : "Token（可选）",
          t.createElement("input", {
            key: "tk",
            type: "password",
            className: "qm-set-input",
            value: M.token,
            placeholder: M.tokenSet ? "已保存，留空则不修改" : "选填",
            "data-qm-api-token": "1",
            onChange: ($) => {
              M.token = $ && $.target ? String($.target.value) : "", M.token && te("custom_api_token", M.token), O();
            }
          })
        ),
        // 高级模式开关
        t.createElement("div", { key: "advrow", className: "qm-apiadvrow" }, [
          t.createElement("label", { key: "l", style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer"
          } }, [
            t.createElement("input", {
              key: "c",
              type: "checkbox",
              checked: M.mode === "advanced",
              "data-qm-api-advmode": "1",
              onChange: ($) => {
                M.mode = $ && $.target && $.target.checked ? "advanced" : "basic", te("custom_api_mode", M.mode), O();
              }
            }),
            "高级模式（自己写完整 body 模板）"
          ])
        ]),
        M.mode === "advanced" ? E("fbody", "body 模板", t.createElement("textarea", {
          key: "bd",
          className: "qm-apibody" + (I.indexOf("body 模板") >= 0 ? " bad" : ""),
          value: M.bodyTpl,
          placeholder: '{"msgtype":"text","text":{"content":"{{content}}"}}',
          "data-qm-api-body": "1",
          onChange: ($) => {
            M.bodyTpl = $ && $.target ? String($.target.value) : "", te("custom_api_body", M.bodyTpl), O();
          }
        }), !0) : null,
        // 系统字段（锁） + 自定义参数行（仅基础模式显示参数表）
        w,
        M.mode === "advanced" ? null : S,
        J,
        B
      ])), s.push(ge(
        t,
        "e6",
        "单题分析超时",
        it(
          t,
          "sel4",
          b[Number(de("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          ($) => te("model_timeout_sec", h[$] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), s.push(ge(
        t,
        "d4",
        "等待提示阈值",
        it(
          t,
          "sel5",
          m[Number(de("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          ($) => te("wait_hint_sec", q[$] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const K = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], Ie = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, ut = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, H = Number(de("gate_log_limit", 200, "global"));
      s.push(ge(
        t,
        "d5",
        "拦截记录",
        it(
          t,
          "sel6",
          ut[H] || "最近 200 条（默认）",
          K,
          ($) => te("gate_log_limit", Ie[$] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const y = c.templates, I = c.tplEdit;
    if (s.push(ge(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), y.length ? s.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      y.map((T, E) => {
        const C = !!T.builtin, P = (String(T.note || T.desc || "").trim() || String(T.system || T.system_prompt || T.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), S = P.length > 90 ? P.slice(0, 90) + "…" : P;
        return t.createElement("div", { className: "qm-set-item", key: "i" + E }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(T.name || T.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (C ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, C ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(T.id),
              onClick: () => {
                ec(String(T.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (C ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(T.id),
              disabled: C,
              title: C ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                C || rc(String(T.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, S)
        ]);
      })
    )) : s.push(t.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), s.push(t.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      t.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          Yl();
        }
      }, "＋ 新建模板")
    ])), I) {
      const T = (E, C, w, P, S) => {
        var L, N;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + C }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, E),
          w ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: P,
            "data-qm-tpl-field": C,
            placeholder: S,
            value: String(((L = c.tplEdit) == null ? void 0 : L[C]) || ""),
            onChange: (J) => hs(C, J && J.target ? J.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": C,
            placeholder: S,
            value: String(((N = c.tplEdit) == null ? void 0 : N[C]) || ""),
            onChange: (J) => hs(C, J && J.target ? J.target.value : "")
          })
        ]);
      };
      s.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (I.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          I.id ? "编辑模板：" + (I.name || I.id) : "新建模板"
        ),
        T("模板名称", "name", !1, 0, "如：简短结论版"),
        T(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        T(
          "用户提示词模板",
          "user_prompt",
          !0,
          5,
          "可用占位符：{question} {options} {context} {title} {index} {total} {type} {showIf}"
        ),
        t.createElement("div", { className: "qm-set-editorbtns", key: "b" }, [
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn qm-set-btnprimary",
            key: "save",
            "data-qm-tpl-save": "1",
            disabled: !!c.tplBusy,
            onClick: () => {
              nc();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              tc();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "schedule") {
    const y = [
      { value: "ai", label: "自动执行" },
      { value: "recommend", label: "只用推荐" },
      { value: "manual", label: "人工作答" }
    ], I = (C) => {
      const w = (c.notifyChannels || []).filter((P) => C !== "bg" || String(P.channel) !== "browser").map((P) => ({
        value: String(P.channel || ""),
        label: String(P.label || P.channel || "")
      }));
      return [{ value: "", label: "跟随全局" }].concat(w);
    }, T = (C, w, P) => {
      const S = On[C];
      S && (S[w] = P, O());
    }, E = (C, w) => {
      const P = (L, N, J) => {
        const re = {
          type: "time",
          key: L,
          value: N,
          style: { flex: "1 1 auto", minWidth: 0 },
          onChange: (W) => T(
            w,
            L,
            W && W.target ? String(W.target.value) : ""
          )
        };
        return re["data-qm-sched-" + J] = String(w), t.createElement("input", re);
      }, S = (L, N, J, re) => {
        const W = {
          key: L,
          className: "qm-set-native",
          value: N,
          onChange: (B) => T(
            w,
            L,
            B && B.target ? String(B.target.value) : ""
          )
        };
        return W["data-qm-sched-" + J] = String(w), t.createElement("select", W, re.map((B, K) => t.createElement("option", { key: "o" + K, value: B.value }, B.label)));
      };
      return t.createElement("div", {
        className: "qm-set-schedcard",
        key: "sc" + w,
        "data-qm-sched-card": String(w)
      }, [
        // 顶行：名称 + 删除按钮
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement("input", {
            key: "name",
            className: "qm-set-input qm-set-schedname",
            value: C.name,
            placeholder: "时段名称（如：工作时段）",
            "data-qm-sched-name": String(w),
            onChange: (L) => T(
              w,
              "name",
              L && L.target ? String(L.target.value) : ""
            )
          }),
          t.createElement("button", {
            type: "button",
            key: "del",
            className: "qm-set-scheddel",
            "data-qm-sched-del": String(w),
            title: "删除该时段（仅演示，不影响真实配置）",
            onClick: () => {
              On.splice(w, 1), O();
            }
          }, "删除")
        ]),
        // 中部网格：起止时间 / 答题方式 / PC 端渠道 / 后台渠道
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          t.createElement("div", { className: "qm-set-schedfield", key: "ftime" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "生效时间"),
            t.createElement("div", { className: "qm-set-schedtime", key: "t" }, [
              P("start", C.start, "start"),
              t.createElement("span", { key: "sep", className: "qm-set-schedtimesep" }, "至"),
              P("end", C.end, "end")
            ])
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fmode" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "答题方式"),
            S("mode", C.mode, "mode", y)
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fpc" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "PC 端通知渠道"),
            S("chPc", C.chPc, "pc", I("pc"))
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fbg" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "后台通知渠道"),
            S("chBg", C.chBg, "bg", I("bg"))
          ])
        ])
      ]);
    };
    s.push(t.createElement("div", {
      className: "qm-set-schednote",
      key: "schednote",
      "data-qm-sched-note": "1"
    }, [
      t.createElement(
        "div",
        { key: "t", className: "qm-set-schednotetitle" },
        "按时段为问卷自动切换执行方式与通知渠道："
      ),
      t.createElement(
        "div",
        { key: "d", className: "qm-set-schednotedesc" },
        "多个时段按配置顺序匹配，命中第一个即生效；起止时间支持跨零点（如 22:00 → 次日 06:00）；没有任何时段命中时，回落到当前会话 / 默认模式的配置。"
      ),
      t.createElement(
        "div",
        { key: "demo", className: "qm-set-schednotedemo" },
        "以下为界面预览（示例数据，本版不接后端，修改不会保存）。"
      )
    ])), s.push(t.createElement("div", {
      className: "qm-set-schedlist",
      key: "schedlist",
      "data-qm-sched-list": "1"
    }, On.map((C, w) => E(C, w)))), s.push(t.createElement("button", {
      type: "button",
      key: "schedadd",
      className: "qm-set-btn qm-set-btnnew qm-set-schedadd",
      "data-qm-sched-add": "1",
      title: "添加一组时段（仅演示，不会保存）",
      onClick: () => {
        On.push({ name: "", start: "", end: "", mode: "ai", chPc: "", chBg: "" }), O();
      }
    }, "＋ 添加时段"));
  } else if (e === "stale") {
    const y = c.stale, I = y && y.rows || [], T = y && y.exceeded || [], E = y && y.within || [], C = (y && y.blocking || []).length ? y.blocking : I.filter((W) => W && W.nature === "blocking"), w = (y && y.residual || []).length ? y.residual : I.filter((W) => W && W.nature !== "blocking"), P = C.filter(
      (W) => W && T.some(
        (B) => B.tool_call_id === W.tool_call_id
      )
    ), S = y ? y.threshold : null, L = na(S), N = S !== null && S <= 0, J = !!(y && (y.busy || y.thrBusy)) || P.length === 0 || N, re = !!(y && (y.busy || y.thrBusy)) || w.length === 0;
    if (s.push(t.createElement("div", {
      className: "qm-set-stalehead",
      key: "sh"
    }, [
      // ── 自动释放设置（P1-a）──────────────────────────────
      // ★ 2026-11-17（REQ-2026-0072 REQ-003 / TASK-007）：**改成草稿模式**。
      //
      //   改前是「改即保存」（下拉一变就 POST /prefs），而底部「保存」按钮
      //   绑的是 `cfgSave()` —— 它只读 `settingsState.draft`，这一页从不写
      //   draft，于是底部按钮**纯属摆设**，点下去还显示保存成功。
      //   这比"没加载"更能骗人（boss 报的「无保存」就是这么来的）。
      //
      //   改后与其它页签一致：下拉只改草稿，底部「保存」真正落盘。
      //
      // ★ 结构沿用全局配置页的 `.qm-set-row`（label 弹性列 + 控件 auto 列右对齐），
      //   不自己拼 flex。2026-11-15 用户反馈「挂起超时自动释放：这个文字与
      //   整体文字不一致」——上一版这里用了表格行网格 + 行内 fontSize:11px，
      //   既被窄列挤成两行，字号又与其它设置项（14px 标签 / 12px 说明）不符。
      t.createElement("div", {
        className: "qm-set-row qm-set-stalerowset",
        key: "thr"
      }, [
        t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, [
          t.createElement("span", { key: "t" }, "问卷阻塞超时自动释放"),
          t.createElement(
            "span",
            { className: "qm-set-rownote", key: "n" },
            N ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${L} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(y && y.thrBusy),
            value: S === null ? "" : String(S),
            onChange: (W) => {
              const B = Number(W.target.value);
              c.draft.release_after_sec = B, c.stale.threshold = B, c.stale.msgKind = "", c.stale.msg = "已选择「" + na(B) + "」，点下方「保存」后生效", O();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            S === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
            t.createElement("option", { key: "0", value: "0" }, "关闭（不自动释放）"),
            t.createElement("option", { key: "1800", value: "1800" }, "30 分钟（默认）"),
            t.createElement("option", { key: "3600", value: "3600" }, "1 小时"),
            t.createElement("option", { key: "14400", value: "14400" }, "4 小时"),
            t.createElement("option", { key: "28800", value: "28800" }, "8 小时")
          ])
        )
      ]),
      // 关闭状态必须醒目：代价是会话可能永久 409，只能在本页手动释放。
      //
      // ★ 分工（2026-11-15 改）：上一版这里、下方 hint、以及操作后的绿条
      //   **三处都在说"已关闭自动释放"**，同一句话重复三遍，把真正的信息
      //  （该怎么办）淹没了。现在只保留这一处橙色警示承担"状态 + 后果"，
      //   下方 hint 只讲通用说明（怎么做），不再重复状态。
      N ? t.createElement("div", {
        className: "qm-set-stalenote",
        key: "off",
        "data-qm-stale-off": "1",
        style: {
          fontSize: "12px",
          lineHeight: "1.6",
          padding: "8px 12px",
          borderRadius: "6px",
          background: "rgba(230,126,34,.1)",
          borderLeft: "3px solid #e67e22",
          color: "var(--app-text-primary,#1e293b)"
        }
      }, "已关闭自动释放：挂起问卷会一直保留，对应会话发新消息会持续 409，需在本页手动释放。") : null,
      t.createElement(
        "div",
        { className: "qm-set-stalehint", key: "h" },
        "挂起问卷会让对应会话一直处于「等待作答」状态（发新消息会 409）。先扫描、再按需释放；「终止会话」仅在问卷仍真正挂着时才有对象。"
      ),
      t.createElement("div", { className: "qm-set-stalebtns", key: "b" }, [
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "scan",
          "data-qm-stale-scan": "1",
          disabled: !!(y && y.busy),
          onClick: () => {
            cl();
          }
        }, y && y.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: J,
          title: N ? "自动释放已关闭，请逐条释放" : P.length ? `释放全部 ${P.length} 条已超阈值的阻塞问卷（观察期内 ${E.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            dl();
          }
        }, P.length ? `全部释放（阻塞·已超阈值 ${P.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: re,
          title: w.length ? `清理全部 ${w.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            pl();
          }
        }, w.length ? `全部清理（残留 ${w.length} 条）` : "全部清理")
      ])
    ])), y && y.msg && s.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": y.msgKind || "info"
    }, y.msg)), y && y.scanned && I.length === 0 && s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!y || !y.scanned) && (y && y.msg || s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), I.length) {
      const B = {};
      T.forEach((_) => {
        B[_.tool_call_id] = !0;
      });
      const K = (_, Q) => {
        if (!_) return;
        const V = () => {
          c.stale.copied = Q, O(), setTimeout(() => {
            c.stale.copied === Q && (c.stale.copied = "", O());
          }, 1600);
        };
        try {
          const R = typeof navigator < "u" ? navigator : null;
          if (R && R.clipboard && R.clipboard.writeText)
            R.clipboard.writeText(_).then(V, V);
          else {
            const ee = document.createElement("textarea");
            ee.value = _, document.body.appendChild(ee), ee.select(), document.execCommand("copy"), document.body.removeChild(ee), V();
          }
        } catch {
          V();
        }
      }, Ie = (_, Q) => {
        const V = !!_.terminable, R = !!B[_.tool_call_id], ee = Q === "blocking", ve = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const we = _.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${_.idle_text}，阈值 ${L}）${we}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && Ur([_.tool_call_id]);
        }, ne = !!(y && y.copied) && y.copied === _.tool_call_id, Oe = (we) => {
          const he = Number(we);
          if (!we || !isFinite(he) || he <= 0) return "-";
          try {
            return new Date(he * 1e3).toLocaleString();
          } catch {
            return "-";
          }
        }, ue = (we, he, je, Je) => t.createElement("div", { className: "qm-set-stalemetaitem", key: we }, [
          t.createElement("span", {
            className: "qm-set-stalemetalabel",
            key: "l"
          }, he),
          t.createElement("span", {
            className: "qm-set-stalemetavalue",
            key: "v",
            ...Je || {}
          }, je)
        ]);
        return t.createElement("div", {
          className: "qm-set-stalecard",
          key: _.tool_call_id + ":" + Q,
          "data-qm-stale-row": _.tool_call_id,
          "data-qm-stale-nature": Q,
          "data-qm-stale-group": R ? "exceeded" : "within"
        }, [
          t.createElement("div", { className: "qm-set-stalecardhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-stalecardtitle", key: "t" },
              _.title || "(无标题)"
            ),
            // 把「它是什么性质/为什么没被自动释放」直接写在卡上，省得翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              _.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : _.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : _.reason_code === "no-future" ? "无唤醒句柄" : _.reason_code === "future-done" ? "已结束未收尾" : R ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            _.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { color: "#e67e22" }
            }, "正在作答") : null,
            _.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl"
            }, "模型分析中") : null
          ]),
          t.createElement("div", { className: "qm-set-stalecardmeta", key: "m" }, [
            ue("agent", "归属", _.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            ue(
              "sid",
              "会话 ID",
              ne ? "✓ 会话 ID 已复制" : _.session_id || "-",
              {
                title: ne ? "已复制到剪贴板" : _.session_id ? "点击复制完整会话 ID：" + _.session_id : "",
                style: _.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: ne ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": _.tool_call_id,
                onClick: () => {
                  K(String(_.session_id || ""), _.tool_call_id);
                }
              }
            ),
            ue("tcid", "问卷 ID", _.tool_call_id || "-"),
            ue("idle", "挂起时长", _.idle_text || "-"),
            ue("created", "发起时间", Oe(_.created_at)),
            ue("mode", "作答模式", _.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...ee ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": _.tool_call_id,
                disabled: !!(y && y.busy),
                title: R ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  R ? Ur([_.tool_call_id]) : ve();
                }
              }, R ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": _.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(y && y.busy) || !V,
                title: V ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  ul([_.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": _.tool_call_id,
                disabled: !!(y && y.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  Ur([_.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, ut = (_, Q, V, R, ee) => {
        if (!R || !R.length) return null;
        const ve = Math.max(1, Math.ceil(R.length / 5)), ne = Math.min(
          Math.max(0, Number(y[ee]) || 0),
          ve - 1
        ), Oe = R.slice(
          ne * 5,
          ne * 5 + 5
        ), ue = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": _
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": _
            }, Q),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, V)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": _
          }, Oe.map((we) => Ie(we, _)))
        ];
        if (ve > 1) {
          const we = (je) => {
            c.stale[ee] = je, O();
          }, he = (je, Je, ft, Et) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: Et,
            "data-qm-stale-page": String(Je),
            disabled: ft,
            onClick: () => {
              we(Je);
            }
          }, je);
          ue.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": _
          }, [
            he("上一页", ne - 1, ne <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(ne + 1)
            }, `第 ${ne + 1} / ${ve} 页（共 ${R.length} 条，每页 5 条）`),
            he("下一页", ne + 1, ne >= ve - 1, "next")
          ]));
        }
        return ue;
      }, H = ut(
        "blocking",
        `🔴 正在阻塞会话（${C.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        C,
        "page"
      ), $ = ut(
        "residual",
        `⚪ 异常残留（${w.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        w,
        "resPage"
      );
      H && s.push(...H), $ && s.push(...$);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, s);
}
function bc(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const a = Ve(), s = a && a.Modal, o = !t.tab, p = t.tab || "", i = eo(p) ? "session" : "global", h = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Yr.map((K) => e.createElement("button", {
      key: K.key,
      type: "button",
      className: "qm-set-tab" + (!o && K.key === p ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(K.key);
        } catch {
        }
      }
    }, K.label))
  ), b = Yr.filter((K) => K.key === p)[0] || Yr[0], q = !!(t.cfg && t.cfg.has_session), m = q ? "session" : "default", k = q ? "会话模式" : "默认模式", g = e.createElement("div", {
    className: "qm-set-runtime-wrap",
    key: "rtw",
    "data-qm-runtime-wrap": "1",
    title: "本会话实际生效的配置层（有会话覆盖→会话模式，无→默认模式）"
  }, [
    e.createElement("span", {
      className: "qm-set-runtime-label",
      key: "rtl"
    }, "当前模式："),
    // 纯展示元素（div 而非 button）：不可点、无 onClick、无 hover。
    // 用 div 而不是 disabled button，避免被当成"禁用控件"而显得可点。
    e.createElement("div", {
      className: "qm-set-runtime",
      key: "rt",
      "data-qm-runtime": m,
      "data-qm-scope-badge": m
    }, k)
  ]), x = e.createElement("button", {
    key: "close",
    type: "button",
    className: "qm-set-close",
    "data-qm-close": "1",
    title: "关闭",
    "aria-label": "关闭设置",
    onClick: () => {
      try {
        r();
      } catch {
      }
    }
  }, "✕"), y = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      g,
      x
    ])
  ]), I = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, T = null, E = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((K) => e.createElement("div", {
    key: "sk" + K,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: K * 0.15 + "s"
    }
  }))) : null, C = o ? E : hc(e, p, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), w = t.dirtyCount || 0, P = String(t.tab || ""), S = P === "session" || P === "default";
  let L;
  P === "schedule" ? L = "时段调度为界面预览（本版不保存，现有配置不受影响）" : S ? L = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : L = P === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const N = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      w ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + w + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, L)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      w > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          Vs(), O();
        }
      }, "撤销") : null,
      e.createElement("button", {
        key: "save",
        type: "button",
        className: "qm-set-btn qm-set-btnprimary",
        "data-qm-save": "1",
        // 保存始终可点（用户裁定 2026-11-12）：即使无未保存修改，也允许
        // 把当前值固化到目标作用域；只有请求进行中才禁用。
        disabled: !!t.saving,
        onClick: () => {
          Qs();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), J = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, re = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, W = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    T,
    I,
    C,
    J,
    re
  ]), B = e.createElement("div", { className: "qm-set-wrap" }, [
    y,
    h,
    W,
    N
  ]);
  return s ? e.createElement(s, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    // 关闭入口在头部行内（.qm-set-close，见 head）。这里必须保持 null：
    // antd 默认 closeIcon 绝对定位在弹窗角落，会与「当前模式」胶囊挤在一起
    //（boss 2026-11-15 反馈的位置问题），且会与头部按钮形成双 ✕。
    closeIcon: null,
    onCancel: r,
    destroyOnClose: !0,
    // 小屏适配（2026-11-13 用户反馈）：固定 680 在窄屏会贴边/溢出。
    // min() 让宽度随视口收缩，92vw 两侧各留 4% 呼吸位。
    width: "min(680px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-set-modal"
  }, B) : e.createElement("div", {
    className: "qm-set-wrap qm-set-fallback",
    "data-qm-fallback": "1",
    style: {
      position: "fixed",
      left: "50%",
      top: "8%",
      transform: "translateX(-50%)",
      width: "min(680px, 92vw)",
      maxWidth: "92vw",
      zIndex: 1200,
      padding: 16,
      borderRadius: 12,
      background: "var(--app-bg-elevated,#fff)",
      border: "1px solid var(--app-border-subtle,rgba(127,127,127,0.35))",
      boxShadow: "0 8px 28px rgba(0,0,0,0.18)"
    }
  }, [
    // Close button, wired to the SAME handler as Modal's onCancel so the
    // unsaved-edit confirmation still applies.
    e.createElement("button", {
      key: "close",
      type: "button",
      className: "qm-set-fallbackclose",
      "data-qm-fallback-close": "1",
      title: "关闭",
      "aria-label": "关闭设置",
      onClick: () => {
        try {
          r();
        } catch {
        }
      }
    }, "✕"),
    B
  ]);
}
function yc(t) {
  try {
    const e = t && t.sender, n = ze().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(lc, {
      R: n,
      onOpen: () => {
        ac();
      }
    });
    e.addPrefix(Is, r, {
      id: "question-modal.settings-btn",
      order: fs
    }), console.log("[question-modal] settings entry registered (order " + fs + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function xc() {
  const t = Di();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return Hi(), t.toolRender(Is, ts, Ql), console.log("[question-modal] registered via chat.toolRender for", ts), yc(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!xc()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
