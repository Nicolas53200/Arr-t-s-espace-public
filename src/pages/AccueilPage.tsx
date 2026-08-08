import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Map, History, Archive, Shield, Clock, ChevronRight, Globe, ExternalLink, Scale, BookOpen } from "lucide-react";
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

      {/* Raccourcis textes nationaux */}
      <div style={{
        marginTop: 20,
        padding: "20px 24px",
        background: "#FFFFFF",
        borderRadius: 10,
        border: "1px solid #E4E1D6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Scale size={20} color="#1E3A5F" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1C1F1B" }}>
            Textes de référence nationaux
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {/* CGCT */}
          <div style={{ background: "#F8F7F3", borderRadius: 8, padding: "14px 16px", border: "1px solid #EDEAE0" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E3A5F", display: "flex", alignItems: "center", gap: 5 }}>
              <BookOpen size={12} /> Code général des collectivités territoriales
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { art: "L.2212-1", desc: "Pouvoir de police du maire", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390199" },
                { art: "L.2212-2", desc: "Sûreté, sécurité, salubrité publiques", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390202" },
                { art: "L.2212-4", desc: "Danger grave ou imminent", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390209" },
                { art: "L.2213-1", desc: "Police de la circulation", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006390308" },
              ].map((t) => (
                <a
                  key={t.art}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    padding: "7px 10px", borderRadius: 5, background: "#FFFFFF", border: "1px solid #E4E1D6",
                    textDecoration: "none", fontSize: 11, color: "#1C1F1B",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1E3A5F"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E4E1D6"; }}
                >
                  <span>
                    <strong style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1E3A5F" }}>Art. {t.art}</strong>
                    <span style={{ color: "#6B6A60", marginLeft: 6 }}>{t.desc}</span>
                  </span>
                  <ExternalLink size={10} color="#A6A399" style={{ flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
          {/* Autres codes */}
          <div style={{ background: "#F8F7F3", borderRadius: 8, padding: "14px 16px", border: "1px solid #EDEAE0" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E3A5F", display: "flex", alignItems: "center", gap: 5 }}>
              <BookOpen size={12} /> Autres textes fondamentaux
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { art: "Code de la route — R.411-25", desc: "Réglementation sur les voies communales", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842097" },
                { art: "Code de la route — R.411-8", desc: "Arrêtés de police de la circulation", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006842050" },
                { art: "Code de la voirie — L.116-1 à L.116-8", desc: "Coordination des travaux", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070667/LEGISCTA000006159378" },
                { art: "Code de la sécurité intérieure — L.211-1", desc: "Manifestations sur la voie publique", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025505075" },
              ].map((t) => (
                <a
                  key={t.art}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    padding: "7px 10px", borderRadius: 5, background: "#FFFFFF", border: "1px solid #E4E1D6",
                    textDecoration: "none", fontSize: 11, color: "#1C1F1B",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1E3A5F"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E4E1D6"; }}
                >
                  <span>
                    <strong style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1E3A5F" }}>{t.art}</strong>
                    <span style={{ color: "#6B6A60", marginLeft: 6 }}>{t.desc}</span>
                  </span>
                  <ExternalLink size={10} color="#A6A399" style={{ flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 10, color: "#A6A399", textAlign: "center" }}>
          Liens vers Légifrance — les textes consolidés en vigueur
        </p>
      </div>

      {modalAction?.type === "abroger" && (
        <ModalAbrogation arrete={modalAction.arrete} onOk={(m) => abrogerArrete(modalAction.arrete, m)} onCancel={() => setModalAction(null)} />
      )}
    </div>
  );
}
