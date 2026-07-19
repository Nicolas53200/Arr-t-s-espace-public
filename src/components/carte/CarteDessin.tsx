import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Pencil, Pentagon, MousePointer, Trash2, Check, Search, X, MapPin, Undo2, Zap, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { TYPES_IMPACT } from "@/data/types-impact";
import type { CodeImpact, Troncon } from "@/types";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  osm_type?: string;
  geojson?: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

interface AlerteAdjacente {
  rue: string;
  sensUnique: boolean;
  direction?: string;
  distance: number;
}

type DrawMode = "select" | "line" | "polygon";

interface Props {
  troncons: Troncon[];
  onAdd: (t: Troncon) => void;
  onRemove: (idx: number) => void;
  onUpdateImpact: (idx: number, impact: CodeImpact) => void;
  onUpdateCoords?: (idx: number, coords: [number, number][]) => void;
  centre?: [number, number];
  rueInitiale?: string;
  voiesInitiales?: { nom: string; impact: CodeImpact; touteRue: boolean; debut: string; fin: string }[];
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

function editVertexIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);cursor:move;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function midpointIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:8px;height:8px;border-radius:50%;background:rgba(37,99,235,0.5);border:1.5px solid #2563EB;cursor:pointer;"></div>`,
    iconSize: [11, 11],
    iconAnchor: [5, 5],
  });
}

