import type { SubModel } from "~/data/provider-models";

const CHAT_MODEL_EXCLUDE = [
  "embed", "reward", "guard", "safety", "detector",
  "retriever", "translate", "clip", "deplot", "fuyu", "kosmos",
  "vila", "neva", "nvcf", "gliner", "bge", "arctic-embed",
  "calibration", "nv-embed", "nv-embedcode", "nv-embedqa",
  "nemoretriever", "riva", "starcoder", "cosmos", "parse",
];

function isChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (CHAT_MODEL_EXCLUDE.some((kw) => lower.includes(kw))) return false;
  return true;
}

function categorizeModel(id: string): SubModel["category"] {
  const lower = id.toLowerCase();
  if (lower.includes("fast") || lower.includes("mini") || lower.includes("small") || lower.includes("8b") || lower.includes("2b") || lower.includes("4b") || lower.includes("1b")) return "fast";
  if (lower.includes("reason") || lower.includes("think") || lower.includes("ultra") || lower.includes("large") || lower.includes("122b") || lower.includes("340b") || lower.includes("397b") || lower.includes("405b") || lower.includes("480b") || lower.includes("70b") || lower.includes("90b") || lower.includes("120b") || lower.includes("675b") || lower.includes("253b") || lower.includes("119b") || lower.includes("128b") || lower.includes("550b")) return "reasoning";
  return "balanced";
}

function modelLabel(id: string): string {
  const parts = id.split("/");
  const publisher = parts[0] || "";
  const name = parts[1] || id;
  const readable = name
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Instruct/g, "")
    .trim();
  const pubMap: Record<string, string> = {
    meta: "Meta",
    mistralai: "Mistral",
    microsoft: "Microsoft",
    google: "Google",
    nvidia: "Nvidia",
    deepseek: "DeepSeek",
    qwen: "Qwen",
    bytedance: "ByteDance",
    abacusai: "AbacusAI",
    "01-ai": "01.AI",
    writer: "Writer",
    ai21labs: "AI21",
    ibm: "IBM",
    upstage: "Upstage",
    minimaxai: "MiniMax",
    sarvamai: "Sarvam",
    stockmark: "Stockmark",
    zyphra: "Zyphra",
    stepfun: "StepFun",
    moonshotai: "Moonshot",
    bigcode: "BigCode",
    aisingapore: "AI Singapore",
    databricks: "Databricks",
    snowflake: "Snowflake",
    "z-ai": "Z.AI",
    "nv-mistralai": "Nvidia+Mistral",
    "openai": "OpenAI",
    adept: "Adept",
  };
  const pub = pubMap[publisher] || publisher;
  return `${readable} (${pub})`;
}

type NvidiaModelResponse = {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
};

let modelsCache: {
  models: SubModel[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000;

export async function fetchNvidiaModels(apiKey: string): Promise<SubModel[]> {
  if (modelsCache && Date.now() - modelsCache.timestamp < CACHE_TTL) {
    return modelsCache.models;
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return [];

    const data: NvidiaModelResponse = await res.json();
    const models = (data.data || [])
      .filter((m) => isChatModel(m.id))
      .map((m) => ({
        id: m.id,
        label: modelLabel(m.id),
        free: true,
        category: categorizeModel(m.id) as SubModel["category"],
      }));

    modelsCache = { models, timestamp: Date.now() };
    return models;
  } catch {
    return [];
  }
}
