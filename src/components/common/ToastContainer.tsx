import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

type ToastType = "success" | "error" | "warning" | "info";

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string; color: string }> = {
  success: { icon: CheckCircle2, bg: "#D1FAE5", border: "#065F46", color: "#065F46" },
  error: { icon: XCircle, bg: "#FEE2E2", border: "#DC2626", color: "#DC2626" },
  warning: { icon: AlertTriangle, bg: "#FEF3C7", border: "#92400E", color: "#92400E" },
  info: { icon: Info, bg: "#DBEAFE", border: "#1E3A5F", color: "#1E3A5F" },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.type];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 8,
                background: config.bg,
                border: `1px solid ${config.border}`,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                animation: "toast-slide-in 0.3s ease-out",
                pointerEvents: "auto",
                minWidth: 280,
                maxWidth: 420,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <Icon size={16} color={config.color} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: config.color }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  color: config.color,
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
