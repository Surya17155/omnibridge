import { IconFilter } from "@tabler/icons-react";
import { PROVIDERS } from "~/data/mock-data";
import styles from "./logs-filter.module.css";

interface LogsFilterProps {
  provider: string;
  status: string;
  search: string;
  onProviderChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onReset: () => void;
}

export function LogsFilter({ provider, status, search, onProviderChange, onStatusChange, onSearchChange, onReset }: LogsFilterProps) {
  return (
    <div className={styles.section}>
      <div className={styles.filterRow}>
        <div className={styles.group}>
          <label className={styles.label}>Provider</label>
          <select className={styles.select} value={provider} onChange={(e) => onProviderChange(e.target.value)}>
            <option value="">All Providers</option>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Status</label>
          <select className={styles.select} value={status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
            <option value="rate-limited">Rate Limited</option>
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Search</label>
          <input
            className={styles.input}
            type="text"
            placeholder="Model, key label..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Date Range</label>
          <input className={styles.input} type="date" defaultValue="2025-01-15" />
        </div>

        <button className={styles.resetBtn} onClick={onReset}>
          <IconFilter size={15} />
          Reset
        </button>
      </div>
    </div>
  );
}
