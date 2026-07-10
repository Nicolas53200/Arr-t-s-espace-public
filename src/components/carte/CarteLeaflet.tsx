import { useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Arrete } from "@/types";
import { VOIES } from "@/data/voies";
import { getVoieGeo } from "@/data/voies-geo";
import { TYPES_IMPACT } from "@/data/types-impact";
import { couleurImpact } from "@/lib/voie";
import { fmtDateCourte } from "@/lib/date";
import type { Feature, Geometry, GeoJsonProperties } from "geojson";

interface CarteLeafletProps {
  arretes: Arrete[];
  onSelectArrete?: (arrete: Arrete | null) => void;
  arreteSelectionne?: Arrete | null;
  filtreType?: string;
}

const CENTRE_VILLE: [number, number] = [47.6545, -2.7563];
const ZOOM_DEFAUT = 16;

// Impact color mapping (same as CarteImpacts)
const IMPACT_COULEURS: Record<string, string> = {
  circulation_interdite: "#B91C1C",
  stationnement_interdit: "#D9730D",
  deviation: "#7C3AED",
  zone_reservee: "#0369A1",
  passage_maintenu: "#2F6B4F",
};

// Priority order for determining the displayed color when multiple impacts overlap
const PRIORITE_IMPACT = [
  "circulation_interdite",
  "stationnement_interdit",
  "deviation",
  "zone_reservee",
  "passage_maintenu",
];

interface VoieFeatureProps {
  voie_id: string;
  voie_nom: string;
  couleur: string;
  impacts: { impact: string; arrete: Arrete }[];
  isSelected: boolean;
  hasSelection: boolean;
}

function buildFeatures(
  arretes: Arrete[],
  arreteSelectionne: Arrete | null | undefined
): { features: Feature<Geometry, VoieFeatureProps>[]; key: string } {
  const impactsParVoie: Record<string, { impact: string; arrete: Arrete }[]> =
    {};
  for (const a of arretes) {
    if (!a.troncons) continue;
    for (const t of a.troncons) {
      if (!impactsParVoie[t.voie_id]) impactsParVoie[t.voie_id] = [];
      impactsParVoie[t.voie_id]!.push({ impact: t.impact, arrete: a });
    }
  }

  const features: Feature<Geometry, VoieFeatureProps>[] = [];
  const selectedId = arreteSelectionne?.id ?? null;

  for (const [voieId, impacts] of Object.entries(impactsParVoie)) {
    const vgeo = getVoieGeo(voieId);
    if (!vgeo) continue;

    // Determine the dominant color by impact priority
    let couleur = couleurImpact(impacts[0]!.impact);
    for (const p of PRIORITE_IMPACT) {
      if (impacts.some((i) => i.impact === p)) {
        couleur = couleurImpact(p);
        break;
      }
    }

    const voie = VOIES.find((v) => v.id === voieId);
    const isSelected =
      selectedId !== null && impacts.some((i) => i.arrete.id === selectedId);

    const geometry: Geometry =
      vgeo.geometrie.type === "Polygon"
        ? {
            type: "Polygon",
            coordinates: [vgeo.geometrie.coordinates],
          }
        : {
            type: "LineString",
            coordinates: vgeo.geometrie.coordinates,
          };

    features.push({
      type: "Feature",
      geometry,
      properties: {
        voie_id: voieId,
        voie_nom: voie?.nom ?? voieId,
        couleur,
        impacts,
        isSelected,
        hasSelection: selectedId !== null,
      },
    });
  }

  // Build a deterministic key so React re-renders GeoJSON when data changes
  const key = [
    arretes.map((a) => a.id).join(","),
    selectedId ?? "none",
  ].join("|");

  return { features, key };
}

export default function CarteLeaflet({
  arretes,
  onSelectArrete,
  arreteSelectionne,
}: CarteLeafletProps) {
  const { features, key } = useMemo(
    () => buildFeatures(arretes, arreteSelectionne),
    [arretes, arreteSelectionne]
  );

  const featureCollection: GeoJSON.FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features,
    }),
    [features]
  );

  const style = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties> | undefined) => {
      if (!feature) return {};
      const props = feature.properties as VoieFeatureProps;
      const isPolygon = feature.geometry.type === "Polygon";

      return {
        color: props.couleur,
        weight: props.isSelected ? 8 : 5,
        opacity: props.hasSelection && !props.isSelected ? 0.3 : 0.85,
        fillColor: isPolygon ? props.couleur : undefined,
        fillOpacity: isPolygon
          ? props.isSelected
            ? 0.35
            : props.hasSelection && !props.isSelected
              ? 0.1
              : 0.25
          : 0,
        lineCap: "round" as const,
        lineJoin: "round" as const,
      };
    },
    []
  );

  const onEachFeature = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>, layer: L.Layer) => {
      const props = feature.properties as VoieFeatureProps;

      // Build popup HTML
      const popupHtml = `
        <div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;max-width:220px;">
          <strong style="font-size:13px;color:#1C1F1B;">${props.voie_nom}</strong>
          ${props.impacts
            .map(
              (i: { impact: string; arrete: Arrete }) => `
            <div style="margin-top:6px;padding:4px 0;border-top:1px solid #F0EDE4;">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${IMPACT_COULEURS[i.impact] ?? "#6B6A60"};display:inline-block;flex-shrink:0;"></span>
                <span style="font-weight:600;color:#1C1F1B;">${i.arrete.numero}</span>
              </div>
              <div style="color:#1C1F1B;margin-bottom:2px;">${i.arrete.titre}</div>
              <div style="color:#A6A399;font-size:10px;">${fmtDateCourte(i.arrete.date_debut)} → ${fmtDateCourte(i.arrete.date_fin)}</div>
              <div style="margin-top:2px;">
                <span style="font-size:10px;padding:1px 6px;border-radius:10px;background:${IMPACT_COULEURS[i.impact] ?? "#6B6A60"}22;color:${IMPACT_COULEURS[i.impact] ?? "#6B6A60"};font-weight:600;">
                  ${TYPES_IMPACT.find((t) => t.code === i.impact)?.label ?? i.impact}
                </span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      layer.bindPopup(popupHtml, {
        maxWidth: 260,
        className: "carte-leaflet-popup",
      });

      layer.on("click", () => {
        if (props.impacts.length > 0) {
          onSelectArrete?.(props.impacts[0]!.arrete);
        }
      });
    },
    [onSelectArrete]
  );

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={CENTRE_VILLE}
        zoom={ZOOM_DEFAUT}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          border: "1px solid #E4E1D6",
          zIndex: 1,
        }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {featureCollection.features.length > 0 && (
          <GeoJSON
            key={key}
            data={featureCollection}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 12px",
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #F0EDE4",
        }}
      >
        {TYPES_IMPACT.map((ti) => (
          <span
            key={ti.code}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              color: "#6B6A60",
            }}
          >
            <span
              style={{
                width: 14,
                height: 4,
                background: ti.couleur,
                borderRadius: 2,
                display: "inline-block",
              }}
            />
            {ti.label}
          </span>
        ))}
      </div>
    </div>
  );
}
