import { MOCK_LOGS, type LogEntry } from "~/data/mock-data";
import styles from "./logs-table.module.css";

const STATUS_MAP = {
  success: { label: "Success", cls: "badge badge-success" },
  error: { label: "Error", cls: "badge badge-danger" },
  "rate-limited": { label: "Rate Limited", cls: "badge badge-warning" },
};

function latencyClass(ms: number) {
  if (ms === 0) return styles.slow;
  if (ms < 300) return styles.good;
  if (ms < 500) return styles.medium;
  return styles.slow;
}

interface LogsTableProps {
  logs: LogEntry[];
  onRowClick: (log: LogEntry) => void;
}

export function LogsTable({ logs, onRowClick }: LogsTableProps) {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Request Logs</h3>
        <span className={styles.count}>{logs.length} entries</span>
      </div>

      <div className={styles.tableWrap}>
        {logs.length === 0 ? (
          <div className={styles.empty}>No logs match your filters.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Provider</th>
                <th>Key</th>
                <th>Model</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const { label, cls } = STATUS_MAP[log.status];
                return (
                  <tr key={log.id} onClick={() => onRowClick(log)}>
                    <td className={styles.timestamp}>{log.timestamp}</td>
                    <td>{log.provider}</td>
                    <td>{log.keyLabel}</td>
                    <td className={styles.modelCell}>{log.model}</td>
                    <td><span className={cls}>{label}</span></td>
                    <td className={`${styles.latency} ${latencyClass(log.responseTime)}`}>
                      {log.responseTime > 0 ? `${log.responseTime}ms` : "—"}
                    </td>
                    <td>{log.tokens > 0 ? log.tokens.toLocaleString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
