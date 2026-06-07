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
  | "OpenRouter";

const VISION_CAPABLE: ProviderName[] = ["Gemini", "OpenAI"];

export function isVisionCapable(provider: ProviderName): boolean {
  return VISION_CAPABLE.includes(provider);
}

function stripImageData(dataUrl: string): { mime: string; data: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { mime: "image/png", data: dataUrl };
  return { mime: match[1], data: match[2] };
}

function empty(provider: string, model: string, error: string, status: number, responseTime: number, rateLimited = false): LlmResponse {
  return { text: "", provider, model, status, responseTime, tokens: 0, rateLimited, error };
}

function extractOpenAITokens(data: any): number {
  if (!data?.usage) return 0;
  return (data.usage.total_tokens as number) ?? 0;
}

function extractGeminiTokens(data: any): number {
  const m = data?.usageMetadata;
  if (!m) return 0;
  return (m.totalTokenCount as number) ?? 0;
}

export async function callGemini(
  apiKey: string,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  const start = Date.now();
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return empty("Gemini", "gemini-2.0-flash", "No user message", 400, Date.now() - start);

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
  };
  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      "gemini-2.0-flash",
      data?.error?.message || `HTTP ${res.status}`,
      res.status,
      responseTime,
      res.status === 429
    );
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  return { text, provider: "Gemini", model: "gemini-2.0-flash", status: res.status, responseTime, tokens: extractGeminiTokens(data), rateLimited: false };
}

export async function callDeepSeek(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
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
        model: "deepseek-chat",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e: any) {
    return empty("DeepSeek", "deepseek-chat", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("DeepSeek", "deepseek-chat", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "DeepSeek", model: "deepseek-chat", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callGroq(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
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
        model: "llama-3.1-8b-instant",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e: any) {
    return empty("Groq", "llama-3.1-8b-instant", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Groq", "llama-3.1-8b-instant", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "Groq", model: "llama-3.1-8b-instant", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callMistral(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
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
        model: "mistral-small-latest",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e: any) {
    return empty("Mistral", "mistral-small-latest", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Mistral", "mistral-small-latest", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "Mistral", model: "mistral-small-latest", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callOpenAI(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
  const start = Date.now();
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
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
        model: "gpt-4o-mini",
        messages: oaMessages,
      }),
    });
  } catch (e: any) {
    return empty("OpenAI", "gpt-4o-mini", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("OpenAI", "gpt-4o-mini", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "OpenAI", model: "gpt-4o-mini", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callGLM(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
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
        model: "glm-4-flash",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e: any) {
    return empty("GLM", "glm-4-flash", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("GLM", "glm-4-flash", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "GLM", model: "glm-4-flash", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callKimi(apiKey: string, messages: ChatMessage[]): Promise<LlmResponse> {
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
        model: "moonshot-v1-8k",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch (e: any) {
    return empty("Kimi", "moonshot-v1-8k", e?.message || "Network error", 0, Date.now() - start);
  }
  const responseTime = Date.now() - start;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return empty("Kimi", "moonshot-v1-8k", data?.error?.message || `HTTP ${res.status}`, res.status, responseTime, res.status === 429);
  }
  return { text: data?.choices?.[0]?.message?.content || "", provider: "Kimi", model: "moonshot-v1-8k", status: res.status, responseTime, tokens: extractOpenAITokens(data), rateLimited: false };
}

export async function callProvider(
  provider: ProviderName,
  apiKey: string,
  messages: ChatMessage[]
): Promise<LlmResponse> {
  switch (provider) {
    case "Gemini": return callGemini(apiKey, messages);
    case "DeepSeek": return callDeepSeek(apiKey, messages);
    case "Groq": return callGroq(apiKey, messages);
    case "Mistral": return callMistral(apiKey, messages);
    case "OpenAI": return callOpenAI(apiKey, messages);
    case "GLM": return callGLM(apiKey, messages);
    case "Kimi": return callKimi(apiKey, messages);
  }
}

export const PROVIDER_DEFAULT_MODEL: Record<ProviderName, string> = {
  Gemini: "gemini-2.0-flash",
  DeepSeek: "deepseek-chat",
  Groq: "llama-3.1-8b-instant",
  Mistral: "mistral-small-latest",
  OpenAI: "gpt-4o-mini",
  GLM: "glm-4-flash",
  Kimi: "moonshot-v1-8k",
};
