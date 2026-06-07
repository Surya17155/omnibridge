export type Provider = "Gemini" | "DeepSeek" | "GLM" | "Kimi" | "Groq" | "Mistral" | "OpenRouter";

export type KeyStatus = "active" | "inactive" | "quota-exceeded";

export interface ApiKey {
  id: string;
  provider: Provider;
  label: string;
  key: string;
  status: KeyStatus;
  quotaRemaining: number;
  quotaTotal: number;
  lastUsed: string;
  addedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  provider: Provider;
  keyLabel: string;
  model: string;
  status: "success" | "error" | "rate-limited";
  responseTime: number;
  tokens: number;
  endpoint: string;
}

export const PROVIDERS: Provider[] = ["Gemini", "DeepSeek", "GLM", "Kimi", "Groq", "Mistral", "OpenRouter"];

export const PROVIDER_COLORS: Record<Provider, string> = {
  Gemini: "#4285F4",
  DeepSeek: "#00A8E0",
  GLM: "#FF6B35",
  Kimi: "#6366F1",
  Groq: "#22C55E",
  Mistral: "#F59E0B",
  OpenRouter: "#FF6B6B",
};

export const MOCK_KEYS: ApiKey[] = [
  { id: "k1", provider: "Gemini", label: "Personal Account 1", key: "AIza...Xk9p", status: "active", quotaRemaining: 820, quotaTotal: 1000, lastUsed: "2 min ago", addedAt: "2024-12-01" },
  { id: "k2", provider: "Gemini", label: "Work Account", key: "AIza...m3Qr", status: "active", quotaRemaining: 440, quotaTotal: 1000, lastUsed: "15 min ago", addedAt: "2024-12-05" },
  { id: "k3", provider: "Gemini", label: "Backup Key", key: "AIza...pL7z", status: "quota-exceeded", quotaRemaining: 0, quotaTotal: 1000, lastUsed: "1 hr ago", addedAt: "2024-12-10" },
  { id: "k4", provider: "DeepSeek", label: "Main Account", key: "sk-ds...8Hnk", status: "active", quotaRemaining: 670, quotaTotal: 1000, lastUsed: "5 min ago", addedAt: "2024-11-20" },
  { id: "k5", provider: "DeepSeek", label: "Secondary", key: "sk-ds...kX3p", status: "inactive", quotaRemaining: 200, quotaTotal: 1000, lastUsed: "3 days ago", addedAt: "2024-11-25" },
  { id: "k6", provider: "GLM", label: "GLM Pro Key", key: "glm-...9mRt", status: "active", quotaRemaining: 900, quotaTotal: 1000, lastUsed: "8 min ago", addedAt: "2024-12-02" },
  { id: "k7", provider: "Kimi", label: "Kimi API", key: "sk-ki...vB2n", status: "active", quotaRemaining: 560, quotaTotal: 1000, lastUsed: "22 min ago", addedAt: "2024-12-08" },
  { id: "k8", provider: "Groq", label: "Groq Fast", key: "gsk_...hJ4m", status: "active", quotaRemaining: 750, quotaTotal: 1000, lastUsed: "1 min ago", addedAt: "2024-12-12" },
  { id: "k9", provider: "Mistral", label: "Mistral Free", key: "mist...cP9q", status: "active", quotaRemaining: 390, quotaTotal: 1000, lastUsed: "33 min ago", addedAt: "2024-12-14" },
];

export interface DailyUsagePoint {
  day: string;
  requests: number;
  successRate: number;
}

/** Last 7 days of request volume with realistic week-shaped variance. */
export const WEEKLY_USAGE_TREND: DailyUsagePoint[] = [
  { day: "Mon", requests: 2180, successRate: 97.9 },
  { day: "Tue", requests: 2640, successRate: 98.6 },
  { day: "Wed", requests: 3120, successRate: 99.1 },
  { day: "Thu", requests: 2890, successRate: 98.2 },
  { day: "Fri", requests: 3460, successRate: 98.8 },
  { day: "Sat", requests: 1980, successRate: 99.3 },
  { day: "Sun", requests: 2162, successRate: 98.4 },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: "l1", timestamp: "2025-01-15 14:32:11", provider: "Gemini", keyLabel: "Personal Account 1", model: "gemini-2.0-flash", status: "success", responseTime: 312, tokens: 1843, endpoint: "/v1/chat/completions" },
  { id: "l2", timestamp: "2025-01-15 14:31:05", provider: "Groq", keyLabel: "Groq Fast", model: "llama-3.1-70b", status: "success", responseTime: 198, tokens: 2104, endpoint: "/v1/chat/completions" },
  { id: "l3", timestamp: "2025-01-15 14:30:42", provider: "Gemini", keyLabel: "Backup Key", model: "gemini-1.5-pro", status: "rate-limited", responseTime: 0, tokens: 0, endpoint: "/v1/chat/completions" },
  { id: "l4", timestamp: "2025-01-15 14:29:18", provider: "DeepSeek", keyLabel: "Main Account", model: "deepseek-chat", status: "success", responseTime: 445, tokens: 978, endpoint: "/v1/chat/completions" },
  { id: "l5", timestamp: "2025-01-15 14:28:55", provider: "GLM", keyLabel: "GLM Pro Key", model: "glm-4-flash", status: "success", responseTime: 289, tokens: 1567, endpoint: "/v1/chat/completions" },
  { id: "l6", timestamp: "2025-01-15 14:27:33", provider: "Kimi", keyLabel: "Kimi API", model: "moonshot-v1-8k", status: "error", responseTime: 112, tokens: 0, endpoint: "/v1/chat/completions" },
  { id: "l7", timestamp: "2025-01-15 14:26:01", provider: "Gemini", keyLabel: "Work Account", model: "gemini-2.0-flash", status: "success", responseTime: 334, tokens: 2341, endpoint: "/v1/chat/completions" },
  { id: "l8", timestamp: "2025-01-15 14:24:49", provider: "Mistral", keyLabel: "Mistral Free", model: "mistral-small", status: "success", responseTime: 521, tokens: 876, endpoint: "/v1/chat/completions" },
  { id: "l9", timestamp: "2025-01-15 14:23:22", provider: "Groq", keyLabel: "Groq Fast", model: "llama-3.1-70b", status: "success", responseTime: 201, tokens: 1934, endpoint: "/v1/chat/completions" },
  { id: "l10", timestamp: "2025-01-15 14:21:07", provider: "DeepSeek", keyLabel: "Main Account", model: "deepseek-coder", status: "success", responseTime: 388, tokens: 3102, endpoint: "/v1/chat/completions" },
];
