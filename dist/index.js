var fo = Object.defineProperty;
var us = (t) => {
  throw TypeError(t);
};
var mo = (t, e, n) => e in t ? fo(t, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : t[e] = n;
var U = (t, e, n) => mo(t, typeof e != "symbol" ? e + "" : e, n), go = (t, e, n) => e.has(t) || us("Cannot " + n);
var fs = (t, e, n) => e.has(t) ? us("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(t) : e.set(t, n);
var an = (t, e, n) => (go(t, e, "access private method"), n);
function kr() {
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
let Ke = kr();
function Ls(t) {
  Ke = t;
}
const Bs = /[&<>"']/, ho = new RegExp(Bs.source, "g"), Ps = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, bo = new RegExp(Ps.source, "g"), yo = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, ms = (t) => yo[t];
function ue(t, e) {
  if (e) {
    if (Bs.test(t))
      return t.replace(ho, ms);
  } else if (Ps.test(t))
    return t.replace(bo, ms);
  return t;
}
const xo = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function ko(t) {
  return t.replace(xo, (e, n) => (n = n.toLowerCase(), n === "colon" ? ":" : n.charAt(0) === "#" ? n.charAt(1) === "x" ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1)) : ""));
}
const wo = /(^|[^\[])\^/g;
function F(t, e) {
  let n = typeof t == "string" ? t : t.source;
  e = e || "";
  const r = {
    replace: (s, a) => {
      let o = typeof a == "string" ? a : a.source;
      return o = o.replace(wo, "$1"), n = n.replace(s, o), r;
    },
    getRegex: () => new RegExp(n, e)
  };
  return r;
}
function gs(t) {
  try {
    t = encodeURI(t).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return t;
}
const Ot = { exec: () => null };
function hs(t, e) {
  const n = t.replace(/\|/g, (a, o, d) => {
    let i = !1, y = o;
    for (; --y >= 0 && d[y] === "\\"; )
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
function on(t, e, n) {
  const r = t.length;
  if (r === 0)
    return "";
  let s = 0;
  for (; s < r && t.charAt(r - s - 1) === e; )
    s++;
  return t.slice(0, r - s);
}
function vo(t, e) {
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
function bs(t, e, n, r) {
  const s = e.href, a = e.title ? ue(e.title) : null, o = t[1].replace(/\\([\[\]])/g, "$1");
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
    text: ue(o)
  };
}
function _o(t, e) {
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
class bn {
  // set by the lexer
  constructor(e) {
    U(this, "options");
    U(this, "rules");
    // set by the lexer
    U(this, "lexer");
    this.options = e || Ke;
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
        text: this.options.pedantic ? r : on(r, `
`)
      };
    }
  }
  fences(e) {
    const n = this.rules.block.fences.exec(e);
    if (n) {
      const r = n[0], s = _o(r, n[3] || "");
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
        const s = on(r, "#");
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
      r = on(r.replace(/^ *>[ \t]?/gm, ""), `
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
      let d = "", i = "", y = !1;
      for (; e; ) {
        let h = !1;
        if (!(n = o.exec(e)) || this.rules.block.hr.test(e))
          break;
        d = n[0], e = e.substring(d.length);
        let k = n[2].split(`
`, 1)[0].replace(/^\t+/, (S) => " ".repeat(3 * S.length)), f = e.split(`
`, 1)[0], w = 0;
        this.options.pedantic ? (w = 2, i = k.trimStart()) : (w = n[2].search(/[^ ]/), w = w > 4 ? 1 : w, i = k.slice(w), w += n[1].length);
        let m = !1;
        if (!k && /^ *$/.test(f) && (d += f + `
`, e = e.substring(f.length + 1), h = !0), !h) {
          const S = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), _ = new RegExp(`^ {0,${Math.min(3, w - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), q = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:\`\`\`|~~~)`), C = new RegExp(`^ {0,${Math.min(3, w - 1)}}#`);
          for (; e; ) {
            const I = e.split(`
`, 1)[0];
            if (f = I, this.options.pedantic && (f = f.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), q.test(f) || C.test(f) || S.test(f) || _.test(e))
              break;
            if (f.search(/[^ ]/) >= w || !f.trim())
              i += `
` + f.slice(w);
            else {
              if (m || k.search(/[^ ]/) >= 4 || q.test(k) || C.test(k) || _.test(k))
                break;
              i += `
` + f;
            }
            !m && !f.trim() && (m = !0), d += I + `
`, e = e.substring(I.length + 1), k = f.slice(w);
          }
        }
        a.loose || (y ? a.loose = !0 : /\n *\n *$/.test(d) && (y = !0));
        let b = null, x;
        this.options.gfm && (b = /^\[[ xX]\] /.exec(i), b && (x = b[0] !== "[ ] ", i = i.replace(/^\[[ xX]\] +/, ""))), a.items.push({
          type: "list_item",
          raw: d,
          task: !!b,
          checked: x,
          loose: !1,
          text: i,
          tokens: []
        }), a.raw += d;
      }
      a.items[a.items.length - 1].raw = d.trimEnd(), a.items[a.items.length - 1].text = i.trimEnd(), a.raw = a.raw.trimEnd();
      for (let h = 0; h < a.items.length; h++)
        if (this.lexer.state.top = !1, a.items[h].tokens = this.lexer.blockTokens(a.items[h].text, []), !a.loose) {
          const k = a.items[h].tokens.filter((w) => w.type === "space"), f = k.length > 0 && k.some((w) => /\n.*\n/.test(w.raw));
          a.loose = f;
        }
      if (a.loose)
        for (let h = 0; h < a.items.length; h++)
          a.items[h].loose = !0;
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
    const r = hs(n[1]), s = n[2].replace(/^\||\| *$/g, "").split("|"), a = n[3] && n[3].trim() ? n[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(hs(d, o.header.length).map((i) => ({
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
        text: ue(n[1])
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
        const o = on(r.slice(0, -1), "\\");
        if ((r.length - o.length) % 2 === 0)
          return;
      } else {
        const o = vo(n[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(r) ? s = s.slice(1) : s = s.slice(1, -1)), bs(n, {
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
      return bs(r, a, r[0], this.lexer);
    }
  }
  emStrong(e, n, r = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || s[3] && r.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !r || this.rules.inline.punctuation.exec(r)) {
      const o = [...s[0]].length - 1;
      let d, i, y = o, h = 0;
      const k = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (k.lastIndex = 0, n = n.slice(-1 * e.length + o); (s = k.exec(n)) != null; ) {
        if (d = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !d)
          continue;
        if (i = [...d].length, s[3] || s[4]) {
          y += i;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + i) % 3)) {
          h += i;
          continue;
        }
        if (y -= i, y > 0)
          continue;
        i = Math.min(i, i + y + h);
        const f = [...s[0]][0].length, w = e.slice(0, o + s.index + f + i);
        if (Math.min(o, i) % 2) {
          const b = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: b,
            tokens: this.lexer.inlineTokens(b)
          };
        }
        const m = w.slice(2, -2);
        return {
          type: "strong",
          raw: w,
          text: m,
          tokens: this.lexer.inlineTokens(m)
        };
      }
    }
  }
  codespan(e) {
    const n = this.rules.inline.code.exec(e);
    if (n) {
      let r = n[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(r), a = /^ /.test(r) && / $/.test(r);
      return s && a && (r = r.substring(1, r.length - 1)), r = ue(r, !0), {
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
      return n[2] === "@" ? (r = ue(n[1]), s = "mailto:" + r) : (r = ue(n[1]), s = r), {
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
        s = ue(n[0]), a = "mailto:" + s;
      else {
        let o;
        do
          o = n[0], n[0] = ((r = this.rules.inline._backpedal.exec(n[0])) == null ? void 0 : r[0]) ?? "";
        while (o !== n[0]);
        s = ue(n[0]), n[1] === "www." ? a = "http://" + n[0] : a = n[0];
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
      return this.lexer.state.inRawBlock ? r = n[0] : r = ue(n[0]), {
        type: "text",
        raw: n[0],
        text: r
      };
    }
  }
}
const qo = /^(?: *(?:\n|$))+/, So = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, Eo = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Bt = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, To = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, js = /(?:[*+-]|\d{1,9}[.)])/, Ds = F(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, js).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), wr = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ao = /^[^\n]+/, vr = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Co = F(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", vr).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Io = F(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, js).getRegex(), Sn = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", _r = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, No = F("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", _r).replace("tag", Sn).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Fs = F(wr).replace("hr", Bt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Sn).getRegex(), zo = F(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Fs).getRegex(), qr = {
  blockquote: zo,
  code: So,
  def: Co,
  fences: Eo,
  heading: To,
  hr: Bt,
  html: No,
  lheading: Ds,
  list: Io,
  newline: qo,
  paragraph: Fs,
  table: Ot,
  text: Ao
}, ys = F("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Bt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Sn).getRegex(), $o = {
  ...qr,
  table: ys,
  paragraph: F(wr).replace("hr", Bt).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ys).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Sn).getRegex()
}, Oo = {
  ...qr,
  html: F(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", _r).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ot,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: F(wr).replace("hr", Bt).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Ds).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Ws = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ro = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Hs = /^( {2,}|\\)\n(?!\s*$)/, Mo = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Pt = "\\p{P}\\p{S}", Lo = F(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Pt).getRegex(), Bo = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Po = F(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Pt).getRegex(), jo = F("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Pt).getRegex(), Do = F("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Pt).getRegex(), Fo = F(/\\([punct])/, "gu").replace(/punct/g, Pt).getRegex(), Wo = F(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ho = F(_r).replace("(?:-->|$)", "-->").getRegex(), Uo = F("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ho).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), yn = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Go = F(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", yn).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Us = F(/^!?\[(label)\]\[(ref)\]/).replace("label", yn).replace("ref", vr).getRegex(), Gs = F(/^!?\[(ref)\](?:\[\])?/).replace("ref", vr).getRegex(), Jo = F("reflink|nolink(?!\\()", "g").replace("reflink", Us).replace("nolink", Gs).getRegex(), Sr = {
  _backpedal: Ot,
  // only used for GFM url
  anyPunctuation: Fo,
  autolink: Wo,
  blockSkip: Bo,
  br: Hs,
  code: Ro,
  del: Ot,
  emStrongLDelim: Po,
  emStrongRDelimAst: jo,
  emStrongRDelimUnd: Do,
  escape: Ws,
  link: Go,
  nolink: Gs,
  punctuation: Lo,
  reflink: Us,
  reflinkSearch: Jo,
  tag: Uo,
  text: Mo,
  url: Ot
}, Zo = {
  ...Sr,
  link: F(/^!?\[(label)\]\((.*?)\)/).replace("label", yn).getRegex(),
  reflink: F(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", yn).getRegex()
}, br = {
  ...Sr,
  escape: F(Ws).replace("])", "~|])").getRegex(),
  url: F(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Qo = {
  ...br,
  br: F(Hs).replace("{2,}", "*").getRegex(),
  text: F(br.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, ln = {
  normal: qr,
  gfm: $o,
  pedantic: Oo
}, Tt = {
  normal: Sr,
  gfm: br,
  breaks: Qo,
  pedantic: Zo
};
class Ee {
  constructor(e) {
    U(this, "tokens");
    U(this, "options");
    U(this, "state");
    U(this, "tokenizer");
    U(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Ke, this.options.tokenizer = this.options.tokenizer || new bn(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const n = {
      block: ln.normal,
      inline: Tt.normal
    };
    this.options.pedantic ? (n.block = ln.pedantic, n.inline = Tt.pedantic) : this.options.gfm && (n.block = ln.gfm, this.options.breaks ? n.inline = Tt.breaks : n.inline = Tt.gfm), this.tokenizer.rules = n;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: ln,
      inline: Tt
    };
  }
  /**
   * Static Lex Method
   */
  static lex(e, n) {
    return new Ee(n).lex(e);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(e, n) {
    return new Ee(n).inlineTokens(e);
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
    this.options.pedantic ? e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "") : e = e.replace(/^( *)(\t+)/gm, (d, i, y) => i + "    ".repeat(y.length));
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
          let y;
          this.options.extensions.startBlock.forEach((h) => {
            y = h.call({ lexer: this }, i), typeof y == "number" && y >= 0 && (d = Math.min(d, y));
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
    let r, s, a, o = e, d, i, y;
    if (this.tokens.links) {
      const h = Object.keys(this.tokens.links);
      if (h.length > 0)
        for (; (d = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          h.includes(d[0].slice(d[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (d = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, d.index) + "[" + "a".repeat(d[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (d = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, d.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; e; )
      if (i || (y = ""), i = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((h) => (r = h.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1))) {
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
        if (r = this.tokenizer.emStrong(e, o, y)) {
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
          let h = 1 / 0;
          const k = e.slice(1);
          let f;
          this.options.extensions.startInline.forEach((w) => {
            f = w.call({ lexer: this }, k), typeof f == "number" && f >= 0 && (h = Math.min(h, f));
          }), h < 1 / 0 && h >= 0 && (a = e.substring(0, h + 1));
        }
        if (r = this.tokenizer.inlineText(a)) {
          e = e.substring(r.raw.length), r.raw.slice(-1) !== "_" && (y = r.raw.slice(-1)), i = !0, s = n[n.length - 1], s && s.type === "text" ? (s.raw += r.raw, s.text += r.text) : n.push(r);
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
    return n;
  }
}
class xn {
  constructor(e) {
    U(this, "options");
    this.options = e || Ke;
  }
  code(e, n, r) {
    var a;
    const s = (a = (n || "").match(/^\S*/)) == null ? void 0 : a[0];
    return e = e.replace(/\n$/, "") + `
`, s ? '<pre><code class="language-' + ue(s) + '">' + (r ? e : ue(e, !0)) + `</code></pre>
` : "<pre><code>" + (r ? e : ue(e, !0)) + `</code></pre>
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
    const s = gs(e);
    if (s === null)
      return r;
    e = s;
    let a = '<a href="' + e + '"';
    return n && (a += ' title="' + n + '"'), a += ">" + r + "</a>", a;
  }
  image(e, n, r) {
    const s = gs(e);
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
class Er {
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
class Te {
  constructor(e) {
    U(this, "options");
    U(this, "renderer");
    U(this, "textRenderer");
    this.options = e || Ke, this.options.renderer = this.options.renderer || new xn(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new Er();
  }
  /**
   * Static Parse Method
   */
  static parse(e, n) {
    return new Te(n).parse(e);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(e, n) {
    return new Te(n).parseInline(e);
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
          r += this.renderer.heading(this.parseInline(o.tokens), o.depth, ko(this.parseInline(o.tokens, this.textRenderer)));
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
          for (let h = 0; h < o.header.length; h++)
            i += this.renderer.tablecell(this.parseInline(o.header[h].tokens), { header: !0, align: o.align[h] });
          d += this.renderer.tablerow(i);
          let y = "";
          for (let h = 0; h < o.rows.length; h++) {
            const k = o.rows[h];
            i = "";
            for (let f = 0; f < k.length; f++)
              i += this.renderer.tablecell(this.parseInline(k[f].tokens), { header: !1, align: o.align[f] });
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
          let h = "";
          for (let k = 0; k < o.items.length; k++) {
            const f = o.items[k], w = f.checked, m = f.task;
            let b = "";
            if (f.task) {
              const x = this.renderer.checkbox(!!w);
              y ? f.tokens.length > 0 && f.tokens[0].type === "paragraph" ? (f.tokens[0].text = x + " " + f.tokens[0].text, f.tokens[0].tokens && f.tokens[0].tokens.length > 0 && f.tokens[0].tokens[0].type === "text" && (f.tokens[0].tokens[0].text = x + " " + f.tokens[0].tokens[0].text)) : f.tokens.unshift({
                type: "text",
                text: x + " "
              }) : b += x + " ";
            }
            b += this.parse(f.tokens, y), h += this.renderer.listitem(b, m, !!w);
          }
          r += this.renderer.list(h, d, i);
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
class Rt {
  constructor(e) {
    U(this, "options");
    this.options = e || Ke;
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
U(Rt, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var Qe, yr, Js;
class Ko {
  constructor(...e) {
    fs(this, Qe);
    U(this, "defaults", kr());
    U(this, "options", this.setOptions);
    U(this, "parse", an(this, Qe, yr).call(this, Ee.lex, Te.parse));
    U(this, "parseInline", an(this, Qe, yr).call(this, Ee.lexInline, Te.parseInline));
    U(this, "Parser", Te);
    U(this, "Renderer", xn);
    U(this, "TextRenderer", Er);
    U(this, "Lexer", Ee);
    U(this, "Tokenizer", bn);
    U(this, "Hooks", Rt);
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
            for (const y of i)
              r = r.concat(this.walkTokens(y.tokens, n));
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
            const y = d[i].flat(1 / 0);
            r = r.concat(this.walkTokens(y, n));
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
        const a = this.defaults.renderer || new xn(this.defaults);
        for (const o in r.renderer) {
          if (!(o in a))
            throw new Error(`renderer '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.renderer[d], y = a[d];
          a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = y.apply(a, h)), k || "";
          };
        }
        s.renderer = a;
      }
      if (r.tokenizer) {
        const a = this.defaults.tokenizer || new bn(this.defaults);
        for (const o in r.tokenizer) {
          if (!(o in a))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const d = o, i = r.tokenizer[d], y = a[d];
          a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = y.apply(a, h)), k;
          };
        }
        s.tokenizer = a;
      }
      if (r.hooks) {
        const a = this.defaults.hooks || new Rt();
        for (const o in r.hooks) {
          if (!(o in a))
            throw new Error(`hook '${o}' does not exist`);
          if (o === "options")
            continue;
          const d = o, i = r.hooks[d], y = a[d];
          Rt.passThroughHooks.has(o) ? a[d] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(i.call(a, h)).then((f) => y.call(a, f));
            const k = i.call(a, h);
            return y.call(a, k);
          } : a[d] = (...h) => {
            let k = i.apply(a, h);
            return k === !1 && (k = y.apply(a, h)), k;
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
    return Ee.lex(e, n ?? this.defaults);
  }
  parser(e, n) {
    return Te.parse(e, n ?? this.defaults);
  }
}
Qe = new WeakSet(), yr = function(e, n) {
  return (r, s) => {
    const a = { ...s }, o = { ...this.defaults, ...a };
    this.defaults.async === !0 && a.async === !1 && (o.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), o.async = !0);
    const d = an(this, Qe, Js).call(this, !!o.silent, !!o.async);
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
      let y = n(i, o);
      return o.hooks && (y = o.hooks.postprocess(y)), y;
    } catch (i) {
      return d(i);
    }
  };
}, Js = function(e, n) {
  return (r) => {
    if (r.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
      const s = "<p>An error occurred:</p><pre>" + ue(r.message + "", !0) + "</pre>";
      return n ? Promise.resolve(s) : s;
    }
    if (n)
      return Promise.reject(r);
    throw r;
  };
};
const Ze = new Ko();
function D(t, e) {
  return Ze.parse(t, e);
}
D.options = D.setOptions = function(t) {
  return Ze.setOptions(t), D.defaults = Ze.defaults, Ls(D.defaults), D;
};
D.getDefaults = kr;
D.defaults = Ke;
D.use = function(...t) {
  return Ze.use(...t), D.defaults = Ze.defaults, Ls(D.defaults), D;
};
D.walkTokens = function(t, e) {
  return Ze.walkTokens(t, e);
};
D.parseInline = Ze.parseInline;
D.Parser = Te;
D.parser = Te.parse;
D.Renderer = xn;
D.TextRenderer = Er;
D.Lexer = Ee;
D.lexer = Ee.lex;
D.Tokenizer = bn;
D.Hooks = Rt;
D.parse = D;
D.options;
D.setOptions;
D.use;
D.walkTokens;
D.parseInline;
Te.parse;
Ee.lex;
const Zs = "question-modal", xs = "question_modal", sr = 3, ks = "gate-v2@2026.10.21";
function we() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.host) || {};
}
function Xo() {
  var t;
  return ((t = window.QwenPaw) == null ? void 0 : t.chat) || null;
}
function $e() {
  return we().antd || {};
}
function Vo() {
  return we().antdIcons || {};
}
const Yo = ["FormOutlined", "ProfileOutlined", "CheckSquareOutlined"];
function ar(t) {
  const e = Vo();
  for (const n of Yo) {
    const r = e[n];
    if (r)
      return t.createElement(r, {
        style: { color: "var(--app-accent, #ff7f16)", fontSize: 15 }
      });
  }
  return t.createElement("span", { style: { color: "var(--app-accent, #ff7f16)" } }, "📋");
}
function ei() {
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
function M(t) {
  try {
    const e = we();
    if (typeof e.getApiUrl == "function") return e.getApiUrl(t);
  } catch {
  }
  return "/api" + t;
}
let En = "", Qs = "";
function Tr(t, e) {
  t && (Qs = t), e && (En = e);
}
function L() {
  const t = { "Content-Type": "application/json" };
  try {
    const e = we(), n = typeof e.getApiToken == "function" ? e.getApiToken() : "";
    n && (t.Authorization = "Bearer " + n);
    let r = typeof e.getSelectedAgentId == "function" ? e.getSelectedAgentId() : "";
    r || (r = En), r && (t["X-Agent-Id"] = r);
  } catch {
  }
  return t;
}
function Tn() {
  try {
    const e = we();
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
  return Qs;
}
globalThis.__qmSessionProbe = Tn;
function At() {
  try {
    const t = we(), e = typeof t.getSelectedAgentId == "function" && t.getSelectedAgentId() || "";
    if (e) return e;
  } catch {
  }
  return En;
}
const or = {};
async function ti(t, e, n) {
  if (typeof window > "u" || or[t]) return "skipped";
  try {
    const a = "qm:v1:notified:" + t;
    if (window.localStorage && window.localStorage.getItem(a) === "1")
      return or[t] = !0, "skipped";
    window.localStorage.setItem(a, "1");
  } catch {
  }
  or[t] = !0;
  const r = n > 0 ? "「" + e + "」有 " + n + " 道题等你作答" : "「" + e + "」等你作答", s = window.Notification;
  if (!s) return "inpage";
  try {
    if (s.permission === "default" && await new Promise((d) => {
      let i = !1;
      const y = (h) => {
        i || (i = !0, d(h));
      };
      try {
        const h = s.requestPermission((k) => y(k));
        h && typeof h.then == "function" && h.then(y).catch(() => y("denied"));
      } catch {
        y("denied");
      }
      setTimeout(() => y(s.permission || "denied"), 8e3);
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
function Y(t) {
  const e = Mt(t);
  return e && e.session_id ? e.session_id : Tn();
}
const ir = 180, ni = 20, Ks = 6e3, ri = 60, si = 8;
function ai() {
  try {
    return typeof document < "u" && document && typeof document.querySelectorAll == "function" ? document : null;
  } catch {
    return null;
  }
}
const oi = /[\s\-\u2013\u2014\u2015_\u00b7\u2022\u2026\u22ef\u2588-\u2593\u258b-\u258d\u25a0-\u25a3|\u23b8]+/g;
function ws(t) {
  try {
    return String(t || "").replace(oi, "").length;
  } catch {
    return 0;
  }
}
function vs(t) {
  const e = ai();
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
    r = ws((e.body || e.documentElement || {}).textContent);
  } catch {
    return -1;
  }
  return r - ws(n.textContent);
}
function ii(t) {
  return t === "stalled" ? "⏳ 已提交，模型处理中 · 已越过阻塞阈值，多为模型限流/报错；若发新消息报「A task is already running」，点右侧「释放阻塞」" : "⏳ 已提交，模型处理中";
}
function li(t) {
  return !t.submittedAt || t.deadReason || t.skippedAll || !t.observed || t.releasedNote || t.retired ? null : { phase: t.pastSoft ? "stalled" : "waiting" };
}
function _s(t) {
  try {
    const e = typeof window < "u" ? window : null;
    if (e && typeof e.requestIdleCallback == "function") {
      e.requestIdleCallback(t, { timeout: Ks });
      return;
    }
  } catch {
  }
  try {
    setTimeout(t, 0);
  } catch {
  }
}
const ci = "qm:v1:analysis:global", di = "qm:v1:analysis:", pi = {
  mode: "manual",
  modelId: "",
  withContext: !1,
  parallel: !1
};
function Ct(t) {
  return t === "ai" || t === "recommend" ? t : "manual";
}
function ui(t) {
  if (!t || typeof t != "object") return { ...pi };
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
function fi() {
  try {
    const t = [];
    for (let e = 0; e < localStorage.length; e++) {
      const n = localStorage.key(e);
      n && n.indexOf(di) === 0 && n !== ci && t.push(n);
    }
    t.forEach((e) => localStorage.removeItem(e));
  } catch {
  }
}
async function mi() {
  try {
    const t = await fetch(M("/question-modal/prefs"), { headers: L() });
    if (!t.ok) return null;
    const e = await t.json();
    return !e || !e.ok || !e.prefs ? null : ui(e.prefs);
  } catch {
    return null;
  }
}
async function Ar() {
  try {
    const t = await fetch(M("/question-modal/templates"), { headers: L() });
    if (!t.ok) return { items: [], defaultId: "" };
    const e = await t.json();
    return { items: e && Array.isArray(e.items) ? e.items : [], defaultId: e && e.default_id || "" };
  } catch {
    return { items: [], defaultId: "" };
  }
}
async function cn(t, e, n) {
  if (!t) return null;
  try {
    const r = await fetch(M("/question-modal/survey-action"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify({
        tool_call_id: t,
        action: e,
        payload: n,
        origin: qn()
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
async function gi(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      M("/question-modal/survey-state?tool_call_id=" + encodeURIComponent(t)),
      { headers: L() }
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
function hi(t, e) {
  if (!t) return () => {
  };
  let n = !1, r = null, s = 0, a = null, o = 0, d = !1, i = 0, y = 0, h = null;
  const k = (m) => {
    n || h === m || (h = m, e.onStatus(m));
  }, f = () => {
    if (!n)
      try {
        const m = typeof AbortController < "u" ? new AbortController() : null, b = M("/question-modal/survey-stream") + "?tool_call_id=" + encodeURIComponent(t) + "&since_rev=" + o, x = { headers: L() };
        m && (x.signal = m.signal), r = () => {
          try {
            m && m.abort();
          } catch {
          }
        }, fetch(b, x).then(async (_) => {
          const q = Hi(_);
          if (!_.ok || !_.body || q) {
            if (_.status === 404 || _.status === 501 || _.status === 405) {
              d = !0, k(!1);
              return;
            }
            throw q && (i += 1), new Error(q ? "blocked" : "HTTP " + _.status);
          }
          s = 0, i = 0, k(!0);
          const C = _.body.getReader(), I = new TextDecoder();
          let z = "";
          const A = () => {
            C.read().then(({ done: P, value: $ }) => {
              if (P) {
                w();
                return;
              }
              z += I.decode($, { stream: !0 });
              let W;
              for (; (W = z.indexOf(`

`)) >= 0; ) {
                const fe = z.slice(0, W);
                z = z.slice(W + 2), fe.split(`
`).forEach((ve) => {
                  if (!ve.startsWith("data: ")) return;
                  let H = null;
                  try {
                    H = JSON.parse(ve.slice(6));
                  } catch {
                    return;
                  }
                  H && (H.kind === "snapshot" ? (o = Math.max(o, parseInt(H.rev || 0, 10) || 0), e.onSnapshot(o, H.state || null)) : H.kind === "change" && (o = Math.max(o, parseInt(H.rev || 0, 10) || 0), e.onChange(H)));
                });
              }
              n || A();
            }).catch(() => {
              w();
            });
          };
          A();
        }).catch(() => {
          w();
        });
      } catch {
        w();
      }
  }, w = () => {
    if (n || d)
      return;
    if (k(!1), i += 1, y || (y = Date.now()), i >= oa) {
      if (Date.now() - (y || Date.now()) >= la) {
        d = !0, k(!1);
        return;
      }
      a = setTimeout(f, ia);
      return;
    }
    s = Math.min(s + 1, 6);
    const m = Math.min(1e4, 500 * Math.pow(2, s));
    a = setTimeout(f, m);
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
    h = null, e.onStatus(!1);
  };
}
async function lr(t, e, n) {
  try {
    return (await fetch(M("/question-modal/session-prefs"), {
      method: "POST",
      headers: L(),
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
let lt = null;
const bi = 1500;
async function Lt(t, e, n, r) {
  const s = t || "", a = "&session_id=" + encodeURIComponent(n || "") + "&agent_id=" + encodeURIComponent(r || "");
  if (!e && lt && lt.chatId === s && Date.now() - lt.at < bi)
    return lt.data;
  try {
    const o = M(
      "/question-modal/effective-config?chat_id=" + encodeURIComponent(s) + a
    ), d = await fetch(o, { headers: L() });
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
    return lt = { chatId: s, at: Date.now(), data: y }, y;
  } catch {
    return null;
  }
}
function Xs() {
  lt = null;
}
async function Cr() {
  const t = await fetch(
    M("/question-modal/stale-surveys"),
    { headers: L() }
  );
  if (!t.ok) throw new Error("HTTP " + t.status);
  return await t.json();
}
function Ir(t) {
  const e = c.stale;
  e.exceeded = t && t.exceeded || [], e.within = t && t.within || [], e.rows = t && t.items || e.exceeded.concat(e.within), e.threshold = t && typeof t.threshold_sec == "number" ? t.threshold_sec : null, e.scanned = !0;
}
function xr(t) {
  return t == null ? "加载中…" : t <= 0 ? "已关闭自动释放" : t % 3600 === 0 ? `${t / 3600} 小时` : `${Math.round(t / 60)} 分钟`;
}
async function Vs(t) {
  const e = await fetch(M("/question-modal/stale-surveys/release"), {
    method: "POST",
    headers: L(),
    body: JSON.stringify(t)
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function yi(t) {
  const e = await fetch(M("/question-modal/stale-surveys/terminate"), {
    method: "POST",
    headers: L(),
    body: JSON.stringify({ tool_call_ids: t })
  }), n = await e.json().catch(() => ({}));
  if (!e.ok) throw new Error(n && n.detail || "HTTP " + e.status);
  return n;
}
async function xi() {
  c.stale.busy = !0, c.stale.msgKind = "info", c.stale.msg = "正在扫描…", N();
  const t = Date.now();
  try {
    const e = await Cr();
    Ir(e), c.stale.page = 0;
    const n = c.stale.rows.length, r = c.stale.exceeded.length, s = c.stale.within.length, a = Date.now() - t;
    c.stale.msgKind = "ok";
    const o = xr(c.stale.threshold);
    c.stale.msg = n > 0 ? `扫描完成：共 ${n} 条挂起（已超阈值 ${r} 条、观察期内 ${s} 条；阈值 ${o}，耗时 ${a}ms）` : `扫描完成：没有挂起的问卷（阈值 ${o}，耗时 ${a}ms）`;
  } catch (e) {
    c.stale.rows = [], c.stale.exceeded = [], c.stale.within = [], c.stale.scanned = !1, c.stale.msgKind = "error", c.stale.msg = "扫描失败：" + (e && e.message ? e.message : String(e)) + "（这不代表没有挂起项，请重试）";
  } finally {
    c.stale.busy = !1, N();
  }
}
async function qs(t) {
  c.stale.busy = !0, c.stale.msg = "", N();
  try {
    const e = await Vs({ tool_call_ids: t }), n = Number(e && e.released) || 0, r = Number(e && e.already) || 0, s = Number(e && e.failed) || 0;
    c.stale.msgKind = s > 0 ? "warn" : "ok", c.stale.msg = s > 0 ? `释放 ${n} 条，${s} 条未成功（见日志）` + (r ? `；${r} 条此前已释放` : "") : n > 0 ? `已释放 ${n} 条问卷` + (r ? `；${r} 条此前已释放` : "") : `无需释放：${r || t.length} 条此前已释放`;
    const a = await Cr();
    Ir(a);
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "释放失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, N();
  }
}
async function ki() {
  c.stale.busy = !0, c.stale.msg = "", N();
  try {
    const t = await Vs({ all: !0 }), e = Number(t && t.released) || 0, n = Number(t && t.failed) || 0, r = Number(t && t.already) || 0, s = Number(t && t.requested) || 0;
    c.stale.msgKind = n > 0 ? "warn" : "ok", c.stale.msg = s === 0 ? "当前没有可释放项" : n > 0 ? `释放 ${e}/${s} 条，${n} 条未成功（见日志）` : `已释放 ${e} 条问卷` + (r ? `；${r} 条此前已释放` : "");
    const a = await Cr();
    Ir(a);
  } catch (t) {
    c.stale.msgKind = "error", c.stale.msg = "批量释放失败：" + (t && t.message ? t.message : String(t));
  } finally {
    c.stale.busy = !1, N();
  }
}
async function wi(t) {
  c.stale.busy = !0, c.stale.msg = "", N();
  try {
    const e = await yi(t), n = e && e.results || [], r = n.filter((a) => a && a.stopped).length, s = n.filter((a) => a && !a.stopped).length;
    c.stale.msgKind = r > 0 ? "ok" : "warn", c.stale.msg = r > 0 ? `已终止 ${r} 个会话` + (s ? `；${s} 个会话已不存在` : "") : `${s} 个会话已不存在或已空闲，无需终止（问卷数据仍可用「释放」清理）`;
  } catch (e) {
    c.stale.msgKind = "error", c.stale.msg = "终止会话失败：" + (e && e.message ? e.message : String(e));
  } finally {
    c.stale.busy = !1, N();
  }
}
async function Ys(t) {
  try {
    const e = await fetch(M("/question-modal/templates"), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(t)
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [], saved: n && n.saved } : { ok: !1, error: n && n.error || "保存失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "保存请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ea(t) {
  try {
    const e = await fetch(M("/question-modal/templates/" + encodeURIComponent(t)), {
      method: "DELETE",
      headers: L()
    }), n = await e.json().catch(() => ({}));
    return e.ok ? { ok: !0, items: n && n.items || [] } : { ok: !1, error: n && n.error || "删除失败（" + e.status + "）" };
  } catch (e) {
    return { ok: !1, error: "删除请求失败：" + (e && e.message ? e.message : e) };
  }
}
async function ta() {
  try {
    const t = await fetch(M("/models"), { headers: L() });
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
function vi(t) {
  if (!t) return "";
  try {
    return String(D.parse(t, { async: !1, breaks: !0 }));
  } catch {
    return "<pre style='white-space:pre-wrap'>" + t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }
}
function j(t, e) {
  try {
    const n = $e().message;
    if (n && typeof n[t] == "function") {
      n[t](e);
      return;
    }
  } catch {
  }
  console.log("[question-modal]", t, e);
}
const ce = "__other__";
function ke(t) {
  return String(t && typeof t == "object" ? t.value ?? t.label ?? "" : t);
}
function ct(t) {
  return t ? t.skipped === !0 ? !0 : Array.isArray(t.value) ? t.value.length > 0 : !!(String(t.value ?? "").trim() || String(t.other ?? "").trim() || t.attachments && t.attachments.length) : !1;
}
function cr(t, e, n) {
  const r = { ...t };
  return !e || typeof e != "object" || Object.keys(e).forEach((s) => {
    if (n && n.has(s) || !Object.prototype.hasOwnProperty.call(r, s)) return;
    const a = e[s];
    !a || typeof a != "object" || !ct(r[s]) && ct(a) && (r[s] = { ...a });
  }), r;
}
function Ss(t) {
  if (!t || typeof t != "object") return [];
  const e = t.recommended !== void 0 ? t.recommended : t.ai_recommended;
  return e == null ? [] : (Array.isArray(e) ? e : [e]).map((r) => String(r ?? "").trim()).filter((r) => r.length > 0);
}
function Es(t, e) {
  if (!t || typeof t != "object") return "";
  const n = Array.isArray(t.per_question) ? t.per_question : [];
  if (!n.length) return "";
  const r = n.find((s) => Number(s && s.index) === Number(e)) || (n.length === 1 ? n[0] : null);
  return r ? String(r.choice === void 0 || r.choice === null ? "" : r.choice).trim() : "";
}
function _i(t, e, n) {
  if (!n.length) return !1;
  const r = (i) => String(i || "").replace(/^\s*推荐\s*[·:：\-]\s*/, "").replace(/[*_`"'\u300c\u300d\u300e\u300f]/g, "").replace(/\s+/g, "").trim(), s = ke(e), a = Ae(e), o = r(s), d = r(a);
  return n.some((i) => {
    const y = r(i);
    return y ? !!(i === s || i === a || y === o || y === d || Math.min(y.length, o.length, d.length) >= 4 && (y.length >= 4 && (o.includes(y) || y.includes(o)) || y.length >= 4 && (d.includes(y) || y.includes(d)))) : !1;
  });
}
function te(t) {
  const e = t && t.type;
  return e === "single" || e === "multi" || e === "text" ? e : t && (t.options || []).length ? t.multiple === !0 ? "multi" : "single" : "text";
}
let na = !0;
function kn(t, e) {
  const n = String(t && t.title || "").trim();
  return n || (na ? "第 " + (e + 1) + " 题" : "");
}
function Ae(t) {
  return String(t && typeof t == "object" ? t.label ?? t.value ?? "" : t);
}
function qi(t, e) {
  const n = /* @__PURE__ */ new Set(), r = (a) => {
    a != null && a !== "" && n.add(String(a));
  }, s = t.options || [];
  if (te(t) === "multi")
    (Array.isArray(e.value) ? e.value : []).forEach((o) => {
      r(o);
      const d = s.find((i) => ke(i) === String(o));
      d && r(Ae(d)), String(o) === ce && e.other && r(e.other);
    });
  else {
    r(e.value);
    const a = s.find((o) => ke(o) === String(e.value));
    a && r(Ae(a)), String(e.value) === ce && e.other && r(e.other);
  }
  return n;
}
function Si(t, e) {
  return (Array.isArray(t) ? t : [t]).some((r) => {
    const s = String(r);
    if (s.startsWith("=")) return e.has(s.slice(1));
    if (e.has(s)) return !0;
    for (const a of Array.from(e))
      if (a && (a.indexOf(s) !== -1 || s.indexOf(a) !== -1)) return !0;
    return !1;
  });
}
function ra(t, e) {
  const n = /^q(\d+)$/i.exec(t.trim());
  if (n) {
    const s = parseInt(n[1], 10);
    if (s >= 0 && s < e.length) return s;
  }
  return e.findIndex((s) => (s.title || "").trim() === t.trim());
}
function sa(t, e, n) {
  const r = e[t], s = r && r.showIf;
  if (!s || typeof s != "object" || !Object.keys(s).length) return !0;
  for (const a of Object.keys(s)) {
    const o = ra(a, e);
    if (o < 0) continue;
    const d = e[o];
    if (!d) continue;
    if (d.showIf && !sa(o, e, n)) return !1;
    const i = n[`q${o}`];
    if (!i || !Si(s[a], qi(d, i))) return !1;
  }
  return !0;
}
function ze(t, e) {
  const n = [];
  return t.forEach((r, s) => {
    sa(s, t, e) && n.push(s);
  }), n;
}
function Ei(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data && e[0].data.arguments;
    return n ? typeof n == "string" ? JSON.parse(n) : n : {};
  } catch {
    return {};
  }
}
function dn(t) {
  return Array.isArray(t.questions);
}
function Ti(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data;
    return n && n.call_id || "";
  } catch {
    return "";
  }
}
function Ai(t) {
  try {
    const e = t && t.content || [], n = e[0] && e[0].data, r = n && n.output;
    return r ? typeof r == "string" ? r : Array.isArray(r) ? r.map((s) => s && (s.text || s.content) || "").join(`
`) : String(r) : "";
  } catch {
    return "";
  }
}
function Ci(t) {
  return t ? /\[scroll folded\]/.test(t) : !1;
}
function Ii(t) {
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
function It(t, e) {
  if (!e) return "";
  if (e.kind === "skipped" && !e.answers) {
    const s = String(e.skipped_by || ""), a = String(e.skip_reason || "").trim();
    return (a ? `${s === "watchdog" ? "系统自动释放" : s === "timeout" ? "系统自动跳过" : "已跳过本次问卷"}：${a}` : "已跳过本次问卷。") + `

` + hn(t);
  }
  const n = e && e.answers || {}, r = ["【用户提交的问卷答案】"];
  return Object.keys(n).forEach((s) => {
    const a = n[s];
    if (!a || typeof a != "object") return;
    const o = ra(s, t), d = o >= 0 ? t[o] : null, i = d ? te(d) === "single" ? "单选" : te(d) === "multi" ? "多选" : "问答" : "问答", y = d ? kn(d, o) : s;
    let h = a.value;
    if (Array.isArray(h) && (h = h.join("、")), a.other && (h = (h ? h + "、" : "") + a.other), a.skipped) {
      const k = String(a.skipped_by || ""), f = k === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : k === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）";
      r.push(`- ${s} [${i}] ${y}${f}`);
    } else
      r.push(`- ${s} [${i}] ${y}：${h === "" || h == null ? "（空）" : h}`);
  }), e.other && r.push("", `其他意见：${e.other}`), r.join(`
`);
}
async function Ni(t, e) {
  try {
    const n = new URLSearchParams();
    t && n.set("tool_call_id", t), e && n.set("session_id", e);
    const r = await fetch(
      M("/question-modal/resolve") + "?" + n.toString(),
      { headers: L() }
    );
    if (!r.ok) return { kind: "error" };
    const s = await r.json();
    return s && Tr(s.session_id, s.agent_id), s && s.found ? { kind: "found", data: s } : s && s.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
async function Nt(t) {
  if (!t) return null;
  try {
    const e = await fetch(
      M("/question-modal/result") + "?tool_call_id=" + encodeURIComponent(t),
      { headers: L() }
    );
    if (!e.ok) return null;
    const n = await e.json();
    return n && n.found ? n : null;
  } catch {
    return null;
  }
}
async function zi(t) {
  try {
    const e = new FormData();
    e.append("file", t);
    const n = L();
    delete n["Content-Type"];
    const r = await fetch(
      M("/console/upload"),
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
const wn = "qm:v1:stash_att:", Ts = 25 * 1024 * 1024, mn = /* @__PURE__ */ new Map(), gn = /* @__PURE__ */ new Map();
let vn = null, _n = 0, dr = null;
function As() {
  const t = _n > 0;
  gn.forEach((e) => {
    try {
      e(t);
    } catch {
    }
  });
}
function $i() {
  if (dr) return dr;
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
    const r = vn;
    vn = null, !(!r || !n.length) && await aa(n, r.callId, r.target, r.key);
  };
  try {
    const e = document.body || document.documentElement;
    e && typeof e.appendChild == "function" && e.appendChild(t);
  } catch {
  }
  return dr = t, t;
}
function Oi(t, e, n) {
  if (!t) {
    j("error", "附件不可用：本次问卷缺少工具调用标识，请刷新页面后重试。");
    return;
  }
  vn = { callId: t, target: e, key: n };
  const r = $i();
  if (r && typeof r.click == "function")
    try {
      r.click();
      return;
    } catch {
    }
  r || (vn = null);
}
async function aa(t, e, n, r) {
  _n += 1, As();
  const s = [], a = [];
  try {
    for (const d of t) {
      if (d.size && d.size > Ts) {
        a.push(`${d.name}: 文件过大（上限 ${Math.round(Ts / 1024 / 1024)} MB）`);
        continue;
      }
      const i = await zi(d);
      i.ok ? s.push(i.att) : a.push(i.error);
    }
  } finally {
    _n -= 1, As();
  }
  const o = mn.get(e);
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
    else s.length && Ri(e, s, d, r);
  }
}
function Ri(t, e, n, r) {
  if (!(!t || !e.length))
    try {
      const s = localStorage.getItem(wn + t), a = s ? JSON.parse(s) : [], o = (Array.isArray(a) ? a : []).concat(
        e.map((d) => ({ att: d, target: n, key: r }))
      );
      localStorage.setItem(wn + t, JSON.stringify(o));
    } catch {
    }
}
function Mi(t) {
  if (!t) return [];
  try {
    const e = localStorage.getItem(wn + t);
    if (!e) return [];
    localStorage.removeItem(wn + t);
    const n = JSON.parse(e);
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}
function Li(t) {
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
function Bi(t) {
  return !t && t !== 0 ? "" : t < 1024 ? t + " B" : t < 1024 * 1024 ? (t / 1024).toFixed(1) + " KB" : (t / 1024 / 1024).toFixed(1) + " MB";
}
async function pr(t, e) {
  const n = e || Y(t), r = Mt(t), s = r && r.request_id ? r.request_id : "";
  if (s)
    try {
      const a = await fetch(M("/question-modal/skip"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({ request_id: s, session_id: n || "" })
      });
      if (a.ok) {
        const o = await a.json().catch(() => ({}));
        return le(t), {
          ok: !0,
          released: !0,
          reason: o && o.orphan ? "orphan" : "skipped"
        };
      }
      if (a.status === 404)
        return le(t), { ok: !0, released: !1, reason: "gone" };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  if (n)
    try {
      const a = await fetch(
        M("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(n),
        { method: "POST", headers: L() }
      );
      if (a.ok) {
        const o = await a.json().catch(() => ({})), d = o && typeof o.cancelled == "number" ? o.cancelled : 0;
        return le(t), { ok: !0, released: d > 0, reason: d > 0 ? "cancelled" : "none" };
      }
      return { ok: !1, released: !1, reason: "http " + a.status };
    } catch {
      return { ok: !1, released: !1, reason: "network" };
    }
  return { ok: !1, released: !1, reason: "no-handle" };
}
async function Cs(t) {
  if (!t) return { ok: !1, released: !1, reason: "no-handle" };
  try {
    const e = await fetch(
      M("/console/chat/stop") + "?chat_id=" + encodeURIComponent(t),
      { method: "POST", headers: L() }
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
async function Pi(t) {
  try {
    const e = t ? "?session_id=" + encodeURIComponent(t) : "", n = await fetch(
      M("/question-modal/pending") + e,
      { headers: L() }
    );
    if (!n.ok) return null;
    const r = await n.json(), s = r && r.items || [];
    if (!Array.isArray(s) || s.length !== 1) return null;
    const a = s[0];
    if (!a || !a.request_id) return null;
    const o = await fetch(
      M("/question-modal/resolve") + "?request_id=" + encodeURIComponent(a.request_id),
      { headers: L() }
    );
    if (!o.ok) return null;
    const d = await o.json();
    return d && Tr(d.session_id, d.agent_id), d && d.found ? d : null;
  } catch {
    return null;
  }
}
const An = "qm:v1:reqid:", ji = 3e4, Di = 45e3, oa = 6, ia = 6e4, la = 15 * 6e4, Fi = 700, Wi = 8;
function Hi(t) {
  try {
    if (String((t.headers && t.headers.get ? t.headers.get("content-type") : "") || "").toLowerCase().indexOf("text/html") >= 0) return !0;
    const n = Number(t.status || 0);
    return n === 429 || n === 403 || n === 407 || n === 451;
  } catch {
    return !1;
  }
}
function le(t) {
  if (t)
    try {
      localStorage.removeItem(An + t);
    } catch {
    }
}
function Ui() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(An) === 0 && t.push(a);
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
function Gi(t, e, n, r) {
  if (!(!t || !e))
    try {
      localStorage.setItem(An + t, JSON.stringify({
        request_id: e,
        session_id: n || "",
        agent_id: r || "",
        tool_call_id: t,
        ts: Date.now()
      })), Ui();
    } catch {
    }
}
function Mt(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(An + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || !n.request_id || n.tool_call_id !== t ? (le(t), null) : n;
  } catch {
    return null;
  }
}
const Nr = "qm:v1:state:";
function $t(t) {
  if (!t) return null;
  try {
    const e = localStorage.getItem(Nr + t);
    if (!e) return null;
    const n = JSON.parse(e);
    return !n || typeof n != "object" ? null : n;
  } catch {
    return null;
  }
}
function qn() {
  try {
    let t = sessionStorage.getItem("qm:v1:tab");
    return t || (t = Math.random().toString(36).slice(2, 10) + Date.now().toString(36), sessionStorage.setItem("qm:v1:tab", t)), t;
  } catch {
    return "tab-anon";
  }
}
const ca = qn(), Is = "qm:v1:sessionprefs-ping";
function Ge(t, e) {
  if (t)
    try {
      const r = { ...$t(t) || {}, ...e, ts: Date.now(), origin: ca };
      localStorage.setItem(Nr + t, JSON.stringify(r)), Ji();
    } catch {
    }
}
function Ji() {
  try {
    const t = [];
    for (let s = 0; s < localStorage.length; s++) {
      const a = localStorage.key(s);
      a && a.indexOf(Nr) === 0 && t.push(a);
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
async function Zi(t) {
  try {
    const e = await fetch(
      M("/question-modal/resolve") + "?request_id=" + encodeURIComponent(t),
      { headers: L() }
    );
    if (!e.ok) return { kind: "error" };
    const n = await e.json();
    return n && Tr(n.session_id, n.agent_id), n && n.found ? { kind: "found", data: n } : n && n.orphan ? { kind: "orphan" } : { kind: "absent" };
  } catch {
    return { kind: "error" };
  }
}
function Qi(t, e, n, r) {
  const s = ["【用户提交的问卷答案】"], a = new Set(ze(t, e));
  return t.forEach((o, d) => {
    if (!a.has(d)) return;
    const i = e[`q${d}`];
    if (!i) return;
    let y = i.value;
    if (Array.isArray(y))
      y = y.filter((b) => b !== ce).map((b) => {
        const x = (o.options || []).find((S) => ke(S) === String(b));
        return x ? Ae(x) : b;
      }).join("、");
    else {
      const b = (o.options || []).find((x) => ke(x) === String(y));
      b && (y = Ae(b)), String(i.value) === ce && (y = "");
    }
    const h = te(o) === "single" ? "单选" : te(o) === "multi" ? "多选" : "问答", k = !!String(y || "").trim() || !!String(i.other || "").trim() || !!(i.attachments && i.attachments.length), f = String(i.skipped_by || ""), w = i.skipped ? f === "requires_human" ? "（AI 跳过：需人工观察，未交给用户作答）" : f === "no_recommend" ? "（AI 跳过：无可用推荐）" : "（用户跳过本题）" : k ? y : "（未作答）";
    let m = `- q${d} [${h}] ${w}`;
    i.other && !i.skipped && (m += `（其他：${i.other}）`), i.attachments && i.attachments.length && (m += `（附件：${i.attachments.map((b) => b.file_name).join("、")}）`), s.push(m);
  }), n && s.push(`- 其他意见：${n}`), r && r.length && s.push(`- 其他意见附件：${r.map((o) => o.file_name).join("、")}`), s.join(`
`);
}
function Ki(t) {
  const e = {};
  return Object.keys(t || {}).forEach((n) => {
    const r = t[n];
    if (!r || typeof r != "object") {
      e[n] = r;
      return;
    }
    const s = r.value;
    if (Array.isArray(s) ? s.length === 1 && s[0] === ce : String(s ?? "") === ce) {
      e[n] = r;
      return;
    }
    e[n] = { ...r, other: "", attachments: [] };
  }), e;
}
const Xi = ["必须", "务必", "不得为空", "不能为空"], Vi = ["可为空", "可留空", "选填", "可选", "非必填"];
function da(t) {
  if (!t || typeof t != "object" || t.optional === !1) return !1;
  if (t.optional === !0) return !0;
  const e = String(t.title || "");
  return !e || Xi.some((n) => e.indexOf(n) !== -1) ? !1 : Vi.some((n) => e.indexOf(n) !== -1);
}
function Yi(t, e) {
  const n = { ...e || {} };
  let r = [];
  try {
    r = ze(t, n);
  } catch {
    return n;
  }
  return r.forEach((s) => {
    const a = t[s];
    if (!da(a)) return;
    const o = `q${s}`, d = n[o];
    if (d && (d.skipped === !0 || ct(d))) return;
    const i = te(a);
    n[o] = {
      type: i,
      value: i === "multi" ? [] : "",
      other: "",
      skipped: !0,
      skipped_by: "optional"
    };
  }), n;
}
function hn(t) {
  return t.map((e, n) => {
    const r = te(e) === "single" ? "单选" : te(e) === "multi" ? "多选" : "问答", s = (e.options || []).map(Ae).join("、");
    return `${n + 1}. [${r}] ${kn(e, n)}${s ? "（" + s + "）" : ""}`;
  }).join(`
`);
}
function ur(t) {
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
    n.map((h, k) => e.createElement(
      "span",
      { key: "att" + k, style: i },
      e.createElement("span", {
        style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
        title: h.file_name
      }, h.file_name + (h.size ? "（" + Bi(h.size) + "）" : "")),
      e.createElement("span", {
        style: { cursor: "pointer", opacity: 0.7, padding: "0 2px" },
        title: "移除附件",
        onClick: () => {
          r || d(k);
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
function el(t) {
  const {
    R: e,
    providers: n,
    modelId: r,
    onChange: s,
    disabled: a,
    open: o,
    onOpenChange: d,
    tab: i,
    onTabChange: y
  } = t, k = $e().Popover, f = [];
  n.forEach((A) => {
    [...A.models || [], ...A.extra_models || []].forEach((P) => {
      f.push({
        providerId: A.id,
        providerName: A.name || A.id,
        modelId: P.id,
        modelName: P.name || P.id,
        free: !!P.is_free
      });
    });
  });
  const w = f.find((A) => `${A.providerId}:${A.modelId}` === r), b = w ? w.modelName : r || "选择模型", x = w ? w.free ? "var(--app-success-text, #389e0d)" : "var(--app-warning-text, #d46b08)" : "var(--app-text-tertiary, rgba(0,0,0,0.25))", S = {
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
  }, _ = f.filter((A) => A.free).length, q = f.length - _, C = [];
  n.forEach((A) => {
    const P = [...A.models || [], ...A.extra_models || []].map(($) => ({
      providerId: A.id,
      providerName: A.name || A.id,
      modelId: $.id,
      modelName: $.name || $.id,
      free: !!$.is_free
    })).filter(($) => i === "free" ? $.free : !$.free);
    P.length && C.push({ id: A.id, name: A.name || A.id, models: P });
  });
  const I = (A, P) => e.createElement("button", {
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
  }, P), z = e.createElement(
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
      I("free", "免费 🟢 " + _)
    ),
    C.length ? e.createElement("div", null, C.map((A, P) => (
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
        A.models.map(($) => {
          const W = `${$.providerId}:${$.modelId}` === r;
          return e.createElement(
            "div",
            {
              key: `${$.providerId}:${$.modelId}`,
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
                s(`${$.providerId}:${$.modelId}`), d(!1);
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
            }, $.modelName)
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
    content: z,
    trigger: "click",
    open: o,
    onOpenChange: d,
    placement: "bottomLeft"
  }, e.createElement(
    "button",
    {
      type: "button",
      style: S,
      disabled: a,
      title: "选择 AI 分析使用的模型"
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: x }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  )) : e.createElement(
    "button",
    {
      type: "button",
      style: S,
      disabled: a,
      title: "点按切换下一个模型（无弹层）",
      onClick: () => {
        const A = f.find((P) => `${P.providerId}:${P.modelId}` !== r);
        A && s(`${A.providerId}:${A.modelId}`);
      }
    },
    e.createElement("span", {
      style: { width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: x }
    }),
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, b),
    e.createElement("span", {
      style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" }
    }, "▾")
  );
}
function tl(t) {
  const { R: e, mode: n, onChange: r, disabled: s } = t, a = {
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
      background: n === i ? "var(--app-accent, #ff7f16)" : "transparent",
      color: n === i ? "var(--app-text-inverse, #fff)" : "var(--app-text-secondary, inherit)"
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
function nl(t) {
  const { R: e, templates: n, value: r, open: s, onOpenChange: a, disabled: o, onSelect: d, onManage: i } = t, h = $e().Popover, k = (n || []).find((x) => x.id === r), f = k ? k.name : "默认模板", w = {
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
    (n || []).map((x) => e.createElement(
      "div",
      {
        key: x.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          cursor: "pointer",
          borderLeft: "3px solid " + (x.id === r ? "var(--app-accent, #1677ff)" : "transparent"),
          borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.12))",
          background: x.id === r ? "var(--app-accent-soft, rgba(22,119,255,0.10))" : "transparent"
        },
        onClick: () => {
          d(x.id), a(!1);
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
      }, x.name),
      x.builtin ? e.createElement("span", {
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
      style: w,
      disabled: o,
      title: "选择本题分析使用的提示词模板"
    },
    e.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, f),
    e.createElement("span", { style: { fontSize: 10, color: "var(--app-text-tertiary, inherit)" } }, "▾")
  );
  return h ? e.createElement(h, {
    content: m,
    trigger: "click",
    open: s,
    onOpenChange: a,
    placement: "bottomLeft"
  }, b) : b;
}
function rl(t) {
  const { R: e, open: n, templates: r, value: s, edit: a, onEditChange: o, onClose: d, onSelect: i, onSave: y, onDelete: h } = t;
  if (!n) return null;
  const k = $e(), { Input: f, Modal: w } = k, m = {
    maxHeight: "60vh",
    overflowY: "auto",
    background: "var(--app-bg-elevated, #fff)",
    borderRadius: 10,
    padding: 12,
    fontSize: 12
  };
  w || (m.position = "fixed", m.right = 24, m.top = 80, m.width = 420, m.border = "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))", m.zIndex = 1100, m.boxShadow = "0 6px 24px rgba(0,0,0,0.18)");
  const b = {
    height: 22,
    padding: "0 8px",
    fontSize: 11,
    borderRadius: 6,
    cursor: "pointer",
    border: "1px solid var(--app-border-subtle, rgba(0,0,0,0.15))",
    background: "transparent",
    color: "var(--app-text, inherit)"
  }, x = !!a, S = (q, C, I, z) => f && f.TextArea ? e.createElement(f.TextArea, {
    value: q,
    rows: I,
    placeholder: z,
    onChange: (A) => C(A && A.target ? A.target.value : "")
  }) : e.createElement("textarea", {
    value: q,
    rows: I,
    placeholder: z,
    style: { width: "100%", boxSizing: "border-box", fontFamily: "inherit", fontSize: 12 },
    onInput: (A) => C(A && A.target ? A.target.value : ""),
    onChange: (A) => C(A && A.target ? A.target.value : "")
  }), _ = e.createElement(
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
        x ? a.id ? "编辑模板" : "新建模板" : "模板库（全局共享）"
      ),
      e.createElement("button", { type: "button", style: b, onClick: d }, "关闭")
    ),
    x ? e.createElement(
      "div",
      null,
      e.createElement("div", { style: { marginBottom: 6 } }, "名称"),
      S(a.name || "", (q) => o({ ...a, name: q }), 1, "模板名称"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "系统提示词（必须保留 JSON 契约：choice / confidence / reasoning）"
      ),
      S(a.system || "", (q) => o({ ...a, system: q }), 8, "系统提示词"),
      e.createElement(
        "div",
        { style: { margin: "8px 0 6px" } },
        "用户提示词模板（占位符：{title} {index} {total} {question} {type} {options} {context}）"
      ),
      S(a.user || "", (q) => o({ ...a, user: q }), 6, "用户提示词模板"),
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
            onClick: () => h(q.id)
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
  return w ? e.createElement(w, {
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
  }, _) : _;
}
function sl(t) {
  const {
    R: e,
    busy: n,
    result: r,
    error: s,
    mode: a,
    onRun: o,
    onApply: d,
    onCancel: i,
    onRerun: y,
    disabled: h,
    children: k,
    open: f,
    onOpenChange: w
  } = t, b = $e().Popover, x = e.createElement("button", {
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
    title: a === "ai" ? "查看本题的 AI 分析过程与推荐（已自动分析）" : a === "recommend" ? "查看本题分析；「只用推荐」模式下不会自动调用模型" : "查看本题分析：未分析时可在气泡内点「开始分析」",
    onClick: () => {
      w(!f);
    }
  }, n ? "分析中…" : "查看分析");
  if (!b)
    return e.createElement(
      "div",
      null,
      x,
      r && f ? e.createElement("div", {
        style: { marginTop: 8, fontSize: 12, whiteSpace: "pre-wrap" }
      }, String((r.per_question || []).map((C) => C.reasoning).join(`

`))) : null
    );
  const S = !!(r && (r.per_question || []).length), _ = (C, I, z) => e.createElement("button", {
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
  }, C), q = e.createElement(
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
        S && !n ? e.createElement("button", {
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
        S && !n ? e.createElement("button", {
          type: "button",
          style: {
            marginLeft: S ? 6 : "auto",
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
            d(), w(!1);
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
          dangerouslySetInnerHTML: { __html: vi(C.reasoning || "") }
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
      _("开始分析", () => {
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
    }, k)
  );
  return e.createElement(b, {
    content: q,
    trigger: "click",
    open: f,
    onOpenChange: w,
    placement: "bottomRight"
  }, x);
}
function al(t) {
  const e = we().React, n = $e(), { Input: r, Button: s } = n, a = r.TextArea, o = t.data || {}, d = Ei(o), i = Ti(o), y = Ai(o), h = Ci(y), k = h ? "" : y, f = d.questions || [], w = d.title || "问卷", m = $t(i), [b, x] = e.useState(
    () => !!(m && m.answered) || !!k || h
  ), [S, _] = e.useState(""), [q, C] = e.useState(() => {
    const l = Mt(i);
    return l && l.request_id ? l.request_id : m && typeof m.reqId == "string" ? m.reqId : "";
  }), [I, z] = e.useState(
    () => m && typeof m.visStep == "number" && m.visStep >= 0 ? m.visStep : 0
  ), [A, P] = e.useState(
    () => m && typeof m.slowAt == "number" ? m.slowAt : 0
  ), [$, W] = e.useState(
    () => m && typeof m.slowStep == "number" ? m.slowStep : -1
  ), [fe, ve] = e.useState(
    () => !!(m && m.slowFired === !0)
  ), [H, J] = e.useState(() => {
    const l = {};
    f.forEach((g, u) => {
      l[`q${u}`] = { type: te(g), value: te(g) === "multi" ? [] : "", other: "" };
    });
    const p = m && m.answers;
    return p && typeof p == "object" && Object.keys(p).forEach((g) => {
      l[g] && (l[g] = { ...l[g], ...p[g] });
    }), l;
  }), [R, Me] = e.useState(
    () => m && typeof m.finalOther == "string" ? m.finalOther : ""
  ), [B, de] = e.useState(!1), [me, Xe] = e.useState(
    () => m && typeof m.releasedNote == "string" ? m.releasedNote : ""
  ), [dt, pt] = e.useState(
    () => m && typeof m.localResult == "string" ? m.localResult : ""
  ), [ge, Ve] = e.useState(
    // 新版写实措辞（系统自动释放/系统自动跳过/问卷已跳过）不含「跳过了本次问卷」，
    // 只认旧正则会让新 payload 的卡完全不进折叠摘要（harness [AR1] 抓到）。
    () => !!(m && m.skippedAll) || /跳过了本次问卷|系统自动释放|系统自动跳过|问卷已跳过|用户手动释放阻塞/.test(k || "")
  ), [Oe, Ye] = e.useState(
    () => (m && typeof m.skipReason == "string" ? m.skipReason : "") || Ii(k || "")
  ), [ut, Or] = e.useState(
    () => m && Array.isArray(m.finalOtherAtt) ? m.finalOtherAtt : []
  ), [jt, Rr] = e.useState(
    () => !!(m && m.expanded)
  ), [Mr, Dt] = e.useState(!1), Cn = e.useRef(0), [he, ba] = e.useState(
    () => m && typeof m.deadReason == "string" ? m.deadReason : ""
  ), [Le, ft] = e.useState(
    () => m && typeof m.gateBlocked == "string" ? m.gateBlocked : ""
  ), [et, In] = e.useState(
    () => m && typeof m.submittedAt == "number" ? m.submittedAt : 0
  ), [Nn, zn] = e.useState(
    () => !!(m && m.pastSoft === !0)
  ), [mt, Ft] = e.useState(
    () => !!(m && m.waitRetired === !0)
  ), gt = e.useRef(
    !!(m && typeof m.submittedAt == "number" && m.submittedAt > 0 && Date.now() - m.submittedAt < ir * 1e3)
  ), Be = e.useRef(!1), Wt = e.useRef(!!(m && m.pastSoft === !0)), [$n, ya] = e.useState(() => ({
    show_recommend_badge: !0,
    slow_question_sec: 60
  })), xa = e.useRef($n), Lr = (l) => {
    xa.current = l, ya(l);
  }, ae = (l, p) => {
    const g = $n[l];
    return g ?? p;
  };
  na = !!ae("fallback_title", !0);
  const Br = Math.max(30, Number(ae("wait_hint_sec", ir)) || ir), ka = "manual", [Q, Ht] = e.useState(ka), [Pr, On] = e.useState(""), [Sl, wa] = e.useState(!1), [Rn, Mn] = e.useState(!1), [Ln, Bn] = e.useState(!1), [va, _a] = e.useState([]), [jr, Pn] = e.useState(!1), [Ut, tt] = e.useState(null), [qa, Pe] = e.useState(""), [Sa, Ea] = e.useState(!1), [Ta, Aa] = e.useState(!1), [Ca, Ia] = e.useState("paid"), Re = e.useRef({}), Ce = e.useRef({}), nt = e.useRef(0), ht = e.useRef(null), [Na, rt] = e.useState(0), [Dr, jn] = e.useState([]), [je, Gt] = e.useState(""), Ie = e.useRef(je);
  Ie.current = je;
  const [za, $a] = e.useState(!1), [Oa, Fr] = e.useState(!1), [Ra, Dn] = e.useState(null), [Se, Wr] = e.useState(
    () => !!(m && m.autoPaused)
  ), Ma = e.useRef(Se);
  Ma.current = Se;
  const st = e.useRef(!1), Fn = e.useRef(0), Jt = e.useRef({}), [La, Ba] = e.useState(0), bt = e.useRef(/* @__PURE__ */ new Set()), yt = (l) => {
    l && bt.current.add(l);
  }, Zt = e.useRef({}), [Pa, Qt] = e.useState(0), De = e.useRef({}), [xt, ja] = e.useState(!1), Da = e.useRef(!1);
  Da.current = xt, e.useRef(!1);
  const Fa = async () => {
    try {
      const l = await Lt(
        "",
        !0,
        Y(i),
        At()
      );
      if (!l || !l.config) return;
      const p = l.config;
      Lr(p), p.mode !== void 0 && Ht(Ct(p.mode)), typeof p.model_id == "string" && p.model_id && On(p.model_id), typeof p.with_context == "boolean" && Mn(p.with_context), typeof p.parallel == "boolean" && Bn(p.parallel), rt((g) => g + 1);
    } catch {
    }
  }, Hr = e.useRef(!1), Kt = (l) => {
    if (l.mode !== void 0) {
      Ht(l.mode), lr(
        { mode: l.mode },
        Y(i),
        At()
      );
      try {
        localStorage.setItem(Is, ca + ":" + Date.now());
      } catch {
      }
    }
    const p = {};
    l.modelId !== void 0 && (p.model_id = l.modelId), l.withContext !== void 0 && (p.with_context = l.withContext), l.parallel !== void 0 && (p.parallel = l.parallel), Object.keys(p).length && (l.modelId !== void 0 && On(l.modelId), l.withContext !== void 0 && Mn(l.withContext), l.parallel !== void 0 && Bn(l.parallel), lr(p, Y(i), At()));
  }, Ur = (l) => {
    !l || l === je || (Gt(l), Ie.current = l, Ge(i, { templateId: l }), lr(
      { template_id: l },
      Y(i),
      At()
    ), tt(null), Re.current = {}, Ce.current = {}, rt((p) => p + 1));
  }, Wa = async (l) => {
    const p = await Ys({
      id: l.id || "",
      name: l.name || "",
      system: l.system || "",
      user: l.user || ""
    });
    if (!p.ok) {
      j("error", p.error || "保存失败");
      return;
    }
    jn(p.items || []), Dn(null), j("success", "模板已保存");
  }, Ha = async (l) => {
    const p = await ea(l);
    if (!p.ok) {
      j("warning", p.error || "删除失败");
      return;
    }
    jn(p.items || []);
    const g = (p.items || []).map((u) => u.id);
    if (g.indexOf(Ie.current) === -1) {
      const u = g[0] || "";
      Gt(u), Ie.current = u, Ge(i, { templateId: u });
    }
    j("success", "模板已删除");
  };
  e.useEffect(() => {
    if (b) return;
    const l = (p) => {
      try {
        String(p && p.key || "") === Is && Fa();
      } catch {
      }
    };
    return window.addEventListener("storage", l), () => window.removeEventListener("storage", l);
  }, [b, i]), e.useEffect(() => {
    if (b) return;
    let l = !0;
    return fi(), (async () => {
      const [p, g, u, v] = await Promise.all([
        ta(),
        mi(),
        Ar(),
        // Chat identity: the card knows its own session; the server resolves
        // it to a chat UUID (the host never exposes one to the front end).
        Lt(
          "",
          !0,
          Y(i),
          At()
        )
      ]);
      if (!l) return;
      if (_a(p), jn(u.items), v && v.config) {
        const E = v.config;
        Lr(E), E.mode !== void 0 && Ht(Ct(E.mode)), typeof E.model_id == "string" && E.model_id && On(E.model_id), typeof E.with_context == "boolean" && Mn(E.with_context), typeof E.parallel == "boolean" && Bn(E.parallel), typeof E.template_id == "string" && E.template_id && (Gt(E.template_id), Ie.current = E.template_id);
      }
      const T = u.items.map((E) => E.id);
      if (!Ie.current || T.indexOf(Ie.current) === -1) {
        const E = u.defaultId || T[0] || "";
        E && (Gt(E), Ie.current = E);
      }
      if (v && v.config) {
        const E = v.config;
        wa(E.__follow_active__ === !0);
      }
      Hr.current = !0, rt((E) => E + 1);
    })(), () => {
      l = !1;
    };
  }, [i]), e.useEffect(() => {
    nt.current = I;
  }, [I]);
  const Wn = async (l) => {
    if (jr) return;
    const p = I;
    Pn(!0), Pe("");
    const g = typeof AbortController < "u" ? new AbortController() : null;
    ht.current = g;
    try {
      const u = await fetch(M("/question-modal/analyze"), {
        method: "POST",
        headers: L(),
        body: JSON.stringify({
          request_id: q,
          tool_call_id: i,
          session_id: Y(i),
          title: w,
          questions: f,
          model_id: Pr,
          mode: l,
          with_context: Rn,
          parallel: Ln,
          question_index: p,
          answers: H,
          template_id: Ie.current,
          // b5：单题分析超时来自生效配置（后端会钳到 [30,600]）
          timeout_sec: Number(ae("model_timeout_sec", 120)) || 120
        }),
        signal: g ? g.signal : void 0
      }), v = await u.json().catch(() => ({})), T = v && v.analysis || null, E = T && T.error || v && v.error || "";
      v && v.cancelled || T && T.cancelled ? Pe("已终止分析。") : !u.ok || !v || v.ok === !1 || T && T.ok === !1 ? Pe(E || "分析失败（服务返回 " + u.status + "）") : T && (Re.current[p] = T, Ce.current[p] = !0, nt.current === p && tt(T), j("success", "第 " + (p + 1) + " 题 AI 分析完成"));
    } catch (u) {
      ht.current === g && g && g.signal.aborted || u && u.name === "AbortError" ? Pe("已终止分析。") : Pe("分析请求失败：" + (u && u.message ? u.message : u));
    } finally {
      ht.current === g && (ht.current = null), Pn(!1), De.current[p] = !0, Qt((u) => u + 1);
    }
  }, Ua = () => {
    const l = I;
    delete Re.current[l], tt(null), Pe(""), Wn("manual");
  }, at = (l) => {
    var g;
    const p = l !== void 0 ? l : nt.current;
    try {
      fetch(M("/question-modal/analyze/cancel"), {
        method: "POST",
        headers: L(),
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
      cn(i, "cancel_analysis", {});
    } catch {
    }
    try {
      (g = ht.current) == null || g.abort();
    } catch {
    }
    Pn(!1);
  }, Ga = () => {
    at(), Pe("已终止分析。");
  }, Ja = () => {
    Se ? (Zt.current = {}, De.current = {}, Ce.current = {}, st.current = !1, Wr(!1), rt((l) => l + 1), j("info", "已恢复自动答题")) : (at(), Wr(!0), j("info", "已暂停自动答题，你可以手动作答"));
  };
  e.useEffect(() => {
    if (b) return;
    const l = Re.current[I];
    tt(l || null);
    const p = "?tool_call_id=" + encodeURIComponent(i) + "&question_index=" + I;
    let g = !0;
    return fetch(M("/question-modal/analysis") + p, { headers: L() }).then((u) => u.ok ? u.json() : null).then((u) => {
      !g || !u || !u.found || !u.analysis || (Re.current[I] = u.analysis, nt.current === I && tt(u.analysis));
    }).catch(() => {
    }), () => {
      g = !1;
    };
  }, [i, I]), e.useEffect(() => {
    b || Hr.current && Q === "ai" && xt && (!dn(d) || !f.length || Ce.current[I] || B || (Ce.current[I] = !0, Wn("auto")));
  }, [
    b,
    Q,
    i,
    Na,
    Rn,
    Ln,
    f,
    I,
    // backendDown 必须在内：它由 SSE 连接状态驱动，变化时要重新评估
    // 「让位还是自己分析」。漏了就永远停在让位状态（连不上也不分析）。
    xt
  ]);
  const Za = () => {
    const l = Ut && Ut.per_question || [];
    if (!l.length) return;
    if (!l.some((g) => g.type === "multi" ? String(g.choice || "").split(/[、,，]/).map((u) => u.trim()).filter(Boolean).length > 0 : String(g.choice || "").trim().length > 0)) {
      j("warning", "本题未得到有效推荐（分析可能失败或被截断），请点「重新分析」或更换模型");
      return;
    }
    J((g) => {
      const u = { ...g };
      return l.forEach((v) => {
        const T = `q${v.index}`;
        yt(T);
        const E = u[T] || { type: v.type, value: "", other: "" };
        if (v.type === "multi") {
          const X = String(v.choice || "").split(/[、,，]/).map((Z) => Z.trim()).filter(Boolean);
          u[T] = { ...E, value: X };
        } else
          u[T] = { ...E, value: v.choice || E.value };
      }), u;
    }), j("success", "已套用 AI 推荐（可继续手工调整后提交）");
  }, Fe = (l, p, g = !1) => {
    at(), ba(l), Ve(!0), pt(p), Dt(!1), x(!0), le(i), g && Ge(i, { backendReleased: !0 });
  }, Qa = async (l, p) => {
    const g = await pr(i, Y(i));
    return g.ok ? (Fe(l, p, g.released), !0) : (Dt(!0), Un(!1), !1);
  };
  e.useEffect(() => {
    var p;
    const l = (p = $t(i)) == null ? void 0 : p.answers;
    Ge(i, {
      // reqId included: submit/skip are dead without it, and it must
      // survive the remount that a focus-regain (e.g. closing the file
      // dialog) triggers.
      reqId: q,
      visStep: I,
      answers: cr(H, l, bt.current),
      finalOther: R,
      finalOtherAtt: ut,
      answered: b,
      skippedAll: ge,
      expanded: jt,
      localResult: dt,
      submittedAt: et,
      skipReason: Oe,
      // pastSoft / waitRetired MUST persist (同 deadReason/releasedNote 家族)：
      // 宿主会因 tool result 合并改 key、虚拟列表滚出滚回、页面刷新而反复重挂
      // 本卡；丢标志 = 已退休的行重亮，或已升级的文案退回成普通等待。
      pastSoft: Nn,
      waitRetired: mt,
      // 题级用时（五次裁定）：slowAt 存**计时起点**而非布尔值——重挂载后按
      // 剩余时间续算，否则用户等 59s 后滚一下卡片就要再等一分钟。slowStep 把
      // 起点绑定到题号，重挂后若题号对不上即自动清零重计。
      slowAt: A,
      slowStep: $,
      slowFired: fe,
      // deadReason MUST persist alongside skippedAll: converge() sets both, but
      // the collapsed row renders「⚠ 问卷已失效」only while deadReason is set.
      // Without it, a remount (switching windows with ctrl+tab makes the host
      // re-key this list item) restored skippedAll but lost the reason, so a
      // dead survey disguised itself as「✓ 已跳过问卷」— exactly the reported
      // 「切窗口把整卷跳过」.  Restoring it keeps the truth across remounts.
      deadReason: he,
      gateBlocked: Le,
      releasedNote: me,
      autoPaused: Se,
      templateId: je
    });
  }, [
    i,
    q,
    I,
    H,
    R,
    ut,
    b,
    ge,
    jt,
    dt,
    et,
    Oe,
    Nn,
    mt,
    A,
    $,
    fe,
    he,
    Se,
    je,
    Le,
    me
  ]), e.useEffect(() => {
    if (!b || !et || mt || !gt.current) return;
    let l = 0, p = !1, g = vs(i);
    const u = () => {
      if (p) return;
      const v = Math.floor((Date.now() - et) / 1e3);
      if (v >= Br) {
        Be.current = !0, Ft(!0);
        return;
      }
      if (!Be.current) {
        const T = vs(i);
        T >= 0 && (g < 0 ? g = T : T - g >= si && (Be.current = !0));
      }
      if (!Be.current && v >= ni && !Wt.current && (Wt.current = !0, zn(!0)), Be.current) {
        l = setTimeout(
          () => {
            p || Ft(!0);
          },
          Math.max(1e3, (Br - v) * 1e3)
        );
        return;
      }
      l = setTimeout(() => {
        p || _s(u);
      }, Ks);
    };
    return _s(u), () => {
      p = !0, clearTimeout(l);
    };
  }, [b, et, mt]);
  const [Hn, Un] = e.useState(!1), [Gn, Gr] = e.useState(""), Jr = (l, p, g) => {
    l.length && (p === "final" ? Or((u) => u.concat(l)) : J((u) => {
      const v = g || `q${I}`;
      yt(v);
      const T = u[v] || { type: "text", value: "", other: "" };
      return { ...u, [v]: { ...T, attachments: (T.attachments || []).concat(l) } };
    }));
  };
  e.useEffect(() => {
    if (!i) return;
    const l = (u, v, T, E) => {
      Jr(u, v, T), E && E.length ? Gr(E.join("；")) : Gr("");
    }, p = (u) => Un(u);
    mn.set(i, l), gn.set(i, p);
    const g = Mi(i);
    return g.length && g.forEach((u) => Jr([u.att], u.target, u.key)), Un(_n > 0), () => {
      mn.get(i) === l && mn.delete(i), gn.get(i) === p && gn.delete(i);
    };
  }, [i, I]);
  const Jn = (l, p) => Oi(i, l, p), Zn = (l, p, g) => {
    const u = Li(l);
    if (u.length) {
      try {
        l.preventDefault();
      } catch {
      }
      aa(u, i, p, g);
    }
  };
  e.useEffect(() => {
    if (!h || S) return;
    let l = !0;
    return Nt(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Ve(!0);
      const g = String(p.skip_reason || "").trim();
      g && Ye((u) => u || g), _(It(f, p));
    }), () => {
      l = !1;
    };
  }, [h, i, S]), e.useEffect(() => {
    if (b || !i || k) return;
    let l = !0;
    return Nt(i).then((p) => {
      if (!l || !p) return;
      p.kind === "skipped" && !p.answers && Ve(!0);
      const g = String(p.skip_reason || "").trim();
      g && Ye((u) => u || g), _((u) => u || It(f, p)), pt(It(f, p)), x(!0), le(i);
    }), () => {
      l = !1;
    };
  }, [i, b, k]), e.useEffect(() => {
    if (b) return;
    let l = !0, p = 0, g = 0, u = 0, v = !1, T = !1, E = 0, X = 0;
    Cn.current || (Cn.current = Date.now());
    let Z = !!Mt(i), ye = !1;
    const pe = (O) => {
      !l || !O || !O.request_id || (Z = !0, g = 0, u = 0, v = !1, C(O.request_id), Dt(!1), E && (clearTimeout(E), E = 0), Gi(
        i,
        O.request_id,
        O.session_id || Tn(),
        O.agent_id
      ));
    }, ne = (O) => {
      l && (E && (clearTimeout(E), E = 0), X && (clearTimeout(X), X = 0), Qa(
        O,
        O === "orphan" ? `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。` : `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`
      ));
    }, St = Mt(i), Ue = async () => {
      if (!St) return !1;
      const O = await Zi(St.request_id);
      if (!l) return !0;
      if (O.kind === "found") {
        const oe = O.data;
        return oe.tool_call_id && i && oe.tool_call_id !== i ? (le(i), !1) : (pe(oe), !0);
      }
      return O.kind === "orphan" ? (ne("orphan"), !0) : (O.kind === "absent" && le(i), !1);
    }, xe = (O = !1) => {
      if (l) {
        if (p += 1, O || (g += 1, u || (u = Date.now())), O) {
          if (!ye) {
            ye = !0, Nt(i).then((re) => {
              if (l) {
                if (re) {
                  re.kind === "skipped" && !re.answers && Ve(!0);
                  const Et = String(re.skip_reason || "").trim();
                  Et && Ye((rr) => rr || Et), _(It(f, re)), pt(It(f, re)), x(!0), le(i);
                  return;
                }
                xe(!0);
              }
            });
            return;
          }
          if (Z) {
            ne("gone");
            return;
          }
          const oe = Date.now() - (Cn.current || Date.now());
          if (p >= 12 && oe >= Di) {
            ne("gone");
            return;
          }
        }
        if (g >= oa) {
          if (Date.now() - (u || Date.now()) >= la) {
            if (v = !0, !T) {
              T = !0;
              try {
                typeof document < "u" && document.addEventListener && document.addEventListener("visibilitychange", () => {
                  try {
                    if (document.visibilityState !== "visible" || !l || !v) return;
                    v = !1, g = 0, u = 0, p = 0, V();
                  } catch {
                  }
                });
              } catch {
              }
            }
            return;
          }
          E = setTimeout(V, ia);
          return;
        }
        E = setTimeout(V, p < Wi ? Fi : 5e3);
      }
    }, qe = () => {
      Ni(i, Y(i)).then((O) => {
        if (l) {
          if (O.kind === "found") {
            pe(O.data);
            return;
          }
          if (O.kind === "orphan") {
            ne("orphan");
            return;
          }
          if (O.kind === "error") {
            xe(!1);
            return;
          }
          Pi(Y(i)).then((oe) => {
            if (l) {
              if (oe) {
                if (oe.tool_call_id && i && oe.tool_call_id !== i) {
                  Nt(i).then((re) => {
                    if (l) {
                      if (re) {
                        x(!0), le(i);
                        return;
                      }
                      xe(!0);
                    }
                  });
                  return;
                }
                pe(oe);
                return;
              }
              Nt(i).then((re) => {
                if (l) {
                  if (re) {
                    re.kind === "skipped" && !re.answers && Ve(!0);
                    const Et = String(re.skip_reason || "").trim();
                    Et && Ye((rr) => rr || Et), x(!0), le(i);
                    return;
                  }
                  xe(!0);
                }
              });
            }
          });
        }
      });
    }, V = () => {
      if (l) {
        if (!St) {
          qe();
          return;
        }
        Ue().then((O) => {
          !l || O || qe();
        });
      }
    };
    return X = setTimeout(() => {
      l && Dt(!0);
    }, ji), V(), () => {
      l = !1, E && clearTimeout(E), X && clearTimeout(X);
    };
  }, [b, i]);
  const Zr = async () => {
    de(!0);
    try {
      const l = Y(i);
      let p = await pr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await Cs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok)
        throw new Error(
          p.reason === "network" ? "网络不可达，未能释放；请稍后重试" : "未能取得问卷句柄（" + p.reason + "）"
        );
      if (p.released) {
        const u = p.reason === "host-stop";
        Fe(
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
        Fe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
    } catch (l) {
      j("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      de(!1);
    }
  }, Qr = async () => {
    de(!0);
    try {
      const l = Y(i);
      let p = await pr(i, l);
      if ((!p.released || p.reason === "orphan") && p.reason !== "network" && l) {
        const u = await Cs(l);
        u.ok && u.released ? p = u : u.ok && !p.ok && (p = { ok: !0, released: !1, reason: "gone" });
      }
      if (!p.ok) {
        Xe(p.reason === "network" ? "网络不可达，未能释放；请稍后重试。" : "未能取得问卷句柄（" + p.reason + "）。"), j("error", "释放失败：网络或句柄不可达");
        return;
      }
      if (p.released) {
        const u = p.reason === "host-stop";
        Xe(u ? "已直接终止本次运行，会话可继续对话。（插件端记录已不可达，本次回答未回传给模型。）" : "已释放本次问卷的阻塞，会话可继续。"), j("info", u ? "已释放阻塞（已终止本次运行）" : "已释放阻塞，会话可继续");
      } else
        Xe("后端已无这条记录的阻塞：会话当前不应被本次问卷锁住。若发新消息仍报 A task is already running，请点宿主输入框的「停止」。"), j("info", "后端已无此阻塞，无需释放");
    } catch (l) {
      j("error", "释放失败: " + (l && l.message ? l.message : l));
    } finally {
      de(!1);
    }
  }, Xt = ze(f, H), We = Xt.length, _e = I >= We, K = _e ? -1 : Xt[I], kt = _e ? We : I;
  e.useEffect(() => {
    if (Ct(ae("mode", "manual")) !== "manual") return;
    const p = String(ae("notify_channel", "off") || "off"), g = !!ae("notify_manual_mode", !1);
    if (p === "off" && !g || b || ge || he || !dn(d) || !f.length) return;
    const u = ze(f, H).filter((v) => !ct(H[`q${v}`])).length;
    ti(i, w, u);
  }, [$n, b, ge, he, kt]);
  const Vt = Math.max(0, Number(ae("slow_question_sec", ri)) || 0) * 1e3, Ka = Math.round(Vt / 1e3);
  e.useEffect(() => {
    if (b || ge || he || Vt <= 0) return;
    if ($ !== kt) {
      W(kt), P(Date.now()), ve(!1);
      return;
    }
    if (!A) {
      P(Date.now());
      return;
    }
    if (fe) return;
    const l = A + Vt - Date.now();
    if (l <= 0) {
      ve(!0);
      return;
    }
    let p = !1;
    const g = setTimeout(() => {
      p || ve(!0);
    }, l);
    return () => {
      p = !0, clearTimeout(g);
    };
  }, [b, ge, he, kt, $, A, fe, Vt]);
  const be = K >= 0 ? f[K] : null, ot = `q${K}`, G = K >= 0 && H[ot] || { type: te(be), value: te(be) === "multi" ? [] : "", other: "" }, it = (l) => {
    var u;
    Le && ft(""), K >= 0 && yt(`q${K}`);
    const p = { ...H, [ot]: { ...l, skipped: !1 } }, g = ze(f, p);
    f.forEach((v, T) => {
      g.indexOf(T) === -1 && delete p[`q${T}`];
    }), Ge(i, {
      answers: cr(p, (u = $t(i)) == null ? void 0 : u.answers, bt.current)
    }), J(p);
  };
  e.useEffect(() => {
    I > We && z(We);
  }, [We, I]);
  const Qn = async (l, p) => {
    const g = await fetch(M(l), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(p)
    }), u = await g.json().catch(() => ({}));
    if (!g.ok) {
      const v = new Error(u && u.detail || "HTTP " + g.status);
      throw v.status = g.status, v;
    }
    return u;
  }, Kn = () => {
    var l;
    return Ki(cr(
      Yi(f, H),
      (l = $t(i)) == null ? void 0 : l.answers,
      bt.current
    ));
  }, Xa = () => !!ae("gate_unsaved", !0), Va = (l) => da(l), Kr = (l, p) => {
    if (!Xa()) return [];
    const g = new Set(ze(f, l)), u = (T) => g.has(T) && !ct(l[`q${T}`]) && !Va(f[T]), v = [];
    return typeof p == "number" ? (u(p) && v.push(p + 1), v) : (f.forEach((T, E) => {
      u(E) && v.push(E + 1);
    }), v);
  }, Xr = (l, p, g) => {
    const u = "第 " + l.join("、") + " 题", v = g === "提交" ? "请选择后再提交；如需跳过，请点「跳过并提交」或逐题「跳过本题」。" : "请选择后再继续；如需跳过，请点「跳过本题」。";
    ft("⛔ " + u + "尚未选择。" + v);
    const T = ze(f, p).length;
    Qn("/question-modal/gate-block", {
      request_id: q,
      tool_call_id: i,
      session_id: Y(i),
      missing: l,
      answered: T - l.length,
      total: T,
      bundle: ks
    }).catch(() => {
    });
  }, Yt = async (l, p = !1) => {
    if (!q)
      return j("warning", "问卷尚未就绪，请稍候"), "not-ready";
    const g = Kn();
    if (!p) {
      const u = Kr(g);
      if (u.length)
        return Xr(u, g, "提交"), "blocked";
      ft("");
    }
    de(!0);
    try {
      const u = await Qn("/question-modal/answer", {
        request_id: q,
        session_id: Y(i),
        answers: g,
        other: R,
        attachments: ut
      });
      return u && u.orphan ? (fetch(
        M("/question-modal/cancel-session") + "?session_id=" + encodeURIComponent(Y(i)),
        { method: "POST", headers: L() }
      ).catch(() => {
      }), Fe(
        "orphan",
        `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "sent") : (le(i), pt(Qi(f, g, R, ut)), In(Date.now()), zn(!1), Ft(!1), Be.current = !1, Wt.current = !1, gt.current = !0, x(!0), "sent");
    } catch (u) {
      return u && u.status === 404 ? (Fe(
        "gone",
        `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
        !0
      ), j("info", "本次问卷已失效，已关闭"), "blocked") : (j("error", "提交失败: " + u.message), p ? (st.current = !1, Fn.current += 1, Fn.current >= sr && j(
        "warning",
        "自动提交连续失败 " + sr + " 次，已停止重试。请手动点「提交」，或检查网络/模型限额后重试。"
      ), Qt((v) => v + 1), "not-ready") : "blocked");
    } finally {
      de(!1);
    }
  }, Vr = () => ae("skip_mode", "per_question") === "whole", Ya = () => {
    K < 0 || (Le && ft(""), at(nt.current), Ce.current[nt.current] = !0, yt(`q${K}`), J((l) => {
      const p = { ...l };
      p[`q${K}`] = {
        type: (l[`q${K}`] || {}).type || te(be),
        value: ((l[`q${K}`] || {}).type || te(be)) === "multi" ? [] : "",
        other: "",
        skipped: !0
      };
      const g = ze(f, p);
      return f.forEach((u, v) => {
        g.indexOf(v) === -1 && delete p[`q${v}`];
      }), p;
    }), z((l) => l + 1));
  }, eo = () => {
    if (_e) {
      Yt();
      return;
    }
    const l = Kn(), p = Kr(l, K);
    if (p.length) {
      Xr(p, l, "下一步");
      return;
    }
    Le && ft(""), z((g) => g + 1);
  }, to = async () => {
    if (!q) {
      j("warning", "问卷尚未就绪，请稍候");
      return;
    }
    at(), de(!0);
    try {
      const l = await Qn("/question-modal/skip", {
        request_id: q,
        session_id: Y(i)
      });
      if (l && l.orphan) {
        Fe(
          "orphan",
          `本次问卷已失效：问卷服务在作答期间重启，原来的等待已中断。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
        return;
      }
      j("info", "已跳过问卷"), le(i), Ve(!0), Ye("用户跳过了本次问卷（在卡片上点了「跳过问卷」）"), pt("用户跳过了本次问卷。"), In(Date.now()), zn(!1), Ft(!1), Be.current = !1, Wt.current = !1, gt.current = !0, x(!0);
    } catch (l) {
      if (l && l.status === 404) {
        Fe(
          "gone",
          `本次问卷已失效：后端已不再保留这条记录（可能已过期或服务曾重启）。
无需再操作，请直接在对话中继续。`,
          !0
        ), j("info", "本次问卷已失效，已关闭");
        return;
      }
      j("error", "跳过失败: " + l.message);
    } finally {
      de(!1);
    }
  };
  e.useEffect(() => {
    if (b || Q !== "ai" && Q !== "recommend" || Se || (Q === "recommend" || Q === "ai") && !xt || !dn(d) || !f.length || B) return;
    if (_e) {
      if (st.current || Fn.current >= sr) return;
      const Z = Kn();
      if (!Xt.every(
        (pe, ne) => !!De.current[ne] || ct(Z[`q${pe}`])
      ) || !q) return;
      st.current = !0, Yt(void 0, !0).then((pe) => {
        pe === "not-ready" && (st.current = !1);
      });
      return;
    }
    const l = I;
    if (Zt.current[l] || Q === "ai" && !De.current[l]) return;
    const p = Xt[l], g = f[p], u = te(g), v = Ss(g), T = Es(Re.current[l], p);
    if (Q === "ai" && !De.current[l]) return;
    Zt.current[l] = !0;
    const E = v.length ? v.join("、") : T, X = !!E;
    yt(`q${p}`), X || (Jt.current[p] = !0, Ba((Z) => Z + 1), j("warning", "第 " + (p + 1) + " 题没有可用的推荐，已标记为未作答")), J((Z) => {
      const ye = { ...Z }, pe = `q${p}`, ne = ye[pe] || { type: u, value: u === "multi" ? [] : "", other: "" };
      if (!X)
        ye[pe] = {
          ...ne,
          type: u,
          value: u === "multi" ? [] : "",
          other: "",
          skipped: !0,
          skipped_by: "no_recommend"
        };
      else if (u === "multi") {
        const Ue = g.options || [], xe = (V) => String(V).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), qe = E.split(/[、,，]/).map((V) => xe(V)).filter(Boolean).map((V) => {
          const O = Ue.find((oe) => ke(oe) === V || Ae(oe) === V);
          return O ? ke(O) : V;
        });
        ye[pe] = {
          ...ne,
          type: u,
          value: qe,
          other: qe.length === 1 && qe[0] === ce ? ne.other : "",
          attachments: qe.length === 1 && qe[0] === ce ? ne.attachments : []
        };
      } else if (u === "single") {
        const Ue = g.options || [], xe = (O) => String(O).replace(/^\s*推荐\s*[·:：\-]\s*/, "").trim(), qe = Ue.find((O) => ke(O) === E || Ae(O) === E) || Ue.find((O) => ke(O) === xe(E) || Ae(O) === xe(E)), V = qe ? ke(qe) : E;
        ye[pe] = {
          ...ne,
          type: u,
          value: V,
          other: String(V) === ce ? ne.other : "",
          attachments: String(V) === ce ? ne.attachments : []
        };
      } else
        ye[pe] = { ...ne, type: u, value: E };
      const St = ze(f, ye);
      return f.forEach((Ue, xe) => {
        St.indexOf(xe) === -1 && delete ye[`q${xe}`];
      }), ye;
    }), Ce.current[l] = !0, De.current[l] = !0, z((Z) => Z + 1), Qt((Z) => Z + 1);
  }, [
    b,
    Q,
    Se,
    B,
    i,
    I,
    Pa,
    We,
    d,
    // reqId 必须在内：自动提交要等它就绪（竞态修复，见末页分支注释）。
    // backendDown 必须在内（阶段 2）：它变化决定前端是"让位"还是"自己动"，
    // 不进依赖数组的话 SSE 断开后本页永远不会开始驱动。
    q,
    xt
  ]);
  const wt = e.useRef(!1), He = e.useRef(0), vt = e.useRef(!1), Ne = e.useRef({});
  e.useEffect(() => {
    if (b || !i) return;
    let l = !0;
    const p = (u) => {
      if (!(!l || !u)) {
        wt.current = !0, vt.current = !0;
        try {
          if (Array.isArray(u.questions) && u.questions.length && (!f || f.length), u.answers && typeof u.answers == "object" && (J((T) => {
            const E = { ...T };
            return Object.keys(u.answers).forEach((X) => {
              const Z = u.answers[X];
              !Z || typeof Z != "object" || bt.current.has(X) || (E[X] = {
                ...E[X] || { type: "single", value: "", other: "" },
                ...Z
              });
            }), E;
          }), Ge(i, { answers: u.answers })), typeof u.cursor == "number" && u.cursor >= 0 && z(u.cursor), typeof u.mode == "string" && u.mode) {
            const T = Ct(u.mode);
            Ht((E) => E === T ? E : T);
          }
          u.per_question && typeof u.per_question == "object" && Object.keys(u.per_question).forEach((T) => {
            const E = parseInt(T, 10);
            !isNaN(E) && u.per_question[T] && (Re.current[E] = u.per_question[T]);
          }), u.status === "submitted" && (In((T) => T || Date.now()), u.released && Ge(i, { backendReleased: !0 }), x(!0), le(i));
          const v = String(u.skip_reason || "").trim();
          v && Ye((T) => T || v), typeof u.mode == "string" && u.mode && (Ne.current.mode = Ct(u.mode)), Object.keys(u.answers || {}).forEach((T) => {
            Ne.current["a:" + T] = JSON.stringify(u.answers[T] || {});
          }), typeof u.cursor == "number" && (Ne.current.cursor = "c:" + u.cursor), vt.current = !0, Qt((T) => T + 1);
        } finally {
          setTimeout(() => {
            wt.current = !1;
          }, 0);
        }
      }
    };
    gi(i).then((u) => {
      !l || !u || !u.found || !u.state || (He.current = Math.max(He.current, u.rev), p(u.state));
    });
    const g = hi(i, {
      onSnapshot: (u, v) => {
        He.current = Math.max(He.current, u), v && p(v);
      },
      onChange: (u) => {
        const v = parseInt(u.rev || 0, 10) || 0;
        v && v <= He.current && u.origin !== qn() || (He.current = Math.max(He.current, v), !(u.origin && u.origin === qn()) && p(u.state));
      },
      onStatus: (u) => {
        l && ja((v) => v === !u ? v : !u);
      }
    });
    return () => {
      l = !1, g();
    };
  }, [b, i]), e.useEffect(() => {
    b || !i || wt.current || vt.current && Object.keys(H || {}).forEach((l) => {
      const p = JSON.stringify(H[l] || {});
      Ne.current["a:" + l] !== p && (Ne.current["a:" + l] = p, cn(
        i,
        "set_answer",
        { key: l, answer: H[l] }
      ));
    });
  }, [b, i, JSON.stringify(H)]), e.useEffect(() => {
    if (b || !i || wt.current || !vt.current) return;
    const l = "c:" + I;
    Ne.current.cursor !== l && (Ne.current.cursor = l, cn(i, "goto", { cursor: I }));
  }, [b, i, I]), e.useEffect(() => {
    b || !i || wt.current || vt.current && Ne.current.mode !== Q && (Ne.current.mode = Q, cn(i, "set_mode", { mode: Q }));
  }, [b, i, Q]);
  const en = {
    background: "var(--app-surface-raised, #fff)",
    border: "1px solid var(--app-border, rgba(127,127,127,0.25))",
    borderRadius: 12,
    boxShadow: "var(--app-shadow-sm, 0 2px 8px rgba(0,0,0,0.08))",
    padding: "16px 20px",
    marginBottom: 8,
    color: "var(--app-text, inherit)",
    fontSize: 13
  }, Xn = {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  }, Vn = { flex: 1, display: "flex", alignItems: "center", gap: 8 }, tn = { fontSize: 14, fontWeight: 600, color: "var(--app-text, inherit)" }, Yn = {
    background: "var(--app-accent-soft, rgba(255,127,22,0.14))",
    borderRadius: 14,
    padding: "2px 10px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--app-accent-text, var(--app-accent, #ff7f16))",
    fontFamily: "SF Mono,Monaco,Consolas,monospace",
    flex: "none"
  }, Yr = { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }, er = {
    fontSize: 12,
    color: "var(--app-text-tertiary, inherit)",
    fontWeight: 500
  }, no = { display: "flex", flexDirection: "column", gap: 8 }, nn = {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 8,
    borderTop: "1px solid var(--app-border-subtle, rgba(127,127,127,0.15))"
  }, rn = {
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
  }, _t = {
    ...rn,
    background: "transparent",
    border: "1.5px solid var(--app-border-strong, rgba(127,127,127,0.45))",
    color: "var(--app-text-secondary, inherit)",
    boxShadow: "none"
  }, ro = {
    ...rn,
    border: "none",
    background: "linear-gradient(135deg, var(--app-accent, #ff7f16) 0%, var(--app-accent-active, #d96a10) 100%)",
    color: "var(--app-text-inverse, #fff)",
    boxShadow: "0 2px 8px var(--app-accent-ring, rgba(255,127,22,0.2))"
  }, tr = {
    ...rn,
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
  }, es = {
    // Restored to the original look (user asked for options to stay as-is).
    ...tr,
    border: "1.5px solid var(--app-accent, #ff7f16)",
    color: "var(--app-accent, #ff7f16)",
    background: "var(--app-accent-soft, rgba(255,127,22,0.08))"
  }, ts = {
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
  }, so = { height: 32, fontSize: 13, borderRadius: 8 }, ns = { fontSize: 13, borderRadius: 8, lineHeight: 1.5 }, rs = (l) => {
    const p = ke(l);
    return G.type === "multi" ? Array.isArray(G.value) && G.value.indexOf(p) !== -1 : G.value === p;
  }, ss = rs(ce), as = (l) => {
    if (b || B) return;
    const p = ke(l);
    if (G.type === "multi") {
      const g = Array.isArray(G.value) ? G.value.slice() : [], u = g.indexOf(p);
      u === -1 ? g.push(p) : g.splice(u, 1);
      const v = g.length === 1 && g[0] === ce;
      it({
        ...G,
        value: g,
        other: v ? G.other : "",
        attachments: v ? G.attachments : []
      });
    } else {
      const g = p === ce;
      it({
        ...G,
        value: p,
        other: g ? G.other : "",
        attachments: g ? G.attachments : []
      });
    }
  }, ao = !!ae("show_recommend_badge", !0), os = ae("badge_position", "left") === "right", oo = ae("badge_style", "rect") === "round", is = (l) => l && ao ? e.createElement("span", {
    key: "rec",
    className: "qm-rec-badge",
    "data-qm-rec": "true",
    style: oo ? { ...ts, borderRadius: 999 } : ts
  }, "AI 推荐") : null, io = !!ae("auto_number_options", !0), lo = !!ae("highlight_recommended", !1), co = { background: "var(--app-accent-faint, rgba(255,127,22,0.08))" }, ls = (l, p, g, u, v, T) => e.createElement(
    "button",
    {
      key: u,
      type: "button",
      disabled: b || B,
      // A recommended row is NEUTRAL like any other (#3): no accent tint, so
      // colour never reads as "already selected".  All recommendation signal
      // lives in the left badge.  btnRowRec is intentionally empty (kept so a
      // future tweak has one obvious home).
      // 推荐项底色（c3）：默认关闭——只用徽章表达，避免被误读成「已选中」。
      style: v && lo ? { ...p ? es : tr, ...co } : p ? es : tr,
      onClick: g
    },
    // 徽章位置可配（c1）：默认在选项文字左侧。
    os ? null : is(v),
    e.createElement("span", {
      style: { flex: 1, minWidth: 0, whiteSpace: "normal", textAlign: "left" }
    }, (p ? "✓ " : "") + (T && io ? T + ". " : "") + l),
    os ? is(v) : null
  );
  if (!b && !dn(d))
    return e.createElement(
      "div",
      { style: en, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: Xn, className: "qm-header" },
        e.createElement(
          "div",
          { style: Vn },
          ar(e),
          e.createElement("span", { style: tn, className: "qm-title" }, w)
        ),
        e.createElement("span", { style: Yn }, "准备中")
      ),
      e.createElement("div", {
        style: { ...Yr, color: "var(--app-text-tertiary, inherit)", fontSize: 12 }
      }, "正在准备题目…"),
      // The chat is already parked while this card prepares, so the escape
      // hatch must exist here too — otherwise a card whose arguments never
      // arrive would block the session with no way out.
      Mr ? e.createElement(
        "div",
        { style: nn },
        e.createElement("button", {
          type: "button",
          disabled: B,
          style: { ..._t, marginLeft: "auto" },
          title: "释放本次问卷的阻塞，让会话恢复可用",
          onClick: Zr
        }, "释放本次问卷")
      ) : null
    );
  if (b) {
    const l = () => {
      const g = li({
        submittedAt: et,
        deadReason: he,
        releasedNote: me,
        skippedAll: ge,
        // retired = 后台计时到寿命上限 → 整行退休（也覆盖「判定成功后等到退休」
        // 那条路径：判定成功只停轮询、不改视图）。
        retired: mt,
        pastSoft: Nn,
        // observed = 本实例真的在等这段。历史卡（提交超出寿命窗口）为 false，
        // 绝不显示「模型处理中」，也不挂释放按钮（用户裁定 q1=分情况）。
        observed: !!gt.current
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
      }, ii(g.phase)) : null;
    }, p = !!gt.current;
    return ge && !jt ? e.createElement(
      "div",
      {
        style: {
          ...en,
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
        he ? "⚠ 问卷已失效" : "✓ 已跳过问卷"
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
          ...tn,
          flex: me || Oe ? "0 1 auto" : 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: 0.75
        },
        title: w
      }, w),
      me ? e.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          color: "var(--app-text-secondary, inherit)"
        }
      }, me) : l(),
      e.createElement("button", {
        type: "button",
        style: {
          ..._t,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: () => Rr(!0)
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
        disabled: B,
        title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
        style: {
          ..._t,
          minWidth: 0,
          height: 26,
          padding: "0 10px",
          fontSize: 12
        },
        onClick: Qr
      }, "释放阻塞") : null
    ) : e.createElement(
      "div",
      { style: en, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
      e.createElement(
        "div",
        { style: { ...Xn, marginBottom: 8, paddingBottom: 8 } },
        e.createElement(
          "div",
          { style: Vn },
          ar(e),
          e.createElement("span", { style: tn }, w)
        ),
        e.createElement(
          "span",
          { style: { ...Yn, color: he ? "var(--app-warning-text, #d46b08)" : "var(--app-success-text, #389e0d)" } },
          he ? "已失效" : ge ? "已跳过" : "已完成"
        )
      ),
      // 展开后的只读卡：单独一节醒目「跳过原因」，便于复盘自动模式整卷跳过。
      // 与折叠行共用同一个 skipReason（真相源唯一），不在此另做解析。
      ge && (Oe || he) ? e.createElement(
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
        String(Oe || he || "问卷已失效/跳过")
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
      }, ge ? dt ? dt + `

` + hn(f) : `已跳过本次问卷。

` + hn(f) : dt || S || k || `本条问卷的回答已不在插件缓存中（插件可能已重启）。
完整内容可在会话记录/历史中查看。

` + hn(f)),
      ge && jt ? e.createElement(
        "div",
        { style: nn },
        e.createElement("button", {
          type: "button",
          style: _t,
          onClick: () => Rr(!1)
        }, "收起")
      ) : null,
      // Same escape hatch as the collapsed row: an answered card does NOT
      // guarantee the agent was unparked, so keep a manual release available.
      e.createElement(
        "div",
        { style: { ...nn, marginTop: 8, gap: 10 } },
        me ? e.createElement("span", {
          style: {
            flex: 1,
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--app-text-secondary, inherit)"
          }
        }, me) : l(),
        // 同上，用户裁定 q1=分情况（历史卡不显示；万一真有悬挂的 Future，
        // 宿主自己的「停止」按钮仍然可用，它走 app 级 tool_coordinator）。
        p ? e.createElement("button", {
          type: "button",
          disabled: B,
          title: "若会话仍被本次问卷阻塞（发新消息报 A task is already running），点此释放",
          style: { ..._t, marginLeft: "auto", minWidth: 0, height: 26, padding: "0 10px", fontSize: 12 },
          onClick: Qr
        }, "释放阻塞") : null
      )
    );
  }
  const cs = fe && $ === kt, ds = !b && !_e && La >= 0 && Jt.current[K] ? e.createElement("div", {
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
  }, "⚠ 本题没有可用的推荐，已标记为未作答（可手动选择后继续）") : null, ps = Object.keys(Jt.current).map((l) => Number(l)).filter((l) => Jt.current[l] && Number.isFinite(l)).sort((l, p) => l - p), po = _e && ps.length ? e.createElement("div", {
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
  }, "⚠ 第 " + ps.map((l) => l + 1).join("、") + " 题没有可用推荐，已按未作答提交") : null;
  let sn = null;
  if (_e)
    sn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: er }, "其他意见（可选）"),
      po,
      e.createElement(a, {
        rows: 2,
        placeholder: "补充意见（可选，可粘贴图片/文件）",
        value: R,
        style: ns,
        onChange: (l) => Me(l.target.value),
        onPaste: (l) => Zn(l, "final", "final")
      }),
      ur({
        R: e,
        files: ut,
        disabled: b || B,
        uploading: Hn,
        error: Gn,
        onPick: () => Jn("final", "final"),
        onRemove: (l) => Or((p) => p.filter((g, u) => u !== l))
      })
    );
  else if (be && te(be) === "text")
    sn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...er, fontSize: 13, color: "var(--app-text, inherit)" } }, kn(be, K)),
      ds,
      e.createElement(a, {
        rows: 2,
        placeholder: "请输入...（可直接粘贴图片/文件）",
        value: typeof G.value == "string" ? G.value : "",
        style: ns,
        onChange: (l) => it({ ...G, value: l.target.value, other: "" }),
        onPaste: (l) => Zn(l, "q", ot)
      }),
      ur({
        R: e,
        files: G.attachments || [],
        disabled: b || B,
        uploading: Hn,
        error: Gn,
        onPick: () => Jn("q", ot),
        onRemove: (l) => it({
          ...G,
          attachments: (G.attachments || []).filter((p, g) => g !== l)
        })
      })
    );
  else if (be) {
    const l = Ss(be), p = Es(Ut, K), g = l.length ? l : p ? [p] : l, u = (be.options || []).map((v, T) => ls(
      Ae(v),
      rs(v),
      () => as(v),
      "o" + T,
      _i(be, v, g),
      T + 1
    ));
    u.push(ls("其他", ss, () => as(ce), "other")), ss && (u.push(e.createElement(r, {
      key: "oi",
      placeholder: "请填写（可直接粘贴图片/文件）",
      value: G.other,
      style: { ...so, marginTop: 2 },
      onChange: (v) => it({ ...G, other: v.target.value }),
      onPaste: (v) => Zn(v, "q", ot)
    })), u.push(ur({
      R: e,
      files: G.attachments || [],
      disabled: b || B,
      uploading: Hn,
      error: Gn,
      onPick: () => Jn("q", ot),
      onRemove: (v) => it({
        ...G,
        attachments: (G.attachments || []).filter((T, E) => E !== v)
      })
    }))), sn = e.createElement(
      "div",
      null,
      e.createElement("div", { style: { ...er, fontSize: 13, color: "var(--app-text, inherit)" } }, kn(be, K)),
      ds,
      e.createElement("div", { style: { ...no, marginTop: 8 } }, u)
    );
  }
  const nr = We + 1, uo = _e ? nr + "/" + nr : I + 1 + "/" + nr, qt = {
    ...rn,
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
    { style: en, className: "qm-card", "data-qm-card": "true", "data-qm-card-id": i },
    e.createElement(
      "div",
      { style: Xn, className: "qm-header" },
      e.createElement(
        "div",
        { style: Vn },
        ar(e),
        e.createElement("span", { style: tn, className: "qm-title" }, w)
      ),
      // Analysis controls, right of the progress counter: capsule model
      // picker + AI/manual switch + 「查看分析」bubble.
      e.createElement(
        "div",
        {
          className: "qm-actions",
          style: { display: "flex", alignItems: "center", gap: 8, flex: "none" }
        },
        el({
          R: e,
          providers: va,
          modelId: Pr,
          disabled: b || B,
          // 服务端标记：此值来自「跟随当前对话模型」
          open: Ta,
          onOpenChange: Aa,
          tab: Ca,
          onTabChange: Ia,
          onChange: (l) => {
            Kt({ modelId: l }), tt(null), Re.current = {}, Ce.current = {}, rt((p) => p + 1);
          }
        }),
        nl({
          R: e,
          templates: Dr,
          value: je,
          open: za,
          onOpenChange: $a,
          disabled: b || B,
          onSelect: Ur,
          onManage: () => Fr(!0)
        }),
        tl({
          R: e,
          mode: Q,
          disabled: b || B,
          onChange: (l) => {
            Kt({ mode: l }), l === "ai" && (Ce.current = {}), l === "ai" || l === "recommend" ? (Zt.current = {}, De.current = {}, st.current = !1, rt((p) => p + 1)) : at();
          }
        }),
        sl({
          R: e,
          busy: jr,
          result: Ut,
          error: qa,
          mode: Q,
          disabled: b || B,
          open: Sa,
          onOpenChange: Ea,
          onRun: () => {
            Wn("manual");
          },
          onRerun: Ua,
          onApply: Za,
          onCancel: Ga,
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
                onChange: (l) => Kt({ withContext: !!l.target.checked })
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
                checked: Ln,
                onChange: (l) => Kt({ parallel: !!l.target.checked })
              }),
              "并行分析"
            )
          ]
        }),
        // #4 takeover latch — only in AI mode, never on a finished card.
        (Q === "ai" || Q === "recommend") && !b ? e.createElement("button", {
          type: "button",
          key: "qm-auto",
          disabled: B,
          onClick: Ja,
          style: {
            ...qt,
            height: 24,
            padding: "0 10px",
            fontSize: 12,
            flex: "none",
            ...Se ? {
              borderColor: "var(--app-accent, #ff7f16)",
              color: "var(--app-accent-text, var(--app-accent, #ff7f16))"
            } : null
          },
          title: Se ? "恢复自动答题" : "暂停自动答题，交给你手动作答"
        }, Se ? "▶ 继续" : "⏸ 停止") : null,
        // #1 the progress counter now lives in the SAME flex row, so it can no
        // longer crowd the controls; #2 the permanent completion chip is gone
        // (replaced by the one-shot toast in runAnalysis).
        e.createElement("span", { style: Yn, key: "qm-step" }, uo)
      )
    ),
    e.createElement("div", { style: Yr }, sn),
    // 阶段 1（2026-11-07）：删除「只读视图」横幅。
    //
    // 它属于旧的前端互斥方案（租约）：抢不到租约的标签页被降级成只读。
    // 现在后端是唯一真值、两个标签页都渲染同一份 state、操作由后端幂等裁决，
    // 所以「只读」这个中间态不存在了 —— 留着它反而会让用户以为不能操作。
    // Template library manager (REQ-003/005): a global overlay panel.  Rendered
    // from the card so its open/draft state lives in the parent (hook-free).
    rl({
      R: e,
      open: Oa,
      templates: Dr,
      value: je,
      edit: Ra,
      onEditChange: Dn,
      onClose: () => {
        Fr(!1), Dn(null);
      },
      onSelect: (l) => Ur(l),
      onSave: Wa,
      onDelete: Ha
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
    (cs || Mr && !q) && !b ? e.createElement(
      "div",
      {
        className: "qm-block-banner",
        "data-qm-slow": fe ? i : void 0,
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
        (cs ? "⚠️ 本题已超过 " + Ka + "s，可直接跳过或继续作答，" : "⚠️ 无法取得本次问卷的会话句柄，") + "阻塞期间发新消息会报「A task is already running」；" + (q ? "若你不想继续作答，可点击右侧按钮释放。" : "且未能取得本次问卷的会话句柄，点击右侧按钮释放。")
      ),
      e.createElement("button", {
        type: "button",
        disabled: B,
        style: {
          ...qt,
          height: 28,
          padding: "0 12px",
          borderColor: "var(--app-warning-border, rgba(250,173,20,0.6))"
        },
        onClick: Zr,
        title: "释放本次问卷的阻塞，让会话恢复可用"
      }, "释放本次问卷")
    ) : null,
    // Persistent gate-rejection banner (red).  Doubles as proof-of-bundle:
    // the BUNDLE_TAG it prints can only come from a build that actually
    // contains the strict gate — so if a「没被拦」report shows no such line,
    // the browser is running a stale pre-gate bundle, not a logic bug.
    Le && !b ? e.createElement("div", {
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
      "data-qm-bundle": ks
    }, Le) : null,
    e.createElement(
      "div",
      { style: nn, className: "qm-footer" },
      e.createElement("button", {
        type: "button",
        disabled: I === 0 || B,
        style: { ...qt, marginRight: "auto", opacity: I === 0 ? 0.5 : 1 },
        onClick: () => z((l) => l - 1)
      }, "上一步"),
      // Skip one question: advances without answering, survey stays open.
      // On the 其他意见 page there is no question left, so this becomes
      // "skip and submit" (the remaining answers are sent as-is).
      e.createElement(
        "button",
        {
          type: "button",
          disabled: B,
          style: qt,
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
          onClick: _e ? () => Yt(void 0, !0) : Vr() ? () => Yt(void 0, !0) : Ya
        },
        _e || Vr() ? "跳过并提交" : "跳过本题"
      ),
      // Skip the whole survey: resolves the tool call and collapses the card.
      e.createElement("button", {
        type: "button",
        disabled: B,
        style: qt,
        onClick: to
      }, "跳过问卷"),
      e.createElement("button", {
        type: "button",
        disabled: B,
        style: ro,
        onClick: eo
      }, _e ? "提交" : "下一步")
    )
  );
}
const Ns = 12;
let zs = 0;
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
    thrBusy: !1
  }
};
let zt = null;
function ee(t, e, n) {
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
function ol(t) {
  const e = c.cfg && c.cfg.config;
  if (!e) return !1;
  const n = e.__sources__, r = e[t];
  return !!(n && n[t] === "session" && (r === "" || r === null));
}
function ie(t, e) {
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
  n === e ? delete c.draft[t] : c.draft[t] = e, c.saveMsg = "", N();
}
function $s() {
  return Object.keys(c.draft).length;
}
async function zr() {
  try {
    const t = await fetch(M("/question-modal/prefs"), { headers: L() });
    if (!t.ok) return;
    const e = await t.json(), n = e && e.prefs || {};
    c.globalCfg = n && typeof n == "object" ? n : {};
    try {
      N();
    } catch {
    }
  } catch {
  }
}
async function pa() {
  try {
    const t = await fetch(M("/question-modal/notify/channels"), {
      headers: L()
    });
    if (!t.ok) return;
    const e = await t.json();
    c.notifyChannels = Array.isArray(e && e.channels) ? e.channels : [], c.notifyCurrent = String(e && e.effective || "off");
    try {
      N();
    } catch {
    }
  } catch {
  }
}
async function $r(t) {
  if (!(!t || t === "off"))
    try {
      const e = await fetch(
        M("/question-modal/notify/test-log?channel=" + encodeURIComponent(t)),
        { headers: L() }
      );
      if (!e.ok) return;
      const n = await e.json();
      c.notifyLog = {
        ...c.notifyLog,
        [t]: Array.isArray(n && n.items) ? n.items : []
      };
      try {
        N();
      } catch {
      }
    } catch {
    }
}
async function il(t) {
  if (!t || t === "off") return;
  c.notifyTesting = t, c.notifyMsg = { ...c.notifyMsg, [t]: "发送中…" };
  try {
    N();
  } catch {
  }
  let e = "", n = null;
  try {
    n = await (await fetch(M("/question-modal/notify/test"), {
      method: "POST",
      headers: { ...L(), "Content-Type": "application/json" },
      body: JSON.stringify({ channel: t })
    })).json().catch(() => ({})), n && n.delivered ? e = n.note ? "✓ 已发送（" + n.note + "）" : "✓ 测试消息已送达" : e = "✗ " + (n && (n.error || n.reason) || "测试失败");
  } catch (s) {
    e = "✗ 请求失败：" + String(s && s.message || s);
  }
  c.notifyTesting = "", c.notifyMsg = { ...c.notifyMsg, [t]: e };
  const r = n && Array.isArray(n.history) ? n.history : null;
  r && (c.notifyLog = { ...c.notifyLog, [t]: r }), await pa(), r || await $r(t);
  try {
    N();
  } catch {
  }
}
async function ll() {
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
  t.length, c.saving = !0, c.saveMsg = "", N();
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
    const a = await fetch(M(r), {
      method: "POST",
      headers: L(),
      body: JSON.stringify(s)
    }), o = await a.json().catch(() => ({}));
    if (!a.ok) {
      c.saving = !1, c.saveMsg = o && o.detail ? String(o.detail) : "保存失败（" + a.status + "）", N();
      return;
    }
    const d = Array.isArray(o && o.rejected) ? o.rejected : [];
    if (d.length) {
      c.saving = !1;
      const f = d.map((w) => `${w.key}：${w.reason || "取值不合法"}`).join("；");
      c.saveMsg = "部分设置未生效 —— " + f, N();
      return;
    }
    c.saving = !1, c.draft = {}, Xs();
    const i = Array.isArray(o && o.conflicts) ? o.conflicts : [];
    if (c.conflictNote = "", i.length) {
      const f = (b) => {
        try {
          const x = new Date(b * 1e3), S = (_) => _ < 10 ? "0" + _ : String(_);
          return x.getMonth() + 1 + "-" + S(x.getDate()) + " " + S(x.getHours()) + ":" + S(x.getMinutes()) + ":" + S(x.getSeconds());
        } catch {
          return "";
        }
      }, w = i.reduce(
        (b, x) => Math.max(b, Number(x && x.at) || 0),
        0
      ), m = i.map((b) => String(b && b.key || "")).filter(Boolean);
      c.conflictNote = "设置已于 " + f(w) + " 被其它位置修改，本次已按后写入的值覆盖" + (m.length ? "（" + m.join("、") + "）" : "") + "。";
    }
    try {
      const f = o && o.key_ts || {};
      f && typeof f == "object" && (c.keyTs = Object.assign({}, c.keyTs, f));
    } catch {
    }
    e || zr();
    const h = ["session", "default"].indexOf(String(c.tab)) >= 0;
    let k = "";
    if (h && (k = e ? "session" : "default"), k === "default") {
      try {
        const f = await fetch(M("/question-modal/session-prefs"), {
          method: "POST",
          headers: L(),
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
        f.ok || (c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖（" + f.status + "），本会话仍在会话模式。", k = "");
      } catch (f) {
        c.saveMsg = "已保存全局默认，但未能清除本会话的模式覆盖：" + (f && f.message ? f.message : f) + "，本会话仍在会话模式。", k = "";
      }
      c.keyTs = {};
    }
    if (k && (c.scopeChoice = k, c.tab = k, c.scope = k === "session" ? "session" : "global"), k === "default")
      c.saveMsg = "已保存为全局默认；本会话已切换到默认模式（跟随全局，原会话设置仍保留，切回会话模式可恢复）。";
    else if (k === "session")
      c.saveMsg = "已保存到本会话；本会话当前按会话模式运行（未改动的项仍跟随全局，全局默认未被修改）。";
    else {
      const f = String(c.tab) === "prompt" ? "提示词模板" : "全局配置";
      c.saveMsg = "已保存" + f + "；运行模式未变" + (c.scopeChoice === "session" ? "（本会话仍按「会话模式」运行）" : "（本会话仍按「默认模式」运行）") + "。";
    }
    Lt(
      c.chatId,
      !0,
      c.sessionId,
      c.agentId
    ).then((f) => {
      f && (c.cfg = f);
      try {
        N();
      } catch {
      }
    }).catch(() => {
    });
  } catch (r) {
    c.saving = !1, c.saveMsg = "保存请求失败：" + (r && r.message ? r.message : r);
  }
  try {
    N();
  } catch {
  }
}
function ua() {
  c.draft = {}, c.saveMsg = "";
}
function fa() {
  Ar().then((t) => {
    c.templates = (t && t.items || []).filter((e) => e && e.id), c.templateOptions = c.templates.map((e) => e.id);
    try {
      N();
    } catch {
    }
  }).catch(() => {
  });
}
function cl() {
  c.tplEdit = {
    id: "",
    name: "",
    system_prompt: "",
    user_prompt: ""
  }, c.saveMsg = "", N();
}
function dl(t) {
  const e = c.templates.filter((n) => n.id === t)[0];
  e && (c.tplEdit = {
    id: String(e.id),
    name: String(e.name || ""),
    system_prompt: String(e.system || e.system_prompt || e.prompt || ""),
    user_prompt: String(e.user || e.user_prompt || "")
  }, c.saveMsg = "", N());
}
function Os(t, e) {
  try {
    window.__qmDbg = (window.__qmDbg || []).concat([t + "=" + String(e).slice(0, 12)]);
  } catch {
  }
  c.tplEdit && (c.tplEdit[t] = e, N());
}
function pl() {
  c.tplEdit = null, N();
}
async function ul() {
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
    c.saveMsg = "模板名称不能为空", N();
    return;
  }
  c.tplBusy = !0, N();
  const n = {
    id: t.id || "tpl-" + Date.now().toString(36),
    name: e,
    system: t.system_prompt,
    user: t.user_prompt
  }, r = await Ys(n);
  if (c.tplBusy = !1, r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "保存失败"), N();
    return;
  }
  c.tplEdit = null, c.saveMsg = t.id ? "模板「" + e + "」已更新" : "模板「" + e + "」已创建", fa(), N();
}
async function fl(t) {
  const e = c.templates.filter((s) => s.id === t)[0];
  if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("确定删除模板「" + (e && e.name || t) + "」？") : !1)) return;
  const r = await ea(t);
  if (r && r.ok === !1) {
    c.saveMsg = String(r.error || r.detail || "删除失败（内置模板不可删除）"), N();
    return;
  }
  c.saveMsg = "模板已删除", fa(), N();
}
function ml() {
  c.visible = !0, c.chatId = "", c.sessionId = Tn(), c.cfg = null, c.cfgError = "", gl(), ma(), c.agentId = En || (() => {
    try {
      return we().getSelectedAgentId ? we().getSelectedAgentId() : "";
    } catch {
      return "";
    }
  })(), Xs();
  const t = ++zs;
  c.scopeChoice = "", c.tab = "", c.scope = "global", c.draft = {}, c.saveMsg = "", c.conflictNote = "", N(), ga(() => {
    if (t !== zs) return;
    const n = !!(c.cfg && c.cfg.has_session) ? "session" : "default";
    c.scopeChoice = n, c.tab = n === "session" ? "session" : "default", c.scope = n === "session" ? "session" : "global", c.draft = {}, c.saveMsg = "", c.keyTs = Object.assign(
      {},
      c.cfg && c.cfg.keyTs || {}
    ), c.conflictNote = "", N(), (c.tab === "global" || c.tab === "default") && zr(), pa().then(() => {
      const r = String(c.notifyCurrent || "off");
      r && r !== "off" && $r(r);
    });
  });
}
let fr = !1;
async function ma() {
  if (!fr) {
    fr = !0;
    try {
      const t = await Lt(""), e = t && t.config && t.config.release_after_sec;
      c.stale.threshold = typeof e == "number" && isFinite(e) ? e : null;
    } catch {
      c.stale.threshold = null;
    } finally {
      fr = !1;
      try {
        N();
      } catch {
      }
    }
  }
}
let pn = !1;
function gl() {
  pn || (pn = !0, Promise.all([ta(), Ar()]).then((t) => {
    pn = !1;
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
      N();
    } catch {
    }
  }).catch(() => {
    pn = !1;
  }));
}
function hl(t) {
  const e = String(t || ""), n = e.indexOf(":");
  return n <= 0 ? { provider: "", model: e } : { provider: e.slice(0, n), model: e.slice(n + 1) };
}
let mr = !1, un = "";
const gr = [];
function ga(t) {
  const e = c.chatId, n = (e || "") + "|" + (c.sessionId || "");
  if (mr && un === n) {
    t && gr.push(t);
    return;
  }
  mr = !0, un = n;
  const r = () => {
    un === n && (mr = !1, un = "");
    const s = gr.splice(0);
    try {
      s.forEach((a) => a());
    } catch {
    }
  };
  t && gr.push(t), Lt(
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
      N();
    } catch {
    }
  }).catch(() => {
    c.tab || (c.tab = "default", c.scopeChoice = "default", c.scope = "global", c.cfgError = "读取配置失败（网络异常）"), r();
    try {
      N();
    } catch {
    }
  });
}
function N() {
  const t = we().React, e = we().ReactDOM;
  if (t) {
    if (!e || typeof e.render != "function") {
      if (c.visible) {
        try {
          const n = $e();
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
    zt || (zt = document.createElement("div"), zt.id = "qm-settings-root", document.body.appendChild(zt)), e.render(t.createElement(vl, {
      R: t,
      open: c.visible,
      onClose: () => {
        if ($s() > 0) {
          if (!(typeof window < "u" && typeof window.confirm == "function" ? window.confirm("有未保存的修改，确定关闭并丢弃吗？") : !1)) return;
          ua();
        }
        c.visible = !1, c.saveMsg = "", N();
      },
      tab: c.tab,
      onTabChange: (n) => {
        c.tab = n, (n === "session" || n === "default") && (c.scopeChoice = n), c.scope = ha(n) ? "session" : "global", c.saveMsg = "", c.draft = {}, N(), ga(), (n === "global" || n === "default") && zr(), n === "stale" && ma();
      },
      scope: c.scope,
      scopeChoice: c.scopeChoice,
      sessData: c.sessData,
      cfg: c.cfg,
      cfgError: c.cfgError,
      chatId: c.chatId,
      dirtyCount: $s(),
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
    }), zt);
  }
}
function bl(t) {
  const { R: e, onOpen: n } = t, r = $e(), s = r && r.Button, a = "问卷设置", o = { fontSize: 12, padding: "2px 6px", height: 28 }, d = { title: a, "aria-label": a }, i = {
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
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, y) : e.createElement("button", {
    type: "button",
    className: "qm-set-btn",
    style: o,
    onClick: n,
    title: d.title,
    "aria-label": d["aria-label"]
  }, y) : s ? e.createElement(
    s,
    { type: "text", size: "small", style: o, onClick: n },
    a
  ) : e.createElement(
    "button",
    { type: "button", className: "qm-set-btn", style: o, onClick: n },
    a
  );
}
const hr = [
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
], ha = (t) => t === "session";
function yl(t, e, n) {
  return n !== "readonly" ? null : t.createElement("span", {
    className: "qm-set-scopetag qm-set-scopero",
    key: e,
    title: "只读信息"
  }, "只读");
}
function xl(t, e) {
  return e === "readonly" ? !0 : t === "session" && e === "global";
}
function kl(t, e) {
  const n = c.notifyChannels || [], r = String(c.notifyCurrent || "off"), s = String(ee("notify_channel", "off", "global") || r || "off"), o = ((S) => n.filter((_) => String(_.channel) === S)[0])(s), d = n.map((S) => {
    const _ = String(S.channel || ""), q = String(S.label || _), C = S.ready !== !1, I = S.verified === !0 || _ === "off";
    let z = "";
    return C ? I || (z = "（待测试）") : z = "（不可用）", { value: _, label: q + z, disabled: !C };
  });
  d.length || d.push({ value: "off", label: "关闭", disabled: !1 });
  const i = !o || o.ready !== !1, y = s !== "off" && s !== "browser", h = c.notifyTesting === s, k = o && o.last_test || null, f = c.notifyMsg[s] || "", w = [
    t.createElement("select", {
      key: "s",
      className: "qm-set-native",
      value: s,
      "data-qm-notify-select": "1",
      style: { flex: "0 0 auto" },
      onChange: (S) => {
        const _ = S && S.target ? String(S.target.value) : "off";
        ie("notify_channel", _), $r(_);
      }
    }, d.map((S, _) => t.createElement("option", {
      key: "o" + _,
      value: S.value,
      disabled: !!S.disabled
    }, S.label)))
  ];
  y && i && w.push(t.createElement("button", {
    key: "test",
    type: "button",
    disabled: h,
    "data-qm-notify-test": s,
    onClick: (S) => {
      S && S.stopPropagation && S.stopPropagation(), il(s);
    },
    style: {
      marginLeft: 8,
      padding: "2px 10px",
      fontSize: 12,
      border: "1px solid #d9d9d9",
      borderRadius: 4,
      background: "#fff",
      cursor: h ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, h ? "发送中…" : "测试")), o && o.ready === !1 && o.reason && w.push(t.createElement("span", {
    key: "rs",
    style: { marginLeft: 8, color: "#bfbfbf", fontSize: 11 }
  }, o.reason));
  const m = !!(o && o.verified === !0), b = k || f, x = !!f;
  if (b || y && i && !h) {
    const S = k ? k.delivered === !0 : x ? f.indexOf("✓") === 0 : !1;
    let _;
    x ? _ = f : k ? _ = S ? "✓ 上次测试成功" + (k.note ? "（" + k.note + "）" : "") : "✗ " + (k.error || k.note || "上次测试失败") : _ = "未测试";
    const q = k && k.at_text ? "  ·  " + k.at_text : "", C = b ? S ? "#52c41a" : "#ff4d4f" : "#faad14";
    w.push(t.createElement("span", {
      key: "res",
      "data-qm-notify-result": b ? S ? "ok" : "fail" : "none",
      // 状态锚点保留（原先挂在独立标签上，断言/取样依赖它）。
      "data-qm-notify-verified": b && (S || m) ? "1" : "0",
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
    }, _ + q));
  }
  return se(
    t,
    "e5",
    "人工模式提醒频道",
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
    }, w),
    "弹问卷时提醒一次（仅人工模式）。频道须先「测试」通过才会真正发送；测试结果会保留，可随时重测。",
    "global",
    e,
    !1,
    !0
  );
}
function se(t, e, n, r, s, a, o, d, i) {
  const y = a || "global", h = xl(o || "global", y), k = [
    t.createElement("span", { className: "qm-set-rowtitle", key: "t" }, [
      t.createElement("span", { key: "tt" }, n),
      yl(t, "sc", y),
      h && y === "global" ? t.createElement("span", {
        className: "qm-set-lockhint",
        key: "lk",
        title: "该项只有全局设置，当前处于「当前会话」作用域"
      }, "仅全局") : null
    ]),
    s ? t.createElement("span", { className: "qm-set-rownote", key: "n" }, s) : null
  ], f = [
    t.createElement("div", { className: "qm-set-rowlabel", key: "l" }, k),
    t.createElement("div", {
      className: "qm-set-rowctl" + (d ? " qm-set-rowctlwide" : ""),
      key: "c"
    }, r)
  ];
  return t.createElement("div", {
    className: "qm-set-row" + (h ? " qm-set-rowlocked" : "") + (i ? " qm-set-rowblock" : ""),
    key: e,
    "data-qm-locked": h ? "1" : "0",
    "data-qm-rowblock": i ? "1" : "0"
  }, f);
}
function Rs(t, e, n, r, s) {
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
function fn(t, e, n, r) {
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
function Je(t, e, n, r, s) {
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
function Ms(t, e, n, r, s) {
  const a = hl(n), d = r.map((w) => w.id).indexOf(a.provider) >= 0 ? a.provider : "", i = d ? (r.filter((w) => w.id === d)[0] || { models: [] }).models : [], y = i.indexOf(a.model) >= 0 ? a.model : "", h = (w, m) => {
    s && s(w ? w + ":" + m : "");
  }, k = t.createElement("select", {
    key: "p",
    className: "qm-set-native qm-set-nativep",
    "data-qm-provider": "1",
    value: d,
    disabled: !s,
    title: "厂商",
    onChange: (w) => {
      const m = w && w.target ? w.target.value : "", b = m ? (r.filter((x) => x.id === m)[0] || { models: [] }).models : [];
      h(m, m && b[0] || "");
    }
    // 2026-11-04 用户裁定：删除「跟随当前对话模型」这个可选项。
    // model_id 为空时（服务端会自动解析当前会话模型），厂商下拉不选中任何项，
    // 显示「未配置」占位；用户一旦选了厂商即显式指定模型。
  }, [t.createElement("option", { key: "g0", value: "", disabled: !0 }, "未配置")].concat(r.map((w, m) => t.createElement(
    "option",
    { key: "g" + m, value: w.id },
    w.name === w.id ? w.id : w.name + "（" + w.models.length + "）"
  )))), f = t.createElement("select", {
    key: "m",
    className: "qm-set-native qm-set-nativem",
    "data-qm-model": "1",
    value: y,
    disabled: !s || !d,
    title: d ? "选择模型" : "先选厂商",
    onChange: (w) => {
      const m = w && w.target ? w.target.value : "";
      h(d, m);
    }
  }, d ? i.map((w, m) => t.createElement("option", { key: "m" + m, value: w }, w)) : [t.createElement("option", { key: "m0", value: "" }, "—")]);
  return t.createElement("div", { className: "qm-set-select qm-set-selectlive qm-set-modelpick", key: e }, [
    k,
    t.createElement("span", { key: "sep", className: "qm-set-picksep" }, "›"),
    f
  ]);
}
function wl(t, e, n, r, s) {
  const a = [], o = n === "session" ? "session" : "global", d = {
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
  }, h = {
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
  }, f = {
    30: "30 秒",
    60: "60 秒",
    120: "120 秒",
    180: "180 秒（默认）",
    300: "300 秒",
    600: "600 秒"
  }, w = s && s.templateOptions || [];
  s && s.modelOptions;
  const m = s && s.providerGroups || [], b = w.map((x) => {
    const S = c.templates.filter((_) => String(_.id) === String(x))[0];
    return { value: x, label: S && (S.name || S.id) || x };
  });
  if (e === "session") {
    const S = String(ee("mode", "manual")) !== "recommend";
    if (a.push(se(
      t,
      "s1",
      "答题模式",
      Rs(
        t,
        "g1",
        ["自动分析", "只用推荐", "人工"],
        i[String(ee("mode", "manual"))] || "人工",
        (_) => ie("mode", d[_] || "manual")
      ),
      "本会话的问卷默认用哪种方式推进",
      "session",
      o
    )), S) {
      a.push(se(
        t,
        "s2",
        "默认模型",
        Ms(
          t,
          "sel2",
          String(ee("model_id", "")),
          m,
          (q) => ie("model_id", q)
        ),
        // 三态来源说明（与卡片胶囊共用同一份服务端标记，不会各说各话）：
        //   跟随中   → 指明跟的是"本会话"的对话模型
        //   显式设空 → 如实说你清掉了它
        //   其余     → 正常说明
        ol("model_id") ? "已显式设为空（本会话不指定模型）" : "自动读取当前对话模型；改动即自动切换",
        "session",
        o,
        !0
      ));
      const _ = String(ee("template_id", "")) || b[0] && b[0].value || "";
      a.push(se(
        t,
        "s3",
        "提示词模板",
        b.length ? Je(
          t,
          "sel3",
          _,
          b,
          (q) => ie("template_id", q)
        ) : Je(t, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "session",
        o
      )), a.push(se(
        t,
        "s4",
        "携带上下文",
        fn(
          t,
          "s4sw",
          !!ee("with_context", !1),
          (q) => ie("with_context", q)
        ),
        "附带上次决策与会话历史",
        "session",
        o
      )), a.push(se(
        t,
        "s5",
        "并行分析各题",
        fn(
          t,
          "s5sw",
          !!ee("parallel", !1),
          (q) => ie("parallel", q)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "session",
        o
      ));
    }
  } else if (e === "global" || e === "default")
    if (e === "default") {
      const _ = String(ee("mode", "manual", "global")) !== "recommend";
      a.push(se(
        t,
        "a1",
        "默认答题模式",
        Rs(
          t,
          "g1",
          ["自动分析", "只用推荐", "人工"],
          i[String(ee("mode", "manual", "global"))] || "人工",
          (q) => ie("mode", d[q] || "manual")
        ),
        "本会话的问卷默认用哪种方式推进",
        "both",
        o
      )), _ && (a.push(se(
        t,
        "b1",
        "默认模型",
        Ms(
          t,
          "sel2",
          String(ee("model_id", "", "global")),
          m,
          (q) => ie("model_id", q)
        ),
        "自动读取当前对话模型；改动即自动切换",
        "both",
        o,
        !0
      )), a.push(se(
        t,
        "b2",
        "提示词模板",
        b.length ? Je(
          t,
          "sel3",
          String(ee("template_id", "", "global")) || b[0].value,
          b,
          (q) => ie("template_id", q)
        ) : Je(t, "sel3", "默认六步思维链"),
        b.length ? "自动分析模式下将调用提示词并自动分析" : "模板库未加载，暂不可选",
        "both",
        o
      )), a.push(se(
        t,
        "b3",
        "携带上下文",
        fn(
          t,
          "s3",
          !!ee("with_context", !1, "global"),
          (q) => ie("with_context", q)
        ),
        "附带上次决策与会话历史",
        "both",
        o
      )), a.push(se(
        t,
        "b4",
        "并行分析各题",
        fn(
          t,
          "s4",
          !!ee("parallel", !1, "global"),
          (q) => ie("parallel", q)
        ),
        "逐题并发调用模型，更快，但更耗额度。",
        "global",
        o
      )));
    } else {
      a.push(kl(t, o)), a.push(se(
        t,
        "e6",
        "单题分析超时",
        Je(
          t,
          "sel4",
          h[Number(ee("model_timeout_sec", 120, "global"))] || "120 秒（默认）",
          ["30 秒", "60 秒", "120 秒（默认）", "300 秒", "600 秒"],
          (I) => ie("model_timeout_sec", y[I] ?? 120)
        ),
        "超时后该题按未给出推荐处理（后端保护下限 30 秒）",
        "global",
        o
      )), a.push(se(
        t,
        "d4",
        "等待提示阈值",
        Je(
          t,
          "sel5",
          f[Number(ee("wait_hint_sec", 180, "global"))] || "180 秒（默认）",
          ["30 秒", "60 秒", "120 秒", "180 秒（默认）", "300 秒", "600 秒"],
          (I) => ie("wait_hint_sec", k[I] ?? 180)
        ),
        "超过后提示可释放（保护下限 30 秒）",
        "global",
        o
      ));
      const S = ["不保留", "最近 50 条", "最近 200 条（默认）", "最近 500 条", "最近 1000 条"], _ = {
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
      }, C = Number(ee("gate_log_limit", 200, "global"));
      a.push(se(
        t,
        "d5",
        "拦截记录",
        Je(
          t,
          "sel6",
          q[C] || "最近 200 条（默认）",
          S,
          (I) => ie("gate_log_limit", _[I] ?? 200)
        ),
        "用于排查卡住问题；“不保留”= 不记录",
        "global",
        o
      ));
    }
  else if (e === "prompt") {
    const x = c.templates, S = c.tplEdit;
    if (a.push(se(
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
      x.map((_, q) => {
        const C = !!_.builtin, z = (String(_.note || _.desc || "").trim() || String(_.system || _.system_prompt || _.prompt || "")).replace(/```[\s\S]*?```/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim(), A = z.length > 90 ? z.slice(0, 90) + "…" : z;
        return t.createElement("div", { className: "qm-set-item", key: "i" + q }, [
          t.createElement("div", { className: "qm-set-itemhead", key: "h" }, [
            t.createElement(
              "span",
              { className: "qm-set-itemname", key: "n" },
              String(_.name || _.id)
            ),
            t.createElement("span", {
              className: "qm-set-tag" + (C ? " qm-set-tagbuiltin" : ""),
              key: "g"
            }, C ? "内置" : "自定义"),
            t.createElement("span", { className: "qm-set-itemspacer", key: "sp" }),
            // 每行自带操作：内置模板可「编辑」（同 id 覆盖，可删除回滚），
            // 但不可「删除」——删除按钮对内置项置灰。
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "ed",
              "data-qm-tpl-edit": String(_.id),
              onClick: () => {
                dl(String(_.id));
              }
            }, "编辑"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini" + (C ? " qm-set-minidis" : ""),
              key: "del",
              "data-qm-tpl-del": String(_.id),
              disabled: C,
              title: C ? "内置模板不可删除（可编辑覆盖，删除后恢复出厂）" : "删除模板",
              onClick: () => {
                C || fl(String(_.id));
              }
            }, "删除")
          ]),
          t.createElement("div", { className: "qm-set-itemdesc", key: "d" }, A)
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
          cl();
        }
      }, "＋ 新建模板")
    ])), S) {
      const _ = (q, C, I, z, A) => {
        var P, $;
        return t.createElement("div", { className: "qm-set-field", key: "f-" + C }, [
          t.createElement("div", { className: "qm-set-fieldlabel", key: "l" }, q),
          I ? t.createElement("textarea", {
            key: "c",
            className: "qm-set-textarea",
            rows: z,
            "data-qm-tpl-field": C,
            placeholder: A,
            value: String(((P = c.tplEdit) == null ? void 0 : P[C]) || ""),
            onChange: (W) => Os(C, W && W.target ? W.target.value : "")
          }) : t.createElement("input", {
            key: "c",
            className: "qm-set-input",
            "data-qm-tpl-field": C,
            placeholder: A,
            value: String((($ = c.tplEdit) == null ? void 0 : $[C]) || ""),
            onChange: (W) => Os(C, W && W.target ? W.target.value : "")
          })
        ]);
      };
      a.push(t.createElement("div", {
        className: "qm-set-editor",
        key: "ed-" + (S.id || "new")
      }, [
        t.createElement(
          "div",
          { className: "qm-set-editortitle", key: "t" },
          S.id ? "编辑模板：" + (S.name || S.id) : "新建模板"
        ),
        _("模板名称", "name", !1, 0, "如：简短结论版"),
        _(
          "系统提示词",
          "system_prompt",
          !0,
          6,
          "必须包含 choice / reasoning / JSON 的返回契约（服务端会校验）"
        ),
        _(
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
              ul();
            }
          }, c.tplBusy ? "保存中…" : "保存"),
          t.createElement("button", {
            type: "button",
            className: "qm-set-btn",
            key: "cancel",
            "data-qm-tpl-cancel": "1",
            onClick: () => {
              pl();
            }
          }, "取消")
        ])
      ]));
    }
  } else if (e === "stale") {
    const x = c.stale, S = x && x.rows || [], _ = x && x.exceeded || [], q = x && x.within || [], C = x ? x.threshold : null, I = xr(C), z = C !== null && C <= 0, A = !!(x && (x.busy || x.thrBusy)) || _.length === 0 || z;
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
          t.createElement("span", { key: "t" }, "挂起超时自动释放"),
          t.createElement(
            "span",
            { className: "qm-set-rownote", key: "n" },
            z ? "当前已关闭：挂起的问卷不会被自动释放" : `静默超过 ${I} 仍无进展时，由后台自动释放`
          )
        ]),
        t.createElement(
          "div",
          { className: "qm-set-rowctl", key: "c" },
          t.createElement("select", {
            "data-qm-stale-threshold": "1",
            className: "qm-set-input",
            disabled: !!(x && x.thrBusy),
            value: C === null ? "" : String(C),
            onChange: (P) => {
              const $ = Number(P.target.value);
              c.draft.release_after_sec = $, c.stale.threshold = $, c.stale.msgKind = "", c.stale.msg = "已选择「" + xr($) + "」，点下方「保存」后生效", N();
            }
          }, [
            // 未取到时不渲染任何具体档位，避免默认高亮误导
            C === null ? t.createElement("option", { key: "na", value: "" }, "加载中…") : null,
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
      z ? t.createElement("div", {
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
            xi();
          }
        }, x && x.busy ? "扫描中…" : "扫描"),
        t.createElement("button", {
          type: "button",
          className: "qm-set-btn qm-set-btnprimary",
          key: "all",
          "data-qm-stale-release-all": "1",
          // ★ 只作用于「已超阈值」组：观察期内的问卷很可能正被另一个
          //   标签页作答，批量释放等于替用户交卷（boss 裁定 D10）。
          disabled: A,
          title: z ? "自动释放已关闭，请逐条释放" : _.length ? `释放全部 ${_.length} 条已超阈值的问卷（观察期内 ${q.length} 条不参与）` : "当前没有已超阈值的问卷",
          onClick: () => {
            ki();
          }
        }, _.length ? `全部释放（仅已超阈值 ${_.length} 条）` : "全部释放")
      ])
    ])), x && x.msg && a.push(t.createElement("div", {
      className: "qm-set-stalemsg",
      key: "sm",
      "data-qm-stale-msg": x.msgKind || "info"
    }, x.msg)), x && x.scanned && S.length === 0 && a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "se",
      "data-qm-stale-empty": "1"
    }, "没有挂起的问卷。")), (!x || !x.scanned) && (x && x.msg || a.push(t.createElement("div", {
      className: "qm-set-staleempty",
      key: "sn",
      "data-qm-stale-idle": "1"
    }, "点「扫描」列出挂起的问卷。"))), S.length) {
      const $ = Math.max(1, Math.ceil(S.length / 5)), W = Math.min(
        Math.max(0, Number(x && x.page) || 0),
        $ - 1
      ), fe = S.slice(
        W * 5,
        W * 5 + 5
      ), ve = {};
      _.forEach((R) => {
        ve[R.tool_call_id] = !0;
      });
      const H = t.createElement("div", {
        className: "qm-set-stalerow qm-set-staleheader",
        key: "rh"
      }, [
        t.createElement("span", { className: "qm-set-stalec1", key: "c1" }, "问卷"),
        t.createElement("span", { className: "qm-set-stalec2", key: "c2" }, "归属"),
        t.createElement("span", { className: "qm-set-stalec3", key: "c3" }, "挂起"),
        t.createElement("span", { className: "qm-set-stalec4", key: "c4" }, "操作")
      ]), J = fe.map((R) => {
        const Me = !!R.terminable, B = !!ve[R.tool_call_id], de = () => {
          if (typeof window > "u" || typeof window.confirm != "function") return;
          const me = R.has_live_subscriber ? "，且**正在被其他页面作答**" : "";
          window.confirm(
            `该问卷仍在观察期内（已挂起 ${R.idle_text}，阈值 ${I}）${me}。

强制释放等于替用户交卷，其正在填写的内容将丢失。确定继续？`
          ) && qs([R.tool_call_id]);
        };
        return t.createElement("div", {
          className: "qm-set-stalerow",
          key: R.tool_call_id,
          "data-qm-stale-row": R.tool_call_id,
          "data-qm-stale-group": B ? "exceeded" : "within"
        }, [
          t.createElement("span", { className: "qm-set-stalec1", key: "c1" }, [
            t.createElement(
              "span",
              { className: "qm-set-staletitle", key: "t" },
              R.title || "(无标题)"
            ),
            // 把「为什么它没被自动释放」直接写在行上，省得再去翻日志。
            t.createElement(
              "span",
              { className: "qm-set-staletag", key: "g" },
              R.reason_code === "orphan-no-pending" ? "孤儿·无待答记录" : R.reason_code === "orphan-future-dead" ? "孤儿·唤醒已失效" : R.reason_code === "no-future" ? "无唤醒句柄" : R.reason_code === "future-done" ? "已结束未收尾" : B ? "已超阈值" : "观察期内"
            ),
            // 正在被作答 —— 这是"不能批量释放"的直接依据，必须可见。
            R.has_live_subscriber ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "sub",
              "data-qm-stale-live": "1",
              style: { marginLeft: "6px", color: "#e67e22" }
            }, "正在作答") : null,
            R.in_flight ? t.createElement("span", {
              className: "qm-set-staletag",
              key: "fl",
              style: { marginLeft: "6px" }
            }, "模型分析中") : null
          ]),
          t.createElement(
            "span",
            { className: "qm-set-stalec2", key: "c2" },
            (R.agent_id || "-") + (R.session_id ? " · " + R.session_id : "")
          ),
          t.createElement(
            "span",
            { className: "qm-set-stalec3", key: "c3" },
            R.idle_text
          ),
          t.createElement("span", { className: "qm-set-stalec4", key: "c4" }, [
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "rel",
              "data-qm-stale-release": R.tool_call_id,
              disabled: !!(x && x.busy),
              title: B ? "释放该问卷" : "仍在观察期内，点击需二次确认",
              onClick: () => {
                B ? qs([R.tool_call_id]) : de();
              }
            }, B ? "释放" : "强制释放"),
            t.createElement("button", {
              type: "button",
              className: "qm-set-mini",
              key: "term",
              "data-qm-stale-terminate": R.tool_call_id,
              // 置灰而不是隐藏：让用户知道这个动作存在、以及为什么此刻不能用。
              disabled: !!(x && x.busy) || !Me,
              title: Me ? "终止该会话并取消其前台工具调用" : "该问卷已无活跃等待，对应会话通常也已不存在，无需终止",
              onClick: () => {
                wi([R.tool_call_id]);
              }
            }, "终止会话")
          ])
        ]);
      });
      if (a.push(t.createElement("div", {
        className: "qm-set-staletable",
        key: "tbl",
        "data-qm-stale-table": "1"
      }, [H].concat(J))), $ > 1) {
        const R = (B) => {
          c.stale.page = B, N();
        }, Me = (B, de, me, Xe) => t.createElement("button", {
          type: "button",
          className: "qm-set-mini",
          key: Xe,
          "data-qm-stale-page": String(de),
          disabled: me,
          onClick: () => {
            R(de);
          }
        }, B);
        a.push(t.createElement("div", {
          className: "qm-set-stalepager",
          key: "pg",
          "data-qm-stale-pager": "1"
        }, [
          Me("上一页", W - 1, W <= 0, "prev"),
          t.createElement("span", {
            className: "qm-set-stalepageinfo",
            key: "info",
            "data-qm-stale-pageinfo": String(W + 1)
          }, `第 ${W + 1} / ${$} 页（共 ${S.length} 条，每页 5 条）`),
          Me("下一页", W + 1, W >= $ - 1, "next")
        ]));
      }
    }
  }
  return t.createElement("div", { className: "qm-set-tabbody", key: "tb" }, a);
}
function vl(t) {
  const { R: e, open: n, onClose: r } = t;
  if (!n) return null;
  const s = $e(), a = s && s.Modal, o = !t.tab, d = t.tab || "", i = ha(d) ? "session" : "global", y = e.createElement(
    "div",
    { className: "qm-set-tabs", key: "tabs" },
    hr.map((J) => e.createElement("button", {
      key: J.key,
      type: "button",
      className: "qm-set-tab" + (!o && J.key === d ? " qm-set-tabon" : ""),
      onClick: () => {
        try {
          t.onTabChange && t.onTabChange(J.key);
        } catch {
        }
      }
    }, J.label))
  ), h = hr.filter((J) => J.key === d)[0] || hr[0], k = !!(t.cfg && t.cfg.has_session), f = k ? "session" : "default", w = k ? "会话模式" : "默认模式", m = e.createElement("div", {
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
    }, w)
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
  }, "✕"), x = e.createElement("div", { className: "qm-set-head", key: "h" }, [
    e.createElement("div", { className: "qm-set-title", key: "t" }, "问卷设置"),
    // ── 右侧组（boss 2026-11-15 二轮裁定）────────────────────────
    // 模式胶囊与关闭按钮「左右排列、中间不留间隔」：包进同一个无 gap 的
    // right 组，整组靠右与标题形成两端布局。
    e.createElement("div", { className: "qm-set-right", key: "rgt" }, [
      m,
      b
    ])
  ]), S = h.hint ? e.createElement("div", { className: "qm-set-subhint", key: "sh" }, h.hint) : null, _ = null, q = o ? e.createElement("div", {
    className: "qm-set-skeleton",
    "data-qm-skeleton": "1",
    key: "skel",
    style: { padding: "8px 24px 20px" }
  }, [0, 1, 2].map((J) => e.createElement("div", {
    key: "sk" + J,
    style: {
      height: 44,
      marginBottom: 10,
      borderRadius: 8,
      background: "var(--app-fill-subtle, rgba(127,127,127,0.10))",
      animation: "qm-set-pulse 1.2s ease-in-out infinite",
      animationDelay: J * 0.15 + "s"
    }
  }))) : null, C = o ? q : wl(e, d, i, t.sessData, {
    modelOptions: t.modelOptions,
    templateOptions: t.templateOptions,
    providerGroups: t.providerGroups
  }), I = t.dirtyCount || 0, z = String(t.tab || ""), A = z === "session" || z === "default";
  let P;
  A ? P = i === "session" ? "保存到本会话（只覆盖你改过的项，不改全局）" : "保存为全局默认（对未设会话的会话生效）" : P = z === "prompt" ? "保存提示词模板（对所有模式生效，不改运行模式）" : "保存全局配置（对所有模式生效，不改运行模式）";
  const $ = e.createElement("div", { className: "qm-set-foot", key: "foot" }, [
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
        disabled: !!t.saving,
        title: "放弃未保存的修改，恢复到上一次保存的参数",
        onClick: () => {
          ua(), N();
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
          ll();
        }
      }, t.saving ? "保存中…" : "保存")
    ])
  ]), W = t.saveMsg ? e.createElement("div", { className: "qm-set-saveMsg", key: "sm" }, t.saveMsg) : null, fe = t.conflictNote ? e.createElement("div", {
    className: "qm-set-conflict",
    key: "cf",
    "data-qm-conflict": "1"
  }, t.conflictNote) : null, ve = e.createElement("div", { className: "qm-set-scroll", key: "scroll" }, [
    _,
    S,
    C,
    W,
    fe
  ]), H = e.createElement("div", { className: "qm-set-wrap" }, [
    x,
    y,
    ve,
    $
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
  }, H) : e.createElement("div", {
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
    H
  ]);
}
function _l(t) {
  try {
    const e = t && t.sender, n = we().React;
    if (!n) return;
    if (!e || typeof e.addPrefix != "function") {
      console.log("[question-modal] chat.sender.addPrefix unavailable — settings entry skipped");
      return;
    }
    const r = n.createElement(bl, {
      R: n,
      onOpen: () => {
        ml();
      }
    });
    e.addPrefix(Zs, r, {
      id: "question-modal.settings-btn",
      order: Ns
    }), console.log("[question-modal] settings entry registered (order " + Ns + ")");
  } catch (e) {
    console.error("[question-modal] settings entry failed:", e);
  }
}
function ql() {
  const t = Xo();
  if (!t || typeof t.toolRender != "function") return !1;
  try {
    return ei(), t.toolRender(Zs, xs, al), console.log("[question-modal] registered via chat.toolRender for", xs), _l(t), !0;
  } catch (e) {
    return console.error("[question-modal] toolRender failed:", e), !1;
  }
}
(function t(e) {
  if (!ql()) {
    if (e > 40) {
      console.warn("[question-modal] chat.toolRender never available");
      return;
    }
    setTimeout(() => t(e + 1), 500);
  }
})(0);
console.log("[question-modal] frontend loaded (v1.3.4 — answered-card release escape + no false success)");
