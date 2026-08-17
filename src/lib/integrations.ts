// Logique métier pure — Intégrations externes
// Formatage, validation et génération de données pour les systèmes tiers.

import type {
  Arrete,
  DonneesActes,
  ClassificationActe,
  EvenementICal,
  WebhookPayload,
  EvenementWebhook,
  ConfigActesTdt,
  ConfigOpenData,
  ConfigIParapheur,
  ConfigICal,
  ConfigSmtp,
  ConfigWebhook,
  WebhookEndpoint,
  HistoriqueTransmission,
  StatutTransmission,
  DonneesOpenData,
  RessourceOpenData,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// ACTES / TDT — Télétransmission au contrôle de légalité
// ─────────────────────────────────────────────────────────────────────────────

/** Détermine la classification ACTES d'un arrêté selon son type */
export function classifierActe(type_code: string): ClassificationActe {
  const TABLE: Record<string, ClassificationActe> = {
    circulation_interdite: "5_domaine_voirie",
    stationnement_interdit: "5_domaine_voirie",
    alternat: "5_domaine_voirie",
    travaux: "5_domaine_voirie",
    deviation: "5_domaine_voirie",
    zone_30: "5_domaine_voirie",
    pietonnisation: "5_domaine_voirie",
    manifestation: "3_police",
    manifestation_sportive: "3_police",
    marche: "3_police",
    occupation_dp: "5_domaine_voirie",
    demenagement: "3_police",
    nuisances_sonores: "3_police",
    peril: "3_police",
    debit_boissons: "3_police",
    autre: "9_autres",
  };
  return TABLE[type_code] ?? "9_autres";
}

/** Labels lisibles pour les classifications ACTES */
export const LABELS_CLASSIFICATION: Record<ClassificationActe, string> = {
  "1_conseil_municipal": "1 — Conseil municipal",
  "2_budget": "2 — Budget / Finances",
  "3_police": "3 — Police municipale",
  "4_urbanisme": "4 — Urbanisme",
  "5_domaine_voirie": "5 — Domaine / Voirie",
  "6_fonction_publique": "6 — Fonction publique",
  "7_elections": "7 — Élections",
  "8_intercommunalite": "8 — Intercommunalité",
  "9_autres": "9 — Autres",
};

/** Formate un arrêté pour la télétransmission ACTES */
export function formaterPourActes(
  arrete: Arrete,
  siren: string,
  classificationOverride?: ClassificationActe,
): DonneesActes {
  return {
    numero_acte: arrete.numero,
    date_acte: arrete.date_creation,
    objet: arrete.titre,
    classification: classificationOverride ?? classifierActe(arrete.type_code),
    nature: "arrete",
    siren_emetteur: siren,
  };
}

/** Vérifie qu'un arrêté est éligible à la télétransmission */
export function estEligibleTransmission(arrete: Arrete): { eligible: boolean; raison?: string } {
  if (arrete.statut !== "publie" && arrete.statut !== "modifie") {
    return { eligible: false, raison: "L'arrêté doit être publié pour être télétransmis." };
  }
  if (!arrete.numero || arrete.numero.trim() === "") {
    return { eligible: false, raison: "L'arrêté doit avoir un numéro." };
  }
  if (!arrete.titre || arrete.titre.trim() === "") {
    return { eligible: false, raison: "L'arrêté doit avoir un titre." };
  }
  return { eligible: true };
}

/** Génère un XML simplifié ACTES (format envelope) */
export function genererEnveloppeActes(donnees: DonneesActes): string {
  const lignes = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Acte xmlns="urn:dgcl:actes:schema:1.0">',
    `  <NumeroActe>${echapperXml(donnees.numero_acte)}</NumeroActe>`,
    `  <DateActe>${donnees.date_acte}</DateActe>`,
    `  <Objet>${echapperXml(donnees.objet)}</Objet>`,
    `  <Classification>${donnees.classification}</Classification>`,
    `  <NatureActe>${donnees.nature}</NatureActe>`,
    `  <SirenEmetteur>${donnees.siren_emetteur}</SirenEmetteur>`,
    "</Acte>",
  ];
  return lignes.join("\n");
}

function echapperXml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Open Data — Publication data.gouv.fr
// ─────────────────────────────────────────────────────────────────────────────

