import {
  IconChartBar,
  IconBolt,
  IconCoins,
  IconPercentage,
} from "@tabler/icons-react";
import type { Provider } from "~/data/mock-data";
import { useInView } from "~/hooks/use-in-view";
import { TrendChart } from "./trend-chart";
import { ProviderPieChart } from "./provider-pie-chart";
import { SuccessRateRing } from "./success-rate-ring";
import { MetricCard } from "./metric-card";
import styles from "./usage-statistics.module.css";

type Props = {
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  daily: Array<{ day: string; requests: number; successRate: number }>;
  byProvider: Array<{ provider: Provider; requests: number }>;
  availableProviders?: Provider[];
  filterDays?: number;
  filterProvider?: string | null;
};

export function UsageStatistics({ totalRequests, totalTokens, successRate, daily, byProvider, availableProviders, filterDays, filterProvider }: Props) {
  const { ref: barRef, inView: barInView } = useInView<HTMLDivElement>(0.1);
  const maxRequests = byProvider.length > 0 ? Math.max(...byProvider.map((p) => p.requests), 1) : 1;
  const empty = totalRequests === 0;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Usage Overview</h2>
        {!empty && (
          <span className={styles.pill}>{totalRequests.toLocaleString()} total requests</span>
        )}
      </div>

      <div className={styles.metricsRow}>
        <MetricCard
          icon={<IconChartBar size={22} />}
          label="Total Requests"
          value={totalRequests}
          format={(n) => Math.round(n).toLocaleString()}
          color="var(--color-primary)"
          trend={totalRequests > 0 ? "up" : undefined}
        />
        <MetricCard
          icon={<IconCoins size={22} />}
          label="Tokens Processed"
          value={totalTokens / 1_000_000}
          format={(n) => `${n >= 1 ? n.toFixed(2) : n.toFixed(4)}M`}
          color="var(--color-info)"
          subtitle={totalTokens > 0 ? `${totalTokens.toLocaleString()} tokens` : undefined}
        />
        <MetricCard
          icon={<IconPercentage size={22} />}
          label="Success Rate"
          value={successRate}
          format={(n) => `${n.toFixed(1)}%`}
          color={successRate >= 95 ? "var(--color-success)" : successRate >= 80 ? "var(--color-warning)" : "var(--color-danger)"}
          subtitle={empty ? "No data yet" : `${totalRequests} requests analysed`}
        />
        <MetricCard
          icon={<IconBolt size={22} />}
          label="Avg Response Time"
          value={0}
          format={() => daily.length > 0 ? `${(daily.reduce((s, d) => s + d.successRate, 0) / daily.length).toFixed(0)}ms` : "—"}
          color="var(--color-warning)"
        />
      </div>

      <div className={styles.chartsRow}>
        {byProvider.length > 0 ? (
          <ProviderPieChart data={byProvider} />
        ) : (
          <EmptyChartBlock title="Requests by Provider" />
        )}
        {!empty ? (
          <SuccessRateRing rate={successRate} total={totalRequests} />
        ) : (
          <EmptyChartBlock title="Success Rate" />
        )}
      </div>

      {daily.length > 0 && daily.some((d) => d.requests > 0) ? (
        <TrendChart data={daily} availableProviders={availableProviders} filterDays={filterDays} filterProvider={filterProvider} />
      ) : null}

      <div className={styles.barSection} ref={barRef}>
        <h3 className={styles.barTitle}>Requests by Provider</h3>
        {byProvider.length === 0 ? (
          <p className={styles.emptyText}>No provider usage yet.</p>
        ) : (
          <BarChart inView={barInView} byProvider={byProvider} maxRequests={maxRequests} />
        )}
      </div>
    </div>
  );
}

function EmptyChartBlock({ title }: { title: string }) {
  return (
    <div className={styles.emptyChart}>
      <p className={styles.emptyChartTitle}>{title}</p>
      <p className={styles.emptyChartSub}>Data will appear after first request</p>
    </div>
  );
}

function BarChart({ inView, byProvider, maxRequests }: {
  inView: boolean;
  byProvider: Array<{ provider: Provider; requests: number }>;
  maxRequests: number;
}) {
  return (
    <div className={styles.barList}>
      {byProvider.map(({ provider, requests }, index) => (
        <div key={provider} className={styles.barRow}>
          <span className={styles.barLabel}>{provider}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{
                width: inView ? `${(requests / maxRequests) * 100}%` : "0%",
                transitionDelay: `${index * 90}ms`,
              }}
            />
          </div>
          <span className={styles.barCount}>{requests.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}