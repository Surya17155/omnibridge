import { useState } from "react";
import { IconArrowsShuffle, IconTrophy, IconGitBranch } from "@tabler/icons-react";
import styles from "./routing-preferences.module.css";
import classnames from "classnames";

const STRATEGIES = [
  {
    id: "round-robin",
    icon: IconArrowsShuffle,
    name: "Round Robin",
    desc: "Distribute requests evenly across all active keys in sequence.",
  },
  {
    id: "quota-based",
    icon: IconTrophy,
    name: "Quota-Based",
    desc: "Prioritize keys with the most remaining quota to maximize availability.",
  },
  {
    id: "performance",
    icon: IconGitBranch,
    name: "Performance-Based",
    desc: "Route to the fastest responding provider based on recent latency data.",
  },
];

const SETTINGS = [
  { id: "fallback", name: "Auto Fallback", desc: "Switch provider on rate limit errors" },
  { id: "prioritize", name: "Model Priority", desc: "Prefer specific models when available" },
  { id: "logging", name: "Request Logging", desc: "Log all routed requests for audit" },
  { id: "retry", name: "Auto Retry", desc: "Retry failed requests up to 3 times" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={classnames(styles.toggle, on ? styles.on : styles.off)}
      onClick={onToggle}
      aria-pressed={on}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

export function RoutingPreferences() {
  const [strategy, setStrategy] = useState("round-robin");
  const [settings, setSettings] = useState<Record<string, boolean>>({ fallback: true, logging: true, retry: true, prioritize: false });

  const toggle = (id: string) => setSettings((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Routing Preferences</h3>
      <p className={styles.subtitle}>Configure how requests are distributed across your keys</p>

      <div className={styles.strategyGrid}>
        {STRATEGIES.map(({ id, icon: Icon, name, desc }) => (
          <div
            key={id}
            className={classnames(styles.strategyCard, { [styles.selected]: strategy === id })}
            onClick={() => setStrategy(id)}
          >
            <div className={styles.strategyIcon}><Icon size={20} /></div>
            <div className={styles.strategyName}>{name}</div>
            <div className={styles.strategyDesc}>{desc}</div>
          </div>
        ))}
      </div>

      <div className={styles.settingsGrid}>
        {SETTINGS.map(({ id, name, desc }) => (
          <div key={id} className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingName}>{name}</div>
              <div className={styles.settingDesc}>{desc}</div>
            </div>
            <Toggle on={!!settings[id]} onToggle={() => toggle(id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
