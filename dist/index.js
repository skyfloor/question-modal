var Go = Object.defineProperty;
var Pa = (t) => {
  throw TypeError(t);
};
var Jo = (t, e, n) => e in t ? Go(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var G = (t, e, n) => Jo(t, typeof e != "symbol" ? e + "" : e, n), Zo = (t, e, n) => e.has(t) || Pa("Cannot " + n);
var La = (t, e, n) => e.has(t) ? Pa("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var wn = (t, e, n) => (Zo(t, e, "access private method"), n);
function Gr() {
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
let dt = Gr();
function cs(t) {
  dt = t;
}
const ds = /[&<>"']/, Ko = new RegExp(ds.source, "g"), ps = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Qo = new RegExp(ps.source, "g"), Xo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ba = (t) => Xo[t];
function we(t, e) {
  if (e) {
    if (ds.test(t))
      return t.replace(Ko, Ba);
  } else if (ps.test(t))
    return t.replace(Qo, Ba);
  return t;
}
const Vo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Yo(t) {
  return t.replace(Vo, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const ei = /(^|[^\[])\^/g;
function W(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (a, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(ei, "$1"), n = n.replace(a, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function ja(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Wt = { exec: () => null };
function Da(t, e) {
  const n = t.replace(/\|/g, (s, o, p) => {
    let i = !1, h = o;
    for (; --h >= 0 && p[h] === "\\"; )
      i = !i;
    return i ? "|" : " |";
  }), r = n.split(/ \|/);
  let a = 0;
  if (r[0].trim() || r.shift(), r.length > 0 && !r[r.length - 1].trim() && r.pop(), e)
    if (r.length > e)
      r.splice(e);
    else
      for (; r.length < e; )
        r.push("");
  for (; a < r.length; a++)
    r[a] = r[a].trim().replace(/\\\|/g, "|");
  return r;
}
function qn(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let a = 0;
  for (; a < r && t.charAt(r - a - 1) === e; )
    a++;
  return t.slice(0, r - a);
}
function ti(t, e) {
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
function Fa(t, e, n, r) {
  const a = e.href, s = e.title ? we(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
  if (t[0].charAt(0) !== "!") {
    r.state.inLink = !0;
    const p = {
      type: "link",
      raw: n,
      href: a,
      title: s,
      text: o,
      tokens: r.inlineTokens(o)
    };
    return r.state.inLink = !1, p;
  }
  return {
    type: "image",
    raw: n,
    href: a,
    title: s,
    text: we(o)
  };
}
function ni(t, e) {
  const n = t.match(/^(\s+)(?:```)/);
  if (n === null)
    return e;
  const r = n[1];
  return e.split(`
`).map((a) => {
    const s = a.match(/^\s+/);
    if (s === null)
      return a;
    const [o] = s;
    return o.length >= r.length ? a.slice(r.length) : a;
  }).join(`
`);
}
class $n {
  // set by the lexer
  constructor(e) {
    G(this, "options");
    G(this, "rules");
    // set by the lexer
    G(this, "lexer");
    this.options = e || dt;
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
        text: this.options.pedantic ? r : qn(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], a = ni(r, n[3] || "");
      return {
        type: "code",
        raw: r,
        lang: n[2] ? n[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : n[2],
        text: a
      };
    }
  }
  heading(e) {
    const n = this.rules.block.heading.exec(e);
    if (n) {
      let r = n[2].trim();
      if (/#$/.test(r)) {
        const a = qn(r, "#");
        (this.options.pedantic || !a || / $/.test(a)) && (r = a.trim());
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
      r = qn(r.replace(/^ *>[ \t]?/gm, ""), `
`);
      const a = this.lexer.state.top;
      this.lexer.state.top = !0;
      const s = this.lexer.blockTokens(r);
      return this.lexer.state.top = a, {
        type: "blockquote",
        raw: n[0],
        tokens: s,
        text: r
      };
    }
  }
  list(e) {
    let n = this.rules.block.list.exec(e);
    if (n) {
      let r = n[1].trim();
      const a = r.length > 1, s = {
        type: "list",
        raw: "",
        ordered: a,
        start: a ? +r.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      r = a ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`, this.options.pedantic && (r = a ? r : "[*+-]");
      const o = new RegExp(`^( {0,3}${r})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let p = "", i = "", h = !1;
      for (; e; ) {
        let b = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        p = n[0], e = e.substring(p.length);
        let S = n[2].split(`
`, 1)[0].replace(/^\t+/, (O) => " ".repeat(3 * O.length)), f = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = S.trimStart()) : (k = n[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = S.slice(k), k += n[1].length);
        let g = !1;
        if (!S && /^ *$/.test(f) && (p += f + `
`, e = e.substring(f.length + 1), b = !0), !b) {
          const O = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), T = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), E = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), v = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const q = e.split(`
`, 1)[0];
            if (f = q, this.options.pedantic && (f = f.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), E.test(f) || v.test(f) || O.test(f) || T.test(e))
              break;
            if (f.search(/[^ ]/) >= k || !f.trim())
              i += `
` + f.slice(k);
            else {
              if (g || S.search(/[^ ]/) >= 4 || E.test(S) || v.test(S) || T.test(S))
                break;
              i += `
` + f;
            }
            !g && !f.trim() && (g = !0), p += q + `
`, e = e.substring(q.length + 1), S = f.slice(k);
          }
        }
        s.loose || (h ? s.loose = !0 : /\n *\n *$/.test(p) && (h = !0));
        let y = null, x;
        this.options.gfm && (y = /^\[[ xX]\] /.exec(i), y && (x = y[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: p,
          task: !!y,
          checked: x,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += p;
      }
      s.items[s.items.length - 1].raw = p.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let b = 0; b < s.items.length; b++)
        if (this.lexer.state.top = !1, s.items[b].tokens = this.lexer.blockTokens(s.items[b].text, []), !s.loose) {
          const S = s.items[b].tokens.filter((k) => k.type === "space"), f = S.length > 0 && S.some((k) => /\n.*\n/.test(k.raw));
          s.loose = f;
        }
      if (s.loose)
        for (let b = 0; b < s.items.length; b++)
          s.items[b].loose = !0;
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
      const r = n[1].toLowerCase().replace(/\s+/g, " "), a = n[2] ? n[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = n[3] ? n[3].substring(1, n[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : n[3];
      return {
        type: "def",
        tag: r,
        raw: n[0],
        href: a,
        title: s
      };
    }
  }
  table(e) {
    const n = this.rules.block.table.exec(e);
    if (!n || !/[:|]/.test(n[2]))
      return;
    const r = Da(n[1]), a = n[2].replace(/^\||\| *$/g, "").split("|"), s = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: n[0],
      header: [],
      align: [],
      rows: []
    };
    if (r.length === a.length) {
      for (const p of a)
        /^ *-+: *$/.test(p) ? o.align.push("right") : /^ *:-+: *$/.test(p) ? o.align.push("center") : /^ *:-+ *$/.test(p) ? o.align.push("left") : o.align.push(null);
      for (const p of r)
        o.header.push({
          text: p,
          tokens: this.lexer.inline(p)
        });
      for (const p of s)
        o.rows.push(Da(p, o.header.length).map((i) => ({
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
      const r = n[2].trim();
      if (!this.options.pedantic && /^</.test(r)) {
        if (!/>$/.test(r))
          return;
        const o = qn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = ti(n[2], "()");
        if (o > -1) {
          const i = (n[0].indexOf("!") === 0 ? 5 : 4) + n[1].length + o;
          n[2] = n[2].substring(0, o), n[0] = n[0].substring(0, i).trim(), n[3] = "";
        }
      }
      let a = n[2], s = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(a);
        o && (a = o[1], s = o[3]);
      } else
        s = n[3] ? n[3].slice(1, -1) : "";
      return a = a.trim(), /^</.test(a) && (this.options.pedantic && !/>$/.test(r) ? a = a.slice(1) : a = a.slice(1, -1)), Fa(n, {
        href: a && a.replace(this.rules.inline.anyPunctuation, "$1"),
        title: s && s.replace(this.rules.inline.anyPunctuation, "$1")
      }, n[0], this.lexer);
    }
  }
  reflink(e, n) {
    let r;
    if ((r = this.rules.inline.reflink.exec(e)) || (r = this.rules.inline.nolink.exec(e))) {
      const a = (r[2] || r[1]).replace(/\s+/g, " "), s = n[a.toLowerCase()];
      if (!s) {
        const o = r[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return Fa(r, s, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let a = this.rules.inline.emStrongLDelim.exec(e);
    if (!a || a[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(a[1] || a[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...a[0]].length - 1;
      let p, i, h = o, b = 0;
      const S = a[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (S.lastIndex = 0, n = n.slice(-1 * e.length + o); (a = S.exec(n)) != null; ) {
        if (p = a[1] || a[2] || a[3] || a[4] || a[5] || a[6], !p)
          continue;
        if (i = [...p].length, a[3] || a[4]) {
          h += i;
          continue;
        } else if ((a[5] || a[6]) && o % 3 && !((o + i) % 3)) {
          b += i;
          continue;
        }
        if (h -= i, h > 0)
          continue;
        i = Math.min(i, i + h + b);
        const f = [...a[0]][0].length, k = e.slice(0, o + a.index + f + i);
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
      const a = /[^ ]/.test(r), s = /^ /.test(r) && / $/.test(r);
      return a && s && (r = r.substring(1, r.length - 1)), r = we(r, !0), {
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
      let r, a;
      return n[2] === "@" ? (r = we(n[1]), a = "mailto:" + r) : (r = we(n[1]), a = r), {
        type: "link",
        raw: n[0],
        text: r,
        href: a,
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
      let a, s;
      if (n[2] === "@")
        a = we(n[0]), s = "mailto:" + a;
      else {
        let o;
        do
          o = n[0], n[0] = ((r = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== n[0]);
        a = we(n[0]), n[1] === "www." ? s = "http://" + n[0] : s = n[0];
      }
      return {
        type: "link",
        raw: n[0],
        text: a,
        href: s,
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
  inlineText(e) {
    const n = this.rules.inline.text.exec(e);
    if (n) {
      let r;
      return this.lexer.state.inRawBlock ? r = n[0] : r = we(n[0]), {
        type: "text",
        raw: n[0],
        text: r
      };
    }
  }
}
const ri = /^(?: *(?:\n|$))+/, ai = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, si = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Jt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, oi = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, us = /(?:[*+-]|\d{1,9}[.)])/, fs = W(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, us).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Jr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, ii = /^[^\n]+/, Zr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, li = W(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", Zr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ci = W(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, us).getRegex(), Fn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Kr = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, di = W("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", Kr).replace("tag", Fn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ms = W(Jr).replace("hr", Jt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Fn).getRegex(), pi = W(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ms).getRegex(), Qr = {
  blockquote: pi,
  code: ai,
  def: li,
  fences: si,
  heading: oi,
  hr: Jt,
  html: di,
  lheading: fs,
  list: ci,
  newline: ri,
  paragraph: ms,
  table: Wt,
  text: ii
}, Wa = W("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Jt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Fn).getRegex(), ui = {
  ...Qr,
  table: Wa,
  paragraph: W(Jr).replace("hr", Jt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Wa).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Fn).getRegex()
}, fi = {
  ...Qr,
  html: W(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Kr).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Wt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: W(Jr).replace("hr", Jt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", fs).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, gs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, mi = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, hs = /^( {2,}|\\)\n(?!\s*$)/, gi = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Zt = "\\p{P}\\p{S}", hi = W(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Zt).getRegex(), bi = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, yi = W(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Zt).getRegex(), xi = W("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Zt).getRegex(), ki = W("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Zt).getRegex(), vi = W(/\\([punct])/, "gu").replace(/punct/g, Zt).getRegex(), wi = W(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), qi = W(Kr).replace("(?:-->|$)", "-->").getRegex(), Si = W("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", qi).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, _i = W(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), bs = W(/^!?\[(label)\]\[(ref)\]/).replace("label", Mn).replace("ref", Zr).getRegex(), ys = W(/^!?\[(ref)\](?:\[\])?/).replace("ref", Zr).getRegex(), Ei = W("reflink|nolink(?!\\()", "g").replace("reflink", bs).replace("nolink", ys).getRegex(), Xr = {
  _backpedal: Wt,
  // only used for GFM url
  anyPunctuation: vi,
  autolink: wi,
  blockSkip: bi,
  br: hs,
  code: mi,
  del: Wt,
  emStrongLDelim: yi,
  emStrongRDelimAst: xi,
  emStrongRDelimUnd: ki,
  escape: gs,
  link: _i,
  nolink: ys,
  punctuation: hi,
  reflink: bs,
  reflinkSearch: Ei,
  tag: Si,
  text: gi,
  url: Wt
}, Ci = {
  ...Xr,
  link: W(/^!?\[(label)\]\((.*?)\)/).replace("label", Mn).getRegex(),
  reflink: W(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Mn).getRegex()
}, Wr = {
  ...Xr,
  escape: W(gs).replace("])", "~|])").getRegex(),
  url: W(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Ti = {
  ...Wr,
  br: W(hs).replace("{2,}", "*").getRegex(),
  text: W(Wr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Sn = {
  normal: Qr,
  gfm: ui,
  pedantic: fi
}, Rt = {
  normal: Xr,
  gfm: Wr,
  breaks: Ti,
  pedantic: Ci
};
class Re {
  constructor(e) {
    G(this, "tokens");
    G(this, "options");
    G(this, "state");
    G(this, "tokenizer");
    G(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || dt, this.options.tokenizer = this.options.tokenizer || new $n(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: Sn.normal,
      inline: Rt.normal
    };
    this.options.pedantic ? (n.block = Sn.pedantic, n.inline = Rt.pedantic) : this.options.gfm && (n.block = Sn.gfm, this.options.breaks ? n.inline = Rt.breaks : n.inline = Rt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: Sn,
      inline: Rt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Re(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Re(n).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (p, i, h) => i + "    ".repeat(h.length));
    let r, a, s, o;
    for (; e; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((p) => (r = p.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.space(e)) {
          e = e.substring(r.raw.length), r.raw.length === 1 && n.length > 0 ? n[n.length - 1].raw += `
` : n.push(r);
          continue;
        }
        if (r = this.tokenizer.code(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && (a.type === "paragraph" || a.type === "text") ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r);
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
          e = e.substring(r.raw.length), a = n[n.length - 1], a && (a.type === "paragraph" || a.type === "text") ? (a.raw += `
` + r.raw, a.text += `
` + r.raw, this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = {
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
        if (s = e, this.options.extensions && this.options.extensions.startBlock) {
          let p = 1 / 0;
          const i = e.slice(1);
          let h;
          this.options.extensions.startBlock.forEach((b) => {
            h = b.call({ lexer: this }, i), typeof h == "number" && h >= 0 && (p = Math.min(p, h));
          }), p < 1 / 0 && p >= 0 && (s = e.substring(0, p + 1));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(s))) {
          a = n[n.length - 1], o && a.type === "paragraph" ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r), o = s.length !== e.length, e = e.substring(r.raw.length);
          continue;
        }
        if (r = this.tokenizer.text(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && a.type === "text" ? (a.raw += `
` + r.raw, a.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = a.text) : n.push(r);
          continue;
        }
        if (e) {
          const p = "Infinite loop on byte: " + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(p);
            break;
          } else
            throw new Error(p);
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
    let r, a, s, o = e, p, i, h;
    if (this.tokens.links) {
      const b = Object.keys(this.tokens.links);
      if (b.length > 0)
        for (; (p = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          b.includes(p[0].slice(p[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, p.index) + "[" + "a".repeat(p[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (p = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, p.index) + "[" + "a".repeat(p[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (p = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, p.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (h = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((b) => (r = b.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
        if (r = this.tokenizer.escape(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.tag(e)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && r.type === "text" && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
          continue;
        }
        if (r = this.tokenizer.link(e)) {
          e = e.substring(r.raw.length), n.push(r);
          continue;
        }
        if (r = this.tokenizer.reflink(e, this.tokens.links)) {
          e = e.substring(r.raw.length), a = n[n.length - 1], a && r.type === "text" && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
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
        if (s = e, this.options.extensions && this.options.extensions.startInline) {
          let b = 1 / 0;
          const S = e.slice(1);
          let f;
          this.options.extensions.startInline.forEach((k) => {
            f = k.call({ lexer: this }, S), typeof f == "number" && f >= 0 && (b = Math.min(b, f));
          }), b < 1 / 0 && b >= 0 && (s = e.substring(0, b + 1));
        }
        if (r = this.tokenizer.inlineText(s)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (h = r.raw.slice(-1)), i = !0, a = n[n.length - 1], a && a.type === "text" ? (a.raw += r.raw, a.text += r.text) : n.push(r);
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
class Rn {
  constructor(e) {
    G(this, "options");
    this.options = e || dt;
  }
  code(e, n, r) {
    var s;
    const a = (s = (n || "").match(/^\S*/)) == null ? void 0 : s[0];
    return e = e.replace(/\n$/, "") + `
`, a ? '<pre><code class="language-' + we(a) + '">' + (r ? e : we(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : we(e, !0)) + `</code></pre>
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
    const a = n ? "ol" : "ul", s = n && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + a + s + `>
` + e + "</" + a + `>
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
    const a = ja(e);
    if (a === null)
      return r;
    e = a;
    let s = '<a href="' + e + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + r + "</a>", s;
  }
  image(e, n, r) {
    const a = ja(e);
    if (a === null)
      return r;
    e = a;
    let s = `<img src="${e}" alt="${r}"`;
    return n && (s += ` title="${n}"`), s += ">", s;
  }
  text(e) {
    return e;
  }
}
class Vr {
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
class Pe {
  constructor(e) {
    G(this, "options");
    G(this, "renderer");
    G(this, "textRenderer");
    this.options = e || dt, this.options.renderer = this.options.renderer || new Rn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new Vr();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new Pe(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new Pe(n).parseInline(e);
  }
  /**
   * Parse Loop
   */
  parse(e, n = !0) {
    let r = "";
    for (let a = 0; a < e.length; a++) {
      const s = e[a];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = s, p = this.options.extensions.renderers[o.type].call({ parser: this }, o);
        if (p !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(o.type)) {
          r += p || "";
          continue;
        }
      }
      switch (s.type) {
        case "space":
          continue;
        case "hr": {
          r += this.renderer.hr();
          continue;
        }
        case "heading": {
          const o = s;
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, Yo(this.parseInline(o.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const o = s;
          r += this.renderer.code(o.text, o.lang, !!o.escaped);
          continue;
        }
        case "table": {
          const o = s;
          let p = "", i = "";
          for (let b = 0; b < o.header.length; b++)
            i += this.renderer.tablecell(this.parseInline(o.header[b].tokens), { header: !0, align: o.align[b] });
          p += this.renderer.tablerow(i);
          let h = "";
          for (let b = 0; b < o.rows.length; b++) {
            const S = o.rows[b];
            i = "";
            for (let f = 0; f < S.length; f++)
              i += this.renderer.tablecell(this.parseInline(S[f].tokens), { header: !1, align: o.align[f] });
            h += this.renderer.tablerow(i);
          }
          r += this.renderer.table(p, h);
          continue;
        }
        case "blockquote": {
          const o = s, p = this.parse(o.tokens);
          r += this.renderer.blockquote(p);
          continue;
        }
        case "list": {
          const o = s, p = o.ordered, i = o.start, h = o.loose;
          let b = "";
          for (let S = 0; S < o.items.length; S++) {
            const f = o.items[S], k = f.checked, g = f.task;
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
          r += this.renderer.list(b, p, i);
          continue;
        }
        case "html": {
          const o = s;
          r += this.renderer.html(o.text, o.block);
          continue;
        }
        case "paragraph": {
          const o = s;
          r += this.renderer.paragraph(this.parseInline(o.tokens));
          continue;
        }
        case "text": {
          let o = s, p = o.tokens ? this.parseInline(o.tokens) : o.text;
          for (; a + 1 < e.length && e[a + 1].type === "text"; )
            o = e[++a], p += `
` + (o.tokens ? this.parseInline(o.tokens) : o.text);
          r += n ? this.renderer.paragraph(p) : p;
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
    return r;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(e, n) {
    n = n || this.renderer;
    let r = "";
    for (let a = 0; a < e.length; a++) {
      const s = e[a];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const o = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (o !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          r += o || "";
          continue;
        }
      }
      switch (s.type) {
        case "escape": {
          const o = s;
          r += n.text(o.text);
          break;
        }
        case "html": {
          const o = s;
          r += n.html(o.text);
          break;
        }
        case "link": {
          const o = s;
          r += n.link(o.href, o.title, this.parseInline(o.tokens, n));
          break;
        }
        case "image": {
          const o = s;
          r += n.image(o.href, o.title, o.text);
          break;
        }
        case "strong": {
          const o = s;
          r += n.strong(this.parseInline(o.tokens, n));
          break;
        }
        case "em": {
          const o = s;
          r += n.em(this.parseInline(o.tokens, n));
          break;
        }
        case "codespan": {
          const o = s;
          r += n.codespan(o.text);
          break;
        }
        case "br": {
          r += n.br();
          break;
        }
        case "del": {
          const o = s;
          r += n.del(this.parseInline(o.tokens, n));
          break;
        }
        case "text": {
          const o = s;
          r += n.text(o.text);
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
    return r;
  }
}
class Ht {
  constructor(e) {
    G(this, "options");
    this.options = e || dt;
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
G(Ht, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var ct, Hr, xs;
class Ni {
  constructor(...e) {
    La(this, ct);
    G(this, "defaults", Gr());
    G(this, "options", this.setOptions);
    G(this, "parse", wn(this, ct, Hr).call(this, Re.lex, Pe.parse));
    G(this, "parseInline", wn(this, ct, Hr).call(this, Re.lexInline, Pe.parseInline));
    G(this, "Parser", Pe);
    G(this, "Renderer", Rn);
    G(this, "TextRenderer", Vr);
    G(this, "Lexer", Re);
    G(this, "Tokenizer", $n);
    G(this, "Hooks", Ht);
    this.use(...e);
  }
  /**
   * Run callback for every token
   */
  walkTokens(e, n) {
    var a, s;
    let r = [];
    for (const o of e)
      switch (r = r.concat(n.call(this, o)), o.type) {
        case "table": {
          const p = o;
          for (const i of p.header)
            r = r.concat(this.walkTokens(i.tokens, n));
          for (const i of p.rows)
            for (const h of i)
              r = r.concat(this.walkTokens(h.tokens, n));
          break;
        }
        case "list": {
          const p = o;
          r = r.concat(this.walkTokens(p.items, n));
          break;
        }
        default: {
          const p = o;
          (s = (a = this.defaults.extensions) == null ? void 0 : a.childTokens) != null && s[p.type] ? this.defaults.extensions.childTokens[p.type].forEach((i) => {
            const h = p[i].flat(1 / 0);
            r = r.concat(this.walkTokens(h, n));
          }) : p.tokens && (r = r.concat(this.walkTokens(p.tokens, n)));
        }
      }
    return r;
  }
  use(...e) {
    const n = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((r) => {
      const a = { ...r };
      if (a.async = this.defaults.async || a.async || !1, r.extensions && (r.extensions.forEach((s) => {
        if (!s.name)
          throw new Error("extension name required");
        if ("renderer" in s) {
          const o = n.renderers[s.name];
          o ? n.renderers[s.name] = function(...p) {
            let i = s.renderer.apply(this, p);
            return i === !1 && (i = o.apply(this, p)), i;
          } : n.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = n[s.level];
          o ? o.unshift(s.tokenizer) : n[s.level] = [s.tokenizer], s.start && (s.level === "block" ? n.startBlock ? n.startBlock.push(s.start) : n.startBlock = [s.start] : s.level === "inline" && (n.startInline ? n.startInline.push(s.start) : n.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (n.childTokens[s.name] = s.childTokens);
      }), a.extensions = n), r.renderer) {
        const s = this.defaults.renderer || new Rn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.renderer[p], h = s[p];
          s[p] = (...b) => {
            let S = i.apply(s, b);
            return S === !1 && (S = h.apply(s, b)), S || "";
          };
        }
        a.renderer = s;
      }
      if (r.tokenizer) {
        const s = this.defaults.tokenizer || new $n(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const p = o, i = r.tokenizer[p], h = s[p];
          s[p] = (...b) => {
            let S = i.apply(s, b);
            return S === !1 && (S = h.apply(s, b)), S;
          };
        }
        a.tokenizer = s;
      }
      if (r.hooks) {
        const s = this.defaults.hooks || new Ht();
        for (const o in r.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.hooks[p], h = s[p];
          Ht.passThroughHooks.has(o) ? s[p] = (b) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, b)).then((f) => h.call(s, f));
            const S = i.call(s, b);
            return h.call(s, S);
          } : s[p] = (...b) => {
            let S = i.apply(s, b);
            return S === !1 && (S = h.apply(s, b)), S;
          };
        }
        a.hooks = s;
      }
      if (r.walkTokens) {
        const s = this.defaults.walkTokens, o = r.walkTokens;
        a.walkTokens = function(p) {
          let i = [];
          return i.push(o.call(this, p)), s && (i = i.concat(s.call(this, p))), i;
        };
      }
      this.defaults = { ...this.defaults, ...a };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, n) {
    return Re.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return Pe.parse(e, n ?? this.defaults);
  }
}
ct = new WeakSet(), Hr = function(e, n) {
  return (r, a) => {
    const s = { ...a }, o = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const p = wn(this, ct, xs).call(this, !!o.silent, !!o.async);
    if (typeof r > "u" || r === null)
      return p(new Error("marked(): input parameter is undefined or null"));
    if (typeof r != "string")
      return p(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(r) + ", string expected"));
    if (o.hooks && (o.hooks.options = o), o.async)
      return Promise.resolve(o.hooks ? o.hooks.preprocess(r) : r).then((i) => e(i, o)).then((i) => o.hooks ? o.hooks.processAllTokens(i) : i).then((i) => o.walkTokens ? Promise.all(this.walkTokens(i, o.walkTokens)).then(() => i) : i).then((i) => n(i, o)).then((i) => o.hooks ? o.hooks.postprocess(i) : i).catch(p);
    try {
      o.hooks && (r = o.hooks.preprocess(r));
      let i = e(r, o);
      o.hooks && (i = o.hooks.processAllTokens(i)), o.walkTokens && this.walkTokens(i, o.walkTokens);
      let h = n(i, o);
      return o.hooks && (h = o.hooks.postprocess(h)), h;
    } catch (i) {
      return p(i);
    }
  };
}, xs = function(e, n) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const a = "<p>An error occurred:</p><pre>" + we(r.message + "", !0) + "</pre>";
      return n ? Promise.resolve(a) : a;
    }
    if (n)
      return Promise.reject(r);
    throw r;
  };
};
const lt = new Ni();
function F(t, e) {
  return lt.parse(t, e);
}
F.options = F.setOptions = function(t) {
  return lt.setOptions(t), F.defaults = lt.defaults, cs(F.defaults), F;
};
F.getDefaults = Gr;
F.defaults = dt;
F.use = function(...t) {
  return lt.use(...t), F.defaults = lt.defaults, cs(F.defaults), F;
};
F.walkTokens = function(t, e) {
  return lt.walkTokens(t, e);
};
F.parseInline = lt.parseInline;
F.Parser = Pe;
F.parser = Pe.parse;
F.Renderer = Rn;
F.TextRenderer = Vr;
F.Lexer = Re;
F.lexer = Re.lex;
F.Tokenizer = $n;
F.Hooks = Ht;
F.parse = F;
F.options;
F.setOptions;
F.use;
F.walkTokens;
F.parseInline;
Pe.parse;
Re.lex;
const ks = "question-modal", Ha = "question_modal", Nr = 3, Ua = "gate-v2@2026.10.21";
function Ne() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Ai() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Xe() {
  return Ne().antd || {};
}
function Ii() {
  return Ne().antdIcons || {};
}
const zi = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Ar(t) {
  const e = Ii();
  for (const n of zi) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Oi() {
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
      // US-005: 释放阻塞 🔒 icon hover（对齐 demo 的 iconbtn.warn:hover：
      // 边框转 warning 实色；内联样式无法表达 :hover）。
      ".qm-release-lock:hover{color:var(--app-warning-text,#d46b08)!important;",
      "border-color:var(--app-warning,#d46b08)!important}",
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
      // US-006: 第二行控件区右对齐（demo v5 形态）。
      ".qm-actions{flex:1 1 100%!important;flex-wrap:wrap!important;",
      "justify-content:flex-end!important;gap:6px!important}",
      // The analysis bubble was a fixed 460px, which cannot fit a phone.
      ".qm-bubble{width:auto!important;min-width:0!important;",
      "max-width:calc(100vw - 32px)!important}",
      // Footer keeps its four actions on one or two rows without squashing.
      ".qm-footer{flex-wrap:wrap!important;row-gap:8px!important}",
      // US-006: 窄屏下底部两键均分可用宽度（上一步 / 下一步·提交各占一半）。
      // 「上一步」的内联 marginRight:"auto" 在均分布局下必须归零。
      ".qm-footer button{flex:1 1 0!important;min-width:0!important}",
      ".qm-footer button:first-child{margin-right:0!important}",
      // US-006: header 弹出层（更多菜单 / 上下文气泡 / 模板选择 / 跳过确认 /
      // 模式下拉）统一挂 .qm-hdr-pop 类；窄屏下宽度封顶为视口减两侧边距，
      // 面板贴 right:0 与卡片右缘对齐，max-width 兜住不溢出屏幕。
      ".qm-hdr-pop{max-width:calc(100vw - 24px);z-index:10000}",
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
      // US-007：时段卡字段网格窄屏单列；名称不再限宽
      ".qm-set-schedgrid{grid-template-columns:1fr}",
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
      ".qm-set-schedfield{display:flex;flex-direction:column;gap:4px;min-width:0}",
      ".qm-set-schedfieldlabel{font-size:11px;color:var(--app-text-tertiary,#94a3b8)}",
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
      "border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.1)}",
      ".qm-set-schedadd{align-self:flex-start;margin-top:2px}",
      // ── 自定义 API 通知卡（US-008，纯 UI 占位）──
      // 卡容器/网格/字段复用 .qm-set-sched*（demo v5 同一卡形态），
      // 这里只补 API 卡特有元素：标题徽标 / 启用开关 / 测试按钮。
      ".qm-set-apicard{margin-top:14px}",
      ".qm-set-apititle{font-size:13px;font-weight:600;color:var(--app-text-primary,#1e293b);",
      "display:inline-flex;align-items:center}",
      // 「新增渠道」徽标 = demo v5 内联样式（accent 底白字小圆角）
      ".qm-set-apibadge{display:inline-block;font-size:10px;font-weight:700;color:#fff;",
      "background:var(--app-accent,#3b82f6);border-radius:4px;padding:1px 6px;",
      "margin-left:8px;vertical-align:2px}",
      // 启用开关 = demo .switch 形态（34×19 胶囊 + 滑动白点），纯演示可点击
      ".qm-set-apiswitch{flex:0 0 auto;margin-left:auto;position:relative;width:34px;",
      "height:19px;border-radius:10px;border:none;padding:0;cursor:pointer;",
      "background:#d9d9d9;transition:background .2s}",
      ".qm-set-apiswitch.on{background:var(--app-accent,#3b82f6)}",
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
      ".qm-set-apitest:hover{border-color:var(--app-accent,#3b82f6);",
      "color:var(--app-accent,#3b82f6)}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function L(t) {
  try {
    const e = Ne();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Wn = "", vs = "";
function Yr(t, e) {
  t && (vs = t), e && (Wn = e);
}
function B() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = Ne(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Wn), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function Kt() {
  try {
    const e = Ne();
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
  return vs;
}
globalThis.__qmSessionProbe = Kt;
let Ga = null;
function $i() {
  if (Ga) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (Ga = t.setInterval(() => {
    try {
      fetch(L("/heartbeat"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ session_id: Kt() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
$i();
function Pt() {
  try {
    const t = Ne(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Wn;
}
const Ir = {};
async function Mi(t, e, n) {
  if (typeof window > "u" || Ir[t]) return "skipped";
  try {
    const s = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return Ir[t] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  Ir[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", a = window.Notification;
  if (!a) return "inpage";
  try {
    if (a.permission === "default" && await new Promise((p) => {
      let i = !1;
      const h = (b) => {
        i || (i = !0, p(b));
      };
      try {
        const b = a.requestPermission((S) => h(S));
        b && typeof b.then == "function" && b.then(h).catch(() => h("denied"));
      } catch {
        h("denied");
      }
      setTimeout(() => h(a.permission || "denied"), 8e3);
    }) !== "granted" || a.permission !== "granted") return "inpage";
    const s = new a("问卷等待作答", { body: r, tag: "qm-" + t, renotify: !1 });
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
function ae(t) {
  const e = Ut(t);
  return e && e.session_id ? e.session_id : Kt();
}
const zr = 180, Ri = 20, ws = 6e3, Pi = 60, Li = 8;
function Bi() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const ji = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function Ja(t) {
  try {
    return String(t || "").replace(ji, "").length;
  } catch {
    return 0;
  }
}
function Za(t) {
  const e = Bi();
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
    r = Ja((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - Ja(n.textContent);
}
function Di(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右上角 🔒 释放阻塞" : "⏳ 已提交，模型处理中";
}
function Fi(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function Ka(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: ws });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const Wi = "qm:v1:analysis:global", Hi = "qm:v1:analysis:", Ui = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Lt(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function Gi(t) {
  if (!t || typeof t != "object") return { ...Ui };
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
function Ji() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(Hi) === 0 && n !== Wi && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function Zi() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: B() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : Gi(e.prefs);
  } catch {
    return null;
  }
}
async function ea() {
  try {
    const t = await fetch(L("/question-modal/templates"), { headers: B() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function _n(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(L("/question-modal/survey-action"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Dn()
      })
    }), a = await r.json().catch(() => ({}));
    return r.ok ? {
      accepted: a.accepted !== !1,
      reason: String(a.reason || ""),
      state: a.state || null
    } : null;
  } catch {
    return null;
  }
}
async function Ki(t) {
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
function Qi(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, a = 0, s = null, o = 0, p = !1, i = 0, h = 0, b = null;
  const S = (g) => {
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
        }, fetch(y, x).then(async (T) => {
          const E = Sl(T);
          if (!T.ok || !T.body || E) {
            if (T.status === 404 || T.status === 501 || T.status === 405) {
              p = !0, S(!1);
              return;
            }
            throw E && (i += 1), new Error(E ? "blocked" : "HTTP " + T.status);
          }
          a = 0, i = 0, S(!0);
          const v = T.body.getReader(), q = new TextDecoder();
          let $ = "";
          const _ = () => {
            v.read().then(({ done: C, value: M }) => {
              if (C) {
                k();
                return;
              }
              $ += q.decode(M, { stream: !0 });
              let U;
              for (; (U = $.indexOf(`

`)) >= 0; ) {
                const Y = $.slice(0, U);
                $ = $.slice(U + 2), Y.split(`
`).forEach((H) => {
                  if (!H.startsWith("data: ")) return;
                  let R = null;
                  try {
                    R = JSON.parse(H.slice(6));
                  } catch {
                    return;
                  }
                  R && (R.kind === "snapshot" ? (o = Math.max(o, parseInt(R.rev || 0, 10) || 0), e.onSnapshot(o, R.state || null)) : R.kind === "change" && (o = Math.max(o, parseInt(R.rev || 0, 10) || 0), e.onChange(R)));
                });
              }
              n || _();
            }).catch(() => {
              k();
            });
          };
          _();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (n || p)
      return;
    if (S(!1), i += 1, h || (h = Date.now()), i >= zs) {
      if (Date.now() - (h || Date.now()) >= $s) {
        p = !0, S(!1);
        return;
      }
      s = setTimeout(f, Os);
      return;
    }
    a = Math.min(a + 1, 6);
    const g = Math.min(1e4, 500 * Math.pow(2, a));
    s = setTimeout(f, g);
  };
  return f(), () => {
    if (n = !0, s)
      try {
        clearTimeout(s);
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
async function Or(t, e, n) {
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
let qs = null;
async function Gt(t, e, n, r) {
  const a = t || "", s = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  try {
    const o = L(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(a) + s
    ), p = await fetch(o, { headers: B() });
    if (!p.ok) return null;
    const i = await p.json();
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
    return qs = { chatId: a, at: Date.now(), data: h }, h;
  } catch {
    return null;
  }
}
function Ss() {
  qs = null;
}
async function Hn() {
  const t = await fetch(
    L("/question-modal/stale-surveys"),
    { headers: B() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Un(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function Ur(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function ta(t) {
  const e = await fetch(L("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function Xi(t) {
  const e = await fetch(L("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function Vi() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", z();
  const t = Date.now();
  try {
    const e = await Hn();
    Un(e), c.stale.page = 0, c.stale.resPage = 0;
    const n = c.stale.rows.length, r = c.stale.blocking.length, a = c.stale.residual.length, s = c.stale.exceeded.length, o = c.stale.within.length, p = Date.now() - t;
    c.stale.msgKind = "ok";
    const i = Ur(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${a} 条；已超阈值 ${s} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${p}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${p}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.blocking = [], c.stale.residual = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, z();
  }
}
async function $r(t, e = "释放") {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const n = await ta({ tool_call_ids: t }), r = Number(n && n.released) || 0, a = Number(n && n.already) || 0, s = Number(n && n.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `${e} ${r} 条，${s} 条未成功（见日志）` + (a ? `；${a} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (a ? `；${a} 条此前已处理` : "") : `无需${e}：${a || t.length} 条此前已处理`;
    const o = await Hn();
    Un(o);
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function Yi() {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const t = await ta({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, a = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = a === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${a} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const s = await Hn();
    Un(s);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function el() {
  const t = (c.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    c.stale.msgKind = "info", c.stale.msg = "当前没有可清理的残留问卷", z();
    return;
  }
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await ta({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, a = Number(e && e.failed) || 0;
    c.stale.msgKind = a > 0 ? "warn" : "ok", c.stale.msg = a > 0 ? `清理 ${n} 条，${a} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const s = await Hn();
    Un(s), c.stale.resPage = 0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function tl(t) {
  c.stale.busy = !0, c.stale.msg = "", z();
  try {
    const e = await Xi(t), n = e && e.results || [], r = n.filter((s) => s && s.stopped).length, a = n.filter((s) => s && !s.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (a ? `；${a} 个会话已不存在` : "") : `${a} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, z();
  }
}
async function _s(t) {
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
async function Es(t) {
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
async function Cs() {
  try {
    const t = await fetch(L("/models"), { headers: B() });
    if (!t.ok) return [];
    const e = await t.json();
    return (Array.isArray(e) ? e : []).filter((r) => {
      const s = [...r.models || [], ...r.extra_models || []].length > 0, o = !!r.api_key || r.require_api_key === !1 || r.is_local || r.is_custom;
      return s && o;
    });
  } catch {
    return [];
  }
}
function nl(t) {
  if (!t) return "";
  try {
    return String(F.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function j(t, e) {
  try {
    const n = Xe().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const be = "__other__";
function Te(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function wt(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Mr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((a) => {
    if (n && n.has(a) || !Object.prototype.hasOwnProperty.call(r, a)) return;
    const s = e[a];
    !s || typeof s != "object" || !wt(r[a]) && wt(s) && (r[a] = { ...s });
  }), r;
}
function Qa(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function Xa(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((a) => Number(a && a.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function rl(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), a = Te(e), s = Le(e), o = r(a), p = r(s);
  return n.some((i) => {
    const h = r(i);
    return h ? !!(i === a || i === s || h === o || h === p || Math.min(h.length, o.length, p.length) >= 4 && (h.length >= 4 && (o.includes(h) || h.includes(o)) || h.length >= 4 && (p.includes(h) || h.includes(p)))) : !1;
  });
}
function oe(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let Ts = !0;
function Pn(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (Ts ? "第 " + (e + 1) + " 题" : "");
}
function Le(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function al(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (s) => {
    s != null && s !== "" && n.add(String(s));
  }, a = t.options || [];
  if (oe(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const p = a.find((i) => Te(i) === String(o));
      p && r(Le(p)), String(o) === be && e.other && r(e.other);
    });
  else {
    r(e.value);
    const s = a.find((o) => Te(o) === String(e.value));
    s && r(Le(s)), String(e.value) === be && e.other && r(e.other);
  }
  return n;
}
function sl(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const a = String(r);
    if (a.startsWith("=")) return e.has(a.slice(1));
    if (e.has(a)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(a) !== -1 || a.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Ns(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const a = parseInt(n[1], 10);
    if (a >= 0 && a < e.length) return a;
  }
  return e.findIndex((a) => (a.title || "").trim() === t.trim());
}
function As(t, e, n) {
  const r = e[t], a = r && r.showIf;
  if (!a || typeof a != "object" || !Object.keys(a).length) return !0;
  for (const s of Object.keys(a)) {
    const o = Ns(s, e);
    if (o < 0) continue;
    const p = e[o];
    if (!p) continue;
    if (p.showIf && !As(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !sl(a[s], al(p, i))) return !1;
  }
  return !0;
}
function Ue(t, e) {
  const n = [];
  return t.forEach((r, a) => {
    As(a, t, e) && n.push(a);
  }), n;
}
function ol(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function En(t) {
  return Array.isArray(t.questions);
}
function il(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function ll(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((a) => a && (a.text || a.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function cl(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function dl(t) {
  if (!t) return "";
  const e = String(t).split(`
`).map((r) => r.trim()).filter(Boolean);
  for (let r = e.length - 1; r >= 0; r--) {
    const a = e[r];
    if (/系统自动释放|系统自动跳过|问卷已跳过|用户跳过了本次问卷|用户手动释放阻塞|跳过原因/.test(a) && !/^\{/.test(a) && !/^\s*"skipped"/.test(a) && a.length < 400)
      return a.replace(/^【|】$/g, "").trim();
  }
  const n = String(t).match(/"reason"\s*:\s*"([^"]{1,120})"/);
  return n && n[1] && n[1] !== "timeout" ? n[1] : "";
}
function Bt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const a = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${a === "watchdog" ? "系统自动释放" : a === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + On(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((a) => {
    const s = n[a];
    if (!s || typeof s != "object") return;
    const o = Ns(a, t), p = o >= 0 ? t[o] : null, i = p ? oe(p) === "single" ? "单选" : oe(p) === "multi" ? "多选" : "问答" : "问答", h = p ? Pn(p, o) : a;
    let b = s.value;
    if (Array.isArray(b) && (b = b.join("、")), s.other && (b = (b ? b + "、" : "") + s.other), s.skipped) {
      const S = String(s.skipped_by || ""), f = S === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : S === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${a} [${i}] ${h}${f}`);
    } else
      r.push(`- ${a} [${i}] ${h}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function pl(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      L("/question-modal/resolve") + "?" + n.toString(),
      { headers: B() }
    );
    if (!r.ok) return { kind: "error" };
    const a = await r.json();
    return a && Yr(a.session_id, a.agent_id), a && a.found ? { kind: "found", data: a } : a && a.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function jt(t) {
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
async function ul(t) {
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
      const s = await r.text().catch(() => "");
      let o = "HTTP " + r.status;
      try {
        const p = JSON.parse(s);
        p && p.detail && (o = p.detail);
      } catch {
      }
      return { ok: !1, error: `${t.name}: ${o}` };
    }
    const a = await r.json();
    return !a || !a.url ? { ok: !1, error: `${t.name}: 上传响应缺少 url` } : {
      ok: !0,
      att: { url: String(a.url), file_name: String(a.file_name || t.name), size: a.size }
    };
  } catch (e) {
    return { ok: !1, error: `${t.name}: ${e && e.message || e}` };
  }
}
const Ln = "qm:v1:stash_att:", Va = 25 * 1024 * 1024, In = /* @__PURE__ */ new Map(), zn = /* @__PURE__ */ new Map();
let Bn = null, jn = 0, Rr = null;
function Ya() {
  const t = jn > 0;
  zn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function fl() {
  if (Rr) return Rr;
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
    const r = Bn;
    Bn = null, !(!r || !n.length) && await Is(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Rr = t, t;
}
function ml(t, e, n) {
  if (!t) {
    j("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Bn = { callId: t, target: e, key: n };
  const r = fl();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (Bn = null);
}
async function Is(t, e, n, r) {
  jn += 1, Ya();
  const a = [], s = [];
  try {
    for (const p of t) {
      if (p.size && p.size > Va) {
        s.push(`${p.name}: 文件过大（上限 ${Math.round(Va / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await ul(p);
      i.ok ? a.push(i.att) : s.push(i.error);
    }
  } finally {
    jn -= 1, Ya();
  }
  const o = In.get(e);
  if (a.length || s.length) {
    const p = n === "final" ? "final" : "q";
    if (!e) {
      j(
        "error",
        "附件未生效：未能绑定到本次问卷（缺少工具调用标识）。请刷新页面后重试。"
      );
      return;
    }
    if (o)
      try {
        o(a, p, r, s);
      } catch {
      }
    else a.length && gl(e, a, p, r);
  }
}
function gl(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const a = localStorage.getItem(Ln + t), s = a ? JSON.parse(a) : [], o = (Array.isArray(s) ? s : []).concat(
        e.map((p) => ({ att: p, target: n, key: r }))
      );
      localStorage.setItem(Ln + t, JSON.stringify(o));
    } catch {
    }
}
function hl(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(Ln + t);
    if (!e) return [];
    localStorage.removeItem(Ln + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function bl(t) {
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
function yl(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Pr(t, e) {
  const n = e || ae(t), r = Ut(t), a = r && r.request_id ? r.request_id : "";
  if (a)
    try {
      const s = await fetch(L("/question-modal/skip"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ request_id: a, session_id: n || "" })
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
        { method: "POST", headers: B() }
      );
      if (s.ok) {
        const o = await s.json().catch(() => ({})), p = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return he(t), { ok: !0, released: p > 0, reason: p > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function es(t) {
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
async function xl(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      L("/question-modal/pending") + e,
      { headers: B() }
    );
    if (!n.ok) return null;
    const r = await n.json(), a = r && r.items || [];
    if (!Array.isArray(a) || a.length !== 1) return null;
    const s = a[0];
    if (!s || !s.request_id) return null;
    const o = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(s.request_id),
      { headers: B() }
    );
    if (!o.ok) return null;
    const p = await o.json();
    return p && Yr(p.session_id, p.agent_id), p && p.found ? p : null;
  } catch {
    return null;
  }
}
const Gn = "qm:v1:reqid:", kl = 3e4, vl = 45e3, zs = 6, Os = 6e4, $s = 15 * 6e4, wl = 700, ql = 8;
function Sl(t) {
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
      localStorage.removeItem(Gn + t);
    } catch {
    }
}
function _l() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(Gn) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((a) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(a) || "null");
      } catch {
        s = null;
      }
      !s || !s.request_id || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(a) : n.push(a);
    });
    const r = 50;
    if (n.length <= r) return;
    n.map((a) => ({ k: a, ts: (JSON.parse(localStorage.getItem(a) || "{}") || {}).ts || 0 })).sort((a, s) => a.ts - s.ts).slice(0, n.length - r).forEach((a) => localStorage.removeItem(a.k));
  } catch {
  }
}
function El(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Gn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), _l();
    } catch {
    }
}
function Ut(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Gn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (he(t), null) : n;
  } catch {
    return null;
  }
}
const na = "qm:v1:state:";
function Ft(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(na + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Dn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const Ms = Dn(), ts = "qm:v1:sessionprefs-ping";
function ot(t, e) {
  if (t)
    try {
      const r = { ...Ft(t) || {}, ...e, ts: Date.now(), origin: Ms };
      localStorage.setItem(na + t, JSON.stringify(r)), Cl();
    } catch {
    }
}
function Cl() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(na) === 0 && t.push(s);
    }
    const e = 7 * 24 * 3600 * 1e3, n = [];
    t.forEach((a) => {
      let s = null;
      try {
        s = JSON.parse(localStorage.getItem(a) || "null");
      } catch {
        s = null;
      }
      !s || !s.ts || Date.now() - s.ts > e ? localStorage.removeItem(a) : n.push(a);
    });
    const r = 80;
    if (n.length <= r) return;
    n.map((a) => ({ k: a, ts: (JSON.parse(localStorage.getItem(a) || "{}") || {}).ts || 0 })).sort((a, s) => a.ts - s.ts).slice(0, n.length - r).forEach((a) => localStorage.removeItem(a.k));
  } catch {
  }
}
async function Tl(t) {
  try {
    const e = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: B() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && Yr(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Nl(t, e, n, r) {
  const a = ["【用户提交的问卷答案】"], s = new Set(Ue(t, e));
  return t.forEach((o, p) => {
    if (!s.has(p)) return;
    const i = e[`q${p}`];
    if (!i) return;
    let h = i.value;
    if (Array.isArray(h))
      h = h.filter((y) => y !== be).map((y) => {
        const x = (o.options || []).find((O) => Te(O) === String(y));
        return x ? Le(x) : y;
      }).join("、");
    else {
      const y = (o.options || []).find((x) => Te(x) === String(h));
      y && (h = Le(y)), String(i.value) === be && (h = "");
    }
    const b = oe(o) === "single" ? "单选" : oe(o) === "multi" ? "多选" : "问答", S = !!String(h || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), f = String(i.skipped_by || ""), k = i.skipped ? f === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : f === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : S ? h : "（未作答）";
    let g = `- q${p} [${b}] ${k}`;
    i.other && !i.skipped && (g += `（其他：${i.other}）`), i.attachments && i.attachments.length && (g += `（附件：${i.attachments.map((y) => y.file_name).join("、")}）`), a.push(g);
  }), n && a.push(`- 其他意见：${n}`), r && r.length && a.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), a.join(`
`);
}
function Al(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const a = r.value;
    if (Array.isArray(a) ? a.length === 1 && a[0] === be : String(a ?? "") === be) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const Il = ["必须", "务必", "不得为空", "不能为空"], zl = ["可为空", "可留空", "选填", "可选", "非必填"];
function Rs(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Il.some((n) => e.indexOf(n) !== -1) ? !1 : zl.some((n) => e.indexOf(n) !== -1);
}
function Ol(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = Ue(t, n);
  } catch {
    return n;
  }
  return r.forEach((a) => {
    const s = t[a];
    if (!Rs(s)) return;
    const o = `q${a}`, p = n[o];
    if (p && (p.skipped === !0 || wt(p))) return;
    const i = oe(s);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function On(t) {
  return t.map((e, n) => {
    const r = oe(e) === "single" ? "单选" : oe(e) === "multi" ? "多选" : "问答", a = (e.options || []).map(Le).join("、");
    return `${n + 1}. [${r}] ${Pn(e, n)}${a ? "（" + a + "）" : ""}`;
  }).join(`
`);
}
function Lr(t) {
  const { R: e, files: n, disabled: r, uploading: a, error: s, onPick: o, onRemove: p } = t, i = {
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
    cursor: r || a ? "default" : "pointer",
    background: "transparent",
    border: "1px dashed var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    opacity: r || a ? 0.6 : 1
  };
  return e.createElement(
    "div",
    {
      style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }
    },
    n.map((b, S) => e.createElement(
      "span",
      { key: "att" + S, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: b.file_name
      }, b.file_name + (b.size ? "（" + yl(b.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || p(S);
        }
      }, "×")
    )),
    e.createElement("button", {
      type: "button",
      disabled: r || a,
      style: h,
      title: "与输入框相同的附件限制（也可直接粘贴）",
      onClick: o
    }, a ? "上传中…" : "📎 附件"),
    s ? e.createElement("span", {
      "data-qm-att-error": "true",
      style: { fontSize: 12, color: "var(--app-danger-text, #d4380d)", maxWidth: 320 }
    }, "附件失败：" + s) : null
  );
}
function $l(t) {
  const {
    R: e,
    providers: n,
    modelId: r,
    onChange: a,
    disabled: s,
    open: o,
    onOpenChange: p,
    tab: i,
    onTabChange: h
  } = t, S = Xe().Popover, f = [];
  n.forEach((_) => {
    [..._.models || [], ..._.extra_models || []].forEach((C) => {
      f.push({
        providerId: _.id,
        providerName: _.name || _.id,
        modelId: C.id,
        modelName: C.name || C.id,
        free: !!C.is_free
      });
    });
  });
  const k = f.find((_) => `${_.providerId}:${_.modelId}` === r), y = k ? k.modelName : r || "选择模型", x = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", O = {
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
  }, T = f.filter((_) => _.free).length, E = f.length - T, v = [];
  n.forEach((_) => {
    const C = [..._.models || [], ..._.extra_models || []].map((M) => ({
      providerId: _.id,
      providerName: _.name || _.id,
      modelId: M.id,
      modelName: M.name || M.id,
      free: !!M.is_free
    })).filter((M) => i === "free" ? M.free : !M.free);
    C.length && v.push({ id: _.id, name: _.name || _.id, models: C });
  });
  const q = (_, C) => e.createElement("button", {
    key: _,
    type: "button",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "5px 12px",
      border: "none",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: i === _ ? "var(--app-bg-container, #fff)" : "transparent",
      color: i === _ ? "var(--app-text, inherit)" : "var(--app-text-secondary, inherit)",
      fontWeight: i === _ ? 600 : 400,
      boxShadow: i === _ ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
      whiteSpace: "nowrap",
      fontFamily: "inherit"
    },
    onClick: () => h(_)
  }, C), $ = e.createElement(
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
      q("paid", "付费 🟡 " + E),
      q("free", "免费 🟢 " + T)
    ),
    v.length ? e.createElement("div", null, v.map((_, C) => (
      // 厂商循环色状态点（蓝 → 橙 → 蓝…），与 prompt-forge 一致
      e.createElement(
        "div",
        {
          key: _.id,
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
          e.createElement("span", { style: { flex: 1 } }, _.name),
          e.createElement("span", { style: { fontWeight: 400 } }, _.models.length)
        ),
        _.models.map((M) => {
          const U = `${M.providerId}:${M.modelId}` === r;
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
                borderLeft: "3px solid " + (U ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: U ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                a(`${M.providerId}:${M.modelId}`), p(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: C % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
  return S ? e.createElement(S, {
    content: $,
    trigger: "click",
    open: o,
    onOpenChange: p,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: O,
      disabled: s,
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
      style: O,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const _ = f.find((C) => `${C.providerId}:${C.modelId}` !== r);
        _ && a(`${_.providerId}:${_.modelId}`);
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
function Ml(t) {
  const { R: e, mode: n, onChange: r, disabled: a, open: s, onOpenChange: o, popRef: p } = t, i = {
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
    cursor: a ? "default" : "pointer",
    maxWidth: 170,
    overflow: "hidden",
    whiteSpace: "nowrap"
  }, S = e.createElement(
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
        disabled: a,
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
          cursor: a ? "default" : "pointer",
          padding: "7px 9px",
          borderRadius: 6,
          border: "none",
          // US-010: 选中项淡 accent 底色（boss 反馈 4：选中项要一眼可辨）；
          // 未选中项保持透明底 + CSS hover 高亮（.qm-mode-opt:hover）。
          background: g ? "var(--app-accent-bg, rgba(255,127,22,0.08))" : "transparent",
          color: g ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: g ? 600 : 400
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
        e.createElement("span", null, i[k]),
        // US-010: 选中项右侧 accent 色 ✓ 勾，强化「当前选中」辨识度。
        g ? e.createElement("span", {
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
      }, h[k])
    );
  };
  return e.createElement(
    "div",
    {
      ref: p,
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
        disabled: a,
        style: b,
        title: "运行选择：" + i[n],
        onClick: () => o(!s)
      },
      S,
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis" }
      }, i[n]),
      e.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
      }, "▾")
    ),
    s ? e.createElement(
      "div",
      {
        role: "menu",
        className: "qm-hdr-pop",
        style: {
          position: "absolute",
          top: 30,
          right: 0,
          zIndex: 1e4,
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
function Rl(t) {
  const { R: e, templates: n, value: r, onSelect: a, onManage: s } = t;
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
        onClick: () => a(o.id)
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
      o.id === r ? e.createElement("span", {
        "aria-hidden": "true",
        style: {
          flex: "none",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--app-accent, #1677ff)"
        }
      }, "✓") : null
    )),
    e.createElement("div", {
      style: {
        padding: "6px 12px",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--app-accent, #1677ff)",
        borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.18))"
      },
      onClick: () => s()
    }, "＋ 管理模板…")
  );
}
function Pl(t) {
  const { R: e, open: n, templates: r, value: a, edit: s, onEditChange: o, onClose: p, onSelect: i, onSave: h, onDelete: b } = t;
  if (!n) return null;
  const S = Xe(), { Input: f, Modal: k } = S, g = {
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
  }, x = !!s, O = (E, v, q, $) => f && f.TextArea ? e.createElement(f.TextArea, {
    value: E,
    rows: q,
    placeholder: $,
    onChange: (_) => v(_ && _.target ? _.target.value : "")
  }) : e.createElement("textarea", {
    value: E,
    rows: q,
    placeholder: $,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (_) => v(_ && _.target ? _.target.value : ""),
    onChange: (_) => v(_ && _.target ? _.target.value : "")
  }), T = e.createElement(
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
        x ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: y, onClick: p }, "关闭")
    ),
    x ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      O(s.name || "", (E) => o({ ...s, name: E }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      O(s.system || "", (E) => o({ ...s, system: E }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      O(s.user || "", (E) => o({ ...s, user: E }), 6, "用户提示词模板"),
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
          onClick: () => h(s)
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
        (E) => e.createElement(
          "div",
          {
            key: E.id,
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
            E.name + (E.builtin ? "（内置）" : "") + (E.id === a ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: y,
            title: "设为本题使用",
            onClick: () => i(E.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => o({
              id: E.id,
              name: E.name,
              system: E.system,
              user: E.user
            })
          }, "编辑"),
          E.builtin ? null : e.createElement("button", {
            type: "button",
            style: y,
            onClick: () => b(E.id)
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
    onCancel: p,
    destroyOnClose: !0,
    width: "min(620px, 92vw)",
    zIndex: 1200,
    style: { maxWidth: "92vw" },
    wrapClassName: "qm-tpl-modal"
  }, T) : T;
}
function Ll(t) {
  const {
    R: e,
    busy: n,
    result: r,
    error: a,
    mode: s,
    onRun: o,
    onApply: p,
    onCancel: i,
    onRerun: h,
    disabled: b,
    children: S,
    open: f,
    onOpenChange: k
  } = t, y = Xe().Popover, x = e.createElement("button", {
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
    title: s === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : s === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
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
      }, String((r.per_question || []).map((v) => v.reasoning).join(`

`))) : null
    );
  const O = !!(r && (r.per_question || []).length), T = (v, q, $) => e.createElement("button", {
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
  }, v), E = e.createElement(
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
    a ? e.createElement("div", {
      style: { padding: 8, fontSize: 12, color: "var(--app-danger-text, #d4380d)" }
    }, a) : null,
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
        O && !n ? e.createElement("button", {
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
        O && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: O ? 6 : "auto",
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
            p(), k(!1);
          }
        }, "套用推荐") : null
      ),
      (r.per_question || []).map((v) => e.createElement(
        "div",
        { key: v.index, style: { marginBottom: 14 } },
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
          }, v.title),
          v.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + v.choice) : null,
          typeof v.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(v.confidence <= 1 ? v.confidence * 100 : v.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: nl(v.reasoning || "") }
        })
      ))
    ) : n || a ? null : e.createElement(
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
    }, S)
  );
  return e.createElement(y, {
    content: E,
    trigger: "click",
    open: f,
    onOpenChange: k,
    placement: "bottomRight"
  }, x);
}
function Bl(t) {
  const e = Ne().React, n = Xe(), { Input: r, Button: a } = n, s = r.TextArea, o = t.data || {}, p = ol(o), i = il(o), h = ll(o), b = cl(h), S = b ? "" : h, f = p.questions || [], k = p.title || "问卷", g = Ft(i), [y, x] = e.useState(
    () => !!(g && g.answered) || !!S || b
  ), [O, T] = e.useState(""), [E, v] = e.useState(() => {
    const l = Ut(i);
    return l && l.request_id ? l.request_id : g && typeof g.reqId == "string" ? g.reqId : "";
  }), [q, $] = e.useState(
    () => g && typeof g.visStep == "number" && g.visStep >= 0 ? g.visStep : 0
  ), [_, C] = e.useState(
    () => g && typeof g.slowAt == "number" ? g.slowAt : 0
  ), [M, U] = e.useState(
    () => g && typeof g.slowStep == "number" ? g.slowStep : -1
  ), [Y, H] = e.useState(
    () => !!(g && g.slowFired === !0)
  ), [R, Z] = e.useState(() => {
    const l = {};
    f.forEach((m, u) => {
      l[`q${u}`] = { type: oe(m), value: oe(m) === "multi" ? [] : "", other: "" };
    });
    const d = g && g.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((m) => {
      l[m] && (l[m] = { ...l[m], ...d[m] });
    }), l;
  }), [Ge, Qt] = e.useState(
    () => g && typeof g.finalOther == "string" ? g.finalOther : ""
  ), [D, Ae] = e.useState(!1), [I, qe] = e.useState(
    () => g && typeof g.releasedNote == "string" ? g.releasedNote : ""
  ), [ie, K] = e.useState(
    () => g && typeof g.localResult == "string" ? g.localResult : ""
  ), [Q, ye] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(g && g.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(S || "")
  ), [X, ze] = e.useState(
    () => (g && typeof g.skipReason == "string" ? g.skipReason : "") || dl(S || "")
  ), [le, xe] = e.useState(
    () => g && Array.isArray(g.finalOtherAtt) ? g.finalOtherAtt : []
  ), [ue, Be] = e.useState(
    () => !!(g && g.expanded)
  ), [Je, pt] = e.useState(!1), qt = e.useRef(0), [Se, Fs] = e.useState(
    () => g && typeof g.deadReason == "string" ? g.deadReason : ""
  ), [Ve, St] = e.useState(
    () => g && typeof g.gateBlocked == "string" ? g.gateBlocked : ""
  ), [ut, Jn] = e.useState(
    () => g && typeof g.submittedAt == "number" ? g.submittedAt : 0
  ), [Zn, Kn] = e.useState(
    () => !!(g && g.pastSoft === !0)
  ), [_t, Xt] = e.useState(
    () => !!(g && g.waitRetired === !0)
  ), Et = e.useRef(
    !!(g && typeof g.submittedAt == "number" && g.submittedAt > 0 && Date.now() - g.submittedAt < zr * 1e3)
  ), Ye = e.useRef(!1), Vt = e.useRef(!!(g && g.pastSoft === !0)), [Qn, Ws] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), Hs = e.useRef(Qn), sa = (l) => {
    Hs.current = l, Ws(l);
  }, fe = (l, d) => {
    const m = Qn[l];
    return m ?? d;
  };
  Ts = !!fe("fallback_title", !0);
  const oa = Math.max(30, Number(fe("wait_hint_sec", zr)) || zr), Us = "manual", [ee, Yt] = e.useState(Us), [ia, Xn] = e.useState(""), [oc, Gs] = e.useState(!1), [Vn, Yn] = e.useState(!1), [er, tr] = e.useState(!1), [Js, Zs] = e.useState([]), [la, nr] = e.useState(!1), [en, ft] = e.useState(null), [Ks, et] = e.useState(""), [Qs, Xs] = e.useState(!1), [tn, Oe] = e.useState(!1), [nn, mt] = e.useState(!1), rn = e.useRef(null);
  e.useEffect(() => {
    if (!tn && !nn) return;
    const l = (d) => {
      const m = rn.current;
      m && d && d.target && m.contains(d.target) || (Oe(!1), mt(!1));
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [tn, nn]);
  const [rr, gt] = e.useState(!1), ca = e.useRef(null);
  e.useEffect(() => {
    if (!rr) return;
    const l = (d) => {
      const m = ca.current;
      m && d && d.target && m.contains(d.target) || gt(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [rr]);
  const [Vs, Ys] = e.useState(!1), [eo, to] = e.useState("paid"), Ze = e.useRef({}), je = e.useRef({}), ht = e.useRef(0), Ct = e.useRef(null), [no, bt] = e.useState(0), [ar, sr] = e.useState([]), [Ke, an] = e.useState(""), De = e.useRef(Ke);
  De.current = Ke;
  const [or, Qe] = e.useState(!1), [ro, da] = e.useState(!1), [ao, ir] = e.useState(null);
  e.useEffect(() => {
    if (!or) return;
    const l = (d) => {
      const m = rn.current;
      m && d && d.target && m.contains(d.target) || Qe(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [or]);
  const [lr, Fe] = e.useState(!1);
  e.useEffect(() => {
    if (!lr) return;
    const l = (d) => {
      const m = rn.current;
      m && d && d.target && m.contains(d.target) || Fe(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [lr]);
  const [cr, We] = e.useState(!1), sn = e.useRef(null), pa = e.useRef(null);
  e.useEffect(() => {
    if (!cr) return;
    const l = (d) => {
      const m = pa.current;
      if (m && d && d.target && m.contains(d.target)) return;
      const u = d && d.target;
      u && u.closest && u.closest("[data-qm-release-lock]") || We(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [cr]);
  const [$e, ua] = e.useState(
    () => !!(g && g.autoPaused)
  ), so = e.useRef($e);
  so.current = $e;
  const yt = e.useRef(!1), dr = e.useRef(0), on = e.useRef({}), [oo, io] = e.useState(0), Tt = e.useRef(/* @__PURE__ */ new Set()), Nt = (l) => {
    l && Tt.current.add(l);
  }, ln = e.useRef({}), [lo, cn] = e.useState(0), tt = e.useRef({}), [At, co] = e.useState(!1), po = e.useRef(!1);
  po.current = At, e.useRef(!1);
  const uo = async () => {
    try {
      const l = await Gt(
        "",
        !0,
        ae(i),
        Pt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      sa(d), d.mode !== void 0 && Yt(Lt(d.mode)), typeof d.model_id == "string" && d.model_id && Xn(d.model_id), typeof d.with_context == "boolean" && Yn(d.with_context), typeof d.parallel == "boolean" && tr(d.parallel), bt((m) => m + 1);
    } catch {
    }
  }, fa = e.useRef(!1), dn = (l) => {
    if (l.mode !== void 0) {
      Yt(l.mode), Or(
        { mode: l.mode },
        ae(i),
        Pt()
      );
      try {
        localStorage.setItem(ts, Ms + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && Xn(l.modelId), l.withContext !== void 0 && Yn(l.withContext), l.parallel !== void 0 && tr(l.parallel), Or(d, ae(i), Pt()));
  }, ma = (l) => {
    !l || l === Ke || (an(l), De.current = l, ot(i, { templateId: l }), Or(
      { template_id: l },
      ae(i),
      Pt()
    ), ft(null), Ze.current = {}, je.current = {}, bt((d) => d + 1));
  }, fo = async (l) => {
    const d = await _s({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      j("error", d.error || "保存失败");
      return;
    }
    sr(d.items || []), ir(null), j("success", "模板已保存");
  }, mo = async (l) => {
    const d = await Es(l);
    if (!d.ok) {
      j("warning", d.error || "删除失败");
      return;
    }
    sr(d.items || []);
    const m = (d.items || []).map((u) => u.id);
    if (m.indexOf(De.current) === -1) {
      const u = m[0] || "";
      an(u), De.current = u, ot(i, { templateId: u });
    }
    j("success", "模板已删除");
  };
  e.useEffect(() => {
    if (y) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === ts && uo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [y, i]), e.useEffect(() => {
    if (y) return;
    let l = !0;
    return Ji(), (async () => {
      const [d, m, u, w] = await Promise.all([
        Cs(),
        Zi(),
        ea(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Gt(
          "",
          !0,
          ae(i),
          Pt()
        )
      ]);
      if (!l) return;
      if (Zs(d), sr(u.items), w && w.config) {
        const N = w.config;
        sa(N), N.mode !== void 0 && Yt(Lt(N.mode)), typeof N.model_id == "string" && N.model_id && Xn(N.model_id), typeof N.with_context == "boolean" && Yn(N.with_context), typeof N.parallel == "boolean" && tr(N.parallel), typeof N.template_id == "string" && N.template_id && (an(N.template_id), De.current = N.template_id);
      }
      const A = u.items.map((N) => N.id);
      if (!De.current || A.indexOf(De.current) === -1) {
        const N = u.defaultId || A[0] || "";
        N && (an(N), De.current = N);
      }
      if (w && w.config) {
        const N = w.config;
        Gs(N.__follow_active__ === !0);
      }
      fa.current = !0, bt((N) => N + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    ht.current = q;
  }, [q]);
  const pr = async (l) => {
    if (la) return;
    const d = q;
    nr(!0), et("");
    const m = typeof AbortController < "u" ? new AbortController() : null;
    Ct.current = m;
    try {
      const u = await fetch(L("/question-modal/analyze"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          request_id: E,
          tool_call_id: i,
          session_id: ae(i),
          title: k,
          questions: f,
          model_id: ia,
          mode: l,
          with_context: Vn,
          parallel: er,
          question_index: d,
          answers: R,
          template_id: De.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(fe("model_timeout_sec", 120)) || 120
        }),
        signal: m ? m.signal : void 0
      }), w = await u.json().catch(() => ({})), A = w && w.analysis || null, N = A && A.error || w && w.error || "";
      w && w.cancelled || A && A.cancelled ? et("已终止分析。") : !u.ok || !w || w.ok === !1 || A && A.ok === !1 ? et(N || "分析失败（服务返回 " + u.status + "）") : A && (Ze.current[d] = A, je.current[d] = !0, ht.current === d && ft(A), j("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      Ct.current === m && m && m.signal.aborted || u && u.name === "AbortError" ? et("已终止分析。") : et("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      Ct.current === m && (Ct.current = null), nr(!1), tt.current[d] = !0, cn((u) => u + 1);
    }
  }, go = () => {
    const l = q;
    delete Ze.current[l], ft(null), et(""), pr("manual");
  }, xt = (l) => {
    var m;
    const d = l !== void 0 ? l : ht.current;
    try {
      fetch(L("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: E,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      _n(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (m = Ct.current) == null || m.abort();
    } catch {
    }
    nr(!1);
  }, ho = () => {
    xt(), et("已终止分析。");
  }, bo = () => {
    $e ? (ln.current = {}, tt.current = {}, je.current = {}, yt.current = !1, ua(!1), bt((l) => l + 1), j("info", "已恢复自动答题")) : (xt(), ua(!0), j("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (y) return;
    const l = Ze.current[q];
    ft(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + q;
    let m = !0;
    return fetch(L("/question-modal/analysis") + d, { headers: B() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !m || !u || !u.found || !u.analysis || (Ze.current[q] = u.analysis, ht.current === q && ft(u.analysis));
    }).catch(() => {
    }), () => {
      m = !1;
    };
  }, [i, q]), e.useEffect(() => {
    y || fa.current && ee === "ai" && At && (!En(p) || !f.length || je.current[q] || D || (je.current[q] = !0, pr("auto")));
  }, [
    y,
    ee,
    i,
    no,
    Vn,
    er,
    f,
    q,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    At
  ]);
  const yo = () => {
    const l = en && en.per_question || [];
    if (!l.length) return;
    if (!l.some((m) => m.type === "multi" ? String(m.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(m.choice || "").trim().length > 0)) {
      j("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Z((m) => {
      const u = { ...m };
      return l.forEach((w) => {
        const A = `q${w.index}`;
        Nt(A);
        const N = u[A] || { type: w.type, value: "", other: "" };
        if (w.type === "multi") {
          const ne = String(w.choice || "").split(/[、,，]/).map((V) => V.trim()).filter(Boolean);
          u[A] = { ...N, value: ne };
        } else
          u[A] = { ...N, value: w.choice || N.value };
      }), u;
    }), j("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, nt = (l, d, m = !1) => {
    xt(), Fs(l), ye(!0), K(d), pt(!1), x(!0), he(i), m && ot(i, { backendReleased: !0 });
  }, xo = async (l, d) => {
    const m = await Pr(i, ae(i));
    return m.ok ? (nt(l, d, m.released), !0) : (pt(!0), fr(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = Ft(i)) == null ? void 0 : d.answers;
    ot(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: E,
      visStep: q,
      answers: Mr(R, l, Tt.current),
      finalOther: Ge,
      finalOtherAtt: le,
      answered: y,
      skippedAll: Q,
      expanded: ue,
      localResult: ie,
      submittedAt: ut,
      skipReason: X,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Zn,
      waitRetired: _t,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: _,
      slowStep: M,
      slowFired: Y,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: Se,
      gateBlocked: Ve,
      releasedNote: I,
      autoPaused: $e,
      templateId: Ke
    });
  }, [
    i,
    E,
    q,
    R,
    Ge,
    le,
    y,
    Q,
    ue,
    ie,
    ut,
    X,
    Zn,
    _t,
    _,
    M,
    Y,
    Se,
    $e,
    Ke,
    Ve,
    I
  ]), e.useEffect(() => {
    if (!y || !ut || _t || !Et.current) return;
    let l = 0, d = !1, m = Za(i);
    const u = () => {
      if (d) return;
      const w = Math.floor((Date.now() - ut) / 1e3);
      if (w >= oa) {
        Ye.current = !0, Xt(!0);
        return;
      }
      if (!Ye.current) {
        const A = Za(i);
        A >= 0 && (m < 0 ? m = A : A - m >= Li && (Ye.current = !0));
      }
      if (!Ye.current && w >= Ri && !Vt.current && (Vt.current = !0, Kn(!0)), Ye.current) {
        l = setTimeout(
          () => {
            d || Xt(!0);
          },
          Math.max(1e3, (oa - w) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || Ka(u);
      }, ws);
    };
    return Ka(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [y, ut, _t]);
  const [ur, fr] = e.useState(!1), [mr, ga] = e.useState(""), ha = (l, d, m) => {
    l.length && (d === "final" ? xe((u) => u.concat(l)) : Z((u) => {
      const w = m || `q${q}`;
      Nt(w);
      const A = u[w] || { type: "text", value: "", other: "" };
      return { ...u, [w]: { ...A, attachments: (A.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, w, A, N) => {
      ha(u, w, A), N && N.length ? ga(N.join("；")) : ga("");
    }, d = (u) => fr(u);
    In.set(i, l), zn.set(i, d);
    const m = hl(i);
    return m.length && m.forEach((u) => ha([u.att], u.target, u.key)), fr(jn > 0), () => {
      In.get(i) === l && In.delete(i), zn.get(i) === d && zn.delete(i);
    };
  }, [i, q]);
  const gr = (l, d) => ml(i, l, d), hr = (l, d, m) => {
    const u = bl(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Is(u, i, d, m);
    }
  };
  e.useEffect(() => {
    if (!b || O) return;
    let l = !0;
    return jt(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ye(!0);
      const m = String(d.skip_reason || "").trim();
      m && ze((u) => u || m), T(Bt(f, d));
    }), () => {
      l = !1;
    };
  }, [b, i, O]), e.useEffect(() => {
    if (y || !i || S) return;
    let l = !0;
    return jt(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ye(!0);
      const m = String(d.skip_reason || "").trim();
      m && ze((u) => u || m), T((u) => u || Bt(f, d)), K(Bt(f, d)), x(!0), he(i);
    }), () => {
      l = !1;
    };
  }, [i, y, S]), e.useEffect(() => {
    if (y) return;
    let l = !0, d = 0, m = 0, u = 0, w = !1, A = !1, N = 0, ne = 0;
    qt.current || (qt.current = Date.now());
    let V = !!Ut(i), Ee = !1;
    const ke = (P) => {
      !l || !P || !P.request_id || (V = !0, m = 0, u = 0, w = !1, v(P.request_id), pt(!1), N && (clearTimeout(N), N = 0), El(
        i,
        P.request_id,
        P.session_id || Kt(),
        P.agent_id
      ));
    }, ce = (P) => {
      l && (N && (clearTimeout(N), N = 0), ne && (clearTimeout(ne), ne = 0), xo(
        P,
        P === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, $t = Ut(i), st = async () => {
      if (!$t) return !1;
      const P = await Tl($t.request_id);
      if (!l) return !0;
      if (P.kind === "found") {
        const me = P.data;
        return me.tool_call_id && i && me.tool_call_id !== i ? (he(i), !1) : (ke(me), !0);
      }
      return P.kind === "orphan" ? (ce("orphan"), !0) : (P.kind === "absent" && he(i), !1);
    }, Ce = (P = !1) => {
      if (l) {
        if (d += 1, P || (m += 1, u || (u = Date.now())), P) {
          if (!Ee) {
            Ee = !0, jt(i).then((de) => {
              if (l) {
                if (de) {
                  de.kind === "skipped" && !de.answers && ye(!0);
                  const Mt = String(de.skip_reason || "").trim();
                  Mt && ze((Tr) => Tr || Mt), T(Bt(f, de)), K(Bt(f, de)), x(!0), he(i);
                  return;
                }
                Ce(!0);
              }
            });
            return;
          }
          if (V) {
            ce("gone");
            return;
          }
          const me = Date.now() - (qt.current || Date.now());
          if (d >= 12 && me >= vl) {
            ce("gone");
            return;
          }
        }
        if (m >= zs) {
          if (Date.now() - (u || Date.now()) >= $s) {
            if (w = !0, !A) {
              A = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !w) return;
                    w = !1, m = 0, u = 0, d = 0, re();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          N = setTimeout(re, Os);
          return;
        }
        N = setTimeout(re, d < ql ? wl : 5e3);
      }
    }, Ie = () => {
      pl(i, ae(i)).then((P) => {
        if (l) {
          if (P.kind === "found") {
            ke(P.data);
            return;
          }
          if (P.kind === "orphan") {
            ce("orphan");
            return;
          }
          if (P.kind === "error") {
            Ce(!1);
            return;
          }
          xl(ae(i)).then((me) => {
            if (l) {
              if (me) {
                if (me.tool_call_id && i && me.tool_call_id !== i) {
                  jt(i).then((de) => {
                    if (l) {
                      if (de) {
                        x(!0), he(i);
                        return;
                      }
                      Ce(!0);
                    }
                  });
                  return;
                }
                ke(me);
                return;
              }
              jt(i).then((de) => {
                if (l) {
                  if (de) {
                    de.kind === "skipped" && !de.answers && ye(!0);
                    const Mt = String(de.skip_reason || "").trim();
                    Mt && ze((Tr) => Tr || Mt), x(!0), he(i);
                    return;
                  }
                  Ce(!0);
                }
              });
            }
          });
        }
      });
    }, re = () => {
      if (l) {
        if (!$t) {
          Ie();
          return;
        }
        st().then((P) => {
          !l || P || Ie();
        });
      }
    };
    return ne = setTimeout(() => {
      l && pt(!0);
    }, kl), re(), () => {
      l = !1, N && clearTimeout(N), ne && clearTimeout(ne);
    };
  }, [y, i]);
  const ba = async () => {
    Ae(!0);
    try {
      const l = ae(i);
      let d = await Pr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await es(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok)
        throw new Error(
          d.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + d.reason + "）"
        );
      if (d.released) {
        const u = d.reason === "host-stop";
        nt(
          d.reason === "orphan" ? "orphan" : "",
          d.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), j(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        nt(
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
  }, ya = async () => {
    Ae(!0);
    try {
      const l = ae(i);
      let d = await Pr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await es(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok) {
        qe(d.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + d.reason + "）。"), j("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (d.released) {
        const u = d.reason === "host-stop";
        qe(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), j("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        qe("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), j("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      j("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      Ae(!1);
    }
  }, ko = e.createElement(
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
  ), pn = (l, d) => e.createElement("button", {
    type: "button",
    key: d,
    className: "qm-release-lock",
    "data-qm-release-lock": "true",
    title: "释放阻塞（若发新消息报 A task is already running，点此释放）",
    "aria-label": "释放阻塞",
    disabled: D,
    // US-010: 二次确认——点击不再直接执行，先弹确认气泡；确定后由
    // releaseConfirmPanel 执行原 onClick（rescue / releaseBlocked 零改动）。
    // 打开时同步收起全部 header 弹层（互斥组）。
    onClick: () => {
      sn.current = l, Oe(!1), mt(!1), gt(!1), Qe(!1), Fe(!1), We(!0);
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
  }, ko), vo = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认释放阻塞",
      ref: pa,
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
          We(!1), sn.current = null;
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
          const l = sn.current;
          We(!1), sn.current = null, l && l();
        }
      }, "确定")
    )
  ), un = cr ? vo : null, fn = Ue(f, R), rt = fn.length, Me = q >= rt, te = Me ? -1 : fn[q], It = Me ? rt : q;
  e.useEffect(() => {
    if (Lt(fe("mode", "manual")) !== "manual") return;
    let d = String(fe("notify_channel_pc", "") || "");
    if (!d) {
      const u = String(fe("notify_channel", "off") || "off"), w = !!fe("notify_manual_mode", !1);
      d = u === "browser" || (u === "off" || !u) && w ? "browser" : u;
    }
    if (d !== "browser" || y || Q || Se || !En(p) || !f.length) return;
    const m = Ue(f, R).filter((u) => !wt(R[`q${u}`])).length;
    Mi(i, k, m);
  }, [Qn, y, Q, Se, It]);
  const mn = Math.max(0, Number(fe("slow_question_sec", Pi)) || 0) * 1e3, wo = Math.round(mn / 1e3);
  e.useEffect(() => {
    if (y || Q || Se || mn <= 0) return;
    if (M !== It) {
      U(It), C(Date.now()), H(!1);
      return;
    }
    if (!_) {
      C(Date.now());
      return;
    }
    if (Y) return;
    const l = _ + mn - Date.now();
    if (l <= 0) {
      H(!0);
      return;
    }
    let d = !1;
    const m = setTimeout(() => {
      d || H(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(m);
    };
  }, [y, Q, Se, It, M, _, Y, mn]);
  const _e = te >= 0 ? f[te] : null, kt = `q${te}`, J = te >= 0 && R[kt] || { type: oe(_e), value: oe(_e) === "multi" ? [] : "", other: "" }, vt = (l) => {
    var u;
    Ve && St(""), te >= 0 && Nt(`q${te}`);
    const d = { ...R, [kt]: { ...l, skipped: !1 } }, m = Ue(f, d);
    f.forEach((w, A) => {
      m.indexOf(A) === -1 && delete d[`q${A}`];
    }), ot(i, {
      answers: Mr(d, (u = Ft(i)) == null ? void 0 : u.answers, Tt.current)
    }), Z(d);
  };
  e.useEffect(() => {
    q > rt && $(rt);
  }, [rt, q]);
  const br = async (l, d) => {
    const m = await fetch(L(l), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(d)
    }), u = await m.json().catch(() => ({}));
    if (!m.ok) {
      const w = new Error(u && u.detail || "HTTP " + m.status);
      throw w.status = m.status, w;
    }
    return u;
  }, yr = () => {
    var l;
    return Al(Mr(
      Ol(f, R),
      (l = Ft(i)) == null ? void 0 : l.answers,
      Tt.current
    ));
  }, qo = () => !!fe("gate_unsaved", !0), So = (l) => Rs(l), xa = (l, d) => {
    if (!qo()) return [];
    const m = new Set(Ue(f, l)), u = (A) => m.has(A) && !wt(l[`q${A}`]) && !So(f[A]), w = [];
    return typeof d == "number" ? (u(d) && w.push(d + 1), w) : (f.forEach((A, N) => {
      u(N) && w.push(N + 1);
    }), w);
  }, ka = (l, d, m) => {
    const u = "第 " + l.join("、") + " 题", w = m === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    St("⛔ " + u + "尚未选择。" + w);
    const A = Ue(f, d).length;
    br("/question-modal/gate-block", {
      request_id: E,
      tool_call_id: i,
      session_id: ae(i),
      missing: l,
      answered: A - l.length,
      total: A,
      bundle: Ua
    }).catch(() => {
    });
  }, xr = async (l, d = !1) => {
    if (!E)
      return j("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const m = yr();
    if (!d) {
      const u = xa(m);
      if (u.length)
        return ka(u, m, "提交"), "blocked";
      St("");
    }
    Ae(!0);
    try {
      const u = await br("/question-modal/answer", {
        request_id: E,
        session_id: ae(i),
        answers: m,
        other: Ge,
        attachments: le
      });
      return u && u.orphan ? (fetch(
        L("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(ae(i)),
        { method: "POST", headers: B() }
      ).catch(() => {
      }), nt(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "sent") : (he(i), K(Nl(f, m, Ge, le)), Jn(Date.now()), Kn(!1), Xt(!1), Ye.current = !1, Vt.current = !1, Et.current = !0, x(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (nt(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "blocked") : (j("error", "提交失败: " + u.message), d ? (yt.current = !1, dr.current += 1, dr.current >= Nr && j(
        "warning",
        "自动提交连续失败 " + Nr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), cn((w) => w + 1), "not-ready") : "blocked");
    } finally {
      Ae(!1);
    }
  }, _o = () => {
    te < 0 || (Ve && St(""), xt(ht.current), je.current[ht.current] = !0, Nt(`q${te}`), Z((l) => {
      const d = { ...l };
      d[`q${te}`] = {
        type: (l[`q${te}`] || {}).type || oe(_e),
        value: ((l[`q${te}`] || {}).type || oe(_e)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const m = Ue(f, d);
      return f.forEach((u, w) => {
        m.indexOf(w) === -1 && delete d[`q${w}`];
      }), d;
    }), $((l) => l + 1));
  }, Eo = () => {
    if (Me) {
      xr();
      return;
    }
    const l = yr(), d = xa(l, te);
    if (d.length) {
      ka(d, l, "下一步");
      return;
    }
    Ve && St(""), $((m) => m + 1);
  }, Co = async () => {
    if (!E) {
      j("warning", "问卷尚未就绪，请稍候");
      return;
    }
    xt(), Ae(!0);
    try {
      const l = await br("/question-modal/skip", {
        request_id: E,
        session_id: ae(i)
      });
      if (l && l.orphan) {
        nt(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
        return;
      }
      j("info", "已跳过问卷"), he(i), ye(!0), ze("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), K("用户跳过了本次问卷。"), Jn(Date.now()), Kn(!1), Xt(!1), Ye.current = !1, Vt.current = !1, Et.current = !0, x(!0);
    } catch (l) {
      if (l && l.status === 404) {
        nt(
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
    if (y || ee !== "ai" && ee !== "recommend" || $e || (ee === "recommend" || ee === "ai") && !At || !En(p) || !f.length || D) return;
    if (Me) {
      if (yt.current || dr.current >= Nr) return;
      const V = yr();
      if (!fn.every(
        (ke, ce) => !!tt.current[ce] || wt(V[`q${ke}`])
      ) || !E) return;
      yt.current = !0, xr(void 0, !0).then((ke) => {
        ke === "not-ready" && (yt.current = !1);
      });
      return;
    }
    const l = q;
    if (ln.current[l] || ee === "ai" && !tt.current[l]) return;
    const d = fn[l], m = f[d], u = oe(m), w = Qa(m), A = Xa(Ze.current[l], d);
    if (ee === "ai" && !tt.current[l]) return;
    ln.current[l] = !0;
    const N = w.length ? w.join("、") : A, ne = !!N;
    Nt(`q${d}`), ne || (on.current[d] = !0, io((V) => V + 1), j("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), Z((V) => {
      const Ee = { ...V }, ke = `q${d}`, ce = Ee[ke] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!ne)
        Ee[ke] = {
          ...ce,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const st = m.options || [], Ce = (re) => String(re).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = N.split(/[、,，]/).map((re) => Ce(re)).filter(Boolean).map((re) => {
          const P = st.find((me) => Te(me) === re || Le(me) === re);
          return P ? Te(P) : re;
        });
        Ee[ke] = {
          ...ce,
          type: u,
          value: Ie,
          other: Ie.length === 1 && Ie[0] === be ? ce.other : "",
          attachments: Ie.length === 1 && Ie[0] === be ? ce.attachments : []
        };
      } else if (u === "single") {
        const st = m.options || [], Ce = (P) => String(P).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = st.find((P) => Te(P) === N || Le(P) === N) || st.find((P) => Te(P) === Ce(N) || Le(P) === Ce(N)), re = Ie ? Te(Ie) : N;
        Ee[ke] = {
          ...ce,
          type: u,
          value: re,
          other: String(re) === be ? ce.other : "",
          attachments: String(re) === be ? ce.attachments : []
        };
      } else
        Ee[ke] = { ...ce, type: u, value: N };
      const $t = Ue(f, Ee);
      return f.forEach((st, Ce) => {
        $t.indexOf(Ce) === -1 && delete Ee[`q${Ce}`];
      }), Ee;
    }), je.current[l] = !0, tt.current[l] = !0, $((V) => V + 1), cn((V) => V + 1);
  }, [
    y,
    ee,
    $e,
    D,
    i,
    q,
    lo,
    rt,
    p,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    E,
    At
  ]);
  const zt = e.useRef(!1), at = e.useRef(0), Ot = e.useRef(!1), He = e.useRef({});
  e.useEffect(() => {
    if (y || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        zt.current = !0, Ot.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!f || f.length), u.answers && typeof u.answers == "object" && (Z((A) => {
            const N = { ...A };
            return Object.keys(u.answers).forEach((ne) => {
              const V = u.answers[ne];
              !V || typeof V != "object" || Tt.current.has(ne) || (N[ne] = {
                ...N[ne] || { type: "single", value: "", other: "" },
                ...V
              });
            }), N;
          }), ot(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && $(u.cursor), typeof u.mode == "string" && u.mode) {
            const A = Lt(u.mode);
            Yt((N) => N === A ? N : A);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((A) => {
            const N = parseInt(A, 10);
            !isNaN(N) && u.per_question[A] && (Ze.current[N] = u.per_question[A]);
          }), u.status === "submitted" && (Jn((A) => A || Date.now()), u.released && ot(i, { backendReleased: !0 }), x(!0), he(i));
          const w = String(u.skip_reason || "").trim();
          w && ze((A) => A || w), typeof u.mode == "string" && u.mode && (He.current.mode = Lt(u.mode)), Object.keys(u.answers || {}).forEach((A) => {
            He.current["a:" + A] = JSON.stringify(u.answers[A] || {});
          }), typeof u.cursor == "number" && (He.current.cursor = "c:" + u.cursor), Ot.current = !0, cn((A) => A + 1);
        } finally {
          setTimeout(() => {
            zt.current = !1;
          }, 0);
        }
      }
    };
    Ki(i).then((u) => {
      !l || !u || !u.found || !u.state || (at.current = Math.max(at.current, u.rev), d(u.state));
    });
    const m = Qi(i, {
      onSnapshot: (u, w) => {
        at.current = Math.max(at.current, u), w && d(w);
      },
      onChange: (u) => {
        const w = parseInt(u.rev || 0, 10) || 0;
        w && w <= at.current && u.origin !== Dn() || (at.current = Math.max(at.current, w), !(u.origin && u.origin === Dn()) && d(u.state));
      },
      onStatus: (u) => {
        l && co((w) => w === !u ? w : !u);
      }
    });
    return () => {
      l = !1, m();
    };
  }, [y, i]), e.useEffect(() => {
    y || !i || zt.current || Ot.current && Object.keys(R || {}).forEach((l) => {
      const d = JSON.stringify(R[l] || {});
      He.current["a:" + l] !== d && (He.current["a:" + l] = d, _n(
        i,
        "set_answer",
        { key: l, answer: R[l] }
      ));
    });
  }, [y, i, JSON.stringify(R)]), e.useEffect(() => {
    if (y || !i || zt.current || !Ot.current) return;
    const l = "c:" + q;
    He.current.cursor !== l && (He.current.cursor = l, _n(i, "goto", { cursor: q }));
  }, [y, i, q]), e.useEffect(() => {
    y || !i || zt.current || Ot.current && He.current.mode !== ee && (He.current.mode = ee, _n(i, "set_mode", { mode: ee }));
  }, [y, i, ee]);
  const gn = {
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
  }, kr = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, vr = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, hn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, wr = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, va = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, qr = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, To = { display: "flex", flexDirection: "column", gap: 8 }, Sr = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, bn = {
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
  }, wa = {
    ...bn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, No = {
    ...bn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, _r = {
    ...bn,
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
  }, qa = {
    // Restored to the original look (user asked for options to stay as-is).
    ..._r,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Sa = {
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
  }, Ao = { height: 32, fontSize: 13, borderRadius: 8 }, _a = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Ea = (l) => {
    const d = Te(l);
    return J.type === "multi" ? Array.isArray(J.value) && J.value.indexOf(d) !== -1 : J.value === d;
  }, Ca = Ea(be), Ta = (l) => {
    if (y || D) return;
    const d = Te(l);
    if (J.type === "multi") {
      const m = Array.isArray(J.value) ? J.value.slice() : [], u = m.indexOf(d);
      u === -1 ? m.push(d) : m.splice(u, 1);
      const w = m.length === 1 && m[0] === be;
      vt({
        ...J,
        value: m,
        other: w ? J.other : "",
        attachments: w ? J.attachments : []
      });
    } else {
      const m = d === be;
      vt({
        ...J,
        value: d,
        other: m ? J.other : "",
        attachments: m ? J.attachments : []
      });
    }
  }, Io = !!fe("show_recommend_badge", !0), Na = fe("badge_position", "left") === "right", zo = fe("badge_style", "rect") === "round", Aa = (l) => l && Io ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: zo ? { ...Sa, borderRadius: 999 } : Sa
  }, "AI 推荐") : null, Oo = !!fe("auto_number_options", !0), $o = !!fe("highlight_recommended", !1), Mo = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Ia = (l, d, m, u, w, A) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: y || D,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: w && $o ? { ...d ? qa : _r, ...Mo } : d ? qa : _r,
      onClick: m
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Na ? null : Aa(w),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (A && Oo ? A + ". " : "") + l),
    Na ? Aa(w) : null
  );
  if (!y && !En(p))
    return e.createElement(
      "div",
      { style: gn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: kr, className: "qm-header" },
        e.createElement(
          "div",
          { style: vr },
          Ar(e),
          e.createElement("span", { style: hn, className: "qm-title" }, k)
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
          Je ? pn(ba, "qm-release-lock-prep") : null,
          e.createElement("span", { style: wr }, "准备中")
        )
      ),
      e.createElement("div", {
        style: { ...va, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // US-010: 🔒 二次确认气泡挂卡片根。
      un
    );
  if (y) {
    const l = () => {
      const m = Fi({
        submittedAt: ut,
        deadReason: Se,
        releasedNote: I,
        skippedAll: Q,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: _t,
        pastSoft: Zn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!Et.current
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
      }, Di(m.phase)) : null;
    }, d = !!Et.current;
    return Q && !ue ? e.createElement(
      "div",
      {
        style: {
          ...gn,
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
      X ? e.createElement("span", {
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
        title: X
      }, X) : null,
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
          ...hn,
          flex: I || X ? "0 1 auto" : 1,
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
          ...wa,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Be(!0)
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
      d ? pn(ya, "qm-release-lock-fold") : null,
      // US-010: 🔒 二次确认气泡挂卡片根（折叠行经 card spread 已有 relative）。
      un
    ) : e.createElement(
      "div",
      { style: gn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...kr, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: vr },
          Ar(e),
          e.createElement("span", { style: hn }, k)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放阻塞」按钮
          // 移除，不留多套并存）；出现条件沿用 showRelease 判定。
          d ? pn(ya, "qm-release-lock-ans") : null,
          e.createElement(
            "span",
            { style: { ...wr, color: Se ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
            Se ? "已失效" : Q ? "已跳过" : "已完成"
          )
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      Q && (X || Se) ? e.createElement(
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
        String(X || Se || "问卷已失效/跳过")
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
      }, Q ? ie ? ie + `

` + On(f) : `已跳过本次问卷。

` + On(f) : ie || O || S || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + On(f)),
      Q && ue ? e.createElement(
        "div",
        { style: Sr },
        e.createElement("button", {
          type: "button",
          style: wa,
          onClick: () => Be(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...Sr, marginTop: 8, gap: 10 } },
        I ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, I) : l()
      ),
      // US-010: 🔒 二次确认气泡挂卡片根。
      un
    );
  }
  const Er = Y && M === It, za = !y && !Me && oo >= 0 && on.current[te] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Oa = Object.keys(on.current).map((l) => Number(l)).filter((l) => on.current[l] && Number.isFinite(l)).sort((l, d) => l - d), Ro = Me && Oa.length ? e.createElement("div", {
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
  }, "⚠ 第 " + Oa.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let yn = null;
  if (Me)
    yn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: qr }, "其他意见（可选）"),
      Ro,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Ge,
        style: _a,
        onChange: (l) => Qt(l.target.value),
        onPaste: (l) => hr(l, "final", "final")
      }),
      Lr({
        R: e,
        files: le,
        disabled: y || D,
        uploading: ur,
        error: mr,
        onPick: () => gr("final", "final"),
        onRemove: (l) => xe((d) => d.filter((m, u) => u !== l))
      })
    );
  else if (_e && oe(_e) === "text")
    yn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...qr, fontSize: 13, color: "var(--app-text, inherit)" } }, Pn(_e, te)),
      za,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof J.value == "string" ? J.value : "",
        style: _a,
        onChange: (l) => vt({ ...J, value: l.target.value, other: "" }),
        onPaste: (l) => hr(l, "q", kt)
      }),
      Lr({
        R: e,
        files: J.attachments || [],
        disabled: y || D,
        uploading: ur,
        error: mr,
        onPick: () => gr("q", kt),
        onRemove: (l) => vt({
          ...J,
          attachments: (J.attachments || []).filter((d, m) => m !== l)
        })
      })
    );
  else if (_e) {
    const l = Qa(_e), d = Xa(en, te), m = l.length ? l : d ? [d] : l, u = (_e.options || []).map((w, A) => Ia(
      Le(w),
      Ea(w),
      () => Ta(w),
      "o" + A,
      rl(_e, w, m),
      A + 1
    ));
    u.push(Ia("其他", Ca, () => Ta(be), "other")), Ca && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: J.other,
      style: { ...Ao, marginTop: 2 },
      onChange: (w) => vt({ ...J, other: w.target.value }),
      onPaste: (w) => hr(w, "q", kt)
    })), u.push(Lr({
      R: e,
      files: J.attachments || [],
      disabled: y || D,
      uploading: ur,
      error: mr,
      onPick: () => gr("q", kt),
      onRemove: (w) => vt({
        ...J,
        attachments: (J.attachments || []).filter((A, N) => N !== w)
      })
    }))), yn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...qr, fontSize: 13, color: "var(--app-text, inherit)" } }, Pn(_e, te)),
      za,
      e.createElement("div", { style: { ...To, marginTop: 8 } }, u)
    );
  }
  const Cr = rt + 1, Po = Me ? Cr + "/" + Cr : q + 1 + "/" + Cr, $a = (l, d, m, u, w) => e.createElement("button", {
    type: "button",
    title: l,
    "aria-label": l,
    onClick: m,
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
      background: d ? "var(--app-surface-subtle, rgba(127,127,127,0.10))" : "transparent",
      color: "var(--app-text-secondary, inherit)"
    }
  }, u), Lo = e.createElement(
    "span",
    {
      style: { display: "inline-flex", alignItems: "center", gap: 3 }
    },
    e.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "更多"),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  ), Bo = e.createElement(
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
  ), xn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 1e4,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, kn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, vn = (l, d) => e.createElement(
    "button",
    {
      type: "button",
      key: l,
      className: "qm-hdr-menu-item",
      role: "menuitem",
      onClick: d && d.onClick ? d.onClick : () => {
        Oe(!1);
      },
      disabled: d ? !!d.disabled : !1,
      title: d && d.title ? d.title : void 0,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        textAlign: "left",
        cursor: d && d.disabled ? "default" : "pointer",
        padding: "7px 12px",
        fontSize: 12,
        border: "none",
        background: "transparent",
        color: "var(--app-text, inherit)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: 260,
        opacity: d && d.disabled ? 0.5 : 1
      }
    },
    e.createElement("span", {
      style: { overflow: "hidden", textOverflow: "ellipsis" }
    }, l),
    // US-010: 每项右侧淡色「›」提示「可点击进入/执行」（boss 反馈 4）；
    // disabled 项不显示箭头，避免暗示可点。
    !d || !d.disabled ? e.createElement("span", {
      "aria-hidden": "true",
      style: {
        flex: "none",
        fontSize: 12,
        lineHeight: 1,
        color: "var(--app-text-tertiary, inherit)"
      }
    }, "›") : null
  ), Ma = (ar || []).find((l) => l.id === Ke), jo = Ma ? Ma.name : "默认模板", Do = e.createElement(
    "div",
    { style: xn, role: "menu", className: "qm-hdr-pop" },
    e.createElement("div", { style: kn }),
    vn("选择模板（当前：" + jo + "）", {
      disabled: y || D,
      onClick: () => {
        Oe(!1), mt(!1), gt(!1), Fe(!1), We(!1), Qe(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    vn("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: y || D || Me,
      onClick: () => {
        Oe(!1), _o();
      }
    }),
    vn("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: y || D,
      onClick: () => {
        Oe(!1), xr(void 0, !0);
      }
    }),
    vn("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: y || D,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        Oe(!1), Fe(!0), We(!1);
      }
    })
  ), Fo = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "查看上下文",
      className: "qm-hdr-pop",
      style: { ...xn, width: 300, padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: kn }),
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
  ), Wo = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "选择模板",
      className: "qm-hdr-pop",
      style: { ...xn, padding: 4, minWidth: 240 }
    },
    e.createElement("div", { style: kn }),
    Rl({
      R: e,
      templates: ar,
      value: Ke,
      onSelect: (l) => {
        ma(l), Qe(!1);
      },
      onManage: () => {
        Qe(!1), da(!0);
      }
    })
  ), Ho = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      className: "qm-hdr-pop",
      style: { ...xn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: kn }),
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
        onClick: () => Fe(!1)
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
          Fe(!1), Co();
        }
      }, "确定")
    )
  ), Uo = e.createElement(
    "div",
    {
      key: "qm-hdr-pop",
      ref: rn,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "none"
      }
    },
    $a("更多操作", tn, () => {
      Oe((l) => !l), mt(!1), gt(!1), Qe(!1), Fe(!1), We(!1);
    }, Lo, { text: !0 }),
    $a("查看上下文", nn, () => {
      mt((l) => !l), Oe(!1), gt(!1), Qe(!1), Fe(!1), We(!1);
    }, Bo),
    tn ? Do : null,
    nn ? Fo : null,
    or ? Wo : null,
    lr ? Ho : null
  ), Ra = {
    ...bn,
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
    { style: gn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: kr, className: "qm-header" },
      e.createElement(
        "div",
        { style: vr },
        Ar(e),
        e.createElement("span", { style: hn, className: "qm-title" }, k)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        // US-010: 释放阻塞 🔒 icon 移到 qm-actions 首位（ModelCapsule 之前），
        // 与「更多」⋮ 之间隔开整排控件，避免容器误触（boss 反馈 2）。
        // 出现条件不变（题级 slowActive / stuck 故障兜底）；点击走二次确认
        // → 基线 rescue（converge 收尾 + toast，语义与 334ad7b 逐字一致）。
        Er || Je && !E ? pn(ba, "qm-release-lock") : null,
        $l({
          R: e,
          providers: Js,
          modelId: ia,
          disabled: y || D,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: Vs,
          onOpenChange: Ys,
          tab: eo,
          onTabChange: to,
          onChange: (l) => {
            dn({ modelId: l }), ft(null), Ze.current = {}, je.current = {}, bt((d) => d + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        Ml({
          R: e,
          mode: ee,
          disabled: y || D,
          open: rr,
          onOpenChange: (l) => {
            gt(l), l && (Oe(!1), mt(!1), Qe(!1), Fe(!1), We(!1));
          },
          popRef: ca,
          onChange: (l) => {
            dn({ mode: l }), l === "ai" && (je.current = {}), l === "ai" || l === "recommend" ? (ln.current = {}, tt.current = {}, yt.current = !1, bt((d) => d + 1)) : xt();
          }
        }),
        Ll({
          R: e,
          busy: la,
          result: en,
          error: Ks,
          mode: ee,
          disabled: y || D,
          open: Qs,
          onOpenChange: Xs,
          onRun: () => {
            pr("manual");
          },
          onRerun: go,
          onApply: yo,
          onCancel: ho,
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
                checked: Vn,
                onChange: (l) => dn({ withContext: !!l.target.checked })
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
                checked: er,
                onChange: (l) => dn({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (ee === "ai" || ee === "recommend") && !y ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: D,
          onClick: bo,
          style: {
            ...Ra,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...$e ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: $e ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, $e ? "▶ 继续" : "⏸ 停止") : null,
        // US-001: 「更多」(⋮) 与「查看上下文」(ⓘ) 两个 icon 微按钮 + 弹出层，
        // 纯增量插在现有控件之后、进度 pill 之前（demo v5 形态）。
        Uo,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: wr, key: "qm-step" }, Po)
      )
    ),
    e.createElement("div", { style: va }, yn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Pl({
      R: e,
      open: ro,
      templates: ar,
      value: Ke,
      edit: ao,
      onEditChange: ir,
      onClose: () => {
        da(!1), ir(null);
      },
      onSelect: (l) => ma(l),
      onSave: fo,
      onDelete: mo
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
    (Er || Je && !E) && !y ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": Y ? i : void 0,
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
        (Er ? "⚠️ 本题已超过 " + wo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；若你不想继续作答，点右上角 🔒 释放阻塞。"
      )
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Ve && !y ? e.createElement("div", {
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
      "data-qm-bundle": Ua
    }, Ve) : null,
    e.createElement(
      "div",
      { style: Sr, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: q === 0 || D,
        style: { ...Ra, marginRight: "auto", opacity: q === 0 ? 0.5 : 1 },
        onClick: () => $((l) => l - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: D,
        style: No,
        onClick: Eo
      }, Me ? "提交" : "下一步")
    ),
    // US-010: 🔒 二次确认气泡统一挂卡片根（四处 🔒 共用一个气泡实例）。
    un
  );
}
const ns = 12;
let rs = 0;
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
let Dt = null;
function se(t, e, n) {
  if (t in c.draft) return c.draft[t];
  if (n === "global") {
    const s = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return s && t in s ? s[t] : e;
  }
  const r = c.cfg && c.cfg.config, a = c.cfg && c.cfg.sessionConfig;
  if (a) {
    if (t in a) return a[t];
    const s = c.cfg && c.cfg.globalConfig || c.globalCfg;
    return s && t in s ? s[t] : e;
  }
  return r && t in r && c.cfg && c.cfg.has_session === !0 ? r[t] : (r && t in r && !(c.cfg && c.cfg.has_session), e);
}
function jl(t) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function ge(t, e) {
  let n;
  const r = c.cfg;
  if (c.scope === "global") {
    const a = r && r.globalConfig || c.globalCfg || {};
    n = t in a ? a[t] : void 0;
  } else {
    const a = r && r.sessionConfig;
    if (a)
      if (t in a)
        n = a[t];
      else {
        const s = r && r.globalConfig || c.globalCfg || {};
        n = t in s ? s[t] : void 0;
      }
    else {
      const s = r && r.config;
      n = s && t in s ? s[t] : void 0;
    }
  }
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", z();
}
function as() {
  return Object.keys(c.draft).length;
}
async function ra() {
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
async function Ps() {
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
async function aa(t) {
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
async function Dl(t) {
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
  } catch (a) {
    e = "✗ 请求失败：" + String(a && a.message || a);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await Ps(), r || await aa(t);
  try {
    z();
  } catch {
  }
}
async function Fl() {
  if (c.saving) return;
  const t = Object.keys(c.draft), e = c.scope === "session", n = {};
  if (t.forEach((r) => {
    n[r] = c.draft[r];
  }), !t.length && !e) {
    const r = c.globalCfg || {};
    Object.keys(r).forEach((a) => {
      a in n || (n[a] = r[a]);
    });
  }
  t.length, c.saving = !0, c.saveMsg = "", z();
  try {
    let r = "/question-modal/prefs", a = n;
    e && (r = "/question-modal/session-prefs", a = {
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
    const s = await fetch(L(r), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(a)
    }), o = await s.json().catch(() => ({}));
    if (!s.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + s.status + "）", z();
      return;
    }
    const p = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (p.length) {
      c.saving = !1;
      const f = p.map((k) => `${k.key}：${k.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + f, z();
      return;
    }
    c.saving = !1, c.draft = {}, Ss();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const f = (y) => {
        try {
          const x = new Date(y * 1e3), O = (T) => T < 10 ? "0" + T : String(T);
          return x.getMonth() + 1 + "-" + O(x.getDate()) + " " + O(x.getHours()) + ":" + O(x.getMinutes()) + ":" + O(x.getSeconds());
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
    e || ra();
    const b = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let S = "";
    if (b && (S = e ? "session" : "default"), S === "default") {
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
        f.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + f.status + "），本会话仍在会话模式。", S = "");
      } catch (f) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (f && f.message ? f.message : f) + "，本会话仍在会话模式。", S = "";
      }
      c.keyTs = {};
    }
    if (S && (c.scopeChoice = S, c.tab = S, c.scope = S === "session" ? "session" : "global"), S === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (S === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const f = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + f + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Gt(
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
function Ls() {
  c.draft = {}, c.saveMsg = "";
}
function Bs() {
  ea().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
  });
}
function Wl() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", z();
}
function Hl(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", z());
}
function ss(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, z());
}
function Ul() {
  c.tplEdit = null, z();
}
async function Gl() {
  const t = c.tplEdit;
  if (!t || c.tplBusy) return;
  try {
    const a = typeof document < "u" ? document.getElementById("qm-settings-root") : null;
    a && typeof a.querySelector == "function" && ["name", "system_prompt", "user_prompt"].forEach((s) => {
      const o = a.querySelector('[data-qm-tpl-field="' + s + '"]');
      o && typeof o.value == "string" && o.value !== "" && (t[s] = o.value);
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
  }, r = await _s(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), z();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Bs(), z();
}
async function Jl(t) {
  const e = c.templates.filter((a) => a.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await Es(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), z();
    return;
  }
  c.saveMsg = "模板已删除", Bs(), z();
}
function Zl() {
  c.visible = !0, c.chatId = "", c.sessionId = Kt(), c.cfg = null, c.cfgError = "", Ql(), c.agentId = Wn || (() => {
    try {
      return Ne().getSelectedAgentId ? Ne().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Ss();
  const t = ++rs;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", z(), js(() => {
    if (t !== rs) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", z(), (c.tab === "global" || c.tab === "default") && ra(), Ps().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && aa(r);
    });
  });
}
let Br = !1;
async function Kl() {
  if (!Br) {
    Br = !0;
    try {
      const t = await Gt(
        "",
        !0,
        c.sessionId,
        c.agentId
      ), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      Br = !1;
      try {
        z();
      } catch {
      }
    }
  }
}
let Cn = !1;
function Ql() {
  Cn || (Cn = !0, Promise.all([Cs(), ea()]).then((t) => {
    Cn = !1;
    const e = t[0] || [], n = t[1] || {};
    c.providerGroups = e.map((r) => {
      const a = String(r && (r.id || r.provider_id) || ""), o = (r && r.models || []).concat(r && r.extra_models || []).filter(Boolean).map((p) => {
        const i = typeof p == "string" ? p : p && (p.name || p.id) || "";
        return i ? String(i) : "";
      }).filter(Boolean);
      return {
        id: a,
        name: String(r && (r.name || r.title) || a),
        models: o
      };
    }).filter((r) => r.id && r.models.length > 0), c.modelOptions = c.providerGroups.flatMap((r) => r.models.map((a) => r.id + ":" + a)), c.templates = (n.items || []).filter((r) => r && r.id), c.templateOptions = c.templates.map((r) => r.id);
    try {
      z();
    } catch {
    }
  }).catch(() => {
    Cn = !1;
  }));
}
function Xl(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let jr = !1, Tn = "";
const Dr = [];
function js(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (jr && Tn === n) {
    t && Dr.push(t);
    return;
  }
  jr = !0, Tn = n;
  const r = () => {
    Tn === n && (jr = !1, Tn = "");
    const a = Dr.splice(0);
    try {
      a.forEach((s) => s());
    } catch {
    }
  };
  t && Dr.push(t), Gt(
    e,
    !0,
    c.sessionId,
    c.agentId
  ).then((a) => {
    if (c.chatId !== e) {
      r();
      return;
    }
    if (a) {
      c.cfg = a, c.cfgError = "";
      const s = a.config && a.config.release_after_sec;
      c.stale.threshold = typeof s == "number" && isFinite(s) ? s : null;
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
  const t = Ne().React, e = Ne().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
        try {
          const n = Xe();
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
    Dt || (Dt = document.createElement("div"), Dt.id = "qm-settings-root", document.body.appendChild(Dt)), e.render(t.createElement(rc, {
      R: t,
      open: c.visible,
      onClose: () => {
        if (as() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Ls();
        }
        c.visible = !1, c.saveMsg = "", z();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = Ds(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, z(), js(), (n === "global" || n === "default") && ra(), n === "stale" && Kl();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: as(),
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
    }), Dt);
  }
}
function Vl(t) {
  const { R: e, onOpen: n } = t, r = Xe(), a = r && r.Button, s = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, p = { title: s, "aria-label": s }, i = {
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
  return h ? a ? e.createElement(a, {
    type: "text",
    size: "small",
    style: o,
    onClick: n,
    title: p.title,
    "aria-label": p["aria-label"]
  }, h) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: p.title,
    "aria-label": p["aria-label"]
  }, h) : a ? e.createElement(
    a,
    { type: "text", size: "small", style: o, onClick: n },
    s
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    s
  );
}
const Fr = [
  { key: "session", label: "会话模式", hint: "" },
  { key: "default", label: "默认模式", hint: "" },
  // US-007：时段调度页签（位于「默认模式」之后）。本版仅 UI 展示，
  // 不接存储与生效逻辑（生效走读时计算，见需求可行性评估 需求一/四）。
  { key: "schedule", label: "时段调度", hint: "" },
  { key: "global", label: "全局配置", hint: "" },
  // 参考稿提示词页没有顶部说明行，第一行就是「模板库共享范围」。
  { key: "prompt", label: "提示词", hint: "" },
  // 2026-11-15 新增：挂起问卷清理。背景是 manual 问卷本该 30 分钟自动释放，
  // 但 release_survey 的 _reason UnboundLocalError 让 watchdog 释放失败，
  // 问卷永远停在 pending、对应会话一直 409。bug 已修，但历史残骸不会自愈
  // （pending 记录可能已丢失、只剩 survey_state；会话文件也早已不存在），
  // 所以需要一个能「先看清、再手动处置」的页签。
  { key: "stale", label: "问卷清理", hint: "" }
], Ds = (t) => t === "session";
function Yl(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function ec(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function os(t, e, n, r) {
  const a = n === "pc" ? "notify_channel_pc" : "notify_channel_bg", s = c.notifyChannels || [], o = String(
    (n === "pc" ? c.pcCurrent : c.bgCurrent) || "off"
  ), p = String(se(a, "off", "global") || o || "off"), h = ((v) => s.filter((q) => String(q.channel) === v)[0])(p), b = s.filter((v) => n !== "bg" || String(v.channel) !== "browser").map((v) => {
    const q = String(v.channel || ""), $ = String(v.label || q), _ = v.ready !== !1, C = v.verified === !0 || q === "off";
    let M = "";
    return _ ? C || (M = "（待测试）") : M = "（不可用）", { value: q, label: $ + M, disabled: !_ };
  });
  b.length || b.push({ value: "off", label: "关闭", disabled: !1 });
  const S = !h || h.ready !== !1, f = p !== "off" && p !== "browser", k = c.notifyTesting === p, g = h && h.last_test || null, y = c.notifyMsg[p] || "", x = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: p,
      "data-qm-notify-select": "1",
      "data-qm-notify-scene": n,
      style: { flex: "0 0 auto" },
      onChange: (v) => {
        const q = v && v.target ? String(v.target.value) : "off";
        ge(a, q), aa(q);
      }
    }, b.map((v, q) => t.createElement("option", {
      key: "o" + q,
      value: v.value,
      disabled: !!v.disabled
    }, v.label)))
  ];
  if (f && S && x.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: k,
    "data-qm-notify-test": p,
    onClick: (v) => {
      v && v.stopPropagation && v.stopPropagation(), Dl(p);
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
    const v = h.reason_code === "missing_agent_id" || h.reason_code === "agent_not_found";
    x.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": h.reason_code || "",
      style: v ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, h.reason));
  }
  const O = !!(h && h.verified === !0), T = g || y, E = !!y;
  if (T || f && S && !k) {
    const v = g ? g.delivered === !0 : E ? y.indexOf("✓") === 0 : !1;
    let q;
    E ? q = y : g ? q = v ? "✓ 上次测试成功" + (g.note ? "（" + g.note + "）" : "") : "✗ " + (g.error || g.note || "上次测试失败") : q = "未测试";
    const $ = g && g.at_text ? "  ·  " + g.at_text : "", _ = T ? v ? "#52c41a" : "#ff4d4f" : "#faad14";
    x.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": T ? v ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": T && (v || O) ? "1" : "0",
      style: {
        flex: "1 1 240px",
        minWidth: 0,
        fontSize: 11,
        lineHeight: "16px",
        color: _,
        // 允许在任意位置断行：失败原因里有很长的中文句子与 URL 形态内容，
        // 不让它撑破容器（也不要 pre-wrap，那会拒绝折行）。
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word"
      }
    }, q + $));
  }
  return pe(
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
function pe(t, e, n, r, a, s, o, p, i) {
  const h = s || "global", b = ec(o || "global", h), S = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      Yl(t, "sc", h),
      b && h === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    a ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, a) : null
  ], f = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, S),
    t.createElement("div", {
      className: "qm-set-rowctl" + (p ? " qm-set-rowctlwide" : ""),
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
function is(t, e, n, r, a) {
  return t.createElement(
    "div",
    { className: "qm-set-seg", key: e },
    n.map((s, o) => t.createElement("button", {
      key: "s" + o,
      type: "button",
      "data-qm-val": s,
      disabled: !a,
      className: "qm-set-segbtn" + (s === r ? " qm-set-segon" : "") + (a ? "" : " qm-set-ctrldis"),
      onClick: () => {
        a && a(s);
      }
    }, [
      t.createElement("span", { key: "t" }, s)
    ]))
  );
}
function Nn(t, e, n, r) {
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
    onKeyDown: (a) => {
      if (!r) return;
      const s = a && a.key;
      (s === " " || s === "Enter") && (a.preventDefault(), r(!n));
    }
  }, [
    t.createElement("span", { key: "k", className: "qm-set-knob" })
  ]);
}
function it(t, e, n, r, a) {
  if (r && r.length && a) {
    const s = r.map((o, p) => o && typeof o == "object" ? { value: String(o.value), label: String(o.label || o.value) } : { value: String(o), label: String(o) });
    return t.createElement("div", { className: "qm-set-select qm-set-selectlive", key: e }, [
      t.createElement("select", {
        key: "s",
        className: "qm-set-native",
        value: n,
        onChange: (o) => a(o && o.target ? o.target.value : "")
      }, s.map((o, p) => t.createElement("option", { key: "o" + p, value: o.value }, o.label)))
    ]);
  }
  return t.createElement("div", { className: "qm-set-select", key: e }, [
    t.createElement("span", { key: "t", className: "qm-set-selecttext" }, n),
    t.createElement("span", { key: "a", className: "qm-set-selectarrow" }, "▾")
  ]);
}
function ls(t, e, n, r, a) {
  const s = Xl(n), p = r.map((k) => k.id).indexOf(s.provider) >= 0 ? s.provider : "", i = p ? (r.filter((k) => k.id === p)[0] || { models: [] }).models : [], h = i.indexOf(s.model) >= 0 ? s.model : "", b = (k, g) => {
    a && a(k ? k + ":" + g : "");
  }, S = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: p,
    disabled: !a,
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
    disabled: !a || !p,
    title: p ? "选择模型" : "先选厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "";
      b(p, g);
    }
  }, p ? i.map((k, g) => t.createElement("option", { key: "m" + g, value: k }, k)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    S,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    f
  ]);
}
const tc = () => [
  { name: "工作时段", start: "09:00", end: "18:00", mode: "ai", chPc: "", chBg: "" },
  { name: "夜间值守", start: "22:00", end: "06:00", mode: "manual", chPc: "", chBg: "" }
];
let An = tc(), ve = {
  enabled: !0,
  url: "https://example.com/hook/notify",
  method: "post-json",
  tokenPos: "bearer",
  token: "sk-demo-0000000000000000"
};
function nc(t, e, n, r, a) {
  const s = [], o = n === "session" ? "session" : "global", p = {
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
  }, S = {
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
  }, k = a && a.templateOptions || [];
  a && a.modelOptions;
  const g = a && a.providerGroups || [], y = k.map((x) => {
    const O = c.templates.filter((T) => String(T.id) === String(x))[0];
    return { value: x, label: O && (O.name || O.id) || x };
  });
  if (e === "session") {
    const O = String(se("mode", "manual")) !== "recommend";
    if (s.push(pe(
      t,
      "s1",
      "答题模式",
      is(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(se("mode", "manual"))] || "人工",
        (T) => ge("mode", p[T] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), O) {
      s.push(pe(
        t,
        "s2",
        "默认模型",
        ls(
          t,
          "sel2",
          String(se("model_id", "")),
          g,
          (E) => ge("model_id", E)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        jl("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const T = String(se("template_id", "")) || y[0] && y[0].value || "";
      s.push(pe(
        t,
        "s3",
        "提示词模板",
        y.length ? it(
          t,
          "sel3",
          T,
          y,
          (E) => ge("template_id", E)
        ) : it(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), s.push(pe(
        t,
        "s4",
        "携带上下文",
        Nn(
          t,
          "s4sw",
          !!se("with_context", !1),
          (E) => ge("with_context", E)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), s.push(pe(
        t,
        "s5",
        "并行分析各题",
        Nn(
          t,
          "s5sw",
          !!se("parallel", !1),
          (E) => ge("parallel", E)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const T = String(se("mode", "manual", "global")) !== "recommend";
      s.push(pe(
        t,
        "a1",
        "默认答题模式",
        is(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(se("mode", "manual", "global"))] || "人工",
          (E) => ge("mode", p[E] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), T && (s.push(pe(
        t,
        "b1",
        "默认模型",
        ls(
          t,
          "sel2",
          String(se("model_id", "", "global")),
          g,
          (E) => ge("model_id", E)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), s.push(pe(
        t,
        "b2",
        "提示词模板",
        y.length ? it(
          t,
          "sel3",
          String(se("template_id", "", "global")) || y[0].value,
          y,
          (E) => ge("template_id", E)
        ) : it(t, "sel3", "默认六步思维链"),
        y.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), s.push(pe(
        t,
        "b3",
        "携带上下文",
        Nn(
          t,
          "s3",
          !!se("with_context", !1, "global"),
          (E) => ge("with_context", E)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), s.push(pe(
        t,
        "b4",
        "并行分析各题",
        Nn(
          t,
          "s4",
          !!se("parallel", !1, "global"),
          (E) => ge("parallel", E)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      s.push(os(t, o, "pc", "PC 端打开时提醒频道")), s.push(os(t, o, "bg", "后台运行时提醒频道"));
      const O = [
        { value: "post-json", label: "POST（JSON）" },
        { value: "get-query", label: "GET（query 传参）" }
      ], T = [
        { value: "bearer", label: "Authorization: Bearer 头" },
        { value: "query", label: "query 参数 token=…" },
        { value: "none", label: "不携带 token" }
      ], E = (C, M, U) => t.createElement("div", { className: "qm-set-schedfield", key: C }, [
        t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, M),
        U
      ]);
      s.push(t.createElement("div", {
        className: "qm-set-schedcard qm-set-apicard",
        key: "apicard",
        "data-qm-api-card": "1"
      }, [
        // 顶行：标题 +「新增渠道」徽标 + 启用开关（demo 为开启态）
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement(
            "span",
            { key: "t", className: "qm-set-apititle" },
            "自定义 API 通知",
            t.createElement("span", { key: "badge", className: "qm-set-apibadge" }, "新增渠道")
          ),
          t.createElement("button", {
            type: "button",
            key: "sw",
            role: "switch",
            className: "qm-set-apiswitch" + (ve.enabled ? " on" : ""),
            "data-qm-api-switch": "1",
            "aria-checked": ve.enabled ? "true" : "false",
            title: ve.enabled ? "已启用（占位演示，本版不会保存）" : "已停用（占位演示，本版不会保存）",
            onClick: () => {
              ve.enabled = !ve.enabled, z();
            }
          }, t.createElement("span", { className: "qm-set-apiswitchdot", key: "dot" }))
        ]),
        // 占位口径说明（防误以为会保存——同 US-007 时段页说明的做法）
        t.createElement(
          "div",
          { key: "note", className: "qm-set-apinote" },
          "自定义 API 渠道为界面预览（本版不接后端，修改不会保存）。"
        ),
        // URL（占满整行）
        E("furl", "请求地址（URL）", t.createElement("input", {
          key: "url",
          type: "text",
          className: "qm-set-input",
          value: ve.url,
          placeholder: "https://…",
          "data-qm-api-url": "1",
          onChange: (C) => {
            ve.url = C && C.target ? String(C.target.value) : "", z();
          }
        })),
        // 请求方法 + Token 位置（两列网格）
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          E("fmethod", "请求方法", t.createElement("select", {
            key: "method",
            className: "qm-set-native",
            value: ve.method,
            "data-qm-api-method": "1",
            onChange: (C) => {
              ve.method = C && C.target ? String(C.target.value) : "post-json", z();
            }
          }, O.map((C, M) => t.createElement("option", { key: "o" + M, value: C.value }, C.label)))),
          E("ftpos", "Token 位置（可选）", t.createElement("select", {
            key: "tp",
            className: "qm-set-native",
            value: ve.tokenPos,
            "data-qm-api-tokenpos": "1",
            onChange: (C) => {
              ve.tokenPos = C && C.target ? String(C.target.value) : "bearer", z();
            }
          }, T.map((C, M) => t.createElement("option", { key: "o" + M, value: C.value }, C.label))))
        ]),
        // Token 密码框（type=password 回显打码形态）
        E("ftoken", "Token（可选，保存后回显打码）", t.createElement("input", {
          key: "tk",
          type: "password",
          className: "qm-set-input",
          value: ve.token,
          placeholder: "选填",
          "data-qm-api-token": "1",
          onChange: (C) => {
            ve.token = C && C.target ? String(C.target.value) : "", z();
          }
        })),
        // 发送测试（占位：仅本地 toast，不调用后端）
        t.createElement("div", { key: "foot", className: "qm-set-apifoot" }, [
          t.createElement("button", {
            type: "button",
            key: "test",
            className: "qm-set-apitest",
            "data-qm-api-test": "1",
            title: "占位演示：本版未接发送逻辑",
            onClick: () => j("info", "占位：未接发送逻辑")
          }, "发送测试")
        ])
      ])), s.push(pe(
        t,
        "e6",
        "单题分析超时",
        it(
          t,
          "sel4",
          b[Number(se("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (C) => ge("model_timeout_sec", h[C] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), s.push(pe(
        t,
        "d4",
        "等待提示阈值",
        it(
          t,
          "sel5",
          f[Number(se("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (C) => ge("wait_hint_sec", S[C] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const v = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], q = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, $ = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, _ = Number(se("gate_log_limit", 200, "global"));
      s.push(pe(
        t,
        "d5",
        "拦截记录",
        it(
          t,
          "sel6",
          $[_] || "最近 200 条（默认）",
          v,
          (C) => ge("gate_log_limit", q[C] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const x = c.templates, O = c.tplEdit;
    if (s.push(pe(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), x.length ? s.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      x.map((T, E) => {
        const v = !!T.builtin, $ = (String(T.note || T.desc || "").trim() || String(T.system || T.system_prompt || T.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), _ = $.length > 90 ? $.slice(0, 90) + "…" : $;
        return t.createElement("div", { className: "qm-set-item", key: "i" + E }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(T.name || T.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (v ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, v ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(T.id),
              onClick: () => {
                Hl(String(T.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (v ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(T.id),
              disabled: v,
              title: v ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                v || Jl(String(T.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, _)
        ]);
      })
    )) : s.push(t.createElement(
      "div",
      { className: "qm-set-sessempty", key: "e" },
      "模板库为空（或尚未加载）"
    )), s.push(t.createElement("div", { className: "qm-set-toolbar", key: "tb" }, [
      t.createElement("button", {
        type: "button",
        className: "qm-set-btn qm-set-btnnew",
        key: "new",
        "data-qm-tpl-new": "1",
        onClick: () => {
          Wl();
        }
      }, "＋ 新建模板")
    ])), O) {
      const T = (E, v, q, $, _) => {
        var C, M;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + v }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, E),
          q ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: $,
            "data-qm-tpl-field": v,
            placeholder: _,
            value: String(((C = c.tplEdit) == null ? void 0 : C[v]) || ""),
            onChange: (U) => ss(v, U && U.target ? U.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": v,
            placeholder: _,
            value: String(((M = c.tplEdit) == null ? void 0 : M[v]) || ""),
            onChange: (U) => ss(v, U && U.target ? U.target.value : "")
          })
        ]);
      };
      s.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (O.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          O.id ? "编辑模板：" + (O.name || O.id) : "新建模板"
        ),
        T("模板名称", "name", !1, 0, "如：简短结论版"),
        T(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        T(
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
              Gl();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Ul();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "schedule") {
    const x = [
      { value: "ai", label: "自动执行" },
      { value: "recommend", label: "只用推荐" },
      { value: "manual", label: "人工作答" }
    ], O = (v) => {
      const q = (c.notifyChannels || []).filter(($) => v !== "bg" || String($.channel) !== "browser").map(($) => ({
        value: String($.channel || ""),
        label: String($.label || $.channel || "")
      }));
      return [{ value: "", label: "跟随全局" }].concat(q);
    }, T = (v, q, $) => {
      const _ = An[v];
      _ && (_[q] = $, z());
    }, E = (v, q) => {
      const $ = (C, M, U) => {
        const Y = {
          type: "time",
          key: C,
          value: M,
          style: { flex: "1 1 auto", minWidth: 0 },
          onChange: (H) => T(
            q,
            C,
            H && H.target ? String(H.target.value) : ""
          )
        };
        return Y["data-qm-sched-" + U] = String(q), t.createElement("input", Y);
      }, _ = (C, M, U, Y) => {
        const H = {
          key: C,
          className: "qm-set-native",
          value: M,
          onChange: (R) => T(
            q,
            C,
            R && R.target ? String(R.target.value) : ""
          )
        };
        return H["data-qm-sched-" + U] = String(q), t.createElement("select", H, Y.map((R, Z) => t.createElement("option", { key: "o" + Z, value: R.value }, R.label)));
      };
      return t.createElement("div", {
        className: "qm-set-schedcard",
        key: "sc" + q,
        "data-qm-sched-card": String(q)
      }, [
        // 顶行：名称 + 删除按钮
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement("input", {
            key: "name",
            className: "qm-set-input qm-set-schedname",
            value: v.name,
            placeholder: "时段名称（如：工作时段）",
            "data-qm-sched-name": String(q),
            onChange: (C) => T(
              q,
              "name",
              C && C.target ? String(C.target.value) : ""
            )
          }),
          t.createElement("button", {
            type: "button",
            key: "del",
            className: "qm-set-scheddel",
            "data-qm-sched-del": String(q),
            title: "删除该时段（仅演示，不影响真实配置）",
            onClick: () => {
              An.splice(q, 1), z();
            }
          }, "删除")
        ]),
        // 中部网格：起止时间 / 答题方式 / PC 端渠道 / 后台渠道
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          t.createElement("div", { className: "qm-set-schedfield", key: "ftime" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "生效时间"),
            t.createElement("div", { className: "qm-set-schedtime", key: "t" }, [
              $("start", v.start, "start"),
              t.createElement("span", { key: "sep", className: "qm-set-schedtimesep" }, "至"),
              $("end", v.end, "end")
            ])
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fmode" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "答题方式"),
            _("mode", v.mode, "mode", x)
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fpc" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "PC 端通知渠道"),
            _("chPc", v.chPc, "pc", O("pc"))
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fbg" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "后台通知渠道"),
            _("chBg", v.chBg, "bg", O("bg"))
          ])
        ])
      ]);
    };
    s.push(t.createElement("div", {
      className: "qm-set-schednote",
      key: "schednote",
      "data-qm-sched-note": "1"
    }, [
      t.createElement(
        "div",
        { key: "t", className: "qm-set-schednotetitle" },
        "按时段为问卷自动切换执行方式与通知渠道："
      ),
      t.createElement(
        "div",
        { key: "d", className: "qm-set-schednotedesc" },
        "多个时段按配置顺序匹配，命中第一个即生效；起止时间支持跨零点（如 22:00 → 次日 06:00）；没有任何时段命中时，回落到当前会话 / 默认模式的配置。"
      ),
      t.createElement(
        "div",
        { key: "demo", className: "qm-set-schednotedemo" },
        "以下为界面预览（示例数据，本版不接后端，修改不会保存）。"
      )
    ])), s.push(t.createElement("div", {
      className: "qm-set-schedlist",
      key: "schedlist",
      "data-qm-sched-list": "1"
    }, An.map((v, q) => E(v, q)))), s.push(t.createElement("button", {
      type: "button",
      key: "schedadd",
      className: "qm-set-btn qm-set-btnnew qm-set-schedadd",
      "data-qm-sched-add": "1",
      title: "添加一组时段（仅演示，不会保存）",
      onClick: () => {
        An.push({ name: "", start: "", end: "", mode: "ai", chPc: "", chBg: "" }), z();
      }
    }, "＋ 添加时段"));
  } else if (e === "stale") {
    const x = c.stale, O = x && x.rows || [], T = x && x.exceeded || [], E = x && x.within || [], v = (x && x.blocking || []).length ? x.blocking : O.filter((H) => H && H.nature === "blocking"), q = (x && x.residual || []).length ? x.residual : O.filter((H) => H && H.nature !== "blocking"), $ = v.filter(
      (H) => H && T.some(
        (R) => R.tool_call_id === H.tool_call_id
      )
    ), _ = x ? x.threshold : null, C = Ur(_), M = _ !== null && _ <= 0, U = !!(x && (x.busy || x.thrBusy)) || $.length === 0 || M, Y = !!(x && (x.busy || x.thrBusy)) || q.length === 0;
    if (s.push(t.createElement("div", {
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
            M ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${C} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(x && x.thrBusy),
            value: _ === null ? "" : String(_),
            onChange: (H) => {
              const R = Number(H.target.value);
              c.draft.release_after_sec = R, c.stale.threshold = R, c.stale.msgKind = "", c.stale.msg = "已选择「" + Ur(R) + "」，点下方「保存」后生效", z();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            _ === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
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
          disabled: !!(x && x.busy),
          onClick: () => {
            Vi();
          }
        }, x && x.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: U,
          title: M ? "自动释放已关闭，请逐条释放" : $.length ? `释放全部 ${$.length} 条已超阈值的阻塞问卷（观察期内 ${E.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            Yi();
          }
        }, $.length ? `全部释放（阻塞·已超阈值 ${$.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: Y,
          title: q.length ? `清理全部 ${q.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            el();
          }
        }, q.length ? `全部清理（残留 ${q.length} 条）` : "全部清理")
      ])
    ])), x && x.msg && s.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": x.msgKind || "info"
    }, x.msg)), x && x.scanned && O.length === 0 && s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!x || !x.scanned) && (x && x.msg || s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), O.length) {
      const R = {};
      T.forEach((I) => {
        R[I.tool_call_id] = !0;
      });
      const Z = (I, qe) => {
        if (!I) return;
        const ie = () => {
          c.stale.copied = qe, z(), setTimeout(() => {
            c.stale.copied === qe && (c.stale.copied = "", z());
          }, 1600);
        };
        try {
          const K = typeof navigator < "u" ? navigator : null;
          if (K && K.clipboard && K.clipboard.writeText)
            K.clipboard.writeText(I).then(ie, ie);
          else {
            const Q = document.createElement("textarea");
            Q.value = I, document.body.appendChild(Q), Q.select(), document.execCommand("copy"), document.body.removeChild(Q), ie();
          }
        } catch {
          ie();
        }
      }, Ge = (I, qe) => {
        const ie = !!I.terminable, K = !!R[I.tool_call_id], Q = qe === "blocking", ye = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const xe = I.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${I.idle_text}，阈值 ${C}）${xe}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && $r([I.tool_call_id]);
        }, X = !!(x && x.copied) && x.copied === I.tool_call_id, ze = (xe) => {
          const ue = Number(xe);
          if (!xe || !isFinite(ue) || ue <= 0) return "-";
          try {
            return new Date(ue * 1e3).toLocaleString();
          } catch {
            return "-";
          }
        }, le = (xe, ue, Be, Je) => t.createElement("div", { className: "qm-set-stalemetaitem", key: xe }, [
          t.createElement("span", {
            className: "qm-set-stalemetalabel",
            key: "l"
          }, ue),
          t.createElement("span", {
            className: "qm-set-stalemetavalue",
            key: "v",
            ...Je || {}
          }, Be)
        ]);
        return t.createElement("div", {
          className: "qm-set-stalecard",
          key: I.tool_call_id + ":" + qe,
          "data-qm-stale-row": I.tool_call_id,
          "data-qm-stale-nature": qe,
          "data-qm-stale-group": K ? "exceeded" : "within"
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
              I.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : I.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : I.reason_code === "no-future" ? "无唤醒句柄" : I.reason_code === "future-done" ? "已结束未收尾" : K ? "已超阈值" : "观察期内"
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
            le("agent", "归属", I.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            le(
              "sid",
              "会话 ID",
              X ? "✓ 会话 ID 已复制" : I.session_id || "-",
              {
                title: X ? "已复制到剪贴板" : I.session_id ? "点击复制完整会话 ID：" + I.session_id : "",
                style: I.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: X ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": I.tool_call_id,
                onClick: () => {
                  Z(String(I.session_id || ""), I.tool_call_id);
                }
              }
            ),
            le("tcid", "问卷 ID", I.tool_call_id || "-"),
            le("idle", "挂起时长", I.idle_text || "-"),
            le("created", "发起时间", ze(I.created_at)),
            le("mode", "作答模式", I.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...Q ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": I.tool_call_id,
                disabled: !!(x && x.busy),
                title: K ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  K ? $r([I.tool_call_id]) : ye();
                }
              }, K ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": I.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(x && x.busy) || !ie,
                title: ie ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  tl([I.tool_call_id]);
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
                  $r([I.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, Qt = (I, qe, ie, K, Q) => {
        if (!K || !K.length) return null;
        const ye = Math.max(1, Math.ceil(K.length / 5)), X = Math.min(
          Math.max(0, Number(x[Q]) || 0),
          ye - 1
        ), ze = K.slice(
          X * 5,
          X * 5 + 5
        ), le = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": I
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": I
            }, qe),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, ie)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": I
          }, ze.map((xe) => Ge(xe, I)))
        ];
        if (ye > 1) {
          const xe = (Be) => {
            c.stale[Q] = Be, z();
          }, ue = (Be, Je, pt, qt) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: qt,
            "data-qm-stale-page": String(Je),
            disabled: pt,
            onClick: () => {
              xe(Je);
            }
          }, Be);
          le.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": I
          }, [
            ue("上一页", X - 1, X <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(X + 1)
            }, `第 ${X + 1} / ${ye} 页（共 ${K.length} 条，每页 5 条）`),
            ue("下一页", X + 1, X >= ye - 1, "next")
          ]));
        }
        return le;
      }, D = Qt(
        "blocking",
        `🔴 正在阻塞会话（${v.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        v,
        "page"
      ), Ae = Qt(
        "residual",
        `⚪ 异常残留（${q.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        q,
        "resPage"
      );
      D && s.push(...D), Ae && s.push(...Ae);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, s);
}
function rc(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const a = Xe(), s = a && a.Modal, o = !t.tab, p = t.tab || "", i = Ds(p) ? "session" : "global", h = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Fr.map((Z) => e.createElement("button", {
      key: Z.key,
      type: "button",
      className: "qm-set-tab" + (!o && Z.key === p ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(Z.key);
        } catch {
        }
      }
    }, Z.label))
  ), b = Fr.filter((Z) => Z.key === p)[0] || Fr[0], S = !!(t.cfg && t.cfg.has_session), f = S ? "session" : "default", k = S ? "会话模式" : "默认模式", g = e.createElement("div", {
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
  ]), O = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, T = null, E = o ? e.createElement("div", {
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
  }))) : null, v = o ? E : nc(e, p, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), q = t.dirtyCount || 0, $ = String(t.tab || ""), _ = $ === "session" || $ === "default";
  let C;
  $ === "schedule" ? C = "时段调度为界面预览（本版不保存，现有配置不受影响）" : _ ? C = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : C = $ === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const M = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      q ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + q + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, C)
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
          Ls(), z();
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
          Fl();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), U = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, Y = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, H = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    T,
    O,
    v,
    U,
    Y
  ]), R = e.createElement("div", { className: "qm-set-wrap" }, [
    x,
    h,
    H,
    M
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
function ac(t) {
  try {
    const e = t && t.sender, n = Ne().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(Vl, {
      R: n,
      onOpen: () => {
        Zl();
      }
    });
    e.addPrefix(ks, r, {
      id: "question-modal.settings-btn",
      order: ns
    }), console.log("[question-modal] settings entry registered (order " + ns + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function sc() {
  const t = Ai();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return Oi(), t.toolRender(ks, Ha, Bl), console.log("[question-modal] registered via chat.toolRender for", Ha), ac(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!sc()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
