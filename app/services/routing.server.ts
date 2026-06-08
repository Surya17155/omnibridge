import { isVisionCapable, type ChatMessage, type ProviderName } from "./llm.server";
import { getProviderModels, type SubModel } from "~/data/provider-models";

export type RoutingTarget = ProviderName | "OmniBridge";

export type RoutingDecision = {
  target: RoutingTarget;
  reason: string;
  model?: string;
};

export const CODE_KEYWORDS = [
  "code",
  "function",
  "python",
  "javascript",
  "typescript",
  "react",
  "api",
  "bug",
  "error",
  "fix",
  "refactor",
  "algorithm",
  "sort",
  "async",
  "await",
  "class",
  "stack trace",
  "regex",
  "sql",
  "compile",
];

export const FAST_KEYWORDS = [
  "fast",
  "quick",
  "rapid",
  "brief",
  "short",
  "summary",
  "summarize",
  "simple",
  "one-liner",
  "tldr",
];

export const REASONING_KEYWORDS = [
  "reason",
  "think",
  "analyze",
  "complex",
  "detailed",
  "explain",
  "why",
  "how",
  "step by step",
  "logic",
];

function pickBestModel(provider: ProviderName, text: string): string {
  const models = getProviderModels(provider);
  if (models.length === 0) return "";

  const isFast = FAST_KEYWORDS.some((k) => text.includes(k));
  const isReasoning = REASONING_KEYWORDS.some((k) => text.includes(k)) || CODE_KEYWORDS.some((k) => text.includes(k));

  let category: SubModel["category"] = "balanced";
  if (isFast) category = "fast";
  else if (isReasoning) category = "reasoning";

  const preferred = models.find((m) => m.category === category);
  if (preferred) return preferred.id;

  const balanced = models.find((m) => m.category === "balanced");
  if (balanced) return balanced.id;

  return models[0].id;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasReasoningModel(provider: ProviderName): boolean {
  return getProviderModels(provider).some((m) => m.category === "reasoning");
}

function randomFromAvailable(
  available: ProviderName[],
  reason: string
): RoutingDecision {
  const pick = pickRandom(available);
  const model = getProviderModels(pick).length > 0 ? pickBestModel(pick, "") : "";
  return {
    target: pick,
    reason: `${reason} — randomly selected ${pick}${model ? ` (${model})` : ""}`,
    model: model || undefined,
  };
}

export function decideRouting(
  userMessage: ChatMessage,
  availableProviders: ProviderName[]
): RoutingDecision {
  const text = userMessage.content.toLowerCase();

  if (availableProviders.length === 0) {
    return { target: "OmniBridge", reason: "No provider keys available" };
  }

  if (userMessage.imageDataUrl) {
    const vision = availableProviders.filter((p) => isVisionCapable(p));
    if (vision.length > 0) {
      const pick = pickRandom(vision);
      return { target: pick, reason: `Image attached — routed to ${pick} (vision-capable)` };
    }
    return { target: "OmniBridge", reason: "Image attached but no vision provider available" };
  }

  const isCodeQuery = CODE_KEYWORDS.some((k) => text.includes(k));
  if (isCodeQuery && availableProviders.includes("DeepSeek")) {
    const model = pickBestModel("DeepSeek", text);
    return {
      target: "DeepSeek",
      reason: `Code-related query — routed to DeepSeek (${model})`,
      model,
    };
  }

  const isReasoningQuery = REASONING_KEYWORDS.some((k) => text.includes(k));
  const reasoningProviders = availableProviders.filter(hasReasoningModel);
  if (isReasoningQuery && reasoningProviders.length > 0) {
    return randomFromAvailable(
      reasoningProviders,
      "Reasoning-heavy query"
    );
  }

  const isFastQuery = FAST_KEYWORDS.some((k) => text.includes(k));
  if (isFastQuery) {
    return randomFromAvailable(
      availableProviders,
      "Speed-focused query"
    );
  }

  return randomFromAvailable(
    availableProviders,
    "General query"
  );
}
