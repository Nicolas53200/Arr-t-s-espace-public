import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  FileText,
  BookOpen,
  MapPin,
  User,
  Hash,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Command,
} from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { rechercherGlobal, genererSuggestions, surbriller } from "@/lib/recherche";
import type { ResultatRecherche, SuggestionRecherche, FragmentTexte } from "@/lib/recherche";
import { useDebounce } from "@/hooks/useDebounce";

// ──── Styles ────

const couleurs = {
  fond: "#FFFFFF",
  fondOverlay: "rgba(28, 31, 27, 0.5)",
  fondSelection: "#EBF0F7",
  bordure: "#E4E1D6",
  texte: "#1C1F1B",
  texteMuted: "#6B6A60",
  accent: "#1E3A5F",
  surbrillance: "#FEF3C7",
  surbrillanceTexte: "#92400E",
};

const ICONE_CATEGORIE: Record<SuggestionRecherche["categorie"], typeof FileText> = {
  numero: Hash,
  voie: MapPin,
  type: FileText,
  auteur: User,
  titre: FileText,
  reference: BookOpen,
};

const LABEL_CATEGORIE: Record<SuggestionRecherche["categorie"], string> = {
  numero: "Numéro",
  voie: "Voie",
  type: "Type",
  auteur: "Auteur",
  titre: "Titre",
  reference: "Référence",
};

// ──── Composant ────

