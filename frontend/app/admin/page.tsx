"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type User = { id: string; email: string; role: string; created_at?: string };
type Conv = { id: string; title: string; user_id: string; user_email: string; created_at?: string; updated_at?: string };

export default function AdminPage() {
  const { token, loading: authLoading, getAuthHeaders, isAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUserId, setFilterUserId] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
      return;
    }
  }, [token, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    setLoading(true);
    const h = getAuthHeaders();
    Promise.all([
      fetch(`${API_URL}/api/admin/users`, { headers: h }).then((r) => r.json()),
      fetch(`${API_URL}/api/admin/conversations${filterUserId ? `?user_id=${encodeURIComponent(filterUserId)}` : ""}`, { headers: h }).then((r) => r.json()),
    ])
      .then(([uRes, cRes]) => {
        setUsers(uRes.users || []);
        setConversations(cRes.conversations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isAdmin, filterUserId, getAuthHeaders]);

  if (authLoading || !token || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Back to chat
          </Link>
          <h1 className="text-lg font-semibold">Admin panel</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          {loading ? (
            <p className="text-[var(--muted)]">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-[var(--border)]">
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <span className={u.role === "admin" ? "text-[var(--accent)]" : ""}>{u.role}</span>
                      </td>
                      <td className="p-3 text-[var(--muted)] font-mono text-xs">{u.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>
          <div className="mb-3">
            <label className="text-sm text-[var(--muted)] mr-2">Filter by user (email):</label>
            <input
              type="text"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              placeholder="Leave empty for all"
              className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] w-64"
            />
          </div>
          {loading ? (
            <p className="text-[var(--muted)]">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="p-3 max-w-xs truncate">{c.title || "—"}</td>
                      <td className="p-3">{c.user_email || c.user_id}</td>
                      <td className="p-3 text-[var(--muted)]">
                        {c.updated_at ? new Date(c.updated_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
