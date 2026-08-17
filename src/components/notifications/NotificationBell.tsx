import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Clock, RefreshCw, Calendar } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { TypeNotification } from "@/types";
import { ROUTES } from "@/config/routes";

const COULEURS_TYPE: Record<TypeNotification, string> = {
  expiration: "#92400E",
  workflow: "#1E3A5F",
  info: "#2F6B4F",
  alerte: "#DC2626",
};

const ICONES_TYPE: Record<TypeNotification, typeof Bell> = {
  expiration: Calendar,
  workflow: Clock,
  info: RefreshCw,
  alerte: AlertTriangle,
};

function tempsRelatif(dateStr: string): string {
  const date = new Date(dateStr);
  const maintenant = new Date();
  const diffMs = maintenant.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  return `Il y a ${diffJ}j`;
}

export default function NotificationBell() {
  const { notifications, nonLues, dispatch } = useNotifications();
  const [ouvert, setOuvert] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    if (ouvert) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ouvert]);

  const hautesPriorites = notifications.filter((n) => n.priorite === "haute" && !n.lue);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOuvert(!ouvert)}
        aria-label={`Notifications${nonLues > 0 ? ` (${nonLues} non lues)` : ""}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={18} color={hautesPriorites.length > 0 ? "#DC2626" : "#6B6A60"} strokeWidth={1.75} />
        {nonLues > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: hautesPriorites.length > 0 ? "#DC2626" : "#1E3A5F",
              color: "#fff",
              fontSize: 10,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {nonLues > 99 ? "99+" : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 380,
            maxHeight: 440,
            overflowY: "auto",
            background: "#FFFFFF",
            border: "1px solid #E4E1D6",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid #E4E1D6",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>
              Notifications
              {nonLues > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "#6B6A60", fontWeight: 400 }}>
                  {nonLues} non lue{nonLues > 1 ? "s" : ""}
                </span>
              )}
            </span>
            {nonLues > 0 && (
              <button
                onClick={() => dispatch({ type: "MARK_ALL_READ" })}
                style={{
                  background: "none", border: "none", color: "#1E3A5F",
                  fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline",
                }}
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Urgent alerts summary */}
          {hautesPriorites.length > 0 && (
            <div style={{
              padding: "8px 16px",
              background: "#FFF1F2",
              borderBottom: "1px solid #FECDD3",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <AlertTriangle size={13} color="#DC2626" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#BE123C" }}>
                {hautesPriorites.length} alerte{hautesPriorites.length > 1 ? "s" : ""} urgente{hautesPriorites.length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Notification items */}
          {notifications.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#6B6A60", fontSize: 13 }}>
              Aucune notification
            </div>
          ) : (
            notifications.slice(0, 25).map((notif) => {
              const TypeIcon = ICONES_TYPE[notif.type];
              return (
                <button
                  key={notif.id}
                  onClick={() => {
                    dispatch({ type: "MARK_READ", id: notif.id });
                    if (notif.lien) {
                      navigate(notif.lien);
                      setOuvert(false);
                    }
                  }}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 16px",
                    width: "100%",
                    background: notif.lue ? "#FFFFFF" : "#F9F8F5",
                    border: "none",
                    borderBottom: "1px solid #E4E1D6",
                    borderLeft: notif.priorite === "haute" && !notif.lue ? `3px solid ${COULEURS_TYPE[notif.type]}` : "3px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 4,
                    background: `${COULEURS_TYPE[notif.type]}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <TypeIcon size={12} color={COULEURS_TYPE[notif.type]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{
                        margin: 0, fontSize: 12,
                        fontWeight: notif.lue ? 400 : 600, color: "#1C1F1B",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        flex: 1,
                      }}>
                        {notif.titre}
                      </p>
                      {notif.priorite === "haute" && !notif.lue && (
                        <span style={{
                          fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                          color: "#DC2626", background: "#FEE2E2",
                          padding: "1px 4px", borderRadius: 2, flexShrink: 0,
                        }}>
                          Urgent
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: "2px 0 0", fontSize: 11, color: "#6B6A60",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {notif.message}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, color: "#6B6A60",
                    whiteSpace: "nowrap", flexShrink: 0,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    {tempsRelatif(notif.date)}
                  </span>
                </button>
              );
            })
          )}

          {/* Footer link to full page */}
          <button
            onClick={() => {
              navigate(ROUTES.notifications);
              setOuvert(false);
            }}
            style={{
              display: "block", width: "100%",
              padding: "10px 16px", background: "none",
              border: "none", color: "#1E3A5F",
              fontSize: 12, textAlign: "center",
              cursor: "pointer", textDecoration: "underline",
            }}
          >
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}
