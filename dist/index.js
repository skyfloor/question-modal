var aa = Object.defineProperty;
var as = (r) => {
  throw TypeError(r);
};
var ia = (r, e, t) => e in r ? aa(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var P = (r, e, t) => ia(r, typeof e != "symbol" ? e + "" : e, t), la = (r, e, t) => e.has(r) || as("Cannot " + t);
var is = (r, e, t) => e.has(r) ? as("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var tn = (r, e, t) => (la(r, e, "access private method"), t);
function hr() {
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
let Ze = hr();
function Is(r) {
  Ze = r;
}
const zs = /[&<>"']/, ca = new RegExp(zs.source, "g"), Rs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, da = new RegExp(Rs.source, "g"), ua = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, ls = (r) => ua[r];
function de(r, e) {
  if (e) {
    if (zs.test(r))
      return r.replace(ca, ls);
  } else if (Rs.test(r))
    return r.replace(da, ls);
  return r;
}
const pa = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function fa(r) {
  return r.replace(pa, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const ma = /(^|[^\[])\^/g;
function j(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (s, o) => {
      let a = typeof o == "string" ? o : o.source;
      return a = a.replace(ma, "$1"), t = t.replace(s, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function cs(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const zt = { exec: () => null };
function ds(r, e) {
  const t = r.replace(/\|/g, (o, a, c) => {
    let i = !1, x = a;
    for (; --x >= 0 && c[x] === "\\"; )
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
function ga(r, e) {
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
function us(r, e, t, n) {
  const s = e.href, o = e.title ? de(e.title) : null, a = r[1].replace(/\\([\[\]])/g, "$1");
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
    text: de(a)
  };
}
function ha(r, e) {
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
    P(this, "options");
    P(this, "rules");
    // set by the lexer
    P(this, "lexer");
    this.options = e || Ze;
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
      const n = t[0], s = ha(n, t[3] || "");
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
      let c = "", i = "", x = !1;
      for (; e; ) {
        let f = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let y = t[2].split(`
`, 1)[0].replace(/^\t+/, (_) => " ".repeat(3 * _.length)), h = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = y.trimStart()) : (k = t[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = y.slice(k), k += t[1].length);
        let m = !1;
        if (!y && /^ *$/.test(h) && (c += h + `
`, e = e.substring(h.length + 1), f = !0), !f) {
          const _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), S = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), v = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), C = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const I = e.split(`
`, 1)[0];
            if (h = I, this.options.pedantic && (h = h.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), v.test(h) || C.test(h) || _.test(h) || S.test(e))
              break;
            if (h.search(/[^ ]/) >= k || !h.trim())
              i += `
` + h.slice(k);
            else {
              if (m || y.search(/[^ ]/) >= 4 || v.test(y) || C.test(y) || S.test(y))
                break;
              i += `
` + h;
            }
            !m && !h.trim() && (m = !0), c += I + `
`, e = e.substring(I.length + 1), y = h.slice(k);
          }
        }
        o.loose || (x ? o.loose = !0 : /\n *\n *$/.test(c) && (x = !0));
        let b = null, T;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (T = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), o.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: T,
          loose: !1,
          text: i,
          tokens: []
        }), o.raw += c;
      }
      o.items[o.items.length - 1].raw = c.trimEnd(), o.items[o.items.length - 1].text = i.trimEnd(), o.raw = o.raw.trimEnd();
      for (let f = 0; f < o.items.length; f++)
        if (this.lexer.state.top = !1, o.items[f].tokens = this.lexer.blockTokens(o.items[f].text, []), !o.loose) {
          const y = o.items[f].tokens.filter((k) => k.type === "space"), h = y.length > 0 && y.some((k) => /\n.*\n/.test(k.raw));
          o.loose = h;
        }
      if (o.loose)
        for (let f = 0; f < o.items.length; f++)
          o.items[f].loose = !0;
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
    const n = ds(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), o = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
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
        a.rows.push(ds(c, a.header.length).map((i) => ({
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
        text: de(t[1])
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
        const a = ga(t[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), us(t, {
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
      return us(n, o, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...s[0]].length - 1;
      let c, i, x = a, f = 0;
      const y = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (y.lastIndex = 0, t = t.slice(-1 * e.length + a); (s = y.exec(t)) != null; ) {
        if (c = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !c)
          continue;
        if (i = [...c].length, s[3] || s[4]) {
          x += i;
          continue;
        } else if ((s[5] || s[6]) && a % 3 && !((a + i) % 3)) {
          f += i;
          continue;
        }
        if (x -= i, x > 0)
          continue;
        i = Math.min(i, i + x + f);
        const h = [...s[0]][0].length, k = e.slice(0, a + s.index + h + i);
        if (Math.min(a, i) % 2) {
          const b = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: b,
            tokens: this.lexer.inlineTokens(b)
          };
        }
        const m = k.slice(2, -2);
        return {
          type: "strong",
          raw: k,
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
      return s && o && (n = n.substring(1, n.length - 1)), n = de(n, !0), {
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
      return t[2] === "@" ? (n = de(t[1]), s = "mailto:" + n) : (n = de(t[1]), s = n), {
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
        s = de(t[0]), o = "mailto:" + s;
      else {
        let a;
        do
          a = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (a !== t[0]);
        s = de(t[0]), t[1] === "www." ? o = "http://" + t[0] : o = t[0];
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
      return this.lexer.state.inRawBlock ? n = t[0] : n = de(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const ba = /^(?: *(?:\n|$))+/, ya = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, xa = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ot = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ka = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Ns = /(?:[*+-]|\d{1,9}[.)])/, Os = j(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Ns).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), br = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, wa = /^[^\n]+/, yr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, va = j(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", yr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Sa = j(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Ns).getRegex(), vn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", xr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, _a = j("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", xr).replace("tag", vn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), $s = j(br).replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), qa = j(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", $s).getRegex(), kr = {
  blockquote: qa,
  code: ya,
  def: va,
  fences: xa,
  heading: ka,
  hr: Ot,
  html: _a,
  lheading: Os,
  list: Sa,
  newline: ba,
  paragraph: $s,
  table: zt,
  text: wa
}, ps = j("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), Ea = {
  ...kr,
  table: ps,
  paragraph: j(br).replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ps).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex()
}, Ta = {
  ...kr,
  html: j(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", xr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: j(br).replace("hr", Ot).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Os).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Ms = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Aa = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Bs = /^( {2,}|\\)\n(?!\s*$)/, Ca = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, $t = "\\p{P}\\p{S}", Ia = j(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, $t).getRegex(), za = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Ra = j(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, $t).getRegex(), Na = j("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, $t).getRegex(), Oa = j("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, $t).getRegex(), $a = j(/\\([punct])/, "gu").replace(/punct/g, $t).getRegex(), Ma = j(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ba = j(xr).replace("(?:-->|$)", "-->").getRegex(), La = j("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ba).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, ja = j(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ls = j(/^!?\[(label)\]\[(ref)\]/).replace("label", mn).replace("ref", yr).getRegex(), js = j(/^!?\[(ref)\](?:\[\])?/).replace("ref", yr).getRegex(), Pa = j("reflink|nolink(?!\\()", "g").replace("reflink", Ls).replace("nolink", js).getRegex(), wr = {
  _backpedal: zt,
  // only used for GFM url
  anyPunctuation: $a,
  autolink: Ma,
  blockSkip: za,
  br: Bs,
  code: Aa,
  del: zt,
  emStrongLDelim: Ra,
  emStrongRDelimAst: Na,
  emStrongRDelimUnd: Oa,
  escape: Ms,
  link: ja,
  nolink: js,
  punctuation: Ia,
  reflink: Ls,
  reflinkSearch: Pa,
  tag: La,
  text: Ca,
  url: zt
}, Da = {
  ...wr,
  link: j(/^!?\[(label)\]\((.*?)\)/).replace("label", mn).getRegex(),
  reflink: j(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", mn).getRegex()
}, mr = {
  ...wr,
  escape: j(Ms).replace("])", "~|])").getRegex(),
  url: j(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Fa = {
  ...mr,
  br: j(Bs).replace("{2,}", "*").getRegex(),
  text: j(mr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rn = {
  normal: kr,
  gfm: Ea,
  pedantic: Ta
}, _t = {
  normal: wr,
  gfm: mr,
  breaks: Fa,
  pedantic: Da
};
class ve {
  constructor(e) {
    P(this, "tokens");
    P(this, "options");
    P(this, "state");
    P(this, "tokenizer");
    P(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Ze, this.options.tokenizer = this.options.tokenizer || new fn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: rn.normal,
      inline: _t.normal
    };
    this.options.pedantic ? (t.block = rn.pedantic, t.inline = _t.pedantic) : this.options.gfm && (t.block = rn.gfm, this.options.breaks ? t.inline = _t.breaks : t.inline = _t.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: rn,
      inline: _t
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new ve(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new ve(t).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, i, x) => i + "    ".repeat(x.length));
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
          let x;
          this.options.extensions.startBlock.forEach((f) => {
            x = f.call({ lexer: this }, i), typeof x == "number" && x >= 0 && (c = Math.min(c, x));
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
    let n, s, o, a = e, c, i, x;
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
      if (i || (x = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((f) => (n = f.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
        if (n = this.tokenizer.emStrong(e, a, x)) {
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
          let f = 1 / 0;
          const y = e.slice(1);
          let h;
          this.options.extensions.startInline.forEach((k) => {
            h = k.call({ lexer: this }, y), typeof h == "number" && h >= 0 && (f = Math.min(f, h));
          }), f < 1 / 0 && f >= 0 && (o = e.substring(0, f + 1));
        }
        if (n = this.tokenizer.inlineText(o)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (x = n.raw.slice(-1)), i = !0, s = t[t.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : t.push(n);
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
class gn {
  constructor(e) {
    P(this, "options");
    this.options = e || Ze;
  }
  code(e, t, n) {
    var o;
    const s = (o = (t || "").match(/^\S*/)) == null ? void 0 : o[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + de(s) + '">' + (n ? e : de(e, !0)) + `</code></pre>
` : "<pre><code>" + (n ? e : de(e, !0)) + `</code></pre>
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
    const s = cs(e);
    if (s === null)
      return n;
    e = s;
    let o = '<a href="' + e + '"';
    return t && (o += ' title="' + t + '"'), o += ">" + n + "</a>", o;
  }
  image(e, t, n) {
    const s = cs(e);
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
class Se {
  constructor(e) {
    P(this, "options");
    P(this, "renderer");
    P(this, "textRenderer");
    this.options = e || Ze, this.options.renderer = this.options.renderer || new gn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new vr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new Se(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new Se(t).parseInline(e);
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
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, fa(this.parseInline(a.tokens, this.textRenderer)));
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
          for (let f = 0; f < a.header.length; f++)
            i += this.renderer.tablecell(this.parseInline(a.header[f].tokens), { header: !0, align: a.align[f] });
          c += this.renderer.tablerow(i);
          let x = "";
          for (let f = 0; f < a.rows.length; f++) {
            const y = a.rows[f];
            i = "";
            for (let h = 0; h < y.length; h++)
              i += this.renderer.tablecell(this.parseInline(y[h].tokens), { header: !1, align: a.align[h] });
            x += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, x);
          continue;
        }
        case "blockquote": {
          const a = o, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = o, c = a.ordered, i = a.start, x = a.loose;
          let f = "";
          for (let y = 0; y < a.items.length; y++) {
            const h = a.items[y], k = h.checked, m = h.task;
            let b = "";
            if (h.task) {
              const T = this.renderer.checkbox(!!k);
              x ? h.tokens.length > 0 && h.tokens[0].type === "paragraph" ? (h.tokens[0].text = T + " " + h.tokens[0].text, h.tokens[0].tokens && h.tokens[0].tokens.length > 0 && h.tokens[0].tokens[0].type === "text" && (h.tokens[0].tokens[0].text = T + " " + h.tokens[0].tokens[0].text)) : h.tokens.unshift({
                type: "text",
                text: T + " "
              }) : b += T + " ";
            }
            b += this.parse(h.tokens, x), f += this.renderer.listitem(b, m, !!k);
          }
          n += this.renderer.list(f, c, i);
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
class Rt {
  constructor(e) {
    P(this, "options");
    this.options = e || Ze;
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
P(Rt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Ge, gr, Ps;
class Wa {
  constructor(...e) {
    is(this, Ge);
    P(this, "defaults", hr());
    P(this, "options", this.setOptions);
    P(this, "parse", tn(this, Ge, gr).call(this, ve.lex, Se.parse));
    P(this, "parseInline", tn(this, Ge, gr).call(this, ve.lexInline, Se.parseInline));
    P(this, "Parser", Se);
    P(this, "Renderer", gn);
    P(this, "TextRenderer", vr);
    P(this, "Lexer", ve);
    P(this, "Tokenizer", fn);
    P(this, "Hooks", Rt);
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
            for (const x of i)
              n = n.concat(this.walkTokens(x.tokens, t));
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
            const x = c[i].flat(1 / 0);
            n = n.concat(this.walkTokens(x, t));
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
          const c = a, i = n.renderer[c], x = o[c];
          o[c] = (...f) => {
            let y = i.apply(o, f);
            return y === !1 && (y = x.apply(o, f)), y || "";
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
          const c = a, i = n.tokenizer[c], x = o[c];
          o[c] = (...f) => {
            let y = i.apply(o, f);
            return y === !1 && (y = x.apply(o, f)), y;
          };
        }
        s.tokenizer = o;
      }
      if (n.hooks) {
        const o = this.defaults.hooks || new Rt();
        for (const a in n.hooks) {
          if (!(a in o))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], x = o[c];
          Rt.passThroughHooks.has(a) ? o[c] = (f) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(o, f)).then((h) => x.call(o, h));
            const y = i.call(o, f);
            return x.call(o, y);
          } : o[c] = (...f) => {
            let y = i.apply(o, f);
            return y === !1 && (y = x.apply(o, f)), y;
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
    return ve.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return Se.parse(e, t ?? this.defaults);
  }
}
Ge = new WeakSet(), gr = function(e, t) {
  return (n, s) => {
    const o = { ...s }, a = { ...this.defaults, ...o };
    this.defaults.async === !0 && o.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = tn(this, Ge, Ps).call(this, !!a.silent, !!a.async);
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
      let x = t(i, a);
      return a.hooks && (x = a.hooks.postprocess(x)), x;
    } catch (i) {
      return c(i);
    }
  };
}, Ps = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + de(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(s) : s;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const Je = new Wa();
function M(r, e) {
  return Je.parse(r, e);
}
M.options = M.setOptions = function(r) {
  return Je.setOptions(r), M.defaults = Je.defaults, Is(M.defaults), M;
};
M.getDefaults = hr;
M.defaults = Ze;
M.use = function(...r) {
  return Je.use(...r), M.defaults = Je.defaults, Is(M.defaults), M;
};
M.walkTokens = function(r, e) {
  return Je.walkTokens(r, e);
};
M.parseInline = Je.parseInline;
M.Parser = Se;
M.parser = Se.parse;
M.Renderer = gn;
M.TextRenderer = vr;
M.Lexer = ve;
M.lexer = ve.lex;
M.Tokenizer = fn;
M.Hooks = Rt;
M.parse = M;
M.options;
M.setOptions;
M.use;
M.walkTokens;
M.parseInline;
Se.parse;
ve.lex;
const Ds = "question-modal", fs = "question_modal", nr = 3, ms = "gate-v2@2026.10.21";
function be() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function Ha() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Ce() {
  return be().antd || {};
}
function Fs() {
  return be().antdIcons || {};
}
const Ws = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function rr(r) {
  const e = Fs();
  for (const t of Ws) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Ua() {
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
function N(r) {
  try {
    const e = be();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let Sn = "", Hs = "";
function Sr(r, e) {
  r && (Hs = r), e && (Sn = e);
}
function O() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = be(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = Sn), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function _n() {
  try {
    const e = be();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  if (typeof r == "string" && r) return r;
  try {
    const e = /\/chat\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:[/?#]|$)/.exec(typeof window < "u" && window.location && window.location.pathname || "");
    if (e && e[1]) return e[1].toLowerCase();
  } catch {
  }
  return Hs;
}
globalThis.__qmSessionProbe = _n;
function qt() {
  try {
    const r = be(), e = typeof r.getSelectedAgentId == "function" && r.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Sn;
}
const sr = {};
async function Ja(r, e, t) {
  if (typeof window > "u" || sr[r]) return "skipped";
  try {
    const o = "qm:v1:notified:" + r;
    if (window.localStorage && window.localStorage.getItem(o) === "1")
      return sr[r] = !0, "skipped";
    window.localStorage.setItem(o, "1");
  } catch {
  }
  sr[r] = !0;
  const n = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((c) => {
      let i = !1;
      const x = (f) => {
        i || (i = !0, c(f));
      };
      try {
        const f = s.requestPermission((y) => x(y));
        f && typeof f.then == "function" && f.then(x).catch(() => x("denied"));
      } catch {
        x("denied");
      }
      setTimeout(() => x(s.permission || "denied"), 8e3);
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
function V(r) {
  const e = Nt(r);
  return e && e.session_id ? e.session_id : _n();
}
const or = 180, Ga = 20, Us = 6e3, Za = 60, Qa = 8;
function Xa() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Ka = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function gs(r) {
  try {
    return String(r || "").replace(Ka, "").length;
  } catch {
    return 0;
  }
}
function hs(r) {
  const e = Xa();
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
    n = gs((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - gs(t.textContent);
}
function Va(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function Ya(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function bs(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: Us });
      return;
    }
  } catch {
  }
  try {
    setTimeout(r, 0);
  } catch {
  }
}
const ei = "qm:v1:analysis:global", ti = "qm:v1:analysis:", ni = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Et(r) {
  return r === "ai" || r === "recommend" ? r : "manual";
}
function ri(r) {
  if (!r || typeof r != "object") return { ...ni };
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
function si() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(ti) === 0 && t !== ei && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function oi() {
  try {
    const r = await fetch(N("/question-modal/prefs"), { headers: O() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : ri(e.prefs);
  } catch {
    return null;
  }
}
async function _r() {
  try {
    const r = await fetch(N("/question-modal/templates"), { headers: O() });
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
    const n = await fetch(N("/question-modal/survey-action"), {
      method: "POST",
      headers: O(),
      body: JSON.stringify({
        tool_call_id: r,
        action: e,
        payload: t,
        origin: wn()
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
async function ai(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      N("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(r)),
      { headers: O() }
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
function ii(r, e) {
  if (!r) return () => {
  };
  let t = !1, n = null, s = 0, o = null, a = 0, c = !1, i = 0, x = 0, f = null;
  const y = (m) => {
    t || f === m || (f = m, e.onStatus(m));
  }, h = () => {
    if (!t)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, b = N("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(r) + "&since_rev=" + a, T = { headers: O() };
        m && (T.signal = m.signal), n = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(b, T).then(async (S) => {
          const v = Ii(S);
          if (!S.ok || !S.body || v) {
            if (S.status === 404 || S.status === 501 || S.status === 405) {
              c = !0, y(!1);
              return;
            }
            throw v && (i += 1), new Error(v ? "blocked" : "HTTP " + S.status);
          }
          s = 0, i = 0, y(!0);
          const C = S.body.getReader(), I = new TextDecoder();
          let R = "";
          const A = () => {
            C.read().then(({ done: D, value: L }) => {
              if (D) {
                k();
                return;
              }
              R += I.decode(L, { stream: !0 });
              let U;
              for (; (U = R.indexOf(`

`)) >= 0; ) {
                const ye = R.slice(0, U);
                R = R.slice(U + 2), ye.split(`
`).forEach((G) => {
                  if (!G.startsWith("data: ")) return;
                  let W = null;
                  try {
                    W = JSON.parse(G.slice(6));
                  } catch {
                    return;
                  }
                  W && (W.kind === "snapshot" ? (a = Math.max(a, parseInt(W.rev || 0, 10) || 0), e.onSnapshot(a, W.state || null)) : W.kind === "change" && (a = Math.max(a, parseInt(W.rev || 0, 10) || 0), e.onChange(W)));
                });
              }
              t || A();
            }).catch(() => {
              k();
            });
          };
          A();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (t || c)
      return;
    if (y(!1), i += 1, x || (x = Date.now()), i >= to) {
      if (Date.now() - (x || Date.now()) >= ro) {
        c = !0, y(!1);
        return;
      }
      o = setTimeout(h, no);
      return;
    }
    s = Math.min(s + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, s));
    o = setTimeout(h, m);
  };
  return h(), () => {
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
    f = null, e.onStatus(!1);
  };
}
async function ar(r, e, t) {
  try {
    return (await fetch(N("/question-modal/session-prefs"), {
      method: "POST",
      headers: O(),
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
let Js = null;
async function hn(r, e, t, n) {
  const s = r || "", o = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(n || "");
  try {
    const a = N(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + o
    ), c = await fetch(a, { headers: O() });
    if (!c.ok) return null;
    const i = await c.json();
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
    return Js = { chatId: s, at: Date.now(), data: x }, x;
  } catch {
    return null;
  }
}
function Gs() {
  Js = null;
}
async function Zs(r) {
  try {
    const e = await fetch(N("/question-modal/templates"), {
      method: "POST",
      headers: O(),
      body: JSON.stringify(r)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Qs(r) {
  try {
    const e = await fetch(N("/question-modal/templates/" + encodeURIComponent(r)), {
      method: "DELETE",
      headers: O()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Xs() {
  try {
    const r = await fetch(N("/models"), { headers: O() });
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
function li(r) {
  if (!r) return "";
  try {
    return String(M.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function $(r, e) {
  try {
    const t = Ce().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const le = "__other__";
function he(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function ot(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function ir(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (t && t.has(s) || !Object.prototype.hasOwnProperty.call(n, s)) return;
    const o = e[s];
    !o || typeof o != "object" || !ot(n[s]) && ot(o) && (n[s] = { ...o });
  }), n;
}
function ys(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function xs(r, e) {
  if (!r || typeof r != "object") return "";
  const t = Array.isArray(r.per_question) ? r.per_question : [];
  if (!t.length) return "";
  const n = t.find((s) => Number(s && s.index) === Number(e)) || (t.length === 1 ? t[0] : null);
  return n ? String(n.choice === void 0 || n.choice === null ? "" : n.choice).trim() : "";
}
function ci(r, e, t) {
  if (!t.length) return !1;
  const n = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = he(e), o = _e(e), a = n(s), c = n(o);
  return t.some((i) => {
    const x = n(i);
    return x ? !!(i === s || i === o || x === a || x === c || Math.min(x.length, a.length, c.length) >= 4 && (x.length >= 4 && (a.includes(x) || x.includes(a)) || x.length >= 4 && (c.includes(x) || x.includes(c)))) : !1;
  });
}
function re(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
let Ks = !0;
function bn(r, e) {
  const t = String(r && r.title || "").trim();
  return t || (Ks ? "第 " + (e + 1) + " 题" : "");
}
function _e(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function di(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (o) => {
    o != null && o !== "" && t.add(String(o));
  }, s = r.options || [];
  if (re(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = s.find((i) => he(i) === String(a));
      c && n(_e(c)), String(a) === le && e.other && n(e.other);
    });
  else {
    n(e.value);
    const o = s.find((a) => he(a) === String(e.value));
    o && n(_e(o)), String(e.value) === le && e.other && n(e.other);
  }
  return t;
}
function ui(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const s = String(n);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const o of Array.from(e))
      if (o && (o.indexOf(s) !== -1 || s.indexOf(o) !== -1)) return !0;
    return !1;
  });
}
function Vs(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const s = parseInt(t[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === r.trim());
}
function Ys(r, e, t) {
  const n = e[r], s = n && n.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const o of Object.keys(s)) {
    const a = Vs(o, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !Ys(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !ui(s[o], di(c, i))) return !1;
  }
  return !0;
}
function Ae(r, e) {
  const t = [];
  return r.forEach((n, s) => {
    Ys(s, r, e) && t.push(s);
  }), t;
}
function pi(r) {
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
function fi(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function mi(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((s) => s && (s.text || s.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function gi(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function hi(r) {
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
    const a = Vs(s, r), c = a >= 0 ? r[a] : null, i = c ? re(c) === "single" ? "单选" : re(c) === "multi" ? "多选" : "问答" : "问答", x = c ? bn(c, a) : s;
    let f = o.value;
    if (Array.isArray(f) && (f = f.join("、")), o.other && (f = (f ? f + "、" : "") + o.other), o.skipped) {
      const y = String(o.skipped_by || ""), h = y === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : y === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      n.push(`- ${s} [${i}] ${x}${h}`);
    } else
      n.push(`- ${s} [${i}] ${x}：${f === "" || f == null ? "（空）" : f}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function bi(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      N("/question-modal/resolve") + "?" + t.toString(),
      { headers: O() }
    );
    if (!n.ok) return { kind: "error" };
    const s = await n.json();
    return s && Sr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function At(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      N("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(r),
      { headers: O() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function yi(r) {
  try {
    const e = new FormData();
    e.append("file", r);
    const t = O();
    delete t["Content-Type"];
    const n = await fetch(
      N("/console/upload"),
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
const yn = "qm:v1:stash_att:", ks = 25 * 1024 * 1024, dn = /* @__PURE__ */ new Map(), un = /* @__PURE__ */ new Map();
let xn = null, kn = 0, lr = null;
function ws() {
  const r = kn > 0;
  un.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function xi() {
  if (lr) return lr;
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
    xn = null, !(!n || !t.length) && await eo(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return lr = r, r;
}
function ki(r, e, t) {
  if (!r) {
    $("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  xn = { callId: r, target: e, key: t };
  const n = xi();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (xn = null);
}
async function eo(r, e, t, n) {
  kn += 1, ws();
  const s = [], o = [];
  try {
    for (const c of r) {
      if (c.size && c.size > ks) {
        o.push(`${c.name}: 文件过大（上限 ${Math.round(ks / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await yi(c);
      i.ok ? s.push(i.att) : o.push(i.error);
    }
  } finally {
    kn -= 1, ws();
  }
  const a = dn.get(e);
  if (s.length || o.length) {
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
        a(s, c, n, o);
      } catch {
      }
    else s.length && wi(e, s, c, n);
  }
}
function wi(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const s = localStorage.getItem(yn + r), o = s ? JSON.parse(s) : [], a = (Array.isArray(o) ? o : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(yn + r, JSON.stringify(a));
    } catch {
    }
}
function vi(r) {
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
function Si(r) {
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
function _i(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function cr(r, e) {
  const t = e || V(r), n = Nt(r), s = n && n.request_id ? n.request_id : "";
  if (s)
    try {
      const o = await fetch(N("/question-modal/skip"), {
        method: "POST",
        headers: O(),
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
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: O() }
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
async function vs(r) {
  if (!r) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      N("/console/chat/stop") + "?chat_id=" + encodeURIComponent(r),
      { method: "POST", headers: O() }
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
async function qi(r) {
  try {
    const e = r ? "?session_id=" + encodeURIComponent(r) : "", t = await fetch(
      N("/question-modal/pending") + e,
      { headers: O() }
    );
    if (!t.ok) return null;
    const n = await t.json(), s = n && n.items || [];
    if (!Array.isArray(s) || s.length !== 1) return null;
    const o = s[0];
    if (!o || !o.request_id) return null;
    const a = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(o.request_id),
      { headers: O() }
    );
    if (!a.ok) return null;
    const c = await a.json();
    return c && Sr(c.session_id, c.agent_id), c && c.found ? c : null;
  } catch {
    return null;
  }
}
const qn = "qm:v1:reqid:", Ei = 3e4, Ti = 45e3, to = 6, no = 6e4, ro = 15 * 6e4, Ai = 700, Ci = 8;
function Ii(r) {
  try {
    if (String((r.headers && r.headers.get ? r.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const t = Number(r.status || 0);
    return t === 429 || t === 403 || t === 407 || t === 451;
  } catch {
    return !1;
  }
}
function ie(r) {
  if (r)
    try {
      localStorage.removeItem(qn + r);
    } catch {
    }
}
function zi() {
  try {
    const r = [];
    for (let s = 0; s < localStorage.length; s++) {
      const o = localStorage.key(s);
      o && o.indexOf(qn) === 0 && r.push(o);
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
function Ri(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(qn + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), zi();
    } catch {
    }
}
function Nt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(qn + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (ie(r), null) : t;
  } catch {
    return null;
  }
}
const qr = "qm:v1:state:";
function It(r) {
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
function wn() {
  try {
    let r = sessionStorage.getItem("qm:v1:tab");
    return r || (r = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", r)), r;
  } catch {
    return "tab-anon";
  }
}
const so = wn(), Ss = "qm:v1:sessionprefs-ping";
function He(r, e) {
  if (r)
    try {
      const n = { ...It(r) || {}, ...e, ts: Date.now(), origin: so };
      localStorage.setItem(qr + r, JSON.stringify(n)), Ni();
    } catch {
    }
}
function Ni() {
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
async function Oi(r) {
  try {
    const e = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: O() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && Sr(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function $i(r, e, t, n) {
  const s = ["【用户提交的问卷答案】"], o = new Set(Ae(r, e));
  return r.forEach((a, c) => {
    if (!o.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let x = i.value;
    if (Array.isArray(x))
      x = x.filter((b) => b !== le).map((b) => {
        const T = (a.options || []).find((_) => he(_) === String(b));
        return T ? _e(T) : b;
      }).join("、");
    else {
      const b = (a.options || []).find((T) => he(T) === String(x));
      b && (x = _e(b)), String(i.value) === le && (x = "");
    }
    const f = re(a) === "single" ? "单选" : re(a) === "multi" ? "多选" : "问答", y = !!String(x || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), h = String(i.skipped_by || ""), k = i.skipped ? h === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : h === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : y ? x : "（未作答）";
    let m = `- q${c} [${f}] ${k}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((b) => b.file_name).join("、")}）`), s.push(m);
  }), t && s.push(`- 其他意见：${t}`), n && n.length && s.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), s.join(`
`);
}
function Mi(r) {
  const e = {};
  return Object.keys(r || {}).forEach((t) => {
    const n = r[t];
    if (!n || typeof n != "object") {
      e[t] = n;
      return;
    }
    const s = n.value;
    if (Array.isArray(s) ? s.length === 1 && s[0] === le : String(s ?? "") === le) {
      e[t] = n;
      return;
    }
    e[t] = { ...n, other: "", attachments: [] };
  }), e;
}
function pn(r) {
  return r.map((e, t) => {
    const n = re(e) === "single" ? "单选" : re(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(_e).join("、");
    return `${t + 1}. [${n}] ${bn(e, t)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function dr(r) {
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
  }, x = {
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
    t.map((f, y) => e.createElement(
      "span",
      { key: "att" + y, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: f.file_name
      }, f.file_name + (f.size ? "（" + _i(f.size) + "）" : "")),
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
      disabled: n || s,
      style: x,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, s ? "上传中…" : "📎 附件"),
    o ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + o) : null
  );
}
function Bi(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: s,
    disabled: o,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: x
  } = r, y = Ce().Popover, h = [];
  t.forEach((A) => {
    [...A.models || [], ...A.extra_models || []].forEach((D) => {
      h.push({
        providerId: A.id,
        providerName: A.name || A.id,
        modelId: D.id,
        modelName: D.name || D.id,
        free: !!D.is_free
      });
    });
  });
  const k = h.find((A) => `${A.providerId}:${A.modelId}` === n), b = k ? k.modelName : n || "选择模型", T = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", _ = {
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
  }, S = h.filter((A) => A.free).length, v = h.length - S, C = [];
  t.forEach((A) => {
    const D = [...A.models || [], ...A.extra_models || []].map((L) => ({
      providerId: A.id,
      providerName: A.name || A.id,
      modelId: L.id,
      modelName: L.name || L.id,
      free: !!L.is_free
    })).filter((L) => i === "free" ? L.free : !L.free);
    D.length && C.push({ id: A.id, name: A.name || A.id, models: D });
  });
  const I = (A, D) => e.createElement("button", {
    key: A,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === A ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === A ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === A ? 600 : 400,
      boxShadow: i === A ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => x(A)
  }, D), R = e.createElement(
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
      I("paid", "付费 🟡 " + v),
      I("free", "免费 🟢 " + S)
    ),
    C.length ? e.createElement("div", null, C.map((A, D) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: A.id,
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
          e.createElement("span", { style: { flex: 1 } }, A.name),
          e.createElement("span", { style: { fontWeight: 400 } }, A.models.length)
        ),
        A.models.map((L) => {
          const U = `${L.providerId}:${L.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${L.providerId}:${L.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (U ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: U ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${L.providerId}:${L.modelId}`), c(!1);
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
            }, L.modelName)
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
    content: R,
    trigger: "click",
    open: a,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: _,
      disabled: o,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: _,
      disabled: o,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const A = h.find((D) => `${D.providerId}:${D.modelId}` !== n);
        A && s(`${A.providerId}:${A.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: T }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Li(r) {
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
function ji(r) {
  const { R: e, templates: t, value: n, open: s, onOpenChange: o, disabled: a, onSelect: c, onManage: i } = r, f = Ce().Popover, y = (t || []).find((T) => T.id === n), h = y ? y.name : "默认模板", k = {
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
  ), b = e.createElement(
    "button",
    {
      type: "button",
      style: k,
      disabled: a,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, h),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return f ? e.createElement(f, {
    content: m,
    trigger: "click",
    open: s,
    onOpenChange: o,
    placement: "bottomLeft"
  }, b) : b;
}
function Pi(r) {
  const { R: e, open: t, templates: n, value: s, edit: o, onEditChange: a, onClose: c, onSelect: i, onSave: x, onDelete: f } = r;
  if (!t) return null;
  const y = Ce(), { Input: h, Modal: k } = y, m = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  k || (m.position = "fixed", m.right = 24, m.top = 80, m.width = 420, m.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", m.zIndex = 1100, m.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const b = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, T = !!o, _ = (v, C, I, R) => h && h.TextArea ? e.createElement(h.TextArea, {
    value: v,
    rows: I,
    placeholder: R,
    onChange: (A) => C(A && A.target ? A.target.value : "")
  }) : e.createElement("textarea", {
    value: v,
    rows: I,
    placeholder: R,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (A) => C(A && A.target ? A.target.value : ""),
    onChange: (A) => C(A && A.target ? A.target.value : "")
  }), S = e.createElement(
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
      e.createElement("button", { type: "button", style: b, onClick: c }, "关闭")
    ),
    T ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      _(o.name || "", (v) => a({ ...o, name: v }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      _(o.system || "", (v) => a({ ...o, system: v }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      _(o.user || "", (v) => a({ ...o, user: v }), 6, "用户提示词模板"),
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
          onClick: () => x(o)
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
            v.name + (v.builtin ? "（内置）" : "") + (v.id === s ? " · 使用中" : "")
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
  return k ? e.createElement(k, {
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
  }, S) : S;
}
function Di(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: s,
    mode: o,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: x,
    disabled: f,
    children: y,
    open: h,
    onOpenChange: k
  } = r, b = Ce().Popover, T = e.createElement("button", {
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
    title: o === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : o === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      k(!h);
    }
  }, t ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      T,
      n && h ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((C) => C.reasoning).join(`

`))) : null
    );
  const _ = !!(n && (n.per_question || []).length), S = (C, I, R) => e.createElement("button", {
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
    onClick: I
  }, C), v = e.createElement(
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
        _ && !t ? e.createElement("button", {
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
              (x || a)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        _ && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: _ ? 6 : "auto",
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
            c(), k(!1);
          }
        }, "套用推荐") : null
      ),
      (n.per_question || []).map((C) => e.createElement(
        "div",
        { key: C.index, style: { marginBottom: 14 } },
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
          }, C.title),
          C.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + C.choice) : null,
          typeof C.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(C.confidence <= 1 ? C.confidence * 100 : C.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: li(C.reasoning || "") }
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
      S("开始分析", () => {
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
    onOpenChange: k,
    placement: "bottomRight"
  }, T);
}
function Fi(r) {
  const e = be().React, t = Ce(), { Input: n, Button: s } = t, o = n.TextArea, a = r.data || {}, c = pi(a), i = fi(a), x = mi(a), f = gi(x), y = f ? "" : x, h = c.questions || [], k = c.title || "问卷", m = It(i), [b, T] = e.useState(
    () => !!(m && m.answered) || !!y || f
  ), [_, S] = e.useState(""), [v, C] = e.useState(() => {
    const l = Nt(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [I, R] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [A, D] = e.useState(
    () => m && typeof m.slowAt == "number" ? m.slowAt : 0
  ), [L, U] = e.useState(
    () => m && typeof m.slowStep == "number" ? m.slowStep : -1
  ), [ye, G] = e.useState(
    () => !!(m && m.slowFired === !0)
  ), [W, Oe] = e.useState(() => {
    const l = {};
    h.forEach((g, p) => {
      l[`q${p}`] = { type: re(g), value: re(g) === "multi" ? [] : "", other: "" };
    });
    const u = m && m.answers;
    return u && typeof u == "object" && Object.keys(u).forEach((g) => {
      l[g] && (l[g] = { ...l[g], ...u[g] });
    }), l;
  }), [at, uo] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [H, Ie] = e.useState(!1), [ze, En] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [it, lt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [ue, Qe] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(y || "")
  ), [Re, Xe] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || hi(y || "")
  ), [ct, Ar] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [Mt, Cr] = e.useState(
    () => !!(m && m.expanded)
  ), [Ir, Bt] = e.useState(!1), Tn = e.useRef(0), [pe, po] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [$e, dt] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [Ke, An] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Cn, In] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [ut, Lt] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), pt = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < or * 1e3)
  ), Me = e.useRef(!1), jt = e.useRef(!!(m && m.pastSoft === !0)), [zn, fo] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), mo = e.useRef(zn), zr = (l) => {
    mo.current = l, fo(l);
  }, se = (l, u) => {
    const g = zn[l];
    return g ?? u;
  };
  Ks = !!se("fallback_title", !0);
  const Rr = Math.max(30, Number(se("wait_hint_sec", or)) || or), go = "manual", [Z, Pt] = e.useState(go), [Nr, Rn] = e.useState(""), [ll, ho] = e.useState(!1), [Nn, On] = e.useState(!1), [$n, Mn] = e.useState(!1), [bo, yo] = e.useState([]), [Or, Bn] = e.useState(!1), [Dt, Ve] = e.useState(null), [xo, Be] = e.useState(""), [ko, wo] = e.useState(!1), [vo, So] = e.useState(!1), [_o, qo] = e.useState("paid"), Ne = e.useRef({}), qe = e.useRef({}), Ye = e.useRef(0), ft = e.useRef(null), [Eo, et] = e.useState(0), [$r, Ln] = e.useState([]), [Le, Ft] = e.useState(""), Ee = e.useRef(Le);
  Ee.current = Le;
  const [To, Ao] = e.useState(!1), [Co, Mr] = e.useState(!1), [Io, jn] = e.useState(null), [we, Br] = e.useState(
    () => !!(m && m.autoPaused)
  ), zo = e.useRef(we);
  zo.current = we;
  const tt = e.useRef(!1), Pn = e.useRef(0), Wt = e.useRef({}), [Ro, No] = e.useState(0), mt = e.useRef(/* @__PURE__ */ new Set()), gt = (l) => {
    l && mt.current.add(l);
  }, Ht = e.useRef({}), [Oo, Ut] = e.useState(0), je = e.useRef({}), [ht, $o] = e.useState(!1), Mo = e.useRef(!1);
  Mo.current = ht, e.useRef(!1);
  const Bo = async () => {
    try {
      const l = await hn(
        "",
        !0,
        V(i),
        qt()
      );
      if (!l || !l.config) return;
      const u = l.config;
      zr(u), u.mode !== void 0 && Pt(Et(u.mode)), typeof u.model_id == "string" && u.model_id && Rn(u.model_id), typeof u.with_context == "boolean" && On(u.with_context), typeof u.parallel == "boolean" && Mn(u.parallel), et((g) => g + 1);
    } catch {
    }
  }, Lr = e.useRef(!1), Jt = (l) => {
    if (l.mode !== void 0) {
      Pt(l.mode), ar(
        { mode: l.mode },
        V(i),
        qt()
      );
      try {
        localStorage.setItem(Ss, so + ":" + Date.now());
      } catch {
      }
    }
    const u = {};
    l.modelId !== void 0 && (u.model_id = l.modelId), l.withContext !== void 0 && (u.with_context = l.withContext), l.parallel !== void 0 && (u.parallel = l.parallel), Object.keys(u).length && (l.modelId !== void 0 && Rn(l.modelId), l.withContext !== void 0 && On(l.withContext), l.parallel !== void 0 && Mn(l.parallel), ar(u, V(i), qt()));
  }, jr = (l) => {
    !l || l === Le || (Ft(l), Ee.current = l, He(i, { templateId: l }), ar(
      { template_id: l },
      V(i),
      qt()
    ), Ve(null), Ne.current = {}, qe.current = {}, et((u) => u + 1));
  }, Lo = async (l) => {
    const u = await Zs({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!u.ok) {
      $("error", u.error || "保存失败");
      return;
    }
    Ln(u.items || []), jn(null), $("success", "模板已保存");
  }, jo = async (l) => {
    const u = await Qs(l);
    if (!u.ok) {
      $("warning", u.error || "删除失败");
      return;
    }
    Ln(u.items || []);
    const g = (u.items || []).map((p) => p.id);
    if (g.indexOf(Ee.current) === -1) {
      const p = g[0] || "";
      Ft(p), Ee.current = p, He(i, { templateId: p });
    }
    $("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    const l = (u) => {
      try {
        String(u && u.key || "") === Ss && Bo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [b, i]), e.useEffect(() => {
    if (b) return;
    let l = !0;
    return si(), (async () => {
      const [u, g, p, w] = await Promise.all([
        Xs(),
        oi(),
        _r(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        hn(
          "",
          !0,
          V(i),
          qt()
        )
      ]);
      if (!l) return;
      if (yo(u), Ln(p.items), w && w.config) {
        const E = w.config;
        zr(E), E.mode !== void 0 && Pt(Et(E.mode)), typeof E.model_id == "string" && E.model_id && Rn(E.model_id), typeof E.with_context == "boolean" && On(E.with_context), typeof E.parallel == "boolean" && Mn(E.parallel), typeof E.template_id == "string" && E.template_id && (Ft(E.template_id), Ee.current = E.template_id);
      }
      const q = p.items.map((E) => E.id);
      if (!Ee.current || q.indexOf(Ee.current) === -1) {
        const E = p.defaultId || q[0] || "";
        E && (Ft(E), Ee.current = E);
      }
      if (w && w.config) {
        const E = w.config;
        ho(E.__follow_active__ === !0);
      }
      Lr.current = !0, et((E) => E + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    Ye.current = I;
  }, [I]);
  const Dn = async (l) => {
    if (Or) return;
    const u = I;
    Bn(!0), Be("");
    const g = typeof AbortController < "u" ? new AbortController() : null;
    ft.current = g;
    try {
      const p = await fetch(N("/question-modal/analyze"), {
        method: "POST",
        headers: O(),
        body: JSON.stringify({
          request_id: v,
          tool_call_id: i,
          session_id: V(i),
          title: k,
          questions: h,
          model_id: Nr,
          mode: l,
          with_context: Nn,
          parallel: $n,
          question_index: u,
          answers: W,
          template_id: Ee.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(se("model_timeout_sec", 120)) || 120
        }),
        signal: g ? g.signal : void 0
      }), w = await p.json().catch(() => ({})), q = w && w.analysis || null, E = q && q.error || w && w.error || "";
      w && w.cancelled || q && q.cancelled ? Be("已终止分析。") : !p.ok || !w || w.ok === !1 || q && q.ok === !1 ? Be(E || "分析失败（服务返回 " + p.status + "）") : q && (Ne.current[u] = q, qe.current[u] = !0, Ye.current === u && Ve(q), $("success", "第 " + (u + 1) + " 题 AI 分析完成"));
    } catch (p) {
      ft.current === g && g && g.signal.aborted || p && p.name === "AbortError" ? Be("已终止分析。") : Be("分析请求失败：" + (p && p.message ? p.message : p));
    } finally {
      ft.current === g && (ft.current = null), Bn(!1), je.current[u] = !0, Ut((p) => p + 1);
    }
  }, Po = () => {
    const l = I;
    delete Ne.current[l], Ve(null), Be(""), Dn("manual");
  }, nt = (l) => {
    var g;
    const u = l !== void 0 ? l : Ye.current;
    try {
      fetch(N("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: O(),
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
      sn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (g = ft.current) == null || g.abort();
    } catch {
    }
    Bn(!1);
  }, Do = () => {
    nt(), Be("已终止分析。");
  }, Fo = () => {
    we ? (Ht.current = {}, je.current = {}, qe.current = {}, tt.current = !1, Br(!1), et((l) => l + 1), $("info", "已恢复自动答题")) : (nt(), Br(!0), $("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = Ne.current[I];
    Ve(l || null);
    const u = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + I;
    let g = !0;
    return fetch(N("/question-modal/analysis") + u, { headers: O() }).then((p) => p.ok ? p.json() : null).then((p) => {
      !g || !p || !p.found || !p.analysis || (Ne.current[I] = p.analysis, Ye.current === I && Ve(p.analysis));
    }).catch(() => {
    }), () => {
      g = !1;
    };
  }, [i, I]), e.useEffect(() => {
    b || Lr.current && Z === "ai" && ht && (!on(c) || !h.length || qe.current[I] || H || (qe.current[I] = !0, Dn("auto")));
  }, [
    b,
    Z,
    i,
    Eo,
    Nn,
    $n,
    h,
    I,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    ht
  ]);
  const Wo = () => {
    const l = Dt && Dt.per_question || [];
    if (!l.length) return;
    if (!l.some((g) => g.type === "multi" ? String(g.choice || "").split(/[、,，]/).map((p) => p.trim()).filter(Boolean).length > 0 : String(g.choice || "").trim().length > 0)) {
      $("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Oe((g) => {
      const p = { ...g };
      return l.forEach((w) => {
        const q = `q${w.index}`;
        gt(q);
        const E = p[q] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const X = String(w.choice || "").split(/[、,，]/).map((J) => J.trim()).filter(Boolean);
          p[q] = { ...E, value: X };
        } else
          p[q] = { ...E, value: w.choice || E.value };
      }), p;
    }), $("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Pe = (l, u, g = !1) => {
    nt(), po(l), Qe(!0), lt(u), Bt(!1), T(!0), ie(i), g && He(i, { backendReleased: !0 });
  }, Ho = async (l, u) => {
    const g = await cr(i, V(i));
    return g.ok ? (Pe(l, u, g.released), !0) : (Bt(!0), Wn(!1), !1);
  };
  e.useEffect(() => {
    var u;
    const l = (u = It(i)) == null ? void 0 : u.answers;
    He(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: v,
      visStep: I,
      answers: ir(W, l, mt.current),
      finalOther: at,
      finalOtherAtt: ct,
      answered: b,
      skippedAll: ue,
      expanded: Mt,
      localResult: it,
      submittedAt: Ke,
      skipReason: Re,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Cn,
      waitRetired: ut,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: A,
      slowStep: L,
      slowFired: ye,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: pe,
      gateBlocked: $e,
      releasedNote: ze,
      autoPaused: we,
      templateId: Le
    });
  }, [
    i,
    v,
    I,
    W,
    at,
    ct,
    b,
    ue,
    Mt,
    it,
    Ke,
    Re,
    Cn,
    ut,
    A,
    L,
    ye,
    pe,
    we,
    Le,
    $e,
    ze
  ]), e.useEffect(() => {
    if (!b || !Ke || ut || !pt.current) return;
    let l = 0, u = !1, g = hs(i);
    const p = () => {
      if (u) return;
      const w = Math.floor((Date.now() - Ke) / 1e3);
      if (w >= Rr) {
        Me.current = !0, Lt(!0);
        return;
      }
      if (!Me.current) {
        const q = hs(i);
        q >= 0 && (g < 0 ? g = q : q - g >= Qa && (Me.current = !0));
      }
      if (!Me.current && w >= Ga && !jt.current && (jt.current = !0, In(!0)), Me.current) {
        l = setTimeout(
          () => {
            u || Lt(!0);
          },
          Math.max(1e3, (Rr - w) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        u || bs(p);
      }, Us);
    };
    return bs(p), () => {
      u = !0, clearTimeout(l);
    };
  }, [b, Ke, ut]);
  const [Fn, Wn] = e.useState(!1), [Hn, Pr] = e.useState(""), Dr = (l, u, g) => {
    l.length && (u === "final" ? Ar((p) => p.concat(l)) : Oe((p) => {
      const w = g || `q${I}`;
      gt(w);
      const q = p[w] || { type: "text", value: "", other: "" };
      return { ...p, [w]: { ...q, attachments: (q.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (p, w, q, E) => {
      Dr(p, w, q), E && E.length ? Pr(E.join("；")) : Pr("");
    }, u = (p) => Wn(p);
    dn.set(i, l), un.set(i, u);
    const g = vi(i);
    return g.length && g.forEach((p) => Dr([p.att], p.target, p.key)), Wn(kn > 0), () => {
      dn.get(i) === l && dn.delete(i), un.get(i) === u && un.delete(i);
    };
  }, [i, I]);
  const Un = (l, u) => ki(i, l, u), Jn = (l, u, g) => {
    const p = Si(l);
    if (p.length) {
      try {
        l.preventDefault();
      } catch {
      }
      eo(p, i, u, g);
    }
  };
  e.useEffect(() => {
    if (!f || _) return;
    let l = !0;
    return At(i).then((u) => {
      if (!l || !u) return;
      u.kind === "skipped" && !u.answers && Qe(!0);
      const g = String(u.skip_reason || "").trim();
      g && Xe((p) => p || g), S(Tt(h, u));
    }), () => {
      l = !1;
    };
  }, [f, i, _]), e.useEffect(() => {
    if (b || !i || y) return;
    let l = !0;
    return At(i).then((u) => {
      if (!l || !u) return;
      u.kind === "skipped" && !u.answers && Qe(!0);
      const g = String(u.skip_reason || "").trim();
      g && Xe((p) => p || g), S((p) => p || Tt(h, u)), lt(Tt(h, u)), T(!0), ie(i);
    }), () => {
      l = !1;
    };
  }, [i, b, y]), e.useEffect(() => {
    if (b) return;
    let l = !0, u = 0, g = 0, p = 0, w = !1, q = !1, E = 0, X = 0;
    Tn.current || (Tn.current = Date.now());
    let J = !!Nt(i), me = !1;
    const ce = (z) => {
      !l || !z || !z.request_id || (J = !0, g = 0, p = 0, w = !1, C(z.request_id), Bt(!1), E && (clearTimeout(E), E = 0), Ri(
        i,
        z.request_id,
        z.session_id || _n(),
        z.agent_id
      ));
    }, ee = (z) => {
      l && (E && (clearTimeout(E), E = 0), X && (clearTimeout(X), X = 0), Ho(
        z,
        z === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, vt = Nt(i), We = async () => {
      if (!vt) return !1;
      const z = await Oi(vt.request_id);
      if (!l) return !0;
      if (z.kind === "found") {
        const oe = z.data;
        return oe.tool_call_id && i && oe.tool_call_id !== i ? (ie(i), !1) : (ce(oe), !0);
      }
      return z.kind === "orphan" ? (ee("orphan"), !0) : (z.kind === "absent" && ie(i), !1);
    }, ge = (z = !1) => {
      if (l) {
        if (u += 1, z || (g += 1, p || (p = Date.now())), z) {
          if (!me) {
            me = !0, At(i).then((te) => {
              if (l) {
                if (te) {
                  te.kind === "skipped" && !te.answers && Qe(!0);
                  const St = String(te.skip_reason || "").trim();
                  St && Xe((tr) => tr || St), S(Tt(h, te)), lt(Tt(h, te)), T(!0), ie(i);
                  return;
                }
                ge(!0);
              }
            });
            return;
          }
          if (J) {
            ee("gone");
            return;
          }
          const oe = Date.now() - (Tn.current || Date.now());
          if (u >= 12 && oe >= Ti) {
            ee("gone");
            return;
          }
        }
        if (g >= to) {
          if (Date.now() - (p || Date.now()) >= ro) {
            if (w = !0, !q) {
              q = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !w) return;
                    w = !1, g = 0, p = 0, u = 0, K();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          E = setTimeout(K, no);
          return;
        }
        E = setTimeout(K, u < Ci ? Ai : 5e3);
      }
    }, ke = () => {
      bi(i, V(i)).then((z) => {
        if (l) {
          if (z.kind === "found") {
            ce(z.data);
            return;
          }
          if (z.kind === "orphan") {
            ee("orphan");
            return;
          }
          if (z.kind === "error") {
            ge(!1);
            return;
          }
          qi(V(i)).then((oe) => {
            if (l) {
              if (oe) {
                if (oe.tool_call_id && i && oe.tool_call_id !== i) {
                  At(i).then((te) => {
                    if (l) {
                      if (te) {
                        T(!0), ie(i);
                        return;
                      }
                      ge(!0);
                    }
                  });
                  return;
                }
                ce(oe);
                return;
              }
              At(i).then((te) => {
                if (l) {
                  if (te) {
                    te.kind === "skipped" && !te.answers && Qe(!0);
                    const St = String(te.skip_reason || "").trim();
                    St && Xe((tr) => tr || St), T(!0), ie(i);
                    return;
                  }
                  ge(!0);
                }
              });
            }
          });
        }
      });
    }, K = () => {
      if (l) {
        if (!vt) {
          ke();
          return;
        }
        We().then((z) => {
          !l || z || ke();
        });
      }
    };
    return X = setTimeout(() => {
      l && Bt(!0);
    }, Ei), K(), () => {
      l = !1, E && clearTimeout(E), X && clearTimeout(X);
    };
  }, [b, i]);
  const Fr = async () => {
    Ie(!0);
    try {
      const l = V(i);
      let u = await cr(i, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await vs(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok)
        throw new Error(
          u.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + u.reason + "）"
        );
      if (u.released) {
        const p = u.reason === "host-stop";
        Pe(
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
        Pe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ie(!1);
    }
  }, Wr = async () => {
    Ie(!0);
    try {
      const l = V(i);
      let u = await cr(i, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await vs(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok) {
        En(u.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + u.reason + "）。"), $("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (u.released) {
        const p = u.reason === "host-stop";
        En(p ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), $("info", p ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        En("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), $("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ie(!1);
    }
  }, Gt = Ae(h, W), De = Gt.length, xe = I >= De, Q = xe ? -1 : Gt[I], bt = xe ? De : I;
  e.useEffect(() => {
    if (Et(se("mode", "manual")) !== "manual") return;
    const u = String(se("notify_channel", "off") || "off"), g = !!se("notify_manual_mode", !1);
    if (u === "off" && !g || b || ue || pe || !on(c) || !h.length) return;
    const p = Ae(h, W).filter((w) => !ot(W[`q${w}`])).length;
    Ja(i, k, p);
  }, [zn, b, ue, pe, bt]);
  const Zt = Math.max(0, Number(se("slow_question_sec", Za)) || 0) * 1e3, Uo = Math.round(Zt / 1e3);
  e.useEffect(() => {
    if (b || ue || pe || Zt <= 0) return;
    if (L !== bt) {
      U(bt), D(Date.now()), G(!1);
      return;
    }
    if (!A) {
      D(Date.now());
      return;
    }
    if (ye) return;
    const l = A + Zt - Date.now();
    if (l <= 0) {
      G(!0);
      return;
    }
    let u = !1;
    const g = setTimeout(() => {
      u || G(!0);
    }, l);
    return () => {
      u = !0, clearTimeout(g);
    };
  }, [b, ue, pe, bt, L, A, ye, Zt]);
  const fe = Q >= 0 ? h[Q] : null, rt = `q${Q}`, F = Q >= 0 && W[rt] || { type: re(fe), value: re(fe) === "multi" ? [] : "", other: "" }, st = (l) => {
    var p;
    $e && dt(""), Q >= 0 && gt(`q${Q}`);
    const u = { ...W, [rt]: { ...l, skipped: !1 } }, g = Ae(h, u);
    h.forEach((w, q) => {
      g.indexOf(q) === -1 && delete u[`q${q}`];
    }), He(i, {
      answers: ir(u, (p = It(i)) == null ? void 0 : p.answers, mt.current)
    }), Oe(u);
  };
  e.useEffect(() => {
    I > De && R(De);
  }, [De, I]);
  const Gn = async (l, u) => {
    const g = await fetch(N(l), {
      method: "POST",
      headers: O(),
      body: JSON.stringify(u)
    }), p = await g.json().catch(() => ({}));
    if (!g.ok) {
      const w = new Error(p && p.detail || "HTTP " + g.status);
      throw w.status = g.status, w;
    }
    return p;
  }, Zn = () => {
    var l;
    return Mi(ir(
      W,
      (l = It(i)) == null ? void 0 : l.answers,
      mt.current
    ));
  }, Jo = () => !!se("gate_unsaved", !0), Hr = (l, u) => {
    if (!Jo()) return [];
    const g = [];
    if (typeof u == "number")
      return Ae(h, l).indexOf(u) !== -1 && !ot(l[`q${u}`]) && g.push(u + 1), g;
    const p = new Set(Ae(h, l));
    return h.forEach((w, q) => {
      p.has(q) && !ot(l[`q${q}`]) && g.push(q + 1);
    }), g;
  }, Ur = (l, u, g) => {
    const p = "第 " + l.join("、") + " 题", w = g === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    dt("⛔ " + p + "尚未选择。" + w);
    const q = Ae(h, u).length;
    Gn("/question-modal/gate-block", {
      request_id: v,
      tool_call_id: i,
      session_id: V(i),
      missing: l,
      answered: q - l.length,
      total: q,
      bundle: ms
    }).catch(() => {
    });
  }, Qt = async (l, u = !1) => {
    if (!v)
      return $("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const g = Zn();
    if (!u) {
      const p = Hr(g);
      if (p.length)
        return Ur(p, g, "提交"), "blocked";
      dt("");
    }
    Ie(!0);
    try {
      const p = await Gn("/question-modal/answer", {
        request_id: v,
        session_id: V(i),
        answers: g,
        other: at,
        attachments: ct
      });
      return p && p.orphan ? (fetch(
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(V(i)),
        { method: "POST", headers: O() }
      ).catch(() => {
      }), Pe(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), $("info", "本次问卷已失效，已关闭"), "sent") : (ie(i), lt($i(h, g, at, ct)), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, pt.current = !0, T(!0), "sent");
    } catch (p) {
      return p && p.status === 404 ? (Pe(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), $("info", "本次问卷已失效，已关闭"), "blocked") : ($("error", "提交失败: " + p.message), u ? (tt.current = !1, Pn.current += 1, Pn.current >= nr && $(
        "warning",
        "自动提交连续失败 " + nr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Ut((w) => w + 1), "not-ready") : "blocked");
    } finally {
      Ie(!1);
    }
  }, Jr = () => se("skip_mode", "per_question") === "whole", Go = () => {
    Q < 0 || ($e && dt(""), nt(Ye.current), qe.current[Ye.current] = !0, gt(`q${Q}`), Oe((l) => {
      const u = { ...l };
      u[`q${Q}`] = {
        type: (l[`q${Q}`] || {}).type || re(fe),
        value: ((l[`q${Q}`] || {}).type || re(fe)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const g = Ae(h, u);
      return h.forEach((p, w) => {
        g.indexOf(w) === -1 && delete u[`q${w}`];
      }), u;
    }), R((l) => l + 1));
  }, Zo = () => {
    if (xe) {
      Qt();
      return;
    }
    const l = Zn(), u = Hr(l, Q);
    if (u.length) {
      Ur(u, l, "下一步");
      return;
    }
    $e && dt(""), R((g) => g + 1);
  }, Qo = async () => {
    if (!v) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    nt(), Ie(!0);
    try {
      const l = await Gn("/question-modal/skip", {
        request_id: v,
        session_id: V(i)
      });
      if (l && l.orphan) {
        Pe(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("info", "已跳过问卷"), ie(i), Qe(!0), Xe("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), lt("用户跳过了本次问卷。"), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, pt.current = !0, T(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Pe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("error", "跳过失败: " + l.message);
    } finally {
      Ie(!1);
    }
  };
  e.useEffect(() => {
    if (b || Z !== "ai" && Z !== "recommend" || we || (Z === "recommend" || Z === "ai") && !ht || !on(c) || !h.length || H) return;
    if (xe) {
      if (tt.current || Pn.current >= nr) return;
      const J = Zn();
      if (!Gt.every(
        (ce, ee) => !!je.current[ee] || ot(J[`q${ce}`])
      ) || !v) return;
      tt.current = !0, Qt(void 0, !0).then((ce) => {
        ce === "not-ready" && (tt.current = !1);
      });
      return;
    }
    const l = I;
    if (Ht.current[l] || Z === "ai" && !je.current[l]) return;
    const u = Gt[l], g = h[u], p = re(g), w = ys(g), q = xs(Ne.current[l], u);
    if (Z === "ai" && !je.current[l]) return;
    Ht.current[l] = !0;
    const E = w.length ? w.join("、") : q, X = !!E;
    gt(`q${u}`), X || (Wt.current[u] = !0, No((J) => J + 1), $("warning", "第 " + (u + 1) + " 题没有可用的推荐，已标记为未作答")), Oe((J) => {
      const me = { ...J }, ce = `q${u}`, ee = me[ce] || { type: p, value: p === "multi" ? [] : "", other: "" };
      if (!X)
        me[ce] = {
          ...ee,
          type: p,
          value: p === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (p === "multi") {
        const We = g.options || [], ge = (K) => String(K).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), ke = E.split(/[、,，]/).map((K) => ge(K)).filter(Boolean).map((K) => {
          const z = We.find((oe) => he(oe) === K || _e(oe) === K);
          return z ? he(z) : K;
        });
        me[ce] = {
          ...ee,
          type: p,
          value: ke,
          other: ke.length === 1 && ke[0] === le ? ee.other : "",
          attachments: ke.length === 1 && ke[0] === le ? ee.attachments : []
        };
      } else if (p === "single") {
        const We = g.options || [], ge = (z) => String(z).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), ke = We.find((z) => he(z) === E || _e(z) === E) || We.find((z) => he(z) === ge(E) || _e(z) === ge(E)), K = ke ? he(ke) : E;
        me[ce] = {
          ...ee,
          type: p,
          value: K,
          other: String(K) === le ? ee.other : "",
          attachments: String(K) === le ? ee.attachments : []
        };
      } else
        me[ce] = { ...ee, type: p, value: E };
      const vt = Ae(h, me);
      return h.forEach((We, ge) => {
        vt.indexOf(ge) === -1 && delete me[`q${ge}`];
      }), me;
    }), qe.current[l] = !0, je.current[l] = !0, R((J) => J + 1), Ut((J) => J + 1);
  }, [
    b,
    Z,
    we,
    H,
    i,
    I,
    Oo,
    De,
    c,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    v,
    ht
  ]);
  const yt = e.useRef(!1), Fe = e.useRef(0), xt = e.useRef(!1), Te = e.useRef({});
  e.useEffect(() => {
    if (b || !i) return;
    let l = !0;
    const u = (p) => {
      if (!(!l || !p)) {
        yt.current = !0, xt.current = !0;
        try {
          if (Array.isArray(p.questions) && p.questions.length && (!h || h.length), p.answers && typeof p.answers == "object" && (Oe((q) => {
            const E = { ...q };
            return Object.keys(p.answers).forEach((X) => {
              const J = p.answers[X];
              !J || typeof J != "object" || mt.current.has(X) || (E[X] = {
                ...E[X] || { type: "single", value: "", other: "" },
                ...J
              });
            }), E;
          }), He(i, { answers: p.answers })), typeof p.cursor == "number" && p.cursor >= 0 && R(p.cursor), typeof p.mode == "string" && p.mode) {
            const q = Et(p.mode);
            Pt((E) => E === q ? E : q);
          }
          p.per_question && typeof p.per_question == "object" && Object.keys(p.per_question).forEach((q) => {
            const E = parseInt(q, 10);
            !isNaN(E) && p.per_question[q] && (Ne.current[E] = p.per_question[q]);
          }), p.status === "submitted" && (An((q) => q || Date.now()), p.released && He(i, { backendReleased: !0 }), T(!0), ie(i));
          const w = String(p.skip_reason || "").trim();
          w && Xe((q) => q || w), typeof p.mode == "string" && p.mode && (Te.current.mode = Et(p.mode)), Object.keys(p.answers || {}).forEach((q) => {
            Te.current["a:" + q] = JSON.stringify(p.answers[q] || {});
          }), typeof p.cursor == "number" && (Te.current.cursor = "c:" + p.cursor), xt.current = !0, Ut((q) => q + 1);
        } finally {
          setTimeout(() => {
            yt.current = !1;
          }, 0);
        }
      }
    };
    ai(i).then((p) => {
      !l || !p || !p.found || !p.state || (Fe.current = Math.max(Fe.current, p.rev), u(p.state));
    });
    const g = ii(i, {
      onSnapshot: (p, w) => {
        Fe.current = Math.max(Fe.current, p), w && u(w);
      },
      onChange: (p) => {
        const w = parseInt(p.rev || 0, 10) || 0;
        w && w <= Fe.current && p.origin !== wn() || (Fe.current = Math.max(Fe.current, w), !(p.origin && p.origin === wn()) && u(p.state));
      },
      onStatus: (p) => {
        l && $o((w) => w === !p ? w : !p);
      }
    });
    return () => {
      l = !1, g();
    };
  }, [b, i]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Object.keys(W || {}).forEach((l) => {
      const u = JSON.stringify(W[l] || {});
      Te.current["a:" + l] !== u && (Te.current["a:" + l] = u, sn(
        i,
        "set_answer",
        { key: l, answer: W[l] }
      ));
    });
  }, [b, i, JSON.stringify(W)]), e.useEffect(() => {
    if (b || !i || yt.current || !xt.current) return;
    const l = "c:" + I;
    Te.current.cursor !== l && (Te.current.cursor = l, sn(i, "goto", { cursor: I }));
  }, [b, i, I]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Te.current.mode !== Z && (Te.current.mode = Z, sn(i, "set_mode", { mode: Z }));
  }, [b, i, Z]);
  const Xt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Qn = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Xn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Kt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Kn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Gr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Vn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Xo = { display: "flex", flexDirection: "column", gap: 8 }, Vt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, Yt = {
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
    ...Yt,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Ko = {
    ...Yt,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Yn = {
    ...Yt,
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
  }, Zr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Yn,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Qr = {
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
  }, Vo = { height: 32, fontSize: 13, borderRadius: 8 }, Xr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Kr = (l) => {
    const u = he(l);
    return F.type === "multi" ? Array.isArray(F.value) && F.value.indexOf(u) !== -1 : F.value === u;
  }, Vr = Kr(le), Yr = (l) => {
    if (b || H) return;
    const u = he(l);
    if (F.type === "multi") {
      const g = Array.isArray(F.value) ? F.value.slice() : [], p = g.indexOf(u);
      p === -1 ? g.push(u) : g.splice(p, 1);
      const w = g.length === 1 && g[0] === le;
      st({
        ...F,
        value: g,
        other: w ? F.other : "",
        attachments: w ? F.attachments : []
      });
    } else {
      const g = u === le;
      st({
        ...F,
        value: u,
        other: g ? F.other : "",
        attachments: g ? F.attachments : []
      });
    }
  }, Yo = !!se("show_recommend_badge", !0), es = se("badge_position", "left") === "right", ea = se("badge_style", "rect") === "round", ts = (l) => l && Yo ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: ea ? { ...Qr, borderRadius: 999 } : Qr
  }, "AI 推荐") : null, ta = !!se("auto_number_options", !0), na = !!se("highlight_recommended", !1), ra = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, ns = (l, u, g, p, w, q) => e.createElement(
    "button",
    {
      key: p,
      type: "button",
      disabled: b || H,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: w && na ? { ...u ? Zr : Yn, ...ra } : u ? Zr : Yn,
      onClick: g
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    es ? null : ts(w),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (u ? "✓ " : "") + (q && ta ? q + ". " : "") + l),
    es ? ts(w) : null
  );
  if (!b && !on(c))
    return e.createElement(
      "div",
      { style: Xt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Qn, className: "qm-header" },
        e.createElement(
          "div",
          { style: Xn },
          rr(e),
          e.createElement("span", { style: Kt, className: "qm-title" }, k)
        ),
        e.createElement("span", { style: Kn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Gr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Ir ? e.createElement(
        "div",
        { style: Vt },
        e.createElement("button", {
          type: "button",
          disabled: H,
          style: { ...kt, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Fr
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = () => {
      const g = Ya({
        submittedAt: Ke,
        deadReason: pe,
        releasedNote: ze,
        skippedAll: ue,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: ut,
        pastSoft: Cn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!pt.current
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
      }, Va(g.phase)) : null;
    }, u = !!pt.current;
    return ue && !Mt ? e.createElement(
      "div",
      {
        style: {
          ...Xt,
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
        pe ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      Re ? e.createElement("span", {
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
        title: Re
      }, Re) : null,
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
          ...Kt,
          flex: ze || Re ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      ze ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, ze) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...kt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Cr(!0)
      }, "展开"),
      // Escape hatch for the「already finished but the chat is still locked」
      // shape: the card can be settled while the agent's Future was never
      // actually resolved (orphaned record / cross-generation reload / race),
      // so the chat keeps answering 409 and the user has nothing left to
      // click.  This button therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
      u ? e.createElement("button", {
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
        onClick: Wr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: Xt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Qn, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Xn },
          rr(e),
          e.createElement("span", { style: Kt }, k)
        ),
        e.createElement(
          "span",
          { style: { ...Kn, color: pe ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          pe ? "已失效" : ue ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      ue && (Re || pe) ? e.createElement(
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
        String(Re || pe || "问卷已失效/跳过")
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
      }, ue ? it ? it + `

` + pn(h) : `已跳过本次问卷。

` + pn(h) : it || _ || y || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + pn(h)),
      ue && Mt ? e.createElement(
        "div",
        { style: Vt },
        e.createElement("button", {
          type: "button",
          style: kt,
          onClick: () => Cr(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Vt, marginTop: 8, gap: 10 } },
        ze ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, ze) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        u ? e.createElement("button", {
          type: "button",
          disabled: H,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...kt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Wr
        }, "释放阻塞") : null
      )
    );
  }
  const rs = ye && L === bt, ss = !b && !xe && Ro >= 0 && Wt.current[Q] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, os = Object.keys(Wt.current).map((l) => Number(l)).filter((l) => Wt.current[l] && Number.isFinite(l)).sort((l, u) => l - u), sa = xe && os.length ? e.createElement("div", {
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
  }, "⚠ 第 " + os.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let en = null;
  if (xe)
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Vn }, "其他意见（可选）"),
      sa,
      e.createElement(o, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: at,
        style: Xr,
        onChange: (l) => uo(l.target.value),
        onPaste: (l) => Jn(l, "final", "final")
      }),
      dr({
        R: e,
        files: ct,
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("final", "final"),
        onRemove: (l) => Ar((u) => u.filter((g, p) => p !== l))
      })
    );
  else if (fe && re(fe) === "text")
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Vn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      ss,
      e.createElement(o, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof F.value == "string" ? F.value : "",
        style: Xr,
        onChange: (l) => st({ ...F, value: l.target.value, other: "" }),
        onPaste: (l) => Jn(l, "q", rt)
      }),
      dr({
        R: e,
        files: F.attachments || [],
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("q", rt),
        onRemove: (l) => st({
          ...F,
          attachments: (F.attachments || []).filter((u, g) => g !== l)
        })
      })
    );
  else if (fe) {
    const l = ys(fe), u = xs(Dt, Q), g = l.length ? l : u ? [u] : l, p = (fe.options || []).map((w, q) => ns(
      _e(w),
      Kr(w),
      () => Yr(w),
      "o" + q,
      ci(fe, w, g),
      q + 1
    ));
    p.push(ns("其他", Vr, () => Yr(le), "other")), Vr && (p.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: F.other,
      style: { ...Vo, marginTop: 2 },
      onChange: (w) => st({ ...F, other: w.target.value }),
      onPaste: (w) => Jn(w, "q", rt)
    })), p.push(dr({
      R: e,
      files: F.attachments || [],
      disabled: b || H,
      uploading: Fn,
      error: Hn,
      onPick: () => Un("q", rt),
      onRemove: (w) => st({
        ...F,
        attachments: (F.attachments || []).filter((q, E) => E !== w)
      })
    }))), en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Vn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      ss,
      e.createElement("div", { style: { ...Xo, marginTop: 8 } }, p)
    );
  }
  const er = De + 1, oa = xe ? er + "/" + er : I + 1 + "/" + er, wt = {
    ...Yt,
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
    { style: Xt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Qn, className: "qm-header" },
      e.createElement(
        "div",
        { style: Xn },
        rr(e),
        e.createElement("span", { style: Kt, className: "qm-title" }, k)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        Bi({
          R: e,
          providers: bo,
          modelId: Nr,
          disabled: b || H,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: vo,
          onOpenChange: So,
          tab: _o,
          onTabChange: qo,
          onChange: (l) => {
            Jt({ modelId: l }), Ve(null), Ne.current = {}, qe.current = {}, et((u) => u + 1);
          }
        }),
        ji({
          R: e,
          templates: $r,
          value: Le,
          open: To,
          onOpenChange: Ao,
          disabled: b || H,
          onSelect: jr,
          onManage: () => Mr(!0)
        }),
        Li({
          R: e,
          mode: Z,
          disabled: b || H,
          onChange: (l) => {
            Jt({ mode: l }), l === "ai" && (qe.current = {}), l === "ai" || l === "recommend" ? (Ht.current = {}, je.current = {}, tt.current = !1, et((u) => u + 1)) : nt();
          }
        }),
        Di({
          R: e,
          busy: Or,
          result: Dt,
          error: xo,
          mode: Z,
          disabled: b || H,
          open: ko,
          onOpenChange: wo,
          onRun: () => {
            Dn("manual");
          },
          onRerun: Po,
          onApply: Wo,
          onCancel: Do,
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
                checked: Nn,
                onChange: (l) => Jt({ withContext: !!l.target.checked })
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
                checked: $n,
                onChange: (l) => Jt({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (Z === "ai" || Z === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: H,
          onClick: Fo,
          style: {
            ...wt,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...we ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: we ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, we ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Kn, key: "qm-step" }, oa)
      )
    ),
    e.createElement("div", { style: Gr }, en),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Pi({
      R: e,
      open: Co,
      templates: $r,
      value: Le,
      edit: Io,
      onEditChange: jn,
      onClose: () => {
        Mr(!1), jn(null);
      },
      onSelect: (l) => jr(l),
      onSave: Lo,
      onDelete: jo
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
    (rs || Ir && !v) && !b ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": ye ? i : void 0,
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
        (rs ? "⚠️ 本题已超过 " + Uo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (v ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: {
          ...wt,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Fr,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    $e && !b ? e.createElement("div", {
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
      "data-qm-bundle": ms
    }, $e) : null,
    e.createElement(
      "div",
      { style: Vt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: I === 0 || H,
        style: { ...wt, marginRight: "auto", opacity: I === 0 ? 0.5 : 1 },
        onClick: () => R((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: H,
          style: wt,
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
          onClick: xe ? () => Qt(void 0, !0) : Jr() ? () => Qt(void 0, !0) : Go
        },
        xe || Jr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: wt,
        onClick: Qo
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: Ko,
        onClick: Zo
      }, xe ? "提交" : "下一步")
    )
  );
}
const _s = 12;
let qs = 0;
const d = {
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
  notifyLog: {}
};
let Ct = null;
function Y(r, e, t) {
  if (r in d.draft) return d.draft[r];
  if (t === "global") {
    const o = d.cfg && d.cfg.globalConfig || d.globalCfg;
    return o && r in o ? o[r] : e;
  }
  const n = d.cfg && d.cfg.config, s = d.cfg && d.cfg.sessionConfig;
  if (s) {
    if (r in s) return s[r];
    const o = d.cfg && d.cfg.globalConfig || d.globalCfg;
    return o && r in o ? o[r] : e;
  }
  return n && r in n && d.cfg && d.cfg.has_session === !0 ? n[r] : (n && r in n && !(d.cfg && d.cfg.has_session), e);
}
function Wi(r) {
  const e = d.cfg && d.cfg.config;
  if (!e) return !1;
  const t = e.__sources__, n = e[r];
  return !!(t && t[r] === "session" && (n === "" || n === null));
}
function ae(r, e) {
  let t;
  const n = d.cfg;
  if (d.scope === "global") {
    const s = n && n.globalConfig || d.globalCfg || {};
    t = r in s ? s[r] : void 0;
  } else {
    const s = n && n.sessionConfig;
    if (s)
      if (r in s)
        t = s[r];
      else {
        const o = n && n.globalConfig || d.globalCfg || {};
        t = r in o ? o[r] : void 0;
      }
    else {
      const o = n && n.config;
      t = o && r in o ? o[r] : void 0;
    }
  }
  t === e ? delete d.draft[r] : d.draft[r] = e, d.saveMsg = "", B();
}
function Es() {
  return Object.keys(d.draft).length;
}
async function Er() {
  try {
    const r = await fetch(N("/question-modal/prefs"), { headers: O() });
    if (!r.ok) return;
    const e = await r.json(), t = e && e.prefs || {};
    d.globalCfg = t && typeof t == "object" ? t : {};
    try {
      B();
    } catch {
    }
  } catch {
  }
}
async function oo() {
  try {
    const r = await fetch(N("/question-modal/notify/channels"), {
      headers: O()
    });
    if (!r.ok) return;
    const e = await r.json();
    d.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], d.notifyCurrent = String(e && e.effective || "off");
    try {
      B();
    } catch {
    }
  } catch {
  }
}
async function Tr(r) {
  if (!(!r || r === "off"))
    try {
      const e = await fetch(
        N("/question-modal/notify/test-log?channel=" + encodeURIComponent(r)),
        { headers: O() }
      );
      if (!e.ok) return;
      const t = await e.json();
      d.notifyLog = {
        ...d.notifyLog,
        [r]: Array.isArray(t && t.items) ? t.items : []
      };
      try {
        B();
      } catch {
      }
    } catch {
    }
}
async function Hi(r) {
  if (!r || r === "off") return;
  d.notifyTesting = r, d.notifyMsg = { ...d.notifyMsg, [r]: "发送中…" };
  try {
    B();
  } catch {
  }
  let e = "", t = null;
  try {
    t = await (await fetch(N("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...O(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: r })
    })).json().catch(() => ({})), t && t.delivered ? e = t.note ? "✓ 已发送（" + t.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (t && (t.error || t.reason) || "测试失败");
  } catch (s) {
    e = "✗ 请求失败：" + String(s && s.message || s);
  }
  d.notifyTesting = "", d.notifyMsg = { ...d.notifyMsg, [r]: e };
  const n = t && Array.isArray(t.history) ? t.history : null;
  n && (d.notifyLog = { ...d.notifyLog, [r]: n }), await oo(), n || await Tr(r);
  try {
    B();
  } catch {
  }
}
async function Ui() {
  if (d.saving) return;
  const r = Object.keys(d.draft), e = d.scope === "session", t = {};
  if (r.forEach((n) => {
    t[n] = d.draft[n];
  }), !r.length && !e) {
    const n = d.globalCfg || {};
    Object.keys(n).forEach((s) => {
      s in t || (t[s] = n[s]);
    });
  }
  r.length, d.saving = !0, d.saveMsg = "", B();
  try {
    let n = "/question-modal/prefs", s = t;
    e && (n = "/question-modal/session-prefs", s = {
      chat_id: d.chatId,
      session_id: d.sessionId,
      agent_id: d.agentId,
      settings: t,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: d.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const o = await fetch(N(n), {
      method: "POST",
      headers: O(),
      body: JSON.stringify(s)
    }), a = await o.json().catch(() => ({}));
    if (!o.ok) {
      d.saving = !1, d.saveMsg = a && a.detail ? String(a.detail) : "保存失败（" + o.status + "）", B();
      return;
    }
    d.saving = !1, d.draft = {}, Gs();
    const c = Array.isArray(a && a.conflicts) ? a.conflicts : [];
    if (d.conflictNote = "", c.length) {
      const y = (m) => {
        try {
          const b = new Date(m * 1e3), T = (_) => _ < 10 ? "0" + _ : String(_);
          return b.getMonth() + 1 + "-" + T(b.getDate()) + " " + T(b.getHours()) + ":" + T(b.getMinutes()) + ":" + T(b.getSeconds());
        } catch {
          return "";
        }
      }, h = c.reduce(
        (m, b) => Math.max(m, Number(b && b.at) || 0),
        0
      ), k = c.map((m) => String(m && m.key || "")).filter(Boolean);
      d.conflictNote = "设置已于 " + y(h) + " 被其它位置修改，本次已按后写入的值覆盖" + (k.length ? "（" + k.join("、") + "）" : "") + "。";
    }
    try {
      const y = a && a.key_ts || {};
      y && typeof y == "object" && (d.keyTs = Object.assign({}, d.keyTs, y));
    } catch {
    }
    e || Er();
    const x = ["session", "default"].indexOf(String(d.tab)) >= 0;
    let f = "";
    if (x && (f = e ? "session" : "default"), f === "default") {
      try {
        const y = await fetch(N("/question-modal/session-prefs"), {
          method: "POST",
          headers: O(),
          body: JSON.stringify({
            chat_id: d.chatId || "",
            session_id: d.sessionId || "",
            agent_id: d.agentId || "",
            // 2026-11-13 方案 D1（用户裁定）：切到默认模式**只打标记**，
            // 不删本会话的自定义项 —— 这样切回会话模式时数据原样恢复。
            //
            // 旧做法是 settings:{}（= 清空整条覆盖），实测会把会话里设过的
            // 模型/模板/上下文一起删掉，切回来只拿到全局值的副本。
            settings: {},
            set_scope: "default"
          })
        });
        y.ok || (d.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + y.status + "），本会话仍在会话模式。", f = "");
      } catch (y) {
        d.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (y && y.message ? y.message : y) + "，本会话仍在会话模式。", f = "";
      }
      d.keyTs = {};
    }
    if (f && (d.scopeChoice = f, d.tab = f, d.scope = f === "session" ? "session" : "global"), f === "default")
      d.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (f === "session")
      d.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const y = String(d.tab) === "prompt" ? "提示词模板" : "全局配置";
      d.saveMsg = "已保存" + y + "；运行模式未变" + (d.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    hn(
      d.chatId,
      !0,
      d.sessionId,
      d.agentId
    ).then((y) => {
      y && (d.cfg = y);
      try {
        B();
      } catch {
      }
    }).catch(() => {
    });
  } catch (n) {
    d.saving = !1, d.saveMsg = "保存请求失败：" + (n && n.message ? n.message : n);
  }
  try {
    B();
  } catch {
  }
}
function ao() {
  d.draft = {}, d.saveMsg = "";
}
function io() {
  _r().then((r) => {
    d.templates = (r && r.items || []).filter((e) => e && e.id), d.templateOptions = d.templates.map((e) => e.id);
    try {
      B();
    } catch {
    }
  }).catch(() => {
  });
}
function Ji() {
  d.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, d.saveMsg = "", B();
}
function Gi(r) {
  const e = d.templates.filter((t) => t.id === r)[0];
  e && (d.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, d.saveMsg = "", B());
}
function Ts(r, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([r + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  d.tplEdit && (d.tplEdit[r] = e, B());
}
function Zi() {
  d.tplEdit = null, B();
}
async function Qi() {
  const r = d.tplEdit;
  if (!r || d.tplBusy) return;
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
    d.saveMsg = "模板名称不能为空", B();
    return;
  }
  d.tplBusy = !0, B();
  const t = {
    id: r.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: r.system_prompt,
    user: r.user_prompt
  }, n = await Zs(t);
  if (d.tplBusy = !1, n && n.ok === !1) {
    d.saveMsg = String(n.error || n.detail || "保存失败"), B();
    return;
  }
  d.tplEdit = null, d.saveMsg = r.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", io(), B();
}
async function Xi(r) {
  const e = d.templates.filter((s) => s.id === r)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || r) + "」？") : !1)) return;
  const n = await Qs(r);
  if (n && n.ok === !1) {
    d.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）"), B();
    return;
  }
  d.saveMsg = "模板已删除", io(), B();
}
function Ki() {
  d.visible = !0, d.chatId = "", d.sessionId = _n(), d.cfg = null, d.cfgError = "", Vi(), d.agentId = Sn || (() => {
    try {
      return be().getSelectedAgentId ? be().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Gs();
  const r = ++qs;
  d.scopeChoice = "", d.tab = "", d.scope = "global", d.draft = {}, d.saveMsg = "", d.conflictNote = "", B(), lo(() => {
    if (r !== qs) return;
    const t = !!(d.cfg && d.cfg.has_session) ? "session" : "default";
    d.scopeChoice = t, d.tab = t === "session" ? "session" : "default", d.scope = t === "session" ? "session" : "global", d.draft = {}, d.saveMsg = "", d.keyTs = Object.assign(
      {},
      d.cfg && d.cfg.keyTs || {}
    ), d.conflictNote = "", B(), (d.tab === "global" || d.tab === "default") && Er(), oo().then(() => {
      const n = String(d.notifyCurrent || "off");
      n && n !== "off" && Tr(n);
    });
  });
}
let an = !1;
function Vi() {
  an || (an = !0, Promise.all([Xs(), _r()]).then((r) => {
    an = !1;
    const e = r[0] || [], t = r[1] || {};
    d.providerGroups = e.map((n) => {
      const s = String(n && (n.id || n.provider_id) || ""), a = (n && n.models || []).concat(n && n.extra_models || []).filter(Boolean).map((c) => {
        const i = typeof c == "string" ? c : c && (c.name || c.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: s,
        name: String(n && (n.name || n.title) || s),
        models: a
      };
    }).filter((n) => n.id && n.models.length > 0), d.modelOptions = d.providerGroups.flatMap((n) => n.models.map((s) => n.id + ":" + s)), d.templates = (t.items || []).filter((n) => n && n.id), d.templateOptions = d.templates.map((n) => n.id);
    try {
      B();
    } catch {
    }
  }).catch(() => {
    an = !1;
  }));
}
function Yi(r) {
  const e = String(r || ""), t = e.indexOf(":");
  return t <= 0 ? { provider: "", model: e } : { provider: e.slice(0, t), model: e.slice(t + 1) };
}
let ur = !1, ln = "";
const pr = [];
function lo(r) {
  const e = d.chatId, t = (e || "") + "|" + (d.sessionId || "");
  if (ur && ln === t) {
    r && pr.push(r);
    return;
  }
  ur = !0, ln = t;
  const n = () => {
    ln === t && (ur = !1, ln = "");
    const s = pr.splice(0);
    try {
      s.forEach((o) => o());
    } catch {
    }
  };
  r && pr.push(r), hn(
    e,
    !0,
    d.sessionId,
    d.agentId
  ).then((s) => {
    if (d.chatId !== e) {
      n();
      return;
    }
    s ? (d.cfg = s, d.cfgError = "") : (d.cfgError = "读取配置失败（后端不可达）", d.tab || (d.tab = "default", d.scopeChoice = "default", d.scope = "global")), n();
    try {
      B();
    } catch {
    }
  }).catch(() => {
    d.tab || (d.tab = "default", d.scopeChoice = "default", d.scope = "global", d.cfgError = "读取配置失败（网络异常）"), n();
    try {
      B();
    } catch {
    }
  });
}
function B() {
  const r = be().React, e = be().ReactDOM;
  if (r) {
    if (!e || typeof e.render != "function") {
      if (d.visible) {
        try {
          const t = Ce();
          t && t.Modal && typeof t.Modal.info == "function" && t.Modal.info({
            title: "问卷设置",
            centered: !0,
            width: 480,
            okText: "关闭",
            content: "这里将用于配置问卷的行为与偏好。当前仅完成入口与窗口外壳，尚未接入任何设置项。"
          });
        } catch {
        }
        d.visible = !1;
      }
      return;
    }
    Ct || (Ct = document.createElement("div"), Ct.id = "qm-settings-root", document.body.appendChild(Ct)), e.render(r.createElement(ol, {
      R: r,
      open: d.visible,
      onClose: () => {
        if (Es() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          ao();
        }
        d.visible = !1, d.saveMsg = "", B();
      },
      tab: d.tab,
      onTabChange: (t) => {
        d.tab = t, (t === "session" || t === "default") && (d.scopeChoice = t), d.scope = co(t) ? "session" : "global", d.saveMsg = "", d.draft = {}, B(), lo(), (t === "global" || t === "default") && Er();
      },
      scope: d.scope,
      scopeChoice: d.scopeChoice,
      sessData: d.sessData,
      cfg: d.cfg,
      cfgError: d.cfgError,
      chatId: d.chatId,
      dirtyCount: Es(),
      saving: d.saving,
      saveMsg: d.saveMsg,
      conflictNote: d.conflictNote,
      modelOptions: d.modelOptions,
      templateOptions: d.templateOptions,
      providerGroups: d.providerGroups,
      templates: d.templates,
      tplEdit: d.tplEdit,
      tplBusy: d.tplBusy
    }), Ct);
  }
}
function el(r) {
  const { R: e, onOpen: t } = r, n = Ce(), s = n && n.Button, o = "问卷设置", a = { fontSize: 12, padding: "2px 6px", height: 28 }, c = { title: o, "aria-label": o };
  let i = null;
  try {
    const x = Fs(), f = Ws.concat(["SettingOutlined"]);
    for (const y of f) {
      const h = x[y];
      if (h) {
        i = e.createElement(h, { style: { fontSize: 12 } });
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
const fr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" }
], co = (r) => r === "session";
function tl(r, e, t) {
  return t !== "readonly" ? null : r.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function nl(r, e) {
  return e === "readonly" ? !0 : r === "session" && e === "global";
}
function rl(r, e) {
  const t = d.notifyChannels || [], n = String(d.notifyCurrent || "off"), s = String(Y("notify_channel", "off", "global") || n || "off"), a = ((_) => t.filter((S) => String(S.channel) === _)[0])(s), c = t.map((_) => {
    const S = String(_.channel || ""), v = String(_.label || S), C = _.ready !== !1, I = _.verified === !0 || S === "off";
    let R = "";
    return C ? I || (R = "（待测试）") : R = "（不可用）", { value: S, label: v + R, disabled: !C };
  });
  c.length || c.push({ value: "off", label: "关闭", disabled: !1 });
  const i = !a || a.ready !== !1, x = s !== "off" && s !== "browser", f = d.notifyTesting === s, y = a && a.last_test || null, h = d.notifyMsg[s] || "", k = [
    r.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: s,
      "data-qm-notify-select": "1",
      style: { flex: "0 0 auto" },
      onChange: (_) => {
        const S = _ && _.target ? String(_.target.value) : "off";
        ae("notify_channel", S), Tr(S);
      }
    }, c.map((_, S) => r.createElement("option", {
      key: "o" + S,
      value: _.value,
      disabled: !!_.disabled
    }, _.label)))
  ];
  x && i && k.push(r.createElement("button", {
    key: "test",
    type: "button",
    disabled: f,
    "data-qm-notify-test": s,
    onClick: (_) => {
      _ && _.stopPropagation && _.stopPropagation(), Hi(s);
    },
    style: {
      marginLeft: 8,
      padding: "2px 10px",
      fontSize: 12,
      border: "1px solid #d9d9d9",
      borderRadius: 4,
      background: "#fff",
      cursor: f ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, f ? "发送中…" : "测试")), a && a.ready === !1 && a.reason && k.push(r.createElement("span", {
    key: "rs",
    style: { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
  }, a.reason));
  const m = !!(a && a.verified === !0), b = y || h, T = !!h;
  if (b || x && i && !f) {
    const _ = y ? y.delivered === !0 : T ? h.indexOf("✓") === 0 : !1;
    let S;
    T ? S = h : y ? S = _ ? "✓ 上次测试成功" + (y.note ? "（" + y.note + "）" : "") : "✗ " + (y.error || y.note || "上次测试失败") : S = "未测试";
    const v = y && y.at_text ? "  ·  " + y.at_text : "", C = b ? _ ? "#52c41a" : "#ff4d4f" : "#faad14";
    k.push(r.createElement("span", {
      key: "res",
      "data-qm-notify-result": b ? _ ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": b && (_ || m) ? "1" : "0",
      style: {
        flex: "1 1 240px",
        minWidth: 0,
        fontSize: 11,
        lineHeight: "16px",
        color: C,
        // 允许在任意位置断行：失败原因里有很长的中文句子与 URL 形态内容，
        // 不让它撑破容器（也不要 pre-wrap，那会拒绝折行）。
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }
    }, S + v));
  }
  return ne(
    r,
    "e5",
    "人工模式提醒频道",
    r.createElement("div", {
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
    }, k),
    "弹问卷时提醒一次（仅人工模式）。频道须先「测试」通过才会真正发送；测试结果会保留，可随时重测。",
    "global",
    e,
    !1,
    !0
  );
}
function ne(r, e, t, n, s, o, a, c, i) {
  const x = o || "global", f = nl(a || "global", x), y = [
    r.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      r.createElement("span", { key: "tt" }, t),
      tl(r, "sc", x),
      f && x === "global" ? r.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? r.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], h = [
    r.createElement("div", { className: "qm-set-rowlabel", key: "l" }, y),
    r.createElement("div", {
      className: "qm-set-rowctl" + (c ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, n)
  ];
  return r.createElement("div", {
    className: "qm-set-row" + (f ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": f ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, h);
}
function As(r, e, t, n, s) {
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
function cn(r, e, t, n) {
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
function Ue(r, e, t, n, s) {
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
function Cs(r, e, t, n, s) {
  const o = Yi(t), c = n.map((k) => k.id).indexOf(o.provider) >= 0 ? o.provider : "", i = c ? (n.filter((k) => k.id === c)[0] || { models: [] }).models : [], x = i.indexOf(o.model) >= 0 ? o.model : "", f = (k, m) => {
    s && s(k ? k + ":" + m : "");
  }, y = r.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: c,
    disabled: !s,
    title: "厂商",
    onChange: (k) => {
      const m = k && k.target ? k.target.value : "", b = m ? (n.filter((T) => T.id === m)[0] || { models: [] }).models : [];
      f(m, m && b[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [r.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(n.map((k, m) => r.createElement(
    "option",
    { key: "g" + m, value: k.id },
    k.name === k.id ? k.id : k.name + "（" + k.models.length + "）"
  )))), h = r.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: x,
    disabled: !s || !c,
    title: c ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const m = k && k.target ? k.target.value : "";
      f(c, m);
    }
  }, c ? i.map((k, m) => r.createElement("option", { key: "m" + m, value: k }, k)) : [r.createElement("option", { key: "m0", value: "" }, "—")]);
  return r.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    y,
    r.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    h
  ]);
}
function sl(r, e, t, n, s) {
  const o = [], a = t === "session" ? "session" : "global", c = {
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
  }, f = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, y = {
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
  }, k = s && s.templateOptions || [];
  s && s.modelOptions;
  const m = s && s.providerGroups || [], b = k.map((T) => {
    const _ = d.templates.filter((S) => String(S.id) === String(T))[0];
    return { value: T, label: _ && (_.name || _.id) || T };
  });
  if (e === "session") {
    const _ = String(Y("mode", "manual")) !== "recommend";
    if (o.push(ne(
      r,
      "s1",
      "答题模式",
      As(
        r,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(Y("mode", "manual"))] || "人工",
        (S) => ae("mode", c[S] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      a
    )), _) {
      o.push(ne(
        r,
        "s2",
        "默认模型",
        Cs(
          r,
          "sel2",
          String(Y("model_id", "")),
          m,
          (v) => ae("model_id", v)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        Wi("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        a,
        !0
      ));
      const S = String(Y("template_id", "")) || b[0] && b[0].value || "";
      o.push(ne(
        r,
        "s3",
        "提示词模板",
        b.length ? Ue(
          r,
          "sel3",
          S,
          b,
          (v) => ae("template_id", v)
        ) : Ue(r, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        a
      )), o.push(ne(
        r,
        "s4",
        "携带上下文",
        cn(
          r,
          "s4sw",
          !!Y("with_context", !1),
          (v) => ae("with_context", v)
        ),
        "附带上次决策与会话历史",
        "session",
        a
      )), o.push(ne(
        r,
        "s5",
        "并行分析各题",
        cn(
          r,
          "s5sw",
          !!Y("parallel", !1),
          (v) => ae("parallel", v)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        a
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const S = String(Y("mode", "manual", "global")) !== "recommend";
      o.push(ne(
        r,
        "a1",
        "默认答题模式",
        As(
          r,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(Y("mode", "manual", "global"))] || "人工",
          (v) => ae("mode", c[v] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        a
      )), S && (o.push(ne(
        r,
        "b1",
        "默认模型",
        Cs(
          r,
          "sel2",
          String(Y("model_id", "", "global")),
          m,
          (v) => ae("model_id", v)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        a,
        !0
      )), o.push(ne(
        r,
        "b2",
        "提示词模板",
        b.length ? Ue(
          r,
          "sel3",
          String(Y("template_id", "", "global")) || b[0].value,
          b,
          (v) => ae("template_id", v)
        ) : Ue(r, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        a
      )), o.push(ne(
        r,
        "b3",
        "携带上下文",
        cn(
          r,
          "s3",
          !!Y("with_context", !1, "global"),
          (v) => ae("with_context", v)
        ),
        "附带上次决策与会话历史",
        "both",
        a
      )), o.push(ne(
        r,
        "b4",
        "并行分析各题",
        cn(
          r,
          "s4",
          !!Y("parallel", !1, "global"),
          (v) => ae("parallel", v)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        a
      )));
    } else {
      o.push(rl(r, a)), o.push(ne(
        r,
        "e6",
        "单题分析超时",
        Ue(
          r,
          "sel4",
          f[Number(Y("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (I) => ae("model_timeout_sec", x[I] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        a
      )), o.push(ne(
        r,
        "d4",
        "等待提示阈值",
        Ue(
          r,
          "sel5",
          h[Number(Y("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (I) => ae("wait_hint_sec", y[I] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        a
      ));
      const _ = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], S = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, v = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, C = Number(Y("gate_log_limit", 200, "global"));
      o.push(ne(
        r,
        "d5",
        "拦截记录",
        Ue(
          r,
          "sel6",
          v[C] || "最近 200 条（默认）",
          _,
          (I) => ae("gate_log_limit", S[I] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        a
      ));
    }
  else if (e === "prompt") {
    const T = d.templates, _ = d.tplEdit;
    if (o.push(ne(
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
      T.map((S, v) => {
        const C = !!S.builtin, R = (String(S.note || S.desc || "").trim() || String(S.system || S.system_prompt || S.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), A = R.length > 90 ? R.slice(0, 90) + "…" : R;
        return r.createElement("div", { className: "qm-set-item", key: "i" + v }, [
          r.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            r.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(S.name || S.id)
            ),
            r.createElement("span", {
              className: "qm-set-tag" + (C ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, C ? "内置" : "自定义"),
            r.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(S.id),
              onClick: () => {
                Gi(String(S.id));
              }
            }, "编辑"),
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (C ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(S.id),
              disabled: C,
              title: C ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                C || Xi(String(S.id));
              }
            }, "删除")
          ]),
          r.createElement("div", { className: "qm-set-itemdesc", key: "d" }, A)
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
          Ji();
        }
      }, "＋ 新建模板")
    ])), _) {
      const S = (v, C, I, R, A) => {
        var D, L;
        return r.createElement("div", { className: "qm-set-field", key: "f-" + C }, [
          r.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, v),
          I ? r.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: R,
            "data-qm-tpl-field": C,
            placeholder: A,
            value: String(((D = d.tplEdit) == null ? void 0 : D[C]) || ""),
            onChange: (U) => Ts(C, U && U.target ? U.target.value : "")
          }) : r.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": C,
            placeholder: A,
            value: String(((L = d.tplEdit) == null ? void 0 : L[C]) || ""),
            onChange: (U) => Ts(C, U && U.target ? U.target.value : "")
          })
        ]);
      };
      o.push(r.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (_.id || "new")
      }, [
        r.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          _.id ? "编辑模板：" + (_.name || _.id) : "新建模板"
        ),
        S("模板名称", "name", !1, 0, "如：简短结论版"),
        S(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        S(
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
            disabled: !!d.tplBusy,
            onClick: () => {
              Qi();
            }
          }, d.tplBusy ? "保存中…" : "保存"),
          r.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Zi();
            }
          }, "取消")
        ])
      ]));
    }
  }
  return r.createElement("div", { className: "qm-set-tabbody", key: "tb" }, o);
}
function ol(r) {
  const { R: e, open: t, onClose: n } = r;
  if (!t) return null;
  const s = Ce(), o = s && s.Modal, a = !r.tab, c = r.tab || "", i = co(c) ? "session" : "global", x = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    fr.map((G) => e.createElement("button", {
      key: G.key,
      type: "button",
      className: "qm-set-tab" + (!a && G.key === c ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          r.onTabChange && r.onTabChange(G.key);
        } catch {
        }
      }
    }, G.label))
  ), f = fr.filter((G) => G.key === c)[0] || fr[0], y = !!(r.cfg && r.cfg.has_session), h = y ? "session" : "default", k = y ? "会话模式" : "默认模式", m = e.createElement("div", { className: "qm-set-head", key: "h" }, [
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
        "data-qm-runtime": h,
        "data-qm-scope-badge": h
      }, k)
    ])
  ]), b = f.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, f.hint) : null, T = null, _ = a ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((G) => e.createElement("div", {
    key: "sk" + G,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: G * 0.15 + "s"
    }
  }))) : null, S = a ? _ : sl(e, c, i, r.sessData, {
    modelOptions: r.modelOptions,
    templateOptions: r.templateOptions,
    providerGroups: r.providerGroups
  }), v = r.dirtyCount || 0, C = String(r.tab || ""), I = C === "session" || C === "default";
  let R;
  I ? R = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : R = C === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const A = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      v ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + v + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, R)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      e.createElement("button", {
        key: "cancel",
        type: "button",
        className: "qm-set-btn",
        "data-qm-cancel": "1",
        disabled: !v || !!r.saving,
        onClick: () => {
          ao(), B();
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
          Ui();
        }
      }, r.saving ? "保存中…" : "保存")
    ])
  ]), D = r.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, r.saveMsg) : null, L = r.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, r.conflictNote) : null, U = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    T,
    b,
    S,
    D,
    L
  ]), ye = e.createElement("div", { className: "qm-set-wrap" }, [
    m,
    x,
    U,
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
    // 小屏适配（2026-11-13 用户反馈）：固定 680 在窄屏会贴边/溢出。
    // min() 让宽度随视口收缩，92vw 两侧各留 4% 呼吸位。
    width: "min(680px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-set-modal"
  }, ye) : e.createElement("div", {
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
    ye
  ]);
}
function al(r) {
  try {
    const e = r && r.sender, t = be().React;
    if (!t) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const n = t.createElement(el, {
      R: t,
      onOpen: () => {
        Ki();
      }
    });
    e.addPrefix(Ds, n, {
      id: "question-modal.settings-btn",
      order: _s
    }), console.log("[question-modal] settings entry registered (order " + _s + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function il() {
  const r = Ha();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return Ua(), r.toolRender(Ds, fs, Fi), console.log("[question-modal] registered via chat.toolRender for", fs), al(r), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!il()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
