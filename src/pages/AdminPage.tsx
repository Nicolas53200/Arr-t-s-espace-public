import { useState } from "react";
import { Users, Settings, Puzzle, Plus, X, Check, ToggleLeft, ToggleRight, Map, FileText, Bell, GitBranch, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { UTILISATEURS_MOCK } from "@/data/utilisateurs.mock";
import { fmtDate } from "@/lib/date";
import Modal from "@/components/common/Modal";
import type { Utilisateur, ConfigTenant } from "@/types";
import type { Role } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type OngletAdmin = "utilisateurs" | "configuration" | "modules";

interface ModuleInfo {
  id: string;
  nom: string;
  description: string;
  icone: typeof Map;
}

const MODULES_DISPONIBLES: ModuleInfo[] = [
  { id: "cartographie", nom: "Cartographie", description: "Visualisation des impacts sur la carte interactive de la commune.", icone: Map },
  { id: "pdf", nom: "Generation PDF", description: "Export des arretes au format PDF avec mise en page officielle.", icone: FileText },
  { id: "notifications", nom: "Notifications", description: "Alertes par email et dans l'application pour les echeances et validations.", icone: Bell },
  { id: "workflow", nom: "Workflow", description: "Circuit de validation configurable avec etapes et relecture.", icone: GitBranch },
  { id: "export", nom: "Export", description: "Export des donnees en CSV, PDF et formats ouverts.", icone: Download },
];

const CONFIG_INITIALE: ConfigTenant = {
  id: "tenant_saint_avoye",
  nom: "Ville de Saint-Avoye",
  siren: "215600001",
  adresse: "1 Place de la Mairie, 56000 Saint-Avoye",
  couleur_primaire: "#1E3A5F",
  modules_actifs: ["cartographie", "pdf", "export"],
  limites: {
    max_utilisateurs: 20,
    max_arretes: 500,
    stockage_mo: 2048,
  },
};

export default function AdminPage() {
  const { can } = useAuth();
  const { tenant } = useTenant();
  const [onglet, setOnglet] = useState<OngletAdmin>("utilisateurs");
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([...UTILISATEURS_MOCK]);
  const [config, setConfig] = useState<ConfigTenant>({ ...CONFIG_INITIALE, nom: tenant.nom, siren: tenant.siren });
  const [modalAjout, setModalAjout] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!can("admin:manage")) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center", color: "#A6A399" }}>
        <Settings size={40} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A18" }}>Acces restreint</p>
        <p style={{ fontSize: 13 }}>Seuls les administrateurs peuvent acceder a ce panneau.</p>
      </div>
    );
  }

  const onglets: { id: OngletAdmin; label: string; icone: typeof Users }[] = [
    { id: "utilisateurs", label: "Utilisateurs", icone: Users },
    { id: "configuration", label: "Configuration", icone: Settings },
    { id: "modules", label: "Modules", icone: Puzzle },
  ];

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Administration</h2>
        <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>Gestion des utilisateurs, configuration et modules.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #E4E1D6" }}>
        {onglets.map((o) => {
          const Icone = o.icone;
          return (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 12,
                border: "none", cursor: "pointer",
                borderBottom: onglet === o.id ? "2px solid #1E3A5F" : "2px solid transparent",
                background: "none", color: onglet === o.id ? "#1E3A5F" : "#6B6A60",
                fontWeight: onglet === o.id ? 600 : 400,
                fontFamily: "'IBM Plex Sans',sans-serif", marginBottom: -1,
              }}
            >
              <Icone size={13} />{o.label}
            </button>
          );
        })}
      </div>

      {onglet === "utilisateurs" && (
        <UtilisateursTab
          utilisateurs={utilisateurs}
          setUtilisateurs={setUtilisateurs}
          onAjouter={() => setModalAjout(true)}
        />
      )}

      {onglet === "configuration" && (
        <ConfigurationTab config={config} setConfig={setConfig} />
      )}

      {onglet === "modules" && (
        <ModulesTab config={config} setConfig={setConfig} />
      )}

      {modalAjout && (
        <ModalAjoutUtilisateur
          onCancel={() => setModalAjout(false)}
          onSave={(u) => {
            setUtilisateurs((prev) => [...prev, u]);
            setModalAjout(false);
          }}
        />
      )}
    </div>
  );
}

