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
} from "@/lib/analytics";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import SparkLine from "@/components/charts/SparkLine";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "32px 24px",
    fontFamily: "'IBM Plex Sans', sans-serif",
  } as const,
  titre: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: "#1C1F1B",
    margin: "0 0 4px 0",
  },
  sousTitre: {
    fontSize: 13,
    color: "#6B6A60",
    margin: "0 0 28px 0",
  },
  grille: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as const,
  carte: {
    background: "#FFFFFF",
    border: "1px solid #E4E1D6",
    borderRadius: 8,
    padding: "20px 24px",
  } as const,
  kpiLabel: {
    fontSize: 12,
    color: "#6B6A60",
    margin: "0 0 4px 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  kpiValeur: {
    fontSize: 28,
    fontWeight: 700 as const,
    color: "#1C1F1B",
    margin: 0,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  deuxColonnes: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
    marginBottom: 24,
  } as const,
  sectionTitre: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: "#1C1F1B",
    margin: "0 0 16px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "8px 12px",
    borderBottom: "2px solid #E4E1D6",
    color: "#6B6A60",
    fontWeight: 500 as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #E4E1D6",
    color: "#1C1F1B",
  },
};

function CarteKpi({
  label,
  valeur,
  unite,
  sparkData,
  sparkCouleur,
}: {
  label: string;
  valeur: number | string;
  unite?: string;
  sparkData?: number[];
  sparkCouleur?: string;
}) {
  return (
    <div style={styles.carte}>
      <p style={styles.kpiLabel}>{label}</p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <p style={styles.kpiValeur}>
          {valeur}
          {unite && (
            <span style={{ fontSize: 14, fontWeight: 400, color: "#6B6A60", marginLeft: 2 }}>
              {unite}
            </span>
          )}
        </p>
        {sparkData && sparkData.length >= 2 && (
          <SparkLine data={sparkData} couleur={sparkCouleur} />
        )}
      </div>
    </div>
  );
}

