// Couche de stockage hors-ligne — IndexedDB + file de synchronisation
// Permet de travailler sans connexion et de synchroniser au retour en ligne.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TypeAction = "creation" | "modification" | "suppression" | "transition";

export interface ActionEnAttente {
  id: string;
  type: TypeAction;
  entite: "arrete" | "reference";
  entiteId: string;
  donnees: Record<string, unknown>;
  timestamp: string;
  tentatives: number;
  derniere_erreur?: string;
}

export interface EtatConnexion {
  en_ligne: boolean;
  derniere_synchro?: string;
  actions_en_attente: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB — Wrapper simplifié
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = "actes360_offline";
const DB_VERSION = 1;
const STORE_QUEUE = "sync_queue";
const STORE_CACHE = "data_cache";

function ouvrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        const store = db.createObjectStore(STORE_CACHE, { keyPath: "cle" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await ouvrirDB();
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

function transactionTout<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T[]>,
): Promise<T[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await ouvrirDB();
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// File de synchronisation
// ─────────────────────────────────────────────────────────────────────────────

/** Ajoute une action à la file de synchronisation */
export async function ajouterActionEnAttente(action: Omit<ActionEnAttente, "id" | "timestamp" | "tentatives">): Promise<ActionEnAttente> {
  const entree: ActionEnAttente = {
    ...action,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    tentatives: 0,
  };

  await transaction(STORE_QUEUE, "readwrite", (store) => store.put(entree));

  // Déclencher la Background Sync si disponible
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-arretes");
    } catch {
      // Background Sync non supporté, on sync manuellement au retour en ligne
    }
  }

  return entree;
}

/** Récupère toutes les actions en attente */
export async function obtenirActionsEnAttente(): Promise<ActionEnAttente[]> {
  try {
    return await transactionTout<ActionEnAttente>(STORE_QUEUE, "readonly", (store) => store.getAll());
  } catch {
    return [];
  }
}

/** Supprime une action de la file (après synchro réussie) */
export async function supprimerAction(id: string): Promise<void> {
  await transaction(STORE_QUEUE, "readwrite", (store) => store.delete(id));
}

/** Met à jour une action (incrémenter les tentatives, ajouter une erreur) */
export async function mettreAJourAction(id: string, updates: Partial<ActionEnAttente>): Promise<void> {
  const actions = await obtenirActionsEnAttente();
  const action = actions.find((a) => a.id === id);
  if (!action) return;

  const maj = { ...action, ...updates };
  await transaction(STORE_QUEUE, "readwrite", (store) => store.put(maj));
}

/** Vide toute la file de synchronisation */
export async function viderFile(): Promise<void> {
  await transaction(STORE_QUEUE, "readwrite", (store) => store.clear());
}

/** Nombre d'actions en attente */
export async function compterActionsEnAttente(): Promise<number> {
  const actions = await obtenirActionsEnAttente();
  return actions.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache de données (pour consultation hors-ligne)
// ─────────────────────────────────────────────────────────────────────────────

interface DonneeCache {
  cle: string;
  valeur: unknown;
  timestamp: string;
}

/** Met en cache des données pour consultation hors-ligne */
export async function mettreEnCache(cle: string, valeur: unknown): Promise<void> {
  const entree: DonneeCache = {
    cle,
    valeur,
    timestamp: new Date().toISOString(),
  };
  await transaction(STORE_CACHE, "readwrite", (store) => store.put(entree));
}

/** Récupère des données du cache hors-ligne */
export async function obtenirDuCache<T>(cle: string): Promise<{ valeur: T; timestamp: string } | null> {
  try {
    const result = await transaction<DonneeCache | undefined>(STORE_CACHE, "readonly", (store) => store.get(cle));
    if (!result) return null;
    return { valeur: result.valeur as T, timestamp: result.timestamp };
  } catch {
    return null;
  }
}

/** Supprime une entrée du cache */
export async function supprimerDuCache(cle: string): Promise<void> {
  await transaction(STORE_CACHE, "readwrite", (store) => store.delete(cle));
}

/** Vide tout le cache de données */
export async function viderCache(): Promise<void> {
  await transaction(STORE_CACHE, "readwrite", (store) => store.clear());
}

// ─────────────────────────────────────────────────────────────────────────────
// Synchronisation
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TENTATIVES = 5;

export type ResultatSynchro = {
  total: number;
  reussies: number;
  echouees: number;
  details: { id: string; succes: boolean; erreur?: string }[];
};

/** Synchronise toutes les actions en attente avec le serveur */
export async function synchroniserActions(
  executerAction: (action: ActionEnAttente) => Promise<void>,
): Promise<ResultatSynchro> {
  const actions = await obtenirActionsEnAttente();
  const resultat: ResultatSynchro = {
    total: actions.length,
    reussies: 0,
    echouees: 0,
    details: [],
  };

  if (actions.length === 0) return resultat;

  // Trier par timestamp (FIFO)
  actions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  for (const action of actions) {
    if (action.tentatives >= MAX_TENTATIVES) {
      resultat.echouees++;
      resultat.details.push({
        id: action.id,
        succes: false,
        erreur: `Trop de tentatives (${action.tentatives}/${MAX_TENTATIVES})`,
      });
      continue;
    }

    try {
      await executerAction(action);
      await supprimerAction(action.id);
      resultat.reussies++;
      resultat.details.push({ id: action.id, succes: true });
    } catch (err) {
      const erreur = err instanceof Error ? err.message : "Erreur inconnue";
      await mettreAJourAction(action.id, {
        tentatives: action.tentatives + 1,
        derniere_erreur: erreur,
      });
      resultat.echouees++;
      resultat.details.push({ id: action.id, succes: false, erreur });
    }
  }

  return resultat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Détection de connectivité
// ─────────────────────────────────────────────────────────────────────────────

/** Vérifie si le navigateur est en ligne */
export function estEnLigne(): boolean {
  return navigator.onLine;
}

/** Écoute les changements de connectivité */
export function ecouterConnectivite(
  callback: (enLigne: boolean) => void,
): () => void {
  const onOnline = () => callback(true);
  const onOffline = () => callback(false);

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Enregistrement du Service Worker
// ─────────────────────────────────────────────────────────────────────────────

export interface EtatServiceWorker {
  supporte: boolean;
  enregistre: boolean;
  mise_a_jour_disponible: boolean;
}

export async function enregistrerServiceWorker(): Promise<EtatServiceWorker> {
  const etat: EtatServiceWorker = {
    supporte: "serviceWorker" in navigator,
    enregistre: false,
    mise_a_jour_disponible: false,
  };

  if (!etat.supporte) return etat;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    etat.enregistre = true;

    // Écouter les mises à jour
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          etat.mise_a_jour_disponible = true;
          // Notifier l'application qu'une mise à jour est disponible
          window.dispatchEvent(new CustomEvent("sw-update-available"));
        }
      });
    });

    // Écouter les messages du SW
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_TRIGGER") {
        window.dispatchEvent(new CustomEvent("sw-sync-trigger"));
      }
    });

    return etat;
  } catch {
    return etat;
  }
}

/** Demande au SW de passer à la nouvelle version */
export function appliquerMiseAJour(): void {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  });

  // Recharger la page après la prise de contrôle
  let rafraichi = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!rafraichi) {
      rafraichi = true;
      window.location.reload();
    }
  });
}
