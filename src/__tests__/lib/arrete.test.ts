import { describe, it, expect } from "vitest";
import { estExpire, estActif, estEnHistorique, genNum, filtrerArretes } from "@/lib/arrete";
import type { Arrete } from "@/types";

function makeArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: "test",
    numero: "AR-2026-0001-CIR",
    type_code: "circulation_interdite",
    type_label: "Circulation interdite",
    titre: "Test arrêté",
    statut: "publie",
    cree_par: "Test",
    date_creation: "2026-06-01",
    date_debut: "2026-06-01",
    date_fin: "2026-12-31",
    voies: ["Rue Test"],
    troncons: [],
    versions: [],
    arrete_abrogation: null,
    ...overrides,
  };
}

describe("estExpire", () => {
  it("détecte un arrêté expiré", () => {
    expect(estExpire(makeArrete({ date_fin: "2026-01-01" }))).toBe(true);
  });

  it("ne considère pas un arrêté futur comme expiré", () => {
    expect(estExpire(makeArrete({ date_fin: "2027-01-01" }))).toBe(false);
  });

  it("gère l'absence de date_fin", () => {
    expect(estExpire(makeArrete({ date_fin: "" }))).toBe(false);
  });
});

describe("estActif / estEnHistorique", () => {
  it("classe un arrêté abrogé en historique", () => {
    const a = makeArrete({ statut: "abroge" });
    expect(estEnHistorique(a)).toBe(true);
    expect(estActif(a)).toBe(false);
  });

  it("classe un arrêté publié non expiré comme actif", () => {
    const a = makeArrete({ statut: "publie", date_fin: "2027-01-01" });
    expect(estActif(a)).toBe(true);
    expect(estEnHistorique(a)).toBe(false);
  });
});

describe("genNum", () => {
  it("génère un numéro avec padding", () => {
    expect(genNum("CIR", 42)).toBe("AR-2026-0042-CIR");
  });

  it("génère un numéro à 4 chiffres", () => {
    expect(genNum("TRX", 1234)).toBe("AR-2026-1234-TRX");
  });
});

describe("filtrerArretes", () => {
  const liste = [
    makeArrete({ numero: "AR-2026-0001-CIR", titre: "Fermeture Rue X" }),
    makeArrete({ numero: "AR-2026-0002-TRX", titre: "Travaux Avenue Y", type_label: "Travaux" }),
  ];

  it("filtre par numéro", () => {
    expect(filtrerArretes(liste, "0001")).toHaveLength(1);
  });

  it("filtre par titre", () => {
    expect(filtrerArretes(liste, "travaux")).toHaveLength(1);
  });

  it("retourne tout si recherche vide", () => {
    expect(filtrerArretes(liste, "")).toHaveLength(2);
  });

  it("retourne rien si aucun résultat", () => {
    expect(filtrerArretes(liste, "zzzzz")).toHaveLength(0);
  });
});
