var oo = Object.defineProperty;
var Hn = (r) => {
  throw TypeError(r);
};
var so = (r, e, t) => e in r ? oo(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var C = (r, e, t) => so(r, typeof e != "symbol" ? e + "" : e, t), ao = (r, e, t) => e.has(r) || Hn("Cannot " + t);
var Zn = (r, e, t) => e.has(r) ? Hn("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var dt = (r, e, t) => (ao(r, e, "access private method"), t);
function an() {
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
let ve = an();
function or(r) {
  ve = r;
}
const sr = /[&<>"']/, io = new RegExp(sr.source, "g"), ar = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, lo = new RegExp(ar.source, "g"), co = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Jn = (r) => co[r];
function F(r, e) {
  if (e) {
    if (sr.test(r))
      return r.replace(io, Jn);
  } else if (ar.test(r))
    return r.replace(lo, Jn);
  return r;
}
const uo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function po(r) {
  return r.replace(uo, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const fo = /(^|[^\[])\^/g;
function z(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (o, s) => {
      let a = typeof s == "string" ? s : s.source;
      return a = a.replace(fo, "$1"), t = t.replace(o, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function Un(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const Ze = { exec: () => null };
function Qn(r, e) {
  const t = r.replace(/\|/g, (s, a, c) => {
    let i = !1, g = a;
    for (; --g >= 0 && c[g] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), n = t.split(/ \|/);
  let o = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), e)
    if (n.length > e)
      n.splice(e);
    else
      for (; n.length < e; )
        n.push("");
  for (; o < n.length; o++)
    n[o] = n[o].trim().replace(/\\\|/g, "|");
  return n;
}
function ft(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let o = 0;
  for (; o < n && r.charAt(n - o - 1) === e; )
    o++;
  return r.slice(0, n - o);
}
function ho(r, e) {
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
function Xn(r, e, t, n) {
  const o = e.href, s = e.title ? F(e.title) : null, a = r[1].replace(/\\([\[\]])/g, "$1");
  if (r[0].charAt(0) !== "!") {
    n.state.inLink = !0;
    const c = {
      type: "link",
      raw: t,
      href: o,
      title: s,
      text: a,
      tokens: n.inlineTokens(a)
    };
    return n.state.inLink = !1, c;
  }
  return {
    type: "image",
    raw: t,
    href: o,
    title: s,
    text: F(a)
  };
}
function mo(r, e) {
  const t = r.match(/^(\s+)(?:```)/);
  if (t === null)
    return e;
  const n = t[1];
  return e.split(`
`).map((o) => {
    const s = o.match(/^\s+/);
    if (s === null)
      return o;
    const [a] = s;
    return a.length >= n.length ? o.slice(n.length) : o;
  }).join(`
`);
}
class yt {
  // set by the lexer
  constructor(e) {
    C(this, "options");
    C(this, "rules");
    // set by the lexer
    C(this, "lexer");
    this.options = e || ve;
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
        text: this.options.pedantic ? n : ft(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], o = mo(n, t[3] || "");
      return {
        type: "code",
        raw: n,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: o
      };
    }
  }
  heading(e) {
    const t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (/#$/.test(n)) {
        const o = ft(n, "#");
        (this.options.pedantic || !o || / $/.test(o)) && (n = o.trim());
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
      n = ft(n.replace(/^ *>[ \t]?/gm, ""), `
`);
      const o = this.lexer.state.top;
      this.lexer.state.top = !0;
      const s = this.lexer.blockTokens(n);
      return this.lexer.state.top = o, {
        type: "blockquote",
        raw: t[0],
        tokens: s,
        text: n
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim();
      const o = n.length > 1, s = {
        type: "list",
        raw: "",
        ordered: o,
        start: o ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = o ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = o ? n : "[*+-]");
      const a = new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let c = "", i = "", g = !1;
      for (; e; ) {
        let f = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let y = t[2].split(`
`, 1)[0].replace(/^\t+/, (j) => " ".repeat(3 * j.length)), h = e.split(`
`, 1)[0], x = 0;
        this.options.pedantic ? (x = 2, i = y.trimStart()) : (x = t[2].search(/[^ ]/), x = x > 4 ? 1 : x, i = y.slice(x), x += t[1].length);
        let m = !1;
        if (!y && /^ *$/.test(h) && (c += h + `
`, e = e.substring(h.length + 1), f = !0), !f) {
          const j = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), U = new RegExp(`^ {0,${Math.min(3, x - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), v = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:\`\`\`|~~~)`), q = new RegExp(`^ {0,${Math.min(3, x - 1)}}#`);
          for (; e; ) {
            const S = e.split(`
`, 1)[0];
            if (h = S, this.options.pedantic && (h = h.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), v.test(h) || q.test(h) || j.test(h) || U.test(e))
              break;
            if (h.search(/[^ ]/) >= x || !h.trim())
              i += `
` + h.slice(x);
            else {
              if (m || y.search(/[^ ]/) >= 4 || v.test(y) || q.test(y) || U.test(y))
                break;
              i += `
` + h;
            }
            !m && !h.trim() && (m = !0), c += S + `
`, e = e.substring(S.length + 1), y = h.slice(x);
          }
        }
        s.loose || (g ? s.loose = !0 : /\n *\n *$/.test(c) && (g = !0));
        let b = null, R;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (R = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: R,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += c;
      }
      s.items[s.items.length - 1].raw = c.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let f = 0; f < s.items.length; f++)
        if (this.lexer.state.top = !1, s.items[f].tokens = this.lexer.blockTokens(s.items[f].text, []), !s.loose) {
          const y = s.items[f].tokens.filter((x) => x.type === "space"), h = y.length > 0 && y.some((x) => /\n.*\n/.test(x.raw));
          s.loose = h;
        }
      if (s.loose)
        for (let f = 0; f < s.items.length; f++)
          s.items[f].loose = !0;
      return s;
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
      const n = t[1].toLowerCase().replace(/\s+/g, " "), o = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: n,
        raw: t[0],
        href: o,
        title: s
      };
    }
  }
  table(e) {
    const t = this.rules.block.table.exec(e);
    if (!t || !/[:|]/.test(t[2]))
      return;
    const n = Qn(t[1]), o = t[2].replace(/^\||\| *$/g, "").split("|"), s = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
`) : [], a = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === o.length) {
      for (const c of o)
        /^ *-+: *$/.test(c) ? a.align.push("right") : /^ *:-+: *$/.test(c) ? a.align.push("center") : /^ *:-+ *$/.test(c) ? a.align.push("left") : a.align.push(null);
      for (const c of n)
        a.header.push({
          text: c,
          tokens: this.lexer.inline(c)
        });
      for (const c of s)
        a.rows.push(Qn(c, a.header.length).map((i) => ({
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
        text: F(t[1])
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
        const a = ft(n.slice(0, -1), "\\");
        if ((n.length - a.length) % 2 === 0)
          return;
      } else {
        const a = ho(t[2], "()");
        if (a > -1) {
          const i = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + a;
          t[2] = t[2].substring(0, a), t[0] = t[0].substring(0, i).trim(), t[3] = "";
        }
      }
      let o = t[2], s = "";
      if (this.options.pedantic) {
        const a = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(o);
        a && (o = a[1], s = a[3]);
      } else
        s = t[3] ? t[3].slice(1, -1) : "";
      return o = o.trim(), /^</.test(o) && (this.options.pedantic && !/>$/.test(n) ? o = o.slice(1) : o = o.slice(1, -1)), Xn(t, {
        href: o && o.replace(this.rules.inline.anyPunctuation, "$1"),
        title: s && s.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      const o = (n[2] || n[1]).replace(/\s+/g, " "), s = t[o.toLowerCase()];
      if (!s) {
        const a = n[0].charAt(0);
        return {
          type: "text",
          raw: a,
          text: a
        };
      }
      return Xn(n, s, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let o = this.rules.inline.emStrongLDelim.exec(e);
    if (!o || o[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(o[1] || o[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...o[0]].length - 1;
      let c, i, g = a, f = 0;
      const y = o[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (y.lastIndex = 0, t = t.slice(-1 * e.length + a); (o = y.exec(t)) != null; ) {
        if (c = o[1] || o[2] || o[3] || o[4] || o[5] || o[6], !c)
          continue;
        if (i = [...c].length, o[3] || o[4]) {
          g += i;
          continue;
        } else if ((o[5] || o[6]) && a % 3 && !((a + i) % 3)) {
          f += i;
          continue;
        }
        if (g -= i, g > 0)
          continue;
        i = Math.min(i, i + g + f);
        const h = [...o[0]][0].length, x = e.slice(0, a + o.index + h + i);
        if (Math.min(a, i) % 2) {
          const b = x.slice(1, -1);
          return {
            type: "em",
            raw: x,
            text: b,
            tokens: this.lexer.inlineTokens(b)
          };
        }
        const m = x.slice(2, -2);
        return {
          type: "strong",
          raw: x,
          text: m,
          tokens: this.lexer.inlineTokens(m)
        };
      }
    }
  }
  codespan(e) {
    const t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(/\n/g, " ");
      const o = /[^ ]/.test(n), s = /^ /.test(n) && / $/.test(n);
      return o && s && (n = n.substring(1, n.length - 1)), n = F(n, !0), {
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
      let n, o;
      return t[2] === "@" ? (n = F(t[1]), o = "mailto:" + n) : (n = F(t[1]), o = n), {
        type: "link",
        raw: t[0],
        text: n,
        href: o,
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
      let o, s;
      if (t[2] === "@")
        o = F(t[0]), s = "mailto:" + o;
      else {
        let a;
        do
          a = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (a !== t[0]);
        o = F(t[0]), t[1] === "www." ? s = "http://" + t[0] : s = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: o,
        href: s,
        tokens: [
          {
            type: "text",
            raw: o,
            text: o
          }
        ]
      };
    }
  }
  inlineText(e) {
    const t = this.rules.inline.text.exec(e);
    if (t) {
      let n;
      return this.lexer.state.inRawBlock ? n = t[0] : n = F(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const go = /^(?: *(?:\n|$))+/, bo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, yo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Qe = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, xo = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, ir = /(?:[*+-]|\d{1,9}[.)])/, lr = z(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, ir).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), ln = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, ko = /^[^\n]+/, cn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, wo = z(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", cn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), vo = z(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ir).getRegex(), _t = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", un = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, So = z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", un).replace("tag", _t).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), cr = z(ln).replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _t).getRegex(), _o = z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", cr).getRegex(), pn = {
  blockquote: _o,
  code: bo,
  def: wo,
  fences: yo,
  heading: xo,
  hr: Qe,
  html: So,
  lheading: lr,
  list: vo,
  newline: go,
  paragraph: cr,
  table: Ze,
  text: ko
}, Gn = z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _t).getRegex(), Eo = {
  ...pn,
  table: Gn,
  paragraph: z(ln).replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Gn).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", _t).getRegex()
}, Ro = {
  ...pn,
  html: z(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", un).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ze,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: z(ln).replace("hr", Qe).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", lr).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, ur = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, To = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, pr = /^( {2,}|\\)\n(?!\s*$)/, Ao = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Xe = "\\p{P}\\p{S}", Io = z(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Xe).getRegex(), qo = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, $o = z(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Xe).getRegex(), zo = z("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Xe).getRegex(), Co = z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Xe).getRegex(), Oo = z(/\\([punct])/, "gu").replace(/punct/g, Xe).getRegex(), Po = z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Bo = z(un).replace("(?:-->|$)", "-->").getRegex(), No = z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Bo).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), xt = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Lo = z(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", xt).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), dr = z(/^!?\[(label)\]\[(ref)\]/).replace("label", xt).replace("ref", cn).getRegex(), fr = z(/^!?\[(ref)\](?:\[\])?/).replace("ref", cn).getRegex(), jo = z("reflink|nolink(?!\\()", "g").replace("reflink", dr).replace("nolink", fr).getRegex(), dn = {
  _backpedal: Ze,
  // only used for GFM url
  anyPunctuation: Oo,
  autolink: Po,
  blockSkip: qo,
  br: pr,
  code: To,
  del: Ze,
  emStrongLDelim: $o,
  emStrongRDelimAst: zo,
  emStrongRDelimUnd: Co,
  escape: ur,
  link: Lo,
  nolink: fr,
  punctuation: Io,
  reflink: dr,
  reflinkSearch: jo,
  tag: No,
  text: Ao,
  url: Ze
}, Mo = {
  ...dn,
  link: z(/^!?\[(label)\]\((.*?)\)/).replace("label", xt).getRegex(),
  reflink: z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", xt).getRegex()
}, rn = {
  ...dn,
  escape: z(ur).replace("])", "~|])").getRegex(),
  url: z(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Do = {
  ...rn,
  br: z(pr).replace("{2,}", "*").getRegex(),
  text: z(rn.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, ht = {
  normal: pn,
  gfm: Eo,
  pedantic: Ro
}, Fe = {
  normal: dn,
  gfm: rn,
  breaks: Do,
  pedantic: Mo
};
class K {
  constructor(e) {
    C(this, "tokens");
    C(this, "options");
    C(this, "state");
    C(this, "tokenizer");
    C(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || ve, this.options.tokenizer = this.options.tokenizer || new yt(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: ht.normal,
      inline: Fe.normal
    };
    this.options.pedantic ? (t.block = ht.pedantic, t.inline = Fe.pedantic) : this.options.gfm && (t.block = ht.gfm, this.options.breaks ? t.inline = Fe.breaks : t.inline = Fe.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: ht,
      inline: Fe
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new K(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new K(t).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, i, g) => i + "    ".repeat(g.length));
    let n, o, s, a;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((c) => (n = c.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
        if (n = this.tokenizer.space(e)) {
          e = e.substring(n.raw.length), n.raw.length === 1 && t.length > 0 ? t[t.length - 1].raw += `
` : t.push(n);
          continue;
        }
        if (n = this.tokenizer.code(e)) {
          e = e.substring(n.raw.length), o = t[t.length - 1], o && (o.type === "paragraph" || o.type === "text") ? (o.raw += `
` + n.raw, o.text += `
` + n.text, this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(n);
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
          e = e.substring(n.raw.length), o = t[t.length - 1], o && (o.type === "paragraph" || o.type === "text") ? (o.raw += `
` + n.raw, o.text += `
` + n.raw, this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : this.tokens.links[n.tag] || (this.tokens.links[n.tag] = {
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
        if (s = e, this.options.extensions && this.options.extensions.startBlock) {
          let c = 1 / 0;
          const i = e.slice(1);
          let g;
          this.options.extensions.startBlock.forEach((f) => {
            g = f.call({ lexer: this }, i), typeof g == "number" && g >= 0 && (c = Math.min(c, g));
          }), c < 1 / 0 && c >= 0 && (s = e.substring(0, c + 1));
        }
        if (this.state.top && (n = this.tokenizer.paragraph(s))) {
          o = t[t.length - 1], a && o.type === "paragraph" ? (o.raw += `
` + n.raw, o.text += `
` + n.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(n), a = s.length !== e.length, e = e.substring(n.raw.length);
          continue;
        }
        if (n = this.tokenizer.text(e)) {
          e = e.substring(n.raw.length), o = t[t.length - 1], o && o.type === "text" ? (o.raw += `
` + n.raw, o.text += `
` + n.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(n);
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
    let n, o, s, a = e, c, i, g;
    if (this.tokens.links) {
      const f = Object.keys(this.tokens.links);
      if (f.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(a)) != null; )
          f.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(a)) != null; )
      a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(a)) != null; )
      a = a.slice(0, c.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (g = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((f) => (n = f.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
        if (n = this.tokenizer.escape(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.tag(e)) {
          e = e.substring(n.raw.length), o = t[t.length - 1], o && n.type === "text" && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
          continue;
        }
        if (n = this.tokenizer.link(e)) {
          e = e.substring(n.raw.length), t.push(n);
          continue;
        }
        if (n = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(n.raw.length), o = t[t.length - 1], o && n.type === "text" && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
          continue;
        }
        if (n = this.tokenizer.emStrong(e, a, g)) {
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
        if (s = e, this.options.extensions && this.options.extensions.startInline) {
          let f = 1 / 0;
          const y = e.slice(1);
          let h;
          this.options.extensions.startInline.forEach((x) => {
            h = x.call({ lexer: this }, y), typeof h == "number" && h >= 0 && (f = Math.min(f, h));
          }), f < 1 / 0 && f >= 0 && (s = e.substring(0, f + 1));
        }
        if (n = this.tokenizer.inlineText(s)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (g = n.raw.slice(-1)), i = !0, o = t[t.length - 1], o && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
          continue;
        }
        if (e) {
          const f = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(f);
            break;
          } else
            throw new Error(f);
        }
      }
    return t;
  }
}
class kt {
  constructor(e) {
    C(this, "options");
    this.options = e || ve;
  }
  code(e, t, n) {
    var s;
    const o = (s = (t || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, o ? '<pre><code class="language-' + F(o) + '">' + (n ? e : F(e, !0)) + `</code></pre>
` : "<pre><code>" + (n ? e : F(e, !0)) + `</code></pre>
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
    const o = t ? "ol" : "ul", s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + o + s + `>
` + e + "</" + o + `>
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
    const o = Un(e);
    if (o === null)
      return n;
    e = o;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + t + '"'), s += ">" + n + "</a>", s;
  }
  image(e, t, n) {
    const o = Un(e);
    if (o === null)
      return n;
    e = o;
    let s = `<img src="${e}" alt="${n}"`;
    return t && (s += ` title="${t}"`), s += ">", s;
  }
  text(e) {
    return e;
  }
}
class fn {
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
class ee {
  constructor(e) {
    C(this, "options");
    C(this, "renderer");
    C(this, "textRenderer");
    this.options = e || ve, this.options.renderer = this.options.renderer || new kt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new fn();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new ee(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new ee(t).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, t = !0) {
    let n = "";
    for (let o = 0; o < e.length; o++) {
      const s = e[o];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const a = s, c = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(a.type)) {
          n += c || "";
          continue;
        }
      }
      switch (s.type) {
        case "space":
          continue;
        case "hr": {
          n += this.renderer.hr();
          continue;
        }
        case "heading": {
          const a = s;
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, po(this.parseInline(a.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const a = s;
          n += this.renderer.code(a.text, a.lang, !!a.escaped);
          continue;
        }
        case "table": {
          const a = s;
          let c = "", i = "";
          for (let f = 0; f < a.header.length; f++)
            i += this.renderer.tablecell(this.parseInline(a.header[f].tokens), { header: !0, align: a.align[f] });
          c += this.renderer.tablerow(i);
          let g = "";
          for (let f = 0; f < a.rows.length; f++) {
            const y = a.rows[f];
            i = "";
            for (let h = 0; h < y.length; h++)
              i += this.renderer.tablecell(this.parseInline(y[h].tokens), { header: !1, align: a.align[h] });
            g += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, g);
          continue;
        }
        case "blockquote": {
          const a = s, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = s, c = a.ordered, i = a.start, g = a.loose;
          let f = "";
          for (let y = 0; y < a.items.length; y++) {
            const h = a.items[y], x = h.checked, m = h.task;
            let b = "";
            if (h.task) {
              const R = this.renderer.checkbox(!!x);
              g ? h.tokens.length > 0 && h.tokens[0].type === "paragraph" ? (h.tokens[0].text = R + " " + h.tokens[0].text, h.tokens[0].tokens && h.tokens[0].tokens.length > 0 && h.tokens[0].tokens[0].type === "text" && (h.tokens[0].tokens[0].text = R + " " + h.tokens[0].tokens[0].text)) : h.tokens.unshift({
                type: "text",
                text: R + " "
              }) : b += R + " ";
            }
            b += this.parse(h.tokens, g), f += this.renderer.listitem(b, m, !!x);
          }
          n += this.renderer.list(f, c, i);
          continue;
        }
        case "html": {
          const a = s;
          n += this.renderer.html(a.text, a.block);
          continue;
        }
        case "paragraph": {
          const a = s;
          n += this.renderer.paragraph(this.parseInline(a.tokens));
          continue;
        }
        case "text": {
          let a = s, c = a.tokens ? this.parseInline(a.tokens) : a.text;
          for (; o + 1 < e.length && e[o + 1].type === "text"; )
            a = e[++o], c += `
` + (a.tokens ? this.parseInline(a.tokens) : a.text);
          n += t ? this.renderer.paragraph(c) : c;
          continue;
        }
        default: {
          const a = 'Token with "' + s.type + '" type was not found.';
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
    for (let o = 0; o < e.length; o++) {
      const s = e[o];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const a = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          n += a || "";
          continue;
        }
      }
      switch (s.type) {
        case "escape": {
          const a = s;
          n += t.text(a.text);
          break;
        }
        case "html": {
          const a = s;
          n += t.html(a.text);
          break;
        }
        case "link": {
          const a = s;
          n += t.link(a.href, a.title, this.parseInline(a.tokens, t));
          break;
        }
        case "image": {
          const a = s;
          n += t.image(a.href, a.title, a.text);
          break;
        }
        case "strong": {
          const a = s;
          n += t.strong(this.parseInline(a.tokens, t));
          break;
        }
        case "em": {
          const a = s;
          n += t.em(this.parseInline(a.tokens, t));
          break;
        }
        case "codespan": {
          const a = s;
          n += t.codespan(a.text);
          break;
        }
        case "br": {
          n += t.br();
          break;
        }
        case "del": {
          const a = s;
          n += t.del(this.parseInline(a.tokens, t));
          break;
        }
        case "text": {
          const a = s;
          n += t.text(a.text);
          break;
        }
        default: {
          const a = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return n;
  }
}
class Je {
  constructor(e) {
    C(this, "options");
    this.options = e || ve;
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
C(Je, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var we, on, hr;
class Fo {
  constructor(...e) {
    Zn(this, we);
    C(this, "defaults", an());
    C(this, "options", this.setOptions);
    C(this, "parse", dt(this, we, on).call(this, K.lex, ee.parse));
    C(this, "parseInline", dt(this, we, on).call(this, K.lexInline, ee.parseInline));
    C(this, "Parser", ee);
    C(this, "Renderer", kt);
    C(this, "TextRenderer", fn);
    C(this, "Lexer", K);
    C(this, "Tokenizer", yt);
    C(this, "Hooks", Je);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var o, s;
    let n = [];
    for (const a of e)
      switch (n = n.concat(t.call(this, a)), a.type) {
        case "table": {
          const c = a;
          for (const i of c.header)
            n = n.concat(this.walkTokens(i.tokens, t));
          for (const i of c.rows)
            for (const g of i)
              n = n.concat(this.walkTokens(g.tokens, t));
          break;
        }
        case "list": {
          const c = a;
          n = n.concat(this.walkTokens(c.items, t));
          break;
        }
        default: {
          const c = a;
          (s = (o = this.defaults.extensions) == null ? void 0 : o.childTokens) != null && s[c.type] ? this.defaults.extensions.childTokens[c.type].forEach((i) => {
            const g = c[i].flat(1 / 0);
            n = n.concat(this.walkTokens(g, t));
          }) : c.tokens && (n = n.concat(this.walkTokens(c.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      const o = { ...n };
      if (o.async = this.defaults.async || o.async || !1, n.extensions && (n.extensions.forEach((s) => {
        if (!s.name)
          throw new Error("extension name required");
        if ("renderer" in s) {
          const a = t.renderers[s.name];
          a ? t.renderers[s.name] = function(...c) {
            let i = s.renderer.apply(this, c);
            return i === !1 && (i = a.apply(this, c)), i;
          } : t.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const a = t[s.level];
          a ? a.unshift(s.tokenizer) : t[s.level] = [s.tokenizer], s.start && (s.level === "block" ? t.startBlock ? t.startBlock.push(s.start) : t.startBlock = [s.start] : s.level === "inline" && (t.startInline ? t.startInline.push(s.start) : t.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (t.childTokens[s.name] = s.childTokens);
      }), o.extensions = t), n.renderer) {
        const s = this.defaults.renderer || new kt(this.defaults);
        for (const a in n.renderer) {
          if (!(a in s))
            throw new Error(`renderer '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.renderer[c], g = s[c];
          s[c] = (...f) => {
            let y = i.apply(s, f);
            return y === !1 && (y = g.apply(s, f)), y || "";
          };
        }
        o.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new yt(this.defaults);
        for (const a in n.tokenizer) {
          if (!(a in s))
            throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a))
            continue;
          const c = a, i = n.tokenizer[c], g = s[c];
          s[c] = (...f) => {
            let y = i.apply(s, f);
            return y === !1 && (y = g.apply(s, f)), y;
          };
        }
        o.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new Je();
        for (const a in n.hooks) {
          if (!(a in s))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], g = s[c];
          Je.passThroughHooks.has(a) ? s[c] = (f) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, f)).then((h) => g.call(s, h));
            const y = i.call(s, f);
            return g.call(s, y);
          } : s[c] = (...f) => {
            let y = i.apply(s, f);
            return y === !1 && (y = g.apply(s, f)), y;
          };
        }
        o.hooks = s;
      }
      if (n.walkTokens) {
        const s = this.defaults.walkTokens, a = n.walkTokens;
        o.walkTokens = function(c) {
          let i = [];
          return i.push(a.call(this, c)), s && (i = i.concat(s.call(this, c))), i;
        };
      }
      this.defaults = { ...this.defaults, ...o };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return K.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return ee.parse(e, t ?? this.defaults);
  }
}
we = new WeakSet(), on = function(e, t) {
  return (n, o) => {
    const s = { ...o }, a = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = dt(this, we, hr).call(this, !!a.silent, !!a.async);
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
      let g = t(i, a);
      return a.hooks && (g = a.hooks.postprocess(g)), g;
    } catch (i) {
      return c(i);
    }
  };
}, hr = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const o = "<p>An error occurred:</p><pre>" + F(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(o) : o;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const ke = new Fo();
function I(r, e) {
  return ke.parse(r, e);
}
I.options = I.setOptions = function(r) {
  return ke.setOptions(r), I.defaults = ke.defaults, or(I.defaults), I;
};
I.getDefaults = an;
I.defaults = ve;
I.use = function(...r) {
  return ke.use(...r), I.defaults = ke.defaults, or(I.defaults), I;
};
I.walkTokens = function(r, e) {
  return ke.walkTokens(r, e);
};
I.parseInline = ke.parseInline;
I.Parser = ee;
I.parser = ee.parse;
I.Renderer = kt;
I.TextRenderer = fn;
I.Lexer = K;
I.lexer = K.lex;
I.Tokenizer = yt;
I.Hooks = Je;
I.parse = I;
I.options;
I.setOptions;
I.use;
I.walkTokens;
I.parseInline;
ee.parse;
K.lex;
const Wo = "question-modal", Vn = "question_modal";
function $e() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function Ho() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function ze() {
  return $e().antd || {};
}
function Zo() {
  return $e().antdIcons || {};
}
const Jo = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Vt(r) {
  const e = Zo();
  for (const t of Jo) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Uo() {
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
      "}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function N(r) {
  try {
    const e = $e();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let mr = "", gr = "";
function hn(r, e) {
  r && (gr = r), e && (mr = e);
}
function L() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = $e(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = mr), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function br() {
  try {
    const e = $e();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : gr;
}
function se(r) {
  const e = Ue(r);
  return e && e.session_id ? e.session_id : br();
}
const mn = "qm:v1:analysis:global", Qo = "qm:v1:analysis:", sn = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function yr(r) {
  if (!r || typeof r != "object") return { ...sn };
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
function Yn() {
  try {
    const r = localStorage.getItem(mn);
    return r ? yr(JSON.parse(r)) : { ...sn };
  } catch {
    return { ...sn };
  }
}
function Kn(r) {
  try {
    localStorage.setItem(mn, JSON.stringify(r));
  } catch {
  }
}
function Xo() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(Qo) === 0 && t !== mn && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function Go() {
  try {
    const r = await fetch(N("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : yr(e.prefs);
  } catch {
    return null;
  }
}
function Vo(r) {
  const e = {
    mode: r.mode,
    model_id: r.modelId,
    with_context: r.withContext,
    parallel: r.parallel
  };
  try {
    fetch(N("/question-modal/prefs"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(e)
    }).catch(() => {
    });
  } catch {
  }
}
async function Yo() {
  try {
    const r = await fetch(N("/question-modal/templates"), { headers: L() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function Ko(r) {
  try {
    const e = await fetch(N("/question-modal/templates"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(r)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function es(r) {
  try {
    const e = await fetch(N("/question-modal/templates/" + encodeURIComponent(r)), {
      method: "DELETE",
      headers: L()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ts() {
  try {
    const r = await fetch(N("/models"), { headers: L() });
    if (!r.ok) return [];
    const e = await r.json();
    return (Array.isArray(e) ? e : []).filter((n) => {
      const s = [...n.models || [], ...n.extra_models || []].length > 0, a = !!n.api_key || n.require_api_key === !1 || n.is_local || n.is_custom;
      return s && a;
    });
  } catch {
    return [];
  }
}
async function ns() {
  try {
    const r = await fetch(N("/models/active"), { headers: L() });
    if (!r.ok) return {};
    const e = await r.json();
    return (e == null ? void 0 : e.active_llm) || {};
  } catch {
    return {};
  }
}
function rs(r) {
  if (!r) return "";
  try {
    return String(I.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function $(r, e) {
  try {
    const t = ze().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const xe = "__other__";
function J(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function er(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function os(r, e, t) {
  if (!t.length) return !1;
  const n = J(e), o = te(e);
  return t.some((s) => s === n || s === o || s.replace(/^\s*推荐\s*[·:：\-]\s*/, "") === n || s.replace(/^\s*推荐\s*[·:：-]\s*/, "") === o);
}
function D(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
function te(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function ss(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (s) => {
    s != null && s !== "" && t.add(String(s));
  }, o = r.options || [];
  if (D(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = o.find((i) => J(i) === String(a));
      c && n(te(c)), String(a) === xe && e.other && n(e.other);
    });
  else {
    n(e.value);
    const s = o.find((a) => J(a) === String(e.value));
    s && n(te(s)), String(e.value) === xe && e.other && n(e.other);
  }
  return t;
}
function as(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const o = String(n);
    if (o.startsWith("=")) return e.has(o.slice(1));
    if (e.has(o)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(o) !== -1 || o.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function xr(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const o = parseInt(t[1], 10);
    if (o >= 0 && o < e.length) return o;
  }
  return e.findIndex((o) => (o.title || "").trim() === r.trim());
}
function kr(r, e, t) {
  const n = e[r], o = n && n.showIf;
  if (!o || typeof o != "object" || !Object.keys(o).length) return !0;
  for (const s of Object.keys(o)) {
    const a = xr(s, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !kr(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !as(o[s], ss(c, i))) return !1;
  }
  return !0;
}
function He(r, e) {
  const t = [];
  return r.forEach((n, o) => {
    kr(o, r, e) && t.push(o);
  }), t;
}
function is(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function Yt(r) {
  return Array.isArray(r.questions);
}
function ls(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function cs(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((o) => o && (o.text || o.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function us(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function ps(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers)
    return `已跳过本次问卷。

` + bt(r);
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((o) => {
    const s = t[o];
    if (!s || typeof s != "object") return;
    const a = xr(o, r), c = a >= 0 ? r[a] : null, i = c ? D(c) === "single" ? "单选" : D(c) === "multi" ? "多选" : "问答" : "问答", g = c ? c.title : o;
    let f = s.value;
    Array.isArray(f) && (f = f.join("、")), s.other && (f = (f ? f + "、" : "") + s.other), s.skipped ? n.push(`- ${o} [${i}] ${g}（用户跳过本题）`) : n.push(`- ${o} [${i}] ${g}：${f === "" || f == null ? "（空）" : f}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function ds(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      N("/question-modal/resolve") + "?" + t.toString(),
      { headers: L() }
    );
    if (!n.ok) return { kind: "error" };
    const o = await n.json();
    return o && hn(o.session_id, o.agent_id), o && o.found ? { kind: "found", data: o } : o && o.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Kt(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      N("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function fs(r) {
  try {
    const e = new FormData();
    e.append("file", r);
    const t = L();
    delete t["Content-Type"];
    const n = await fetch(
      N("/console/upload"),
      { method: "POST", headers: t, body: e }
    );
    if (!n.ok) {
      const s = await n.text().catch(() => "");
      let a = "HTTP " + n.status;
      try {
        const c = JSON.parse(s);
        c && c.detail && (a = c.detail);
      } catch {
      }
      return { ok: !1, error: `${r.name}: ${a}` };
    }
    const o = await n.json();
    return !o || !o.url ? { ok: !1, error: `${r.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(o.url), file_name: String(o.file_name || r.name), size: o.size }
    };
  } catch (e) {
    return { ok: !1, error: `${r.name}: ${e && e.message || e}` };
  }
}
const wt = "qm:v1:stash_att:", tr = 25 * 1024 * 1024, mt = /* @__PURE__ */ new Map(), gt = /* @__PURE__ */ new Map();
let vt = null, St = 0, en = null;
function nr() {
  const r = St > 0;
  gt.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function hs() {
  if (en) return en;
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
    const n = vt;
    vt = null, !(!n || !t.length) && await wr(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return en = r, r;
}
function ms(r, e, t) {
  if (!r) {
    $("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  vt = { callId: r, target: e, key: t };
  const n = hs();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (vt = null);
}
async function wr(r, e, t, n) {
  St += 1, nr();
  const o = [], s = [];
  try {
    for (const c of r) {
      if (c.size && c.size > tr) {
        s.push(`${c.name}: 文件过大（上限 ${Math.round(tr / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await fs(c);
      i.ok ? o.push(i.att) : s.push(i.error);
    }
  } finally {
    St -= 1, nr();
  }
  const a = mt.get(e);
  if (o.length || s.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      $(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (a)
      try {
        a(o, c, n, s);
      } catch {
      }
    else o.length && gs(e, o, c, n);
  }
}
function gs(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const o = localStorage.getItem(wt + r), s = o ? JSON.parse(o) : [], a = (Array.isArray(s) ? s : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(wt + r, JSON.stringify(a));
    } catch {
    }
}
function bs(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(wt + r);
    if (!e) return [];
    localStorage.removeItem(wt + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function ys(r) {
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
function xs(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function tn(r, e) {
  const t = e || se(r), n = Ue(r), o = n && n.request_id ? n.request_id : "";
  if (o)
    try {
      const s = await fetch(N("/question-modal/skip"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({ request_id: o, session_id: t || "" })
      });
      if (s.ok) {
        const a = await s.json().catch(() => ({}));
        return Q(r), {
          ok: !0,
          released: !0,
          reason: a && a.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return Q(r), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const s = await fetch(
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: L() }
      );
      if (s.ok) {
        const a = await s.json().catch(() => ({})), c = a && typeof a.cancelled == "number" ? a.cancelled : 0;
        return Q(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function rr(r) {
  if (!r) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      N("/console/chat/stop") + "?chat_id=" + encodeURIComponent(r),
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
async function ks() {
  try {
    const r = await fetch(
      N("/question-modal/pending"),
      { headers: L() }
    );
    if (!r.ok) return null;
    const e = await r.json(), t = e && e.items || [];
    if (!Array.isArray(t) || t.length !== 1) return null;
    const n = t[0];
    if (!n || !n.request_id) return null;
    const o = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(n.request_id),
      { headers: L() }
    );
    if (!o.ok) return null;
    const s = await o.json();
    return s && hn(s.session_id, s.agent_id), s && s.found ? s : null;
  } catch {
    return null;
  }
}
const Et = "qm:v1:reqid:", ws = 3e4, vs = 45e3;
function Q(r) {
  if (r)
    try {
      localStorage.removeItem(Et + r);
    } catch {
    }
}
function Ss() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(Et) === 0 && r.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    r.forEach((o) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(o) || "null");
      } catch {
        s = null;
      }
      !s || !s.request_id || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(o) : t.push(o);
    });
    const n = 50;
    if (t.length <= n) return;
    t.map((o) => ({ k: o, ts: (JSON.parse(localStorage.getItem(o) || "{}") || {}).ts || 0 })).sort((o, s) => o.ts - s.ts).slice(0, t.length - n).forEach((o) => localStorage.removeItem(o.k));
  } catch {
  }
}
function _s(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(Et + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), Ss();
    } catch {
    }
}
function Ue(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(Et + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (Q(r), null) : t;
  } catch {
    return null;
  }
}
const gn = "qm:v1:state:";
function vr(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(gn + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function We(r, e) {
  if (r)
    try {
      const n = { ...vr(r) || {}, ...e, ts: Date.now() };
      localStorage.setItem(gn + r, JSON.stringify(n)), Es();
    } catch {
    }
}
function Es() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(gn) === 0 && r.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    r.forEach((o) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(o) || "null");
      } catch {
        s = null;
      }
      !s || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(o) : t.push(o);
    });
    const n = 80;
    if (t.length <= n) return;
    t.map((o) => ({ k: o, ts: (JSON.parse(localStorage.getItem(o) || "{}") || {}).ts || 0 })).sort((o, s) => o.ts - s.ts).slice(0, t.length - n).forEach((o) => localStorage.removeItem(o.k));
  } catch {
  }
}
async function Rs(r) {
  try {
    const e = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && hn(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Ts(r, e, t, n) {
  const o = ["【用户提交的问卷答案】"], s = new Set(He(r, e));
  return r.forEach((a, c) => {
    if (!s.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let g = i.value;
    if (Array.isArray(g))
      g = g.filter((m) => m !== xe).map((m) => {
        const b = (a.options || []).find((R) => J(R) === String(m));
        return b ? te(b) : m;
      }).join("、");
    else {
      const m = (a.options || []).find((b) => J(b) === String(g));
      m && (g = te(m)), String(i.value) === xe && (g = "");
    }
    const f = D(a) === "single" ? "单选" : D(a) === "multi" ? "多选" : "问答", y = !!String(g || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), h = i.skipped || !y ? "（用户跳过本题）" : g;
    let x = `- q${c} [${f}] ${h}`;
    i.other && !i.skipped && (x += `（其他：${i.other}）`), i.attachments && i.attachments.length && (x += `（附件：${i.attachments.map((m) => m.file_name).join("、")}）`), o.push(x);
  }), t && o.push(`- 其他意见：${t}`), n && n.length && o.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), o.join(`
`);
}
function bt(r) {
  return r.map((e, t) => {
    const n = D(e) === "single" ? "单选" : D(e) === "multi" ? "多选" : "问答", o = (e.options || []).map(te).join("、");
    return `${t + 1}. [${n}] ${e.title}${o ? "（" + o + "）" : ""}`;
  }).join(`
`);
}
function nn(r) {
  const { R: e, files: t, disabled: n, uploading: o, error: s, onPick: a, onRemove: c } = r, i = {
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
  }, g = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: n || o ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: n || o ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    t.map((f, y) => e.createElement(
      "span",
      { key: "att" + y, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: f.file_name
      }, f.file_name + (f.size ? "（" + xs(f.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          n || c(y);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: n || o,
      style: g,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, o ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function As(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: o,
    disabled: s,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: g
  } = r, y = ze().Popover, h = [];
  t.forEach((k) => {
    [...k.models || [], ...k.extra_models || []].forEach((E) => {
      h.push({
        providerId: k.id,
        providerName: k.name || k.id,
        modelId: E.id,
        modelName: E.name || E.id,
        free: !!E.is_free
      });
    });
  });
  const x = h.find((k) => `${k.providerId}:${k.modelId}` === n), m = x ? x.modelName : n || "选择模型", b = x ? x.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", R = {
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
  }, j = h.filter((k) => k.free).length, U = h.length - j, v = [];
  t.forEach((k) => {
    const E = [...k.models || [], ...k.extra_models || []].map((O) => ({
      providerId: k.id,
      providerName: k.name || k.id,
      modelId: O.id,
      modelName: O.name || O.id,
      free: !!O.is_free
    })).filter((O) => i === "free" ? O.free : !O.free);
    E.length && v.push({ id: k.id, name: k.name || k.id, models: E });
  });
  const q = (k, E) => e.createElement("button", {
    key: k,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === k ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === k ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === k ? 600 : 400,
      boxShadow: i === k ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => g(k)
  }, E), S = e.createElement(
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
      q("paid", "付费 🟡 " + U),
      q("free", "免费 🟢 " + j)
    ),
    v.length ? e.createElement("div", null, v.map((k, E) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: k.id,
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
          e.createElement("span", { style: { flex: 1 } }, k.name),
          e.createElement("span", { style: { fontWeight: 400 } }, k.models.length)
        ),
        k.models.map((O) => {
          const ae = `${O.providerId}:${O.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${O.providerId}:${O.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (ae ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: ae ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                o(`${O.providerId}:${O.modelId}`), c(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: E % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, O.modelName)
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
  return y ? e.createElement(y, {
    content: S,
    trigger: "click",
    open: a,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: R,
      disabled: s,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, m),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: R,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const k = h.find((E) => `${E.providerId}:${E.modelId}` !== n);
        k && o(`${k.providerId}:${k.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, m),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Is(r) {
  const { R: e, mode: t, onChange: n, disabled: o } = r, s = {
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
    disabled: o,
    style: {
      height: 22,
      padding: "0 8px",
      fontSize: 11,
      borderRadius: 10,
      cursor: o ? "default" : "pointer",
      border: "none",
      whiteSpace: "nowrap",
      background: t === i ? "var(--app-accent, #ff7f16)" : "transparent",
      color: t === i ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
    },
    title: a[i],
    onClick: () => n(i)
  }, s[i]);
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
function qs(r) {
  const { R: e, templates: t, value: n, open: o, onOpenChange: s, disabled: a, onSelect: c, onManage: i } = r, f = ze().Popover, y = (t || []).find((R) => R.id === n), h = y ? y.name : "默认模板", x = {
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
  }, m = e.createElement(
    "div",
    {
      style: {
        width: 240,
        maxHeight: "min(60vh, 320px)",
        overflowY: "auto",
        scrollbarWidth: "none"
      }
    },
    (t || []).map((R) => e.createElement(
      "div",
      {
        key: R.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (R.id === n ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: R.id === n ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          c(R.id), s(!1);
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
      }, R.name),
      R.builtin ? e.createElement("span", {
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
        s(!1), i();
      }
    }, "＋ 管理模板…")
  ), b = e.createElement(
    "button",
    {
      type: "button",
      style: x,
      disabled: a,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, h),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return f ? e.createElement(f, {
    content: m,
    trigger: "click",
    open: o,
    onOpenChange: s,
    placement: "bottomLeft"
  }, b) : b;
}
function $s(r) {
  const { R: e, open: t, templates: n, value: o, edit: s, onEditChange: a, onClose: c, onSelect: i, onSave: g, onDelete: f } = r;
  if (!t) return null;
  const y = ze(), { Input: h, Modal: x } = y, m = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  x || (m.position = "fixed", m.right = 24, m.top = 80, m.width = 420, m.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", m.zIndex = 1100, m.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const b = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, R = !!s, j = (v, q, S, k) => h && h.TextArea ? e.createElement(h.TextArea, {
    value: v,
    rows: S,
    placeholder: k,
    onChange: (E) => q(E && E.target ? E.target.value : "")
  }) : e.createElement("textarea", {
    value: v,
    rows: S,
    placeholder: k,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (E) => q(E && E.target ? E.target.value : ""),
    onChange: (E) => q(E && E.target ? E.target.value : "")
  }), U = e.createElement(
    "div",
    {
      style: m,
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
        R ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: c }, "关闭")
    ),
    R ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      j(s.name || "", (v) => a({ ...s, name: v }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      j(s.system || "", (v) => a({ ...s, system: v }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      j(s.user || "", (v) => a({ ...s, user: v }), 6, "用户提示词模板"),
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
          onClick: () => g(s)
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
        (v) => e.createElement(
          "div",
          {
            key: v.id,
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
            v.name + (v.builtin ? "（内置）" : "") + (v.id === o ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: b,
            title: "设为本题使用",
            onClick: () => i(v.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => a({
              id: v.id,
              name: v.name,
              system: v.system,
              user: v.user
            })
          }, "编辑"),
          v.builtin ? null : e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => f(v.id)
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
  return x ? e.createElement(x, {
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
  }, U) : U;
}
function zs(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: o,
    mode: s,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: g,
    disabled: f,
    children: y,
    open: h,
    onOpenChange: x
  } = r, b = ze().Popover, R = e.createElement("button", {
    type: "button",
    disabled: f,
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
      cursor: f ? "default" : "pointer"
    },
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      x(!h);
    }
  }, t ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      R,
      n && h ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((q) => q.reasoning).join(`

`))) : null
    );
  const j = !!(n && (n.per_question || []).length), U = (q, S, k) => e.createElement("button", {
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
    onClick: S
  }, q), v = e.createElement(
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
    o ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, o) : null,
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
        j && !t ? e.createElement("button", {
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
              (g || a)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        j && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: j ? 6 : "auto",
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
            c(), x(!1);
          }
        }, "套用推荐") : null
      ),
      (n.per_question || []).map((q) => e.createElement(
        "div",
        { key: q.index, style: { marginBottom: 14 } },
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
          }, q.title),
          q.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + q.choice) : null,
          typeof q.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(q.confidence <= 1 ? q.confidence * 100 : q.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: rs(q.reasoning || "") }
        })
      ))
    ) : t || o ? null : e.createElement(
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
      U("开始分析", () => {
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
    }, y)
  );
  return e.createElement(b, {
    content: v,
    trigger: "click",
    open: h,
    onOpenChange: x,
    placement: "bottomRight"
  }, R);
}
function Cs(r) {
  const e = $e().React, t = ze(), { Input: n, Button: o } = t, s = n.TextArea, a = r.data || {}, c = is(a), i = ls(a), g = cs(a), f = us(g), y = f ? "" : g, h = c.questions || [], x = c.title || "问卷", m = vr(i), [b, R] = e.useState(
    () => !!(m && m.answered) || !!y || f
  ), [j, U] = e.useState(""), [v, q] = e.useState(() => {
    const l = Ue(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [S, k] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [E, O] = e.useState(() => {
    const l = {};
    h.forEach((d, p) => {
      l[`q${p}`] = { type: D(d), value: D(d) === "multi" ? [] : "", other: "" };
    });
    const u = m && m.answers;
    return u && typeof u == "object" && Object.keys(u).forEach((d) => {
      l[d] && (l[d] = { ...l[d], ...u[d] });
    }), l;
  }), [ae, Sr] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [P, ie] = e.useState(!1), [Se, Rt] = e.useState(""), [Ce, Tt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [pe, Ge] = e.useState(
    () => !!(m && m.skippedAll) || /跳过了本次问卷/.test(y || "")
  ), [Oe, bn] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [Ve, yn] = e.useState(
    () => !!(m && m.expanded)
  ), [xn, Ye] = e.useState(!1), Ke = e.useRef(0), [et, _r] = e.useState(""), [ne, kn] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Ps, At] = e.useState(() => Date.now()), It = 180, Er = 20, Pe = Yn(), Rr = m && (m.mode === "ai" || m.mode === "recommend" || m.mode === "manual") ? m.mode : Pe.mode, [X, wn] = e.useState(Rr), [qt, $t] = e.useState(Pe.modelId), [tt, vn] = e.useState(Pe.withContext), [nt, Sn] = e.useState(Pe.parallel), [Tr, Ar] = e.useState([]), [_n, zt] = e.useState(!1), [Ct, _e] = e.useState(null), [Ir, de] = e.useState(""), [qr, $r] = e.useState(!1), [zr, Cr] = e.useState(!1), [Or, Pr] = e.useState("paid"), fe = e.useRef({}), re = e.useRef({}), Ee = e.useRef(0), Be = e.useRef(null), [Br, Ne] = e.useState(0), [En, Ot] = e.useState([]), [he, Pt] = e.useState(
    () => m && typeof m.templateId == "string" && m.templateId ? m.templateId : ""
  ), le = e.useRef(he);
  le.current = he;
  const [Nr, Lr] = e.useState(!1), [jr, Rn] = e.useState(!1), [Mr, Bt] = e.useState(null), [G, Tn] = e.useState(
    () => !!(m && m.autoPaused)
  ), Dr = e.useRef(G);
  Dr.current = G;
  const rt = e.useRef(!1), ot = e.useRef({}), [Fr, An] = e.useState(0), Re = e.useRef({}), Nt = e.useRef(!1), In = e.useRef(!1), st = (l) => {
    if (l.mode !== void 0 && (wn(l.mode), We(i, { mode: l.mode })), !(l.modelId !== void 0 || l.withContext !== void 0 || l.parallel !== void 0)) return;
    Nt.current = !0;
    const d = {
      // Keep the GLOBAL default mode untouched — this card's mode is separate.
      // Reading the current global mirror so a model/ctx change here does not
      // stamp this card's (card-scoped) mode back onto the seed.
      mode: Yn().mode,
      modelId: l.modelId !== void 0 ? l.modelId : qt,
      withContext: l.withContext !== void 0 ? l.withContext : tt,
      parallel: l.parallel !== void 0 ? l.parallel : nt
    };
    $t(d.modelId), vn(d.withContext), Sn(d.parallel), Kn(d), Vo(d);
  }, qn = (l) => {
    !l || l === he || (Pt(l), le.current = l, We(i, { templateId: l }), _e(null), fe.current = {}, re.current = {}, Ne((u) => u + 1));
  }, Wr = async (l) => {
    const u = await Ko({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!u.ok) {
      $("error", u.error || "保存失败");
      return;
    }
    Ot(u.items || []), Bt(null), $("success", "模板已保存");
  }, Hr = async (l) => {
    const u = await es(l);
    if (!u.ok) {
      $("warning", u.error || "删除失败");
      return;
    }
    Ot(u.items || []);
    const d = (u.items || []).map((p) => p.id);
    if (d.indexOf(le.current) === -1) {
      const p = d[0] || "";
      Pt(p), le.current = p, We(i, { templateId: p });
    }
    $("success", "模板已删除");
  };
  e.useEffect(() => {
    let l = !0;
    return Xo(), (async () => {
      const [u, d, p] = await Promise.all([
        ts(),
        Go(),
        Yo()
      ]);
      if (!l) return;
      Ar(u), Ot(p.items);
      const w = p.items.map((_) => _.id);
      if (!le.current || w.indexOf(le.current) === -1) {
        const _ = p.defaultId || w[0] || "";
        _ && (Pt(_), le.current = _);
      }
      let A = Pe;
      if (d && !Nt.current && (A = d, m && (m.mode === "ai" || m.mode === "recommend" || m.mode === "manual") || wn(d.mode), $t(d.modelId), vn(d.withContext), Sn(d.parallel), Kn(d)), !Nt.current && !A.modelId) {
        const _ = await ns();
        if (!l) return;
        _ && _.provider_id && _.model && $t(`${_.provider_id}:${_.model}`);
      }
      In.current = !0, Ne((_) => _ + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    Ee.current = S;
  }, [S]);
  const Lt = async (l) => {
    if (_n) return;
    const u = S;
    zt(!0), de("");
    const d = typeof AbortController < "u" ? new AbortController() : null;
    Be.current = d;
    try {
      const p = await fetch(N("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: v,
          tool_call_id: i,
          session_id: se(i),
          title: x,
          questions: h,
          model_id: qt,
          mode: l,
          with_context: tt,
          parallel: nt,
          question_index: u,
          answers: E,
          template_id: le.current
        }),
        signal: d ? d.signal : void 0
      }), w = await p.json().catch(() => ({})), A = w && w.analysis || null, _ = A && A.error || w && w.error || "";
      w && w.cancelled || A && A.cancelled ? de("已终止分析。") : !p.ok || !w || w.ok === !1 || A && A.ok === !1 ? de(_ || "分析失败（服务返回 " + p.status + "）") : A && (fe.current[u] = A, re.current[u] = !0, Ee.current === u && _e(A), $("success", "第 " + (u + 1) + " 题 AI 分析完成"));
    } catch (p) {
      Be.current === d && d && d.signal.aborted || p && p.name === "AbortError" ? de("已终止分析。") : de("分析请求失败：" + (p && p.message ? p.message : p));
    } finally {
      Be.current === d && (Be.current = null), zt(!1), Re.current[u] = !0, An((p) => p + 1);
    }
  }, Zr = () => {
    const l = S;
    delete fe.current[l], _e(null), de(""), Lt("manual");
  }, Te = (l) => {
    var d;
    const u = l !== void 0 ? l : Ee.current;
    try {
      fetch(N("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: v,
          question_index: u
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      (d = Be.current) == null || d.abort();
    } catch {
    }
    zt(!1);
  }, Jr = () => {
    Te(), de("已终止分析。");
  }, Ur = () => {
    G ? (ot.current = {}, Re.current = {}, re.current = {}, rt.current = !1, Tn(!1), Ne((l) => l + 1), $("info", "已恢复自动答题")) : (Te(), Tn(!0), $("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    const l = fe.current[S];
    _e(l || null);
    const u = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + S;
    let d = !0;
    return fetch(N("/question-modal/analysis") + u, { headers: L() }).then((p) => p.ok ? p.json() : null).then((p) => {
      !d || !p || !p.found || !p.analysis || (fe.current[S] = p.analysis, Ee.current === S && _e(p.analysis));
    }).catch(() => {
    }), () => {
      d = !1;
    };
  }, [i, S]), e.useEffect(() => {
    b || In.current && X === "ai" && (!Yt(c) || !h.length || re.current[S] || P || (re.current[S] = !0, Lt("auto")));
  }, [b, X, i, Br, tt, nt, h, S]);
  const Qr = () => {
    const l = Ct && Ct.per_question || [];
    if (!l.length) return;
    if (!l.some((d) => d.type === "multi" ? String(d.choice || "").split(/[、,，]/).map((p) => p.trim()).filter(Boolean).length > 0 : String(d.choice || "").trim().length > 0)) {
      $("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    O((d) => {
      const p = { ...d };
      return l.forEach((w) => {
        const A = `q${w.index}`, _ = p[A] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const ge = String(w.choice || "").split(/[、,，]/).map((H) => H.trim()).filter(Boolean);
          p[A] = { ..._, value: ge };
        } else
          p[A] = { ..._, value: w.choice || _.value };
      }), p;
    }), $("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, me = (l, u, d = !1) => {
    Te(), _r(l), Ge(!0), Tt(u), Ye(!1), R(!0), Q(i), d && We(i, { backendReleased: !0 });
  }, Xr = async (l, u) => {
    const d = await tn(i, se(i));
    return d.ok ? (me(l, u, d.released), !0) : (Ye(!0), Mt(!1), !1);
  };
  e.useEffect(() => {
    We(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: v,
      visStep: S,
      answers: E,
      finalOther: ae,
      finalOtherAtt: Oe,
      answered: b,
      skippedAll: pe,
      expanded: Ve,
      localResult: Ce,
      submittedAt: ne,
      autoPaused: G,
      templateId: he
    });
  }, [
    i,
    v,
    S,
    E,
    ae,
    Oe,
    b,
    pe,
    Ve,
    Ce,
    ne,
    G,
    he
  ]), e.useEffect(() => {
    if (!b || !ne || Date.now() - ne > It * 1e3) return;
    let l = 0;
    const u = () => {
      Date.now() - ne > It * 1e3 || (At(Date.now()), l = setTimeout(u, 1e3));
    };
    return l = setTimeout(u, 1e3), () => {
      l && clearTimeout(l);
    };
  }, [b, ne]);
  const [jt, Mt] = e.useState(!1), [Dt, $n] = e.useState(""), zn = (l, u, d) => {
    l.length && (u === "final" ? bn((p) => p.concat(l)) : O((p) => {
      const w = d || `q${S}`, A = p[w] || { type: "text", value: "", other: "" };
      return { ...p, [w]: { ...A, attachments: (A.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (p, w, A, _) => {
      zn(p, w, A), _ && _.length ? $n(_.join("；")) : $n("");
    }, u = (p) => Mt(p);
    mt.set(i, l), gt.set(i, u);
    const d = bs(i);
    return d.length && d.forEach((p) => zn([p.att], p.target, p.key)), Mt(St > 0), () => {
      mt.get(i) === l && mt.delete(i), gt.get(i) === u && gt.delete(i);
    };
  }, [i, S]);
  const Ft = (l, u) => ms(i, l, u), Wt = (l, u, d) => {
    const p = ys(l);
    if (p.length) {
      try {
        l.preventDefault();
      } catch {
      }
      wr(p, i, u, d);
    }
  };
  e.useEffect(() => {
    if (!f || j) return;
    let l = !0;
    return Kt(i).then((u) => {
      !l || !u || (u.kind === "skipped" && !u.answers && Ge(!0), U(ps(h, u)));
    }), () => {
      l = !1;
    };
  }, [f, i, j]), e.useEffect(() => {
    if (b) return;
    let l = !0, u = 0, d = 0, p = 0;
    Ke.current || (Ke.current = Date.now());
    let w = !!Ue(i);
    const A = (T) => {
      !l || !T || !T.request_id || (w = !0, q(T.request_id), Ye(!1), d && (clearTimeout(d), d = 0), _s(
        i,
        T.request_id,
        T.session_id || br(),
        T.agent_id
      ));
    }, _ = (T) => {
      l && (d && (clearTimeout(d), d = 0), p && (clearTimeout(p), p = 0), Xr(
        T,
        T === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, ge = Ue(i), H = async () => {
      if (!ge) return !1;
      const T = await Rs(ge.request_id);
      if (!l) return !0;
      if (T.kind === "found") {
        const M = T.data;
        return M.tool_call_id && i && M.tool_call_id !== i ? (Q(i), !1) : (A(M), !0);
      }
      return T.kind === "orphan" ? (_("orphan"), !0) : (T.kind === "absent" && Q(i), !1);
    }, Me = (T = !1) => {
      if (l) {
        if (u += 1, T) {
          if (w) {
            _("gone");
            return;
          }
          const M = Date.now() - (Ke.current || Date.now());
          if (u >= 12 && M >= vs) {
            _("gone");
            return;
          }
        }
        d = setTimeout(Z, u < 8 ? 700 : 5e3);
      }
    }, oe = () => {
      ds(i, se(i)).then((T) => {
        if (l) {
          if (T.kind === "found") {
            A(T.data);
            return;
          }
          if (T.kind === "orphan") {
            _("orphan");
            return;
          }
          if (T.kind === "error") {
            Me(!1);
            return;
          }
          ks().then((M) => {
            if (l) {
              if (M) {
                if (M.tool_call_id && i && M.tool_call_id !== i) {
                  Kt(i).then((be) => {
                    if (l) {
                      if (be) {
                        R(!0), Q(i);
                        return;
                      }
                      Me(!0);
                    }
                  });
                  return;
                }
                A(M);
                return;
              }
              Kt(i).then((be) => {
                if (l) {
                  if (be) {
                    be.kind === "skipped" && !be.answers && Ge(!0), R(!0), Q(i);
                    return;
                  }
                  Me(!0);
                }
              });
            }
          });
        }
      });
    }, Z = () => {
      if (l) {
        if (!ge) {
          oe();
          return;
        }
        H().then((T) => {
          !l || T || oe();
        });
      }
    };
    return p = setTimeout(() => {
      l && Ye(!0);
    }, ws), Z(), () => {
      l = !1, d && clearTimeout(d), p && clearTimeout(p);
    };
  }, [b, i]);
  const Cn = async () => {
    ie(!0);
    try {
      const l = se(i);
      let u = await tn(i, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await rr(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok)
        throw new Error(
          u.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + u.reason + "）"
        );
      if (u.released) {
        const p = u.reason === "host-stop";
        me(
          u.reason === "orphan" ? "orphan" : "",
          u.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : p ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), $(
          "info",
          p ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        me(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ie(!1);
    }
  }, On = async () => {
    ie(!0);
    try {
      const l = se(i);
      let u = await tn(i, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await rr(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok) {
        Rt(u.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + u.reason + "）。"), $("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (u.released) {
        const p = u.reason === "host-stop";
        Rt(p ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), $("info", p ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        Rt("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), $("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ie(!1);
    }
  }, at = He(h, E), Ae = at.length, ce = S >= Ae, ue = ce ? -1 : at[S], W = ue >= 0 ? h[ue] : null, Ie = `q${ue}`, B = ue >= 0 && E[Ie] || { type: D(W), value: D(W) === "multi" ? [] : "", other: "" }, qe = (l) => O((u) => {
    const d = { ...l, skipped: !1 }, p = { ...u, [Ie]: d }, w = He(h, p);
    return h.forEach((A, _) => {
      w.indexOf(_) === -1 && delete p[`q${_}`];
    }), p;
  });
  e.useEffect(() => {
    S > Ae && k(Ae);
  }, [Ae, S]);
  const Pn = async (l, u) => {
    const d = await fetch(N(l), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(u)
    }), p = await d.json().catch(() => ({}));
    if (!d.ok) {
      const w = new Error(p && p.detail || "HTTP " + d.status);
      throw w.status = d.status, w;
    }
    return p;
  }, Ht = async () => {
    if (!v) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    ie(!0);
    try {
      const l = await Pn("/question-modal/answer", {
        request_id: v,
        session_id: se(i),
        answers: E,
        other: ae,
        attachments: Oe
      });
      if (l && l.orphan) {
        fetch(
          N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(se(i)),
          { method: "POST", headers: L() }
        ).catch(() => {
        }), me(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("success", "✓ 已提交答案"), Q(i), Tt(Ts(h, E, ae, Oe)), kn(Date.now()), At(Date.now()), R(!0);
    } catch (l) {
      if (l && l.status === 404) {
        me(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("error", "提交失败: " + l.message);
    } finally {
      ie(!1);
    }
  }, Gr = () => {
    ue < 0 || (Te(Ee.current), re.current[Ee.current] = !0, O((l) => {
      const u = { ...l };
      u[`q${ue}`] = {
        type: (l[`q${ue}`] || {}).type || D(W),
        value: ((l[`q${ue}`] || {}).type || D(W)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const d = He(h, u);
      return h.forEach((p, w) => {
        d.indexOf(w) === -1 && delete u[`q${w}`];
      }), u;
    }), k((l) => l + 1));
  }, Vr = async () => {
    if (!v) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    Te(), ie(!0);
    try {
      const l = await Pn("/question-modal/skip", {
        request_id: v,
        session_id: se(i)
      });
      if (l && l.orphan) {
        me(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("info", "已跳过问卷"), Q(i), Ge(!0), Tt("用户跳过了本次问卷。"), kn(Date.now()), At(Date.now()), R(!0);
    } catch (l) {
      if (l && l.status === 404) {
        me(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("error", "跳过失败: " + l.message);
    } finally {
      ie(!1);
    }
  };
  e.useEffect(() => {
    if (b || X !== "ai" && X !== "recommend" || G || !Yt(c) || !h.length || P) return;
    if (ce) {
      if (rt.current || !at.every(
        (Z, T) => !!Re.current[T]
      )) return;
      rt.current = !0, Ht();
      return;
    }
    const l = S;
    if (ot.current[l] || X === "ai" && !Re.current[l]) return;
    ot.current[l] = !0;
    const u = at[l], d = h[u], p = D(d), w = er(d), A = fe.current[l], _ = A && A.per_question && A.per_question[0], ge = _ ? String(_.choice || "").trim() : "", H = w.length ? w.join("、") : ge, Me = !!H;
    O((oe) => {
      const Z = { ...oe }, T = `q${u}`, M = Z[T] || { type: p, value: p === "multi" ? [] : "", other: "" };
      if (!Me)
        Z[T] = { ...M, type: p, value: p === "multi" ? [] : "", other: "", skipped: !0 };
      else if (p === "multi") {
        const De = d.options || [], ye = (V) => String(V).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        Z[T] = { ...M, type: p, value: H.split(/[、,，]/).map((V) => ye(V)).filter(Boolean).map((V) => {
          const Y = De.find((Wn) => J(Wn) === V || te(Wn) === V);
          return Y ? J(Y) : V;
        }) };
      } else if (p === "single") {
        const De = d.options || [], ye = (Y) => String(Y).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), V = De.find((Y) => J(Y) === H || te(Y) === H) || De.find((Y) => J(Y) === ye(H) || te(Y) === ye(H));
        Z[T] = { ...M, type: p, value: V ? J(V) : H };
      } else
        Z[T] = { ...M, type: p, value: H };
      const be = He(h, Z);
      return h.forEach((De, ye) => {
        be.indexOf(ye) === -1 && delete Z[`q${ye}`];
      }), Z;
    }), re.current[l] = !0, Re.current[l] = !0, k((oe) => oe + 1), An((oe) => oe + 1);
  }, [b, X, G, P, i, S, Fr, Ae, c]);
  const it = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Zt = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Jt = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, lt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Ut = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Bn = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Qt = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Yr = { display: "flex", flexDirection: "column", gap: 8 }, ct = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, ut = {
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
  }, Le = {
    ...ut,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Kr = {
    ...ut,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Xt = {
    ...ut,
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
  }, Nn = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Xt,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, eo = {
    borderColor: "var(--app-accent-ring, rgba(255,127,22,0.45))",
    background: "var(--app-accent-soft, rgba(255,127,22,0.06))"
  }, to = {
    flex: "none",
    marginLeft: 8,
    fontSize: 10,
    lineHeight: "16px",
    padding: "0 6px",
    borderRadius: 8,
    whiteSpace: "nowrap",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.12))",
    border: "1px solid var(--app-accent-ring, rgba(255,127,22,0.35))"
  }, no = { height: 32, fontSize: 13, borderRadius: 8 }, Ln = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, jn = (l) => {
    const u = J(l);
    return B.type === "multi" ? Array.isArray(B.value) && B.value.indexOf(u) !== -1 : B.value === u;
  }, Mn = jn(xe), Dn = (l) => {
    if (b || P) return;
    const u = J(l);
    if (B.type === "multi") {
      const d = Array.isArray(B.value) ? B.value.slice() : [], p = d.indexOf(u);
      p === -1 ? d.push(u) : d.splice(p, 1), qe({ ...B, value: d, other: d.indexOf(xe) !== -1 ? B.other : "" });
    } else
      qe({ ...B, value: u });
  }, Fn = (l, u, d, p, w) => e.createElement(
    "button",
    {
      key: p,
      type: "button",
      disabled: b || P,
      style: w ? { ...u ? Nn : Xt, ...eo } : u ? Nn : Xt,
      onClick: d
    },
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (u ? "✓ " : "") + l),
    w ? e.createElement("span", {
      key: "rec",
      className: "qm-rec-badge",
      "data-qm-rec": "true",
      style: to
    }, "AI 推荐") : null
  );
  if (!b && !Yt(c))
    return e.createElement(
      "div",
      { style: it, className: "qm-card", "data-qm-card": "true" },
      e.createElement(
        "div",
        { style: Zt, className: "qm-header" },
        e.createElement(
          "div",
          { style: Jt },
          Vt(e),
          e.createElement("span", { style: lt, className: "qm-title" }, x)
        ),
        e.createElement("span", { style: Ut }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Bn, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      xn ? e.createElement(
        "div",
        { style: ct },
        e.createElement("button", {
          type: "button",
          disabled: P,
          style: { ...Le, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Cn
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = ne ? Math.floor((Date.now() - ne) / 1e3) : -1, u = !!ne && !et && !Se && !pe && l >= 0 && l < It, d = l < Er ? "⏳ 已提交，模型思考中… " + l + "s" : "⏳ 已提交，模型思考中… " + l + "s（等待偏久，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」）", p = u ? e.createElement("span", {
      style: {
        fontSize: 12,
        lineHeight: 1.5,
        color: "var(--app-text-secondary, inherit)"
      },
      title: "问卷已提交并放行，agent 正在生成回复"
    }, d) : null;
    return pe && !Ve ? e.createElement(
      "div",
      {
        style: {
          ...it,
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
        et ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      e.createElement("span", {
        style: { ...lt, flex: Se ? 0 : 1, opacity: 0.75 }
      }, x),
      Se ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Se) : p,
      e.createElement("button", {
        type: "button",
        style: {
          ...Le,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => yn(!0)
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
        disabled: P,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...Le,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: On
      }, "释放阻塞")
    ) : e.createElement(
      "div",
      { style: it, className: "qm-card", "data-qm-card": "true" },
      e.createElement(
        "div",
        { style: { ...Zt, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Jt },
          Vt(e),
          e.createElement("span", { style: lt }, x)
        ),
        e.createElement(
          "span",
          { style: { ...Ut, color: et ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          et ? "已失效" : pe ? "已跳过" : "已完成"
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
      }, pe ? Ce ? Ce + `

` + bt(h) : `已跳过本次问卷。

` + bt(h) : Ce || j || y || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + bt(h)),
      pe && Ve ? e.createElement(
        "div",
        { style: ct },
        e.createElement("button", {
          type: "button",
          style: Le,
          onClick: () => yn(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...ct, marginTop: 8, gap: 10 } },
        Se ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Se) : p,
        e.createElement("button", {
          type: "button",
          disabled: P,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...Le, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: On
        }, "释放阻塞")
      )
    );
  }
  let pt = null;
  if (ce)
    pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Qt }, "其他意见（可选）"),
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: ae,
        style: Ln,
        onChange: (l) => Sr(l.target.value),
        onPaste: (l) => Wt(l, "final", "final")
      }),
      nn({
        R: e,
        files: Oe,
        disabled: b || P,
        uploading: jt,
        error: Dt,
        onPick: () => Ft("final", "final"),
        onRemove: (l) => bn((u) => u.filter((d, p) => p !== l))
      })
    );
  else if (W && D(W) === "text")
    pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Qt, fontSize: 13, color: "var(--app-text, inherit)" } }, W.title),
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof B.value == "string" ? B.value : "",
        style: Ln,
        onChange: (l) => qe({ ...B, value: l.target.value, other: "" }),
        onPaste: (l) => Wt(l, "q", Ie)
      }),
      nn({
        R: e,
        files: B.attachments || [],
        disabled: b || P,
        uploading: jt,
        error: Dt,
        onPick: () => Ft("q", Ie),
        onRemove: (l) => qe({
          ...B,
          attachments: (B.attachments || []).filter((u, d) => d !== l)
        })
      })
    );
  else if (W) {
    const l = er(W), u = (W.options || []).map((d, p) => Fn(
      te(d),
      jn(d),
      () => Dn(d),
      "o" + p,
      os(W, d, l)
    ));
    u.push(Fn("其他", Mn, () => Dn(xe), "other")), Mn && (u.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: B.other,
      style: { ...no, marginTop: 2 },
      onChange: (d) => qe({ ...B, other: d.target.value }),
      onPaste: (d) => Wt(d, "q", Ie)
    })), u.push(nn({
      R: e,
      files: B.attachments || [],
      disabled: b || P,
      uploading: jt,
      error: Dt,
      onPick: () => Ft("q", Ie),
      onRemove: (d) => qe({
        ...B,
        attachments: (B.attachments || []).filter((p, w) => w !== d)
      })
    }))), pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Qt, fontSize: 13, color: "var(--app-text, inherit)" } }, W.title),
      e.createElement("div", { style: { ...Yr, marginTop: 8 } }, u)
    );
  }
  const Gt = Ae + 1, ro = ce ? Gt + "/" + Gt : S + 1 + "/" + Gt, je = {
    ...ut,
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
    { style: it, className: "qm-card", "data-qm-card": "true" },
    e.createElement(
      "div",
      { style: Zt, className: "qm-header" },
      e.createElement(
        "div",
        { style: Jt },
        Vt(e),
        e.createElement("span", { style: lt, className: "qm-title" }, x)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        As({
          R: e,
          providers: Tr,
          modelId: qt,
          disabled: b || P,
          open: zr,
          onOpenChange: Cr,
          tab: Or,
          onTabChange: Pr,
          onChange: (l) => {
            st({ modelId: l }), _e(null), fe.current = {}, re.current = {}, Ne((u) => u + 1);
          }
        }),
        qs({
          R: e,
          templates: En,
          value: he,
          open: Nr,
          onOpenChange: Lr,
          disabled: b || P,
          onSelect: qn,
          onManage: () => Rn(!0)
        }),
        Is({
          R: e,
          mode: X,
          disabled: b || P,
          onChange: (l) => {
            st({ mode: l }), l === "ai" && (re.current = {}), l === "ai" || l === "recommend" ? (ot.current = {}, Re.current = {}, rt.current = !1, Ne((u) => u + 1)) : Te();
          }
        }),
        zs({
          R: e,
          busy: _n,
          result: Ct,
          error: Ir,
          mode: X,
          disabled: b || P,
          open: qr,
          onOpenChange: $r,
          onRun: () => {
            Lt("manual");
          },
          onRerun: Zr,
          onApply: Qr,
          onCancel: Jr,
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
                checked: tt,
                onChange: (l) => st({ withContext: !!l.target.checked })
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
                checked: nt,
                onChange: (l) => st({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (X === "ai" || X === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: P,
          onClick: Ur,
          style: {
            ...je,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...G ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: G ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, G ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Ut, key: "qm-step" }, ro)
      )
    ),
    e.createElement("div", { style: Bn }, pt),
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    $s({
      R: e,
      open: jr,
      templates: En,
      value: he,
      edit: Mr,
      onEditChange: Bt,
      onClose: () => {
        Rn(!1), Bt(null);
      },
      onSelect: (l) => qn(l),
      onSave: Wr,
      onDelete: Hr
    }),
    // ── escape hatch: a survey blocks the whole chat while it is open ──
    // Shown after STUCK_AFTER_MS regardless of whether the card is healthy:
    // as long as the agent is parked, every new message in this chat answers
    // 409, so the user must always have a way out.
    xn && !b ? e.createElement(
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
        "⚠️ 本次问卷已阻塞会话 " + Math.max(1, Math.round((Date.now() - (Ke.current || Date.now())) / 1e3)) + " 秒。阻塞期间发新消息会报「A task is already running」；" + (v ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: {
          ...je,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Cn,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    e.createElement(
      "div",
      { style: ct, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: S === 0 || P,
        style: { ...je, marginRight: "auto", opacity: S === 0 ? 0.5 : 1 },
        onClick: () => k((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: je,
        onClick: ce ? Ht : Gr
      }, ce ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: je,
        onClick: Vr
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: Kr,
        onClick: () => {
          ce ? Ht() : k((l) => l + 1);
        }
      }, ce ? "提交" : "下一步")
    )
  );
}
function Os() {
  const r = Ho();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return Uo(), r.toolRender(Wo, Vn, Cs), console.log("[question-modal] registered via chat.toolRender for", Vn), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!Os()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
