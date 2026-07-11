import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { TenantInfo } from "@/types";
import { TENANTS_MOCK } from "@/data/tenants.mock";

interface TenantContextValue {
  tenant: TenantInfo;
  setTenant: (tenant: TenantInfo) => void;
  updateTenant: (updates: Partial<TenantInfo>) => void;
  availableTenants: TenantInfo[];
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantInfo>(() => {
    const saved = localStorage.getItem("tenant_config");
    if (saved) {
      try {
        return { ...TENANTS_MOCK[0]!, ...JSON.parse(saved) as Partial<TenantInfo> };
      } catch { /* ignore */ }
    }
    return TENANTS_MOCK[0]!;
  });

  const setTenant = useCallback((t: TenantInfo) => {
    setTenantState(t);
    localStorage.setItem("tenant_config", JSON.stringify(t));
  }, []);

  const updateTenant = useCallback((updates: Partial<TenantInfo>) => {
    setTenantState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("tenant_config", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <TenantContext.Provider
      value={{ tenant, setTenant, updateTenant, availableTenants: TENANTS_MOCK }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
