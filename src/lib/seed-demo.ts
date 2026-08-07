/**
 * Données de démonstration pré-chargées au premier lancement.
 *
 * Si le registre est vide (aucune collectivité en localStorage),
 * ce module injecte deux collectivités de démo avec des arrêtés
 * et des utilisateurs prêts à l'emploi.
 *
 * Identifiants de connexion :
 *   Ville de Rennes  → admin@rennes.fr / admin123   (code d'accès : RENNES-2026)
 *   Ville de Vannes  → admin@vannes.fr / admin123   (code d'accès : VANNES-2026)
 */
import {
  getCollectivites,
  sauvegarderCollectivites,
  sauvegarderUtilisateurs,
  sauvegarderArretes,
  type CollectiviteRegistre,
} from "@/lib/registre";
import { creerBasesLegalesNationales } from "@/data/bases-legales";
import { sauvegarderReferences } from "@/lib/registre";
import type { User, Arrete } from "@/types";

const CLE_SEED_FAIT = "demo_seed_done";

/** Vérifie si le seed a déjà été appliqué. */
function seedDejaApplique(): boolean {
  return localStorage.getItem(CLE_SEED_FAIT) === "1" || getCollectivites().length > 0;
}

/** Marque le seed comme effectué. */
function marquerSeed(): void {
  localStorage.setItem(CLE_SEED_FAIT, "1");
}

// ──── Collectivités de démo ────

const COLLECTIVITES_DEMO: CollectiviteRegistre[] = [
  {
    id: "tenant_rennes",
    nom: "Ville de Rennes",
    code_postal: "35000",
    siren: "213500206",
    email_admin: "admin@rennes.fr",
    code_acces: "RENNES-2026",
    active: true,
    date_creation: "2026-01-15",
    mot_de_passe: "admin123",
    adresse: "Place de la Mairie, 35000 Rennes",
    telephone: "02 23 62 10 10",
    email_contact: "contact@rennes.fr",
    nom_maire: "Nathalie Appéré",
    titre_maire: "Maire de Rennes",
  },
  {
    id: "tenant_vannes",
    nom: "Ville de Vannes",
    code_postal: "56000",
    siren: "215600482",
    email_admin: "admin@vannes.fr",
    code_acces: "VANNES-2026",
    active: true,
    date_creation: "2026-02-01",
    mot_de_passe: "admin123",
    adresse: "Place Maurice Marchais, 56000 Vannes",
    telephone: "02 97 01 60 00",
    email_contact: "contact@vannes.fr",
    nom_maire: "David Robo",
    titre_maire: "Maire de Vannes",
  },
];

// ──── Utilisateurs de démo ────

const UTILISATEURS_DEMO: User[] = [
  {
    id: "u_tenant_rennes",
    nom: "Admin Rennes",
    email: "admin@rennes.fr",
    role: "admin",
    tenant_id: "tenant_rennes",
  },
  {
    id: "u_rennes_redacteur",
    nom: "Marie Dupont",
    email: "m.dupont@rennes.fr",
    role: "redacteur",
    tenant_id: "tenant_rennes",
  },
  {
    id: "u_tenant_vannes",
    nom: "Admin Vannes",
    email: "admin@vannes.fr",
    role: "admin",
    tenant_id: "tenant_vannes",
  },
  {
    id: "u_vannes_redacteur",
    nom: "Jean-Luc Martin",
    email: "jl.martin@vannes.fr",
    role: "redacteur",
    tenant_id: "tenant_vannes",
  },
];

// ──── Arrêtés de démo pour Rennes ────

