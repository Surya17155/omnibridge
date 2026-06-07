import { Reveal } from "~/components/ui/reveal";
import { STATS } from "~/data/landing-content";
import styles from "./stats-band.module.css";

/** Headline metrics band rendered as a row of glowing bento cards. */
export function StatsBand() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.band}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.value}>{s.value}</span>
              <span className={styles.label}>{s.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
