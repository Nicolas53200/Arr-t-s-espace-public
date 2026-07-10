import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, Eye, Clock, X, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { AUJOURD_HUI } from "@/config/constants";
import { COULEUR_TYPE } from "@/config/theme";
import { TYPES_ARRETE } from "@/data/types-arrete";
import { TYPES_IMPACT } from "@/data/types-impact";
import { VOIES } from "@/data/voies";
import { fmtDate, fmtDateCourte, isFutur, isEnCours } from "@/lib/date";
import StatCard from "@/components/common/StatCard";
import CarteLeaflet from "@/components/carte/CarteLeaflet";
import type { Arrete, CodeTypeArrete } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function CartePage() {
  const navigate = useNavigate();
  const { actifs, arretes } = useArretes();
  const [filtreTypes, setFiltreTypes] = useState<Set<string>>(new Set());
  const [arreteSelectionne, setArreteSelectionne] = useState<Arrete | null>(null);
  const [showFuturs, setShowFuturs] = useState(true);
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const arretesAffiches = useMemo(() => {
    return actifs.filter((a) => {
      if (!showFuturs && isFutur(a.date_debut)) return false;
      if (filtreTypes.size > 0 && !filtreTypes.has(a.type_code)) return false;
      return true;
    });
  }, [actifs, filtreTypes, showFuturs]);

  const impactsParVoie = useMemo(() => {
    const map: Record<string, { impact: string; arrete: Arrete }[]> = {};
    for (const a of arretesAffiches) {
      if (!a.troncons) continue;
      for (const t of a.troncons) {
        if (!map[t.voie_id]) map[t.voie_id] = [];
        map[t.voie_id]!.push({ impact: t.impact, arrete: a });
      }
    }
    return map;
  }, [arretesAffiches]);

  const typesPresents = [...new Set(actifs.map((a) => a.type_code))];

  function toggleFiltre(code: string) {
    setFiltreTypes((prev) => {
      const n = new Set(prev);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  }

  return (
    <div style={{ padding: isMobile ? "16px 16px 48px" : "24px 24px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Carte des impacts</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>Vue territoriale des arrêtés actifs en cours et à venir</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/nouveau")} style={{ padding: "8px 16px", fontSize: 13 }}><Plus size={13} />Nouvel arrêté</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14, padding: "10px 14px", background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: "#6B6A60", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Filter size={12} />Filtrer :</span>
        <button className={`filtre-btn${filtreTypes.size === 0 ? " actif" : ""}`} style={{ "--fc": "#1E3A5F" } as React.CSSProperties}
          onClick={() => setFiltreTypes(new Set())}><Eye size={11} />Tout</button>
        {typesPresents.map((code) => {
          const t = TYPES_ARRETE.find((x) => x.code === code);
          const coul = COULEUR_TYPE[code as CodeTypeArrete] || "#6B6A60";
          const actif = filtreTypes.has(code);
          return (
            <button key={code} className={`filtre-btn${actif ? " actif" : ""}`} style={{ "--fc": coul } as React.CSSProperties}
              onClick={() => toggleFiltre(code)}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: actif ? "#fff" : coul, display: "inline-block" }} />
              {t?.label || code}
            </button>
          );
        })}
        <div style={{ height: 16, width: 1, background: "#E4E1D6", margin: "0 4px" }} />
        <button className={`filtre-btn${showFuturs ? " actif" : ""}`} style={{ "--fc": "#6B7280" } as React.CSSProperties}
          onClick={() => setShowFuturs((v) => !v)}><Clock size={11} />{showFuturs ? "Futurs visibles" : "Futurs masqués"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 18, alignItems: "start" }}>
        <CarteLeaflet
          arretes={arretesAffiches}
          onSelectArrete={setArreteSelectionne}
          arreteSelectionne={arreteSelectionne}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A6A399", margin: "0 0 8px" }}>Résumé · {AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <StatCard label="En cours" valeur={actifs.filter((a) => isEnCours(a.date_debut, a.date_fin)).length} couleur="#2F6B4F" />
              <StatCard label="À venir" valeur={actifs.filter((a) => isFutur(a.date_debut)).length} couleur="#1E3A5F" />
              <StatCard label="Voies impactées" valeur={Object.keys(impactsParVoie).length} couleur="#D9730D" />
            </div>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A6A399", margin: "0 0 10px" }}>Arrêtés affichés ({arretesAffiches.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {arretesAffiches.map((a) => {
                const sel = arreteSelectionne?.id === a.id;
                return (
                  <button key={a.id} onClick={() => setArreteSelectionne(sel ? null : a)}
                    style={{ textAlign: "left", padding: "8px 10px", borderRadius: 6, border: `1px solid ${sel ? "#1E3A5F" : "#E4E1D6"}`, background: sel ? "#EBF0F7" : "#FAFAF7", cursor: "pointer", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: COULEUR_TYPE[a.type_code] || "#6B6A60", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: COULEUR_TYPE[a.type_code] || "#6B6A60", fontFamily: "'IBM Plex Mono',monospace" }}>{a.numero}</span>
                      {isFutur(a.date_debut) && <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "1px 5px", borderRadius: 10, fontWeight: 600 }}>À venir</span>}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 2px", lineHeight: 1.3 }}>{a.titre}</p>
                    <p style={{ fontSize: 11, color: "#A6A399", margin: 0 }}>{fmtDateCourte(a.date_debut)} → {fmtDateCourte(a.date_fin)}</p>
                  </button>
                );
              })}
              {arretesAffiches.length === 0 && <p style={{ fontSize: 12, color: "#A6A399", textAlign: "center", padding: "12px 0" }}>Aucun arrêté avec ce filtre.</p>}
            </div>
          </div>

          {arreteSelectionne && (
            <div style={{ background: "#FFFFFF", border: "1px solid #1E3A5F", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F", margin: 0, fontFamily: "'IBM Plex Mono',monospace" }}>{arreteSelectionne.numero}</p>
                <button onClick={() => setArreteSelectionne(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A6A399", padding: 0 }}><X size={13} /></button>
              </div>
              <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 6px" }}>{arreteSelectionne.titre}</p>
              <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 6px" }}>{fmtDate(arreteSelectionne.date_debut)} → {fmtDate(arreteSelectionne.date_fin)}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {(arreteSelectionne.troncons || []).map((t) => {
                  const v = VOIES.find((x) => x.id === t.voie_id);
                  const ti = TYPES_IMPACT.find((x) => x.code === t.impact);
                  return <p key={t.voie_id} style={{ margin: 0, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: ti?.couleur, flexShrink: 0 }} />{v?.nom} · {ti?.label}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18, border: "1px solid #E4E1D6", borderRadius: 10, background: "#FFFFFF", overflow: "hidden" }}>
        <button onClick={() => setCalendrierOuvert((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: calendrierOuvert ? "#F4F2EC" : "#FFFFFF", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Calendar size={16} color="#1E3A5F" />
            <span className="fd" style={{ fontSize: 16, color: "#1C1F1B" }}>Calendrier des arrêtés</span>
            <span style={{ fontSize: 11, color: "#6B6A60" }}>— voir les arrêtés actifs et à venir par mois</span>
          </span>
          {calendrierOuvert ? <ChevronUp size={17} color="#6B6A60" /> : <ChevronDown size={17} color="#6B6A60" />}
        </button>
        {calendrierOuvert && (
          <div style={{ padding: "4px 18px 20px", borderTop: "1px solid #E4E1D6" }}>
            <VueCalendrier arretes={arretes} />
          </div>
        )}
      </div>
    </div>
  );
}

function VueCalendrier({ arretes }: { arretes: Arrete[] }) {
  const [moisActuel, setMoisActuel] = useState(new Date(AUJOURD_HUI.getFullYear(), AUJOURD_HUI.getMonth(), 1));
  const [filtreTypes, setFiltreTypes] = useState<Set<string>>(new Set());
  const [arreteSelectionne, setArreteSelectionne] = useState<Arrete | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const moisSuivant = () => setMoisActuel((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const moisPrecedent = () => setMoisActuel((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));

  const arretesVisibles = useMemo(() => {
    return arretes.filter((a) => {
      if (a.statut === "abroge") return false;
      if (filtreTypes.size > 0 && !filtreTypes.has(a.type_code)) return false;
      return true;
    });
  }, [arretes, filtreTypes]);

  const jours = useMemo(() => {
    const premier = new Date(moisActuel.getFullYear(), moisActuel.getMonth(), 1);
    const dernier = new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 0);
    const debutSemaine = premier.getDay() === 0 ? 6 : premier.getDay() - 1;
    const res: { date: Date; autreMois: boolean }[] = [];
    for (let i = debutSemaine - 1; i >= 0; i--) {
      const d = new Date(premier);
      d.setDate(-i);
      res.push({ date: d, autreMois: true });
    }
    for (let d = 1; d <= dernier.getDate(); d++) {
      res.push({ date: new Date(moisActuel.getFullYear(), moisActuel.getMonth(), d), autreMois: false });
    }
    while (res.length < 42) {
      const last = res[res.length - 1]!.date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      res.push({ date: next, autreMois: true });
    }
    return res;
  }, [moisActuel]);

  function arretesJour(date: Date) {
    return arretesVisibles.filter((a) => {
      if (!a.date_debut || !a.date_fin) return false;
      const debut = new Date(a.date_debut);
      const fin = new Date(a.date_fin);
      debut.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      const d = new Date(date);
      d.setHours(12, 0, 0, 0);
      return d >= debut && d <= fin;
    });
  }

  const typesPresents = [...new Set(arretes.filter((a) => a.statut !== "abroge").map((a) => a.type_code))];

  function toggleFiltre(code: string) {
    setFiltreTypes((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  }

  const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const MOIS_NOMS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn-ghost" onClick={moisPrecedent} style={{ padding: "6px 10px" }}><ChevronLeft size={15} /></button>
          <span className="fd" style={{ fontSize: 16, minWidth: 160, textAlign: "center" }}>{MOIS_NOMS[moisActuel.getMonth()]} {moisActuel.getFullYear()}</span>
          <button className="btn-ghost" onClick={moisSuivant} style={{ padding: "6px 10px" }}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
        <button className={`filtre-btn${filtreTypes.size === 0 ? " actif" : ""}`} style={{ "--fc": "#1E3A5F" } as React.CSSProperties} onClick={() => setFiltreTypes(new Set())}>
          <Eye size={11} />Tous
        </button>
        {typesPresents.map((code) => {
          const t = TYPES_ARRETE.find((x) => x.code === code);
          const coul = COULEUR_TYPE[code as CodeTypeArrete] || "#6B6A60";
          const actif = filtreTypes.has(code);
          return (
            <button key={code} className={`filtre-btn${actif ? " actif" : ""}`} style={{ "--fc": coul } as React.CSSProperties} onClick={() => toggleFiltre(code)}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: actif ? "#fff" : coul, display: "inline-block" }} />{t?.label || code}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 18, alignItems: "start" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 10, padding: isMobile ? 10 : 20, overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
            {JOURS_SEMAINE.map((j) => (
              <div key={j} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#A6A399", padding: "4px 0" }}>{j}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {jours.map(({ date, autreMois }, i) => {
              const isToday = date.toDateString() === AUJOURD_HUI.toDateString();
              const aj = arretesJour(date);
              const selDate = arreteSelectionne && aj.some((a) => a.id === arreteSelectionne.id);
              return (
                <div key={i} className={`cal-day${autreMois ? " other-month" : ""}${isToday ? " today" : ""}`}
                  onClick={() => aj.length > 0 && setArreteSelectionne(selDate ? null : aj[0] ?? null)}
                  style={{ cursor: aj.length > 0 ? "pointer" : "default", background: selDate ? "#EBF0F7" : "transparent" }}>
                  <p style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#1E3A5F" : "#1C1F1B", margin: "0 0 4px", textAlign: "right" }}>{date.getDate()}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {aj.slice(0, 4).map((a) => (
                      <div key={a.id} style={{ borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, background: COULEUR_TYPE[a.type_code] || "#6B6A60", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.5 }}>
                        {a.titre.length > 22 ? a.titre.slice(0, 20) + "…" : a.titre}
                      </div>
                    ))}
                    {aj.length > 4 && <div style={{ fontSize: 10, color: "#6B6A60", paddingLeft: 5 }}>+{aj.length - 4} autre{aj.length - 4 > 1 ? "s" : ""}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8, padding: "12px 14px" }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A6A399", margin: "0 0 10px" }}>{MOIS_NOMS[moisActuel.getMonth()]} {moisActuel.getFullYear()}</p>
            {(() => {
              const du_mois = arretesVisibles.filter((a) => {
                const d = new Date(a.date_debut), f = new Date(a.date_fin);
                const debut_mois = new Date(moisActuel.getFullYear(), moisActuel.getMonth(), 1);
                const fin_mois = new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 0);
                return d <= fin_mois && f >= debut_mois;
              });
              if (du_mois.length === 0) return <p style={{ fontSize: 12, color: "#A6A399", textAlign: "center", padding: "8px 0" }}>Aucun arrêté ce mois.</p>;
              return du_mois.map((a) => (
                <button key={a.id} onClick={() => setArreteSelectionne(arreteSelectionne?.id === a.id ? null : a)}
                  style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6, border: `1px solid ${arreteSelectionne?.id === a.id ? "#1E3A5F" : "#E4E1D6"}`, background: arreteSelectionne?.id === a.id ? "#EBF0F7" : "#FAFAF7", cursor: "pointer", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COULEUR_TYPE[a.type_code] || "#6B6A60", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: COULEUR_TYPE[a.type_code], fontFamily: "'IBM Plex Mono',monospace" }}>{a.numero}</span>
                    {isFutur(a.date_debut) && <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "1px 5px", borderRadius: 10, fontWeight: 600 }}>À venir</span>}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 2px" }}>{a.titre}</p>
                  <p style={{ fontSize: 11, color: "#A6A399", margin: 0 }}>{fmtDateCourte(a.date_debut)} → {fmtDateCourte(a.date_fin)}</p>
                </button>
              ));
            })()}
          </div>

          {arreteSelectionne && (
            <div style={{ background: "#FFFFFF", border: "1px solid #1E3A5F", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#1E3A5F", fontFamily: "'IBM Plex Mono',monospace" }}>{arreteSelectionne.numero}</span>
                <button onClick={() => setArreteSelectionne(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A6A399", padding: 0 }}><X size={12} /></button>
              </div>
              <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>{arreteSelectionne.titre}</p>
              <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 6px" }}>{fmtDate(arreteSelectionne.date_debut)} → {fmtDate(arreteSelectionne.date_fin)}</p>
              <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 4px" }}>Par {arreteSelectionne.cree_par}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {arreteSelectionne.voies.slice(0, 4).map((v) => (
                  <span key={v} style={{ fontSize: 10, background: "#F4F2EC", color: "#6B6A60", padding: "2px 7px", borderRadius: 10 }}>{v}</span>
                ))}
                {arreteSelectionne.voies.length > 4 && <span style={{ fontSize: 10, color: "#A6A399" }}>+{arreteSelectionne.voies.length - 4}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
