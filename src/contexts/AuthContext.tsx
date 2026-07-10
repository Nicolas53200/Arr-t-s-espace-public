import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User, Role, Permission } from "@/types";
import { hasPermission } from "@/lib/permissions";
import { USERS_MOCK } from "@/data/tenants.mock";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(USERS_MOCK[0] ?? null);

  const login = useCallback((userId: string) => {
    const found = USERS_MOCK.find((u) => u.id === userId);
    if (found) setUser(found);
  }, []);

  const logout = useCallback(() => {
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
