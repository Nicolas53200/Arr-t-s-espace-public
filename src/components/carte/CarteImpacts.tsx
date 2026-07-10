import { useMemo } from "react";
import { couleurImpact } from "@/lib/voie";
import { VOIES } from "@/data/voies";
import { TYPES_IMPACT } from "@/data/types-impact";
import type { Arrete } from "@/types";

interface CarteImpactsProps {
  arretes: Arrete[];
  arreteSelectionne?: Arrete | null;
  onSelectArrete?: (a: Arrete | null) => void;
  onTooltip?: (t: { x: number; y: number; voie: string; arretes: Arrete[] } | null) => void;
}

export default function CarteImpacts({ arretes, arreteSelectionne, onSelectArrete, onTooltip }: CarteImpactsProps) {
  const impactsParVoie = useMemo(() => {
    const map: Record<string, { impact: string; arrete: Arrete }[]> = {};
    for (const a of arretes) {
      if (!a.troncons) continue;
      for (const t of a.troncons) {
        if (!map[t.voie_id]) map[t.voie_id] = [];
        map[t.voie_id]!.push({ impact: t.impact, arrete: a });
      }
    }
    return map;
  }, [arretes]);

  function couleurVoie(vid: string) {
    const impacts = impactsParVoie[vid];
    if (!impacts || impacts.length === 0) return null;
    const priorite = ["circulation_interdite", "stationnement_interdit", "deviation", "zone_reservee", "passage_maintenu"];
    for (const p of priorite) {
      if (impacts.some((i) => i.impact === p)) return couleurImpact(p);
    }
    return couleurImpact(impacts[0]!.impact);
  }

  function arretesVoie(vid: string) {
    return (impactsParVoie[vid] || []).map((i) => i.arrete);
  }

  return (
    <div style={{ border: "1px solid #E4E1D6", borderRadius: 10, background: "#FFFFFF", padding: 20, position: "relative" }}>
      <svg viewBox="0 0 360 340" style={{ width: "100%", height: "auto", maxHeight: 680 }}
        onMouseLeave={() => onTooltip?.(null)}>
        <rect width="360" height="340" fill="#F4F2EC" rx="4" />
        <rect x="30" y="30" width="25" height="25" fill="#E8E4D8" rx="2" />
        <rect x="130" y="200" width="30" height="30" fill="#E8E4D8" rx="2" />
        <rect x="280" y="60" width="40" height="35" fill="#E8E4D8" rx="2" />
        <rect x="200" y="290" width="35" height="25" fill="#E8E4D8" rx="2" />

        {VOIES.map((v) => {
          const coul = couleurVoie(v.id);
          const asList = arretesVoie(v.id);
          const actif = !!coul;
          const selectionne = arreteSelectionne && asList.some((a) => a.id === arreteSelectionne?.id);

          return v.isZone ? (
            <path key={v.id} d={v.path} className="tr-voie"
              fill={actif ? `${coul}44` : "#D8D5C822"}
              stroke={actif ? coul : "#C9C6BA"}
              strokeWidth={actif ? (selectionne ? 8 : 5) : 2}
              opacity={arreteSelectionne && !selectionne && actif ? 0.4 : 1}
              onMouseEnter={(e) => asList.length > 0 && onTooltip?.({ x: e.clientX, y: e.clientY, voie: v.nom, arretes: asList })}
              onMouseLeave={() => onTooltip?.(null)}
              onClick={() => onSelectArrete?.(asList[0] || null)}
            />
          ) : (
            <path key={v.id} d={v.path} className="tr-voie"
              fill="none"
              stroke={actif ? coul : "#C9C6BA"}
              strokeWidth={actif ? (selectionne ? 9 : 6) : 3}
              strokeLinecap="round"
              opacity={arreteSelectionne && !selectionne && actif ? 0.35 : 1}
              onMouseEnter={(e) => asList.length > 0 && onTooltip?.({ x: e.clientX, y: e.clientY, voie: v.nom, arretes: asList })}
              onMouseLeave={() => onTooltip?.(null)}
              onClick={() => onSelectArrete?.(asList[0] || null)}
            />
          );
        })}

        {Object.entries(impactsParVoie).filter(([, v]) => v.length > 1).map(([vid, impacts]) => {
          const voie = VOIES.find((v) => v.id === vid);
          if (!voie) return null;
          return (
            <g key={`multi-${vid}`}>
              <circle cx={voie.cx} cy={voie.cy} r={10} fill="#1C1F1B" opacity={0.85} />
              <text x={voie.cx} y={voie.cy + 4} textAnchor="middle" fill="#fff" fontSize={10} fontFamily="'IBM Plex Mono',monospace" fontWeight="bold">{impacts.length}</text>
            </g>
          );
        })}

        {VOIES.filter((v) => couleurVoie(v.id)).map((v) => (
          <text key={`lbl-${v.id}`} x={v.cx} y={v.cy - 10} textAnchor="middle" fill="#1C1F1B"
            fontSize={8} fontFamily="'IBM Plex Sans',sans-serif" opacity={0.6} style={{ pointerEvents: "none" }}>
            {v.nom.length > 20 ? v.nom.slice(0, 18) + "…" : v.nom}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 12px", marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0EDE4" }}>
        {TYPES_IMPACT.map((ti) => (
          <span key={ti.code} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B6A60" }}>
            <span style={{ width: 14, height: 4, background: ti.couleur, borderRadius: 2, display: "inline-block" }} />
            {ti.label}
          </span>
        ))}
      </div>
    </div>
  );
}
