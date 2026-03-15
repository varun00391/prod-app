"use client";

import { useState, useRef } from "react";
import type { Attachment } from "./ChatInterface";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(",")[1] || "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (content: string, attachments: Attachment[]) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const added: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          alert(`"${file.name}" is larger than ${MAX_FILE_SIZE_MB}MB. Skipped.`);
          continue;
        }
        const data = await fileToBase64(file);
        added.push({ name: file.name, mime_type: file.type || "application/octet-stream", data });
      }
      setAttachments((prev) => [...prev, ...added]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(text, attachments);
    setText("");
    setAttachments([]);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border)] bg-[var(--bg)]">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm"
            >
              <span className="truncate max-w-[160px]">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-[var(--muted)] hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,audio/*,video/*,.txt"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="shrink-0 p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] disabled:opacity-50"
          title="Attach file"
        >
          📎
        </button>
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Message... (Shift+Enter for new line)"
            rows={1}
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none min-h-[48px] max-h-40"
          />
          <button
            type="submit"
            disabled={disabled || (!text.trim() && attachments.length === 0)}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white"
            title="Send"
          >
            →
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--muted)] mt-2">
        Images, PDF, Excel, Word, audio. Max {MAX_FILE_SIZE_MB}MB per file.
      </p>
    </form>
  );
}
