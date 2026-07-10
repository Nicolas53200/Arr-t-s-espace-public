import { useState, useMemo } from "react";
import { Search, Download, PlusCircle, Edit3, ArrowRightCircle, XCircle, Eye, FileDown, LogIn } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { exportAuditCSV, telechargerCSV } from "@/lib/export";
import type { ActionAudit } from "@/types";

const COULEURS_ACTION: Record<ActionAudit, string> = {
  creation: "#065F46",
  modification: "#1E3A5F",
  transition: "#7C3AED",
  abrogation: "#DC2626",
  consultation: "#6B6A60",
  export: "#92400E",
  connexion: "#6B6A60",
};

const LABELS_ACTION: Record<ActionAudit, string> = {
  creation: "Creation",
  modification: "Modification",
  transition: "Transition",
  abrogation: "Abrogation",
  consultation: "Consultation",
  export: "Export",
  connexion: "Connexion",
};

const ICONES_ACTION: Record<ActionAudit, typeof PlusCircle> = {
  creation: PlusCircle,
  modification: Edit3,
  transition: ArrowRightCircle,
  abrogation: XCircle,
  consultation: Eye,
  export: FileDown,
  connexion: LogIn,
};

const ACTIONS: ActionAudit[] = ["creation", "modification", "transition", "abrogation", "consultation", "export", "connexion"];

export default function JournalPage() {
  const { journal } = useAudit();
  const [filtreAction, setFiltreAction] = useState<ActionAudit | "tous">("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [recherche, setRecherche] = useState("");

  const journalFiltre = useMemo(() => {
    let resultat = [...journal];

    if (filtreAction !== "tous") {
      resultat = resultat.filter((e) => e.action === filtreAction);
    }

    if (dateDebut) {
      resultat = resultat.filter((e) => e.date >= dateDebut);
    }

    if (dateFin) {
      const finJournee = dateFin + "T23:59:59";
      resultat = resultat.filter((e) => e.date <= finJournee);
    }

    if (recherche) {
      const terme = recherche.toLowerCase();
      resultat = resultat.filter(
        (e) =>
          e.description.toLowerCase().includes(terme) ||
          e.auteur.toLowerCase().includes(terme)
      );
    }

    return resultat.sort((a, b) => b.date.localeCompare(a.date));
  }, [journal, filtreAction, dateDebut, dateFin, recherche]);

  function handleExport() {
    const csv = exportAuditCSV(journalFiltre);
    telechargerCSV(csv, "journal-activite.csv");
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatHeure(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Journal d'activite</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>{journalFiltre.length} entree{journalFiltre.length > 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={handleExport} style={{ fontSize: 12 }}>
          <Download size={13} />Exporter CSV
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A6A399" }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ paddingLeft: 30, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#6B6A60", marginBottom: 3 }}>Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            style={{ fontSize: 12, padding: "6px 8px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#6B6A60", marginBottom: 3 }}>Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            style={{ fontSize: 12, padding: "6px 8px" }}
          />
        </div>
      </div>

      {/* Tabs d'action */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #E4E1D6", flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltreAction("tous")}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12,
            border: "none", cursor: "pointer",
            borderBottom: filtreAction === "tous" ? "2px solid #1E3A5F" : "2px solid transparent",
            background: "none", color: filtreAction === "tous" ? "#1E3A5F" : "#6B6A60",
            fontWeight: filtreAction === "tous" ? 600 : 400,
            fontFamily: "'IBM Plex Sans',sans-serif", marginBottom: -1,
          }}
        >
          Tous
          <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 5px", borderRadius: 10, fontFamily: "'IBM Plex Mono',monospace" }}>
            {journal.length}
          </span>
        </button>
        {ACTIONS.map((action) => {
          const count = journal.filter((e) => e.action === action).length;
          if (count === 0) return null;
          return (
            <button
              key={action}
              onClick={() => setFiltreAction(action)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12,
                border: "none", cursor: "pointer",
                borderBottom: filtreAction === action ? `2px solid ${COULEURS_ACTION[action]}` : "2px solid transparent",
                background: "none", color: filtreAction === action ? COULEURS_ACTION[action] : "#6B6A60",
                fontWeight: filtreAction === action ? 600 : 400,
                fontFamily: "'IBM Plex Sans',sans-serif", marginBottom: -1,
              }}
            >
              {LABELS_ACTION[action]}
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 5px", borderRadius: 10, fontFamily: "'IBM Plex Mono',monospace" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {journalFiltre.map((entree, idx) => {
          const Icone = ICONES_ACTION[entree.action];
          const couleur = COULEURS_ACTION[entree.action];
          const isLast = idx === journalFiltre.length - 1;

          return (
            <div key={entree.id} style={{ display: "flex", gap: 12, position: "relative" }}>
              {/* Timeline line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: couleur + "18", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, zIndex: 1,
                }}>
                  <Icone size={13} color={couleur} />
                </div>
                {!isLast && (
                  <div style={{ width: 1, flex: 1, background: "#E4E1D6", minHeight: 16 }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1, paddingBottom: 14, borderBottom: isLast ? "none" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                    background: couleur + "18", color: couleur,
                  }}>
                    {LABELS_ACTION[entree.action]}
                  </span>
                  <span style={{ fontSize: 10, color: "#A6A399" }}>
                    {formatDate(entree.date)} a {formatHeure(entree.date)}
                  </span>
                </div>
                <p style={{ fontSize: 13, margin: "0 0 2px", color: "#1A1A18" }}>{entree.description}</p>
                <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 2px" }}>par {entree.auteur}</p>
                {entree.details && (
                  <div style={{
                    marginTop: 4, padding: "5px 9px", background: "#F9F8F5",
                    borderRadius: 4, fontSize: 10, color: "#6B6A60",
                    fontFamily: "'IBM Plex Mono',monospace",
                  }}>
                    {Object.entries(entree.details).map(([k, v]) => (
                      <div key={k}>{k}: {v}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {journalFiltre.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#A6A399", fontSize: 13 }}>
            Aucune entree ne correspond aux filtres.
          </div>
        )}
      </div>
    </div>
  );
}
