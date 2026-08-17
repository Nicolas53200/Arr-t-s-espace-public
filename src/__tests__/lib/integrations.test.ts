import { describe, it, expect } from "vitest";
import {
  classifierActe,
  formaterPourActes,
  estEligibleTransmission,
  genererEnveloppeActes,
  formaterPourOpenData,
  exporterCsvOpenData,
  arreteVersICal,
  genererICal,
  construirePayloadWebhook,
  filtrerEndpoints,
  signerPayload,
  validerConfigActes,
  validerConfigOpenData,
  validerConfigIParapheur,
  validerConfigSmtp,
  validerWebhookEndpoint,
  resumerTransmissions,
  configActesDefaut,
  configOpenDataDefaut,
  configIParapheurDefaut,
  configICalDefaut,
  configWebhookDefaut,
  configSmtpDefaut,
  LABELS_CLASSIFICATION,
  LABELS_EVENEMENTS,
  TOUS_EVENEMENTS,
} from "@/lib/integrations";
import type { Arrete, WebhookEndpoint, HistoriqueTransmission, EvenementWebhook } from "@/types";

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

// ──── classifierActe ────

describe("classifierActe", () => {
  it("classe les arrêtés de voirie en 5_domaine_voirie", () => {
    expect(classifierActe("circulation_interdite")).toBe("5_domaine_voirie");
    expect(classifierActe("stationnement_interdit")).toBe("5_domaine_voirie");
    expect(classifierActe("travaux")).toBe("5_domaine_voirie");
    expect(classifierActe("zone_30")).toBe("5_domaine_voirie");
    expect(classifierActe("pietonnisation")).toBe("5_domaine_voirie");
  });

  it("classe les arrêtés de police en 3_police", () => {
    expect(classifierActe("manifestation")).toBe("3_police");
    expect(classifierActe("nuisances_sonores")).toBe("3_police");
    expect(classifierActe("peril")).toBe("3_police");
    expect(classifierActe("debit_boissons")).toBe("3_police");
  });

  it("retourne 9_autres pour un type inconnu", () => {
    expect(classifierActe("inconnu")).toBe("9_autres");
    expect(classifierActe("autre")).toBe("9_autres");
  });
});

// ──── formaterPourActes ────

describe("formaterPourActes", () => {
  it("formate un arrêté pour la télétransmission", () => {
    const arrete = creerArrete();
    const donnees = formaterPourActes(arrete, "123456789");

    expect(donnees.numero_acte).toBe("AR-2026-0100-STA");
    expect(donnees.objet).toBe("Stationnement interdit Rue de la Paix");
    expect(donnees.nature).toBe("arrete");
    expect(donnees.siren_emetteur).toBe("123456789");
    expect(donnees.classification).toBe("5_domaine_voirie");
  });

  it("accepte une classification personnalisée", () => {
    const arrete = creerArrete();
    const donnees = formaterPourActes(arrete, "123456789", "3_police");
    expect(donnees.classification).toBe("3_police");
  });
});

// ──── estEligibleTransmission ────

describe("estEligibleTransmission", () => {
  it("accepte un arrêté publié", () => {
    const arrete = creerArrete({ statut: "publie" });
    const result = estEligibleTransmission(arrete);
    expect(result.eligible).toBe(true);
  });

  it("accepte un arrêté modifié", () => {
    const arrete = creerArrete({ statut: "modifie" });
    const result = estEligibleTransmission(arrete);
    expect(result.eligible).toBe(true);
  });

  it("refuse un arrêté en brouillon", () => {
    const arrete = creerArrete({ statut: "brouillon" });
    const result = estEligibleTransmission(arrete);
    expect(result.eligible).toBe(false);
    expect(result.raison).toContain("publié");
  });

  it("refuse un arrêté sans numéro", () => {
    const arrete = creerArrete({ numero: "" });
    const result = estEligibleTransmission(arrete);
    expect(result.eligible).toBe(false);
    expect(result.raison).toContain("numéro");
  });

  it("refuse un arrêté sans titre", () => {
    const arretePub = creerArrete({ titre: "", statut: "publie" });
    const result = estEligibleTransmission(arretePub);
    expect(result.eligible).toBe(false);
    expect(result.raison).toContain("titre");
  });
});

// ──── genererEnveloppeActes ────

describe("genererEnveloppeActes", () => {
  it("génère un XML valide", () => {
    const arrete = creerArrete();
    const donnees = formaterPourActes(arrete, "123456789");
    const xml = genererEnveloppeActes(donnees);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<NumeroActe>AR-2026-0100-STA</NumeroActe>");
    expect(xml).toContain("<SirenEmetteur>123456789</SirenEmetteur>");
    expect(xml).toContain("<NatureActe>arrete</NatureActe>");
  });

  it("échappe les caractères spéciaux XML", () => {
    const arrete = creerArrete({ titre: "Arrêté <test> & \"spécial\"" });
    const donnees = formaterPourActes(arrete, "123456789");
    const xml = genererEnveloppeActes(donnees);

    expect(xml).toContain("&lt;test&gt;");
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
  });
});