const ARRETES_RENNES: Arrete[] = [
  {
    id: "ar_rennes_1",
    numero: "AR-2026-0201-TRX",
    type_code: "travaux",
    type_label: "Travaux",
    titre: "Réfection réseau d'eau — Rue de la Visitation",
    statut: "publie",
    cree_par: "Admin Rennes",
    date_creation: "2026-06-10",
    date_debut: "2026-07-01",
    date_fin: "2026-08-15",
    commune: "Rennes",
    commune_id: "tenant_rennes",
    voies: ["Rue de la Visitation", "Rue Leperdit"],
    troncons: [
      {
        voie_id: "v_rennes_1",
        impact: "circulation_interdite",
        label: "Rue de la Visitation",
        coordonnees: [
          [-1.6800, 48.1120],
          [-1.6795, 48.1125],
          [-1.6790, 48.1130],
          [-1.6785, 48.1135],
        ],
      },
      {
        voie_id: "v_rennes_2",
        impact: "stationnement_interdit",
        label: "Rue Leperdit",
        coordonnees: [
          [-1.6790, 48.1130],
          [-1.6785, 48.1128],
          [-1.6780, 48.1126],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
  },
  {
    id: "ar_rennes_2",
    numero: "AR-2026-0215-MAN",
    type_code: "manifestation",
    type_label: "Manifestation",
    titre: "Marché de Noël — Place de la Mairie",
    statut: "publie",
    cree_par: "Marie Dupont",
    date_creation: "2026-06-20",
    date_debut: "2026-12-01",
    date_fin: "2026-12-24",
    commune: "Rennes",
    commune_id: "tenant_rennes",
    voies: ["Place de la Mairie", "Rue d'Estrées"],
    troncons: [
      {
        voie_id: "v_rennes_3",
        impact: "zone_reservee",
        label: "Place de la Mairie",
        coordonnees: [
          [-1.6837, 48.1113],
          [-1.6832, 48.1115],
          [-1.6830, 48.1110],
          [-1.6835, 48.1108],
          [-1.6837, 48.1113],
        ],
        geometrie_type: "Polygon",
      },
      {
        voie_id: "v_rennes_4",
        impact: "stationnement_interdit",
        label: "Rue d'Estrées",
        coordonnees: [
          [-1.6835, 48.1115],
          [-1.6840, 48.1118],
          [-1.6845, 48.1121],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
    considerants: [
      "Considérant la nécessité d'organiser le marché de Noël sur la place de la Mairie dans des conditions garantissant la sécurité des visiteurs et des commerçants",
      "Considérant que cette manifestation revêt un caractère d'intérêt général pour l'animation du centre-ville",
    ],
    derogations: ["Accès maintenu pour les véhicules de secours et d'urgence"],
    clause_fourriere: true,
    clause_recours: true,
    perimetre: "Place de la Mairie et rues adjacentes dans un rayon de 100 mètres",
  },
  {
    id: "ar_rennes_3",
    numero: "AR-2026-0220-CIR",
    type_code: "circulation_interdite",
    type_label: "Circulation interdite",
    titre: "Piétonisation estivale — Rue Saint-Georges",
    statut: "publie",
    cree_par: "Admin Rennes",
    date_creation: "2026-07-01",
    date_debut: "2026-07-15",
    date_fin: "2026-08-31",
    commune: "Rennes",
    commune_id: "tenant_rennes",
    voies: ["Rue Saint-Georges"],
    troncons: [
      {
        voie_id: "v_rennes_5",
        impact: "circulation_interdite",
        label: "Rue Saint-Georges",
        coordonnees: [
          [-1.6812, 48.1135],
          [-1.6808, 48.1130],
          [-1.6805, 48.1125],
          [-1.6802, 48.1120],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
    derogations: [
      "Accès maintenu pour les riverains munis d'un macaron résident",
      "Accès maintenu pour les véhicules de livraison de 6h à 10h",
      "Accès maintenu pour les véhicules de secours",
    ],
  },
  {
    id: "ar_rennes_4",
    numero: "AR-2026-0205-STA",
    type_code: "stationnement_interdit",
    type_label: "Stationnement interdit",
    titre: "Déménagement — 12 Rue de la Monnaie",
    statut: "valide",
    cree_par: "Marie Dupont",
    date_creation: "2026-07-10",
    date_debut: "2026-08-01",
    date_fin: "2026-08-01",
    commune: "Rennes",
    commune_id: "tenant_rennes",
    voies: ["Rue de la Monnaie"],
    troncons: [
      {
        voie_id: "v_rennes_6",
        impact: "stationnement_interdit",
        label: "Rue de la Monnaie (n°10 à n°14)",
        coordonnees: [
          [-1.6822, 48.1105],
          [-1.6818, 48.1107],
          [-1.6814, 48.1109],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
    clause_fourriere: true,
  },
];

// ──── Arrêtés de démo pour Vannes ────

const ARRETES_VANNES: Arrete[] = [
  {
    id: "ar_vannes_1",
    numero: "AR-2026-0142-SPO",
    type_code: "manifestation_sportive",
    type_label: "Manifestation sportive",
    titre: "Triathlon du Golfe du Morbihan",
    statut: "publie",
    cree_par: "Admin Vannes",
    date_creation: "2026-06-18",
    date_debut: "2026-07-05",
    date_fin: "2026-07-05",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    voies: ["Promenade de la Rabine", "Rue du Port", "Quai Tabarly"],
    troncons: [
      {
        voie_id: "v_vannes_1",
        impact: "circulation_interdite",
        label: "Promenade de la Rabine",
        coordonnees: [
          [-2.7590, 47.6530],
          [-2.7585, 47.6535],
          [-2.7580, 47.6540],
          [-2.7575, 47.6545],
        ],
      },
      {
        voie_id: "v_vannes_2",
        impact: "circulation_interdite",
        label: "Rue du Port",
        coordonnees: [
          [-2.7575, 47.6545],
          [-2.7570, 47.6548],
          [-2.7565, 47.6550],
        ],
      },
      {
        voie_id: "v_vannes_3",
        impact: "deviation",
        label: "Quai Tabarly",
        coordonnees: [
          [-2.7560, 47.6550],
          [-2.7555, 47.6552],
          [-2.7550, 47.6555],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
    perimetre: "Du port de plaisance à la promenade de la Rabine, incluant les quais et la zone de transition",
    derogations: [
      "Accès maintenu pour les participants munis de leur dossard",
      "Accès maintenu pour les véhicules de secours et d'organisation",
    ],
    clause_recours: true,
  },
  {
    id: "ar_vannes_2",
    numero: "AR-2026-0138-TRX",
    type_code: "travaux",
    type_label: "Travaux",
    titre: "Rénovation des remparts — Porte Saint-Vincent",
    statut: "publie",
    cree_par: "Jean-Luc Martin",
    date_creation: "2026-06-01",
    date_debut: "2026-06-20",
    date_fin: "2026-10-15",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    voies: ["Rue Francis Decker", "Place Gambetta"],
    troncons: [
      {
        voie_id: "v_vannes_4",
        impact: "circulation_interdite",
        label: "Rue Francis Decker",
        coordonnees: [
          [-2.7575, 47.6558],
          [-2.7572, 47.6555],
          [-2.7570, 47.6552],
        ],
      },
      {
        voie_id: "v_vannes_5",
        impact: "stationnement_interdit",
        label: "Place Gambetta (côté sud)",
        coordonnees: [
          [-2.7570, 47.6560],
          [-2.7565, 47.6558],
          [-2.7560, 47.6556],
          [-2.7558, 47.6560],
          [-2.7570, 47.6560],
        ],
        geometrie_type: "Polygon",
      },
    ],
    versions: [],
    arrete_abrogation: null,
  },
  {
    id: "ar_vannes_3",
    numero: "AR-2026-0155-MAR",
    type_code: "marche",
    type_label: "Marché",
    titre: "Marché nocturne estival — Place des Lices",
    statut: "publie",
    cree_par: "Admin Vannes",
    date_creation: "2026-06-25",
    date_debut: "2026-07-10",
    date_fin: "2026-08-28",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    voies: ["Place des Lices"],
    troncons: [
      {
        voie_id: "v_vannes_6",
        impact: "zone_reservee",
        label: "Place des Lices",
        coordonnees: [
          [-2.7605, 47.6575],
          [-2.7595, 47.6578],
          [-2.7590, 47.6572],
          [-2.7600, 47.6569],
          [-2.7605, 47.6575],
        ],
        geometrie_type: "Polygon",
      },
    ],
    versions: [],
    arrete_abrogation: null,
    considerants: [
      "Considérant l'intérêt pour l'animation commerciale et touristique de la ville de l'organisation d'un marché nocturne pendant la période estivale",
    ],
    clause_fourriere: true,
  },
  {
    id: "ar_vannes_4",
    numero: "AR-2026-0160-ALT",
    type_code: "alternat",
    type_label: "Alternat",
    titre: "Alternat — Rue de Mené (travaux réseau gaz)",
    statut: "en_relecture",
    cree_par: "Jean-Luc Martin",
    date_creation: "2026-07-05",
    date_debut: "2026-07-20",
    date_fin: "2026-08-10",
    commune: "Vannes",
    commune_id: "tenant_vannes",
    voies: ["Rue de Mené"],
    troncons: [
      {
        voie_id: "v_vannes_7",
        impact: "alternat",
        label: "Rue de Mené (du n°5 au n°25)",
        coordonnees: [
          [-2.7598, 47.6565],
          [-2.7595, 47.6568],
          [-2.7592, 47.6571],
        ],
      },
    ],
    versions: [],
    arrete_abrogation: null,
  },
];

// ──── Fonction principale ────

/**
 * Injecte les données de démonstration si le registre est vide.
 * Appelé une seule fois au démarrage de l'application.
 */
export function initialiserDonneesDemoSiVide(): void {
  if (seedDejaApplique()) return;

  // Sauvegarder les collectivités
  sauvegarderCollectivites(COLLECTIVITES_DEMO);

  // Sauvegarder les utilisateurs
  sauvegarderUtilisateurs(UTILISATEURS_DEMO);

  // Injecter les bases légales nationales pour chaque collectivité
  for (const c of COLLECTIVITES_DEMO) {
    const basesLegales = creerBasesLegalesNationales(c.id);
    sauvegarderReferences(c.id, basesLegales);
  }

  // Injecter les arrêtés de démo
  sauvegarderArretes("tenant_rennes", ARRETES_RENNES);
  sauvegarderArretes("tenant_vannes", ARRETES_VANNES);

  marquerSeed();

  // eslint-disable-next-line no-console
  console.log(
    "%c🏛️ Actes360 — Données de démonstration chargées",
    "color: #1E3A5F; font-weight: bold; font-size: 14px;",
  );
  // eslint-disable-next-line no-console
  console.log(
    "%cConnectez-vous avec :\n" +
    "  Rennes → Code d'accès : RENNES-2026 | admin@rennes.fr / admin123\n" +
    "  Vannes → Code d'accès : VANNES-2026 | admin@vannes.fr / admin123",
    "color: #6B6A60; font-size: 12px;",
  );
}
