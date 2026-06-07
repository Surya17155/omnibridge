import type { LoaderFunctionArgs } from "react-router";
import { authenticateOmniKey, openaiErrorResponse } from "~/services/proxy-auth.server";
import { getProviderKeys } from "~/services/auth.server";
import { PROVIDER_DEFAULT_MODEL } from "~/services/llm.server";

const MODEL_TO_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_DEFAULT_MODEL).map(([provider, model]) => [model, provider])
);

const ALL_MODELS = [
  { id: "auto", owned_by: "omnibridge" },
  { id: "gemini-2.0-flash", owned_by: "google" },
  { id: "gpt-4o-mini", owned_by: "openai" },
  { id: "deepseek-chat", owned_by: "deepseek" },
  { id: "llama-3.1-8b-instant", owned_by: "groq" },
  { id: "mistral-small-latest", owned_by: "mistral" },
  { id: "glm-4-flash", owned_by: "zhipu" },
  { id: "moonshot-v1-8k", owned_by: "moonshot" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = authenticateOmniKey(request);
  if (!auth.ok) {
    return openaiErrorResponse(auth.status, "auth_error", auth.error.message, auth.error.type);
  }

  const userProviders = new Set(getProviderKeys(auth.user.id).map((k) => k.provider));
  const data = ALL_MODELS.filter((m) => m.id === "auto" || userProviders.has(MODEL_TO_PROVIDER[m.id] ?? ""));

  return new Response(JSON.stringify({ object: "list", data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
