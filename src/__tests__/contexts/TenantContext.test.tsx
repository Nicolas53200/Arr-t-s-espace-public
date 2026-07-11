import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";

function wrapper({ children }: { children: ReactNode }) {
  return <TenantProvider>{children}</TenantProvider>;
}

describe("TenantContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fournit le tenant par defaut (Saint-Avoye)", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.tenant.id).toBe("tenant_saint_avoye");
    expect(result.current.tenant.nom).toBe("Ville de Saint-Avoye");
  });

  it("expose la liste des tenants disponibles", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.availableTenants.length).toBeGreaterThanOrEqual(3);
    const ids = result.current.availableTenants.map((t) => t.id);
    expect(ids).toContain("tenant_saint_avoye");
    expect(ids).toContain("tenant_vannes");
    expect(ids).toContain("tenant_lorient");
  });

  it("setTenant change le tenant actif", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    const vannes = result.current.availableTenants.find((t) => t.id === "tenant_vannes")!;

    act(() => {
      result.current.setTenant(vannes);
    });

    expect(result.current.tenant.id).toBe("tenant_vannes");
    expect(result.current.tenant.nom).toBe("Ville de Vannes");
  });

  it("updateTenant met a jour partiellement le tenant", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });

    act(() => {
      result.current.updateTenant({ telephone: "02 97 11 11 11" });
    });

    expect(result.current.tenant.telephone).toBe("02 97 11 11 11");
    expect(result.current.tenant.id).toBe("tenant_saint_avoye");
  });

  it("persiste le tenant dans localStorage", () => {
    const { result } = renderHook(() => useTenant(), { wrapper });
    const vannes = result.current.availableTenants.find((t) => t.id === "tenant_vannes")!;

    act(() => {
      result.current.setTenant(vannes);
    });

    const stored = JSON.parse(localStorage.getItem("tenant_config")!);
    expect(stored.id).toBe("tenant_vannes");
  });

  it("restaure le tenant depuis localStorage", () => {
    localStorage.setItem(
      "tenant_config",
      JSON.stringify({ id: "tenant_vannes", nom: "Ville de Vannes" }),
    );

    const { result } = renderHook(() => useTenant(), { wrapper });
    expect(result.current.tenant.id).toBe("tenant_vannes");
  });

  it("lance une erreur sans TenantProvider", () => {
    expect(() => renderHook(() => useTenant())).toThrow(
      "useTenant must be used within TenantProvider",
    );
  });
});
