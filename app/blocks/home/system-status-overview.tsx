import { IconKey, IconActivity, IconShieldCheck, IconBolt } from "@tabler/icons-react";
import styles from "./system-status-overview.module.css";

type Props = {
  activeKeys: number;
  distinctProviders: number;
  hasOmniKey: boolean;
  avgLatencyMs: number;
  currentModel: string;
  totalRequests: number;
};

export function SystemStatusOverview(props: Props) {
  const { activeKeys, distinctProviders, hasOmniKey, avgLatencyMs, currentModel, totalRequests } = props;

  const systemOnline = hasOmniKey && activeKeys > 0;

  const STATS = [
    {
      icon: IconShieldCheck,
      color: "success" as const,
      value: systemOnline ? "Healthy" : "Setup needed",
      label: "System Status",
      sublabel: systemOnline ? "All services operational" : "Generate an OmniKey to activate",
      badge: systemOnline ? "Online" : "Pending",
      badgeType: "success" as const,
    },
    {
      icon: IconKey,
      color: "primary" as const,
      value: String(activeKeys),
      label: "Active Keys",
      sublabel: `Across ${distinctProviders} provider${distinctProviders !== 1 ? "s" : ""}`,
      badge: null,
      badgeType: "success" as const,
    },
    {
      icon: IconActivity,
      color: "info" as const,
      value: totalRequests > 0 ? currentModel : "—",
      label: "Most-Used Provider",
      sublabel: totalRequests > 0 ? "Auto-selected" : "Awaiting traffic",
      badge: null,
      badgeType: "success" as const,
    },
    {
      icon: IconBolt,
      color: "warning" as const,
      value: avgLatencyMs > 0 ? `${avgLatencyMs}ms` : "—",
      label: "Avg Latency",
      sublabel: totalRequests > 0 ? `Across ${totalRequests} request${totalRequests !== 1 ? "s" : ""}` : "No data yet",
      badge: null,
      badgeType: "success" as const,
    },
  ];

  return (
    <div className={styles.grid}>
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={styles.statCard}>
            <div className={styles.cardTop}>
              <div className={`${styles.iconWrap} ${styles[stat.color]}`}>
                <Icon size={22} />
              </div>
              {stat.badge && (
                <span className={styles.statusBadge}>
                  <span className="status-dot status-dot-success" />
                  {stat.badge}
                </span>
              )}
            </div>
            <div>
              <div className={styles.value}>{stat.value}</div>
              <div className={styles.label}>{stat.label}</div>
              <div className={styles.sublabel}>{stat.sublabel}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
