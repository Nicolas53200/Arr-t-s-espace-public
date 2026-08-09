/**
 * Moteur d'alertes intelligentes pour Actes360.
 *
 * Génère automatiquement des notifications à partir de l'état
 * des arrêtés et des références réglementaires :
 *
 * 1. Expiration imminente d'arrêtés (J-30, J-15, J-7, J-1, J+0)
 * 2. Conflits spatio-temporels détectés
 * 3. Renouvellement à prévoir (arrêtés récurrents)
 * 4. Workflow : arrêtés en attente de validation depuis longtemps
 * 5. Registre : arrêtés publiés non inscrits au registre
 */
import type { Arrete } from "@/types";
import type { Notification } from "@/types/notification";
import { ROUTES } from "@/config/routes";
import { detecterConflits, type Conflit } from "@/lib/conflits";
import { getRegistre } from "@/lib/registre-officiel";

// ──── Configuration des seuils ────

/** Seuils d'alerte pour l'expiration (en jours) */
export const SEUILS_EXPIRATION = [30, 15, 7, 1, 0] as const;

/** Seuil pour les arrêtés en attente de validation (en jours) */
const SEUIL_VALIDATION_BLOQUEE = 5;

/** Seuil de renouvellement pour les arrêtés récurrents (en jours avant expiration) */
const SEUIL_RENOUVELLEMENT = 45;

// ──── Types internes ────

export interface AlerteExpiration {
  arrete: Arrete;
  joursRestants: number;
  type: "expire" | "expire_bientot";
}

export interface AlerteValidation {
  arrete: Arrete;
  joursEnAttente: number;
}

export interface AlerteRenouvellement {
  arrete: Arrete;
  joursRestants: number;
}

export interface AlerteRegistre {
  arrete: Arrete;
}

export interface BilanAlertes {
  expirations: AlerteExpiration[];
  conflits: Conflit[];
  validations: AlerteValidation[];
  renouvellements: AlerteRenouvellement[];
  registre: AlerteRegistre[];
  total: number;
}

// ──── Fonctions de détection ────

/**
 * Détecte les arrêtés dont la date de fin approche ou est dépassée.
 */
export function detecterExpirations(
  arretes: Arrete[],
  dateRef: Date = new Date(),
): AlerteExpiration[] {
  const alertes: AlerteExpiration[] = [];
  const refTime = dateRef.getTime();

  for (const arrete of arretes) {
    // Seuls les arrêtés actifs (publiés ou modifiés)
    if (arrete.statut !== "publie" && arrete.statut !== "modifie") continue;
    if (!arrete.date_fin) continue;

    const dateFin = new Date(arrete.date_fin);
    if (isNaN(dateFin.getTime())) continue;

    const diffMs = dateFin.getTime() - refTime;
    const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (joursRestants < 0) {
      // Déjà expiré
      alertes.push({ arrete, joursRestants, type: "expire" });
    } else if (joursRestants <= SEUILS_EXPIRATION[0]) {
      // Expire dans les 30 prochains jours
      alertes.push({ arrete, joursRestants, type: "expire_bientot" });
    }
  }

  // Trier : les plus urgents d'abord
  alertes.sort((a, b) => a.joursRestants - b.joursRestants);
  return alertes;
}

/**
 * Détecte les arrêtés bloqués en validation depuis trop longtemps.
 */
export function detecterValidationsBloquees(
  arretes: Arrete[],
  dateRef: Date = new Date(),
): AlerteValidation[] {
  const alertes: AlerteValidation[] = [];
  const refTime = dateRef.getTime();

  for (const arrete of arretes) {
    if (arrete.statut !== "en_relecture") continue;

    // Chercher la date de passage en relecture via le dernier commentaire ou date_creation
    const dateRelecture = arrete.commentaires
      ?.filter((c) => c.etape === "en_relecture")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      [0]?.date ?? arrete.date_creation;

    if (!dateRelecture) continue;

    const diffMs = refTime - new Date(dateRelecture).getTime();
    const joursEnAttente = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (joursEnAttente >= SEUIL_VALIDATION_BLOQUEE) {
      alertes.push({ arrete, joursEnAttente });
    }
  }

  alertes.sort((a, b) => b.joursEnAttente - a.joursEnAttente);
  return alertes;
}

