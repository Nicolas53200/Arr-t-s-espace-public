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
    centre: [47.6545, -2.7563],
    code_postal: "56000",
    departement: "Morbihan (56)",
    arretes_count: 6,
  },
  {
    id: "tenant_vannes",
    nom: "Vannes",
    centre: [47.6558, -2.7600],
    code_postal: "56000",
    departement: "Morbihan (56)",
    arretes_count: 4,
  },
  {
    id: "tenant_lorient",
    nom: "Lorient",
    centre: [47.7500, -3.3700],
    code_postal: "56100",
    departement: "Morbihan (56)",
    arretes_count: 3,
  },
];


export const ARRETES_PUBLICS: ArretePublic[] = [
  // --- SAINT-AVOYE (existants) ---
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
    coordonnees: [[-2.7583, 47.6560], [-2.7583, 47.6552], [-2.7583, 47.6545]],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_2",
    numero: "AR-2026-0138-TRX",
    titre: "Refection de chaussee — Rue de la Republique",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-06-20",
    date_fin: "2026-07-15",
    impact: "circulation_interdite",
    impact_label: "Circulation interdite",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [[-2.7583, 47.6545], [-2.7583, 47.6538], [-2.7583, 47.6530]],
    geometrie_type: "LineString",
  },
  {
    id: "pub_sa_3",
    numero: "AR-2026-0151-TRX",
    titre: "Travaux fibre optique — Avenue Foch",
    type_label: "Travaux",
    type_code: "travaux",
    date_debut: "2026-08-10",
    date_fin: "2026-09-05",
    impact: "deviation",
    impact_label: "Deviation",
    commune: "Saint-Avoye",
    commune_id: "tenant_saint_avoye",
    coordonnees: [[-2.7563, 47.6545], [-2.7553, 47.6545], [-2.7543, 47.6545]],
    geometrie_type: "LineString",
  },

  // --- VANNES ---
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
    coordonnees: [[-2.7600, 47.6565], [-2.7595, 47.6560], [-2.7588, 47.6558]],
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
    coordonnees: [[-2.7610, 47.6570], [-2.7605, 47.6575], [-2.7600, 47.6570], [-2.7605, 47.6565], [-2.7610, 47.6570]],
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
    coordonnees: [[-2.7615, 47.6555], [-2.7608, 47.6552], [-2.7600, 47.6550]],
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
    coordonnees: [[-2.7580, 47.6575], [-2.7575, 47.6568], [-2.7570, 47.6562]],
    geometrie_type: "LineString",
  },

  // --- LORIENT ---
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
    coordonnees: [[-3.3720, 47.7510], [-3.3710, 47.7505], [-3.3700, 47.7500]],
    geometrie_type: "LineString",
  },
  {
    id: "pub_lo_2",
    numero: "LO-2026-0210-MAN",
    titre: "Festival Interceltique — Quai de Rohan",
    type_label: "Manifestation",
    type_code: "manifestation",
    date_debut: "2026-08-01",
    date_fin: "2026-08-10",
    impact: "zone_reservee",
    impact_label: "Zone reservee",
    commune: "Lorient",
    commune_id: "tenant_lorient",
    coordonnees: [[-3.3680, 47.7490], [-3.3670, 47.7495], [-3.3660, 47.7490], [-3.3670, 47.7485], [-3.3680, 47.7490]],
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
    coordonnees: [[-3.3690, 47.7480], [-3.3685, 47.7475], [-3.3680, 47.7470]],
    geometrie_type: "LineString",
  },
];
