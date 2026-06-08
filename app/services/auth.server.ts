import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "~/db/database";
import { encryptKey, decryptKey, isEncrypted, hashKey, timingSafeEqualHex } from "./encryption.server";

export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ProviderKey {
  id: number;
  user_id: number;
  provider: string;
  label: string;
  key_value: string;
  status: string;
  quota_remaining: number;
  quota_total: number;
  last_used: string | null;
  added_at: string | null;
  created_at: string;
}

export interface OmniKey {
  id: number;
  user_id: number;
  key_value: string;
  created_at: string;
}

export const SESSION_EXPIRY_DAYS = 365;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function createUser(email: string, password: string, firstName = "", lastName = ""): Promise<User | null> {
  try {
    const hash = hashPassword(password);
    const result = await db.prepare(
      "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)"
    ).run(email, hash, firstName || null, lastName || null);
    return {
      id: result.lastInsertRowid,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
    };
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<{ id: number; email: string; password_hash: string; first_name: string | null; last_name: string | null } | null> {
  const row = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  return (row as any) ?? null;
}

export async function createSession(userId: number): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  const sqliteDate = expiresAt.toISOString().slice(0, 19).replace("T", " ");
  await db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, sqliteDate);
  return id;
}

export async function getSession(sessionId: string): Promise<{ user_id: number; expires_at: string } | null> {
  const row = await db.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')").get(sessionId);
  return (row as any) ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export async function getUserById(id: number): Promise<User | null> {
  const row = await db.prepare("SELECT id, email, first_name, last_name FROM users WHERE id = ?").get(id);
  return (row as any) ?? null;
}

export async function updateUserProfile(
  userId: number,
  updates: { firstName?: string; lastName?: string; email?: string }
): Promise<boolean> {
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.firstName !== undefined) {
    fields.push("first_name = ?");
    values.push(updates.firstName || null);
  }
  if (updates.lastName !== undefined) {
    fields.push("last_name = ?");
    values.push(updates.lastName || null);
  }
  if (updates.email !== undefined) {
    fields.push("email = ?");
    values.push(updates.email);
  }
  if (!fields.length) return false;
  values.push(userId);
  const result = await db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const user = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as unknown as { password_hash: string } | undefined;
  if (!user) return { ok: false, error: "User not found" };
  if (!verifyPassword(currentPassword, user.password_hash)) {
    return { ok: false, error: "Current password is incorrect" };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters" };
  }
  const newHash = hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, userId);
  return { ok: true };
}

function decryptProviderKey(row: any): ProviderKey {
  return { ...row, key_value: isEncrypted(row.key_value) ? decryptKey(row.key_value) : row.key_value };
}

// Provider Keys
export const UNLIMITED_QUOTA = -1;

