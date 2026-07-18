import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Map, History, Archive, Shield, Clock, ChevronRight, Globe, ExternalLink } from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { useToast } from "@/contexts/ToastContext";
import { DUREE_CONSERVATION_ANS } from "@/config/constants";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import type { Arrete } from "@/types";
import { useState } from "react";
import ModalAbrogation from "@/components/arretes/ModalAbrogation";
import { genNum } from "@/lib/arrete";
import { AUJOURD_HUI } from "@/config/constants";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AccueilPage() {
  const navigate = useNavigate();
  const { actifs, historique, dispatch, loading, error } = useArretes();
  const { references } = useReferences();
  const toast = useToast();
  const [modalAction, setModalAction] = useState<{ type: string; arrete: Arrete } | null>(null);
  const [nextIdx, setNextIdx] = useState(156);
  const isMobile = useMediaQuery("(max-width: 768px)");

  function abrogerArrete(a: Arrete, motif: string) {
    const n = genNum("ABR", nextIdx);
    dispatch({ type: "UPDATE", id: a.id, updates: { statut: "abroge", arrete_abrogation: { numero: n, date: AUJOURD_HUI.toISOString().split("T")[0]!, motif } } });
    setNextIdx((n) => n + 1);
    setModalAction(null);
    toast.success("Arrete abroge avec succes");
  }

  const stats = [
    { label: "Actifs", valeur: actifs.length, couleur: "#1E3A5F", bg: "#EBF0F7", icon: CheckCircle2 },
    { label: "En historique", valeur: historique.length, couleur: "#6B6A60", bg: "#F0EDE4", icon: Archive },
    { label: "Références", valeur: references.filter((r) => r.actif).length, couleur: "#2F6B4F", bg: "#D1FAE5", icon: Shield },
    { label: "Conservation", valeur: `${DUREE_CONSERVATION_ANS} ans`, couleur: "#92400E", bg: "#FEF3C7", icon: Clock },
  ];

  if (loading) return <LoadingSpinner />;

  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#DC2626", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <p style={{ fontSize: 15, fontWeight: 600 }}>Erreur de chargement</p>
      <p style={{ fontSize: 13, color: "#6B6A60" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ paddingTop: isMobile ? 24 : 48, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 24px" }}>
      <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B6A60", margin: "0 0 8px" }}>Plateforme territoriale</p>
      <h2 className="fd" style={{ fontSize: isMobile ? 24 : 36, margin: "0 0 12px", lineHeight: 1.15, maxWidth: 500 }}>Arrêtés municipaux &amp; espace public</h2>
      <p style={{ fontSize: 14, color: "#6B6A60", margin: "0 0 28px", maxWidth: 460, lineHeight: 1.6 }}>Rédigez, cartographiez et diffusez vos arrêtés depuis un seul outil.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
        <button className="btn-primary" onClick={() => navigate("/nouveau")} style={{ padding: "11px 22px", fontSize: 14 }}><Plus size={16} />Nouvel arrêté</button>
        <button className="btn-secondary" onClick={() => navigate("/actifs")} style={{ padding: "11px 22px", fontSize: 14 }}><CheckCircle2 size={16} />Arrêtés actifs{actifs.length > 0 && <span style={{ background: "#1E3A5F", color: "#fff", borderRadius: 10, fontSize: 11, padding: "1px 7px" }}>{actifs.length}</span>}</button>
        <button className="btn-secondary" onClick={() => navigate("/carte")} style={{ padding: "11px 22px", fontSize: 14 }}><Map size={16} />Carte &amp; calendrier</button>
        <button className="btn-ghost" onClick={() => navigate("/historique")} style={{ padding: "11px 22px", fontSize: 14 }}><History size={16} />Historique</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit,minmax(160px,1fr))", gap: isMobile ? 10 : 14, marginBottom: 36 }}>
        {stats.map(({ label, valeur, couleur, bg, icon: Icon }) => (
          <div key={label} style={{ background: "#FFFFFF", border: "1px solid #E4E1D6", borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
              <div style={{ width: 28, height: 28, borderRadius: 5, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={couleur} /></div>
              <span style={{ fontSize: 12, color: "#6B6A60" }}>{label}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 700, color: couleur, margin: 0, fontFamily: "'IBM Plex Mono',monospace" }}>{valeur}</p>
          </div>
        ))}
      </div>
      {actifs.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 className="fd" style={{ fontSize: 17, margin: 0 }}>Arrêtés actifs récents</h3>
            <button className="btn-ghost" onClick={() => navigate("/actifs")} style={{ fontSize: 12 }}>Voir tous<ChevronRight size={12} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {actifs.slice(0, 3).map((a) => (
              <ArreteLigne key={a.id} arrete={a} compact
                onModifier={() => navigate(`/nouveau/${a.id}`)}
                onAbroger={() => setModalAction({ type: "abroger", arrete: a })} />
            ))}
          </div>
        </div>
      )}

      {/* Carte publique & flux */}
      <div style={{
        marginTop: 36,
        padding: "20px 24px",
        background: "#EBF0F7",
        borderRadius: 10,
        border: "1px solid #C8D6E5",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Globe size={20} color="#1E3A5F" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1C1F1B" }}>
            Carte publique inter-communes
          </h3>
        </div>
        <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 14px", lineHeight: 1.5 }}>
          Visualisez les arretes actifs de toutes les communes du departement sur une carte partagee.
          Accessible aux services d'urgence, GPS et citoyens sans authentification.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/carte-publique"
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 6,
              background: "#1E3A5F", color: "#FAFAF7",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Map size={14} /> Voir la carte <ExternalLink size={12} />
          </a>
          <a
            href="/flux"
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 6,
              background: "#FFFFFF", color: "#1E3A5F",
              border: "1px solid #1E3A5F",
              fontSize: 13, fontWeight: 500, textDecoration: "none",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <Globe size={14} /> Flux GeoJSON / RSS <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {modalAction?.type === "abroger" && (
        <ModalAbrogation arrete={modalAction.arrete} onOk={(m) => abrogerArrete(modalAction.arrete, m)} onCancel={() => setModalAction(null)} />
      )}
    </div>
  );
}
