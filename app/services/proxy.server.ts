import { callProvider, PROVIDER_DEFAULT_MODEL, type ChatMessage, type LlmResponse, type ProviderName } from "./llm.server";
import { decideRouting, type RoutingDecision, type RoutingTarget } from "./routing.server";
import { getProviderKeys, updateProviderKeyUsage, type ProviderKey } from "./auth.server";
import { getProviderModels } from "~/data/provider-models";
import { insertRequestLog } from "./usage.server";
import { openaiErrorResponse } from "./proxy-auth.server";
import { SYSTEM_PERSONA } from "./persona";
import { buildCandidateKeys, isTransientUpstreamError } from "./key-picker.server";

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
  { provider: "Gemini", match: /^gemini/i },
  { provider: "OpenAI", match: /^gpt|^openai(?!\/)/i },
  { provider: "DeepSeek", match: /^deepseek/i },
  { provider: "Nvidia", match: /nvidia|nemotron/i },
  { provider: "Groq", match: /llama|groq|mixtral/i },
  { provider: "Mistral", match: /^mistral/i },
  { provider: "GLM", match: /^glm|^chatglm/i },
  { provider: "Kimi", match: /^moonshot|^kimi/i },
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

function openaiCompletion(args: {
  id: string;
  created: number;
  model: string;
  content: string;
  provider: ProviderName;
  reason: string;
  responseTime: number;
  keyLabel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
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
      prompt_tokens: args.promptTokens,
      completion_tokens: args.completionTokens,
      total_tokens: args.totalTokens,
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

  const candidates = buildCandidateKeys(allKeys, decision.target, available);
  if (candidates.length === 0) {
    return {
      ok: false,
      response: openaiErrorResponse(400, "invalid_request_error", `No usable keys for ${decision.target} (or any other configured provider).`, "no_usable_keys"),
    };
  }

  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);

  let lastError: string | undefined;
  for (const key of candidates) {
    const provider = providerOfKey(key);
    const providerModels = getProviderModels(provider);
    const skippedModels = new Set<string>();
    const initialModel = body.model && body.model !== "auto" ? body.model : decision.model;
    let modelToTry = initialModel;

    for (let attempt = 0; attempt <= providerModels.length; attempt++) {
      let response: LlmResponse;
      try {
        response = await callProvider(provider, key.key_value, [
          { role: "system", content: SYSTEM_PERSONA } as ChatMessage,
          ...body.messages,
        ], modelToTry);
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
        if (!tryNextModel(providerModels, skippedModels, modelToTry)) break;
        skippedModels.add(modelToTry ?? "");
        modelToTry = providerModels.find((m) => !skippedModels.has(m.id))?.id;
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
        if (response.tokens > 0) {
          await updateProviderKeyUsage(key.id, userId, response.tokens);
        }
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
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
            totalTokens: response.tokens,
          }),
        };
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

      if (isTransientUpstreamError(response)) {
        lastError = response.rateLimited
          ? `${provider} rate-limited: ${response.error}`
          : `${provider} failed (${response.status}): ${response.error}`;
        break;
      }

      if (!tryNextModel(providerModels, skippedModels, modelToTry)) {
        lastError = response.error || `${provider} request failed`;
        break;
      }
      skippedModels.add(modelToTry ?? "");
      modelToTry = providerModels.find((m) => !skippedModels.has(m.id))?.id;
    }
  }

  return {
    ok: false,
    response: openaiErrorResponse(502, "upstream_error", lastError || "All providers failed or rate-limited. Try again later.", "all_providers_failed"),
  };
}

function tryNextModel(
  models: { id: string }[],
  skipped: Set<string>,
  current: string | undefined
): boolean {
  return models.some((m) => !skipped.has(m.id) && m.id !== current);
}

export type { RoutingTarget };