/** Formate la liste des arrêtés pour la publication Open Data */
export function formaterPourOpenData(
  arretes: Arrete[],
  config: { nom_collectivite: string; siren: string; licence: string },
): DonneesOpenData {
  const maintenant = new Date().toISOString();
  const ressource: RessourceOpenData = {
    titre: "Arrêtés municipaux",
    format: "json",
    donnees: arretes.map((a) => ({
      numero: a.numero,
      titre: a.titre,
      type: a.type_label,
      statut: a.statut,
      date_debut: a.date_debut,
      date_fin: a.date_fin,
      voies: a.voies,
      commune: a.commune ?? config.nom_collectivite,
      date_creation: a.date_creation,
    })),
  };

  return {
    titre: `Arrêtés municipaux — ${config.nom_collectivite}`,
    description: `Jeu de données des arrêtés municipaux de ${config.nom_collectivite} (SIREN ${config.siren}). Mis à jour automatiquement via Actes360.`,
    date_creation: maintenant,
    date_modification: maintenant,
    licence: config.licence === "lo_2_0" ? "Licence Ouverte 2.0" : "Open Database License (ODbL)",
    mots_cles: ["arrêté municipal", "réglementation", "voirie", "police municipale", config.nom_collectivite],
    couverture_territoriale: config.nom_collectivite,
    frequence_mise_a_jour: "mensuelle",
    ressources: [ressource],
  };
}

/** Exporte les arrêtés au format CSV pour Open Data */
export function exporterCsvOpenData(arretes: Arrete[]): string {
  const entete = "numero;titre;type;statut;date_debut;date_fin;voies;commune;date_creation";
  const lignes = arretes.map((a) => {
    const voies = a.voies.join(", ");
    return [
      echapperCsv(a.numero),
      echapperCsv(a.titre),
      echapperCsv(a.type_label),
      a.statut,
      a.date_debut,
      a.date_fin,
      echapperCsv(voies),
      echapperCsv(a.commune ?? ""),
      a.date_creation,
    ].join(";");
  });
  return [entete, ...lignes].join("\n");
}

