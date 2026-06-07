import { type ReactNode } from "react";
import classnames from "classnames";
import { useInView } from "~/hooks/use-in-view";
import styles from "./reveal.module.css";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  /** Delay in ms before the reveal animation starts. */
  delay?: number;
  /** Direction the element travels from. */
  direction?: Direction;
  className?: string;
}

/**
 * Wraps content in a scroll-triggered reveal animation that plays once
 * when the element enters the viewport. Respects prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, direction = "up", className }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <div
      ref={ref}
      className={classnames(styles.reveal, styles[direction], { [styles.visible]: inView }, className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
