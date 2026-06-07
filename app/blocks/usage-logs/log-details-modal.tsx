import { IconX } from "@tabler/icons-react";
import { type LogEntry } from "~/data/mock-data";
import styles from "./log-details-modal.module.css";

const STATUS_MAP = {
  success: { label: "Success", cls: "badge badge-success" },
  error: { label: "Error", cls: "badge badge-danger" },
  "rate-limited": { label: "Rate Limited", cls: "badge badge-warning" },
};

interface LogDetailsModalProps {
  log: LogEntry | null;
  onClose: () => void;
}

export function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  if (!log) return null;

  const { label, cls } = STATUS_MAP[log.status];

  const requestPayload = JSON.stringify({
    model: log.model,
    messages: [{ role: "user", content: "[Request content]"}],
    stream: false,
  }, null, 2);

  const responsePayload = log.status === "success"
    ? JSON.stringify({
        id: `chatcmpl-${log.id}`,
        object: "chat.completion",
        model: log.model,
        choices: [{ message: { role: "assistant", content: "[Response content]" } }],
        usage: { prompt_tokens: Math.floor(log.tokens * 0.3), completion_tokens: Math.floor(log.tokens * 0.7), total_tokens: log.tokens },
      }, null, 2)
    : JSON.stringify({ error: { message: "Rate limit exceeded", type: "rate_limit_error" } }, null, 2);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Request Details</span>
          <button className={styles.closeBtn} onClick={onClose}><IconX size={18} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Timestamp</div>
              <div className={styles.detailValue}>{log.timestamp}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Status</div>
              <div><span className={cls}>{label}</span></div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Provider</div>
              <div className={styles.detailValue}>{log.provider}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Model</div>
              <div className={styles.detailValue}>{log.model}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Response Time</div>
              <div className={styles.detailValue}>{log.responseTime > 0 ? `${log.responseTime}ms` : "N/A"}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Tokens Used</div>
              <div className={styles.detailValue}>{log.tokens > 0 ? log.tokens.toLocaleString() : "0"}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Key Used</div>
              <div className={styles.detailValue}>{log.keyLabel}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Endpoint</div>
              <div className={styles.detailValue}>{log.endpoint}</div>
            </div>
          </div>

          <div>
            <div className={styles.sectionLabel}>Request Payload</div>
            <pre className={styles.codeBlock}>{requestPayload}</pre>
          </div>
          <div>
            <div className={styles.sectionLabel}>Response</div>
            <pre className={styles.codeBlock}>{responsePayload}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
