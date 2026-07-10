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

export function filtrerArretes(liste: Arrete[], recherche: string): Arrete[] {
  const q = recherche.toLowerCase();
  if (!q) return liste;
  return liste.filter(
    (a) =>
      a.numero.toLowerCase().includes(q) ||
      a.titre.toLowerCase().includes(q) ||
      a.type_label.toLowerCase().includes(q) ||
      a.voies.some((v) => v.toLowerCase().includes(q)),
  );
}
