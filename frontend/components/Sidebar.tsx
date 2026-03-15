"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type Conversation = { id: string; title: string; updated_at: string };

export function Sidebar({
  conversationId,
  onSelectConversation,
  onNewChat,
  onOpenSettings,
  getAuthHeaders,
  isAdmin,
}: {
  conversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  getAuthHeaders: () => Record<string, string>;
  isAdmin: boolean;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationId]);

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      await fetch(`${API_URL}/api/conversations/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (conversationId === id) onNewChat();
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      <div className="p-3 border-b border-[var(--border)]">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition"
        >
          + New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-sm text-[var(--muted)] p-2">Loading...</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition ${
                conversationId === c.id ? "bg-[var(--border)]" : "hover:bg-[var(--border)]"
              }`}
            >
              <span className="flex-1 truncate text-sm">{c.title || "Chat"}</span>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hover:text-red-400 text-sm p-0.5"
                aria-label="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t border-[var(--border)] space-y-1">
        <button
          onClick={onOpenSettings}
          className="w-full py-2 px-3 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--border)] hover:text-[var(--text)] transition"
        >
          ⚙ Settings (Groq API Key)
        </button>
      </div>
    </aside>
  );
}
