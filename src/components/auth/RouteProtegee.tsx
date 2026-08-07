import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { ROUTES } from "@/config/routes";
import { getCollectivites } from "@/lib/registre";
import type { Role } from "@/types";

interface RouteProtegeeProps {
  roles?: Role[];
}

export default function RouteProtegee({ roles }: RouteProtegeeProps) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF7",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si aucune collectivité n'existe et aucun tenant sélectionné,
    // diriger vers la page d'accueil plutôt que le login
    const hasTenant = localStorage.getItem("acces_tenant");
    if (!hasTenant && getCollectivites().length === 0) {
      return <Navigate to="/bienvenue" replace />;
    }
    return <Navigate to={ROUTES.login} replace />;
  }

  if (roles && role && !roles.includes(role)) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'IBM Plex Sans', sans-serif",
          gap: 12,
          padding: 32,
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, color: "#1C1F1B", margin: 0 }}>
          Acces non autorise
        </p>
        <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>
          Vous n&apos;avez pas les droits necessaires pour acceder a cette page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
