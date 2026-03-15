"use client";

import { createContext, useContext, ReactNode } from "react";

export type User = { id: string; email: string; role: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  getAuthHeaders: () => Record<string, string>;
  isAdmin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextType = {
    user: null,
    token: null,
    getAuthHeaders: () => ({}),
    isAdmin: false,
    loading: false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
