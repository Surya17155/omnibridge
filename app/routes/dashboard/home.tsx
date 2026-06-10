import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { SystemStatusOverview } from "~/blocks/home/system-status-overview";
import { UsageStatistics } from "~/blocks/home/usage-statistics";
import { ActiveKeysSummary } from "~/blocks/home/active-keys-summary";
import { QuickActions } from "~/blocks/home/quick-actions";
import { Reveal } from "~/components/ui/reveal";
import { requireAuth } from "~/services/session.server";
import { getProviderKeys, getOmniKey } from "~/services/auth.server";
import { getUsageStats } from "~/services/usage.server";
import type { Provider } from "~/data/mock-data";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const providerKeys = await getProviderKeys(user.id);
  const omniKey = await getOmniKey(user.id);

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const provider = url.searchParams.get("provider") || undefined;

  const stats = await getUsageStats(user.id, { days, provider });

  const allProviders = Array.from(new Set(providerKeys.map((k) => k.provider))) as Provider[];

  const usageStats = {
    totalRequests: stats.totalRequests,
    totalTokens: stats.totalTokens,
    successRate: stats.successRate,
    daily: stats.requestsByDay,
    byProvider: stats.requestsByProvider.map((p) => ({
      provider: p.provider as Provider,
      requests: p.requests,
    })),
  };

  const systemStatus = {
    activeKeys: providerKeys.filter((k) => k.status === "active").length,
    distinctProviders: allProviders.length,
    hasOmniKey: !!omniKey,
    avgLatencyMs: Math.round(stats.avgResponseTime),
    currentModel: allProviders.length > 0 ? stats.requestsByProvider[0]?.provider ?? allProviders[0] : "—",
    totalRequests: stats.totalRequests,
  };

  const activeKeys = providerKeys.map((k) => ({
    id: String(k.id),
    provider: k.provider as Provider,
    label: k.label,
    key: maskKey(k.key_value),
    status: (k.status === "active" ? "active" : k.status === "inactive" ? "inactive" : "quota-exceeded") as "active" | "inactive" | "quota-exceeded",
    quotaRemaining: k.quota_remaining,
    quotaTotal: k.quota_total,
    lastUsed: k.last_used,
    addedAt: k.added_at,
  }));

  return { usageStats, systemStatus, activeKeys, hasOmniKey: !!omniKey, availableProviders: allProviders, filterDays: days, filterProvider: provider || null };
}

function maskKey(value: string): string {
  if (value.length <= 8) return value.slice(0, 4) + "...";
  return value.slice(0, 4) + "..." + value.slice(-4);
}

export default function DashboardHome() {
  const { usageStats, systemStatus, activeKeys, hasOmniKey, availableProviders, filterDays, filterProvider } = useLoaderData<typeof loader>();
  return (
    <div className="page">
      <Reveal>
        <header style={{ marginBottom: "var(--space-10)" }}>
          <h1 className="page-title" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}>Dashboard</h1>
          <p className="page-subtitle" style={{ fontSize: "var(--text-lg)" }}>
            Live overview of your unified AI proxy — keys, usage, and system health at a glance.
          </p>
        </header>
      </Reveal>
      <Reveal delay={40}>
        <SystemStatusOverview {...systemStatus} hasOmniKey={hasOmniKey} />
      </Reveal>
      <Reveal delay={60}>
        <UsageStatistics {...usageStats} availableProviders={availableProviders} filterDays={filterDays} filterProvider={filterProvider} />
      </Reveal>
      <Reveal delay={80}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", alignItems: "flex-start" }}>
          <ActiveKeysSummary keys={activeKeys} />
          <QuickActions />
        </div>
      </Reveal>
    </div>
  );
}