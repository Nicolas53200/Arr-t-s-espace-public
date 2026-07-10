import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { filtrerArretes } from "@/lib/arrete";
import { DUREE_CONSERVATION_ANS } from "@/config/constants";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import EmptyState from "@/components/common/EmptyState";

export default function HistoriquePage() {
  const { historique } = useArretes();
  const [recherche, setRecherche] = useState("");

  const liste = filtrerArretes(historique, recherche);

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Historique</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>{historique.length} archivés · Conservation : {DUREE_CONSERVATION_ANS} ans</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F4F2EC", borderRadius: 6, padding: "5px 11px", fontSize: 12, color: "#6B6A60" }}>
          <Settings size={12} />Durée : <strong>{DUREE_CONSERVATION_ANS} ans</strong>
        </div>
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} />
        <input type="text" placeholder="Rechercher dans l'historique…" value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 30 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {liste.map((a) => <ArreteLigne key={a.id} arrete={a} archive />)}
        {liste.length === 0 && <EmptyState texte="Aucun arrêté en historique." />}
      </div>
    </div>
  );
}
