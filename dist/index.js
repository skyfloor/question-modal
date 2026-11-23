var Vo = Object.defineProperty;
var Ua = (t) => {
  throw TypeError(t);
};
var Yo = (t, e, n) => e in t ? Vo(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var G = (t, e, n) => Yo(t, typeof e != "symbol" ? e + "" : e, n), ei = (t, e, n) => e.has(t) || Ua("Cannot " + n);
var Ga = (t, e, n) => e.has(t) ? Ua("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var qn = (t, e, n) => (ei(t, e, "access private method"), n);
function ea() {
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
let dt = ea();
function bs(t) {
  dt = t;
}
const ys = /[&<>"']/, ti = new RegExp(ys.source, "g"), xs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, ni = new RegExp(xs.source, "g"), ri = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Ja = (t) => ri[t];
function we(t, e) {
  if (e) {
    if (ys.test(t))
      return t.replace(ti, Ja);
  } else if (xs.test(t))
    return t.replace(ni, Ja);
  return t;
}
const ai = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function si(t) {
  return t.replace(ai, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const oi = /(^|[^\[])\^/g;
function H(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (a, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(oi, "$1"), n = n.replace(a, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function Za(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Ut = { exec: () => null };
function Ka(t, e) {
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
function Sn(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let a = 0;
  for (; a < r && t.charAt(r - a - 1) === e; )
    a++;
  return t.slice(0, r - a);
}
function ii(t, e) {
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
function Qa(t, e, n, r) {
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
function li(t, e) {
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
class Rn {
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
        text: this.options.pedantic ? r : Sn(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], a = li(r, n[3] || "");
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
        const a = Sn(r, "#");
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
      r = Sn(r.replace(/^ *>[ \t]?/gm, ""), `
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
        let q = n[2].split(`
`, 1)[0].replace(/^\t+/, (z) => " ".repeat(3 * z.length)), m = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = q.trimStart()) : (k = n[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = q.slice(k), k += n[1].length);
        let g = !1;
        if (!q && /^ *$/.test(m) && (p += m + `
`, e = e.substring(m.length + 1), b = !0), !b) {
          const z = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), N = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), E = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const w = e.split(`
`, 1)[0];
            if (m = w, this.options.pedantic && (m = m.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), _.test(m) || E.test(m) || z.test(m) || N.test(e))
              break;
            if (m.search(/[^ ]/) >= k || !m.trim())
              i += `
` + m.slice(k);
            else {
              if (g || q.search(/[^ ]/) >= 4 || _.test(q) || E.test(q) || N.test(q))
                break;
              i += `
` + m;
            }
            !g && !m.trim() && (g = !0), p += w + `
`, e = e.substring(w.length + 1), q = m.slice(k);
          }
        }
        s.loose || (h ? s.loose = !0 : /\n *\n *$/.test(p) && (h = !0));
        let x = null, y;
        this.options.gfm && (x = /^\[[ xX]\] /.exec(i), x && (y = x[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: p,
          task: !!x,
          checked: y,
          loose: !1,
          text: i,
          tokens: []
        }), s.raw += p;
      }
      s.items[s.items.length - 1].raw = p.trimEnd(), s.items[s.items.length - 1].text = i.trimEnd(), s.raw = s.raw.trimEnd();
      for (let b = 0; b < s.items.length; b++)
        if (this.lexer.state.top = !1, s.items[b].tokens = this.lexer.blockTokens(s.items[b].text, []), !s.loose) {
          const q = s.items[b].tokens.filter((k) => k.type === "space"), m = q.length > 0 && q.some((k) => /\n.*\n/.test(k.raw));
          s.loose = m;
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
    const r = Ka(n[1]), a = n[2].replace(/^\||\| *$/g, "").split("|"), s = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(Ka(p, o.header.length).map((i) => ({
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
        const o = Sn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = ii(n[2], "()");
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
      return a = a.trim(), /^</.test(a) && (this.options.pedantic && !/>$/.test(r) ? a = a.slice(1) : a = a.slice(1, -1)), Qa(n, {
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
      return Qa(r, s, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let a = this.rules.inline.emStrongLDelim.exec(e);
    if (!a || a[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(a[1] || a[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...a[0]].length - 1;
      let p, i, h = o, b = 0;
      const q = a[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (q.lastIndex = 0, n = n.slice(-1 * e.length + o); (a = q.exec(n)) != null; ) {
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
        const m = [...a[0]][0].length, k = e.slice(0, o + a.index + m + i);
        if (Math.min(o, i) % 2) {
          const x = k.slice(1, -1);
          return {
            type: "em",
            raw: k,
            text: x,
            tokens: this.lexer.inlineTokens(x)
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
const ci = /^(?: *(?:\n|$))+/, di = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, pi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Kt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ui = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, ks = /(?:[*+-]|\d{1,9}[.)])/, vs = H(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, ks).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), ta = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, fi = /^[^\n]+/, na = /(?!\s*\])(?:\\.|[^\[\]\\])+/, mi = H(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", na).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), gi = H(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ks).getRegex(), Wn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", ra = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, hi = H("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", ra).replace("tag", Wn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ws = H(ta).replace("hr", Kt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Wn).getRegex(), bi = H(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ws).getRegex(), aa = {
  blockquote: bi,
  code: di,
  def: mi,
  fences: pi,
  heading: ui,
  hr: Kt,
  html: hi,
  lheading: vs,
  list: gi,
  newline: ci,
  paragraph: ws,
  table: Ut,
  text: fi
}, Xa = H("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Kt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Wn).getRegex(), yi = {
  ...aa,
  table: Xa,
  paragraph: H(ta).replace("hr", Kt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Xa).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Wn).getRegex()
}, xi = {
  ...aa,
  html: H(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", ra).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ut,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: H(ta).replace("hr", Kt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", vs).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, qs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, ki = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Ss = /^( {2,}|\\)\n(?!\s*$)/, vi = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Qt = "\\p{P}\\p{S}", wi = H(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Qt).getRegex(), qi = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Si = H(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Qt).getRegex(), _i = H("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Qt).getRegex(), Ei = H("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Qt).getRegex(), Ci = H(/\\([punct])/, "gu").replace(/punct/g, Qt).getRegex(), Ti = H(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ni = H(ra).replace("(?:-->|$)", "-->").getRegex(), Ai = H("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ni).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Mn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ii = H(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Mn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), _s = H(/^!?\[(label)\]\[(ref)\]/).replace("label", Mn).replace("ref", na).getRegex(), Es = H(/^!?\[(ref)\](?:\[\])?/).replace("ref", na).getRegex(), zi = H("reflink|nolink(?!\\()", "g").replace("reflink", _s).replace("nolink", Es).getRegex(), sa = {
  _backpedal: Ut,
  // only used for GFM url
  anyPunctuation: Ci,
  autolink: Ti,
  blockSkip: qi,
  br: Ss,
  code: ki,
  del: Ut,
  emStrongLDelim: Si,
  emStrongRDelimAst: _i,
  emStrongRDelimUnd: Ei,
  escape: qs,
  link: Ii,
  nolink: Es,
  punctuation: wi,
  reflink: _s,
  reflinkSearch: zi,
  tag: Ai,
  text: vi,
  url: Ut
}, Oi = {
  ...sa,
  link: H(/^!?\[(label)\]\((.*?)\)/).replace("label", Mn).getRegex(),
  reflink: H(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Mn).getRegex()
}, Xr = {
  ...sa,
  escape: H(qs).replace("])", "~|])").getRegex(),
  url: H(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, $i = {
  ...Xr,
  br: H(Ss).replace("{2,}", "*").getRegex(),
  text: H(Xr.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, _n = {
  normal: aa,
  gfm: yi,
  pedantic: xi
}, Lt = {
  normal: sa,
  gfm: Xr,
  breaks: $i,
  pedantic: Oi
};
class Me {
  constructor(e) {
    G(this, "tokens");
    G(this, "options");
    G(this, "state");
    G(this, "tokenizer");
    G(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || dt, this.options.tokenizer = this.options.tokenizer || new Rn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: _n.normal,
      inline: Lt.normal
    };
    this.options.pedantic ? (n.block = _n.pedantic, n.inline = Lt.pedantic) : this.options.gfm && (n.block = _n.gfm, this.options.breaks ? n.inline = Lt.breaks : n.inline = Lt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: _n,
      inline: Lt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Me(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Me(n).inlineTokens(e);
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
          const q = e.slice(1);
          let m;
          this.options.extensions.startInline.forEach((k) => {
            m = k.call({ lexer: this }, q), typeof m == "number" && m >= 0 && (b = Math.min(b, m));
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
class Pn {
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
    const a = Za(e);
    if (a === null)
      return r;
    e = a;
    let s = '<a href="' + e + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + r + "</a>", s;
  }
  image(e, n, r) {
    const a = Za(e);
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
class oa {
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
    this.options = e || dt, this.options.renderer = this.options.renderer || new Pn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new oa();
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
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, si(this.parseInline(o.tokens, this.textRenderer)));
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
            const q = o.rows[b];
            i = "";
            for (let m = 0; m < q.length; m++)
              i += this.renderer.tablecell(this.parseInline(q[m].tokens), { header: !1, align: o.align[m] });
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
          for (let q = 0; q < o.items.length; q++) {
            const m = o.items[q], k = m.checked, g = m.task;
            let x = "";
            if (m.task) {
              const y = this.renderer.checkbox(!!k);
              h ? m.tokens.length > 0 && m.tokens[0].type === "paragraph" ? (m.tokens[0].text = y + " " + m.tokens[0].text, m.tokens[0].tokens && m.tokens[0].tokens.length > 0 && m.tokens[0].tokens[0].type === "text" && (m.tokens[0].tokens[0].text = y + " " + m.tokens[0].tokens[0].text)) : m.tokens.unshift({
                type: "text",
                text: y + " "
              }) : x += y + " ";
            }
            x += this.parse(m.tokens, h), b += this.renderer.listitem(x, g, !!k);
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
class Gt {
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
G(Gt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var ct, Vr, Cs;
class Ri {
  constructor(...e) {
    Ga(this, ct);
    G(this, "defaults", ea());
    G(this, "options", this.setOptions);
    G(this, "parse", qn(this, ct, Vr).call(this, Me.lex, Pe.parse));
    G(this, "parseInline", qn(this, ct, Vr).call(this, Me.lexInline, Pe.parseInline));
    G(this, "Parser", Pe);
    G(this, "Renderer", Pn);
    G(this, "TextRenderer", oa);
    G(this, "Lexer", Me);
    G(this, "Tokenizer", Rn);
    G(this, "Hooks", Gt);
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
        const s = this.defaults.renderer || new Pn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.renderer[p], h = s[p];
          s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q || "";
          };
        }
        a.renderer = s;
      }
      if (r.tokenizer) {
        const s = this.defaults.tokenizer || new Rn(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const p = o, i = r.tokenizer[p], h = s[p];
          s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q;
          };
        }
        a.tokenizer = s;
      }
      if (r.hooks) {
        const s = this.defaults.hooks || new Gt();
        for (const o in r.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.hooks[p], h = s[p];
          Gt.passThroughHooks.has(o) ? s[p] = (b) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(s, b)).then((m) => h.call(s, m));
            const q = i.call(s, b);
            return h.call(s, q);
          } : s[p] = (...b) => {
            let q = i.apply(s, b);
            return q === !1 && (q = h.apply(s, b)), q;
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
    return Me.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return Pe.parse(e, n ?? this.defaults);
  }
}
ct = new WeakSet(), Vr = function(e, n) {
  return (r, a) => {
    const s = { ...a }, o = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const p = qn(this, ct, Cs).call(this, !!o.silent, !!o.async);
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
}, Cs = function(e, n) {
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
const lt = new Ri();
function F(t, e) {
  return lt.parse(t, e);
}
F.options = F.setOptions = function(t) {
  return lt.setOptions(t), F.defaults = lt.defaults, bs(F.defaults), F;
};
F.getDefaults = ea;
F.defaults = dt;
F.use = function(...t) {
  return lt.use(...t), F.defaults = lt.defaults, bs(F.defaults), F;
};
F.walkTokens = function(t, e) {
  return lt.walkTokens(t, e);
};
F.parseInline = lt.parseInline;
F.Parser = Pe;
F.parser = Pe.parse;
F.Renderer = Pn;
F.TextRenderer = oa;
F.Lexer = Me;
F.lexer = Me.lex;
F.Tokenizer = Rn;
F.Hooks = Gt;
F.parse = F;
F.options;
F.setOptions;
F.use;
F.walkTokens;
F.parseInline;
Pe.parse;
Me.lex;
const Ts = "question-modal", Va = "question_modal", Pr = 3, Ya = "gate-v2@2026.10.21";
function Ne() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Mi() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Xe() {
  return Ne().antd || {};
}
function Pi() {
  return Ne().antdIcons || {};
}
const Li = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function Lr(t) {
  const e = Pi();
  for (const n of Li) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Bi() {
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
let Hn = "", Ns = "";
function ia(t, e) {
  t && (Ns = t), e && (Hn = e);
}
function B() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = Ne(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Hn), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function Xt() {
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
  return Ns;
}
globalThis.__qmSessionProbe = Xt;
let es = null;
function ji() {
  if (es) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (es = t.setInterval(() => {
    try {
      fetch(L("/heartbeat"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({ session_id: Xt() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
ji();
function Bt() {
  try {
    const t = Ne(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Hn;
}
const Br = {};
async function Di(t, e, n) {
  if (typeof window > "u" || Br[t]) return "skipped";
  try {
    const s = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return Br[t] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  Br[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", a = window.Notification;
  if (!a) return "inpage";
  try {
    if (a.permission === "default" && await new Promise((p) => {
      let i = !1;
      const h = (b) => {
        i || (i = !0, p(b));
      };
      try {
        const b = a.requestPermission((q) => h(q));
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
  const e = Jt(t);
  return e && e.session_id ? e.session_id : Xt();
}
const jr = 180, Fi = 20, As = 6e3, Wi = 60, Hi = 8;
function Ui() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Gi = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function ts(t) {
  try {
    return String(t || "").replace(Gi, "").length;
  } catch {
    return 0;
  }
}
function ns(t) {
  const e = Ui();
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
    r = ts((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - ts(n.textContent);
}
function Ji(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右上角 🔒 释放阻塞" : "⏳ 已提交，模型处理中";
}
function Zi(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function rs(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: As });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const Ki = "qm:v1:analysis:global", Qi = "qm:v1:analysis:", Xi = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function jt(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function Vi(t) {
  if (!t || typeof t != "object") return { ...Xi };
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
function Yi() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(Qi) === 0 && n !== Ki && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function el() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: B() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : Vi(e.prefs);
  } catch {
    return null;
  }
}
async function la() {
  try {
    const t = await fetch(L("/question-modal/templates"), { headers: B() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function En(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(L("/question-modal/survey-action"), {
      method: "POST",
      headers: B(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Fn()
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
async function tl(t) {
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
function nl(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, a = 0, s = null, o = 0, p = !1, i = 0, h = 0, b = null;
  const q = (g) => {
    n || b === g || (b = g, e.onStatus(g));
  }, m = () => {
    if (!n)
      try {
        const g = typeof AbortController < "u" ? new AbortController() : null, x = L("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, y = { headers: B() };
        g && (y.signal = g.signal), r = () => {
          try {
            g && g.abort();
          } catch {
          }
        }, fetch(x, y).then(async (N) => {
          const _ = Al(N);
          if (!N.ok || !N.body || _) {
            if (N.status === 404 || N.status === 501 || N.status === 405) {
              p = !0, q(!1);
              return;
            }
            throw _ && (i += 1), new Error(_ ? "blocked" : "HTTP " + N.status);
          }
          a = 0, i = 0, q(!0);
          const E = N.body.getReader(), w = new TextDecoder();
          let R = "";
          const S = () => {
            E.read().then(({ done: T, value: C }) => {
              if (T) {
                k();
                return;
              }
              R += w.decode(C, { stream: !0 });
              let W;
              for (; (W = R.indexOf(`

`)) >= 0; ) {
                const V = R.slice(0, W);
                R = R.slice(W + 2), V.split(`
`).forEach((U) => {
                  if (!U.startsWith("data: ")) return;
                  let M = null;
                  try {
                    M = JSON.parse(U.slice(6));
                  } catch {
                    return;
                  }
                  M && (M.kind === "snapshot" ? (o = Math.max(o, parseInt(M.rev || 0, 10) || 0), e.onSnapshot(o, M.state || null)) : M.kind === "change" && (o = Math.max(o, parseInt(M.rev || 0, 10) || 0), e.onChange(M)));
                });
              }
              n || S();
            }).catch(() => {
              k();
            });
          };
          S();
        }).catch(() => {
          k();
        });
      } catch {
        k();
      }
  }, k = () => {
    if (n || p)
      return;
    if (q(!1), i += 1, h || (h = Date.now()), i >= js) {
      if (Date.now() - (h || Date.now()) >= Fs) {
        p = !0, q(!1);
        return;
      }
      s = setTimeout(m, Ds);
      return;
    }
    a = Math.min(a + 1, 6);
    const g = Math.min(1e4, 500 * Math.pow(2, a));
    s = setTimeout(m, g);
  };
  return m(), () => {
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
async function Dr(t, e, n) {
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
let Is = null;
async function Zt(t, e, n, r) {
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
    return Is = { chatId: a, at: Date.now(), data: h }, h;
  } catch {
    return null;
  }
}
function zs() {
  Is = null;
}
async function Un() {
  const t = await fetch(
    L("/question-modal/stale-surveys"),
    { headers: B() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Gn(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function Yr(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function ca(t) {
  const e = await fetch(L("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function rl(t) {
  const e = await fetch(L("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: B(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function al() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", $();
  const t = Date.now();
  try {
    const e = await Un();
    Gn(e), c.stale.page = 0, c.stale.resPage = 0;
    const n = c.stale.rows.length, r = c.stale.blocking.length, a = c.stale.residual.length, s = c.stale.exceeded.length, o = c.stale.within.length, p = Date.now() - t;
    c.stale.msgKind = "ok";
    const i = Yr(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${a} 条；已超阈值 ${s} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${p}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${p}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.blocking = [], c.stale.residual = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, $();
  }
}
async function Fr(t, e = "释放") {
  c.stale.busy = !0, c.stale.msg = "", $();
  try {
    const n = await ca({ tool_call_ids: t }), r = Number(n && n.released) || 0, a = Number(n && n.already) || 0, s = Number(n && n.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `${e} ${r} 条，${s} 条未成功（见日志）` + (a ? `；${a} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (a ? `；${a} 条此前已处理` : "") : `无需${e}：${a || t.length} 条此前已处理`;
    const o = await Un();
    Gn(o);
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, $();
  }
}
async function sl() {
  c.stale.busy = !0, c.stale.msg = "", $();
  try {
    const t = await ca({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, a = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = a === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${a} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const s = await Un();
    Gn(s);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, $();
  }
}
async function ol() {
  const t = (c.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    c.stale.msgKind = "info", c.stale.msg = "当前没有可清理的残留问卷", $();
    return;
  }
  c.stale.busy = !0, c.stale.msg = "", $();
  try {
    const e = await ca({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, a = Number(e && e.failed) || 0;
    c.stale.msgKind = a > 0 ? "warn" : "ok", c.stale.msg = a > 0 ? `清理 ${n} 条，${a} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const s = await Un();
    Gn(s), c.stale.resPage = 0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, $();
  }
}
async function il(t) {
  c.stale.busy = !0, c.stale.msg = "", $();
  try {
    const e = await rl(t), n = e && e.results || [], r = n.filter((s) => s && s.stopped).length, a = n.filter((s) => s && !s.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (a ? `；${a} 个会话已不存在` : "") : `${a} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, $();
  }
}
async function Os(t) {
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
async function $s(t) {
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
async function Rs() {
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
function ll(t) {
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
function qt(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Wr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((a) => {
    if (n && n.has(a) || !Object.prototype.hasOwnProperty.call(r, a)) return;
    const s = e[a];
    !s || typeof s != "object" || !qt(r[a]) && qt(s) && (r[a] = { ...s });
  }), r;
}
function as(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function ss(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((a) => Number(a && a.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function cl(t, e, n) {
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
let Ms = !0;
function Ln(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (Ms ? "第 " + (e + 1) + " 题" : "");
}
function Le(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function dl(t, e) {
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
function pl(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const a = String(r);
    if (a.startsWith("=")) return e.has(a.slice(1));
    if (e.has(a)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(a) !== -1 || a.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function Ps(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const a = parseInt(n[1], 10);
    if (a >= 0 && a < e.length) return a;
  }
  return e.findIndex((a) => (a.title || "").trim() === t.trim());
}
function Ls(t, e, n) {
  const r = e[t], a = r && r.showIf;
  if (!a || typeof a != "object" || !Object.keys(a).length) return !0;
  for (const s of Object.keys(a)) {
    const o = Ps(s, e);
    if (o < 0) continue;
    const p = e[o];
    if (!p) continue;
    if (p.showIf && !Ls(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !pl(a[s], dl(p, i))) return !1;
  }
  return !0;
}
function Ue(t, e) {
  const n = [];
  return t.forEach((r, a) => {
    Ls(a, t, e) && n.push(a);
  }), n;
}
function ul(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function Cn(t) {
  return Array.isArray(t.questions);
}
function fl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function ml(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((a) => a && (a.text || a.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function gl(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function hl(t) {
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
function Dt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const a = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${a === "watchdog" ? "系统自动释放" : a === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + $n(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((a) => {
    const s = n[a];
    if (!s || typeof s != "object") return;
    const o = Ps(a, t), p = o >= 0 ? t[o] : null, i = p ? oe(p) === "single" ? "单选" : oe(p) === "multi" ? "多选" : "问答" : "问答", h = p ? Ln(p, o) : a;
    let b = s.value;
    if (Array.isArray(b) && (b = b.join("、")), s.other && (b = (b ? b + "、" : "") + s.other), s.skipped) {
      const q = String(s.skipped_by || ""), m = q === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : q === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${a} [${i}] ${h}${m}`);
    } else
      r.push(`- ${a} [${i}] ${h}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function bl(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      L("/question-modal/resolve") + "?" + n.toString(),
      { headers: B() }
    );
    if (!r.ok) return { kind: "error" };
    const a = await r.json();
    return a && ia(a.session_id, a.agent_id), a && a.found ? { kind: "found", data: a } : a && a.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Ft(t) {
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
async function yl(t) {
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
const Bn = "qm:v1:stash_att:", os = 25 * 1024 * 1024, zn = /* @__PURE__ */ new Map(), On = /* @__PURE__ */ new Map();
let jn = null, Dn = 0, Hr = null;
function is() {
  const t = Dn > 0;
  On.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function xl() {
  if (Hr) return Hr;
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
    const r = jn;
    jn = null, !(!r || !n.length) && await Bs(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Hr = t, t;
}
function kl(t, e, n) {
  if (!t) {
    j("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  jn = { callId: t, target: e, key: n };
  const r = xl();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (jn = null);
}
async function Bs(t, e, n, r) {
  Dn += 1, is();
  const a = [], s = [];
  try {
    for (const p of t) {
      if (p.size && p.size > os) {
        s.push(`${p.name}: 文件过大（上限 ${Math.round(os / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await yl(p);
      i.ok ? a.push(i.att) : s.push(i.error);
    }
  } finally {
    Dn -= 1, is();
  }
  const o = zn.get(e);
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
    else a.length && vl(e, a, p, r);
  }
}
function vl(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const a = localStorage.getItem(Bn + t), s = a ? JSON.parse(a) : [], o = (Array.isArray(s) ? s : []).concat(
        e.map((p) => ({ att: p, target: n, key: r }))
      );
      localStorage.setItem(Bn + t, JSON.stringify(o));
    } catch {
    }
}
function wl(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(Bn + t);
    if (!e) return [];
    localStorage.removeItem(Bn + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function ql(t) {
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
function Sl(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Ur(t, e) {
  const n = e || ae(t), r = Jt(t), a = r && r.request_id ? r.request_id : "";
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
async function ls(t) {
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
async function _l(t) {
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
    return p && ia(p.session_id, p.agent_id), p && p.found ? p : null;
  } catch {
    return null;
  }
}
const Jn = "qm:v1:reqid:", El = 3e4, Cl = 45e3, js = 6, Ds = 6e4, Fs = 15 * 6e4, Tl = 700, Nl = 8;
function Al(t) {
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
      localStorage.removeItem(Jn + t);
    } catch {
    }
}
function Il() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(Jn) === 0 && t.push(s);
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
function zl(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Jn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), Il();
    } catch {
    }
}
function Jt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Jn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (he(t), null) : n;
  } catch {
    return null;
  }
}
const da = "qm:v1:state:";
function Ht(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(da + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Fn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const Ws = Fn(), cs = "qm:v1:sessionprefs-ping";
function ot(t, e) {
  if (t)
    try {
      const r = { ...Ht(t) || {}, ...e, ts: Date.now(), origin: Ws };
      localStorage.setItem(da + t, JSON.stringify(r)), Ol();
    } catch {
    }
}
function Ol() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(da) === 0 && t.push(s);
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
async function $l(t) {
  try {
    const e = await fetch(
      L("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: B() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && ia(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Rl(t, e, n, r) {
  const a = ["【用户提交的问卷答案】"], s = new Set(Ue(t, e));
  return t.forEach((o, p) => {
    if (!s.has(p)) return;
    const i = e[`q${p}`];
    if (!i) return;
    let h = i.value;
    if (Array.isArray(h))
      h = h.filter((x) => x !== be).map((x) => {
        const y = (o.options || []).find((z) => Te(z) === String(x));
        return y ? Le(y) : x;
      }).join("、");
    else {
      const x = (o.options || []).find((y) => Te(y) === String(h));
      x && (h = Le(x)), String(i.value) === be && (h = "");
    }
    const b = oe(o) === "single" ? "单选" : oe(o) === "multi" ? "多选" : "问答", q = !!String(h || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), m = String(i.skipped_by || ""), k = i.skipped ? m === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : m === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : q ? h : "（未作答）";
    let g = `- q${p} [${b}] ${k}`;
    i.other && !i.skipped && (g += `（其他：${i.other}）`), i.attachments && i.attachments.length && (g += `（附件：${i.attachments.map((x) => x.file_name).join("、")}）`), a.push(g);
  }), n && a.push(`- 其他意见：${n}`), r && r.length && a.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), a.join(`
`);
}
function Ml(t) {
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
const Pl = ["必须", "务必", "不得为空", "不能为空"], Ll = ["可为空", "可留空", "选填", "可选", "非必填"];
function Hs(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Pl.some((n) => e.indexOf(n) !== -1) ? !1 : Ll.some((n) => e.indexOf(n) !== -1);
}
function Bl(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = Ue(t, n);
  } catch {
    return n;
  }
  return r.forEach((a) => {
    const s = t[a];
    if (!Hs(s)) return;
    const o = `q${a}`, p = n[o];
    if (p && (p.skipped === !0 || qt(p))) return;
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
function $n(t) {
  return t.map((e, n) => {
    const r = oe(e) === "single" ? "单选" : oe(e) === "multi" ? "多选" : "问答", a = (e.options || []).map(Le).join("、");
    return `${n + 1}. [${r}] ${Ln(e, n)}${a ? "（" + a + "）" : ""}`;
  }).join(`
`);
}
function Gr(t) {
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
    n.map((b, q) => e.createElement(
      "span",
      { key: "att" + q, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: b.file_name
      }, b.file_name + (b.size ? "（" + Sl(b.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || p(q);
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
function jl(t) {
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
  } = t, q = Xe().Popover, m = [];
  n.forEach((S) => {
    [...S.models || [], ...S.extra_models || []].forEach((T) => {
      m.push({
        providerId: S.id,
        providerName: S.name || S.id,
        modelId: T.id,
        modelName: T.name || T.id,
        free: !!T.is_free
      });
    });
  });
  const k = m.find((S) => `${S.providerId}:${S.modelId}` === r), x = k ? k.modelName : r || "选择模型", y = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", z = {
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
  }, N = m.filter((S) => S.free).length, _ = m.length - N, E = [];
  n.forEach((S) => {
    const T = [...S.models || [], ...S.extra_models || []].map((C) => ({
      providerId: S.id,
      providerName: S.name || S.id,
      modelId: C.id,
      modelName: C.name || C.id,
      free: !!C.is_free
    })).filter((C) => i === "free" ? C.free : !C.free);
    T.length && E.push({ id: S.id, name: S.name || S.id, models: T });
  });
  const w = (S, T) => e.createElement("button", {
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
    onClick: () => h(S)
  }, T), R = e.createElement(
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
      w("paid", "付费 🟡 " + _),
      w("free", "免费 🟢 " + N)
    ),
    E.length ? e.createElement("div", null, E.map((S, T) => (
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
        S.models.map((C) => {
          const W = `${C.providerId}:${C.modelId}` === r;
          return e.createElement(
            "div",
            {
              key: `${C.providerId}:${C.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (W ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: W ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                a(`${C.providerId}:${C.modelId}`), p(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: T % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, C.modelName)
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
  return q ? e.createElement(q, {
    content: R,
    trigger: "click",
    open: o,
    onOpenChange: p,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: z,
      disabled: s,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: y }
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
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const S = m.find((T) => `${T.providerId}:${T.modelId}` !== r);
        S && a(`${S.providerId}:${S.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: y }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, x),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function Dl(t) {
  const { R: e, mode: n, onChange: r, disabled: a, open: s, onOpenChange: o, popRef: p, panelRef: i } = t, h = {
    ai: "自动分析",
    recommend: "只用推荐",
    manual: "人工"
  }, b = {
    ai: "每题自动调用模型分析，并自动填入推荐、翻页、提交",
    recommend: "不发模型请求：直接采用出题时已标注的推荐",
    manual: "由你手动作答"
  }, q = {
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
  }, m = e.createElement(
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
  ), k = (y) => {
    const z = n === y;
    return e.createElement(
      "button",
      {
        key: y,
        type: "button",
        disabled: a,
        role: "menuitem",
        className: "qm-mode-opt",
        title: b[y],
        onClick: () => {
          r(y), o(!1);
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
          background: z ? "var(--app-accent-bg, rgba(255,127,22,0.08))" : "transparent",
          color: z ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: z ? 600 : 400
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
        e.createElement("span", null, h[y]),
        // US-010: 选中项右侧 accent 色 ✓ 勾，强化「当前选中」辨识度。
        z ? e.createElement("span", {
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
      }, b[y])
    );
  }, g = e.createElement(
    "div",
    {
      key: "qm-mode-trigger",
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
        style: q,
        title: "运行选择：" + h[n],
        onClick: () => o(!s)
      },
      m,
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis" }
      }, h[n]),
      e.createElement("span", {
        style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
      }, "▾")
    )
  ), x = s ? e.createElement(
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
    k("ai"),
    k("recommend"),
    k("manual")
  ) : null;
  return [g, x];
}
function Fl(t) {
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
function Wl(t) {
  const { R: e, open: n, templates: r, value: a, edit: s, onEditChange: o, onClose: p, onSelect: i, onSave: h, onDelete: b } = t;
  if (!n) return null;
  const q = Xe(), { Input: m, Modal: k } = q, g = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  k || (g.position = "fixed", g.right = 24, g.top = 80, g.width = 420, g.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", g.zIndex = 1100, g.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const x = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, y = !!s, z = (_, E, w, R) => m && m.TextArea ? e.createElement(m.TextArea, {
    value: _,
    rows: w,
    placeholder: R,
    onChange: (S) => E(S && S.target ? S.target.value : "")
  }) : e.createElement("textarea", {
    value: _,
    rows: w,
    placeholder: R,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (S) => E(S && S.target ? S.target.value : ""),
    onChange: (S) => E(S && S.target ? S.target.value : "")
  }), N = e.createElement(
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
        y ? s.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: x, onClick: p }, "关闭")
    ),
    y ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      z(s.name || "", (_) => o({ ...s, name: _ }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      z(s.system || "", (_) => o({ ...s, system: _ }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      z(s.user || "", (_) => o({ ...s, user: _ }), 6, "用户提示词模板"),
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
          onClick: () => h(s)
        }, "保存"),
        e.createElement("button", {
          type: "button",
          style: x,
          onClick: () => o(null)
        }, "取消")
      )
    ) : e.createElement(
      "div",
      null,
      (r || []).map(
        (_) => e.createElement(
          "div",
          {
            key: _.id,
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
            _.name + (_.builtin ? "（内置）" : "") + (_.id === a ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: x,
            title: "设为本题使用",
            onClick: () => i(_.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => o({
              id: _.id,
              name: _.name,
              system: _.system,
              user: _.user
            })
          }, "编辑"),
          _.builtin ? null : e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => b(_.id)
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
  }, N) : N;
}
function Hl(t) {
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
    children: q,
    open: m,
    onOpenChange: k,
    popRef: g,
    panelRef: x
  } = t, z = Xe().Popover, N = e.createElement("button", {
    type: "button",
    disabled: b,
    key: "qm-analysis-trigger",
    ref: g,
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
      k(!m);
    }
  }, n ? "分析中…" : "查看分析");
  if (!z)
    return e.createElement(
      "div",
      null,
      N,
      r && m ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((C) => C.reasoning).join(`

`))) : null
    );
  const _ = !!(r && (r.per_question || []).length), E = (C, W, V) => e.createElement("button", {
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
    onClick: W
  }, C), w = e.createElement(
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
        _ && !n ? e.createElement("button", {
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
        _ && !n ? e.createElement("button", {
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
            p(), k(!1);
          }
        }, "套用推荐") : null
      ),
      (r.per_question || []).map((C) => e.createElement(
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
          dangerouslySetInnerHTML: { __html: ll(C.reasoning || "") }
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
      E("开始分析", () => {
        try {
          o();
        } catch {
        }
      })
    )
  ), R = e.createElement("div", {
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
  }, q), S = e.createElement(
    "div",
    {
      key: "qm-analysis-panel",
      ref: x,
      role: "dialog",
      "aria-label": "题目分析",
      className: "qm-hdr-pop qm-analysis-panel",
      style: {
        position: "absolute",
        top: 30,
        right: 0,
        zIndex: 1e4,
        // 宽度：最大 90% 视口；桌面端仍以 460 为内容舒适宽。
        width: "min(460px, 90vw)",
        // 高度：自适应且不得溢出视口。气泡 top:30 是相对 qm-actions 定位的，
        // 而手机上 qm-actions 换行后自身已偏离视口顶（实测气泡起点 71px），
        // 所以余量不能按「视口顶 + 30」这种假设来算——直接给足安全边界：
        // 100vh 减 100px（覆盖 30px 偏移 + 手机上最多约 60px 的换行偏移 + 余量）。
        maxHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        background: "var(--app-surface-raised, #fff)",
        border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
      },
      onMouseDown: (C) => {
        C && C.stopPropagation && C.stopPropagation();
      },
      onClick: (C) => {
        C && C.stopPropagation && C.stopPropagation();
      },
      onKeyDown: (C) => {
        C && C.stopPropagation && C.stopPropagation();
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
    w,
    R
  );
  return [N, m ? S : null];
}
function Ul(t) {
  const e = Ne().React, n = Xe(), { Input: r, Button: a } = n, s = r.TextArea, o = t.data || {}, p = ul(o), i = fl(o), h = ml(o), b = gl(h), q = b ? "" : h, m = p.questions || [], k = p.title || "问卷", g = Ht(i), [x, y] = e.useState(
    () => !!(g && g.answered) || !!q || b
  ), [z, N] = e.useState(""), [_, E] = e.useState(() => {
    const l = Jt(i);
    return l && l.request_id ? l.request_id : g && typeof g.reqId == "string" ? g.reqId : "";
  }), [w, R] = e.useState(
    () => g && typeof g.visStep == "number" && g.visStep >= 0 ? g.visStep : 0
  ), [S, T] = e.useState(
    () => g && typeof g.slowAt == "number" ? g.slowAt : 0
  ), [C, W] = e.useState(
    () => g && typeof g.slowStep == "number" ? g.slowStep : -1
  ), [V, U] = e.useState(
    () => !!(g && g.slowFired === !0)
  ), [M, Z] = e.useState(() => {
    const l = {};
    m.forEach((f, u) => {
      l[`q${u}`] = { type: oe(f), value: oe(f) === "multi" ? [] : "", other: "" };
    });
    const d = g && g.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((f) => {
      l[f] && (l[f] = { ...l[f], ...d[f] });
    }), l;
  }), [Ge, Vt] = e.useState(
    () => g && typeof g.finalOther == "string" ? g.finalOther : ""
  ), [D, Ae] = e.useState(!1), [O, qe] = e.useState(
    () => g && typeof g.releasedNote == "string" ? g.releasedNote : ""
  ), [ie, K] = e.useState(
    () => g && typeof g.localResult == "string" ? g.localResult : ""
  ), [Q, ye] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(g && g.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(q || "")
  ), [X, ze] = e.useState(
    () => (g && typeof g.skipReason == "string" ? g.skipReason : "") || hl(q || "")
  ), [le, xe] = e.useState(
    () => g && Array.isArray(g.finalOtherAtt) ? g.finalOtherAtt : []
  ), [ue, Be] = e.useState(
    () => !!(g && g.expanded)
  ), [Je, pt] = e.useState(!1), St = e.useRef(0), [Se, Qs] = e.useState(
    () => g && typeof g.deadReason == "string" ? g.deadReason : ""
  ), [Ve, _t] = e.useState(
    () => g && typeof g.gateBlocked == "string" ? g.gateBlocked : ""
  ), [ut, Zn] = e.useState(
    () => g && typeof g.submittedAt == "number" ? g.submittedAt : 0
  ), [Kn, Qn] = e.useState(
    () => !!(g && g.pastSoft === !0)
  ), [Et, Yt] = e.useState(
    () => !!(g && g.waitRetired === !0)
  ), Ct = e.useRef(
    !!(g && typeof g.submittedAt == "number" && g.submittedAt > 0 && Date.now() - g.submittedAt < jr * 1e3)
  ), Ye = e.useRef(!1), en = e.useRef(!!(g && g.pastSoft === !0)), [Xn, Xs] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), Vs = e.useRef(Xn), fa = (l) => {
    Vs.current = l, Xs(l);
  }, fe = (l, d) => {
    const f = Xn[l];
    return f ?? d;
  };
  Ms = !!fe("fallback_title", !0);
  const ma = Math.max(30, Number(fe("wait_hint_sec", jr)) || jr), Ys = "manual", [ee, tn] = e.useState(Ys), [ga, Vn] = e.useState(""), [uc, eo] = e.useState(!1), [Yn, er] = e.useState(!1), [tr, nr] = e.useState(!1), [to, no] = e.useState([]), [ha, rr] = e.useState(!1), [nn, ft] = e.useState(null), [ro, et] = e.useState(""), [Tt, ar] = e.useState(!1), sr = e.useRef(null), or = e.useRef(null), ba = e.useRef(0);
  e.useEffect(() => {
    Tt && (ba.current = Date.now());
  }, [Tt]), e.useEffect(() => {
    if (!Tt) return;
    const l = (f) => {
      if (Date.now() - ba.current < 350) return;
      const u = f && f.target;
      sr.current && u && sr.current.contains(u) || or.current && u && or.current.contains(u) || ar(!1);
    }, d = (f) => {
      f && f.key === "Escape" && ar(!1);
    };
    return document.addEventListener("mousedown", l), document.addEventListener("keydown", d), () => {
      document.removeEventListener("mousedown", l), document.removeEventListener("keydown", d);
    };
  }, [Tt]);
  const [rn, Oe] = e.useState(!1), [an, mt] = e.useState(!1), gt = e.useRef(null), ir = e.useRef(null), lr = e.useRef(null);
  e.useEffect(() => {
    if (!rn && !an) return;
    const l = (d) => {
      const f = d && d.target;
      gt.current && f && gt.current.contains(f) || ir.current && f && ir.current.contains(f) || (Oe(!1), mt(!1));
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [rn, an]);
  const [cr, ht] = e.useState(!1), dr = e.useRef(null), pr = e.useRef(null);
  e.useEffect(() => {
    if (!cr) return;
    const l = (d) => {
      const f = d && d.target;
      dr.current && f && dr.current.contains(f) || pr.current && f && pr.current.contains(f) || ht(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [cr]);
  const [ao, so] = e.useState(!1), [oo, io] = e.useState("paid"), Ze = e.useRef({}), je = e.useRef({}), bt = e.useRef(0), Nt = e.useRef(null), [lo, yt] = e.useState(0), [ur, fr] = e.useState([]), [Ke, sn] = e.useState(""), De = e.useRef(Ke);
  De.current = Ke;
  const [mr, Qe] = e.useState(!1), [co, ya] = e.useState(!1), [po, gr] = e.useState(null);
  e.useEffect(() => {
    if (!mr) return;
    const l = (d) => {
      const f = d && d.target;
      gt.current && f && gt.current.contains(f) || lr.current && f && lr.current.contains(f) || Qe(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [mr]);
  const [hr, Fe] = e.useState(!1);
  e.useEffect(() => {
    if (!hr) return;
    const l = (d) => {
      const f = gt.current;
      f && d && d.target && f.contains(d.target) || Fe(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [hr]);
  const [br, We] = e.useState(!1), on = e.useRef(null), xa = e.useRef(null);
  e.useEffect(() => {
    if (!br) return;
    const l = (d) => {
      const f = xa.current;
      if (f && d && d.target && f.contains(d.target)) return;
      const u = d && d.target;
      u && u.closest && u.closest("[data-qm-release-lock]") || We(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [br]);
  const [$e, ka] = e.useState(
    () => !!(g && g.autoPaused)
  ), uo = e.useRef($e);
  uo.current = $e;
  const xt = e.useRef(!1), yr = e.useRef(0), ln = e.useRef({}), [fo, mo] = e.useState(0), At = e.useRef(/* @__PURE__ */ new Set()), It = (l) => {
    l && At.current.add(l);
  }, cn = e.useRef({}), [go, dn] = e.useState(0), tt = e.useRef({}), [zt, ho] = e.useState(!1), bo = e.useRef(!1);
  bo.current = zt, e.useRef(!1);
  const yo = async () => {
    try {
      const l = await Zt(
        "",
        !0,
        ae(i),
        Bt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      fa(d), d.mode !== void 0 && tn(jt(d.mode)), typeof d.model_id == "string" && d.model_id && Vn(d.model_id), typeof d.with_context == "boolean" && er(d.with_context), typeof d.parallel == "boolean" && nr(d.parallel), yt((f) => f + 1);
    } catch {
    }
  }, va = e.useRef(!1), pn = (l) => {
    if (l.mode !== void 0) {
      tn(l.mode), Dr(
        { mode: l.mode },
        ae(i),
        Bt()
      );
      try {
        localStorage.setItem(cs, Ws + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && Vn(l.modelId), l.withContext !== void 0 && er(l.withContext), l.parallel !== void 0 && nr(l.parallel), Dr(d, ae(i), Bt()));
  }, wa = (l) => {
    !l || l === Ke || (sn(l), De.current = l, ot(i, { templateId: l }), Dr(
      { template_id: l },
      ae(i),
      Bt()
    ), ft(null), Ze.current = {}, je.current = {}, yt((d) => d + 1));
  }, xo = async (l) => {
    const d = await Os({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      j("error", d.error || "保存失败");
      return;
    }
    fr(d.items || []), gr(null), j("success", "模板已保存");
  }, ko = async (l) => {
    const d = await $s(l);
    if (!d.ok) {
      j("warning", d.error || "删除失败");
      return;
    }
    fr(d.items || []);
    const f = (d.items || []).map((u) => u.id);
    if (f.indexOf(De.current) === -1) {
      const u = f[0] || "";
      sn(u), De.current = u, ot(i, { templateId: u });
    }
    j("success", "模板已删除");
  };
  e.useEffect(() => {
    if (x) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === cs && yo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [x, i]), e.useEffect(() => {
    if (x) return;
    let l = !0;
    return Yi(), (async () => {
      const [d, f, u, v] = await Promise.all([
        Rs(),
        el(),
        la(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Zt(
          "",
          !0,
          ae(i),
          Bt()
        )
      ]);
      if (!l) return;
      if (no(d), fr(u.items), v && v.config) {
        const A = v.config;
        fa(A), A.mode !== void 0 && tn(jt(A.mode)), typeof A.model_id == "string" && A.model_id && Vn(A.model_id), typeof A.with_context == "boolean" && er(A.with_context), typeof A.parallel == "boolean" && nr(A.parallel), typeof A.template_id == "string" && A.template_id && (sn(A.template_id), De.current = A.template_id);
      }
      const I = u.items.map((A) => A.id);
      if (!De.current || I.indexOf(De.current) === -1) {
        const A = u.defaultId || I[0] || "";
        A && (sn(A), De.current = A);
      }
      if (v && v.config) {
        const A = v.config;
        eo(A.__follow_active__ === !0);
      }
      va.current = !0, yt((A) => A + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    bt.current = w;
  }, [w]);
  const xr = async (l) => {
    if (ha) return;
    const d = w;
    rr(!0), et("");
    const f = typeof AbortController < "u" ? new AbortController() : null;
    Nt.current = f;
    try {
      const u = await fetch(L("/question-modal/analyze"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          request_id: _,
          tool_call_id: i,
          session_id: ae(i),
          title: k,
          questions: m,
          model_id: ga,
          mode: l,
          with_context: Yn,
          parallel: tr,
          question_index: d,
          answers: M,
          template_id: De.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(fe("model_timeout_sec", 120)) || 120
        }),
        signal: f ? f.signal : void 0
      }), v = await u.json().catch(() => ({})), I = v && v.analysis || null, A = I && I.error || v && v.error || "";
      v && v.cancelled || I && I.cancelled ? et("已终止分析。") : !u.ok || !v || v.ok === !1 || I && I.ok === !1 ? et(A || "分析失败（服务返回 " + u.status + "）") : I && (Ze.current[d] = I, je.current[d] = !0, bt.current === d && ft(I), j("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      Nt.current === f && f && f.signal.aborted || u && u.name === "AbortError" ? et("已终止分析。") : et("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      Nt.current === f && (Nt.current = null), rr(!1), tt.current[d] = !0, dn((u) => u + 1);
    }
  }, vo = () => {
    const l = w;
    delete Ze.current[l], ft(null), et(""), xr("manual");
  }, kt = (l) => {
    var f;
    const d = l !== void 0 ? l : bt.current;
    try {
      fetch(L("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: B(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: _,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      En(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (f = Nt.current) == null || f.abort();
    } catch {
    }
    rr(!1);
  }, wo = () => {
    kt(), et("已终止分析。");
  }, qo = () => {
    $e ? (cn.current = {}, tt.current = {}, je.current = {}, xt.current = !1, ka(!1), yt((l) => l + 1), j("info", "已恢复自动答题")) : (kt(), ka(!0), j("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (x) return;
    const l = Ze.current[w];
    ft(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + w;
    let f = !0;
    return fetch(L("/question-modal/analysis") + d, { headers: B() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !f || !u || !u.found || !u.analysis || (Ze.current[w] = u.analysis, bt.current === w && ft(u.analysis));
    }).catch(() => {
    }), () => {
      f = !1;
    };
  }, [i, w]), e.useEffect(() => {
    x || va.current && ee === "ai" && zt && (!Cn(p) || !m.length || je.current[w] || D || (je.current[w] = !0, xr("auto")));
  }, [
    x,
    ee,
    i,
    lo,
    Yn,
    tr,
    m,
    w,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    zt
  ]);
  const So = () => {
    const l = nn && nn.per_question || [];
    if (!l.length) return;
    if (!l.some((f) => f.type === "multi" ? String(f.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(f.choice || "").trim().length > 0)) {
      j("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Z((f) => {
      const u = { ...f };
      return l.forEach((v) => {
        const I = `q${v.index}`;
        It(I);
        const A = u[I] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const ne = String(v.choice || "").split(/[、,，]/).map((Y) => Y.trim()).filter(Boolean);
          u[I] = { ...A, value: ne };
        } else
          u[I] = { ...A, value: v.choice || A.value };
      }), u;
    }), j("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, nt = (l, d, f = !1) => {
    kt(), Qs(l), ye(!0), K(d), pt(!1), y(!0), he(i), f && ot(i, { backendReleased: !0 });
  }, _o = async (l, d) => {
    const f = await Ur(i, ae(i));
    return f.ok ? (nt(l, d, f.released), !0) : (pt(!0), vr(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = Ht(i)) == null ? void 0 : d.answers;
    ot(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: _,
      visStep: w,
      answers: Wr(M, l, At.current),
      finalOther: Ge,
      finalOtherAtt: le,
      answered: x,
      skippedAll: Q,
      expanded: ue,
      localResult: ie,
      submittedAt: ut,
      skipReason: X,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Kn,
      waitRetired: Et,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: S,
      slowStep: C,
      slowFired: V,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: Se,
      gateBlocked: Ve,
      releasedNote: O,
      autoPaused: $e,
      templateId: Ke
    });
  }, [
    i,
    _,
    w,
    M,
    Ge,
    le,
    x,
    Q,
    ue,
    ie,
    ut,
    X,
    Kn,
    Et,
    S,
    C,
    V,
    Se,
    $e,
    Ke,
    Ve,
    O
  ]), e.useEffect(() => {
    if (!x || !ut || Et || !Ct.current) return;
    let l = 0, d = !1, f = ns(i);
    const u = () => {
      if (d) return;
      const v = Math.floor((Date.now() - ut) / 1e3);
      if (v >= ma) {
        Ye.current = !0, Yt(!0);
        return;
      }
      if (!Ye.current) {
        const I = ns(i);
        I >= 0 && (f < 0 ? f = I : I - f >= Hi && (Ye.current = !0));
      }
      if (!Ye.current && v >= Fi && !en.current && (en.current = !0, Qn(!0)), Ye.current) {
        l = setTimeout(
          () => {
            d || Yt(!0);
          },
          Math.max(1e3, (ma - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || rs(u);
      }, As);
    };
    return rs(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [x, ut, Et]);
  const [kr, vr] = e.useState(!1), [wr, qa] = e.useState(""), Sa = (l, d, f) => {
    l.length && (d === "final" ? xe((u) => u.concat(l)) : Z((u) => {
      const v = f || `q${w}`;
      It(v);
      const I = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...I, attachments: (I.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, I, A) => {
      Sa(u, v, I), A && A.length ? qa(A.join("；")) : qa("");
    }, d = (u) => vr(u);
    zn.set(i, l), On.set(i, d);
    const f = wl(i);
    return f.length && f.forEach((u) => Sa([u.att], u.target, u.key)), vr(Dn > 0), () => {
      zn.get(i) === l && zn.delete(i), On.get(i) === d && On.delete(i);
    };
  }, [i, w]);
  const qr = (l, d) => kl(i, l, d), Sr = (l, d, f) => {
    const u = ql(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Bs(u, i, d, f);
    }
  };
  e.useEffect(() => {
    if (!b || z) return;
    let l = !0;
    return Ft(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ye(!0);
      const f = String(d.skip_reason || "").trim();
      f && ze((u) => u || f), N(Dt(m, d));
    }), () => {
      l = !1;
    };
  }, [b, i, z]), e.useEffect(() => {
    if (x || !i || q) return;
    let l = !0;
    return Ft(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && ye(!0);
      const f = String(d.skip_reason || "").trim();
      f && ze((u) => u || f), N((u) => u || Dt(m, d)), K(Dt(m, d)), y(!0), he(i);
    }), () => {
      l = !1;
    };
  }, [i, x, q]), e.useEffect(() => {
    if (x) return;
    let l = !0, d = 0, f = 0, u = 0, v = !1, I = !1, A = 0, ne = 0;
    St.current || (St.current = Date.now());
    let Y = !!Jt(i), Ee = !1;
    const ke = (P) => {
      !l || !P || !P.request_id || (Y = !0, f = 0, u = 0, v = !1, E(P.request_id), pt(!1), A && (clearTimeout(A), A = 0), zl(
        i,
        P.request_id,
        P.session_id || Xt(),
        P.agent_id
      ));
    }, ce = (P) => {
      l && (A && (clearTimeout(A), A = 0), ne && (clearTimeout(ne), ne = 0), _o(
        P,
        P === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Mt = Jt(i), st = async () => {
      if (!Mt) return !1;
      const P = await $l(Mt.request_id);
      if (!l) return !0;
      if (P.kind === "found") {
        const me = P.data;
        return me.tool_call_id && i && me.tool_call_id !== i ? (he(i), !1) : (ke(me), !0);
      }
      return P.kind === "orphan" ? (ce("orphan"), !0) : (P.kind === "absent" && he(i), !1);
    }, Ce = (P = !1) => {
      if (l) {
        if (d += 1, P || (f += 1, u || (u = Date.now())), P) {
          if (!Ee) {
            Ee = !0, Ft(i).then((de) => {
              if (l) {
                if (de) {
                  de.kind === "skipped" && !de.answers && ye(!0);
                  const Pt = String(de.skip_reason || "").trim();
                  Pt && ze((Mr) => Mr || Pt), N(Dt(m, de)), K(Dt(m, de)), y(!0), he(i);
                  return;
                }
                Ce(!0);
              }
            });
            return;
          }
          if (Y) {
            ce("gone");
            return;
          }
          const me = Date.now() - (St.current || Date.now());
          if (d >= 12 && me >= Cl) {
            ce("gone");
            return;
          }
        }
        if (f >= js) {
          if (Date.now() - (u || Date.now()) >= Fs) {
            if (v = !0, !I) {
              I = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, f = 0, u = 0, d = 0, re();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          A = setTimeout(re, Ds);
          return;
        }
        A = setTimeout(re, d < Nl ? Tl : 5e3);
      }
    }, Ie = () => {
      bl(i, ae(i)).then((P) => {
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
          _l(ae(i)).then((me) => {
            if (l) {
              if (me) {
                if (me.tool_call_id && i && me.tool_call_id !== i) {
                  Ft(i).then((de) => {
                    if (l) {
                      if (de) {
                        y(!0), he(i);
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
              Ft(i).then((de) => {
                if (l) {
                  if (de) {
                    de.kind === "skipped" && !de.answers && ye(!0);
                    const Pt = String(de.skip_reason || "").trim();
                    Pt && ze((Mr) => Mr || Pt), y(!0), he(i);
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
        if (!Mt) {
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
    }, El), re(), () => {
      l = !1, A && clearTimeout(A), ne && clearTimeout(ne);
    };
  }, [x, i]);
  const _a = async () => {
    Ae(!0);
    try {
      const l = ae(i);
      let d = await Ur(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ls(l);
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
  }, Ea = async () => {
    Ae(!0);
    try {
      const l = ae(i);
      let d = await Ur(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ls(l);
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
  }, Eo = e.createElement(
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
  ), un = (l, d) => e.createElement("button", {
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
      on.current = l, Oe(!1), mt(!1), ht(!1), Qe(!1), Fe(!1), We(!0);
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
  }, Eo), Co = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认释放阻塞",
      ref: xa,
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
          We(!1), on.current = null;
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
          const l = on.current;
          We(!1), on.current = null, l && l();
        }
      }, "确定")
    )
  ), fn = br ? Co : null, mn = Ue(m, M), rt = mn.length, Re = w >= rt, te = Re ? -1 : mn[w], Ot = Re ? rt : w;
  e.useEffect(() => {
    if (jt(fe("mode", "manual")) !== "manual") return;
    let d = String(fe("notify_channel_pc", "") || "");
    if (!d) {
      const u = String(fe("notify_channel", "off") || "off"), v = !!fe("notify_manual_mode", !1);
      d = u === "browser" || (u === "off" || !u) && v ? "browser" : u;
    }
    if (d !== "browser" || x || Q || Se || !Cn(p) || !m.length) return;
    const f = Ue(m, M).filter((u) => !qt(M[`q${u}`])).length;
    Di(i, k, f);
  }, [Xn, x, Q, Se, Ot]);
  const gn = Math.max(0, Number(fe("slow_question_sec", Wi)) || 0) * 1e3, To = Math.round(gn / 1e3);
  e.useEffect(() => {
    if (x || Q || Se || gn <= 0) return;
    if (C !== Ot) {
      W(Ot), T(Date.now()), U(!1);
      return;
    }
    if (!S) {
      T(Date.now());
      return;
    }
    if (V) return;
    const l = S + gn - Date.now();
    if (l <= 0) {
      U(!0);
      return;
    }
    let d = !1;
    const f = setTimeout(() => {
      d || U(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(f);
    };
  }, [x, Q, Se, Ot, C, S, V, gn]);
  const _e = te >= 0 ? m[te] : null, vt = `q${te}`, J = te >= 0 && M[vt] || { type: oe(_e), value: oe(_e) === "multi" ? [] : "", other: "" }, wt = (l) => {
    var u;
    Ve && _t(""), te >= 0 && It(`q${te}`);
    const d = { ...M, [vt]: { ...l, skipped: !1 } }, f = Ue(m, d);
    m.forEach((v, I) => {
      f.indexOf(I) === -1 && delete d[`q${I}`];
    }), ot(i, {
      answers: Wr(d, (u = Ht(i)) == null ? void 0 : u.answers, At.current)
    }), Z(d);
  };
  e.useEffect(() => {
    w > rt && R(rt);
  }, [rt, w]);
  const _r = async (l, d) => {
    const f = await fetch(L(l), {
      method: "POST",
      headers: B(),
      body: JSON.stringify(d)
    }), u = await f.json().catch(() => ({}));
    if (!f.ok) {
      const v = new Error(u && u.detail || "HTTP " + f.status);
      throw v.status = f.status, v;
    }
    return u;
  }, Er = () => {
    var l;
    return Ml(Wr(
      Bl(m, M),
      (l = Ht(i)) == null ? void 0 : l.answers,
      At.current
    ));
  }, No = () => !!fe("gate_unsaved", !0), Ao = (l) => Hs(l), Ca = (l, d) => {
    if (!No()) return [];
    const f = new Set(Ue(m, l)), u = (I) => f.has(I) && !qt(l[`q${I}`]) && !Ao(m[I]), v = [];
    return typeof d == "number" ? (u(d) && v.push(d + 1), v) : (m.forEach((I, A) => {
      u(A) && v.push(A + 1);
    }), v);
  }, Ta = (l, d, f) => {
    const u = "第 " + l.join("、") + " 题", v = f === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    _t("⛔ " + u + "尚未选择。" + v);
    const I = Ue(m, d).length;
    _r("/question-modal/gate-block", {
      request_id: _,
      tool_call_id: i,
      session_id: ae(i),
      missing: l,
      answered: I - l.length,
      total: I,
      bundle: Ya
    }).catch(() => {
    });
  }, Cr = async (l, d = !1) => {
    if (!_)
      return j("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const f = Er();
    if (!d) {
      const u = Ca(f);
      if (u.length)
        return Ta(u, f, "提交"), "blocked";
      _t("");
    }
    Ae(!0);
    try {
      const u = await _r("/question-modal/answer", {
        request_id: _,
        session_id: ae(i),
        answers: f,
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
      ), j("info", "本次问卷已失效，已关闭"), "sent") : (he(i), K(Rl(m, f, Ge, le)), Zn(Date.now()), Qn(!1), Yt(!1), Ye.current = !1, en.current = !1, Ct.current = !0, y(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (nt(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "blocked") : (j("error", "提交失败: " + u.message), d ? (xt.current = !1, yr.current += 1, yr.current >= Pr && j(
        "warning",
        "自动提交连续失败 " + Pr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), dn((v) => v + 1), "not-ready") : "blocked");
    } finally {
      Ae(!1);
    }
  }, Io = () => {
    te < 0 || (Ve && _t(""), kt(bt.current), je.current[bt.current] = !0, It(`q${te}`), Z((l) => {
      const d = { ...l };
      d[`q${te}`] = {
        type: (l[`q${te}`] || {}).type || oe(_e),
        value: ((l[`q${te}`] || {}).type || oe(_e)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const f = Ue(m, d);
      return m.forEach((u, v) => {
        f.indexOf(v) === -1 && delete d[`q${v}`];
      }), d;
    }), R((l) => l + 1));
  }, zo = () => {
    if (Re) {
      Cr();
      return;
    }
    const l = Er(), d = Ca(l, te);
    if (d.length) {
      Ta(d, l, "下一步");
      return;
    }
    Ve && _t(""), R((f) => f + 1);
  }, Oo = async () => {
    if (!_) {
      j("warning", "问卷尚未就绪，请稍候");
      return;
    }
    kt(), Ae(!0);
    try {
      const l = await _r("/question-modal/skip", {
        request_id: _,
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
      j("info", "已跳过问卷"), he(i), ye(!0), ze("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), K("用户跳过了本次问卷。"), Zn(Date.now()), Qn(!1), Yt(!1), Ye.current = !1, en.current = !1, Ct.current = !0, y(!0);
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
    if (x || ee !== "ai" && ee !== "recommend" || $e || (ee === "recommend" || ee === "ai") && !zt || !Cn(p) || !m.length || D) return;
    if (Re) {
      if (xt.current || yr.current >= Pr) return;
      const Y = Er();
      if (!mn.every(
        (ke, ce) => !!tt.current[ce] || qt(Y[`q${ke}`])
      ) || !_) return;
      xt.current = !0, Cr(void 0, !0).then((ke) => {
        ke === "not-ready" && (xt.current = !1);
      });
      return;
    }
    const l = w;
    if (cn.current[l] || ee === "ai" && !tt.current[l]) return;
    const d = mn[l], f = m[d], u = oe(f), v = as(f), I = ss(Ze.current[l], d);
    if (ee === "ai" && !tt.current[l]) return;
    cn.current[l] = !0;
    const A = v.length ? v.join("、") : I, ne = !!A;
    It(`q${d}`), ne || (ln.current[d] = !0, mo((Y) => Y + 1), j("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), Z((Y) => {
      const Ee = { ...Y }, ke = `q${d}`, ce = Ee[ke] || { type: u, value: u === "multi" ? [] : "", other: "" };
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
        const st = f.options || [], Ce = (re) => String(re).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = A.split(/[、,，]/).map((re) => Ce(re)).filter(Boolean).map((re) => {
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
        const st = f.options || [], Ce = (P) => String(P).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Ie = st.find((P) => Te(P) === A || Le(P) === A) || st.find((P) => Te(P) === Ce(A) || Le(P) === Ce(A)), re = Ie ? Te(Ie) : A;
        Ee[ke] = {
          ...ce,
          type: u,
          value: re,
          other: String(re) === be ? ce.other : "",
          attachments: String(re) === be ? ce.attachments : []
        };
      } else
        Ee[ke] = { ...ce, type: u, value: A };
      const Mt = Ue(m, Ee);
      return m.forEach((st, Ce) => {
        Mt.indexOf(Ce) === -1 && delete Ee[`q${Ce}`];
      }), Ee;
    }), je.current[l] = !0, tt.current[l] = !0, R((Y) => Y + 1), dn((Y) => Y + 1);
  }, [
    x,
    ee,
    $e,
    D,
    i,
    w,
    go,
    rt,
    p,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    _,
    zt
  ]);
  const $t = e.useRef(!1), at = e.useRef(0), Rt = e.useRef(!1), He = e.useRef({});
  e.useEffect(() => {
    if (x || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        $t.current = !0, Rt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!m || m.length), u.answers && typeof u.answers == "object" && (Z((I) => {
            const A = { ...I };
            return Object.keys(u.answers).forEach((ne) => {
              const Y = u.answers[ne];
              !Y || typeof Y != "object" || At.current.has(ne) || (A[ne] = {
                ...A[ne] || { type: "single", value: "", other: "" },
                ...Y
              });
            }), A;
          }), ot(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && R(u.cursor), typeof u.mode == "string" && u.mode) {
            const I = jt(u.mode);
            tn((A) => A === I ? A : I);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((I) => {
            const A = parseInt(I, 10);
            !isNaN(A) && u.per_question[I] && (Ze.current[A] = u.per_question[I]);
          }), u.status === "submitted" && (Zn((I) => I || Date.now()), u.released && ot(i, { backendReleased: !0 }), y(!0), he(i));
          const v = String(u.skip_reason || "").trim();
          v && ze((I) => I || v), typeof u.mode == "string" && u.mode && (He.current.mode = jt(u.mode)), Object.keys(u.answers || {}).forEach((I) => {
            He.current["a:" + I] = JSON.stringify(u.answers[I] || {});
          }), typeof u.cursor == "number" && (He.current.cursor = "c:" + u.cursor), Rt.current = !0, dn((I) => I + 1);
        } finally {
          setTimeout(() => {
            $t.current = !1;
          }, 0);
        }
      }
    };
    tl(i).then((u) => {
      !l || !u || !u.found || !u.state || (at.current = Math.max(at.current, u.rev), d(u.state));
    });
    const f = nl(i, {
      onSnapshot: (u, v) => {
        at.current = Math.max(at.current, u), v && d(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= at.current && u.origin !== Fn() || (at.current = Math.max(at.current, v), !(u.origin && u.origin === Fn()) && d(u.state));
      },
      onStatus: (u) => {
        l && ho((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, f();
    };
  }, [x, i]), e.useEffect(() => {
    x || !i || $t.current || Rt.current && Object.keys(M || {}).forEach((l) => {
      const d = JSON.stringify(M[l] || {});
      He.current["a:" + l] !== d && (He.current["a:" + l] = d, En(
        i,
        "set_answer",
        { key: l, answer: M[l] }
      ));
    });
  }, [x, i, JSON.stringify(M)]), e.useEffect(() => {
    if (x || !i || $t.current || !Rt.current) return;
    const l = "c:" + w;
    He.current.cursor !== l && (He.current.cursor = l, En(i, "goto", { cursor: w }));
  }, [x, i, w]), e.useEffect(() => {
    x || !i || $t.current || Rt.current && He.current.mode !== ee && (He.current.mode = ee, En(i, "set_mode", { mode: ee }));
  }, [x, i, ee]);
  const hn = {
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
  }, Tr = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Nr = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, bn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Ar = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Na = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Ir = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, $o = { display: "flex", flexDirection: "column", gap: 8 }, zr = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, yn = {
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
  }, Aa = {
    ...yn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, Ro = {
    ...yn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Or = {
    ...yn,
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
  }, Ia = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Or,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, za = {
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
  }, Mo = { height: 32, fontSize: 13, borderRadius: 8 }, Oa = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, $a = (l) => {
    const d = Te(l);
    return J.type === "multi" ? Array.isArray(J.value) && J.value.indexOf(d) !== -1 : J.value === d;
  }, Ra = $a(be), Ma = (l) => {
    if (x || D) return;
    const d = Te(l);
    if (J.type === "multi") {
      const f = Array.isArray(J.value) ? J.value.slice() : [], u = f.indexOf(d);
      u === -1 ? f.push(d) : f.splice(u, 1);
      const v = f.length === 1 && f[0] === be;
      wt({
        ...J,
        value: f,
        other: v ? J.other : "",
        attachments: v ? J.attachments : []
      });
    } else {
      const f = d === be;
      wt({
        ...J,
        value: d,
        other: f ? J.other : "",
        attachments: f ? J.attachments : []
      });
    }
  }, Po = !!fe("show_recommend_badge", !0), Pa = fe("badge_position", "left") === "right", Lo = fe("badge_style", "rect") === "round", La = (l) => l && Po ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Lo ? { ...za, borderRadius: 999 } : za
  }, "AI 推荐") : null, Bo = !!fe("auto_number_options", !0), jo = !!fe("highlight_recommended", !1), Do = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Ba = (l, d, f, u, v, I) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: x || D,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && jo ? { ...d ? Ia : Or, ...Do } : d ? Ia : Or,
      onClick: f
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    Pa ? null : La(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (I && Bo ? I + ". " : "") + l),
    Pa ? La(v) : null
  );
  if (!x && !Cn(p))
    return e.createElement(
      "div",
      { style: hn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Tr, className: "qm-header" },
        e.createElement(
          "div",
          { style: Nr },
          Lr(e),
          e.createElement("span", { style: bn, className: "qm-title" }, k)
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
          Je ? un(_a, "qm-release-lock-prep") : null,
          e.createElement("span", { style: Ar }, "准备中")
        )
      ),
      e.createElement("div", {
        style: { ...Na, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // US-010: 🔒 二次确认气泡挂卡片根。
      fn
    );
  if (x) {
    const l = () => {
      const f = Zi({
        submittedAt: ut,
        deadReason: Se,
        releasedNote: O,
        skippedAll: Q,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: Et,
        pastSoft: Kn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!Ct.current
      });
      return f ? e.createElement("span", {
        className: "qm-wait-hint",
        // data-qm-wait / data-qm-phase 保留为**取证锚点**：用户报障时可直接查
        // 这一行是否由 React 渲染、当前处于哪个阶段，不用再猜"跑的是不是旧包"。
        "data-qm-wait": i,
        "data-qm-phase": f.phase,
        style: {
          fontSize: 12,
          lineHeight: 1.5,
          color: f.phase === "stalled" ? "var(--app-warning-text, #d46b08)" : "var(--app-text-secondary, inherit)"
        },
        title: "问卷已提交并放行，agent 正在生成回复（后台计时，不占用页面）"
      }, Ji(f.phase)) : null;
    }, d = !!Ct.current;
    return Q && !ue ? e.createElement(
      "div",
      {
        style: {
          ...hn,
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
          ...bn,
          flex: O || X ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      O ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, O) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...Aa,
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
      d ? un(Ea, "qm-release-lock-fold") : null,
      // US-010: 🔒 二次确认气泡挂卡片根（折叠行经 card spread 已有 relative）。
      fn
    ) : e.createElement(
      "div",
      { style: hn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Tr, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Nr },
          Lr(e),
          e.createElement("span", { style: bn }, k)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放阻塞」按钮
          // 移除，不留多套并存）；出现条件沿用 showRelease 判定。
          d ? un(Ea, "qm-release-lock-ans") : null,
          e.createElement(
            "span",
            { style: { ...Ar, color: Se ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
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

` + $n(m) : `已跳过本次问卷。

` + $n(m) : ie || z || q || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + $n(m)),
      Q && ue ? e.createElement(
        "div",
        { style: zr },
        e.createElement("button", {
          type: "button",
          style: Aa,
          onClick: () => Be(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...zr, marginTop: 8, gap: 10 } },
        O ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, O) : l()
      ),
      // US-010: 🔒 二次确认气泡挂卡片根。
      fn
    );
  }
  const $r = V && C === Ot, ja = !x && !Re && fo >= 0 && ln.current[te] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Da = Object.keys(ln.current).map((l) => Number(l)).filter((l) => ln.current[l] && Number.isFinite(l)).sort((l, d) => l - d), Fo = Re && Da.length ? e.createElement("div", {
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
  }, "⚠ 第 " + Da.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let xn = null;
  if (Re)
    xn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Ir }, "其他意见（可选）"),
      Fo,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: Ge,
        style: Oa,
        onChange: (l) => Vt(l.target.value),
        onPaste: (l) => Sr(l, "final", "final")
      }),
      Gr({
        R: e,
        files: le,
        disabled: x || D,
        uploading: kr,
        error: wr,
        onPick: () => qr("final", "final"),
        onRemove: (l) => xe((d) => d.filter((f, u) => u !== l))
      })
    );
  else if (_e && oe(_e) === "text")
    xn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Ir, fontSize: 13, color: "var(--app-text, inherit)" } }, Ln(_e, te)),
      ja,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof J.value == "string" ? J.value : "",
        style: Oa,
        onChange: (l) => wt({ ...J, value: l.target.value, other: "" }),
        onPaste: (l) => Sr(l, "q", vt)
      }),
      Gr({
        R: e,
        files: J.attachments || [],
        disabled: x || D,
        uploading: kr,
        error: wr,
        onPick: () => qr("q", vt),
        onRemove: (l) => wt({
          ...J,
          attachments: (J.attachments || []).filter((d, f) => f !== l)
        })
      })
    );
  else if (_e) {
    const l = as(_e), d = ss(nn, te), f = l.length ? l : d ? [d] : l, u = (_e.options || []).map((v, I) => Ba(
      Le(v),
      $a(v),
      () => Ma(v),
      "o" + I,
      cl(_e, v, f),
      I + 1
    ));
    u.push(Ba("其他", Ra, () => Ma(be), "other")), Ra && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: J.other,
      style: { ...Mo, marginTop: 2 },
      onChange: (v) => wt({ ...J, other: v.target.value }),
      onPaste: (v) => Sr(v, "q", vt)
    })), u.push(Gr({
      R: e,
      files: J.attachments || [],
      disabled: x || D,
      uploading: kr,
      error: wr,
      onPick: () => qr("q", vt),
      onRemove: (v) => wt({
        ...J,
        attachments: (J.attachments || []).filter((I, A) => A !== v)
      })
    }))), xn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Ir, fontSize: 13, color: "var(--app-text, inherit)" } }, Ln(_e, te)),
      ja,
      e.createElement("div", { style: { ...$o, marginTop: 8 } }, u)
    );
  }
  const Rr = rt + 1, Wo = Re ? Rr + "/" + Rr : w + 1 + "/" + Rr, Fa = (l, d, f, u, v) => e.createElement("button", {
    type: "button",
    title: l,
    "aria-label": l,
    onClick: f,
    style: {
      ...v != null && v.text ? { width: "auto", padding: "0 7px" } : { width: 24, padding: 0 },
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
  }, u), Ho = e.createElement(
    "span",
    {
      style: { display: "inline-flex", alignItems: "center", gap: 3 }
    },
    e.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "更多"),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  ), Uo = e.createElement(
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
  ), kn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 1e4,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, vn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, wn = (l, d) => e.createElement(
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
  ), Wa = (ur || []).find((l) => l.id === Ke), Go = Wa ? Wa.name : "默认模板", Jo = e.createElement(
    "div",
    { style: kn, role: "menu", className: "qm-hdr-pop" },
    e.createElement("div", { style: vn }),
    wn("选择模板（当前：" + Go + "）", {
      disabled: x || D,
      onClick: () => {
        Oe(!1), mt(!1), ht(!1), Fe(!1), We(!1), Qe(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    wn("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: x || D || Re,
      onClick: () => {
        Oe(!1), Io();
      }
    }),
    wn("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: x || D,
      onClick: () => {
        Oe(!1), Cr(void 0, !0);
      }
    }),
    wn("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: x || D,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        Oe(!1), Fe(!0), We(!1);
      }
    })
  ), Zo = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定（点面板内部不关闭）。width 固有宽 + maxWidth 视口-44px 防溢出。
      ref: ir,
      role: "dialog",
      "aria-label": "查看上下文",
      className: "qm-hdr-pop",
      style: { ...kn, width: "300px", maxWidth: "calc(100vw - 44px)", padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: vn }),
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
  ), Ko = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定。width 248px（内容 240+padding 8）+ maxWidth 视口-44px，不溢出。
      ref: lr,
      role: "dialog",
      "aria-label": "选择模板",
      className: "qm-hdr-pop",
      style: { ...kn, padding: 4, width: "248px", maxWidth: "calc(100vw - 44px)" }
    },
    e.createElement("div", { style: vn }),
    Fl({
      R: e,
      templates: ur,
      value: Ke,
      onSelect: (l) => {
        wa(l), Qe(!1);
      },
      onManage: () => {
        Qe(!1), ya(!0);
      }
    })
  ), Qo = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      className: "qm-hdr-pop",
      style: { ...kn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: vn }),
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
          Fe(!1), Oo();
        }
      }, "确定")
    )
  ), Xo = e.createElement(
    "div",
    {
      key: "qm-hdr-pop",
      ref: gt,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "none"
      }
    },
    Fa("更多操作", rn, () => {
      Oe((l) => !l), mt(!1), ht(!1), Qe(!1), Fe(!1), We(!1);
    }, Ho, { text: !0 }),
    Fa("查看上下文", an, () => {
      mt((l) => !l), Oe(!1), ht(!1), Qe(!1), Fe(!1), We(!1);
    }, Uo),
    rn ? Jo : null,
    // US-012: 上下文气泡与模板选择面板（宽面板）不再挂本触发器小容器，
    // 改挂 qm-actions 行容器直下（见 qm-actions children 末尾）——移动端
    // 防错位/溢出（demo v5 参照系）。更多菜单/跳过确认气泡仍挂本容器。
    hr ? Qo : null
  ), Ha = {
    ...yn,
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
    { style: hn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Tr, className: "qm-header" },
      e.createElement(
        "div",
        { style: Nr },
        Lr(e),
        e.createElement("span", { style: bn, className: "qm-title" }, k)
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
        $r || Je && !_ ? un(_a, "qm-release-lock") : null,
        jl({
          R: e,
          providers: to,
          modelId: ga,
          disabled: x || D,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: ao,
          onOpenChange: so,
          tab: oo,
          onTabChange: io,
          onChange: (l) => {
            pn({ modelId: l }), ft(null), Ze.current = {}, je.current = {}, yt((d) => d + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        Dl({
          R: e,
          mode: ee,
          disabled: x || D,
          open: cr,
          onOpenChange: (l) => {
            ht(l), l && (Oe(!1), mt(!1), Qe(!1), Fe(!1), We(!1));
          },
          popRef: dr,
          panelRef: pr,
          // US-012: 面板独立锚点（面板挂 qm-actions 行容器）
          onChange: (l) => {
            pn({ mode: l }), l === "ai" && (je.current = {}), l === "ai" || l === "recommend" ? (cn.current = {}, tt.current = {}, xt.current = !1, yt((d) => d + 1)) : kt();
          }
        }),
        Hl({
          R: e,
          busy: ha,
          result: nn,
          error: ro,
          mode: ee,
          disabled: x || D,
          open: Tt,
          onOpenChange: ar,
          popRef: sr,
          panelRef: or,
          // US-013: 触发器/面板双 ref（外部点击关闭）
          onRun: () => {
            xr("manual");
          },
          onRerun: vo,
          onApply: So,
          onCancel: wo,
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
                checked: Yn,
                onChange: (l) => pn({ withContext: !!l.target.checked })
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
                checked: tr,
                onChange: (l) => pn({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (ee === "ai" || ee === "recommend") && !x ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: D,
          onClick: qo,
          style: {
            ...Ha,
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
        Xo,
        // US-012: 宽弹出层（上下文气泡/模板选择面板）上移到 qm-actions 行容器
        // 直下——移动端 qm-actions 换行后触发器小容器横向位置不定，挂行容器
        // right:0 对齐整行右缘（≈卡片右缘），修复错位/溢出/被裁（demo v5 口径）。
        // 模式下拉面板由 ModeSwitch 返回数组同步上移；互斥与外部点击关闭逻辑不变。
        an ? Zo : null,
        mr ? Ko : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Ar, key: "qm-step" }, Wo)
      )
    ),
    e.createElement("div", { style: Na }, xn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Wl({
      R: e,
      open: co,
      templates: ur,
      value: Ke,
      edit: po,
      onEditChange: gr,
      onClose: () => {
        ya(!1), gr(null);
      },
      onSelect: (l) => wa(l),
      onSave: xo,
      onDelete: ko
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
    ($r || Je && !_) && !x ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": V ? i : void 0,
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
        ($r ? "⚠️ 本题已超过 " + To + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；若你不想继续作答，点右上角 🔒 释放阻塞。"
      )
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Ve && !x ? e.createElement("div", {
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
      "data-qm-bundle": Ya
    }, Ve) : null,
    e.createElement(
      "div",
      { style: zr, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: w === 0 || D,
        style: { ...Ha, marginRight: "auto", opacity: w === 0 ? 0.5 : 1 },
        onClick: () => R((l) => l - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: D,
        style: Ro,
        onClick: zo
      }, Re ? "提交" : "下一步")
    ),
    // US-010: 🔒 二次确认气泡统一挂卡片根（四处 🔒 共用一个气泡实例）。
    fn
  );
}
const ds = 12;
let ps = 0;
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
let Wt = null;
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
function Gl(t) {
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
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", $();
}
function us() {
  return Object.keys(c.draft).length;
}
async function pa() {
  try {
    const t = await fetch(L("/question-modal/prefs"), { headers: B() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    c.globalCfg = n && typeof n == "object" ? n : {};
    try {
      $();
    } catch {
    }
  } catch {
  }
}
async function Us() {
  try {
    const t = await fetch(L("/question-modal/notify/channels"), {
      headers: B()
    });
    if (!t.ok) return;
    const e = await t.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off"), c.pcCurrent = String(e && e.pc_current || "off"), c.bgCurrent = String(e && e.bg_current || "off");
    try {
      $();
    } catch {
    }
  } catch {
  }
}
async function ua(t) {
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
        $();
      } catch {
      }
    } catch {
    }
}
async function Jl(t) {
  if (!t || t === "off") return;
  c.notifyTesting = t, c.notifyMsg = { ...c.notifyMsg, [t]: "发送中…" };
  try {
    $();
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
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await Us(), r || await ua(t);
  try {
    $();
  } catch {
  }
}
async function Zl() {
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
  t.length, c.saving = !0, c.saveMsg = "", $();
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
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + s.status + "）", $();
      return;
    }
    const p = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (p.length) {
      c.saving = !1;
      const m = p.map((k) => `${k.key}：${k.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + m, $();
      return;
    }
    c.saving = !1, c.draft = {}, zs();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const m = (x) => {
        try {
          const y = new Date(x * 1e3), z = (N) => N < 10 ? "0" + N : String(N);
          return y.getMonth() + 1 + "-" + z(y.getDate()) + " " + z(y.getHours()) + ":" + z(y.getMinutes()) + ":" + z(y.getSeconds());
        } catch {
          return "";
        }
      }, k = i.reduce(
        (x, y) => Math.max(x, Number(y && y.at) || 0),
        0
      ), g = i.map((x) => String(x && x.key || "")).filter(Boolean);
      c.conflictNote = "设置已于 " + m(k) + " 被其它位置修改，本次已按后写入的值覆盖" + (g.length ? "（" + g.join("、") + "）" : "") + "。";
    }
    try {
      const m = o && o.key_ts || {};
      m && typeof m == "object" && (c.keyTs = Object.assign({}, c.keyTs, m));
    } catch {
    }
    e || pa();
    const b = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let q = "";
    if (b && (q = e ? "session" : "default"), q === "default") {
      try {
        const m = await fetch(L("/question-modal/session-prefs"), {
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
        m.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + m.status + "），本会话仍在会话模式。", q = "");
      } catch (m) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (m && m.message ? m.message : m) + "，本会话仍在会话模式。", q = "";
      }
      c.keyTs = {};
    }
    if (q && (c.scopeChoice = q, c.tab = q, c.scope = q === "session" ? "session" : "global"), q === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (q === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const m = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + m + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Zt(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((m) => {
      m && (c.cfg = m);
      try {
        $();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    c.saving = !1, c.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    $();
  } catch {
  }
}
function Gs() {
  c.draft = {}, c.saveMsg = "";
}
function Js() {
  la().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      $();
    } catch {
    }
  }).catch(() => {
  });
}
function Kl() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", $();
}
function Ql(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", $());
}
function fs(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, $());
}
function Xl() {
  c.tplEdit = null, $();
}
async function Vl() {
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
    c.saveMsg = "模板名称不能为空", $();
    return;
  }
  c.tplBusy = !0, $();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await Os(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), $();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Js(), $();
}
async function Yl(t) {
  const e = c.templates.filter((a) => a.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await $s(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), $();
    return;
  }
  c.saveMsg = "模板已删除", Js(), $();
}
function ec() {
  c.visible = !0, c.chatId = "", c.sessionId = Xt(), c.cfg = null, c.cfgError = "", nc(), c.agentId = Hn || (() => {
    try {
      return Ne().getSelectedAgentId ? Ne().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), zs();
  const t = ++ps;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", $(), Zs(() => {
    if (t !== ps) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", $(), (c.tab === "global" || c.tab === "default") && pa(), Us().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && ua(r);
    });
  });
}
let Jr = !1;
async function tc() {
  if (!Jr) {
    Jr = !0;
    try {
      const t = await Zt(
        "",
        !0,
        c.sessionId,
        c.agentId
      ), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      Jr = !1;
      try {
        $();
      } catch {
      }
    }
  }
}
let Tn = !1;
function nc() {
  Tn || (Tn = !0, Promise.all([Rs(), la()]).then((t) => {
    Tn = !1;
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
      $();
    } catch {
    }
  }).catch(() => {
    Tn = !1;
  }));
}
function rc(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let Zr = !1, Nn = "";
const Kr = [];
function Zs(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (Zr && Nn === n) {
    t && Kr.push(t);
    return;
  }
  Zr = !0, Nn = n;
  const r = () => {
    Nn === n && (Zr = !1, Nn = "");
    const a = Kr.splice(0);
    try {
      a.forEach((s) => s());
    } catch {
    }
  };
  t && Kr.push(t), Zt(
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
      $();
    } catch {
    }
  }).catch(() => {
    c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global", c.cfgError = "读取配置失败（网络异常）"), r();
    try {
      $();
    } catch {
    }
  });
}
function $() {
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
    Wt || (Wt = document.createElement("div"), Wt.id = "qm-settings-root", document.body.appendChild(Wt)), e.render(t.createElement(cc, {
      R: t,
      open: c.visible,
      onClose: () => {
        if (us() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Gs();
        }
        c.visible = !1, c.saveMsg = "", $();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = Ks(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, $(), Zs(), (n === "global" || n === "default") && pa(), n === "stale" && tc();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: us(),
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
    }), Wt);
  }
}
function ac(t) {
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
const Qr = [
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
], Ks = (t) => t === "session";
function sc(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function oc(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function ms(t, e, n, r) {
  const a = n === "pc" ? "notify_channel_pc" : "notify_channel_bg", s = c.notifyChannels || [], o = String(
    (n === "pc" ? c.pcCurrent : c.bgCurrent) || "off"
  ), p = String(se(a, "off", "global") || o || "off"), h = ((E) => s.filter((w) => String(w.channel) === E)[0])(p), b = s.filter((E) => n !== "bg" || String(E.channel) !== "browser").map((E) => {
    const w = String(E.channel || ""), R = String(E.label || w), S = E.ready !== !1, T = E.verified === !0 || w === "off";
    let C = "";
    return S ? T || (C = "（待测试）") : C = "（不可用）", { value: w, label: R + C, disabled: !S };
  });
  b.length || b.push({ value: "off", label: "关闭", disabled: !1 });
  const q = !h || h.ready !== !1, m = p !== "off" && p !== "browser", k = c.notifyTesting === p, g = h && h.last_test || null, x = c.notifyMsg[p] || "", y = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: p,
      "data-qm-notify-select": "1",
      "data-qm-notify-scene": n,
      style: { flex: "0 0 auto" },
      onChange: (E) => {
        const w = E && E.target ? String(E.target.value) : "off";
        ge(a, w), ua(w);
      }
    }, b.map((E, w) => t.createElement("option", {
      key: "o" + w,
      value: E.value,
      disabled: !!E.disabled
    }, E.label)))
  ];
  if (m && q && y.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: k,
    "data-qm-notify-test": p,
    onClick: (E) => {
      E && E.stopPropagation && E.stopPropagation(), Jl(p);
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
    const E = h.reason_code === "missing_agent_id" || h.reason_code === "agent_not_found";
    y.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": h.reason_code || "",
      style: E ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, h.reason));
  }
  const z = !!(h && h.verified === !0), N = g || x, _ = !!x;
  if (N || m && q && !k) {
    const E = g ? g.delivered === !0 : _ ? x.indexOf("✓") === 0 : !1;
    let w;
    _ ? w = x : g ? w = E ? "✓ 上次测试成功" + (g.note ? "（" + g.note + "）" : "") : "✗ " + (g.error || g.note || "上次测试失败") : w = "未测试";
    const R = g && g.at_text ? "  ·  " + g.at_text : "", S = N ? E ? "#52c41a" : "#ff4d4f" : "#faad14";
    y.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": N ? E ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": N && (E || z) ? "1" : "0",
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
    }, w + R));
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
    }, y),
    n === "pc" ? "PC 端打开问卷时提醒一次（仅人工模式）。后台场景自动改走下一行配置。" : "页面已关闭或切后台时提醒一次（仅人工模式）。无浏览器选项：页面不在，浏览器通知必然无效。",
    "global",
    e,
    !1,
    !0
  );
}
function pe(t, e, n, r, a, s, o, p, i) {
  const h = s || "global", b = oc(o || "global", h), q = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      sc(t, "sc", h),
      b && h === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    a ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, a) : null
  ], m = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, q),
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
  }, m);
}
function gs(t, e, n, r, a) {
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
function An(t, e, n, r) {
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
function hs(t, e, n, r, a) {
  const s = rc(n), p = r.map((k) => k.id).indexOf(s.provider) >= 0 ? s.provider : "", i = p ? (r.filter((k) => k.id === p)[0] || { models: [] }).models : [], h = i.indexOf(s.model) >= 0 ? s.model : "", b = (k, g) => {
    a && a(k ? k + ":" + g : "");
  }, q = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: p,
    disabled: !a,
    title: "厂商",
    onChange: (k) => {
      const g = k && k.target ? k.target.value : "", x = g ? (r.filter((y) => y.id === g)[0] || { models: [] }).models : [];
      b(g, g && x[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((k, g) => t.createElement(
    "option",
    { key: "g" + g, value: k.id },
    k.name === k.id ? k.id : k.name + "（" + k.models.length + "）"
  )))), m = t.createElement("select", {
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
    q,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    m
  ]);
}
const ic = () => [
  { name: "工作时段", start: "09:00", end: "18:00", mode: "ai", chPc: "", chBg: "" },
  { name: "夜间值守", start: "22:00", end: "06:00", mode: "manual", chPc: "", chBg: "" }
];
let In = ic(), ve = {
  enabled: !0,
  url: "https://example.com/hook/notify",
  method: "post-json",
  tokenPos: "bearer",
  token: "sk-demo-0000000000000000"
};
function lc(t, e, n, r, a) {
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
  }, q = {
    "30 秒": 30,
    "60 秒": 60,
    "120 秒": 120,
    "180 秒（默认）": 180,
    "300 秒": 300,
    "600 秒": 600
  }, m = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, k = a && a.templateOptions || [];
  a && a.modelOptions;
  const g = a && a.providerGroups || [], x = k.map((y) => {
    const z = c.templates.filter((N) => String(N.id) === String(y))[0];
    return { value: y, label: z && (z.name || z.id) || y };
  });
  if (e === "session") {
    const z = String(se("mode", "manual")) !== "recommend";
    if (s.push(pe(
      t,
      "s1",
      "答题模式",
      gs(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(se("mode", "manual"))] || "人工",
        (N) => ge("mode", p[N] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), z) {
      s.push(pe(
        t,
        "s2",
        "默认模型",
        hs(
          t,
          "sel2",
          String(se("model_id", "")),
          g,
          (_) => ge("model_id", _)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        Gl("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const N = String(se("template_id", "")) || x[0] && x[0].value || "";
      s.push(pe(
        t,
        "s3",
        "提示词模板",
        x.length ? it(
          t,
          "sel3",
          N,
          x,
          (_) => ge("template_id", _)
        ) : it(t, "sel3", "默认六步思维链"),
        x.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), s.push(pe(
        t,
        "s4",
        "携带上下文",
        An(
          t,
          "s4sw",
          !!se("with_context", !1),
          (_) => ge("with_context", _)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), s.push(pe(
        t,
        "s5",
        "并行分析各题",
        An(
          t,
          "s5sw",
          !!se("parallel", !1),
          (_) => ge("parallel", _)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const N = String(se("mode", "manual", "global")) !== "recommend";
      s.push(pe(
        t,
        "a1",
        "默认答题模式",
        gs(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(se("mode", "manual", "global"))] || "人工",
          (_) => ge("mode", p[_] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), N && (s.push(pe(
        t,
        "b1",
        "默认模型",
        hs(
          t,
          "sel2",
          String(se("model_id", "", "global")),
          g,
          (_) => ge("model_id", _)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), s.push(pe(
        t,
        "b2",
        "提示词模板",
        x.length ? it(
          t,
          "sel3",
          String(se("template_id", "", "global")) || x[0].value,
          x,
          (_) => ge("template_id", _)
        ) : it(t, "sel3", "默认六步思维链"),
        x.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), s.push(pe(
        t,
        "b3",
        "携带上下文",
        An(
          t,
          "s3",
          !!se("with_context", !1, "global"),
          (_) => ge("with_context", _)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), s.push(pe(
        t,
        "b4",
        "并行分析各题",
        An(
          t,
          "s4",
          !!se("parallel", !1, "global"),
          (_) => ge("parallel", _)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      s.push(ms(t, o, "pc", "PC 端打开时提醒频道")), s.push(ms(t, o, "bg", "后台运行时提醒频道"));
      const z = [
        { value: "post-json", label: "POST（JSON）" },
        { value: "get-query", label: "GET（query 传参）" }
      ], N = [
        { value: "bearer", label: "Authorization: Bearer 头" },
        { value: "query", label: "query 参数 token=…" },
        { value: "none", label: "不携带 token" }
      ], _ = (T, C, W) => t.createElement("div", { className: "qm-set-schedfield", key: T }, [
        t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, C),
        W
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
              ve.enabled = !ve.enabled, $();
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
        _("furl", "请求地址（URL）", t.createElement("input", {
          key: "url",
          type: "text",
          className: "qm-set-input",
          value: ve.url,
          placeholder: "https://…",
          "data-qm-api-url": "1",
          onChange: (T) => {
            ve.url = T && T.target ? String(T.target.value) : "", $();
          }
        })),
        // 请求方法 + Token 位置（两列网格）
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          _("fmethod", "请求方法", t.createElement("select", {
            key: "method",
            className: "qm-set-native",
            value: ve.method,
            "data-qm-api-method": "1",
            onChange: (T) => {
              ve.method = T && T.target ? String(T.target.value) : "post-json", $();
            }
          }, z.map((T, C) => t.createElement("option", { key: "o" + C, value: T.value }, T.label)))),
          _("ftpos", "Token 位置（可选）", t.createElement("select", {
            key: "tp",
            className: "qm-set-native",
            value: ve.tokenPos,
            "data-qm-api-tokenpos": "1",
            onChange: (T) => {
              ve.tokenPos = T && T.target ? String(T.target.value) : "bearer", $();
            }
          }, N.map((T, C) => t.createElement("option", { key: "o" + C, value: T.value }, T.label))))
        ]),
        // Token 密码框（type=password 回显打码形态）
        _("ftoken", "Token（可选，保存后回显打码）", t.createElement("input", {
          key: "tk",
          type: "password",
          className: "qm-set-input",
          value: ve.token,
          placeholder: "选填",
          "data-qm-api-token": "1",
          onChange: (T) => {
            ve.token = T && T.target ? String(T.target.value) : "", $();
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
          (T) => ge("model_timeout_sec", h[T] ?? 120)
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
          m[Number(se("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (T) => ge("wait_hint_sec", q[T] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const E = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], w = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, R = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, S = Number(se("gate_log_limit", 200, "global"));
      s.push(pe(
        t,
        "d5",
        "拦截记录",
        it(
          t,
          "sel6",
          R[S] || "最近 200 条（默认）",
          E,
          (T) => ge("gate_log_limit", w[T] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const y = c.templates, z = c.tplEdit;
    if (s.push(pe(
      t,
      "p0",
      "模板库共享范围",
      t.createElement("span", { className: "qm-set-static" }, "所有会话共用同一套模板"),
      "模板的增删改对全部会话立即生效；具体选用哪套模板按会话独立",
      "global",
      o
    )), y.length ? s.push(t.createElement(
      "div",
      { className: "qm-set-list", key: "list" },
      y.map((N, _) => {
        const E = !!N.builtin, R = (String(N.note || N.desc || "").trim() || String(N.system || N.system_prompt || N.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), S = R.length > 90 ? R.slice(0, 90) + "…" : R;
        return t.createElement("div", { className: "qm-set-item", key: "i" + _ }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(N.name || N.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (E ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, E ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(N.id),
              onClick: () => {
                Ql(String(N.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (E ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(N.id),
              disabled: E,
              title: E ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                E || Yl(String(N.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, S)
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
          Kl();
        }
      }, "＋ 新建模板")
    ])), z) {
      const N = (_, E, w, R, S) => {
        var T, C;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + E }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, _),
          w ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: R,
            "data-qm-tpl-field": E,
            placeholder: S,
            value: String(((T = c.tplEdit) == null ? void 0 : T[E]) || ""),
            onChange: (W) => fs(E, W && W.target ? W.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": E,
            placeholder: S,
            value: String(((C = c.tplEdit) == null ? void 0 : C[E]) || ""),
            onChange: (W) => fs(E, W && W.target ? W.target.value : "")
          })
        ]);
      };
      s.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (z.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          z.id ? "编辑模板：" + (z.name || z.id) : "新建模板"
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
            disabled: !!c.tplBusy,
            onClick: () => {
              Vl();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              Xl();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "schedule") {
    const y = [
      { value: "ai", label: "自动执行" },
      { value: "recommend", label: "只用推荐" },
      { value: "manual", label: "人工作答" }
    ], z = (E) => {
      const w = (c.notifyChannels || []).filter((R) => E !== "bg" || String(R.channel) !== "browser").map((R) => ({
        value: String(R.channel || ""),
        label: String(R.label || R.channel || "")
      }));
      return [{ value: "", label: "跟随全局" }].concat(w);
    }, N = (E, w, R) => {
      const S = In[E];
      S && (S[w] = R, $());
    }, _ = (E, w) => {
      const R = (T, C, W) => {
        const V = {
          type: "time",
          key: T,
          value: C,
          style: { flex: "1 1 auto", minWidth: 0 },
          onChange: (U) => N(
            w,
            T,
            U && U.target ? String(U.target.value) : ""
          )
        };
        return V["data-qm-sched-" + W] = String(w), t.createElement("input", V);
      }, S = (T, C, W, V) => {
        const U = {
          key: T,
          className: "qm-set-native",
          value: C,
          onChange: (M) => N(
            w,
            T,
            M && M.target ? String(M.target.value) : ""
          )
        };
        return U["data-qm-sched-" + W] = String(w), t.createElement("select", U, V.map((M, Z) => t.createElement("option", { key: "o" + Z, value: M.value }, M.label)));
      };
      return t.createElement("div", {
        className: "qm-set-schedcard",
        key: "sc" + w,
        "data-qm-sched-card": String(w)
      }, [
        // 顶行：名称 + 删除按钮
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement("input", {
            key: "name",
            className: "qm-set-input qm-set-schedname",
            value: E.name,
            placeholder: "时段名称（如：工作时段）",
            "data-qm-sched-name": String(w),
            onChange: (T) => N(
              w,
              "name",
              T && T.target ? String(T.target.value) : ""
            )
          }),
          t.createElement("button", {
            type: "button",
            key: "del",
            className: "qm-set-scheddel",
            "data-qm-sched-del": String(w),
            title: "删除该时段（仅演示，不影响真实配置）",
            onClick: () => {
              In.splice(w, 1), $();
            }
          }, "删除")
        ]),
        // 中部网格：起止时间 / 答题方式 / PC 端渠道 / 后台渠道
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          t.createElement("div", { className: "qm-set-schedfield", key: "ftime" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "生效时间"),
            t.createElement("div", { className: "qm-set-schedtime", key: "t" }, [
              R("start", E.start, "start"),
              t.createElement("span", { key: "sep", className: "qm-set-schedtimesep" }, "至"),
              R("end", E.end, "end")
            ])
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fmode" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "答题方式"),
            S("mode", E.mode, "mode", y)
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fpc" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "PC 端通知渠道"),
            S("chPc", E.chPc, "pc", z("pc"))
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fbg" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "后台通知渠道"),
            S("chBg", E.chBg, "bg", z("bg"))
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
    }, In.map((E, w) => _(E, w)))), s.push(t.createElement("button", {
      type: "button",
      key: "schedadd",
      className: "qm-set-btn qm-set-btnnew qm-set-schedadd",
      "data-qm-sched-add": "1",
      title: "添加一组时段（仅演示，不会保存）",
      onClick: () => {
        In.push({ name: "", start: "", end: "", mode: "ai", chPc: "", chBg: "" }), $();
      }
    }, "＋ 添加时段"));
  } else if (e === "stale") {
    const y = c.stale, z = y && y.rows || [], N = y && y.exceeded || [], _ = y && y.within || [], E = (y && y.blocking || []).length ? y.blocking : z.filter((U) => U && U.nature === "blocking"), w = (y && y.residual || []).length ? y.residual : z.filter((U) => U && U.nature !== "blocking"), R = E.filter(
      (U) => U && N.some(
        (M) => M.tool_call_id === U.tool_call_id
      )
    ), S = y ? y.threshold : null, T = Yr(S), C = S !== null && S <= 0, W = !!(y && (y.busy || y.thrBusy)) || R.length === 0 || C, V = !!(y && (y.busy || y.thrBusy)) || w.length === 0;
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
            C ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${T} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(y && y.thrBusy),
            value: S === null ? "" : String(S),
            onChange: (U) => {
              const M = Number(U.target.value);
              c.draft.release_after_sec = M, c.stale.threshold = M, c.stale.msgKind = "", c.stale.msg = "已选择「" + Yr(M) + "」，点下方「保存」后生效", $();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            S === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
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
      C ? t.createElement("div", {
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
          disabled: !!(y && y.busy),
          onClick: () => {
            al();
          }
        }, y && y.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: W,
          title: C ? "自动释放已关闭，请逐条释放" : R.length ? `释放全部 ${R.length} 条已超阈值的阻塞问卷（观察期内 ${_.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            sl();
          }
        }, R.length ? `全部释放（阻塞·已超阈值 ${R.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: V,
          title: w.length ? `清理全部 ${w.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            ol();
          }
        }, w.length ? `全部清理（残留 ${w.length} 条）` : "全部清理")
      ])
    ])), y && y.msg && s.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": y.msgKind || "info"
    }, y.msg)), y && y.scanned && z.length === 0 && s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!y || !y.scanned) && (y && y.msg || s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), z.length) {
      const M = {};
      N.forEach((O) => {
        M[O.tool_call_id] = !0;
      });
      const Z = (O, qe) => {
        if (!O) return;
        const ie = () => {
          c.stale.copied = qe, $(), setTimeout(() => {
            c.stale.copied === qe && (c.stale.copied = "", $());
          }, 1600);
        };
        try {
          const K = typeof navigator < "u" ? navigator : null;
          if (K && K.clipboard && K.clipboard.writeText)
            K.clipboard.writeText(O).then(ie, ie);
          else {
            const Q = document.createElement("textarea");
            Q.value = O, document.body.appendChild(Q), Q.select(), document.execCommand("copy"), document.body.removeChild(Q), ie();
          }
        } catch {
          ie();
        }
      }, Ge = (O, qe) => {
        const ie = !!O.terminable, K = !!M[O.tool_call_id], Q = qe === "blocking", ye = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const xe = O.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${O.idle_text}，阈值 ${T}）${xe}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && Fr([O.tool_call_id]);
        }, X = !!(y && y.copied) && y.copied === O.tool_call_id, ze = (xe) => {
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
          key: O.tool_call_id + ":" + qe,
          "data-qm-stale-row": O.tool_call_id,
          "data-qm-stale-nature": qe,
          "data-qm-stale-group": K ? "exceeded" : "within"
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
              O.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : O.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : O.reason_code === "no-future" ? "无唤醒句柄" : O.reason_code === "future-done" ? "已结束未收尾" : K ? "已超阈值" : "观察期内"
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
            le("agent", "归属", O.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            le(
              "sid",
              "会话 ID",
              X ? "✓ 会话 ID 已复制" : O.session_id || "-",
              {
                title: X ? "已复制到剪贴板" : O.session_id ? "点击复制完整会话 ID：" + O.session_id : "",
                style: O.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: X ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": O.tool_call_id,
                onClick: () => {
                  Z(String(O.session_id || ""), O.tool_call_id);
                }
              }
            ),
            le("tcid", "问卷 ID", O.tool_call_id || "-"),
            le("idle", "挂起时长", O.idle_text || "-"),
            le("created", "发起时间", ze(O.created_at)),
            le("mode", "作答模式", O.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...Q ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": O.tool_call_id,
                disabled: !!(y && y.busy),
                title: K ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  K ? Fr([O.tool_call_id]) : ye();
                }
              }, K ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": O.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(y && y.busy) || !ie,
                title: ie ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  il([O.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": O.tool_call_id,
                disabled: !!(y && y.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  Fr([O.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, Vt = (O, qe, ie, K, Q) => {
        if (!K || !K.length) return null;
        const ye = Math.max(1, Math.ceil(K.length / 5)), X = Math.min(
          Math.max(0, Number(y[Q]) || 0),
          ye - 1
        ), ze = K.slice(
          X * 5,
          X * 5 + 5
        ), le = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": O
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": O
            }, qe),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, ie)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": O
          }, ze.map((xe) => Ge(xe, O)))
        ];
        if (ye > 1) {
          const xe = (Be) => {
            c.stale[Q] = Be, $();
          }, ue = (Be, Je, pt, St) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: St,
            "data-qm-stale-page": String(Je),
            disabled: pt,
            onClick: () => {
              xe(Je);
            }
          }, Be);
          le.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": O
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
      }, D = Vt(
        "blocking",
        `🔴 正在阻塞会话（${E.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        E,
        "page"
      ), Ae = Vt(
        "residual",
        `⚪ 异常残留（${w.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        w,
        "resPage"
      );
      D && s.push(...D), Ae && s.push(...Ae);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, s);
}
function cc(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const a = Xe(), s = a && a.Modal, o = !t.tab, p = t.tab || "", i = Ks(p) ? "session" : "global", h = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Qr.map((Z) => e.createElement("button", {
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
  ), b = Qr.filter((Z) => Z.key === p)[0] || Qr[0], q = !!(t.cfg && t.cfg.has_session), m = q ? "session" : "default", k = q ? "会话模式" : "默认模式", g = e.createElement("div", {
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
      "data-qm-runtime": m,
      "data-qm-scope-badge": m
    }, k)
  ]), x = e.createElement("button", {
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
  }, "✕"), y = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      g,
      x
    ])
  ]), z = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, N = null, _ = o ? e.createElement("div", {
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
  }))) : null, E = o ? _ : lc(e, p, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), w = t.dirtyCount || 0, R = String(t.tab || ""), S = R === "session" || R === "default";
  let T;
  R === "schedule" ? T = "时段调度为界面预览（本版不保存，现有配置不受影响）" : S ? T = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : T = R === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const C = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      w ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + w + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, T)
    ]),
    e.createElement("div", { className: "qm-set-footbtns", key: "fb" }, [
      // ── 撤销按钮（boss 2026-11-15 需求 3，第二轮重做）──────────────
      // 取代原「取消」按钮。只要有未保存的修改（dirty>0）就出现，
      // 不需要先保存过。点击 = 放弃本次全部未保存修改，界面立即恢复为
      // 上一次保存的参数（清空 draft 后 cfgValue 直接回落到已保存值），
      // 纯前端恢复、不发任何保存请求；要落库必须再手动点「保存」。
      w > 0 ? e.createElement("button", {
        key: "undo",
        type: "button",
        className: "qm-set-btn",
        "data-qm-undo": "1",
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          Gs(), $();
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
          Zl();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), W = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, V = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, U = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    N,
    z,
    E,
    W,
    V
  ]), M = e.createElement("div", { className: "qm-set-wrap" }, [
    y,
    h,
    U,
    C
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
function dc(t) {
  try {
    const e = t && t.sender, n = Ne().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(ac, {
      R: n,
      onOpen: () => {
        ec();
      }
    });
    e.addPrefix(Ts, r, {
      id: "question-modal.settings-btn",
      order: ds
    }), console.log("[question-modal] settings entry registered (order " + ds + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function pc() {
  const t = Mi();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return Bi(), t.toolRender(Ts, Va, Ul), console.log("[question-modal] registered via chat.toolRender for", Va), dc(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!pc()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
