import { describe, it, expect } from "vitest";
import {
  peutTransitionner,
  prochainStatut,
  labelStatut,
  couleurStatut,
  labelTransition,
  requiresRole,
  peutEffectuerTransition,
  ETAPES_WORKFLOW,
} from "@/lib/workflow";

describe("peutTransitionner", () => {
  it("autorise brouillon vers en_relecture", () => {
    expect(peutTransitionner("brouillon", "en_relecture")).toBe(true);
  });

  it("refuse brouillon vers publie directement", () => {
    expect(peutTransitionner("brouillon", "publie")).toBe(false);
  });

  it("autorise en_relecture vers valide ou brouillon", () => {
    expect(peutTransitionner("en_relecture", "valide")).toBe(true);
    expect(peutTransitionner("en_relecture", "brouillon")).toBe(true);
  });

  it("refuse toute transition depuis abroge", () => {
    expect(peutTransitionner("abroge", "brouillon")).toBe(false);
    expect(peutTransitionner("abroge", "publie")).toBe(false);
  });

  it("autorise publie vers modifie ou abroge", () => {
    expect(peutTransitionner("publie", "modifie")).toBe(true);
    expect(peutTransitionner("publie", "abroge")).toBe(true);
  });
});

describe("prochainStatut", () => {
  it("retourne en_relecture depuis brouillon", () => {
    expect(prochainStatut("brouillon")).toEqual(["en_relecture"]);
  });

  it("retourne valide et brouillon depuis en_relecture", () => {
    const suivants = prochainStatut("en_relecture");
    expect(suivants).toContain("valide");
    expect(suivants).toContain("brouillon");
  });

  it("retourne un tableau vide depuis abroge", () => {
    expect(prochainStatut("abroge")).toEqual([]);
  });
});

describe("labelStatut", () => {
  it("retourne le label francais pour chaque statut", () => {
    expect(labelStatut("brouillon")).toBe("Brouillon");
    expect(labelStatut("en_relecture")).toBe("En relecture");
    expect(labelStatut("publie")).toBe("Publié");
    expect(labelStatut("abroge")).toBe("Abrogé");
  });
});

describe("couleurStatut", () => {
  it("retourne un objet bg+text pour chaque statut", () => {
    const c = couleurStatut("publie");
    expect(c.bg).toBeDefined();
    expect(c.text).toBeDefined();
    expect(c.bg).toMatch(/^#/);
  });
});

describe("labelTransition", () => {
  it("retourne 'Soumettre a relecture' pour brouillon->en_relecture", () => {
    expect(labelTransition("brouillon", "en_relecture")).toBe("Soumettre a relecture");
  });

  it("retourne 'Publier' pour valide->publie", () => {
    expect(labelTransition("valide", "publie")).toBe("Publier");
  });

  it("retourne un label par defaut pour les transitions non definies", () => {
    const label = labelTransition("brouillon", "abroge");
    expect(label).toContain("Abrogé");
  });
});

describe("requiresRole", () => {
  it("exige admin pour la publication", () => {
    expect(requiresRole({ from: "valide", to: "publie" })).toBe("admin");
  });

  it("exige admin pour l'abrogation", () => {
    expect(requiresRole({ from: "publie", to: "abroge" })).toBe("admin");
  });

  it("accepte redacteur pour la soumission", () => {
    expect(requiresRole({ from: "brouillon", to: "en_relecture" })).toBe("redacteur");
  });

  it("accepte redacteur pour la validation", () => {
    expect(requiresRole({ from: "en_relecture", to: "valide" })).toBe("redacteur");
  });
});

describe("peutEffectuerTransition", () => {
  it("refuse tout au lecteur", () => {
    expect(peutEffectuerTransition("lecteur", { from: "brouillon", to: "en_relecture" })).toBe(false);
  });

  it("autorise tout a l'admin", () => {
    expect(peutEffectuerTransition("admin", { from: "valide", to: "publie" })).toBe(true);
    expect(peutEffectuerTransition("admin", { from: "brouillon", to: "en_relecture" })).toBe(true);
  });

  it("autorise le redacteur pour les transitions redacteur", () => {
    expect(peutEffectuerTransition("redacteur", { from: "brouillon", to: "en_relecture" })).toBe(true);
    expect(peutEffectuerTransition("redacteur", { from: "en_relecture", to: "valide" })).toBe(true);
  });

  it("refuse au redacteur les transitions admin", () => {
    expect(peutEffectuerTransition("redacteur", { from: "valide", to: "publie" })).toBe(false);
    expect(peutEffectuerTransition("redacteur", { from: "publie", to: "abroge" })).toBe(false);
  });
});

describe("ETAPES_WORKFLOW", () => {
  it("contient les 4 etapes lineaires", () => {
    expect(ETAPES_WORKFLOW).toEqual(["brouillon", "en_relecture", "valide", "publie"]);
  });
});
