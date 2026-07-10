interface SparkLineProps {
  data: number[];
  largeur?: number;
  hauteur?: number;
  couleur?: string;
}

export default function SparkLine({
  data,
  largeur = 80,
  hauteur = 28,
  couleur = "#1E3A5F",
}: SparkLineProps) {
  if (data.length < 2) return null;

  const padding = 2;
  const w = largeur - padding * 2;
  const h = hauteur - padding * 2;
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * w;
    const y = padding + h - ((v - minVal) / range) * h;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const dernierPoint = points[points.length - 1];
  const premierPoint = points[0];
  if (!dernierPoint || !premierPoint) return null;

  const fillPath = `${linePath} L ${dernierPoint.x} ${hauteur - padding} L ${premierPoint.x} ${hauteur - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      style={{ width: largeur, height: hauteur, display: "block" }}
    >
      <path d={fillPath} fill={couleur} opacity={0.1} />
      <path
        d={linePath}
        fill="none"
        stroke={couleur}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
