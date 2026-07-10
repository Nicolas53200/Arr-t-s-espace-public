export type ActionAudit = "creation" | "modification" | "transition" | "abrogation" | "consultation" | "export" | "connexion";

export interface EntreeAudit {
  id: string;
  action: ActionAudit;
  entite: "arrete" | "reference" | "utilisateur";
  entiteId: string;
  description: string;
  auteur: string;
  date: string;
  details?: Record<string, string>;
}
