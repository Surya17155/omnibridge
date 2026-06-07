import { PROVIDERS, PROVIDER_COLORS, type Provider } from "~/data/mock-data";
import styles from "./provider-selection.module.css";
import classnames from "classnames";

export interface ProviderKey {
  id: number;
  provider: string;
  label: string;
  key_value: string;
  status: string;
  quota_remaining: number;
  quota_total: number;
  last_used: string | null;
  added_at: string | null;
  created_at: string;
}

interface ProviderSelectionProps {
  selected: Provider | "All";
  onChange: (p: Provider | "All") => void;
  keys: ProviderKey[];
}

export function ProviderSelection({ selected, onChange, keys }: ProviderSelectionProps) {
  const allCount = keys.length;

  return (
    <div className={styles.wrap}>
      <button
        className={classnames(styles.tab, { [styles.active]: selected === "All" })}
        onClick={() => onChange("All")}
      >
        All Providers
        <span className={selected === "All" ? styles.count : styles.countInactive}>{allCount}</span>
      </button>

      {PROVIDERS.map((provider) => {
        const count = keys.filter((k) => k.provider === provider).length;
        const isActive = selected === provider;
        return (
          <button
            key={provider}
            className={classnames(styles.tab, { [styles.active]: isActive })}
            onClick={() => onChange(provider)}
          >
            <span
              className={styles.dot}
              style={{ background: isActive ? "rgba(255,255,255,0.8)" : PROVIDER_COLORS[provider] }}
            />
            {provider}
            <span className={isActive ? styles.count : styles.countInactive}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}