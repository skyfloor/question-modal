var oa = Object.defineProperty;
var ao = (r) => {
  throw TypeError(r);
};
var sa = (r, e, t) => e in r ? oa(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var F = (r, e, t) => sa(r, typeof e != "symbol" ? e + "" : e, t), aa = (r, e, t) => e.has(r) || ao("Cannot " + t);
var io = (r, e, t) => e.has(r) ? ao("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t);
var tn = (r, e, t) => (aa(r, e, "access private method"), t);
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
function zo(r) {
  Ze = r;
}
const Ro = /[&<>"']/, ia = new RegExp(Ro.source, "g"), No = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, la = new RegExp(No.source, "g"), ca = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, lo = (r) => ca[r];
function de(r, e) {
  if (e) {
    if (Ro.test(r))
      return r.replace(ia, lo);
  } else if (No.test(r))
    return r.replace(la, lo);
  return r;
}
const da = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function pa(r) {
  return r.replace(da, (e, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const ua = /(^|[^\[])\^/g;
function j(r, e) {
  let t = typeof r == "string" ? r : r.source;
  e = e || "";
  const n = {
    replace: (o, s) => {
      let a = typeof s == "string" ? s : s.source;
      return a = a.replace(ua, "$1"), t = t.replace(o, a), n;
    },
    getRegex: () => new RegExp(t, e)
  };
  return n;
}
function co(r) {
  try {
    r = encodeURI(r).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return r;
}
const zt = { exec: () => null };
function po(r, e) {
  const t = r.replace(/\|/g, (s, a, c) => {
    let i = !1, y = a;
    for (; --y >= 0 && c[y] === "\\"; )
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
function nn(r, e, t) {
  const n = r.length;
  if (n === 0)
    return "";
  let o = 0;
  for (; o < n && r.charAt(n - o - 1) === e; )
    o++;
  return r.slice(0, n - o);
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
function uo(r, e, t, n) {
  const o = e.href, s = e.title ? de(e.title) : null, a = r[1].replace(/\\([\[\]])/g, "$1");
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
    text: de(a)
  };
}
function ma(r, e) {
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
      const n = t[0], o = ma(n, t[3] || "");
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
        const o = nn(n, "#");
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
      n = nn(n.replace(/^ *>[ \t]?/gm, ""), `
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
      let c = "", i = "", y = !1;
      for (; e; ) {
        let f = !1;
        if (!(t = a.exec(e)) || this.rules.block.hr.test(e))
          break;
        c = t[0], e = e.substring(c.length);
        let x = t[2].split(`
`, 1)[0].replace(/^\t+/, (_) => " ".repeat(3 * _.length)), h = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = x.trimStart()) : (k = t[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = x.slice(k), k += t[1].length);
        let m = !1;
        if (!x && /^ *$/.test(h) && (c += h + `
`, e = e.substring(h.length + 1), f = !0), !f) {
          const _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), S = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), v = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), I = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const C = e.split(`
`, 1)[0];
            if (h = C, this.options.pedantic && (h = h.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), v.test(h) || I.test(h) || _.test(h) || S.test(e))
              break;
            if (h.search(/[^ ]/) >= k || !h.trim())
              i += `
` + h.slice(k);
            else {
              if (m || x.search(/[^ ]/) >= 4 || v.test(x) || I.test(x) || S.test(x))
                break;
              i += `
` + h;
            }
            !m && !h.trim() && (m = !0), c += C + `
`, e = e.substring(C.length + 1), x = h.slice(k);
          }
        }
        s.loose || (y ? s.loose = !0 : /\n *\n *$/.test(c) && (y = !0));
        let b = null, T;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (T = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: c,
          task: !!b,
          checked: T,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += c;
      }
      s.items[s.items.length - 1].raw = c.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let f = 0; f < s.items.length; f++)
        if (this.lexer.state.top = !1, s.items[f].tokens = this.lexer.blockTokens(s.items[f].text, []), !s.loose) {
          const x = s.items[f].tokens.filter((k) => k.type === "space"), h = x.length > 0 && x.some((k) => /\n.*\n/.test(k.raw));
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
    const n = po(t[1]), o = t[2].replace(/^\||\| *$/g, "").split("|"), s = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
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
        a.rows.push(po(c, a.header.length).map((i) => ({
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
        const a = fa(t[2], "()");
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
      return o = o.trim(), /^</.test(o) && (this.options.pedantic && !/>$/.test(n) ? o = o.slice(1) : o = o.slice(1, -1)), uo(t, {
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
      return uo(n, s, n[0], this.lexer);
    }
  }
  emStrong(e, t, n = "") {
    let o = this.rules.inline.emStrongLDelim.exec(e);
    if (!o || o[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(o[1] || o[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const a = [...o[0]].length - 1;
      let c, i, y = a, f = 0;
      const x = o[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (x.lastIndex = 0, t = t.slice(-1 * e.length + a); (o = x.exec(t)) != null; ) {
        if (c = o[1] || o[2] || o[3] || o[4] || o[5] || o[6], !c)
          continue;
        if (i = [...c].length, o[3] || o[4]) {
          y += i;
          continue;
        } else if ((o[5] || o[6]) && a % 3 && !((a + i) % 3)) {
          f += i;
          continue;
        }
        if (y -= i, y > 0)
          continue;
        i = Math.min(i, i + y + f);
        const h = [...o[0]][0].length, k = e.slice(0, a + o.index + h + i);
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
      const o = /[^ ]/.test(n), s = /^ /.test(n) && / $/.test(n);
      return o && s && (n = n.substring(1, n.length - 1)), n = de(n, !0), {
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
      return t[2] === "@" ? (n = de(t[1]), o = "mailto:" + n) : (n = de(t[1]), o = n), {
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
        o = de(t[0]), s = "mailto:" + o;
      else {
        let a;
        do
          a = t[0], t[0] = ((n = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : n[0]) ?? "";
        while (a !== t[0]);
        o = de(t[0]), t[1] === "www." ? s = "http://" + t[0] : s = t[0];
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
      return this.lexer.state.inRawBlock ? n = t[0] : n = de(t[0]), {
        type: "text",
        raw: t[0],
        text: n
      };
    }
  }
}
const ga = /^(?: *(?:\n|$))+/, ha = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, ba = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ot = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ya = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Oo = /(?:[*+-]|\d{1,9}[.)])/, $o = j(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Oo).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), br = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, xa = /^[^\n]+/, yr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, ka = j(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", yr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), wa = j(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Oo).getRegex(), vn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", xr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, va = j("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", xr).replace("tag", vn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Mo = j(br).replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), Sa = j(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Mo).getRegex(), kr = {
  blockquote: Sa,
  code: ha,
  def: ka,
  fences: ba,
  heading: ya,
  hr: Ot,
  html: va,
  lheading: $o,
  list: wa,
  newline: ga,
  paragraph: Mo,
  table: zt,
  text: xa
}, fo = j("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex(), _a = {
  ...kr,
  table: fo,
  paragraph: j(br).replace("hr", Ot).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", fo).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", vn).getRegex()
}, qa = {
  ...kr,
  html: j(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", xr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: zt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: j(br).replace("hr", Ot).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", $o).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Bo = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ea = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Lo = /^( {2,}|\\)\n(?!\s*$)/, Ta = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, $t = "\\p{P}\\p{S}", Aa = j(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, $t).getRegex(), Ca = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Ia = j(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, $t).getRegex(), za = j("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, $t).getRegex(), Ra = j("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, $t).getRegex(), Na = j(/\\([punct])/, "gu").replace(/punct/g, $t).getRegex(), Oa = j(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), $a = j(xr).replace("(?:-->|$)", "-->").getRegex(), Ma = j("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", $a).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ba = j(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), jo = j(/^!?\[(label)\]\[(ref)\]/).replace("label", mn).replace("ref", yr).getRegex(), Po = j(/^!?\[(ref)\](?:\[\])?/).replace("ref", yr).getRegex(), La = j("reflink|nolink(?!\\()", "g").replace("reflink", jo).replace("nolink", Po).getRegex(), wr = {
  _backpedal: zt,
  // only used for GFM url
  anyPunctuation: Na,
  autolink: Oa,
  blockSkip: Ca,
  br: Lo,
  code: Ea,
  del: zt,
  emStrongLDelim: Ia,
  emStrongRDelimAst: za,
  emStrongRDelimUnd: Ra,
  escape: Bo,
  link: Ba,
  nolink: Po,
  punctuation: Aa,
  reflink: jo,
  reflinkSearch: La,
  tag: Ma,
  text: Ta,
  url: zt
}, ja = {
  ...wr,
  link: j(/^!?\[(label)\]\((.*?)\)/).replace("label", mn).getRegex(),
  reflink: j(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", mn).getRegex()
}, mr = {
  ...wr,
  escape: j(Bo).replace("])", "~|])").getRegex(),
  url: j(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Pa = {
  ...mr,
  br: j(Lo).replace("{2,}", "*").getRegex(),
  text: j(mr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rn = {
  normal: kr,
  gfm: _a,
  pedantic: qa
}, _t = {
  normal: wr,
  gfm: mr,
  breaks: Pa,
  pedantic: ja
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
      const n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = []) {
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (c, i, y) => i + "    ".repeat(y.length));
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
          let y;
          this.options.extensions.startBlock.forEach((f) => {
            y = f.call({ lexer: this }, i), typeof y == "number" && y >= 0 && (c = Math.min(c, y));
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
    let n, o, s, a = e, c, i, y;
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
      if (i || (y = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((f) => (n = f.call({ lexer: this }, e, t)) ? (e = e.substring(n.raw.length), t.push(n), !0) : !1))) {
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
        if (s = e, this.options.extensions && this.options.extensions.startInline) {
          let f = 1 / 0;
          const x = e.slice(1);
          let h;
          this.options.extensions.startInline.forEach((k) => {
            h = k.call({ lexer: this }, x), typeof h == "number" && h >= 0 && (f = Math.min(f, h));
          }), f < 1 / 0 && f >= 0 && (s = e.substring(0, f + 1));
        }
        if (n = this.tokenizer.inlineText(s)) {
          e = e.substring(n.raw.length), n.raw.slice(-1) !== "_" && (y = n.raw.slice(-1)), i = !0, o = t[t.length - 1], o && o.type === "text" ? (o.raw += n.raw, o.text += n.text) : t.push(n);
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
  code(e, t, n) {
    var s;
    const o = (s = (t || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, o ? '<pre><code class="language-' + de(o) + '">' + (n ? e : de(e, !0)) + `</code></pre>
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
    const o = co(e);
    if (o === null)
      return n;
    e = o;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + t + '"'), s += ">" + n + "</a>", s;
  }
  image(e, t, n) {
    const o = co(e);
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
    F(this, "options");
    F(this, "renderer");
    F(this, "textRenderer");
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
          n += this.renderer.heading(this.parseInline(a.tokens), a.depth, pa(this.parseInline(a.tokens, this.textRenderer)));
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
          let y = "";
          for (let f = 0; f < a.rows.length; f++) {
            const x = a.rows[f];
            i = "";
            for (let h = 0; h < x.length; h++)
              i += this.renderer.tablecell(this.parseInline(x[h].tokens), { header: !1, align: a.align[h] });
            y += this.renderer.tablerow(i);
          }
          n += this.renderer.table(c, y);
          continue;
        }
        case "blockquote": {
          const a = s, c = this.parse(a.tokens);
          n += this.renderer.blockquote(c);
          continue;
        }
        case "list": {
          const a = s, c = a.ordered, i = a.start, y = a.loose;
          let f = "";
          for (let x = 0; x < a.items.length; x++) {
            const h = a.items[x], k = h.checked, m = h.task;
            let b = "";
            if (h.task) {
              const T = this.renderer.checkbox(!!k);
              y ? h.tokens.length > 0 && h.tokens[0].type === "paragraph" ? (h.tokens[0].text = T + " " + h.tokens[0].text, h.tokens[0].tokens && h.tokens[0].tokens.length > 0 && h.tokens[0].tokens[0].type === "text" && (h.tokens[0].tokens[0].text = T + " " + h.tokens[0].tokens[0].text)) : h.tokens.unshift({
                type: "text",
                text: T + " "
              }) : b += T + " ";
            }
            b += this.parse(h.tokens, y), f += this.renderer.listitem(b, m, !!k);
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
class Rt {
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
F(Rt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Ge, gr, Do;
class Da {
  constructor(...e) {
    io(this, Ge);
    F(this, "defaults", hr());
    F(this, "options", this.setOptions);
    F(this, "parse", tn(this, Ge, gr).call(this, ve.lex, Se.parse));
    F(this, "parseInline", tn(this, Ge, gr).call(this, ve.lexInline, Se.parseInline));
    F(this, "Parser", Se);
    F(this, "Renderer", gn);
    F(this, "TextRenderer", vr);
    F(this, "Lexer", ve);
    F(this, "Tokenizer", fn);
    F(this, "Hooks", Rt);
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
          (s = (o = this.defaults.extensions) == null ? void 0 : o.childTokens) != null && s[c.type] ? this.defaults.extensions.childTokens[c.type].forEach((i) => {
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
        const s = this.defaults.renderer || new gn(this.defaults);
        for (const a in n.renderer) {
          if (!(a in s))
            throw new Error(`renderer '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.renderer[c], y = s[c];
          s[c] = (...f) => {
            let x = i.apply(s, f);
            return x === !1 && (x = y.apply(s, f)), x || "";
          };
        }
        o.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new fn(this.defaults);
        for (const a in n.tokenizer) {
          if (!(a in s))
            throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a))
            continue;
          const c = a, i = n.tokenizer[c], y = s[c];
          s[c] = (...f) => {
            let x = i.apply(s, f);
            return x === !1 && (x = y.apply(s, f)), x;
          };
        }
        o.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new Rt();
        for (const a in n.hooks) {
          if (!(a in s))
            throw new Error(`hook '${a}' does not exist`);
          if (a === "options")
            continue;
          const c = a, i = n.hooks[c], y = s[c];
          Rt.passThroughHooks.has(a) ? s[c] = (f) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, f)).then((h) => y.call(s, h));
            const x = i.call(s, f);
            return y.call(s, x);
          } : s[c] = (...f) => {
            let x = i.apply(s, f);
            return x === !1 && (x = y.apply(s, f)), x;
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
    return ve.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return Se.parse(e, t ?? this.defaults);
  }
}
Ge = new WeakSet(), gr = function(e, t) {
  return (n, o) => {
    const s = { ...o }, a = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (a.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), a.async = !0);
    const c = tn(this, Ge, Do).call(this, !!a.silent, !!a.async);
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
}, Do = function(e, t) {
  return (n) => {
    if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const o = "<p>An error occurred:</p><pre>" + de(n.message + "", !0) + "</pre>";
      return t ? Promise.resolve(o) : o;
    }
    if (t)
      return Promise.reject(n);
    throw n;
  };
};
const Je = new Da();
function M(r, e) {
  return Je.parse(r, e);
}
M.options = M.setOptions = function(r) {
  return Je.setOptions(r), M.defaults = Je.defaults, zo(M.defaults), M;
};
M.getDefaults = hr;
M.defaults = Ze;
M.use = function(...r) {
  return Je.use(...r), M.defaults = Je.defaults, zo(M.defaults), M;
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
const Fo = "question-modal", mo = "question_modal", nr = 3, go = "gate-v2@2026.10.21";
function be() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.host) || {};
}
function Fa() {
  var r;
  return ((r = window.QwenPaw) == null ? void 0 : r.chat) || null;
}
function Ce() {
  return be().antd || {};
}
function Wa() {
  return be().antdIcons || {};
}
const Ha = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function rr(r) {
  const e = Wa();
  for (const t of Ha) {
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
let Sn = "", Wo = "";
function Sr(r, e) {
  r && (Wo = r), e && (Sn = e);
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
  return Wo;
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
const or = {};
async function Ja(r, e, t) {
  if (typeof window > "u" || or[r]) return "skipped";
  try {
    const s = "qm:v1:notified:" + r;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return or[r] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  or[r] = !0;
  const n = t > 0 ? "「" + e + "」有 " + t + " 道题等你作答" : "「" + e + "」等你作答", o = window.Notification;
  if (!o) return "inpage";
  try {
    if (o.permission === "default" && await new Promise((c) => {
      let i = !1;
      const y = (f) => {
        i || (i = !0, c(f));
      };
      try {
        const f = o.requestPermission((x) => y(x));
        f && typeof f.then == "function" && f.then(y).catch(() => y("denied"));
      } catch {
        y("denied");
      }
      setTimeout(() => y(o.permission || "denied"), 8e3);
    }) !== "granted" || o.permission !== "granted") return "inpage";
    const s = new o("问卷等待作答", { body: n, tag: "qm-" + r, renotify: !1 });
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
function K(r) {
  const e = Nt(r);
  return e && e.session_id ? e.session_id : _n();
}
const sr = 180, Ga = 20, Ho = 6e3, Za = 60, Qa = 8;
function Xa() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Va = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function ho(r) {
  try {
    return String(r || "").replace(Va, "").length;
  } catch {
    return 0;
  }
}
function bo(r) {
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
    n = ho((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return n - ho(t.textContent);
}
function Ka(r) {
  return r === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function Ya(r) {
  return !r.submittedAt || r.deadReason || r.skippedAll || !r.observed || r.releasedNote || r.retired ? null : { phase: r.pastSoft ? "stalled" : "waiting" };
}
function yo(r) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(r, { timeout: Ho });
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
function oi() {
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
async function si() {
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
async function on(r, e, t) {
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
    }), o = await n.json().catch(() => ({}));
    return n.ok ? {
      accepted: o.accepted !== !1,
      reason: String(o.reason || ""),
      state: o.state || null
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
  let t = !1, n = null, o = 0, s = null, a = 0, c = !1, i = 0, y = 0, f = null;
  const x = (m) => {
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
              c = !0, x(!1);
              return;
            }
            throw v && (i += 1), new Error(v ? "blocked" : "HTTP " + S.status);
          }
          o = 0, i = 0, x(!0);
          const I = S.body.getReader(), C = new TextDecoder();
          let R = "";
          const A = () => {
            I.read().then(({ done: P, value: L }) => {
              if (P) {
                k();
                return;
              }
              R += C.decode(L, { stream: !0 });
              let J;
              for (; (J = R.indexOf(`

`)) >= 0; ) {
                const ke = R.slice(0, J);
                R = R.slice(J + 2), ke.split(`
`).forEach((Ie) => {
                  if (!Ie.startsWith("data: ")) return;
                  let D = null;
                  try {
                    D = JSON.parse(Ie.slice(6));
                  } catch {
                    return;
                  }
                  D && (D.kind === "snapshot" ? (a = Math.max(a, parseInt(D.rev || 0, 10) || 0), e.onSnapshot(a, D.state || null)) : D.kind === "change" && (a = Math.max(a, parseInt(D.rev || 0, 10) || 0), e.onChange(D)));
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
    if (x(!1), i += 1, y || (y = Date.now()), i >= es) {
      if (Date.now() - (y || Date.now()) >= ns) {
        c = !0, x(!1);
        return;
      }
      s = setTimeout(h, ts);
      return;
    }
    o = Math.min(o + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, o));
    s = setTimeout(h, m);
  };
  return h(), () => {
    if (t = !0, s)
      try {
        clearTimeout(s);
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
let Uo = null;
async function hn(r, e, t, n) {
  const o = r || "", s = "&session_id=" + encodeURIComponent(t || "") + "&agent_id=" + encodeURIComponent(n || "");
  try {
    const a = N(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(o) + s
    ), c = await fetch(a, { headers: O() });
    if (!c.ok) return null;
    const i = await c.json();
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
    return Uo = { chatId: o, at: Date.now(), data: y }, y;
  } catch {
    return null;
  }
}
function Jo() {
  Uo = null;
}
async function Go(r) {
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
async function Zo(r) {
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
async function Qo() {
  try {
    const r = await fetch(N("/models"), { headers: O() });
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
function at(r) {
  return r ? r.skipped === !0 ? !0 : Array.isArray(r.value) ? r.value.length > 0 : !!(String(r.value ?? "").trim() || String(r.other ?? "").trim() || r.attachments && r.attachments.length) : !1;
}
function ir(r, e, t) {
  const n = { ...r };
  return !e || typeof e != "object" || Object.keys(e).forEach((o) => {
    if (t && t.has(o) || !Object.prototype.hasOwnProperty.call(n, o)) return;
    const s = e[o];
    !s || typeof s != "object" || !at(n[o]) && at(s) && (n[o] = { ...s });
  }), n;
}
function xo(r) {
  if (!r || typeof r != "object") return [];
  const e = r.recommended !== void 0 ? r.recommended : r.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((n) => String(n ?? "").trim()).filter((n) => n.length > 0);
}
function ko(r, e) {
  if (!r || typeof r != "object") return "";
  const t = Array.isArray(r.per_question) ? r.per_question : [];
  if (!t.length) return "";
  const n = t.find((o) => Number(o && o.index) === Number(e)) || (t.length === 1 ? t[0] : null);
  return n ? String(n.choice === void 0 || n.choice === null ? "" : n.choice).trim() : "";
}
function ci(r, e, t) {
  if (!t.length) return !1;
  const n = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), o = he(e), s = _e(e), a = n(o), c = n(s);
  return t.some((i) => {
    const y = n(i);
    return y ? !!(i === o || i === s || y === a || y === c || Math.min(y.length, a.length, c.length) >= 4 && (y.length >= 4 && (a.includes(y) || y.includes(a)) || y.length >= 4 && (c.includes(y) || y.includes(c)))) : !1;
  });
}
function re(r) {
  const e = r && r.type;
  return e === "single" || e === "multi" || e === "text" ? e : r && (r.options || []).length ? r.multiple === !0 ? "multi" : "single" : "text";
}
let Xo = !0;
function bn(r, e) {
  const t = String(r && r.title || "").trim();
  return t || (Xo ? "第 " + (e + 1) + " 题" : "");
}
function _e(r) {
  return String(r && typeof r == "object" ? r.label ?? r.value ?? "" : r);
}
function di(r, e) {
  const t = /* @__PURE__ */ new Set(), n = (s) => {
    s != null && s !== "" && t.add(String(s));
  }, o = r.options || [];
  if (re(r) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((a) => {
      n(a);
      const c = o.find((i) => he(i) === String(a));
      c && n(_e(c)), String(a) === le && e.other && n(e.other);
    });
  else {
    n(e.value);
    const s = o.find((a) => he(a) === String(e.value));
    s && n(_e(s)), String(e.value) === le && e.other && n(e.other);
  }
  return t;
}
function pi(r, e) {
  return (Array.isArray(r) ? r : [r]).some((n) => {
    const o = String(n);
    if (o.startsWith("=")) return e.has(o.slice(1));
    if (e.has(o)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(o) !== -1 || o.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Vo(r, e) {
  const t = /^q(\d+)$/i.exec(r.trim());
  if (t) {
    const o = parseInt(t[1], 10);
    if (o >= 0 && o < e.length) return o;
  }
  return e.findIndex((o) => (o.title || "").trim() === r.trim());
}
function Ko(r, e, t) {
  const n = e[r], o = n && n.showIf;
  if (!o || typeof o != "object" || !Object.keys(o).length) return !0;
  for (const s of Object.keys(o)) {
    const a = Vo(s, e);
    if (a < 0) continue;
    const c = e[a];
    if (!c) continue;
    if (c.showIf && !Ko(a, e, t)) return !1;
    const i = t[`q${a}`];
    if (!i || !pi(o[s], di(c, i))) return !1;
  }
  return !0;
}
function Ae(r, e) {
  const t = [];
  return r.forEach((n, o) => {
    Ko(o, r, e) && t.push(o);
  }), t;
}
function ui(r) {
  try {
    const e = r && r.content || [], t = e[0] && e[0].data && e[0].data.arguments;
    return t ? typeof t == "string" ? JSON.parse(t) : t : {};
  } catch {
    return {};
  }
}
function sn(r) {
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
    return n ? typeof n == "string" ? n : Array.isArray(n) ? n.map((o) => o && (o.text || o.content) || "").join(`
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
    const o = e[n];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(o) && !/^\{/.test(o) && !/^\s*"skipped"/.test(o) && o.length < 400)
      return o.replace(/^【|】$/g, "").trim();
  }
  const t = String(r).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return t && t[1] && t[1] !== "timeout" ? t[1] : "";
}
function Tt(r, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const o = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${o === "watchdog" ? "系统自动释放" : o === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + un(r);
  }
  const t = e && e.answers || {}, n = ["【用户提交的问卷答案】"];
  return Object.keys(t).forEach((o) => {
    const s = t[o];
    if (!s || typeof s != "object") return;
    const a = Vo(o, r), c = a >= 0 ? r[a] : null, i = c ? re(c) === "single" ? "单选" : re(c) === "multi" ? "多选" : "问答" : "问答", y = c ? bn(c, a) : o;
    let f = s.value;
    if (Array.isArray(f) && (f = f.join("、")), s.other && (f = (f ? f + "、" : "") + s.other), s.skipped) {
      const x = String(s.skipped_by || ""), h = x === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : x === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      n.push(`- ${o} [${i}] ${y}${h}`);
    } else
      n.push(`- ${o} [${i}] ${y}：${f === "" || f == null ? "（空）" : f}`);
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
    const o = await n.json();
    return o && Sr(o.session_id, o.agent_id), o && o.found ? { kind: "found", data: o } : o && o.orphan ? { kind: "orphan" } : { kind: "absent" };
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
const yn = "qm:v1:stash_att:", wo = 25 * 1024 * 1024, dn = /* @__PURE__ */ new Map(), pn = /* @__PURE__ */ new Map();
let xn = null, kn = 0, lr = null;
function vo() {
  const r = kn > 0;
  pn.forEach((e) => {
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
    xn = null, !(!n || !t.length) && await Yo(t, n.callId, n.target, n.key);
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
async function Yo(r, e, t, n) {
  kn += 1, vo();
  const o = [], s = [];
  try {
    for (const c of r) {
      if (c.size && c.size > wo) {
        s.push(`${c.name}: 文件过大（上限 ${Math.round(wo / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await yi(c);
      i.ok ? o.push(i.att) : s.push(i.error);
    }
  } finally {
    kn -= 1, vo();
  }
  const a = dn.get(e);
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
    else o.length && wi(e, o, c, n);
  }
}
function wi(r, e, t, n) {
  if (!(!r || !e.length))
    try {
      const o = localStorage.getItem(yn + r), s = o ? JSON.parse(o) : [], a = (Array.isArray(s) ? s : []).concat(
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
  const t = e || K(r), n = Nt(r), o = n && n.request_id ? n.request_id : "";
  if (o)
    try {
      const s = await fetch(N("/question-modal/skip"), {
        method: "POST",
        headers: O(),
        body: JSON.stringify({ request_id: o, session_id: t || "" })
      });
      if (s.ok) {
        const a = await s.json().catch(() => ({}));
        return ie(r), {
          ok: !0,
          released: !0,
          reason: a && a.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return ie(r), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (t)
    try {
      const s = await fetch(
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(t),
        { method: "POST", headers: O() }
      );
      if (s.ok) {
        const a = await s.json().catch(() => ({})), c = a && typeof a.cancelled == "number" ? a.cancelled : 0;
        return ie(r), { ok: !0, released: c > 0, reason: c > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function So(r) {
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
    const n = await t.json(), o = n && n.items || [];
    if (!Array.isArray(o) || o.length !== 1) return null;
    const s = o[0];
    if (!s || !s.request_id) return null;
    const a = await fetch(
      N("/question-modal/resolve") + "?request_id=" + encodeURIComponent(s.request_id),
      { headers: O() }
    );
    if (!a.ok) return null;
    const c = await a.json();
    return c && Sr(c.session_id, c.agent_id), c && c.found ? c : null;
  } catch {
    return null;
  }
}
const qn = "qm:v1:reqid:", Ei = 3e4, Ti = 45e3, es = 6, ts = 6e4, ns = 15 * 6e4, Ai = 700, Ci = 8;
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
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(qn) === 0 && r.push(s);
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
const rs = wn(), _o = "qm:v1:sessionprefs-ping";
function He(r, e) {
  if (r)
    try {
      const n = { ...It(r) || {}, ...e, ts: Date.now(), origin: rs };
      localStorage.setItem(qr + r, JSON.stringify(n)), Ni();
    } catch {
    }
}
function Ni() {
  try {
    const r = [];
    for (let o = 0; o < localStorage.length; o++) {
      const s = localStorage.key(o);
      s && s.indexOf(qr) === 0 && r.push(s);
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
  const o = ["【用户提交的问卷答案】"], s = new Set(Ae(r, e));
  return r.forEach((a, c) => {
    if (!s.has(c)) return;
    const i = e[`q${c}`];
    if (!i) return;
    let y = i.value;
    if (Array.isArray(y))
      y = y.filter((b) => b !== le).map((b) => {
        const T = (a.options || []).find((_) => he(_) === String(b));
        return T ? _e(T) : b;
      }).join("、");
    else {
      const b = (a.options || []).find((T) => he(T) === String(y));
      b && (y = _e(b)), String(i.value) === le && (y = "");
    }
    const f = re(a) === "single" ? "单选" : re(a) === "multi" ? "多选" : "问答", x = !!String(y || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), h = String(i.skipped_by || ""), k = i.skipped ? h === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : h === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : x ? y : "（未作答）";
    let m = `- q${c} [${f}] ${k}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((b) => b.file_name).join("、")}）`), o.push(m);
  }), t && o.push(`- 其他意见：${t}`), n && n.length && o.push(`- 其他意见附件：${n.map((a) => a.file_name).join("、")}`), o.join(`
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
    const o = n.value;
    if (Array.isArray(o) ? o.length === 1 && o[0] === le : String(o ?? "") === le) {
      e[t] = n;
      return;
    }
    e[t] = { ...n, other: "", attachments: [] };
  }), e;
}
function un(r) {
  return r.map((e, t) => {
    const n = re(e) === "single" ? "单选" : re(e) === "multi" ? "多选" : "问答", o = (e.options || []).map(_e).join("、");
    return `${t + 1}. [${n}] ${bn(e, t)}${o ? "（" + o + "）" : ""}`;
  }).join(`
`);
}
function dr(r) {
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
  }, y = {
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
    t.map((f, x) => e.createElement(
      "span",
      { key: "att" + x, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: f.file_name
      }, f.file_name + (f.size ? "（" + _i(f.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          n || c(x);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: n || o,
      style: y,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: a
    }, o ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function Bi(r) {
  const {
    R: e,
    providers: t,
    modelId: n,
    onChange: o,
    disabled: s,
    open: a,
    onOpenChange: c,
    tab: i,
    onTabChange: y
  } = r, x = Ce().Popover, h = [];
  t.forEach((A) => {
    [...A.models || [], ...A.extra_models || []].forEach((P) => {
      h.push({
        providerId: A.id,
        providerName: A.name || A.id,
        modelId: P.id,
        modelName: P.name || P.id,
        free: !!P.is_free
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
    cursor: s ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, S = h.filter((A) => A.free).length, v = h.length - S, I = [];
  t.forEach((A) => {
    const P = [...A.models || [], ...A.extra_models || []].map((L) => ({
      providerId: A.id,
      providerName: A.name || A.id,
      modelId: L.id,
      modelName: L.name || L.id,
      free: !!L.is_free
    })).filter((L) => i === "free" ? L.free : !L.free);
    P.length && I.push({ id: A.id, name: A.name || A.id, models: P });
  });
  const C = (A, P) => e.createElement("button", {
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
    onClick: () => y(A)
  }, P), R = e.createElement(
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
      C("paid", "付费 🟡 " + v),
      C("free", "免费 🟢 " + S)
    ),
    I.length ? e.createElement("div", null, I.map((A, P) => (
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
          const J = `${L.providerId}:${L.modelId}` === n;
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
                o(`${L.providerId}:${L.modelId}`), c(!1);
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
      disabled: s,
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
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const A = h.find((P) => `${P.providerId}:${P.modelId}` !== n);
        A && o(`${A.providerId}:${A.modelId}`);
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
function ji(r) {
  const { R: e, templates: t, value: n, open: o, onOpenChange: s, disabled: a, onSelect: c, onManage: i } = r, f = Ce().Popover, x = (t || []).find((T) => T.id === n), h = x ? x.name : "默认模板", k = {
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
          c(T.id), s(!1);
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
        s(!1), i();
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
    open: o,
    onOpenChange: s,
    placement: "bottomLeft"
  }, b) : b;
}
function Pi(r) {
  const { R: e, open: t, templates: n, value: o, edit: s, onEditChange: a, onClose: c, onSelect: i, onSave: y, onDelete: f } = r;
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
  }, T = !!s, _ = (v, I, C, R) => h && h.TextArea ? e.createElement(h.TextArea, {
    value: v,
    rows: C,
    placeholder: R,
    onChange: (A) => I(A && A.target ? A.target.value : "")
  }) : e.createElement("textarea", {
    value: v,
    rows: C,
    placeholder: R,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (A) => I(A && A.target ? A.target.value : ""),
    onChange: (A) => I(A && A.target ? A.target.value : "")
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
        T ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: c }, "关闭")
    ),
    T ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      _(s.name || "", (v) => a({ ...s, name: v }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      _(s.system || "", (v) => a({ ...s, system: v }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      _(s.user || "", (v) => a({ ...s, user: v }), 6, "用户提示词模板"),
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
          onClick: () => y(s)
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
    error: o,
    mode: s,
    onRun: a,
    onApply: c,
    onCancel: i,
    onRerun: y,
    disabled: f,
    children: x,
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
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
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
      }, String((n.per_question || []).map((I) => I.reasoning).join(`

`))) : null
    );
  const _ = !!(n && (n.per_question || []).length), S = (I, C, R) => e.createElement("button", {
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
  }, I), v = e.createElement(
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
              (y || a)();
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
          dangerouslySetInnerHTML: { __html: li(I.reasoning || "") }
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
    }, x)
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
  const e = be().React, t = Ce(), { Input: n, Button: o } = t, s = n.TextArea, a = r.data || {}, c = ui(a), i = fi(a), y = mi(a), f = gi(y), x = f ? "" : y, h = c.questions || [], k = c.title || "问卷", m = It(i), [b, T] = e.useState(
    () => !!(m && m.answered) || !!x || f
  ), [_, S] = e.useState(""), [v, I] = e.useState(() => {
    const l = Nt(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [C, R] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [A, P] = e.useState(
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
  }), [Qe, cs] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [H, ze] = e.useState(!1), [Re, En] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [it, lt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [pe, Xe] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(x || "")
  ), [Ne, Ve] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || hi(x || "")
  ), [ct, Ar] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [Mt, Cr] = e.useState(
    () => !!(m && m.expanded)
  ), [Ir, Bt] = e.useState(!1), Tn = e.useRef(0), [ue, ds] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [$e, dt] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [Ke, An] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Cn, In] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [pt, Lt] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), ut = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < sr * 1e3)
  ), Me = e.useRef(!1), jt = e.useRef(!!(m && m.pastSoft === !0)), [zn, ps] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), us = e.useRef(zn), zr = (l) => {
    us.current = l, ps(l);
  }, oe = (l, p) => {
    const g = zn[l];
    return g ?? p;
  };
  Xo = !!oe("fallback_title", !0);
  const Rr = Math.max(30, Number(oe("wait_hint_sec", sr)) || sr), fs = "manual", [Z, Pt] = e.useState(fs), [Nr, Rn] = e.useState(""), [ll, ms] = e.useState(!1), [Nn, On] = e.useState(!1), [$n, Mn] = e.useState(!1), [gs, hs] = e.useState([]), [Or, Bn] = e.useState(!1), [Dt, Ye] = e.useState(null), [bs, Be] = e.useState(""), [ys, xs] = e.useState(!1), [ks, ws] = e.useState(!1), [vs, Ss] = e.useState("paid"), Oe = e.useRef({}), qe = e.useRef({}), et = e.useRef(0), ft = e.useRef(null), [_s, tt] = e.useState(0), [$r, Ln] = e.useState([]), [Le, Ft] = e.useState(""), Ee = e.useRef(Le);
  Ee.current = Le;
  const [qs, Es] = e.useState(!1), [Ts, Mr] = e.useState(!1), [As, jn] = e.useState(null), [we, Br] = e.useState(
    () => !!(m && m.autoPaused)
  ), Cs = e.useRef(we);
  Cs.current = we;
  const nt = e.useRef(!1), Pn = e.useRef(0), Wt = e.useRef({}), [Is, zs] = e.useState(0), mt = e.useRef(/* @__PURE__ */ new Set()), gt = (l) => {
    l && mt.current.add(l);
  }, Ht = e.useRef({}), [Rs, Ut] = e.useState(0), je = e.useRef({}), [ht, Ns] = e.useState(!1), Os = e.useRef(!1);
  Os.current = ht, e.useRef(!1);
  const $s = async () => {
    try {
      const l = await hn(
        "",
        !0,
        K(i),
        qt()
      );
      if (!l || !l.config) return;
      const p = l.config;
      zr(p), p.mode !== void 0 && Pt(Et(p.mode)), typeof p.model_id == "string" && p.model_id && Rn(p.model_id), typeof p.with_context == "boolean" && On(p.with_context), typeof p.parallel == "boolean" && Mn(p.parallel), tt((g) => g + 1);
    } catch {
    }
  }, Lr = e.useRef(!1), Jt = (l) => {
    if (l.mode !== void 0) {
      Pt(l.mode), ar(
        { mode: l.mode },
        K(i),
        qt()
      );
      try {
        localStorage.setItem(_o, rs + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    l.modelId !== void 0 && (p.model_id = l.modelId), l.withContext !== void 0 && (p.with_context = l.withContext), l.parallel !== void 0 && (p.parallel = l.parallel), Object.keys(p).length && (l.modelId !== void 0 && Rn(l.modelId), l.withContext !== void 0 && On(l.withContext), l.parallel !== void 0 && Mn(l.parallel), ar(p, K(i), qt()));
  }, jr = (l) => {
    !l || l === Le || (Ft(l), Ee.current = l, He(i, { templateId: l }), ar(
      { template_id: l },
      K(i),
      qt()
    ), Ye(null), Oe.current = {}, qe.current = {}, tt((p) => p + 1));
  }, Ms = async (l) => {
    const p = await Go({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!p.ok) {
      $("error", p.error || "保存失败");
      return;
    }
    Ln(p.items || []), jn(null), $("success", "模板已保存");
  }, Bs = async (l) => {
    const p = await Zo(l);
    if (!p.ok) {
      $("warning", p.error || "删除失败");
      return;
    }
    Ln(p.items || []);
    const g = (p.items || []).map((u) => u.id);
    if (g.indexOf(Ee.current) === -1) {
      const u = g[0] || "";
      Ft(u), Ee.current = u, He(i, { templateId: u });
    }
    $("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    const l = (p) => {
      try {
        String(p && p.key || "") === _o && $s();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [b, i]), e.useEffect(() => {
    if (b) return;
    let l = !0;
    return oi(), (async () => {
      const [p, g, u, w] = await Promise.all([
        Qo(),
        si(),
        _r(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        hn(
          "",
          !0,
          K(i),
          qt()
        )
      ]);
      if (!l) return;
      if (hs(p), Ln(u.items), w && w.config) {
        const E = w.config;
        zr(E), E.mode !== void 0 && Pt(Et(E.mode)), typeof E.model_id == "string" && E.model_id && Rn(E.model_id), typeof E.with_context == "boolean" && On(E.with_context), typeof E.parallel == "boolean" && Mn(E.parallel), typeof E.template_id == "string" && E.template_id && (Ft(E.template_id), Ee.current = E.template_id);
      }
      const q = u.items.map((E) => E.id);
      if (!Ee.current || q.indexOf(Ee.current) === -1) {
        const E = u.defaultId || q[0] || "";
        E && (Ft(E), Ee.current = E);
      }
      if (w && w.config) {
        const E = w.config;
        ms(E.__follow_active__ === !0);
      }
      Lr.current = !0, tt((E) => E + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    et.current = C;
  }, [C]);
  const Dn = async (l) => {
    if (Or) return;
    const p = C;
    Bn(!0), Be("");
    const g = typeof AbortController < "u" ? new AbortController() : null;
    ft.current = g;
    try {
      const u = await fetch(N("/question-modal/analyze"), {
        method: "POST",
        headers: O(),
        body: JSON.stringify({
          request_id: v,
          tool_call_id: i,
          session_id: K(i),
          title: k,
          questions: h,
          model_id: Nr,
          mode: l,
          with_context: Nn,
          parallel: $n,
          question_index: p,
          answers: D,
          template_id: Ee.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(oe("model_timeout_sec", 120)) || 120
        }),
        signal: g ? g.signal : void 0
      }), w = await u.json().catch(() => ({})), q = w && w.analysis || null, E = q && q.error || w && w.error || "";
      w && w.cancelled || q && q.cancelled ? Be("已终止分析。") : !u.ok || !w || w.ok === !1 || q && q.ok === !1 ? Be(E || "分析失败（服务返回 " + u.status + "）") : q && (Oe.current[p] = q, qe.current[p] = !0, et.current === p && Ye(q), $("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (u) {
      ft.current === g && g && g.signal.aborted || u && u.name === "AbortError" ? Be("已终止分析。") : Be("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      ft.current === g && (ft.current = null), Bn(!1), je.current[p] = !0, Ut((u) => u + 1);
    }
  }, Ls = () => {
    const l = C;
    delete Oe.current[l], Ye(null), Be(""), Dn("manual");
  }, rt = (l) => {
    var g;
    const p = l !== void 0 ? l : et.current;
    try {
      fetch(N("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: O(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: v,
          question_index: p
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
      (g = ft.current) == null || g.abort();
    } catch {
    }
    Bn(!1);
  }, js = () => {
    rt(), Be("已终止分析。");
  }, Ps = () => {
    we ? (Ht.current = {}, je.current = {}, qe.current = {}, nt.current = !1, Br(!1), tt((l) => l + 1), $("info", "已恢复自动答题")) : (rt(), Br(!0), $("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = Oe.current[C];
    Ye(l || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + C;
    let g = !0;
    return fetch(N("/question-modal/analysis") + p, { headers: O() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !g || !u || !u.found || !u.analysis || (Oe.current[C] = u.analysis, et.current === C && Ye(u.analysis));
    }).catch(() => {
    }), () => {
      g = !1;
    };
  }, [i, C]), e.useEffect(() => {
    b || Lr.current && Z === "ai" && ht && (!sn(c) || !h.length || qe.current[C] || H || (qe.current[C] = !0, Dn("auto")));
  }, [
    b,
    Z,
    i,
    _s,
    Nn,
    $n,
    h,
    C,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    ht
  ]);
  const Ds = () => {
    const l = Dt && Dt.per_question || [];
    if (!l.length) return;
    if (!l.some((g) => g.type === "multi" ? String(g.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(g.choice || "").trim().length > 0)) {
      $("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    U((g) => {
      const u = { ...g };
      return l.forEach((w) => {
        const q = `q${w.index}`;
        gt(q);
        const E = u[q] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const X = String(w.choice || "").split(/[、,，]/).map((G) => G.trim()).filter(Boolean);
          u[q] = { ...E, value: X };
        } else
          u[q] = { ...E, value: w.choice || E.value };
      }), u;
    }), $("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Pe = (l, p, g = !1) => {
    rt(), ds(l), Xe(!0), lt(p), Bt(!1), T(!0), ie(i), g && He(i, { backendReleased: !0 });
  }, Fs = async (l, p) => {
    const g = await cr(i, K(i));
    return g.ok ? (Pe(l, p, g.released), !0) : (Bt(!0), Wn(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const l = (p = It(i)) == null ? void 0 : p.answers;
    He(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: v,
      visStep: C,
      answers: ir(D, l, mt.current),
      finalOther: Qe,
      finalOtherAtt: ct,
      answered: b,
      skippedAll: pe,
      expanded: Mt,
      localResult: it,
      submittedAt: Ke,
      skipReason: Ne,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Cn,
      waitRetired: pt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: A,
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
      releasedNote: Re,
      autoPaused: we,
      templateId: Le
    });
  }, [
    i,
    v,
    C,
    D,
    Qe,
    ct,
    b,
    pe,
    Mt,
    it,
    Ke,
    Ne,
    Cn,
    pt,
    A,
    L,
    ke,
    ue,
    we,
    Le,
    $e,
    Re
  ]), e.useEffect(() => {
    if (!b || !Ke || pt || !ut.current) return;
    let l = 0, p = !1, g = bo(i);
    const u = () => {
      if (p) return;
      const w = Math.floor((Date.now() - Ke) / 1e3);
      if (w >= Rr) {
        Me.current = !0, Lt(!0);
        return;
      }
      if (!Me.current) {
        const q = bo(i);
        q >= 0 && (g < 0 ? g = q : q - g >= Qa && (Me.current = !0));
      }
      if (!Me.current && w >= Ga && !jt.current && (jt.current = !0, In(!0)), Me.current) {
        l = setTimeout(
          () => {
            p || Lt(!0);
          },
          Math.max(1e3, (Rr - w) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        p || yo(u);
      }, Ho);
    };
    return yo(u), () => {
      p = !0, clearTimeout(l);
    };
  }, [b, Ke, pt]);
  const [Fn, Wn] = e.useState(!1), [Hn, Pr] = e.useState(""), Dr = (l, p, g) => {
    l.length && (p === "final" ? Ar((u) => u.concat(l)) : U((u) => {
      const w = g || `q${C}`;
      gt(w);
      const q = u[w] || { type: "text", value: "", other: "" };
      return { ...u, [w]: { ...q, attachments: (q.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, w, q, E) => {
      Dr(u, w, q), E && E.length ? Pr(E.join("；")) : Pr("");
    }, p = (u) => Wn(u);
    dn.set(i, l), pn.set(i, p);
    const g = vi(i);
    return g.length && g.forEach((u) => Dr([u.att], u.target, u.key)), Wn(kn > 0), () => {
      dn.get(i) === l && dn.delete(i), pn.get(i) === p && pn.delete(i);
    };
  }, [i, C]);
  const Un = (l, p) => ki(i, l, p), Jn = (l, p, g) => {
    const u = Si(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Yo(u, i, p, g);
    }
  };
  e.useEffect(() => {
    if (!f || _) return;
    let l = !0;
    return At(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Xe(!0);
      const g = String(p.skip_reason || "").trim();
      g && Ve((u) => u || g), S(Tt(h, p));
    }), () => {
      l = !1;
    };
  }, [f, i, _]), e.useEffect(() => {
    if (b || !i || x) return;
    let l = !0;
    return At(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Xe(!0);
      const g = String(p.skip_reason || "").trim();
      g && Ve((u) => u || g), S((u) => u || Tt(h, p)), lt(Tt(h, p)), T(!0), ie(i);
    }), () => {
      l = !1;
    };
  }, [i, b, x]), e.useEffect(() => {
    if (b) return;
    let l = !0, p = 0, g = 0, u = 0, w = !1, q = !1, E = 0, X = 0;
    Tn.current || (Tn.current = Date.now());
    let G = !!Nt(i), me = !1;
    const ce = (z) => {
      !l || !z || !z.request_id || (G = !0, g = 0, u = 0, w = !1, I(z.request_id), Bt(!1), E && (clearTimeout(E), E = 0), Ri(
        i,
        z.request_id,
        z.session_id || _n(),
        z.agent_id
      ));
    }, ee = (z) => {
      l && (E && (clearTimeout(E), E = 0), X && (clearTimeout(X), X = 0), Fs(
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
        const se = z.data;
        return se.tool_call_id && i && se.tool_call_id !== i ? (ie(i), !1) : (ce(se), !0);
      }
      return z.kind === "orphan" ? (ee("orphan"), !0) : (z.kind === "absent" && ie(i), !1);
    }, ge = (z = !1) => {
      if (l) {
        if (p += 1, z || (g += 1, u || (u = Date.now())), z) {
          if (!me) {
            me = !0, At(i).then((te) => {
              if (l) {
                if (te) {
                  te.kind === "skipped" && !te.answers && Xe(!0);
                  const St = String(te.skip_reason || "").trim();
                  St && Ve((tr) => tr || St), S(Tt(h, te)), lt(Tt(h, te)), T(!0), ie(i);
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
          const se = Date.now() - (Tn.current || Date.now());
          if (p >= 12 && se >= Ti) {
            ee("gone");
            return;
          }
        }
        if (g >= es) {
          if (Date.now() - (u || Date.now()) >= ns) {
            if (w = !0, !q) {
              q = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !w) return;
                    w = !1, g = 0, u = 0, p = 0, V();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          E = setTimeout(V, ts);
          return;
        }
        E = setTimeout(V, p < Ci ? Ai : 5e3);
      }
    }, xe = () => {
      bi(i, K(i)).then((z) => {
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
          qi(K(i)).then((se) => {
            if (l) {
              if (se) {
                if (se.tool_call_id && i && se.tool_call_id !== i) {
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
                ce(se);
                return;
              }
              At(i).then((te) => {
                if (l) {
                  if (te) {
                    te.kind === "skipped" && !te.answers && Xe(!0);
                    const St = String(te.skip_reason || "").trim();
                    St && Ve((tr) => tr || St), T(!0), ie(i);
                    return;
                  }
                  ge(!0);
                }
              });
            }
          });
        }
      });
    }, V = () => {
      if (l) {
        if (!vt) {
          xe();
          return;
        }
        We().then((z) => {
          !l || z || xe();
        });
      }
    };
    return X = setTimeout(() => {
      l && Bt(!0);
    }, Ei), V(), () => {
      l = !1, E && clearTimeout(E), X && clearTimeout(X);
    };
  }, [b, i]);
  const Fr = async () => {
    ze(!0);
    try {
      const l = K(i);
      let p = await cr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await So(l);
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
        ), $(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
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
      ze(!1);
    }
  }, Wr = async () => {
    ze(!0);
    try {
      const l = K(i);
      let p = await cr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await So(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        En(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), $("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const u = p.reason === "host-stop";
        En(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), $("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        En("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), $("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      $("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      ze(!1);
    }
  }, Gt = Ae(h, D), De = Gt.length, ye = C >= De, Q = ye ? -1 : Gt[C], bt = ye ? De : C;
  e.useEffect(() => {
    if (Et(oe("mode", "manual")) !== "manual") return;
    const p = String(oe("notify_channel", "off") || "off"), g = !!oe("notify_manual_mode", !1);
    if (p === "off" && !g || b || pe || ue || !sn(c) || !h.length) return;
    const u = Ae(h, D).filter((w) => !at(D[`q${w}`])).length;
    Ja(i, k, u);
  }, [zn, b, pe, ue, bt]);
  const Zt = Math.max(0, Number(oe("slow_question_sec", Za)) || 0) * 1e3, Ws = Math.round(Zt / 1e3);
  e.useEffect(() => {
    if (b || pe || ue || Zt <= 0) return;
    if (L !== bt) {
      J(bt), P(Date.now()), Ie(!1);
      return;
    }
    if (!A) {
      P(Date.now());
      return;
    }
    if (ke) return;
    const l = A + Zt - Date.now();
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
  }, [b, pe, ue, bt, L, A, ke, Zt]);
  const fe = Q >= 0 ? h[Q] : null, ot = `q${Q}`, W = Q >= 0 && D[ot] || { type: re(fe), value: re(fe) === "multi" ? [] : "", other: "" }, st = (l) => {
    var u;
    $e && dt(""), Q >= 0 && gt(`q${Q}`);
    const p = { ...D, [ot]: { ...l, skipped: !1 } }, g = Ae(h, p);
    h.forEach((w, q) => {
      g.indexOf(q) === -1 && delete p[`q${q}`];
    }), He(i, {
      answers: ir(p, (u = It(i)) == null ? void 0 : u.answers, mt.current)
    }), U(p);
  };
  e.useEffect(() => {
    C > De && R(De);
  }, [De, C]);
  const Gn = async (l, p) => {
    const g = await fetch(N(l), {
      method: "POST",
      headers: O(),
      body: JSON.stringify(p)
    }), u = await g.json().catch(() => ({}));
    if (!g.ok) {
      const w = new Error(u && u.detail || "HTTP " + g.status);
      throw w.status = g.status, w;
    }
    return u;
  }, Zn = () => {
    var l;
    return Mi(ir(
      D,
      (l = It(i)) == null ? void 0 : l.answers,
      mt.current
    ));
  }, Hs = () => !!oe("gate_unsaved", !0), Hr = (l, p) => {
    if (!Hs()) return [];
    const g = [];
    if (typeof p == "number")
      return Ae(h, l).indexOf(p) !== -1 && !at(l[`q${p}`]) && g.push(p + 1), g;
    const u = new Set(Ae(h, l));
    return h.forEach((w, q) => {
      u.has(q) && !at(l[`q${q}`]) && g.push(q + 1);
    }), g;
  }, Ur = (l, p, g) => {
    const u = "第 " + l.join("、") + " 题", w = g === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    dt("⛔ " + u + "尚未选择。" + w);
    const q = Ae(h, p).length;
    Gn("/question-modal/gate-block", {
      request_id: v,
      tool_call_id: i,
      session_id: K(i),
      missing: l,
      answered: q - l.length,
      total: q,
      bundle: go
    }).catch(() => {
    });
  }, Qt = async (l, p = !1) => {
    if (!v)
      return $("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const g = Zn();
    if (!p) {
      const u = Hr(g);
      if (u.length)
        return Ur(u, g, "提交"), "blocked";
      dt("");
    }
    ze(!0);
    try {
      const u = await Gn("/question-modal/answer", {
        request_id: v,
        session_id: K(i),
        answers: g,
        other: Qe,
        attachments: ct
      });
      return u && u.orphan ? (fetch(
        N("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(K(i)),
        { method: "POST", headers: O() }
      ).catch(() => {
      }), Pe(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), $("info", "本次问卷已失效，已关闭"), "sent") : (ie(i), lt($i(h, g, Qe, ct)), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, ut.current = !0, T(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Pe(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), $("info", "本次问卷已失效，已关闭"), "blocked") : ($("error", "提交失败: " + u.message), p ? (nt.current = !1, Pn.current += 1, Pn.current >= nr && $(
        "warning",
        "自动提交连续失败 " + nr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Ut((w) => w + 1), "not-ready") : "blocked");
    } finally {
      ze(!1);
    }
  }, Jr = () => oe("skip_mode", "per_question") === "whole", Us = () => {
    Q < 0 || ($e && dt(""), rt(et.current), qe.current[et.current] = !0, gt(`q${Q}`), U((l) => {
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
    }), R((l) => l + 1));
  }, Js = () => {
    if (ye) {
      Qt();
      return;
    }
    const l = Zn(), p = Hr(l, Q);
    if (p.length) {
      Ur(p, l, "下一步");
      return;
    }
    $e && dt(""), R((g) => g + 1);
  }, Gs = async () => {
    if (!v) {
      $("warning", "问卷尚未就绪，请稍候");
      return;
    }
    rt(), ze(!0);
    try {
      const l = await Gn("/question-modal/skip", {
        request_id: v,
        session_id: K(i)
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
      $("info", "已跳过问卷"), ie(i), Xe(!0), Ve("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), lt("用户跳过了本次问卷。"), An(Date.now()), In(!1), Lt(!1), Me.current = !1, jt.current = !1, ut.current = !0, T(!0);
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
      ze(!1);
    }
  };
  e.useEffect(() => {
    if (b || Z !== "ai" && Z !== "recommend" || we || (Z === "recommend" || Z === "ai") && !ht || !sn(c) || !h.length || H) return;
    if (ye) {
      if (nt.current || Pn.current >= nr) return;
      const G = Zn();
      if (!Gt.every(
        (ce, ee) => !!je.current[ee] || at(G[`q${ce}`])
      ) || !v) return;
      nt.current = !0, Qt(void 0, !0).then((ce) => {
        ce === "not-ready" && (nt.current = !1);
      });
      return;
    }
    const l = C;
    if (Ht.current[l] || Z === "ai" && !je.current[l]) return;
    const p = Gt[l], g = h[p], u = re(g), w = xo(g), q = ko(Oe.current[l], p);
    if (Z === "ai" && !je.current[l]) return;
    Ht.current[l] = !0;
    const E = w.length ? w.join("、") : q, X = !!E;
    gt(`q${p}`), X || (Wt.current[p] = !0, zs((G) => G + 1), $("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), U((G) => {
      const me = { ...G }, ce = `q${p}`, ee = me[ce] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!X)
        me[ce] = {
          ...ee,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const We = g.options || [], ge = (V) => String(V).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), xe = E.split(/[、,，]/).map((V) => ge(V)).filter(Boolean).map((V) => {
          const z = We.find((se) => he(se) === V || _e(se) === V);
          return z ? he(z) : V;
        });
        me[ce] = {
          ...ee,
          type: u,
          value: xe,
          other: xe.length === 1 && xe[0] === le ? ee.other : "",
          attachments: xe.length === 1 && xe[0] === le ? ee.attachments : []
        };
      } else if (u === "single") {
        const We = g.options || [], ge = (z) => String(z).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), xe = We.find((z) => he(z) === E || _e(z) === E) || We.find((z) => he(z) === ge(E) || _e(z) === ge(E)), V = xe ? he(xe) : E;
        me[ce] = {
          ...ee,
          type: u,
          value: V,
          other: String(V) === le ? ee.other : "",
          attachments: String(V) === le ? ee.attachments : []
        };
      } else
        me[ce] = { ...ee, type: u, value: E };
      const vt = Ae(h, me);
      return h.forEach((We, ge) => {
        vt.indexOf(ge) === -1 && delete me[`q${ge}`];
      }), me;
    }), qe.current[l] = !0, je.current[l] = !0, R((G) => G + 1), Ut((G) => G + 1);
  }, [
    b,
    Z,
    we,
    H,
    i,
    C,
    Rs,
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
    const p = (u) => {
      if (!(!l || !u)) {
        yt.current = !0, xt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!h || h.length), u.answers && typeof u.answers == "object" && (U((q) => {
            const E = { ...q };
            return Object.keys(u.answers).forEach((X) => {
              const G = u.answers[X];
              !G || typeof G != "object" || mt.current.has(X) || (E[X] = {
                ...E[X] || { type: "single", value: "", other: "" },
                ...G
              });
            }), E;
          }), He(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && R(u.cursor), typeof u.mode == "string" && u.mode) {
            const q = Et(u.mode);
            Pt((E) => E === q ? E : q);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((q) => {
            const E = parseInt(q, 10);
            !isNaN(E) && u.per_question[q] && (Oe.current[E] = u.per_question[q]);
          }), u.status === "submitted" && (An((q) => q || Date.now()), u.released && He(i, { backendReleased: !0 }), T(!0), ie(i));
          const w = String(u.skip_reason || "").trim();
          w && Ve((q) => q || w), typeof u.mode == "string" && u.mode && (Te.current.mode = Et(u.mode)), Object.keys(u.answers || {}).forEach((q) => {
            Te.current["a:" + q] = JSON.stringify(u.answers[q] || {});
          }), typeof u.cursor == "number" && (Te.current.cursor = "c:" + u.cursor), xt.current = !0, Ut((q) => q + 1);
        } finally {
          setTimeout(() => {
            yt.current = !1;
          }, 0);
        }
      }
    };
    ai(i).then((u) => {
      !l || !u || !u.found || !u.state || (Fe.current = Math.max(Fe.current, u.rev), p(u.state));
    });
    const g = ii(i, {
      onSnapshot: (u, w) => {
        Fe.current = Math.max(Fe.current, u), w && p(w);
      },
      onChange: (u) => {
        const w = parseInt(u.rev || 0, 10) || 0;
        w && w <= Fe.current && u.origin !== wn() || (Fe.current = Math.max(Fe.current, w), !(u.origin && u.origin === wn()) && p(u.state));
      },
      onStatus: (u) => {
        l && Ns((w) => w === !u ? w : !u);
      }
    });
    return () => {
      l = !1, g();
    };
  }, [b, i]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Object.keys(D || {}).forEach((l) => {
      const p = JSON.stringify(D[l] || {});
      Te.current["a:" + l] !== p && (Te.current["a:" + l] = p, on(
        i,
        "set_answer",
        { key: l, answer: D[l] }
      ));
    });
  }, [b, i, JSON.stringify(D)]), e.useEffect(() => {
    if (b || !i || yt.current || !xt.current) return;
    const l = "c:" + C;
    Te.current.cursor !== l && (Te.current.cursor = l, on(i, "goto", { cursor: C }));
  }, [b, i, C]), e.useEffect(() => {
    b || !i || yt.current || xt.current && Te.current.mode !== Z && (Te.current.mode = Z, on(i, "set_mode", { mode: Z }));
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
  }, Xn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, Vt = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Vn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Gr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Kn = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Zs = { display: "flex", flexDirection: "column", gap: 8 }, Kt = {
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
  }, Qs = {
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
  }, Xs = { height: 32, fontSize: 13, borderRadius: 8 }, Xr = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Vr = (l) => {
    const p = he(l);
    return W.type === "multi" ? Array.isArray(W.value) && W.value.indexOf(p) !== -1 : W.value === p;
  }, Kr = Vr(le), Yr = (l) => {
    if (b || H) return;
    const p = he(l);
    if (W.type === "multi") {
      const g = Array.isArray(W.value) ? W.value.slice() : [], u = g.indexOf(p);
      u === -1 ? g.push(p) : g.splice(u, 1);
      const w = g.length === 1 && g[0] === le;
      st({
        ...W,
        value: g,
        other: w ? W.other : "",
        attachments: w ? W.attachments : []
      });
    } else {
      const g = p === le;
      st({
        ...W,
        value: p,
        other: g ? W.other : "",
        attachments: g ? W.attachments : []
      });
    }
  }, Vs = !!oe("show_recommend_badge", !0), eo = oe("badge_position", "left") === "right", Ks = oe("badge_style", "rect") === "round", to = (l) => l && Vs ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Ks ? { ...Qr, borderRadius: 999 } : Qr
  }, "AI 推荐") : null, Ys = !!oe("auto_number_options", !0), ea = !!oe("highlight_recommended", !1), ta = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, no = (l, p, g, u, w, q) => e.createElement(
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
      style: w && ea ? { ...p ? Zr : Yn, ...ta } : p ? Zr : Yn,
      onClick: g
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    eo ? null : to(w),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (q && Ys ? q + ". " : "") + l),
    eo ? to(w) : null
  );
  if (!b && !sn(c))
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
          e.createElement("span", { style: Vt, className: "qm-title" }, k)
        ),
        e.createElement("span", { style: Vn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Gr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Ir ? e.createElement(
        "div",
        { style: Kt },
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
        deadReason: ue,
        releasedNote: Re,
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
      }, Ka(g.phase)) : null;
    }, p = !!ut.current;
    return pe && !Mt ? e.createElement(
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
        ue ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      Ne ? e.createElement("span", {
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
        title: Ne
      }, Ne) : null,
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
          ...Vt,
          flex: Re || Ne ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      Re ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, Re) : l(),
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
          e.createElement("span", { style: Vt }, k)
        ),
        e.createElement(
          "span",
          { style: { ...Vn, color: ue ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          ue ? "已失效" : pe ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      pe && (Ne || ue) ? e.createElement(
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
        String(Ne || ue || "问卷已失效/跳过")
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
        { style: Kt },
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
        { style: { ...Kt, marginTop: 8, gap: 10 } },
        Re ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, Re) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: H,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...kt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Wr
        }, "释放阻塞") : null
      )
    );
  }
  const ro = ke && L === bt, oo = !b && !ye && Is >= 0 && Wt.current[Q] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, so = Object.keys(Wt.current).map((l) => Number(l)).filter((l) => Wt.current[l] && Number.isFinite(l)).sort((l, p) => l - p), na = ye && so.length ? e.createElement("div", {
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
  }, "⚠ 第 " + so.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let en = null;
  if (ye)
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Kn }, "其他意见（可选）"),
      na,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Qe,
        style: Xr,
        onChange: (l) => cs(l.target.value),
        onPaste: (l) => Jn(l, "final", "final")
      }),
      dr({
        R: e,
        files: ct,
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("final", "final"),
        onRemove: (l) => Ar((p) => p.filter((g, u) => u !== l))
      })
    );
  else if (fe && re(fe) === "text")
    en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Kn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      oo,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof W.value == "string" ? W.value : "",
        style: Xr,
        onChange: (l) => st({ ...W, value: l.target.value, other: "" }),
        onPaste: (l) => Jn(l, "q", ot)
      }),
      dr({
        R: e,
        files: W.attachments || [],
        disabled: b || H,
        uploading: Fn,
        error: Hn,
        onPick: () => Un("q", ot),
        onRemove: (l) => st({
          ...W,
          attachments: (W.attachments || []).filter((p, g) => g !== l)
        })
      })
    );
  else if (fe) {
    const l = xo(fe), p = ko(Dt, Q), g = l.length ? l : p ? [p] : l, u = (fe.options || []).map((w, q) => no(
      _e(w),
      Vr(w),
      () => Yr(w),
      "o" + q,
      ci(fe, w, g),
      q + 1
    ));
    u.push(no("其他", Kr, () => Yr(le), "other")), Kr && (u.push(e.createElement(n, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: W.other,
      style: { ...Xs, marginTop: 2 },
      onChange: (w) => st({ ...W, other: w.target.value }),
      onPaste: (w) => Jn(w, "q", ot)
    })), u.push(dr({
      R: e,
      files: W.attachments || [],
      disabled: b || H,
      uploading: Fn,
      error: Hn,
      onPick: () => Un("q", ot),
      onRemove: (w) => st({
        ...W,
        attachments: (W.attachments || []).filter((q, E) => E !== w)
      })
    }))), en = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Kn, fontSize: 13, color: "var(--app-text, inherit)" } }, bn(fe, Q)),
      oo,
      e.createElement("div", { style: { ...Zs, marginTop: 8 } }, u)
    );
  }
  const er = De + 1, ra = ye ? er + "/" + er : C + 1 + "/" + er, wt = {
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
        e.createElement("span", { style: Vt, className: "qm-title" }, k)
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
          providers: gs,
          modelId: Nr,
          disabled: b || H,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: ks,
          onOpenChange: ws,
          tab: vs,
          onTabChange: Ss,
          onChange: (l) => {
            Jt({ modelId: l }), Ye(null), Oe.current = {}, qe.current = {}, tt((p) => p + 1);
          }
        }),
        ji({
          R: e,
          templates: $r,
          value: Le,
          open: qs,
          onOpenChange: Es,
          disabled: b || H,
          onSelect: jr,
          onManage: () => Mr(!0)
        }),
        Li({
          R: e,
          mode: Z,
          disabled: b || H,
          onChange: (l) => {
            Jt({ mode: l }), l === "ai" && (qe.current = {}), l === "ai" || l === "recommend" ? (Ht.current = {}, je.current = {}, nt.current = !1, tt((p) => p + 1)) : rt();
          }
        }),
        Di({
          R: e,
          busy: Or,
          result: Dt,
          error: bs,
          mode: Z,
          disabled: b || H,
          open: ys,
          onOpenChange: xs,
          onRun: () => {
            Dn("manual");
          },
          onRerun: Ls,
          onApply: Ds,
          onCancel: js,
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
          onClick: Ps,
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
        e.createElement("span", { style: Vn, key: "qm-step" }, ra)
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
      open: Ts,
      templates: $r,
      value: Le,
      edit: As,
      onEditChange: jn,
      onClose: () => {
        Mr(!1), jn(null);
      },
      onSelect: (l) => jr(l),
      onSave: Ms,
      onDelete: Bs
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
    (ro || Ir && !v) && !b ? e.createElement(
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
        (ro ? "⚠️ 本题已超过 " + Ws + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (v ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
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
      "data-qm-bundle": go
    }, $e) : null,
    e.createElement(
      "div",
      { style: Kt, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: C === 0 || H,
        style: { ...wt, marginRight: "auto", opacity: C === 0 ? 0.5 : 1 },
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
          onClick: ye ? () => Qt(void 0, !0) : Jr() ? () => Qt(void 0, !0) : Us
        },
        ye || Jr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: wt,
        onClick: Gs
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: H,
        style: Qs,
        onClick: Js
      }, ye ? "提交" : "下一步")
    )
  );
}
const qo = 12;
let Eo = 0;
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
    const s = d.cfg && d.cfg.globalConfig || d.globalCfg;
    return s && r in s ? s[r] : e;
  }
  const n = d.cfg && d.cfg.config, o = d.cfg && d.cfg.sessionConfig;
  if (o) {
    if (r in o) return o[r];
    const s = d.cfg && d.cfg.globalConfig || d.globalCfg;
    return s && r in s ? s[r] : e;
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
    const o = n && n.globalConfig || d.globalCfg || {};
    t = r in o ? o[r] : void 0;
  } else {
    const o = n && n.sessionConfig;
    if (o)
      if (r in o)
        t = o[r];
      else {
        const s = n && n.globalConfig || d.globalCfg || {};
        t = r in s ? s[r] : void 0;
      }
    else {
      const s = n && n.config;
      t = s && r in s ? s[r] : void 0;
    }
  }
  t === e ? delete d.draft[r] : d.draft[r] = e, d.saveMsg = "", B();
}
function To() {
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
async function os() {
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
  } catch (o) {
    e = "✗ 请求失败：" + String(o && o.message || o);
  }
  d.notifyTesting = "", d.notifyMsg = { ...d.notifyMsg, [r]: e };
  const n = t && Array.isArray(t.history) ? t.history : null;
  n && (d.notifyLog = { ...d.notifyLog, [r]: n }), await os(), n || await Tr(r);
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
    Object.keys(n).forEach((o) => {
      o in t || (t[o] = n[o]);
    });
  }
  r.length, d.saving = !0, d.saveMsg = "", B();
  try {
    let n = "/question-modal/prefs", o = t;
    e && (n = "/question-modal/session-prefs", o = {
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
    const s = await fetch(N(n), {
      method: "POST",
      headers: O(),
      body: JSON.stringify(o)
    }), a = await s.json().catch(() => ({}));
    if (!s.ok) {
      d.saving = !1, d.saveMsg = a && a.detail ? String(a.detail) : "保存失败（" + s.status + "）", B();
      return;
    }
    d.saving = !1, d.draft = {}, Jo();
    const c = Array.isArray(a && a.conflicts) ? a.conflicts : [];
    if (d.conflictNote = "", c.length) {
      const x = (m) => {
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
      d.conflictNote = "设置已于 " + x(h) + " 被其它位置修改，本次已按后写入的值覆盖" + (k.length ? "（" + k.join("、") + "）" : "") + "。";
    }
    try {
      const x = a && a.key_ts || {};
      x && typeof x == "object" && (d.keyTs = Object.assign({}, d.keyTs, x));
    } catch {
    }
    e || Er();
    const y = ["session", "default"].indexOf(String(d.tab)) >= 0;
    let f = "";
    if (y && (f = e ? "session" : "default"), f === "default") {
      try {
        const x = await fetch(N("/question-modal/session-prefs"), {
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
        x.ok || (d.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + x.status + "），本会话仍在会话模式。", f = "");
      } catch (x) {
        d.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (x && x.message ? x.message : x) + "，本会话仍在会话模式。", f = "";
      }
      d.keyTs = {};
    }
    if (f && (d.scopeChoice = f, d.tab = f, d.scope = f === "session" ? "session" : "global"), f === "default")
      d.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (f === "session")
      d.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const x = String(d.tab) === "prompt" ? "提示词模板" : "全局配置";
      d.saveMsg = "已保存" + x + "；运行模式未变" + (d.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    hn(
      d.chatId,
      !0,
      d.sessionId,
      d.agentId
    ).then((x) => {
      x && (d.cfg = x);
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
function ss() {
  d.draft = {}, d.saveMsg = "";
}
function as() {
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
function Ao(r, e) {
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
    const o = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    o && typeof o.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((s) => {
      const a = o.querySelector('[data-qm-tpl-field="' + s + '"]');
      a && typeof a.value == "string" && a.value !== "" && (r[s] = a.value);
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
  }, n = await Go(t);
  if (d.tplBusy = !1, n && n.ok === !1) {
    d.saveMsg = String(n.error || n.detail || "保存失败"), B();
    return;
  }
  d.tplEdit = null, d.saveMsg = r.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", as(), B();
}
async function Xi(r) {
  const e = d.templates.filter((o) => o.id === r)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || r) + "」？") : !1)) return;
  const n = await Zo(r);
  if (n && n.ok === !1) {
    d.saveMsg = String(n.error || n.detail || "删除失败（内置模板不可删除）"), B();
    return;
  }
  d.saveMsg = "模板已删除", as(), B();
}
function Vi() {
  d.visible = !0, d.chatId = "", d.sessionId = _n(), d.cfg = null, d.cfgError = "", Ki(), d.agentId = Sn || (() => {
    try {
      return be().getSelectedAgentId ? be().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Jo();
  const r = ++Eo;
  d.scopeChoice = "", d.tab = "", d.scope = "global", d.draft = {}, d.saveMsg = "", d.conflictNote = "", B(), is(() => {
    if (r !== Eo) return;
    const t = !!(d.cfg && d.cfg.has_session) ? "session" : "default";
    d.scopeChoice = t, d.tab = t === "session" ? "session" : "default", d.scope = t === "session" ? "session" : "global", d.draft = {}, d.saveMsg = "", d.keyTs = Object.assign(
      {},
      d.cfg && d.cfg.keyTs || {}
    ), d.conflictNote = "", B(), (d.tab === "global" || d.tab === "default") && Er(), os().then(() => {
      const n = String(d.notifyCurrent || "off");
      n && n !== "off" && Tr(n);
    });
  });
}
let an = !1;
function Ki() {
  an || (an = !0, Promise.all([Qo(), _r()]).then((r) => {
    an = !1;
    const e = r[0] || [], t = r[1] || {};
    d.providerGroups = e.map((n) => {
      const o = String(n && (n.id || n.provider_id) || ""), a = (n && n.models || []).concat(n && n.extra_models || []).filter(Boolean).map((c) => {
        const i = typeof c == "string" ? c : c && (c.name || c.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: o,
        name: String(n && (n.name || n.title) || o),
        models: a
      };
    }).filter((n) => n.id && n.models.length > 0), d.modelOptions = d.providerGroups.flatMap((n) => n.models.map((o) => n.id + ":" + o)), d.templates = (t.items || []).filter((n) => n && n.id), d.templateOptions = d.templates.map((n) => n.id);
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
let pr = !1, ln = "";
const ur = [];
function is(r) {
  const e = d.chatId, t = (e || "") + "|" + (d.sessionId || "");
  if (pr && ln === t) {
    r && ur.push(r);
    return;
  }
  pr = !0, ln = t;
  const n = () => {
    ln === t && (pr = !1, ln = "");
    const o = ur.splice(0);
    try {
      o.forEach((s) => s());
    } catch {
    }
  };
  r && ur.push(r), hn(
    e,
    !0,
    d.sessionId,
    d.agentId
  ).then((o) => {
    if (d.chatId !== e) {
      n();
      return;
    }
    o ? (d.cfg = o, d.cfgError = "") : (d.cfgError = "读取配置失败（后端不可达）", d.tab || (d.tab = "default", d.scopeChoice = "default", d.scope = "global")), n();
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
    Ct || (Ct = document.createElement("div"), Ct.id = "qm-settings-root", document.body.appendChild(Ct)), e.render(r.createElement(sl, {
      R: r,
      open: d.visible,
      onClose: () => {
        if (To() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          ss();
        }
        d.visible = !1, d.saveMsg = "", B();
      },
      tab: d.tab,
      onTabChange: (t) => {
        d.tab = t, (t === "session" || t === "default") && (d.scopeChoice = t), d.scope = ls(t) ? "session" : "global", d.saveMsg = "", d.draft = {}, B(), is(), (t === "global" || t === "default") && Er();
      },
      scope: d.scope,
      scopeChoice: d.scopeChoice,
      sessData: d.sessData,
      cfg: d.cfg,
      cfgError: d.cfgError,
      chatId: d.chatId,
      dirtyCount: To(),
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
  const { R: e, onOpen: t } = r, n = Ce(), o = n && n.Button, s = "问卷设置", a = { fontSize: 12, padding: "2px 6px", height: 28 }, c = { title: s, "aria-label": s }, i = {
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
  return y ? o ? e.createElement(o, {
    type: "text",
    size: "small",
    style: a,
    onClick: t,
    title: c.title,
    "aria-label": c["aria-label"]
  }, y) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: a,
    onClick: t,
    title: c.title,
    "aria-label": c["aria-label"]
  }, y) : o ? e.createElement(
    o,
    { type: "text", size: "small", style: a, onClick: t },
    s
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: a, onClick: t },
    s
  );
}
const fr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" }
], ls = (r) => r === "session";
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
  const t = d.notifyChannels || [], n = String(d.notifyCurrent || "off"), o = String(Y("notify_channel", "off", "global") || n || "off"), a = ((_) => t.filter((S) => String(S.channel) === _)[0])(o), c = t.map((_) => {
    const S = String(_.channel || ""), v = String(_.label || S), I = _.ready !== !1, C = _.verified === !0 || S === "off";
    let R = "";
    return I ? C || (R = "（待测试）") : R = "（不可用）", { value: S, label: v + R, disabled: !I };
  });
  c.length || c.push({ value: "off", label: "关闭", disabled: !1 });
  const i = !a || a.ready !== !1, y = o !== "off" && o !== "browser", f = d.notifyTesting === o, x = a && a.last_test || null, h = d.notifyMsg[o] || "", k = [
    r.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: o,
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
  y && i && k.push(r.createElement("button", {
    key: "test",
    type: "button",
    disabled: f,
    "data-qm-notify-test": o,
    onClick: (_) => {
      _ && _.stopPropagation && _.stopPropagation(), Hi(o);
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
  const m = !!(a && a.verified === !0), b = x || h, T = !!h;
  if (b || y && i && !f) {
    const _ = x ? x.delivered === !0 : T ? h.indexOf("✓") === 0 : !1;
    let S;
    T ? S = h : x ? S = _ ? "✓ 上次测试成功" + (x.note ? "（" + x.note + "）" : "") : "✗ " + (x.error || x.note || "上次测试失败") : S = "未测试";
    const v = x && x.at_text ? "  ·  " + x.at_text : "", I = b ? _ ? "#52c41a" : "#ff4d4f" : "#faad14";
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
        color: I,
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
function ne(r, e, t, n, o, s, a, c, i) {
  const y = s || "global", f = nl(a || "global", y), x = [
    r.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      r.createElement("span", { key: "tt" }, t),
      tl(r, "sc", y),
      f && y === "global" ? r.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    o ? r.createElement("span", { className: "qm-set-rownote", key: "n" }, o) : null
  ], h = [
    r.createElement("div", { className: "qm-set-rowlabel", key: "l" }, x),
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
function Co(r, e, t, n, o) {
  return r.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    t.map((s, a) => r.createElement("button", {
      key: "s" + a,
      type: "button",
      "data-qm-val": s,
      disabled: !o,
      className: "qm-set-segbtn" + (s === n ? " qm-set-segon" : "") + (o ? "" : " qm-set-ctrldis"),
      onClick: () => {
        o && o(s);
      }
    }, [
      r.createElement("span", { key: "t" }, s)
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
    onKeyDown: (o) => {
      if (!n) return;
      const s = o && o.key;
      (s === " " || s === "Enter") && (o.preventDefault(), n(!t));
    }
  }, [
    r.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function Ue(r, e, t, n, o) {
  if (n && n.length && o) {
    const s = n.map((a, c) => a && typeof a == "object" ? { value: String(a.value), label: String(a.label || a.value) } : { value: String(a), label: String(a) });
    return r.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      r.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: t,
        onChange: (a) => o(a && a.target ? a.target.value : "")
      }, s.map((a, c) => r.createElement("option", { key: "o" + c, value: a.value }, a.label)))
    ]);
  }
  return r.createElement("div", { className: "qm-set-select", key: e }, [
    r.createElement("span", { key: "t", className: "qm-set-selecttext" }, t),
    r.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function Io(r, e, t, n, o) {
  const s = Yi(t), c = n.map((k) => k.id).indexOf(s.provider) >= 0 ? s.provider : "", i = c ? (n.filter((k) => k.id === c)[0] || { models: [] }).models : [], y = i.indexOf(s.model) >= 0 ? s.model : "", f = (k, m) => {
    o && o(k ? k + ":" + m : "");
  }, x = r.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: c,
    disabled: !o,
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
    value: y,
    disabled: !o || !c,
    title: c ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const m = k && k.target ? k.target.value : "";
      f(c, m);
    }
  }, c ? i.map((k, m) => r.createElement("option", { key: "m" + m, value: k }, k)) : [r.createElement("option", { key: "m0", value: "" }, "—")]);
  return r.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    x,
    r.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    h
  ]);
}
function ol(r, e, t, n, o) {
  const s = [], a = t === "session" ? "session" : "global", c = {
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
  }, k = o && o.templateOptions || [];
  o && o.modelOptions;
  const m = o && o.providerGroups || [], b = k.map((T) => {
    const _ = d.templates.filter((S) => String(S.id) === String(T))[0];
    return { value: T, label: _ && (_.name || _.id) || T };
  });
  if (e === "session") {
    const _ = String(Y("mode", "manual")) !== "recommend";
    if (s.push(ne(
      r,
      "s1",
      "答题模式",
      Co(
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
      s.push(ne(
        r,
        "s2",
        "默认模型",
        Io(
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
      s.push(ne(
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
      )), s.push(ne(
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
      )), s.push(ne(
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
      s.push(ne(
        r,
        "a1",
        "默认答题模式",
        Co(
          r,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(Y("mode", "manual", "global"))] || "人工",
          (v) => ae("mode", c[v] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        a
      )), S && (s.push(ne(
        r,
        "b1",
        "默认模型",
        Io(
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
      )), s.push(ne(
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
      )), s.push(ne(
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
      )), s.push(ne(
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
      s.push(rl(r, a)), s.push(ne(
        r,
        "e6",
        "单题分析超时",
        Ue(
          r,
          "sel4",
          f[Number(Y("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (C) => ae("model_timeout_sec", y[C] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        a
      )), s.push(ne(
        r,
        "d4",
        "等待提示阈值",
        Ue(
          r,
          "sel5",
          h[Number(Y("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (C) => ae("wait_hint_sec", x[C] ?? 180)
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
      }, I = Number(Y("gate_log_limit", 200, "global"));
      s.push(ne(
        r,
        "d5",
        "拦截记录",
        Ue(
          r,
          "sel6",
          v[I] || "最近 200 条（默认）",
          _,
          (C) => ae("gate_log_limit", S[C] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        a
      ));
    }
  else if (e === "prompt") {
    const T = d.templates, _ = d.tplEdit;
    if (s.push(ne(
      r,
      "p0",
      "模板库共享范围",
      r.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      a
    )), T.length ? s.push(r.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      T.map((S, v) => {
        const I = !!S.builtin, R = (String(S.note || S.desc || "").trim() || String(S.system || S.system_prompt || S.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), A = R.length > 90 ? R.slice(0, 90) + "…" : R;
        return r.createElement("div", { className: "qm-set-item", key: "i" + v }, [
          r.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            r.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(S.name || S.id)
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
              "data-qm-tpl-edit": String(S.id),
              onClick: () => {
                Gi(String(S.id));
              }
            }, "编辑"),
            r.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (I ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(S.id),
              disabled: I,
              title: I ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                I || Xi(String(S.id));
              }
            }, "删除")
          ]),
          r.createElement("div", { className: "qm-set-itemdesc", key: "d" }, A)
        ]);
      })
    )) : s.push(r.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), s.push(r.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
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
      const S = (v, I, C, R, A) => {
        var P, L;
        return r.createElement("div", { className: "qm-set-field", key: "f-" + I }, [
          r.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, v),
          C ? r.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: R,
            "data-qm-tpl-field": I,
            placeholder: A,
            value: String(((P = d.tplEdit) == null ? void 0 : P[I]) || ""),
            onChange: (J) => Ao(I, J && J.target ? J.target.value : "")
          }) : r.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": I,
            placeholder: A,
            value: String(((L = d.tplEdit) == null ? void 0 : L[I]) || ""),
            onChange: (J) => Ao(I, J && J.target ? J.target.value : "")
          })
        ]);
      };
      s.push(r.createElement("div", {
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
  return r.createElement("div", { className: "qm-set-tabbody", key: "tb" }, s);
}
function sl(r) {
  const { R: e, open: t, onClose: n } = r;
  if (!t) return null;
  const o = Ce(), s = o && o.Modal, a = !r.tab, c = r.tab || "", i = ls(c) ? "session" : "global", y = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    fr.map((U) => e.createElement("button", {
      key: U.key,
      type: "button",
      className: "qm-set-tab" + (!a && U.key === c ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          r.onTabChange && r.onTabChange(U.key);
        } catch {
        }
      }
    }, U.label))
  ), f = fr.filter((U) => U.key === c)[0] || fr[0], x = !!(r.cfg && r.cfg.has_session), h = x ? "session" : "default", k = x ? "会话模式" : "默认模式", m = e.createElement("div", {
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
        n();
      } catch {
      }
    }
  }, "✕"), T = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      m,
      b
    ])
  ]), _ = f.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, f.hint) : null, S = null, v = a ? e.createElement("div", {
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
  }))) : null, I = a ? v : ol(e, c, i, r.sessData, {
    modelOptions: r.modelOptions,
    templateOptions: r.templateOptions,
    providerGroups: r.providerGroups
  }), C = r.dirtyCount || 0, R = String(r.tab || ""), A = R === "session" || R === "default";
  let P;
  A ? P = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : P = R === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const L = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      C ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + C + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, P)
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
        disabled: !!r.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          ss(), B();
        }
      }, "撤销") : null,
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
  ]), J = r.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, r.saveMsg) : null, ke = r.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, r.conflictNote) : null, Ie = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    S,
    _,
    I,
    J,
    ke
  ]), D = e.createElement("div", { className: "qm-set-wrap" }, [
    T,
    y,
    Ie,
    L
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
    onCancel: n,
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
          n();
        } catch {
        }
      }
    }, "✕"),
    D
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
        Vi();
      }
    });
    e.addPrefix(Fo, n, {
      id: "question-modal.settings-btn",
      order: qo
    }), console.log("[question-modal] settings entry registered (order " + qo + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function il() {
  const r = Fa();
  if (!r || typeof r.toolRender != "function") return !1;
  try {
    return Ua(), r.toolRender(Fo, mo, Fi), console.log("[question-modal] registered via chat.toolRender for", mo), al(r), !0;
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
