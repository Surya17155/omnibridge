import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { highlightCode, languageLabel } from "./highlight";
import styles from "./chat-content.module.css";

type CopyButtonProps = { value: string; className?: string };

export function CopyButton({ value, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={className || styles.copyBtn}
      onClick={onCopy}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

type CodeBlockProps = { language: string; code: string };

export function CodeBlock({ language, code }: CodeBlockProps) {
  const lang = (language || "").trim();
  const label = languageLabel(lang);
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{label}</span>
        <CopyButton value={code} className={styles.codeCopy} />
      </div>
      <pre className={styles.codePre}>
        <code className={styles.codeBody}>{highlightCode(code, lang)}</code>
      </pre>
    </div>
  );
}

type AssetBoxProps = { title: string; body: string };

export function AssetBox({ title, body }: AssetBoxProps) {
  return (
    <div className={styles.assetBox}>
      <div className={styles.assetHeader}>
        <span className={styles.assetLabel}>Generated asset</span>
        <CopyButton value={body} />
      </div>
      {title && <div className={styles.assetTitle}>{title}</div>}
      <div className={styles.assetBody}>{body}</div>
    </div>
  );
}
