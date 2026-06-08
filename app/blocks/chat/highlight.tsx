import { Fragment, type ReactNode } from "react";

type Token = { type: string; value: string };

const LANG_KEYWORDS: Record<string, RegExp> = {
  typescript: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|never|any|unknown|string|number|boolean|object|symbol|typeof|instanceof|do|yield|delete|with)\b/g,
  javascript: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|typeof|instanceof|do|yield|delete|with)\b/g,
  ts: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|never|any|unknown|string|number|boolean|object|symbol|typeof|instanceof|do|yield|delete|with)\b/g,
  js: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|typeof|instanceof|do|yield|delete|with)\b/g,
  tsx: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|readonly|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|never|any|unknown|string|number|boolean|object|symbol|typeof|instanceof|do|yield|delete|with)\b/g,
  jsx: /\b(import|export|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|enum|public|private|protected|static|async|await|try|catch|finally|throw|of|in|as|null|undefined|true|false|this|super|void|typeof|instanceof|do|yield|delete|with)\b/g,
  python: /\b(def|class|import|from|as|return|if|elif|else|for|while|break|continue|pass|try|except|finally|raise|with|yield|lambda|global|nonlocal|assert|del|in|is|not|and|or|None|True|False|self|async|await|finally)\b/g,
  py: /\b(def|class|import|from|as|return|if|elif|else|for|while|break|continue|pass|try|except|finally|raise|with|yield|lambda|global|nonlocal|assert|del|in|is|not|and|or|None|True|False|self|async|await)\b/g,
  json: /\b(true|false|null)\b/g,
  css: /\b(import|media|keyframes|important|px|em|rem|vh|vw|%|from|to|in)\b/g,
  html: /\b(html|head|body|div|span|script|style|link|meta|class|id|src|href|type|rel|charset)\b/g,
  bash: /\b(if|then|fi|else|elif|for|in|do|done|while|case|esac|function|return|export|local|echo|cd|ls|cat|grep|sed|awk|cp|mv|rm|chmod|sudo|apt|yum|brew|npm|npx|node|python|pip|git|curl|wget|true|false)\b/g,
  sh: /\b(if|then|fi|else|elif|for|in|do|done|while|case|esac|function|return|export|local|echo|cd|ls|cat|grep|sed|awk|cp|mv|rm|chmod|sudo|apt|yum|brew|npm|npx|node|python|pip|git|curl|wget|true|false)\b/g,
  sql: /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|AND|OR|NOT|NULL|IS|IN|EXISTS|BETWEEN|LIKE|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|DISTINCT|COUNT|SUM|AVG|MAX|MIN|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|TRANSACTION)\b/gi,
  go: /\b(package|import|func|var|const|type|struct|interface|map|chan|return|if|else|for|range|switch|case|default|break|continue|go|defer|select|fallthrough|nil|true|false)\b/g,
  rust: /\b(fn|let|mut|const|static|pub|use|mod|crate|self|super|impl|trait|struct|enum|match|if|else|for|while|loop|return|break|continue|as|in|where|async|await|move|ref|true|false|None|Some|Ok|Err|String|Vec|Box)\b/g,
  rs: /\b(fn|let|mut|const|static|pub|use|mod|crate|self|super|impl|trait|struct|enum|match|if|else|for|while|loop|return|break|continue|as|in|where|async|await|move|ref|true|false|None|Some|Ok|Err|String|Vec|Box)\b/g,
  java: /\b(public|private|protected|static|final|abstract|class|interface|extends|implements|import|package|return|if|else|for|while|do|switch|case|break|continue|new|this|super|null|true|false|void|int|double|float|boolean|long|short|byte|char|String|throw|throws|try|catch|finally)\b/g,
  cpp: /\b(include|define|ifdef|ifndef|endif|class|struct|public|private|protected|static|const|virtual|void|int|float|double|char|bool|long|short|unsigned|signed|return|if|else|for|while|do|switch|case|break|continue|new|delete|this|null|true|false|namespace|using|template|typename|sizeof|typedef|enum|union|operator)\b/g,
  c: /\b(include|define|ifdef|ifndef|endif|struct|union|enum|typedef|static|const|extern|return|if|else|for|while|do|switch|case|break|continue|sizeof|void|int|float|double|char|short|long|unsigned|signed|null)\b/g,
  cs: /\b(using|namespace|class|interface|struct|enum|public|private|protected|internal|static|const|readonly|sealed|abstract|virtual|override|new|return|if|else|for|while|do|foreach|in|switch|case|break|continue|try|catch|finally|throw|async|await|void|int|long|float|double|bool|string|char|object|var|null|true|false|this|base|namespace|using)\b/g,
  php: /\b(public|private|protected|static|var|let|const|function|return|if|else|elseif|for|foreach|while|do|switch|case|break|continue|new|class|interface|extends|implements|use|namespace|require|include|require_once|include_once|echo|print|true|false|null|this|self|parent)\b/g,
  ruby: /\b(def|class|module|end|if|elsif|else|unless|case|when|while|until|for|in|do|begin|rescue|ensure|raise|return|yield|break|next|require|include|extend|attr_accessor|attr_reader|attr_writer|true|false|nil|self)\b/g,
  rb: /\b(def|class|module|end|if|elsif|else|unless|case|when|while|until|for|in|do|begin|rescue|ensure|raise|return|yield|break|next|require|include|extend|attr_accessor|attr_reader|attr_writer|true|false|nil|self)\b/g,
  swift: /\b(func|var|let|class|struct|enum|protocol|extension|import|return|if|else|guard|for|while|repeat|switch|case|default|break|continue|fallthrough|return|throws|throw|do|catch|try|finally|defer|async|await|public|private|fileprivate|internal|open|static|final|mutating|nonmutating|weak|strong|unowned|self|Self|nil|true|false|inout|where|as|is|associativity|left|right|none|precedence|operator|infix|prefix|postfix)\b/g,
  kotlin: /\b(fun|val|var|class|object|interface|data|sealed|enum|companion|public|private|protected|internal|open|abstract|override|return|if|else|when|for|while|do|try|catch|finally|throw|throws|import|package|true|false|null|this|super|is|as|in|out|by|where|companion|suspend|lateinit|init|constructor|get|set|field)\b/g,
  yaml: /\b(true|false|null|yes|no|on|off)\b/g,
  yml: /\b(true|false|null|yes|no|on|off)\b/g,
  md: /\b(true|false|null)\b/g,
};

