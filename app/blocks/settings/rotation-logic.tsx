import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import classnames from "classnames";
import { IconDeviceFloppy } from "@tabler/icons-react";
import styles from "./rotation-logic.module.css";

const STRATEGIES = [
  { id: "round-robin", name: "Round Robin", desc: "Cycle through all active keys in order, distributing load evenly." },
  { id: "quota-based", name: "Quota-Based", desc: "Always pick the key with the most remaining quota to maximize uptime." },
  { id: "performance", name: "Performance-Based", desc: "Route to the fastest responding key based on historical latency data." },
  { id: "priority", name: "Priority Order", desc: "Use keys in a custom priority order; fall back to next when exhausted." },
];

type Props = {
  strategy: string;
  maxRetries: number;
  quotaThreshold: number;
  cooldownSeconds: number;
  maxLatencyMs: number;
};

export function RotationLogic({ strategy, maxRetries, quotaThreshold, cooldownSeconds, maxLatencyMs }: Props) {
  const fetcher = useFetcher<{ ok: boolean; intent?: string; error?: string; message?: string }>();
  const [selected, setSelected] = useState(strategy);
  const [retries, setRetries] = useState(String(maxRetries));
  const [threshold, setThreshold] = useState(String(quotaThreshold));
  const [cooldown, setCooldown] = useState(String(cooldownSeconds));
  const [maxLatency, setMaxLatency] = useState(String(maxLatencyMs));

  useEffect(() => {
    setSelected(strategy);
    setRetries(String(maxRetries));
    setThreshold(String(quotaThreshold));
    setCooldown(String(cooldownSeconds));
    setMaxLatency(String(maxLatencyMs));
  }, [strategy, maxRetries, quotaThreshold, cooldownSeconds, maxLatencyMs]);

  const status = fetcher.data?.intent === "update-rotation" ? fetcher.data : null;
  const dirty =
    selected !== strategy ||
    retries !== String(maxRetries) ||
    threshold !== String(quotaThreshold) ||
    cooldown !== String(cooldownSeconds) ||
    maxLatency !== String(maxLatencyMs);

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Rotation Logic</h3>
      <p className={styles.subtitle}>Configure automatic key rotation behavior</p>

      <fetcher.Form method="post" onSubmit={(e) => {
        e.preventDefault();
        fetcher.submit(
          {
            intent: "update-rotation",
            strategy: selected,
            maxRetries: retries,
            quotaThreshold: threshold,
            cooldownSeconds: cooldown,
            maxLatencyMs: maxLatency,
          },
          { method: "post" }
        );
      }}>
        <div className={styles.strategyRow}>
          {STRATEGIES.map(({ id, name, desc }) => (
            <div
              key={id}
              className={classnames(styles.strategyOption, { [styles.selected]: selected === id })}
              onClick={() => setSelected(id)}
            >
              <div className={styles.radio}>
                {selected === id && <span className={styles.radioDot} />}
              </div>
              <div>
                <div className={styles.strategyName}>{name}</div>
                <div className={styles.strategyDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.rulesSection}>
          <div className={styles.rulesTitle}>Fallback Rules</div>
          <div className={styles.ruleGrid}>
            <div className={styles.ruleItem}>
              <label className={styles.ruleLabel}>Max Retries</label>
              <input className={styles.ruleInput} type="number" min={1} max={10} value={retries} onChange={(e) => setRetries(e.target.value)} />
            </div>
            <div className={styles.ruleItem}>
              <label className={styles.ruleLabel}>Quota Threshold (%)</label>
              <input className={styles.ruleInput} type="number" min={0} max={100} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
            </div>
            <div className={styles.ruleItem}>
              <label className={styles.ruleLabel}>Cooldown Period (seconds)</label>
              <input className={styles.ruleInput} type="number" min={0} value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
            </div>
            <div className={styles.ruleItem}>
              <label className={styles.ruleLabel}>Max Latency (ms)</label>
              <input className={styles.ruleInput} type="number" min={100} value={maxLatency} onChange={(e) => setMaxLatency(e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={!dirty || fetcher.state !== "idle"}>
            <IconDeviceFloppy size={15} />
            {fetcher.state !== "idle" ? "Saving..." : "Save Rotation Rules"}
          </button>
        </div>
        {status && (
          <p className={status.ok ? styles.success : styles.error}>
            {status.ok ? status.message : status.error}
          </p>
        )}
      </fetcher.Form>
    </div>
  );
}
