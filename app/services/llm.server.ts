export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  imageDataUrl?: string;
  imageMimeType?: string;
};

export type LlmResponse = {
  text: string;
  provider: string;
  model: string;
  status: number;
  responseTime: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  rateLimited: boolean;
  error?: string;
};

export type ProviderName =
  | "Gemini"
  | "DeepSeek"
  | "Groq"
  | "Mistral"
  | "OpenAI"
  | "GLM"
  | "Kimi"
  | "OpenRouter"
  | "Nvidia"
  | "GitHub"
  | "Cerebras"
  | "OpenCode"
  | "Cloudflare"
  | "Cohere"
  | "ZAI"
  | "Kilo"
  | "Pollinations";

const VISION_CAPABLE: ProviderName[] = ["Gemini", "OpenAI", "GitHub", "Cloudflare", "Cohere", "ZAI"];

export function isVisionCapable(provider: ProviderName): boolean {
  return VISION_CAPABLE.includes(provider);
}

function stripImageData(dataUrl: string): { mime: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { mime: "image/png", data: dataUrl };
  return { mime: match[1], data: match[2] };
}

function empty(provider: string, model: string, error: string, status: number, responseTime: number, rateLimited = false): LlmResponse {
  return { text: "", provider, model, status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited, error };
}

type TokenCounts = { prompt: number; completion: number; total: number };

function extractOpenAITokens(data: any): TokenCounts {
  if (!data?.usage) return { prompt: 0, completion: 0, total: 0 };
  const prompt = (data.usage.prompt_tokens as number) ?? 0;
  const completion = (data.usage.completion_tokens as number) ?? 0;
  const total = (data.usage.total_tokens as number) ?? (prompt + completion);
  return { prompt, completion, total };
}

function extractGeminiTokens(data: any): TokenCounts {
  const m = data?.usageMetadata;
  if (!m) return { prompt: 0, completion: 0, total: 0 };
  const prompt = (m.promptTokenCount as number) ?? 0;
  const completion = (m.candidatesTokenCount as number) ?? 0;
  const total = (m.totalTokenCount as number) ?? (prompt + completion);
  return { prompt, completion, total };
}

function fillTokens(base: LlmResponse, t: TokenCounts): LlmResponse {
  base.promptTokens = t.prompt;
  base.completionTokens = t.completion;
  base.tokens = t.total;
  return base;
}

export async function callGemini(
  apiKey: string,
  messages: ChatMessage[],
  model?: string
): Promise<LlmResponse> {
  const m = model ?? "gemini-2.0-flash";
  const start = Date.now();
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return empty("Gemini", m, "No user message", 400, Date.now() - start);

  const systemMsg = messages.find((m) => m.role === "system");
  const history = messages
    .filter((m) => m.role !== "system" && m !== lastUser)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const parts: any[] = [];
  if (lastUser.imageDataUrl) {
    const { mime, data } = stripImageData(lastUser.imageDataUrl);
    parts.push({ inline_data: { mime_type: mime, data } });
  }
  parts.push({ text: lastUser.content });

  const body: any = {
    contents: [...history, { role: "user", parts }],
    generationConfig: { maxOutputTokens: 16384 },
  };
  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
  } catch (e: any) {
    return empty("Gemini", "gemini-2.0-flash", e?.message || "Network error", 0, Date.now() - start);
  }

  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty(
      "Gemini",
      m,
      data?.error?.message || `HTTP ${res.status}`,
      res.status,
      responseTime,
      res.status === 429
    );
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  return fillTokens({ text, provider: "Gemini", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractGeminiTokens(data));
}

