import type { Arrete, Reference, CodeTypeArrete, StatutArrete } from "@/types";
import { TYPES_ARRETE } from "@/data/types-arrete";

const COULEURS_TYPE: Record<string, string> = {
  circulation_interdite: "#B91C1C",
  stationnement_interdit: "#D9730D",
  alternat: "#92400E",
  travaux: "#1E3A5F",
  manifestation: "#6D28D9",
  manifestation_sportive: "#065F46",
  marche: "#0E7490",
  occupation_dp: "#6B6A60",
  demenagement: "#4338CA",
};

const COULEURS_STATUT: Record<string, string> = {
  brouillon: "#6B6A60",
  en_relecture: "#D9730D",
  valide: "#0E7490",
  publie: "#065F46",
  modifie: "#1E3A5F",
  abroge: "#B91C1C",
};

const LABELS_STATUT: Record<StatutArrete, string> = {
  brouillon: "Brouillon",
  en_relecture: "En relecture",
  valide: "Validé",
  publie: "Publié",
  modifie: "Modifié",
  abroge: "Abrogé",
};

function formatMois(date: Date): string {
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function parseDateStr(dateStr: string): Date {
  return new Date(dateStr);
}

export function arreteParMois(
  arretes: Arrete[],
): { mois: string; count: number }[] {
  const parMois = new Map<string, number>();

  for (const a of arretes) {
    const d = parseDateStr(a.date_creation);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    parMois.set(cle, (parMois.get(cle) ?? 0) + 1);
  }

  const entrees = [...parMois.entries()].sort(([a], [b]) => a.localeCompare(b));

  return entrees.map(([cle, count]) => {
    const [annee, moisNum] = cle.split("-");
    const d = new Date(Number(annee), Number(moisNum) - 1, 1);
    return { mois: formatMois(d), count };
  });
}

export function arreteParType(
  arretes: Arrete[],
): { type: string; label: string; count: number; couleur: string }[] {
  const parType = new Map<CodeTypeArrete, number>();

  for (const a of arretes) {
    parType.set(a.type_code, (parType.get(a.type_code) ?? 0) + 1);
  }

  return [...parType.entries()].map(([code, count]) => {
    const typeDef = TYPES_ARRETE.find((t) => t.code === code);
    return {
      type: code,
      label: typeDef?.label ?? code,
      count,
      couleur: COULEURS_TYPE[code] ?? "#6B6A60",
    };
  });
}

export function arreteParStatut(
  arretes: Arrete[],
): { statut: string; label: string; count: number; couleur: string }[] {
  const parStatut = new Map<StatutArrete, number>();

  for (const a of arretes) {
    parStatut.set(a.statut, (parStatut.get(a.statut) ?? 0) + 1);
  }

  return [...parStatut.entries()].map(([statut, count]) => ({
    statut,
    label: LABELS_STATUT[statut] ?? statut,
    count,
    couleur: COULEURS_STATUT[statut] ?? "#6B6A60",
  }));
}

export function tauxAbrogation(actifs: Arrete[], historique: Arrete[]): number {
  const total = actifs.length + historique.length;
  if (total === 0) return 0;
  const abroges = historique.filter((a) => a.statut === "abroge").length;
  return Math.round((abroges / total) * 100);
}

export function delaiMoyenPublication(arretes: Arrete[]): number {
  const publies = arretes.filter(
    (a) => a.statut === "publie" || a.statut === "modifie",
  );
  if (publies.length === 0) return 0;

  const totalJours = publies.reduce((acc, a) => {
    const creation = parseDateStr(a.date_creation).getTime();
    const debut = parseDateStr(a.date_debut).getTime();
    const diffJours = Math.max(0, (debut - creation) / (1000 * 60 * 60 * 24));
    return acc + diffJours;
  }, 0);

  return Math.round(totalJours / publies.length);
}

export function referenceExpirations(
  refs: Reference[],
): { mois: string; count: number }[] {
  const parMois = new Map<string, number>();

  for (const r of refs) {
    if (!r.actif || !r.date_fin_validite) continue;
    const d = parseDateStr(r.date_fin_validite);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    parMois.set(cle, (parMois.get(cle) ?? 0) + 1);
  }

  const entrees = [...parMois.entries()].sort(([a], [b]) => a.localeCompare(b));

  return entrees.map(([cle, count]) => {
    const [annee, moisNum] = cle.split("-");
    const d = new Date(Number(annee), Number(moisNum) - 1, 1);
    return { mois: formatMois(d), count };
  });
}

// ──── Analytics avancées ────

/**
 * Arrêtés par mois séparés en créés et clôturés (abrogés/expirés).
 * Utile pour un graphique d'évolution avec deux séries.
 */
export function evolutionMensuelle(
  arretes: Arrete[],
  dateRef: Date = new Date(),
): { mois: string; cle: string; crees: number; clotures: number; actifsCumules: number }[] {
  const moisMap = new Map<string, { crees: number; clotures: number }>();

  // Générer les 12 derniers mois
  for (let i = 11; i >= 0; i--) {
    const d = new Date(dateRef.getFullYear(), dateRef.getMonth() - i, 1);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    moisMap.set(cle, { crees: 0, clotures: 0 });
  }

  for (const a of arretes) {
    if (a.date_creation) {
      const d = parseDateStr(a.date_creation);
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = moisMap.get(cle);
      if (entry) entry.crees++;
    }

    if (a.statut === "abroge" && a.arrete_abrogation?.date) {
      const d = parseDateStr(a.arrete_abrogation.date);
      const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = moisMap.get(cle);
      if (entry) entry.clotures++;
    }
  }

  const entrees = [...moisMap.entries()].sort(([a], [b]) => a.localeCompare(b));

  let cumul = 0;
  return entrees.map(([cle, { crees, clotures }]) => {
    cumul += crees - clotures;
    const [annee, moisNum] = cle.split("-");
    const d = new Date(Number(annee), Number(moisNum) - 1, 1);
    return {
      mois: formatMois(d),
      cle,
      crees,
      clotures,
      actifsCumules: Math.max(0, cumul),
    };
  });
}

/**
 * Classement des voies les plus réglementées.
 */
export function topVoies(
  arretes: Arrete[],
  limit: number = 10,
): { voie: string; count: number; types: string[] }[] {
  const voiesMap = new Map<string, { count: number; types: Set<string> }>();

  for (const a of arretes) {
    for (const v of a.voies) {
      const norm = v.trim();
      if (!norm) continue;
      const existing = voiesMap.get(norm);
      if (existing) {
        existing.count++;
        existing.types.add(a.type_label);
      } else {
        voiesMap.set(norm, { count: 1, types: new Set([a.type_label]) });
      }
    }
  }

  return [...voiesMap.entries()]
    .map(([voie, { count, types }]) => ({
      voie,
      count,
      types: [...types],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Durée moyenne des arrêtés (en jours, basé sur date_debut → date_fin).
 */
export function dureeMoyenneArretes(arretes: Arrete[]): number {
  const avecDuree = arretes.filter((a) => a.date_debut && a.date_fin);
  if (avecDuree.length === 0) return 0;

  const total = avecDuree.reduce((acc, a) => {
    const debut = parseDateStr(a.date_debut).getTime();
    const fin = parseDateStr(a.date_fin).getTime();
    return acc + Math.max(0, (fin - debut) / (1000 * 60 * 60 * 24));
  }, 0);

  return Math.round(total / avecDuree.length);
}

/**
 * Taux de renouvellement : arrêtés modifiés / total publiés.
 */
export function tauxRenouvellement(arretes: Arrete[]): number {
  const publies = arretes.filter(
    (a) => a.statut === "publie" || a.statut === "modifie",
  );
  if (publies.length === 0) return 0;
  const modifies = arretes.filter((a) => a.statut === "modifie").length;
  return Math.round((modifies / publies.length) * 100);
}

/**
 * Répartition des arrêtés par jour de la semaine de création.
 */
export function arreteParJourSemaine(
  arretes: Arrete[],
): { jour: string; count: number }[] {
  const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const compteurs = new Array(7).fill(0) as number[];

  for (const a of arretes) {
    if (!a.date_creation) continue;
    const d = parseDateStr(a.date_creation);
    const jour = d.getDay();
    compteurs[jour] = (compteurs[jour] ?? 0) + 1;
  }

  // Commencer par lundi
  const ordre = [1, 2, 3, 4, 5, 6, 0];
  return ordre.map((idx) => ({
    jour: jours[idx]!,
    count: compteurs[idx]!,
  }));
}
