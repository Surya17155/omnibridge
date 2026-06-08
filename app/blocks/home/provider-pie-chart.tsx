import { useState } from "react";
import { useInView } from "~/hooks/use-in-view";
import { PROVIDER_COLORS, type Provider } from "~/data/mock-data";
import styles from "./provider-pie-chart.module.css";

type Props = {
  data: Array<{ provider: Provider; requests: number }>;
};

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 85;
const GAP = 2;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

export function ProviderPieChart({ data }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.requests, 0) || 1;

  let angle = 0;
  const segments = data.map((d) => {
    const pct = (d.requests / total) * 100;
    const sweep = (d.requests / total) * 360;
    const path = describeArc(CX, CY, R + (hoverIdx === data.indexOf(d) ? 8 : 0), angle, angle + sweep - GAP);
    const midAngle = angle + sweep / 2;
    const labelPoint = polarToCartesian(CX, CY, R * 0.65, midAngle);
    const result = { ...d, pct, path, labelX: labelPoint.x, labelY: labelPoint.y, midAngle, sweep };
    angle += sweep;
    return result;
  });

  return (
    <div ref={ref} className={styles.wrap}>
      <h3 className={styles.title}>Requests by Provider</h3>
      <div className={styles.chartBody}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.svg}
          role="img"
          aria-label="Pie chart of requests by provider"
        >
          {segments.map((seg, i) => (
            <g key={seg.provider}>
              <path
                d={seg.path}
                fill={PROVIDER_COLORS[seg.provider]}
                opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.4}
                className={styles.segment}
                style={{
                  transformOrigin: `${CX}px ${CY}px`,
                  transitionDelay: `${i * 80}ms`,
                }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
              {seg.pct > 8 && inView && (
                <text
                  x={seg.labelX}
                  y={seg.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={styles.pctText}
                  style={{ transitionDelay: `${600 + i * 120}ms` }}
                >
                  {Math.round(seg.pct)}%
                </text>
              )}
            </g>
          ))}
        </svg>
        <div className={styles.legend}>
          {segments.map((seg, i) => (
            <div
              key={seg.provider}
              className={`${styles.legendItem} ${hoverIdx === i ? styles.legendActive : ""}`}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <span
                className={styles.legendDot}
                style={{ background: PROVIDER_COLORS[seg.provider] }}
              />
              <span className={styles.legendLabel}>{seg.provider}</span>
              <span className={styles.legendValue}>{seg.requests.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}