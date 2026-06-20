import { useRef } from "react";
import { Link } from "react-router";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { IconBolt } from "@tabler/icons-react";
import { MeteorShower } from "~/components/ui/meteor-shower/meteor-shower";
import styles from "./landing-hero.module.css";

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

/**
 * Landing hero. Includes simplified subtext, and the beautifully custom
 * interactive Generate button.
 */
export function LandingHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <header className={styles.hero} ref={ref}>
      <motion.div className={styles.glow} aria-hidden="true" style={{ y: glowY }} />
      <div className={styles.grid} aria-hidden="true" />
      <MeteorShower count={18} />

      <motion.div
        className={styles.heroInner}
        style={{ y: contentY, opacity: contentOpacity }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className={styles.heroTag} variants={item}>
          <IconBolt size={13} />
          Unified AI Proxy Manager
        </motion.div>

        <motion.h1 className={styles.heroTitle} variants={item}>
          Merge every AI key
          <br />
          into <span className={styles.heroAccent}>one</span>
        </motion.h1>

        <motion.p className={styles.heroSub} variants={item}>
          Gemini, Groq, Nvidia, GitHub, Cerebras, Cohere and more — behind a single unified API key.
        </motion.p>

        <motion.div variants={item}>
          <a
            href="https://www.producthunt.com/products/omnibridge?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-omnibridge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              alt="Omnibridge - One API key. 16+ free AI providers. Zero limits. | Product Hunt"
              width="250"
              height="54"
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1176490&theme=light&t=1781937712295"
            />
          </a>
        </motion.div>

        <motion.div className={styles.heroActions} variants={item}>
          <Link to="/auth" className={styles.btnWrapper}>
            <button className={styles.btn}>
              <svg className={styles.btnSvg} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34 1.2-2.11 3.03-5.31C11.5 5.5 12.33 4 13 4h1l-1 7h3.5c.49 0 .56.26.36.63L11 21z" />
              </svg>
              <div className={styles.txtWrapper}>
                <span className={styles.txt1}>
                  {"GENERATE".split("").map((letter, i) => (
                    <span key={i} className={styles.btnLetter}>
                      {letter}
                    </span>
                  ))}
                </span>
                <span className={styles.txt2}>
                  {"UNIFIED KEY".split("").map((letter, i) => (
                    <span key={i} className={styles.btnLetter}>
                      {letter === " " ? "\u00A0" : letter}
                    </span>
                  ))}
                </span>
              </div>
            </button>
          </Link>
        </motion.div>
      </motion.div>
    </header>
  );
}
