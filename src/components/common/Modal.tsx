import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
}

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000055",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {children}
    </div>
  );
}
