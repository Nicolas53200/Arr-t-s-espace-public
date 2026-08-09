import { describe, it, expect } from "vitest";
import { detecterConflits, formaterChevauchement } from "@/lib/conflits";
import type { Arrete } from "@/types";

function creerArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: "a-exist-1",
    numero: "AR-2026-0100-STA",
    titre: "Stationnement Rue de la Paix",
    type_code: "STA",
    type_label: "Stationnement",
    commune_id: "c1",
    statut: "publie",
    date_debut: "2026-06-01",
    date_fin: "2026-08-31",
    date_creation: "2026-05-20",
    auteur: "Agent 1",
    voies: ["Rue de la Paix"],
    troncons: [
      { voie_id: "rue-de-la-paix", label: "Rue de la Paix", impact: "interdiction_stationnement", de: "", a: "", sens: "double" },
    ],
    phases: [],
    visas: [],
    articles: [],
    ...overrides,
  };
}

describe("detecterConflits", () => {
  it("détecte un conflit quand les voies et dates se chevauchent", () => {
    const existants = [creerArrete()];
    const conflits = detecterConflits(
      ["Rue de la Paix"],
      "2026-07-01",
      "2026-09-30",
      ["rue-de-la-paix"],
      existants,
    );
    expect(conflits).toHaveLength(1);
    expect(conflits[0]!.voiesCommunes).toContain("Rue de la Paix");
    expect(conflits[0]!.severite).toBe("critique");
  });

  it("ne détecte pas de conflit quand les dates ne se chevauchent pas", () => {
    const existants = [creerArrete()];
    const conflits = detecterConflits(
      ["Rue de la Paix"],
      "2026-09-01",
      "2026-10-31",
      ["rue-de-la-paix"],
      existants,
    );
    expect(conflits).toHaveLength(0);
  });

  it("ne détecte pas de conflit quand les voies sont différentes", () => {
    const existants = [creerArrete()];
    const conflits = detecterConflits(
      ["Boulevard Victor Hugo"],
      "2026-07-01",
      "2026-09-30",
      ["boulevard-victor-hugo"],
      existants,
    );
    expect(conflits).toHaveLength(0);
  });

  it("exclut l'arrêté en cours de modification", () => {
    const existants = [creerArrete({ id: "a-edit" })];
    const conflits = detecterConflits(
      ["Rue de la Paix"],
      "2026-07-01",
      "2026-09-30",
      ["rue-de-la-paix"],
      existants,
      "a-edit",
    );
    expect(conflits).toHaveLength(0);
  });

  it("ignore les arrêtés abrogés", () => {
    const existants = [creerArrete({ statut: "abroge" })];
    const conflits = detecterConflits(
      ["Rue de la Paix"],
      "2026-07-01",
      "2026-09-30",
      ["rue-de-la-paix"],
      existants,
    );
    expect(conflits).toHaveLength(0);
  });

  it("normalise les noms de voie pour la comparaison (accents, casse, articles)", () => {
    const existants = [creerArrete({ voies: ["Rue de la Paix"] })];
    const conflits = detecterConflits(
      ["rue paix"],
      "2026-07-01",
      "2026-08-01",
      [],
      existants,
    );
    expect(conflits).toHaveLength(1);
  });

  it("trie les conflits critiques en premier", () => {
    const existants = [
      creerArrete({
        id: "a1",
        voies: ["Boulevard Victor Hugo"],
        troncons: [{ voie_id: "blvd-victor-hugo", label: "Boulevard Victor Hugo", impact: "interdiction_stationnement", de: "", a: "", sens: "double" }],
      }),
      creerArrete({
        id: "a2",
        voies: ["Rue de la Paix"],
        troncons: [{ voie_id: "rue-de-la-paix", label: "Rue de la Paix", impact: "interdiction_stationnement", de: "", a: "", sens: "double" }],
      }),
    ];
    const conflits = detecterConflits(
      ["Rue de la Paix", "Boulevard Victor Hugo"],
      "2026-07-01",
      "2026-08-01",
      ["rue-de-la-paix", "blvd-victor-hugo"],
      existants,
    );
    expect(conflits.length).toBeGreaterThanOrEqual(2);
    expect(conflits[0]!.severite).toBe("critique");
  });

  it("gère les arrêtés sans date_fin (permanents)", () => {
    const existants = [creerArrete({ date_fin: "" })];
    const conflits = detecterConflits(
      ["Rue de la Paix"],
      "2030-01-01",
      "2030-06-01",
      ["rue-de-la-paix"],
      existants,
    );
    // L'arrêté permanent (date_fin → 2099) chevauche toujours
    expect(conflits).toHaveLength(1);
  });
});

describe("formaterChevauchement", () => {
  it("formate une période de chevauchement en français", () => {
    const resultat = formaterChevauchement({
      debut: "2026-07-01T00:00:00.000Z",
      fin: "2026-08-31T00:00:00.000Z",
    });
    // Le format dépend de la locale, vérifie juste qu'il contient le tiret
    expect(resultat).toContain("—");
    expect(resultat.length).toBeGreaterThan(5);
  });
});
