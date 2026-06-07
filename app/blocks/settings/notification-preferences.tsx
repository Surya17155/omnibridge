import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import classnames from "classnames";
import styles from "./notification-preferences.module.css";

const NOTIFICATIONS = [
  { id: "quota-low", name: "Quota Low Warning", desc: "When any key falls below the threshold quota" },
  { id: "quota-empty", name: "Quota Exhausted", desc: "When a key's quota is fully depleted" },
  { id: "system-error", name: "System Errors", desc: "When the proxy encounters critical errors" },
  { id: "maintenance", name: "Maintenance Alerts", desc: "Scheduled downtime and maintenance windows" },
  { id: "key-added", name: "Key Added/Removed", desc: "When API keys are added or deleted" },
] as const;

const CHANNELS = ["Email", "In-App"] as const;
type NotifKey = (typeof NOTIFICATIONS)[number]["id"];

type Props = {
  notifications: Record<NotifKey, string[]>;
};

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function NotifRow({
  name,
  desc,
  current,
  initial,
  onChange,
  onSave,
  status,
  saving,
}: {
  id: NotifKey;
  name: string;
  desc: string;
  current: string[];
  initial: string[];
  onChange: (next: string[]) => void;
  onSave: () => void;
  status?: { ok: boolean; message?: string; error?: string };
  saving: boolean;
}) {
  const dirty = !arraysEqual(current, initial);
  return (
    <div className={styles.notifItem}>
      <div className={styles.notifInfo}>
        <div className={styles.notifName}>{name}</div>
        <div className={styles.notifDesc}>{desc}</div>
      </div>
      <div className={styles.channels}>
        {CHANNELS.map((channel) => (
          <button
            type="button"
            key={channel}
            className={classnames(styles.channelBtn, { [styles.active]: current.includes(channel) })}
            onClick={() => {
              const next = current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel];
              onChange(next);
            }}
          >
            {channel}
          </button>
        ))}
        <button
          type="button"
          className={styles.saveRowBtn}
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
      {status && (
        <p className={styles.rowStatus + " " + (status.ok ? styles.success : styles.error)}>
          {status.ok ? status.message : status.error}
        </p>
      )}
    </div>
  );
}

export function NotificationPreferences({ notifications }: Props) {
  const fetcher = useFetcher<{ ok: boolean; intent?: string; error?: string; message?: string }>();
  const [active, setActive] = useState<Record<string, string[]>>({ ...notifications });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setActive({ ...notifications });
  }, [notifications]);

  const status = fetcher.data?.intent === "update-notifications" ? fetcher.data : null;
  const lastSavedKey = (status as any)?.key as string | undefined;

  const saveOne = (key: NotifKey) => {
    setSavingKey(key);
    const fd = new FormData();
    fd.set("intent", "update-notifications");
    fd.set("key", key);
    active[key].forEach((c) => fd.append("channels", c));
    fetcher.submit(fd, { method: "post" });
    setTimeout(() => setSavingKey(null), 1000);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Notification Preferences</h3>
      <p className={styles.subtitle}>Choose how and when you receive alerts (click Save per row)</p>

      <div className={styles.notifList}>
        {NOTIFICATIONS.map(({ id, name, desc }) => (
          <NotifRow
            key={id}
            id={id}
            name={name}
            desc={desc}
            current={active[id] ?? []}
            initial={notifications[id] ?? []}
            onChange={(next) => setActive((prev) => ({ ...prev, [id]: next }))}
            onSave={() => saveOne(id)}
            saving={savingKey === id}
            status={lastSavedKey === id ? status : undefined}
          />
        ))}
      </div>
    </div>
  );
}
