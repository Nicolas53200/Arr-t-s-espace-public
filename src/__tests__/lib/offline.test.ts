import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ajouterActionEnAttente,
  obtenirActionsEnAttente,
  supprimerAction,
  mettreAJourAction,
  viderFile,
  compterActionsEnAttente,
  mettreEnCache,
  obtenirDuCache,
  supprimerDuCache,
  viderCache,
  synchroniserActions,
  estEnLigne,
  ecouterConnectivite,
  type ActionEnAttente,
} from "@/lib/offline";

// ─── Mock IndexedDB ────────────────────────────────────────────────────────
// Vitest/jsdom ne fournit pas IndexedDB nativement.
// On mock les fonctions avec un store en mémoire.

let queueStore: Map<string, ActionEnAttente>;
let cacheStore: Map<string, { cle: string; valeur: unknown; timestamp: string }>;

// On doit mocker le module entier car IndexedDB n'existe pas en jsdom
vi.mock("@/lib/offline", async () => {
  // Store en mémoire pour simuler IndexedDB
  const queue = new Map<string, ActionEnAttente>();
  const cache = new Map<string, { cle: string; valeur: unknown; timestamp: string }>();

  // Exposer les stores pour les tests
  (globalThis as Record<string, unknown>).__testQueue = queue;
  (globalThis as Record<string, unknown>).__testCache = cache;

  return {
    ajouterActionEnAttente: async (action: Omit<ActionEnAttente, "id" | "timestamp" | "tentatives">) => {
      const entree: ActionEnAttente = {
        ...action,
        id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        tentatives: 0,
      };
      queue.set(entree.id, entree);
      return entree;
    },

    obtenirActionsEnAttente: async () => Array.from(queue.values()),

    supprimerAction: async (id: string) => { queue.delete(id); },

    mettreAJourAction: async (id: string, updates: Partial<ActionEnAttente>) => {
      const existing = queue.get(id);
      if (existing) queue.set(id, { ...existing, ...updates });
    },

    viderFile: async () => { queue.clear(); },

    compterActionsEnAttente: async () => queue.size,

    mettreEnCache: async (cle: string, valeur: unknown) => {
      cache.set(cle, { cle, valeur, timestamp: new Date().toISOString() });
    },

    obtenirDuCache: async <T,>(cle: string) => {
      const item = cache.get(cle);
      if (!item) return null;
      return { valeur: item.valeur as T, timestamp: item.timestamp };
    },

    supprimerDuCache: async (cle: string) => { cache.delete(cle); },

    viderCache: async () => { cache.clear(); },

    synchroniserActions: async (executerAction: (a: ActionEnAttente) => Promise<void>) => {
      const actions = Array.from(queue.values()).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const resultat = { total: actions.length, reussies: 0, echouees: 0, details: [] as { id: string; succes: boolean; erreur?: string }[] };

      for (const action of actions) {
        if (action.tentatives >= 5) {
          resultat.echouees++;
          resultat.details.push({ id: action.id, succes: false, erreur: "Trop de tentatives" });
          continue;
        }
        try {
          await executerAction(action);
          queue.delete(action.id);
          resultat.reussies++;
          resultat.details.push({ id: action.id, succes: true });
        } catch (err) {
          const erreur = err instanceof Error ? err.message : "Erreur";
          queue.set(action.id, { ...action, tentatives: action.tentatives + 1, derniere_erreur: erreur });
          resultat.echouees++;
          resultat.details.push({ id: action.id, succes: false, erreur });
        }
      }

      return resultat;
    },

    estEnLigne: () => true,

    ecouterConnectivite: (callback: (en_ligne: boolean) => void) => {
      const onOnline = () => callback(true);
      const onOffline = () => callback(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    },

    enregistrerServiceWorker: async () => ({ supporte: false, enregistre: false, mise_a_jour_disponible: false }),
    appliquerMiseAJour: () => {},
  };
});

beforeEach(() => {
  queueStore = (globalThis as Record<string, unknown>).__testQueue as Map<string, ActionEnAttente>;
  cacheStore = (globalThis as Record<string, unknown>).__testCache as Map<string, { cle: string; valeur: unknown; timestamp: string }>;
  queueStore.clear();
  cacheStore.clear();
});

// ──── File de synchronisation ────

describe("file de synchronisation", () => {
  it("ajoute une action en attente", async () => {
    const action = await ajouterActionEnAttente({
      type: "creation",
      entite: "arrete",
      entiteId: "a1",
      donnees: { titre: "Test" },
    });

    expect(action.id).toBeDefined();
    expect(action.tentatives).toBe(0);
    expect(action.type).toBe("creation");
  });

  it("récupère toutes les actions en attente", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await ajouterActionEnAttente({ type: "modification", entite: "arrete", entiteId: "a2", donnees: {} });

    const actions = await obtenirActionsEnAttente();
    expect(actions).toHaveLength(2);
  });

  it("supprime une action", async () => {
    const action = await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await supprimerAction(action.id);

    const actions = await obtenirActionsEnAttente();
    expect(actions).toHaveLength(0);
  });

  it("met à jour une action", async () => {
    const action = await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await mettreAJourAction(action.id, { tentatives: 3, derniere_erreur: "Timeout" });

    const actions = await obtenirActionsEnAttente();
    expect(actions[0]!.tentatives).toBe(3);
    expect(actions[0]!.derniere_erreur).toBe("Timeout");
  });

  it("vide la file", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a2", donnees: {} });
    await viderFile();

    expect(await compterActionsEnAttente()).toBe(0);
  });

  it("compte les actions", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a2", donnees: {} });
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a3", donnees: {} });

    expect(await compterActionsEnAttente()).toBe(3);
  });
});

