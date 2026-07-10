import { useState } from "react";
import { AlertOctagon } from "lucide-react";
import Modal from "@/components/common/Modal";
import type { Arrete } from "@/types";

interface ModalAbrogationProps {
  arrete: Arrete;
  onOk: (motif: string) => void;
  onCancel: () => void;
}

export default function ModalAbrogation({ arrete, onOk, onCancel }: ModalAbrogationProps) {
  const [motif, setMotif] = useState("");
  return (
    <Modal>
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertOctagon size={18} color="#B91C1C" />
          </div>
          <div>
            <h3 className="fd" style={{ fontSize: 16, margin: "0 0 2px" }}>Abroger</h3>
            <p className="fm" style={{ fontSize: 10, color: "#1E3A5F", margin: 0 }}>{arrete.numero}</p>
          </div>
        </div>
        <div style={{ background: "#FEF3C7", borderRadius: 5, padding: "7px 11px", marginBottom: 12, fontSize: 11, color: "#92400E" }}>
          Un arrêté d'abrogation sera généré automatiquement. L'original reste consultable.
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Motif <span style={{ color: "#B91C1C" }}>*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Ex. Travaux terminés, voie rouverte."
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            style={{ resize: "vertical", width: "100%", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, border: "1px solid #D8D5C8", borderRadius: 4, padding: "7px 9px" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 7 }}>
          <button className="btn-secondary" onClick={onCancel}>Annuler</button>
          <button
            className="btn-danger"
            onClick={() => motif.trim() && onOk(motif)}
            style={{ opacity: motif.trim() ? 1 : 0.5, cursor: motif.trim() ? "pointer" : "not-allowed", fontSize: 12 }}
          >
            <AlertOctagon size={11} />Générer l'abrogation
          </button>
        </div>
      </div>
    </Modal>
  );
}
