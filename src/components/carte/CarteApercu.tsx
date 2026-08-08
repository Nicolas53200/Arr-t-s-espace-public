/**
 * CarteApercu — carte de prévisualisation en lecture seule.
 *
 * Affiche les voies déclarées dans le formulaire en utilisant
 * l'API Adresse (api-adresse.data.gouv.fr) — fiable, gratuite,
 * sans rate-limiting.
 *
 * Debounce de 800ms après la dernière frappe.
 */
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { TYPES_IMPACT } from "@/data/types-impact";
import { MapPin, Loader2 } from "lucide-react";
import type { CodeImpact } from "@/types";

interface VoieLocalisee {
  nom: string;
  label: string;
  impact: CodeImpact;
  lat: number;
  lng: number;
}

interface Props {
  /** Centre initial de la carte [lat, lng] */
  centre?: [number, number];
  /** Code postal de la commune pour scoper la recherche */
  communeCodePostal?: string;
  /** Nom de la commune */
  communeNom?: string;
  /** Voies déclarées dans le formulaire */
  voies: { nom: string; impact: CodeImpact }[];
}

const IMPACT_COULEURS: Record<string, string> = {};
for (const t of TYPES_IMPACT) IMPACT_COULEURS[t.code] = t.couleur;

function couleur(impact: string): string {
  return IMPACT_COULEURS[impact] ?? "#6B6A60";
}

function pinIcon(impactColor: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
      background: ${impactColor}; transform: rotate(-45deg);
      border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
    "><div style="width: 8px; height: 8px; border-radius: 50%; background: #fff;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
}

