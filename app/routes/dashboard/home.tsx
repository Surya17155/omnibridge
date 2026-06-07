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
  const stats = await getUsageStats(user.id);

  const providers = Array.from(new Set(providerKeys.map((k) => k.provider))) as Provider[];

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
    distinctProviders: providers.length,
    hasOmniKey: !!omniKey,
    avgLatencyMs: Math.round(stats.avgResponseTime),
    currentModel: providers.length > 0 ? stats.requestsByProvider[0]?.provider ?? providers[0] : "—",
    totalRequests: stats.totalRequests,
  };

  const activeKeys = providerKeys.map((k) => ({
    id: String(k.id),
    provider: k.provider as Provider,
    label: k.label,
    key: maskKey(k.key_value),
    status: k.status === "active" ? "active" : k.status === "inactive" ? "inactive" : "quota-exceeded",
    quotaRemaining: k.quota_remaining,
    quotaTotal: k.quota_total,
    lastUsed: k.last_used,
    addedAt: k.added_at,
  }));

  return { usageStats, systemStatus, activeKeys, hasOmniKey: !!omniKey };
}

function maskKey(value: string): string {
  if (value.length <= 8) return value.slice(0, 4) + "...";
  return value.slice(0, 4) + "..." + value.slice(-4);
}

export default function DashboardHome() {
  const { usageStats, systemStatus, activeKeys, hasOmniKey } = useLoaderData<typeof loader>();
  return (
    <div className="page">
      <Reveal>
        <header style={{ marginBottom: "var(--space-8)" }}>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Live overview of your unified AI proxy — keys, usage, and system health at a glance.
          </p>
        </header>
      </Reveal>
      <Reveal>
        <SystemStatusOverview {...systemStatus} hasOmniKey={hasOmniKey} />
      </Reveal>
      <Reveal delay={80}>
        <UsageStatistics {...usageStats} />
      </Reveal>
      <Reveal delay={120}>
        <ActiveKeysSummary keys={activeKeys} />
      </Reveal>
      <Reveal delay={160}>
        <QuickActions />
      </Reveal>
    </div>
  );
}
