// Validation pure — sans dépendance React
// Toutes les fonctions sont testables unitairement.

export interface RegleRequired {
  type: "required";
}

export interface RegleMinLength {
  type: "minLength";
  valeur: number;
}

export interface RegleMaxLength {
  type: "maxLength";
  valeur: number;
}

export interface ReglePattern {
  type: "pattern";
  valeur: RegExp;
  message?: string;
}

export interface RegleDateValide {
  type: "dateValide";
}

export interface RegleDateApres {
  type: "dateApres";
  autreChamp: string;
  labelAutre?: string;
}

export interface RegleEmail {
  type: "email";
}

export type RegleValidation =
  | RegleRequired
  | RegleMinLength
  | RegleMaxLength
  | ReglePattern
  | RegleDateValide
  | RegleDateApres
  | RegleEmail;

export interface ResultatValidation {
  valide: boolean;
  erreur?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vérifie qu'une chaîne représente une date parseable et cohérente
function estDateValide(valeur: string): boolean {
  if (!valeur) return false;
  const d = new Date(valeur);
  if (isNaN(d.getTime())) return false;
  // Pour les dates au format AAAA-MM-JJ, vérifie la cohérence jour/mois
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valeur);
  if (match) {
    const annee = Number(match[1]);
    const mois = Number(match[2]);
    const jour = Number(match[3]);
    if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return false;
    if (d.getFullYear() !== annee || d.getMonth() + 1 !== mois || d.getDate() !== jour) return false;
  }
  return true;
}

/**
 * Valide une seule valeur contre un tableau de règles.
 * `contexte` contient les valeurs des autres champs (utile pour dateApres).
 */
export function validerChamp(
  valeur: string,
  regles: RegleValidation[],
  contexte?: Record<string, string>,
): ResultatValidation {
  for (const r of regles) {
    switch (r.type) {
      case "required":
        if (!valeur || !valeur.trim()) {
          return { valide: false, erreur: "Ce champ est obligatoire" };
        }
        break;

      case "minLength":
        if (valeur && valeur.trim().length < r.valeur) {
          return { valide: false, erreur: `${r.valeur} caractères minimum` };
        }
        break;

      case "maxLength":
        if (valeur && valeur.length > r.valeur) {
          return { valide: false, erreur: `${r.valeur} caractères maximum` };
        }
        break;

      case "pattern":
        if (valeur && !r.valeur.test(valeur)) {
          return { valide: false, erreur: r.message ?? "Format invalide" };
        }
        break;

      case "dateValide":
        if (valeur && !estDateValide(valeur)) {
          return { valide: false, erreur: "Date invalide" };
        }
        break;

      case "dateApres": {
        if (!valeur || !contexte) break;
        const autreValeur = contexte[r.autreChamp];
        if (!autreValeur) break;
        if (!estDateValide(valeur) || !estDateValide(autreValeur)) break;
        if (new Date(valeur) <= new Date(autreValeur)) {
          const label = r.labelAutre ?? "la date de début";
          return { valide: false, erreur: `Doit être postérieure à ${label}` };
        }
        break;
      }

      case "email":
        if (valeur && !EMAIL_RE.test(valeur)) {
          return { valide: false, erreur: "Adresse email invalide" };
        }
        break;
    }
  }
  return { valide: true };
}

export type ReglesFormulaire<T extends string = string> = Record<T, RegleValidation[]>;

/**
 * Valide tous les champs d'un formulaire.
 * Retourne un objet { champ: messageErreur } pour chaque champ invalide.
 */
export function validerFormulaire<T extends string>(
  champs: Record<T, string>,
  regles: ReglesFormulaire<T>,
): Record<T, string | undefined> {
  const erreurs = {} as Record<T, string | undefined>;
  for (const cle of Object.keys(regles) as T[]) {
    const valeur = champs[cle] ?? "";
    const resultat = validerChamp(valeur, regles[cle], champs as Record<string, string>);
    erreurs[cle] = resultat.valide ? undefined : resultat.erreur;
  }
  return erreurs;
}
