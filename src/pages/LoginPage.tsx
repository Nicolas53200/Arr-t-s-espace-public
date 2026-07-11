import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Building2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ROUTES } from "@/config/routes";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.accueil} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await login(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de connexion";
      setErreur(message);
      toast.error(message);
    } finally {
      setChargement(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAFAF7",
        fontFamily: "'IBM Plex Sans', sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#FFFFFF",
          borderRadius: 11,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: "40px 32px 32px",
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "#1E3A5F",
              borderRadius: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Building2 size={22} color="#FAFAF7" strokeWidth={1.75} />
          </div>
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6B6A60",
              margin: "0 0 2px",
            }}
          >
            Ville de Saint-Avoye
          </p>
          <p
            className="fd"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1C1F1B",
              margin: 0,
            }}
          >
            Arretes & Espace public
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#1C1F1B",
                marginBottom: 6,
              }}
            >
              Adresse e-mail
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                color="#6B6A60"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@collectivite.fr"
                required
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 34px",
                  fontSize: 13,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  border: "1px solid #E4E1D6",
                  borderRadius: 6,
                  background: "#FAFAF7",
                  color: "#1C1F1B",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "#1C1F1B",
                marginBottom: 6,
              }}
            >
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={15}
                color="#6B6A60"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 34px",
                  fontSize: 13,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  border: "1px solid #E4E1D6",
                  borderRadius: 6,
                  background: "#FAFAF7",
                  color: "#1C1F1B",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {erreur && (
            <p
              style={{
                color: "#DC2626",
                fontSize: 12,
                margin: "0 0 16px",
                textAlign: "center",
              }}
            >
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'IBM Plex Sans', sans-serif",
              background: chargement ? "#6B6A60" : "#1E3A5F",
              color: "#FAFAF7",
              border: "none",
              borderRadius: 6,
              cursor: chargement ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Demo hint */}
        <div
          style={{
            marginTop: 24,
            padding: "12px 14px",
            background: "#F5F3EE",
            borderRadius: 6,
            fontSize: 11,
            color: "#6B6A60",
            lineHeight: 1.5,
          }}
        >
          <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 11 }}>
            Comptes de demonstration
          </p>
          <p style={{ margin: 0 }}>admin@saint-avoye.fr / admin123</p>
          <p style={{ margin: 0 }}>redacteur@saint-avoye.fr / redac123</p>
          <p style={{ margin: 0 }}>lecteur@saint-avoye.fr / lect123</p>
        </div>
      </div>
    </div>
  );
}
