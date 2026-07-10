import { useNavigate } from "react-router-dom";
import { MapPinOff, Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: 40,
        textAlign: "center",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#FEF3C7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <MapPinOff size={28} color="#92400E" />
      </div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1C1F1B",
          margin: "0 0 8px",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        Page non trouvee
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6B6A60",
          margin: "0 0 24px",
          maxWidth: 400,
          lineHeight: 1.6,
        }}
      >
        La page que vous recherchez n'existe pas ou a ete deplacee.
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 24px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          background: "#1E3A5F",
          color: "#FAFAF7",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        <Home size={14} />
        Retour a l'accueil
      </button>
    </div>
  );
}
