import { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import styles from "./endpoint-configuration.module.css";

const DEFAULT_BASE_URL = "https://omnibridge-dev.vercel.app/api/v1";
const BASE_URL =
  (typeof window !== "undefined" && (window as any).__OMNIBRIDGE_BASE_URL__) || DEFAULT_BASE_URL;

const ENDPOINTS = [
  { method: "POST", path: "/chat/completions" },
  { method: "GET", path: "/models" },
];

export function EndpointConfiguration() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (url: string, idx: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Endpoint Configuration</h3>
      <p className={styles.subtitle}>Use these endpoints in your AI applications and frameworks</p>

      {ENDPOINTS.map((ep, idx) => (
        <div key={ep.path} className={styles.endpointRow}>
          <span className={styles.methodTag}>{ep.method}</span>
          <span className={styles.url}>{BASE_URL}{ep.path}</span>
          <button className={styles.copyBtn} onClick={() => handleCopy(BASE_URL + ep.path, idx)}>
            {copiedIdx === idx ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copiedIdx === idx ? "Copied" : "Copy"}
          </button>
        </div>
      ))}

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Base URL</div>
          <div className={styles.infoValue}>{BASE_URL}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Protocol</div>
          <div className={styles.infoValue}>OpenAI Compatible</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Auth Header</div>
          <div className={styles.infoValue}>Authorization: Bearer &lt;key&gt;</div>
        </div>
      </div>
    </div>
  );
}
