import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Check, Plus, X, Layers, Flag, Edit2, RefreshCw,
  FileText, MapPin, Home, Map, AlertTriangle,
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
import { couleurImpact, resoudreTroncons } from "@/lib/voie";
import { genNum } from "@/lib/arrete";
import ChampFormulaire from "@/components/formulaire/ChampFormulaire";
import type { Arrete, TypeArrete, Phase, Troncon, CodeImpact } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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

  const champsAdresse = useMemo(() => typeArrete?.champs.find((c) => c.type === "adresse"), [typeArrete]);
  const phaseActuelle = phases[phaseActive] || { troncons: [] as Troncon[] };
  const tronconIdsActifs = new Set(phaseActuelle.troncons.map((t) => t.voie_id));
  const totalTroncons = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.voie_id)))].length;
  const champsValides = typeArrete ? typeArrete.champs.filter((c) => c.type !== "bool" && c.type !== "adresse").every((c) => (valeurs[c.id] as string)?.trim()) && titreArrete.trim() : false;

  function allerFormulaire(t: TypeArrete) {
    setTypeArrete(t);
    setValeurs({});
    setTitreArrete("");
    setPhases([{ id: 1, label: t.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(0);
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

  function toggleTroncon(vid: string) {
    setPhases((prev) => prev.map((ph, i) => {
      if (i !== phaseActive) return ph;
      const ex = ph.troncons.find((t) => t.voie_id === vid);
      if (ex) return { ...ph, troncons: ph.troncons.filter((t) => t.voie_id !== vid) };
      return { ...ph, troncons: [...ph.troncons, { voie_id: vid, impact: "circulation_interdite" as CodeImpact, segment_debut: "", segment_fin: "", origine: "manuel" as const }] };
    }));
  }

  function setImpactTroncon(vid: string, impact: string) {
    setPhases((prev) => prev.map((ph, i) => i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.map((t) => t.voie_id === vid ? { ...t, impact: impact as CodeImpact } : t) }));
  }

  function setSegTroncon(vid: string, f: string, v: string) {
    setPhases((prev) => prev.map((ph, i) => i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.map((t) => t.voie_id === vid ? { ...t, [f]: v } : t) }));
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
    const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
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

      {/* Étape 0 : choix du type */}
      {etape === 0 && !arreteExistant && (
        <div>
          <h2 className="fd" style={{ fontSize: 22, marginBottom: 14 }}>Type d'arrêté</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 9 }}>
            {TYPES_ARRETE.map((t) => (
              <button key={t.code} onClick={() => allerFormulaire(t)} className="card-hover" style={{ textAlign: "left", padding: 13, borderRadius: 7, border: "1px solid #E4E1D6", background: "#FFFFFF", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span className="fm" style={{ fontSize: 9, background: "#EDEAE0", color: "#6B6A60", padding: "2px 5px", borderRadius: 3 }}>{t.suffixe}</span>
                  {t.multi_phases && <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "2px 5px", borderRadius: 3, display: "flex", alignItems: "center", gap: 2 }}><Layers size={8} />Phasé</span>}
                </div>
                <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 2px" }}>{t.label}</p>
                <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Étape 1 : formulaire */}
      {etape === 1 && typeArrete && !publie && (
        <div style={{ maxWidth: 520 }}>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 14 }}>{arreteExistant ? "Modifier" : "Renseignements"}</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Titre <span style={{ color: "#B91C1C" }}>*</span></label>
            <input type="text" placeholder="Ex. Réfection de chaussée — Rue de la République" value={titreArrete} onChange={(e) => setTitreArrete(e.target.value)} />
          </div>
          {arreteExistant && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motif de la modification <span style={{ color: "#B91C1C" }}>*</span></label>
              <textarea rows={2} value={motifModification} onChange={(e) => setMotifModification(e.target.value)} style={{ resize: "vertical" }} />
            </div>
          )}
          {typeArrete.multi_phases && <div style={{ background: "#EDE9FE", borderRadius: 5, padding: "8px 12px", marginBottom: 10, display: "flex", gap: 7, alignItems: "flex-start" }}><Layers size={12} color="#7C3AED" style={{ marginTop: 1, flexShrink: 0 }} /><p style={{ fontSize: 11, color: "#5B21B6", margin: 0 }}><strong>Phasé :</strong> {typeArrete.aide_phases}</p></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 16 }}>
            {typeArrete.champs.filter((c) => typeArrete.multi_phases ? c.type !== "adresse" && c.type !== "datetime" : true).map((c) => (
              <ChampFormulaire key={c.id} champ={c} valeur={valeurs[c.id]} onChange={(v) => setValeurs((p) => ({ ...p, [c.id]: v }))} />
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
                    <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Début</label><input type="datetime-local" value={ph.date_debut} onChange={(e) => updatePhase(i, "date_debut", e.target.value)} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Fin</label><input type="datetime-local" value={ph.date_fin} onChange={(e) => updatePhase(i, "date_fin", e.target.value)} /></div>
                  </div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Voies</label><input type="text" placeholder="Ex. Rue de la Paix…" value={ph.localisation} onChange={(e) => updatePhase(i, "localisation", e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Libellé</label><input type="text" placeholder={`Phase ${i + 1}`} value={ph.label} onChange={(e) => updatePhase(i, "label", e.target.value)} /></div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn-ghost" onClick={() => arreteExistant ? navigate("/") : setEtape(0)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <button className="btn-primary" onClick={() => { if (!champsValides) { toast.warning("Veuillez remplir tous les champs obligatoires"); return; } allerCarte(); }} style={{ fontSize: 12 }}>Identifier les voies <ChevronRight size={13} /></button>
          </div>
        </div>
      )}

      {/* Étape 2 : voies */}
      {etape === 2 && typeArrete && !publie && (
        <div>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 4 }}>Voies & impacts</h2>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 10 }}>Cliquez pour sélectionner ou retirer un tronçon.</p>
          {typeArrete.multi_phases && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {phases.map((ph, i) => <button key={ph.id} onClick={() => setPhaseActive(i)} className={`phase-tab${phaseActive === i ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{ph.label} · {ph.troncons.length} voie{ph.troncons.length !== 1 ? "s" : ""}</button>)}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14 }}>
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 13 }}>
              <svg viewBox="0 0 360 340" style={{ width: "100%", height: "auto", maxHeight: 420 }}>
                <rect width="360" height="340" fill="#F4F2EC" />
                {VOIES.map((v) => {
                  const troncon = phaseActuelle.troncons.find((t) => t.voie_id === v.id);
                  const sel = !!troncon, coul = sel ? couleurImpact(troncon!.impact) : "#C9C6BA", larg = sel ? 7 : 3;
                  return v.isZone
                    ? <path key={v.id} d={v.path} className="tr-voie" fill={sel ? `${coul}33` : "#C9C6BA22"} stroke={coul} strokeWidth={larg} onClick={() => toggleTroncon(v.id)} />
                    : <path key={v.id} d={v.path} className="tr-voie" fill="none" stroke={coul} strokeWidth={larg} strokeLinecap="round" onClick={() => toggleTroncon(v.id)} />;
                })}
              </svg>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 8 }}>
                {TYPES_IMPACT.map((ti) => <span key={ti.code} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#6B6A60" }}><span style={{ width: 12, height: 3, background: ti.couleur, borderRadius: 2, display: "inline-block" }} />{ti.label}</span>)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6A60", margin: "0 0 6px" }}>Sélectionnées ({phaseActuelle.troncons.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {phaseActuelle.troncons.map((t) => {
                  const v = VOIES.find((x) => x.id === t.voie_id);
                  return (
                    <div key={t.voie_id} style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 5, padding: "8px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: couleurImpact(t.impact), flexShrink: 0 }} />{v?.nom}</span>
                        <button onClick={() => toggleTroncon(t.voie_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A6A399" }}><X size={11} /></button>
                      </div>
                      <select value={t.impact} onChange={(e) => setImpactTroncon(t.voie_id, e.target.value)} style={{ marginBottom: 4, fontSize: 11 }}>{TYPES_IMPACT.map((ti) => <option key={ti.code} value={ti.code}>{ti.label}</option>)}</select>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                        <input type="text" placeholder="Début" value={t.segment_debut || ""} onChange={(e) => setSegTroncon(t.voie_id, "segment_debut", e.target.value)} style={{ fontSize: 10, padding: "3px 5px" }} />
                        <input type="text" placeholder="Fin" value={t.segment_fin || ""} onChange={(e) => setSegTroncon(t.voie_id, "segment_fin", e.target.value)} style={{ fontSize: 10, padding: "3px 5px" }} />
                      </div>
                    </div>
                  );
                })}
                {phaseActuelle.troncons.length === 0 && <p style={{ fontSize: 11, color: "#A6A399", display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={11} />Cliquez sur la carte</p>}
              </div>
              <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6B6A60", margin: "0 0 4px" }}>Autres voies</p>
              {VOIES.filter((v) => !tronconIdsActifs.has(v.id)).map((v) => (
                <button key={v.id} onClick={() => toggleTroncon(v.id)} style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", textAlign: "left", fontSize: 11, color: "#6B6A60", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1px solid #C9C6BA", flexShrink: 0 }} />{v.nom}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setEtape(1)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <button className="btn-primary" onClick={() => setEtape(3)} disabled={totalTroncons === 0} style={{ background: totalTroncons > 0 ? "#1E3A5F" : "#D8D5C8", fontSize: 12 }}>Valider <ChevronRight size={13} /></button>
          </div>
        </div>
      )}

      {/* Étape 3 : récapitulatif */}
      {etape === 3 && typeArrete && !publie && (
        <div style={{ maxWidth: 560 }}>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 12 }}>Récapitulatif</h2>
          <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #E4E1D6" }}>
              <div><p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Numéro</p><p className="fm" style={{ fontSize: 14, color: "#1E3A5F", margin: 0 }}>{arreteExistant ? arreteExistant.numero : genNum(typeArrete.suffixe, nextIdx)}</p></div>
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "3px 8px", borderRadius: 4, alignSelf: "flex-start" }}>{typeArrete.label}</span>
            </div>
            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 8px" }}>{titreArrete}</p>
            {arreteExistant && <div style={{ background: "#FEF3C7", borderRadius: 5, padding: "8px 11px", marginBottom: 10 }}><p style={{ fontSize: 11, fontWeight: 600, margin: "0 0 2px", color: "#92400E" }}>Motif</p><p style={{ fontSize: 12, margin: 0, color: "#78350F" }}>{motifModification || "Non précisé"}</p></div>}
            <div style={{ borderTop: "1px solid #E4E1D6", paddingTop: 10 }}>
              {phases.map((ph) => (
                <div key={ph.id} style={{ marginBottom: 7 }}>
                  {phases.length > 1 && <p style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F", margin: "0 0 3px" }}>{ph.label}</p>}
                  {ph.troncons.map((t) => {
                    const v = VOIES.find((x) => x.id === t.voie_id), ti = TYPES_IMPACT.find((x) => x.code === t.impact);
                    return <p key={t.voie_id} style={{ margin: "1px 0", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: ti?.couleur, flexShrink: 0 }} /><strong>{v?.nom}</strong> · {ti?.label}</p>;
                  })}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#F4F2EC", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#6B6A60" }}>
            <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#1C1F1B", fontSize: 12 }}>À la publication :</p>
            {[[FileText, arreteExistant ? "PDF mis à jour" : "PDF officiel généré"], [MapPin, `Carte mise à jour (${totalTroncons} tronçon${totalTroncons > 1 ? "s" : ""})`], [Check, "Diffusion aux services"]].map(([Icon, txt]) => (
              <p key={txt as string} style={{ margin: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>{typeof Icon === "function" ? <Icon size={11} /> : null}{txt as string}</p>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn-ghost" onClick={() => setEtape(2)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => {
                const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
                const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
                const apercu: Arrete = {
                  id: "apercu",
                  numero: arreteExistant ? arreteExistant.numero : genNum(typeArrete!.suffixe, nextIdx),
                  type_code: typeArrete!.code,
                  type_label: typeArrete!.label,
                  titre: titreArrete || typeArrete!.label,
                  statut: "brouillon",
                  cree_par: "M. Lefèvre",
                  date_creation: AUJOURD_HUI.toISOString().split("T")[0]!,
                  date_debut: phases[0]?.date_debut || "",
                  date_fin: phases[phases.length - 1]?.date_fin || "",
                  voies: tv,
                  troncons: tronconsFlatMap,
                  versions: [],
                  arrete_abrogation: null,
                };
                ouvrirApercuPdf(apercu, references, tenant.nom, tenant.code_postal);
              }} style={{ fontSize: 12 }}><FileText size={12} />Aperçu PDF</button>
              <button onClick={publierArrete} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: arreteExistant ? "#1E3A5F" : "#2F6B4F", color: "#FAFAF7", fontFamily: "'IBM Plex Sans',sans-serif" }}>
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
            <div><h2 className="fd" style={{ fontSize: 20, margin: 0 }}>{arreteExistant ? "Modifié" : "Publié"}</h2><p className="fm" style={{ margin: 0, fontSize: 11, color: "#1E3A5F" }}>{dernierArrete?.numero}</p></div>
          </div>
          <p style={{ color: "#1C1F1B", fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>{dernierArrete?.titre}</p>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 16 }}>{arreteExistant ? "Version précédente archivée." : "PDF · Carte · Notifications."}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => navigate("/")} style={{ fontSize: 12 }}><Home size={12} />Accueil</button>
            <button className="btn-secondary" onClick={() => navigate("/carte")} style={{ fontSize: 12 }}><Map size={12} />Voir la carte</button>
            <button className="btn-ghost" onClick={() => { setPublie(false); setEtape(0); setTypeArrete(null); }} style={{ fontSize: 12 }}><Plus size={12} />Nouvel arrêté</button>
          </div>
        </div>
      )}
    </div>
  );
}
