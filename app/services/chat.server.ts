import { getOmniKey, getProviderKeys, updateProviderKeyUsage, type ProviderKey } from "./auth.server";
import { callProvider, type ChatMessage, type LlmResponse, type ProviderName } from "./llm.server";
import { decideRouting, type RoutingTarget } from "./routing.server";
import { getProviderModels } from "~/data/provider-models";
import { insertRequestLog } from "./usage.server";
import { SYSTEM_PERSONA } from "./persona";
import { buildCandidateKeys, isTransientUpstreamError } from "./key-picker.server";

export type ChatHistory = ChatMessage[];

const sessions = new Map<number, ChatHistory>();

export function getHistory(userId: number): ChatHistory {
  return sessions.get(userId) || [];
}

export function appendToHistory(userId: number, message: ChatMessage): void {
  const history = getHistory(userId);
  history.push(message);
  sessions.set(userId, history);
}

export function clearHistory(userId: number): void {
  sessions.delete(userId);
}

export type ChatRequest = {
  message: string;
  imageDataUrl?: string;
  imageMimeType?: string;
  source: "mine" | "unified";
  explicitProvider?: ProviderName | "OmniBridge";
  model?: string;
};

export type ChatResult = {
  reply: string;
  routedTo: ProviderName | "OmniBridge";
  routingReason: string;
  error?: string;
  model?: string;
};

function providerOfKey(k: ProviderKey): ProviderName {
  return k.provider as ProviderName;
}