export default function TableauBordPage() {
  const { arretes, actifs, historique } = useArretes();
  const { references } = useReferences();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const parMois = useMemo(() => arreteParMois(arretes), [arretes]);
  const parType = useMemo(() => arreteParType(arretes), [arretes]);
  const parStatut = useMemo(() => arreteParStatut(arretes), [arretes]);
  const taux = useMemo(
    () => tauxAbrogation(actifs, historique),
    [actifs, historique],
  );
  const delaiMoyen = useMemo(
    () => delaiMoyenPublication(arretes),
    [arretes],
  );
  const expirations = useMemo(
    () => referenceExpirations(references),
    [references],
  );

  const moisActuel = `${AUJOURD_HUI.getFullYear()}-${String(AUJOURD_HUI.getMonth() + 1).padStart(2, "0")}`;
  const nouveauxCeMois = useMemo(
    () =>
      arretes.filter((a) => a.date_creation.startsWith(moisActuel)).length,
    [arretes, moisActuel],
  );

  const refsActives = useMemo(
    () => references.filter((r) => r.actif).length,
    [references],
  );

  // Tendance: counts par mois pour sparkline
  const sparkTendance = useMemo(
    () => parMois.map((m) => m.count),
    [parMois],
  );

  // Donnees pour le bar chart
  const barData = useMemo(
    () =>
      parMois.map((m) => ({
        label: m.mois,
        value: m.count,
      })),
    [parMois],
  );

  // Donnees pour le donut type
  const donutTypeData = useMemo(
    () =>
      parType.map((t) => ({
        label: t.label,
        value: t.count,
        couleur: t.couleur,
      })),
    [parType],
  );

  // Donnees pour le donut statut
  const donutStatutData = useMemo(
    () =>
      parStatut.map((s) => ({
        label: s.label,
        value: s.count,
        couleur: s.couleur,
      })),
    [parStatut],
  );

  // References avec expiration prochaine pour le tableau
  const refsExpirant = useMemo(() => {
    const j180 = new Date(AUJOURD_HUI);
    j180.setDate(j180.getDate() + 180);

    return references
      .filter((r) => {
        if (!r.actif || !r.date_fin_validite) return false;
        const fin = new Date(r.date_fin_validite);
        return fin <= j180 && fin >= AUJOURD_HUI;
      })
      .sort(
        (a, b) =>
          new Date(a.date_fin_validite).getTime() -
          new Date(b.date_fin_validite).getTime(),
      );
  }, [references]);

  return (
    <div style={{ ...styles.page, padding: isMobile ? "20px 16px" : "32px 24px" }}>
      <h1 style={styles.titre}>Tableau de bord</h1>
      <p style={styles.sousTitre}>
        Vue d'ensemble de l'activite reglementaire
      </p>

      {/* KPI */}
      <div style={{ ...styles.grille, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <CarteKpi
          label="Arretes actifs"
          valeur={actifs.length}
          sparkData={sparkTendance}
          sparkCouleur="#1E3A5F"
        />
        <CarteKpi
          label="Nouveaux ce mois"
          valeur={nouveauxCeMois}
          sparkCouleur="#065F46"
        />
        <CarteKpi
          label="Taux d'abrogation"
          valeur={taux}
          unite="%"
          sparkCouleur="#B91C1C"
        />
        <CarteKpi
          label="References actives"
          valeur={refsActives}
          sparkCouleur="#0E7490"
        />
      </div>

      {/* Bar chart arretes par mois */}
      <div style={{ ...styles.carte, marginBottom: 24, overflowX: "auto" }}>
        <p style={styles.sectionTitre}>Arretes par mois</p>
        {barData.length > 0 ? (
          <BarChart data={barData} hauteur={isMobile ? 180 : 240} largeur={isMobile ? 400 : 600} />
        ) : (
          <p style={{ color: "#6B6A60", fontSize: 13 }}>Aucune donnee</p>
        )}
      </div>

      {/* Donuts: type + statut */}
      <div style={{ ...styles.deuxColonnes, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <div style={styles.carte}>
          <p style={styles.sectionTitre}>Repartition par type</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart data={donutTypeData} />
          </div>
        </div>
        <div style={styles.carte}>
          <p style={styles.sectionTitre}>Repartition par statut</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart data={donutStatutData} />
          </div>
        </div>
      </div>

      {/* Delai moyen */}
      <div style={{ ...styles.grille, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <CarteKpi
          label="Delai moyen de publication"
          valeur={delaiMoyen}
          unite="jours"
          sparkCouleur="#D9730D"
        />
      </div>

      {/* Expirations prochaines */}
      <div style={{ ...styles.carte, marginBottom: 24 }}>
        <p style={styles.sectionTitre}>Expirations de references a venir</p>
        {refsExpirant.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Reference</th>
                  <th style={styles.th}>Categorie</th>
                  <th style={styles.th}>Numero</th>
                  <th style={styles.th}>Expiration</th>
                </tr>
              </thead>
              <tbody>
                {refsExpirant.map((r) => (
                  <tr key={r.id}>
                    <td style={styles.td}>{r.label}</td>
                    <td style={styles.td}>{r.categorie}</td>
                    <td
                      style={{
                        ...styles.td,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                      }}
                    >
                      {r.numero}
                    </td>
                    <td style={styles.td}>
                      {new Date(r.date_fin_validite).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>
            Aucune reference avec expiration prochaine
          </p>
        )}
      </div>

      {/* Expirations par mois bar chart if any */}
      {expirations.length > 0 && (
        <div style={{ ...styles.carte, marginBottom: 24 }}>
          <p style={styles.sectionTitre}>Expirations par mois</p>
          <BarChart
            data={expirations.map((e) => ({
              label: e.mois,
              value: e.count,
              couleur: "#D9730D",
            }))}
            hauteur={180}
            largeur={400}
          />
        </div>
      )}
    </div>
  );
}
