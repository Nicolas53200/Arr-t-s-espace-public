import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Invite à installer l'application en tant que PWA.
 * N'apparaît que quand le navigateur déclenche l'événement `beforeinstallprompt`,
 * et se masque automatiquement après installation ou rejet.
 */
export default function InvitePWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installé, setInstallé] = useState(false);

  useEffect(() => {
    // Vérifier si déjà rejeté récemment (24h)
    const derniereRejet = localStorage.getItem("pwa_invite_rejetee");
    if (derniereRejet) {
      const diff = Date.now() - parseInt(derniereRejet, 10);
      if (diff < 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Détecter si déjà installé
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (mediaQuery.matches) {
      setInstallé(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installer = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setInstallé(true);
      setVisible(false);
    }
  };

  const rejeter = () => {
    setVisible(false);
    localStorage.setItem("pwa_invite_rejetee", String(Date.now()));
  };

  if (!visible || installé) return null;

  return (
    <div
      role="complementary"
      aria-label="Installer l'application"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 250,
        width: 320,
        maxWidth: "calc(100vw - 40px)",
        background: "#FFFFFF",
        border: "1px solid #E4E1D6",
        borderRadius: 12,
        padding: "18px 20px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      {/* Fermer */}
      <button
        onClick={rejeter}
        style={{
          position: "absolute", top: 10, right: 10,
          background: "none", border: "none", cursor: "pointer",
          color: "#A6A399", padding: 2,
        }}
        aria-label="Fermer"
      >
        <X size={14} />
      </button>

      {/* Contenu */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "#EBF0F7", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Smartphone size={20} color="#1E3A5F" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#1A1A18" }}>
            Installer Actes360
          </h3>
          <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 12px", lineHeight: 1.4 }}>
            Accédez rapidement à vos arrêtés depuis votre écran d'accueil, même hors-ligne.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={installer}
              className="btn-primary"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              <Download size={12} />
              Installer
            </button>
            <button
              onClick={rejeter}
              className="btn-ghost"
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
