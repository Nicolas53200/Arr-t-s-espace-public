/**
 * CarteApercu — carte de prévisualisation en lecture seule.
 *
 * Affiche les voies déclarées dans le formulaire en les géocodant
 * via Nominatim, sans outils de dessin ni toolbar.
 *
 * Debounce de 1,2 s après la dernière frappe pour éviter le
 * rate-limiting de Nominatim (1 req/s max).
 */
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { TYPES_IMPACT } from "@/data/types-impact";
import { MapPin, Loader2 } from "lucide-react";
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

/** Géocode une voie via Nominatim, une seule requête à la fois */
async function geocoderVoie(
  nom: string,
  communeNom: string | undefined,
  signal: AbortSignal,
): Promise<[number, number][] | null> {
  const query = communeNom ? `${nom}, ${communeNom}, France` : `${nom}, France`;
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&polygon_geojson=1&q=${encodeURIComponent(query)}`,
      { signal },
    );
    const data = (await resp.json()) as NominatimResult[];
    if (!data[0]) return null;
    return extractLineCoords(data[0].geojson);
  } catch {
    return null;
  }
}

export default function CarteApercu({ centre, communeNom, voies }: Props) {
  const [traces, setTraces] = useState<VoieTrace[]>([]);
  const [enChargement, setEnChargement] = useState(false);
  const cacheRef = useRef<Map<string, [number, number][]>>(new Map());

  // Clé stable pour détecter un vrai changement de contenu
  const voiesKey = useMemo(
    () => voies.map((v) => `${v.nom}|${v.impact}`).join(";;"),
    [voies],
  );

  useEffect(() => {
    const voiesValides = voies.filter((v) => v.nom.trim().length >= 3);

    // Afficher immédiatement les traces déjà en cache
    const tracesCachees: VoieTrace[] = [];
    const aGeocoder: { nom: string; impact: CodeImpact }[] = [];

    for (const v of voiesValides) {
      const cached = cacheRef.current.get(v.nom);
      if (cached) {
        tracesCachees.push({ nom: v.nom, impact: v.impact, coords: cached });
      } else {
        aGeocoder.push({ nom: v.nom, impact: v.impact });
      }
    }

    setTraces(tracesCachees);

    // Rien à géocoder → pas de debounce
    if (aGeocoder.length === 0) {
      setEnChargement(false);
      return;
    }

    // Debounce : attendre 1,2 s après la dernière frappe
    setEnChargement(true);
    const controller = new AbortController();

    const debounceTimer = setTimeout(() => {
      // Lancer les requêtes séquentiellement (1 par 1,2 s) pour Nominatim
      let cancelled = false;

      (async () => {
        for (let i = 0; i < aGeocoder.length; i++) {
          if (cancelled || controller.signal.aborted) return;

          const { nom, impact } = aGeocoder[i]!;

          // Vérifier le cache une dernière fois (un précédent effet l'a peut-être rempli)
          const cached = cacheRef.current.get(nom);
          if (cached) {
            setTraces((prev) => {
              const sans = prev.filter((t) => t.nom !== nom);
              return [...sans, { nom, impact, coords: cached }];
            });
            continue;
          }

          const coords = await geocoderVoie(nom, communeNom, controller.signal);

          if (cancelled || controller.signal.aborted) return;

          if (coords && coords.length >= 2) {
            cacheRef.current.set(nom, coords);
            setTraces((prev) => {
              const sans = prev.filter((t) => t.nom !== nom);
              return [...sans, { nom, impact, coords }];
            });
          }

          // Attendre 1,2 s entre chaque requête si d'autres suivent
          if (i < aGeocoder.length - 1) {
            await new Promise<void>((resolve) => {
              const t = setTimeout(resolve, 1200);
              controller.signal.addEventListener("abort", () => {
                clearTimeout(t);
                resolve();
              });
            });
          }
        }

        if (!cancelled) setEnChargement(false);
      })();

      // Cleanup interne
      controller.signal.addEventListener("abort", () => {
        cancelled = true;
      });
    }, 1200);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
      setEnChargement(false);
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {enChargement && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B6A60" }}>
              <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
              Recherche...
            </span>
          )}
          {traces.length > 0 && (
            <span style={{ fontSize: 10, color: "#6B6A60" }}>
              {traces.length} voie{traces.length > 1 ? "s" : ""} tracee{traces.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
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
        {voies.filter((v) => v.nom.trim().length >= 3).length === 0 && !enChargement && (
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
