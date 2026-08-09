import { describe, it, expect } from "vitest";
import {
  normaliserTexte,
  tokeniser,
  distanceLevenshtein,
  scorerMot,
  rechercherGlobal,
  genererSuggestions,
  surbriller,
  calculerFacettes,
} from "@/lib/recherche";
import type { Arrete, Reference } from "@/types";

function creerArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: `a-${Math.random().toString(36).slice(2, 8)}`,
    numero: "AR-2026-0100-STA",
    titre: "Stationnement interdit Rue de la Paix",
    type_code: "stationnement_interdit",
    type_label: "Stationnement interdit",
    commune_id: "c1",
    commune: "Laval",
    statut: "publie",
    date_debut: "2026-06-01",
    date_fin: "2026-08-31",
    date_creation: "2026-05-20",
    cree_par: "M. Lefèvre",
    voies: ["Rue de la Paix"],
    troncons: [],
    versions: [],
    arrete_abrogation: null,
    ...overrides,
  };
}

function creerReference(overrides: Partial<Reference> = {}): Reference {
  return {
    id: `r-${Math.random().toString(36).slice(2, 8)}`,
    code: "REF-001",
    categorie: "base_legale",
    label: "Code général des collectivités territoriales",
    titulaire: null,
    numero: "CGCT-L2213-1",
    date: "2026-01-01",
    actif: true,
    date_debut_validite: "2026-01-01",
    date_fin_validite: "2027-01-01",
    historique: [],
    ...overrides,
  };
}

// ──── normaliserTexte ────

describe("normaliserTexte", () => {
  it("convertit en minuscules", () => {
    expect(normaliserTexte("Rue DE LA Paix")).toBe("rue de la paix");
  });

  it("supprime les accents et diacritiques", () => {
    expect(normaliserTexte("Réseau éléctrique")).toBe("reseau electrique");
    expect(normaliserTexte("arrêté")).toBe("arrete");
    expect(normaliserTexte("çà")).toBe("ca");
  });

  it("normalise les ligatures", () => {
    expect(normaliserTexte("cœur")).toBe("coeur");
  });

  it("normalise les apostrophes typographiques", () => {
    expect(normaliserTexte("l’arrêté")).toBe("l'arrete");
  });
});

// ──── tokeniser ────

describe("tokeniser", () => {
  it("découpe en mots et filtre les mots vides", () => {
    const tokens = tokeniser("Rue de la Paix");
    expect(tokens).toContain("rue");
    expect(tokens).toContain("paix");
    expect(tokens).not.toContain("de");
    expect(tokens).not.toContain("la");
  });

  it("supprime les mots d'un seul caractère", () => {
    const tokens = tokeniser("a b c test");
    expect(tokens).toEqual(["test"]);
  });

  it("découpe sur les séparateurs", () => {
    const tokens = tokeniser("AR-2026-0100-STA");
    expect(tokens).toContain("ar");
    expect(tokens).toContain("2026");
    expect(tokens).toContain("0100");
    expect(tokens).toContain("sta");
  });
});

// ──── distanceLevenshtein ────

describe("distanceLevenshtein", () => {
  it("retourne 0 pour des chaînes identiques", () => {
    expect(distanceLevenshtein("test", "test")).toBe(0);
  });

  it("retourne la longueur pour une chaîne vide", () => {
    expect(distanceLevenshtein("", "abc")).toBe(3);
    expect(distanceLevenshtein("abc", "")).toBe(3);
  });

  it("calcule la distance correctement", () => {
    expect(distanceLevenshtein("chien", "niche")).toBe(4);
    expect(distanceLevenshtein("kitten", "sitting")).toBe(3);
  });

  it("retourne 1 pour une substitution simple", () => {
    expect(distanceLevenshtein("test", "tast")).toBe(1);
  });
});

// ──── scorerMot ────

describe("scorerMot", () => {
  it("retourne 1 pour un match exact", () => {
    expect(scorerMot("paix", "paix")).toBe(1);
  });

  it("retourne 0.9 pour un match préfixe", () => {
    expect(scorerMot("stat", "stationnement")).toBe(0.9);
  });

  it("retourne 0.7 pour un match substring", () => {
    expect(scorerMot("tion", "stationnement")).toBe(0.7);
  });

  it("retourne 0 pour aucun match", () => {
    expect(scorerMot("xyz", "paix")).toBe(0);
  });

  it("tolère les fautes de frappe (fuzzy)", () => {
    const score = scorerMot("sationnement", "stationnement");
    expect(score).toBeGreaterThan(0);
  });
});

