/**
 * Sélecteur de récurrence pour les arrêtés permanents.
 *
 * Permet de définir :
 * - Le type : permanent (24/7), hebdomadaire, mensuel, annuel
 * - Les jours de la semaine (pour hebdomadaire)
 * - Les horaires (début/fin)
 * - Les jours du mois (pour mensuel)
 * - La période (pour annuel)
 */
import { RefreshCw, Clock } from "lucide-react";
import type { Recurrence, JourSemaine } from "@/types";

interface Props {
  value: Recurrence | undefined;
  onChange: (r: Recurrence | undefined) => void;
}

const JOURS: { code: JourSemaine; label: string; short: string }[] = [
  { code: "lundi", label: "Lundi", short: "Lu" },
  { code: "mardi", label: "Mardi", short: "Ma" },
  { code: "mercredi", label: "Mercredi", short: "Me" },
  { code: "jeudi", label: "Jeudi", short: "Je" },
  { code: "vendredi", label: "Vendredi", short: "Ve" },
  { code: "samedi", label: "Samedi", short: "Sa" },
  { code: "dimanche", label: "Dimanche", short: "Di" },
];

const MOIS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

function toggleJour(jours: JourSemaine[], jour: JourSemaine): JourSemaine[] {
  return jours.includes(jour) ? jours.filter((j) => j !== jour) : [...jours, jour];
}

