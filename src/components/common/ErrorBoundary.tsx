import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Erreur capturee :", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            padding: 40,
            textAlign: "center",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={28} color="#DC2626" />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1C1F1B",
              margin: "0 0 8px",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Une erreur est survenue
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6B6A60",
              margin: "0 0 24px",
              maxWidth: 400,
              lineHeight: 1.6,
            }}
          >
            L'application a rencontre un probleme inattendu. Veuillez recharger la page pour continuer.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 24px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: "#1E3A5F",
              color: "#FAFAF7",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            Recharger
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
