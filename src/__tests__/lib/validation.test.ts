import { describe, it, expect } from "vitest";
import { validerChamp, validerFormulaire } from "@/lib/validation";
import type { RegleValidation, ReglesFormulaire } from "@/lib/validation";

describe("validerChamp", () => {
  describe("required", () => {
    const regles: RegleValidation[] = [{ type: "required" }];

    it("rejette une chaine vide", () => {
      expect(validerChamp("", regles).valide).toBe(false);
    });

    it("rejette une chaine d'espaces", () => {
      expect(validerChamp("   ", regles).valide).toBe(false);
    });

    it("accepte une valeur non vide", () => {
      expect(validerChamp("abc", regles).valide).toBe(true);
    });

    it("retourne le bon message d'erreur", () => {
      expect(validerChamp("", regles).erreur).toBe("Ce champ est obligatoire");
    });
  });

  describe("minLength", () => {
    const regles: RegleValidation[] = [{ type: "minLength", valeur: 5 }];

    it("rejette une chaine trop courte", () => {
      expect(validerChamp("abc", regles).valide).toBe(false);
    });

    it("accepte une chaine suffisamment longue", () => {
      expect(validerChamp("abcde", regles).valide).toBe(true);
    });

    it("accepte une chaine vide (non required)", () => {
      expect(validerChamp("", regles).valide).toBe(true);
    });
  });

  describe("maxLength", () => {
    const regles: RegleValidation[] = [{ type: "maxLength", valeur: 3 }];

    it("rejette une chaine trop longue", () => {
      expect(validerChamp("abcd", regles).valide).toBe(false);
    });

    it("accepte une chaine dans la limite", () => {
      expect(validerChamp("abc", regles).valide).toBe(true);
    });
  });

  describe("pattern", () => {
    const regles: RegleValidation[] = [{ type: "pattern", valeur: /^\d{3}\/\d{4}$/, message: "Format attendu: 045/2026" }];

    it("rejette un format invalide", () => {
      const r = validerChamp("abc", regles);
      expect(r.valide).toBe(false);
      expect(r.erreur).toBe("Format attendu: 045/2026");
    });

    it("accepte un format valide", () => {
      expect(validerChamp("045/2026", regles).valide).toBe(true);
    });
  });

  describe("dateValide", () => {
    const regles: RegleValidation[] = [{ type: "dateValide" }];

    it("rejette une date invalide", () => {
      expect(validerChamp("2026-13-01", regles).valide).toBe(false);
    });

    it("rejette du texte non-date", () => {
      expect(validerChamp("pas-une-date", regles).valide).toBe(false);
    });

    it("accepte une date valide", () => {
      expect(validerChamp("2026-07-11", regles).valide).toBe(true);
    });

    it("rejette le 31 fevrier", () => {
      expect(validerChamp("2026-02-31", regles).valide).toBe(false);
    });
  });

  describe("dateApres", () => {
    const regles: RegleValidation[] = [{ type: "dateApres", autreChamp: "debut", labelAutre: "la date de debut" }];

    it("rejette une date anterieure", () => {
      const r = validerChamp("2026-01-01", regles, { debut: "2026-06-01" });
      expect(r.valide).toBe(false);
      expect(r.erreur).toContain("postérieure");
    });

    it("rejette une date egale", () => {
      expect(validerChamp("2026-06-01", regles, { debut: "2026-06-01" }).valide).toBe(false);
    });

    it("accepte une date posterieure", () => {
      expect(validerChamp("2026-07-01", regles, { debut: "2026-06-01" }).valide).toBe(true);
    });
  });

  describe("email", () => {
    const regles: RegleValidation[] = [{ type: "email" }];

    it("rejette un email invalide", () => {
      expect(validerChamp("pas-un-email", regles).valide).toBe(false);
    });

    it("accepte un email valide", () => {
      expect(validerChamp("test@exemple.fr", regles).valide).toBe(true);
    });

    it("accepte une chaine vide (non required)", () => {
      expect(validerChamp("", regles).valide).toBe(true);
    });
  });
});

describe("validerFormulaire", () => {
  it("valide plusieurs champs", () => {
    const regles: ReglesFormulaire<"titre" | "email"> = {
      titre: [{ type: "required" }, { type: "minLength", valeur: 3 }],
      email: [{ type: "required" }, { type: "email" }],
    };

    const erreurs = validerFormulaire({ titre: "", email: "invalide" }, regles);
    expect(erreurs.titre).toBe("Ce champ est obligatoire");
    expect(erreurs.email).toBe("Adresse email invalide");
  });

  it("retourne undefined pour les champs valides", () => {
    const regles: ReglesFormulaire<"titre"> = {
      titre: [{ type: "required" }],
    };

    const erreurs = validerFormulaire({ titre: "Mon titre" }, regles);
    expect(erreurs.titre).toBeUndefined();
  });

  it("combine required et dateValide", () => {
    const regles: ReglesFormulaire<"date"> = {
      date: [{ type: "required" }, { type: "dateValide" }],
    };

    expect(validerFormulaire({ date: "" }, regles).date).toBe("Ce champ est obligatoire");
    expect(validerFormulaire({ date: "invalide" }, regles).date).toBe("Date invalide");
    expect(validerFormulaire({ date: "2026-07-11" }, regles).date).toBeUndefined();
  });
});
