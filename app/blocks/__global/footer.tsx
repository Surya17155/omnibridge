import classnames from "classnames";
import { IconBolt } from "@tabler/icons-react";
import styles from "./footer.module.css";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={classnames(styles.footer, className)}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <IconBolt size={18} color="white" />
              </div>
              OmniBridge AI
            </div>
            <p>Unified proxy manager for AI APIs. Aggregate free-tier keys, automate rotation, and ensure uninterrupted service for your AI applications.</p>
          </div>

          <div className={styles.col}>
            <h4>Product</h4>
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/dashboard/key-management">Key Management</a></li>
              <li><a href="/dashboard/proxy-configuration">Proxy Config</a></li>
              <li><a href="/dashboard/usage-logs">Usage Logs</a></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">API Reference</a></li>
              <li><a href="#">Integration Guide</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Community</a></li>
              <li><a href="#">Status Page</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <span className={styles.copyright}>
            &copy; {new Date().getFullYear()} OmniBridge AI. All rights reserved.
          </span>
          <div className={styles.statusBadge}>
            <span className={styles.dot} />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
