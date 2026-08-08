import { useState, useRef } from "react";
import { Plus, Shield, MapPin, Archive, Scale, CheckCircle2, AlertCircle, History, ChevronUp, ChevronDown, Clock, RefreshCw, X, Check, Download, Upload, FileText, ExternalLink } from "lucide-react";
import { useReferences } from "@/contexts/ReferencesContext";
import { useToast } from "@/contexts/ToastContext";
import { AUJOURD_HUI } from "@/config/constants";
import { CATEGORIES_REF } from "@/data/references.mock";
import { fmtDate } from "@/lib/date";
import Modal from "@/components/common/Modal";
import { exportReferencesCSV, telechargerCSV } from "@/lib/export";
import type { Reference, CategorieReference } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { validerChamp } from "@/lib/validation";

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

const ICON_MAP: Record<string, typeof Shield> = { Shield, MapPin, Archive, Scale };

export default function ReferencesPage() {
  const { references, dispatch } = useReferences();
  const toast = useToast();
  const [catRefActive, setCatRefActive] = useState<CategorieReference>("base_legale");
  const [historiquesOuverts, setHistoriquesOuverts] = useState<Set<string>>(new Set());
  const [refEnEdition, setRefEnEdition] = useState<RefEdition | null>(null);
  const [showImport, setShowImport] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

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
    toast.success("Reference mise a jour");
  }

  function ajouterRef(nr: Omit<Reference, "id" | "historique">) {
    dispatch({
      type: "ADD",
      reference: { ...nr, id: `r${Date.now()}`, historique: [] },
    });
    setRefEnEdition(null);
    toast.success("Reference ajoutee");
  }

  function handleImportCSV(refs: Omit<Reference, "id" | "historique">[]) {
    for (const ref of refs) {
      dispatch({
        type: "ADD",
        reference: { ...ref, id: `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, historique: [] },
      });
    }
    setShowImport(false);
    toast.success(`${refs.length} reference${refs.length > 1 ? "s" : ""} importee${refs.length > 1 ? "s" : ""}`);
  }

  const isBaseLegale = catRefActive === "base_legale";

  return (
    <div style={{ paddingTop: 24, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "16px 16px 48px" : "24px 24px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Références permanentes</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>Insérées automatiquement dans les visas.</p>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="btn-secondary" onClick={() => setShowImport(true)} style={{ fontSize: 12 }}><Upload size={13} />Importer</button>
          <button className="btn-secondary" onClick={() => telechargerCSV(exportReferencesCSV(references), "references.csv")} style={{ fontSize: 12 }}><Download size={13} />CSV</button>
          <button className="btn-primary" onClick={() => setRefEnEdition({ mode: "new", code: "", cat: catRefActive === "base_legale" ? "delegation" : catRefActive, label: "", titulaire: "", numero: "", date: "", date_debut_validite: "", date_fin_validite: "" })} style={{ fontSize: 12 }}><Plus size={13} />Nouvelle</button>
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

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #E4E1D6", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {CATEGORIES_REF.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Shield;
          return (
            <button key={cat.code} onClick={() => setCatRefActive(cat.code)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 12, border: "none", cursor: "pointer", borderBottom: catRefActive === cat.code ? `2px solid ${cat.couleur}` : "2px solid transparent", background: "none", color: catRefActive === cat.code ? cat.couleur : "#6B6A60", fontWeight: catRefActive === cat.code ? 600 : 400, fontFamily: "'IBM Plex Sans',sans-serif", marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 }}>
              <Icon size={12} />{cat.label}
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 5px", borderRadius: 10, fontFamily: "'IBM Plex Mono',monospace" }}>{rpc(cat.code).length}</span>
            </button>
          );
        })}
      </div>

      {/* Explications pour les bases légales + liens Légifrance */}
      {isBaseLegale && rpc("base_legale").length > 0 && (
        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 7, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <Scale size={14} color="#7C3AED" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 3px", color: "#5B21B6" }}>Textes nationaux pré-chargés</p>
              <p style={{ fontSize: 11, color: "#6D28D9", margin: 0 }}>
                Ces articles de loi sont automatiquement cités en visa (« VU ») dans chaque arrêté municipal.
                Ils constituent le fondement juridique commun du pouvoir de police du maire.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingLeft: 22 }}>
            {[
              { label: "CGCT L.2212-1", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390199" },
              { label: "CGCT L.2212-2", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390202" },
              { label: "CGCT L.2212-4", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390209" },
              { label: "CGCT L.2213-1", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390308" },
              { label: "Code route R.411-25", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842097" },
              { label: "Code route R.411-8", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842050" },
              { label: "Voirie L.116-1", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070667/LEGISCTA000006159378" },
              { label: "Sécurité L.211-1", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025505075" },
            ].map((t) => (
              <a
                key={t.label}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 4,
                  background: "#FFFFFF", border: "1px solid #DDD6FE",
                  textDecoration: "none", fontSize: 10, fontWeight: 500,
                  color: "#5B21B6", fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {t.label} <ExternalLink size={8} />
              </a>
            ))}
          </div>
        </div>
      )}

      {rpc(catRefActive).length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#A6A399" }}>
          <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px", color: "#6B6A60" }}>Aucune référence dans cette catégorie</p>
          <p style={{ fontSize: 12, margin: 0 }}>
            {isBaseLegale
              ? "Les bases légales nationales sont injectées automatiquement à la création de la collectivité."
              : "Ajoutez vos arrêtés permanents existants avec le bouton « Nouvelle » ou « Importer »."}
          </p>
        </div>
      )}

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

      {showImport && (
        <ModalImport
          onCancel={() => setShowImport(false)}
          onImport={handleImportCSV}
        />
      )}
    </div>
  );
}

// ──── Modal d'édition de référence ────

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const f = (field: string, val: string) => setForm((p) => ({ ...p, [field]: val }));
  const touch = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const errNumero = validerChamp(form.numero, [{ type: "required" }]);
  const errDate = validerChamp(form.date, [{ type: "required" }, { type: "dateValide" }]);
  const errLabel = isNew ? validerChamp(form.label, [{ type: "required" }]) : { valide: true } as const;
  const errDateDebut = validerChamp(form.date_debut_validite, [{ type: "required" }, { type: "dateValide" }]);

  const formValide = errNumero.valide && errDate.valide && errLabel.valide && errDateDebut.valide;

  // Catégories disponibles pour le formulaire (exclure base_legale — réservée aux textes nationaux)
  const categoriesFormulaire = CATEGORIES_REF.filter((c) => c.code !== "base_legale");

  function handleSave() {
    setTouched({ numero: true, date: true, label: true, date_debut_validite: true });
    if (!formValide) return;
    if (isNew) {
      onSaveNew({ code: form.code, categorie: form.categorie, label: form.label, titulaire: form.titulaire || null, numero: form.numero, date: form.date, actif: true, date_debut_validite: form.date_debut_validite, date_fin_validite: form.date_fin_validite });
    } else {
      onSaveUpdate(refEnEdition.id!, { numero: form.numero, date: form.date, titulaire: form.titulaire || null, date_debut_validite: form.date_debut_validite, date_fin_validite: form.date_fin_validite });
    }
  }

  const styleErreur = { fontSize: 11, color: "#DC2626", margin: "3px 0 0" } as const;
  function borderErr(hasError: boolean) { return hasError ? { borderColor: "#DC2626" } : {}; }

  return (
    <Modal onClose={onCancel}>
      <div style={{ background: "#FFFFFF", borderRadius: 11, padding: 24, width: "100%", maxWidth: 470, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="fd" style={{ fontSize: 16, margin: 0 }}>{isNew ? "Nouvelle reference" : "Mettre a jour"}</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
        </div>
        {!isNew && <div style={{ background: "#EBF0F7", borderRadius: 5, padding: "8px 11px", marginBottom: 11, fontSize: 11, color: "#1E3A5F" }}><strong>Note :</strong> L'ancienne version sera archivee. Les arretes deja publies conservent leur visa.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isNew && (
            <>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Libelle</label>
                <input type="text" value={form.label} onChange={(e) => f("label", e.target.value)} onBlur={() => touch("label")} placeholder="Ex. Zone 30" style={borderErr(!!(touched["label"] && !errLabel.valide))} />
                {touched["label"] && !errLabel.valide && <p style={styleErreur}>{errLabel.erreur}</p>}
              </div>
              <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Categorie</label><select value={form.categorie} onChange={(e) => f("categorie", e.target.value)}>{categoriesFormulaire.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
              {form.categorie === "delegation" && <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Titulaire</label><input type="text" value={form.titulaire} onChange={(e) => f("titulaire", e.target.value)} /></div>}
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{isNew ? "Numero" : "Nouveau numero"}</label>
              <input type="text" value={form.numero} onChange={(e) => f("numero", e.target.value)} onBlur={() => touch("numero")} placeholder="045/2026" style={borderErr(!!(touched["numero"] && !errNumero.valide))} />
              {touched["numero"] && !errNumero.valide && <p style={styleErreur}>{errNumero.erreur}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Date</label>
              <input type="text" value={form.date} onChange={(e) => f("date", e.target.value)} onBlur={() => touch("date")} placeholder="AAAA-MM-JJ" style={borderErr(!!(touched["date"] && !errDate.valide))} />
              {touched["date"] && !errDate.valide && <p style={styleErreur}>{errDate.erreur}</p>}
            </div>
          </div>
          {!isNew && refEnEdition.categorie === "delegation" && <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Nouveau titulaire</label><input type="text" value={form.titulaire} onChange={(e) => f("titulaire", e.target.value)} /></div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Valide a partir du</label>
              <input type="text" value={form.date_debut_validite} onChange={(e) => f("date_debut_validite", e.target.value)} onBlur={() => touch("date_debut_validite")} placeholder="AAAA-MM-JJ" style={borderErr(!!(touched["date_debut_validite"] && !errDateDebut.valide))} />
              {touched["date_debut_validite"] && !errDateDebut.valide && <p style={styleErreur}>{errDateDebut.erreur}</p>}
            </div>
            <div><label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Expire le (facultatif)</label><input type="text" value={form.date_fin_validite} onChange={(e) => f("date_fin_validite", e.target.value)} placeholder="AAAA-MM-JJ" /></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 16 }}>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: 12 }}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} disabled={!formValide} style={{ fontSize: 12, background: formValide ? "#1E3A5F" : "#D8D5C8" }}><Check size={12} />{isNew ? "Ajouter" : "Enregistrer"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ──── Modal d'import CSV / saisie guidée ────

interface LigneImport {
  categorie: CategorieReference;
  label: string;
  numero: string;
  date: string;
}

function ModalImport({ onCancel, onImport }: {
  onCancel: () => void;
  onImport: (refs: Omit<Reference, "id" | "historique">[]) => void;
}) {
  const [mode, setMode] = useState<"choix" | "csv" | "manuel">("choix");
  const [lignes, setLignes] = useState<LigneImport[]>([
    { categorie: "circulation", label: "", numero: "", date: "" },
  ]);
  const [csvTexte, setCsvTexte] = useState("");
  const [erreurCsv, setErreurCsv] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const categoriesImport = CATEGORIES_REF.filter((c) => c.code !== "base_legale");

  function ajouterLigne() {
    setLignes((prev) => [...prev, { categorie: "circulation", label: "", numero: "", date: "" }]);
  }

  function majLigne(idx: number, champ: keyof LigneImport, val: string) {
    setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, [champ]: val } : l));
  }

  function supprimerLigne(idx: number) {
    setLignes((prev) => prev.filter((_, i) => i !== idx));
  }

  function validerManuel() {
    const valides = lignes.filter((l) => l.label && l.numero && l.date);
    if (valides.length === 0) return;
    onImport(valides.map((l) => ({
      code: l.numero.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      categorie: l.categorie,
      label: l.label,
      titulaire: null,
      numero: l.numero,
      date: l.date,
      actif: true,
      date_debut_validite: l.date,
      date_fin_validite: "",
    })));
  }

  function traiterCSV(texte: string) {
    setErreurCsv("");
    const lignesCSV = texte.trim().split("\n").filter(Boolean);
    if (lignesCSV.length < 2) {
      setErreurCsv("Le fichier doit contenir un en-tête et au moins une ligne de données.");
      return;
    }

    // Parser l'en-tête
    const entete = lignesCSV[0]!.toLowerCase();
    const hasLabel = entete.includes("label") || entete.includes("libelle") || entete.includes("intitule");
    const hasNumero = entete.includes("numero") || entete.includes("numéro");
    const hasDate = entete.includes("date");

    if (!hasLabel || !hasNumero || !hasDate) {
      setErreurCsv("En-tête invalide. Colonnes attendues : Categorie (optionnel), Label/Libellé, Numero, Date");
      return;
    }

    const cols = lignesCSV[0]!.split(/[;,\t]/);
    const idxCat = cols.findIndex((c) => c.toLowerCase().includes("categorie"));
    const idxLabel = cols.findIndex((c) => /label|libelle|intitule/i.test(c));
    const idxNumero = cols.findIndex((c) => /numero|numéro/i.test(c));
    const idxDate = cols.findIndex((c) => c.toLowerCase().includes("date"));

    const refs: Omit<Reference, "id" | "historique">[] = [];
    for (let i = 1; i < lignesCSV.length; i++) {
      const vals = lignesCSV[i]!.split(/[;,\t]/);
      const label = vals[idxLabel]?.trim() ?? "";
      const numero = vals[idxNumero]?.trim() ?? "";
      const date = vals[idxDate]?.trim() ?? "";
      if (!label || !numero) continue;

      let categorie: CategorieReference = "circulation";
      if (idxCat >= 0) {
        const catVal = (vals[idxCat]?.trim() ?? "").toLowerCase();
        if (catVal.includes("delegation") || catVal.includes("délégation")) categorie = "delegation";
        else if (catVal.includes("stationnement")) categorie = "stationnement";
        else if (catVal.includes("circulation")) categorie = "circulation";
      }

      refs.push({
        code: numero.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        categorie,
        label,
        titulaire: null,
        numero,
        date: date || new Date().toISOString().split("T")[0]!,
        actif: true,
        date_debut_validite: date || new Date().toISOString().split("T")[0]!,
        date_fin_validite: "",
      });
    }

    if (refs.length === 0) {
      setErreurCsv("Aucune référence valide trouvée dans le fichier.");
      return;
    }

    onImport(refs);
  }

  function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texte = ev.target?.result as string;
      setCsvTexte(texte);
      traiterCSV(texte);
    };
    reader.readAsText(fichier);
  }

  return (
    <Modal onClose={onCancel}>
      <div style={{ background: "#FFFFFF", borderRadius: 11, padding: 24, width: "100%", maxWidth: 560, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="fd" style={{ fontSize: 16, margin: 0 }}>
            {mode === "choix" ? "Importer des références" : mode === "csv" ? "Import CSV" : "Saisie guidée"}
          </h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
        </div>

        {mode === "choix" && (
          <div>
            <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 16px" }}>
              Importez vos arrêtés permanents existants pour qu'ils soient automatiquement cités dans les visas des futurs arrêtés.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setMode("manuel")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#EBF0F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={20} color="#1E3A5F" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#1C1F1B" }}>Saisie guidée</p>
                  <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Ajoutez vos arrêtés un par un avec un formulaire simplifié</p>
                </div>
              </button>
              <button onClick={() => setMode("csv")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Upload size={20} color="#92400E" />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: "#1C1F1B" }}>Import CSV</p>
                  <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Chargez un fichier CSV avec vos références existantes</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === "csv" && (
          <div>
            <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 12px" }}>
              Format attendu : <code style={{ background: "#F4F2EC", padding: "1px 4px", borderRadius: 3, fontSize: 11 }}>Categorie;Label;Numero;Date</code> (séparateur : virgule, point-virgule ou tabulation)
            </p>
            <div style={{ border: "2px dashed #E4E1D6", borderRadius: 8, padding: "20px 16px", textAlign: "center", marginBottom: 12 }}>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFichier} style={{ display: "none" }} />
              <button onClick={() => fileRef.current?.click()} className="btn-secondary" style={{ fontSize: 12 }}>
                <Upload size={13} />Choisir un fichier CSV
              </button>
              <p style={{ fontSize: 11, color: "#A6A399", margin: "8px 0 0" }}>ou collez le contenu ci-dessous</p>
            </div>
            <textarea
              value={csvTexte}
              onChange={(e) => setCsvTexte(e.target.value)}
              placeholder={"Categorie;Label;Numero;Date\nCirculation;Zone 30 Centre-ville;AR-2021-312;2021-09-01\nStationnement;Stationnement payant;AR-2017-823;2017-12-18"}
              style={{ width: "100%", minHeight: 100, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", padding: 10, border: "1px solid #E4E1D6", borderRadius: 6 }}
            />
            {erreurCsv && <p style={{ fontSize: 11, color: "#DC2626", margin: "6px 0 0" }}>{erreurCsv}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 7, marginTop: 14 }}>
              <button className="btn-secondary" onClick={() => setMode("choix")} style={{ fontSize: 12 }}>Retour</button>
              <button className="btn-primary" onClick={() => traiterCSV(csvTexte)} disabled={!csvTexte.trim()} style={{ fontSize: 12 }}><Check size={12} />Importer</button>
            </div>
          </div>
        )}

        {mode === "manuel" && (
          <div>
            <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 12px" }}>
              Saisissez vos arrêtés permanents existants (circulation, stationnement, délégations).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {lignes.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 110px 100px 28px", gap: 6, alignItems: "end" }}>
                  <div>
                    {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 500, marginBottom: 2, color: "#6B6A60" }}>Catégorie</label>}
                    <select value={l.categorie} onChange={(e) => majLigne(i, "categorie", e.target.value)} style={{ fontSize: 11, padding: "5px 4px" }}>
                      {categoriesImport.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 500, marginBottom: 2, color: "#6B6A60" }}>Intitulé</label>}
                    <input type="text" value={l.label} onChange={(e) => majLigne(i, "label", e.target.value)} placeholder="Zone 30 Centre-ville" style={{ fontSize: 11, padding: "5px 6px" }} />
                  </div>
                  <div>
                    {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 500, marginBottom: 2, color: "#6B6A60" }}>Numéro</label>}
                    <input type="text" value={l.numero} onChange={(e) => majLigne(i, "numero", e.target.value)} placeholder="AR-2021-312" style={{ fontSize: 11, padding: "5px 6px" }} />
                  </div>
                  <div>
                    {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 500, marginBottom: 2, color: "#6B6A60" }}>Date</label>}
                    <input type="text" value={l.date} onChange={(e) => majLigne(i, "date", e.target.value)} placeholder="AAAA-MM-JJ" style={{ fontSize: 11, padding: "5px 6px" }} />
                  </div>
                  <button onClick={() => supprimerLigne(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", padding: 0, display: "flex", alignItems: "center", height: 30 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={ajouterLigne} className="btn-secondary" style={{ fontSize: 11, marginTop: 8 }}><Plus size={11} />Ajouter une ligne</button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 7, marginTop: 14 }}>
              <button className="btn-secondary" onClick={() => setMode("choix")} style={{ fontSize: 12 }}>Retour</button>
              <button className="btn-primary" onClick={validerManuel} disabled={lignes.every((l) => !l.label || !l.numero)} style={{ fontSize: 12 }}><Check size={12} />Importer {lignes.filter((l) => l.label && l.numero && l.date).length} référence{lignes.filter((l) => l.label && l.numero && l.date).length > 1 ? "s" : ""}</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
