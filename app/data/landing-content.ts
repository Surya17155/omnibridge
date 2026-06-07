import {
  IconKey,
  IconRefresh,
  IconShieldLock,
  IconChartBar,
  IconBolt,
  IconRouteAltLeft,
  type Icon,
} from "@tabler/icons-react";

export interface FeatureItem {
  icon: Icon;
  title: string;
  description: string;
}

/** Core product capabilities surfaced in the landing features grid. */
export const FEATURES: FeatureItem[] = [
  {
    icon: IconKey,
    title: "Unified API Key",
    description:
      "Pool dozens of free-tier provider keys behind a single OmniBridge key. Point your app at one endpoint and forget the rest.",
  },
  {
    icon: IconRefresh,
    title: "Automatic Rotation",
    description:
      "When a key hits its quota, OmniBridge instantly rotates to the next healthy key — zero downtime, zero manual swaps.",
  },
  {
    icon: IconRouteAltLeft,
    title: "Smart Routing",
    description:
      "Route by latency, cost, or provider preference. OmniBridge picks the fastest healthy path for every single request.",
  },
  {
    icon: IconChartBar,
    title: "Live Usage Analytics",
    description:
      "Track requests, tokens, success rates, and quota burn across every provider from one real-time dashboard.",
  },
  {
    icon: IconShieldLock,
    title: "Secure by Design",
    description:
      "Keys are encrypted at rest and never exposed to clients. Your apps only ever see the unified bridge key.",
  },
  {
    icon: IconBolt,
    title: "Drop-in Compatible",
    description:
      "OpenAI-compatible endpoints mean you swap one base URL and keep your existing SDKs and code untouched.",
  },
];

export interface ProviderBadge {
  name: string;
  color: string;
}

/** Provider chips shown in the scrolling marquee. */
export const PROVIDER_BADGES: ProviderBadge[] = [
  { name: "Gemini", color: "#4285F4" },
  { name: "Groq", color: "#22C55E" },
  { name: "DeepSeek", color: "#00A8E0" },
  { name: "GLM", color: "#FF6B35" },
  { name: "Kimi", color: "#6366F1" },
  { name: "Mistral", color: "#F59E0B" },
];

export interface StepItem {
  index: string;
  title: string;
  description: string;
}

/** Three-step "how it works" scroll story. */
export const STEPS: StepItem[] = [
  {
    index: "01",
    title: "Add your keys",
    description:
      "Paste in your free-tier keys from Gemini, Groq, DeepSeek and more. Label them, group them, and let OmniBridge track every quota.",
  },
  {
    index: "02",
    title: "Generate one bridge key",
    description:
      "OmniBridge fuses them into a single unified key with an OpenAI-compatible endpoint you can drop into any SDK.",
  },
  {
    index: "03",
    title: "Ship without limits",
    description:
      "Requests auto-route and auto-rotate across healthy keys. When one runs dry, the next takes over — invisibly.",
  },
];

export interface StatItem {
  value: string;
  label: string;
}

/** Headline numbers in the stats band. */
export const STATS: StatItem[] = [
  { value: "6+", label: "AI providers unified" },
  { value: "99.9%", label: "Request success rate" },
  { value: "0ms", label: "Failover switch time" },
  { value: "1", label: "Key to rule them all" },
];
