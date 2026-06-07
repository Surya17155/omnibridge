import { db } from "~/db/database";

export type RotationStrategy = "round-robin" | "quota-based" | "performance" | "priority";

export type NotificationChannel = "Email" | "In-App";
export type NotificationKey =
  | "quota-low"
  | "quota-empty"
  | "system-error"
  | "maintenance"
  | "key-added";

export type UserSettings = {
  rotationStrategy: RotationStrategy;
  maxRetries: number;
  quotaThreshold: number;
  cooldownSeconds: number;
  maxLatencyMs: number;
  notifications: Record<NotificationKey, NotificationChannel[]>;
};

const DEFAULT_SETTINGS: UserSettings = {
  rotationStrategy: "round-robin",
  maxRetries: 3,
  quotaThreshold: 10,
  cooldownSeconds: 60,
  maxLatencyMs: 2000,
  notifications: {
    "quota-low": ["Email", "In-App"],
    "quota-empty": ["Email"],
    "system-error": ["Email", "In-App"],
    maintenance: ["Email"],
    "key-added": [],
  },
};

function safeParseArr(s: string): NotificationChannel[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => x === "Email" || x === "In-App") : [];
  } catch {
    return [];
  }
}

function rowToSettings(row: any): UserSettings {
  return {
    rotationStrategy: (row.rotation_strategy as RotationStrategy) ?? "round-robin",
    maxRetries: row.max_retries ?? 3,
    quotaThreshold: row.quota_threshold ?? 10,
    cooldownSeconds: row.cooldown_seconds ?? 60,
    maxLatencyMs: row.max_latency_ms ?? 2000,
    notifications: {
      "quota-low": safeParseArr(row.notif_quota_low),
      "quota-empty": safeParseArr(row.notif_quota_empty),
      "system-error": safeParseArr(row.notif_system_error),
      maintenance: safeParseArr(row.notif_maintenance),
      "key-added": safeParseArr(row.notif_key_added),
    },
  };
}

export async function getUserSettings(userId: number): Promise<UserSettings> {
  let row = await db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
  if (!row) {
    await db.prepare("INSERT INTO user_settings (user_id) VALUES (?)").run(userId);
    row = await db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
  }
  return rowToSettings(row ?? {});
}

export async function updateRotationStrategy(
  userId: number,
  strategy: RotationStrategy,
  extras: { maxRetries?: number; quotaThreshold?: number; cooldownSeconds?: number; maxLatencyMs?: number } = {}
): Promise<boolean> {
  const current = await getUserSettings(userId);
  const result = await db.prepare(
    `UPDATE user_settings
     SET rotation_strategy = ?, max_retries = ?, quota_threshold = ?, cooldown_seconds = ?, max_latency_ms = ?, updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    strategy,
    extras.maxRetries ?? current.maxRetries,
    extras.quotaThreshold ?? current.quotaThreshold,
    extras.cooldownSeconds ?? current.cooldownSeconds,
    extras.maxLatencyMs ?? current.maxLatencyMs,
    userId
  );
  return result.changes > 0;
}

const NOTIF_COL: Record<NotificationKey, string> = {
  "quota-low": "notif_quota_low",
  "quota-empty": "notif_quota_empty",
  "system-error": "notif_system_error",
  maintenance: "notif_maintenance",
  "key-added": "notif_key_added",
};

export async function updateNotification(
  userId: number,
  key: NotificationKey,
  channels: NotificationChannel[]
): Promise<boolean> {
  const col = NOTIF_COL[key];
  if (!col) return false;
  const sanitized = channels.filter((c) => c === "Email" || c === "In-App");
  const result = await db.prepare(`UPDATE user_settings SET ${col} = ?, updated_at = datetime('now') WHERE user_id = ?`).run(JSON.stringify(sanitized), userId);
  return result.changes > 0;
}

export { DEFAULT_SETTINGS };
