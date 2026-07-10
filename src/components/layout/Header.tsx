import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Home, CheckCircle2, Map, History, BookOpen } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { AUJOURD_HUI } from "@/config/constants";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { actifs } = useArretes();
  const { references } = useReferences();

  const alertes = references.filter((r) => {
    if (!r.actif || !r.date_fin_validite) return false;
    const fin = new Date(r.date_fin_validite);
    const j60 = new Date(AUJOURD_HUI);
    j60.setDate(j60.getDate() + 60);
    return fin <= j60;
  });

  return (
    <header style={{ borderBottom: "1px solid #E4E1D6", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 32, height: 32, background: "#1E3A5F", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={16} color="#FAFAF7" strokeWidth={1.75} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6A60", margin: 0, lineHeight: 1 }}>{tenant.nom}</p>
            <p className="fd" style={{ fontSize: 13, margin: 0, lineHeight: 1.2, color: "#1C1F1B" }}>Arretes & Espace public</p>
          </div>
        </button>
        <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <button onClick={() => navigate("/")} className={`nav-link${location.pathname === "/" ? " active" : ""}`}><Home size={13} />Accueil</button>
          <button onClick={() => navigate("/actifs")} className={`nav-link${location.pathname === "/actifs" ? " active" : ""}`}>
            <CheckCircle2 size={13} />Actifs
            {actifs.length > 0 && <span style={{ background: "#1E3A5F", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontFamily: "'IBM Plex Mono',monospace" }}>{actifs.length}</span>}
          </button>
          <button onClick={() => navigate("/carte")} className={`nav-link${location.pathname === "/carte" ? " active" : ""}`}><Map size={13} />Carte</button>
          <button onClick={() => navigate("/historique")} className={`nav-link${location.pathname === "/historique" ? " active" : ""}`}><History size={13} />Historique</button>
          <button onClick={() => navigate("/references")} className={`nav-link${location.pathname === "/references" ? " active" : ""}`} style={{ position: "relative" }}>
            <BookOpen size={13} />References
            {alertes.length > 0 && <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "#D9730D" }} />}
          </button>
        </nav>
        <div style={{ fontSize: 11, color: "#6B6A60", fontFamily: "'IBM Plex Mono',monospace", textAlign: "right" }}>
          <p style={{ margin: 0 }}>{user?.nom ?? ""}</p>
          <p style={{ margin: 0, fontSize: 10 }}>{AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
        </div>
      </div>
    </header>
  );
}
