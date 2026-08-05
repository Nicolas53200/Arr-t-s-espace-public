import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { TenantInfo } from "@/types";
import { getTenants, getTenant } from "@/lib/registre";

interface TenantContextValue {
  tenant: TenantInfo;
  setTenant: (tenant: TenantInfo) => void;
  updateTenant: (updates: Partial<TenantInfo>) => void;
  availableTenants: TenantInfo[];
}

/** Tenant par défaut quand aucun n'est configuré (ne devrait pas arriver en usage normal) */
const TENANT_VIDE: TenantInfo = {
  id: "aucun",
  nom: "Non configuré",
  code_postal: "",
  siren: "",
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenantState] = useState<TenantInfo>(() => {
    // Essayer de restaurer le tenant depuis la config sauvegardée
    const saved = localStorage.getItem("tenant_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<TenantInfo>;
        if (parsed.id) {
          const fromRegistre = getTenant(parsed.id);
          if (fromRegistre) return { ...fromRegistre, ...parsed };
        }
      } catch { /* ignore */ }
    }
    // Sinon essayer le tenant sélectionné à l'accès
    const accesTenant = localStorage.getItem("acces_tenant");
    if (accesTenant) {
      const fromRegistre = getTenant(accesTenant);
      if (fromRegistre) return fromRegistre;
    }
    // Sinon premier tenant disponible
    const tenants = getTenants();
    return tenants[0] ?? TENANT_VIDE;
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

  const availableTenants = useMemo(() => getTenants(), []);

  return (
    <TenantContext.Provider
      value={{ tenant, setTenant, updateTenant, availableTenants }}
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
