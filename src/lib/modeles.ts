import type { ModeleArrete } from "@/types";

const STORAGE_KEY = "arretes_modeles";

export function getModeles(): ModeleArrete[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as ModeleArrete[] : [];
  } catch {
    return [];
  }
}

export function sauvegarderModele(modele: ModeleArrete): void {
  const existants = getModeles();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([modele, ...existants]));
}

export function supprimerModele(id: string): void {
  const existants = getModeles().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existants));
}