/**
 * Détecte les arrêtés récurrents qui arrivent à expiration
 * et nécessitent un renouvellement.
 */
export function detecterRenouvellements(
  arretes: Arrete[],
  dateRef: Date = new Date(),
): AlerteRenouvellement[] {
  const alertes: AlerteRenouvellement[] = [];
  const refTime = dateRef.getTime();

  for (const arrete of arretes) {
    if (arrete.statut !== "publie" && arrete.statut !== "modifie") continue;
    if (!arrete.recurrence) continue;
    if (!arrete.date_fin) continue;
    // Les arrêtés permanents n'ont pas besoin de renouvellement
    if (arrete.recurrence.type === "permanent") continue;

    const dateFin = new Date(arrete.date_fin);
    if (isNaN(dateFin.getTime())) continue;

    const diffMs = dateFin.getTime() - refTime;
    const joursRestants = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (joursRestants > 0 && joursRestants <= SEUIL_RENOUVELLEMENT) {
      alertes.push({ arrete, joursRestants });
    }
  }

  alertes.sort((a, b) => a.joursRestants - b.joursRestants);
  return alertes;
}

/**
 * Détecte les arrêtés publiés non encore inscrits au registre officiel.
 */
export function detecterNonInscritsRegistre(
  arretes: Arrete[],
  tenantId: string,
): AlerteRegistre[] {
  const alertes: AlerteRegistre[] = [];

  for (const arrete of arretes) {
    if (arrete.statut !== "publie" && arrete.statut !== "modifie" && arrete.statut !== "abroge") continue;

    const annee = arrete.date_creation
      ? new Date(arrete.date_creation).getFullYear()
      : new Date().getFullYear();

    const registre = getRegistre(tenantId, annee);
    const inscrit = registre.entrees.some((e) => e.arrete_id === arrete.id);

    if (!inscrit && !registre.cloture) {
      alertes.push({ arrete });
    }
  }

  return alertes;
}

/**
 * Calcule le bilan complet des alertes pour un tenant.
 */
export function calculerBilanAlertes(
  arretes: Arrete[],
  tenantId: string,
  dateRef: Date = new Date(),
): BilanAlertes {
  const expirations = detecterExpirations(arretes, dateRef);

  // Détecter les conflits entre tous les arrêtés actifs
  const arretesActifs = arretes.filter(
    (a) => a.statut === "publie" || a.statut === "modifie",
  );
  const conflitsUniques = new Map<string, Conflit>();

  for (const arrete of arretesActifs) {
    if (!arrete.date_fin && !arrete.date_debut) continue;
    const tronconIds = arrete.troncons.map((t) => t.voie_id);
    const conflitsDetectes = detecterConflits(
      arrete.voies,
      arrete.date_debut,
      arrete.date_fin || "2099-12-31",
      tronconIds,
      arretes,
      arrete.id,
    );
    for (const c of conflitsDetectes) {
      // Clé unique pour éviter les doublons A↔B
      const paire = [arrete.id, c.arrete.id].sort().join(":");
      if (!conflitsUniques.has(paire)) {
        conflitsUniques.set(paire, c);
      }
    }
  }

  const validations = detecterValidationsBloquees(arretes, dateRef);
  const renouvellements = detecterRenouvellements(arretes, dateRef);
  const registre = detecterNonInscritsRegistre(arretes, tenantId);

  const conflits = [...conflitsUniques.values()];

  return {
    expirations,
    conflits,
    validations,
    renouvellements,
    registre,
    total: expirations.length + conflits.length + validations.length + renouvellements.length + registre.length,
  };
}

// ──── Conversion en Notifications ────

/**
 * Libellé du seuil d'expiration pour le titre de la notification.
 */
function labelExpiration(jours: number): string {
  if (jours < 0) return `expire depuis ${Math.abs(jours)} jour${Math.abs(jours) > 1 ? "s" : ""}`;
  if (jours === 0) return "expire aujourd'hui";
  if (jours === 1) return "expire demain";
  return `expire dans ${jours} jours`;
}

