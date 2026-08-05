// GeoJSON geometries for each voie in Saint-Avoye (mapped to real Vannes streets)
// Center: [47.6558, -2.7575] (Vannes, Morbihan, Brittany)
// Coordinates use GeoJSON convention: [longitude, latitude]
// Traces follow real road geometry with enough points for smooth rendering

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
  // Real: Rue Le Hellec from Place des Lices heading south
  {
    voie_id: "v1",
    nom: "Rue de la République (N)",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75720, 47.65830],
        [-2.75715, 47.65800],
        [-2.75708, 47.65770],
        [-2.75700, 47.65740],
        [-2.75690, 47.65710],
        [-2.75682, 47.65680],
        [-2.75675, 47.65650],
        [-2.75668, 47.65620],
        [-2.75660, 47.65590],
        [-2.75652, 47.65560],
        [-2.75645, 47.65530],
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
        [-2.75645, 47.65530],
        [-2.75640, 47.65505],
        [-2.75635, 47.65480],
        [-2.75628, 47.65455],
        [-2.75620, 47.65430],
        [-2.75612, 47.65405],
        [-2.75605, 47.65380],
        [-2.75598, 47.65355],
        [-2.75590, 47.65330],
      ],
    },
  },
  // Rue des Tribunaux — west section (mapped to "Avenue Foch (O)")
  // Real: runs east-west from Rue Le Hellec intersection
  {
    voie_id: "v3",
    nom: "Avenue Foch (O)",
    type: "avenue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75645, 47.65530],
        [-2.75600, 47.65535],
        [-2.75555, 47.65540],
        [-2.75510, 47.65545],
        [-2.75465, 47.65548],
        [-2.75420, 47.65550],
        [-2.75375, 47.65552],
        [-2.75330, 47.65555],
        [-2.75285, 47.65558],
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
        [-2.75285, 47.65558],
        [-2.75240, 47.65560],
        [-2.75195, 47.65562],
        [-2.75150, 47.65565],
        [-2.75105, 47.65568],
        [-2.75060, 47.65570],
        [-2.75015, 47.65572],
        [-2.74970, 47.65575],
      ],
    },
  },
  // Rue Billault (mapped to "Rue des Tanneurs")
  // Real: runs NE-SW connecting to Place Gambetta area
  {
    voie_id: "v5",
    nom: "Rue des Tanneurs",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75550, 47.65720],
        [-2.75545, 47.65695],
        [-2.75538, 47.65670],
        [-2.75530, 47.65645],
        [-2.75520, 47.65620],
        [-2.75512, 47.65595],
        [-2.75505, 47.65570],
        [-2.75498, 47.65545],
        [-2.75490, 47.65530],
      ],
    },
  },
  // Rue Jeanne d'Arc (mapped to "Rue Victor Hugo")
  // Real: runs N-S in central Vannes
  {
    voie_id: "v6",
    nom: "Rue Victor Hugo",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75340, 47.65700],
        [-2.75345, 47.65675],
        [-2.75350, 47.65650],
        [-2.75355, 47.65625],
        [-2.75358, 47.65600],
        [-2.75360, 47.65580],
        [-2.75362, 47.65560],
        [-2.75365, 47.65545],
        [-2.75370, 47.65530],
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
        [-2.75100, 47.65680],
        [-2.75105, 47.65655],
        [-2.75110, 47.65630],
        [-2.75115, 47.65605],
        [-2.75118, 47.65585],
        [-2.75120, 47.65565],
        [-2.75122, 47.65550],
        [-2.75125, 47.65535],
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
        [-2.75140, 47.65500],
        [-2.75148, 47.65475],
        [-2.75155, 47.65450],
        [-2.75162, 47.65425],
        [-2.75170, 47.65400],
        [-2.75178, 47.65375],
        [-2.75185, 47.65350],
        [-2.75192, 47.65325],
        [-2.75200, 47.65300],
      ],
    },
  },
  // Place des Lices (mapped to "Place de la Mairie")
  // Real: hexagonal plaza in old town
  {
    voie_id: "v9",
    nom: "Place de la Mairie",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.75760, 47.65790],
        [-2.75700, 47.65800],
        [-2.75650, 47.65790],
        [-2.75640, 47.65760],
        [-2.75650, 47.65730],
        [-2.75700, 47.65720],
        [-2.75760, 47.65730],
        [-2.75770, 47.65760],
        [-2.75760, 47.65790],
      ],
    },
  },
  // Place Gambetta (mapped to "Place du Marché")
  // Real: oval/round plaza
  {
    voie_id: "v10",
    nom: "Place du Marché",
    type: "place",
    geometrie: {
      type: "Polygon",
      coordinates: [
        [-2.75340, 47.65480],
        [-2.75280, 47.65490],
        [-2.75230, 47.65480],
        [-2.75220, 47.65450],
        [-2.75230, 47.65420],
        [-2.75280, 47.65410],
        [-2.75340, 47.65420],
        [-2.75350, 47.65450],
        [-2.75340, 47.65480],
      ],
    },
  },
  // Rue Louis Pasteur (mapped to "Rue Pasteur")
  // Real: runs NE from Place des Lices area
  {
    voie_id: "v11",
    nom: "Rue Pasteur",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75860, 47.65710],
        [-2.75845, 47.65685],
        [-2.75830, 47.65660],
        [-2.75815, 47.65635],
        [-2.75800, 47.65610],
        [-2.75785, 47.65585],
        [-2.75770, 47.65560],
        [-2.75755, 47.65540],
      ],
    },
  },
  // Quai Bernard Moitessier (mapped to "Quai Sud")
  // Real: waterfront quay running E-W along the port
  {
    voie_id: "v12",
    nom: "Quai Sud",
    type: "quai",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75850, 47.65250],
        [-2.75790, 47.65255],
        [-2.75730, 47.65260],
        [-2.75670, 47.65265],
        [-2.75610, 47.65268],
        [-2.75550, 47.65270],
        [-2.75490, 47.65275],
        [-2.75430, 47.65280],
        [-2.75370, 47.65285],
        [-2.75310, 47.65290],
        [-2.75250, 47.65295],
      ],
    },
  },
  // Rue de la Monnaie (mapped to "Rue de la Paix")
  // Real: runs N-S in medieval quarter
  {
    voie_id: "v13",
    nom: "Rue de la Paix",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75450, 47.65560],
        [-2.75455, 47.65535],
        [-2.75460, 47.65510],
        [-2.75465, 47.65485],
        [-2.75468, 47.65460],
        [-2.75470, 47.65440],
        [-2.75472, 47.65420],
        [-2.75475, 47.65400],
      ],
    },
  },
  // Rue de la Fontaine (mapped to "Rue du Général de Gaulle")
  // Real: runs E-W connecting main arteries
  {
    voie_id: "v14",
    nom: "Rue du Général de Gaulle",
    type: "rue",
    geometrie: {
      type: "LineString",
      coordinates: [
        [-2.75700, 47.65700],
        [-2.75660, 47.65695],
        [-2.75620, 47.65690],
        [-2.75580, 47.65685],
        [-2.75540, 47.65680],
        [-2.75500, 47.65675],
        [-2.75460, 47.65670],
        [-2.75420, 47.65665],
        [-2.75380, 47.65660],
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
