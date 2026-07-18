// Types du domaine métier — Arrêtés & Espace public
// Chaque type reflète une entité métier identifiée dans le prototype.

export type StatutArrete = "brouillon" | "en_relecture" | "valide" | "publie" | "modifie" | "abroge";

export interface Commentaire {
  id: string;
  auteur: string;
  date: string;
  texte: string;
  etape: StatutArrete;
}

export type CodeImpact =
  | "circulation_interdite"
  | "stationnement_interdit"
  | "deviation"
  | "zone_reservee"
  | "passage_maintenu"
  | "alternat";

export type CodeTypeArrete =
  | "circulation_interdite"
  | "stationnement_interdit"
  | "alternat"
  | "travaux"
  | "manifestation"
  | "manifestation_sportive"
  | "marche"
  | "occupation_dp"
  | "demenagement";

export type CategorieReference = "delegation" | "circulation" | "stationnement";

export interface Troncon {
  voie_id: string;
  impact: CodeImpact;
  segment_debut?: string;
  segment_fin?: string;
  origine?: "auto" | "manuel";
  coordonnees?: [number, number][];
  geometrie_type?: "LineString" | "Polygon";
  label?: string;
}

export interface Phase {
  id: number;
  label: string;
  date_debut: string;
  date_fin: string;
  localisation: string;
  troncons: Troncon[];
}

export interface VersionArrete {
  version: number;
  date: string;
  auteur: string;
  motif: string;
  titre: string;
}

export interface AbrogationArrete {
  numero: string;
  date: string;
  motif: string;
}

export interface Arrete {
  id: string;
  numero: string;
  type_code: CodeTypeArrete;
  type_label: string;
  titre: string;
  statut: StatutArrete;
  cree_par: string;
  date_creation: string;
  date_debut: string;
  date_fin: string;
  voies: string[];
  troncons: Troncon[];
  versions: VersionArrete[];
  arrete_abrogation: AbrogationArrete | null;
  commentaires?: Commentaire[];
  valideur?: string;
  date_validation?: string;
}

export interface Voie {
  id: string;
  nom: string;
  path: string;
  cx: number;
  cy: number;
  isZone?: boolean;
}

export interface TypeImpact {
  code: CodeImpact;
  label: string;
  couleur: string;
}

export interface ChampFormulaire {
  id: string;
  label: string;
  type: "select" | "texte" | "adresse" | "datetime" | "bool";
  options?: string[];
  placeholder?: string;
}

export interface TypeArrete {
  code: CodeTypeArrete;
  label: string;
  suffixe: string;
  description: string;
  multi_phases: boolean;
  aide_phases?: string;
  champs: ChampFormulaire[];
}

export interface HistoriqueReference {
  numero: string;
  date: string;
  titulaire: string | null;
  date_fin: string;
}

export interface Reference {
  id: string;
  code: string;
  categorie: CategorieReference;
  label: string;
  titulaire: string | null;
  numero: string;
  date: string;
  actif: boolean;
  date_debut_validite: string;
  date_fin_validite: string;
  historique: HistoriqueReference[];
}

export interface CategorieRef {
  code: CategorieReference;
  label: string;
  icon: string;
  couleur: string;
}