// ──── rechercherGlobal ────

describe("rechercherGlobal", () => {
  const arretes = [
    creerArrete({ id: "a1", titre: "Stationnement interdit Rue de la Paix", numero: "AR-2026-0100-STA" }),
    creerArrete({ id: "a2", titre: "Travaux Boulevard Victor Hugo", type_code: "travaux", type_label: "Travaux", numero: "AR-2026-0101-TRX", voies: ["Boulevard Victor Hugo"] }),
    creerArrete({ id: "a3", titre: "Déviation Route de Paris", type_code: "circulation_interdite", type_label: "Circulation interdite", numero: "AR-2026-0102-CIR", voies: ["Route de Paris"] }),
  ];
  const refs = [
    creerReference({ id: "r1", label: "Code général des collectivités territoriales" }),
  ];

  it("trouve un arrêté par titre", () => {
    const resultats = rechercherGlobal(arretes, refs, "stationnement");
    expect(resultats.length).toBeGreaterThanOrEqual(1);
    expect(resultats[0]!.id).toBe("a1");
  });

  it("trouve un arrêté par numéro", () => {
    const resultats = rechercherGlobal(arretes, refs, "AR-2026-0101");
    expect(resultats.length).toBeGreaterThanOrEqual(1);
    expect(resultats[0]!.id).toBe("a2");
  });

  it("trouve un arrêté par voie", () => {
    const resultats = rechercherGlobal(arretes, refs, "Victor Hugo");
    expect(resultats.length).toBeGreaterThanOrEqual(1);
    expect(resultats[0]!.id).toBe("a2");
  });

  it("trouve une référence par label", () => {
    const resultats = rechercherGlobal(arretes, refs, "collectivités territoriales");
    expect(resultats.length).toBeGreaterThanOrEqual(1);
    expect(resultats.some((r) => r.type === "reference")).toBe(true);
  });

  it("recherche multi-mots (ET logique)", () => {
    const resultats = rechercherGlobal(arretes, refs, "travaux boulevard");
    expect(resultats.length).toBe(1);
    expect(resultats[0]!.id).toBe("a2");
  });

  it("retourne des résultats vides pour une requête sans match", () => {
    const resultats = rechercherGlobal(arretes, refs, "xyztotalementinexistant");
    expect(resultats).toHaveLength(0);
  });

  it("filtre par type", () => {
    const resultats = rechercherGlobal(arretes, refs, "", { types: ["travaux"] });
    expect(resultats).toHaveLength(1);
    expect(resultats[0]!.id).toBe("a2");
  });

  it("filtre par statut", () => {
    const arretesBrouillon = [
      creerArrete({ id: "b1", statut: "brouillon" }),
      creerArrete({ id: "b2", statut: "publie" }),
    ];
    const resultats = rechercherGlobal(arretesBrouillon, [], "", { statuts: ["brouillon"] });
    expect(resultats).toHaveLength(1);
    expect(resultats[0]!.id).toBe("b1");
  });

  it("filtre par scope arretes uniquement", () => {
    const resultats = rechercherGlobal(arretes, refs, "general", { scope: "arretes" });
    expect(resultats.every((r) => r.type === "arrete")).toBe(true);
  });

  it("filtre par scope references uniquement", () => {
    const resultats = rechercherGlobal(arretes, refs, "general", { scope: "references" });
    expect(resultats.every((r) => r.type === "reference")).toBe(true);
  });

  it("trie par pertinence (meilleur score d'abord)", () => {
    const resultats = rechercherGlobal(arretes, refs, "travaux");
    if (resultats.length > 1) {
      for (let i = 1; i < resultats.length; i++) {
        expect(resultats[i]!.score).toBeLessThanOrEqual(resultats[i - 1]!.score);
      }
    }
  });

  it("gère la recherche sans accent", () => {
    const resultats = rechercherGlobal(arretes, refs, "deviation");
    expect(resultats.length).toBeGreaterThanOrEqual(1);
    expect(resultats[0]!.id).toBe("a3");
  });
});