function UtilisateursTab({
  utilisateurs,
  setUtilisateurs,
  onAjouter,
}: {
  utilisateurs: Utilisateur[];
  setUtilisateurs: React.Dispatch<React.SetStateAction<Utilisateur[]>>;
  onAjouter: () => void;
}) {
  function toggleActif(id: string) {
    setUtilisateurs((prev) =>
      prev.map((u) => (u.id === id ? { ...u, actif: !u.actif } : u))
    );
  }

  function changeRole(id: string, role: Role) {
    setUtilisateurs((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  }

  const ROLE_BADGES: Record<Role, { bg: string; color: string; label: string }> = {
    admin: { bg: "#FEE2E2", color: "#DC2626", label: "Admin" },
    redacteur: { bg: "#EBF0F7", color: "#1E3A5F", label: "Redacteur" },
    lecteur: { bg: "#F4F2EC", color: "#6B6A60", label: "Lecteur" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>{utilisateurs.length} utilisateur{utilisateurs.length > 1 ? "s" : ""}</p>
        <button className="btn-primary" onClick={onAjouter} style={{ fontSize: 12 }}><Plus size={13} />Ajouter</button>
      </div>

      <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, overflow: "hidden", overflowX: "auto", WebkitOverflowScrolling: "touch" as const }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px 140px", minWidth: 600,
          padding: "10px 14px", background: "#F9F8F5", fontSize: 11, fontWeight: 600, color: "#6B6A60",
          borderBottom: "1px solid #E4E1D6",
        }}>
          <span>Nom</span>
          <span>Email</span>
          <span>Role</span>
          <span>Statut</span>
          <span>Derniere connexion</span>
        </div>

        {/* Rows */}
        {utilisateurs.map((u) => {
          const badge = ROLE_BADGES[u.role];
          return (
            <div
              key={u.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 120px 80px 140px", minWidth: 600,
                padding: "10px 14px", borderBottom: "1px solid #F0EDE4",
                alignItems: "center", fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 500 }}>{u.nom}</span>
              <span style={{ color: "#6B6A60", fontSize: 12 }}>{u.email}</span>
              <span>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  style={{
                    background: badge.bg, color: badge.color, border: "none",
                    borderRadius: 12, padding: "3px 8px", fontSize: 10, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif",
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="redacteur">Redacteur</option>
                  <option value="lecteur">Lecteur</option>
                </select>
              </span>
              <span>
                <button
                  onClick={() => toggleActif(u.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, padding: 0,
                    color: u.actif ? "#065F46" : "#A6A399", fontSize: 10, fontWeight: 600,
                  }}
                >
                  {u.actif ? <ToggleRight size={18} color="#065F46" /> : <ToggleLeft size={18} color="#A6A399" />}
                  {u.actif ? "Actif" : "Inactif"}
                </button>
              </span>
              <span style={{ fontSize: 11, color: "#A6A399", fontFamily: "'IBM Plex Mono',monospace" }}>
                {u.derniere_connexion ? fmtDate(u.derniere_connexion) : "Jamais"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfigurationTab({
  config,
  setConfig,
}: {
  config: ConfigTenant;
  setConfig: React.Dispatch<React.SetStateAction<ConfigTenant>>;
}) {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const champ = (label: string, valeur: string, champ: keyof ConfigTenant) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: "#1A1A18" }}>{label}</label>
      <input
        type="text"
        value={valeur}
        onChange={(e) => setConfig((prev) => ({ ...prev, [champ]: e.target.value }))}
        style={{ width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 20 }}>
        <h3 className="fd" style={{ fontSize: 15, margin: "0 0 16px" }}>Informations de la collectivite</h3>
        {champ("Nom de la collectivite", config.nom, "nom")}
        {champ("SIREN", config.siren, "siren")}
        {champ("Adresse", config.adresse, "adresse")}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: "#1A1A18" }}>Couleur primaire</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={config.couleur_primaire}
              onChange={(e) => setConfig((prev) => ({ ...prev, couleur_primaire: e.target.value }))}
              style={{ width: 40, height: 32, padding: 2, border: "1px solid #E4E1D6", borderRadius: 4, cursor: "pointer" }}
            />
            <span className="fm" style={{ fontSize: 12, color: "#6B6A60" }}>{config.couleur_primaire}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #E4E1D6", paddingTop: 14, marginTop: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: "#6B6A60" }}>Limites du plan</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#F9F8F5", borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: "#1E3A5F", fontFamily: "'IBM Plex Mono',monospace" }}>{config.limites.max_utilisateurs}</p>
              <p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Utilisateurs max</p>
            </div>
            <div style={{ background: "#F9F8F5", borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: "#1E3A5F", fontFamily: "'IBM Plex Mono',monospace" }}>{config.limites.max_arretes}</p>
              <p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Arretes max</p>
            </div>
            <div style={{ background: "#F9F8F5", borderRadius: 6, padding: "10px 12px", textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: "#1E3A5F", fontFamily: "'IBM Plex Mono',monospace" }}>{config.limites.stockage_mo} Mo</p>
              <p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Stockage</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}>
            <Check size={12} />{saved ? "Enregistre !" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModulesTab({
  config,
  setConfig,
}: {
  config: ConfigTenant;
  setConfig: React.Dispatch<React.SetStateAction<ConfigTenant>>;
}) {
  function toggleModule(moduleId: string) {
    setConfig((prev) => {
      const actifs = prev.modules_actifs.includes(moduleId)
        ? prev.modules_actifs.filter((m) => m !== moduleId)
        : [...prev.modules_actifs, moduleId];
      return { ...prev, modules_actifs: actifs };
    });
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 14px" }}>Activez ou desactivez les modules fonctionnels de votre plateforme.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {MODULES_DISPONIBLES.map((mod) => {
          const actif = config.modules_actifs.includes(mod.id);
          const Icone = mod.icone;
          return (
            <div
              key={mod.id}
              style={{
                border: `1px solid ${actif ? "#1E3A5F" : "#E4E1D6"}`,
                borderRadius: 8, background: "#FFFFFF", padding: 16,
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: actif ? "#EBF0F7" : "#F9F8F5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icone size={18} color={actif ? "#1E3A5F" : "#A6A399"} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                    background: actif ? "#D1FAE5" : "#F4F2EC",
                    color: actif ? "#065F46" : "#A6A399",
                  }}>
                    {actif ? "Actif" : "Inactif"}
                  </span>
                  <button
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    {actif
                      ? <ToggleRight size={22} color="#065F46" />
                      : <ToggleLeft size={22} color="#A6A399" />
                    }
                  </button>
                </div>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#1A1A18" }}>{mod.nom}</h4>
              <p style={{ fontSize: 12, color: "#6B6A60", margin: 0, lineHeight: 1.4 }}>{mod.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModalAjoutUtilisateur({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (u: Utilisateur) => void;
}) {
  const [form, setForm] = useState({
    nom: "",
    email: "",
    role: "lecteur" as Role,
  });

  function handleSave() {
    if (!form.nom || !form.email) return;
    onSave({
      id: `u${Date.now()}`,
      nom: form.nom,
      email: form.email,
      role: form.role,
      actif: true,
      date_creation: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <Modal onClose={onCancel}>
      <div style={{ background: "#FFFFFF", borderRadius: 11, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px #0000002A" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="fd" style={{ fontSize: 16, margin: 0 }}>Nouvel utilisateur</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Nom</label>
            <input type="text" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Prenom Nom" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@commune.fr" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Role</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}>
              <option value="admin">Administrateur</option>
              <option value="redacteur">Redacteur</option>
              <option value="lecteur">Lecteur</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 16 }}>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: 12 }}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}><Check size={12} />Ajouter</button>
        </div>
      </div>
    </Modal>
  );
}
