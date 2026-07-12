import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string; locked?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "transitops.auth";
const ATTEMPT_KEY = "transitops.attempts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = useCallback<AuthState["login"]>(async (email, password, role) => {
    const attemptsRaw = window.localStorage.getItem(ATTEMPT_KEY);
    const attempts = attemptsRaw ? JSON.parse(attemptsRaw) : { count: 0, until: 0 };
    if (attempts.until && Date.now() < attempts.until) {
      return { ok: false, locked: true, error: "Account locked. Try again in a few minutes." };
    }
    // Mock rule: password must be "demo1234" (any email); role selected by user.
    if (password !== "demo1234") {
      const nextCount = attempts.count + 1;
      const locked = nextCount >= 3;
      window.localStorage.setItem(
        ATTEMPT_KEY,
        JSON.stringify({ count: locked ? 0 : nextCount, until: locked ? Date.now() + 5 * 60_000 : 0 })
      );
      return {
        ok: false,
        locked,
        error: locked
          ? "Too many failed attempts. Account locked for 5 minutes."
          : `Invalid credentials. ${3 - nextCount} attempts left.`,
      };
    }
    window.localStorage.removeItem(ATTEMPT_KEY);
    const u: AuthUser = { email, name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), role };
    setUser(u);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
