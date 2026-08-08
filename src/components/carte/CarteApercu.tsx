/**
 * CarteApercu — carte de prévisualisation en lecture seule.
 *
 * Affiche les voies déclarées dans le formulaire en les géocodant
 * via Nominatim, sans outils de dessin ni toolbar.
 */
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { TYPES_IMPACT } from "@/data/types-impact";
import { MapPin } from "lucide-react";
import type { CodeImpact } from "@/types";

interface VoieTrace {
  nom: string;
  impact: CodeImpact;
  coords: [number, number][];
}

interface Props {
  /** Centre initial de la carte [lat, lng] */
  centre?: [number, number];
  /** Nom de la commune pour scoper les recherches Nominatim */
  communeNom?: string;
  /** Voies déclarées dans le formulaire */
  voies: { nom: string; impact: CodeImpact }[];
}

const IMPACT_COULEURS: Record<string, string> = {};
for (const t of TYPES_IMPACT) IMPACT_COULEURS[t.code] = t.couleur;

function couleur(impact: string): string {
  return IMPACT_COULEURS[impact] ?? "#6B6A60";
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  geojson?: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

function extractLineCoords(geojson?: NominatimResult["geojson"]): [number, number][] | null {
  if (!geojson) return null;
  if (geojson.type === "LineString") {
    return (geojson.coordinates as number[][]).map(([lng, lat]) => [lat, lng] as [number, number]);
  }
  if (geojson.type === "MultiLineString") {
    return (geojson.coordinates as number[][][]).flat().map(([lng, lat]) => [lat, lng] as [number, number]);
  }
  return null;
}

/** Ajuste la vue de la carte pour contenir toutes les voies tracées */
function FitBounds({ traces, centre }: { traces: VoieTrace[]; centre?: [number, number] }) {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    // Ne re-centrer que quand de nouvelles traces apparaissent
    if (traces.length === 0) return;
    if (traces.length === prevCount.current) return;
    prevCount.current = traces.length;

    const allCoords = traces.flatMap((t) => t.coords);
    if (allCoords.length >= 2) {
      const bounds = L.latLngBounds(allCoords.map(([lat, lng]) => [lat, lng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    } else if (allCoords.length === 1) {
      map.setView(allCoords[0]!, 15);
    }
  }, [traces, centre, map]);

  return null;
}

/** Centre la carte sur le centre de la commune au montage */
function InitView({ centre }: { centre: [number, number] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) {
      map.setView(centre, 14);
      done.current = true;
    }
  }, [centre, map]);
  return null;
}

export default function CarteApercu({ centre, communeNom, voies }: Props) {
  const [traces, setTraces] = useState<VoieTrace[]>([]);
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const cacheRef = useRef<Map<string, [number, number][]>>(new Map());

  // Clé stable de la liste des voies pour détecter les changements
  const voiesKey = useMemo(
    () => voies.map((v) => `${v.nom}|${v.impact}`).join(";;"),
    [voies],
  );

  useEffect(() => {
    // À chaque changement, annuler TOUS les timers en cours et repartir à zéro
    for (const timer of pendingRef.current.values()) {
      clearTimeout(timer);
    }
    pendingRef.current.clear();

    // Filtrer les voies avec un nom suffisamment long
    const voiesValides = voies.filter((v) => v.nom.trim().length >= 3);

    // Reconstruire les traces depuis le cache + identifier les voies à géocoder
    const nouvellesTraces: VoieTrace[] = [];
    const aGeocoder: { nom: string; impact: CodeImpact }[] = [];

    voiesValides.forEach((v) => {
      const cached = cacheRef.current.get(v.nom);
      if (cached) {
        nouvellesTraces.push({ nom: v.nom, impact: v.impact, coords: cached });
      } else {
        aGeocoder.push({ nom: v.nom, impact: v.impact });
      }
    });

    setTraces(nouvellesTraces);

    // Géocoder les nouvelles voies avec un délai pour éviter le rate-limiting
    aGeocoder.forEach(({ nom, impact }, queueIdx) => {
      const timer = setTimeout(() => {
        const query = communeNom ? `${nom}, ${communeNom}, France` : `${nom}, France`;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&polygon_geojson=1&q=${encodeURIComponent(query)}`)
          .then((r) => r.json())
          .then((data: NominatimResult[]) => {
            if (!data[0]) return;
            const coords = extractLineCoords(data[0].geojson);
            if (coords && coords.length >= 2) {
              cacheRef.current.set(nom, coords);
              setTraces((prev) => {
                const sans = prev.filter((t) => t.nom !== nom);
                return [...sans, { nom, impact, coords }];
              });
            }
          })
          .catch(() => {})
          .finally(() => {
            pendingRef.current.delete(nom);
          });
      }, queueIdx * 1200);

      pendingRef.current.set(nom, timer);
    });

    return () => {
      for (const timer of pendingRef.current.values()) {
        clearTimeout(timer);
      }
      pendingRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiesKey, communeNom]);

  const defaultCenter: [number, number] = centre ?? [48.07, -0.77];

  return (
    <div style={{
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid #E4E1D6",
      background: "#F4F2EC",
      height: "100%",
      minHeight: 340,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Mini header */}
      <div style={{
        padding: "8px 12px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E4E1D6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={12} color="#1E3A5F" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1F1B" }}>Apercu carte</span>
        </div>
        {traces.length > 0 && (
          <span style={{ fontSize: 10, color: "#6B6A60" }}>
            {traces.length} voie{traces.length > 1 ? "s" : ""} tracee{traces.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Carte */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ height: "100%", width: "100%", minHeight: 300 }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {centre && <InitView centre={centre} />}
          <FitBounds traces={traces} centre={centre} />
          {traces.map((t, i) => (
            <Polyline
              key={`${t.nom}_${i}`}
              positions={t.coords}
              pathOptions={{
                color: couleur(t.impact),
                weight: 5,
                opacity: 0.85,
              }}
            />
          ))}
        </MapContainer>

        {/* Placeholder quand aucune voie */}
        {voies.filter((v) => v.nom.trim().length >= 3).length === 0 && (
          <div style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 6,
            padding: "10px 14px",
            backdropFilter: "blur(4px)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>
              Ajoutez des voies impactees dans le formulaire pour les voir apparaitre sur la carte.
            </p>
          </div>
        )}

        {/* Légende */}
        {traces.length > 0 && (
          <div style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 6,
            padding: "6px 10px",
            backdropFilter: "blur(4px)",
            zIndex: 400,
          }}>
            {traces.map((t, i) => (
              <div key={`leg_${i}`} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: i < traces.length - 1 ? 3 : 0 }}>
                <div style={{ width: 16, height: 3, borderRadius: 2, background: couleur(t.impact), flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#1C1F1B" }}>{t.nom}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
