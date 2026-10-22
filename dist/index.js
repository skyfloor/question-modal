var Co = Object.defineProperty;
var fr = (r) => {
  throw TypeError(r);
};
var Oo = (r, e, t) => e in r ? Co(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var C = (r, e, t) => Oo(r, typeof e != "symbol" ? e + "" : e, t), Po = (r, e, t) => e.has(r) || fr("Cannot " + t);
var hr = (r, e, t) => e.has(r) ? fr("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var qt = (r, e, t) => (Po(r, e, "access private method"), t);
function qn() {
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
let Te = qn();
function $r(r) {
  Te = r;
}
const zr = /[&<>"']/, No = new RegExp(zr.source, "g"), Cr = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Bo = new RegExp(Cr.source, "g"), Lo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, mr = (r) => Lo[r];
function F(r, e) {
  if (e) {
    if (zr.test(r))
      return r.replace(No, mr);
  } else if (Cr.test(r))
    return r.replace(Bo, mr);
  return r;
}
const jo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Mo(r) {
  return r.replace(jo, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const Do = /(^|[^\[])\^/g;
function $(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (o, s) => {
      let i = typeof s == "string" ? s : s.source;
      return i = i.replace(Do, "$1"), t = t.replace(o, i), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function gr(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const ot = { exec: () => null };
function br(r, e) {
  const t = r.replace(/\|/g, (s, i, c) => {
    let a = !1, g = i;
    for (; --g >= 0 && c[g] === "\\"; )
      a = !a;
    return a ? "|" : " |";
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
function At(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let o = 0;
  for (; o < n && r.charAt(n - o - 1) === e; )
    o++;
  return r.slice(0, n - o);
}
function Fo(r, e) {
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
function yr(r, e, t, n) {
  const o = e.href, s = e.title ? F(e.title) : null, i = r[1].replace(/\\([\[\]])/g, "$1");
  if (r[0].charAt(0) !== "!") {
    n.state.inLink = !0;
    const c = {
      type: "link",
      raw: t,
      href: o,
      title: s,
      text: i,
      tokens: n.inlineTokens(i)
    };
    return n.state.inLink = !1, c;
  }
  return {
    type: "image",
    raw: t,
    href: o,
    title: s,
    text: F(i)
  };
}
function Wo(r, e) {
  const t = r.match(/^(\s+)(?:```)/);
  if (t === null)
    return e;
  const n = t[1];
  return e.split(`
`).map((o) => {
    const s = o.match(/^\s+/);
    if (s === null)
      return o;
    const [i] = s;
    return i.length >= n.length ? o.slice(n.length) : o;
  }).join(`
`);
}
class Ct {
  // set by the lexer
  constructor(e) {
    C(this, "options");
    C(this, "rules");
    // set by the lexer
    C(this, "lexer");
    this.options = e || Te;
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
        text: this.options.pedantic ? n : At(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], o = Wo(n, t[3] || "");
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
        const o = At(n, "#");
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
      n = At(n.replace(/^ *>[ \t]?/gm, ""), `
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
      const i = new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let c = "", a = "", g = !1;
      for (; e; ) {
        let m = !1;
        if (!(t = i.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let y = t[2].split(`
`, 1)[0].replace(/^\t+/, (L) => " ".repeat(3 * L.length)), h = e.split(`
`, 1)[0], x = 0;
        this.options.pedantic ? (x = 2, a = y.trimStart()) : (x = t[2].search(/[^ ]/), x = x > 4 ? 1 : x, a = y.slice(x), x += t[1].length);
        let f = !1;
        if (!y && /^ *$/.test(h) && (c += h + `
`, e = e.substring(h.length + 1), m = !0), !m) {
          const L = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), Q = new RegExp(`^ {0,${Math.min(3, x - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), S = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:\`\`\`|~~~)`), I = new RegExp(`^ {0,${Math.min(3, x - 1)}}#`);
          for (; e; ) {
            const _ = e.split(`
`, 1)[0];
            if (h = _, this.options.pedantic && (h = h.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), S.test(h) || I.test(h) || L.test(h) || Q.test(e))
              break;
            if (h.search(/[^ ]/) >= x || !h.trim())
              a += `
` + h.slice(x);
            else {
              if (f || y.search(/[^ ]/) >= 4 || S.test(y) || I.test(y) || Q.test(y))
                break;
              a += `
` + h;
            }
            !f && !h.trim() && (f = !0), c += _ + `
`, e = e.substring(_.length + 1), y = h.slice(x);
          }
        }
        s.loose || (g ? s.loose = !0 : /\n *\n *$/.test(c) && (g = !0));
        let b = null, E;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(a), b && (E = b[0] !== "[ ] ", a = a.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: E,
          loose: !1,
          text: a,
          tokens: []
        }), s.raw += c;
      }
      s.items[s.items.length - 1].raw = c.trimEnd(), s.items[s.items.length - 1].text = a.trimEnd(), s.raw = s.raw.trimEnd();
      for (let m = 0; m < s.items.length; m++)
        if (this.lexer.state.top = !1, s.items[m].tokens = this.lexer.blockTokens(s.items[m].text, []), !s.loose) {
          const y = s.items[m].tokens.filter((x) => x.type === "space"), h = y.length > 0 && y.some((x) => /\n.*\n/.test(x.raw));
          s.loose = h;
        }
      if (s.loose)
        for (let m = 0; m < s.items.length; m++)
          s.items[m].loose = !0;
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
    const n = br(t[1]), o = t[2].replace(/^\||\| *$/g, "").split("|"), s = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
`) : [], i = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === o.length) {
      for (const c of o)
        /^ *-+: *$/.test(c) ? i.align.push("right") : /^ *:-+: *$/.test(c) ? i.align.push("center") : /^ *:-+ *$/.test(c) ? i.align.push("left") : i.align.push(null);
      for (const c of n)
        i.header.push({
          text: c,
          tokens: this.lexer.inline(c)
        });
      for (const c of s)
        i.rows.push(br(c, i.header.length).map((a) => ({
          text: a,
          tokens: this.lexer.inline(a)
        })));
      return i;
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
        const i = At(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0)
          return;
      } else {
        const i = Fo(t[2], "()");
        if (i > -1) {
          const a = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
          t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, a).trim(), t[3] = "";
        }
      }
      let o = t[2], s = "";
      if (this.options.pedantic) {
        const i = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(o);
        i && (o = i[1], s = i[3]);
      } else
        s = t[3] ? t[3].slice(1, -1) : "";
      return o = o.trim(), /^</.test(o) && (this.options.pedantic && !/>$/.test(n) ? o = o.slice(1) : o = o.slice(1, -1)), yr(t, {
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
        const i = n[0].charAt(0);
        return {
          type: "text",
          raw: i,
          text: i
        };
      }
      return yr(n, s, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let o = this.rules.inline.emStrongLDelim.exec(e);
    if (!o || o[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(o[1] || o[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const i = [...o[0]].length - 1;
      let c, a, g = i, m = 0;
      const y = o[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (y.lastIndex = 0, t = t.slice(-1 * e.length + i); (o = y.exec(t)) != null; ) {
        if (c = o[1] || o[2] || o[3] || o[4] || o[5] || o[6], !c)
          continue;
        if (a = [...c].length, o[3] || o[4]) {
          g += a;
          continue;
        } else if ((o[5] || o[6]) && i % 3 && !((i + a) % 3)) {
          m += a;
          continue;
        }
        if (g -= a, g > 0)
          continue;
        a = Math.min(a, a + g + m);
        const h = [...o[0]][0].length, x = e.slice(0, i + o.index + h + a);
        if (Math.min(i, a) % 2) {
          const b = x.slice(1, -1);
          return {
            type: "em",
            raw: x,
            text: b,
            tokens: this.lexer.inlineTokens(b)
          };
        }
        const f = x.slice(2, -2);
        return {
          type: "strong",
          raw: x,
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
        let i;
        do
          i = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (i !== t[0]);
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
const Ho = /^(?: *(?:\n|$))+/, Uo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Zo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, at = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Jo = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Or = /(?:[*+-]|\d{1,9}[.)])/, Pr = $(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Or).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), An = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Qo = /^[^\n]+/, Tn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Xo = $(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", Tn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Go = $(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Or).getRegex(), Mt = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", In = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Vo = $("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", In).replace("tag", Mt).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Nr = $(An).replace("hr", at).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Mt).getRegex(), Yo = $(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Nr).getRegex(), $n = {
  blockquote: Yo,
  code: Uo,
  def: Xo,
  fences: Zo,
  heading: Jo,
  hr: at,
  html: Vo,
  lheading: Pr,
  list: Go,
  newline: Ho,
  paragraph: Nr,
  table: ot,
  text: Qo
}, xr = $("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", at).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Mt).getRegex(), Ko = {
  ...$n,
  table: xr,
  paragraph: $(An).replace("hr", at).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", xr).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Mt).getRegex()
}, es = {
  ...$n,
  html: $(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", In).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: ot,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: $(An).replace("hr", at).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Pr).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Br = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, ts = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Lr = /^( {2,}|\\)\n(?!\s*$)/, ns = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, lt = "\\p{P}\\p{S}", rs = $(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, lt).getRegex(), os = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, ss = $(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, lt).getRegex(), is = $("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, lt).getRegex(), as = $("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, lt).getRegex(), ls = $(/\\([punct])/, "gu").replace(/punct/g, lt).getRegex(), cs = $(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), us = $(In).replace("(?:-->|$)", "-->").getRegex(), ps = $("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", us).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Ot = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, ds = $(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Ot).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), jr = $(/^!?\[(label)\]\[(ref)\]/).replace("label", Ot).replace("ref", Tn).getRegex(), Mr = $(/^!?\[(ref)\](?:\[\])?/).replace("ref", Tn).getRegex(), fs = $("reflink|nolink(?!\\()", "g").replace("reflink", jr).replace("nolink", Mr).getRegex(), zn = {
  _backpedal: ot,
  // only used for GFM url
  anyPunctuation: ls,
  autolink: cs,
  blockSkip: os,
  br: Lr,
  code: ts,
  del: ot,
  emStrongLDelim: ss,
  emStrongRDelimAst: is,
  emStrongRDelimUnd: as,
  escape: Br,
  link: ds,
  nolink: Mr,
  punctuation: rs,
  reflink: jr,
  reflinkSearch: fs,
  tag: ps,
  text: ns,
  url: ot
}, hs = {
  ...zn,
  link: $(/^!?\[(label)\]\((.*?)\)/).replace("label", Ot).getRegex(),
  reflink: $(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Ot).getRegex()
}, _n = {
  ...zn,
  escape: $(Br).replace("])", "~|])").getRegex(),
  url: $(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, ms = {
  ..._n,
  br: $(Lr).replace("{2,}", "*").getRegex(),
  text: $(_n.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Tt = {
  normal: $n,
  gfm: Ko,
  pedantic: es
}, nt = {
  normal: zn,
  gfm: _n,
  breaks: ms,
  pedantic: hs
};
class te {
  constructor(e) {
    C(this, "tokens");
    C(this, "options");
    C(this, "state");
    C(this, "tokenizer");
    C(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Te, this.options.tokenizer = this.options.tokenizer || new Ct(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: Tt.normal,
      inline: nt.normal
    };
    this.options.pedantic ? (t.block = Tt.pedantic, t.inline = nt.pedantic) : this.options.gfm && (t.block = Tt.gfm, this.options.breaks ? t.inline = nt.breaks : t.inline = nt.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: Tt,
      inline: nt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, t) {
    return new te(t).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, t) {
    return new te(t).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, a, g) => a + "    ".repeat(g.length));
    let n, o, s, i;
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
          const a = e.slice(1);
          let g;
          this.options.extensions.startBlock.forEach((m) => {
            g = m.call({ lexer: this }, a), typeof g == "number" && g >= 0 && (c = Math.min(c, g));
          }), c < 1 / 0 && c >= 0 && (s = e.substring(0, c + 1));
        }
        if (this.state.top && (n = this.tokenizer.paragraph(s))) {
          o = t[t.length - 1], i && o.type === "paragraph" ? (o.raw += `
` + n.raw, o.text += `
` + n.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(n), i = s.length !== e.length, e = e.substring(n.raw.length);
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
    let n, o, s, i = e, c, a, g;
    if (this.tokens.links) {
      const m = Object.keys(this.tokens.links);
      if (m.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(i)) != null; )
          m.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (i = i.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(i)) != null; )
      i = i.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(i)) != null; )
      i = i.slice(0, c.index) + "++" + i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (a || (g = ""), a = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((m) => (n = m.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
        if (n = this.tokenizer.emStrong(e, i, g)) {
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
          let m = 1 / 0;
          const y = e.slice(1);
          let h;
          this.options.extensions.startInline.forEach((x) => {
            h = x.call({ lexer: this }, y), typeof h == "number" && h >= 0 && (m = Math.min(m, h));
          }), m < 1 / 0 && m >= 0 && (s = e.substring(0, m + 1));
        }
        if (n = this.tokenizer.inlineText(s)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (g = n.raw.slice(-1)), a = !0, o = t[t.length - 1], o && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
          continue;
        }
        if (e) {
          const m = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(m);
            break;
          } else
            throw new Error(m);
        }
      }
    return t;
  }
}
class Pt {
  constructor(e) {
    C(this, "options");
    this.options = e || Te;
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
    const o = gr(e);
    if (o === null)
      return n;
    e = o;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + t + '"'), s += ">" + n + "</a>", s;
  }
  image(e, t, n) {
    const o = gr(e);
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
class Cn {
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
class ne {
  constructor(e) {
    C(this, "options");
    C(this, "renderer");
    C(this, "textRenderer");
    this.options = e || Te, this.options.renderer = this.options.renderer || new Pt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new Cn();
  }
  /**
   * Static Parse Method
   */
  static parse(e, t) {
    return new ne(t).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, t) {
    return new ne(t).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, t = !0) {
    let n = "";
    for (let o = 0; o < e.length; o++) {
      const s = e[o];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const i = s, c = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(i.type)) {
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
          const i = s;
          n += this.renderer.heading(this.parseInline(i.tokens), i.depth, Mo(this.parseInline(i.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const i = s;
          n += this.renderer.code(i.text, i.lang, !!i.escaped);
          continue;
        }
        case "table": {
          const i = s;
          let c = "", a = "";
          for (let m = 0; m < i.header.length; m++)
            a += this.renderer.tablecell(this.parseInline(i.header[m].tokens), { header: !0, align: i.align[m] });
          c += this.renderer.tablerow(a);
          let g = "";
          for (let m = 0; m < i.rows.length; m++) {
            const y = i.rows[m];
            a = "";
            for (let h = 0; h < y.length; h++)
              a += this.renderer.tablecell(this.parseInline(y[h].tokens), { header: !1, align: i.align[h] });
            g += this.renderer.tablerow(a);
          }
          n += this.renderer.table(c, g);
          continue;
        }
        case "blockquote": {
          const i = s, c = this.parse(i.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const i = s, c = i.ordered, a = i.start, g = i.loose;
          let m = "";
          for (let y = 0; y < i.items.length; y++) {
            const h = i.items[y], x = h.checked, f = h.task;
            let b = "";
            if (h.task) {
              const E = this.renderer.checkbox(!!x);
              g ? h.tokens.length > 0 && h.tokens[0].type === "paragraph" ? (h.tokens[0].text = E + " " + h.tokens[0].text, h.tokens[0].tokens && h.tokens[0].tokens.length > 0 && h.tokens[0].tokens[0].type === "text" && (h.tokens[0].tokens[0].text = E + " " + h.tokens[0].tokens[0].text)) : h.tokens.unshift({
                type: "text",
                text: E + " "
              }) : b += E + " ";
            }
            b += this.parse(h.tokens, g), m += this.renderer.listitem(b, f, !!x);
          }
          n += this.renderer.list(m, c, a);
          continue;
        }
        case "html": {
          const i = s;
          n += this.renderer.html(i.text, i.block);
          continue;
        }
        case "paragraph": {
          const i = s;
          n += this.renderer.paragraph(this.parseInline(i.tokens));
          continue;
        }
        case "text": {
          let i = s, c = i.tokens ? this.parseInline(i.tokens) : i.text;
          for (; o + 1 < e.length && e[o + 1].type === "text"; )
            i = e[++o], c += `
` + (i.tokens ? this.parseInline(i.tokens) : i.text);
          n += t ? this.renderer.paragraph(c) : c;
          continue;
        }
        default: {
          const i = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(i), "";
          throw new Error(i);
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
        const i = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (i !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          n += i || "";
          continue;
        }
      }
      switch (s.type) {
        case "escape": {
          const i = s;
          n += t.text(i.text);
          break;
        }
        case "html": {
          const i = s;
          n += t.html(i.text);
          break;
        }
        case "link": {
          const i = s;
          n += t.link(i.href, i.title, this.parseInline(i.tokens, t));
          break;
        }
        case "image": {
          const i = s;
          n += t.image(i.href, i.title, i.text);
          break;
        }
        case "strong": {
          const i = s;
          n += t.strong(this.parseInline(i.tokens, t));
          break;
        }
        case "em": {
          const i = s;
          n += t.em(this.parseInline(i.tokens, t));
          break;
        }
        case "codespan": {
          const i = s;
          n += t.codespan(i.text);
          break;
        }
        case "br": {
          n += t.br();
          break;
        }
        case "del": {
          const i = s;
          n += t.del(this.parseInline(i.tokens, t));
          break;
        }
        case "text": {
          const i = s;
          n += t.text(i.text);
          break;
        }
        default: {
          const i = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return n;
  }
}
class st {
  constructor(e) {
    C(this, "options");
    this.options = e || Te;
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
C(st, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Ae, En, Dr;
class gs {
  constructor(...e) {
    hr(this, Ae);
    C(this, "defaults", qn());
    C(this, "options", this.setOptions);
    C(this, "parse", qt(this, Ae, En).call(this, te.lex, ne.parse));
    C(this, "parseInline", qt(this, Ae, En).call(this, te.lexInline, ne.parseInline));
    C(this, "Parser", ne);
    C(this, "Renderer", Pt);
    C(this, "TextRenderer", Cn);
    C(this, "Lexer", te);
    C(this, "Tokenizer", Ct);
    C(this, "Hooks", st);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, t) {
    var o, s;
    let n = [];
    for (const i of e)
      switch (n = n.concat(t.call(this, i)), i.type) {
        case "table": {
          const c = i;
          for (const a of c.header)
            n = n.concat(this.walkTokens(a.tokens, t));
          for (const a of c.rows)
            for (const g of a)
              n = n.concat(this.walkTokens(g.tokens, t));
          break;
        }
        case "list": {
          const c = i;
          n = n.concat(this.walkTokens(c.items, t));
          break;
        }
        default: {
          const c = i;
          (s = (o = this.defaults.extensions) == null ? void 0 : o.childTokens) != null && s[c.type] ? this.defaults.extensions.childTokens[c.type].forEach((a) => {
            const g = c[a].flat(1 / 0);
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
          const i = t.renderers[s.name];
          i ? t.renderers[s.name] = function(...c) {
            let a = s.renderer.apply(this, c);
            return a === !1 && (a = i.apply(this, c)), a;
          } : t.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const i = t[s.level];
          i ? i.unshift(s.tokenizer) : t[s.level] = [s.tokenizer], s.start && (s.level === "block" ? t.startBlock ? t.startBlock.push(s.start) : t.startBlock = [s.start] : s.level === "inline" && (t.startInline ? t.startInline.push(s.start) : t.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (t.childTokens[s.name] = s.childTokens);
      }), o.extensions = t), n.renderer) {
        const s = this.defaults.renderer || new Pt(this.defaults);
        for (const i in n.renderer) {
          if (!(i in s))
            throw new Error(`renderer '${i}' does not exist`);
          if (i === "options")
            continue;
          const c = i, a = n.renderer[c], g = s[c];
          s[c] = (...m) => {
            let y = a.apply(s, m);
            return y === !1 && (y = g.apply(s, m)), y || "";
          };
        }
        o.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new Ct(this.defaults);
        for (const i in n.tokenizer) {
          if (!(i in s))
            throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i))
            continue;
          const c = i, a = n.tokenizer[c], g = s[c];
          s[c] = (...m) => {
            let y = a.apply(s, m);
            return y === !1 && (y = g.apply(s, m)), y;
          };
        }
        o.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new st();
        for (const i in n.hooks) {
          if (!(i in s))
            throw new Error(`hook '${i}' does not exist`);
          if (i === "options")
            continue;
          const c = i, a = n.hooks[c], g = s[c];
          st.passThroughHooks.has(i) ? s[c] = (m) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(s, m)).then((h) => g.call(s, h));
            const y = a.call(s, m);
            return g.call(s, y);
          } : s[c] = (...m) => {
            let y = a.apply(s, m);
            return y === !1 && (y = g.apply(s, m)), y;
          };
        }
        o.hooks = s;
      }
      if (n.walkTokens) {
        const s = this.defaults.walkTokens, i = n.walkTokens;
        o.walkTokens = function(c) {
          let a = [];
          return a.push(i.call(this, c)), s && (a = a.concat(s.call(this, c))), a;
        };
      }
      this.defaults = { ...this.defaults, ...o };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return te.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return ne.parse(e, t ?? this.defaults);
  }
}
Ae = new WeakSet(), En = function(e, t) {
  return (n, o) => {
    const s = { ...o }, i = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (i.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), i.async = !0);
    const c = qt(this, Ae, Dr).call(this, !!i.silent, !!i.async);
    if (typeof n > "u" || n === null)
      return c(new Error("marked(): input parameter is undefined or null"));
    if (typeof n != "string")
      return c(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
    if (i.hooks && (i.hooks.options = i), i.async)
      return Promise.resolve(i.hooks ? i.hooks.preprocess(n) : n).then((a) => e(a, i)).then((a) => i.hooks ? i.hooks.processAllTokens(a) : a).then((a) => i.walkTokens ? Promise.all(this.walkTokens(a, i.walkTokens)).then(() => a) : a).then((a) => t(a, i)).then((a) => i.hooks ? i.hooks.postprocess(a) : a).catch(c);
    try {
      i.hooks && (n = i.hooks.preprocess(n));
      let a = e(n, i);
      i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
      let g = t(a, i);
      return i.hooks && (g = i.hooks.postprocess(g)), g;
    } catch (a) {
      return c(a);
    }
  };
}, Dr = function(e, t) {
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
const qe = new gs();
function T(r, e) {
  return qe.parse(r, e);
}
T.options = T.setOptions = function(r) {
  return qe.setOptions(r), T.defaults = qe.defaults, $r(T.defaults), T;
};
T.getDefaults = qn;
T.defaults = Te;
T.use = function(...r) {
  return qe.use(...r), T.defaults = qe.defaults, $r(T.defaults), T;
};
T.walkTokens = function(r, e) {
  return qe.walkTokens(r, e);
};
T.parseInline = qe.parseInline;
T.Parser = ne;
T.parser = ne.parse;
T.Renderer = Pt;
T.TextRenderer = Cn;
T.Lexer = te;
T.lexer = te.lex;
T.Tokenizer = Ct;
T.Hooks = st;
T.parse = T;
T.options;
T.setOptions;
T.use;
T.walkTokens;
T.parseInline;
ne.parse;
te.lex;
const bs = "question-modal", kr = "question_modal", wr = "gate-v2@2026.10.21";
function je() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function ys() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Me() {
  return je().antd || {};
}
function xs() {
  return je().antdIcons || {};
}
const ks = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function gn(r) {
  const e = xs();
  for (const t of ks) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function ws() {
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
    const e = je();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let Fr = "", Wr = "";
function On(r, e) {
  r && (Wr = r), e && (Fr = e);
}
function B() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = je(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = Fr), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function Hr() {
  try {
    const e = je();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : Wr;
}
function ee(r) {
  const e = it(r);
  return e && e.session_id ? e.session_id : Hr();
}
const bn = 180, vs = 20, Ur = 6e3, Ss = 60 * 1e3, _s = 8;
function Es() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Rs = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function vr(r) {
  try {
    return String(r || "").replace(Rs, "").length;
  } catch {
    return 0;
  }
}
function Sr(r) {
  const e = Es();
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
    n = vr((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - vr(t.textContent);
}
function qs(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function As(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function _r(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: Ur });
      return;
    }
  } catch {
  }
  try {
    setTimeout(r, 0);
  } catch {
  }
}
const Pn = "qm:v1:analysis:global", Ts = "qm:v1:analysis:", Rn = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Zr(r) {
  if (!r || typeof r != "object") return { ...Rn };
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
function Er() {
  try {
    const r = localStorage.getItem(Pn);
    return r ? Zr(JSON.parse(r)) : { ...Rn };
  } catch {
    return { ...Rn };
  }
}
function Rr(r) {
  try {
    localStorage.setItem(Pn, JSON.stringify(r));
  } catch {
  }
}
function Is() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(Ts) === 0 && t !== Pn && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function $s() {
  try {
    const r = await fetch(N("/question-modal/prefs"), { headers: B() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : Zr(e.prefs);
  } catch {
    return null;
  }
}
function zs(r) {
  const e = {
    mode: r.mode,
    model_id: r.modelId,
    with_context: r.withContext,
    parallel: r.parallel
  };
  try {
    fetch(N("/question-modal/prefs"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(e)
    }).catch(() => {
    });
  } catch {
  }
}
async function Cs() {
  try {
    const r = await fetch(N("/question-modal/templates"), { headers: B() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function Os(r) {
  try {
    const e = await fetch(N("/question-modal/templates"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(r)
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [], saved: t && t.saved } : { ok: !1, error: t && t.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ps(r) {
  try {
    const e = await fetch(N("/question-modal/templates/" + encodeURIComponent(r)), {
      method: "DELETE",
      headers: B()
    }), t = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: t && t.items || [] } : { ok: !1, error: t && t.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ns() {
  try {
    const r = await fetch(N("/models"), { headers: B() });
    if (!r.ok) return [];
    const e = await r.json();
    return (Array.isArray(e) ? e : []).filter((n) => {
      const s = [...n.models || [], ...n.extra_models || []].length > 0, i = !!n.api_key || n.require_api_key === !1 || n.is_local || n.is_custom;
      return s && i;
    });
  } catch {
    return [];
  }
}
async function Bs() {
  try {
    const r = await fetch(N("/models/active"), { headers: B() });
    if (!r.ok) return {};
    const e = await r.json();
    return (e == null ? void 0 : e.active_llm) || {};
  } catch {
    return {};
  }
}
function Ls(r) {
  if (!r) return "";
  try {
    return String(T.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function z(r, e) {
  try {
    const t = Me().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const Re = "__other__";
function J(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function Nt(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function yn(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((o) => {
    if (t && t.has(o) || !Object.prototype.hasOwnProperty.call(n, o)) return;
    const s = e[o];
    !s || typeof s != "object" || !Nt(n[o]) && Nt(s) && (n[o] = { ...s });
  }), n;
}
function qr(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function js(r, e, t) {
  if (!t.length) return !1;
  const n = (a) => String(a || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), o = J(e), s = re(e), i = n(o), c = n(s);
  return t.some((a) => {
    const g = n(a);
    return g ? !!(a === o || a === s || g === i || g === c || Math.min(g.length, i.length, c.length) >= 4 && (g.length >= 4 && (i.includes(g) || g.includes(i)) || g.length >= 4 && (c.includes(g) || g.includes(c)))) : !1;
  });
}
function D(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
function re(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function Ms(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (s) => {
    s != null && s !== "" && t.add(String(s));
  }, o = r.options || [];
  if (D(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((i) => {
      n(i);
      const c = o.find((a) => J(a) === String(i));
      c && n(re(c)), String(i) === Re && e.other && n(e.other);
    });
  else {
    n(e.value);
    const s = o.find((i) => J(i) === String(e.value));
    s && n(re(s)), String(e.value) === Re && e.other && n(e.other);
  }
  return t;
}
function Ds(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const o = String(n);
    if (o.startsWith("=")) return e.has(o.slice(1));
    if (e.has(o)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(o) !== -1 || o.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Jr(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const o = parseInt(t[1], 10);
    if (o >= 0 && o < e.length) return o;
  }
  return e.findIndex((o) => (o.title || "").trim() === r.trim());
}
function Qr(r, e, t) {
  const n = e[r], o = n && n.showIf;
  if (!o || typeof o != "object" || !Object.keys(o).length) return !0;
  for (const s of Object.keys(o)) {
    const i = Jr(s, e);
    if (i < 0) continue;
    const c = e[i];
    if (!c) continue;
    if (c.showIf && !Qr(i, e, t)) return !1;
    const a = t[`q${i}`];
    if (!a || !Ds(o[s], Ms(c, a))) return !1;
  }
  return !0;
}
function he(r, e) {
  const t = [];
  return r.forEach((n, o) => {
    Qr(o, r, e) && t.push(o);
  }), t;
}
function Fs(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function xn(r) {
  return Array.isArray(r.questions);
}
function Ws(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function Hs(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((o) => o && (o.text || o.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function Us(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function Zs(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers)
    return `已跳过本次问卷。

` + zt(r);
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((o) => {
    const s = t[o];
    if (!s || typeof s != "object") return;
    const i = Jr(o, r), c = i >= 0 ? r[i] : null, a = c ? D(c) === "single" ? "单选" : D(c) === "multi" ? "多选" : "问答" : "问答", g = c ? c.title : o;
    let m = s.value;
    Array.isArray(m) && (m = m.join("、")), s.other && (m = (m ? m + "、" : "") + s.other), s.skipped ? n.push(`- ${o} [${a}] ${g}（用户跳过本题）`) : n.push(`- ${o} [${a}] ${g}：${m === "" || m == null ? "（空）" : m}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function Js(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      N("/question-modal/resolve") + "?" + t.toString(),
      { headers: B() }
    );
    if (!n.ok) return { kind: "error" };
    const o = await n.json();
    return o && On(o.session_id, o.agent_id), o && o.found ? { kind: "found", data: o } : o && o.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function kn(r) {
  if (!r) return null;
  try {
    const e = await fetch(
      N("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(r),
      { headers: B() }
    );
    if (!e.ok) return null;
    const t = await e.json();
    return t && t.found ? t : null;
  } catch {
    return null;
  }
}
async function Qs(r) {
  try {
    const e = new FormData();
    e.append("file", r);
    const t = B();
    delete t["Content-Type"];
    const n = await fetch(
      N("/console/upload"),
      { method: "POST", headers: t, body: e }
    );
    if (!n.ok) {
      const s = await n.text().catch(() => "");
      let i = "HTTP " + n.status;
      try {
        const c = JSON.parse(s);
        c && c.detail && (i = c.detail);
      } catch {
      }
      return { ok: !1, error: `${r.name}: ${i}` };
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
const Bt = "qm:v1:stash_att:", Ar = 25 * 1024 * 1024, It = /* @__PURE__ */ new Map(), $t = /* @__PURE__ */ new Map();
let Lt = null, jt = 0, wn = null;
function Tr() {
  const r = jt > 0;
  $t.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function Xs() {
  if (wn) return wn;
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
    const n = Lt;
    Lt = null, !(!n || !t.length) && await Xr(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return wn = r, r;
}
function Gs(r, e, t) {
  if (!r) {
    z("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Lt = { callId: r, target: e, key: t };
  const n = Xs();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (Lt = null);
}
async function Xr(r, e, t, n) {
  jt += 1, Tr();
  const o = [], s = [];
  try {
    for (const c of r) {
      if (c.size && c.size > Ar) {
        s.push(`${c.name}: 文件过大（上限 ${Math.round(Ar / 1024 / 1024)} MB）`);
        continue;
      }
      const a = await Qs(c);
      a.ok ? o.push(a.att) : s.push(a.error);
    }
  } finally {
    jt -= 1, Tr();
  }
  const i = It.get(e);
  if (o.length || s.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      z(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (i)
      try {
        i(o, c, n, s);
      } catch {
      }
    else o.length && Vs(e, o, c, n);
  }
}
function Vs(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const o = localStorage.getItem(Bt + r), s = o ? JSON.parse(o) : [], i = (Array.isArray(s) ? s : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(Bt + r, JSON.stringify(i));
    } catch {
    }
}
function Ys(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(Bt + r);
    if (!e) return [];
    localStorage.removeItem(Bt + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function Ks(r) {
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
function ei(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function vn(r, e) {
  const t = e || ee(r), n = it(r), o = n && n.request_id ? n.request_id : "";
  if (o)
    try {
      const s = await fetch(N("/question-modal/skip"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ request_id: o, session_id: t || "" })
      });
      if (s.ok) {
        const i = await s.json().catch(() => ({}));
        return X(r), {
          ok: !0,
          released: !0,
          reason: i && i.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return X(r), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const s = await fetch(
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: B() }
      );
      if (s.ok) {
        const i = await s.json().catch(() => ({})), c = i && typeof i.cancelled == "number" ? i.cancelled : 0;
        return X(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function Ir(r) {
  if (!r) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      N("/console/chat/stop") + "?chat_id=" + encodeURIComponent(r),
      { method: "POST", headers: B() }
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
async function ti() {
  try {
    const r = await fetch(
      N("/question-modal/pending"),
      { headers: B() }
    );
    if (!r.ok) return null;
    const e = await r.json(), t = e && e.items || [];
    if (!Array.isArray(t) || t.length !== 1) return null;
    const n = t[0];
    if (!n || !n.request_id) return null;
    const o = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(n.request_id),
      { headers: B() }
    );
    if (!o.ok) return null;
    const s = await o.json();
    return s && On(s.session_id, s.agent_id), s && s.found ? s : null;
  } catch {
    return null;
  }
}
const Dt = "qm:v1:reqid:", ni = 3e4, ri = 45e3;
function X(r) {
  if (r)
    try {
      localStorage.removeItem(Dt + r);
    } catch {
    }
}
function oi() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(Dt) === 0 && r.push(s);
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
function si(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(Dt + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), oi();
    } catch {
    }
}
function it(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(Dt + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (X(r), null) : t;
  } catch {
    return null;
  }
}
const Nn = "qm:v1:state:";
function rt(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(Nn + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function Le(r, e) {
  if (r)
    try {
      const n = { ...rt(r) || {}, ...e, ts: Date.now() };
      localStorage.setItem(Nn + r, JSON.stringify(n)), ii();
    } catch {
    }
}
function ii() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(Nn) === 0 && r.push(s);
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
async function ai(r) {
  try {
    const e = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: B() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && On(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function li(r, e, t, n) {
  const o = ["【用户提交的问卷答案】"], s = new Set(he(r, e));
  return r.forEach((i, c) => {
    if (!s.has(c)) return;
    const a = e[`q${c}`];
    if (!a) return;
    let g = a.value;
    if (Array.isArray(g))
      g = g.filter((f) => f !== Re).map((f) => {
        const b = (i.options || []).find((E) => J(E) === String(f));
        return b ? re(b) : f;
      }).join("、");
    else {
      const f = (i.options || []).find((b) => J(b) === String(g));
      f && (g = re(f)), String(a.value) === Re && (g = "");
    }
    const m = D(i) === "single" ? "单选" : D(i) === "multi" ? "多选" : "问答", y = !!String(g || "").trim() || !!String(a.other || "").trim() || !!(a.attachments && a.attachments.length), h = a.skipped ? "（用户跳过本题）" : y ? g : "（未作答）";
    let x = `- q${c} [${m}] ${h}`;
    a.other && !a.skipped && (x += `（其他：${a.other}）`), a.attachments && a.attachments.length && (x += `（附件：${a.attachments.map((f) => f.file_name).join("、")}）`), o.push(x);
  }), t && o.push(`- 其他意见：${t}`), n && n.length && o.push(`- 其他意见附件：${n.map((i) => i.file_name).join("、")}`), o.join(`
`);
}
function zt(r) {
  return r.map((e, t) => {
    const n = D(e) === "single" ? "单选" : D(e) === "multi" ? "多选" : "问答", o = (e.options || []).map(re).join("、");
    return `${t + 1}. [${n}] ${e.title}${o ? "（" + o + "）" : ""}`;
  }).join(`
`);
}
function Sn(r) {
  const { R: e, files: t, disabled: n, uploading: o, error: s, onPick: i, onRemove: c } = r, a = {
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
    t.map((m, y) => e.createElement(
      "span",
      { key: "att" + y, style: a },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: m.file_name
      }, m.file_name + (m.size ? "（" + ei(m.size) + "）" : "")),
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
      onClick: i
    }, o ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function ci(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: o,
    disabled: s,
    open: i,
    onOpenChange: c,
    tab: a,
    onTabChange: g
  } = r, y = Me().Popover, h = [];
  t.forEach((v) => {
    [...v.models || [], ...v.extra_models || []].forEach((R) => {
      h.push({
        providerId: v.id,
        providerName: v.name || v.id,
        modelId: R.id,
        modelName: R.name || R.id,
        free: !!R.is_free
      });
    });
  });
  const x = h.find((v) => `${v.providerId}:${v.modelId}` === n), f = x ? x.modelName : n || "选择模型", b = x ? x.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", E = {
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
  }, L = h.filter((v) => v.free).length, Q = h.length - L, S = [];
  t.forEach((v) => {
    const R = [...v.models || [], ...v.extra_models || []].map((j) => ({
      providerId: v.id,
      providerName: v.name || v.id,
      modelId: j.id,
      modelName: j.name || j.id,
      free: !!j.is_free
    })).filter((j) => a === "free" ? j.free : !j.free);
    R.length && S.push({ id: v.id, name: v.name || v.id, models: R });
  });
  const I = (v, R) => e.createElement("button", {
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
      background: a === v ? "var(--app-bg-container, #fff)" : "transparent",
      color: a === v ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: a === v ? 600 : 400,
      boxShadow: a === v ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => g(v)
  }, R), _ = e.createElement(
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
      I("paid", "付费 🟡 " + Q),
      I("free", "免费 🟢 " + L)
    ),
    S.length ? e.createElement("div", null, S.map((v, R) => (
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
        v.models.map((j) => {
          const le = `${j.providerId}:${j.modelId}` === n;
          return e.createElement(
            "div",
            {
              key: `${j.providerId}:${j.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (le ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: le ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                o(`${j.providerId}:${j.modelId}`), c(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: R % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, j.modelName)
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
    content: _,
    trigger: "click",
    open: i,
    onOpenChange: c,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: E,
      disabled: s,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, f),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: E,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const v = h.find((R) => `${R.providerId}:${R.modelId}` !== n);
        v && o(`${v.providerId}:${v.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: b }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, f),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function ui(r) {
  const { R: e, mode: t, onChange: n, disabled: o } = r, s = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, i = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发任何模型请求：直接采用出题时已标注的推荐，自动填入、翻页、提交",
    manual: "由你手动作答"
  }, c = (a) => e.createElement("button", {
    key: a,
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
      background: t === a ? "var(--app-accent, #ff7f16)" : "transparent",
      color: t === a ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
    },
    title: i[a],
    onClick: () => n(a)
  }, s[a]);
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
function pi(r) {
  const { R: e, templates: t, value: n, open: o, onOpenChange: s, disabled: i, onSelect: c, onManage: a } = r, m = Me().Popover, y = (t || []).find((E) => E.id === n), h = y ? y.name : "默认模板", x = {
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
    cursor: i ? "default" : "pointer",
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
    (t || []).map((E) => e.createElement(
      "div",
      {
        key: E.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (E.id === n ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: E.id === n ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          c(E.id), s(!1);
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
      }, E.name),
      E.builtin ? e.createElement("span", {
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
        s(!1), a();
      }
    }, "＋ 管理模板…")
  ), b = e.createElement(
    "button",
    {
      type: "button",
      style: x,
      disabled: i,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, h),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return m ? e.createElement(m, {
    content: f,
    trigger: "click",
    open: o,
    onOpenChange: s,
    placement: "bottomLeft"
  }, b) : b;
}
function di(r) {
  const { R: e, open: t, templates: n, value: o, edit: s, onEditChange: i, onClose: c, onSelect: a, onSave: g, onDelete: m } = r;
  if (!t) return null;
  const y = Me(), { Input: h, Modal: x } = y, f = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  x || (f.position = "fixed", f.right = 24, f.top = 80, f.width = 420, f.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", f.zIndex = 1100, f.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const b = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, E = !!s, L = (S, I, _, v) => h && h.TextArea ? e.createElement(h.TextArea, {
    value: S,
    rows: _,
    placeholder: v,
    onChange: (R) => I(R && R.target ? R.target.value : "")
  }) : e.createElement("textarea", {
    value: S,
    rows: _,
    placeholder: v,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (R) => I(R && R.target ? R.target.value : ""),
    onChange: (R) => I(R && R.target ? R.target.value : "")
  }), Q = e.createElement(
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
        E ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: c }, "关闭")
    ),
    E ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      L(s.name || "", (S) => i({ ...s, name: S }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      L(s.system || "", (S) => i({ ...s, system: S }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      L(s.user || "", (S) => i({ ...s, user: S }), 6, "用户提示词模板"),
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
          onClick: () => i(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (n || []).map(
        (S) => e.createElement(
          "div",
          {
            key: S.id,
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
            S.name + (S.builtin ? "（内置）" : "") + (S.id === o ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: b,
            title: "设为本题使用",
            onClick: () => a(S.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => i({
              id: S.id,
              name: S.name,
              system: S.system,
              user: S.user
            })
          }, "编辑"),
          S.builtin ? null : e.createElement("button", {
            type: "button",
            style: b,
            onClick: () => m(S.id)
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
          onClick: () => i({ id: "", name: "", system: "", user: "" })
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
  }, Q) : Q;
}
function fi(r) {
  const {
    R: e,
    busy: t,
    result: n,
    error: o,
    mode: s,
    onRun: i,
    onApply: c,
    onCancel: a,
    onRerun: g,
    disabled: m,
    children: y,
    open: h,
    onOpenChange: x
  } = r, b = Me().Popover, E = e.createElement("button", {
    type: "button",
    disabled: m,
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
      cursor: m ? "default" : "pointer"
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
      E,
      n && h ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((I) => I.reasoning).join(`

`))) : null
    );
  const L = !!(n && (n.per_question || []).length), Q = (I, _, v) => e.createElement("button", {
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
    onClick: _
  }, I), S = e.createElement(
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
      a ? e.createElement("button", {
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
            a();
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
        L && !t ? e.createElement("button", {
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
              (g || i)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        L && !t ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: L ? 6 : "auto",
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
          dangerouslySetInnerHTML: { __html: Ls(I.reasoning || "") }
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
      Q("开始分析", () => {
        try {
          i();
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
    content: S,
    trigger: "click",
    open: h,
    onOpenChange: x,
    placement: "bottomRight"
  }, E);
}
function hi(r) {
  const e = je().React, t = Me(), { Input: n, Button: o } = t, s = n.TextArea, i = r.data || {}, c = Fs(i), a = Ws(i), g = Hs(i), m = Us(g), y = m ? "" : g, h = c.questions || [], x = c.title || "问卷", f = rt(a), [b, E] = e.useState(
    () => !!(f && f.answered) || !!y || m
  ), [L, Q] = e.useState(""), [S, I] = e.useState(() => {
    const l = it(a);
    return l && l.request_id ? l.request_id : f && typeof f.reqId == "string" ? f.reqId : "";
  }), [_, v] = e.useState(
    () => f && typeof f.visStep == "number" && f.visStep >= 0 ? f.visStep : 0
  ), [R, j] = e.useState(
    () => f && typeof f.slowAt == "number" ? f.slowAt : 0
  ), [le, Gr] = e.useState(
    () => f && typeof f.slowStep == "number" ? f.slowStep : -1
  ), [Ie, Ft] = e.useState(
    () => !!(f && f.slowFired === !0)
  ), [me, De] = e.useState(() => {
    const l = {};
    h.forEach((d, p) => {
      l[`q${p}`] = { type: D(d), value: D(d) === "multi" ? [] : "", other: "" };
    });
    const u = f && f.answers;
    return u && typeof u == "object" && Object.keys(u).forEach((d) => {
      l[d] && (l[d] = { ...l[d], ...u[d] });
    }), l;
  }), [Fe, Vr] = e.useState(
    () => f && typeof f.finalOther == "string" ? f.finalOther : ""
  ), [O, ce] = e.useState(!1), [ue, Wt] = e.useState(
    () => f && typeof f.releasedNote == "string" ? f.releasedNote : ""
  ), [We, Ht] = e.useState(
    () => f && typeof f.localResult == "string" ? f.localResult : ""
  ), [oe, ct] = e.useState(
    () => !!(f && f.skippedAll) || /跳过了本次问卷/.test(y || "")
  ), [He, Bn] = e.useState(
    () => f && Array.isArray(f.finalOtherAtt) ? f.finalOtherAtt : []
  ), [ut, Ln] = e.useState(
    () => !!(f && f.expanded)
  ), [jn, pt] = e.useState(!1), Ut = e.useRef(0), [pe, Yr] = e.useState(
    () => f && typeof f.deadReason == "string" ? f.deadReason : ""
  ), [ge, Ue] = e.useState(
    () => f && typeof f.gateBlocked == "string" ? f.gateBlocked : ""
  ), [$e, Mn] = e.useState(
    () => f && typeof f.submittedAt == "number" ? f.submittedAt : 0
  ), [Zt, Jt] = e.useState(
    () => !!(f && f.pastSoft === !0)
  ), [Ze, dt] = e.useState(
    () => !!(f && f.waitRetired === !0)
  ), Je = e.useRef(
    !!(f && typeof f.submittedAt == "number" && f.submittedAt > 0 && Date.now() - f.submittedAt < bn * 1e3)
  ), be = e.useRef(!1), ft = e.useRef(!!(f && f.pastSoft === !0)), Qe = Er(), Kr = f && (f.mode === "ai" || f.mode === "recommend" || f.mode === "manual") ? f.mode : Qe.mode, [G, Dn] = e.useState(Kr), [Qt, Xt] = e.useState(Qe.modelId), [ht, Fn] = e.useState(Qe.withContext), [mt, Wn] = e.useState(Qe.parallel), [eo, to] = e.useState([]), [Hn, Gt] = e.useState(!1), [de, ze] = e.useState(null), [no, ye] = e.useState(""), [ro, oo] = e.useState(!1), [so, io] = e.useState(!1), [ao, lo] = e.useState("paid"), xe = e.useRef({}), se = e.useRef({}), Ce = e.useRef(0), Xe = e.useRef(null), [co, Ge] = e.useState(0), [Un, Vt] = e.useState([]), [ke, Yt] = e.useState(
    () => f && typeof f.templateId == "string" && f.templateId ? f.templateId : ""
  ), fe = e.useRef(ke);
  fe.current = ke;
  const [uo, po] = e.useState(!1), [fo, Zn] = e.useState(!1), [ho, Kt] = e.useState(null), [V, Jn] = e.useState(
    () => !!(f && f.autoPaused)
  ), mo = e.useRef(V);
  mo.current = V;
  const gt = e.useRef(!1), bt = e.useRef(/* @__PURE__ */ new Set()), Ve = (l) => {
    l && bt.current.add(l);
  }, yt = e.useRef({}), [go, Qn] = e.useState(0), Oe = e.useRef({}), en = e.useRef(!1), Xn = e.useRef(!1), xt = (l) => {
    if (l.mode !== void 0 && (Dn(l.mode), Le(a, { mode: l.mode })), !(l.modelId !== void 0 || l.withContext !== void 0 || l.parallel !== void 0)) return;
    en.current = !0;
    const d = {
      // Keep the GLOBAL default mode untouched — this card's mode is separate.
      // Reading the current global mirror so a model/ctx change here does not
      // stamp this card's (card-scoped) mode back onto the seed.
      mode: Er().mode,
      modelId: l.modelId !== void 0 ? l.modelId : Qt,
      withContext: l.withContext !== void 0 ? l.withContext : ht,
      parallel: l.parallel !== void 0 ? l.parallel : mt
    };
    Xt(d.modelId), Fn(d.withContext), Wn(d.parallel), Rr(d), zs(d);
  }, Gn = (l) => {
    !l || l === ke || (Yt(l), fe.current = l, Le(a, { templateId: l }), ze(null), xe.current = {}, se.current = {}, Ge((u) => u + 1));
  }, bo = async (l) => {
    const u = await Os({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!u.ok) {
      z("error", u.error || "保存失败");
      return;
    }
    Vt(u.items || []), Kt(null), z("success", "模板已保存");
  }, yo = async (l) => {
    const u = await Ps(l);
    if (!u.ok) {
      z("warning", u.error || "删除失败");
      return;
    }
    Vt(u.items || []);
    const d = (u.items || []).map((p) => p.id);
    if (d.indexOf(fe.current) === -1) {
      const p = d[0] || "";
      Yt(p), fe.current = p, Le(a, { templateId: p });
    }
    z("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    let l = !0;
    return Is(), (async () => {
      const [u, d, p] = await Promise.all([
        Ns(),
        $s(),
        Cs()
      ]);
      if (!l) return;
      to(u), Vt(p.items);
      const k = p.items.map((q) => q.id);
      if (!fe.current || k.indexOf(fe.current) === -1) {
        const q = p.defaultId || k[0] || "";
        q && (Yt(q), fe.current = q);
      }
      let w = Qe;
      if (d && !en.current && (w = d, f && (f.mode === "ai" || f.mode === "recommend" || f.mode === "manual") || Dn(d.mode), Xt(d.modelId), Fn(d.withContext), Wn(d.parallel), Rr(d)), !en.current && !w.modelId) {
        const q = await Bs();
        if (!l) return;
        q && q.provider_id && q.model && Xt(`${q.provider_id}:${q.model}`);
      }
      Xn.current = !0, Ge((q) => q + 1);
    })(), () => {
      l = !1;
    };
  }, [a]), e.useEffect(() => {
    Ce.current = _;
  }, [_]);
  const tn = async (l) => {
    if (Hn) return;
    const u = _;
    Gt(!0), ye("");
    const d = typeof AbortController < "u" ? new AbortController() : null;
    Xe.current = d;
    try {
      const p = await fetch(N("/question-modal/analyze"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          request_id: S,
          tool_call_id: a,
          session_id: ee(a),
          title: x,
          questions: h,
          model_id: Qt,
          mode: l,
          with_context: ht,
          parallel: mt,
          question_index: u,
          answers: me,
          template_id: fe.current
        }),
        signal: d ? d.signal : void 0
      }), k = await p.json().catch(() => ({})), w = k && k.analysis || null, q = w && w.error || k && k.error || "";
      k && k.cancelled || w && w.cancelled ? ye("已终止分析。") : !p.ok || !k || k.ok === !1 || w && w.ok === !1 ? ye(q || "分析失败（服务返回 " + p.status + "）") : w && (xe.current[u] = w, se.current[u] = !0, Ce.current === u && ze(w), z("success", "第 " + (u + 1) + " 题 AI 分析完成"));
    } catch (p) {
      Xe.current === d && d && d.signal.aborted || p && p.name === "AbortError" ? ye("已终止分析。") : ye("分析请求失败：" + (p && p.message ? p.message : p));
    } finally {
      Xe.current === d && (Xe.current = null), Gt(!1), Oe.current[u] = !0, Qn((p) => p + 1);
    }
  }, xo = () => {
    const l = _;
    delete xe.current[l], ze(null), ye(""), tn("manual");
  }, Pe = (l) => {
    var d;
    const u = l !== void 0 ? l : Ce.current;
    try {
      fetch(N("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          tool_call_id: a,
          request_id: S,
          question_index: u
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      (d = Xe.current) == null || d.abort();
    } catch {
    }
    Gt(!1);
  }, ko = () => {
    Pe(), ye("已终止分析。");
  }, wo = () => {
    V ? (yt.current = {}, Oe.current = {}, se.current = {}, gt.current = !1, Jn(!1), Ge((l) => l + 1), z("info", "已恢复自动答题")) : (Pe(), Jn(!0), z("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = xe.current[_];
    ze(l || null);
    const u = "?tool_call_id=" + encodeURIComponent(a) + "&question_index=" + _;
    let d = !0;
    return fetch(N("/question-modal/analysis") + u, { headers: B() }).then((p) => p.ok ? p.json() : null).then((p) => {
      !d || !p || !p.found || !p.analysis || (xe.current[_] = p.analysis, Ce.current === _ && ze(p.analysis));
    }).catch(() => {
    }), () => {
      d = !1;
    };
  }, [a, _]), e.useEffect(() => {
    b || Xn.current && G === "ai" && (!xn(c) || !h.length || se.current[_] || O || (se.current[_] = !0, tn("auto")));
  }, [b, G, a, co, ht, mt, h, _]);
  const vo = () => {
    const l = de && de.per_question || [];
    if (!l.length) return;
    if (!l.some((d) => d.type === "multi" ? String(d.choice || "").split(/[、,，]/).map((p) => p.trim()).filter(Boolean).length > 0 : String(d.choice || "").trim().length > 0)) {
      z("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    De((d) => {
      const p = { ...d };
      return l.forEach((k) => {
        const w = `q${k.index}`;
        Ve(w);
        const q = p[w] || { type: k.type, value: "", other: "" };
        if (k.type === "multi") {
          const Se = String(k.choice || "").split(/[、,，]/).map((U) => U.trim()).filter(Boolean);
          p[w] = { ...q, value: Se };
        } else
          p[w] = { ...q, value: k.choice || q.value };
      }), p;
    }), z("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, we = (l, u, d = !1) => {
    Pe(), Yr(l), ct(!0), Ht(u), pt(!1), E(!0), X(a), d && Le(a, { backendReleased: !0 });
  }, So = async (l, u) => {
    const d = await vn(a, ee(a));
    return d.ok ? (we(l, u, d.released), !0) : (pt(!0), rn(!1), !1);
  };
  e.useEffect(() => {
    var u;
    const l = (u = rt(a)) == null ? void 0 : u.answers;
    Le(a, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: S,
      visStep: _,
      answers: yn(me, l, bt.current),
      finalOther: Fe,
      finalOtherAtt: He,
      answered: b,
      skippedAll: oe,
      expanded: ut,
      localResult: We,
      submittedAt: $e,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Zt,
      waitRetired: Ze,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: R,
      slowStep: le,
      slowFired: Ie,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: pe,
      gateBlocked: ge,
      releasedNote: ue,
      autoPaused: V,
      templateId: ke
    });
  }, [
    a,
    S,
    _,
    me,
    Fe,
    He,
    b,
    oe,
    ut,
    We,
    $e,
    Zt,
    Ze,
    R,
    le,
    Ie,
    pe,
    V,
    ke,
    ge,
    ue
  ]), e.useEffect(() => {
    if (!b || !$e || Ze || !Je.current) return;
    let l = 0, u = !1, d = Sr(a);
    const p = () => {
      if (u) return;
      const k = Math.floor((Date.now() - $e) / 1e3);
      if (k >= bn) {
        be.current = !0, dt(!0);
        return;
      }
      if (!be.current) {
        const w = Sr(a);
        w >= 0 && (d < 0 ? d = w : w - d >= _s && (be.current = !0));
      }
      if (!be.current && k >= vs && !ft.current && (ft.current = !0, Jt(!0)), be.current) {
        l = setTimeout(
          () => {
            u || dt(!0);
          },
          Math.max(1e3, (bn - k) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        u || _r(p);
      }, Ur);
    };
    return _r(p), () => {
      u = !0, clearTimeout(l);
    };
  }, [b, $e, Ze]);
  const [nn, rn] = e.useState(!1), [on, Vn] = e.useState(""), Yn = (l, u, d) => {
    l.length && (u === "final" ? Bn((p) => p.concat(l)) : De((p) => {
      const k = d || `q${_}`;
      Ve(k);
      const w = p[k] || { type: "text", value: "", other: "" };
      return { ...p, [k]: { ...w, attachments: (w.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!a) return;
    const l = (p, k, w, q) => {
      Yn(p, k, w), q && q.length ? Vn(q.join("；")) : Vn("");
    }, u = (p) => rn(p);
    It.set(a, l), $t.set(a, u);
    const d = Ys(a);
    return d.length && d.forEach((p) => Yn([p.att], p.target, p.key)), rn(jt > 0), () => {
      It.get(a) === l && It.delete(a), $t.get(a) === u && $t.delete(a);
    };
  }, [a, _]);
  const sn = (l, u) => Gs(a, l, u), an = (l, u, d) => {
    const p = Ks(l);
    if (p.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Xr(p, a, u, d);
    }
  };
  e.useEffect(() => {
    if (!m || L) return;
    let l = !0;
    return kn(a).then((u) => {
      !l || !u || (u.kind === "skipped" && !u.answers && ct(!0), Q(Zs(h, u)));
    }), () => {
      l = !1;
    };
  }, [m, a, L]), e.useEffect(() => {
    if (b) return;
    let l = !0, u = 0, d = 0, p = 0;
    Ut.current || (Ut.current = Date.now());
    let k = !!it(a);
    const w = (A) => {
      !l || !A || !A.request_id || (k = !0, I(A.request_id), pt(!1), d && (clearTimeout(d), d = 0), si(
        a,
        A.request_id,
        A.session_id || Hr(),
        A.agent_id
      ));
    }, q = (A) => {
      l && (d && (clearTimeout(d), d = 0), p && (clearTimeout(p), p = 0), So(
        A,
        A === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Se = it(a), U = async () => {
      if (!Se) return !1;
      const A = await ai(Se.request_id);
      if (!l) return !0;
      if (A.kind === "found") {
        const M = A.data;
        return M.tool_call_id && a && M.tool_call_id !== a ? (X(a), !1) : (w(M), !0);
      }
      return A.kind === "orphan" ? (q("orphan"), !0) : (A.kind === "absent" && X(a), !1);
    }, et = (A = !1) => {
      if (l) {
        if (u += 1, A) {
          if (k) {
            q("gone");
            return;
          }
          const M = Date.now() - (Ut.current || Date.now());
          if (u >= 12 && M >= ri) {
            q("gone");
            return;
          }
        }
        d = setTimeout(Z, u < 8 ? 700 : 5e3);
      }
    }, ae = () => {
      Js(a, ee(a)).then((A) => {
        if (l) {
          if (A.kind === "found") {
            w(A.data);
            return;
          }
          if (A.kind === "orphan") {
            q("orphan");
            return;
          }
          if (A.kind === "error") {
            et(!1);
            return;
          }
          ti().then((M) => {
            if (l) {
              if (M) {
                if (M.tool_call_id && a && M.tool_call_id !== a) {
                  kn(a).then((_e) => {
                    if (l) {
                      if (_e) {
                        E(!0), X(a);
                        return;
                      }
                      et(!0);
                    }
                  });
                  return;
                }
                w(M);
                return;
              }
              kn(a).then((_e) => {
                if (l) {
                  if (_e) {
                    _e.kind === "skipped" && !_e.answers && ct(!0), E(!0), X(a);
                    return;
                  }
                  et(!0);
                }
              });
            }
          });
        }
      });
    }, Z = () => {
      if (l) {
        if (!Se) {
          ae();
          return;
        }
        U().then((A) => {
          !l || A || ae();
        });
      }
    };
    return p = setTimeout(() => {
      l && pt(!0);
    }, ni), Z(), () => {
      l = !1, d && clearTimeout(d), p && clearTimeout(p);
    };
  }, [b, a]);
  const Kn = async () => {
    ce(!0);
    try {
      const l = ee(a);
      let u = await vn(a, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await Ir(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok)
        throw new Error(
          u.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + u.reason + "）"
        );
      if (u.released) {
        const p = u.reason === "host-stop";
        we(
          u.reason === "orphan" ? "orphan" : "",
          u.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : p ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), z(
          "info",
          p ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        we(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), z("info", "本次问卷已失效，已关闭");
    } catch (l) {
      z("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ce(!1);
    }
  }, er = async () => {
    ce(!0);
    try {
      const l = ee(a);
      let u = await vn(a, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await Ir(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok) {
        Wt(u.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + u.reason + "）。"), z("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (u.released) {
        const p = u.reason === "host-stop";
        Wt(p ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), z("info", p ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        Wt("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), z("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      z("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ce(!1);
    }
  }, kt = he(h, me), ve = kt.length, ie = _ >= ve, W = ie ? -1 : kt[_], wt = ie ? ve : _;
  e.useEffect(() => {
    if (b || oe || pe) return;
    if (le !== wt) {
      Gr(wt), j(Date.now()), Ft(!1);
      return;
    }
    if (!R) {
      j(Date.now());
      return;
    }
    if (Ie) return;
    const l = R + Ss - Date.now();
    if (l <= 0) {
      Ft(!0);
      return;
    }
    let u = !1;
    const d = setTimeout(() => {
      u || Ft(!0);
    }, l);
    return () => {
      u = !0, clearTimeout(d);
    };
  }, [b, oe, pe, wt, le, R, Ie]);
  const H = W >= 0 ? h[W] : null, Ne = `q${W}`, P = W >= 0 && me[Ne] || { type: D(H), value: D(H) === "multi" ? [] : "", other: "" }, Be = (l) => {
    var p;
    ge && Ue(""), W >= 0 && Ve(`q${W}`);
    const u = { ...me, [Ne]: { ...l, skipped: !1 } }, d = he(h, u);
    h.forEach((k, w) => {
      d.indexOf(w) === -1 && delete u[`q${w}`];
    }), Le(a, {
      answers: yn(u, (p = rt(a)) == null ? void 0 : p.answers, bt.current)
    }), De(u);
  };
  e.useEffect(() => {
    _ > ve && v(ve);
  }, [ve, _]);
  const ln = async (l, u) => {
    const d = await fetch(N(l), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(u)
    }), p = await d.json().catch(() => ({}));
    if (!d.ok) {
      const k = new Error(p && p.detail || "HTTP " + d.status);
      throw k.status = d.status, k;
    }
    return p;
  }, tr = () => {
    var l;
    return yn(me, (l = rt(a)) == null ? void 0 : l.answers, bt.current);
  }, nr = (l, u) => {
    const d = [];
    if (typeof u == "number")
      return he(h, l).indexOf(u) !== -1 && !Nt(l[`q${u}`]) && d.push(u + 1), d;
    const p = new Set(he(h, l));
    return h.forEach((k, w) => {
      p.has(w) && !Nt(l[`q${w}`]) && d.push(w + 1);
    }), d;
  }, rr = (l, u, d) => {
    const p = "第 " + l.join("、") + " 题", k = d === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    Ue("⛔ " + p + "尚未选择。" + k);
    const w = he(h, u).length;
    ln("/question-modal/gate-block", {
      request_id: S,
      tool_call_id: a,
      session_id: ee(a),
      missing: l,
      answered: w - l.length,
      total: w,
      bundle: wr
    }).catch(() => {
    });
  }, cn = async (l, u = !1) => {
    if (!S) {
      z("warning", "问卷尚未就绪，请稍候");
      return;
    }
    const d = tr();
    if (!u) {
      const p = nr(d);
      if (p.length) {
        rr(p, d, "提交");
        return;
      }
      Ue("");
    }
    ce(!0);
    try {
      const p = await ln("/question-modal/answer", {
        request_id: S,
        session_id: ee(a),
        answers: d,
        other: Fe,
        attachments: He
      });
      if (p && p.orphan) {
        fetch(
          N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ee(a)),
          { method: "POST", headers: B() }
        ).catch(() => {
        }), we(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), z("info", "本次问卷已失效，已关闭");
        return;
      }
      X(a), Ht(li(h, d, Fe, He)), Mn(Date.now()), Jt(!1), dt(!1), be.current = !1, ft.current = !1, Je.current = !0, E(!0);
    } catch (p) {
      if (p && p.status === 404) {
        we(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), z("info", "本次问卷已失效，已关闭");
        return;
      }
      z("error", "提交失败: " + p.message);
    } finally {
      ce(!1);
    }
  }, _o = () => {
    W < 0 || (ge && Ue(""), Pe(Ce.current), se.current[Ce.current] = !0, Ve(`q${W}`), De((l) => {
      const u = { ...l };
      u[`q${W}`] = {
        type: (l[`q${W}`] || {}).type || D(H),
        value: ((l[`q${W}`] || {}).type || D(H)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const d = he(h, u);
      return h.forEach((p, k) => {
        d.indexOf(k) === -1 && delete u[`q${k}`];
      }), u;
    }), v((l) => l + 1));
  }, Eo = () => {
    if (ie) {
      cn();
      return;
    }
    const l = tr(), u = nr(l, W);
    if (u.length) {
      rr(u, l, "下一步");
      return;
    }
    ge && Ue(""), v((d) => d + 1);
  }, Ro = async () => {
    if (!S) {
      z("warning", "问卷尚未就绪，请稍候");
      return;
    }
    Pe(), ce(!0);
    try {
      const l = await ln("/question-modal/skip", {
        request_id: S,
        session_id: ee(a)
      });
      if (l && l.orphan) {
        we(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), z("info", "本次问卷已失效，已关闭");
        return;
      }
      z("info", "已跳过问卷"), X(a), ct(!0), Ht("用户跳过了本次问卷。"), Mn(Date.now()), Jt(!1), dt(!1), be.current = !1, ft.current = !1, Je.current = !0, E(!0);
    } catch (l) {
      if (l && l.status === 404) {
        we(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), z("info", "本次问卷已失效，已关闭");
        return;
      }
      z("error", "跳过失败: " + l.message);
    } finally {
      ce(!1);
    }
  };
  e.useEffect(() => {
    if (b || G !== "ai" && G !== "recommend" || V || !xn(c) || !h.length || O) return;
    if (ie) {
      if (gt.current || !kt.every(
        (Z, A) => !!Oe.current[A]
      )) return;
      gt.current = !0, cn(void 0, !0);
      return;
    }
    const l = _;
    if (yt.current[l] || G === "ai" && !Oe.current[l]) return;
    yt.current[l] = !0;
    const u = kt[l], d = h[u], p = D(d), k = qr(d), w = xe.current[l], q = w && w.per_question && w.per_question[0], Se = q ? String(q.choice || "").trim() : "", U = k.length ? k.join("、") : Se, et = !!U;
    Ve(`q${u}`), De((ae) => {
      const Z = { ...ae }, A = `q${u}`, M = Z[A] || { type: p, value: p === "multi" ? [] : "", other: "" };
      if (!et)
        Z[A] = { ...M, type: p, value: p === "multi" ? [] : "", other: "", skipped: !0 };
      else if (p === "multi") {
        const tt = d.options || [], Ee = (Y) => String(Y).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        Z[A] = { ...M, type: p, value: U.split(/[、,，]/).map((Y) => Ee(Y)).filter(Boolean).map((Y) => {
          const K = tt.find((dr) => J(dr) === Y || re(dr) === Y);
          return K ? J(K) : Y;
        }) };
      } else if (p === "single") {
        const tt = d.options || [], Ee = (K) => String(K).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Y = tt.find((K) => J(K) === U || re(K) === U) || tt.find((K) => J(K) === Ee(U) || re(K) === Ee(U));
        Z[A] = { ...M, type: p, value: Y ? J(Y) : U };
      } else
        Z[A] = { ...M, type: p, value: U };
      const _e = he(h, Z);
      return h.forEach((tt, Ee) => {
        _e.indexOf(Ee) === -1 && delete Z[`q${Ee}`];
      }), Z;
    }), se.current[l] = !0, Oe.current[l] = !0, v((ae) => ae + 1), Qn((ae) => ae + 1);
  }, [b, G, V, O, a, _, go, ve, c]);
  const vt = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, un = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, pn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, St = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, dn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, or = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, fn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, qo = { display: "flex", flexDirection: "column", gap: 8 }, _t = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, Et = {
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
  }, Ye = {
    ...Et,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Ao = {
    ...Et,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, hn = {
    ...Et,
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
  }, sr = {
    // Restored to the original look (user asked for options to stay as-is).
    ...hn,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, To = {}, Io = {
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
  }, $o = { height: 32, fontSize: 13, borderRadius: 8 }, ir = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, ar = (l) => {
    const u = J(l);
    return P.type === "multi" ? Array.isArray(P.value) && P.value.indexOf(u) !== -1 : P.value === u;
  }, lr = ar(Re), cr = (l) => {
    if (b || O) return;
    const u = J(l);
    if (P.type === "multi") {
      const d = Array.isArray(P.value) ? P.value.slice() : [], p = d.indexOf(u);
      p === -1 ? d.push(u) : d.splice(p, 1), Be({ ...P, value: d, other: d.indexOf(Re) !== -1 ? P.other : "" });
    } else
      Be({ ...P, value: u });
  }, ur = (l, u, d, p, k) => e.createElement(
    "button",
    {
      key: p,
      type: "button",
      disabled: b || O,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      style: k ? { ...u ? sr : hn, ...To } : u ? sr : hn,
      onClick: d
    },
    // #2: badge goes on the LEFT of the option text.
    k ? e.createElement("span", {
      key: "rec",
      className: "qm-rec-badge",
      "data-qm-rec": "true",
      style: Io
    }, "AI 推荐") : null,
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (u ? "✓ " : "") + l)
  );
  if (!b && !xn(c))
    return e.createElement(
      "div",
      { style: vt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": a },
      e.createElement(
        "div",
        { style: un, className: "qm-header" },
        e.createElement(
          "div",
          { style: pn },
          gn(e),
          e.createElement("span", { style: St, className: "qm-title" }, x)
        ),
        e.createElement("span", { style: dn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...or, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      jn ? e.createElement(
        "div",
        { style: _t },
        e.createElement("button", {
          type: "button",
          disabled: O,
          style: { ...Ye, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Kn
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = () => {
      const d = As({
        submittedAt: $e,
        deadReason: pe,
        releasedNote: ue,
        skippedAll: oe,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: Ze,
        pastSoft: Zt,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!Je.current
      });
      return d ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": a,
        "data-qm-phase": d.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: d.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, qs(d.phase)) : null;
    }, u = !!Je.current;
    return oe && !ut ? e.createElement(
      "div",
      {
        style: {
          ...vt,
          padding: "8px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        },
        className: "qm-card",
        "data-qm-card": "true",
        "data-qm-card-id": a
      },
      e.createElement("span", {
        style: { color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "›"),
      e.createElement(
        "span",
        { style: { fontSize: 13, fontWeight: 500 } },
        pe ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      e.createElement("span", {
        style: { ...St, flex: ue ? 0 : 1, opacity: 0.75 }
      }, x),
      ue ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, ue) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...Ye,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Ln(!0)
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
        disabled: O,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ...Ye,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: er
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: vt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": a },
      e.createElement(
        "div",
        { style: { ...un, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: pn },
          gn(e),
          e.createElement("span", { style: St }, x)
        ),
        e.createElement(
          "span",
          { style: { ...dn, color: pe ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          pe ? "已失效" : oe ? "已跳过" : "已完成"
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
      }, oe ? We ? We + `

` + zt(h) : `已跳过本次问卷。

` + zt(h) : We || L || y || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + zt(h)),
      oe && ut ? e.createElement(
        "div",
        { style: _t },
        e.createElement("button", {
          type: "button",
          style: Ye,
          onClick: () => Ln(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ..._t, marginTop: 8, gap: 10 } },
        ue ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, ue) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        u ? e.createElement("button", {
          type: "button",
          disabled: O,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...Ye, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: er
        }, "释放阻塞") : null
      )
    );
  }
  const pr = Ie && le === wt;
  let Rt = null;
  if (ie)
    Rt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: fn }, "其他意见（可选）"),
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Fe,
        style: ir,
        onChange: (l) => Vr(l.target.value),
        onPaste: (l) => an(l, "final", "final")
      }),
      Sn({
        R: e,
        files: He,
        disabled: b || O,
        uploading: nn,
        error: on,
        onPick: () => sn("final", "final"),
        onRemove: (l) => Bn((u) => u.filter((d, p) => p !== l))
      })
    );
  else if (H && D(H) === "text")
    Rt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...fn, fontSize: 13, color: "var(--app-text, inherit)" } }, H.title),
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof P.value == "string" ? P.value : "",
        style: ir,
        onChange: (l) => Be({ ...P, value: l.target.value, other: "" }),
        onPaste: (l) => an(l, "q", Ne)
      }),
      Sn({
        R: e,
        files: P.attachments || [],
        disabled: b || O,
        uploading: nn,
        error: on,
        onPick: () => sn("q", Ne),
        onRemove: (l) => Be({
          ...P,
          attachments: (P.attachments || []).filter((u, d) => d !== l)
        })
      })
    );
  else if (H) {
    const l = qr(H), u = l.length ? l : de && de.per_question && de.per_question[0] && String(de.per_question[0].choice || "").trim() ? [String(de.per_question[0].choice).trim()] : l, d = (H.options || []).map((p, k) => ur(
      re(p),
      ar(p),
      () => cr(p),
      "o" + k,
      js(H, p, u)
    ));
    d.push(ur("其他", lr, () => cr(Re), "other")), lr && (d.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: P.other,
      style: { ...$o, marginTop: 2 },
      onChange: (p) => Be({ ...P, other: p.target.value }),
      onPaste: (p) => an(p, "q", Ne)
    })), d.push(Sn({
      R: e,
      files: P.attachments || [],
      disabled: b || O,
      uploading: nn,
      error: on,
      onPick: () => sn("q", Ne),
      onRemove: (p) => Be({
        ...P,
        attachments: (P.attachments || []).filter((k, w) => w !== p)
      })
    }))), Rt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...fn, fontSize: 13, color: "var(--app-text, inherit)" } }, H.title),
      e.createElement("div", { style: { ...qo, marginTop: 8 } }, d)
    );
  }
  const mn = ve + 1, zo = ie ? mn + "/" + mn : _ + 1 + "/" + mn, Ke = {
    ...Et,
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
    { style: vt, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": a },
    e.createElement(
      "div",
      { style: un, className: "qm-header" },
      e.createElement(
        "div",
        { style: pn },
        gn(e),
        e.createElement("span", { style: St, className: "qm-title" }, x)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        ci({
          R: e,
          providers: eo,
          modelId: Qt,
          disabled: b || O,
          open: so,
          onOpenChange: io,
          tab: ao,
          onTabChange: lo,
          onChange: (l) => {
            xt({ modelId: l }), ze(null), xe.current = {}, se.current = {}, Ge((u) => u + 1);
          }
        }),
        pi({
          R: e,
          templates: Un,
          value: ke,
          open: uo,
          onOpenChange: po,
          disabled: b || O,
          onSelect: Gn,
          onManage: () => Zn(!0)
        }),
        ui({
          R: e,
          mode: G,
          disabled: b || O,
          onChange: (l) => {
            xt({ mode: l }), l === "ai" && (se.current = {}), l === "ai" || l === "recommend" ? (yt.current = {}, Oe.current = {}, gt.current = !1, Ge((u) => u + 1)) : Pe();
          }
        }),
        fi({
          R: e,
          busy: Hn,
          result: de,
          error: no,
          mode: G,
          disabled: b || O,
          open: ro,
          onOpenChange: oo,
          onRun: () => {
            tn("manual");
          },
          onRerun: xo,
          onApply: vo,
          onCancel: ko,
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
                checked: ht,
                onChange: (l) => xt({ withContext: !!l.target.checked })
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
                checked: mt,
                onChange: (l) => xt({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (G === "ai" || G === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: O,
          onClick: wo,
          style: {
            ...Ke,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...V ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: V ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, V ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: dn, key: "qm-step" }, zo)
      )
    ),
    e.createElement("div", { style: or }, Rt),
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    di({
      R: e,
      open: fo,
      templates: Un,
      value: ke,
      edit: ho,
      onEditChange: Kt,
      onClose: () => {
        Zn(!1), Kt(null);
      },
      onSelect: (l) => Gn(l),
      onSave: bo,
      onDelete: yo
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
    (pr || jn && !S) && !b ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": Ie ? a : void 0,
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
        (pr ? "⚠️ 本题已超过 60s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (S ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: O,
        style: {
          ...Ke,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Kn,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    ge && !b ? e.createElement("div", {
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
      "data-qm-bundle": wr
    }, ge) : null,
    e.createElement(
      "div",
      { style: _t, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: _ === 0 || O,
        style: { ...Ke, marginRight: "auto", opacity: _ === 0 ? 0.5 : 1 },
        onClick: () => v((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement("button", {
        type: "button",
        disabled: O,
        style: Ke,
        // 「跳过并提交」是明确的提交意图，不套空答卷闸门（allowEmpty=true）。
        onClick: ie ? () => cn(void 0, !0) : _o
      }, ie ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: O,
        style: Ke,
        onClick: Ro
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: O,
        style: Ao,
        onClick: Eo
      }, ie ? "提交" : "下一步")
    )
  );
}
function mi() {
  const r = ys();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return ws(), r.toolRender(bs, kr, hi), console.log("[question-modal] registered via chat.toolRender for", kr), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!mi()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
