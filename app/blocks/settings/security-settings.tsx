import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import classnames from "classnames";
import styles from "./security-settings.module.css";

const SETTINGS = [
  { id: "encryption", name: "API Key Encryption", desc: "Encrypt all stored API keys at rest using AES-256", default: true },
  { id: "audit", name: "Audit Logging", desc: "Log all administrative actions for security review", default: true },
  { id: "rateLimit", name: "Rate Limiting", desc: "Limit incoming requests to prevent abuse of your proxy", default: false },
  { id: "2fa", name: "Two-Factor Authentication", desc: "Require 2FA for account login", default: false },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={classnames(styles.toggle, on ? styles.on : styles.off)} onClick={onToggle}>
      <span className={styles.toggleThumb} />
    </button>
  );
}

export function SecuritySettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, s.default]))
  );
  const [ipInput, setIpInput] = useState("");

  const toggle = (id: string) => setSettings((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Security Settings</h3>
      <p className={styles.subtitle}>Control access and protect your API keys</p>

      <div className={styles.settingsList}>
        {SETTINGS.map(({ id, name, desc }) => (
          <div key={id} className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.settingName}>{name}</div>
              <div className={styles.settingDesc}>{desc}</div>
            </div>
            <Toggle on={!!settings[id]} onToggle={() => toggle(id)} />
          </div>
        ))}
      </div>

      <div className={styles.ipSection}>
        <div className={styles.ipTitle}>IP Whitelist</div>
        <div className={styles.ipDesc}>Only allow requests from these IP addresses (leave empty to allow all)</div>
        <input
          className={styles.ipInput}
          type="text"
          placeholder="e.g., 192.168.1.1"
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
        />
        <br />
        <button className={styles.addIpBtn} onClick={() => { if (ipInput) { alert(`IP ${ipInput} added (demo)`); setIpInput(""); } }}>
          <IconPlus size={14} />
          Add IP Address
        </button>
      </div>
    </div>
  );
}
