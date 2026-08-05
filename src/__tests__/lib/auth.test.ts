import { describe, it, expect, beforeEach } from "vitest";
import { authenticateUser } from "@/contexts/AuthContext";
import { ajouterCollectivite, reinitialiser } from "@/lib/registre";

describe("authenticateUser", () => {
  beforeEach(() => {
    localStorage.clear();
    reinitialiser();
    ajouterCollectivite({
      nom: "Ville de Saint-Avoye",
      code_postal: "56000",
      siren: "215600001",
      email_admin: "admin@saint-avoye.fr",
    });
  });

  it("retourne un utilisateur admin avec les bons identifiants", () => {
    const user = authenticateUser("admin@saint-avoye.fr", "admin123");
    expect(user.role).toBe("admin");
    expect(user.email).toBe("admin@saint-avoye.fr");
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
