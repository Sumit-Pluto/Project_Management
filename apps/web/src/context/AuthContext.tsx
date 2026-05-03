import { useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../api/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

type AuthPayload = {
  user: User;
  token: string;
};

const storageKey = "team-task-manager-session";

function readStoredSession(): AuthPayload | null {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AuthPayload;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthPayload | null>(() => readStoredSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      login: async (email, password) => {
        const result = await api<AuthPayload>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem(storageKey, JSON.stringify(result));
        setSession(result);
      },
      signup: async (input) => {
        const result = await api<AuthPayload>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify(input)
        });
        localStorage.setItem(storageKey, JSON.stringify(result));
        setSession(result);
      },
      logout: () => {
        localStorage.removeItem(storageKey);
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