// ──── formaterPourOpenData ────

describe("formaterPourOpenData", () => {
  it("formate les arrêtés pour Open Data", () => {
    const arretes = [creerArrete(), creerArrete({ titre: "Travaux" })];
    const result = formaterPourOpenData(arretes, {
      nom_collectivite: "Laval",
      siren: "123456789",
      licence: "lo_2_0",
    });

    expect(result.titre).toContain("Laval");
    expect(result.licence).toBe("Licence Ouverte 2.0");
    expect(result.ressources).toHaveLength(1);
    expect(result.mots_cles).toContain("Laval");
  });

  it("utilise la licence ODbL quand spécifié", () => {
    const result = formaterPourOpenData([], {
      nom_collectivite: "Test",
      siren: "000000000",
      licence: "odbl",
    });
    expect(result.licence).toContain("ODbL");
  });
});

// ──── exporterCsvOpenData ────

describe("exporterCsvOpenData", () => {
  it("génère un CSV avec en-tête et lignes", () => {
    const arretes = [creerArrete()];
    const csv = exporterCsvOpenData(arretes);
    const lignes = csv.split("\n");

    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toContain("numero;titre;type;statut");
    expect(lignes[1]).toContain("AR-2026-0100-STA");
  });

  it("échappe les valeurs contenant des séparateurs", () => {
    const arrete = creerArrete({ titre: "Test; avec point-virgule" });
    const csv = exporterCsvOpenData([arrete]);
    expect(csv).toContain('"Test; avec point-virgule"');
  });

  it("génère un CSV vide avec seulement l'en-tête", () => {
    const csv = exporterCsvOpenData([]);
    const lignes = csv.split("\n");
    expect(lignes).toHaveLength(1);
  });
});

// ──── arreteVersICal ────

describe("arreteVersICal", () => {
  it("convertit un arrêté publié en événement iCal", () => {
    const arrete = creerArrete({ statut: "publie" });
    const evt = arreteVersICal(arrete, "tenant-1");

    expect(evt.uid).toContain("@tenant-1.actes360");
    expect(evt.resume).toContain("[Stationnement interdit]");
    expect(evt.statut).toBe("CONFIRMED");
    expect(evt.lieu).toContain("Rue de la Paix");
    expect(evt.categories).toContain("Stationnement interdit");
  });

  it("marque CANCELLED pour un arrêté abrogé", () => {
    const arrete = creerArrete({ statut: "abroge" });
    const evt = arreteVersICal(arrete, "t1");
    expect(evt.statut).toBe("CANCELLED");
  });

  it("marque TENTATIVE pour un brouillon", () => {
    const arrete = creerArrete({ statut: "brouillon" });
    const evt = arreteVersICal(arrete, "t1");
    expect(evt.statut).toBe("TENTATIVE");
  });
});

// ──── genererICal ────

describe("genererICal", () => {
  it("génère un calendrier iCal valide", () => {
    const arrete = creerArrete();
    const evt = arreteVersICal(arrete, "t1");
    const ical = genererICal([evt], "Arrêtés Laval");

    expect(ical).toContain("BEGIN:VCALENDAR");
    expect(ical).toContain("END:VCALENDAR");
    expect(ical).toContain("BEGIN:VEVENT");
    expect(ical).toContain("END:VEVENT");
    expect(ical).toContain("X-WR-CALNAME:Arrêtés Laval");
    expect(ical).toContain("PRODID:-//Actes360//Arretes//FR");
  });

  it("ajoute un rappel si spécifié", () => {
    const evt = arreteVersICal(creerArrete(), "t1");
    const ical = genererICal([evt], "Test", 30);

    expect(ical).toContain("BEGIN:VALARM");
    expect(ical).toContain("TRIGGER:-PT30M");
    expect(ical).toContain("END:VALARM");
  });

  it("n'ajoute pas de rappel si non spécifié", () => {
    const evt = arreteVersICal(creerArrete(), "t1");
    const ical = genererICal([evt], "Test");

    expect(ical).not.toContain("BEGIN:VALARM");
  });

  it("formate les dates au format iCal (YYYYMMDD)", () => {
    const arrete = creerArrete({ date_debut: "2026-06-01", date_fin: "2026-08-31" });
    const evt = arreteVersICal(arrete, "t1");
    const ical = genererICal([evt], "Test");

    expect(ical).toContain("DTSTART;VALUE=DATE:20260601");
    expect(ical).toContain("DTEND;VALUE=DATE:20260831");
  });
});

