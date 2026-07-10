interface BarChartDonnee {
  label: string;
  value: number;
  couleur?: string;
}

interface BarChartProps {
  data: BarChartDonnee[];
  hauteur?: number;
  largeur?: number;
}

const COULEURS_DEFAUT = ["#1E3A5F", "#2F6B4F"];

export default function BarChart({
  data,
  hauteur = 220,
  largeur = 500,
}: BarChartProps) {
  if (data.length === 0) return null;

  const margeGauche = 36;
  const margeDroite = 12;
  const margeHaut = 24;
  const margeBas = 48;

  const zoneW = largeur - margeGauche - margeDroite;
  const zoneH = hauteur - margeHaut - margeBas;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(40, (zoneW / data.length) * 0.65);
  const gap = zoneW / data.length;

  const lignesGrille = Array.from({ length: 5 }, (_, i) =>
    Math.round((maxVal / 4) * i),
  );

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Grille */}
      {lignesGrille.map((val) => {
        const y = margeHaut + zoneH - (val / maxVal) * zoneH;
        return (
          <g key={`grille-${val}`}>
            <line
              x1={margeGauche}
              x2={largeur - margeDroite}
              y1={y}
              y2={y}
              stroke="#E4E1D6"
              strokeWidth={1}
            />
            <text
              x={margeGauche - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill="#6B6A60"
              fontFamily="'IBM Plex Mono', monospace"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Barres */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * zoneH;
        const x = margeGauche + i * gap + (gap - barW) / 2;
        const y = margeHaut + zoneH - barH;
        const couleur =
          d.couleur ?? COULEURS_DEFAUT[i % COULEURS_DEFAUT.length];

        return (
          <g key={`bar-${d.label}-${i}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={couleur}
              rx={3}
            />
            {/* Valeur au-dessus */}
            <text
              x={x + barW / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize={10}
              fill="#1C1F1B"
              fontFamily="'IBM Plex Mono', monospace"
              fontWeight={600}
            >
              {d.value}
            </text>
            {/* Label en bas */}
            <text
              x={x + barW / 2}
              y={margeHaut + zoneH + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#6B6A60"
              fontFamily="'IBM Plex Sans', sans-serif"
              transform={`rotate(-30, ${x + barW / 2}, ${margeHaut + zoneH + 16})`}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
