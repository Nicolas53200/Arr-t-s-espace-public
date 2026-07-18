import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Check, Plus, X, Layers, Flag, Edit2, RefreshCw,
  FileText, MapPin, Home, Map,
} from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenant } from "@/contexts/TenantContext";
import { ouvrirApercuPdf } from "@/lib/pdf-client";
import { AUJOURD_HUI } from "@/config/constants";
import { TYPES_ARRETE } from "@/data/types-arrete";
import { TYPES_IMPACT } from "@/data/types-impact";
import { VOIES } from "@/data/voies";
import { resoudreTroncons } from "@/lib/voie";
import { genNum } from "@/lib/arrete";
import ChampFormulaire from "@/components/formulaire/ChampFormulaire";
import CarteDessin from "@/components/carte/CarteDessin";
import type { Arrete, TypeArrete, Phase, Troncon, CodeImpact } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { validerChamp } from "@/lib/validation";
import type { RegleValidation } from "@/lib/validation";

/* ---------- styles inline erreur ---------- */
const styleErreur = { fontSize: 11, color: "#DC2626", margin: "3px 0 0" } as const;
function borderErreur(hasError: boolean) {
  return hasError ? { borderColor: "#DC2626" } : {};
}

/* ---------- Règles de validation par étape ---------- */
const REGLES_TITRE: RegleValidation[] = [
  { type: "required" },
  { type: "minLength", valeur: 5 },
];

