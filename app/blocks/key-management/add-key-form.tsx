import { useActionData, useNavigation } from "react-router";
import { Form } from "react-router";
import { IconPlus } from "@tabler/icons-react";
import { PROVIDERS, type Provider } from "~/data/mock-data";
import styles from "./add-key-form.module.css";

interface AddKeyFormProps {
  provider: Provider | "All";
}

export function AddKeyForm({ provider }: AddKeyFormProps) {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const loading = navigation.state === "submitting";

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Add New API Key</h3>
      {actionData?.error && <p className={styles.error}>{actionData.error}</p>}
      <Form className={styles.form} method="post">
        <input type="hidden" name="intent" value="add" />

        <div className={styles.group}>
          <label className={styles.label}>Provider *</label>
          {provider === "All" ? (
            <select className={styles.input} name="provider" required defaultValue="">
              <option value="" disabled>Select provider</option>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <>
              <input type="hidden" name="provider" value={provider} />
              <input className={styles.input} type="text" value={provider} readOnly />
            </>
          )}
        </div>

        <div className={styles.group}>
          <label className={styles.label}>API Key *</label>
          <input
            className={styles.input}
            type="text"
            name="apiKey"
            placeholder="Paste your API key here"
            required
          />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Label (optional)</label>
          <input
            className={styles.input}
            type="text"
            name="label"
            placeholder="e.g., Personal Account 1"
          />
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Quota Total (optional)</label>
          <input
            className={styles.input}
            type="number"
            name="quotaTotal"
            placeholder="1000"
            defaultValue="1000"
            min="1"
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          <IconPlus size={16} />
          {loading ? "Adding..." : "Add Key"}
        </button>
      </Form>
    </div>
  );
}