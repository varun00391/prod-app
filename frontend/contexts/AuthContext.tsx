"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function ensureApiUrl(): string {
  if (!API_URL || API_URL.trim() === "") {
    throw new Error(
      "Backend URL is not configured. If you just deployed, set BACKEND_URL in GitHub Actions Variables (Settings → Actions → Variables) to your backend URL (e.g. https://your-backend.azurecontainerapps.io), then push again to rebuild the frontend."
    );
  }
  return API_URL;
}
const TOKEN_KEY = "chat_auth_token";
const USER_KEY = "chat_user";

export type User = { id: string; email: string; role: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((t: string, u: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    const uJson = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    if (t && uJson) {
      try {
        const u = JSON.parse(uJson) as User;
        setToken(t);
        setUser(u);
      } catch {
        clear();
      }
    }
    setLoading(false);
  }, [clear]);

  const login = useCallback(async (email: string, password: string) => {
    const baseUrl = ensureApiUrl();
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail || "Login failed");
    }
    const data = await res.json();
    persist(data.access_token, data.user);
  }, [persist]);

  const register = useCallback(async (email: string, password: string) => {
    const baseUrl = ensureApiUrl();
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.detail || "Registration failed");
    }
    const data = await res.json();
    persist(data.access_token, data.user);
  }, [persist]);

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const t = token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    if (!t) return {};
    return { Authorization: `Bearer ${t}` };
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    getAuthHeaders,
    isAdmin: user?.role === "admin",
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
