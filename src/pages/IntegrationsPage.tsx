import { useState, useEffect, useCallback } from "react";
import {
  Send, Globe, PenTool, Calendar, Webhook, Mail,
  CheckCircle2, XCircle, AlertTriangle, Clock, Loader2,
  RefreshCw, Settings, ChevronDown, ChevronUp,
  Copy, Check, Zap, Shield, ToggleLeft, ToggleRight,
  Plus, Trash2, X,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useAudit } from "@/contexts/AuditContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { fmtDate } from "@/lib/date";
import { IntegrationsService } from "@/services/integrations.service";
import {
  validerConfigActes,
  validerConfigOpenData,
  validerConfigIParapheur,
  validerConfigSmtp,
  validerWebhookEndpoint,
  resumerTransmissions,
  LABELS_CLASSIFICATION,
  LABELS_EVENEMENTS,
  TOUS_EVENEMENTS,
  type ErreurValidation,
} from "@/lib/integrations";
import type {
  Integration,
  CodeIntegration,
  StatutIntegration,
  HistoriqueTransmission,
  ConfigActesTdt,
  ConfigOpenData,
  ConfigIParapheur,
  ConfigICal,
  ConfigSmtp,
  ConfigWebhook,
  WebhookEndpoint,
  EvenementWebhook,
  ClassificationActe,
  StatutTransmission,
} from "@/types";
import Modal from "@/components/common/Modal";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de style
// ─────────────────────────────────────────────────────────────────────────────

const ICONES: Record<CodeIntegration, typeof Send> = {
  actes_tdt: Send,
  open_data: Globe,
  iparapheur: PenTool,
  ical: Calendar,
  webhooks: Webhook,
  smtp: Mail,
};

