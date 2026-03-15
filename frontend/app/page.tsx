"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { Sidebar } from "@/components/Sidebar";
import { SettingsModal } from "@/components/SettingsModal";

const API_KEY_STORAGE = "chat_groq_api_key";

function getAuthHeaders(): Record<string, string> {
  return {};
}

export default function Home() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiKeyState(localStorage.getItem(API_KEY_STORAGE) || "");
    }
  }, []);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (typeof window !== "undefined") {
      if (key) localStorage.setItem(API_KEY_STORAGE, key);
      else localStorage.removeItem(API_KEY_STORAGE);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        conversationId={conversationId}
        onSelectConversation={setConversationId}
        onNewChat={() => setConversationId(null)}
        onOpenSettings={() => setSettingsOpen(true)}
        getAuthHeaders={getAuthHeaders}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          apiKey={apiKey}
          conversationId={conversationId}
          onConversationCreated={setConversationId}
          onOpenSettings={() => setSettingsOpen(true)}
          getAuthHeaders={getAuthHeaders}
        />
      </main>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
      />
    </div>
  );
}