export async function runChat(userId: number, req: ChatRequest): Promise<ChatResult> {
  const providerKeys = await getProviderKeys(userId);
  const availableProviders = providerKeys.map(providerOfKey);
  const omniKey = await getOmniKey(userId);

  if (req.source === "unified" && !omniKey) {
    return {
      reply: "",
      routedTo: "OmniBridge",
      routingReason: "No OmniBridge unified key generated",
      error: "Generate your unified key in Proxy Configuration first",
    };
  }

  if (req.source === "mine" && availableProviders.length === 0) {
    return {
      reply: "",
      routedTo: "OmniBridge",
      routingReason: "No provider keys added",
      error: "Add at least one provider key in Key Management first",
    };
  }

  const userMessage: ChatMessage = {
    role: "user",
    content: req.message,
    imageDataUrl: req.imageDataUrl,
    imageMimeType: req.imageMimeType,
  };
  appendToHistory(userId, userMessage);

  const history = getHistory(userId);
  const systemMessage: ChatMessage = { role: "system", content: SYSTEM_PERSONA };

  let firstTarget: ProviderName | "OmniBridge";
  let firstReason: string;
  let routingModel: string | undefined;

  if (req.explicitProvider && req.explicitProvider !== "OmniBridge") {
    firstTarget = req.explicitProvider;
    firstReason = `User selected ${req.explicitProvider} explicitly`;
  } else {
    const decision = decideRouting(userMessage, availableProviders);
    firstTarget = decision.target;
    firstReason = req.source === "unified" ? `OmniBridge → ${decision.reason}` : decision.reason;
    routingModel = decision.model;
    if (firstTarget === "OmniBridge") {
      if (availableProviders.length > 0) {
        firstTarget = availableProviders[0];
        firstReason = `${firstReason}; falling back to ${firstTarget}`;
      } else {
        return { reply: "", routedTo: firstTarget, routingReason: firstReason, error: "No provider key available" };
      }
    }
  }

  const candidates = buildCandidateKeys(
    providerKeys,
    firstTarget as ProviderName,
    availableProviders
  );
  if (candidates.length === 0) {
    return {
      reply: "",
      routedTo: firstTarget as ProviderName,
      routingReason: firstReason,
      error: `No usable provider keys configured`,
    };
  }

  let lastError: string | undefined;
  let currentReason = firstReason;
  for (const key of candidates) {
    const target = providerOfKey(key);
    if (target !== firstTarget && !currentReason.includes("→ auto-switched")) {
      currentReason = `${firstReason} → ${target} (auto-switched: ${lastError || "previous provider unavailable"})`;
    }
    const providerModels = getProviderModels(target);
    const skippedModels = new Set<string>();
    let modelToTry = req.model ?? routingModel;

    for (let attempt = 0; attempt <= providerModels.length; attempt++) {
      let response: LlmResponse;
      try {
        response = await callProvider(target, key.key_value, [systemMessage, ...history], modelToTry);
      } catch (e: any) {
        lastError = e?.message || "Network error";
        await insertRequestLog({
          userId,
          provider: target,
          keyLabel: key.label,
          model: responseModel(target),
          status: "error",
          responseTime: 0,
          tokens: 0,
          endpoint: "/dashboard/chat",
          errorMessage: lastError,
        });
        if (!tryNextModel(providerModels, skippedModels, modelToTry)) break;
        skippedModels.add(modelToTry ?? "");
        modelToTry = providerModels.find((m) => !skippedModels.has(m.id))?.id;
        continue;
      }

      if (response.status >= 200 && response.status < 300) {
        await insertRequestLog({
          userId,
          provider: target,
          keyLabel: key.label,
          model: response.model,
          status: "success",
          responseTime: response.responseTime,
          tokens: response.tokens,
          endpoint: "/dashboard/chat",
        });
        if (response.tokens > 0) {
          await updateProviderKeyUsage(key.id, userId, response.tokens);
        }
        appendToHistory(userId, { role: "assistant", content: response.text });
        return { reply: response.text, routedTo: target, routingReason: currentReason, model: response.model };
      }

      if (isTransientUpstreamError(response)) {
        await insertRequestLog({
          userId,
          provider: target,
          keyLabel: key.label,
          model: response.model,
          status: response.rateLimited ? "rate-limited" : "error",
          responseTime: response.responseTime,
          tokens: 0,
          endpoint: "/dashboard/chat",
          errorMessage: response.error,
        });
        lastError = response.rateLimited
          ? `${target} rate-limited: ${response.error}`
          : `${target} failed (${response.status}): ${response.error}`;
        break;
      }

      await insertRequestLog({
        userId,
        provider: target,
        keyLabel: key.label,
        model: response.model,
        status: "error",
        responseTime: response.responseTime,
        tokens: 0,
        endpoint: "/dashboard/chat",
        errorMessage: response.error,
      });

      if (!tryNextModel(providerModels, skippedModels, modelToTry)) {
        lastError = response.error || `${target} request failed`;
        break;
      }
      skippedModels.add(modelToTry ?? "");
      modelToTry = providerModels.find((m) => !skippedModels.has(m.id))?.id;
    }
  }

  return {
    reply: "",
    routedTo: firstTarget as ProviderName,
    routingReason: firstReason,
    error: lastError || "All providers failed or rate-limited",
  };
}

function responseModel(provider: ProviderName): string {
  switch (provider) {
    case "Gemini": return "gemini-2.0-flash";
    case "DeepSeek": return "deepseek-chat";
    case "Groq": return "llama-3.1-8b-instant";
    case "Mistral": return "mistral-small-latest";
    case "OpenAI": return "gpt-4o-mini";
    case "GLM": return "glm-4-flash";
    case "Kimi": return "moonshot-v1-8k";
    case "OpenRouter": return "openai/gpt-4o-mini";
    case "Nvidia": return "meta/llama-3.1-8b-instruct";
    case "GitHub": return "gpt-4o-mini";
    case "Cerebras": return "llama-3.3-70b";
    case "OpenCode": return "default";
    case "Cloudflare": return "@cf/meta/llama-3.1-8b-instruct";
    case "Cohere": return "command-r-plus-08-2024";
    case "ZAI": return "gpt-4o-mini";
    case "Kilo": return "gpt-4o-mini";
    case "Pollinations": return "openai";
  }
}

function tryNextModel(
  models: { id: string }[],
  skipped: Set<string>,
  current: string | undefined
): boolean {
  return models.some((m) => !skipped.has(m.id) && m.id !== current);
}

export type { RoutingTarget };
