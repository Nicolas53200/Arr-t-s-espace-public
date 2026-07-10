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
