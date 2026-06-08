import { useState, useMemo, useCallback, useEffect } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconKey,
  IconSparkles,
  IconBolt,
  IconEye,
  IconBrain,
} from "@tabler/icons-react";
import styles from "./chat-controls.module.css";
import { getProviderModels, hasSubModels, type SubModel } from "~/data/provider-models";

export type ModelOption = {
  id: string;
  label: string;
  vision: boolean;
  subModels?: SubModel[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const options: ModelOption[] = useMemo(() => {
    const base: ModelOption[] = [
      ...(source === "unified" && hasOmniKey
        ? [{ id: "OmniBridge", label: "OmniBridge (Smart Routing)", vision: true }]
        : []),
    ];

    if (source === "unified") return base;

    const withSubModels = availableModels.map((m) => {
      if (hasSubModels(m.id) || m.id === "Nvidia") {
        let subModels = (m.id === "Nvidia" ? m.subModels : getProviderModels(m.id)) || [];
        return {
          ...m,
          label: `${m.id}${m.vision ? " · Vision" : ""}`,
          subModels,
        };
      }
      return { ...m, label: `${m.id}${m.vision ? " · Vision" : ""}` };
    });

    return [...base, ...withSubModels];
  }, [availableModels, source, hasOmniKey]);

  // Strip provider|| prefix for display matching
  const displayModel = model.includes("||") ? model.split("||")[1] : model;

  const current = useMemo(() => {
    const directMatch = options.find((o) => o.id === displayModel);
    if (directMatch) return directMatch;
    const parent = options.find((o) => o.subModels?.some((sm) => sm.id === displayModel));
    return parent || options[0];
  }, [options, displayModel]);

  const currentLabel = useMemo(() => {
    if (!current) return "Select model";
    if (current.id === displayModel) return current.label;
    const sm = current.subModels?.find((m) => m.id === displayModel);
    return sm?.label || current.label;
  }, [current, displayModel]);

  const handleModelSelect = useCallback(
    (modelId: string) => {
      onModelChange(modelId);
      setOpen(false);
      setExpandedId(null);
    },
    [onModelChange]
  );

  const handleExpandClick = useCallback((providerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedId((prev) => (prev === providerId ? null : providerId));
  }, []);

  useEffect(() => {
    if (!open) {
      setExpandedId(null);
    }
  }, [open]);

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
          {current?.id === "OmniBridge" ? (
            <IconSparkles size={14} />
          ) : current?.subModels ? (
            <IconBrain size={14} />
          ) : isVision ? (
            <IconEye size={14} />
          ) : (
            <IconBolt size={14} />
          )}
          <span className={styles.modelBtnLabel}>{currentLabel}</span>
          <IconChevronDown size={14} />
        </button>
        {open && (
          <>
            <div
              className={styles.backdrop}
              onClick={() => {
                setOpen(false);
                setExpandedId(null);
              }}
            />
            <ul className={styles.menu}>
              {options.length === 0 && (
                <li className={styles.empty}>
                  {source === "unified"
                    ? "Generate a unified key first"
                    : "Add a provider key first"}
                </li>
              )}
              {options.map((o) => {
                const isExpanded = expandedId === o.id;
                const hasSubs = !!o.subModels;
                const isActive = o.id === model || o.subModels?.some((sm) => sm.id === model);
                return (
                  <li
                    key={o.id}
                    className={`${styles.menuItemWrapper} ${hasSubs ? styles.menuItemWrapperWithSubs : ""}`}
                  >
                    <div
                      className={`${styles.menuItemRow} ${isActive ? styles.menuItemActive : ""}`}
                      onClick={() => handleModelSelect(o.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleModelSelect(o.id);
                        }
                      }}
                    >
                      <span className={styles.menuItemIcon}>
                        {o.id === "OmniBridge" ? (
                          <IconSparkles size={14} />
                        ) : hasSubs ? (
                          <IconBrain size={14} />
                        ) : isVisionForModel(o.id) ? (
                          <IconEye size={14} />
                        ) : (
                          <IconBolt size={14} />
                        )}
                      </span>
                      <span className={styles.menuItemLabel}>{o.label}</span>
                      {hasSubs && (
                        <span
                          className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnOpen : ""}`}
                          onClick={(e) => handleExpandClick(o.id, e)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              handleExpandClick(o.id, e as unknown as React.MouseEvent);
                            }
                          }}
                        >
                          <IconChevronRight size={12} />
                        </span>
                      )}
                    </div>
                    {hasSubs && isExpanded && (
                      <ul className={styles.subList}>
                        {o.subModels!.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              className={`${styles.subItem} ${m.id === displayModel ? styles.subItemActive : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModelSelect(`${o.id}||${m.id}`);
                              }}
                            >
                              <span className={styles.subItemInfo}>
                                <span className={styles.subItemLabel}>{m.label}</span>
                                <span className={styles.subItemMeta}>
                                  {m.category.charAt(0).toUpperCase() + m.category.slice(1)}
                                </span>
                              </span>
                              {m.free && <span className={styles.freeBadge}>Free</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
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
