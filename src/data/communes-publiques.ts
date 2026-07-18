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
  // Coordonnées recalées depuis les labels visibles sur tuiles OSM
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
      [-2.76350, 47.65780], [-2.76300, 47.65775], [-2.76250, 47.65770],
      [-2.76200, 47.65765], [-2.76150, 47.65760], [-2.76100, 47.65755],
      [-2.76050, 47.65750], [-2.76000, 47.65745], [-2.75950, 47.65740],
      [-2.75900, 47.65735],
    ],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_2",
    numero: "AR-2026-0138-TRX",
    titre: "Refection de chaussee — Rue de la Loi",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-20",
    date_fin: "2026-07-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [
      [-2.76300, 47.65700], [-2.76295, 47.65680], [-2.76290, 47.65660],
      [-2.76285, 47.65640], [-2.76280, 47.65620], [-2.76275, 47.65600],
      [-2.76270, 47.65580], [-2.76265, 47.65560], [-2.76260, 47.65540],
      [-2.76255, 47.65520],
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
    coordonnees: [
      [-2.76400, 47.65600], [-2.76350, 47.65600], [-2.76300, 47.65600],
      [-2.76250, 47.65598], [-2.76200, 47.65596], [-2.76150, 47.65594],
      [-2.76100, 47.65592], [-2.76050, 47.65590], [-2.76000, 47.65588],
    ],
    geometrie_type: "LineString",
  },

  // --- VANNES (centre-ville intra-muros) ---
  // Coordonnées recalées depuis les labels visibles sur tuiles OSM
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
      [-2.75870, 47.65870], [-2.75865, 47.65850], [-2.75860, 47.65830],
      [-2.75855, 47.65810], [-2.75850, 47.65790], [-2.75845, 47.65770],
      [-2.75840, 47.65750], [-2.75838, 47.65730], [-2.75835, 47.65710],
      [-2.75832, 47.65690], [-2.75830, 47.65670], [-2.75828, 47.65650],
      [-2.75825, 47.65630], [-2.75820, 47.65610], [-2.75815, 47.65590],
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
      [-2.76080, 47.65710], [-2.76020, 47.65720], [-2.75960, 47.65720],
      [-2.75920, 47.65710], [-2.75900, 47.65680], [-2.75900, 47.65650],
      [-2.75920, 47.65620], [-2.75960, 47.65610], [-2.76020, 47.65610],
      [-2.76080, 47.65620], [-2.76100, 47.65650], [-2.76100, 47.65680],
      [-2.76080, 47.65710],
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
    coordonnees: [
      [-2.75730, 47.65820], [-2.75725, 47.65800], [-2.75720, 47.65780],
      [-2.75715, 47.65760], [-2.75710, 47.65740], [-2.75705, 47.65720],
      [-2.75700, 47.65700], [-2.75695, 47.65680], [-2.75690, 47.65660],
      [-2.75685, 47.65640], [-2.75680, 47.65620],
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
      [-2.76150, 47.65920], [-2.76140, 47.65900], [-2.76130, 47.65880],
      [-2.76120, 47.65860], [-2.76110, 47.65840], [-2.76100, 47.65820],
      [-2.76090, 47.65800], [-2.76080, 47.65780], [-2.76070, 47.65760],
      [-2.76060, 47.65740],
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
