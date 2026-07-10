import { AUJOURD_HUI } from "@/config/constants";

export function fmtDate(d: string | undefined | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function fmtDateCourte(d: string | undefined | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return d;
  }
}

export function isToday(date: Date): boolean {
  return date.toDateString() === AUJOURD_HUI.toDateString();
}

export function isFutur(dateDebut: string): boolean {
  return new Date(dateDebut) > AUJOURD_HUI;
}

export function isEnCours(dateDebut: string, dateFin: string): boolean {
  return new Date(dateDebut) <= AUJOURD_HUI && new Date(dateFin) >= AUJOURD_HUI;
}
