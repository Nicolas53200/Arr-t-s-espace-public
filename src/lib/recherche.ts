/**
 * Moteur de recherche full-text avancé pour Actes360.
 *
 * Fonctionnalités :
 * - Indexation multi-champs pondérée (numéro, titre, voies, auteur…)
 * - Recherche multi-mots (ET logique) avec scoring TF-IDF simplifié
 * - Normalisation Unicode (accents, cédilles, ligatures)
 * - Recherche floue (distance de Levenshtein pour la tolérance fautes)
 * - Mise en surbrillance des correspondances
 * - Suggestions de recherche (autocomplétion)
 * - Filtres combinables (type, statut, date, voie)
 * - Recherche dans les arrêtés ET les références
 */

import type { Arrete, Reference, CodeTypeArrete, StatutArrete } from "@/types";

// ──── Types ────

export interface ResultatRecherche {
  id: string;
  type: "arrete" | "reference";
  titre: string;
  sousTitre: string;
  score: number;
  extraits: Extrait[];
  /** Données source pour accès rapide */
  arrete?: Arrete;
  reference?: Reference;
}

export interface Extrait {
  champ: string;
  texte: string;
  /** Positions [debut, fin] des matches dans le texte */
  positions: [number, number][];
}

export interface FiltresRecherche {
  types?: CodeTypeArrete[];
  statuts?: StatutArrete[];
  dateDebut?: string;
  dateFin?: string;
  voie?: string;
  auteur?: string;
  scope?: "tous" | "arretes" | "references";
}

export interface SuggestionRecherche {
  texte: string;
  categorie: "numero" | "voie" | "type" | "auteur" | "titre" | "reference";
  count: number;
}

/** Poids de chaque champ pour le scoring */
const POIDS: Record<string, number> = {
  numero: 10,
  titre: 8,
  voies: 6,
  type_label: 5,
  cree_par: 4,
  commune: 3,
  statut: 2,
  considerants: 2,
  derogations: 2,
  ref_label: 8,
  ref_numero: 10,
  ref_titulaire: 5,
  ref_categorie: 4,
};

// ──── Normalisation ────

/**
 * Normalise un texte pour la recherche :
 * minuscules, suppression des accents/diacritiques, articles courts.
 */
export function normaliserTexte(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .trim();
}

/**
 * Tokenise un texte en mots significatifs.
 * Supprime les mots vides français (articles, prépositions courtes).
 */
const MOTS_VIDES = new Set([
  "le", "la", "les", "de", "du", "des", "un", "une",
  "et", "ou", "en", "au", "aux", "par", "pour", "sur",
  "dans", "avec", "ce", "ces", "son", "sa", "ses",
  "qui", "que", "dont", "d", "l", "n", "s", "c",
]);

