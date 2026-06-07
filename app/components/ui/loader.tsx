import classnames from "classnames";
import styles from "./loader.module.css";

interface LoaderProps {
  /** Diameter of the loader in pixels. */
  size?: number;
  /** Animated text rendered inside the spinning ring. */
  text?: string;
  /** Render as a fullscreen overlay. */
  fullscreen?: boolean;
  className?: string;
}

/**
 * Circular gradient loader with a rotating glow ring and per-letter
 * bounce animation. Downscaled, theme-consistent version.
 */
export function Loader({ size = 96, text = "Loading", fullscreen = false, className }: LoaderProps) {
  const letters = text.split("");

  return (
    <div className={classnames(fullscreen && styles.overlay, className)}>
      <div className={styles.loader} style={{ width: size, height: size }}>
        {letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className={styles.letter}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
        <div className={styles.ring} />
      </div>
    </div>
  );
}
