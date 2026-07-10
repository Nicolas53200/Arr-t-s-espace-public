import { createContext, useContext, useReducer, useCallback, type ReactNode } from "react";
import type { EntreeAudit, ActionAudit } from "@/types";

interface AuditState {
  journal: EntreeAudit[];
}

type AuditAction =
  | { type: "LOG"; entree: EntreeAudit }
  | { type: "CLEAR" };

function auditReducer(state: AuditState, action: AuditAction): AuditState {
  switch (action.type) {
    case "LOG":
      return { journal: [action.entree, ...state.journal] };
    case "CLEAR":
      return { journal: [] };
    default:
      return state;
  }
}

const JOURNAL_INITIAL: EntreeAudit[] = [
  {
    id: "audit-001",
    action: "creation",
    entite: "arrete",
    entiteId: "a1",
    description: "Creation de l'arrete AR-2026-0142-SPO — Triathlon de Saint-Avoye",
    auteur: "M. Lefevre",
    date: "2026-06-18T09:15:00",
  },
  {
    id: "audit-002",
    action: "creation",
    entite: "arrete",
    entiteId: "a2",
    description: "Creation de l'arrete AR-2026-0138-TRX — Refection de chaussee",
    auteur: "M. Lefevre",
    date: "2026-06-01T10:30:00",
  },
  {
    id: "audit-003",
    action: "modification",
    entite: "arrete",
    entiteId: "a4",
    description: "Modification de l'arrete AR-2026-0099-STA — Stationnement interdit",
    auteur: "Mme Bernard",
    date: "2026-05-12T14:22:00",
    details: { champ: "voies", ancienne_valeur: "1 voie", nouvelle_valeur: "2 voies" },
  },
  {
    id: "audit-004",
    action: "creation",
    entite: "arrete",
    entiteId: "a3",
    description: "Creation de l'arrete AR-2026-0125-MAN — Fete de la Musique 2026",
    auteur: "M. Lefevre",
    date: "2026-05-20T08:45:00",
  },
  {
    id: "audit-005",
    action: "abrogation",
    entite: "arrete",
    entiteId: "a5",
    description: "Abrogation de l'arrete AR-2026-0071-CIR — Fermeture Rue des Tanneurs",
    auteur: "M. Lefevre",
    date: "2026-03-08T16:00:00",
    details: { motif: "Reparation terminee, voie rouverte." },
  },
  {
    id: "audit-006",
    action: "transition",
    entite: "arrete",
    entiteId: "a6",
    description: "Passage en statut publie — AR-2026-0045-MAN — Carnaval de printemps",
    auteur: "Mme Bernard",
    date: "2026-03-10T11:00:00",
    details: { ancien_statut: "valide", nouveau_statut: "publie" },
  },
  {
    id: "audit-007",
    action: "creation",
    entite: "arrete",
    entiteId: "a7",
    description: "Creation de l'arrete AR-2026-0151-TRX — Travaux fibre optique Avenue Foch",
    auteur: "M. Lefevre",
    date: "2026-06-18T11:30:00",
  },
  {
    id: "audit-008",
    action: "creation",
    entite: "arrete",
    entiteId: "a8",
    description: "Creation de l'arrete AR-2026-0155-SPO — Foulees de Saint-Avoye",
    auteur: "Mme Bernard",
    date: "2026-06-18T14:00:00",
  },
  {
    id: "audit-009",
    action: "modification",
    entite: "reference",
    entiteId: "r1",
    description: "Mise a jour de la delegation Securite — nouveau titulaire",
    auteur: "Admin SaaS",
    date: "2026-01-15T09:00:00",
    details: { ancien_titulaire: "M. Rene Chapuis", nouveau_titulaire: "Mme Claire Fontaine" },
  },
  {
    id: "audit-010",
    action: "connexion",
    entite: "utilisateur",
    entiteId: "u1",
    description: "Connexion de M. Lefevre",
    auteur: "M. Lefevre",
    date: "2026-07-10T08:00:00",
  },
  {
    id: "audit-011",
    action: "consultation",
    entite: "arrete",
    entiteId: "a2",
    description: "Consultation de l'arrete AR-2026-0138-TRX",
    auteur: "M. Dupont (Lecteur)",
    date: "2026-07-09T15:30:00",
  },
  {
    id: "audit-012",
    action: "export",
    entite: "arrete",
    entiteId: "a1",
    description: "Export PDF de l'arrete AR-2026-0142-SPO",
    auteur: "M. Lefevre",
    date: "2026-07-08T10:15:00",
  },
];

interface AuditContextValue {
  journal: EntreeAudit[];
  logAction: (
    action: ActionAudit,
    entite: EntreeAudit["entite"],
    entiteId: string,
    description: string,
    details?: Record<string, string>
  ) => void;
  clear: () => void;
  dispatch: React.Dispatch<AuditAction>;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(auditReducer, { journal: JOURNAL_INITIAL });

  const logAction = useCallback(
    (
      action: ActionAudit,
      entite: EntreeAudit["entite"],
      entiteId: string,
      description: string,
      details?: Record<string, string>
    ) => {
      const entree: EntreeAudit = {
        id: `audit-${Date.now()}`,
        action,
        entite,
        entiteId,
        description,
        auteur: "Utilisateur courant",
        date: new Date().toISOString(),
        details,
      };
      dispatch({ type: "LOG", entree });
    },
    []
  );

  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  return (
    <AuditContext.Provider value={{ journal: state.journal, logAction, clear, dispatch }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}
