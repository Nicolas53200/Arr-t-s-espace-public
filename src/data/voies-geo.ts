// GeoJSON geometries for each voie in Saint-Avoye (mapped to real Vannes streets)
// Center: [47.6545, -2.7563] (Vannes, Morbihan, Brittany)
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
  // Rue Le Hellec — north section (mapped to "Rue de la République (N)")
  {
    voie_id: "v1",
    nom: "Rue de la République (N)",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7571, 47.6582],
        [-2.7570, 47.6576],
        [-2.7568, 47.6571],
        [-2.7566, 47.6566],
        [-2.7564, 47.6561],
        [-2.7562, 47.6556],
        [-2.7560, 47.6551],
        [-2.7559, 47.6547],
      ],
    },
  },
  // Rue Le Hellec — south section (mapped to "Rue de la République (S)")
  {
    voie_id: "v2",
    nom: "Rue de la République (S)",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7559, 47.6547],
        [-2.7558, 47.6543],
        [-2.7556, 47.6539],
        [-2.7554, 47.6535],
        [-2.7552, 47.6531],
        [-2.7550, 47.6527],
      ],
    },
  },
  // Rue des Tribunaux — west section (mapped to "Avenue Foch (O)")
  {
    voie_id: "v3",
    nom: "Avenue Foch (O)",
    type: "avenue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7559, 47.6547],
        [-2.7552, 47.6548],
        [-2.7544, 47.6549],
        [-2.7536, 47.6550],
        [-2.7528, 47.6551],
      ],
    },
  },
  // Rue des Tribunaux — east section (mapped to "Avenue Foch (E)")
  {
    voie_id: "v4",
    nom: "Avenue Foch (E)",
    type: "avenue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7528, 47.6551],
        [-2.7520, 47.6552],
        [-2.7512, 47.6553],
        [-2.7504, 47.6554],
        [-2.7497, 47.6555],
      ],
    },
  },
  // Rue Billault (mapped to "Rue des Tanneurs")
  {
    voie_id: "v5",
    nom: "Rue des Tanneurs",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7555, 47.6570],
        [-2.7553, 47.6565],
        [-2.7551, 47.6560],
        [-2.7548, 47.6555],
        [-2.7544, 47.6549],
      ],
    },
  },
  // Rue Jeanne d'Arc (mapped to "Rue Victor Hugo")
  {
    voie_id: "v6",
    nom: "Rue Victor Hugo",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7530, 47.6567],
        [-2.7532, 47.6562],
        [-2.7534, 47.6558],
        [-2.7536, 47.6553],
        [-2.7536, 47.6550],
      ],
    },
  },
  // Rue des Brice (mapped to "Rue des Lilas")
  {
    voie_id: "v7",
    nom: "Rue des Lilas",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7505, 47.6565],
        [-2.7507, 47.6560],
        [-2.7509, 47.6556],
        [-2.7510, 47.6553],
      ],
    },
  },
  // Rue Maréchal Leclerc (mapped to "Rue du Commerce")
  {
    voie_id: "v8",
    nom: "Rue du Commerce",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7510, 47.6545],
        [-2.7512, 47.6540],
        [-2.7514, 47.6535],
        [-2.7516, 47.6530],
        [-2.7518, 47.6525],
      ],
    },
  },
  // Place des Lices (mapped to "Place de la Mairie")
  {
    voie_id: "v9",
    nom: "Place de la Mairie",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.7573, 47.6575],
        [-2.7563, 47.6575],
        [-2.7560, 47.6570],
        [-2.7563, 47.6565],
        [-2.7573, 47.6565],
        [-2.7576, 47.6570],
        [-2.7573, 47.6575],
      ],
    },
  },
  // Place Gambetta (mapped to "Place du Marché")
  {
    voie_id: "v10",
    nom: "Place du Marché",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.7530, 47.6543],
        [-2.7520, 47.6543],
        [-2.7518, 47.6538],
        [-2.7522, 47.6534],
        [-2.7532, 47.6534],
        [-2.7534, 47.6538],
        [-2.7530, 47.6543],
      ],
    },
  },
  // Rue Louis Pasteur (mapped to "Rue Pasteur")
  {
    voie_id: "v11",
    nom: "Rue Pasteur",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7583, 47.6567],
        [-2.7581, 47.6563],
        [-2.7578, 47.6559],
        [-2.7575, 47.6555],
        [-2.7571, 47.6551],
      ],
    },
  },
  // Quai Bernard Moitessier (mapped to "Quai Sud")
  {
    voie_id: "v12",
    nom: "Quai Sud",
    type: "quai",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7580, 47.6520],
        [-2.7570, 47.6520],
        [-2.7560, 47.6521],
        [-2.7550, 47.6522],
        [-2.7540, 47.6523],
        [-2.7530, 47.6524],
        [-2.7520, 47.6525],
      ],
    },
  },
  // Rue de la Monnaie (mapped to "Rue de la Paix")
  {
    voie_id: "v13",
    nom: "Rue de la Paix",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7540, 47.6550],
        [-2.7542, 47.6546],
        [-2.7544, 47.6542],
        [-2.7546, 47.6538],
        [-2.7548, 47.6534],
      ],
    },
  },
  // Rue de la Fontaine (mapped to "Rue du Général de Gaulle")
  {
    voie_id: "v14",
    nom: "Rue du Général de Gaulle",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.7568, 47.6566],
        [-2.7560, 47.6564],
        [-2.7552, 47.6562],
        [-2.7544, 47.6560],
        [-2.7536, 47.6558],
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
