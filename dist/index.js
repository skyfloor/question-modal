var fo = Object.defineProperty;
var ms = (t) => {
  throw TypeError(t);
};
var mo = (t, e, n) => e in t ? fo(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var H = (t, e, n) => mo(t, typeof e != "symbol" ? e + "" : e, n), go = (t, e, n) => e.has(t) || ms("Cannot " + n);
var gs = (t, e, n) => e.has(t) ? ms("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var cn = (t, e, n) => (go(t, e, "access private method"), n);
function Er() {
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
let rt = Er();
function Ls(t) {
  rt = t;
}
const Ps = /[&<>"']/, ho = new RegExp(Ps.source, "g"), js = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, bo = new RegExp(js.source, "g"), yo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, hs = (t) => yo[t];
function xe(t, e) {
  if (e) {
    if (Ps.test(t))
      return t.replace(ho, hs);
  } else if (js.test(t))
    return t.replace(bo, hs);
  return t;
}
const xo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function ko(t) {
  return t.replace(xo, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const wo = /(^|[^\[])\^/g;
function W(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (s, a) => {
      let o = typeof a == "string" ? a : a.source;
      return o = o.replace(wo, "$1"), n = n.replace(s, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function bs(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Pt = { exec: () => null };
function ys(t, e) {
  const n = t.replace(/\|/g, (a, o, d) => {
    let i = !1, x = o;
    for (; --x >= 0 && d[x] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), r = n.split(/ \|/);
  let s = 0;
  if (r[0].trim() || r.shift(), r.length > 0 && !r[r.length - 1].trim() && r.pop(), e)
    if (r.length > e)
      r.splice(e);
    else
      for (; r.length < e; )
        r.push("");
  for (; s < r.length; s++)
    r[s] = r[s].trim().replace(/\\\|/g, "|");
  return r;
}
function dn(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r && t.charAt(r - s - 1) === e; )
    s++;
  return t.slice(0, r - s);
}
function vo(t, e) {
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
function xs(t, e, n, r) {
  const s = e.href, a = e.title ? xe(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
  if (t[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const d = {
      type: "link",
      raw: n,
      href: s,
      title: a,
      text: o,
      tokens: r.inlineTokens(o)
    };
    return r.state.inLink = !1, d;
  }
  return {
    type: "image",
    raw: n,
    href: s,
    title: a,
    text: xe(o)
  };
}
function _o(t, e) {
  const n = t.match(/^(\s+)(?:```)/);
  if (n === null)
    return e;
  const r = n[1];
  return e.split(`
`).map((s) => {
    const a = s.match(/^\s+/);
    if (a === null)
      return s;
    const [o] = a;
    return o.length >= r.length ? s.slice(r.length) : s;
  }).join(`
`);
}
class kn {
  // set by the lexer
  constructor(e) {
    H(this, "options");
    H(this, "rules");
    // set by the lexer
    H(this, "lexer");
    this.options = e || rt;
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
        text: this.options.pedantic ? r : dn(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], s = _o(r, n[3] || "");
      return {
        type: "code",
        raw: r,
        lang: n[2] ? n[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : n[2],
        text: s
      };
    }
  }
  heading(e) {
    const n = this.rules.block.heading.exec(e);
    if (n) {
      let r = n[2].trim();
      if (/#$/.test(r)) {
        const s = dn(r, "#");
        (this.options.pedantic || !s || / $/.test(s)) && (r = s.trim());
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
      r = dn(r.replace(/^ *>[ \t]?/gm, ""), `
`);
      const s = this.lexer.state.top;
      this.lexer.state.top = !0;
      const a = this.lexer.blockTokens(r);
      return this.lexer.state.top = s, {
        type: "blockquote",
        raw: n[0],
        tokens: a,
        text: r
      };
    }
  }
  list(e) {
    let n = this.rules.block.list.exec(e);
    if (n) {
      let r = n[1].trim();
      const s = r.length > 1, a = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +r.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      r = s ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`, this.options.pedantic && (r = s ? r : "[*+-]");
      const o = new RegExp(`^( {0,3}${r})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let d = "", i = "", x = !1;
      for (; e; ) {
        let h = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = n[0], e = e.substring(d.length);
        let k = n[2].split(`
`, 1)[0].replace(/^\t+/, (S) => " ".repeat(3 * S.length)), f = e.split(`
`, 1)[0], w = 0;
        this.options.pedantic ? (w = 2, i = k.trimStart()) : (w = n[2].search(/[^ ]/), w = w > 4 ? 1 : w, i = k.slice(w), w += n[1].length);
        let m = !1;
        if (!k && /^ *$/.test(f) && (d += f + `
`, e = e.substring(f.length + 1), h = !0), !h) {
          const S = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), q = new RegExp(`^ {0,${Math.min(3, w - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), _ = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:\`\`\`|~~~)`), N = new RegExp(`^ {0,${Math.min(3, w - 1)}}#`);
          for (; e; ) {
            const C = e.split(`
`, 1)[0];
            if (f = C, this.options.pedantic && (f = f.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), _.test(f) || N.test(f) || S.test(f) || q.test(e))
              break;
            if (f.search(/[^ ]/) >= w || !f.trim())
              i += `
` + f.slice(w);
            else {
              if (m || k.search(/[^ ]/) >= 4 || _.test(k) || N.test(k) || q.test(k))
                break;
              i += `
` + f;
            }
            !m && !f.trim() && (m = !0), d += C + `
`, e = e.substring(C.length + 1), k = f.slice(w);
          }
        }
        a.loose || (x ? a.loose = !0 : /\n *\n *$/.test(d) && (x = !0));
        let y = null, b;
        this.options.gfm && (y = /^\[[ xX]\] /.exec(i), y && (b = y[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), a.items.push({
          type: "list_item",
          raw: d,
          task: !!y,
          checked: b,
          loose: !1,
          text: i,
          tokens: []
        }), a.raw += d;
      }
      a.items[a.items.length - 1].raw = d.trimEnd(), a.items[a.items.length - 1].text = i.trimEnd(), a.raw = a.raw.trimEnd();
      for (let h = 0; h < a.items.length; h++)
        if (this.lexer.state.top = !1, a.items[h].tokens = this.lexer.blockTokens(a.items[h].text, []), !a.loose) {
          const k = a.items[h].tokens.filter((w) => w.type === "space"), f = k.length > 0 && k.some((w) => /\n.*\n/.test(w.raw));
          a.loose = f;
        }
      if (a.loose)
        for (let h = 0; h < a.items.length; h++)
          a.items[h].loose = !0;
      return a;
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
      const r = n[1].toLowerCase().replace(/\s+/g, " "), s = n[2] ? n[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", a = n[3] ? n[3].substring(1, n[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : n[3];
      return {
        type: "def",
        tag: r,
        raw: n[0],
        href: s,
        title: a
      };
    }
  }
  table(e) {
    const n = this.rules.block.table.exec(e);
    if (!n || !/[:|]/.test(n[2]))
      return;
    const r = ys(n[1]), s = n[2].replace(/^\||\| *$/g, "").split("|"), a = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: n[0],
      header: [],
      align: [],
      rows: []
    };
    if (r.length === s.length) {
      for (const d of s)
        /^ *-+: *$/.test(d) ? o.align.push("right") : /^ *:-+: *$/.test(d) ? o.align.push("center") : /^ *:-+ *$/.test(d) ? o.align.push("left") : o.align.push(null);
      for (const d of r)
        o.header.push({
          text: d,
          tokens: this.lexer.inline(d)
        });
      for (const d of a)
        o.rows.push(ys(d, o.header.length).map((i) => ({
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
        text: xe(n[1])
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
        const o = dn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = vo(n[2], "()");
        if (o > -1) {
          const i = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + o;
          n[2] = n[2].substring(0, o), n[0] = n[0].substring(0, i).trim(), n[3] = "";
        }
      }
      let s = n[2], a = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        o && (s = o[1], a = o[3]);
      } else
        a = n[3] ? n[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), xs(n, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: a && a.replace(this.rules.inline.anyPunctuation, "$1")
      }, n[0], this.lexer);
    }
  }
  reflink(e, n) {
    let r;
    if ((r = this.rules.inline.reflink.exec(e)) || (r = this.rules.inline.nolink.exec(e))) {
      const s = (r[2] || r[1]).replace(/\s+/g, " "), a = n[s.toLowerCase()];
      if (!a) {
        const o = r[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return xs(r, a, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...s[0]].length - 1;
      let d, i, x = o, h = 0;
      const k = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (k.lastIndex = 0, n = n.slice(-1 * e.length + o); (s = k.exec(n)) != null; ) {
        if (d = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !d)
          continue;
        if (i = [...d].length, s[3] || s[4]) {
          x += i;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + i) % 3)) {
          h += i;
          continue;
        }
        if (x -= i, x > 0)
          continue;
        i = Math.min(i, i + x + h);
        const f = [...s[0]][0].length, w = e.slice(0, o + s.index + f + i);
        if (Math.min(o, i) % 2) {
          const y = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: y,
            tokens: this.lexer.inlineTokens(y)
          };
        }
        const m = w.slice(2, -2);
        return {
          type: "strong",
          raw: w,
          text: m,
          tokens: this.lexer.inlineTokens(m)
        };
      }
    }
  }
  codespan(e) {
    const n = this.rules.inline.code.exec(e);
    if (n) {
      let r = n[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), a = /^ /.test(r) && / $/.test(r);
      return s && a && (r = r.substring(1, r.length - 1)), r = xe(r, !0), {
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
      let r, s;
      return n[2] === "@" ? (r = xe(n[1]), s = "mailto:" + r) : (r = xe(n[1]), s = r), {
        type: "link",
        raw: n[0],
        text: r,
        href: s,
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
      let s, a;
      if (n[2] === "@")
        s = xe(n[0]), a = "mailto:" + s;
      else {
        let o;
        do
          o = n[0], n[0] = ((r = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== n[0]);
        s = xe(n[0]), n[1] === "www." ? a = "http://" + n[0] : a = n[0];
      }
      return {
        type: "link",
        raw: n[0],
        text: s,
        href: a,
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
    const n = this.rules.inline.text.exec(e);
    if (n) {
      let r;
      return this.lexer.state.inRawBlock ? r = n[0] : r = xe(n[0]), {
        type: "text",
        raw: n[0],
        text: r
      };
    }
  }
}
const qo = /^(?: *(?:\n|$))+/, So = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Eo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Wt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, To = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Ds = /(?:[*+-]|\d{1,9}[.)])/, Fs = W(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Ds).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Tr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ao = /^[^\n]+/, Ar = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Co = W(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", Ar).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), No = W(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Ds).getRegex(), An = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Cr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Io = W("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", Cr).replace("tag", An).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Ws = W(Tr).replace("hr", Wt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", An).getRegex(), zo = W(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ws).getRegex(), Nr = {
  blockquote: zo,
  code: So,
  def: Co,
  fences: Eo,
  heading: To,
  hr: Wt,
  html: Io,
  lheading: Fs,
  list: No,
  newline: qo,
  paragraph: Ws,
  table: Pt,
  text: Ao
}, ks = W("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Wt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", An).getRegex(), $o = {
  ...Nr,
  table: ks,
  paragraph: W(Tr).replace("hr", Wt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ks).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", An).getRegex()
}, Oo = {
  ...Nr,
  html: W(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Cr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Pt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: W(Tr).replace("hr", Wt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Fs).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Hs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ro = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Us = /^( {2,}|\\)\n(?!\s*$)/, Mo = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Ht = "\\p{P}\\p{S}", Bo = W(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Ht).getRegex(), Lo = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Po = W(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Ht).getRegex(), jo = W("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Ht).getRegex(), Do = W("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Ht).getRegex(), Fo = W(/\\([punct])/, "gu").replace(/punct/g, Ht).getRegex(), Wo = W(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ho = W(Cr).replace("(?:-->|$)", "-->").getRegex(), Uo = W("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ho).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), wn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Go = W(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", wn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Gs = W(/^!?\[(label)\]\[(ref)\]/).replace("label", wn).replace("ref", Ar).getRegex(), Js = W(/^!?\[(ref)\](?:\[\])?/).replace("ref", Ar).getRegex(), Jo = W("reflink|nolink(?!\\()", "g").replace("reflink", Gs).replace("nolink", Js).getRegex(), Ir = {
  _backpedal: Pt,
  // only used for GFM url
  anyPunctuation: Fo,
  autolink: Wo,
  blockSkip: Lo,
  br: Us,
  code: Ro,
  del: Pt,
  emStrongLDelim: Po,
  emStrongRDelimAst: jo,
  emStrongRDelimUnd: Do,
  escape: Hs,
  link: Go,
  nolink: Js,
  punctuation: Bo,
  reflink: Gs,
  reflinkSearch: Jo,
  tag: Uo,
  text: Mo,
  url: Pt
}, Zo = {
  ...Ir,
  link: W(/^!?\[(label)\]\((.*?)\)/).replace("label", wn).getRegex(),
  reflink: W(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", wn).getRegex()
}, _r = {
  ...Ir,
  escape: W(Hs).replace("])", "~|])").getRegex(),
  url: W(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Ko = {
  ..._r,
  br: W(Us).replace("{2,}", "*").getRegex(),
  text: W(_r.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, pn = {
  normal: Nr,
  gfm: $o,
  pedantic: Oo
}, zt = {
  normal: Ir,
  gfm: _r,
  breaks: Ko,
  pedantic: Zo
};
class Ie {
  constructor(e) {
    H(this, "tokens");
    H(this, "options");
    H(this, "state");
    H(this, "tokenizer");
    H(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || rt, this.options.tokenizer = this.options.tokenizer || new kn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: pn.normal,
      inline: zt.normal
    };
    this.options.pedantic ? (n.block = pn.pedantic, n.inline = zt.pedantic) : this.options.gfm && (n.block = pn.gfm, this.options.breaks ? n.inline = zt.breaks : n.inline = zt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: pn,
      inline: zt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Ie(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Ie(n).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (d, i, x) => i + "    ".repeat(x.length));
    let r, s, a, o;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((d) => (r = d.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length), r.raw.length === 1 && n.length > 0 ? n[n.length - 1].raw += `
` : n.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length), s = n[n.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r);
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
          e = e.substring(r.raw.length), s = n[n.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
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
        if (a = e, this.options.extensions && this.options.extensions.startBlock) {
          let d = 1 / 0;
          const i = e.slice(1);
          let x;
          this.options.extensions.startBlock.forEach((h) => {
            x = h.call({ lexer: this }, i), typeof x == "number" && x >= 0 && (d = Math.min(d, x));
          }), d < 1 / 0 && d >= 0 && (a = e.substring(0, d + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(a))) {
          s = n[n.length - 1], o && s.type === "paragraph" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r), o = a.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length), s = n[n.length - 1], s && s.type === "text" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : n.push(r);
          continue;
        }
        if (e) {
          const d = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(d);
            break;
          } else
            throw new Error(d);
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
    let r, s, a, o = e, d, i, x;
    if (this.tokens.links) {
      const h = Object.keys(this.tokens.links);
      if (h.length > 0)
        for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          h.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (d = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, d.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (x = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((h) => (r = h.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(e)) {
          e = e.substring(r.raw.length), s = n[n.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.link(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(r.raw.length), s = n[n.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.emStrong(e, o, x)) {
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
        if (a = e, this.options.extensions && this.options.extensions.startInline) {
          let h = 1 / 0;
          const k = e.slice(1);
          let f;
          this.options.extensions.startInline.forEach((w) => {
            f = w.call({ lexer: this }, k), typeof f == "number" && f >= 0 && (h = Math.min(h, f));
          }), h < 1 / 0 && h >= 0 && (a = e.substring(0, h + 1));
        }
        if (r = this.tokenizer.inlineText(a)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (x = r.raw.slice(-1)), i = !0, s = n[n.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
          continue;
        }
        if (e) {
          const h = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(h);
            break;
          } else
            throw new Error(h);
        }
      }
    return n;
  }
}
class vn {
  constructor(e) {
    H(this, "options");
    this.options = e || rt;
  }
  code(e, n, r) {
    var a;
    const s = (a = (n || "").match(/^\S*/)) == null ? void 0 : a[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + xe(s) + '">' + (r ? e : xe(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : xe(e, !0)) + `</code></pre>
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
    const s = n ? "ol" : "ul", a = n && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + s + a + `>
` + e + "</" + s + `>
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
    const s = bs(e);
    if (s === null)
      return r;
    e = s;
    let a = '<a href="' + e + '"';
    return n && (a += ' title="' + n + '"'), a += ">" + r + "</a>", a;
  }
  image(e, n, r) {
    const s = bs(e);
    if (s === null)
      return r;
    e = s;
    let a = `<img src="${e}" alt="${r}"`;
    return n && (a += ` title="${n}"`), a += ">", a;
  }
  text(e) {
    return e;
  }
}
class zr {
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
class ze {
  constructor(e) {
    H(this, "options");
    H(this, "renderer");
    H(this, "textRenderer");
    this.options = e || rt, this.options.renderer = this.options.renderer || new vn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new zr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new ze(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new ze(n).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, n = !0) {
    let r = "";
    for (let s = 0; s < e.length; s++) {
      const a = e[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[a.type]) {
        const o = a, d = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (d !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(o.type)) {
          r += d || "";
          continue;
        }
      }
      switch (a.type) {
        case "space":
          continue;
        case "hr": {
          r += this.renderer.hr();
          continue;
        }
        case "heading": {
          const o = a;
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, ko(this.parseInline(o.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const o = a;
          r += this.renderer.code(o.text, o.lang, !!o.escaped);
          continue;
        }
        case "table": {
          const o = a;
          let d = "", i = "";
          for (let h = 0; h < o.header.length; h++)
            i += this.renderer.tablecell(this.parseInline(o.header[h].tokens), { header: !0, align: o.align[h] });
          d += this.renderer.tablerow(i);
          let x = "";
          for (let h = 0; h < o.rows.length; h++) {
            const k = o.rows[h];
            i = "";
            for (let f = 0; f < k.length; f++)
              i += this.renderer.tablecell(this.parseInline(k[f].tokens), { header: !1, align: o.align[f] });
            x += this.renderer.tablerow(i);
          }
          r += this.renderer.table(d, x);
          continue;
        }
        case "blockquote": {
          const o = a, d = this.parse(o.tokens);
          r += this.renderer.blockquote(d);
          continue;
        }
        case "list": {
          const o = a, d = o.ordered, i = o.start, x = o.loose;
          let h = "";
          for (let k = 0; k < o.items.length; k++) {
            const f = o.items[k], w = f.checked, m = f.task;
            let y = "";
            if (f.task) {
              const b = this.renderer.checkbox(!!w);
              x ? f.tokens.length > 0 && f.tokens[0].type === "paragraph" ? (f.tokens[0].text = b + " " + f.tokens[0].text, f.tokens[0].tokens && f.tokens[0].tokens.length > 0 && f.tokens[0].tokens[0].type === "text" && (f.tokens[0].tokens[0].text = b + " " + f.tokens[0].tokens[0].text)) : f.tokens.unshift({
                type: "text",
                text: b + " "
              }) : y += b + " ";
            }
            y += this.parse(f.tokens, x), h += this.renderer.listitem(y, m, !!w);
          }
          r += this.renderer.list(h, d, i);
          continue;
        }
        case "html": {
          const o = a;
          r += this.renderer.html(o.text, o.block);
          continue;
        }
        case "paragraph": {
          const o = a;
          r += this.renderer.paragraph(this.parseInline(o.tokens));
          continue;
        }
        case "text": {
          let o = a, d = o.tokens ? this.parseInline(o.tokens) : o.text;
          for (; s + 1 < e.length && e[s + 1].type === "text"; )
            o = e[++s], d += `
` + (o.tokens ? this.parseInline(o.tokens) : o.text);
          r += n ? this.renderer.paragraph(d) : d;
          continue;
        }
        default: {
          const o = 'Token with "' + a.type + '" type was not found.';
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
    for (let s = 0; s < e.length; s++) {
      const a = e[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[a.type]) {
        const o = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(a.type)) {
          r += o || "";
          continue;
        }
      }
      switch (a.type) {
        case "escape": {
          const o = a;
          r += n.text(o.text);
          break;
        }
        case "html": {
          const o = a;
          r += n.html(o.text);
          break;
        }
        case "link": {
          const o = a;
          r += n.link(o.href, o.title, this.parseInline(o.tokens, n));
          break;
        }
        case "image": {
          const o = a;
          r += n.image(o.href, o.title, o.text);
          break;
        }
        case "strong": {
          const o = a;
          r += n.strong(this.parseInline(o.tokens, n));
          break;
        }
        case "em": {
          const o = a;
          r += n.em(this.parseInline(o.tokens, n));
          break;
        }
        case "codespan": {
          const o = a;
          r += n.codespan(o.text);
          break;
        }
        case "br": {
          r += n.br();
          break;
        }
        case "del": {
          const o = a;
          r += n.del(this.parseInline(o.tokens, n));
          break;
        }
        case "text": {
          const o = a;
          r += n.text(o.text);
          break;
        }
        default: {
          const o = 'Token with "' + a.type + '" type was not found.';
          if (this.options.silent)
            return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return r;
  }
}
class jt {
  constructor(e) {
    H(this, "options");
    this.options = e || rt;
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
H(jt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var nt, qr, Zs;
class Qo {
  constructor(...e) {
    gs(this, nt);
    H(this, "defaults", Er());
    H(this, "options", this.setOptions);
    H(this, "parse", cn(this, nt, qr).call(this, Ie.lex, ze.parse));
    H(this, "parseInline", cn(this, nt, qr).call(this, Ie.lexInline, ze.parseInline));
    H(this, "Parser", ze);
    H(this, "Renderer", vn);
    H(this, "TextRenderer", zr);
    H(this, "Lexer", Ie);
    H(this, "Tokenizer", kn);
    H(this, "Hooks", jt);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, n) {
    var s, a;
    let r = [];
    for (const o of e)
      switch (r = r.concat(n.call(this, o)), o.type) {
        case "table": {
          const d = o;
          for (const i of d.header)
            r = r.concat(this.walkTokens(i.tokens, n));
          for (const i of d.rows)
            for (const x of i)
              r = r.concat(this.walkTokens(x.tokens, n));
          break;
        }
        case "list": {
          const d = o;
          r = r.concat(this.walkTokens(d.items, n));
          break;
        }
        default: {
          const d = o;
          (a = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && a[d.type] ? this.defaults.extensions.childTokens[d.type].forEach((i) => {
            const x = d[i].flat(1 / 0);
            r = r.concat(this.walkTokens(x, n));
          }) : d.tokens && (r = r.concat(this.walkTokens(d.tokens, n)));
        }
      }
    return r;
  }
  use(...e) {
    const n = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((r) => {
      const s = { ...r };
      if (s.async = this.defaults.async || s.async || !1, r.extensions && (r.extensions.forEach((a) => {
        if (!a.name)
          throw new Error("extension name required");
        if ("renderer" in a) {
          const o = n.renderers[a.name];
          o ? n.renderers[a.name] = function(...d) {
            let i = a.renderer.apply(this, d);
            return i === !1 && (i = o.apply(this, d)), i;
          } : n.renderers[a.name] = a.renderer;
        }
        if ("tokenizer" in a) {
          if (!a.level || a.level !== "block" && a.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = n[a.level];
          o ? o.unshift(a.tokenizer) : n[a.level] = [a.tokenizer], a.start && (a.level === "block" ? n.startBlock ? n.startBlock.push(a.start) : n.startBlock = [a.start] : a.level === "inline" && (n.startInline ? n.startInline.push(a.start) : n.startInline = [a.start]));
        }
        "childTokens" in a && a.childTokens && (n.childTokens[a.name] = a.childTokens);
      }), s.extensions = n), r.renderer) {
        const a = this.defaults.renderer || new vn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in a))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.renderer[d], x = a[d];
          a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = x.apply(a, h)), k || "";
          };
        }
        s.renderer = a;
      }
      if (r.tokenizer) {
        const a = this.defaults.tokenizer || new kn(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in a))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const d = o, i = r.tokenizer[d], x = a[d];
          a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = x.apply(a, h)), k;
          };
        }
        s.tokenizer = a;
      }
      if (r.hooks) {
        const a = this.defaults.hooks || new jt();
        for (const o in r.hooks) {
          if (!(o in a))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.hooks[d], x = a[d];
          jt.passThroughHooks.has(o) ? a[d] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(a, h)).then((f) => x.call(a, f));
            const k = i.call(a, h);
            return x.call(a, k);
          } : a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = x.apply(a, h)), k;
          };
        }
        s.hooks = a;
      }
      if (r.walkTokens) {
        const a = this.defaults.walkTokens, o = r.walkTokens;
        s.walkTokens = function(d) {
          let i = [];
          return i.push(o.call(this, d)), a && (i = i.concat(a.call(this, d))), i;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, n) {
    return Ie.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return ze.parse(e, n ?? this.defaults);
  }
}
nt = new WeakSet(), qr = function(e, n) {
  return (r, s) => {
    const a = { ...s }, o = { ...this.defaults, ...a };
    this.defaults.async === !0 && a.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const d = cn(this, nt, Zs).call(this, !!o.silent, !!o.async);
    if (typeof r > "u" || r === null)
      return d(new Error("marked(): input parameter is undefined or null"));
    if (typeof r != "string")
      return d(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(r) + ", string expected"));
    if (o.hooks && (o.hooks.options = o), o.async)
      return Promise.resolve(o.hooks ? o.hooks.preprocess(r) : r).then((i) => e(i, o)).then((i) => o.hooks ? o.hooks.processAllTokens(i) : i).then((i) => o.walkTokens ? Promise.all(this.walkTokens(i, o.walkTokens)).then(() => i) : i).then((i) => n(i, o)).then((i) => o.hooks ? o.hooks.postprocess(i) : i).catch(d);
    try {
      o.hooks && (r = o.hooks.preprocess(r));
      let i = e(r, o);
      o.hooks && (i = o.hooks.processAllTokens(i)), o.walkTokens && this.walkTokens(i, o.walkTokens);
      let x = n(i, o);
      return o.hooks && (x = o.hooks.postprocess(x)), x;
    } catch (i) {
      return d(i);
    }
  };
}, Zs = function(e, n) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + xe(r.message + "", !0) + "</pre>";
      return n ? Promise.resolve(s) : s;
    }
    if (n)
      return Promise.reject(r);
    throw r;
  };
};
const tt = new Qo();
function F(t, e) {
  return tt.parse(t, e);
}
F.options = F.setOptions = function(t) {
  return tt.setOptions(t), F.defaults = tt.defaults, Ls(F.defaults), F;
};
F.getDefaults = Er;
F.defaults = rt;
F.use = function(...t) {
  return tt.use(...t), F.defaults = tt.defaults, Ls(F.defaults), F;
};
F.walkTokens = function(t, e) {
  return tt.walkTokens(t, e);
};
F.parseInline = tt.parseInline;
F.Parser = ze;
F.parser = ze.parse;
F.Renderer = vn;
F.TextRenderer = zr;
F.Lexer = Ie;
F.lexer = Ie.lex;
F.Tokenizer = kn;
F.Hooks = jt;
F.parse = F;
F.options;
F.setOptions;
F.use;
F.walkTokens;
F.parseInline;
ze.parse;
Ie.lex;
const Ks = "question-modal", ws = "question_modal", cr = 3, vs = "gate-v2@2026.10.21";
function Se() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Xo() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Pe() {
  return Se().antd || {};
}
function Vo() {
  return Se().antdIcons || {};
}
const Yo = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function dr(t) {
  const e = Vo();
  for (const n of Yo) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function ei() {
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
      ".qm-set-staletable{border-top:1px solid var(--app-border,#e5e7eb)}",
      ".qm-set-stalerow{display:grid;grid-template-columns:minmax(0,1fr) 190px 96px 132px;",
      "gap:12px;align-items:center;padding:10px 0;",
      "border-bottom:1px solid var(--app-border,#eef1f5);font-size:12px}",
      ".qm-set-staleheader{font-size:11px;font-weight:600;padding:8px 0;",
      "color:var(--app-text-tertiary,#94a3b8)}",
      ".qm-set-stalec1{display:flex;flex-direction:column;gap:3px;min-width:0}",
      ".qm-set-staletitle{font-size:12px;overflow:hidden;text-overflow:ellipsis;",
      "white-space:nowrap;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-staletag{font-size:10px;line-height:1;padding:3px 6px;border-radius:4px;",
      "background:#fef3c7;color:#b45309;align-self:flex-start;white-space:nowrap}",
      ".qm-set-stalec2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
      "font-size:11px;color:var(--app-text-secondary,#64748b)}",
      ".qm-set-stalec3{font-size:12px;color:var(--app-text-primary,#1e293b);white-space:nowrap}",
      ".qm-set-stalec4{display:flex;gap:6px;justify-content:flex-end}",
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
      "color:var(--app-text-secondary,#4e5969)}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function B(t) {
  try {
    const e = Se();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Cn = "", Qs = "";
function $r(t, e) {
  t && (Qs = t), e && (Cn = e);
}
function L() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = Se(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Cn), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function Nn() {
  try {
    const e = Se();
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
  return Qs;
}
globalThis.__qmSessionProbe = Nn;
function $t() {
  try {
    const t = Se(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Cn;
}
const pr = {};
async function ti(t, e, n) {
  if (typeof window > "u" || pr[t]) return "skipped";
  try {
    const a = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(a) === "1")
      return pr[t] = !0, "skipped";
    window.localStorage.setItem(a, "1");
  } catch {
  }
  pr[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((d) => {
      let i = !1;
      const x = (h) => {
        i || (i = !0, d(h));
      };
      try {
        const h = s.requestPermission((k) => x(k));
        h && typeof h.then == "function" && h.then(x).catch(() => x("denied"));
      } catch {
        x("denied");
      }
      setTimeout(() => x(s.permission || "denied"), 8e3);
    }) !== "granted" || s.permission !== "granted") return "inpage";
    const a = new s("问卷等待作答", { body: r, tag: "qm-" + t, renotify: !1 });
    return a.onclick = () => {
      try {
        window.focus();
      } catch {
      }
      try {
        a.close();
      } catch {
      }
    }, "system";
  } catch {
    return "inpage";
  }
}
function re(t) {
  const e = Dt(t);
  return e && e.session_id ? e.session_id : Nn();
}
const ur = 180, ni = 20, Xs = 6e3, ri = 60, si = 8;
function ai() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const oi = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function _s(t) {
  try {
    return String(t || "").replace(oi, "").length;
  } catch {
    return 0;
  }
}
function qs(t) {
  const e = ai();
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
    r = _s((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - _s(n.textContent);
}
function ii(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function li(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function Ss(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: Xs });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const ci = "qm:v1:analysis:global", di = "qm:v1:analysis:", pi = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Ot(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function ui(t) {
  if (!t || typeof t != "object") return { ...pi };
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
function fi() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(di) === 0 && n !== ci && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function mi() {
  try {
    const t = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : ui(e.prefs);
  } catch {
    return null;
  }
}
async function Or() {
  try {
    const t = await fetch(B("/question-modal/templates"), { headers: L() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function un(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(B("/question-modal/survey-action"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Tn()
      })
    }), s = await r.json().catch(() => ({}));
    return r.ok ? {
      accepted: s.accepted !== !1,
      reason: String(s.reason || ""),
      state: s.state || null
    } : null;
  } catch {
    return null;
  }
}
async function gi(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      B("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: L() }
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
function hi(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, s = 0, a = null, o = 0, d = !1, i = 0, x = 0, h = null;
  const k = (m) => {
    n || h === m || (h = m, e.onStatus(m));
  }, f = () => {
    if (!n)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, y = B("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, b = { headers: L() };
        m && (b.signal = m.signal), r = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(y, b).then(async (q) => {
          const _ = Ui(q);
          if (!q.ok || !q.body || _) {
            if (q.status === 404 || q.status === 501 || q.status === 405) {
              d = !0, k(!1);
              return;
            }
            throw _ && (i += 1), new Error(_ ? "blocked" : "HTTP " + q.status);
          }
          s = 0, i = 0, k(!0);
          const N = q.body.getReader(), C = new TextDecoder();
          let $ = "";
          const E = () => {
            N.read().then(({ done: j, value: M }) => {
              if (j) {
                w();
                return;
              }
              $ += C.decode(M, { stream: !0 });
              let Z;
              for (; (Z = $.indexOf(`

`)) >= 0; ) {
                const ke = $.slice(0, Z);
                $ = $.slice(Z + 2), ke.split(`
`).forEach((K) => {
                  if (!K.startsWith("data: ")) return;
                  let R = null;
                  try {
                    R = JSON.parse(K.slice(6));
                  } catch {
                    return;
                  }
                  R && (R.kind === "snapshot" ? (o = Math.max(o, parseInt(R.rev || 0, 10) || 0), e.onSnapshot(o, R.state || null)) : R.kind === "change" && (o = Math.max(o, parseInt(R.rev || 0, 10) || 0), e.onChange(R)));
                });
              }
              n || E();
            }).catch(() => {
              w();
            });
          };
          E();
        }).catch(() => {
          w();
        });
      } catch {
        w();
      }
  }, w = () => {
    if (n || d)
      return;
    if (k(!1), i += 1, x || (x = Date.now()), i >= oa) {
      if (Date.now() - (x || Date.now()) >= la) {
        d = !0, k(!1);
        return;
      }
      a = setTimeout(f, ia);
      return;
    }
    s = Math.min(s + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, s));
    a = setTimeout(f, m);
  };
  return f(), () => {
    if (n = !0, a)
      try {
        clearTimeout(a);
      } catch {
      }
    if (r)
      try {
        r();
      } catch {
      }
    h = null, e.onStatus(!1);
  };
}
async function fr(t, e, n) {
  try {
    return (await fetch(B("/question-modal/session-prefs"), {
      method: "POST",
      headers: L(),
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
let mt = null;
const bi = 1500;
async function Ft(t, e, n, r) {
  const s = t || "", a = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  if (!e && mt && mt.chatId === s && Date.now() - mt.at < bi)
    return mt.data;
  try {
    const o = B(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + a
    ), d = await fetch(o, { headers: L() });
    if (!d.ok) return null;
    const i = await d.json();
    if (!i || i.ok !== !0) return null;
    const x = {
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
    return mt = { chatId: s, at: Date.now(), data: x }, x;
  } catch {
    return null;
  }
}
function Vs() {
  mt = null;
}
async function In() {
  const t = await fetch(
    B("/question-modal/stale-surveys"),
    { headers: L() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function zn(t) {
  const e = l.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function Sr(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function Rr(t) {
  const e = await fetch(B("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: L(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function yi(t) {
  const e = await fetch(B("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: L(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function xi() {
  l.stale.busy = !0, l.stale.msgKind = "info", l.stale.msg = "正在扫描…", z();
  const t = Date.now();
  try {
    const e = await In();
    zn(e), l.stale.page = 0, l.stale.resPage = 0;
    const n = l.stale.rows.length, r = l.stale.blocking.length, s = l.stale.residual.length, a = l.stale.exceeded.length, o = l.stale.within.length, d = Date.now() - t;
    l.stale.msgKind = "ok";
    const i = Sr(l.stale.threshold);
    l.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${s} 条；已超阈值 ${a} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${d}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${d}ms）`;
  } catch (e) {
    l.stale.rows = [], l.stale.exceeded = [], l.stale.within = [], l.stale.blocking = [], l.stale.residual = [], l.stale.scanned = !1, l.stale.msgKind = "error", l.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    l.stale.busy = !1, z();
  }
}
async function mr(t, e = "释放") {
  l.stale.busy = !0, l.stale.msg = "", z();
  try {
    const n = await Rr({ tool_call_ids: t }), r = Number(n && n.released) || 0, s = Number(n && n.already) || 0, a = Number(n && n.failed) || 0;
    l.stale.msgKind = a > 0 ? "warn" : "ok", l.stale.msg = a > 0 ? `${e} ${r} 条，${a} 条未成功（见日志）` + (s ? `；${s} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (s ? `；${s} 条此前已处理` : "") : `无需${e}：${s || t.length} 条此前已处理`;
    const o = await In();
    zn(o);
  } catch (n) {
    l.stale.msgKind = "error", l.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    l.stale.busy = !1, z();
  }
}
async function ki() {
  l.stale.busy = !0, l.stale.msg = "", z();
  try {
    const t = await Rr({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, s = Number(t && t.requested) || 0;
    l.stale.msgKind = n > 0 ? "warn" : "ok", l.stale.msg = s === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${s} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const a = await In();
    zn(a);
  } catch (t) {
    l.stale.msgKind = "error", l.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    l.stale.busy = !1, z();
  }
}
async function wi() {
  const t = (l.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    l.stale.msgKind = "info", l.stale.msg = "当前没有可清理的残留问卷", z();
    return;
  }
  l.stale.busy = !0, l.stale.msg = "", z();
  try {
    const e = await Rr({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, s = Number(e && e.failed) || 0;
    l.stale.msgKind = s > 0 ? "warn" : "ok", l.stale.msg = s > 0 ? `清理 ${n} 条，${s} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const a = await In();
    zn(a), l.stale.resPage = 0;
  } catch (e) {
    l.stale.msgKind = "error", l.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    l.stale.busy = !1, z();
  }
}
async function vi(t) {
  l.stale.busy = !0, l.stale.msg = "", z();
  try {
    const e = await yi(t), n = e && e.results || [], r = n.filter((a) => a && a.stopped).length, s = n.filter((a) => a && !a.stopped).length;
    l.stale.msgKind = r > 0 ? "ok" : "warn", l.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (s ? `；${s} 个会话已不存在` : "") : `${s} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    l.stale.msgKind = "error", l.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    l.stale.busy = !1, z();
  }
}
async function Ys(t) {
  try {
    const e = await fetch(B("/question-modal/templates"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ea(t) {
  try {
    const e = await fetch(B("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: L()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ta() {
  try {
    const t = await fetch(B("/models"), { headers: L() });
    if (!t.ok) return [];
    const e = await t.json();
    return (Array.isArray(e) ? e : []).filter((r) => {
      const a = [...r.models || [], ...r.extra_models || []].length > 0, o = !!r.api_key || r.require_api_key === !1 || r.is_local || r.is_custom;
      return a && o;
    });
  } catch {
    return [];
  }
}
function _i(t) {
  if (!t) return "";
  try {
    return String(F.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function D(t, e) {
  try {
    const n = Pe().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const be = "__other__";
function qe(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function gt(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function gr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (n && n.has(s) || !Object.prototype.hasOwnProperty.call(r, s)) return;
    const a = e[s];
    !a || typeof a != "object" || !gt(r[s]) && gt(a) && (r[s] = { ...a });
  }), r;
}
function Es(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function Ts(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((s) => Number(s && s.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function qi(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = qe(e), a = $e(e), o = r(s), d = r(a);
  return n.some((i) => {
    const x = r(i);
    return x ? !!(i === s || i === a || x === o || x === d || Math.min(x.length, o.length, d.length) >= 4 && (x.length >= 4 && (o.includes(x) || x.includes(o)) || x.length >= 4 && (d.includes(x) || x.includes(d)))) : !1;
  });
}
function ae(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let na = !0;
function _n(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (na ? "第 " + (e + 1) + " 题" : "");
}
function $e(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function Si(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (a) => {
    a != null && a !== "" && n.add(String(a));
  }, s = t.options || [];
  if (ae(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const d = s.find((i) => qe(i) === String(o));
      d && r($e(d)), String(o) === be && e.other && r(e.other);
    });
  else {
    r(e.value);
    const a = s.find((o) => qe(o) === String(e.value));
    a && r($e(a)), String(e.value) === be && e.other && r(e.other);
  }
  return n;
}
function Ei(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const s = String(r);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const a of Array.from(e))
      if (a && (a.indexOf(s) !== -1 || s.indexOf(a) !== -1)) return !0;
    return !1;
  });
}
function ra(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const s = parseInt(n[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === t.trim());
}
function sa(t, e, n) {
  const r = e[t], s = r && r.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const a of Object.keys(s)) {
    const o = ra(a, e);
    if (o < 0) continue;
    const d = e[o];
    if (!d) continue;
    if (d.showIf && !sa(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !Ei(s[a], Si(d, i))) return !1;
  }
  return !0;
}
function Le(t, e) {
  const n = [];
  return t.forEach((r, s) => {
    sa(s, t, e) && n.push(s);
  }), n;
}
function Ti(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function fn(t) {
  return Array.isArray(t.questions);
}
function Ai(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function Ci(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((s) => s && (s.text || s.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function Ni(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function Ii(t) {
  if (!t) return "";
  const e = String(t).split(`
`).map((r) => r.trim()).filter(Boolean);
  for (let r = e.length - 1; r >= 0; r--) {
    const s = e[r];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(s) && !/^\{/.test(s) && !/^\s*"skipped"/.test(s) && s.length < 400)
      return s.replace(/^【|】$/g, "").trim();
  }
  const n = String(t).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return n && n[1] && n[1] !== "timeout" ? n[1] : "";
}
function Rt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), a = String(e.skip_reason || "").trim();
    return (a ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${a}` : "已跳过本次问卷。") + `

` + xn(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((s) => {
    const a = n[s];
    if (!a || typeof a != "object") return;
    const o = ra(s, t), d = o >= 0 ? t[o] : null, i = d ? ae(d) === "single" ? "单选" : ae(d) === "multi" ? "多选" : "问答" : "问答", x = d ? _n(d, o) : s;
    let h = a.value;
    if (Array.isArray(h) && (h = h.join("、")), a.other && (h = (h ? h + "、" : "") + a.other), a.skipped) {
      const k = String(a.skipped_by || ""), f = k === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : k === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${s} [${i}] ${x}${f}`);
    } else
      r.push(`- ${s} [${i}] ${x}：${h === "" || h == null ? "（空）" : h}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function zi(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      B("/question-modal/resolve") + "?" + n.toString(),
      { headers: L() }
    );
    if (!r.ok) return { kind: "error" };
    const s = await r.json();
    return s && $r(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Mt(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      B("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: L() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function $i(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = L();
    delete n["Content-Type"];
    const r = await fetch(
      B("/console/upload"),
      { method: "POST", headers: n, body: e }
    );
    if (!r.ok) {
      const a = await r.text().catch(() => "");
      let o = "HTTP " + r.status;
      try {
        const d = JSON.parse(a);
        d && d.detail && (o = d.detail);
      } catch {
      }
      return { ok: !1, error: `${t.name}: ${o}` };
    }
    const s = await r.json();
    return !s || !s.url ? { ok: !1, error: `${t.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(s.url), file_name: String(s.file_name || t.name), size: s.size }
    };
  } catch (e) {
    return { ok: !1, error: `${t.name}: ${e && e.message || e}` };
  }
}
const qn = "qm:v1:stash_att:", As = 25 * 1024 * 1024, bn = /* @__PURE__ */ new Map(), yn = /* @__PURE__ */ new Map();
let Sn = null, En = 0, hr = null;
function Cs() {
  const t = En > 0;
  yn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function Oi() {
  if (hr) return hr;
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
    const r = Sn;
    Sn = null, !(!r || !n.length) && await aa(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return hr = t, t;
}
function Ri(t, e, n) {
  if (!t) {
    D("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Sn = { callId: t, target: e, key: n };
  const r = Oi();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (Sn = null);
}
async function aa(t, e, n, r) {
  En += 1, Cs();
  const s = [], a = [];
  try {
    for (const d of t) {
      if (d.size && d.size > As) {
        a.push(`${d.name}: 文件过大（上限 ${Math.round(As / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await $i(d);
      i.ok ? s.push(i.att) : a.push(i.error);
    }
  } finally {
    En -= 1, Cs();
  }
  const o = bn.get(e);
  if (s.length || a.length) {
    const d = n === "final" ? "final" : "q";
    if (!e) {
      D(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (o)
      try {
        o(s, d, r, a);
      } catch {
      }
    else s.length && Mi(e, s, d, r);
  }
}
function Mi(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const s = localStorage.getItem(qn + t), a = s ? JSON.parse(s) : [], o = (Array.isArray(a) ? a : []).concat(
        e.map((d) => ({ att: d, target: n, key: r }))
      );
      localStorage.setItem(qn + t, JSON.stringify(o));
    } catch {
    }
}
function Bi(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(qn + t);
    if (!e) return [];
    localStorage.removeItem(qn + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function Li(t) {
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
function Pi(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function br(t, e) {
  const n = e || re(t), r = Dt(t), s = r && r.request_id ? r.request_id : "";
  if (s)
    try {
      const a = await fetch(B("/question-modal/skip"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({ request_id: s, session_id: n || "" })
      });
      if (a.ok) {
        const o = await a.json().catch(() => ({}));
        return he(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (a.status === 404)
        return he(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const a = await fetch(
        B("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: L() }
      );
      if (a.ok) {
        const o = await a.json().catch(() => ({})), d = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return he(t), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + a.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function Ns(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      B("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: L() }
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
async function ji(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      B("/question-modal/pending") + e,
      { headers: L() }
    );
    if (!n.ok) return null;
    const r = await n.json(), s = r && r.items || [];
    if (!Array.isArray(s) || s.length !== 1) return null;
    const a = s[0];
    if (!a || !a.request_id) return null;
    const o = await fetch(
      B("/question-modal/resolve") + "?request_id=" + encodeURIComponent(a.request_id),
      { headers: L() }
    );
    if (!o.ok) return null;
    const d = await o.json();
    return d && $r(d.session_id, d.agent_id), d && d.found ? d : null;
  } catch {
    return null;
  }
}
const $n = "qm:v1:reqid:", Di = 3e4, Fi = 45e3, oa = 6, ia = 6e4, la = 15 * 6e4, Wi = 700, Hi = 8;
function Ui(t) {
  try {
    if (String((t.headers && t.headers.get ? t.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const n = Number(t.status || 0);
    return n === 429 || n === 403 || n === 407 || n === 451;
  } catch {
    return !1;
  }
}
function he(t) {
  if (t)
    try {
      localStorage.removeItem($n + t);
    } catch {
    }
}
function Gi() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf($n) === 0 && t.push(a);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((s) => {
      let a = null;
      try {
        a = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        a = null;
      }
      !a || !a.request_id || !a.ts || Date.now() - a.ts > e ? localStorage.removeItem(s) : n.push(s);
    });
    const r = 50;
    if (n.length <= r) return;
    n.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, a) => s.ts - a.ts).slice(0, n.length - r).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
function Ji(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem($n + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), Gi();
    } catch {
    }
}
function Dt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem($n + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (he(t), null) : n;
  } catch {
    return null;
  }
}
const Mr = "qm:v1:state:";
function Lt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Mr + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Tn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const ca = Tn(), Is = "qm:v1:sessionprefs-ping";
function Ye(t, e) {
  if (t)
    try {
      const r = { ...Lt(t) || {}, ...e, ts: Date.now(), origin: ca };
      localStorage.setItem(Mr + t, JSON.stringify(r)), Zi();
    } catch {
    }
}
function Zi() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Mr) === 0 && t.push(a);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((s) => {
      let a = null;
      try {
        a = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        a = null;
      }
      !a || !a.ts || Date.now() - a.ts > e ? localStorage.removeItem(s) : n.push(s);
    });
    const r = 80;
    if (n.length <= r) return;
    n.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, a) => s.ts - a.ts).slice(0, n.length - r).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
async function Ki(t) {
  try {
    const e = await fetch(
      B("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && $r(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Qi(t, e, n, r) {
  const s = ["【用户提交的问卷答案】"], a = new Set(Le(t, e));
  return t.forEach((o, d) => {
    if (!a.has(d)) return;
    const i = e[`q${d}`];
    if (!i) return;
    let x = i.value;
    if (Array.isArray(x))
      x = x.filter((y) => y !== be).map((y) => {
        const b = (o.options || []).find((S) => qe(S) === String(y));
        return b ? $e(b) : y;
      }).join("、");
    else {
      const y = (o.options || []).find((b) => qe(b) === String(x));
      y && (x = $e(y)), String(i.value) === be && (x = "");
    }
    const h = ae(o) === "single" ? "单选" : ae(o) === "multi" ? "多选" : "问答", k = !!String(x || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), f = String(i.skipped_by || ""), w = i.skipped ? f === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : f === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : k ? x : "（未作答）";
    let m = `- q${d} [${h}] ${w}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((y) => y.file_name).join("、")}）`), s.push(m);
  }), n && s.push(`- 其他意见：${n}`), r && r.length && s.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), s.join(`
`);
}
function Xi(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const s = r.value;
    if (Array.isArray(s) ? s.length === 1 && s[0] === be : String(s ?? "") === be) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const Vi = ["必须", "务必", "不得为空", "不能为空"], Yi = ["可为空", "可留空", "选填", "可选", "非必填"];
function da(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Vi.some((n) => e.indexOf(n) !== -1) ? !1 : Yi.some((n) => e.indexOf(n) !== -1);
}
function el(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = Le(t, n);
  } catch {
    return n;
  }
  return r.forEach((s) => {
    const a = t[s];
    if (!da(a)) return;
    const o = `q${s}`, d = n[o];
    if (d && (d.skipped === !0 || gt(d))) return;
    const i = ae(a);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function xn(t) {
  return t.map((e, n) => {
    const r = ae(e) === "single" ? "单选" : ae(e) === "multi" ? "多选" : "问答", s = (e.options || []).map($e).join("、");
    return `${n + 1}. [${r}] ${_n(e, n)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function yr(t) {
  const { R: e, files: n, disabled: r, uploading: s, error: a, onPick: o, onRemove: d } = t, i = {
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
  }, x = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    height: 26,
    padding: "0 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: r || s ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: r || s ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    n.map((h, k) => e.createElement(
      "span",
      { key: "att" + k, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: h.file_name
      }, h.file_name + (h.size ? "（" + Pi(h.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || d(k);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: r || s,
      style: x,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, s ? "上传中…" : "📎 附件"),
    a ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + a) : null
  );
}
function tl(t) {
  const {
    R: e,
    providers: n,
    modelId: r,
    onChange: s,
    disabled: a,
    open: o,
    onOpenChange: d,
    tab: i,
    onTabChange: x
  } = t, k = Pe().Popover, f = [];
  n.forEach((E) => {
    [...E.models || [], ...E.extra_models || []].forEach((j) => {
      f.push({
        providerId: E.id,
        providerName: E.name || E.id,
        modelId: j.id,
        modelName: j.name || j.id,
        free: !!j.is_free
      });
    });
  });
  const w = f.find((E) => `${E.providerId}:${E.modelId}` === r), y = w ? w.modelName : r || "选择模型", b = w ? w.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", S = {
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
  }, q = f.filter((E) => E.free).length, _ = f.length - q, N = [];
  n.forEach((E) => {
    const j = [...E.models || [], ...E.extra_models || []].map((M) => ({
      providerId: E.id,
      providerName: E.name || E.id,
      modelId: M.id,
      modelName: M.name || M.id,
      free: !!M.is_free
    })).filter((M) => i === "free" ? M.free : !M.free);
    j.length && N.push({ id: E.id, name: E.name || E.id, models: j });
  });
  const C = (E, j) => e.createElement("button", {
    key: E,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === E ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === E ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === E ? 600 : 400,
      boxShadow: i === E ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => x(E)
  }, j), $ = e.createElement(
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
      C("paid", "付费 🟡 " + _),
      C("free", "免费 🟢 " + q)
    ),
    N.length ? e.createElement("div", null, N.map((E, j) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: E.id,
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
          e.createElement("span", { style: { flex: 1 } }, E.name),
          e.createElement("span", { style: { fontWeight: 400 } }, E.models.length)
        ),
        E.models.map((M) => {
          const Z = `${M.providerId}:${M.modelId}` === r;
          return e.createElement(
            "div",
            {
              key: `${M.providerId}:${M.modelId}`,
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
                s(`${M.providerId}:${M.modelId}`), d(!1);
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
            }, M.modelName)
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
  return k ? e.createElement(k, {
    content: $,
    trigger: "click",
    open: o,
    onOpenChange: d,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: S,
      disabled: a,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: S,
      disabled: a,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const E = f.find((j) => `${j.providerId}:${j.modelId}` !== r);
        E && s(`${E.providerId}:${E.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function nl(t) {
  const { R: e, mode: n, onChange: r, disabled: s } = t, a = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, o = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发任何模型请求：直接采用出题时已标注的推荐，自动填入、翻页、提交",
    manual: "由你手动作答"
  }, d = (i) => e.createElement("button", {
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
      background: n === i ? "var(--app-accent, #ff7f16)" : "transparent",
      color: n === i ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
    },
    title: o[i],
    onClick: () => r(i)
  }, a[i]);
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
  }, d("ai"), d("recommend"), d("manual"));
}
function rl(t) {
  const { R: e, templates: n, value: r, open: s, onOpenChange: a, disabled: o, onSelect: d, onManage: i } = t, h = Pe().Popover, k = (n || []).find((b) => b.id === r), f = k ? k.name : "默认模板", w = {
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
    (n || []).map((b) => e.createElement(
      "div",
      {
        key: b.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (b.id === r ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: b.id === r ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          d(b.id), a(!1);
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
      }, b.name),
      b.builtin ? e.createElement("span", {
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
        a(!1), i();
      }
    }, "＋ 管理模板…")
  ), y = e.createElement(
    "button",
    {
      type: "button",
      style: w,
      disabled: o,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, f),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return h ? e.createElement(h, {
    content: m,
    trigger: "click",
    open: s,
    onOpenChange: a,
    placement: "bottomLeft"
  }, y) : y;
}
function sl(t) {
  const { R: e, open: n, templates: r, value: s, edit: a, onEditChange: o, onClose: d, onSelect: i, onSave: x, onDelete: h } = t;
  if (!n) return null;
  const k = Pe(), { Input: f, Modal: w } = k, m = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  w || (m.position = "fixed", m.right = 24, m.top = 80, m.width = 420, m.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", m.zIndex = 1100, m.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const y = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, b = !!a, S = (_, N, C, $) => f && f.TextArea ? e.createElement(f.TextArea, {
    value: _,
    rows: C,
    placeholder: $,
    onChange: (E) => N(E && E.target ? E.target.value : "")
  }) : e.createElement("textarea", {
    value: _,
    rows: C,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (E) => N(E && E.target ? E.target.value : ""),
    onChange: (E) => N(E && E.target ? E.target.value : "")
  }), q = e.createElement(
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
        b ? a.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: y, onClick: d }, "关闭")
    ),
    b ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      S(a.name || "", (_) => o({ ...a, name: _ }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      S(a.system || "", (_) => o({ ...a, system: _ }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      S(a.user || "", (_) => o({ ...a, user: _ }), 6, "用户提示词模板"),
      e.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...y,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => x(a)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: y,
          onClick: () => o(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (r || []).map(
        (_) => e.createElement(
          "div",
          {
            key: _.id,
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
            _.name + (_.builtin ? "（内置）" : "") + (_.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: y,
            title: "设为本题使用",
            onClick: () => i(_.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => o({
              id: _.id,
              name: _.name,
              system: _.system,
              user: _.user
            })
          }, "编辑"),
          _.builtin ? null : e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => h(_.id)
          }, "删除")
        )
      ),
      e.createElement(
        "div",
        { style: { marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...y,
            borderColor: "var(--app-accent, #1677ff)",
            color: "var(--app-accent, #1677ff)"
          },
          onClick: () => o({ id: "", name: "", system: "", user: "" })
        }, "＋ 新建模板")
      )
    )
  );
  return w ? e.createElement(w, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    closeIcon: null,
    onCancel: d,
    destroyOnClose: !0,
    width: "min(620px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal"
  }, q) : q;
}
function al(t) {
  const {
    R: e,
    busy: n,
    result: r,
    error: s,
    mode: a,
    onRun: o,
    onApply: d,
    onCancel: i,
    onRerun: x,
    disabled: h,
    children: k,
    open: f,
    onOpenChange: w
  } = t, y = Pe().Popover, b = e.createElement("button", {
    type: "button",
    disabled: h,
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
      cursor: h ? "default" : "pointer"
    },
    title: a === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : a === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      w(!f);
    }
  }, n ? "分析中…" : "查看分析");
  if (!y)
    return e.createElement(
      "div",
      null,
      b,
      r && f ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((N) => N.reasoning).join(`

`))) : null
    );
  const S = !!(r && (r.per_question || []).length), q = (N, C, $) => e.createElement("button", {
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
    onClick: C
  }, N), _ = e.createElement(
    "div",
    {
      className: "qm-bubble",
      style: { width: 460, maxHeight: 460, overflow: "auto", fontSize: 13 }
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
    s ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, s) : null,
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
        S && !n ? e.createElement("button", {
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
              (x || o)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        S && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: S ? 6 : "auto",
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
            d(), w(!1);
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
          dangerouslySetInnerHTML: { __html: _i(N.reasoning || "") }
        })
      ))
    ) : n || s ? null : e.createElement(
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
      }, a === "ai" ? "本题尚未生成分析。" : "本题尚未分析。点击下方按钮，用所选模型分析本题并给出推荐。"),
      // Manual mode: analysis starts on an explicit press — opening the
      // bubble is a read-only action (REQ-001).
      q("开始分析", () => {
        try {
          o();
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
    }, k)
  );
  return e.createElement(y, {
    content: _,
    trigger: "click",
    open: f,
    onOpenChange: w,
    placement: "bottomRight"
  }, b);
}
function ol(t) {
  const e = Se().React, n = Pe(), { Input: r, Button: s } = n, a = r.TextArea, o = t.data || {}, d = Ti(o), i = Ai(o), x = Ci(o), h = Ni(x), k = h ? "" : x, f = d.questions || [], w = d.title || "问卷", m = Lt(i), [y, b] = e.useState(
    () => !!(m && m.answered) || !!k || h
  ), [S, q] = e.useState(""), [_, N] = e.useState(() => {
    const c = Dt(i);
    return c && c.request_id ? c.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [C, $] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [E, j] = e.useState(
    () => m && typeof m.slowAt == "number" ? m.slowAt : 0
  ), [M, Z] = e.useState(
    () => m && typeof m.slowStep == "number" ? m.slowStep : -1
  ), [ke, K] = e.useState(
    () => !!(m && m.slowFired === !0)
  ), [R, J] = e.useState(() => {
    const c = {};
    f.forEach((g, u) => {
      c[`q${u}`] = { type: ae(g), value: ae(g) === "multi" ? [] : "", other: "" };
    });
    const p = m && m.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((g) => {
      c[g] && (c[g] = { ...c[g], ...p[g] });
    }), c;
  }), [je, On] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [U, Ee] = e.useState(!1), [Te, I] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [pe, oe] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [P, Y] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(k || "")
  ), [ie, Q] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || Ii(k || "")
  ), [Oe, st] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [De, ht] = e.useState(
    () => !!(m && m.expanded)
  ), [at, We] = e.useState(!1), bt = e.useRef(0), [ue, ba] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [He, yt] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [ot, Rn] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Mn, Bn] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [xt, Ut] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), kt = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < ur * 1e3)
  ), Ue = e.useRef(!1), Gt = e.useRef(!!(m && m.pastSoft === !0)), [Ln, ya] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), xa = e.useRef(Ln), Pr = (c) => {
    xa.current = c, ya(c);
  }, fe = (c, p) => {
    const g = Ln[c];
    return g ?? p;
  };
  na = !!fe("fallback_title", !0);
  const jr = Math.max(30, Number(fe("wait_hint_sec", ur)) || ur), ka = "manual", [V, Jt] = e.useState(ka), [Dr, Pn] = e.useState(""), [El, wa] = e.useState(!1), [jn, Dn] = e.useState(!1), [Fn, Wn] = e.useState(!1), [va, _a] = e.useState([]), [Fr, Hn] = e.useState(!1), [Zt, it] = e.useState(null), [qa, Ge] = e.useState(""), [Sa, Ea] = e.useState(!1), [Ta, Aa] = e.useState(!1), [Ca, Na] = e.useState("paid"), Fe = e.useRef({}), Re = e.useRef({}), lt = e.useRef(0), wt = e.useRef(null), [Ia, ct] = e.useState(0), [Wr, Un] = e.useState([]), [Je, Kt] = e.useState(""), Me = e.useRef(Je);
  Me.current = Je;
  const [za, $a] = e.useState(!1), [Oa, Hr] = e.useState(!1), [Ra, Gn] = e.useState(null), [Ne, Ur] = e.useState(
    () => !!(m && m.autoPaused)
  ), Ma = e.useRef(Ne);
  Ma.current = Ne;
  const dt = e.useRef(!1), Jn = e.useRef(0), Qt = e.useRef({}), [Ba, La] = e.useState(0), vt = e.useRef(/* @__PURE__ */ new Set()), _t = (c) => {
    c && vt.current.add(c);
  }, Xt = e.useRef({}), [Pa, Vt] = e.useState(0), Ze = e.useRef({}), [qt, ja] = e.useState(!1), Da = e.useRef(!1);
  Da.current = qt, e.useRef(!1);
  const Fa = async () => {
    try {
      const c = await Ft(
        "",
        !0,
        re(i),
        $t()
      );
      if (!c || !c.config) return;
      const p = c.config;
      Pr(p), p.mode !== void 0 && Jt(Ot(p.mode)), typeof p.model_id == "string" && p.model_id && Pn(p.model_id), typeof p.with_context == "boolean" && Dn(p.with_context), typeof p.parallel == "boolean" && Wn(p.parallel), ct((g) => g + 1);
    } catch {
    }
  }, Gr = e.useRef(!1), Yt = (c) => {
    if (c.mode !== void 0) {
      Jt(c.mode), fr(
        { mode: c.mode },
        re(i),
        $t()
      );
      try {
        localStorage.setItem(Is, ca + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    c.modelId !== void 0 && (p.model_id = c.modelId), c.withContext !== void 0 && (p.with_context = c.withContext), c.parallel !== void 0 && (p.parallel = c.parallel), Object.keys(p).length && (c.modelId !== void 0 && Pn(c.modelId), c.withContext !== void 0 && Dn(c.withContext), c.parallel !== void 0 && Wn(c.parallel), fr(p, re(i), $t()));
  }, Jr = (c) => {
    !c || c === Je || (Kt(c), Me.current = c, Ye(i, { templateId: c }), fr(
      { template_id: c },
      re(i),
      $t()
    ), it(null), Fe.current = {}, Re.current = {}, ct((p) => p + 1));
  }, Wa = async (c) => {
    const p = await Ys({
      id: c.id || "",
      name: c.name || "",
      system: c.system || "",
      user: c.user || ""
    });
    if (!p.ok) {
      D("error", p.error || "保存失败");
      return;
    }
    Un(p.items || []), Gn(null), D("success", "模板已保存");
  }, Ha = async (c) => {
    const p = await ea(c);
    if (!p.ok) {
      D("warning", p.error || "删除失败");
      return;
    }
    Un(p.items || []);
    const g = (p.items || []).map((u) => u.id);
    if (g.indexOf(Me.current) === -1) {
      const u = g[0] || "";
      Kt(u), Me.current = u, Ye(i, { templateId: u });
    }
    D("success", "模板已删除");
  };
  e.useEffect(() => {
    if (y) return;
    const c = (p) => {
      try {
        String(p && p.key || "") === Is && Fa();
      } catch {
      }
    };
    return window.addEventListener("storage", c), () => window.removeEventListener("storage", c);
  }, [y, i]), e.useEffect(() => {
    if (y) return;
    let c = !0;
    return fi(), (async () => {
      const [p, g, u, v] = await Promise.all([
        ta(),
        mi(),
        Or(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Ft(
          "",
          !0,
          re(i),
          $t()
        )
      ]);
      if (!c) return;
      if (_a(p), Un(u.items), v && v.config) {
        const T = v.config;
        Pr(T), T.mode !== void 0 && Jt(Ot(T.mode)), typeof T.model_id == "string" && T.model_id && Pn(T.model_id), typeof T.with_context == "boolean" && Dn(T.with_context), typeof T.parallel == "boolean" && Wn(T.parallel), typeof T.template_id == "string" && T.template_id && (Kt(T.template_id), Me.current = T.template_id);
      }
      const A = u.items.map((T) => T.id);
      if (!Me.current || A.indexOf(Me.current) === -1) {
        const T = u.defaultId || A[0] || "";
        T && (Kt(T), Me.current = T);
      }
      if (v && v.config) {
        const T = v.config;
        wa(T.__follow_active__ === !0);
      }
      Gr.current = !0, ct((T) => T + 1);
    })(), () => {
      c = !1;
    };
  }, [i]), e.useEffect(() => {
    lt.current = C;
  }, [C]);
  const Zn = async (c) => {
    if (Fr) return;
    const p = C;
    Hn(!0), Ge("");
    const g = typeof AbortController < "u" ? new AbortController() : null;
    wt.current = g;
    try {
      const u = await fetch(B("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: _,
          tool_call_id: i,
          session_id: re(i),
          title: w,
          questions: f,
          model_id: Dr,
          mode: c,
          with_context: jn,
          parallel: Fn,
          question_index: p,
          answers: R,
          template_id: Me.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(fe("model_timeout_sec", 120)) || 120
        }),
        signal: g ? g.signal : void 0
      }), v = await u.json().catch(() => ({})), A = v && v.analysis || null, T = A && A.error || v && v.error || "";
      v && v.cancelled || A && A.cancelled ? Ge("已终止分析。") : !u.ok || !v || v.ok === !1 || A && A.ok === !1 ? Ge(T || "分析失败（服务返回 " + u.status + "）") : A && (Fe.current[p] = A, Re.current[p] = !0, lt.current === p && it(A), D("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (u) {
      wt.current === g && g && g.signal.aborted || u && u.name === "AbortError" ? Ge("已终止分析。") : Ge("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      wt.current === g && (wt.current = null), Hn(!1), Ze.current[p] = !0, Vt((u) => u + 1);
    }
  }, Ua = () => {
    const c = C;
    delete Fe.current[c], it(null), Ge(""), Zn("manual");
  }, pt = (c) => {
    var g;
    const p = c !== void 0 ? c : lt.current;
    try {
      fetch(B("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: _,
          question_index: p
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      un(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (g = wt.current) == null || g.abort();
    } catch {
    }
    Hn(!1);
  }, Ga = () => {
    pt(), Ge("已终止分析。");
  }, Ja = () => {
    Ne ? (Xt.current = {}, Ze.current = {}, Re.current = {}, dt.current = !1, Ur(!1), ct((c) => c + 1), D("info", "已恢复自动答题")) : (pt(), Ur(!0), D("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (y) return;
    const c = Fe.current[C];
    it(c || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + C;
    let g = !0;
    return fetch(B("/question-modal/analysis") + p, { headers: L() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !g || !u || !u.found || !u.analysis || (Fe.current[C] = u.analysis, lt.current === C && it(u.analysis));
    }).catch(() => {
    }), () => {
      g = !1;
    };
  }, [i, C]), e.useEffect(() => {
    y || Gr.current && V === "ai" && qt && (!fn(d) || !f.length || Re.current[C] || U || (Re.current[C] = !0, Zn("auto")));
  }, [
    y,
    V,
    i,
    Ia,
    jn,
    Fn,
    f,
    C,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    qt
  ]);
  const Za = () => {
    const c = Zt && Zt.per_question || [];
    if (!c.length) return;
    if (!c.some((g) => g.type === "multi" ? String(g.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(g.choice || "").trim().length > 0)) {
      D("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    J((g) => {
      const u = { ...g };
      return c.forEach((v) => {
        const A = `q${v.index}`;
        _t(A);
        const T = u[A] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const te = String(v.choice || "").split(/[、,，]/).map((X) => X.trim()).filter(Boolean);
          u[A] = { ...T, value: te };
        } else
          u[A] = { ...T, value: v.choice || T.value };
      }), u;
    }), D("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Ke = (c, p, g = !1) => {
    pt(), ba(c), Y(!0), oe(p), We(!1), b(!0), he(i), g && Ye(i, { backendReleased: !0 });
  }, Ka = async (c, p) => {
    const g = await br(i, re(i));
    return g.ok ? (Ke(c, p, g.released), !0) : (We(!0), Qn(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const c = (p = Lt(i)) == null ? void 0 : p.answers;
    Ye(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: _,
      visStep: C,
      answers: gr(R, c, vt.current),
      finalOther: je,
      finalOtherAtt: Oe,
      answered: y,
      skippedAll: P,
      expanded: De,
      localResult: pe,
      submittedAt: ot,
      skipReason: ie,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Mn,
      waitRetired: xt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: E,
      slowStep: M,
      slowFired: ke,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: ue,
      gateBlocked: He,
      releasedNote: Te,
      autoPaused: Ne,
      templateId: Je
    });
  }, [
    i,
    _,
    C,
    R,
    je,
    Oe,
    y,
    P,
    De,
    pe,
    ot,
    ie,
    Mn,
    xt,
    E,
    M,
    ke,
    ue,
    Ne,
    Je,
    He,
    Te
  ]), e.useEffect(() => {
    if (!y || !ot || xt || !kt.current) return;
    let c = 0, p = !1, g = qs(i);
    const u = () => {
      if (p) return;
      const v = Math.floor((Date.now() - ot) / 1e3);
      if (v >= jr) {
        Ue.current = !0, Ut(!0);
        return;
      }
      if (!Ue.current) {
        const A = qs(i);
        A >= 0 && (g < 0 ? g = A : A - g >= si && (Ue.current = !0));
      }
      if (!Ue.current && v >= ni && !Gt.current && (Gt.current = !0, Bn(!0)), Ue.current) {
        c = setTimeout(
          () => {
            p || Ut(!0);
          },
          Math.max(1e3, (jr - v) * 1e3)
        );
        return;
      }
      c = setTimeout(() => {
        p || Ss(u);
      }, Xs);
    };
    return Ss(u), () => {
      p = !0, clearTimeout(c);
    };
  }, [y, ot, xt]);
  const [Kn, Qn] = e.useState(!1), [Xn, Zr] = e.useState(""), Kr = (c, p, g) => {
    c.length && (p === "final" ? st((u) => u.concat(c)) : J((u) => {
      const v = g || `q${C}`;
      _t(v);
      const A = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...A, attachments: (A.attachments || []).concat(c) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const c = (u, v, A, T) => {
      Kr(u, v, A), T && T.length ? Zr(T.join("；")) : Zr("");
    }, p = (u) => Qn(u);
    bn.set(i, c), yn.set(i, p);
    const g = Bi(i);
    return g.length && g.forEach((u) => Kr([u.att], u.target, u.key)), Qn(En > 0), () => {
      bn.get(i) === c && bn.delete(i), yn.get(i) === p && yn.delete(i);
    };
  }, [i, C]);
  const Vn = (c, p) => Ri(i, c, p), Yn = (c, p, g) => {
    const u = Li(c);
    if (u.length) {
      try {
        c.preventDefault();
      } catch {
      }
      aa(u, i, p, g);
    }
  };
  e.useEffect(() => {
    if (!h || S) return;
    let c = !0;
    return Mt(i).then((p) => {
      if (!c || !p) return;
      p.kind === "skipped" && !p.answers && Y(!0);
      const g = String(p.skip_reason || "").trim();
      g && Q((u) => u || g), q(Rt(f, p));
    }), () => {
      c = !1;
    };
  }, [h, i, S]), e.useEffect(() => {
    if (y || !i || k) return;
    let c = !0;
    return Mt(i).then((p) => {
      if (!c || !p) return;
      p.kind === "skipped" && !p.answers && Y(!0);
      const g = String(p.skip_reason || "").trim();
      g && Q((u) => u || g), q((u) => u || Rt(f, p)), oe(Rt(f, p)), b(!0), he(i);
    }), () => {
      c = !1;
    };
  }, [i, y, k]), e.useEffect(() => {
    if (y) return;
    let c = !0, p = 0, g = 0, u = 0, v = !1, A = !1, T = 0, te = 0;
    bt.current || (bt.current = Date.now());
    let X = !!Dt(i), ve = !1;
    const ye = (O) => {
      !c || !O || !O.request_id || (X = !0, g = 0, u = 0, v = !1, N(O.request_id), We(!1), T && (clearTimeout(T), T = 0), Ji(
        i,
        O.request_id,
        O.session_id || Nn(),
        O.agent_id
      ));
    }, le = (O) => {
      c && (T && (clearTimeout(T), T = 0), te && (clearTimeout(te), te = 0), Ka(
        O,
        O === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Nt = Dt(i), Ve = async () => {
      if (!Nt) return !1;
      const O = await Ki(Nt.request_id);
      if (!c) return !0;
      if (O.kind === "found") {
        const me = O.data;
        return me.tool_call_id && i && me.tool_call_id !== i ? (he(i), !1) : (ye(me), !0);
      }
      return O.kind === "orphan" ? (le("orphan"), !0) : (O.kind === "absent" && he(i), !1);
    }, _e = (O = !1) => {
      if (c) {
        if (p += 1, O || (g += 1, u || (u = Date.now())), O) {
          if (!ve) {
            ve = !0, Mt(i).then((ce) => {
              if (c) {
                if (ce) {
                  ce.kind === "skipped" && !ce.answers && Y(!0);
                  const It = String(ce.skip_reason || "").trim();
                  It && Q((lr) => lr || It), q(Rt(f, ce)), oe(Rt(f, ce)), b(!0), he(i);
                  return;
                }
                _e(!0);
              }
            });
            return;
          }
          if (X) {
            le("gone");
            return;
          }
          const me = Date.now() - (bt.current || Date.now());
          if (p >= 12 && me >= Fi) {
            le("gone");
            return;
          }
        }
        if (g >= oa) {
          if (Date.now() - (u || Date.now()) >= la) {
            if (v = !0, !A) {
              A = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !c || !v) return;
                    v = !1, g = 0, u = 0, p = 0, ne();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          T = setTimeout(ne, ia);
          return;
        }
        T = setTimeout(ne, p < Hi ? Wi : 5e3);
      }
    }, Ce = () => {
      zi(i, re(i)).then((O) => {
        if (c) {
          if (O.kind === "found") {
            ye(O.data);
            return;
          }
          if (O.kind === "orphan") {
            le("orphan");
            return;
          }
          if (O.kind === "error") {
            _e(!1);
            return;
          }
          ji(re(i)).then((me) => {
            if (c) {
              if (me) {
                if (me.tool_call_id && i && me.tool_call_id !== i) {
                  Mt(i).then((ce) => {
                    if (c) {
                      if (ce) {
                        b(!0), he(i);
                        return;
                      }
                      _e(!0);
                    }
                  });
                  return;
                }
                ye(me);
                return;
              }
              Mt(i).then((ce) => {
                if (c) {
                  if (ce) {
                    ce.kind === "skipped" && !ce.answers && Y(!0);
                    const It = String(ce.skip_reason || "").trim();
                    It && Q((lr) => lr || It), b(!0), he(i);
                    return;
                  }
                  _e(!0);
                }
              });
            }
          });
        }
      });
    }, ne = () => {
      if (c) {
        if (!Nt) {
          Ce();
          return;
        }
        Ve().then((O) => {
          !c || O || Ce();
        });
      }
    };
    return te = setTimeout(() => {
      c && We(!0);
    }, Di), ne(), () => {
      c = !1, T && clearTimeout(T), te && clearTimeout(te);
    };
  }, [y, i]);
  const Qr = async () => {
    Ee(!0);
    try {
      const c = re(i);
      let p = await br(i, c);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && c) {
        const u = await Ns(c);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const u = p.reason === "host-stop";
        Ke(
          p.reason === "orphan" ? "orphan" : "",
          p.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), D(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        Ke(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), D("info", "本次问卷已失效，已关闭");
    } catch (c) {
      D("error", "释放失败: " + (c && c.message ? c.message : c));
    } finally {
      Ee(!1);
    }
  }, Xr = async () => {
    Ee(!0);
    try {
      const c = re(i);
      let p = await br(i, c);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && c) {
        const u = await Ns(c);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        I(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), D("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const u = p.reason === "host-stop";
        I(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), D("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        I("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), D("info", "后端已无此阻塞，无需释放");
    } catch (c) {
      D("error", "释放失败: " + (c && c.message ? c.message : c));
    } finally {
      Ee(!1);
    }
  }, en = Le(f, R), Qe = en.length, Ae = C >= Qe, ee = Ae ? -1 : en[C], St = Ae ? Qe : C;
  e.useEffect(() => {
    if (Ot(fe("mode", "manual")) !== "manual") return;
    const p = String(fe("notify_channel", "off") || "off"), g = !!fe("notify_manual_mode", !1);
    if (p === "off" && !g || y || P || ue || !fn(d) || !f.length) return;
    const u = Le(f, R).filter((v) => !gt(R[`q${v}`])).length;
    ti(i, w, u);
  }, [Ln, y, P, ue, St]);
  const tn = Math.max(0, Number(fe("slow_question_sec", ri)) || 0) * 1e3, Qa = Math.round(tn / 1e3);
  e.useEffect(() => {
    if (y || P || ue || tn <= 0) return;
    if (M !== St) {
      Z(St), j(Date.now()), K(!1);
      return;
    }
    if (!E) {
      j(Date.now());
      return;
    }
    if (ke) return;
    const c = E + tn - Date.now();
    if (c <= 0) {
      K(!0);
      return;
    }
    let p = !1;
    const g = setTimeout(() => {
      p || K(!0);
    }, c);
    return () => {
      p = !0, clearTimeout(g);
    };
  }, [y, P, ue, St, M, E, ke, tn]);
  const we = ee >= 0 ? f[ee] : null, ut = `q${ee}`, G = ee >= 0 && R[ut] || { type: ae(we), value: ae(we) === "multi" ? [] : "", other: "" }, ft = (c) => {
    var u;
    He && yt(""), ee >= 0 && _t(`q${ee}`);
    const p = { ...R, [ut]: { ...c, skipped: !1 } }, g = Le(f, p);
    f.forEach((v, A) => {
      g.indexOf(A) === -1 && delete p[`q${A}`];
    }), Ye(i, {
      answers: gr(p, (u = Lt(i)) == null ? void 0 : u.answers, vt.current)
    }), J(p);
  };
  e.useEffect(() => {
    C > Qe && $(Qe);
  }, [Qe, C]);
  const er = async (c, p) => {
    const g = await fetch(B(c), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(p)
    }), u = await g.json().catch(() => ({}));
    if (!g.ok) {
      const v = new Error(u && u.detail || "HTTP " + g.status);
      throw v.status = g.status, v;
    }
    return u;
  }, tr = () => {
    var c;
    return Xi(gr(
      el(f, R),
      (c = Lt(i)) == null ? void 0 : c.answers,
      vt.current
    ));
  }, Xa = () => !!fe("gate_unsaved", !0), Va = (c) => da(c), Vr = (c, p) => {
    if (!Xa()) return [];
    const g = new Set(Le(f, c)), u = (A) => g.has(A) && !gt(c[`q${A}`]) && !Va(f[A]), v = [];
    return typeof p == "number" ? (u(p) && v.push(p + 1), v) : (f.forEach((A, T) => {
      u(T) && v.push(T + 1);
    }), v);
  }, Yr = (c, p, g) => {
    const u = "第 " + c.join("、") + " 题", v = g === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    yt("⛔ " + u + "尚未选择。" + v);
    const A = Le(f, p).length;
    er("/question-modal/gate-block", {
      request_id: _,
      tool_call_id: i,
      session_id: re(i),
      missing: c,
      answered: A - c.length,
      total: A,
      bundle: vs
    }).catch(() => {
    });
  }, nn = async (c, p = !1) => {
    if (!_)
      return D("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const g = tr();
    if (!p) {
      const u = Vr(g);
      if (u.length)
        return Yr(u, g, "提交"), "blocked";
      yt("");
    }
    Ee(!0);
    try {
      const u = await er("/question-modal/answer", {
        request_id: _,
        session_id: re(i),
        answers: g,
        other: je,
        attachments: Oe
      });
      return u && u.orphan ? (fetch(
        B("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(re(i)),
        { method: "POST", headers: L() }
      ).catch(() => {
      }), Ke(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), D("info", "本次问卷已失效，已关闭"), "sent") : (he(i), oe(Qi(f, g, je, Oe)), Rn(Date.now()), Bn(!1), Ut(!1), Ue.current = !1, Gt.current = !1, kt.current = !0, b(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Ke(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), D("info", "本次问卷已失效，已关闭"), "blocked") : (D("error", "提交失败: " + u.message), p ? (dt.current = !1, Jn.current += 1, Jn.current >= cr && D(
        "warning",
        "自动提交连续失败 " + cr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Vt((v) => v + 1), "not-ready") : "blocked");
    } finally {
      Ee(!1);
    }
  }, es = () => fe("skip_mode", "per_question") === "whole", Ya = () => {
    ee < 0 || (He && yt(""), pt(lt.current), Re.current[lt.current] = !0, _t(`q${ee}`), J((c) => {
      const p = { ...c };
      p[`q${ee}`] = {
        type: (c[`q${ee}`] || {}).type || ae(we),
        value: ((c[`q${ee}`] || {}).type || ae(we)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const g = Le(f, p);
      return f.forEach((u, v) => {
        g.indexOf(v) === -1 && delete p[`q${v}`];
      }), p;
    }), $((c) => c + 1));
  }, eo = () => {
    if (Ae) {
      nn();
      return;
    }
    const c = tr(), p = Vr(c, ee);
    if (p.length) {
      Yr(p, c, "下一步");
      return;
    }
    He && yt(""), $((g) => g + 1);
  }, to = async () => {
    if (!_) {
      D("warning", "问卷尚未就绪，请稍候");
      return;
    }
    pt(), Ee(!0);
    try {
      const c = await er("/question-modal/skip", {
        request_id: _,
        session_id: re(i)
      });
      if (c && c.orphan) {
        Ke(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), D("info", "本次问卷已失效，已关闭");
        return;
      }
      D("info", "已跳过问卷"), he(i), Y(!0), Q("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), oe("用户跳过了本次问卷。"), Rn(Date.now()), Bn(!1), Ut(!1), Ue.current = !1, Gt.current = !1, kt.current = !0, b(!0);
    } catch (c) {
      if (c && c.status === 404) {
        Ke(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), D("info", "本次问卷已失效，已关闭");
        return;
      }
      D("error", "跳过失败: " + c.message);
    } finally {
      Ee(!1);
    }
  };
  e.useEffect(() => {
    if (y || V !== "ai" && V !== "recommend" || Ne || (V === "recommend" || V === "ai") && !qt || !fn(d) || !f.length || U) return;
    if (Ae) {
      if (dt.current || Jn.current >= cr) return;
      const X = tr();
      if (!en.every(
        (ye, le) => !!Ze.current[le] || gt(X[`q${ye}`])
      ) || !_) return;
      dt.current = !0, nn(void 0, !0).then((ye) => {
        ye === "not-ready" && (dt.current = !1);
      });
      return;
    }
    const c = C;
    if (Xt.current[c] || V === "ai" && !Ze.current[c]) return;
    const p = en[c], g = f[p], u = ae(g), v = Es(g), A = Ts(Fe.current[c], p);
    if (V === "ai" && !Ze.current[c]) return;
    Xt.current[c] = !0;
    const T = v.length ? v.join("、") : A, te = !!T;
    _t(`q${p}`), te || (Qt.current[p] = !0, La((X) => X + 1), D("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), J((X) => {
      const ve = { ...X }, ye = `q${p}`, le = ve[ye] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!te)
        ve[ye] = {
          ...le,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const Ve = g.options || [], _e = (ne) => String(ne).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ce = T.split(/[、,，]/).map((ne) => _e(ne)).filter(Boolean).map((ne) => {
          const O = Ve.find((me) => qe(me) === ne || $e(me) === ne);
          return O ? qe(O) : ne;
        });
        ve[ye] = {
          ...le,
          type: u,
          value: Ce,
          other: Ce.length === 1 && Ce[0] === be ? le.other : "",
          attachments: Ce.length === 1 && Ce[0] === be ? le.attachments : []
        };
      } else if (u === "single") {
        const Ve = g.options || [], _e = (O) => String(O).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ce = Ve.find((O) => qe(O) === T || $e(O) === T) || Ve.find((O) => qe(O) === _e(T) || $e(O) === _e(T)), ne = Ce ? qe(Ce) : T;
        ve[ye] = {
          ...le,
          type: u,
          value: ne,
          other: String(ne) === be ? le.other : "",
          attachments: String(ne) === be ? le.attachments : []
        };
      } else
        ve[ye] = { ...le, type: u, value: T };
      const Nt = Le(f, ve);
      return f.forEach((Ve, _e) => {
        Nt.indexOf(_e) === -1 && delete ve[`q${_e}`];
      }), ve;
    }), Re.current[c] = !0, Ze.current[c] = !0, $((X) => X + 1), Vt((X) => X + 1);
  }, [
    y,
    V,
    Ne,
    U,
    i,
    C,
    Pa,
    Qe,
    d,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    _,
    qt
  ]);
  const Et = e.useRef(!1), Xe = e.useRef(0), Tt = e.useRef(!1), Be = e.useRef({});
  e.useEffect(() => {
    if (y || !i) return;
    let c = !0;
    const p = (u) => {
      if (!(!c || !u)) {
        Et.current = !0, Tt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!f || f.length), u.answers && typeof u.answers == "object" && (J((A) => {
            const T = { ...A };
            return Object.keys(u.answers).forEach((te) => {
              const X = u.answers[te];
              !X || typeof X != "object" || vt.current.has(te) || (T[te] = {
                ...T[te] || { type: "single", value: "", other: "" },
                ...X
              });
            }), T;
          }), Ye(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && $(u.cursor), typeof u.mode == "string" && u.mode) {
            const A = Ot(u.mode);
            Jt((T) => T === A ? T : A);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((A) => {
            const T = parseInt(A, 10);
            !isNaN(T) && u.per_question[A] && (Fe.current[T] = u.per_question[A]);
          }), u.status === "submitted" && (Rn((A) => A || Date.now()), u.released && Ye(i, { backendReleased: !0 }), b(!0), he(i));
          const v = String(u.skip_reason || "").trim();
          v && Q((A) => A || v), typeof u.mode == "string" && u.mode && (Be.current.mode = Ot(u.mode)), Object.keys(u.answers || {}).forEach((A) => {
            Be.current["a:" + A] = JSON.stringify(u.answers[A] || {});
          }), typeof u.cursor == "number" && (Be.current.cursor = "c:" + u.cursor), Tt.current = !0, Vt((A) => A + 1);
        } finally {
          setTimeout(() => {
            Et.current = !1;
          }, 0);
        }
      }
    };
    gi(i).then((u) => {
      !c || !u || !u.found || !u.state || (Xe.current = Math.max(Xe.current, u.rev), p(u.state));
    });
    const g = hi(i, {
      onSnapshot: (u, v) => {
        Xe.current = Math.max(Xe.current, u), v && p(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= Xe.current && u.origin !== Tn() || (Xe.current = Math.max(Xe.current, v), !(u.origin && u.origin === Tn()) && p(u.state));
      },
      onStatus: (u) => {
        c && ja((v) => v === !u ? v : !u);
      }
    });
    return () => {
      c = !1, g();
    };
  }, [y, i]), e.useEffect(() => {
    y || !i || Et.current || Tt.current && Object.keys(R || {}).forEach((c) => {
      const p = JSON.stringify(R[c] || {});
      Be.current["a:" + c] !== p && (Be.current["a:" + c] = p, un(
        i,
        "set_answer",
        { key: c, answer: R[c] }
      ));
    });
  }, [y, i, JSON.stringify(R)]), e.useEffect(() => {
    if (y || !i || Et.current || !Tt.current) return;
    const c = "c:" + C;
    Be.current.cursor !== c && (Be.current.cursor = c, un(i, "goto", { cursor: C }));
  }, [y, i, C]), e.useEffect(() => {
    y || !i || Et.current || Tt.current && Be.current.mode !== V && (Be.current.mode = V, un(i, "set_mode", { mode: V }));
  }, [y, i, V]);
  const rn = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, nr = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, rr = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, sn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, sr = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, ts = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, ar = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, no = { display: "flex", flexDirection: "column", gap: 8 }, an = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, on = {
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
  }, At = {
    ...on,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, ro = {
    ...on,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, or = {
    ...on,
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
  }, ns = {
    // Restored to the original look (user asked for options to stay as-is).
    ...or,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, rs = {
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
  }, so = { height: 32, fontSize: 13, borderRadius: 8 }, ss = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, as = (c) => {
    const p = qe(c);
    return G.type === "multi" ? Array.isArray(G.value) && G.value.indexOf(p) !== -1 : G.value === p;
  }, os = as(be), is = (c) => {
    if (y || U) return;
    const p = qe(c);
    if (G.type === "multi") {
      const g = Array.isArray(G.value) ? G.value.slice() : [], u = g.indexOf(p);
      u === -1 ? g.push(p) : g.splice(u, 1);
      const v = g.length === 1 && g[0] === be;
      ft({
        ...G,
        value: g,
        other: v ? G.other : "",
        attachments: v ? G.attachments : []
      });
    } else {
      const g = p === be;
      ft({
        ...G,
        value: p,
        other: g ? G.other : "",
        attachments: g ? G.attachments : []
      });
    }
  }, ao = !!fe("show_recommend_badge", !0), ls = fe("badge_position", "left") === "right", oo = fe("badge_style", "rect") === "round", cs = (c) => c && ao ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: oo ? { ...rs, borderRadius: 999 } : rs
  }, "AI 推荐") : null, io = !!fe("auto_number_options", !0), lo = !!fe("highlight_recommended", !1), co = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, ds = (c, p, g, u, v, A) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: y || U,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && lo ? { ...p ? ns : or, ...co } : p ? ns : or,
      onClick: g
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    ls ? null : cs(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (A && io ? A + ". " : "") + c),
    ls ? cs(v) : null
  );
  if (!y && !fn(d))
    return e.createElement(
      "div",
      { style: rn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: nr, className: "qm-header" },
        e.createElement(
          "div",
          { style: rr },
          dr(e),
          e.createElement("span", { style: sn, className: "qm-title" }, w)
        ),
        e.createElement("span", { style: sr }, "准备中")
      ),
      e.createElement("div", {
        style: { ...ts, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      at ? e.createElement(
        "div",
        { style: an },
        e.createElement("button", {
          type: "button",
          disabled: U,
          style: { ...At, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Qr
        }, "释放本次问卷")
      ) : null
    );
  if (y) {
    const c = () => {
      const g = li({
        submittedAt: ot,
        deadReason: ue,
        releasedNote: Te,
        skippedAll: P,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: xt,
        pastSoft: Mn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!kt.current
      });
      return g ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": i,
        "data-qm-phase": g.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: g.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, ii(g.phase)) : null;
    }, p = !!kt.current;
    return P && !De ? e.createElement(
      "div",
      {
        style: {
          ...rn,
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
        ue ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      ie ? e.createElement("span", {
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
        title: ie
      }, ie) : null,
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
          ...sn,
          flex: Te || ie ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: w
      }, w),
      Te ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Te) : c(),
      e.createElement("button", {
        type: "button",
        style: {
          ...At,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => ht(!0)
      }, "展开"),
      // Escape hatch for the「already finished but the chat is still locked」
      // shape: the card can be settled while the agent's Future was never
      // actually resolved (orphaned record / cross-generation reload / race),
      // so the chat keeps answering 409 and the user has nothing left to
      // click.  This button therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
      p ? e.createElement("button", {
        type: "button",
        disabled: U,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...At,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Xr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: rn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...nr, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: rr },
          dr(e),
          e.createElement("span", { style: sn }, w)
        ),
        e.createElement(
          "span",
          { style: { ...sr, color: ue ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          ue ? "已失效" : P ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      P && (ie || ue) ? e.createElement(
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
        String(ie || ue || "问卷已失效/跳过")
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
      }, P ? pe ? pe + `

` + xn(f) : `已跳过本次问卷。

` + xn(f) : pe || S || k || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + xn(f)),
      P && De ? e.createElement(
        "div",
        { style: an },
        e.createElement("button", {
          type: "button",
          style: At,
          onClick: () => ht(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...an, marginTop: 8, gap: 10 } },
        Te ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Te) : c(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: U,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...At, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Xr
        }, "释放阻塞") : null
      )
    );
  }
  const ps = ke && M === St, us = !y && !Ae && Ba >= 0 && Qt.current[ee] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, fs = Object.keys(Qt.current).map((c) => Number(c)).filter((c) => Qt.current[c] && Number.isFinite(c)).sort((c, p) => c - p), po = Ae && fs.length ? e.createElement("div", {
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
  }, "⚠ 第 " + fs.map((c) => c + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let ln = null;
  if (Ae)
    ln = e.createElement(
      "div",
      null,
      e.createElement("div", { style: ar }, "其他意见（可选）"),
      po,
      e.createElement(a, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: je,
        style: ss,
        onChange: (c) => On(c.target.value),
        onPaste: (c) => Yn(c, "final", "final")
      }),
      yr({
        R: e,
        files: Oe,
        disabled: y || U,
        uploading: Kn,
        error: Xn,
        onPick: () => Vn("final", "final"),
        onRemove: (c) => st((p) => p.filter((g, u) => u !== c))
      })
    );
  else if (we && ae(we) === "text")
    ln = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...ar, fontSize: 13, color: "var(--app-text, inherit)" } }, _n(we, ee)),
      us,
      e.createElement(a, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof G.value == "string" ? G.value : "",
        style: ss,
        onChange: (c) => ft({ ...G, value: c.target.value, other: "" }),
        onPaste: (c) => Yn(c, "q", ut)
      }),
      yr({
        R: e,
        files: G.attachments || [],
        disabled: y || U,
        uploading: Kn,
        error: Xn,
        onPick: () => Vn("q", ut),
        onRemove: (c) => ft({
          ...G,
          attachments: (G.attachments || []).filter((p, g) => g !== c)
        })
      })
    );
  else if (we) {
    const c = Es(we), p = Ts(Zt, ee), g = c.length ? c : p ? [p] : c, u = (we.options || []).map((v, A) => ds(
      $e(v),
      as(v),
      () => is(v),
      "o" + A,
      qi(we, v, g),
      A + 1
    ));
    u.push(ds("其他", os, () => is(be), "other")), os && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: G.other,
      style: { ...so, marginTop: 2 },
      onChange: (v) => ft({ ...G, other: v.target.value }),
      onPaste: (v) => Yn(v, "q", ut)
    })), u.push(yr({
      R: e,
      files: G.attachments || [],
      disabled: y || U,
      uploading: Kn,
      error: Xn,
      onPick: () => Vn("q", ut),
      onRemove: (v) => ft({
        ...G,
        attachments: (G.attachments || []).filter((A, T) => T !== v)
      })
    }))), ln = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...ar, fontSize: 13, color: "var(--app-text, inherit)" } }, _n(we, ee)),
      us,
      e.createElement("div", { style: { ...no, marginTop: 8 } }, u)
    );
  }
  const ir = Qe + 1, uo = Ae ? ir + "/" + ir : C + 1 + "/" + ir, Ct = {
    ...on,
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
    { style: rn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: nr, className: "qm-header" },
      e.createElement(
        "div",
        { style: rr },
        dr(e),
        e.createElement("span", { style: sn, className: "qm-title" }, w)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        tl({
          R: e,
          providers: va,
          modelId: Dr,
          disabled: y || U,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: Ta,
          onOpenChange: Aa,
          tab: Ca,
          onTabChange: Na,
          onChange: (c) => {
            Yt({ modelId: c }), it(null), Fe.current = {}, Re.current = {}, ct((p) => p + 1);
          }
        }),
        rl({
          R: e,
          templates: Wr,
          value: Je,
          open: za,
          onOpenChange: $a,
          disabled: y || U,
          onSelect: Jr,
          onManage: () => Hr(!0)
        }),
        nl({
          R: e,
          mode: V,
          disabled: y || U,
          onChange: (c) => {
            Yt({ mode: c }), c === "ai" && (Re.current = {}), c === "ai" || c === "recommend" ? (Xt.current = {}, Ze.current = {}, dt.current = !1, ct((p) => p + 1)) : pt();
          }
        }),
        al({
          R: e,
          busy: Fr,
          result: Zt,
          error: qa,
          mode: V,
          disabled: y || U,
          open: Sa,
          onOpenChange: Ea,
          onRun: () => {
            Zn("manual");
          },
          onRerun: Ua,
          onApply: Za,
          onCancel: Ga,
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
                checked: jn,
                onChange: (c) => Yt({ withContext: !!c.target.checked })
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
                checked: Fn,
                onChange: (c) => Yt({ parallel: !!c.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (V === "ai" || V === "recommend") && !y ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: U,
          onClick: Ja,
          style: {
            ...Ct,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...Ne ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: Ne ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, Ne ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: sr, key: "qm-step" }, uo)
      )
    ),
    e.createElement("div", { style: ts }, ln),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    sl({
      R: e,
      open: Oa,
      templates: Wr,
      value: Je,
      edit: Ra,
      onEditChange: Gn,
      onClose: () => {
        Hr(!1), Gn(null);
      },
      onSelect: (c) => Jr(c),
      onSave: Wa,
      onDelete: Ha
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
    (ps || at && !_) && !y ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": ke ? i : void 0,
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
        (ps ? "⚠️ 本题已超过 " + Qa + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (_ ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: U,
        style: {
          ...Ct,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Qr,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    He && !y ? e.createElement("div", {
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
      "data-qm-bundle": vs
    }, He) : null,
    e.createElement(
      "div",
      { style: an, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: C === 0 || U,
        style: { ...Ct, marginRight: "auto", opacity: C === 0 ? 0.5 : 1 },
        onClick: () => $((c) => c - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: U,
          style: Ct,
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
          onClick: Ae ? () => nn(void 0, !0) : es() ? () => nn(void 0, !0) : Ya
        },
        Ae || es() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: U,
        style: Ct,
        onClick: to
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: U,
        style: ro,
        onClick: eo
      }, Ae ? "提交" : "下一步")
    )
  );
}
const zs = 12;
let $s = 0;
const l = {
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
let Bt = null;
function se(t, e, n) {
  if (t in l.draft) return l.draft[t];
  if (n === "global") {
    const a = l.cfg && l.cfg.globalConfig || l.globalCfg;
    return a && t in a ? a[t] : e;
  }
  const r = l.cfg && l.cfg.config, s = l.cfg && l.cfg.sessionConfig;
  if (s) {
    if (t in s) return s[t];
    const a = l.cfg && l.cfg.globalConfig || l.globalCfg;
    return a && t in a ? a[t] : e;
  }
  return r && t in r && l.cfg && l.cfg.has_session === !0 ? r[t] : (r && t in r && !(l.cfg && l.cfg.has_session), e);
}
function il(t) {
  const e = l.cfg && l.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function ge(t, e) {
  let n;
  const r = l.cfg;
  if (l.scope === "global") {
    const s = r && r.globalConfig || l.globalCfg || {};
    n = t in s ? s[t] : void 0;
  } else {
    const s = r && r.sessionConfig;
    if (s)
      if (t in s)
        n = s[t];
      else {
        const a = r && r.globalConfig || l.globalCfg || {};
        n = t in a ? a[t] : void 0;
      }
    else {
      const a = r && r.config;
      n = a && t in a ? a[t] : void 0;
    }
  }
  n === e ? delete l.draft[t] : l.draft[t] = e, l.saveMsg = "", z();
}
function Os() {
  return Object.keys(l.draft).length;
}
async function Br() {
  try {
    const t = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    l.globalCfg = n && typeof n == "object" ? n : {};
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function pa() {
  try {
    const t = await fetch(B("/question-modal/notify/channels"), {
      headers: L()
    });
    if (!t.ok) return;
    const e = await t.json();
    l.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], l.notifyCurrent = String(e && e.effective || "off");
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function Lr(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        B("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: L() }
      );
      if (!e.ok) return;
      const n = await e.json();
      l.notifyLog = {
        ...l.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        z();
      } catch {
      }
    } catch {
    }
}
async function ll(t) {
  if (!t || t === "off") return;
  l.notifyTesting = t, l.notifyMsg = { ...l.notifyMsg, [t]: "发送中…" };
  try {
    z();
  } catch {
  }
  let e = "", n = null;
  try {
    n = await (await fetch(B("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...L(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: t })
    })).json().catch(() => ({})), n && n.delivered ? e = n.note ? "✓ 已发送（" + n.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (n && (n.error || n.reason) || "测试失败");
  } catch (s) {
    e = "✗ 请求失败：" + String(s && s.message || s);
  }
  l.notifyTesting = "", l.notifyMsg = { ...l.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (l.notifyLog = { ...l.notifyLog, [t]: r }), await pa(), r || await Lr(t);
  try {
    z();
  } catch {
  }
}
async function cl() {
  if (l.saving) return;
  const t = Object.keys(l.draft), e = l.scope === "session", n = {};
  if (t.forEach((r) => {
    n[r] = l.draft[r];
  }), !t.length && !e) {
    const r = l.globalCfg || {};
    Object.keys(r).forEach((s) => {
      s in n || (n[s] = r[s]);
    });
  }
  t.length, l.saving = !0, l.saveMsg = "", z();
  try {
    let r = "/question-modal/prefs", s = n;
    e && (r = "/question-modal/session-prefs", s = {
      chat_id: l.chatId,
      session_id: l.sessionId,
      agent_id: l.agentId,
      settings: n,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: l.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const a = await fetch(B(r), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(s)
    }), o = await a.json().catch(() => ({}));
    if (!a.ok) {
      l.saving = !1, l.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + a.status + "）", z();
      return;
    }
    const d = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (d.length) {
      l.saving = !1;
      const f = d.map((w) => `${w.key}：${w.reason || "取值不合法"}`).join("；");
      l.saveMsg = "部分设置未生效 —— " + f, z();
      return;
    }
    l.saving = !1, l.draft = {}, Vs();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (l.conflictNote = "", i.length) {
      const f = (y) => {
        try {
          const b = new Date(y * 1e3), S = (q) => q < 10 ? "0" + q : String(q);
          return b.getMonth() + 1 + "-" + S(b.getDate()) + " " + S(b.getHours()) + ":" + S(b.getMinutes()) + ":" + S(b.getSeconds());
        } catch {
          return "";
        }
      }, w = i.reduce(
        (y, b) => Math.max(y, Number(b && b.at) || 0),
        0
      ), m = i.map((y) => String(y && y.key || "")).filter(Boolean);
      l.conflictNote = "设置已于 " + f(w) + " 被其它位置修改，本次已按后写入的值覆盖" + (m.length ? "（" + m.join("、") + "）" : "") + "。";
    }
    try {
      const f = o && o.key_ts || {};
      f && typeof f == "object" && (l.keyTs = Object.assign({}, l.keyTs, f));
    } catch {
    }
    e || Br();
    const h = ["session", "default"].indexOf(String(l.tab)) >= 0;
    let k = "";
    if (h && (k = e ? "session" : "default"), k === "default") {
      try {
        const f = await fetch(B("/question-modal/session-prefs"), {
          method: "POST",
          headers: L(),
          body: JSON.stringify({
            chat_id: l.chatId || "",
            session_id: l.sessionId || "",
            agent_id: l.agentId || "",
            // 2026-11-13 方案 D1（用户裁定）：切到默认模式**只打标记**，
            // 不删本会话的自定义项 —— 这样切回会话模式时数据原样恢复。
            //
            // 旧做法是 settings:{}（= 清空整条覆盖），实测会把会话里设过的
            // 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
            settings: {},
            set_scope: "default"
          })
        });
        f.ok || (l.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + f.status + "），本会话仍在会话模式。", k = "");
      } catch (f) {
        l.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (f && f.message ? f.message : f) + "，本会话仍在会话模式。", k = "";
      }
      l.keyTs = {};
    }
    if (k && (l.scopeChoice = k, l.tab = k, l.scope = k === "session" ? "session" : "global"), k === "default")
      l.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (k === "session")
      l.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const f = String(l.tab) === "prompt" ? "提示词模板" : "全局配置";
      l.saveMsg = "已保存" + f + "；运行模式未变" + (l.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Ft(
      l.chatId,
      !0,
      l.sessionId,
      l.agentId
    ).then((f) => {
      f && (l.cfg = f);
      try {
        z();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    l.saving = !1, l.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    z();
  } catch {
  }
}
function ua() {
  l.draft = {}, l.saveMsg = "";
}
function fa() {
  Or().then((t) => {
    l.templates = (t && t.items || []).filter((e) => e && e.id), l.templateOptions = l.templates.map((e) => e.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
  });
}
function dl() {
  l.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, l.saveMsg = "", z();
}
function pl(t) {
  const e = l.templates.filter((n) => n.id === t)[0];
  e && (l.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, l.saveMsg = "", z());
}
function Rs(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  l.tplEdit && (l.tplEdit[t] = e, z());
}
function ul() {
  l.tplEdit = null, z();
}
async function fl() {
  const t = l.tplEdit;
  if (!t || l.tplBusy) return;
  try {
    const s = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    s && typeof s.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((a) => {
      const o = s.querySelector('[data-qm-tpl-field="' + a + '"]');
      o && typeof o.value == "string" && o.value !== "" && (t[a] = o.value);
    });
  } catch {
  }
  const e = String(t.name || "").trim();
  if (!e) {
    l.saveMsg = "模板名称不能为空", z();
    return;
  }
  l.tplBusy = !0, z();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await Ys(n);
  if (l.tplBusy = !1, r && r.ok === !1) {
    l.saveMsg = String(r.error || r.detail || "保存失败"), z();
    return;
  }
  l.tplEdit = null, l.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", fa(), z();
}
async function ml(t) {
  const e = l.templates.filter((s) => s.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await ea(t);
  if (r && r.ok === !1) {
    l.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), z();
    return;
  }
  l.saveMsg = "模板已删除", fa(), z();
}
function gl() {
  l.visible = !0, l.chatId = "", l.sessionId = Nn(), l.cfg = null, l.cfgError = "", hl(), ma(), l.agentId = Cn || (() => {
    try {
      return Se().getSelectedAgentId ? Se().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Vs();
  const t = ++$s;
  l.scopeChoice = "", l.tab = "", l.scope = "global", l.draft = {}, l.saveMsg = "", l.conflictNote = "", z(), ga(() => {
    if (t !== $s) return;
    const n = !!(l.cfg && l.cfg.has_session) ? "session" : "default";
    l.scopeChoice = n, l.tab = n === "session" ? "session" : "default", l.scope = n === "session" ? "session" : "global", l.draft = {}, l.saveMsg = "", l.keyTs = Object.assign(
      {},
      l.cfg && l.cfg.keyTs || {}
    ), l.conflictNote = "", z(), (l.tab === "global" || l.tab === "default") && Br(), pa().then(() => {
      const r = String(l.notifyCurrent || "off");
      r && r !== "off" && Lr(r);
    });
  });
}
let xr = !1;
async function ma() {
  if (!xr) {
    xr = !0;
    try {
      const t = await Ft(""), e = t && t.config && t.config.release_after_sec;
      l.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      l.stale.threshold = null;
    } finally {
      xr = !1;
      try {
        z();
      } catch {
      }
    }
  }
}
let mn = !1;
function hl() {
  mn || (mn = !0, Promise.all([ta(), Or()]).then((t) => {
    mn = !1;
    const e = t[0] || [], n = t[1] || {};
    l.providerGroups = e.map((r) => {
      const s = String(r && (r.id || r.provider_id) || ""), o = (r && r.models || []).concat(r && r.extra_models || []).filter(Boolean).map((d) => {
        const i = typeof d == "string" ? d : d && (d.name || d.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: s,
        name: String(r && (r.name || r.title) || s),
        models: o
      };
    }).filter((r) => r.id && r.models.length > 0), l.modelOptions = l.providerGroups.flatMap((r) => r.models.map((s) => r.id + ":" + s)), l.templates = (n.items || []).filter((r) => r && r.id), l.templateOptions = l.templates.map((r) => r.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
    mn = !1;
  }));
}
function bl(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let kr = !1, gn = "";
const wr = [];
function ga(t) {
  const e = l.chatId, n = (e || "") + "|" + (l.sessionId || "");
  if (kr && gn === n) {
    t && wr.push(t);
    return;
  }
  kr = !0, gn = n;
  const r = () => {
    gn === n && (kr = !1, gn = "");
    const s = wr.splice(0);
    try {
      s.forEach((a) => a());
    } catch {
    }
  };
  t && wr.push(t), Ft(
    e,
    !0,
    l.sessionId,
    l.agentId
  ).then((s) => {
    if (l.chatId !== e) {
      r();
      return;
    }
    s ? (l.cfg = s, l.cfgError = "") : (l.cfgError = "读取配置失败（后端不可达）", l.tab || (l.tab = "default", l.scopeChoice = "default", l.scope = "global")), r();
    try {
      z();
    } catch {
    }
  }).catch(() => {
    l.tab || (l.tab = "default", l.scopeChoice = "default", l.scope = "global", l.cfgError = "读取配置失败（网络异常）"), r();
    try {
      z();
    } catch {
    }
  });
}
function z() {
  const t = Se().React, e = Se().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (l.visible) {
        try {
          const n = Pe();
          n && n.Modal && typeof n.Modal.info == "function" && n.Modal.info({
            title: "问卷设置",
            centered: !0,
            width: 480,
            okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。"
          });
        } catch {
        }
        l.visible = !1;
      }
      return;
    }
    Bt || (Bt = document.createElement("div"), Bt.id = "qm-settings-root", document.body.appendChild(Bt)), e.render(t.createElement(_l, {
      R: t,
      open: l.visible,
      onClose: () => {
        if (Os() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          ua();
        }
        l.visible = !1, l.saveMsg = "", z();
      },
      tab: l.tab,
      onTabChange: (n) => {
        l.tab = n, (n === "session" || n === "default") && (l.scopeChoice = n), l.scope = ha(n) ? "session" : "global", l.saveMsg = "", l.draft = {}, z(), ga(), (n === "global" || n === "default") && Br(), n === "stale" && ma();
      },
      scope: l.scope,
      scopeChoice: l.scopeChoice,
      sessData: l.sessData,
      cfg: l.cfg,
      cfgError: l.cfgError,
      chatId: l.chatId,
      dirtyCount: Os(),
      saving: l.saving,
      saveMsg: l.saveMsg,
      conflictNote: l.conflictNote,
      modelOptions: l.modelOptions,
      templateOptions: l.templateOptions,
      providerGroups: l.providerGroups,
      templates: l.templates,
      tplEdit: l.tplEdit,
      tplBusy: l.tplBusy,
      // ★ 漏传这一行 = 挂起清理页签永远空白（2026-11-15 实测缺陷）：
      //   组件读的是 props.stale，只更新 settingsState 不会触发可见变化。
      stale: l.stale
    }), Bt);
  }
}
function yl(t) {
  const { R: e, onOpen: n } = t, r = Pe(), s = r && r.Button, a = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, d = { title: a, "aria-label": a }, i = {
    width: 12,
    height: 12,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
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
  }, x = e.createElement("svg", i, [
    e.createElement("path", {
      key: 1,
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }),
    e.createElement("polyline", { key: 2, points: "14 2 14 8 20 8" }),
    e.createElement("line", { key: 3, x1: 16, y1: 13, x2: 8, y2: 13 }),
    e.createElement("line", { key: 4, x1: 16, y1: 17, x2: 8, y2: 17 }),
    e.createElement("polyline", { key: 5, points: "10 9 9 9 8 9" })
  ]);
  return x ? s ? e.createElement(s, {
    type: "text",
    size: "small",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, x) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, x) : s ? e.createElement(
    s,
    { type: "text", size: "small", style: o, onClick: n },
    a
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    a
  );
}
const vr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
  // 2026-11-15 新增：挂起问卷清理。背景是 manual 问卷本该 30 分钟自动释放，
  // 但 release_survey 的 _reason UnboundLocalError 让 watchdog 释放失败，
  // 问卷永远停在 pending、对应会话一直 409。bug 已修，但历史残骸不会自愈
  // （pending 记录可能已丢失、只剩 survey_state；会话文件也早已不存在），
  // 所以需要一个能「先看清、再手动处置」的页签。
  { key: "stale", label: "挂起清理", hint: "" }
], ha = (t) => t === "session";
function xl(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function kl(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function wl(t, e) {
  const n = l.notifyChannels || [], r = String(l.notifyCurrent || "off"), s = String(se("notify_channel", "off", "global") || r || "off"), o = ((S) => n.filter((q) => String(q.channel) === S)[0])(s), d = n.map((S) => {
    const q = String(S.channel || ""), _ = String(S.label || q), N = S.ready !== !1, C = S.verified === !0 || q === "off";
    let $ = "";
    return N ? C || ($ = "（待测试）") : $ = "（不可用）", { value: q, label: _ + $, disabled: !N };
  });
  d.length || d.push({ value: "off", label: "关闭", disabled: !1 });
  const i = !o || o.ready !== !1, x = s !== "off" && s !== "browser", h = l.notifyTesting === s, k = o && o.last_test || null, f = l.notifyMsg[s] || "", w = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: s,
      "data-qm-notify-select": "1",
      style: { flex: "0 0 auto" },
      onChange: (S) => {
        const q = S && S.target ? String(S.target.value) : "off";
        ge("notify_channel", q), Lr(q);
      }
    }, d.map((S, q) => t.createElement("option", {
      key: "o" + q,
      value: S.value,
      disabled: !!S.disabled
    }, S.label)))
  ];
  if (x && i && w.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: h,
    "data-qm-notify-test": s,
    onClick: (S) => {
      S && S.stopPropagation && S.stopPropagation(), ll(s);
    },
    style: {
      marginLeft: 8,
      padding: "2px 10px",
      fontSize: 12,
      border: "1px solid #d9d9d9",
      borderRadius: 4,
      background: "#fff",
      cursor: h ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, h ? "发送中…" : "测试")), o && o.ready === !1 && o.reason) {
    const S = o.reason_code === "missing_agent_id" || o.reason_code === "agent_not_found";
    w.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": o.reason_code || "",
      style: S ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, o.reason));
  }
  const m = !!(o && o.verified === !0), y = k || f, b = !!f;
  if (y || x && i && !h) {
    const S = k ? k.delivered === !0 : b ? f.indexOf("✓") === 0 : !1;
    let q;
    b ? q = f : k ? q = S ? "✓ 上次测试成功" + (k.note ? "（" + k.note + "）" : "") : "✗ " + (k.error || k.note || "上次测试失败") : q = "未测试";
    const _ = k && k.at_text ? "  ·  " + k.at_text : "", N = y ? S ? "#52c41a" : "#ff4d4f" : "#faad14";
    w.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": y ? S ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": y && (S || m) ? "1" : "0",
      style: {
        flex: "1 1 240px",
        minWidth: 0,
        fontSize: 11,
        lineHeight: "16px",
        color: N,
        // 允许在任意位置断行：失败原因里有很长的中文句子与 URL 形态内容，
        // 不让它撑破容器（也不要 pre-wrap，那会拒绝折行）。
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }
    }, q + _));
  }
  return de(
    t,
    "e5",
    "人工模式提醒频道",
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
    }, w),
    "弹问卷时提醒一次（仅人工模式）。频道须先「测试」通过才会真正发送；测试结果会保留，可随时重测。",
    "global",
    e,
    !1,
    !0
  );
}
function de(t, e, n, r, s, a, o, d, i) {
  const x = a || "global", h = kl(o || "global", x), k = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      xl(t, "sc", x),
      h && x === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], f = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, k),
    t.createElement("div", {
      className: "qm-set-rowctl" + (d ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, r)
  ];
  return t.createElement("div", {
    className: "qm-set-row" + (h ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": h ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, f);
}
function Ms(t, e, n, r, s) {
  return t.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    n.map((a, o) => t.createElement("button", {
      key: "s" + o,
      type: "button",
      "data-qm-val": a,
      disabled: !s,
      className: "qm-set-segbtn" + (a === r ? " qm-set-segon" : "") + (s ? "" : " qm-set-ctrldis"),
      onClick: () => {
        s && s(a);
      }
    }, [
      t.createElement("span", { key: "t" }, a)
    ]))
  );
}
function hn(t, e, n, r) {
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
    onKeyDown: (s) => {
      if (!r) return;
      const a = s && s.key;
      (a === " " || a === "Enter") && (s.preventDefault(), r(!n));
    }
  }, [
    t.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function et(t, e, n, r, s) {
  if (r && r.length && s) {
    const a = r.map((o, d) => o && typeof o == "object" ? { value: String(o.value), label: String(o.label || o.value) } : { value: String(o), label: String(o) });
    return t.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      t.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: n,
        onChange: (o) => s(o && o.target ? o.target.value : "")
      }, a.map((o, d) => t.createElement("option", { key: "o" + d, value: o.value }, o.label)))
    ]);
  }
  return t.createElement("div", { className: "qm-set-select", key: e }, [
    t.createElement("span", { key: "t", className: "qm-set-selecttext" }, n),
    t.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function Bs(t, e, n, r, s) {
  const a = bl(n), d = r.map((w) => w.id).indexOf(a.provider) >= 0 ? a.provider : "", i = d ? (r.filter((w) => w.id === d)[0] || { models: [] }).models : [], x = i.indexOf(a.model) >= 0 ? a.model : "", h = (w, m) => {
    s && s(w ? w + ":" + m : "");
  }, k = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: d,
    disabled: !s,
    title: "厂商",
    onChange: (w) => {
      const m = w && w.target ? w.target.value : "", y = m ? (r.filter((b) => b.id === m)[0] || { models: [] }).models : [];
      h(m, m && y[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((w, m) => t.createElement(
    "option",
    { key: "g" + m, value: w.id },
    w.name === w.id ? w.id : w.name + "（" + w.models.length + "）"
  )))), f = t.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: x,
    disabled: !s || !d,
    title: d ? "选择模型" : "先选厂商",
    onChange: (w) => {
      const m = w && w.target ? w.target.value : "";
      h(d, m);
    }
  }, d ? i.map((w, m) => t.createElement("option", { key: "m" + m, value: w }, w)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    k,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    f
  ]);
}
function vl(t, e, n, r, s) {
  const a = [], o = n === "session" ? "session" : "global", d = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, x = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒（默认）": 120,
    "300 秒": 300,
    "600 秒": 600
  }, h = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, k = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒": 120,
    "180 秒（默认）": 180,
    "300 秒": 300,
    "600 秒": 600
  }, f = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, w = s && s.templateOptions || [];
  s && s.modelOptions;
  const m = s && s.providerGroups || [], y = w.map((b) => {
    const S = l.templates.filter((q) => String(q.id) === String(b))[0];
    return { value: b, label: S && (S.name || S.id) || b };
  });
  if (e === "session") {
    const S = String(se("mode", "manual")) !== "recommend";
    if (a.push(de(
      t,
      "s1",
      "答题模式",
      Ms(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(se("mode", "manual"))] || "人工",
        (q) => ge("mode", d[q] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), S) {
      a.push(de(
        t,
        "s2",
        "默认模型",
        Bs(
          t,
          "sel2",
          String(se("model_id", "")),
          m,
          (_) => ge("model_id", _)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        il("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const q = String(se("template_id", "")) || y[0] && y[0].value || "";
      a.push(de(
        t,
        "s3",
        "提示词模板",
        y.length ? et(
          t,
          "sel3",
          q,
          y,
          (_) => ge("template_id", _)
        ) : et(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), a.push(de(
        t,
        "s4",
        "携带上下文",
        hn(
          t,
          "s4sw",
          !!se("with_context", !1),
          (_) => ge("with_context", _)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), a.push(de(
        t,
        "s5",
        "并行分析各题",
        hn(
          t,
          "s5sw",
          !!se("parallel", !1),
          (_) => ge("parallel", _)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const q = String(se("mode", "manual", "global")) !== "recommend";
      a.push(de(
        t,
        "a1",
        "默认答题模式",
        Ms(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(se("mode", "manual", "global"))] || "人工",
          (_) => ge("mode", d[_] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), q && (a.push(de(
        t,
        "b1",
        "默认模型",
        Bs(
          t,
          "sel2",
          String(se("model_id", "", "global")),
          m,
          (_) => ge("model_id", _)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), a.push(de(
        t,
        "b2",
        "提示词模板",
        y.length ? et(
          t,
          "sel3",
          String(se("template_id", "", "global")) || y[0].value,
          y,
          (_) => ge("template_id", _)
        ) : et(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), a.push(de(
        t,
        "b3",
        "携带上下文",
        hn(
          t,
          "s3",
          !!se("with_context", !1, "global"),
          (_) => ge("with_context", _)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), a.push(de(
        t,
        "b4",
        "并行分析各题",
        hn(
          t,
          "s4",
          !!se("parallel", !1, "global"),
          (_) => ge("parallel", _)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      a.push(wl(t, o)), a.push(de(
        t,
        "e6",
        "单题分析超时",
        et(
          t,
          "sel4",
          h[Number(se("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (C) => ge("model_timeout_sec", x[C] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), a.push(de(
        t,
        "d4",
        "等待提示阈值",
        et(
          t,
          "sel5",
          f[Number(se("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (C) => ge("wait_hint_sec", k[C] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const S = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], q = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, _ = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, N = Number(se("gate_log_limit", 200, "global"));
      a.push(de(
        t,
        "d5",
        "拦截记录",
        et(
          t,
          "sel6",
          _[N] || "最近 200 条（默认）",
          S,
          (C) => ge("gate_log_limit", q[C] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const b = l.templates, S = l.tplEdit;
    if (a.push(de(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), b.length ? a.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      b.map((q, _) => {
        const N = !!q.builtin, $ = (String(q.note || q.desc || "").trim() || String(q.system || q.system_prompt || q.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), E = $.length > 90 ? $.slice(0, 90) + "…" : $;
        return t.createElement("div", { className: "qm-set-item", key: "i" + _ }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(q.name || q.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (N ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, N ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(q.id),
              onClick: () => {
                pl(String(q.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (N ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(q.id),
              disabled: N,
              title: N ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                N || ml(String(q.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, E)
        ]);
      })
    )) : a.push(t.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), a.push(t.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      t.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          dl();
        }
      }, "＋ 新建模板")
    ])), S) {
      const q = (_, N, C, $, E) => {
        var j, M;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + N }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, _),
          C ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: $,
            "data-qm-tpl-field": N,
            placeholder: E,
            value: String(((j = l.tplEdit) == null ? void 0 : j[N]) || ""),
            onChange: (Z) => Rs(N, Z && Z.target ? Z.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": N,
            placeholder: E,
            value: String(((M = l.tplEdit) == null ? void 0 : M[N]) || ""),
            onChange: (Z) => Rs(N, Z && Z.target ? Z.target.value : "")
          })
        ]);
      };
      a.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (S.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          S.id ? "编辑模板：" + (S.name || S.id) : "新建模板"
        ),
        q("模板名称", "name", !1, 0, "如：简短结论版"),
        q(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        q(
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
            disabled: !!l.tplBusy,
            onClick: () => {
              fl();
            }
          }, l.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              ul();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "stale") {
    const b = l.stale, S = b && b.rows || [], q = b && b.exceeded || [], _ = b && b.within || [], N = (b && b.blocking || []).length ? b.blocking : S.filter((K) => K && K.nature === "blocking"), C = (b && b.residual || []).length ? b.residual : S.filter((K) => K && K.nature !== "blocking"), $ = N.filter(
      (K) => K && q.some(
        (R) => R.tool_call_id === K.tool_call_id
      )
    ), E = b ? b.threshold : null, j = Sr(E), M = E !== null && E <= 0, Z = !!(b && (b.busy || b.thrBusy)) || $.length === 0 || M, ke = !!(b && (b.busy || b.thrBusy)) || C.length === 0;
    if (a.push(t.createElement("div", {
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
          t.createElement("span", { key: "t" }, "挂起超时自动释放"),
          t.createElement(
            "span",
            { className: "qm-set-rownote", key: "n" },
            M ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${j} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(b && b.thrBusy),
            value: E === null ? "" : String(E),
            onChange: (K) => {
              const R = Number(K.target.value);
              l.draft.release_after_sec = R, l.stale.threshold = R, l.stale.msgKind = "", l.stale.msg = "已选择「" + Sr(R) + "」，点下方「保存」后生效", z();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            E === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
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
      M ? t.createElement("div", {
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
          disabled: !!(b && b.busy),
          onClick: () => {
            xi();
          }
        }, b && b.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: Z,
          title: M ? "自动释放已关闭，请逐条释放" : $.length ? `释放全部 ${$.length} 条已超阈值的阻塞问卷（观察期内 ${_.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            ki();
          }
        }, $.length ? `全部释放（阻塞·已超阈值 ${$.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: ke,
          title: C.length ? `清理全部 ${C.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            wi();
          }
        }, C.length ? `全部清理（残留 ${C.length} 条）` : "全部清理")
      ])
    ])), b && b.msg && a.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": b.msgKind || "info"
    }, b.msg)), b && b.scanned && S.length === 0 && a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!b || !b.scanned) && (b && b.msg || a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), S.length) {
      const R = {};
      q.forEach((I) => {
        R[I.tool_call_id] = !0;
      });
      const J = (I, pe) => {
        if (!I) return;
        const oe = () => {
          l.stale.copied = pe, z(), setTimeout(() => {
            l.stale.copied === pe && (l.stale.copied = "", z());
          }, 1600);
        };
        try {
          const P = typeof navigator < "u" ? navigator : null;
          if (P && P.clipboard && P.clipboard.writeText)
            P.clipboard.writeText(I).then(oe, oe);
          else {
            const Y = document.createElement("textarea");
            Y.value = I, document.body.appendChild(Y), Y.select(), document.execCommand("copy"), document.body.removeChild(Y), oe();
          }
        } catch {
          oe();
        }
      }, je = (I) => t.createElement("div", {
        className: "qm-set-stalerow qm-set-staleheader",
        key: I
      }, [
        t.createElement("span", { className: "qm-set-stalec1", key: "c1" }, "问卷"),
        t.createElement(
          "span",
          { className: "qm-set-stalec2", key: "c2" },
          "归属（点击复制会话ID）"
        ),
        t.createElement("span", { className: "qm-set-stalec3", key: "c3" }, "挂起"),
        t.createElement("span", { className: "qm-set-stalec4", key: "c4" }, "操作")
      ]), On = (I, pe) => {
        const oe = !!I.terminable, P = !!R[I.tool_call_id], Y = pe === "blocking", ie = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const Oe = I.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${I.idle_text}，阈值 ${j}）${Oe}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && mr([I.tool_call_id]);
        }, Q = !!(b && b.copied) && b.copied === I.tool_call_id;
        return t.createElement("div", {
          className: "qm-set-stalerow",
          key: I.tool_call_id + ":" + pe,
          "data-qm-stale-row": I.tool_call_id,
          "data-qm-stale-nature": pe,
          "data-qm-stale-group": P ? "exceeded" : "within"
        }, [
          t.createElement("span", { className: "qm-set-stalec1", key: "c1" }, [
            t.createElement(
              "span",
              { className: "qm-set-staletitle", key: "t" },
              I.title || "(无标题)"
            ),
            // 把「它是什么性质/为什么没被自动释放」直接写在行上，省得翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              I.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : I.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : I.reason_code === "no-future" ? "无唤醒句柄" : I.reason_code === "future-done" ? "已结束未收尾" : P ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            I.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { marginLeft: "6px", color: "#e67e22" }
            }, "正在作答") : null,
            I.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl",
              style: { marginLeft: "6px" }
            }, "模型分析中") : null
          ]),
          t.createElement("span", {
            className: "qm-set-stalec2",
            key: "c2",
            title: Q ? "已复制到剪贴板" : I.session_id ? "点击复制完整会话 ID：" + I.session_id : "",
            style: I.session_id ? {
              cursor: "pointer",
              textDecoration: "underline dotted",
              color: Q ? "#16a34a" : void 0
            } : void 0,
            "data-qm-stale-copy": I.tool_call_id,
            onClick: () => {
              J(String(I.session_id || ""), I.tool_call_id);
            }
          }, Q ? "✓ 会话 ID 已复制" : (I.agent_id || "-") + (I.session_id ? " · " + I.session_id : "")),
          t.createElement(
            "span",
            { className: "qm-set-stalec3", key: "c3" },
            I.idle_text
          ),
          t.createElement("span", { className: "qm-set-stalec4", key: "c4" }, [
            ...Y ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": I.tool_call_id,
                disabled: !!(b && b.busy),
                title: P ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  P ? mr([I.tool_call_id]) : ie();
                }
              }, P ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": I.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(b && b.busy) || !oe,
                title: oe ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  vi([I.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": I.tool_call_id,
                disabled: !!(b && b.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  mr([I.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, U = (I, pe, oe, P, Y) => {
        if (!P || !P.length) return null;
        const ie = Math.max(1, Math.ceil(P.length / 5)), Q = Math.min(
          Math.max(0, Number(b[Y]) || 0),
          ie - 1
        ), Oe = P.slice(
          Q * 5,
          Q * 5 + 5
        ), st = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": I
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": I
            }, pe),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, oe)
          ]),
          t.createElement("div", {
            className: "qm-set-staletable",
            key: "tbl",
            "data-qm-stale-table": I
          }, [je("rh-" + I)].concat(
            Oe.map((De) => On(De, I))
          ))
        ];
        if (ie > 1) {
          const De = (at) => {
            l.stale[Y] = at, z();
          }, ht = (at, We, bt, ue) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: ue,
            "data-qm-stale-page": String(We),
            disabled: bt,
            onClick: () => {
              De(We);
            }
          }, at);
          st.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": I
          }, [
            ht("上一页", Q - 1, Q <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(Q + 1)
            }, `第 ${Q + 1} / ${ie} 页（共 ${P.length} 条，每页 5 条）`),
            ht("下一页", Q + 1, Q >= ie - 1, "next")
          ]));
        }
        return st;
      }, Ee = U(
        "blocking",
        `🔴 正在阻塞会话（${N.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        N,
        "page"
      ), Te = U(
        "residual",
        `⚪ 异常残留（${C.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        C,
        "resPage"
      );
      Ee && a.push(...Ee), Te && a.push(...Te);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, a);
}
function _l(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const s = Pe(), a = s && s.Modal, o = !t.tab, d = t.tab || "", i = ha(d) ? "session" : "global", x = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    vr.map((J) => e.createElement("button", {
      key: J.key,
      type: "button",
      className: "qm-set-tab" + (!o && J.key === d ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(J.key);
        } catch {
        }
      }
    }, J.label))
  ), h = vr.filter((J) => J.key === d)[0] || vr[0], k = !!(t.cfg && t.cfg.has_session), f = k ? "session" : "default", w = k ? "会话模式" : "默认模式", m = e.createElement("div", {
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
      "data-qm-runtime": f,
      "data-qm-scope-badge": f
    }, w)
  ]), y = e.createElement("button", {
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
  }, "✕"), b = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      m,
      y
    ])
  ]), S = h.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, h.hint) : null, q = null, _ = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((J) => e.createElement("div", {
    key: "sk" + J,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: J * 0.15 + "s"
    }
  }))) : null, N = o ? _ : vl(e, d, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), C = t.dirtyCount || 0, $ = String(t.tab || ""), E = $ === "session" || $ === "default";
  let j;
  E ? j = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : j = $ === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const M = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      C ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + C + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, j)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      C > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          ua(), z();
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
          cl();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), Z = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, ke = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, K = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    q,
    S,
    N,
    Z,
    ke
  ]), R = e.createElement("div", { className: "qm-set-wrap" }, [
    b,
    x,
    K,
    M
  ]);
  return a ? e.createElement(a, {
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
  }, R) : e.createElement("div", {
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
    R
  ]);
}
function ql(t) {
  try {
    const e = t && t.sender, n = Se().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(yl, {
      R: n,
      onOpen: () => {
        gl();
      }
    });
    e.addPrefix(Ks, r, {
      id: "question-modal.settings-btn",
      order: zs
    }), console.log("[question-modal] settings entry registered (order " + zs + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function Sl() {
  const t = Xo();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return ei(), t.toolRender(Ks, ws, ol), console.log("[question-modal] registered via chat.toolRender for", ws), ql(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!Sl()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
