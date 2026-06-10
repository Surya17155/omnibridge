import { useState } from "react";
import { useLoaderData } from "react-router";
import { IconCopy, IconCheck, IconChevronDown } from "@tabler/icons-react";
import { PROVIDER_SUB_MODELS } from "~/data/provider-models";
import styles from "./endpoint-configuration.module.css";

const DEFAULT_BASE_URL = "https://omnibridge-dev.vercel.app/api/v1";
const BASE_URL =
  (typeof window !== "undefined" && (window as any).__OMNIBRIDGE_BASE_URL__) || DEFAULT_BASE_URL;

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  Gemini: "Gemini (Google)",
  DeepSeek: "DeepSeek",
  Groq: "Groq",
  Mistral: "Mistral AI",
  OpenAI: "OpenAI",
  GLM: "GLM (Zhipu AI)",
  Kimi: "Kimi (Moonshot AI)",
  OpenRouter: "OpenRouter",
  Nvidia: "NVIDIA",
  GitHub: "GitHub Models",
  Cerebras: "Cerebras Systems",
  OpenCode: "OpenCode",
  Cloudflare: "Cloudflare Workers AI",
  Cohere: "Cohere",
  ZAI: "Z.AI",
  Kilo: "Kilo Chat",
  Pollinations: "Pollinations AI",
};

const ENDPOINTS = [
  { method: "POST", path: "/chat/completions" },
  { method: "GET", path: "/models" },
];

export function EndpointConfiguration() {
  const { providerKeys } = useLoaderData<{ providerKeys: { provider: string }[] }>();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [modelCopied, setModelCopied] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const configuredProviders = providerKeys
    .map((k) => k.provider)
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .filter((p) => PROVIDER_SUB_MODELS[p]?.length > 0);

  const handleCopy = async (url: string, idx: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleModelCopy = async (modelId: string) => {
    await navigator.clipboard.writeText(`omnibridge/${modelId}`);
    setModelCopied(modelId);
    setTimeout(() => setModelCopied(null), 2000);
  };

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Endpoint Configuration</h3>
          <p className={styles.subtitle}>Use these endpoints in your AI applications and frameworks</p>
        </div>
      </div>

      <div className={styles.endpointList}>
        {ENDPOINTS.map((ep, idx) => (
          <div key={ep.path} className={styles.endpointRow}>
            <span className={styles.methodTag}>{ep.method}</span>
            <span className={styles.url}>{BASE_URL}{ep.path}</span>
            <button className={styles.copyBtn} onClick={() => handleCopy(BASE_URL + ep.path, idx)}>
              {copiedIdx === idx ? <IconCheck size={14} /> : <IconCopy size={14} />}
              {copiedIdx === idx ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Provider ID</div>
          <div className={styles.infoValue}>omnibridge</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Display Name</div>
          <div className={styles.infoValue}>OmniBridge API</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Base URL</div>
          <div className={styles.infoValue}>{BASE_URL}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Protocol</div>
          <div className={styles.infoValue}>OpenAI Compatible</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Auth Header</div>
          <div className={styles.infoValue}>Authorization: Bearer &lt;key&gt;</div>
        </div>
      </div>

      <div className={styles.modelSection}>
        <div className={styles.modelSectionHeader}>
          <div>
            <h4 className={styles.modelSectionTitle}>Model ID</h4>
            <p className={styles.modelSectionSubtitle}>
              Copy model IDs in <code className={styles.inlineCode}>omnibridge/&lt;model&gt;</code> format for use with your AI client
            </p>
          </div>
        </div>

        <div className={styles.providerGrid}>
          {configuredProviders.length === 0 && (
            <p className={styles.emptyState}>
              No provider keys configured. Add keys in Key Management to see available models.
            </p>
          )}

          {configuredProviders.map((provider) => {
            const models = PROVIDER_SUB_MODELS[provider] || [];
            const isOpen = expandedProvider === provider;

            return (
              <div key={provider} className={`${styles.providerCard} ${isOpen ? styles.providerCardOpen : ""}`}>
                <button
                  className={styles.providerTrigger}
                  onClick={() => setExpandedProvider(isOpen ? null : provider)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.providerInfo}>
                    <div className={styles.providerId}>{provider}</div>
                    <div className={styles.providerDisplay}>{PROVIDER_DISPLAY_NAMES[provider] || provider}</div>
                  </div>
                  <div className={`${styles.chevronWrap} ${isOpen ? styles.chevronOpen : ""}`}>
                    <IconChevronDown size={18} />
                  </div>
                </button>

                <div className={`${styles.modelList} ${isOpen ? styles.modelListOpen : ""}`}>
                  <div className={styles.modelListInner}>
                    {models.map((m) => (
                      <div key={m.id} className={styles.modelRow}>
                        <div className={styles.modelInfo}>
                          <span className={styles.modelLabel}>{m.label}</span>
                          <span className={styles.modelId}>omnibridge/{m.id}</span>
                        </div>
                        <button
                          className={styles.modelCopyBtn}
                          onClick={() => handleModelCopy(m.id)}
                        >
                          {modelCopied === m.id ? <IconCheck size={14} /> : <IconCopy size={14} />}
                          {modelCopied === m.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
