import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { requireAuth } from "~/services/session.server";
import { getProviderKeys, getOmniKey } from "~/services/auth.server";
import { runChat, getHistory, clearHistory } from "~/services/chat.server";
import { isVisionCapable, type ProviderName } from "~/services/llm.server";
import { ChatInterface, type DisplayMessage } from "~/blocks/chat/chat-interface";
import type { ModelOption } from "~/blocks/chat/chat-controls";

const ALL_PROVIDERS: ProviderName[] = ["Gemini", "DeepSeek", "Groq", "Mistral", "OpenAI", "GLM", "Kimi", "OpenRouter"];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const providerKeys = await getProviderKeys(user.id);
  const omniKey = await getOmniKey(user.id);
  const hasOmniKey = !!omniKey;

  const userProviders = new Set(providerKeys.map((k) => k.provider));
  const availableModels: ModelOption[] = ALL_PROVIDERS.filter((p) => userProviders.has(p)).map((p) => ({
    id: p,
    label: p,
    vision: isVisionCapable(p),
  }));

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
    if (modelField && modelField !== "OmniBridge") {
      explicitProvider = modelField as ProviderName;
    } else if (modelField === "OmniBridge") {
      explicitProvider = "OmniBridge";
    }

    const result = await runChat(user.id, {
      message,
      imageDataUrl,
      source,
      explicitProvider,
    });

    if (result.error) {
      return { error: result.error, routedTo: result.routedTo, routingReason: result.routingReason };
    }

    return {
      reply: result.reply,
      routedTo: result.routedTo,
      routingReason: result.routingReason,
    };
  }

  return { error: "Invalid intent" };
}

export default function ChatPage() {
  const data = useLoaderData<typeof loader>();
  return <ChatInterface {...data} />;
}
