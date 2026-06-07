import { Link } from "react-router";
import { IconArrowRight, IconPlayerPlayFilled } from "@tabler/icons-react";
import { Reveal } from "~/components/ui/reveal";
import styles from "./final-cta.module.css";

/** Closing call-to-action band that links into the dashboard. */
export function FinalCta() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.inner}>
          <div className={styles.glow} aria-hidden="true" />
          <h2 className={styles.title}>
            Ship AI features <span className="gradient-text">without the rate limits</span>
          </h2>
          <p className={styles.sub}>
            Merge your keys, generate one bridge endpoint, and let OmniBridge keep your apps online.
          </p>
          <div className={styles.actions}>
            <Link to="/auth" className="btn btn-primary">
              <IconPlayerPlayFilled size={16} />
              Generate Unified Key
            </Link>
            <Link to="/auth" className="btn btn-secondary">
              Open Dashboard
              <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