export async function callDeepSeek(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "deepseek-chat";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("DeepSeek", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("DeepSeek", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "DeepSeek", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callGroq(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "llama-3.1-8b-instant";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("Groq", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Groq", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "Groq", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callMistral(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "mistral-small-latest";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("Mistral", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Mistral", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "Mistral", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callOpenAI(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "gpt-4o-mini";
  const start = Date.now();
  const lastUser = [...messages].reverse().find((msg) => msg.role === "user");
  const oaMessages: any[] = messages.map((m) => {
    if (m.role === "user" && m === lastUser && m.imageDataUrl) {
      const { mime, data } = stripImageData(m.imageDataUrl);
      return {
        role: m.role,
        content: [
          { type: "image_url", image_url: { url: `data:${mime};base64,${data}` } },
          { type: "text", text: m.content },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: oaMessages,
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("OpenAI", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("OpenAI", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "OpenAI", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callGLM(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "glm-4-flash";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("GLM", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("GLM", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "GLM", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callOpenRouter(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "openai/gpt-4o-mini";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://omnibridge-dev.vercel.app",
        "X-Title": "OmniBridge",
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("OpenRouter", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("OpenRouter", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "OpenRouter", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callKimi(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "moonshot-v1-8k";
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("Kimi", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Kimi", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "Kimi", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

const noSystemRoleModels = new Set<string>();

export async function callNvidia(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "meta/llama-3.1-8b-instruct";
  const start = Date.now();

  const cleanMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));
  if (noSystemRoleModels.has(m)) {
    mergeSystemIntoUser(cleanMessages);
  }

  let res: Response;
  try {
    res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: m,
        messages: cleanMessages,
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("Nvidia", m, e?.message || "Network error", 0, Date.now() - start);
  }

  if (!res.ok) {
    const responseTime = Date.now() - start;
    let data: any = {};
    try { data = await res.json(); } catch {}

    if (
      data?.error?.message?.toLowerCase().includes("system role not supported")
    ) {
      noSystemRoleModels.add(m);
      const retryMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));
      mergeSystemIntoUser(retryMessages);
      try {
        res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages: retryMessages,
            temperature: 0.7,
            max_tokens: 16384,
          }),
        });
      } catch (e: any) {
        return empty("Nvidia", m, e?.message || "Network error", 0, Date.now() - start);
      }
      const retryTime = Date.now() - start;
      const retryData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return empty("Nvidia", m, retryData?.error?.message || `HTTP ${res.status}`, res.status, retryTime, res.status === 429);
      }
      return fillTokens({ text: retryData?.choices?.[0]?.message?.content || "", provider: "Nvidia", model: m, status: res.status, responseTime: retryTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(retryData));
    }

    return empty("Nvidia", m, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }

  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider: "Nvidia", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

function mergeSystemIntoUser(messages: { role: string; content: string }[]) {
  const sysIdx = messages.findIndex((msg) => msg.role === "system");
  if (sysIdx === -1) return;
  const userIdx = messages.findIndex((msg) => msg.role === "user");
  if (userIdx === -1) {
    messages[sysIdx].role = "user";
    return;
  }
  messages[userIdx].content = messages[sysIdx].content + "\n\n" + messages[userIdx].content;
  messages.splice(sysIdx, 1);
}

export async function callOpenAICompatStream(
  apiKey: string,
  messages: ChatMessage[],
  baseUrl: string,
  model: string,
  provider: ProviderName
): Promise<{ response: Response; model: string } | { error: LlmResponse }> {
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
        stream: true,
      }),
    });
  } catch (e: any) {
    return { error: empty(provider, model, e?.message || "Network error", 0, Date.now() - start) };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { error: empty(provider, model, data?.error?.message || `HTTP ${res.status}`, res.status, Date.now() - start, res.status === 429) };
  }
  return { response: res, model };
}

async function callOpenAICompat(
  apiKey: string,
  messages: ChatMessage[],
  baseUrl: string,
  model: string,
  provider: ProviderName
): Promise<LlmResponse> {
  const start = Date.now();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty(provider, model, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty(provider, model, data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return fillTokens({ text: data?.choices?.[0]?.message?.content || "", provider, model, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callGitHub(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://models.inference.ai.azure.com", model ?? "gpt-4o-mini", "GitHub");
}

export async function callCerebras(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://api.cerebras.ai/v1", model ?? "llama-3.3-70b", "Cerebras");
}

export async function callOpenCode(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://api.opencode.ai/v1", model ?? "default", "OpenCode");
}

export async function callCloudflare(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "@cf/meta/llama-3.1-8b-instruct";
  const start = Date.now();
  const parts = apiKey.split(":");
  const accountId = parts[0];
  const apiToken = parts.length > 1 ? parts.slice(1).join(":") : apiKey;
  let res: Response;
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: m,
        messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
        max_tokens: 16384,
      }),
    });
  } catch (e: any) {
    return empty("Cloudflare", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Cloudflare", m, data?.errors?.[0]?.message || data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  const text = data?.result?.response || data?.choices?.[0]?.message?.content || "";
  return fillTokens({ text, provider: "Cloudflare", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callCohere(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  const m = model ?? "command-r-plus-08-2024";
  const start = Date.now();
  const lastUser = [...messages].reverse().find((msg) => msg.role === "user");
  const chatHistory = messages
    .filter((msg) => msg !== lastUser)
    .map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      message: msg.content,
    }));
  let res: Response;
  try {
    const body: any = {
      model: m,
      message: lastUser?.content || "",
      chat_history: chatHistory.length > 0 ? chatHistory : undefined,
      max_tokens: 16384,
    };
    res = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Client-Name": "omnibridge",
      },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    return empty("Cohere", m, e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Cohere", m, data?.message || data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  const text = data?.text || data?.content || data?.generation || data?.response || "";
  return fillTokens({ text, provider: "Cohere", model: m, status: res.status, responseTime, tokens: 0, promptTokens: 0, completionTokens: 0, rateLimited: false }, extractOpenAITokens(data));
}

export async function callZAI(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://api.z.ai/v1", model ?? "gpt-4o-mini", "ZAI");
}

export async function callKilo(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://api.kilo.chat/v1", model ?? "gpt-4o-mini", "Kilo");
}

export async function callPollinations(apiKey: string, messages: ChatMessage[], model?: string): Promise<LlmResponse> {
  return callOpenAICompat(apiKey, messages, "https://text.pollinations.ai/openai", model ?? "openai", "Pollinations");
}

export async function callProvider(
  provider: ProviderName,
  apiKey: string,
  messages: ChatMessage[],
  model?: string
): Promise<LlmResponse> {
  switch (provider) {
    case "Gemini": return callGemini(apiKey, messages, model);
    case "DeepSeek": return callDeepSeek(apiKey, messages, model);
    case "Groq": return callGroq(apiKey, messages, model);
    case "Mistral": return callMistral(apiKey, messages, model);
    case "OpenAI": return callOpenAI(apiKey, messages, model);
    case "GLM": return callGLM(apiKey, messages, model);
    case "Kimi": return callKimi(apiKey, messages, model);
    case "OpenRouter": return callOpenRouter(apiKey, messages, model);
    case "Nvidia": return callNvidia(apiKey, messages, model);
    case "GitHub": return callGitHub(apiKey, messages, model);
    case "Cerebras": return callCerebras(apiKey, messages, model);
    case "OpenCode": return callOpenCode(apiKey, messages, model);
    case "Cloudflare": return callCloudflare(apiKey, messages, model);
    case "Cohere": return callCohere(apiKey, messages, model);
    case "ZAI": return callZAI(apiKey, messages, model);
    case "Kilo": return callKilo(apiKey, messages, model);
    case "Pollinations": return callPollinations(apiKey, messages, model);
  }
}

const STREAM_PROVIDER_CONFIG: Record<ProviderName, { baseUrl: string } | null> = {
  Gemini: null,
  DeepSeek: { baseUrl: "https://api.deepseek.com/v1" },
  Groq: { baseUrl: "https://api.groq.com/openai/v1" },
  Mistral: { baseUrl: "https://api.mistral.ai/v1" },
  OpenAI: { baseUrl: "https://api.openai.com/v1" },
  GLM: { baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  Kimi: { baseUrl: "https://api.moonshot.cn/v1" },
  OpenRouter: { baseUrl: "https://openrouter.ai/api/v1" },
  Nvidia: { baseUrl: "https://integrate.api.nvidia.com/v1" },
  GitHub: { baseUrl: "https://models.inference.ai.azure.com" },
  Cerebras: { baseUrl: "https://api.cerebras.ai/v1" },
  OpenCode: { baseUrl: "https://api.opencode.ai/v1" },
  Cloudflare: null,
  Cohere: null,
  ZAI: { baseUrl: "https://api.z.ai/v1" },
  Kilo: { baseUrl: "https://api.kilo.chat/v1" },
  Pollinations: { baseUrl: "https://text.pollinations.ai/openai" },
};

export type LlmStreamResult =
  | { ok: true; response: Response; provider: ProviderName; model: string }
  | { ok: false; error: LlmResponse };

export async function callProviderStream(
  provider: ProviderName,
  apiKey: string,
  messages: ChatMessage[],
  model?: string
): Promise<LlmStreamResult> {
  const m = model ?? PROVIDER_DEFAULT_MODEL[provider];
  const cfg = STREAM_PROVIDER_CONFIG[provider];

  if (cfg) {
    const result = await callOpenAICompatStream(apiKey, messages, cfg.baseUrl, m, provider);
    if ("error" in result) {
      const err = result.error;
      return { ok: false, error: err };
    }
    return { ok: true, response: result.response, provider, model: result.model };
  }

  if (provider === "Gemini") {
    const start = Date.now();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const systemMsg = messages.find((m) => m.role === "system");
    const history = messages
      .filter((m) => m.role !== "system" && m !== lastUser)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const parts: any[] = [lastUser ? { text: lastUser.content } : { text: "" }];
    const body: any = {
      contents: [...history, { role: "user", parts }],
      generationConfig: { maxOutputTokens: 16384 },
    };
    if (systemMsg) body.system_instruction = { parts: [{ text: systemMsg.content }] };

    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
    } catch (e: any) {
      return { ok: false, error: empty("Gemini", m, e?.message || "Network error", 0, Date.now() - start) };
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: empty("Gemini", m, data?.error?.message || `HTTP ${res.status}`, res.status, Date.now() - start, res.status === 429) };
    }
    return { ok: true, response: res, provider, model: m };
  }

  return { ok: false, error: empty(provider, m, `Streaming not available for ${provider}`, 501, 0) };
}

export const PROVIDER_DEFAULT_MODEL: Record<ProviderName, string> = {
  Gemini: "gemini-2.0-flash",
  DeepSeek: "deepseek-chat",
  Groq: "llama-3.1-8b-instant",
  Mistral: "mistral-small-latest",
  OpenAI: "gpt-4o-mini",
  GLM: "glm-4-flash",
  Kimi: "moonshot-v1-8k",
  OpenRouter: "openai/gpt-4o-mini",
  Nvidia: "meta/llama-3.1-8b-instruct",
  GitHub: "gpt-4o-mini",
  Cerebras: "llama-3.3-70b",
  OpenCode: "default",
  Cloudflare: "@cf/meta/llama-3.1-8b-instruct",
  Cohere: "command-r-plus-08-2024",
  ZAI: "gpt-4o-mini",
  Kilo: "gpt-4o-mini",
  Pollinations: "openai",
};
