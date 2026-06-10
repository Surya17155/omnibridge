import { useEffect, useRef, useState } from "react";
import { NavLink, Form } from "react-router";
import classnames from "classnames";
import {
  IconBolt,
  IconKey,
  IconSettings,
  IconFileText,
  IconNetwork,
  IconChevronDown,
  IconLogout,
  IconMessage,
  IconExternalLink,
} from "@tabler/icons-react";
import type { AuthUser } from "~/services/session.server";
import styles from "./navigation-bar.module.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: IconBolt, end: true },
  { to: "/dashboard/chat", label: "Chat", icon: IconMessage },
  { to: "/dashboard/key-management", label: "Key Management", icon: IconKey },
  { to: "/dashboard/proxy-configuration", label: "Proxy Config", icon: IconNetwork },
  { to: "/dashboard/usage-logs", label: "Usage Logs", icon: IconFileText },
];

interface NavigationBarProps {
  className?: string;
  user?: AuthUser | null;
}

export function NavigationBar({ className, user }: NavigationBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <nav className={classnames(styles.nav, className)}>
      <NavLink to="/" className={styles.logo}>
        <div className={styles.logoIcon}>
          <img src="/logo.png" alt="OmniBridge" className={styles.logoImg} />
        </div>
        <span className={styles.logoText}>
          Omni<span className={styles.logoAccent}>Bridge</span>
        </span>
      </NavLink>

      <ul className={styles.navLinks}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => classnames(styles.navLink, { [styles.active]: isActive })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      {user && (
        <div className={styles.userMenu} ref={menuRef}>
          <button
            type="button"
            className={styles.avatar}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={user.email}
          >
            <div className={styles.avatarCircle}>
              {(user.first_name?.charAt(0) ?? user.email.charAt(0)).toUpperCase()}
            </div>
            <span>{user.first_name || user.email}</span>
            <IconChevronDown
              size={14}
              className={classnames(styles.chevron, { [styles.chevronOpen]: menuOpen })}
            />
          </button>
          {menuOpen && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>
                  {(user.first_name?.charAt(0) ?? user.email.charAt(0)).toUpperCase()}
                </div>
                <div className={styles.dropdownInfo}>
                  <div className={styles.dropdownName}>{user.first_name || "User"}</div>
                  <div className={styles.dropdownEmail}>{user.email}</div>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <NavLink
                to="/dashboard/settings"
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <IconSettings size={16} />
                <span>Settings</span>
              </NavLink>
              <a
                href="https://www.linkedin.com/in/suryakant17155/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <IconExternalLink size={16} />
                <span>Contact Us</span>
              </a>
              <Form
                method="post"
                action="/logout"
                onSubmit={() => setMenuOpen(false)}
                className={styles.dropdownForm}
              >
                <button
                  type="submit"
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  role="menuitem"
                >
                  <IconLogout size={16} />
                  <span>Sign out</span>
                </button>
              </Form>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
