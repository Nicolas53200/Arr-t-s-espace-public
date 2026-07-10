import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { Notification } from "@/types";
import { useReferences } from "@/contexts/ReferencesContext";
import { AUJOURD_HUI } from "@/config/constants";
import { ROUTES } from "@/config/routes";

// --- Actions ---

type NotificationsAction =
  | { type: "ADD"; notification: Notification }
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
    case "MARK_READ":
      return state.map((n) =>
        n.id === action.id ? { ...n, lue: true } : n,
      );
    case "MARK_ALL_READ":
      return state.map((n) => ({ ...n, lue: true }));
    case "DISMISS":
      return state.filter((n) => n.id !== action.id);
    case "CLEAR_ALL":
      return [];
  }
}

// --- Context value ---

interface NotificationsContextValue {
  notifications: Notification[];
  nonLues: number;
  dispatch: React.Dispatch<NotificationsAction>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// --- Provider ---

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { references } = useReferences();
  const [notifications, dispatch] = useReducer(notificationsReducer, []);

  // Generate expiration notifications from references on mount
  useEffect(() => {
    const maintenant = new Date(AUJOURD_HUI);
    const dansJ60 = new Date(AUJOURD_HUI);
    dansJ60.setDate(dansJ60.getDate() + 60);

    for (const ref of references) {
      if (!ref.actif || !ref.date_fin_validite) continue;

      const dateFin = new Date(ref.date_fin_validite);

      if (dateFin < maintenant) {
        // Already expired
        dispatch({
          type: "ADD",
          notification: {
            id: `exp-${ref.id}`,
            type: "expiration",
            priorite: "haute",
            titre: `Reference expiree : ${ref.code}`,
            message: `La reference "${ref.label}" a expire le ${dateFin.toLocaleDateString("fr-FR")}. Action requise.`,
            date: maintenant.toISOString(),
            lue: false,
            lien: ROUTES.references,
            referenceId: ref.id,
          },
        });
      } else if (dateFin <= dansJ60) {
        // Expiring within 60 days
        const joursRestants = Math.ceil(
          (dateFin.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24),
        );
        dispatch({
          type: "ADD",
          notification: {
            id: `exp-soon-${ref.id}`,
            type: "expiration",
            priorite: joursRestants <= 15 ? "haute" : "normale",
            titre: `Reference bientot expiree : ${ref.code}`,
            message: `La reference "${ref.label}" expire dans ${joursRestants} jour${joursRestants > 1 ? "s" : ""} (${dateFin.toLocaleDateString("fr-FR")}).`,
            date: maintenant.toISOString(),
            lue: false,
            lien: ROUTES.references,
            referenceId: ref.id,
          },
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <NotificationsContext.Provider value={{ notifications, nonLues, dispatch }}>
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
