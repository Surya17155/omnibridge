import type { ReactNode } from "react";
import { useInView } from "~/hooks/use-in-view";
import { useCountUp } from "~/hooks/use-count-up";
import styles from "./metric-card.module.css";

type Props = {
  icon: ReactNode;
  label: string;
  value: number;
  format: (n: number) => string;
  sublabel?: string;
  subtitle?: string;
  color?: string;
  trend?: "up" | "down" | "neutral";
};

export function MetricCard({ icon, label, value, format, sublabel, subtitle, color, trend }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const animated = useCountUp(value);
  const trendSymbol = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.top}>
        <div className={styles.iconWrap} style={color ? { background: `${color}20` } : undefined}>
          {icon}
        </div>
        {trend && <span className={`${styles.trend} ${styles[`trend${trend}`]}`}>{trendSymbol}</span>}
      </div>
      <div className={styles.value} style={color ? { color } : undefined}>
        {inView ? format(animated) : "—"}
      </div>
      <div className={styles.label}>{label}</div>
      {sublabel && <div className={styles.sublabel}>{sublabel}</div>}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}