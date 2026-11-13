var sa = Object.defineProperty;
var os = (r) => {
  throw TypeError(r);
};
var oa = (r, e, t) => e in r ? sa(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var j = (r, e, t) => oa(r, typeof e != "symbol" ? e + "" : e, t), aa = (r, e, t) => e.has(r) || os("Cannot " + t);
var as = (r, e, t) => e.has(r) ? os("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var nn = (r, e, t) => (aa(r, e, "access private method"), t);
function gr() {
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
let Ge = gr();
function Is(r) {
  Ge = r;
}
const Cs = /[&<>"']/, ia = new RegExp(Cs.source, "g"), zs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, la = new RegExp(zs.source, "g"), ca = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, is = (r) => ca[r];
function ie(r, e) {
  if (e) {
    if (Cs.test(r))
      return r.replace(ia, is);
  } else if (zs.test(r))
    return r.replace(la, is);
  return r;
}
const da = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function ua(r) {
  return r.replace(da, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const pa = /(^|[^\[])\^/g;
function O(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (s, o) => {
      let a = typeof o == "string" ? o : o.source;
      return a = a.replace(pa, "$1"), t = t.replace(s, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function ls(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const Rt = { exec: () => null };
function cs(r, e) {
  const t = r.replace(/\|/g, (o, a, c) => {
    let i = !1, f = a;
    for (; --f >= 0 && c[f] === "\\"; )
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
function rn(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let s = 0;
  for (; s < n && r.charAt(n - s - 1) === e; )
    s++;
  return r.slice(0, n - s);
}
function fa(r, e) {
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
function ds(r, e, t, n) {
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
function ma(r, e) {
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
class fn {
  // set by the lexer
  constructor(e) {
    j(this, "options");
    j(this, "rules");
    // set by the lexer
    j(this, "lexer");
    this.options = e || Ge;
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
        text: this.options.pedantic ? n : rn(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], s = ma(n, t[3] || "");
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
        const s = rn(n, "#");
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
      n = rn(n.replace(/^ *>[ \t]?/gm, ""), `
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
      let c = "", i = "", f = !1;
      for (; e; ) {
        let b = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let k = t[2].split(`
`, 1)[0].replace(/^\t+/, (C) => " ".repeat(3 * C.length)), g = e.split(`
`, 1)[0], x = 0;
        this.options.pedantic ? (x = 2, i = k.trimStart()) : (x = t[2].search(/[^ ]/), x = x > 4 ? 1 : x, i = k.slice(x), x += t[1].length);
        let m = !1;
        if (!k && /^ *$/.test(g) && (c += g + `
`, e = e.substring(g.length + 1), b = !0), !b) {
          const C = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), A = new RegExp(`^ {0,${Math.min(3, x - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), w = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:\`\`\`|~~~)`), I = new RegExp(`^ {0,${Math.min(3, x - 1)}}#`);
          for (; e; ) {
            const E = e.split(`
`, 1)[0];
            if (g = E, this.options.pedantic && (g = g.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), w.test(g) || I.test(g) || C.test(g) || A.test(e))
              break;
            if (g.search(/[^ ]/) >= x || !g.trim())
              i += `
` + g.slice(x);
            else {
              if (m || k.search(/[^ ]/) >= 4 || w.test(k) || I.test(k) || A.test(k))
                break;
              i += `
` + g;
            }
            !m && !g.trim() && (m = !0), c += E + `
`, e = e.substring(E.length + 1), k = g.slice(x);
          }
        }
        o.loose || (f ? o.loose = !0 : /\n *\n *$/.test(c) && (f = !0));
        let y = null, T;
        this.options.gfm && (y = /^\[[ xX]\] /.exec(i), y && (T = y[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), o.items.push({
          type: "list_item",
          raw: c,
          task: !!y,
          checked: T,
          loose: !1,
          text: i,
          tokens: []
        }), o.raw += c;
      }
      o.items[o.items.length - 1].raw = c.trimEnd(), o.items[o.items.length - 1].text = i.trimEnd(), o.raw = o.raw.trimEnd();
      for (let b = 0; b < o.items.length; b++)
        if (this.lexer.state.top = !1, o.items[b].tokens = this.lexer.blockTokens(o.items[b].text, []), !o.loose) {
          const k = o.items[b].tokens.filter((x) => x.type === "space"), g = k.length > 0 && k.some((x) => /\n.*\n/.test(x.raw));
          o.loose = g;
        }
      if (o.loose)
        for (let b = 0; b < o.items.length; b++)
          o.items[b].loose = !0;
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
    const n = cs(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), o = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
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
        a.rows.push(cs(c, a.header.length).map((i) => ({
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
        const a = rn(n.slice(0, -1), "\\");
        if ((n.length - a.length) % 2 === 0)
          return;
      } else {
        const a = fa(t[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), ds(t, {
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
      return ds(n, o, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...s[0]].length - 1;
      let c, i, f = a, b = 0;
      const k = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (k.lastIndex = 0, t = t.slice(-1 * e.length + a); (s = k.exec(t)) != null; ) {
        if (c = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !c)
          continue;
        if (i = [...c].length, s[3] || s[4]) {
          f += i;
          continue;
        } else if ((s[5] || s[6]) && a % 3 && !((a + i) % 3)) {
          b += i;
          continue;
        }
        if (f -= i, f > 0)
          continue;
        i = Math.min(i, i + f + b);
        const g = [...s[0]][0].length, x = e.slice(0, a + s.index + g + i);
        if (Math.min(a, i) % 2) {
          const y = x.slice(1, -1);
          return {
            type: "em",
            raw: x,
            text: y,
            tokens: this.lexer.inlineTokens(y)
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
const ga = /^(?: *(?:\n|$))+/, ha = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, ba = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, $t = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ya = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Rs = /(?:[*+-]|\d{1,9}[.)])/, Ns = O(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Rs).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), hr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, xa = /^[^\n]+/, br = /(?!\s*\])(?:\\.|[^\[\]\\])+/, ka = O(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", br).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), va = O(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Rs).getRegex(), wn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", yr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, wa = O("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", yr).replace("tag", wn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Os = O(hr).replace("hr", $t).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", wn).getRegex(), _a = O(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Os).getRegex(), xr = {
  blockquote: _a,
  code: ha,
  def: ka,
  fences: ba,
  heading: ya,
  hr: $t,
  html: wa,
  lheading: Ns,
  list: va,
  newline: ga,
  paragraph: Os,
  table: Rt,
  text: xa
}, us = O("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", $t).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", wn).getRegex(), Sa = {
  ...xr,
  table: us,
  paragraph: O(hr).replace("hr", $t).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", us).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", wn).getRegex()
}, qa = {
  ...xr,
  html: O(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", yr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Rt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: O(hr).replace("hr", $t).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Ns).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, $s = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ea = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ms = /^( {2,}|\\)\n(?!\s*$)/, Ta = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Mt = "\\p{P}\\p{S}", Aa = O(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Mt).getRegex(), Ia = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Ca = O(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Mt).getRegex(), za = O("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Mt).getRegex(), Ra = O("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Mt).getRegex(), Na = O(/\\([punct])/, "gu").replace(/punct/g, Mt).getRegex(), Oa = O(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), $a = O(yr).replace("(?:-->|$)", "-->").getRegex(), Ma = O("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", $a).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ba = O(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Bs = O(/^!?\[(label)\]\[(ref)\]/).replace("label", mn).replace("ref", br).getRegex(), Ls = O(/^!?\[(ref)\](?:\[\])?/).replace("ref", br).getRegex(), La = O("reflink|nolink(?!\\()", "g").replace("reflink", Bs).replace("nolink", Ls).getRegex(), kr = {
  _backpedal: Rt,
  // only used for GFM url
  anyPunctuation: Na,
  autolink: Oa,
  blockSkip: Ia,
  br: Ms,
  code: Ea,
  del: Rt,
  emStrongLDelim: Ca,
  emStrongRDelimAst: za,
  emStrongRDelimUnd: Ra,
  escape: $s,
  link: Ba,
  nolink: Ls,
  punctuation: Aa,
  reflink: Bs,
  reflinkSearch: La,
  tag: Ma,
  text: Ta,
  url: Rt
}, Pa = {
  ...kr,
  link: O(/^!?\[(label)\]\((.*?)\)/).replace("label", mn).getRegex(),
  reflink: O(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", mn).getRegex()
}, fr = {
  ...kr,
  escape: O($s).replace("])", "~|])").getRegex(),
  url: O(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, ja = {
  ...fr,
  br: O(Ms).replace("{2,}", "*").getRegex(),
  text: O(fr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, sn = {
  normal: xr,
  gfm: Sa,
  pedantic: qa
}, St = {
  normal: kr,
  gfm: fr,
  breaks: ja,
  pedantic: Pa
};
class xe {
  constructor(e) {
    j(this, "tokens");
    j(this, "options");
    j(this, "state");
    j(this, "tokenizer");
    j(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Ge, this.options.tokenizer = this.options.tokenizer || new fn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: sn.normal,
      inline: St.normal
    };
    this.options.pedantic ? (t.block = sn.pedantic, t.inline = St.pedantic) : this.options.gfm && (t.block = sn.gfm, this.options.breaks ? t.inline = St.breaks : t.inline = St.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: sn,
      inline: St
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new xe(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new xe(t).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, i, f) => i + "    ".repeat(f.length));
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
          let f;
          this.options.extensions.startBlock.forEach((b) => {
            f = b.call({ lexer: this }, i), typeof f == "number" && f >= 0 && (c = Math.min(c, f));
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
    let n, s, o, a = e, c, i, f;
    if (this.tokens.links) {
      const b = Object.keys(this.tokens.links);
      if (b.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(a)) != null; )
          b.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(a)) != null; )
      a = a.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(a)) != null; )
      a = a.slice(0, c.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (f = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((b) => (n = b.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
        if (n = this.tokenizer.emStrong(e, a, f)) {
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
          let b = 1 / 0;
          const k = e.slice(1);
          let g;
          this.options.extensions.startInline.forEach((x) => {
            g = x.call({ lexer: this }, k), typeof g == "number" && g >= 0 && (b = Math.min(b, g));
          }), b < 1 / 0 && b >= 0 && (o = e.substring(0, b + 1));
        }
        if (n = this.tokenizer.inlineText(o)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (f = n.raw.slice(-1)), i = !0, s = t[t.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
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
    return t;
  }
}
class gn {
  constructor(e) {
    j(this, "options");
    this.options = e || Ge;
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
    const s = ls(e);
    if (s === null)
      return n;
    e = s;
    let o = '<a href="' + e + '"';
    return t && (o += ' title="' + t + '"'), o += ">" + n + "</a>", o;
  }
  image(e, t, n) {
    const s = ls(e);
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
class vr {
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
class ke {
  constructor(e) {
    j(this, "options");
    j(this, "renderer");
    j(this, "textRenderer");
    this.options = e || Ge, this.options.renderer = this.options.renderer || new gn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new vr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new ke(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new ke(t).parseInline(e);
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
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, ua(this.parseInline(a.tokens, this.textRenderer)));
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
          for (let b = 0; b < a.header.length; b++)
            i += this.renderer.tablecell(this.parseInline(a.header[b].tokens), { header: !0, align: a.align[b] });
          c += this.renderer.tablerow(i);
          let f = "";
          for (let b = 0; b < a.rows.length; b++) {
            const k = a.rows[b];
            i = "";
            for (let g = 0; g < k.length; g++)
              i += this.renderer.tablecell(this.parseInline(k[g].tokens), { header: !1, align: a.align[g] });
            f += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, f);
          continue;
        }
        case "blockquote": {
          const a = o, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = o, c = a.ordered, i = a.start, f = a.loose;
          let b = "";
          for (let k = 0; k < a.items.length; k++) {
            const g = a.items[k], x = g.checked, m = g.task;
            let y = "";
            if (g.task) {
              const T = this.renderer.checkbox(!!x);
              f ? g.tokens.length > 0 && g.tokens[0].type === "paragraph" ? (g.tokens[0].text = T + " " + g.tokens[0].text, g.tokens[0].tokens && g.tokens[0].tokens.length > 0 && g.tokens[0].tokens[0].type === "text" && (g.tokens[0].tokens[0].text = T + " " + g.tokens[0].tokens[0].text)) : g.tokens.unshift({
                type: "text",
                text: T + " "
              }) : y += T + " ";
            }
            y += this.parse(g.tokens, f), b += this.renderer.listitem(y, m, !!x);
          }
          n += this.renderer.list(b, c, i);
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
class Nt {
  constructor(e) {
    j(this, "options");
    this.options = e || Ge;
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
j(Nt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Je, mr, Ps;
class Da {
  constructor(...e) {
    as(this, Je);
    j(this, "defaults", gr());
    j(this, "options", this.setOptions);
    j(this, "parse", nn(this, Je, mr).call(this, xe.lex, ke.parse));
    j(this, "parseInline", nn(this, Je, mr).call(this, xe.lexInline, ke.parseInline));
    j(this, "Parser", ke);
    j(this, "Renderer", gn);
    j(this, "TextRenderer", vr);
    j(this, "Lexer", xe);
    j(this, "Tokenizer", fn);
    j(this, "Hooks", Nt);
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
            for (const f of i)
              n = n.concat(this.walkTokens(f.tokens, t));
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
            const f = c[i].flat(1 / 0);
            n = n.concat(this.walkTokens(f, t));
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
        const o = this.defaults.renderer || new gn(this.defaults);
        for (const a in n.renderer) {
          if (!(a in o))
            throw new Error(`renderer '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.renderer[c], f = o[c];
          o[c] = (...b) => {
            let k = i.apply(o, b);
            return k === !1 && (k = f.apply(o, b)), k || "";
          };
        }
        s.renderer = o;
      }
      if (n.tokenizer) {
        const o = this.defaults.tokenizer || new fn(this.defaults);
        for (const a in n.tokenizer) {
          if (!(a in o))
            throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a))
            continue;
          const c = a, i = n.tokenizer[c], f = o[c];
          o[c] = (...b) => {
            let k = i.apply(o, b);
            return k === !1 && (k = f.apply(o, b)), k;
          };
        }
        s.tokenizer = o;
      }
      if (n.hooks) {
        const o = this.defaults.hooks || new Nt();
        for (const a in n.hooks) {
          if (!(a in o))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], f = o[c];
          Nt.passThroughHooks.has(a) ? o[c] = (b) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(o, b)).then((g) => f.call(o, g));
            const k = i.call(o, b);
            return f.call(o, k);
          } : o[c] = (...b) => {
            let k = i.apply(o, b);
            return k === !1 && (k = f.apply(o, b)), k;
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
    return xe.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return ke.parse(e, t ?? this.defaults);
  }
}
Je = new WeakSet(), mr = function(e, t) {
  return (n, s) => {
    const o = { ...s }, a = { ...this.defaults, ...o };
    this.defaults.async === !0 && o.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = nn(this, Je, Ps).call(this, !!a.silent, !!a.async);
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
      let f = t(i, a);
      return a.hooks && (f = a.hooks.postprocess(f)), f;
    } catch (i) {
      return c(i);
    }
  };
}, Ps = function(e, t) {
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
const Ue = new Da();
function N(r, e) {
  return Ue.parse(r, e);
}
N.options = N.setOptions = function(r) {
  return Ue.setOptions(r), N.defaults = Ue.defaults, Is(N.defaults), N;
};
N.getDefaults = gr;
N.defaults = Ge;
N.use = function(...r) {
  return Ue.use(...r), N.defaults = Ue.defaults, Is(N.defaults), N;
};
N.walkTokens = function(r, e) {
  return Ue.walkTokens(r, e);
};
N.parseInline = Ue.parseInline;
N.Parser = ke;
N.parser = ke.parse;
N.Renderer = gn;
N.TextRenderer = vr;
N.Lexer = xe;
N.lexer = xe.lex;
N.Tokenizer = fn;
N.Hooks = Nt;
N.parse = N;
N.options;
N.setOptions;
N.use;
N.walkTokens;
N.parseInline;
ke.parse;
xe.lex;
const js = "question-modal", ps = "question_modal", tr = 3, fs = "gate-v2@2026.10.21";
function me() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function Fa() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Te() {
  return me().antd || {};
}
function Ds() {
  return me().antdIcons || {};
}
const Fs = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function nr(r) {
  const e = Ds();
  for (const t of Fs) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Wa() {
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
function B(r) {
  try {
    const e = me();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let _n = "", Ws = "";
function wr(r, e) {
  r && (Ws = r), e && (_n = e);
}
function L() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = me(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = _n), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function _r() {
  try {
    const e = me();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : Ws;
}
function qt() {
  try {
    const r = me(), e = typeof r.getSelectedAgentId == "function" && r.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return _n;
}
const rr = {};
async function Ha(r, e, t) {
  if (typeof window > "u" || rr[r]) return "skipped";
  try {
    const o = "qm:v1:notified:" + r;
    if (window.localStorage && window.localStorage.getItem(o) === "1")
      return rr[r] = !0, "skipped";
    window.localStorage.setItem(o, "1");
  } catch {
  }
  rr[r] = !0;
  const n = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((c) => {
      let i = !1;
      const f = (b) => {
        i || (i = !0, c(b));
      };
      try {
        const b = s.requestPermission((k) => f(k));
        b && typeof b.then == "function" && b.then(f).catch(() => f("denied"));
      } catch {
        f("denied");
      }
      setTimeout(() => f(s.permission || "denied"), 8e3);
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
function ee(r) {
  const e = Ot(r);
  return e && e.session_id ? e.session_id : _r();
}
const sr = 180, Ua = 20, Hs = 6e3, Ja = 60, Ga = 8;
function Za() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Qa = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function ms(r) {
  try {
    return String(r || "").replace(Qa, "").length;
  } catch {
    return 0;
  }
}
function gs(r) {
  const e = Za();
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
    n = ms((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - ms(t.textContent);
}
function Xa(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function Ka(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function hs(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: Hs });
      return;
    }
  } catch {
  }
  try {
    setTimeout(r, 0);
  } catch {
  }
}
const Va = "qm:v1:analysis:global", Ya = "qm:v1:analysis:", ei = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Et(r) {
  return r === "ai" || r === "recommend" ? r : "manual";
}
function ti(r) {
  if (!r || typeof r != "object") return { ...ei };
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
function ni() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(Ya) === 0 && t !== Va && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function ri() {
  try {
    const r = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : ti(e.prefs);
  } catch {
    return null;
  }
}
async function Sr() {
  try {
    const r = await fetch(B("/question-modal/templates"), { headers: L() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function on(r, e, t) {
  if (!r) return null;
  try {
    const n = await fetch(B("/question-modal/survey-action"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        tool_call_id: r,
        action: e,
        payload: t,
        origin: vn()
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
async function si(r) {
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
function oi(r, e) {
  if (!r) return () => {
  };
  let t = !1, n = null, s = 0, o = null, a = 0, c = !1, i = 0, f = 0, b = null;
  const k = (m) => {
    t || b === m || (b = m, e.onStatus(m));
  }, g = () => {
    if (!t)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, y = B("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(r) + "&since_rev=" + a, T = { headers: L() };
        m && (T.signal = m.signal), n = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(y, T).then(async (A) => {
          const w = Ai(A);
          if (!A.ok || !A.body || w) {
            if (A.status === 404 || A.status === 501 || A.status === 405) {
              c = !0, k(!1);
              return;
            }
            throw w && (i += 1), new Error(w ? "blocked" : "HTTP " + A.status);
          }
          s = 0, i = 0, k(!0);
          const I = A.body.getReader(), E = new TextDecoder();
          let P = "";
          const q = () => {
            I.read().then(({ done: F, value: z }) => {
              if (F) {
                x();
                return;
              }
              P += E.decode(z, { stream: !0 });
              let $;
              for (; ($ = P.indexOf(`

`)) >= 0; ) {
                const we = P.slice(0, $);
                P = P.slice($ + 2), we.split(`
`).forEach((Ze) => {
                  if (!Ze.startsWith("data: ")) return;
                  let W = null;
                  try {
                    W = JSON.parse(Ze.slice(6));
                  } catch {
                    return;
                  }
                  W && (W.kind === "snapshot" ? (a = Math.max(a, parseInt(W.rev || 0, 10) || 0), e.onSnapshot(a, W.state || null)) : W.kind === "change" && (a = Math.max(a, parseInt(W.rev || 0, 10) || 0), e.onChange(W)));
                });
              }
              t || q();
            }).catch(() => {
              x();
            });
          };
          q();
        }).catch(() => {
          x();
        });
      } catch {
        x();
      }
  }, x = () => {
    if (t || c)
      return;
    if (k(!1), i += 1, f || (f = Date.now()), i >= eo) {
      if (Date.now() - (f || Date.now()) >= no) {
        c = !0, k(!1);
        return;
      }
      o = setTimeout(g, to);
      return;
    }
    s = Math.min(s + 1, 6);
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
    b = null, e.onStatus(!1);
  };
}
async function or(r, e, t) {
  try {
    return (await fetch(B("/question-modal/session-prefs"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        chat_id: "",
        // server resolves session_id → chat UUID
        session_id: e,
        agent_id: t,
        settings: r,
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
async function hn(r, e, t, n) {
  const s = r || "", o = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(n || "");
  try {
    const a = B(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + o
    ), c = await fetch(a, { headers: L() });
    if (!c.ok) return null;
    const i = await c.json();
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
      globalConfig: i.global_config && typeof i.global_config == "object" ? i.global_config : void 0
    };
    return Us = { chatId: s, at: Date.now(), data: f }, f;
  } catch {
    return null;
  }
}
function Js() {
  Us = null;
}
async function Gs(r) {
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
async function Zs(r) {
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
async function Qs() {
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
function ai(r) {
  if (!r) return "";
  try {
    return String(N.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function R(r, e) {
  try {
    const t = Te().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const He = "__other__";
function fe(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function ot(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function ar(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (t && t.has(s) || !Object.prototype.hasOwnProperty.call(n, s)) return;
    const o = e[s];
    !o || typeof o != "object" || !ot(n[s]) && ot(o) && (n[s] = { ...o });
  }), n;
}
function bs(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function ys(r, e) {
  if (!r || typeof r != "object") return "";
  const t = Array.isArray(r.per_question) ? r.per_question : [];
  if (!t.length) return "";
  const n = t.find((s) => Number(s && s.index) === Number(e)) || (t.length === 1 ? t[0] : null);
  return n ? String(n.choice === void 0 || n.choice === null ? "" : n.choice).trim() : "";
}
function ii(r, e, t) {
  if (!t.length) return !1;
  const n = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = fe(e), o = ve(e), a = n(s), c = n(o);
  return t.some((i) => {
    const f = n(i);
    return f ? !!(i === s || i === o || f === a || f === c || Math.min(f.length, a.length, c.length) >= 4 && (f.length >= 4 && (a.includes(f) || f.includes(a)) || f.length >= 4 && (c.includes(f) || f.includes(c)))) : !1;
  });
}
function te(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
let Xs = !0;
function bn(r, e) {
  const t = String(r && r.title || "").trim();
  return t || (Xs ? "第 " + (e + 1) + " 题" : "");
}
function ve(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function li(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (o) => {
    o != null && o !== "" && t.add(String(o));
  }, s = r.options || [];
  if (te(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = s.find((i) => fe(i) === String(a));
      c && n(ve(c)), String(a) === He && e.other && n(e.other);
    });
  else {
    n(e.value);
    const o = s.find((a) => fe(a) === String(e.value));
    o && n(ve(o)), String(e.value) === He && e.other && n(e.other);
  }
  return t;
}
function ci(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const s = String(n);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const o of Array.from(e))
      if (o && (o.indexOf(s) !== -1 || s.indexOf(o) !== -1)) return !0;
    return !1;
  });
}
function Ks(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const s = parseInt(t[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === r.trim());
}
function Vs(r, e, t) {
  const n = e[r], s = n && n.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const o of Object.keys(s)) {
    const a = Ks(o, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !Vs(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !ci(s[o], li(c, i))) return !1;
  }
  return !0;
}
function Ee(r, e) {
  const t = [];
  return r.forEach((n, s) => {
    Vs(s, r, e) && t.push(s);
  }), t;
}
function di(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function an(r) {
  return Array.isArray(r.questions);
}
function ui(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function pi(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((s) => s && (s.text || s.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function fi(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function mi(r) {
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
function Tt(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), o = String(e.skip_reason || "").trim();
    return (o ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${o}` : "已跳过本次问卷。") + `

` + pn(r);
  }
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((s) => {
    const o = t[s];
    if (!o || typeof o != "object") return;
    const a = Ks(s, r), c = a >= 0 ? r[a] : null, i = c ? te(c) === "single" ? "单选" : te(c) === "multi" ? "多选" : "问答" : "问答", f = c ? bn(c, a) : s;
    let b = o.value;
    if (Array.isArray(b) && (b = b.join("、")), o.other && (b = (b ? b + "、" : "") + o.other), o.skipped) {
      const k = String(o.skipped_by || ""), g = k === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : k === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      n.push(`- ${s} [${i}] ${f}${g}`);
    } else
      n.push(`- ${s} [${i}] ${f}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function gi(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      B("/question-modal/resolve") + "?" + t.toString(),
      { headers: L() }
    );
    if (!n.ok) return { kind: "error" };
    const s = await n.json();
    return s && wr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function At(r) {
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
async function hi(r) {
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
const yn = "qm:v1:stash_att:", xs = 25 * 1024 * 1024, dn = /* @__PURE__ */ new Map(), un = /* @__PURE__ */ new Map();
let xn = null, kn = 0, ir = null;
function ks() {
  const r = kn > 0;
  un.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function bi() {
  if (ir) return ir;
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
    const n = xn;
    xn = null, !(!n || !t.length) && await Ys(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return ir = r, r;
}
function yi(r, e, t) {
  if (!r) {
    R("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  xn = { callId: r, target: e, key: t };
  const n = bi();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (xn = null);
}
async function Ys(r, e, t, n) {
  kn += 1, ks();
  const s = [], o = [];
  try {
    for (const c of r) {
      if (c.size && c.size > xs) {
        o.push(`${c.name}: 文件过大（上限 ${Math.round(xs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await hi(c);
      i.ok ? s.push(i.att) : o.push(i.error);
    }
  } finally {
    kn -= 1, ks();
  }
  const a = dn.get(e);
  if (s.length || o.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      R(
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
    else s.length && xi(e, s, c, n);
  }
}
function xi(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const s = localStorage.getItem(yn + r), o = s ? JSON.parse(s) : [], a = (Array.isArray(o) ? o : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(yn + r, JSON.stringify(a));
    } catch {
    }
}
function ki(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(yn + r);
    if (!e) return [];
    localStorage.removeItem(yn + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function vi(r) {
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
function wi(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function lr(r, e) {
  const t = e || ee(r), n = Ot(r), s = n && n.request_id ? n.request_id : "";
  if (s)
    try {
      const o = await fetch(B("/question-modal/skip"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({ request_id: s, session_id: t || "" })
      });
      if (o.ok) {
        const a = await o.json().catch(() => ({}));
        return re(r), {
          ok: !0,
          released: !0,
          reason: a && a.orphan ? "orphan" : "skipped"
        };
      }
      if (o.status === 404)
        return re(r), { ok: !0, released: !1, reason: "gone" };
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
        return re(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + o.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function vs(r) {
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
async function _i() {
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
    return o && wr(o.session_id, o.agent_id), o && o.found ? o : null;
  } catch {
    return null;
  }
}
const Sn = "qm:v1:reqid:", Si = 3e4, qi = 45e3, eo = 6, to = 6e4, no = 15 * 6e4, Ei = 700, Ti = 8;
function Ai(r) {
  try {
    if (String((r.headers && r.headers.get ? r.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const t = Number(r.status || 0);
    return t === 429 || t === 403 || t === 407 || t === 451;
  } catch {
    return !1;
  }
}
function re(r) {
  if (r)
    try {
      localStorage.removeItem(Sn + r);
    } catch {
    }
}
function Ii() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(Sn) === 0 && r.push(o);
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
function Ci(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(Sn + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), Ii();
    } catch {
    }
}
function Ot(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(Sn + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (re(r), null) : t;
  } catch {
    return null;
  }
}
const qr = "qm:v1:state:";
function zt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(qr + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function vn() {
  try {
    let r = sessionStorage.getItem("qm:v1:tab");
    return r || (r = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", r)), r;
  } catch {
    return "tab-anon";
  }
}
const ro = vn(), ws = "qm:v1:sessionprefs-ping";
function Fe(r, e) {
  if (r)
    try {
      const n = { ...zt(r) || {}, ...e, ts: Date.now(), origin: ro };
      localStorage.setItem(qr + r, JSON.stringify(n)), zi();
    } catch {
    }
}
function zi() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(qr) === 0 && r.push(o);
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
async function Ri(r) {
  try {
    const e = await fetch(
      B("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && wr(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Ni(r, e, t, n) {
  const s = ["【用户提交的问卷答案】"], o = new Set(Ee(r, e));
  return r.forEach((a, c) => {
    if (!o.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let f = i.value;
    if (Array.isArray(f))
      f = f.filter((y) => y !== He).map((y) => {
        const T = (a.options || []).find((C) => fe(C) === String(y));
        return T ? ve(T) : y;
      }).join("、");
    else {
      const y = (a.options || []).find((T) => fe(T) === String(f));
      y && (f = ve(y)), String(i.value) === He && (f = "");
    }
    const b = te(a) === "single" ? "单选" : te(a) === "multi" ? "多选" : "问答", k = !!String(f || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), g = String(i.skipped_by || ""), x = i.skipped ? g === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : g === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : k ? f : "（未作答）";
    let m = `- q${c} [${b}] ${x}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((y) => y.file_name).join("、")}）`), s.push(m);
  }), t && s.push(`- 其他意见：${t}`), n && n.length && s.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), s.join(`
`);
}
function pn(r) {
  return r.map((e, t) => {
    const n = te(e) === "single" ? "单选" : te(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(ve).join("、");
    return `${t + 1}. [${n}] ${bn(e, t)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function cr(r) {
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
  }, f = {
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
    t.map((b, k) => e.createElement(
      "span",
      { key: "att" + k, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: b.file_name
      }, b.file_name + (b.size ? "（" + wi(b.size) + "）" : "")),
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
      style: f,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, s ? "上传中…" : "📎 附件"),
    o ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + o) : null
  );
}
function Oi(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: s,
    disabled: o,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: f
  } = r, k = Te().Popover, g = [];
  t.forEach((q) => {
    [...q.models || [], ...q.extra_models || []].forEach((F) => {
      g.push({
        providerId: q.id,
        providerName: q.name || q.id,
        modelId: F.id,
        modelName: F.name || F.id,
        free: !!F.is_free
      });
    });
  });
  const x = g.find((q) => `${q.providerId}:${q.modelId}` === n), y = x ? x.modelName : n || "选择模型", T = x ? x.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", C = {
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
  }, A = g.filter((q) => q.free).length, w = g.length - A, I = [];
  t.forEach((q) => {
    const F = [...q.models || [], ...q.extra_models || []].map((z) => ({
      providerId: q.id,
      providerName: q.name || q.id,
      modelId: z.id,
      modelName: z.name || z.id,
      free: !!z.is_free
    })).filter((z) => i === "free" ? z.free : !z.free);
    F.length && I.push({ id: q.id, name: q.name || q.id, models: F });
  });
  const E = (q, F) => e.createElement("button", {
    key: q,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === q ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === q ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === q ? 600 : 400,
      boxShadow: i === q ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => f(q)
  }, F), P = e.createElement(
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
      E("paid", "付费 🟡 " + w),
      E("free", "免费 🟢 " + A)
    ),
    I.length ? e.createElement("div", null, I.map((q, F) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: q.id,
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
          e.createElement("span", { style: { flex: 1 } }, q.name),
          e.createElement("span", { style: { fontWeight: 400 } }, q.models.length)
        ),
        q.models.map((z) => {
          const $ = `${z.providerId}:${z.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${z.providerId}:${z.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + ($ ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: $ ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${z.providerId}:${z.modelId}`), c(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: F % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, z.modelName)
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
    content: P,
    trigger: "click",
    open: a,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: C,
      disabled: o,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: C,
      disabled: o,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const q = g.find((F) => `${F.providerId}:${F.modelId}` !== n);
        q && s(`${q.providerId}:${q.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function $i(r) {
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
function Mi(r) {
  const { R: e, templates: t, value: n, open: s, onOpenChange: o, disabled: a, onSelect: c, onManage: i } = r, b = Te().Popover, k = (t || []).find((T) => T.id === n), g = k ? k.name : "默认模板", x = {
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
  ), y = e.createElement(
    "button",
    {
      type: "button",
      style: x,
      disabled: a,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, g),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return b ? e.createElement(b, {
    content: m,
    trigger: "click",
    open: s,
    onOpenChange: o,
    placement: "bottomLeft"
  }, y) : y;
}
function Bi(r) {
  const { R: e, open: t, templates: n, value: s, edit: o, onEditChange: a, onClose: c, onSelect: i, onSave: f, onDelete: b } = r;
  if (!t) return null;
  const k = Te(), { Input: g, Modal: x } = k, m = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  x || (m.position = "fixed", m.right = 24, m.top = 80, m.width = 420, m.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", m.zIndex = 1100, m.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const y = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, T = !!o, C = (w, I, E, P) => g && g.TextArea ? e.createElement(g.TextArea, {
    value: w,
    rows: E,
    placeholder: P,
    onChange: (q) => I(q && q.target ? q.target.value : "")
  }) : e.createElement("textarea", {
    value: w,
    rows: E,
    placeholder: P,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (q) => I(q && q.target ? q.target.value : ""),
    onChange: (q) => I(q && q.target ? q.target.value : "")
  }), A = e.createElement(
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
        T ? o.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: y, onClick: c }, "关闭")
    ),
    T ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      C(o.name || "", (w) => a({ ...o, name: w }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      C(o.system || "", (w) => a({ ...o, system: w }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      C(o.user || "", (w) => a({ ...o, user: w }), 6, "用户提示词模板"),
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
          onClick: () => f(o)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: y,
          onClick: () => a(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (n || []).map(
        (w) => e.createElement(
          "div",
          {
            key: w.id,
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
            w.name + (w.builtin ? "（内置）" : "") + (w.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: y,
            title: "设为本题使用",
            onClick: () => i(w.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => a({
              id: w.id,
              name: w.name,
              system: w.system,
              user: w.user
            })
          }, "编辑"),
          w.builtin ? null : e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => b(w.id)
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
    width: "min(620px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal"
  }, A) : A;
}
function Li(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: s,
    mode: o,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: f,
    disabled: b,
    children: k,
    open: g,
    onOpenChange: x
  } = r, y = Te().Popover, T = e.createElement("button", {
    type: "button",
    disabled: b,
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
    title: o === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : o === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      x(!g);
    }
  }, t ? "分析中…" : "查看分析");
  if (!y)
    return e.createElement(
      "div",
      null,
      T,
      n && g ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((I) => I.reasoning).join(`

`))) : null
    );
  const C = !!(n && (n.per_question || []).length), A = (I, E, P) => e.createElement("button", {
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
  }, I), w = e.createElement(
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
        C && !t ? e.createElement("button", {
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
              (f || a)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        C && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: C ? 6 : "auto",
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
      (n.per_question || []).map((I) => e.createElement(
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
          dangerouslySetInnerHTML: { __html: ai(I.reasoning || "") }
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
      A("开始分析", () => {
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
  return e.createElement(y, {
    content: w,
    trigger: "click",
    open: g,
    onOpenChange: x,
    placement: "bottomRight"
  }, T);
}
function Pi(r) {
  const e = me().React, t = Te(), { Input: n, Button: s } = t, o = n.TextArea, a = r.data || {}, c = di(a), i = ui(a), f = pi(a), b = fi(f), k = b ? "" : f, g = c.questions || [], x = c.title || "问卷", m = zt(i), [y, T] = e.useState(
    () => !!(m && m.answered) || !!k || b
  ), [C, A] = e.useState(""), [w, I] = e.useState(() => {
    const l = Ot(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [E, P] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [q, F] = e.useState(
    () => m && typeof m.slowAt == "number" ? m.slowAt : 0
  ), [z, $] = e.useState(
    () => m && typeof m.slowStep == "number" ? m.slowStep : -1
  ), [we, Ze] = e.useState(
    () => !!(m && m.slowFired === !0)
  ), [W, Re] = e.useState(() => {
    const l = {};
    g.forEach((h, u) => {
      l[`q${u}`] = { type: te(h), value: te(h) === "multi" ? [] : "", other: "" };
    });
    const d = m && m.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((h) => {
      l[h] && (l[h] = { ...l[h], ...d[h] });
    }), l;
  }), [at, lo] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [H, Ae] = e.useState(!1), [Ie, qn] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [it, lt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [le, Qe] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(k || "")
  ), [Ce, Xe] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || mi(k || "")
  ), [ct, Tr] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [Bt, Ar] = e.useState(
    () => !!(m && m.expanded)
  ), [Ir, Lt] = e.useState(!1), En = e.useRef(0), [ce, co] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [Ne, dt] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [Ke, Tn] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [An, In] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [ut, Pt] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), pt = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < sr * 1e3)
  ), Oe = e.useRef(!1), jt = e.useRef(!!(m && m.pastSoft === !0)), [Cn, uo] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), po = e.useRef(Cn), Cr = (l) => {
    po.current = l, uo(l);
  }, se = (l, d) => {
    const h = Cn[l];
    return h ?? d;
  };
  Xs = !!se("fallback_title", !0);
  const zr = Math.max(30, Number(se("wait_hint_sec", sr)) || sr), fo = "manual", [G, Dt] = e.useState(fo), [Rr, zn] = e.useState(""), [rl, mo] = e.useState(!1), [Rn, Nn] = e.useState(!1), [On, $n] = e.useState(!1), [go, ho] = e.useState([]), [Nr, Mn] = e.useState(!1), [Ft, Ve] = e.useState(null), [bo, $e] = e.useState(""), [yo, xo] = e.useState(!1), [ko, vo] = e.useState(!1), [wo, _o] = e.useState("paid"), ze = e.useRef({}), _e = e.useRef({}), Ye = e.useRef(0), ft = e.useRef(null), [So, et] = e.useState(0), [Or, Bn] = e.useState([]), [Me, Wt] = e.useState(""), Se = e.useRef(Me);
  Se.current = Me;
  const [qo, Eo] = e.useState(!1), [To, $r] = e.useState(!1), [Ao, Ln] = e.useState(null), [ye, Mr] = e.useState(
    () => !!(m && m.autoPaused)
  ), Io = e.useRef(ye);
  Io.current = ye;
  const tt = e.useRef(!1), Pn = e.useRef(0), Ht = e.useRef({}), [Co, zo] = e.useState(0), mt = e.useRef(/* @__PURE__ */ new Set()), gt = (l) => {
    l && mt.current.add(l);
  }, Ut = e.useRef({}), [Ro, Jt] = e.useState(0), Be = e.useRef({}), [ht, No] = e.useState(!1), Oo = e.useRef(!1);
  Oo.current = ht, e.useRef(!1);
  const $o = async () => {
    try {
      const l = await hn(
        "",
        !0,
        ee(i),
        qt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      Cr(d), d.mode !== void 0 && Dt(Et(d.mode)), typeof d.model_id == "string" && d.model_id && zn(d.model_id), typeof d.with_context == "boolean" && Nn(d.with_context), typeof d.parallel == "boolean" && $n(d.parallel), et((h) => h + 1);
    } catch {
    }
  }, Br = e.useRef(!1), Gt = (l) => {
    if (l.mode !== void 0) {
      Dt(l.mode), or(
        { mode: l.mode },
        ee(i),
        qt()
      );
      try {
        localStorage.setItem(ws, ro + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && zn(l.modelId), l.withContext !== void 0 && Nn(l.withContext), l.parallel !== void 0 && $n(l.parallel), or(d, ee(i), qt()));
  }, Lr = (l) => {
    !l || l === Me || (Wt(l), Se.current = l, Fe(i, { templateId: l }), or(
      { template_id: l },
      ee(i),
      qt()
    ), Ve(null), ze.current = {}, _e.current = {}, et((d) => d + 1));
  }, Mo = async (l) => {
    const d = await Gs({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      R("error", d.error || "保存失败");
      return;
    }
    Bn(d.items || []), Ln(null), R("success", "模板已保存");
  }, Bo = async (l) => {
    const d = await Zs(l);
    if (!d.ok) {
      R("warning", d.error || "删除失败");
      return;
    }
    Bn(d.items || []);
    const h = (d.items || []).map((u) => u.id);
    if (h.indexOf(Se.current) === -1) {
      const u = h[0] || "";
      Wt(u), Se.current = u, Fe(i, { templateId: u });
    }
    R("success", "模板已删除");
  };
  e.useEffect(() => {
    if (y) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === ws && $o();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [y, i]), e.useEffect(() => {
    if (y) return;
    let l = !0;
    return ni(), (async () => {
      const [d, h, u, v] = await Promise.all([
        Qs(),
        ri(),
        Sr(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        hn(
          "",
          !0,
          ee(i),
          qt()
        )
      ]);
      if (!l) return;
      if (ho(d), Bn(u.items), v && v.config) {
        const S = v.config;
        Cr(S), S.mode !== void 0 && Dt(Et(S.mode)), typeof S.model_id == "string" && S.model_id && zn(S.model_id), typeof S.with_context == "boolean" && Nn(S.with_context), typeof S.parallel == "boolean" && $n(S.parallel), typeof S.template_id == "string" && S.template_id && (Wt(S.template_id), Se.current = S.template_id);
      }
      const _ = u.items.map((S) => S.id);
      if (!Se.current || _.indexOf(Se.current) === -1) {
        const S = u.defaultId || _[0] || "";
        S && (Wt(S), Se.current = S);
      }
      if (v && v.config) {
        const S = v.config;
        mo(S.__follow_active__ === !0);
      }
      Br.current = !0, et((S) => S + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    Ye.current = E;
  }, [E]);
  const jn = async (l) => {
    if (Nr) return;
    const d = E;
    Mn(!0), $e("");
    const h = typeof AbortController < "u" ? new AbortController() : null;
    ft.current = h;
    try {
      const u = await fetch(B("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: w,
          tool_call_id: i,
          session_id: ee(i),
          title: x,
          questions: g,
          model_id: Rr,
          mode: l,
          with_context: Rn,
          parallel: On,
          question_index: d,
          answers: W,
          template_id: Se.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(se("model_timeout_sec", 120)) || 120
        }),
        signal: h ? h.signal : void 0
      }), v = await u.json().catch(() => ({})), _ = v && v.analysis || null, S = _ && _.error || v && v.error || "";
      v && v.cancelled || _ && _.cancelled ? $e("已终止分析。") : !u.ok || !v || v.ok === !1 || _ && _.ok === !1 ? $e(S || "分析失败（服务返回 " + u.status + "）") : _ && (ze.current[d] = _, _e.current[d] = !0, Ye.current === d && Ve(_), R("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      ft.current === h && h && h.signal.aborted || u && u.name === "AbortError" ? $e("已终止分析。") : $e("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      ft.current === h && (ft.current = null), Mn(!1), Be.current[d] = !0, Jt((u) => u + 1);
    }
  }, Lo = () => {
    const l = E;
    delete ze.current[l], Ve(null), $e(""), jn("manual");
  }, nt = (l) => {
    var h;
    const d = l !== void 0 ? l : Ye.current;
    try {
      fetch(B("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: w,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      on(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (h = ft.current) == null || h.abort();
    } catch {
    }
    Mn(!1);
  }, Po = () => {
    nt(), $e("已终止分析。");
  }, jo = () => {
    ye ? (Ut.current = {}, Be.current = {}, _e.current = {}, tt.current = !1, Mr(!1), et((l) => l + 1), R("info", "已恢复自动答题")) : (nt(), Mr(!0), R("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (y) return;
    const l = ze.current[E];
    Ve(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + E;
    let h = !0;
    return fetch(B("/question-modal/analysis") + d, { headers: L() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !h || !u || !u.found || !u.analysis || (ze.current[E] = u.analysis, Ye.current === E && Ve(u.analysis));
    }).catch(() => {
    }), () => {
      h = !1;
    };
  }, [i, E]), e.useEffect(() => {
    y || Br.current && G === "ai" && ht && (!an(c) || !g.length || _e.current[E] || H || (_e.current[E] = !0, jn("auto")));
  }, [
    y,
    G,
    i,
    So,
    Rn,
    On,
    g,
    E,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    ht
  ]);
  const Do = () => {
    const l = Ft && Ft.per_question || [];
    if (!l.length) return;
    if (!l.some((h) => h.type === "multi" ? String(h.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(h.choice || "").trim().length > 0)) {
      R("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Re((h) => {
      const u = { ...h };
      return l.forEach((v) => {
        const _ = `q${v.index}`;
        gt(_);
        const S = u[_] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const Q = String(v.choice || "").split(/[、,，]/).map((J) => J.trim()).filter(Boolean);
          u[_] = { ...S, value: Q };
        } else
          u[_] = { ...S, value: v.choice || S.value };
      }), u;
    }), R("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Le = (l, d, h = !1) => {
    nt(), co(l), Qe(!0), lt(d), Lt(!1), T(!0), re(i), h && Fe(i, { backendReleased: !0 });
  }, Fo = async (l, d) => {
    const h = await lr(i, ee(i));
    return h.ok ? (Le(l, d, h.released), !0) : (Lt(!0), Fn(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = zt(i)) == null ? void 0 : d.answers;
    Fe(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: w,
      visStep: E,
      answers: ar(W, l, mt.current),
      finalOther: at,
      finalOtherAtt: ct,
      answered: y,
      skippedAll: le,
      expanded: Bt,
      localResult: it,
      submittedAt: Ke,
      skipReason: Ce,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: An,
      waitRetired: ut,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: q,
      slowStep: z,
      slowFired: we,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: ce,
      gateBlocked: Ne,
      releasedNote: Ie,
      autoPaused: ye,
      templateId: Me
    });
  }, [
    i,
    w,
    E,
    W,
    at,
    ct,
    y,
    le,
    Bt,
    it,
    Ke,
    Ce,
    An,
    ut,
    q,
    z,
    we,
    ce,
    ye,
    Me,
    Ne,
    Ie
  ]), e.useEffect(() => {
    if (!y || !Ke || ut || !pt.current) return;
    let l = 0, d = !1, h = gs(i);
    const u = () => {
      if (d) return;
      const v = Math.floor((Date.now() - Ke) / 1e3);
      if (v >= zr) {
        Oe.current = !0, Pt(!0);
        return;
      }
      if (!Oe.current) {
        const _ = gs(i);
        _ >= 0 && (h < 0 ? h = _ : _ - h >= Ga && (Oe.current = !0));
      }
      if (!Oe.current && v >= Ua && !jt.current && (jt.current = !0, In(!0)), Oe.current) {
        l = setTimeout(
          () => {
            d || Pt(!0);
          },
          Math.max(1e3, (zr - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || hs(u);
      }, Hs);
    };
    return hs(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [y, Ke, ut]);
  const [Dn, Fn] = e.useState(!1), [Wn, Pr] = e.useState(""), jr = (l, d, h) => {
    l.length && (d === "final" ? Tr((u) => u.concat(l)) : Re((u) => {
      const v = h || `q${E}`;
      gt(v);
      const _ = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ..._, attachments: (_.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, _, S) => {
      jr(u, v, _), S && S.length ? Pr(S.join("；")) : Pr("");
    }, d = (u) => Fn(u);
    dn.set(i, l), un.set(i, d);
    const h = ki(i);
    return h.length && h.forEach((u) => jr([u.att], u.target, u.key)), Fn(kn > 0), () => {
      dn.get(i) === l && dn.delete(i), un.get(i) === d && un.delete(i);
    };
  }, [i, E]);
  const Hn = (l, d) => yi(i, l, d), Un = (l, d, h) => {
    const u = vi(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Ys(u, i, d, h);
    }
  };
  e.useEffect(() => {
    if (!b || C) return;
    let l = !0;
    return At(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && Qe(!0);
      const h = String(d.skip_reason || "").trim();
      h && Xe((u) => u || h), A(Tt(g, d));
    }), () => {
      l = !1;
    };
  }, [b, i, C]), e.useEffect(() => {
    if (y || !i || k) return;
    let l = !0;
    return At(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && Qe(!0);
      const h = String(d.skip_reason || "").trim();
      h && Xe((u) => u || h), A((u) => u || Tt(g, d)), lt(Tt(g, d)), T(!0), re(i);
    }), () => {
      l = !1;
    };
  }, [i, y, k]), e.useEffect(() => {
    if (y) return;
    let l = !0, d = 0, h = 0, u = 0, v = !1, _ = !1, S = 0, Q = 0;
    En.current || (En.current = Date.now());
    let J = !!Ot(i), ue = !1;
    const oe = (M) => {
      !l || !M || !M.request_id || (J = !0, h = 0, u = 0, v = !1, I(M.request_id), Lt(!1), S && (clearTimeout(S), S = 0), Ci(
        i,
        M.request_id,
        M.session_id || _r(),
        M.agent_id
      ));
    }, he = (M) => {
      l && (S && (clearTimeout(S), S = 0), Q && (clearTimeout(Q), Q = 0), Fo(
        M,
        M === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, wt = Ot(i), De = async () => {
      if (!wt) return !1;
      const M = await Ri(wt.request_id);
      if (!l) return !0;
      if (M.kind === "found") {
        const be = M.data;
        return be.tool_call_id && i && be.tool_call_id !== i ? (re(i), !1) : (oe(be), !0);
      }
      return M.kind === "orphan" ? (he("orphan"), !0) : (M.kind === "absent" && re(i), !1);
    }, pe = (M = !1) => {
      if (l) {
        if (d += 1, M || (h += 1, u || (u = Date.now())), M) {
          if (!ue) {
            ue = !0, At(i).then((V) => {
              if (l) {
                if (V) {
                  V.kind === "skipped" && !V.answers && Qe(!0);
                  const _t = String(V.skip_reason || "").trim();
                  _t && Xe((er) => er || _t), A(Tt(g, V)), lt(Tt(g, V)), T(!0), re(i);
                  return;
                }
                pe(!0);
              }
            });
            return;
          }
          if (J) {
            he("gone");
            return;
          }
          const be = Date.now() - (En.current || Date.now());
          if (d >= 12 && be >= qi) {
            he("gone");
            return;
          }
        }
        if (h >= eo) {
          if (Date.now() - (u || Date.now()) >= no) {
            if (v = !0, !_) {
              _ = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, h = 0, u = 0, d = 0, K();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          S = setTimeout(K, to);
          return;
        }
        S = setTimeout(K, d < Ti ? Ei : 5e3);
      }
    }, ae = () => {
      gi(i, ee(i)).then((M) => {
        if (l) {
          if (M.kind === "found") {
            oe(M.data);
            return;
          }
          if (M.kind === "orphan") {
            he("orphan");
            return;
          }
          if (M.kind === "error") {
            pe(!1);
            return;
          }
          _i().then((be) => {
            if (l) {
              if (be) {
                if (be.tool_call_id && i && be.tool_call_id !== i) {
                  At(i).then((V) => {
                    if (l) {
                      if (V) {
                        T(!0), re(i);
                        return;
                      }
                      pe(!0);
                    }
                  });
                  return;
                }
                oe(be);
                return;
              }
              At(i).then((V) => {
                if (l) {
                  if (V) {
                    V.kind === "skipped" && !V.answers && Qe(!0);
                    const _t = String(V.skip_reason || "").trim();
                    _t && Xe((er) => er || _t), T(!0), re(i);
                    return;
                  }
                  pe(!0);
                }
              });
            }
          });
        }
      });
    }, K = () => {
      if (l) {
        if (!wt) {
          ae();
          return;
        }
        De().then((M) => {
          !l || M || ae();
        });
      }
    };
    return Q = setTimeout(() => {
      l && Lt(!0);
    }, Si), K(), () => {
      l = !1, S && clearTimeout(S), Q && clearTimeout(Q);
    };
  }, [y, i]);
  const Dr = async () => {
    Ae(!0);
    try {
      const l = ee(i);
      let d = await lr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await vs(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok)
        throw new Error(
          d.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + d.reason + "）"
        );
      if (d.released) {
        const u = d.reason === "host-stop";
        Le(
          d.reason === "orphan" ? "orphan" : "",
          d.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), R(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        Le(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), R("info", "本次问卷已失效，已关闭");
    } catch (l) {
      R("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ae(!1);
    }
  }, Fr = async () => {
    Ae(!0);
    try {
      const l = ee(i);
      let d = await lr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await vs(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok) {
        qn(d.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + d.reason + "）。"), R("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (d.released) {
        const u = d.reason === "host-stop";
        qn(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), R("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        qn("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), R("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      R("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ae(!1);
    }
  }, Zt = Ee(g, W), Pe = Zt.length, ge = E >= Pe, Z = ge ? -1 : Zt[E], bt = ge ? Pe : E;
  e.useEffect(() => {
    if (Et(se("mode", "manual")) !== "manual" || !se("notify_manual_mode", !1) || y || le || ce || !an(c) || !g.length) return;
    const d = Ee(g, W).filter((h) => !ot(W[`q${h}`])).length;
    Ha(i, x, d);
  }, [Cn, y, le, ce, bt]);
  const Qt = Math.max(0, Number(se("slow_question_sec", Ja)) || 0) * 1e3, Wo = Math.round(Qt / 1e3);
  e.useEffect(() => {
    if (y || le || ce || Qt <= 0) return;
    if (z !== bt) {
      $(bt), F(Date.now()), Ze(!1);
      return;
    }
    if (!q) {
      F(Date.now());
      return;
    }
    if (we) return;
    const l = q + Qt - Date.now();
    if (l <= 0) {
      Ze(!0);
      return;
    }
    let d = !1;
    const h = setTimeout(() => {
      d || Ze(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(h);
    };
  }, [y, le, ce, bt, z, q, we, Qt]);
  const de = Z >= 0 ? g[Z] : null, rt = `q${Z}`, U = Z >= 0 && W[rt] || { type: te(de), value: te(de) === "multi" ? [] : "", other: "" }, st = (l) => {
    var u;
    Ne && dt(""), Z >= 0 && gt(`q${Z}`);
    const d = { ...W, [rt]: { ...l, skipped: !1 } }, h = Ee(g, d);
    g.forEach((v, _) => {
      h.indexOf(_) === -1 && delete d[`q${_}`];
    }), Fe(i, {
      answers: ar(d, (u = zt(i)) == null ? void 0 : u.answers, mt.current)
    }), Re(d);
  };
  e.useEffect(() => {
    E > Pe && P(Pe);
  }, [Pe, E]);
  const Jn = async (l, d) => {
    const h = await fetch(B(l), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(d)
    }), u = await h.json().catch(() => ({}));
    if (!h.ok) {
      const v = new Error(u && u.detail || "HTTP " + h.status);
      throw v.status = h.status, v;
    }
    return u;
  }, Gn = () => {
    var l;
    return ar(W, (l = zt(i)) == null ? void 0 : l.answers, mt.current);
  }, Ho = () => !!se("gate_unsaved", !0), Wr = (l, d) => {
    if (!Ho()) return [];
    const h = [];
    if (typeof d == "number")
      return Ee(g, l).indexOf(d) !== -1 && !ot(l[`q${d}`]) && h.push(d + 1), h;
    const u = new Set(Ee(g, l));
    return g.forEach((v, _) => {
      u.has(_) && !ot(l[`q${_}`]) && h.push(_ + 1);
    }), h;
  }, Hr = (l, d, h) => {
    const u = "第 " + l.join("、") + " 题", v = h === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    dt("⛔ " + u + "尚未选择。" + v);
    const _ = Ee(g, d).length;
    Jn("/question-modal/gate-block", {
      request_id: w,
      tool_call_id: i,
      session_id: ee(i),
      missing: l,
      answered: _ - l.length,
      total: _,
      bundle: fs
    }).catch(() => {
    });
  }, Xt = async (l, d = !1) => {
    if (!w)
      return R("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const h = Gn();
    if (!d) {
      const u = Wr(h);
      if (u.length)
        return Hr(u, h, "提交"), "blocked";
      dt("");
    }
    Ae(!0);
    try {
      const u = await Jn("/question-modal/answer", {
        request_id: w,
        session_id: ee(i),
        answers: h,
        other: at,
        attachments: ct
      });
      return u && u.orphan ? (fetch(
        B("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ee(i)),
        { method: "POST", headers: L() }
      ).catch(() => {
      }), Le(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), R("info", "本次问卷已失效，已关闭"), "sent") : (re(i), lt(Ni(g, h, at, ct)), Tn(Date.now()), In(!1), Pt(!1), Oe.current = !1, jt.current = !1, pt.current = !0, T(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Le(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), R("info", "本次问卷已失效，已关闭"), "blocked") : (R("error", "提交失败: " + u.message), d ? (tt.current = !1, Pn.current += 1, Pn.current >= tr && R(
        "warning",
        "自动提交连续失败 " + tr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Jt((v) => v + 1), "not-ready") : "blocked");
    } finally {
      Ae(!1);
    }
  }, Ur = () => se("skip_mode", "per_question") === "whole", Uo = () => {
    Z < 0 || (Ne && dt(""), nt(Ye.current), _e.current[Ye.current] = !0, gt(`q${Z}`), Re((l) => {
      const d = { ...l };
      d[`q${Z}`] = {
        type: (l[`q${Z}`] || {}).type || te(de),
        value: ((l[`q${Z}`] || {}).type || te(de)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const h = Ee(g, d);
      return g.forEach((u, v) => {
        h.indexOf(v) === -1 && delete d[`q${v}`];
      }), d;
    }), P((l) => l + 1));
  }, Jo = () => {
    if (ge) {
      Xt();
      return;
    }
    const l = Gn(), d = Wr(l, Z);
    if (d.length) {
      Hr(d, l, "下一步");
      return;
    }
    Ne && dt(""), P((h) => h + 1);
  }, Go = async () => {
    if (!w) {
      R("warning", "问卷尚未就绪，请稍候");
      return;
    }
    nt(), Ae(!0);
    try {
      const l = await Jn("/question-modal/skip", {
        request_id: w,
        session_id: ee(i)
      });
      if (l && l.orphan) {
        Le(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), R("info", "本次问卷已失效，已关闭");
        return;
      }
      R("info", "已跳过问卷"), re(i), Qe(!0), Xe("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), lt("用户跳过了本次问卷。"), Tn(Date.now()), In(!1), Pt(!1), Oe.current = !1, jt.current = !1, pt.current = !0, T(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Le(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), R("info", "本次问卷已失效，已关闭");
        return;
      }
      R("error", "跳过失败: " + l.message);
    } finally {
      Ae(!1);
    }
  };
  e.useEffect(() => {
    if (y || G !== "ai" && G !== "recommend" || ye || (G === "recommend" || G === "ai") && !ht || !an(c) || !g.length || H) return;
    if (ge) {
      if (tt.current || Pn.current >= tr) return;
      const J = Gn();
      if (!Zt.every(
        (oe, he) => !!Be.current[he] || ot(J[`q${oe}`])
      ) || !w) return;
      tt.current = !0, Xt(void 0, !0).then((oe) => {
        oe === "not-ready" && (tt.current = !1);
      });
      return;
    }
    const l = E;
    if (Ut.current[l] || G === "ai" && !Be.current[l]) return;
    const d = Zt[l], h = g[d], u = te(h), v = bs(h), _ = ys(ze.current[l], d);
    if (G === "ai" && !Be.current[l]) return;
    Ut.current[l] = !0;
    const S = v.length ? v.join("、") : _, Q = !!S;
    gt(`q${d}`), Q || (Ht.current[d] = !0, zo((J) => J + 1), R("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), Re((J) => {
      const ue = { ...J }, oe = `q${d}`, he = ue[oe] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!Q)
        ue[oe] = {
          ...he,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const De = h.options || [], pe = (ae) => String(ae).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        ue[oe] = { ...he, type: u, value: S.split(/[、,，]/).map((ae) => pe(ae)).filter(Boolean).map((ae) => {
          const K = De.find((M) => fe(M) === ae || ve(M) === ae);
          return K ? fe(K) : ae;
        }) };
      } else if (u === "single") {
        const De = h.options || [], pe = (K) => String(K).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), ae = De.find((K) => fe(K) === S || ve(K) === S) || De.find((K) => fe(K) === pe(S) || ve(K) === pe(S));
        ue[oe] = { ...he, type: u, value: ae ? fe(ae) : S };
      } else
        ue[oe] = { ...he, type: u, value: S };
      const wt = Ee(g, ue);
      return g.forEach((De, pe) => {
        wt.indexOf(pe) === -1 && delete ue[`q${pe}`];
      }), ue;
    }), _e.current[l] = !0, Be.current[l] = !0, P((J) => J + 1), Jt((J) => J + 1);
  }, [
    y,
    G,
    ye,
    H,
    i,
    E,
    Ro,
    Pe,
    c,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    w,
    ht
  ]);
  const yt = e.useRef(!1), je = e.useRef(0), xt = e.useRef(!1), qe = e.useRef({});
  e.useEffect(() => {
    if (y || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        yt.current = !0, xt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!g || g.length), u.answers && typeof u.answers == "object" && (Re((_) => {
            const S = { ..._ };
            return Object.keys(u.answers).forEach((Q) => {
              const J = u.answers[Q];
              !J || typeof J != "object" || mt.current.has(Q) || (S[Q] = {
                ...S[Q] || { type: "single", value: "", other: "" },
                ...J
              });
            }), S;
          }), Fe(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && P(u.cursor), typeof u.mode == "string" && u.mode) {
            const _ = Et(u.mode);
            Dt((S) => S === _ ? S : _);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((_) => {
            const S = parseInt(_, 10);
            !isNaN(S) && u.per_question[_] && (ze.current[S] = u.per_question[_]);
          }), u.status === "submitted" && (Tn((_) => _ || Date.now()), u.released && Fe(i, { backendReleased: !0 }), T(!0), re(i));
          const v = String(u.skip_reason || "").trim();
          v && Xe((_) => _ || v), typeof u.mode == "string" && u.mode && (qe.current.mode = Et(u.mode)), Object.keys(u.answers || {}).forEach((_) => {
            qe.current["a:" + _] = JSON.stringify(u.answers[_] || {});
          }), typeof u.cursor == "number" && (qe.current.cursor = "c:" + u.cursor), xt.current = !0, Jt((_) => _ + 1);
        } finally {
          setTimeout(() => {
            yt.current = !1;
          }, 0);
        }
      }
    };
    si(i).then((u) => {
      !l || !u || !u.found || !u.state || (je.current = Math.max(je.current, u.rev), d(u.state));
    });
    const h = oi(i, {
      onSnapshot: (u, v) => {
        je.current = Math.max(je.current, u), v && d(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= je.current && u.origin !== vn() || (je.current = Math.max(je.current, v), !(u.origin && u.origin === vn()) && d(u.state));
      },
      onStatus: (u) => {
        l && No((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, h();
    };
  }, [y, i]), e.useEffect(() => {
    y || !i || yt.current || xt.current && Object.keys(W || {}).forEach((l) => {
      const d = JSON.stringify(W[l] || {});
      qe.current["a:" + l] !== d && (qe.current["a:" + l] = d, on(
        i,
        "set_answer",
        { key: l, answer: W[l] }
      ));
    });
  }, [y, i, JSON.stringify(W)]), e.useEffect(() => {
    if (y || !i || yt.current || !xt.current) return;
    const l = "c:" + E;
    qe.current.cursor !== l && (qe.current.cursor = l, on(i, "goto", { cursor: E }));
  }, [y, i, E]), e.useEffect(() => {
    y || !i || yt.current || xt.current && qe.current.mode !== G && (qe.current.mode = G, on(i, "set_mode", { mode: G }));
  }, [y, i, G]);
  const Kt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Zn = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Qn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Vt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Xn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Jr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Kn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Zo = { display: "flex", flexDirection: "column", gap: 8 }, Yt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, en = {
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
  }, kt = {
    ...en,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Qo = {
    ...en,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Vn = {
    ...en,
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
  }, Gr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Vn,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Zr = {
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
  }, Xo = { height: 32, fontSize: 13, borderRadius: 8 }, Qr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Xr = (l) => {
    const d = fe(l);
    return U.type === "multi" ? Array.isArray(U.value) && U.value.indexOf(d) !== -1 : U.value === d;
  }, Kr = Xr(He), Vr = (l) => {
    if (y || H) return;
    const d = fe(l);
    if (U.type === "multi") {
      const h = Array.isArray(U.value) ? U.value.slice() : [], u = h.indexOf(d);
      u === -1 ? h.push(d) : h.splice(u, 1), st({ ...U, value: h, other: h.indexOf(He) !== -1 ? U.other : "" });
    } else
      st({ ...U, value: d });
  }, Ko = !!se("show_recommend_badge", !0), Yr = se("badge_position", "left") === "right", Vo = se("badge_style", "rect") === "round", es = (l) => l && Ko ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Vo ? { ...Zr, borderRadius: 999 } : Zr
  }, "AI 推荐") : null, Yo = !!se("auto_number_options", !0), ea = !!se("highlight_recommended", !1), ta = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, ts = (l, d, h, u, v, _) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: y || H,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && ea ? { ...d ? Gr : Vn, ...ta } : d ? Gr : Vn,
      onClick: h
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Yr ? null : es(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (_ && Yo ? _ + ". " : "") + l),
    Yr ? es(v) : null
  );
  if (!y && !an(c))
    return e.createElement(
      "div",
      { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Zn, className: "qm-header" },
        e.createElement(
          "div",
          { style: Qn },
          nr(e),
          e.createElement("span", { style: Vt, className: "qm-title" }, x)
        ),
        e.createElement("span", { style: Xn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Jr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Ir ? e.createElement(
        "div",
        { style: Yt },
        e.createElement("button", {
          type: "button",
          disabled: H,
          style: { ...kt, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Dr
        }, "释放本次问卷")
      ) : null
    );
  if (y) {
    const l = () => {
      const h = Ka({
        submittedAt: Ke,
        deadReason: ce,
        releasedNote: Ie,
        skippedAll: le,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: ut,
        pastSoft: An,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!pt.current
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
      }, Xa(h.phase)) : null;
    }, d = !!pt.current;
    return le && !Bt ? e.createElement(
      "div",
      {
        style: {
          ...Kt,
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
      Ce ? e.createElement("span", {
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
        title: Ce
      }, Ce) : null,
      e.createElement("span", {
        style: { ...Vt, flex: Ie || Ce ? 0 : 1, opacity: 0.75 }
      }, x),
      Ie ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Ie) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...kt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Ar(!0)
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
        disabled: H,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...kt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Fr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Zn, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Qn },
          nr(e),
          e.createElement("span", { style: Vt }, x)
        ),
        e.createElement(
          "span",
          { style: { ...Xn, color: ce ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          ce ? "已失效" : le ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      le && (Ce || ce) ? e.createElement(
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
        String(Ce || ce || "问卷已失效/跳过")
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
      }, le ? it ? it + `

` + pn(g) : `已跳过本次问卷。

` + pn(g) : it || C || k || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + pn(g)),
      le && Bt ? e.createElement(
        "div",
        { style: Yt },
        e.createElement("button", {
          type: "button",
          style: kt,
          onClick: () => Ar(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Yt, marginTop: 8, gap: 10 } },
        Ie ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Ie) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        d ? e.createElement("button", {
          type: "button",
          disabled: H,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...kt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Fr
        }, "释放阻塞") : null
      )
    );
  }
  const ns = we && z === bt, rs = !y && !ge && Co >= 0 && Ht.current[Z] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, ss = Object.keys(Ht.current).map((l) => Number(l)).filter((l) => Ht.current[l] && Number.isFinite(l)).sort((l, d) => l - d), na = ge && ss.length ? e.createElement("div", {
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
  }, "⚠ 第 " + ss.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let tn = null;
  if (ge)
    tn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Kn }, "其他意见（可选）"),
      na,
      e.createElement(o, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: at,
        style: Qr,
        onChange: (l) => lo(l.target.value),
        onPaste: (l) => Un(l, "final", "final")
      }),
      cr({
        R: e,
        files: ct,
        disabled: y || H,
        uploading: Dn,
        error: Wn,
        onPick: () => Hn("final", "final"),
        onRemove: (l) => Tr((d) => d.filter((h, u) => u !== l))
      })
    );
  else if (de && te(de) === "text")
    tn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Kn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(de, Z)),
      rs,
      e.createElement(o, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof U.value == "string" ? U.value : "",
        style: Qr,
        onChange: (l) => st({ ...U, value: l.target.value, other: "" }),
        onPaste: (l) => Un(l, "q", rt)
      }),
      cr({
        R: e,
        files: U.attachments || [],
        disabled: y || H,
        uploading: Dn,
        error: Wn,
        onPick: () => Hn("q", rt),
        onRemove: (l) => st({
          ...U,
          attachments: (U.attachments || []).filter((d, h) => h !== l)
        })
      })
    );
  else if (de) {
    const l = bs(de), d = ys(Ft, Z), h = l.length ? l : d ? [d] : l, u = (de.options || []).map((v, _) => ts(
      ve(v),
      Xr(v),
      () => Vr(v),
      "o" + _,
      ii(de, v, h),
      _ + 1
    ));
    u.push(ts("其他", Kr, () => Vr(He), "other")), Kr && (u.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: U.other,
      style: { ...Xo, marginTop: 2 },
      onChange: (v) => st({ ...U, other: v.target.value }),
      onPaste: (v) => Un(v, "q", rt)
    })), u.push(cr({
      R: e,
      files: U.attachments || [],
      disabled: y || H,
      uploading: Dn,
      error: Wn,
      onPick: () => Hn("q", rt),
      onRemove: (v) => st({
        ...U,
        attachments: (U.attachments || []).filter((_, S) => S !== v)
      })
    }))), tn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Kn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(de, Z)),
      rs,
      e.createElement("div", { style: { ...Zo, marginTop: 8 } }, u)
    );
  }
  const Yn = Pe + 1, ra = ge ? Yn + "/" + Yn : E + 1 + "/" + Yn, vt = {
    ...en,
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
    { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Zn, className: "qm-header" },
      e.createElement(
        "div",
        { style: Qn },
        nr(e),
        e.createElement("span", { style: Vt, className: "qm-title" }, x)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        Oi({
          R: e,
          providers: go,
          modelId: Rr,
          disabled: y || H,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: ko,
          onOpenChange: vo,
          tab: wo,
          onTabChange: _o,
          onChange: (l) => {
            Gt({ modelId: l }), Ve(null), ze.current = {}, _e.current = {}, et((d) => d + 1);
          }
        }),
        Mi({
          R: e,
          templates: Or,
          value: Me,
          open: qo,
          onOpenChange: Eo,
          disabled: y || H,
          onSelect: Lr,
          onManage: () => $r(!0)
        }),
        $i({
          R: e,
          mode: G,
          disabled: y || H,
          onChange: (l) => {
            Gt({ mode: l }), l === "ai" && (_e.current = {}), l === "ai" || l === "recommend" ? (Ut.current = {}, Be.current = {}, tt.current = !1, et((d) => d + 1)) : nt();
          }
        }),
        Li({
          R: e,
          busy: Nr,
          result: Ft,
          error: bo,
          mode: G,
          disabled: y || H,
          open: yo,
          onOpenChange: xo,
          onRun: () => {
            jn("manual");
          },
          onRerun: Lo,
          onApply: Do,
          onCancel: Po,
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
                checked: Rn,
                onChange: (l) => Gt({ withContext: !!l.target.checked })
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
                checked: On,
                onChange: (l) => Gt({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (G === "ai" || G === "recommend") && !y ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: H,
          onClick: jo,
          style: {
            ...vt,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...ye ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: ye ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, ye ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Xn, key: "qm-step" }, ra)
      )
    ),
    e.createElement("div", { style: Jr }, tn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Bi({
      R: e,
      open: To,
      templates: Or,
      value: Me,
      edit: Ao,
      onEditChange: Ln,
      onClose: () => {
        $r(!1), Ln(null);
      },
      onSelect: (l) => Lr(l),
      onSave: Mo,
      onDelete: Bo
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
    (ns || Ir && !w) && !y ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": we ? i : void 0,
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
        (ns ? "⚠️ 本题已超过 " + Wo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (w ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: {
          ...vt,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Dr,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Ne && !y ? e.createElement("div", {
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
      "data-qm-bundle": fs
    }, Ne) : null,
    e.createElement(
      "div",
      { style: Yt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: E === 0 || H,
        style: { ...vt, marginRight: "auto", opacity: E === 0 ? 0.5 : 1 },
        onClick: () => P((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: H,
          style: vt,
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
          onClick: ge ? () => Xt(void 0, !0) : Ur() ? () => Xt(void 0, !0) : Uo
        },
        ge || Ur() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: vt,
        onClick: Go
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: Qo,
        onClick: Jo
      }, ge ? "提交" : "下一步")
    )
  );
}
const _s = 12;
let Ss = 0;
const p = {
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
  conflictNote: ""
};
let It = null;
function X(r, e, t) {
  if (r in p.draft) return p.draft[r];
  if (t === "global") {
    const o = p.cfg && p.cfg.globalConfig || p.globalCfg;
    return o && r in o ? o[r] : e;
  }
  const n = p.cfg && p.cfg.config, s = p.cfg && p.cfg.sessionConfig;
  if (s) {
    if (r in s) return s[r];
    const o = p.cfg && p.cfg.globalConfig || p.globalCfg;
    return o && r in o ? o[r] : e;
  }
  return n && r in n && p.cfg && p.cfg.has_session === !0 ? n[r] : (n && r in n && !(p.cfg && p.cfg.has_session), e);
}
function ji(r) {
  const e = p.cfg && p.cfg.config;
  if (!e) return !1;
  const t = e.__sources__, n = e[r];
  return !!(t && t[r] === "session" && (n === "" || n === null));
}
function ne(r, e) {
  let t;
  const n = p.cfg;
  if (p.scope === "global") {
    const s = n && n.globalConfig || p.globalCfg || {};
    t = r in s ? s[r] : void 0;
  } else {
    const s = n && n.sessionConfig;
    if (s)
      if (r in s)
        t = s[r];
      else {
        const o = n && n.globalConfig || p.globalCfg || {};
        t = r in o ? o[r] : void 0;
      }
    else {
      const o = n && n.config;
      t = o && r in o ? o[r] : void 0;
    }
  }
  t === e ? delete p.draft[r] : p.draft[r] = e, p.saveMsg = "", D();
}
function qs() {
  return Object.keys(p.draft).length;
}
async function Er() {
  try {
    const r = await fetch(B("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return;
    const e = await r.json(), t = e && e.prefs || {};
    p.globalCfg = t && typeof t == "object" ? t : {};
    try {
      D();
    } catch {
    }
  } catch {
  }
}
async function Di() {
  if (p.saving) return;
  const r = Object.keys(p.draft), e = p.scope === "session", t = {};
  if (r.forEach((n) => {
    t[n] = p.draft[n];
  }), !r.length && !e) {
    const n = p.globalCfg || {};
    Object.keys(n).forEach((s) => {
      s in t || (t[s] = n[s]);
    });
  }
  r.length, p.saving = !0, p.saveMsg = "", D();
  try {
    let n = "/question-modal/prefs", s = t;
    e && (n = "/question-modal/session-prefs", s = {
      chat_id: p.chatId,
      session_id: p.sessionId,
      agent_id: p.agentId,
      settings: t,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: p.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const o = await fetch(B(n), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(s)
    }), a = await o.json().catch(() => ({}));
    if (!o.ok) {
      p.saving = !1, p.saveMsg = a && a.detail ? String(a.detail) : "保存失败（" + o.status + "）", D();
      return;
    }
    p.saving = !1, p.draft = {}, Js();
    const c = Array.isArray(a && a.conflicts) ? a.conflicts : [];
    if (p.conflictNote = "", c.length) {
      const f = (g) => {
        try {
          const x = new Date(g * 1e3), m = (y) => y < 10 ? "0" + y : String(y);
          return x.getMonth() + 1 + "-" + m(x.getDate()) + " " + m(x.getHours()) + ":" + m(x.getMinutes()) + ":" + m(x.getSeconds());
        } catch {
          return "";
        }
      }, b = c.reduce(
        (g, x) => Math.max(g, Number(x && x.at) || 0),
        0
      ), k = c.map((g) => String(g && g.key || "")).filter(Boolean);
      p.conflictNote = "设置已于 " + f(b) + " 被其它位置修改，本次已按后写入的值覆盖" + (k.length ? "（" + k.join("、") + "）" : "") + "。";
    }
    try {
      const f = a && a.key_ts || {};
      f && typeof f == "object" && (p.keyTs = Object.assign({}, p.keyTs, f));
    } catch {
    }
    e || Er();
    let i = e ? "session" : "default";
    if (!e) {
      try {
        const f = await fetch(B("/question-modal/session-prefs"), {
          method: "POST",
          headers: L(),
          body: JSON.stringify({
            chat_id: p.chatId || "",
            session_id: p.sessionId || "",
            agent_id: p.agentId || "",
            // 2026-11-13 方案 D1（用户裁定）：切到默认模式**只打标记**，
            // 不删本会话的自定义项 —— 这样切回会话模式时数据原样恢复。
            //
            // 旧做法是 settings:{}（= 清空整条覆盖），实测会把会话里设过的
            // 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
            settings: {},
            set_scope: "default"
          })
        });
        f.ok || (p.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + f.status + "），本会话仍在会话模式。", i = "");
      } catch (f) {
        p.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (f && f.message ? f.message : f) + "，本会话仍在会话模式。", i = "";
      }
      p.keyTs = {};
    }
    i && (p.scopeChoice = i, p.tab = i, p.scope = i === "session" ? "session" : "global"), i === "default" ? p.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。" : i === "session" && (p.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。"), hn(
      p.chatId,
      !0,
      p.sessionId,
      p.agentId
    ).then((f) => {
      f && (p.cfg = f);
      try {
        D();
      } catch {
      }
    }).catch(() => {
    });
  } catch (n) {
    p.saving = !1, p.saveMsg = "保存请求失败：" + (n && n.message ? n.message : n);
  }
  try {
    D();
  } catch {
  }
}
function so() {
  p.draft = {}, p.saveMsg = "";
}
function oo() {
  Sr().then((r) => {
    p.templates = (r && r.items || []).filter((e) => e && e.id), p.templateOptions = p.templates.map((e) => e.id);
    try {
      D();
    } catch {
    }
  }).catch(() => {
  });
}
function Fi() {
  p.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, p.saveMsg = "", D();
}
function Wi(r) {
  const e = p.templates.filter((t) => t.id === r)[0];
  e && (p.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, p.saveMsg = "", D());
}
function Es(r, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([r + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  p.tplEdit && (p.tplEdit[r] = e, D());
}
function Hi() {
  p.tplEdit = null, D();
}
async function Ui() {
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
    p.saveMsg = "模板名称不能为空", D();
    return;
  }
  p.tplBusy = !0, D();
  const t = {
    id: r.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: r.system_prompt,
    user: r.user_prompt
  }, n = await Gs(t);
  if (p.tplBusy = !1, n && n.ok === !1) {
    p.saveMsg = String(n.error || n.detail || "保存失败"), D();
    return;
  }
  p.tplEdit = null, p.saveMsg = r.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", oo(), D();
}
async function Ji(r) {
  const e = p.templates.filter((s) => s.id === r)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || r) + "」？") : !1)) return;
  const n = await Zs(r);
  if (n && n.ok === !1) {
    p.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）"), D();
    return;
  }
  p.saveMsg = "模板已删除", oo(), D();
}
function Gi() {
  p.visible = !0, p.chatId = "", p.sessionId = _r(), p.cfg = null, p.cfgError = "", Zi(), p.agentId = _n || (() => {
    try {
      return me().getSelectedAgentId ? me().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Js();
  const r = ++Ss;
  p.scopeChoice = "", p.tab = "", p.scope = "global", p.draft = {}, p.saveMsg = "", p.conflictNote = "", D(), ao(() => {
    if (r !== Ss) return;
    const t = !!(p.cfg && p.cfg.has_session) ? "session" : "default";
    p.scopeChoice = t, p.tab = t === "session" ? "session" : "default", p.scope = t === "session" ? "session" : "global", p.draft = {}, p.saveMsg = "", p.keyTs = Object.assign(
      {},
      p.cfg && p.cfg.keyTs || {}
    ), p.conflictNote = "", D(), (p.tab === "global" || p.tab === "default") && Er();
  });
}
let ln = !1;
function Zi() {
  ln || (ln = !0, Promise.all([Qs(), Sr()]).then((r) => {
    ln = !1;
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
      D();
    } catch {
    }
  }).catch(() => {
    ln = !1;
  }));
}
function Qi(r) {
  const e = String(r || ""), t = e.indexOf(":");
  return t <= 0 ? { provider: "", model: e } : { provider: e.slice(0, t), model: e.slice(t + 1) };
}
let dr = !1, cn = "";
const ur = [];
function ao(r) {
  const e = p.chatId, t = (e || "") + "|" + (p.sessionId || "");
  if (dr && cn === t) {
    r && ur.push(r);
    return;
  }
  dr = !0, cn = t;
  const n = () => {
    cn === t && (dr = !1, cn = "");
    const s = ur.splice(0);
    try {
      s.forEach((o) => o());
    } catch {
    }
  };
  r && ur.push(r), hn(
    e,
    !0,
    p.sessionId,
    p.agentId
  ).then((s) => {
    if (p.chatId !== e) {
      n();
      return;
    }
    s ? (p.cfg = s, p.cfgError = "") : (p.cfgError = "读取配置失败（后端不可达）", p.tab || (p.tab = "default", p.scopeChoice = "default", p.scope = "global")), n();
    try {
      D();
    } catch {
    }
  }).catch(() => {
    p.tab || (p.tab = "default", p.scopeChoice = "default", p.scope = "global", p.cfgError = "读取配置失败（网络异常）"), n();
    try {
      D();
    } catch {
    }
  });
}
function D() {
  const r = me().React, e = me().ReactDOM;
  if (r) {
    if (!e || typeof e.render != "function") {
      if (p.visible) {
        try {
          const t = Te();
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
    It || (It = document.createElement("div"), It.id = "qm-settings-root", document.body.appendChild(It)), e.render(r.createElement(el, {
      R: r,
      open: p.visible,
      onClose: () => {
        if (qs() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          so();
        }
        p.visible = !1, p.saveMsg = "", D();
      },
      tab: p.tab,
      onTabChange: (t) => {
        p.tab = t, (t === "session" || t === "default") && (p.scopeChoice = t), p.scope = io(t) ? "session" : "global", p.saveMsg = "", p.draft = {}, D(), ao(), (t === "global" || t === "default") && Er();
      },
      scope: p.scope,
      scopeChoice: p.scopeChoice,
      sessData: p.sessData,
      cfg: p.cfg,
      cfgError: p.cfgError,
      chatId: p.chatId,
      dirtyCount: qs(),
      saving: p.saving,
      saveMsg: p.saveMsg,
      conflictNote: p.conflictNote,
      modelOptions: p.modelOptions,
      templateOptions: p.templateOptions,
      providerGroups: p.providerGroups,
      templates: p.templates,
      tplEdit: p.tplEdit,
      tplBusy: p.tplBusy
    }), It);
  }
}
function Xi(r) {
  const { R: e, onOpen: t } = r, n = Te(), s = n && n.Button, o = "问卷设置", a = { fontSize: 12, padding: "2px 6px", height: 28 }, c = { title: o, "aria-label": o };
  let i = null;
  try {
    const f = Ds(), b = Fs.concat(["SettingOutlined"]);
    for (const k of b) {
      const g = f[k];
      if (g) {
        i = e.createElement(g, { style: { fontSize: 12 } });
        break;
      }
    }
  } catch {
  }
  return i ? s ? e.createElement(s, {
    type: "text",
    size: "small",
    style: a,
    onClick: t,
    title: c.title,
    "aria-label": c["aria-label"]
  }, i) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: a,
    onClick: t,
    title: c.title,
    "aria-label": c["aria-label"]
  }, i) : s ? e.createElement(
    s,
    { type: "text", size: "small", style: a, onClick: t },
    o
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: a, onClick: t },
    o
  );
}
const pr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" }
], io = (r) => r === "session";
function Ki(r, e, t) {
  return t !== "readonly" ? null : r.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function Vi(r, e) {
  return e === "readonly" ? !0 : r === "session" && e === "global";
}
function Y(r, e, t, n, s, o, a, c) {
  const i = o || "global", f = Vi(a, i), b = [
    r.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      r.createElement("span", { key: "tt" }, t),
      Ki(r, "sc", i),
      f && i === "global" ? r.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? r.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], k = [
    r.createElement("div", { className: "qm-set-rowlabel", key: "l" }, b),
    r.createElement("div", {
      className: "qm-set-rowctl" + (c ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, n)
  ];
  return r.createElement("div", {
    className: "qm-set-row" + (f ? " qm-set-rowlocked" : ""),
    key: e,
    "data-qm-locked": f ? "1" : "0"
  }, k);
}
function Ts(r, e, t, n, s) {
  return r.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    t.map((o, a) => r.createElement("button", {
      key: "s" + a,
      type: "button",
      "data-qm-val": o,
      disabled: !s,
      className: "qm-set-segbtn" + (o === n ? " qm-set-segon" : "") + (s ? "" : " qm-set-ctrldis"),
      onClick: () => {
        s && s(o);
      }
    }, [
      r.createElement("span", { key: "t" }, o)
    ]))
  );
}
function Ct(r, e, t, n) {
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
    onKeyDown: (s) => {
      if (!n) return;
      const o = s && s.key;
      (o === " " || o === "Enter") && (s.preventDefault(), n(!t));
    }
  }, [
    r.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function We(r, e, t, n, s) {
  if (n && n.length && s) {
    const o = n.map((a, c) => a && typeof a == "object" ? { value: String(a.value), label: String(a.label || a.value) } : { value: String(a), label: String(a) });
    return r.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      r.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: t,
        onChange: (a) => s(a && a.target ? a.target.value : "")
      }, o.map((a, c) => r.createElement("option", { key: "o" + c, value: a.value }, a.label)))
    ]);
  }
  return r.createElement("div", { className: "qm-set-select", key: e }, [
    r.createElement("span", { key: "t", className: "qm-set-selecttext" }, t),
    r.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function As(r, e, t, n, s) {
  const o = Qi(t), c = n.map((x) => x.id).indexOf(o.provider) >= 0 ? o.provider : "", i = c ? (n.filter((x) => x.id === c)[0] || { models: [] }).models : [], f = i.indexOf(o.model) >= 0 ? o.model : "", b = (x, m) => {
    s && s(x ? x + ":" + m : "");
  }, k = r.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: c,
    disabled: !s,
    title: "厂商",
    onChange: (x) => {
      const m = x && x.target ? x.target.value : "", y = m ? (n.filter((T) => T.id === m)[0] || { models: [] }).models : [];
      b(m, m && y[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [r.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(n.map((x, m) => r.createElement(
    "option",
    { key: "g" + m, value: x.id },
    x.name === x.id ? x.id : x.name + "（" + x.models.length + "）"
  )))), g = r.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: f,
    disabled: !s || !c,
    title: c ? "选择模型" : "先选厂商",
    onChange: (x) => {
      const m = x && x.target ? x.target.value : "";
      b(c, m);
    }
  }, c ? i.map((x, m) => r.createElement("option", { key: "m" + m, value: x }, x)) : [r.createElement("option", { key: "m0", value: "" }, "—")]);
  return r.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    k,
    r.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    g
  ]);
}
function Yi(r, e, t, n, s) {
  const o = [], a = t === "session" ? "session" : "global", c = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, f = {
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
  }, k = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒": 120,
    "180 秒（默认）": 180,
    "300 秒": 300,
    "600 秒": 600
  }, g = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, x = s && s.templateOptions || [];
  s && s.modelOptions;
  const m = s && s.providerGroups || [], y = x.map((T) => {
    const C = p.templates.filter((A) => String(A.id) === String(T))[0];
    return { value: T, label: C && (C.name || C.id) || T };
  });
  if (e === "session") {
    const C = String(X("mode", "manual")) !== "recommend";
    if (o.push(Y(
      r,
      "s1",
      "答题模式",
      Ts(
        r,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(X("mode", "manual"))] || "人工",
        (A) => ne("mode", c[A] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      a
    )), C) {
      o.push(Y(
        r,
        "s2",
        "默认模型",
        As(
          r,
          "sel2",
          String(X("model_id", "")),
          m,
          (w) => ne("model_id", w)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        ji("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        a,
        !0
      ));
      const A = String(X("template_id", "")) || y[0] && y[0].value || "";
      o.push(Y(
        r,
        "s3",
        "提示词模板",
        y.length ? We(
          r,
          "sel3",
          A,
          y,
          (w) => ne("template_id", w)
        ) : We(r, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        a
      )), o.push(Y(
        r,
        "s4",
        "携带上下文",
        Ct(
          r,
          "s4sw",
          !!X("with_context", !1),
          (w) => ne("with_context", w)
        ),
        "附带上次决策与会话历史",
        "session",
        a
      )), o.push(Y(
        r,
        "s5",
        "并行分析各题",
        Ct(
          r,
          "s5sw",
          !!X("parallel", !1),
          (w) => ne("parallel", w)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        a
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const A = String(X("mode", "manual", "global")) !== "recommend";
      o.push(Y(
        r,
        "a1",
        "默认答题模式",
        Ts(
          r,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(X("mode", "manual", "global"))] || "人工",
          (w) => ne("mode", c[w] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        a
      )), A && (o.push(Y(
        r,
        "b1",
        "默认模型",
        As(
          r,
          "sel2",
          String(X("model_id", "", "global")),
          m,
          (w) => ne("model_id", w)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        a,
        !0
      )), o.push(Y(
        r,
        "b2",
        "提示词模板",
        y.length ? We(
          r,
          "sel3",
          String(X("template_id", "", "global")) || y[0].value,
          y,
          (w) => ne("template_id", w)
        ) : We(r, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        a
      )), o.push(Y(
        r,
        "b3",
        "携带上下文",
        Ct(
          r,
          "s3",
          !!X("with_context", !1, "global"),
          (w) => ne("with_context", w)
        ),
        "附带上次决策与会话历史",
        "both",
        a
      )), o.push(Y(
        r,
        "b4",
        "并行分析各题",
        Ct(
          r,
          "s4",
          !!X("parallel", !1, "global"),
          (w) => ne("parallel", w)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        a
      )));
    } else {
      o.push(Y(
        r,
        "e5",
        "人工模式时提醒",
        Ct(
          r,
          "s8",
          !!X("notify_manual_mode", !1, "global"),
          (E) => ne("notify_manual_mode", E)
        ),
        // 文案保持一行能放下（用户裁定 2026-11-12：位置足够，不要换行）
        "弹出时系统通知（仅人工模式，每卷一次；首次请求通知权限）",
        "global",
        a
      )), o.push(Y(
        r,
        "e6",
        "单题分析超时",
        We(
          r,
          "sel4",
          b[Number(X("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (E) => ne("model_timeout_sec", f[E] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        a
      )), o.push(Y(
        r,
        "d4",
        "等待提示阈值",
        We(
          r,
          "sel5",
          g[Number(X("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (E) => ne("wait_hint_sec", k[E] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        a
      ));
      const C = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], A = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, w = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, I = Number(X("gate_log_limit", 200, "global"));
      o.push(Y(
        r,
        "d5",
        "拦截记录",
        We(
          r,
          "sel6",
          w[I] || "最近 200 条（默认）",
          C,
          (E) => ne("gate_log_limit", A[E] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        a
      ));
    }
  else if (e === "prompt") {
    const T = p.templates, C = p.tplEdit;
    if (o.push(Y(
      r,
      "p0",
      "模板库共享范围",
      r.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      a
    )), T.length ? o.push(r.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      T.map((A, w) => {
        const I = !!A.builtin, P = (String(A.note || A.desc || "").trim() || String(A.system || A.system_prompt || A.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), q = P.length > 90 ? P.slice(0, 90) + "…" : P;
        return r.createElement("div", { className: "qm-set-item", key: "i" + w }, [
          r.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            r.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(A.name || A.id)
            ),
            r.createElement("span", {
              className: "qm-set-tag" + (I ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, I ? "内置" : "自定义"),
            r.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(A.id),
              onClick: () => {
                Wi(String(A.id));
              }
            }, "编辑"),
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (I ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(A.id),
              disabled: I,
              title: I ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                I || Ji(String(A.id));
              }
            }, "删除")
          ]),
          r.createElement("div", { className: "qm-set-itemdesc", key: "d" }, q)
        ]);
      })
    )) : o.push(r.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), o.push(r.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      r.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          Fi();
        }
      }, "＋ 新建模板")
    ])), C) {
      const A = (w, I, E, P, q) => {
        var F, z;
        return r.createElement("div", { className: "qm-set-field", key: "f-" + I }, [
          r.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, w),
          E ? r.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: P,
            "data-qm-tpl-field": I,
            placeholder: q,
            value: String(((F = p.tplEdit) == null ? void 0 : F[I]) || ""),
            onChange: ($) => Es(I, $ && $.target ? $.target.value : "")
          }) : r.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": I,
            placeholder: q,
            value: String(((z = p.tplEdit) == null ? void 0 : z[I]) || ""),
            onChange: ($) => Es(I, $ && $.target ? $.target.value : "")
          })
        ]);
      };
      o.push(r.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (C.id || "new")
      }, [
        r.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          C.id ? "编辑模板：" + (C.name || C.id) : "新建模板"
        ),
        A("模板名称", "name", !1, 0, "如：简短结论版"),
        A(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        A(
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
              Ui();
            }
          }, p.tplBusy ? "保存中…" : "保存"),
          r.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Hi();
            }
          }, "取消")
        ])
      ]));
    }
  }
  return r.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
}
function el(r) {
  const { R: e, open: t, onClose: n } = r;
  if (!t) return null;
  const s = Te(), o = s && s.Modal, a = !r.tab, c = r.tab || "", i = io(c) ? "session" : "global", f = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    pr.map(($) => e.createElement("button", {
      key: $.key,
      type: "button",
      className: "qm-set-tab" + (!a && $.key === c ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          r.onTabChange && r.onTabChange($.key);
        } catch {
        }
      }
    }, $.label))
  ), b = pr.filter(($) => $.key === c)[0] || pr[0], k = !!(r.cfg && r.cfg.has_session), g = k ? "session" : "default", x = k ? "会话模式" : "默认模式", m = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // 「当前模式：」前缀放在胶囊**外面**（2026-11-13 用户裁定）：
    // 胶囊内只保留「会话模式」/「默认模式」四个字，语义标签独立成一个
    // 普通文本节点，避免把说明性文字也算进"状态值"里。
    e.createElement("div", {
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
        "data-qm-runtime": g,
        "data-qm-scope-badge": g
      }, x)
    ])
  ]), y = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, T = null, C = a ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map(($) => e.createElement("div", {
    key: "sk" + $,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: $ * 0.15 + "s"
    }
  }))) : null, A = a ? C : Yi(e, c, i, r.sessData, {
    modelOptions: r.modelOptions,
    templateOptions: r.templateOptions,
    providerGroups: r.providerGroups
  }), w = r.dirtyCount || 0, I = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）", E = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      w ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + w + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, I)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      e.createElement("button", {
        key: "cancel",
        type: "button",
        className: "qm-set-btn",
        "data-qm-cancel": "1",
        disabled: !w || !!r.saving,
        onClick: () => {
          so(), D();
        }
      }, "取消"),
      e.createElement("button", {
        key: "save",
        type: "button",
        className: "qm-set-btn qm-set-btnprimary",
        "data-qm-save": "1",
        // 保存始终可点（用户裁定 2026-11-12）：即使无未保存修改，也允许
        // 把当前值固化到目标作用域；只有请求进行中才禁用。
        disabled: !!r.saving,
        onClick: () => {
          Di();
        }
      }, r.saving ? "保存中…" : "保存")
    ])
  ]), P = r.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, r.saveMsg) : null, q = r.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, r.conflictNote) : null, F = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    T,
    y,
    A,
    P,
    q
  ]), z = e.createElement("div", { className: "qm-set-wrap" }, [
    m,
    f,
    F,
    E
  ]);
  return o ? e.createElement(o, {
    open: !0,
    centered: !0,
    footer: null,
    title: null,
    closeIcon: null,
    onCancel: n,
    destroyOnClose: !0,
    // 小屏适配（2026-11-13 用户反馈）：固定 680 在窄屏会贴边/溢出。
    // min() 让宽度随视口收缩，92vw 两侧各留 4% 呼吸位。
    width: "min(680px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-set-modal"
  }, z) : e.createElement("div", {
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
          n();
        } catch {
        }
      }
    }, "✕"),
    z
  ]);
}
function tl(r) {
  try {
    const e = r && r.sender, t = me().React;
    if (!t) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const n = t.createElement(Xi, {
      R: t,
      onOpen: () => {
        Gi();
      }
    });
    e.addPrefix(js, n, {
      id: "question-modal.settings-btn",
      order: _s
    }), console.log("[question-modal] settings entry registered (order " + _s + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function nl() {
  const r = Fa();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return Wa(), r.toolRender(js, ps, Pi), console.log("[question-modal] registered via chat.toolRender for", ps), tl(r), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!nl()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
