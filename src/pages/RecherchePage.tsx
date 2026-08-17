import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  FileText,
  BookOpen,
  MapPin,
  Filter,
  X,
  Calendar,
  User,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import {
  rechercherGlobal,
  calculerFacettes,
  surbriller,
} from "@/lib/recherche";
import type {
  ResultatRecherche,
  FiltresRecherche,
  FragmentTexte,
} from "@/lib/recherche";
import type { CodeTypeArrete, StatutArrete } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// ──── Couleurs ────

const couleurs = {
  fond: "#F8F7F4",
  carte: "#FFFFFF",
  bordure: "#E4E1D6",
  texte: "#1C1F1B",
  texteMuted: "#6B6A60",
  accent: "#1E3A5F",
  accentLight: "#EBF0F7",
  succes: "#065F46",
  succesLight: "#ECFDF5",
  warning: "#92400E",
  warningLight: "#FEF3C7",
  danger: "#B91C1C",
  surbrillance: "#FEF3C7",
  surbrillanceTexte: "#92400E",
};

const COULEURS_STATUT: Record<string, string> = {
  brouillon: "#6B6A60",
  en_relecture: "#D9730D",
  valide: "#0E7490",
  publie: "#065F46",
  modifie: "#1E3A5F",
  abroge: "#B91C1C",
};

type Tri = "pertinence" | "date_desc" | "date_asc" | "titre";

const OPTIONS_TRI: { code: Tri; label: string }[] = [
  { code: "pertinence", label: "Pertinence" },
  { code: "date_desc", label: "Plus récent" },
  { code: "date_asc", label: "Plus ancien" },
  { code: "titre", label: "Titre A→Z" },
];

// ──── Page ────

