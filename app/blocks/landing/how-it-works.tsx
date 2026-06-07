import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { STEPS, type StepItem } from "~/data/landing-content";
import styles from "./how-it-works.module.css";

/**
 * Builds a strictly-increasing, clamped [0,1] input window for a step so
 * framer-motion's WAAPI keyframes never receive invalid offsets.
 */
function stepWindow(index: number, total: number): number[] {
  const slice = 1 / total;
  const start = index * slice;
  const end = start + slice;
  const pad = slice * 0.4;
  return [
    Math.max(0, start - pad),
    Math.min(1, start + pad),
    Math.max(0, end - pad),
    Math.min(1, end + pad),
  ];
}

function Step({ step, progress, window }: { step: StepItem; progress: MotionValue<number>; window: number[] }) {
  const opacity = useTransform(progress, window, [0.2, 1, 1, 0.2]);
  const x = useTransform(progress, [window[0], window[1]], [40, 0]);

  return (
    <motion.article className={styles.step} style={{ opacity, x }}>
      <span className={styles.stepIndex}>{step.index}</span>
      <div>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.stepDesc}>{step.description}</p>
      </div>
    </motion.article>
  );
}

/** Scroll-pinned "how it works" storytelling section. */
export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how" className={styles.section} ref={ref}>
      <div className={styles.sticky}>
        <div className={styles.headCol}>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={styles.title}>
            From scattered keys to <span className="gradient-text">one bridge</span> in three steps
          </h2>
          <p className={styles.lead}>
            No infrastructure to manage. No SDK rewrites. Just connect your keys and point your app at OmniBridge.
          </p>
        </div>

        <div className={styles.stepsCol}>
          <div className={styles.rail}>
            <motion.div className={styles.railFill} style={{ scaleY: lineScale }} />
          </div>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <Step key={step.index} step={step} progress={scrollYProgress} window={stepWindow(i, STEPS.length)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
