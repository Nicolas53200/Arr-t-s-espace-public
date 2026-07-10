export default function LoadingSpinner() {
  return (
    <>
      <style>{`
        @keyframes spinner-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          gap: 14,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid #E4E1D6",
            borderTopColor: "#1E3A5F",
            borderRadius: "50%",
            animation: "spinner-rotate 0.8s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: "#6B6A60",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          Chargement...
        </span>
      </div>
    </>
  );
}
