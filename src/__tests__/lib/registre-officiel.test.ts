import { describe, it, expect, beforeEach } from "vitest";
import {
  getRegistre,
  inscrireAuRegistre,
  genererNumeroRegistre,
  prochainNumeroOrdre,
  cloturerRegistre,
  synchroniserRegistre,
  majEntreeRegistre,
} from "@/lib/registre-officiel";
import type { Arrete } from "@/types";

const TENANT = "TEST_REGISTRE";

function creerArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    numero: "AR-2026-0001-STA",
    titre: "Test arrêté stationnement",
    type_code: "stationnement_interdit",
    type_label: "Stationnement",
    commune_id: "c1",
    statut: "publie",
    date_debut: "2026-06-01",
    date_fin: "2026-08-31",
    date_creation: "2026-05-20",
    cree_par: "Agent Test",
    voies: ["Rue de la Paix"],
    troncons: [],
    versions: [],
    arrete_abrogation: null,
    ...overrides,
  };
}

describe("Registre officiel (CGCT art. L2122-29)", () => {
  beforeEach(() => {
    // Nettoyer le localStorage entre les tests
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("registre_officiel_TEST_REGISTRE")) {
        keys.push(key);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  });

  describe("genererNumeroRegistre", () => {
    it("génère le format ARR-YYYY-NNNN", () => {
      expect(genererNumeroRegistre(2026, 1)).toBe("ARR-2026-0001");
      expect(genererNumeroRegistre(2026, 42)).toBe("ARR-2026-0042");
      expect(genererNumeroRegistre(2025, 999)).toBe("ARR-2025-0999");
    });

    it("padde les numéros sur 4 chiffres", () => {
      const numero = genererNumeroRegistre(2026, 7);
      expect(numero).toBe("ARR-2026-0007");
    });
  });

  describe("getRegistre", () => {
    it("retourne un registre vide pour une année sans données", () => {
      const registre = getRegistre(TENANT, 2026);
      expect(registre.annee).toBe(2026);
      expect(registre.tenant_id).toBe(TENANT);
      expect(registre.entrees).toHaveLength(0);
      expect(registre.cloture).toBe(false);
    });
  });

  describe("prochainNumeroOrdre", () => {
    it("retourne 1 pour un registre vide", () => {
      expect(prochainNumeroOrdre(TENANT, 2026)).toBe(1);
    });

    it("retourne le prochain numéro après inscription", () => {
      const arrete = creerArrete();
      inscrireAuRegistre(TENANT, arrete, "Agent");
      expect(prochainNumeroOrdre(TENANT, new Date().getFullYear())).toBe(2);
    });
  });

  describe("inscrireAuRegistre", () => {
    it("inscrit un arrêté et retourne le numéro de registre", () => {
      const arrete = creerArrete();
      const numero = inscrireAuRegistre(TENANT, arrete, "Agent Test");
      expect(numero).toMatch(/^ARR-\d{4}-0001$/);

      const registre = getRegistre(TENANT, new Date().getFullYear());
      expect(registre.entrees).toHaveLength(1);
      expect(registre.entrees[0]!.arrete_id).toBe(arrete.id);
      expect(registre.entrees[0]!.titre).toBe("Test arrêté stationnement");
      expect(registre.entrees[0]!.auteur).toBe("Agent Test");
    });

    it("évite les doublons (même arrêté inscrit deux fois)", () => {
      const arrete = creerArrete({ id: "doublon-test" });
      const num1 = inscrireAuRegistre(TENANT, arrete, "Agent");
      const num2 = inscrireAuRegistre(TENANT, arrete, "Agent");
      expect(num1).toBe(num2);

      const registre = getRegistre(TENANT, new Date().getFullYear());
      expect(registre.entrees).toHaveLength(1);
    });

    it("incrémente le numéro d'ordre pour chaque nouvel arrêté", () => {
      const a1 = creerArrete({ id: "reg-1" });
      const a2 = creerArrete({ id: "reg-2" });
      const a3 = creerArrete({ id: "reg-3" });

      inscrireAuRegistre(TENANT, a1, "Agent");
      inscrireAuRegistre(TENANT, a2, "Agent");
      inscrireAuRegistre(TENANT, a3, "Agent");

      const registre = getRegistre(TENANT, new Date().getFullYear());
      expect(registre.entrees).toHaveLength(3);
      expect(registre.entrees[0]!.numero_ordre).toBe(1);
      expect(registre.entrees[1]!.numero_ordre).toBe(2);
      expect(registre.entrees[2]!.numero_ordre).toBe(3);
    });

    it("rejette l'inscription sur un registre clôturé", () => {
      cloturerRegistre(TENANT, new Date().getFullYear(), "Admin");
      const arrete = creerArrete();
      expect(() => inscrireAuRegistre(TENANT, arrete, "Agent")).toThrow(/cloture/);
    });
  });

  describe("cloturerRegistre", () => {
    it("clôture le registre d'une année", () => {
      const annee = new Date().getFullYear();
      cloturerRegistre(TENANT, annee, "Admin Test");

      const registre = getRegistre(TENANT, annee);
      expect(registre.cloture).toBe(true);
      expect(registre.auteur_cloture).toBe("Admin Test");
      expect(registre.date_cloture).toBeTruthy();
    });
  });

  describe("majEntreeRegistre", () => {
    it("met à jour le statut et la date d'abrogation", () => {
      const arrete = creerArrete({ id: "maj-test" });
      inscrireAuRegistre(TENANT, arrete, "Agent");

      majEntreeRegistre(TENANT, "maj-test", {
        statut: "abroge",
        date_abrogation: "2026-09-15",
        observations: "Abrogé pour motif X",
      });

      const registre = getRegistre(TENANT, new Date().getFullYear());
      const entree = registre.entrees.find((e) => e.arrete_id === "maj-test");
      expect(entree!.statut).toBe("abroge");
      expect(entree!.date_abrogation).toBe("2026-09-15");
      expect(entree!.observations).toBe("Abrogé pour motif X");
    });
  });

  describe("synchroniserRegistre", () => {
    it("inscrit les arrêtés publiés non encore au registre", () => {
      const arretes = [
        creerArrete({ id: "sync-1", statut: "publie" }),
        creerArrete({ id: "sync-2", statut: "publie" }),
        creerArrete({ id: "sync-3", statut: "brouillon" }),
      ];

      const nb = synchroniserRegistre(TENANT, arretes, "Agent Sync");
      expect(nb).toBe(2);

      const registre = getRegistre(TENANT, new Date().getFullYear());
      expect(registre.entrees).toHaveLength(2);
    });

    it("ne réinscrit pas les arrêtés déjà au registre", () => {
      const arrete = creerArrete({ id: "sync-exist", statut: "publie" });
      inscrireAuRegistre(TENANT, arrete, "Agent");

      const nb = synchroniserRegistre(TENANT, [arrete], "Agent Sync");
      expect(nb).toBe(0);
    });

    it("inscrit les arrêtés modifiés et abrogés", () => {
      const arretes = [
        creerArrete({ id: "sync-mod", statut: "modifie" }),
        creerArrete({ id: "sync-abr", statut: "abroge" }),
      ];

      const nb = synchroniserRegistre(TENANT, arretes, "Agent Sync");
      expect(nb).toBe(2);
    });

    it("ignore les arrêtés dont l'année est clôturée", () => {
      const annee = new Date().getFullYear();
      cloturerRegistre(TENANT, annee, "Admin");

      const arretes = [creerArrete({ id: "sync-cloture", statut: "publie" })];
      const nb = synchroniserRegistre(TENANT, arretes, "Agent");
      expect(nb).toBe(0);
    });
  });
});
