"use client";

import { useState } from "react";

export function SettingsModal({
  open,
  onClose,
  apiKey,
  onSaveApiKey,
}: {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}) {
  const [value, setValue] = useState(apiKey);

  if (!open) return null;

  const handleSave = () => {
    onSaveApiKey(value.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <label className="block text-sm text-[var(--muted)] mb-2">Groq API Key</label>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="gsk_..."
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <p className="text-xs text-[var(--muted)] mt-2">
          Your key is stored only in your browser. Required for chat and file questions (Groq).
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--border)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