export default function RecurrenceSelector({ value, onChange }: Props) {
  const actif = !!value;

  function activer() {
    onChange({ type: "permanent" });
  }

  function desactiver() {
    onChange(undefined);
  }

  function setType(type: Recurrence["type"]) {
    if (type === "hebdomadaire") {
      onChange({ type, jours: [], heure_debut: "08:00", heure_fin: "20:00" });
    } else if (type === "mensuel") {
      onChange({ type, jours_mois: [], heure_debut: "08:00", heure_fin: "20:00" });
    } else if (type === "annuel") {
      onChange({ type, mois_debut: "04", mois_fin: "09" });
    } else {
      onChange({ type: "permanent" });
    }
  }

  return (
    <div style={{
      border: "1px solid #E4E1D6",
      borderRadius: 7,
      padding: 12,
      marginBottom: 14,
      background: actif ? "#FAFAF7" : "#FFFFFF",
    }}>
      {/* Header avec toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: actif ? 10 : 0 }}>
        <p style={{ fontWeight: 600, fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
          <RefreshCw size={12} color="#7C3AED" />
          Récurrence / Arrêté permanent
        </p>
        <button
          onClick={actif ? desactiver : activer}
          style={{
            width: 40, height: 22, borderRadius: 11,
            background: actif ? "#7C3AED" : "#D8D5C8",
            border: "none", cursor: "pointer", position: "relative",
            transition: "background .2s",
          }}
        >
          <span style={{
            position: "absolute", top: 2, width: 18, height: 18,
            borderRadius: "50%", background: "#fff",
            transition: "transform .2s",
            transform: actif ? "translateX(20px)" : "translateX(2px)",
          }} />
        </button>
      </div>

      {actif && value && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Type de récurrence */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, marginBottom: 4, color: "#6B6A60" }}>
              Type de récurrence
            </label>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {([
                { code: "permanent" as const, label: "Permanent (24/7)" },
                { code: "hebdomadaire" as const, label: "Hebdomadaire" },
                { code: "mensuel" as const, label: "Mensuel" },
                { code: "annuel" as const, label: "Annuel (saisonnier)" },
              ]).map((t) => (
                <button
                  key={t.code}
                  onClick={() => setType(t.code)}
                  style={{
                    padding: "4px 10px", borderRadius: 12, fontSize: 11,
                    border: `1px solid ${value.type === t.code ? "#7C3AED" : "#E4E1D6"}`,
                    background: value.type === t.code ? "#EDE9FE" : "#FFFFFF",
                    color: value.type === t.code ? "#7C3AED" : "#6B6A60",
                    cursor: "pointer", fontWeight: value.type === t.code ? 600 : 400,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jours de la semaine (hebdomadaire) */}
          {value.type === "hebdomadaire" && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, marginBottom: 6, color: "#6B6A60" }}>
                Jours concernés
              </label>
              <div style={{ display: "flex", gap: 4 }}>
                {JOURS.map((j) => {
                  const selected = value.jours?.includes(j.code) ?? false;
                  return (
                    <button
                      key={j.code}
                      onClick={() => onChange({ ...value, jours: toggleJour(value.jours ?? [], j.code) })}
                      title={j.label}
                      style={{
                        width: 34, height: 34, borderRadius: "50%",
                        border: `2px solid ${selected ? "#7C3AED" : "#E4E1D6"}`,
                        background: selected ? "#7C3AED" : "#FFFFFF",
                        color: selected ? "#FFFFFF" : "#6B6A60",
                        cursor: "pointer", fontSize: 10, fontWeight: 600,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {j.short}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <button
                  onClick={() => onChange({ ...value, jours: ["lundi", "mardi", "mercredi", "jeudi", "vendredi"] })}
                  style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "1px solid #E4E1D6", background: "transparent", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Semaine (Lu-Ve)
                </button>
                <button
                  onClick={() => onChange({ ...value, jours: ["samedi", "dimanche"] })}
                  style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "1px solid #E4E1D6", background: "transparent", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Week-end
                </button>
                <button
                  onClick={() => onChange({ ...value, jours: ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] })}
                  style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: "1px solid #E4E1D6", background: "transparent", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Tous les jours
                </button>
              </div>
            </div>
          )}

          {/* Jours du mois (mensuel) */}
          {value.type === "mensuel" && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, marginBottom: 6, color: "#6B6A60" }}>
                Jour(s) du mois
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                  const selected = value.jours_mois?.includes(d) ?? false;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        const cur = value.jours_mois ?? [];
                        onChange({ ...value, jours_mois: selected ? cur.filter((x) => x !== d) : [...cur, d] });
                      }}
                      style={{
                        width: 28, height: 28, borderRadius: 4,
                        border: `1px solid ${selected ? "#7C3AED" : "#E4E1D6"}`,
                        background: selected ? "#7C3AED" : "#FFFFFF",
                        color: selected ? "#FFFFFF" : "#6B6A60",
                        cursor: "pointer", fontSize: 10, fontWeight: selected ? 600 : 400,
                        fontFamily: "'IBM Plex Mono', monospace",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Période annuelle (annuel) */}
          {value.type === "annuel" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, marginBottom: 4, color: "#6B6A60" }}>
                  Du mois de
                </label>
                <select
                  value={value.mois_debut ?? "04"}
                  onChange={(e) => onChange({ ...value, mois_debut: e.target.value })}
                  style={{ fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {MOIS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <span style={{ fontSize: 12, color: "#6B6A60", marginTop: 18 }}>au mois de</span>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, marginBottom: 4, color: "#6B6A60" }}>
                  &nbsp;
                </label>
                <select
                  value={value.mois_fin ?? "09"}
                  onChange={(e) => onChange({ ...value, mois_fin: e.target.value })}
                  style={{ fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {MOIS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Horaires (hebdomadaire et mensuel) */}
          {(value.type === "hebdomadaire" || value.type === "mensuel") && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Clock size={12} color="#6B6A60" />
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>De</label>
                <input
                  type="time"
                  value={value.heure_debut ?? "08:00"}
                  onChange={(e) => onChange({ ...value, heure_debut: e.target.value })}
                  style={{ fontSize: 11, padding: "4px 6px", borderRadius: 4, border: "1px solid #E4E1D6", marginLeft: 4, fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "#6B6A60" }}>à</label>
                <input
                  type="time"
                  value={value.heure_fin ?? "20:00"}
                  onChange={(e) => onChange({ ...value, heure_fin: e.target.value })}
                  style={{ fontSize: 11, padding: "4px 6px", borderRadius: 4, border: "1px solid #E4E1D6", marginLeft: 4, fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
            </div>
          )}

          {/* Résumé */}
          <div style={{
            background: "#EDE9FE", borderRadius: 5, padding: "6px 10px",
            fontSize: 11, color: "#5B21B6",
          }}>
            <strong>Résumé :</strong>{" "}
            {value.type === "permanent" && "Applicable en permanence, sans limite de durée."}
            {value.type === "hebdomadaire" && (
              <>
                {(value.jours?.length ?? 0) === 0
                  ? "Sélectionnez les jours concernés."
                  : `Chaque ${value.jours!.join(", ")}`}
                {value.heure_debut && value.heure_fin && ` de ${value.heure_debut} à ${value.heure_fin}`}
                .
              </>
            )}
            {value.type === "mensuel" && (
              <>
                {(value.jours_mois?.length ?? 0) === 0
                  ? "Sélectionnez les jours du mois."
                  : `Le ${value.jours_mois!.join(", ")} de chaque mois`}
                {value.heure_debut && value.heure_fin && ` de ${value.heure_debut} à ${value.heure_fin}`}
                .
              </>
            )}
            {value.type === "annuel" && (
              <>
                Du mois de {MOIS.find((m) => m.value === value.mois_debut)?.label ?? "?"}{" "}
                au mois de {MOIS.find((m) => m.value === value.mois_fin)?.label ?? "?"}, chaque année.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
