import { useEffect, useState } from "react";
import { Link } from "react-router";
import classnames from "classnames";
import styles from "./landing-nav.module.css";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#providers", label: "Providers" },
];

/** Floating glass marketing navbar for the landing page. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.wrap}>
      <nav className={classnames(styles.nav, { [styles.scrolled]: scrolled })}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <img src="/logo.png" alt="OmniBridge" className={styles.logoImg} />
          </span>
          Omni<span className={styles.logoAccent}>Bridge</span>
        </Link>

        <ul className={classnames(styles.links, { [styles.linksOpen]: menuOpen })}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={styles.link} onClick={closeMenu}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="https://github.com/Surya17155/omnibridge" target="_blank" rel="noopener noreferrer" className={styles.link} onClick={closeMenu}>
              Github
            </a>
          </li>
          <li className={styles.mobileCtaItem}>
            <Link to="/auth" className={styles.mobileCta} onClick={closeMenu}>
              Get started
            </Link>
          </li>
        </ul>

        <button
          className={classnames(styles.hamburger, { [styles.hamburgerOpen]: menuOpen })}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>

        <Link to="/auth" className={styles.cta}>
          <span>Get started</span>
          <span className={styles.ctaGlow} />
        </Link>
      </nav>
    </div>
  );
}
