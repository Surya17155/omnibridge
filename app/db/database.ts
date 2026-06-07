import { createClient } from "@libsql/client";
import path from "path";

const TURSO_URL = process.env.TURSO_DB_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

const url = TURSO_URL ?? `file:${path.join(process.cwd(), "data", "omnibridge.db")}`;

export const client = createClient({ url, authToken: TURSO_TOKEN });

function wrap(sql: string) {
  return {
    async all(...args: any[]) {
      const r = await client.execute({ sql, args });
      return r.rows;
    },
    async get(...args: any[]) {
      const r = await client.execute({ sql, args });
      return r.rows[0] ?? undefined;
    },
    async run(...args: any[]) {
      const r = await client.execute({ sql, args });
      return {
        changes: r.rowsAffected,
        lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : 0,
      };
    },
  };
}

export const db = {
  prepare: wrap,
  async exec(sql: string) {
    const stmts = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    await client.batch(stmts);
  },
};

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS provider_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    label TEXT NOT NULL,
    key_value TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    quota_remaining INTEGER DEFAULT 0,
    quota_total INTEGER DEFAULT 0,
    last_used TEXT,
    added_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS omni_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    key_value TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    key_label TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL,
    response_time INTEGER,
    tokens INTEGER,
    endpoint TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    rotation_strategy TEXT NOT NULL DEFAULT 'round-robin',
    max_retries INTEGER NOT NULL DEFAULT 3,
    quota_threshold INTEGER NOT NULL DEFAULT 10,
    cooldown_seconds INTEGER NOT NULL DEFAULT 60,
    max_latency_ms INTEGER NOT NULL DEFAULT 2000,
    notif_quota_low TEXT NOT NULL DEFAULT '["Email","In-App"]',
    notif_quota_empty TEXT NOT NULL DEFAULT '["Email"]',
    notif_system_error TEXT NOT NULL DEFAULT '["Email","In-App"]',
    notif_maintenance TEXT NOT NULL DEFAULT '["Email"]',
    notif_key_added TEXT NOT NULL DEFAULT '[]',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  const row = await db.prepare("SELECT COUNT(*) as c FROM user_settings").get();
  const count = (row as any)?.c ?? 0;
  if (count === 0) {
    await db.prepare("INSERT INTO user_settings (user_id) SELECT id FROM users").run();
  }
} catch {
}
