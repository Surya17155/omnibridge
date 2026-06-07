import { useState } from "react";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { LogsFilter } from "~/blocks/usage-logs/logs-filter";
import { LogsTable } from "~/blocks/usage-logs/logs-table";
import { LogDetailsModal } from "~/blocks/usage-logs/log-details-modal";
import { ExportLogs } from "~/blocks/usage-logs/export-logs";
import { Reveal } from "~/components/ui/reveal";
import { requireAuth } from "~/services/session.server";
import { getRequestLogs, countRequestLogs, type RequestLog } from "~/services/usage.server";
import type { LogEntry } from "~/data/mock-data";
import styles from "./usage-logs.module.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const limit = 100;
  const logs = await getRequestLogs(user.id, { limit, provider, status });
  const total = await countRequestLogs(user.id, { provider, status });

  return { logs, total, search: search ?? "" };
}

function toLogEntry(row: RequestLog, idx: number): LogEntry {
  return {
    id: String(row.id ?? idx),
    timestamp: row.timestamp,
    provider: row.provider as LogEntry["provider"],
    keyLabel: row.key_label,
    model: row.model,
    status: row.status as LogEntry["status"],
    responseTime: row.response_time ?? 0,
    tokens: row.tokens ?? 0,
    endpoint: row.endpoint ?? "/api/v1/chat/completions",
  };
}

export default function UsageLogs() {
  const { logs, total } = useLoaderData<typeof loader>();
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const entries: LogEntry[] = logs.map(toLogEntry);

  const filteredLogs = entries.filter((log) => {
    if (provider && log.provider !== provider) return false;
    if (status && log.status !== status) return false;
    if (search && !log.model.toLowerCase().includes(search.toLowerCase()) && !log.keyLabel.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleReset = () => {
    setProvider("");
    setStatus("");
    setSearch("");
  };

  return (
    <div className={styles.page}>
      <Reveal direction="none">
        <h1 className={styles.pageTitle}>Usage Logs</h1>
        <p className={styles.pageSubtitle}>
          {total === 0
            ? "No requests logged yet. Send a chat message or call the proxy endpoint to populate this view."
            : `Tracking ${total} request${total !== 1 ? "s" : ""} routed through OmniBridge`}
        </p>
      </Reveal>

      <Reveal delay={60}>
        <LogsFilter
          provider={provider}
          status={status}
          search={search}
          onProviderChange={setProvider}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
          onReset={handleReset}
        />
      </Reveal>
      <Reveal delay={100}>
        <ExportLogs logs={filteredLogs} />
      </Reveal>
      <Reveal delay={140}>
        <LogsTable logs={filteredLogs} onRowClick={setSelectedLog} />
      </Reveal>
      <LogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
