import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, FileText, Map, BarChart3, Settings, X, Lock } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const CODES_ACCES: Record<string, string> = {
  "SAINT-AVOYE-2026": "tenant_saint_avoye",
  "VANNES-2026": "tenant_vannes",
  "LORIENT-2026": "tenant_lorient",
};

const CODE_SUPERADMIN = "IGNISNOVA";

export default function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [codeSuperAdmin, setCodeSuperAdmin] = useState("");
  const [erreurSuperAdmin, setErreurSuperAdmin] = useState("");

  function handleAcces() {
    const upper = code.trim().toUpperCase();
    if (!upper) {
      setErreur("Veuillez entrer votre code d'acces");
      return;
    }
    const tenantId = CODES_ACCES[upper];
    if (tenantId) {
      localStorage.setItem("acces_tenant", tenantId);
      localStorage.setItem("acces_code", upper);
      navigate("/login");
    } else {
      setErreur("Code d'acces invalide. Contactez votre administrateur.");
    }
  }

  function handleSuperAdmin() {
    if (codeSuperAdmin.trim().toUpperCase() === CODE_SUPERADMIN) {
      localStorage.setItem("superadmin_auth", "true");
      navigate("/super-admin");
    } else {
      setErreurSuperAdmin("Code incorrect");
    }
  }

  const fonctionnalites = [
    { icone: FileText, titre: "Redaction assistee", desc: "Creez vos arretes avec des modeles pre-remplis et un workflow de validation." },
    { icone: Map, titre: "Cartographie interactive", desc: "Visualisez les impacts sur la carte de votre commune en temps reel." },
    { icone: Shield, titre: "Conformite juridique", desc: "Visas, references et mentions legales inserees automatiquement." },
    { icone: BarChart3, titre: "Tableau de bord", desc: "Suivez vos statistiques, echeances et indicateurs en un coup d'oeil." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #F8FAFC 0%, #EBF0F7 50%, #FAFAF7 100%)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "16px 20px" : "20px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo-ignisnova.jpg" alt="Ignis Nova" style={{ height: 36, objectFit: "contain" }} />
        </div>
        <button
          onClick={() => setShowSuperAdmin(true)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#A6A399", padding: 6, borderRadius: 4, display: "flex", alignItems: "center" }}
          title="Administration plateforme"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: isMobile ? "40px 20px 30px" : "70px 40px 40px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 800, color: "#1E3A5F", margin: "0 0 4px", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Actes<span style={{ color: "#2563EB" }}>360</span>
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "#6B6A60", margin: "8px 0 0", fontStyle: "italic" }}>par Ignis Nova</p>
        </div>
        <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 600, color: "#1C1F1B", margin: "0 0 12px", lineHeight: 1.3 }}>
          La plateforme de gestion des arretes municipaux
        </h2>
        <p style={{ fontSize: isMobile ? 14 : 16, color: "#6B6A60", margin: "0 0 36px", lineHeight: 1.6, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          Redigez, validez et diffusez vos arretes municipaux depuis un seul outil.
          Cartographie interactive, generation PDF automatique, workflow de validation
          et conformite juridique integree.
        </p>

        {/* Code d'acces */}
        <div style={{
          background: "#FFFFFF", borderRadius: 14, padding: isMobile ? "24px 20px" : "32px 40px",
          boxShadow: "0 4px 24px rgba(30, 58, 95, 0.08), 0 1px 4px rgba(0,0,0,0.04)",
          maxWidth: 480, margin: "0 auto", border: "1px solid #E4E1D6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            <Lock size={18} color="#1E3A5F" />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F", margin: 0 }}>Acces collectivite</h3>
          </div>
          <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 16px" }}>
            Entrez le code d'acces fourni par votre administrateur.
          </p>
          <div style={{ display: "flex", gap: 8, flexDirection: isMobile ? "column" : "row" }}>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setErreur(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleAcces()}
              placeholder="CODE-ACCES-2026"
              aria-label="Code d'acces collectivite"
              aria-invalid={erreur ? "true" : undefined}
              autoComplete="off"
              style={{
                flex: 1, padding: "12px 16px", fontSize: 15, borderRadius: 8,
                border: erreur ? "1.5px solid #DC2626" : "1.5px solid #E4E1D6",
                fontFamily: "'IBM Plex Mono', monospace", textAlign: "center",
                letterSpacing: "0.05em", textTransform: "uppercase",
                outline: "none",
              }}
            />
            <button
              onClick={handleAcces}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#1E3A5F", color: "#FAFAF7", fontSize: 14, fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif", whiteSpace: "nowrap",
              }}
            >
              Acceder <ArrowRight size={16} />
            </button>
          </div>
          {erreur && <p style={{ fontSize: 12, color: "#DC2626", margin: "8px 0 0" }}>{erreur}</p>}
          <p style={{ fontSize: 11, color: "#A6A399", margin: "12px 0 0" }}>
            Code de demo : <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6B6A60" }}>SAINT-AVOYE-2026</span>
          </p>
        </div>
      </div>

      {/* Fonctionnalites */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "30px 20px 40px" : "50px 40px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          {fonctionnalites.map((f) => {
            const Icone = f.icone;
            return (
              <div key={f.titre} style={{
                background: "#FFFFFF", borderRadius: 10, padding: "20px 22px",
                border: "1px solid #E4E1D6", display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: "#EBF0F7",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icone size={20} color="#1E3A5F" />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#1C1F1B" }}>{f.titre}</h4>
                  <p style={{ fontSize: 12, color: "#6B6A60", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 20px 30px", borderTop: "1px solid #E4E1D6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <img src="/logo-ignisnova.jpg" alt="Ignis Nova" style={{ height: 24, objectFit: "contain" }} />
        </div>
        <p style={{ fontSize: 11, color: "#A6A399", margin: 0 }}>
          Actes360 est un produit Ignis Nova — Ignis Innovation
        </p>
      </div>

      {/* Modal Super Admin */}
      {showSuperAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSuperAdmin(false)}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={18} color="#1E3A5F" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F", margin: 0 }}>Administration plateforme</h3>
              </div>
              <button onClick={() => setShowSuperAdmin(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 16px" }}>
              Acces reserve a l'administrateur Ignis Nova.
            </p>
            <input
              type="password"
              value={codeSuperAdmin}
              onChange={(e) => { setCodeSuperAdmin(e.target.value); setErreurSuperAdmin(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSuperAdmin()}
              placeholder="Code administrateur"
              aria-label="Code administrateur plateforme"
              aria-invalid={erreurSuperAdmin ? "true" : undefined}
              autoComplete="off"
              style={{
                width: "100%", padding: "12px 16px", fontSize: 14, borderRadius: 8,
                border: erreurSuperAdmin ? "1.5px solid #DC2626" : "1.5px solid #E4E1D6",
                boxSizing: "border-box", marginBottom: 8,
              }}
            />
            {erreurSuperAdmin && <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 8px" }}>{erreurSuperAdmin}</p>}
            <button
              onClick={handleSuperAdmin}
              style={{
                width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: "#1E3A5F", color: "#FAFAF7", fontSize: 14, fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              Connexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
