import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { requireAuth } from "~/services/session.server";
import { getProviderKeys, getOmniKey } from "~/services/auth.server";
import { runChat, getHistory, clearHistory } from "~/services/chat.server";
import { isVisionCapable, type ProviderName } from "~/services/llm.server";
import { ChatInterface, type DisplayMessage } from "~/blocks/chat/chat-interface";
import type { ModelOption } from "~/blocks/chat/chat-controls";
import { hasSubModels, getProviderModels } from "~/data/provider-models";
import { routeForProvider } from "~/services/router.server";

const ALL_PROVIDERS: ProviderName[] = ["Gemini", "DeepSeek", "Groq", "Mistral", "OpenAI", "GLM", "Kimi", "OpenRouter", "Nvidia", "GitHub", "Cerebras", "OpenCode", "Cloudflare", "Cohere", "ZAI", "Kilo", "Pollinations"];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const providerKeys = await getProviderKeys(user.id);
  const omniKey = await getOmniKey(user.id);
  const hasOmniKey = !!omniKey;

  const userProviders = new Set(providerKeys.map((k) => k.provider));

  const availableModels: ModelOption[] = [];
  for (const p of ALL_PROVIDERS) {
    if (!userProviders.has(p)) continue;
    const base: ModelOption = {
      id: p,
      label: p,
      vision: isVisionCapable(p),
    };
    if (hasSubModels(p)) {
      base.subModels = getProviderModels(p);
    }
    availableModels.push(base);
  }

  const history = getHistory(user.id);
  const initialMessages: DisplayMessage[] = history.map((m, i) => ({
    id: `h-${i}`,
    role: m.role,
    content: m.content,
    imageDataUrl: m.imageDataUrl,
  }));

  return {
    initialMessages,
    availableModels,
    hasOmniKey,
    initialSource: (hasOmniKey ? "unified" : "mine") as "mine" | "unified",
    initialModel: hasOmniKey ? "OmniBridge" : (availableModels[0]?.id || ""),
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const providerKeys = await getProviderKeys(user.id);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "clear") {
    clearHistory(user.id);
    return { ok: true };
  }

  if (intent === "send") {
    const message = (formData.get("message") as string)?.trim();
    if (!message) return { error: "Message cannot be empty" };

    const imageDataUrl = (formData.get("imageDataUrl") as string) || undefined;
    const source = (formData.get("source") as "mine" | "unified") || "mine";
    const modelField = formData.get("model") as string;

    let explicitProvider: ProviderName | "OmniBridge" | undefined;
    let selectedModel: string | undefined;

    if (modelField && modelField !== "OmniBridge") {
      const defaultMatch = modelField.match(/^__(\w+)__default__$/);
      if (defaultMatch) {
        const raw = defaultMatch[1];
        const providerName = raw.charAt(0).toUpperCase() + raw.slice(1);
        explicitProvider = providerName as ProviderName;
        const nvidiaKey = providerKeys.find((k) => k.provider === "Nvidia")?.key_value || "";
        const { modelId } = await routeForProvider(message, providerName, nvidiaKey);
        if (modelId) selectedModel = modelId;
      } else if (modelField.includes("||")) {
        const [prov, mod] = modelField.split("||");
        explicitProvider = prov as ProviderName;
        selectedModel = mod;
      } else if (ALL_PROVIDERS.includes(modelField as ProviderName)) {
        explicitProvider = modelField as ProviderName;
      } else {
        for (const provider of ALL_PROVIDERS) {
          if (hasSubModels(provider)) {
            const models = getProviderModels(provider);
            if (models.some((m) => m.id === modelField)) {
              explicitProvider = provider;
              selectedModel = modelField;
              break;
            }
          }
        }
        if (!explicitProvider) {
          explicitProvider = modelField as ProviderName;
        }
      }
    } else if (modelField === "OmniBridge") {
      explicitProvider = "OmniBridge";
    }

    const result = await runChat(user.id, {
      message,
      imageDataUrl,
      source,
      explicitProvider,
      model: selectedModel,
    });

    if (result.error) {
      return { error: result.error, routedTo: result.routedTo, routingReason: result.routingReason, model: result.model };
    }

    return {
      reply: result.reply,
      routedTo: result.routedTo,
      routingReason: result.routingReason,
      model: result.model,
    };
  }

  return { error: "Invalid intent" };
}

export default function ChatPage() {
  const data = useLoaderData<typeof loader>();
  return <ChatInterface {...data} />;
}
