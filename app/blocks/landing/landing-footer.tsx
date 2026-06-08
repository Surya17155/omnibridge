import { Link } from "react-router";

import styles from "./landing-footer.module.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/dashboard/key-management", label: "Key Management" },
  { to: "/dashboard/proxy-configuration", label: "Proxy Config" },
  { to: "/dashboard/usage-logs", label: "Usage Logs" },
];

/** Minimal landing-page footer. */
export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logoIcon}>
            <img src="/logo.png" alt="OmniBridge" className={styles.logoImg} />
          </span>
          OmniBridge AI
        </Link>

        <nav className={styles.links}>
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.status}>
          <span className={styles.dot} />
          All systems operational
        </div>
      </div>
      <p className={styles.copy}>&copy; {new Date().getFullYear()} OmniBridge AI. All rights reserved.</p>
    </footer>
  );
}