const COULEURS_STATUT: Record<StatutIntegration, { bg: string; color: string; label: string }> = {
  active: { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  inactive: { bg: "#F4F2EC", color: "#6B6A60", label: "Inactive" },
  erreur: { bg: "#FEE2E2", color: "#DC2626", label: "Erreur" },
  en_cours: { bg: "#FEF3C7", color: "#92400E", label: "En cours" },
};

const COULEURS_TRANSMISSION: Record<StatutTransmission, { bg: string; color: string }> = {
  en_attente: { bg: "#F4F2EC", color: "#6B6A60" },
  en_cours: { bg: "#FEF3C7", color: "#92400E" },
  transmis: { bg: "#D1FAE5", color: "#065F46" },
  accuse_reception: { bg: "#D1FAE5", color: "#047857" },
  rejete: { bg: "#FEE2E2", color: "#DC2626" },
  erreur: { bg: "#FEE2E2", color: "#DC2626" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { tenant } = useTenant();
  const { can } = useAuth();
  const toast = useToast();
  const { logAction } = useAudit();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [chargement, setChargement] = useState(true);
  const [detailOuvert, setDetailOuvert] = useState<CodeIntegration | null>(null);
  const [modalConfig, setModalConfig] = useState<CodeIntegration | null>(null);

  const charger = useCallback(async () => {
    try {
      const data = await IntegrationsService.lister(tenant.siren);
      setIntegrations(data);
    } finally {
      setChargement(false);
    }
  }, [tenant.siren]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const activer = async (code: CodeIntegration) => {
    try {
      const maj = await IntegrationsService.activer(code, tenant.siren);
      setIntegrations((prev) => prev.map((i) => (i.code === code ? maj : i)));
      logAction("synchronisation", "registre", code, `Activation de l'intégration ${maj.nom}`);
      toast.success(`${maj.nom} activée`);
    } catch {
      toast.error("Erreur lors de l'activation");
    }
  };

  const desactiver = async (code: CodeIntegration) => {
    try {
      const maj = await IntegrationsService.desactiver(code, tenant.siren);
      setIntegrations((prev) => prev.map((i) => (i.code === code ? maj : i)));
      logAction("synchronisation", "registre", code, `Désactivation de l'intégration ${maj.nom}`);
      toast.info(`${maj.nom} désactivée`);
    } catch {
      toast.error("Erreur lors de la désactivation");
    }
  };

  const tester = async (code: CodeIntegration) => {
    const result = await IntegrationsService.testerConnexion(code);
    if (result.succes) {
      toast.success(`Connexion OK (${result.duree_ms}ms)`);
    } else {
      toast.error(result.message);
    }
  };

  const synchroniser = async (code: CodeIntegration) => {
    try {
      const result = await IntegrationsService.synchroniser(code, tenant.siren);
      await charger(); // Recharger les compteurs
      if (result.statut === "transmis" || result.statut === "accuse_reception") {
        toast.success("Synchronisation réussie");
      } else {
        toast.warning("Synchronisation terminée avec des erreurs");
      }
    } catch {
      toast.error("Erreur lors de la synchronisation");
    }
  };

  if (!can("admin:manage")) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center", color: "#A6A399" }}>
        <Settings size={40} style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1A18" }}>Accès restreint</p>
        <p style={{ fontSize: 13 }}>Seuls les administrateurs peuvent gérer les intégrations.</p>
      </div>
    );
  }

  if (chargement) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center", color: "#A6A399" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ fontSize: 13, marginTop: 8 }}>Chargement des intégrations…</p>
      </div>
    );
  }

  const actives = integrations.filter((i) => i.statut === "active").length;

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 className="fd" style={{ fontSize: 22, margin: "0 0 2px" }}>Intégrations</h2>
          <p style={{ color: "#6B6A60", fontSize: 13, margin: 0 }}>
            Connectez Actes360 à vos outils et systèmes existants. {actives} intégration{actives > 1 ? "s" : ""} active{actives > 1 ? "s" : ""}.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 20, background: "#EBF0F7", color: "#1E3A5F",
          }}>
            <Zap size={12} />{actives} / {integrations.length}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Intégrations actives", valeur: actives, icone: CheckCircle2, color: "#065F46" },
          { label: "Transmissions totales", valeur: integrations.reduce((s, i) => s + i.total_transmissions, 0), icone: Send, color: "#1E3A5F" },
          { label: "Erreurs récentes", valeur: integrations.reduce((s, i) => s + i.erreurs_recentes, 0), icone: AlertTriangle, color: integrations.reduce((s, i) => s + i.erreurs_recentes, 0) > 0 ? "#DC2626" : "#065F46" },
          { label: "Dernière synchro", valeur: (() => { const dates = integrations.filter((i) => i.date_derniere_synchro).map((i) => i.date_derniere_synchro!); return dates.length > 0 ? fmtDate(dates.sort().reverse()[0]!) : "—"; })(), icone: RefreshCw, color: "#6B6A60" },
        ].map((kpi) => {
          const Ic = kpi.icone;
          return (
            <div key={kpi.label} style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ic size={13} color={kpi.color} />
                <span style={{ fontSize: 11, color: "#6B6A60" }}>{kpi.label}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: kpi.color, fontFamily: "'IBM Plex Mono',monospace" }}>
                {kpi.valeur}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grille d'intégrations */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 14 }}>
        {integrations.map((integ) => (
          <CarteIntegration
            key={integ.code}
            integration={integ}
            ouvert={detailOuvert === integ.code}
            onToggle={() => setDetailOuvert((p) => (p === integ.code ? null : integ.code))}
            onActiver={() => activer(integ.code)}
            onDesactiver={() => desactiver(integ.code)}
            onTester={() => tester(integ.code)}
            onSynchroniser={() => synchroniser(integ.code)}
            onConfigurer={() => setModalConfig(integ.code)}
          />
        ))}
      </div>

      {/* Modal configuration */}
      {modalConfig && (
        <ModalConfiguration
          integration={integrations.find((i) => i.code === modalConfig)!}
          siren={tenant.siren}
          onFermer={() => setModalConfig(null)}
          onSauvegarder={async (config) => {
            await IntegrationsService.mettreAJourConfig(modalConfig, config, tenant.siren);
            await charger();
            toast.success("Configuration enregistrée");
            setModalConfig(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte d'intégration
// ─────────────────────────────────────────────────────────────────────────────

function CarteIntegration({
  integration,
  ouvert,
  onToggle,
  onActiver,
  onDesactiver,
  onTester,
  onSynchroniser,
  onConfigurer,
}: {
  integration: Integration;
  ouvert: boolean;
  onToggle: () => void;
  onActiver: () => void;
  onDesactiver: () => void;
  onTester: () => void;
  onSynchroniser: () => void;
  onConfigurer: () => void;
}) {
  const [historique, setHistorique] = useState<HistoriqueTransmission[]>([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const [synchroEnCours, setSynchroEnCours] = useState(false);
  const [testEnCours, setTestEnCours] = useState(false);

  const Icone = ICONES[integration.code];
  const statutStyle = COULEURS_STATUT[integration.statut];
  const estActive = integration.statut === "active";

  useEffect(() => {
    if (ouvert && historique.length === 0) {
      setChargementHistorique(true);
      IntegrationsService.historiqueTransmissions(integration.code)
        .then(setHistorique)
        .finally(() => setChargementHistorique(false));
    }
  }, [ouvert, integration.code, historique.length]);

  const handleTest = async () => {
    setTestEnCours(true);
    try {
      await onTester();
    } finally {
      setTestEnCours(false);
    }
  };

  const handleSynchro = async () => {
    setSynchroEnCours(true);
    try {
      await onSynchroniser();
      // Recharger l'historique
      const h = await IntegrationsService.historiqueTransmissions(integration.code);
      setHistorique(h);
    } finally {
      setSynchroEnCours(false);
    }
  };

  const resume = resumerTransmissions(historique);

  return (
    <div style={{
      border: `1px solid ${estActive ? "#1E3A5F" : "#E4E1D6"}`,
      borderRadius: 10,
      background: "#FFFFFF",
      overflow: "hidden",
      transition: "border-color 0.15s, box-shadow 0.15s",
      boxShadow: estActive ? "0 0 0 1px #1E3A5F20" : "none",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: estActive ? "#EBF0F7" : "#F9F8F5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icone size={20} color={estActive ? "#1E3A5F" : "#A6A399"} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1A18" }}>{integration.nom}</h3>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                background: statutStyle.bg, color: statutStyle.color,
              }}>
                {statutStyle.label}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#6B6A60", margin: 0, lineHeight: 1.4 }}>
              {integration.description}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <button
            onClick={estActive ? onDesactiver : onActiver}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            title={estActive ? "Désactiver" : "Activer"}
          >
            {estActive ? <ToggleRight size={24} color="#065F46" /> : <ToggleLeft size={24} color="#A6A399" />}
          </button>
        </div>
      </div>

      {/* Métriques compactes */}
      {estActive && (
        <div style={{ padding: "0 18px 10px", display: "flex", gap: 16 }}>
          <span style={{ fontSize: 11, color: "#6B6A60" }}>
            <strong style={{ color: "#1A1A18", fontFamily: "'IBM Plex Mono',monospace" }}>{integration.total_transmissions}</strong> transmissions
          </span>
          {integration.erreurs_recentes > 0 && (
            <span style={{ fontSize: 11, color: "#DC2626" }}>
              <strong style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{integration.erreurs_recentes}</strong> erreurs
            </span>
          )}
          {integration.date_derniere_synchro && (
            <span style={{ fontSize: 11, color: "#6B6A60" }}>
              Dernière synchro : {fmtDate(integration.date_derniere_synchro)}
            </span>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div style={{ padding: "8px 18px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #F0EDE4" }}>
        <button className="btn-secondary" onClick={onConfigurer} style={{ fontSize: 11, padding: "5px 10px" }}>
          <Settings size={11} />Configurer
        </button>
        {estActive && (
          <>
            <button
              className="btn-secondary"
              onClick={handleTest}
              disabled={testEnCours}
              style={{ fontSize: 11, padding: "5px 10px" }}
            >
              {testEnCours ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={11} />}
              Tester
            </button>
            <button
              className="btn-primary"
              onClick={handleSynchro}
              disabled={synchroEnCours}
              style={{ fontSize: 11, padding: "5px 10px" }}
            >
              {synchroEnCours ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />}
              Synchroniser
            </button>
          </>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4, color: "#6B6A60", fontSize: 11,
            fontFamily: "'IBM Plex Sans',sans-serif", padding: "5px 6px",
          }}
        >
          Historique{ouvert ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Historique déroulé */}
      {ouvert && (
        <div style={{ borderTop: "1px solid #E4E1D6", background: "#FAFAF7" }}>
          {chargementHistorique ? (
            <div style={{ padding: 20, textAlign: "center" }}>
              <Loader2 size={16} color="#6B6A60" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : historique.length === 0 ? (
            <div style={{ padding: "16px 18px", textAlign: "center", color: "#A6A399", fontSize: 12 }}>
              Aucune transmission enregistrée.
            </div>
          ) : (
            <>
              {/* Résumé */}
              <div style={{ padding: "12px 18px", display: "flex", gap: 16, borderBottom: "1px solid #E4E1D6" }}>
                <Stat label="Total" valeur={resume.total} color="#1A1A18" />
                <Stat label="Réussies" valeur={resume.reussies} color="#065F46" />
                <Stat label="En attente" valeur={resume.en_attente} color="#92400E" />
                <Stat label="Erreurs" valeur={resume.en_erreur} color="#DC2626" />
                {resume.taux_reussite > 0 && (
                  <Stat label="Taux" valeur={`${resume.taux_reussite}%`} color="#065F46" />
                )}
              </div>
              {/* Lignes */}
              {historique.slice(0, 5).map((h) => {
                const cs = COULEURS_TRANSMISSION[h.statut];
                return (
                  <div key={h.id} style={{
                    padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
                    borderBottom: "1px solid #F0EDE4", fontSize: 12,
                  }}>
                    {h.statut === "transmis" || h.statut === "accuse_reception"
                      ? <CheckCircle2 size={14} color="#065F46" />
                      : h.statut === "erreur" || h.statut === "rejete"
                      ? <XCircle size={14} color="#DC2626" />
                      : <Clock size={14} color="#92400E" />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, color: "#1A1A18" }}>{h.action}</span>
                      <span style={{ color: "#A6A399", marginLeft: 6 }}>— {h.entite_label}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 10,
                      background: cs.bg, color: cs.color, flexShrink: 0,
                    }}>
                      {h.statut.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 10, color: "#A6A399", fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0 }}>
                      {fmtDate(h.date)}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, valeur, color }: { label: string; valeur: number | string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: "#A6A399", margin: "0 0 1px" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color, fontFamily: "'IBM Plex Mono',monospace" }}>{valeur}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de configuration
// ─────────────────────────────────────────────────────────────────────────────

function ModalConfiguration({
  integration,
  siren,
  onFermer,
  onSauvegarder,
}: {
  integration: Integration;
  siren: string;
  onFermer: () => void;
  onSauvegarder: (config: Integration["configuration"]) => Promise<void>;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([]);
  const Icone = ICONES[integration.code];

  const handleSave = async (config: Integration["configuration"]) => {
    // Validation
    let errs: ErreurValidation[] = [];
    switch (integration.code) {
      case "actes_tdt":
        errs = validerConfigActes(config as ConfigActesTdt);
        break;
      case "open_data":
        errs = validerConfigOpenData(config as ConfigOpenData);
        break;
      case "iparapheur":
        errs = validerConfigIParapheur(config as ConfigIParapheur);
        break;
      case "smtp":
        errs = validerConfigSmtp(config as ConfigSmtp);
        break;
    }
    if (errs.length > 0) {
      setErreurs(errs);
      return;
    }
    setErreurs([]);
    setEnCours(true);
    try {
      await onSauvegarder(config);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Modal onClose={onFermer}>
      <div style={{
        background: "#FFFFFF", borderRadius: 12, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 60px #0000002A",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid #E4E1D6",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#FFFFFF", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: "#EBF0F7",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icone size={16} color="#1E3A5F" />
            </div>
            <div>
              <h3 className="fd" style={{ fontSize: 15, margin: 0 }}>{integration.nom}</h3>
              <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>Configuration</p>
            </div>
          </div>
          <button onClick={onFermer} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60" }}>
            <X size={16} />
          </button>
        </div>

        {/* Erreurs */}
        {erreurs.length > 0 && (
          <div style={{ padding: "10px 22px", background: "#FEF2F2" }}>
            {erreurs.map((e, i) => (
              <p key={i} style={{ fontSize: 12, color: "#DC2626", margin: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>
                <XCircle size={12} />{e.message}
              </p>
            ))}
          </div>
        )}

        {/* Corps — rendu selon le type */}
        <div style={{ padding: "18px 22px" }}>
          {integration.code === "actes_tdt" && (
            <ConfigActesForm
              config={integration.configuration as ConfigActesTdt}
              siren={siren}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
          {integration.code === "open_data" && (
            <ConfigOpenDataForm
              config={integration.configuration as ConfigOpenData}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
          {integration.code === "iparapheur" && (
            <ConfigIParapheurForm
              config={integration.configuration as ConfigIParapheur}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
          {integration.code === "ical" && (
            <ConfigICalForm
              config={integration.configuration as ConfigICal}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
          {integration.code === "webhooks" && (
            <ConfigWebhooksForm
              config={integration.configuration as ConfigWebhook}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
          {integration.code === "smtp" && (
            <ConfigSmtpForm
              config={integration.configuration as ConfigSmtp}
              onSave={handleSave}
              enCours={enCours}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaires de configuration
// ─────────────────────────────────────────────────────────────────────────────

function Champ({ label, aide, children }: { label: string; aide?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: "#1A1A18" }}>{label}</label>
      {aide && <p style={{ fontSize: 10, color: "#A6A399", margin: "0 0 6px" }}>{aide}</p>}
      {children}
    </div>
  );
}

function BoutonSauvegarder({ onClick, enCours }: { onClick: () => void; enCours: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
      <button className="btn-primary" onClick={onClick} disabled={enCours} style={{ fontSize: 12 }}>
        {enCours ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={12} />}
        Enregistrer
      </button>
    </div>
  );
}

// -- ACTES/TDT --
function ConfigActesForm({ config, siren, onSave, enCours }: { config: ConfigActesTdt; siren: string; onSave: (c: ConfigActesTdt) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigActesTdt>({ ...config, siren: config.siren || siren });
  return (
    <>
      <Champ label="URL du tiers de télétransmission" aide="Ex: https://s2low.collectivites.fr/actes-ws">
        <input type="url" value={form.url_teletransmission} onChange={(e) => setForm((p) => ({ ...p, url_teletransmission: e.target.value }))} placeholder="https://..." />
      </Champ>
      <Champ label="SIREN de la collectivité">
        <input type="text" value={form.siren} onChange={(e) => setForm((p) => ({ ...p, siren: e.target.value }))} maxLength={9} />
      </Champ>
      <Champ label="Référence du certificat client" aide="Identifiant du certificat X.509 installé sur le serveur">
        <input type="text" value={form.certificat_ref ?? ""} onChange={(e) => setForm((p) => ({ ...p, certificat_ref: e.target.value }))} placeholder="CN=Mairie..." />
      </Champ>
      <Champ label="Classification par défaut">
        <select value={form.classification_defaut} onChange={(e) => setForm((p) => ({ ...p, classification_defaut: e.target.value as ClassificationActe }))}>
          {Object.entries(LABELS_CLASSIFICATION).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </Champ>
      <Champ label="Format de transmission">
        <select value={form.format} onChange={(e) => setForm((p) => ({ ...p, format: e.target.value as "xml" | "pdf" }))}>
          <option value="xml">XML (ACTES)</option>
          <option value="pdf">PDF</option>
        </select>
      </Champ>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={form.envoi_auto} onChange={(e) => setForm((p) => ({ ...p, envoi_auto: e.target.checked }))} />
        Envoi automatique à la publication
      </label>
      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}

// -- Open Data --
function ConfigOpenDataForm({ config, onSave, enCours }: { config: ConfigOpenData; onSave: (c: ConfigOpenData) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigOpenData>({ ...config });
  return (
    <>
      <Champ label="Clé API data.gouv.fr" aide="Disponible dans les paramètres de votre compte data.gouv.fr">
        <input type="password" value={form.api_key} onChange={(e) => setForm((p) => ({ ...p, api_key: e.target.value }))} placeholder="••••••••" />
      </Champ>
      <Champ label="Identifiant de l'organisation" aide="ID de votre organisation sur data.gouv.fr">
        <input type="text" value={form.organisation_id} onChange={(e) => setForm((p) => ({ ...p, organisation_id: e.target.value }))} placeholder="5e3f..." />
      </Champ>
      <Champ label="Identifiant du jeu de données" aide="Laissez vide pour créer automatiquement un nouveau dataset">
        <input type="text" value={form.dataset_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, dataset_id: e.target.value }))} placeholder="Automatique" />
      </Champ>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Champ label="Fréquence de publication">
          <select value={form.frequence} onChange={(e) => setForm((p) => ({ ...p, frequence: e.target.value as ConfigOpenData["frequence"] }))}>
            <option value="quotidien">Quotidien</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuel">Mensuel</option>
            <option value="manuel">Manuel</option>
          </select>
        </Champ>
        <Champ label="Format">
          <select value={form.format} onChange={(e) => setForm((p) => ({ ...p, format: e.target.value as "json" | "csv" }))}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </Champ>
      </div>
      <Champ label="Licence">
        <select value={form.licence} onChange={(e) => setForm((p) => ({ ...p, licence: e.target.value as ConfigOpenData["licence"] }))}>
          <option value="lo_2_0">Licence Ouverte 2.0 (recommandée)</option>
          <option value="odbl">Open Database License (ODbL)</option>
        </select>
      </Champ>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={form.inclure_brouillons} onChange={(e) => setForm((p) => ({ ...p, inclure_brouillons: e.target.checked }))} />
        Inclure les arrêtés en brouillon
      </label>
      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}

// -- iParapheur --
function ConfigIParapheurForm({ config, onSave, enCours }: { config: ConfigIParapheur; onSave: (c: ConfigIParapheur) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigIParapheur>({ ...config });
  return (
    <>
      <Champ label="URL du service iParapheur" aide="Ex: https://iparapheur.votre-collectivite.fr">
        <input type="url" value={form.url_service} onChange={(e) => setForm((p) => ({ ...p, url_service: e.target.value }))} placeholder="https://..." />
      </Champ>
      <Champ label="Identifiant de connexion">
        <input type="text" value={form.identifiant} onChange={(e) => setForm((p) => ({ ...p, identifiant: e.target.value }))} />
      </Champ>
      <Champ label="Type de signature">
        <select value={form.type_signature} onChange={(e) => setForm((p) => ({ ...p, type_signature: e.target.value as ConfigIParapheur["type_signature"] }))}>
          <option value="simple">Simple</option>
          <option value="avancee">Avancée (RGS**)</option>
          <option value="qualifiee">Qualifiée (eIDAS)</option>
        </select>
      </Champ>
      <Champ label="Sous-type de document" aide="Identifiant du circuit de signature dans le parapheur">
        <input type="text" value={form.sous_type} onChange={(e) => setForm((p) => ({ ...p, sous_type: e.target.value }))} placeholder="arrete_municipal" />
      </Champ>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={form.envoi_auto_validation} onChange={(e) => setForm((p) => ({ ...p, envoi_auto_validation: e.target.checked }))} />
        Envoi automatique pour signature à la validation
      </label>
      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}

// -- iCal --
function ConfigICalForm({ config, onSave, enCours }: { config: ConfigICal; onSave: (c: ConfigICal) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigICal>({ ...config });
  const [copie, setCopie] = useState(false);

  const urlFlux = `${window.location.origin}/flux/ical/arretes.ics`;

  const copierUrl = () => {
    navigator.clipboard.writeText(urlFlux).catch(() => {});
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  return (
    <>
      <Champ label="URL du flux iCal" aide="Copiez cette URL dans votre application de calendrier">
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" value={urlFlux} readOnly style={{ flex: 1, background: "#F9F8F5", color: "#6B6A60", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }} />
          <button className="btn-secondary" onClick={copierUrl} style={{ fontSize: 11, padding: "5px 10px", flexShrink: 0 }}>
            {copie ? <Check size={12} color="#065F46" /> : <Copy size={12} />}
          </button>
        </div>
      </Champ>
      <Champ label="Rappel avant début (minutes)">
        <input type="number" value={form.rappel_minutes} onChange={(e) => setForm((p) => ({ ...p, rappel_minutes: parseInt(e.target.value) || 0 }))} min={0} max={10080} />
      </Champ>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>
        <input type="checkbox" checked={form.publies_uniquement} onChange={(e) => setForm((p) => ({ ...p, publies_uniquement: e.target.checked }))} />
        Arrêtés publiés uniquement
      </label>
      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}

// -- Webhooks --
function ConfigWebhooksForm({ config, onSave, enCours }: { config: ConfigWebhook; onSave: (c: ConfigWebhook) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigWebhook>({ ...config });
  const [ajout, setAjout] = useState(false);
  const [erreurs, setErreurs] = useState<ErreurValidation[]>([]);

  const supprimerEndpoint = (id: string) => {
    setForm((p) => ({ ...p, endpoints: p.endpoints.filter((e) => e.id !== id) }));
  };

  const toggleEndpoint = (id: string) => {
    setForm((p) => ({
      ...p,
      endpoints: p.endpoints.map((e) => (e.id === id ? { ...e, actif: !e.actif } : e)),
    }));
  };

  const ajouterEndpoint = (ep: WebhookEndpoint) => {
    const errs = validerWebhookEndpoint(ep);
    if (errs.length > 0) {
      setErreurs(errs);
      return;
    }
    setErreurs([]);
    setForm((p) => ({ ...p, endpoints: [...p.endpoints, ep] }));
    setAjout(false);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: "#6B6A60", margin: 0 }}>{form.endpoints.length} endpoint{form.endpoints.length > 1 ? "s" : ""} configuré{form.endpoints.length > 1 ? "s" : ""}</p>
        <button className="btn-secondary" onClick={() => setAjout(true)} style={{ fontSize: 11, padding: "5px 10px" }}>
          <Plus size={11} />Ajouter
        </button>
      </div>

      {/* Erreurs */}
      {erreurs.length > 0 && (
        <div style={{ marginBottom: 10, padding: "8px 12px", background: "#FEF2F2", borderRadius: 6 }}>
          {erreurs.map((e, i) => (
            <p key={i} style={{ fontSize: 11, color: "#DC2626", margin: "2px 0" }}>{e.message}</p>
          ))}
        </div>
      )}

      {/* Liste des endpoints */}
      {form.endpoints.map((ep) => (
        <div key={ep.id} style={{
          border: "1px solid #E4E1D6", borderRadius: 8, padding: "12px 14px", marginBottom: 8,
          opacity: ep.actif ? 1 : 0.6,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1A18" }}>{ep.nom}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => toggleEndpoint(ep.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                {ep.actif ? <ToggleRight size={18} color="#065F46" /> : <ToggleLeft size={18} color="#A6A399" />}
              </button>
              <button onClick={() => supprimerEndpoint(ep.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#DC2626" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 4px", fontFamily: "'IBM Plex Mono',monospace", wordBreak: "break-all" }}>{ep.url}</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {ep.evenements.map((ev) => (
              <span key={ev} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "#EBF0F7", color: "#1E3A5F" }}>
                {LABELS_EVENEMENTS[ev]}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Formulaire d'ajout */}
      {ajout && (
        <FormulaireEndpoint
          onSave={ajouterEndpoint}
          onCancel={() => { setAjout(false); setErreurs([]); }}
        />
      )}

      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}

function FormulaireEndpoint({ onSave, onCancel }: { onSave: (ep: WebhookEndpoint) => void; onCancel: () => void }) {
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [evenements, setEvenements] = useState<EvenementWebhook[]>([]);

  const toggleEvenement = (ev: EvenementWebhook) => {
    setEvenements((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  return (
    <div style={{ border: "1px solid #1E3A5F", borderRadius: 8, padding: 14, marginBottom: 10, background: "#F9F8F5" }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: "#1E3A5F" }}>Nouvel endpoint</h4>
      <Champ label="Nom">
        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Mon système" />
      </Champ>
      <Champ label="URL">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
      </Champ>
      <Champ label="Secret HMAC" aide="Utilisé pour signer les requêtes">
        <input type="text" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="whsec_..." />
      </Champ>
      <Champ label="Événements">
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TOUS_EVENEMENTS.map((ev) => (
            <button
              key={ev}
              onClick={() => toggleEvenement(ev)}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 12, cursor: "pointer",
                border: "1px solid #E4E1D6",
                background: evenements.includes(ev) ? "#1E3A5F" : "#FFFFFF",
                color: evenements.includes(ev) ? "#FFFFFF" : "#6B6A60",
              }}
            >
              {LABELS_EVENEMENTS[ev]}
            </button>
          ))}
        </div>
      </Champ>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button className="btn-secondary" onClick={onCancel} style={{ fontSize: 11, padding: "5px 10px" }}>Annuler</button>
        <button className="btn-primary" onClick={() => onSave({
          id: `wh-${Date.now()}`,
          nom,
          url,
          secret,
          evenements,
          headers: {},
          actif: true,
        })} style={{ fontSize: 11, padding: "5px 10px" }}>
          <Plus size={11} />Ajouter
        </button>
      </div>
    </div>
  );
}

// -- SMTP --
function ConfigSmtpForm({ config, onSave, enCours }: { config: ConfigSmtp; onSave: (c: ConfigSmtp) => void; enCours: boolean }) {
  const [form, setForm] = useState<ConfigSmtp>({ ...config });
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <Champ label="Serveur SMTP">
          <input type="text" value={form.hote} onChange={(e) => setForm((p) => ({ ...p, hote: e.target.value }))} placeholder="smtp.collectivite.fr" />
        </Champ>
        <Champ label="Port">
          <input type="number" value={form.port} onChange={(e) => setForm((p) => ({ ...p, port: parseInt(e.target.value) || 587 }))} />
        </Champ>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", marginBottom: 14 }}>
        <input type="checkbox" checked={form.tls} onChange={(e) => setForm((p) => ({ ...p, tls: e.target.checked }))} />
        Utiliser TLS (recommandé)
      </label>
      <Champ label="Identifiant d'authentification">
        <input type="text" value={form.identifiant} onChange={(e) => setForm((p) => ({ ...p, identifiant: e.target.value }))} />
      </Champ>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Champ label="Email d'expédition">
          <input type="email" value={form.email_expediteur} onChange={(e) => setForm((p) => ({ ...p, email_expediteur: e.target.value }))} placeholder="noreply@commune.fr" />
        </Champ>
        <Champ label="Nom d'affichage">
          <input type="text" value={form.nom_expediteur} onChange={(e) => setForm((p) => ({ ...p, nom_expediteur: e.target.value }))} placeholder="Actes360" />
        </Champ>
      </div>
      <BoutonSauvegarder onClick={() => onSave(form)} enCours={enCours} />
    </>
  );
}
