import { useEffect, useState } from "react";
import classnames from "classnames";
import styles from "./meteor-shower.module.css";

interface MeteorShowerProps {
  /** Number of meteors to render. */
  count?: number;
  className?: string;
}

interface MeteorStyle {
  top: string;
  left: string;
  delay: string;
  duration: string;
  width: string;
}

const LOOP_DURATION = 18;
const DEFAULT_COUNT = 18;

function buildMeteors(count: number): MeteorStyle[] {
  const meteors: MeteorStyle[] = [];
  const gap = LOOP_DURATION / count;

  for (let i = 0; i < count; i++) {
    meteors.push({
      top: `${Math.random() * 80 - 30}%`,
      left: `${Math.random() * 80 - 30}%`,
      delay: `-${(i * gap + Math.random() * gap * 0.6).toFixed(2)}s`,
      duration: `${LOOP_DURATION}s`,
      width: `${80 + Math.random() * 80}px`,
    });
  }

  return meteors;
}

/**
 * Premium decorative meteor shower that streaks diagonally.
 * Designed with precise timing to prevent clustering and ensure slow-motion, majestic traverses.
 */
export function MeteorShower({ count = DEFAULT_COUNT, className }: MeteorShowerProps) {
  const [meteors, setMeteors] = useState<MeteorStyle[]>([]);

  useEffect(() => {
    setMeteors(buildMeteors(count));
  }, [count]);

  return (
    <div className={classnames(styles.field, className)} aria-hidden="true">
      {meteors.map((m, i) => (
        <span
          key={i}
          className={styles.meteor}
          style={{
            top: m.top,
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
            ...({ "--tail-width": m.width } as React.CSSProperties),
          }}
        />
      ))}
    </div>
  );
}
