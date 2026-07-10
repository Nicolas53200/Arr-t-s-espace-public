import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
} from "react";
import type { Arrete } from "@/types";
import { ARRETES_INITIAUX } from "@/data/arretes.mock";
import { estActif, estEnHistorique } from "@/lib/arrete";

type ArretesAction =
  | { type: "ADD"; arrete: Arrete }
  | { type: "UPDATE"; id: string; updates: Partial<Arrete> }
  | { type: "SET_ALL"; arretes: Arrete[] };

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
