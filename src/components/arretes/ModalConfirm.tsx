import type { ReactNode } from "react";
import Modal from "@/components/common/Modal";

interface ModalConfirmProps {
  titre: string;
  message: string;
  icone: ReactNode;
  couleurIcone: string;
  labelOk: string;
  couleurOk: string;
  onOk: () => void;
  onCancel: () => void;
}

export default function ModalConfirm({ titre, message, icone, couleurIcone, labelOk, couleurOk, onOk, onCancel }: ModalConfirmProps) {
  return (
    <Modal>
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: couleurIcone, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icone}</div>
          <div>
            <h3 className="fd" style={{ fontSize: 16, margin: "0 0 4px" }}>{titre}</h3>
            <p style={{ fontSize: 12, color: "#6B6A60", margin: 0 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn-secondary" onClick={onCancel}>Annuler</button>
          <button onClick={onOk} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: couleurOk, color: "#FAFAF7", fontFamily: "'IBM Plex Sans', sans-serif" }}>{labelOk}</button>
        </div>
      </div>
    </Modal>
  );
}