// ──── construirePayloadWebhook ────

describe("construirePayloadWebhook", () => {
  it("construit un payload webhook", () => {
    const payload = construirePayloadWebhook("arrete.publie", "tenant-1", { id: "a1", numero: "AR-001" });

    expect(payload.evenement).toBe("arrete.publie");
    expect(payload.tenant_id).toBe("tenant-1");
    expect(payload.data).toEqual({ id: "a1", numero: "AR-001" });
    expect(payload.timestamp).toBeDefined();
  });
});

// ──── filtrerEndpoints ────

describe("filtrerEndpoints", () => {
  const endpoints: WebhookEndpoint[] = [
    { id: "1", url: "https://a.com", nom: "A", evenements: ["arrete.publie", "arrete.cree"], headers: {}, secret: "s", actif: true },
    { id: "2", url: "https://b.com", nom: "B", evenements: ["arrete.publie"], headers: {}, secret: "s", actif: true },
    { id: "3", url: "https://c.com", nom: "C", evenements: ["arrete.cree"], headers: {}, secret: "s", actif: false },
  ];

  it("filtre par événement", () => {
    const result = filtrerEndpoints(endpoints, "arrete.publie");
    expect(result).toHaveLength(2);
  });

  it("exclut les endpoints inactifs", () => {
    const result = filtrerEndpoints(endpoints, "arrete.cree");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("1");
  });

  it("retourne vide si aucun endpoint ne correspond", () => {
    const result = filtrerEndpoints(endpoints, "reference.expiree");
    expect(result).toHaveLength(0);
  });
});

// ──── signerPayload ────

describe("signerPayload", () => {
  it("produit une signature déterministe", () => {
    const sig1 = signerPayload("test", "secret");
    const sig2 = signerPayload("test", "secret");
    expect(sig1).toBe(sig2);
  });

  it("produit des signatures différentes pour des payloads différents", () => {
    const sig1 = signerPayload("test1", "secret");
    const sig2 = signerPayload("test2", "secret");
    expect(sig1).not.toBe(sig2);
  });

  it("commence par sha256=", () => {
    const sig = signerPayload("data", "key");
    expect(sig.startsWith("sha256=")).toBe(true);
  });
});

// ──── Validation des configurations ────

describe("validerConfigActes", () => {
  it("accepte une configuration valide", () => {
    const config = { ...configActesDefaut("123456789"), url_teletransmission: "https://actes.gouv.fr" };
    expect(validerConfigActes(config)).toHaveLength(0);
  });

  it("refuse un SIREN invalide", () => {
    const config = { ...configActesDefaut("123"), url_teletransmission: "https://actes.gouv.fr" };
    const erreurs = validerConfigActes(config);
    expect(erreurs.some((e) => e.champ === "siren")).toBe(true);
  });

  it("refuse une URL vide", () => {
    const config = configActesDefaut("123456789");
    const erreurs = validerConfigActes(config);
    expect(erreurs.some((e) => e.champ === "url_teletransmission")).toBe(true);
  });

  it("refuse une URL invalide", () => {
    const config = { ...configActesDefaut("123456789"), url_teletransmission: "pas-une-url" };
    const erreurs = validerConfigActes(config);
    expect(erreurs.some((e) => e.champ === "url_teletransmission")).toBe(true);
  });
});

describe("validerConfigOpenData", () => {
  it("accepte une configuration valide", () => {
    const config = { ...configOpenDataDefaut(), api_key: "key123", organisation_id: "org456" };
    expect(validerConfigOpenData(config)).toHaveLength(0);
  });

  it("refuse une clé API vide", () => {
    const config = { ...configOpenDataDefaut(), organisation_id: "org456" };
    const erreurs = validerConfigOpenData(config);
    expect(erreurs.some((e) => e.champ === "api_key")).toBe(true);
  });
});

describe("validerConfigIParapheur", () => {
  it("accepte une configuration valide", () => {
    const config = { ...configIParapheurDefaut(), url_service: "https://iparapheur.test.fr", identifiant: "user1", sous_type: "arrete" };
    expect(validerConfigIParapheur(config)).toHaveLength(0);
  });

  it("refuse une URL vide", () => {
    const erreurs = validerConfigIParapheur(configIParapheurDefaut());
    expect(erreurs.some((e) => e.champ === "url_service")).toBe(true);
  });
});

