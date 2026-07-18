import { useState, useCallback, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Pencil, Pentagon, MousePointer, Trash2, Check, Search, X, MapPin, Undo2 } from "lucide-react";
import { TYPES_IMPACT } from "@/data/types-impact";
import type { CodeImpact, Troncon } from "@/types";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

type DrawMode = "select" | "line" | "polygon";

interface Props {
  troncons: Troncon[];
  onAdd: (t: Troncon) => void;
  onRemove: (idx: number) => void;
  onUpdateImpact: (idx: number, impact: CodeImpact) => void;
  centre?: [number, number];
}

const IMPACT_COULEURS: Record<string, string> = {};
for (const t of TYPES_IMPACT) IMPACT_COULEURS[t.code] = t.couleur;

function couleur(impact: string): string {
  return IMPACT_COULEURS[impact] ?? "#6B6A60";
}

function vertexIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function MapFlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useMemo(() => {
    if (position) map.flyTo(position, 17, { duration: 1 });
  }, [map, position]);
  return null;
}

function DrawHandler({
  mode,
  points,
  setPoints,
  impact,
  onFinish,
}: {
  mode: DrawMode;
  points: [number, number][];
  setPoints: (p: [number, number][]) => void;
  impact: CodeImpact;
  onFinish: (pts: [number, number][], type: "LineString" | "Polygon") => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === "select") return;
      const pt: [number, number] = [e.latlng.lng, e.latlng.lat];
      setPoints([...points, pt]);
    },
    dblclick(e) {
      if (mode === "select" || points.length < 2) return;
      e.originalEvent.preventDefault();
      const geoType = mode === "polygon" ? "Polygon" : "LineString";
      let finalPts = [...points];
      if (mode === "polygon" && finalPts.length >= 3) {
        finalPts = [...finalPts, finalPts[0]!];
      }
      onFinish(finalPts, geoType);
    },
  });

  const col = couleur(impact);
  const latLngs = points.map((p) => [p[1], p[0]] as [number, number]);

  return (
    <>
      {points.length >= 2 && mode === "line" && (
        <Polyline positions={latLngs} pathOptions={{ color: col, weight: 5, opacity: 0.8, dashArray: "8 6" }} />
      )}
      {points.length >= 3 && mode === "polygon" && (
        <Polygon positions={latLngs} pathOptions={{ color: col, weight: 4, opacity: 0.8, fillColor: col, fillOpacity: 0.2, dashArray: "8 6" }} />
      )}
      {points.map((p, i) => (
        <Marker key={i} position={[p[1], p[0]]} icon={vertexIcon(col)} />
      ))}
    </>
  );
}

