var fi = Object.defineProperty;
var ns = (t) => {
  throw TypeError(t);
};
var gi = (t, e, n) => e in t ? fi(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var U = (t, e, n) => gi(t, typeof e != "symbol" ? e + "" : e, n), hi = (t, e, n) => e.has(t) || ns("Cannot " + n);
var as = (t, e, n) => e.has(t) ? ns("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var zn = (t, e, n) => (hi(t, e, "access private method"), n);
function mr() {
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
let pt = mr();
function Is(t) {
  pt = t;
}
const As = /[&<>"']/, bi = new RegExp(As.source, "g"), Os = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, yi = new RegExp(Os.source, "g"), xi = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, rs = (t) => xi[t];
function we(t, e) {
  if (e) {
    if (As.test(t))
      return t.replace(bi, rs);
  } else if (Os.test(t))
    return t.replace(yi, rs);
  return t;
}
const ki = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function vi(t) {
  return t.replace(ki, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const wi = /(^|[^\[])\^/g;
function K(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const a = {
    replace: (r, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(wi, "$1"), n = n.replace(r, o), a;
    },
    getRegex: () => new RegExp(n, e)
  };
  return a;
}
function ss(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Xt = { exec: () => null };
function os(t, e) {
  const n = t.replace(/\|/g, (s, o, d) => {
    let i = !1, f = o;
    for (; --f >= 0 && d[f] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), a = n.split(/ \|/);
  let r = 0;
  if (a[0].trim() || a.shift(), a.length > 0 && !a[a.length - 1].trim() && a.pop(), e)
    if (a.length > e)
      a.splice(e);
    else
      for (; a.length < e; )
        a.push("");
  for (; r < a.length; r++)
    a[r] = a[r].trim().replace(/\\\|/g, "|");
  return a;
}
function In(t, e, n) {
  const a = t.length;
  if (a === 0)
    return "";
  let r = 0;
  for (; r < a && t.charAt(a - r - 1) === e; )
    r++;
  return t.slice(0, a - r);
}
function qi(t, e) {
  if (t.indexOf(e[1]) === -1)
    return -1;
  let n = 0;
  for (let a = 0; a < t.length; a++)
    if (t[a] === "\\")
      a++;
    else if (t[a] === e[0])
      n++;
    else if (t[a] === e[1] && (n--, n < 0))
      return a;
  return -1;
}
function is(t, e, n, a) {
  const r = e.href, s = e.title ? we(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
  if (t[0].charAt(0) !== "!") {
    a.state.inLink = !0;
    const d = {
      type: "link",
      raw: n,
      href: r,
      title: s,
      text: o,
      tokens: a.inlineTokens(o)
    };
    return a.state.inLink = !1, d;
  }
  return {
    type: "image",
    raw: n,
    href: r,
    title: s,
    text: we(o)
  };
}
function Ei(t, e) {
  const n = t.match(/^(\s+)(?:```)/);
  if (n === null)
    return e;
  const a = n[1];
  return e.split(`
`).map((r) => {
    const s = r.match(/^\s+/);
    if (s === null)
      return r;
    const [o] = s;
    return o.length >= a.length ? r.slice(a.length) : r;
  }).join(`
`);
}
class Fn {
  // set by the lexer
  constructor(e) {
    U(this, "options");
    U(this, "rules");
    // set by the lexer
    U(this, "lexer");
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
      const a = n[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: n[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? a : In(a, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const a = n[0], r = Ei(a, n[3] || "");
      return {
        type: "code",
        raw: a,
        lang: n[2] ? n[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : n[2],
        text: r
      };
    }
  }
  heading(e) {
    const n = this.rules.block.heading.exec(e);
    if (n) {
      let a = n[2].trim();
      if (/#$/.test(a)) {
        const r = In(a, "#");
        (this.options.pedantic || !r || / $/.test(r)) && (a = r.trim());
      }
      return {
        type: "heading",
        raw: n[0],
        depth: n[1].length,
        text: a,
        tokens: this.lexer.inline(a)
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
      let a = n[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`);
      a = In(a.replace(/^ *>[ \t]?/gm, ""), `
`);
      const r = this.lexer.state.top;
      this.lexer.state.top = !0;
      const s = this.lexer.blockTokens(a);
      return this.lexer.state.top = r, {
        type: "blockquote",
        raw: n[0],
        tokens: s,
        text: a
      };
    }
  }
  list(e) {
    let n = this.rules.block.list.exec(e);
    if (n) {
      let a = n[1].trim();
      const r = a.length > 1, s = {
        type: "list",
        raw: "",
        ordered: r,
        start: r ? +a.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      a = r ? `\\d{1,9}\\${a.slice(-1)}` : `\\${a}`, this.options.pedantic && (a = r ? a : "[*+-]");
      const o = new RegExp(`^( {0,3}${a})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let d = "", i = "", f = !1;
      for (; e; ) {
        let g = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = n[0], e = e.substring(d.length);
        let k = n[2].split(`
`, 1)[0].replace(/^\t+/, (N) => " ".repeat(3 * N.length)), b = e.split(`
`, 1)[0], v = 0;
        this.options.pedantic ? (v = 2, i = k.trimStart()) : (v = n[2].search(/[^ ]/), v = v > 4 ? 1 : v, i = k.slice(v), v += n[1].length);
        let y = !1;
        if (!k && /^ *$/.test(b) && (d += b + `
`, e = e.substring(b.length + 1), g = !0), !g) {
          const N = new RegExp(`^ {0,${Math.min(3, v - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), P = new RegExp(`^ {0,${Math.min(3, v - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), x = new RegExp(`^ {0,${Math.min(3, v - 1)}}(?:\`\`\`|~~~)`), T = new RegExp(`^ {0,${Math.min(3, v - 1)}}#`);
          for (; e; ) {
            const E = e.split(`
`, 1)[0];
            if (b = E, this.options.pedantic && (b = b.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), x.test(b) || T.test(b) || N.test(b) || P.test(e))
              break;
            if (b.search(/[^ ]/) >= v || !b.trim())
              i += `
` + b.slice(v);
            else {
              if (y || k.search(/[^ ]/) >= 4 || x.test(k) || T.test(k) || P.test(k))
                break;
              i += `
` + b;
            }
            !y && !b.trim() && (y = !0), d += E + `
`, e = e.substring(E.length + 1), k = b.slice(v);
          }
        }
        s.loose || (f ? s.loose = !0 : /\n *\n *$/.test(d) && (f = !0));
        let u = null, _;
        this.options.gfm && (u = /^\[[ xX]\] /.exec(i), u && (_ = u[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: d,
          task: !!u,
          checked: _,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += d;
      }
      s.items[s.items.length - 1].raw = d.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let g = 0; g < s.items.length; g++)
        if (this.lexer.state.top = !1, s.items[g].tokens = this.lexer.blockTokens(s.items[g].text, []), !s.loose) {
          const k = s.items[g].tokens.filter((v) => v.type === "space"), b = k.length > 0 && k.some((v) => /\n.*\n/.test(v.raw));
          s.loose = b;
        }
      if (s.loose)
        for (let g = 0; g < s.items.length; g++)
          s.items[g].loose = !0;
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
      const a = n[1].toLowerCase().replace(/\s+/g, " "), r = n[2] ? n[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = n[3] ? n[3].substring(1, n[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : n[3];
      return {
        type: "def",
        tag: a,
        raw: n[0],
        href: r,
        title: s
      };
    }
  }
  table(e) {
    const n = this.rules.block.table.exec(e);
    if (!n || !/[:|]/.test(n[2]))
      return;
    const a = os(n[1]), r = n[2].replace(/^\||\| *$/g, "").split("|"), s = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: n[0],
      header: [],
      align: [],
      rows: []
    };
    if (a.length === r.length) {
      for (const d of r)
        /^ *-+: *$/.test(d) ? o.align.push("right") : /^ *:-+: *$/.test(d) ? o.align.push("center") : /^ *:-+ *$/.test(d) ? o.align.push("left") : o.align.push(null);
      for (const d of a)
        o.header.push({
          text: d,
          tokens: this.lexer.inline(d)
        });
      for (const d of s)
        o.rows.push(os(d, o.header.length).map((i) => ({
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
      const a = n[1].charAt(n[1].length - 1) === `
` ? n[1].slice(0, -1) : n[1];
      return {
        type: "paragraph",
        raw: n[0],
        text: a,
        tokens: this.lexer.inline(a)
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
        text: we(n[1])
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
      const a = n[2].trim();
      if (!this.options.pedantic && /^</.test(a)) {
        if (!/>$/.test(a))
          return;
        const o = In(a.slice(0, -1), "\\");
        if ((a.length - o.length) % 2 === 0)
          return;
      } else {
        const o = qi(n[2], "()");
        if (o > -1) {
          const i = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + o;
          n[2] = n[2].substring(0, o), n[0] = n[0].substring(0, i).trim(), n[3] = "";
        }
      }
      let r = n[2], s = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(r);
        o && (r = o[1], s = o[3]);
      } else
        s = n[3] ? n[3].slice(1, -1) : "";
      return r = r.trim(), /^</.test(r) && (this.options.pedantic && !/>$/.test(a) ? r = r.slice(1) : r = r.slice(1, -1)), is(n, {
        href: r && r.replace(this.rules.inline.anyPunctuation, "$1"),
        title: s && s.replace(this.rules.inline.anyPunctuation, "$1")
      }, n[0], this.lexer);
    }
  }
  reflink(e, n) {
    let a;
    if ((a = this.rules.inline.reflink.exec(e)) || (a = this.rules.inline.nolink.exec(e))) {
      const r = (a[2] || a[1]).replace(/\s+/g, " "), s = n[r.toLowerCase()];
      if (!s) {
        const o = a[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return is(a, s, a[0], this.lexer);
    }
  }
  emStrong(e, n, a = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && a.match(/[\p{L}\p{N}]/u))
      return;
    if (!(r[1] || r[2] || "") || !a || this.rules.inline.punctuation.exec(a)) {
      const o = [...r[0]].length - 1;
      let d, i, f = o, g = 0;
      const k = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (k.lastIndex = 0, n = n.slice(-1 * e.length + o); (r = k.exec(n)) != null; ) {
        if (d = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !d)
          continue;
        if (i = [...d].length, r[3] || r[4]) {
          f += i;
          continue;
        } else if ((r[5] || r[6]) && o % 3 && !((o + i) % 3)) {
          g += i;
          continue;
        }
        if (f -= i, f > 0)
          continue;
        i = Math.min(i, i + f + g);
        const b = [...r[0]][0].length, v = e.slice(0, o + r.index + b + i);
        if (Math.min(o, i) % 2) {
          const u = v.slice(1, -1);
          return {
            type: "em",
            raw: v,
            text: u,
            tokens: this.lexer.inlineTokens(u)
          };
        }
        const y = v.slice(2, -2);
        return {
          type: "strong",
          raw: v,
          text: y,
          tokens: this.lexer.inlineTokens(y)
        };
      }
    }
  }
  codespan(e) {
    const n = this.rules.inline.code.exec(e);
    if (n) {
      let a = n[2].replace(/\n/g, " ");
      const r = /[^ ]/.test(a), s = /^ /.test(a) && / $/.test(a);
      return r && s && (a = a.substring(1, a.length - 1)), a = we(a, !0), {
        type: "codespan",
        raw: n[0],
        text: a
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
      let a, r;
      return n[2] === "@" ? (a = we(n[1]), r = "mailto:" + a) : (a = we(n[1]), r = a), {
        type: "link",
        raw: n[0],
        text: a,
        href: r,
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
  url(e) {
    var a;
    let n;
    if (n = this.rules.inline.url.exec(e)) {
      let r, s;
      if (n[2] === "@")
        r = we(n[0]), s = "mailto:" + r;
      else {
        let o;
        do
          o = n[0], n[0] = ((a = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : a[0]) ?? "";
        while (o !== n[0]);
        r = we(n[0]), n[1] === "www." ? s = "http://" + n[0] : s = n[0];
      }
      return {
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
  inlineText(e) {
    const n = this.rules.inline.text.exec(e);
    if (n) {
      let a;
      return this.lexer.state.inRawBlock ? a = n[0] : a = we(n[0]), {
        type: "text",
        raw: n[0],
        text: a
      };
    }
  }
}
const Si = /^(?: *(?:\n|$))+/, _i = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Ni = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, an = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Ci = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, $s = /(?:[*+-]|\d{1,9}[.)])/, Ps = K(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, $s).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), ur = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ti = /^[^\n]+/, fr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, zi = K(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", fr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Ii = K(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, $s).getRegex(), Qn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", gr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Ai = K("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", gr).replace("tag", Qn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Ms = K(ur).replace("hr", an).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qn).getRegex(), Oi = K(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ms).getRegex(), hr = {
  blockquote: Oi,
  code: _i,
  def: zi,
  fences: Ni,
  heading: Ci,
  hr: an,
  html: Ai,
  lheading: Ps,
  list: Ii,
  newline: Si,
  paragraph: Ms,
  table: Xt,
  text: Ti
}, ls = K("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", an).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qn).getRegex(), $i = {
  ...hr,
  table: ls,
  paragraph: K(ur).replace("hr", an).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ls).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Qn).getRegex()
}, Pi = {
  ...hr,
  html: K(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", gr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Xt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: K(ur).replace("hr", an).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Ps).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Bs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Mi = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ls = /^( {2,}|\\)\n(?!\s*$)/, Bi = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, rn = "\\p{P}\\p{S}", Li = K(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, rn).getRegex(), ji = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Di = K(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, rn).getRegex(), Fi = K("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, rn).getRegex(), Wi = K("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, rn).getRegex(), Ki = K(/\\([punct])/, "gu").replace(/punct/g, rn).getRegex(), Hi = K(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ui = K(gr).replace("(?:-->|$)", "-->").getRegex(), Gi = K("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ui).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Wn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ji = K(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Wn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), js = K(/^!?\[(label)\]\[(ref)\]/).replace("label", Wn).replace("ref", fr).getRegex(), Ds = K(/^!?\[(ref)\](?:\[\])?/).replace("ref", fr).getRegex(), Zi = K("reflink|nolink(?!\\()", "g").replace("reflink", js).replace("nolink", Ds).getRegex(), br = {
  _backpedal: Xt,
  // only used for GFM url
  anyPunctuation: Ki,
  autolink: Hi,
  blockSkip: ji,
  br: Ls,
  code: Mi,
  del: Xt,
  emStrongLDelim: Di,
  emStrongRDelimAst: Fi,
  emStrongRDelimUnd: Wi,
  escape: Bs,
  link: Ji,
  nolink: Ds,
  punctuation: Li,
  reflink: js,
  reflinkSearch: Zi,
  tag: Gi,
  text: Bi,
  url: Xt
}, Qi = {
  ...br,
  link: K(/^!?\[(label)\]\((.*?)\)/).replace("label", Wn).getRegex(),
  reflink: K(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Wn).getRegex()
}, cr = {
  ...br,
  escape: K(Bs).replace("])", "~|])").getRegex(),
  url: K(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Vi = {
  ...cr,
  br: K(Ls).replace("{2,}", "*").getRegex(),
  text: K(cr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, An = {
  normal: hr,
  gfm: $i,
  pedantic: Pi
}, Ft = {
  normal: br,
  gfm: cr,
  breaks: Vi,
  pedantic: Qi
};
class Le {
  constructor(e) {
    U(this, "tokens");
    U(this, "options");
    U(this, "state");
    U(this, "tokenizer");
    U(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || pt, this.options.tokenizer = this.options.tokenizer || new Fn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: An.normal,
      inline: Ft.normal
    };
    this.options.pedantic ? (n.block = An.pedantic, n.inline = Ft.pedantic) : this.options.gfm && (n.block = An.gfm, this.options.breaks ? n.inline = Ft.breaks : n.inline = Ft.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: An,
      inline: Ft
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
      const a = this.inlineQueue[n];
      this.inlineTokens(a.src, a.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, n = []) {
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (d, i, f) => i + "    ".repeat(f.length));
    let a, r, s, o;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((d) => (a = d.call({ lexer: this }, e, n)) ? (e = e.substring(a.raw.length), n.push(a), !0) : !1))) {
        if (a = this.tokenizer.space(e)) {
          e = e.substring(a.raw.length), a.raw.length === 1 && n.length > 0 ? n[n.length - 1].raw += `
` : n.push(a);
          continue;
        }
        if (a = this.tokenizer.code(e)) {
          e = e.substring(a.raw.length), r = n[n.length - 1], r && (r.type === "paragraph" || r.type === "text") ? (r.raw += `
` + a.raw, r.text += `
` + a.text, this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : n.push(a);
          continue;
        }
        if (a = this.tokenizer.fences(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.heading(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.hr(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.blockquote(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.list(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.html(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.def(e)) {
          e = e.substring(a.raw.length), r = n[n.length - 1], r && (r.type === "paragraph" || r.type === "text") ? (r.raw += `
` + a.raw, r.text += `
` + a.raw, this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : this.tokens.links[a.tag] || (this.tokens.links[a.tag] = {
            href: a.href,
            title: a.title
          });
          continue;
        }
        if (a = this.tokenizer.table(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.lheading(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (s = e, this.options.extensions && this.options.extensions.startBlock) {
          let d = 1 / 0;
          const i = e.slice(1);
          let f;
          this.options.extensions.startBlock.forEach((g) => {
            f = g.call({ lexer: this }, i), typeof f == "number" && f >= 0 && (d = Math.min(d, f));
          }), d < 1 / 0 && d >= 0 && (s = e.substring(0, d + 1));
        }
        if (this.state.top && (a = this.tokenizer.paragraph(s))) {
          r = n[n.length - 1], o && r.type === "paragraph" ? (r.raw += `
` + a.raw, r.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : n.push(a), o = s.length !== e.length, e = e.substring(a.raw.length);
          continue;
        }
        if (a = this.tokenizer.text(e)) {
          e = e.substring(a.raw.length), r = n[n.length - 1], r && r.type === "text" ? (r.raw += `
` + a.raw, r.text += `
` + a.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : n.push(a);
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
    let a, r, s, o = e, d, i, f;
    if (this.tokens.links) {
      const g = Object.keys(this.tokens.links);
      if (g.length > 0)
        for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          g.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (d = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, d.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (f = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((g) => (a = g.call({ lexer: this }, e, n)) ? (e = e.substring(a.raw.length), n.push(a), !0) : !1))) {
        if (a = this.tokenizer.escape(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.tag(e)) {
          e = e.substring(a.raw.length), r = n[n.length - 1], r && a.type === "text" && r.type === "text" ? (r.raw += a.raw, r.text += a.text) : n.push(a);
          continue;
        }
        if (a = this.tokenizer.link(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(a.raw.length), r = n[n.length - 1], r && a.type === "text" && r.type === "text" ? (r.raw += a.raw, r.text += a.text) : n.push(a);
          continue;
        }
        if (a = this.tokenizer.emStrong(e, o, f)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.codespan(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.br(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.del(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (a = this.tokenizer.autolink(e)) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (!this.state.inLink && (a = this.tokenizer.url(e))) {
          e = e.substring(a.raw.length), n.push(a);
          continue;
        }
        if (s = e, this.options.extensions && this.options.extensions.startInline) {
          let g = 1 / 0;
          const k = e.slice(1);
          let b;
          this.options.extensions.startInline.forEach((v) => {
            b = v.call({ lexer: this }, k), typeof b == "number" && b >= 0 && (g = Math.min(g, b));
          }), g < 1 / 0 && g >= 0 && (s = e.substring(0, g + 1));
        }
        if (a = this.tokenizer.inlineText(s)) {
          e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (f = a.raw.slice(-1)), i = !0, r = n[n.length - 1], r && r.type === "text" ? (r.raw += a.raw, r.text += a.text) : n.push(a);
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
    return n;
  }
}
class Kn {
  constructor(e) {
    U(this, "options");
    this.options = e || pt;
  }
  code(e, n, a) {
    var s;
    const r = (s = (n || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, r ? '<pre><code class="language-' + we(r) + '">' + (a ? e : we(e, !0)) + `</code></pre>
` : "<pre><code>" + (a ? e : we(e, !0)) + `</code></pre>
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
  heading(e, n, a) {
    return `<h${n}>${e}</h${n}>
`;
  }
  hr() {
    return `<hr>
`;
  }
  list(e, n, a) {
    const r = n ? "ol" : "ul", s = n && a !== 1 ? ' start="' + a + '"' : "";
    return "<" + r + s + `>
` + e + "</" + r + `>
`;
  }
  listitem(e, n, a) {
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
    const a = n.header ? "th" : "td";
    return (n.align ? `<${a} align="${n.align}">` : `<${a}>`) + e + `</${a}>
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
  link(e, n, a) {
    const r = ss(e);
    if (r === null)
      return a;
    e = r;
    let s = '<a href="' + e + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + a + "</a>", s;
  }
  image(e, n, a) {
    const r = ss(e);
    if (r === null)
      return a;
    e = r;
    let s = `<img src="${e}" alt="${a}"`;
    return n && (s += ` title="${n}"`), s += ">", s;
  }
  text(e) {
    return e;
  }
}
class yr {
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
  link(e, n, a) {
    return "" + a;
  }
  image(e, n, a) {
    return "" + a;
  }
  br() {
    return "";
  }
}
class je {
  constructor(e) {
    U(this, "options");
    U(this, "renderer");
    U(this, "textRenderer");
    this.options = e || pt, this.options.renderer = this.options.renderer || new Kn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new yr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new je(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new je(n).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, n = !0) {
    let a = "";
    for (let r = 0; r < e.length; r++) {
      const s = e[r];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = s, d = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (d !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(o.type)) {
          a += d || "";
          continue;
        }
      }
      switch (s.type) {
        case "space":
          continue;
        case "hr": {
          a += this.renderer.hr();
          continue;
        }
        case "heading": {
          const o = s;
          a += this.renderer.heading(this.parseInline(o.tokens), o.depth, vi(this.parseInline(o.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const o = s;
          a += this.renderer.code(o.text, o.lang, !!o.escaped);
          continue;
        }
        case "table": {
          const o = s;
          let d = "", i = "";
          for (let g = 0; g < o.header.length; g++)
            i += this.renderer.tablecell(this.parseInline(o.header[g].tokens), { header: !0, align: o.align[g] });
          d += this.renderer.tablerow(i);
          let f = "";
          for (let g = 0; g < o.rows.length; g++) {
            const k = o.rows[g];
            i = "";
            for (let b = 0; b < k.length; b++)
              i += this.renderer.tablecell(this.parseInline(k[b].tokens), { header: !1, align: o.align[b] });
            f += this.renderer.tablerow(i);
          }
          a += this.renderer.table(d, f);
          continue;
        }
        case "blockquote": {
          const o = s, d = this.parse(o.tokens);
          a += this.renderer.blockquote(d);
          continue;
        }
        case "list": {
          const o = s, d = o.ordered, i = o.start, f = o.loose;
          let g = "";
          for (let k = 0; k < o.items.length; k++) {
            const b = o.items[k], v = b.checked, y = b.task;
            let u = "";
            if (b.task) {
              const _ = this.renderer.checkbox(!!v);
              f ? b.tokens.length > 0 && b.tokens[0].type === "paragraph" ? (b.tokens[0].text = _ + " " + b.tokens[0].text, b.tokens[0].tokens && b.tokens[0].tokens.length > 0 && b.tokens[0].tokens[0].type === "text" && (b.tokens[0].tokens[0].text = _ + " " + b.tokens[0].tokens[0].text)) : b.tokens.unshift({
                type: "text",
                text: _ + " "
              }) : u += _ + " ";
            }
            u += this.parse(b.tokens, f), g += this.renderer.listitem(u, y, !!v);
          }
          a += this.renderer.list(g, d, i);
          continue;
        }
        case "html": {
          const o = s;
          a += this.renderer.html(o.text, o.block);
          continue;
        }
        case "paragraph": {
          const o = s;
          a += this.renderer.paragraph(this.parseInline(o.tokens));
          continue;
        }
        case "text": {
          let o = s, d = o.tokens ? this.parseInline(o.tokens) : o.text;
          for (; r + 1 < e.length && e[r + 1].type === "text"; )
            o = e[++r], d += `
` + (o.tokens ? this.parseInline(o.tokens) : o.text);
          a += n ? this.renderer.paragraph(d) : d;
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
    return a;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, n) {
    n = n || this.renderer;
    let a = "";
    for (let r = 0; r < e.length; r++) {
      const s = e[r];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          a += o || "";
          continue;
        }
      }
      switch (s.type) {
        case "escape": {
          const o = s;
          a += n.text(o.text);
          break;
        }
        case "html": {
          const o = s;
          a += n.html(o.text);
          break;
        }
        case "link": {
          const o = s;
          a += n.link(o.href, o.title, this.parseInline(o.tokens, n));
          break;
        }
        case "image": {
          const o = s;
          a += n.image(o.href, o.title, o.text);
          break;
        }
        case "strong": {
          const o = s;
          a += n.strong(this.parseInline(o.tokens, n));
          break;
        }
        case "em": {
          const o = s;
          a += n.em(this.parseInline(o.tokens, n));
          break;
        }
        case "codespan": {
          const o = s;
          a += n.codespan(o.text);
          break;
        }
        case "br": {
          a += n.br();
          break;
        }
        case "del": {
          const o = s;
          a += n.del(this.parseInline(o.tokens, n));
          break;
        }
        case "text": {
          const o = s;
          a += n.text(o.text);
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
    return a;
  }
}
class Yt {
  constructor(e) {
    U(this, "options");
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
U(Yt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var dt, dr, Fs;
class Xi {
  constructor(...e) {
    as(this, dt);
    U(this, "defaults", mr());
    U(this, "options", this.setOptions);
    U(this, "parse", zn(this, dt, dr).call(this, Le.lex, je.parse));
    U(this, "parseInline", zn(this, dt, dr).call(this, Le.lexInline, je.parseInline));
    U(this, "Parser", je);
    U(this, "Renderer", Kn);
    U(this, "TextRenderer", yr);
    U(this, "Lexer", Le);
    U(this, "Tokenizer", Fn);
    U(this, "Hooks", Yt);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, n) {
    var r, s;
    let a = [];
    for (const o of e)
      switch (a = a.concat(n.call(this, o)), o.type) {
        case "table": {
          const d = o;
          for (const i of d.header)
            a = a.concat(this.walkTokens(i.tokens, n));
          for (const i of d.rows)
            for (const f of i)
              a = a.concat(this.walkTokens(f.tokens, n));
          break;
        }
        case "list": {
          const d = o;
          a = a.concat(this.walkTokens(d.items, n));
          break;
        }
        default: {
          const d = o;
          (s = (r = this.defaults.extensions) == null ? void 0 : r.childTokens) != null && s[d.type] ? this.defaults.extensions.childTokens[d.type].forEach((i) => {
            const f = d[i].flat(1 / 0);
            a = a.concat(this.walkTokens(f, n));
          }) : d.tokens && (a = a.concat(this.walkTokens(d.tokens, n)));
        }
      }
    return a;
  }
  use(...e) {
    const n = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((a) => {
      const r = { ...a };
      if (r.async = this.defaults.async || r.async || !1, a.extensions && (a.extensions.forEach((s) => {
        if (!s.name)
          throw new Error("extension name required");
        if ("renderer" in s) {
          const o = n.renderers[s.name];
          o ? n.renderers[s.name] = function(...d) {
            let i = s.renderer.apply(this, d);
            return i === !1 && (i = o.apply(this, d)), i;
          } : n.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = n[s.level];
          o ? o.unshift(s.tokenizer) : n[s.level] = [s.tokenizer], s.start && (s.level === "block" ? n.startBlock ? n.startBlock.push(s.start) : n.startBlock = [s.start] : s.level === "inline" && (n.startInline ? n.startInline.push(s.start) : n.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (n.childTokens[s.name] = s.childTokens);
      }), r.extensions = n), a.renderer) {
        const s = this.defaults.renderer || new Kn(this.defaults);
        for (const o in a.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = a.renderer[d], f = s[d];
          s[d] = (...g) => {
            let k = i.apply(s, g);
            return k === !1 && (k = f.apply(s, g)), k || "";
          };
        }
        r.renderer = s;
      }
      if (a.tokenizer) {
        const s = this.defaults.tokenizer || new Fn(this.defaults);
        for (const o in a.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const d = o, i = a.tokenizer[d], f = s[d];
          s[d] = (...g) => {
            let k = i.apply(s, g);
            return k === !1 && (k = f.apply(s, g)), k;
          };
        }
        r.tokenizer = s;
      }
      if (a.hooks) {
        const s = this.defaults.hooks || new Yt();
        for (const o in a.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = a.hooks[d], f = s[d];
          Yt.passThroughHooks.has(o) ? s[d] = (g) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, g)).then((b) => f.call(s, b));
            const k = i.call(s, g);
            return f.call(s, k);
          } : s[d] = (...g) => {
            let k = i.apply(s, g);
            return k === !1 && (k = f.apply(s, g)), k;
          };
        }
        r.hooks = s;
      }
      if (a.walkTokens) {
        const s = this.defaults.walkTokens, o = a.walkTokens;
        r.walkTokens = function(d) {
          let i = [];
          return i.push(o.call(this, d)), s && (i = i.concat(s.call(this, d))), i;
        };
      }
      this.defaults = { ...this.defaults, ...r };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, n) {
    return Le.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return je.parse(e, n ?? this.defaults);
  }
}
dt = new WeakSet(), dr = function(e, n) {
  return (a, r) => {
    const s = { ...r }, o = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const d = zn(this, dt, Fs).call(this, !!o.silent, !!o.async);
    if (typeof a > "u" || a === null)
      return d(new Error("marked(): input parameter is undefined or null"));
    if (typeof a != "string")
      return d(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(a) + ", string expected"));
    if (o.hooks && (o.hooks.options = o), o.async)
      return Promise.resolve(o.hooks ? o.hooks.preprocess(a) : a).then((i) => e(i, o)).then((i) => o.hooks ? o.hooks.processAllTokens(i) : i).then((i) => o.walkTokens ? Promise.all(this.walkTokens(i, o.walkTokens)).then(() => i) : i).then((i) => n(i, o)).then((i) => o.hooks ? o.hooks.postprocess(i) : i).catch(d);
    try {
      o.hooks && (a = o.hooks.preprocess(a));
      let i = e(a, o);
      o.hooks && (i = o.hooks.processAllTokens(i)), o.walkTokens && this.walkTokens(i, o.walkTokens);
      let f = n(i, o);
      return o.hooks && (f = o.hooks.postprocess(f)), f;
    } catch (i) {
      return d(i);
    }
  };
}, Fs = function(e, n) {
  return (a) => {
    if (a.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const r = "<p>An error occurred:</p><pre>" + we(a.message + "", !0) + "</pre>";
      return n ? Promise.resolve(r) : r;
    }
    if (n)
      return Promise.reject(a);
    throw a;
  };
};
const ct = new Xi();
function W(t, e) {
  return ct.parse(t, e);
}
W.options = W.setOptions = function(t) {
  return ct.setOptions(t), W.defaults = ct.defaults, Is(W.defaults), W;
};
W.getDefaults = mr;
W.defaults = pt;
W.use = function(...t) {
  return ct.use(...t), W.defaults = ct.defaults, Is(W.defaults), W;
};
W.walkTokens = function(t, e) {
  return ct.walkTokens(t, e);
};
W.parseInline = ct.parseInline;
W.Parser = je;
W.parser = je.parse;
W.Renderer = Kn;
W.TextRenderer = yr;
W.Lexer = Le;
W.lexer = Le.lex;
W.Tokenizer = Fn;
W.Hooks = Yt;
W.parse = W;
W.options;
W.setOptions;
W.use;
W.walkTokens;
W.parseInline;
je.parse;
Le.lex;
const Ws = "question-modal", cs = "question_modal", Ua = 3, ds = "gate-v2@2026.10.21";
function ze() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Yi() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Ve() {
  return ze().antd || {};
}
function Ri() {
  return ze().antdIcons || {};
}
const el = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Ga(t) {
  const e = Ri();
  for (const n of el) {
    const a = e[n];
    if (a)
      return t.createElement(a, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function tl() {
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
      ".qm-md a{color:var(--app-accent, #ff7f16);text-decoration:none}",
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
      // 主色统一取 var(--app-accent)（回落 #ff7f16）、主文字 #1e293b、
      // 次要 #64748b、分隔线 #f1f5f9、输入底 #f8fafc。
      // 2026-11-23：本块所有颜色已全部改为 CSS 变量，不再硬编码蓝色 ——
      // 否则宿主切主题时面板不跟随（实测过：面板蓝、卡片橙两张皮）。
      ".qm-set-wrap{font-size:13px;color:var(--app-text-primary,#1e293b);",
      "max-height:90vh;display:flex;flex-direction:column;overflow:hidden;",
      // 需求 1（2026-11-24）：删除确认气泡的定位基准
      "position:relative}",
      // 删除二次确认气泡（形态对齐问卷卡「释放确认」气泡：白底、细边、红确定键）
      ".qm-set-delconfirm{position:absolute;left:50%;top:34%;",
      "transform:translate(-50%,-50%);z-index:1300;width:300px;max-width:86%;",
      "padding:14px 16px;border-radius:10px;",
      "background:var(--app-bg-elevated,#fff);",
      "border:1px solid var(--app-border-strong,rgba(127,127,127,0.45));",
      "box-shadow:0 8px 24px rgba(0,0,0,0.18)}",
      ".qm-set-dctitle{font-size:13px;font-weight:600;margin-bottom:6px;",
      "overflow-wrap:anywhere}",
      ".qm-set-dcdesc{font-size:12px;line-height:1.6;",
      "color:var(--app-text-secondary,inherit)}",
      ".qm-set-dcbtns{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}",
      ".qm-set-dcok{background:#d92d20;color:#fff;border:none;font-weight:500}",
      ".qm-set-dcok:hover{background:#b42318}",
      // 中间内容区滚动（参考稿 .tab-content：flex:1 + 自身滚动），footer 不随内容滚走
      ".qm-set-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;scrollbar-width:none}",
      ".qm-set-scroll::-webkit-scrollbar{width:0;height:0;display:none}",
      // Modal 内容层归零内边距，由头部/页签/内容/底部各自控制留白（对齐参考稿 28px 栅格）
      ".qm-set-modal .ant-modal-content{padding:0;border-radius:20px;",
      "box-shadow:0 20px 40px -10px rgba(0,0,0,0.08);overflow:hidden}",
      ".qm-set-head{display:flex;align-items:center;justify-content:space-between;",
      "gap:12px;padding:18px 24px 6px;margin:0}",
      // 「生效标签」前缀 + 胶囊 组成一个右对齐的横向组（2026-11-13）。
      ".qm-set-runtime-wrap{display:inline-flex;align-items:center;gap:6px;",
      "white-space:nowrap}",
      ".qm-set-runtime-label{font-size:12px;font-weight:400;",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-runtime{font-size:12px;font-weight:500;color:var(--app-accent, #ff7f16);",
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
      "border-radius:8px;background:transparent;cursor:pointer;font-size:13px;",
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
      ".qm-set-tabon{background:var(--app-accent, #ff7f16);color:#fff;border-bottom:0;border-radius:20px;",
      "font-weight:500;box-shadow:0 4px 12px var(--app-accent-soft, rgba(255,127,22,.25))}",
      ".qm-set-tabon:hover{background:var(--app-accent, #ff7f16);color:#fff}",
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
      // US-007：时段卡字段网格窄屏单列；名称不再限宽。
      // 需求 3（2026-11-24 真机截图）：必须带 .qm-set-wrap 前缀提高特异性——
      // 基础规则 .qm-set-schedgrid{...1fr 1fr} 声明在本 media 块**之后**，
      // 同特异性时后者胜出，导致手机上仍是两列、下拉文字被截断。
      ".qm-set-wrap .qm-set-schedgrid{grid-template-columns:1fr}",
      ".qm-set-wrap .qm-set-schedgrid .qm-set-native{width:100%;min-width:0}",
      // 需求 5：两列开关行窄屏回落单列（同样带前缀防被后声明的基础规则覆盖）
      ".qm-set-wrap .qm-set-rowpair{grid-template-columns:1fr;column-gap:0}",
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
      ".qm-set-scopetag{display:inline-block;font-size:11px;line-height:1;padding:2px 5px;border-radius:3px;letter-spacing:.02em;border:1px solid rgba(127,127,127,.36);background:transparent;color:var(--app-text-tertiary,#86909c);white-space:nowrap}",
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
      ".qm-set-fieldlabel{font-size:13px;color:var(--app-text-tertiary,#64748b);margin-bottom:3px}",
      ".qm-set-input,.qm-set-textarea{width:100%;box-sizing:border-box;font:inherit;font-size:12px;",
      "padding:7px 10px;border-radius:8px;border:1px solid transparent;",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1e293b);outline:none;resize:vertical}",
      ".qm-set-input:focus,.qm-set-textarea:focus{border-color:var(--app-accent, #ff7f16)}",
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
      ".qm-set-lockhint{font-size:11px;line-height:1;padding:2px 5px;border-radius:3px;color:#8a8a8a;border:1px dashed rgba(138,138,138,.45)}",
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
      "border-color:var(--app-accent, #ff7f16);box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.1))}",
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
      ".qm-set-badgeon{background:var(--app-accent-soft, rgba(255,127,22,.12));color:var(--app-accent, #ff7f16);font-weight:500}",
      ".qm-set-badgeglobal{background:rgba(127,127,127,.12);color:var(--app-text-tertiary,#6b7280);font-weight:500}",
      ".qm-set-fallbackclose{position:absolute;top:8px;right:10px;width:24px;height:24px;line-height:1;border:0;border-radius:6px;background:transparent;color:inherit;font-size:13px;cursor:pointer;opacity:.6}",
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
      ".qm-set-staletag{font-size:11px;line-height:1;padding:3px 6px;border-radius:4px;",
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
      ".qm-set-rowlabel{display:flex;flex-direction:column;gap:4px;font-size:13px;",
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
      "color:var(--app-accent, #ff7f16);font-weight:500;box-shadow:0 2px 4px rgba(0,0,0,.04)}",
      // 开关 = 参考稿 iOS 风格（放大到 42x24，激活蓝）
      ".qm-set-switch{width:44px;height:24px;border-radius:24px;cursor:pointer;position:relative;",
      "background:var(--app-fill-strong,#cbd5e1);transition:background .2s;flex-shrink:0}",
      ".qm-set-switch-on{background:var(--app-accent, #ff7f16)}",
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
      ".qm-set-selectarrow{color:var(--app-text-tertiary,#64748b);font-size:13px}",
      ".qm-set-list{display:flex;flex-direction:column;gap:10px}",
      // 模板卡 = 参考稿 prompt-card：浅边框圆角卡，悬停轻微浮起
      ".qm-set-item{border:1px solid var(--app-border-subtle,#f1f5f9);",
      "border-radius:10px;padding:14px 16px;transition:all .2s;background:var(--app-bg-elevated,#fff)}",
      ".qm-set-item:hover{border-color:var(--app-border-strong,#cbd5e1);",
      "box-shadow:0 4px 12px rgba(0,0,0,.03)}",
      ".qm-set-itemhead{display:flex;align-items:center;gap:8px;margin-bottom:6px}",
      ".qm-set-itemname{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-tag{font-size:11px;padding:2px 8px;border-radius:6px;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-secondary,#64748b)}",
      ".qm-set-tagbuiltin{background:var(--app-fill-subtle,rgba(127,127,127,0.24))}",
      // 模板卡预览 = 参考稿 prompt-preview：最多两行，超出省略
      ".qm-set-itemdesc{font-size:13px;line-height:1.6;color:var(--app-text-tertiary,#64748b);",
      "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
      ".qm-set-toolbar{display:flex;gap:8px;margin-top:14px}",
      // 通用按钮 = 参考稿 .btn：灰底无边框圆角 8；主按钮见下方复合选择器
      ".qm-set-btn{font-size:13px;padding:9px 22px;height:auto;cursor:pointer;border-radius:8px;",
      "border:0;background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-primary,#1e293b);",
      "transition:all .2s}",
      ".qm-set-btn:hover{background:var(--app-fill-strong,#e2e8f0)}",
      // 保存按钮 = 参考稿 .btn-save：蓝底白字 + 蓝色柔光，hover 加深。
      // 必须用复合选择器且声明在 .qm-set-btn 之后：两条同特异性规则按顺序
      // 覆盖，否则通用按钮的灰底会压过这里的蓝底（用户报「保存按钮不高亮」的根因）。
      ".qm-set-btn.qm-set-btnprimary{background:var(--app-accent, #ff7f16);color:#fff;",
      "box-shadow:0 4px 12px var(--app-accent-soft, rgba(255,127,22,.2))}",
      ".qm-set-btn.qm-set-btnprimary:hover{background:#2563eb}",
      ".qm-set-btn.qm-set-btnprimary:disabled{opacity:.45}",
      // 新建模板按钮 = 参考稿 btn-new-template：虚线边框，悬停转蓝
      ".qm-set-btnnew{border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:var(--app-bg-elevated,#fff)}",
      ".qm-set-btnnew:hover{border-color:var(--app-accent, #ff7f16);color:var(--app-accent, #ff7f16);",
      "background:var(--app-accent-soft, rgba(255,127,22,.06))}",
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
      // 需求 5（2026-11-24）：默认参数页「携带上下文 / 并行分析各题」一行两列。
      // 子行仍用 .qm-set-row 结构（scope 标记/锁定态不丢），外层只负责分栏。
      ".qm-set-rowpair{display:grid;grid-template-columns:1fr 1fr;column-gap:18px;",
      "align-items:start}",
      ".qm-set-schedfield{display:flex;flex-direction:column;gap:4px;min-width:0}",
      ".qm-set-schedfieldlabel{font-size:13px;color:var(--app-text-tertiary,#94a3b8)}",
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
      "border-color:var(--app-accent, #ff7f16);box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.1))}",
      ".qm-set-schedadd{align-self:flex-start;margin-top:2px}",
      // ══════════════════════════════════════════════════════════════
      // 统一配置 · 时间策略（US-024，2026-11-23 架构重构）
      //
      // 按 boss 定稿的设计稿 demo/统一配置-时间策略-demo-v3.html 实现。
      // 类名统一 qm-set-ts* 前缀，与既有 qm-set-sched*（US-007 演示版）
      // 并存不冲突 —— 后者在 schedule 页签被本次实现替换，但 styles
      // 保留不删（回退时仍可用，且删样式属额外风险）。
      //
      // 配色全部走 CSS 变量（var(--app-accent) 系列），与插件其它区域同源；
      // 圆角/间距与 qm-set-* 同族。
      // ══════════════════════════════════════════════════════════════
      // 「此刻生效」横条：一眼看出当前按哪条策略在跑
      ".qm-set-nowbar{display:flex;align-items:center;gap:8px;font-size:12px;",
      "line-height:1.6;padding:9px 13px;border-radius:9px;margin:0 0 12px;",
      "background:var(--app-accent-soft, rgba(255,127,22,.06));border:1px solid var(--app-accent-soft, rgba(255,127,22,.22));",
      "color:var(--app-text-secondary,#64748b)}",
      ".qm-set-nowbar.fallback{background:var(--app-fill-subtle,#f8fafc);",
      "border-color:var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-nowbar b{color:var(--app-accent-text, #ff7f16);font-weight:600}",
      ".qm-set-nowbar.fallback b{color:var(--app-text-primary,#1e293b)}",
      // 策略卡
      ".qm-set-tslist{display:flex;flex-direction:column;gap:10px}",
      ".qm-set-tscard{position:relative;background:var(--app-bg-elevated,#fff);",
      "border:1px solid var(--app-border,#e5e7eb);border-radius:10px;",
      "padding:11px 13px 11px 15px;transition:border-color .15s,background .15s,box-shadow .15s}",
      // 左侧状态条：命中时亮蓝，普通态透明，hover 时显灰
      ".qm-set-tscard::before{content:'';position:absolute;left:0;top:10px;bottom:10px;",
      "width:3px;border-radius:0 2px 2px 0;background:transparent;transition:background .15s}",
      ".qm-set-tscard:hover{border-color:var(--app-border-strong,#cbd5e1);",
      "box-shadow:0 2px 8px rgba(0,0,0,.06)}",
      ".qm-set-tscard:hover::before{background:var(--app-border-strong,#cbd5e1)}",
      ".qm-set-tscard.qm-set-tshit{border-color:var(--app-accent-soft, rgba(255,127,22,.5));",
      "background:var(--app-accent-soft, rgba(255,127,22,.045))}",
      ".qm-set-tscard.qm-set-tshit::before{background:var(--app-accent, #ff7f16)}",
      ".qm-set-tscard.qm-set-tshit:hover{border-color:var(--app-accent, #ff7f16)}",
      ".qm-set-tscard.qm-set-tsedit{border-color:var(--app-accent, #ff7f16);",
      "box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.12))}",
      ".qm-set-tscard.qm-set-tsedit::before{background:var(--app-accent, #ff7f16)}",
      // 卡片顶行：序号 / 名称 / 生效徽标 / 时段 / 弹性空隙 / 操作
      ".qm-set-tstop{display:flex;align-items:center;gap:8px;min-width:0}",
      ".qm-set-tsidx{flex:none;width:18px;height:18px;border-radius:5px;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-tertiary,#94a3b8);",
      "font-size:11px;display:flex;align-items:center;justify-content:center;",
      "font-family:ui-monospace,SFMono-Regular,Menlo,monospace}",
      ".qm-set-tscard.qm-set-tshit .qm-set-tsidx{background:var(--app-accent, #ff7f16);color:#fff;font-weight:700}",
      ".qm-set-tsname{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b);",
      "flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".qm-set-tsbadge{flex:none;font-size:11px;line-height:1.6;padding:0 7px;",
      "border-radius:4px;background:var(--app-accent, #ff7f16);color:#fff;font-weight:600}",
      // 时段：等宽字体 + nowrap。nowrap 必须有，否则「22:00 → 08:00 次日」
      // 会折成两行，卡高跳动、时段读起来断裂。
      ".qm-set-tstime{flex:none;font-size:12px;color:var(--app-text-secondary,#64748b);",
      "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;",
      "padding:1px 8px;border-radius:5px;background:var(--app-fill-subtle,#f8fafc);",
      "border:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-tscard.qm-set-tshit .qm-set-tstime{color:var(--app-accent-text, #ff7f16);",
      "border-color:var(--app-accent-soft, rgba(255,127,22,.28));background:var(--app-accent-soft, rgba(255,127,22,.08))}",
      ".qm-set-tstime .nt{font-size:11px;color:var(--app-text-tertiary,#94a3b8);margin-left:3px}",
      ".qm-set-tssp{flex:1;min-width:4px}",
      // 操作按钮：常显边框（boss 定案⑤：一眼可辨「可编辑」）
      ".qm-set-tsacts{display:flex;align-items:center;gap:6px;flex:none}",
      ".qm-set-tsbtn{font-size:13px;line-height:1;padding:5px 9px;border-radius:6px;",
      "border:1px solid var(--app-border,#e5e7eb);background:transparent;cursor:pointer;",
      "color:var(--app-text-secondary,#64748b);transition:all .15s;white-space:nowrap}",
      ".qm-set-tsbtn:hover{color:var(--app-accent-text, #ff7f16);border-color:var(--app-accent-soft, rgba(255,127,22,.45));",
      "background:var(--app-accent-soft, rgba(255,127,22,.06))}",
      ".qm-set-tsbtn.qm-set-tsdel:hover{color:#d93025;border-color:#f3c2bd;",
      "background:rgba(217,48,37,.06)}",
      // 引用行 + 参数胶囊
      ".qm-set-tsrefs{margin-top:7px;font-size:11px;color:var(--app-text-secondary,#64748b);",
      "display:flex;align-items:center;gap:5px;flex-wrap:wrap}",
      ".qm-set-tsrefs .v{color:var(--app-text-tertiary,#94a3b8)}",
      ".qm-set-tsrefs .sep{color:var(--app-text-quaternary,#cbd5e1)}",
      ".qm-set-tschips{margin-top:7px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}",
      ".qm-set-tschip{font-size:11px;line-height:1.7;padding:0 7px;border-radius:4px;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-secondary,#64748b);",
      "border:1px solid var(--app-border-subtle,#f1f5f9);white-space:nowrap}",
      ".qm-set-tschip.mode{color:var(--app-accent-text, #ff7f16);background:var(--app-accent-soft, rgba(255,127,22,.08));",
      "border-color:var(--app-accent-soft, rgba(255,127,22,.22));font-weight:600}",
      // 布尔参数在展示态用小开关表达（boss 定案②：不用删除线）
      ".qm-set-tssw{display:inline-flex;align-items:center;gap:4px;font-size:11px;",
      "color:var(--app-text-tertiary,#94a3b8);white-space:nowrap}",
      ".qm-set-tssw .mini{width:16px;height:9px;border-radius:5px;",
      "background:var(--app-border,#e5e7eb);position:relative;transition:background .15s}",
      ".qm-set-tssw .mini::after{content:'';position:absolute;top:1px;left:1px;",
      "width:7px;height:7px;border-radius:50%;background:#fff;transition:left .15s}",
      ".qm-set-tssw.on .mini{background:var(--app-accent, #ff7f16)}",
      ".qm-set-tssw.on .mini::after{left:8px}",
      ".qm-set-tssw.on{color:var(--app-accent-text, #ff7f16)}",
      // 编辑态表单：两列网格，窄屏（640px media）改单列
      ".qm-set-tsform{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;",
      "gap:10px 14px;padding-top:10px;border-top:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-tsf{display:flex;flex-direction:column;gap:4px;min-width:0}",
      ".qm-set-tsf.full{grid-column:1 / -1}",
      ".qm-set-tsf label{font-size:13px;color:var(--app-text-tertiary,#94a3b8);",
      "display:flex;align-items:center;gap:5px}",
      ".qm-set-tsf label .tag{font-size:11px;padding:0 4px;border-radius:3px;",
      "background:var(--app-accent-soft, rgba(255,127,22,.1));color:var(--app-accent-text, #ff7f16);line-height:1.6}",
      ".qm-set-tsf .fc{display:flex;align-items:center;gap:6px;min-width:0}",
      ".qm-set-tsf .fc>*{min-width:0}",
      ".qm-set-tsf .fc input[type=text],.qm-set-tsf .fc select{",
      "font:inherit;font-size:13px;line-height:1.4;padding:7px 10px;border-radius:8px;",
      "border:1px solid var(--app-border,#e5e7eb);background:var(--app-bg-elevated,#fff);",
      "color:var(--app-text-primary,#1e293b);outline:none;box-sizing:border-box;width:100%;",
      "transition:border-color .15s,box-shadow .15s}",
      ".qm-set-tsf .fc input[type=text]:focus,.qm-set-tsf .fc select:focus{",
      "border-color:var(--app-accent, #ff7f16);box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.1))}",
      ".qm-set-tsf .fc input[type=time]{font:inherit;font-size:13px;line-height:1.4;",
      "padding:7px 10px;border-radius:8px;border:1px solid var(--app-border,#e5e7eb);",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1e293b);",
      "outline:none;box-sizing:border-box;flex:1 1 0;min-width:0;transition:border-color .15s}",
      ".qm-set-tsf .fc input[type=time]:focus{border-color:var(--app-accent, #ff7f16);",
      "box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.1))}",
      ".qm-set-tsdash{flex:none;color:var(--app-text-tertiary,#94a3b8);font-size:12px}",
      // 编辑态底栏
      ".qm-set-tsfoot{margin-top:10px;display:flex;align-items:center;gap:8px}",
      ".qm-set-tsfoot .note{flex:1;min-width:0;font-size:12px;",
      "color:var(--app-text-tertiary,#94a3b8);line-height:1.5}",
      // 空态
      ".qm-set-tsempty{text-align:center;padding:26px 16px;color:var(--app-text-secondary,#64748b);",
      "font-size:12px;line-height:1.9}",
      ".qm-set-tsempty b{display:block;font-size:13px;color:var(--app-text-primary,#1e293b);",
      "margin-bottom:4px}",
      // 运行参数的内嵌分类页签（避免顶层页签过多）
      ".qm-set-subtabs{display:flex;gap:6px;overflow-x:auto;margin:0 0 12px;",
      "scrollbar-width:none;padding-bottom:2px}",
      ".qm-set-subtabs::-webkit-scrollbar{width:0;height:0;display:none}",
      ".qm-set-subtab{background:transparent;border:1px solid var(--app-border,#e5e7eb);",
      "cursor:pointer;font-size:13px;line-height:1;padding:6px 12px;border-radius:999px;",
      "color:var(--app-text-secondary,#64748b);white-space:nowrap;flex:0 0 auto;",
      "transition:all .15s}",
      ".qm-set-subtab:hover{color:var(--app-text-primary,#1e293b);",
      "border-color:var(--app-border-strong,#cbd5e1)}",
      ".qm-set-subtabon{background:var(--app-accent, #ff7f16);color:#fff;border-color:var(--app-accent, #ff7f16);font-weight:500}",
      ".qm-set-subtabon:hover{background:var(--app-accent, #ff7f16);color:#fff}",
      ".qm-set-subtab .n{font-size:11px;margin-left:4px;opacity:.75}",
      // 参数组 / 通知配置卡（可复用 .qm-set-tscard 的形态）
      ".qm-set-pmcard{background:var(--app-bg-elevated,#fff);",
      "border:1px solid var(--app-border,#e5e7eb);border-radius:10px;padding:11px 13px}",
      ".qm-set-pmcard.readonly{background:var(--app-fill-subtle,#f8fafc)}",
      ".qm-set-pmhead{display:flex;align-items:center;gap:8px;margin-bottom:9px}",
      ".qm-set-pmname{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b)}",
      ".qm-set-pmused{font-size:11px;padding:0 6px;border-radius:4px;line-height:1.7;",
      "background:var(--app-fill-subtle,#f8fafc);color:var(--app-text-tertiary,#94a3b8);",
      "border:1px solid var(--app-border-subtle,#f1f5f9)}",
      ".qm-set-pmused.builtin{background:var(--app-accent-soft, rgba(255,127,22,.08));color:var(--app-accent-text, #ff7f16);",
      "border-color:var(--app-accent-soft, rgba(255,127,22,.22))}",
      // 参数网格：一行两列（boss 定案⑥：默认参数卡 598px → 398px）
      ".qm-set-pgrid{display:grid;grid-template-columns:1fr 1fr;gap:9px 14px}",
      ".qm-set-pitem{display:flex;flex-direction:column;gap:3px;min-width:0}",
      ".qm-set-pitem.full{grid-column:1 / -1}",
      ".qm-set-pitem.inline{flex-direction:row;align-items:center;justify-content:space-between}",
      ".qm-set-pitem label{font-size:13px;color:var(--app-text-tertiary,#94a3b8)}",
      ".qm-set-pitem select,.qm-set-pitem input{font:inherit;font-size:12px;line-height:1.4;",
      "padding:6px 9px;border-radius:7px;border:1px solid var(--app-border,#e5e7eb);",
      "background:var(--app-bg-elevated,#fff);color:var(--app-text-primary,#1e293b);",
      "outline:none;box-sizing:border-box;width:100%;transition:border-color .15s}",
      ".qm-set-pitem select:focus,.qm-set-pitem input:focus{border-color:var(--app-accent, #ff7f16);",
      "box-shadow:0 0 0 3px var(--app-accent-soft, rgba(255,127,22,.1))}",
      ".qm-set-pmadd{align-self:flex-start;margin-top:10px}",
      // 策略库列表容器
      ".qm-set-pmlist{display:flex;flex-direction:column;gap:10px}",
      // 窄屏：策略卡/参数网格/表单全部改单列（桌面不变）
      "@media (max-width:640px){",
      ".qm-set-tsform{grid-template-columns:1fr}",
      ".qm-set-pgrid{grid-template-columns:1fr}",
      ".qm-set-tstop{flex-wrap:wrap}",
      ".qm-set-tstime{order:5}",
      ".qm-set-tsacts{order:6;margin-left:auto}",
      "}",
      // ── 自定义 API 通知卡（US-008，纯 UI 占位）──
      // 卡容器/网格/字段复用 .qm-set-sched*（demo v5 同一卡形态），
      // 这里只补 API 卡特有元素：标题徽标 / 启用开关 / 测试按钮。
      ".qm-set-apicard{margin-top:14px}",
      ".qm-set-apititle{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b);",
      "display:inline-flex;align-items:center}",
      // 「新增渠道」徽标 = demo v5 内联样式（accent 底白字小圆角）
      ".qm-set-apibadge{display:inline-block;font-size:11px;font-weight:700;color:#fff;",
      "background:var(--app-accent, #ff7f16);border-radius:4px;padding:1px 6px;",
      "margin-left:8px;vertical-align:2px}",
      // 启用开关 = demo .switch 形态（34×19 胶囊 + 滑动白点），纯演示可点击
      ".qm-set-apiswitch{flex:0 0 auto;margin-left:auto;position:relative;width:34px;",
      "height:19px;border-radius:10px;border:none;padding:0;cursor:pointer;",
      "background:#d9d9d9;transition:background .2s}",
      ".qm-set-apiswitch.on{background:var(--app-accent, #ff7f16)}",
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
      ".qm-set-apitest:hover{border-color:var(--app-accent, #ff7f16);",
      "color:var(--app-accent, #ff7f16)}",
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
      ".qm-apisystag{flex:0 0 auto;font-size:11px;padding:1px 5px;border-radius:3px;",
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
      "color:var(--app-text-tertiary,#94a3b8);cursor:pointer;font-size:13px;",
      "border-radius:4px}",
      ".qm-apidel:hover{color:#d92d20;background:rgba(217,45,32,.08)}",
      ".qm-apiadd{align-self:flex-start;height:26px;padding:0 10px;font-size:12px;",
      "border-radius:5px;border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:transparent;color:var(--app-accent, #ff7f16);cursor:pointer}",
      ".qm-apiadd:hover{border-color:var(--app-accent, #ff7f16);",
      "background:var(--app-accent-soft, rgba(255,127,22,.06))}",
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
function L(t) {
  try {
    const e = ze();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Vn = "", Ks = "";
function xr(t, e) {
  t && (Ks = t), e && (Vn = e);
}
function j() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = ze(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let a = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    a || (a = Vn), a && (t["X-Agent-Id"] = a);
  } catch {
  }
  return t;
}
function sn() {
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
  return Ks;
}
globalThis.__qmSessionProbe = sn;
let ps = null;
function nl() {
  if (ps) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (ps = t.setInterval(() => {
    try {
      fetch(L("/heartbeat"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({ session_id: sn() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
nl();
function Wt() {
  try {
    const t = ze(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Vn;
}
const Ja = {};
async function al(t, e, n) {
  if (typeof window > "u" || Ja[t]) return "skipped";
  try {
    const s = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return Ja[t] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  Ja[t] = !0;
  const a = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", r = window.Notification;
  if (!r) return "inpage";
  try {
    if (r.permission === "default" && await new Promise((d) => {
      let i = !1;
      const f = (g) => {
        i || (i = !0, d(g));
      };
      try {
        const g = r.requestPermission((k) => f(k));
        g && typeof g.then == "function" && g.then(f).catch(() => f("denied"));
      } catch {
        f("denied");
      }
      setTimeout(() => f(r.permission || "denied"), 8e3);
    }) !== "granted" || r.permission !== "granted") return "inpage";
    const s = new r("问卷等待作答", { body: a, tag: "qm-" + t, renotify: !1 });
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
function ie(t) {
  const e = Rt(t);
  return e && e.session_id ? e.session_id : sn();
}
const Za = 180, rl = 20, Hs = 6e3, sl = 60, ol = 8;
function il() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const ll = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function ms(t) {
  try {
    return String(t || "").replace(ll, "").length;
  } catch {
    return 0;
  }
}
function us(t) {
  const e = il();
  if (!e) return -1;
  let n = null;
  try {
    n = e.querySelector('[data-qm-card-id="' + t + '"]');
  } catch {
    return -1;
  }
  if (!n) return -1;
  let a = -1;
  try {
    a = ms((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return a - ms(n.textContent);
}
function cl(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右上角 🔒 释放阻塞" : "⏳ 已提交，模型处理中";
}
function dl(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function fs(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: Hs });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const pl = "qm:v1:analysis:global", ml = "qm:v1:analysis:", ul = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Kt(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function fl(t) {
  if (!t || typeof t != "object") return { ...ul };
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
function gl() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(ml) === 0 && n !== pl && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function hl() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: j() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : fl(e.prefs);
  } catch {
    return null;
  }
}
async function kr() {
  try {
    const t = await fetch(L("/question-modal/templates"), { headers: j() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function On(t, e, n) {
  if (!t) return null;
  try {
    const a = await fetch(L("/question-modal/survey-action"), {
      method: "POST",
      headers: j(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Zn()
      })
    }), r = await a.json().catch(() => ({}));
    return a.ok ? {
      accepted: r.accepted !== !1,
      reason: String(r.reason || ""),
      state: r.state || null
    } : null;
  } catch {
    return null;
  }
}
async function bl(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      L("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: j() }
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
function yl(t, e) {
  if (!t) return () => {
  };
  let n = !1, a = null, r = 0, s = null, o = 0, d = !1, i = 0, f = 0, g = null;
  const k = (y) => {
    n || g === y || (g = y, e.onStatus(y));
  }, b = () => {
    if (!n)
      try {
        const y = typeof AbortController < "u" ? new AbortController() : null, u = L("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, _ = { headers: j() };
        y && (_.signal = y.signal), a = () => {
          try {
            y && y.abort();
          } catch {
          }
        }, fetch(u, _).then(async (P) => {
          const x = Gl(P);
          if (!P.ok || !P.body || x) {
            if (P.status === 404 || P.status === 501 || P.status === 405) {
              d = !0, k(!1);
              return;
            }
            throw x && (i += 1), new Error(x ? "blocked" : "HTTP " + P.status);
          }
          r = 0, i = 0, k(!0);
          const T = P.body.getReader(), E = new TextDecoder();
          let $ = "";
          const S = () => {
            T.read().then(({ done: M, value: I }) => {
              if (M) {
                v();
                return;
              }
              $ += E.decode(I, { stream: !0 });
              let me;
              for (; (me = $.indexOf(`

`)) >= 0; ) {
                const J = $.slice(0, me);
                $ = $.slice(me + 2), J.split(`
`).forEach((Y) => {
                  if (!Y.startsWith("data: ")) return;
                  let H = null;
                  try {
                    H = JSON.parse(Y.slice(6));
                  } catch {
                    return;
                  }
                  H && (H.kind === "snapshot" ? (o = Math.max(o, parseInt(H.rev || 0, 10) || 0), e.onSnapshot(o, H.state || null)) : H.kind === "change" && (o = Math.max(o, parseInt(H.rev || 0, 10) || 0), e.onChange(H)));
                });
              }
              n || S();
            }).catch(() => {
              v();
            });
          };
          S();
        }).catch(() => {
          v();
        });
      } catch {
        v();
      }
  }, v = () => {
    if (n || d)
      return;
    if (k(!1), i += 1, f || (f = Date.now()), i >= eo) {
      if (Date.now() - (f || Date.now()) >= no) {
        d = !0, k(!1);
        return;
      }
      s = setTimeout(b, to);
      return;
    }
    r = Math.min(r + 1, 6);
    const y = Math.min(1e4, 500 * Math.pow(2, r));
    s = setTimeout(b, y);
  };
  return b(), () => {
    if (n = !0, s)
      try {
        clearTimeout(s);
      } catch {
      }
    if (a)
      try {
        a();
      } catch {
      }
    g = null, e.onStatus(!1);
  };
}
async function Qa(t, e, n) {
  try {
    return (await fetch(L("/question-modal/session-prefs"), {
      method: "POST",
      headers: j(),
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
let Us = null;
async function nn(t, e, n, a) {
  const r = t || "", s = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(a || "");
  try {
    const o = L(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(r) + s
    ), d = await fetch(o, { headers: j() });
    if (!d.ok) return null;
    const i = await d.json();
    if (!i || i.ok !== !0) return null;
    const f = {
      config: i.config || {},
      globalKeys: Array.isArray(i.global_keys) ? i.global_keys : [],
      version: typeof i.version == "number" ? i.version : 0,
      schema: Array.isArray(i.schema) ? i.schema : [],
      has_session: i.has_session === !0,
      keyTs: i.key_ts && typeof i.key_ts == "object" ? i.key_ts : {},
      // 分层原始数据（2026-11-13）：缺失时回落 {}，cfgValue 再用老路径兜底，
      // 保证旧后端（不返回这两字段）也不会白屏。
      sessionConfig: i.session_config && typeof i.session_config == "object" ? i.session_config : void 0,
      globalConfig: i.global_config && typeof i.global_config == "object" ? i.global_config : void 0,
      // ── 策略库与命中策略（US-024，2026-11-23）──────────────────────
      //
      // 必须在这里显式透传：这个函数**只挑已知字段**构造 data，
      // 后端返回的新字段若不登记就会被静默丢弃（本轮实测：库里明明有
      // 3 条策略，UI 上一张卡都渲染不出来，因为 libraries 在这一层就没了）。
      // 与 MEMORY「派生元数据不得在出口被裁掉」是同一类缺陷。
      baseConfig: i.base_config && typeof i.base_config == "object" ? i.base_config : void 0,
      schedule: i.schedule && typeof i.schedule == "object" ? i.schedule : null,
      libraries: i.libraries && typeof i.libraries == "object" ? i.libraries : void 0
    };
    return Us = { chatId: r, at: Date.now(), data: f }, f;
  } catch {
    return null;
  }
}
function Gs() {
  Us = null;
}
async function Xn() {
  const t = await fetch(
    L("/question-modal/stale-surveys"),
    { headers: j() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Yn(t) {
  const e = l.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function pr(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function vr(t) {
  const e = await fetch(L("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: j(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function xl(t) {
  const e = await fetch(L("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: j(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function kl() {
  l.stale.busy = !0, l.stale.msgKind = "info", l.stale.msg = "正在扫描…", q();
  const t = Date.now();
  try {
    const e = await Xn();
    Yn(e), l.stale.page = 0, l.stale.resPage = 0;
    const n = l.stale.rows.length, a = l.stale.blocking.length, r = l.stale.residual.length, s = l.stale.exceeded.length, o = l.stale.within.length, d = Date.now() - t;
    l.stale.msgKind = "ok";
    const i = pr(l.stale.threshold);
    l.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${a} 条、异常残留 ${r} 条；已超阈值 ${s} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${d}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${d}ms）`;
  } catch (e) {
    l.stale.rows = [], l.stale.exceeded = [], l.stale.within = [], l.stale.blocking = [], l.stale.residual = [], l.stale.scanned = !1, l.stale.msgKind = "error", l.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    l.stale.busy = !1, q();
  }
}
async function Va(t, e = "释放") {
  l.stale.busy = !0, l.stale.msg = "", q();
  try {
    const n = await vr({ tool_call_ids: t }), a = Number(n && n.released) || 0, r = Number(n && n.already) || 0, s = Number(n && n.failed) || 0;
    l.stale.msgKind = s > 0 ? "warn" : "ok", l.stale.msg = s > 0 ? `${e} ${a} 条，${s} 条未成功（见日志）` + (r ? `；${r} 条此前已处理` : "") : a > 0 ? `已${e} ${a} 条问卷` + (r ? `；${r} 条此前已处理` : "") : `无需${e}：${r || t.length} 条此前已处理`;
    const o = await Xn();
    Yn(o);
  } catch (n) {
    l.stale.msgKind = "error", l.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    l.stale.busy = !1, q();
  }
}
async function vl() {
  l.stale.busy = !0, l.stale.msg = "", q();
  try {
    const t = await vr({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, a = Number(t && t.already) || 0, r = Number(t && t.requested) || 0;
    l.stale.msgKind = n > 0 ? "warn" : "ok", l.stale.msg = r === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${r} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (a ? `；${a} 条此前已释放` : "");
    const s = await Xn();
    Yn(s);
  } catch (t) {
    l.stale.msgKind = "error", l.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    l.stale.busy = !1, q();
  }
}
async function wl() {
  const t = (l.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    l.stale.msgKind = "info", l.stale.msg = "当前没有可清理的残留问卷", q();
    return;
  }
  l.stale.busy = !0, l.stale.msg = "", q();
  try {
    const e = await vr({ tool_call_ids: t }), n = Number(e && e.released) || 0, a = Number(e && e.already) || 0, r = Number(e && e.failed) || 0;
    l.stale.msgKind = r > 0 ? "warn" : "ok", l.stale.msg = r > 0 ? `清理 ${n} 条，${r} 条未成功（见日志）` : `已清理 ${n} 条残留` + (a ? `；${a} 条此前已收尾` : "");
    const s = await Xn();
    Yn(s), l.stale.resPage = 0;
  } catch (e) {
    l.stale.msgKind = "error", l.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    l.stale.busy = !1, q();
  }
}
async function ql(t) {
  l.stale.busy = !0, l.stale.msg = "", q();
  try {
    const e = await xl(t), n = e && e.results || [], a = n.filter((s) => s && s.stopped).length, r = n.filter((s) => s && !s.stopped).length;
    l.stale.msgKind = a > 0 ? "ok" : "warn", l.stale.msg = a > 0 ? `已终止 ${a} 个会话` + (r ? `；${r} 个会话已不存在` : "") : `${r} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    l.stale.msgKind = "error", l.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    l.stale.busy = !1, q();
  }
}
async function Js(t) {
  try {
    const e = await fetch(L("/question-modal/templates"), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Zs(t) {
  try {
    const e = await fetch(L("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: j()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Qs() {
  try {
    const t = await fetch(L("/models"), { headers: j() });
    if (!t.ok) return [];
    const e = await t.json();
    return (Array.isArray(e) ? e : []).filter((a) => {
      const s = [...a.models || [], ...a.extra_models || []].length > 0, o = !!a.api_key || a.require_api_key === !1 || a.is_local || a.is_custom;
      return s && o;
    });
  } catch {
    return [];
  }
}
function El(t) {
  if (!t) return "";
  try {
    return String(W.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function F(t, e) {
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
const ye = "__other__";
function Te(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function St(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Xa(t, e, n) {
  const a = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((r) => {
    if (n && n.has(r) || !Object.prototype.hasOwnProperty.call(a, r)) return;
    const s = e[r];
    !s || typeof s != "object" || !St(a[r]) && St(s) && (a[r] = { ...s });
  }), a;
}
function gs(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((a) => String(a ?? "").trim()).filter((a) => a.length > 0);
}
function hs(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const a = n.find((r) => Number(r && r.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return a ? String(a.choice === void 0 || a.choice === null ? "" : a.choice).trim() : "";
}
function Sl(t, e, n) {
  if (!n.length) return !1;
  const a = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), r = Te(e), s = De(e), o = a(r), d = a(s);
  return n.some((i) => {
    const f = a(i);
    return f ? !!(i === r || i === s || f === o || f === d || Math.min(f.length, o.length, d.length) >= 4 && (f.length >= 4 && (o.includes(f) || f.includes(o)) || f.length >= 4 && (d.includes(f) || f.includes(d)))) : !1;
  });
}
function le(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let Vs = !0;
function Hn(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (Vs ? "第 " + (e + 1) + " 题" : "");
}
function De(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function _l(t, e) {
  const n = /* @__PURE__ */ new Set(), a = (s) => {
    s != null && s !== "" && n.add(String(s));
  }, r = t.options || [];
  if (le(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      a(o);
      const d = r.find((i) => Te(i) === String(o));
      d && a(De(d)), String(o) === ye && e.other && a(e.other);
    });
  else {
    a(e.value);
    const s = r.find((o) => Te(o) === String(e.value));
    s && a(De(s)), String(e.value) === ye && e.other && a(e.other);
  }
  return n;
}
function Nl(t, e) {
  return (Array.isArray(t) ? t : [t]).some((a) => {
    const r = String(a);
    if (r.startsWith("=")) return e.has(r.slice(1));
    if (e.has(r)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(r) !== -1 || r.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Xs(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const r = parseInt(n[1], 10);
    if (r >= 0 && r < e.length) return r;
  }
  return e.findIndex((r) => (r.title || "").trim() === t.trim());
}
function Ys(t, e, n) {
  const a = e[t], r = a && a.showIf;
  if (!r || typeof r != "object" || !Object.keys(r).length) return !0;
  for (const s of Object.keys(r)) {
    const o = Xs(s, e);
    if (o < 0) continue;
    const d = e[o];
    if (!d) continue;
    if (d.showIf && !Ys(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !Nl(r[s], _l(d, i))) return !1;
  }
  return !0;
}
function Ge(t, e) {
  const n = [];
  return t.forEach((a, r) => {
    Ys(r, t, e) && n.push(r);
  }), n;
}
function Cl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function $n(t) {
  return Array.isArray(t.questions);
}
function Tl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function zl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, a = n && n.output;
    return a ? typeof a == "string" ? a : Array.isArray(a) ? a.map((r) => r && (r.text || r.content) || "").join(`
`) : String(a) : "";
  } catch {
    return "";
  }
}
function Il(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function Al(t) {
  if (!t) return "";
  const e = String(t).split(`
`).map((a) => a.trim()).filter(Boolean);
  for (let a = e.length - 1; a >= 0; a--) {
    const r = e[a];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(r) && !/^\{/.test(r) && !/^\s*"skipped"/.test(r) && r.length < 400)
      return r.replace(/^【|】$/g, "").trim();
  }
  const n = String(t).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return n && n[1] && n[1] !== "timeout" ? n[1] : "";
}
function Ht(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const r = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${r === "watchdog" ? "系统自动释放" : r === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + jn(t);
  }
  const n = e && e.answers || {}, a = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((r) => {
    const s = n[r];
    if (!s || typeof s != "object") return;
    const o = Xs(r, t), d = o >= 0 ? t[o] : null, i = d ? le(d) === "single" ? "单选" : le(d) === "multi" ? "多选" : "问答" : "问答", f = d ? Hn(d, o) : r;
    let g = s.value;
    if (Array.isArray(g) && (g = g.join("、")), s.other && (g = (g ? g + "、" : "") + s.other), s.skipped) {
      const k = String(s.skipped_by || ""), b = k === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : k === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      a.push(`- ${r} [${i}] ${f}${b}`);
    } else
      a.push(`- ${r} [${i}] ${f}：${g === "" || g == null ? "（空）" : g}`);
  }), e.other && a.push("", `其他意见：${e.other}`), a.join(`
`);
}
async function Ol(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const a = await fetch(
      L("/question-modal/resolve") + "?" + n.toString(),
      { headers: j() }
    );
    if (!a.ok) return { kind: "error" };
    const r = await a.json();
    return r && xr(r.session_id, r.agent_id), r && r.found ? { kind: "found", data: r } : r && r.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Ut(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      L("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: j() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function $l(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = j();
    delete n["Content-Type"];
    const a = await fetch(
      L("/console/upload"),
      { method: "POST", headers: n, body: e }
    );
    if (!a.ok) {
      const s = await a.text().catch(() => "");
      let o = "HTTP " + a.status;
      try {
        const d = JSON.parse(s);
        d && d.detail && (o = d.detail);
      } catch {
      }
      return { ok: !1, error: `${t.name}: ${o}` };
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
const Un = "qm:v1:stash_att:", bs = 25 * 1024 * 1024, Bn = /* @__PURE__ */ new Map(), Ln = /* @__PURE__ */ new Map();
let Gn = null, Jn = 0, Ya = null;
function ys() {
  const t = Jn > 0;
  Ln.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function Pl() {
  if (Ya) return Ya;
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
    const a = Gn;
    Gn = null, !(!a || !n.length) && await Rs(n, a.callId, a.target, a.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Ya = t, t;
}
function Ml(t, e, n) {
  if (!t) {
    F("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Gn = { callId: t, target: e, key: n };
  const a = Pl();
  if (a && typeof a.click == "function")
    try {
      a.click();
      return;
    } catch {
    }
  a || (Gn = null);
}
async function Rs(t, e, n, a) {
  Jn += 1, ys();
  const r = [], s = [];
  try {
    for (const d of t) {
      if (d.size && d.size > bs) {
        s.push(`${d.name}: 文件过大（上限 ${Math.round(bs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await $l(d);
      i.ok ? r.push(i.att) : s.push(i.error);
    }
  } finally {
    Jn -= 1, ys();
  }
  const o = Bn.get(e);
  if (r.length || s.length) {
    const d = n === "final" ? "final" : "q";
    if (!e) {
      F(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (o)
      try {
        o(r, d, a, s);
      } catch {
      }
    else r.length && Bl(e, r, d, a);
  }
}
function Bl(t, e, n, a) {
  if (!(!t || !e.length))
    try {
      const r = localStorage.getItem(Un + t), s = r ? JSON.parse(r) : [], o = (Array.isArray(s) ? s : []).concat(
        e.map((d) => ({ att: d, target: n, key: a }))
      );
      localStorage.setItem(Un + t, JSON.stringify(o));
    } catch {
    }
}
function Ll(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(Un + t);
    if (!e) return [];
    localStorage.removeItem(Un + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function jl(t) {
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
function Dl(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Ra(t, e) {
  const n = e || ie(t), a = Rt(t), r = a && a.request_id ? a.request_id : "";
  if (r)
    try {
      const s = await fetch(L("/question-modal/skip"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({ request_id: r, session_id: n || "" })
      });
      if (s.ok) {
        const o = await s.json().catch(() => ({}));
        return he(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return he(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const s = await fetch(
        L("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: j() }
      );
      if (s.ok) {
        const o = await s.json().catch(() => ({})), d = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return he(t), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function xs(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      L("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: j() }
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
async function Fl(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      L("/question-modal/pending") + e,
      { headers: j() }
    );
    if (!n.ok) return null;
    const a = await n.json(), r = a && a.items || [];
    if (!Array.isArray(r) || r.length !== 1) return null;
    const s = r[0];
    if (!s || !s.request_id) return null;
    const o = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(s.request_id),
      { headers: j() }
    );
    if (!o.ok) return null;
    const d = await o.json();
    return d && xr(d.session_id, d.agent_id), d && d.found ? d : null;
  } catch {
    return null;
  }
}
const Rn = "qm:v1:reqid:", Wl = 3e4, Kl = 45e3, eo = 6, to = 6e4, no = 15 * 6e4, Hl = 700, Ul = 8;
function Gl(t) {
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
      localStorage.removeItem(Rn + t);
    } catch {
    }
}
function Jl() {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const s = localStorage.key(r);
      s && s.indexOf(Rn) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((r) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        s = null;
      }
      !s || !s.request_id || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 50;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, s) => r.ts - s.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
function Zl(t, e, n, a) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Rn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: a || "",
        tool_call_id: t,
        ts: Date.now()
      })), Jl();
    } catch {
    }
}
function Rt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Rn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (he(t), null) : n;
  } catch {
    return null;
  }
}
const wr = "qm:v1:state:";
function Qt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(wr + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Zn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const ao = Zn(), ks = "qm:v1:sessionprefs-ping";
function ot(t, e) {
  if (t)
    try {
      const a = { ...Qt(t) || {}, ...e, ts: Date.now(), origin: ao };
      localStorage.setItem(wr + t, JSON.stringify(a)), Ql();
    } catch {
    }
}
function Ql() {
  try {
    const t = [];
    for (let r = 0; r < localStorage.length; r++) {
      const s = localStorage.key(r);
      s && s.indexOf(wr) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((r) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(r) || "null");
      } catch {
        s = null;
      }
      !s || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(r) : n.push(r);
    });
    const a = 80;
    if (n.length <= a) return;
    n.map((r) => ({ k: r, ts: (JSON.parse(localStorage.getItem(r) || "{}") || {}).ts || 0 })).sort((r, s) => r.ts - s.ts).slice(0, n.length - a).forEach((r) => localStorage.removeItem(r.k));
  } catch {
  }
}
async function Vl(t) {
  try {
    const e = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: j() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && xr(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Xl(t, e, n, a) {
  const r = ["【用户提交的问卷答案】"], s = new Set(Ge(t, e));
  return t.forEach((o, d) => {
    if (!s.has(d)) return;
    const i = e[`q${d}`];
    if (!i) return;
    let f = i.value;
    if (Array.isArray(f))
      f = f.filter((u) => u !== ye).map((u) => {
        const _ = (o.options || []).find((N) => Te(N) === String(u));
        return _ ? De(_) : u;
      }).join("、");
    else {
      const u = (o.options || []).find((_) => Te(_) === String(f));
      u && (f = De(u)), String(i.value) === ye && (f = "");
    }
    const g = le(o) === "single" ? "单选" : le(o) === "multi" ? "多选" : "问答", k = !!String(f || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), b = String(i.skipped_by || ""), v = i.skipped ? b === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : b === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : k ? f : "（未作答）";
    let y = `- q${d} [${g}] ${v}`;
    i.other && !i.skipped && (y += `（其他：${i.other}）`), i.attachments && i.attachments.length && (y += `（附件：${i.attachments.map((u) => u.file_name).join("、")}）`), r.push(y);
  }), n && r.push(`- 其他意见：${n}`), a && a.length && r.push(`- 其他意见附件：${a.map((o) => o.file_name).join("、")}`), r.join(`
`);
}
function Yl(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const a = t[n];
    if (!a || typeof a != "object") {
      e[n] = a;
      return;
    }
    const r = a.value;
    if (Array.isArray(r) ? r.length === 1 && r[0] === ye : String(r ?? "") === ye) {
      e[n] = a;
      return;
    }
    e[n] = { ...a, other: "", attachments: [] };
  }), e;
}
const Rl = ["必须", "务必", "不得为空", "不能为空"], ec = ["可为空", "可留空", "选填", "可选", "非必填"];
function ro(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Rl.some((n) => e.indexOf(n) !== -1) ? !1 : ec.some((n) => e.indexOf(n) !== -1);
}
function tc(t, e) {
  const n = { ...e || {} };
  let a = [];
  try {
    a = Ge(t, n);
  } catch {
    return n;
  }
  return a.forEach((r) => {
    const s = t[r];
    if (!ro(s)) return;
    const o = `q${r}`, d = n[o];
    if (d && (d.skipped === !0 || St(d))) return;
    const i = le(s);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function jn(t) {
  return t.map((e, n) => {
    const a = le(e) === "single" ? "单选" : le(e) === "multi" ? "多选" : "问答", r = (e.options || []).map(De).join("、");
    return `${n + 1}. [${a}] ${Hn(e, n)}${r ? "（" + r + "）" : ""}`;
  }).join(`
`);
}
function er(t) {
  const { R: e, files: n, disabled: a, uploading: r, error: s, onPick: o, onRemove: d } = t, i = {
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
  }, f = {
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
    n.map((g, k) => e.createElement(
      "span",
      { key: "att" + k, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: g.file_name
      }, g.file_name + (g.size ? "（" + Dl(g.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          a || d(k);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: a || r,
      style: f,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, r ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function nc(t) {
  const {
    R: e,
    providers: n,
    modelId: a,
    onChange: r,
    disabled: s,
    open: o,
    onOpenChange: d,
    tab: i,
    onTabChange: f
  } = t, k = Ve().Popover, b = [];
  n.forEach((S) => {
    [...S.models || [], ...S.extra_models || []].forEach((M) => {
      b.push({
        providerId: S.id,
        providerName: S.name || S.id,
        modelId: M.id,
        modelName: M.name || M.id,
        free: !!M.is_free
      });
    });
  });
  const v = b.find((S) => `${S.providerId}:${S.modelId}` === a), u = v ? v.modelName : a || "选择模型", _ = v ? v.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", N = {
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
  }, P = b.filter((S) => S.free).length, x = b.length - P, T = [];
  n.forEach((S) => {
    const M = [...S.models || [], ...S.extra_models || []].map((I) => ({
      providerId: S.id,
      providerName: S.name || S.id,
      modelId: I.id,
      modelName: I.name || I.id,
      free: !!I.is_free
    })).filter((I) => i === "free" ? I.free : !I.free);
    M.length && T.push({ id: S.id, name: S.name || S.id, models: M });
  });
  const E = (S, M) => e.createElement("button", {
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
    onClick: () => f(S)
  }, M), $ = e.createElement(
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
      E("paid", "付费 🟡 " + x),
      E("free", "免费 🟢 " + P)
    ),
    T.length ? e.createElement("div", null, T.map((S, M) => (
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
        S.models.map((I) => {
          const me = `${I.providerId}:${I.modelId}` === a;
          return e.createElement(
            "div",
            {
              key: `${I.providerId}:${I.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (me ? "var(--app-accent, #ff7f16)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: me ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                r(`${I.providerId}:${I.modelId}`), d(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: M % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, I.modelName)
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
      style: N,
      disabled: s,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: _ }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, u),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: N,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const S = b.find((M) => `${M.providerId}:${M.modelId}` !== a);
        S && r(`${S.providerId}:${S.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: _ }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, u),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function ac(t) {
  const { R: e, mode: n, onChange: a, disabled: r, open: s, onOpenChange: o, popRef: d, panelRef: i } = t, f = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, g = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发模型请求：直接采用出题时已标注的推荐",
    manual: "由你手动作答"
  }, k = {
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
    cursor: r ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, b = e.createElement(
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
  ), v = (_) => {
    const N = n === _;
    return e.createElement(
      "button",
      {
        key: _,
        type: "button",
        disabled: r,
        role: "menuitem",
        className: "qm-mode-opt",
        title: g[_],
        onClick: () => {
          a(_), o(!1);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          cursor: r ? "default" : "pointer",
          padding: "7px 9px",
          borderRadius: 6,
          border: "none",
          // US-010: 选中项淡 accent 底色（boss 反馈 4：选中项要一眼可辨）；
          // 未选中项保持透明底 + CSS hover 高亮（.qm-mode-opt:hover）。
          background: N ? "var(--app-accent-bg, rgba(255,127,22,0.08))" : "transparent",
          color: N ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: N ? 600 : 400
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
        e.createElement("span", null, f[_]),
        // US-010: 选中项右侧 accent 色 ✓ 勾，强化「当前选中」辨识度。
        N ? e.createElement("span", {
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
      }, g[_])
    );
  }, y = e.createElement(
    "div",
    {
      key: "qm-mode-trigger",
      ref: d,
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
        disabled: r,
        style: k,
        title: "运行选择：" + f[n],
        onClick: () => o(!s)
      },
      b,
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis" }
      }, f[n]),
      e.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
      }, "▾")
    )
  ), u = s ? e.createElement(
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
    v("ai"),
    v("recommend"),
    v("manual")
  ) : null;
  return [y, u];
}
function rc(t) {
  const { R: e, templates: n, value: a, onSelect: r, onManage: s } = t;
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
          borderLeft: "3px solid " + (o.id === a ? "var(--app-accent, #ff7f16)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: o.id === a ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        // 关闭弹层由调用方负责（本列表只负责选择/管理两个入口语义）。
        onClick: () => r(o.id)
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
      o.id === a ? e.createElement("span", {
        "aria-hidden": "true",
        style: {
          flex: "none",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--app-accent, #ff7f16)"
        }
      }, "✓") : null
    )),
    e.createElement("div", {
      style: {
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--app-accent, #ff7f16)",
        borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))"
      },
      onClick: () => s()
    }, "＋ 管理模板…")
  );
}
function sc(t) {
  const { R: e, open: n, templates: a, value: r, edit: s, onEditChange: o, onClose: d, onSelect: i, onSave: f, onDelete: g } = t;
  if (!n) return null;
  const k = Ve(), { Input: b, Modal: v } = k, y = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  v || (y.position = "fixed", y.right = 24, y.top = 80, y.width = 420, y.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", y.zIndex = 1100, y.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const u = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, _ = !!s, N = (x, T, E, $) => b && b.TextArea ? e.createElement(b.TextArea, {
    value: x,
    rows: E,
    placeholder: $,
    onChange: (S) => T(S && S.target ? S.target.value : "")
  }) : e.createElement("textarea", {
    value: x,
    rows: E,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (S) => T(S && S.target ? S.target.value : ""),
    onChange: (S) => T(S && S.target ? S.target.value : "")
  }), P = e.createElement(
    "div",
    {
      style: y,
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
        _ ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: u, onClick: d }, "关闭")
    ),
    _ ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      N(s.name || "", (x) => o({ ...s, name: x }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      N(s.system || "", (x) => o({ ...s, system: x }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      N(s.user || "", (x) => o({ ...s, user: x }), 6, "用户提示词模板"),
      e.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 10 } },
        e.createElement("button", {
          type: "button",
          style: {
            ...u,
            borderColor: "var(--app-accent, #ff7f16)",
            color: "var(--app-accent, #ff7f16)"
          },
          onClick: () => f(s)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: u,
          onClick: () => o(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (a || []).map(
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
            x.name + (x.builtin ? "（内置）" : "") + (x.id === r ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: u,
            title: "设为本题使用",
            onClick: () => i(x.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: u,
            onClick: () => o({
              id: x.id,
              name: x.name,
              system: x.system,
              user: x.user
            })
          }, "编辑"),
          x.builtin ? null : e.createElement("button", {
            type: "button",
            style: u,
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
            ...u,
            borderColor: "var(--app-accent, #ff7f16)",
            color: "var(--app-accent, #ff7f16)"
          },
          onClick: () => o({ id: "", name: "", system: "", user: "" })
        }, "＋ 新建模板")
      )
    )
  );
  return v ? e.createElement(v, {
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
  }, P) : P;
}
function oc(t) {
  const {
    R: e,
    busy: n,
    result: a,
    error: r,
    mode: s,
    onRun: o,
    onApply: d,
    onCancel: i,
    onRerun: f,
    disabled: g,
    children: k,
    open: b,
    onOpenChange: v,
    popRef: y,
    panelRef: u
  } = t, N = Ve().Popover, P = e.createElement("button", {
    type: "button",
    disabled: g,
    key: "qm-analysis-trigger",
    ref: y,
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
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      v(!b);
    }
  }, n ? "分析中…" : "查看分析");
  if (!N)
    return e.createElement(
      "div",
      null,
      P,
      a && b ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((a.per_question || []).map((I) => I.reasoning).join(`

`))) : null
    );
  const x = !!(a && (a.per_question || []).length), T = (I, me, J) => e.createElement("button", {
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
    onClick: me
  }, I), E = e.createElement(
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
    r ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, r) : null,
    a ? e.createElement(
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
        }, `${a.model_id || "默认模型"} · ${a.elapsed || 0}s`),
        // Only the answered, non-running state offers the two actions.
        x && !n ? e.createElement("button", {
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
              (f || o)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        x && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: x ? 6 : "auto",
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
            d(), v(!1);
          }
        }, "套用推荐") : null
      ),
      (a.per_question || []).map((I) => e.createElement(
        "div",
        { key: I.index, style: { marginBottom: 14 } },
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
          }, I.title),
          I.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + I.choice) : null,
          typeof I.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(I.confidence <= 1 ? I.confidence * 100 : I.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: El(I.reasoning || "") }
        })
      ))
    ) : n || r ? null : e.createElement(
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
      T("开始分析", () => {
        try {
          o();
        } catch {
        }
      })
    )
  ), $ = e.createElement("div", {
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
  }, k), S = e.createElement(
    "div",
    {
      key: "qm-analysis-panel",
      ref: u,
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
      onMouseDown: (I) => {
        I && I.stopPropagation && I.stopPropagation();
      },
      onClick: (I) => {
        I && I.stopPropagation && I.stopPropagation();
      },
      onKeyDown: (I) => {
        I && I.stopPropagation && I.stopPropagation();
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
    E,
    $
  );
  return [P, b ? S : null];
}
function ic(t) {
  const e = ze().React, n = Ve(), { Input: a, Button: r } = n, s = a.TextArea, o = t.data || {}, d = Cl(o), i = Tl(o), f = zl(o), g = Il(f), k = g ? "" : f, b = d.questions || [], v = d.title || "问卷", y = Qt(i), [u, _] = e.useState(
    () => !!(y && y.answered) || !!k || g
  ), [N, P] = e.useState(""), [x, T] = e.useState(() => {
    const c = Rt(i);
    return c && c.request_id ? c.request_id : y && typeof y.reqId == "string" ? y.reqId : "";
  }), [E, $] = e.useState(
    () => y && typeof y.visStep == "number" && y.visStep >= 0 ? y.visStep : 0
  ), [S, M] = e.useState(
    () => y && typeof y.slowAt == "number" ? y.slowAt : 0
  ), [I, me] = e.useState(
    () => y && typeof y.slowStep == "number" ? y.slowStep : -1
  ), [J, Y] = e.useState(
    () => !!(y && y.slowFired === !0)
  ), [H, Ie] = e.useState(() => {
    const c = {};
    b.forEach((h, m) => {
      c[`q${m}`] = { type: le(h), value: le(h) === "multi" ? [] : "", other: "" };
    });
    const p = y && y.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((h) => {
      c[h] && (c[h] = { ...c[h], ...p[h] });
    }), c;
  }), [Ae, te] = e.useState(
    () => y && typeof y.finalOther == "string" ? y.finalOther : ""
  ), [D, O] = e.useState(!1), [R, ke] = e.useState(
    () => y && typeof y.releasedNote == "string" ? y.releasedNote : ""
  ), [Z, ce] = e.useState(
    () => y && typeof y.localResult == "string" ? y.localResult : ""
  ), [Q, V] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(y && y.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(k || "")
  ), [qe, ne] = e.useState(
    () => (y && typeof y.skipReason == "string" ? y.skipReason : "") || Al(k || "")
  ), [ae, Ee] = e.useState(
    () => y && Array.isArray(y.finalOtherAtt) ? y.finalOtherAtt : []
  ), [Oe, Xe] = e.useState(
    () => !!(y && y.expanded)
  ), [Nt, ut] = e.useState(!1), ta = e.useRef(0), [Se, uo] = e.useState(
    () => y && typeof y.deadReason == "string" ? y.deadReason : ""
  ), [Ye, Ct] = e.useState(
    () => y && typeof y.gateBlocked == "string" ? y.gateBlocked : ""
  ), [ft, na] = e.useState(
    () => y && typeof y.submittedAt == "number" ? y.submittedAt : 0
  ), [aa, ra] = e.useState(
    () => !!(y && y.pastSoft === !0)
  ), [Tt, on] = e.useState(
    () => !!(y && y.waitRetired === !0)
  ), zt = e.useRef(
    !!(y && typeof y.submittedAt == "number" && y.submittedAt > 0 && Date.now() - y.submittedAt < Za * 1e3)
  ), Re = e.useRef(!1), ln = e.useRef(!!(y && y.pastSoft === !0)), [sa, fo] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), go = e.useRef(sa), Er = (c) => {
    go.current = c, fo(c);
  }, ue = (c, p) => {
    const h = sa[c];
    return h ?? p;
  };
  Vs = !!ue("fallback_title", !0);
  const Sr = Math.max(30, Number(ue("wait_hint_sec", Za)) || Za), ho = "manual", [ee, cn] = e.useState(ho), [_r, oa] = e.useState(""), [Vc, bo] = e.useState(!1), [ia, la] = e.useState(!1), [ca, da] = e.useState(!1), [yo, xo] = e.useState([]), [Nr, pa] = e.useState(!1), [dn, gt] = e.useState(null), [ko, et] = e.useState(""), [It, ma] = e.useState(!1), ua = e.useRef(null), fa = e.useRef(null), Cr = e.useRef(0);
  e.useEffect(() => {
    It && (Cr.current = Date.now());
  }, [It]), e.useEffect(() => {
    if (!It) return;
    const c = (h) => {
      if (Date.now() - Cr.current < 350) return;
      const m = h && h.target;
      ua.current && m && ua.current.contains(m) || fa.current && m && fa.current.contains(m) || ma(!1);
    }, p = (h) => {
      h && h.key === "Escape" && ma(!1);
    };
    return document.addEventListener("mousedown", c), document.addEventListener("keydown", p), () => {
      document.removeEventListener("mousedown", c), document.removeEventListener("keydown", p);
    };
  }, [It]);
  const [pn, Pe] = e.useState(!1), [mn, ht] = e.useState(!1), bt = e.useRef(null), ga = e.useRef(null), ha = e.useRef(null);
  e.useEffect(() => {
    if (!pn && !mn) return;
    const c = (p) => {
      const h = p && p.target;
      bt.current && h && bt.current.contains(h) || ga.current && h && ga.current.contains(h) || (Pe(!1), ht(!1));
    };
    return document.addEventListener("mousedown", c), () => document.removeEventListener("mousedown", c);
  }, [pn, mn]);
  const [ba, yt] = e.useState(!1), ya = e.useRef(null), xa = e.useRef(null);
  e.useEffect(() => {
    if (!ba) return;
    const c = (p) => {
      const h = p && p.target;
      ya.current && h && ya.current.contains(h) || xa.current && h && xa.current.contains(h) || yt(!1);
    };
    return document.addEventListener("mousedown", c), () => document.removeEventListener("mousedown", c);
  }, [ba]);
  const [vo, wo] = e.useState(!1), [qo, Eo] = e.useState("paid"), Je = e.useRef({}), Fe = e.useRef({}), xt = e.useRef(0), At = e.useRef(null), [So, kt] = e.useState(0), [ka, va] = e.useState([]), [Ze, un] = e.useState(""), We = e.useRef(Ze);
  We.current = Ze;
  const [wa, Qe] = e.useState(!1), [_o, Tr] = e.useState(!1), [No, qa] = e.useState(null);
  e.useEffect(() => {
    if (!wa) return;
    const c = (p) => {
      const h = p && p.target;
      bt.current && h && bt.current.contains(h) || ha.current && h && ha.current.contains(h) || Qe(!1);
    };
    return document.addEventListener("mousedown", c), () => document.removeEventListener("mousedown", c);
  }, [wa]);
  const [Ea, Ke] = e.useState(!1);
  e.useEffect(() => {
    if (!Ea) return;
    const c = (p) => {
      const h = bt.current;
      h && p && p.target && h.contains(p.target) || Ke(!1);
    };
    return document.addEventListener("mousedown", c), () => document.removeEventListener("mousedown", c);
  }, [Ea]);
  const [Sa, He] = e.useState(!1), fn = e.useRef(null), zr = e.useRef(null);
  e.useEffect(() => {
    if (!Sa) return;
    const c = (p) => {
      const h = zr.current;
      if (h && p && p.target && h.contains(p.target)) return;
      const m = p && p.target;
      m && m.closest && m.closest("[data-qm-release-lock]") || He(!1);
    };
    return document.addEventListener("mousedown", c), () => document.removeEventListener("mousedown", c);
  }, [Sa]);
  const [Me, Ir] = e.useState(
    () => !!(y && y.autoPaused)
  ), Co = e.useRef(Me);
  Co.current = Me;
  const vt = e.useRef(!1), _a = e.useRef(0), gn = e.useRef({}), [To, zo] = e.useState(0), Ot = e.useRef(/* @__PURE__ */ new Set()), $t = (c) => {
    c && Ot.current.add(c);
  }, hn = e.useRef({}), [Io, bn] = e.useState(0), tt = e.useRef({}), [Pt, Ao] = e.useState(!1), Oo = e.useRef(!1);
  Oo.current = Pt, e.useRef(!1);
  const $o = async () => {
    try {
      const c = await nn(
        "",
        !0,
        ie(i),
        Wt()
      );
      if (!c || !c.config) return;
      const p = c.config;
      Er(p), p.mode !== void 0 && cn(Kt(p.mode)), typeof p.model_id == "string" && p.model_id && oa(p.model_id), typeof p.with_context == "boolean" && la(p.with_context), typeof p.parallel == "boolean" && da(p.parallel), kt((h) => h + 1);
    } catch {
    }
  }, Ar = e.useRef(!1), yn = (c) => {
    if (c.mode !== void 0) {
      cn(c.mode), Qa(
        { mode: c.mode },
        ie(i),
        Wt()
      );
      try {
        localStorage.setItem(ks, ao + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    c.modelId !== void 0 && (p.model_id = c.modelId), c.withContext !== void 0 && (p.with_context = c.withContext), c.parallel !== void 0 && (p.parallel = c.parallel), Object.keys(p).length && (c.modelId !== void 0 && oa(c.modelId), c.withContext !== void 0 && la(c.withContext), c.parallel !== void 0 && da(c.parallel), Qa(p, ie(i), Wt()));
  }, Or = (c) => {
    !c || c === Ze || (un(c), We.current = c, ot(i, { templateId: c }), Qa(
      { template_id: c },
      ie(i),
      Wt()
    ), gt(null), Je.current = {}, Fe.current = {}, kt((p) => p + 1));
  }, Po = async (c) => {
    const p = await Js({
      id: c.id || "",
      name: c.name || "",
      system: c.system || "",
      user: c.user || ""
    });
    if (!p.ok) {
      F("error", p.error || "保存失败");
      return;
    }
    va(p.items || []), qa(null), F("success", "模板已保存");
  }, Mo = async (c) => {
    const p = await Zs(c);
    if (!p.ok) {
      F("warning", p.error || "删除失败");
      return;
    }
    va(p.items || []);
    const h = (p.items || []).map((m) => m.id);
    if (h.indexOf(We.current) === -1) {
      const m = h[0] || "";
      un(m), We.current = m, ot(i, { templateId: m });
    }
    F("success", "模板已删除");
  };
  e.useEffect(() => {
    if (u) return;
    const c = (p) => {
      try {
        String(p && p.key || "") === ks && $o();
      } catch {
      }
    };
    return window.addEventListener("storage", c), () => window.removeEventListener("storage", c);
  }, [u, i]), e.useEffect(() => {
    if (u) return;
    let c = !0;
    return gl(), (async () => {
      const [p, h, m, w] = await Promise.all([
        Qs(),
        hl(),
        kr(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        nn(
          "",
          !0,
          ie(i),
          Wt()
        )
      ]);
      if (!c) return;
      if (xo(p), va(m.items), w && w.config) {
        const C = w.config;
        Er(C), C.mode !== void 0 && cn(Kt(C.mode)), typeof C.model_id == "string" && C.model_id && oa(C.model_id), typeof C.with_context == "boolean" && la(C.with_context), typeof C.parallel == "boolean" && da(C.parallel), typeof C.template_id == "string" && C.template_id && (un(C.template_id), We.current = C.template_id);
      }
      const z = m.items.map((C) => C.id);
      if (!We.current || z.indexOf(We.current) === -1) {
        const C = m.defaultId || z[0] || "";
        C && (un(C), We.current = C);
      }
      if (w && w.config) {
        const C = w.config;
        bo(C.__follow_active__ === !0);
      }
      Ar.current = !0, kt((C) => C + 1);
    })(), () => {
      c = !1;
    };
  }, [i]), e.useEffect(() => {
    xt.current = E;
  }, [E]);
  const Na = async (c) => {
    if (Nr) return;
    const p = E;
    pa(!0), et("");
    const h = typeof AbortController < "u" ? new AbortController() : null;
    At.current = h;
    try {
      const m = await fetch(L("/question-modal/analyze"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({
          request_id: x,
          tool_call_id: i,
          session_id: ie(i),
          title: v,
          questions: b,
          model_id: _r,
          mode: c,
          with_context: ia,
          parallel: ca,
          question_index: p,
          answers: H,
          template_id: We.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(ue("model_timeout_sec", 120)) || 120
        }),
        signal: h ? h.signal : void 0
      }), w = await m.json().catch(() => ({})), z = w && w.analysis || null, C = z && z.error || w && w.error || "";
      w && w.cancelled || z && z.cancelled ? et("已终止分析。") : !m.ok || !w || w.ok === !1 || z && z.ok === !1 ? et(C || "分析失败（服务返回 " + m.status + "）") : z && (Je.current[p] = z, Fe.current[p] = !0, xt.current === p && gt(z), F("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (m) {
      At.current === h && h && h.signal.aborted || m && m.name === "AbortError" ? et("已终止分析。") : et("分析请求失败：" + (m && m.message ? m.message : m));
    } finally {
      At.current === h && (At.current = null), pa(!1), tt.current[p] = !0, bn((m) => m + 1);
    }
  }, Bo = () => {
    const c = E;
    delete Je.current[c], gt(null), et(""), Na("manual");
  }, wt = (c) => {
    var h;
    const p = c !== void 0 ? c : xt.current;
    try {
      fetch(L("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: x,
          question_index: p
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      On(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (h = At.current) == null || h.abort();
    } catch {
    }
    pa(!1);
  }, Lo = () => {
    wt(), et("已终止分析。");
  }, jo = () => {
    Me ? (hn.current = {}, tt.current = {}, Fe.current = {}, vt.current = !1, Ir(!1), kt((c) => c + 1), F("info", "已恢复自动答题")) : (wt(), Ir(!0), F("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (u) return;
    const c = Je.current[E];
    gt(c || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + E;
    let h = !0;
    return fetch(L("/question-modal/analysis") + p, { headers: j() }).then((m) => m.ok ? m.json() : null).then((m) => {
      !h || !m || !m.found || !m.analysis || (Je.current[E] = m.analysis, xt.current === E && gt(m.analysis));
    }).catch(() => {
    }), () => {
      h = !1;
    };
  }, [i, E]), e.useEffect(() => {
    u || Ar.current && ee === "ai" && Pt && (!$n(d) || !b.length || Fe.current[E] || D || (Fe.current[E] = !0, Na("auto")));
  }, [
    u,
    ee,
    i,
    So,
    ia,
    ca,
    b,
    E,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    Pt
  ]);
  const Do = () => {
    const c = dn && dn.per_question || [];
    if (!c.length) return;
    if (!c.some((h) => h.type === "multi" ? String(h.choice || "").split(/[、,，]/).map((m) => m.trim()).filter(Boolean).length > 0 : String(h.choice || "").trim().length > 0)) {
      F("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Ie((h) => {
      const m = { ...h };
      return c.forEach((w) => {
        const z = `q${w.index}`;
        $t(z);
        const C = m[z] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const se = String(w.choice || "").split(/[、,，]/).map((X) => X.trim()).filter(Boolean);
          m[z] = { ...C, value: se };
        } else
          m[z] = { ...C, value: w.choice || C.value };
      }), m;
    }), F("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, nt = (c, p, h = !1) => {
    wt(), uo(c), V(!0), ce(p), ut(!1), _(!0), he(i), h && ot(i, { backendReleased: !0 });
  }, Fo = async (c, p) => {
    const h = await Ra(i, ie(i));
    return h.ok ? (nt(c, p, h.released), !0) : (ut(!0), Ta(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const c = (p = Qt(i)) == null ? void 0 : p.answers;
    ot(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: x,
      visStep: E,
      answers: Xa(H, c, Ot.current),
      finalOther: Ae,
      finalOtherAtt: ae,
      answered: u,
      skippedAll: Q,
      expanded: Oe,
      localResult: Z,
      submittedAt: ft,
      skipReason: qe,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: aa,
      waitRetired: Tt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: S,
      slowStep: I,
      slowFired: J,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: Se,
      gateBlocked: Ye,
      releasedNote: R,
      autoPaused: Me,
      templateId: Ze
    });
  }, [
    i,
    x,
    E,
    H,
    Ae,
    ae,
    u,
    Q,
    Oe,
    Z,
    ft,
    qe,
    aa,
    Tt,
    S,
    I,
    J,
    Se,
    Me,
    Ze,
    Ye,
    R
  ]), e.useEffect(() => {
    if (!u || !ft || Tt || !zt.current) return;
    let c = 0, p = !1, h = us(i);
    const m = () => {
      if (p) return;
      const w = Math.floor((Date.now() - ft) / 1e3);
      if (w >= Sr) {
        Re.current = !0, on(!0);
        return;
      }
      if (!Re.current) {
        const z = us(i);
        z >= 0 && (h < 0 ? h = z : z - h >= ol && (Re.current = !0));
      }
      if (!Re.current && w >= rl && !ln.current && (ln.current = !0, ra(!0)), Re.current) {
        c = setTimeout(
          () => {
            p || on(!0);
          },
          Math.max(1e3, (Sr - w) * 1e3)
        );
        return;
      }
      c = setTimeout(() => {
        p || fs(m);
      }, Hs);
    };
    return fs(m), () => {
      p = !0, clearTimeout(c);
    };
  }, [u, ft, Tt]);
  const [Ca, Ta] = e.useState(!1), [za, $r] = e.useState(""), Pr = (c, p, h) => {
    c.length && (p === "final" ? Ee((m) => m.concat(c)) : Ie((m) => {
      const w = h || `q${E}`;
      $t(w);
      const z = m[w] || { type: "text", value: "", other: "" };
      return { ...m, [w]: { ...z, attachments: (z.attachments || []).concat(c) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const c = (m, w, z, C) => {
      Pr(m, w, z), C && C.length ? $r(C.join("；")) : $r("");
    }, p = (m) => Ta(m);
    Bn.set(i, c), Ln.set(i, p);
    const h = Ll(i);
    return h.length && h.forEach((m) => Pr([m.att], m.target, m.key)), Ta(Jn > 0), () => {
      Bn.get(i) === c && Bn.delete(i), Ln.get(i) === p && Ln.delete(i);
    };
  }, [i, E]);
  const Ia = (c, p) => Ml(i, c, p), Aa = (c, p, h) => {
    const m = jl(c);
    if (m.length) {
      try {
        c.preventDefault();
      } catch {
      }
      Rs(m, i, p, h);
    }
  };
  e.useEffect(() => {
    if (!g || N) return;
    let c = !0;
    return Ut(i).then((p) => {
      if (!c || !p) return;
      p.kind === "skipped" && !p.answers && V(!0);
      const h = String(p.skip_reason || "").trim();
      h && ne((m) => m || h), P(Ht(b, p));
    }), () => {
      c = !1;
    };
  }, [g, i, N]), e.useEffect(() => {
    if (u || !i || k) return;
    let c = !0;
    return Ut(i).then((p) => {
      if (!c || !p) return;
      p.kind === "skipped" && !p.answers && V(!0);
      const h = String(p.skip_reason || "").trim();
      h && ne((m) => m || h), P((m) => m || Ht(b, p)), ce(Ht(b, p)), _(!0), he(i);
    }), () => {
      c = !1;
    };
  }, [i, u, k]), e.useEffect(() => {
    if (u) return;
    let c = !0, p = 0, h = 0, m = 0, w = !1, z = !1, C = 0, se = 0;
    ta.current || (ta.current = Date.now());
    let X = !!Rt(i), Ne = !1;
    const ve = (B) => {
      !c || !B || !B.request_id || (X = !0, h = 0, m = 0, w = !1, T(B.request_id), ut(!1), C && (clearTimeout(C), C = 0), Zl(
        i,
        B.request_id,
        B.session_id || sn(),
        B.agent_id
      ));
    }, de = (B) => {
      c && (C && (clearTimeout(C), C = 0), se && (clearTimeout(se), se = 0), Fo(
        B,
        B === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, jt = Rt(i), st = async () => {
      if (!jt) return !1;
      const B = await Vl(jt.request_id);
      if (!c) return !0;
      if (B.kind === "found") {
        const fe = B.data;
        return fe.tool_call_id && i && fe.tool_call_id !== i ? (he(i), !1) : (ve(fe), !0);
      }
      return B.kind === "orphan" ? (de("orphan"), !0) : (B.kind === "absent" && he(i), !1);
    }, Ce = (B = !1) => {
      if (c) {
        if (p += 1, B || (h += 1, m || (m = Date.now())), B) {
          if (!Ne) {
            Ne = !0, Ut(i).then((pe) => {
              if (c) {
                if (pe) {
                  pe.kind === "skipped" && !pe.answers && V(!0);
                  const Dt = String(pe.skip_reason || "").trim();
                  Dt && ne((Ha) => Ha || Dt), P(Ht(b, pe)), ce(Ht(b, pe)), _(!0), he(i);
                  return;
                }
                Ce(!0);
              }
            });
            return;
          }
          if (X) {
            de("gone");
            return;
          }
          const fe = Date.now() - (ta.current || Date.now());
          if (p >= 12 && fe >= Kl) {
            de("gone");
            return;
          }
        }
        if (h >= eo) {
          if (Date.now() - (m || Date.now()) >= no) {
            if (w = !0, !z) {
              z = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !c || !w) return;
                    w = !1, h = 0, m = 0, p = 0, oe();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          C = setTimeout(oe, to);
          return;
        }
        C = setTimeout(oe, p < Ul ? Hl : 5e3);
      }
    }, $e = () => {
      Ol(i, ie(i)).then((B) => {
        if (c) {
          if (B.kind === "found") {
            ve(B.data);
            return;
          }
          if (B.kind === "orphan") {
            de("orphan");
            return;
          }
          if (B.kind === "error") {
            Ce(!1);
            return;
          }
          Fl(ie(i)).then((fe) => {
            if (c) {
              if (fe) {
                if (fe.tool_call_id && i && fe.tool_call_id !== i) {
                  Ut(i).then((pe) => {
                    if (c) {
                      if (pe) {
                        _(!0), he(i);
                        return;
                      }
                      Ce(!0);
                    }
                  });
                  return;
                }
                ve(fe);
                return;
              }
              Ut(i).then((pe) => {
                if (c) {
                  if (pe) {
                    pe.kind === "skipped" && !pe.answers && V(!0);
                    const Dt = String(pe.skip_reason || "").trim();
                    Dt && ne((Ha) => Ha || Dt), _(!0), he(i);
                    return;
                  }
                  Ce(!0);
                }
              });
            }
          });
        }
      });
    }, oe = () => {
      if (c) {
        if (!jt) {
          $e();
          return;
        }
        st().then((B) => {
          !c || B || $e();
        });
      }
    };
    return se = setTimeout(() => {
      c && ut(!0);
    }, Wl), oe(), () => {
      c = !1, C && clearTimeout(C), se && clearTimeout(se);
    };
  }, [u, i]);
  const Mr = async () => {
    O(!0);
    try {
      const c = ie(i);
      let p = await Ra(i, c);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && c) {
        const m = await xs(c);
        m.ok && m.released ? p = m : m.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const m = p.reason === "host-stop";
        nt(
          p.reason === "orphan" ? "orphan" : "",
          p.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : m ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), F(
          "info",
          m ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        nt(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), F("info", "本次问卷已失效，已关闭");
    } catch (c) {
      F("error", "释放失败: " + (c && c.message ? c.message : c));
    } finally {
      O(!1);
    }
  }, Br = async () => {
    O(!0);
    try {
      const c = ie(i);
      let p = await Ra(i, c);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && c) {
        const m = await xs(c);
        m.ok && m.released ? p = m : m.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        ke(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), F("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const m = p.reason === "host-stop";
        ke(m ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), F("info", m ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        ke("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), F("info", "后端已无此阻塞，无需释放");
    } catch (c) {
      F("error", "释放失败: " + (c && c.message ? c.message : c));
    } finally {
      O(!1);
    }
  }, Wo = e.createElement(
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
  ), xn = (c, p) => e.createElement("button", {
    type: "button",
    key: p,
    className: "qm-release-lock",
    "data-qm-release-lock": "true",
    title: "释放阻塞（若发新消息报 A task is already running，点此释放）",
    "aria-label": "释放阻塞",
    disabled: D,
    // US-010: 二次确认——点击不再直接执行，先弹确认气泡；确定后由
    // releaseConfirmPanel 执行原 onClick（rescue / releaseBlocked 零改动）。
    // 打开时同步收起全部 header 弹层（互斥组）。
    onClick: () => {
      fn.current = c, Pe(!1), ht(!1), yt(!1), Qe(!1), Ke(!1), He(!0);
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
      cursor: D ? "default" : "pointer",
      border: "1px solid var(--app-warning-border, rgba(250,173,20,0.45))",
      background: "transparent",
      color: "var(--app-warning-text, #d46b08)"
    }
  }, Wo), Ko = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认释放阻塞",
      ref: zr,
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
          He(!1), fn.current = null;
        }
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: D,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: D ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: D ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          const c = fn.current;
          He(!1), fn.current = null, c && c();
        }
      }, "确定")
    )
  ), kn = Sa ? Ko : null, vn = Ge(b, H), at = vn.length, Be = E >= at, re = Be ? -1 : vn[E], Mt = Be ? at : E;
  e.useEffect(() => {
    if (Kt(ue("mode", "manual")) !== "manual") return;
    let p = String(ue("notify_channel_pc", "") || "");
    if (!p) {
      const m = String(ue("notify_channel", "off") || "off"), w = !!ue("notify_manual_mode", !1);
      p = m === "browser" || (m === "off" || !m) && w ? "browser" : m;
    }
    if (p !== "browser" || u || Q || Se || !$n(d) || !b.length) return;
    const h = Ge(b, H).filter((m) => !St(H[`q${m}`])).length;
    al(i, v, h);
  }, [sa, u, Q, Se, Mt]);
  const wn = Math.max(0, Number(ue("slow_question_sec", sl)) || 0) * 1e3, Ho = Math.round(wn / 1e3);
  e.useEffect(() => {
    if (u || Q || Se || wn <= 0) return;
    if (I !== Mt) {
      me(Mt), M(Date.now()), Y(!1);
      return;
    }
    if (!S) {
      M(Date.now());
      return;
    }
    if (J) return;
    const c = S + wn - Date.now();
    if (c <= 0) {
      Y(!0);
      return;
    }
    let p = !1;
    const h = setTimeout(() => {
      p || Y(!0);
    }, c);
    return () => {
      p = !0, clearTimeout(h);
    };
  }, [u, Q, Se, Mt, I, S, J, wn]);
  const _e = re >= 0 ? b[re] : null, qt = `q${re}`, G = re >= 0 && H[qt] || { type: le(_e), value: le(_e) === "multi" ? [] : "", other: "" }, Et = (c) => {
    var m;
    Ye && Ct(""), re >= 0 && $t(`q${re}`);
    const p = { ...H, [qt]: { ...c, skipped: !1 } }, h = Ge(b, p);
    b.forEach((w, z) => {
      h.indexOf(z) === -1 && delete p[`q${z}`];
    }), ot(i, {
      answers: Xa(p, (m = Qt(i)) == null ? void 0 : m.answers, Ot.current)
    }), Ie(p);
  };
  e.useEffect(() => {
    E > at && $(at);
  }, [at, E]);
  const Oa = async (c, p) => {
    const h = await fetch(L(c), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(p)
    }), m = await h.json().catch(() => ({}));
    if (!h.ok) {
      const w = new Error(m && m.detail || "HTTP " + h.status);
      throw w.status = h.status, w;
    }
    return m;
  }, $a = () => {
    var c;
    return Yl(Xa(
      tc(b, H),
      (c = Qt(i)) == null ? void 0 : c.answers,
      Ot.current
    ));
  }, Uo = () => !!ue("gate_unsaved", !0), Go = (c) => ro(c), Lr = (c, p) => {
    if (!Uo()) return [];
    const h = new Set(Ge(b, c)), m = (z) => h.has(z) && !St(c[`q${z}`]) && !Go(b[z]), w = [];
    return typeof p == "number" ? (m(p) && w.push(p + 1), w) : (b.forEach((z, C) => {
      m(C) && w.push(C + 1);
    }), w);
  }, jr = (c, p, h) => {
    const m = "第 " + c.join("、") + " 题", w = h === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    Ct("⛔ " + m + "尚未选择。" + w);
    const z = Ge(b, p).length;
    Oa("/question-modal/gate-block", {
      request_id: x,
      tool_call_id: i,
      session_id: ie(i),
      missing: c,
      answered: z - c.length,
      total: z,
      bundle: ds
    }).catch(() => {
    });
  }, Pa = async (c, p = !1) => {
    if (!x)
      return F("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const h = $a();
    if (!p) {
      const m = Lr(h);
      if (m.length)
        return jr(m, h, "提交"), "blocked";
      Ct("");
    }
    O(!0);
    try {
      const m = await Oa("/question-modal/answer", {
        request_id: x,
        session_id: ie(i),
        answers: h,
        other: Ae,
        attachments: ae
      });
      return m && m.orphan ? (fetch(
        L("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ie(i)),
        { method: "POST", headers: j() }
      ).catch(() => {
      }), nt(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), F("info", "本次问卷已失效，已关闭"), "sent") : (he(i), ce(Xl(b, h, Ae, ae)), na(Date.now()), ra(!1), on(!1), Re.current = !1, ln.current = !1, zt.current = !0, _(!0), "sent");
    } catch (m) {
      return m && m.status === 404 ? (nt(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), F("info", "本次问卷已失效，已关闭"), "blocked") : (F("error", "提交失败: " + m.message), p ? (vt.current = !1, _a.current += 1, _a.current >= Ua && F(
        "warning",
        "自动提交连续失败 " + Ua + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), bn((w) => w + 1), "not-ready") : "blocked");
    } finally {
      O(!1);
    }
  }, Jo = () => {
    re < 0 || (Ye && Ct(""), wt(xt.current), Fe.current[xt.current] = !0, $t(`q${re}`), Ie((c) => {
      const p = { ...c };
      p[`q${re}`] = {
        type: (c[`q${re}`] || {}).type || le(_e),
        value: ((c[`q${re}`] || {}).type || le(_e)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const h = Ge(b, p);
      return b.forEach((m, w) => {
        h.indexOf(w) === -1 && delete p[`q${w}`];
      }), p;
    }), $((c) => c + 1));
  }, Zo = () => {
    if (Be) {
      Pa();
      return;
    }
    const c = $a(), p = Lr(c, re);
    if (p.length) {
      jr(p, c, "下一步");
      return;
    }
    Ye && Ct(""), $((h) => h + 1);
  }, Qo = async () => {
    if (!x) {
      F("warning", "问卷尚未就绪，请稍候");
      return;
    }
    wt(), O(!0);
    try {
      const c = await Oa("/question-modal/skip", {
        request_id: x,
        session_id: ie(i)
      });
      if (c && c.orphan) {
        nt(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), F("info", "本次问卷已失效，已关闭");
        return;
      }
      F("info", "已跳过问卷"), he(i), V(!0), ne("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), ce("用户跳过了本次问卷。"), na(Date.now()), ra(!1), on(!1), Re.current = !1, ln.current = !1, zt.current = !0, _(!0);
    } catch (c) {
      if (c && c.status === 404) {
        nt(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), F("info", "本次问卷已失效，已关闭");
        return;
      }
      F("error", "跳过失败: " + c.message);
    } finally {
      O(!1);
    }
  };
  e.useEffect(() => {
    if (u || ee !== "ai" && ee !== "recommend" || Me || (ee === "recommend" || ee === "ai") && !Pt || !$n(d) || !b.length || D) return;
    if (Be) {
      if (vt.current || _a.current >= Ua) return;
      const X = $a();
      if (!vn.every(
        (ve, de) => !!tt.current[de] || St(X[`q${ve}`])
      ) || !x) return;
      vt.current = !0, Pa(void 0, !0).then((ve) => {
        ve === "not-ready" && (vt.current = !1);
      });
      return;
    }
    const c = E;
    if (hn.current[c] || ee === "ai" && !tt.current[c]) return;
    const p = vn[c], h = b[p], m = le(h), w = gs(h), z = hs(Je.current[c], p);
    if (ee === "ai" && !tt.current[c]) return;
    hn.current[c] = !0;
    const C = w.length ? w.join("、") : z, se = !!C;
    $t(`q${p}`), se || (gn.current[p] = !0, zo((X) => X + 1), F("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), Ie((X) => {
      const Ne = { ...X }, ve = `q${p}`, de = Ne[ve] || { type: m, value: m === "multi" ? [] : "", other: "" };
      if (!se)
        Ne[ve] = {
          ...de,
          type: m,
          value: m === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (m === "multi") {
        const st = h.options || [], Ce = (oe) => String(oe).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), $e = C.split(/[、,，]/).map((oe) => Ce(oe)).filter(Boolean).map((oe) => {
          const B = st.find((fe) => Te(fe) === oe || De(fe) === oe);
          return B ? Te(B) : oe;
        });
        Ne[ve] = {
          ...de,
          type: m,
          value: $e,
          other: $e.length === 1 && $e[0] === ye ? de.other : "",
          attachments: $e.length === 1 && $e[0] === ye ? de.attachments : []
        };
      } else if (m === "single") {
        const st = h.options || [], Ce = (B) => String(B).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), $e = st.find((B) => Te(B) === C || De(B) === C) || st.find((B) => Te(B) === Ce(C) || De(B) === Ce(C)), oe = $e ? Te($e) : C;
        Ne[ve] = {
          ...de,
          type: m,
          value: oe,
          other: String(oe) === ye ? de.other : "",
          attachments: String(oe) === ye ? de.attachments : []
        };
      } else
        Ne[ve] = { ...de, type: m, value: C };
      const jt = Ge(b, Ne);
      return b.forEach((st, Ce) => {
        jt.indexOf(Ce) === -1 && delete Ne[`q${Ce}`];
      }), Ne;
    }), Fe.current[c] = !0, tt.current[c] = !0, $((X) => X + 1), bn((X) => X + 1);
  }, [
    u,
    ee,
    Me,
    D,
    i,
    E,
    Io,
    at,
    d,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    x,
    Pt
  ]);
  const Bt = e.useRef(!1), rt = e.useRef(0), Lt = e.useRef(!1), Ue = e.useRef({});
  e.useEffect(() => {
    if (u || !i) return;
    let c = !0;
    const p = (m) => {
      if (!(!c || !m)) {
        Bt.current = !0, Lt.current = !0;
        try {
          if (Array.isArray(m.questions) && m.questions.length && (!b || b.length), m.answers && typeof m.answers == "object" && (Ie((z) => {
            const C = { ...z };
            return Object.keys(m.answers).forEach((se) => {
              const X = m.answers[se];
              !X || typeof X != "object" || Ot.current.has(se) || (C[se] = {
                ...C[se] || { type: "single", value: "", other: "" },
                ...X
              });
            }), C;
          }), ot(i, { answers: m.answers })), typeof m.cursor == "number" && m.cursor >= 0 && $(m.cursor), typeof m.mode == "string" && m.mode) {
            const z = Kt(m.mode);
            cn((C) => C === z ? C : z);
          }
          m.per_question && typeof m.per_question == "object" && Object.keys(m.per_question).forEach((z) => {
            const C = parseInt(z, 10);
            !isNaN(C) && m.per_question[z] && (Je.current[C] = m.per_question[z]);
          }), m.status === "submitted" && (na((z) => z || Date.now()), m.released && ot(i, { backendReleased: !0 }), _(!0), he(i));
          const w = String(m.skip_reason || "").trim();
          w && ne((z) => z || w), typeof m.mode == "string" && m.mode && (Ue.current.mode = Kt(m.mode)), Object.keys(m.answers || {}).forEach((z) => {
            Ue.current["a:" + z] = JSON.stringify(m.answers[z] || {});
          }), typeof m.cursor == "number" && (Ue.current.cursor = "c:" + m.cursor), Lt.current = !0, bn((z) => z + 1);
        } finally {
          setTimeout(() => {
            Bt.current = !1;
          }, 0);
        }
      }
    };
    bl(i).then((m) => {
      !c || !m || !m.found || !m.state || (rt.current = Math.max(rt.current, m.rev), p(m.state));
    });
    const h = yl(i, {
      onSnapshot: (m, w) => {
        rt.current = Math.max(rt.current, m), w && p(w);
      },
      onChange: (m) => {
        const w = parseInt(m.rev || 0, 10) || 0;
        w && w <= rt.current && m.origin !== Zn() || (rt.current = Math.max(rt.current, w), !(m.origin && m.origin === Zn()) && p(m.state));
      },
      onStatus: (m) => {
        c && Ao((w) => w === !m ? w : !m);
      }
    });
    return () => {
      c = !1, h();
    };
  }, [u, i]), e.useEffect(() => {
    u || !i || Bt.current || Lt.current && Object.keys(H || {}).forEach((c) => {
      const p = JSON.stringify(H[c] || {});
      Ue.current["a:" + c] !== p && (Ue.current["a:" + c] = p, On(
        i,
        "set_answer",
        { key: c, answer: H[c] }
      ));
    });
  }, [u, i, JSON.stringify(H)]), e.useEffect(() => {
    if (u || !i || Bt.current || !Lt.current) return;
    const c = "c:" + E;
    Ue.current.cursor !== c && (Ue.current.cursor = c, On(i, "goto", { cursor: E }));
  }, [u, i, E]), e.useEffect(() => {
    u || !i || Bt.current || Lt.current && Ue.current.mode !== ee && (Ue.current.mode = ee, On(i, "set_mode", { mode: ee }));
  }, [u, i, ee]);
  const qn = {
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
  }, Ma = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Ba = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, En = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, La = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Dr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, ja = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Vo = { display: "flex", flexDirection: "column", gap: 8 }, Da = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, Sn = {
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
  }, Fr = {
    ...Sn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Xo = {
    ...Sn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Fa = {
    ...Sn,
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
  }, Wr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Fa,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Kr = {
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
  }, Yo = { height: 32, fontSize: 13, borderRadius: 8 }, Hr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Ur = (c) => {
    const p = Te(c);
    return G.type === "multi" ? Array.isArray(G.value) && G.value.indexOf(p) !== -1 : G.value === p;
  }, Gr = Ur(ye), Jr = (c) => {
    if (u || D) return;
    const p = Te(c);
    if (G.type === "multi") {
      const h = Array.isArray(G.value) ? G.value.slice() : [], m = h.indexOf(p);
      m === -1 ? h.push(p) : h.splice(m, 1);
      const w = h.length === 1 && h[0] === ye;
      Et({
        ...G,
        value: h,
        other: w ? G.other : "",
        attachments: w ? G.attachments : []
      });
    } else {
      const h = p === ye;
      Et({
        ...G,
        value: p,
        other: h ? G.other : "",
        attachments: h ? G.attachments : []
      });
    }
  }, Ro = !!ue("show_recommend_badge", !0), Zr = ue("badge_position", "left") === "right", ei = ue("badge_style", "rect") === "round", Qr = (c) => c && Ro ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: ei ? { ...Kr, borderRadius: 999 } : Kr
  }, "AI 推荐") : null, ti = !!ue("auto_number_options", !0), ni = !!ue("highlight_recommended", !1), ai = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Vr = (c, p, h, m, w, z) => e.createElement(
    "button",
    {
      key: m,
      type: "button",
      disabled: u || D,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: w && ni ? { ...p ? Wr : Fa, ...ai } : p ? Wr : Fa,
      onClick: h
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Zr ? null : Qr(w),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (z && ti ? z + ". " : "") + c),
    Zr ? Qr(w) : null
  );
  if (!u && !$n(d))
    return e.createElement(
      "div",
      { style: qn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Ma, className: "qm-header" },
        e.createElement(
          "div",
          { style: Ba },
          Ga(e),
          e.createElement("span", { style: En, className: "qm-title" }, v)
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
          Nt ? xn(Mr, "qm-release-lock-prep") : null,
          e.createElement("span", { style: La }, "准备中")
        )
      ),
      e.createElement("div", {
        style: { ...Dr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // US-010: 🔒 二次确认气泡挂卡片根。
      kn
    );
  if (u) {
    const c = () => {
      const h = dl({
        submittedAt: ft,
        deadReason: Se,
        releasedNote: R,
        skippedAll: Q,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: Tt,
        pastSoft: aa,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!zt.current
      });
      return h ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": i,
        "data-qm-phase": h.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: h.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, cl(h.phase)) : null;
    }, p = !!zt.current;
    return Q && !Oe ? e.createElement(
      "div",
      {
        style: {
          ...qn,
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
      qe ? e.createElement("span", {
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
        title: qe
      }, qe) : null,
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
          ...En,
          flex: R || qe ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: v
      }, v),
      R ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, R) : c(),
      e.createElement("button", {
        type: "button",
        style: {
          ...Fr,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Xe(!0)
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
      p ? xn(Br, "qm-release-lock-fold") : null,
      // US-010: 🔒 二次确认气泡挂卡片根（折叠行经 card spread 已有 relative）。
      kn
    ) : e.createElement(
      "div",
      { style: qn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Ma, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Ba },
          Ga(e),
          e.createElement("span", { style: En }, v)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放阻塞」按钮
          // 移除，不留多套并存）；出现条件沿用 showRelease 判定。
          p ? xn(Br, "qm-release-lock-ans") : null,
          e.createElement(
            "span",
            { style: { ...La, color: Se ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
            Se ? "已失效" : Q ? "已跳过" : "已完成"
          )
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      Q && (qe || Se) ? e.createElement(
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
        String(qe || Se || "问卷已失效/跳过")
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
      }, Q ? Z ? Z + `

` + jn(b) : `已跳过本次问卷。

` + jn(b) : Z || N || k || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + jn(b)),
      Q && Oe ? e.createElement(
        "div",
        { style: Da },
        e.createElement("button", {
          type: "button",
          style: Fr,
          onClick: () => Xe(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Da, marginTop: 8, gap: 10 } },
        R ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, R) : c()
      ),
      // US-010: 🔒 二次确认气泡挂卡片根。
      kn
    );
  }
  const Wa = J && I === Mt, Xr = !u && !Be && To >= 0 && gn.current[re] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Yr = Object.keys(gn.current).map((c) => Number(c)).filter((c) => gn.current[c] && Number.isFinite(c)).sort((c, p) => c - p), ri = Be && Yr.length ? e.createElement("div", {
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
  }, "⚠ 第 " + Yr.map((c) => c + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let _n = null;
  if (Be)
    _n = e.createElement(
      "div",
      null,
      e.createElement("div", { style: ja }, "其他意见（可选）"),
      ri,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Ae,
        style: Hr,
        onChange: (c) => te(c.target.value),
        onPaste: (c) => Aa(c, "final", "final")
      }),
      er({
        R: e,
        files: ae,
        disabled: u || D,
        uploading: Ca,
        error: za,
        onPick: () => Ia("final", "final"),
        onRemove: (c) => Ee((p) => p.filter((h, m) => m !== c))
      })
    );
  else if (_e && le(_e) === "text")
    _n = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...ja, fontSize: 13, color: "var(--app-text, inherit)" } }, Hn(_e, re)),
      Xr,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof G.value == "string" ? G.value : "",
        style: Hr,
        onChange: (c) => Et({ ...G, value: c.target.value, other: "" }),
        onPaste: (c) => Aa(c, "q", qt)
      }),
      er({
        R: e,
        files: G.attachments || [],
        disabled: u || D,
        uploading: Ca,
        error: za,
        onPick: () => Ia("q", qt),
        onRemove: (c) => Et({
          ...G,
          attachments: (G.attachments || []).filter((p, h) => h !== c)
        })
      })
    );
  else if (_e) {
    const c = gs(_e), p = hs(dn, re), h = c.length ? c : p ? [p] : c, m = (_e.options || []).map((w, z) => Vr(
      De(w),
      Ur(w),
      () => Jr(w),
      "o" + z,
      Sl(_e, w, h),
      z + 1
    ));
    m.push(Vr("其他", Gr, () => Jr(ye), "other")), Gr && (m.push(e.createElement(a, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: G.other,
      style: { ...Yo, marginTop: 2 },
      onChange: (w) => Et({ ...G, other: w.target.value }),
      onPaste: (w) => Aa(w, "q", qt)
    })), m.push(er({
      R: e,
      files: G.attachments || [],
      disabled: u || D,
      uploading: Ca,
      error: za,
      onPick: () => Ia("q", qt),
      onRemove: (w) => Et({
        ...G,
        attachments: (G.attachments || []).filter((z, C) => C !== w)
      })
    }))), _n = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...ja, fontSize: 13, color: "var(--app-text, inherit)" } }, Hn(_e, re)),
      Xr,
      e.createElement("div", { style: { ...Vo, marginTop: 8 } }, m)
    );
  }
  const Ka = at + 1, si = Be ? Ka + "/" + Ka : E + 1 + "/" + Ka, Rr = (c, p, h, m, w) => e.createElement("button", {
    type: "button",
    title: c,
    "aria-label": c,
    onClick: h,
    style: {
      ...w != null && w.text ? { width: "auto", padding: "0 7px" } : { width: 24, padding: 0 },
      height: 24,
      flex: "none",
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      cursor: "pointer",
      border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
      background: p ? "var(--app-surface-subtle, rgba(127,127,127,0.10))" : "transparent",
      color: "var(--app-text-secondary, inherit)"
    }
  }, m), oi = e.createElement(
    "span",
    {
      style: { display: "inline-flex", alignItems: "center", gap: 3 }
    },
    e.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "更多"),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  ), ii = e.createElement(
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
  ), Nn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 1e4,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, Cn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, Tn = (c, p) => e.createElement(
    "button",
    {
      type: "button",
      key: c,
      className: "qm-hdr-menu-item",
      role: "menuitem",
      onClick: p && p.onClick ? p.onClick : () => {
        Pe(!1);
      },
      disabled: p ? !!p.disabled : !1,
      title: p && p.title ? p.title : void 0,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        textAlign: "left",
        cursor: p && p.disabled ? "default" : "pointer",
        padding: "7px 12px",
        fontSize: 12,
        border: "none",
        background: "transparent",
        color: "var(--app-text, inherit)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 260,
        opacity: p && p.disabled ? 0.5 : 1
      }
    },
    e.createElement("span", {
      style: { overflow: "hidden", textOverflow: "ellipsis" }
    }, c),
    // US-010: 每项右侧淡色「›」提示「可点击进入/执行」（boss 反馈 4）；
    // disabled 项不显示箭头，避免暗示可点。
    !p || !p.disabled ? e.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: "none",
        fontSize: 12,
        lineHeight: 1,
        color: "var(--app-text-tertiary, inherit)"
      }
    }, "›") : null
  ), es = (ka || []).find((c) => c.id === Ze), li = es ? es.name : "默认模板", ci = e.createElement(
    "div",
    { style: Nn, role: "menu", className: "qm-hdr-pop" },
    e.createElement("div", { style: Cn }),
    Tn("选择模板（当前：" + li + "）", {
      disabled: u || D,
      onClick: () => {
        Pe(!1), ht(!1), yt(!1), Ke(!1), He(!1), Qe(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    Tn("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: u || D || Be,
      onClick: () => {
        Pe(!1), Jo();
      }
    }),
    Tn("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: u || D,
      onClick: () => {
        Pe(!1), Pa(void 0, !0);
      }
    }),
    Tn("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: u || D,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        Pe(!1), Ke(!0), He(!1);
      }
    })
  ), di = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定（点面板内部不关闭）。width 固有宽 + maxWidth 视口-44px 防溢出。
      ref: ga,
      role: "dialog",
      "aria-label": "查看上下文",
      className: "qm-hdr-pop",
      style: { ...Nn, width: "300px", maxWidth: "calc(100vw - 44px)", padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: Cn }),
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
  ), pi = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定。width 248px（内容 240+padding 8）+ maxWidth 视口-44px，不溢出。
      ref: ha,
      role: "dialog",
      "aria-label": "选择模板",
      className: "qm-hdr-pop",
      style: { ...Nn, padding: 4, width: "248px", maxWidth: "calc(100vw - 44px)" }
    },
    e.createElement("div", { style: Cn }),
    rc({
      R: e,
      templates: ka,
      value: Ze,
      onSelect: (c) => {
        Or(c), Qe(!1);
      },
      onManage: () => {
        Qe(!1), Tr(!0);
      }
    })
  ), mi = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      className: "qm-hdr-pop",
      style: { ...Nn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: Cn }),
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
        onClick: () => Ke(!1)
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: D,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: D ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: D ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          Ke(!1), Qo();
        }
      }, "确定")
    )
  ), ui = e.createElement(
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
    Rr("更多操作", pn, () => {
      Pe((c) => !c), ht(!1), yt(!1), Qe(!1), Ke(!1), He(!1);
    }, oi, { text: !0 }),
    Rr("查看上下文", mn, () => {
      ht((c) => !c), Pe(!1), yt(!1), Qe(!1), Ke(!1), He(!1);
    }, ii),
    pn ? ci : null,
    // US-012: 上下文气泡与模板选择面板（宽面板）不再挂本触发器小容器，
    // 改挂 qm-actions 行容器直下（见 qm-actions children 末尾）——移动端
    // 防错位/溢出（demo v5 参照系）。更多菜单/跳过确认气泡仍挂本容器。
    Ea ? mi : null
  ), ts = {
    ...Sn,
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
    { style: qn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Ma, className: "qm-header" },
      e.createElement(
        "div",
        { style: Ba },
        Ga(e),
        e.createElement("span", { style: En, className: "qm-title" }, v)
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
        Wa || Nt && !x ? xn(Mr, "qm-release-lock") : null,
        nc({
          R: e,
          providers: yo,
          modelId: _r,
          disabled: u || D,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: vo,
          onOpenChange: wo,
          tab: qo,
          onTabChange: Eo,
          onChange: (c) => {
            yn({ modelId: c }), gt(null), Je.current = {}, Fe.current = {}, kt((p) => p + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        ac({
          R: e,
          mode: ee,
          disabled: u || D,
          open: ba,
          onOpenChange: (c) => {
            yt(c), c && (Pe(!1), ht(!1), Qe(!1), Ke(!1), He(!1));
          },
          popRef: ya,
          panelRef: xa,
          // US-012: 面板独立锚点（面板挂 qm-actions 行容器）
          onChange: (c) => {
            yn({ mode: c }), c === "ai" && (Fe.current = {}), c === "ai" || c === "recommend" ? (hn.current = {}, tt.current = {}, vt.current = !1, kt((p) => p + 1)) : wt();
          }
        }),
        oc({
          R: e,
          busy: Nr,
          result: dn,
          error: ko,
          mode: ee,
          disabled: u || D,
          open: It,
          onOpenChange: ma,
          popRef: ua,
          panelRef: fa,
          // US-013: 触发器/面板双 ref（外部点击关闭）
          onRun: () => {
            Na("manual");
          },
          onRerun: Bo,
          onApply: Do,
          onCancel: Lo,
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
                checked: ia,
                onChange: (c) => yn({ withContext: !!c.target.checked })
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
                checked: ca,
                onChange: (c) => yn({ parallel: !!c.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (ee === "ai" || ee === "recommend") && !u ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: D,
          onClick: jo,
          style: {
            ...ts,
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
        ui,
        // US-012: 宽弹出层（上下文气泡/模板选择面板）上移到 qm-actions 行容器
        // 直下——移动端 qm-actions 换行后触发器小容器横向位置不定，挂行容器
        // right:0 对齐整行右缘（≈卡片右缘），修复错位/溢出/被裁（demo v5 口径）。
        // 模式下拉面板由 ModeSwitch 返回数组同步上移；互斥与外部点击关闭逻辑不变。
        mn ? di : null,
        wa ? pi : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: La, key: "qm-step" }, si)
      )
    ),
    e.createElement("div", { style: Dr }, _n),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    sc({
      R: e,
      open: _o,
      templates: ka,
      value: Ze,
      edit: No,
      onEditChange: qa,
      onClose: () => {
        Tr(!1), qa(null);
      },
      onSelect: (c) => Or(c),
      onSave: Po,
      onDelete: Mo
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
    (Wa || Nt && !x) && !u ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": J ? i : void 0,
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
        (Wa ? "⚠️ 本题已超过 " + Ho + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；若你不想继续作答，点右上角 🔒 释放阻塞。"
      )
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Ye && !u ? e.createElement("div", {
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
    }, Ye) : null,
    e.createElement(
      "div",
      { style: Da, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: E === 0 || D,
        style: { ...ts, marginRight: "auto", opacity: E === 0 ? 0.5 : 1 },
        onClick: () => $((c) => c - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: D,
        style: Xo,
        onClick: Zo
      }, Be ? "提交" : "下一步")
    ),
    // US-010: 🔒 二次确认气泡统一挂卡片根（四处 🔒 共用一个气泡实例）。
    kn
  );
}
const vs = 12;
let ws = 0;
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
  },
  libs: {
    paramSets: [],
    notifyProfiles: [],
    schedules: [],
    activeId: null,
    busy: !1,
    msg: "",
    msgKind: "info"
  },
  runSub: "default",
  schedEdit: "",
  schedDraft: null,
  delConfirm: null,
  cfgBackup: { items: [], dataDir: "", busy: !1, msg: "", msgKind: "info", confirmName: "" }
};
let Gt = null;
async function mt(t, e) {
  try {
    const n = {
      method: e && e.method || "GET",
      headers: j()
    };
    e && e.body !== void 0 && (n.body = JSON.stringify(e.body));
    const a = await fetch(L(t), n), r = await a.json().catch(() => ({}));
    if (!a.ok) {
      const s = r && (r.detail || r.message) || "HTTP " + a.status;
      return l.libs.msg = String(s), l.libs.msgKind = "error", q(), null;
    }
    return l.libs.msg = "", l.libs.msgKind = "info", r;
  } catch (n) {
    return l.libs.msg = "请求失败：" + (n && n.message ? n.message : String(n)), l.libs.msgKind = "error", q(), null;
  }
}
async function Vt(t, e, n) {
  const a = l.cfgBackup;
  a.busy = !0, q();
  try {
    const r = { method: e, headers: j() };
    n !== void 0 && (r.body = JSON.stringify(n));
    const s = await fetch(L("/question-modal/config" + t), r), o = await s.json().catch(() => ({}));
    return !s.ok || o && o.ok === !1 ? (a.msg = String(o && (o.error || o.detail) || "HTTP " + s.status), a.msgKind = "error", null) : (a.msg = "", a.msgKind = "info", o);
  } catch (r) {
    return a.msg = "请求失败：" + (r && r.message ? r.message : String(r)), a.msgKind = "error", null;
  } finally {
    a.busy = !1, q();
  }
}
async function Dn() {
  const t = await Vt("/backups", "GET");
  t && (l.cfgBackup.items = t.items || [], l.cfgBackup.dataDir = t.data_dir || "");
}
function lc(t) {
  const e = l.cfgBackup, n = [
    t.createElement("div", {
      key: "note",
      className: "qm-set-schednote",
      "data-qm-backup-note": "1"
    }, [
      t.createElement(
        "div",
        { key: "t", className: "qm-set-schednotetitle" },
        "配置存储位置"
      ),
      t.createElement(
        "div",
        { key: "d", className: "qm-set-schednotedesc" },
        "配置保存在插件安装目录之外：" + (e.dataDir || "读取中…") + "。商店更新插件不会清除这里的配置。"
      )
    ]),
    t.createElement("div", {
      key: "acts",
      className: "qm-set-dcbtns",
      style: { justifyContent: "flex-start", margin: "10px 0", flexWrap: "wrap" }
    }, [
      t.createElement("button", {
        key: "bak",
        type: "button",
        className: "qm-set-btn",
        "data-qm-backup-create": "1",
        disabled: e.busy,
        onClick: () => {
          (async () => {
            const a = "手动备份 " + (/* @__PURE__ */ new Date()).toLocaleString(), r = await Vt("/backup", "POST", { label: a });
            r && (e.msg = "备份已创建：" + r.name, e.msgKind = "ok"), await Dn();
          })();
        }
      }, "立即备份"),
      t.createElement("button", {
        key: "exp",
        type: "button",
        className: "qm-set-btn",
        "data-qm-backup-export": "1",
        disabled: e.busy,
        onClick: () => {
          (async () => {
            const a = await Vt("/export", "GET");
            if (!a) return;
            const r = new Blob(
              [JSON.stringify(a.payload, null, 2)],
              { type: "application/json" }
            ), s = document.createElement("a");
            s.href = URL.createObjectURL(r), s.download = "question-modal-config-" + (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + ".json", s.click();
            try {
              URL.revokeObjectURL(s.href);
            } catch {
            }
            e.msg = "配置已导出到本地文件", e.msgKind = "ok", q();
          })();
        }
      }, "导出到文件"),
      t.createElement("label", {
        key: "implabel",
        className: "qm-set-btn",
        style: { display: "inline-block" }
      }, [
        "从文件导入",
        t.createElement("input", {
          key: "imp",
          type: "file",
          accept: ".json,application/json",
          "data-qm-backup-import": "1",
          disabled: e.busy,
          style: { display: "none" },
          onChange: (a) => {
            (async () => {
              const r = a && a.target && a.target.files && a.target.files[0];
              if (!r) return;
              let s;
              try {
                s = JSON.parse(await r.text());
              } catch {
                e.msg = "文件不是合法 JSON", e.msgKind = "error", q();
                return;
              }
              const o = await Vt("/import", "POST", { payload: s });
              o && (e.msg = "导入成功，已恢复 " + (o.restored || []).length + " 个配置文件", e.msgKind = "ok"), await Dn();
            })();
          }
        })
      ])
    ])
  ];
  e.items.length || n.push(t.createElement("div", {
    key: "empty",
    className: "qm-set-dcdesc",
    "data-qm-backup-empty": "1"
  }, "暂无备份。点「立即备份」创建第一份。"));
  for (const a of e.items) {
    const r = String(a.name || "");
    n.push(t.createElement("div", {
      key: r,
      className: "qm-set-libcard",
      "data-qm-backup-item": r,
      style: { marginBottom: "8px" }
    }, [
      t.createElement(
        "div",
        { key: "n", className: "qm-set-schednotetitle" },
        a.label || r
      ),
      t.createElement(
        "div",
        { key: "m", className: "qm-set-dcdesc" },
        String(a.created_at || "") + " · " + (a.files || []).length + " 个文件"
      ),
      t.createElement("div", {
        key: "b",
        className: "qm-set-dcbtns",
        style: { justifyContent: "flex-end" }
      }, [
        e.confirmName === r ? t.createElement("span", { key: "cf", style: { fontSize: "12px" } }, [
          "确定恢复？当前配置会先自动备份。 ",
          t.createElement("button", {
            key: "y",
            type: "button",
            className: "qm-set-btn qm-set-dcok",
            "data-qm-backup-confirm": r,
            disabled: e.busy,
            onClick: () => {
              (async () => {
                const s = await Vt("/restore", "POST", { name: r });
                s && (e.msg = "已恢复 " + (s.restored || []).length + " 个配置文件", e.msgKind = "ok"), e.confirmName = "", await Dn();
              })();
            }
          }, "确认恢复"),
          " ",
          t.createElement("button", {
            key: "c",
            type: "button",
            className: "qm-set-btn",
            onClick: () => {
              e.confirmName = "", q();
            }
          }, "取消")
        ]) : t.createElement("button", {
          key: "r",
          type: "button",
          className: "qm-set-btn",
          "data-qm-backup-restore": r,
          disabled: e.busy,
          onClick: () => {
            e.confirmName = r, q();
          }
        }, "恢复此备份")
      ])
    ]));
  }
  return e.msg && n.push(t.createElement("div", {
    key: "msg",
    className: "qm-set-saveMsg" + (e.msgKind === "error" ? " qm-set-saveMsgErr" : ""),
    "data-qm-backup-msg": "1"
  }, e.msg)), n;
}
async function _t() {
  const t = await mt("/question-modal/libs");
  if (!t) return !1;
  const e = t.libraries || t;
  return l.libs.paramSets = Array.isArray(e.param_sets) ? e.param_sets : [], l.libs.notifyProfiles = Array.isArray(e.notify_profiles) ? e.notify_profiles : [], l.libs.schedules = Array.isArray(e.schedules) ? e.schedules : [], t.active_id !== void 0 ? l.libs.activeId = t.active_id || null : t.schedule !== void 0 && (l.libs.activeId = t.schedule && t.schedule.id || null), q(), !0;
}
async function cc(t) {
  l.libs.busy = !0, q();
  const e = await mt(
    "/question-modal/param-sets",
    { method: "POST", body: t }
  );
  return l.libs.busy = !1, e ? (await _t(), !0) : !1;
}
async function dc(t, e) {
  l.libs.busy = !0, q();
  const n = "?id=" + encodeURIComponent(t), a = await mt("/question-modal/param-sets" + n, { method: "DELETE" });
  return l.libs.busy = !1, a ? (l.libs.msg = a.cleared_in && a.cleared_in.length ? "已删除，同时清空了 " + a.cleared_in.length + " 条策略对该参数组的引用" : "", await _t(), !0) : !1;
}
async function qs(t) {
  l.libs.busy = !0, q();
  const e = await mt(
    "/question-modal/notify-profiles",
    { method: "POST", body: t }
  );
  return l.libs.busy = !1, e ? (await _t(), !0) : !1;
}
async function pc(t, e) {
  l.libs.busy = !0, q();
  const n = "?id=" + encodeURIComponent(t), a = await mt("/question-modal/notify-profiles" + n, { method: "DELETE" });
  return l.libs.busy = !1, a ? (l.libs.msg = a.cleared_in && a.cleared_in.length ? "已删除，同时清空了 " + a.cleared_in.length + " 条策略对该通知配置的引用" : "", await _t(), !0) : !1;
}
async function Es(t) {
  l.libs.busy = !0, q();
  const e = await mt(
    "/question-modal/schedules",
    { method: "POST", body: t }
  );
  return l.libs.busy = !1, e ? (l.schedEdit = "", l.schedDraft = null, await _t(), !0) : !1;
}
async function mc(t) {
  l.libs.busy = !0, q();
  const e = await mt(
    "/question-modal/schedules?id=" + encodeURIComponent(t),
    { method: "DELETE" }
  );
  return l.libs.busy = !1, e ? (await _t(), !0) : !1;
}
function ea(t, e, n) {
  l.delConfirm = { kind: t, id: e, name: n }, q();
}
async function uc() {
  const t = l.delConfirm;
  if (l.delConfirm = null, !t) {
    q();
    return;
  }
  const e = t.id;
  if (t.kind === "ts")
    await mc(e);
  else if (t.kind === "ps") {
    const n = l.libs.paramSets.filter((s) => String(s.id) === e)[0], a = (n && n.used_by || []).length;
    !await dc(e) && a && (l.libs.msg += "（如需强制删除，请先在时间策略里解除引用）");
  } else if (t.kind === "np") {
    const n = l.libs.notifyProfiles.filter((s) => String(s.id) === e)[0], a = (n && n.used_by || []).length;
    !await pc(e) && a && (l.libs.msg += "（如需强制删除，请先在时间策略里解除引用）");
  } else if (t.kind === "tpl") {
    const n = await Zs(e);
    n && n.ok === !1 ? l.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）") : (l.saveMsg = "模板已删除", io());
  }
  q();
}
function lt(t, e, n) {
  if (t in l.draft) return l.draft[t];
  if (n === "global") {
    const s = l.cfg && l.cfg.globalConfig || l.globalCfg;
    return s && t in s ? s[t] : e;
  }
  const a = l.cfg && l.cfg.config, r = l.cfg && l.cfg.sessionConfig;
  if (r) {
    if (t in r) return r[t];
    const s = l.cfg && l.cfg.globalConfig || l.globalCfg;
    return s && t in s ? s[t] : e;
  }
  return a && t in a && l.cfg && l.cfg.has_session === !0 ? a[t] : (a && t in a && !(l.cfg && l.cfg.has_session), e);
}
function tr(t) {
  const e = l.cfg && l.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, a = e[t];
  return !!(n && n[t] === "session" && (a === "" || a === null));
}
function xe(t, e) {
  let n;
  const a = l.cfg;
  if (l.scope === "global") {
    const r = a && a.globalConfig || l.globalCfg || {};
    n = t in r ? r[t] : void 0;
  } else {
    const r = a && a.sessionConfig;
    if (r)
      if (t in r)
        n = r[t];
      else {
        const s = a && a.globalConfig || l.globalCfg || {};
        n = t in s ? s[t] : void 0;
      }
    else {
      const s = a && a.config;
      n = s && t in s ? s[t] : void 0;
    }
  }
  n === e ? delete l.draft[t] : l.draft[t] = e, l.saveMsg = "", q();
}
function Ss() {
  return Object.keys(l.draft).length;
}
async function qr() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: j() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    l.globalCfg = n && typeof n == "object" ? n : {};
    try {
      Ac(l.globalCfg);
    } catch {
    }
    try {
      q();
    } catch {
    }
  } catch {
  }
}
async function fc() {
  try {
    const t = await fetch(L("/question-modal/notify/channels"), {
      headers: j()
    });
    if (!t.ok) return;
    const e = await t.json();
    l.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], l.notifyCurrent = String(e && e.effective || "off"), l.pcCurrent = String(e && e.pc_current || "off"), l.bgCurrent = String(e && e.bg_current || "off");
    try {
      q();
    } catch {
    }
  } catch {
  }
}
async function gc(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        L("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: j() }
      );
      if (!e.ok) return;
      const n = await e.json();
      l.notifyLog = {
        ...l.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        q();
      } catch {
      }
    } catch {
    }
}
async function so() {
  if (l.saving) return;
  const t = Object.keys(l.draft), e = l.scope === "session", n = {};
  if (t.forEach((a) => {
    n[a] = l.draft[a];
  }), !t.length && !e) {
    const a = l.globalCfg || {};
    Object.keys(a).forEach((r) => {
      r in n || (n[r] = a[r]);
    });
  }
  t.length, l.saving = !0, l.saveMsg = "", q();
  try {
    const a = "/question-modal/prefs", r = n, s = await fetch(L(a), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(r)
    }), o = await s.json().catch(() => ({}));
    if (!s.ok) {
      l.saving = !1, l.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + s.status + "）", q();
      return;
    }
    const d = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (d.length) {
      l.saving = !1;
      const f = d.map((g) => `${g.key}：${g.reason || "取值不合法"}`).join("；");
      l.saveMsg = "部分设置未生效 —— " + f, q();
      return;
    }
    l.saving = !1, l.draft = {}, Gs();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (l.conflictNote = "", i.length) {
      const f = (b) => {
        try {
          const v = new Date(b * 1e3), y = (u) => u < 10 ? "0" + u : String(u);
          return v.getMonth() + 1 + "-" + y(v.getDate()) + " " + y(v.getHours()) + ":" + y(v.getMinutes()) + ":" + y(v.getSeconds());
        } catch {
          return "";
        }
      }, g = i.reduce(
        (b, v) => Math.max(b, Number(v && v.at) || 0),
        0
      ), k = i.map((b) => String(b && b.key || "")).filter(Boolean);
      l.conflictNote = "设置已于 " + f(g) + " 被其它位置修改，本次已按后写入的值覆盖" + (k.length ? "（" + k.join("、") + "）" : "") + "。";
    }
    try {
      const f = o && o.key_ts || {};
      f && typeof f == "object" && (l.keyTs = Object.assign({}, l.keyTs, f));
    } catch {
    }
    e || qr(), l.saveMsg = "已保存", nn(
      l.chatId,
      !0,
      l.sessionId,
      l.agentId
    ).then((f) => {
      f && (l.cfg = f);
      try {
        q();
      } catch {
      }
    }).catch(() => {
    });
  } catch (a) {
    l.saving = !1, l.saveMsg = "保存请求失败：" + (a && a.message ? a.message : a);
  }
  try {
    q();
  } catch {
  }
}
function oo() {
  l.draft = {}, l.saveMsg = "";
}
function io() {
  kr().then((t) => {
    l.templates = (t && t.items || []).filter((e) => e && e.id), l.templateOptions = l.templates.map((e) => e.id);
    try {
      q();
    } catch {
    }
  }).catch(() => {
  });
}
function hc() {
  l.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, l.saveMsg = "", q();
}
function bc(t) {
  const e = l.templates.filter((n) => n.id === t)[0];
  e && (l.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, l.saveMsg = "", q());
}
function _s(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  l.tplEdit && (l.tplEdit[t] = e, q());
}
function yc() {
  l.tplEdit = null, q();
}
async function xc() {
  const t = l.tplEdit;
  if (!t || l.tplBusy) return;
  try {
    const r = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    r && typeof r.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((s) => {
      const o = r.querySelector('[data-qm-tpl-field="' + s + '"]');
      o && typeof o.value == "string" && o.value !== "" && (t[s] = o.value);
    });
  } catch {
  }
  const e = String(t.name || "").trim();
  if (!e) {
    l.saveMsg = "模板名称不能为空", q();
    return;
  }
  l.tplBusy = !0, q();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, a = await Js(n);
  if (l.tplBusy = !1, a && a.ok === !1) {
    l.saveMsg = String(a.error || a.detail || "保存失败"), q();
    return;
  }
  l.tplEdit = null, l.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", io(), q();
}
function kc(t) {
  const e = l.templates.filter((n) => n.id === t)[0];
  ea("tpl", t, String(e && e.name || t));
}
function vc() {
  l.visible = !0, l.chatId = "", l.sessionId = sn(), l.cfg = null, l.cfgError = "", qc(), l.agentId = Vn || (() => {
    try {
      return ze().getSelectedAgentId ? ze().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Gs();
  const t = ++ws;
  l.scopeChoice = "", l.tab = "", l.scope = "global", l.draft = {}, l.saveMsg = "", l.conflictNote = "", q(), lo(() => {
    t === ws && (l.scopeChoice = "global", l.tab = "schedule", l.scope = "global", l.draft = {}, l.saveMsg = "", l.keyTs = Object.assign(
      {},
      l.cfg && l.cfg.keyTs || {}
    ), l.conflictNote = "", q(), qr(), fc().then(() => {
      const e = String(l.notifyCurrent || "off");
      e && e !== "off" && gc(e);
    }));
  });
}
let nr = !1;
async function wc() {
  if (!nr) {
    nr = !0;
    try {
      const t = await nn(
        "",
        !0,
        l.sessionId,
        l.agentId
      ), e = t && t.config && t.config.release_after_sec;
      l.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      l.stale.threshold = null;
    } finally {
      nr = !1;
      try {
        q();
      } catch {
      }
    }
  }
}
let Pn = !1;
function qc() {
  Pn || (Pn = !0, Promise.all([Qs(), kr()]).then((t) => {
    Pn = !1;
    const e = t[0] || [], n = t[1] || {};
    l.providerGroups = e.map((a) => {
      const r = String(a && (a.id || a.provider_id) || ""), o = (a && a.models || []).concat(a && a.extra_models || []).filter(Boolean).map((d) => {
        const i = typeof d == "string" ? d : d && (d.name || d.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: r,
        name: String(a && (a.name || a.title) || r),
        models: o
      };
    }).filter((a) => a.id && a.models.length > 0), l.modelOptions = l.providerGroups.flatMap((a) => a.models.map((r) => a.id + ":" + r)), l.templates = (n.items || []).filter((a) => a && a.id), l.templateOptions = l.templates.map((a) => a.id);
    try {
      q();
    } catch {
    }
  }).catch(() => {
    Pn = !1;
  }));
}
function Ec(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let ar = !1, Mn = "";
const rr = [];
function lo(t) {
  const e = l.chatId, n = (e || "") + "|" + (l.sessionId || "");
  if (ar && Mn === n) {
    t && rr.push(t);
    return;
  }
  ar = !0, Mn = n;
  const a = () => {
    Mn === n && (ar = !1, Mn = "");
    const r = rr.splice(0);
    try {
      r.forEach((s) => s());
    } catch {
    }
  };
  t && rr.push(t), nn(
    e,
    !0,
    l.sessionId,
    l.agentId
  ).then((r) => {
    if (l.chatId !== e) {
      a();
      return;
    }
    if (r) {
      l.cfg = r, l.cfgError = "";
      try {
        const o = r.libraries;
        o && typeof o == "object" && (l.libs.paramSets = Array.isArray(o.param_sets) ? o.param_sets : [], l.libs.notifyProfiles = Array.isArray(o.notify_profiles) ? o.notify_profiles : [], l.libs.schedules = Array.isArray(o.schedules) ? o.schedules : []);
        const d = r.schedule;
        l.libs.activeId = d && d.id ? String(d.id) : null;
      } catch (o) {
        console.warn("[question-modal] 读取策略库失败", o);
      }
      const s = r.config && r.config.release_after_sec;
      l.stale.threshold = typeof s == "number" && isFinite(s) ? s : null;
    } else
      l.cfgError = "读取配置失败（后端不可达）", l.tab || (l.tab = "default", l.scopeChoice = "default", l.scope = "global");
    a();
    try {
      q();
    } catch {
    }
  }).catch(() => {
    l.tab || (l.tab = "default", l.scopeChoice = "default", l.scope = "global", l.cfgError = "读取配置失败（网络异常）"), a();
    try {
      q();
    } catch {
    }
  });
}
function q() {
  const t = ze().React, e = ze().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (l.visible) {
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
        l.visible = !1;
      }
      return;
    }
    Gt || (Gt = document.createElement("div"), Gt.id = "qm-settings-root", document.body.appendChild(Gt)), e.render(t.createElement(Jc, {
      R: t,
      open: l.visible,
      onClose: () => {
        if (Ss() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          oo();
        }
        l.visible = !1, l.saveMsg = "", q();
      },
      tab: l.tab,
      onTabChange: (n) => {
        l.tab = n, (n === "session" || n === "default") && (l.scopeChoice = n), l.scope = co(n) ? "session" : "global", l.saveMsg = "", l.draft = {}, q(), lo(), (n === "global" || n === "default") && qr(), n === "stale" && wc();
      },
      scope: l.scope,
      scopeChoice: l.scopeChoice,
      sessData: l.sessData,
      cfg: l.cfg,
      cfgError: l.cfgError,
      chatId: l.chatId,
      dirtyCount: Ss(),
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
    }), Gt);
  }
}
function Sc(t) {
  const { R: e, onOpen: n } = t, a = Ve(), r = a && a.Button, s = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, d = { title: s, "aria-label": s }, i = {
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
  }, f = e.createElement("svg", i, [
    e.createElement("path", {
      key: 1,
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }),
    e.createElement("polyline", { key: 2, points: "14 2 14 8 20 8" }),
    e.createElement("line", { key: 3, x1: 16, y1: 13, x2: 8, y2: 13 }),
    e.createElement("line", { key: 4, x1: 16, y1: 17, x2: 8, y2: 17 }),
    e.createElement("polyline", { key: 5, points: "10 9 9 9 8 9" })
  ]);
  return f ? r ? e.createElement(r, {
    type: "text",
    size: "small",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, f) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, f) : r ? e.createElement(
    r,
    { type: "text", size: "small", style: o, onClick: n },
    s
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    s
  );
}
const sr = [
  // 2026-11-23 架构重构（boss 裁定）：「会话模式 / 默认模式」两个页签合并。
  //
  // boss 原话：「不再采用会话模式或者默认模式，全部采用统一的配置，所有的
  // 会话都生效同一种配置……所有的设置参数，直接使用时间段这个策略来匹配」。
  //
  // 新结构（对齐定稿设计稿 demo/统一配置-时间策略-demo-v3.html）：
  //   ① 时间策略  —— 按时段匹配，命中即覆盖参数组 + 通知配置
  //   ② 运行参数  —— 内嵌分类：默认参数 / 问卷参数组 / 通知配置 / 模型 / 提示词
  //   ③ 问卷清理  —— 原样保留（挂起问卷处置，与本次重构无关）
  //
  // 旧页签映射（避免用户找不到原来设置项）：
  //   会话模式 + 默认模式 → 运行参数 › 默认参数
  //   全局配置            → 运行参数 › 模型（显示类/行为类项在此）
  //   提示词              → 运行参数 › 提示词
  //   时段调度            → 时间策略（从纯 UI 占位升级为真实生效）
  { key: "schedule", label: "时间策略", hint: "" },
  { key: "run", label: "运行参数", hint: "" },
  { key: "stale", label: "问卷清理", hint: "" }
], _c = [
  { key: "default", label: "默认参数" },
  { key: "param-sets", label: "问卷参数组" },
  { key: "notify-profiles", label: "通知配置" },
  { key: "custom-api", label: "自定义 API" },
  { key: "behavior", label: "行为参数" },
  { key: "prompt", label: "提示词" },
  // 2026-11-25 boss 需求 2：配置备份/恢复入口（外置目录，更新不丢）
  { key: "backup", label: "备份恢复" }
], Nc = {
  model: "behavior"
}, co = (t) => t === "session";
function Cc(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function Tc(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function en(t, e, n, a, r, s, o, d, i) {
  const f = s || "global", g = Tc(o || "global", f), k = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      Cc(t, "sc", f),
      g && f === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    r ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, r) : null
  ], b = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, k),
    t.createElement("div", {
      className: "qm-set-rowctl" + (d ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, a)
  ];
  return t.createElement("div", {
    className: "qm-set-row" + (g ? " qm-set-rowlocked" : ""),
    key: e,
    "data-qm-locked": g ? "1" : "0",
    "data-qm-rowblock": "0"
  }, b);
}
function zc(t, e, n, a, r) {
  return t.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    n.map((s, o) => t.createElement("button", {
      key: "s" + o,
      type: "button",
      "data-qm-val": s,
      disabled: !r,
      className: "qm-set-segbtn" + (s === a ? " qm-set-segon" : "") + (r ? "" : " qm-set-ctrldis"),
      onClick: () => {
        r && r(s);
      }
    }, [
      t.createElement("span", { key: "t" }, s)
    ]))
  );
}
function Ic(t, e, n, a) {
  return t.createElement("div", {
    key: e,
    className: "qm-set-switch" + (n ? " qm-set-switch-on" : "") + (a ? "" : " qm-set-ctrldis"),
    "data-qm-on": n ? "1" : "0",
    role: "switch",
    // Self-drawn switch: without these the a11y tree reports an unchecked
    // switch regardless of the real state (observed in a real browser).
    "aria-checked": n ? "true" : "false",
    "aria-disabled": a ? "false" : "true",
    tabIndex: a ? 0 : -1,
    onClick: () => {
      a && a(!n);
    },
    onKeyDown: (r) => {
      if (!a) return;
      const s = r && r.key;
      (s === " " || s === "Enter") && (r.preventDefault(), a(!n));
    }
  }, [
    t.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function tn(t, e, n, a, r) {
  if (a && a.length && r) {
    const s = a.map((o, d) => o && typeof o == "object" ? { value: String(o.value), label: String(o.label || o.value) } : { value: String(o), label: String(o) });
    return t.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      t.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: n,
        onChange: (o) => r(o && o.target ? o.target.value : "")
      }, s.map((o, d) => t.createElement("option", { key: "o" + d, value: o.value }, o.label)))
    ]);
  }
  return t.createElement("div", { className: "qm-set-select", key: e }, [
    t.createElement("span", { key: "t", className: "qm-set-selecttext" }, n),
    t.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function po(t, e, n, a, r) {
  const s = Ec(n), d = a.map((v) => v.id).indexOf(s.provider) >= 0 ? s.provider : "", i = d ? (a.filter((v) => v.id === d)[0] || { models: [] }).models : [], f = i.indexOf(s.model) >= 0 ? s.model : "", g = (v, y) => {
    r && r(v ? v + ":" + y : "");
  }, k = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: d,
    disabled: !r,
    title: "厂商",
    onChange: (v) => {
      const y = v && v.target ? v.target.value : "", u = y ? (a.filter((_) => _.id === y)[0] || { models: [] }).models : [];
      g(y, y && u[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(a.map((v, y) => t.createElement(
    "option",
    { key: "g" + y, value: v.id },
    v.name === v.id ? v.id : v.name + "（" + v.models.length + "）"
  )))), b = t.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: f,
    disabled: !r || !d,
    title: d ? "选择模型" : "先选厂商",
    onChange: (v) => {
      const y = v && v.target ? v.target.value : "";
      g(d, y);
    }
  }, d ? i.map((v, y) => t.createElement("option", { key: "m" + y, value: v }, v)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    k,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    b
  ]);
}
let A = {
  enabled: !1,
  url: "",
  method: "post_json",
  tokenPos: "none",
  token: "",
  tokenSet: !1,
  mode: "basic",
  params: [],
  bodyTpl: ""
}, it = null;
function Jt() {
  try {
    xe("custom_api_params", A.params.map((t) => ({
      key: String(t.key || ""),
      value: String(t.value || ""),
      required: !!t.required
    })));
  } catch {
  }
}
function Ac(t) {
  if (!t || typeof t != "object") return;
  const e = (r, s) => {
    if (r in l.draft) return String(l.draft[r]);
    const o = t[r];
    return o == null ? s : String(o);
  };
  A.enabled = "custom_api_enabled" in l.draft ? !!l.draft.custom_api_enabled : !!t.custom_api_enabled, A.url = e("custom_api_url", ""), A.method = e("custom_api_method", "post_json"), A.tokenPos = e("custom_api_token_pos", "none"), A.mode = e("custom_api_mode", "basic"), A.bodyTpl = e("custom_api_body", ""), A.token = "", A.tokenSet = !!t.custom_api_token_set;
  const n = l.draft.custom_api_params, a = Array.isArray(n) ? n : Array.isArray(t.custom_api_params) ? t.custom_api_params : [];
  A.params = a.filter((r) => r && typeof r == "object").map((r) => ({
    key: String(r.key || ""),
    value: String(r.value || ""),
    required: !!r.required
  }));
}
function Oc() {
  const t = [];
  return String(A.url || "").trim() || t.push("请求地址"), A.mode === "advanced" ? String(A.bodyTpl || "").trim() || t.push("body 模板") : A.params.forEach((e) => {
    e.required && !String(e.value || "").trim() && t.push(String(e.key || "").trim() || "未命名参数");
  }), t;
}
function $c() {
  const t = {}, e = /* @__PURE__ */ new Set();
  return A.params.forEach((n, a) => {
    const r = String(n.key || "").trim();
    r && (t[r] !== void 0 ? (e.add(a), e.add(t[r])) : t[r] = a);
  }), e;
}
function Pc(t) {
  return /^[A-Za-z_][A-Za-z0-9_.\-]*$/.test(t);
}
function or(t, e) {
  let n = String(t || "");
  return ["title", "content", "count", "stamp", "token"].forEach((a) => {
    n = n.split("{{" + a + "}}").join(e[a] || "");
  }), n;
}
const Zt = {
  title: "（问卷标题）",
  content: "「（问卷标题）」有 3 道题等你作答",
  count: "3",
  stamp: "来自智能体-2026-01-01 00:00:00",
  token: A.tokenSet || A.token ? "（已设置的 Token）" : "（未设置 Token）"
};
function mo(t) {
  return [
    {
      id: t.ids.mode,
      label: t.modeLabel,
      kind: "seg",
      cfgKey: "mode",
      readScope: t.readScope,
      itemScope: t.itemScope.mode,
      note: "本会话的问卷默认用哪种方式推进",
      segItems: ["自动分析", "只用推荐", "人工"]
    },
    {
      id: t.ids.model,
      label: "默认模型",
      kind: "model",
      cfgKey: "model_id",
      readScope: t.readScope,
      itemScope: t.itemScope.model,
      note: t.modelNote,
      wide: t.modelWide,
      hideWhenRecommend: !0
    },
    {
      id: t.ids.tpl,
      label: "提示词模板",
      kind: "select",
      cfgKey: "template_id",
      readScope: t.readScope,
      itemScope: t.itemScope.tpl,
      note: "自动分析模式下将调用提示词并自动分析",
      hideWhenRecommend: !0
    },
    {
      id: t.ids.ctx,
      label: "携带上下文",
      kind: "switch",
      cfgKey: "with_context",
      readScope: t.readScope,
      itemScope: t.itemScope.ctx,
      note: "附带上次决策与会话历史",
      switchKey: t.switchKeys.ctx,
      hideWhenRecommend: !0,
      pair: !!t.pairSwitches
    },
    {
      id: t.ids.parallel,
      label: "并行分析各题",
      kind: "switch",
      cfgKey: "parallel",
      readScope: t.readScope,
      itemScope: t.itemScope.parallel,
      note: "逐题并发调用模型，更快，但更耗额度。",
      switchKey: t.switchKeys.parallel,
      hideWhenRecommend: !0,
      pair: !!t.pairSwitches
    }
  ];
}
const Mc = mo({
  ids: { mode: "s1", model: "s2", tpl: "s3", ctx: "s4", parallel: "s5" },
  readScope: "session",
  itemScope: { mode: "session", model: "session", tpl: "session", ctx: "session", parallel: "session" },
  modeLabel: "答题模式",
  // 模型行说明是动态的（三态来源），这里放占位，渲染时由 renderSettingRow 覆盖
  modelNote: "",
  switchKeys: { ctx: "s4sw", parallel: "s5sw" }
}), Ns = mo({
  ids: { mode: "a1", model: "b1", tpl: "b2", ctx: "b3", parallel: "b4" },
  readScope: "global",
  itemScope: { mode: "both", model: "both", tpl: "both", ctx: "both", parallel: "global" },
  modeLabel: "默认答题模式",
  modelNote: "自动读取当前对话模型；改动即自动切换",
  switchKeys: { ctx: "s3", parallel: "s4" },
  modelWide: !0,
  pairSwitches: !0
});
function Bc(t, e) {
  return lt(t.cfgKey, e, t.readScope);
}
function ir(t, e, n) {
  const a = Bc(e, e.cfgKey === "mode" ? "manual" : e.kind === "switch" ? !1 : "");
  let r;
  if (e.kind === "seg")
    r = zc(
      t,
      "g1",
      e.segItems || [],
      n.modeLabel[String(a || "manual")] || "人工",
      (o) => n.edit(e.cfgKey, n.modeByLabel[o] || "manual")
    );
  else if (e.kind === "model")
    r = po(
      t,
      "sel2",
      String(a || ""),
      n.groups,
      (o) => n.edit(e.cfgKey, o)
    );
  else if (e.kind === "select")
    if (n.tplChoices.length) {
      const o = String(a || "") || n.tplChoices[0] && n.tplChoices[0].value || "";
      r = tn(
        t,
        "sel3",
        o,
        n.tplChoices,
        (d) => n.edit(e.cfgKey, d)
      );
    } else
      r = tn(t, "sel3", "默认六步思维链");
  else
    r = Ic(
      t,
      e.switchKey || e.id + "sw",
      !!a,
      (o) => n.edit(e.cfgKey, o)
    );
  let s = e.note;
  return e.kind === "model" && e.readScope === "session" && (s = n.explicitEmptyModel ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换"), e.kind === "select" && !n.tplChoices.length && (s = "模板库未加载，暂不可选"), en(t, e.id, e.label, r, s, e.itemScope, n.scope, e.wide);
}
function lr(t, e, n) {
  const a = e.filter((s) => !s.hideWhenRecommend || n.currentMode !== "recommend"), r = [];
  for (let s = 0; s < a.length; s++) {
    const o = a[s], d = a[s + 1];
    o.pair && d && d.pair ? (r.push(t.createElement("div", {
      key: "pair-" + o.id + "+" + d.id,
      className: "qm-set-rowpair",
      "data-qm-rowpair": "1"
    }, [
      ir(t, o, n),
      ir(t, d, n)
    ])), s++) : r.push(ir(t, o, n));
  }
  return r;
}
function Lc(t, e, n) {
  const a = String(e || ""), r = String(n || ""), s = !!a && !!r && a !== r && a > r, o = [t.createElement("span", { key: "t" }, a + " → " + r)];
  return s && o.push(t.createElement("span", { key: "nt", className: "nt" }, "次日")), t.createElement("span", { className: "qm-set-tstime" }, o);
}
function Cs(t, e, n) {
  const a = String(e || "");
  if (!a) return n;
  const r = t.filter((s) => String(s && s.id) === a)[0];
  return r ? String(r.name || r.id || a) : a + "（已删除）";
}
function jc(t, e) {
  const n = e || {}, a = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, r = [];
  n.mode && r.push(t.createElement("span", {
    key: "m",
    className: "qm-set-tschip mode"
  }, a[String(n.mode)] || String(n.mode))), n.model_id && r.push(t.createElement(
    "span",
    { key: "md", className: "qm-set-tschip" },
    String(n.model_id)
  ));
  const s = (o, d) => t.createElement("span", {
    key: o,
    className: "qm-set-tssw" + (n[o] ? " on" : "")
  }, [
    t.createElement("span", { key: "i", className: "mini" }),
    t.createElement("span", { key: "l", className: "lb" }, d)
  ]);
  return r.push(s("with_context", "携带上下文")), r.push(s("parallel", "并行分析")), r;
}
function Ts(t, e, n, a) {
  const r = String(e.id || ""), s = !!a.activeId && a.activeId === r, o = "qm-set-tscard" + (s ? " qm-set-tshit" : "") + (a.editing ? " qm-set-tsedit" : "");
  if (a.editing && a.draft) {
    const g = a.draft, k = (u, _) => {
      g[u] = _, q();
    }, b = (u) => {
      const _ = {
        key: u,
        type: "time",
        // 需求 4（2026-11-24）：显示秒（HH:mm:ss）。开始默认 :00、结束默认 :59，
        // 消除 23:59:01~23:59:59 的空缺；step=1 是原生 time 输入显示秒的开关。
        step: 1,
        value: String(g[u] || ""),
        onChange: (N) => k(u, N && N.target ? String(N.target.value) : "")
      };
      return _["data-qm-ts-" + u] = r, t.createElement("input", _);
    }, v = (u, _, N) => {
      const P = [t.createElement(
        "option",
        { key: "none", value: "" },
        N
      )];
      _.forEach((E, $) => {
        P.push(t.createElement(
          "option",
          { key: "o" + $, value: String(E.id) },
          String(E.name || E.id)
        ));
      });
      const x = String(g[u] || "");
      x && !_.some((E) => String(E.id) === x) && P.push(t.createElement(
        "option",
        { key: "gone", value: x },
        x + "（已删除）"
      ));
      const T = {
        key: u,
        className: "qm-set-native",
        value: x,
        onChange: (E) => k(u, E && E.target ? String(E.target.value) : "")
      };
      return T["data-qm-ts-" + u] = r, t.createElement("select", T, P);
    }, y = { className: o, key: "sc" + r };
    return r && (y["data-qm-ts-card"] = r), t.createElement(
      "div",
      y,
      t.createElement("div", { className: "qm-set-tstop" }, [
        t.createElement("span", { className: "qm-set-tsidx" }, String(n + 1)),
        t.createElement(
          "span",
          { className: "qm-set-tsname", style: { flex: "1 1 auto" } },
          t.createElement("input", {
            type: "text",
            value: String(g.name || ""),
            placeholder: "策略名称（如：夜间值守）",
            className: "qm-set-input",
            style: { width: "100%" },
            "data-qm-ts-name": r,
            onChange: (u) => k(
              "name",
              u && u.target ? String(u.target.value) : ""
            )
          })
        )
      ]),
      t.createElement("div", { className: "qm-set-tsform" }, [
        t.createElement("div", { className: "qm-set-tsf full", key: "time" }, [
          t.createElement("label", { key: "l" }, "生效时间段"),
          t.createElement("div", { className: "fc", key: "c" }, [
            b("start"),
            t.createElement("span", { key: "d", className: "qm-set-tsdash" }, "→"),
            b("end")
          ])
        ]),
        t.createElement("div", { className: "qm-set-tsf", key: "ps" }, [
          t.createElement("label", { key: "l" }, [
            t.createElement("span", { key: "t" }, "问卷参数组"),
            t.createElement("span", { key: "g", className: "tag" }, "引用")
          ]),
          t.createElement(
            "div",
            { className: "fc", key: "c" },
            v("param_set_id", a.paramSets, "不覆盖参数")
          )
        ]),
        t.createElement("div", { className: "qm-set-tsf", key: "np" }, [
          t.createElement("label", { key: "l" }, [
            t.createElement("span", { key: "t" }, "通知配置"),
            t.createElement("span", { key: "g", className: "tag" }, "引用")
          ]),
          t.createElement(
            "div",
            { className: "fc", key: "c" },
            v("notify_profile_id", a.notifyProfiles, "不覆盖通知")
          )
        ])
      ]),
      t.createElement("div", { className: "qm-set-tsfoot" }, [
        t.createElement(
          "span",
          { key: "n", className: "note" },
          "参数组内容在「运行参数 › 问卷参数组」里改"
        ),
        t.createElement("button", {
          key: "cancel",
          type: "button",
          className: "qm-set-btn",
          "data-qm-ts-cancel": r,
          disabled: !!a.busy,
          onClick: () => {
            l.schedEdit = "", l.schedDraft = null, q();
          }
        }, "取消"),
        t.createElement("button", {
          key: "ok",
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          "data-qm-ts-save": r,
          disabled: !!a.busy,
          onClick: () => {
            const u = {
              name: String(g.name || "").trim() || "未命名策略",
              start: String(g.start || "00:00"),
              end: String(g.end || "23:59"),
              param_set_id: String(g.param_set_id || ""),
              notify_profile_id: String(g.notify_profile_id || "")
            };
            g.id ? Es(Object.assign({ id: String(g.id) }, u)) : Es(u);
          }
        }, a.busy ? "保存中…" : "完成")
      ])
    );
  }
  const d = String(e.param_set_id || ""), i = String(e.notify_profile_id || ""), f = a.paramSets.filter((g) => String(g.id) === d)[0];
  return t.createElement("div", {
    className: o,
    key: "sc" + r,
    "data-qm-ts-card": r
  }, [
    t.createElement("div", { className: "qm-set-tstop", key: "top" }, [
      t.createElement("span", { key: "i", className: "qm-set-tsidx" }, String(n + 1)),
      t.createElement(
        "span",
        { key: "n", className: "qm-set-tsname" },
        String(e.name || "未命名策略")
      ),
      s ? t.createElement("span", { key: "b", className: "qm-set-tsbadge" }, "生效中") : null,
      t.createElement(
        "span",
        { key: "t", style: { display: "contents" } },
        Lc(t, e.start, e.end)
      ),
      t.createElement("span", { key: "s", className: "qm-set-tssp" }),
      t.createElement("div", { key: "a", className: "qm-set-tsacts" }, [
        t.createElement("button", {
          key: "e",
          type: "button",
          className: "qm-set-tsbtn",
          "data-qm-ts-edit": r,
          onClick: () => {
            l.schedEdit = r, l.schedDraft = {
              id: r,
              name: String(e.name || ""),
              start: String(e.start || ""),
              end: String(e.end || ""),
              param_set_id: d,
              notify_profile_id: i
            }, q();
          }
        }, "✎ 编辑"),
        t.createElement("button", {
          key: "d",
          type: "button",
          className: "qm-set-tsbtn qm-set-tsdel",
          "data-qm-ts-del": r,
          title: "删除这条策略",
          disabled: !!a.busy,
          onClick: () => {
            ea("ts", r, String(e.name || "未命名策略"));
          }
        }, "✕")
      ])
    ]),
    t.createElement("div", { className: "qm-set-tsrefs", key: "refs" }, [
      t.createElement("span", { key: "l1", className: "v" }, "参数组"),
      t.createElement("span", { key: "s1", className: "sep" }, "·"),
      t.createElement(
        "span",
        { key: "v1" },
        Cs(a.paramSets, d, "未引用（不覆盖参数）")
      ),
      t.createElement("span", { key: "s2", className: "sep" }, "|"),
      t.createElement("span", { key: "l2", className: "v" }, "通知"),
      t.createElement("span", { key: "s3", className: "sep" }, "·"),
      t.createElement(
        "span",
        { key: "v2" },
        Cs(a.notifyProfiles, i, "未引用（不覆盖通知）")
      )
    ]),
    f ? t.createElement(
      "div",
      { className: "qm-set-tschips", key: "chips" },
      jc(t, f.params)
    ) : null
  ]);
}
function Dc(t) {
  const e = l.libs, n = [], a = e.schedules.filter(
    (r) => e.activeId && String(r.id) === String(e.activeId)
  )[0];
  if (a) {
    const r = e.paramSets.filter(
      (i) => String(i.id) === String(a.param_set_id || "")
    )[0], s = e.notifyProfiles.filter(
      (i) => String(i.id) === String(a.notify_profile_id || "")
    )[0], o = /* @__PURE__ */ new Date(), d = ("0" + o.getHours()).slice(-2) + ":" + ("0" + o.getMinutes()).slice(-2);
    n.push(t.createElement("div", {
      className: "qm-set-nowbar",
      key: "nowbar",
      "data-qm-nowbar": "hit"
    }, [
      t.createElement("span", { key: "i" }, "◷"),
      t.createElement("span", { key: "t" }, [
        "当前时间 ",
        t.createElement("b", { key: "b1" }, d),
        " 命中「",
        t.createElement("b", { key: "b2" }, String(a.name || "")),
        "」",
        r ? [" → 参数组 ", t.createElement("b", { key: "b3" }, String(r.name || ""))] : " → 不覆盖参数",
        s ? [" · 通知 ", t.createElement("b", { key: "b4" }, String(s.name || ""))] : " · 不覆盖通知"
      ])
    ]));
  } else
    n.push(t.createElement("div", {
      className: "qm-set-nowbar fallback",
      key: "nowbar",
      "data-qm-nowbar": "none"
    }, [
      t.createElement("span", { key: "i" }, "◷"),
      t.createElement("span", { key: "t" }, [
        e.schedules.length ? "当前时刻没有命中任何时间策略 → 使用「运行参数 › " : "尚未配置时间策略 → 所有会话都使用「运行参数 › ",
        t.createElement("b", { key: "b1" }, "默认参数"),
        "」"
      ])
    ]));
  if (e.msg && n.push(t.createElement("div", {
    key: "msg",
    className: "qm-set-schednote",
    style: e.msgKind === "error" ? {
      borderColor: "#f3c2bd",
      background: "rgba(217,48,37,.05)",
      color: "#b3261e"
    } : void 0,
    "data-qm-libs-msg": e.msgKind
  }, e.msg)), !e.schedules.length && l.schedEdit !== "__new__")
    n.push(t.createElement("div", { className: "qm-set-tsempty", key: "empty" }, [
      t.createElement("b", { key: "t" }, "还没有时间策略"),
      "当前使用默认参数运行。",
      t.createElement("br", { key: "br" }),
      "如需按时间段自动切换（如夜间全自动、白天人工），添加一条即可。"
    ]));
  else {
    const r = e.schedules.map((s, o) => Ts(t, s, o, {
      activeId: e.activeId,
      editing: l.schedEdit === String(s.id),
      draft: l.schedDraft,
      paramSets: e.paramSets,
      notifyProfiles: e.notifyProfiles,
      busy: e.busy
    }));
    l.schedEdit === "__new__" && l.schedDraft && r.push(Ts(t, {}, e.schedules.length, {
      activeId: e.activeId,
      editing: !0,
      draft: l.schedDraft,
      paramSets: e.paramSets,
      notifyProfiles: e.notifyProfiles,
      busy: e.busy
    })), n.push(t.createElement("div", { className: "qm-set-tslist", key: "list" }, r));
  }
  return l.schedEdit !== "__new__" && n.push(t.createElement("button", {
    type: "button",
    key: "add",
    className: "qm-set-btn qm-set-btnnew",
    "data-qm-ts-add": "1",
    disabled: !!e.busy,
    onClick: () => {
      l.schedEdit = "__new__", l.schedDraft = {
        // 需求 4（2026-11-24）：开始秒默认 :00、结束秒默认 :59，
        // 消除「结束分钟最后一秒」的空缺（如 23:59:59）。
        id: "",
        name: "",
        start: "08:00:00",
        end: "18:00:59",
        param_set_id: "",
        notify_profile_id: ""
      }, q();
    }
  }, (e.schedules.length, "＋ 添加时间策略"))), n;
}
let be = null, ge = null;
function zs(t, e, n) {
  const a = [
    { v: "ai", l: "自动分析" },
    { v: "recommend", l: "只用推荐" },
    { v: "manual", l: "人工" }
  ], r = (i, f) => {
    e[i] = f, q();
  }, s = () => t.createElement("select", {
    key: "mode",
    value: e.mode,
    "data-qm-ps-mode": e.id || "new",
    onChange: (i) => r("mode", i && i.target ? String(i.target.value) : "manual")
  }, a.map((i) => t.createElement("option", { key: i.v, value: i.v }, i.l))), o = () => {
    const i = [t.createElement("option", { key: "none", value: "" }, "（不指定）")];
    n.tplChoices.forEach((g, k) => {
      i.push(t.createElement(
        "option",
        { key: "t" + k, value: String(g.value) },
        String(g.label)
      ));
    });
    const f = String(e.template_id || "");
    return f && !n.tplChoices.some((g) => String(g.value) === f) && i.push(t.createElement("option", { key: "gone", value: f }, f + "（已删除）")), t.createElement("select", {
      key: "tpl",
      value: f,
      "data-qm-ps-tpl": e.id || "new",
      onChange: (g) => r("template_id", g && g.target ? String(g.target.value) : "")
    }, i);
  }, d = (i, f) => {
    const g = {
      key: "s",
      className: "qm-set-switch" + (e[i] ? " qm-set-switch-on" : ""),
      role: "switch",
      "aria-checked": e[i] ? "true" : "false",
      tabIndex: 0,
      onClick: () => r(i, !e[i])
    };
    return g["data-qm-ps-" + i] = e.id || "new", t.createElement("div", { key: i, className: "qm-set-pitem inline" }, [
      t.createElement("label", { key: "l" }, f),
      t.createElement(
        "div",
        g,
        t.createElement("span", { key: "k", className: "qm-set-knob" })
      )
    ]);
  };
  return t.createElement("div", { className: "qm-set-pmcard", key: "editor" }, [
    t.createElement("div", { className: "qm-set-pmhead", key: "h" }, [
      t.createElement("input", {
        key: "n",
        type: "text",
        className: "qm-set-input",
        style: { flex: "1 1 auto" },
        value: e.name,
        placeholder: "参数组名称（如：夜间全自动）",
        "data-qm-ps-name": e.id || "new",
        onChange: (i) => r("name", i && i.target ? String(i.target.value) : "")
      })
    ]),
    t.createElement("div", { className: "qm-set-pgrid", key: "g" }, [
      t.createElement("div", { className: "qm-set-pitem", key: "mode" }, [
        t.createElement("label", { key: "l" }, "答题模式"),
        s()
      ]),
      t.createElement("div", { className: "qm-set-pitem", key: "tpl" }, [
        t.createElement("label", { key: "l" }, "提示词模板"),
        o()
      ]),
      t.createElement("div", { className: "qm-set-pitem full", key: "model" }, [
        t.createElement("label", { key: "l" }, "默认模型"),
        t.createElement("div", { key: "c" }, po(
          t,
          "psmodel",
          String(e.model_id || ""),
          n.groups,
          (i) => r("model_id", i)
        ))
      ]),
      t.createElement("div", { className: "qm-set-pitem full", key: "sws" }, [
        t.createElement(
          "div",
          { key: "inner", style: { display: "flex", gap: "18px" } },
          [d("with_context", "携带上下文"), d("parallel", "并行分析")]
        )
      ])
    ]),
    t.createElement("div", { className: "qm-set-tsfoot", key: "f" }, [
      t.createElement(
        "span",
        { key: "n", className: "note" },
        n.usedBy.length ? "当前被 " + n.usedBy.length + " 条策略引用：" + n.usedBy.join("、") : "尚未被任何策略引用"
      ),
      t.createElement("button", {
        key: "c",
        type: "button",
        className: "qm-set-btn",
        "data-qm-ps-cancel": e.id || "new",
        onClick: () => {
          be = null, q();
        }
      }, "取消"),
      t.createElement("button", {
        key: "s",
        type: "button",
        className: "qm-set-btn qm-set-btnprimary",
        "data-qm-ps-save": e.id || "new",
        disabled: !!l.libs.busy,
        onClick: () => {
          const i = {
            name: String(be && be.name || "").trim() || "未命名参数组",
            params: {
              mode: e.mode,
              model_id: e.model_id,
              template_id: e.template_id,
              with_context: e.with_context,
              parallel: e.parallel
            }
          };
          e.id && (i.id = e.id), (async () => await cc(i) && (be = null, q()))();
        }
      }, l.libs.busy ? "保存中…" : "保存")
    ])
  ]);
}
function Fc(t, e) {
  const n = l.libs, a = [];
  a.push(t.createElement("div", {
    className: "qm-set-schednote",
    key: "note",
    "data-qm-runs-note": "param-sets"
  }, [
    t.createElement(
      "div",
      { key: "t", className: "qm-set-schednotetitle" },
      "问卷参数组是时间策略的引用对象"
    ),
    t.createElement(
      "div",
      { key: "d", className: "qm-set-schednotedesc" },
      "一条时间策略命中后，会用这里选中的参数组覆盖「默认参数」。被策略引用的参数组不能直接删除（需先解除引用）。"
    )
  ])), n.msg && a.push(t.createElement("div", {
    key: "msg",
    className: "qm-set-schednote",
    style: n.msgKind === "error" ? { borderColor: "#f3c2bd", background: "rgba(217,48,37,.05)", color: "#b3261e" } : void 0,
    "data-qm-libs-msg": n.msgKind
  }, n.msg));
  const r = be ? be.id || "__new__" : "", s = [];
  return n.paramSets.length === 0 && !be && s.push(t.createElement("div", { className: "qm-set-tsempty", key: "empty" }, [
    t.createElement("b", { key: "t" }, "还没有问卷参数组"),
    "可以创建多套参数（如「白天人工」「夜间全自动」），再在时间策略里按时间段引用。"
  ])), n.paramSets.forEach((o, d) => {
    const i = String(o.id || ""), f = (o.used_by || []).map((v) => String(v.name || v.id));
    if (be && r === i) {
      s.push(zs(t, be, {
        groups: e.groups,
        tplChoices: e.tplChoices,
        usedBy: f
      }));
      return;
    }
    const g = o.params || {}, k = {
      ai: "自动分析",
      recommend: "只用推荐",
      manual: "人工"
    }, b = "qm-set-pmused" + (f.length, "");
    s.push(t.createElement("div", {
      className: "qm-set-pmcard",
      key: "ps" + d,
      "data-qm-ps-card": i
    }, [
      t.createElement("div", { className: "qm-set-pmhead", key: "h" }, [
        t.createElement(
          "span",
          { key: "n", className: "qm-set-pmname" },
          String(o.name || "未命名")
        ),
        t.createElement(
          "span",
          { key: "u", className: b },
          f.length ? "被 " + f.length + " 条策略引用" : "未被引用"
        ),
        t.createElement("span", { key: "sp", style: { flex: "1" } }),
        t.createElement("button", {
          key: "e",
          type: "button",
          className: "qm-set-tsbtn",
          "data-qm-ps-edit": i,
          onClick: () => {
            be = {
              id: i,
              name: String(o.name || ""),
              mode: String(g.mode || "manual"),
              model_id: String(g.model_id || ""),
              template_id: String(g.template_id || ""),
              with_context: !!g.with_context,
              parallel: !!g.parallel
            }, q();
          }
        }, "✎ 编辑"),
        t.createElement("button", {
          key: "d",
          type: "button",
          className: "qm-set-tsbtn qm-set-tsdel",
          "data-qm-ps-del": i,
          disabled: !!n.busy,
          title: f.length ? "被策略引用，需先解除引用（或确认后强制删除）" : "删除该参数组",
          onClick: () => {
            ea("ps", i, String(o.name || "未命名参数组"));
          }
        }, "✕")
      ]),
      t.createElement("div", { className: "qm-set-pgrid", key: "g" }, [
        t.createElement("div", { className: "qm-set-pitem", key: "m" }, [
          t.createElement("label", { key: "l" }, "答题模式"),
          t.createElement(
            "span",
            { key: "v", style: { fontSize: "12px" } },
            k[String(g.mode || "")] || "未设置"
          )
        ]),
        t.createElement("div", { className: "qm-set-pitem", key: "md" }, [
          t.createElement("label", { key: "l" }, "默认模型"),
          t.createElement(
            "span",
            { key: "v", style: { fontSize: "12px" } },
            String(g.model_id || "跟随当前对话模型")
          )
        ]),
        t.createElement("div", { className: "qm-set-pitem full", key: "sw" }, [
          t.createElement("div", { key: "i", style: { display: "flex", gap: "18px" } }, [
            t.createElement("span", { key: "c", className: "qm-set-tssw" + (g.with_context ? " on" : "") }, [
              t.createElement("span", { key: "k", className: "mini" }),
              t.createElement("span", { key: "l" }, "携带上下文")
            ]),
            t.createElement("span", { key: "p2", className: "qm-set-tssw" + (g.parallel ? " on" : "") }, [
              t.createElement("span", { key: "k", className: "mini" }),
              t.createElement("span", { key: "l" }, "并行分析")
            ])
          ])
        ])
      ])
    ]));
  }), be && r === "__new__" && s.push(zs(t, be, {
    groups: e.groups,
    tplChoices: e.tplChoices,
    usedBy: []
  })), a.push(t.createElement("div", { className: "qm-set-pmlist", key: "list" }, s)), be && r === "__new__" || a.push(t.createElement("button", {
    type: "button",
    key: "add",
    className: "qm-set-btn qm-set-btnnew qm-set-pmadd",
    "data-qm-ps-add": "1",
    disabled: !!n.busy,
    onClick: () => {
      be = {
        id: "",
        name: "",
        mode: "manual",
        model_id: "",
        template_id: "",
        with_context: !1,
        parallel: !1
      }, q();
    }
  }, "＋ 新建问卷参数组")), a;
}
function Wc(t) {
  const e = l.libs, n = [];
  n.push(t.createElement("div", {
    className: "qm-set-schednote",
    key: "note",
    "data-qm-runs-note": "notify-profiles"
  }, [
    t.createElement(
      "div",
      { key: "t", className: "qm-set-schednotetitle" },
      "命名通知配置，供时间策略按时间段引用"
    ),
    t.createElement(
      "div",
      { key: "d", className: "qm-set-schednotedesc" },
      "一条配置只描述「用哪个渠道」，渠道凭据（Token / Webhook）仍由各渠道自身维护。因此同一份配置可以被多条策略安全引用。"
    )
  ]));
  const a = (o) => {
    const d = (l.notifyChannels || []).filter((f) => o !== "bg" || String(f.channel) !== "browser").map((f) => ({ v: String(f.channel || "off"), l: String(f.label || f.channel) }));
    return d.some((f) => f.v === "off") ? d : [{ v: "off", l: "关闭" }].concat(d);
  };
  e.msg && n.push(t.createElement("div", {
    key: "msg",
    className: "qm-set-schednote",
    style: e.msgKind === "error" ? { borderColor: "#f3c2bd", background: "rgba(217,48,37,.05)", color: "#b3261e" } : void 0,
    "data-qm-libs-msg": e.msgKind
  }, e.msg));
  const r = [], s = ge ? ge.id || "__new__" : "";
  if (e.notifyProfiles.length === 0 && !ge && r.push(t.createElement("div", { className: "qm-set-tsempty", key: "empty" }, [
    t.createElement("b", { key: "t" }, "还没有通知配置"),
    "创建后可在时间策略里按时间段引用（如夜间用值班号，白天用工作群）。"
  ])), e.notifyProfiles.forEach((o, d) => {
    const i = String(o.id || ""), f = (o.used_by || []).map((b) => String(b.name || b.id)), g = o.channels || {};
    if (ge && s === i) {
      const b = ge, v = (u, _) => {
        b[u] = _, q();
      }, y = (u) => {
        const _ = {
          key: u,
          value: String(b[u] || "off"),
          onChange: (N) => v(u, N && N.target ? String(N.target.value) : "off")
        };
        return _["data-qm-np-" + u] = i, t.createElement("select", _, a(u).map(
          (N) => t.createElement("option", { key: N.v, value: N.v }, N.l)
        ));
      };
      r.push(t.createElement("div", { className: "qm-set-pmcard", key: "ed" + d }, [
        t.createElement("div", { className: "qm-set-pmhead", key: "h" }, [
          t.createElement("input", {
            key: "n",
            type: "text",
            className: "qm-set-input",
            style: { flex: "1 1 auto" },
            value: b.name,
            placeholder: "配置名称（如：值班号通知）",
            "data-qm-np-name": i,
            onChange: (u) => v("name", u && u.target ? String(u.target.value) : "")
          })
        ]),
        t.createElement("div", { className: "qm-set-pgrid", key: "g" }, [
          t.createElement("div", { className: "qm-set-pitem", key: "pc" }, [
            t.createElement("label", { key: "l" }, "PC 端打开时"),
            y("pc")
          ]),
          t.createElement("div", { className: "qm-set-pitem", key: "bg" }, [
            t.createElement("label", { key: "l" }, "后台运行时"),
            y("bg")
          ])
        ]),
        t.createElement("div", { className: "qm-set-tsfoot", key: "f" }, [
          t.createElement(
            "span",
            { key: "n", className: "note" },
            f.length ? "被 " + f.length + " 处引用" : "尚未被引用"
          ),
          t.createElement("button", {
            key: "c",
            type: "button",
            className: "qm-set-btn",
            "data-qm-np-cancel": i,
            onClick: () => {
              ge = null, q();
            }
          }, "取消"),
          t.createElement("button", {
            key: "s",
            type: "button",
            className: "qm-set-btn qm-set-btnprimary",
            "data-qm-np-save": i,
            disabled: !!e.busy,
            onClick: () => {
              const u = {
                name: String(b.name || "").trim() || "未命名通知配置",
                channels: { pc: b.pc || "off", bg: b.bg || "off" }
              };
              b.id && (u.id = b.id), (async () => await qs(u) && (ge = null, q()))();
            }
          }, e.busy ? "保存中…" : "保存")
        ])
      ]));
      return;
    }
    const k = (b) => {
      const v = (l.notifyChannels || []).filter((y) => String(y.channel) === String(b))[0];
      return v ? String(v.label || b) : b === "off" ? "关闭" : b;
    };
    r.push(t.createElement("div", {
      className: "qm-set-pmcard",
      key: "np" + d,
      "data-qm-np-card": i
    }, [
      t.createElement("div", { className: "qm-set-pmhead", key: "h" }, [
        t.createElement(
          "span",
          { key: "n", className: "qm-set-pmname" },
          String(o.name || "未命名")
        ),
        t.createElement(
          "span",
          { key: "u", className: "qm-set-pmused" },
          f.length ? "被 " + f.length + " 处引用" : "未被引用"
        ),
        t.createElement("span", { key: "sp", style: { flex: "1" } }),
        t.createElement("button", {
          key: "e",
          type: "button",
          className: "qm-set-tsbtn",
          "data-qm-np-edit": i,
          onClick: () => {
            ge = {
              id: i,
              name: String(o.name || ""),
              pc: String(g.pc || "off"),
              bg: String(g.bg || "off")
            }, q();
          }
        }, "✎ 编辑"),
        t.createElement("button", {
          key: "d",
          type: "button",
          className: "qm-set-tsbtn qm-set-tsdel",
          "data-qm-np-del": i,
          disabled: !!e.busy,
          onClick: () => {
            ea("np", i, String(o.name || "未命名通知配置"));
          }
        }, "✕")
      ]),
      t.createElement("div", { className: "qm-set-pgrid", key: "g" }, [
        t.createElement("div", { className: "qm-set-pitem", key: "pc" }, [
          t.createElement("label", { key: "l" }, "PC 端打开时"),
          t.createElement(
            "span",
            { key: "v", style: { fontSize: "12px" } },
            k(String(g.pc || "off"))
          )
        ]),
        t.createElement("div", { className: "qm-set-pitem", key: "bg" }, [
          t.createElement("label", { key: "l" }, "后台运行时"),
          t.createElement(
            "span",
            { key: "v", style: { fontSize: "12px" } },
            k(String(g.bg || "off"))
          )
        ])
      ])
    ]));
  }), ge && s === "__new__") {
    const o = ge, d = (f, g) => {
      o[f] = g, q();
    }, i = (f) => {
      const g = {
        key: f,
        value: String(o[f] || "off"),
        onChange: (k) => d(f, k && k.target ? String(k.target.value) : "off")
      };
      return g["data-qm-np-" + f] = "new", t.createElement("select", g, a(f).map(
        (k) => t.createElement("option", { key: k.v, value: k.v }, k.l)
      ));
    };
    r.push(t.createElement("div", { className: "qm-set-pmcard", key: "new" }, [
      t.createElement("div", { className: "qm-set-pmhead", key: "h" }, [
        t.createElement("input", {
          key: "n",
          type: "text",
          className: "qm-set-input",
          style: { flex: "1 1 auto" },
          value: o.name,
          placeholder: "配置名称（如：值班号通知）",
          "data-qm-np-name": "new",
          onChange: (f) => d("name", f && f.target ? String(f.target.value) : "")
        })
      ]),
      t.createElement("div", { className: "qm-set-pgrid", key: "g" }, [
        t.createElement("div", { className: "qm-set-pitem", key: "pc" }, [
          t.createElement("label", { key: "l" }, "PC 端打开时"),
          i("pc")
        ]),
        t.createElement("div", { className: "qm-set-pitem", key: "bg" }, [
          t.createElement("label", { key: "l" }, "后台运行时"),
          i("bg")
        ])
      ]),
      t.createElement("div", { className: "qm-set-tsfoot", key: "f" }, [
        t.createElement("span", { key: "n", className: "note" }, "保存后可被时间策略引用"),
        t.createElement("button", {
          key: "c",
          type: "button",
          className: "qm-set-btn",
          "data-qm-np-cancel": "new",
          onClick: () => {
            ge = null, q();
          }
        }, "取消"),
        t.createElement("button", {
          key: "s",
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          "data-qm-np-save": "new",
          disabled: !!e.busy,
          onClick: () => {
            const f = {
              name: String(o.name || "").trim() || "未命名通知配置",
              channels: { pc: o.pc || "off", bg: o.bg || "off" }
            };
            (async () => await qs(f) && (ge = null, q()))();
          }
        }, e.busy ? "保存中…" : "保存")
      ])
    ]));
  }
  return n.push(t.createElement("div", { className: "qm-set-pmlist", key: "list" }, r)), ge && s === "__new__" || n.push(t.createElement("button", {
    type: "button",
    key: "add",
    className: "qm-set-btn qm-set-btnnew qm-set-pmadd",
    "data-qm-np-add": "1",
    disabled: !!e.busy,
    onClick: () => {
      ge = { id: "", name: "", pc: "off", bg: "off" }, q();
    }
  }, "＋ 新建通知配置")), n;
}
function Kc(t, e, n, a) {
  return t.createElement("div", {
    className: "qm-set-schednote",
    key: "note-" + e,
    "data-qm-runs-note": e
  }, [
    t.createElement("div", { key: "t", className: "qm-set-schednotetitle" }, n),
    t.createElement("div", { key: "d", className: "qm-set-schednotedesc" }, a)
  ]);
}
function Hc(t, e) {
  const n = [];
  n.push(Kc(
    t,
    "behavior",
    "这些是全局行为参数，不随时段变化",
    "控制分析超时、等待提示阈值与拦截日志保留量；对全部会话统一生效。"
  ));
  const a = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒（默认）": 120,
    "300 秒": 300,
    "600 秒": 600
  }, r = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, s = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒": 120,
    "180 秒（默认）": 180,
    "300 秒": 300,
    "600 秒": 600
  }, o = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  };
  n.push(en(
    t,
    "e6",
    "单题分析超时",
    tn(
      t,
      "sel4",
      r[Number(lt("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
      ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
      (k) => xe("model_timeout_sec", a[k] ?? 120)
    ),
    "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
    "global",
    e
  )), n.push(en(
    t,
    "d4",
    "等待提示阈值",
    tn(
      t,
      "sel5",
      o[Number(lt("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
      ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
      (k) => xe("wait_hint_sec", s[k] ?? 180)
    ),
    "超过后提示可释放（保护下限 30 秒）",
    "global",
    e
  ));
  const d = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], i = {
    不保留: 0,
    "最近 50 条": 50,
    "最近 200 条（默认）": 200,
    "最近 500 条": 500,
    "最近 1000 条": 1e3
  }, f = {
    0: "不保留",
    50: "最近 50 条",
    200: "最近 200 条（默认）",
    500: "最近 500 条",
    1e3: "最近 1000 条"
  }, g = Number(lt("gate_log_limit", 200, "global"));
  return n.push(en(
    t,
    "d5",
    "拦截记录",
    tn(
      t,
      "sel6",
      f[g] || "最近 200 条（默认）",
      d,
      (k) => xe("gate_log_limit", i[k] ?? 200)
    ),
    "用于排查卡住问题；“不保留”= 不记录",
    "global",
    e
  )), n;
}
function Uc(t, e, n) {
  const a = [], r = Oc(), s = $c(), o = (x, T, E, $) => t.createElement("div", { className: "qm-set-schedfield", key: x }, [
    t.createElement(
      "span",
      { className: "qm-set-schedfieldlabel", key: "l" },
      T,
      $ ? t.createElement("span", { key: "r", className: "qm-apireq" }, "*") : null
    ),
    E
  ]), d = (x, T, E) => t.createElement("div", { className: "qm-apisysrow", key: "sys-" + x }, [
    t.createElement("span", { key: "n", className: "qm-apisysname" }, x),
    t.createElement("span", { key: "d", className: "qm-apisysval" }, T),
    t.createElement("span", { key: "t", className: "qm-apisystag" }, E)
  ]), i = t.createElement("div", { className: "qm-apisysblock", key: "sysblock" }, [
    t.createElement(
      "div",
      { key: "h", className: "qm-set-schedfieldlabel" },
      "系统字段（自动携带，不可删除）"
    ),
    d("title", "{{title}}", "系统必传"),
    d("content", "{{content}}", "系统必传"),
    t.createElement(
      "div",
      {
        key: "tip",
        className: "qm-set-apinote",
        style: { marginTop: 4 }
      },
      "另有 {{count}} 题数、{{stamp}} 时间戳、{{token}} 可在参数值中引用。"
    )
  ]), f = A.params.map((x, T) => {
    const E = !!String(x.key || "").trim() && (!Pc(x.key) || s.has(T)), $ = x.required && !String(x.value || "").trim();
    return t.createElement("div", {
      key: "prow-" + T,
      className: "qm-apiparamrow" + ($ ? " miss" : ""),
      "data-qm-api-paramrow": String(T)
    }, [
      t.createElement("input", {
        key: "k",
        type: "text",
        className: "qm-apipk" + (E ? " bad" : ""),
        value: x.key,
        placeholder: "参数名",
        "data-qm-api-paramkey": String(T),
        title: s.has(T) ? "参数名重复" : E ? "参数名只能包含字母、数字、下划线、点、连字符" : "对方 API 要求的参数名",
        onChange: (S) => {
          A.params[T].key = S && S.target ? String(S.target.value) : "", Jt(), q();
        }
      }),
      t.createElement("input", {
        key: "v",
        type: "text",
        className: "qm-apipv" + ($ ? " bad" : ""),
        value: x.value,
        placeholder: "参数值，可写 {{title}}",
        "data-qm-api-paramvalue": String(T),
        title: $ ? "必传参数不能为空" : "支持 {{title}} {{content}} {{count}} {{stamp}} {{token}}",
        onChange: (S) => {
          A.params[T].value = S && S.target ? String(S.target.value) : "", Jt(), q();
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
          checked: !!x.required,
          "data-qm-api-paramreq": String(T),
          onChange: (S) => {
            A.params[T].required = !!(S && S.target && S.target.checked), Jt(), q();
          }
        }),
        "必填"
      ]),
      t.createElement("button", {
        key: "d",
        type: "button",
        className: "qm-apidel",
        title: "删除此行",
        "data-qm-api-paramdel": String(T),
        onClick: () => {
          A.params.splice(T, 1), Jt(), q();
        }
      }, "✕")
    ]);
  }), g = t.createElement("div", { key: "ptable" }, [
    t.createElement("div", { key: "head", className: "qm-apiparamhead" }, [
      t.createElement("span", { key: "k", style: { flex: "0 0 34%" } }, "参数名"),
      t.createElement("span", { key: "v", style: { flex: "1 1 auto" } }, "参数值"),
      t.createElement("span", { key: "r", style: { flex: "0 0 44px" } }, "必填"),
      t.createElement("span", { key: "d", style: { flex: "0 0 24px" } }, "")
    ]),
    ...f,
    t.createElement("button", {
      key: "add",
      type: "button",
      className: "qm-apiadd",
      "data-qm-api-paramadd": "1",
      title: "新增一行自定义参数",
      onClick: () => {
        if (A.params.length >= 20) {
          F("warning", "最多 20 个自定义参数");
          return;
        }
        A.params.push({ key: "", value: "", required: !1 }), Jt(), q();
      }
    }, "+ 新增参数行")
  ]), k = String(A.url || "").trim(), b = k ? or(k, Object.fromEntries(
    Object.entries(Zt).map(([x, T]) => [x, encodeURIComponent(String(T))])
  )) : "（未填请求地址）", v = /\{\{\s*(title|content|count|stamp|token)\s*\}\}/.test(k);
  let y = "";
  if (A.mode === "advanced")
    y = or(String(A.bodyTpl || ""), Zt) || "（高级模式未填写 body 模板）";
  else {
    const x = {
      title: Zt.title,
      content: Zt.content
    };
    A.params.forEach((T) => {
      const E = String(T.key || "").trim();
      E && (x[E] = or(String(T.value || ""), Zt));
    }), y = JSON.stringify(x, null, 2);
  }
  const u = t.createElement("div", { key: "preview" }, [
    t.createElement("div", { key: "l1", className: "qm-apipreviewlabel" }, "请求预览"),
    t.createElement(
      "pre",
      {
        key: "u",
        className: "qm-apipreview",
        "data-qm-api-preview": "url"
      },
      (String(A.method) === "get_query" ? "GET " : "POST ") + b
    ),
    // URL 支持占位符插值时的说明（GET/POST 都适用，boss 需求 2）
    v ? t.createElement(
      "div",
      {
        key: "uptip",
        className: "qm-set-apinote",
        style: { marginTop: 2, marginBottom: 4 },
        "data-qm-api-urlph": "1"
      },
      "地址中的占位符已按示例值替换；实际发送时用真实标题/正文（自动 URL 编码）。"
    ) : null,
    String(A.method) === "get_query" ? null : t.createElement("pre", {
      key: "b",
      className: "qm-apipreview",
      "data-qm-api-preview": "body"
    }, y)
  ]), _ = t.createElement("div", {
    key: "status",
    className: "qm-apistatus " + (r.length ? "miss" : "ok"),
    "data-qm-api-status": r.length ? "missing" : "ok"
  }, [
    t.createElement("span", { key: "i" }, r.length ? "⚠" : "✓"),
    t.createElement(
      "span",
      { key: "t" },
      r.length ? "还缺 " + r.length + " 项必传参数：" + r.join("、") : "必传项已填齐，可以测试发送"
    )
  ]), N = r.length === 0 && !!String(A.url || "").trim(), P = t.createElement("div", {
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
        disabled: !N,
        style: N ? void 0 : { opacity: 0.45, cursor: "not-allowed" },
        title: N ? "按当前配置真实发送一次" : "还缺：" + r.join("、"),
        onClick: () => {
          N && (it = { ok: !0, text: "正在发送…" }, q(), (async () => {
            try {
              await so();
              const T = await (await fetch(L("/question-modal/notify/test"), {
                method: "POST",
                headers: j(),
                body: JSON.stringify({ channel: "custom_api" })
              })).json(), E = !!(T && (T.ok || T.delivered));
              let $ = "";
              E ? $ = "发送成功" + (T && T.http ? "（HTTP " + T.http + "）" : "") + (T && T.elapsed_ms !== void 0 ? " · " + T.elapsed_ms + "ms" : "") : $ = "发送失败：" + (T && (T.reason || T.error) || "未知原因"), it = { ok: E, text: $ };
            } catch (x) {
              it = { ok: !1, text: "发送失败：" + (x && x.message || x) };
            }
            q();
          })());
        }
      }, "发送测试")
    ]),
    it ? t.createElement("div", {
      key: "res",
      className: "qm-apitestres " + (it.ok ? "ok" : "err"),
      "data-qm-api-testresult": it.ok ? "ok" : "err"
    }, it.text) : null
  ]);
  return a.push(t.createElement("div", {
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
        className: "qm-set-apiswitch" + (A.enabled ? " on" : ""),
        "data-qm-api-switch": "1",
        "aria-checked": A.enabled ? "true" : "false",
        title: A.enabled ? "已启用" : "已停用",
        onClick: () => {
          A.enabled = !A.enabled, xe("custom_api_enabled", A.enabled), q();
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
    _,
    // URL
    o("furl", "请求地址", t.createElement("input", {
      key: "url",
      type: "text",
      className: "qm-set-input",
      value: A.url,
      // 提示可写占位符：GET/POST 都支持（boss 2026-11-23 需求 2）
      placeholder: "https://api.example.com/hook 或 …/{{title}}/{{content}}",
      "data-qm-api-url": "1",
      onChange: (x) => {
        A.url = x && x.target ? String(x.target.value) : "", xe("custom_api_url", A.url), q();
      }
    }), !0),
    // 请求方法 + Token 位置
    t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
      o("fmethod", "请求方法", t.createElement("select", {
        key: "method",
        className: "qm-set-native",
        value: A.method,
        "data-qm-api-method": "1",
        onChange: (x) => {
          A.method = x && x.target ? String(x.target.value) : "post_json", xe("custom_api_method", A.method), q();
        }
      }, [
        t.createElement("option", { key: "p", value: "post_json" }, "POST（JSON）"),
        t.createElement("option", { key: "g", value: "get_query" }, "GET（query 传参）")
      ])),
      o("ftpos", "Token 位置（可选）", t.createElement("select", {
        key: "tp",
        className: "qm-set-native",
        value: A.tokenPos,
        "data-qm-api-tokenpos": "1",
        onChange: (x) => {
          A.tokenPos = x && x.target ? String(x.target.value) : "none", xe("custom_api_token_pos", A.tokenPos), q();
        }
      }, [
        t.createElement("option", { key: "n", value: "none" }, "不携带 token"),
        t.createElement("option", { key: "b", value: "bearer" }, "Authorization: Bearer 头"),
        t.createElement("option", { key: "q", value: "query" }, "query 参数 token=…")
      ]))
    ]),
    // Token
    o(
      "ftoken",
      A.tokenSet ? "Token（已设置，留空则不修改）" : "Token（可选）",
      t.createElement("input", {
        key: "tk",
        type: "password",
        className: "qm-set-input",
        value: A.token,
        placeholder: A.tokenSet ? "已保存，留空则不修改" : "选填",
        "data-qm-api-token": "1",
        onChange: (x) => {
          A.token = x && x.target ? String(x.target.value) : "", A.token && xe("custom_api_token", A.token), q();
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
          checked: A.mode === "advanced",
          "data-qm-api-advmode": "1",
          onChange: (x) => {
            A.mode = x && x.target && x.target.checked ? "advanced" : "basic", xe("custom_api_mode", A.mode), q();
          }
        }),
        "高级模式（自己写完整 body 模板）"
      ])
    ]),
    A.mode === "advanced" ? o("fbody", "body 模板", t.createElement("textarea", {
      key: "bd",
      className: "qm-apibody" + (r.indexOf("body 模板") >= 0 ? " bad" : ""),
      value: A.bodyTpl,
      placeholder: '{"msgtype":"text","text":{"content":"{{content}}"}}',
      "data-qm-api-body": "1",
      onChange: (x) => {
        A.bodyTpl = x && x.target ? String(x.target.value) : "", xe("custom_api_body", A.bodyTpl), q();
      }
    }), !0) : null,
    // 系统字段（锁） + 自定义参数行（仅基础模式显示参数表）
    i,
    A.mode === "advanced" ? null : g,
    u,
    P
  ])), a;
}
function Gc(t, e, n, a, r) {
  let s = e;
  const o = [], d = n === "session" ? "session" : "global", i = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, f = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, g = r && r.templateOptions || [];
  r && r.modelOptions;
  const k = r && r.providerGroups || [], b = g.map((u) => {
    const _ = l.templates.filter((N) => String(N.id) === String(u))[0];
    return { value: u, label: _ && (_.name || _.id) || u };
  }), v = l.runSub || "default", y = Nc[v] || v;
  if ((s === "session" || s === "default" || s === "global" || s === "prompt") && (s = "run"), s === "run" && o.push(t.createElement("div", {
    className: "qm-set-subtabs",
    key: "subtabs",
    "data-qm-runs-sub": y
  }, _c.map((u, _) => {
    const N = u.key === "param-sets" ? l.libs.paramSets.length : u.key === "notify-profiles" ? l.libs.notifyProfiles.length : u.key === "prompt" ? l.templates.length : 0, P = [u.label];
    return N && P.push(t.createElement("span", { key: "n", className: "n" }, String(N))), t.createElement("button", {
      key: "st" + _,
      type: "button",
      className: "qm-set-subtab" + (y === u.key ? " qm-set-subtabon" : ""),
      "data-qm-runs-sub-btn": u.key,
      onClick: () => {
        l.runSub = u.key, q();
      }
    }, P);
  }))), s === "schedule")
    return o.push(...Dc(t)), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "param-sets")
    return o.push(...Fc(t, { groups: k, tplChoices: b })), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "notify-profiles")
    return o.push(...Wc(t)), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "default") {
    o.push(t.createElement("div", {
      className: "qm-set-schednote",
      key: "notedef",
      "data-qm-runs-note": "default"
    }, [
      t.createElement(
        "div",
        { key: "t", className: "qm-set-schednotetitle" },
        "默认参数的生效时机"
      ),
      t.createElement(
        "div",
        { key: "d", className: "qm-set-schednotedesc" },
        "所有时间策略都未命中时使用这份参数。它是全局唯一的一份配置，对全部会话生效（不再区分会话级与默认级）。"
      )
    ]));
    const u = String(lt("mode", "manual", "global"));
    return o.push(...lr(t, Ns, {
      scope: d,
      currentMode: u,
      modeLabel: f,
      modeByLabel: i,
      groups: k,
      tplChoices: b,
      tplOpts: g,
      explicitEmptyModel: tr("model_id"),
      edit: xe
    })), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  }
  if (s === "run" && y === "backup")
    return !l.cfgBackup.items.length && !l.cfgBackup.dataDir && Dn(), o.push(...lc(t)), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "custom-api")
    return o.push(...Uc(t)), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "behavior")
    return o.push(...Hc(t, d)), t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
  if (s === "run" && y === "prompt" && (s = "prompt"), s === "session") {
    const u = String(lt("mode", "manual"));
    o.push(...lr(t, Mc, {
      scope: d,
      currentMode: u,
      modeLabel: f,
      modeByLabel: i,
      groups: k,
      tplChoices: b,
      tplOpts: g,
      explicitEmptyModel: tr("model_id"),
      edit: xe
    }));
  } else if (s === "global" || s === "default") {
    if (s === "default") {
      const _ = String(lt("mode", "manual", "global"));
      o.push(...lr(t, Ns, {
        scope: d,
        currentMode: _,
        modeLabel: f,
        modeByLabel: i,
        groups: k,
        tplChoices: b,
        tplOpts: g,
        explicitEmptyModel: tr("model_id"),
        edit: xe
      }));
    }
  } else if (s === "prompt") {
    const u = l.templates, _ = l.tplEdit;
    if (o.push(en(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      d
    )), u.length ? o.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      u.map((N, P) => {
        const x = !!N.builtin, E = (String(N.note || N.desc || "").trim() || String(N.system || N.system_prompt || N.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), $ = E.length > 90 ? E.slice(0, 90) + "…" : E;
        return t.createElement("div", { className: "qm-set-item", key: "i" + P }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(N.name || N.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (x ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, x ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(N.id),
              onClick: () => {
                bc(String(N.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (x ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(N.id),
              disabled: x,
              title: x ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                x || kc(String(N.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, $)
        ]);
      })
    )) : o.push(t.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), o.push(t.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      t.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          hc();
        }
      }, "＋ 新建模板")
    ])), _) {
      const N = (P, x, T, E, $) => {
        var S, M;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + x }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, P),
          T ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: E,
            "data-qm-tpl-field": x,
            placeholder: $,
            value: String(((S = l.tplEdit) == null ? void 0 : S[x]) || ""),
            onChange: (I) => _s(x, I && I.target ? I.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": x,
            placeholder: $,
            value: String(((M = l.tplEdit) == null ? void 0 : M[x]) || ""),
            onChange: (I) => _s(x, I && I.target ? I.target.value : "")
          })
        ]);
      };
      o.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (_.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          _.id ? "编辑模板：" + (_.name || _.id) : "新建模板"
        ),
        N("模板名称", "name", !1, 0, "如：简短结论版"),
        N(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        N(
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
              xc();
            }
          }, l.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              yc();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (s === "stale") {
    const u = l.stale, _ = u && u.rows || [], N = u && u.exceeded || [], P = u && u.within || [], x = (u && u.blocking || []).length ? u.blocking : _.filter((J) => J && J.nature === "blocking"), T = (u && u.residual || []).length ? u.residual : _.filter((J) => J && J.nature !== "blocking"), E = x.filter(
      (J) => J && N.some(
        (Y) => Y.tool_call_id === J.tool_call_id
      )
    ), $ = u ? u.threshold : null, S = pr($), M = $ !== null && $ <= 0, I = !!(u && (u.busy || u.thrBusy)) || E.length === 0 || M, me = !!(u && (u.busy || u.thrBusy)) || T.length === 0;
    if (o.push(t.createElement("div", {
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
            M ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${S} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(u && u.thrBusy),
            value: $ === null ? "" : String($),
            onChange: (J) => {
              const Y = Number(J.target.value);
              l.draft.release_after_sec = Y, l.stale.threshold = Y, l.stale.msgKind = "", l.stale.msg = "已选择「" + pr(Y) + "」，点下方「保存」后生效", q();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            $ === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
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
          disabled: !!(u && u.busy),
          onClick: () => {
            kl();
          }
        }, u && u.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: I,
          title: M ? "自动释放已关闭，请逐条释放" : E.length ? `释放全部 ${E.length} 条已超阈值的阻塞问卷（观察期内 ${P.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            vl();
          }
        }, E.length ? `全部释放（阻塞·已超阈值 ${E.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: me,
          title: T.length ? `清理全部 ${T.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            wl();
          }
        }, T.length ? `全部清理（残留 ${T.length} 条）` : "全部清理")
      ])
    ])), u && u.msg && o.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": u.msgKind || "info"
    }, u.msg)), u && u.scanned && _.length === 0 && o.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!u || !u.scanned) && (u && u.msg || o.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), _.length) {
      const Y = {};
      N.forEach((O) => {
        Y[O.tool_call_id] = !0;
      });
      const H = (O, R) => {
        if (!O) return;
        const ke = () => {
          l.stale.copied = R, q(), setTimeout(() => {
            l.stale.copied === R && (l.stale.copied = "", q());
          }, 1600);
        };
        try {
          const Z = typeof navigator < "u" ? navigator : null;
          if (Z && Z.clipboard && Z.clipboard.writeText)
            Z.clipboard.writeText(O).then(ke, ke);
          else {
            const ce = document.createElement("textarea");
            ce.value = O, document.body.appendChild(ce), ce.select(), document.execCommand("copy"), document.body.removeChild(ce), ke();
          }
        } catch {
          ke();
        }
      }, Ie = (O, R) => {
        const ke = !!O.terminable, Z = !!Y[O.tool_call_id], ce = R === "blocking", Q = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const ae = O.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${O.idle_text}，阈值 ${S}）${ae}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && Va([O.tool_call_id]);
        }, V = !!(u && u.copied) && u.copied === O.tool_call_id, qe = (ae) => {
          const Ee = Number(ae);
          if (!ae || !isFinite(Ee) || Ee <= 0) return "-";
          try {
            return new Date(Ee * 1e3).toLocaleString();
          } catch {
            return "-";
          }
        }, ne = (ae, Ee, Oe, Xe) => t.createElement("div", { className: "qm-set-stalemetaitem", key: ae }, [
          t.createElement("span", {
            className: "qm-set-stalemetalabel",
            key: "l"
          }, Ee),
          t.createElement("span", {
            className: "qm-set-stalemetavalue",
            key: "v",
            ...Xe || {}
          }, Oe)
        ]);
        return t.createElement("div", {
          className: "qm-set-stalecard",
          key: O.tool_call_id + ":" + R,
          "data-qm-stale-row": O.tool_call_id,
          "data-qm-stale-nature": R,
          "data-qm-stale-group": Z ? "exceeded" : "within"
        }, [
          t.createElement("div", { className: "qm-set-stalecardhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-stalecardtitle", key: "t" },
              O.title || "(无标题)"
            ),
            // 把「它是什么性质/为什么没被自动释放」直接写在卡上，省得翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              O.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : O.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : O.reason_code === "no-future" ? "无唤醒句柄" : O.reason_code === "future-done" ? "已结束未收尾" : Z ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            O.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { color: "#e67e22" }
            }, "正在作答") : null,
            O.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl"
            }, "模型分析中") : null
          ]),
          t.createElement("div", { className: "qm-set-stalecardmeta", key: "m" }, [
            ne("agent", "归属", O.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            ne(
              "sid",
              "会话 ID",
              V ? "✓ 会话 ID 已复制" : O.session_id || "-",
              {
                title: V ? "已复制到剪贴板" : O.session_id ? "点击复制完整会话 ID：" + O.session_id : "",
                style: O.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: V ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": O.tool_call_id,
                onClick: () => {
                  H(String(O.session_id || ""), O.tool_call_id);
                }
              }
            ),
            ne("tcid", "问卷 ID", O.tool_call_id || "-"),
            ne("idle", "挂起时长", O.idle_text || "-"),
            ne("created", "发起时间", qe(O.created_at)),
            ne("mode", "作答模式", O.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...ce ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": O.tool_call_id,
                disabled: !!(u && u.busy),
                title: Z ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  Z ? Va([O.tool_call_id]) : Q();
                }
              }, Z ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": O.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(u && u.busy) || !ke,
                title: ke ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  ql([O.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": O.tool_call_id,
                disabled: !!(u && u.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  Va([O.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, Ae = (O, R, ke, Z, ce) => {
        if (!Z || !Z.length) return null;
        const Q = Math.max(1, Math.ceil(Z.length / 5)), V = Math.min(
          Math.max(0, Number(u[ce]) || 0),
          Q - 1
        ), qe = Z.slice(
          V * 5,
          V * 5 + 5
        ), ne = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": O
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": O
            }, R),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, ke)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": O
          }, qe.map((ae) => Ie(ae, O)))
        ];
        if (Q > 1) {
          const ae = (Oe) => {
            l.stale[ce] = Oe, q();
          }, Ee = (Oe, Xe, Nt, ut) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: ut,
            "data-qm-stale-page": String(Xe),
            disabled: Nt,
            onClick: () => {
              ae(Xe);
            }
          }, Oe);
          ne.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": O
          }, [
            Ee("上一页", V - 1, V <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(V + 1)
            }, `第 ${V + 1} / ${Q} 页（共 ${Z.length} 条，每页 5 条）`),
            Ee("下一页", V + 1, V >= Q - 1, "next")
          ]));
        }
        return ne;
      }, te = Ae(
        "blocking",
        `🔴 正在阻塞会话（${x.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        x,
        "page"
      ), D = Ae(
        "residual",
        `⚪ 异常残留（${T.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        T,
        "resPage"
      );
      te && o.push(...te), D && o.push(...D);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
}
function Jc(t) {
  const { R: e, open: n, onClose: a } = t;
  if (!n) return null;
  const r = Ve(), s = r && r.Modal, o = !t.tab, d = t.tab || "", i = co(d) ? "session" : "global", f = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    sr.map((te) => e.createElement("button", {
      key: te.key,
      type: "button",
      className: "qm-set-tab" + (!o && te.key === d ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(te.key);
        } catch {
        }
      }
    }, te.label))
  ), g = sr.filter((te) => te.key === d)[0] || sr[0], k = t.cfg && t.cfg.schedule || null, b = k && k.name ? String(k.name) : "默认参数", v = k ? "schedule" : "default", y = e.createElement("div", {
    className: "qm-set-runtime-wrap",
    key: "rtw",
    "data-qm-runtime-wrap": "1",
    title: k ? "当前命中时间策略：" + b : "当前未命中任何时间策略，使用默认参数"
  }, [
    e.createElement("span", {
      className: "qm-set-runtime-label",
      key: "rtl"
    }, "当前生效："),
    // 纯展示元素（div 而非 button）：不可点、无 onClick、无 hover。
    // 用 div 而不是 disabled button，避免被当成"禁用控件"而显得可点。
    e.createElement("div", {
      className: "qm-set-runtime",
      key: "rt",
      "data-qm-runtime": v,
      "data-qm-scope-badge": v
    }, b)
  ]), u = e.createElement("button", {
    key: "close",
    type: "button",
    className: "qm-set-close",
    "data-qm-close": "1",
    title: "关闭",
    "aria-label": "关闭设置",
    onClick: () => {
      try {
        a();
      } catch {
      }
    }
  }, "✕"), _ = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      y,
      u
    ])
  ]), N = g.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, g.hint) : null, P = null, x = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((te) => e.createElement("div", {
    key: "sk" + te,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: te * 0.15 + "s"
    }
  }))) : null, T = o ? x : Gc(e, d, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), E = t.dirtyCount || 0, $ = String(t.tab || ""), S = String(l.runSub || "default");
  let M;
  $ === "schedule" ? M = "时间策略与参数库是即时保存的（每次「完成」立即生效，无需点这里）" : $ === "run" && S === "param-sets" ? M = "问卷参数组即时保存；此按钮用于保存下方的全局基础配置改动" : $ === "run" && S === "notify-profiles" ? M = "通知配置即时保存；通知渠道改动需点此保存" : $ === "run" && S === "prompt" ? M = "保存提示词模板（模板库对全部会话共享，不改运行模式）" : $ === "run" && S === "custom-api" ? M = "自定义 API 配置属于全局基础配置，改动据此按钮保存后生效" : $ === "run" && S === "behavior" ? M = "这些行为参数属于全局基础配置，对全部会话统一生效" : $ === "run" ? M = "保存到全局基础配置（所有会话共用同一份，改动立即对全部会话生效）" : M = "保存当前页签的改动";
  const I = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      E ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + E + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, M)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      E > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          oo(), q();
        }
      }, "撤销") : null,
      // 保存按钮在「时间策略」页隐藏（2026-11-23）：
      // 该页所有写操作都是即时的（策略/参数组/通知配置各自走 CRUD 端点），
      // 展示一个"保存"按钮却什么也不保存，属**假控件** —— 用户点了没反应
      // 会以为坏了。只在可能有 prefs 草稿的页签显示。
      $ === "schedule" ? null : e.createElement("button", {
        key: "save",
        type: "button",
        className: "qm-set-btn qm-set-btnprimary",
        "data-qm-save": "1",
        // 保存始终可点（用户裁定 2026-11-12）：即使无未保存修改，也允许
        // 把当前值固化到目标作用域；只有请求进行中才禁用。
        disabled: !!t.saving,
        onClick: () => {
          so();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), me = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, J = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, Y = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    P,
    N,
    T,
    me,
    J
  ]), H = l.delConfirm, Ie = H ? e.createElement("div", {
    key: "delconfirm",
    className: "qm-set-delconfirm",
    "data-qm-delconfirm": "1",
    role: "dialog",
    "aria-label": "确认删除"
  }, [
    e.createElement(
      "div",
      { key: "t", className: "qm-set-dctitle" },
      "确定删除「" + (H.name || "该条目") + "」？"
    ),
    e.createElement(
      "div",
      { key: "d", className: "qm-set-dcdesc" },
      "删除后不可恢复。"
    ),
    e.createElement("div", { key: "b", className: "qm-set-dcbtns" }, [
      e.createElement("button", {
        key: "c",
        type: "button",
        className: "qm-set-btn",
        "data-qm-delconfirm-cancel": "1",
        onClick: () => {
          l.delConfirm = null, q();
        }
      }, "取消"),
      e.createElement("button", {
        key: "ok",
        type: "button",
        className: "qm-set-btn qm-set-dcok",
        "data-qm-delconfirm-ok": "1",
        onClick: () => {
          uc();
        }
      }, "确定删除")
    ])
  ]) : null, Ae = e.createElement("div", { className: "qm-set-wrap" }, [
    _,
    f,
    Y,
    I,
    Ie
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
    onCancel: a,
    destroyOnClose: !0,
    // 小屏适配（2026-11-13 用户反馈）：固定 680 在窄屏会贴边/溢出。
    // min() 让宽度随视口收缩，92vw 两侧各留 4% 呼吸位。
    width: "min(680px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-set-modal"
  }, Ae) : e.createElement("div", {
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
          a();
        } catch {
        }
      }
    }, "✕"),
    Ae
  ]);
}
function Zc(t) {
  try {
    const e = t && t.sender, n = ze().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const a = n.createElement(Sc, {
      R: n,
      onOpen: () => {
        vc();
      }
    });
    e.addPrefix(Ws, a, {
      id: "question-modal.settings-btn",
      order: vs
    }), console.log("[question-modal] settings entry registered (order " + vs + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function Qc() {
  const t = Yi();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return tl(), t.toolRender(Ws, cs, ic), console.log("[question-modal] registered via chat.toolRender for", cs), Zc(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!Qc()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
