var ri = Object.defineProperty;
var Ja = (t) => {
  throw TypeError(t);
};
var ai = (t, e, n) => e in t ? ri(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var Y = (t, e, n) => ai(t, typeof e != "symbol" ? e + "" : e, n), si = (t, e, n) => e.has(t) || Ja("Cannot " + n);
var Za = (t, e, n) => e.has(t) ? Ja("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var En = (t, e, n) => (si(t, e, "access private method"), n);
function ra() {
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
let ct = ra();
function ks(t) {
  ct = t;
}
const vs = /[&<>"']/, oi = new RegExp(vs.source, "g"), ws = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, ii = new RegExp(ws.source, "g"), li = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Qa = (t) => li[t];
function we(t, e) {
  if (e) {
    if (vs.test(t))
      return t.replace(oi, Qa);
  } else if (ws.test(t))
    return t.replace(ii, Qa);
  return t;
}
const ci = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function di(t) {
  return t.replace(ci, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const pi = /(^|[^\[])\^/g;
function V(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (a, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(pi, "$1"), n = n.replace(a, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function Va(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Jt = { exec: () => null };
function Xa(t, e) {
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
function Cn(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let a = 0;
  for (; a < r && t.charAt(r - a - 1) === e; )
    a++;
  return t.slice(0, r - a);
}
function ui(t, e) {
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
function Ya(t, e, n, r) {
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
function fi(t, e) {
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
    Y(this, "options");
    Y(this, "rules");
    // set by the lexer
    Y(this, "lexer");
    this.options = e || ct;
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
        text: this.options.pedantic ? r : Cn(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], a = fi(r, n[3] || "");
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
        const a = Cn(r, "#");
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
      r = Cn(r.replace(/^ *>[ \t]?/gm, ""), `
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
`, 1)[0].replace(/^\t+/, (I) => " ".repeat(3 * I.length)), m = e.split(`
`, 1)[0], k = 0;
        this.options.pedantic ? (k = 2, i = q.trimStart()) : (k = n[2].search(/[^ ]/), k = k > 4 ? 1 : k, i = q.slice(k), k += n[1].length);
        let g = !1;
        if (!q && /^ *$/.test(m) && (p += m + `
`, e = e.substring(m.length + 1), b = !0), !b) {
          const I = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), z = new RegExp(`^ {0,${Math.min(3, k - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), T = new RegExp(`^ {0,${Math.min(3, k - 1)}}(?:\`\`\`|~~~)`), _ = new RegExp(`^ {0,${Math.min(3, k - 1)}}#`);
          for (; e; ) {
            const w = e.split(`
`, 1)[0];
            if (m = w, this.options.pedantic && (m = m.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), T.test(m) || _.test(m) || I.test(m) || z.test(e))
              break;
            if (m.search(/[^ ]/) >= k || !m.trim())
              i += `
` + m.slice(k);
            else {
              if (g || q.search(/[^ ]/) >= 4 || T.test(q) || _.test(q) || z.test(q))
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
    const r = Xa(n[1]), a = n[2].replace(/^\||\| *$/g, "").split("|"), s = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(Xa(p, o.header.length).map((i) => ({
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
        const o = Cn(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = ui(n[2], "()");
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
      return a = a.trim(), /^</.test(a) && (this.options.pedantic && !/>$/.test(r) ? a = a.slice(1) : a = a.slice(1, -1)), Ya(n, {
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
      return Ya(r, s, r[0], this.lexer);
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
const mi = /^(?: *(?:\n|$))+/, gi = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, hi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Yt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, bi = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, qs = /(?:[*+-]|\d{1,9}[.)])/, Ss = V(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, qs).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), aa = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, yi = /^[^\n]+/, sa = /(?!\s*\])(?:\\.|[^\[\]\\])+/, xi = V(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", sa).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ki = V(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, qs).getRegex(), Kn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", oa = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, vi = V("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", oa).replace("tag", Kn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), _s = V(aa).replace("hr", Yt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Kn).getRegex(), wi = V(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", _s).getRegex(), ia = {
  blockquote: wi,
  code: gi,
  def: xi,
  fences: hi,
  heading: bi,
  hr: Yt,
  html: vi,
  lheading: Ss,
  list: ki,
  newline: mi,
  paragraph: _s,
  table: Jt,
  text: yi
}, es = V("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Yt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Kn).getRegex(), qi = {
  ...ia,
  table: es,
  paragraph: V(aa).replace("hr", Yt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", es).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Kn).getRegex()
}, Si = {
  ...ia,
  html: V(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", oa).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Jt,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: V(aa).replace("hr", Yt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Ss).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Es = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, _i = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Cs = /^( {2,}|\\)\n(?!\s*$)/, Ei = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, en = "\\p{P}\\p{S}", Ci = V(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, en).getRegex(), Ni = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Ti = V(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, en).getRegex(), zi = V("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, en).getRegex(), Ai = V("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, en).getRegex(), Ii = V(/\\([punct])/, "gu").replace(/punct/g, en).getRegex(), Oi = V(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), $i = V(oa).replace("(?:-->|$)", "-->").getRegex(), Mi = V("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", $i).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Ln = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Pi = V(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", Ln).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ns = V(/^!?\[(label)\]\[(ref)\]/).replace("label", Ln).replace("ref", sa).getRegex(), Ts = V(/^!?\[(ref)\](?:\[\])?/).replace("ref", sa).getRegex(), Ri = V("reflink|nolink(?!\\()", "g").replace("reflink", Ns).replace("nolink", Ts).getRegex(), la = {
  _backpedal: Jt,
  // only used for GFM url
  anyPunctuation: Ii,
  autolink: Oi,
  blockSkip: Ni,
  br: Cs,
  code: _i,
  del: Jt,
  emStrongLDelim: Ti,
  emStrongRDelimAst: zi,
  emStrongRDelimUnd: Ai,
  escape: Es,
  link: Pi,
  nolink: Ts,
  punctuation: Ci,
  reflink: Ns,
  reflinkSearch: Ri,
  tag: Mi,
  text: Ei,
  url: Jt
}, Li = {
  ...la,
  link: V(/^!?\[(label)\]\((.*?)\)/).replace("label", Ln).getRegex(),
  reflink: V(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Ln).getRegex()
}, ea = {
  ...la,
  escape: V(Es).replace("])", "~|])").getRegex(),
  url: V(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Bi = {
  ...ea,
  br: V(Cs).replace("{2,}", "*").getRegex(),
  text: V(ea.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, Nn = {
  normal: ia,
  gfm: qi,
  pedantic: Si
}, Bt = {
  normal: la,
  gfm: ea,
  breaks: Bi,
  pedantic: Li
};
class Me {
  constructor(e) {
    Y(this, "tokens");
    Y(this, "options");
    Y(this, "state");
    Y(this, "tokenizer");
    Y(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || ct, this.options.tokenizer = this.options.tokenizer || new Rn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: Nn.normal,
      inline: Bt.normal
    };
    this.options.pedantic ? (n.block = Nn.pedantic, n.inline = Bt.pedantic) : this.options.gfm && (n.block = Nn.gfm, this.options.breaks ? n.inline = Bt.breaks : n.inline = Bt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: Nn,
      inline: Bt
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
class Bn {
  constructor(e) {
    Y(this, "options");
    this.options = e || ct;
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
    const a = Va(e);
    if (a === null)
      return r;
    e = a;
    let s = '<a href="' + e + '"';
    return n && (s += ' title="' + n + '"'), s += ">" + r + "</a>", s;
  }
  image(e, n, r) {
    const a = Va(e);
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
class ca {
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
    Y(this, "options");
    Y(this, "renderer");
    Y(this, "textRenderer");
    this.options = e || ct, this.options.renderer = this.options.renderer || new Bn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new ca();
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
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, di(this.parseInline(o.tokens, this.textRenderer)));
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
class Zt {
  constructor(e) {
    Y(this, "options");
    this.options = e || ct;
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
Y(Zt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var lt, ta, zs;
class ji {
  constructor(...e) {
    Za(this, lt);
    Y(this, "defaults", ra());
    Y(this, "options", this.setOptions);
    Y(this, "parse", En(this, lt, ta).call(this, Me.lex, Pe.parse));
    Y(this, "parseInline", En(this, lt, ta).call(this, Me.lexInline, Pe.parseInline));
    Y(this, "Parser", Pe);
    Y(this, "Renderer", Bn);
    Y(this, "TextRenderer", ca);
    Y(this, "Lexer", Me);
    Y(this, "Tokenizer", Rn);
    Y(this, "Hooks", Zt);
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
        const s = this.defaults.renderer || new Bn(this.defaults);
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
        const s = this.defaults.hooks || new Zt();
        for (const o in r.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const p = o, i = r.hooks[p], h = s[p];
          Zt.passThroughHooks.has(o) ? s[p] = (b) => {
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
lt = new WeakSet(), ta = function(e, n) {
  return (r, a) => {
    const s = { ...a }, o = { ...this.defaults, ...s };
    this.defaults.async === !0 && s.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const p = En(this, lt, zs).call(this, !!o.silent, !!o.async);
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
}, zs = function(e, n) {
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
const it = new ji();
function J(t, e) {
  return it.parse(t, e);
}
J.options = J.setOptions = function(t) {
  return it.setOptions(t), J.defaults = it.defaults, ks(J.defaults), J;
};
J.getDefaults = ra;
J.defaults = ct;
J.use = function(...t) {
  return it.use(...t), J.defaults = it.defaults, ks(J.defaults), J;
};
J.walkTokens = function(t, e) {
  return it.walkTokens(t, e);
};
J.parseInline = it.parseInline;
J.Parser = Pe;
J.parser = Pe.parse;
J.Renderer = Bn;
J.TextRenderer = ca;
J.Lexer = Me;
J.lexer = Me.lex;
J.Tokenizer = Rn;
J.Hooks = Zt;
J.parse = J;
J.options;
J.setOptions;
J.use;
J.walkTokens;
J.parseInline;
Pe.parse;
Me.lex;
const As = "question-modal", ts = "question_modal", Br = 3, ns = "gate-v2@2026.10.21";
function Ne() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Di() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function Ze() {
  return Ne().antd || {};
}
function Wi() {
  return Ne().antdIcons || {};
}
const Fi = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function jr(t) {
  const e = Wi();
  for (const n of Fi) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function Hi() {
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
      "color:var(--app-accent,#3b82f6)}",
      // ── 自定义 API · 必传可见性与参数行（US-020，2026-11-23）──
      // boss 核心诉求原文：「用户不知道哪些是属于必传项，是否符合大部分的
      // API 请求以及参数要求」。以下样式全部服务于「必传一眼可见」。
      //
      // 必传星号：红色，与正文有足够对比度（不用 accent 色，避免和「新增」
      // 这类主动作混淆——**危险/必填用红、可选用灰**是本项目的既有口径）。
      ".qm-apireq{color:#d92d20;font-weight:700;margin-left:2px}",
      // 区块图例：一行小字说明「标 * 为必传项」，放在表单顶部
      ".qm-apilegend{font-size:11px;color:var(--app-text-tertiary,#94a3b8);",
      "margin:2px 0 6px}",
      // 顶部汇总条：缺项时橙色告警，齐备时绿色确认。
      // 两种态用同一元素切换 class，避免布局跳动。
      ".qm-apistatus{display:flex;align-items:center;gap:6px;font-size:12px;",
      "padding:6px 10px;border-radius:6px;margin:8px 0}",
      ".qm-apistatus.miss{background:rgba(212,107,8,.08);color:#d46b08;",
      "border:1px solid rgba(212,107,8,.35)}",
      ".qm-apistatus.ok{background:rgba(56,158,13,.08);color:#389e0d;",
      "border:1px solid rgba(56,158,13,.35)}",
      // 系统字段区：锁定不可删，用浅底区分于用户自定义区
      ".qm-apisysblock{background:var(--app-surface-subtle,rgba(127,127,127,.06));",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.18));",
      "border-radius:6px;padding:8px 10px;margin:6px 0}",
      ".qm-apisysrow{display:flex;align-items:center;gap:8px;font-size:12px;",
      "padding:3px 0}",
      ".qm-apisysname{flex:0 0 78px;font-weight:600;",
      "color:var(--app-text-primary,#1e293b)}",
      ".qm-apisysval{flex:1 1 auto;color:var(--app-text-secondary,#4e5969);",
      "font-family:SF Mono,Monaco,Consolas,monospace;font-size:11px}",
      ".qm-apisystag{flex:0 0 auto;font-size:10px;padding:1px 5px;border-radius:3px;",
      "background:rgba(217,45,32,.1);color:#d92d20}",
      // 参数行表格：参数名 / 参数值 / 必填 / 操作 四列
      ".qm-apiparamhead,.qm-apiparamrow{display:flex;align-items:center;gap:6px;",
      "font-size:12px}",
      ".qm-apiparamhead{padding:0 0 4px;color:var(--app-text-tertiary,#94a3b8);",
      "font-size:11px}",
      ".qm-apiparamrow{padding:3px 0;position:relative}",
      ".qm-apiparamrow.miss{padding-left:7px}",
      // 必传未填的整行标红竖条：比只标红色文字更醒目
      ".qm-apiparamrow.miss::before{content:'';position:absolute;left:0;top:2px;",
      "bottom:2px;width:3px;border-radius:2px;background:#d92d20}",
      ".qm-apipk,.qm-apipv{min-width:0;height:26px;padding:0 7px;font-size:12px;",
      "border-radius:5px;border:1px solid var(--app-border-strong,#cbd5e1);",
      "background:var(--app-surface-raised,#fff);color:inherit;font-family:inherit}",
      ".qm-apipk{flex:0 0 34%}",
      ".qm-apipv{flex:1 1 auto}",
      ".qm-apipk.bad,.qm-apipv.bad{border-color:#d92d20}",
      ".qm-apireqbox{flex:0 0 auto;display:inline-flex;align-items:center;gap:3px;",
      "font-size:11px;color:var(--app-text-secondary,#4e5969);cursor:pointer}",
      ".qm-apidel{flex:0 0 auto;width:24px;height:24px;border:none;background:none;",
      "color:var(--app-text-tertiary,#94a3b8);cursor:pointer;font-size:14px;",
      "border-radius:4px}",
      ".qm-apidel:hover{color:#d92d20;background:rgba(217,45,32,.08)}",
      ".qm-apiadd{align-self:flex-start;height:26px;padding:0 10px;font-size:12px;",
      "border-radius:5px;border:1px dashed var(--app-border-strong,#cbd5e1);",
      "background:transparent;color:var(--app-accent,#3b82f6);cursor:pointer}",
      ".qm-apiadd:hover{border-color:var(--app-accent,#3b82f6);",
      "background:rgba(59,130,246,.06)}",
      // 请求预览：等宽字体、浅底、可滚动，让用户直接对照对方 API 文档
      ".qm-apipreview{margin:6px 0 0;padding:8px 10px;border-radius:6px;",
      "background:var(--app-surface-subtle,rgba(127,127,127,.06));",
      "border:1px solid var(--app-border-subtle,rgba(127,127,127,.18));",
      "font-family:SF Mono,Monaco,Consolas,monospace;font-size:11px;",
      "line-height:1.55;white-space:pre-wrap;word-break:break-all;",
      "max-height:180px;overflow:auto;color:var(--app-text-secondary,#4e5969)}",
      ".qm-apipreviewlabel{font-size:11px;color:var(--app-text-tertiary,#94a3b8);",
      "margin-top:8px}",
      // 高级模式开关行
      ".qm-apiadvrow{display:flex;align-items:center;gap:8px;margin:8px 0 4px;",
      "font-size:12px}",
      ".qm-apibody{width:100%;min-height:96px;padding:8px 10px;font-size:12px;",
      "border-radius:6px;border:1px solid var(--app-border-strong,#cbd5e1);",
      "background:var(--app-surface-raised,#fff);color:inherit;",
      "font-family:SF Mono,Monaco,Consolas,monospace;resize:vertical}",
      ".qm-apibody.bad{border-color:#d92d20}",
      // 测试结果行
      ".qm-apitestres{font-size:11px;line-height:1.6;word-break:break-all}",
      ".qm-apitestres.ok{color:#389e0d}",
      ".qm-apitestres.err{color:#d92d20}"
    ].join(""), document.head.appendChild(e);
  } catch {
  }
}
function W(t) {
  try {
    const e = Ne();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let Un = "", Is = "";
function da(t, e) {
  t && (Is = t), e && (Un = e);
}
function F() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = Ne(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = Un), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function tn() {
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
  return Is;
}
globalThis.__qmSessionProbe = tn;
let rs = null;
function Ki() {
  if (rs) return;
  const t = typeof window < "u" && typeof window.setInterval == "function" ? window : typeof globalThis < "u" && typeof globalThis.setInterval == "function" ? globalThis : null;
  t && (rs = t.setInterval(() => {
    try {
      fetch(W("/heartbeat"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({ session_id: tn() || "" })
      }).catch(() => {
      });
    } catch {
    }
  }, 3e4));
}
Ki();
function jt() {
  try {
    const t = Ne(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return Un;
}
const Dr = {};
async function Ui(t, e, n) {
  if (typeof window > "u" || Dr[t]) return "skipped";
  try {
    const s = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(s) === "1")
      return Dr[t] = !0, "skipped";
    window.localStorage.setItem(s, "1");
  } catch {
  }
  Dr[t] = !0;
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
function le(t) {
  const e = Qt(t);
  return e && e.session_id ? e.session_id : tn();
}
const Wr = 180, Gi = 20, Os = 6e3, Ji = 60, Zi = 8;
function Qi() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const Vi = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function as(t) {
  try {
    return String(t || "").replace(Vi, "").length;
  } catch {
    return 0;
  }
}
function ss(t) {
  const e = Qi();
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
    r = as((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - as(n.textContent);
}
function Xi(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右上角 🔒 释放阻塞" : "⏳ 已提交，模型处理中";
}
function Yi(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function os(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: Os });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const el = "qm:v1:analysis:global", tl = "qm:v1:analysis:", nl = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Dt(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function rl(t) {
  if (!t || typeof t != "object") return { ...nl };
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
function al() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(tl) === 0 && n !== el && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function sl() {
  try {
    const t = await fetch(W("/question-modal/prefs"), { headers: F() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : rl(e.prefs);
  } catch {
    return null;
  }
}
async function pa() {
  try {
    const t = await fetch(W("/question-modal/templates"), { headers: F() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function Tn(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(W("/question-modal/survey-action"), {
      method: "POST",
      headers: F(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: Hn()
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
async function ol(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      W("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: F() }
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
function il(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, a = 0, s = null, o = 0, p = !1, i = 0, h = 0, b = null;
  const q = (g) => {
    n || b === g || (b = g, e.onStatus(g));
  }, m = () => {
    if (!n)
      try {
        const g = typeof AbortController < "u" ? new AbortController() : null, x = W("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, y = { headers: F() };
        g && (y.signal = g.signal), r = () => {
          try {
            g && g.abort();
          } catch {
          }
        }, fetch(x, y).then(async (z) => {
          const T = Ml(z);
          if (!z.ok || !z.body || T) {
            if (z.status === 404 || z.status === 501 || z.status === 405) {
              p = !0, q(!1);
              return;
            }
            throw T && (i += 1), new Error(T ? "blocked" : "HTTP " + z.status);
          }
          a = 0, i = 0, q(!0);
          const _ = z.body.getReader(), w = new TextDecoder();
          let P = "";
          const S = () => {
            _.read().then(({ done: L, value: E }) => {
              if (L) {
                k();
                return;
              }
              P += w.decode(E, { stream: !0 });
              let Z;
              for (; (Z = P.indexOf(`

`)) >= 0; ) {
                const te = P.slice(0, Z);
                P = P.slice(Z + 2), te.split(`
`).forEach((G) => {
                  if (!G.startsWith("data: ")) return;
                  let B = null;
                  try {
                    B = JSON.parse(G.slice(6));
                  } catch {
                    return;
                  }
                  B && (B.kind === "snapshot" ? (o = Math.max(o, parseInt(B.rev || 0, 10) || 0), e.onSnapshot(o, B.state || null)) : B.kind === "change" && (o = Math.max(o, parseInt(B.rev || 0, 10) || 0), e.onChange(B)));
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
    if (q(!1), i += 1, h || (h = Date.now()), i >= Fs) {
      if (Date.now() - (h || Date.now()) >= Ks) {
        p = !0, q(!1);
        return;
      }
      s = setTimeout(m, Hs);
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
async function Fr(t, e, n) {
  try {
    return (await fetch(W("/question-modal/session-prefs"), {
      method: "POST",
      headers: F(),
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
let $s = null;
async function Xt(t, e, n, r) {
  const a = t || "", s = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  try {
    const o = W(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(a) + s
    ), p = await fetch(o, { headers: F() });
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
    return $s = { chatId: a, at: Date.now(), data: h }, h;
  } catch {
    return null;
  }
}
function Ms() {
  $s = null;
}
async function Gn() {
  const t = await fetch(
    W("/question-modal/stale-surveys"),
    { headers: F() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Jn(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.blocking = t && t.blocking || [], e.residual = t && t.residual || [], e.rows = t && t.items || e.blocking.concat(e.residual), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function na(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function ua(t) {
  const e = await fetch(W("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: F(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function ll(t) {
  const e = await fetch(W("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: F(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function cl() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", O();
  const t = Date.now();
  try {
    const e = await Gn();
    Jn(e), c.stale.page = 0, c.stale.resPage = 0;
    const n = c.stale.rows.length, r = c.stale.blocking.length, a = c.stale.residual.length, s = c.stale.exceeded.length, o = c.stale.within.length, p = Date.now() - t;
    c.stale.msgKind = "ok";
    const i = na(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（正在阻塞 ${r} 条、异常残留 ${a} 条；已超阈值 ${s} 条、观察期内 ${o} 条；阈值 ${i}，耗时 ${p}ms）` : `扫描完成：没有挂起的问卷（阈值 ${i}，耗时 ${p}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.blocking = [], c.stale.residual = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, O();
  }
}
async function Hr(t, e = "释放") {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const n = await ua({ tool_call_ids: t }), r = Number(n && n.released) || 0, a = Number(n && n.already) || 0, s = Number(n && n.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `${e} ${r} 条，${s} 条未成功（见日志）` + (a ? `；${a} 条此前已处理` : "") : r > 0 ? `已${e} ${r} 条问卷` + (a ? `；${a} 条此前已处理` : "") : `无需${e}：${a || t.length} 条此前已处理`;
    const o = await Gn();
    Jn(o);
  } catch (n) {
    c.stale.msgKind = "error", c.stale.msg = e + "失败：" + (n && n.message ? n.message : String(n));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function dl() {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const t = await ua({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, a = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = a === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${a} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const s = await Gn();
    Jn(s);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function pl() {
  const t = (c.stale.residual || []).map((e) => String(e && e.tool_call_id)).filter(Boolean);
  if (!t.length) {
    c.stale.msgKind = "info", c.stale.msg = "当前没有可清理的残留问卷", O();
    return;
  }
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const e = await ua({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, a = Number(e && e.failed) || 0;
    c.stale.msgKind = a > 0 ? "warn" : "ok", c.stale.msg = a > 0 ? `清理 ${n} 条，${a} 条未成功（见日志）` : `已清理 ${n} 条残留` + (r ? `；${r} 条此前已收尾` : "");
    const s = await Gn();
    Jn(s), c.stale.resPage = 0;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "清理失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function ul(t) {
  c.stale.busy = !0, c.stale.msg = "", O();
  try {
    const e = await ll(t), n = e && e.results || [], r = n.filter((s) => s && s.stopped).length, a = n.filter((s) => s && !s.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (a ? `；${a} 个会话已不存在` : "") : `${a} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, O();
  }
}
async function Ps(t) {
  try {
    const e = await fetch(W("/question-modal/templates"), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Rs(t) {
  try {
    const e = await fetch(W("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: F()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function Ls() {
  try {
    const t = await fetch(W("/models"), { headers: F() });
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
function fl(t) {
  if (!t) return "";
  try {
    return String(J.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function U(t, e) {
  try {
    const n = Ze().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const ye = "__other__";
function Ce(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function St(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function Kr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((a) => {
    if (n && n.has(a) || !Object.prototype.hasOwnProperty.call(r, a)) return;
    const s = e[a];
    !s || typeof s != "object" || !St(r[a]) && St(s) && (r[a] = { ...s });
  }), r;
}
function is(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function ls(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((a) => Number(a && a.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function ml(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), a = Ce(e), s = Re(e), o = r(a), p = r(s);
  return n.some((i) => {
    const h = r(i);
    return h ? !!(i === a || i === s || h === o || h === p || Math.min(h.length, o.length, p.length) >= 4 && (h.length >= 4 && (o.includes(h) || h.includes(o)) || h.length >= 4 && (p.includes(h) || h.includes(p)))) : !1;
  });
}
function ce(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let Bs = !0;
function jn(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (Bs ? "第 " + (e + 1) + " 题" : "");
}
function Re(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function gl(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (s) => {
    s != null && s !== "" && n.add(String(s));
  }, a = t.options || [];
  if (ce(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const p = a.find((i) => Ce(i) === String(o));
      p && r(Re(p)), String(o) === ye && e.other && r(e.other);
    });
  else {
    r(e.value);
    const s = a.find((o) => Ce(o) === String(e.value));
    s && r(Re(s)), String(e.value) === ye && e.other && r(e.other);
  }
  return n;
}
function hl(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const a = String(r);
    if (a.startsWith("=")) return e.has(a.slice(1));
    if (e.has(a)) return !0;
    for (const s of Array.from(e))
      if (s && (s.indexOf(a) !== -1 || a.indexOf(s) !== -1)) return !0;
    return !1;
  });
}
function js(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const a = parseInt(n[1], 10);
    if (a >= 0 && a < e.length) return a;
  }
  return e.findIndex((a) => (a.title || "").trim() === t.trim());
}
function Ds(t, e, n) {
  const r = e[t], a = r && r.showIf;
  if (!a || typeof a != "object" || !Object.keys(a).length) return !0;
  for (const s of Object.keys(a)) {
    const o = js(s, e);
    if (o < 0) continue;
    const p = e[o];
    if (!p) continue;
    if (p.showIf && !Ds(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !hl(a[s], gl(p, i))) return !1;
  }
  return !0;
}
function He(t, e) {
  const n = [];
  return t.forEach((r, a) => {
    Ds(a, t, e) && n.push(a);
  }), n;
}
function bl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function zn(t) {
  return Array.isArray(t.questions);
}
function yl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function xl(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((a) => a && (a.text || a.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function kl(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function vl(t) {
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
function Wt(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const a = String(e.skipped_by || ""), s = String(e.skip_reason || "").trim();
    return (s ? `${a === "watchdog" ? "系统自动释放" : a === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${s}` : "已跳过本次问卷。") + `

` + Pn(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((a) => {
    const s = n[a];
    if (!s || typeof s != "object") return;
    const o = js(a, t), p = o >= 0 ? t[o] : null, i = p ? ce(p) === "single" ? "单选" : ce(p) === "multi" ? "多选" : "问答" : "问答", h = p ? jn(p, o) : a;
    let b = s.value;
    if (Array.isArray(b) && (b = b.join("、")), s.other && (b = (b ? b + "、" : "") + s.other), s.skipped) {
      const q = String(s.skipped_by || ""), m = q === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : q === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${a} [${i}] ${h}${m}`);
    } else
      r.push(`- ${a} [${i}] ${h}：${b === "" || b == null ? "（空）" : b}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function wl(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      W("/question-modal/resolve") + "?" + n.toString(),
      { headers: F() }
    );
    if (!r.ok) return { kind: "error" };
    const a = await r.json();
    return a && da(a.session_id, a.agent_id), a && a.found ? { kind: "found", data: a } : a && a.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Ft(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      W("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: F() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function ql(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = F();
    delete n["Content-Type"];
    const r = await fetch(
      W("/console/upload"),
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
const Dn = "qm:v1:stash_att:", cs = 25 * 1024 * 1024, $n = /* @__PURE__ */ new Map(), Mn = /* @__PURE__ */ new Map();
let Wn = null, Fn = 0, Ur = null;
function ds() {
  const t = Fn > 0;
  Mn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function Sl() {
  if (Ur) return Ur;
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
    const r = Wn;
    Wn = null, !(!r || !n.length) && await Ws(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return Ur = t, t;
}
function _l(t, e, n) {
  if (!t) {
    U("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  Wn = { callId: t, target: e, key: n };
  const r = Sl();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (Wn = null);
}
async function Ws(t, e, n, r) {
  Fn += 1, ds();
  const a = [], s = [];
  try {
    for (const p of t) {
      if (p.size && p.size > cs) {
        s.push(`${p.name}: 文件过大（上限 ${Math.round(cs / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await ql(p);
      i.ok ? a.push(i.att) : s.push(i.error);
    }
  } finally {
    Fn -= 1, ds();
  }
  const o = $n.get(e);
  if (a.length || s.length) {
    const p = n === "final" ? "final" : "q";
    if (!e) {
      U(
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
    else a.length && El(e, a, p, r);
  }
}
function El(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const a = localStorage.getItem(Dn + t), s = a ? JSON.parse(a) : [], o = (Array.isArray(s) ? s : []).concat(
        e.map((p) => ({ att: p, target: n, key: r }))
      );
      localStorage.setItem(Dn + t, JSON.stringify(o));
    } catch {
    }
}
function Cl(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(Dn + t);
    if (!e) return [];
    localStorage.removeItem(Dn + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function Nl(t) {
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
function Tl(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function Gr(t, e) {
  const n = e || le(t), r = Qt(t), a = r && r.request_id ? r.request_id : "";
  if (a)
    try {
      const s = await fetch(W("/question-modal/skip"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({ request_id: a, session_id: n || "" })
      });
      if (s.ok) {
        const o = await s.json().catch(() => ({}));
        return be(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (s.status === 404)
        return be(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const s = await fetch(
        W("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: F() }
      );
      if (s.ok) {
        const o = await s.json().catch(() => ({})), p = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return be(t), { ok: !0, released: p > 0, reason: p > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + s.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function ps(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      W("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: F() }
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
async function zl(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      W("/question-modal/pending") + e,
      { headers: F() }
    );
    if (!n.ok) return null;
    const r = await n.json(), a = r && r.items || [];
    if (!Array.isArray(a) || a.length !== 1) return null;
    const s = a[0];
    if (!s || !s.request_id) return null;
    const o = await fetch(
      W("/question-modal/resolve") + "?request_id=" + encodeURIComponent(s.request_id),
      { headers: F() }
    );
    if (!o.ok) return null;
    const p = await o.json();
    return p && da(p.session_id, p.agent_id), p && p.found ? p : null;
  } catch {
    return null;
  }
}
const Zn = "qm:v1:reqid:", Al = 3e4, Il = 45e3, Fs = 6, Hs = 6e4, Ks = 15 * 6e4, Ol = 700, $l = 8;
function Ml(t) {
  try {
    if (String((t.headers && t.headers.get ? t.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const n = Number(t.status || 0);
    return n === 429 || n === 403 || n === 407 || n === 451;
  } catch {
    return !1;
  }
}
function be(t) {
  if (t)
    try {
      localStorage.removeItem(Zn + t);
    } catch {
    }
}
function Pl() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(Zn) === 0 && t.push(s);
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
function Rl(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(Zn + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), Pl();
    } catch {
    }
}
function Qt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Zn + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (be(t), null) : n;
  } catch {
    return null;
  }
}
const fa = "qm:v1:state:";
function Gt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(fa + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function Hn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const Us = Hn(), us = "qm:v1:sessionprefs-ping";
function at(t, e) {
  if (t)
    try {
      const r = { ...Gt(t) || {}, ...e, ts: Date.now(), origin: Us };
      localStorage.setItem(fa + t, JSON.stringify(r)), Ll();
    } catch {
    }
}
function Ll() {
  try {
    const t = [];
    for (let a = 0; a < localStorage.length; a++) {
      const s = localStorage.key(a);
      s && s.indexOf(fa) === 0 && t.push(s);
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
async function Bl(t) {
  try {
    const e = await fetch(
      W("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: F() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && da(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function jl(t, e, n, r) {
  const a = ["【用户提交的问卷答案】"], s = new Set(He(t, e));
  return t.forEach((o, p) => {
    if (!s.has(p)) return;
    const i = e[`q${p}`];
    if (!i) return;
    let h = i.value;
    if (Array.isArray(h))
      h = h.filter((x) => x !== ye).map((x) => {
        const y = (o.options || []).find((I) => Ce(I) === String(x));
        return y ? Re(y) : x;
      }).join("、");
    else {
      const x = (o.options || []).find((y) => Ce(y) === String(h));
      x && (h = Re(x)), String(i.value) === ye && (h = "");
    }
    const b = ce(o) === "single" ? "单选" : ce(o) === "multi" ? "多选" : "问答", q = !!String(h || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), m = String(i.skipped_by || ""), k = i.skipped ? m === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : m === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : q ? h : "（未作答）";
    let g = `- q${p} [${b}] ${k}`;
    i.other && !i.skipped && (g += `（其他：${i.other}）`), i.attachments && i.attachments.length && (g += `（附件：${i.attachments.map((x) => x.file_name).join("、")}）`), a.push(g);
  }), n && a.push(`- 其他意见：${n}`), r && r.length && a.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), a.join(`
`);
}
function Dl(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const a = r.value;
    if (Array.isArray(a) ? a.length === 1 && a[0] === ye : String(a ?? "") === ye) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const Wl = ["必须", "务必", "不得为空", "不能为空"], Fl = ["可为空", "可留空", "选填", "可选", "非必填"];
function Gs(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Wl.some((n) => e.indexOf(n) !== -1) ? !1 : Fl.some((n) => e.indexOf(n) !== -1);
}
function Hl(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = He(t, n);
  } catch {
    return n;
  }
  return r.forEach((a) => {
    const s = t[a];
    if (!Gs(s)) return;
    const o = `q${a}`, p = n[o];
    if (p && (p.skipped === !0 || St(p))) return;
    const i = ce(s);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function Pn(t) {
  return t.map((e, n) => {
    const r = ce(e) === "single" ? "单选" : ce(e) === "multi" ? "多选" : "问答", a = (e.options || []).map(Re).join("、");
    return `${n + 1}. [${r}] ${jn(e, n)}${a ? "（" + a + "）" : ""}`;
  }).join(`
`);
}
function Jr(t) {
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
      }, b.file_name + (b.size ? "（" + Tl(b.size) + "）" : "")),
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
function Kl(t) {
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
  } = t, q = Ze().Popover, m = [];
  n.forEach((S) => {
    [...S.models || [], ...S.extra_models || []].forEach((L) => {
      m.push({
        providerId: S.id,
        providerName: S.name || S.id,
        modelId: L.id,
        modelName: L.name || L.id,
        free: !!L.is_free
      });
    });
  });
  const k = m.find((S) => `${S.providerId}:${S.modelId}` === r), x = k ? k.modelName : r || "选择模型", y = k ? k.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", I = {
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
  }, z = m.filter((S) => S.free).length, T = m.length - z, _ = [];
  n.forEach((S) => {
    const L = [...S.models || [], ...S.extra_models || []].map((E) => ({
      providerId: S.id,
      providerName: S.name || S.id,
      modelId: E.id,
      modelName: E.name || E.id,
      free: !!E.is_free
    })).filter((E) => i === "free" ? E.free : !E.free);
    L.length && _.push({ id: S.id, name: S.name || S.id, models: L });
  });
  const w = (S, L) => e.createElement("button", {
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
  }, L), P = e.createElement(
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
      w("paid", "付费 🟡 " + T),
      w("free", "免费 🟢 " + z)
    ),
    _.length ? e.createElement("div", null, _.map((S, L) => (
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
        S.models.map((E) => {
          const Z = `${E.providerId}:${E.modelId}` === r;
          return e.createElement(
            "div",
            {
              key: `${E.providerId}:${E.modelId}`,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                paddingLeft: 18,
                cursor: "pointer",
                borderLeft: "3px solid " + (Z ? "var(--app-accent, #1677ff)" : "transparent"),
                borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
                background: Z ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
              },
              onClick: () => {
                a(`${E.providerId}:${E.modelId}`), p(!1);
              }
            },
            e.createElement("span", {
              style: {
                width: 6,
                height: 6,
                borderRadius: 3,
                flexShrink: 0,
                background: L % 2 === 0 ? "var(--app-link, #1677ff)" : "var(--app-warning-text, #fa8c16)"
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
            }, E.modelName)
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
    content: P,
    trigger: "click",
    open: o,
    onOpenChange: p,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: I,
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
      style: I,
      disabled: s,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const S = m.find((L) => `${L.providerId}:${L.modelId}` !== r);
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
function Ul(t) {
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
    const I = n === y;
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
          background: I ? "var(--app-accent-bg, rgba(255,127,22,0.08))" : "transparent",
          color: I ? "var(--app-accent-text, var(--app-accent, #ff7f16))" : "var(--app-text-secondary, inherit)",
          fontWeight: I ? 600 : 400
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
        I ? e.createElement("span", {
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
function Gl(t) {
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
function Jl(t) {
  const { R: e, open: n, templates: r, value: a, edit: s, onEditChange: o, onClose: p, onSelect: i, onSave: h, onDelete: b } = t;
  if (!n) return null;
  const q = Ze(), { Input: m, Modal: k } = q, g = {
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
  }, y = !!s, I = (T, _, w, P) => m && m.TextArea ? e.createElement(m.TextArea, {
    value: T,
    rows: w,
    placeholder: P,
    onChange: (S) => _(S && S.target ? S.target.value : "")
  }) : e.createElement("textarea", {
    value: T,
    rows: w,
    placeholder: P,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (S) => _(S && S.target ? S.target.value : ""),
    onChange: (S) => _(S && S.target ? S.target.value : "")
  }), z = e.createElement(
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
      I(s.name || "", (T) => o({ ...s, name: T }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      I(s.system || "", (T) => o({ ...s, system: T }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      I(s.user || "", (T) => o({ ...s, user: T }), 6, "用户提示词模板"),
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
        (T) => e.createElement(
          "div",
          {
            key: T.id,
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
            T.name + (T.builtin ? "（内置）" : "") + (T.id === a ? " · 使用中" : "")
          ),
          e.createElement("button", {
            type: "button",
            style: x,
            title: "设为本题使用",
            onClick: () => i(T.id)
          }, "选用"),
          e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => o({
              id: T.id,
              name: T.name,
              system: T.system,
              user: T.user
            })
          }, "编辑"),
          T.builtin ? null : e.createElement("button", {
            type: "button",
            style: x,
            onClick: () => b(T.id)
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
  }, z) : z;
}
function Zl(t) {
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
  } = t, I = Ze().Popover, z = e.createElement("button", {
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
  if (!I)
    return e.createElement(
      "div",
      null,
      z,
      r && m ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((E) => E.reasoning).join(`

`))) : null
    );
  const T = !!(r && (r.per_question || []).length), _ = (E, Z, te) => e.createElement("button", {
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
    onClick: Z
  }, E), w = e.createElement(
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
        T && !n ? e.createElement("button", {
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
        T && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: T ? 6 : "auto",
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
      (r.per_question || []).map((E) => e.createElement(
        "div",
        { key: E.index, style: { marginBottom: 14 } },
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
          }, E.title),
          E.choice ? e.createElement("span", {
            style: {
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            }
          }, "→ " + E.choice) : null,
          typeof E.confidence == "number" ? e.createElement("span", {
            style: { fontSize: 11, color: "var(--app-text-tertiary, inherit)" }
          }, `置信度 ${Math.round(E.confidence <= 1 ? E.confidence * 100 : E.confidence)}%`) : null
        ),
        e.createElement("div", {
          className: "qm-md",
          "data-qm-md": "true",
          style: { marginTop: 4 },
          dangerouslySetInnerHTML: { __html: fl(E.reasoning || "") }
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
      _("开始分析", () => {
        try {
          o();
        } catch {
        }
      })
    )
  ), P = e.createElement("div", {
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
        width: "min(460px, 90%)",
        maxWidth: "100%",
        // 高度：自适应且不得溢出视口。气泡 top:30 是相对 qm-actions 定位的，
        // 手机上 qm-actions 换行后自身已偏离视口顶（实测气泡起点 71px），
        // 所以余量不能按「视口顶 + 30」这种假设来算——直接给足安全边界。
        maxHeight: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
        padding: 12,
        background: "var(--app-surface-raised, #fff)",
        border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
      },
      onMouseDown: (E) => {
        E && E.stopPropagation && E.stopPropagation();
      },
      onClick: (E) => {
        E && E.stopPropagation && E.stopPropagation();
      },
      onKeyDown: (E) => {
        E && E.stopPropagation && E.stopPropagation();
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
    P
  );
  return [z, m ? S : null];
}
function Ql(t) {
  const e = Ne().React, n = Ze(), { Input: r, Button: a } = n, s = r.TextArea, o = t.data || {}, p = bl(o), i = yl(o), h = xl(o), b = kl(h), q = b ? "" : h, m = p.questions || [], k = p.title || "问卷", g = Gt(i), [x, y] = e.useState(
    () => !!(g && g.answered) || !!q || b
  ), [I, z] = e.useState(""), [T, _] = e.useState(() => {
    const l = Qt(i);
    return l && l.request_id ? l.request_id : g && typeof g.reqId == "string" ? g.reqId : "";
  }), [w, P] = e.useState(
    () => g && typeof g.visStep == "number" && g.visStep >= 0 ? g.visStep : 0
  ), [S, L] = e.useState(
    () => g && typeof g.slowAt == "number" ? g.slowAt : 0
  ), [E, Z] = e.useState(
    () => g && typeof g.slowStep == "number" ? g.slowStep : -1
  ), [te, G] = e.useState(
    () => !!(g && g.slowFired === !0)
  ), [B, Q] = e.useState(() => {
    const l = {};
    m.forEach((f, u) => {
      l[`q${u}`] = { type: ce(f), value: ce(f) === "multi" ? [] : "", other: "" };
    });
    const d = g && g.answers;
    return d && typeof d == "object" && Object.keys(d).forEach((f) => {
      l[f] && (l[f] = { ...l[f], ...d[f] });
    }), l;
  }), [ze, dt] = e.useState(
    () => g && typeof g.finalOther == "string" ? g.finalOther : ""
  ), [K, xe] = e.useState(!1), [M, A] = e.useState(
    () => g && typeof g.releasedNote == "string" ? g.releasedNote : ""
  ), [R, j] = e.useState(
    () => g && typeof g.localResult == "string" ? g.localResult : ""
  ), [H, X] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(g && g.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(q || "")
  ), [ne, Ae] = e.useState(
    () => (g && typeof g.skipReason == "string" ? g.skipReason : "") || vl(q || "")
  ), [de, ke] = e.useState(
    () => g && Array.isArray(g.finalOtherAtt) ? g.finalOtherAtt : []
  ), [fe, Le] = e.useState(
    () => !!(g && g.expanded)
  ), [Ke, pt] = e.useState(!1), _t = e.useRef(0), [qe, to] = e.useState(
    () => g && typeof g.deadReason == "string" ? g.deadReason : ""
  ), [Qe, Et] = e.useState(
    () => g && typeof g.gateBlocked == "string" ? g.gateBlocked : ""
  ), [ut, Qn] = e.useState(
    () => g && typeof g.submittedAt == "number" ? g.submittedAt : 0
  ), [Vn, Xn] = e.useState(
    () => !!(g && g.pastSoft === !0)
  ), [Ct, nn] = e.useState(
    () => !!(g && g.waitRetired === !0)
  ), Nt = e.useRef(
    !!(g && typeof g.submittedAt == "number" && g.submittedAt > 0 && Date.now() - g.submittedAt < Wr * 1e3)
  ), Ve = e.useRef(!1), rn = e.useRef(!!(g && g.pastSoft === !0)), [Yn, no] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), ro = e.useRef(Yn), ha = (l) => {
    ro.current = l, no(l);
  }, me = (l, d) => {
    const f = Yn[l];
    return f ?? d;
  };
  Bs = !!me("fallback_title", !0);
  const ba = Math.max(30, Number(me("wait_hint_sec", Wr)) || Wr), ao = "manual", [ae, an] = e.useState(ao), [ya, er] = e.useState(""), [Ec, so] = e.useState(!1), [tr, nr] = e.useState(!1), [rr, ar] = e.useState(!1), [oo, io] = e.useState([]), [xa, sr] = e.useState(!1), [sn, ft] = e.useState(null), [lo, Xe] = e.useState(""), [Tt, or] = e.useState(!1), ir = e.useRef(null), lr = e.useRef(null), ka = e.useRef(0);
  e.useEffect(() => {
    Tt && (ka.current = Date.now());
  }, [Tt]), e.useEffect(() => {
    if (!Tt) return;
    const l = (f) => {
      if (Date.now() - ka.current < 350) return;
      const u = f && f.target;
      ir.current && u && ir.current.contains(u) || lr.current && u && lr.current.contains(u) || or(!1);
    }, d = (f) => {
      f && f.key === "Escape" && or(!1);
    };
    return document.addEventListener("mousedown", l), document.addEventListener("keydown", d), () => {
      document.removeEventListener("mousedown", l), document.removeEventListener("keydown", d);
    };
  }, [Tt]);
  const [on, Ie] = e.useState(!1), [ln, mt] = e.useState(!1), gt = e.useRef(null), cr = e.useRef(null), dr = e.useRef(null);
  e.useEffect(() => {
    if (!on && !ln) return;
    const l = (d) => {
      const f = d && d.target;
      gt.current && f && gt.current.contains(f) || cr.current && f && cr.current.contains(f) || (Ie(!1), mt(!1));
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [on, ln]);
  const [pr, ht] = e.useState(!1), ur = e.useRef(null), fr = e.useRef(null);
  e.useEffect(() => {
    if (!pr) return;
    const l = (d) => {
      const f = d && d.target;
      ur.current && f && ur.current.contains(f) || fr.current && f && fr.current.contains(f) || ht(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [pr]);
  const [co, po] = e.useState(!1), [uo, fo] = e.useState("paid"), Ue = e.useRef({}), Be = e.useRef({}), bt = e.useRef(0), zt = e.useRef(null), [mo, yt] = e.useState(0), [mr, gr] = e.useState([]), [Ge, cn] = e.useState(""), je = e.useRef(Ge);
  je.current = Ge;
  const [hr, Je] = e.useState(!1), [go, va] = e.useState(!1), [ho, br] = e.useState(null);
  e.useEffect(() => {
    if (!hr) return;
    const l = (d) => {
      const f = d && d.target;
      gt.current && f && gt.current.contains(f) || dr.current && f && dr.current.contains(f) || Je(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [hr]);
  const [yr, De] = e.useState(!1);
  e.useEffect(() => {
    if (!yr) return;
    const l = (d) => {
      const f = gt.current;
      f && d && d.target && f.contains(d.target) || De(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [yr]);
  const [xr, We] = e.useState(!1), dn = e.useRef(null), wa = e.useRef(null);
  e.useEffect(() => {
    if (!xr) return;
    const l = (d) => {
      const f = wa.current;
      if (f && d && d.target && f.contains(d.target)) return;
      const u = d && d.target;
      u && u.closest && u.closest("[data-qm-release-lock]") || We(!1);
    };
    return document.addEventListener("mousedown", l), () => document.removeEventListener("mousedown", l);
  }, [xr]);
  const [Oe, qa] = e.useState(
    () => !!(g && g.autoPaused)
  ), bo = e.useRef(Oe);
  bo.current = Oe;
  const xt = e.useRef(!1), kr = e.useRef(0), pn = e.useRef({}), [yo, xo] = e.useState(0), At = e.useRef(/* @__PURE__ */ new Set()), It = (l) => {
    l && At.current.add(l);
  }, un = e.useRef({}), [ko, fn] = e.useState(0), Ye = e.useRef({}), [Ot, vo] = e.useState(!1), wo = e.useRef(!1);
  wo.current = Ot, e.useRef(!1);
  const qo = async () => {
    try {
      const l = await Xt(
        "",
        !0,
        le(i),
        jt()
      );
      if (!l || !l.config) return;
      const d = l.config;
      ha(d), d.mode !== void 0 && an(Dt(d.mode)), typeof d.model_id == "string" && d.model_id && er(d.model_id), typeof d.with_context == "boolean" && nr(d.with_context), typeof d.parallel == "boolean" && ar(d.parallel), yt((f) => f + 1);
    } catch {
    }
  }, Sa = e.useRef(!1), mn = (l) => {
    if (l.mode !== void 0) {
      an(l.mode), Fr(
        { mode: l.mode },
        le(i),
        jt()
      );
      try {
        localStorage.setItem(us, Us + ":" + Date.now());
      } catch {
      }
    }
    const d = {};
    l.modelId !== void 0 && (d.model_id = l.modelId), l.withContext !== void 0 && (d.with_context = l.withContext), l.parallel !== void 0 && (d.parallel = l.parallel), Object.keys(d).length && (l.modelId !== void 0 && er(l.modelId), l.withContext !== void 0 && nr(l.withContext), l.parallel !== void 0 && ar(l.parallel), Fr(d, le(i), jt()));
  }, _a = (l) => {
    !l || l === Ge || (cn(l), je.current = l, at(i, { templateId: l }), Fr(
      { template_id: l },
      le(i),
      jt()
    ), ft(null), Ue.current = {}, Be.current = {}, yt((d) => d + 1));
  }, So = async (l) => {
    const d = await Ps({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!d.ok) {
      U("error", d.error || "保存失败");
      return;
    }
    gr(d.items || []), br(null), U("success", "模板已保存");
  }, _o = async (l) => {
    const d = await Rs(l);
    if (!d.ok) {
      U("warning", d.error || "删除失败");
      return;
    }
    gr(d.items || []);
    const f = (d.items || []).map((u) => u.id);
    if (f.indexOf(je.current) === -1) {
      const u = f[0] || "";
      cn(u), je.current = u, at(i, { templateId: u });
    }
    U("success", "模板已删除");
  };
  e.useEffect(() => {
    if (x) return;
    const l = (d) => {
      try {
        String(d && d.key || "") === us && qo();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [x, i]), e.useEffect(() => {
    if (x) return;
    let l = !0;
    return al(), (async () => {
      const [d, f, u, v] = await Promise.all([
        Ls(),
        sl(),
        pa(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Xt(
          "",
          !0,
          le(i),
          jt()
        )
      ]);
      if (!l) return;
      if (io(d), gr(u.items), v && v.config) {
        const C = v.config;
        ha(C), C.mode !== void 0 && an(Dt(C.mode)), typeof C.model_id == "string" && C.model_id && er(C.model_id), typeof C.with_context == "boolean" && nr(C.with_context), typeof C.parallel == "boolean" && ar(C.parallel), typeof C.template_id == "string" && C.template_id && (cn(C.template_id), je.current = C.template_id);
      }
      const N = u.items.map((C) => C.id);
      if (!je.current || N.indexOf(je.current) === -1) {
        const C = u.defaultId || N[0] || "";
        C && (cn(C), je.current = C);
      }
      if (v && v.config) {
        const C = v.config;
        so(C.__follow_active__ === !0);
      }
      Sa.current = !0, yt((C) => C + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    bt.current = w;
  }, [w]);
  const vr = async (l) => {
    if (xa) return;
    const d = w;
    sr(!0), Xe("");
    const f = typeof AbortController < "u" ? new AbortController() : null;
    zt.current = f;
    try {
      const u = await fetch(W("/question-modal/analyze"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({
          request_id: T,
          tool_call_id: i,
          session_id: le(i),
          title: k,
          questions: m,
          model_id: ya,
          mode: l,
          with_context: tr,
          parallel: rr,
          question_index: d,
          answers: B,
          template_id: je.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(me("model_timeout_sec", 120)) || 120
        }),
        signal: f ? f.signal : void 0
      }), v = await u.json().catch(() => ({})), N = v && v.analysis || null, C = N && N.error || v && v.error || "";
      v && v.cancelled || N && N.cancelled ? Xe("已终止分析。") : !u.ok || !v || v.ok === !1 || N && N.ok === !1 ? Xe(C || "分析失败（服务返回 " + u.status + "）") : N && (Ue.current[d] = N, Be.current[d] = !0, bt.current === d && ft(N), U("success", "第 " + (d + 1) + " 题 AI 分析完成"));
    } catch (u) {
      zt.current === f && f && f.signal.aborted || u && u.name === "AbortError" ? Xe("已终止分析。") : Xe("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      zt.current === f && (zt.current = null), sr(!1), Ye.current[d] = !0, fn((u) => u + 1);
    }
  }, Eo = () => {
    const l = w;
    delete Ue.current[l], ft(null), Xe(""), vr("manual");
  }, kt = (l) => {
    var f;
    const d = l !== void 0 ? l : bt.current;
    try {
      fetch(W("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: F(),
        body: JSON.stringify({
          tool_call_id: i,
          request_id: T,
          question_index: d
        })
      }).catch(() => {
      });
    } catch {
    }
    try {
      Tn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (f = zt.current) == null || f.abort();
    } catch {
    }
    sr(!1);
  }, Co = () => {
    kt(), Xe("已终止分析。");
  }, No = () => {
    Oe ? (un.current = {}, Ye.current = {}, Be.current = {}, xt.current = !1, qa(!1), yt((l) => l + 1), U("info", "已恢复自动答题")) : (kt(), qa(!0), U("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (x) return;
    const l = Ue.current[w];
    ft(l || null);
    const d = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + w;
    let f = !0;
    return fetch(W("/question-modal/analysis") + d, { headers: F() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !f || !u || !u.found || !u.analysis || (Ue.current[w] = u.analysis, bt.current === w && ft(u.analysis));
    }).catch(() => {
    }), () => {
      f = !1;
    };
  }, [i, w]), e.useEffect(() => {
    x || Sa.current && ae === "ai" && Ot && (!zn(p) || !m.length || Be.current[w] || K || (Be.current[w] = !0, vr("auto")));
  }, [
    x,
    ae,
    i,
    mo,
    tr,
    rr,
    m,
    w,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    Ot
  ]);
  const To = () => {
    const l = sn && sn.per_question || [];
    if (!l.length) return;
    if (!l.some((f) => f.type === "multi" ? String(f.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(f.choice || "").trim().length > 0)) {
      U("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    Q((f) => {
      const u = { ...f };
      return l.forEach((v) => {
        const N = `q${v.index}`;
        It(N);
        const C = u[N] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const oe = String(v.choice || "").split(/[、,，]/).map((re) => re.trim()).filter(Boolean);
          u[N] = { ...C, value: oe };
        } else
          u[N] = { ...C, value: v.choice || C.value };
      }), u;
    }), U("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, et = (l, d, f = !1) => {
    kt(), to(l), X(!0), j(d), pt(!1), y(!0), be(i), f && at(i, { backendReleased: !0 });
  }, zo = async (l, d) => {
    const f = await Gr(i, le(i));
    return f.ok ? (et(l, d, f.released), !0) : (pt(!0), qr(!1), !1);
  };
  e.useEffect(() => {
    var d;
    const l = (d = Gt(i)) == null ? void 0 : d.answers;
    at(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: T,
      visStep: w,
      answers: Kr(B, l, At.current),
      finalOther: ze,
      finalOtherAtt: de,
      answered: x,
      skippedAll: H,
      expanded: fe,
      localResult: R,
      submittedAt: ut,
      skipReason: ne,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Vn,
      waitRetired: Ct,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: S,
      slowStep: E,
      slowFired: te,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: qe,
      gateBlocked: Qe,
      releasedNote: M,
      autoPaused: Oe,
      templateId: Ge
    });
  }, [
    i,
    T,
    w,
    B,
    ze,
    de,
    x,
    H,
    fe,
    R,
    ut,
    ne,
    Vn,
    Ct,
    S,
    E,
    te,
    qe,
    Oe,
    Ge,
    Qe,
    M
  ]), e.useEffect(() => {
    if (!x || !ut || Ct || !Nt.current) return;
    let l = 0, d = !1, f = ss(i);
    const u = () => {
      if (d) return;
      const v = Math.floor((Date.now() - ut) / 1e3);
      if (v >= ba) {
        Ve.current = !0, nn(!0);
        return;
      }
      if (!Ve.current) {
        const N = ss(i);
        N >= 0 && (f < 0 ? f = N : N - f >= Zi && (Ve.current = !0));
      }
      if (!Ve.current && v >= Gi && !rn.current && (rn.current = !0, Xn(!0)), Ve.current) {
        l = setTimeout(
          () => {
            d || nn(!0);
          },
          Math.max(1e3, (ba - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        d || os(u);
      }, Os);
    };
    return os(u), () => {
      d = !0, clearTimeout(l);
    };
  }, [x, ut, Ct]);
  const [wr, qr] = e.useState(!1), [Sr, Ea] = e.useState(""), Ca = (l, d, f) => {
    l.length && (d === "final" ? ke((u) => u.concat(l)) : Q((u) => {
      const v = f || `q${w}`;
      It(v);
      const N = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...N, attachments: (N.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, N, C) => {
      Ca(u, v, N), C && C.length ? Ea(C.join("；")) : Ea("");
    }, d = (u) => qr(u);
    $n.set(i, l), Mn.set(i, d);
    const f = Cl(i);
    return f.length && f.forEach((u) => Ca([u.att], u.target, u.key)), qr(Fn > 0), () => {
      $n.get(i) === l && $n.delete(i), Mn.get(i) === d && Mn.delete(i);
    };
  }, [i, w]);
  const _r = (l, d) => _l(i, l, d), Er = (l, d, f) => {
    const u = Nl(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      Ws(u, i, d, f);
    }
  };
  e.useEffect(() => {
    if (!b || I) return;
    let l = !0;
    return Ft(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && X(!0);
      const f = String(d.skip_reason || "").trim();
      f && Ae((u) => u || f), z(Wt(m, d));
    }), () => {
      l = !1;
    };
  }, [b, i, I]), e.useEffect(() => {
    if (x || !i || q) return;
    let l = !0;
    return Ft(i).then((d) => {
      if (!l || !d) return;
      d.kind === "skipped" && !d.answers && X(!0);
      const f = String(d.skip_reason || "").trim();
      f && Ae((u) => u || f), z((u) => u || Wt(m, d)), j(Wt(m, d)), y(!0), be(i);
    }), () => {
      l = !1;
    };
  }, [i, x, q]), e.useEffect(() => {
    if (x) return;
    let l = !0, d = 0, f = 0, u = 0, v = !1, N = !1, C = 0, oe = 0;
    _t.current || (_t.current = Date.now());
    let re = !!Qt(i), _e = !1;
    const ve = (D) => {
      !l || !D || !D.request_id || (re = !0, f = 0, u = 0, v = !1, _(D.request_id), pt(!1), C && (clearTimeout(C), C = 0), Rl(
        i,
        D.request_id,
        D.session_id || tn(),
        D.agent_id
      ));
    }, pe = (D) => {
      l && (C && (clearTimeout(C), C = 0), oe && (clearTimeout(oe), oe = 0), zo(
        D,
        D === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, Rt = Qt(i), rt = async () => {
      if (!Rt) return !1;
      const D = await Bl(Rt.request_id);
      if (!l) return !0;
      if (D.kind === "found") {
        const ge = D.data;
        return ge.tool_call_id && i && ge.tool_call_id !== i ? (be(i), !1) : (ve(ge), !0);
      }
      return D.kind === "orphan" ? (pe("orphan"), !0) : (D.kind === "absent" && be(i), !1);
    }, Ee = (D = !1) => {
      if (l) {
        if (d += 1, D || (f += 1, u || (u = Date.now())), D) {
          if (!_e) {
            _e = !0, Ft(i).then((ue) => {
              if (l) {
                if (ue) {
                  ue.kind === "skipped" && !ue.answers && X(!0);
                  const Lt = String(ue.skip_reason || "").trim();
                  Lt && Ae((Lr) => Lr || Lt), z(Wt(m, ue)), j(Wt(m, ue)), y(!0), be(i);
                  return;
                }
                Ee(!0);
              }
            });
            return;
          }
          if (re) {
            pe("gone");
            return;
          }
          const ge = Date.now() - (_t.current || Date.now());
          if (d >= 12 && ge >= Il) {
            pe("gone");
            return;
          }
        }
        if (f >= Fs) {
          if (Date.now() - (u || Date.now()) >= Ks) {
            if (v = !0, !N) {
              N = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, f = 0, u = 0, d = 0, ie();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          C = setTimeout(ie, Hs);
          return;
        }
        C = setTimeout(ie, d < $l ? Ol : 5e3);
      }
    }, Te = () => {
      wl(i, le(i)).then((D) => {
        if (l) {
          if (D.kind === "found") {
            ve(D.data);
            return;
          }
          if (D.kind === "orphan") {
            pe("orphan");
            return;
          }
          if (D.kind === "error") {
            Ee(!1);
            return;
          }
          zl(le(i)).then((ge) => {
            if (l) {
              if (ge) {
                if (ge.tool_call_id && i && ge.tool_call_id !== i) {
                  Ft(i).then((ue) => {
                    if (l) {
                      if (ue) {
                        y(!0), be(i);
                        return;
                      }
                      Ee(!0);
                    }
                  });
                  return;
                }
                ve(ge);
                return;
              }
              Ft(i).then((ue) => {
                if (l) {
                  if (ue) {
                    ue.kind === "skipped" && !ue.answers && X(!0);
                    const Lt = String(ue.skip_reason || "").trim();
                    Lt && Ae((Lr) => Lr || Lt), y(!0), be(i);
                    return;
                  }
                  Ee(!0);
                }
              });
            }
          });
        }
      });
    }, ie = () => {
      if (l) {
        if (!Rt) {
          Te();
          return;
        }
        rt().then((D) => {
          !l || D || Te();
        });
      }
    };
    return oe = setTimeout(() => {
      l && pt(!0);
    }, Al), ie(), () => {
      l = !1, C && clearTimeout(C), oe && clearTimeout(oe);
    };
  }, [x, i]);
  const Na = async () => {
    xe(!0);
    try {
      const l = le(i);
      let d = await Gr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ps(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok)
        throw new Error(
          d.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + d.reason + "）"
        );
      if (d.released) {
        const u = d.reason === "host-stop";
        et(
          d.reason === "orphan" ? "orphan" : "",
          d.reason === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : u ? `本次问卷已释放：已直接终止本次运行，会话可继续对话。
（插件端记录已不可达，例如插件刚重载过；本次回答未回传给模型。）` : "用户跳过了本次问卷。",
          !0
        ), U(
          "info",
          u ? "已释放本次问卷（已终止本次运行）" : "已释放本次问卷，会话可继续"
        );
      } else
        et(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
    } catch (l) {
      U("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      xe(!1);
    }
  }, Ta = async () => {
    xe(!0);
    try {
      const l = le(i);
      let d = await Gr(i, l);
      if ((!d.released || d.reason === "orphan") && d.reason !== "network" && l) {
        const u = await ps(l);
        u.ok && u.released ? d = u : u.ok && !d.ok && (d = { ok: !0, released: !1, reason: "gone" });
      }
      if (!d.ok) {
        A(d.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + d.reason + "）。"), U("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (d.released) {
        const u = d.reason === "host-stop";
        A(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), U("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        A("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), U("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      U("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      xe(!1);
    }
  }, Ao = e.createElement(
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
  ), gn = (l, d) => e.createElement("button", {
    type: "button",
    key: d,
    className: "qm-release-lock",
    "data-qm-release-lock": "true",
    title: "释放阻塞（若发新消息报 A task is already running，点此释放）",
    "aria-label": "释放阻塞",
    disabled: K,
    // US-010: 二次确认——点击不再直接执行，先弹确认气泡；确定后由
    // releaseConfirmPanel 执行原 onClick（rescue / releaseBlocked 零改动）。
    // 打开时同步收起全部 header 弹层（互斥组）。
    onClick: () => {
      dn.current = l, Ie(!1), mt(!1), ht(!1), Je(!1), De(!1), We(!0);
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
      cursor: K ? "default" : "pointer",
      border: "1px solid var(--app-warning-border, rgba(250,173,20,0.45))",
      background: "transparent",
      color: "var(--app-warning-text, #d46b08)"
    }
  }, Ao), Io = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认释放阻塞",
      ref: wa,
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
          We(!1), dn.current = null;
        }
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: K,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: K ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: K ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          const l = dn.current;
          We(!1), dn.current = null, l && l();
        }
      }, "确定")
    )
  ), hn = xr ? Io : null, bn = He(m, B), tt = bn.length, $e = w >= tt, se = $e ? -1 : bn[w], $t = $e ? tt : w;
  e.useEffect(() => {
    if (Dt(me("mode", "manual")) !== "manual") return;
    let d = String(me("notify_channel_pc", "") || "");
    if (!d) {
      const u = String(me("notify_channel", "off") || "off"), v = !!me("notify_manual_mode", !1);
      d = u === "browser" || (u === "off" || !u) && v ? "browser" : u;
    }
    if (d !== "browser" || x || H || qe || !zn(p) || !m.length) return;
    const f = He(m, B).filter((u) => !St(B[`q${u}`])).length;
    Ui(i, k, f);
  }, [Yn, x, H, qe, $t]);
  const yn = Math.max(0, Number(me("slow_question_sec", Ji)) || 0) * 1e3, Oo = Math.round(yn / 1e3);
  e.useEffect(() => {
    if (x || H || qe || yn <= 0) return;
    if (E !== $t) {
      Z($t), L(Date.now()), G(!1);
      return;
    }
    if (!S) {
      L(Date.now());
      return;
    }
    if (te) return;
    const l = S + yn - Date.now();
    if (l <= 0) {
      G(!0);
      return;
    }
    let d = !1;
    const f = setTimeout(() => {
      d || G(!0);
    }, l);
    return () => {
      d = !0, clearTimeout(f);
    };
  }, [x, H, qe, $t, E, S, te, yn]);
  const Se = se >= 0 ? m[se] : null, vt = `q${se}`, ee = se >= 0 && B[vt] || { type: ce(Se), value: ce(Se) === "multi" ? [] : "", other: "" }, wt = (l) => {
    var u;
    Qe && Et(""), se >= 0 && It(`q${se}`);
    const d = { ...B, [vt]: { ...l, skipped: !1 } }, f = He(m, d);
    m.forEach((v, N) => {
      f.indexOf(N) === -1 && delete d[`q${N}`];
    }), at(i, {
      answers: Kr(d, (u = Gt(i)) == null ? void 0 : u.answers, At.current)
    }), Q(d);
  };
  e.useEffect(() => {
    w > tt && P(tt);
  }, [tt, w]);
  const Cr = async (l, d) => {
    const f = await fetch(W(l), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(d)
    }), u = await f.json().catch(() => ({}));
    if (!f.ok) {
      const v = new Error(u && u.detail || "HTTP " + f.status);
      throw v.status = f.status, v;
    }
    return u;
  }, Nr = () => {
    var l;
    return Dl(Kr(
      Hl(m, B),
      (l = Gt(i)) == null ? void 0 : l.answers,
      At.current
    ));
  }, $o = () => !!me("gate_unsaved", !0), Mo = (l) => Gs(l), za = (l, d) => {
    if (!$o()) return [];
    const f = new Set(He(m, l)), u = (N) => f.has(N) && !St(l[`q${N}`]) && !Mo(m[N]), v = [];
    return typeof d == "number" ? (u(d) && v.push(d + 1), v) : (m.forEach((N, C) => {
      u(C) && v.push(C + 1);
    }), v);
  }, Aa = (l, d, f) => {
    const u = "第 " + l.join("、") + " 题", v = f === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    Et("⛔ " + u + "尚未选择。" + v);
    const N = He(m, d).length;
    Cr("/question-modal/gate-block", {
      request_id: T,
      tool_call_id: i,
      session_id: le(i),
      missing: l,
      answered: N - l.length,
      total: N,
      bundle: ns
    }).catch(() => {
    });
  }, Tr = async (l, d = !1) => {
    if (!T)
      return U("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const f = Nr();
    if (!d) {
      const u = za(f);
      if (u.length)
        return Aa(u, f, "提交"), "blocked";
      Et("");
    }
    xe(!0);
    try {
      const u = await Cr("/question-modal/answer", {
        request_id: T,
        session_id: le(i),
        answers: f,
        other: ze,
        attachments: de
      });
      return u && u.orphan ? (fetch(
        W("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(le(i)),
        { method: "POST", headers: F() }
      ).catch(() => {
      }), et(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), U("info", "本次问卷已失效，已关闭"), "sent") : (be(i), j(jl(m, f, ze, de)), Qn(Date.now()), Xn(!1), nn(!1), Ve.current = !1, rn.current = !1, Nt.current = !0, y(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (et(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), U("info", "本次问卷已失效，已关闭"), "blocked") : (U("error", "提交失败: " + u.message), d ? (xt.current = !1, kr.current += 1, kr.current >= Br && U(
        "warning",
        "自动提交连续失败 " + Br + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), fn((v) => v + 1), "not-ready") : "blocked");
    } finally {
      xe(!1);
    }
  }, Po = () => {
    se < 0 || (Qe && Et(""), kt(bt.current), Be.current[bt.current] = !0, It(`q${se}`), Q((l) => {
      const d = { ...l };
      d[`q${se}`] = {
        type: (l[`q${se}`] || {}).type || ce(Se),
        value: ((l[`q${se}`] || {}).type || ce(Se)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const f = He(m, d);
      return m.forEach((u, v) => {
        f.indexOf(v) === -1 && delete d[`q${v}`];
      }), d;
    }), P((l) => l + 1));
  }, Ro = () => {
    if ($e) {
      Tr();
      return;
    }
    const l = Nr(), d = za(l, se);
    if (d.length) {
      Aa(d, l, "下一步");
      return;
    }
    Qe && Et(""), P((f) => f + 1);
  }, Lo = async () => {
    if (!T) {
      U("warning", "问卷尚未就绪，请稍候");
      return;
    }
    kt(), xe(!0);
    try {
      const l = await Cr("/question-modal/skip", {
        request_id: T,
        session_id: le(i)
      });
      if (l && l.orphan) {
        et(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
        return;
      }
      U("info", "已跳过问卷"), be(i), X(!0), Ae("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), j("用户跳过了本次问卷。"), Qn(Date.now()), Xn(!1), nn(!1), Ve.current = !1, rn.current = !1, Nt.current = !0, y(!0);
    } catch (l) {
      if (l && l.status === 404) {
        et(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), U("info", "本次问卷已失效，已关闭");
        return;
      }
      U("error", "跳过失败: " + l.message);
    } finally {
      xe(!1);
    }
  };
  e.useEffect(() => {
    if (x || ae !== "ai" && ae !== "recommend" || Oe || (ae === "recommend" || ae === "ai") && !Ot || !zn(p) || !m.length || K) return;
    if ($e) {
      if (xt.current || kr.current >= Br) return;
      const re = Nr();
      if (!bn.every(
        (ve, pe) => !!Ye.current[pe] || St(re[`q${ve}`])
      ) || !T) return;
      xt.current = !0, Tr(void 0, !0).then((ve) => {
        ve === "not-ready" && (xt.current = !1);
      });
      return;
    }
    const l = w;
    if (un.current[l] || ae === "ai" && !Ye.current[l]) return;
    const d = bn[l], f = m[d], u = ce(f), v = is(f), N = ls(Ue.current[l], d);
    if (ae === "ai" && !Ye.current[l]) return;
    un.current[l] = !0;
    const C = v.length ? v.join("、") : N, oe = !!C;
    It(`q${d}`), oe || (pn.current[d] = !0, xo((re) => re + 1), U("warning", "第 " + (d + 1) + " 题没有可用的推荐，已标记为未作答")), Q((re) => {
      const _e = { ...re }, ve = `q${d}`, pe = _e[ve] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!oe)
        _e[ve] = {
          ...pe,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const rt = f.options || [], Ee = (ie) => String(ie).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Te = C.split(/[、,，]/).map((ie) => Ee(ie)).filter(Boolean).map((ie) => {
          const D = rt.find((ge) => Ce(ge) === ie || Re(ge) === ie);
          return D ? Ce(D) : ie;
        });
        _e[ve] = {
          ...pe,
          type: u,
          value: Te,
          other: Te.length === 1 && Te[0] === ye ? pe.other : "",
          attachments: Te.length === 1 && Te[0] === ye ? pe.attachments : []
        };
      } else if (u === "single") {
        const rt = f.options || [], Ee = (D) => String(D).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), Te = rt.find((D) => Ce(D) === C || Re(D) === C) || rt.find((D) => Ce(D) === Ee(C) || Re(D) === Ee(C)), ie = Te ? Ce(Te) : C;
        _e[ve] = {
          ...pe,
          type: u,
          value: ie,
          other: String(ie) === ye ? pe.other : "",
          attachments: String(ie) === ye ? pe.attachments : []
        };
      } else
        _e[ve] = { ...pe, type: u, value: C };
      const Rt = He(m, _e);
      return m.forEach((rt, Ee) => {
        Rt.indexOf(Ee) === -1 && delete _e[`q${Ee}`];
      }), _e;
    }), Be.current[l] = !0, Ye.current[l] = !0, P((re) => re + 1), fn((re) => re + 1);
  }, [
    x,
    ae,
    Oe,
    K,
    i,
    w,
    ko,
    tt,
    p,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    T,
    Ot
  ]);
  const Mt = e.useRef(!1), nt = e.useRef(0), Pt = e.useRef(!1), Fe = e.useRef({});
  e.useEffect(() => {
    if (x || !i) return;
    let l = !0;
    const d = (u) => {
      if (!(!l || !u)) {
        Mt.current = !0, Pt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!m || m.length), u.answers && typeof u.answers == "object" && (Q((N) => {
            const C = { ...N };
            return Object.keys(u.answers).forEach((oe) => {
              const re = u.answers[oe];
              !re || typeof re != "object" || At.current.has(oe) || (C[oe] = {
                ...C[oe] || { type: "single", value: "", other: "" },
                ...re
              });
            }), C;
          }), at(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && P(u.cursor), typeof u.mode == "string" && u.mode) {
            const N = Dt(u.mode);
            an((C) => C === N ? C : N);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((N) => {
            const C = parseInt(N, 10);
            !isNaN(C) && u.per_question[N] && (Ue.current[C] = u.per_question[N]);
          }), u.status === "submitted" && (Qn((N) => N || Date.now()), u.released && at(i, { backendReleased: !0 }), y(!0), be(i));
          const v = String(u.skip_reason || "").trim();
          v && Ae((N) => N || v), typeof u.mode == "string" && u.mode && (Fe.current.mode = Dt(u.mode)), Object.keys(u.answers || {}).forEach((N) => {
            Fe.current["a:" + N] = JSON.stringify(u.answers[N] || {});
          }), typeof u.cursor == "number" && (Fe.current.cursor = "c:" + u.cursor), Pt.current = !0, fn((N) => N + 1);
        } finally {
          setTimeout(() => {
            Mt.current = !1;
          }, 0);
        }
      }
    };
    ol(i).then((u) => {
      !l || !u || !u.found || !u.state || (nt.current = Math.max(nt.current, u.rev), d(u.state));
    });
    const f = il(i, {
      onSnapshot: (u, v) => {
        nt.current = Math.max(nt.current, u), v && d(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= nt.current && u.origin !== Hn() || (nt.current = Math.max(nt.current, v), !(u.origin && u.origin === Hn()) && d(u.state));
      },
      onStatus: (u) => {
        l && vo((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, f();
    };
  }, [x, i]), e.useEffect(() => {
    x || !i || Mt.current || Pt.current && Object.keys(B || {}).forEach((l) => {
      const d = JSON.stringify(B[l] || {});
      Fe.current["a:" + l] !== d && (Fe.current["a:" + l] = d, Tn(
        i,
        "set_answer",
        { key: l, answer: B[l] }
      ));
    });
  }, [x, i, JSON.stringify(B)]), e.useEffect(() => {
    if (x || !i || Mt.current || !Pt.current) return;
    const l = "c:" + w;
    Fe.current.cursor !== l && (Fe.current.cursor = l, Tn(i, "goto", { cursor: w }));
  }, [x, i, w]), e.useEffect(() => {
    x || !i || Mt.current || Pt.current && Fe.current.mode !== ae && (Fe.current.mode = ae, Tn(i, "set_mode", { mode: ae }));
  }, [x, i, ae]);
  const xn = {
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
  }, zr = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Ar = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, kn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Ir = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Ia = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, Or = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, Bo = { display: "flex", flexDirection: "column", gap: 8 }, $r = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, vn = {
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
  }, Oa = {
    ...vn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, jo = {
    ...vn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, Mr = {
    ...vn,
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
  }, $a = {
    // Restored to the original look (user asked for options to stay as-is).
    ...Mr,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, Ma = {
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
  }, Do = { height: 32, fontSize: 13, borderRadius: 8 }, Pa = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, Ra = (l) => {
    const d = Ce(l);
    return ee.type === "multi" ? Array.isArray(ee.value) && ee.value.indexOf(d) !== -1 : ee.value === d;
  }, La = Ra(ye), Ba = (l) => {
    if (x || K) return;
    const d = Ce(l);
    if (ee.type === "multi") {
      const f = Array.isArray(ee.value) ? ee.value.slice() : [], u = f.indexOf(d);
      u === -1 ? f.push(d) : f.splice(u, 1);
      const v = f.length === 1 && f[0] === ye;
      wt({
        ...ee,
        value: f,
        other: v ? ee.other : "",
        attachments: v ? ee.attachments : []
      });
    } else {
      const f = d === ye;
      wt({
        ...ee,
        value: d,
        other: f ? ee.other : "",
        attachments: f ? ee.attachments : []
      });
    }
  }, Wo = !!me("show_recommend_badge", !0), ja = me("badge_position", "left") === "right", Fo = me("badge_style", "rect") === "round", Da = (l) => l && Wo ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: Fo ? { ...Ma, borderRadius: 999 } : Ma
  }, "AI 推荐") : null, Ho = !!me("auto_number_options", !0), Ko = !!me("highlight_recommended", !1), Uo = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, Wa = (l, d, f, u, v, N) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: x || K,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && Ko ? { ...d ? $a : Mr, ...Uo } : d ? $a : Mr,
      onClick: f
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    ja ? null : Da(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (d ? "✓ " : "") + (N && Ho ? N + ". " : "") + l),
    ja ? Da(v) : null
  );
  if (!x && !zn(p))
    return e.createElement(
      "div",
      { style: xn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: zr, className: "qm-header" },
        e.createElement(
          "div",
          { style: Ar },
          jr(e),
          e.createElement("span", { style: kn, className: "qm-title" }, k)
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
          Ke ? gn(Na, "qm-release-lock-prep") : null,
          e.createElement("span", { style: Ir }, "准备中")
        )
      ),
      e.createElement("div", {
        style: { ...Ia, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // US-010: 🔒 二次确认气泡挂卡片根。
      hn
    );
  if (x) {
    const l = () => {
      const f = Yi({
        submittedAt: ut,
        deadReason: qe,
        releasedNote: M,
        skippedAll: H,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: Ct,
        pastSoft: Vn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!Nt.current
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
      }, Xi(f.phase)) : null;
    }, d = !!Nt.current;
    return H && !fe ? e.createElement(
      "div",
      {
        style: {
          ...xn,
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
        qe ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
      ),
      // 跳过原因（用户裁定 2026-11-08 第 1 项）：折叠行也要能看出「为什么」，
      // 不能只剩光秃秃的「跳过」。用 warning 色与状态字区分，且不撑破布局。
      ne ? e.createElement("span", {
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
        title: ne
      }, ne) : null,
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
          ...kn,
          flex: M || ne ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: k
      }, k),
      M ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, M) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ...Oa,
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
      // click.  This entry therefore survives the answered state; it only
      // runs on an explicit click (never automatically), so a healthy run is
      // never cancelled behind the user's back.
      // 用户裁定 q1=**分情况**：本实例真的在等这段才常驻；纯历史卡不显示。
      // US-005: 释放入口收口到行尾 🔒 icon（原「释放阻塞」按钮移除）。
      d ? gn(Ta, "qm-release-lock-fold") : null,
      // US-010: 🔒 二次确认气泡挂卡片根（折叠行经 card spread 已有 relative）。
      hn
    ) : e.createElement(
      "div",
      { style: xn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...zr, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Ar },
          jr(e),
          e.createElement("span", { style: kn }, k)
        ),
        e.createElement(
          "div",
          {
            style: { display: "flex", alignItems: "center", gap: 6, flex: "none" }
          },
          // US-005: 释放入口收口到 header 🔒 icon（原底部「释放阻塞」按钮
          // 移除，不留多套并存）；出现条件沿用 showRelease 判定。
          d ? gn(Ta, "qm-release-lock-ans") : null,
          e.createElement(
            "span",
            { style: { ...Ir, color: qe ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
            qe ? "已失效" : H ? "已跳过" : "已完成"
          )
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      H && (ne || qe) ? e.createElement(
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
        String(ne || qe || "问卷已失效/跳过")
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
      }, H ? R ? R + `

` + Pn(m) : `已跳过本次问卷。

` + Pn(m) : R || I || q || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + Pn(m)),
      H && fe ? e.createElement(
        "div",
        { style: $r },
        e.createElement("button", {
          type: "button",
          style: Oa,
          onClick: () => Le(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...$r, marginTop: 8, gap: 10 } },
        M ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, M) : l()
      ),
      // US-010: 🔒 二次确认气泡挂卡片根。
      hn
    );
  }
  const Pr = te && E === $t, Fa = !x && !$e && yo >= 0 && pn.current[se] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, Ha = Object.keys(pn.current).map((l) => Number(l)).filter((l) => pn.current[l] && Number.isFinite(l)).sort((l, d) => l - d), Go = $e && Ha.length ? e.createElement("div", {
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
  }, "⚠ 第 " + Ha.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let wn = null;
  if ($e)
    wn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: Or }, "其他意见（可选）"),
      Go,
      e.createElement(s, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: ze,
        style: Pa,
        onChange: (l) => dt(l.target.value),
        onPaste: (l) => Er(l, "final", "final")
      }),
      Jr({
        R: e,
        files: de,
        disabled: x || K,
        uploading: wr,
        error: Sr,
        onPick: () => _r("final", "final"),
        onRemove: (l) => ke((d) => d.filter((f, u) => u !== l))
      })
    );
  else if (Se && ce(Se) === "text")
    wn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Or, fontSize: 13, color: "var(--app-text, inherit)" } }, jn(Se, se)),
      Fa,
      e.createElement(s, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof ee.value == "string" ? ee.value : "",
        style: Pa,
        onChange: (l) => wt({ ...ee, value: l.target.value, other: "" }),
        onPaste: (l) => Er(l, "q", vt)
      }),
      Jr({
        R: e,
        files: ee.attachments || [],
        disabled: x || K,
        uploading: wr,
        error: Sr,
        onPick: () => _r("q", vt),
        onRemove: (l) => wt({
          ...ee,
          attachments: (ee.attachments || []).filter((d, f) => f !== l)
        })
      })
    );
  else if (Se) {
    const l = is(Se), d = ls(sn, se), f = l.length ? l : d ? [d] : l, u = (Se.options || []).map((v, N) => Wa(
      Re(v),
      Ra(v),
      () => Ba(v),
      "o" + N,
      ml(Se, v, f),
      N + 1
    ));
    u.push(Wa("其他", La, () => Ba(ye), "other")), La && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: ee.other,
      style: { ...Do, marginTop: 2 },
      onChange: (v) => wt({ ...ee, other: v.target.value }),
      onPaste: (v) => Er(v, "q", vt)
    })), u.push(Jr({
      R: e,
      files: ee.attachments || [],
      disabled: x || K,
      uploading: wr,
      error: Sr,
      onPick: () => _r("q", vt),
      onRemove: (v) => wt({
        ...ee,
        attachments: (ee.attachments || []).filter((N, C) => C !== v)
      })
    }))), wn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...Or, fontSize: 13, color: "var(--app-text, inherit)" } }, jn(Se, se)),
      Fa,
      e.createElement("div", { style: { ...Bo, marginTop: 8 } }, u)
    );
  }
  const Rr = tt + 1, Jo = $e ? Rr + "/" + Rr : w + 1 + "/" + Rr, Ka = (l, d, f, u, v) => e.createElement("button", {
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
  }, u), Zo = e.createElement(
    "span",
    {
      style: { display: "inline-flex", alignItems: "center", gap: 3 }
    },
    e.createElement("span", { style: { fontSize: 12, lineHeight: 1 } }, "更多"),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  ), Qo = e.createElement(
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
  ), qn = {
    position: "absolute",
    top: 30,
    right: 0,
    zIndex: 1e4,
    minWidth: 168,
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)"
  }, Sn = {
    position: "absolute",
    top: -5,
    right: 9,
    width: 8,
    height: 8,
    transform: "rotate(45deg)",
    background: "var(--app-surface-raised, #fff)",
    borderLeft: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    borderTop: "1px solid var(--app-border-strong, rgba(127,127,127,0.45))"
  }, _n = (l, d) => e.createElement(
    "button",
    {
      type: "button",
      key: l,
      className: "qm-hdr-menu-item",
      role: "menuitem",
      onClick: d && d.onClick ? d.onClick : () => {
        Ie(!1);
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
  ), Ua = (mr || []).find((l) => l.id === Ge), Vo = Ua ? Ua.name : "默认模板", Xo = e.createElement(
    "div",
    { style: qn, role: "menu", className: "qm-hdr-pop" },
    e.createElement("div", { style: Sn }),
    _n("选择模板（当前：" + Vo + "）", {
      disabled: x || K,
      onClick: () => {
        Ie(!1), mt(!1), ht(!1), De(!1), We(!1), Je(!0);
      }
    }),
    // US-004: 跳过类菜单项接通——复用原底部按钮的 skipCurrent/submit/skipAll
    // 逻辑，只改触发入口；语义（allowEmpty / 空答卷闸门 / busy 防重复）不变。
    _n("跳过本题", {
      // 与原底部按钮对齐：busy 防重复；末页（其他意见页）没有当前题可跳，
      // skipCurrent 无意义 → 置灰（原按钮此时文案变「跳过并提交」）。
      disabled: x || K || $e,
      onClick: () => {
        Ie(!1), Po();
      }
    }),
    _n("跳过并提交", {
      // 与原底部按钮的 whole/末页分支等价：明确的提交意图，
      // 不套空答卷闸门（allowEmpty=true），空白按跳过表态一并提交。
      disabled: x || K,
      onClick: () => {
        Ie(!1), Tr(void 0, !0);
      }
    }),
    _n("跳过问卷 ⚠", {
      // US-004: 不可逆动作不再直接执行——收起菜单，弹二次确认气泡，
      // 确认后才调用原 skipAll。title 保留原按钮的不可恢复警示语义。
      disabled: x || K,
      title: "跳过后本次问卷立即结束，未答题目不再收集，不可恢复",
      onClick: () => {
        Ie(!1), De(!0), We(!1);
      }
    })
  ), Yo = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定（点面板内部不关闭）。width 固有宽 + maxWidth 视口-44px 防溢出。
      ref: cr,
      role: "dialog",
      "aria-label": "查看上下文",
      className: "qm-hdr-pop",
      style: { ...qn, width: "300px", maxWidth: "calc(100vw - 44px)", padding: "10px 12px", fontSize: 12 }
    },
    e.createElement("div", { style: Sn }),
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
  ), ei = e.createElement(
    "div",
    {
      // US-012: 面板挂 qm-actions 行容器（demo v5 参照系）；ref 供外部点击
      // 关闭判定。width 248px（内容 240+padding 8）+ maxWidth 视口-44px，不溢出。
      ref: dr,
      role: "dialog",
      "aria-label": "选择模板",
      className: "qm-hdr-pop",
      style: { ...qn, padding: 4, width: "248px", maxWidth: "calc(100vw - 44px)" }
    },
    e.createElement("div", { style: Sn }),
    Gl({
      R: e,
      templates: mr,
      value: Ge,
      onSelect: (l) => {
        _a(l), Je(!1);
      },
      onManage: () => {
        Je(!1), va(!0);
      }
    })
  ), ti = e.createElement(
    "div",
    {
      role: "dialog",
      "aria-label": "确认跳过问卷",
      className: "qm-hdr-pop",
      style: { ...qn, width: 260, padding: "12px 14px" }
    },
    e.createElement("div", { style: Sn }),
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
        onClick: () => De(!1)
      }, "取消"),
      e.createElement("button", {
        type: "button",
        disabled: K,
        style: {
          padding: "4px 12px",
          fontSize: 12,
          cursor: K ? "default" : "pointer",
          border: "none",
          borderRadius: 6,
          opacity: K ? 0.5 : 1,
          background: "#d92d20",
          color: "#fff",
          fontWeight: 500
        },
        onClick: () => {
          De(!1), Lo();
        }
      }, "确定")
    )
  ), ni = e.createElement(
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
    Ka("更多操作", on, () => {
      Ie((l) => !l), mt(!1), ht(!1), Je(!1), De(!1), We(!1);
    }, Zo, { text: !0 }),
    Ka("查看上下文", ln, () => {
      mt((l) => !l), Ie(!1), ht(!1), Je(!1), De(!1), We(!1);
    }, Qo),
    on ? Xo : null,
    // US-012: 上下文气泡与模板选择面板（宽面板）不再挂本触发器小容器，
    // 改挂 qm-actions 行容器直下（见 qm-actions children 末尾）——移动端
    // 防错位/溢出（demo v5 参照系）。更多菜单/跳过确认气泡仍挂本容器。
    yr ? ti : null
  ), Ga = {
    ...vn,
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
    { style: xn, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: zr, className: "qm-header" },
      e.createElement(
        "div",
        { style: Ar },
        jr(e),
        e.createElement("span", { style: kn, className: "qm-title" }, k)
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
        Pr || Ke && !T ? gn(Na, "qm-release-lock") : null,
        Kl({
          R: e,
          providers: oo,
          modelId: ya,
          disabled: x || K,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: co,
          onOpenChange: po,
          tab: uo,
          onTabChange: fo,
          onChange: (l) => {
            mn({ modelId: l }), ft(null), Ue.current = {}, Be.current = {}, yt((d) => d + 1);
          }
        }),
        // US-003: 常驻「默认模板」胶囊已从 header 移除；模板选择收进「更多」
        // 菜单的「选择模板」弹层（TemplatePickList）。选择逻辑（selectTemplate）
        // 与管理入口（TemplateManager）原样保留，功能不丢失。
        Ul({
          R: e,
          mode: ae,
          disabled: x || K,
          open: pr,
          onOpenChange: (l) => {
            ht(l), l && (Ie(!1), mt(!1), Je(!1), De(!1), We(!1));
          },
          popRef: ur,
          panelRef: fr,
          // US-012: 面板独立锚点（面板挂 qm-actions 行容器）
          onChange: (l) => {
            mn({ mode: l }), l === "ai" && (Be.current = {}), l === "ai" || l === "recommend" ? (un.current = {}, Ye.current = {}, xt.current = !1, yt((d) => d + 1)) : kt();
          }
        }),
        Zl({
          R: e,
          busy: xa,
          result: sn,
          error: lo,
          mode: ae,
          disabled: x || K,
          open: Tt,
          onOpenChange: or,
          popRef: ir,
          panelRef: lr,
          // US-013: 触发器/面板双 ref（外部点击关闭）
          onRun: () => {
            vr("manual");
          },
          onRerun: Eo,
          onApply: To,
          onCancel: Co,
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
                checked: tr,
                onChange: (l) => mn({ withContext: !!l.target.checked })
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
                checked: rr,
                onChange: (l) => mn({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (ae === "ai" || ae === "recommend") && !x ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: K,
          onClick: No,
          style: {
            ...Ga,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...Oe ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: Oe ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, Oe ? "▶ 继续" : "⏸ 停止") : null,
        // US-001: 「更多」(⋮) 与「查看上下文」(ⓘ) 两个 icon 微按钮 + 弹出层，
        // 纯增量插在现有控件之后、进度 pill 之前（demo v5 形态）。
        ni,
        // US-012: 宽弹出层（上下文气泡/模板选择面板）上移到 qm-actions 行容器
        // 直下——移动端 qm-actions 换行后触发器小容器横向位置不定，挂行容器
        // right:0 对齐整行右缘（≈卡片右缘），修复错位/溢出/被裁（demo v5 口径）。
        // 模式下拉面板由 ModeSwitch 返回数组同步上移；互斥与外部点击关闭逻辑不变。
        ln ? Yo : null,
        hr ? ei : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Ir, key: "qm-step" }, Jo)
      )
    ),
    e.createElement("div", { style: Ia }, wn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    Jl({
      R: e,
      open: go,
      templates: mr,
      value: Ge,
      edit: ho,
      onEditChange: br,
      onClose: () => {
        va(!1), br(null);
      },
      onSelect: (l) => _a(l),
      onSave: So,
      onDelete: _o
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
    (Pr || Ke && !T) && !x ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": te ? i : void 0,
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
        (Pr ? "⚠️ 本题已超过 " + Oo + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；若你不想继续作答，点右上角 🔒 释放阻塞。"
      )
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Qe && !x ? e.createElement("div", {
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
      "data-qm-bundle": ns
    }, Qe) : null,
    e.createElement(
      "div",
      { style: $r, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: w === 0 || K,
        style: { ...Ga, marginRight: "auto", opacity: w === 0 ? 0.5 : 1 },
        onClick: () => P((l) => l - 1)
      }, "上一步"),
      // US-004: 底部操作行只保留导航/提交语义按钮。跳过类动作（跳过本题 /
      // 跳过并提交 / 跳过问卷）是破坏性或替代性动作，已全部收进 header 的
      // 「更多」菜单（与「提交」在空间上分离，防提交误触，PRD 需求 F）；
      // 「跳过问卷」在菜单中需经二次确认气泡才执行，逻辑（skipCurrent /
      // submit(allowEmpty) / skipAll）与原按钮完全一致，仅触发入口变化。
      e.createElement("button", {
        type: "button",
        disabled: K,
        style: jo,
        onClick: Ro
      }, $e ? "提交" : "下一步")
    ),
    // US-010: 🔒 二次确认气泡统一挂卡片根（四处 🔒 共用一个气泡实例）。
    hn
  );
}
const fs = 12;
let ms = 0;
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
let Ht = null;
function ot(t, e, n) {
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
function gs(t) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function he(t, e) {
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
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", O();
}
function hs() {
  return Object.keys(c.draft).length;
}
async function ma() {
  try {
    const t = await fetch(W("/question-modal/prefs"), { headers: F() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    c.globalCfg = n && typeof n == "object" ? n : {};
    try {
      mc(c.globalCfg);
    } catch {
    }
    try {
      O();
    } catch {
    }
  } catch {
  }
}
async function Js() {
  try {
    const t = await fetch(W("/question-modal/notify/channels"), {
      headers: F()
    });
    if (!t.ok) return;
    const e = await t.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off"), c.pcCurrent = String(e && e.pc_current || "off"), c.bgCurrent = String(e && e.bg_current || "off");
    try {
      O();
    } catch {
    }
  } catch {
  }
}
async function ga(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        W("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: F() }
      );
      if (!e.ok) return;
      const n = await e.json();
      c.notifyLog = {
        ...c.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        O();
      } catch {
      }
    } catch {
    }
}
async function Vl(t) {
  if (!t || t === "off") return;
  c.notifyTesting = t, c.notifyMsg = { ...c.notifyMsg, [t]: "发送中…" };
  try {
    O();
  } catch {
  }
  let e = "", n = null;
  try {
    n = await (await fetch(W("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...F(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: t })
    })).json().catch(() => ({})), n && n.delivered ? e = n.note ? "✓ 已发送（" + n.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (n && (n.error || n.reason) || "测试失败");
  } catch (a) {
    e = "✗ 请求失败：" + String(a && a.message || a);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await Js(), r || await ga(t);
  try {
    O();
  } catch {
  }
}
async function Zs() {
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
  t.length, c.saving = !0, c.saveMsg = "", O();
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
    const s = await fetch(W(r), {
      method: "POST",
      headers: F(),
      body: JSON.stringify(a)
    }), o = await s.json().catch(() => ({}));
    if (!s.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + s.status + "）", O();
      return;
    }
    const p = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (p.length) {
      c.saving = !1;
      const m = p.map((k) => `${k.key}：${k.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + m, O();
      return;
    }
    c.saving = !1, c.draft = {}, Ms();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const m = (x) => {
        try {
          const y = new Date(x * 1e3), I = (z) => z < 10 ? "0" + z : String(z);
          return y.getMonth() + 1 + "-" + I(y.getDate()) + " " + I(y.getHours()) + ":" + I(y.getMinutes()) + ":" + I(y.getSeconds());
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
    e || ma();
    const b = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let q = "";
    if (b && (q = e ? "session" : "default"), q === "default") {
      try {
        const m = await fetch(W("/question-modal/session-prefs"), {
          method: "POST",
          headers: F(),
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
    Xt(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((m) => {
      m && (c.cfg = m);
      try {
        O();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    c.saving = !1, c.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    O();
  } catch {
  }
}
function Qs() {
  c.draft = {}, c.saveMsg = "";
}
function Vs() {
  pa().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      O();
    } catch {
    }
  }).catch(() => {
  });
}
function Xl() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", O();
}
function Yl(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", O());
}
function bs(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, O());
}
function ec() {
  c.tplEdit = null, O();
}
async function tc() {
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
    c.saveMsg = "模板名称不能为空", O();
    return;
  }
  c.tplBusy = !0, O();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await Ps(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), O();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", Vs(), O();
}
async function nc(t) {
  const e = c.templates.filter((a) => a.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await Rs(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), O();
    return;
  }
  c.saveMsg = "模板已删除", Vs(), O();
}
function rc() {
  c.visible = !0, c.chatId = "", c.sessionId = tn(), c.cfg = null, c.cfgError = "", sc(), c.agentId = Un || (() => {
    try {
      return Ne().getSelectedAgentId ? Ne().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Ms();
  const t = ++ms;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", O(), Xs(() => {
    if (t !== ms) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", O(), (c.tab === "global" || c.tab === "default") && ma(), Js().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && ga(r);
    });
  });
}
let Zr = !1;
async function ac() {
  if (!Zr) {
    Zr = !0;
    try {
      const t = await Xt(
        "",
        !0,
        c.sessionId,
        c.agentId
      ), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      Zr = !1;
      try {
        O();
      } catch {
      }
    }
  }
}
let An = !1;
function sc() {
  An || (An = !0, Promise.all([Ls(), pa()]).then((t) => {
    An = !1;
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
      O();
    } catch {
    }
  }).catch(() => {
    An = !1;
  }));
}
function oc(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let Qr = !1, In = "";
const Vr = [];
function Xs(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (Qr && In === n) {
    t && Vr.push(t);
    return;
  }
  Qr = !0, In = n;
  const r = () => {
    In === n && (Qr = !1, In = "");
    const a = Vr.splice(0);
    try {
      a.forEach((s) => s());
    } catch {
    }
  };
  t && Vr.push(t), Xt(
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
      O();
    } catch {
    }
  }).catch(() => {
    c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global", c.cfgError = "读取配置失败（网络异常）"), r();
    try {
      O();
    } catch {
    }
  });
}
function O() {
  const t = Ne().React, e = Ne().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
        try {
          const n = Ze();
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
    Ht || (Ht = document.createElement("div"), Ht.id = "qm-settings-root", document.body.appendChild(Ht)), e.render(t.createElement(qc, {
      R: t,
      open: c.visible,
      onClose: () => {
        if (hs() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          Qs();
        }
        c.visible = !1, c.saveMsg = "", O();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = Ys(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, O(), Xs(), (n === "global" || n === "default") && ma(), n === "stale" && ac();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: hs(),
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
    }), Ht);
  }
}
function ic(t) {
  const { R: e, onOpen: n } = t, r = Ze(), a = r && r.Button, s = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, p = { title: s, "aria-label": s }, i = {
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
const Xr = [
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
], Ys = (t) => t === "session";
function lc(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function cc(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function ys(t, e, n, r) {
  const a = n === "pc" ? "notify_channel_pc" : "notify_channel_bg", s = c.notifyChannels || [], o = String(
    (n === "pc" ? c.pcCurrent : c.bgCurrent) || "off"
  ), p = String(ot(a, "off", "global") || o || "off"), h = ((_) => s.filter((w) => String(w.channel) === _)[0])(p), b = s.filter((_) => n !== "bg" || String(_.channel) !== "browser").map((_) => {
    const w = String(_.channel || ""), P = String(_.label || w), S = _.ready !== !1, L = _.verified === !0 || w === "off";
    let E = "";
    return S ? L || (E = "（待测试）") : E = "（不可用）", { value: w, label: P + E, disabled: !S };
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
      onChange: (_) => {
        const w = _ && _.target ? String(_.target.value) : "off";
        he(a, w), ga(w);
      }
    }, b.map((_, w) => t.createElement("option", {
      key: "o" + w,
      value: _.value,
      disabled: !!_.disabled
    }, _.label)))
  ];
  if (m && q && y.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: k,
    "data-qm-notify-test": p,
    onClick: (_) => {
      _ && _.stopPropagation && _.stopPropagation(), Vl(p);
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
    y.push(t.createElement("span", {
      key: "rs",
      "data-qm-notify-reason": h.reason_code || "",
      style: _ ? { marginLeft: 8, color: "var(--app-danger,#d93025)", fontSize: 12, fontWeight: 600 } : { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
    }, h.reason));
  }
  const I = !!(h && h.verified === !0), z = g || x, T = !!x;
  if (z || m && q && !k) {
    const _ = g ? g.delivered === !0 : T ? x.indexOf("✓") === 0 : !1;
    let w;
    T ? w = x : g ? w = _ ? "✓ 上次测试成功" + (g.note ? "（" + g.note + "）" : "") : "✗ " + (g.error || g.note || "上次测试失败") : w = "未测试";
    const P = g && g.at_text ? "  ·  " + g.at_text : "", S = z ? _ ? "#52c41a" : "#ff4d4f" : "#faad14";
    y.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": z ? _ ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": z && (_ || I) ? "1" : "0",
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
    }, w + P));
  }
  return qt(
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
function qt(t, e, n, r, a, s, o, p, i) {
  const h = s || "global", b = cc(o || "global", h), q = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      lc(t, "sc", h),
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
function dc(t, e, n, r, a) {
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
function pc(t, e, n, r) {
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
function Vt(t, e, n, r, a) {
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
function uc(t, e, n, r, a) {
  const s = oc(n), p = r.map((k) => k.id).indexOf(s.provider) >= 0 ? s.provider : "", i = p ? (r.filter((k) => k.id === p)[0] || { models: [] }).models : [], h = i.indexOf(s.model) >= 0 ? s.model : "", b = (k, g) => {
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
const fc = () => [
  { name: "工作时段", start: "09:00", end: "18:00", mode: "ai", chPc: "", chBg: "" },
  { name: "夜间值守", start: "22:00", end: "06:00", mode: "manual", chPc: "", chBg: "" }
];
let On = fc(), $ = {
  enabled: !1,
  url: "",
  method: "post_json",
  tokenPos: "none",
  token: "",
  tokenSet: !1,
  mode: "basic",
  params: [],
  bodyTpl: ""
}, st = null;
function Kt() {
  try {
    he("custom_api_params", $.params.map((t) => ({
      key: String(t.key || ""),
      value: String(t.value || ""),
      required: !!t.required
    })));
  } catch {
  }
}
function mc(t) {
  if (!t || typeof t != "object") return;
  const e = (a, s) => {
    if (a in c.draft) return String(c.draft[a]);
    const o = t[a];
    return o == null ? s : String(o);
  };
  $.enabled = "custom_api_enabled" in c.draft ? !!c.draft.custom_api_enabled : !!t.custom_api_enabled, $.url = e("custom_api_url", ""), $.method = e("custom_api_method", "post_json"), $.tokenPos = e("custom_api_token_pos", "none"), $.mode = e("custom_api_mode", "basic"), $.bodyTpl = e("custom_api_body", ""), $.token = "", $.tokenSet = !!t.custom_api_token_set;
  const n = c.draft.custom_api_params, r = Array.isArray(n) ? n : Array.isArray(t.custom_api_params) ? t.custom_api_params : [];
  $.params = r.filter((a) => a && typeof a == "object").map((a) => ({
    key: String(a.key || ""),
    value: String(a.value || ""),
    required: !!a.required
  }));
}
function gc() {
  const t = [];
  return String($.url || "").trim() || t.push("请求地址"), $.mode === "advanced" ? String($.bodyTpl || "").trim() || t.push("body 模板") : $.params.forEach((e) => {
    e.required && !String(e.value || "").trim() && t.push(String(e.key || "").trim() || "未命名参数");
  }), t;
}
function hc() {
  const t = {}, e = /* @__PURE__ */ new Set();
  return $.params.forEach((n, r) => {
    const a = String(n.key || "").trim();
    a && (t[a] !== void 0 ? (e.add(r), e.add(t[a])) : t[a] = r);
  }), e;
}
function bc(t) {
  return /^[A-Za-z_][A-Za-z0-9_.\-]*$/.test(t);
}
function Yr(t, e) {
  let n = String(t || "");
  return ["title", "content", "count", "stamp", "token"].forEach((r) => {
    n = n.split("{{" + r + "}}").join(e[r] || "");
  }), n;
}
const Ut = {
  title: "（问卷标题）",
  content: "「（问卷标题）」有 3 道题等你作答",
  count: "3",
  stamp: "来自智能体-2026-01-01 00:00:00",
  token: $.tokenSet || $.token ? "（已设置的 Token）" : "（未设置 Token）"
};
function eo(t) {
  return [
    {
      id: t.ids.mode,
      label: t.modeLabel,
      kind: "seg",
      cfgKey: "mode",
      readScope: t.readScope,
      itemScope: t.itemScope.mode,
      note: "本会话的问卷默认用哪种方式推进",
      segItems: ["自动分析", "只用推荐", "人工"]
    },
    {
      id: t.ids.model,
      label: "默认模型",
      kind: "model",
      cfgKey: "model_id",
      readScope: t.readScope,
      itemScope: t.itemScope.model,
      note: t.modelNote,
      wide: t.modelWide,
      hideWhenRecommend: !0
    },
    {
      id: t.ids.tpl,
      label: "提示词模板",
      kind: "select",
      cfgKey: "template_id",
      readScope: t.readScope,
      itemScope: t.itemScope.tpl,
      note: "自动分析模式下将调用提示词并自动分析",
      hideWhenRecommend: !0
    },
    {
      id: t.ids.ctx,
      label: "携带上下文",
      kind: "switch",
      cfgKey: "with_context",
      readScope: t.readScope,
      itemScope: t.itemScope.ctx,
      note: "附带上次决策与会话历史",
      switchKey: t.switchKeys.ctx,
      hideWhenRecommend: !0
    },
    {
      id: t.ids.parallel,
      label: "并行分析各题",
      kind: "switch",
      cfgKey: "parallel",
      readScope: t.readScope,
      itemScope: t.itemScope.parallel,
      note: "逐题并发调用模型，更快，但更耗额度。",
      switchKey: t.switchKeys.parallel,
      hideWhenRecommend: !0
    }
  ];
}
const yc = eo({
  ids: { mode: "s1", model: "s2", tpl: "s3", ctx: "s4", parallel: "s5" },
  readScope: "session",
  itemScope: { mode: "session", model: "session", tpl: "session", ctx: "session", parallel: "session" },
  modeLabel: "答题模式",
  // 模型行说明是动态的（三态来源），这里放占位，渲染时由 renderSettingRow 覆盖
  modelNote: "",
  switchKeys: { ctx: "s4sw", parallel: "s5sw" }
}), xc = eo({
  ids: { mode: "a1", model: "b1", tpl: "b2", ctx: "b3", parallel: "b4" },
  readScope: "global",
  itemScope: { mode: "both", model: "both", tpl: "both", ctx: "both", parallel: "global" },
  modeLabel: "默认答题模式",
  modelNote: "自动读取当前对话模型；改动即自动切换",
  switchKeys: { ctx: "s3", parallel: "s4" },
  modelWide: !0
});
function kc(t, e) {
  return ot(t.cfgKey, e, t.readScope);
}
function vc(t, e, n) {
  const r = kc(e, e.cfgKey === "mode" ? "manual" : e.kind === "switch" ? !1 : "");
  let a;
  if (e.kind === "seg")
    a = dc(
      t,
      "g1",
      e.segItems || [],
      n.modeLabel[String(r || "manual")] || "人工",
      (o) => n.edit(e.cfgKey, n.modeByLabel[o] || "manual")
    );
  else if (e.kind === "model")
    a = uc(
      t,
      "sel2",
      String(r || ""),
      n.groups,
      (o) => n.edit(e.cfgKey, o)
    );
  else if (e.kind === "select")
    if (n.tplChoices.length) {
      const o = String(r || "") || n.tplChoices[0] && n.tplChoices[0].value || "";
      a = Vt(
        t,
        "sel3",
        o,
        n.tplChoices,
        (p) => n.edit(e.cfgKey, p)
      );
    } else
      a = Vt(t, "sel3", "默认六步思维链");
  else
    a = pc(
      t,
      e.switchKey || e.id + "sw",
      !!r,
      (o) => n.edit(e.cfgKey, o)
    );
  let s = e.note;
  return e.kind === "model" && e.readScope === "session" && (s = n.explicitEmptyModel ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换"), e.kind === "select" && !n.tplChoices.length && (s = "模板库未加载，暂不可选"), qt(t, e.id, e.label, a, s, e.itemScope, n.scope, e.wide);
}
function xs(t, e, n) {
  return e.filter((r) => !r.hideWhenRecommend || n.currentMode !== "recommend").map((r) => vc(t, r, n));
}
function wc(t, e, n, r, a) {
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
    const I = c.templates.filter((z) => String(z.id) === String(y))[0];
    return { value: y, label: I && (I.name || I.id) || y };
  });
  if (e === "session") {
    const y = String(ot("mode", "manual"));
    s.push(...xs(t, yc, {
      scope: o,
      currentMode: y,
      modeLabel: i,
      modeByLabel: p,
      groups: g,
      tplChoices: x,
      tplOpts: k,
      explicitEmptyModel: gs("model_id"),
      edit: he
    }));
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const I = String(ot("mode", "manual", "global"));
      s.push(...xs(t, xc, {
        scope: o,
        currentMode: I,
        modeLabel: i,
        modeByLabel: p,
        groups: g,
        tplChoices: x,
        tplOpts: k,
        explicitEmptyModel: gs("model_id"),
        edit: he
      }));
    } else {
      s.push(ys(t, o, "pc", "PC 端打开时提醒频道")), s.push(ys(t, o, "bg", "后台运行时提醒频道"));
      const I = gc(), z = hc(), T = (A, R, j, H) => t.createElement("div", { className: "qm-set-schedfield", key: A }, [
        t.createElement(
          "span",
          { className: "qm-set-schedfieldlabel", key: "l" },
          R,
          H ? t.createElement("span", { key: "r", className: "qm-apireq" }, "*") : null
        ),
        j
      ]), _ = (A, R, j) => t.createElement("div", { className: "qm-apisysrow", key: "sys-" + A }, [
        t.createElement("span", { key: "n", className: "qm-apisysname" }, A),
        t.createElement("span", { key: "d", className: "qm-apisysval" }, R),
        t.createElement("span", { key: "t", className: "qm-apisystag" }, j)
      ]), w = t.createElement("div", { className: "qm-apisysblock", key: "sysblock" }, [
        t.createElement(
          "div",
          { key: "h", className: "qm-set-schedfieldlabel" },
          "系统字段（自动携带，不可删除）"
        ),
        _("title", "{{title}}", "系统必传"),
        _("content", "{{content}}", "系统必传"),
        t.createElement(
          "div",
          {
            key: "tip",
            className: "qm-set-apinote",
            style: { marginTop: 4 }
          },
          "另有 {{count}} 题数、{{stamp}} 时间戳、{{token}} 可在参数值中引用。"
        )
      ]), P = $.params.map((A, R) => {
        const j = !!String(A.key || "").trim() && (!bc(A.key) || z.has(R)), H = A.required && !String(A.value || "").trim();
        return t.createElement("div", {
          key: "prow-" + R,
          className: "qm-apiparamrow" + (H ? " miss" : ""),
          "data-qm-api-paramrow": String(R)
        }, [
          t.createElement("input", {
            key: "k",
            type: "text",
            className: "qm-apipk" + (j ? " bad" : ""),
            value: A.key,
            placeholder: "参数名",
            "data-qm-api-paramkey": String(R),
            title: z.has(R) ? "参数名重复" : j ? "参数名只能包含字母、数字、下划线、点、连字符" : "对方 API 要求的参数名",
            onChange: (X) => {
              $.params[R].key = X && X.target ? String(X.target.value) : "", Kt(), O();
            }
          }),
          t.createElement("input", {
            key: "v",
            type: "text",
            className: "qm-apipv" + (H ? " bad" : ""),
            value: A.value,
            placeholder: "参数值，可写 {{title}}",
            "data-qm-api-paramvalue": String(R),
            title: H ? "必传参数不能为空" : "支持 {{title}} {{content}} {{count}} {{stamp}} {{token}}",
            onChange: (X) => {
              $.params[R].value = X && X.target ? String(X.target.value) : "", Kt(), O();
            }
          }),
          t.createElement("label", {
            key: "r",
            className: "qm-apireqbox",
            title: "勾选后此项为必传，为空时无法发送"
          }, [
            t.createElement("input", {
              key: "c",
              type: "checkbox",
              checked: !!A.required,
              "data-qm-api-paramreq": String(R),
              onChange: (X) => {
                $.params[R].required = !!(X && X.target && X.target.checked), Kt(), O();
              }
            }),
            "必填"
          ]),
          t.createElement("button", {
            key: "d",
            type: "button",
            className: "qm-apidel",
            title: "删除此行",
            "data-qm-api-paramdel": String(R),
            onClick: () => {
              $.params.splice(R, 1), Kt(), O();
            }
          }, "✕")
        ]);
      }), S = t.createElement("div", { key: "ptable" }, [
        t.createElement("div", { key: "head", className: "qm-apiparamhead" }, [
          t.createElement("span", { key: "k", style: { flex: "0 0 34%" } }, "参数名"),
          t.createElement("span", { key: "v", style: { flex: "1 1 auto" } }, "参数值"),
          t.createElement("span", { key: "r", style: { flex: "0 0 44px" } }, "必填"),
          t.createElement("span", { key: "d", style: { flex: "0 0 24px" } }, "")
        ]),
        ...P,
        t.createElement("button", {
          key: "add",
          type: "button",
          className: "qm-apiadd",
          "data-qm-api-paramadd": "1",
          title: "新增一行自定义参数",
          onClick: () => {
            if ($.params.length >= 20) {
              U("warning", "最多 20 个自定义参数");
              return;
            }
            $.params.push({ key: "", value: "", required: !1 }), Kt(), O();
          }
        }, "+ 新增参数行")
      ]), L = String($.url || "").trim(), E = L ? Yr(L, Object.fromEntries(
        Object.entries(Ut).map(([A, R]) => [A, encodeURIComponent(String(R))])
      )) : "（未填请求地址）", Z = /\{\{\s*(title|content|count|stamp|token)\s*\}\}/.test(L);
      let te = "";
      if ($.mode === "advanced")
        te = Yr(String($.bodyTpl || ""), Ut) || "（高级模式未填写 body 模板）";
      else {
        const A = {
          title: Ut.title,
          content: Ut.content
        };
        $.params.forEach((R) => {
          const j = String(R.key || "").trim();
          j && (A[j] = Yr(String(R.value || ""), Ut));
        }), te = JSON.stringify(A, null, 2);
      }
      const G = t.createElement("div", { key: "preview" }, [
        t.createElement("div", { key: "l1", className: "qm-apipreviewlabel" }, "请求预览"),
        t.createElement(
          "pre",
          {
            key: "u",
            className: "qm-apipreview",
            "data-qm-api-preview": "url"
          },
          (String($.method) === "get_query" ? "GET " : "POST ") + E
        ),
        // URL 支持占位符插值时的说明（GET/POST 都适用，boss 需求 2）
        Z ? t.createElement(
          "div",
          {
            key: "uptip",
            className: "qm-set-apinote",
            style: { marginTop: 2, marginBottom: 4 },
            "data-qm-api-urlph": "1"
          },
          "地址中的占位符已按示例值替换；实际发送时用真实标题/正文（自动 URL 编码）。"
        ) : null,
        String($.method) === "get_query" ? null : t.createElement("pre", {
          key: "b",
          className: "qm-apipreview",
          "data-qm-api-preview": "body"
        }, te)
      ]), B = t.createElement("div", {
        key: "status",
        className: "qm-apistatus " + (I.length ? "miss" : "ok"),
        "data-qm-api-status": I.length ? "missing" : "ok"
      }, [
        t.createElement("span", { key: "i" }, I.length ? "⚠" : "✓"),
        t.createElement(
          "span",
          { key: "t" },
          I.length ? "还缺 " + I.length + " 项必传参数：" + I.join("、") : "必传项已填齐，可以测试发送"
        )
      ]), Q = I.length === 0 && !!String($.url || "").trim(), ze = t.createElement("div", {
        key: "foot",
        className: "qm-set-apifoot",
        style: { flexDirection: "column", alignItems: "stretch", gap: 6 }
      }, [
        t.createElement("div", {
          key: "btnrow",
          style: { display: "flex", gap: 8, justifyContent: "flex-end" }
        }, [
          t.createElement("button", {
            key: "test",
            type: "button",
            className: "qm-set-apitest",
            "data-qm-api-test": "1",
            disabled: !Q,
            style: Q ? void 0 : { opacity: 0.45, cursor: "not-allowed" },
            title: Q ? "按当前配置真实发送一次" : "还缺：" + I.join("、"),
            onClick: () => {
              Q && (st = { ok: !0, text: "正在发送…" }, O(), (async () => {
                try {
                  await Zs();
                  const R = await (await fetch(W("/question-modal/notify/test"), {
                    method: "POST",
                    headers: F(),
                    body: JSON.stringify({ channel: "custom_api" })
                  })).json(), j = !!(R && (R.ok || R.delivered));
                  let H = "";
                  j ? H = "发送成功" + (R && R.http ? "（HTTP " + R.http + "）" : "") + (R && R.elapsed_ms !== void 0 ? " · " + R.elapsed_ms + "ms" : "") : H = "发送失败：" + (R && (R.reason || R.error) || "未知原因"), st = { ok: j, text: H };
                } catch (A) {
                  st = { ok: !1, text: "发送失败：" + (A && A.message || A) };
                }
                O();
              })());
            }
          }, "发送测试")
        ]),
        st ? t.createElement("div", {
          key: "res",
          className: "qm-apitestres " + (st.ok ? "ok" : "err"),
          "data-qm-api-testresult": st.ok ? "ok" : "err"
        }, st.text) : null
      ]);
      s.push(t.createElement("div", {
        className: "qm-set-schedcard qm-set-apicard",
        key: "apicard",
        "data-qm-api-card": "1"
      }, [
        // 顶行：标题 + 徽标 + 启用开关
        t.createElement("div", { className: "qm-set-schedhead", key: "h" }, [
          t.createElement(
            "span",
            { key: "t", className: "qm-set-apititle" },
            "自定义 API 通知",
            t.createElement("span", { key: "badge", className: "qm-set-apibadge" }, "自定义渠道")
          ),
          t.createElement("button", {
            type: "button",
            key: "sw",
            role: "switch",
            className: "qm-set-apiswitch" + ($.enabled ? " on" : ""),
            "data-qm-api-switch": "1",
            "aria-checked": $.enabled ? "true" : "false",
            title: $.enabled ? "已启用" : "已停用",
            onClick: () => {
              $.enabled = !$.enabled, he("custom_api_enabled", $.enabled), O();
            }
          }, t.createElement("span", { className: "qm-set-apiswitchdot", key: "dot" }))
        ]),
        // 图例：必传星号说明（boss 核心诉求的可视化入口）
        t.createElement(
          "div",
          {
            key: "legend",
            className: "qm-apilegend",
            "data-qm-api-legend": "1"
          },
          "标 ",
          t.createElement("span", { key: "s", className: "qm-apireq" }, "*"),
          " 为必传项，未填写时无法发送测试。"
        ),
        B,
        // URL
        T("furl", "请求地址", t.createElement("input", {
          key: "url",
          type: "text",
          className: "qm-set-input",
          value: $.url,
          // 提示可写占位符：GET/POST 都支持（boss 2026-11-23 需求 2）
          placeholder: "https://api.example.com/hook 或 …/{{title}}/{{content}}",
          "data-qm-api-url": "1",
          onChange: (A) => {
            $.url = A && A.target ? String(A.target.value) : "", he("custom_api_url", $.url), O();
          }
        }), !0),
        // 请求方法 + Token 位置
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          T("fmethod", "请求方法", t.createElement("select", {
            key: "method",
            className: "qm-set-native",
            value: $.method,
            "data-qm-api-method": "1",
            onChange: (A) => {
              $.method = A && A.target ? String(A.target.value) : "post_json", he("custom_api_method", $.method), O();
            }
          }, [
            t.createElement("option", { key: "p", value: "post_json" }, "POST（JSON）"),
            t.createElement("option", { key: "g", value: "get_query" }, "GET（query 传参）")
          ])),
          T("ftpos", "Token 位置（可选）", t.createElement("select", {
            key: "tp",
            className: "qm-set-native",
            value: $.tokenPos,
            "data-qm-api-tokenpos": "1",
            onChange: (A) => {
              $.tokenPos = A && A.target ? String(A.target.value) : "none", he("custom_api_token_pos", $.tokenPos), O();
            }
          }, [
            t.createElement("option", { key: "n", value: "none" }, "不携带 token"),
            t.createElement("option", { key: "b", value: "bearer" }, "Authorization: Bearer 头"),
            t.createElement("option", { key: "q", value: "query" }, "query 参数 token=…")
          ]))
        ]),
        // Token
        T(
          "ftoken",
          $.tokenSet ? "Token（已设置，留空则不修改）" : "Token（可选）",
          t.createElement("input", {
            key: "tk",
            type: "password",
            className: "qm-set-input",
            value: $.token,
            placeholder: $.tokenSet ? "已保存，留空则不修改" : "选填",
            "data-qm-api-token": "1",
            onChange: (A) => {
              $.token = A && A.target ? String(A.target.value) : "", $.token && he("custom_api_token", $.token), O();
            }
          })
        ),
        // 高级模式开关
        t.createElement("div", { key: "advrow", className: "qm-apiadvrow" }, [
          t.createElement("label", { key: "l", style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            cursor: "pointer"
          } }, [
            t.createElement("input", {
              key: "c",
              type: "checkbox",
              checked: $.mode === "advanced",
              "data-qm-api-advmode": "1",
              onChange: (A) => {
                $.mode = A && A.target && A.target.checked ? "advanced" : "basic", he("custom_api_mode", $.mode), O();
              }
            }),
            "高级模式（自己写完整 body 模板）"
          ])
        ]),
        $.mode === "advanced" ? T("fbody", "body 模板", t.createElement("textarea", {
          key: "bd",
          className: "qm-apibody" + (I.indexOf("body 模板") >= 0 ? " bad" : ""),
          value: $.bodyTpl,
          placeholder: '{"msgtype":"text","text":{"content":"{{content}}"}}',
          "data-qm-api-body": "1",
          onChange: (A) => {
            $.bodyTpl = A && A.target ? String(A.target.value) : "", he("custom_api_body", $.bodyTpl), O();
          }
        }), !0) : null,
        // 系统字段（锁） + 自定义参数行（仅基础模式显示参数表）
        w,
        $.mode === "advanced" ? null : S,
        G,
        ze
      ])), s.push(qt(
        t,
        "e6",
        "单题分析超时",
        Vt(
          t,
          "sel4",
          b[Number(ot("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (A) => he("model_timeout_sec", h[A] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), s.push(qt(
        t,
        "d4",
        "等待提示阈值",
        Vt(
          t,
          "sel5",
          m[Number(ot("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (A) => he("wait_hint_sec", q[A] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const dt = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], K = {
        不保留: 0,
        "最近 50 条": 50,
        "最近 200 条（默认）": 200,
        "最近 500 条": 500,
        "最近 1000 条": 1e3
      }, xe = {
        0: "不保留",
        50: "最近 50 条",
        200: "最近 200 条（默认）",
        500: "最近 500 条",
        1e3: "最近 1000 条"
      }, M = Number(ot("gate_log_limit", 200, "global"));
      s.push(qt(
        t,
        "d5",
        "拦截记录",
        Vt(
          t,
          "sel6",
          xe[M] || "最近 200 条（默认）",
          dt,
          (A) => he("gate_log_limit", K[A] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const y = c.templates, I = c.tplEdit;
    if (s.push(qt(
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
      y.map((z, T) => {
        const _ = !!z.builtin, P = (String(z.note || z.desc || "").trim() || String(z.system || z.system_prompt || z.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), S = P.length > 90 ? P.slice(0, 90) + "…" : P;
        return t.createElement("div", { className: "qm-set-item", key: "i" + T }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(z.name || z.id)
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
              "data-qm-tpl-edit": String(z.id),
              onClick: () => {
                Yl(String(z.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (_ ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(z.id),
              disabled: _,
              title: _ ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                _ || nc(String(z.id));
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
          Xl();
        }
      }, "＋ 新建模板")
    ])), I) {
      const z = (T, _, w, P, S) => {
        var L, E;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + _ }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, T),
          w ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: P,
            "data-qm-tpl-field": _,
            placeholder: S,
            value: String(((L = c.tplEdit) == null ? void 0 : L[_]) || ""),
            onChange: (Z) => bs(_, Z && Z.target ? Z.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": _,
            placeholder: S,
            value: String(((E = c.tplEdit) == null ? void 0 : E[_]) || ""),
            onChange: (Z) => bs(_, Z && Z.target ? Z.target.value : "")
          })
        ]);
      };
      s.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (I.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          I.id ? "编辑模板：" + (I.name || I.id) : "新建模板"
        ),
        z("模板名称", "name", !1, 0, "如：简短结论版"),
        z(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        z(
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
              tc();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              ec();
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
    ], I = (_) => {
      const w = (c.notifyChannels || []).filter((P) => _ !== "bg" || String(P.channel) !== "browser").map((P) => ({
        value: String(P.channel || ""),
        label: String(P.label || P.channel || "")
      }));
      return [{ value: "", label: "跟随全局" }].concat(w);
    }, z = (_, w, P) => {
      const S = On[_];
      S && (S[w] = P, O());
    }, T = (_, w) => {
      const P = (L, E, Z) => {
        const te = {
          type: "time",
          key: L,
          value: E,
          style: { flex: "1 1 auto", minWidth: 0 },
          onChange: (G) => z(
            w,
            L,
            G && G.target ? String(G.target.value) : ""
          )
        };
        return te["data-qm-sched-" + Z] = String(w), t.createElement("input", te);
      }, S = (L, E, Z, te) => {
        const G = {
          key: L,
          className: "qm-set-native",
          value: E,
          onChange: (B) => z(
            w,
            L,
            B && B.target ? String(B.target.value) : ""
          )
        };
        return G["data-qm-sched-" + Z] = String(w), t.createElement("select", G, te.map((B, Q) => t.createElement("option", { key: "o" + Q, value: B.value }, B.label)));
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
            value: _.name,
            placeholder: "时段名称（如：工作时段）",
            "data-qm-sched-name": String(w),
            onChange: (L) => z(
              w,
              "name",
              L && L.target ? String(L.target.value) : ""
            )
          }),
          t.createElement("button", {
            type: "button",
            key: "del",
            className: "qm-set-scheddel",
            "data-qm-sched-del": String(w),
            title: "删除该时段（仅演示，不影响真实配置）",
            onClick: () => {
              On.splice(w, 1), O();
            }
          }, "删除")
        ]),
        // 中部网格：起止时间 / 答题方式 / PC 端渠道 / 后台渠道
        t.createElement("div", { className: "qm-set-schedgrid", key: "g" }, [
          t.createElement("div", { className: "qm-set-schedfield", key: "ftime" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "生效时间"),
            t.createElement("div", { className: "qm-set-schedtime", key: "t" }, [
              P("start", _.start, "start"),
              t.createElement("span", { key: "sep", className: "qm-set-schedtimesep" }, "至"),
              P("end", _.end, "end")
            ])
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fmode" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "答题方式"),
            S("mode", _.mode, "mode", y)
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fpc" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "PC 端通知渠道"),
            S("chPc", _.chPc, "pc", I("pc"))
          ]),
          t.createElement("div", { className: "qm-set-schedfield", key: "fbg" }, [
            t.createElement("span", { className: "qm-set-schedfieldlabel", key: "l" }, "后台通知渠道"),
            S("chBg", _.chBg, "bg", I("bg"))
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
    }, On.map((_, w) => T(_, w)))), s.push(t.createElement("button", {
      type: "button",
      key: "schedadd",
      className: "qm-set-btn qm-set-btnnew qm-set-schedadd",
      "data-qm-sched-add": "1",
      title: "添加一组时段（仅演示，不会保存）",
      onClick: () => {
        On.push({ name: "", start: "", end: "", mode: "ai", chPc: "", chBg: "" }), O();
      }
    }, "＋ 添加时段"));
  } else if (e === "stale") {
    const y = c.stale, I = y && y.rows || [], z = y && y.exceeded || [], T = y && y.within || [], _ = (y && y.blocking || []).length ? y.blocking : I.filter((G) => G && G.nature === "blocking"), w = (y && y.residual || []).length ? y.residual : I.filter((G) => G && G.nature !== "blocking"), P = _.filter(
      (G) => G && z.some(
        (B) => B.tool_call_id === G.tool_call_id
      )
    ), S = y ? y.threshold : null, L = na(S), E = S !== null && S <= 0, Z = !!(y && (y.busy || y.thrBusy)) || P.length === 0 || E, te = !!(y && (y.busy || y.thrBusy)) || w.length === 0;
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
            E ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${L} 仍无进展时，由后台自动释放`
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
            onChange: (G) => {
              const B = Number(G.target.value);
              c.draft.release_after_sec = B, c.stale.threshold = B, c.stale.msgKind = "", c.stale.msg = "已选择「" + na(B) + "」，点下方「保存」后生效", O();
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
      E ? t.createElement("div", {
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
            cl();
          }
        }, y && y.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「阻塞 ∩ 已超阈值」：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: Z,
          title: E ? "自动释放已关闭，请逐条释放" : P.length ? `释放全部 ${P.length} 条已超阈值的阻塞问卷（观察期内 ${T.length} 条不参与）` : "当前没有已超阈值的阻塞问卷",
          onClick: () => {
            dl();
          }
        }, P.length ? `全部释放（阻塞·已超阈值 ${P.length} 条）` : "全部释放"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn",
          key: "cleanup",
          "data-qm-stale-cleanup-all": "1",
          // 残留 = agent 已不在等待，清理是纯收尾、无副作用，可整批执行。
          disabled: te,
          title: w.length ? `清理全部 ${w.length} 条残留问卷（仅收尾状态，无副作用）` : "当前没有可清理的残留问卷",
          onClick: () => {
            pl();
          }
        }, w.length ? `全部清理（残留 ${w.length} 条）` : "全部清理")
      ])
    ])), y && y.msg && s.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": y.msgKind || "info"
    }, y.msg)), y && y.scanned && I.length === 0 && s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!y || !y.scanned) && (y && y.msg || s.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), I.length) {
      const B = {};
      z.forEach((M) => {
        B[M.tool_call_id] = !0;
      });
      const Q = (M, A) => {
        if (!M) return;
        const R = () => {
          c.stale.copied = A, O(), setTimeout(() => {
            c.stale.copied === A && (c.stale.copied = "", O());
          }, 1600);
        };
        try {
          const j = typeof navigator < "u" ? navigator : null;
          if (j && j.clipboard && j.clipboard.writeText)
            j.clipboard.writeText(M).then(R, R);
          else {
            const H = document.createElement("textarea");
            H.value = M, document.body.appendChild(H), H.select(), document.execCommand("copy"), document.body.removeChild(H), R();
          }
        } catch {
          R();
        }
      }, ze = (M, A) => {
        const R = !!M.terminable, j = !!B[M.tool_call_id], H = A === "blocking", X = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const ke = M.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${M.idle_text}，阈值 ${L}）${ke}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && Hr([M.tool_call_id]);
        }, ne = !!(y && y.copied) && y.copied === M.tool_call_id, Ae = (ke) => {
          const fe = Number(ke);
          if (!ke || !isFinite(fe) || fe <= 0) return "-";
          try {
            return new Date(fe * 1e3).toLocaleString();
          } catch {
            return "-";
          }
        }, de = (ke, fe, Le, Ke) => t.createElement("div", { className: "qm-set-stalemetaitem", key: ke }, [
          t.createElement("span", {
            className: "qm-set-stalemetalabel",
            key: "l"
          }, fe),
          t.createElement("span", {
            className: "qm-set-stalemetavalue",
            key: "v",
            ...Ke || {}
          }, Le)
        ]);
        return t.createElement("div", {
          className: "qm-set-stalecard",
          key: M.tool_call_id + ":" + A,
          "data-qm-stale-row": M.tool_call_id,
          "data-qm-stale-nature": A,
          "data-qm-stale-group": j ? "exceeded" : "within"
        }, [
          t.createElement("div", { className: "qm-set-stalecardhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-stalecardtitle", key: "t" },
              M.title || "(无标题)"
            ),
            // 把「它是什么性质/为什么没被自动释放」直接写在卡上，省得翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              M.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : M.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : M.reason_code === "no-future" ? "无唤醒句柄" : M.reason_code === "future-done" ? "已结束未收尾" : j ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            M.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { color: "#e67e22" }
            }, "正在作答") : null,
            M.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl"
            }, "模型分析中") : null
          ]),
          t.createElement("div", { className: "qm-set-stalecardmeta", key: "m" }, [
            de("agent", "归属", M.agent_id || "-"),
            // 会话 ID：卡片有空间，完整展示（不再截断），点击复制交互保留。
            de(
              "sid",
              "会话 ID",
              ne ? "✓ 会话 ID 已复制" : M.session_id || "-",
              {
                title: ne ? "已复制到剪贴板" : M.session_id ? "点击复制完整会话 ID：" + M.session_id : "",
                style: M.session_id ? {
                  cursor: "pointer",
                  textDecoration: "underline dotted",
                  color: ne ? "#16a34a" : void 0
                } : void 0,
                "data-qm-stale-copy": M.tool_call_id,
                onClick: () => {
                  Q(String(M.session_id || ""), M.tool_call_id);
                }
              }
            ),
            de("tcid", "问卷 ID", M.tool_call_id || "-"),
            de("idle", "挂起时长", M.idle_text || "-"),
            de("created", "发起时间", Ae(M.created_at)),
            de("mode", "作答模式", M.mode || "-")
          ]),
          t.createElement("div", { className: "qm-set-stalecardfoot", key: "f" }, [
            ...H ? [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "rel",
                "data-qm-stale-release": M.tool_call_id,
                disabled: !!(y && y.busy),
                title: j ? "释放该问卷（唤醒对应会话）" : "仍在观察期内，点击需二次确认",
                onClick: () => {
                  j ? Hr([M.tool_call_id]) : X();
                }
              }, j ? "释放" : "强制释放"),
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "term",
                "data-qm-stale-terminate": M.tool_call_id,
                // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
                disabled: !!(y && y.busy) || !R,
                title: R ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
                onClick: () => {
                  ul([M.tool_call_id]);
                }
              }, "终止会话")
            ] : [
              t.createElement("button", {
                type: "button",
                className: "qm-set-mini",
                key: "clean",
                "data-qm-stale-cleanup": M.tool_call_id,
                disabled: !!(y && y.busy),
                title: "清理该残留记录（仅收尾状态，无副作用）",
                onClick: () => {
                  Hr([M.tool_call_id], "清理");
                }
              }, "清理残留")
            ]
          ])
        ]);
      }, dt = (M, A, R, j, H) => {
        if (!j || !j.length) return null;
        const X = Math.max(1, Math.ceil(j.length / 5)), ne = Math.min(
          Math.max(0, Number(y[H]) || 0),
          X - 1
        ), Ae = j.slice(
          ne * 5,
          ne * 5 + 5
        ), de = [
          t.createElement("div", {
            className: "qm-set-stalesect",
            key: "sec",
            "data-qm-stale-section": M
          }, [
            t.createElement("span", {
              className: "qm-set-stalesecttitle",
              key: "t",
              "data-qm-stale-secttitle": M
            }, A),
            t.createElement("span", {
              className: "qm-set-stalesecthint",
              key: "h"
            }, R)
          ]),
          t.createElement("div", {
            className: "qm-set-stalecards",
            key: "cards",
            "data-qm-stale-cards": M
          }, Ae.map((ke) => ze(ke, M)))
        ];
        if (X > 1) {
          const ke = (Le) => {
            c.stale[H] = Le, O();
          }, fe = (Le, Ke, pt, _t) => t.createElement("button", {
            type: "button",
            className: "qm-set-mini",
            key: _t,
            "data-qm-stale-page": String(Ke),
            disabled: pt,
            onClick: () => {
              ke(Ke);
            }
          }, Le);
          de.push(t.createElement("div", {
            className: "qm-set-stalepager",
            key: "pg",
            "data-qm-stale-pager": M
          }, [
            fe("上一页", ne - 1, ne <= 0, "prev"),
            t.createElement("span", {
              className: "qm-set-stalepageinfo",
              key: "info",
              "data-qm-stale-pageinfo": String(ne + 1)
            }, `第 ${ne + 1} / ${X} 页（共 ${j.length} 条，每页 5 条）`),
            fe("下一页", ne + 1, ne >= X - 1, "next")
          ]));
        }
        return de;
      }, K = dt(
        "blocking",
        `🔴 正在阻塞会话（${_.length} 条）`,
        "agent 正在等待这些问卷的作答结果；「释放」会唤醒对应会话继续运行。",
        _,
        "page"
      ), xe = dt(
        "residual",
        `⚪ 异常残留（${w.length} 条）`,
        "对应会话已不在等待（历史孤儿 / 已结束未收尾）；「清理残留」仅收尾状态，无副作用。",
        w,
        "resPage"
      );
      K && s.push(...K), xe && s.push(...xe);
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, s);
}
function qc(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const a = Ze(), s = a && a.Modal, o = !t.tab, p = t.tab || "", i = Ys(p) ? "session" : "global", h = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    Xr.map((Q) => e.createElement("button", {
      key: Q.key,
      type: "button",
      className: "qm-set-tab" + (!o && Q.key === p ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(Q.key);
        } catch {
        }
      }
    }, Q.label))
  ), b = Xr.filter((Q) => Q.key === p)[0] || Xr[0], q = !!(t.cfg && t.cfg.has_session), m = q ? "session" : "default", k = q ? "会话模式" : "默认模式", g = e.createElement("div", {
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
  ]), I = b.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, b.hint) : null, z = null, T = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((Q) => e.createElement("div", {
    key: "sk" + Q,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: Q * 0.15 + "s"
    }
  }))) : null, _ = o ? T : wc(e, p, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), w = t.dirtyCount || 0, P = String(t.tab || ""), S = P === "session" || P === "default";
  let L;
  P === "schedule" ? L = "时段调度为界面预览（本版不保存，现有配置不受影响）" : S ? L = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : L = P === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const E = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
    e.createElement("div", { className: "qm-set-footleft", key: "fl" }, [
      w ? e.createElement("span", { className: "qm-set-dirty", key: "d" }, [
        e.createElement("span", { className: "qm-set-dirtydot", key: "dot" }),
        "有 " + w + " 项未保存"
      ]) : null,
      e.createElement("span", { className: "qm-set-scopetarget", key: "t" }, L)
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
          Qs(), O();
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
          Zs();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), Z = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, te = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, G = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    z,
    I,
    _,
    Z,
    te
  ]), B = e.createElement("div", { className: "qm-set-wrap" }, [
    y,
    h,
    G,
    E
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
  }, B) : e.createElement("div", {
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
    B
  ]);
}
function Sc(t) {
  try {
    const e = t && t.sender, n = Ne().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(ic, {
      R: n,
      onOpen: () => {
        rc();
      }
    });
    e.addPrefix(As, r, {
      id: "question-modal.settings-btn",
      order: fs
    }), console.log("[question-modal] settings entry registered (order " + fs + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function _c() {
  const t = Di();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return Hi(), t.toolRender(As, ts, Ql), console.log("[question-modal] registered via chat.toolRender for", ts), Sc(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!_c()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
