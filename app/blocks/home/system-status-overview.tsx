import { IconKey, IconActivity, IconShieldCheck, IconBolt } from "@tabler/icons-react";
import { useInView } from "~/hooks/use-in-view";
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
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const systemOnline = hasOmniKey && activeKeys > 0;

  return (
    <div ref={ref} className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>System Status</h2>
        <span className={`${styles.statusPill} ${systemOnline ? styles.pillOk : styles.pillWarn}`}>
          <span className={`status-dot ${systemOnline ? "status-dot-success" : "status-dot-warning"}`} />
          {systemOnline ? "Operational" : "Setup Needed"}
        </span>
      </div>

      <div className={`${styles.grid} ${inView ? styles.gridVisible : ""}`}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(52, 211, 153, 0.12)", color: "var(--color-success)" }}>
            <IconShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.cardValue}>{systemOnline ? "Healthy" : "Pending"}</div>
            <div className={styles.cardLabel}>System Health</div>
            <div className={styles.cardSub}>
              {systemOnline ? "All services operational" : "Generate an OmniKey to activate"}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(79, 171, 255, 0.12)", color: "var(--color-primary)" }}>
            <IconKey size={24} />
          </div>
          <div>
            <div className={styles.cardValue}>
              <strong>{activeKeys}</strong>
            </div>
            <div className={styles.cardLabel}>Active Keys</div>
            <div className={styles.cardSub}>Across {distinctProviders} provider{distinctProviders !== 1 ? "s" : ""}</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(56, 189, 248, 0.12)", color: "var(--color-info)" }}>
            <IconActivity size={24} />
          </div>
          <div>
            <div className={styles.cardValue}>
              <strong>{totalRequests > 0 ? currentModel : "—"}</strong>
            </div>
            <div className={styles.cardLabel}>Most-Used Provider</div>
            <div className={styles.cardSub}>{totalRequests > 0 ? "Based on request volume" : "Awaiting first request"}</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(251, 191, 36, 0.12)", color: "var(--color-warning)" }}>
            <IconBolt size={24} />
          </div>
          <div>
            <div className={styles.cardValue}>
              <strong>{avgLatencyMs > 0 ? `${avgLatencyMs}ms` : "—"}</strong>
            </div>
            <div className={styles.cardLabel}>Avg Latency</div>
            <div className={styles.cardSub}>
              {totalRequests > 0
                ? `Across ${totalRequests.toLocaleString()} request${totalRequests !== 1 ? "s" : ""}`
                : "No data yet"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}