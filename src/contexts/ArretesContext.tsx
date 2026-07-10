import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
import type { Arrete, StatutArrete } from "@/types";
import { ARRETES_INITIAUX } from "@/data/arretes.mock";
import { estActif, estEnHistorique } from "@/lib/arrete";
import { peutTransitionner } from "@/lib/workflow";

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
}

const ArretesContext = createContext<ArretesContextValue | null>(null);

export function ArretesProvider({ children }: { children: ReactNode }) {
  const [arretes, dispatch] = useReducer(arretesReducer, ARRETES_INITIAUX);
  const actifs = useMemo(() => arretes.filter(estActif), [arretes]);
  const historique = useMemo(() => arretes.filter(estEnHistorique), [arretes]);

  return (
    <ArretesContext.Provider value={{ arretes, actifs, historique, dispatch }}>
      {children}
    </ArretesContext.Provider>
  );
}

export function useArretes(): ArretesContextValue {
  const ctx = useContext(ArretesContext);
  if (!ctx) throw new Error("useArretes must be used within ArretesProvider");
  return ctx;
}
