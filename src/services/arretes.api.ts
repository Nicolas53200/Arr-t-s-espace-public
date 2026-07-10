import type { Arrete, ArreteFilters, ApiResponse } from "@/types";
import { mockDelay } from "./api-client";
import { ARRETES_INITIAUX } from "@/data/arretes.mock";

let store = [...ARRETES_INITIAUX];

export async function getArretes(
  filters?: ArreteFilters,
): Promise<ApiResponse<Arrete[]>> {
  await mockDelay();
  let result = [...store];
  if (filters?.statut) {
    result = result.filter((a) => a.statut === filters.statut);
  }
  if (filters?.type_code) {
    result = result.filter((a) => a.type_code === filters.type_code);
  }
  if (filters?.recherche) {
    const q = filters.recherche.toLowerCase();
    result = result.filter(
      (a) =>
        a.numero.toLowerCase().includes(q) ||
        a.titre.toLowerCase().includes(q),
    );
  }
  return { data: result, success: true };
}

export async function getArrete(id: string): Promise<ApiResponse<Arrete | null>> {
  await mockDelay();
  const found = store.find((a) => a.id === id) ?? null;
  return { data: found, success: !!found };
}

export async function createArrete(
  arrete: Arrete,
): Promise<ApiResponse<Arrete>> {
  await mockDelay();
  store = [arrete, ...store];
  return { data: arrete, success: true };
}

export async function updateArrete(
  id: string,
  updates: Partial<Arrete>,
): Promise<ApiResponse<Arrete>> {
  await mockDelay();
  let updated: Arrete | null = null;
  store = store.map((a) => {
    if (a.id === id) {
      updated = { ...a, ...updates };
      return updated;
    }
    return a;
  });
  return { data: updated!, success: !!updated };
}

export async function abrogerArreteApi(
  id: string,
  motif: string,
  numeroAbrogation: string,
): Promise<ApiResponse<Arrete>> {
  await mockDelay();
  let updated: Arrete | null = null;
  const today = new Date().toISOString().split("T")[0]!;
  store = store.map((a) => {
    if (a.id === id) {
      updated = {
        ...a,
        statut: "abroge",
        arrete_abrogation: { numero: numeroAbrogation, date: today, motif },
      };
      return updated;
    }
    return a;
  });
  return { data: updated!, success: !!updated };
}
