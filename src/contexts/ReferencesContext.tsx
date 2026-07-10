import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type { Reference } from "@/types";
import { REFS_INITIALES } from "@/data/references.mock";

type ReferencesAction =
  | { type: "ADD"; reference: Reference }
  | { type: "UPDATE"; id: string; updates: Partial<Reference> }
  | { type: "SET_ALL"; references: Reference[] };

function referencesReducer(
  state: Reference[],
  action: ReferencesAction,
): Reference[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.reference];
    case "UPDATE":
      return state.map((r) =>
        r.id === action.id ? { ...r, ...action.updates } : r,
      );
    case "SET_ALL":
      return action.references;
  }
}

interface ReferencesContextValue {
  references: Reference[];
  dispatch: React.Dispatch<ReferencesAction>;
}

const ReferencesContext = createContext<ReferencesContextValue | null>(null);

export function ReferencesProvider({ children }: { children: ReactNode }) {
  const [references, dispatch] = useReducer(referencesReducer, REFS_INITIALES);

  return (
    <ReferencesContext.Provider value={{ references, dispatch }}>
      {children}
    </ReferencesContext.Provider>
  );
}

export function useReferences(): ReferencesContextValue {
  const ctx = useContext(ReferencesContext);
  if (!ctx) throw new Error("useReferences must be used within ReferencesProvider");
  return ctx;
}
