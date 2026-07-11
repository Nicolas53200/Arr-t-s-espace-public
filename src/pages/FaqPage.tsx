import { useState } from "react";
import { ChevronDown, HelpCircle, Search } from "lucide-react";

interface FaqItem {
  question: string;
  reponse: string;
  categorie: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    categorie: "Prise en main",
    question: "Comment creer un nouvel arrete ?",
    reponse: "Cliquez sur le bouton « Nouvel arrete » depuis la page Actifs ou l'accueil. Un assistant en 5 etapes vous guide : choix du type, informations generales, selection des voies, definition des troncons, puis validation et envoi.",
  },
  {
    categorie: "Prise en main",
    question: "Comment fonctionne le workflow de validation ?",
    reponse: "Chaque arrete suit un circuit : Brouillon → En relecture → Valide → Publie. A chaque transition, les responsables concernes sont notifies. Un administrateur peut approuver ou renvoyer un arrete en relecture.",
  },
  {
    categorie: "Prise en main",
    question: "Puis-je modifier un arrete deja publie ?",
    reponse: "Oui, vous pouvez modifier un arrete publie. Il passera au statut « Modifie » et une nouvelle version sera creee. L'historique des versions est conserve.",
  },
  {
    categorie: "Prise en main",
    question: "Comment abroger un arrete ?",
    reponse: "Depuis la page Actifs, cliquez sur « Abroger » a cote de l'arrete. Vous devrez saisir un motif d'abrogation. L'arrete sera deplace dans l'historique avec le statut « Abroge ».",
  },
  {
    categorie: "Cartographie",
    question: "Comment visualiser les arretes sur la carte ?",
    reponse: "Rendez-vous sur la page Carte. Les arretes actifs sont affiches avec leurs zones d'impact. Cliquez sur une zone pour voir les details de l'arrete associe.",
  },
  {
    categorie: "Cartographie",
    question: "Puis-je exporter la carte ?",
    reponse: "La carte est interactive et peut etre capturee via une capture d'ecran. L'export PDF d'un arrete inclut une representation cartographique des troncons concernes.",
  },
  {
    categorie: "References",
    question: "Que sont les references permanentes ?",
    reponse: "Les references permanentes sont des arretes qui restent actifs dans la duree (delegations, reglements). Elles sont gerees dans la section References avec un suivi de leur date de validite.",
  },
  {
    categorie: "References",
    question: "Comment suis-je alerte des references expirant bientot ?",
    reponse: "Un point orange apparait dans le menu References lorsqu'une reference arrive a echeance dans les 60 jours. Vous recevez egalement une notification.",
  },
  {
    categorie: "Administration",
    question: "Quels sont les differents roles ?",
    reponse: "Trois roles existent : Administrateur (acces complet, gestion des utilisateurs), Redacteur (creation et modification des arretes), Lecteur (consultation uniquement). Les droits sont configures dans la section Admin.",
  },
  {
    categorie: "Administration",
    question: "Comment exporter les donnees ?",
    reponse: "Depuis les pages Actifs et Historique, utilisez le bouton CSV pour exporter la liste des arretes. Chaque arrete peut aussi etre exporte individuellement au format PDF.",
  },
  {
    categorie: "Administration",
    question: "Les donnees sont-elles securisees ?",
    reponse: "Oui. Chaque collectivite dispose d'un espace isole (multi-tenant). Les acces sont controles par role, et toutes les actions sont tracees dans le journal d'audit.",
  },
  {
    categorie: "Support",
    question: "Comment contacter le support ?",
    reponse: "Utilisez le bouton de feedback (icone bulle en bas a droite de l'ecran) pour envoyer un message directement a l'equipe Actes360. Vous pouvez signaler un bug, faire une suggestion ou poser une question.",
  },
  {
    categorie: "Support",
    question: "Puis-je refaire le tour de l'application ?",
    reponse: "Oui, cliquez sur le bouton « Tour guide » (icone boussole) dans le header de l'application pour relancer le tour d'explication a tout moment.",
  },
];

