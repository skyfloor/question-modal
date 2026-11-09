var Zo = Object.defineProperty;
var ns = (r) => {
  throw TypeError(r);
};
var Qo = (r, e, t) => e in r ? Zo(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var D = (r, e, t) => Qo(r, typeof e != "symbol" ? e + "" : e, t), Xo = (r, e, t) => e.has(r) || ns("Cannot " + t);
var rs = (r, e, t) => e.has(r) ? ns("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var tn = (r, e, t) => (Xo(r, e, "access private method"), t);
function ur() {
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
let Ue = ur();
function qs(r) {
  Ue = r;
}
const Es = /[&<>"']/, Yo = new RegExp(Es.source, "g"), Is = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Ko = new RegExp(Is.source, "g"), Vo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, ss = (r) => Vo[r];
function ie(r, e) {
  if (e) {
    if (Es.test(r))
      return r.replace(Yo, ss);
  } else if (Is.test(r))
    return r.replace(Ko, ss);
  return r;
}
const ea = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function ta(r) {
  return r.replace(ea, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const na = /(^|[^\[])\^/g;
function M(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (s, o) => {
      let a = typeof o == "string" ? o : o.source;
      return a = a.replace(na, "$1"), t = t.replace(s, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function os(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const At = { exec: () => null };
function as(r, e) {
  const t = r.replace(/\|/g, (o, a, c) => {
    let i = !1, y = a;
    for (; --y >= 0 && c[y] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), n = t.split(/ \|/);
  let s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), e)
    if (n.length > e)
      n.splice(e);
    else
      for (; n.length < e; )
        n.push("");
  for (; s < n.length; s++)
    n[s] = n[s].trim().replace(/\\\|/g, "|");
  return n;
}
function nn(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let s = 0;
  for (; s < n && r.charAt(n - s - 1) === e; )
    s++;
  return r.slice(0, n - s);
}
function ra(r, e) {
  if (r.indexOf(e[1]) === -1)
    return -1;
  let t = 0;
  for (let n = 0; n < r.length; n++)
    if (r[n] === "\\")
      n++;
    else if (r[n] === e[0])
      t++;
    else if (r[n] === e[1] && (t--, t < 0))
      return n;
  return -1;
}
function is(r, e, t, n) {
  const s = e.href, o = e.title ? ie(e.title) : null, a = r[1].replace(/\\([\[\]])/g, "$1");
  if (r[0].charAt(0) !== "!") {
    n.state.inLink = !0;
    const c = {
      type: "link",
      raw: t,
      href: s,
      title: o,
      text: a,
      tokens: n.inlineTokens(a)
    };
    return n.state.inLink = !1, c;
  }
  return {
    type: "image",
    raw: t,
    href: s,
    title: o,
    text: ie(a)
  };
}
function sa(r, e) {
  const t = r.match(/^(\s+)(?:```)/);
  if (t === null)
    return e;
  const n = t[1];
  return e.split(`
`).map((s) => {
    const o = s.match(/^\s+/);
    if (o === null)
      return s;
    const [a] = o;
    return a.length >= n.length ? s.slice(n.length) : s;
  }).join(`
`);
}
class un {
  // set by the lexer
  constructor(e) {
    D(this, "options");
    D(this, "rules");
    // set by the lexer
    D(this, "lexer");
    this.options = e || Ue;
  }
  space(e) {
    const t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0)
      return {
        type: "space",
        raw: t[0]
      };
  }
  code(e) {
    const t = this.rules.block.code.exec(e);
    if (t) {
      const n = t[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : nn(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = sa(n, t[3] || "");
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: s
      };
    }
  }
  heading(e) {
    const t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (/#$/.test(n)) {
        const s = nn(n, "#");
        (this.options.pedantic || !s || / $/.test(s)) && (n = s.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(e) {
    const t = this.rules.block.hr.exec(e);
    if (t)
      return {
        type: "hr",
        raw: t[0]
      };
  }
  blockquote(e) {
    const t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = t[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`);
      n = nn(n.replace(/^ *>[ \t]?/gm, ""), `
`);
      const s = this.lexer.state.top;
      this.lexer.state.top = !0;
      const o = this.lexer.blockTokens(n);
      return this.lexer.state.top = s, {
        type: "blockquote",
        raw: t[0],
        tokens: o,
        text: n
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim();
      const s = n.length > 1, o = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      const a = new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let c = "", i = "", y = !1;
      for (; e; ) {
        let g = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let v = t[2].split(`
`, 1)[0].replace(/^\t+/, (A) => " ".repeat(3 * A.length)), m = e.split(`
`, 1)[0], q = 0;
        this.options.pedantic ? (q = 2, i = v.trimStart()) : (q = t[2].search(/[^ ]/), q = q > 4 ? 1 : q, i = v.slice(q), q += t[1].length);
        let h = !1;
        if (!v && /^ *$/.test(m) && (c += m + `
`, e = e.substring(m.length + 1), g = !0), !g) {
          const A = new RegExp(`^ {0,${Math.min(3, q - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), C = new RegExp(`^ {0,${Math.min(3, q - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), x = new RegExp(`^ {0,${Math.min(3, q - 1)}}(?:\`\`\`|~~~)`), _ = new RegExp(`^ {0,${Math.min(3, q - 1)}}#`);
          for (; e; ) {
            const T = e.split(`
`, 1)[0];
            if (m = T, this.options.pedantic && (m = m.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), x.test(m) || _.test(m) || A.test(m) || C.test(e))
              break;
            if (m.search(/[^ ]/) >= q || !m.trim())
              i += `
` + m.slice(q);
            else {
              if (h || v.search(/[^ ]/) >= 4 || x.test(v) || _.test(v) || C.test(v))
                break;
              i += `
` + m;
            }
            !h && !m.trim() && (h = !0), c += T + `
`, e = e.substring(T.length + 1), v = m.slice(q);
          }
        }
        o.loose || (y ? o.loose = !0 : /\n *\n *$/.test(c) && (y = !0));
        let b = null, I;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (I = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), o.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: I,
          loose: !1,
          text: i,
          tokens: []
        }), o.raw += c;
      }
      o.items[o.items.length - 1].raw = c.trimEnd(), o.items[o.items.length - 1].text = i.trimEnd(), o.raw = o.raw.trimEnd();
      for (let g = 0; g < o.items.length; g++)
        if (this.lexer.state.top = !1, o.items[g].tokens = this.lexer.blockTokens(o.items[g].text, []), !o.loose) {
          const v = o.items[g].tokens.filter((q) => q.type === "space"), m = v.length > 0 && v.some((q) => /\n.*\n/.test(q.raw));
          o.loose = m;
        }
      if (o.loose)
        for (let g = 0; g < o.items.length; g++)
          o.items[g].loose = !0;
      return o;
    }
  }
  html(e) {
    const t = this.rules.block.html.exec(e);
    if (t)
      return {
        type: "html",
        block: !0,
        raw: t[0],
        pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
        text: t[0]
      };
  }
  def(e) {
    const t = this.rules.block.def.exec(e);
    if (t) {
      const n = t[1].toLowerCase().replace(/\s+/g, " "), s = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", o = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: s,
        title: o
      };
    }
  }
  table(e) {
    const t = this.rules.block.table.exec(e);
    if (!t || !/[:|]/.test(t[2]))
      return;
    const n = as(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), o = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
`) : [], a = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === s.length) {
      for (const c of s)
        /^ *-+: *$/.test(c) ? a.align.push("right") : /^ *:-+: *$/.test(c) ? a.align.push("center") : /^ *:-+ *$/.test(c) ? a.align.push("left") : a.align.push(null);
      for (const c of n)
        a.header.push({
          text: c,
          tokens: this.lexer.inline(c)
        });
      for (const c of o)
        a.rows.push(as(c, a.header.length).map((i) => ({
          text: i,
          tokens: this.lexer.inline(i)
        })));
      return a;
    }
  }
  lheading(e) {
    const t = this.rules.block.lheading.exec(e);
    if (t)
      return {
        type: "heading",
        raw: t[0],
        depth: t[2].charAt(0) === "=" ? 1 : 2,
        text: t[1],
        tokens: this.lexer.inline(t[1])
      };
  }
  paragraph(e) {
    const t = this.rules.block.paragraph.exec(e);
    if (t) {
      const n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(e) {
    const t = this.rules.block.text.exec(e);
    if (t)
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        tokens: this.lexer.inline(t[0])
      };
  }
  escape(e) {
    const t = this.rules.inline.escape.exec(e);
    if (t)
      return {
        type: "escape",
        raw: t[0],
        text: ie(t[1])
      };
  }
  tag(e) {
    const t = this.rules.inline.tag.exec(e);
    if (t)
      return !this.lexer.state.inLink && /^<a /i.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: t[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: t[0]
      };
  }
  link(e) {
    const t = this.rules.inline.link.exec(e);
    if (t) {
      const n = t[2].trim();
      if (!this.options.pedantic && /^</.test(n)) {
        if (!/>$/.test(n))
          return;
        const a = nn(n.slice(0, -1), "\\");
        if ((n.length - a.length) % 2 === 0)
          return;
      } else {
        const a = ra(t[2], "()");
        if (a > -1) {
          const i = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + a;
          t[2] = t[2].substring(0, a), t[0] = t[0].substring(0, i).trim(), t[3] = "";
        }
      }
      let s = t[2], o = "";
      if (this.options.pedantic) {
        const a = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        a && (s = a[1], o = a[3]);
      } else
        o = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), is(t, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: o && o.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      const s = (n[2] || n[1]).replace(/\s+/g, " "), o = t[s.toLowerCase()];
      if (!o) {
        const a = n[0].charAt(0);
        return {
          type: "text",
          raw: a,
          text: a
        };
      }
      return is(n, o, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...s[0]].length - 1;
      let c, i, y = a, g = 0;
      const v = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (v.lastIndex = 0, t = t.slice(-1 * e.length + a); (s = v.exec(t)) != null; ) {
        if (c = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !c)
          continue;
        if (i = [...c].length, s[3] || s[4]) {
          y += i;
          continue;
        } else if ((s[5] || s[6]) && a % 3 && !((a + i) % 3)) {
          g += i;
          continue;
        }
        if (y -= i, y > 0)
          continue;
        i = Math.min(i, i + y + g);
        const m = [...s[0]][0].length, q = e.slice(0, a + s.index + m + i);
        if (Math.min(a, i) % 2) {
          const b = q.slice(1, -1);
          return {
            type: "em",
            raw: q,
            text: b,
            tokens: this.lexer.inlineTokens(b)
          };
        }
        const h = q.slice(2, -2);
        return {
          type: "strong",
          raw: q,
          text: h,
          tokens: this.lexer.inlineTokens(h)
        };
      }
    }
  }
  codespan(e) {
    const t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(n), o = /^ /.test(n) && / $/.test(n);
      return s && o && (n = n.substring(1, n.length - 1)), n = ie(n, !0), {
        type: "codespan",
        raw: t[0],
        text: n
      };
    }
  }
  br(e) {
    const t = this.rules.inline.br.exec(e);
    if (t)
      return {
        type: "br",
        raw: t[0]
      };
  }
  del(e) {
    const t = this.rules.inline.del.exec(e);
    if (t)
      return {
        type: "del",
        raw: t[0],
        text: t[2],
        tokens: this.lexer.inlineTokens(t[2])
      };
  }
  autolink(e) {
    const t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = ie(t[1]), s = "mailto:" + n) : (n = ie(t[1]), s = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: s,
        tokens: [
          {
            type: "text",
            raw: n,
            text: n
          }
        ]
      };
    }
  }
  url(e) {
    var n;
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let s, o;
      if (t[2] === "@")
        s = ie(t[0]), o = "mailto:" + s;
      else {
        let a;
        do
          a = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (a !== t[0]);
        s = ie(t[0]), t[1] === "www." ? o = "http://" + t[0] : o = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: s,
        href: o,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(e) {
    const t = this.rules.inline.text.exec(e);
    if (t) {
      let n;
      return this.lexer.state.inRawBlock ? n = t[0] : n = ie(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const oa = /^(?: *(?:\n|$))+/, aa = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, ia = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Nt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, la = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Ts = /(?:[*+-]|\d{1,9}[.)])/, As = M(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Ts).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), pr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, ca = /^[^\n]+/, fr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, da = M(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", fr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ua = M(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Ts).getRegex(), xn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", mr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, pa = M("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", mr).replace("tag", xn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), zs = M(pr).replace("hr", Nt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", xn).getRegex(), fa = M(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", zs).getRegex(), hr = {
  blockquote: fa,
  code: aa,
  def: da,
  fences: ia,
  heading: la,
  hr: Nt,
  html: pa,
  lheading: As,
  list: ua,
  newline: oa,
  paragraph: zs,
  table: At,
  text: ca
}, ls = M("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Nt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", xn).getRegex(), ma = {
  ...hr,
  table: ls,
  paragraph: M(pr).replace("hr", Nt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ls).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", xn).getRegex()
}, ha = {
  ...hr,
  html: M(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", mr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: At,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: M(pr).replace("hr", Nt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", As).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Cs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, ga = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Rs = /^( {2,}|\\)\n(?!\s*$)/, ba = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Ot = "\\p{P}\\p{S}", ya = M(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Ot).getRegex(), xa = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, ka = M(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Ot).getRegex(), va = M("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Ot).getRegex(), wa = M("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Ot).getRegex(), Sa = M(/\\([punct])/, "gu").replace(/punct/g, Ot).getRegex(), _a = M(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), qa = M(mr).replace("(?:-->|$)", "-->").getRegex(), Ea = M("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", qa).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), pn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ia = M(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", pn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ns = M(/^!?\[(label)\]\[(ref)\]/).replace("label", pn).replace("ref", fr).getRegex(), Os = M(/^!?\[(ref)\](?:\[\])?/).replace("ref", fr).getRegex(), Ta = M("reflink|nolink(?!\\()", "g").replace("reflink", Ns).replace("nolink", Os).getRegex(), gr = {
  _backpedal: At,
  // only used for GFM url
  anyPunctuation: Sa,
  autolink: _a,
  blockSkip: xa,
  br: Rs,
  code: ga,
  del: At,
  emStrongLDelim: ka,
  emStrongRDelimAst: va,
  emStrongRDelimUnd: wa,
  escape: Cs,
  link: Ia,
  nolink: Os,
  punctuation: ya,
  reflink: Ns,
  reflinkSearch: Ta,
  tag: Ea,
  text: ba,
  url: At
}, Aa = {
  ...gr,
  link: M(/^!?\[(label)\]\((.*?)\)/).replace("label", pn).getRegex(),
  reflink: M(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", pn).getRegex()
}, cr = {
  ...gr,
  escape: M(Cs).replace("])", "~|])").getRegex(),
  url: M(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, za = {
  ...cr,
  br: M(Rs).replace("{2,}", "*").getRegex(),
  text: M(cr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rn = {
  normal: hr,
  gfm: ma,
  pedantic: ha
}, vt = {
  normal: gr,
  gfm: cr,
  breaks: za,
  pedantic: Aa
};
class ye {
  constructor(e) {
    D(this, "tokens");
    D(this, "options");
    D(this, "state");
    D(this, "tokenizer");
    D(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Ue, this.options.tokenizer = this.options.tokenizer || new un(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: rn.normal,
      inline: vt.normal
    };
    this.options.pedantic ? (t.block = rn.pedantic, t.inline = vt.pedantic) : this.options.gfm && (t.block = rn.gfm, this.options.breaks ? t.inline = vt.breaks : t.inline = vt.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: rn,
      inline: vt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new ye(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new ye(t).inlineTokens(e);
  }
  /**
   * Preprocessing
   */
  lex(e) {
    e = e.replace(/\r\n|\r/g, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      const n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = []) {
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, i, y) => i + "    ".repeat(y.length));
    let n, s, o, a;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((c) => (n = c.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
        if (n = this.tokenizer.space(e)) {
          e = e.substring(n.raw.length), n.raw.length === 1 && t.length > 0 ? t[t.length - 1].raw += `
` : t.push(n);
          continue;
        }
        if (n = this.tokenizer.code(e)) {
          e = e.substring(n.raw.length), s = t[t.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + n.raw, s.text += `
` + n.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(n);
          continue;
        }
        if (n = this.tokenizer.fences(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.heading(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.hr(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.blockquote(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.list(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.html(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.def(e)) {
          e = e.substring(n.raw.length), s = t[t.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + n.raw, s.text += `
` + n.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[n.tag] || (this.tokens.links[n.tag] = {
            href: n.href,
            title: n.title
          });
          continue;
        }
        if (n = this.tokenizer.table(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.lheading(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (o = e, this.options.extensions && this.options.extensions.startBlock) {
          let c = 1 / 0;
          const i = e.slice(1);
          let y;
          this.options.extensions.startBlock.forEach((g) => {
            y = g.call({ lexer: this }, i), typeof y == "number" && y >= 0 && (c = Math.min(c, y));
          }), c < 1 / 0 && c >= 0 && (o = e.substring(0, c + 1));
        }
        if (this.state.top && (n = this.tokenizer.paragraph(o))) {
          s = t[t.length - 1], a && s.type === "paragraph" ? (s.raw += `
` + n.raw, s.text += `
` + n.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(n), a = o.length !== e.length, e = e.substring(n.raw.length);
          continue;
        }
        if (n = this.tokenizer.text(e)) {
          e = e.substring(n.raw.length), s = t[t.length - 1], s && s.type === "text" ? (s.raw += `
` + n.raw, s.text += `
` + n.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(n);
          continue;
        }
        if (e) {
          const c = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(c);
            break;
          } else
            throw new Error(c);
        }
      }
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(e, t = []) {
    let n, s, o, a = e, c, i, y;
    if (this.tokens.links) {
      const g = Object.keys(this.tokens.links);
      if (g.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(a)) != null; )
          g.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(a)) != null; )
      a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(a)) != null; )
      a = a.slice(0, c.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (y = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((g) => (n = g.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
        if (n = this.tokenizer.escape(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.tag(e)) {
          e = e.substring(n.raw.length), s = t[t.length - 1], s && n.type === "text" && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
          continue;
        }
        if (n = this.tokenizer.link(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(n.raw.length), s = t[t.length - 1], s && n.type === "text" && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
          continue;
        }
        if (n = this.tokenizer.emStrong(e, a, y)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.codespan(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.br(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.del(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.autolink(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (!this.state.inLink && (n = this.tokenizer.url(e))) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (o = e, this.options.extensions && this.options.extensions.startInline) {
          let g = 1 / 0;
          const v = e.slice(1);
          let m;
          this.options.extensions.startInline.forEach((q) => {
            m = q.call({ lexer: this }, v), typeof m == "number" && m >= 0 && (g = Math.min(g, m));
          }), g < 1 / 0 && g >= 0 && (o = e.substring(0, g + 1));
        }
        if (n = this.tokenizer.inlineText(o)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (y = n.raw.slice(-1)), i = !0, s = t[t.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
          continue;
        }
        if (e) {
          const g = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(g);
            break;
          } else
            throw new Error(g);
        }
      }
    return t;
  }
}
class fn {
  constructor(e) {
    D(this, "options");
    this.options = e || Ue;
  }
  code(e, t, n) {
    var o;
    const s = (o = (t || "").match(/^\S*/)) == null ? void 0 : o[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + ie(s) + '">' + (n ? e : ie(e, !0)) + `</code></pre>
` : "<pre><code>" + (n ? e : ie(e, !0)) + `</code></pre>
`;
  }
  blockquote(e) {
    return `<blockquote>
${e}</blockquote>
`;
  }
  html(e, t) {
    return e;
  }
  heading(e, t, n) {
    return `<h${t}>${e}</h${t}>
`;
  }
  hr() {
    return `<hr>
`;
  }
  list(e, t, n) {
    const s = t ? "ol" : "ul", o = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + s + o + `>
` + e + "</" + s + `>
`;
  }
  listitem(e, t, n) {
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
  table(e, t) {
    return t && (t = `<tbody>${t}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + t + `</table>
`;
  }
  tablerow(e) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e, t) {
    const n = t.header ? "th" : "td";
    return (t.align ? `<${n} align="${t.align}">` : `<${n}>`) + e + `</${n}>
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
  link(e, t, n) {
    const s = os(e);
    if (s === null)
      return n;
    e = s;
    let o = '<a href="' + e + '"';
    return t && (o += ' title="' + t + '"'), o += ">" + n + "</a>", o;
  }
  image(e, t, n) {
    const s = os(e);
    if (s === null)
      return n;
    e = s;
    let o = `<img src="${e}" alt="${n}"`;
    return t && (o += ` title="${t}"`), o += ">", o;
  }
  text(e) {
    return e;
  }
}
class br {
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
  link(e, t, n) {
    return "" + n;
  }
  image(e, t, n) {
    return "" + n;
  }
  br() {
    return "";
  }
}
class xe {
  constructor(e) {
    D(this, "options");
    D(this, "renderer");
    D(this, "textRenderer");
    this.options = e || Ue, this.options.renderer = this.options.renderer || new fn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new br();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new xe(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new xe(t).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, t = !0) {
    let n = "";
    for (let s = 0; s < e.length; s++) {
      const o = e[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[o.type]) {
        const a = o, c = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(a.type)) {
          n += c || "";
          continue;
        }
      }
      switch (o.type) {
        case "space":
          continue;
        case "hr": {
          n += this.renderer.hr();
          continue;
        }
        case "heading": {
          const a = o;
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, ta(this.parseInline(a.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const a = o;
          n += this.renderer.code(a.text, a.lang, !!a.escaped);
          continue;
        }
        case "table": {
          const a = o;
          let c = "", i = "";
          for (let g = 0; g < a.header.length; g++)
            i += this.renderer.tablecell(this.parseInline(a.header[g].tokens), { header: !0, align: a.align[g] });
          c += this.renderer.tablerow(i);
          let y = "";
          for (let g = 0; g < a.rows.length; g++) {
            const v = a.rows[g];
            i = "";
            for (let m = 0; m < v.length; m++)
              i += this.renderer.tablecell(this.parseInline(v[m].tokens), { header: !1, align: a.align[m] });
            y += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, y);
          continue;
        }
        case "blockquote": {
          const a = o, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = o, c = a.ordered, i = a.start, y = a.loose;
          let g = "";
          for (let v = 0; v < a.items.length; v++) {
            const m = a.items[v], q = m.checked, h = m.task;
            let b = "";
            if (m.task) {
              const I = this.renderer.checkbox(!!q);
              y ? m.tokens.length > 0 && m.tokens[0].type === "paragraph" ? (m.tokens[0].text = I + " " + m.tokens[0].text, m.tokens[0].tokens && m.tokens[0].tokens.length > 0 && m.tokens[0].tokens[0].type === "text" && (m.tokens[0].tokens[0].text = I + " " + m.tokens[0].tokens[0].text)) : m.tokens.unshift({
                type: "text",
                text: I + " "
              }) : b += I + " ";
            }
            b += this.parse(m.tokens, y), g += this.renderer.listitem(b, h, !!q);
          }
          n += this.renderer.list(g, c, i);
          continue;
        }
        case "html": {
          const a = o;
          n += this.renderer.html(a.text, a.block);
          continue;
        }
        case "paragraph": {
          const a = o;
          n += this.renderer.paragraph(this.parseInline(a.tokens));
          continue;
        }
        case "text": {
          let a = o, c = a.tokens ? this.parseInline(a.tokens) : a.text;
          for (; s + 1 < e.length && e[s + 1].type === "text"; )
            a = e[++s], c += `
` + (a.tokens ? this.parseInline(a.tokens) : a.text);
          n += t ? this.renderer.paragraph(c) : c;
          continue;
        }
        default: {
          const a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return n;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, t) {
    t = t || this.renderer;
    let n = "";
    for (let s = 0; s < e.length; s++) {
      const o = e[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[o.type]) {
        const a = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(o.type)) {
          n += a || "";
          continue;
        }
      }
      switch (o.type) {
        case "escape": {
          const a = o;
          n += t.text(a.text);
          break;
        }
        case "html": {
          const a = o;
          n += t.html(a.text);
          break;
        }
        case "link": {
          const a = o;
          n += t.link(a.href, a.title, this.parseInline(a.tokens, t));
          break;
        }
        case "image": {
          const a = o;
          n += t.image(a.href, a.title, a.text);
          break;
        }
        case "strong": {
          const a = o;
          n += t.strong(this.parseInline(a.tokens, t));
          break;
        }
        case "em": {
          const a = o;
          n += t.em(this.parseInline(a.tokens, t));
          break;
        }
        case "codespan": {
          const a = o;
          n += t.codespan(a.text);
          break;
        }
        case "br": {
          n += t.br();
          break;
        }
        case "del": {
          const a = o;
          n += t.del(this.parseInline(a.tokens, t));
          break;
        }
        case "text": {
          const a = o;
          n += t.text(a.text);
          break;
        }
        default: {
          const a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return n;
  }
}
class zt {
  constructor(e) {
    D(this, "options");
    this.options = e || Ue;
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
D(zt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var He, dr, $s;
class Ca {
  constructor(...e) {
    rs(this, He);
    D(this, "defaults", ur());
    D(this, "options", this.setOptions);
    D(this, "parse", tn(this, He, dr).call(this, ye.lex, xe.parse));
    D(this, "parseInline", tn(this, He, dr).call(this, ye.lexInline, xe.parseInline));
    D(this, "Parser", xe);
    D(this, "Renderer", fn);
    D(this, "TextRenderer", br);
    D(this, "Lexer", ye);
    D(this, "Tokenizer", un);
    D(this, "Hooks", zt);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var s, o;
    let n = [];
    for (const a of e)
      switch (n = n.concat(t.call(this, a)), a.type) {
        case "table": {
          const c = a;
          for (const i of c.header)
            n = n.concat(this.walkTokens(i.tokens, t));
          for (const i of c.rows)
            for (const y of i)
              n = n.concat(this.walkTokens(y.tokens, t));
          break;
        }
        case "list": {
          const c = a;
          n = n.concat(this.walkTokens(c.items, t));
          break;
        }
        default: {
          const c = a;
          (o = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && o[c.type] ? this.defaults.extensions.childTokens[c.type].forEach((i) => {
            const y = c[i].flat(1 / 0);
            n = n.concat(this.walkTokens(y, t));
          }) : c.tokens && (n = n.concat(this.walkTokens(c.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      const s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((o) => {
        if (!o.name)
          throw new Error("extension name required");
        if ("renderer" in o) {
          const a = t.renderers[o.name];
          a ? t.renderers[o.name] = function(...c) {
            let i = o.renderer.apply(this, c);
            return i === !1 && (i = a.apply(this, c)), i;
          } : t.renderers[o.name] = o.renderer;
        }
        if ("tokenizer" in o) {
          if (!o.level || o.level !== "block" && o.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const a = t[o.level];
          a ? a.unshift(o.tokenizer) : t[o.level] = [o.tokenizer], o.start && (o.level === "block" ? t.startBlock ? t.startBlock.push(o.start) : t.startBlock = [o.start] : o.level === "inline" && (t.startInline ? t.startInline.push(o.start) : t.startInline = [o.start]));
        }
        "childTokens" in o && o.childTokens && (t.childTokens[o.name] = o.childTokens);
      }), s.extensions = t), n.renderer) {
        const o = this.defaults.renderer || new fn(this.defaults);
        for (const a in n.renderer) {
          if (!(a in o))
            throw new Error(`renderer '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.renderer[c], y = o[c];
          o[c] = (...g) => {
            let v = i.apply(o, g);
            return v === !1 && (v = y.apply(o, g)), v || "";
          };
        }
        s.renderer = o;
      }
      if (n.tokenizer) {
        const o = this.defaults.tokenizer || new un(this.defaults);
        for (const a in n.tokenizer) {
          if (!(a in o))
            throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a))
            continue;
          const c = a, i = n.tokenizer[c], y = o[c];
          o[c] = (...g) => {
            let v = i.apply(o, g);
            return v === !1 && (v = y.apply(o, g)), v;
          };
        }
        s.tokenizer = o;
      }
      if (n.hooks) {
        const o = this.defaults.hooks || new zt();
        for (const a in n.hooks) {
          if (!(a in o))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], y = o[c];
          zt.passThroughHooks.has(a) ? o[c] = (g) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(o, g)).then((m) => y.call(o, m));
            const v = i.call(o, g);
            return y.call(o, v);
          } : o[c] = (...g) => {
            let v = i.apply(o, g);
            return v === !1 && (v = y.apply(o, g)), v;
          };
        }
        s.hooks = o;
      }
      if (n.walkTokens) {
        const o = this.defaults.walkTokens, a = n.walkTokens;
        s.walkTokens = function(c) {
          let i = [];
          return i.push(a.call(this, c)), o && (i = i.concat(o.call(this, c))), i;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return ye.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return xe.parse(e, t ?? this.defaults);
  }
}
He = new WeakSet(), dr = function(e, t) {
  return (n, s) => {
    const o = { ...s }, a = { ...this.defaults, ...o };
    this.defaults.async === !0 && o.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = tn(this, He, $s).call(this, !!a.silent, !!a.async);
    if (typeof n > "u" || n === null)
      return c(new Error("marked(): input parameter is undefined or null"));
    if (typeof n != "string")
      return c(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
    if (a.hooks && (a.hooks.options = a), a.async)
      return Promise.resolve(a.hooks ? a.hooks.preprocess(n) : n).then((i) => e(i, a)).then((i) => a.hooks ? a.hooks.processAllTokens(i) : i).then((i) => a.walkTokens ? Promise.all(this.walkTokens(i, a.walkTokens)).then(() => i) : i).then((i) => t(i, a)).then((i) => a.hooks ? a.hooks.postprocess(i) : i).catch(c);
    try {
      a.hooks && (n = a.hooks.preprocess(n));
      let i = e(n, a);
      a.hooks && (i = a.hooks.processAllTokens(i)), a.walkTokens && this.walkTokens(i, a.walkTokens);
      let y = t(i, a);
      return a.hooks && (y = a.hooks.postprocess(y)), y;
    } catch (i) {
      return c(i);
    }
  };
}, $s = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + ie(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(s) : s;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const We = new Ca();
function $(r, e) {
  return We.parse(r, e);
}
$.options = $.setOptions = function(r) {
  return We.setOptions(r), $.defaults = We.defaults, qs($.defaults), $;
};
$.getDefaults = ur;
$.defaults = Ue;
$.use = function(...r) {
  return We.use(...r), $.defaults = We.defaults, qs($.defaults), $;
};
$.walkTokens = function(r, e) {
  return We.walkTokens(r, e);
};
$.parseInline = We.parseInline;
$.Parser = xe;
$.parser = xe.parse;
$.Renderer = fn;
$.TextRenderer = br;
$.Lexer = ye;
$.lexer = ye.lex;
$.Tokenizer = un;
$.Hooks = zt;
$.parse = $;
$.options;
$.setOptions;
$.use;
$.walkTokens;
$.parseInline;
xe.parse;
ye.lex;
const Ms = "question-modal", cs = "question_modal", Yn = 3, ds = "gate-v2@2026.10.21";
function pe() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function Ra() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Ie() {
  return pe().antd || {};
}
function Na() {
  return pe().antdIcons || {};
}
const Oa = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Kn(r) {
  const e = Na();
  for (const t of Oa) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function $a() {
  try {
    const r = "question-modal-styles";
    if (document.getElementById(r)) return;
    const e = document.createElement("style");
    e.id = r, e.textContent = [
      // Match the composer input: 1px solid --app-border-strong, radius 12,
      // --app-surface-raised fill (see `.qwenpaw-sender-content` / `.ant-input`).
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
      ".qm-actions{flex:1 1 100%!important;flex-wrap:wrap!important;",
      "justify-content:flex-start!important;gap:6px!important}",
      // The analysis bubble was a fixed 460px, which cannot fit a phone.
      ".qm-bubble{width:auto!important;min-width:0!important;",
      "max-width:calc(100vw - 32px)!important}",
      // Footer keeps its four actions on one or two rows without squashing.
      ".qm-footer{flex-wrap:wrap!important;row-gap:8px!important}",
      "}",
      // ── 设置弹窗 / 页签 UI（2026-11-04）：中性色，全部走 CSS 变量 ──
      ".qm-set-wrap{font-size:13px;color:var(--app-text-primary,#1f2329);",
      "max-height:72vh;overflow-y:auto;scrollbar-width:none}",
      ".qm-set-wrap::-webkit-scrollbar{width:0;height:0;display:none}",
      ".qm-set-head{display:flex;align-items:center;justify-content:space-between;",
      "gap:12px;margin-bottom:10px}",
      ".qm-set-title{font-size:14px;font-weight:600;line-height:1.4}",
      ".qm-set-badge{font-size:11px;padding:2px 9px;border-radius:999px;",
      "background:var(--app-fill-subtle,rgba(127,127,127,0.14));",
      "color:var(--app-text-secondary,#4e5969);white-space:nowrap}",
      ".qm-set-tabs{display:flex;gap:2px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,0.28));",
      "margin-bottom:10px}",
      ".qm-set-tab{background:transparent;border:0;cursor:pointer;font-size:13px;line-height:1;",
      "padding:8px 14px;color:var(--app-text-secondary,#4e5969);",
      "border-bottom:2px solid transparent}",
      ".qm-set-tab:hover{color:var(--app-text-primary,#1f2329)}",
      ".qm-set-tabon{color:var(--app-text-primary,#1f2329);font-weight:600;",
      "border-bottom-color:var(--app-text-primary,#1f2329)}",
      ".qm-set-subhint{font-size:12px;color:var(--app-text-tertiary,#86909c);margin:0 0 12px 2px}",
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
      ".qm-set-editor{margin-top:12px;padding:10px;border-radius:8px;",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.28));",
      "background:var(--app-fill-subtle,rgba(127,127,127,.05))}",
      ".qm-set-editortitle{font-size:12px;font-weight:700;margin-bottom:8px;color:var(--app-text-primary,#1f2329)}",
      ".qm-set-field{margin-bottom:8px}",
      ".qm-set-fieldlabel{font-size:11px;color:var(--app-text-tertiary,#86909c);margin-bottom:3px}",
      ".qm-set-input,.qm-set-textarea{width:100%;box-sizing:border-box;font:inherit;font-size:12px;",
      "padding:5px 7px;border-radius:5px;border:1px solid var(--app-border-subtle,rgba(127,127,127,.35));",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1f2329);outline:none;resize:vertical}",
      ".qm-set-input:focus,.qm-set-textarea:focus{border-color:#1c6fd0}",
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
      ".qm-set-section{font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--app-text-tertiary,#86909c);margin:12px 0 5px;padding-bottom:3px;border-bottom:1px solid var(--app-border-subtle,rgba(127,127,127,.18))}",
      ".qm-set-section:first-child{margin-top:0}",
      // 全局页签的说明条（与橙色警示区分：这是中性的）
      ".qm-set-scopeglobalnote{margin:0 0 10px;padding:7px 10px;border-radius:7px;font-size:12px;line-height:1.5;color:var(--app-text-secondary,#4e5969);background:var(--app-fill-subtle,rgba(127,127,127,.08));border:1px solid var(--app-border-subtle,rgba(127,127,127,.24))}",
      ".qm-set-sesshint{font-size:11px;line-height:1.5;color:var(--app-text-tertiary,#86909c);margin-top:10px}",
      // ── 可交互控件 + 会话覆盖标识 ──
      ".qm-set-ctrldis{opacity:.45;pointer-events:none}",
      ".qm-set-segbtn{display:inline-flex;align-items:center;gap:4px}",
      ".qm-set-srcdot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#1c6fd0;flex:0 0 auto}",
      ".qm-set-srcdotsw{margin-left:4px}",
      ".qm-set-selectlive{display:inline-flex;align-items:center;gap:6px;padding:0}",
      ".qm-set-native{font:inherit;font-size:12px;line-height:1.4;padding:3px 4px;border-radius:5px;border:1px solid var(--app-border-subtle,rgba(127,127,127,.35));background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1f2329);outline:none;cursor:pointer}",
      ".qm-set-native:focus{border-color:#1c6fd0}",
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
      ".qm-set-dirty{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#a86400}",
      ".qm-set-dirtydot{width:6px;height:6px;border-radius:50%;background:#ff9d00}",
      ".qm-set-foot{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid var(--app-border-subtle,rgba(127,127,127,.28))}",
      ".qm-set-scopetarget{font-size:11px;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-btnprimary{background:var(--app-accent,#1c6fd0);color:#fff;border-color:transparent;font-weight:600}",
      ".qm-set-btnprimary:disabled{opacity:.45}",
      ".qm-set-saveMsg{margin-top:8px;padding:6px 9px;border-radius:6px;font-size:12px;line-height:1.5;color:#1a6b3c;background:rgba(52,168,83,.1);border:1px solid rgba(52,168,83,.3)}",
      ".qm-set-badgeon{background:rgba(28,111,208,.14);color:#1c6fd0;font-weight:600}",
      ".qm-set-badgeglobal{background:rgba(127,127,127,.12);color:var(--app-text-tertiary,#6b7280);font-weight:600}",
      ".qm-set-fallbackclose{position:absolute;top:8px;right:10px;width:24px;height:24px;line-height:1;border:0;border-radius:6px;background:transparent;color:inherit;font-size:14px;cursor:pointer;opacity:.6}",
      ".qm-set-fallbackclose:hover{opacity:1;background:rgba(127,127,127,.14)}",
      ".qm-set-fallback{position:fixed}",
      ".qm-set-tabbody{display:flex;flex-direction:column;gap:2px}",
      // ── 行布局：固定三列网格，彻底消除「控件宽度不同 → 每行错位」──
      // 之前是 flex + space-between：右侧控件从 34px（开关）到 220px（下拉）
      // 宽度差极大，导致 label 起始位置与控件右边界逐行漂移，看起来像"移位"。
      // 改成 grid 后 label 列定宽、控件列定宽并右对齐，任何页签都严格对齐。
      ".qm-set-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;",
      "column-gap:16px;padding:9px 2px;",
      "border-bottom:1px dashed var(--app-border-subtle,rgba(127,127,127,0.18))}",
      ".qm-set-row:last-child{border-bottom:0}",
      ".qm-set-rowlabel{display:flex;flex-direction:column;gap:3px;font-size:13px;",
      "min-width:0;color:var(--app-text-primary,#1f2329)}",
      ".qm-set-rownote{font-size:11px;color:var(--app-text-tertiary,#86909c);line-height:1.45}",
      // 控件列定宽右对齐：无论里面是开关还是下拉，右边界都落在同一条竖线上。
      ".qm-set-rowctl{display:flex;align-items:center;justify-content:flex-end;",
      "min-width:180px;flex-shrink:0}",
      // setRow 的第 8 个参数 wide=true 时给容器加这个类：内容需要整行宽度
      // 右对齐（双联动下拉），此时不能被 min-width 限制住。
      ".qm-set-rowctlwide{flex:1 1 auto;min-width:0;justify-content:flex-end}",
      ".qm-set-seg{display:inline-flex;border:1px solid var(--app-border-strong,rgba(127,127,127,0.45));",
      "border-radius:6px;overflow:hidden}",
      ".qm-set-segbtn{background:transparent;border:0;cursor:pointer;font-size:12px;padding:4px 10px;",
      "color:var(--app-text-secondary,#4e5969);",
      "border-right:1px solid var(--app-border-subtle,rgba(127,127,127,0.28))}",
      ".qm-set-segbtn:last-child{border-right:0}",
      ".qm-set-segon{background:var(--app-fill-subtle,rgba(127,127,127,0.16));",
      "color:var(--app-text-primary,#1f2329);font-weight:600}",
      ".qm-set-switch{width:34px;height:18px;border-radius:9px;cursor:pointer;position:relative;",
      "background:var(--app-fill-strong,rgba(127,127,127,0.32))}",
      ".qm-set-switch-on{background:var(--app-text-primary,#1f2329)}",
      ".qm-set-knob{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;",
      "background:#fff;transition:left .15s}",
      ".qm-set-switch-on .qm-set-knob{left:18px}",
      // 容器本身不画边框：真正的控件（<select> / 胶囊）自己带边框。
      // 之前内外各一层 border，视觉上就是「双边框」。
      // justify-content:flex-end 必须有：容器有 min-width:150px，而内部的
      // <select> 通常只有 ~120px，inline-flex 默认从左侧排布 → 选择框停在容器
      // 左边、右侧留出一段空白，视觉上就是「这一行没贴右」。
      ".qm-set-select{display:inline-flex;align-items:center;justify-content:flex-end;",
      "gap:6px;cursor:pointer;font-size:12px;",
      "border:0;background:transparent;padding:0;color:var(--app-text-primary,#1f2329);",
      "max-width:100%;min-width:150px;box-sizing:border-box}",
      // 只读展示态（无 <select>）由容器承担边框，且文本左对齐更自然。
      ".qm-set-select:not(.qm-set-selectlive){border:1px solid var(--app-border-strong,rgba(127,127,127,0.45));",
      "border-radius:6px;padding:4px 8px;justify-content:flex-start}",
      ".qm-set-selecttext{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-selectarrow{color:var(--app-text-tertiary,#86909c);font-size:10px}",
      ".qm-set-list{display:flex;flex-direction:column;gap:8px}",
      ".qm-set-item{border:1px solid var(--app-border-subtle,rgba(127,127,127,0.25));",
      "border-radius:8px;padding:9px 11px}",
      ".qm-set-itemhead{display:flex;align-items:center;gap:8px;margin-bottom:4px}",
      ".qm-set-itemname{font-size:13px;font-weight:600;color:var(--app-text-primary,#1f2329)}",
      ".qm-set-tag{font-size:11px;padding:1px 7px;border-radius:999px;",
      "background:var(--app-fill-subtle,rgba(127,127,127,0.14));color:var(--app-text-secondary,#4e5969)}",
      ".qm-set-tagbuiltin{background:var(--app-fill-subtle,rgba(127,127,127,0.24))}",
      ".qm-set-itemdesc{font-size:12px;line-height:1.6;color:var(--app-text-tertiary,#86909c)}",
      ".qm-set-toolbar{display:flex;gap:8px;margin-top:12px}",
      ".qm-set-btn{font-size:12px;padding:4px 14px;height:28px;cursor:pointer;border-radius:6px;",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45));background:transparent;",
      "color:var(--app-text-primary,#1f2329)}",
      ".qm-set-btn:hover{background:var(--app-fill-subtle,rgba(127,127,127,0.12))}",
      ".qm-set-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;",
      "color:var(--app-text-secondary,#4e5969)}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function B(r) {
  try {
    const e = pe();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let kn = "", Bs = "";
function yr(r, e) {
  r && (Bs = r), e && (kn = e);
}
function L() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = pe(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = kn), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function xr() {
  try {
    const e = pe();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : Bs;
}
function wt() {
  try {
    const r = pe(), e = typeof r.getSelectedAgentId == "function" && r.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return kn;
}
const Vn = {};
async function Ma(r, e, t) {
  if (typeof window > "u" || Vn[r]) return "skipped";
  try {
    const o = "qm:v1:notified:" + r;
    if (window.localStorage && window.localStorage.getItem(o) === "1")
      return Vn[r] = !0, "skipped";
    window.localStorage.setItem(o, "1");
  } catch {
  }
  Vn[r] = !0;
  const n = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((c) => {
      let i = !1;
      const y = (g) => {
        i || (i = !0, c(g));
      };
      try {
        const g = s.requestPermission((v) => y(v));
        g && typeof g.then == "function" && g.then(y).catch(() => y("denied"));
      } catch {
        y("denied");
      }
      setTimeout(() => y(s.permission || "denied"), 8e3);
    }) !== "granted" || s.permission !== "granted") return "inpage";
    const o = new s("问卷等待作答", { body: n, tag: "qm-" + r, renotify: !1 });
    return o.onclick = () => {
      try {
        window.focus();
      } catch {
      }
      try {
        o.close();
      } catch {
      }
    }, "system";
  } catch {
    return "inpage";
  }
}
function K(r) {
  const e = Ct(r);
  return e && e.session_id ? e.session_id : xr();
}
const er = 180, Ba = 20, Ls = 6e3, La = 60, Pa = 8;
function ja() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Da = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function us(r) {
  try {
    return String(r || "").replace(Da, "").length;
  } catch {
    return 0;
  }
}
function ps(r) {
  const e = ja();
  if (!e) return -1;
  let t = null;
  try {
    t = e.querySelector('[data-qm-card-id="' + r + '"]');
  } catch {
    return -1;
  }
  if (!t) return -1;
  let n = -1;
  try {
    n = us((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - us(t.textContent);
}
function Fa(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function Wa(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function fs(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: Ls });
      return;
    }
  } catch {
  }
  try {
    setTimeout(r, 0);
  } catch {
  }
}
const Ha = "qm:v1:analysis:global", Ua = "qm:v1:analysis:", Ja = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function St(r) {
  return r === "ai" || r === "recommend" ? r : "manual";
}
function Ga(r) {
  if (!r || typeof r != "object") return { ...Ja };
  const e = r.modelId !== void 0 ? r.modelId : r.model_id, t = r.withContext !== void 0 ? r.withContext : r.with_context;
  return {
    // Three-way mode.  Anything unrecognised (including legacy payloads that
    // only ever wrote "ai"/"manual") degrades to "manual" — the safe default
    // that never drives the form on its own.
    mode: r.mode === "ai" || r.mode === "recommend" ? r.mode : "manual",
    modelId: typeof e == "string" ? e : "",
    withContext: !!t,
    parallel: !!r.parallel
  };
}
function Za() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(Ua) === 0 && t !== Ha && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function Qa() {
  try {
    const r = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : Ga(e.prefs);
  } catch {
    return null;
  }
}
async function kr() {
  try {
    const r = await fetch(B("/question-modal/templates"), { headers: L() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function sn(r, e, t) {
  if (!r) return null;
  try {
    const n = await fetch(B("/question-modal/survey-action"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        tool_call_id: r,
        action: e,
        payload: t,
        origin: yn()
      })
    }), s = await n.json().catch(() => ({}));
    return n.ok ? {
      accepted: s.accepted !== !1,
      reason: String(s.reason || ""),
      state: s.state || null
    } : null;
  } catch {
    return null;
  }
}
async function Xa(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      B("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(r)),
      { headers: L() }
    );
    if (!e.ok) return null;
    const t = await e.json().catch(() => ({}));
    return !t || t.ok === !1 ? null : {
      found: !!t.found,
      rev: parseInt(t.rev || 0, 10) || 0,
      state: t.state || null
    };
  } catch {
    return null;
  }
}
function Ya(r, e) {
  if (!r) return () => {
  };
  let t = !1, n = null, s = 0, o = null, a = 0, c = !1, i = null;
  const y = (m) => {
    t || i === m || (i = m, e.onStatus(m));
  }, g = () => {
    if (!t)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, q = B("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(r) + "&since_rev=" + a, h = { headers: L() };
        m && (h.signal = m.signal), n = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(q, h).then(async (I) => {
          if (!I.ok || !I.body) {
            if (I.status === 404 || I.status === 501 || I.status === 405) {
              c = !0, y(!1);
              return;
            }
            throw new Error("HTTP " + I.status);
          }
          s = 0, y(!0);
          const A = I.body.getReader(), C = new TextDecoder();
          let x = "";
          const _ = () => {
            A.read().then(({ done: T, value: z }) => {
              if (T) {
                v();
                return;
              }
              x += C.decode(z, { stream: !0 });
              let w;
              for (; (w = x.indexOf(`

`)) >= 0; ) {
                const j = x.slice(0, w);
                x = x.slice(w + 2), j.split(`
`).forEach((R) => {
                  if (!R.startsWith("data: ")) return;
                  let Z = null;
                  try {
                    Z = JSON.parse(R.slice(6));
                  } catch {
                    return;
                  }
                  Z && (Z.kind === "snapshot" ? (a = Math.max(a, parseInt(Z.rev || 0, 10) || 0), e.onSnapshot(a, Z.state || null)) : Z.kind === "change" && (a = Math.max(a, parseInt(Z.rev || 0, 10) || 0), e.onChange(Z)));
                });
              }
              t || _();
            }).catch(() => {
              v();
            });
          };
          _();
        }).catch(() => {
          v();
        });
      } catch {
        v();
      }
  }, v = () => {
    if (t || c)
      return;
    y(!1), s = Math.min(s + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, s));
    o = setTimeout(g, m);
  };
  return g(), () => {
    if (t = !0, o)
      try {
        clearTimeout(o);
      } catch {
      }
    if (n)
      try {
        n();
      } catch {
      }
    i = null, e.onStatus(!1);
  };
}
async function tr(r, e, t) {
  try {
    return (await fetch(B("/question-modal/session-prefs"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        chat_id: "",
        // server resolves session_id → chat UUID
        session_id: e,
        agent_id: t,
        settings: r
      })
    })).ok;
  } catch {
    return !1;
  }
}
let Ps = null;
async function Rt(r, e, t, n) {
  const s = r || "", o = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(n || "");
  try {
    const a = B(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + o
    ), c = await fetch(a, { headers: L() });
    if (!c.ok) return null;
    const i = await c.json();
    if (!i || i.ok !== !0) return null;
    const y = {
      config: i.config || {},
      globalKeys: Array.isArray(i.global_keys) ? i.global_keys : [],
      version: typeof i.version == "number" ? i.version : 0,
      schema: Array.isArray(i.schema) ? i.schema : [],
      has_session: i.has_session === !0
    };
    return Ps = { chatId: s, at: Date.now(), data: y }, y;
  } catch {
    return null;
  }
}
function vr() {
  Ps = null;
}
async function js(r) {
  try {
    const e = await fetch(B("/question-modal/templates"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(r)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ds(r) {
  try {
    const e = await fetch(B("/question-modal/templates/" + encodeURIComponent(r)), {
      method: "DELETE",
      headers: L()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Fs() {
  try {
    const r = await fetch(B("/models"), { headers: L() });
    if (!r.ok) return [];
    const e = await r.json();
    return (Array.isArray(e) ? e : []).filter((n) => {
      const o = [...n.models || [], ...n.extra_models || []].length > 0, a = !!n.api_key || n.require_api_key === !1 || n.is_local || n.is_custom;
      return o && a;
    });
  } catch {
    return [];
  }
}
function Ka(r) {
  if (!r) return "";
  try {
    return String($.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function O(r, e) {
  try {
    const t = Ie().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const Fe = "__other__";
function ue(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function st(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function nr(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (t && t.has(s) || !Object.prototype.hasOwnProperty.call(n, s)) return;
    const o = e[s];
    !o || typeof o != "object" || !st(n[s]) && st(o) && (n[s] = { ...o });
  }), n;
}
function ms(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function hs(r, e) {
  if (!r || typeof r != "object") return "";
  const t = Array.isArray(r.per_question) ? r.per_question : [];
  if (!t.length) return "";
  const n = t.find((s) => Number(s && s.index) === Number(e)) || (t.length === 1 ? t[0] : null);
  return n ? String(n.choice === void 0 || n.choice === null ? "" : n.choice).trim() : "";
}
function Va(r, e, t) {
  if (!t.length) return !1;
  const n = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = ue(e), o = ke(e), a = n(s), c = n(o);
  return t.some((i) => {
    const y = n(i);
    return y ? !!(i === s || i === o || y === a || y === c || Math.min(y.length, a.length, c.length) >= 4 && (y.length >= 4 && (a.includes(y) || y.includes(a)) || y.length >= 4 && (c.includes(y) || y.includes(c)))) : !1;
  });
}
function V(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
let Ws = !0;
function mn(r, e) {
  const t = String(r && r.title || "").trim();
  return t || (Ws ? "第 " + (e + 1) + " 题" : "");
}
function ke(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function ei(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (o) => {
    o != null && o !== "" && t.add(String(o));
  }, s = r.options || [];
  if (V(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = s.find((i) => ue(i) === String(a));
      c && n(ke(c)), String(a) === Fe && e.other && n(e.other);
    });
  else {
    n(e.value);
    const o = s.find((a) => ue(a) === String(e.value));
    o && n(ke(o)), String(e.value) === Fe && e.other && n(e.other);
  }
  return t;
}
function ti(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const s = String(n);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const o of Array.from(e))
      if (o && (o.indexOf(s) !== -1 || s.indexOf(o) !== -1)) return !0;
    return !1;
  });
}
function Hs(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const s = parseInt(t[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === r.trim());
}
function Us(r, e, t) {
  const n = e[r], s = n && n.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const o of Object.keys(s)) {
    const a = Hs(o, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !Us(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !ti(s[o], ei(c, i))) return !1;
  }
  return !0;
}
function Ee(r, e) {
  const t = [];
  return r.forEach((n, s) => {
    Us(s, r, e) && t.push(s);
  }), t;
}
function ni(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function on(r) {
  return Array.isArray(r.questions);
}
function ri(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function si(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((s) => s && (s.text || s.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function oi(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function ai(r) {
  if (!r) return "";
  const e = String(r).split(`
`).map((n) => n.trim()).filter(Boolean);
  for (let n = e.length - 1; n >= 0; n--) {
    const s = e[n];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(s) && !/^\{/.test(s) && !/^\s*"skipped"/.test(s) && s.length < 400)
      return s.replace(/^【|】$/g, "").trim();
  }
  const t = String(r).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return t && t[1] && t[1] !== "timeout" ? t[1] : "";
}
function _t(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), o = String(e.skip_reason || "").trim();
    return (o ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${o}` : "已跳过本次问卷。") + `

` + dn(r);
  }
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((s) => {
    const o = t[s];
    if (!o || typeof o != "object") return;
    const a = Hs(s, r), c = a >= 0 ? r[a] : null, i = c ? V(c) === "single" ? "单选" : V(c) === "multi" ? "多选" : "问答" : "问答", y = c ? mn(c, a) : s;
    let g = o.value;
    if (Array.isArray(g) && (g = g.join("、")), o.other && (g = (g ? g + "、" : "") + o.other), o.skipped) {
      const v = String(o.skipped_by || ""), m = v === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : v === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      n.push(`- ${s} [${i}] ${y}${m}`);
    } else
      n.push(`- ${s} [${i}] ${y}：${g === "" || g == null ? "（空）" : g}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function ii(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      B("/question-modal/resolve") + "?" + t.toString(),
      { headers: L() }
    );
    if (!n.ok) return { kind: "error" };
    const s = await n.json();
    return s && yr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function qt(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      B("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function li(r) {
  try {
    const e = new FormData();
    e.append("file", r);
    const t = L();
    delete t["Content-Type"];
    const n = await fetch(
      B("/console/upload"),
      { method: "POST", headers: t, body: e }
    );
    if (!n.ok) {
      const o = await n.text().catch(() => "");
      let a = "HTTP " + n.status;
      try {
        const c = JSON.parse(o);
        c && c.detail && (a = c.detail);
      } catch {
      }
      return { ok: !1, error: `${r.name}: ${a}` };
    }
    const s = await n.json();
    return !s || !s.url ? { ok: !1, error: `${r.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(s.url), file_name: String(s.file_name || r.name), size: s.size }
    };
  } catch (e) {
    return { ok: !1, error: `${r.name}: ${e && e.message || e}` };
  }
}
const hn = "qm:v1:stash_att:", gs = 25 * 1024 * 1024, ln = /* @__PURE__ */ new Map(), cn = /* @__PURE__ */ new Map();
let gn = null, bn = 0, rr = null;
function bs() {
  const r = bn > 0;
  cn.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function ci() {
  if (rr) return rr;
  if (typeof document > "u" || !document.createElement) return null;
  let r = null;
  try {
    r = document.createElement("input");
  } catch {
    return null;
  }
  if (!r) return null;
  try {
    r.type = "file", r.multiple = !0, r.setAttribute("data-qm-file", "true"), r.style.display = "none";
  } catch {
  }
  r.onchange = async (e) => {
    let t = [];
    try {
      t = Array.from(e && e.target && e.target.files || []);
    } catch {
      t = [];
    }
    try {
      e && e.target && (e.target.value = "");
    } catch {
    }
    const n = gn;
    gn = null, !(!n || !t.length) && await Js(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return rr = r, r;
}
function di(r, e, t) {
  if (!r) {
    O("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  gn = { callId: r, target: e, key: t };
  const n = ci();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (gn = null);
}
async function Js(r, e, t, n) {
  bn += 1, bs();
  const s = [], o = [];
  try {
    for (const c of r) {
      if (c.size && c.size > gs) {
        o.push(`${c.name}: 文件过大（上限 ${Math.round(gs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await li(c);
      i.ok ? s.push(i.att) : o.push(i.error);
    }
  } finally {
    bn -= 1, bs();
  }
  const a = ln.get(e);
  if (s.length || o.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      O(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (a)
      try {
        a(s, c, n, o);
      } catch {
      }
    else s.length && ui(e, s, c, n);
  }
}
function ui(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const s = localStorage.getItem(hn + r), o = s ? JSON.parse(s) : [], a = (Array.isArray(o) ? o : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(hn + r, JSON.stringify(a));
    } catch {
    }
}
function pi(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(hn + r);
    if (!e) return [];
    localStorage.removeItem(hn + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function fi(r) {
  const e = r && r.clipboardData;
  if (!e) return [];
  let t = [];
  try {
    t = Array.from(e.files || []);
  } catch {
    t = [];
  }
  if (!t.length)
    try {
      t = Array.from(e.items || []).filter((n) => n && n.kind === "file").map((n) => n.getAsFile ? n.getAsFile() : null).filter((n) => !!n);
    } catch {
      t = [];
    }
  return t;
}
function mi(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function sr(r, e) {
  const t = e || K(r), n = Ct(r), s = n && n.request_id ? n.request_id : "";
  if (s)
    try {
      const o = await fetch(B("/question-modal/skip"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({ request_id: s, session_id: t || "" })
      });
      if (o.ok) {
        const a = await o.json().catch(() => ({}));
        return se(r), {
          ok: !0,
          released: !0,
          reason: a && a.orphan ? "orphan" : "skipped"
        };
      }
      if (o.status === 404)
        return se(r), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const o = await fetch(
        B("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: L() }
      );
      if (o.ok) {
        const a = await o.json().catch(() => ({})), c = a && typeof a.cancelled == "number" ? a.cancelled : 0;
        return se(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + o.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function ys(r) {
  if (!r) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      B("/console/chat/stop") + "?chat_id=" + encodeURIComponent(r),
      { method: "POST", headers: L() }
    );
    if (!e.ok) return { ok: !1, released: !1, reason: "http " + e.status };
    const t = await e.json().catch(() => ({}));
    return {
      ok: !0,
      released: !!t.stopped,
      reason: t && t.stopped ? "host-stop" : "gone"
    };
  } catch {
    return { ok: !1, released: !1, reason: "network" };
  }
}
async function hi() {
  try {
    const r = await fetch(
      B("/question-modal/pending"),
      { headers: L() }
    );
    if (!r.ok) return null;
    const e = await r.json(), t = e && e.items || [];
    if (!Array.isArray(t) || t.length !== 1) return null;
    const n = t[0];
    if (!n || !n.request_id) return null;
    const s = await fetch(
      B("/question-modal/resolve") + "?request_id=" + encodeURIComponent(n.request_id),
      { headers: L() }
    );
    if (!s.ok) return null;
    const o = await s.json();
    return o && yr(o.session_id, o.agent_id), o && o.found ? o : null;
  } catch {
    return null;
  }
}
const vn = "qm:v1:reqid:", gi = 3e4, bi = 45e3;
function se(r) {
  if (r)
    try {
      localStorage.removeItem(vn + r);
    } catch {
    }
}
function yi() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(vn) === 0 && r.push(o);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    r.forEach((s) => {
      let o = null;
      try {
        o = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        o = null;
      }
      !o || !o.request_id || !o.ts || Date.now() - o.ts > e ? localStorage.removeItem(s) : t.push(s);
    });
    const n = 50;
    if (t.length <= n) return;
    t.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, o) => s.ts - o.ts).slice(0, t.length - n).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
function xi(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(vn + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), yi();
    } catch {
    }
}
function Ct(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(vn + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (se(r), null) : t;
  } catch {
    return null;
  }
}
const wr = "qm:v1:state:";
function Tt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(wr + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function yn() {
  try {
    let r = sessionStorage.getItem("qm:v1:tab");
    return r || (r = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", r)), r;
  } catch {
    return "tab-anon";
  }
}
const Gs = yn(), xs = "qm:v1:sessionprefs-ping";
function je(r, e) {
  if (r)
    try {
      const n = { ...Tt(r) || {}, ...e, ts: Date.now(), origin: Gs };
      localStorage.setItem(wr + r, JSON.stringify(n)), ki();
    } catch {
    }
}
function ki() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(wr) === 0 && r.push(o);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    r.forEach((s) => {
      let o = null;
      try {
        o = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        o = null;
      }
      !o || !o.ts || Date.now() - o.ts > e ? localStorage.removeItem(s) : t.push(s);
    });
    const n = 80;
    if (t.length <= n) return;
    t.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, o) => s.ts - o.ts).slice(0, t.length - n).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
async function vi(r) {
  try {
    const e = await fetch(
      B("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && yr(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function wi(r, e, t, n) {
  const s = ["【用户提交的问卷答案】"], o = new Set(Ee(r, e));
  return r.forEach((a, c) => {
    if (!o.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let y = i.value;
    if (Array.isArray(y))
      y = y.filter((b) => b !== Fe).map((b) => {
        const I = (a.options || []).find((A) => ue(A) === String(b));
        return I ? ke(I) : b;
      }).join("、");
    else {
      const b = (a.options || []).find((I) => ue(I) === String(y));
      b && (y = ke(b)), String(i.value) === Fe && (y = "");
    }
    const g = V(a) === "single" ? "单选" : V(a) === "multi" ? "多选" : "问答", v = !!String(y || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), m = String(i.skipped_by || ""), q = i.skipped ? m === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : m === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : v ? y : "（未作答）";
    let h = `- q${c} [${g}] ${q}`;
    i.other && !i.skipped && (h += `（其他：${i.other}）`), i.attachments && i.attachments.length && (h += `（附件：${i.attachments.map((b) => b.file_name).join("、")}）`), s.push(h);
  }), t && s.push(`- 其他意见：${t}`), n && n.length && s.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), s.join(`
`);
}
function dn(r) {
  return r.map((e, t) => {
    const n = V(e) === "single" ? "单选" : V(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(ke).join("、");
    return `${t + 1}. [${n}] ${mn(e, t)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function or(r) {
  const { R: e, files: t, disabled: n, uploading: s, error: o, onPick: a, onRemove: c } = r, i = {
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
  }, y = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: n || s ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: n || s ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    t.map((g, v) => e.createElement(
      "span",
      { key: "att" + v, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: g.file_name
      }, g.file_name + (g.size ? "（" + mi(g.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          n || c(v);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: n || s,
      style: y,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, s ? "上传中…" : "📎 附件"),
    o ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + o) : null
  );
}
function Si(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: s,
    disabled: o,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: y
  } = r, v = Ie().Popover, m = [];
  t.forEach((w) => {
    [...w.models || [], ...w.extra_models || []].forEach((j) => {
      m.push({
        providerId: w.id,
        providerName: w.name || w.id,
        modelId: j.id,
        modelName: j.name || j.id,
        free: !!j.is_free
      });
    });
  });
  const q = m.find((w) => `${w.providerId}:${w.modelId}` === n), b = q ? q.modelName : n || "选择模型", I = q ? q.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", A = {
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
    cursor: o ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, C = m.filter((w) => w.free).length, x = m.length - C, _ = [];
  t.forEach((w) => {
    const j = [...w.models || [], ...w.extra_models || []].map((R) => ({
      providerId: w.id,
      providerName: w.name || w.id,
      modelId: R.id,
      modelName: R.name || R.id,
      free: !!R.is_free
    })).filter((R) => i === "free" ? R.free : !R.free);
    j.length && _.push({ id: w.id, name: w.name || w.id, models: j });
  });
  const T = (w, j) => e.createElement("button", {
    key: w,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === w ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === w ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === w ? 600 : 400,
      boxShadow: i === w ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => y(w)
  }, j), z = e.createElement(
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
      T("paid", "付费 🟡 " + x),
      T("free", "免费 🟢 " + C)
    ),
    _.length ? e.createElement("div", null, _.map((w, j) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: w.id,
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
          e.createElement("span", { style: { flex: 1 } }, w.name),
          e.createElement("span", { style: { fontWeight: 400 } }, w.models.length)
        ),
        w.models.map((R) => {
          const Z = `${R.providerId}:${R.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${R.providerId}:${R.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (Z ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: Z ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${R.providerId}:${R.modelId}`), c(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: j % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, R.modelName)
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
  return v ? e.createElement(v, {
    content: z,
    trigger: "click",
    open: a,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: A,
      disabled: o,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: I }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: A,
      disabled: o,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const w = m.find((j) => `${j.providerId}:${j.modelId}` !== n);
        w && s(`${w.providerId}:${w.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: I }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function _i(r) {
  const { R: e, mode: t, onChange: n, disabled: s } = r, o = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, a = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发任何模型请求：直接采用出题时已标注的推荐，自动填入、翻页、提交",
    manual: "由你手动作答"
  }, c = (i) => e.createElement("button", {
    key: i,
    type: "button",
    disabled: s,
    style: {
      height: 22,
      padding: "0 8px",
      fontSize: 11,
      borderRadius: 10,
      cursor: s ? "default" : "pointer",
      border: "none",
      whiteSpace: "nowrap",
      background: t === i ? "var(--app-accent, #ff7f16)" : "transparent",
      color: t === i ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
    },
    title: a[i],
    onClick: () => n(i)
  }, o[i]);
  return e.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: 2,
      borderRadius: 12,
      background: "var(--app-surface-subtle, rgba(127,127,127,0.08))",
      border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.2))"
    }
  }, c("ai"), c("recommend"), c("manual"));
}
function qi(r) {
  const { R: e, templates: t, value: n, open: s, onOpenChange: o, disabled: a, onSelect: c, onManage: i } = r, g = Ie().Popover, v = (t || []).find((I) => I.id === n), m = v ? v.name : "默认模板", q = {
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
    maxWidth: 160,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, h = e.createElement(
    "div",
    {
      style: {
        width: 240,
        maxHeight: "min(60vh, 320px)",
        overflowY: "auto",
        scrollbarWidth: "none"
      }
    },
    (t || []).map((I) => e.createElement(
      "div",
      {
        key: I.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (I.id === n ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: I.id === n ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          c(I.id), o(!1);
        }
      },
      e.createElement("span", {
        style: {
          fontSize: 12,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }
      }, I.name),
      I.builtin ? e.createElement("span", {
        style: {
          fontSize: 10,
          padding: "0 5px",
          borderRadius: 3,
          color: "var(--app-text-tertiary, inherit)",
          border: "1px solid var(--app-border-subtle, rgba(127,127,127,0.3))"
        }
      }, "内置") : null
    )),
    e.createElement("div", {
      style: {
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--app-accent, #1677ff)",
        borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))"
      },
      onClick: () => {
        o(!1), i();
      }
    }, "＋ 管理模板…")
  ), b = e.createElement(
    "button",
    {
      type: "button",
      style: q,
      disabled: a,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, m),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return g ? e.createElement(g, {
    content: h,
    trigger: "click",
    open: s,
    onOpenChange: o,
    placement: "bottomLeft"
  }, b) : b;
}
function Ei(r) {
  const { R: e, open: t, templates: n, value: s, edit: o, onEditChange: a, onClose: c, onSelect: i, onSave: y, onDelete: g } = r;
  if (!t) return null;
  const v = Ie(), { Input: m, Modal: q } = v, h = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  q || (h.position = "fixed", h.right = 24, h.top = 80, h.width = 420, h.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", h.zIndex = 1100, h.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const b = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, I = !!o, A = (x, _, T, z) => m && m.TextArea ? e.createElement(m.TextArea, {
    value: x,
    rows: T,
    placeholder: z,
    onChange: (w) => _(w && w.target ? w.target.value : "")
  }) : e.createElement("textarea", {
    value: x,
    rows: T,
    placeholder: z,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (w) => _(w && w.target ? w.target.value : ""),
    onChange: (w) => _(w && w.target ? w.target.value : "")
  }), C = e.createElement(
    "div",
    {
      style: h,
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
        I ? o.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: c }, "关闭")
    ),
    I ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      A(o.name || "", (x) => a({ ...o, name: x }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      A(o.system || "", (x) => a({ ...o, system: x }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      A(o.user || "", (x) => a({ ...o, user: x }), 6, "用户提示词模板"),
      e.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...b,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => y(o)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: b,
          onClick: () => a(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (n || []).map(
        (x) => e.createElement(
          "div",
          {
            key: x.id,
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
            x.name + (x.builtin ? "（内置）" : "") + (x.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: b,
            title: "设为本题使用",
            onClick: () => i(x.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => a({
              id: x.id,
              name: x.name,
              system: x.system,
              user: x.user
            })
          }, "编辑"),
          x.builtin ? null : e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => g(x.id)
          }, "删除")
        )
      ),
      e.createElement(
        "div",
        { style: { marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...b,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => a({ id: "", name: "", system: "", user: "" })
        }, "＋ 新建模板")
      )
    )
  );
  return q ? e.createElement(q, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    closeIcon: null,
    onCancel: c,
    destroyOnClose: !0,
    width: 620,
    zIndex: 1200,
    wrapClassName: "qm-tpl-modal"
  }, C) : C;
}
function Ii(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: s,
    mode: o,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: y,
    disabled: g,
    children: v,
    open: m,
    onOpenChange: q
  } = r, b = Ie().Popover, I = e.createElement("button", {
    type: "button",
    disabled: g,
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
      cursor: g ? "default" : "pointer"
    },
    title: o === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : o === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      q(!m);
    }
  }, t ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      I,
      n && m ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((_) => _.reasoning).join(`

`))) : null
    );
  const A = !!(n && (n.per_question || []).length), C = (_, T, z) => e.createElement("button", {
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
    onClick: T
  }, _), x = e.createElement(
    "div",
    {
      className: "qm-bubble",
      style: { width: 460, maxHeight: 460, overflow: "auto", fontSize: 13 }
    },
    t ? e.createElement(
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
    s ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, s) : null,
    n ? e.createElement(
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
        }, `${n.model_id || "默认模型"} · ${n.elapsed || 0}s`),
        // Only the answered, non-running state offers the two actions.
        A && !t ? e.createElement("button", {
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
              (y || a)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        A && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: A ? 6 : "auto",
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
            c(), q(!1);
          }
        }, "套用推荐") : null
      ),
      (n.per_question || []).map((_) => e.createElement(
        "div",
        { key: _.index, style: { marginBottom: 14 } },
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
          }, _.title),
          _.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + _.choice) : null,
          typeof _.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(_.confidence <= 1 ? _.confidence * 100 : _.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: Ka(_.reasoning || "") }
        })
      ))
    ) : t || s ? null : e.createElement(
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
      }, o === "ai" ? "本题尚未生成分析。" : "本题尚未分析。点击下方按钮，用所选模型分析本题并给出推荐。"),
      // Manual mode: analysis starts on an explicit press — opening the
      // bubble is a read-only action (REQ-001).
      C("开始分析", () => {
        try {
          a();
        } catch {
        }
      })
    ),
    // The「携带上下文」and 并行/串行 options live in the bubble footer, per the
    // user's request that context use be "放到按钮中".
    e.createElement("div", {
      style: {
        marginTop: 10,
        paddingTop: 8,
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
        fontSize: 12
      }
    }, v)
  );
  return e.createElement(b, {
    content: x,
    trigger: "click",
    open: m,
    onOpenChange: q,
    placement: "bottomRight"
  }, I);
}
function Ti(r) {
  const e = pe().React, t = Ie(), { Input: n, Button: s } = t, o = n.TextArea, a = r.data || {}, c = ni(a), i = ri(a), y = si(a), g = oi(y), v = g ? "" : y, m = c.questions || [], q = c.title || "问卷", h = Tt(i), [b, I] = e.useState(
    () => !!(h && h.answered) || !!v || g
  ), [A, C] = e.useState(""), [x, _] = e.useState(() => {
    const l = Ct(i);
    return l && l.request_id ? l.request_id : h && typeof h.reqId == "string" ? h.reqId : "";
  }), [T, z] = e.useState(
    () => h && typeof h.visStep == "number" && h.visStep >= 0 ? h.visStep : 0
  ), [w, j] = e.useState(
    () => h && typeof h.slowAt == "number" ? h.slowAt : 0
  ), [R, Z] = e.useState(
    () => h && typeof h.slowStep == "number" ? h.slowStep : -1
  ), [ge, fe] = e.useState(
    () => !!(h && h.slowFired === !0)
  ), [oe, Je] = e.useState(() => {
    const l = {};
    m.forEach((f, u) => {
      l[`q${u}`] = { type: V(f), value: V(f) === "multi" ? [] : "", other: "" };
    });
    const d = h && h.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((f) => {
      l[f] && (l[f] = { ...l[f], ...d[f] });
    }), l;
  }), [ot, Ks] = e.useState(
    () => h && typeof h.finalOther == "string" ? h.finalOther : ""
  ), [W, Te] = e.useState(!1), [Ae, wn] = e.useState(
    () => h && typeof h.releasedNote == "string" ? h.releasedNote : ""
  ), [at, it] = e.useState(
    () => h && typeof h.localResult == "string" ? h.localResult : ""
  ), [le, Ge] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(h && h.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(v || "")
  ), [ze, Ze] = e.useState(
    () => (h && typeof h.skipReason == "string" ? h.skipReason : "") || ai(v || "")
  ), [lt, _r] = e.useState(
    () => h && Array.isArray(h.finalOtherAtt) ? h.finalOtherAtt : []
  ), [$t, qr] = e.useState(
    () => !!(h && h.expanded)
  ), [Er, Mt] = e.useState(!1), Sn = e.useRef(0), [ce, Vs] = e.useState(
    () => h && typeof h.deadReason == "string" ? h.deadReason : ""
  ), [Re, ct] = e.useState(
    () => h && typeof h.gateBlocked == "string" ? h.gateBlocked : ""
  ), [Qe, _n] = e.useState(
    () => h && typeof h.submittedAt == "number" ? h.submittedAt : 0
  ), [qn, En] = e.useState(
    () => !!(h && h.pastSoft === !0)
  ), [dt, Bt] = e.useState(
    () => !!(h && h.waitRetired === !0)
  ), ut = e.useRef(
    !!(h && typeof h.submittedAt == "number" && h.submittedAt > 0 && Date.now() - h.submittedAt < er * 1e3)
  ), Ne = e.useRef(!1), Lt = e.useRef(!!(h && h.pastSoft === !0)), [In, eo] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), to = e.useRef(In), Ir = (l) => {
    to.current = l, eo(l);
  }, ae = (l, d) => {
    const f = In[l];
    return f ?? d;
  };
  Ws = !!ae("fallback_title", !0);
  const Tr = Math.max(30, Number(ae("wait_hint_sec", er)) || er), no = "manual", [G, Pt] = e.useState(no), [Ar, Tn] = e.useState(""), [Zi, ro] = e.useState(!1), [An, zn] = e.useState(!1), [Cn, Rn] = e.useState(!1), [so, oo] = e.useState([]), [zr, Nn] = e.useState(!1), [jt, Xe] = e.useState(null), [ao, Oe] = e.useState(""), [io, lo] = e.useState(!1), [co, uo] = e.useState(!1), [po, fo] = e.useState("paid"), Ce = e.useRef({}), ve = e.useRef({}), Ye = e.useRef(0), pt = e.useRef(null), [mo, Ke] = e.useState(0), [Cr, On] = e.useState([]), [$e, Dt] = e.useState(""), we = e.useRef($e);
  we.current = $e;
  const [ho, go] = e.useState(!1), [bo, Rr] = e.useState(!1), [yo, $n] = e.useState(null), [be, Nr] = e.useState(
    () => !!(h && h.autoPaused)
  ), xo = e.useRef(be);
  xo.current = be;
  const Ve = e.useRef(!1), Mn = e.useRef(0), Ft = e.useRef({}), [ko, vo] = e.useState(0), ft = e.useRef(/* @__PURE__ */ new Set()), mt = (l) => {
    l && ft.current.add(l);
  }, Wt = e.useRef({}), [wo, Ht] = e.useState(0), Me = e.useRef({}), [ht, So] = e.useState(!1), _o = e.useRef(!1);
  _o.current = ht, e.useRef(!1);
  const qo = async () => {
    try {
      const l = await Rt(
        "",
        !0,
        K(i),
        wt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      Ir(d), d.mode !== void 0 && Pt(St(d.mode)), typeof d.model_id == "string" && d.model_id && Tn(d.model_id), typeof d.with_context == "boolean" && zn(d.with_context), typeof d.parallel == "boolean" && Rn(d.parallel), Ke((f) => f + 1);
    } catch {
    }
  }, Or = e.useRef(!1), Ut = (l) => {
    if (l.mode !== void 0) {
      Pt(l.mode), tr(
        { mode: l.mode },
        K(i),
        wt()
      );
      try {
        localStorage.setItem(xs, Gs + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && Tn(l.modelId), l.withContext !== void 0 && zn(l.withContext), l.parallel !== void 0 && Rn(l.parallel), tr(d, K(i), wt()));
  }, $r = (l) => {
    !l || l === $e || (Dt(l), we.current = l, je(i, { templateId: l }), tr(
      { template_id: l },
      K(i),
      wt()
    ), Xe(null), Ce.current = {}, ve.current = {}, Ke((d) => d + 1));
  }, Eo = async (l) => {
    const d = await js({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      O("error", d.error || "保存失败");
      return;
    }
    On(d.items || []), $n(null), O("success", "模板已保存");
  }, Io = async (l) => {
    const d = await Ds(l);
    if (!d.ok) {
      O("warning", d.error || "删除失败");
      return;
    }
    On(d.items || []);
    const f = (d.items || []).map((u) => u.id);
    if (f.indexOf(we.current) === -1) {
      const u = f[0] || "";
      Dt(u), we.current = u, je(i, { templateId: u });
    }
    O("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === xs && qo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [b, i]), e.useEffect(() => {
    if (b) return;
    let l = !0;
    return Za(), (async () => {
      const [d, f, u, k] = await Promise.all([
        Fs(),
        Qa(),
        kr(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Rt(
          "",
          !0,
          K(i),
          wt()
        )
      ]);
      if (!l) return;
      if (oo(d), On(u.items), k && k.config) {
        const E = k.config;
        Ir(E), E.mode !== void 0 && Pt(St(E.mode)), typeof E.model_id == "string" && E.model_id && Tn(E.model_id), typeof E.with_context == "boolean" && zn(E.with_context), typeof E.parallel == "boolean" && Rn(E.parallel), typeof E.template_id == "string" && E.template_id && (Dt(E.template_id), we.current = E.template_id);
      }
      const S = u.items.map((E) => E.id);
      if (!we.current || S.indexOf(we.current) === -1) {
        const E = u.defaultId || S[0] || "";
        E && (Dt(E), we.current = E);
      }
      if (k && k.config) {
        const E = k.config;
        ro(E.__follow_active__ === !0);
      }
      Or.current = !0, Ke((E) => E + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    Ye.current = T;
  }, [T]);
  const Bn = async (l) => {
    if (zr) return;
    const d = T;
    Nn(!0), Oe("");
    const f = typeof AbortController < "u" ? new AbortController() : null;
    pt.current = f;
    try {
      const u = await fetch(B("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: x,
          tool_call_id: i,
          session_id: K(i),
          title: q,
          questions: m,
          model_id: Ar,
          mode: l,
          with_context: An,
          parallel: Cn,
          question_index: d,
          answers: oe,
          template_id: we.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(ae("model_timeout_sec", 120)) || 120
        }),
        signal: f ? f.signal : void 0
      }), k = await u.json().catch(() => ({})), S = k && k.analysis || null, E = S && S.error || k && k.error || "";
      k && k.cancelled || S && S.cancelled ? Oe("已终止分析。") : !u.ok || !k || k.ok === !1 || S && S.ok === !1 ? Oe(E || "分析失败（服务返回 " + u.status + "）") : S && (Ce.current[d] = S, ve.current[d] = !0, Ye.current === d && Xe(S), O("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      pt.current === f && f && f.signal.aborted || u && u.name === "AbortError" ? Oe("已终止分析。") : Oe("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      pt.current === f && (pt.current = null), Nn(!1), Me.current[d] = !0, Ht((u) => u + 1);
    }
  }, To = () => {
    const l = T;
    delete Ce.current[l], Xe(null), Oe(""), Bn("manual");
  }, et = (l) => {
    var f;
    const d = l !== void 0 ? l : Ye.current;
    try {
      fetch(B("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: x,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      sn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (f = pt.current) == null || f.abort();
    } catch {
    }
    Nn(!1);
  }, Ao = () => {
    et(), Oe("已终止分析。");
  }, zo = () => {
    be ? (Wt.current = {}, Me.current = {}, ve.current = {}, Ve.current = !1, Nr(!1), Ke((l) => l + 1), O("info", "已恢复自动答题")) : (et(), Nr(!0), O("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = Ce.current[T];
    Xe(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + T;
    let f = !0;
    return fetch(B("/question-modal/analysis") + d, { headers: L() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !f || !u || !u.found || !u.analysis || (Ce.current[T] = u.analysis, Ye.current === T && Xe(u.analysis));
    }).catch(() => {
    }), () => {
      f = !1;
    };
  }, [i, T]), e.useEffect(() => {
    b || Or.current && G === "ai" && ht && (!on(c) || !m.length || ve.current[T] || W || (ve.current[T] = !0, Bn("auto")));
  }, [
    b,
    G,
    i,
    mo,
    An,
    Cn,
    m,
    T,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    ht
  ]);
  const Co = () => {
    const l = jt && jt.per_question || [];
    if (!l.length) return;
    if (!l.some((f) => f.type === "multi" ? String(f.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(f.choice || "").trim().length > 0)) {
      O("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Je((f) => {
      const u = { ...f };
      return l.forEach((k) => {
        const S = `q${k.index}`;
        mt(S);
        const E = u[S] || { type: k.type, value: "", other: "" };
        if (k.type === "multi") {
          const ee = String(k.choice || "").split(/[、,，]/).map((U) => U.trim()).filter(Boolean);
          u[S] = { ...E, value: ee };
        } else
          u[S] = { ...E, value: k.choice || E.value };
      }), u;
    }), O("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Be = (l, d, f = !1) => {
    et(), Vs(l), Ge(!0), it(d), Mt(!1), I(!0), se(i), f && je(i, { backendReleased: !0 });
  }, Ro = async (l, d) => {
    const f = await sr(i, K(i));
    return f.ok ? (Be(l, d, f.released), !0) : (Mt(!0), Pn(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = Tt(i)) == null ? void 0 : d.answers;
    je(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: x,
      visStep: T,
      answers: nr(oe, l, ft.current),
      finalOther: ot,
      finalOtherAtt: lt,
      answered: b,
      skippedAll: le,
      expanded: $t,
      localResult: at,
      submittedAt: Qe,
      skipReason: ze,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: qn,
      waitRetired: dt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: w,
      slowStep: R,
      slowFired: ge,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: ce,
      gateBlocked: Re,
      releasedNote: Ae,
      autoPaused: be,
      templateId: $e
    });
  }, [
    i,
    x,
    T,
    oe,
    ot,
    lt,
    b,
    le,
    $t,
    at,
    Qe,
    ze,
    qn,
    dt,
    w,
    R,
    ge,
    ce,
    be,
    $e,
    Re,
    Ae
  ]), e.useEffect(() => {
    if (!b || !Qe || dt || !ut.current) return;
    let l = 0, d = !1, f = ps(i);
    const u = () => {
      if (d) return;
      const k = Math.floor((Date.now() - Qe) / 1e3);
      if (k >= Tr) {
        Ne.current = !0, Bt(!0);
        return;
      }
      if (!Ne.current) {
        const S = ps(i);
        S >= 0 && (f < 0 ? f = S : S - f >= Pa && (Ne.current = !0));
      }
      if (!Ne.current && k >= Ba && !Lt.current && (Lt.current = !0, En(!0)), Ne.current) {
        l = setTimeout(
          () => {
            d || Bt(!0);
          },
          Math.max(1e3, (Tr - k) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || fs(u);
      }, Ls);
    };
    return fs(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [b, Qe, dt]);
  const [Ln, Pn] = e.useState(!1), [jn, Mr] = e.useState(""), Br = (l, d, f) => {
    l.length && (d === "final" ? _r((u) => u.concat(l)) : Je((u) => {
      const k = f || `q${T}`;
      mt(k);
      const S = u[k] || { type: "text", value: "", other: "" };
      return { ...u, [k]: { ...S, attachments: (S.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, k, S, E) => {
      Br(u, k, S), E && E.length ? Mr(E.join("；")) : Mr("");
    }, d = (u) => Pn(u);
    ln.set(i, l), cn.set(i, d);
    const f = pi(i);
    return f.length && f.forEach((u) => Br([u.att], u.target, u.key)), Pn(bn > 0), () => {
      ln.get(i) === l && ln.delete(i), cn.get(i) === d && cn.delete(i);
    };
  }, [i, T]);
  const Dn = (l, d) => di(i, l, d), Fn = (l, d, f) => {
    const u = fi(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Js(u, i, d, f);
    }
  };
  e.useEffect(() => {
    if (!g || A) return;
    let l = !0;
    return qt(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && Ge(!0);
      const f = String(d.skip_reason || "").trim();
      f && Ze((u) => u || f), C(_t(m, d));
    }), () => {
      l = !1;
    };
  }, [g, i, A]), e.useEffect(() => {
    if (b || !i || v) return;
    let l = !0;
    return qt(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && Ge(!0);
      const f = String(d.skip_reason || "").trim();
      f && Ze((u) => u || f), C((u) => u || _t(m, d)), it(_t(m, d)), I(!0), se(i);
    }), () => {
      l = !1;
    };
  }, [i, b, v]), e.useEffect(() => {
    if (b) return;
    let l = !0, d = 0, f = 0, u = 0;
    Sn.current || (Sn.current = Date.now());
    let k = !!Ct(i), S = !1;
    const E = (N) => {
      !l || !N || !N.request_id || (k = !0, _(N.request_id), Mt(!1), f && (clearTimeout(f), f = 0), xi(
        i,
        N.request_id,
        N.session_id || xr(),
        N.agent_id
      ));
    }, ee = (N) => {
      l && (f && (clearTimeout(f), f = 0), u && (clearTimeout(u), u = 0), Ro(
        N,
        N === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, U = Ct(i), he = async () => {
      if (!U) return !1;
      const N = await vi(U.request_id);
      if (!l) return !0;
      if (N.kind === "found") {
        const J = N.data;
        return J.tool_call_id && i && J.tool_call_id !== i ? (se(i), !1) : (E(J), !0);
      }
      return N.kind === "orphan" ? (ee("orphan"), !0) : (N.kind === "absent" && se(i), !1);
    }, te = (N = !1) => {
      if (l) {
        if (d += 1, N) {
          if (!S) {
            S = !0, qt(i).then((F) => {
              if (l) {
                if (F) {
                  F.kind === "skipped" && !F.answers && Ge(!0);
                  const X = String(F.skip_reason || "").trim();
                  X && Ze((rt) => rt || X), C(_t(m, F)), it(_t(m, F)), I(!0), se(i);
                  return;
                }
                te(!0);
              }
            });
            return;
          }
          if (k) {
            ee("gone");
            return;
          }
          const J = Date.now() - (Sn.current || Date.now());
          if (d >= 12 && J >= bi) {
            ee("gone");
            return;
          }
        }
        f = setTimeout(en, d < 8 ? 700 : 5e3);
      }
    }, _e = () => {
      ii(i, K(i)).then((N) => {
        if (l) {
          if (N.kind === "found") {
            E(N.data);
            return;
          }
          if (N.kind === "orphan") {
            ee("orphan");
            return;
          }
          if (N.kind === "error") {
            te(!1);
            return;
          }
          hi().then((J) => {
            if (l) {
              if (J) {
                if (J.tool_call_id && i && J.tool_call_id !== i) {
                  qt(i).then((F) => {
                    if (l) {
                      if (F) {
                        I(!0), se(i);
                        return;
                      }
                      te(!0);
                    }
                  });
                  return;
                }
                E(J);
                return;
              }
              qt(i).then((F) => {
                if (l) {
                  if (F) {
                    F.kind === "skipped" && !F.answers && Ge(!0);
                    const X = String(F.skip_reason || "").trim();
                    X && Ze((rt) => rt || X), I(!0), se(i);
                    return;
                  }
                  te(!0);
                }
              });
            }
          });
        }
      });
    }, en = () => {
      if (l) {
        if (!U) {
          _e();
          return;
        }
        he().then((N) => {
          !l || N || _e();
        });
      }
    };
    return u = setTimeout(() => {
      l && Mt(!0);
    }, gi), en(), () => {
      l = !1, f && clearTimeout(f), u && clearTimeout(u);
    };
  }, [b, i]);
  const Lr = async () => {
    Te(!0);
    try {
      const l = K(i);
      let d = await sr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ys(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok)
        throw new Error(
          d.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + d.reason + "）"
        );
      if (d.released) {
        const u = d.reason === "host-stop";
        Be(
          d.reason === "orphan" ? "orphan" : "",
          d.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), O(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        Be(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), O("info", "本次问卷已失效，已关闭");
    } catch (l) {
      O("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Te(!1);
    }
  }, Pr = async () => {
    Te(!0);
    try {
      const l = K(i);
      let d = await sr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ys(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok) {
        wn(d.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + d.reason + "）。"), O("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (d.released) {
        const u = d.reason === "host-stop";
        wn(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), O("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        wn("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), O("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      O("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Te(!1);
    }
  }, Jt = Ee(m, oe), Le = Jt.length, me = T >= Le, Q = me ? -1 : Jt[T], gt = me ? Le : T;
  e.useEffect(() => {
    if (St(ae("mode", "manual")) !== "manual" || !ae("notify_manual_mode", !1) || b || le || ce || !on(c) || !m.length) return;
    const d = Ee(m, oe).filter((f) => !st(oe[`q${f}`])).length;
    Ma(i, q, d);
  }, [In, b, le, ce, gt]);
  const Gt = Math.max(0, Number(ae("slow_question_sec", La)) || 0) * 1e3, No = Math.round(Gt / 1e3);
  e.useEffect(() => {
    if (b || le || ce || Gt <= 0) return;
    if (R !== gt) {
      Z(gt), j(Date.now()), fe(!1);
      return;
    }
    if (!w) {
      j(Date.now());
      return;
    }
    if (ge) return;
    const l = w + Gt - Date.now();
    if (l <= 0) {
      fe(!0);
      return;
    }
    let d = !1;
    const f = setTimeout(() => {
      d || fe(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(f);
    };
  }, [b, le, ce, gt, R, w, ge, Gt]);
  const de = Q >= 0 ? m[Q] : null, tt = `q${Q}`, H = Q >= 0 && oe[tt] || { type: V(de), value: V(de) === "multi" ? [] : "", other: "" }, nt = (l) => {
    var u;
    Re && ct(""), Q >= 0 && mt(`q${Q}`);
    const d = { ...oe, [tt]: { ...l, skipped: !1 } }, f = Ee(m, d);
    m.forEach((k, S) => {
      f.indexOf(S) === -1 && delete d[`q${S}`];
    }), je(i, {
      answers: nr(d, (u = Tt(i)) == null ? void 0 : u.answers, ft.current)
    }), Je(d);
  };
  e.useEffect(() => {
    T > Le && z(Le);
  }, [Le, T]);
  const Wn = async (l, d) => {
    const f = await fetch(B(l), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(d)
    }), u = await f.json().catch(() => ({}));
    if (!f.ok) {
      const k = new Error(u && u.detail || "HTTP " + f.status);
      throw k.status = f.status, k;
    }
    return u;
  }, Hn = () => {
    var l;
    return nr(oe, (l = Tt(i)) == null ? void 0 : l.answers, ft.current);
  }, Oo = () => !!ae("gate_unsaved", !0), jr = (l, d) => {
    if (!Oo()) return [];
    const f = [];
    if (typeof d == "number")
      return Ee(m, l).indexOf(d) !== -1 && !st(l[`q${d}`]) && f.push(d + 1), f;
    const u = new Set(Ee(m, l));
    return m.forEach((k, S) => {
      u.has(S) && !st(l[`q${S}`]) && f.push(S + 1);
    }), f;
  }, Dr = (l, d, f) => {
    const u = "第 " + l.join("、") + " 题", k = f === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    ct("⛔ " + u + "尚未选择。" + k);
    const S = Ee(m, d).length;
    Wn("/question-modal/gate-block", {
      request_id: x,
      tool_call_id: i,
      session_id: K(i),
      missing: l,
      answered: S - l.length,
      total: S,
      bundle: ds
    }).catch(() => {
    });
  }, Zt = async (l, d = !1) => {
    if (!x)
      return O("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const f = Hn();
    if (!d) {
      const u = jr(f);
      if (u.length)
        return Dr(u, f, "提交"), "blocked";
      ct("");
    }
    Te(!0);
    try {
      const u = await Wn("/question-modal/answer", {
        request_id: x,
        session_id: K(i),
        answers: f,
        other: ot,
        attachments: lt
      });
      return u && u.orphan ? (fetch(
        B("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(K(i)),
        { method: "POST", headers: L() }
      ).catch(() => {
      }), Be(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), O("info", "本次问卷已失效，已关闭"), "sent") : (se(i), it(wi(m, f, ot, lt)), _n(Date.now()), En(!1), Bt(!1), Ne.current = !1, Lt.current = !1, ut.current = !0, I(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Be(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), O("info", "本次问卷已失效，已关闭"), "blocked") : (O("error", "提交失败: " + u.message), d ? (Ve.current = !1, Mn.current += 1, Mn.current >= Yn && O(
        "warning",
        "自动提交连续失败 " + Yn + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Ht((k) => k + 1), "not-ready") : "blocked");
    } finally {
      Te(!1);
    }
  }, Fr = () => ae("skip_mode", "per_question") === "whole", $o = () => {
    Q < 0 || (Re && ct(""), et(Ye.current), ve.current[Ye.current] = !0, mt(`q${Q}`), Je((l) => {
      const d = { ...l };
      d[`q${Q}`] = {
        type: (l[`q${Q}`] || {}).type || V(de),
        value: ((l[`q${Q}`] || {}).type || V(de)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const f = Ee(m, d);
      return m.forEach((u, k) => {
        f.indexOf(k) === -1 && delete d[`q${k}`];
      }), d;
    }), z((l) => l + 1));
  }, Mo = () => {
    if (me) {
      Zt();
      return;
    }
    const l = Hn(), d = jr(l, Q);
    if (d.length) {
      Dr(d, l, "下一步");
      return;
    }
    Re && ct(""), z((f) => f + 1);
  }, Bo = async () => {
    if (!x) {
      O("warning", "问卷尚未就绪，请稍候");
      return;
    }
    et(), Te(!0);
    try {
      const l = await Wn("/question-modal/skip", {
        request_id: x,
        session_id: K(i)
      });
      if (l && l.orphan) {
        Be(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), O("info", "本次问卷已失效，已关闭");
        return;
      }
      O("info", "已跳过问卷"), se(i), Ge(!0), Ze("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), it("用户跳过了本次问卷。"), _n(Date.now()), En(!1), Bt(!1), Ne.current = !1, Lt.current = !1, ut.current = !0, I(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Be(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), O("info", "本次问卷已失效，已关闭");
        return;
      }
      O("error", "跳过失败: " + l.message);
    } finally {
      Te(!1);
    }
  };
  e.useEffect(() => {
    if (b || G !== "ai" && G !== "recommend" || be || (G === "recommend" || G === "ai") && !ht || !on(c) || !m.length || W) return;
    if (me) {
      if (Ve.current || Mn.current >= Yn) return;
      const U = Hn();
      if (!Jt.every(
        (te, _e) => !!Me.current[_e] || st(U[`q${te}`])
      ) || !x) return;
      Ve.current = !0, Zt(void 0, !0).then((te) => {
        te === "not-ready" && (Ve.current = !1);
      });
      return;
    }
    const l = T;
    if (Wt.current[l] || G === "ai" && !Me.current[l]) return;
    const d = Jt[l], f = m[d], u = V(f), k = ms(f), S = hs(Ce.current[l], d);
    if (G === "ai" && !Me.current[l]) return;
    Wt.current[l] = !0;
    const E = k.length ? k.join("、") : S, ee = !!E;
    mt(`q${d}`), ee || (Ft.current[d] = !0, vo((U) => U + 1), O("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), Je((U) => {
      const he = { ...U }, te = `q${d}`, _e = he[te] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!ee)
        he[te] = {
          ..._e,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const N = f.options || [], J = (F) => String(F).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        he[te] = { ..._e, type: u, value: E.split(/[、,，]/).map((F) => J(F)).filter(Boolean).map((F) => {
          const X = N.find((rt) => ue(rt) === F || ke(rt) === F);
          return X ? ue(X) : F;
        }) };
      } else if (u === "single") {
        const N = f.options || [], J = (X) => String(X).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), F = N.find((X) => ue(X) === E || ke(X) === E) || N.find((X) => ue(X) === J(E) || ke(X) === J(E));
        he[te] = { ..._e, type: u, value: F ? ue(F) : E };
      } else
        he[te] = { ..._e, type: u, value: E };
      const en = Ee(m, he);
      return m.forEach((N, J) => {
        en.indexOf(J) === -1 && delete he[`q${J}`];
      }), he;
    }), ve.current[l] = !0, Me.current[l] = !0, z((U) => U + 1), Ht((U) => U + 1);
  }, [
    b,
    G,
    be,
    W,
    i,
    T,
    wo,
    Le,
    c,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    x,
    ht
  ]);
  const bt = e.useRef(!1), Pe = e.useRef(0), yt = e.useRef(!1), Se = e.useRef({});
  e.useEffect(() => {
    if (b || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        bt.current = !0, yt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!m || m.length), u.answers && typeof u.answers == "object" && (Je((S) => {
            const E = { ...S };
            return Object.keys(u.answers).forEach((ee) => {
              const U = u.answers[ee];
              !U || typeof U != "object" || ft.current.has(ee) || (E[ee] = {
                ...E[ee] || { type: "single", value: "", other: "" },
                ...U
              });
            }), E;
          }), je(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && z(u.cursor), typeof u.mode == "string" && u.mode) {
            const S = St(u.mode);
            Pt((E) => E === S ? E : S);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((S) => {
            const E = parseInt(S, 10);
            !isNaN(E) && u.per_question[S] && (Ce.current[E] = u.per_question[S]);
          }), u.status === "submitted" && (_n((S) => S || Date.now()), u.released && je(i, { backendReleased: !0 }), I(!0), se(i));
          const k = String(u.skip_reason || "").trim();
          k && Ze((S) => S || k), typeof u.mode == "string" && u.mode && (Se.current.mode = St(u.mode)), Object.keys(u.answers || {}).forEach((S) => {
            Se.current["a:" + S] = JSON.stringify(u.answers[S] || {});
          }), typeof u.cursor == "number" && (Se.current.cursor = "c:" + u.cursor), yt.current = !0, Ht((S) => S + 1);
        } finally {
          setTimeout(() => {
            bt.current = !1;
          }, 0);
        }
      }
    };
    Xa(i).then((u) => {
      !l || !u || !u.found || !u.state || (Pe.current = Math.max(Pe.current, u.rev), d(u.state));
    });
    const f = Ya(i, {
      onSnapshot: (u, k) => {
        Pe.current = Math.max(Pe.current, u), k && d(k);
      },
      onChange: (u) => {
        const k = parseInt(u.rev || 0, 10) || 0;
        k && k <= Pe.current && u.origin !== yn() || (Pe.current = Math.max(Pe.current, k), !(u.origin && u.origin === yn()) && d(u.state));
      },
      onStatus: (u) => {
        l && So((k) => k === !u ? k : !u);
      }
    });
    return () => {
      l = !1, f();
    };
  }, [b, i]), e.useEffect(() => {
    b || !i || bt.current || yt.current && Object.keys(oe || {}).forEach((l) => {
      const d = JSON.stringify(oe[l] || {});
      Se.current["a:" + l] !== d && (Se.current["a:" + l] = d, sn(
        i,
        "set_answer",
        { key: l, answer: oe[l] }
      ));
    });
  }, [b, i, JSON.stringify(oe)]), e.useEffect(() => {
    if (b || !i || bt.current || !yt.current) return;
    const l = "c:" + T;
    Se.current.cursor !== l && (Se.current.cursor = l, sn(i, "goto", { cursor: T }));
  }, [b, i, T]), e.useEffect(() => {
    b || !i || bt.current || yt.current && Se.current.mode !== G && (Se.current.mode = G, sn(i, "set_mode", { mode: G }));
  }, [b, i, G]);
  const Qt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Un = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Jn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Xt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Gn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Wr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Zn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Lo = { display: "flex", flexDirection: "column", gap: 8 }, Yt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, Kt = {
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
  }, xt = {
    ...Kt,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Po = {
    ...Kt,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Qn = {
    ...Kt,
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
  }, Hr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Qn,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Ur = {
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
  }, jo = { height: 32, fontSize: 13, borderRadius: 8 }, Jr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Gr = (l) => {
    const d = ue(l);
    return H.type === "multi" ? Array.isArray(H.value) && H.value.indexOf(d) !== -1 : H.value === d;
  }, Zr = Gr(Fe), Qr = (l) => {
    if (b || W) return;
    const d = ue(l);
    if (H.type === "multi") {
      const f = Array.isArray(H.value) ? H.value.slice() : [], u = f.indexOf(d);
      u === -1 ? f.push(d) : f.splice(u, 1), nt({ ...H, value: f, other: f.indexOf(Fe) !== -1 ? H.other : "" });
    } else
      nt({ ...H, value: d });
  }, Do = !!ae("show_recommend_badge", !0), Xr = ae("badge_position", "left") === "right", Fo = ae("badge_style", "rect") === "round", Yr = (l) => l && Do ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Fo ? { ...Ur, borderRadius: 999 } : Ur
  }, "AI 推荐") : null, Wo = !!ae("auto_number_options", !0), Ho = !!ae("highlight_recommended", !1), Uo = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Kr = (l, d, f, u, k, S) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: b || W,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: k && Ho ? { ...d ? Hr : Qn, ...Uo } : d ? Hr : Qn,
      onClick: f
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Xr ? null : Yr(k),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (S && Wo ? S + ". " : "") + l),
    Xr ? Yr(k) : null
  );
  if (!b && !on(c))
    return e.createElement(
      "div",
      { style: Qt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Un, className: "qm-header" },
        e.createElement(
          "div",
          { style: Jn },
          Kn(e),
          e.createElement("span", { style: Xt, className: "qm-title" }, q)
        ),
        e.createElement("span", { style: Gn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Wr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Er ? e.createElement(
        "div",
        { style: Yt },
        e.createElement("button", {
          type: "button",
          disabled: W,
          style: { ...xt, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Lr
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = () => {
      const f = Wa({
        submittedAt: Qe,
        deadReason: ce,
        releasedNote: Ae,
        skippedAll: le,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: dt,
        pastSoft: qn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!ut.current
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
      }, Fa(f.phase)) : null;
    }, d = !!ut.current;
    return le && !$t ? e.createElement(
      "div",
      {
        style: {
          ...Qt,
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
        ce ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      ze ? e.createElement("span", {
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
        title: ze
      }, ze) : null,
      e.createElement("span", {
        style: { ...Xt, flex: Ae || ze ? 0 : 1, opacity: 0.75 }
      }, q),
      Ae ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Ae) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...xt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => qr(!0)
      }, "展开"),
      // Escape hatch for the「already finished but the chat is still locked」
      // shape: the card can be settled while the agent's Future was never
      // actually resolved (orphaned record / cross-generation reload / race),
      // so the chat keeps answering 409 and the user has nothing left to
      // click.  This button therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
      d ? e.createElement("button", {
        type: "button",
        disabled: W,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...xt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Pr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: Qt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Un, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Jn },
          Kn(e),
          e.createElement("span", { style: Xt }, q)
        ),
        e.createElement(
          "span",
          { style: { ...Gn, color: ce ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          ce ? "已失效" : le ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      le && (ze || ce) ? e.createElement(
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
        String(ze || ce || "问卷已失效/跳过")
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
      }, le ? at ? at + `

` + dn(m) : `已跳过本次问卷。

` + dn(m) : at || A || v || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + dn(m)),
      le && $t ? e.createElement(
        "div",
        { style: Yt },
        e.createElement("button", {
          type: "button",
          style: xt,
          onClick: () => qr(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Yt, marginTop: 8, gap: 10 } },
        Ae ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Ae) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        d ? e.createElement("button", {
          type: "button",
          disabled: W,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...xt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Pr
        }, "释放阻塞") : null
      )
    );
  }
  const Vr = ge && R === gt, es = !b && !me && ko >= 0 && Ft.current[Q] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, ts = Object.keys(Ft.current).map((l) => Number(l)).filter((l) => Ft.current[l] && Number.isFinite(l)).sort((l, d) => l - d), Jo = me && ts.length ? e.createElement("div", {
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
  }, "⚠ 第 " + ts.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let Vt = null;
  if (me)
    Vt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Zn }, "其他意见（可选）"),
      Jo,
      e.createElement(o, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: ot,
        style: Jr,
        onChange: (l) => Ks(l.target.value),
        onPaste: (l) => Fn(l, "final", "final")
      }),
      or({
        R: e,
        files: lt,
        disabled: b || W,
        uploading: Ln,
        error: jn,
        onPick: () => Dn("final", "final"),
        onRemove: (l) => _r((d) => d.filter((f, u) => u !== l))
      })
    );
  else if (de && V(de) === "text")
    Vt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Zn, fontSize: 13, color: "var(--app-text, inherit)" } }, mn(de, Q)),
      es,
      e.createElement(o, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof H.value == "string" ? H.value : "",
        style: Jr,
        onChange: (l) => nt({ ...H, value: l.target.value, other: "" }),
        onPaste: (l) => Fn(l, "q", tt)
      }),
      or({
        R: e,
        files: H.attachments || [],
        disabled: b || W,
        uploading: Ln,
        error: jn,
        onPick: () => Dn("q", tt),
        onRemove: (l) => nt({
          ...H,
          attachments: (H.attachments || []).filter((d, f) => f !== l)
        })
      })
    );
  else if (de) {
    const l = ms(de), d = hs(jt, Q), f = l.length ? l : d ? [d] : l, u = (de.options || []).map((k, S) => Kr(
      ke(k),
      Gr(k),
      () => Qr(k),
      "o" + S,
      Va(de, k, f),
      S + 1
    ));
    u.push(Kr("其他", Zr, () => Qr(Fe), "other")), Zr && (u.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: H.other,
      style: { ...jo, marginTop: 2 },
      onChange: (k) => nt({ ...H, other: k.target.value }),
      onPaste: (k) => Fn(k, "q", tt)
    })), u.push(or({
      R: e,
      files: H.attachments || [],
      disabled: b || W,
      uploading: Ln,
      error: jn,
      onPick: () => Dn("q", tt),
      onRemove: (k) => nt({
        ...H,
        attachments: (H.attachments || []).filter((S, E) => E !== k)
      })
    }))), Vt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Zn, fontSize: 13, color: "var(--app-text, inherit)" } }, mn(de, Q)),
      es,
      e.createElement("div", { style: { ...Lo, marginTop: 8 } }, u)
    );
  }
  const Xn = Le + 1, Go = me ? Xn + "/" + Xn : T + 1 + "/" + Xn, kt = {
    ...Kt,
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
    { style: Qt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Un, className: "qm-header" },
      e.createElement(
        "div",
        { style: Jn },
        Kn(e),
        e.createElement("span", { style: Xt, className: "qm-title" }, q)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        Si({
          R: e,
          providers: so,
          modelId: Ar,
          disabled: b || W,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: co,
          onOpenChange: uo,
          tab: po,
          onTabChange: fo,
          onChange: (l) => {
            Ut({ modelId: l }), Xe(null), Ce.current = {}, ve.current = {}, Ke((d) => d + 1);
          }
        }),
        qi({
          R: e,
          templates: Cr,
          value: $e,
          open: ho,
          onOpenChange: go,
          disabled: b || W,
          onSelect: $r,
          onManage: () => Rr(!0)
        }),
        _i({
          R: e,
          mode: G,
          disabled: b || W,
          onChange: (l) => {
            Ut({ mode: l }), l === "ai" && (ve.current = {}), l === "ai" || l === "recommend" ? (Wt.current = {}, Me.current = {}, Ve.current = !1, Ke((d) => d + 1)) : et();
          }
        }),
        Ii({
          R: e,
          busy: zr,
          result: jt,
          error: ao,
          mode: G,
          disabled: b || W,
          open: io,
          onOpenChange: lo,
          onRun: () => {
            Bn("manual");
          },
          onRerun: To,
          onApply: Co,
          onCancel: Ao,
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
                checked: An,
                onChange: (l) => Ut({ withContext: !!l.target.checked })
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
                checked: Cn,
                onChange: (l) => Ut({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (G === "ai" || G === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: W,
          onClick: zo,
          style: {
            ...kt,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...be ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: be ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, be ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Gn, key: "qm-step" }, Go)
      )
    ),
    e.createElement("div", { style: Wr }, Vt),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Ei({
      R: e,
      open: bo,
      templates: Cr,
      value: $e,
      edit: yo,
      onEditChange: $n,
      onClose: () => {
        Rr(!1), $n(null);
      },
      onSelect: (l) => $r(l),
      onSave: Eo,
      onDelete: Io
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
    (Vr || Er && !x) && !b ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": ge ? i : void 0,
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
        (Vr ? "⚠️ 本题已超过 " + No + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (x ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: W,
        style: {
          ...kt,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Lr,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Re && !b ? e.createElement("div", {
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
      "data-qm-bundle": ds
    }, Re) : null,
    e.createElement(
      "div",
      { style: Yt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: T === 0 || W,
        style: { ...kt, marginRight: "auto", opacity: T === 0 ? 0.5 : 1 },
        onClick: () => z((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: W,
          style: kt,
          // 「跳过并提交」是明确的提交意图，不套空答卷闸门（allowEmpty=true）。
          // 跳过方式的落点（设置 → 作答 → 跳过方式）：
          //   per_question（默认）= 逐题跳过，只表态当前题
          //   whole               = 整卷跳过，直接结束这份问卷
          // 末页始终是「跳过并提交」（跳过整卷的「其他意见」）。
          // 这一个按钮始终是「只处理当前页」的语义：
          //   per_question → 跳过本题（前进，问卷继续）
          //   whole        → 跳过并提交（把当前页留空直接提交，问卷结束）
          // 真正的「整卷跳过」由下面那个常驻按钮负责——把两者都写成
          // 「跳过问卷」会出现两个同名按钮，用户无法分辨点哪个。
          onClick: me ? () => Zt(void 0, !0) : Fr() ? () => Zt(void 0, !0) : $o
        },
        me || Fr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: W,
        style: kt,
        onClick: Bo
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: W,
        style: Po,
        onClick: Mo
      }, me ? "提交" : "下一步")
    )
  );
}
const ks = 12, p = {
  visible: !1,
  tab: "answer",
  scope: "global",
  lastScope: "global",
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
  globalCfg: {}
};
let Et = null;
function ne(r, e, t) {
  if (r in p.draft) return p.draft[r];
  if (t === "global") {
    const s = p.globalCfg;
    return s && r in s ? s[r] : e;
  }
  const n = p.cfg && p.cfg.config;
  return n && r in n ? n[r] : e;
}
function Ai(r) {
  const e = p.cfg && p.cfg.config;
  if (!e) return !1;
  const t = e.__sources__, n = e[r];
  return !!(t && t[r] === "session" && (n === "" || n === null));
}
function qe(r) {
  const e = p.cfg && p.cfg.config, t = e && e.__sources__;
  return !!(t && t[r] === "session");
}
function re(r, e) {
  const t = p.cfg && p.cfg.config;
  (t && r in t ? t[r] : void 0) === e ? delete p.draft[r] : p.draft[r] = e, p.saveMsg = "", P();
}
function vs() {
  return Object.keys(p.draft).length;
}
async function Sr() {
  try {
    const r = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return;
    const e = await r.json(), t = e && e.prefs || {};
    p.globalCfg = t && typeof t == "object" ? t : {};
    try {
      P();
    } catch {
    }
  } catch {
  }
}
async function zi() {
  const r = Object.keys(p.draft);
  if (!r.length || p.saving) return;
  const e = p.scope === "session", t = {};
  if (r.forEach((n) => {
    t[n] = p.draft[n];
  }), e) {
    const n = p.cfg && p.cfg.config || {}, s = n.__follow_active__ === !0;
    Di.forEach((o) => {
      if (o in t || o === "model_id" && s) return;
      const a = n[o];
      a == null || a === "" || (t[o] = a);
    });
  }
  p.saving = !0, p.saveMsg = "", P();
  try {
    let n = "/question-modal/prefs", s = t;
    e && (n = "/question-modal/session-prefs", s = {
      chat_id: p.chatId,
      session_id: p.sessionId,
      agent_id: p.agentId,
      settings: t
    });
    const o = await fetch(B(n), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(s)
    }), a = await o.json().catch(() => ({}));
    if (!o.ok) {
      p.saving = !1, p.saveMsg = a && a.detail ? String(a.detail) : "保存失败（" + o.status + "）", P();
      return;
    }
    p.saving = !1, p.draft = {}, vr(), p.saveMsg = e ? "已保存到会话模式（仅本会话生效，全局默认不变）。" : "已保存为全局默认（对所有会话生效）。", e || Sr(), Rt(
      p.chatId,
      !0,
      p.sessionId,
      p.agentId
    ).then((c) => {
      c && (p.cfg = c);
      try {
        P();
      } catch {
      }
    }).catch(() => {
    });
  } catch (n) {
    p.saving = !1, p.saveMsg = "保存请求失败：" + (n && n.message ? n.message : n);
  }
  try {
    P();
  } catch {
  }
}
async function Ci() {
  if (!(p.saving || !window.confirm(
    "将移除本会话的全部设置覆盖，之后跟随全局默认。已保存的值无法恢复，继续吗？"
  ))) {
    p.saving = !0, p.saveMsg = "", P();
    try {
      const e = await fetch(B("/question-modal/session-prefs/clear"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          chat_id: p.chatId,
          session_id: p.sessionId,
          agent_id: p.agentId
        })
      }), t = await e.json().catch(() => ({}));
      if (p.saving = !1, !e.ok) {
        p.saveMsg = t && t.detail ? String(t.detail) : "清空失败（" + e.status + "）", P();
        return;
      }
      p.draft = {}, vr(), p.saveMsg = "已清空本会话覆盖，现跟随全局默认。";
      const n = await Rt(
        p.chatId,
        !0,
        p.sessionId,
        p.agentId
      );
      n && (p.cfg = n);
    } catch (e) {
      p.saving = !1, p.saveMsg = "清空请求失败：" + (e && e.message ? e.message : e);
    }
    try {
      P();
    } catch {
    }
  }
}
function Zs() {
  p.draft = {}, p.saveMsg = "";
}
function Qs() {
  kr().then((r) => {
    p.templates = (r && r.items || []).filter((e) => e && e.id), p.templateOptions = p.templates.map((e) => e.id);
    try {
      P();
    } catch {
    }
  }).catch(() => {
  });
}
function Ri() {
  p.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, p.saveMsg = "", P();
}
function Ni(r) {
  const e = p.templates.filter((t) => t.id === r)[0];
  e && (p.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, p.saveMsg = "", P());
}
function ws(r, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([r + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  p.tplEdit && (p.tplEdit[r] = e, P());
}
function Oi() {
  p.tplEdit = null, P();
}
async function $i() {
  const r = p.tplEdit;
  if (!r || p.tplBusy) return;
  try {
    const s = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    s && typeof s.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((o) => {
      const a = s.querySelector('[data-qm-tpl-field="' + o + '"]');
      a && typeof a.value == "string" && a.value !== "" && (r[o] = a.value);
    });
  } catch {
  }
  const e = String(r.name || "").trim();
  if (!e) {
    p.saveMsg = "模板名称不能为空", P();
    return;
  }
  p.tplBusy = !0, P();
  const t = {
    id: r.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: r.system_prompt,
    user: r.user_prompt
  }, n = await js(t);
  if (p.tplBusy = !1, n && n.ok === !1) {
    p.saveMsg = String(n.error || n.detail || "保存失败"), P();
    return;
  }
  p.tplEdit = null, p.saveMsg = r.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Qs(), P();
}
async function Mi(r) {
  const e = p.templates.filter((s) => s.id === r)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || r) + "」？") : !1)) return;
  const n = await Ds(r);
  if (n && n.ok === !1) {
    p.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）"), P();
    return;
  }
  p.saveMsg = "模板已删除", Qs(), P();
}
function Bi() {
  p.visible = !0, p.chatId = "", p.sessionId = xr(), Li(), p.agentId = kn || (() => {
    try {
      return pe().getSelectedAgentId ? pe().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), vr(), P(), Xs(() => {
    const r = !!(p.cfg && p.cfg.has_session);
    p.tab = r ? "session" : "default", p.scope = r ? "session" : "global", p.draft = {}, p.saveMsg = "", P(), p.tab === "global" && Sr();
  });
}
let an = !1;
function Li() {
  an || (an = !0, Promise.all([Fs(), kr()]).then((r) => {
    an = !1;
    const e = r[0] || [], t = r[1] || {};
    p.providerGroups = e.map((n) => {
      const s = String(n && (n.id || n.provider_id) || ""), a = (n && n.models || []).concat(n && n.extra_models || []).filter(Boolean).map((c) => {
        const i = typeof c == "string" ? c : c && (c.name || c.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: s,
        name: String(n && (n.name || n.title) || s),
        models: a
      };
    }).filter((n) => n.id && n.models.length > 0), p.modelOptions = p.providerGroups.flatMap((n) => n.models.map((s) => n.id + ":" + s)), p.templates = (t.items || []).filter((n) => n && n.id), p.templateOptions = p.templates.map((n) => n.id);
    try {
      P();
    } catch {
    }
  }).catch(() => {
    an = !1;
  }));
}
function Pi(r) {
  const e = String(r || ""), t = e.indexOf(":");
  return t <= 0 ? { provider: "", model: e } : { provider: e.slice(0, t), model: e.slice(t + 1) };
}
let ar = !1;
const ir = [];
function Xs(r) {
  if (ar) {
    r && ir.push(r);
    return;
  }
  ar = !0;
  const e = p.chatId, t = () => {
    ar = !1;
    const n = ir.splice(0);
    try {
      n.forEach((s) => s());
    } catch {
    }
  };
  r && ir.push(r), Rt(
    e,
    !0,
    p.sessionId,
    p.agentId
  ).then((n) => {
    if (p.chatId !== e) {
      t();
      return;
    }
    n ? (p.cfg = n, p.cfgError = "") : p.cfgError = "读取配置失败（后端不可达）", t();
    try {
      P();
    } catch {
    }
  }).catch(() => {
    t();
  });
}
function P() {
  const r = pe().React, e = pe().ReactDOM;
  if (r) {
    if (!e || typeof e.render != "function") {
      if (p.visible) {
        try {
          const t = Ie();
          t && t.Modal && typeof t.Modal.info == "function" && t.Modal.info({
            title: "问卷设置",
            centered: !0,
            width: 480,
            okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。"
          });
        } catch {
        }
        p.visible = !1;
      }
      return;
    }
    Et || (Et = document.createElement("div"), Et.id = "qm-settings-root", document.body.appendChild(Et)), e.render(r.createElement(Ui, {
      R: r,
      open: p.visible,
      onClose: () => {
        if (vs() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Zs();
        }
        p.visible = !1, p.saveMsg = "", P();
      },
      tab: p.tab,
      onTabChange: (t) => {
        p.tab = t, p.scope = Ys(t) ? "session" : "global", p.saveMsg = "", p.draft = {}, P(), Xs(), (t === "global" || t === "default") && Sr();
      },
      scope: p.scope,
      sessData: p.sessData,
      cfg: p.cfg,
      cfgError: p.cfgError,
      chatId: p.chatId,
      dirtyCount: vs(),
      saving: p.saving,
      saveMsg: p.saveMsg,
      modelOptions: p.modelOptions,
      templateOptions: p.templateOptions,
      providerGroups: p.providerGroups,
      templates: p.templates,
      tplEdit: p.tplEdit,
      tplBusy: p.tplBusy
    }), Et);
  }
}
function ji(r) {
  const { R: e, onOpen: t } = r, n = Ie(), s = n && n.Button, o = "问卷设置", a = { fontSize: 12, padding: "2px 8px", height: 28 };
  return s ? e.createElement(s, { type: "text", size: "small", style: a, onClick: t }, o) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: a,
    onClick: t
  }, o);
}
const lr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  { key: "prompt", label: "提示词", hint: "内置与自定义提示词模板" }
], Di = ["mode", "model_id", "template_id", "with_context", "parallel"], Ys = (r) => r === "session";
function Fi(r, e, t) {
  const n = {
    global: { text: "全局", cls: "" },
    // 「全局默认 + 可被会话覆盖」：在全局页签里标这个，用户才知道同一项
    // 在「当前会话」页签还能单独改。
    both: { text: "全局·可覆盖", cls: " qm-set-scopeboth" },
    session: { text: "会话", cls: " qm-set-scopesession" },
    readonly: { text: "只读", cls: " qm-set-scopero" }
  }, s = n[t] || n.global;
  return r.createElement("span", {
    className: "qm-set-scopetag" + s.cls,
    key: e,
    title: t === "session" ? "仅对当前会话生效，覆盖全局默认值" : t === "both" ? "这是全局默认值；单个会话可在「当前会话」页签里覆盖" : t === "readonly" ? "只读信息" : "对所有会话生效的默认值"
  }, s.text);
}
function Wi(r, e) {
  return e === "readonly" ? !0 : r === "session" && e === "global";
}
function Y(r, e, t, n, s, o, a, c) {
  const i = o || "global", y = Wi(a, i), g = [
    r.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      r.createElement("span", { key: "tt" }, t),
      Fi(r, "sc", i),
      y && i === "global" ? r.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? r.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], v = [
    r.createElement("div", { className: "qm-set-rowlabel", key: "l" }, g),
    r.createElement("div", {
      className: "qm-set-rowctl" + (c ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, n)
  ];
  return r.createElement("div", {
    className: "qm-set-row" + (y ? " qm-set-rowlocked" : ""),
    key: e,
    "data-qm-locked": y ? "1" : "0"
  }, v);
}
function Ss(r, e, t, n, s, o) {
  return r.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    t.map((a, c) => r.createElement("button", {
      key: "s" + c,
      type: "button",
      "data-qm-val": a,
      disabled: !s,
      className: "qm-set-segbtn" + (a === n ? " qm-set-segon" : "") + (s ? "" : " qm-set-ctrldis"),
      onClick: () => {
        s && s(a);
      }
    }, [
      r.createElement("span", { key: "t" }, a),
      // The dot rides on the ACTIVE item only, so it reads as "this value is
      // an override" rather than decorating every option.
      o && a === n ? r.createElement("span", {
        key: "d",
        className: "qm-set-srcdot",
        "data-qm-src": "session",
        title: "此项已被会话覆盖（仅当前会话生效）"
      }) : null
    ]))
  );
}
function It(r, e, t, n, s) {
  return r.createElement("div", {
    key: e,
    className: "qm-set-switch" + (t ? " qm-set-switch-on" : "") + (n ? "" : " qm-set-ctrldis"),
    "data-qm-on": t ? "1" : "0",
    role: "switch",
    // Self-drawn switch: without these the a11y tree reports an unchecked
    // switch regardless of the real state (observed in a real browser).
    "aria-checked": t ? "true" : "false",
    "aria-disabled": n ? "false" : "true",
    tabIndex: n ? 0 : -1,
    onClick: () => {
      n && n(!t);
    },
    onKeyDown: (o) => {
      if (!n) return;
      const a = o && o.key;
      (a === " " || a === "Enter") && (o.preventDefault(), n(!t));
    }
  }, [
    r.createElement("span", { key: "k", className: "qm-set-knob" }),
    s ? r.createElement("span", {
      key: "d",
      className: "qm-set-srcdot qm-set-srcdotsw",
      "data-qm-src": "session",
      title: "此项已被会话覆盖（仅当前会话生效）"
    }) : null
  ]);
}
function De(r, e, t, n, s, o) {
  if (n && n.length && s) {
    const a = n.map((c, i) => c && typeof c == "object" ? { value: String(c.value), label: String(c.label || c.value) } : { value: String(c), label: String(c) });
    return r.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      r.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: t,
        onChange: (c) => s(c && c.target ? c.target.value : "")
      }, a.map((c, i) => r.createElement("option", { key: "o" + i, value: c.value }, c.label))),
      o ? r.createElement("span", {
        key: "d",
        className: "qm-set-srcdot",
        "data-qm-src": "session",
        title: "此项已被会话覆盖（仅当前会话生效）"
      }) : null
    ]);
  }
  return r.createElement("div", { className: "qm-set-select", key: e }, [
    r.createElement("span", { key: "t", className: "qm-set-selecttext" }, t),
    o ? r.createElement("span", {
      key: "d",
      className: "qm-set-srcdot",
      "data-qm-src": "session",
      title: "此项已被会话覆盖（仅当前会话生效）"
    }) : null,
    r.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function _s(r, e, t, n, s, o) {
  const a = Pi(t), i = n.map((h) => h.id).indexOf(a.provider) >= 0 ? a.provider : "", y = i ? (n.filter((h) => h.id === i)[0] || { models: [] }).models : [], g = y.indexOf(a.model) >= 0 ? a.model : "", v = (h, b) => {
    s && s(h ? h + ":" + b : "");
  }, m = r.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: i,
    disabled: !s,
    title: "厂商",
    onChange: (h) => {
      const b = h && h.target ? h.target.value : "", I = b ? (n.filter((A) => A.id === b)[0] || { models: [] }).models : [];
      v(b, b && I[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [r.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(n.map((h, b) => r.createElement(
    "option",
    { key: "g" + b, value: h.id },
    h.name === h.id ? h.id : h.name + "（" + h.models.length + "）"
  )))), q = r.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: g,
    disabled: !s || !i,
    title: i ? "选择模型" : "先选厂商",
    onChange: (h) => {
      const b = h && h.target ? h.target.value : "";
      v(i, b);
    }
  }, i ? y.map((h, b) => r.createElement("option", { key: "m" + b, value: h }, h)) : [r.createElement("option", { key: "m0", value: "" }, "—")]);
  return r.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    m,
    r.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    q,
    o ? r.createElement("span", {
      key: "d",
      className: "qm-set-srcdot",
      "data-qm-src": "session",
      title: "此项已被会话覆盖（仅当前会话生效）"
    }) : null
  ]);
}
function Hi(r, e, t, n, s) {
  const o = [], a = t === "session" ? "session" : "global", c = a === "session", i = (C, x) => r.createElement("div", { className: "qm-set-section", key: "sec-" + C }, x), y = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, g = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, v = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒（默认）": 120,
    "300 秒": 300,
    "600 秒": 600
  }, m = {
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
  }, h = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, b = s && s.templateOptions || [];
  s && s.modelOptions;
  const I = s && s.providerGroups || [], A = b.map((C) => {
    const x = p.templates.filter((_) => String(_.id) === String(C))[0];
    return { value: C, label: x && (x.name || x.id) || C };
  });
  if (e === "session") {
    o.push(i("answer", "作答")), o.push(Y(
      r,
      "s1",
      "答题模式",
      Ss(
        r,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        g[String(ne("mode", "manual"))] || "人工",
        (x) => re("mode", y[x] || "manual"),
        qe("mode")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      a
    )), o.push(i("analysis", "分析")), o.push(Y(
      r,
      "s2",
      "默认模型",
      _s(
        r,
        "sel2",
        String(ne("model_id", "")),
        I,
        (x) => re("model_id", x),
        qe("model_id")
      ),
      // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
      //   跟随中   → 指明跟的是"本会话"的对话模型
      //   显式设空 → 如实说你清掉了它
      //   其余     → 正常说明
      Ai("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
      "session",
      a,
      !0
    ));
    const C = String(ne("template_id", "")) || A[0] && A[0].value || "";
    o.push(Y(
      r,
      "s3",
      "提示词模板",
      A.length ? De(
        r,
        "sel3",
        C,
        A,
        (x) => re("template_id", x),
        qe("template_id")
      ) : De(r, "sel3", "默认六步思维链"),
      b.length ? "" : "模板库未加载，暂不可选",
      "session",
      a
    )), o.push(Y(
      r,
      "s4",
      "携带上下文",
      It(
        r,
        "s4sw",
        !!ne("with_context", !1),
        (x) => re("with_context", x),
        qe("with_context")
      ),
      "附带上次决策与会话历史",
      "session",
      a
    )), o.push(Y(
      r,
      "s5",
      "并行分析各题",
      It(
        r,
        "s5sw",
        !!ne("parallel", !1),
        (x) => re("parallel", x),
        qe("parallel")
      ),
      "本会话逐题并发调用模型",
      "session",
      a
    )), c && o.push(r.createElement(
      "div",
      {
        key: "sessclear",
        style: { display: "flex", alignItems: "center", gap: 8, marginTop: 10 }
      },
      r.createElement("button", {
        className: "qm-set-btn",
        "data-qm-sessclear": "1",
        type: "button",
        disabled: !!p.saving,
        onClick: () => {
          Ci();
        }
      }, "清空本会话覆盖"),
      r.createElement("span", {
        style: { fontSize: 12, color: "var(--app-text-tertiary,#8c8c8c)" }
      }, "移除本会话的全部覆盖，恢复为跟随全局默认")
    ));
  } else if (e === "global" || e === "default")
    if (e === "default")
      o.push(i("answer", "作答")), o.push(Y(
        r,
        "a1",
        "默认答题模式",
        Ss(
          r,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          g[String(ne("mode", "manual", "global"))] || "人工",
          (x) => re("mode", y[x] || "manual"),
          qe("mode")
        ),
        "新问卷的默认推进方式（可被会话覆盖）",
        "both",
        a
      )), o.push(i("analysis", "分析")), o.push(Y(
        r,
        "b1",
        "默认模型",
        _s(
          r,
          "sel2",
          String(ne("model_id", "", "global")),
          I,
          (x) => re("model_id", x),
          qe("model_id")
        ),
        "仅在「自动分析」模式下使用（可被会话覆盖）",
        "both",
        a,
        !0
      )), o.push(Y(
        r,
        "b2",
        "提示词模板",
        A.length ? De(
          r,
          "sel3",
          String(ne("template_id", "", "global")) || A[0].value,
          A,
          (x) => re("template_id", x),
          qe("template_id")
        ) : De(r, "sel3", "默认六步思维链"),
        A.length ? "可被会话覆盖" : "模板库未加载，暂不可选",
        "both",
        a
      )), o.push(Y(
        r,
        "b3",
        "携带上下文",
        It(
          r,
          "s3",
          !!ne("with_context", !1, "global"),
          (x) => re("with_context", x),
          qe("with_context")
        ),
        "附带上次决策与会话历史（可被会话覆盖）",
        "both",
        a
      )), o.push(Y(
        r,
        "b4",
        "并行分析各题",
        It(
          r,
          "s4",
          !!ne("parallel", !1, "global"),
          (x) => re("parallel", x),
          !1
        ),
        "更快，但更耗额度",
        "global",
        a
      ));
    else {
      o.push(i("behavior", "行为")), o.push(Y(
        r,
        "e5",
        "人工模式时提醒",
        It(
          r,
          "s8",
          !!ne("notify_manual_mode", !1, "global"),
          (w) => re("notify_manual_mode", w),
          !1
        ),
        "问卷弹出时发系统通知（仅人工模式，每份只提醒一次）；首次会请求通知权限",
        "global",
        a
      )), o.push(Y(
        r,
        "e6",
        "单题分析超时",
        De(
          r,
          "sel4",
          m[Number(ne("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (w) => re("model_timeout_sec", v[w] ?? 120),
          !1
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        a
      )), o.push(i("misc", "杂项")), o.push(Y(
        r,
        "d4",
        "等待提示阈值",
        De(
          r,
          "sel5",
          h[Number(ne("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (w) => re("wait_hint_sec", q[w] ?? 180),
          !1
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        a
      ));
      const x = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], _ = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, T = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, z = Number(ne("gate_log_limit", 200, "global"));
      o.push(Y(
        r,
        "d5",
        "拦截记录",
        De(
          r,
          "sel6",
          T[z] || "最近 200 条（默认）",
          x,
          (w) => re("gate_log_limit", _[w] ?? 200),
          !1
        ),
        "用于排查卡住问题；「不保留」= 不记录",
        "global",
        a
      ));
    }
  else if (e === "prompt") {
    const C = p.templates, x = p.tplEdit;
    if (o.push(Y(
      r,
      "p0",
      "模板库共享范围",
      r.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      a
    )), C.length ? o.push(r.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      C.map((_, T) => {
        const z = !!_.builtin, j = (String(_.note || _.desc || "").trim() || String(_.system || _.system_prompt || _.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), R = j.length > 90 ? j.slice(0, 90) + "…" : j;
        return r.createElement("div", { className: "qm-set-item", key: "i" + T }, [
          r.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            r.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(_.name || _.id)
            ),
            r.createElement("span", {
              className: "qm-set-tag" + (z ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, z ? "内置" : "自定义"),
            r.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(_.id),
              onClick: () => {
                Ni(String(_.id));
              }
            }, "编辑"),
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (z ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(_.id),
              disabled: z,
              title: z ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                z || Mi(String(_.id));
              }
            }, "删除")
          ]),
          r.createElement("div", { className: "qm-set-itemdesc", key: "d" }, R)
        ]);
      })
    )) : o.push(r.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), o.push(r.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      r.createElement("button", {
        type: "button",
        className: "qm-set-btn",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          Ri();
        }
      }, "＋ 新建模板")
    ])), x) {
      const _ = (T, z, w, j, R) => {
        var Z, ge;
        return r.createElement("div", { className: "qm-set-field", key: "f-" + z }, [
          r.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, T),
          w ? r.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: j,
            "data-qm-tpl-field": z,
            placeholder: R,
            value: String(((Z = p.tplEdit) == null ? void 0 : Z[z]) || ""),
            onChange: (fe) => ws(z, fe && fe.target ? fe.target.value : "")
          }) : r.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": z,
            placeholder: R,
            value: String(((ge = p.tplEdit) == null ? void 0 : ge[z]) || ""),
            onChange: (fe) => ws(z, fe && fe.target ? fe.target.value : "")
          })
        ]);
      };
      o.push(r.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (x.id || "new")
      }, [
        r.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          x.id ? "编辑模板：" + (x.name || x.id) : "新建模板"
        ),
        _("模板名称", "name", !1, 0, "如：简短结论版"),
        _(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        _(
          "用户提示词模板",
          "user_prompt",
          !0,
          5,
          "可用占位符：{question} {options} {context} {title} {index} {total} {type} {showIf}"
        ),
        r.createElement("div", { className: "qm-set-editorbtns", key: "b" }, [
          r.createElement("button", {
            type: "button",
            className: "qm-set-btn qm-set-btnprimary",
            key: "save",
            "data-qm-tpl-save": "1",
            disabled: !!p.tplBusy,
            onClick: () => {
              $i();
            }
          }, p.tplBusy ? "保存中…" : "保存"),
          r.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Oi();
            }
          }, "取消")
        ])
      ]));
    }
  }
  return r.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
}
function Ui(r) {
  const { R: e, open: t, onClose: n } = r;
  if (!t) return null;
  const s = Ie(), o = s && s.Modal, a = r.tab || "session", c = Ys(a) ? "session" : "global", i = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    lr.map((_) => e.createElement("button", {
      key: _.key,
      type: "button",
      className: "qm-set-tab" + (_.key === a ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          r.onTabChange && r.onTabChange(_.key);
        } catch {
        }
      }
    }, _.label))
  ), y = lr.filter((_) => _.key === a)[0] || lr[0], g = !!(r.cfg && r.cfg.has_session), v = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    e.createElement("div", {
      key: "b",
      "data-qm-scope-badge": "1",
      className: "qm-set-badge" + (g ? " qm-set-badgeon" : " qm-set-badgeglobal")
    }, g ? "会话模式" : "默认模式")
  ]), m = e.createElement("div", { className: "qm-set-subhint", key: "sh" }, y.hint), q = null, h = Hi(e, a, c, r.sessData, {
    modelOptions: r.modelOptions,
    templateOptions: r.templateOptions,
    providerGroups: r.providerGroups
  }), b = r.dirtyCount || 0, I = c === "session" ? "保存到会话模式（覆盖全局默认，仅本会话）" : "保存为全局默认（对所有会话生效）", A = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("button", {
      key: "save",
      type: "button",
      className: "qm-set-btn qm-set-btnprimary",
      "data-qm-save": "1",
      disabled: !b || !!r.saving,
      onClick: () => {
        zi();
      }
    }, r.saving ? "保存中…" : "保存"),
    e.createElement("button", {
      key: "revert",
      type: "button",
      className: "qm-set-btn",
      "data-qm-revert": "1",
      disabled: !b || !!r.saving,
      onClick: () => {
        Zs(), P();
      }
    }, "还原"),
    b ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
      e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
      "有 " + b + " 项未保存"
    ]) : null,
    e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, I)
  ]), C = r.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, r.saveMsg) : null, x = e.createElement("div", { className: "qm-set-wrap" }, [
    v,
    i,
    q,
    m,
    h,
    C,
    A
  ]);
  return o ? e.createElement(o, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    closeIcon: null,
    onCancel: n,
    destroyOnClose: !0,
    width: 620,
    zIndex: 1200,
    wrapClassName: "qm-set-modal"
  }, x) : e.createElement("div", {
    className: "qm-set-wrap qm-set-fallback",
    "data-qm-fallback": "1",
    style: {
      position: "fixed",
      left: "50%",
      top: "8%",
      transform: "translateX(-50%)",
      width: 620,
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
          n();
        } catch {
        }
      }
    }, "✕"),
    x
  ]);
}
function Ji(r) {
  try {
    const e = r && r.sender, t = pe().React;
    if (!t) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const n = t.createElement(ji, {
      R: t,
      onOpen: () => {
        Bi();
      }
    });
    e.addPrefix(Ms, n, {
      id: "question-modal.settings-btn",
      order: ks
    }), console.log("[question-modal] settings entry registered (order " + ks + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function Gi() {
  const r = Ra();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return $a(), r.toolRender(Ms, cs, Ti), console.log("[question-modal] registered via chat.toolRender for", cs), Ji(r), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!Gi()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