/** Ajuste la vue pour contenir tous les marqueurs */
function FitMarkers({ voies, centre }: { voies: VoieLocalisee[]; centre?: [number, number] }) {
  const map = useMap();
  const prevCount = useRef(0);

  useEffect(() => {
    if (voies.length === 0) return;
    if (voies.length === prevCount.current) return;
    prevCount.current = voies.length;

    if (voies.length === 1) {
      map.setView([voies[0]!.lat, voies[0]!.lng], 16);
    } else {
      const bounds = L.latLngBounds(voies.map((v) => [v.lat, v.lng] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [voies, centre, map]);

  return null;
}

/** Centre la carte au montage */
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

/** Appel unique à l'API Adresse */
async function fetchAdresse(
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<{ label: string; lat: number; lng: number } | null> {
  const resp = await fetch(
    `https://api-adresse.data.gouv.fr/search/?${params}`,
    { signal },
  );
  if (!resp.ok) return null;

  const data = await resp.json();
  const features = data.features as Array<{
    properties: { label: string; name: string; score: number };
    geometry: { coordinates: [number, number] };
  }>;

  if (!features || features.length === 0) return null;

  const f = features[0]!;
  if (f.properties.score < 0.2) return null;

  const [lng, lat] = f.geometry.coordinates;
  return { label: f.properties.label, lat, lng };
}

/**
 * Géocode une rue via l'API Adresse (gouvernement français).
 * Essaie 3 stratégies successives :
 * 1. Recherche type=street scopée au code postal
 * 2. Recherche libre scopée au code postal (pour places, lieux-dits…)
 * 3. Recherche libre nationale (si le code postal ne matche pas)
 */
async function geocoderRue(
  nom: string,
  codePostal: string | undefined,
  communeNom: string | undefined,
  signal: AbortSignal,
): Promise<{ label: string; lat: number; lng: number } | null> {
  try {
    // Stratégie 1 : type=street + code postal
    if (codePostal) {
      const p1 = new URLSearchParams({
        q: nom,
        postcode: codePostal,
        type: "street",
        limit: "1",
        autocomplete: "1",
      });
      const r1 = await fetchAdresse(p1, signal);
      if (r1) return r1;
    }

    // Stratégie 2 : recherche libre + code postal (places, lieux-dits, etc.)
    if (codePostal) {
      const p2 = new URLSearchParams({
        q: nom,
        postcode: codePostal,
        limit: "1",
        autocomplete: "1",
      });
      const r2 = await fetchAdresse(p2, signal);
      if (r2) return r2;
    }

    // Stratégie 3 : recherche libre avec nom de commune
    const q3 = communeNom ? `${nom}, ${communeNom}` : nom;
    const p3 = new URLSearchParams({
      q: q3,
      limit: "1",
      autocomplete: "1",
    });
    return await fetchAdresse(p3, signal);
  } catch {
    return null;
  }
}

export default function CarteApercu({ centre, communeCodePostal, communeNom, voies }: Props) {
  const [localisees, setLocalisees] = useState<VoieLocalisee[]>([]);
  const [enChargement, setEnChargement] = useState(false);
  const cacheRef = useRef<Map<string, { label: string; lat: number; lng: number }>>(new Map());

  // Clé stable pour détecter un vrai changement de contenu
  const voiesKey = useMemo(
    () => voies.map((v) => `${v.nom}|${v.impact}`).join(";;"),
    [voies],
  );

  useEffect(() => {
    const voiesValides = voies.filter((v) => v.nom.trim().length >= 3);

    // Afficher immédiatement les résultats en cache
    const fromCache: VoieLocalisee[] = [];
    const aGeocoder: { nom: string; impact: CodeImpact }[] = [];

    for (const v of voiesValides) {
      const cached = cacheRef.current.get(v.nom);
      if (cached) {
        fromCache.push({ nom: v.nom, label: cached.label, impact: v.impact, lat: cached.lat, lng: cached.lng });
      } else {
        aGeocoder.push({ nom: v.nom, impact: v.impact });
      }
    }

    setLocalisees(fromCache);

    if (aGeocoder.length === 0) {
      setEnChargement(false);
      return;
    }

    // Debounce : attendre 800ms après la dernière frappe
    setEnChargement(true);
    const controller = new AbortController();

    const debounceTimer = setTimeout(async () => {
      for (const { nom, impact } of aGeocoder) {
        if (controller.signal.aborted) break;

        // Vérifier le cache une dernière fois
        const cached = cacheRef.current.get(nom);
        if (cached) {
          setLocalisees((prev) => {
            if (prev.some((v) => v.nom === nom)) return prev;
            return [...prev, { nom, label: cached.label, impact, lat: cached.lat, lng: cached.lng }];
          });
          continue;
        }

        const result = await geocoderRue(nom, communeCodePostal, communeNom, controller.signal);
        if (controller.signal.aborted) break;

        if (result) {
          cacheRef.current.set(nom, result);
          setLocalisees((prev) => {
            const sans = prev.filter((v) => v.nom !== nom);
            return [...sans, { nom, label: result.label, impact, lat: result.lat, lng: result.lng }];
          });
        }
      }

      if (!controller.signal.aborted) setEnChargement(false);
    }, 800);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiesKey, communeCodePostal]);

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
          <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1F1B" }}>
            Apercu carte{communeNom ? ` — ${communeNom}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {enChargement && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B6A60" }}>
              <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
              Recherche...
            </span>
          )}
          {localisees.length > 0 && (
            <span style={{ fontSize: 10, color: "#6B6A60" }}>
              {localisees.length} voie{localisees.length > 1 ? "s" : ""} localisee{localisees.length > 1 ? "s" : ""}
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
          <FitMarkers voies={localisees} centre={centre} />

          {localisees.map((v, i) => (
            <Marker
              key={`${v.nom}_${i}`}
              position={[v.lat, v.lng]}
              icon={pinIcon(couleur(v.impact))}
            >
              <Popup>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12 }}>
                  <strong>{v.nom}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: "#6B6A60" }}>{v.label}</span>
                  <br />
                  <span style={{
                    display: "inline-block", marginTop: 4,
                    fontSize: 10, fontWeight: 600, padding: "2px 6px",
                    borderRadius: 10, background: couleur(v.impact) + "22",
                    color: couleur(v.impact),
                  }}>
                    {TYPES_IMPACT.find((t) => t.code === v.impact)?.label ?? v.impact}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Cercle de zone d'impact autour de chaque voie */}
          {localisees.map((v, i) => (
            <Circle
              key={`zone_${v.nom}_${i}`}
              center={[v.lat, v.lng]}
              radius={80}
              pathOptions={{
                color: couleur(v.impact),
                fillColor: couleur(v.impact),
                fillOpacity: 0.12,
                weight: 2,
                opacity: 0.5,
                dashArray: "5 5",
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
        {localisees.length > 0 && (
          <div style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "rgba(255,255,255,0.92)",
            borderRadius: 6,
            padding: "6px 10px",
            backdropFilter: "blur(4px)",
            zIndex: 400,
            maxWidth: "70%",
          }}>
            {localisees.map((v, i) => {
              const ti = TYPES_IMPACT.find((t) => t.code === v.impact);
              return (
                <div key={`leg_${i}`} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: i < localisees.length - 1 ? 3 : 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: couleur(v.impact), flexShrink: 0, border: "1px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
                  <span style={{ fontSize: 10, color: "#1C1F1B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {v.nom}
                    {ti && <span style={{ color: "#6B6A60" }}> · {ti.label}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
