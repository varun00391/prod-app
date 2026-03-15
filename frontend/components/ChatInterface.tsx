"use client";

import { useState, useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type Attachment = { name: string; mime_type: string; data: string; size?: number };
export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  created_at?: string;
};

export function ChatInterface({
  apiKey,
  conversationId,
  onConversationCreated,
  onOpenSettings,
  getAuthHeaders,
}: {
  apiKey: string;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onOpenSettings: () => void;
  getAuthHeaders: () => Record<string, string>;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoadingHistory(true);
    fetch(`${API_URL}/api/conversations/${conversationId}/messages`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setMessages(
          (data.messages || []).map((m: { content: string; attachments?: Attachment[] }) => ({
            ...m,
            content: m.content,
            attachments: m.attachments || [],
          }))
        );
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingHistory(false));
  }, [conversationId, getAuthHeaders]);

  const sendMessage = async (content: string, attachments: Attachment[]) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!apiKey) {
      onOpenSettings();
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: content.trim() || "(Attachment only)",
      attachments: attachments.length ? attachments : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const body = {
        conversation_id: conversationId || undefined,
        api_key: apiKey,
        messages: [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments || [],
          })),
          {
            role: "user",
            content: userMessage.content,
            attachments: userMessage.attachments || [],
          },
        ],
      };

      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }

      const data = await res.json();
      if (data.conversation_id && !conversationId) onConversationCreated(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message?.content || "", id: data.message?.id },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e instanceof Error ? e.message : "Failed to get response"}. Check Groq API key in Settings.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!apiKey && (
        <div className="p-4 bg-amber-900/30 border-b border-amber-700/50 text-amber-200 text-sm flex items-center justify-between">
          <span>Set your Groq API key in Settings to start chatting.</span>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 rounded bg-amber-700 hover:bg-amber-600"
          >
            Settings
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-48 text-[var(--muted)]">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <h1 className="text-2xl font-semibold mb-2">Start a conversation</h1>
            <p className="text-[var(--muted)] max-w-md">
              Ask anything—text, images, PDFs, Excel, Word, or audio. Attach files below and ask questions.
            </p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
