import { useMemo } from "react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { AUJOURD_HUI } from "@/config/constants";
import {
  arreteParMois,
  arreteParType,
  arreteParStatut,
  tauxAbrogation,
  delaiMoyenPublication,
  referenceExpirations,
  evolutionMensuelle,
  topVoies,
  dureeMoyenneArretes,
  tauxRenouvellement,
  arreteParJourSemaine,
} from "@/lib/analytics";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import SparkLine from "@/components/charts/SparkLine";
import AreaChart from "@/components/charts/AreaChart";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  MapPin,
  CalendarDays,
  BarChart3,
  RefreshCw,
  Activity,
  AlertTriangle,
} from "lucide-react";

// ──── Styles ────

const couleurs = {
  fond: "#F8F7F4",
  carte: "#FFFFFF",
  bordure: "#E4E1D6",
  texte: "#1C1F1B",
  texteMuted: "#6B6A60",
  accent: "#1E3A5F",
  accentLight: "#E8EEF4",
  succes: "#065F46",
  succesLight: "#ECFDF5",
  warning: "#92400E",
  warningLight: "#FEF3C7",
  danger: "#B91C1C",
  dangerLight: "#FEF2F2",
  info: "#0E7490",
  infoLight: "#ECFEFF",
};

const s = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 24px",
    fontFamily: "'IBM Plex Sans', sans-serif",
  } as const,
  header: {
    marginBottom: 32,
  } as const,
  titre: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: couleurs.texte,
    margin: "0 0 4px 0",
  },
  sousTitre: {
    fontSize: 13,
    color: couleurs.texteMuted,
    margin: 0,
  },
  grille4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  } as const,
  grille3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 24,
  } as const,
  grille2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 24,
  } as const,
  carte: {
    background: couleurs.carte,
    border: `1px solid ${couleurs.bordure}`,
    borderRadius: 10,
    padding: "20px 24px",
  } as const,
  carteCompacte: {
    background: couleurs.carte,
    border: `1px solid ${couleurs.bordure}`,
    borderRadius: 10,
    padding: "16px 20px",
  } as const,
  sectionTitre: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: couleurs.texte,
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as const,
  kpiLabel: {
    fontSize: 11,
    color: couleurs.texteMuted,
    margin: "0 0 6px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    fontWeight: 500 as const,
  },
  kpiValeur: {
    fontSize: 26,
    fontWeight: 700 as const,
    color: couleurs.texte,
    margin: 0,
    fontFamily: "'IBM Plex Mono', monospace",
    lineHeight: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: `2px solid ${couleurs.bordure}`,
    color: couleurs.texteMuted,
    fontWeight: 500 as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  td: {
    padding: "8px 12px",
    borderBottom: `1px solid ${couleurs.bordure}`,
    color: couleurs.texte,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 99,
    fontSize: 11,
    fontWeight: 600 as const,
    fontFamily: "'IBM Plex Mono', monospace",
  } as const,
};

// ──── Composants internes ────

