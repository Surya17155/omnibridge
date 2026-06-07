import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the referenced element has entered the viewport.
 * Once visible, it stays true so reveal animations only play once.
 */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}
