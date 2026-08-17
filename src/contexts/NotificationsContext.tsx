import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Notification } from "@/types";
import { useReferences } from "@/contexts/ReferencesContext";
import { useArretes } from "@/contexts/ArretesContext";
import { useTenant } from "@/contexts/TenantContext";
import { AUJOURD_HUI } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import {
  calculerBilanAlertes,
  bilanVersNotifications,
  type BilanAlertes,
} from "@/lib/alertes";

// --- Persistence localStorage ---

const CLE_LUES = "notif_lues";
const CLE_DISMISSED = "notif_dismissed";

function lireSet(cle: string): Set<string> {
  try {
    const raw = localStorage.getItem(cle);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function ecrireSet(cle: string, set: Set<string>): void {
  localStorage.setItem(cle, JSON.stringify([...set]));
}

// --- Actions ---

type NotificationsAction =
  | { type: "ADD"; notification: Notification }
  | { type: "SET_ALL"; notifications: Notification[] }
  | { type: "MARK_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "DISMISS"; id: string }
  | { type: "CLEAR_ALL" };

// --- Reducer ---

function notificationsReducer(
  state: Notification[],
  action: NotificationsAction,
): Notification[] {
  switch (action.type) {
    case "ADD":
      // Avoid duplicates by id
      if (state.some((n) => n.id === action.notification.id)) return state;
      return [action.notification, ...state];
    case "SET_ALL":
      return action.notifications;
    case "MARK_READ": {
      const lues = lireSet(CLE_LUES);
      lues.add(action.id);
      ecrireSet(CLE_LUES, lues);
      return state.map((n) =>
        n.id === action.id ? { ...n, lue: true } : n,
      );
    }
    case "MARK_ALL_READ": {
      const lues = lireSet(CLE_LUES);
      state.forEach((n) => lues.add(n.id));
      ecrireSet(CLE_LUES, lues);
      return state.map((n) => ({ ...n, lue: true }));
    }
    case "DISMISS": {
      const dismissed = lireSet(CLE_DISMISSED);
      dismissed.add(action.id);
      ecrireSet(CLE_DISMISSED, dismissed);
      return state.filter((n) => n.id !== action.id);
    }
    case "CLEAR_ALL": {
      const dismissed = lireSet(CLE_DISMISSED);
      state.forEach((n) => dismissed.add(n.id));
      ecrireSet(CLE_DISMISSED, dismissed);
      return [];
    }
  }
}

// --- Context value ---

interface NotificationsContextValue {
  notifications: Notification[];
  nonLues: number;
  bilan: BilanAlertes;
  dispatch: React.Dispatch<NotificationsAction>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// --- Provider ---

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { references } = useReferences();
  const { arretes } = useArretes();
  const { tenant } = useTenant();
  const [notifications, dispatch] = useReducer(notificationsReducer, []);

  // ── 1. Alertes intelligentes depuis les arrêtés ──
  const bilan = useMemo(
    () => calculerBilanAlertes(arretes, tenant.id, AUJOURD_HUI),
    [arretes, tenant.id],
  );

  useEffect(() => {
    const lues = lireSet(CLE_LUES);
    const dismissed = lireSet(CLE_DISMISSED);

    // Convertir le bilan en notifications
    const alerteNotifs = bilanVersNotifications(bilan, AUJOURD_HUI)
      .filter((n) => !dismissed.has(n.id))
      .map((n) => ({ ...n, lue: lues.has(n.id) }));

    // ── 2. Alertes depuis les références réglementaires ──
    const refNotifs: Notification[] = [];
    const maintenant = new Date(AUJOURD_HUI);
    const dansJ60 = new Date(AUJOURD_HUI);
    dansJ60.setDate(dansJ60.getDate() + 60);

    for (const ref of references) {
      if (!ref.actif || !ref.date_fin_validite) continue;

      const dateFin = new Date(ref.date_fin_validite);
      const nid = `exp-ref-${ref.id}`;
      if (dismissed.has(nid)) continue;

      if (dateFin < maintenant) {
        refNotifs.push({
          id: nid,
          type: "expiration",
          priorite: "haute",
          titre: `Reference expiree : ${ref.code}`,
          message: `La reference "${ref.label}" a expire le ${dateFin.toLocaleDateString("fr-FR")}. Action requise.`,
          date: maintenant.toISOString(),
          lue: lues.has(nid),
          lien: ROUTES.references,
          referenceId: ref.id,
        });
      } else if (dateFin <= dansJ60) {
        const joursRestants = Math.ceil(
          (dateFin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24),
        );
        refNotifs.push({
          id: nid,
          type: "expiration",
          priorite: joursRestants <= 15 ? "haute" : "normale",
          titre: `Reference bientot expiree : ${ref.code}`,
          message: `La reference "${ref.label}" expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""} (${dateFin.toLocaleDateString("fr-FR")}).`,
          date: maintenant.toISOString(),
          lue: lues.has(nid),
          lien: ROUTES.references,
          referenceId: ref.id,
        });
      }
    }

    // Fusionner toutes les notifications
    const toutes = [...alerteNotifs, ...refNotifs];

    // Trier : haute priorité d'abord, puis non lues, puis par date
    const ordreP: Record<string, number> = { haute: 0, normale: 1, basse: 2 };
    toutes.sort((a, b) => {
      const pa = ordreP[a.priorite] ?? 1;
      const pb = ordreP[b.priorite] ?? 1;
      if (pa !== pb) return pa - pb;
      if (a.lue !== b.lue) return a.lue ? 1 : -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    dispatch({ type: "SET_ALL", notifications: toutes });
  }, [bilan, references]); // eslint-disable-line react-hooks/exhaustive-deps

  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <NotificationsContext.Provider value={{ notifications, nonLues, bilan, dispatch }}>
      {children}
    </NotificationsContext.Provider>
  );
}

// --- Hook ---

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  return ctx;
}
