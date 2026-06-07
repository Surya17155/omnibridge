import { motion } from "framer-motion";
import { PROVIDER_BADGES } from "~/data/landing-content";
import styles from "./bridge-diagram.module.css";

/** Geometry constants for the SVG viewbox (1000 x 420). */
const HUB = { x: 540, y: 210, w: 150, h: 90 };
const OUTPUT = { x: 900, y: 210, r: 26 };
const INPUT_X = 120;

/** Five input nodes, vertically distributed, mapped to provider badges. */
const INPUTS = PROVIDER_BADGES.slice(0, 5).map((p, i) => ({
  ...p,
  y: 70 + i * 70,
}));

const HUB_LEFT = HUB.x - HUB.w / 2;
const HUB_RIGHT = HUB.x + HUB.w / 2;

function ingressPath(y: number): string {
  const midX = (INPUT_X + HUB_LEFT) / 2;
  return `M ${INPUT_X} ${y} C ${midX} ${y}, ${midX} ${HUB.y}, ${HUB_LEFT} ${HUB.y}`;
}

const EGRESS_PATH = `M ${HUB_RIGHT} ${HUB.y} L ${OUTPUT.x - OUTPUT.r} ${OUTPUT.y}`;

/**
 * Animated "many-to-one" diagram: five provider input nodes converge through
 * a central OmniBridge processor into a single unified output key. Light beams
 * pulse continuously from inputs into the hub, then out to the unified key.
 */
export function BridgeDiagram() {
  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox="0 0 1000 420"
        fill="none"
        role="img"
        aria-label="Five AI provider keys converging into one unified OmniBridge key"
      >
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#076EFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#4FABFF" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4FABFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4FABFF" stopOpacity="0" />
          </radialGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Static translucent pipes */}
        {INPUTS.map((n) => (
          <path key={`pipe-${n.name}`} d={ingressPath(n.y)} className={styles.pipe} />
        ))}
        <path d={EGRESS_PATH} className={styles.pipe} />

        {/* Animated light beams traveling along ingress pipes */}
        {INPUTS.map((n, i) => (
          <path
            key={`beam-${n.name}`}
            d={ingressPath(n.y)}
            className={styles.beam}
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}

        {/* Egress beam to unified output */}
        <path d={EGRESS_PATH} className={styles.egressBeam} />

        {/* Input nodes */}
        {INPUTS.map((n, i) => (
          <g key={`node-${n.name}`}>
            <circle cx={INPUT_X} cy={n.y} r="30" fill="url(#nodeGlow)" />
            <motion.circle
              cx={INPUT_X}
              cy={n.y}
              r="16"
              className={styles.inputNode}
              style={{ stroke: n.color }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            />
            <circle cx={INPUT_X} cy={n.y} r="4" fill={n.color} />
            <text x={INPUT_X - 44} y={n.y + 4} className={styles.nodeLabel} textAnchor="end">
              {n.name}
            </text>
          </g>
        ))}

        {/* Central processor (glassmorphic rounded rectangle) */}
        <motion.rect
          x={HUB_LEFT}
          y={HUB.y - HUB.h / 2}
          width={HUB.w}
          height={HUB.h}
          rx="22"
          className={styles.hub}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <text x={HUB.x} y={HUB.y - 4} className={styles.hubTitle} textAnchor="middle">
          OmniBridge
        </text>
        <text x={HUB.x} y={HUB.y + 16} className={styles.hubSub} textAnchor="middle">
          smart router
        </text>

        {/* Unified output node */}
        <circle cx={OUTPUT.x} cy={OUTPUT.y} r="48" fill="url(#nodeGlow)" />
        <motion.circle
          cx={OUTPUT.x}
          cy={OUTPUT.y}
          r={OUTPUT.r}
          className={styles.outputNode}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <text x={OUTPUT.x} y={OUTPUT.y + 70} className={styles.outputLabel} textAnchor="middle">
          Unified Key
        </text>
      </svg>
    </div>
  );
}
