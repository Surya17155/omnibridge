import { useRef, useState } from "react";
import { IconSend, IconPaperclip, IconX } from "@tabler/icons-react";
import styles from "./chat-input.module.css";

interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string, imageDataUrl: string | null) => void;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    const message = textareaRef.current?.value?.trim();
    if (!message) return;
    onSend(message, preview);
    if (textareaRef.current) textareaRef.current.value = "";
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={styles.form}>
      {preview && (
        <div className={styles.preview}>
          <img src={preview} alt="preview" />
          <button type="button" className={styles.previewClear} onClick={clearImage} title="Remove image">
            <IconX size={14} />
          </button>
        </div>
      )}

      <div
        className={`${styles.inputWrap} ${dragOver ? styles.dragOver : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
      >
        <button
          type="button"
          className={styles.attachBtn}
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Attach image"
        >
          <IconPaperclip size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Ask anything… attach an image for vision-capable models"
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={submit}
          disabled={disabled}
          title="Send"
        >
          <IconSend size={18} />
        </button>
      </div>

      <p className={styles.hint}>
        <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for new line · Images route to Gemini or OpenAI
      </p>
    </div>
  );
}
