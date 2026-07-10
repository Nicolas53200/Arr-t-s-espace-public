// Types du domaine — Notifications

export type TypeNotification = "expiration" | "workflow" | "info" | "alerte";
export type PrioriteNotification = "haute" | "normale" | "basse";

export interface Notification {
  id: string;
  type: TypeNotification;
  priorite: PrioriteNotification;
  titre: string;
  message: string;
  date: string;
  lue: boolean;
  lien?: string;
  referenceId?: string;
  arreteId?: string;
}