function echapperCsv(valeur: string): string {
  if (valeur.includes(";") || valeur.includes('"') || valeur.includes("\n")) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

// ─────────────────────────────────────────────────────────────────────────────
// iCal — Export calendrier
// ─────────────────────────────────────────────────────────────────────────────

/** Convertit un arrêté en événement iCal */
export function arreteVersICal(arrete: Arrete, tenantId: string): EvenementICal {
  const statut = arrete.statut === "abroge" ? "CANCELLED" as const
    : arrete.statut === "publie" ? "CONFIRMED" as const
    : "TENTATIVE" as const;

  return {
    uid: `${arrete.id}@${tenantId}.actes360`,
    resume: `[${arrete.type_label}] ${arrete.titre}`,
    description: [
      `Arrêté ${arrete.numero}`,
      `Type : ${arrete.type_label}`,
      `Voies : ${arrete.voies.join(", ")}`,
      arrete.cree_par ? `Créé par : ${arrete.cree_par}` : "",
    ].filter(Boolean).join("\\n"),
    date_debut: arrete.date_debut,
    date_fin: arrete.date_fin,
    lieu: arrete.voies.join(", "),
    categories: [arrete.type_label],
    statut,
  };
}

/** Génère un fichier iCal complet */
export function genererICal(evenements: EvenementICal[], nomCalendrier: string, rappelMinutes?: number): string {
  const lignes: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Actes360//Arretes//FR",
    `X-WR-CALNAME:${nomCalendrier}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const evt of evenements) {
    lignes.push("BEGIN:VEVENT");
    lignes.push(`UID:${evt.uid}`);
    lignes.push(`DTSTART;VALUE=DATE:${formatDateICal(evt.date_debut)}`);
    lignes.push(`DTEND;VALUE=DATE:${formatDateICal(evt.date_fin)}`);
    lignes.push(`SUMMARY:${evt.resume}`);
    lignes.push(`DESCRIPTION:${evt.description}`);
    if (evt.lieu) {
      lignes.push(`LOCATION:${evt.lieu}`);
    }
    lignes.push(`STATUS:${evt.statut}`);
    if (evt.categories.length > 0) {
      lignes.push(`CATEGORIES:${evt.categories.join(",")}`);
    }
    if (rappelMinutes !== undefined && rappelMinutes > 0) {
      lignes.push("BEGIN:VALARM");
      lignes.push("ACTION:DISPLAY");
      lignes.push(`TRIGGER:-PT${rappelMinutes}M`);
      lignes.push(`DESCRIPTION:Rappel: ${evt.resume}`);
      lignes.push("END:VALARM");
    }
    lignes.push("END:VEVENT");
  }

  lignes.push("END:VCALENDAR");
  return lignes.join("\r\n");
}

function formatDateICal(date: string): string {
  return date.replace(/-/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks — Notifications vers systèmes tiers
// ─────────────────────────────────────────────────────────────────────────────

/** Construit le payload d'un webhook */
export function construirePayloadWebhook(
  evenement: EvenementWebhook,
  tenantId: string,
  data: Record<string, unknown>,
): WebhookPayload {
  return {
    evenement,
    timestamp: new Date().toISOString(),
    tenant_id: tenantId,
    data,
  };
}

/** Filtre les endpoints concernés par un événement */
export function filtrerEndpoints(
  endpoints: WebhookEndpoint[],
  evenement: EvenementWebhook,
): WebhookEndpoint[] {
  return endpoints.filter((ep) => ep.actif && ep.evenements.includes(evenement));
}

/** Génère une signature HMAC pour un payload (simulation, simplifié) */
export function signerPayload(payload: string, secret: string): string {
  // En production, utiliser crypto.subtle.sign avec HMAC-SHA256
  // Ici, hash simplifié pour le mock
  let hash = 0;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `sha256=${Math.abs(hash).toString(16).padStart(16, "0")}`;
}

/** Labels lisibles pour les événements webhook */
export const LABELS_EVENEMENTS: Record<EvenementWebhook, string> = {
  "arrete.cree": "Arrêté créé",
  "arrete.modifie": "Arrêté modifié",
  "arrete.publie": "Arrêté publié",
  "arrete.abroge": "Arrêté abrogé",
  "arrete.expire": "Arrêté expiré",
  "reference.modifiee": "Référence modifiée",
  "reference.expiree": "Référence expirée",
};

/** Tous les événements webhook disponibles */
export const TOUS_EVENEMENTS: EvenementWebhook[] = [
  "arrete.cree",
  "arrete.modifie",
  "arrete.publie",
  "arrete.abroge",
  "arrete.expire",
  "reference.modifiee",
  "reference.expiree",
];

// ─────────────────────────────────────────────────────────────────────────────
// Validation des configurations
// ─────────────────────────────────────────────────────────────────────────────

export interface ErreurValidation {
  champ: string;
  message: string;
}

export function validerConfigActes(config: ConfigActesTdt): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  if (!config.url_teletransmission || config.url_teletransmission.trim() === "") {
    erreurs.push({ champ: "url_teletransmission", message: "L'URL du tiers de télétransmission est requise." });
  } else if (!isUrlValide(config.url_teletransmission)) {
    erreurs.push({ champ: "url_teletransmission", message: "L'URL n'est pas valide." });
  }
  if (!config.siren || !/^\d{9}$/.test(config.siren)) {
    erreurs.push({ champ: "siren", message: "Le SIREN doit comporter exactement 9 chiffres." });
  }
  return erreurs;
}

export function validerConfigOpenData(config: ConfigOpenData): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  if (!config.api_key || config.api_key.trim() === "") {
    erreurs.push({ champ: "api_key", message: "La clé API data.gouv.fr est requise." });
  }
  if (!config.organisation_id || config.organisation_id.trim() === "") {
    erreurs.push({ champ: "organisation_id", message: "L'identifiant de l'organisation est requis." });
  }
  return erreurs;
}

export function validerConfigIParapheur(config: ConfigIParapheur): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  if (!config.url_service || config.url_service.trim() === "") {
    erreurs.push({ champ: "url_service", message: "L'URL du service iParapheur est requise." });
  } else if (!isUrlValide(config.url_service)) {
    erreurs.push({ champ: "url_service", message: "L'URL n'est pas valide." });
  }
  if (!config.identifiant || config.identifiant.trim() === "") {
    erreurs.push({ champ: "identifiant", message: "L'identifiant de connexion est requis." });
  }
  if (!config.sous_type || config.sous_type.trim() === "") {
    erreurs.push({ champ: "sous_type", message: "Le sous-type de document est requis." });
  }
  return erreurs;
}

export function validerConfigSmtp(config: ConfigSmtp): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  if (!config.hote || config.hote.trim() === "") {
    erreurs.push({ champ: "hote", message: "Le serveur SMTP est requis." });
  }
  if (!config.port || config.port < 1 || config.port > 65535) {
    erreurs.push({ champ: "port", message: "Le port doit être compris entre 1 et 65535." });
  }
  if (!config.email_expediteur || !isEmailValide(config.email_expediteur)) {
    erreurs.push({ champ: "email_expediteur", message: "L'email d'expédition n'est pas valide." });
  }
  return erreurs;
}

export function validerWebhookEndpoint(endpoint: Omit<WebhookEndpoint, "id">): ErreurValidation[] {
  const erreurs: ErreurValidation[] = [];
  if (!endpoint.url || endpoint.url.trim() === "") {
    erreurs.push({ champ: "url", message: "L'URL du webhook est requise." });
  } else if (!isUrlValide(endpoint.url)) {
    erreurs.push({ champ: "url", message: "L'URL n'est pas valide." });
  }
  if (!endpoint.nom || endpoint.nom.trim() === "") {
    erreurs.push({ champ: "nom", message: "Le nom du webhook est requis." });
  }
  if (endpoint.evenements.length === 0) {
    erreurs.push({ champ: "evenements", message: "Au moins un événement doit être sélectionné." });
  }
  return erreurs;
}

function isUrlValide(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isEmailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────────────────────────────────────────
// Statistiques et résumés
// ─────────────────────────────────────────────────────────────────────────────

/** Résumé de l'historique des transmissions pour une intégration */
export interface ResumeTransmissions {
  total: number;
  reussies: number;
  en_attente: number;
  en_erreur: number;
  taux_reussite: number;
  derniere_date?: string;
}

export function resumerTransmissions(historique: HistoriqueTransmission[]): ResumeTransmissions {
  const total = historique.length;
  if (total === 0) {
    return { total: 0, reussies: 0, en_attente: 0, en_erreur: 0, taux_reussite: 0 };
  }

  const reussies = historique.filter((h) => h.statut === "transmis" || h.statut === "accuse_reception").length;
  const en_attente = historique.filter((h) => h.statut === "en_attente" || h.statut === "en_cours").length;
  const en_erreur = historique.filter((h) => h.statut === "erreur" || h.statut === "rejete").length;

  const triees = [...historique].sort((a, b) => b.date.localeCompare(a.date));

  return {
    total,
    reussies,
    en_attente,
    en_erreur,
    taux_reussite: Math.round((reussies / total) * 100),
    derniere_date: triees[0]?.date,
  };
}

/** Données mock pour l'historique des transmissions */
export function genererHistoriqueMock(code: string): HistoriqueTransmission[] {
  const statuts: StatutTransmission[] = ["transmis", "accuse_reception", "transmis", "erreur", "transmis"];
  const actions: Record<string, string[]> = {
    actes_tdt: ["Télétransmission", "Accusé de réception", "Rejet contrôle"],
    open_data: ["Publication dataset", "Mise à jour ressource"],
    iparapheur: ["Envoi pour signature", "Signature obtenue", "Rejet"],
    ical: ["Génération flux iCal"],
    webhooks: ["Envoi notification", "Retry notification"],
    smtp: ["Envoi email", "Envoi rapport quotidien"],
  };

  const actsForCode = actions[code] ?? ["Action"];
  const resultats: HistoriqueTransmission[] = [];

  for (let i = 0; i < 8; i++) {
    const statut = statuts[i % statuts.length] ?? "transmis";
    const jour = new Date();
    jour.setDate(jour.getDate() - i * 3);

    resultats.push({
      id: `ht-${code}-${i}`,
      integration_code: code as HistoriqueTransmission["integration_code"],
      entite_id: `a${i + 1}`,
      entite_label: `AR-2026-${String(100 + i).padStart(4, "0")}-STA`,
      action: actsForCode[i % actsForCode.length] ?? "Action",
      statut,
      date: jour.toISOString(),
      details: statut === "erreur" ? "Timeout — le service distant n'a pas répondu dans le délai imparti." : undefined,
      code_retour: statut === "transmis" ? "200" : statut === "erreur" ? "504" : "202",
      message_erreur: statut === "erreur" ? "Gateway Timeout" : undefined,
    });
  }

  return resultats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration par défaut de chaque intégration
// ─────────────────────────────────────────────────────────────────────────────

export function configActesDefaut(siren: string): ConfigActesTdt {
  return {
    url_teletransmission: "",
    siren,
    classification_defaut: "5_domaine_voirie",
    envoi_auto: false,
    format: "xml",
  };
}

export function configOpenDataDefaut(): ConfigOpenData {
  return {
    api_key: "",
    organisation_id: "",
    frequence: "mensuel",
    inclure_brouillons: false,
    format: "json",
    licence: "lo_2_0",
  };
}

export function configIParapheurDefaut(): ConfigIParapheur {
  return {
    url_service: "",
    identifiant: "",
    type_signature: "avancee",
    sous_type: "arrete_municipal",
    envoi_auto_validation: false,
  };
}

export function configICalDefaut(): ConfigICal {
  return {
    publies_uniquement: true,
    rappel_minutes: 60,
    categories_incluses: [],
  };
}

export function configWebhookDefaut(): ConfigWebhook {
  return {
    endpoints: [],
  };
}

export function configSmtpDefaut(): ConfigSmtp {
  return {
    hote: "",
    port: 587,
    tls: true,
    identifiant: "",
    email_expediteur: "",
    nom_expediteur: "Actes360",
  };
}