function MapFlyTo({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useMemo(() => {
    if (position) map.flyTo(position, zoom ?? 17, { duration: 1 });
  }, [map, position, zoom]);
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

function extractLineCoords(geojson: NominatimResult["geojson"]): [number, number][] | null {
  if (!geojson) return null;
  if (geojson.type === "LineString") {
    return (geojson.coordinates as number[][]).map((c) => [c[0]!, c[1]!] as [number, number]);
  }
  if (geojson.type === "MultiLineString") {
    const lines = geojson.coordinates as number[][][];
    if (lines.length === 0) return null;
    return lines.flat().map((c) => [c[0]!, c[1]!] as [number, number]);
  }
  if (geojson.type === "Point") {
    const c = geojson.coordinates as number[];
    return [[c[0]!, c[1]!]];
  }
  return null;
}

function detectAlertesAdjacentes(troncons: Troncon[]): AlerteAdjacente[] {
  const blocked = troncons.filter((t) =>
    t.impact === "circulation_interdite" && t.coordonnees && t.coordonnees.length >= 2
  );
  if (blocked.length === 0) return [];

  const alertes: AlerteAdjacente[] = [];

  for (const t of blocked) {
    const coords = t.coordonnees!;
    const start = coords[0]!;
    const end = coords[coords.length - 1]!;

    for (const other of troncons) {
      if (other.voie_id === t.voie_id) continue;
      if (!other.coordonnees || other.coordonnees.length < 2) continue;

      const otherStart = other.coordonnees[0]!;
      const otherEnd = other.coordonnees[other.coordonnees.length - 1]!;

      const threshold = 0.0003;
      const near = (a: [number, number], b: [number, number]) =>
        Math.abs(a[0] - b[0]) < threshold && Math.abs(a[1] - b[1]) < threshold;

      let connected = false;

      if (near(otherStart, start) || near(otherStart, end)) {
        connected = true;
      } else if (near(otherEnd, start) || near(otherEnd, end)) {
        connected = true;
      }

      if (connected && !alertes.find((a) => a.rue === (other.label || other.voie_id))) {
        const dx = otherEnd[0] - otherStart[0];
        const dy = otherEnd[1] - otherStart[1];
        const isMostlyNS = Math.abs(dy) > Math.abs(dx);
        const dirLabel = isMostlyNS
          ? (dy > 0 ? "Sud → Nord" : "Nord → Sud")
          : (dx > 0 ? "Ouest → Est" : "Est → Ouest");

        const dist = Math.sqrt(
          Math.pow((otherEnd[0] - otherStart[0]) * 111320 * Math.cos(otherStart[1] * Math.PI / 180), 2) +
          Math.pow((otherEnd[1] - otherStart[1]) * 110540, 2)
        );

        alertes.push({
          rue: other.label || other.voie_id,
          sensUnique: false,
          direction: dirLabel,
          distance: Math.round(dist),
        });
      }
    }

    if (alertes.length === 0 && coords.length >= 2) {
      const fakeAdjacent: AlerteAdjacente[] = [
        { rue: `Intersection debut (${t.label || t.voie_id})`, sensUnique: false, direction: "a verifier", distance: 0 },
        { rue: `Intersection fin (${t.label || t.voie_id})`, sensUnique: false, direction: "a verifier", distance: 0 },
      ];
      alertes.push(...fakeAdjacent);
    }
  }

  return alertes;
}

function SearchBarAuto({ onSelect, onAutoTrace }: {
  onSelect: (lat: number, lng: number) => void;
  onAutoTrace: (coords: [number, number][], label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function doSearch(q: string) {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&polygon_geojson=1&q=${encodeURIComponent(q + ", France")}`)
      .then((r) => r.json())
      .then((data: NominatimResult[]) => { setResults(data); setOpen(data.length > 0); })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }

  function handleChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 400);
  }

  function pickCenter(r: NominatimResult) {
    onSelect(parseFloat(r.lat), parseFloat(r.lon));
    setQuery(r.display_name.split(",")[0] ?? "");
    setOpen(false);
  }

  function pickAutoTrace(r: NominatimResult) {
    const label = r.display_name.split(",")[0] ?? "Rue";
    setAutoLoading(true);

    const coords = extractLineCoords(r.geojson);
    if (coords && coords.length >= 2) {
      onAutoTrace(coords, label);
      onSelect(parseFloat(r.lat), parseFloat(r.lon));
      setQuery(label);
      setOpen(false);
      setAutoLoading(false);
      return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&polygon_geojson=1&q=${encodeURIComponent(r.display_name)}`)
      .then((res) => res.json())
      .then((data: NominatimResult[]) => {
        if (data[0]?.geojson) {
          const detailCoords = extractLineCoords(data[0].geojson);
          if (detailCoords && detailCoords.length >= 2) {
            onAutoTrace(detailCoords, label);
            onSelect(parseFloat(r.lat), parseFloat(r.lon));
          } else {
            onSelect(parseFloat(r.lat), parseFloat(r.lon));
          }
        } else {
          onSelect(parseFloat(r.lat), parseFloat(r.lon));
        }
      })
      .catch(() => onSelect(parseFloat(r.lat), parseFloat(r.lon)))
      .finally(() => { setAutoLoading(false); setQuery(label); setOpen(false); });
  }

  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAFAF7", border: "1px solid #E4E1D6", borderRadius: 6, padding: "6px 10px" }}>
        <Search size={13} color="#6B6A60" />
        <input type="text" value={query} onChange={(e) => handleChange(e.target.value)} placeholder="Rechercher une rue pour tracer automatiquement..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 11, color: "#1C1F1B", fontFamily: "'IBM Plex Sans', sans-serif" }} />
        {query && <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={11} color="#6B6A60" /></button>}
        {(searching || autoLoading) && <span style={{ fontSize: 9, color: "#6B6A60" }}>...</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: "1px solid #E4E1D6", borderTop: "none", borderRadius: "0 0 6px 6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto" }}>
          {results.map((r, i) => {
            const hasGeo = !!r.geojson && (r.geojson.type === "LineString" || r.geojson.type === "MultiLineString");
            return (
              <div key={i} style={{ borderBottom: "1px solid #F0EDE4", padding: "6px 10px" }}>
                <div style={{ fontSize: 10, color: "#1C1F1B", lineHeight: 1.3, marginBottom: 4 }}>
                  <MapPin size={10} color="#1E3A5F" style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {r.display_name}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => pickCenter(r)} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "3px 8px", borderRadius: 4, fontSize: 9,
                    background: "#FFFFFF", border: "1px solid #E4E1D6",
                    cursor: "pointer", color: "#1E3A5F", fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    <Search size={9} /> Centrer
                  </button>
                  <button onClick={() => pickAutoTrace(r)} style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "3px 8px", borderRadius: 4, fontSize: 9,
                    background: hasGeo ? "#2F6B4F" : "#1E3A5F",
                    border: "none", cursor: "pointer", color: "#fff", fontWeight: 600,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    <Zap size={9} /> Tracer auto
                    {hasGeo && <span style={{ fontSize: 8, opacity: 0.8 }}>(geo)</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AlertesPanel({ troncons }: { troncons: Troncon[] }) {
  const alertes = useMemo(() => detectAlertesAdjacentes(troncons), [troncons]);
  const hasBlocked = troncons.some((t) => t.impact === "circulation_interdite" && t.coordonnees);

  if (!hasBlocked) return null;

  return (
    <div style={{
      marginTop: 10, padding: "10px 12px",
      background: "#FEF3C7", borderRadius: 7,
      border: "1px solid #F59E0B",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <AlertTriangle size={13} color="#92400E" />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>
          Rues adjacentes impactees
        </span>
      </div>
      <p style={{ fontSize: 10, color: "#78350F", margin: "0 0 8px", lineHeight: 1.4 }}>
        Les rues suivantes debouchent sur un troncon en circulation interdite.
        Verifiez les sens uniques et prevoyez la signalisation.
      </p>
      {alertes.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {alertes.map((a, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 8px", background: "#FFFBEB", borderRadius: 5,
              border: "1px solid #FDE68A",
            }}>
              <ArrowRightLeft size={10} color="#92400E" />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: "#78350F" }}>{a.rue}</span>
                {a.direction && a.direction !== "a verifier" && (
                  <span style={{ fontSize: 9, color: "#92400E", marginLeft: 6 }}>({a.direction})</span>
                )}
              </div>
              {a.sensUnique && (
                <span style={{
                  fontSize: 8, padding: "1px 5px", borderRadius: 3,
                  background: "#DC2626", color: "#fff", fontWeight: 700,
                }}>
                  SENS UNIQUE
                </span>
              )}
              {a.distance > 0 && (
                <span style={{ fontSize: 8, color: "#92400E" }}>{a.distance}m</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 10, color: "#92400E", margin: 0, fontStyle: "italic" }}>
          Aucune rue adjacente detectee — verifiez manuellement les intersections.
        </p>
      )}
      <p style={{ fontSize: 9, color: "#A16207", margin: "6px 0 0", fontStyle: "italic" }}>
        Les donnees de sens unique seront disponibles via l'integration OpenStreetMap.
      </p>
    </div>
  );
}

export default function CarteDessin({ troncons, onAdd, onRemove, onUpdateImpact, onUpdateCoords, centre, rueInitiale, voiesInitiales }: Props) {
  const [mode, setMode] = useState<DrawMode>("select");
  const [currentImpact, setCurrentImpact] = useState<CodeImpact>("circulation_interdite");
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [searchTarget, setSearchTarget] = useState<[number, number] | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

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

  const handleAutoTrace = useCallback((coords: [number, number][], label: string) => {
    const t: Troncon = {
      voie_id: `auto_${Date.now()}`,
      impact: currentImpact,
      origine: "auto",
      coordonnees: coords,
      geometrie_type: "LineString",
      label,
    };
    onAdd(t);
  }, [currentImpact, onAdd]);

  const initialTraceDone = useRef(false);
  useEffect(() => {
    if (initialTraceDone.current) return;

    const rues = voiesInitiales && voiesInitiales.length > 0
      ? voiesInitiales.filter((v) => v.nom.length >= 3)
      : rueInitiale && rueInitiale.length >= 3
        ? [{ nom: rueInitiale, impact: "circulation_interdite" as CodeImpact, touteRue: true, debut: "", fin: "" }]
        : [];

    if (rues.length === 0) return;
    initialTraceDone.current = true;

    rues.forEach((rue, i) => {
      setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&polygon_geojson=1&q=${encodeURIComponent(rue.nom + ", France")}`)
          .then((r) => r.json())
          .then((data: NominatimResult[]) => {
            if (!data[0]) return;
            const r = data[0];
            const coords = extractLineCoords(r.geojson);
            const label = r.display_name.split(",")[0] ?? rue.nom;
            if (coords && coords.length >= 2) {
              const t: Troncon = {
                voie_id: `auto_${Date.now()}_${i}`,
                impact: rue.impact,
                origine: "auto",
                coordonnees: coords,
                geometrie_type: "LineString",
                label,
                segment_debut: rue.touteRue ? "" : rue.debut,
                segment_fin: rue.touteRue ? "" : rue.fin,
              };
              onAdd(t);
            }
            if (i === 0) setSearchTarget([parseFloat(r.lat), parseFloat(r.lon)]);
          })
          .catch(() => {});
      }, i * 1100);
    });
  }, [voiesInitiales, rueInitiale, onAdd]);

  const handleVertexDrag = useCallback((tIdx: number, ptIdx: number, lat: number, lng: number) => {
    if (!onUpdateCoords) return;
    const t = troncons[tIdx];
    if (!t?.coordonnees) return;
    const newCoords = t.coordonnees.map((c, i) => i === ptIdx ? [lng, lat] as [number, number] : c);
    if (t.geometrie_type === "Polygon" && ptIdx === 0 && newCoords.length > 1) {
      newCoords[newCoords.length - 1] = [lng, lat];
    }
    onUpdateCoords(tIdx, newCoords);
  }, [troncons, onUpdateCoords]);

  const handleVertexDelete = useCallback((tIdx: number, ptIdx: number) => {
    if (!onUpdateCoords) return;
    const t = troncons[tIdx];
    if (!t?.coordonnees) return;
    const minPts = t.geometrie_type === "Polygon" ? 4 : 2;
    if (t.coordonnees.length <= minPts) return;
    const newCoords = t.coordonnees.filter((_, i) => i !== ptIdx);
    if (t.geometrie_type === "Polygon" && ptIdx === 0 && newCoords.length > 1) {
      newCoords[newCoords.length - 1] = newCoords[0]!;
    }
    onUpdateCoords(tIdx, newCoords);
  }, [troncons, onUpdateCoords]);

  const handleAddVertex = useCallback((tIdx: number, afterIdx: number, lat: number, lng: number) => {
    if (!onUpdateCoords) return;
    const t = troncons[tIdx];
    if (!t?.coordonnees) return;
    const newCoords = [...t.coordonnees];
    newCoords.splice(afterIdx + 1, 0, [lng, lat] as [number, number]);
    onUpdateCoords(tIdx, newCoords);
  }, [troncons, onUpdateCoords]);

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
              const tIdx = troncons.indexOf(t);
              const col = couleur(t.impact);
              const latLngs = t.coordonnees!.map((p) => [p[1], p[0]] as [number, number]);
              const impLabel = TYPES_IMPACT.find((x) => x.code === t.impact)?.label;
              const isEditing = editingIdx === tIdx;
              const shapeEvents = {
                click: () => { if (mode === "select" && onUpdateCoords) setEditingIdx(isEditing ? null : tIdx); },
              };
              if (t.geometrie_type === "Polygon") {
                return (
                  <span key={t.voie_id}>
                    <Polygon positions={latLngs} pathOptions={{ color: col, weight: isEditing ? 3 : 4, fillColor: col, fillOpacity: isEditing ? 0.15 : 0.25, dashArray: isEditing ? "6 4" : undefined }} eventHandlers={shapeEvents}>
                      {!isEditing && <Popup><div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}><strong>{t.label}</strong><br />{impLabel}<br /><span style={{ fontSize: 10, color: "#6B6A60" }}>Cliquez pour modifier</span></div></Popup>}
                    </Polygon>
                  </span>
                );
              }
              return (
                <span key={t.voie_id}>
                  <Polyline positions={latLngs} pathOptions={{ color: col, weight: isEditing ? 4 : 5, opacity: 0.85, lineCap: "round", lineJoin: "round", dashArray: isEditing ? "8 5" : undefined }} eventHandlers={shapeEvents}>
                    {!isEditing && <Popup><div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 }}><strong>{t.label}</strong><br />{impLabel}<br /><span style={{ fontSize: 10, color: "#6B6A60" }}>Cliquez pour modifier</span></div></Popup>}
                  </Polyline>
                </span>
              );
            })}

            {/* Editable vertices */}
            {editingIdx !== null && troncons[editingIdx]?.coordonnees && (() => {
              const t = troncons[editingIdx]!;
              const coords = t.coordonnees!;
              const col = couleur(t.impact);
              const skipLast = t.geometrie_type === "Polygon" ? 1 : 0;
              const editableCoords = coords.slice(0, coords.length - skipLast);
              return (
                <>
                  {editableCoords.map((c, ptIdx) => (
                    <Marker
                      key={`ev-${ptIdx}`}
                      position={[c[1], c[0]]}
                      icon={editVertexIcon(col)}
                      draggable
                      eventHandlers={{
                        dragend: (e) => {
                          const latlng = e.target.getLatLng();
                          handleVertexDrag(editingIdx, ptIdx, latlng.lat, latlng.lng);
                        },
                        contextmenu: (e) => {
                          e.originalEvent.preventDefault();
                          handleVertexDelete(editingIdx, ptIdx);
                        },
                      }}
                    >
                      <Popup><div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11 }}>Point {ptIdx + 1}<br /><span style={{ fontSize: 10, color: "#6B6A60" }}>Glisser pour deplacer<br />Clic droit pour supprimer</span></div></Popup>
                    </Marker>
                  ))}
                  {editableCoords.length >= 2 && editableCoords.slice(0, -1).map((c, i) => {
                    const next = editableCoords[i + 1]!;
                    const midLat = (c[1] + next[1]) / 2;
                    const midLng = (c[0] + next[0]) / 2;
                    return (
                      <Marker
                        key={`mid-${i}`}
                        position={[midLat, midLng]}
                        icon={midpointIcon()}
                        eventHandlers={{
                          click: () => handleAddVertex(editingIdx, i, midLat, midLng),
                        }}
                      />
                    );
                  })}
                </>
              );
            })()}

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
        <SearchBarAuto onSelect={handleSearch} onAutoTrace={handleAutoTrace} />

        {/* Impact selector for auto-trace */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <label style={{ fontSize: 10, color: "#6B6A60" }}>Impact par defaut :</label>
          <select
            value={currentImpact}
            onChange={(e) => setCurrentImpact(e.target.value as CodeImpact)}
            style={{ flex: 1, fontSize: 10, padding: "3px 6px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            {TYPES_IMPACT.map((ti) => (
              <option key={ti.code} value={ti.code}>{ti.label}</option>
            ))}
          </select>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: couleur(currentImpact), display: "inline-block" }} />
        </div>

        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6A60", margin: "0 0 8px" }}>
          Traces ({troncons.filter((t) => t.coordonnees).length})
        </p>

        {troncons.length === 0 && (
          <div style={{ padding: "16px 12px", background: "#F4F2EC", borderRadius: 7, textAlign: "center" }}>
            <Zap size={20} color="#A6A399" style={{ marginBottom: 6 }} />
            <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 4px", lineHeight: 1.4, fontWeight: 500 }}>
              Recherchez une rue pour la tracer automatiquement
            </p>
            <p style={{ fontSize: 10, color: "#A6A399", margin: 0, lineHeight: 1.4 }}>
              ou utilisez les outils manuels (crayon / zone) ci-dessus.
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
                  <span style={{ fontSize: 11, fontWeight: 500, color: editingIdx === idx ? "#2563EB" : "#1C1F1B", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    {t.label || t.voie_id}
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {isGeo && onUpdateCoords && (
                      <button
                        onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                        title={editingIdx === idx ? "Terminer" : "Modifier le trace"}
                        style={{
                          background: editingIdx === idx ? "#2563EB" : "none",
                          border: editingIdx === idx ? "none" : "1px solid #E4E1D6",
                          borderRadius: 4, cursor: "pointer", padding: "2px 5px",
                          color: editingIdx === idx ? "#fff" : "#6B6A60",
                          fontSize: 9, fontWeight: 500, display: "flex", alignItems: "center", gap: 2,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      >
                        <Pencil size={9} /> {editingIdx === idx ? "OK" : "Editer"}
                      </button>
                    )}
                    <button onClick={() => { if (editingIdx === idx) setEditingIdx(null); onRemove(idx); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {isGeo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: "#6B6A60", display: "flex", alignItems: "center", gap: 3 }}>
                      {t.geometrie_type === "Polygon" ? <Pentagon size={9} /> : <Pencil size={9} />}
                      {t.geometrie_type === "Polygon" ? "Zone" : "Trace"} · {(t.coordonnees?.length ?? 0) - (t.geometrie_type === "Polygon" ? 1 : 0)} pts
                    </span>
                    {t.origine === "auto" && (
                      <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: "#D1FAE5", color: "#2F6B4F", fontWeight: 600 }}>
                        AUTO
                      </span>
                    )}
                  </div>
                )}
                <select
                  value={t.impact}
                  onChange={(e) => onUpdateImpact(idx, e.target.value as CodeImpact)}
                  style={{ width: "100%", marginTop: 2, fontSize: 10, padding: "3px 6px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {TYPES_IMPACT.map((ti) => (
                    <option key={ti.code} value={ti.code}>{ti.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Alertes rues adjacentes */}
        <AlertesPanel troncons={troncons} />
      </div>
    </div>
  );
}
