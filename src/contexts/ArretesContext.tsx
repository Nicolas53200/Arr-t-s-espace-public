import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type { Arrete, StatutArrete } from "@/types";
import { ARRETES_INITIAUX } from "@/data/arretes.mock";
import { estActif, estEnHistorique } from "@/lib/arrete";
import { peutTransitionner } from "@/lib/workflow";
import { ENV } from "@/config/env";
import { ArretesService } from "@/services/arretes.service";

type ArretesAction =
  | { type: "ADD"; arrete: Arrete }
  | { type: "UPDATE"; id: string; updates: Partial<Arrete> }
  | { type: "SET_ALL"; arretes: Arrete[] }
  | { type: "TRANSITION"; id: string; nouveauStatut: StatutArrete; commentaire?: string; auteur: string };

function arretesReducer(state: Arrete[], action: ArretesAction): Arrete[] {
  switch (action.type) {
    case "ADD":
      return [action.arrete, ...state];
    case "UPDATE":
      return state.map((a) =>
        a.id === action.id ? { ...a, ...action.updates } : a,
      );
    case "SET_ALL":
      return action.arretes;
    case "TRANSITION":
      return state.map((a) => {
        if (a.id !== action.id) return a;
        if (!peutTransitionner(a.statut, action.nouveauStatut)) return a;
        const commentaires = [...(a.commentaires ?? [])];
        if (action.commentaire) {
          commentaires.push({
            id: crypto.randomUUID(),
            auteur: action.auteur,
            date: new Date().toISOString(),
            texte: action.commentaire,
            etape: action.nouveauStatut,
          });
        }
        const updates: Partial<Arrete> = {
          statut: action.nouveauStatut,
          commentaires,
        };
        if (action.nouveauStatut === "valide") {
          updates.valideur = action.auteur;
          updates.date_validation = new Date().toISOString().slice(0, 10);
        }
        return { ...a, ...updates };
      });
  }
}

interface ArretesContextValue {
  arretes: Arrete[];
  actifs: Arrete[];
  historique: Arrete[];
  dispatch: React.Dispatch<ArretesAction>;
  loading: boolean;
  error: string | null;
  recharger: () => void;
}

const ArretesContext = createContext<ArretesContextValue | null>(null);

interface ArretesProviderProps {
  children: ReactNode;
  /** Force l'utilisation des données mock (par défaut : basé sur ENV.USE_MOCK) */
  useMock?: boolean;
}

export function ArretesProvider({ children, useMock }: ArretesProviderProps) {
  const shouldUseMock = useMock ?? !ENV.USE_MOCK ? true : false;
  const [arretes, dispatch] = useReducer(
    arretesReducer,
    shouldUseMock ? ARRETES_INITIAUX : [],
  );
  const [loading, setLoading] = useState(!shouldUseMock);
  const [error, setError] = useState<string | null>(null);

  const chargerDepuisApi = useCallback(async () => {
    if (shouldUseMock) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ArretesService.lister();
      if (response.success) {
        dispatch({ type: "SET_ALL", arretes: response.data });
      } else {
        setError(response.error ?? "Erreur lors du chargement des arretes");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement",
      );
    } finally {
      setLoading(false);
    }
  }, [shouldUseMock]);

  useEffect(() => {
    void chargerDepuisApi();
  }, [chargerDepuisApi]);

  const actifs = useMemo(() => arretes.filter(estActif), [arretes]);
  const historique = useMemo(() => arretes.filter(estEnHistorique), [arretes]);

  return (
    <ArretesContext.Provider
      value={{ arretes, actifs, historique, dispatch, loading, error, recharger: chargerDepuisApi }}
    >
      {children}
    </ArretesContext.Provider>
  );
}

export function useArretes(): ArretesContextValue {
  const ctx = useContext(ArretesContext);
  if (!ctx) throw new Error("useArretes must be used within ArretesProvider");
  return ctx;
}
