import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 1400;

/**
 * Animates a numeric value from 0 to `end` using an ease-out curve.
 * Returns the current animated value, updated on each animation frame.
 */
export function useCountUp(end: number, duration = DEFAULT_DURATION): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return value;
}