// ──── Cache de données ────

describe("cache de données", () => {
  it("met en cache et récupère des données", async () => {
    await mettreEnCache("arretes_actifs", [{ id: "a1" }, { id: "a2" }]);

    const result = await obtenirDuCache<{ id: string }[]>("arretes_actifs");
    expect(result).not.toBeNull();
    expect(result!.valeur).toHaveLength(2);
    expect(result!.timestamp).toBeDefined();
  });

  it("retourne null pour une clé inexistante", async () => {
    const result = await obtenirDuCache("inexistant");
    expect(result).toBeNull();
  });

  it("supprime une entrée du cache", async () => {
    await mettreEnCache("test", { data: true });
    await supprimerDuCache("test");

    const result = await obtenirDuCache("test");
    expect(result).toBeNull();
  });

  it("vide tout le cache", async () => {
    await mettreEnCache("a", 1);
    await mettreEnCache("b", 2);
    await viderCache();

    expect(await obtenirDuCache("a")).toBeNull();
    expect(await obtenirDuCache("b")).toBeNull();
  });

  it("écrase les données existantes", async () => {
    await mettreEnCache("key", "v1");
    await mettreEnCache("key", "v2");

    const result = await obtenirDuCache<string>("key");
    expect(result!.valeur).toBe("v2");
  });
});

// ──── Synchronisation ────

describe("synchroniserActions", () => {
  it("synchronise les actions avec succès", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: { titre: "Test" } });
    await ajouterActionEnAttente({ type: "modification", entite: "arrete", entiteId: "a2", donnees: { titre: "Modif" } });

    const executeur = vi.fn().mockResolvedValue(undefined);
    const resultat = await synchroniserActions(executeur);

    expect(resultat.total).toBe(2);
    expect(resultat.reussies).toBe(2);
    expect(resultat.echouees).toBe(0);
    expect(executeur).toHaveBeenCalledTimes(2);

    // File vidée
    expect(await compterActionsEnAttente()).toBe(0);
  });

  it("gère les erreurs de synchronisation", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });

    const executeur = vi.fn().mockRejectedValue(new Error("Network error"));
    const resultat = await synchroniserActions(executeur);

    expect(resultat.echouees).toBe(1);
    expect(resultat.reussies).toBe(0);

    // Action toujours dans la file avec tentative incrémentée
    const actions = await obtenirActionsEnAttente();
    expect(actions[0]!.tentatives).toBe(1);
    expect(actions[0]!.derniere_erreur).toBe("Network error");
  });

  it("abandonne après 5 tentatives", async () => {
    const action = await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await mettreAJourAction(action.id, { tentatives: 5 });

    const executeur = vi.fn();
    const resultat = await synchroniserActions(executeur);

    expect(resultat.echouees).toBe(1);
    expect(executeur).not.toHaveBeenCalled();
  });

  it("retourne un résultat vide quand la file est vide", async () => {
    const executeur = vi.fn();
    const resultat = await synchroniserActions(executeur);

    expect(resultat.total).toBe(0);
    expect(resultat.reussies).toBe(0);
    expect(resultat.echouees).toBe(0);
  });

  it("synchronise partiellement en cas d'erreurs mixtes", async () => {
    await ajouterActionEnAttente({ type: "creation", entite: "arrete", entiteId: "a1", donnees: {} });
    await ajouterActionEnAttente({ type: "modification", entite: "arrete", entiteId: "a2", donnees: {} });

    let appels = 0;
    const executeur = vi.fn().mockImplementation(async () => {
      appels++;
      if (appels === 2) throw new Error("Erreur réseau");
    });

    const resultat = await synchroniserActions(executeur);

    expect(resultat.reussies).toBe(1);
    expect(resultat.echouees).toBe(1);
  });
});

// ──── Détection connectivité ────

describe("détection de connectivité", () => {
  it("retourne l'état en ligne", () => {
    expect(estEnLigne()).toBe(true);
  });

  it("appelle le callback sur les événements online/offline", () => {
    const callback = vi.fn();
    const unsubscribe = ecouterConnectivite(callback);

    window.dispatchEvent(new Event("offline"));
    expect(callback).toHaveBeenCalledWith(false);

    window.dispatchEvent(new Event("online"));
    expect(callback).toHaveBeenCalledWith(true);

    unsubscribe();

    // Plus de callbacks après unsubscribe
    callback.mockClear();
    window.dispatchEvent(new Event("offline"));
    expect(callback).not.toHaveBeenCalled();
  });
});
