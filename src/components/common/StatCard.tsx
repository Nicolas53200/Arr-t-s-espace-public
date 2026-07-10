interface StatCardProps {
  label: string;
  valeur: number | string;
  couleur: string;
}

export default function StatCard({ label, valeur, couleur }: StatCardProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#6B6A60" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: couleur }}>{valeur}</span>
    </div>
  );
}
