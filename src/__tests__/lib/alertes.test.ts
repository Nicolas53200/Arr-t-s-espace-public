import { describe, it, expect, beforeEach } from "vitest";
import {
  detecterExpirations,
  detecterValidationsBloquees,
  detecterRenouvellements,
  bilanVersNotifications,
  calculerBilanAlertes,
} from "@/lib/alertes";
import type { Arrete } from "@/types";

const TENANT = "TEST_ALERTES";

function creerArrete(overrides: Partial<Arrete> = {}): Arrete {
  return {
    id: `a-${Math.random().toString(36).slice(2, 8)}`,
    numero: "AR-2026-0100-STA",
    titre: "Test arrêté",
    type_code: "stationnement_interdit",
    type_label: "Stationnement",
    commune_id: "c1",
    statut: "publie",
    date_debut: "2026-06-01",
    date_fin: "2026-08-31",
    date_creation: "2026-05-20",
    cree_par: "Agent",
    voies: ["Rue de la Paix"],
    troncons: [
      { voie_id: "rue-de-la-paix", label: "Rue de la Paix", impact: "stationnement_interdit" },
    ],
    versions: [],
    arrete_abrogation: null,
    ...overrides,
  };
}

describe("detecterExpirations", () => {
  it("détecte un arrêté qui expire dans 7 jours", () => {
    const dateRef = new Date("2026-08-24");
    const arrete = creerArrete({ date_fin: "2026-08-31", statut: "publie" });
    const alertes = detecterExpirations([arrete], dateRef);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]!.joursRestants).toBe(7);
    expect(alertes[0]!.type).toBe("expire_bientot");
  });

  it("détecte un arrêté déjà expiré", () => {
    const dateRef = new Date("2026-09-05");
    const arrete = creerArrete({ date_fin: "2026-08-31", statut: "publie" });
    const alertes = detecterExpirations([arrete], dateRef);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]!.joursRestants).toBeLessThan(0);
    expect(alertes[0]!.type).toBe("expire");
  });

  it("ne détecte pas un arrêté qui expire dans 60 jours", () => {
    const dateRef = new Date("2026-07-01");
    const arrete = creerArrete({ date_fin: "2026-08-31", statut: "publie" });
    const alertes = detecterExpirations([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });

  it("ignore les brouillons", () => {
    const dateRef = new Date("2026-08-28");
    const arrete = creerArrete({ date_fin: "2026-08-31", statut: "brouillon" });
    const alertes = detecterExpirations([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });

  it("ignore les arrêtés sans date_fin", () => {
    const dateRef = new Date("2026-08-28");
    const arrete = creerArrete({ date_fin: "", statut: "publie" });
    const alertes = detecterExpirations([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });

  it("trie par urgence (les plus urgents d'abord)", () => {
    const dateRef = new Date("2026-08-28");
    const a1 = creerArrete({ id: "a1", date_fin: "2026-09-10", statut: "publie" });
    const a2 = creerArrete({ id: "a2", date_fin: "2026-08-29", statut: "publie" });
    const a3 = creerArrete({ id: "a3", date_fin: "2026-08-20", statut: "publie" });
    const alertes = detecterExpirations([a1, a2, a3], dateRef);
    expect(alertes).toHaveLength(3);
    expect(alertes[0]!.arrete.id).toBe("a3"); // expiré
    expect(alertes[1]!.arrete.id).toBe("a2"); // demain
    expect(alertes[2]!.arrete.id).toBe("a1"); // dans 13j
  });
});

describe("detecterValidationsBloquees", () => {
  it("détecte un arrêté en relecture depuis plus de 5 jours", () => {
    const dateRef = new Date("2026-08-15");
    const arrete = creerArrete({
      statut: "en_relecture",
      date_creation: "2026-08-05",
    });
    const alertes = detecterValidationsBloquees([arrete], dateRef);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]!.joursEnAttente).toBe(10);
  });

  it("ignore un arrêté en relecture depuis 2 jours", () => {
    const dateRef = new Date("2026-08-07");
    const arrete = creerArrete({
      statut: "en_relecture",
      date_creation: "2026-08-05",
    });
    const alertes = detecterValidationsBloquees([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });

  it("ignore les arrêtés publiés", () => {
    const dateRef = new Date("2026-08-20");
    const arrete = creerArrete({
      statut: "publie",
      date_creation: "2026-08-01",
    });
    const alertes = detecterValidationsBloquees([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });
});

describe("detecterRenouvellements", () => {
  it("détecte un arrêté récurrent qui expire dans 30 jours", () => {
    const dateRef = new Date("2026-08-01");
    const arrete = creerArrete({
      date_fin: "2026-08-31",
      statut: "publie",
      recurrence: { type: "hebdomadaire", jours: ["lundi", "mercredi"] },
    });
    const alertes = detecterRenouvellements([arrete], dateRef);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]!.joursRestants).toBe(30);
  });

  it("ignore les arrêtés non récurrents", () => {
    const dateRef = new Date("2026-08-01");
    const arrete = creerArrete({ date_fin: "2026-08-31", statut: "publie" });
    const alertes = detecterRenouvellements([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });

  it("ignore les arrêtés permanents (pas besoin de renouvellement)", () => {
    const dateRef = new Date("2026-08-01");
    const arrete = creerArrete({
      date_fin: "2026-08-31",
      statut: "publie",
      recurrence: { type: "permanent" },
    });
    const alertes = detecterRenouvellements([arrete], dateRef);
    expect(alertes).toHaveLength(0);
  });
});

describe("bilanVersNotifications", () => {
  it("convertit les alertes en notifications triées par priorité", () => {
    const bilan = {
      expirations: [
        { arrete: creerArrete({ numero: "AR-001" }), joursRestants: 1, type: "expire_bientot" as const },
        { arrete: creerArrete({ numero: "AR-002" }), joursRestants: 20, type: "expire_bientot" as const },
      ],
      conflits: [],
      validations: [],
      renouvellements: [],
      registre: [],
      total: 2,
    };

    const notifs = bilanVersNotifications(bilan);
    expect(notifs).toHaveLength(2);
    // La haute priorité d'abord
    expect(notifs[0]!.priorite).toBe("haute");
    expect(notifs[0]!.titre).toContain("AR-001");
  });

  it("génère une notification groupée pour les arrêtés non inscrits au registre", () => {
    const bilan = {
      expirations: [],
      conflits: [],
      validations: [],
      renouvellements: [],
      registre: [
        { arrete: creerArrete() },
        { arrete: creerArrete() },
      ],
      total: 2,
    };

    const notifs = bilanVersNotifications(bilan);
    expect(notifs).toHaveLength(1);
    expect(notifs[0]!.titre).toContain("2 arrete(s)");
    expect(notifs[0]!.type).toBe("alerte");
  });
});

describe("calculerBilanAlertes", () => {
  beforeEach(() => {
    // Nettoyer localStorage
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("registre_officiel_TEST_ALERTES")) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  });

  it("retourne un bilan complet", () => {
    const dateRef = new Date("2026-08-28");
    const arretes = [
      creerArrete({ id: "exp", date_fin: "2026-08-30", statut: "publie" }),
      creerArrete({ id: "val", statut: "en_relecture", date_creation: "2026-08-10" }),
    ];

    const bilan = calculerBilanAlertes(arretes, TENANT, dateRef);
    expect(bilan.expirations.length).toBeGreaterThanOrEqual(1);
    expect(bilan.validations.length).toBeGreaterThanOrEqual(1);
    expect(bilan.total).toBeGreaterThanOrEqual(2);
  });

  it("le total est la somme de toutes les catégories", () => {
    const dateRef = new Date("2026-08-28");
    const arretes = [
      creerArrete({ id: "x", date_fin: "2026-08-29", statut: "publie" }),
    ];
    const bilan = calculerBilanAlertes(arretes, TENANT, dateRef);
    expect(bilan.total).toBe(
      bilan.expirations.length +
      bilan.conflits.length +
      bilan.validations.length +
      bilan.renouvellements.length +
      bilan.registre.length,
    );
  });
});