export default function RechercheGlobale({
  ouvert,
  onFermer,
}: {
  ouvert: boolean;
  onFermer: () => void;
}) {
  const navigate = useNavigate();
  const { arretes } = useArretes();
  const { references } = useReferences();
  const inputRef = useRef<HTMLInputElement>(null);

  const [saisie, setSaisie] = useState("");
  const [indexSelection, setIndexSelection] = useState(0);
  const saisieDebounced = useDebounce(saisie, 150);

  // Résultats
  const resultats = useMemo(
    () => rechercherGlobal(arretes, references, saisieDebounced, {}, 12),
    [arretes, references, saisieDebounced],
  );

  // Suggestions (quand il y a une saisie mais peu de résultats)
  const suggestions = useMemo(
    () => saisieDebounced.length >= 2 && resultats.length < 3
      ? genererSuggestions(arretes, references, saisieDebounced, 5)
      : [],
    [arretes, references, saisieDebounced, resultats.length],
  );

  const totalItems = resultats.length + suggestions.length;

  // Focus l'input à l'ouverture
  useEffect(() => {
    if (ouvert) {
      setSaisie("");
      setIndexSelection(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [ouvert]);

  // Bloquer le scroll du body
  useEffect(() => {
    if (ouvert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [ouvert]);

  const naviguerVers = useCallback(
    (resultat: ResultatRecherche) => {
      onFermer();
      if (resultat.type === "arrete") {
        navigate(`/nouveau/${resultat.id}`);
      } else {
        navigate("/references");
      }
    },
    [navigate, onFermer],
  );

  const selectionnerSuggestion = useCallback(
    (suggestion: SuggestionRecherche) => {
      setSaisie(suggestion.texte);
      setIndexSelection(0);
    },
    [],
  );

  const gererClavier = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFermer();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndexSelection((i) => Math.min(i + 1, totalItems - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndexSelection((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (indexSelection < resultats.length) {
          const r = resultats[indexSelection];
          if (r) naviguerVers(r);
        } else {
          const s = suggestions[indexSelection - resultats.length];
          if (s) selectionnerSuggestion(s);
        }
        return;
      }
    },
    [totalItems, resultats, suggestions, indexSelection, naviguerVers, onFermer, selectionnerSuggestion],
  );

  if (!ouvert) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: couleurs.fondOverlay,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 80,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: couleurs.fond,
          borderRadius: 12,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          overflow: "hidden",
          maxHeight: "calc(100vh - 160px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Barre de recherche */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${couleurs.bordure}`,
          }}
        >
          <Search size={18} style={{ color: couleurs.texteMuted, flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher un arrêté, une voie, une référence…"
            value={saisie}
            onChange={(e) => {
              setSaisie(e.target.value);
              setIndexSelection(0);
            }}
            onKeyDown={gererClavier}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              fontFamily: "'IBM Plex Sans', sans-serif",
              color: couleurs.texte,
              background: "transparent",
              padding: 0,
            }}
            aria-label="Recherche globale"
            autoComplete="off"
          />
          {saisie && (
            <button
              onClick={() => {
                setSaisie("");
                inputRef.current?.focus();
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: couleurs.texteMuted,
                padding: 4,
                display: "flex",
                flexShrink: 0,
              }}
              aria-label="Effacer"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onFermer}
            style={{
              background: couleurs.bordure,
              border: "none",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
              color: couleurs.texteMuted,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Esc
          </button>
        </div>

        {/* Résultats */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
          }}
          role="listbox"
        >
          {/* Aucune saisie */}
          {!saisie && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: "0 0 12px 0" }}>
                Recherchez par titre, numéro, voie, auteur, type…
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 11, color: couleurs.texteMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ArrowUp size={12} /><ArrowDown size={12} /> naviguer
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <CornerDownLeft size={12} /> ouvrir
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  esc fermer
                </span>
              </div>
            </div>
          )}

          {/* Résultats de recherche */}
          {saisie && resultats.length > 0 && (
            <div style={{ padding: "8px 0" }}>
              <p style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: couleurs.texteMuted,
                fontWeight: 600,
                padding: "4px 20px 6px",
                margin: 0,
              }}>
                Résultats ({resultats.length})
              </p>
              {resultats.map((r, i) => (
                <LigneResultat
                  key={r.id}
                  resultat={r}
                  actif={i === indexSelection}
                  onClick={() => naviguerVers(r)}
                  onMouseEnter={() => setIndexSelection(i)}
                />
              ))}
            </div>
          )}

          {/* Suggestions */}
          {saisie && suggestions.length > 0 && (
            <div style={{ padding: "8px 0", borderTop: resultats.length > 0 ? `1px solid ${couleurs.bordure}` : "none" }}>
              <p style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: couleurs.texteMuted,
                fontWeight: 600,
                padding: "4px 20px 6px",
                margin: 0,
              }}>
                Suggestions
              </p>
              {suggestions.map((sg, i) => {
                const idx = resultats.length + i;
                const Icone = ICONE_CATEGORIE[sg.categorie];
                return (
                  <button
                    key={`sg-${sg.texte}-${sg.categorie}`}
                    onClick={() => selectionnerSuggestion(sg)}
                    onMouseEnter={() => setIndexSelection(idx)}
                    role="option"
                    aria-selected={idx === indexSelection}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "8px 20px",
                      background: idx === indexSelection ? couleurs.fondSelection : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 13,
                      color: couleurs.texte,
                    }}
                  >
                    <Icone size={14} style={{ color: couleurs.texteMuted, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{sg.texte}</span>
                    <span style={{
                      fontSize: 10,
                      color: couleurs.texteMuted,
                      background: "#F4F2EC",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}>
                      {LABEL_CATEGORIE[sg.categorie]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Aucun résultat */}
          {saisie && resultats.length === 0 && suggestions.length === 0 && saisieDebounced === saisie && (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ color: couleurs.texteMuted, fontSize: 13, margin: "0 0 4px 0" }}>
                Aucun résultat pour « {saisie} »
              </p>
              <p style={{ color: couleurs.texteMuted, fontSize: 12, margin: 0 }}>
                Essayez un autre terme ou vérifiez l'orthographe
              </p>
            </div>
          )}
        </div>

        {/* Footer — accès recherche avancée */}
        {saisie && (
          <div
            style={{
              padding: "10px 20px",
              borderTop: `1px solid ${couleurs.bordure}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                onFermer();
                navigate(`/recherche?q=${encodeURIComponent(saisie)}`);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: couleurs.accent,
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
              }}
            >
              <Search size={12} />
              Recherche avancée pour « {saisie} »
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: couleurs.texteMuted }}>
              <Command size={11} />K
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──── Ligne de résultat ────

function LigneResultat({
  resultat,
  actif,
  onClick,
  onMouseEnter,
}: {
  resultat: ResultatRecherche;
  actif: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const Icone = resultat.type === "arrete" ? FileText : BookOpen;
  const premierExtrait = resultat.extraits[0];

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={actif}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        padding: "10px 20px",
        background: actif ? couleurs.fondSelection : "transparent",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: resultat.type === "arrete" ? "#EBF0F7" : "#ECFDF5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 2,
      }}>
        <Icone size={15} style={{ color: resultat.type === "arrete" ? couleurs.accent : "#065F46" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: couleurs.texte,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {resultat.titre}
        </p>
        <p style={{
          margin: "2px 0 0",
          fontSize: 11,
          color: couleurs.texteMuted,
          fontFamily: "'IBM Plex Mono', monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {resultat.sousTitre}
        </p>

        {/* Extrait avec surbrillance */}
        {premierExtrait && premierExtrait.positions.length > 0 && (
          <p style={{
            margin: "4px 0 0",
            fontSize: 12,
            color: couleurs.texteMuted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            <TexteSurbrille texte={premierExtrait.texte} positions={premierExtrait.positions} />
          </p>
        )}
      </div>

      <div style={{
        fontSize: 10,
        color: couleurs.texteMuted,
        background: "#F4F2EC",
        padding: "2px 8px",
        borderRadius: 4,
        flexShrink: 0,
        marginTop: 4,
        textTransform: "capitalize",
      }}>
        {resultat.type === "arrete" ? "Arrêté" : "Réf."}
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
              padding: "0 1px",
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