const CATEGORIES = [...new Set(FAQ_DATA.map((f) => f.categorie))];

export default function FaqPage() {
  const [recherche, setRecherche] = useState("");
  const [ouvertes, setOuvertes] = useState<Set<number>>(new Set());
  const [categorieActive, setCategorieActive] = useState<string | null>(null);

  const filtrees = FAQ_DATA.filter((f) => {
    const matchRecherche = !recherche || f.question.toLowerCase().includes(recherche.toLowerCase()) || f.reponse.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie = !categorieActive || f.categorie === categorieActive;
    return matchRecherche && matchCategorie;
  });

  function toggle(index: number) {
    setOuvertes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <HelpCircle size={24} color="#1E3A5F" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1C1F1B" }}>
            Foire aux questions
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>
          Retrouvez les reponses aux questions les plus frequentes sur Actes360.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} color="#6B6A60" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une question..."
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            fontSize: 13,
            fontFamily: "'IBM Plex Sans', sans-serif",
            border: "1px solid #E4E1D6",
            borderRadius: 8,
            background: "#FFFFFF",
            color: "#1C1F1B",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          onClick={() => setCategorieActive(null)}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            fontFamily: "'IBM Plex Sans', sans-serif",
            borderRadius: 20,
            border: !categorieActive ? "none" : "1px solid #E4E1D6",
            background: !categorieActive ? "#1E3A5F" : "#FFFFFF",
            color: !categorieActive ? "#FAFAF7" : "#6B6A60",
            cursor: "pointer",
            fontWeight: !categorieActive ? 600 : 400,
          }}
        >
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategorieActive(cat === categorieActive ? null : cat)}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontFamily: "'IBM Plex Sans', sans-serif",
              borderRadius: 20,
              border: cat === categorieActive ? "none" : "1px solid #E4E1D6",
              background: cat === categorieActive ? "#1E3A5F" : "#FFFFFF",
              color: cat === categorieActive ? "#FAFAF7" : "#6B6A60",
              cursor: "pointer",
              fontWeight: cat === categorieActive ? 600 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrees.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6B6A60" }}>
            <p style={{ fontSize: 14, margin: "0 0 4px" }}>Aucune question trouvee.</p>
            <p style={{ fontSize: 12, margin: 0 }}>Essayez avec d'autres termes de recherche.</p>
          </div>
        )}
        {filtrees.map((faq) => {
          const globalIndex = FAQ_DATA.indexOf(faq);
          const isOpen = ouvertes.has(globalIndex);
          return (
            <div
              key={globalIndex}
              style={{
                border: "1px solid #E4E1D6",
                borderRadius: 8,
                background: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggle(globalIndex)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                <div>
                  <span style={{
                    display: "inline-block",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#1E3A5F",
                    background: "#EBF0F7",
                    padding: "2px 8px",
                    borderRadius: 10,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                    {faq.categorie}
                  </span>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1C1F1B" }}>
                    {faq.question}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  color="#6B6A60"
                  style={{
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {isOpen && (
                <div style={{
                  padding: "0 16px 14px",
                  fontSize: 13,
                  lineHeight: 1.65,
                  color: "#3D3D35",
                  borderTop: "1px solid #F0EDE4",
                  paddingTop: 14,
                }}>
                  {faq.reponse}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact footer */}
      <div style={{
        marginTop: 32,
        padding: "20px 24px",
        background: "#EBF0F7",
        borderRadius: 10,
        textAlign: "center",
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1C1F1B", margin: "0 0 6px" }}>
          Vous n'avez pas trouve votre reponse ?
        </p>
        <p style={{ fontSize: 12, color: "#6B6A60", margin: 0 }}>
          Utilisez le bouton de feedback en bas a droite pour contacter directement l'equipe Actes360.
        </p>
      </div>
    </div>
  );
}
