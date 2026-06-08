import { Fragment, type ReactNode } from "react";
import { CodeBlock, AssetBox } from "./chat-content";
import styles from "./chat-content.module.css";

type Block =
  | { kind: "asset"; title: string; body: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" };

function parseAssetOpen(line: string): { title: string } | null {
  const m = line.match(/^:::asset(?:\s+title="([^"]*)")?\s*$/);
  if (!m) return null;
  return { title: m[1] || "" };
}

function parseCodeOpen(line: string): { language: string } | null {
  const m = line.match(/^```([a-zA-Z0-9_+\-#]*)\s*$/);
  if (!m) return null;
  return { language: m[1] || "" };
}

function parseHeading(line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null {
  const m = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
  if (!m) return null;
  return { level: m[1].length as 1 | 2 | 3 | 4 | 5 | 6, text: m[2] };
}

function parseListItem(line: string): { type: "ul" | "ol"; text: string } | null {
  const ul = line.match(/^\s*[-*+]\s+(.+)$/);
  if (ul) return { type: "ul", text: ul[1] };
  const ol = line.match(/^\s*(\d+)\.\s+(.+)$/);
  if (ol) return { type: "ol", text: ol[2] };
  return null;
}

function parseBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, "");

    if (line.trim() === "") { i++; continue; }

    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    const assetOpen = parseAssetOpen(line.trim());
    if (assetOpen) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: "asset", title: assetOpen.title, body: buf.join("\n").trim() });
      continue;
    }

    const codeOpen = parseCodeOpen(line.trim());
    if (codeOpen) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !parseCodeOpen(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ kind: "code", language: codeOpen.language, code: buf.join("\n") });
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading.level, text: heading.text });
      i++;
      continue;
    }

    const li = parseListItem(line);
    if (li) {
      const items: string[] = [li.text];
      i++;
      while (i < lines.length) {
        const nxt = parseListItem(lines[i]);
        if (nxt && nxt.type === li.type) {
          items.push(nxt.text);
          i++;
        } else if (lines[i].trim() === "") {
          break;
        } else {
          break;
        }
      }
      blocks.push({ kind: li.type, items });
      continue;
    }

    const paraBuf: string[] = [line];
    i++;
    while (i < lines.length) {
      const peek = lines[i];
      if (peek.trim() === "") break;
      if (parseHeading(peek)) break;
      if (parseCodeOpen(peek.trim())) break;
      if (parseAssetOpen(peek.trim())) break;
      if (parseListItem(peek)) break;
      if (peek.trim() === "---" || peek.trim() === "***" || peek.trim() === "___") break;
      paraBuf.push(peek);
      i++;
    }
    blocks.push({ kind: "paragraph", text: paraBuf.join(" ") });
  }

  return blocks;
}

const INLINE_TOKEN = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(INLINE_TOKEN.source, "g");
  let idx = 0;
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) parts.push(<Fragment key={`${keyPrefix}-t-${idx++}`}>{text.slice(lastIndex, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("***") && tok.endsWith("***") && tok.length > 6) {
      parts.push(<strong key={`${keyPrefix}-b-${idx++}`}><em>{tok.slice(3, -3)}</em></strong>);
    } else if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      parts.push(<strong key={`${keyPrefix}-b-${idx++}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      parts.push(<em key={`${keyPrefix}-i-${idx++}`}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      parts.push(<code key={`${keyPrefix}-c-${idx++}`} className={styles.inlineCode}>{tok.slice(1, -1)}</code>);
    }
    lastIndex = m.index + tok.length;
  }
  if (lastIndex < text.length) parts.push(<Fragment key={`${keyPrefix}-t-${idx++}`}>{text.slice(lastIndex)}</Fragment>);
  return <>{parts}</>;
}

function renderBlock(b: Block, idx: number): ReactNode {
  switch (b.kind) {
    case "asset":
      return <AssetBox key={idx} title={b.title} body={b.body} />;
    case "code":
      return <CodeBlock key={idx} language={b.language} code={b.code} />;
    case "heading": {
      const cls =
        b.level === 1 ? styles.h1 :
        b.level === 2 ? styles.h2 :
        b.level === 3 ? styles.h3 :
        b.level === 4 ? styles.h4 : styles.h5;
      const inner = renderInline(b.text, `h${idx}`);
      if (b.level === 1) return <h1 key={idx} className={cls}>{inner}</h1>;
      if (b.level === 2) return <h2 key={idx} className={cls}>{inner}</h2>;
      if (b.level === 3) return <h3 key={idx} className={cls}>{inner}</h3>;
      if (b.level === 4) return <h4 key={idx} className={cls}>{inner}</h4>;
      return <h5 key={idx} className={cls}>{inner}</h5>;
    }
    case "ul":
      return (
        <ul key={idx} className={styles.ul}>
          {b.items.map((it, j) => <li key={j}>{renderInline(it, `ul${idx}-${j}`)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol key={idx} className={styles.ol}>
          {b.items.map((it, j) => <li key={j}>{renderInline(it, `ol${idx}-${j}`)}</li>)}
        </ol>
      );
    case "hr":
      return <hr key={idx} className={styles.hr} />;
    case "paragraph":
      return <p key={idx} className={styles.paragraph}>{renderInline(b.text, `p${idx}`)}</p>;
  }
}

export function MarkdownContent({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return <div className={styles.markdown}>{blocks.map(renderBlock)}</div>;
}
