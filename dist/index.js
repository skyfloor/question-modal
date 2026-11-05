var To = Object.defineProperty;
var Wr = (r) => {
  throw TypeError(r);
};
var Ao = (r, e, t) => e in r ? To(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var L = (r, e, t) => Ao(r, typeof e != "symbol" ? e + "" : e, t), zo = (r, e, t) => e.has(r) || Wr("Cannot " + t);
var Hr = (r, e, t) => e.has(r) ? Wr("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var jt = (r, e, t) => (zo(r, e, "access private method"), t);
function Qn() {
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
let We = Qn();
function ds(r) {
  We = r;
}
const us = /[&<>"']/, Co = new RegExp(us.source, "g"), fs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, $o = new RegExp(fs.source, "g"), No = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ur = (r) => No[r];
function Y(r, e) {
  if (e) {
    if (us.test(r))
      return r.replace(Co, Ur);
  } else if (fs.test(r))
    return r.replace($o, Ur);
  return r;
}
const Ro = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Oo(r) {
  return r.replace(Ro, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const Mo = /(^|[^\[])\^/g;
function R(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (s, o) => {
      let a = typeof o == "string" ? o : o.source;
      return a = a.replace(Mo, "$1"), t = t.replace(s, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function Gr(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const xt = { exec: () => null };
function Zr(r, e) {
  const t = r.replace(/\|/g, (o, a, c) => {
    let i = !1, g = a;
    for (; --g >= 0 && c[g] === "\\"; )
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
function Dt(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let s = 0;
  for (; s < n && r.charAt(n - s - 1) === e; )
    s++;
  return r.slice(0, n - s);
}
function Bo(r, e) {
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
function Jr(r, e, t, n) {
  const s = e.href, o = e.title ? Y(e.title) : null, a = r[1].replace(/\\([\[\]])/g, "$1");
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
    text: Y(a)
  };
}
function Lo(r, e) {
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
class Qt {
  // set by the lexer
  constructor(e) {
    L(this, "options");
    L(this, "rules");
    // set by the lexer
    L(this, "lexer");
    this.options = e || We;
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
        text: this.options.pedantic ? n : Dt(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = Lo(n, t[3] || "");
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
        const s = Dt(n, "#");
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
      n = Dt(n.replace(/^ *>[ \t]?/gm, ""), `
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
      let c = "", i = "", g = !1;
      for (; e; ) {
        let h = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let k = t[2].split(`
`, 1)[0].replace(/^\t+/, (z) => " ".repeat(3 * z.length)), b = e.split(`
`, 1)[0], w = 0;
        this.options.pedantic ? (w = 2, i = k.trimStart()) : (w = t[2].search(/[^ ]/), w = w > 4 ? 1 : w, i = k.slice(w), w += t[1].length);
        let f = !1;
        if (!k && /^ *$/.test(b) && (c += b + `
`, e = e.substring(b.length + 1), h = !0), !h) {
          const z = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), M = new RegExp(`^ {0,${Math.min(3, w - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), y = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:\`\`\`|~~~)`), _ = new RegExp(`^ {0,${Math.min(3, w - 1)}}#`);
          for (; e; ) {
            const E = e.split(`
`, 1)[0];
            if (b = E, this.options.pedantic && (b = b.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), y.test(b) || _.test(b) || z.test(b) || M.test(e))
              break;
            if (b.search(/[^ ]/) >= w || !b.trim())
              i += `
` + b.slice(w);
            else {
              if (f || k.search(/[^ ]/) >= 4 || y.test(k) || _.test(k) || M.test(k))
                break;
              i += `
` + b;
            }
            !f && !b.trim() && (f = !0), c += E + `
`, e = e.substring(E.length + 1), k = b.slice(w);
          }
        }
        o.loose || (g ? o.loose = !0 : /\n *\n *$/.test(c) && (g = !0));
        let x = null, T;
        this.options.gfm && (x = /^\[[ xX]\] /.exec(i), x && (T = x[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), o.items.push({
          type: "list_item",
          raw: c,
          task: !!x,
          checked: T,
          loose: !1,
          text: i,
          tokens: []
        }), o.raw += c;
      }
      o.items[o.items.length - 1].raw = c.trimEnd(), o.items[o.items.length - 1].text = i.trimEnd(), o.raw = o.raw.trimEnd();
      for (let h = 0; h < o.items.length; h++)
        if (this.lexer.state.top = !1, o.items[h].tokens = this.lexer.blockTokens(o.items[h].text, []), !o.loose) {
          const k = o.items[h].tokens.filter((w) => w.type === "space"), b = k.length > 0 && k.some((w) => /\n.*\n/.test(w.raw));
          o.loose = b;
        }
      if (o.loose)
        for (let h = 0; h < o.items.length; h++)
          o.items[h].loose = !0;
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
    const n = Zr(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), o = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
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
        a.rows.push(Zr(c, a.header.length).map((i) => ({
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
        text: Y(t[1])
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
        const a = Dt(n.slice(0, -1), "\\");
        if ((n.length - a.length) % 2 === 0)
          return;
      } else {
        const a = Bo(t[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), Jr(t, {
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
      return Jr(n, o, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...s[0]].length - 1;
      let c, i, g = a, h = 0;
      const k = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (k.lastIndex = 0, t = t.slice(-1 * e.length + a); (s = k.exec(t)) != null; ) {
        if (c = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !c)
          continue;
        if (i = [...c].length, s[3] || s[4]) {
          g += i;
          continue;
        } else if ((s[5] || s[6]) && a % 3 && !((a + i) % 3)) {
          h += i;
          continue;
        }
        if (g -= i, g > 0)
          continue;
        i = Math.min(i, i + g + h);
        const b = [...s[0]][0].length, w = e.slice(0, a + s.index + b + i);
        if (Math.min(a, i) % 2) {
          const x = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: x,
            tokens: this.lexer.inlineTokens(x)
          };
        }
        const f = w.slice(2, -2);
        return {
          type: "strong",
          raw: w,
          text: f,
          tokens: this.lexer.inlineTokens(f)
        };
      }
    }
  }
  codespan(e) {
    const t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(n), o = /^ /.test(n) && / $/.test(n);
      return s && o && (n = n.substring(1, n.length - 1)), n = Y(n, !0), {
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
      return t[2] === "@" ? (n = Y(t[1]), s = "mailto:" + n) : (n = Y(t[1]), s = n), {
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
        s = Y(t[0]), o = "mailto:" + s;
      else {
        let a;
        do
          a = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (a !== t[0]);
        s = Y(t[0]), t[1] === "www." ? o = "http://" + t[0] : o = t[0];
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
      return this.lexer.state.inRawBlock ? n = t[0] : n = Y(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const Po = /^(?: *(?:\n|$))+/, jo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Do = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, vt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Fo = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, ms = /(?:[*+-]|\d{1,9}[.)])/, hs = R(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, ms).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Xn = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Wo = /^[^\n]+/, Kn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Ho = R(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", Kn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Uo = R(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ms).getRegex(), nn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Yn = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Go = R("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", Yn).replace("tag", nn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), gs = R(Xn).replace("hr", vt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", nn).getRegex(), Zo = R(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", gs).getRegex(), Vn = {
  blockquote: Zo,
  code: jo,
  def: Ho,
  fences: Do,
  heading: Fo,
  hr: vt,
  html: Go,
  lheading: hs,
  list: Uo,
  newline: Po,
  paragraph: gs,
  table: xt,
  text: Wo
}, Qr = R("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", vt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", nn).getRegex(), Jo = {
  ...Vn,
  table: Qr,
  paragraph: R(Xn).replace("hr", vt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Qr).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", nn).getRegex()
}, Qo = {
  ...Vn,
  html: R(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Yn).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: xt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: R(Xn).replace("hr", vt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", hs).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, bs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Xo = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, xs = /^( {2,}|\\)\n(?!\s*$)/, Ko = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, wt = "\\p{P}\\p{S}", Yo = R(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, wt).getRegex(), Vo = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, ea = R(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, wt).getRegex(), ta = R("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, wt).getRegex(), na = R("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, wt).getRegex(), ra = R(/\\([punct])/, "gu").replace(/punct/g, wt).getRegex(), sa = R(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), oa = R(Yn).replace("(?:-->|$)", "-->").getRegex(), aa = R("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", oa).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Xt = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, ia = R(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Xt).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), ys = R(/^!?\[(label)\]\[(ref)\]/).replace("label", Xt).replace("ref", Kn).getRegex(), ks = R(/^!?\[(ref)\](?:\[\])?/).replace("ref", Kn).getRegex(), la = R("reflink|nolink(?!\\()", "g").replace("reflink", ys).replace("nolink", ks).getRegex(), er = {
  _backpedal: xt,
  // only used for GFM url
  anyPunctuation: ra,
  autolink: sa,
  blockSkip: Vo,
  br: xs,
  code: Xo,
  del: xt,
  emStrongLDelim: ea,
  emStrongRDelimAst: ta,
  emStrongRDelimUnd: na,
  escape: bs,
  link: ia,
  nolink: ks,
  punctuation: Yo,
  reflink: ys,
  reflinkSearch: la,
  tag: aa,
  text: Ko,
  url: xt
}, ca = {
  ...er,
  link: R(/^!?\[(label)\]\((.*?)\)/).replace("label", Xt).getRegex(),
  reflink: R(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Xt).getRegex()
}, Zn = {
  ...er,
  escape: R(bs).replace("])", "~|])").getRegex(),
  url: R(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, pa = {
  ...Zn,
  br: R(xs).replace("{2,}", "*").getRegex(),
  text: R(Zn.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Ft = {
  normal: Vn,
  gfm: Jo,
  pedantic: Qo
}, ft = {
  normal: er,
  gfm: Zn,
  breaks: pa,
  pedantic: ca
};
class fe {
  constructor(e) {
    L(this, "tokens");
    L(this, "options");
    L(this, "state");
    L(this, "tokenizer");
    L(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || We, this.options.tokenizer = this.options.tokenizer || new Qt(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: Ft.normal,
      inline: ft.normal
    };
    this.options.pedantic ? (t.block = Ft.pedantic, t.inline = ft.pedantic) : this.options.gfm && (t.block = Ft.gfm, this.options.breaks ? t.inline = ft.breaks : t.inline = ft.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: Ft,
      inline: ft
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new fe(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new fe(t).inlineTokens(e);
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
          let g;
          this.options.extensions.startBlock.forEach((h) => {
            g = h.call({ lexer: this }, i), typeof g == "number" && g >= 0 && (c = Math.min(c, g));
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
    let n, s, o, a = e, c, i, g;
    if (this.tokens.links) {
      const h = Object.keys(this.tokens.links);
      if (h.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(a)) != null; )
          h.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(a)) != null; )
      a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(a)) != null; )
      a = a.slice(0, c.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (g = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((h) => (n = h.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
        if (o = e, this.options.extensions && this.options.extensions.startInline) {
          let h = 1 / 0;
          const k = e.slice(1);
          let b;
          this.options.extensions.startInline.forEach((w) => {
            b = w.call({ lexer: this }, k), typeof b == "number" && b >= 0 && (h = Math.min(h, b));
          }), h < 1 / 0 && h >= 0 && (o = e.substring(0, h + 1));
        }
        if (n = this.tokenizer.inlineText(o)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (g = n.raw.slice(-1)), i = !0, s = t[t.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
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
    return t;
  }
}
class Kt {
  constructor(e) {
    L(this, "options");
    this.options = e || We;
  }
  code(e, t, n) {
    var o;
    const s = (o = (t || "").match(/^\S*/)) == null ? void 0 : o[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + Y(s) + '">' + (n ? e : Y(e, !0)) + `</code></pre>
` : "<pre><code>" + (n ? e : Y(e, !0)) + `</code></pre>
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
    const s = Gr(e);
    if (s === null)
      return n;
    e = s;
    let o = '<a href="' + e + '"';
    return t && (o += ' title="' + t + '"'), o += ">" + n + "</a>", o;
  }
  image(e, t, n) {
    const s = Gr(e);
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
class tr {
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
class me {
  constructor(e) {
    L(this, "options");
    L(this, "renderer");
    L(this, "textRenderer");
    this.options = e || We, this.options.renderer = this.options.renderer || new Kt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new tr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new me(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new me(t).parseInline(e);
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
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, Oo(this.parseInline(a.tokens, this.textRenderer)));
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
          for (let h = 0; h < a.header.length; h++)
            i += this.renderer.tablecell(this.parseInline(a.header[h].tokens), { header: !0, align: a.align[h] });
          c += this.renderer.tablerow(i);
          let g = "";
          for (let h = 0; h < a.rows.length; h++) {
            const k = a.rows[h];
            i = "";
            for (let b = 0; b < k.length; b++)
              i += this.renderer.tablecell(this.parseInline(k[b].tokens), { header: !1, align: a.align[b] });
            g += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, g);
          continue;
        }
        case "blockquote": {
          const a = o, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = o, c = a.ordered, i = a.start, g = a.loose;
          let h = "";
          for (let k = 0; k < a.items.length; k++) {
            const b = a.items[k], w = b.checked, f = b.task;
            let x = "";
            if (b.task) {
              const T = this.renderer.checkbox(!!w);
              g ? b.tokens.length > 0 && b.tokens[0].type === "paragraph" ? (b.tokens[0].text = T + " " + b.tokens[0].text, b.tokens[0].tokens && b.tokens[0].tokens.length > 0 && b.tokens[0].tokens[0].type === "text" && (b.tokens[0].tokens[0].text = T + " " + b.tokens[0].tokens[0].text)) : b.tokens.unshift({
                type: "text",
                text: T + " "
              }) : x += T + " ";
            }
            x += this.parse(b.tokens, g), h += this.renderer.listitem(x, f, !!w);
          }
          n += this.renderer.list(h, c, i);
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
class yt {
  constructor(e) {
    L(this, "options");
    this.options = e || We;
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
L(yt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Fe, Jn, vs;
class da {
  constructor(...e) {
    Hr(this, Fe);
    L(this, "defaults", Qn());
    L(this, "options", this.setOptions);
    L(this, "parse", jt(this, Fe, Jn).call(this, fe.lex, me.parse));
    L(this, "parseInline", jt(this, Fe, Jn).call(this, fe.lexInline, me.parseInline));
    L(this, "Parser", me);
    L(this, "Renderer", Kt);
    L(this, "TextRenderer", tr);
    L(this, "Lexer", fe);
    L(this, "Tokenizer", Qt);
    L(this, "Hooks", yt);
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
          (o = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && o[c.type] ? this.defaults.extensions.childTokens[c.type].forEach((i) => {
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
        const o = this.defaults.renderer || new Kt(this.defaults);
        for (const a in n.renderer) {
          if (!(a in o))
            throw new Error(`renderer '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.renderer[c], g = o[c];
          o[c] = (...h) => {
            let k = i.apply(o, h);
            return k === !1 && (k = g.apply(o, h)), k || "";
          };
        }
        s.renderer = o;
      }
      if (n.tokenizer) {
        const o = this.defaults.tokenizer || new Qt(this.defaults);
        for (const a in n.tokenizer) {
          if (!(a in o))
            throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a))
            continue;
          const c = a, i = n.tokenizer[c], g = o[c];
          o[c] = (...h) => {
            let k = i.apply(o, h);
            return k === !1 && (k = g.apply(o, h)), k;
          };
        }
        s.tokenizer = o;
      }
      if (n.hooks) {
        const o = this.defaults.hooks || new yt();
        for (const a in n.hooks) {
          if (!(a in o))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], g = o[c];
          yt.passThroughHooks.has(a) ? o[c] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(o, h)).then((b) => g.call(o, b));
            const k = i.call(o, h);
            return g.call(o, k);
          } : o[c] = (...h) => {
            let k = i.apply(o, h);
            return k === !1 && (k = g.apply(o, h)), k;
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
    return fe.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return me.parse(e, t ?? this.defaults);
  }
}
Fe = new WeakSet(), Jn = function(e, t) {
  return (n, s) => {
    const o = { ...s }, a = { ...this.defaults, ...o };
    this.defaults.async === !0 && o.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = jt(this, Fe, vs).call(this, !!a.silent, !!a.async);
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
}, vs = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + Y(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(s) : s;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const De = new da();
function C(r, e) {
  return De.parse(r, e);
}
C.options = C.setOptions = function(r) {
  return De.setOptions(r), C.defaults = De.defaults, ds(C.defaults), C;
};
C.getDefaults = Qn;
C.defaults = We;
C.use = function(...r) {
  return De.use(...r), C.defaults = De.defaults, ds(C.defaults), C;
};
C.walkTokens = function(r, e) {
  return De.walkTokens(r, e);
};
C.parseInline = De.parseInline;
C.Parser = me;
C.parser = me.parse;
C.Renderer = Kt;
C.TextRenderer = tr;
C.Lexer = fe;
C.lexer = fe.lex;
C.Tokenizer = Qt;
C.Hooks = yt;
C.parse = C;
C.options;
C.setOptions;
C.use;
C.walkTokens;
C.parseInline;
me.parse;
fe.lex;
const ws = "question-modal", Xr = "question_modal", Rn = 3, Kr = "gate-v2@2026.10.21";
function re() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function ua() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function qe() {
  return re().antd || {};
}
function fa() {
  return re().antdIcons || {};
}
const ma = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function On(r) {
  const e = fa();
  for (const t of ma) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function ha() {
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
function P(r) {
  try {
    const e = re();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let rn = "", qs = "";
function nr(r, e) {
  r && (qs = r), e && (rn = e);
}
function j() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = re(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = rn), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function rr() {
  try {
    const e = re();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : qs;
}
function Wt() {
  try {
    const r = re(), e = typeof r.getSelectedAgentId == "function" && r.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return rn;
}
const Mn = {};
async function ga(r, e, t) {
  if (typeof window > "u" || Mn[r]) return "skipped";
  try {
    const o = "qm:v1:notified:" + r;
    if (window.localStorage && window.localStorage.getItem(o) === "1")
      return Mn[r] = !0, "skipped";
    window.localStorage.setItem(o, "1");
  } catch {
  }
  Mn[r] = !0;
  const n = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((c) => {
      let i = !1;
      const g = (h) => {
        i || (i = !0, c(h));
      };
      try {
        const h = s.requestPermission((k) => g(k));
        h && typeof h.then == "function" && h.then(g).catch(() => g("denied"));
      } catch {
        g("denied");
      }
      setTimeout(() => g(s.permission || "denied"), 8e3);
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
function X(r) {
  const e = kt(r);
  return e && e.session_id ? e.session_id : rr();
}
const Bn = 180, ba = 20, _s = 6e3, xa = 60, ya = 8;
function ka() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const va = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function Yr(r) {
  try {
    return String(r || "").replace(va, "").length;
  } catch {
    return 0;
  }
}
function Vr(r) {
  const e = ka();
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
    n = Yr((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - Yr(t.textContent);
}
function wa(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function qa(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function es(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: _s });
      return;
    }
  } catch {
  }
  try {
    setTimeout(r, 0);
  } catch {
  }
}
const _a = "qm:v1:analysis:global", Sa = "qm:v1:analysis:", Ea = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function ts(r) {
  return r === "ai" || r === "recommend" ? r : "manual";
}
function Ia(r) {
  if (!r || typeof r != "object") return { ...Ea };
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
function Ta() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(Sa) === 0 && t !== _a && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function Aa() {
  try {
    const r = await fetch(P("/question-modal/prefs"), { headers: j() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : Ia(e.prefs);
  } catch {
    return null;
  }
}
async function sr() {
  try {
    const r = await fetch(P("/question-modal/templates"), { headers: j() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function Ln(r, e, t) {
  try {
    return (await fetch(P("/question-modal/session-prefs"), {
      method: "POST",
      headers: j(),
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
let Ss = null;
async function sn(r, e, t, n) {
  const s = r || "", o = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(n || "");
  try {
    const a = P(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + o
    ), c = await fetch(a, { headers: j() });
    if (!c.ok) return null;
    const i = await c.json();
    if (!i || i.ok !== !0) return null;
    const g = {
      config: i.config || {},
      globalKeys: Array.isArray(i.global_keys) ? i.global_keys : [],
      version: typeof i.version == "number" ? i.version : 0,
      schema: Array.isArray(i.schema) ? i.schema : [],
      has_session: i.has_session === !0
    };
    return Ss = { chatId: s, at: Date.now(), data: g }, g;
  } catch {
    return null;
  }
}
function or() {
  Ss = null;
}
async function Es(r) {
  try {
    const e = await fetch(P("/question-modal/templates"), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(r)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Is(r) {
  try {
    const e = await fetch(P("/question-modal/templates/" + encodeURIComponent(r)), {
      method: "DELETE",
      headers: j()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ts() {
  try {
    const r = await fetch(P("/models"), { headers: j() });
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
function za(r) {
  if (!r) return "";
  try {
    return String(C.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function N(r, e) {
  try {
    const t = qe().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const je = "__other__";
function ne(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function Ke(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function Pn(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (t && t.has(s) || !Object.prototype.hasOwnProperty.call(n, s)) return;
    const o = e[s];
    !o || typeof o != "object" || !Ke(n[s]) && Ke(o) && (n[s] = { ...o });
  }), n;
}
function ns(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function Ca(r, e, t) {
  if (!t.length) return !1;
  const n = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = ne(e), o = he(e), a = n(s), c = n(o);
  return t.some((i) => {
    const g = n(i);
    return g ? !!(i === s || i === o || g === a || g === c || Math.min(g.length, a.length, c.length) >= 4 && (g.length >= 4 && (a.includes(g) || g.includes(a)) || g.length >= 4 && (c.includes(g) || g.includes(c)))) : !1;
  });
}
function G(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
let As = !0;
function Yt(r, e) {
  const t = String(r && r.title || "").trim();
  return t || (As ? "第 " + (e + 1) + " 题" : "");
}
function he(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function $a(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (o) => {
    o != null && o !== "" && t.add(String(o));
  }, s = r.options || [];
  if (G(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = s.find((i) => ne(i) === String(a));
      c && n(he(c)), String(a) === je && e.other && n(e.other);
    });
  else {
    n(e.value);
    const o = s.find((a) => ne(a) === String(e.value));
    o && n(he(o)), String(e.value) === je && e.other && n(e.other);
  }
  return t;
}
function Na(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const s = String(n);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const o of Array.from(e))
      if (o && (o.indexOf(s) !== -1 || s.indexOf(o) !== -1)) return !0;
    return !1;
  });
}
function zs(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const s = parseInt(t[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === r.trim());
}
function Cs(r, e, t) {
  const n = e[r], s = n && n.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const o of Object.keys(s)) {
    const a = zs(o, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !Cs(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !Na(s[o], $a(c, i))) return !1;
  }
  return !0;
}
function we(r, e) {
  const t = [];
  return r.forEach((n, s) => {
    Cs(s, r, e) && t.push(s);
  }), t;
}
function Ra(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function Ht(r) {
  return Array.isArray(r.questions);
}
function Oa(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function Ma(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((s) => s && (s.text || s.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function Ba(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function La(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers)
    return `已跳过本次问卷。

` + Jt(r);
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((s) => {
    const o = t[s];
    if (!o || typeof o != "object") return;
    const a = zs(s, r), c = a >= 0 ? r[a] : null, i = c ? G(c) === "single" ? "单选" : G(c) === "multi" ? "多选" : "问答" : "问答", g = c ? Yt(c, a) : s;
    let h = o.value;
    Array.isArray(h) && (h = h.join("、")), o.other && (h = (h ? h + "、" : "") + o.other), o.skipped ? n.push(`- ${s} [${i}] ${g}（用户跳过本题）`) : n.push(`- ${s} [${i}] ${g}：${h === "" || h == null ? "（空）" : h}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function Pa(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      P("/question-modal/resolve") + "?" + t.toString(),
      { headers: j() }
    );
    if (!n.ok) return { kind: "error" };
    const s = await n.json();
    return s && nr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function jn(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      P("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(r),
      { headers: j() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function ja(r) {
  try {
    const e = new FormData();
    e.append("file", r);
    const t = j();
    delete t["Content-Type"];
    const n = await fetch(
      P("/console/upload"),
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
const Vt = "qm:v1:stash_att:", rs = 25 * 1024 * 1024, Gt = /* @__PURE__ */ new Map(), Zt = /* @__PURE__ */ new Map();
let en = null, tn = 0, Dn = null;
function ss() {
  const r = tn > 0;
  Zt.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function Da() {
  if (Dn) return Dn;
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
    const n = en;
    en = null, !(!n || !t.length) && await $s(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return Dn = r, r;
}
function Fa(r, e, t) {
  if (!r) {
    N("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  en = { callId: r, target: e, key: t };
  const n = Da();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (en = null);
}
async function $s(r, e, t, n) {
  tn += 1, ss();
  const s = [], o = [];
  try {
    for (const c of r) {
      if (c.size && c.size > rs) {
        o.push(`${c.name}: 文件过大（上限 ${Math.round(rs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await ja(c);
      i.ok ? s.push(i.att) : o.push(i.error);
    }
  } finally {
    tn -= 1, ss();
  }
  const a = Gt.get(e);
  if (s.length || o.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      N(
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
    else s.length && Wa(e, s, c, n);
  }
}
function Wa(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const s = localStorage.getItem(Vt + r), o = s ? JSON.parse(s) : [], a = (Array.isArray(o) ? o : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(Vt + r, JSON.stringify(a));
    } catch {
    }
}
function Ha(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(Vt + r);
    if (!e) return [];
    localStorage.removeItem(Vt + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function Ua(r) {
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
function Ga(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function Fn(r, e) {
  const t = e || X(r), n = kt(r), s = n && n.request_id ? n.request_id : "";
  if (s)
    try {
      const o = await fetch(P("/question-modal/skip"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({ request_id: s, session_id: t || "" })
      });
      if (o.ok) {
        const a = await o.json().catch(() => ({}));
        return ie(r), {
          ok: !0,
          released: !0,
          reason: a && a.orphan ? "orphan" : "skipped"
        };
      }
      if (o.status === 404)
        return ie(r), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const o = await fetch(
        P("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: j() }
      );
      if (o.ok) {
        const a = await o.json().catch(() => ({})), c = a && typeof a.cancelled == "number" ? a.cancelled : 0;
        return ie(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + o.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function os(r) {
  if (!r) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      P("/console/chat/stop") + "?chat_id=" + encodeURIComponent(r),
      { method: "POST", headers: j() }
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
async function Za() {
  try {
    const r = await fetch(
      P("/question-modal/pending"),
      { headers: j() }
    );
    if (!r.ok) return null;
    const e = await r.json(), t = e && e.items || [];
    if (!Array.isArray(t) || t.length !== 1) return null;
    const n = t[0];
    if (!n || !n.request_id) return null;
    const s = await fetch(
      P("/question-modal/resolve") + "?request_id=" + encodeURIComponent(n.request_id),
      { headers: j() }
    );
    if (!s.ok) return null;
    const o = await s.json();
    return o && nr(o.session_id, o.agent_id), o && o.found ? o : null;
  } catch {
    return null;
  }
}
const on = "qm:v1:reqid:", Ja = 3e4, Qa = 45e3;
function ie(r) {
  if (r)
    try {
      localStorage.removeItem(on + r);
    } catch {
    }
}
function Xa() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(on) === 0 && r.push(o);
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
function Ka(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(on + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), Xa();
    } catch {
    }
}
function kt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(on + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (ie(r), null) : t;
  } catch {
    return null;
  }
}
const ar = "qm:v1:state:";
function bt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(ar + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function mt(r, e) {
  if (r)
    try {
      const n = { ...bt(r) || {}, ...e, ts: Date.now() };
      localStorage.setItem(ar + r, JSON.stringify(n)), Ya();
    } catch {
    }
}
function Ya() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(ar) === 0 && r.push(o);
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
async function Va(r) {
  try {
    const e = await fetch(
      P("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: j() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && nr(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function ei(r, e, t, n) {
  const s = ["【用户提交的问卷答案】"], o = new Set(we(r, e));
  return r.forEach((a, c) => {
    if (!o.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let g = i.value;
    if (Array.isArray(g))
      g = g.filter((f) => f !== je).map((f) => {
        const x = (a.options || []).find((T) => ne(T) === String(f));
        return x ? he(x) : f;
      }).join("、");
    else {
      const f = (a.options || []).find((x) => ne(x) === String(g));
      f && (g = he(f)), String(i.value) === je && (g = "");
    }
    const h = G(a) === "single" ? "单选" : G(a) === "multi" ? "多选" : "问答", k = !!String(g || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), b = i.skipped ? "（用户跳过本题）" : k ? g : "（未作答）";
    let w = `- q${c} [${h}] ${b}`;
    i.other && !i.skipped && (w += `（其他：${i.other}）`), i.attachments && i.attachments.length && (w += `（附件：${i.attachments.map((f) => f.file_name).join("、")}）`), s.push(w);
  }), t && s.push(`- 其他意见：${t}`), n && n.length && s.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), s.join(`
`);
}
function Jt(r) {
  return r.map((e, t) => {
    const n = G(e) === "single" ? "单选" : G(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(he).join("、");
    return `${t + 1}. [${n}] ${Yt(e, t)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function Wn(r) {
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
  }, g = {
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
    t.map((h, k) => e.createElement(
      "span",
      { key: "att" + k, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: h.file_name
      }, h.file_name + (h.size ? "（" + Ga(h.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          n || c(k);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: n || s,
      style: g,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, s ? "上传中…" : "📎 附件"),
    o ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + o) : null
  );
}
function ti(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: s,
    disabled: o,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: g
  } = r, k = qe().Popover, b = [];
  t.forEach((v) => {
    [...v.models || [], ...v.extra_models || []].forEach((D) => {
      b.push({
        providerId: v.id,
        providerName: v.name || v.id,
        modelId: D.id,
        modelName: D.name || D.id,
        free: !!D.is_free
      });
    });
  });
  const w = b.find((v) => `${v.providerId}:${v.modelId}` === n), x = w ? w.modelName : n || "选择模型", T = w ? w.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", z = {
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
  }, M = b.filter((v) => v.free).length, y = b.length - M, _ = [];
  t.forEach((v) => {
    const D = [...v.models || [], ...v.extra_models || []].map((B) => ({
      providerId: v.id,
      providerName: v.name || v.id,
      modelId: B.id,
      modelName: B.name || B.id,
      free: !!B.is_free
    })).filter((B) => i === "free" ? B.free : !B.free);
    D.length && _.push({ id: v.id, name: v.name || v.id, models: D });
  });
  const E = (v, D) => e.createElement("button", {
    key: v,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === v ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === v ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === v ? 600 : 400,
      boxShadow: i === v ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => g(v)
  }, D), $ = e.createElement(
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
      E("paid", "付费 🟡 " + y),
      E("free", "免费 🟢 " + M)
    ),
    _.length ? e.createElement("div", null, _.map((v, D) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: v.id,
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
          e.createElement("span", { style: { flex: 1 } }, v.name),
          e.createElement("span", { style: { fontWeight: 400 } }, v.models.length)
        ),
        v.models.map((B) => {
          const Ie = `${B.providerId}:${B.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${B.providerId}:${B.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (Ie ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: Ie ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${B.providerId}:${B.modelId}`), c(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: D % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, B.modelName)
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
    open: a,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: z,
      disabled: o,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: z,
      disabled: o,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const v = b.find((D) => `${D.providerId}:${D.modelId}` !== n);
        v && s(`${v.providerId}:${v.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function ni(r) {
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
function ri(r) {
  const { R: e, templates: t, value: n, open: s, onOpenChange: o, disabled: a, onSelect: c, onManage: i } = r, h = qe().Popover, k = (t || []).find((T) => T.id === n), b = k ? k.name : "默认模板", w = {
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
  }, f = e.createElement(
    "div",
    {
      style: {
        width: 240,
        maxHeight: "min(60vh, 320px)",
        overflowY: "auto",
        scrollbarWidth: "none"
      }
    },
    (t || []).map((T) => e.createElement(
      "div",
      {
        key: T.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (T.id === n ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: T.id === n ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          c(T.id), o(!1);
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
      }, T.name),
      T.builtin ? e.createElement("span", {
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
  ), x = e.createElement(
    "button",
    {
      type: "button",
      style: w,
      disabled: a,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return h ? e.createElement(h, {
    content: f,
    trigger: "click",
    open: s,
    onOpenChange: o,
    placement: "bottomLeft"
  }, x) : x;
}
function si(r) {
  const { R: e, open: t, templates: n, value: s, edit: o, onEditChange: a, onClose: c, onSelect: i, onSave: g, onDelete: h } = r;
  if (!t) return null;
  const k = qe(), { Input: b, Modal: w } = k, f = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  w || (f.position = "fixed", f.right = 24, f.top = 80, f.width = 420, f.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", f.zIndex = 1100, f.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const x = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, T = !!o, z = (y, _, E, $) => b && b.TextArea ? e.createElement(b.TextArea, {
    value: y,
    rows: E,
    placeholder: $,
    onChange: (v) => _(v && v.target ? v.target.value : "")
  }) : e.createElement("textarea", {
    value: y,
    rows: E,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (v) => _(v && v.target ? v.target.value : ""),
    onChange: (v) => _(v && v.target ? v.target.value : "")
  }), M = e.createElement(
    "div",
    {
      style: f,
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
        T ? o.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: x, onClick: c }, "关闭")
    ),
    T ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      z(o.name || "", (y) => a({ ...o, name: y }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      z(o.system || "", (y) => a({ ...o, system: y }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      z(o.user || "", (y) => a({ ...o, user: y }), 6, "用户提示词模板"),
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
          onClick: () => g(o)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: x,
          onClick: () => a(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (n || []).map(
        (y) => e.createElement(
          "div",
          {
            key: y.id,
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
            y.name + (y.builtin ? "（内置）" : "") + (y.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: x,
            title: "设为本题使用",
            onClick: () => i(y.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => a({
              id: y.id,
              name: y.name,
              system: y.system,
              user: y.user
            })
          }, "编辑"),
          y.builtin ? null : e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => h(y.id)
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
          onClick: () => a({ id: "", name: "", system: "", user: "" })
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
    onCancel: c,
    destroyOnClose: !0,
    width: 620,
    zIndex: 1200,
    wrapClassName: "qm-tpl-modal"
  }, M) : M;
}
function oi(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: s,
    mode: o,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: g,
    disabled: h,
    children: k,
    open: b,
    onOpenChange: w
  } = r, x = qe().Popover, T = e.createElement("button", {
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
    title: o === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : o === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      w(!b);
    }
  }, t ? "分析中…" : "查看分析");
  if (!x)
    return e.createElement(
      "div",
      null,
      T,
      n && b ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((_) => _.reasoning).join(`

`))) : null
    );
  const z = !!(n && (n.per_question || []).length), M = (_, E, $) => e.createElement("button", {
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
    onClick: E
  }, _), y = e.createElement(
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
        z && !t ? e.createElement("button", {
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
        z && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: z ? 6 : "auto",
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
            c(), w(!1);
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
          dangerouslySetInnerHTML: { __html: za(_.reasoning || "") }
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
      M("开始分析", () => {
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
    }, k)
  );
  return e.createElement(x, {
    content: y,
    trigger: "click",
    open: b,
    onOpenChange: w,
    placement: "bottomRight"
  }, T);
}
function ai(r) {
  const e = re().React, t = qe(), { Input: n, Button: s } = t, o = n.TextArea, a = r.data || {}, c = Ra(a), i = Oa(a), g = Ma(a), h = Ba(g), k = h ? "" : g, b = c.questions || [], w = c.title || "问卷", f = bt(i), [x, T] = e.useState(
    () => !!(f && f.answered) || !!k || h
  ), [z, M] = e.useState(""), [y, _] = e.useState(() => {
    const l = kt(i);
    return l && l.request_id ? l.request_id : f && typeof f.reqId == "string" ? f.reqId : "";
  }), [E, $] = e.useState(
    () => f && typeof f.visStep == "number" && f.visStep >= 0 ? f.visStep : 0
  ), [v, D] = e.useState(
    () => f && typeof f.slowAt == "number" ? f.slowAt : 0
  ), [B, Ie] = e.useState(
    () => f && typeof f.slowStep == "number" ? f.slowStep : -1
  ), [ge, se] = e.useState(
    () => !!(f && f.slowFired === !0)
  ), [be, Ye] = e.useState(() => {
    const l = {};
    b.forEach((m, d) => {
      l[`q${d}`] = { type: G(m), value: G(m) === "multi" ? [] : "", other: "" };
    });
    const p = f && f.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((m) => {
      l[m] && (l[m] = { ...l[m], ...p[m] });
    }), l;
  }), [Ve, Bs] = e.useState(
    () => f && typeof f.finalOther == "string" ? f.finalOther : ""
  ), [F, _e] = e.useState(!1), [Se, an] = e.useState(
    () => f && typeof f.releasedNote == "string" ? f.releasedNote : ""
  ), [et, ln] = e.useState(
    () => f && typeof f.localResult == "string" ? f.localResult : ""
  ), [oe, qt] = e.useState(
    () => !!(f && f.skippedAll) || /跳过了本次问卷/.test(k || "")
  ), [tt, lr] = e.useState(
    () => f && Array.isArray(f.finalOtherAtt) ? f.finalOtherAtt : []
  ), [_t, cr] = e.useState(
    () => !!(f && f.expanded)
  ), [pr, St] = e.useState(!1), cn = e.useRef(0), [le, Ls] = e.useState(
    () => f && typeof f.deadReason == "string" ? f.deadReason : ""
  ), [Te, nt] = e.useState(
    () => f && typeof f.gateBlocked == "string" ? f.gateBlocked : ""
  ), [He, dr] = e.useState(
    () => f && typeof f.submittedAt == "number" ? f.submittedAt : 0
  ), [pn, dn] = e.useState(
    () => !!(f && f.pastSoft === !0)
  ), [rt, Et] = e.useState(
    () => !!(f && f.waitRetired === !0)
  ), st = e.useRef(
    !!(f && typeof f.submittedAt == "number" && f.submittedAt > 0 && Date.now() - f.submittedAt < Bn * 1e3)
  ), Ae = e.useRef(!1), It = e.useRef(!!(f && f.pastSoft === !0)), [un, Ps] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), js = e.useRef(un), Ds = (l) => {
    js.current = l, Ps(l);
  }, K = (l, p) => {
    const m = un[l];
    return m ?? p;
  };
  As = !!K("fallback_title", !0);
  const ur = Math.max(30, Number(K("wait_hint_sec", Bn)) || Bn), Fs = "manual", [ae, fr] = e.useState(Fs), [mr, hr] = e.useState(""), [Ei, Ws] = e.useState(!1), [fn, gr] = e.useState(!1), [mn, br] = e.useState(!1), [Hs, Us] = e.useState([]), [xr, hn] = e.useState(!1), [Ee, Ue] = e.useState(null), [Gs, ze] = e.useState(""), [Zs, Js] = e.useState(!1), [Qs, Xs] = e.useState(!1), [Ks, Ys] = e.useState("paid"), Ce = e.useRef({}), xe = e.useRef({}), Ge = e.useRef(0), ot = e.useRef(null), [Vs, at] = e.useState(0), [yr, gn] = e.useState([]), [$e, Tt] = e.useState(""), ye = e.useRef($e);
  ye.current = $e;
  const [eo, to] = e.useState(!1), [no, kr] = e.useState(!1), [ro, bn] = e.useState(null), [ce, vr] = e.useState(
    () => !!(f && f.autoPaused)
  ), so = e.useRef(ce);
  so.current = ce;
  const Ze = e.useRef(!1), xn = e.useRef(0), At = e.useRef(/* @__PURE__ */ new Set()), it = (l) => {
    l && At.current.add(l);
  }, zt = e.useRef({}), [oo, yn] = e.useState(0), Ne = e.useRef({});
  e.useRef(!1);
  const wr = e.useRef(!1), Ct = (l) => {
    l.mode !== void 0 && (fr(l.mode), Ln(
      { mode: l.mode },
      X(i),
      Wt()
    ));
    const p = {};
    l.modelId !== void 0 && (p.model_id = l.modelId), l.withContext !== void 0 && (p.with_context = l.withContext), l.parallel !== void 0 && (p.parallel = l.parallel), Object.keys(p).length && (l.modelId !== void 0 && hr(l.modelId), l.withContext !== void 0 && gr(l.withContext), l.parallel !== void 0 && br(l.parallel), Ln(p, X(i), Wt()));
  }, qr = (l) => {
    !l || l === $e || (Tt(l), ye.current = l, mt(i, { templateId: l }), Ln(
      { template_id: l },
      X(i),
      Wt()
    ), Ue(null), Ce.current = {}, xe.current = {}, at((p) => p + 1));
  }, ao = async (l) => {
    const p = await Es({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!p.ok) {
      N("error", p.error || "保存失败");
      return;
    }
    gn(p.items || []), bn(null), N("success", "模板已保存");
  }, io = async (l) => {
    const p = await Is(l);
    if (!p.ok) {
      N("warning", p.error || "删除失败");
      return;
    }
    gn(p.items || []);
    const m = (p.items || []).map((d) => d.id);
    if (m.indexOf(ye.current) === -1) {
      const d = m[0] || "";
      Tt(d), ye.current = d, mt(i, { templateId: d });
    }
    N("success", "模板已删除");
  };
  e.useEffect(() => {
    if (x) return;
    let l = !0;
    return Ta(), (async () => {
      const [p, m, d, q] = await Promise.all([
        Ts(),
        Aa(),
        sr(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        sn(
          "",
          !0,
          X(i),
          Wt()
        )
      ]);
      if (!l) return;
      if (Us(p), gn(d.items), q && q.config) {
        const I = q.config;
        Ds(I), I.mode !== void 0 && fr(ts(I.mode)), typeof I.model_id == "string" && I.model_id && hr(I.model_id), typeof I.with_context == "boolean" && gr(I.with_context), typeof I.parallel == "boolean" && br(I.parallel), typeof I.template_id == "string" && I.template_id && (Tt(I.template_id), ye.current = I.template_id);
      }
      const S = d.items.map((I) => I.id);
      if (!ye.current || S.indexOf(ye.current) === -1) {
        const I = d.defaultId || S[0] || "";
        I && (Tt(I), ye.current = I);
      }
      if (q && q.config) {
        const I = q.config;
        Ws(I.__follow_active__ === !0);
      }
      wr.current = !0, at((I) => I + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    Ge.current = E;
  }, [E]);
  const kn = async (l) => {
    if (xr) return;
    const p = E;
    hn(!0), ze("");
    const m = typeof AbortController < "u" ? new AbortController() : null;
    ot.current = m;
    try {
      const d = await fetch(P("/question-modal/analyze"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({
          request_id: y,
          tool_call_id: i,
          session_id: X(i),
          title: w,
          questions: b,
          model_id: mr,
          mode: l,
          with_context: fn,
          parallel: mn,
          question_index: p,
          answers: be,
          template_id: ye.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(K("model_timeout_sec", 120)) || 120
        }),
        signal: m ? m.signal : void 0
      }), q = await d.json().catch(() => ({})), S = q && q.analysis || null, I = S && S.error || q && q.error || "";
      q && q.cancelled || S && S.cancelled ? ze("已终止分析。") : !d.ok || !q || q.ok === !1 || S && S.ok === !1 ? ze(I || "分析失败（服务返回 " + d.status + "）") : S && (Ce.current[p] = S, xe.current[p] = !0, Ge.current === p && Ue(S), N("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (d) {
      ot.current === m && m && m.signal.aborted || d && d.name === "AbortError" ? ze("已终止分析。") : ze("分析请求失败：" + (d && d.message ? d.message : d));
    } finally {
      ot.current === m && (ot.current = null), hn(!1), Ne.current[p] = !0, yn((d) => d + 1);
    }
  }, lo = () => {
    const l = E;
    delete Ce.current[l], Ue(null), ze(""), kn("manual");
  }, Je = (l) => {
    var m;
    const p = l !== void 0 ? l : Ge.current;
    try {
      fetch(P("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: y,
          question_index: p
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      (m = ot.current) == null || m.abort();
    } catch {
    }
    hn(!1);
  }, co = () => {
    Je(), ze("已终止分析。");
  }, po = () => {
    ce ? (zt.current = {}, Ne.current = {}, xe.current = {}, Ze.current = !1, vr(!1), at((l) => l + 1), N("info", "已恢复自动答题")) : (Je(), vr(!0), N("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (x) return;
    const l = Ce.current[E];
    Ue(l || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + E;
    let m = !0;
    return fetch(P("/question-modal/analysis") + p, { headers: j() }).then((d) => d.ok ? d.json() : null).then((d) => {
      !m || !d || !d.found || !d.analysis || (Ce.current[E] = d.analysis, Ge.current === E && Ue(d.analysis));
    }).catch(() => {
    }), () => {
      m = !1;
    };
  }, [i, E]), e.useEffect(() => {
    x || wr.current && ae === "ai" && (!Ht(c) || !b.length || xe.current[E] || F || (xe.current[E] = !0, kn("auto")));
  }, [x, ae, i, Vs, fn, mn, b, E]);
  const uo = () => {
    const l = Ee && Ee.per_question || [];
    if (!l.length) return;
    if (!l.some((m) => m.type === "multi" ? String(m.choice || "").split(/[、,，]/).map((d) => d.trim()).filter(Boolean).length > 0 : String(m.choice || "").trim().length > 0)) {
      N("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Ye((m) => {
      const d = { ...m };
      return l.forEach((q) => {
        const S = `q${q.index}`;
        it(S);
        const I = d[S] || { type: q.type, value: "", other: "" };
        if (q.type === "multi") {
          const Me = String(q.choice || "").split(/[、,，]/).map((ee) => ee.trim()).filter(Boolean);
          d[S] = { ...I, value: Me };
        } else
          d[S] = { ...I, value: q.choice || I.value };
      }), d;
    }), N("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Re = (l, p, m = !1) => {
    Je(), Ls(l), qt(!0), ln(p), St(!1), T(!0), ie(i), m && mt(i, { backendReleased: !0 });
  }, fo = async (l, p) => {
    const m = await Fn(i, X(i));
    return m.ok ? (Re(l, p, m.released), !0) : (St(!0), wn(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const l = (p = bt(i)) == null ? void 0 : p.answers;
    mt(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: y,
      visStep: E,
      answers: Pn(be, l, At.current),
      finalOther: Ve,
      finalOtherAtt: tt,
      answered: x,
      skippedAll: oe,
      expanded: _t,
      localResult: et,
      submittedAt: He,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: pn,
      waitRetired: rt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: v,
      slowStep: B,
      slowFired: ge,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: le,
      gateBlocked: Te,
      releasedNote: Se,
      autoPaused: ce,
      templateId: $e
    });
  }, [
    i,
    y,
    E,
    be,
    Ve,
    tt,
    x,
    oe,
    _t,
    et,
    He,
    pn,
    rt,
    v,
    B,
    ge,
    le,
    ce,
    $e,
    Te,
    Se
  ]), e.useEffect(() => {
    if (!x || !He || rt || !st.current) return;
    let l = 0, p = !1, m = Vr(i);
    const d = () => {
      if (p) return;
      const q = Math.floor((Date.now() - He) / 1e3);
      if (q >= ur) {
        Ae.current = !0, Et(!0);
        return;
      }
      if (!Ae.current) {
        const S = Vr(i);
        S >= 0 && (m < 0 ? m = S : S - m >= ya && (Ae.current = !0));
      }
      if (!Ae.current && q >= ba && !It.current && (It.current = !0, dn(!0)), Ae.current) {
        l = setTimeout(
          () => {
            p || Et(!0);
          },
          Math.max(1e3, (ur - q) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        p || es(d);
      }, _s);
    };
    return es(d), () => {
      p = !0, clearTimeout(l);
    };
  }, [x, He, rt]);
  const [vn, wn] = e.useState(!1), [qn, _r] = e.useState(""), Sr = (l, p, m) => {
    l.length && (p === "final" ? lr((d) => d.concat(l)) : Ye((d) => {
      const q = m || `q${E}`;
      it(q);
      const S = d[q] || { type: "text", value: "", other: "" };
      return { ...d, [q]: { ...S, attachments: (S.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (d, q, S, I) => {
      Sr(d, q, S), I && I.length ? _r(I.join("；")) : _r("");
    }, p = (d) => wn(d);
    Gt.set(i, l), Zt.set(i, p);
    const m = Ha(i);
    return m.length && m.forEach((d) => Sr([d.att], d.target, d.key)), wn(tn > 0), () => {
      Gt.get(i) === l && Gt.delete(i), Zt.get(i) === p && Zt.delete(i);
    };
  }, [i, E]);
  const _n = (l, p) => Fa(i, l, p), Sn = (l, p, m) => {
    const d = Ua(l);
    if (d.length) {
      try {
        l.preventDefault();
      } catch {
      }
      $s(d, i, p, m);
    }
  };
  e.useEffect(() => {
    if (!h || z) return;
    let l = !0;
    return jn(i).then((p) => {
      !l || !p || (p.kind === "skipped" && !p.answers && qt(!0), M(La(b, p)));
    }), () => {
      l = !1;
    };
  }, [h, i, z]), e.useEffect(() => {
    if (x) return;
    let l = !0, p = 0, m = 0, d = 0;
    cn.current || (cn.current = Date.now());
    let q = !!kt(i);
    const S = (A) => {
      !l || !A || !A.request_id || (q = !0, _(A.request_id), St(!1), m && (clearTimeout(m), m = 0), Ka(
        i,
        A.request_id,
        A.session_id || rr(),
        A.agent_id
      ));
    }, I = (A) => {
      l && (m && (clearTimeout(m), m = 0), d && (clearTimeout(d), d = 0), fo(
        A,
        A === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Me = kt(i), ee = async () => {
      if (!Me) return !1;
      const A = await Va(Me.request_id);
      if (!l) return !0;
      if (A.kind === "found") {
        const H = A.data;
        return H.tool_call_id && i && H.tool_call_id !== i ? (ie(i), !1) : (S(H), !0);
      }
      return A.kind === "orphan" ? (I("orphan"), !0) : (A.kind === "absent" && ie(i), !1);
    }, dt = (A = !1) => {
      if (l) {
        if (p += 1, A) {
          if (q) {
            I("gone");
            return;
          }
          const H = Date.now() - (cn.current || Date.now());
          if (p >= 12 && H >= Qa) {
            I("gone");
            return;
          }
        }
        m = setTimeout(te, p < 8 ? 700 : 5e3);
      }
    }, pe = () => {
      Pa(i, X(i)).then((A) => {
        if (l) {
          if (A.kind === "found") {
            S(A.data);
            return;
          }
          if (A.kind === "orphan") {
            I("orphan");
            return;
          }
          if (A.kind === "error") {
            dt(!1);
            return;
          }
          Za().then((H) => {
            if (l) {
              if (H) {
                if (H.tool_call_id && i && H.tool_call_id !== i) {
                  jn(i).then((Be) => {
                    if (l) {
                      if (Be) {
                        T(!0), ie(i);
                        return;
                      }
                      dt(!0);
                    }
                  });
                  return;
                }
                S(H);
                return;
              }
              jn(i).then((Be) => {
                if (l) {
                  if (Be) {
                    Be.kind === "skipped" && !Be.answers && qt(!0), T(!0), ie(i);
                    return;
                  }
                  dt(!0);
                }
              });
            }
          });
        }
      });
    }, te = () => {
      if (l) {
        if (!Me) {
          pe();
          return;
        }
        ee().then((A) => {
          !l || A || pe();
        });
      }
    };
    return d = setTimeout(() => {
      l && St(!0);
    }, Ja), te(), () => {
      l = !1, m && clearTimeout(m), d && clearTimeout(d);
    };
  }, [x, i]);
  const Er = async () => {
    _e(!0);
    try {
      const l = X(i);
      let p = await Fn(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const d = await os(l);
        d.ok && d.released ? p = d : d.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const d = p.reason === "host-stop";
        Re(
          p.reason === "orphan" ? "orphan" : "",
          p.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : d ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), N(
          "info",
          d ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        Re(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), N("info", "本次问卷已失效，已关闭");
    } catch (l) {
      N("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      _e(!1);
    }
  }, Ir = async () => {
    _e(!0);
    try {
      const l = X(i);
      let p = await Fn(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const d = await os(l);
        d.ok && d.released ? p = d : d.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        an(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), N("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const d = p.reason === "host-stop";
        an(d ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), N("info", d ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        an("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), N("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      N("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      _e(!1);
    }
  }, $t = we(b, be), Oe = $t.length, ke = E >= Oe, Z = ke ? -1 : $t[E], lt = ke ? Oe : E;
  e.useEffect(() => {
    if (ts(K("mode", "manual")) !== "manual" || !K("notify_manual_mode", !1) || x || oe || le || !Ht(c) || !b.length) return;
    const p = we(b, be).filter((m) => !Ke(be[`q${m}`])).length;
    ga(i, w, p);
  }, [un, x, oe, le, lt]);
  const Nt = Math.max(0, Number(K("slow_question_sec", xa)) || 0) * 1e3, mo = Math.round(Nt / 1e3);
  e.useEffect(() => {
    if (x || oe || le || Nt <= 0) return;
    if (B !== lt) {
      Ie(lt), D(Date.now()), se(!1);
      return;
    }
    if (!v) {
      D(Date.now());
      return;
    }
    if (ge) return;
    const l = v + Nt - Date.now();
    if (l <= 0) {
      se(!0);
      return;
    }
    let p = !1;
    const m = setTimeout(() => {
      p || se(!0);
    }, l);
    return () => {
      p = !0, clearTimeout(m);
    };
  }, [x, oe, le, lt, B, v, ge, Nt]);
  const V = Z >= 0 ? b[Z] : null, Qe = `q${Z}`, W = Z >= 0 && be[Qe] || { type: G(V), value: G(V) === "multi" ? [] : "", other: "" }, Xe = (l) => {
    var d;
    Te && nt(""), Z >= 0 && it(`q${Z}`);
    const p = { ...be, [Qe]: { ...l, skipped: !1 } }, m = we(b, p);
    b.forEach((q, S) => {
      m.indexOf(S) === -1 && delete p[`q${S}`];
    }), mt(i, {
      answers: Pn(p, (d = bt(i)) == null ? void 0 : d.answers, At.current)
    }), Ye(p);
  };
  e.useEffect(() => {
    E > Oe && $(Oe);
  }, [Oe, E]);
  const En = async (l, p) => {
    const m = await fetch(P(l), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(p)
    }), d = await m.json().catch(() => ({}));
    if (!m.ok) {
      const q = new Error(d && d.detail || "HTTP " + m.status);
      throw q.status = m.status, q;
    }
    return d;
  }, In = () => {
    var l;
    return Pn(be, (l = bt(i)) == null ? void 0 : l.answers, At.current);
  }, ho = () => !!K("gate_unsaved", !0), Tr = (l, p) => {
    if (!ho()) return [];
    const m = [];
    if (typeof p == "number")
      return we(b, l).indexOf(p) !== -1 && !Ke(l[`q${p}`]) && m.push(p + 1), m;
    const d = new Set(we(b, l));
    return b.forEach((q, S) => {
      d.has(S) && !Ke(l[`q${S}`]) && m.push(S + 1);
    }), m;
  }, Ar = (l, p, m) => {
    const d = "第 " + l.join("、") + " 题", q = m === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    nt("⛔ " + d + "尚未选择。" + q);
    const S = we(b, p).length;
    En("/question-modal/gate-block", {
      request_id: y,
      tool_call_id: i,
      session_id: X(i),
      missing: l,
      answered: S - l.length,
      total: S,
      bundle: Kr
    }).catch(() => {
    });
  }, Rt = async (l, p = !1) => {
    if (!y)
      return N("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const m = In();
    if (!p) {
      const d = Tr(m);
      if (d.length)
        return Ar(d, m, "提交"), "blocked";
      nt("");
    }
    _e(!0);
    try {
      const d = await En("/question-modal/answer", {
        request_id: y,
        session_id: X(i),
        answers: m,
        other: Ve,
        attachments: tt
      });
      return d && d.orphan ? (fetch(
        P("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(X(i)),
        { method: "POST", headers: j() }
      ).catch(() => {
      }), Re(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), N("info", "本次问卷已失效，已关闭"), "sent") : (ie(i), ln(ei(b, m, Ve, tt)), dr(Date.now()), dn(!1), Et(!1), Ae.current = !1, It.current = !1, st.current = !0, T(!0), "sent");
    } catch (d) {
      return d && d.status === 404 ? (Re(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), N("info", "本次问卷已失效，已关闭"), "blocked") : (N("error", "提交失败: " + d.message), p ? (Ze.current = !1, xn.current += 1, xn.current >= Rn && N(
        "warning",
        "自动提交连续失败 " + Rn + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), yn((q) => q + 1), "not-ready") : "blocked");
    } finally {
      _e(!1);
    }
  }, zr = () => K("skip_mode", "per_question") === "whole", go = () => {
    Z < 0 || (Te && nt(""), Je(Ge.current), xe.current[Ge.current] = !0, it(`q${Z}`), Ye((l) => {
      const p = { ...l };
      p[`q${Z}`] = {
        type: (l[`q${Z}`] || {}).type || G(V),
        value: ((l[`q${Z}`] || {}).type || G(V)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const m = we(b, p);
      return b.forEach((d, q) => {
        m.indexOf(q) === -1 && delete p[`q${q}`];
      }), p;
    }), $((l) => l + 1));
  }, bo = () => {
    if (ke) {
      Rt();
      return;
    }
    const l = In(), p = Tr(l, Z);
    if (p.length) {
      Ar(p, l, "下一步");
      return;
    }
    Te && nt(""), $((m) => m + 1);
  }, xo = async () => {
    if (!y) {
      N("warning", "问卷尚未就绪，请稍候");
      return;
    }
    Je(), _e(!0);
    try {
      const l = await En("/question-modal/skip", {
        request_id: y,
        session_id: X(i)
      });
      if (l && l.orphan) {
        Re(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), N("info", "本次问卷已失效，已关闭");
        return;
      }
      N("info", "已跳过问卷"), ie(i), qt(!0), ln("用户跳过了本次问卷。"), dr(Date.now()), dn(!1), Et(!1), Ae.current = !1, It.current = !1, st.current = !0, T(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Re(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), N("info", "本次问卷已失效，已关闭");
        return;
      }
      N("error", "跳过失败: " + l.message);
    } finally {
      _e(!1);
    }
  };
  e.useEffect(() => {
    if (x || ae !== "ai" && ae !== "recommend" || ce || !Ht(c) || !b.length || F) return;
    if (ke) {
      if (Ze.current || xn.current >= Rn) return;
      const pe = In();
      if (!$t.every(
        (A, H) => !!Ne.current[H] || Ke(pe[`q${A}`])
      ) || !y) return;
      Ze.current = !0, Rt(void 0, !0).then((A) => {
        A === "not-ready" && (Ze.current = !1);
      });
      return;
    }
    const l = E;
    if (zt.current[l] || ae === "ai" && !Ne.current[l]) return;
    const p = $t[l], m = b[p], d = G(m), q = ns(m), S = Ce.current[l], I = S && S.per_question && S.per_question[0], Me = I ? String(I.choice || "").trim() : "";
    if (ae === "ai" && !Ne.current[l]) return;
    zt.current[l] = !0;
    const ee = q.length ? q.join("、") : Me, dt = !!ee;
    it(`q${p}`), Ye((pe) => {
      const te = { ...pe }, A = `q${p}`, H = te[A] || { type: d, value: d === "multi" ? [] : "", other: "" };
      if (!dt)
        te[A] = { ...H, type: d, value: d === "multi" ? [] : "", other: "", skipped: !0 };
      else if (d === "multi") {
        const ut = m.options || [], Le = (de) => String(de).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        te[A] = { ...H, type: d, value: ee.split(/[、,，]/).map((de) => Le(de)).filter(Boolean).map((de) => {
          const ue = ut.find((Fr) => ne(Fr) === de || he(Fr) === de);
          return ue ? ne(ue) : de;
        }) };
      } else if (d === "single") {
        const ut = m.options || [], Le = (ue) => String(ue).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), de = ut.find((ue) => ne(ue) === ee || he(ue) === ee) || ut.find((ue) => ne(ue) === Le(ee) || he(ue) === Le(ee));
        te[A] = { ...H, type: d, value: de ? ne(de) : ee };
      } else
        te[A] = { ...H, type: d, value: ee };
      const Be = we(b, te);
      return b.forEach((ut, Le) => {
        Be.indexOf(Le) === -1 && delete te[`q${Le}`];
      }), te;
    }), xe.current[l] = !0, Ne.current[l] = !0, $((pe) => pe + 1), yn((pe) => pe + 1);
  }, [
    x,
    ae,
    ce,
    F,
    i,
    E,
    oo,
    Oe,
    c,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    y
  ]);
  const Ot = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Tn = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, An = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Mt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, zn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Cr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Cn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, yo = { display: "flex", flexDirection: "column", gap: 8 }, Bt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, Lt = {
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
  }, ct = {
    ...Lt,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, ko = {
    ...Lt,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, $n = {
    ...Lt,
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
  }, $r = {
    // Restored to the original look (user asked for options to stay as-is).
    ...$n,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Nr = {
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
  }, vo = { height: 32, fontSize: 13, borderRadius: 8 }, Rr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Or = (l) => {
    const p = ne(l);
    return W.type === "multi" ? Array.isArray(W.value) && W.value.indexOf(p) !== -1 : W.value === p;
  }, Mr = Or(je), Br = (l) => {
    if (x || F) return;
    const p = ne(l);
    if (W.type === "multi") {
      const m = Array.isArray(W.value) ? W.value.slice() : [], d = m.indexOf(p);
      d === -1 ? m.push(p) : m.splice(d, 1), Xe({ ...W, value: m, other: m.indexOf(je) !== -1 ? W.other : "" });
    } else
      Xe({ ...W, value: p });
  }, wo = !!K("show_recommend_badge", !0), Lr = K("badge_position", "left") === "right", qo = K("badge_style", "rect") === "round", Pr = (l) => l && wo ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: qo ? { ...Nr, borderRadius: 999 } : Nr
  }, "AI 推荐") : null, _o = !!K("auto_number_options", !0), So = !!K("highlight_recommended", !1), Eo = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, jr = (l, p, m, d, q, S) => e.createElement(
    "button",
    {
      key: d,
      type: "button",
      disabled: x || F,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: q && So ? { ...p ? $r : $n, ...Eo } : p ? $r : $n,
      onClick: m
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Lr ? null : Pr(q),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (S && _o ? S + ". " : "") + l),
    Lr ? Pr(q) : null
  );
  if (!x && !Ht(c))
    return e.createElement(
      "div",
      { style: Ot, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Tn, className: "qm-header" },
        e.createElement(
          "div",
          { style: An },
          On(e),
          e.createElement("span", { style: Mt, className: "qm-title" }, w)
        ),
        e.createElement("span", { style: zn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Cr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      pr ? e.createElement(
        "div",
        { style: Bt },
        e.createElement("button", {
          type: "button",
          disabled: F,
          style: { ...ct, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Er
        }, "释放本次问卷")
      ) : null
    );
  if (x) {
    const l = () => {
      const m = qa({
        submittedAt: He,
        deadReason: le,
        releasedNote: Se,
        skippedAll: oe,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: rt,
        pastSoft: pn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!st.current
      });
      return m ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": i,
        "data-qm-phase": m.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: m.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, wa(m.phase)) : null;
    }, p = !!st.current;
    return oe && !_t ? e.createElement(
      "div",
      {
        style: {
          ...Ot,
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
        le ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      e.createElement("span", {
        style: { ...Mt, flex: Se ? 0 : 1, opacity: 0.75 }
      }, w),
      Se ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Se) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...ct,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => cr(!0)
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
        disabled: F,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...ct,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Ir
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: Ot, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Tn, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: An },
          On(e),
          e.createElement("span", { style: Mt }, w)
        ),
        e.createElement(
          "span",
          { style: { ...zn, color: le ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          le ? "已失效" : oe ? "已跳过" : "已完成"
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
      }, oe ? et ? et + `

` + Jt(b) : `已跳过本次问卷。

` + Jt(b) : et || z || k || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + Jt(b)),
      oe && _t ? e.createElement(
        "div",
        { style: Bt },
        e.createElement("button", {
          type: "button",
          style: ct,
          onClick: () => cr(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Bt, marginTop: 8, gap: 10 } },
        Se ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Se) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: F,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...ct, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Ir
        }, "释放阻塞") : null
      )
    );
  }
  const Dr = ge && B === lt;
  let Pt = null;
  if (ke)
    Pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Cn }, "其他意见（可选）"),
      e.createElement(o, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Ve,
        style: Rr,
        onChange: (l) => Bs(l.target.value),
        onPaste: (l) => Sn(l, "final", "final")
      }),
      Wn({
        R: e,
        files: tt,
        disabled: x || F,
        uploading: vn,
        error: qn,
        onPick: () => _n("final", "final"),
        onRemove: (l) => lr((p) => p.filter((m, d) => d !== l))
      })
    );
  else if (V && G(V) === "text")
    Pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Cn, fontSize: 13, color: "var(--app-text, inherit)" } }, Yt(V, Z)),
      e.createElement(o, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof W.value == "string" ? W.value : "",
        style: Rr,
        onChange: (l) => Xe({ ...W, value: l.target.value, other: "" }),
        onPaste: (l) => Sn(l, "q", Qe)
      }),
      Wn({
        R: e,
        files: W.attachments || [],
        disabled: x || F,
        uploading: vn,
        error: qn,
        onPick: () => _n("q", Qe),
        onRemove: (l) => Xe({
          ...W,
          attachments: (W.attachments || []).filter((p, m) => m !== l)
        })
      })
    );
  else if (V) {
    const l = ns(V), p = l.length ? l : Ee && Ee.per_question && Ee.per_question[0] && String(Ee.per_question[0].choice || "").trim() ? [String(Ee.per_question[0].choice).trim()] : l, m = (V.options || []).map((d, q) => jr(
      he(d),
      Or(d),
      () => Br(d),
      "o" + q,
      Ca(V, d, p),
      q + 1
    ));
    m.push(jr("其他", Mr, () => Br(je), "other")), Mr && (m.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: W.other,
      style: { ...vo, marginTop: 2 },
      onChange: (d) => Xe({ ...W, other: d.target.value }),
      onPaste: (d) => Sn(d, "q", Qe)
    })), m.push(Wn({
      R: e,
      files: W.attachments || [],
      disabled: x || F,
      uploading: vn,
      error: qn,
      onPick: () => _n("q", Qe),
      onRemove: (d) => Xe({
        ...W,
        attachments: (W.attachments || []).filter((q, S) => S !== d)
      })
    }))), Pt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Cn, fontSize: 13, color: "var(--app-text, inherit)" } }, Yt(V, Z)),
      e.createElement("div", { style: { ...yo, marginTop: 8 } }, m)
    );
  }
  const Nn = Oe + 1, Io = ke ? Nn + "/" + Nn : E + 1 + "/" + Nn, pt = {
    ...Lt,
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
    { style: Ot, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Tn, className: "qm-header" },
      e.createElement(
        "div",
        { style: An },
        On(e),
        e.createElement("span", { style: Mt, className: "qm-title" }, w)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        ti({
          R: e,
          providers: Hs,
          modelId: mr,
          disabled: x || F,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: Qs,
          onOpenChange: Xs,
          tab: Ks,
          onTabChange: Ys,
          onChange: (l) => {
            Ct({ modelId: l }), Ue(null), Ce.current = {}, xe.current = {}, at((p) => p + 1);
          }
        }),
        ri({
          R: e,
          templates: yr,
          value: $e,
          open: eo,
          onOpenChange: to,
          disabled: x || F,
          onSelect: qr,
          onManage: () => kr(!0)
        }),
        ni({
          R: e,
          mode: ae,
          disabled: x || F,
          onChange: (l) => {
            Ct({ mode: l }), l === "ai" && (xe.current = {}), l === "ai" || l === "recommend" ? (zt.current = {}, Ne.current = {}, Ze.current = !1, at((p) => p + 1)) : Je();
          }
        }),
        oi({
          R: e,
          busy: xr,
          result: Ee,
          error: Gs,
          mode: ae,
          disabled: x || F,
          open: Zs,
          onOpenChange: Js,
          onRun: () => {
            kn("manual");
          },
          onRerun: lo,
          onApply: uo,
          onCancel: co,
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
                checked: fn,
                onChange: (l) => Ct({ withContext: !!l.target.checked })
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
                checked: mn,
                onChange: (l) => Ct({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (ae === "ai" || ae === "recommend") && !x ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: F,
          onClick: po,
          style: {
            ...pt,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...ce ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: ce ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, ce ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: zn, key: "qm-step" }, Io)
      )
    ),
    e.createElement("div", { style: Cr }, Pt),
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    si({
      R: e,
      open: no,
      templates: yr,
      value: $e,
      edit: ro,
      onEditChange: bn,
      onClose: () => {
        kr(!1), bn(null);
      },
      onSelect: (l) => qr(l),
      onSave: ao,
      onDelete: io
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
    (Dr || pr && !y) && !x ? e.createElement(
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
        (Dr ? "⚠️ 本题已超过 " + mo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (y ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: {
          ...pt,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Er,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Te && !x ? e.createElement("div", {
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
      "data-qm-bundle": Kr
    }, Te) : null,
    e.createElement(
      "div",
      { style: Bt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: E === 0 || F,
        style: { ...pt, marginRight: "auto", opacity: E === 0 ? 0.5 : 1 },
        onClick: () => $((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: F,
          style: pt,
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
          onClick: ke ? () => Rt(void 0, !0) : zr() ? () => Rt(void 0, !0) : go
        },
        ke || zr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: pt,
        onClick: xo
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: ko,
        onClick: bo
      }, ke ? "提交" : "下一步")
    )
  );
}
const as = 12, u = {
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
let ht = null;
function J(r, e, t) {
  if (r in u.draft) return u.draft[r];
  if (t === "global") {
    const s = u.globalCfg;
    return s && r in s ? s[r] : e;
  }
  const n = u.cfg && u.cfg.config;
  return n && r in n ? n[r] : e;
}
function ii(r) {
  const e = u.cfg && u.cfg.config;
  if (!e) return !1;
  const t = e.__sources__, n = e[r];
  return !!(t && t[r] === "session" && (n === "" || n === null));
}
function ve(r) {
  const e = u.cfg && u.cfg.config, t = e && e.__sources__;
  return !!(t && t[r] === "session");
}
function Q(r, e) {
  const t = u.cfg && u.cfg.config;
  (t && r in t ? t[r] : void 0) === e ? delete u.draft[r] : u.draft[r] = e, u.saveMsg = "", O();
}
function is() {
  return Object.keys(u.draft).length;
}
async function ir() {
  try {
    const r = await fetch(P("/question-modal/prefs"), { headers: j() });
    if (!r.ok) return;
    const e = await r.json(), t = e && e.prefs || {};
    u.globalCfg = t && typeof t == "object" ? t : {};
    try {
      O();
    } catch {
    }
  } catch {
  }
}
async function li() {
  const r = Object.keys(u.draft);
  if (!r.length || u.saving) return;
  const e = u.scope === "session", t = {};
  if (r.forEach((n) => {
    t[n] = u.draft[n];
  }), e) {
    const n = u.cfg && u.cfg.config || {}, s = n.__follow_active__ === !0;
    yi.forEach((o) => {
      if (o in t || o === "model_id" && s) return;
      const a = n[o];
      a == null || a === "" || (t[o] = a);
    });
  }
  u.saving = !0, u.saveMsg = "", O();
  try {
    let n = "/question-modal/prefs", s = t;
    e && (n = "/question-modal/session-prefs", s = {
      chat_id: u.chatId,
      session_id: u.sessionId,
      agent_id: u.agentId,
      settings: t
    });
    const o = await fetch(P(n), {
      method: "POST",
      headers: j(),
      body: JSON.stringify(s)
    }), a = await o.json().catch(() => ({}));
    if (!o.ok) {
      u.saving = !1, u.saveMsg = a && a.detail ? String(a.detail) : "保存失败（" + o.status + "）", O();
      return;
    }
    u.saving = !1, u.draft = {}, or(), u.saveMsg = e ? "已保存到会话模式（仅本会话生效，全局默认不变）。" : "已保存为全局默认（对所有会话生效）。", e || ir(), sn(
      u.chatId,
      !0,
      u.sessionId,
      u.agentId
    ).then((c) => {
      c && (u.cfg = c);
      try {
        O();
      } catch {
      }
    }).catch(() => {
    });
  } catch (n) {
    u.saving = !1, u.saveMsg = "保存请求失败：" + (n && n.message ? n.message : n);
  }
  try {
    O();
  } catch {
  }
}
async function ci() {
  if (!(u.saving || !window.confirm(
    "将移除本会话的全部设置覆盖，之后跟随全局默认。已保存的值无法恢复，继续吗？"
  ))) {
    u.saving = !0, u.saveMsg = "", O();
    try {
      const e = await fetch(P("/question-modal/session-prefs/clear"), {
        method: "POST",
        headers: j(),
        body: JSON.stringify({
          chat_id: u.chatId,
          session_id: u.sessionId,
          agent_id: u.agentId
        })
      }), t = await e.json().catch(() => ({}));
      if (u.saving = !1, !e.ok) {
        u.saveMsg = t && t.detail ? String(t.detail) : "清空失败（" + e.status + "）", O();
        return;
      }
      u.draft = {}, or(), u.saveMsg = "已清空本会话覆盖，现跟随全局默认。";
      const n = await sn(
        u.chatId,
        !0,
        u.sessionId,
        u.agentId
      );
      n && (u.cfg = n);
    } catch (e) {
      u.saving = !1, u.saveMsg = "清空请求失败：" + (e && e.message ? e.message : e);
    }
    try {
      O();
    } catch {
    }
  }
}
function Ns() {
  u.draft = {}, u.saveMsg = "";
}
function Rs() {
  sr().then((r) => {
    u.templates = (r && r.items || []).filter((e) => e && e.id), u.templateOptions = u.templates.map((e) => e.id);
    try {
      O();
    } catch {
    }
  }).catch(() => {
  });
}
function pi() {
  u.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, u.saveMsg = "", O();
}
function di(r) {
  const e = u.templates.filter((t) => t.id === r)[0];
  e && (u.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, u.saveMsg = "", O());
}
function ls(r, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([r + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  u.tplEdit && (u.tplEdit[r] = e, O());
}
function ui() {
  u.tplEdit = null, O();
}
async function fi() {
  const r = u.tplEdit;
  if (!r || u.tplBusy) return;
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
    u.saveMsg = "模板名称不能为空", O();
    return;
  }
  u.tplBusy = !0, O();
  const t = {
    id: r.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: r.system_prompt,
    user: r.user_prompt
  }, n = await Es(t);
  if (u.tplBusy = !1, n && n.ok === !1) {
    u.saveMsg = String(n.error || n.detail || "保存失败"), O();
    return;
  }
  u.tplEdit = null, u.saveMsg = r.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Rs(), O();
}
async function mi(r) {
  const e = u.templates.filter((s) => s.id === r)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || r) + "」？") : !1)) return;
  const n = await Is(r);
  if (n && n.ok === !1) {
    u.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）"), O();
    return;
  }
  u.saveMsg = "模板已删除", Rs(), O();
}
function hi() {
  u.visible = !0, u.chatId = "", u.sessionId = rr(), gi(), u.agentId = rn || (() => {
    try {
      return re().getSelectedAgentId ? re().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), or(), O(), Os(() => {
    const r = !!(u.cfg && u.cfg.has_session);
    u.tab = r ? "session" : "default", u.scope = r ? "session" : "global", u.draft = {}, u.saveMsg = "", O(), u.tab === "global" && ir();
  });
}
let Ut = !1;
function gi() {
  Ut || (Ut = !0, Promise.all([Ts(), sr()]).then((r) => {
    Ut = !1;
    const e = r[0] || [], t = r[1] || {};
    u.providerGroups = e.map((n) => {
      const s = String(n && (n.id || n.provider_id) || ""), a = (n && n.models || []).concat(n && n.extra_models || []).filter(Boolean).map((c) => {
        const i = typeof c == "string" ? c : c && (c.name || c.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: s,
        name: String(n && (n.name || n.title) || s),
        models: a
      };
    }).filter((n) => n.id && n.models.length > 0), u.modelOptions = u.providerGroups.flatMap((n) => n.models.map((s) => n.id + ":" + s)), u.templates = (t.items || []).filter((n) => n && n.id), u.templateOptions = u.templates.map((n) => n.id);
    try {
      O();
    } catch {
    }
  }).catch(() => {
    Ut = !1;
  }));
}
function bi(r) {
  const e = String(r || ""), t = e.indexOf(":");
  return t <= 0 ? { provider: "", model: e } : { provider: e.slice(0, t), model: e.slice(t + 1) };
}
let Hn = !1;
const Un = [];
function Os(r) {
  if (Hn) {
    r && Un.push(r);
    return;
  }
  Hn = !0;
  const e = u.chatId, t = () => {
    Hn = !1;
    const n = Un.splice(0);
    try {
      n.forEach((s) => s());
    } catch {
    }
  };
  r && Un.push(r), sn(
    e,
    !0,
    u.sessionId,
    u.agentId
  ).then((n) => {
    if (u.chatId !== e) {
      t();
      return;
    }
    n ? (u.cfg = n, u.cfgError = "") : u.cfgError = "读取配置失败（后端不可达）", t();
    try {
      O();
    } catch {
    }
  }).catch(() => {
    t();
  });
}
function O() {
  const r = re().React, e = re().ReactDOM;
  if (r) {
    if (!e || typeof e.render != "function") {
      if (u.visible) {
        try {
          const t = qe();
          t && t.Modal && typeof t.Modal.info == "function" && t.Modal.info({
            title: "问卷设置",
            centered: !0,
            width: 480,
            okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。"
          });
        } catch {
        }
        u.visible = !1;
      }
      return;
    }
    ht || (ht = document.createElement("div"), ht.id = "qm-settings-root", document.body.appendChild(ht)), e.render(r.createElement(qi, {
      R: r,
      open: u.visible,
      onClose: () => {
        if (is() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Ns();
        }
        u.visible = !1, u.saveMsg = "", O();
      },
      tab: u.tab,
      onTabChange: (t) => {
        u.tab = t, u.scope = Ms(t) ? "session" : "global", u.saveMsg = "", u.draft = {}, O(), Os(), (t === "global" || t === "default") && ir();
      },
      scope: u.scope,
      sessData: u.sessData,
      cfg: u.cfg,
      cfgError: u.cfgError,
      chatId: u.chatId,
      dirtyCount: is(),
      saving: u.saving,
      saveMsg: u.saveMsg,
      modelOptions: u.modelOptions,
      templateOptions: u.templateOptions,
      providerGroups: u.providerGroups,
      templates: u.templates,
      tplEdit: u.tplEdit,
      tplBusy: u.tplBusy
    }), ht);
  }
}
function xi(r) {
  const { R: e, onOpen: t } = r, n = qe(), s = n && n.Button, o = "问卷设置", a = { fontSize: 12, padding: "2px 8px", height: 28 };
  return s ? e.createElement(s, { type: "text", size: "small", style: a, onClick: t }, o) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: a,
    onClick: t
  }, o);
}
const Gn = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  { key: "prompt", label: "提示词", hint: "内置与自定义提示词模板" }
], yi = ["mode", "model_id", "template_id", "with_context", "parallel"], Ms = (r) => r === "session";
function ki(r, e, t) {
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
function vi(r, e) {
  return e === "readonly" ? !0 : r === "session" && e === "global";
}
function U(r, e, t, n, s, o, a, c) {
  const i = o || "global", g = vi(a, i), h = [
    r.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      r.createElement("span", { key: "tt" }, t),
      ki(r, "sc", i),
      g && i === "global" ? r.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? r.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], k = [
    r.createElement("div", { className: "qm-set-rowlabel", key: "l" }, h),
    r.createElement("div", {
      className: "qm-set-rowctl" + (c ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, n)
  ];
  return r.createElement("div", {
    className: "qm-set-row" + (g ? " qm-set-rowlocked" : ""),
    key: e,
    "data-qm-locked": g ? "1" : "0"
  }, k);
}
function cs(r, e, t, n, s, o) {
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
function gt(r, e, t, n, s) {
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
function Pe(r, e, t, n, s, o) {
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
function ps(r, e, t, n, s, o) {
  const a = bi(t), i = n.map((f) => f.id).indexOf(a.provider) >= 0 ? a.provider : "", g = i ? (n.filter((f) => f.id === i)[0] || { models: [] }).models : [], h = g.indexOf(a.model) >= 0 ? a.model : "", k = (f, x) => {
    s && s(f ? f + ":" + x : "");
  }, b = r.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: i,
    disabled: !s,
    title: "厂商",
    onChange: (f) => {
      const x = f && f.target ? f.target.value : "", T = x ? (n.filter((z) => z.id === x)[0] || { models: [] }).models : [];
      k(x, x && T[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [r.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(n.map((f, x) => r.createElement(
    "option",
    { key: "g" + x, value: f.id },
    f.name === f.id ? f.id : f.name + "（" + f.models.length + "）"
  )))), w = r.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: h,
    disabled: !s || !i,
    title: i ? "选择模型" : "先选厂商",
    onChange: (f) => {
      const x = f && f.target ? f.target.value : "";
      k(i, x);
    }
  }, i ? g.map((f, x) => r.createElement("option", { key: "m" + x, value: f }, f)) : [r.createElement("option", { key: "m0", value: "" }, "—")]);
  return r.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    b,
    r.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    w,
    o ? r.createElement("span", {
      key: "d",
      className: "qm-set-srcdot",
      "data-qm-src": "session",
      title: "此项已被会话覆盖（仅当前会话生效）"
    }) : null
  ]);
}
function wi(r, e, t, n, s) {
  const o = [], a = t === "session" ? "session" : "global", c = a === "session", i = (M, y) => r.createElement("div", { className: "qm-set-section", key: "sec-" + M }, y), g = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, h = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, k = {
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
  }, w = {
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
  }, x = s && s.templateOptions || [];
  s && s.modelOptions;
  const T = s && s.providerGroups || [], z = x.map((M) => {
    const y = u.templates.filter((_) => String(_.id) === String(M))[0];
    return { value: M, label: y && (y.name || y.id) || M };
  });
  if (e === "session") {
    o.push(i("answer", "作答")), o.push(U(
      r,
      "s1",
      "答题模式",
      cs(
        r,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        h[String(J("mode", "manual"))] || "人工",
        (y) => Q("mode", g[y] || "manual"),
        ve("mode")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      a
    )), o.push(i("analysis", "分析")), o.push(U(
      r,
      "s2",
      "默认模型",
      ps(
        r,
        "sel2",
        String(J("model_id", "")),
        T,
        (y) => Q("model_id", y),
        ve("model_id")
      ),
      // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
      //   跟随中   → 指明跟的是"本会话"的对话模型
      //   显式设空 → 如实说你清掉了它
      //   其余     → 正常说明
      ii("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
      "session",
      a,
      !0
    ));
    const M = String(J("template_id", "")) || z[0] && z[0].value || "";
    o.push(U(
      r,
      "s3",
      "提示词模板",
      z.length ? Pe(
        r,
        "sel3",
        M,
        z,
        (y) => Q("template_id", y),
        ve("template_id")
      ) : Pe(r, "sel3", "默认六步思维链"),
      x.length ? "" : "模板库未加载，暂不可选",
      "session",
      a
    )), o.push(U(
      r,
      "s4",
      "携带上下文",
      gt(
        r,
        "s4sw",
        !!J("with_context", !1),
        (y) => Q("with_context", y),
        ve("with_context")
      ),
      "附带上次决策与会话历史",
      "session",
      a
    )), o.push(U(
      r,
      "s5",
      "并行分析各题",
      gt(
        r,
        "s5sw",
        !!J("parallel", !1),
        (y) => Q("parallel", y),
        ve("parallel")
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
        disabled: !!u.saving,
        onClick: () => {
          ci();
        }
      }, "清空本会话覆盖"),
      r.createElement("span", {
        style: { fontSize: 12, color: "var(--app-text-tertiary,#8c8c8c)" }
      }, "移除本会话的全部覆盖，恢复为跟随全局默认")
    ));
  } else if (e === "global" || e === "default")
    if (e === "default")
      o.push(i("answer", "作答")), o.push(U(
        r,
        "a1",
        "默认答题模式",
        cs(
          r,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          h[String(J("mode", "manual", "global"))] || "人工",
          (y) => Q("mode", g[y] || "manual"),
          ve("mode")
        ),
        "新问卷的默认推进方式（可被会话覆盖）",
        "both",
        a
      )), o.push(i("analysis", "分析")), o.push(U(
        r,
        "b1",
        "默认模型",
        ps(
          r,
          "sel2",
          String(J("model_id", "", "global")),
          T,
          (y) => Q("model_id", y),
          ve("model_id")
        ),
        "仅在「自动分析」模式下使用（可被会话覆盖）",
        "both",
        a,
        !0
      )), o.push(U(
        r,
        "b2",
        "提示词模板",
        z.length ? Pe(
          r,
          "sel3",
          String(J("template_id", "", "global")) || z[0].value,
          z,
          (y) => Q("template_id", y),
          ve("template_id")
        ) : Pe(r, "sel3", "默认六步思维链"),
        z.length ? "可被会话覆盖" : "模板库未加载，暂不可选",
        "both",
        a
      )), o.push(U(
        r,
        "b3",
        "携带上下文",
        gt(
          r,
          "s3",
          !!J("with_context", !1, "global"),
          (y) => Q("with_context", y),
          ve("with_context")
        ),
        "附带上次决策与会话历史（可被会话覆盖）",
        "both",
        a
      )), o.push(U(
        r,
        "b4",
        "并行分析各题",
        gt(
          r,
          "s4",
          !!J("parallel", !1, "global"),
          (y) => Q("parallel", y),
          !1
        ),
        "更快，但更耗额度",
        "global",
        a
      ));
    else {
      o.push(i("behavior", "行为")), o.push(U(
        r,
        "e5",
        "人工模式时提醒",
        gt(
          r,
          "s8",
          !!J("notify_manual_mode", !1, "global"),
          (v) => Q("notify_manual_mode", v),
          !1
        ),
        "问卷弹出时发系统通知（仅人工模式，每份只提醒一次）；首次会请求通知权限",
        "global",
        a
      )), o.push(U(
        r,
        "e6",
        "单题分析超时",
        Pe(
          r,
          "sel4",
          b[Number(J("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (v) => Q("model_timeout_sec", k[v] ?? 120),
          !1
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        a
      )), o.push(i("misc", "杂项")), o.push(U(
        r,
        "d4",
        "等待提示阈值",
        Pe(
          r,
          "sel5",
          f[Number(J("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (v) => Q("wait_hint_sec", w[v] ?? 180),
          !1
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        a
      ));
      const y = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], _ = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, E = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, $ = Number(J("gate_log_limit", 200, "global"));
      o.push(U(
        r,
        "d5",
        "拦截记录",
        Pe(
          r,
          "sel6",
          E[$] || "最近 200 条（默认）",
          y,
          (v) => Q("gate_log_limit", _[v] ?? 200),
          !1
        ),
        "用于排查卡住问题；「不保留」= 不记录",
        "global",
        a
      ));
    }
  else if (e === "prompt") {
    const M = u.templates, y = u.tplEdit;
    if (o.push(U(
      r,
      "p0",
      "模板库共享范围",
      r.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      a
    )), M.length ? o.push(r.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      M.map((_, E) => {
        const $ = !!_.builtin, D = (String(_.note || _.desc || "").trim() || String(_.system || _.system_prompt || _.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), B = D.length > 90 ? D.slice(0, 90) + "…" : D;
        return r.createElement("div", { className: "qm-set-item", key: "i" + E }, [
          r.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            r.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(_.name || _.id)
            ),
            r.createElement("span", {
              className: "qm-set-tag" + ($ ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, $ ? "内置" : "自定义"),
            r.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(_.id),
              onClick: () => {
                di(String(_.id));
              }
            }, "编辑"),
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini" + ($ ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(_.id),
              disabled: $,
              title: $ ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                $ || mi(String(_.id));
              }
            }, "删除")
          ]),
          r.createElement("div", { className: "qm-set-itemdesc", key: "d" }, B)
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
          pi();
        }
      }, "＋ 新建模板")
    ])), y) {
      const _ = (E, $, v, D, B) => {
        var Ie, ge;
        return r.createElement("div", { className: "qm-set-field", key: "f-" + $ }, [
          r.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, E),
          v ? r.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: D,
            "data-qm-tpl-field": $,
            placeholder: B,
            value: String(((Ie = u.tplEdit) == null ? void 0 : Ie[$]) || ""),
            onChange: (se) => ls($, se && se.target ? se.target.value : "")
          }) : r.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": $,
            placeholder: B,
            value: String(((ge = u.tplEdit) == null ? void 0 : ge[$]) || ""),
            onChange: (se) => ls($, se && se.target ? se.target.value : "")
          })
        ]);
      };
      o.push(r.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (y.id || "new")
      }, [
        r.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          y.id ? "编辑模板：" + (y.name || y.id) : "新建模板"
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
            disabled: !!u.tplBusy,
            onClick: () => {
              fi();
            }
          }, u.tplBusy ? "保存中…" : "保存"),
          r.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              ui();
            }
          }, "取消")
        ])
      ]));
    }
  }
  return r.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
}
function qi(r) {
  const { R: e, open: t, onClose: n } = r;
  if (!t) return null;
  const s = qe(), o = s && s.Modal, a = r.tab || "session", c = Ms(a) ? "session" : "global", i = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Gn.map((_) => e.createElement("button", {
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
  ), g = Gn.filter((_) => _.key === a)[0] || Gn[0], h = !!(r.cfg && r.cfg.has_session), k = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    e.createElement("div", {
      key: "b",
      "data-qm-scope-badge": "1",
      className: "qm-set-badge" + (h ? " qm-set-badgeon" : " qm-set-badgeglobal")
    }, h ? "会话模式" : "默认模式")
  ]), b = e.createElement("div", { className: "qm-set-subhint", key: "sh" }, g.hint), w = null, f = wi(e, a, c, r.sessData, {
    modelOptions: r.modelOptions,
    templateOptions: r.templateOptions,
    providerGroups: r.providerGroups
  }), x = r.dirtyCount || 0, T = c === "session" ? "保存到会话模式（覆盖全局默认，仅本会话）" : "保存为全局默认（对所有会话生效）", z = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("button", {
      key: "save",
      type: "button",
      className: "qm-set-btn qm-set-btnprimary",
      "data-qm-save": "1",
      disabled: !x || !!r.saving,
      onClick: () => {
        li();
      }
    }, r.saving ? "保存中…" : "保存"),
    e.createElement("button", {
      key: "revert",
      type: "button",
      className: "qm-set-btn",
      "data-qm-revert": "1",
      disabled: !x || !!r.saving,
      onClick: () => {
        Ns(), O();
      }
    }, "还原"),
    x ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
      e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
      "有 " + x + " 项未保存"
    ]) : null,
    e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, T)
  ]), M = r.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, r.saveMsg) : null, y = e.createElement("div", { className: "qm-set-wrap" }, [
    k,
    i,
    w,
    b,
    f,
    M,
    z
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
  }, y) : e.createElement("div", {
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
    y
  ]);
}
function _i(r) {
  try {
    const e = r && r.sender, t = re().React;
    if (!t) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const n = t.createElement(xi, {
      R: t,
      onOpen: () => {
        hi();
      }
    });
    e.addPrefix(ws, n, {
      id: "question-modal.settings-btn",
      order: as
    }), console.log("[question-modal] settings entry registered (order " + as + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function Si() {
  const r = ua();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return ha(), r.toolRender(ws, Xr, ai), console.log("[question-modal] registered via chat.toolRender for", Xr), _i(r), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!Si()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
