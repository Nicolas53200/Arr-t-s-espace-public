import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User, Role, Permission } from "@/types";
import { hasPermission } from "@/lib/permissions";
import { authentifier } from "@/lib/registre";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  role: Role | null;
}

const AUTH_STORAGE_KEY = "arretes_auth_user";

export function authenticateUser(email: string, password: string): User {
  const user = authentifier(email, password);
  if (!user) {
    throw new Error("Identifiants invalides");
  }
  return user;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    const found = authenticateUser(email, password);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
    setUser(found);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        can,
        role: user?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
