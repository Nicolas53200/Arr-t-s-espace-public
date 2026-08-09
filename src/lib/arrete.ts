import { AUJOURD_HUI } from "@/config/constants";
import type { Arrete } from "@/types";

export function estExpire(a: Arrete): boolean {
  return !!a.date_fin && new Date(a.date_fin) < AUJOURD_HUI;
}

export function estEnHistorique(a: Arrete): boolean {
  return estExpire(a) || a.statut === "abroge";
}

export function estActif(a: Arrete): boolean {
  return !estEnHistorique(a);
}

export function genNum(suffixe: string, idx: number): string {
  return `AR-2026-${String(idx).padStart(4, "0")}-${suffixe}`;
}

/**
 * Recherche améliorée : multi-mots, recherche dans commune, créateur,
 * statut, dates. Chaque mot doit matcher au moins un champ.
 */
export function filtrerArretes(liste: Arrete[], recherche: string): Arrete[] {
  const q = recherche.trim().toLowerCase();
  if (!q) return liste;

  const mots = q.split(/\s+/).filter((m) => m.length > 0);

  return liste.filter((a) => {
    // Chaque mot doit matcher au moins un champ
    return mots.every((mot) => {
      const champsCherchables = [
        a.numero,
        a.titre,
        a.type_label,
        a.commune ?? "",
        a.cree_par,
        a.statut,
        a.date_debut,
        a.date_fin,
        a.date_creation,
        ...a.voies,
      ];
      return champsCherchables.some((c) => c.toLowerCase().includes(mot));
    });
  });
}
