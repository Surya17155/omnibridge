import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { IconSparkles, IconTrash } from "@tabler/icons-react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatControls, type ModelOption } from "./chat-controls";
import styles from "./chat-interface.module.css";

export type DisplayMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  imageDataUrl?: string;
  routedTo?: string;
  routingReason?: string;
  isError?: boolean;
  pending?: boolean;
};

interface ChatInterfaceProps {
  initialMessages: DisplayMessage[];
  availableModels: ModelOption[];
  hasOmniKey: boolean;
  initialSource: "mine" | "unified";
  initialModel: string;
}

export function ChatInterface({
  initialMessages,
  availableModels,
  hasOmniKey,
  initialSource,
  initialModel,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [source, setSource] = useState<"mine" | "unified">(initialSource);
  const [model, setModel] = useState<string>(initialModel);
  const fetcher = useFetcher<{
    reply?: string;
    routedTo?: string;
    routingReason?: string;
    error?: string;
  }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousState = useRef(fetcher.state);

  useEffect(() => {
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      const data = fetcher.data;
      setMessages((prev) => {
        const withoutPending = prev.filter((m) => !m.pending);
        if (data.error) {
          return [
            ...withoutPending,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.error,
              routedTo: data.routedTo,
              routingReason: data.routingReason,
              isError: true,
            },
          ];
        }
        return [
          ...withoutPending,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.reply || "",
            routedTo: data.routedTo,
            routingReason: data.routingReason,
          },
        ];
      });
    }
    previousState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSourceChange = (s: "mine" | "unified") => {
    setSource(s);
    if (s === "unified" && hasOmniKey) {
      setModel("OmniBridge");
    } else {
      setModel(availableModels[0]?.id || "");
    }
  };

  const handleSend = (message: string, imageDataUrl: string | null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        imageDataUrl: imageDataUrl || undefined,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        pending: true,
      },
    ]);

    const fd = new FormData();
    fd.append("intent", "send");
    fd.append("message", message);
    fd.append("source", source);
    fd.append("model", model);
    if (imageDataUrl) fd.append("imageDataUrl", imageDataUrl);

    fetcher.submit(fd, { method: "post" });
  };

  const handleClear = () => {
    if (!confirm("Clear all chat history?")) return;
    const fd = new FormData();
    fd.append("intent", "clear");
    fetcher.submit(fd, { method: "post" });
    setMessages([]);
  };

  const isVisionModel = (id: string) => id === "Gemini" || id === "OpenAI";
  const currentIsVision = isVisionModel(model);
  const hasAnyModel = availableModels.length > 0 || hasOmniKey;
  const isBusy = fetcher.state !== "idle";

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Chat Playground</h1>
          <p className={styles.subtitle}>
            Test your provider keys or the unified key against real LLM APIs
          </p>
        </div>
        <div className={styles.headerRight}>
          {messages.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              <IconTrash size={14} />
              Clear
            </button>
          )}
          <ChatControls
            availableModels={availableModels}
            hasOmniKey={hasOmniKey}
            source={source}
            model={model}
            isVision={currentIsVision}
            onSourceChange={handleSourceChange}
            onModelChange={(m) => setModel(m)}
          />
        </div>
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <IconSparkles size={32} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Start a conversation</h3>
            <p className={styles.emptyText}>
              {hasAnyModel
                ? "Type a message below — images route to vision-capable models, code queries route to DeepSeek, speed queries route to Groq."
                : "Add a provider key in Key Management, or generate a unified key in Proxy Configuration to begin."}
            </p>
            {hasAnyModel && (
              <div className={styles.suggestions}>
                {currentIsVision ? null : (
                  <button type="button" className={styles.suggestion} onClick={() => setModel("DeepSeek")}>
                    "Write a Python function to sort a list"
                  </button>
                )}
                <button type="button" className={styles.suggestion} onClick={() => setModel("Groq")}>
                  "Give me a quick summary of X"
                </button>
                {availableModels.some((m) => isVisionModel(m.id)) && (
                  <button type="button" className={styles.suggestion}>
                    Upload an image to test vision
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          messages.map((m) => <ChatMessage key={m.id} {...m} />)
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={isBusy || !hasAnyModel} />
    </div>
  );
}
