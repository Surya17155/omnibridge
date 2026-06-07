import { callProvider, PROVIDER_DEFAULT_MODEL, type ChatMessage, type LlmResponse, type ProviderName } from "./llm.server";
import { decideRouting, type RoutingDecision, type RoutingTarget } from "./routing.server";
import { getProviderKeys, type ProviderKey } from "./auth.server";
import { insertRequestLog } from "./usage.server";
import { openaiErrorResponse } from "./proxy-auth.server";

export type ProxyChatRequest = {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
};

export type ProxyChatResponse = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: "stop" | "length" | "content_filter";
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  x_omnibridge: {
    provider: ProviderName;
    routing_reason: string;
    response_time_ms: number;
    key_label: string;
  };
};

const PROVIDER_FROM_MODEL: Array<{ provider: ProviderName; match: RegExp }> = [
  { provider: "Gemini", match: /gemini/i },
  { provider: "OpenAI", match: /gpt|openai/i },
  { provider: "DeepSeek", match: /deepseek/i },
  { provider: "Groq", match: /llama|groq|mixtral/i },
  { provider: "Mistral", match: /mistral/i },
  { provider: "GLM", match: /glm|chatglm/i },
  { provider: "Kimi", match: /moonshot|kimi/i },
  { provider: "OpenRouter", match: /openrouter/i },
];

export function resolveExplicitModel(model: string): ProviderName | null {
  for (const m of PROVIDER_FROM_MODEL) {
    if (m.match.test(model)) return m.provider;
  }
  return null;
}

function providerOfKey(k: ProviderKey): ProviderName {
  return k.provider as ProviderName;
}

function pickKeyFor(keys: ProviderKey[], provider: ProviderName): ProviderKey | null {
  const candidates = keys.filter((k) => providerOfKey(k) === provider && k.status === "active");
  if (candidates.length === 0) return null;
  return candidates.reduce((best, k) => (k.quota_remaining > best.quota_remaining ? k : best));
}

function openaiCompletion(args: {
  id: string;
  created: number;
  model: string;
  content: string;
  provider: ProviderName;
  reason: string;
  responseTime: number;
  keyLabel: string;
  tokens: number;
}): ProxyChatResponse {
  return {
    id: args.id,
    object: "chat.completion",
    created: args.created,
    model: args.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: args.content },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: args.tokens,
      total_tokens: args.tokens,
    },
    x_omnibridge: {
      provider: args.provider,
      routing_reason: args.reason,
      response_time_ms: args.responseTime,
      key_label: args.keyLabel,
    },
  };
}

export type ProxyResult =
  | { ok: true; response: ProxyChatResponse; status: 200 }
  | { ok: false; response: Response };

export async function handleChatCompletion(userId: number, body: ProxyChatRequest, endpoint: string): Promise<ProxyResult> {
  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return {
      ok: false,
      response: openaiErrorResponse(400, "invalid_request_error", "messages array is required and must be non-empty", "missing_messages"),
    };
  }
  if (body.stream) {
    return {
      ok: false,
      response: openaiErrorResponse(501, "invalid_request_error", "Streaming is not yet supported. Set stream:false", "stream_unsupported"),
    };
  }

  const allKeys = await getProviderKeys(userId);
  const available = allKeys.map(providerOfKey);
  if (available.length === 0) {
    return {
      ok: false,
      response: openaiErrorResponse(400, "invalid_request_error", "No provider keys configured. Add a provider key in the dashboard first.", "no_provider_keys"),
    };
  }

  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return {
      ok: false,
      response: openaiErrorResponse(400, "invalid_request_error", "At least one user message is required", "no_user_message"),
    };
  }

  const explicit = body.model && body.model !== "auto" ? resolveExplicitModel(body.model) : null;

  let decision: RoutingDecision;
  if (explicit) {
    decision = { target: explicit, reason: `Explicit model: ${body.model}` };
  } else {
    decision = decideRouting(lastUser, available);
  }

  if (decision.target === "OmniBridge") {
    return {
      ok: false,
      response: openaiErrorResponse(400, "invalid_request_error", decision.reason, "no_route"),
    };
  }

  const candidateOrder: ProviderName[] = [decision.target];
  for (const p of available) {
    if (!candidateOrder.includes(p)) candidateOrder.push(p);
  }

  const id = `chatcmpl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const created = Math.floor(Date.now() / 1000);

  let lastError: string | null = null;
  for (const provider of candidateOrder) {
    const key = pickKeyFor(allKeys, provider);
    if (!key) continue;

    let response: LlmResponse;
    try {
      response = await callProvider(provider, key.key_value, body.messages);
    } catch (e: any) {
      lastError = e?.message || "Network error";
      await insertRequestLog({
        userId,
        provider,
        keyLabel: key.label,
        model: PROVIDER_DEFAULT_MODEL[provider],
        status: "error",
        responseTime: 0,
        tokens: 0,
        endpoint,
        errorMessage: lastError,
      });
      continue;
    }

    if (response.status >= 200 && response.status < 300) {
      await insertRequestLog({
        userId,
        provider,
        keyLabel: key.label,
        model: response.model,
        status: "success",
        responseTime: response.responseTime,
        tokens: response.tokens,
        endpoint,
      });
      return {
        ok: true,
        status: 200,
        response: openaiCompletion({
          id,
          created,
          model: response.model,
          content: response.text,
          provider,
          reason: decision.reason,
          responseTime: response.responseTime,
          keyLabel: key.label,
          tokens: response.tokens,
        }),
      };
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
        provider,
        keyLabel: key.label,
        model: response.model,
        status: response.rateLimited ? "rate-limited" : "error",
        responseTime: response.responseTime,
        tokens: 0,
        endpoint,
        errorMessage: response.error,
      });
      lastError = response.rateLimited
        ? `${provider} rate-limited: ${response.error}`
        : `${provider} auth failed (${response.status}): ${response.error}`;
      continue;
    }

    await insertRequestLog({
      userId,
      provider,
      keyLabel: key.label,
      model: response.model,
      status: "error",
      responseTime: response.responseTime,
      tokens: 0,
      endpoint,
      errorMessage: response.error,
    });
    return {
      ok: false,
      response: openaiErrorResponse(
        response.status || 502,
        "upstream_error",
        `${provider}: ${response.error || "request failed"}`,
        "upstream_error"
      ),
    };
  }

  return {
    ok: false,
    response: openaiErrorResponse(502, "upstream_error", lastError || "All providers failed or rate-limited. Try again later.", "all_providers_failed"),
  };
}
