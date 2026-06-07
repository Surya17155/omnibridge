import { useState } from "react";
import { useLoaderData, useActionData, useNavigation } from "react-router";
import { Form } from "react-router";
import { IconCopy, IconRefresh, IconEye, IconEyeOff, IconAlertTriangle, IconCheck, IconPlus } from "@tabler/icons-react";
import styles from "./unified-key-generator.module.css";
import type { OmniKey } from "~/services/auth.server";

export function UnifiedKeyGenerator() {
  const { omniKey, providerKeys } = useLoaderData<{ omniKey: OmniKey | null; providerKeys: any[] }>();
  const actionData = useActionData<{ error?: string; omniKey?: OmniKey }>();
  const navigation = useNavigation();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const loading = navigation.state === "submitting";

  const currentKey = actionData?.omniKey || omniKey;
  const displayKey = currentKey
    ? (revealed ? currentKey.key_value : currentKey.key_value.replace(/(?<=.{12})./g, "*"))
    : null;

  const handleCopy = async () => {
    if (!currentKey) return;
    await navigator.clipboard.writeText(currentKey.key_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showGenerate = !currentKey || providerKeys.length === 0;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.titleGroupTitle}>Super API Key</h3>
          <p className={styles.titleGroupSubtitle}>
            Your unified key that aggregates all provider keys
          </p>
        </div>
        {providerKeys.length === 0 ? (
          <span className={styles.badge} style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>
            <span className="status-dot status-dot-warning" />
            No Provider Keys
          </span>
        ) : currentKey ? (
          <span className={styles.badge}>
            <span className="status-dot status-dot-success" />
            Active
          </span>
        ) : (
          <span className={styles.badge} style={{ background: "var(--color-info-light)", color: "var(--color-info)" }}>
            <span className="status-dot status-dot-info" />
            Not Generated
          </span>
        )}
      </div>

      {actionData?.error && (
        <p className={styles.error}>{actionData.error}</p>
      )}

      {showGenerate ? (
        <div className={styles.generateState}>
          {providerKeys.length === 0 ? (
            <p className={styles.generateText}>
              Add at least one provider key in <strong>Key Management</strong> to generate your unified key.
            </p>
          ) : (
            <>
              <p className={styles.generateText}>
                Generate your Super API Key to start using OmniBridge as a unified proxy.
              </p>
              <Form method="post">
                <input type="hidden" name="intent" value="generate" />
                <button type="submit" className={styles.generateBtn} disabled={loading}>
                  <IconPlus size={16} />
                  {loading ? "Generating..." : "Generate Super Key"}
                </button>
              </Form>
            </>
          )}
        </div>
      ) : (
        <>
          <div className={styles.keyDisplay}>
            <span className={styles.keyText}>{displayKey}</span>
            <button className={styles.copyBtn} onClick={handleCopy} disabled={loading}>
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className={styles.actions}>
            <Form method="post">
              <input type="hidden" name="intent" value="regenerate" />
              <button type="submit" className={styles.regenBtn} disabled={loading}>
                <IconRefresh size={15} />
                {loading ? "Regenerating..." : "Regenerate Key"}
              </button>
            </Form>
            <button className={styles.viewBtn} onClick={() => setRevealed((r) => !r)} disabled={loading}>
              {revealed ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              {revealed ? "Hide Key" : "Reveal Key"}
            </button>
          </div>

          <p className={styles.warning}>
            <IconAlertTriangle size={14} />
            Treat this key as a password. Never share it publicly.
          </p>
        </>
      )}
    </div>
  );
}