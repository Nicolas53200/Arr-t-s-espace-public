import { useEffect, useRef, useState } from "react";
import type { Arrete } from "@/types";
import { VOIES } from "@/data/voies";
import { TYPES_IMPACT } from "@/data/types-impact";
import { COULEUR_TYPE } from "@/config/theme";
import { fmtDateCourte } from "@/lib/date";
import { couleurImpact } from "@/lib/voie";

interface CarteLeafletProps {
  arretes: Arrete[];
  onArreteSelect?: (arrete: Arrete | null) => void;
  selectedArrete?: Arrete | null;
  hauteur?: string;
}

const COORD_VOIES: Record<string, [number, number][]> = {
  v1: [[47.6545, -2.7583], [47.6555, -2.7583]],
  v2: [[47.6535, -2.7583], [47.6545, -2.7583]],
  v3: [[47.6545, -2.7583], [47.6545, -2.7563]],
  v4: [[47.6545, -2.7563], [47.6545, -2.7543]],
  v5: [[47.6555, -2.7573], [47.6545, -2.7573]],
  v6: [[47.6555, -2.7563], [47.6545, -2.7563]],
  v7: [[47.6553, -2.7553], [47.6545, -2.7553]],
  v8: [[47.6545, -2.7543], [47.6535, -2.7543]],
  v9: [[47.6545, -2.7583], [47.6547, -2.7578], [47.6543, -2.7578], [47.6545, -2.7583]],
  v10: [[47.6540, -2.7553], [47.6542, -2.7548], [47.6538, -2.7548], [47.6540, -2.7553]],
  v11: [[47.6545, -2.7573], [47.6535, -2.7573]],
  v12: [[47.6530, -2.7593], [47.6530, -2.7533]],
  v13: [[47.6545, -2.7563], [47.6535, -2.7563]],
  v14: [[47.6550, -2.7583], [47.6550, -2.7563]],
};

const CENTRE_VILLE: [number, number] = [47.6545, -2.7563];
const ZOOM_DEFAUT = 16;

export default function CarteLeaflet({
  arretes,
  onArreteSelect,
  selectedArrete,
  hauteur = "500px",
}: CarteLeafletProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    let L: typeof import("leaflet");
    import("leaflet").then((mod) => {
      L = mod.default;
      setLeafletLoaded(true);

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView(CENTRE_VILLE, ZOOM_DEFAUT);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      layersRef.current = L.layerGroup().addTo(map);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current || !layersRef.current) return;

    import("leaflet").then((mod) => {
      const L = mod.default;
      const layers = layersRef.current!;
      layers.clearLayers();

      const impactsParVoie: Record<string, { impact: string; arrete: Arrete }[]> = {};
      for (const a of arretes) {
        if (!a.troncons) continue;
        for (const t of a.troncons) {
          if (!impactsParVoie[t.voie_id]) impactsParVoie[t.voie_id] = [];
          impactsParVoie[t.voie_id]!.push({ impact: t.impact, arrete: a });
        }
      }

      for (const [voieId, impacts] of Object.entries(impactsParVoie)) {
        const coords = COORD_VOIES[voieId];
        if (!coords || coords.length === 0) continue;

        const priorite = ["circulation_interdite", "stationnement_interdit", "deviation", "zone_reservee", "passage_maintenu"];
        let couleur = couleurImpact(impacts[0]!.impact);
        for (const p of priorite) {
          if (impacts.some((i) => i.impact === p)) {
            couleur = couleurImpact(p);
            break;
          }
        }

        const voie = VOIES.find((v) => v.id === voieId);
        const isSelected = selectedArrete && impacts.some((i) => i.arrete.id === selectedArrete.id);

        const line = L.polyline(coords as [number, number][], {
          color: couleur,
          weight: isSelected ? 8 : 5,
          opacity: selectedArrete && !isSelected ? 0.3 : 0.85,
        });

        const popupContent = `
          <div style="font-family:'IBM Plex Sans',sans-serif;font-size:12px;">
            <strong>${voie?.nom ?? voieId}</strong>
            ${impacts.map((i) => `
              <div style="margin-top:4px;display:flex;align-items:center;gap:5px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${COULEUR_TYPE[i.arrete.type_code as keyof typeof COULEUR_TYPE] ?? "#6B6A60"};display:inline-block;"></span>
                ${i.arrete.titre}
                <span style="color:#999;font-size:10px;">${fmtDateCourte(i.arrete.date_debut)} → ${fmtDateCourte(i.arrete.date_fin)}</span>
              </div>
            `).join("")}
          </div>
        `;

        line.bindPopup(popupContent);
        line.on("click", () => {
          onArreteSelect?.(impacts[0]!.arrete);
        });

        layers.addLayer(line);
      }
    });
  }, [arretes, selectedArrete, leafletLoaded, onArreteSelect]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapRef}
        style={{
          height: hauteur,
          width: "100%",
          borderRadius: "10px",
          border: "1px solid #E4E1D6",
          zIndex: 1,
        }}
      />
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
