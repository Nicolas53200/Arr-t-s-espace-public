import { useState } from "react";
import { Search, Settings, Download, Filter } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { filtrerArretes } from "@/lib/arrete";
import { DUREE_CONSERVATION_ANS } from "@/config/constants";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import EmptyState from "@/components/common/EmptyState";
import { exportArretesCSV, telechargerCSV } from "@/lib/export";
import { TYPES_ARRETE } from "@/data/types-arrete";
import type { CodeTypeArrete } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function HistoriquePage() {
  const { historique } = useArretes();
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState<CodeTypeArrete | "">("");
  const [filtreMotif, setFiltreMotif] = useState<"expire" | "abroge" | "">("");
  const [showFiltres, setShowFiltres] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  let liste = filtrerArretes(historique, recherche);
  if (filtreType) liste = liste.filter((a) => a.type_code === filtreType);
  if (filtreMotif === "abroge") liste = liste.filter((a) => a.statut === "abroge");
  if (filtreMotif === "expire") liste = liste.filter((a) => a.statut !== "abroge");

  const filtresActifs = (filtreType ? 1 : 0) + (filtreMotif ? 1 : 0);

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 className="fd" style={{ fontSize: 22, margin: "0 0 2px", fontWeight: 700 }}>Historique</h1>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>{historique.length} archives{liste.length !== historique.length ? ` (${liste.length} affiches)` : ""} · Conservation : {DUREE_CONSERVATION_ANS} ans</p>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => telechargerCSV(exportArretesCSV(liste), "arretes-historique.csv")} style={{ fontSize: 12 }} aria-label="Exporter en CSV"><Download size={13} />CSV</button>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F4F2EC", borderRadius: 6, padding: "5px 11px", fontSize: 12, color: "#6B6A60" }}>
            <Settings size={12} aria-hidden="true" />Duree : <strong>{DUREE_CONSERVATION_ANS} ans</strong>
          </div>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: showFiltres ? 10 : 14, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} aria-hidden="true" />
          <input type="search" placeholder="Rechercher dans l'historique..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 30 }} aria-label="Rechercher dans l'historique" />
        </div>
        <button
          className="btn-secondary"
          onClick={() => setShowFiltres((s) => !s)}
          style={{ fontSize: 12, flexShrink: 0, position: "relative" }}
          aria-expanded={showFiltres}
          aria-label={`Filtres${filtresActifs > 0 ? ` (${filtresActifs} actifs)` : ""}`}
        >
          <Filter size={13} />Filtres
          {filtresActifs > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#1E3A5F", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{filtresActifs}</span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFiltres && (
        <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: "12px 14px", background: "#F9F8F5", borderRadius: 8, border: "1px solid #E4E1D6", flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="Filtres avances">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="filtre-type-hist" style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>Type</label>
            <select id="filtre-type-hist" value={filtreType} onChange={(e) => setFiltreType(e.target.value as CodeTypeArrete | "")} style={{ width: "auto", minWidth: 160 }}>
              <option value="">Tous les types</option>
              {TYPES_ARRETE.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="filtre-motif" style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>Motif d'archivage</label>
            <select id="filtre-motif" value={filtreMotif} onChange={(e) => setFiltreMotif(e.target.value as "expire" | "abroge" | "")} style={{ width: "auto", minWidth: 140 }}>
              <option value="">Tous</option>
              <option value="expire">Expires</option>
              <option value="abroge">Abroges</option>
            </select>
          </div>
          {filtresActifs > 0 && (
            <button className="btn-ghost" onClick={() => { setFiltreType(""); setFiltreMotif(""); setRecherche(""); }} style={{ fontSize: 11, marginTop: 16 }}>Reinitialiser</button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }} role="list" aria-label="Liste des arretes archives">
        {liste.map((a) => <div key={a.id} role="listitem"><ArreteLigne arrete={a} archive /></div>)}
        {liste.length === 0 && <EmptyState texte={filtresActifs > 0 || recherche ? "Aucun arrete ne correspond aux filtres." : "Aucun arrete en historique."} />}
      </div>
    </div>
  );
}
