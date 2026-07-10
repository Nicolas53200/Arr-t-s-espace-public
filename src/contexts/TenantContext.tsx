import { createContext, useContext, useState, type ReactNode } from "react";
import type { TenantInfo } from "@/types";
import { TENANTS_MOCK } from "@/data/tenants.mock";

interface TenantContextValue {
  tenant: TenantInfo;
  setTenant: (tenant: TenantInfo) => void;
  availableTenants: TenantInfo[];
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo>(TENANTS_MOCK[0]!);

  return (
    <TenantContext.Provider
      value={{ tenant, setTenant, availableTenants: TENANTS_MOCK }}
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
