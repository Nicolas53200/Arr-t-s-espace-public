interface EmptyStateProps {
  texte: string;
}

export default function EmptyState({ texte }: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: "#A6A399", fontSize: 13 }}>
      {texte}
    </div>
  );
}
