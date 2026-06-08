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

export async function getUsageStats(userId: number): Promise<UsageStats> {
  const totals = await db.prepare(
    `SELECT
       COUNT(*) as total,
       COALESCE(SUM(tokens), 0) as totalTokens,
       COALESCE(AVG(response_time), 0) as avgRt,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successCount
     FROM request_logs WHERE user_id = ?`
  ).get(userId) as any;

  const byProvider = await db.prepare(
    `SELECT provider, COUNT(*) as requests
     FROM request_logs WHERE user_id = ?
     GROUP BY provider
     ORDER BY requests DESC`
  ).all(userId) as unknown as Array<{ provider: string; requests: number }>;

  const byDay = await db.prepare(
    `SELECT
       strftime('%w', timestamp) as dow,
       COUNT(*) as requests,
       CASE WHEN COUNT(*) = 0 THEN 0
            ELSE 100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)
       END as successRate
     FROM request_logs
     WHERE user_id = ? AND timestamp >= datetime('now', '-7 days')
     GROUP BY dow
     ORDER BY dow`
  ).all(userId) as unknown as Array<{ dow: string; requests: number; successRate: number }>;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = new Map(byDay.map((d) => [d.dow, d]));
  const requestsByDay: UsageStats["requestsByDay"] = [];
  for (let i = 0; i < 7; i++) {
    const dow = String(i);
    const row = dayMap.get(dow);
    requestsByDay.push({
      day: dayNames[i],
      requests: row?.requests ?? 0,
      successRate: row?.successRate ?? 0,
    });
  }

  return {
    totalRequests: totals.total,
    totalTokens: totals.totalTokens,
    successRate: totals.total > 0 ? (totals.successCount / totals.total) * 100 : 0,
    requestsByProvider: byProvider,
    requestsByDay,
    avgResponseTime: totals.avgRt,
  };
}
