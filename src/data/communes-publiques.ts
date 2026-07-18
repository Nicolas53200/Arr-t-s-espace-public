export interface ArretePublic {
  id: string;
  numero: string;
  titre: string;
  type_label: string;
  type_code: string;
  date_debut: string;
  date_fin: string;
  impact: string;
  impact_label: string;
  commune: string;
  commune_id: string;
  coordonnees: [number, number][]; // [lng, lat]
  geometrie_type: "LineString" | "Polygon";
}

export interface CommuneInfo {
  id: string;
  nom: string;
  centre: [number, number]; // [lat, lng]
  code_postal: string;
  departement: string;
  arretes_count: number;
}

export const COMMUNES: CommuneInfo[] = [
  {
    id: "tenant_saint_avoye",
    nom: "Saint-Avoye",
    centre: [47.6510, -2.7815],
    code_postal: "56000",
    departement: "Morbihan (56)",
    arretes_count: 3,
  },
  {
    id: "tenant_vannes",
    nom: "Vannes",
    centre: [47.6570, -2.7560],
    code_postal: "56000",
    departement: "Morbihan (56)",
    arretes_count: 4,
  },
  {
    id: "tenant_lorient",
    nom: "Lorient",
    centre: [47.7483, -3.3640],
    code_postal: "56100",
    departement: "Morbihan (56)",
    arretes_count: 3,
  },
];


export const ARRETES_PUBLICS: ArretePublic[] = [
  // --- SAINT-AVOYE (quartier ouest de Vannes) ---
  {
    id: "pub_sa_1",
    numero: "AR-2026-0142-SPO",
    titre: "Triathlon de Saint-Avoye",
    type_label: "Manifestation sportive",
    type_code: "manifestation_sportive",
    date_debut: "2026-07-05",
    date_fin: "2026-07-05",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [
      [-2.7847, 47.6490], [-2.7839, 47.6493], [-2.7830, 47.6497],
      [-2.7822, 47.6501], [-2.7815, 47.6506], [-2.7808, 47.6510],
      [-2.7800, 47.6513], [-2.7791, 47.6516], [-2.7783, 47.6518],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_2",
    numero: "AR-2026-0138-TRX",
    titre: "Refection de chaussee — Rue Aristide Briand",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-20",
    date_fin: "2026-07-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [
      [-2.7808, 47.6530], [-2.7805, 47.6525], [-2.7801, 47.6520],
      [-2.7798, 47.6515], [-2.7796, 47.6510], [-2.7793, 47.6505],
      [-2.7790, 47.6500], [-2.7788, 47.6496],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_3",
    numero: "AR-2026-0151-TRX",
    titre: "Travaux fibre optique — Rue du Marechal Foch",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-08-10",
    date_fin: "2026-09-05",
    impact: "deviation",
    impact_label: "Deviation",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [
      [-2.7850, 47.6520], [-2.7842, 47.6518], [-2.7834, 47.6517],
      [-2.7825, 47.6516], [-2.7817, 47.6515], [-2.7808, 47.6514],
      [-2.7800, 47.6513],
    ],
    geometrie_type: "LineString",
  },

  // --- VANNES (centre-ville intra-muros) ---
  {
    id: "pub_va_1",
    numero: "VA-2026-0087-TRX",
    titre: "Travaux reseau eau — Rue du Mene",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-07-01",
    date_fin: "2026-07-25",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    coordonnees: [
      [-2.7576, 47.6590], [-2.7574, 47.6586], [-2.7571, 47.6582],
      [-2.7569, 47.6578], [-2.7567, 47.6574], [-2.7565, 47.6570],
      [-2.7563, 47.6566], [-2.7561, 47.6563], [-2.7559, 47.6560],
      [-2.7558, 47.6557],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_va_2",
    numero: "VA-2026-0091-MAN",
    titre: "Marche nocturne — Place des Lices",
    type_label: "Manifestation",
    type_code: "manifestation",
    date_debut: "2026-07-15",
    date_fin: "2026-07-15",
    impact: "zone_reservee",
    impact_label: "Zone reservee",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    coordonnees: [
      [-2.7594, 47.6582], [-2.7586, 47.6584], [-2.7578, 47.6583],
      [-2.7576, 47.6578], [-2.7578, 47.6574], [-2.7586, 47.6573],
      [-2.7594, 47.6575], [-2.7596, 47.6579], [-2.7594, 47.6582],
    ],
    geometrie_type: "Polygon",
  },
  {
    id: "pub_va_3",
    numero: "VA-2026-0093-STA",
    titre: "Stationnement interdit — Rue de la Fontaine",
    type_label: "Stationnement interdit",
    type_code: "stationnement_interdit",
    date_debut: "2026-07-10",
    date_fin: "2026-07-20",
    impact: "stationnement_interdit",
    impact_label: "Stationnement interdit",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    coordonnees: [
      [-2.7548, 47.6558], [-2.7544, 47.6555], [-2.7540, 47.6552],
      [-2.7536, 47.6549], [-2.7533, 47.6546], [-2.7530, 47.6543],
      [-2.7527, 47.6540],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_va_4",
    numero: "VA-2026-0095-TRX",
    titre: "Reparation canalisation — Avenue Victor Hugo",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-07-08",
    date_fin: "2026-07-30",
    impact: "deviation",
    impact_label: "Deviation",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    coordonnees: [
      [-2.7510, 47.6592], [-2.7515, 47.6588], [-2.7520, 47.6584],
      [-2.7524, 47.6580], [-2.7528, 47.6576], [-2.7532, 47.6572],
      [-2.7535, 47.6568], [-2.7538, 47.6564], [-2.7541, 47.6560],
    ],
    geometrie_type: "LineString",
  },

  // --- LORIENT (centre-ville) ---
  {
    id: "pub_lo_1",
    numero: "LO-2026-0204-TRX",
    titre: "Rehabilitation pont du Scorff",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-15",
    date_fin: "2026-09-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    coordonnees: [
      [-3.3598, 47.7488], [-3.3594, 47.7486], [-3.3589, 47.7484],
      [-3.3584, 47.7482], [-3.3579, 47.7481], [-3.3574, 47.7480],
      [-3.3569, 47.7479], [-3.3564, 47.7478], [-3.3559, 47.7478],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_lo_2",
    numero: "LO-2026-0210-MAN",
    titre: "Festival Interceltique — Place Jules Ferry",
    type_label: "Manifestation",
    type_code: "manifestation",
    date_debut: "2026-08-01",
    date_fin: "2026-08-10",
    impact: "zone_reservee",
    impact_label: "Zone reservee",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    coordonnees: [
      [-3.3656, 47.7484], [-3.3648, 47.7487], [-3.3640, 47.7486],
      [-3.3638, 47.7481], [-3.3640, 47.7477], [-3.3648, 47.7475],
      [-3.3656, 47.7477], [-3.3658, 47.7481], [-3.3656, 47.7484],
    ],
    geometrie_type: "Polygon",
  },
  {
    id: "pub_lo_3",
    numero: "LO-2026-0215-STA",
    titre: "Travaux trottoir — Rue Marechal Foch",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-07-05",
    date_fin: "2026-07-28",
    impact: "stationnement_interdit",
    impact_label: "Stationnement interdit",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    coordonnees: [
      [-3.3670, 47.7492], [-3.3665, 47.7490], [-3.3660, 47.7489],
      [-3.3655, 47.7488], [-3.3650, 47.7487], [-3.3645, 47.7486],
      [-3.3640, 47.7486], [-3.3635, 47.7485],
    ],
    geometrie_type: "LineString",
  },
];
