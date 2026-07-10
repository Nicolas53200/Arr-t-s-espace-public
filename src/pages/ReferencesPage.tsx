import { useState } from "react";
import { Plus, Shield, MapPin, Archive, CheckCircle2, AlertCircle, History, ChevronUp, ChevronDown, Clock, RefreshCw, X, Check, Download } from "lucide-react";
import { useReferences } from "@/contexts/ReferencesContext";
import { AUJOURD_HUI } from "@/config/constants";
import { CATEGORIES_REF } from "@/data/references.mock";
import { fmtDate } from "@/lib/date";
import Modal from "@/components/common/Modal";
import { exportReferencesCSV, telechargerCSV } from "@/lib/export";
import type { Reference, CategorieReference } from "@/types";

interface RefEdition {
  mode: "new" | "update";
  id?: string;
  categorie?: CategorieReference;
  numero: string;
  date: string;
  titulaire: string;
  label: string;
  code: string;
  cat: CategorieReference;
  date_debut_validite: string;
  date_fin_validite: string;
}

const ICON_MAP: Record<string, typeof Shield> = { Shield, MapPin, Archive };

export default function ReferencesPage() {
  const { references, dispatch } = useReferences();
  const [catRefActive, setCatRefActive] = useState<CategorieReference>("delegation");
  const [historiquesOuverts, setHistoriquesOuverts] = useState<Set<string>>(new Set());
  const [refEnEdition, setRefEnEdition] = useState<RefEdition | null>(null);

  const alertes = references.filter((r) => {
    if (!r.actif || !r.date_fin_validite) return false;
    const fin = new Date(r.date_fin_validite);
    const j60 = new Date(AUJOURD_HUI);
    j60.setDate(j60.getDate() + 60);
    return fin <= j60;
  });

  const rpc = (cat: CategorieReference) => references.filter((r) => r.categorie === cat);

  function toggleHistorique(id: string) {
    setHistoriquesOuverts((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function mettreAJourRef(rid: string, vals: { numero: string; date: string; titulaire: string | null; date_debut_validite: string; date_fin_validite: string }) {
    const anc = references.find((r) => r.id === rid);
    if (!anc) return;
    const h = { numero: anc.numero, date: anc.date, titulaire: anc.titulaire, date_fin: AUJOURD_HUI.toISOString().split("T")[0]! };
    dispatch({
      type: "UPDATE",
      id: rid,
      updates: { ...vals, actif: true, historique: [h, ...anc.historique] },
    });
    setRefEnEdition(null);
  }

  function ajouterRef(nr: Omit<Reference, "id" | "historique">) {
    dispatch({
      type: "ADD",
      reference: { ...nr, id: `r${Date.now()}`, historique: [] },
    });
    setRefEnEdition(null);
  }

  return (
    <div style={{ paddingTop: 24, maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Références permanentes</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>Insérées automatiquement dans les visas.</p>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="btn-secondary" onClick={() => telechargerCSV(exportReferencesCSV(references), "references.csv")} style={{ fontSize: 12 }}><Download size={13} />CSV</button>
          <button className="btn-primary" onClick={() => setRefEnEdition({ mode: "new", code: "", cat: catRefActive, label: "", titulaire: "", numero: "", date: "", date_debut_validite: "", date_fin_validite: "" })} style={{ fontSize: 12 }}><Plus size={13} />Nouvelle</button>
        </div>
      </div>

      {alertes.length > 0 && (
        <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 7, padding: "9px 13px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertCircle size={14} color="#92400E" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 3px", color: "#92400E" }}>{alertes.length} référence{alertes.length > 1 ? "s" : ""} arrivent à expiration</p>
            {alertes.map((a) => <p key={a.id} style={{ fontSize: 11, color: "#92400E", margin: "1px 0" }}>· {a.label}</p>)}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #E4E1D6" }}>
        {CATEGORIES_REF.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Shield;
          return (
            <button key={cat.code} onClick={() => setCatRefActive(cat.code)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 12, border: "none", cursor: "pointer", borderBottom: catRefActive === cat.code ? `2px solid ${cat.couleur}` : "2px solid transparent", background: "none", color: catRefActive === cat.code ? cat.couleur : "#6B6A60", fontWeight: catRefActive === cat.code ? 600 : 400, fontFamily: "'IBM Plex Sans',sans-serif", marginBottom: -1 }}>
              <Icon size={12} />{cat.label}
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 5px", borderRadius: 10, fontFamily: "'IBM Plex Mono',monospace" }}>{rpc(cat.code).length}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rpc(catRefActive).map((ref) => (
          <div key={ref.id} style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 9 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "#D1FAE5", color: "#065F46" }}><CheckCircle2 size={9} />Active</span>
                  <span className="fm" style={{ fontSize: 10, color: "#6B6A60" }}>{ref.numero}</span>
                  <span style={{ fontSize: 10, color: "#A6A399" }}>du {fmtDate(ref.date)}</span>
                </div>
                <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 2px" }}>{ref.label}</p>
                {ref.titulaire && <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} />{ref.titulaire}</p>}
                {ref.date_fin_validite && <p style={{ fontSize: 10, color: "#92400E", margin: 0, display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />Expire le {fmtDate(ref.date_fin_validite)}</p>}
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {ref.historique?.length > 0 && (
                  <button className="btn-secondary" onClick={() => toggleHistorique(ref.id)} style={{ padding: "4px 8px", fontSize: 10 }}>
                    <History size={10} />{ref.historique.length}v {historiquesOuverts.has(ref.id) ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                )}
                <button className="btn-primary" onClick={() => setRefEnEdition({
                  mode: "update", id: ref.id, categorie: ref.categorie,
                  numero: ref.numero, date: new Date().toISOString().split("T")[0]!,
                  titulaire: ref.titulaire || "", label: ref.label, code: ref.code, cat: ref.categorie,
                  date_debut_validite: new Date().toISOString().split("T")[0]!,
                  date_fin_validite: ref.date_fin_validite || "",
                })} style={{ padding: "4px 10px", fontSize: 10 }}><RefreshCw size={10} />MAJ</button>
              </div>
            </div>
            {historiquesOuverts.has(ref.id) && ref.historique?.length > 0 && (
              <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid #F0EDE4" }}>
                {ref.historique.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "#F9F8F5", borderRadius: 4, marginBottom: 4, fontSize: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "1px 5px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: "#F3F4F6", color: "#6B7280" }}><Archive size={8} />Archivé</span>
                    <span className="fm" style={{ color: "#6B6A60" }}>{h.numero}</span>
                    <span style={{ color: "#A6A399" }}>du {fmtDate(h.date)}</span>
                    {h.titulaire && <span style={{ color: "#6B6A60" }}>· {h.titulaire}</span>}
                    <span style={{ marginLeft: "auto", color: "#A6A399" }}>jusqu'au {fmtDate(h.date_fin)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {refEnEdition && (
        <ModalRef refEnEdition={refEnEdition}
          onCancel={() => setRefEnEdition(null)}
          onSaveNew={ajouterRef}
          onSaveUpdate={mettreAJourRef} />
      )}
    </div>
  );
}

function ModalRef({ refEnEdition, onCancel, onSaveNew, onSaveUpdate }: {
  refEnEdition: RefEdition;
  onCancel: () => void;
  onSaveNew: (data: Omit<Reference, "id" | "historique">) => void;
  onSaveUpdate: (rid: string, vals: { numero: string; date: string; titulaire: string | null; date_debut_validite: string; date_fin_validite: string }) => void;
}) {
  const isNew = refEnEdition.mode === "new";
  const [form, setForm] = useState({
    code: refEnEdition.code,
    categorie: refEnEdition.cat,
    label: refEnEdition.label,
    titulaire: refEnEdition.titulaire,
    numero: refEnEdition.numero,
    date: refEnEdition.date || new Date().toISOString().split("T")[0]!,
    date_debut_validite: refEnEdition.date_debut_validite || new Date().toISOString().split("T")[0]!,
    date_fin_validite: refEnEdition.date_fin_validite,
  });

  const f = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }));

  function handleSave() {
    if (isNew) {
      onSaveNew({ code: form.code, categorie: form.categorie, label: form.label, titulaire: form.titulaire || null, numero: form.numero, date: form.date, actif: true, date_debut_validite: form.date_debut_validite, date_fin_validite: form.date_fin_validite });
    } else {
      onSaveUpdate(refEnEdition.id!, { numero: form.numero, date: form.date, titulaire: form.titulaire || null, date_debut_validite: form.date_debut_validite, date_fin_validite: form.date_fin_validite });
    }
  }

  return (
    <Modal onClose={onCancel}>
      <div style={{ background: "#FFFFFF", borderRadius: 11, padding: 24, width: "100%", maxWidth: 470, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="fd" style={{ fontSize: 16, margin: 0 }}>{isNew ? "Nouvelle référence" : "Mettre à jour"}</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
        </div>
        {!isNew && <div style={{ background: "#EBF0F7", borderRadius: 5, padding: "8px 11px", marginBottom: 11, fontSize: 11, color: "#1E3A5F" }}><strong>Note :</strong> L'ancienne version sera archivée. Les arrêtés déjà publiés conservent leur visa.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isNew && (
            <>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Libellé</label><input type="text" value={form.label} onChange={(e) => f("label", e.target.value)} placeholder="Ex. Zone 30" /></div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Catégorie</label><select value={form.categorie} onChange={(e) => f("categorie", e.target.value)}>{CATEGORIES_REF.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
              {form.categorie === "delegation" && <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Titulaire</label><input type="text" value={form.titulaire} onChange={(e) => f("titulaire", e.target.value)} /></div>}
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{isNew ? "Numéro" : "Nouveau numéro"}</label><input type="text" value={form.numero} onChange={(e) => f("numero", e.target.value)} placeholder="045/2026" /></div>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Date</label><input type="text" value={form.date} onChange={(e) => f("date", e.target.value)} placeholder="AAAA-MM-JJ" /></div>
          </div>
          {!isNew && refEnEdition.categorie === "delegation" && <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Nouveau titulaire</label><input type="text" value={form.titulaire} onChange={(e) => f("titulaire", e.target.value)} /></div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Valide à partir du</label><input type="text" value={form.date_debut_validite} onChange={(e) => f("date_debut_validite", e.target.value)} placeholder="AAAA-MM-JJ" /></div>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Expire le (facultatif)</label><input type="text" value={form.date_fin_validite} onChange={(e) => f("date_fin_validite", e.target.value)} placeholder="AAAA-MM-JJ" /></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 16 }}>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: 12 }}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}><Check size={12} />{isNew ? "Ajouter" : "Enregistrer"}</button>
        </div>
      </div>
    </Modal>
  );
}
