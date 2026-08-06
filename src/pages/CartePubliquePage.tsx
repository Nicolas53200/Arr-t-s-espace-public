import { useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Globe, Filter, Rss, FileJson, ChevronDown, AlertTriangle, Search, X, MapPin } from "lucide-react";
import { getArretesPublics, getCollectivites } from "@/lib/registre";
import { TYPES_IMPACT } from "@/data/types-impact";
import type { Feature, Geometry, GeoJsonProperties, FeatureCollection } from "geojson";

// ──── Types ────

interface ArretePublicDyn {
  id: string;
  numero: string;
  titre: string;
  type_label: string;
  type_code: string;
  date_debut: string;
  date_fin: string;
  impact: string;
  impact_label: string;
  commune: string;
  commune_id: string;
  coordonnees: [number, number][];
  geometrie_type: "LineString" | "Polygon";
}

interface CommuneDyn {
  id: string;
  nom: string;
  code_postal: string;
  centre: [number, number] | null;
}

// ──── Couleurs & labels ────

const IMPACT_COULEURS: Record<string, string> = {};
const IMPACT_LABELS: Record<string, string> = {};
for (const t of TYPES_IMPACT) {
  IMPACT_COULEURS[t.code] = t.couleur;
  IMPACT_LABELS[t.code] = t.label;
}

const CENTRE_DEPARTEMENT: [number, number] = [47.7000, -3.0600];

// ──── Convertir les arrêtés du registre en données cartographiques ────

function convertirArretesPublics(): { arretes: ArretePublicDyn[]; communes: CommuneDyn[] } {
  const arretesRaw = getArretesPublics();
  const arretes: ArretePublicDyn[] = [];
  const communesMap = new Map<string, CommuneDyn>();

  for (const a of arretesRaw) {
    // Chaque tronçon avec des coordonnées devient une entrée sur la carte
    if (a.troncons && a.troncons.length > 0) {
      for (const t of a.troncons) {
        if (!t.coordonnees || t.coordonnees.length < 2) continue;
        arretes.push({
          id: `${a.id}_${t.voie_id}`,
          numero: a.numero,
          titre: a.titre,
          type_label: a.type_label,
          type_code: a.type_code,
          date_debut: a.date_debut,
          date_fin: a.date_fin,
          impact: t.impact,
          impact_label: IMPACT_LABELS[t.impact] ?? t.impact,
          commune: a._commune_nom,
          commune_id: a.commune_id,
          coordonnees: t.coordonnees,
          geometrie_type: t.geometrie_type ?? "LineString",
        });
      }
    }

    // Enregistrer la commune
    if (!communesMap.has(a.commune_id)) {
      // Calculer un centre approximatif à partir des tronçons
      let centre: [number, number] | null = null;
      const coords = a.troncons?.flatMap((t) => t.coordonnees ?? []) ?? [];
      if (coords.length > 0) {
        const sumLat = coords.reduce((s, c) => s + c[1], 0);
        const sumLng = coords.reduce((s, c) => s + c[0], 0);
        centre = [sumLat / coords.length, sumLng / coords.length];
      }
      communesMap.set(a.commune_id, {
        id: a.commune_id,
        nom: a._commune_nom,
        code_postal: a._commune_code_postal,
        centre,
      });
    } else if (!communesMap.get(a.commune_id)!.centre) {
      // Mettre à jour le centre si on a des coordonnées maintenant
      const coords = a.troncons?.flatMap((t) => t.coordonnees ?? []) ?? [];
      if (coords.length > 0) {
        const sumLat = coords.reduce((s, c) => s + c[1], 0);
        const sumLng = coords.reduce((s, c) => s + c[0], 0);
        communesMap.get(a.commune_id)!.centre = [sumLat / coords.length, sumLng / coords.length];
      }
    }
  }

  // Ajouter aussi les communes sans arrêtés publiés (pour les montrer comme participantes)
  const collectivites = getCollectivites().filter((c) => c.active);
  for (const c of collectivites) {
    if (!communesMap.has(c.id)) {
      communesMap.set(c.id, {
        id: c.id,
        nom: c.nom.replace(/^Ville de /i, ""),
        code_postal: c.code_postal,
        centre: null,
      });
    }
  }

  return { arretes, communes: Array.from(communesMap.values()) };
}

// ──── Composants carte ────

function communeIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:#1E3A5F;color:#fff;border-radius:50%;width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;font-size:13px;
      font-weight:700;font-family:'IBM Plex Mono',monospace;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid #fff;
    ">${count}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

function MapFlyTo({ position, zoom }: { position: [number, number] | null; zoom: number }) {
  const map = useMap();
  useMemo(() => {
    if (position) map.flyTo(position, zoom, { duration: 1.2 });
  }, [map, position, zoom]);
  return null;
}

