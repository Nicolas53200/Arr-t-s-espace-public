import { useState, useMemo } from "react";
import { Rss, FileJson, Code, Copy, Check, Globe, ExternalLink, FileText, MapPin, Calendar, Filter } from "lucide-react";
import { getArretesPublics, getCollectivites } from "@/lib/registre";
import { TYPES_IMPACT } from "@/data/types-impact";
import { useToast } from "@/contexts/ToastContext";

interface ArretePublicFlux {
  id: string;
  numero: string;
  titre: string;
  type_label: string;
  type_code: string;
  date_debut: string;
  date_fin: string;
  commune: string;
  commune_id: string;
  impact: string;
  impact_label: string;
  coordonnees: [number, number][];
  geometrie_type: string;
  voies: string[];
}

function convertirArretesFlux(): ArretePublicFlux[] {
  const arretesRaw = getArretesPublics();
  const resultats: ArretePublicFlux[] = [];

  for (const a of arretesRaw) {
    if (!a.troncons || a.troncons.length === 0) {
      // Arrêté sans tronçons → une seule entrée
      resultats.push({
        id: a.id,
        numero: a.numero,
        titre: a.titre,
        type_label: a.type_label,
        type_code: a.type_code,
        date_debut: a.date_debut,
        date_fin: a.date_fin,
        commune: a._commune_nom,
        commune_id: a.commune_id,
        impact: "circulation_interdite",
        impact_label: "Circulation interdite",
        coordonnees: [],
        geometrie_type: "LineString",
        voies: a.voies ?? [],
      });
      continue;
    }
    // Entrée par tronçon pour le GeoJSON
    for (const t of a.troncons) {
      const impactInfo = TYPES_IMPACT.find((ti) => ti.code === t.impact);
      resultats.push({
        id: `${a.id}_${t.voie_id}`,
        numero: a.numero,
        titre: a.titre,
        type_label: a.type_label,
        type_code: a.type_code,
        date_debut: a.date_debut,
        date_fin: a.date_fin,
        commune: a._commune_nom,
        commune_id: a.commune_id,
        impact: t.impact,
        impact_label: impactInfo?.label ?? t.impact,
        coordonnees: t.coordonnees ?? [],
        geometrie_type: t.geometrie_type ?? "LineString",
        voies: a.voies ?? [],
      });
    }
  }
  return resultats;
}

function getCommunes() {
  return getCollectivites()
    .filter((c) => c.active)
    .map((c) => ({
      id: c.id,
      nom: c.nom.replace(/^Ville de /i, ""),
      code_postal: c.code_postal,
    }));
}

function generateGeoJSON(arretes: ArretePublicFlux[]) {
  const withCoords = arretes.filter((a) => a.coordonnees.length >= 2);
  return JSON.stringify({
    type: "FeatureCollection",
    generated: new Date().toISOString(),
    source: "Actes360",
    licence: "Licence Ouverte v2.0 — Etalab",
    features: withCoords.map((a) => ({
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
        voies: a.voies,
      },
    })),
  }, null, 2);
}

function formatDateRSS(d: string): string {
  try {
    return new Date(d).toUTCString();
  } catch {
    return d;
  }
}

