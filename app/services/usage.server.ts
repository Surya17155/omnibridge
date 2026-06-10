import { db } from "~/db/database";

export type RequestLogStatus = "success" | "error" | "rate-limited";

export type RequestLogInput = {
  userId: number;
  provider: string;
  keyLabel: string;
  model: string;
  status: RequestLogStatus;
  responseTime: number;
  tokens: number;
  endpoint: string;
  errorMessage?: string;
};

export type RequestLog = {
  id: number;
  user_id: number;
  provider: string;
  key_label: string;
  model: string;
  status: string;
  response_time: number;
  tokens: number;
  endpoint: string;
  timestamp: string;
};

export async function insertRequestLog(input: RequestLogInput): Promise<number | null> {
  try {
    const result = await db.prepare(
      "INSERT INTO request_logs (user_id, provider, key_label, model, status, response_time, tokens, endpoint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      input.userId,
      input.provider,
      input.keyLabel,
      input.model,
      input.status,
      input.responseTime,
      input.tokens,
      input.endpoint
    );
    return result.lastInsertRowid;
  } catch (e) {
    console.error("[usage] insertRequestLog failed", e);
    return null;
  }
}

export async function getRequestLogs(
  userId: number,
  options: { limit?: number; offset?: number; provider?: string; status?: string } = {}
): Promise<RequestLog[]> {
  const { limit = 50, offset = 0, provider, status } = options;
  const conditions = ["user_id = ?"];
  const params: any[] = [userId];
  if (provider) {
    conditions.push("provider = ?");
    params.push(provider);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  params.push(limit, offset);
  const rows = await db.prepare(
    `SELECT * FROM request_logs WHERE ${conditions.join(" AND ")} ORDER BY timestamp DESC LIMIT ? OFFSET ?`
  ).all(...params);
  return rows as unknown as RequestLog[];
}

export async function countRequestLogs(
  userId: number,
  options: { provider?: string; status?: string } = {}
): Promise<number> {
  const { provider, status } = options;
  const conditions = ["user_id = ?"];
  const params: any[] = [userId];
  if (provider) {
    conditions.push("provider = ?");
    params.push(provider);
  }
  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  const row = await db.prepare(`SELECT COUNT(*) as c FROM request_logs WHERE ${conditions.join(" AND ")}`).get(...params) as any;
  return row.c as number;
}

export type UsageStats = {
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  requestsByProvider: Array<{ provider: string; requests: number }>;
  requestsByDay: Array<{ day: string; requests: number; successRate: number }>;
  avgResponseTime: number;
};

export async function getUsageStats(userId: number, options: { days?: number; provider?: string } = {}): Promise<UsageStats> {
  const { days: rawDays = 7, provider } = options;
  const days = Math.max(1, Math.min(365, rawDays));

  const conditions = ["user_id = ?"];
  const params: any[] = [userId];
  conditions.push("timestamp >= datetime('now', ? || ' days')");
  params.push(`-${days}`);
  if (provider) {
    conditions.push("provider = ?");
    params.push(provider);
  }
  const where = conditions.join(" AND ");

  const totals = await db.prepare(
    `SELECT
       COUNT(*) as total,
       COALESCE(SUM(tokens), 0) as totalTokens,
       COALESCE(AVG(response_time), 0) as avgRt,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successCount
     FROM request_logs WHERE ${where}`
  ).get(...params) as any;

  const provParams = [...params];
  const byProvider = provider
    ? [{ provider, requests: totals.total }]
    : await db.prepare(
        `SELECT provider, COUNT(*) as requests
         FROM request_logs WHERE ${where}
         GROUP BY provider
         ORDER BY requests DESC`
      ).all(...provParams) as unknown as Array<{ provider: string; requests: number }>;

  const dayParams = [...params];
  const byDay = await db.prepare(
    `SELECT
       date(timestamp) as day,
       COUNT(*) as requests,
       CASE WHEN COUNT(*) = 0 THEN 0
            ELSE 100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)
       END as successRate
     FROM request_logs WHERE ${where}
     GROUP BY date(timestamp)
     ORDER BY day`
  ).all(...dayParams) as unknown as Array<{ day: string; requests: number; successRate: number }>;

  const requestsByDay = fillMissingDays(byDay, days);

  return {
    totalRequests: totals.total,
    totalTokens: totals.totalTokens,
    successRate: totals.total > 0 ? (totals.successCount / totals.total) * 100 : 0,
    requestsByProvider: byProvider,
    requestsByDay,
    avgResponseTime: totals.avgRt,
  };
}

function fillMissingDays(
  rows: Array<{ day: string; requests: number; successRate: number }>,
  numDays: number
): Array<{ day: string; requests: number; successRate: number }> {
  const map = new Map<string, { requests: number; successRate: number }>();
  for (const r of rows) map.set(r.day, { requests: r.requests, successRate: r.successRate });

  const result: Array<{ day: string; requests: number; successRate: number }> = [];
  const now = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const existing = map.get(key);
    result.push({
      day: formatDayLabel(key),
      requests: existing?.requests ?? 0,
      successRate: existing?.successRate ?? 0,
    });
  }
  return result;
}

function formatDayLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}
