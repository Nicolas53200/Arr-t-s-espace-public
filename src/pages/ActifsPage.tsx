import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Download } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useToast } from "@/contexts/ToastContext";
import { filtrerArretes, genNum } from "@/lib/arrete";
import { AUJOURD_HUI } from "@/config/constants";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import EmptyState from "@/components/common/EmptyState";
import ModalConfirm from "@/components/arretes/ModalConfirm";
import ModalAbrogation from "@/components/arretes/ModalAbrogation";
import { exportArretesCSV, telechargerCSV } from "@/lib/export";
import type { Arrete } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function ActifsPage() {
  const navigate = useNavigate();
  const { actifs, dispatch } = useArretes();
  const toast = useToast();
  const [recherche, setRecherche] = useState("");
  const [modalAction, setModalAction] = useState<{ type: string; arrete: Arrete } | null>(null);
  const [nextIdx, setNextIdx] = useState(156);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const liste = filtrerArretes(actifs, recherche);

  function abrogerArrete(a: Arrete, motif: string) {
    const n = genNum("ABR", nextIdx);
    dispatch({ type: "UPDATE", id: a.id, updates: { statut: "abroge", arrete_abrogation: { numero: n, date: AUJOURD_HUI.toISOString().split("T")[0]!, motif } } });
    setNextIdx((n) => n + 1);
    setModalAction(null);
    toast.success("Arrete abroge avec succes");
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 18, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Arrêtés actifs</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>{actifs.length} en cours</p>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="btn-secondary" onClick={() => telechargerCSV(exportArretesCSV(liste), "arretes-actifs.csv")} style={{ fontSize: 12 }}><Download size={13} />CSV</button>
          <button className="btn-primary" onClick={() => navigate("/nouveau")}><Plus size={13} />Nouvel arrêté</button>
        </div>
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} />
        <input type="text" placeholder="Rechercher…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 30 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {liste.map((a) => (
          <ArreteLigne key={a.id} arrete={a}
            onModifier={() => setModalAction({ type: "modifier", arrete: a })}
            onAbroger={() => setModalAction({ type: "abroger", arrete: a })} />
        ))}
        {liste.length === 0 && <EmptyState texte="Aucun arrêté actif." />}
      </div>

      {modalAction?.type === "modifier" && (
        <ModalConfirm titre="Modifier" message={`${modalAction.arrete.numero} — "${modalAction.arrete.titre}"`}
          icone={<Edit2 size={19} color="#1E3A5F" />} couleurIcone="#EBF0F7" labelOk="Modifier" couleurOk="#1E3A5F"
          onOk={() => { setModalAction(null); navigate(`/nouveau/${modalAction.arrete.id}`); }}
          onCancel={() => setModalAction(null)} />
      )}
      {modalAction?.type === "abroger" && (
        <ModalAbrogation arrete={modalAction.arrete} onOk={(m) => abrogerArrete(modalAction.arrete, m)} onCancel={() => setModalAction(null)} />
      )}
    </div>
  );
}
