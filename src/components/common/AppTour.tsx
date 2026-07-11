import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";

interface TourStep {
  titre: string;
  description: string;
  cible?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const ETAPES: TourStep[] = [
  {
    titre: "Bienvenue sur Actes360",
    description: "Votre plateforme de gestion des arretes municipaux. Ce tour vous presente les fonctionnalites principales.",
  },
  {
    titre: "Accueil",
    description: "La page d'accueil affiche un resume de vos arretes actifs, les statistiques cles et les raccourcis vers les actions courantes.",
    cible: 'a[href="/"], button[aria-current="page"]',
  },
  {
    titre: "Arretes actifs",
    description: "Consultez et gerez tous vos arretes en cours. Recherchez, filtrez par type, et exportez en CSV.",
    cible: 'a[href="/actifs"]',
  },
  {
    titre: "Cartographie",
    description: "Visualisez vos arretes sur une carte interactive. Les zones impactees sont affichees en surbrillance.",
    cible: 'a[href="/carte"]',
  },
  {
    titre: "Creer un arrete",
    description: "Un assistant en 5 etapes vous guide dans la creation d'un nouvel arrete : type, informations, voies, troncons et validation.",
  },
  {
    titre: "Workflow de validation",
    description: "Chaque arrete suit un circuit de validation : brouillon → en relecture → valide → publie. Les responsables sont notifies a chaque etape.",
  },
  {
    titre: "Tableau de bord",
    description: "Des graphiques et indicateurs vous donnent une vue d'ensemble de l'activite de votre collectivite.",
    cible: 'a[href="/tableau-de-bord"]',
  },
  {
    titre: "Notifications",
    description: "Restez informe des changements importants. La cloche dans le header affiche les notifications non lues.",
  },
  {
    titre: "Vous etes pret !",
    description: "N'hesitez pas a utiliser le bouton de feedback (en bas a droite) pour nous contacter. Bonne utilisation d'Actes360 !",
  },
];

interface AppTourProps {
  onClose: () => void;
}

export default function AppTour({ onClose }: AppTourProps) {
  const [etape, setEtape] = useState(0);
  const step = ETAPES[etape];
  if (!step) return null;
  const total = ETAPES.length;

  const precedent = useCallback(() => setEtape((e) => Math.max(0, e - 1)), []);
  const suivant = useCallback(() => {
    if (etape >= total - 1) {
      localStorage.setItem("tour_complete", "true");
      onClose();
    } else {
      setEtape((e) => e + 1);
    }
  }, [etape, total, onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") suivant();
      if (e.key === "ArrowLeft") precedent();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, suivant, precedent]);

  useEffect(() => {
    if (step.cible) {
      const el = document.querySelector(step.cible);
      if (el) {
        (el as HTMLElement).style.outline = "2px solid #2563EB";
        (el as HTMLElement).style.outlineOffset = "3px";
        (el as HTMLElement).style.borderRadius = "6px";
        (el as HTMLElement).style.transition = "outline 0.2s";
        return () => {
          (el as HTMLElement).style.outline = "";
          (el as HTMLElement).style.outlineOffset = "";
        };
      }
    }
  }, [step.cible]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
          padding: "28px 32px 24px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
          fontFamily: "'IBM Plex Sans', sans-serif",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer le tour"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B6A60",
            padding: 4,
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#EBF0F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Compass size={18} color="#1E3A5F" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: "#6B6A60", fontFamily: "'IBM Plex Mono', monospace" }}>
              Etape {etape + 1} / {total}
            </p>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1C1F1B" }}>
              {step.titre}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: 13, lineHeight: 1.65, color: "#3D3D35", margin: "0 0 24px" }}>
          {step.description}
        </p>

        {/* Progress bar */}
        <div style={{
          height: 3,
          background: "#F0EDE4",
          borderRadius: 2,
          marginBottom: 20,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${((etape + 1) / total) * 100}%`,
            background: "#1E3A5F",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 12,
              color: "#6B6A60",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Passer le tour
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {etape > 0 && (
              <button
                onClick={precedent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  background: "none",
                  border: "1px solid #E4E1D6",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#1C1F1B",
                }}
              >
                <ChevronLeft size={14} />
                Precedent
              </button>
            )}
            <button
              onClick={suivant}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
                background: "#1E3A5F",
                color: "#FAFAF7",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {etape >= total - 1 ? "Terminer" : "Suivant"}
              {etape < total - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