function generateRSS(arretes: ArretePublicFlux[], communeLabel: string) {
  // Dédupliquer par numéro d'arrêté pour le RSS (un item par arrêté, pas par tronçon)
  const parNumero = new Map<string, ArretePublicFlux>();
  for (const a of arretes) {
    if (!parNumero.has(a.numero)) parNumero.set(a.numero, a);
  }
  const uniques = Array.from(parNumero.values());

  const items = uniques.map((a) => {
    const geoPoint = a.coordonnees.length > 0
      ? `\n      <georss:point>${a.coordonnees[0]![1]} ${a.coordonnees[0]![0]}</georss:point>`
      : "";
    return `    <item>
      <title>${escapeXml(a.titre)}</title>
      <description>${escapeXml(`${a.impact_label} — ${a.type_label} (${a.commune})${a.voies.length > 0 ? ` — Voies : ${a.voies.join(", ")}` : ""}`)}</description>
      <link>https://actes360.fr/arrete/${a.id}</link>
      <pubDate>${formatDateRSS(a.date_debut)}</pubDate>
      <category>${escapeXml(a.type_code)}</category>
      <category>${escapeXml(a.impact)}</category>${geoPoint}
      <guid isPermaLink="false">urn:actes360:${a.id}</guid>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:georss="http://www.georss.org/georss" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Arretes municipaux actifs — ${escapeXml(communeLabel)}</title>
    <link>https://actes360.fr/carte-publique</link>
    <description>Flux des arretes municipaux actifs avec geolocalisation — Donnees ouvertes Actes360</description>
    <language>fr</language>
    <copyright>Licence Ouverte v2.0 — Etalab</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Actes360</generator>
    <docs>https://actes360.fr/flux</docs>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function formatDateFr(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export default function FluxPage() {
  const [onglet, setOnglet] = useState<"geojson" | "rss">("rss");
  const [communeId, setCommuneId] = useState<string>("");
  const [typeFiltre, setTypeFiltre] = useState<string>("");
  const [copie, setCopie] = useState(false);
  const toast = useToast();

  const tousArretes = useMemo(() => convertirArretesFlux(), []);
  const communes = useMemo(() => getCommunes(), []);

  // Types d'arrêtés distincts dans les données
  const typesDisponibles = useMemo(() => {
    const types = new Map<string, string>();
    for (const a of tousArretes) {
      if (!types.has(a.type_code)) types.set(a.type_code, a.type_label);
    }
    return Array.from(types.entries()).map(([code, label]) => ({ code, label }));
  }, [tousArretes]);

  const arretesFiltres = useMemo(() => {
    return tousArretes.filter((a) => {
      if (communeId && a.commune_id !== communeId) return false;
      if (typeFiltre && a.type_code !== typeFiltre) return false;
      return true;
    });
  }, [tousArretes, communeId, typeFiltre]);

  const communeLabel = communeId
    ? communes.find((c) => c.id === communeId)?.nom ?? "Inconnu"
    : "Inter-communes";

  const contenu = onglet === "geojson"
    ? generateGeoJSON(arretesFiltres)
    : generateRSS(arretesFiltres, communeLabel);

  // Dédupliquer les arrêtés par numéro pour la liste
  const arretesUniques = useMemo(() => {
    const parNumero = new Map<string, ArretePublicFlux>();
    for (const a of arretesFiltres) {
      if (!parNumero.has(a.numero)) parNumero.set(a.numero, a);
    }
    return Array.from(parNumero.values());
  }, [arretesFiltres]);

  function copier() {
    navigator.clipboard.writeText(contenu);
    setCopie(true);
    toast.success("Copie dans le presse-papiers");
    setTimeout(() => setCopie(false), 2000);
  }

  function telecharger() {
    const ext = onglet === "geojson" ? "geojson" : "xml";
    const mime = onglet === "geojson" ? "application/geo+json" : "application/rss+xml";
    const blob = new Blob([contenu], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arretes-${communeId || "toutes"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Fichier ${ext.toUpperCase()} telecharge`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #0F2440 100%)",
        color: "#FAFAF7", padding: "28px 24px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Donnees ouvertes — Arretes municipaux</h1>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                Actes360 · {arretesUniques.length} arrete{arretesUniques.length !== 1 ? "s" : ""} publie{arretesUniques.length !== 1 ? "s" : ""} · Licence Ouverte Etalab v2.0
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <a href="/carte-publique" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 14px", borderRadius: 7,
              background: "rgba(255,255,255,0.12)", color: "#FAFAF7",
              fontSize: 12, fontWeight: 500, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              <MapPin size={13} /> Carte publique <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
        {/* Use cases */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10, marginBottom: 24,
        }}>
          {[
            { titre: "Services d'urgence", desc: "SDIS, SAMU — itineraires temps reel", icon: "🚒" },
            { titre: "Navigation GPS", desc: "Waze, Google Maps, TomTom", icon: "🗺️" },
            { titre: "Transport public", desc: "Adaptation des circuits de bus", icon: "🚌" },
            { titre: "Open Data", desc: "data.gouv.fr, SIG departementaux", icon: "📊" },
            { titre: "Presse locale", desc: "Abonnement RSS pour les redactions", icon: "📰" },
            { titre: "Citoyens", desc: "Suivre les travaux pres de chez soi", icon: "🏠" },
          ].map((uc) => (
            <div key={uc.titre} style={{
              padding: "12px 14px",
              border: "1px solid #E4E1D6",
              borderRadius: 8,
              background: "#FFFFFF",
            }}>
              <span style={{ fontSize: 20 }}>{uc.icon}</span>
              <p style={{ margin: "4px 0 2px", fontSize: 12, fontWeight: 600, color: "#1C1F1B" }}>{uc.titre}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6B6A60", lineHeight: 1.3 }}>{uc.desc}</p>
            </div>
          ))}
        </div>

        {/* Filtres + sélecteur de format */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
          padding: "12px 16px", background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8,
        }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setOnglet("rss")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 6,
                border: onglet === "rss" ? "2px solid #1E3A5F" : "1px solid #E4E1D6",
                background: onglet === "rss" ? "#EBF0F7" : "#FFFFFF",
                cursor: "pointer", fontSize: 12, fontWeight: onglet === "rss" ? 600 : 400,
                color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <Rss size={13} /> RSS
            </button>
            <button
              onClick={() => setOnglet("geojson")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 6,
                border: onglet === "geojson" ? "2px solid #1E3A5F" : "1px solid #E4E1D6",
                background: onglet === "geojson" ? "#EBF0F7" : "#FFFFFF",
                cursor: "pointer", fontSize: 12, fontWeight: onglet === "geojson" ? 600 : 400,
                color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <FileJson size={13} /> GeoJSON
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Filter size={12} color="#6B6A60" />
            <select
              value={communeId}
              onChange={(e) => setCommuneId(e.target.value)}
              style={{
                padding: "6px 8px", fontSize: 12,
                border: "1px solid #E4E1D6", borderRadius: 5,
                background: "#FAFAF7", color: "#1C1F1B",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <option value="">Toutes les communes</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          {typesDisponibles.length > 0 && (
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
              style={{
                padding: "6px 8px", fontSize: 12,
                border: "1px solid #E4E1D6", borderRadius: 5,
                background: "#FAFAF7", color: "#1C1F1B",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <option value="">Tous les types</option>
              {typesDisponibles.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button
              onClick={telecharger}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 5,
                background: "#FFFFFF", color: "#1E3A5F", border: "1px solid #1E3A5F",
                cursor: "pointer", fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <FileText size={12} /> Telecharger
            </button>
            <button
              onClick={copier}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 5,
                background: copie ? "#2F6B4F" : "#1E3A5F",
                color: "#FAFAF7", border: "none",
                cursor: "pointer", fontSize: 11, fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {copie ? <Check size={12} /> : <Copy size={12} />}
              {copie ? "Copie !" : "Copier"}
            </button>
          </div>
        </div>

        {/* URL endpoint */}
        <div style={{
          padding: "10px 14px", marginBottom: 16,
          background: "#1C1F1B", borderRadius: 6,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11, color: "#A5D6A7",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Code size={12} />
          <span>
            GET /api/public/{onglet === "geojson" ? "geojson" : "rss"}
            {communeId ? `?commune=${communeId}` : ""}
            {typeFiltre ? `${communeId ? "&" : "?"}type=${typeFiltre}` : ""}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>
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
              maxHeight: 500,
            }}>
              {contenu}
            </pre>
          </div>

          {/* Liste des arrêtés publics */}
          <div>
            <div style={{
              padding: "12px 14px",
              background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8,
              marginBottom: 12,
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B", display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={13} color="#1E3A5F" /> Arretes publies ({arretesUniques.length})
              </p>
              {arretesUniques.length === 0 && (
                <p style={{ fontSize: 11, color: "#A6A399", margin: 0, fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                  Aucun arrete publie pour le moment. Les arretes apparaissent ici apres publication par une commune.
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {arretesUniques.map((a) => {
                  const couleur = TYPES_IMPACT.find((ti) => ti.code === a.impact)?.couleur ?? "#6B6A60";
                  return (
                    <div key={a.id} style={{
                      padding: "10px 12px",
                      border: "1px solid #F0EDE4", borderRadius: 7,
                      borderLeft: `3px solid ${couleur}`,
                      background: "#FAFAF7",
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9, color: "#6B6A60", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {a.commune} · {a.numero}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500, color: "#1C1F1B" }}>
                        {a.titre}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 9, padding: "1px 6px", borderRadius: 10,
                          background: `${couleur}15`, color: couleur, fontWeight: 600,
                        }}>
                          {a.impact_label}
                        </span>
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "#EDEAE0", color: "#6B6A60", fontWeight: 500 }}>
                          {a.type_label}
                        </span>
                        <span style={{ fontSize: 9, color: "#A6A399", display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={8} /> {formatDateFr(a.date_debut)} → {formatDateFr(a.date_fin)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info RSS reader */}
            <div style={{
              padding: "12px 14px",
              background: "#EBF0F7", border: "1px solid #BFCFDF", borderRadius: 8,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "#1E3A5F" }}>
                <Rss size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                S'abonner au flux RSS
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#6B6A60", lineHeight: 1.4 }}>
                Copiez l'URL RSS dans votre lecteur de flux (Feedly, Thunderbird, Outlook...) pour recevoir automatiquement les nouveaux arretes.
              </p>
              <div style={{
                padding: "6px 10px", background: "#FFFFFF", borderRadius: 5,
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1E3A5F",
                wordBreak: "break-all",
              }}>
                https://actes360.fr/api/public/rss{communeId ? `?commune=${communeId}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Integration examples */}
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1C1F1B", marginBottom: 12 }}>
            Exemples d'integration
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            <div style={{ padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>Leaflet / OpenLayers</p>
              <pre style={{
                margin: 0, padding: "10px 12px", background: "#1C1F1B", borderRadius: 6,
                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#A5D6A7",
                overflow: "auto",
              }}>{`fetch('/api/public/geojson')
  .then(r => r.json())
  .then(data => {
    L.geoJSON(data, {
      style: f => ({
        color: impactColor(f.properties.impact),
        weight: 4
      })
    }).addTo(map);
  });`}</pre>
            </div>
            <div style={{ padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>QGIS / SIG communal</p>
              <pre style={{
                margin: 0, padding: "10px 12px", background: "#1C1F1B", borderRadius: 6,
                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#A5D6A7",
                overflow: "auto",
              }}>{`Couche > Ajouter une couche
  > Vecteur > Protocol: GeoJSON
URL: https://actes360.fr
     /api/public/geojson
     ?commune=tenant_saint_avoye`}</pre>
            </div>
            <div style={{ padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>Python / data.gouv.fr</p>
              <pre style={{
                margin: 0, padding: "10px 12px", background: "#1C1F1B", borderRadius: 6,
                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "#A5D6A7",
                overflow: "auto",
              }}>{`import geopandas as gpd

gdf = gpd.read_file(
  "https://actes360.fr"
  "/api/public/geojson"
)
gdf.plot(column="impact")`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