export default function NouveauArretePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { arretes, dispatch } = useArretes();
  const { references } = useReferences();
  const { tenant } = useTenant();
  const toast = useToast();

  const arreteExistant = id ? arretes.find((a) => a.id === id) : null;
  const typeInitial = arreteExistant ? TYPES_ARRETE.find((t) => t.code === arreteExistant.type_code) : null;

  const [etape, setEtape] = useState(arreteExistant ? 1 : 0);
  const [typeArrete, setTypeArrete] = useState<TypeArrete | null>(typeInitial ?? null);
  const [valeurs, setValeurs] = useState<Record<string, string | boolean>>({});
  const [titreArrete, setTitreArrete] = useState(arreteExistant?.titre ?? "");
  const [phases, setPhases] = useState<Phase[]>([{ id: 1, label: typeInitial?.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
  const [phaseActive, setPhaseActive] = useState(0);
  const [publie, setPublie] = useState(false);
  const [dernierArrete, setDernierArrete] = useState<{ numero: string; mode: string; titre: string } | null>(null);
  const [motifModification, setMotifModification] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [nextIdx] = useState(156);

  /* ---- Validation state ---- */
  const [touchedEtape1, setTouchedEtape1] = useState<Record<string, boolean>>({});
  const [touchedPhases, setTouchedPhases] = useState<Record<string, boolean>>({});

  const touchField = useCallback((champ: string) => {
    setTouchedEtape1((prev) => ({ ...prev, [champ]: true }));
  }, []);

  const touchPhaseField = useCallback((phaseIdx: number, champ: string) => {
    setTouchedPhases((prev) => ({ ...prev, [`${phaseIdx}_${champ}`]: true }));
  }, []);

  /* ---- Erreurs Étape 1 ---- */
  const erreurTitre = useMemo(() => validerChamp(titreArrete, REGLES_TITRE), [titreArrete]);

  const champsTypeRequis = useMemo(() => {
    if (!typeArrete) return [] as string[];
    return typeArrete.champs
      .filter((c) => c.type !== "bool" && c.type !== "adresse")
      .map((c) => c.id);
  }, [typeArrete]);

  const erreursChamps = useMemo(() => {
    const errs: Record<string, string | undefined> = {};
    for (const cid of champsTypeRequis) {
      const v = (valeurs[cid] as string) ?? "";
      const res = validerChamp(v, [{ type: "required" }]);
      errs[cid] = res.valide ? undefined : res.erreur;
    }
    return errs;
  }, [valeurs, champsTypeRequis]);

  const etape1Valide = useMemo(() => {
    if (!erreurTitre.valide) return false;
    for (const cid of champsTypeRequis) {
      if (erreursChamps[cid]) return false;
    }
    return true;
  }, [erreurTitre, erreursChamps, champsTypeRequis]);

  /* ---- Erreurs Étape 2 (phases) ---- */
  const erreursPhases = useMemo(() => {
    return phases.map((ph) => {
      const errs: Record<string, string | undefined> = {};
      if (typeArrete?.multi_phases) {
        const dDebut = validerChamp(ph.date_debut, [{ type: "required" }, { type: "dateValide" }]);
        errs["date_debut"] = dDebut.valide ? undefined : dDebut.erreur;

        const dFin = validerChamp(
          ph.date_fin,
          [{ type: "required" }, { type: "dateValide" }, { type: "dateApres", autreChamp: "date_debut" }],
          { date_debut: ph.date_debut, date_fin: ph.date_fin },
        );
        errs["date_fin"] = dFin.valide ? undefined : dFin.erreur;
      }
      if (ph.troncons.length === 0) {
        errs["troncons"] = "Au moins un troncon requis";
      }
      return errs;
    });
  }, [phases, typeArrete]);

  const etape2Valide = useMemo(() => {
    return erreursPhases.every((errs) =>
      Object.values(errs).every((e) => !e),
    );
  }, [erreursPhases]);

  const champsAdresse = useMemo(() => typeArrete?.champs.find((c) => c.type === "adresse"), [typeArrete]);
  const phaseActuelle = phases[phaseActive] || { troncons: [] as Troncon[] };
  const totalTroncons = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.voie_id)))].length;

  function allerFormulaire(t: TypeArrete) {
    setTypeArrete(t);
    setValeurs({});
    setTitreArrete("");
    setPhases([{ id: 1, label: t.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(0);
    setTouchedEtape1({});
    setTouchedPhases({});
    setEtape(1);
  }

  function allerCarte() {
    setPhases((prev) => prev.map((ph) => {
      const loc = ph.localisation || (valeurs[champsAdresse?.id ?? ""] as string) || "";
      const detectes = resoudreTroncons(loc);
      const ex = new Set(ph.troncons.map((t) => t.voie_id));
      const nv = detectes.filter((id) => !ex.has(id)).map((id) => ({ voie_id: id, impact: "circulation_interdite" as CodeImpact, segment_debut: "", segment_fin: "", origine: "auto" as const }));
      return { ...ph, troncons: [...ph.troncons, ...nv] };
    }));
    setEtape(2);
  }

  function tentativeAllerCarte() {
    // Marquer tous les champs comme touched
    setTouchedEtape1((prev) => {
      const next: Record<string, boolean> = { ...prev, titre: true };
      for (const cid of champsTypeRequis) {
        next[cid] = true;
      }
      return next;
    });
    if (!etape1Valide) {
      toast.warning("Veuillez remplir tous les champs obligatoires");
      return;
    }
    allerCarte();
  }

  function tentativeAllerRecap() {
    // Marquer les champs des phases comme touched
    setTouchedPhases((prev) => {
      const next = { ...prev };
      phases.forEach((_, i) => {
        next[`${i}_date_debut`] = true;
        next[`${i}_date_fin`] = true;
        next[`${i}_troncons`] = true;
      });
      return next;
    });
    if (!etape2Valide) {
      toast.warning("Veuillez corriger les erreurs avant de continuer");
      return;
    }
    setEtape(3);
  }

  function ajouterPhase() {
    const id = phases.length + 1;
    setPhases((prev) => [...prev, { id, label: `Phase ${id}`, date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(phases.length);
  }

  function supprimerPhase(i: number) {
    if (phases.length === 1) return;
    setPhases((prev) => prev.filter((_, idx) => idx !== i));
    setPhaseActive(Math.max(0, phaseActive - 1));
  }

  function updatePhase(i: number, f: string, v: string) {
    setPhases((prev) => prev.map((ph, idx) => idx === i ? { ...ph, [f]: v } : ph));
  }

  function publierArrete() {
    const num = genNum(typeArrete!.suffixe, nextIdx);
    const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.label || VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
    const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
    if (arreteExistant) {
      const h = { version: (arreteExistant.versions.length) + 1, date: AUJOURD_HUI.toISOString().split("T")[0]!, auteur: "M. Lefèvre", motif: motifModification || "Modification", titre: arreteExistant.titre };
      dispatch({ type: "UPDATE", id: arreteExistant.id, updates: { titre: titreArrete || arreteExistant.titre, statut: "modifie", voies: tv, troncons: tronconsFlatMap, versions: [h, ...arreteExistant.versions] } });
      setDernierArrete({ numero: arreteExistant.numero, mode: "modifie", titre: titreArrete });
    } else {
      const nouvel: Arrete = { id: `a${Date.now()}`, numero: num, type_code: typeArrete!.code, type_label: typeArrete!.label, titre: titreArrete || typeArrete!.label, statut: "publie", cree_par: "M. Lefèvre", date_creation: AUJOURD_HUI.toISOString().split("T")[0]!, date_debut: phases[0]?.date_debut || "", date_fin: phases[phases.length - 1]?.date_fin || "", voies: tv, troncons: tronconsFlatMap, versions: [], arrete_abrogation: null };
      dispatch({ type: "ADD", arrete: nouvel });
      setDernierArrete({ numero: num, mode: "cree", titre: titreArrete || typeArrete!.label });
    }
    setPublie(true);
    toast.success("Arrete publie avec succes");
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px" }}>
      {!publie && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/")} className="btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }}><ChevronLeft size={12} />Accueil</button>
            <div style={{ width: 1, height: 12, background: "#D8D5C8" }} />
            {(arreteExistant ? ["Renseignements", "Voies", "Récapitulatif"] : ["Type", "Renseignements", "Voies", "Récapitulatif"]).map((lb, i) => {
              const ep = arreteExistant ? i + 1 : i;
              return (
                <div key={lb} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: isMobile ? "3px 7px" : "4px 10px", borderRadius: 20, border: `1px solid ${ep === etape ? "#1E3A5F" : "#E4E1D6"}`, background: ep === etape ? "#1E3A5F" : ep < etape ? "#EDEAE0" : "transparent", color: ep === etape ? "#FAFAF7" : ep < etape ? "#1C1F1B" : "#A6A399", fontSize: isMobile ? 10 : 11 }}>
                    {ep < etape ? <Check size={11} /> : <span className="fm" style={{ fontSize: 9 }}>{i + 1}</span>}
                    <span>{lb}</span>
                  </div>
                  {i < (arreteExistant ? 2 : 3) && <div style={{ width: 10, height: 1, background: "#D8D5C8" }} />}
                </div>
              );
            })}
          </div>
          {arreteExistant && <div style={{ background: "#EBF0F7", border: "1px solid #BFCFDF", borderRadius: 7, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#1E3A5F" }}><Edit2 size={13} /><strong>Modification de {arreteExistant.numero}</strong></div>}
        </>
      )}

      {/* Etape 0 : choix du type */}
      {etape === 0 && !arreteExistant && (
        <div>
          <h2 className="fd" style={{ fontSize: 22, marginBottom: 14 }}>Type d'arrete</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 9 }}>
            {TYPES_ARRETE.map((t) => (
              <button key={t.code} onClick={() => allerFormulaire(t)} className="card-hover" style={{ textAlign: "left", padding: 13, borderRadius: 7, border: "1px solid #E4E1D6", background: "#FFFFFF", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span className="fm" style={{ fontSize: 9, background: "#EDEAE0", color: "#6B6A60", padding: "2px 5px", borderRadius: 3 }}>{t.suffixe}</span>
                  {t.multi_phases && <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "2px 5px", borderRadius: 3, display: "flex", alignItems: "center", gap: 2 }}><Layers size={8} />Phase</span>}
                </div>
                <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 2px" }}>{t.label}</p>
                <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Etape 1 : formulaire */}
      {etape === 1 && typeArrete && !publie && (
        <div style={{ maxWidth: 520 }}>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 14 }}>{arreteExistant ? "Modifier" : "Renseignements"}</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Titre <span style={{ color: "#B91C1C" }}>*</span></label>
            <input
              type="text"
              placeholder="Ex. Refection de chaussee --- Rue de la Republique"
              value={titreArrete}
              onChange={(e) => setTitreArrete(e.target.value)}
              onBlur={() => touchField("titre")}
              style={borderErreur(!!(touchedEtape1["titre"] && !erreurTitre.valide))}
            />
            {touchedEtape1["titre"] && !erreurTitre.valide && (
              <p style={styleErreur}>{erreurTitre.erreur}</p>
            )}
          </div>
          {arreteExistant && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motif de la modification <span style={{ color: "#B91C1C" }}>*</span></label>
              <textarea rows={2} value={motifModification} onChange={(e) => setMotifModification(e.target.value)} style={{ resize: "vertical" }} />
            </div>
          )}
          {typeArrete.multi_phases && <div style={{ background: "#EDE9FE", borderRadius: 5, padding: "8px 12px", marginBottom: 10, display: "flex", gap: 7, alignItems: "flex-start" }}><Layers size={12} color="#7C3AED" style={{ marginTop: 1, flexShrink: 0 }} /><p style={{ fontSize: 11, color: "#5B21B6", margin: 0 }}><strong>Phase :</strong> {typeArrete.aide_phases}</p></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 16 }}>
            {typeArrete.champs.filter((c) => typeArrete.multi_phases ? c.type !== "adresse" && c.type !== "datetime" : true).map((c) => (
              <div key={c.id}>
                <ChampFormulaire
                  champ={c}
                  valeur={valeurs[c.id]}
                  onChange={(v) => setValeurs((p) => ({ ...p, [c.id]: v }))}
                />
                {touchedEtape1[c.id] && erreursChamps[c.id] && c.type !== "bool" && c.type !== "adresse" && (
                  <p style={styleErreur}>{erreursChamps[c.id]}</p>
                )}
              </div>
            ))}
          </div>
          {typeArrete.multi_phases && (
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <p style={{ fontWeight: 600, fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}><Flag size={12} />Phases</p>
                <button onClick={ajouterPhase} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}><Plus size={11} />Ajouter</button>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
                {phases.map((ph, i) => (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button onClick={() => setPhaseActive(i)} className={`phase-tab${phaseActive === i ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{ph.label}</button>
                    {phases.length > 1 && <button onClick={() => supprimerPhase(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}><X size={10} /></button>}
                  </div>
                ))}
              </div>
              {phases.map((ph, i) => phaseActive === i && (
                <div key={ph.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Debut</label>
                      <input
                        type="datetime-local"
                        value={ph.date_debut}
                        onChange={(e) => updatePhase(i, "date_debut", e.target.value)}
                        onBlur={() => touchPhaseField(i, "date_debut")}
                        style={borderErreur(!!(touchedPhases[`${i}_date_debut`] && erreursPhases[i]?.["date_debut"]))}
                      />
                      {touchedPhases[`${i}_date_debut`] && erreursPhases[i]?.["date_debut"] && (
                        <p style={styleErreur}>{erreursPhases[i]?.["date_debut"]}</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Fin</label>
                      <input
                        type="datetime-local"
                        value={ph.date_fin}
                        onChange={(e) => updatePhase(i, "date_fin", e.target.value)}
                        onBlur={() => touchPhaseField(i, "date_fin")}
                        style={borderErreur(!!(touchedPhases[`${i}_date_fin`] && erreursPhases[i]?.["date_fin"]))}
                      />
                      {touchedPhases[`${i}_date_fin`] && erreursPhases[i]?.["date_fin"] && (
                        <p style={styleErreur}>{erreursPhases[i]?.["date_fin"]}</p>
                      )}
                    </div>
                  </div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Voies</label><input type="text" placeholder="Ex. Rue de la Paix..." value={ph.localisation} onChange={(e) => updatePhase(i, "localisation", e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Libelle</label><input type="text" placeholder={`Phase ${i + 1}`} value={ph.label} onChange={(e) => updatePhase(i, "label", e.target.value)} /></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn-ghost" onClick={() => arreteExistant ? navigate("/") : setEtape(0)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <button
              className="btn-primary"
              onClick={tentativeAllerCarte}
              disabled={!etape1Valide}
              style={{ fontSize: 12, background: etape1Valide ? "#1E3A5F" : "#D8D5C8" }}
            >
              Identifier les voies <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Etape 2 : voies — editeur cartographique */}
      {etape === 2 && typeArrete && !publie && (
        <div>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 4 }}>Voies & impacts</h2>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 10 }}>Tracez les rues ou dessinez des zones directement sur la carte.</p>
          {typeArrete.multi_phases && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {phases.map((ph, i) => <button key={ph.id} onClick={() => setPhaseActive(i)} className={`phase-tab${phaseActive === i ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{ph.label} · {ph.troncons.length} voie{ph.troncons.length !== 1 ? "s" : ""}</button>)}
            </div>
          )}
          {touchedPhases[`${phaseActive}_troncons`] && erreursPhases[phaseActive]?.["troncons"] && (
            <p style={styleErreur}>{erreursPhases[phaseActive]?.["troncons"]}</p>
          )}
          <CarteDessin
            troncons={phaseActuelle.troncons}
            rueInitiale={(valeurs[champsAdresse?.id ?? ""] as string) || ""}
            onAdd={(t) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: [...ph.troncons, t] }
              ));
            }}
            onRemove={(idx) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.filter((_, j) => j !== idx) }
              ));
            }}
            onUpdateImpact={(idx, impact) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.map((t, j) => j === idx ? { ...t, impact } : t) }
              ));
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setEtape(1)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <button
              className="btn-primary"
              onClick={tentativeAllerRecap}
              disabled={!etape2Valide}
              style={{ background: etape2Valide ? "#1E3A5F" : "#D8D5C8", fontSize: 12 }}
            >
              Valider <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Etape 3 : recapitulatif */}
      {etape === 3 && typeArrete && !publie && (
        <div style={{ maxWidth: 560 }}>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 12 }}>Recapitulatif</h2>
          <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #E4E1D6" }}>
              <div><p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Numero</p><p className="fm" style={{ fontSize: 14, color: "#1E3A5F", margin: 0 }}>{arreteExistant ? arreteExistant.numero : genNum(typeArrete.suffixe, nextIdx)}</p></div>
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "3px 8px", borderRadius: 4, alignSelf: "flex-start" }}>{typeArrete.label}</span>
            </div>
            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 8px" }}>{titreArrete}</p>
            {arreteExistant && <div style={{ background: "#FEF3C7", borderRadius: 5, padding: "8px 11px", marginBottom: 10 }}><p style={{ fontSize: 11, fontWeight: 600, margin: "0 0 2px", color: "#92400E" }}>Motif</p><p style={{ fontSize: 12, margin: 0, color: "#78350F" }}>{motifModification || "Non precise"}</p></div>}
            <div style={{ borderTop: "1px solid #E4E1D6", paddingTop: 10 }}>
              {phases.map((ph) => (
                <div key={ph.id} style={{ marginBottom: 7 }}>
                  {phases.length > 1 && <p style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F", margin: "0 0 3px" }}>{ph.label}</p>}
                  {ph.troncons.map((t) => {
                    const nom = t.label || VOIES.find((x) => x.id === t.voie_id)?.nom || t.voie_id;
                    const ti = TYPES_IMPACT.find((x) => x.code === t.impact);
                    return <p key={t.voie_id} style={{ margin: "1px 0", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: ti?.couleur, flexShrink: 0 }} /><strong>{nom}</strong> · {ti?.label}</p>;
                  })}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#F4F2EC", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#6B6A60" }}>
            <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#1C1F1B", fontSize: 12 }}>A la publication :</p>
            {[[FileText, arreteExistant ? "PDF mis a jour" : "PDF officiel genere"], [MapPin, `Carte mise a jour (${totalTroncons} troncon${totalTroncons > 1 ? "s" : ""})`], [Check, "Diffusion aux services"]].map(([Icon, txt]) => (
              <p key={txt as string} style={{ margin: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>{typeof Icon === "function" ? <Icon size={11} /> : null}{txt as string}</p>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn-ghost" onClick={() => setEtape(2)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => {
                const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
                const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.label || VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
                const apercu: Arrete = {
                  id: "apercu",
                  numero: arreteExistant ? arreteExistant.numero : genNum(typeArrete!.suffixe, nextIdx),
                  type_code: typeArrete!.code,
                  type_label: typeArrete!.label,
                  titre: titreArrete || typeArrete!.label,
                  statut: "brouillon",
                  cree_par: "M. Lefevre",
                  date_creation: AUJOURD_HUI.toISOString().split("T")[0]!,
                  date_debut: phases[0]?.date_debut || "",
                  date_fin: phases[phases.length - 1]?.date_fin || "",
                  voies: tv,
                  troncons: tronconsFlatMap,
                  versions: [],
                  arrete_abrogation: null,
                };
                ouvrirApercuPdf(apercu, references, tenant.nom, tenant.code_postal, tenant);
              }} style={{ fontSize: 12 }}><FileText size={12} />Apercu PDF</button>
              <button
                onClick={publierArrete}
                disabled={!etape1Valide || !etape2Valide}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: (etape1Valide && etape2Valide) ? "pointer" : "not-allowed", background: (etape1Valide && etape2Valide) ? (arreteExistant ? "#1E3A5F" : "#2F6B4F") : "#D8D5C8", color: "#FAFAF7", fontFamily: "'IBM Plex Sans',sans-serif" }}
              >
                {arreteExistant ? <><RefreshCw size={12} />Enregistrer</> : <><Check size={12} />Publier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {publie && (
        <div style={{ maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: arreteExistant ? "#1E3A5F" : "#2F6B4F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {arreteExistant ? <RefreshCw size={19} color="#FAFAF7" /> : <Check size={19} color="#FAFAF7" />}
            </div>
            <div><h2 className="fd" style={{ fontSize: 20, margin: 0 }}>{arreteExistant ? "Modifie" : "Publie"}</h2><p className="fm" style={{ margin: 0, fontSize: 11, color: "#1E3A5F" }}>{dernierArrete?.numero}</p></div>
          </div>
          <p style={{ color: "#1C1F1B", fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>{dernierArrete?.titre}</p>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 16 }}>{arreteExistant ? "Version precedente archivee." : "PDF · Carte · Notifications."}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => navigate("/")} style={{ fontSize: 12 }}><Home size={12} />Accueil</button>
            <button className="btn-secondary" onClick={() => navigate("/carte")} style={{ fontSize: 12 }}><Map size={12} />Voir la carte</button>
            <button className="btn-ghost" onClick={() => { setPublie(false); setEtape(0); setTypeArrete(null); }} style={{ fontSize: 12 }}><Plus size={12} />Nouvel arrete</button>
          </div>
        </div>
      )}
    </div>
  );
}
