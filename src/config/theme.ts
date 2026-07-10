import type { StatutArrete, CodeTypeArrete } from "@/types";

export const COULEURS = {
  primaire: "#1E3A5F",
  primaireHover: "#16304F",
  fond: "#FAFAF7",
  fondAlternatif: "#F4F2EC",
  fondCarte: "#F0EDE4",
  bordure: "#E4E1D6",
  bordureLegere: "#D8D5C8",
  texte: "#1C1F1B",
  texteSecondaire: "#6B6A60",
  texteDesactive: "#A6A399",
  succes: "#2F6B4F",
  succesLeger: "#D1FAE5",
  danger: "#B91C1C",
  dangerLeger: "#FEE2E2",
  avertissement: "#D9730D",
  avertissementLeger: "#FEF3C7",
  violet: "#7C3AED",
  blanc: "#FFFFFF",
} as const;

export const STATUT_UI: Record<
  StatutArrete,
  { label: string; bg: string; color: string }
> = {
  brouillon: { label: "Brouillon", bg: "#F3F4F6", color: "#6B7280" },
  en_relecture: { label: "En relecture", bg: "#FEF3C7", color: "#92400E" },
  valide: { label: "Validé", bg: "#DBEAFE", color: "#1E3A5F" },
  publie: { label: "Publié", bg: "#D1FAE5", color: "#065F46" },
  modifie: { label: "Modifié", bg: "#E0E7FF", color: "#4338CA" },
  abroge: { label: "Abrogé", bg: "#FEE2E2", color: "#B91C1C" },
};

export const COULEUR_TYPE: Record<CodeTypeArrete, string> = {
  circulation_interdite: "#B91C1C",
  stationnement_interdit: "#D9730D",
  alternat: "#7C3AED",
  travaux: "#92400E",
  manifestation: "#0369A1",
  manifestation_sportive: "#2F6B4F",
  marche: "#B45309",
  occupation_dp: "#6B7280",
  demenagement: "#1E3A5F",
};