/**
 * Priorité en fonction du nombre de jours restants.
 */
function prioriteExpiration(jours: number): "haute" | "normale" | "basse" {
  if (jours <= 1) return "haute";
  if (jours <= 7) return "haute";
  if (jours <= 15) return "normale";
  return "basse";
}

/**
 * Convertit le bilan d'alertes en notifications affichables.
 */
export function bilanVersNotifications(
  bilan: BilanAlertes,
  dateRef: Date = new Date(),
): Notification[] {
  const notifications: Notification[] = [];
  const dateStr = dateRef.toISOString();

  // 1. Expirations
  for (const exp of bilan.expirations) {
    notifications.push({
      id: `alerte-exp-${exp.arrete.id}-${exp.joursRestants}`,
      type: "expiration",
      priorite: prioriteExpiration(exp.joursRestants),
      titre: `${exp.arrete.numero} ${labelExpiration(exp.joursRestants)}`,
      message: `"${exp.arrete.titre}" — ${exp.arrete.voies.slice(0, 2).join(", ")}${exp.arrete.voies.length > 2 ? "…" : ""}`,
      date: dateStr,
      lue: false,
      lien: ROUTES.modifier(exp.arrete.id),
      arreteId: exp.arrete.id,
    });
  }

  // 2. Conflits spatio-temporels
  for (const conflit of bilan.conflits) {
    notifications.push({
      id: `alerte-conflit-${conflit.arrete.id}`,
      type: "alerte",
      priorite: conflit.severite === "critique" ? "haute" : "normale",
      titre: `Conflit ${conflit.severite} : ${conflit.arrete.numero}`,
      message: `Chevauchement sur ${conflit.voiesCommunes.slice(0, 2).join(", ")} avec un autre arrete en vigueur.`,
      date: dateStr,
      lue: false,
      lien: ROUTES.actifs,
      arreteId: conflit.arrete.id,
    });
  }

  // 3. Validations bloquées
  for (const val of bilan.validations) {
    notifications.push({
      id: `alerte-valid-${val.arrete.id}`,
      type: "workflow",
      priorite: val.joursEnAttente >= 10 ? "haute" : "normale",
      titre: `${val.arrete.numero} en attente depuis ${val.joursEnAttente}j`,
      message: `"${val.arrete.titre}" est en relecture depuis ${val.joursEnAttente} jours sans validation.`,
      date: dateStr,
      lue: false,
      lien: ROUTES.validation,
      arreteId: val.arrete.id,
    });
  }

  // 4. Renouvellements
  for (const ren of bilan.renouvellements) {
    const typeRec = ren.arrete.recurrence?.type ?? "recurrent";
    notifications.push({
      id: `alerte-renouv-${ren.arrete.id}`,
      type: "info",
      priorite: ren.joursRestants <= 15 ? "haute" : "normale",
      titre: `Renouvellement a prevoir : ${ren.arrete.numero}`,
      message: `Arrete ${typeRec} "${ren.arrete.titre}" expire dans ${ren.joursRestants} jours. Pensez a le renouveler.`,
      date: dateStr,
      lue: false,
      lien: ROUTES.modifier(ren.arrete.id),
      arreteId: ren.arrete.id,
    });
  }

  // 5. Non inscrits au registre
  if (bilan.registre.length > 0) {
    // Une seule notification groupée
    notifications.push({
      id: `alerte-registre-${bilan.registre.length}`,
      type: "alerte",
      priorite: "normale",
      titre: `${bilan.registre.length} arrete(s) non inscrit(s) au registre`,
      message: `Des arretes publies ne figurent pas au registre officiel. Allez dans Registre > Synchroniser.`,
      date: dateStr,
      lue: false,
      lien: ROUTES.registre,
    });
  }

  // Trier par priorité puis date
  const ordreP: Record<string, number> = { haute: 0, normale: 1, basse: 2 };
  notifications.sort((a, b) => (ordreP[a.priorite] ?? 1) - (ordreP[b.priorite] ?? 1));

  return notifications;
}
