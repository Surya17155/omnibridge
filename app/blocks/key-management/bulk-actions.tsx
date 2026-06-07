import { IconUpload, IconClipboard } from "@tabler/icons-react";
import styles from "./bulk-actions.module.css";

export function BulkActions() {
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Bulk Import</h3>
      <p className={styles.subtitle}>Add multiple API keys at once via paste or CSV upload</p>

      <div className={styles.options}>
        <div className={styles.option}>
          <div className={styles.optionTitle}>
            <IconClipboard size={14} style={{ display: "inline", marginRight: 6 }} />
            Paste Multiple Keys
          </div>
          <p className={styles.optionDesc}>
            Paste one API key per line. Optionally add a label separated by a comma (e.g. key,My Label).
          </p>
          <textarea
            className={styles.textarea}
            placeholder={"AIza...key1,Account 1\nAIza...key2,Account 2\nAIza...key3"}
          />
          <button className={styles.btn}>
            <IconClipboard size={15} />
            Import Pasted Keys
          </button>
        </div>

        <div className={styles.option}>
          <div className={styles.optionTitle}>
            <IconUpload size={14} style={{ display: "inline", marginRight: 6 }} />
            Upload CSV File
          </div>
          <p className={styles.optionDesc}>
            Upload a CSV file with columns: <code>api_key</code> and optionally <code>label</code>.
          </p>
          <div className={styles.fileUpload}>
            <IconUpload size={24} />
            <span>Click to upload or drag &amp; drop</span>
            <span style={{ fontSize: "var(--text-xs)" }}>CSV files only, max 1MB</span>
          </div>
          <button className={styles.btn}>
            <IconUpload size={15} />
            Upload CSV
          </button>
        </div>
      </div>
    </div>
  );
}
