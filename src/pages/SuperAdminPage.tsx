import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Copy, Check, ArrowLeft, X, ToggleLeft, ToggleRight, Mail, Key } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface Collectivite {
  id: string;
  nom: string;
  code_postal: string;
  siren: string;
  email_admin: string;
  code_acces: string;
  active: boolean;
  date_creation: string;
}

const COLLECTIVITES_INITIALES: Collectivite[] = [
  { id: "tenant_saint_avoye", nom: "Ville de Saint-Avoye", code_postal: "56000", siren: "215600001", email_admin: "admin@saint-avoye.fr", code_acces: "SAINT-AVOYE-2026", active: true, date_creation: "2026-01-15" },
  { id: "tenant_vannes", nom: "Ville de Vannes", code_postal: "56000", siren: "215600002", email_admin: "admin@vannes.fr", code_acces: "VANNES-2026", active: true, date_creation: "2026-03-01" },
  { id: "tenant_lorient", nom: "Ville de Lorient", code_postal: "56100", siren: "215601001", email_admin: "admin@lorient.fr", code_acces: "LORIENT-2026", active: false, date_creation: "2026-04-10" },
];

function genererCode(nom: string): string {
  const slug = nom
    .toUpperCase()
    .replace(/^VILLE DE /, "")
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${new Date().getFullYear()}`;
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [collectivites, setCollectivites] = useState<Collectivite[]>([...COLLECTIVITES_INITIALES]);
  const [modalAjout, setModalAjout] = useState(false);
  const [copie, setCopie] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const superadminAuth = localStorage.getItem("superadmin_auth");
  if (superadminAuth !== "true") {
    navigate("/bienvenue");
    return null;
  }

  function toggleActive(id: string) {
    setCollectivites((prev) => prev.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  }

  function copierCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopie(code);
    setTimeout(() => setCopie(null), 2000);
  }

  function ajouterCollectivite(data: { nom: string; code_postal: string; siren: string; email_admin: string }) {
    const code = genererCode(data.nom);
    const nouvelle: Collectivite = {
      id: `tenant_${Date.now()}`,
      nom: data.nom,
      code_postal: data.code_postal,
      siren: data.siren,
      email_admin: data.email_admin,
      code_acces: code,
      active: true,
      date_creation: new Date().toISOString().slice(0, 10),
    };
    setCollectivites((prev) => [...prev, nouvelle]);
    setModalAjout(false);
    setDetailId(nouvelle.id);
  }

  function deconnexion() {
    localStorage.removeItem("superadmin_auth");
    navigate("/bienvenue");
  }

  const detail = detailId ? collectivites.find((c) => c.id === detailId) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {/* Header */}
      <div style={{ background: "#1E3A5F", color: "#FAFAF7", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/bienvenue")} style={{ background: "none", border: "none", cursor: "pointer", color: "#FAFAF7", display: "flex", alignItems: "center", padding: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <img src="/logo-ignisnova.jpg" alt="Ignis Nova" style={{ height: 28, objectFit: "contain", borderRadius: 3 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Actes360 — Super Admin</p>
            <p style={{ fontSize: 10, margin: 0, opacity: 0.7 }}>Ignis Nova</p>
          </div>
        </div>
        <button onClick={deconnexion} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", color: "#FAFAF7", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Deconnexion
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px", color: "#1C1F1B" }}>Collectivites</h2>
            <p style={{ fontSize: 13, color: "#6B6A60", margin: 0 }}>{collectivites.length} collectivite{collectivites.length > 1 ? "s" : ""} enregistree{collectivites.length > 1 ? "s" : ""}</p>
          </div>
          <button className="btn-primary" onClick={() => setModalAjout(true)} style={{ fontSize: 13 }}>
            <Plus size={14} />Nouvelle collectivite
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "16px 18px", border: "1px solid #E4E1D6" }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 2px", color: "#1E3A5F", fontFamily: "'IBM Plex Mono', monospace" }}>{collectivites.length}</p>
            <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Total collectivites</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "16px 18px", border: "1px solid #E4E1D6" }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 2px", color: "#065F46", fontFamily: "'IBM Plex Mono', monospace" }}>{collectivites.filter((c) => c.active).length}</p>
            <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Actives</p>
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 8, padding: "16px 18px", border: "1px solid #E4E1D6" }}>
            <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 2px", color: "#92400E", fontFamily: "'IBM Plex Mono', monospace" }}>{collectivites.filter((c) => !c.active).length}</p>
            <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Suspendues</p>
          </div>
        </div>

        {/* Liste */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {collectivites.map((c) => (
            <div key={c.id} style={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #E4E1D6", padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: c.active ? "#EBF0F7" : "#F4F2EC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={20} color={c.active ? "#1E3A5F" : "#A6A399"} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: "#1C1F1B" }}>{c.nom}</p>
                    <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>{c.code_postal} — SIREN {c.siren}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* Code d'acces */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F9F8F5", borderRadius: 6, padding: "5px 10px" }}>
                    <Key size={12} color="#6B6A60" />
                    <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#1E3A5F", fontWeight: 600 }}>{c.code_acces}</span>
                    <button onClick={() => copierCode(c.code_acces)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#6B6A60", display: "flex" }}>
                      {copie === c.code_acces ? <Check size={14} color="#065F46" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Statut */}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: c.active ? "#D1FAE5" : "#FEE2E2", color: c.active ? "#065F46" : "#DC2626" }}>
                    {c.active ? "Active" : "Suspendue"}
                  </span>

                  {/* Toggle */}
                  <button onClick={() => toggleActive(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    {c.active ? <ToggleRight size={22} color="#065F46" /> : <ToggleLeft size={22} color="#A6A399" />}
                  </button>
                </div>
              </div>

              {/* Detail card after creation */}
              {detail?.id === c.id && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "#EBF0F7", borderRadius: 8, border: "1px solid #C7D5E8" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", margin: 0 }}>Informations d'acces</p>
                    <button onClick={() => setDetailId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={14} /></button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Key size={14} color="#1E3A5F" />
                      <span style={{ fontSize: 12, color: "#6B6A60" }}>Code d'acces :</span>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: "#1E3A5F" }}>{c.code_acces}</span>
                      <button onClick={() => copierCode(c.code_acces)} className="btn-secondary" style={{ padding: "2px 8px", fontSize: 10 }}>
                        {copie === c.code_acces ? <><Check size={10} />Copie !</> : <><Copy size={10} />Copier</>}
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Mail size={14} color="#1E3A5F" />
                      <span style={{ fontSize: 12, color: "#6B6A60" }}>Email admin :</span>
                      <span style={{ fontSize: 13, color: "#1C1F1B" }}>{c.email_admin}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#6B6A60", margin: "10px 0 0", lineHeight: 1.5 }}>
                    Communiquez ce code a l'administrateur de la collectivite. Il devra le saisir sur la page d'accueil d'Actes360 pour acceder a l'application, puis se connecter avec son email.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal ajout */}
      {modalAjout && (
        <ModalAjoutCollectivite onCancel={() => setModalAjout(false)} onSave={ajouterCollectivite} />
      )}
    </div>
  );
}

function ModalAjoutCollectivite({ onCancel, onSave }: {
  onCancel: () => void;
  onSave: (data: { nom: string; code_postal: string; siren: string; email_admin: string }) => void;
}) {
  const [form, setForm] = useState({ nom: "", code_postal: "", siren: "", email_admin: "" });

  function handleSave() {
    if (!form.nom || !form.code_postal || !form.siren || !form.email_admin) return;
    onSave(form);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onCancel}>
      <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1E3A5F", margin: 0 }}>Nouvelle collectivite</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12, color: "#6B6A60", margin: "0 0 16px" }}>
          Un code d'acces unique sera genere automatiquement.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Nom de la collectivite</label>
            <input type="text" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} placeholder="Ville de..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Code postal</label>
              <input type="text" value={form.code_postal} onChange={(e) => setForm((p) => ({ ...p, code_postal: e.target.value }))} placeholder="56000" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>SIREN</label>
              <input type="text" value={form.siren} onChange={(e) => setForm((p) => ({ ...p, siren: e.target.value }))} placeholder="215600001" />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Email de l'administrateur</label>
            <input type="email" value={form.email_admin} onChange={(e) => setForm((p) => ({ ...p, email_admin: e.target.value }))} placeholder="admin@commune.fr" />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button className="btn-secondary" onClick={onCancel} style={{ fontSize: 12 }}>Annuler</button>
          <button className="btn-primary" onClick={handleSave} style={{ fontSize: 12 }}><Plus size={12} />Creer la collectivite</button>
        </div>
      </div>
    </div>
  );
}
