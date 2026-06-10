import { useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { useInView } from "~/hooks/use-in-view";
import { IconChevronDown } from "@tabler/icons-react";
import type { Provider } from "~/data/mock-data";
import styles from "./trend-chart.module.css";

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 280;
const PAD_X = 16;
const PAD_TOP = 32;
const PAD_BOTTOM = 32;

const RANGES = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "1 year", value: 365 },
];

interface TrendChartProps {
  data: Array<{ day: string; requests: number; successRate: number }>;
  availableProviders?: Provider[];
  filterDays?: number;
  filterProvider?: string | null;
}

function buildPath(data: TrendChartProps["data"], max: number) {
  const innerWidth = VIEW_WIDTH - PAD_X * 2;
  const innerHeight = VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = innerWidth / (data.length - 1);

  const points = data.map((point, index) => {
    const x = PAD_X + stepX * index;
    const y = PAD_TOP + innerHeight - (point.requests / max) * innerHeight;
    return { x, y };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const baseY = PAD_TOP + innerHeight;
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`;

  return { points, line, area };
}

export function TrendChart({ data, availableProviders, filterDays = 7, filterProvider }: TrendChartProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);
  const [provOpen, setProvOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const max = Math.max(...data.map((d) => d.requests), 1) * 1.12;
  const { points, line, area } = buildPath(data, max);
  const peak = data.reduce((a, b) => (b.requests > a.requests ? b : a));

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    });
    setHovered(nearest);
  }, [points]);

  const handleMouseLeave = useCallback(() => setHovered(null), []);
  const tip = hovered !== null && data[hovered];
  const totalLabel = data.reduce((s, d) => s + d.requests, 0).toLocaleString();

  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.heading}>
        <div className={styles.headingLeft}>
          <p className={styles.chartLabel}>Request Volume</p>
          <span className={styles.totalBadge}>{totalLabel} requests</span>
        </div>
        <span className={styles.peak}>
          Peak {peak.day} · {peak.requests.toLocaleString()}
        </span>
      </div>

      <div className={styles.filters}>
        <div className={styles.rangeGroup}>
          {RANGES.map((r) => (
            <button
              key={r.value}
              className={`${styles.rangeBtn} ${filterDays === r.value ? styles.rangeActive : ""}`}
              onClick={() => setFilter("days", String(r.value))}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className={styles.provWrap}>
          <button
            className={styles.provTrigger}
            onClick={() => setProvOpen((o) => !o)}
            onBlur={() => setTimeout(() => setProvOpen(false), 150)}
          >
            <span>{filterProvider || "All providers"}</span>
            <IconChevronDown size={14} className={`${styles.provChevron} ${provOpen ? styles.provChevronOpen : ""}`} />
          </button>
          {provOpen && (
            <div className={styles.provDropdown}>
              <button
                className={`${styles.provOption} ${!filterProvider ? styles.provOptionActive : ""}`}
                onMouseDown={() => { setFilter("provider", null); setProvOpen(false); }}
              >
                All providers
              </button>
              {(availableProviders || []).map((p) => (
                <button
                  key={p}
                  className={`${styles.provOption} ${filterProvider === p ? styles.provOptionActive : ""}`}
                  onMouseDown={() => { setFilter("provider", p); setProvOpen(false); }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Request volume over ${filterDays} days`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: hovered !== null ? "pointer" : "default" }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#4FABFF" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD_TOP + (VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM) * frac;
          return (
            <line key={frac} x1={PAD_X} x2={VIEW_WIDTH - PAD_X} y1={y} y2={y} className={styles.grid} />
          );
        })}

        <path d={area} fill="url(#trendFill)" className={`${styles.area} ${inView ? styles.areaVisible : ""}`} />
        <path d={line} className={`${styles.line} ${inView ? styles.lineVisible : ""}`} />

        {hovered !== null && (
          <line x1={points[hovered].x} x2={points[hovered].x} y1={PAD_TOP - 6} y2={VIEW_HEIGHT - PAD_BOTTOM} className={styles.hoverLine} />
        )}

        {points.map((p, i) => {
          const isHovered = hovered === i;
          return (
            <circle
              key={data[i].day}
              cx={p.x} cy={p.y}
              r={isHovered ? 7 : 3.5}
              className={`${styles.dot} ${inView ? styles.dotVisible : ""} ${isHovered ? styles.dotActive : ""}`}
              style={{
                transitionDelay: isHovered ? "0ms" : `${600 + i * 70}ms`,
                cursor: "pointer",
              }}
            />
          );
        })}

        {hovered !== null && tip && (
          <>
            <circle cx={points[hovered].x} cy={points[hovered].y} r="14" className={styles.dotGlow} />
            <g>
              <rect
                x={points[hovered].x - 52}
                y={points[hovered].y - 48}
                width="104"
                height="38"
                rx="6"
                className={styles.tooltipBg}
              />
              <text
                x={points[hovered].x}
                y={points[hovered].y - 30}
                textAnchor="middle"
                className={styles.tooltipDay}
              >{tip.day}</text>
              <text
                x={points[hovered].x}
                y={points[hovered].y - 14}
                textAnchor="middle"
                className={styles.tooltipVal}
              >{tip.requests.toLocaleString()}</text>
            </g>
          </>
        )}
      </svg>

      {data.length <= 20 && (
        <div className={styles.axis}>
          {data.map((point) => (
            <span key={point.day}>{point.day}</span>
          ))}
        </div>
      )}
    </div>
  );
}
