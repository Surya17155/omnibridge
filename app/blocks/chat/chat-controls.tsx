import { useState } from "react";
import { IconChevronDown, IconKey, IconSparkles, IconBolt, IconEye } from "@tabler/icons-react";
import styles from "./chat-controls.module.css";

export type ModelOption = {
  id: string;
  label: string;
  vision: boolean;
};

interface ChatControlsProps {
  availableModels: ModelOption[];
  hasOmniKey: boolean;
  source: "mine" | "unified";
  model: string;
  isVision: boolean;
  onSourceChange: (source: "mine" | "unified") => void;
  onModelChange: (model: string) => void;
}

export function ChatControls({
  availableModels,
  hasOmniKey,
  source,
  model,
  isVision,
  onSourceChange,
  onModelChange,
}: ChatControlsProps) {
  const [open, setOpen] = useState(false);

  const options: ModelOption[] = [
    ...(source === "unified" && hasOmniKey
      ? [{ id: "OmniBridge", label: "OmniBridge (Smart Routing)", vision: true }]
      : []),
    ...availableModels.map((m) => ({ ...m, label: `${m.id}${m.vision ? " · Vision" : ""}` })),
  ];

  const current = options.find((o) => o.id === model) || options[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.sourceToggle}>
        <button
          type="button"
          className={`${styles.sourceBtn} ${source === "mine" ? styles.sourceActive : ""}`}
          onClick={() => onSourceChange("mine")}
          disabled={availableModels.length === 0}
        >
          <IconKey size={14} />
          My Keys
        </button>
        <button
          type="button"
          className={`${styles.sourceBtn} ${source === "unified" ? styles.sourceActive : ""}`}
          onClick={() => onSourceChange("unified")}
          disabled={!hasOmniKey}
          title={!hasOmniKey ? "Generate a unified key in Proxy Configuration first" : undefined}
        >
          <IconBolt size={14} />
          Unified Key
        </button>
      </div>

      <div className={styles.modelDropdown}>
        <button
          type="button"
          className={styles.modelBtn}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {current?.id === "OmniBridge" ? <IconSparkles size={14} /> : isVision ? <IconEye size={14} /> : null}
          <span>{current?.label || "Select model"}</span>
          <IconChevronDown size={14} />
        </button>
        {open && (
          <>
            <div className={styles.backdrop} onClick={() => setOpen(false)} />
            <ul className={styles.menu}>
              {options.length === 0 && (
                <li className={styles.empty}>
                  {source === "unified"
                    ? "Generate a unified key first"
                    : "Add a provider key first"}
                </li>
              )}
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className={`${styles.menuItem} ${o.id === model ? styles.menuItemActive : ""}`}
                    onClick={() => {
                      onModelChange(o.id);
                      setOpen(false);
                    }}
                  >
                    {o.id === "OmniBridge" ? <IconSparkles size={14} /> : isVisionForModel(o.id) ? <IconEye size={14} /> : <IconBolt size={14} />}
                    <span>{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function isVisionForModel(id: string): boolean {
  return id === "Gemini" || id === "OpenAI";
}
