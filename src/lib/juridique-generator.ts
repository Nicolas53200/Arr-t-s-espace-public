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
  nuisances_sonores: [
    "qu'il appartient au maire de prendre les mesures nécessaires pour réprimer les atteintes à la tranquillité publique, conformément à l'article L. 2212-2 du CGCT",
    "que les nuisances sonores constatées portent atteinte au repos et à la tranquillité des habitants",
  ],
  zone_30: [
    "qu'il convient de modérer la vitesse des véhicules afin de garantir la sécurité de tous les usagers de la voie publique, en particulier les piétons et les cyclistes",
    "que la configuration des lieux et la fréquentation piétonne justifient l'instauration d'une zone à circulation apaisée",
  ],
  peril: [
    "que l'état de l'immeuble constitue un danger pour la sécurité des occupants et des passants, conformément aux articles L. 511-1 et suivants du Code de la construction et de l'habitation",
    "qu'il appartient au maire de prescrire la réparation ou la démolition des immeubles menaçant ruine, conformément à ses pouvoirs de police",
    "que le rapport d'expertise a conclu à l'existence d'un péril affectant la solidité de l'immeuble ou d'éléments de celui-ci",
  ],
  debit_boissons: [
    "qu'il appartient au maire de réglementer les horaires de fermeture des débits de boissons dans l'intérêt de l'ordre, de la santé et de la tranquillité publics",
    "que les nuisances constatées aux abords de l'établissement justifient la prise de mesures de police administrative",
  ],
  pietonnisation: [
    "qu'il convient de réserver temporairement l'usage de certaines voies aux piétons afin de garantir leur sécurité et d'améliorer le cadre de vie",
    "que la configuration des lieux et l'affluence piétonne justifient la fermeture temporaire de la circulation motorisée",
    "que les nécessités d'assurer l'accès des véhicules de secours doivent être garanties",
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
  nuisances_sonores: [],
  zone_30: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Véhicules de livraison dans les créneaux horaires autorisés",
  ],
  peril: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Entreprises de travaux mandatées par le propriétaire pour les travaux de mise en sécurité",
  ],
  debit_boissons: [],
  pietonnisation: [
    "Véhicules de secours (SDIS, SAMU, police, gendarmerie)",
    "Riverains sur présentation d'un justificatif de domicile, circulation au pas",
    "Véhicules de livraison dans les créneaux horaires autorisés",
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
    case "pietonnisation":
      return `La zone piétonnisée comprend ${voiesTexte}. Les accès sont matérialisés par des bornes, barrières ou panneaux réglementaires.`;
    case "peril":
      return `Le périmètre de sécurité est établi autour de l'immeuble situé ${voiesTexte}. L'accès à la zone de danger est interdit au public.`;
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

  // Pour les arrêtés de péril, article sur les obligations du propriétaire
  if (ctx.type_code === "peril") {
    const proprietaire = (ctx.valeurs["proprietaire"] as string) || "";
    const mesures = (ctx.valeurs["mesures"] as string) || "Travaux de mise en sécurité";
    const delai = (ctx.valeurs["delai_travaux"] as string) || "";
    articles.push({
      id: `gen_${Date.now()}_peril`,
      titre: "Obligations du propriétaire",
      contenu: `${proprietaire ? `Le propriétaire (${proprietaire})` : "Le propriétaire"} est tenu de procéder aux mesures prescrites (${mesures.toLowerCase()})${delai ? ` dans un délai de ${delai}` : ""}. À défaut, la commune pourra se substituer au propriétaire pour l'exécution d'office des travaux, aux frais de celui-ci.`,
    });
  }

  // Pour la piétonnisation, article sur les conditions d'accès
  if (ctx.type_code === "pietonnisation") {
    const livraisons = (ctx.valeurs["acces_livraisons"] as string) || "";
    if (livraisons) {
      articles.push({
        id: `gen_${Date.now()}_livr`,
        titre: "Conditions de livraison",
        contenu: `Les véhicules de livraison sont autorisés à accéder à la zone piétonnisée uniquement sur le créneau horaire suivant : ${livraisons}. En dehors de ce créneau, aucun véhicule motorisé n'est autorisé à pénétrer dans la zone, à l'exception des véhicules de secours.`,
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

  // Fourrière recommandée si stationnement interdit ou manifestation/marché/piétonnisation
  const recommanderFourriere = hasStationnement ||
    hasCirculation ||
    ["manifestation", "manifestation_sportive", "marche", "pietonnisation"].includes(ctx.type_code);

  // Recours recommandé pour les arrêtés longs ou de grande envergure
  const recommanderRecours = ["manifestation", "manifestation_sportive", "marche", "travaux", "peril", "debit_boissons", "pietonnisation"].includes(ctx.type_code);

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
