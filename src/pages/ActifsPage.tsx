import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Download, Filter } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useToast } from "@/contexts/ToastContext";
import { filtrerArretes, genNum } from "@/lib/arrete";
import { AUJOURD_HUI } from "@/config/constants";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import EmptyState from "@/components/common/EmptyState";
import ModalConfirm from "@/components/arretes/ModalConfirm";
import ModalAbrogation from "@/components/arretes/ModalAbrogation";
import { exportArretesCSV, telechargerCSV } from "@/lib/export";
import { TYPES_ARRETE } from "@/data/types-arrete";
import type { Arrete, CodeTypeArrete, StatutArrete } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDebounce } from "@/hooks/useDebounce";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const FILTRES_STATUT: { code: StatutArrete; label: string }[] = [
  { code: "brouillon", label: "Brouillon" },
  { code: "en_relecture", label: "En relecture" },
  { code: "valide", label: "Valide" },
  { code: "publie", label: "Publie" },
  { code: "modifie", label: "Modifie" },
];

export default function ActifsPage() {
  const navigate = useNavigate();
  const { actifs, dispatch, loading } = useArretes();
  const toast = useToast();
  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState<CodeTypeArrete | "">("");
  const [filtreStatut, setFiltreStatut] = useState<StatutArrete | "">("");
  const [showFiltres, setShowFiltres] = useState(false);
  const [modalAction, setModalAction] = useState<{ type: string; arrete: Arrete } | null>(null);
  const [nextIdx, setNextIdx] = useState(156);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const rechercheDebounced = useDebounce(recherche, 250);

  let liste = filtrerArretes(actifs, rechercheDebounced);
  if (filtreType) liste = liste.filter((a) => a.type_code === filtreType);
  if (filtreStatut) liste = liste.filter((a) => a.statut === filtreStatut);

  const filtresActifs = (filtreType ? 1 : 0) + (filtreStatut ? 1 : 0);

  function abrogerArrete(a: Arrete, motif: string) {
    const n = genNum("ABR", nextIdx);
    dispatch({ type: "UPDATE", id: a.id, updates: { statut: "abroge", arrete_abrogation: { numero: n, date: AUJOURD_HUI.toISOString().split("T")[0]!, motif } } });
    setNextIdx((n) => n + 1);
    setModalAction(null);
    toast.success("Arrete abroge avec succes");
  }

  function reinitialiserFiltres() {
    setFiltreType("");
    setFiltreStatut("");
    setRecherche("");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 18, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 className="fd" style={{ fontSize: 22, margin: "0 0 2px", fontWeight: 700 }}>Arretes actifs</h1>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>{actifs.length} en cours{liste.length !== actifs.length ? ` (${liste.length} affiches)` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="btn-secondary" onClick={() => telechargerCSV(exportArretesCSV(liste), "arretes-actifs.csv")} style={{ fontSize: 12 }} aria-label="Exporter en CSV"><Download size={13} />CSV</button>
          <button className="btn-primary" onClick={() => navigate("/nouveau")}><Plus size={13} />Nouvel arrete</button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: showFiltres ? 10 : 14, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} aria-hidden="true" />
          <input type="search" placeholder="Rechercher par titre, numero, type ou voie..." value={recherche} onChange={(e) => setRecherche(e.target.value)} style={{ paddingLeft: 30 }} aria-label="Rechercher dans les arretes actifs" />
        </div>
        <button
          className={`btn-secondary${showFiltres ? "" : ""}`}
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
            <label htmlFor="filtre-type" style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>Type</label>
            <select id="filtre-type" value={filtreType} onChange={(e) => setFiltreType(e.target.value as CodeTypeArrete | "")} style={{ width: "auto", minWidth: 160 }}>
              <option value="">Tous les types</option>
              {TYPES_ARRETE.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label htmlFor="filtre-statut" style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>Statut</label>
            <select id="filtre-statut" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value as StatutArrete | "")} style={{ width: "auto", minWidth: 140 }}>
              <option value="">Tous les statuts</option>
              {FILTRES_STATUT.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>
          {filtresActifs > 0 && (
            <button className="btn-ghost" onClick={reinitialiserFiltres} style={{ fontSize: 11, marginTop: 16 }}>Reinitialiser</button>
          )}
        </div>
      )}

      {/* Results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }} role="list" aria-label="Liste des arretes actifs">
        {liste.map((a) => (
          <div key={a.id} role="listitem">
            <ArreteLigne arrete={a}
              onModifier={() => setModalAction({ type: "modifier", arrete: a })}
              onAbroger={() => setModalAction({ type: "abroger", arrete: a })} />
          </div>
        ))}
        {liste.length === 0 && <EmptyState texte={filtresActifs > 0 || recherche ? "Aucun arrete ne correspond aux filtres." : "Aucun arrete actif."} />}
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
