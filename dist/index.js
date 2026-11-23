var Mo = Object.defineProperty;
var As = (t) => {
  throw TypeError(t);
};
var Lo = (t, e, n) => e in t ? Mo(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var H = (t, e, n) => Lo(t, typeof e != "symbol" ? e + "" : e, n), Bo = (t, e, n) => e.has(t) || As("Cannot " + n);
var Is = (t, e, n) => e.has(t) ? As("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var xn = (t, e, n) => (Bo(t, e, "access private method"), n);
function jr() {
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
let lt = jr();
function ta(t) {
  lt = t;
}
const na = /[&<>"']/, Po = new RegExp(na.source, "g"), ra = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, jo = new RegExp(ra.source, "g"), Do = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ns = (t) => Do[t];
function ke(t, e) {
  if (e) {
    if (na.test(t))
      return t.replace(Po, Ns);
  } else if (ra.test(t))
    return t.replace(jo, Ns);
  return t;
}
const Fo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Wo(t) {
  return t.replace(Fo, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const Ho = /(^|[^\[])\^/g;
function W(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (s, a) => {
      let o = typeof a == "string" ? a : a.source;
      return o = o.replace(Ho, "$1"), n = n.replace(s, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function zs(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Ft = { exec: () => null };
function $s(t, e) {
  const n = t.replace(/\|/g, (a, o, d) => {
    let i = !1, h = o;
    for (; --h >= 0 && d[h] === "\\"; )
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
function kn(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r && t.charAt(r - s - 1) === e; )
    s++;
  return t.slice(0, r - s);
}
function Uo(t, e) {
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
function Os(t, e, n, r) {
  const s = e.href, a = e.title ? ke(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
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
    text: ke(o)
  };
}
function Go(t, e) {
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
class In {
  // set by the lexer
  constructor(e) {
    H(this, "options");
    H(this, "rules");
    // set by the lexer
    H(this, "lexer");
    this.options = e || lt;
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
        text: this.options.pedantic ? r : kn(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], s = Go(r, n[3] || "");
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
        const s = kn(r, "#");
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
      r = kn(r.replace(/^ *>[ \t]?/gm, ""), `
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
      let d = "", i = "", h = !1;
      for (; e; ) {
        let b = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = n[0], e = e.substring(d.length);
        let w = n[2].split(`
`, 1)[0].replace(/^\t+/, (N) => " ".repeat(3 * N.length)), f = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = w.trimStart()) : (k = n[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = w.slice(k), k += n[1].length);
        let g = !1;
        if (!w && /^ *$/.test(f) && (d += f + `
`, e = e.substring(f.length + 1), b = !0), !b) {
          const N = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), A = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), S = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const q = e.split(`
`, 1)[0];
            if (f = q, this.options.pedantic && (f = f.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), S.test(f) || _.test(f) || N.test(f) || A.test(e))
              break;
            if (f.search(/[^ ]/) >= k || !f.trim())
              i += `
` + f.slice(k);
            else {
              if (g || w.search(/[^ ]/) >= 4 || S.test(w) || _.test(w) || A.test(w))
                break;
              i += `
` + f;
            }
            !g && !f.trim() && (g = !0), d += q + `
`, e = e.substring(q.length + 1), w = f.slice(k);
          }
        }
        a.loose || (h ? a.loose = !0 : /\n *\n *$/.test(d) && (h = !0));
        let y = null, x;
        this.options.gfm && (y = /^\[[ xX]\] /.exec(i), y && (x = y[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), a.items.push({
          type: "list_item",
          raw: d,
          task: !!y,
          checked: x,
          loose: !1,
          text: i,
          tokens: []
        }), a.raw += d;
      }
      a.items[a.items.length - 1].raw = d.trimEnd(), a.items[a.items.length - 1].text = i.trimEnd(), a.raw = a.raw.trimEnd();
      for (let b = 0; b < a.items.length; b++)
        if (this.lexer.state.top = !1, a.items[b].tokens = this.lexer.blockTokens(a.items[b].text, []), !a.loose) {
          const w = a.items[b].tokens.filter((k) => k.type === "space"), f = w.length > 0 && w.some((k) => /\n.*\n/.test(k.raw));
          a.loose = f;
        }
      if (a.loose)
        for (let b = 0; b < a.items.length; b++)
          a.items[b].loose = !0;
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
    const r = $s(n[1]), s = n[2].replace(/^\||\| *$/g, "").split("|"), a = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push($s(d, o.header.length).map((i) => ({
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
        text: ke(n[1])
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
        const o = kn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Uo(n[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), Os(n, {
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
      return Os(r, a, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...s[0]].length - 1;
      let d, i, h = o, b = 0;
      const w = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (w.lastIndex = 0, n = n.slice(-1 * e.length + o); (s = w.exec(n)) != null; ) {
        if (d = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !d)
          continue;
        if (i = [...d].length, s[3] || s[4]) {
          h += i;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + i) % 3)) {
          b += i;
          continue;
        }
        if (h -= i, h > 0)
          continue;
        i = Math.min(i, i + h + b);
        const f = [...s[0]][0].length, k = e.slice(0, o + s.index + f + i);
        if (Math.min(o, i) % 2) {
          const y = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: y,
            tokens: this.lexer.inlineTokens(y)
          };
        }
        const g = k.slice(2, -2);
        return {
          type: "strong",
          raw: k,
          text: g,
          tokens: this.lexer.inlineTokens(g)
        };
      }
    }
  }
  codespan(e) {
    const n = this.rules.inline.code.exec(e);
    if (n) {
      let r = n[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), a = /^ /.test(r) && / $/.test(r);
      return s && a && (r = r.substring(1, r.length - 1)), r = ke(r, !0), {
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
      return n[2] === "@" ? (r = ke(n[1]), s = "mailto:" + r) : (r = ke(n[1]), s = r), {
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
        s = ke(n[0]), a = "mailto:" + s;
      else {
        let o;
        do
          o = n[0], n[0] = ((r = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== n[0]);
        s = ke(n[0]), n[1] === "www." ? a = "http://" + n[0] : a = n[0];
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
      return this.lexer.state.inRawBlock ? r = n[0] : r = ke(n[0]), {
        type: "text",
        raw: n[0],
        text: r
      };
    }
  }
}
const Jo = /^(?: *(?:\n|$))+/, Zo = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Ko = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Gt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Qo = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, sa = /(?:[*+-]|\d{1,9}[.)])/, aa = W(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, sa).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Dr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Xo = /^[^\n]+/, Fr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Vo = W(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", Fr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Yo = W(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, sa).getRegex(), Bn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Wr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, ei = W("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", Wr).replace("tag", Bn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), oa = W(Dr).replace("hr", Gt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Bn).getRegex(), ti = W(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", oa).getRegex(), Hr = {
  blockquote: ti,
  code: Zo,
  def: Vo,
  fences: Ko,
  heading: Qo,
  hr: Gt,
  html: ei,
  lheading: aa,
  list: Yo,
  newline: Jo,
  paragraph: oa,
  table: Ft,
  text: Xo
}, Rs = W("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Gt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Bn).getRegex(), ni = {
  ...Hr,
  table: Rs,
  paragraph: W(Dr).replace("hr", Gt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Rs).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Bn).getRegex()
}, ri = {
  ...Hr,
  html: W(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Wr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ft,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: W(Dr).replace("hr", Gt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", aa).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, ia = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, si = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, la = /^( {2,}|\\)\n(?!\s*$)/, ai = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Jt = "\\p{P}\\p{S}", oi = W(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Jt).getRegex(), ii = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, li = W(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Jt).getRegex(), ci = W("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Jt).getRegex(), di = W("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Jt).getRegex(), pi = W(/\\([punct])/, "gu").replace(/punct/g, Jt).getRegex(), ui = W(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), fi = W(Wr).replace("(?:-->|$)", "-->").getRegex(), mi = W("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", fi).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Nn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, gi = W(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Nn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), ca = W(/^!?\[(label)\]\[(ref)\]/).replace("label", Nn).replace("ref", Fr).getRegex(), da = W(/^!?\[(ref)\](?:\[\])?/).replace("ref", Fr).getRegex(), hi = W("reflink|nolink(?!\\()", "g").replace("reflink", ca).replace("nolink", da).getRegex(), Ur = {
  _backpedal: Ft,
  // only used for GFM url
  anyPunctuation: pi,
  autolink: ui,
  blockSkip: ii,
  br: la,
  code: si,
  del: Ft,
  emStrongLDelim: li,
  emStrongRDelimAst: ci,
  emStrongRDelimUnd: di,
  escape: ia,
  link: gi,
  nolink: da,
  punctuation: oi,
  reflink: ca,
  reflinkSearch: hi,
  tag: mi,
  text: ai,
  url: Ft
}, bi = {
  ...Ur,
  link: W(/^!?\[(label)\]\((.*?)\)/).replace("label", Nn).getRegex(),
  reflink: W(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Nn).getRegex()
}, Lr = {
  ...Ur,
  escape: W(ia).replace("])", "~|])").getRegex(),
  url: W(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, yi = {
  ...Lr,
  br: W(la).replace("{2,}", "*").getRegex(),
  text: W(Lr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, wn = {
  normal: Hr,
  gfm: ni,
  pedantic: ri
}, Rt = {
  normal: Ur,
  gfm: Lr,
  breaks: yi,
  pedantic: bi
};
class Oe {
  constructor(e) {
    H(this, "tokens");
    H(this, "options");
    H(this, "state");
    H(this, "tokenizer");
    H(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || lt, this.options.tokenizer = this.options.tokenizer || new In(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: wn.normal,
      inline: Rt.normal
    };
    this.options.pedantic ? (n.block = wn.pedantic, n.inline = Rt.pedantic) : this.options.gfm && (n.block = wn.gfm, this.options.breaks ? n.inline = Rt.breaks : n.inline = Rt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: wn,
      inline: Rt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Oe(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Oe(n).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (d, i, h) => i + "    ".repeat(h.length));
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
          let h;
          this.options.extensions.startBlock.forEach((b) => {
            h = b.call({ lexer: this }, i), typeof h == "number" && h >= 0 && (d = Math.min(d, h));
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
    let r, s, a, o = e, d, i, h;
    if (this.tokens.links) {
      const b = Object.keys(this.tokens.links);
      if (b.length > 0)
        for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          b.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (d = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, d.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (h = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((b) => (r = b.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
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
        if (r = this.tokenizer.emStrong(e, o, h)) {
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
          let b = 1 / 0;
          const w = e.slice(1);
          let f;
          this.options.extensions.startInline.forEach((k) => {
            f = k.call({ lexer: this }, w), typeof f == "number" && f >= 0 && (b = Math.min(b, f));
          }), b < 1 / 0 && b >= 0 && (a = e.substring(0, b + 1));
        }
        if (r = this.tokenizer.inlineText(a)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (h = r.raw.slice(-1)), i = !0, s = n[n.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
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
    return n;
  }
}
class zn {
  constructor(e) {
    H(this, "options");
    this.options = e || lt;
  }
  code(e, n, r) {
    var a;
    const s = (a = (n || "").match(/^\S*/)) == null ? void 0 : a[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + ke(s) + '">' + (r ? e : ke(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : ke(e, !0)) + `</code></pre>
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
    const s = zs(e);
    if (s === null)
      return r;
    e = s;
    let a = '<a href="' + e + '"';
    return n && (a += ' title="' + n + '"'), a += ">" + r + "</a>", a;
  }
  image(e, n, r) {
    const s = zs(e);
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
class Gr {
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
class Re {
  constructor(e) {
    H(this, "options");
    H(this, "renderer");
    H(this, "textRenderer");
    this.options = e || lt, this.options.renderer = this.options.renderer || new zn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new Gr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new Re(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new Re(n).parseInline(e);
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
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, Wo(this.parseInline(o.tokens, this.textRenderer)));
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
          for (let b = 0; b < o.header.length; b++)
            i += this.renderer.tablecell(this.parseInline(o.header[b].tokens), { header: !0, align: o.align[b] });
          d += this.renderer.tablerow(i);
          let h = "";
          for (let b = 0; b < o.rows.length; b++) {
            const w = o.rows[b];
            i = "";
            for (let f = 0; f < w.length; f++)
              i += this.renderer.tablecell(this.parseInline(w[f].tokens), { header: !1, align: o.align[f] });
            h += this.renderer.tablerow(i);
          }
          r += this.renderer.table(d, h);
          continue;
        }
        case "blockquote": {
          const o = a, d = this.parse(o.tokens);
          r += this.renderer.blockquote(d);
          continue;
        }
        case "list": {
          const o = a, d = o.ordered, i = o.start, h = o.loose;
          let b = "";
          for (let w = 0; w < o.items.length; w++) {
            const f = o.items[w], k = f.checked, g = f.task;
            let y = "";
            if (f.task) {
              const x = this.renderer.checkbox(!!k);
              h ? f.tokens.length > 0 && f.tokens[0].type === "paragraph" ? (f.tokens[0].text = x + " " + f.tokens[0].text, f.tokens[0].tokens && f.tokens[0].tokens.length > 0 && f.tokens[0].tokens[0].type === "text" && (f.tokens[0].tokens[0].text = x + " " + f.tokens[0].tokens[0].text)) : f.tokens.unshift({
                type: "text",
                text: x + " "
              }) : y += x + " ";
            }
            y += this.parse(f.tokens, h), b += this.renderer.listitem(y, g, !!k);
          }
          r += this.renderer.list(b, d, i);
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
class Wt {
  constructor(e) {
    H(this, "options");
    this.options = e || lt;
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
H(Wt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var it, Br, pa;
class xi {
  constructor(...e) {
    Is(this, it);
    H(this, "defaults", jr());
    H(this, "options", this.setOptions);
    H(this, "parse", xn(this, it, Br).call(this, Oe.lex, Re.parse));
    H(this, "parseInline", xn(this, it, Br).call(this, Oe.lexInline, Re.parseInline));
    H(this, "Parser", Re);
    H(this, "Renderer", zn);
    H(this, "TextRenderer", Gr);
    H(this, "Lexer", Oe);
    H(this, "Tokenizer", In);
    H(this, "Hooks", Wt);
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
            for (const h of i)
              r = r.concat(this.walkTokens(h.tokens, n));
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
            const h = d[i].flat(1 / 0);
            r = r.concat(this.walkTokens(h, n));
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
        const a = this.defaults.renderer || new zn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in a))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.renderer[d], h = a[d];
          a[d] = (...b) => {
            let w = i.apply(a, b);
            return w === !1 && (w = h.apply(a, b)), w || "";
          };
        }
        s.renderer = a;
      }
      if (r.tokenizer) {
        const a = this.defaults.tokenizer || new In(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in a))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const d = o, i = r.tokenizer[d], h = a[d];
          a[d] = (...b) => {
            let w = i.apply(a, b);
            return w === !1 && (w = h.apply(a, b)), w;
          };
        }
        s.tokenizer = a;
      }
      if (r.hooks) {
        const a = this.defaults.hooks || new Wt();
        for (const o in r.hooks) {
          if (!(o in a))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.hooks[d], h = a[d];
          Wt.passThroughHooks.has(o) ? a[d] = (b) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(a, b)).then((f) => h.call(a, f));
            const w = i.call(a, b);
            return h.call(a, w);
          } : a[d] = (...b) => {
            let w = i.apply(a, b);
            return w === !1 && (w = h.apply(a, b)), w;
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
    return Oe.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return Re.parse(e, n ?? this.defaults);
  }
}
it = new WeakSet(), Br = function(e, n) {
  return (r, s) => {
    const a = { ...s }, o = { ...this.defaults, ...a };
    this.defaults.async === !0 && a.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const d = xn(this, it, pa).call(this, !!o.silent, !!o.async);
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
      let h = n(i, o);
      return o.hooks && (h = o.hooks.postprocess(h)), h;
    } catch (i) {
      return d(i);
    }
  };
}, pa = function(e, n) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + ke(r.message + "", !0) + "</pre>";
      return n ? Promise.resolve(s) : s;
    }
    if (n)
      return Promise.reject(r);
    throw r;
  };
};
const ot = new xi();
function D(t, e) {
  return ot.parse(t, e);
}
D.options = D.setOptions = function(t) {
  return ot.setOptions(t), D.defaults = ot.defaults, ta(D.defaults), D;
};
D.getDefaults = jr;
D.defaults = lt;
D.use = function(...t) {
  return ot.use(...t), D.defaults = ot.defaults, ta(D.defaults), D;
};
D.walkTokens = function(t, e) {
  return ot.walkTokens(t, e);
};
D.parseInline = ot.parseInline;
D.Parser = Re;
D.parser = Re.parse;
D.Renderer = zn;
D.TextRenderer = Gr;
D.Lexer = Oe;
D.lexer = Oe.lex;
D.Tokenizer = In;
D.Hooks = Wt;
D.parse = D;
D.options;
D.setOptions;
D.use;
D.walkTokens;
D.parseInline;
Re.parse;
Oe.lex;
const ua = "question-modal", Ms = "question_modal", _r = 3, Ls = "gate-v2@2026.10.21";
function Ce() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function ki() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Je() {
  return Ce().antd || {};
}
function wi() {
  return Ce().antdIcons || {};
}
const vi = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function qr(t) {
  const e = wi();
  for (const n of vi) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function _i() {
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
      // US-001: header 弹出层菜单项 hover 高亮（内联样式无法表达 :hover）。
      ".qm-hdr-menu-item:hover{background:var(--app-surface-subtle,rgba(127,127,127,0.08))}",
      // US-002: 模式下拉选项 hover 高亮（同上，:hover 需全局样式）。
      ".qm-mode-opt:hover{background:var(--app-surface-subtle,rgba(127,127,127,0.08))}",
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
      // ── 设置面板移动端适配（2026-11-19 boss 反馈：窄屏显示有问题）──────
      // 问题一：5 个页签在 92vw 容器里被 flex 压缩，页签文字逐字竖排。
      // 问题二：表单行 grid「标签 minmax(0,1fr) + 控件 auto」，窄屏下
      //         标签列被控件列挤到每字一行（「默认答题模式」竖排）。
      // 解法：页签换行排布 + 文字不折行；表单行窄屏整体改单列块布局
      //         （复用 .qm-set-rowblock 既有模式：标签在上、控件占满下排）。
      // 仅 max-width:640px 生效，桌面渲染不变。
      "@media (max-width:640px){",
      ".qm-set-head{padding:14px 16px 4px;gap:8px}",
      ".qm-set-tabs{flex-wrap:wrap;padding:10px 16px 14px;row-gap:8px}",
      ".qm-set-tab{white-space:nowrap;padding:7px 13px}",
      ".qm-set-wrap .qm-set-row{grid-template-columns:minmax(0,1fr);row-gap:6px;align-items:start}",
      ".qm-set-wrap .qm-set-row .qm-set-rowctl{min-width:0;flex:1 1 auto;justify-content:flex-start;",
      "flex-wrap:wrap;overflow-wrap:anywhere;word-break:break-word}",
      // 清理页操作按钮：窄屏下按钮被 flex 挤压导致「扫描」等两字竖排，
      // 文字不折行 + 按钮组允许换行排列。
      ".qm-set-stalebtns{flex-wrap:wrap}",
      ".qm-set-stalebtns .qm-set-btn{white-space:nowrap}",
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
      ".qm-set-staletag{font-size:10px;line-height:1;padding:3px 6px;border-radius:4px;",
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
function L(t) {
  try {
    const e = Ce();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Pn = "", fa = "";
function Jr(t, e) {
  t && (fa = t), e && (Pn = e);
}
function B() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = Ce(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Pn), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function Zt() {
  try {
    const e = Ce();
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
  return fa;
}
globalThis.__qmSessionProbe = Zt;
let Bs = null;
function qi() {
  if (Bs) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (Bs = t.setInterval(() => {
    try {
      fetch(L("/heartbeat"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ session_id: Zt() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
qi();
function Mt() {
  try {
    const t = Ce(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Pn;
}
const Sr = {};
async function Si(t, e, n) {
  if (typeof window > "u" || Sr[t]) return "skipped";
  try {
    const a = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(a) === "1")
      return Sr[t] = !0, "skipped";
    window.localStorage.setItem(a, "1");
  } catch {
  }
  Sr[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((d) => {
      let i = !1;
      const h = (b) => {
        i || (i = !0, d(b));
      };
      try {
        const b = s.requestPermission((w) => h(w));
        b && typeof b.then == "function" && b.then(h).catch(() => h("denied"));
      } catch {
        h("denied");
      }
      setTimeout(() => h(s.permission || "denied"), 8e3);
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
  const e = Ht(t);
  return e && e.session_id ? e.session_id : Zt();
}
const Er = 180, Ei = 20, ma = 6e3, Ti = 60, Ci = 8;
function Ai() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Ii = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function Ps(t) {
  try {
    return String(t || "").replace(Ii, "").length;
  } catch {
    return 0;
  }
}
function js(t) {
  const e = Ai();
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
    r = Ps((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - Ps(n.textContent);
}
function Ni(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function zi(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function Ds(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: ma });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const $i = "qm:v1:analysis:global", Oi = "qm:v1:analysis:", Ri = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Lt(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function Mi(t) {
  if (!t || typeof t != "object") return { ...Ri };
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
function Li() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(Oi) === 0 && n !== $i && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function Bi() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: B() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : Mi(e.prefs);
  } catch {
    return null;
  }
}
async function Zr() {
  try {
    const t = await fetch(L("/question-modal/templates"), { headers: B() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function vn(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(L("/question-modal/survey-action"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Ln()
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
async function Pi(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      L("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: B() }
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
function ji(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, s = 0, a = null, o = 0, d = !1, i = 0, h = 0, b = null;
  const w = (g) => {
    n || b === g || (b = g, e.onStatus(g));
  }, f = () => {
    if (!n)
      try {
        const g = typeof AbortController < "u" ? new AbortController() : null, y = L("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, x = { headers: B() };
        g && (x.signal = g.signal), r = () => {
          try {
            g && g.abort();
          } catch {
          }
        }, fetch(y, x).then(async (A) => {
          const S = ml(A);
          if (!A.ok || !A.body || S) {
            if (A.status === 404 || A.status === 501 || A.status === 405) {
              d = !0, w(!1);
              return;
            }
            throw S && (i += 1), new Error(S ? "blocked" : "HTTP " + A.status);
          }
          s = 0, i = 0, w(!0);
          const _ = A.body.getReader(), q = new TextDecoder();
          let $ = "";
          const E = () => {
            _.read().then(({ done: P, value: O }) => {
              if (P) {
                k();
                return;
              }
              $ += q.decode(O, { stream: !0 });
              let Q;
              for (; (Q = $.indexOf(`

`)) >= 0; ) {
                const we = $.slice(0, Q);
                $ = $.slice(Q + 2), we.split(`
`).forEach((X) => {
                  if (!X.startsWith("data: ")) return;
                  let M = null;
                  try {
                    M = JSON.parse(X.slice(6));
                  } catch {
                    return;
                  }
                  M && (M.kind === "snapshot" ? (o = Math.max(o, parseInt(M.rev || 0, 10) || 0), e.onSnapshot(o, M.state || null)) : M.kind === "change" && (o = Math.max(o, parseInt(M.rev || 0, 10) || 0), e.onChange(M)));
                });
              }
              n || E();
            }).catch(() => {
              k();
            });
          };
          E();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (n || d)
      return;
    if (w(!1), i += 1, h || (h = Date.now()), i >= qa) {
      if (Date.now() - (h || Date.now()) >= Ea) {
        d = !0, w(!1);
        return;
      }
      a = setTimeout(f, Sa);
      return;
    }
    s = Math.min(s + 1, 6);
    const g = Math.min(1e4, 500 * Math.pow(2, s));
    a = setTimeout(f, g);
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
    b = null, e.onStatus(!1);
  };
}
async function Tr(t, e, n) {
  try {
    return (await fetch(L("/question-modal/session-prefs"), {
      method: "POST",
      headers: B(),
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
let ga = null;
async function Ut(t, e, n, r) {
  const s = t || "", a = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  try {
    const o = L(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + a
    ), d = await fetch(o, { headers: B() });
    if (!d.ok) return null;
    const i = await d.json();
    if (!i || i.ok !== !0) return null;
    const h = {
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
    return ga = { chatId: s, at: Date.now(), data: h }, h;
  } catch {
    return null;
  }
}
function ha() {
  ga = null;
}
async function jn() {
  const t = await fetch(
    L("/question-modal/stale-surveys"),
    { headers: B() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Dn(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function Pr(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function Kr(t) {
  const e = await fetch(L("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function Di(t) {
  const e = await fetch(L("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function Fi() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", z();
  const t = Date.now();
  try {
    const e = await jn();
    Dn(e), c.stale.page = 0, c.stale.resPage = 0;
    const n = c.stale.rows.length, r = c.stale.blocking.length, s = c.stale.residual.length, a = c.stale.exceeded.length, o = c.stale.within.length, d = Date.now() - t;
    c.stale.msgKind = "ok";
    const i = Pr(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${s} 条；已超阈值 ${a} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${d}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${d}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.blocking = [], c.stale.residual = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Cr(t, e = "释放") {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const n = await Kr({ tool_call_ids: t }), r = Number(n && n.released) || 0, s = Number(n && n.already) || 0, a = Number(n && n.failed) || 0;
    c.stale.msgKind = a > 0 ? "warn" : "ok", c.stale.msg = a > 0 ? `${e} ${r} 条，${a} 条未成功（见日志）` + (s ? `；${s} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (s ? `；${s} 条此前已处理` : "") : `无需${e}：${s || t.length} 条此前已处理`;
    const o = await jn();
    Dn(o);
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Wi() {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const t = await Kr({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, s = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = s === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${s} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const a = await jn();
    Dn(a);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Hi() {
  const t = (c.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    c.stale.msgKind = "info", c.stale.msg = "当前没有可清理的残留问卷", z();
    return;
  }
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await Kr({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, s = Number(e && e.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `清理 ${n} 条，${s} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const a = await jn();
    Dn(a), c.stale.resPage = 0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Ui(t) {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await Di(t), n = e && e.results || [], r = n.filter((a) => a && a.stopped).length, s = n.filter((a) => a && !a.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (s ? `；${s} 个会话已不存在` : "") : `${s} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function ba(t) {
  try {
    const e = await fetch(L("/question-modal/templates"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ya(t) {
  try {
    const e = await fetch(L("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: B()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function xa() {
  try {
    const t = await fetch(L("/models"), { headers: B() });
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
function Gi(t) {
  if (!t) return "";
  try {
    return String(D.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function j(t, e) {
  try {
    const n = Je().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const he = "__other__";
function Te(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function yt(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Ar(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (n && n.has(s) || !Object.prototype.hasOwnProperty.call(r, s)) return;
    const a = e[s];
    !a || typeof a != "object" || !yt(r[s]) && yt(a) && (r[s] = { ...a });
  }), r;
}
function Fs(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function Ws(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((s) => Number(s && s.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function Ji(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = Te(e), a = Me(e), o = r(s), d = r(a);
  return n.some((i) => {
    const h = r(i);
    return h ? !!(i === s || i === a || h === o || h === d || Math.min(h.length, o.length, d.length) >= 4 && (h.length >= 4 && (o.includes(h) || h.includes(o)) || h.length >= 4 && (d.includes(h) || h.includes(d)))) : !1;
  });
}
function ae(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let ka = !0;
function $n(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (ka ? "第 " + (e + 1) + " 题" : "");
}
function Me(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function Zi(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (a) => {
    a != null && a !== "" && n.add(String(a));
  }, s = t.options || [];
  if (ae(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const d = s.find((i) => Te(i) === String(o));
      d && r(Me(d)), String(o) === he && e.other && r(e.other);
    });
  else {
    r(e.value);
    const a = s.find((o) => Te(o) === String(e.value));
    a && r(Me(a)), String(e.value) === he && e.other && r(e.other);
  }
  return n;
}
function Ki(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const s = String(r);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const a of Array.from(e))
      if (a && (a.indexOf(s) !== -1 || s.indexOf(a) !== -1)) return !0;
    return !1;
  });
}
function wa(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const s = parseInt(n[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === t.trim());
}
function va(t, e, n) {
  const r = e[t], s = r && r.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const a of Object.keys(s)) {
    const o = wa(a, e);
    if (o < 0) continue;
    const d = e[o];
    if (!d) continue;
    if (d.showIf && !va(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !Ki(s[a], Zi(d, i))) return !1;
  }
  return !0;
}
function Fe(t, e) {
  const n = [];
  return t.forEach((r, s) => {
    va(s, t, e) && n.push(s);
  }), n;
}
function Qi(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function _n(t) {
  return Array.isArray(t.questions);
}
function Xi(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function Vi(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((s) => s && (s.text || s.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function Yi(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function el(t) {
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
function Bt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), a = String(e.skip_reason || "").trim();
    return (a ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${a}` : "已跳过本次问卷。") + `

` + An(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((s) => {
    const a = n[s];
    if (!a || typeof a != "object") return;
    const o = wa(s, t), d = o >= 0 ? t[o] : null, i = d ? ae(d) === "single" ? "单选" : ae(d) === "multi" ? "多选" : "问答" : "问答", h = d ? $n(d, o) : s;
    let b = a.value;
    if (Array.isArray(b) && (b = b.join("、")), a.other && (b = (b ? b + "、" : "") + a.other), a.skipped) {
      const w = String(a.skipped_by || ""), f = w === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : w === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${s} [${i}] ${h}${f}`);
    } else
      r.push(`- ${s} [${i}] ${h}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function tl(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      L("/question-modal/resolve") + "?" + n.toString(),
      { headers: B() }
    );
    if (!r.ok) return { kind: "error" };
    const s = await r.json();
    return s && Jr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Pt(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      L("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: B() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function nl(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = B();
    delete n["Content-Type"];
    const r = await fetch(
      L("/console/upload"),
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
const On = "qm:v1:stash_att:", Hs = 25 * 1024 * 1024, Tn = /* @__PURE__ */ new Map(), Cn = /* @__PURE__ */ new Map();
let Rn = null, Mn = 0, Ir = null;
function Us() {
  const t = Mn > 0;
  Cn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function rl() {
  if (Ir) return Ir;
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
    const r = Rn;
    Rn = null, !(!r || !n.length) && await _a(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Ir = t, t;
}
function sl(t, e, n) {
  if (!t) {
    j("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Rn = { callId: t, target: e, key: n };
  const r = rl();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (Rn = null);
}
async function _a(t, e, n, r) {
  Mn += 1, Us();
  const s = [], a = [];
  try {
    for (const d of t) {
      if (d.size && d.size > Hs) {
        a.push(`${d.name}: 文件过大（上限 ${Math.round(Hs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await nl(d);
      i.ok ? s.push(i.att) : a.push(i.error);
    }
  } finally {
    Mn -= 1, Us();
  }
  const o = Tn.get(e);
  if (s.length || a.length) {
    const d = n === "final" ? "final" : "q";
    if (!e) {
      j(
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
    else s.length && al(e, s, d, r);
  }
}
function al(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const s = localStorage.getItem(On + t), a = s ? JSON.parse(s) : [], o = (Array.isArray(a) ? a : []).concat(
        e.map((d) => ({ att: d, target: n, key: r }))
      );
      localStorage.setItem(On + t, JSON.stringify(o));
    } catch {
    }
}
function ol(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(On + t);
    if (!e) return [];
    localStorage.removeItem(On + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function il(t) {
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
function ll(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Nr(t, e) {
  const n = e || re(t), r = Ht(t), s = r && r.request_id ? r.request_id : "";
  if (s)
    try {
      const a = await fetch(L("/question-modal/skip"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ request_id: s, session_id: n || "" })
      });
      if (a.ok) {
        const o = await a.json().catch(() => ({}));
        return ge(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (a.status === 404)
        return ge(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const a = await fetch(
        L("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: B() }
      );
      if (a.ok) {
        const o = await a.json().catch(() => ({})), d = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return ge(t), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + a.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function Gs(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      L("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: B() }
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
async function cl(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      L("/question-modal/pending") + e,
      { headers: B() }
    );
    if (!n.ok) return null;
    const r = await n.json(), s = r && r.items || [];
    if (!Array.isArray(s) || s.length !== 1) return null;
    const a = s[0];
    if (!a || !a.request_id) return null;
    const o = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(a.request_id),
      { headers: B() }
    );
    if (!o.ok) return null;
    const d = await o.json();
    return d && Jr(d.session_id, d.agent_id), d && d.found ? d : null;
  } catch {
    return null;
  }
}
const Fn = "qm:v1:reqid:", dl = 3e4, pl = 45e3, qa = 6, Sa = 6e4, Ea = 15 * 6e4, ul = 700, fl = 8;
function ml(t) {
  try {
    if (String((t.headers && t.headers.get ? t.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const n = Number(t.status || 0);
    return n === 429 || n === 403 || n === 407 || n === 451;
  } catch {
    return !1;
  }
}
function ge(t) {
  if (t)
    try {
      localStorage.removeItem(Fn + t);
    } catch {
    }
}
function gl() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Fn) === 0 && t.push(a);
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
function hl(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Fn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), gl();
    } catch {
    }
}
function Ht(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Fn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (ge(t), null) : n;
  } catch {
    return null;
  }
}
const Qr = "qm:v1:state:";
function Dt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Qr + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Ln() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const Ta = Ln(), Js = "qm:v1:sessionprefs-ping";
function st(t, e) {
  if (t)
    try {
      const r = { ...Dt(t) || {}, ...e, ts: Date.now(), origin: Ta };
      localStorage.setItem(Qr + t, JSON.stringify(r)), bl();
    } catch {
    }
}
function bl() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Qr) === 0 && t.push(a);
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
async function yl(t) {
  try {
    const e = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: B() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && Jr(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function xl(t, e, n, r) {
  const s = ["【用户提交的问卷答案】"], a = new Set(Fe(t, e));
  return t.forEach((o, d) => {
    if (!a.has(d)) return;
    const i = e[`q${d}`];
    if (!i) return;
    let h = i.value;
    if (Array.isArray(h))
      h = h.filter((y) => y !== he).map((y) => {
        const x = (o.options || []).find((N) => Te(N) === String(y));
        return x ? Me(x) : y;
      }).join("、");
    else {
      const y = (o.options || []).find((x) => Te(x) === String(h));
      y && (h = Me(y)), String(i.value) === he && (h = "");
    }
    const b = ae(o) === "single" ? "单选" : ae(o) === "multi" ? "多选" : "问答", w = !!String(h || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), f = String(i.skipped_by || ""), k = i.skipped ? f === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : f === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : w ? h : "（未作答）";
    let g = `- q${d} [${b}] ${k}`;
    i.other && !i.skipped && (g += `（其他：${i.other}）`), i.attachments && i.attachments.length && (g += `（附件：${i.attachments.map((y) => y.file_name).join("、")}）`), s.push(g);
  }), n && s.push(`- 其他意见：${n}`), r && r.length && s.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), s.join(`
`);
}
function kl(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const s = r.value;
    if (Array.isArray(s) ? s.length === 1 && s[0] === he : String(s ?? "") === he) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const wl = ["必须", "务必", "不得为空", "不能为空"], vl = ["可为空", "可留空", "选填", "可选", "非必填"];
function Ca(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || wl.some((n) => e.indexOf(n) !== -1) ? !1 : vl.some((n) => e.indexOf(n) !== -1);
}
function _l(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = Fe(t, n);
  } catch {
    return n;
  }
  return r.forEach((s) => {
    const a = t[s];
    if (!Ca(a)) return;
    const o = `q${s}`, d = n[o];
    if (d && (d.skipped === !0 || yt(d))) return;
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
function An(t) {
  return t.map((e, n) => {
    const r = ae(e) === "single" ? "单选" : ae(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(Me).join("、");
    return `${n + 1}. [${r}] ${$n(e, n)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function zr(t) {
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
  }, h = {
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
    n.map((b, w) => e.createElement(
      "span",
      { key: "att" + w, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: b.file_name
      }, b.file_name + (b.size ? "（" + ll(b.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || d(w);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: r || s,
      style: h,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, s ? "上传中…" : "📎 附件"),
    a ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + a) : null
  );
}
function ql(t) {
  const {
    R: e,
    providers: n,
    modelId: r,
    onChange: s,
    disabled: a,
    open: o,
    onOpenChange: d,
    tab: i,
    onTabChange: h
  } = t, w = Je().Popover, f = [];
  n.forEach((E) => {
    [...E.models || [], ...E.extra_models || []].forEach((P) => {
      f.push({
        providerId: E.id,
        providerName: E.name || E.id,
        modelId: P.id,
        modelName: P.name || P.id,
        free: !!P.is_free
      });
    });
  });
  const k = f.find((E) => `${E.providerId}:${E.modelId}` === r), y = k ? k.modelName : r || "选择模型", x = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", N = {
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
  }, A = f.filter((E) => E.free).length, S = f.length - A, _ = [];
  n.forEach((E) => {
    const P = [...E.models || [], ...E.extra_models || []].map((O) => ({
      providerId: E.id,
      providerName: E.name || E.id,
      modelId: O.id,
      modelName: O.name || O.id,
      free: !!O.is_free
    })).filter((O) => i === "free" ? O.free : !O.free);
    P.length && _.push({ id: E.id, name: E.name || E.id, models: P });
  });
  const q = (E, P) => e.createElement("button", {
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
    onClick: () => h(E)
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
      q("paid", "付费 🟡 " + S),
      q("free", "免费 🟢 " + A)
    ),
    _.length ? e.createElement("div", null, _.map((E, P) => (
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
        E.models.map((O) => {
          const Q = `${O.providerId}:${O.modelId}` === r;
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
                borderLeft: "3px solid " + (Q ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: Q ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                s(`${O.providerId}:${O.modelId}`), d(!1);
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
  return w ? e.createElement(w, {
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
      disabled: a,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: x }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: N,
      disabled: a,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const E = f.find((P) => `${P.providerId}:${P.modelId}` !== r);
        E && s(`${E.providerId}:${E.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: x }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, y),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Sl(t) {
  const { R: e, mode: n, onChange: r, disabled: s, open: a, onOpenChange: o, popRef: d } = t, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, h = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发模型请求：直接采用出题时已标注的推荐",
    manual: "由你手动作答"
  }, b = {
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
  }, w = e.createElement(
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
  ), f = (k) => {
    const g = n === k;
    return e.createElement(
      "button",
      {
        key: k,
        type: "button",
        disabled: s,
        role: "menuitem",
        className: "qm-mode-opt",
        title: h[k],
        onClick: () => {
          r(k), o(!1);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          cursor: s ? "default" : "pointer",
          padding: "7px 9px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: g ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: g ? 600 : 400
        }
      },
      e.createElement("div", { style: { fontSize: 12 } }, i[k]),
      e.createElement("div", {
        style: {
          fontSize: 11,
          marginTop: 1,
          fontWeight: 400,
          color: "var(--app-text-tertiary, inherit)"
        }
      }, h[k])
    );
  };
  return e.createElement(
    "div",
    {
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
        disabled: s,
        style: b,
        title: "运行选择：" + i[n],
        onClick: () => o(!a)
      },
      w,
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis" }
      }, i[n]),
      e.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
      }, "▾")
    ),
    a ? e.createElement(
      "div",
      {
        role: "menu",
        style: {
          position: "absolute",
          top: 30,
          right: 0,
          zIndex: 60,
          width: 220,
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
      f("ai"),
      f("recommend"),
      f("manual")
    ) : null
  );
}
function El(t) {
  const { R: e, templates: n, value: r, onSelect: s, onManage: a } = t;
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
          borderLeft: "3px solid " + (o.id === r ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: o.id === r ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        // 关闭弹层由调用方负责（本列表只负责选择/管理两个入口语义）。
        onClick: () => s(o.id)
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
      onClick: () => a()
    }, "＋ 管理模板…")
  );
}
function Tl(t) {
  const { R: e, open: n, templates: r, value: s, edit: a, onEditChange: o, onClose: d, onSelect: i, onSave: h, onDelete: b } = t;
  if (!n) return null;
  const w = Je(), { Input: f, Modal: k } = w, g = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  k || (g.position = "fixed", g.right = 24, g.top = 80, g.width = 420, g.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", g.zIndex = 1100, g.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const y = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, x = !!a, N = (S, _, q, $) => f && f.TextArea ? e.createElement(f.TextArea, {
    value: S,
    rows: q,
    placeholder: $,
    onChange: (E) => _(E && E.target ? E.target.value : "")
  }) : e.createElement("textarea", {
    value: S,
    rows: q,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (E) => _(E && E.target ? E.target.value : ""),
    onChange: (E) => _(E && E.target ? E.target.value : "")
  }), A = e.createElement(
    "div",
    {
      style: g,
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
        x ? a.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: y, onClick: d }, "关闭")
    ),
    x ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      N(a.name || "", (S) => o({ ...a, name: S }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      N(a.system || "", (S) => o({ ...a, system: S }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      N(a.user || "", (S) => o({ ...a, user: S }), 6, "用户提示词模板"),
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
          onClick: () => h(a)
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
            S.name + (S.builtin ? "（内置）" : "") + (S.id === s ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: y,
            title: "设为本题使用",
            onClick: () => i(S.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => o({
              id: S.id,
              name: S.name,
              system: S.system,
              user: S.user
            })
          }, "编辑"),
          S.builtin ? null : e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => b(S.id)
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
  }, A) : A;
}
function Cl(t) {
  const {
    R: e,
    busy: n,
    result: r,
    error: s,
    mode: a,
    onRun: o,
    onApply: d,
    onCancel: i,
    onRerun: h,
    disabled: b,
    children: w,
    open: f,
    onOpenChange: k
  } = t, y = Je().Popover, x = e.createElement("button", {
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
    title: a === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : a === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      k(!f);
    }
  }, n ? "分析中…" : "查看分析");
  if (!y)
    return e.createElement(
      "div",
      null,
      x,
      r && f ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((_) => _.reasoning).join(`

`))) : null
    );
  const N = !!(r && (r.per_question || []).length), A = (_, q, $) => e.createElement("button", {
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
    onClick: q
  }, _), S = e.createElement(
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
        N && !n ? e.createElement("button", {
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
              (h || o)();
            } catch {
            }
          },
          title: "只重新分析本题（沿用当前模型与选项设置）"
        }, "重新分析") : null,
        N && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: N ? 6 : "auto",
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
      (r.per_question || []).map((_) => e.createElement(
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
          dangerouslySetInnerHTML: { __html: Gi(_.reasoning || "") }
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
      A("开始分析", () => {
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
    }, w)
  );
  return e.createElement(y, {
    content: S,
    trigger: "click",
    open: f,
    onOpenChange: k,
    placement: "bottomRight"
  }, x);
}
function Al(t) {
  const e = Ce().React, n = Je(), { Input: r, Button: s } = n, a = r.TextArea, o = t.data || {}, d = Qi(o), i = Xi(o), h = Vi(o), b = Yi(h), w = b ? "" : h, f = d.questions || [], k = d.title || "问卷", g = Dt(i), [y, x] = e.useState(
    () => !!(g && g.answered) || !!w || b
  ), [N, A] = e.useState(""), [S, _] = e.useState(() => {
    const l = Ht(i);
    return l && l.request_id ? l.request_id : g && typeof g.reqId == "string" ? g.reqId : "";
  }), [q, $] = e.useState(
    () => g && typeof g.visStep == "number" && g.visStep >= 0 ? g.visStep : 0
  ), [E, P] = e.useState(
    () => g && typeof g.slowAt == "number" ? g.slowAt : 0
  ), [O, Q] = e.useState(
    () => g && typeof g.slowStep == "number" ? g.slowStep : -1
  ), [we, X] = e.useState(
    () => !!(g && g.slowFired === !0)
  ), [M, Z] = e.useState(() => {
    const l = {};
    f.forEach((m, u) => {
      l[`q${u}`] = { type: ae(m), value: ae(m) === "multi" ? [] : "", other: "" };
    });
    const p = g && g.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((m) => {
      l[m] && (l[m] = { ...l[m], ...p[m] });
    }), l;
  }), [We, Kt] = e.useState(
    () => g && typeof g.finalOther == "string" ? g.finalOther : ""
  ), [F, Ae] = e.useState(!1), [I, ve] = e.useState(
    () => g && typeof g.releasedNote == "string" ? g.releasedNote : ""
  ), [oe, G] = e.useState(
    () => g && typeof g.localResult == "string" ? g.localResult : ""
  ), [J, be] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(g && g.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(w || "")
  ), [K, Ne] = e.useState(
    () => (g && typeof g.skipReason == "string" ? g.skipReason : "") || el(w || "")
  ), [ie, ye] = e.useState(
    () => g && Array.isArray(g.finalOtherAtt) ? g.finalOtherAtt : []
  ), [pe, Le] = e.useState(
    () => !!(g && g.expanded)
  ), [Ze, ct] = e.useState(!1), xt = e.useRef(0), [_e, Oa] = e.useState(
    () => g && typeof g.deadReason == "string" ? g.deadReason : ""
  ), [Ke, kt] = e.useState(
    () => g && typeof g.gateBlocked == "string" ? g.gateBlocked : ""
  ), [dt, Wn] = e.useState(
    () => g && typeof g.submittedAt == "number" ? g.submittedAt : 0
  ), [Hn, Un] = e.useState(
    () => !!(g && g.pastSoft === !0)
  ), [wt, Qt] = e.useState(
    () => !!(g && g.waitRetired === !0)
  ), vt = e.useRef(
    !!(g && typeof g.submittedAt == "number" && g.submittedAt > 0 && Date.now() - g.submittedAt < Er * 1e3)
  ), Qe = e.useRef(!1), Xt = e.useRef(!!(g && g.pastSoft === !0)), [Gn, Ra] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), Ma = e.useRef(Gn), Yr = (l) => {
    Ma.current = l, Ra(l);
  }, ue = (l, p) => {
    const m = Gn[l];
    return m ?? p;
  };
  ka = !!ue("fallback_title", !0);
  const es = Math.max(30, Number(ue("wait_hint_sec", Er)) || Er), La = "manual", [Y, Vt] = e.useState(La), [ts, Jn] = e.useState(""), [Kl, Ba] = e.useState(!1), [Zn, Kn] = e.useState(!1), [Qn, Xn] = e.useState(!1), [Pa, ja] = e.useState([]), [ns, Vn] = e.useState(!1), [Yt, pt] = e.useState(null), [Da, Xe] = e.useState(""), [Fa, Wa] = e.useState(!1), [en, Be] = e.useState(!1), [tn, _t] = e.useState(!1), nn = e.useRef(null);
  e.useEffect(() => {
    if (!en && !tn) return;
    const l = (p) => {
      const m = nn.current;
      m && p && p.target && m.contains(p.target) || (Be(!1), _t(!1));
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [en, tn]);
  const [Yn, qt] = e.useState(!1), rs = e.useRef(null);
  e.useEffect(() => {
    if (!Yn) return;
    const l = (p) => {
      const m = rs.current;
      m && p && p.target && m.contains(p.target) || qt(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [Yn]);
  const [Ha, Ua] = e.useState(!1), [Ga, Ja] = e.useState("paid"), He = e.useRef({}), Pe = e.useRef({}), ut = e.useRef(0), St = e.useRef(null), [Za, ft] = e.useState(0), [er, tr] = e.useState([]), [Ue, rn] = e.useState(""), je = e.useRef(Ue);
  je.current = Ue;
  const [nr, Ve] = e.useState(!1), [Ka, ss] = e.useState(!1), [Qa, rr] = e.useState(null);
  e.useEffect(() => {
    if (!nr) return;
    const l = (p) => {
      const m = nn.current;
      m && p && p.target && m.contains(p.target) || Ve(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [nr]);
  const [sr, Ge] = e.useState(!1);
  e.useEffect(() => {
    if (!sr) return;
    const l = (p) => {
      const m = nn.current;
      m && p && p.target && m.contains(p.target) || Ge(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [sr]);
  const [ze, as] = e.useState(
    () => !!(g && g.autoPaused)
  ), Xa = e.useRef(ze);
  Xa.current = ze;
  const mt = e.useRef(!1), ar = e.useRef(0), sn = e.useRef({}), [Va, Ya] = e.useState(0), Et = e.useRef(/* @__PURE__ */ new Set()), Tt = (l) => {
    l && Et.current.add(l);
  }, an = e.useRef({}), [eo, on] = e.useState(0), Ye = e.useRef({}), [Ct, to] = e.useState(!1), no = e.useRef(!1);
  no.current = Ct, e.useRef(!1);
  const ro = async () => {
    try {
      const l = await Ut(
        "",
        !0,
        re(i),
        Mt()
      );
      if (!l || !l.config) return;
      const p = l.config;
      Yr(p), p.mode !== void 0 && Vt(Lt(p.mode)), typeof p.model_id == "string" && p.model_id && Jn(p.model_id), typeof p.with_context == "boolean" && Kn(p.with_context), typeof p.parallel == "boolean" && Xn(p.parallel), ft((m) => m + 1);
    } catch {
    }
  }, os = e.useRef(!1), ln = (l) => {
    if (l.mode !== void 0) {
      Vt(l.mode), Tr(
        { mode: l.mode },
        re(i),
        Mt()
      );
      try {
        localStorage.setItem(Js, Ta + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    l.modelId !== void 0 && (p.model_id = l.modelId), l.withContext !== void 0 && (p.with_context = l.withContext), l.parallel !== void 0 && (p.parallel = l.parallel), Object.keys(p).length && (l.modelId !== void 0 && Jn(l.modelId), l.withContext !== void 0 && Kn(l.withContext), l.parallel !== void 0 && Xn(l.parallel), Tr(p, re(i), Mt()));
  }, is = (l) => {
    !l || l === Ue || (rn(l), je.current = l, st(i, { templateId: l }), Tr(
      { template_id: l },
      re(i),
      Mt()
    ), pt(null), He.current = {}, Pe.current = {}, ft((p) => p + 1));
  }, so = async (l) => {
    const p = await ba({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!p.ok) {
      j("error", p.error || "保存失败");
      return;
    }
    tr(p.items || []), rr(null), j("success", "模板已保存");
  }, ao = async (l) => {
    const p = await ya(l);
    if (!p.ok) {
      j("warning", p.error || "删除失败");
      return;
    }
    tr(p.items || []);
    const m = (p.items || []).map((u) => u.id);
    if (m.indexOf(je.current) === -1) {
      const u = m[0] || "";
      rn(u), je.current = u, st(i, { templateId: u });
    }
    j("success", "模板已删除");
  };
  e.useEffect(() => {
    if (y) return;
    const l = (p) => {
      try {
        String(p && p.key || "") === Js && ro();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [y, i]), e.useEffect(() => {
    if (y) return;
    let l = !0;
    return Li(), (async () => {
      const [p, m, u, v] = await Promise.all([
        xa(),
        Bi(),
        Zr(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Ut(
          "",
          !0,
          re(i),
          Mt()
        )
      ]);
      if (!l) return;
      if (ja(p), tr(u.items), v && v.config) {
        const T = v.config;
        Yr(T), T.mode !== void 0 && Vt(Lt(T.mode)), typeof T.model_id == "string" && T.model_id && Jn(T.model_id), typeof T.with_context == "boolean" && Kn(T.with_context), typeof T.parallel == "boolean" && Xn(T.parallel), typeof T.template_id == "string" && T.template_id && (rn(T.template_id), je.current = T.template_id);
      }
      const C = u.items.map((T) => T.id);
      if (!je.current || C.indexOf(je.current) === -1) {
        const T = u.defaultId || C[0] || "";
        T && (rn(T), je.current = T);
      }
      if (v && v.config) {
        const T = v.config;
        Ba(T.__follow_active__ === !0);
      }
      os.current = !0, ft((T) => T + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    ut.current = q;
  }, [q]);
  const or = async (l) => {
    if (ns) return;
    const p = q;
    Vn(!0), Xe("");
    const m = typeof AbortController < "u" ? new AbortController() : null;
    St.current = m;
    try {
      const u = await fetch(L("/question-modal/analyze"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          request_id: S,
          tool_call_id: i,
          session_id: re(i),
          title: k,
          questions: f,
          model_id: ts,
          mode: l,
          with_context: Zn,
          parallel: Qn,
          question_index: p,
          answers: M,
          template_id: je.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(ue("model_timeout_sec", 120)) || 120
        }),
        signal: m ? m.signal : void 0
      }), v = await u.json().catch(() => ({})), C = v && v.analysis || null, T = C && C.error || v && v.error || "";
      v && v.cancelled || C && C.cancelled ? Xe("已终止分析。") : !u.ok || !v || v.ok === !1 || C && C.ok === !1 ? Xe(T || "分析失败（服务返回 " + u.status + "）") : C && (He.current[p] = C, Pe.current[p] = !0, ut.current === p && pt(C), j("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (u) {
      St.current === m && m && m.signal.aborted || u && u.name === "AbortError" ? Xe("已终止分析。") : Xe("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      St.current === m && (St.current = null), Vn(!1), Ye.current[p] = !0, on((u) => u + 1);
    }
  }, oo = () => {
    const l = q;
    delete He.current[l], pt(null), Xe(""), or("manual");
  }, gt = (l) => {
    var m;
    const p = l !== void 0 ? l : ut.current;
    try {
      fetch(L("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: S,
          question_index: p
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      vn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (m = St.current) == null || m.abort();
    } catch {
    }
    Vn(!1);
  }, io = () => {
    gt(), Xe("已终止分析。");
  }, lo = () => {
    ze ? (an.current = {}, Ye.current = {}, Pe.current = {}, mt.current = !1, as(!1), ft((l) => l + 1), j("info", "已恢复自动答题")) : (gt(), as(!0), j("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (y) return;
    const l = He.current[q];
    pt(l || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + q;
    let m = !0;
    return fetch(L("/question-modal/analysis") + p, { headers: B() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !m || !u || !u.found || !u.analysis || (He.current[q] = u.analysis, ut.current === q && pt(u.analysis));
    }).catch(() => {
    }), () => {
      m = !1;
    };
  }, [i, q]), e.useEffect(() => {
    y || os.current && Y === "ai" && Ct && (!_n(d) || !f.length || Pe.current[q] || F || (Pe.current[q] = !0, or("auto")));
  }, [
    y,
    Y,
    i,
    Za,
    Zn,
    Qn,
    f,
    q,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    Ct
  ]);
  const co = () => {
    const l = Yt && Yt.per_question || [];
    if (!l.length) return;
    if (!l.some((m) => m.type === "multi" ? String(m.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(m.choice || "").trim().length > 0)) {
      j("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Z((m) => {
      const u = { ...m };
      return l.forEach((v) => {
        const C = `q${v.index}`;
        Tt(C);
        const T = u[C] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const te = String(v.choice || "").split(/[、,，]/).map((V) => V.trim()).filter(Boolean);
          u[C] = { ...T, value: te };
        } else
          u[C] = { ...T, value: v.choice || T.value };
      }), u;
    }), j("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, et = (l, p, m = !1) => {
    gt(), Oa(l), be(!0), G(p), ct(!1), x(!0), ge(i), m && st(i, { backendReleased: !0 });
  }, po = async (l, p) => {
    const m = await Nr(i, re(i));
    return m.ok ? (et(l, p, m.released), !0) : (ct(!0), lr(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const l = (p = Dt(i)) == null ? void 0 : p.answers;
    st(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: S,
      visStep: q,
      answers: Ar(M, l, Et.current),
      finalOther: We,
      finalOtherAtt: ie,
      answered: y,
      skippedAll: J,
      expanded: pe,
      localResult: oe,
      submittedAt: dt,
      skipReason: K,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Hn,
      waitRetired: wt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: E,
      slowStep: O,
      slowFired: we,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: _e,
      gateBlocked: Ke,
      releasedNote: I,
      autoPaused: ze,
      templateId: Ue
    });
  }, [
    i,
    S,
    q,
    M,
    We,
    ie,
    y,
    J,
    pe,
    oe,
    dt,
    K,
    Hn,
    wt,
    E,
    O,
    we,
    _e,
    ze,
    Ue,
    Ke,
    I
  ]), e.useEffect(() => {
    if (!y || !dt || wt || !vt.current) return;
    let l = 0, p = !1, m = js(i);
    const u = () => {
      if (p) return;
      const v = Math.floor((Date.now() - dt) / 1e3);
      if (v >= es) {
        Qe.current = !0, Qt(!0);
        return;
      }
      if (!Qe.current) {
        const C = js(i);
        C >= 0 && (m < 0 ? m = C : C - m >= Ci && (Qe.current = !0));
      }
      if (!Qe.current && v >= Ei && !Xt.current && (Xt.current = !0, Un(!0)), Qe.current) {
        l = setTimeout(
          () => {
            p || Qt(!0);
          },
          Math.max(1e3, (es - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        p || Ds(u);
      }, ma);
    };
    return Ds(u), () => {
      p = !0, clearTimeout(l);
    };
  }, [y, dt, wt]);
  const [ir, lr] = e.useState(!1), [cr, ls] = e.useState(""), cs = (l, p, m) => {
    l.length && (p === "final" ? ye((u) => u.concat(l)) : Z((u) => {
      const v = m || `q${q}`;
      Tt(v);
      const C = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...C, attachments: (C.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, C, T) => {
      cs(u, v, C), T && T.length ? ls(T.join("；")) : ls("");
    }, p = (u) => lr(u);
    Tn.set(i, l), Cn.set(i, p);
    const m = ol(i);
    return m.length && m.forEach((u) => cs([u.att], u.target, u.key)), lr(Mn > 0), () => {
      Tn.get(i) === l && Tn.delete(i), Cn.get(i) === p && Cn.delete(i);
    };
  }, [i, q]);
  const dr = (l, p) => sl(i, l, p), pr = (l, p, m) => {
    const u = il(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      _a(u, i, p, m);
    }
  };
  e.useEffect(() => {
    if (!b || N) return;
    let l = !0;
    return Pt(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && be(!0);
      const m = String(p.skip_reason || "").trim();
      m && Ne((u) => u || m), A(Bt(f, p));
    }), () => {
      l = !1;
    };
  }, [b, i, N]), e.useEffect(() => {
    if (y || !i || w) return;
    let l = !0;
    return Pt(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && be(!0);
      const m = String(p.skip_reason || "").trim();
      m && Ne((u) => u || m), A((u) => u || Bt(f, p)), G(Bt(f, p)), x(!0), ge(i);
    }), () => {
      l = !1;
    };
  }, [i, y, w]), e.useEffect(() => {
    if (y) return;
    let l = !0, p = 0, m = 0, u = 0, v = !1, C = !1, T = 0, te = 0;
    xt.current || (xt.current = Date.now());
    let V = !!Ht(i), Se = !1;
    const xe = (R) => {
      !l || !R || !R.request_id || (V = !0, m = 0, u = 0, v = !1, _(R.request_id), ct(!1), T && (clearTimeout(T), T = 0), hl(
        i,
        R.request_id,
        R.session_id || Zt(),
        R.agent_id
      ));
    }, le = (R) => {
      l && (T && (clearTimeout(T), T = 0), te && (clearTimeout(te), te = 0), po(
        R,
        R === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, $t = Ht(i), rt = async () => {
      if (!$t) return !1;
      const R = await yl($t.request_id);
      if (!l) return !0;
      if (R.kind === "found") {
        const fe = R.data;
        return fe.tool_call_id && i && fe.tool_call_id !== i ? (ge(i), !1) : (xe(fe), !0);
      }
      return R.kind === "orphan" ? (le("orphan"), !0) : (R.kind === "absent" && ge(i), !1);
    }, Ee = (R = !1) => {
      if (l) {
        if (p += 1, R || (m += 1, u || (u = Date.now())), R) {
          if (!Se) {
            Se = !0, Pt(i).then((ce) => {
              if (l) {
                if (ce) {
                  ce.kind === "skipped" && !ce.answers && be(!0);
                  const Ot = String(ce.skip_reason || "").trim();
                  Ot && Ne((vr) => vr || Ot), A(Bt(f, ce)), G(Bt(f, ce)), x(!0), ge(i);
                  return;
                }
                Ee(!0);
              }
            });
            return;
          }
          if (V) {
            le("gone");
            return;
          }
          const fe = Date.now() - (xt.current || Date.now());
          if (p >= 12 && fe >= pl) {
            le("gone");
            return;
          }
        }
        if (m >= qa) {
          if (Date.now() - (u || Date.now()) >= Ea) {
            if (v = !0, !C) {
              C = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, m = 0, u = 0, p = 0, ne();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          T = setTimeout(ne, Sa);
          return;
        }
        T = setTimeout(ne, p < fl ? ul : 5e3);
      }
    }, Ie = () => {
      tl(i, re(i)).then((R) => {
        if (l) {
          if (R.kind === "found") {
            xe(R.data);
            return;
          }
          if (R.kind === "orphan") {
            le("orphan");
            return;
          }
          if (R.kind === "error") {
            Ee(!1);
            return;
          }
          cl(re(i)).then((fe) => {
            if (l) {
              if (fe) {
                if (fe.tool_call_id && i && fe.tool_call_id !== i) {
                  Pt(i).then((ce) => {
                    if (l) {
                      if (ce) {
                        x(!0), ge(i);
                        return;
                      }
                      Ee(!0);
                    }
                  });
                  return;
                }
                xe(fe);
                return;
              }
              Pt(i).then((ce) => {
                if (l) {
                  if (ce) {
                    ce.kind === "skipped" && !ce.answers && be(!0);
                    const Ot = String(ce.skip_reason || "").trim();
                    Ot && Ne((vr) => vr || Ot), x(!0), ge(i);
                    return;
                  }
                  Ee(!0);
                }
              });
            }
          });
        }
      });
    }, ne = () => {
      if (l) {
        if (!$t) {
          Ie();
          return;
        }
        rt().then((R) => {
          !l || R || Ie();
        });
      }
    };
    return te = setTimeout(() => {
      l && ct(!0);
    }, dl), ne(), () => {
      l = !1, T && clearTimeout(T), te && clearTimeout(te);
    };
  }, [y, i]);
  const ds = async () => {
    Ae(!0);
    try {
      const l = re(i);
      let p = await Nr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await Gs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const u = p.reason === "host-stop";
        et(
          p.reason === "orphan" ? "orphan" : "",
          p.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), j(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        et(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
    } catch (l) {
      j("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ae(!1);
    }
  }, ps = async () => {
    Ae(!0);
    try {
      const l = re(i);
      let p = await Nr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await Gs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        ve(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), j("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const u = p.reason === "host-stop";
        ve(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), j("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        ve("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), j("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      j("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ae(!1);
    }
  }, cn = Fe(f, M), tt = cn.length, $e = q >= tt, ee = $e ? -1 : cn[q], At = $e ? tt : q;
  e.useEffect(() => {
    if (Lt(ue("mode", "manual")) !== "manual") return;
    let p = String(ue("notify_channel_pc", "") || "");
    if (!p) {
      const u = String(ue("notify_channel", "off") || "off"), v = !!ue("notify_manual_mode", !1);
      p = u === "browser" || (u === "off" || !u) && v ? "browser" : u;
    }
    if (p !== "browser" || y || J || _e || !_n(d) || !f.length) return;
    const m = Fe(f, M).filter((u) => !yt(M[`q${u}`])).length;
    Si(i, k, m);
  }, [Gn, y, J, _e, At]);
  const dn = Math.max(0, Number(ue("slow_question_sec", Ti)) || 0) * 1e3, uo = Math.round(dn / 1e3);
  e.useEffect(() => {
    if (y || J || _e || dn <= 0) return;
    if (O !== At) {
      Q(At), P(Date.now()), X(!1);
      return;
    }
    if (!E) {
      P(Date.now());
      return;
    }
    if (we) return;
    const l = E + dn - Date.now();
    if (l <= 0) {
      X(!0);
      return;
    }
    let p = !1;
    const m = setTimeout(() => {
      p || X(!0);
    }, l);
    return () => {
      p = !0, clearTimeout(m);
    };
  }, [y, J, _e, At, O, E, we, dn]);
  const qe = ee >= 0 ? f[ee] : null, ht = `q${ee}`, U = ee >= 0 && M[ht] || { type: ae(qe), value: ae(qe) === "multi" ? [] : "", other: "" }, bt = (l) => {
    var u;
    Ke && kt(""), ee >= 0 && Tt(`q${ee}`);
    const p = { ...M, [ht]: { ...l, skipped: !1 } }, m = Fe(f, p);
    f.forEach((v, C) => {
      m.indexOf(C) === -1 && delete p[`q${C}`];
    }), st(i, {
      answers: Ar(p, (u = Dt(i)) == null ? void 0 : u.answers, Et.current)
    }), Z(p);
  };
  e.useEffect(() => {
    q > tt && $(tt);
  }, [tt, q]);
  const ur = async (l, p) => {
    const m = await fetch(L(l), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(p)
    }), u = await m.json().catch(() => ({}));
    if (!m.ok) {
      const v = new Error(u && u.detail || "HTTP " + m.status);
      throw v.status = m.status, v;
    }
    return u;
  }, fr = () => {
    var l;
    return kl(Ar(
      _l(f, M),
      (l = Dt(i)) == null ? void 0 : l.answers,
      Et.current
    ));
  }, fo = () => !!ue("gate_unsaved", !0), mo = (l) => Ca(l), us = (l, p) => {
    if (!fo()) return [];
    const m = new Set(Fe(f, l)), u = (C) => m.has(C) && !yt(l[`q${C}`]) && !mo(f[C]), v = [];
    return typeof p == "number" ? (u(p) && v.push(p + 1), v) : (f.forEach((C, T) => {
      u(T) && v.push(T + 1);
    }), v);
  }, fs = (l, p, m) => {
    const u = "第 " + l.join("、") + " 题", v = m === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    kt("⛔ " + u + "尚未选择。" + v);
    const C = Fe(f, p).length;
    ur("/question-modal/gate-block", {
      request_id: S,
      tool_call_id: i,
      session_id: re(i),
      missing: l,
      answered: C - l.length,
      total: C,
      bundle: Ls
    }).catch(() => {
    });
  }, mr = async (l, p = !1) => {
    if (!S)
      return j("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const m = fr();
    if (!p) {
      const u = us(m);
      if (u.length)
        return fs(u, m, "提交"), "blocked";
      kt("");
    }
    Ae(!0);
    try {
      const u = await ur("/question-modal/answer", {
        request_id: S,
        session_id: re(i),
        answers: m,
        other: We,
        attachments: ie
      });
      return u && u.orphan ? (fetch(
        L("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(re(i)),
        { method: "POST", headers: B() }
      ).catch(() => {
      }), et(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "sent") : (ge(i), G(xl(f, m, We, ie)), Wn(Date.now()), Un(!1), Qt(!1), Qe.current = !1, Xt.current = !1, vt.current = !0, x(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (et(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "blocked") : (j("error", "提交失败: " + u.message), p ? (mt.current = !1, ar.current += 1, ar.current >= _r && j(
        "warning",
        "自动提交连续失败 " + _r + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), on((v) => v + 1), "not-ready") : "blocked");
    } finally {
      Ae(!1);
    }
  }, go = () => {
    ee < 0 || (Ke && kt(""), gt(ut.current), Pe.current[ut.current] = !0, Tt(`q${ee}`), Z((l) => {
      const p = { ...l };
      p[`q${ee}`] = {
        type: (l[`q${ee}`] || {}).type || ae(qe),
        value: ((l[`q${ee}`] || {}).type || ae(qe)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const m = Fe(f, p);
      return f.forEach((u, v) => {
        m.indexOf(v) === -1 && delete p[`q${v}`];
      }), p;
    }), $((l) => l + 1));
  }, ho = () => {
    if ($e) {
      mr();
      return;
    }
    const l = fr(), p = us(l, ee);
    if (p.length) {
      fs(p, l, "下一步");
      return;
    }
    Ke && kt(""), $((m) => m + 1);
  }, bo = async () => {
    if (!S) {
      j("warning", "问卷尚未就绪，请稍候");
      return;
    }
    gt(), Ae(!0);
    try {
      const l = await ur("/question-modal/skip", {
        request_id: S,
        session_id: re(i)
      });
      if (l && l.orphan) {
        et(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
        return;
      }
      j("info", "已跳过问卷"), ge(i), be(!0), Ne("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), G("用户跳过了本次问卷。"), Wn(Date.now()), Un(!1), Qt(!1), Qe.current = !1, Xt.current = !1, vt.current = !0, x(!0);
    } catch (l) {
      if (l && l.status === 404) {
        et(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
        return;
      }
      j("error", "跳过失败: " + l.message);
    } finally {
      Ae(!1);
    }
  };
  e.useEffect(() => {
    if (y || Y !== "ai" && Y !== "recommend" || ze || (Y === "recommend" || Y === "ai") && !Ct || !_n(d) || !f.length || F) return;
    if ($e) {
      if (mt.current || ar.current >= _r) return;
      const V = fr();
      if (!cn.every(
        (xe, le) => !!Ye.current[le] || yt(V[`q${xe}`])
      ) || !S) return;
      mt.current = !0, mr(void 0, !0).then((xe) => {
        xe === "not-ready" && (mt.current = !1);
      });
      return;
    }
    const l = q;
    if (an.current[l] || Y === "ai" && !Ye.current[l]) return;
    const p = cn[l], m = f[p], u = ae(m), v = Fs(m), C = Ws(He.current[l], p);
    if (Y === "ai" && !Ye.current[l]) return;
    an.current[l] = !0;
    const T = v.length ? v.join("、") : C, te = !!T;
    Tt(`q${p}`), te || (sn.current[p] = !0, Ya((V) => V + 1), j("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), Z((V) => {
      const Se = { ...V }, xe = `q${p}`, le = Se[xe] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!te)
        Se[xe] = {
          ...le,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const rt = m.options || [], Ee = (ne) => String(ne).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = T.split(/[、,，]/).map((ne) => Ee(ne)).filter(Boolean).map((ne) => {
          const R = rt.find((fe) => Te(fe) === ne || Me(fe) === ne);
          return R ? Te(R) : ne;
        });
        Se[xe] = {
          ...le,
          type: u,
          value: Ie,
          other: Ie.length === 1 && Ie[0] === he ? le.other : "",
          attachments: Ie.length === 1 && Ie[0] === he ? le.attachments : []
        };
      } else if (u === "single") {
        const rt = m.options || [], Ee = (R) => String(R).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = rt.find((R) => Te(R) === T || Me(R) === T) || rt.find((R) => Te(R) === Ee(T) || Me(R) === Ee(T)), ne = Ie ? Te(Ie) : T;
        Se[xe] = {
          ...le,
          type: u,
          value: ne,
          other: String(ne) === he ? le.other : "",
          attachments: String(ne) === he ? le.attachments : []
        };
      } else
        Se[xe] = { ...le, type: u, value: T };
      const $t = Fe(f, Se);
      return f.forEach((rt, Ee) => {
        $t.indexOf(Ee) === -1 && delete Se[`q${Ee}`];
      }), Se;
    }), Pe.current[l] = !0, Ye.current[l] = !0, $((V) => V + 1), on((V) => V + 1);
  }, [
    y,
    Y,
    ze,
    F,
    i,
    q,
    eo,
    tt,
    d,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    S,
    Ct
  ]);
  const It = e.useRef(!1), nt = e.useRef(0), Nt = e.useRef(!1), De = e.useRef({});
  e.useEffect(() => {
    if (y || !i) return;
    let l = !0;
    const p = (u) => {
      if (!(!l || !u)) {
        It.current = !0, Nt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!f || f.length), u.answers && typeof u.answers == "object" && (Z((C) => {
            const T = { ...C };
            return Object.keys(u.answers).forEach((te) => {
              const V = u.answers[te];
              !V || typeof V != "object" || Et.current.has(te) || (T[te] = {
                ...T[te] || { type: "single", value: "", other: "" },
                ...V
              });
            }), T;
          }), st(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && $(u.cursor), typeof u.mode == "string" && u.mode) {
            const C = Lt(u.mode);
            Vt((T) => T === C ? T : C);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((C) => {
            const T = parseInt(C, 10);
            !isNaN(T) && u.per_question[C] && (He.current[T] = u.per_question[C]);
          }), u.status === "submitted" && (Wn((C) => C || Date.now()), u.released && st(i, { backendReleased: !0 }), x(!0), ge(i));
          const v = String(u.skip_reason || "").trim();
          v && Ne((C) => C || v), typeof u.mode == "string" && u.mode && (De.current.mode = Lt(u.mode)), Object.keys(u.answers || {}).forEach((C) => {
            De.current["a:" + C] = JSON.stringify(u.answers[C] || {});
          }), typeof u.cursor == "number" && (De.current.cursor = "c:" + u.cursor), Nt.current = !0, on((C) => C + 1);
        } finally {
          setTimeout(() => {
            It.current = !1;
          }, 0);
        }
      }
    };
    Pi(i).then((u) => {
      !l || !u || !u.found || !u.state || (nt.current = Math.max(nt.current, u.rev), p(u.state));
    });
    const m = ji(i, {
      onSnapshot: (u, v) => {
        nt.current = Math.max(nt.current, u), v && p(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= nt.current && u.origin !== Ln() || (nt.current = Math.max(nt.current, v), !(u.origin && u.origin === Ln()) && p(u.state));
      },
      onStatus: (u) => {
        l && to((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, m();
    };
  }, [y, i]), e.useEffect(() => {
    y || !i || It.current || Nt.current && Object.keys(M || {}).forEach((l) => {
      const p = JSON.stringify(M[l] || {});
      De.current["a:" + l] !== p && (De.current["a:" + l] = p, vn(
        i,
        "set_answer",
        { key: l, answer: M[l] }
      ));
    });
  }, [y, i, JSON.stringify(M)]), e.useEffect(() => {
    if (y || !i || It.current || !Nt.current) return;
    const l = "c:" + q;
    De.current.cursor !== l && (De.current.cursor = l, vn(i, "goto", { cursor: q }));
  }, [y, i, q]), e.useEffect(() => {
    y || !i || It.current || Nt.current && De.current.mode !== Y && (De.current.mode = Y, vn(i, "set_mode", { mode: Y }));
  }, [y, i, Y]);
  const pn = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, gr = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, hr = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, un = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, br = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, ms = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, yr = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, yo = { display: "flex", flexDirection: "column", gap: 8 }, fn = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, mn = {
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
  }, zt = {
    ...mn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, xo = {
    ...mn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, xr = {
    ...mn,
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
  }, gs = {
    // Restored to the original look (user asked for options to stay as-is).
    ...xr,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, hs = {
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
  }, ko = { height: 32, fontSize: 13, borderRadius: 8 }, bs = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, ys = (l) => {
    const p = Te(l);
    return U.type === "multi" ? Array.isArray(U.value) && U.value.indexOf(p) !== -1 : U.value === p;
  }, xs = ys(he), ks = (l) => {
    if (y || F) return;
    const p = Te(l);
    if (U.type === "multi") {
      const m = Array.isArray(U.value) ? U.value.slice() : [], u = m.indexOf(p);
      u === -1 ? m.push(p) : m.splice(u, 1);
      const v = m.length === 1 && m[0] === he;
      bt({
        ...U,
        value: m,
        other: v ? U.other : "",
        attachments: v ? U.attachments : []
      });
    } else {
      const m = p === he;
      bt({
        ...U,
        value: p,
        other: m ? U.other : "",
        attachments: m ? U.attachments : []
      });
    }
  }, wo = !!ue("show_recommend_badge", !0), ws = ue("badge_position", "left") === "right", vo = ue("badge_style", "rect") === "round", vs = (l) => l && wo ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: vo ? { ...hs, borderRadius: 999 } : hs
  }, "AI 推荐") : null, _o = !!ue("auto_number_options", !0), qo = !!ue("highlight_recommended", !1), So = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, _s = (l, p, m, u, v, C) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: y || F,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && qo ? { ...p ? gs : xr, ...So } : p ? gs : xr,
      onClick: m
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    ws ? null : vs(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (C && _o ? C + ". " : "") + l),
    ws ? vs(v) : null
  );
  if (!y && !_n(d))
    return e.createElement(
      "div",
      { style: pn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: gr, className: "qm-header" },
        e.createElement(
          "div",
          { style: hr },
          qr(e),
          e.createElement("span", { style: un, className: "qm-title" }, k)
        ),
        e.createElement("span", { style: br }, "准备中")
      ),
      e.createElement("div", {
        style: { ...ms, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Ze ? e.createElement(
        "div",
        { style: fn },
        e.createElement("button", {
          type: "button",
          disabled: F,
          style: { ...zt, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: ds
        }, "释放本次问卷")
      ) : null
    );
  if (y) {
    const l = () => {
      const m = zi({
        submittedAt: dt,
        deadReason: _e,
        releasedNote: I,
        skippedAll: J,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: wt,
        pastSoft: Hn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!vt.current
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
      }, Ni(m.phase)) : null;
    }, p = !!vt.current;
    return J && !pe ? e.createElement(
      "div",
      {
        style: {
          ...pn,
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
        _e ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      K ? e.createElement("span", {
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
        title: K
      }, K) : null,
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
          ...un,
          flex: I || K ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      I ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, I) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...zt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Le(!0)
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
          ...zt,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: ps
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: pn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...gr, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: hr },
          qr(e),
          e.createElement("span", { style: un }, k)
        ),
        e.createElement(
          "span",
          { style: { ...br, color: _e ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          _e ? "已失效" : J ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      J && (K || _e) ? e.createElement(
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
        String(K || _e || "问卷已失效/跳过")
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
      }, J ? oe ? oe + `

` + An(f) : `已跳过本次问卷。

` + An(f) : oe || N || w || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + An(f)),
      J && pe ? e.createElement(
        "div",
        { style: fn },
        e.createElement("button", {
          type: "button",
          style: zt,
          onClick: () => Le(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...fn, marginTop: 8, gap: 10 } },
        I ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, I) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: F,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ...zt, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: ps
        }, "释放阻塞") : null
      )
    );
  }
  const qs = we && O === At, Ss = !y && !$e && Va >= 0 && sn.current[ee] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Es = Object.keys(sn.current).map((l) => Number(l)).filter((l) => sn.current[l] && Number.isFinite(l)).sort((l, p) => l - p), Eo = $e && Es.length ? e.createElement("div", {
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
  }, "⚠ 第 " + Es.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let gn = null;
  if ($e)
    gn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: yr }, "其他意见（可选）"),
      Eo,
      e.createElement(a, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: We,
        style: bs,
        onChange: (l) => Kt(l.target.value),
        onPaste: (l) => pr(l, "final", "final")
      }),
      zr({
        R: e,
        files: ie,
        disabled: y || F,
        uploading: ir,
        error: cr,
        onPick: () => dr("final", "final"),
        onRemove: (l) => ye((p) => p.filter((m, u) => u !== l))
      })
    );
  else if (qe && ae(qe) === "text")
    gn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...yr, fontSize: 13, color: "var(--app-text, inherit)" } }, $n(qe, ee)),
      Ss,
      e.createElement(a, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof U.value == "string" ? U.value : "",
        style: bs,
        onChange: (l) => bt({ ...U, value: l.target.value, other: "" }),
        onPaste: (l) => pr(l, "q", ht)
      }),
      zr({
        R: e,
        files: U.attachments || [],
        disabled: y || F,
        uploading: ir,
        error: cr,
        onPick: () => dr("q", ht),
        onRemove: (l) => bt({
          ...U,
          attachments: (U.attachments || []).filter((p, m) => m !== l)
        })
      })
    );
  else if (qe) {
    const l = Fs(qe), p = Ws(Yt, ee), m = l.length ? l : p ? [p] : l, u = (qe.options || []).map((v, C) => _s(
      Me(v),
      ys(v),
      () => ks(v),
      "o" + C,
      Ji(qe, v, m),
      C + 1
    ));
    u.push(_s("其他", xs, () => ks(he), "other")), xs && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: U.other,
      style: { ...ko, marginTop: 2 },
      onChange: (v) => bt({ ...U, other: v.target.value }),
      onPaste: (v) => pr(v, "q", ht)
    })), u.push(zr({
      R: e,
      files: U.attachments || [],
      disabled: y || F,
      uploading: ir,
      error: cr,
      onPick: () => dr("q", ht),
      onRemove: (v) => bt({
        ...U,
        attachments: (U.attachments || []).filter((C, T) => T !== v)
      })
    }))), gn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...yr, fontSize: 13, color: "var(--app-text, inherit)" } }, $n(qe, ee)),
      Ss,
      e.createElement("div", { style: { ...yo, marginTop: 8 } }, u)
    );
  }
  const kr = tt + 1, To = $e ? kr + "/" + kr : q + 1 + "/" + kr, Ts = (l, p, m, u) => e.createElement("button", {
    type: "button",
    title: l,
    "aria-label": l,
    onClick: m,
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
      cursor: "pointer",
      border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
      background: p ? "var(--app-surface-subtle, rgba(127,127,127,0.10))" : "transparent",
      color: "var(--app-text-secondary, inherit)"
    }
  }, u), Co = e.createElement(
    "svg",
    {
      width: 14,
      height: 14,
      viewBox: "0 0 24 24",
      fill: "currentColor",
      "aria-hidden": "true"
    },
    e.createElement("circle", { cx: 12, cy: 5, r: 1.7 }),
    e.createElement("circle", { cx: 12, cy: 12, r: 1.7 }),
    e.createElement("circle", { cx: 12, cy: 19, r: 1.7 })
  ), Ao = e.createElement(
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
  ), hn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 60,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, bn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, yn = (l, p) => e.createElement("button", {
    type: "button",
    key: l,
    className: "qm-hdr-menu-item",
    role: "menuitem",
    onClick: p && p.onClick ? p.onClick : () => {
      Be(!1);
    },
    disabled: p ? !!p.disabled : !1,
    title: p && p.title ? p.title : void 0,
    style: {
      display: "block",
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
  }, l), Cs = (er || []).find((l) => l.id === Ue), Io = Cs ? Cs.name : "默认模板", No = e.createElement(
    "div",
    { style: hn, role: "menu" },
    e.createElement("div", { style: bn }),
    yn("选择模板（当前：" + Io + "）", {
      disabled: y || F,
      onClick: () => {
        Be(!1), _t(!1), qt(!1), Ge(!1), Ve(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    yn("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: y || F || $e,
      onClick: () => {
        Be(!1), go();
      }
    }),
    yn("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: y || F,
      onClick: () => {
        Be(!1), mr(void 0, !0);
      }
    }),
    yn("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: y || F,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        Be(!1), Ge(!0);
      }
    })
  ), zo = e.createElement(
    "div",
    {
      style: { ...hn, width: 260, padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: bn }),
    e.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "上下文"),
    e.createElement("div", {
      style: { color: "var(--app-text-secondary, inherit)", lineHeight: 1.6 }
    }, "（占位）这里将展示本次问卷的发起原因与最近对话上下文。"),
    e.createElement("div", {
      style: { marginTop: 8, fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
    }, "来自本次问卷创建时的会话快照 · 仅本会话可见")
  ), $o = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "选择模板",
      style: { ...hn, padding: 4, minWidth: 240 }
    },
    e.createElement("div", { style: bn }),
    El({
      R: e,
      templates: er,
      value: Ue,
      onSelect: (l) => {
        is(l), Ve(!1);
      },
      onManage: () => {
        Ve(!1), ss(!0);
      }
    })
  ), Oo = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      style: { ...hn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: bn }),
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
        onClick: () => Ge(!1)
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: F ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: F ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          Ge(!1), bo();
        }
      }, "确定")
    )
  ), Ro = e.createElement(
    "div",
    {
      key: "qm-hdr-pop",
      ref: nn,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "none"
      }
    },
    Ts("更多操作", en, () => {
      Be((l) => !l), _t(!1), qt(!1), Ve(!1), Ge(!1);
    }, Co),
    Ts("查看上下文", tn, () => {
      _t((l) => !l), Be(!1), qt(!1), Ve(!1), Ge(!1);
    }, Ao),
    en ? No : null,
    tn ? zo : null,
    nr ? $o : null,
    sr ? Oo : null
  ), wr = {
    ...mn,
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
    { style: pn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: gr, className: "qm-header" },
      e.createElement(
        "div",
        { style: hr },
        qr(e),
        e.createElement("span", { style: un, className: "qm-title" }, k)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        ql({
          R: e,
          providers: Pa,
          modelId: ts,
          disabled: y || F,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: Ha,
          onOpenChange: Ua,
          tab: Ga,
          onTabChange: Ja,
          onChange: (l) => {
            ln({ modelId: l }), pt(null), He.current = {}, Pe.current = {}, ft((p) => p + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        Sl({
          R: e,
          mode: Y,
          disabled: y || F,
          open: Yn,
          onOpenChange: (l) => {
            qt(l), l && (Be(!1), _t(!1), Ve(!1), Ge(!1));
          },
          popRef: rs,
          onChange: (l) => {
            ln({ mode: l }), l === "ai" && (Pe.current = {}), l === "ai" || l === "recommend" ? (an.current = {}, Ye.current = {}, mt.current = !1, ft((p) => p + 1)) : gt();
          }
        }),
        Cl({
          R: e,
          busy: ns,
          result: Yt,
          error: Da,
          mode: Y,
          disabled: y || F,
          open: Fa,
          onOpenChange: Wa,
          onRun: () => {
            or("manual");
          },
          onRerun: oo,
          onApply: co,
          onCancel: io,
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
                checked: Zn,
                onChange: (l) => ln({ withContext: !!l.target.checked })
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
                checked: Qn,
                onChange: (l) => ln({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (Y === "ai" || Y === "recommend") && !y ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: F,
          onClick: lo,
          style: {
            ...wr,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...ze ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: ze ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, ze ? "▶ 继续" : "⏸ 停止") : null,
        // US-001: 「更多」(⋮) 与「查看上下文」(ⓘ) 两个 icon 微按钮 + 弹出层，
        // 纯增量插在现有控件之后、进度 pill 之前（demo v5 形态）。
        Ro,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: br, key: "qm-step" }, To)
      )
    ),
    e.createElement("div", { style: ms }, gn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Tl({
      R: e,
      open: Ka,
      templates: er,
      value: Ue,
      edit: Qa,
      onEditChange: rr,
      onClose: () => {
        ss(!1), rr(null);
      },
      onSelect: (l) => is(l),
      onSave: so,
      onDelete: ao
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
    (qs || Ze && !S) && !y ? e.createElement(
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
        (qs ? "⚠️ 本题已超过 " + uo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (S ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: {
          ...wr,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: ds,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Ke && !y ? e.createElement("div", {
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
      "data-qm-bundle": Ls
    }, Ke) : null,
    e.createElement(
      "div",
      { style: fn, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: q === 0 || F,
        style: { ...wr, marginRight: "auto", opacity: q === 0 ? 0.5 : 1 },
        onClick: () => $((l) => l - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: F,
        style: xo,
        onClick: ho
      }, $e ? "提交" : "下一步")
    )
  );
}
const Zs = 12;
let Ks = 0;
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
  }
};
let jt = null;
function se(t, e, n) {
  if (t in c.draft) return c.draft[t];
  if (n === "global") {
    const a = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return a && t in a ? a[t] : e;
  }
  const r = c.cfg && c.cfg.config, s = c.cfg && c.cfg.sessionConfig;
  if (s) {
    if (t in s) return s[t];
    const a = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return a && t in a ? a[t] : e;
  }
  return r && t in r && c.cfg && c.cfg.has_session === !0 ? r[t] : (r && t in r && !(c.cfg && c.cfg.has_session), e);
}
function Il(t) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function me(t, e) {
  let n;
  const r = c.cfg;
  if (c.scope === "global") {
    const s = r && r.globalConfig || c.globalCfg || {};
    n = t in s ? s[t] : void 0;
  } else {
    const s = r && r.sessionConfig;
    if (s)
      if (t in s)
        n = s[t];
      else {
        const a = r && r.globalConfig || c.globalCfg || {};
        n = t in a ? a[t] : void 0;
      }
    else {
      const a = r && r.config;
      n = a && t in a ? a[t] : void 0;
    }
  }
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", z();
}
function Qs() {
  return Object.keys(c.draft).length;
}
async function Xr() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: B() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    c.globalCfg = n && typeof n == "object" ? n : {};
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function Aa() {
  try {
    const t = await fetch(L("/question-modal/notify/channels"), {
      headers: B()
    });
    if (!t.ok) return;
    const e = await t.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off"), c.pcCurrent = String(e && e.pc_current || "off"), c.bgCurrent = String(e && e.bg_current || "off");
    try {
      z();
    } catch {
    }
  } catch {
  }
}
async function Vr(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        L("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: B() }
      );
      if (!e.ok) return;
      const n = await e.json();
      c.notifyLog = {
        ...c.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        z();
      } catch {
      }
    } catch {
    }
}
async function Nl(t) {
  if (!t || t === "off") return;
  c.notifyTesting = t, c.notifyMsg = { ...c.notifyMsg, [t]: "发送中…" };
  try {
    z();
  } catch {
  }
  let e = "", n = null;
  try {
    n = await (await fetch(L("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...B(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: t })
    })).json().catch(() => ({})), n && n.delivered ? e = n.note ? "✓ 已发送（" + n.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (n && (n.error || n.reason) || "测试失败");
  } catch (s) {
    e = "✗ 请求失败：" + String(s && s.message || s);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await Aa(), r || await Vr(t);
  try {
    z();
  } catch {
  }
}
async function zl() {
  if (c.saving) return;
  const t = Object.keys(c.draft), e = c.scope === "session", n = {};
  if (t.forEach((r) => {
    n[r] = c.draft[r];
  }), !t.length && !e) {
    const r = c.globalCfg || {};
    Object.keys(r).forEach((s) => {
      s in n || (n[s] = r[s]);
    });
  }
  t.length, c.saving = !0, c.saveMsg = "", z();
  try {
    let r = "/question-modal/prefs", s = n;
    e && (r = "/question-modal/session-prefs", s = {
      chat_id: c.chatId,
      session_id: c.sessionId,
      agent_id: c.agentId,
      settings: n,
      // 「我打开面板时这些键的最后写入时间」。后端据此判断本次保存是否
      // 覆盖了别处的改动，并在 conflicts 里回报（需求 2）。
      seen: c.keyTs || {},
      // 会话页保存 = 声明"本会话按会话模式运行"（D1）。
      // 无改动时 patch 为空，靠这个标记完成模式切换且不写任何值。
      set_scope: "session"
    });
    const a = await fetch(L(r), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(s)
    }), o = await a.json().catch(() => ({}));
    if (!a.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + a.status + "）", z();
      return;
    }
    const d = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (d.length) {
      c.saving = !1;
      const f = d.map((k) => `${k.key}：${k.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + f, z();
      return;
    }
    c.saving = !1, c.draft = {}, ha();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const f = (y) => {
        try {
          const x = new Date(y * 1e3), N = (A) => A < 10 ? "0" + A : String(A);
          return x.getMonth() + 1 + "-" + N(x.getDate()) + " " + N(x.getHours()) + ":" + N(x.getMinutes()) + ":" + N(x.getSeconds());
        } catch {
          return "";
        }
      }, k = i.reduce(
        (y, x) => Math.max(y, Number(x && x.at) || 0),
        0
      ), g = i.map((y) => String(y && y.key || "")).filter(Boolean);
      c.conflictNote = "设置已于 " + f(k) + " 被其它位置修改，本次已按后写入的值覆盖" + (g.length ? "（" + g.join("、") + "）" : "") + "。";
    }
    try {
      const f = o && o.key_ts || {};
      f && typeof f == "object" && (c.keyTs = Object.assign({}, c.keyTs, f));
    } catch {
    }
    e || Xr();
    const b = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let w = "";
    if (b && (w = e ? "session" : "default"), w === "default") {
      try {
        const f = await fetch(L("/question-modal/session-prefs"), {
          method: "POST",
          headers: B(),
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
        f.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + f.status + "），本会话仍在会话模式。", w = "");
      } catch (f) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (f && f.message ? f.message : f) + "，本会话仍在会话模式。", w = "";
      }
      c.keyTs = {};
    }
    if (w && (c.scopeChoice = w, c.tab = w, c.scope = w === "session" ? "session" : "global"), w === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (w === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const f = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + f + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Ut(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((f) => {
      f && (c.cfg = f);
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
function Ia() {
  c.draft = {}, c.saveMsg = "";
}
function Na() {
  Zr().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
  });
}
function $l() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", z();
}
function Ol(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", z());
}
function Xs(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, z());
}
function Rl() {
  c.tplEdit = null, z();
}
async function Ml() {
  const t = c.tplEdit;
  if (!t || c.tplBusy) return;
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
    c.saveMsg = "模板名称不能为空", z();
    return;
  }
  c.tplBusy = !0, z();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await ba(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), z();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Na(), z();
}
async function Ll(t) {
  const e = c.templates.filter((s) => s.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await ya(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), z();
    return;
  }
  c.saveMsg = "模板已删除", Na(), z();
}
function Bl() {
  c.visible = !0, c.chatId = "", c.sessionId = Zt(), c.cfg = null, c.cfgError = "", jl(), c.agentId = Pn || (() => {
    try {
      return Ce().getSelectedAgentId ? Ce().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), ha();
  const t = ++Ks;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", z(), za(() => {
    if (t !== Ks) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", z(), (c.tab === "global" || c.tab === "default") && Xr(), Aa().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && Vr(r);
    });
  });
}
let $r = !1;
async function Pl() {
  if (!$r) {
    $r = !0;
    try {
      const t = await Ut(
        "",
        !0,
        c.sessionId,
        c.agentId
      ), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      $r = !1;
      try {
        z();
      } catch {
      }
    }
  }
}
let qn = !1;
function jl() {
  qn || (qn = !0, Promise.all([xa(), Zr()]).then((t) => {
    qn = !1;
    const e = t[0] || [], n = t[1] || {};
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
    }).filter((r) => r.id && r.models.length > 0), c.modelOptions = c.providerGroups.flatMap((r) => r.models.map((s) => r.id + ":" + s)), c.templates = (n.items || []).filter((r) => r && r.id), c.templateOptions = c.templates.map((r) => r.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
    qn = !1;
  }));
}
function Dl(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let Or = !1, Sn = "";
const Rr = [];
function za(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (Or && Sn === n) {
    t && Rr.push(t);
    return;
  }
  Or = !0, Sn = n;
  const r = () => {
    Sn === n && (Or = !1, Sn = "");
    const s = Rr.splice(0);
    try {
      s.forEach((a) => a());
    } catch {
    }
  };
  t && Rr.push(t), Ut(
    e,
    !0,
    c.sessionId,
    c.agentId
  ).then((s) => {
    if (c.chatId !== e) {
      r();
      return;
    }
    if (s) {
      c.cfg = s, c.cfgError = "";
      const a = s.config && s.config.release_after_sec;
      c.stale.threshold = typeof a == "number" && isFinite(a) ? a : null;
    } else
      c.cfgError = "读取配置失败（后端不可达）", c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global");
    r();
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
  const t = Ce().React, e = Ce().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
        try {
          const n = Je();
          n && n.Modal && typeof n.Modal.info == "function" && n.Modal.info({
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
    jt || (jt = document.createElement("div"), jt.id = "qm-settings-root", document.body.appendChild(jt)), e.render(t.createElement(Gl, {
      R: t,
      open: c.visible,
      onClose: () => {
        if (Qs() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Ia();
        }
        c.visible = !1, c.saveMsg = "", z();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = $a(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, z(), za(), (n === "global" || n === "default") && Xr(), n === "stale" && Pl();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: Qs(),
      saving: c.saving,
      saveMsg: c.saveMsg,
      conflictNote: c.conflictNote,
      modelOptions: c.modelOptions,
      templateOptions: c.templateOptions,
      providerGroups: c.providerGroups,
      templates: c.templates,
      tplEdit: c.tplEdit,
      tplBusy: c.tplBusy,
      // ★ 漏传这一行 = 挂起清理页签永远空白（2026-11-15 实测缺陷）：
      //   组件读的是 props.stale，只更新 settingsState 不会触发可见变化。
      stale: c.stale
    }), jt);
  }
}
function Fl(t) {
  const { R: e, onOpen: n } = t, r = Je(), s = r && r.Button, a = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, d = { title: a, "aria-label": a }, i = {
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
  }, h = e.createElement("svg", i, [
    e.createElement("path", {
      key: 1,
      d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
    }),
    e.createElement("polyline", { key: 2, points: "14 2 14 8 20 8" }),
    e.createElement("line", { key: 3, x1: 16, y1: 13, x2: 8, y2: 13 }),
    e.createElement("line", { key: 4, x1: 16, y1: 17, x2: 8, y2: 17 }),
    e.createElement("polyline", { key: 5, points: "10 9 9 9 8 9" })
  ]);
  return h ? s ? e.createElement(s, {
    type: "text",
    size: "small",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, h) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, h) : s ? e.createElement(
    s,
    { type: "text", size: "small", style: o, onClick: n },
    a
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    a
  );
}
const Mr = [
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
  { key: "stale", label: "问卷清理", hint: "" }
], $a = (t) => t === "session";
function Wl(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function Hl(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function Vs(t, e, n, r) {
  const s = n === "pc" ? "notify_channel_pc" : "notify_channel_bg", a = c.notifyChannels || [], o = String(
    (n === "pc" ? c.pcCurrent : c.bgCurrent) || "off"
  ), d = String(se(s, "off", "global") || o || "off"), h = ((_) => a.filter((q) => String(q.channel) === _)[0])(d), b = a.filter((_) => n !== "bg" || String(_.channel) !== "browser").map((_) => {
    const q = String(_.channel || ""), $ = String(_.label || q), E = _.ready !== !1, P = _.verified === !0 || q === "off";
    let O = "";
    return E ? P || (O = "（待测试）") : O = "（不可用）", { value: q, label: $ + O, disabled: !E };
  });
  b.length || b.push({ value: "off", label: "关闭", disabled: !1 });
  const w = !h || h.ready !== !1, f = d !== "off" && d !== "browser", k = c.notifyTesting === d, g = h && h.last_test || null, y = c.notifyMsg[d] || "", x = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: d,
      "data-qm-notify-select": "1",
      "data-qm-notify-scene": n,
      style: { flex: "0 0 auto" },
      onChange: (_) => {
        const q = _ && _.target ? String(_.target.value) : "off";
        me(s, q), Vr(q);
      }
    }, b.map((_, q) => t.createElement("option", {
      key: "o" + q,
      value: _.value,
      disabled: !!_.disabled
    }, _.label)))
  ];
  if (f && w && x.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: k,
    "data-qm-notify-test": d,
    onClick: (_) => {
      _ && _.stopPropagation && _.stopPropagation(), Nl(d);
    },
    style: {
      marginLeft: 8,
      padding: "2px 10px",
      fontSize: 12,
      border: "1px solid #d9d9d9",
      borderRadius: 4,
      background: "#fff",
      cursor: k ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, k ? "发送中…" : "测试")), h && h.ready === !1 && h.reason) {
    const _ = h.reason_code === "missing_agent_id" || h.reason_code === "agent_not_found";
    x.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": h.reason_code || "",
      style: _ ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, h.reason));
  }
  const N = !!(h && h.verified === !0), A = g || y, S = !!y;
  if (A || f && w && !k) {
    const _ = g ? g.delivered === !0 : S ? y.indexOf("✓") === 0 : !1;
    let q;
    S ? q = y : g ? q = _ ? "✓ 上次测试成功" + (g.note ? "（" + g.note + "）" : "") : "✗ " + (g.error || g.note || "上次测试失败") : q = "未测试";
    const $ = g && g.at_text ? "  ·  " + g.at_text : "", E = A ? _ ? "#52c41a" : "#ff4d4f" : "#faad14";
    x.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": A ? _ ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": A && (_ || N) ? "1" : "0",
      style: {
        flex: "1 1 240px",
        minWidth: 0,
        fontSize: 11,
        lineHeight: "16px",
        color: E,
        // 允许在任意位置断行：失败原因里有很长的中文句子与 URL 形态内容，
        // 不让它撑破容器（也不要 pre-wrap，那会拒绝折行）。
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }
    }, q + $));
  }
  return de(
    t,
    n === "pc" ? "e5pc" : "e5bg",
    r,
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
    }, x),
    n === "pc" ? "PC 端打开问卷时提醒一次（仅人工模式）。后台场景自动改走下一行配置。" : "页面已关闭或切后台时提醒一次（仅人工模式）。无浏览器选项：页面不在，浏览器通知必然无效。",
    "global",
    e,
    !1,
    !0
  );
}
function de(t, e, n, r, s, a, o, d, i) {
  const h = a || "global", b = Hl(o || "global", h), w = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      Wl(t, "sc", h),
      b && h === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], f = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, w),
    t.createElement("div", {
      className: "qm-set-rowctl" + (d ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, r)
  ];
  return t.createElement("div", {
    className: "qm-set-row" + (b ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": b ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, f);
}
function Ys(t, e, n, r, s) {
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
function En(t, e, n, r) {
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
function at(t, e, n, r, s) {
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
function ea(t, e, n, r, s) {
  const a = Dl(n), d = r.map((k) => k.id).indexOf(a.provider) >= 0 ? a.provider : "", i = d ? (r.filter((k) => k.id === d)[0] || { models: [] }).models : [], h = i.indexOf(a.model) >= 0 ? a.model : "", b = (k, g) => {
    s && s(k ? k + ":" + g : "");
  }, w = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: d,
    disabled: !s,
    title: "厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "", y = g ? (r.filter((x) => x.id === g)[0] || { models: [] }).models : [];
      b(g, g && y[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((k, g) => t.createElement(
    "option",
    { key: "g" + g, value: k.id },
    k.name === k.id ? k.id : k.name + "（" + k.models.length + "）"
  )))), f = t.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: h,
    disabled: !s || !d,
    title: d ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "";
      b(d, g);
    }
  }, d ? i.map((k, g) => t.createElement("option", { key: "m" + g, value: k }, k)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    w,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    f
  ]);
}
function Ul(t, e, n, r, s) {
  const a = [], o = n === "session" ? "session" : "global", d = {
    自动分析: "ai",
    只用推荐: "recommend",
    人工: "manual"
  }, i = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, h = {
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
  }, k = s && s.templateOptions || [];
  s && s.modelOptions;
  const g = s && s.providerGroups || [], y = k.map((x) => {
    const N = c.templates.filter((A) => String(A.id) === String(x))[0];
    return { value: x, label: N && (N.name || N.id) || x };
  });
  if (e === "session") {
    const N = String(se("mode", "manual")) !== "recommend";
    if (a.push(de(
      t,
      "s1",
      "答题模式",
      Ys(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(se("mode", "manual"))] || "人工",
        (A) => me("mode", d[A] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), N) {
      a.push(de(
        t,
        "s2",
        "默认模型",
        ea(
          t,
          "sel2",
          String(se("model_id", "")),
          g,
          (S) => me("model_id", S)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        Il("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const A = String(se("template_id", "")) || y[0] && y[0].value || "";
      a.push(de(
        t,
        "s3",
        "提示词模板",
        y.length ? at(
          t,
          "sel3",
          A,
          y,
          (S) => me("template_id", S)
        ) : at(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), a.push(de(
        t,
        "s4",
        "携带上下文",
        En(
          t,
          "s4sw",
          !!se("with_context", !1),
          (S) => me("with_context", S)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), a.push(de(
        t,
        "s5",
        "并行分析各题",
        En(
          t,
          "s5sw",
          !!se("parallel", !1),
          (S) => me("parallel", S)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const A = String(se("mode", "manual", "global")) !== "recommend";
      a.push(de(
        t,
        "a1",
        "默认答题模式",
        Ys(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(se("mode", "manual", "global"))] || "人工",
          (S) => me("mode", d[S] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), A && (a.push(de(
        t,
        "b1",
        "默认模型",
        ea(
          t,
          "sel2",
          String(se("model_id", "", "global")),
          g,
          (S) => me("model_id", S)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), a.push(de(
        t,
        "b2",
        "提示词模板",
        y.length ? at(
          t,
          "sel3",
          String(se("template_id", "", "global")) || y[0].value,
          y,
          (S) => me("template_id", S)
        ) : at(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), a.push(de(
        t,
        "b3",
        "携带上下文",
        En(
          t,
          "s3",
          !!se("with_context", !1, "global"),
          (S) => me("with_context", S)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), a.push(de(
        t,
        "b4",
        "并行分析各题",
        En(
          t,
          "s4",
          !!se("parallel", !1, "global"),
          (S) => me("parallel", S)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      a.push(Vs(t, o, "pc", "PC 端打开时提醒频道")), a.push(Vs(t, o, "bg", "后台运行时提醒频道")), a.push(de(
        t,
        "e6",
        "单题分析超时",
        at(
          t,
          "sel4",
          b[Number(se("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (q) => me("model_timeout_sec", h[q] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), a.push(de(
        t,
        "d4",
        "等待提示阈值",
        at(
          t,
          "sel5",
          f[Number(se("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (q) => me("wait_hint_sec", w[q] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const N = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], A = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, S = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, _ = Number(se("gate_log_limit", 200, "global"));
      a.push(de(
        t,
        "d5",
        "拦截记录",
        at(
          t,
          "sel6",
          S[_] || "最近 200 条（默认）",
          N,
          (q) => me("gate_log_limit", A[q] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const x = c.templates, N = c.tplEdit;
    if (a.push(de(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), x.length ? a.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      x.map((A, S) => {
        const _ = !!A.builtin, $ = (String(A.note || A.desc || "").trim() || String(A.system || A.system_prompt || A.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), E = $.length > 90 ? $.slice(0, 90) + "…" : $;
        return t.createElement("div", { className: "qm-set-item", key: "i" + S }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(A.name || A.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (_ ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, _ ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(A.id),
              onClick: () => {
                Ol(String(A.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (_ ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(A.id),
              disabled: _,
              title: _ ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                _ || Ll(String(A.id));
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
          $l();
        }
      }, "＋ 新建模板")
    ])), N) {
      const A = (S, _, q, $, E) => {
        var P, O;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + _ }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, S),
          q ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: $,
            "data-qm-tpl-field": _,
            placeholder: E,
            value: String(((P = c.tplEdit) == null ? void 0 : P[_]) || ""),
            onChange: (Q) => Xs(_, Q && Q.target ? Q.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": _,
            placeholder: E,
            value: String(((O = c.tplEdit) == null ? void 0 : O[_]) || ""),
            onChange: (Q) => Xs(_, Q && Q.target ? Q.target.value : "")
          })
        ]);
      };
      a.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (N.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          N.id ? "编辑模板：" + (N.name || N.id) : "新建模板"
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
        t.createElement("div", { className: "qm-set-editorbtns", key: "b" }, [
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn qm-set-btnprimary",
            key: "save",
            "data-qm-tpl-save": "1",
            disabled: !!c.tplBusy,
            onClick: () => {
              Ml();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Rl();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "stale") {
    const x = c.stale, N = x && x.rows || [], A = x && x.exceeded || [], S = x && x.within || [], _ = (x && x.blocking || []).length ? x.blocking : N.filter((X) => X && X.nature === "blocking"), q = (x && x.residual || []).length ? x.residual : N.filter((X) => X && X.nature !== "blocking"), $ = _.filter(
      (X) => X && A.some(
        (M) => M.tool_call_id === X.tool_call_id
      )
    ), E = x ? x.threshold : null, P = Pr(E), O = E !== null && E <= 0, Q = !!(x && (x.busy || x.thrBusy)) || $.length === 0 || O, we = !!(x && (x.busy || x.thrBusy)) || q.length === 0;
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
          t.createElement("span", { key: "t" }, "问卷阻塞超时自动释放"),
          t.createElement(
            "span",
            { className: "qm-set-rownote", key: "n" },
            O ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${P} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(x && x.thrBusy),
            value: E === null ? "" : String(E),
            onChange: (X) => {
              const M = Number(X.target.value);
              c.draft.release_after_sec = M, c.stale.threshold = M, c.stale.msgKind = "", c.stale.msg = "已选择「" + Pr(M) + "」，点下方「保存」后生效", z();
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
      O ? t.createElement("div", {
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
          disabled: !!(x && x.busy),
          onClick: () => {
            Fi();
          }
        }, x && x.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: Q,
          title: O ? "自动释放已关闭，请逐条释放" : $.length ? `释放全部 ${$.length} 条已超阈值的阻塞问卷（观察期内 ${S.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            Wi();
          }
        }, $.length ? `全部释放（阻塞·已超阈值 ${$.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: we,
          title: q.length ? `清理全部 ${q.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            Hi();
          }
        }, q.length ? `全部清理（残留 ${q.length} 条）` : "全部清理")
      ])
    ])), x && x.msg && a.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": x.msgKind || "info"
    }, x.msg)), x && x.scanned && N.length === 0 && a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!x || !x.scanned) && (x && x.msg || a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), N.length) {
      const M = {};
      A.forEach((I) => {
        M[I.tool_call_id] = !0;
      });
      const Z = (I, ve) => {
        if (!I) return;
        const oe = () => {
          c.stale.copied = ve, z(), setTimeout(() => {
            c.stale.copied === ve && (c.stale.copied = "", z());
          }, 1600);
        };
        try {
          const G = typeof navigator < "u" ? navigator : null;
          if (G && G.clipboard && G.clipboard.writeText)
            G.clipboard.writeText(I).then(oe, oe);
          else {
            const J = document.createElement("textarea");
            J.value = I, document.body.appendChild(J), J.select(), document.execCommand("copy"), document.body.removeChild(J), oe();
          }
        } catch {
          oe();
        }
      }, We = (I, ve) => {
        const oe = !!I.terminable, G = !!M[I.tool_call_id], J = ve === "blocking", be = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const ye = I.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${I.idle_text}，阈值 ${P}）${ye}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && Cr([I.tool_call_id]);
        }, K = !!(x && x.copied) && x.copied === I.tool_call_id, Ne = (ye) => {
          const pe = Number(ye);
          if (!ye || !isFinite(pe) || pe <= 0) return "-";
          try {
            return new Date(pe * 1e3).toLocaleString();
          } catch {
            return "-";
          }
        }, ie = (ye, pe, Le, Ze) => t.createElement("div", { className: "qm-set-stalemetaitem", key: ye }, [
          t.createElement("span", {
            className: "qm-set-stalemetalabel",
            key: "l"
          }, pe),
          t.createElement("span", {
            className: "qm-set-stalemetavalue",
            key: "v",
            ...Ze || {}
          }, Le)
        ]);
        return t.createElement("div", {
          className: "qm-set-stalecard",
          key: I.tool_call_id + ":" + ve,
          "data-qm-stale-row": I.tool_call_id,
          "data-qm-stale-nature": ve,
          "data-qm-stale-group": G ? "exceeded" : "within"
        }, [
          t.createElement("div", { className: "qm-set-stalecardhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-stalecardtitle", key: "t" },
              I.title || "(无标题)"
            ),
            // 把「它是什么性质/为什么没被自动释放」直接写在卡上，省得翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              I.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : I.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : I.reason_code === "no-future" ? "无唤醒句柄" : I.reason_code === "future-done" ? "已结束未收尾" : G ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            I.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { color: "#e67e22" }
            }, "正在作答") : null,
            I.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl"
            }, "模型分析中") : null
          ]),
          t.createElement("div", { className: "qm-set-stalecardmeta", key: "m" }, [
            ie("agent", "归属", I.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            ie(
              "sid",
              "会话 ID",
              K ? "✓ 会话 ID 已复制" : I.session_id || "-",
              {
                title: K ? "已复制到剪贴板" : I.session_id ? "点击复制完整会话 ID：" + I.session_id : "",
                style: I.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: K ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": I.tool_call_id,
                onClick: () => {
                  Z(String(I.session_id || ""), I.tool_call_id);
                }
              }
            ),
            ie("tcid", "问卷 ID", I.tool_call_id || "-"),
            ie("idle", "挂起时长", I.idle_text || "-"),
            ie("created", "发起时间", Ne(I.created_at)),
            ie("mode", "作答模式", I.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...J ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": I.tool_call_id,
                disabled: !!(x && x.busy),
                title: G ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  G ? Cr([I.tool_call_id]) : be();
                }
              }, G ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": I.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(x && x.busy) || !oe,
                title: oe ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  Ui([I.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": I.tool_call_id,
                disabled: !!(x && x.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  Cr([I.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, Kt = (I, ve, oe, G, J) => {
        if (!G || !G.length) return null;
        const be = Math.max(1, Math.ceil(G.length / 5)), K = Math.min(
          Math.max(0, Number(x[J]) || 0),
          be - 1
        ), Ne = G.slice(
          K * 5,
          K * 5 + 5
        ), ie = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": I
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": I
            }, ve),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, oe)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": I
          }, Ne.map((ye) => We(ye, I)))
        ];
        if (be > 1) {
          const ye = (Le) => {
            c.stale[J] = Le, z();
          }, pe = (Le, Ze, ct, xt) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: xt,
            "data-qm-stale-page": String(Ze),
            disabled: ct,
            onClick: () => {
              ye(Ze);
            }
          }, Le);
          ie.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": I
          }, [
            pe("上一页", K - 1, K <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(K + 1)
            }, `第 ${K + 1} / ${be} 页（共 ${G.length} 条，每页 5 条）`),
            pe("下一页", K + 1, K >= be - 1, "next")
          ]));
        }
        return ie;
      }, F = Kt(
        "blocking",
        `🔴 正在阻塞会话（${_.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        _,
        "page"
      ), Ae = Kt(
        "residual",
        `⚪ 异常残留（${q.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        q,
        "resPage"
      );
      F && a.push(...F), Ae && a.push(...Ae);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, a);
}
function Gl(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const s = Je(), a = s && s.Modal, o = !t.tab, d = t.tab || "", i = $a(d) ? "session" : "global", h = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Mr.map((Z) => e.createElement("button", {
      key: Z.key,
      type: "button",
      className: "qm-set-tab" + (!o && Z.key === d ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(Z.key);
        } catch {
        }
      }
    }, Z.label))
  ), b = Mr.filter((Z) => Z.key === d)[0] || Mr[0], w = !!(t.cfg && t.cfg.has_session), f = w ? "session" : "default", k = w ? "会话模式" : "默认模式", g = e.createElement("div", {
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
    }, k)
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
  }, "✕"), x = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      g,
      y
    ])
  ]), N = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, A = null, S = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((Z) => e.createElement("div", {
    key: "sk" + Z,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: Z * 0.15 + "s"
    }
  }))) : null, _ = o ? S : Ul(e, d, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), q = t.dirtyCount || 0, $ = String(t.tab || ""), E = $ === "session" || $ === "default";
  let P;
  E ? P = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : P = $ === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const O = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      q ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + q + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, P)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      q > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          Ia(), z();
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
          zl();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), Q = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, we = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, X = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    A,
    N,
    _,
    Q,
    we
  ]), M = e.createElement("div", { className: "qm-set-wrap" }, [
    x,
    h,
    X,
    O
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
  }, M) : e.createElement("div", {
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
    M
  ]);
}
function Jl(t) {
  try {
    const e = t && t.sender, n = Ce().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(Fl, {
      R: n,
      onOpen: () => {
        Bl();
      }
    });
    e.addPrefix(ua, r, {
      id: "question-modal.settings-btn",
      order: Zs
    }), console.log("[question-modal] settings entry registered (order " + Zs + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function Zl() {
  const t = ki();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return _i(), t.toolRender(ua, Ms, Al), console.log("[question-modal] registered via chat.toolRender for", Ms), Jl(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!Zl()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
