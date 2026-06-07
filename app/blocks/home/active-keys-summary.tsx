import { Link } from "react-router";
import { PROVIDER_COLORS, type Provider } from "~/data/mock-data";
import styles from "./active-keys-summary.module.css";

export type ActiveKeyEntry = {
  id: string;
  provider: Provider;
  label: string;
  key: string;
  status: "active" | "inactive" | "quota-exceeded";
  quotaRemaining: number;
  quotaTotal: number;
  lastUsed: string | null;
  addedAt: string | null;
};

function getQuotaColor(pct: number): string {
  if (pct > 50) return "var(--color-success)";
  if (pct > 20) return "var(--color-warning)";
  return "var(--color-danger)";
}

function getStatusLabel(status: string) {
  if (status === "active") return { label: "Active", cls: styles.active };
  if (status === "quota-exceeded") return { label: "Quota Exceeded", cls: styles.quotaExceeded };
  return { label: "Inactive", cls: styles.inactive };
}

type Props = {
  keys: ActiveKeyEntry[];
};

export function ActiveKeysSummary({ keys }: Props) {
  const grouped = keys.reduce<Record<string, ActiveKeyEntry[]>>((acc, key) => {
    if (!acc[key.provider]) acc[key.provider] = [];
    acc[key.provider].push(key);
    return acc;
  }, {});

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Active Keys Summary</h2>
        <Link to="/dashboard/key-management" className={styles.viewAll}>View All</Link>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", padding: "var(--space-4) 0" }}>
          No provider keys yet. Add one in <Link to="/dashboard/key-management">Key Management</Link>.
        </p>
      ) : (
        Object.entries(grouped).map(([provider, list]) => (
          <div key={provider} className={styles.providerGroup}>
            <div className={styles.providerHeader}>
              <span
                className={styles.providerDot}
                style={{ background: PROVIDER_COLORS[provider as Provider] }}
              />
              <span className={styles.providerName}>{provider}</span>
              <span className={styles.providerCount}>{list.length} key{list.length !== 1 ? "s" : ""}</span>
            </div>
            {list.map((key) => {
              const pct = key.quotaTotal > 0 ? (key.quotaRemaining / key.quotaTotal) * 100 : 0;
              const { label, cls } = getStatusLabel(key.status);
              return (
                <div key={key.id} className={styles.keyItem}>
                  <span className={styles.keyLabel}>{key.label}</span>
                  <span className={styles.keyMask}>{key.key}</span>
                  <div className={styles.quotaBar}>
                    <div
                      className={styles.quotaFill}
                      style={{ width: `${pct}%`, background: getQuotaColor(pct) }}
                    />
                  </div>
                  <span className={`${styles.statusBadge} ${cls}`}>{label}</span>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