// ──── genererSuggestions ────

describe("genererSuggestions", () => {
  const arretes = [
    creerArrete({ titre: "Stationnement Rue de la Paix", voies: ["Rue de la Paix", "Rue Victor Hugo"] }),
    creerArrete({ titre: "Travaux Boulevard Victor Hugo", voies: ["Boulevard Victor Hugo"] }),
  ];

  it("génère des suggestions basées sur la saisie", () => {
    const suggestions = genererSuggestions(arretes, [], "Victor");
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions.some((s) => s.texte.includes("Victor Hugo"))).toBe(true);
  });

  it("ne génère rien pour une saisie trop courte", () => {
    const suggestions = genererSuggestions(arretes, [], "V");
    expect(suggestions).toHaveLength(0);
  });

  it("regroupe les suggestions par catégorie", () => {
    const suggestions = genererSuggestions(arretes, [], "Hugo");
    const categories = new Set(suggestions.map((s) => s.categorie));
    expect(categories.size).toBeGreaterThanOrEqual(1);
  });
});

// ──── surbriller ────

describe("surbriller", () => {
  it("découpe le texte en fragments avec surbrillance", () => {
    const fragments = surbriller("Rue de la Paix", [[0, 3]]);
    expect(fragments).toHaveLength(2);
    expect(fragments[0]!.texte).toBe("Rue");
    expect(fragments[0]!.surbrillance).toBe(true);
    expect(fragments[1]!.texte).toBe(" de la Paix");
    expect(fragments[1]!.surbrillance).toBe(false);
  });

  it("retourne le texte entier sans surbrillance si pas de positions", () => {
    const fragments = surbriller("test", []);
    expect(fragments).toHaveLength(1);
    expect(fragments[0]!.surbrillance).toBe(false);
  });

  it("gère plusieurs positions", () => {
    const fragments = surbriller("abcdefgh", [[0, 2], [5, 7]]);
    expect(fragments).toHaveLength(4);
    expect(fragments[0]!.surbrillance).toBe(true);
    expect(fragments[1]!.surbrillance).toBe(false);
    expect(fragments[2]!.surbrillance).toBe(true);
    expect(fragments[3]!.surbrillance).toBe(false);
  });
});

// ──── calculerFacettes ────

describe("calculerFacettes", () => {
  it("compte les types d'arrêtés", () => {
    const arretes = [
      creerArrete({ type_code: "travaux", type_label: "Travaux" }),
      creerArrete({ type_code: "travaux", type_label: "Travaux" }),
      creerArrete({ type_code: "stationnement_interdit", type_label: "Stationnement" }),
    ];
    const facettes = calculerFacettes(arretes);
    expect(facettes.types).toHaveLength(2);
    expect(facettes.types[0]!.code).toBe("travaux");
    expect(facettes.types[0]!.count).toBe(2);
  });

  it("compte les statuts", () => {
    const arretes = [
      creerArrete({ statut: "publie" }),
      creerArrete({ statut: "publie" }),
      creerArrete({ statut: "brouillon" }),
    ];
    const facettes = calculerFacettes(arretes);
    expect(facettes.statuts).toHaveLength(2);
  });

  it("compte les voies", () => {
    const arretes = [
      creerArrete({ voies: ["Rue de la Paix", "Boulevard Hugo"] }),
      creerArrete({ voies: ["Rue de la Paix"] }),
    ];
    const facettes = calculerFacettes(arretes);
    const ruePaix = facettes.voies.find((v) => v.nom === "Rue de la Paix");
    expect(ruePaix?.count).toBe(2);
  });

  it("compte les auteurs", () => {
    const arretes = [
      creerArrete({ cree_par: "Agent A" }),
      creerArrete({ cree_par: "Agent A" }),
      creerArrete({ cree_par: "Agent B" }),
    ];
    const facettes = calculerFacettes(arretes);
    expect(facettes.auteurs).toHaveLength(2);
    expect(facettes.auteurs[0]!.nom).toBe("Agent A");
    expect(facettes.auteurs[0]!.count).toBe(2);
  });
});
