// Hook de détection de connectivité réseau
// Fournit l'état en ligne/hors-ligne et le nombre d'actions en attente de synchro.

import { useState, useEffect, useCallback } from "react";
import {
  estEnLigne,
  ecouterConnectivite,
  compterActionsEnAttente,
  synchroniserActions,
  type ResultatSynchro,
  type ActionEnAttente,
} from "@/lib/offline";

export interface EtatConnectivite {
  /** L'application est-elle en ligne ? */
  enLigne: boolean;
  /** Nombre d'actions en attente de synchronisation */
  actionsEnAttente: number;
  /** Synchronisation en cours ? */
  synchroEnCours: boolean;
  /** Dernière synchronisation réussie */
  derniereSynchro: string | null;
  /** Déclenche une synchronisation manuelle */
  synchroniser: () => Promise<ResultatSynchro | null>;
  /** Recompter les actions en attente */
  rafraichir: () => Promise<void>;
}

export function useConnectivite(
  executerAction?: (action: ActionEnAttente) => Promise<void>,
): EtatConnectivite {
  const [enLigne, setEnLigne] = useState(estEnLigne());
  const [actionsEnAttente, setActionsEnAttente] = useState(0);
  const [synchroEnCours, setSynchroEnCours] = useState(false);
  const [derniereSynchro, setDerniereSynchro] = useState<string | null>(null);

  // Écouter les changements de connectivité
  useEffect(() => {
    return ecouterConnectivite(setEnLigne);
  }, []);

  // Compter les actions en attente au montage et à chaque changement de connectivité
  const rafraichir = useCallback(async () => {
    try {
      const count = await compterActionsEnAttente();
      setActionsEnAttente(count);
    } catch {
      // IndexedDB non disponible
    }
  }, []);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir, enLigne]);

  // Synchroniser automatiquement au retour en ligne
  useEffect(() => {
    if (enLigne && actionsEnAttente > 0 && executerAction && !synchroEnCours) {
      void synchroniser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enLigne]);

  // Écouter les triggers de Background Sync depuis le SW
  useEffect(() => {
    const handler = () => {
      if (executerAction) {
        void synchroniser();
      }
    };
    window.addEventListener("sw-sync-trigger", handler);
    return () => window.removeEventListener("sw-sync-trigger", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executerAction]);

  const synchroniser = useCallback(async (): Promise<ResultatSynchro | null> => {
    if (!executerAction || synchroEnCours) return null;

    setSynchroEnCours(true);
    try {
      const resultat = await synchroniserActions(executerAction);
      setDerniereSynchro(new Date().toISOString());
      await rafraichir();
      return resultat;
    } finally {
      setSynchroEnCours(false);
    }
  }, [executerAction, synchroEnCours, rafraichir]);

  return {
    enLigne,
    actionsEnAttente,
    synchroEnCours,
    derniereSynchro,
    synchroniser,
    rafraichir,
  };
}
