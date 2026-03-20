"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "chat_auth_token";
const USER_KEY = "chat_user";

function ensureApiUrl(): string {
  if (!API_URL || API_URL.trim() === "") {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_URL and rebuild frontend.");
  }
  return API_URL;
}

export type User = { id: string; email: string; role: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((nextToken: string, nextUser: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clear = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as User);
      } catch {
        clear();
      }
    }
    setLoading(false);
  }, [clear]);

  const login = useCallback(
    async (email: string, password: string) => {
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:login",
          message: "login_start",
          data: {
            baseHost: (() => {
              try {
                return new URL(ensureApiUrl()).host;
              } catch {
                return "invalid_url";
              }
            })(),
          },
          timestamp: Date.now(),
          hypothesisId: "H1",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      const baseUrl = ensureApiUrl();
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (netErr) {
        // #region agent log
        fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
          body: JSON.stringify({
            sessionId: "f0b85c",
            location: "AuthContext.tsx:login",
            message: "login_fetch_throw",
            data: {
              errName: netErr instanceof Error ? netErr.name : "unknown",
              errMsg: netErr instanceof Error ? netErr.message.slice(0, 200) : "non_error",
            },
            timestamp: Date.now(),
            hypothesisId: "H1",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        throw netErr;
      }
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:login",
          message: "login_response",
          data: { ok: res.ok, status: res.status },
          timestamp: Date.now(),
          hypothesisId: "H2",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          typeof data.detail === "string"
            ? data.detail.slice(0, 300)
            : Array.isArray(data.detail)
              ? JSON.stringify(data.detail).slice(0, 300)
              : JSON.stringify(data).slice(0, 300);
        // #region agent log
        fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
          body: JSON.stringify({
            sessionId: "f0b85c",
            location: "AuthContext.tsx:login",
            message: "login_not_ok",
            data: { status: res.status, detailPreview: detail },
            timestamp: Date.now(),
            hypothesisId: "H3",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(data.detail || "Login failed");
      }
      const data = await res.json();
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:login",
          message: "login_success_shape",
          data: { hasToken: typeof data.access_token === "string", hasUser: !!data.user },
          timestamp: Date.now(),
          hypothesisId: "H4",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      persist(data.access_token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:register",
          message: "register_start",
          data: {
            baseHost: (() => {
              try {
                return new URL(ensureApiUrl()).host;
              } catch {
                return "invalid_url";
              }
            })(),
          },
          timestamp: Date.now(),
          hypothesisId: "H1",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      const baseUrl = ensureApiUrl();
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (netErr) {
        // #region agent log
        fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
          body: JSON.stringify({
            sessionId: "f0b85c",
            location: "AuthContext.tsx:register",
            message: "register_fetch_throw",
            data: {
              errName: netErr instanceof Error ? netErr.name : "unknown",
              errMsg: netErr instanceof Error ? netErr.message.slice(0, 200) : "non_error",
            },
            timestamp: Date.now(),
            hypothesisId: "H1",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        throw netErr;
      }
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:register",
          message: "register_response",
          data: { ok: res.ok, status: res.status },
          timestamp: Date.now(),
          hypothesisId: "H2",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          typeof data.detail === "string"
            ? data.detail.slice(0, 300)
            : Array.isArray(data.detail)
              ? JSON.stringify(data.detail).slice(0, 300)
              : JSON.stringify(data).slice(0, 300);
        // #region agent log
        fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
          body: JSON.stringify({
            sessionId: "f0b85c",
            location: "AuthContext.tsx:register",
            message: "register_not_ok",
            data: { status: res.status, detailPreview: detail },
            timestamp: Date.now(),
            hypothesisId: "H3",
            runId: "pre-fix",
          }),
        }).catch(() => {});
        // #endregion
        throw new Error(data.detail || "Registration failed");
      }
      const data = await res.json();
      // #region agent log
      fetch("http://127.0.0.1:7717/ingest/34765bc6-4fa8-492d-8532-e1ed09a96649", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f0b85c" },
        body: JSON.stringify({
          sessionId: "f0b85c",
          location: "AuthContext.tsx:register",
          message: "register_success_shape",
          data: { hasToken: typeof data.access_token === "string", hasUser: !!data.user },
          timestamp: Date.now(),
          hypothesisId: "H4",
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      persist(data.access_token, data.user);
    },
    [persist]
  );

  const logout = useCallback(() => clear(), [clear]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const value = token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
    return value ? { Authorization: `Bearer ${value}` } : {};
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
