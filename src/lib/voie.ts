import type { CodeImpact } from "@/types";
import { TYPES_IMPACT } from "@/data/types-impact";

export function couleurImpact(code: CodeImpact | string): string {
  return TYPES_IMPACT.find((t) => t.code === code)?.couleur ?? "#C9C6BA";
}

const RESOLUTION_MAP: { mots: string[]; ids: string[] }[] = [
  { mots: ["république"], ids: ["v1", "v2"] },
  { mots: ["foch"], ids: ["v3", "v4"] },
  { mots: ["tanneurs"], ids: ["v5"] },
  { mots: ["hugo"], ids: ["v6"] },
  { mots: ["lilas"], ids: ["v7"] },
  { mots: ["commerce"], ids: ["v8"] },
  { mots: ["mairie"], ids: ["v9", "v1"] },
  { mots: ["marché"], ids: ["v10"] },
  { mots: ["pasteur"], ids: ["v11"] },
  { mots: ["quai"], ids: ["v12"] },
  { mots: ["paix"], ids: ["v13"] },
  { mots: ["gaulle"], ids: ["v14"] },
  { mots: ["musique", "fête"], ids: ["v9", "v3", "v13", "v6"] },
  { mots: ["triathlon", "course"], ids: ["v1", "v3", "v12", "v4"] },
];

export function resoudreTroncons(texte: string | undefined | null): string[] {
  if (!texte) return [];
  const t = texte.toLowerCase();
  const s = new Set<string>();
  for (const c of RESOLUTION_MAP) {
    if (c.mots.some((m) => t.includes(m))) {
      c.ids.forEach((id) => s.add(id));
    }
  }
  return [...s];
}