function SearchBar({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function doSearch(q: string) {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q + ", France")}`)
      .then((r) => r.json())
      .then((data: SearchResult[]) => { setResults(data); setOpen(data.length > 0); })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 400);
  }

  function pick(r: SearchResult) {
    onSelect(parseFloat(r.lat), parseFloat(r.lon));
    setQuery(r.display_name.split(",")[0] ?? "");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAFAF7", border: "1px solid #E4E1D6", borderRadius: 6, padding: "6px 10px" }}>
        <Search size={13} color="#6B6A60" />
        <input type="text" value={query} onChange={(e) => handleChange(e.target.value)} placeholder="Rechercher une rue..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 11, color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif" }} />
        {query && <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={11} color="#6B6A60" /></button>}
        {searching && <span style={{ fontSize: 9, color: "#6B6A60" }}>...</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1px solid #E4E1D6", borderTop: "none", borderRadius: "0 0 6px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 180, overflowY: "auto" }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => pick(r)} style={{ display: "flex", alignItems: "flex-start", gap: 5, width: "100%", padding: "7px 10px", border: "none", borderBottom: "1px solid #F0EDE4", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <MapPin size={11} color="#1E3A5F" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 10, color: "#1C1F1B", lineHeight: 1.3 }}>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CarteDessin({ troncons, onAdd, onRemove, onUpdateImpact, centre }: Props) {
  const [mode, setMode] = useState<DrawMode>("select");
  const [currentImpact, setCurrentImpact] = useState<CodeImpact>("circulation_interdite");
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [searchTarget, setSearchTarget] = useState<[number, number] | null>(null);
  const [labelInput, setLabelInput] = useState("");

  const mapCentre = centre ?? [47.6575, -2.7610];

  function finishDraw(pts: [number, number][], geoType: "LineString" | "Polygon") {
    const t: Troncon = {
      voie_id: `draw_${Date.now()}`,
      impact: currentImpact,
      origine: "manuel",
      coordonnees: pts,
      geometrie_type: geoType,
      label: labelInput || (geoType === "Polygon" ? "Zone" : "Troncon"),
    };
    onAdd(t);
    setDrawPoints([]);
    setLabelInput("");
    setMode("select");
  }

  function cancelDraw() {
    setDrawPoints([]);
    setMode("select");
  }

  function undoPoint() {
    if (drawPoints.length > 0) setDrawPoints(drawPoints.slice(0, -1));
  }

  const handleSearch = useCallback((lat: number, lng: number) => {
    setSearchTarget([lat, lng]);
  }, []);

  const existingShapes = useMemo(() => {
    return troncons.filter((t) => t.coordonnees && t.coordonnees.length >= 2);
  }, [troncons]);

  const isDrawing = mode !== "select";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>
      <div>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => { setMode("select"); setDrawPoints([]); }}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
              background: mode === "select" ? "#1E3A5F" : "#FFFFFF",
              color: mode === "select" ? "#FAFAF7" : "#1C1F1B",
              border: `1px solid ${mode === "select" ? "#1E3A5F" : "#E4E1D6"}`,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <MousePointer size={12} /> Selection
          </button>
          <button
            onClick={() => { setMode("line"); setDrawPoints([]); }}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
              background: mode === "line" ? "#1E3A5F" : "#FFFFFF",
              color: mode === "line" ? "#FAFAF7" : "#1C1F1B",
              border: `1px solid ${mode === "line" ? "#1E3A5F" : "#E4E1D6"}`,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Pencil size={12} /> Tracer une rue
          </button>
          <button
            onClick={() => { setMode("polygon"); setDrawPoints([]); }}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
              background: mode === "polygon" ? "#1E3A5F" : "#FFFFFF",
              color: mode === "polygon" ? "#FAFAF7" : "#1C1F1B",
              border: `1px solid ${mode === "polygon" ? "#1E3A5F" : "#E4E1D6"}`,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Pentagon size={12} /> Dessiner une zone
          </button>
        </div>

        {/* Drawing controls */}
        {isDrawing && (
          <div style={{
            display: "flex", gap: 8, alignItems: "center", marginBottom: 10,
            padding: "8px 12px", background: "#EBF0F7", borderRadius: 7,
            border: "1px solid #C8D6E5", flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 11, color: "#1E3A5F", fontWeight: 500 }}>
              {mode === "line" ? "Cliquez pour tracer · Double-clic pour terminer" : "Cliquez les sommets · Double-clic pour fermer"}
            </span>
            <span style={{ fontSize: 11, color: "#6B6A60" }}>({drawPoints.length} point{drawPoints.length !== 1 ? "s" : ""})</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
              {drawPoints.length > 0 && (
                <button onClick={undoPoint} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4, fontSize: 10, background: "#FFFFFF", border: "1px solid #E4E1D6", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  <Undo2 size={10} /> Annuler
                </button>
              )}
              {drawPoints.length >= 2 && (
                <button onClick={() => {
                  let finalPts = [...drawPoints];
                  if (mode === "polygon" && finalPts.length >= 3) finalPts = [...finalPts, finalPts[0]!];
                  finishDraw(finalPts, mode === "polygon" ? "Polygon" : "LineString");
                }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4, fontSize: 10, background: "#2F6B4F", border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  <Check size={10} /> Valider
                </button>
              )}
              <button onClick={cancelDraw} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 4, fontSize: 10, background: "#FFFFFF", border: "1px solid #DC2626", cursor: "pointer", color: "#DC2626", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <X size={10} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Drawing settings */}
        {isDrawing && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <label style={{ fontSize: 10, color: "#6B6A60" }}>Impact :</label>
              <select
                value={currentImpact}
                onChange={(e) => setCurrentImpact(e.target.value as CodeImpact)}
                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                {TYPES_IMPACT.map((ti) => (
                  <option key={ti.code} value={ti.code}>{ti.label}</option>
                ))}
              </select>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: couleur(currentImpact), display: "inline-block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <label style={{ fontSize: 10, color: "#6B6A60" }}>Nom :</label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder={mode === "polygon" ? "Ex. Place du Marche" : "Ex. Rue Victor Hugo"}
                style={{ fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1D6", width: 180, fontFamily: "'IBM Plex Sans', sans-serif" }}
              />
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, overflow: "hidden", height: 420 }}>
          <MapContainer
            key={`${mapCentre[0]}-${mapCentre[1]}`}
            center={mapCentre}
            zoom={16}
            style={{ height: "100%", width: "100%", cursor: isDrawing ? "crosshair" : "grab" }}
            scrollWheelZoom={true}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapFlyTo position={searchTarget} />

            <DrawHandler
              mode={mode}
              points={drawPoints}
              setPoints={setDrawPoints}
              impact={currentImpact}
              onFinish={finishDraw}
            />

            {/* Existing drawn shapes */}
            {existingShapes.map((t) => {
              const col = couleur(t.impact);
              const latLngs = t.coordonnees!.map((p) => [p[1], p[0]] as [number, number]);
              const impLabel = TYPES_IMPACT.find((x) => x.code === t.impact)?.label;
              if (t.geometrie_type === "Polygon") {
                return (
                  <Polygon key={t.voie_id} positions={latLngs} pathOptions={{ color: col, weight: 4, fillColor: col, fillOpacity: 0.25 }}>
                    <Popup><div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}><strong>{t.label}</strong><br />{impLabel}</div></Popup>
                  </Polygon>
                );
              }
              return (
                <Polyline key={t.voie_id} positions={latLngs} pathOptions={{ color: col, weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }}>
                  <Popup><div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}><strong>{t.label}</strong><br />{impLabel}</div></Popup>
                </Polyline>
              );
            })}

            {/* Legend */}
            <div style={{
              position: "absolute", bottom: 16, right: 12, zIndex: 1000,
              background: "rgba(255,255,255,0.95)", borderRadius: 6,
              padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              border: "1px solid #E4E1D6",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 600, color: "#1C1F1B" }}>Legende</p>
              {TYPES_IMPACT.map((ti) => (
                <div key={ti.code} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                  <span style={{ width: 14, height: 3, background: ti.couleur, borderRadius: 2, display: "inline-block" }} />
                  <span style={{ fontSize: 9, color: "#6B6A60" }}>{ti.label}</span>
                </div>
              ))}
            </div>
          </MapContainer>
        </div>
      </div>

      {/* Side panel */}
      <div>
        <SearchBar onSelect={handleSearch} />

        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6A60", margin: "0 0 8px" }}>
          Traces ({troncons.filter((t) => t.coordonnees).length})
        </p>

        {troncons.length === 0 && (
          <div style={{ padding: "16px 12px", background: "#F4F2EC", borderRadius: 7, textAlign: "center" }}>
            <Pencil size={20} color="#A6A399" style={{ marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: "#6B6A60", margin: 0, lineHeight: 1.4 }}>
              Utilisez les outils ci-dessus pour tracer des rues ou dessiner des zones sur la carte.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {troncons.map((t, idx) => {
            const col = couleur(t.impact);
            const isGeo = !!t.coordonnees;
            return (
              <div key={t.voie_id} style={{
                background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 6,
                padding: "8px 10px", borderLeft: `3px solid ${col}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#1C1F1B", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    {t.label || t.voie_id}
                  </span>
                  <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {isGeo && (
                  <span style={{ fontSize: 9, color: "#6B6A60", display: "flex", alignItems: "center", gap: 3 }}>
                    {t.geometrie_type === "Polygon" ? <Pentagon size={9} /> : <Pencil size={9} />}
                    {t.geometrie_type === "Polygon" ? "Zone" : "Trace"} · {(t.coordonnees?.length ?? 0) - (t.geometrie_type === "Polygon" ? 1 : 0)} pts
                  </span>
                )}
                <select
                  value={t.impact}
                  onChange={(e) => onUpdateImpact(idx, e.target.value as CodeImpact)}
                  style={{ width: "100%", marginTop: 4, fontSize: 10, padding: "3px 6px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {TYPES_IMPACT.map((ti) => (
                    <option key={ti.code} value={ti.code}>{ti.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
