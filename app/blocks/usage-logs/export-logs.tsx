import { IconDownload, IconFileText } from "@tabler/icons-react";
import { MOCK_LOGS, type LogEntry } from "~/data/mock-data";
import styles from "./export-logs.module.css";

interface ExportLogsProps {
  logs: LogEntry[];
}

export function ExportLogs({ logs }: ExportLogsProps) {
  const handleExportCSV = () => {
    const headers = ["timestamp", "provider", "key", "model", "status", "responseTime", "tokens"];
    const rows = logs.map((l) => [l.timestamp, l.provider, l.keyLabel, l.model, l.status, l.responseTime, l.tokens]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omnibridge-logs.csv";
    a.click();
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "omnibridge-logs.json";
    a.click();
  };

  return (
    <div className={styles.section}>
      <div className={styles.info}>
        <div className={styles.title}>Export Logs</div>
        <div className={styles.subtitle}>{logs.length} entries ready for export</div>
      </div>
      <div className={styles.actions}>
        <button className={styles.csvBtn} onClick={handleExportCSV}>
          <IconFileText size={15} />
          Export CSV
        </button>
        <button className={styles.jsonBtn} onClick={handleExportJSON}>
          <IconDownload size={15} />
          Export JSON
        </button>
      </div>
    </div>
  );
}
