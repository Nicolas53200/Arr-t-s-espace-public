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
    centre: [47.6575, -2.7610],
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
    // Rue Emile Burgault (direction est-ouest, quartier Saint-Avoye)
    coordonnees: [
      [-2.7632, 47.6578], [-2.7628, 47.6578], [-2.7624, 47.6577],
      [-2.7620, 47.6577], [-2.7616, 47.6576], [-2.7612, 47.6576],
      [-2.7608, 47.6575], [-2.7604, 47.6575], [-2.7600, 47.6575],
      [-2.7596, 47.6575], [-2.7593, 47.6576], [-2.7590, 47.6576],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_2",
    numero: "AR-2026-0138-TRX",
    titre: "Refection de chaussee — Rue Billault",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-20",
    date_fin: "2026-07-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    // Rue Billault (nord-sud, ouest de Place des Lices)
    coordonnees: [
      [-2.7610, 47.6590], [-2.7611, 47.6588], [-2.7612, 47.6586],
      [-2.7612, 47.6584], [-2.7613, 47.6582], [-2.7613, 47.6580],
      [-2.7613, 47.6578], [-2.7612, 47.6576], [-2.7611, 47.6574],
      [-2.7610, 47.6572], [-2.7609, 47.6570], [-2.7608, 47.6568],
      [-2.7607, 47.6566],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_3",
    numero: "AR-2026-0151-TRX",
    titre: "Travaux fibre optique — Rue Le Hellec",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-08-10",
    date_fin: "2026-09-05",
    impact: "deviation",
    impact_label: "Deviation",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    // Rue Le Hellec (est-ouest sous Place des Lices)
    coordonnees: [
      [-2.7622, 47.6568], [-2.7618, 47.6568], [-2.7614, 47.6567],
      [-2.7610, 47.6567], [-2.7606, 47.6567], [-2.7602, 47.6566],
      [-2.7598, 47.6566], [-2.7594, 47.6566], [-2.7590, 47.6565],
      [-2.7586, 47.6565],
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
    // Rue du Mené : axe nord-sud dans la vieille ville, de Place Henri IV vers le nord
    coordonnees: [
      [-2.7571, 47.6556], [-2.7572, 47.6558], [-2.7573, 47.6560],
      [-2.7574, 47.6562], [-2.7575, 47.6564], [-2.7576, 47.6566],
      [-2.7576, 47.6568], [-2.7577, 47.6570], [-2.7577, 47.6572],
      [-2.7578, 47.6574], [-2.7578, 47.6576], [-2.7578, 47.6578],
      [-2.7579, 47.6580], [-2.7579, 47.6582], [-2.7580, 47.6584],
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
    // Place des Lices : rectangle allonge nord-sud, ouest de la vieille ville
    coordonnees: [
      [-2.7598, 47.6580], [-2.7592, 47.6581], [-2.7586, 47.6581],
      [-2.7583, 47.6580], [-2.7582, 47.6577], [-2.7582, 47.6574],
      [-2.7583, 47.6571], [-2.7586, 47.6570], [-2.7592, 47.6570],
      [-2.7598, 47.6571], [-2.7600, 47.6574], [-2.7600, 47.6577],
      [-2.7598, 47.6580],
    ],
    geometrie_type: "Polygon",
  },
  {
    id: "pub_va_3",
    numero: "VA-2026-0093-STA",
    titre: "Stationnement interdit — Rue des Chanoines",
    type_label: "Stationnement interdit",
    type_code: "stationnement_interdit",
    date_debut: "2026-07-10",
    date_fin: "2026-07-20",
    impact: "stationnement_interdit",
    impact_label: "Stationnement interdit",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    // Rue des Chanoines : parallele a Rue du Mene, cote est
    coordonnees: [
      [-2.7564, 47.6560], [-2.7563, 47.6562], [-2.7562, 47.6564],
      [-2.7561, 47.6566], [-2.7560, 47.6568], [-2.7559, 47.6570],
      [-2.7558, 47.6572], [-2.7558, 47.6574], [-2.7557, 47.6576],
      [-2.7556, 47.6578], [-2.7555, 47.6580],
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
    // Avenue Victor Hugo : direction nord-sud, ouest du centre
    coordonnees: [
      [-2.7604, 47.6596], [-2.7604, 47.6594], [-2.7603, 47.6592],
      [-2.7602, 47.6590], [-2.7601, 47.6588], [-2.7600, 47.6586],
      [-2.7599, 47.6584], [-2.7598, 47.6582],
    ],
    geometrie_type: "LineString",
  },

  // --- LORIENT (centre-ville) ---
  {
    id: "pub_lo_1",
    numero: "LO-2026-0204-TRX",
    titre: "Rehabilitation pont Saint-Christophe",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-15",
    date_fin: "2026-09-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    // Cours de Chazelles (axe est-ouest, centre Lorient)
    coordonnees: [
      [-3.3700, 47.7486], [-3.3696, 47.7486], [-3.3692, 47.7485],
      [-3.3688, 47.7485], [-3.3684, 47.7485], [-3.3680, 47.7484],
      [-3.3676, 47.7484], [-3.3672, 47.7484], [-3.3668, 47.7483],
      [-3.3664, 47.7483], [-3.3660, 47.7483], [-3.3656, 47.7482],
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
    // Place Jules Ferry (place rectangulaire, centre Lorient)
    coordonnees: [
      [-3.3650, 47.7492], [-3.3644, 47.7493], [-3.3638, 47.7493],
      [-3.3634, 47.7492], [-3.3632, 47.7490], [-3.3632, 47.7488],
      [-3.3634, 47.7486], [-3.3638, 47.7485], [-3.3644, 47.7485],
      [-3.3650, 47.7486], [-3.3652, 47.7488], [-3.3652, 47.7490],
      [-3.3650, 47.7492],
    ],
    geometrie_type: "Polygon",
  },
  {
    id: "pub_lo_3",
    numero: "LO-2026-0215-STA",
    titre: "Travaux trottoir — Rue du Port",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-07-05",
    date_fin: "2026-07-28",
    impact: "stationnement_interdit",
    impact_label: "Stationnement interdit",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    // Rue du Port (direction nord-sud, vers le port)
    coordonnees: [
      [-3.3640, 47.7496], [-3.3640, 47.7494], [-3.3641, 47.7492],
      [-3.3641, 47.7490], [-3.3642, 47.7488], [-3.3642, 47.7486],
      [-3.3643, 47.7484], [-3.3643, 47.7482], [-3.3644, 47.7480],
      [-3.3644, 47.7478], [-3.3645, 47.7476],
    ],
    geometrie_type: "LineString",
  },
];
