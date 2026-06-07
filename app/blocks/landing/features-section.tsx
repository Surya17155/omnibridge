import { Reveal } from "~/components/ui/reveal";
import { FEATURES } from "~/data/landing-content";
import styles from "./features-section.module.css";

export function FeaturesSection() {
  return (
    <section id="features" className={styles.section}>
      <Reveal>
        <div className={styles.head}>
          <h2 className={styles.title}>
            Everything you need to <span className="gradient-text">never hit a rate limit</span>
          </h2>
          <p className={styles.subtitle}>
            OmniBridge sits between your apps and every AI provider, turning a pile of free-tier keys into one
            resilient, production-grade endpoint.
          </p>
        </div>
      </Reveal>

      <div className={styles.grid}>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 60}>
            <article className={i === 0 ? styles.featureHero : styles.feature}>
              <span className={styles.border} aria-hidden="true" />
              <span className={styles.glow} aria-hidden="true" />
              <div className={styles.featureBody}>
                <span className={styles.iconWrap}>
                  <f.icon size={22} />
                </span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.description}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
