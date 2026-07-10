// GeoJSON geometries for each voie in Saint-Avoye
// Center: [47.6545, -2.7563] (fictional town near Morbihan, Brittany)
// Coordinates use GeoJSON convention: [longitude, latitude]

export interface VoieGeo {
  voie_id: string;
  nom: string;
  type: "rue" | "avenue" | "place" | "quai";
  geometrie: {
    type: "LineString" | "Polygon";
    coordinates: [number, number][]; // [lng, lat] pairs
  };
}

export const VOIES_GEO: VoieGeo[] = [
  // Rue de la République (N) — north-south, north section
  {
    voie_id: "v1",
    nom: "Rue de la République (N)",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7583, 47.6560],
        [-2.7583, 47.6552],
        [-2.7583, 47.6545],
      ],
    },
  },
  // Rue de la République (S) — north-south, south section
  {
    voie_id: "v2",
    nom: "Rue de la République (S)",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7583, 47.6545],
        [-2.7583, 47.6538],
        [-2.7583, 47.6530],
      ],
    },
  },
  // Avenue Foch (O) — east-west, west section
  {
    voie_id: "v3",
    nom: "Avenue Foch (O)",
    type: "avenue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7583, 47.6545],
        [-2.7573, 47.6545],
        [-2.7563, 47.6545],
      ],
    },
  },
  // Avenue Foch (E) — east-west, east section
  {
    voie_id: "v4",
    nom: "Avenue Foch (E)",
    type: "avenue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7563, 47.6545],
        [-2.7553, 47.6545],
        [-2.7543, 47.6545],
      ],
    },
  },
  // Rue des Tanneurs — north-south, between République and Victor Hugo
  {
    voie_id: "v5",
    nom: "Rue des Tanneurs",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7578, 47.6558],
        [-2.7578, 47.6550],
        [-2.7578, 47.6545],
      ],
    },
  },
  // Rue Victor Hugo — north-south
  {
    voie_id: "v6",
    nom: "Rue Victor Hugo",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7568, 47.6560],
        [-2.7568, 47.6552],
        [-2.7568, 47.6545],
      ],
    },
  },
  // Rue des Lilas — north-south, east side
  {
    voie_id: "v7",
    nom: "Rue des Lilas",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7558, 47.6555],
        [-2.7558, 47.6550],
        [-2.7558, 47.6545],
      ],
    },
  },
  // Rue du Commerce — north-south, far east, south of Foch
  {
    voie_id: "v8",
    nom: "Rue du Commerce",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7548, 47.6545],
        [-2.7548, 47.6538],
        [-2.7548, 47.6530],
      ],
    },
  },
  // Place de la Mairie — polygon, near intersection of République and Foch
  {
    voie_id: "v9",
    nom: "Place de la Mairie",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.7585, 47.6546],
        [-2.7579, 47.6546],
        [-2.7579, 47.6542],
        [-2.7585, 47.6542],
        [-2.7585, 47.6546],
      ],
    },
  },
  // Place du Marché — polygon, southeast area
  {
    voie_id: "v10",
    nom: "Place du Marché",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.7558, 47.6542],
        [-2.7550, 47.6542],
        [-2.7550, 47.6537],
        [-2.7558, 47.6537],
        [-2.7558, 47.6542],
      ],
    },
  },
  // Rue Pasteur — north-south, between République and Victor Hugo, south of Foch
  {
    voie_id: "v11",
    nom: "Rue Pasteur",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7578, 47.6545],
        [-2.7578, 47.6538],
        [-2.7578, 47.6532],
      ],
    },
  },
  // Quai Sud — east-west along the south edge
  {
    voie_id: "v12",
    nom: "Quai Sud",
    type: "quai",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7593, 47.6528],
        [-2.7578, 47.6528],
        [-2.7563, 47.6528],
        [-2.7548, 47.6528],
      ],
    },
  },
  // Rue de la Paix — north-south, center, south of Foch
  {
    voie_id: "v13",
    nom: "Rue de la Paix",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7568, 47.6545],
        [-2.7568, 47.6538],
        [-2.7568, 47.6532],
      ],
    },
  },
  // Rue du Général de Gaulle — east-west, connecting République to Victor Hugo
  {
    voie_id: "v14",
    nom: "Rue du Général de Gaulle",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7583, 47.6552],
        [-2.7575, 47.6552],
        [-2.7568, 47.6552],
      ],
    },
  },
];

// Quick lookup by voie_id
const _index = new Map<string, VoieGeo>();
for (const v of VOIES_GEO) {
  _index.set(v.voie_id, v);
}

export function getVoieGeo(voieId: string): VoieGeo | undefined {
  return _index.get(voieId);
}
