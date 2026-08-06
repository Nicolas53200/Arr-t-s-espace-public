/**
 * Générateur intelligent de contenu juridique pour arrêtés municipaux.
 *
 * Pré-remplit automatiquement les considérants, dérogations, clauses
 * et périmètre en fonction du contexte de l'arrêté (type, voies, impact…).
 * L'agent municipal n'a plus qu'à valider ou ajuster.
 */
import type { CodeTypeArrete, CodeImpact, ArticlePersonnalise } from "@/types";

export interface ContexteArrete {
  type_code: CodeTypeArrete;
  type_label: string;
  titre: string;
  voies: string[];
  impacts: CodeImpact[];
  /** Champs spécifiques remplis dans le formulaire */
  valeurs: Record<string, string | boolean>;
}

export interface ContenuJuridique {
  considerants: string[];
  derogations: string[];
  articles_personnalises: ArticlePersonnalise[];
  clause_fourriere: boolean;
  clause_recours: boolean;
  perimetre: string;
}

// ──── Considérants par type d'arrêté ────

const CONSIDERANTS_BASE: Record<string, string[]> = {
  circulation_interdite: [
    "qu'il est nécessaire de réglementer temporairement la circulation sur la voie publique afin de garantir la sécurité des usagers",
    "que les impératifs de sécurité et de commodité de passage imposent l'interdiction temporaire de la circulation sur les voies concernées",
  ],
  stationnement_interdit: [
    "qu'il convient de réglementer temporairement le stationnement sur la voie publique",
    "que l'occupation de la chaussée ou des trottoirs nécessite la libération des emplacements de stationnement concernés",
  ],
  alternat: [
    "que les travaux en cours nécessitent la mise en place d'une circulation alternée pour maintenir l'accès tout en assurant la sécurité du chantier",
    "que les impératifs de sécurité imposent une réduction temporaire de la capacité de circulation",
  ],
  travaux: [
    "que les travaux nécessitent une emprise sur la voie publique incompatible avec les conditions normales de circulation et de stationnement",
    "qu'il convient de prendre les mesures nécessaires pour assurer la sécurité des usagers de la voie publique pendant la durée des travaux",
    "que les nécessités d'assurer l'accès des véhicules de secours et de sécurité doivent être garanties",
  ],
  manifestation: [
    "qu'en raison de l'organisation de cet événement, il convient de garantir la sécurité des personnes et des biens, ainsi que le bon déroulement de la manifestation",
    "que l'affluence attendue nécessite de modifier temporairement les conditions habituelles de circulation et de stationnement",
    "que les nécessités d'assurer l'accès des véhicules de secours et de sécurité doivent être garanties",
  ],
  manifestation_sportive: [
    "qu'en raison de l'organisation de cette manifestation sportive, il convient de garantir la sécurité des participants et des spectateurs",
    "que le parcours de l'épreuve traverse la voie publique et nécessite une interdiction temporaire de circulation",
    "que les nécessités d'assurer l'accès des véhicules de secours et de sécurité doivent être garanties",
  ],
  marche: [
    "que la tenue du marché nécessite l'occupation de la voie publique et l'installation de stands et étals",
    "qu'il convient de garantir la sécurité des commerçants et des visiteurs ainsi que le bon déroulement du marché",
    "que les nécessités d'assurer l'accès des véhicules de secours doivent être garanties",
  ],
  occupation_dp: [
    "que l'occupation temporaire du domaine public nécessite la mise en place de mesures de sécurité adaptées",
    "qu'il convient de garantir la sécurité des usagers de la voie publique et des riverains",
  ],
  demenagement: [
    "que les opérations de déménagement nécessitent la réservation temporaire d'un emplacement sur la voie publique",
    "qu'il convient de faciliter les opérations tout en garantissant la sécurité des usagers",
  ],
};

// ──── Dérogations par type ────