export async function addProviderKey(userId: number, provider: string, label: string, keyValue: string, quotaTotal: number | null = null): Promise<ProviderKey | null> {
  try {
    const addedAt = new Date().toISOString().split('T')[0];
    const stored = encryptKey(keyValue);
    const effective = quotaTotal !== null && quotaTotal > 0 ? quotaTotal : UNLIMITED_QUOTA;
    const result = await db.prepare(
      "INSERT INTO provider_keys (user_id, provider, label, key_value, status, quota_remaining, quota_total, added_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)"
    ).run(userId, provider, label, stored, effective, effective, addedAt);
    return {
      id: result.lastInsertRowid,
      user_id: userId,
      provider,
      label,
      key_value: keyValue,
      status: 'active',
      quota_remaining: effective,
      quota_total: effective,
      last_used: null,
      added_at: addedAt,
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getProviderKeys(userId: number): Promise<ProviderKey[]> {
  const rows = await db.prepare("SELECT * FROM provider_keys WHERE user_id = ? ORDER BY created_at DESC").all(userId) as any[];
  return rows.map(decryptProviderKey);
}

export async function getProviderKeysByProvider(userId: number, provider: string): Promise<ProviderKey[]> {
  const rows = await db.prepare("SELECT * FROM provider_keys WHERE user_id = ? AND provider = ? ORDER BY created_at DESC").all(userId, provider) as any[];
  return rows.map(decryptProviderKey);
}

export async function getProviderKeyById(userId: number, keyId: number): Promise<ProviderKey | null> {
  const row = await db.prepare("SELECT * FROM provider_keys WHERE id = ? AND user_id = ?").get(keyId, userId) as any;
  return row ? decryptProviderKey(row) : null;
}

export async function updateProviderKey(keyId: number, userId: number, updates: Partial<Pick<ProviderKey, 'label' | 'status' | 'quota_remaining' | 'quota_total'>>): Promise<boolean> {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  if (!fields) return false;
  const values = [...Object.values(updates), keyId, userId];
  const result = await db.prepare(`UPDATE provider_keys SET ${fields} WHERE id = ? AND user_id = ?`).run(...values);
  return result.changes > 0;
}

export async function deleteProviderKey(keyId: number, userId: number): Promise<boolean> {
  const result = await db.prepare("DELETE FROM provider_keys WHERE id = ? AND user_id = ?").run(keyId, userId);
  return result.changes > 0;
}

export async function updateProviderKeyUsage(keyId: number, userId: number, tokensUsed: number): Promise<boolean> {
  // Decrement quota for limited keys (skip unlimited). Floor at 0 so we don't go negative.
  const result = await db.prepare(
    "UPDATE provider_keys SET quota_remaining = MAX(quota_remaining - ?, 0), last_used = datetime('now') WHERE id = ? AND user_id = ? AND quota_remaining != -1"
  ).run(tokensUsed, keyId, userId);
  if (!result.changes) return false;
  // If the key just hit zero, flip status so the UI and pickers exclude it.
  const after = await db.prepare("SELECT quota_remaining FROM provider_keys WHERE id = ? AND user_id = ?").get(keyId, userId) as unknown as { quota_remaining: number } | undefined;
  if (after && after.quota_remaining === 0) {
    await db.prepare("UPDATE provider_keys SET status = 'quota-exceeded' WHERE id = ? AND user_id = ? AND status = 'active'").run(keyId, userId);
  }
  return true;
}

// Omni Keys
export async function createOmniKey(userId: number): Promise<OmniKey | null> {
  try {
    const plain = "obai_sk_live_" + crypto.randomBytes(24).toString('hex');
    const stored = encryptKey(plain);
    const hash = hashKey(plain);
    const result = await db.prepare("INSERT INTO omni_keys (user_id, key_value, key_hash) VALUES (?, ?, ?)").run(userId, stored, hash);
    return {
      id: result.lastInsertRowid,
      user_id: userId,
      key_value: plain,
      created_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getOmniKey(userId: number): Promise<OmniKey | null> {
  const row = await db.prepare("SELECT * FROM omni_keys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId) as any;
  if (!row) return null;
  return { ...row, key_value: isEncrypted(row.key_value) ? decryptKey(row.key_value) : row.key_value };
}

export async function getOmniKeyByValue(value: string): Promise<{ id: number; user_id: number; key_value: string; created_at: string } | null> {
  const hash = hashKey(value);
  const row = (await db.prepare("SELECT * FROM omni_keys WHERE key_hash = ? LIMIT 1").get(hash)) as any;
  if (row) {
    return { id: row.id, user_id: row.user_id, key_value: value, created_at: row.created_at };
  }
  // Fallback: rows without a hash (legacy or stale-connection). Scan all and compare with timingSafeEqual.
  const rows = (await db.prepare("SELECT * FROM omni_keys WHERE key_hash IS NULL OR key_hash != ?").all(hash)) as any[];
  for (const r of rows) {
    try {
      const plain = isEncrypted(r.key_value) ? decryptKey(r.key_value) : r.key_value;
      if (timingSafeEqualHex(hashKey(plain), hash)) {
        // Backfill the hash so next lookup is O(1).
        await db.prepare("UPDATE omni_keys SET key_hash = ? WHERE id = ?").run(hash, r.id);
        return { id: r.id, user_id: r.user_id, key_value: value, created_at: r.created_at };
      }
    } catch {
      // skip malformed rows
    }
  }
  return null;
}

export async function deleteOmniKey(userId: number): Promise<boolean> {
  const result = await db.prepare("DELETE FROM omni_keys WHERE user_id = ?").run(userId);
  return result.changes > 0;
}
