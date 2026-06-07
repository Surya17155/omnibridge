import { PROVIDER_COLORS, type Provider } from "~/data/mock-data";
import { useCountUp } from "~/hooks/use-count-up";
import { useInView } from "~/hooks/use-in-view";
import { TrendChart } from "./trend-chart";
import styles from "./usage-statistics.module.css";

type Props = {
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  daily: Array<{ day: string; requests: number; successRate: number }>;
  byProvider: Array<{ provider: Provider; requests: number }>;
};

function AnimatedStat({
  value,
  label,
  format,
}: {
  value: number;
  label: string;
  format: (n: number) => string;
}) {
  const animated = useCountUp(value);
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{format(animated)}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

export function UsageStatistics({ totalRequests, totalTokens, successRate, daily, byProvider }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const tokensInMillions = totalTokens / 1_000_000;
  const maxRequests = byProvider.length > 0 ? Math.max(...byProvider.map((p) => p.requests), 1) : 1;

  const empty = totalRequests === 0;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Usage Statistics</h2>
          <p className={styles.subtitle}>
            {empty ? "No traffic yet — send a chat or call the proxy to populate" : "Requests processed across all providers"}
          </p>
        </div>
      </div>

      <div className={styles.statsRow}>
        <AnimatedStat
          value={totalRequests}
          label="Total Requests"
          format={(n) => Math.round(n).toLocaleString()}
        />
        <AnimatedStat
          value={tokensInMillions}
          label="Tokens Processed"
          format={(n) => `${n.toFixed(2)}M`}
        />
        <AnimatedStat
          value={successRate}
          label="Success Rate"
          format={(n) => `${n.toFixed(1)}%`}
        />
      </div>

      {daily.length > 0 && daily.some((d) => d.requests > 0) ? (
        <TrendChart data={daily} />
      ) : (
        <div className={styles.chartArea} style={{ minHeight: 120, color: "var(--color-text-muted)" }}>
          7-day trend will appear after a few requests.
        </div>
      )}

      <div ref={ref} className={styles.chartArea}>
        <p className={styles.chartLabel}>Requests by Provider</p>
        {byProvider.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No provider usage yet.</p>
        ) : (
          byProvider.map(({ provider, requests }, index) => (
            <div key={provider} className={styles.barRow}>
              <span className={styles.barLabel}>{provider}</span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: inView ? `${(requests / maxRequests) * 100}%` : "0%",
                    background:
                      PROVIDER_COLORS[provider] ?? "var(--color-primary)",
                    transitionDelay: `${index * 90}ms`,
                  }}
                />
              </div>
              <span className={styles.barCount}>{requests.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
