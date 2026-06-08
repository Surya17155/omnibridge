import { IconUser, IconRobot, IconAlertTriangle, IconSparkles } from "@tabler/icons-react";
import { MarkdownContent } from "./markdown";
import styles from "./chat-message.module.css";

export type MessageProps = {
  role: "user" | "assistant" | "system";
  content: string;
  imageDataUrl?: string;
  routedTo?: string;
  routingReason?: string;
  model?: string;
  isError?: boolean;
};

export function ChatMessage({ role, content, imageDataUrl, routedTo, routingReason, model, isError }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={isUser ? styles.userRow : styles.botRow}>
      <div className={isUser ? styles.userAvatar : styles.botAvatar}>
        {isUser ? <IconUser size={16} /> : <IconRobot size={16} />}
      </div>
      <div className={isUser ? styles.userBubble : styles.botBubble}>
        {imageDataUrl && (
          <img src={imageDataUrl} alt="upload" className={styles.image} />
        )}
        {isError ? (
          <p className={styles.errorText}>
            <IconAlertTriangle size={14} /> {content}
          </p>
        ) : isUser ? (
          content && <p className={styles.text}>{content}</p>
        ) : (
          content && <MarkdownContent text={content} />
        )}
        {role === "assistant" && !isError && routedTo && (
          <p className={styles.meta}>
            <IconSparkles size={12} />
            <strong>{routedTo}</strong>
            {model && !model.startsWith("__") ? ` · ${model}` : ""}
            {routingReason ? ` · ${routingReason}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
