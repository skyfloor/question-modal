var go = Object.defineProperty;
var er = (r) => {
  throw TypeError(r);
};
var bo = (r, e, t) => e in r ? go(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var C = (r, e, t) => bo(r, typeof e != "symbol" ? e + "" : e, t), yo = (r, e, t) => e.has(r) || er("Cannot " + t);
var tr = (r, e, t) => e.has(r) ? er("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var yt = (r, e, t) => (yo(r, e, "access private method"), t);
function mn() {
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
let Re = mn();
function mr(r) {
  Re = r;
}
const gr = /[&<>"']/, xo = new RegExp(gr.source, "g"), br = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, ko = new RegExp(br.source, "g"), wo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, nr = (r) => wo[r];
function W(r, e) {
  if (e) {
    if (gr.test(r))
      return r.replace(xo, nr);
  } else if (br.test(r))
    return r.replace(ko, nr);
  return r;
}
const vo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function So(r) {
  return r.replace(vo, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const _o = /(^|[^\[])\^/g;
function z(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (o, s) => {
      let i = typeof s == "string" ? s : s.source;
      return i = i.replace(_o, "$1"), t = t.replace(o, i), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function rr(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const Ve = { exec: () => null };
function or(r, e) {
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
function xt(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let o = 0;
  for (; o < n && r.charAt(n - o - 1) === e; )
    o++;
  return r.slice(0, n - o);
}
function Eo(r, e) {
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
function sr(r, e, t, n) {
  const o = e.href, s = e.title ? W(e.title) : null, i = r[1].replace(/\\([\[\]])/g, "$1");
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
    text: W(i)
  };
}
function Ro(r, e) {
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
class _t {
  // set by the lexer
  constructor(e) {
    C(this, "options");
    C(this, "rules");
    // set by the lexer
    C(this, "lexer");
    this.options = e || Re;
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
        text: this.options.pedantic ? n : xt(n, `
`)
      };
    }
  }
  fences(e) {
    const t = this.rules.block.fences.exec(e);
    if (t) {
      const n = t[0], o = Ro(n, t[3] || "");
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
        const o = xt(n, "#");
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
      n = xt(n.replace(/^ *>[ \t]?/gm, ""), `
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
        let h = !1;
        if (!(t = i.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let y = t[2].split(`
`, 1)[0].replace(/^\t+/, (j) => " ".repeat(3 * j.length)), f = e.split(`
`, 1)[0], x = 0;
        this.options.pedantic ? (x = 2, a = y.trimStart()) : (x = t[2].search(/[^ ]/), x = x > 4 ? 1 : x, a = y.slice(x), x += t[1].length);
        let m = !1;
        if (!y && /^ *$/.test(f) && (c += f + `
`, e = e.substring(f.length + 1), h = !0), !h) {
          const j = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), Q = new RegExp(`^ {0,${Math.min(3, x - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), S = new RegExp(`^ {0,${Math.min(3, x - 1)}}(?:\`\`\`|~~~)`), I = new RegExp(`^ {0,${Math.min(3, x - 1)}}#`);
          for (; e; ) {
            const _ = e.split(`
`, 1)[0];
            if (f = _, this.options.pedantic && (f = f.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), S.test(f) || I.test(f) || j.test(f) || Q.test(e))
              break;
            if (f.search(/[^ ]/) >= x || !f.trim())
              a += `
` + f.slice(x);
            else {
              if (m || y.search(/[^ ]/) >= 4 || S.test(y) || I.test(y) || Q.test(y))
                break;
              a += `
` + f;
            }
            !m && !f.trim() && (m = !0), c += _ + `
`, e = e.substring(_.length + 1), y = f.slice(x);
          }
        }
        s.loose || (g ? s.loose = !0 : /\n *\n *$/.test(c) && (g = !0));
        let b = null, R;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(a), b && (R = b[0] !== "[ ] ", a = a.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: R,
          loose: !1,
          text: a,
          tokens: []
        }), s.raw += c;
      }
      s.items[s.items.length - 1].raw = c.trimEnd(), s.items[s.items.length - 1].text = a.trimEnd(), s.raw = s.raw.trimEnd();
      for (let h = 0; h < s.items.length; h++)
        if (this.lexer.state.top = !1, s.items[h].tokens = this.lexer.blockTokens(s.items[h].text, []), !s.loose) {
          const y = s.items[h].tokens.filter((x) => x.type === "space"), f = y.length > 0 && y.some((x) => /\n.*\n/.test(x.raw));
          s.loose = f;
        }
      if (s.loose)
        for (let h = 0; h < s.items.length; h++)
          s.items[h].loose = !0;
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
    const n = or(t[1]), o = t[2].replace(/^\||\| *$/g, "").split("|"), s = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
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
        i.rows.push(or(c, i.header.length).map((a) => ({
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
        text: W(t[1])
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
        const i = xt(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0)
          return;
      } else {
        const i = Eo(t[2], "()");
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
      return o = o.trim(), /^</.test(o) && (this.options.pedantic && !/>$/.test(n) ? o = o.slice(1) : o = o.slice(1, -1)), sr(t, {
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
      return sr(n, s, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let o = this.rules.inline.emStrongLDelim.exec(e);
    if (!o || o[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(o[1] || o[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const i = [...o[0]].length - 1;
      let c, a, g = i, h = 0;
      const y = o[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (y.lastIndex = 0, t = t.slice(-1 * e.length + i); (o = y.exec(t)) != null; ) {
        if (c = o[1] || o[2] || o[3] || o[4] || o[5] || o[6], !c)
          continue;
        if (a = [...c].length, o[3] || o[4]) {
          g += a;
          continue;
        } else if ((o[5] || o[6]) && i % 3 && !((i + a) % 3)) {
          h += a;
          continue;
        }
        if (g -= a, g > 0)
          continue;
        a = Math.min(a, a + g + h);
        const f = [...o[0]][0].length, x = e.slice(0, i + o.index + f + a);
        if (Math.min(i, a) % 2) {
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
      return o && s && (n = n.substring(1, n.length - 1)), n = W(n, !0), {
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
      return t[2] === "@" ? (n = W(t[1]), o = "mailto:" + n) : (n = W(t[1]), o = n), {
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
        o = W(t[0]), s = "mailto:" + o;
      else {
        let i;
        do
          i = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (i !== t[0]);
        o = W(t[0]), t[1] === "www." ? s = "http://" + t[0] : s = t[0];
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
      return this.lexer.state.inRawBlock ? n = t[0] : n = W(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const To = /^(?: *(?:\n|$))+/, qo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Ao = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, et = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Io = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, yr = /(?:[*+-]|\d{1,9}[.)])/, xr = z(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, yr).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), gn = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, $o = /^[^\n]+/, bn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, zo = z(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", bn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Co = z(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, yr).getRegex(), $t = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", yn = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Oo = z("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", yn).replace("tag", $t).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), kr = z(gn).replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", $t).getRegex(), Po = z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", kr).getRegex(), xn = {
  blockquote: Po,
  code: qo,
  def: zo,
  fences: Ao,
  heading: Io,
  hr: et,
  html: Oo,
  lheading: xr,
  list: Co,
  newline: To,
  paragraph: kr,
  table: Ve,
  text: $o
}, ir = z("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", $t).getRegex(), Bo = {
  ...xn,
  table: ir,
  paragraph: z(gn).replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ir).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", $t).getRegex()
}, No = {
  ...xn,
  html: z(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", yn).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ve,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: z(gn).replace("hr", et).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", xr).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, wr = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Lo = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, vr = /^( {2,}|\\)\n(?!\s*$)/, jo = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, tt = "\\p{P}\\p{S}", Mo = z(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, tt).getRegex(), Do = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Wo = z(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, tt).getRegex(), Fo = z("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, tt).getRegex(), Ho = z("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, tt).getRegex(), Zo = z(/\\([punct])/, "gu").replace(/punct/g, tt).getRegex(), Uo = z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Jo = z(yn).replace("(?:-->|$)", "-->").getRegex(), Qo = z("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Jo).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Et = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Xo = z(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Et).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Sr = z(/^!?\[(label)\]\[(ref)\]/).replace("label", Et).replace("ref", bn).getRegex(), _r = z(/^!?\[(ref)\](?:\[\])?/).replace("ref", bn).getRegex(), Go = z("reflink|nolink(?!\\()", "g").replace("reflink", Sr).replace("nolink", _r).getRegex(), kn = {
  _backpedal: Ve,
  // only used for GFM url
  anyPunctuation: Zo,
  autolink: Uo,
  blockSkip: Do,
  br: vr,
  code: Lo,
  del: Ve,
  emStrongLDelim: Wo,
  emStrongRDelimAst: Fo,
  emStrongRDelimUnd: Ho,
  escape: wr,
  link: Xo,
  nolink: _r,
  punctuation: Mo,
  reflink: Sr,
  reflinkSearch: Go,
  tag: Qo,
  text: jo,
  url: Ve
}, Vo = {
  ...kn,
  link: z(/^!?\[(label)\]\((.*?)\)/).replace("label", Et).getRegex(),
  reflink: z(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Et).getRegex()
}, dn = {
  ...kn,
  escape: z(wr).replace("])", "~|])").getRegex(),
  url: z(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Yo = {
  ...dn,
  br: z(vr).replace("{2,}", "*").getRegex(),
  text: z(dn.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, kt = {
  normal: xn,
  gfm: Bo,
  pedantic: No
}, Xe = {
  normal: kn,
  gfm: dn,
  breaks: Yo,
  pedantic: Vo
};
class te {
  constructor(e) {
    C(this, "tokens");
    C(this, "options");
    C(this, "state");
    C(this, "tokenizer");
    C(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Re, this.options.tokenizer = this.options.tokenizer || new _t(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: kt.normal,
      inline: Xe.normal
    };
    this.options.pedantic ? (t.block = kt.pedantic, t.inline = Xe.pedantic) : this.options.gfm && (t.block = kt.gfm, this.options.breaks ? t.inline = Xe.breaks : t.inline = Xe.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: kt,
      inline: Xe
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
          this.options.extensions.startBlock.forEach((h) => {
            g = h.call({ lexer: this }, a), typeof g == "number" && g >= 0 && (c = Math.min(c, g));
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
      const h = Object.keys(this.tokens.links);
      if (h.length > 0)
        for (; (c = this.tokenizer.rules.inline.reflinkSearch.exec(i)) != null; )
          h.includes(c[0].slice(c[0].lastIndexOf("[") + 1, -1)) && (i = i.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (c = this.tokenizer.rules.inline.blockSkip.exec(i)) != null; )
      i = i.slice(0, c.index) + "[" + "a".repeat(c[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (c = this.tokenizer.rules.inline.anyPunctuation.exec(i)) != null; )
      i = i.slice(0, c.index) + "++" + i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (a || (g = ""), a = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((h) => (n = h.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
          let h = 1 / 0;
          const y = e.slice(1);
          let f;
          this.options.extensions.startInline.forEach((x) => {
            f = x.call({ lexer: this }, y), typeof f == "number" && f >= 0 && (h = Math.min(h, f));
          }), h < 1 / 0 && h >= 0 && (s = e.substring(0, h + 1));
        }
        if (n = this.tokenizer.inlineText(s)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (g = n.raw.slice(-1)), a = !0, o = t[t.length - 1], o && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
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
class Rt {
  constructor(e) {
    C(this, "options");
    this.options = e || Re;
  }
  code(e, t, n) {
    var s;
    const o = (s = (t || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, o ? '<pre><code class="language-' + W(o) + '">' + (n ? e : W(e, !0)) + `</code></pre>
` : "<pre><code>" + (n ? e : W(e, !0)) + `</code></pre>
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
    const o = rr(e);
    if (o === null)
      return n;
    e = o;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + t + '"'), s += ">" + n + "</a>", s;
  }
  image(e, t, n) {
    const o = rr(e);
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
class wn {
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
    this.options = e || Re, this.options.renderer = this.options.renderer || new Rt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new wn();
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
          n += this.renderer.heading(this.parseInline(i.tokens), i.depth, So(this.parseInline(i.tokens, this.textRenderer)));
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
          for (let h = 0; h < i.header.length; h++)
            a += this.renderer.tablecell(this.parseInline(i.header[h].tokens), { header: !0, align: i.align[h] });
          c += this.renderer.tablerow(a);
          let g = "";
          for (let h = 0; h < i.rows.length; h++) {
            const y = i.rows[h];
            a = "";
            for (let f = 0; f < y.length; f++)
              a += this.renderer.tablecell(this.parseInline(y[f].tokens), { header: !1, align: i.align[f] });
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
          let h = "";
          for (let y = 0; y < i.items.length; y++) {
            const f = i.items[y], x = f.checked, m = f.task;
            let b = "";
            if (f.task) {
              const R = this.renderer.checkbox(!!x);
              g ? f.tokens.length > 0 && f.tokens[0].type === "paragraph" ? (f.tokens[0].text = R + " " + f.tokens[0].text, f.tokens[0].tokens && f.tokens[0].tokens.length > 0 && f.tokens[0].tokens[0].type === "text" && (f.tokens[0].tokens[0].text = R + " " + f.tokens[0].tokens[0].text)) : f.tokens.unshift({
                type: "text",
                text: R + " "
              }) : b += R + " ";
            }
            b += this.parse(f.tokens, g), h += this.renderer.listitem(b, m, !!x);
          }
          n += this.renderer.list(h, c, a);
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
class Ye {
  constructor(e) {
    C(this, "options");
    this.options = e || Re;
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
C(Ye, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Ee, fn, Er;
class Ko {
  constructor(...e) {
    tr(this, Ee);
    C(this, "defaults", mn());
    C(this, "options", this.setOptions);
    C(this, "parse", yt(this, Ee, fn).call(this, te.lex, ne.parse));
    C(this, "parseInline", yt(this, Ee, fn).call(this, te.lexInline, ne.parseInline));
    C(this, "Parser", ne);
    C(this, "Renderer", Rt);
    C(this, "TextRenderer", wn);
    C(this, "Lexer", te);
    C(this, "Tokenizer", _t);
    C(this, "Hooks", Ye);
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
        const s = this.defaults.renderer || new Rt(this.defaults);
        for (const i in n.renderer) {
          if (!(i in s))
            throw new Error(`renderer '${i}' does not exist`);
          if (i === "options")
            continue;
          const c = i, a = n.renderer[c], g = s[c];
          s[c] = (...h) => {
            let y = a.apply(s, h);
            return y === !1 && (y = g.apply(s, h)), y || "";
          };
        }
        o.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new _t(this.defaults);
        for (const i in n.tokenizer) {
          if (!(i in s))
            throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i))
            continue;
          const c = i, a = n.tokenizer[c], g = s[c];
          s[c] = (...h) => {
            let y = a.apply(s, h);
            return y === !1 && (y = g.apply(s, h)), y;
          };
        }
        o.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new Ye();
        for (const i in n.hooks) {
          if (!(i in s))
            throw new Error(`hook '${i}' does not exist`);
          if (i === "options")
            continue;
          const c = i, a = n.hooks[c], g = s[c];
          Ye.passThroughHooks.has(i) ? s[c] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(a.call(s, h)).then((f) => g.call(s, f));
            const y = a.call(s, h);
            return g.call(s, y);
          } : s[c] = (...h) => {
            let y = a.apply(s, h);
            return y === !1 && (y = g.apply(s, h)), y;
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
Ee = new WeakSet(), fn = function(e, t) {
  return (n, o) => {
    const s = { ...o }, i = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (i.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), i.async = !0);
    const c = yt(this, Ee, Er).call(this, !!i.silent, !!i.async);
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
}, Er = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const o = "<p>An error occurred:</p><pre>" + W(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(o) : o;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const _e = new Ko();
function A(r, e) {
  return _e.parse(r, e);
}
A.options = A.setOptions = function(r) {
  return _e.setOptions(r), A.defaults = _e.defaults, mr(A.defaults), A;
};
A.getDefaults = mn;
A.defaults = Re;
A.use = function(...r) {
  return _e.use(...r), A.defaults = _e.defaults, mr(A.defaults), A;
};
A.walkTokens = function(r, e) {
  return _e.walkTokens(r, e);
};
A.parseInline = _e.parseInline;
A.Parser = ne;
A.parser = ne.parse;
A.Renderer = Rt;
A.TextRenderer = wn;
A.Lexer = te;
A.lexer = te.lex;
A.Tokenizer = _t;
A.Hooks = Ye;
A.parse = A;
A.options;
A.setOptions;
A.use;
A.walkTokens;
A.parseInline;
ne.parse;
te.lex;
const es = "question-modal", ar = "question_modal", lr = "gate-v2@2026.10.21";
function Pe() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function ts() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Be() {
  return Pe().antd || {};
}
function ns() {
  return Pe().antdIcons || {};
}
const rs = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function on(r) {
  const e = ns();
  for (const t of rs) {
    const n = e[t];
    if (n)
      return r.createElement(n, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return r.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function os() {
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
    const e = Pe();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(r);
  } catch {
  }
  return "/api" + r;
}
let Rr = "", Tr = "";
function vn(r, e) {
  r && (Tr = r), e && (Rr = e);
}
function L() {
  const r = { "Content-Type": "application/json" };
  try {
    const e = Pe(), t = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    t && (r.Authorization = "Bearer " + t);
    let n = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    n || (n = Rr), n && (r["X-Agent-Id"] = n);
  } catch {
  }
  return r;
}
function qr() {
  try {
    const e = Pe();
    if (typeof e.getCurrentSessionId == "function") {
      const t = e.getCurrentSessionId() || "";
      if (t) return t;
    }
  } catch {
  }
  const r = window.currentSessionId;
  return typeof r == "string" && r ? r : Tr;
}
function ee(r) {
  const e = Ke(r);
  return e && e.session_id ? e.session_id : qr();
}
const Sn = "qm:v1:analysis:global", ss = "qm:v1:analysis:", hn = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Ar(r) {
  if (!r || typeof r != "object") return { ...hn };
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
function cr() {
  try {
    const r = localStorage.getItem(Sn);
    return r ? Ar(JSON.parse(r)) : { ...hn };
  } catch {
    return { ...hn };
  }
}
function ur(r) {
  try {
    localStorage.setItem(Sn, JSON.stringify(r));
  } catch {
  }
}
function is() {
  try {
    const r = [];
    for (let e = 0; e < localStorage.length; e++) {
      const t = localStorage.key(e);
      t && t.indexOf(ss) === 0 && t !== Sn && r.push(t);
    }
    r.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function as() {
  try {
    const r = await fetch(N("/question-modal/prefs"), { headers: L() });
    if (!r.ok) return null;
    const e = await r.json();
    return !e || !e.ok || !e.prefs ? null : Ar(e.prefs);
  } catch {
    return null;
  }
}
function ls(r) {
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
async function cs() {
  try {
    const r = await fetch(N("/question-modal/templates"), { headers: L() });
    if (!r.ok) return { items: [], defaultId: "" };
    const e = await r.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function us(r) {
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
async function ps(r) {
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
async function ds() {
  try {
    const r = await fetch(N("/models"), { headers: L() });
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
async function fs() {
  try {
    const r = await fetch(N("/models/active"), { headers: L() });
    if (!r.ok) return {};
    const e = await r.json();
    return (e == null ? void 0 : e.active_llm) || {};
  } catch {
    return {};
  }
}
function hs(r) {
  if (!r) return "";
  try {
    return String(A.parse(r, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + r.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function $(r, e) {
  try {
    const t = Be().message;
    if (t && typeof t[r] == "function") {
      t[r](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", r, e);
}
const Se = "__other__";
function J(r) {
  return String(r && typeof r == "object" ? r.value ?? r.label ?? "" : r);
}
function Tt(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function sn(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((o) => {
    if (t && t.has(o) || !Object.prototype.hasOwnProperty.call(n, o)) return;
    const s = e[o];
    !s || typeof s != "object" || !Tt(n[o]) && Tt(s) && (n[o] = { ...s });
  }), n;
}
function pr(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function ms(r, e, t) {
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
function gs(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (s) => {
    s != null && s !== "" && t.add(String(s));
  }, o = r.options || [];
  if (D(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((i) => {
      n(i);
      const c = o.find((a) => J(a) === String(i));
      c && n(re(c)), String(i) === Se && e.other && n(e.other);
    });
  else {
    n(e.value);
    const s = o.find((i) => J(i) === String(e.value));
    s && n(re(s)), String(e.value) === Se && e.other && n(e.other);
  }
  return t;
}
function bs(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const o = String(n);
    if (o.startsWith("=")) return e.has(o.slice(1));
    if (e.has(o)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(o) !== -1 || o.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Ir(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const o = parseInt(t[1], 10);
    if (o >= 0 && o < e.length) return o;
  }
  return e.findIndex((o) => (o.title || "").trim() === r.trim());
}
function $r(r, e, t) {
  const n = e[r], o = n && n.showIf;
  if (!o || typeof o != "object" || !Object.keys(o).length) return !0;
  for (const s of Object.keys(o)) {
    const i = Ir(s, e);
    if (i < 0) continue;
    const c = e[i];
    if (!c) continue;
    if (c.showIf && !$r(i, e, t)) return !1;
    const a = t[`q${i}`];
    if (!a || !bs(o[s], gs(c, a))) return !1;
  }
  return !0;
}
function fe(r, e) {
  const t = [];
  return r.forEach((n, o) => {
    $r(o, r, e) && t.push(o);
  }), t;
}
function ys(r) {
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
function xs(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data;
    return t && t.call_id || "";
  } catch {
    return "";
  }
}
function ks(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data, n = t && t.output;
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((o) => o && (o.text || o.content) || "").join(`
`) : String(n) : "";
  } catch {
    return "";
  }
}
function ws(r) {
  return r ? /\[scroll folded\]/.test(r) : !1;
}
function vs(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers)
    return `已跳过本次问卷。

` + St(r);
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((o) => {
    const s = t[o];
    if (!s || typeof s != "object") return;
    const i = Ir(o, r), c = i >= 0 ? r[i] : null, a = c ? D(c) === "single" ? "单选" : D(c) === "multi" ? "多选" : "问答" : "问答", g = c ? c.title : o;
    let h = s.value;
    Array.isArray(h) && (h = h.join("、")), s.other && (h = (h ? h + "、" : "") + s.other), s.skipped ? n.push(`- ${o} [${a}] ${g}（用户跳过本题）`) : n.push(`- ${o} [${a}] ${g}：${h === "" || h == null ? "（空）" : h}`);
  }), e.other && n.push("", `其他意见：${e.other}`), n.join(`
`);
}
async function Ss(r, e) {
  try {
    const t = new URLSearchParams();
    r && t.set("tool_call_id", r), e && t.set("session_id", e);
    const n = await fetch(
      N("/question-modal/resolve") + "?" + t.toString(),
      { headers: L() }
    );
    if (!n.ok) return { kind: "error" };
    const o = await n.json();
    return o && vn(o.session_id, o.agent_id), o && o.found ? { kind: "found", data: o } : o && o.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function ln(r) {
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
async function _s(r) {
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
const qt = "qm:v1:stash_att:", dr = 25 * 1024 * 1024, wt = /* @__PURE__ */ new Map(), vt = /* @__PURE__ */ new Map();
let At = null, It = 0, cn = null;
function fr() {
  const r = It > 0;
  vt.forEach((e) => {
    try {
      e(r);
    } catch {
    }
  });
}
function Es() {
  if (cn) return cn;
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
    const n = At;
    At = null, !(!n || !t.length) && await zr(t, n.callId, n.target, n.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(r);
  } catch {
  }
  return cn = r, r;
}
function Rs(r, e, t) {
  if (!r) {
    $("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  At = { callId: r, target: e, key: t };
  const n = Es();
  if (n && typeof n.click == "function")
    try {
      n.click();
      return;
    } catch {
    }
  n || (At = null);
}
async function zr(r, e, t, n) {
  It += 1, fr();
  const o = [], s = [];
  try {
    for (const c of r) {
      if (c.size && c.size > dr) {
        s.push(`${c.name}: 文件过大（上限 ${Math.round(dr / 1024 / 1024)} MB）`);
        continue;
      }
      const a = await _s(c);
      a.ok ? o.push(a.att) : s.push(a.error);
    }
  } finally {
    It -= 1, fr();
  }
  const i = wt.get(e);
  if (o.length || s.length) {
    const c = t === "final" ? "final" : "q";
    if (!e) {
      $(
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
    else o.length && Ts(e, o, c, n);
  }
}
function Ts(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const o = localStorage.getItem(qt + r), s = o ? JSON.parse(o) : [], i = (Array.isArray(s) ? s : []).concat(
        e.map((c) => ({ att: c, target: t, key: n }))
      );
      localStorage.setItem(qt + r, JSON.stringify(i));
    } catch {
    }
}
function qs(r) {
  if (!r) return [];
  try {
    const e = localStorage.getItem(qt + r);
    if (!e) return [];
    localStorage.removeItem(qt + r);
    const t = JSON.parse(e);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}
function As(r) {
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
function Is(r) {
  return !r && r !== 0 ? "" : r < 1024 ? r + " B" : r < 1024 * 1024 ? (r / 1024).toFixed(1) + " KB" : (r / 1024 / 1024).toFixed(1) + " MB";
}
async function un(r, e) {
  const t = e || ee(r), n = Ke(r), o = n && n.request_id ? n.request_id : "";
  if (o)
    try {
      const s = await fetch(N("/question-modal/skip"), {
        method: "POST",
        headers: L(),
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
        { method: "POST", headers: L() }
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
async function hr(r) {
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
async function $s() {
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
    return s && vn(s.session_id, s.agent_id), s && s.found ? s : null;
  } catch {
    return null;
  }
}
const zt = "qm:v1:reqid:", zs = 3e4, Cs = 45e3;
function X(r) {
  if (r)
    try {
      localStorage.removeItem(zt + r);
    } catch {
    }
}
function Os() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(zt) === 0 && r.push(s);
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
function Ps(r, e, t, n) {
  if (!(!r || !e))
    try {
      localStorage.setItem(zt + r, JSON.stringify({
        request_id: e,
        session_id: t || "",
        agent_id: n || "",
        tool_call_id: r,
        ts: Date.now()
      })), Os();
    } catch {
    }
}
function Ke(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(zt + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || !t.request_id || t.tool_call_id !== r ? (X(r), null) : t;
  } catch {
    return null;
  }
}
const _n = "qm:v1:state:";
function Ge(r) {
  if (!r) return null;
  try {
    const e = localStorage.getItem(_n + r);
    if (!e) return null;
    const t = JSON.parse(e);
    return !t || typeof t != "object" ? null : t;
  } catch {
    return null;
  }
}
function Oe(r, e) {
  if (r)
    try {
      const n = { ...Ge(r) || {}, ...e, ts: Date.now() };
      localStorage.setItem(_n + r, JSON.stringify(n)), Bs();
    } catch {
    }
}
function Bs() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(_n) === 0 && r.push(s);
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
async function Ns(r) {
  try {
    const e = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(r),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const t = await e.json();
    return t && vn(t.session_id, t.agent_id), t && t.found ? { kind: "found", data: t } : t && t.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Ls(r, e, t, n) {
  const o = ["【用户提交的问卷答案】"], s = new Set(fe(r, e));
  return r.forEach((i, c) => {
    if (!s.has(c)) return;
    const a = e[`q${c}`];
    if (!a) return;
    let g = a.value;
    if (Array.isArray(g))
      g = g.filter((m) => m !== Se).map((m) => {
        const b = (i.options || []).find((R) => J(R) === String(m));
        return b ? re(b) : m;
      }).join("、");
    else {
      const m = (i.options || []).find((b) => J(b) === String(g));
      m && (g = re(m)), String(a.value) === Se && (g = "");
    }
    const h = D(i) === "single" ? "单选" : D(i) === "multi" ? "多选" : "问答", y = !!String(g || "").trim() || !!String(a.other || "").trim() || !!(a.attachments && a.attachments.length), f = a.skipped ? "（用户跳过本题）" : y ? g : "（未作答）";
    let x = `- q${c} [${h}] ${f}`;
    a.other && !a.skipped && (x += `（其他：${a.other}）`), a.attachments && a.attachments.length && (x += `（附件：${a.attachments.map((m) => m.file_name).join("、")}）`), o.push(x);
  }), t && o.push(`- 其他意见：${t}`), n && n.length && o.push(`- 其他意见附件：${n.map((i) => i.file_name).join("、")}`), o.join(`
`);
}
function St(r) {
  return r.map((e, t) => {
    const n = D(e) === "single" ? "单选" : D(e) === "multi" ? "多选" : "问答", o = (e.options || []).map(re).join("、");
    return `${t + 1}. [${n}] ${e.title}${o ? "（" + o + "）" : ""}`;
  }).join(`
`);
}
function pn(r) {
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
    t.map((h, y) => e.createElement(
      "span",
      { key: "att" + y, style: a },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: h.file_name
      }, h.file_name + (h.size ? "（" + Is(h.size) + "）" : "")),
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
function js(r) {
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
  } = r, y = Be().Popover, f = [];
  t.forEach((w) => {
    [...w.models || [], ...w.extra_models || []].forEach((E) => {
      f.push({
        providerId: w.id,
        providerName: w.name || w.id,
        modelId: E.id,
        modelName: E.name || E.id,
        free: !!E.is_free
      });
    });
  });
  const x = f.find((w) => `${w.providerId}:${w.modelId}` === n), m = x ? x.modelName : n || "选择模型", b = x ? x.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", R = {
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
  }, j = f.filter((w) => w.free).length, Q = f.length - j, S = [];
  t.forEach((w) => {
    const E = [...w.models || [], ...w.extra_models || []].map((O) => ({
      providerId: w.id,
      providerName: w.name || w.id,
      modelId: O.id,
      modelName: O.name || O.id,
      free: !!O.is_free
    })).filter((O) => a === "free" ? O.free : !O.free);
    E.length && S.push({ id: w.id, name: w.name || w.id, models: E });
  });
  const I = (w, E) => e.createElement("button", {
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
      background: a === w ? "var(--app-bg-container, #fff)" : "transparent",
      color: a === w ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: a === w ? 600 : 400,
      boxShadow: a === w ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => g(w)
  }, E), _ = e.createElement(
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
      I("free", "免费 🟢 " + j)
    ),
    S.length ? e.createElement("div", null, S.map((w, E) => (
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
        w.models.map((O) => {
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
    content: _,
    trigger: "click",
    open: i,
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
        const w = f.find((E) => `${E.providerId}:${E.modelId}` !== n);
        w && o(`${w.providerId}:${w.modelId}`);
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
function Ms(r) {
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
function Ds(r) {
  const { R: e, templates: t, value: n, open: o, onOpenChange: s, disabled: i, onSelect: c, onManage: a } = r, h = Be().Popover, y = (t || []).find((R) => R.id === n), f = y ? y.name : "默认模板", x = {
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
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, f),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return h ? e.createElement(h, {
    content: m,
    trigger: "click",
    open: o,
    onOpenChange: s,
    placement: "bottomLeft"
  }, b) : b;
}
function Ws(r) {
  const { R: e, open: t, templates: n, value: o, edit: s, onEditChange: i, onClose: c, onSelect: a, onSave: g, onDelete: h } = r;
  if (!t) return null;
  const y = Be(), { Input: f, Modal: x } = y, m = {
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
  }, R = !!s, j = (S, I, _, w) => f && f.TextArea ? e.createElement(f.TextArea, {
    value: S,
    rows: _,
    placeholder: w,
    onChange: (E) => I(E && E.target ? E.target.value : "")
  }) : e.createElement("textarea", {
    value: S,
    rows: _,
    placeholder: w,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (E) => I(E && E.target ? E.target.value : ""),
    onChange: (E) => I(E && E.target ? E.target.value : "")
  }), Q = e.createElement(
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
      j(s.name || "", (S) => i({ ...s, name: S }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      j(s.system || "", (S) => i({ ...s, system: S }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      j(s.user || "", (S) => i({ ...s, user: S }), 6, "用户提示词模板"),
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
            onClick: () => h(S.id)
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
function Fs(r) {
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
    disabled: h,
    children: y,
    open: f,
    onOpenChange: x
  } = r, b = Be().Popover, R = e.createElement("button", {
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
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      x(!f);
    }
  }, t ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      R,
      n && f ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((n.per_question || []).map((I) => I.reasoning).join(`

`))) : null
    );
  const j = !!(n && (n.per_question || []).length), Q = (I, _, w) => e.createElement("button", {
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
              (g || i)();
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
          dangerouslySetInnerHTML: { __html: hs(I.reasoning || "") }
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
    open: f,
    onOpenChange: x,
    placement: "bottomRight"
  }, R);
}
function Hs(r) {
  const e = Pe().React, t = Be(), { Input: n, Button: o } = t, s = n.TextArea, i = r.data || {}, c = ys(i), a = xs(i), g = ks(i), h = ws(g), y = h ? "" : g, f = c.questions || [], x = c.title || "问卷", m = Ge(a), [b, R] = e.useState(
    () => !!(m && m.answered) || !!y || h
  ), [j, Q] = e.useState(""), [S, I] = e.useState(() => {
    const l = Ke(a);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [_, w] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [E, O] = e.useState(() => {
    const l = {};
    f.forEach((d, p) => {
      l[`q${p}`] = { type: D(d), value: D(d) === "multi" ? [] : "", other: "" };
    });
    const u = m && m.answers;
    return u && typeof u == "object" && Object.keys(u).forEach((d) => {
      l[d] && (l[d] = { ...l[d], ...u[d] });
    }), l;
  }), [ae, Cr] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [P, le] = e.useState(!1), [ce, Ct] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [Ne, Ot] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [he, nt] = e.useState(
    () => !!(m && m.skippedAll) || /跳过了本次问卷/.test(y || "")
  ), [Le, En] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [rt, Rn] = e.useState(
    () => !!(m && m.expanded)
  ), [Tn, ot] = e.useState(!1), st = e.useRef(0), [je, Or] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [me, Me] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [oe, qn] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Us, Pt] = e.useState(() => Date.now()), Bt = 180, Pr = 20, De = cr(), Br = m && (m.mode === "ai" || m.mode === "recommend" || m.mode === "manual") ? m.mode : De.mode, [G, An] = e.useState(Br), [Nt, Lt] = e.useState(De.modelId), [it, In] = e.useState(De.withContext), [at, $n] = e.useState(De.parallel), [Nr, Lr] = e.useState([]), [zn, jt] = e.useState(!1), [ue, Te] = e.useState(null), [jr, ge] = e.useState(""), [Mr, Dr] = e.useState(!1), [Wr, Fr] = e.useState(!1), [Hr, Zr] = e.useState("paid"), be = e.useRef({}), se = e.useRef({}), qe = e.useRef(0), We = e.useRef(null), [Ur, Fe] = e.useState(0), [Cn, Mt] = e.useState([]), [ye, Dt] = e.useState(
    () => m && typeof m.templateId == "string" && m.templateId ? m.templateId : ""
  ), pe = e.useRef(ye);
  pe.current = ye;
  const [Jr, Qr] = e.useState(!1), [Xr, On] = e.useState(!1), [Gr, Wt] = e.useState(null), [V, Pn] = e.useState(
    () => !!(m && m.autoPaused)
  ), Vr = e.useRef(V);
  Vr.current = V;
  const lt = e.useRef(!1), ct = e.useRef(/* @__PURE__ */ new Set()), He = (l) => {
    l && ct.current.add(l);
  }, ut = e.useRef({}), [Yr, Bn] = e.useState(0), Ae = e.useRef({}), Ft = e.useRef(!1), Nn = e.useRef(!1), pt = (l) => {
    if (l.mode !== void 0 && (An(l.mode), Oe(a, { mode: l.mode })), !(l.modelId !== void 0 || l.withContext !== void 0 || l.parallel !== void 0)) return;
    Ft.current = !0;
    const d = {
      // Keep the GLOBAL default mode untouched — this card's mode is separate.
      // Reading the current global mirror so a model/ctx change here does not
      // stamp this card's (card-scoped) mode back onto the seed.
      mode: cr().mode,
      modelId: l.modelId !== void 0 ? l.modelId : Nt,
      withContext: l.withContext !== void 0 ? l.withContext : it,
      parallel: l.parallel !== void 0 ? l.parallel : at
    };
    Lt(d.modelId), In(d.withContext), $n(d.parallel), ur(d), ls(d);
  }, Ln = (l) => {
    !l || l === ye || (Dt(l), pe.current = l, Oe(a, { templateId: l }), Te(null), be.current = {}, se.current = {}, Fe((u) => u + 1));
  }, Kr = async (l) => {
    const u = await us({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!u.ok) {
      $("error", u.error || "保存失败");
      return;
    }
    Mt(u.items || []), Wt(null), $("success", "模板已保存");
  }, eo = async (l) => {
    const u = await ps(l);
    if (!u.ok) {
      $("warning", u.error || "删除失败");
      return;
    }
    Mt(u.items || []);
    const d = (u.items || []).map((p) => p.id);
    if (d.indexOf(pe.current) === -1) {
      const p = d[0] || "";
      Dt(p), pe.current = p, Oe(a, { templateId: p });
    }
    $("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    let l = !0;
    return is(), (async () => {
      const [u, d, p] = await Promise.all([
        ds(),
        as(),
        cs()
      ]);
      if (!l) return;
      Lr(u), Mt(p.items);
      const k = p.items.map((T) => T.id);
      if (!pe.current || k.indexOf(pe.current) === -1) {
        const T = p.defaultId || k[0] || "";
        T && (Dt(T), pe.current = T);
      }
      let v = De;
      if (d && !Ft.current && (v = d, m && (m.mode === "ai" || m.mode === "recommend" || m.mode === "manual") || An(d.mode), Lt(d.modelId), In(d.withContext), $n(d.parallel), ur(d)), !Ft.current && !v.modelId) {
        const T = await fs();
        if (!l) return;
        T && T.provider_id && T.model && Lt(`${T.provider_id}:${T.model}`);
      }
      Nn.current = !0, Fe((T) => T + 1);
    })(), () => {
      l = !1;
    };
  }, [a]), e.useEffect(() => {
    qe.current = _;
  }, [_]);
  const Ht = async (l) => {
    if (zn) return;
    const u = _;
    jt(!0), ge("");
    const d = typeof AbortController < "u" ? new AbortController() : null;
    We.current = d;
    try {
      const p = await fetch(N("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: S,
          tool_call_id: a,
          session_id: ee(a),
          title: x,
          questions: f,
          model_id: Nt,
          mode: l,
          with_context: it,
          parallel: at,
          question_index: u,
          answers: E,
          template_id: pe.current
        }),
        signal: d ? d.signal : void 0
      }), k = await p.json().catch(() => ({})), v = k && k.analysis || null, T = v && v.error || k && k.error || "";
      k && k.cancelled || v && v.cancelled ? ge("已终止分析。") : !p.ok || !k || k.ok === !1 || v && v.ok === !1 ? ge(T || "分析失败（服务返回 " + p.status + "）") : v && (be.current[u] = v, se.current[u] = !0, qe.current === u && Te(v), $("success", "第 " + (u + 1) + " 题 AI 分析完成"));
    } catch (p) {
      We.current === d && d && d.signal.aborted || p && p.name === "AbortError" ? ge("已终止分析。") : ge("分析请求失败：" + (p && p.message ? p.message : p));
    } finally {
      We.current === d && (We.current = null), jt(!1), Ae.current[u] = !0, Bn((p) => p + 1);
    }
  }, to = () => {
    const l = _;
    delete be.current[l], Te(null), ge(""), Ht("manual");
  }, Ie = (l) => {
    var d;
    const u = l !== void 0 ? l : qe.current;
    try {
      fetch(N("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
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
      (d = We.current) == null || d.abort();
    } catch {
    }
    jt(!1);
  }, no = () => {
    Ie(), ge("已终止分析。");
  }, ro = () => {
    V ? (ut.current = {}, Ae.current = {}, se.current = {}, lt.current = !1, Pn(!1), Fe((l) => l + 1), $("info", "已恢复自动答题")) : (Ie(), Pn(!0), $("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = be.current[_];
    Te(l || null);
    const u = "?tool_call_id=" + encodeURIComponent(a) + "&question_index=" + _;
    let d = !0;
    return fetch(N("/question-modal/analysis") + u, { headers: L() }).then((p) => p.ok ? p.json() : null).then((p) => {
      !d || !p || !p.found || !p.analysis || (be.current[_] = p.analysis, qe.current === _ && Te(p.analysis));
    }).catch(() => {
    }), () => {
      d = !1;
    };
  }, [a, _]), e.useEffect(() => {
    b || Nn.current && G === "ai" && (!an(c) || !f.length || se.current[_] || P || (se.current[_] = !0, Ht("auto")));
  }, [b, G, a, Ur, it, at, f, _]);
  const oo = () => {
    const l = ue && ue.per_question || [];
    if (!l.length) return;
    if (!l.some((d) => d.type === "multi" ? String(d.choice || "").split(/[、,，]/).map((p) => p.trim()).filter(Boolean).length > 0 : String(d.choice || "").trim().length > 0)) {
      $("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    O((d) => {
      const p = { ...d };
      return l.forEach((k) => {
        const v = `q${k.index}`;
        He(v);
        const T = p[v] || { type: k.type, value: "", other: "" };
        if (k.type === "multi") {
          const ke = String(k.choice || "").split(/[、,，]/).map((Z) => Z.trim()).filter(Boolean);
          p[v] = { ...T, value: ke };
        } else
          p[v] = { ...T, value: k.choice || T.value };
      }), p;
    }), $("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, xe = (l, u, d = !1) => {
    Ie(), Or(l), nt(!0), Ot(u), ot(!1), R(!0), X(a), d && Oe(a, { backendReleased: !0 });
  }, so = async (l, u) => {
    const d = await un(a, ee(a));
    return d.ok ? (xe(l, u, d.released), !0) : (ot(!0), Ut(!1), !1);
  };
  e.useEffect(() => {
    var u;
    const l = (u = Ge(a)) == null ? void 0 : u.answers;
    Oe(a, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: S,
      visStep: _,
      answers: sn(E, l, ct.current),
      finalOther: ae,
      finalOtherAtt: Le,
      answered: b,
      skippedAll: he,
      expanded: rt,
      localResult: Ne,
      submittedAt: oe,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: je,
      gateBlocked: me,
      releasedNote: ce,
      autoPaused: V,
      templateId: ye
    });
  }, [
    a,
    S,
    _,
    E,
    ae,
    Le,
    b,
    he,
    rt,
    Ne,
    oe,
    V,
    ye,
    me,
    ce
  ]), e.useEffect(() => {
    if (!b || !oe || Date.now() - oe > Bt * 1e3) return;
    let l = 0;
    const u = () => {
      Date.now() - oe > Bt * 1e3 || (Pt(Date.now()), l = setTimeout(u, 1e3));
    };
    return l = setTimeout(u, 1e3), () => {
      l && clearTimeout(l);
    };
  }, [b, oe]);
  const [Zt, Ut] = e.useState(!1), [Jt, jn] = e.useState(""), Mn = (l, u, d) => {
    l.length && (u === "final" ? En((p) => p.concat(l)) : O((p) => {
      const k = d || `q${_}`;
      He(k);
      const v = p[k] || { type: "text", value: "", other: "" };
      return { ...p, [k]: { ...v, attachments: (v.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!a) return;
    const l = (p, k, v, T) => {
      Mn(p, k, v), T && T.length ? jn(T.join("；")) : jn("");
    }, u = (p) => Ut(p);
    wt.set(a, l), vt.set(a, u);
    const d = qs(a);
    return d.length && d.forEach((p) => Mn([p.att], p.target, p.key)), Ut(It > 0), () => {
      wt.get(a) === l && wt.delete(a), vt.get(a) === u && vt.delete(a);
    };
  }, [a, _]);
  const Qt = (l, u) => Rs(a, l, u), Xt = (l, u, d) => {
    const p = As(l);
    if (p.length) {
      try {
        l.preventDefault();
      } catch {
      }
      zr(p, a, u, d);
    }
  };
  e.useEffect(() => {
    if (!h || j) return;
    let l = !0;
    return ln(a).then((u) => {
      !l || !u || (u.kind === "skipped" && !u.answers && nt(!0), Q(vs(f, u)));
    }), () => {
      l = !1;
    };
  }, [h, a, j]), e.useEffect(() => {
    if (b) return;
    let l = !0, u = 0, d = 0, p = 0;
    st.current || (st.current = Date.now());
    let k = !!Ke(a);
    const v = (q) => {
      !l || !q || !q.request_id || (k = !0, I(q.request_id), ot(!1), d && (clearTimeout(d), d = 0), Ps(
        a,
        q.request_id,
        q.session_id || qr(),
        q.agent_id
      ));
    }, T = (q) => {
      l && (d && (clearTimeout(d), d = 0), p && (clearTimeout(p), p = 0), so(
        q,
        q === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, ke = Ke(a), Z = async () => {
      if (!ke) return !1;
      const q = await Ns(ke.request_id);
      if (!l) return !0;
      if (q.kind === "found") {
        const M = q.data;
        return M.tool_call_id && a && M.tool_call_id !== a ? (X(a), !1) : (v(M), !0);
      }
      return q.kind === "orphan" ? (T("orphan"), !0) : (q.kind === "absent" && X(a), !1);
    }, Je = (q = !1) => {
      if (l) {
        if (u += 1, q) {
          if (k) {
            T("gone");
            return;
          }
          const M = Date.now() - (st.current || Date.now());
          if (u >= 12 && M >= Cs) {
            T("gone");
            return;
          }
        }
        d = setTimeout(U, u < 8 ? 700 : 5e3);
      }
    }, ie = () => {
      Ss(a, ee(a)).then((q) => {
        if (l) {
          if (q.kind === "found") {
            v(q.data);
            return;
          }
          if (q.kind === "orphan") {
            T("orphan");
            return;
          }
          if (q.kind === "error") {
            Je(!1);
            return;
          }
          $s().then((M) => {
            if (l) {
              if (M) {
                if (M.tool_call_id && a && M.tool_call_id !== a) {
                  ln(a).then((we) => {
                    if (l) {
                      if (we) {
                        R(!0), X(a);
                        return;
                      }
                      Je(!0);
                    }
                  });
                  return;
                }
                v(M);
                return;
              }
              ln(a).then((we) => {
                if (l) {
                  if (we) {
                    we.kind === "skipped" && !we.answers && nt(!0), R(!0), X(a);
                    return;
                  }
                  Je(!0);
                }
              });
            }
          });
        }
      });
    }, U = () => {
      if (l) {
        if (!ke) {
          ie();
          return;
        }
        Z().then((q) => {
          !l || q || ie();
        });
      }
    };
    return p = setTimeout(() => {
      l && ot(!0);
    }, zs), U(), () => {
      l = !1, d && clearTimeout(d), p && clearTimeout(p);
    };
  }, [b, a]);
  const Dn = async () => {
    le(!0);
    try {
      const l = ee(a);
      let u = await un(a, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await hr(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok)
        throw new Error(
          u.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + u.reason + "）"
        );
      if (u.released) {
        const p = u.reason === "host-stop";
        xe(
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
        xe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      le(!1);
    }
  }, Wn = async () => {
    le(!0);
    try {
      const l = ee(a);
      let u = await un(a, l);
      if ((!u.released || u.reason === "orphan") && u.reason !== "network" && l) {
        const p = await hr(l);
        p.ok && p.released ? u = p : p.ok && !u.ok && (u = { ok: !0, released: !1, reason: "gone" });
      }
      if (!u.ok) {
        Ct(u.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + u.reason + "）。"), $("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (u.released) {
        const p = u.reason === "host-stop";
        Ct(p ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), $("info", p ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        Ct("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), $("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      le(!1);
    }
  }, dt = fe(f, E), $e = dt.length, de = _ >= $e, F = de ? -1 : dt[_], H = F >= 0 ? f[F] : null, ze = `q${F}`, B = F >= 0 && E[ze] || { type: D(H), value: D(H) === "multi" ? [] : "", other: "" }, Ce = (l) => {
    var p;
    me && Me(""), F >= 0 && He(`q${F}`);
    const u = { ...E, [ze]: { ...l, skipped: !1 } }, d = fe(f, u);
    f.forEach((k, v) => {
      d.indexOf(v) === -1 && delete u[`q${v}`];
    }), Oe(a, {
      answers: sn(u, (p = Ge(a)) == null ? void 0 : p.answers, ct.current)
    }), O(u);
  };
  e.useEffect(() => {
    _ > $e && w($e);
  }, [$e, _]);
  const Gt = async (l, u) => {
    const d = await fetch(N(l), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(u)
    }), p = await d.json().catch(() => ({}));
    if (!d.ok) {
      const k = new Error(p && p.detail || "HTTP " + d.status);
      throw k.status = d.status, k;
    }
    return p;
  }, Fn = () => {
    var l;
    return sn(E, (l = Ge(a)) == null ? void 0 : l.answers, ct.current);
  }, Hn = (l, u) => {
    const d = [];
    if (typeof u == "number")
      return fe(f, l).indexOf(u) !== -1 && !Tt(l[`q${u}`]) && d.push(u + 1), d;
    const p = new Set(fe(f, l));
    return f.forEach((k, v) => {
      p.has(v) && !Tt(l[`q${v}`]) && d.push(v + 1);
    }), d;
  }, Zn = (l, u, d) => {
    const p = "第 " + l.join("、") + " 题", k = d === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    Me("⛔ " + p + "尚未选择。" + k);
    const v = fe(f, u).length;
    Gt("/question-modal/gate-block", {
      request_id: S,
      tool_call_id: a,
      session_id: ee(a),
      missing: l,
      answered: v - l.length,
      total: v,
      bundle: lr
    }).catch(() => {
    });
  }, Vt = async (l, u = !1) => {
    if (!S) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    const d = Fn();
    if (!u) {
      const p = Hn(d);
      if (p.length) {
        Zn(p, d, "提交");
        return;
      }
      Me("");
    }
    le(!0);
    try {
      const p = await Gt("/question-modal/answer", {
        request_id: S,
        session_id: ee(a),
        answers: d,
        other: ae,
        attachments: Le
      });
      if (p && p.orphan) {
        fetch(
          N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ee(a)),
          { method: "POST", headers: L() }
        ).catch(() => {
        }), xe(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("success", "✓ 已提交答案"), X(a), Ot(Ls(f, d, ae, Le)), qn(Date.now()), Pt(Date.now()), R(!0);
    } catch (p) {
      if (p && p.status === 404) {
        xe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("error", "提交失败: " + p.message);
    } finally {
      le(!1);
    }
  }, io = () => {
    F < 0 || (me && Me(""), Ie(qe.current), se.current[qe.current] = !0, He(`q${F}`), O((l) => {
      const u = { ...l };
      u[`q${F}`] = {
        type: (l[`q${F}`] || {}).type || D(H),
        value: ((l[`q${F}`] || {}).type || D(H)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const d = fe(f, u);
      return f.forEach((p, k) => {
        d.indexOf(k) === -1 && delete u[`q${k}`];
      }), u;
    }), w((l) => l + 1));
  }, ao = () => {
    if (de) {
      Vt();
      return;
    }
    const l = Fn(), u = Hn(l, F);
    if (u.length) {
      Zn(u, l, "下一步");
      return;
    }
    me && Me(""), w((d) => d + 1);
  }, lo = async () => {
    if (!S) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    Ie(), le(!0);
    try {
      const l = await Gt("/question-modal/skip", {
        request_id: S,
        session_id: ee(a)
      });
      if (l && l.orphan) {
        xe(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("info", "已跳过问卷"), X(a), nt(!0), Ot("用户跳过了本次问卷。"), qn(Date.now()), Pt(Date.now()), R(!0);
    } catch (l) {
      if (l && l.status === 404) {
        xe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), $("info", "本次问卷已失效，已关闭");
        return;
      }
      $("error", "跳过失败: " + l.message);
    } finally {
      le(!1);
    }
  };
  e.useEffect(() => {
    if (b || G !== "ai" && G !== "recommend" || V || !an(c) || !f.length || P) return;
    if (de) {
      if (lt.current || !dt.every(
        (U, q) => !!Ae.current[q]
      )) return;
      lt.current = !0, Vt(void 0, !0);
      return;
    }
    const l = _;
    if (ut.current[l] || G === "ai" && !Ae.current[l]) return;
    ut.current[l] = !0;
    const u = dt[l], d = f[u], p = D(d), k = pr(d), v = be.current[l], T = v && v.per_question && v.per_question[0], ke = T ? String(T.choice || "").trim() : "", Z = k.length ? k.join("、") : ke, Je = !!Z;
    He(`q${u}`), O((ie) => {
      const U = { ...ie }, q = `q${u}`, M = U[q] || { type: p, value: p === "multi" ? [] : "", other: "" };
      if (!Je)
        U[q] = { ...M, type: p, value: p === "multi" ? [] : "", other: "", skipped: !0 };
      else if (p === "multi") {
        const Qe = d.options || [], ve = (Y) => String(Y).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim();
        U[q] = { ...M, type: p, value: Z.split(/[、,，]/).map((Y) => ve(Y)).filter(Boolean).map((Y) => {
          const K = Qe.find((Kn) => J(Kn) === Y || re(Kn) === Y);
          return K ? J(K) : Y;
        }) };
      } else if (p === "single") {
        const Qe = d.options || [], ve = (K) => String(K).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Y = Qe.find((K) => J(K) === Z || re(K) === Z) || Qe.find((K) => J(K) === ve(Z) || re(K) === ve(Z));
        U[q] = { ...M, type: p, value: Y ? J(Y) : Z };
      } else
        U[q] = { ...M, type: p, value: Z };
      const we = fe(f, U);
      return f.forEach((Qe, ve) => {
        we.indexOf(ve) === -1 && delete U[`q${ve}`];
      }), U;
    }), se.current[l] = !0, Ae.current[l] = !0, w((ie) => ie + 1), Bn((ie) => ie + 1);
  }, [b, G, V, P, a, _, Yr, $e, c]);
  const ft = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Yt = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Kt = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, ht = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, en = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Un = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, tn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, co = { display: "flex", flexDirection: "column", gap: 8 }, mt = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, gt = {
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
  }, Ze = {
    ...gt,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, uo = {
    ...gt,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, nn = {
    ...gt,
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
  }, Jn = {
    // Restored to the original look (user asked for options to stay as-is).
    ...nn,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, po = {}, fo = {
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
  }, ho = { height: 32, fontSize: 13, borderRadius: 8 }, Qn = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Xn = (l) => {
    const u = J(l);
    return B.type === "multi" ? Array.isArray(B.value) && B.value.indexOf(u) !== -1 : B.value === u;
  }, Gn = Xn(Se), Vn = (l) => {
    if (b || P) return;
    const u = J(l);
    if (B.type === "multi") {
      const d = Array.isArray(B.value) ? B.value.slice() : [], p = d.indexOf(u);
      p === -1 ? d.push(u) : d.splice(p, 1), Ce({ ...B, value: d, other: d.indexOf(Se) !== -1 ? B.other : "" });
    } else
      Ce({ ...B, value: u });
  }, Yn = (l, u, d, p, k) => e.createElement(
    "button",
    {
      key: p,
      type: "button",
      disabled: b || P,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      style: k ? { ...u ? Jn : nn, ...po } : u ? Jn : nn,
      onClick: d
    },
    // #2: badge goes on the LEFT of the option text.
    k ? e.createElement("span", {
      key: "rec",
      className: "qm-rec-badge",
      "data-qm-rec": "true",
      style: fo
    }, "AI 推荐") : null,
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (u ? "✓ " : "") + l)
  );
  if (!b && !an(c))
    return e.createElement(
      "div",
      { style: ft, className: "qm-card", "data-qm-card": "true" },
      e.createElement(
        "div",
        { style: Yt, className: "qm-header" },
        e.createElement(
          "div",
          { style: Kt },
          on(e),
          e.createElement("span", { style: ht, className: "qm-title" }, x)
        ),
        e.createElement("span", { style: en }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Un, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Tn ? e.createElement(
        "div",
        { style: mt },
        e.createElement("button", {
          type: "button",
          disabled: P,
          style: { ...Ze, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Dn
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = oe ? Math.floor((Date.now() - oe) / 1e3) : -1, u = !!oe && !je && !ce && !he && l >= 0 && l < Bt, d = l < Pr ? "⏳ 已提交，模型思考中… " + l + "s" : "⏳ 已提交，模型思考中… " + l + "s（等待偏久，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」）", p = u ? e.createElement("span", {
      style: {
        fontSize: 12,
        lineHeight: 1.5,
        color: "var(--app-text-secondary, inherit)"
      },
      title: "问卷已提交并放行，agent 正在生成回复"
    }, d) : null;
    return he && !rt ? e.createElement(
      "div",
      {
        style: {
          ...ft,
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
        je ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      e.createElement("span", {
        style: { ...ht, flex: ce ? 0 : 1, opacity: 0.75 }
      }, x),
      ce ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, ce) : p,
      e.createElement("button", {
        type: "button",
        style: {
          ...Ze,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Rn(!0)
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
          ...Ze,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Wn
      }, "释放阻塞")
    ) : e.createElement(
      "div",
      { style: ft, className: "qm-card", "data-qm-card": "true" },
      e.createElement(
        "div",
        { style: { ...Yt, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Kt },
          on(e),
          e.createElement("span", { style: ht }, x)
        ),
        e.createElement(
          "span",
          { style: { ...en, color: je ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          je ? "已失效" : he ? "已跳过" : "已完成"
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
      }, he ? Ne ? Ne + `

` + St(f) : `已跳过本次问卷。

` + St(f) : Ne || j || y || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + St(f)),
      he && rt ? e.createElement(
        "div",
        { style: mt },
        e.createElement("button", {
          type: "button",
          style: Ze,
          onClick: () => Rn(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...mt, marginTop: 8, gap: 10 } },
        ce ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, ce) : p,
        e.createElement("button", {
          type: "button",
          disabled: P,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...Ze, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Wn
        }, "释放阻塞")
      )
    );
  }
  let bt = null;
  if (de)
    bt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: tn }, "其他意见（可选）"),
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: ae,
        style: Qn,
        onChange: (l) => Cr(l.target.value),
        onPaste: (l) => Xt(l, "final", "final")
      }),
      pn({
        R: e,
        files: Le,
        disabled: b || P,
        uploading: Zt,
        error: Jt,
        onPick: () => Qt("final", "final"),
        onRemove: (l) => En((u) => u.filter((d, p) => p !== l))
      })
    );
  else if (H && D(H) === "text")
    bt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...tn, fontSize: 13, color: "var(--app-text, inherit)" } }, H.title),
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof B.value == "string" ? B.value : "",
        style: Qn,
        onChange: (l) => Ce({ ...B, value: l.target.value, other: "" }),
        onPaste: (l) => Xt(l, "q", ze)
      }),
      pn({
        R: e,
        files: B.attachments || [],
        disabled: b || P,
        uploading: Zt,
        error: Jt,
        onPick: () => Qt("q", ze),
        onRemove: (l) => Ce({
          ...B,
          attachments: (B.attachments || []).filter((u, d) => d !== l)
        })
      })
    );
  else if (H) {
    const l = pr(H), u = l.length ? l : ue && ue.per_question && ue.per_question[0] && String(ue.per_question[0].choice || "").trim() ? [String(ue.per_question[0].choice).trim()] : l, d = (H.options || []).map((p, k) => Yn(
      re(p),
      Xn(p),
      () => Vn(p),
      "o" + k,
      ms(H, p, u)
    ));
    d.push(Yn("其他", Gn, () => Vn(Se), "other")), Gn && (d.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: B.other,
      style: { ...ho, marginTop: 2 },
      onChange: (p) => Ce({ ...B, other: p.target.value }),
      onPaste: (p) => Xt(p, "q", ze)
    })), d.push(pn({
      R: e,
      files: B.attachments || [],
      disabled: b || P,
      uploading: Zt,
      error: Jt,
      onPick: () => Qt("q", ze),
      onRemove: (p) => Ce({
        ...B,
        attachments: (B.attachments || []).filter((k, v) => v !== p)
      })
    }))), bt = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...tn, fontSize: 13, color: "var(--app-text, inherit)" } }, H.title),
      e.createElement("div", { style: { ...co, marginTop: 8 } }, d)
    );
  }
  const rn = $e + 1, mo = de ? rn + "/" + rn : _ + 1 + "/" + rn, Ue = {
    ...gt,
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
    { style: ft, className: "qm-card", "data-qm-card": "true" },
    e.createElement(
      "div",
      { style: Yt, className: "qm-header" },
      e.createElement(
        "div",
        { style: Kt },
        on(e),
        e.createElement("span", { style: ht, className: "qm-title" }, x)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        js({
          R: e,
          providers: Nr,
          modelId: Nt,
          disabled: b || P,
          open: Wr,
          onOpenChange: Fr,
          tab: Hr,
          onTabChange: Zr,
          onChange: (l) => {
            pt({ modelId: l }), Te(null), be.current = {}, se.current = {}, Fe((u) => u + 1);
          }
        }),
        Ds({
          R: e,
          templates: Cn,
          value: ye,
          open: Jr,
          onOpenChange: Qr,
          disabled: b || P,
          onSelect: Ln,
          onManage: () => On(!0)
        }),
        Ms({
          R: e,
          mode: G,
          disabled: b || P,
          onChange: (l) => {
            pt({ mode: l }), l === "ai" && (se.current = {}), l === "ai" || l === "recommend" ? (ut.current = {}, Ae.current = {}, lt.current = !1, Fe((u) => u + 1)) : Ie();
          }
        }),
        Fs({
          R: e,
          busy: zn,
          result: ue,
          error: jr,
          mode: G,
          disabled: b || P,
          open: Mr,
          onOpenChange: Dr,
          onRun: () => {
            Ht("manual");
          },
          onRerun: to,
          onApply: oo,
          onCancel: no,
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
                checked: it,
                onChange: (l) => pt({ withContext: !!l.target.checked })
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
                checked: at,
                onChange: (l) => pt({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (G === "ai" || G === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: P,
          onClick: ro,
          style: {
            ...Ue,
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
        e.createElement("span", { style: en, key: "qm-step" }, mo)
      )
    ),
    e.createElement("div", { style: Un }, bt),
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Ws({
      R: e,
      open: Xr,
      templates: Cn,
      value: ye,
      edit: Gr,
      onEditChange: Wt,
      onClose: () => {
        On(!1), Wt(null);
      },
      onSelect: (l) => Ln(l),
      onSave: Kr,
      onDelete: eo
    }),
    // ── escape hatch: a survey blocks the whole chat while it is open ──
    // Shown after STUCK_AFTER_MS regardless of whether the card is healthy:
    // as long as the agent is parked, every new message in this chat answers
    // 409, so the user must always have a way out.
    Tn && !b ? e.createElement(
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
        "⚠️ 本次问卷已阻塞会话 " + Math.max(1, Math.round((Date.now() - (st.current || Date.now())) / 1e3)) + " 秒。阻塞期间发新消息会报「A task is already running」；" + (S ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: {
          ...Ue,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Dn,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    me && !b ? e.createElement("div", {
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
      "data-qm-bundle": lr
    }, me) : null,
    e.createElement(
      "div",
      { style: mt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: _ === 0 || P,
        style: { ...Ue, marginRight: "auto", opacity: _ === 0 ? 0.5 : 1 },
        onClick: () => w((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: Ue,
        // 「跳过并提交」是明确的提交意图，不套空答卷闸门（allowEmpty=true）。
        onClick: de ? () => Vt(void 0, !0) : io
      }, de ? "跳过并提交" : "跳过本题"),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: Ue,
        onClick: lo
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: P,
        style: uo,
        onClick: ao
      }, de ? "提交" : "下一步")
    )
  );
}
function Zs() {
  const r = ts();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return os(), r.toolRender(es, ar, Hs), console.log("[question-modal] registered via chat.toolRender for", ar), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function r(e) {
  if (!Zs()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => r(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