function SearchBar({ onSelect }: { onSelect: (lat: number, lng: number, label: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function doSearch(q: string) {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const bounded = `${q}, France`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(bounded)}`)
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        setResults(data);
        setOpen(data.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 400);
  }

  function pick(r: SearchResult) {
    onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
    setQuery(r.display_name.split(",")[0] ?? "");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#FAFAF7", border: "1px solid #E4E1D6", borderRadius: 6,
        padding: "6px 10px",
      }}>
        <Search size={14} color="#6B6A60" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Rechercher une rue, adresse..."
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: 12, color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} style={{
            border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex",
          }}>
            <X size={12} color="#6B6A60" />
          </button>
        )}
        {searching && <span style={{ fontSize: 10, color: "#6B6A60" }}>...</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "#FFFFFF", border: "1px solid #E4E1D6", borderTop: "none",
          borderRadius: "0 0 6px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: 200, overflowY: "auto",
        }}>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => pick(r)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 6, width: "100%",
                padding: "8px 10px", border: "none", borderBottom: "1px solid #F0EDE4",
                background: "transparent", cursor: "pointer", textAlign: "left",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <MapPin size={12} color="#1E3A5F" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, color: "#1C1F1B", lineHeight: 1.3 }}>
                {r.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ──── Page principale ────

export default function CartePubliquePage() {
  const [communeFiltre, setCommuneFiltre] = useState<string | null>(null);
  const [impactFiltre, setImpactFiltre] = useState<string | null>(null);
  const [panneauOuvert, setPanneauOuvert] = useState(true);
  const [searchTarget, setSearchTarget] = useState<{ pos: [number, number]; label: string } | null>(null);

  // Charger dynamiquement depuis le registre
  const { arretes: tousArretes, communes } = useMemo(() => convertirArretesPublics(), []);

  const arretesFiltres = useMemo(() => {
    return tousArretes.filter((a) => {
      if (communeFiltre && a.commune_id !== communeFiltre) return false;
      if (impactFiltre && a.impact !== impactFiltre) return false;
      return true;
    });
  }, [tousArretes, communeFiltre, impactFiltre]);

  const communesAvecArretes = useMemo(
    () => communes.filter((c) => c.centre !== null),
    [communes],
  );

  const featureCollection: FeatureCollection = useMemo(() => ({
    type: "FeatureCollection",
    features: arretesFiltres.map((a) => ({
      type: "Feature" as const,
      geometry: a.geometrie_type === "Polygon"
        ? { type: "Polygon" as const, coordinates: [a.coordonnees] }
        : { type: "LineString" as const, coordinates: a.coordonnees },
      properties: { ...a },
    })),
  }), [arretesFiltres]);

  const geoKey = useMemo(() =>
    arretesFiltres.map((a) => a.id).join(",") + (communeFiltre ?? "") + (impactFiltre ?? ""),
    [arretesFiltres, communeFiltre, impactFiltre]
  );

  const style = useCallback((feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
    if (!feature) return {};
    const props = feature.properties as ArretePublicDyn;
    const couleur = IMPACT_COULEURS[props.impact] ?? "#6B6A60";
    const isPolygon = feature.geometry.type === "Polygon";
    return {
      color: couleur,
      weight: 5,
      opacity: 0.85,
      fillColor: isPolygon ? couleur : undefined,
      fillOpacity: isPolygon ? 0.25 : 0,
      lineCap: "round" as const,
      lineJoin: "round" as const,
    };
  }, []);

  const onEachFeature = useCallback((feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
    const p = feature.properties as ArretePublicDyn;
    const couleur = IMPACT_COULEURS[p.impact] ?? "#6B6A60";
    layer.bindPopup(`
      <div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;max-width:240px;">
        <div style="font-size:9px;color:#6B6A60;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${p.commune}</div>
        <strong style="font-size:13px;color:#1C1F1B;">${p.titre}</strong>
        <div style="margin-top:6px;display:flex;align-items:center;gap:5px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${couleur};display:inline-block;"></span>
          <span style="font-size:11px;font-weight:600;color:${couleur};">${p.impact_label}</span>
        </div>
        <div style="margin-top:4px;font-size:10px;color:#6B6A60;">
          ${p.numero} · ${p.type_label}
        </div>
        <div style="margin-top:2px;font-size:10px;color:#A6A399;">
          ${p.date_debut} → ${p.date_fin}
        </div>
      </div>
    `, { maxWidth: 280 });
  }, []);

  const centre = useMemo(() => {
    if (communeFiltre) {
      const c = communesAvecArretes.find((c) => c.id === communeFiltre);
      return c?.centre ?? CENTRE_DEPARTEMENT;
    }
    return CENTRE_DEPARTEMENT;
  }, [communeFiltre, communesAvecArretes]);

  const zoom = communeFiltre ? 16 : 11;

  const isEmpty = tousArretes.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header public */}
      <header style={{
        background: "#1E3A5F",
        color: "#FAFAF7",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Globe size={20} />
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Carte des arretes — Inter-communes
            </h1>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>
              Donnees ouvertes · Actes360 · {tousArretes.length} arrete{tousArretes.length > 1 ? "s" : ""} publie{tousArretes.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/api/public/rss"
            target="_blank"
            rel="noopener"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 6,
              background: "rgba(255,255,255,0.15)", color: "#FAFAF7",
              fontSize: 11, fontWeight: 500, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <Rss size={13} /> Flux RSS
          </a>
          <a
            href="/api/public/geojson"
            target="_blank"
            rel="noopener"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 6,
              background: "rgba(255,255,255,0.15)", color: "#FAFAF7",
              fontSize: 11, fontWeight: 500, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <FileJson size={13} /> GeoJSON
          </a>
        </div>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
        {/* Side panel */}
        <div style={{
          width: panneauOuvert ? 340 : 0,
          overflow: "hidden",
          transition: "width 0.2s",
          background: "#FFFFFF",
          borderRight: "1px solid #E4E1D6",
          display: "flex",
          flexDirection: "column",
        }}>
          {panneauOuvert && (
            <>
              {/* Search */}
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0EDE4" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Search size={14} color="#1E3A5F" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>Rechercher une rue</span>
                </div>
                <SearchBar onSelect={(lat, lng, label) => {
                  setSearchTarget({ pos: [lat, lng], label });
                  setCommuneFiltre(null);
                }} />
                {searchTarget && (
                  <div style={{
                    marginTop: 8, padding: "6px 10px", background: "#EBF0F7",
                    borderRadius: 6, display: "flex", alignItems: "center", gap: 6,
                    fontSize: 10, color: "#1E3A5F",
                  }}>
                    <MapPin size={10} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {searchTarget.label.split(",")[0]}
                    </span>
                    <button onClick={() => setSearchTarget(null)} style={{
                      border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex",
                    }}>
                      <X size={10} color="#1E3A5F" />
                    </button>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #F0EDE4" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Filter size={14} color="#1E3A5F" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1F1B" }}>Filtres</span>
                </div>

                <label style={{ fontSize: 11, color: "#6B6A60", display: "block", marginBottom: 4 }}>Commune</label>
                <select
                  value={communeFiltre ?? ""}
                  onChange={(e) => setCommuneFiltre(e.target.value || null)}
                  style={{
                    width: "100%", padding: "7px 10px", fontSize: 12,
                    border: "1px solid #E4E1D6", borderRadius: 6,
                    background: "#FAFAF7", color: "#1C1F1B",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    marginBottom: 10,
                  }}
                >
                  <option value="">Toutes les communes</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom} ({c.code_postal})</option>
                  ))}
                </select>

                <label style={{ fontSize: 11, color: "#6B6A60", display: "block", marginBottom: 4 }}>Type d'impact</label>
                <select
                  value={impactFiltre ?? ""}
                  onChange={(e) => setImpactFiltre(e.target.value || null)}
                  style={{
                    width: "100%", padding: "7px 10px", fontSize: 12,
                    border: "1px solid #E4E1D6", borderRadius: 6,
                    background: "#FAFAF7", color: "#1C1F1B",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  <option value="">Tous les impacts</option>
                  {Object.entries(IMPACT_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Communes summary */}
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #F0EDE4" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1C1F1B", margin: "0 0 8px" }}>
                  Communes participantes ({communes.length})
                </p>
                {communes.length === 0 ? (
                  <p style={{ fontSize: 11, color: "#A6A399", margin: 0, fontStyle: "italic" }}>
                    Aucune commune inscrite sur la plateforme.
                  </p>
                ) : (
                  communes.map((c) => {
                    const count = tousArretes.filter((a) => a.commune_id === c.id).length;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCommuneFiltre(communeFiltre === c.id ? null : c.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", padding: "8px 10px", marginBottom: 4,
                          background: communeFiltre === c.id ? "#EBF0F7" : "transparent",
                          border: communeFiltre === c.id ? "1px solid #1E3A5F" : "1px solid #F0EDE4",
                          borderRadius: 6, cursor: "pointer",
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      >
                        <div style={{ textAlign: "left" }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#1C1F1B" }}>{c.nom}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#6B6A60" }}>{c.code_postal}</p>
                        </div>
                        <span style={{
                          background: count > 0 ? "#1E3A5F" : "#D8D5C8",
                          color: count > 0 ? "#fff" : "#6B6A60",
                          borderRadius: 10,
                          fontSize: 10, padding: "2px 8px",
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Arretes list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1C1F1B", margin: "0 0 8px" }}>
                  {arretesFiltres.length} arrete{arretesFiltres.length > 1 ? "s" : ""} publie{arretesFiltres.length > 1 ? "s" : ""}
                </p>
                {isEmpty && (
                  <div style={{ textAlign: "center", padding: "20px 10px" }}>
                    <Globe size={24} color="#A6A399" style={{ marginBottom: 8, opacity: 0.5 }} />
                    <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 4px", fontWeight: 500 }}>Aucun arrêté publié</p>
                    <p style={{ fontSize: 11, color: "#A6A399", margin: 0, lineHeight: 1.4 }}>
                      Les arrêtés apparaissent ici automatiquement quand une commune les publie.
                    </p>
                  </div>
                )}
                {arretesFiltres.map((a) => {
                  const couleur = IMPACT_COULEURS[a.impact] ?? "#6B6A60";
                  return (
                    <div key={a.id} style={{
                      padding: "10px 12px", marginBottom: 6,
                      border: "1px solid #F0EDE4", borderRadius: 8,
                      borderLeft: `3px solid ${couleur}`,
                      background: "#FAFAF7",
                    }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9, color: "#6B6A60", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {a.commune} · {a.numero}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500, color: "#1C1F1B" }}>
                        {a.titre}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 9, padding: "1px 6px", borderRadius: 10,
                          background: `${couleur}15`, color: couleur, fontWeight: 600,
                        }}>
                          {a.impact_label}
                        </span>
                        <span style={{ fontSize: 9, color: "#A6A399" }}>
                          {a.date_debut} → {a.date_fin}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info SDIS */}
              <div style={{
                padding: "12px 18px",
                background: "#FEF3C7",
                borderTop: "1px solid #F59E0B",
                display: "flex", gap: 8, alignItems: "flex-start",
              }}>
                <AlertTriangle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#92400E" }}>
                    Services d'urgence
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#78350F", lineHeight: 1.4 }}>
                    Flux GeoJSON et RSS disponibles pour integration dans vos systemes de navigation et de dispatch.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle panel button */}
        <button
          onClick={() => setPanneauOuvert((o) => !o)}
          style={{
            position: "absolute", left: panneauOuvert ? 340 : 0, top: 60,
            zIndex: 10, background: "#FFFFFF", border: "1px solid #E4E1D6",
            borderLeft: "none", borderRadius: "0 6px 6px 0",
            padding: "8px 4px", cursor: "pointer", transition: "left 0.2s",
          }}
        >
          <ChevronDown size={14} style={{ transform: panneauOuvert ? "rotate(90deg)" : "rotate(-90deg)" }} />
        </button>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            key={`${centre[0]}-${centre[1]}-${zoom}`}
            center={centre}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Commune markers when zoomed out */}
            {!communeFiltre && communesAvecArretes.map((c) => {
              const count = arretesFiltres.filter((a) => a.commune_id === c.id).length;
              if (count === 0 || !c.centre) return null;
              return (
                <Marker
                  key={c.id}
                  position={c.centre}
                  icon={communeIcon(count)}
                  eventHandlers={{ click: () => setCommuneFiltre(c.id) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}>
                      <strong>{c.nom}</strong>
                      <br />{count} arrete{count > 1 ? "s" : ""} publie{count > 1 ? "s" : ""}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {featureCollection.features.length > 0 && (
              <GeoJSON
                key={geoKey}
                data={featureCollection}
                style={style}
                onEachFeature={onEachFeature}
              />
            )}

            <MapFlyTo position={searchTarget?.pos ?? null} zoom={17} />

            {searchTarget && (
              <Marker
                position={searchTarget.pos}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="
                    width:12px;height:12px;border-radius:50%;background:#2563EB;
                    border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);
                  "></div>`,
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                })}
              >
                <Popup>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}>
                    {searchTarget.label.split(",").slice(0, 2).join(",")}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Legend overlay */}
          <div style={{
            position: "absolute", bottom: 24, right: 16, zIndex: 10,
            background: "rgba(255,255,255,0.95)", borderRadius: 8,
            padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            border: "1px solid #E4E1D6",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "#1C1F1B" }}>Legende</p>
            {Object.entries(IMPACT_COULEURS).map(([code, color]) => (
              <div key={code} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ width: 16, height: 4, background: color, borderRadius: 2, display: "inline-block" }} />
                <span style={{ fontSize: 10, color: "#6B6A60" }}>{IMPACT_LABELS[code]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
