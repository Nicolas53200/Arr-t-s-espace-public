import { useState, useMemo } from "react";
import { ClipboardCheck, Inbox } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import WorkflowPanel from "@/components/arretes/WorkflowPanel";
import { fmtDate } from "@/lib/date";
import { couleurStatut, labelStatut } from "@/lib/workflow";

type Filtre = "relecture" | "validation" | "tous";

export default function ValidationPage() {
  const { arretes } = useArretes();
  const [filtre, setFiltre] = useState<Filtre>("tous");

  const enAttente = useMemo(() =>
    arretes.filter((a) => a.statut === "en_relecture" || a.statut === "valide"),
    [arretes]
  );

  const liste = useMemo(() => {
    if (filtre === "relecture") return enAttente.filter((a) => a.statut === "en_relecture");
    if (filtre === "validation") return enAttente.filter((a) => a.statut === "valide");
    return enAttente;
  }, [enAttente, filtre]);

  const compteurRelecture = arretes.filter((a) => a.statut === "en_relecture").length;
  const compteurValidation = arretes.filter((a) => a.statut === "valide").length;

  const onglets: { id: Filtre; label: string; count: number }[] = [
    { id: "tous", label: "Tous", count: enAttente.length },
    { id: "relecture", label: "A relire", count: compteurRelecture },
    { id: "validation", label: "A valider", count: compteurValidation },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <ClipboardCheck size={20} color="#1E3A5F" />
        <h1 style={{ fontSize: 18, margin: 0, color: "#1C1F1B" }}>Validation</h1>
        {enAttente.length > 0 && (
          <span style={{
            background: "#1E3A5F", color: "#fff", borderRadius: 10,
            fontSize: 11, padding: "2px 8px", fontFamily: "'IBM Plex Mono',monospace",
          }}>
            {enAttente.length}
          </span>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid #E4E1D6" }}>
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setFiltre(o.id)}
            style={{
              padding: "8px 16px", fontSize: 12, fontWeight: filtre === o.id ? 600 : 400,
              border: "none", borderBottom: filtre === o.id ? "2px solid #1E3A5F" : "2px solid transparent",
              background: "none", color: filtre === o.id ? "#1E3A5F" : "#6B6A60",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {o.label}
            {o.count > 0 && (
              <span style={{
                background: filtre === o.id ? "#1E3A5F" : "#E4E1D6",
                color: filtre === o.id ? "#fff" : "#6B6A60",
                borderRadius: 8, fontSize: 10, padding: "1px 6px",
                fontFamily: "'IBM Plex Mono',monospace",
              }}>
                {o.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {liste.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 24px", background: "#F9F8F5",
          borderRadius: 8, border: "1px solid #E4E1D6",
        }}>
          <Inbox size={36} color="#A6A399" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#6B6A60", margin: "0 0 4px", fontWeight: 500 }}>
            Aucun arrete en attente
          </p>
          <p style={{ fontSize: 12, color: "#A6A399", margin: 0 }}>
            Les arretes soumis a relecture ou en attente de validation apparaitront ici.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {liste.map((arrete) => {
            const coul = couleurStatut(arrete.statut);
            return (
              <div key={arrete.id} style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0EDE4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                      background: coul.bg, color: coul.text,
                    }}>
                      {labelStatut(arrete.statut)}
                    </span>
                    <span className="fm" style={{ fontSize: 10, color: "#6B6A60" }}>{arrete.numero}</span>
                    <span style={{ fontSize: 10, color: "#A6A399" }}>{arrete.type_label}</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 4px", color: "#1C1F1B" }}>{arrete.titre}</p>
                  <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>
                    {fmtDate(arrete.date_debut)} - {fmtDate(arrete.date_fin)} | {arrete.cree_par}
                  </p>
                </div>
                <div style={{ padding: 16 }}>
                  <WorkflowPanel arrete={arrete} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