describe("validerConfigSmtp", () => {
  it("accepte une configuration valide", () => {
    const config = { ...configSmtpDefaut(), hote: "smtp.test.fr", email_expediteur: "test@test.fr" };
    expect(validerConfigSmtp(config)).toHaveLength(0);
  });

  it("refuse un port invalide", () => {
    const config = { ...configSmtpDefaut(), hote: "smtp.test.fr", port: 0, email_expediteur: "test@test.fr" };
    const erreurs = validerConfigSmtp(config);
    expect(erreurs.some((e) => e.champ === "port")).toBe(true);
  });

  it("refuse un email invalide", () => {
    const config = { ...configSmtpDefaut(), hote: "smtp.test.fr", email_expediteur: "pas-un-email" };
    const erreurs = validerConfigSmtp(config);
    expect(erreurs.some((e) => e.champ === "email_expediteur")).toBe(true);
  });
});

describe("validerWebhookEndpoint", () => {
  it("accepte un endpoint valide", () => {
    const endpoint = {
      url: "https://hook.test.fr/callback",
      nom: "Mon webhook",
      evenements: ["arrete.publie" as const],
      headers: {},
      secret: "s",
      actif: true,
    };
    expect(validerWebhookEndpoint(endpoint)).toHaveLength(0);
  });

  it("refuse un endpoint sans événements", () => {
    const endpoint = {
      url: "https://hook.test.fr",
      nom: "Test",
      evenements: [] as EvenementWebhook[],
      headers: {},
      secret: "s",
      actif: true,
    };
    const erreurs = validerWebhookEndpoint(endpoint);
    expect(erreurs.some((e) => e.champ === "evenements")).toBe(true);
  });
});

// ──── resumerTransmissions ────

describe("resumerTransmissions", () => {
  it("résume un historique vide", () => {
    const resume = resumerTransmissions([]);
    expect(resume.total).toBe(0);
    expect(resume.taux_reussite).toBe(0);
  });

  it("compte correctement les statuts", () => {
    const historique: HistoriqueTransmission[] = [
      { id: "1", integration_code: "actes_tdt", entite_id: "a1", entite_label: "AR-001", action: "test", statut: "transmis", date: "2026-01-01" },
      { id: "2", integration_code: "actes_tdt", entite_id: "a2", entite_label: "AR-002", action: "test", statut: "transmis", date: "2026-01-02" },
      { id: "3", integration_code: "actes_tdt", entite_id: "a3", entite_label: "AR-003", action: "test", statut: "erreur", date: "2026-01-03" },
      { id: "4", integration_code: "actes_tdt", entite_id: "a4", entite_label: "AR-004", action: "test", statut: "en_attente", date: "2026-01-04" },
    ];

    const resume = resumerTransmissions(historique);
    expect(resume.total).toBe(4);
    expect(resume.reussies).toBe(2);
    expect(resume.en_erreur).toBe(1);
    expect(resume.en_attente).toBe(1);
    expect(resume.taux_reussite).toBe(50);
    expect(resume.derniere_date).toBe("2026-01-04");
  });
});

// ──── Constantes ────

describe("constantes", () => {
  it("LABELS_CLASSIFICATION contient toutes les classifications", () => {
    expect(Object.keys(LABELS_CLASSIFICATION)).toHaveLength(9);
    expect(LABELS_CLASSIFICATION["3_police"]).toContain("Police");
  });

  it("LABELS_EVENEMENTS contient tous les événements", () => {
    expect(Object.keys(LABELS_EVENEMENTS)).toHaveLength(7);
    expect(LABELS_EVENEMENTS["arrete.publie"]).toContain("publié");
  });

  it("TOUS_EVENEMENTS contient 7 événements", () => {
    expect(TOUS_EVENEMENTS).toHaveLength(7);
  });
});

// ──── Configurations par défaut ────

describe("configurations par défaut", () => {
  it("configActesDefaut inclut le SIREN", () => {
    const config = configActesDefaut("999888777");
    expect(config.siren).toBe("999888777");
    expect(config.envoi_auto).toBe(false);
  });

  it("configOpenDataDefaut a les bonnes valeurs", () => {
    const config = configOpenDataDefaut();
    expect(config.frequence).toBe("mensuel");
    expect(config.licence).toBe("lo_2_0");
  });

  it("configIParapheurDefaut utilise la signature avancée", () => {
    const config = configIParapheurDefaut();
    expect(config.type_signature).toBe("avancee");
  });

  it("configICalDefaut filtre les publiés", () => {
    const config = configICalDefaut();
    expect(config.publies_uniquement).toBe(true);
    expect(config.rappel_minutes).toBe(60);
  });

  it("configWebhookDefaut a un tableau vide", () => {
    const config = configWebhookDefaut();
    expect(config.endpoints).toHaveLength(0);
  });

  it("configSmtpDefaut utilise le port 587", () => {
    const config = configSmtpDefaut();
    expect(config.port).toBe(587);
    expect(config.tls).toBe(true);
  });
});
