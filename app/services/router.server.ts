import type { SubModel } from "~/data/provider-models";
import { getProviderModels } from "~/data/provider-models";
import { fetchNvidiaModels } from "~/services/nvidia.server";

const ROUTER_MODEL = "meta/llama-3.1-8b-instruct";

type RouterCategory = "fast" | "balanced" | "reasoning";

const CATEGORY_DESC = {
  fast: "simple Q&A, facts, definitions, summarization, quick responses",
  balanced: "general chat, explanations, creative writing, analysis, descriptions",
  reasoning: "code, math, logic, complex problems, debugging, step-by-step, algorithms",
};

/**
 * Route a message to the best model for the given provider.
 * Uses Nvidia's API (with the user's Nvidia key) to classify the query,
 * then picks the best model from the target provider's model list.
 */
export async function routeForProvider(
  message: string,
  provider: string,
  nvidiaApiKey: string
): Promise<{ modelId: string; reason: string }> {
  let models: SubModel[];
  if (provider === "Nvidia") {
    models = await fetchNvidiaModels(nvidiaApiKey);
  } else {
    models = getProviderModels(provider);
  }

  if (models.length === 0) {
    return { modelId: "", reason: "No models available for provider" };
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a classifier. Given a query, respond with one word: fast, balanced, or reasoning.
fast=${CATEGORY_DESC.fast}
balanced=${CATEGORY_DESC.balanced}
reasoning=${CATEGORY_DESC.reasoning}`,
          },
          { role: "user", content: `CLASSIFY: ${message}` },
        ],
        max_tokens: 5,
        temperature: 0.01,
      }),
    });

    if (!res.ok) {
      return fallbackRouting(message, models);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "";

    let category: RouterCategory = "balanced";
    if (raw.includes("fast")) category = "fast";
    else if (raw.includes("reasoning")) category = "reasoning";

    const matched = models.find((m) => m.category === category);
    if (matched) return { modelId: matched.id, reason: `Routed to ${provider} (${matched.label})` };

    const fallback = models.find((m) => m.category === "balanced") || models[0];
    return { modelId: fallback.id, reason: `Routed to ${provider} (${fallback.label})` };
  } catch {
    return fallbackRouting(message, models);
  }
}

function fallbackRouting(
  text: string,
  models: SubModel[]
): { modelId: string; reason: string } {
  const isFast = ["fast", "quick", "rapid", "brief", "short", "summary", "summarize", "simple", "tldr"].some((k) =>
    text.toLowerCase().includes(k)
  );
  const isReasoning = ["reason", "think", "analyze", "complex", "detailed", "explain", "why", "how", "step by step", "logic", "math", "code", "function", "python", "algorithm", "bug", "error", "fix"].some((k) =>
    text.toLowerCase().includes(k)
  );

  let category: RouterCategory = "balanced";
  if (isFast) category = "fast";
  else if (isReasoning) category = "reasoning";

  const matched = models.find((m) => m.category === category);
  if (matched) return { modelId: matched.id, reason: `Keyword fallback: matched ${category}` };

  const fallback = models.find((m) => m.category === "balanced") || models[0];
  return { modelId: fallback.id, reason: "Default fallback" };
}

/**
 * @deprecated Use routeForProvider instead.
 */
export async function routeWithLLM(
  message: string,
  models: SubModel[],
  apiKey: string
): Promise<{ modelId: string; reason: string }> {
  return routeForProvider(message, "Nvidia", apiKey);
}
