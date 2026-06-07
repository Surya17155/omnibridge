import { useLoaderData } from "react-router";
import { Form } from "react-router";
import { IconEdit, IconTrash, IconFlask, IconCheck } from "@tabler/icons-react";
import { type Provider, type KeyStatus } from "~/data/mock-data";
import styles from "./keys-list.module.css";
import classnames from "classnames";

function getQuotaColor(pct: number): string {
  if (pct > 50) return "var(--color-success)";
  if (pct > 20) return "var(--color-warning)";
  return "var(--color-danger)";
}

function StatusBadge({ status }: { status: KeyStatus }) {
  const map: Record<KeyStatus, { label: string; cls: string }> = {
    active: { label: "Active", cls: "badge badge-success" },
    inactive: { label: "Inactive", cls: "badge badge-warning" },
    "quota-exceeded": { label: "Quota Exceeded", cls: "badge badge-danger" },
  };
  const { label, cls } = map[status];
  return <span className={cls}>{label}</span>;
}

interface ProviderKey {
  id: number;
  provider: string;
  label: string;
  key_value: string;
  status: KeyStatus;
  quota_remaining: number;
  quota_total: number;
  last_used: string | null;
  added_at: string | null;
  created_at: string;
}

interface KeysListProps {
  provider: Provider | "All";
}

export function KeysList({ provider }: KeysListProps) {
  const { keys } = useLoaderData<{ keys: ProviderKey[] }>();
  const filteredKeys = provider === "All" ? keys : keys.filter((k) => k.provider === provider);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>API Keys</h3>
        <span className={styles.count}>{filteredKeys.length} key{filteredKeys.length !== 1 ? "s" : ""}</span>
      </div>

      {filteredKeys.length === 0 ? (
        <div className={styles.empty}>No keys found for this provider.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Label</th>
              <th>Key</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Quota</th>
              <th>Last Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map((key) => {
              const pct = key.quota_total > 0 ? (key.quota_remaining / key.quota_total) * 100 : 0;
              const displayKey = key.key_value.length > 12 
                ? key.key_value.substring(0, 12) + "..." 
                : key.key_value;
              return (
                <tr key={key.id}>
                  <td><strong>{key.label}</strong></td>
                  <td className={styles.keyCell}>{displayKey}</td>
                  <td>{key.provider}</td>
                  <td><StatusBadge status={key.status} /></td>
                  <td>
                    <div className={styles.quotaWrap}>
                      <div className={styles.quotaBar}>
                        <div
                          className={styles.quotaFill}
                          style={{ width: `${pct}%`, background: getQuotaColor(pct) }}
                        />
                      </div>
                      <span className={styles.quotaText}>{key.quota_remaining}/{key.quota_total}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--color-text-muted)" }}>{key.last_used || "Never"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Test key">
                        <IconFlask size={15} />
                      </button>
                      <button className={styles.iconBtn} title="Edit label">
                        <IconEdit size={15} />
                      </button>
                      <Form method="post" onSubmit={(e) => { if (!confirm("Delete this key?")) e.preventDefault(); }}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="keyId" value={key.id} />
                        <button type="submit" className={classnames(styles.iconBtn, styles.danger)} title="Delete key">
                          <IconTrash size={15} />
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}