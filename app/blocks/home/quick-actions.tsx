import { Link } from "react-router";
import { IconKey, IconBolt, IconFileText, IconSettings } from "@tabler/icons-react";
import styles from "./quick-actions.module.css";

const ACTIONS = [
  {
    to: "/dashboard/key-management",
    icon: IconKey,
    label: "Add New Key",
    desc: "Add an API key from any provider",
    color: "var(--color-primary-light)",
    iconColor: "var(--color-primary)",
  },
  {
    to: "/dashboard/proxy-configuration",
    icon: IconBolt,
    label: "Generate Unified Key",
    desc: "Create your Super API key",
    color: "var(--color-warning-light)",
    iconColor: "var(--color-warning)",
  },
  {
    to: "/dashboard/usage-logs",
    icon: IconFileText,
    label: "View Logs",
    desc: "Inspect recent request logs",
    color: "var(--color-info-light)",
    iconColor: "var(--color-info)",
  },
  {
    to: "/dashboard/settings",
    icon: IconSettings,
    label: "Settings",
    desc: "Configure rotation & preferences",
    color: "var(--color-success-light)",
    iconColor: "var(--color-success)",
  },
];

export function QuickActions() {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>Quick Actions</h2>
      <div className={styles.grid}>
        {ACTIONS.map(({ to, icon: Icon, label, desc, color, iconColor }) => (
          <Link key={to} to={to} className={styles.action}>
            <div className={styles.actionIcon} style={{ background: color }}>
              <Icon size={24} color={iconColor} />
            </div>
            <div>
              <div className={styles.actionLabel}>{label}</div>
              <div className={styles.actionDesc}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
