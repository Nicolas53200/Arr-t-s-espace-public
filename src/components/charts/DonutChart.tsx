interface DonutChartDonnee {
  label: string;
  value: number;
  couleur: string;
}

interface DonutChartProps {
  data: DonutChartDonnee[];
  taille?: number;
}

function decriArc(
  cx: number,
  cy: number,
  rayon: number,
  angleDebut: number,
  angleFin: number,
): string {
  const startRad = ((angleDebut - 90) * Math.PI) / 180;
  const endRad = ((angleFin - 90) * Math.PI) / 180;
  const x1 = cx + rayon * Math.cos(startRad);
  const y1 = cy + rayon * Math.sin(startRad);
  const x2 = cx + rayon * Math.cos(endRad);
  const y2 = cy + rayon * Math.sin(endRad);
  const grandArc = angleFin - angleDebut > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${rayon} ${rayon} 0 ${grandArc} 1 ${x2} ${y2}`;
}

export default function DonutChart({ data, taille = 180 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const cx = taille / 2;
  const cy = taille / 2;
  const rayonExt = taille / 2 - 4;
  const rayonInt = rayonExt * 0.58;
  const epaisseur = rayonExt - rayonInt;

  let angleActuel = 0;

  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle = (d.value / total) * 360;
      const debut = angleActuel;
      // Petit ecart pour separer visuellement les segments
      const fin = angleActuel + angle - (data.length > 1 ? 1.5 : 0);
      angleActuel += angle;

      const rayonMilieu = rayonInt + epaisseur / 2;

      return {
        ...d,
        path: decriArc(cx, cy, rayonMilieu, debut, Math.max(debut + 0.5, fin)),
        epaisseur,
      };
    });

  const legendeH = data.length * 22 + 8;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <svg
        viewBox={`0 0 ${taille} ${taille}`}
        style={{ width: taille, height: taille, maxWidth: "100%" }}
      >
        {segments.map((s, i) => (
          <path
            key={`seg-${s.label}-${i}`}
            d={s.path}
            fill="none"
            stroke={s.couleur}
            strokeWidth={s.epaisseur}
            strokeLinecap="round"
          />
        ))}
        {/* Total au centre */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill="#1C1F1B"
          fontFamily="'IBM Plex Sans', sans-serif"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize={10}
          fill="#6B6A60"
          fontFamily="'IBM Plex Sans', sans-serif"
        >
          total
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minHeight: legendeH,
        }}
      >
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => (
            <div
              key={`leg-${d.label}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontFamily: "'IBM Plex Sans', sans-serif",
                color: "#1C1F1B",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: d.couleur,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#6B6A60" }}>{d.label}</span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                {d.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
