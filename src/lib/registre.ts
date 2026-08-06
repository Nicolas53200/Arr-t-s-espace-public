/**
 * Registre centralisé des collectivités et utilisateurs.
 *
 * Stocke les données dans localStorage pour que la création d'une
 * collectivité par le super-admin se propage immédiatement à toute
 * l'application (landing page, login, tenant context…).
 *
 * Ce module remplace les données mock hardcodées.
 */
import type { TenantInfo, User, Reference, Arrete } from "@/types";
import { creerBasesLegalesNationales } from "@/data/bases-legales";

// ──── Types internes ────

export interface CollectiviteRegistre {
  id: string;
  nom: string;
  code_postal: string;
  siren: string;
  email_admin: string;
  code_acces: string;
  active: boolean;
  date_creation: string;
  mot_de_passe: string;
  // Champs TenantInfo étendus
  adresse?: string;
  telephone?: string;
  email_contact?: string;
  devise?: string;
  nom_maire?: string;
  titre_maire?: string;
}

// ──── Clés localStorage ────

const CLE_COLLECTIVITES = "registre_collectivites";
const CLE_UTILISATEURS = "registre_utilisateurs";
const CLE_REFERENCES_PREFIX = "registre_refs_";
const CLE_ARRETES_PREFIX = "registre_arretes_";

// ──── Helpers ────

