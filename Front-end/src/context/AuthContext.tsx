import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/types";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string; locked?: boolean }>;
  logout: () => void;
  canWrite: (module: "Fleet" | "Drivers" | "Trips" | "Fuel") => boolean;
}

const rbac: Record<string, Record<string, string>> = {
  Fleet:     { FLEET_MANAGER: "Manage", DISPATCHER: "View",   SAFETY_OFFICER: "View",     FINANCIAL_ANALYST: "Read Only" },
  Drivers:   { FLEET_MANAGER: "Manage", DISPATCHER: "Edit",   SAFETY_OFFICER: "Manage",   FINANCIAL_ANALYST: "Read Only" },
  Trips:     { FLEET_MANAGER: "View",   DISPATCHER: "Manage", SAFETY_OFFICER: "View",     FINANCIAL_ANALYST: "Read Only" },
  Fuel:      { FLEET_MANAGER: "Edit",   DISPATCHER: "Edit",   SAFETY_OFFICER: "Read Only",FINANCIAL_ANALYST: "Manage"   },
};

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
      return { ok: false, locked: true, error: "Account locked. Try again in 5 minutes." };
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      
      if (!data.success) {
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
            : data.error?.message || `Invalid credentials. ${3 - nextCount} attempts left.` 
        };
      }

      window.localStorage.removeItem(ATTEMPT_KEY);
      const token = data.data.token;
      const backendUser = data.data.user;
      
      const u: AuthUser = { 
        id: backendUser.id,
        email: backendUser.email, 
        name: backendUser.name, 
        role: backendUser.role, 
        token 
      };
      
      setUser(u);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Failed to connect to server" };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const canWrite = useCallback((module: "Fleet" | "Drivers" | "Trips" | "Fuel") => {
    if (!user) return false;
    const perm = rbac[module]?.[user.role] || "—";
    return perm === "Manage" || perm === "Edit";
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({ user, isAuthenticated: !!user, login, logout, canWrite }),
    [user, login, logout, canWrite]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
