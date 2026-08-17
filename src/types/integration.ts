// Types du domaine — Intégrations externes

/** Identifiants des intégrations disponibles */
export type CodeIntegration =
  | "actes_tdt"       // Télétransmission au contrôle de légalité (Préfecture)
  | "open_data"       // Publication sur data.gouv.fr
  | "iparapheur"      // Signature électronique (parapheur numérique)
  | "ical"            // Export calendrier iCal
  | "webhooks"        // Notifications vers systèmes tiers
  | "smtp";           // Configuration email/SMTP

/** Statut de l'intégration */
export type StatutIntegration = "active" | "inactive" | "erreur" | "en_cours";

/** Statut d'une transmission individuelle */
export type StatutTransmission =
  | "en_attente"
  | "en_cours"
  | "transmis"
  | "accuse_reception"
  | "rejete"
  | "erreur";

/** Configuration ACTES/TDT — Télétransmission des actes au contrôle de légalité */
export interface ConfigActesTdt {
  /** URL du tiers de télétransmission (S2LOW, CDC Fast, etc.) */
  url_teletransmission: string;
  /** Identifiant SIREN de la collectivité */
  siren: string;
  /** Certificat client (référence, pas le contenu) */
  certificat_ref?: string;
  /** Classification par défaut des actes */
  classification_defaut: ClassificationActe;
  /** Envoi automatique à la publication */
  envoi_auto: boolean;
  /** Format de transmission */
  format: "xml" | "pdf";
}

/** Classification ACTES */
export type ClassificationActe =
  | "1_conseil_municipal"
  | "2_budget"
  | "3_police"
  | "4_urbanisme"
  | "5_domaine_voirie"
  | "6_fonction_publique"
  | "7_elections"
  | "8_intercommunalite"
  | "9_autres";

/** Configuration Open Data */
export interface ConfigOpenData {
  /** Clé API data.gouv.fr */
  api_key: string;
  /** Identifiant de l'organisation sur data.gouv.fr */
  organisation_id: string;
  /** Identifiant du jeu de données (dataset) */
  dataset_id?: string;
  /** Fréquence de publication */
  frequence: "quotidien" | "hebdomadaire" | "mensuel" | "manuel";
  /** Inclure les arrêtés en brouillon */
  inclure_brouillons: boolean;
  /** Format d'export */
  format: "json" | "csv";
  /** Licence des données */
  licence: "lo_2_0" | "odbl";
}

/** Configuration iParapheur (signature électronique) */
export interface ConfigIParapheur {
  /** URL du service iParapheur */
  url_service: string;
  /** Identifiant de connexion */
  identifiant: string;
  /** Type de signature */
  type_signature: "simple" | "avancee" | "qualifiee";
  /** Sous-type de document dans le parapheur */
  sous_type: string;
  /** Envoi automatique pour signature à la validation */
  envoi_auto_validation: boolean;
}

/** Configuration iCal */
export interface ConfigICal {
  /** Inclure les arrêtés publiés uniquement */
  publies_uniquement: boolean;
  /** Durée du rappel avant début (minutes) */
  rappel_minutes: number;
  /** Catégories à inclure */
  categories_incluses: string[];
  /** URL publique du flux iCal (générée) */
  url_flux?: string;
}

/** Configuration Webhooks */
export interface ConfigWebhook {
  /** Points de terminaison configurés */
  endpoints: WebhookEndpoint[];
}

export interface WebhookEndpoint {
  id: string;
  /** URL de destination */
  url: string;
  /** Nom descriptif */
  nom: string;
  /** Événements déclencheurs */
  evenements: EvenementWebhook[];
  /** En-têtes personnalisés (clé-valeur) */
  headers: Record<string, string>;
  /** Secret pour la signature HMAC */
  secret: string;
  /** Actif ou non */
  actif: boolean;
  /** Dernière réponse HTTP */
  dernier_code_http?: number;
  /** Dernière tentative */
  derniere_tentative?: string;
}

export type EvenementWebhook =
  | "arrete.cree"
  | "arrete.modifie"
  | "arrete.publie"
  | "arrete.abroge"
  | "arrete.expire"
  | "reference.modifiee"
  | "reference.expiree";

/** Configuration SMTP */
export interface ConfigSmtp {
  /** Serveur SMTP */
  hote: string;
  /** Port */
  port: number;
  /** Utiliser TLS */
  tls: boolean;
  /** Identifiant d'authentification */
  identifiant: string;
  /** Email d'expédition */
  email_expediteur: string;
  /** Nom d'affichage de l'expéditeur */
  nom_expediteur: string;
}

/** Type union pour les configurations */
export type ConfigurationIntegration =
  | ConfigActesTdt
  | ConfigOpenData
  | ConfigIParapheur
  | ConfigICal
  | ConfigWebhook
  | ConfigSmtp;

/** Intégration configurée */
export interface Integration {
  id: string;
  code: CodeIntegration;
  nom: string;
  description: string;
  statut: StatutIntegration;
  date_activation?: string;
  date_derniere_synchro?: string;
  configuration: ConfigurationIntegration;
  /** Nombre total de transmissions/synchros */
  total_transmissions: number;
  /** Nombre d'erreurs récentes (30 jours) */
  erreurs_recentes: number;
}

/** Historique d'une transmission/synchronisation */
export interface HistoriqueTransmission {
  id: string;
  integration_code: CodeIntegration;
  /** Référence de l'arrêté ou entité concernée */
  entite_id: string;
  entite_label: string;
  action: string;
  statut: StatutTransmission;
  date: string;
  details?: string;
  /** Code retour du système distant */
  code_retour?: string;
  /** Message d'erreur éventuel */
  message_erreur?: string;
}

/** Payload d'un webhook */
export interface WebhookPayload {
  evenement: EvenementWebhook;
  timestamp: string;
  tenant_id: string;
  data: Record<string, unknown>;
}

/** Données ACTES pour la télétransmission */
export interface DonneesActes {
  /** Numéro de l'acte */
  numero_acte: string;
  /** Date de l'acte */
  date_acte: string;
  /** Objet de l'acte */
  objet: string;
  /** Classification ACTES (matière/sous-matière) */
  classification: ClassificationActe;
  /** Nature de l'acte */
  nature: "arrete" | "deliberation" | "autre";
  /** SIREN de la collectivité émettrice */
  siren_emetteur: string;
  /** Contenu en base64 (PDF) */
  contenu_base64?: string;
}

/** Données Open Data (format DCAT-AP) */
export interface DonneesOpenData {
  titre: string;
  description: string;
  date_creation: string;
  date_modification: string;
  licence: string;
  mots_cles: string[];
  couverture_territoriale: string;
  frequence_mise_a_jour: string;
  ressources: RessourceOpenData[];
}

export interface RessourceOpenData {
  titre: string;
  format: string;
  url?: string;
  /** Données inline (pour mock) */
  donnees?: unknown[];
}

/** Événement iCal */
export interface EvenementICal {
  uid: string;
  resume: string;
  description: string;
  date_debut: string;
  date_fin: string;
  lieu?: string;
  categories: string[];
  statut: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
}
