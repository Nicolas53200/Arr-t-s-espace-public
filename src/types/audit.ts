export type ActionAudit = "creation" | "modification" | "transition" | "abrogation" | "consultation" | "export" | "connexion" | "synchronisation" | "cloture";

export interface EntreeAudit {
  id: string;
  action: ActionAudit;
  entite: "arrete" | "reference" | "utilisateur" | "registre";
  entiteId: string;
  description: string;
  auteur: string;
  date: string;
  details?: Record<string, string>;
}
