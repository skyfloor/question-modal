var ao = Object.defineProperty;
var is = (n) => {
  throw TypeError(n);
};
var oo = (n, e, t) => e in n ? ao(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var F = (n, e, t) => oo(n, typeof e != "symbol" ? e + "" : e, t), io = (n, e, t) => e.has(n) || is("Cannot " + t);
var ls = (n, e, t) => e.has(n) ? is("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(n) : e.set(n, t);
var tn = (n, e, t) => (io(n, e, "access private method"), t);
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
function zs(n) {
  Ze = n;
}
const Ns = /[&<>"']/, lo = new RegExp(Ns.source, "g"), Os = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, co = new RegExp(Os.source, "g"), po = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, cs = (n) => po[n];
function de(n, e) {
  if (e) {
    if (Ns.test(n))
      return n.replace(lo, cs);
  } else if (Os.test(n))
    return n.replace(co, cs);
  return n;
}
const uo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function fo(n) {
  return n.replace(uo, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const mo = /(^|[^\[])\^/g;
function j(n, e) {
  let t = typeof n == "string" ? n : n.source;
  e = e || "";
  const r = {
    replace: (s, a) => {
      let o = typeof a == "string" ? a : a.source;
      return o = o.replace(mo, "$1"), t = t.replace(s, o), r;
    },
    getRegex: () => new RegExp(t, e)
  };
  return r;
}
function ds(n) {
  try {
    n = encodeURI(n).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return n;
}
const zt = { exec: () => null };
function ps(n, e) {
  const t = n.replace(/\|/g, (a, o, d) => {
    let i = !1, y = o;
    for (; --y >= 0 && d[y] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), r = t.split(/ \|/);
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
function nn(n, e, t) {
  const r = n.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r && n.charAt(r - s - 1) === e; )
    s++;
  return n.slice(0, r - s);
}
function go(n, e) {
  if (n.indexOf(e[1]) === -1)
    return -1;
  let t = 0;
  for (let r = 0; r < n.length; r++)
    if (n[r] === "\\")
      r++;
    else if (n[r] === e[0])
      t++;
    else if (n[r] === e[1] && (t--, t < 0))
      return r;
  return -1;
}
function us(n, e, t, r) {
  const s = e.href, a = e.title ? de(e.title) : null, o = n[1].replace(/\\([\[\]])/g, "$1");
  if (n[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const d = {
      type: "link",
      raw: t,
      href: s,
      title: a,
      text: o,
      tokens: r.inlineTokens(o)
    };
    return r.state.inLink = !1, d;
  }
  return {
    type: "image",
    raw: t,
    href: s,
    title: a,
    text: de(o)
  };
}
function ho(n, e) {
  const t = n.match(/^(\s+)(?:```)/);
  if (t === null)
    return e;
  const r = t[1];
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
class fn {
  // set by the lexer
  constructor(e) {
    F(this, "options");
    F(this, "rules");
    // set by the lexer
    F(this, "lexer");
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
      const r = t[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? r : nn(r, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const r = t[0], s = ho(r, t[3] || "");
      return {
        type: "code",
        raw: r,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: s
      };
    }
  }
  heading(e) {
    const t = this.rules.block.heading.exec(e);
    if (t) {
      let r = t[2].trim();
      if (/#$/.test(r)) {
        const s = nn(r, "#");
        (this.options.pedantic || !s || / $/.test(s)) && (r = s.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: r,
        tokens: this.lexer.inline(r)
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
      let r = t[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`);
      r = nn(r.replace(/^ *>[ \t]?/gm, ""), `
`);
      const s = this.lexer.state.top;
      this.lexer.state.top = !0;
      const a = this.lexer.blockTokens(r);
      return this.lexer.state.top = s, {
        type: "blockquote",
        raw: t[0],
        tokens: a,
        text: r
      };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let r = t[1].trim();
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
      let d = "", i = "", y = !1;
      for (; e; ) {
        let f = !1;
        if (!(t = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = t[0], e = e.substring(d.length);
        let x = t[2].split(`
`, 1)[0].replace(/^\t+/, (_) => " ".repeat(3 * _.length)), h = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = x.trimStart()) : (k = t[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = x.slice(k), k += t[1].length);
        let m = !1;
        if (!x && /^ *$/.test(h) && (d += h + `
`, e = e.substring(h.length + 1), f = !0), !f) {
          const _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), E = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), q = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), S = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const I = e.split(`
`, 1)[0];
            if (h = I, this.options.pedantic && (h = h.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), q.test(h) || S.test(h) || _.test(h) || E.test(e))
              break;
            if (h.search(/[^ ]/) >= k || !h.trim())
              i += `
` + h.slice(k);
            else {
              if (m || x.search(/[^ ]/) >= 4 || q.test(x) || S.test(x) || E.test(x))
                break;
              i += `
` + h;
            }
            !m && !h.trim() && (m = !0), d += I + `
`, e = e.substring(I.length + 1), x = h.slice(k);
          }
        }
        a.loose || (y ? a.loose = !0 : /\n *\n *$/.test(d) && (y = !0));
        let b = null, v;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (v = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), a.items.push({
          type: "list_item",
          raw: d,
          task: !!b,
          checked: v,
          loose: !1,
          text: i,
          tokens: []
        }), a.raw += d;
      }
      a.items[a.items.length - 1].raw = d.trimEnd(), a.items[a.items.length - 1].text = i.trimEnd(), a.raw = a.raw.trimEnd();
      for (let f = 0; f < a.items.length; f++)
        if (this.lexer.state.top = !1, a.items[f].tokens = this.lexer.blockTokens(a.items[f].text, []), !a.loose) {
          const x = a.items[f].tokens.filter((k) => k.type === "space"), h = x.length > 0 && x.some((k) => /\n.*\n/.test(k.raw));
          a.loose = h;
        }
      if (a.loose)
        for (let f = 0; f < a.items.length; f++)
          a.items[f].loose = !0;
      return a;
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
      const r = t[1].toLowerCase().replace(/\s+/g, " "), s = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", a = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: r,
        raw: t[0],
        href: s,
        title: a
      };
    }
  }
  table(e) {
    const t = this.rules.block.table.exec(e);
    if (!t || !/[:|]/.test(t[2]))
      return;
    const r = ps(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), a = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: t[0],
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
        o.rows.push(ps(d, o.header.length).map((i) => ({
          text: i,
          tokens: this.lexer.inline(i)
        })));
      return o;
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
      const r = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: r,
        tokens: this.lexer.inline(r)
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
      const r = t[2].trim();
      if (!this.options.pedantic && /^</.test(r)) {
        if (!/>$/.test(r))
          return;
        const o = nn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = go(t[2], "()");
        if (o > -1) {
          const i = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + o;
          t[2] = t[2].substring(0, o), t[0] = t[0].substring(0, i).trim(), t[3] = "";
        }
      }
      let s = t[2], a = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        o && (s = o[1], a = o[3]);
      } else
        a = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), us(t, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: a && a.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer);
    }
  }
  reflink(e, t) {
    let r;
    if ((r = this.rules.inline.reflink.exec(e)) || (r = this.rules.inline.nolink.exec(e))) {
      const s = (r[2] || r[1]).replace(/\s+/g, " "), a = t[s.toLowerCase()];
      if (!a) {
        const o = r[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return us(r, a, r[0], this.lexer);
    }
  }
  emStrong(e, t, r = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...s[0]].length - 1;
      let d, i, y = o, f = 0;
      const x = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (x.lastIndex = 0, t = t.slice(-1 * e.length + o); (s = x.exec(t)) != null; ) {
        if (d = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !d)
          continue;
        if (i = [...d].length, s[3] || s[4]) {
          y += i;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + i) % 3)) {
          f += i;
          continue;
        }
        if (y -= i, y > 0)
          continue;
        i = Math.min(i, i + y + f);
        const h = [...s[0]][0].length, k = e.slice(0, o + s.index + h + i);
        if (Math.min(o, i) % 2) {
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
      let r = t[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), a = /^ /.test(r) && / $/.test(r);
      return s && a && (r = r.substring(1, r.length - 1)), r = de(r, !0), {
        type: "codespan",
        raw: t[0],
        text: r
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
      let r, s;
      return t[2] === "@" ? (r = de(t[1]), s = "mailto:" + r) : (r = de(t[1]), s = r), {
        type: "link",
        raw: t[0],
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
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let s, a;
      if (t[2] === "@")
        s = de(t[0]), a = "mailto:" + s;
      else {
        let o;
        do
          o = t[0], t[0] = ((r = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== t[0]);
        s = de(t[0]), t[1] === "www." ? a = "http://" + t[0] : a = t[0];
      }
      return {
        type: "link",
        raw: t[0],
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
    const t = this.rules.inline.text.exec(e);
    if (t) {
      let r;
      return this.lexer.state.inRawBlock ? r = t[0] : r = de(t[0]), {
        type: "text",
        raw: t[0],
        text: r
      };
    }
  }
}
const bo = /^(?: *(?:\n|$))+/, yo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, xo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Rt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ko = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Rs = /(?:[*+-]|\d{1,9}[.)])/, $s = j(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Rs).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), br = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, wo = /^[^\n]+/, yr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, vo = j(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", yr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), qo = j(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Rs).getRegex(), vn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", xr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, _o = j("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", xr).replace("tag", vn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Ms = j(br).replace("hr", Rt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), So = j(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ms).getRegex(), kr = {
  blockquote: So,
  code: yo,
  def: vo,
  fences: xo,
  heading: ko,
  hr: Rt,
  html: _o,
  lheading: $s,
  list: qo,
  newline: bo,
  paragraph: Ms,
  table: zt,
  text: wo
}, fs = j("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Rt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), Eo = {
  ...kr,
  table: fs,
  paragraph: j(br).replace("hr", Rt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", fs).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex()
}, To = {
  ...kr,
  html: j(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", xr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: j(br).replace("hr", Rt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", $s).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Bs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ao = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ls = /^( {2,}|\\)\n(?!\s*$)/, Co = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, $t = "\\p{P}\\p{S}", Io = j(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, $t).getRegex(), zo = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, No = j(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, $t).getRegex(), Oo = j("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, $t).getRegex(), Ro = j("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, $t).getRegex(), $o = j(/\\([punct])/, "gu").replace(/punct/g, $t).getRegex(), Mo = j(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Bo = j(xr).replace("(?:-->|$)", "-->").getRegex(), Lo = j("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Bo).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, jo = j(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), js = j(/^!?\[(label)\]\[(ref)\]/).replace("label", mn).replace("ref", yr).getRegex(), Ps = j(/^!?\[(ref)\](?:\[\])?/).replace("ref", yr).getRegex(), Po = j("reflink|nolink(?!\\()", "g").replace("reflink", js).replace("nolink", Ps).getRegex(), wr = {
  _backpedal: zt,
  // only used for GFM url
  anyPunctuation: $o,
  autolink: Mo,
  blockSkip: zo,
  br: Ls,
  code: Ao,
  del: zt,
  emStrongLDelim: No,
  emStrongRDelimAst: Oo,
  emStrongRDelimUnd: Ro,
  escape: Bs,
  link: jo,
  nolink: Ps,
  punctuation: Io,
  reflink: js,
  reflinkSearch: Po,
  tag: Lo,
  text: Co,
  url: zt
}, Do = {
  ...wr,
  link: j(/^!?\[(label)\]\((.*?)\)/).replace("label", mn).getRegex(),
  reflink: j(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", mn).getRegex()
}, mr = {
  ...wr,
  escape: j(Bs).replace("])", "~|])").getRegex(),
  url: j(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Fo = {
  ...mr,
  br: j(Ls).replace("{2,}", "*").getRegex(),
  text: j(mr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rn = {
  normal: kr,
  gfm: Eo,
  pedantic: To
}, _t = {
  normal: wr,
  gfm: mr,
  breaks: Fo,
  pedantic: Do
};
class ve {
  constructor(e) {
    F(this, "tokens");
    F(this, "options");
    F(this, "state");
    F(this, "tokenizer");
    F(this, "inlineQueue");
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
      const r = this.inlineQueue[t];
      this.inlineTokens(r.src, r.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = []) {
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (d, i, y) => i + "    ".repeat(y.length));
    let r, s, a, o;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((d) => (r = d.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length), r.raw.length === 1 && t.length > 0 ? t[t.length - 1].raw += `
` : t.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length), s = t[t.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(r);
          continue;
        }
        if (r = this.tokenizer.fences(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.heading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.hr(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.blockquote(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.list(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.html(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.def(e)) {
          e = e.substring(r.raw.length), s = t[t.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + r.raw, s.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
            href: r.href,
            title: r.title
          });
          continue;
        }
        if (r = this.tokenizer.table(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.lheading(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (a = e, this.options.extensions && this.options.extensions.startBlock) {
          let d = 1 / 0;
          const i = e.slice(1);
          let y;
          this.options.extensions.startBlock.forEach((f) => {
            y = f.call({ lexer: this }, i), typeof y == "number" && y >= 0 && (d = Math.min(d, y));
          }), d < 1 / 0 && d >= 0 && (a = e.substring(0, d + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(a))) {
          s = t[t.length - 1], o && s.type === "paragraph" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(r), o = a.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length), s = t[t.length - 1], s && s.type === "text" ? (s.raw += `
` + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : t.push(r);
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
    return this.state.top = !0, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(e, t = []) {
    let r, s, a, o = e, d, i, y;
    if (this.tokens.links) {
      const f = Object.keys(this.tokens.links);
      if (f.length > 0)
        for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          f.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (d = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, d.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (y = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((f) => (r = f.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(e)) {
          e = e.substring(r.raw.length), s = t[t.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : t.push(r);
          continue;
        }
        if (r = this.tokenizer.link(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(r.raw.length), s = t[t.length - 1], s && r.type === "text" && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : t.push(r);
          continue;
        }
        if (r = this.tokenizer.emStrong(e, o, y)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.codespan(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.br(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.del(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (r = this.tokenizer.autolink(e)) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (!this.state.inLink && (r = this.tokenizer.url(e))) {
          e = e.substring(r.raw.length), t.push(r);
          continue;
        }
        if (a = e, this.options.extensions && this.options.extensions.startInline) {
          let f = 1 / 0;
          const x = e.slice(1);
          let h;
          this.options.extensions.startInline.forEach((k) => {
            h = k.call({ lexer: this }, x), typeof h == "number" && h >= 0 && (f = Math.min(f, h));
          }), f < 1 / 0 && f >= 0 && (a = e.substring(0, f + 1));
        }
        if (r = this.tokenizer.inlineText(a)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (y = r.raw.slice(-1)), i = !0, s = t[t.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : t.push(r);
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
    F(this, "options");
    this.options = e || Ze;
  }
  code(e, t, r) {
    var a;
    const s = (a = (t || "").match(/^\S*/)) == null ? void 0 : a[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + de(s) + '">' + (r ? e : de(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : de(e, !0)) + `</code></pre>
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
  heading(e, t, r) {
    return `<h${t}>${e}</h${t}>
`;
  }
  hr() {
    return `<hr>
`;
  }
  list(e, t, r) {
    const s = t ? "ol" : "ul", a = t && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + s + a + `>
` + e + "</" + s + `>
`;
  }
  listitem(e, t, r) {
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
    const r = t.header ? "th" : "td";
    return (t.align ? `<${r} align="${t.align}">` : `<${r}>`) + e + `</${r}>
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
  link(e, t, r) {
    const s = ds(e);
    if (s === null)
      return r;
    e = s;
    let a = '<a href="' + e + '"';
    return t && (a += ' title="' + t + '"'), a += ">" + r + "</a>", a;
  }
  image(e, t, r) {
    const s = ds(e);
    if (s === null)
      return r;
    e = s;
    let a = `<img src="${e}" alt="${r}"`;
    return t && (a += ` title="${t}"`), a += ">", a;
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
  link(e, t, r) {
    return "" + r;
  }
  image(e, t, r) {
    return "" + r;
  }
  br() {
    return "";
  }
}
class qe {
  constructor(e) {
    F(this, "options");
    F(this, "renderer");
    F(this, "textRenderer");
    this.options = e || Ze, this.options.renderer = this.options.renderer || new gn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new vr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new qe(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new qe(t).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, t = !0) {
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
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, fo(this.parseInline(o.tokens, this.textRenderer)));
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
          for (let f = 0; f < o.header.length; f++)
            i += this.renderer.tablecell(this.parseInline(o.header[f].tokens), { header: !0, align: o.align[f] });
          d += this.renderer.tablerow(i);
          let y = "";
          for (let f = 0; f < o.rows.length; f++) {
            const x = o.rows[f];
            i = "";
            for (let h = 0; h < x.length; h++)
              i += this.renderer.tablecell(this.parseInline(x[h].tokens), { header: !1, align: o.align[h] });
            y += this.renderer.tablerow(i);
          }
          r += this.renderer.table(d, y);
          continue;
        }
        case "blockquote": {
          const o = a, d = this.parse(o.tokens);
          r += this.renderer.blockquote(d);
          continue;
        }
        case "list": {
          const o = a, d = o.ordered, i = o.start, y = o.loose;
          let f = "";
          for (let x = 0; x < o.items.length; x++) {
            const h = o.items[x], k = h.checked, m = h.task;
            let b = "";
            if (h.task) {
              const v = this.renderer.checkbox(!!k);
              y ? h.tokens.length > 0 && h.tokens[0].type === "paragraph" ? (h.tokens[0].text = v + " " + h.tokens[0].text, h.tokens[0].tokens && h.tokens[0].tokens.length > 0 && h.tokens[0].tokens[0].type === "text" && (h.tokens[0].tokens[0].text = v + " " + h.tokens[0].tokens[0].text)) : h.tokens.unshift({
                type: "text",
                text: v + " "
              }) : b += v + " ";
            }
            b += this.parse(h.tokens, y), f += this.renderer.listitem(b, m, !!k);
          }
          r += this.renderer.list(f, d, i);
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
          r += t ? this.renderer.paragraph(d) : d;
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
  parseInline(e, t) {
    t = t || this.renderer;
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
          r += t.text(o.text);
          break;
        }
        case "html": {
          const o = a;
          r += t.html(o.text);
          break;
        }
        case "link": {
          const o = a;
          r += t.link(o.href, o.title, this.parseInline(o.tokens, t));
          break;
        }
        case "image": {
          const o = a;
          r += t.image(o.href, o.title, o.text);
          break;
        }
        case "strong": {
          const o = a;
          r += t.strong(this.parseInline(o.tokens, t));
          break;
        }
        case "em": {
          const o = a;
          r += t.em(this.parseInline(o.tokens, t));
          break;
        }
        case "codespan": {
          const o = a;
          r += t.codespan(o.text);
          break;
        }
        case "br": {
          r += t.br();
          break;
        }
        case "del": {
          const o = a;
          r += t.del(this.parseInline(o.tokens, t));
          break;
        }
        case "text": {
          const o = a;
          r += t.text(o.text);
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
class Nt {
  constructor(e) {
    F(this, "options");
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
F(Nt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Ge, gr, Ds;
class Wo {
  constructor(...e) {
    ls(this, Ge);
    F(this, "defaults", hr());
    F(this, "options", this.setOptions);
    F(this, "parse", tn(this, Ge, gr).call(this, ve.lex, qe.parse));
    F(this, "parseInline", tn(this, Ge, gr).call(this, ve.lexInline, qe.parseInline));
    F(this, "Parser", qe);
    F(this, "Renderer", gn);
    F(this, "TextRenderer", vr);
    F(this, "Lexer", ve);
    F(this, "Tokenizer", fn);
    F(this, "Hooks", Nt);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var s, a;
    let r = [];
    for (const o of e)
      switch (r = r.concat(t.call(this, o)), o.type) {
        case "table": {
          const d = o;
          for (const i of d.header)
            r = r.concat(this.walkTokens(i.tokens, t));
          for (const i of d.rows)
            for (const y of i)
              r = r.concat(this.walkTokens(y.tokens, t));
          break;
        }
        case "list": {
          const d = o;
          r = r.concat(this.walkTokens(d.items, t));
          break;
        }
        default: {
          const d = o;
          (a = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && a[d.type] ? this.defaults.extensions.childTokens[d.type].forEach((i) => {
            const y = d[i].flat(1 / 0);
            r = r.concat(this.walkTokens(y, t));
          }) : d.tokens && (r = r.concat(this.walkTokens(d.tokens, t)));
        }
      }
    return r;
  }
  use(...e) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((r) => {
      const s = { ...r };
      if (s.async = this.defaults.async || s.async || !1, r.extensions && (r.extensions.forEach((a) => {
        if (!a.name)
          throw new Error("extension name required");
        if ("renderer" in a) {
          const o = t.renderers[a.name];
          o ? t.renderers[a.name] = function(...d) {
            let i = a.renderer.apply(this, d);
            return i === !1 && (i = o.apply(this, d)), i;
          } : t.renderers[a.name] = a.renderer;
        }
        if ("tokenizer" in a) {
          if (!a.level || a.level !== "block" && a.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = t[a.level];
          o ? o.unshift(a.tokenizer) : t[a.level] = [a.tokenizer], a.start && (a.level === "block" ? t.startBlock ? t.startBlock.push(a.start) : t.startBlock = [a.start] : a.level === "inline" && (t.startInline ? t.startInline.push(a.start) : t.startInline = [a.start]));
        }
        "childTokens" in a && a.childTokens && (t.childTokens[a.name] = a.childTokens);
      }), s.extensions = t), r.renderer) {
        const a = this.defaults.renderer || new gn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in a))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.renderer[d], y = a[d];
          a[d] = (...f) => {
            let x = i.apply(a, f);
            return x === !1 && (x = y.apply(a, f)), x || "";
          };
        }
        s.renderer = a;
      }
      if (r.tokenizer) {
        const a = this.defaults.tokenizer || new fn(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in a))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const d = o, i = r.tokenizer[d], y = a[d];
          a[d] = (...f) => {
            let x = i.apply(a, f);
            return x === !1 && (x = y.apply(a, f)), x;
          };
        }
        s.tokenizer = a;
      }
      if (r.hooks) {
        const a = this.defaults.hooks || new Nt();
        for (const o in r.hooks) {
          if (!(o in a))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.hooks[d], y = a[d];
          Nt.passThroughHooks.has(o) ? a[d] = (f) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(a, f)).then((h) => y.call(a, h));
            const x = i.call(a, f);
            return y.call(a, x);
          } : a[d] = (...f) => {
            let x = i.apply(a, f);
            return x === !1 && (x = y.apply(a, f)), x;
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
  lexer(e, t) {
    return ve.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return qe.parse(e, t ?? this.defaults);
  }
}
Ge = new WeakSet(), gr = function(e, t) {
  return (r, s) => {
    const a = { ...s }, o = { ...this.defaults, ...a };
    this.defaults.async === !0 && a.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const d = tn(this, Ge, Ds).call(this, !!o.silent, !!o.async);
    if (typeof r > "u" || r === null)
      return d(new Error("marked(): input parameter is undefined or null"));
    if (typeof r != "string")
      return d(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(r) + ", string expected"));
    if (o.hooks && (o.hooks.options = o), o.async)
      return Promise.resolve(o.hooks ? o.hooks.preprocess(r) : r).then((i) => e(i, o)).then((i) => o.hooks ? o.hooks.processAllTokens(i) : i).then((i) => o.walkTokens ? Promise.all(this.walkTokens(i, o.walkTokens)).then(() => i) : i).then((i) => t(i, o)).then((i) => o.hooks ? o.hooks.postprocess(i) : i).catch(d);
    try {
      o.hooks && (r = o.hooks.preprocess(r));
      let i = e(r, o);
      o.hooks && (i = o.hooks.processAllTokens(i)), o.walkTokens && this.walkTokens(i, o.walkTokens);
      let y = t(i, o);
      return o.hooks && (y = o.hooks.postprocess(y)), y;
    } catch (i) {
      return d(i);
    }
  };
}, Ds = function(e, t) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + de(r.message + "", !0) + "</pre>";
      return t ? Promise.resolve(s) : s;
    }
    if (t)
      return Promise.reject(r);
    throw r;
  };
};
const Je = new Wo();
function B(n, e) {
  return Je.parse(n, e);
}
B.options = B.setOptions = function(n) {
  return Je.setOptions(n), B.defaults = Je.defaults, zs(B.defaults), B;
};
B.getDefaults = hr;
B.defaults = Ze;
B.use = function(...n) {
  return Je.use(...n), B.defaults = Je.defaults, zs(B.defaults), B;
};
B.walkTokens = function(n, e) {
  return Je.walkTokens(n, e);
};
B.parseInline = Je.parseInline;
B.Parser = qe;
B.parser = qe.parse;
B.Renderer = gn;
B.TextRenderer = vr;
B.Lexer = ve;
B.lexer = ve.lex;
B.Tokenizer = fn;
B.Hooks = Nt;
B.parse = B;
B.options;
B.setOptions;
B.use;
B.walkTokens;
B.parseInline;
qe.parse;
ve.lex;
const Fs = "question-modal", ms = "question_modal", nr = 3, gs = "gate-v2@2026.10.21";
function be() {
  var n;
  return ((n = window.QwenPaw) == null ? void 0 : n.host) || {};
}
function Ho() {
  var n;
  return ((n = window.QwenPaw) == null ? void 0 : n.chat) || null;
}
function Ce() {
  return be().antd || {};
}
function Uo() {
  return be().antdIcons || {};
}
const Jo = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function rr(n) {
  const e = Uo();
  for (const t of Jo) {
    const r = e[t];
    if (r)
      return n.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return n.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Go() {
  try {
    const n = "question-modal-styles";
    if (document.getElementById(n)) return;
    const e = document.createElement("style");
    e.id = n, e.textContent = [
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
function O(n) {
  try {
    const e = be();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(n);
  } catch {
  }
  return "/api" + n;
}
let qn = "", Ws = "";
function qr(n, e) {
  n && (Ws = n), e && (qn = e);
}
function R() {
  const n = { "Content-Type": "application/json" };
  try {
    const e = be(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (n.Authorization = "Bearer " + t);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = qn), r && (n["X-Agent-Id"] = r);
  } catch {
  }
  return n;
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
  const n = window.currentSessionId;
  if (typeof n == "string" && n) return n;
  try {
    const e = /\/chat\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:[/?#]|$)/.exec(typeof window < "u" && window.location && window.location.pathname || "");
    if (e && e[1]) return e[1].toLowerCase();
  } catch {
  }
  return Ws;
}
globalThis.__qmSessionProbe = _n;
function St() {
  try {
    const n = be(), e = typeof n.getSelectedAgentId == "function" && n.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return qn;
}
const sr = {};
async function Zo(n, e, t) {
  if (typeof window > "u" || sr[n]) return "skipped";
  try {
    const a = "qm:v1:notified:" + n;
    if (window.localStorage && window.localStorage.getItem(a) === "1")
      return sr[n] = !0, "skipped";
    window.localStorage.setItem(a, "1");
  } catch {
  }
  sr[n] = !0;
  const r = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((d) => {
      let i = !1;
      const y = (f) => {
        i || (i = !0, d(f));
      };
      try {
        const f = s.requestPermission((x) => y(x));
        f && typeof f.then == "function" && f.then(y).catch(() => y("denied"));
      } catch {
        y("denied");
      }
      setTimeout(() => y(s.permission || "denied"), 8e3);
    }) !== "granted" || s.permission !== "granted") return "inpage";
    const a = new s("问卷等待作答", { body: r, tag: "qm-" + n, renotify: !1 });
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
function V(n) {
  const e = Ot(n);
  return e && e.session_id ? e.session_id : _n();
}
const ar = 180, Qo = 20, Hs = 6e3, Ko = 60, Xo = 8;
function Vo() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Yo = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function hs(n) {
  try {
    return String(n || "").replace(Yo, "").length;
  } catch {
    return 0;
  }
}
function bs(n) {
  const e = Vo();
  if (!e) return -1;
  let t = null;
  try {
    t = e.querySelector('[data-qm-card-id="' + n + '"]');
  } catch {
    return -1;
  }
  if (!t) return -1;
  let r = -1;
  try {
    r = hs((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - hs(t.textContent);
}
function ei(n) {
  return n === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function ti(n) {
  return !n.submittedAt || n.deadReason || n.skippedAll || !n.observed || n.releasedNote || n.retired ? null : { phase: n.pastSoft ? "stalled" : "waiting" };
}
function ys(n) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(n, { timeout: Hs });
      return;
    }
  } catch {
  }
  try {
    setTimeout(n, 0);
  } catch {
  }
}
const ni = "qm:v1:analysis:global", ri = "qm:v1:analysis:", si = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Et(n) {
  return n === "ai" || n === "recommend" ? n : "manual";
}
function ai(n) {
  if (!n || typeof n != "object") return { ...si };
  const e = n.modelId !== void 0 ? n.modelId : n.model_id, t = n.withContext !== void 0 ? n.withContext : n.with_context;
  return {
    // Three-way mode.  Anything unrecognised (including legacy payloads that
    // only ever wrote "ai"/"manual") degrades to "manual" — the safe default
    // that never drives the form on its own.
    mode: n.mode === "ai" || n.mode === "recommend" ? n.mode : "manual",
    modelId: typeof e == "string" ? e : "",
    withContext: !!t,
    parallel: !!n.parallel
  };
}
function oi() {
  try {
    const n = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(ri) === 0 && t !== ni && n.push(t);
    }
    n.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function ii() {
  try {
    const n = await fetch(O("/question-modal/prefs"), { headers: R() });
    if (!n.ok) return null;
    const e = await n.json();
    return !e || !e.ok || !e.prefs ? null : ai(e.prefs);
  } catch {
    return null;
  }
}
async function _r() {
  try {
    const n = await fetch(O("/question-modal/templates"), { headers: R() });
    if (!n.ok) return { items: [], defaultId: "" };
    const e = await n.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function sn(n, e, t) {
  if (!n) return null;
  try {
    const r = await fetch(O("/question-modal/survey-action"), {
      method: "POST",
      headers: R(),
      body: JSON.stringify({
        tool_call_id: n,
        action: e,
        payload: t,
        origin: wn()
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
async function li(n) {
  if (!n) return null;
  try {
    const e = await fetch(
      O("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(n)),
      { headers: R() }
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
function ci(n, e) {
  if (!n) return () => {
  };
  let t = !1, r = null, s = 0, a = null, o = 0, d = !1, i = 0, y = 0, f = null;
  const x = (m) => {
    t || f === m || (f = m, e.onStatus(m));
  }, h = () => {
    if (!t)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, b = O("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(n) + "&since_rev=" + o, v = { headers: R() };
        m && (v.signal = m.signal), r = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(b, v).then(async (E) => {
          const q = Bi(E);
          if (!E.ok || !E.body || q) {
            if (E.status === 404 || E.status === 501 || E.status === 405) {
              d = !0, x(!1);
              return;
            }
            throw q && (i += 1), new Error(q ? "blocked" : "HTTP " + E.status);
          }
          s = 0, i = 0, x(!0);
          const S = E.body.getReader(), I = new TextDecoder();
          let $ = "";
          const C = () => {
            S.read().then(({ done: P, value: L }) => {
              if (P) {
                k();
                return;
              }
              $ += I.decode(L, { stream: !0 });
              let J;
              for (; (J = $.indexOf(`

`)) >= 0; ) {
                const ke = $.slice(0, J);
                $ = $.slice(J + 2), ke.split(`
`).forEach((Ie) => {
                  if (!Ie.startsWith("data: ")) return;
                  let D = null;
                  try {
                    D = JSON.parse(Ie.slice(6));
                  } catch {
                    return;
                  }
                  D && (D.kind === "snapshot" ? (o = Math.max(o, parseInt(D.rev || 0, 10) || 0), e.onSnapshot(o, D.state || null)) : D.kind === "change" && (o = Math.max(o, parseInt(D.rev || 0, 10) || 0), e.onChange(D)));
                });
              }
              t || C();
            }).catch(() => {
              k();
            });
          };
          C();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (t || d)
      return;
    if (x(!1), i += 1, y || (y = Date.now()), i >= ta) {
      if (Date.now() - (y || Date.now()) >= ra) {
        d = !0, x(!1);
        return;
      }
      a = setTimeout(h, na);
      return;
    }
    s = Math.min(s + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, s));
    a = setTimeout(h, m);
  };
  return h(), () => {
    if (t = !0, a)
      try {
        clearTimeout(a);
      } catch {
      }
    if (r)
      try {
        r();
      } catch {
      }
    f = null, e.onStatus(!1);
  };
}
async function or(n, e, t) {
  try {
    return (await fetch(O("/question-modal/session-prefs"), {
      method: "POST",
      headers: R(),
      body: JSON.stringify({
        chat_id: "",
        // server resolves session_id → chat UUID
        session_id: e,
        agent_id: t,
        settings: n,
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
async function hn(n, e, t, r) {
  const s = n || "", a = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(r || "");
  try {
    const o = O(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + a
    ), d = await fetch(o, { headers: R() });
    if (!d.ok) return null;
    const i = await d.json();
    if (!i || i.ok !== !0) return null;
    const y = {
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
    return Us = { chatId: s, at: Date.now(), data: y }, y;
  } catch {
    return null;
  }
}
function Js() {
  Us = null;
}
async function Sr() {
  const n = O("/question-modal/stale-surveys") + "?older_than_sec=1800", e = await fetch(n, { headers: R() });
  if (!e.ok) throw new Error("HTTP " + e.status);
  return await e.json();
}
async function Gs(n) {
  const e = await fetch(O("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: R(),
    body: JSON.stringify(n)
  }), t = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(t && t.detail || "HTTP " + e.status);
  return t;
}
async function di(n) {
  const e = await fetch(O("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: R(),
    body: JSON.stringify({ tool_call_ids: n })
  }), t = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(t && t.detail || "HTTP " + e.status);
  return t;
}
async function pi() {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const n = await Sr();
    c.stale.rows = n && n.items || [], c.stale.scanned = !0, c.stale.msgKind = "info";
  } catch (n) {
    c.stale.rows = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (n && n.message ? n.message : String(n)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, z();
  }
}
async function ui(n) {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await Gs({ tool_call_ids: n, older_than_sec: 1800 }), t = Number(e && e.released) || 0, r = Number(e && e.already) || 0, s = Number(e && e.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `释放 ${t} 条，${s} 条未成功（见日志）` + (r ? `；${r} 条此前已释放` : "") : t > 0 ? `已释放 ${t} 条问卷` + (r ? `；${r} 条此前已释放` : "") : `无需释放：${r || n.length} 条此前已释放`;
    const a = await Sr();
    c.stale.rows = a && a.items || [], c.stale.scanned = !0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "释放失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function fi() {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const n = await Gs({ all: !0, older_than_sec: 1800 }), e = Number(n && n.released) || 0, t = Number(n && n.failed) || 0, r = Number(n && n.already) || 0, s = Number(n && n.requested) || 0;
    c.stale.msgKind = t > 0 ? "warn" : "ok", c.stale.msg = s === 0 ? "当前没有可释放项" : t > 0 ? `释放 ${e}/${s} 条，${t} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const a = await Sr();
    c.stale.rows = a && a.items || [], c.stale.scanned = !0;
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function mi(n) {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await di(n), t = e && e.results || [], r = t.filter((a) => a && a.stopped).length, s = t.filter((a) => a && !a.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (s ? `；${s} 个会话已不存在` : "") : `${s} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Zs(n) {
  try {
    const e = await fetch(O("/question-modal/templates"), {
      method: "POST",
      headers: R(),
      body: JSON.stringify(n)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Qs(n) {
  try {
    const e = await fetch(O("/question-modal/templates/" + encodeURIComponent(n)), {
      method: "DELETE",
      headers: R()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ks() {
  try {
    const n = await fetch(O("/models"), { headers: R() });
    if (!n.ok) return [];
    const e = await n.json();
    return (Array.isArray(e) ? e : []).filter((r) => {
      const a = [...r.models || [], ...r.extra_models || []].length > 0, o = !!r.api_key || r.require_api_key === !1 || r.is_local || r.is_custom;
      return a && o;
    });
  } catch {
    return [];
  }
}
function gi(n) {
  if (!n) return "";
  try {
    return String(B.parse(n, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + n.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function M(n, e) {
  try {
    const t = Ce().message;
    if (t && typeof t[n] == "function") {
      t[n](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", n, e);
}
const le = "__other__";
function he(n) {
  return String(n && typeof n == "object" ? n.value ?? n.label ?? "" : n);
}
function ot(n) {
  return n ? n.skipped === !0 ? !0 : Array.isArray(n.value) ? n.value.length > 0 : !!(String(n.value ?? "").trim() || String(n.other ?? "").trim() || n.attachments && n.attachments.length) : !1;
}
function ir(n, e, t) {
  const r = { ...n };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (t && t.has(s) || !Object.prototype.hasOwnProperty.call(r, s)) return;
    const a = e[s];
    !a || typeof a != "object" || !ot(r[s]) && ot(a) && (r[s] = { ...a });
  }), r;
}
function xs(n) {
  if (!n || typeof n != "object") return [];
  const e = n.recommended !== void 0 ? n.recommended : n.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function ks(n, e) {
  if (!n || typeof n != "object") return "";
  const t = Array.isArray(n.per_question) ? n.per_question : [];
  if (!t.length) return "";
  const r = t.find((s) => Number(s && s.index) === Number(e)) || (t.length === 1 ? t[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function hi(n, e, t) {
  if (!t.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = he(e), a = _e(e), o = r(s), d = r(a);
  return t.some((i) => {
    const y = r(i);
    return y ? !!(i === s || i === a || y === o || y === d || Math.min(y.length, o.length, d.length) >= 4 && (y.length >= 4 && (o.includes(y) || y.includes(o)) || y.length >= 4 && (d.includes(y) || y.includes(d)))) : !1;
  });
}
function re(n) {
  const e = n && n.type;
  return e === "single" || e === "multi" || e === "text" ? e : n && (n.options || []).length ? n.multiple === !0 ? "multi" : "single" : "text";
}
let Xs = !0;
function bn(n, e) {
  const t = String(n && n.title || "").trim();
  return t || (Xs ? "第 " + (e + 1) + " 题" : "");
}
function _e(n) {
  return String(n && typeof n == "object" ? n.label ?? n.value ?? "" : n);
}
function bi(n, e) {
  const t = /* @__PURE__ */ new Set(), r = (a) => {
    a != null && a !== "" && t.add(String(a));
  }, s = n.options || [];
  if (re(n) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const d = s.find((i) => he(i) === String(o));
      d && r(_e(d)), String(o) === le && e.other && r(e.other);
    });
  else {
    r(e.value);
    const a = s.find((o) => he(o) === String(e.value));
    a && r(_e(a)), String(e.value) === le && e.other && r(e.other);
  }
  return t;
}
function yi(n, e) {
  return (Array.isArray(n) ? n : [n]).some((r) => {
    const s = String(r);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const a of Array.from(e))
      if (a && (a.indexOf(s) !== -1 || s.indexOf(a) !== -1)) return !0;
    return !1;
  });
}
function Vs(n, e) {
  const t = /^q(\d+)$/i.exec(n.trim());
  if (t) {
    const s = parseInt(t[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === n.trim());
}
function Ys(n, e, t) {
  const r = e[n], s = r && r.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const a of Object.keys(s)) {
    const o = Vs(a, e);
    if (o < 0) continue;
    const d = e[o];
    if (!d) continue;
    if (d.showIf && !Ys(o, e, t)) return !1;
    const i = t[`q${o}`];
    if (!i || !yi(s[a], bi(d, i))) return !1;
  }
  return !0;
}
function Ae(n, e) {
  const t = [];
  return n.forEach((r, s) => {
    Ys(s, n, e) && t.push(s);
  }), t;
}
function xi(n) {
  try {
    const e = n && n.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function an(n) {
  return Array.isArray(n.questions);
}
function ki(n) {
  try {
    const e = n && n.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function wi(n) {
  try {
    const e = n && n.content || [], t = e[0] && e[0].data, r = t && t.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((s) => s && (s.text || s.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function vi(n) {
  return n ? /\[scroll folded\]/.test(n) : !1;
}
function qi(n) {
  if (!n) return "";
  const e = String(n).split(`
`).map((r) => r.trim()).filter(Boolean);
  for (let r = e.length - 1; r >= 0; r--) {
    const s = e[r];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(s) && !/^\{/.test(s) && !/^\s*"skipped"/.test(s) && s.length < 400)
      return s.replace(/^【|】$/g, "").trim();
  }
  const t = String(n).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return t && t[1] && t[1] !== "timeout" ? t[1] : "";
}
function Tt(n, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), a = String(e.skip_reason || "").trim();
    return (a ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${a}` : "已跳过本次问卷。") + `

` + un(n);
  }
  const t = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((s) => {
    const a = t[s];
    if (!a || typeof a != "object") return;
    const o = Vs(s, n), d = o >= 0 ? n[o] : null, i = d ? re(d) === "single" ? "单选" : re(d) === "multi" ? "多选" : "问答" : "问答", y = d ? bn(d, o) : s;
    let f = a.value;
    if (Array.isArray(f) && (f = f.join("、")), a.other && (f = (f ? f + "、" : "") + a.other), a.skipped) {
      const x = String(a.skipped_by || ""), h = x === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : x === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${s} [${i}] ${y}${h}`);
    } else
      r.push(`- ${s} [${i}] ${y}：${f === "" || f == null ? "（空）" : f}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function _i(n, e) {
  try {
    const t = new URLSearchParams();
    n && t.set("tool_call_id", n), e && t.set("session_id", e);
    const r = await fetch(
      O("/question-modal/resolve") + "?" + t.toString(),
      { headers: R() }
    );
    if (!r.ok) return { kind: "error" };
    const s = await r.json();
    return s && qr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function At(n) {
  if (!n) return null;
  try {
    const e = await fetch(
      O("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(n),
      { headers: R() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function Si(n) {
  try {
    const e = new FormData();
    e.append("file", n);
    const t = R();
    delete t["Content-Type"];
    const r = await fetch(
      O("/console/upload"),
      { method: "POST", headers: t, body: e }
    );
    if (!r.ok) {
      const a = await r.text().catch(() => "");
      let o = "HTTP " + r.status;
      try {
        const d = JSON.parse(a);
        d && d.detail && (o = d.detail);
      } catch {
      }
      return { ok: !1, error: `${n.name}: ${o}` };
    }
    const s = await r.json();
    return !s || !s.url ? { ok: !1, error: `${n.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(s.url), file_name: String(s.file_name || n.name), size: s.size }
    };
  } catch (e) {
    return { ok: !1, error: `${n.name}: ${e && e.message || e}` };
  }
}
const yn = "qm:v1:stash_att:", ws = 25 * 1024 * 1024, dn = /* @__PURE__ */ new Map(), pn = /* @__PURE__ */ new Map();
let xn = null, kn = 0, lr = null;
function vs() {
  const n = kn > 0;
  pn.forEach((e) => {
    try {
      e(n);
    } catch {
    }
  });
}
function Ei() {
  if (lr) return lr;
  if (typeof document > "u" || !document.createElement) return null;
  let n = null;
  try {
    n = document.createElement("input");
  } catch {
    return null;
  }
  if (!n) return null;
  try {
    n.type = "file", n.multiple = !0, n.setAttribute("data-qm-file", "true"), n.style.display = "none";
  } catch {
  }
  n.onchange = async (e) => {
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
    const r = xn;
    xn = null, !(!r || !t.length) && await ea(t, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(n);
  } catch {
  }
  return lr = n, n;
}
function Ti(n, e, t) {
  if (!n) {
    M("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  xn = { callId: n, target: e, key: t };
  const r = Ei();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (xn = null);
}
async function ea(n, e, t, r) {
  kn += 1, vs();
  const s = [], a = [];
  try {
    for (const d of n) {
      if (d.size && d.size > ws) {
        a.push(`${d.name}: 文件过大（上限 ${Math.round(ws / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await Si(d);
      i.ok ? s.push(i.att) : a.push(i.error);
    }
  } finally {
    kn -= 1, vs();
  }
  const o = dn.get(e);
  if (s.length || a.length) {
    const d = t === "final" ? "final" : "q";
    if (!e) {
      M(
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
    else s.length && Ai(e, s, d, r);
  }
}
function Ai(n, e, t, r) {
  if (!(!n || !e.length))
    try {
      const s = localStorage.getItem(yn + n), a = s ? JSON.parse(s) : [], o = (Array.isArray(a) ? a : []).concat(
        e.map((d) => ({ att: d, target: t, key: r }))
      );
      localStorage.setItem(yn + n, JSON.stringify(o));
    } catch {
    }
}
function Ci(n) {
  if (!n) return [];
  try {
    const e = localStorage.getItem(yn + n);
    if (!e) return [];
    localStorage.removeItem(yn + n);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function Ii(n) {
  const e = n && n.clipboardData;
  if (!e) return [];
  let t = [];
  try {
    t = Array.from(e.files || []);
  } catch {
    t = [];
  }
  if (!t.length)
    try {
      t = Array.from(e.items || []).filter((r) => r && r.kind === "file").map((r) => r.getAsFile ? r.getAsFile() : null).filter((r) => !!r);
    } catch {
      t = [];
    }
  return t;
}
function zi(n) {
  return !n && n !== 0 ? "" : n < 1024 ? n + " B" : n < 1024 * 1024 ? (n / 1024).toFixed(1) + " KB" : (n / 1024 / 1024).toFixed(1) + " MB";
}
async function cr(n, e) {
  const t = e || V(n), r = Ot(n), s = r && r.request_id ? r.request_id : "";
  if (s)
    try {
      const a = await fetch(O("/question-modal/skip"), {
        method: "POST",
        headers: R(),
        body: JSON.stringify({ request_id: s, session_id: t || "" })
      });
      if (a.ok) {
        const o = await a.json().catch(() => ({}));
        return ie(n), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (a.status === 404)
        return ie(n), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const a = await fetch(
        O("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: R() }
      );
      if (a.ok) {
        const o = await a.json().catch(() => ({})), d = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return ie(n), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + a.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function qs(n) {
  if (!n) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      O("/console/chat/stop") + "?chat_id=" + encodeURIComponent(n),
      { method: "POST", headers: R() }
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
async function Ni(n) {
  try {
    const e = n ? "?session_id=" + encodeURIComponent(n) : "", t = await fetch(
      O("/question-modal/pending") + e,
      { headers: R() }
    );
    if (!t.ok) return null;
    const r = await t.json(), s = r && r.items || [];
    if (!Array.isArray(s) || s.length !== 1) return null;
    const a = s[0];
    if (!a || !a.request_id) return null;
    const o = await fetch(
      O("/question-modal/resolve") + "?request_id=" + encodeURIComponent(a.request_id),
      { headers: R() }
    );
    if (!o.ok) return null;
    const d = await o.json();
    return d && qr(d.session_id, d.agent_id), d && d.found ? d : null;
  } catch {
    return null;
  }
}
const Sn = "qm:v1:reqid:", Oi = 3e4, Ri = 45e3, ta = 6, na = 6e4, ra = 15 * 6e4, $i = 700, Mi = 8;
function Bi(n) {
  try {
    if (String((n.headers && n.headers.get ? n.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const t = Number(n.status || 0);
    return t === 429 || t === 403 || t === 407 || t === 451;
  } catch {
    return !1;
  }
}
function ie(n) {
  if (n)
    try {
      localStorage.removeItem(Sn + n);
    } catch {
    }
}
function Li() {
  try {
    const n = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Sn) === 0 && n.push(a);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    n.forEach((s) => {
      let a = null;
      try {
        a = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        a = null;
      }
      !a || !a.request_id || !a.ts || Date.now() - a.ts > e ? localStorage.removeItem(s) : t.push(s);
    });
    const r = 50;
    if (t.length <= r) return;
    t.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, a) => s.ts - a.ts).slice(0, t.length - r).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
function ji(n, e, t, r) {
  if (!(!n || !e))
    try {
      localStorage.setItem(Sn + n, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: r || "",
        tool_call_id: n,
        ts: Date.now()
      })), Li();
    } catch {
    }
}
function Ot(n) {
  if (!n) return null;
  try {
    const e = localStorage.getItem(Sn + n);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== n ? (ie(n), null) : t;
  } catch {
    return null;
  }
}
const Er = "qm:v1:state:";
function It(n) {
  if (!n) return null;
  try {
    const e = localStorage.getItem(Er + n);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function wn() {
  try {
    let n = sessionStorage.getItem("qm:v1:tab");
    return n || (n = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", n)), n;
  } catch {
    return "tab-anon";
  }
}
const sa = wn(), _s = "qm:v1:sessionprefs-ping";
function He(n, e) {
  if (n)
    try {
      const r = { ...It(n) || {}, ...e, ts: Date.now(), origin: sa };
      localStorage.setItem(Er + n, JSON.stringify(r)), Pi();
    } catch {
    }
}
function Pi() {
  try {
    const n = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Er) === 0 && n.push(a);
    }
    const e = 7 * 24 * 3600 * 1e3, t = [];
    n.forEach((s) => {
      let a = null;
      try {
        a = JSON.parse(localStorage.getItem(s) || "null");
      } catch {
        a = null;
      }
      !a || !a.ts || Date.now() - a.ts > e ? localStorage.removeItem(s) : t.push(s);
    });
    const r = 80;
    if (t.length <= r) return;
    t.map((s) => ({ k: s, ts: (JSON.parse(localStorage.getItem(s) || "{}") || {}).ts || 0 })).sort((s, a) => s.ts - a.ts).slice(0, t.length - r).forEach((s) => localStorage.removeItem(s.k));
  } catch {
  }
}
async function Di(n) {
  try {
    const e = await fetch(
      O("/question-modal/resolve") + "?request_id=" + encodeURIComponent(n),
      { headers: R() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && qr(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Fi(n, e, t, r) {
  const s = ["【用户提交的问卷答案】"], a = new Set(Ae(n, e));
  return n.forEach((o, d) => {
    if (!a.has(d)) return;
    const i = e[`q${d}`];
    if (!i) return;
    let y = i.value;
    if (Array.isArray(y))
      y = y.filter((b) => b !== le).map((b) => {
        const v = (o.options || []).find((_) => he(_) === String(b));
        return v ? _e(v) : b;
      }).join("、");
    else {
      const b = (o.options || []).find((v) => he(v) === String(y));
      b && (y = _e(b)), String(i.value) === le && (y = "");
    }
    const f = re(o) === "single" ? "单选" : re(o) === "multi" ? "多选" : "问答", x = !!String(y || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), h = String(i.skipped_by || ""), k = i.skipped ? h === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : h === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : x ? y : "（未作答）";
    let m = `- q${d} [${f}] ${k}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((b) => b.file_name).join("、")}）`), s.push(m);
  }), t && s.push(`- 其他意见：${t}`), r && r.length && s.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), s.join(`
`);
}
function Wi(n) {
  const e = {};
  return Object.keys(n || {}).forEach((t) => {
    const r = n[t];
    if (!r || typeof r != "object") {
      e[t] = r;
      return;
    }
    const s = r.value;
    if (Array.isArray(s) ? s.length === 1 && s[0] === le : String(s ?? "") === le) {
      e[t] = r;
      return;
    }
    e[t] = { ...r, other: "", attachments: [] };
  }), e;
}
function un(n) {
  return n.map((e, t) => {
    const r = re(e) === "single" ? "单选" : re(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(_e).join("、");
    return `${t + 1}. [${r}] ${bn(e, t)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function dr(n) {
  const { R: e, files: t, disabled: r, uploading: s, error: a, onPick: o, onRemove: d } = n, i = {
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
    t.map((f, x) => e.createElement(
      "span",
      { key: "att" + x, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: f.file_name
      }, f.file_name + (f.size ? "（" + zi(f.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || d(x);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: r || s,
      style: y,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, s ? "上传中…" : "📎 附件"),
    a ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + a) : null
  );
}
function Hi(n) {
  const {
    R: e,
    providers: t,
    modelId: r,
    onChange: s,
    disabled: a,
    open: o,
    onOpenChange: d,
    tab: i,
    onTabChange: y
  } = n, x = Ce().Popover, h = [];
  t.forEach((C) => {
    [...C.models || [], ...C.extra_models || []].forEach((P) => {
      h.push({
        providerId: C.id,
        providerName: C.name || C.id,
        modelId: P.id,
        modelName: P.name || P.id,
        free: !!P.is_free
      });
    });
  });
  const k = h.find((C) => `${C.providerId}:${C.modelId}` === r), b = k ? k.modelName : r || "选择模型", v = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", _ = {
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
  }, E = h.filter((C) => C.free).length, q = h.length - E, S = [];
  t.forEach((C) => {
    const P = [...C.models || [], ...C.extra_models || []].map((L) => ({
      providerId: C.id,
      providerName: C.name || C.id,
      modelId: L.id,
      modelName: L.name || L.id,
      free: !!L.is_free
    })).filter((L) => i === "free" ? L.free : !L.free);
    P.length && S.push({ id: C.id, name: C.name || C.id, models: P });
  });
  const I = (C, P) => e.createElement("button", {
    key: C,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === C ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === C ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === C ? 600 : 400,
      boxShadow: i === C ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => y(C)
  }, P), $ = e.createElement(
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
      I("paid", "付费 🟡 " + q),
      I("free", "免费 🟢 " + E)
    ),
    S.length ? e.createElement("div", null, S.map((C, P) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: C.id,
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
          e.createElement("span", { style: { flex: 1 } }, C.name),
          e.createElement("span", { style: { fontWeight: 400 } }, C.models.length)
        ),
        C.models.map((L) => {
          const J = `${L.providerId}:${L.modelId}` === r;
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
                borderLeft: "3px solid " + (J ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: J ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${L.providerId}:${L.modelId}`), d(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: P % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
  return x ? e.createElement(x, {
    content: $,
    trigger: "click",
    open: o,
    onOpenChange: d,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: _,
      disabled: a,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: v }
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
      disabled: a,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const C = h.find((P) => `${P.providerId}:${P.modelId}` !== r);
        C && s(`${C.providerId}:${C.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: v }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Ui(n) {
  const { R: e, mode: t, onChange: r, disabled: s } = n, a = {
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
      background: t === i ? "var(--app-accent, #ff7f16)" : "transparent",
      color: t === i ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
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
function Ji(n) {
  const { R: e, templates: t, value: r, open: s, onOpenChange: a, disabled: o, onSelect: d, onManage: i } = n, f = Ce().Popover, x = (t || []).find((v) => v.id === r), h = x ? x.name : "默认模板", k = {
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
    (t || []).map((v) => e.createElement(
      "div",
      {
        key: v.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (v.id === r ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: v.id === r ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          d(v.id), a(!1);
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
      }, v.name),
      v.builtin ? e.createElement("span", {
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
  ), b = e.createElement(
    "button",
    {
      type: "button",
      style: k,
      disabled: o,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, h),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return f ? e.createElement(f, {
    content: m,
    trigger: "click",
    open: s,
    onOpenChange: a,
    placement: "bottomLeft"
  }, b) : b;
}
function Gi(n) {
  const { R: e, open: t, templates: r, value: s, edit: a, onEditChange: o, onClose: d, onSelect: i, onSave: y, onDelete: f } = n;
  if (!t) return null;
  const x = Ce(), { Input: h, Modal: k } = x, m = {
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
  }, v = !!a, _ = (q, S, I, $) => h && h.TextArea ? e.createElement(h.TextArea, {
    value: q,
    rows: I,
    placeholder: $,
    onChange: (C) => S(C && C.target ? C.target.value : "")
  }) : e.createElement("textarea", {
    value: q,
    rows: I,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (C) => S(C && C.target ? C.target.value : ""),
    onChange: (C) => S(C && C.target ? C.target.value : "")
  }), E = e.createElement(
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
        v ? a.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: d }, "关闭")
    ),
    v ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      _(a.name || "", (q) => o({ ...a, name: q }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      _(a.system || "", (q) => o({ ...a, system: q }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      _(a.user || "", (q) => o({ ...a, user: q }), 6, "用户提示词模板"),
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
          onClick: () => y(a)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: b,
          onClick: () => o(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (r || []).map(
        (q) => e.createElement(
          "div",
          {
            key: q.id,
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
            q.name + (q.builtin ? "（内置）" : "") + (q.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: b,
            title: "设为本题使用",
            onClick: () => i(q.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => o({
              id: q.id,
              name: q.name,
              system: q.system,
              user: q.user
            })
          }, "编辑"),
          q.builtin ? null : e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => f(q.id)
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
    onCancel: d,
    destroyOnClose: !0,
    width: "min(620px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal"
  }, E) : E;
}
function Zi(n) {
  const {
    R: e,
    busy: t,
    result: r,
    error: s,
    mode: a,
    onRun: o,
    onApply: d,
    onCancel: i,
    onRerun: y,
    disabled: f,
    children: x,
    open: h,
    onOpenChange: k
  } = n, b = Ce().Popover, v = e.createElement("button", {
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
    title: a === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : a === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      k(!h);
    }
  }, t ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      v,
      r && h ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((S) => S.reasoning).join(`

`))) : null
    );
  const _ = !!(r && (r.per_question || []).length), E = (S, I, $) => e.createElement("button", {
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
  }, S), q = e.createElement(
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
              (y || o)();
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
            d(), k(!1);
          }
        }, "套用推荐") : null
      ),
      (r.per_question || []).map((S) => e.createElement(
        "div",
        { key: S.index, style: { marginBottom: 14 } },
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
          }, S.title),
          S.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + S.choice) : null,
          typeof S.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(S.confidence <= 1 ? S.confidence * 100 : S.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: gi(S.reasoning || "") }
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
      }, a === "ai" ? "本题尚未生成分析。" : "本题尚未分析。点击下方按钮，用所选模型分析本题并给出推荐。"),
      // Manual mode: analysis starts on an explicit press — opening the
      // bubble is a read-only action (REQ-001).
      E("开始分析", () => {
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
    }, x)
  );
  return e.createElement(b, {
    content: q,
    trigger: "click",
    open: h,
    onOpenChange: k,
    placement: "bottomRight"
  }, v);
}
function Qi(n) {
  const e = be().React, t = Ce(), { Input: r, Button: s } = t, a = r.TextArea, o = n.data || {}, d = xi(o), i = ki(o), y = wi(o), f = vi(y), x = f ? "" : y, h = d.questions || [], k = d.title || "问卷", m = It(i), [b, v] = e.useState(
    () => !!(m && m.answered) || !!x || f
  ), [_, E] = e.useState(""), [q, S] = e.useState(() => {
    const l = Ot(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [I, $] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [C, P] = e.useState(
    () => m && typeof m.slowAt == "number" ? m.slowAt : 0
  ), [L, J] = e.useState(
    () => m && typeof m.slowStep == "number" ? m.slowStep : -1
  ), [ke, Ie] = e.useState(
    () => !!(m && m.slowFired === !0)
  ), [D, U] = e.useState(() => {
    const l = {};
    h.forEach((g, u) => {
      l[`q${u}`] = { type: re(g), value: re(g) === "multi" ? [] : "", other: "" };
    });
    const p = m && m.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((g) => {
      l[g] && (l[g] = { ...l[g], ...p[g] });
    }), l;
  }), [Qe, da] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [H, ze] = e.useState(!1), [Ne, En] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [it, lt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [pe, Ke] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(x || "")
  ), [Oe, Xe] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || qi(x || "")
  ), [ct, Cr] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [Mt, Ir] = e.useState(
    () => !!(m && m.expanded)
  ), [zr, Bt] = e.useState(!1), Tn = e.useRef(0), [ue, pa] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [$e, dt] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [Ve, An] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Cn, In] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [pt, Lt] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), ut = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < ar * 1e3)
  ), Me = e.useRef(!1), jt = e.useRef(!!(m && m.pastSoft === !0)), [zn, ua] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), fa = e.useRef(zn), Nr = (l) => {
    fa.current = l, ua(l);
  }, se = (l, p) => {
    const g = zn[l];
    return g ?? p;
  };
  Xs = !!se("fallback_title", !0);
  const Or = Math.max(30, Number(se("wait_hint_sec", ar)) || ar), ma = "manual", [Z, Pt] = e.useState(ma), [Rr, Nn] = e.useState(""), [gl, ga] = e.useState(!1), [On, Rn] = e.useState(!1), [$n, Mn] = e.useState(!1), [ha, ba] = e.useState([]), [$r, Bn] = e.useState(!1), [Dt, Ye] = e.useState(null), [ya, Be] = e.useState(""), [xa, ka] = e.useState(!1), [wa, va] = e.useState(!1), [qa, _a] = e.useState("paid"), Re = e.useRef({}), Se = e.useRef({}), et = e.useRef(0), ft = e.useRef(null), [Sa, tt] = e.useState(0), [Mr, Ln] = e.useState([]), [Le, Ft] = e.useState(""), Ee = e.useRef(Le);
  Ee.current = Le;
  const [Ea, Ta] = e.useState(!1), [Aa, Br] = e.useState(!1), [Ca, jn] = e.useState(null), [we, Lr] = e.useState(
    () => !!(m && m.autoPaused)
  ), Ia = e.useRef(we);
  Ia.current = we;
  const nt = e.useRef(!1), Pn = e.useRef(0), Wt = e.useRef({}), [za, Na] = e.useState(0), mt = e.useRef(/* @__PURE__ */ new Set()), gt = (l) => {
    l && mt.current.add(l);
  }, Ht = e.useRef({}), [Oa, Ut] = e.useState(0), je = e.useRef({}), [ht, Ra] = e.useState(!1), $a = e.useRef(!1);
  $a.current = ht, e.useRef(!1);
  const Ma = async () => {
    try {
      const l = await hn(
        "",
        !0,
        V(i),
        St()
      );
      if (!l || !l.config) return;
      const p = l.config;
      Nr(p), p.mode !== void 0 && Pt(Et(p.mode)), typeof p.model_id == "string" && p.model_id && Nn(p.model_id), typeof p.with_context == "boolean" && Rn(p.with_context), typeof p.parallel == "boolean" && Mn(p.parallel), tt((g) => g + 1);
    } catch {
    }
  }, jr = e.useRef(!1), Jt = (l) => {
    if (l.mode !== void 0) {
      Pt(l.mode), or(
        { mode: l.mode },
        V(i),
        St()
      );
      try {
        localStorage.setItem(_s, sa + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    l.modelId !== void 0 && (p.model_id = l.modelId), l.withContext !== void 0 && (p.with_context = l.withContext), l.parallel !== void 0 && (p.parallel = l.parallel), Object.keys(p).length && (l.modelId !== void 0 && Nn(l.modelId), l.withContext !== void 0 && Rn(l.withContext), l.parallel !== void 0 && Mn(l.parallel), or(p, V(i), St()));
  }, Pr = (l) => {
    !l || l === Le || (Ft(l), Ee.current = l, He(i, { templateId: l }), or(
      { template_id: l },
      V(i),
      St()
    ), Ye(null), Re.current = {}, Se.current = {}, tt((p) => p + 1));
  }, Ba = async (l) => {
    const p = await Zs({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!p.ok) {
      M("error", p.error || "保存失败");
      return;
    }
    Ln(p.items || []), jn(null), M("success", "模板已保存");
  }, La = async (l) => {
    const p = await Qs(l);
    if (!p.ok) {
      M("warning", p.error || "删除失败");
      return;
    }
    Ln(p.items || []);
    const g = (p.items || []).map((u) => u.id);
    if (g.indexOf(Ee.current) === -1) {
      const u = g[0] || "";
      Ft(u), Ee.current = u, He(i, { templateId: u });
    }
    M("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    const l = (p) => {
      try {
        String(p && p.key || "") === _s && Ma();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [b, i]), e.useEffect(() => {
    if (b) return;
    let l = !0;
    return oi(), (async () => {
      const [p, g, u, w] = await Promise.all([
        Ks(),
        ii(),
        _r(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        hn(
          "",
          !0,
          V(i),
          St()
        )
      ]);
      if (!l) return;
      if (ba(p), Ln(u.items), w && w.config) {
        const A = w.config;
        Nr(A), A.mode !== void 0 && Pt(Et(A.mode)), typeof A.model_id == "string" && A.model_id && Nn(A.model_id), typeof A.with_context == "boolean" && Rn(A.with_context), typeof A.parallel == "boolean" && Mn(A.parallel), typeof A.template_id == "string" && A.template_id && (Ft(A.template_id), Ee.current = A.template_id);
      }
      const T = u.items.map((A) => A.id);
      if (!Ee.current || T.indexOf(Ee.current) === -1) {
        const A = u.defaultId || T[0] || "";
        A && (Ft(A), Ee.current = A);
      }
      if (w && w.config) {
        const A = w.config;
        ga(A.__follow_active__ === !0);
      }
      jr.current = !0, tt((A) => A + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    et.current = I;
  }, [I]);
  const Dn = async (l) => {
    if ($r) return;
    const p = I;
    Bn(!0), Be("");
    const g = typeof AbortController < "u" ? new AbortController() : null;
    ft.current = g;
    try {
      const u = await fetch(O("/question-modal/analyze"), {
        method: "POST",
        headers: R(),
        body: JSON.stringify({
          request_id: q,
          tool_call_id: i,
          session_id: V(i),
          title: k,
          questions: h,
          model_id: Rr,
          mode: l,
          with_context: On,
          parallel: $n,
          question_index: p,
          answers: D,
          template_id: Ee.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(se("model_timeout_sec", 120)) || 120
        }),
        signal: g ? g.signal : void 0
      }), w = await u.json().catch(() => ({})), T = w && w.analysis || null, A = T && T.error || w && w.error || "";
      w && w.cancelled || T && T.cancelled ? Be("已终止分析。") : !u.ok || !w || w.ok === !1 || T && T.ok === !1 ? Be(A || "分析失败（服务返回 " + u.status + "）") : T && (Re.current[p] = T, Se.current[p] = !0, et.current === p && Ye(T), M("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (u) {
      ft.current === g && g && g.signal.aborted || u && u.name === "AbortError" ? Be("已终止分析。") : Be("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      ft.current === g && (ft.current = null), Bn(!1), je.current[p] = !0, Ut((u) => u + 1);
    }
  }, ja = () => {
    const l = I;
    delete Re.current[l], Ye(null), Be(""), Dn("manual");
  }, rt = (l) => {
    var g;
    const p = l !== void 0 ? l : et.current;
    try {
      fetch(O("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: R(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: q,
          question_index: p
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
  }, Pa = () => {
    rt(), Be("已终止分析。");
  }, Da = () => {
    we ? (Ht.current = {}, je.current = {}, Se.current = {}, nt.current = !1, Lr(!1), tt((l) => l + 1), M("info", "已恢复自动答题")) : (rt(), Lr(!0), M("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = Re.current[I];
    Ye(l || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + I;
    let g = !0;
    return fetch(O("/question-modal/analysis") + p, { headers: R() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !g || !u || !u.found || !u.analysis || (Re.current[I] = u.analysis, et.current === I && Ye(u.analysis));
    }).catch(() => {
    }), () => {
      g = !1;
    };
  }, [i, I]), e.useEffect(() => {
    b || jr.current && Z === "ai" && ht && (!an(d) || !h.length || Se.current[I] || H || (Se.current[I] = !0, Dn("auto")));
  }, [
    b,
    Z,
    i,
    Sa,
    On,
    $n,
    h,
    I,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    ht
  ]);
  const Fa = () => {
    const l = Dt && Dt.per_question || [];
    if (!l.length) return;
    if (!l.some((g) => g.type === "multi" ? String(g.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(g.choice || "").trim().length > 0)) {
      M("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    U((g) => {
      const u = { ...g };
      return l.forEach((w) => {
        const T = `q${w.index}`;
        gt(T);
        const A = u[T] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const K = String(w.choice || "").split(/[、,，]/).map((G) => G.trim()).filter(Boolean);
          u[T] = { ...A, value: K };
        } else
          u[T] = { ...A, value: w.choice || A.value };
      }), u;
    }), M("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Pe = (l, p, g = !1) => {
    rt(), pa(l), Ke(!0), lt(p), Bt(!1), v(!0), ie(i), g && He(i, { backendReleased: !0 });
  }, Wa = async (l, p) => {
    const g = await cr(i, V(i));
    return g.ok ? (Pe(l, p, g.released), !0) : (Bt(!0), Wn(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const l = (p = It(i)) == null ? void 0 : p.answers;
    He(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: q,
      visStep: I,
      answers: ir(D, l, mt.current),
      finalOther: Qe,
      finalOtherAtt: ct,
      answered: b,
      skippedAll: pe,
      expanded: Mt,
      localResult: it,
      submittedAt: Ve,
      skipReason: Oe,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Cn,
      waitRetired: pt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: C,
      slowStep: L,
      slowFired: ke,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: ue,
      gateBlocked: $e,
      releasedNote: Ne,
      autoPaused: we,
      templateId: Le
    });
  }, [
    i,
    q,
    I,
    D,
    Qe,
    ct,
    b,
    pe,
    Mt,
    it,
    Ve,
    Oe,
    Cn,
    pt,
    C,
    L,
    ke,
    ue,
    we,
    Le,
    $e,
    Ne
  ]), e.useEffect(() => {
    if (!b || !Ve || pt || !ut.current) return;
    let l = 0, p = !1, g = bs(i);
    const u = () => {
      if (p) return;
      const w = Math.floor((Date.now() - Ve) / 1e3);
      if (w >= Or) {
        Me.current = !0, Lt(!0);
        return;
      }
      if (!Me.current) {
        const T = bs(i);
        T >= 0 && (g < 0 ? g = T : T - g >= Xo && (Me.current = !0));
      }
      if (!Me.current && w >= Qo && !jt.current && (jt.current = !0, In(!0)), Me.current) {
        l = setTimeout(
          () => {
            p || Lt(!0);
          },
          Math.max(1e3, (Or - w) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        p || ys(u);
      }, Hs);
    };
    return ys(u), () => {
      p = !0, clearTimeout(l);
    };
  }, [b, Ve, pt]);
  const [Fn, Wn] = e.useState(!1), [Hn, Dr] = e.useState(""), Fr = (l, p, g) => {
    l.length && (p === "final" ? Cr((u) => u.concat(l)) : U((u) => {
      const w = g || `q${I}`;
      gt(w);
      const T = u[w] || { type: "text", value: "", other: "" };
      return { ...u, [w]: { ...T, attachments: (T.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, w, T, A) => {
      Fr(u, w, T), A && A.length ? Dr(A.join("；")) : Dr("");
    }, p = (u) => Wn(u);
    dn.set(i, l), pn.set(i, p);
    const g = Ci(i);
    return g.length && g.forEach((u) => Fr([u.att], u.target, u.key)), Wn(kn > 0), () => {
      dn.get(i) === l && dn.delete(i), pn.get(i) === p && pn.delete(i);
    };
  }, [i, I]);
  const Un = (l, p) => Ti(i, l, p), Jn = (l, p, g) => {
    const u = Ii(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      ea(u, i, p, g);
    }
  };
  e.useEffect(() => {
    if (!f || _) return;
    let l = !0;
    return At(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Ke(!0);
      const g = String(p.skip_reason || "").trim();
      g && Xe((u) => u || g), E(Tt(h, p));
    }), () => {
      l = !1;
    };
  }, [f, i, _]), e.useEffect(() => {
    if (b || !i || x) return;
    let l = !0;
    return At(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Ke(!0);
      const g = String(p.skip_reason || "").trim();
      g && Xe((u) => u || g), E((u) => u || Tt(h, p)), lt(Tt(h, p)), v(!0), ie(i);
    }), () => {
      l = !1;
    };
  }, [i, b, x]), e.useEffect(() => {
    if (b) return;
    let l = !0, p = 0, g = 0, u = 0, w = !1, T = !1, A = 0, K = 0;
    Tn.current || (Tn.current = Date.now());
    let G = !!Ot(i), me = !1;
    const ce = (N) => {
      !l || !N || !N.request_id || (G = !0, g = 0, u = 0, w = !1, S(N.request_id), Bt(!1), A && (clearTimeout(A), A = 0), ji(
        i,
        N.request_id,
        N.session_id || _n(),
        N.agent_id
      ));
    }, ee = (N) => {
      l && (A && (clearTimeout(A), A = 0), K && (clearTimeout(K), K = 0), Wa(
        N,
        N === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, vt = Ot(i), We = async () => {
      if (!vt) return !1;
      const N = await Di(vt.request_id);
      if (!l) return !0;
      if (N.kind === "found") {
        const ae = N.data;
        return ae.tool_call_id && i && ae.tool_call_id !== i ? (ie(i), !1) : (ce(ae), !0);
      }
      return N.kind === "orphan" ? (ee("orphan"), !0) : (N.kind === "absent" && ie(i), !1);
    }, ge = (N = !1) => {
      if (l) {
        if (p += 1, N || (g += 1, u || (u = Date.now())), N) {
          if (!me) {
            me = !0, At(i).then((te) => {
              if (l) {
                if (te) {
                  te.kind === "skipped" && !te.answers && Ke(!0);
                  const qt = String(te.skip_reason || "").trim();
                  qt && Xe((tr) => tr || qt), E(Tt(h, te)), lt(Tt(h, te)), v(!0), ie(i);
                  return;
                }
                ge(!0);
              }
            });
            return;
          }
          if (G) {
            ee("gone");
            return;
          }
          const ae = Date.now() - (Tn.current || Date.now());
          if (p >= 12 && ae >= Ri) {
            ee("gone");
            return;
          }
        }
        if (g >= ta) {
          if (Date.now() - (u || Date.now()) >= ra) {
            if (w = !0, !T) {
              T = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !w) return;
                    w = !1, g = 0, u = 0, p = 0, X();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          A = setTimeout(X, na);
          return;
        }
        A = setTimeout(X, p < Mi ? $i : 5e3);
      }
    }, xe = () => {
      _i(i, V(i)).then((N) => {
        if (l) {
          if (N.kind === "found") {
            ce(N.data);
            return;
          }
          if (N.kind === "orphan") {
            ee("orphan");
            return;
          }
          if (N.kind === "error") {
            ge(!1);
            return;
          }
          Ni(V(i)).then((ae) => {
            if (l) {
              if (ae) {
                if (ae.tool_call_id && i && ae.tool_call_id !== i) {
                  At(i).then((te) => {
                    if (l) {
                      if (te) {
                        v(!0), ie(i);
                        return;
                      }
                      ge(!0);
                    }
                  });
                  return;
                }
                ce(ae);
                return;
              }
              At(i).then((te) => {
                if (l) {
                  if (te) {
                    te.kind === "skipped" && !te.answers && Ke(!0);
                    const qt = String(te.skip_reason || "").trim();
                    qt && Xe((tr) => tr || qt), v(!0), ie(i);
                    return;
                  }
                  ge(!0);
                }
              });
            }
          });
        }
      });
    }, X = () => {
      if (l) {
        if (!vt) {
          xe();
          return;
        }
        We().then((N) => {
          !l || N || xe();
        });
      }
    };
    return K = setTimeout(() => {
      l && Bt(!0);
    }, Oi), X(), () => {
      l = !1, A && clearTimeout(A), K && clearTimeout(K);
    };
  }, [b, i]);
  const Wr = async () => {
    ze(!0);
    try {
      const l = V(i);
      let p = await cr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await qs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const u = p.reason === "host-stop";
        Pe(
          p.reason === "orphan" ? "orphan" : "",
          p.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), M(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        Pe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), M("info", "本次问卷已失效，已关闭");
    } catch (l) {
      M("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ze(!1);
    }
  }, Hr = async () => {
    ze(!0);
    try {
      const l = V(i);
      let p = await cr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await qs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        En(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), M("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const u = p.reason === "host-stop";
        En(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), M("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        En("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), M("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      M("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ze(!1);
    }
  }, Gt = Ae(h, D), De = Gt.length, ye = I >= De, Q = ye ? -1 : Gt[I], bt = ye ? De : I;
  e.useEffect(() => {
    if (Et(se("mode", "manual")) !== "manual") return;
    const p = String(se("notify_channel", "off") || "off"), g = !!se("notify_manual_mode", !1);
    if (p === "off" && !g || b || pe || ue || !an(d) || !h.length) return;
    const u = Ae(h, D).filter((w) => !ot(D[`q${w}`])).length;
    Zo(i, k, u);
  }, [zn, b, pe, ue, bt]);
  const Zt = Math.max(0, Number(se("slow_question_sec", Ko)) || 0) * 1e3, Ha = Math.round(Zt / 1e3);
  e.useEffect(() => {
    if (b || pe || ue || Zt <= 0) return;
    if (L !== bt) {
      J(bt), P(Date.now()), Ie(!1);
      return;
    }
    if (!C) {
      P(Date.now());
      return;
    }
    if (ke) return;
    const l = C + Zt - Date.now();
    if (l <= 0) {
      Ie(!0);
      return;
    }
    let p = !1;
    const g = setTimeout(() => {
      p || Ie(!0);
    }, l);
    return () => {
      p = !0, clearTimeout(g);
    };
  }, [b, pe, ue, bt, L, C, ke, Zt]);
  const fe = Q >= 0 ? h[Q] : null, st = `q${Q}`, W = Q >= 0 && D[st] || { type: re(fe), value: re(fe) === "multi" ? [] : "", other: "" }, at = (l) => {
    var u;
    $e && dt(""), Q >= 0 && gt(`q${Q}`);
    const p = { ...D, [st]: { ...l, skipped: !1 } }, g = Ae(h, p);
    h.forEach((w, T) => {
      g.indexOf(T) === -1 && delete p[`q${T}`];
    }), He(i, {
      answers: ir(p, (u = It(i)) == null ? void 0 : u.answers, mt.current)
    }), U(p);
  };
  e.useEffect(() => {
    I > De && $(De);
  }, [De, I]);
  const Gn = async (l, p) => {
    const g = await fetch(O(l), {
      method: "POST",
      headers: R(),
      body: JSON.stringify(p)
    }), u = await g.json().catch(() => ({}));
    if (!g.ok) {
      const w = new Error(u && u.detail || "HTTP " + g.status);
      throw w.status = g.status, w;
    }
    return u;
  }, Zn = () => {
    var l;
    return Wi(ir(
      D,
      (l = It(i)) == null ? void 0 : l.answers,
      mt.current
    ));
  }, Ua = () => !!se("gate_unsaved", !0), Ur = (l, p) => {
    if (!Ua()) return [];
    const g = [];
    if (typeof p == "number")
      return Ae(h, l).indexOf(p) !== -1 && !ot(l[`q${p}`]) && g.push(p + 1), g;
    const u = new Set(Ae(h, l));
    return h.forEach((w, T) => {
      u.has(T) && !ot(l[`q${T}`]) && g.push(T + 1);
    }), g;
  }, Jr = (l, p, g) => {
    const u = "第 " + l.join("、") + " 题", w = g === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    dt("⛔ " + u + "尚未选择。" + w);
    const T = Ae(h, p).length;
    Gn("/question-modal/gate-block", {
      request_id: q,
      tool_call_id: i,
      session_id: V(i),
      missing: l,
      answered: T - l.length,
      total: T,
      bundle: gs
    }).catch(() => {
    });
  }, Qt = async (l, p = !1) => {
    if (!q)
      return M("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const g = Zn();
    if (!p) {
      const u = Ur(g);
      if (u.length)
        return Jr(u, g, "提交"), "blocked";
      dt("");
    }
    ze(!0);
    try {
      const u = await Gn("/question-modal/answer", {
        request_id: q,
        session_id: V(i),
        answers: g,
        other: Qe,
        attachments: ct
      });
      return u && u.orphan ? (fetch(
        O("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(V(i)),
        { method: "POST", headers: R() }
      ).catch(() => {
      }), Pe(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), M("info", "本次问卷已失效，已关闭"), "sent") : (ie(i), lt(Fi(h, g, Qe, ct)), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, ut.current = !0, v(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Pe(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), M("info", "本次问卷已失效，已关闭"), "blocked") : (M("error", "提交失败: " + u.message), p ? (nt.current = !1, Pn.current += 1, Pn.current >= nr && M(
        "warning",
        "自动提交连续失败 " + nr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Ut((w) => w + 1), "not-ready") : "blocked");
    } finally {
      ze(!1);
    }
  }, Gr = () => se("skip_mode", "per_question") === "whole", Ja = () => {
    Q < 0 || ($e && dt(""), rt(et.current), Se.current[et.current] = !0, gt(`q${Q}`), U((l) => {
      const p = { ...l };
      p[`q${Q}`] = {
        type: (l[`q${Q}`] || {}).type || re(fe),
        value: ((l[`q${Q}`] || {}).type || re(fe)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const g = Ae(h, p);
      return h.forEach((u, w) => {
        g.indexOf(w) === -1 && delete p[`q${w}`];
      }), p;
    }), $((l) => l + 1));
  }, Ga = () => {
    if (ye) {
      Qt();
      return;
    }
    const l = Zn(), p = Ur(l, Q);
    if (p.length) {
      Jr(p, l, "下一步");
      return;
    }
    $e && dt(""), $((g) => g + 1);
  }, Za = async () => {
    if (!q) {
      M("warning", "问卷尚未就绪，请稍候");
      return;
    }
    rt(), ze(!0);
    try {
      const l = await Gn("/question-modal/skip", {
        request_id: q,
        session_id: V(i)
      });
      if (l && l.orphan) {
        Pe(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), M("info", "本次问卷已失效，已关闭");
        return;
      }
      M("info", "已跳过问卷"), ie(i), Ke(!0), Xe("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), lt("用户跳过了本次问卷。"), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, ut.current = !0, v(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Pe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), M("info", "本次问卷已失效，已关闭");
        return;
      }
      M("error", "跳过失败: " + l.message);
    } finally {
      ze(!1);
    }
  };
  e.useEffect(() => {
    if (b || Z !== "ai" && Z !== "recommend" || we || (Z === "recommend" || Z === "ai") && !ht || !an(d) || !h.length || H) return;
    if (ye) {
      if (nt.current || Pn.current >= nr) return;
      const G = Zn();
      if (!Gt.every(
        (ce, ee) => !!je.current[ee] || ot(G[`q${ce}`])
      ) || !q) return;
      nt.current = !0, Qt(void 0, !0).then((ce) => {
        ce === "not-ready" && (nt.current = !1);
      });
      return;
    }
    const l = I;
    if (Ht.current[l] || Z === "ai" && !je.current[l]) return;
    const p = Gt[l], g = h[p], u = re(g), w = xs(g), T = ks(Re.current[l], p);
    if (Z === "ai" && !je.current[l]) return;
    Ht.current[l] = !0;
    const A = w.length ? w.join("、") : T, K = !!A;
    gt(`q${p}`), K || (Wt.current[p] = !0, Na((G) => G + 1), M("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), U((G) => {
      const me = { ...G }, ce = `q${p}`, ee = me[ce] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!K)
        me[ce] = {
          ...ee,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const We = g.options || [], ge = (X) => String(X).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), xe = A.split(/[、,，]/).map((X) => ge(X)).filter(Boolean).map((X) => {
          const N = We.find((ae) => he(ae) === X || _e(ae) === X);
          return N ? he(N) : X;
        });
        me[ce] = {
          ...ee,
          type: u,
          value: xe,
          other: xe.length === 1 && xe[0] === le ? ee.other : "",
          attachments: xe.length === 1 && xe[0] === le ? ee.attachments : []
        };
      } else if (u === "single") {
        const We = g.options || [], ge = (N) => String(N).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), xe = We.find((N) => he(N) === A || _e(N) === A) || We.find((N) => he(N) === ge(A) || _e(N) === ge(A)), X = xe ? he(xe) : A;
        me[ce] = {
          ...ee,
          type: u,
          value: X,
          other: String(X) === le ? ee.other : "",
          attachments: String(X) === le ? ee.attachments : []
        };
      } else
        me[ce] = { ...ee, type: u, value: A };
      const vt = Ae(h, me);
      return h.forEach((We, ge) => {
        vt.indexOf(ge) === -1 && delete me[`q${ge}`];
      }), me;
    }), Se.current[l] = !0, je.current[l] = !0, $((G) => G + 1), Ut((G) => G + 1);
  }, [
    b,
    Z,
    we,
    H,
    i,
    I,
    Oa,
    De,
    d,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    q,
    ht
  ]);
  const yt = e.useRef(!1), Fe = e.useRef(0), xt = e.useRef(!1), Te = e.useRef({});
  e.useEffect(() => {
    if (b || !i) return;
    let l = !0;
    const p = (u) => {
      if (!(!l || !u)) {
        yt.current = !0, xt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!h || h.length), u.answers && typeof u.answers == "object" && (U((T) => {
            const A = { ...T };
            return Object.keys(u.answers).forEach((K) => {
              const G = u.answers[K];
              !G || typeof G != "object" || mt.current.has(K) || (A[K] = {
                ...A[K] || { type: "single", value: "", other: "" },
                ...G
              });
            }), A;
          }), He(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && $(u.cursor), typeof u.mode == "string" && u.mode) {
            const T = Et(u.mode);
            Pt((A) => A === T ? A : T);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((T) => {
            const A = parseInt(T, 10);
            !isNaN(A) && u.per_question[T] && (Re.current[A] = u.per_question[T]);
          }), u.status === "submitted" && (An((T) => T || Date.now()), u.released && He(i, { backendReleased: !0 }), v(!0), ie(i));
          const w = String(u.skip_reason || "").trim();
          w && Xe((T) => T || w), typeof u.mode == "string" && u.mode && (Te.current.mode = Et(u.mode)), Object.keys(u.answers || {}).forEach((T) => {
            Te.current["a:" + T] = JSON.stringify(u.answers[T] || {});
          }), typeof u.cursor == "number" && (Te.current.cursor = "c:" + u.cursor), xt.current = !0, Ut((T) => T + 1);
        } finally {
          setTimeout(() => {
            yt.current = !1;
          }, 0);
        }
      }
    };
    li(i).then((u) => {
      !l || !u || !u.found || !u.state || (Fe.current = Math.max(Fe.current, u.rev), p(u.state));
    });
    const g = ci(i, {
      onSnapshot: (u, w) => {
        Fe.current = Math.max(Fe.current, u), w && p(w);
      },
      onChange: (u) => {
        const w = parseInt(u.rev || 0, 10) || 0;
        w && w <= Fe.current && u.origin !== wn() || (Fe.current = Math.max(Fe.current, w), !(u.origin && u.origin === wn()) && p(u.state));
      },
      onStatus: (u) => {
        l && Ra((w) => w === !u ? w : !u);
      }
    });
    return () => {
      l = !1, g();
    };
  }, [b, i]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Object.keys(D || {}).forEach((l) => {
      const p = JSON.stringify(D[l] || {});
      Te.current["a:" + l] !== p && (Te.current["a:" + l] = p, sn(
        i,
        "set_answer",
        { key: l, answer: D[l] }
      ));
    });
  }, [b, i, JSON.stringify(D)]), e.useEffect(() => {
    if (b || !i || yt.current || !xt.current) return;
    const l = "c:" + I;
    Te.current.cursor !== l && (Te.current.cursor = l, sn(i, "goto", { cursor: I }));
  }, [b, i, I]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Te.current.mode !== Z && (Te.current.mode = Z, sn(i, "set_mode", { mode: Z }));
  }, [b, i, Z]);
  const Kt = {
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
  }, Kn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Xt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Xn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Zr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Vn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Qa = { display: "flex", flexDirection: "column", gap: 8 }, Vt = {
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
  }, Ka = {
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
  }, Qr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Yn,
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
  }, Xa = { height: 32, fontSize: 13, borderRadius: 8 }, Xr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Vr = (l) => {
    const p = he(l);
    return W.type === "multi" ? Array.isArray(W.value) && W.value.indexOf(p) !== -1 : W.value === p;
  }, Yr = Vr(le), es = (l) => {
    if (b || H) return;
    const p = he(l);
    if (W.type === "multi") {
      const g = Array.isArray(W.value) ? W.value.slice() : [], u = g.indexOf(p);
      u === -1 ? g.push(p) : g.splice(u, 1);
      const w = g.length === 1 && g[0] === le;
      at({
        ...W,
        value: g,
        other: w ? W.other : "",
        attachments: w ? W.attachments : []
      });
    } else {
      const g = p === le;
      at({
        ...W,
        value: p,
        other: g ? W.other : "",
        attachments: g ? W.attachments : []
      });
    }
  }, Va = !!se("show_recommend_badge", !0), ts = se("badge_position", "left") === "right", Ya = se("badge_style", "rect") === "round", ns = (l) => l && Va ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Ya ? { ...Kr, borderRadius: 999 } : Kr
  }, "AI 推荐") : null, eo = !!se("auto_number_options", !0), to = !!se("highlight_recommended", !1), no = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, rs = (l, p, g, u, w, T) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: b || H,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: w && to ? { ...p ? Qr : Yn, ...no } : p ? Qr : Yn,
      onClick: g
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    ts ? null : ns(w),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (T && eo ? T + ". " : "") + l),
    ts ? ns(w) : null
  );
  if (!b && !an(d))
    return e.createElement(
      "div",
      { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Qn, className: "qm-header" },
        e.createElement(
          "div",
          { style: Kn },
          rr(e),
          e.createElement("span", { style: Xt, className: "qm-title" }, k)
        ),
        e.createElement("span", { style: Xn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Zr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      zr ? e.createElement(
        "div",
        { style: Vt },
        e.createElement("button", {
          type: "button",
          disabled: H,
          style: { ...kt, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Wr
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = () => {
      const g = ti({
        submittedAt: Ve,
        deadReason: ue,
        releasedNote: Ne,
        skippedAll: pe,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: pt,
        pastSoft: Cn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!ut.current
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
      }, ei(g.phase)) : null;
    }, p = !!ut.current;
    return pe && !Mt ? e.createElement(
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
        ue ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      Oe ? e.createElement("span", {
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
        title: Oe
      }, Oe) : null,
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
          ...Xt,
          flex: Ne || Oe ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      Ne ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Ne) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...kt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Ir(!0)
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
        disabled: H,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...kt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Hr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Qn, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Kn },
          rr(e),
          e.createElement("span", { style: Xt }, k)
        ),
        e.createElement(
          "span",
          { style: { ...Xn, color: ue ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          ue ? "已失效" : pe ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      pe && (Oe || ue) ? e.createElement(
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
        String(Oe || ue || "问卷已失效/跳过")
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
      }, pe ? it ? it + `

` + un(h) : `已跳过本次问卷。

` + un(h) : it || _ || x || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + un(h)),
      pe && Mt ? e.createElement(
        "div",
        { style: Vt },
        e.createElement("button", {
          type: "button",
          style: kt,
          onClick: () => Ir(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Vt, marginTop: 8, gap: 10 } },
        Ne ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Ne) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: H,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...kt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Hr
        }, "释放阻塞") : null
      )
    );
  }
  const ss = ke && L === bt, as = !b && !ye && za >= 0 && Wt.current[Q] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, os = Object.keys(Wt.current).map((l) => Number(l)).filter((l) => Wt.current[l] && Number.isFinite(l)).sort((l, p) => l - p), ro = ye && os.length ? e.createElement("div", {
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
  if (ye)
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Vn }, "其他意见（可选）"),
      ro,
      e.createElement(a, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Qe,
        style: Xr,
        onChange: (l) => da(l.target.value),
        onPaste: (l) => Jn(l, "final", "final")
      }),
      dr({
        R: e,
        files: ct,
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("final", "final"),
        onRemove: (l) => Cr((p) => p.filter((g, u) => u !== l))
      })
    );
  else if (fe && re(fe) === "text")
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Vn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      as,
      e.createElement(a, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof W.value == "string" ? W.value : "",
        style: Xr,
        onChange: (l) => at({ ...W, value: l.target.value, other: "" }),
        onPaste: (l) => Jn(l, "q", st)
      }),
      dr({
        R: e,
        files: W.attachments || [],
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("q", st),
        onRemove: (l) => at({
          ...W,
          attachments: (W.attachments || []).filter((p, g) => g !== l)
        })
      })
    );
  else if (fe) {
    const l = xs(fe), p = ks(Dt, Q), g = l.length ? l : p ? [p] : l, u = (fe.options || []).map((w, T) => rs(
      _e(w),
      Vr(w),
      () => es(w),
      "o" + T,
      hi(fe, w, g),
      T + 1
    ));
    u.push(rs("其他", Yr, () => es(le), "other")), Yr && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: W.other,
      style: { ...Xa, marginTop: 2 },
      onChange: (w) => at({ ...W, other: w.target.value }),
      onPaste: (w) => Jn(w, "q", st)
    })), u.push(dr({
      R: e,
      files: W.attachments || [],
      disabled: b || H,
      uploading: Fn,
      error: Hn,
      onPick: () => Un("q", st),
      onRemove: (w) => at({
        ...W,
        attachments: (W.attachments || []).filter((T, A) => A !== w)
      })
    }))), en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Vn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      as,
      e.createElement("div", { style: { ...Qa, marginTop: 8 } }, u)
    );
  }
  const er = De + 1, so = ye ? er + "/" + er : I + 1 + "/" + er, wt = {
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
    { style: Kt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Qn, className: "qm-header" },
      e.createElement(
        "div",
        { style: Kn },
        rr(e),
        e.createElement("span", { style: Xt, className: "qm-title" }, k)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        Hi({
          R: e,
          providers: ha,
          modelId: Rr,
          disabled: b || H,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: wa,
          onOpenChange: va,
          tab: qa,
          onTabChange: _a,
          onChange: (l) => {
            Jt({ modelId: l }), Ye(null), Re.current = {}, Se.current = {}, tt((p) => p + 1);
          }
        }),
        Ji({
          R: e,
          templates: Mr,
          value: Le,
          open: Ea,
          onOpenChange: Ta,
          disabled: b || H,
          onSelect: Pr,
          onManage: () => Br(!0)
        }),
        Ui({
          R: e,
          mode: Z,
          disabled: b || H,
          onChange: (l) => {
            Jt({ mode: l }), l === "ai" && (Se.current = {}), l === "ai" || l === "recommend" ? (Ht.current = {}, je.current = {}, nt.current = !1, tt((p) => p + 1)) : rt();
          }
        }),
        Zi({
          R: e,
          busy: $r,
          result: Dt,
          error: ya,
          mode: Z,
          disabled: b || H,
          open: xa,
          onOpenChange: ka,
          onRun: () => {
            Dn("manual");
          },
          onRerun: ja,
          onApply: Fa,
          onCancel: Pa,
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
                checked: On,
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
          onClick: Da,
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
        e.createElement("span", { style: Xn, key: "qm-step" }, so)
      )
    ),
    e.createElement("div", { style: Zr }, en),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Gi({
      R: e,
      open: Aa,
      templates: Mr,
      value: Le,
      edit: Ca,
      onEditChange: jn,
      onClose: () => {
        Br(!1), jn(null);
      },
      onSelect: (l) => Pr(l),
      onSave: Ba,
      onDelete: La
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
    (ss || zr && !q) && !b ? e.createElement(
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
        (ss ? "⚠️ 本题已超过 " + Ha + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (q ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
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
        onClick: Wr,
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
      "data-qm-bundle": gs
    }, $e) : null,
    e.createElement(
      "div",
      { style: Vt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: I === 0 || H,
        style: { ...wt, marginRight: "auto", opacity: I === 0 ? 0.5 : 1 },
        onClick: () => $((l) => l - 1)
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
          onClick: ye ? () => Qt(void 0, !0) : Gr() ? () => Qt(void 0, !0) : Ja
        },
        ye || Gr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: wt,
        onClick: Za
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: Ka,
        onClick: Ga
      }, ye ? "提交" : "下一步")
    )
  );
}
const Ss = 12;
let Es = 0;
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
  notifyTesting: "",
  notifyMsg: {},
  notifyLog: {},
  stale: { rows: [], scanned: !1, busy: !1, msg: "", msgKind: "info" }
};
let Ct = null;
function Y(n, e, t) {
  if (n in c.draft) return c.draft[n];
  if (t === "global") {
    const a = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return a && n in a ? a[n] : e;
  }
  const r = c.cfg && c.cfg.config, s = c.cfg && c.cfg.sessionConfig;
  if (s) {
    if (n in s) return s[n];
    const a = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return a && n in a ? a[n] : e;
  }
  return r && n in r && c.cfg && c.cfg.has_session === !0 ? r[n] : (r && n in r && !(c.cfg && c.cfg.has_session), e);
}
function Ki(n) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const t = e.__sources__, r = e[n];
  return !!(t && t[n] === "session" && (r === "" || r === null));
}
function oe(n, e) {
  let t;
  const r = c.cfg;
  if (c.scope === "global") {
    const s = r && r.globalConfig || c.globalCfg || {};
    t = n in s ? s[n] : void 0;
  } else {
    const s = r && r.sessionConfig;
    if (s)
      if (n in s)
        t = s[n];
      else {
        const a = r && r.globalConfig || c.globalCfg || {};
        t = n in a ? a[n] : void 0;
      }
    else {
      const a = r && r.config;
      t = a && n in a ? a[n] : void 0;
    }
  }
  t === e ? delete c.draft[n] : c.draft[n] = e, c.saveMsg = "", z();
}
function Ts() {
  return Object.keys(c.draft).length;
}
async function Tr() {
  try {
    const n = await fetch(O("/question-modal/prefs"), { headers: R() });
    if (!n.ok) return;
    const e = await n.json(), t = e && e.prefs || {};
    c.globalCfg = t && typeof t == "object" ? t : {};
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function aa() {
  try {
    const n = await fetch(O("/question-modal/notify/channels"), {
      headers: R()
    });
    if (!n.ok) return;
    const e = await n.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off");
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function Ar(n) {
  if (!(!n || n === "off"))
    try {
      const e = await fetch(
        O("/question-modal/notify/test-log?channel=" + encodeURIComponent(n)),
        { headers: R() }
      );
      if (!e.ok) return;
      const t = await e.json();
      c.notifyLog = {
        ...c.notifyLog,
        [n]: Array.isArray(t && t.items) ? t.items : []
      };
      try {
        z();
      } catch {
      }
    } catch {
    }
}
async function Xi(n) {
  if (!n || n === "off") return;
  c.notifyTesting = n, c.notifyMsg = { ...c.notifyMsg, [n]: "发送中…" };
  try {
    z();
  } catch {
  }
  let e = "", t = null;
  try {
    t = await (await fetch(O("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...R(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: n })
    })).json().catch(() => ({})), t && t.delivered ? e = t.note ? "✓ 已发送（" + t.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (t && (t.error || t.reason) || "测试失败");
  } catch (s) {
    e = "✗ 请求失败：" + String(s && s.message || s);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [n]: e };
  const r = t && Array.isArray(t.history) ? t.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [n]: r }), await aa(), r || await Ar(n);
  try {
    z();
  } catch {
  }
}
async function Vi() {
  if (c.saving) return;
  const n = Object.keys(c.draft), e = c.scope === "session", t = {};
  if (n.forEach((r) => {
    t[r] = c.draft[r];
  }), !n.length && !e) {
    const r = c.globalCfg || {};
    Object.keys(r).forEach((s) => {
      s in t || (t[s] = r[s]);
    });
  }
  n.length, c.saving = !0, c.saveMsg = "", z();
  try {
    let r = "/question-modal/prefs", s = t;
    e && (r = "/question-modal/session-prefs", s = {
      chat_id: c.chatId,
      session_id: c.sessionId,
      agent_id: c.agentId,
      settings: t,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: c.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const a = await fetch(O(r), {
      method: "POST",
      headers: R(),
      body: JSON.stringify(s)
    }), o = await a.json().catch(() => ({}));
    if (!a.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + a.status + "）", z();
      return;
    }
    c.saving = !1, c.draft = {}, Js();
    const d = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", d.length) {
      const x = (m) => {
        try {
          const b = new Date(m * 1e3), v = (_) => _ < 10 ? "0" + _ : String(_);
          return b.getMonth() + 1 + "-" + v(b.getDate()) + " " + v(b.getHours()) + ":" + v(b.getMinutes()) + ":" + v(b.getSeconds());
        } catch {
          return "";
        }
      }, h = d.reduce(
        (m, b) => Math.max(m, Number(b && b.at) || 0),
        0
      ), k = d.map((m) => String(m && m.key || "")).filter(Boolean);
      c.conflictNote = "设置已于 " + x(h) + " 被其它位置修改，本次已按后写入的值覆盖" + (k.length ? "（" + k.join("、") + "）" : "") + "。";
    }
    try {
      const x = o && o.key_ts || {};
      x && typeof x == "object" && (c.keyTs = Object.assign({}, c.keyTs, x));
    } catch {
    }
    e || Tr();
    const y = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let f = "";
    if (y && (f = e ? "session" : "default"), f === "default") {
      try {
        const x = await fetch(O("/question-modal/session-prefs"), {
          method: "POST",
          headers: R(),
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
        x.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + x.status + "），本会话仍在会话模式。", f = "");
      } catch (x) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (x && x.message ? x.message : x) + "，本会话仍在会话模式。", f = "";
      }
      c.keyTs = {};
    }
    if (f && (c.scopeChoice = f, c.tab = f, c.scope = f === "session" ? "session" : "global"), f === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (f === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const x = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + x + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    hn(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((x) => {
      x && (c.cfg = x);
      try {
        z();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    c.saving = !1, c.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    z();
  } catch {
  }
}
function oa() {
  c.draft = {}, c.saveMsg = "";
}
function ia() {
  _r().then((n) => {
    c.templates = (n && n.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
  });
}
function Yi() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", z();
}
function el(n) {
  const e = c.templates.filter((t) => t.id === n)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", z());
}
function As(n, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([n + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[n] = e, z());
}
function tl() {
  c.tplEdit = null, z();
}
async function nl() {
  const n = c.tplEdit;
  if (!n || c.tplBusy) return;
  try {
    const s = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    s && typeof s.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((a) => {
      const o = s.querySelector('[data-qm-tpl-field="' + a + '"]');
      o && typeof o.value == "string" && o.value !== "" && (n[a] = o.value);
    });
  } catch {
  }
  const e = String(n.name || "").trim();
  if (!e) {
    c.saveMsg = "模板名称不能为空", z();
    return;
  }
  c.tplBusy = !0, z();
  const t = {
    id: n.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: n.system_prompt,
    user: n.user_prompt
  }, r = await Zs(t);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), z();
    return;
  }
  c.tplEdit = null, c.saveMsg = n.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", ia(), z();
}
async function rl(n) {
  const e = c.templates.filter((s) => s.id === n)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || n) + "」？") : !1)) return;
  const r = await Qs(n);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), z();
    return;
  }
  c.saveMsg = "模板已删除", ia(), z();
}
function sl() {
  c.visible = !0, c.chatId = "", c.sessionId = _n(), c.cfg = null, c.cfgError = "", al(), c.agentId = qn || (() => {
    try {
      return be().getSelectedAgentId ? be().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Js();
  const n = ++Es;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", z(), la(() => {
    if (n !== Es) return;
    const t = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = t, c.tab = t === "session" ? "session" : "default", c.scope = t === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", z(), (c.tab === "global" || c.tab === "default") && Tr(), aa().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && Ar(r);
    });
  });
}
let on = !1;
function al() {
  on || (on = !0, Promise.all([Ks(), _r()]).then((n) => {
    on = !1;
    const e = n[0] || [], t = n[1] || {};
    c.providerGroups = e.map((r) => {
      const s = String(r && (r.id || r.provider_id) || ""), o = (r && r.models || []).concat(r && r.extra_models || []).filter(Boolean).map((d) => {
        const i = typeof d == "string" ? d : d && (d.name || d.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: s,
        name: String(r && (r.name || r.title) || s),
        models: o
      };
    }).filter((r) => r.id && r.models.length > 0), c.modelOptions = c.providerGroups.flatMap((r) => r.models.map((s) => r.id + ":" + s)), c.templates = (t.items || []).filter((r) => r && r.id), c.templateOptions = c.templates.map((r) => r.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
    on = !1;
  }));
}
function ol(n) {
  const e = String(n || ""), t = e.indexOf(":");
  return t <= 0 ? { provider: "", model: e } : { provider: e.slice(0, t), model: e.slice(t + 1) };
}
let pr = !1, ln = "";
const ur = [];
function la(n) {
  const e = c.chatId, t = (e || "") + "|" + (c.sessionId || "");
  if (pr && ln === t) {
    n && ur.push(n);
    return;
  }
  pr = !0, ln = t;
  const r = () => {
    ln === t && (pr = !1, ln = "");
    const s = ur.splice(0);
    try {
      s.forEach((a) => a());
    } catch {
    }
  };
  n && ur.push(n), hn(
    e,
    !0,
    c.sessionId,
    c.agentId
  ).then((s) => {
    if (c.chatId !== e) {
      r();
      return;
    }
    s ? (c.cfg = s, c.cfgError = "") : (c.cfgError = "读取配置失败（后端不可达）", c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global")), r();
    try {
      z();
    } catch {
    }
  }).catch(() => {
    c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global", c.cfgError = "读取配置失败（网络异常）"), r();
    try {
      z();
    } catch {
    }
  });
}
function z() {
  const n = be().React, e = be().ReactDOM;
  if (n) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
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
        c.visible = !1;
      }
      return;
    }
    Ct || (Ct = document.createElement("div"), Ct.id = "qm-settings-root", document.body.appendChild(Ct)), e.render(n.createElement(ul, {
      R: n,
      open: c.visible,
      onClose: () => {
        if (Ts() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          oa();
        }
        c.visible = !1, c.saveMsg = "", z();
      },
      tab: c.tab,
      onTabChange: (t) => {
        c.tab = t, (t === "session" || t === "default") && (c.scopeChoice = t), c.scope = ca(t) ? "session" : "global", c.saveMsg = "", c.draft = {}, z(), la(), (t === "global" || t === "default") && Tr();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: Ts(),
      saving: c.saving,
      saveMsg: c.saveMsg,
      conflictNote: c.conflictNote,
      modelOptions: c.modelOptions,
      templateOptions: c.templateOptions,
      providerGroups: c.providerGroups,
      templates: c.templates,
      tplEdit: c.tplEdit,
      tplBusy: c.tplBusy
    }), Ct);
  }
}
function il(n) {
  const { R: e, onOpen: t } = n, r = Ce(), s = r && r.Button, a = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, d = { title: a, "aria-label": a }, i = {
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
  }, y = e.createElement("svg", i, [
    e.createElement("path", {
      key: 1,
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }),
    e.createElement("polyline", { key: 2, points: "14 2 14 8 20 8" }),
    e.createElement("line", { key: 3, x1: 16, y1: 13, x2: 8, y2: 13 }),
    e.createElement("line", { key: 4, x1: 16, y1: 17, x2: 8, y2: 17 }),
    e.createElement("polyline", { key: 5, points: "10 9 9 9 8 9" })
  ]);
  return y ? s ? e.createElement(s, {
    type: "text",
    size: "small",
    style: o,
    onClick: t,
    title: d.title,
    "aria-label": d["aria-label"]
  }, y) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: t,
    title: d.title,
    "aria-label": d["aria-label"]
  }, y) : s ? e.createElement(
    s,
    { type: "text", size: "small", style: o, onClick: t },
    a
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: t },
    a
  );
}
const fr = [
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
], ca = (n) => n === "session";
function ll(n, e, t) {
  return t !== "readonly" ? null : n.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function cl(n, e) {
  return e === "readonly" ? !0 : n === "session" && e === "global";
}
function dl(n, e) {
  const t = c.notifyChannels || [], r = String(c.notifyCurrent || "off"), s = String(Y("notify_channel", "off", "global") || r || "off"), o = ((_) => t.filter((E) => String(E.channel) === _)[0])(s), d = t.map((_) => {
    const E = String(_.channel || ""), q = String(_.label || E), S = _.ready !== !1, I = _.verified === !0 || E === "off";
    let $ = "";
    return S ? I || ($ = "（待测试）") : $ = "（不可用）", { value: E, label: q + $, disabled: !S };
  });
  d.length || d.push({ value: "off", label: "关闭", disabled: !1 });
  const i = !o || o.ready !== !1, y = s !== "off" && s !== "browser", f = c.notifyTesting === s, x = o && o.last_test || null, h = c.notifyMsg[s] || "", k = [
    n.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: s,
      "data-qm-notify-select": "1",
      style: { flex: "0 0 auto" },
      onChange: (_) => {
        const E = _ && _.target ? String(_.target.value) : "off";
        oe("notify_channel", E), Ar(E);
      }
    }, d.map((_, E) => n.createElement("option", {
      key: "o" + E,
      value: _.value,
      disabled: !!_.disabled
    }, _.label)))
  ];
  y && i && k.push(n.createElement("button", {
    key: "test",
    type: "button",
    disabled: f,
    "data-qm-notify-test": s,
    onClick: (_) => {
      _ && _.stopPropagation && _.stopPropagation(), Xi(s);
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
  }, f ? "发送中…" : "测试")), o && o.ready === !1 && o.reason && k.push(n.createElement("span", {
    key: "rs",
    style: { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
  }, o.reason));
  const m = !!(o && o.verified === !0), b = x || h, v = !!h;
  if (b || y && i && !f) {
    const _ = x ? x.delivered === !0 : v ? h.indexOf("✓") === 0 : !1;
    let E;
    v ? E = h : x ? E = _ ? "✓ 上次测试成功" + (x.note ? "（" + x.note + "）" : "") : "✗ " + (x.error || x.note || "上次测试失败") : E = "未测试";
    const q = x && x.at_text ? "  ·  " + x.at_text : "", S = b ? _ ? "#52c41a" : "#ff4d4f" : "#faad14";
    k.push(n.createElement("span", {
      key: "res",
      "data-qm-notify-result": b ? _ ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": b && (_ || m) ? "1" : "0",
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
    }, E + q));
  }
  return ne(
    n,
    "e5",
    "人工模式提醒频道",
    n.createElement("div", {
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
function ne(n, e, t, r, s, a, o, d, i) {
  const y = a || "global", f = cl(o || "global", y), x = [
    n.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      n.createElement("span", { key: "tt" }, t),
      ll(n, "sc", y),
      f && y === "global" ? n.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? n.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], h = [
    n.createElement("div", { className: "qm-set-rowlabel", key: "l" }, x),
    n.createElement("div", {
      className: "qm-set-rowctl" + (d ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, r)
  ];
  return n.createElement("div", {
    className: "qm-set-row" + (f ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": f ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, h);
}
function Cs(n, e, t, r, s) {
  return n.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    t.map((a, o) => n.createElement("button", {
      key: "s" + o,
      type: "button",
      "data-qm-val": a,
      disabled: !s,
      className: "qm-set-segbtn" + (a === r ? " qm-set-segon" : "") + (s ? "" : " qm-set-ctrldis"),
      onClick: () => {
        s && s(a);
      }
    }, [
      n.createElement("span", { key: "t" }, a)
    ]))
  );
}
function cn(n, e, t, r) {
  return n.createElement("div", {
    key: e,
    className: "qm-set-switch" + (t ? " qm-set-switch-on" : "") + (r ? "" : " qm-set-ctrldis"),
    "data-qm-on": t ? "1" : "0",
    role: "switch",
    // Self-drawn switch: without these the a11y tree reports an unchecked
    // switch regardless of the real state (observed in a real browser).
    "aria-checked": t ? "true" : "false",
    "aria-disabled": r ? "false" : "true",
    tabIndex: r ? 0 : -1,
    onClick: () => {
      r && r(!t);
    },
    onKeyDown: (s) => {
      if (!r) return;
      const a = s && s.key;
      (a === " " || a === "Enter") && (s.preventDefault(), r(!t));
    }
  }, [
    n.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function Ue(n, e, t, r, s) {
  if (r && r.length && s) {
    const a = r.map((o, d) => o && typeof o == "object" ? { value: String(o.value), label: String(o.label || o.value) } : { value: String(o), label: String(o) });
    return n.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      n.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: t,
        onChange: (o) => s(o && o.target ? o.target.value : "")
      }, a.map((o, d) => n.createElement("option", { key: "o" + d, value: o.value }, o.label)))
    ]);
  }
  return n.createElement("div", { className: "qm-set-select", key: e }, [
    n.createElement("span", { key: "t", className: "qm-set-selecttext" }, t),
    n.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function Is(n, e, t, r, s) {
  const a = ol(t), d = r.map((k) => k.id).indexOf(a.provider) >= 0 ? a.provider : "", i = d ? (r.filter((k) => k.id === d)[0] || { models: [] }).models : [], y = i.indexOf(a.model) >= 0 ? a.model : "", f = (k, m) => {
    s && s(k ? k + ":" + m : "");
  }, x = n.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: d,
    disabled: !s,
    title: "厂商",
    onChange: (k) => {
      const m = k && k.target ? k.target.value : "", b = m ? (r.filter((v) => v.id === m)[0] || { models: [] }).models : [];
      f(m, m && b[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [n.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((k, m) => n.createElement(
    "option",
    { key: "g" + m, value: k.id },
    k.name === k.id ? k.id : k.name + "（" + k.models.length + "）"
  )))), h = n.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: y,
    disabled: !s || !d,
    title: d ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const m = k && k.target ? k.target.value : "";
      f(d, m);
    }
  }, d ? i.map((k, m) => n.createElement("option", { key: "m" + m, value: k }, k)) : [n.createElement("option", { key: "m0", value: "" }, "—")]);
  return n.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    x,
    n.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    h
  ]);
}
function pl(n, e, t, r, s) {
  const a = [], o = t === "session" ? "session" : "global", d = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, y = {
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
  }, x = {
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
  const m = s && s.providerGroups || [], b = k.map((v) => {
    const _ = c.templates.filter((E) => String(E.id) === String(v))[0];
    return { value: v, label: _ && (_.name || _.id) || v };
  });
  if (e === "session") {
    const _ = String(Y("mode", "manual")) !== "recommend";
    if (a.push(ne(
      n,
      "s1",
      "答题模式",
      Cs(
        n,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(Y("mode", "manual"))] || "人工",
        (E) => oe("mode", d[E] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), _) {
      a.push(ne(
        n,
        "s2",
        "默认模型",
        Is(
          n,
          "sel2",
          String(Y("model_id", "")),
          m,
          (q) => oe("model_id", q)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        Ki("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const E = String(Y("template_id", "")) || b[0] && b[0].value || "";
      a.push(ne(
        n,
        "s3",
        "提示词模板",
        b.length ? Ue(
          n,
          "sel3",
          E,
          b,
          (q) => oe("template_id", q)
        ) : Ue(n, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), a.push(ne(
        n,
        "s4",
        "携带上下文",
        cn(
          n,
          "s4sw",
          !!Y("with_context", !1),
          (q) => oe("with_context", q)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), a.push(ne(
        n,
        "s5",
        "并行分析各题",
        cn(
          n,
          "s5sw",
          !!Y("parallel", !1),
          (q) => oe("parallel", q)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const E = String(Y("mode", "manual", "global")) !== "recommend";
      a.push(ne(
        n,
        "a1",
        "默认答题模式",
        Cs(
          n,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(Y("mode", "manual", "global"))] || "人工",
          (q) => oe("mode", d[q] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), E && (a.push(ne(
        n,
        "b1",
        "默认模型",
        Is(
          n,
          "sel2",
          String(Y("model_id", "", "global")),
          m,
          (q) => oe("model_id", q)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), a.push(ne(
        n,
        "b2",
        "提示词模板",
        b.length ? Ue(
          n,
          "sel3",
          String(Y("template_id", "", "global")) || b[0].value,
          b,
          (q) => oe("template_id", q)
        ) : Ue(n, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), a.push(ne(
        n,
        "b3",
        "携带上下文",
        cn(
          n,
          "s3",
          !!Y("with_context", !1, "global"),
          (q) => oe("with_context", q)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), a.push(ne(
        n,
        "b4",
        "并行分析各题",
        cn(
          n,
          "s4",
          !!Y("parallel", !1, "global"),
          (q) => oe("parallel", q)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      a.push(dl(n, o)), a.push(ne(
        n,
        "e6",
        "单题分析超时",
        Ue(
          n,
          "sel4",
          f[Number(Y("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (I) => oe("model_timeout_sec", y[I] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), a.push(ne(
        n,
        "d4",
        "等待提示阈值",
        Ue(
          n,
          "sel5",
          h[Number(Y("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (I) => oe("wait_hint_sec", x[I] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const _ = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], E = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, q = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, S = Number(Y("gate_log_limit", 200, "global"));
      a.push(ne(
        n,
        "d5",
        "拦截记录",
        Ue(
          n,
          "sel6",
          q[S] || "最近 200 条（默认）",
          _,
          (I) => oe("gate_log_limit", E[I] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const v = c.templates, _ = c.tplEdit;
    if (a.push(ne(
      n,
      "p0",
      "模板库共享范围",
      n.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), v.length ? a.push(n.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      v.map((E, q) => {
        const S = !!E.builtin, $ = (String(E.note || E.desc || "").trim() || String(E.system || E.system_prompt || E.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), C = $.length > 90 ? $.slice(0, 90) + "…" : $;
        return n.createElement("div", { className: "qm-set-item", key: "i" + q }, [
          n.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            n.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(E.name || E.id)
            ),
            n.createElement("span", {
              className: "qm-set-tag" + (S ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, S ? "内置" : "自定义"),
            n.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            n.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(E.id),
              onClick: () => {
                el(String(E.id));
              }
            }, "编辑"),
            n.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (S ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(E.id),
              disabled: S,
              title: S ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                S || rl(String(E.id));
              }
            }, "删除")
          ]),
          n.createElement("div", { className: "qm-set-itemdesc", key: "d" }, C)
        ]);
      })
    )) : a.push(n.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), a.push(n.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      n.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          Yi();
        }
      }, "＋ 新建模板")
    ])), _) {
      const E = (q, S, I, $, C) => {
        var P, L;
        return n.createElement("div", { className: "qm-set-field", key: "f-" + S }, [
          n.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, q),
          I ? n.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: $,
            "data-qm-tpl-field": S,
            placeholder: C,
            value: String(((P = c.tplEdit) == null ? void 0 : P[S]) || ""),
            onChange: (J) => As(S, J && J.target ? J.target.value : "")
          }) : n.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": S,
            placeholder: C,
            value: String(((L = c.tplEdit) == null ? void 0 : L[S]) || ""),
            onChange: (J) => As(S, J && J.target ? J.target.value : "")
          })
        ]);
      };
      a.push(n.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (_.id || "new")
      }, [
        n.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          _.id ? "编辑模板：" + (_.name || _.id) : "新建模板"
        ),
        E("模板名称", "name", !1, 0, "如：简短结论版"),
        E(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        E(
          "用户提示词模板",
          "user_prompt",
          !0,
          5,
          "可用占位符：{question} {options} {context} {title} {index} {total} {type} {showIf}"
        ),
        n.createElement("div", { className: "qm-set-editorbtns", key: "b" }, [
          n.createElement("button", {
            type: "button",
            className: "qm-set-btn qm-set-btnprimary",
            key: "save",
            "data-qm-tpl-save": "1",
            disabled: !!c.tplBusy,
            onClick: () => {
              nl();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          n.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              tl();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "stale") {
    const v = c.stale, _ = v && v.rows || [];
    if (a.push(n.createElement("div", { className: "qm-set-stalehead", key: "sh" }, [
      n.createElement(
        "div",
        { className: "qm-set-stalehint", key: "h" },
        "列出静默超过 30 分钟仍未处理的问卷。这类问卷会让对应会话一直处于「等待作答」状态（发新消息会 409）。先扫描、再按需释放；「终止会话」仅在问卷仍真正挂着时才有对象。"
      ),
      n.createElement("div", { className: "qm-set-stalebtns", key: "b" }, [
        n.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "scan",
          "data-qm-stale-scan": "1",
          disabled: !!(v && v.busy),
          onClick: () => {
            pi();
          }
        }, v && v.busy ? "扫描中…" : "扫描"),
        n.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // 没有可释放项就禁用：避免点出一个「成功 0 条」的空操作。
          disabled: !!(v && v.busy) || _.length === 0,
          title: _.length ? `释放全部 ${_.length} 条挂起问卷` : "当前没有可释放项",
          onClick: () => {
            fi();
          }
        }, "全部释放")
      ])
    ])), v && v.msg && a.push(n.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": v.msgKind || "info"
    }, v.msg)), v && v.scanned && _.length === 0 && a.push(n.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有超过 30 分钟仍未处理的问卷。")), _.length) {
      const E = n.createElement("div", {
        className: "qm-set-stalerow qm-set-staleheader",
        key: "rh"
      }, [
        n.createElement("span", { className: "qm-set-stalec1", key: "c1" }, "问卷"),
        n.createElement("span", { className: "qm-set-stalec2", key: "c2" }, "归属"),
        n.createElement("span", { className: "qm-set-stalec3", key: "c3" }, "挂起"),
        n.createElement("span", { className: "qm-set-stalec4", key: "c4" }, "操作")
      ]), q = _.map((S) => {
        const I = !!S.terminable;
        return n.createElement("div", {
          className: "qm-set-stalerow",
          key: S.tool_call_id,
          "data-qm-stale-row": S.tool_call_id
        }, [
          n.createElement("span", { className: "qm-set-stalec1", key: "c1" }, [
            n.createElement(
              "span",
              { className: "qm-set-staletitle", key: "t" },
              S.title || "(无标题)"
            ),
            // 把「为什么它没被自动释放」直接写在行上，省得再去翻日志。
            n.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              S.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : S.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : S.reason_code === "no-future" ? "无唤醒句柄" : S.reason_code === "future-done" ? "已结束未收尾" : "静默挂起"
            )
          ]),
          n.createElement(
            "span",
            { className: "qm-set-stalec2", key: "c2" },
            (S.agent_id || "-") + (S.session_id ? " · " + S.session_id : "")
          ),
          n.createElement(
            "span",
            { className: "qm-set-stalec3", key: "c3" },
            S.idle_text
          ),
          n.createElement("span", { className: "qm-set-stalec4", key: "c4" }, [
            n.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "rel",
              "data-qm-stale-release": S.tool_call_id,
              disabled: !!(v && v.busy),
              onClick: () => {
                ui([S.tool_call_id]);
              }
            }, "释放"),
            n.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "term",
              "data-qm-stale-terminate": S.tool_call_id,
              // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
              disabled: !!(v && v.busy) || !I,
              title: I ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
              onClick: () => {
                mi([S.tool_call_id]);
              }
            }, "终止会话")
          ])
        ]);
      });
      a.push(n.createElement("div", {
        className: "qm-set-staletable",
        key: "tbl",
        "data-qm-stale-table": "1"
      }, [E].concat(q)));
    }
  }
  return n.createElement("div", { className: "qm-set-tabbody", key: "tb" }, a);
}
function ul(n) {
  const { R: e, open: t, onClose: r } = n;
  if (!t) return null;
  const s = Ce(), a = s && s.Modal, o = !n.tab, d = n.tab || "", i = ca(d) ? "session" : "global", y = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    fr.map((U) => e.createElement("button", {
      key: U.key,
      type: "button",
      className: "qm-set-tab" + (!o && U.key === d ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          n.onTabChange && n.onTabChange(U.key);
        } catch {
        }
      }
    }, U.label))
  ), f = fr.filter((U) => U.key === d)[0] || fr[0], x = !!(n.cfg && n.cfg.has_session), h = x ? "session" : "default", k = x ? "会话模式" : "默认模式", m = e.createElement("div", {
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
  ]), b = e.createElement("button", {
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
  }, "✕"), v = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      m,
      b
    ])
  ]), _ = f.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, f.hint) : null, E = null, q = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((U) => e.createElement("div", {
    key: "sk" + U,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: U * 0.15 + "s"
    }
  }))) : null, S = o ? q : pl(e, d, i, n.sessData, {
    modelOptions: n.modelOptions,
    templateOptions: n.templateOptions,
    providerGroups: n.providerGroups
  }), I = n.dirtyCount || 0, $ = String(n.tab || ""), C = $ === "session" || $ === "default";
  let P;
  C ? P = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : P = $ === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const L = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      I ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + I + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, P)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      I > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!n.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          oa(), z();
        }
      }, "撤销") : null,
      e.createElement("button", {
        key: "save",
        type: "button",
        className: "qm-set-btn qm-set-btnprimary",
        "data-qm-save": "1",
        // 保存始终可点（用户裁定 2026-11-12）：即使无未保存修改，也允许
        // 把当前值固化到目标作用域；只有请求进行中才禁用。
        disabled: !!n.saving,
        onClick: () => {
          Vi();
        }
      }, n.saving ? "保存中…" : "保存")
    ])
  ]), J = n.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, n.saveMsg) : null, ke = n.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, n.conflictNote) : null, Ie = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    E,
    _,
    S,
    J,
    ke
  ]), D = e.createElement("div", { className: "qm-set-wrap" }, [
    v,
    y,
    Ie,
    L
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
  }, D) : e.createElement("div", {
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
    D
  ]);
}
function fl(n) {
  try {
    const e = n && n.sender, t = be().React;
    if (!t) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = t.createElement(il, {
      R: t,
      onOpen: () => {
        sl();
      }
    });
    e.addPrefix(Fs, r, {
      id: "question-modal.settings-btn",
      order: Ss
    }), console.log("[question-modal] settings entry registered (order " + Ss + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function ml() {
  const n = Ho();
  if (!n || typeof n.toolRender != "function") return !1;
  try {
    return Go(), n.toolRender(Fs, ms, Qi), console.log("[question-modal] registered via chat.toolRender for", ms), fl(n), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function n(e) {
  if (!ml()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => n(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
