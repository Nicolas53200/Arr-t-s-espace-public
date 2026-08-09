/**
 * Détection de conflits spatio-temporels entre arrêtés.
 *
 * Vérifie qu'un nouvel arrêté ne chevauche pas un arrêté existant
 * sur les mêmes voies et durant la même période.
 */
import type { Arrete } from "@/types";

export interface Conflit {
  /** Arrêté existant en conflit */
  arrete: Arrete;
  /** Voies en commun */
  voiesCommunes: string[];
  /** Chevauchement temporel */
  chevauchement: {
    debut: string;
    fin: string;
  };
  /** Sévérité : "critique" si même voie + même impact, "attention" sinon */
  severite: "critique" | "attention";
}

/**
 * Normalise un nom de voie pour la comparaison.
 * Supprime la casse, les accents, les articles, etc.
 */
function normaliserVoie(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(rue|avenue|boulevard|place|chemin|impasse|allee|passage|cours|quai)\b/g, "")
    .replace(/\b(de|du|des|le|la|les|l'|d')\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Vérifie si deux périodes se chevauchent.
 * Retourne la période de chevauchement ou null.
 */
function chevauchementDates(
  debut1: string,
  fin1: string,
  debut2: string,
  fin2: string,
): { debut: string; fin: string } | null {
  if (!debut1 || !fin1 || !debut2 || !fin2) return null;

  const d1 = new Date(debut1).getTime();
  const f1 = new Date(fin1).getTime();
  const d2 = new Date(debut2).getTime();
  const f2 = new Date(fin2).getTime();

  if (isNaN(d1) || isNaN(f1) || isNaN(d2) || isNaN(f2)) return null;

  // Pas de chevauchement
  if (f1 <= d2 || f2 <= d1) return null;

  const debutChevauchement = Math.max(d1, d2);
  const finChevauchement = Math.min(f1, f2);

  return {
    debut: new Date(debutChevauchement).toISOString(),
    fin: new Date(finChevauchement).toISOString(),
  };
}

/**
 * Trouve les voies en commun entre deux listes.
 * Compare par nom normalisé et par voie_id des tronçons.
 */
function trouverVoiesCommunes(
  voies1: string[],
  voies2: string[],
  troncons1VoieIds: string[],
  troncons2VoieIds: string[],
): string[] {
  const communes: string[] = [];
  const norm1 = voies1.map((v) => ({ original: v, norm: normaliserVoie(v) }));
  const norm2 = voies2.map((v) => ({ original: v, norm: normaliserVoie(v) }));

  // Comparaison par nom normalisé
  for (const v1 of norm1) {
    for (const v2 of norm2) {
      if (v1.norm && v2.norm && v1.norm === v2.norm && !communes.includes(v1.original)) {
        communes.push(v1.original);
      }
    }
  }

  // Comparaison par voie_id des tronçons
  for (const id1 of troncons1VoieIds) {
    for (const id2 of troncons2VoieIds) {
      const n1 = normaliserVoie(id1);
      const n2 = normaliserVoie(id2);
      if (n1 && n2 && n1 === n2) {
        const label = id1;
        if (!communes.some((c) => normaliserVoie(c) === n1)) {
          communes.push(label);
        }
      }
    }
  }

  return communes;
}

/**
 * Détecte les conflits entre un nouvel arrêté et les arrêtés existants.
 *
 * @param voies - Voies du nouvel arrêté
 * @param dateDebut - Date de début du nouvel arrêté
 * @param dateFin - Date de fin du nouvel arrêté
 * @param tronconVoieIds - IDs de voie des tronçons du nouvel arrêté
 * @param arretes - Liste de tous les arrêtés existants
 * @param arreteIdExclu - ID de l'arrêté à exclure (en cas de modification)
 */
export function detecterConflits(
  voies: string[],
  dateDebut: string,
  dateFin: string,
  tronconVoieIds: string[],
  arretes: Arrete[],
  arreteIdExclu?: string,
): Conflit[] {
  const conflits: Conflit[] = [];

  // Filtrer : seuls les arrêtés actifs (non abrogés, non expirés)
  const arretesActifs = arretes.filter((a) => {
    if (a.id === arreteIdExclu) return false;
    if (a.statut === "abroge") return false;
    // Un arrêté sans date_fin est considéré comme permanent
    return true;
  });

  for (const existant of arretesActifs) {
    // 1. Vérifier le chevauchement temporel
    const finExistant = existant.date_fin || "2099-12-31";
    const finNouveau = dateFin || "2099-12-31";

    const chevauchement = chevauchementDates(
      dateDebut,
      finNouveau,
      existant.date_debut,
      finExistant,
    );

    if (!chevauchement) continue;

    // 2. Vérifier les voies communes
    const tronconIdsExistant = existant.troncons.map((t) => t.voie_id);
    const voiesCommunes = trouverVoiesCommunes(
      voies,
      existant.voies,
      tronconVoieIds,
      tronconIdsExistant,
    );

    if (voiesCommunes.length === 0) continue;

    // 3. Déterminer la sévérité
    // Critique si même type d'impact sur les mêmes voies
    const impactsNouveau = new Set(tronconVoieIds);
    const impactsExistant = new Set(tronconIdsExistant);
    const memeVoieExacte = [...impactsNouveau].some((v) =>
      [...impactsExistant].some(
        (e) => normaliserVoie(v) === normaliserVoie(e),
      ),
    );

    const severite: Conflit["severite"] = memeVoieExacte ? "critique" : "attention";

    conflits.push({
      arrete: existant,
      voiesCommunes,
      chevauchement,
      severite,
    });
  }

  // Trier : critiques d'abord
  conflits.sort((a, b) => {
    if (a.severite === "critique" && b.severite !== "critique") return -1;
    if (a.severite !== "critique" && b.severite === "critique") return 1;
    return 0;
  });

  return conflits;
}

/**
 * Formate la période de chevauchement pour l'affichage.
 */
export function formaterChevauchement(chevauchement: { debut: string; fin: string }): string {
  const debut = new Date(chevauchement.debut).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
  const fin = new Date(chevauchement.fin).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${debut} — ${fin}`;
}