const LANG_LABELS: Record<string, string> = {
  typescript: "TypeScript", ts: "TypeScript", tsx: "TSX",
  javascript: "JavaScript", js: "JavaScript", jsx: "JSX",
  python: "Python", py: "Python",
  json: "JSON", css: "CSS", html: "HTML", xml: "XML",
  bash: "Bash", sh: "Shell", shell: "Shell", zsh: "Zsh",
  sql: "SQL",
  go: "Go", rust: "Rust", rs: "Rust",
  java: "Java", cpp: "C++", c: "C", cs: "C#",
  php: "PHP", ruby: "Ruby", rb: "Ruby",
  swift: "Swift", kotlin: "Kotlin",
  yaml: "YAML", yml: "YAML",
  md: "Markdown", markdown: "Markdown",
  plaintext: "Text", text: "Text", txt: "Text",
  "" : "Text",
};

export function languageLabel(lang: string): string {
  const key = lang.toLowerCase();
  return LANG_LABELS[key] || lang.toUpperCase();
}

const STRING_RE = /(["'`])(?:\\.|(?!\1).)*\1/g;
const NUMBER_RE = /\b\d+(?:\.\d+)?\b/g;
const COMMENT_RE = /(\/\/[^\n]*|#[^\n]*|\{\*[\s\S]*?\*\}|\<!--[\s\S]*?-->)/g;
const TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const CSS_PROP_RE = /([a-z-]+)(?=\s*:)/g;
const KEY_VAL_RE = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*(?==)/g;

function tokenize(code: string, lang: string): Token[] {
  const tokens: { start: number; end: number; type: string; value: string }[] = [];
  const place = (start: number, end: number, type: string, value: string) => {
    if (end <= start) return;
    tokens.push({ start, end, type, value });
  };

  const isCommentLang = /^(py|rb|ruby|sh|bash|shell|zsh|yaml|yml|sql|css)$/i.test(lang);

  COMMENT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COMMENT_RE.exec(code))) {
    place(m.index, m.index + m[0].length, "comment", m[0]);
  }

  STRING_RE.lastIndex = 0;
  while ((m = STRING_RE.exec(code))) {
    let overlap = false;
    for (const t of tokens) {
      if (m.index < t.end && m.index + m[0].length > t.start) { overlap = true; break; }
    }
    if (!overlap) place(m.index, m.index + m[0].length, "string", m[0]);
  }

  const kwRe = LANG_KEYWORDS[lang.toLowerCase()];
  if (kwRe) {
    kwRe.lastIndex = 0;
    while ((m = kwRe.exec(code))) {
      const start = m.index;
      const end = start + m[0].length;
      let overlap = false;
      for (const t of tokens) {
        if (start < t.end && end > t.start) { overlap = true; break; }
      }
      if (!overlap) {
        let isPropOrAttr = false;
        if (lang.toLowerCase() === "html") {
          const before = code.slice(Math.max(0, start - 1), start);
          if (/\s/.test(before) || before === "") isPropOrAttr = true;
        }
        place(start, end, isPropOrAttr ? "attr" : "keyword", m[0]);
      }
    }
  }

  if (lang.toLowerCase() === "html") {
    TAG_RE.lastIndex = 0;
    while ((m = TAG_RE.exec(code))) {
      place(m.index, m.index + m[0].length, "tag", m[0]);
    }
    KEY_VAL_RE.lastIndex = 0;
    while ((m = KEY_VAL_RE.exec(code))) {
      place(m.index, m.index + m[0].length, "attr", m[0]);
    }
  }

  if (lang.toLowerCase() === "css") {
    CSS_PROP_RE.lastIndex = 0;
    while ((m = CSS_PROP_RE.exec(code))) {
      place(m.index, m.index + m[0].length, "attr", m[0]);
    }
  }

  NUMBER_RE.lastIndex = 0;
  while ((m = NUMBER_RE.exec(code))) {
    const start = m.index;
    const end = start + m[0].length;
    let overlap = false;
    for (const t of tokens) {
      if (start < t.end && end > t.start) { overlap = true; break; }
    }
    if (!overlap) place(start, end, "number", m[0]);
  }

  tokens.sort((a, b) => a.start - b.start);

  const out: Token[] = [];
  let cursor = 0;
  for (const t of tokens) {
    if (t.start > cursor) out.push({ type: "text", value: code.slice(cursor, t.start) });
    out.push({ type: t.type, value: t.value });
    cursor = t.end;
  }
  if (cursor < code.length) out.push({ type: "text", value: code.slice(cursor) });

  return out;
}

export function highlightCode(code: string, lang: string): ReactNode[] {
  const tokens = tokenize(code, lang || "plaintext");
  return tokens.map((t, i) =>
    t.type === "text" ? (
      <Fragment key={i}>{t.value}</Fragment>
    ) : (
      <span key={i} className={`tk-${t.type}`}>{t.value}</span>
    )
  );
}
