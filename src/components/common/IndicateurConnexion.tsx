import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Loader2, Check, X } from "lucide-react";
import { useConnectivite } from "@/hooks/useConnectivite";
import { useToast } from "@/contexts/ToastContext";

/**
 * Barre d'état de connexion.
 * Apparaît automatiquement quand l'application passe hors-ligne,
 * avec le nombre d'actions en attente et un bouton de synchro manuelle.
 */
export default function IndicateurConnexion() {
  const { enLigne, actionsEnAttente, synchroEnCours, synchroniser } = useConnectivite();
  const toast = useToast();
  const [visible, setVisible] = useState(!enLigne);
  const [afficherTemporaire, setAfficherTemporaire] = useState(false);

  // Afficher un message temporaire au retour en ligne
  useEffect(() => {
    if (enLigne && visible) {
      setAfficherTemporaire(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setAfficherTemporaire(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (!enLigne) {
      setVisible(true);
      setAfficherTemporaire(false);
    }
  }, [enLigne, visible]);

  const handleSynchro = async () => {
    const resultat = await synchroniser();
    if (resultat) {
      if (resultat.echouees === 0 && resultat.reussies > 0) {
        toast.success(`${resultat.reussies} action${resultat.reussies > 1 ? "s" : ""} synchronisée${resultat.reussies > 1 ? "s" : ""}`);
      } else if (resultat.echouees > 0) {
        toast.warning(`${resultat.reussies} réussie${resultat.reussies > 1 ? "s" : ""}, ${resultat.echouees} en erreur`);
      }
    }
  };

  if (!visible && enLigne) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: afficherTemporaire ? "#065F46" : enLigne ? "#065F46" : "#92400E",
        color: "#FFFFFF",
        transition: "background 0.3s, transform 0.3s",
        transform: visible ? "translateY(0)" : "translateY(100%)",
      }}
    >
      {!enLigne ? (
        <>
          <WifiOff size={14} />
          <span>Mode hors-ligne</span>
          {actionsEnAttente > 0 && (
            <span style={{
              background: "rgba(255,255,255,0.2)",
              padding: "2px 8px",
              borderRadius: 10,
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              {actionsEnAttente} en attente
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
            Les modifications seront synchronisées au retour en ligne.
          </span>
        </>
      ) : afficherTemporaire ? (
        <>
          <Wifi size={14} />
          <span>Connexion rétablie</span>
          {actionsEnAttente > 0 ? (
            <button
              onClick={handleSynchro}
              disabled={synchroEnCours}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 12, fontSize: 11,
                border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)",
                color: "#fff", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {synchroEnCours ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />}
              Synchroniser ({actionsEnAttente})
            </button>
          ) : (
            <Check size={14} />
          )}
        </>
      ) : null}
    </div>
  );
}

/**
 * Bannière de mise à jour disponible du Service Worker.
 * Affichée quand une nouvelle version de l'application est détectée.
 */
export function BanniereMiseAJour() {
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    const handler = () => setDisponible(true);
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  if (!disponible) return null;

  const appliquer = () => {
    // Importer dynamiquement pour éviter le chargement au démarrage
    import("@/lib/offline").then(({ appliquerMiseAJour }) => {
      appliquerMiseAJour();
    });
  };

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        borderRadius: 10,
        background: "#1E3A5F",
        color: "#FFFFFF",
        fontSize: 13,
        fontFamily: "'IBM Plex Sans', sans-serif",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}
    >
      <RefreshCw size={15} />
      <span>Une mise à jour est disponible</span>
      <button
        onClick={appliquer}
        style={{
          padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: "#FFFFFF", color: "#1E3A5F", border: "none", cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        Mettre à jour
      </button>
      <button
        onClick={() => setDisponible(false)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", padding: 2 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
