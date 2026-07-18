import { useState } from "react";
import { Rss, FileJson, Code, Copy, Check, Globe, ExternalLink } from "lucide-react";
import { ARRETES_PUBLICS, COMMUNES } from "@/data/communes-publiques";
import { useToast } from "@/contexts/ToastContext";

function generateGeoJSON(communeId?: string) {
  const arretes = communeId
    ? ARRETES_PUBLICS.filter((a) => a.commune_id === communeId)
    : ARRETES_PUBLICS;

  return JSON.stringify({
    type: "FeatureCollection",
    generated: new Date().toISOString(),
    source: "Actes360",
    features: arretes.map((a) => ({
      type: "Feature",
      geometry: a.geometrie_type === "Polygon"
        ? { type: "Polygon", coordinates: [a.coordonnees] }
        : { type: "LineString", coordinates: a.coordonnees },
      properties: {
        id: a.id,
        numero: a.numero,
        titre: a.titre,
        type: a.type_label,
        impact: a.impact_label,
        commune: a.commune,
        date_debut: a.date_debut,
        date_fin: a.date_fin,
      },
    })),
  }, null, 2);
}

function generateRSS(communeId?: string) {
  const arretes = communeId
    ? ARRETES_PUBLICS.filter((a) => a.commune_id === communeId)
    : ARRETES_PUBLICS;

  const commune = communeId
    ? COMMUNES.find((c) => c.id === communeId)?.nom ?? "Inconnu"
    : "Morbihan";

  const items = arretes.map((a) => `    <item>
      <title>${a.titre}</title>
      <description>${a.impact_label} — ${a.type_label} (${a.commune})</description>
      <link>https://actes360.fr/carte-publique?arrete=${a.id}</link>
      <pubDate>${new Date(a.date_debut).toUTCString()}</pubDate>
      <category>${a.type_code}</category>
      <georss:point>${a.coordonnees[0]?.[1]} ${a.coordonnees[0]?.[0]}</georss:point>
      <guid>urn:actes360:${a.id}</guid>
    </item>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:georss="http://www.georss.org/georss">
  <channel>
    <title>Arretes actifs — ${commune}</title>
    <link>https://actes360.fr/carte-publique</link>
    <description>Flux des arretes municipaux actifs avec geolocalisation</description>
    <language>fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Actes360</generator>
${items}
  </channel>
</rss>`;
}

export default function FluxPage() {
  const [onglet, setOnglet] = useState<"geojson" | "rss">("geojson");
  const [communeId, setCommuneId] = useState<string>("");
  const [copie, setCopie] = useState(false);
  const toast = useToast();

  const contenu = onglet === "geojson"
    ? generateGeoJSON(communeId || undefined)
    : generateRSS(communeId || undefined);

  function copier() {
    navigator.clipboard.writeText(contenu);
    setCopie(true);
    toast.success("Copie dans le presse-papiers");
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Globe size={24} color="#1E3A5F" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1C1F1B" }}>
            Flux de donnees ouvertes
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>
          Integrez les arretes actifs dans vos systemes via les flux GeoJSON et RSS.
        </p>
      </div>

      {/* Use cases */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginBottom: 28,
      }}>
        {[
          { titre: "Services d'urgence", desc: "SDIS, SAMU — itineraires en temps reel", icon: "🚒" },
          { titre: "Navigation GPS", desc: "Waze, Google Maps, TomTom", icon: "🗺️" },
          { titre: "Transport public", desc: "Bus, cars scolaires — adaptation des circuits", icon: "🚌" },
          { titre: "Open Data", desc: "Portail data.gouv.fr, SIG departementaux", icon: "📊" },
        ].map((uc) => (
          <div key={uc.titre} style={{
            padding: "14px 16px",
            border: "1px solid #E4E1D6",
            borderRadius: 8,
            background: "#FFFFFF",
          }}>
            <span style={{ fontSize: 22 }}>{uc.icon}</span>
            <p style={{ margin: "6px 0 2px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>{uc.titre}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6B6A60" }}>{uc.desc}</p>
          </div>
        ))}
      </div>

      {/* Carte publique link */}
      <a
        href="/carte-publique"
        target="_blank"
        rel="noopener"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 18px", marginBottom: 24,
          background: "#EBF0F7", borderRadius: 8,
          border: "1px solid #1E3A5F",
          textDecoration: "none", color: "#1E3A5F",
          fontSize: 13, fontWeight: 600,
        }}
      >
        <Globe size={16} />
        Voir la carte publique inter-communes
        <ExternalLink size={13} style={{ marginLeft: "auto" }} />
      </a>

      {/* Flux selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setOnglet("geojson")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 16px", borderRadius: 6,
              border: onglet === "geojson" ? "2px solid #1E3A5F" : "1px solid #E4E1D6",
              background: onglet === "geojson" ? "#EBF0F7" : "#FFFFFF",
              cursor: "pointer", fontSize: 12, fontWeight: onglet === "geojson" ? 600 : 400,
              color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <FileJson size={14} /> GeoJSON
          </button>
          <button
            onClick={() => setOnglet("rss")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 16px", borderRadius: 6,
              border: onglet === "rss" ? "2px solid #1E3A5F" : "1px solid #E4E1D6",
              background: onglet === "rss" ? "#EBF0F7" : "#FFFFFF",
              cursor: "pointer", fontSize: 12, fontWeight: onglet === "rss" ? 600 : 400,
              color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Rss size={14} /> RSS
          </button>
        </div>

        <select
          value={communeId}
          onChange={(e) => setCommuneId(e.target.value)}
          style={{
            padding: "7px 10px", fontSize: 12,
            border: "1px solid #E4E1D6", borderRadius: 6,
            background: "#FAFAF7", color: "#1C1F1B",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          <option value="">Toutes les communes</option>
          {COMMUNES.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <button
          onClick={copier}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 6,
            background: copie ? "#2F6B4F" : "#1E3A5F",
            color: "#FAFAF7", border: "none",
            cursor: "pointer", fontSize: 12, fontWeight: 500,
            fontFamily: "'IBM Plex Sans', sans-serif",
            marginLeft: "auto",
          }}
        >
          {copie ? <Check size={13} /> : <Copy size={13} />}
          {copie ? "Copie !" : "Copier"}
        </button>
      </div>

      {/* URL */}
      <div style={{
        padding: "10px 14px", marginBottom: 12,
        background: "#F5F3EE", borderRadius: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11, color: "#1E3A5F",
        wordBreak: "break-all",
      }}>
        <Code size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
        {onglet === "geojson"
          ? `GET /api/public/geojson${communeId ? `?commune=${communeId}` : ""}`
          : `GET /api/public/rss${communeId ? `?commune=${communeId}` : ""}`
        }
      </div>

      {/* Code preview */}
      <div style={{
        borderRadius: 8,
        border: "1px solid #E4E1D6",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "8px 14px",
          background: "#1C1F1B",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <span style={{ fontSize: 10, color: "#6B6A60", marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
            {onglet === "geojson" ? "arretes.geojson" : "arretes.rss.xml"}
          </span>
        </div>
        <pre style={{
          margin: 0,
          padding: "16px 20px",
          background: "#1C1F1B",
          color: "#D4D4C8",
          fontSize: 11,
          lineHeight: 1.5,
          fontFamily: "'IBM Plex Mono', monospace",
          overflow: "auto",
          maxHeight: 400,
        }}>
          {contenu}
        </pre>
      </div>

      {/* Integration examples */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1F1B", marginBottom: 12 }}>
          Exemples d'integration
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          <div style={{ padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>Leaflet / OpenLayers</p>
            <pre style={{
              margin: 0, padding: "10px 12px", background: "#F5F3EE", borderRadius: 6,
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#1C1F1B",
              overflow: "auto",
            }}>{`fetch('/api/public/geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data).addTo(map);
  });`}</pre>
          </div>
          <div style={{ padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>QGIS / SIG</p>
            <pre style={{
              margin: 0, padding: "10px 12px", background: "#F5F3EE", borderRadius: 6,
              fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#1C1F1B",
              overflow: "auto",
            }}>{`Couche > Ajouter une couche
  > Vecteur > Protocol: GeoJSON
URL: https://actes360.fr
     /api/public/geojson`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
