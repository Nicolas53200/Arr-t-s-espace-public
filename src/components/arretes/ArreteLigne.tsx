import { useState } from "react";
import { CheckCircle2, AlertOctagon, GitBranch, Archive, ChevronUp, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { STATUT_UI } from "@/config/theme";
import { estExpire } from "@/lib/arrete";
import { fmtDate } from "@/lib/date";
import type { Arrete } from "@/types";

interface ArreteLigneProps {
  arrete: Arrete;
  onModifier?: () => void;
  onAbroger?: () => void;
  compact?: boolean;
  archive?: boolean;
}

export default function ArreteLigne({ arrete, onModifier, onAbroger, compact, archive }: ArreteLigneProps) {
  const [ouvert, setOuvert] = useState(false);
  const statut = STATUT_UI[arrete.statut] || STATUT_UI.publie;
  const expire = estExpire(arrete);
  const peutModifier = !archive && arrete.statut !== "abroge";
  return (
    <div className="card-hover" style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: compact ? "11px 13px" : "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: statut.bg, color: statut.color, whiteSpace: "nowrap" }}>
              {arrete.statut === "publie" && <CheckCircle2 size={9} />}{arrete.statut === "abroge" && <AlertOctagon size={9} />}{arrete.statut === "modifie" && <GitBranch size={9} />}{statut.label}
            </span>
            {expire && arrete.statut !== "abroge" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "#F3F4F6", color: "#6B7280", whiteSpace: "nowrap" }}><Archive size={9} />Archivé auto.</span>}
            <span className="fm" style={{ fontSize: 10, color: "#6B6A60" }}>{arrete.numero}</span>
            <span style={{ fontSize: 10, color: "#A6A399" }}>{arrete.type_label}</span>
          </div>
          <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{arrete.titre}</p>
          {!compact && <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 2px" }}>{fmtDate(arrete.date_debut)} → {fmtDate(arrete.date_fin)} · {arrete.cree_par}</p>}
          <p style={{ fontSize: 10, color: "#A6A399", margin: 0 }}>{arrete.voies.slice(0, 2).join(", ")}{arrete.voies.length > 2 ? ` +${arrete.voies.length - 2}` : ""}</p>
          {arrete.arrete_abrogation && <div style={{ marginTop: 6, background: "#FEE2E2", borderRadius: 5, padding: "5px 9px", fontSize: 10 }}><p style={{ fontWeight: 600, color: "#B91C1C", margin: "0 0 1px", display: "flex", alignItems: "center", gap: 3 }}><AlertOctagon size={10} />Abrogé par {arrete.arrete_abrogation.numero}</p><p style={{ color: "#7F1D1D", margin: 0 }}>{arrete.arrete_abrogation.motif}</p></div>}
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {arrete.versions.length > 0 && <button className="btn-secondary" onClick={() => setOuvert(o => !o)} style={{ padding: "4px 9px", fontSize: 10 }}><GitBranch size={10} />{arrete.versions.length}v {ouvert ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</button>}
            {peutModifier && <button className="btn-secondary" onClick={onModifier} style={{ padding: "4px 9px", fontSize: 10 }}><Edit2 size={10} />Modifier</button>}
            {peutModifier && <button className="btn-danger" onClick={onAbroger} style={{ padding: "4px 9px", fontSize: 10 }}><Trash2 size={10} />Abroger</button>}
          </div>
        )}
      </div>
      {ouvert && arrete.versions.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0EDE4" }}>
          {arrete.versions.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7, padding: "6px 8px", background: "#F9F8F5", borderRadius: 4, marginBottom: 4 }}>
              <span className="fm" style={{ fontSize: 9, background: "#E5E7EB", color: "#6B7280", padding: "1px 4px", borderRadius: 3, flexShrink: 0, marginTop: 1 }}>v{v.version}</span>
              <div><p style={{ fontWeight: 600, fontSize: 11, margin: "0 0 1px" }}>{v.titre}</p><p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 1px", fontStyle: "italic" }}>"{v.motif}"</p><p style={{ fontSize: 10, color: "#A6A399", margin: 0 }}>{fmtDate(v.date)} · {v.auteur}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