export default function RecherchePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { arretes, loading } = useArretes();
  const { references } = useReferences();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // État de recherche
  const [saisie, setSaisie] = useState(searchParams.get("q") ?? "");
  const [scope, setScope] = useState<FiltresRecherche["scope"]>("tous");
  const [typesSelectionnes, setTypesSelectionnes] = useState<CodeTypeArrete[]>([]);
  const [statutsSelectionnes, setStatutsSelectionnes] = useState<StatutArrete[]>([]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [voie, setVoie] = useState("");
  const [auteur, setAuteur] = useState("");
  const [tri, setTri] = useState<Tri>("pertinence");
  const [showFiltres, setShowFiltres] = useState(false);

  const saisieDebounced = useDebounce(saisie, 200);

  // Sync avec l'URL
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== saisie) setSaisie(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saisieDebounced) {
      setSearchParams({ q: saisieDebounced }, { replace: true });
    }
  }, [saisieDebounced, setSearchParams]);

  // Facettes
  const facettes = useMemo(() => calculerFacettes(arretes), [arretes]);

  // Recherche
  const filtres: FiltresRecherche = useMemo(
    () => ({
      scope,
      types: typesSelectionnes.length > 0 ? typesSelectionnes : undefined,
      statuts: statutsSelectionnes.length > 0 ? statutsSelectionnes : undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      voie: voie || undefined,
      auteur: auteur || undefined,
    }),
    [scope, typesSelectionnes, statutsSelectionnes, dateDebut, dateFin, voie, auteur],
  );

  const resultats = useMemo(
    () => rechercherGlobal(arretes, references, saisieDebounced, filtres, 100),
    [arretes, references, saisieDebounced, filtres],
  );

  // Tri
  const resultatsTriés = useMemo(() => {
    if (tri === "pertinence") return resultats;

    const copie = [...resultats];
    switch (tri) {
      case "date_desc":
        return copie.sort((a, b) => {
          const da = a.arrete?.date_creation ?? a.reference?.date ?? "";
          const db = b.arrete?.date_creation ?? b.reference?.date ?? "";
          return db.localeCompare(da);
        });
      case "date_asc":
        return copie.sort((a, b) => {
          const da = a.arrete?.date_creation ?? a.reference?.date ?? "";
          const db = b.arrete?.date_creation ?? b.reference?.date ?? "";
          return da.localeCompare(db);
        });
      case "titre":
        return copie.sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
    }
  }, [resultats, tri]);

  const nbFiltresActifs =
    typesSelectionnes.length +
    statutsSelectionnes.length +
    (dateDebut ? 1 : 0) +
    (dateFin ? 1 : 0) +
    (voie ? 1 : 0) +
    (auteur ? 1 : 0);

  function reinitialiserFiltres() {
    setTypesSelectionnes([]);
    setStatutsSelectionnes([]);
    setDateDebut("");
    setDateFin("");
    setVoie("");
    setAuteur("");
  }

  function toggleType(code: CodeTypeArrete) {
    setTypesSelectionnes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function toggleStatut(code: StatutArrete) {
    setStatutsSelectionnes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: couleurs.texte, margin: "0 0 4px 0" }}>
          Recherche avancée
        </h1>
        <p style={{ fontSize: 13, color: couleurs.texteMuted, margin: 0 }}>
          Recherche full-text dans les arrêtés et références réglementaires
        </p>
      </div>

      {/* Barre de recherche */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        alignItems: "stretch",
      }}>
        <div style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
        }}>
          <Search size={16} style={{ position: "absolute", left: 14, color: couleurs.texteMuted }} />
          <input
            type="search"
            placeholder="Rechercher par titre, numéro, voie, auteur, commune, référence…"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            style={{
              paddingLeft: 40,
              fontSize: 15,
              height: 44,
              width: "100%",
              borderRadius: 8,
              border: `1px solid ${couleurs.bordure}`,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
            aria-label="Recherche avancée"
            autoFocus
          />
          {saisie && (
            <button
              onClick={() => setSaisie("")}
              style={{
                position: "absolute",
                right: 12,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: couleurs.texteMuted,
                padding: 4,
                display: "flex",
              }}
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="btn-secondary"
          onClick={() => setShowFiltres((s) => !s)}
          style={{
            fontSize: 12,
            flexShrink: 0,
            height: 44,
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          aria-expanded={showFiltres}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {nbFiltresActifs > 0 && (
            <span style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: couleurs.accent,
              color: "#fff",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}>
              {nbFiltresActifs}
            </span>
          )}
        </button>
      </div>

      {/* Onglets de scope */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: `1px solid ${couleurs.bordure}`,
        marginBottom: 16,
      }}>
        {(["tous", "arretes", "references"] as const).map((s) => {
          const labels: Record<string, string> = {
            tous: "Tous",
            arretes: "Arrêtés",
            references: "Références",
          };
          const counts: Record<string, number> = {
            tous: resultatsTriés.length,
            arretes: resultatsTriés.filter((r) => r.type === "arrete").length,
            references: resultatsTriés.filter((r) => r.type === "reference").length,
          };
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                background: "none",
                border: "none",
                borderBottom: scope === s ? `2px solid ${couleurs.accent}` : "2px solid transparent",
                color: scope === s ? couleurs.accent : couleurs.texteMuted,
                fontWeight: scope === s ? 600 : 400,
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {labels[s]}
              {saisie && (
                <span style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 8,
                  background: scope === s ? couleurs.accent : couleurs.bordure,
                  color: scope === s ? "#fff" : couleurs.texteMuted,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  {counts[s]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panneau de filtres */}
      {showFiltres && (
        <div style={{
          padding: 20,
          marginBottom: 16,
          background: couleurs.carte,
          border: `1px solid ${couleurs.bordure}`,
          borderRadius: 10,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: couleurs.texte, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} /> Filtres avancés
            </h3>
            {nbFiltresActifs > 0 && (
              <button
                onClick={reinitialiserFiltres}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: couleurs.accent,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Réinitialiser ({nbFiltresActifs})
              </button>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
          }}>
            {/* Types */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.texteMuted, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Type d'arrêté
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {facettes.types.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => toggleType(t.code)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      border: `1px solid ${typesSelectionnes.includes(t.code) ? couleurs.accent : couleurs.bordure}`,
                      background: typesSelectionnes.includes(t.code) ? couleurs.accentLight : "transparent",
                      color: typesSelectionnes.includes(t.code) ? couleurs.accent : couleurs.texte,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {t.label}
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: couleurs.texteMuted,
                    }}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Statuts */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.texteMuted, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Statut
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {facettes.statuts.map((st) => (
                  <button
                    key={st.code}
                    onClick={() => toggleStatut(st.code)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 16,
                      fontSize: 11,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      border: `1px solid ${statutsSelectionnes.includes(st.code) ? COULEURS_STATUT[st.code] ?? couleurs.accent : couleurs.bordure}`,
                      background: statutsSelectionnes.includes(st.code) ? `${COULEURS_STATUT[st.code]}10` : "transparent",
                      color: statutsSelectionnes.includes(st.code) ? COULEURS_STATUT[st.code] : couleurs.texte,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {st.label}
                    <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: couleurs.texteMuted }}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.texteMuted, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Calendar size={11} style={{ marginRight: 4 }} />
                Période
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: `1px solid ${couleurs.bordure}` }}
                  aria-label="Date début"
                />
                <span style={{ color: couleurs.texteMuted, fontSize: 12 }}>→</span>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: `1px solid ${couleurs.bordure}` }}
                  aria-label="Date fin"
                />
              </div>
            </div>

            {/* Voie + Auteur */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.texteMuted, margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <MapPin size={11} style={{ marginRight: 4 }} />
                  Voie
                </p>
                <select
                  value={voie}
                  onChange={(e) => setVoie(e.target.value)}
                  style={{ fontSize: 12, width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${couleurs.bordure}` }}
                >
                  <option value="">Toutes les voies</option>
                  {facettes.voies.map((v) => (
                    <option key={v.nom} value={v.nom}>
                      {v.nom} ({v.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: couleurs.texteMuted, margin: "0 0 6px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <User size={11} style={{ marginRight: 4 }} />
                  Auteur
                </p>
                <select
                  value={auteur}
                  onChange={(e) => setAuteur(e.target.value)}
                  style={{ fontSize: 12, width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${couleurs.bordure}` }}
                >
                  <option value="">Tous les auteurs</option>
                  {facettes.auteurs.map((a) => (
                    <option key={a.nom} value={a.nom}>
                      {a.nom} ({a.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de résumé */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        <p style={{ fontSize: 13, color: couleurs.texteMuted, margin: 0 }}>
          {saisie || nbFiltresActifs > 0
            ? `${resultatsTriés.length} résultat${resultatsTriés.length !== 1 ? "s" : ""}${saisie ? ` pour « ${saisie} »` : ""}`
            : "Saisissez un terme de recherche ou appliquez des filtres"
          }
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowUpDown size={12} style={{ color: couleurs.texteMuted }} />
          <select
            value={tri}
            onChange={(e) => setTri(e.target.value as Tri)}
            style={{
              fontSize: 12,
              border: `1px solid ${couleurs.bordure}`,
              borderRadius: 6,
              padding: "4px 8px",
              color: couleurs.texte,
              background: couleurs.carte,
            }}
          >
            {OPTIONS_TRI.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags filtres actifs */}
      {nbFiltresActifs > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {typesSelectionnes.map((code) => {
            const f = facettes.types.find((t) => t.code === code);
            return (
              <span
                key={`tag-type-${code}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 16,
                  fontSize: 11,
                  background: couleurs.accentLight,
                  color: couleurs.accent,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Type : {f?.label ?? code}
                <button
                  onClick={() => toggleType(code)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: couleurs.accent, padding: 0, display: "flex" }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          {statutsSelectionnes.map((code) => {
            const f = facettes.statuts.find((s) => s.code === code);
            return (
              <span
                key={`tag-statut-${code}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 10px",
                  borderRadius: 16,
                  fontSize: 11,
                  background: `${COULEURS_STATUT[code]}10`,
                  color: COULEURS_STATUT[code],
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                Statut : {f?.label ?? code}
                <button
                  onClick={() => toggleStatut(code)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: COULEURS_STATUT[code], padding: 0, display: "flex" }}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
          {voie && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 16, fontSize: 11,
              background: couleurs.accentLight, color: couleurs.accent,
            }}>
              Voie : {voie}
              <button onClick={() => setVoie("")} style={{ background: "none", border: "none", cursor: "pointer", color: couleurs.accent, padding: 0, display: "flex" }}><X size={12} /></button>
            </span>
          )}
          {auteur && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 16, fontSize: 11,
              background: couleurs.accentLight, color: couleurs.accent,
            }}>
              Auteur : {auteur}
              <button onClick={() => setAuteur("")} style={{ background: "none", border: "none", cursor: "pointer", color: couleurs.accent, padding: 0, display: "flex" }}><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      {/* Liste de résultats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {resultatsTriés.map((r) => (
          <CarteResultat key={`${r.type}-${r.id}`} resultat={r} navigate={navigate} />
        ))}

        {(saisie || nbFiltresActifs > 0) && resultatsTriés.length === 0 && (
          <div style={{
            padding: "48px 24px",
            textAlign: "center",
            background: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: 10,
          }}>
            <Search size={32} style={{ color: couleurs.bordure, marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: couleurs.texte, margin: "0 0 6px 0" }}>
              Aucun résultat
            </p>
            <p style={{ fontSize: 13, color: couleurs.texteMuted, margin: 0 }}>
              Essayez un terme différent ou modifiez les filtres
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──── Carte résultat ────

function CarteResultat({
  resultat,
  navigate,
}: {
  resultat: ResultatRecherche;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const estArrete = resultat.type === "arrete";
  const Icone = estArrete ? FileText : BookOpen;

  return (
    <button
      onClick={() => {
        if (estArrete) {
          navigate(`/nouveau/${resultat.id}`);
        } else {
          navigate("/references");
        }
      }}
      style={{
        display: "flex",
        gap: 16,
        padding: 16,
        background: couleurs.carte,
        border: `1px solid ${couleurs.bordure}`,
        borderRadius: 10,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'IBM Plex Sans', sans-serif",
        width: "100%",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = couleurs.accent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = couleurs.bordure;
      }}
    >
      {/* Icône */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: estArrete ? couleurs.accentLight : couleurs.succesLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icone size={18} style={{ color: estArrete ? couleurs.accent : couleurs.succes }} />
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: couleurs.texte,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {resultat.titre}
          </p>

          {/* Badge type */}
          <span style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 4,
            background: estArrete ? couleurs.accentLight : couleurs.succesLight,
            color: estArrete ? couleurs.accent : couleurs.succes,
            flexShrink: 0,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}>
            {estArrete ? "Arrêté" : "Référence"}
          </span>
        </div>

        {/* Sous-titre */}
        <p style={{
          margin: "3px 0 0",
          fontSize: 12,
          color: couleurs.texteMuted,
          fontFamily: "'IBM Plex Mono', monospace",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}>
          {resultat.sousTitre}
          {resultat.arrete && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              background: `${COULEURS_STATUT[resultat.arrete.statut] ?? couleurs.texteMuted}15`,
              color: COULEURS_STATUT[resultat.arrete.statut] ?? couleurs.texteMuted,
            }}>
              {resultat.arrete.statut.replace("_", " ")}
            </span>
          )}
        </p>

        {/* Métadonnées pour arrêtés */}
        {resultat.arrete && (
          <div style={{
            display: "flex",
            gap: 16,
            marginTop: 6,
            fontSize: 11,
            color: couleurs.texteMuted,
            flexWrap: "wrap",
          }}>
            {resultat.arrete.voies.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={10} />
                {resultat.arrete.voies.slice(0, 2).join(", ")}
                {resultat.arrete.voies.length > 2 && ` +${resultat.arrete.voies.length - 2}`}
              </span>
            )}
            <span>{resultat.arrete.date_debut} → {resultat.arrete.date_fin || "∞"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <User size={10} />
              {resultat.arrete.cree_par}
            </span>
          </div>
        )}

        {/* Extraits avec surbrillance */}
        {resultat.extraits.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {resultat.extraits.slice(0, 2).map((ext, i) => (
              <p
                key={`ext-${i}`}
                style={{
                  margin: "2px 0",
                  fontSize: 12,
                  color: couleurs.texteMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 10, color: couleurs.accent, fontWeight: 500, marginRight: 6 }}>
                  {ext.champ}
                </span>
                <TexteSurbrille texte={ext.texte} positions={ext.positions} />
              </p>
            ))}
          </div>
        )}

        {/* Score de pertinence (discret) */}
        <div style={{
          marginTop: 6,
          fontSize: 10,
          color: couleurs.bordure,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          score: {resultat.score.toFixed(1)}
        </div>
      </div>
    </button>
  );
}

// ──── Texte avec surbrillance ────

function TexteSurbrille({ texte, positions }: { texte: string; positions: [number, number][] }) {
  const fragments: FragmentTexte[] = surbriller(texte, positions);

  return (
    <>
      {fragments.map((f, i) =>
        f.surbrillance ? (
          <mark
            key={i}
            style={{
              background: couleurs.surbrillance,
              color: couleurs.surbrillanceTexte,
              borderRadius: 2,
              padding: "0 2px",
            }}
          >
            {f.texte}
          </mark>
        ) : (
          <span key={i}>{f.texte}</span>
        ),
      )}
    </>
  );
}
