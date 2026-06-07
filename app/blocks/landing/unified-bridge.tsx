import { Reveal } from "~/components/ui/reveal";
import { PROVIDER_BADGES } from "~/data/landing-content";
import { BridgeDiagram } from "./bridge-diagram";
import styles from "./unified-bridge.module.css";

/**
 * Cohesive section visualizing the core value proposition: many fragmented
 * provider keys consolidated into one unified stream. Combines the headline
 * messaging, the animated many-to-one bridge diagram, and the provider
 * marquee as a single integrated flow.
 */
export function UnifiedBridge() {
  const row = [...PROVIDER_BADGES, ...PROVIDER_BADGES, ...PROVIDER_BADGES];

  return (
    <section id="providers" className={styles.section} aria-label="Unified API bridge">
      <div className={styles.bloom} aria-hidden="true" />
      <div className={styles.inner}>
        <Reveal>
          <p className={styles.eyebrow}>The unified bridge</p>
          <h2 className={styles.title}>
            Many keys. <span className="gradient-text">One bridge.</span>
          </h2>
          <p className={styles.description}>
            Gemini, Groq, DeepSeek, GLM, Kimi and more — OmniBridge merges every provider key into a single,
            intelligent, unified API stream.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <BridgeDiagram />
        </Reveal>

        <div className={styles.marquee} aria-label="Supported providers">
          <div className={styles.track}>
            {row.map((p, i) => (
              <span key={`${p.name}-${i}`} className={styles.chip}>
                <span className={styles.dot} style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
