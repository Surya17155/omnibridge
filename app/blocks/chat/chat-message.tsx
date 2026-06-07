import { IconUser, IconRobot, IconAlertTriangle, IconSparkles } from "@tabler/icons-react";
import styles from "./chat-message.module.css";

export type MessageProps = {
  role: "user" | "assistant" | "system";
  content: string;
  imageDataUrl?: string;
  routedTo?: string;
  routingReason?: string;
  isError?: boolean;
};

export function ChatMessage({ role, content, imageDataUrl, routedTo, routingReason, isError }: MessageProps) {
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
        ) : (
          content && <p className={styles.text}>{content}</p>
        )}
        {routedTo && role === "assistant" && !isError && (
          <p className={styles.meta}>
            <IconSparkles size={12} /> Routed to <strong>{routedTo}</strong>
            {routingReason ? ` — ${routingReason}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
