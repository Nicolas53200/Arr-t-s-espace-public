import { describe, it, expect } from "vitest";
import {
  arreteParMois,
  arreteParType,
  arreteParStatut,
  tauxAbrogation,
  delaiMoyenPublication,
} from "@/lib/analytics";
import type { Arrete } from "@/types";

function creerArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: "a1",
    numero: "ARR-001",
    titre: "Test",
    type_code: "circulation_interdite",
    type_label: "Circulation interdite",
    statut: "publie",
    cree_par: "u1",
    date_creation: "2026-03-15",
    date_debut: "2026-03-20",
    date_fin: "2026-04-20",
    voies: [],
    troncons: [],
    versions: [],
    arrete_abrogation: null,
    ...overrides,
  };
}

describe("arreteParMois", () => {
  it("regroupe les arretes par mois de creation", () => {
    const arretes = [
      creerArrete({ id: "1", date_creation: "2026-03-10" }),
      creerArrete({ id: "2", date_creation: "2026-03-25" }),
      creerArrete({ id: "3", date_creation: "2026-04-05" }),
    ];

    const result = arreteParMois(arretes);
    expect(result).toHaveLength(2);
    expect(result[0]!.count).toBe(2);
    expect(result[1]!.count).toBe(1);
  });

  it("retourne un tableau vide pour aucun arrete", () => {
    expect(arreteParMois([])).toEqual([]);
  });
});

describe("arreteParType", () => {
  it("compte les arretes par type", () => {
    const arretes = [
      creerArrete({ id: "1", type_code: "circulation_interdite" }),
      creerArrete({ id: "2", type_code: "circulation_interdite" }),
      creerArrete({ id: "3", type_code: "travaux" }),
    ];

    const result = arreteParType(arretes);
    const circulation = result.find((r) => r.type === "circulation_interdite");
    const travaux = result.find((r) => r.type === "travaux");

    expect(circulation?.count).toBe(2);
    expect(travaux?.count).toBe(1);
  });

  it("associe une couleur a chaque type", () => {
    const arretes = [creerArrete()];
    const result = arreteParType(arretes);
    expect(result[0]!.couleur).toMatch(/^#/);
  });
});

describe("arreteParStatut", () => {
  it("compte les arretes par statut", () => {
    const arretes = [
      creerArrete({ id: "1", statut: "publie" }),
      creerArrete({ id: "2", statut: "publie" }),
      creerArrete({ id: "3", statut: "brouillon" }),
    ];

    const result = arreteParStatut(arretes);
    const publie = result.find((r) => r.statut === "publie");
    const brouillon = result.find((r) => r.statut === "brouillon");

    expect(publie?.count).toBe(2);
    expect(brouillon?.count).toBe(1);
  });
});

describe("tauxAbrogation", () => {
  it("calcule le pourcentage d'arretes abroges", () => {
    const actifs = [creerArrete({ id: "1" }), creerArrete({ id: "2" })];
    const historique = [
      creerArrete({ id: "3", statut: "abroge" }),
      creerArrete({ id: "4", statut: "publie" }),
    ];

    expect(tauxAbrogation(actifs, historique)).toBe(25);
  });

  it("retourne 0 si aucun arrete", () => {
    expect(tauxAbrogation([], [])).toBe(0);
  });
});

describe("delaiMoyenPublication", () => {
  it("calcule le delai moyen entre creation et debut", () => {
    const arretes = [
      creerArrete({ date_creation: "2026-03-10", date_debut: "2026-03-15", statut: "publie" }),
      creerArrete({ id: "2", date_creation: "2026-03-10", date_debut: "2026-03-20", statut: "publie" }),
    ];

    const delai = delaiMoyenPublication(arretes);
    expect(delai).toBe(8);
  });

  it("retourne 0 si aucun arrete publie", () => {
    const arretes = [creerArrete({ statut: "brouillon" })];
    expect(delaiMoyenPublication(arretes)).toBe(0);
  });
});
