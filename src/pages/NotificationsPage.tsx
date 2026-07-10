import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { TypeNotification, Notification } from "@/types";

type FiltreOnglet = "non_lues" | "toutes" | "expiration" | "workflow";

const ONGLETS: { cle: FiltreOnglet; label: string }[] = [
  { cle: "non_lues", label: "Non lues" },
  { cle: "toutes", label: "Toutes" },
  { cle: "expiration", label: "Expirations" },
  { cle: "workflow", label: "Workflow" },
];

const COULEURS_TYPE: Record<TypeNotification, string> = {
  expiration: "#92400E",
  workflow: "#1E3A5F",
  info: "#6B6A60",
  alerte: "#DC2626",
};

const LABELS_TYPE: Record<TypeNotification, string> = {
  expiration: "Expiration",
  workflow: "Workflow",
  info: "Information",
  alerte: "Alerte",
};

function filtrerNotifications(
  notifications: Notification[],
  filtre: FiltreOnglet,
): Notification[] {
  switch (filtre) {
    case "non_lues":
      return notifications.filter((n) => !n.lue);
    case "toutes":
      return notifications;
    case "expiration":
      return notifications.filter((n) => n.type === "expiration");
    case "workflow":
      return notifications.filter((n) => n.type === "workflow");
  }
}

export default function NotificationsPage() {
  const { notifications, nonLues, dispatch } = useNotifications();
  const [ongletActif, setOngletActif] = useState<FiltreOnglet>("non_lues");
  const navigate = useNavigate();

  const notifsFiltrees = filtrerNotifications(notifications, ongletActif);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Bell size={20} color="#1E3A5F" strokeWidth={1.75} />
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              color: "#1C1F1B",
            }}
          >
            Notifications
          </h1>
          {nonLues > 0 && (
            <span
              style={{
                background: "#DC2626",
                color: "#fff",
                borderRadius: 10,
                fontSize: 11,
                padding: "2px 8px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600,
              }}
            >
              {nonLues}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {nonLues > 0 && (
            <button
              onClick={() => dispatch({ type: "MARK_ALL_READ" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "1px solid #E4E1D6",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 12,
                color: "#1E3A5F",
                cursor: "pointer",
              }}
            >
              <Check size={13} />
              Tout marquer comme lu
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => dispatch({ type: "CLEAR_ALL" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "1px solid #E4E1D6",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 12,
                color: "#6B6A60",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid #E4E1D6",
          marginBottom: 20,
        }}
      >
        {ONGLETS.map((onglet) => (
          <button
            key={onglet.cle}
            onClick={() => setOngletActif(onglet.cle)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              background: "none",
              border: "none",
              borderBottom:
                ongletActif === onglet.cle
                  ? "2px solid #1E3A5F"
                  : "2px solid transparent",
              color: ongletActif === onglet.cle ? "#1E3A5F" : "#6B6A60",
              fontWeight: ongletActif === onglet.cle ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {/* Notification cards */}
      {notifsFiltrees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: "#6B6A60",
          }}
        >
          <Bell
            size={40}
            color="#E4E1D6"
            strokeWidth={1.25}
            style={{ marginBottom: 16 }}
          />
          <p style={{ fontSize: 14, margin: "0 0 4px" }}>
            Aucune notification
          </p>
          <p style={{ fontSize: 12, margin: 0 }}>
            {ongletActif === "non_lues"
              ? "Toutes vos notifications ont ete lues."
              : "Aucune notification dans cette categorie."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifsFiltrees.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.lue ? "#FFFFFF" : "#F9F8F5",
                border: "1px solid #E4E1D6",
                borderRadius: 6,
                padding: "14px 18px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              {/* Type indicator dot */}
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: COULEURS_TYPE[notif.type],
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: notif.lue ? 400 : 600,
                      color: "#1C1F1B",
                    }}
                  >
                    {notif.titre}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: COULEURS_TYPE[notif.type],
                      background: `${COULEURS_TYPE[notif.type]}14`,
                      padding: "1px 6px",
                      borderRadius: 3,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {LABELS_TYPE[notif.type]}
                  </span>
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 12,
                    color: "#6B6A60",
                    lineHeight: 1.5,
                  }}
                >
                  {notif.message}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "#6B6A60",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {new Date(notif.date).toLocaleDateString("fr-FR")}
                  </span>
                  {notif.lien && (
                    <button
                      onClick={() => navigate(notif.lien!)}
                      style={{
                        background: "none",
                        border: "1px solid #E4E1D6",
                        borderRadius: 3,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: "#1E3A5F",
                        cursor: "pointer",
                      }}
                    >
                      Voir
                    </button>
                  )}
                  {!notif.lue && (
                    <button
                      onClick={() =>
                        dispatch({ type: "MARK_READ", id: notif.id })
                      }
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: 11,
                        color: "#1E3A5F",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Marquer comme lue
                    </button>
                  )}
                  <button
                    onClick={() =>
                      dispatch({ type: "DISMISS", id: notif.id })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: 11,
                      color: "#6B6A60",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
