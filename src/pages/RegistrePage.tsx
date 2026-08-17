import { useState, useMemo, useCallback } from "react";
import {
  BookOpenCheck, Download, Lock, Search, ChevronDown,
  FileText, RefreshCw, AlertTriangle, Check, X, Filter,
} from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAudit } from "@/contexts/AuditContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fmtDate } from "@/lib/date";
import { couleurStatut, labelStatut } from "@/lib/workflow";
import {
  getRegistre,
  getAnneesRegistre,
  synchroniserRegistre,
  cloturerRegistre,
  ouvrirPdfRegistre,
  type RegistreAnnuel,
  type EntreeRegistre,
} from "@/lib/registre-officiel";

export default function RegistrePage() {
  const { arretes } = useArretes();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const toast = useToast();
  const { logAction } = useAudit();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const annees = useMemo(() => getAnneesRegistre(tenant.id), [tenant.id]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<number>(
    () => annees[0] ?? new Date().getFullYear(),
  );

  const [registre, setRegistre] = useState<RegistreAnnuel>(() =>
    getRegistre(tenant.id, anneeSelectionnee),
  );

  const [recherche, setRecherche] = useState("");
  const [showConfirmCloture, setShowConfirmCloture] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<string>("tous");

  const rechargerRegistre = useCallback((annee: number) => {
    setRegistre(getRegistre(tenant.id, annee));
  }, [tenant.id]);

  function changerAnnee(annee: number) {
    setAnneeSelectionnee(annee);
    rechargerRegistre(annee);
  }

  function handleSynchroniser() {
    const nb = synchroniserRegistre(
      tenant.id,
      arretes,
      user?.nom ?? "Agent",
    );
    rechargerRegistre(anneeSelectionnee);
    logAction(
      "synchronisation",
      "registre",
      `registre_${anneeSelectionnee}`,
      `Synchronisation du registre ${anneeSelectionnee} : ${nb} arrete(s) inscrit(s)`,
    );
    if (nb > 0) {
      toast.success(`${nb} arrete(s) inscrit(s) au registre`);
    } else {
      toast.info("Le registre est deja a jour");
    }
  }

  function handleCloturer() {
    try {
      cloturerRegistre(tenant.id, anneeSelectionnee, user?.nom ?? "Agent");
      rechargerRegistre(anneeSelectionnee);
      logAction(
        "cloture",
        "registre",
        `registre_${anneeSelectionnee}`,
        `Cloture du registre ${anneeSelectionnee}`,
      );
      toast.success(`Registre ${anneeSelectionnee} cloture`);
      setShowConfirmCloture(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la cloture");
    }
  }

  function handleExportPdf() {
    ouvrirPdfRegistre(registre, tenant.nom);
  }

  // Filtrage des entrées
  const entreesFiltrees = useMemo(() => {
    let result = [...registre.entrees].sort(
      (a, b) => a.numero_ordre - b.numero_ordre,
    );

    if (filtreStatut !== "tous") {
      result = result.filter((e) => e.statut === filtreStatut);
    }

    if (recherche.trim()) {
      const q = recherche.toLowerCase();
      result = result.filter(
        (e) =>
          e.numero_registre.toLowerCase().includes(q) ||
          e.numero_arrete.toLowerCase().includes(q) ||
          e.titre.toLowerCase().includes(q) ||
          e.type_label.toLowerCase().includes(q) ||
          e.voies.some((v) => v.toLowerCase().includes(q)) ||
          e.auteur.toLowerCase().includes(q),
      );
    }

    return result;
  }, [registre.entrees, filtreStatut, recherche]);

  // Stats
  const stats = useMemo(() => {
    const entrees = registre.entrees;
    return {
      total: entrees.length,
      publies: entrees.filter((e) => e.statut === "publie").length,
      abroges: entrees.filter((e) => e.statut === "abroge").length,
      modifies: entrees.filter((e) => e.statut === "modifie").length,
    };
  }, [registre.entrees]);

  const isAdmin = user?.role === "admin";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px" }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <BookOpenCheck size={22} color="#1E3A5F" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1C1F1B", margin: 0 }}>
              Registre des arretes
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>
            Registre chronologique conforme a l'article L2122-29 du CGCT
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleSynchroniser}
            disabled={registre.cloture}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: registre.cloture ? "#F3F4F6" : "#EBF0F7",
              color: registre.cloture ? "#A6A399" : "#1E3A5F",
              border: "1px solid #E4E1D6", cursor: registre.cloture ? "not-allowed" : "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <RefreshCw size={13} /> Synchroniser
          </button>
          <button
            onClick={handleExportPdf}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: "#FFFFFF", color: "#1E3A5F",
              border: "1px solid #E4E1D6", cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Download size={13} /> Export PDF
          </button>
          {isAdmin && !registre.cloture && (
            <button
              onClick={() => setShowConfirmCloture(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: "#FEF3C7", color: "#92400E",
                border: "1px solid #FDE68A", cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              <Lock size={13} /> Cloturer {anneeSelectionnee}
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <StatMini label="Total inscrits" valeur={stats.total} couleur="#1E3A5F" />
        <StatMini label="Publies" valeur={stats.publies} couleur="#065F46" />
        <StatMini label="Modifies" valeur={stats.modifies} couleur="#4338CA" />
        <StatMini label="Abroges" valeur={stats.abroges} couleur="#B91C1C" />
      </div>

      {/* Sélecteur d'année + recherche + filtre */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        flexWrap: "wrap",
      }}>
        {/* Année */}
        <div style={{ position: "relative" }}>
          <select
            value={anneeSelectionnee}
            onChange={(e) => changerAnnee(Number(e.target.value))}
            aria-label="Annee du registre"
            style={{
              padding: "8px 32px 8px 12px", borderRadius: 6,
              border: "1.5px solid #E4E1D6", fontSize: 13, fontWeight: 600,
              color: "#1C1F1B", background: "#FFFFFF",
              fontFamily: "'IBM Plex Sans', sans-serif",
              appearance: "none", cursor: "pointer",
            }}
          >
            {annees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B6A60" }}
          />
        </div>

        {registre.cloture && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, color: "#065F46",
            background: "#ECFDF5", padding: "4px 10px", borderRadius: 4,
            border: "1px solid #BBF7D0",
          }}>
            <Lock size={12} /> Cloture le {fmtDate(registre.date_cloture ?? "")}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Filtre statut */}
        <div style={{ position: "relative" }}>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            aria-label="Filtrer par statut"
            style={{
              padding: "7px 28px 7px 30px", borderRadius: 6,
              border: "1px solid #E4E1D6", fontSize: 12,
              color: "#6B6A60", background: "#FFFFFF",
              fontFamily: "'IBM Plex Sans', sans-serif",
              appearance: "none", cursor: "pointer",
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="publie">Publies</option>
            <option value="modifie">Modifies</option>
            <option value="abroge">Abroges</option>
          </select>
          <Filter
            size={12}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#A6A399" }}
          />
        </div>

        {/* Recherche */}
        <div style={{ position: "relative", minWidth: isMobile ? "100%" : 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher..."
            aria-label="Rechercher dans le registre"
            style={{
              width: "100%", padding: "7px 12px 7px 32px", borderRadius: 6,
              border: "1px solid #E4E1D6", fontSize: 12,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          />
        </div>
      </div>

      {/* Tableau du registre */}
      <div style={{ overflowX: "auto", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr style={{ background: "#F8F7F4" }}>
              <th style={thStyle}>N°</th>
              <th style={thStyle}>N° Registre</th>
              <th style={thStyle}>Date inscription</th>
              <th style={{ ...thStyle, minWidth: 180 }}>Objet de l'arrete</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Voies</th>
              <th style={thStyle}>Periode</th>
              <th style={thStyle}>Statut</th>
              <th style={thStyle}>Auteur</th>
            </tr>
          </thead>
          <tbody>
            {entreesFiltrees.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 32, textAlign: "center", color: "#A6A399", fontSize: 13 }}>
                  {registre.entrees.length === 0 ? (
                    <div>
                      <FileText size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#6B6A60" }}>Registre vide</p>
                      <p style={{ margin: 0, fontSize: 12 }}>
                        Cliquez sur « Synchroniser » pour inscrire les arretes publies.
                      </p>
                    </div>
                  ) : (
                    "Aucun resultat pour cette recherche."
                  )}
                </td>
              </tr>
            ) : (
              entreesFiltrees.map((e) => (
                <LigneRegistre key={e.numero_registre} entree={e} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Compteur */}
      {entreesFiltrees.length > 0 && (
        <p style={{ fontSize: 11, color: "#A6A399", margin: "10px 0 0", textAlign: "right" }}>
          {entreesFiltrees.length} entree(s) affichee(s) sur {registre.entrees.length}
        </p>
      )}

      {/* Modal confirmation clôture */}
      {showConfirmCloture && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "24px 28px", maxWidth: 440, width: "90%", boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={18} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Cloturer le registre {anneeSelectionnee} ?</h3>
            </div>
            <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 8px", lineHeight: 1.6 }}>
              La cloture du registre est <strong>definitive</strong>. Aucun nouvel arrete ne pourra etre inscrit sur l'annee {anneeSelectionnee} apres cette operation.
            </p>
            <p style={{ fontSize: 12, color: "#92400E", background: "#FEF3C7", padding: "8px 12px", borderRadius: 6, margin: "0 0 20px" }}>
              Assurez-vous que tous les arretes de l'annee ont ete synchronises avant de cloturer.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirmCloture(false)}
                style={{
                  padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: "#FFFFFF", color: "#6B6A60", border: "1px solid #E4E1D6",
                  cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <X size={13} /> Annuler
              </button>
              <button
                onClick={handleCloturer}
                style={{
                  padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: "#D97706", color: "#FFFFFF", border: "none",
                  cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Check size={13} /> Confirmer la cloture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──── Sous-composants ────

const thStyle: React.CSSProperties = {
  padding: "10px 10px",
  textAlign: "left",
  fontSize: 10,
  fontWeight: 700,
  color: "#6B6A60",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  borderBottom: "1px solid #E4E1D6",
  whiteSpace: "nowrap",
};

function LigneRegistre({ entree }: { entree: EntreeRegistre }) {
  const statut = couleurStatut(entree.statut);
  return (
    <tr style={{ borderBottom: "1px solid #F0EDE4" }}>
      <td style={{ padding: "10px 10px", fontWeight: 700, textAlign: "center", color: "#1E3A5F", fontFamily: "'IBM Plex Mono', monospace" }}>
        {entree.numero_ordre}
      </td>
      <td style={{ padding: "10px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#1C1F1B", fontWeight: 600 }}>
        {entree.numero_registre}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 11, color: "#6B6A60" }}>
        {fmtDate(entree.date_inscription)}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 12, color: "#1C1F1B", fontWeight: 500, maxWidth: 220 }}>
        <div style={{ lineHeight: 1.4 }}>{entree.titre}</div>
        <div style={{ fontSize: 10, color: "#A6A399", fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
          {entree.numero_arrete}
        </div>
      </td>
      <td style={{ padding: "10px 10px", fontSize: 11, color: "#6B6A60" }}>
        {entree.type_label}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 11, color: "#6B6A60", maxWidth: 140 }}>
        {entree.voies.length > 0 ? entree.voies.join(", ") : "—"}
      </td>
      <td style={{ padding: "10px 10px", fontSize: 10, color: "#6B6A60", whiteSpace: "nowrap" }}>
        {fmtDate(entree.date_debut)}
        <br />
        {fmtDate(entree.date_fin)}
      </td>
      <td style={{ padding: "10px 10px" }}>
        <span style={{
          display: "inline-block",
          padding: "2px 8px", borderRadius: 4,
          fontSize: 10, fontWeight: 600,
          background: statut.bg, color: statut.text,
        }}>
          {labelStatut(entree.statut)}
        </span>
      </td>
      <td style={{ padding: "10px 10px", fontSize: 11, color: "#6B6A60" }}>
        {entree.auteur}
      </td>
    </tr>
  );
}

function StatMini({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8,
      padding: "14px 16px",
    }}>
      <p style={{ fontSize: 10, color: "#6B6A60", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: couleur, margin: 0, fontVariantNumeric: "tabular-nums" }}>
        {valeur}
      </p>
    </div>
  );
}