export function tokeniser(texte: string): string[] {
  const normalise = normaliserTexte(texte);
  return normalise
    .split(/[\s\-_/.,;:!?()'"]+/)
    .filter((mot) => mot.length > 1 && !MOTS_VIDES.has(mot));
}

// ──── Distance de Levenshtein (recherche floue) ────

export function distanceLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Optimisation : si la différence de longueur dépasse le seuil, pas la peine
  if (Math.abs(a.length - b.length) > 3) return Math.abs(a.length - b.length);

  const matrice: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrice[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrice[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      matrice[i]![j] = Math.min(
        matrice[i - 1]![j]! + 1,
        matrice[i]![j - 1]! + 1,
        matrice[i - 1]![j - 1]! + cout,
      );
    }
  }

  return matrice[a.length]![b.length]!;
}

/**
 * Vérifie si un mot correspond (exact ou flou) à un token de l'index.
 * Retourne un score entre 0 (pas de match) et 1 (match exact).
 */
export function scorerMot(motRecherche: string, motIndex: string): number {
  const recherche = normaliserTexte(motRecherche);
  const index = normaliserTexte(motIndex);

  // Match exact
  if (index === recherche) return 1;

  // Contient (préfixe ou substring)
  if (index.startsWith(recherche)) return 0.9;
  if (index.includes(recherche)) return 0.7;
  // Le mot de l'index est contenu dans le terme recherché :
  // seulement si le mot indexé fait ≥ 4 chars et couvre ≥ 40% du terme
  if (recherche.includes(index) && index.length >= 4 && index.length / recherche.length >= 0.4) {
    return 0.5;
  }

  // Fuzzy (seulement pour les mots de 4+ caractères)
  if (recherche.length >= 4) {
    const distance = distanceLevenshtein(recherche, index);
    const seuil = Math.floor(recherche.length / 3); // tolérance ~33%
    if (distance <= seuil) {
      return Math.max(0.1, 1 - distance / recherche.length);
    }
  }

  return 0;
}

// ──── Indexation des documents ────

interface DocumentIndex {
  id: string;
  type: "arrete" | "reference";
  champs: Map<string, string[]>; // champ → tokens
  champsOriginaux: Map<string, string>; // champ → texte original
  arrete?: Arrete;
  reference?: Reference;
}

function indexerArrete(a: Arrete): DocumentIndex {
  const champs = new Map<string, string[]>();
  const champsOriginaux = new Map<string, string>();

  const champsDef: [string, string][] = [
    ["numero", a.numero],
    ["titre", a.titre],
    ["type_label", a.type_label],
    ["cree_par", a.cree_par],
    ["commune", a.commune ?? ""],
    ["statut", a.statut],
    ["voies", a.voies.join(" ")],
  ];

  if (a.considerants) {
    champsDef.push(["considerants", a.considerants.join(" ")]);
  }
  if (a.derogations) {
    champsDef.push(["derogations", a.derogations.join(" ")]);
  }

  for (const [nom, valeur] of champsDef) {
    if (!valeur) continue;
    champsOriginaux.set(nom, valeur);
    champs.set(nom, tokeniser(valeur));
  }

  return { id: a.id, type: "arrete", champs, champsOriginaux, arrete: a };
}

function indexerReference(r: Reference): DocumentIndex {
  const champs = new Map<string, string[]>();
  const champsOriginaux = new Map<string, string>();

  const champsDef: [string, string][] = [
    ["ref_label", r.label],
    ["ref_numero", r.numero],
    ["ref_titulaire", r.titulaire ?? ""],
    ["ref_categorie", r.categorie],
  ];

  for (const [nom, valeur] of champsDef) {
    if (!valeur) continue;
    champsOriginaux.set(nom, valeur);
    champs.set(nom, tokeniser(valeur));
  }

  return { id: r.id, type: "reference", champs, champsOriginaux, reference: r };
}

// ──── Recherche ────

function scorerDocument(doc: DocumentIndex, motsRecherche: string[]): number {
  let scoreTotal = 0;

  for (const motR of motsRecherche) {
    let meilleurScoreMot = 0;

    for (const [champ, tokens] of doc.champs) {
      const poids = POIDS[champ] ?? 1;

      for (const token of tokens) {
        const sc = scorerMot(motR, token);
        if (sc > 0) {
          meilleurScoreMot = Math.max(meilleurScoreMot, sc * poids);
        }
      }
    }

    // Chaque mot doit matcher quelque chose (ET logique)
    if (meilleurScoreMot === 0) return 0;
    scoreTotal += meilleurScoreMot;
  }

  return scoreTotal;
}

function trouverExtraits(doc: DocumentIndex, motsRecherche: string[]): Extrait[] {
  const extraits: Extrait[] = [];

  for (const [champ, texteOriginal] of doc.champsOriginaux) {
    const texteNorm = normaliserTexte(texteOriginal);
    const positions: [number, number][] = [];

    for (const mot of motsRecherche) {
      const motNorm = normaliserTexte(mot);
      let idx = 0;
      while (idx < texteNorm.length) {
        const pos = texteNorm.indexOf(motNorm, idx);
        if (pos === -1) break;
        positions.push([pos, pos + motNorm.length]);
        idx = pos + 1;
      }
    }

    if (positions.length > 0) {
      // Fusionner les positions qui se chevauchent
      positions.sort((a, b) => a[0] - b[0]);
      const fusionnes: [number, number][] = [positions[0]!];
      for (let i = 1; i < positions.length; i++) {
        const dernier = fusionnes[fusionnes.length - 1]!;
        const courant = positions[i]!;
        if (courant[0] <= dernier[1]) {
          dernier[1] = Math.max(dernier[1], courant[1]);
        } else {
          fusionnes.push(courant);
        }
      }

      extraits.push({
        champ,
        texte: texteOriginal,
        positions: fusionnes,
      });
    }
  }

  return extraits;
}

function appliquerFiltres(doc: DocumentIndex, filtres: FiltresRecherche): boolean {
  if (filtres.scope === "arretes" && doc.type !== "arrete") return false;
  if (filtres.scope === "references" && doc.type !== "reference") return false;

  // Les filtres type/statut/voie/auteur/date ne s'appliquent qu'aux arrêtés.
  // Si l'un d'eux est actif et le document est une référence, l'exclure.
  const aFiltresArrete =
    (filtres.types && filtres.types.length > 0) ||
    (filtres.statuts && filtres.statuts.length > 0) ||
    !!filtres.dateDebut ||
    !!filtres.dateFin ||
    !!filtres.voie ||
    !!filtres.auteur;

  if (aFiltresArrete && doc.type === "reference") return false;

  if (doc.type === "arrete" && doc.arrete) {
    const a = doc.arrete;

    if (filtres.types && filtres.types.length > 0) {
      if (!filtres.types.includes(a.type_code)) return false;
    }

    if (filtres.statuts && filtres.statuts.length > 0) {
      if (!filtres.statuts.includes(a.statut)) return false;
    }

    if (filtres.dateDebut && a.date_debut < filtres.dateDebut) return false;
    if (filtres.dateFin && a.date_fin > filtres.dateFin) return false;

    if (filtres.voie) {
      const voieNorm = normaliserTexte(filtres.voie);
      const match = a.voies.some((v) => normaliserTexte(v).includes(voieNorm));
      if (!match) return false;
    }

    if (filtres.auteur) {
      const auteurNorm = normaliserTexte(filtres.auteur);
      if (!normaliserTexte(a.cree_par).includes(auteurNorm)) return false;
    }
  }

  return true;
}

/**
 * Recherche full-text dans les arrêtés et références.
 * Retourne les résultats triés par score de pertinence décroissant.
 */
export function rechercherGlobal(
  arretes: Arrete[],
  references: Reference[],
  requete: string,
  filtres: FiltresRecherche = {},
  limite: number = 50,
): ResultatRecherche[] {
  const motsRecherche = tokeniser(requete);
  if (motsRecherche.length === 0 && !filtres.types?.length && !filtres.statuts?.length && !filtres.voie && !filtres.auteur) {
    return [];
  }

  // Indexer les documents
  const docs: DocumentIndex[] = [];

  if (filtres.scope !== "references") {
    for (const a of arretes) {
      docs.push(indexerArrete(a));
    }
  }

  if (filtres.scope !== "arretes") {
    for (const r of references) {
      docs.push(indexerReference(r));
    }
  }

  // Filtrer et scorer
  const resultats: ResultatRecherche[] = [];

  for (const doc of docs) {
    if (!appliquerFiltres(doc, filtres)) continue;

    // Si pas de mots recherchés (filtres seuls), score basé sur la fraîcheur
    let score: number;
    if (motsRecherche.length === 0) {
      score = 1;
    } else {
      score = scorerDocument(doc, motsRecherche);
      if (score === 0) continue;
    }

    const extraits = motsRecherche.length > 0 ? trouverExtraits(doc, motsRecherche) : [];

    if (doc.type === "arrete" && doc.arrete) {
      resultats.push({
        id: doc.id,
        type: "arrete",
        titre: doc.arrete.titre,
        sousTitre: `${doc.arrete.numero} · ${doc.arrete.type_label} · ${doc.arrete.statut}`,
        score,
        extraits,
        arrete: doc.arrete,
      });
    } else if (doc.type === "reference" && doc.reference) {
      resultats.push({
        id: doc.id,
        type: "reference",
        titre: doc.reference.label,
        sousTitre: `${doc.reference.numero} · ${doc.reference.categorie}`,
        score,
        extraits,
        reference: doc.reference,
      });
    }
  }

  // Trier par score décroissant
  resultats.sort((a, b) => b.score - a.score);

  return resultats.slice(0, limite);
}

// ──── Suggestions ────

/**
 * Génère des suggestions d'autocomplétion basées sur le texte saisi.
 */
export function genererSuggestions(
  arretes: Arrete[],
  references: Reference[],
  saisie: string,
  limite: number = 8,
): SuggestionRecherche[] {
  const saisieNorm = normaliserTexte(saisie);
  if (saisieNorm.length < 2) return [];

  const suggestions = new Map<string, SuggestionRecherche>();

  function ajouter(texte: string, categorie: SuggestionRecherche["categorie"]) {
    const texteNorm = normaliserTexte(texte);
    if (!texteNorm.includes(saisieNorm)) return;

    const cle = `${categorie}:${texteNorm}`;
    const existant = suggestions.get(cle);
    if (existant) {
      existant.count++;
    } else {
      suggestions.set(cle, { texte, categorie, count: 1 });
    }
  }

  for (const a of arretes) {
    ajouter(a.numero, "numero");
    ajouter(a.titre, "titre");
    ajouter(a.type_label, "type");
    ajouter(a.cree_par, "auteur");
    for (const v of a.voies) {
      ajouter(v, "voie");
    }
  }

  for (const r of references) {
    ajouter(r.label, "reference");
    ajouter(r.numero, "numero");
  }

  return [...suggestions.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limite);
}

// ──── Mise en surbrillance ────

export interface FragmentTexte {
  texte: string;
  surbrillance: boolean;
}

/**
 * Découpe un texte en fragments avec indication de surbrillance.
 */
export function surbriller(texte: string, positions: [number, number][]): FragmentTexte[] {
  if (positions.length === 0) return [{ texte, surbrillance: false }];

  const fragments: FragmentTexte[] = [];
  let curseur = 0;

  for (const [debut, fin] of positions) {
    if (debut > curseur) {
      fragments.push({ texte: texte.slice(curseur, debut), surbrillance: false });
    }
    fragments.push({ texte: texte.slice(debut, fin), surbrillance: true });
    curseur = fin;
  }

  if (curseur < texte.length) {
    fragments.push({ texte: texte.slice(curseur), surbrillance: false });
  }

  return fragments;
}

// ──── Facettes pour les filtres ────

export interface Facettes {
  types: { code: CodeTypeArrete; label: string; count: number }[];
  statuts: { code: StatutArrete; label: string; count: number }[];
  voies: { nom: string; count: number }[];
  auteurs: { nom: string; count: number }[];
}

const LABELS_STATUT: Record<StatutArrete, string> = {
  brouillon: "Brouillon",
  en_relecture: "En relecture",
  valide: "Validé",
  publie: "Publié",
  modifie: "Modifié",
  abroge: "Abrogé",
};

/**
 * Calcule les facettes (compteurs par critère) à partir d'une liste d'arrêtés.
 */
export function calculerFacettes(arretes: Arrete[]): Facettes {
  const types = new Map<CodeTypeArrete, { label: string; count: number }>();
  const statuts = new Map<StatutArrete, { label: string; count: number }>();
  const voies = new Map<string, number>();
  const auteurs = new Map<string, number>();

  for (const a of arretes) {
    // Types
    const t = types.get(a.type_code);
    if (t) {
      t.count++;
    } else {
      types.set(a.type_code, { label: a.type_label, count: 1 });
    }

    // Statuts
    const st = statuts.get(a.statut);
    if (st) {
      st.count++;
    } else {
      statuts.set(a.statut, { label: LABELS_STATUT[a.statut] ?? a.statut, count: 1 });
    }

    // Voies
    for (const v of a.voies) {
      voies.set(v, (voies.get(v) ?? 0) + 1);
    }

    // Auteurs
    auteurs.set(a.cree_par, (auteurs.get(a.cree_par) ?? 0) + 1);
  }

  return {
    types: [...types.entries()]
      .map(([code, { label, count }]) => ({ code, label, count }))
      .sort((a, b) => b.count - a.count),
    statuts: [...statuts.entries()]
      .map(([code, { label, count }]) => ({ code, label, count }))
      .sort((a, b) => b.count - a.count),
    voies: [...voies.entries()]
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    auteurs: [...auteurs.entries()]
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count),
  };
}
