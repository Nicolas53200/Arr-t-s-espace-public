import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { ajouterCollectivite, reinitialiser } from "@/lib/registre";

function wrapper({ children }: { children: ReactNode }) {
  return <TenantProvider>{children}</TenantProvider>;
}

function seedRegistre() {
  ajouterCollectivite({
    nom: "Ville de Saint-Avoye",
    code_postal: "56000",
    siren: "215600001",
    email_admin: "admin@saint-avoye.fr",
  });
  ajouterCollectivite({
    nom: "Ville de Vannes",
    code_postal: "56000",
    siren: "215600002",
    email_admin: "admin@vannes.fr",
  });
}

describe("TenantContext", () => {
  beforeEach(() => {
    localStorage.clear();
    reinitialiser();
    seedRegistre();
  });

  it("fournit le premier tenant disponible par defaut", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.tenant.nom).toBe("Ville de Saint-Avoye");
  });

  it("expose la liste des tenants disponibles", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.availableTenants.length).toBeGreaterThanOrEqual(2);
  });

  it("setTenant change le tenant actif", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    const vannes = result.current.availableTenants.find((t) => t.nom === "Ville de Vannes")!;

    act(() => {
      result.current.setTenant(vannes);
    });

    expect(result.current.tenant.nom).toBe("Ville de Vannes");
  });

  it("updateTenant met a jour partiellement le tenant", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });

    act(() => {
      result.current.updateTenant({ telephone: "02 97 11 11 11" });
    });

    expect(result.current.tenant.telephone).toBe("02 97 11 11 11");
  });

  it("persiste le tenant dans localStorage", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    const vannes = result.current.availableTenants.find((t) => t.nom === "Ville de Vannes")!;

    act(() => {
      result.current.setTenant(vannes);
    });

    const stored = JSON.parse(localStorage.getItem("tenant_config")!);
    expect(stored.nom).toBe("Ville de Vannes");
  });

  it("restaure le tenant depuis localStorage quand il existe dans le registre", () => {
    const tenants = renderHook(() => useTenant(), { wrapper }).result.current.availableTenants;
    const vannes = tenants.find((t) => t.nom === "Ville de Vannes")!;
    localStorage.setItem(
      "tenant_config",
      JSON.stringify({ id: vannes.id, nom: "Ville de Vannes" }),
    );

    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.tenant.nom).toBe("Ville de Vannes");
  });

  it("lance une erreur sans TenantProvider", () => {
    expect(() => renderHook(() => useTenant())).toThrow(
      "useTenant must be used within TenantProvider",
    );
  });
});
