import { createContext, useContext, useCallback, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;

const DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 4000,
  info: 4000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        return next.slice(-MAX_TOASTS);
      });
      setTimeout(() => {
        removeToast(id);
      }, DURATIONS[type]);
    },
    [removeToast],
  );

  const success = useCallback((message: string) => addToast("success", message), [addToast]);
  const error = useCallback((message: string) => addToast("error", message), [addToast]);
  const warning = useCallback((message: string) => addToast("warning", message), [addToast]);
  const info = useCallback((message: string) => addToast("info", message), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, warning, info, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit etre utilise dans un ToastProvider");
  }
  return ctx;
}
