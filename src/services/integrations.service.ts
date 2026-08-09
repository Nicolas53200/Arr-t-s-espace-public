// Service intégrations — couche d'abstraction vers l'API
// Mode mock : stockage localStorage + simulation de latence

import type {
  Integration,
  CodeIntegration,
  ConfigurationIntegration,
  HistoriqueTransmission,
} from "@/types";
import { mockDelay } from "./api-client";
import {
  configActesDefaut,
  configOpenDataDefaut,
  configIParapheurDefaut,
  configICalDefaut,
  configWebhookDefaut,
  configSmtpDefaut,
  genererHistoriqueMock,
} from "@/lib/integrations";

const STORAGE_KEY = "actes360_integrations";
const HISTORIQUE_KEY = "actes360_historique_transmissions";

/** Catalogue des intégrations disponibles */
const CATALOGUE: Omit<Integration, "configuration">[] = [
  {
    id: "int-actes",
    code: "actes_tdt",
    nom: "ACTES / TDT",
    description: "Télétransmission des actes au contrôle de légalité (Préfecture) via le protocole ACTES. Obligatoire pour toutes les collectivités de plus de 50 agents.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
  {
    id: "int-opendata",
    code: "open_data",
    nom: "Open Data / data.gouv.fr",
    description: "Publication automatique des arrêtés sur la plateforme nationale data.gouv.fr. Respecte le format DCAT-AP et les exigences de la loi République numérique.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
  {
    id: "int-iparapheur",
    code: "iparapheur",
    nom: "iParapheur",
    description: "Parapheur électronique pour la signature numérique des arrêtés. Compatible avec les certificats RGS** et la signature qualifiée eIDAS.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
  {
    id: "int-ical",
    code: "ical",
    nom: "Calendrier iCal",
    description: "Flux iCal des arrêtés pour synchronisation avec Outlook, Google Calendar ou tout client CalDAV. Idéal pour les agents terrain.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
  {
    id: "int-webhooks",
    code: "webhooks",
    nom: "Webhooks",
    description: "Notifications HTTP en temps réel vers vos systèmes tiers (SIG, GED, portail citoyen). Signature HMAC-SHA256 pour la sécurité.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
  {
    id: "int-smtp",
    code: "smtp",
    nom: "Email / SMTP",
    description: "Configuration du serveur de messagerie pour l'envoi des notifications par email, rapports quotidiens et alertes d'expiration.",
    statut: "inactive",
    total_transmissions: 0,
    erreurs_recentes: 0,
  },
];

function getConfigDefaut(code: CodeIntegration, siren: string): ConfigurationIntegration {
  switch (code) {
    case "actes_tdt": return configActesDefaut(siren);
    case "open_data": return configOpenDataDefaut();
    case "iparapheur": return configIParapheurDefaut();
    case "ical": return configICalDefaut();
    case "webhooks": return configWebhookDefaut();
    case "smtp": return configSmtpDefaut();
  }
}

function chargerIntegrations(siren: string): Integration[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Integration[];
    } catch {
      // Données corrompues, on réinitialise
    }
  }
  // Initialiser avec le catalogue par défaut
  return CATALOGUE.map((cat) => ({
    ...cat,
    configuration: getConfigDefaut(cat.code, siren),
  }));
}

function sauvegarderIntegrations(integrations: Integration[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
}

function chargerHistorique(): HistoriqueTransmission[] {
  const stored = localStorage.getItem(HISTORIQUE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as HistoriqueTransmission[];
    } catch {
      // Données corrompues
    }
  }
  return [];
}

function sauvegarderHistorique(historique: HistoriqueTransmission[]): void {
  localStorage.setItem(HISTORIQUE_KEY, JSON.stringify(historique));
}

export const IntegrationsService = {
  /** Liste toutes les intégrations disponibles */
  async lister(siren: string): Promise<Integration[]> {
    await mockDelay(100);
    return chargerIntegrations(siren);
  },

  /** Récupère une intégration par son code */
  async obtenir(code: CodeIntegration, siren: string): Promise<Integration | null> {
    await mockDelay(50);
    const integrations = chargerIntegrations(siren);
    return integrations.find((i) => i.code === code) ?? null;
  },

  /** Active une intégration */
  async activer(code: CodeIntegration, siren: string): Promise<Integration> {
    await mockDelay(200);
    const integrations = chargerIntegrations(siren);
    const index = integrations.findIndex((i) => i.code === code);
    if (index === -1) throw new Error(`Intégration ${code} introuvable`);

    const integration = integrations[index]!;
    integration.statut = "active";
    integration.date_activation = new Date().toISOString();

    // Générer de l'historique mock pour les intégrations actives
    const historiqueMock = genererHistoriqueMock(code);
    integration.total_transmissions = historiqueMock.length;
    integration.erreurs_recentes = historiqueMock.filter((h) => h.statut === "erreur" || h.statut === "rejete").length;

    sauvegarderIntegrations(integrations);

    // Sauvegarder l'historique mock
    const historiqueExistant = chargerHistorique();
    const historiqueFiltre = historiqueExistant.filter((h) => h.integration_code !== code);
    sauvegarderHistorique([...historiqueFiltre, ...historiqueMock]);

    return integration;
  },

  /** Désactive une intégration */
  async desactiver(code: CodeIntegration, siren: string): Promise<Integration> {
    await mockDelay(200);
    const integrations = chargerIntegrations(siren);
    const index = integrations.findIndex((i) => i.code === code);
    if (index === -1) throw new Error(`Intégration ${code} introuvable`);

    const integration = integrations[index]!;
    integration.statut = "inactive";
    integration.date_activation = undefined;

    sauvegarderIntegrations(integrations);
    return integration;
  },

  /** Met à jour la configuration d'une intégration */
  async mettreAJourConfig(
    code: CodeIntegration,
    config: ConfigurationIntegration,
    siren: string,
  ): Promise<Integration> {
    await mockDelay(150);
    const integrations = chargerIntegrations(siren);
    const index = integrations.findIndex((i) => i.code === code);
    if (index === -1) throw new Error(`Intégration ${code} introuvable`);

    integrations[index] = { ...integrations[index]!, configuration: config };
    sauvegarderIntegrations(integrations);
    return integrations[index]!;
  },

  /** Teste la connexion d'une intégration */
  async testerConnexion(_code: CodeIntegration): Promise<{ succes: boolean; message: string; duree_ms: number }> {
    await mockDelay(800);
    // Simulation : 85% de succès
    const succes = Math.random() > 0.15;
    return {
      succes,
      message: succes
        ? "Connexion établie avec succès. Service opérationnel."
        : "Impossible de joindre le service. Vérifiez l'URL et les identifiants.",
      duree_ms: Math.floor(Math.random() * 500 + 100),
    };
  },

  /** Déclenche une synchronisation manuelle */
  async synchroniser(code: CodeIntegration, siren: string): Promise<HistoriqueTransmission> {
    await mockDelay(1200);
    const succes = Math.random() > 0.1;

    const entree: HistoriqueTransmission = {
      id: `ht-${Date.now()}`,
      integration_code: code,
      entite_id: "sync-manuelle",
      entite_label: "Synchronisation manuelle",
      action: "Synchronisation complète",
      statut: succes ? "transmis" : "erreur",
      date: new Date().toISOString(),
      details: succes ? "Synchronisation réussie." : "Erreur lors de la synchronisation.",
      code_retour: succes ? "200" : "500",
      message_erreur: succes ? undefined : "Internal Server Error",
    };

    // Sauvegarder dans l'historique
    const historique = chargerHistorique();
    historique.unshift(entree);
    sauvegarderHistorique(historique);

    // Mettre à jour les compteurs
    const integrations = chargerIntegrations(siren);
    const index = integrations.findIndex((i) => i.code === code);
    if (index !== -1) {
      integrations[index]!.total_transmissions += 1;
      integrations[index]!.date_derniere_synchro = entree.date;
      if (!succes) integrations[index]!.erreurs_recentes += 1;
      sauvegarderIntegrations(integrations);
    }

    return entree;
  },

  /** Récupère l'historique des transmissions pour une intégration */
  async historiqueTransmissions(code: CodeIntegration): Promise<HistoriqueTransmission[]> {
    await mockDelay(100);
    const historique = chargerHistorique();
    return historique
      .filter((h) => h.integration_code === code)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  /** Récupère tout l'historique récent (toutes intégrations) */
  async historiqueRecent(limite: number = 20): Promise<HistoriqueTransmission[]> {
    await mockDelay(50);
    const historique = chargerHistorique();
    return historique
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limite);
  },
};
