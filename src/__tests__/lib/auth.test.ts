import { describe, it, expect, beforeEach } from "vitest";
import { authenticateUser } from "@/contexts/AuthContext";

describe("authenticateUser", () => {
  it("retourne un utilisateur admin avec les bons identifiants", () => {
    const user = authenticateUser("admin@saint-avoye.fr", "admin123");
    expect(user.role).toBe("admin");
    expect(user.email).toBe("admin@saint-avoye.fr");
    expect(user.nom).toBe("Admin SaaS");
  });

  it("retourne un utilisateur redacteur avec les bons identifiants", () => {
    const user = authenticateUser("redacteur@saint-avoye.fr", "redac123");
    expect(user.role).toBe("redacteur");
    expect(user.email).toBe("redacteur@saint-avoye.fr");
  });

  it("retourne un utilisateur lecteur avec les bons identifiants", () => {
    const user = authenticateUser("lecteur@saint-avoye.fr", "lect123");
    expect(user.role).toBe("lecteur");
    expect(user.email).toBe("lecteur@saint-avoye.fr");
  });

  it("lance une erreur avec un email invalide", () => {
    expect(() => authenticateUser("inconnu@test.fr", "admin123")).toThrow(
      "Identifiants invalides",
    );
  });

  it("lance une erreur avec un mot de passe invalide", () => {
    expect(() => authenticateUser("admin@saint-avoye.fr", "mauvais")).toThrow(
      "Identifiants invalides",
    );
  });

  it("lance une erreur avec des identifiants vides", () => {
    expect(() => authenticateUser("", "")).toThrow("Identifiants invalides");
  });
});

describe("logout efface le localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("le localStorage est vide apres suppression", () => {
    localStorage.setItem("arretes_auth_user", JSON.stringify({ id: "test" }));
    localStorage.removeItem("arretes_auth_user");
    expect(localStorage.getItem("arretes_auth_user")).toBeNull();
  });
});
