import type { LoaderFunctionArgs } from "react-router";
import { authenticateOmniKey, openaiErrorResponse } from "~/services/proxy-auth.server";
import { getProviderKeys } from "~/services/auth.server";
import { PROVIDER_DEFAULT_MODEL } from "~/services/llm.server";
import { fetchNvidiaModels } from "~/services/nvidia.server";

const MODEL_TO_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_DEFAULT_MODEL).map(([provider, model]) => [model, provider])
);

function modelEntry(id: string, owned_by: string) {
  return { id, object: "model", owned_by };
}

const STATIC_MODELS = [
  modelEntry("auto", "omnibridge"),
  modelEntry("gemini-2.0-flash", "google"),
  modelEntry("gpt-4o-mini", "openai"),
  modelEntry("deepseek-chat", "deepseek"),
  modelEntry("llama-3.1-8b-instant", "groq"),
  modelEntry("mistral-small-latest", "mistral"),
  modelEntry("glm-4-flash", "zhipu"),
  modelEntry("moonshot-v1-8k", "moonshot"),
  modelEntry("openai/gpt-4o-mini", "openrouter"),
  modelEntry("meta/llama-3.1-8b-instruct", "nvidia"),
];

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await authenticateOmniKey(request);
  if (!auth.ok) {
    return openaiErrorResponse(auth.status, "auth_error", auth.error.message, auth.error.type);
  }

  const providerKeys = await getProviderKeys(auth.user.id);
  const userProviders = new Set(providerKeys.map((k) => k.provider));

  const allModels = [...STATIC_MODELS];

  const nvidiaKey = providerKeys.find((k) => k.provider === "Nvidia")?.key_value;
  if (nvidiaKey) {
    const dynamic = await fetchNvidiaModels(nvidiaKey);
    for (const m of dynamic) {
      if (!allModels.some((e) => e.id === m.id)) {
        allModels.push(modelEntry(m.id, "nvidia"));
      }
    }
  }

  const data = allModels.filter(
    (m) => m.id === "auto" || userProviders.has(MODEL_TO_PROVIDER[m.id] ?? "Nvidia")
  );

  return new Response(JSON.stringify({ object: "list", data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