function CarteKpi({
  label,
  valeur,
  unite,
  icone,
  sparkData,
  sparkCouleur,
  tendance,
  couleurFond,
}: {
  label: string;
  valeur: number | string;
  unite?: string;
  icone?: React.ReactNode;
  sparkData?: number[];
  sparkCouleur?: string;
  tendance?: "hausse" | "baisse" | "stable";
  couleurFond?: string;
}) {
  return (
    <div style={{ ...s.carteCompacte, background: couleurFond ?? couleurs.carte }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={s.kpiLabel}>{label}</p>
        {icone && (
          <span style={{ color: couleurs.texteMuted, opacity: 0.5 }}>{icone}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <p style={s.kpiValeur}>{valeur}</p>
          {unite && (
            <span style={{ fontSize: 13, fontWeight: 400, color: couleurs.texteMuted }}>
              {unite}
            </span>
          )}
          {tendance && tendance !== "stable" && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              marginLeft: 6,
              color: tendance === "hausse" ? couleurs.succes : couleurs.danger,
            }}>
              {tendance === "hausse" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </span>
          )}
        </div>
        {sparkData && sparkData.length >= 2 && (
          <SparkLine data={sparkData} couleur={sparkCouleur} />
        )}
      </div>
    </div>
  );
}

function BarreProgression({ valeur, max, couleur, label }: {
  valeur: number;
  max: number;
  couleur: string;
  label: string;
}) {
  const pct = max > 0 ? Math.min(100, (valeur / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: couleurs.texte, maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: couleurs.texte }}>
          {valeur}
        </span>
      </div>
      <div style={{ height: 6, background: couleurs.bordure, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: couleur, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ──── Page principale ────

export default function TableauBordPage() {
  const { arretes, actifs, historique, loading } = useArretes();
  const { references } = useReferences();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // ─── Analytics de base ───
  const parMois = useMemo(() => arreteParMois(arretes), [arretes]);
  const parType = useMemo(() => arreteParType(arretes), [arretes]);
  const parStatut = useMemo(() => arreteParStatut(arretes), [arretes]);
  const taux = useMemo(() => tauxAbrogation(actifs, historique), [actifs, historique]);
  const delaiMoyen = useMemo(() => delaiMoyenPublication(arretes), [arretes]);
  const expirations = useMemo(() => referenceExpirations(references), [references]);

  // ─── Nouvelles analytics ───
  const evolution = useMemo(() => evolutionMensuelle(arretes, AUJOURD_HUI), [arretes]);
  const voiesTop = useMemo(() => topVoies(arretes, 8), [arretes]);
  const dureeMoyenne = useMemo(() => dureeMoyenneArretes(arretes), [arretes]);
  const tauxRenouv = useMemo(() => tauxRenouvellement(arretes), [arretes]);
  const parJour = useMemo(() => arreteParJourSemaine(arretes), [arretes]);

  // ─── Dérivés ───
  const moisActuel = `${AUJOURD_HUI.getFullYear()}-${String(AUJOURD_HUI.getMonth() + 1).padStart(2, "0")}`;
  const nouveauxCeMois = useMemo(
    () => arretes.filter((a) => a.date_creation.startsWith(moisActuel)).length,
    [arretes, moisActuel],
  );
  const refsActives = useMemo(() => references.filter((r) => r.actif).length, [references]);

  // Sparkline tendance
  const sparkTendance = useMemo(() => parMois.map((m) => m.count), [parMois]);

  // Evolution AreaChart data
  const evolutionAreaData = useMemo(
    () => evolution.map((e) => ({ label: e.mois, valeur: e.actifsCumules })),
    [evolution],
  );
  const evolutionCrees = useMemo(
    () => evolution.map((e) => ({ label: e.mois, valeur: e.crees })),
    [evolution],
  );

  // Donuts
  const donutTypeData = useMemo(
    () => parType.map((t) => ({ label: t.label, value: t.count, couleur: t.couleur })),
    [parType],
  );
  const donutStatutData = useMemo(
    () => parStatut.map((st) => ({ label: st.label, value: st.count, couleur: st.couleur })),
    [parStatut],
  );

  // Jour de la semaine bar chart data
  const jourBarData = useMemo(
    () => parJour.map((j) => ({ label: j.jour, value: j.count })),
    [parJour],
  );

  // Bar chart arretes par mois
  const barData = useMemo(
    () => parMois.map((m) => ({ label: m.mois, value: m.count })),
    [parMois],
  );

  // Tendance: compare le dernier mois au précédent
  const tendanceActifs = useMemo(() => {
    if (evolution.length < 2) return "stable" as const;
    const dernier = evolution[evolution.length - 1]!;
    const precedent = evolution[evolution.length - 2]!;
    if (dernier.actifsCumules > precedent.actifsCumules) return "hausse" as const;
    if (dernier.actifsCumules < precedent.actifsCumules) return "baisse" as const;
    return "stable" as const;
  }, [evolution]);

  // Refs expirant sous 180 jours
  const refsExpirant = useMemo(() => {
    const j180 = new Date(AUJOURD_HUI);
    j180.setDate(j180.getDate() + 180);
    return references
      .filter((r) => {
        if (!r.actif || !r.date_fin_validite) return false;
        const fin = new Date(r.date_fin_validite);
        return fin <= j180 && fin >= AUJOURD_HUI;
      })
      .sort((a, b) => new Date(a.date_fin_validite).getTime() - new Date(b.date_fin_validite).getTime());
  }, [references]);

  // Max voies (pour les barres de progression)
  const maxVoie = useMemo(
    () => (voiesTop.length > 0 ? voiesTop[0]!.count : 1),
    [voiesTop],
  );

  if (loading) return <LoadingSpinner />;

  const gridCols2 = isMobile ? "1fr" : "repeat(2, 1fr)";

  return (
    <div style={{ ...s.page, padding: isMobile ? "20px 16px" : "32px 24px" }}>
      {/* En-tête */}
      <div style={s.header}>
        <h1 style={s.titre}>Tableau de bord</h1>
        <p style={s.sousTitre}>
          Vue d'ensemble de l'activité réglementaire · Mise à jour en temps réel
        </p>
      </div>

      {/* ─── KPI principaux ─── */}
      <div style={{ ...s.grille4, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}>
        <CarteKpi
          label="Arrêtés actifs"
          valeur={actifs.length}
          icone={<FileText size={16} />}
          sparkData={sparkTendance}
          sparkCouleur={couleurs.accent}
          tendance={tendanceActifs}
        />
        <CarteKpi
          label="Nouveaux ce mois"
          valeur={nouveauxCeMois}
          icone={<CalendarDays size={16} />}
          sparkCouleur={couleurs.succes}
        />
        <CarteKpi
          label="Taux d'abrogation"
          valeur={taux}
          unite="%"
          icone={<AlertTriangle size={16} />}
          sparkCouleur={couleurs.danger}
        />
        <CarteKpi
          label="Références actives"
          valeur={refsActives}
          icone={<Activity size={16} />}
          sparkCouleur={couleurs.info}
        />
      </div>

      {/* ─── KPI secondaires ─── */}
      <div style={{ ...s.grille3, gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)" }}>
        <CarteKpi
          label="Délai moyen de publication"
          valeur={delaiMoyen}
          unite="jours"
          icone={<Clock size={16} />}
          sparkCouleur={couleurs.warning}
        />
        <CarteKpi
          label="Durée moyenne des arrêtés"
          valeur={dureeMoyenne}
          unite="jours"
          icone={<CalendarDays size={16} />}
          sparkCouleur={couleurs.accent}
        />
        <CarteKpi
          label="Taux de renouvellement"
          valeur={tauxRenouv}
          unite="%"
          icone={<RefreshCw size={16} />}
          sparkCouleur={couleurs.info}
        />
      </div>

      {/* ─── Évolution sur 12 mois ─── */}
      <div style={{ ...s.carte, marginBottom: 24 }}>
        <p style={s.sectionTitre}>
          <TrendingUp size={16} style={{ color: couleurs.accent }} />
          Évolution sur 12 mois
        </p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: couleurs.texteMuted, margin: "0 0 8px 0", fontWeight: 500 }}>
              Arrêtés actifs cumulés
            </p>
            {evolutionAreaData.length > 0 ? (
              <AreaChart
                data={evolutionAreaData}
                hauteur={isMobile ? 180 : 220}
                largeur={isMobile ? 380 : 520}
                couleur={couleurs.accent}
              />
            ) : (
              <p style={{ color: couleurs.texteMuted, fontSize: 13 }}>Aucune donnée</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: 12, color: couleurs.texteMuted, margin: "0 0 8px 0", fontWeight: 500 }}>
              Nouveaux arrêtés par mois
            </p>
            {evolutionCrees.length > 0 ? (
              <AreaChart
                data={evolutionCrees}
                hauteur={isMobile ? 180 : 220}
                largeur={isMobile ? 380 : 520}
                couleur={couleurs.succes}
                couleurFill="#10B981"
              />
            ) : (
              <p style={{ color: couleurs.texteMuted, fontSize: 13 }}>Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Résumé mensuel sous les graphiques */}
        <div style={{
          display: "flex",
          gap: 24,
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${couleurs.bordure}`,
          flexWrap: "wrap",
        }}>
          {evolution.slice(-3).map((e) => (
            <div key={e.cle} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: couleurs.texteMuted }}>{e.mois}</span>
              <span style={{
                ...s.badge,
                background: couleurs.succesLight,
                color: couleurs.succes,
              }}>
                +{e.crees}
              </span>
              {e.clotures > 0 && (
                <span style={{
                  ...s.badge,
                  background: couleurs.dangerLight,
                  color: couleurs.danger,
                }}>
                  -{e.clotures}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Répartitions : type + statut ─── */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols2, gap: 16, marginBottom: 24 }}>
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <BarChart3 size={16} style={{ color: couleurs.accent }} />
            Répartition par type
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart data={donutTypeData} />
          </div>
        </div>
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <BarChart3 size={16} style={{ color: couleurs.accent }} />
            Répartition par statut
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart data={donutStatutData} />
          </div>
        </div>
      </div>

      {/* ─── Top voies + Activité par jour ─── */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols2, gap: 16, marginBottom: 24 }}>
        {/* Top voies */}
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <MapPin size={16} style={{ color: couleurs.accent }} />
            Voies les plus réglementées
          </p>
          {voiesTop.length > 0 ? (
            <div>
              {voiesTop.map((v, i) => (
                <BarreProgression
                  key={v.voie}
                  label={`${i + 1}. ${v.voie}`}
                  valeur={v.count}
                  max={maxVoie}
                  couleur={i < 3 ? couleurs.accent : couleurs.texteMuted}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: 0 }}>
              Aucune donnée de voirie
            </p>
          )}
        </div>

        {/* Activité par jour de la semaine */}
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <CalendarDays size={16} style={{ color: couleurs.accent }} />
            Activité par jour de la semaine
          </p>
          {jourBarData.length > 0 ? (
            <BarChart data={jourBarData} hauteur={220} largeur={isMobile ? 340 : 480} />
          ) : (
            <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: 0 }}>
              Aucune donnée
            </p>
          )}
        </div>
      </div>

      {/* ─── Arrêtés par mois (historique complet) ─── */}
      <div style={{ ...s.carte, marginBottom: 24, overflowX: "auto" }}>
        <p style={s.sectionTitre}>
          <BarChart3 size={16} style={{ color: couleurs.accent }} />
          Historique des arrêtés par mois
        </p>
        {barData.length > 0 ? (
          <BarChart data={barData} hauteur={isMobile ? 180 : 240} largeur={isMobile ? 400 : Math.max(600, barData.length * 50)} />
        ) : (
          <p style={{ color: couleurs.texteMuted, fontSize: 13 }}>Aucune donnée</p>
        )}
      </div>

      {/* ─── Références : expirations ─── */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols2, gap: 16, marginBottom: 24 }}>
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <AlertTriangle size={16} style={{ color: couleurs.warning }} />
            Expirations de références à venir
          </p>
          {refsExpirant.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Référence</th>
                    <th style={s.th}>Catégorie</th>
                    <th style={s.th}>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {refsExpirant.slice(0, 8).map((r) => {
                    const fin = new Date(r.date_fin_validite);
                    const joursRestants = Math.ceil(
                      (fin.getTime() - AUJOURD_HUI.getTime()) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <tr key={r.id}>
                        <td style={{ ...s.td, fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.label}
                        </td>
                        <td style={{ ...s.td, fontSize: 12, color: couleurs.texteMuted }}>
                          {r.categorie}
                        </td>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                              fontSize: 12,
                              fontFamily: "'IBM Plex Mono', monospace",
                            }}>
                              {fin.toLocaleDateString("fr-FR")}
                            </span>
                            <span style={{
                              ...s.badge,
                              background: joursRestants <= 30 ? couleurs.dangerLight : joursRestants <= 90 ? couleurs.warningLight : couleurs.accentLight,
                              color: joursRestants <= 30 ? couleurs.danger : joursRestants <= 90 ? couleurs.warning : couleurs.accent,
                            }}>
                              {joursRestants}j
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {refsExpirant.length > 8 && (
                <p style={{ fontSize: 12, color: couleurs.texteMuted, margin: "8px 0 0 12px" }}>
                  … et {refsExpirant.length - 8} autres
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: 0 }}>
              Aucune référence avec expiration prochaine
            </p>
          )}
        </div>

        {/* Expirations par mois */}
        <div style={s.carte}>
          <p style={s.sectionTitre}>
            <CalendarDays size={16} style={{ color: couleurs.warning }} />
            Expirations par mois
          </p>
          {expirations.length > 0 ? (
            <BarChart
              data={expirations.map((e) => ({
                label: e.mois,
                value: e.count,
                couleur: "#D9730D",
              }))}
              hauteur={220}
              largeur={isMobile ? 340 : 480}
            />
          ) : (
            <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: 0 }}>
              Aucune expiration planifiée
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
