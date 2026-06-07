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

const LOOP_DURATION = 40; // 40 seconds global cycle
const DEFAULT_COUNT = 14; // Tuned for a spacious, uncrowded feel over 40 seconds

function buildMeteors(count: number): MeteorStyle[] {
  const meteors: MeteorStyle[] = [];
  let t = 0;
  let i = 0;

  while (i < count) {
    // Generate groups of 1, 2, or rarely 3 (three at most)
    const rand = Math.random();
    let groupSize = 1;
    if (rand > 0.9) groupSize = 3;
    else if (rand > 0.6) groupSize = 2;

    groupSize = Math.min(groupSize, count - i);

    // Synchronize the flock: establish a base starting position
    // Starting further top/left ensures they traverse the whole screen
    const baseTop = Math.random() * 40 - 25;
    const baseLeft = Math.random() * 40 - 25;

    for (let j = 0; j < groupSize; j++) {
      // Stagger them slightly in formation
      const topOffset = j * 4; // Shift down slightly
      const leftOffset = j * -2; // Shift left to follow

      meteors.push({
        top: `${baseTop + topOffset}%`,
        left: `${baseLeft + leftOffset}%`,
        // Store base sequence time + stagger offset (stagger won't be scaled)
        delay: `${t}|${j * 0.4}`,
        duration: `${LOOP_DURATION}s`, // All meteors share the EXACT same duration to never drift
        width: `${100 + Math.random() * 60}px`,
      });
    }

    // Gap calculation: if it's a flock, force a larger gap before the next meteor
    t += groupSize > 1 ? 4.0 : 2.5;
    i += groupSize;
  }

  // Normalize all base delays so they strictly fill the 40s loop
  // This completely eliminates long empty gaps when the sequence restarts
  const scale = LOOP_DURATION / t;

  return meteors.map((m) => {
    const [baseStr, offsetStr] = m.delay.split("|");
    const scaledBase = parseFloat(baseStr) * scale;
    const offset = parseFloat(offsetStr);
    const finalDelay = scaledBase + offset;

    return {
      ...m,
      // Use negative delay to instantly populate the screen on page load
      delay: `-${finalDelay.toFixed(2)}s`,
    };
  });
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
