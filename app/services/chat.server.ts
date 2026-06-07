import { getOmniKey, getProviderKeys, type ProviderKey } from "./auth.server";
import { callProvider, type ChatMessage, type LlmResponse, type ProviderName } from "./llm.server";
import { decideRouting, type RoutingTarget } from "./routing.server";
import { insertRequestLog } from "./usage.server";

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
};

export type ChatResult = {
  reply: string;
  routedTo: ProviderName | "OmniBridge";
  routingReason: string;
  error?: string;
};

function providerOfKey(k: ProviderKey): ProviderName {
  return k.provider as ProviderName;
}

function pickKey(keys: ProviderKey[], provider: ProviderName): ProviderKey | null {
  const candidates = keys.filter((k) => providerOfKey(k) === provider && k.status === "active");
  if (!candidates.length) return null;
  return candidates.reduce((best, k) => (k.quota_remaining > best.quota_remaining ? k : best));
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

  let firstTarget: ProviderName | "OmniBridge";
  let firstReason: string;

  if (req.explicitProvider && req.explicitProvider !== "OmniBridge") {
    firstTarget = req.explicitProvider;
    firstReason = `User selected ${req.explicitProvider} explicitly`;
  } else {
    const decision = decideRouting(userMessage, availableProviders);
    firstTarget = decision.target;
    firstReason = req.source === "unified" ? `OmniBridge → ${decision.reason}` : decision.reason;
    if (firstTarget === "OmniBridge") {
      if (availableProviders.length > 0) {
        firstTarget = availableProviders[0];
        firstReason = `${firstReason}; falling back to ${firstTarget}`;
      } else {
        return { reply: "", routedTo: firstTarget, routingReason: firstReason, error: "No provider key available" };
      }
    }
  }

  const order: ProviderName[] = [firstTarget as ProviderName];
  for (const p of availableProviders) {
    if (!order.includes(p)) order.push(p);
  }

  let lastError: string | null = null;
  for (const target of order) {
    const key = pickKey(providerKeys, target);
    if (!key) continue;

    let response: LlmResponse;
    try {
      response = await callProvider(target, key.key_value, history);
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
      appendToHistory(userId, { role: "assistant", content: response.text });
      return { reply: response.text, routedTo: target, routingReason: firstReason };
    }

    const msg = (response.error || "").toLowerCase();
    const looksLikeAuthFail =
      response.rateLimited ||
      response.status === 401 ||
      response.status === 403 ||
      (response.status >= 400 && response.status < 500 && (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("authentication")));

    if (looksLikeAuthFail) {
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
        : `${target} auth failed (${response.status}): ${response.error}`;
      continue;
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
    return {
      reply: "",
      routedTo: target,
      routingReason: firstReason,
      error: response.error || `${target} request failed`,
    };
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
  }
}

export type { RoutingTarget };