const DEROGATIONS_BASE: Record<string, string[]> = {
  circulation_interdite: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Riverains sur présentation d'un justificatif de domicile",
  ],
  travaux: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Riverains sur présentation d'un justificatif de domicile",
    "Véhicules de l'entreprise titulaire du marché de travaux",
  ],
  manifestation: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Organisateurs et exposants munis d'un macaron officiel délivré par la mairie",
    "Riverains sur présentation d'un justificatif de domicile, circulation au pas",
  ],
  manifestation_sportive: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Véhicules de l'organisation de la course",
    "Riverains sur présentation d'un justificatif de domicile, uniquement hors passage des coureurs",
  ],
  marche: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Commerçants et exposants du marché pour les opérations de chargement et déchargement",
    "Véhicules de livraison avant l'heure d'ouverture du marché",
  ],
  stationnement_interdit: [],
  alternat: [],
  occupation_dp: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
  ],
  demenagement: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
  ],
};

// ──── Périmètre par type ────

function genererPerimetre(ctx: ContexteArrete): string {
  const voiesTexte = ctx.voies.length > 0
    ? ctx.voies.join(", ")
    : "les voies concernées";

  switch (ctx.type_code) {
    case "manifestation":
    case "manifestation_sportive":
    case "marche":
      return `La zone réglementée est délimitée par ${voiesTexte}. Les limites sont matérialisées par des barrières de sécurité et une signalisation temporaire conforme à la réglementation en vigueur.`;
    default:
      return "";
  }
}

// ──── Articles par type ────

function genererArticlesPersonnalises(ctx: ContexteArrete): ArticlePersonnalise[] {
  const articles: ArticlePersonnalise[] = [];

  // Pour les manifestations, ajouter un article sur les conditions générales
  if (["manifestation", "manifestation_sportive", "marche"].includes(ctx.type_code)) {
    const organisateur = (ctx.valeurs["organisateur"] as string) || (ctx.valeurs["nom_evenement"] as string) || "";
    if (organisateur) {
      articles.push({
        id: `gen_${Date.now()}_orga`,
        titre: "Responsabilité de l'organisateur",
        contenu: `L'organisateur (${organisateur}) est tenu de se conformer aux prescriptions du présent arrêté et de prendre toutes les mesures nécessaires pour assurer la sécurité des participants et du public. Il devra remettre les lieux en l'état à l'issue de la manifestation.`,
      });
    }
  }

  return articles;
}

// ──── Fonction principale ────

/**
 * Génère automatiquement le contenu juridique d'un arrêté
 * en fonction de son contexte (type, voies, impacts…).
 */
export function genererContenuJuridique(ctx: ContexteArrete): ContenuJuridique {
  const considerantsBase = CONSIDERANTS_BASE[ctx.type_code] ?? CONSIDERANTS_BASE["circulation_interdite"]!;

  // Ajouter des considérants selon les impacts
  const considerants = [...considerantsBase];
  const hasStationnement = ctx.impacts.includes("stationnement_interdit");
  const hasCirculation = ctx.impacts.includes("circulation_interdite");
  const hasDeviation = ctx.impacts.includes("deviation");

  // Si un arrêté de type manifestation a du stationnement interdit, l'expliciter
  if (hasStationnement && !["stationnement_interdit"].includes(ctx.type_code)) {
    considerants.push(
      "que les besoins de l'opération nécessitent également la libération des emplacements de stationnement aux abords de la zone concernée",
    );
  }

  // Si déviation, mentionner l'itinéraire
  if (hasDeviation) {
    considerants.push(
      "qu'un itinéraire de déviation est mis en place afin d'assurer la continuité de la circulation",
    );
  }

  // Dérogations
  const derogationsBase = DEROGATIONS_BASE[ctx.type_code] ?? [];
  const derogations = [...derogationsBase];

  // Fourrière recommandée si stationnement interdit ou manifestation/marché
  const recommanderFourriere = hasStationnement ||
    hasCirculation ||
    ["manifestation", "manifestation_sportive", "marche"].includes(ctx.type_code);

  // Recours recommandé pour les arrêtés longs ou de grande envergure
  const recommanderRecours = ["manifestation", "manifestation_sportive", "marche", "travaux"].includes(ctx.type_code);

  // Périmètre
  const perimetre = genererPerimetre(ctx);

  // Articles personnalisés
  const articles_personnalises = genererArticlesPersonnalises(ctx);

  return {
    considerants,
    derogations,
    articles_personnalises,
    clause_fourriere: recommanderFourriere,
    clause_recours: recommanderRecours,
    perimetre,
  };
}
