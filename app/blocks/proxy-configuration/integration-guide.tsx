import { useState } from "react";
import classnames from "classnames";
import styles from "./integration-guide.module.css";

const TABS = ["Python", "JavaScript", "cURL", "LangChain"];

const DEFAULT_BASE_URL = "https://omnibridge-dev.vercel.app/api/v1";
const BASE_URL =
  (typeof window !== "undefined" && (window as any).__OMNIBRIDGE_BASE_URL__) || DEFAULT_BASE_URL;

const CODE: Record<string, string> = {
  Python: `from openai import OpenAI

client = OpenAI(
    api_key="obai_sk_live_YOUR_KEY",
    base_url="${BASE_URL}"
)

response = client.chat.completions.create(
    model="auto",  # OmniBridge selects best model
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
  JavaScript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "obai_sk_live_YOUR_KEY",
  baseURL: "${BASE_URL}",
});

const response = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);`,
  cURL: `curl ${BASE_URL}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer obai_sk_live_YOUR_KEY" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
  LangChain: `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="auto",
    openai_api_key="obai_sk_live_YOUR_KEY",
    openai_api_base="${BASE_URL}"
)

result = llm.invoke("Hello!")
print(result.content)`,
};

const STEPS = [
  { title: "Copy your Super API Key", content: "code" },
  { title: "Set the base URL", content: "url" },
  { title: "Use the code example below", content: "example" },
];

export function IntegrationGuide() {
  const [activeTab, setActiveTab] = useState("Python");

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>Integration Guide</h3>
      <p className={styles.subtitle}>Drop-in replacement for any OpenAI-compatible client</p>

      <div className={styles.stepList} style={{ marginBottom: "var(--space-6)" }}>
        <div className={styles.step}>
          <div className={styles.stepNum}>1</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Copy your Super API Key from above</div>
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepNum}>2</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Set the base URL in your client</div>
            <code className={styles.inlineCode}>{BASE_URL}</code>
          </div>
        </div>
        <div className={styles.step}>
          <div className={styles.stepNum}>3</div>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Use the code example for your language</div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={classnames(styles.tab, { [styles.active]: activeTab === tab })}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <pre className={styles.code}>{CODE[activeTab]}</pre>
    </div>
  );
}
