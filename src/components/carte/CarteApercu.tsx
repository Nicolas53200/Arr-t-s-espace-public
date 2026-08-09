/**
 * CarteApercu — carte de prévisualisation en lecture seule.
 *
 * Affiche les voies déclarées dans le formulaire en les surlignant
 * sur la carte grâce aux tracés obtenus via Nominatim (OpenStreetMap).
 *
 * Debounce de 800ms après la dernière frappe.
 * Respect du rate-limit Nominatim : 1 requête/seconde.
 * Fallback vers api-adresse.data.gouv.fr pour les voies non trouvées.
 */
import { useEffect, useRef, useState, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
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
  /** Segments de la rue [[lat,lng][], ...]. Vide si point seul. */
  segments: [number, number][][];
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

/** Ajuste la vue pour contenir toutes les voies */
function FitVoies({ voies, centre }: { voies: VoieLocalisee[]; centre?: [number, number] }) {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    if (voies.length === 0) return;

    const allPoints: [number, number][] = voies.flatMap((v) =>
      v.segments.length > 0
        ? v.segments.flat()
        : [[v.lat, v.lng] as [number, number]],
    );

    const key = allPoints.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join("|");
    if (key === prevKey.current) return;
    prevKey.current = key;

    if (allPoints.length === 1) {
      map.setView(allPoints[0]!, 16);
    } else {
      const bounds = L.latLngBounds(allPoints);
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

/** Pause entre requêtes Nominatim (rate-limit 1 req/s) */
function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalise pour comparaison */
function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface GeoResult {
  label: string;
  lat: number;
  lng: number;
  segments: [number, number][][];
}

/**
 * Géocode via Nominatim avec polygon_geojson pour obtenir le tracé des rues.
 */
async function geocoderNominatim(
  nom: string,
  communeNom: string | undefined,
  signal: AbortSignal,
): Promise<GeoResult | null> {
  try {
    const query = communeNom ? `${nom}, ${communeNom}` : nom;
    const params = new URLSearchParams({
      q: query,
      format: "json",
      polygon_geojson: "1",
      limit: "5",
      countrycodes: "fr",
    });

    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { signal },
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    if (!data || data.length === 0) return null;

    // Préférer les résultats de type "highway" (rues) avec la meilleure correspondance textuelle
    const nomNorm = normaliser(nom);
    let best = data[0];
    let bestScore = -1;
    for (const r of data) {
      let score = 0;
      if (r.class === "highway") score += 2;
      const rNorm = normaliser((r.display_name ?? "").split(",")[0] ?? "");
      if (rNorm === nomNorm) score += 3;
      else if (rNorm.includes(nomNorm) || nomNorm.includes(rNorm)) score += 1;
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }

    const lat = parseFloat(best.lat);
    const lng = parseFloat(best.lon);
    const label = (best.display_name ?? nom).split(",").slice(0, 3).join(",").trim();

    // Extraire la géométrie
    if (best.geojson) {
      const geo = best.geojson;
      if (geo.type === "LineString" && geo.coordinates?.length > 1) {
        const coords: [number, number][] = geo.coordinates.map(
          ([lon, la]: [number, number]) => [la, lon] as [number, number],
        );
        return { label, lat, lng, segments: [coords] };
      }
      if (geo.type === "MultiLineString" && geo.coordinates?.length > 0) {
        const segments: [number, number][][] = geo.coordinates.map(
          (line: [number, number][]) =>
            line.map(([lon, la]: [number, number]) => [la, lon] as [number, number]),
        );
        return { label, lat, lng, segments };
      }
    }

    // Point seul (pas de tracé linéaire)
    return { label, lat, lng, segments: [] };
  } catch {
    return null;
  }
}

/**
 * Fallback : API Adresse (api-adresse.data.gouv.fr) — point seul.
 */
async function geocoderApiAdresse(
  nom: string,
  codePostal: string | undefined,
  communeNom: string | undefined,
  signal: AbortSignal,
): Promise<GeoResult | null> {
  try {
    const params = new URLSearchParams({
      q: codePostal ? nom : communeNom ? `${nom}, ${communeNom}` : nom,
      limit: "3",
      autocomplete: "1",
    });
    if (codePostal) {
      params.set("postcode", codePostal);
      params.set("type", "street");
    }

    const resp = await fetch(
      `https://api-adresse.data.gouv.fr/search/?${params}`,
      { signal },
    );
    if (!resp.ok) return null;

    const data = await resp.json();
    const features = data.features;
    if (!features || features.length === 0) return null;

    const best = features[0];
    if (best.properties.score < 0.15) return null;

    const [lng, lat] = best.geometry.coordinates as [number, number];
    return {
      label: best.properties.label ?? nom,
      lat,
      lng,
      segments: [],
    };
  } catch {
    return null;
  }
}

export default function CarteApercu({ centre, communeCodePostal, communeNom, voies }: Props) {
  const [localisees, setLocalisees] = useState<VoieLocalisee[]>([]);
  const [enChargement, setEnChargement] = useState(false);
  const cacheRef = useRef<Map<string, GeoResult>>(new Map());

  // Clé stable pour détecter un vrai changement de contenu
  const voiesKey = useMemo(
    () => voies.map((v) => `${v.nom}|${v.impact}`).join(";;"),
    [voies],
  );

  useEffect(() => {
    const voiesValides = voies.filter((v) => v.nom.trim().length >= 3);

    // Résultats en cache
    const fromCache: VoieLocalisee[] = [];
    const aGeocoder: { nom: string; impact: CodeImpact }[] = [];

    for (const v of voiesValides) {
      const cached = cacheRef.current.get(v.nom);
      if (cached) {
        fromCache.push({
          nom: v.nom,
          label: cached.label,
          impact: v.impact,
          lat: cached.lat,
          lng: cached.lng,
          segments: cached.segments,
        });
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
      let reqIndex = 0;
      for (const { nom, impact } of aGeocoder) {
        if (controller.signal.aborted) break;

        // Respect rate-limit Nominatim : 1.1s entre chaque requête
        if (reqIndex > 0) await attendre(1100);
        reqIndex++;

        // Vérifier le cache
        const cached = cacheRef.current.get(nom);
        if (cached) {
          setLocalisees((prev) => {
            if (prev.some((v) => v.nom === nom)) return prev;
            return [
              ...prev,
              { nom, label: cached.label, impact, lat: cached.lat, lng: cached.lng, segments: cached.segments },
            ];
          });
          continue;
        }

        // 1) Essayer Nominatim (tracé des rues)
        let result = await geocoderNominatim(nom, communeNom, controller.signal);
        if (controller.signal.aborted) break;

        // 2) Fallback vers API Adresse si Nominatim échoue
        if (!result) {
          result = await geocoderApiAdresse(nom, communeCodePostal, communeNom, controller.signal);
          if (controller.signal.aborted) break;
        }

        if (result) {
          const r = result;
          cacheRef.current.set(nom, r);
          setLocalisees((prev) => {
            const sans = prev.filter((v) => v.nom !== nom);
            return [
              ...sans,
              { nom, label: r.label, impact, lat: r.lat, lng: r.lng, segments: r.segments },
            ];
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
          <FitVoies voies={localisees} centre={centre} />

          {localisees.map((v, i) =>
            v.segments.length > 0 ? (
              /* ─── Polyline : rue surlignée ─── */
              <Fragment key={`voie_${v.nom}_${i}`}>
                {v.segments.map((seg, si) => (
                  <Fragment key={`seg_${i}_${si}`}>
                    {/* Halo lumineux */}
                    <Polyline
                      positions={seg}
                      pathOptions={{
                        color: couleur(v.impact),
                        weight: 14,
                        opacity: 0.2,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                    {/* Tracé principal */}
                    <Polyline
                      positions={seg}
                      pathOptions={{
                        color: couleur(v.impact),
                        weight: 5,
                        opacity: 0.85,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    >
                      {si === 0 && (
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
                      )}
                    </Polyline>
                  </Fragment>
                ))}
              </Fragment>
            ) : (
              /* ─── Fallback : point (cercle) ─── */
              <CircleMarker
                key={`point_${v.nom}_${i}`}
                center={[v.lat, v.lng]}
                radius={10}
                pathOptions={{
                  color: couleur(v.impact),
                  fillColor: couleur(v.impact),
                  fillOpacity: 0.3,
                  weight: 3,
                  opacity: 0.8,
                }}
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
              </CircleMarker>
            ),
          )}
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
                  <div style={{
                    width: v.segments.length > 0 ? 16 : 8,
                    height: v.segments.length > 0 ? 3 : 8,
                    borderRadius: v.segments.length > 0 ? 2 : "50%",
                    background: couleur(v.impact),
                    flexShrink: 0,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }} />
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
