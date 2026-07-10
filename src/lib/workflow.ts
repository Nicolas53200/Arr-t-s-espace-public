import type { StatutArrete, Role } from "@/types";

/**
 * Carte des transitions autorisées dans le workflow de validation.
 * Clé = statut actuel, Valeur = liste des statuts cibles possibles.
 */
export const TRANSITIONS: Record<StatutArrete, StatutArrete[]> = {
  brouillon: ["en_relecture"],
  en_relecture: ["valide", "brouillon"],
  valide: ["publie"],
  publie: ["modifie", "abroge"],
  modifie: ["publie"],
  abroge: [],
};

/**
 * Vérifie si une transition entre deux statuts est autorisée.
 */
export function peutTransitionner(from: StatutArrete, to: StatutArrete): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * Retourne la liste des statuts cibles possibles depuis le statut actuel.
 */
export function prochainStatut(current: StatutArrete): StatutArrete[] {
  return TRANSITIONS[current];
}

/**
 * Labels français pour chaque statut.
 */
export function labelStatut(s: StatutArrete): string {
  const labels: Record<StatutArrete, string> = {
    brouillon: "Brouillon",
    en_relecture: "En relecture",
    valide: "Validé",
    publie: "Publié",
    modifie: "Modifié",
    abroge: "Abrogé",
  };
  return labels[s];
}

/**
 * Couleurs (fond + texte) par statut, pour badges et indicateurs.
 */
export function couleurStatut(s: StatutArrete): { bg: string; text: string } {
  const couleurs: Record<StatutArrete, { bg: string; text: string }> = {
    brouillon: { bg: "#F3F4F6", text: "#6B7280" },
    en_relecture: { bg: "#FEF3C7", text: "#92400E" },
    valide: { bg: "#DBEAFE", text: "#1E3A5F" },
    publie: { bg: "#D1FAE5", text: "#065F46" },
    modifie: { bg: "#E0E7FF", text: "#4338CA" },
    abroge: { bg: "#FEE2E2", text: "#B91C1C" },
  };
  return couleurs[s];
}

/**
 * Label des boutons d'action pour chaque transition.
 */
export function labelTransition(from: StatutArrete, to: StatutArrete): string {
  const key = `${from}->${to}`;
  const labels: Record<string, string> = {
    "brouillon->en_relecture": "Soumettre a relecture",
    "en_relecture->valide": "Valider",
    "en_relecture->brouillon": "Rejeter",
    "valide->publie": "Publier",
    "publie->modifie": "Modifier",
    "publie->abroge": "Abroger",
    "modifie->publie": "Republier",
  };
  return labels[key] ?? `Passer en ${labelStatut(to)}`;
}

/**
 * Détermine le rôle minimum requis pour effectuer une transition.
 * - redacteur : soumettre à relecture
 * - redacteur : valider (en_relecture -> valide)
 * - admin : publier (valide -> publie, modifie -> publie)
 * - redacteur : rejeter (en_relecture -> brouillon)
 * - admin : abroger (publie -> abroge)
 * - redacteur : modifier (publie -> modifie)
 */
export function requiresRole(transition: { from: StatutArrete; to: StatutArrete }): Role {
  const { from, to } = transition;

  // Publication et abrogation requièrent admin
  if (to === "publie") return "admin";
  if (to === "abroge") return "admin";

  // Toutes les autres transitions sont accessibles aux rédacteurs
  if (from === "brouillon" && to === "en_relecture") return "redacteur";
  if (from === "en_relecture" && to === "valide") return "redacteur";
  if (from === "en_relecture" && to === "brouillon") return "redacteur";
  if (from === "publie" && to === "modifie") return "redacteur";

  return "admin";
}

/**
 * Les étapes du workflow linéaire pour l'affichage du stepper.
 */
export const ETAPES_WORKFLOW: StatutArrete[] = [
  "brouillon",
  "en_relecture",
  "valide",
  "publie",
];

/**
 * Vérifie si un rôle peut effectuer une transition donnée.
 * admin a tous les droits, redacteur a les siens, lecteur ne peut rien transitionner.
 */
export function peutEffectuerTransition(
  role: Role,
  transition: { from: StatutArrete; to: StatutArrete }
): boolean {
  if (role === "lecteur") return false;
  if (role === "admin") return true;
  const roleRequis = requiresRole(transition);
  return roleRequis === "redacteur";
}
