import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Home, CheckCircle2, Map, History, BookOpen, ClipboardCheck, BarChart3, ScrollText, Settings, Menu, X, LogOut } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import { AUJOURD_HUI } from "@/config/constants";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant } = useTenant();
  const { user, logout } = useAuth();
  const { actifs, arretes } = useArretes();
  const { references } = useReferences();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const alertes = references.filter((r) => {
    if (!r.actif || !r.date_fin_validite) return false;
    const fin = new Date(r.date_fin_validite);
    const j60 = new Date(AUJOURD_HUI);
    j60.setDate(j60.getDate() + 60);
    return fin <= j60;
  });

  // Close menu on navigation
  useEffect(() => {
    setMenuOuvert(false);
  }, [location.pathname]);

  // Close menu when switching to desktop
  useEffect(() => {
    if (!isMobile) setMenuOuvert(false);
  }, [isMobile]);

  const validationCount = arretes.filter((a) => a.statut === "en_relecture" || a.statut === "valide").length;

  const navItems = [
    { path: "/", label: "Accueil", icon: Home, badge: null },
    { path: "/actifs", label: "Actifs", icon: CheckCircle2, badge: actifs.length > 0 ? { count: actifs.length, bg: "#1E3A5F" } : null },
    { path: "/carte", label: "Carte", icon: Map, badge: null },
    { path: "/historique", label: "Historique", icon: History, badge: null },
    { path: "/validation", label: "Validation", icon: ClipboardCheck, badge: validationCount > 0 ? { count: validationCount, bg: "#92400E" } : null },
    { path: "/references", label: "References", icon: BookOpen, badge: null, dot: alertes.length > 0 },
    { path: "/tableau-de-bord", label: "Tableau de bord", icon: BarChart3, badge: null },
    { path: "/journal", label: "Journal", icon: ScrollText, badge: null },
    ...(user?.role === "admin" ? [{ path: "/admin", label: "Admin", icon: Settings, badge: null }] : []),
  ];

  return (
    <header style={{ borderBottom: "1px solid #E4E1D6", background: "#FFFFFF", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
        {/* Logo */}
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {tenant.logo ? (
            <img src={tenant.logo} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "contain", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 32, height: 32, background: "#1E3A5F", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={16} color="#FAFAF7" strokeWidth={1.75} />
            </div>
          )}
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6A60", margin: 0, lineHeight: 1 }}>{tenant.nom}</p>
            <p className="fd" style={{ fontSize: 13, margin: 0, lineHeight: 1.2, color: "#1C1F1B" }}>Arretes & Espace public</p>
          </div>
        </button>

        {/* Desktop nav */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button key={item.path} onClick={() => navigate(item.path)} className={`nav-link${isActive ? " active" : ""}`} style={item.dot ? { position: "relative" } : undefined}>
                  <Icon size={13} />{item.label}
                  {item.badge && (
                    <span style={{ background: item.badge.bg, color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontFamily: "'IBM Plex Mono',monospace" }}>{item.badge.count}</span>
                  )}
                  {item.dot && (
                    <span style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "#D9730D" }} />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationBell />
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: "#6B6A60", fontFamily: "'IBM Plex Mono',monospace", textAlign: "right" }}>
                <p style={{ margin: 0 }}>{user?.nom ?? ""}</p>
                <p style={{ margin: 0, fontSize: 10 }}>{AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
              </div>
              <button
                onClick={logout}
                title="Deconnexion"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 30,
                  height: 30,
                  background: "none",
                  border: "1px solid #E4E1D6",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: "#6B6A60",
                  padding: 0,
                  flexShrink: 0,
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          {isMobile && (
            <button
              onClick={() => setMenuOuvert((o) => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "none", border: "none", cursor: "pointer", color: "#1C1F1B", padding: 0 }}
              aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {menuOuvert ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMobile && menuOuvert && (
        <nav style={{
          display: "flex",
          flexDirection: "column",
          borderTop: "1px solid #E4E1D6",
          background: "#FFFFFF",
          maxHeight: "calc(100vh - 54px)",
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 24px",
                  minHeight: 48,
                  background: isActive ? "#EBF0F7" : "transparent",
                  border: "none",
                  borderBottom: "1px solid #F0EDE4",
                  cursor: "pointer",
                  color: isActive ? "#1E3A5F" : "#1C1F1B",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  width: "100%",
                  textAlign: "left",
                  position: "relative",
                }}
              >
                <Icon size={16} />
                {item.label}
                {item.badge && (
                  <span style={{ background: item.badge.bg, color: "#fff", borderRadius: 10, fontSize: 11, padding: "2px 8px", fontFamily: "'IBM Plex Mono',monospace", marginLeft: "auto" }}>{item.badge.count}</span>
                )}
                {item.dot && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D9730D", marginLeft: "auto" }} />
                )}
              </button>
            );
          })}
          {/* User info at bottom of mobile menu */}
          <div style={{ padding: "14px 24px", borderTop: "1px solid #E4E1D6", background: "#F9F8F5" }}>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 500, color: "#1C1F1B" }}>{user?.nom ?? ""}</p>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#6B6A60", fontFamily: "'IBM Plex Mono',monospace" }}>{AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
            <button
              onClick={logout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans',sans-serif",
                background: "none",
                border: "1px solid #E4E1D6",
                borderRadius: 6,
                cursor: "pointer",
                color: "#6B6A60",
                width: "100%",
              }}
            >
              <LogOut size={14} />
              Deconnexion
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
