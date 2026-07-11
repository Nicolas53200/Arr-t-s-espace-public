import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth, authenticateUser } from "@/contexts/AuthContext";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("authenticateUser", () => {
    it("retourne l'utilisateur admin pour les bons identifiants", () => {
      const user = authenticateUser("admin@saint-avoye.fr", "admin123");
      expect(user.role).toBe("admin");
      expect(user.id).toBe("u_admin");
    });

    it("retourne l'utilisateur redacteur", () => {
      const user = authenticateUser("redacteur@saint-avoye.fr", "redac123");
      expect(user.role).toBe("redacteur");
    });

    it("retourne l'utilisateur lecteur", () => {
      const user = authenticateUser("lecteur@saint-avoye.fr", "lect123");
      expect(user.role).toBe("lecteur");
    });

    it("lance une erreur pour des identifiants invalides", () => {
      expect(() => authenticateUser("bad@mail.fr", "wrong")).toThrow("Identifiants invalides");
    });
  });

  describe("useAuth hook", () => {
    it("demarre non authentifie", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.role).toBeNull();
    });

    it("login avec des identifiants valides", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login("admin@saint-avoye.fr", "admin123");
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("admin@saint-avoye.fr");
      expect(result.current.role).toBe("admin");
    });

    it("login echoue avec des identifiants invalides", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.login("bad@mail.fr", "wrong");
        }),
      ).rejects.toThrow("Identifiants invalides");

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("logout deconnecte l'utilisateur", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login("admin@saint-avoye.fr", "admin123");
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("can() verifie les permissions selon le role", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.can("arrete:create")).toBe(false);

      await act(async () => {
        await result.current.login("lecteur@saint-avoye.fr", "lect123");
      });
      expect(result.current.can("arrete:view")).toBe(true);
      expect(result.current.can("arrete:create")).toBe(false);
      expect(result.current.can("admin:manage")).toBe(false);
    });

    it("restaure la session depuis localStorage", async () => {
      localStorage.setItem(
        "arretes_auth_user",
        JSON.stringify({
          id: "u_admin",
          nom: "Admin SaaS",
          email: "admin@saint-avoye.fr",
          role: "admin",
          tenant_id: "tenant_saint_avoye",
        }),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      await vi.waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("admin@saint-avoye.fr");
    });
  });

  describe("useAuth hors provider", () => {
    it("lance une erreur sans AuthProvider", () => {
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used within AuthProvider",
      );
    });
  });
});
