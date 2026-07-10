import { useState } from "react";
import { CheckCircle2, Send, XCircle, FileCheck } from "lucide-react";
import type { Arrete, StatutArrete } from "@/types";
import {
  prochainStatut,
  labelStatut,
  couleurStatut,
  labelTransition,
  peutEffectuerTransition,
  ETAPES_WORKFLOW,
} from "@/lib/workflow";
import { useAuth } from "@/contexts/AuthContext";
import { useArretes } from "@/contexts/ArretesContext";

interface WorkflowPanelProps {
  arrete: Arrete;
}

function iconeTransition(to: StatutArrete) {
  switch (to) {
    case "en_relecture": return <Send size={12} />;
    case "valide": return <FileCheck size={12} />;
    case "publie": return <CheckCircle2 size={12} />;
    case "brouillon": return <XCircle size={12} />;
    default: return null;
  }
}

export default function WorkflowPanel({ arrete }: WorkflowPanelProps) {
  const { user } = useAuth();
  const { dispatch } = useArretes();
  const [modalOuverte, setModalOuverte] = useState(false);
  const [transitionCible, setTransitionCible] = useState<StatutArrete | null>(null);
  const [commentaire, setCommentaire] = useState("");

  const role = user?.role ?? "lecteur";
  const statutCouleur = couleurStatut(arrete.statut);
  const transitions = prochainStatut(arrete.statut);

  const etapeIndex = ETAPES_WORKFLOW.indexOf(arrete.statut);

  function ouvrirModal(cible: StatutArrete) {
    setTransitionCible(cible);
    setCommentaire("");
    setModalOuverte(true);
  }

  function confirmerTransition() {
    if (!transitionCible || !user) return;
    dispatch({
      type: "TRANSITION",
      id: arrete.id,
      nouveauStatut: transitionCible,
      commentaire: commentaire.trim() || undefined,
      auteur: user.nom,
    });
    setModalOuverte(false);
    setTransitionCible(null);
    setCommentaire("");
  }

  return (
    <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#F9F8F5", padding: 16 }}>
      {/* Statut actuel */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "#6B6A60", fontWeight: 500 }}>Statut :</span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: statutCouleur.bg, color: statutCouleur.text,
        }}>
          {labelStatut(arrete.statut)}
        </span>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16 }}>
        {ETAPES_WORKFLOW.map((etape, i) => {
          const estCourant = arrete.statut === etape;
          const estPasse = etapeIndex > i || (arrete.statut === "abroge" || arrete.statut === "modifie");
          const couleur = estCourant ? couleurStatut(etape) : estPasse ? { bg: "#D1FAE5", text: "#065F46" } : { bg: "#F3F4F6", text: "#A6A399" };
          return (
            <div key={etape} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: couleur.bg, color: couleur.text,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  border: estCourant ? `2px solid ${couleur.text}` : "2px solid transparent",
                }}>
                  {estPasse && !estCourant ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 9, color: couleur.text, marginTop: 3, fontWeight: estCourant ? 700 : 400, whiteSpace: "nowrap" }}>
                  {labelStatut(etape)}
                </span>
              </div>
              {i < ETAPES_WORKFLOW.length - 1 && (
                <div style={{ flex: 1, height: 2, background: estPasse && !estCourant ? "#065F46" : "#E4E1D6", margin: "0 6px", marginBottom: 16 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Boutons de transition */}
      {transitions.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {transitions.map((cible) => {
            const peutFaire = peutEffectuerTransition(role, { from: arrete.statut, to: cible });
            const estRejet = cible === "brouillon";
            return (
              <button
                key={cible}
                onClick={() => ouvrirModal(cible)}
                disabled={!peutFaire}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: estRejet ? "1px solid #B91C1C" : "1px solid #1E3A5F",
                  background: peutFaire ? (estRejet ? "#FEE2E2" : "#1E3A5F") : "#E4E1D6",
                  color: peutFaire ? (estRejet ? "#B91C1C" : "#FFFFFF") : "#A6A399",
                  cursor: peutFaire ? "pointer" : "not-allowed",
                  opacity: peutFaire ? 1 : 0.6,
                }}
              >
                {iconeTransition(cible)}
                {labelTransition(arrete.statut, cible)}
              </button>
            );
          })}
        </div>
      )}

      {/* Historique des commentaires */}
      {arrete.commentaires && arrete.commentaires.length > 0 && (
        <div style={{ borderTop: "1px solid #E4E1D6", paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#6B6A60", margin: "0 0 8px" }}>Historique</p>
          {arrete.commentaires.map((c) => {
            const coul = couleurStatut(c.etape);
            return (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: coul.text, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1C1F1B" }}>{c.auteur}</span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: coul.bg, color: coul.text, fontWeight: 500 }}>
                      {labelStatut(c.etape)}
                    </span>
                    <span style={{ fontSize: 10, color: "#A6A399" }}>
                      {new Date(c.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#6B6A60", margin: "2px 0 0", fontStyle: "italic" }}>
                    "{c.texte}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de commentaire */}
      {modalOuverte && transitionCible && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }} onClick={() => setModalOuverte(false)}>
          <div style={{
            background: "#FFFFFF", borderRadius: 10, padding: 24, width: 400, maxWidth: "90vw",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, color: "#1C1F1B" }}>
              {labelTransition(arrete.statut, transitionCible)}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B6A60" }}>
              Transition : {labelStatut(arrete.statut)} vers {labelStatut(transitionCible)}
            </p>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Commentaire (optionnel)..."
              rows={3}
              style={{
                width: "100%", padding: 10, borderRadius: 6, border: "1px solid #E4E1D6",
                fontSize: 12, fontFamily: "inherit", resize: "vertical",
                background: "#F9F8F5", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button
                onClick={() => setModalOuverte(false)}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  border: "1px solid #E4E1D6", background: "#FFFFFF", color: "#6B6A60", cursor: "pointer",
                }}
              >
                Annuler
              </button>
              <button
                onClick={confirmerTransition}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: "none", background: "#1E3A5F", color: "#FFFFFF", cursor: "pointer",
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
