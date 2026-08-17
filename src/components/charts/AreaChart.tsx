interface AreaChartDonnee {
  label: string;
  valeur: number;
}

interface AreaChartProps {
  data: AreaChartDonnee[];
  hauteur?: number;
  largeur?: number;
  couleur?: string;
  couleurFill?: string;
  afficherPoints?: boolean;
}

export default function AreaChart({
  data,
  hauteur = 200,
  largeur = 600,
  couleur = "#1E3A5F",
  couleurFill,
  afficherPoints = true,
}: AreaChartProps) {
  if (data.length < 2) return null;

  const margeG = 38;
  const margeD = 12;
  const margeH = 20;
  const margeB = 44;

  const zoneW = largeur - margeG - margeD;
  const zoneH = hauteur - margeH - margeB;
  const maxVal = Math.max(...data.map((d) => d.valeur), 1);

  const points = data.map((d, i) => {
    const x = margeG + (i / (data.length - 1)) * zoneW;
    const y = margeH + zoneH - (d.valeur / maxVal) * zoneH;
    return { x, y, label: d.label, valeur: d.valeur };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const premier = points[0]!;
  const dernier = points[points.length - 1]!;
  const fillPath = `${linePath} L ${dernier.x.toFixed(1)} ${(margeH + zoneH).toFixed(1)} L ${premier.x.toFixed(1)} ${(margeH + zoneH).toFixed(1)} Z`;

  // Lignes de grille (4 niveaux)
  const grille = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i));

  const fill = couleurFill ?? couleur;

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Grille */}
      {grille.map((val) => {
        const y = margeH + zoneH - (val / maxVal) * zoneH;
        return (
          <g key={`g-${val}`}>
            <line x1={margeG} x2={largeur - margeD} y1={y} y2={y} stroke="#E4E1D6" strokeWidth={0.5} />
            <text x={margeG - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#A6A399" fontFamily="'IBM Plex Mono',monospace">
              {val}
            </text>
          </g>
        );
      })}

      {/* Dégradé */}
      <defs>
        <linearGradient id={`area-grad-${couleur.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.25" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Aire remplie */}
      <path d={fillPath} fill={`url(#area-grad-${couleur.replace("#", "")})`} />

      {/* Ligne */}
      <path d={linePath} fill="none" stroke={couleur} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points et labels */}
      {points.map((p, i) => (
        <g key={`pt-${i}`}>
          {afficherPoints && (
            <circle cx={p.x} cy={p.y} r={3} fill="#FFFFFF" stroke={couleur} strokeWidth={1.5} />
          )}
          {/* Valeur au dessus (seulement si pas trop serré) */}
          {afficherPoints && data.length <= 12 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill="#1C1F1B" fontFamily="'IBM Plex Mono',monospace" fontWeight={600}>
              {p.valeur}
            </text>
          )}
          {/* Label X */}
          <text
            x={p.x}
            y={margeH + zoneH + 16}
            textAnchor="middle"
            fontSize={8}
            fill="#6B6A60"
            fontFamily="'IBM Plex Sans',sans-serif"
            transform={data.length > 8 ? `rotate(-30, ${p.x}, ${margeH + zoneH + 16})` : undefined}
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
