import { useInView } from "~/hooks/use-in-view";
import styles from "./success-rate-ring.module.css";

type Props = {
  rate: number;
  total: number;
};

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 78;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * R;

function getColor(rate: number): string {
  if (rate >= 95) return "var(--color-success)";
  if (rate >= 80) return "var(--color-warning)";
  return "var(--color-danger)";
}

export function SuccessRateRing({ rate, total }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const pct = Math.min(rate, 100);
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const color = getColor(rate);
  const empty = total === 0;

  return (
    <div ref={ref} className={styles.wrap}>
      <h3 className={styles.title}>Success Rate</h3>
      <div className={styles.ringWrap}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.svg}
          role="img"
          aria-label={`Success rate: ${pct.toFixed(1)}%`}
        >
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="var(--color-surface-raised)"
            strokeWidth={STROKE}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={inView ? offset : CIRCUMFERENCE}
            className={styles.ring}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        </svg>
        <div className={styles.center}>
          <span className={styles.rateValue} style={{ color }}>
            {empty ? "—" : `${Math.round(pct)}%`}
          </span>
          {!empty && <span className={styles.rateSub}>of {total.toLocaleString()} reqs</span>}
        </div>
      </div>
    </div>
  );
}