function lire<T>(cle: string, defaut: T): T {
  try {
    const raw = localStorage.getItem(cle);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return defaut;
}

function ecrire<T>(cle: string, valeur: T): void {
  localStorage.setItem(cle, JSON.stringify(valeur));
}

function genererCode(nom: string): string {
  const slug = nom
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^VILLE DE /, "")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${new Date().getFullYear()}`;
}

// ──── Collectivités ────

export function getCollectivites(): CollectiviteRegistre[] {
  return lire<CollectiviteRegistre[]>(CLE_COLLECTIVITES, []);
}

export function sauvegarderCollectivites(collectivites: CollectiviteRegistre[]): void {
  ecrire(CLE_COLLECTIVITES, collectivites);
}

export function ajouterCollectivite(data: {
  nom: string;
  code_postal: string;
  siren: string;
  email_admin: string;
}): CollectiviteRegistre {
  const collectivites = getCollectivites();
  const code = genererCode(data.nom);
  const id = `tenant_${Date.now()}`;
  const motDePasse = "admin123";

  const nouvelle: CollectiviteRegistre = {
    id,
    nom: data.nom,
    code_postal: data.code_postal,
    siren: data.siren,
    email_admin: data.email_admin,
    code_acces: code,
    active: true,
    date_creation: new Date().toISOString().slice(0, 10),
    mot_de_passe: motDePasse,
  };

  collectivites.push(nouvelle);
  sauvegarderCollectivites(collectivites);

  // Créer automatiquement l'utilisateur admin de cette collectivité
  const utilisateurs = getUtilisateurs();
  utilisateurs.push({
    id: `u_${id}`,
    nom: `Admin ${data.nom.replace(/^Ville de /i, "")}`,
    email: data.email_admin,
    role: "admin",
    tenant_id: id,
  });
  sauvegarderUtilisateurs(utilisateurs);

  // Injecter les bases légales nationales
  const basesLegales = creerBasesLegalesNationales(id);
  sauvegarderReferences(id, basesLegales);

  return nouvelle;
}

export function toggleCollectivite(id: string): void {
  const collectivites = getCollectivites();
  const mise_a_jour = collectivites.map((c) =>
    c.id === id ? { ...c, active: !c.active } : c,
  );
  sauvegarderCollectivites(mise_a_jour);
}

// ──── Codes d'accès ────

/** Retourne le tenant_id associé à un code d'accès, ou null si invalide. */
export function validerCodeAcces(code: string): string | null {
  const upper = code.trim().toUpperCase();
  if (!upper) return null;
  const collectivites = getCollectivites();
  const trouvee = collectivites.find(
    (c) => c.code_acces === upper && c.active,
  );
  return trouvee?.id ?? null;
}

// ──── Utilisateurs ────

export function getUtilisateurs(): User[] {
  return lire<User[]>(CLE_UTILISATEURS, []);
}

export function sauvegarderUtilisateurs(utilisateurs: User[]): void {
  ecrire(CLE_UTILISATEURS, utilisateurs);
}

/** Authentifie un utilisateur par email et mot de passe. */
export function authentifier(email: string, motDePasse: string): User | null {
  const collectivites = getCollectivites();
  // Chercher une collectivité dont l'email_admin correspond
  const collectivite = collectivites.find(
    (c) => c.email_admin.toLowerCase() === email.toLowerCase() && c.mot_de_passe === motDePasse,
  );
  if (collectivite) {
    const utilisateurs = getUtilisateurs();
    const user = utilisateurs.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.tenant_id === collectivite.id,
    );
    return user ?? null;
  }
  return null;
}

// ──── Tenants ────

/** Convertit les collectivités du registre en TenantInfo[]. */
export function getTenants(): TenantInfo[] {
  return getCollectivites()
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      nom: c.nom,
      code_postal: c.code_postal,
      siren: c.siren,
      adresse: c.adresse,
      telephone: c.telephone,
      email_contact: c.email_contact ?? c.email_admin,
      devise: c.devise,
      nom_maire: c.nom_maire,
      titre_maire: c.titre_maire,
    }));
}

/** Retourne un TenantInfo par son id, ou null. */
export function getTenant(id: string): TenantInfo | null {
  const tenants = getTenants();
  return tenants.find((t) => t.id === id) ?? null;
}

// ──── Communes (pour les sélecteurs) ────

export interface CommuneRegistre {
  id: string;
  nom: string;
  code_postal: string;
}

/** Retourne la liste des communes actives (pour les formulaires). */
export function getCommunes(): CommuneRegistre[] {
  return getCollectivites()
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      nom: c.nom.replace(/^Ville de /i, ""),
      code_postal: c.code_postal,
    }));
}

// ──── Références par tenant ────

/** Retourne les références permanentes d'un tenant. */
export function getReferences(tenantId: string): Reference[] {
  return lire<Reference[]>(`${CLE_REFERENCES_PREFIX}${tenantId}`, []);
}

/** Sauvegarde les références d'un tenant. */
export function sauvegarderReferences(tenantId: string, refs: Reference[]): void {
  ecrire(`${CLE_REFERENCES_PREFIX}${tenantId}`, refs);
}

/** Ajoute une référence à un tenant. */
export function ajouterReference(tenantId: string, ref: Reference): void {
  const refs = getReferences(tenantId);
  refs.push(ref);
  sauvegarderReferences(tenantId, refs);
}

/** Met à jour une référence d'un tenant. */
export function majReference(tenantId: string, refId: string, updates: Partial<Reference>): void {
  const refs = getReferences(tenantId);
  const maj = refs.map((r) => (r.id === refId ? { ...r, ...updates } : r));
  sauvegarderReferences(tenantId, maj);
}

// ──── Arrêtés par tenant ────

/** Retourne les arrêtés d'un tenant. */
export function getArretes(tenantId: string): Arrete[] {
  return lire<Arrete[]>(`${CLE_ARRETES_PREFIX}${tenantId}`, []);
}

/** Sauvegarde les arrêtés d'un tenant. */
export function sauvegarderArretes(tenantId: string, arretes: Arrete[]): void {
  ecrire(`${CLE_ARRETES_PREFIX}${tenantId}`, arretes);
}

/** Retourne les arrêtés publiés de TOUTES les communes (pour la carte publique). */
export function getArretesPublics(): (Arrete & { commune: string; commune_id: string; _commune_nom: string; _commune_code_postal: string })[] {
  const collectivites = getCollectivites().filter((c) => c.active);
  const resultats: (Arrete & { commune: string; commune_id: string; _commune_nom: string; _commune_code_postal: string })[] = [];
  for (const c of collectivites) {
    const arretes = getArretes(c.id);
    for (const a of arretes) {
      if (a.statut === "publie" || a.statut === "modifie") {
        resultats.push({
          ...a,
          commune: c.nom.replace(/^Ville de /i, ""),
          commune_id: c.id,
          _commune_nom: c.nom.replace(/^Ville de /i, ""),
          _commune_code_postal: c.code_postal,
        });
      }
    }
  }
  return resultats;
}

// ──── Réinitialisation ────

/** Efface toutes les données du registre (utile pour les tests). */
export function reinitialiser(): void {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith(CLE_REFERENCES_PREFIX) || key.startsWith(CLE_ARRETES_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  localStorage.removeItem(CLE_COLLECTIVITES);
  localStorage.removeItem(CLE_UTILISATEURS);
}
