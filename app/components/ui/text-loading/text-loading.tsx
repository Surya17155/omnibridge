import classNames from "classnames";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "./text-loading.module.css";

export interface TextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

export default function TextLoading({
  texts = ["Thinking...", "Processing...", "Analyzing...", "Computing...", "Almost..."],
  className,
  interval = 2000,
}: TextLoadingProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.wrapper}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Infinity,
              },
            }}
            className={classNames(styles.text, className)}
          >
            {texts[currentTextIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
