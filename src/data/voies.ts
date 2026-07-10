import type { Voie } from "@/types";

export const VOIES: Voie[] = [
  { id: "v1", nom: "Rue de la République (N)", path: "M 60 40 L 60 180", cx: 60, cy: 110 },
  { id: "v2", nom: "Rue de la République (S)", path: "M 60 180 L 60 320", cx: 60, cy: 250 },
  { id: "v3", nom: "Avenue Foch (O)", path: "M 60 180 L 220 180", cx: 140, cy: 180 },
  { id: "v4", nom: "Avenue Foch (E)", path: "M 220 180 L 340 180", cx: 280, cy: 180 },
  { id: "v5", nom: "Rue des Tanneurs", path: "M 120 60 L 120 180", cx: 120, cy: 120 },
  { id: "v6", nom: "Rue Victor Hugo", path: "M 180 40 L 180 180", cx: 180, cy: 110 },
  { id: "v7", nom: "Rue des Lilas", path: "M 220 100 L 220 180", cx: 220, cy: 140 },
  { id: "v8", nom: "Rue du Commerce", path: "M 260 180 L 260 300", cx: 260, cy: 240 },
  { id: "v9", nom: "Place de la Mairie", path: "M 60 180 L 100 180 L 100 220 L 60 220 Z", cx: 80, cy: 200, isZone: true },
  { id: "v10", nom: "Place du Marché", path: "M 200 220 L 260 220 L 260 280 L 200 280 Z", cx: 230, cy: 250, isZone: true },
  { id: "v11", nom: "Rue Pasteur", path: "M 120 180 L 120 280", cx: 120, cy: 230 },
  { id: "v12", nom: "Quai Sud", path: "M 20 320 L 340 320", cx: 180, cy: 320 },
  { id: "v13", nom: "Rue de la Paix", path: "M 180 180 L 180 280", cx: 180, cy: 230 },
  { id: "v14", nom: "Rue du Général de Gaulle", path: "M 60 120 L 180 120", cx: 120, cy: 120 },
];
