import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Check, Plus, X, Layers, Flag, Edit2, RefreshCw,
  FileText, MapPin, Home, Map, Scale, Shield, AlertTriangle, ChevronDown, Save,
  BookmarkPlus, BookOpen, Trash2,
} from "lucide-react";
import { useArretes } from "@/contexts/ArretesContext";
import { useReferences } from "@/contexts/ReferencesContext";
import { useToast } from "@/contexts/ToastContext";
import { useTenant } from "@/contexts/TenantContext";
import { useAudit } from "@/contexts/AuditContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { ouvrirApercuPdf } from "@/lib/pdf-client";
import { AUJOURD_HUI } from "@/config/constants";
import { TYPES_ARRETE } from "@/data/types-arrete";
import { TYPES_IMPACT } from "@/data/types-impact";
import { VOIES } from "@/data/voies";
import { getCommunes } from "@/lib/registre";
import { genNum } from "@/lib/arrete";
import ChampFormulaire from "@/components/formulaire/ChampFormulaire";
import RecurrenceSelector from "@/components/formulaire/RecurrenceSelector";
import CarteDessin from "@/components/carte/CarteDessin";
import CarteApercu from "@/components/carte/CarteApercu";
import SignaturePad from "@/components/formulaire/SignaturePad";
import PiecesJointes from "@/components/formulaire/PiecesJointes";
import { getModeles, sauvegarderModele, supprimerModele } from "@/lib/modeles";
import type { Arrete, TypeArrete, Phase, Troncon, CodeImpact, ArticlePersonnalise, Recurrence, PieceJointe, ModeleArrete } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { validerChamp } from "@/lib/validation";
import type { RegleValidation } from "@/lib/validation";
import { genererContenuJuridique, type ContexteArrete } from "@/lib/juridique-generator";

interface VoieDeclaree {
  id: number;
  nom: string;
  touteRue: boolean;
  debut: string;
  fin: string;
  impact: CodeImpact;
}

/* ---------- styles inline erreur ---------- */
const styleErreur = { fontSize: 11, color: "#DC2626", margin: "3px 0 0" } as const;
function borderErreur(hasError: boolean) {
  return hasError ? { borderColor: "#DC2626" } : {};
}

/* ---------- Règles de validation par étape ---------- */
const REGLES_TITRE: RegleValidation[] = [
  { type: "required" },
  { type: "minLength", valeur: 5 },
];

export default function NouveauArretePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { arretes, dispatch } = useArretes();
  const { references } = useReferences();
  const { tenant } = useTenant();
  const toast = useToast();
  const { logAction } = useAudit();
  const { user } = useAuth();
  const { dispatch: notifDispatch } = useNotifications();
  const COMMUNES = useMemo(() => getCommunes(), []);

  const arreteExistant = id ? arretes.find((a) => a.id === id) : null;
  const typeInitial = arreteExistant ? TYPES_ARRETE.find((t) => t.code === arreteExistant.type_code) : null;

  const [etape, setEtape] = useState(arreteExistant ? 1 : 0);
  const [typeArrete, setTypeArrete] = useState<TypeArrete | null>(typeInitial ?? null);
  const [valeurs, setValeurs] = useState<Record<string, string | boolean>>({});
  const [titreArrete, setTitreArrete] = useState(arreteExistant?.titre ?? "");
  const [communeId, setCommuneId] = useState(arreteExistant?.commune_id ?? tenant.id);
  const [phases, setPhases] = useState<Phase[]>(() => {
    if (arreteExistant) {
      return [{
        id: 1,
        label: typeInitial?.multi_phases ? "Phase 1" : "Impact principal",
        date_debut: arreteExistant.date_debut,
        date_fin: arreteExistant.date_fin,
        localisation: "",
        troncons: arreteExistant.troncons,
      }];
    }
    return [{ id: 1, label: typeInitial?.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }];
  });
  const [phaseActive, setPhaseActive] = useState(0);
  const [publie, setPublie] = useState(false);
  const [dernierArrete, setDernierArrete] = useState<{ numero: string; mode: string; titre: string } | null>(null);
  const [motifModification, setMotifModification] = useState("");
  const [voiesDeclarees, setVoiesDeclarees] = useState<VoieDeclaree[]>(() => {
    if (arreteExistant) {
      return arreteExistant.troncons.map((t, i) => ({
        id: i + 1,
        nom: t.label || t.voie_id,
        touteRue: !t.segment_debut && !t.segment_fin,
        debut: t.segment_debut ?? "",
        fin: t.segment_fin ?? "",
        impact: t.impact,
      }));
    }
    return [];
  });
  const isMobile = useMediaQuery("(max-width: 768px)");
  const nextIdx = useMemo(() => arretes.length + 150, [arretes.length]);
  const phaseIdCounter = useRef(1);

  /* ---- Contenu juridique (arrêté complexe) ---- */
  const [sectionJuridiqueOuverte, setSectionJuridiqueOuverte] = useState(
    () => !!(arreteExistant?.considerants?.length || arreteExistant?.derogations?.length || arreteExistant?.clause_fourriere || arreteExistant?.clause_recours || arreteExistant?.articles_personnalises?.length),
  );
  const [considerants, setConsiderants] = useState<string[]>(
    () => arreteExistant?.considerants ?? [],
  );
  const [derogations, setDerogations] = useState<string[]>(
    () => arreteExistant?.derogations ?? [],
  );
  const [articlesPerso, setArticlesPerso] = useState<ArticlePersonnalise[]>(
    () => arreteExistant?.articles_personnalises ?? [],
  );
  const [clauseFourriere, setClauseFourriere] = useState(
    () => arreteExistant?.clause_fourriere ?? false,
  );
  const [clauseRecours, setClauseRecours] = useState(
    () => arreteExistant?.clause_recours ?? false,
  );
  const [perimetre, setPerimetre] = useState(
    () => arreteExistant?.perimetre ?? "",
  );
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(
    () => arreteExistant?.recurrence,
  );
  const [signature, setSignature] = useState<string | undefined>(
    () => arreteExistant?.signature,
  );
  const [piecesJointes, setPiecesJointes] = useState<PieceJointe[]>(
    () => arreteExistant?.pieces_jointes ?? [],
  );
  const [modeles, setModeles] = useState<ModeleArrete[]>(() => getModeles());
  const [showModeles, setShowModeles] = useState(false);

  /* ---- Guard "modifications non sauvegardees" ---- */
  const [sauvegarde, setSauvegarde] = useState(false);
  const formulaireDirty = useMemo(() => {
    if (publie || sauvegarde) return false;
    if (etape === 0) return false; // pas encore de saisie
    return (
      titreArrete.length > 0 ||
      voiesDeclarees.length > 0 ||
      phases.some((ph) => ph.troncons.length > 0) ||
      considerants.length > 0 ||
      Object.keys(valeurs).some((k) => (valeurs[k] as string)?.length > 0)
    );
  }, [titreArrete, voiesDeclarees, phases, considerants, valeurs, publie, sauvegarde, etape]);

  // Bloquer la fermeture de l'onglet / actualisation
  useEffect(() => {
    if (!formulaireDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [formulaireDirty]);

  // Bloquer le bouton retour du navigateur
  const formulaireDirtyRef = useRef(false);
  formulaireDirtyRef.current = formulaireDirty;
  useEffect(() => {
    if (!formulaireDirty) return;
    // Empiler un état pour pouvoir intercepter le popstate
    window.history.pushState(null, "", window.location.href);
    const handler = (e: PopStateEvent) => {
      if (formulaireDirtyRef.current) {
        e.preventDefault();
        // Remettre l'état pour re-intercepter
        window.history.pushState(null, "", window.location.href);
        setShowQuitterModale(true);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [formulaireDirty]);

  // Navigation sécurisée qui vérifie les modifications
  const [showQuitterModale, setShowQuitterModale] = useState(false);
  const [destinationQuitter, setDestinationQuitter] = useState<string | null>(null);
  const naviguerAvecGarde = useCallback((dest: string) => {
    if (formulaireDirtyRef.current) {
      setDestinationQuitter(dest);
      setShowQuitterModale(true);
    } else {
      navigate(dest);
    }
  }, [navigate]);

  /* ---- Validation state ---- */
  const [touchedEtape1, setTouchedEtape1] = useState<Record<string, boolean>>({});
  const [touchedPhases, setTouchedPhases] = useState<Record<string, boolean>>({});

  const touchField = useCallback((champ: string) => {
    setTouchedEtape1((prev) => ({ ...prev, [champ]: true }));
  }, []);

  const touchPhaseField = useCallback((phaseIdx: number, champ: string) => {
    setTouchedPhases((prev) => ({ ...prev, [`${phaseIdx}_${champ}`]: true }));
  }, []);

  /* ---- Erreurs Étape 1 ---- */
  const erreurTitre = useMemo(() => validerChamp(titreArrete, REGLES_TITRE), [titreArrete]);

  const champsTypeRequis = useMemo(() => {
    if (!typeArrete) return [] as string[];
    return typeArrete.champs
      .filter((c) => c.type !== "bool" && c.type !== "adresse")
      .map((c) => c.id);
  }, [typeArrete]);

  const erreursChamps = useMemo(() => {
    const errs: Record<string, string | undefined> = {};
    for (const cid of champsTypeRequis) {
      const v = (valeurs[cid] as string) ?? "";
      const res = validerChamp(v, [{ type: "required" }]);
      errs[cid] = res.valide ? undefined : res.erreur;
    }
    return errs;
  }, [valeurs, champsTypeRequis]);

  const etape1Valide = useMemo(() => {
    if (!erreurTitre.valide) return false;
    for (const cid of champsTypeRequis) {
      if (erreursChamps[cid]) return false;
    }
    return true;
  }, [erreurTitre, erreursChamps, champsTypeRequis]);

  /* ---- Erreurs Étape 2 (phases) ---- */
  const erreursPhases = useMemo(() => {
    return phases.map((ph) => {
      const errs: Record<string, string | undefined> = {};
      if (typeArrete?.multi_phases) {
        const dDebut = validerChamp(ph.date_debut, [{ type: "required" }, { type: "dateValide" }]);
        errs["date_debut"] = dDebut.valide ? undefined : dDebut.erreur;

        const dFin = validerChamp(
          ph.date_fin,
          [{ type: "required" }, { type: "dateValide" }, { type: "dateApres", autreChamp: "date_debut" }],
          { date_debut: ph.date_debut, date_fin: ph.date_fin },
        );
        errs["date_fin"] = dFin.valide ? undefined : dFin.erreur;
      }
      if (ph.troncons.length === 0) {
        errs["troncons"] = "Au moins un troncon requis";
      }
      return errs;
    });
  }, [phases, typeArrete]);

  const etape2Valide = useMemo(() => {
    return erreursPhases.every((errs) =>
      Object.values(errs).every((e) => !e),
    );
  }, [erreursPhases]);

  const phaseActuelle = phases[phaseActive] || { troncons: [] as Troncon[] };
  const totalTroncons = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.voie_id)))].length;

  function allerFormulaire(t: TypeArrete) {
    setTypeArrete(t);
    setValeurs({});
    setTitreArrete("");
    setCommuneId(tenant.id);
    phaseIdCounter.current = 1;
    setPhases([{ id: 1, label: t.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(0);
    setTouchedEtape1({});
    setTouchedPhases({});
    setVoiesDeclarees([]);
    setMotifModification("");
    // Pour le type "Autre", ouvrir la section juridique avec un premier article pré-ajouté
    if (t.code === "autre") {
      setSectionJuridiqueOuverte(true);
      setConsiderants([]);
      setDerogations([]);
      setArticlesPerso([
        { id: `art_${Date.now()}`, titre: "", contenu: "" },
      ]);
      setClauseFourriere(false);
      setClauseRecours(true);
      setPerimetre("");
    } else {
      setSectionJuridiqueOuverte(false);
      setConsiderants([]);
      setDerogations([]);
      setArticlesPerso([]);
      setClauseFourriere(false);
      setClauseRecours(false);
      setPerimetre("");
    }
    setRecurrence(undefined);
    setSignature(undefined);
    setPiecesJointes([]);
    setEtape(1);
  }

  function allerDepuisModele(modele: ModeleArrete) {
    const t = TYPES_ARRETE.find((ta) => ta.code === modele.type_code);
    if (!t) return;
    setTypeArrete(t);
    setValeurs(modele.valeurs ?? {});
    setTitreArrete("");
    setCommuneId(tenant.id);
    phaseIdCounter.current = 1;
    setPhases([{ id: 1, label: t.multi_phases ? "Phase 1" : "Impact principal", date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(0);
    setTouchedEtape1({});
    setTouchedPhases({});
    setVoiesDeclarees(modele.voiesDeclarees?.map((v, i) => ({ id: i + 1, nom: v.nom, touteRue: v.touteRue, debut: v.debut, fin: v.fin, impact: v.impact })) ?? []);
    setMotifModification("");
    setConsiderants(modele.considerants ?? []);
    setDerogations(modele.derogations ?? []);
    setArticlesPerso([]);
    setClauseFourriere(modele.clause_fourriere ?? false);
    setClauseRecours(modele.clause_recours ?? false);
    setPerimetre("");
    setSectionJuridiqueOuverte(!!(modele.considerants?.length || modele.derogations?.length));
    setRecurrence(modele.recurrence);
    setSignature(undefined);
    setPiecesJointes([]);
    setShowModeles(false);
    setEtape(1);
    toast.success(`Modele "${modele.nom}" charge`);
  }

  function sauvegarderCommeModele() {
    if (!typeArrete) return;
    const modele: ModeleArrete = {
      id: `mod_${Date.now()}`,
      nom: titreArrete || typeArrete.label,
      type_code: typeArrete.code,
      type_label: typeArrete.label,
      valeurs,
      voiesDeclarees: voiesDeclarees.map((v) => ({ nom: v.nom, touteRue: v.touteRue, debut: v.debut, fin: v.fin, impact: v.impact })),
      considerants: considerants.filter((c) => c.trim().length > 0),
      derogations: derogations.filter((d) => d.trim().length > 0),
      clause_fourriere: clauseFourriere,
      clause_recours: clauseRecours,
      recurrence,
      date_creation: new Date().toISOString(),
    };
    sauvegarderModele(modele);
    setModeles(getModeles());
    toast.success("Modele sauvegarde");
  }

  function allerCarte() {
    // Pour les types non-multi-phases, copier les dates des champs vers la phase
    if (typeArrete && !typeArrete.multi_phases) {
      const dateDebut = (valeurs["date_debut"] as string) ?? "";
      const dateFin = (valeurs["date_fin"] as string) ?? "";
      if (dateDebut || dateFin) {
        setPhases((prev) => prev.map((ph, i) =>
          i === 0 ? { ...ph, date_debut: dateDebut || ph.date_debut, date_fin: dateFin || ph.date_fin } : ph,
        ));
      }
    }
    setEtape(2);
  }

  function tentativeAllerCarte() {
    // Marquer tous les champs comme touched
    setTouchedEtape1((prev) => {
      const next: Record<string, boolean> = { ...prev, titre: true };
      for (const cid of champsTypeRequis) {
        next[cid] = true;
      }
      return next;
    });
    if (!etape1Valide) {
      const manquants: string[] = [];
      if (!erreurTitre.valide) manquants.push("Titre");
      for (const cid of champsTypeRequis) {
        if (erreursChamps[cid]) {
          const champ = typeArrete?.champs.find((c) => c.id === cid);
          manquants.push(champ?.label ?? cid);
        }
      }
      toast.warning(`Champs manquants : ${manquants.join(", ")}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    allerCarte();
  }

  function tentativeAllerRecap() {
    // Marquer les champs des phases comme touched
    setTouchedPhases((prev) => {
      const next = { ...prev };
      phases.forEach((_, i) => {
        next[`${i}_date_debut`] = true;
        next[`${i}_date_fin`] = true;
        next[`${i}_troncons`] = true;
      });
      return next;
    });
    if (!etape2Valide) {
      toast.warning("Veuillez corriger les erreurs avant de continuer");
      return;
    }
    setEtape(3);
  }

  function ajouterPhase() {
    phaseIdCounter.current += 1;
    const newId = phaseIdCounter.current;
    setPhases((prev) => [...prev, { id: newId, label: `Phase ${prev.length + 1}`, date_debut: "", date_fin: "", localisation: "", troncons: [] }]);
    setPhaseActive(phases.length);
  }

  function supprimerPhase(i: number) {
    if (phases.length === 1) return;
    setPhases((prev) => prev.filter((_, idx) => idx !== i));
    setPhaseActive(Math.max(0, phaseActive - 1));
  }

  function updatePhase(i: number, f: string, v: string) {
    setPhases((prev) => prev.map((ph, idx) => idx === i ? { ...ph, [f]: v } : ph));
  }

  function enregistrerBrouillon() {
    const num = genNum(typeArrete!.suffixe, nextIdx);
    const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.label || VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
    const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
    const communeChoisie = COMMUNES.find((c) => c.id === communeId);
    const donneesJuridiques = {
      considerants: considerants.filter((c) => c.trim().length > 0),
      derogations: derogations.filter((d) => d.trim().length > 0),
      articles_personnalises: articlesPerso.filter((a) => a.titre.trim().length > 0 || a.contenu.trim().length > 0),
      clause_fourriere: clauseFourriere,
      clause_recours: clauseRecours,
      perimetre: perimetre.trim() || undefined,
    };
    const nomAuteur = user?.nom ?? "Agent";

    if (arreteExistant) {
      dispatch({ type: "UPDATE", id: arreteExistant.id, updates: { titre: titreArrete || arreteExistant.titre, statut: "brouillon", voies: tv, troncons: tronconsFlatMap, commune: communeChoisie?.nom ?? "", commune_id: communeId, recurrence, signature, pieces_jointes: piecesJointes.length > 0 ? piecesJointes : undefined, ...donneesJuridiques } });
      logAction("modification", "arrete", arreteExistant.id, `Sauvegarde brouillon — ${arreteExistant.numero}`, { statut: "brouillon" });
    } else {
      const arreteId = `a${Date.now()}`;
      const nouvel: Arrete = { id: arreteId, numero: num, type_code: typeArrete!.code, type_label: typeArrete!.label, titre: titreArrete || typeArrete!.label, statut: "brouillon", cree_par: nomAuteur, date_creation: AUJOURD_HUI.toISOString().split("T")[0]!, date_debut: phases[0]?.date_debut || "", date_fin: phases[phases.length - 1]?.date_fin || "", commune: communeChoisie?.nom ?? "", commune_id: communeId, voies: tv, troncons: tronconsFlatMap, versions: [], arrete_abrogation: null, recurrence, signature, pieces_jointes: piecesJointes.length > 0 ? piecesJointes : undefined, ...donneesJuridiques };
      dispatch({ type: "ADD", arrete: nouvel });
      logAction("creation", "arrete", arreteId, `Brouillon créé — ${num} — ${titreArrete || typeArrete!.label}`, { statut: "brouillon" });
    }
    setSauvegarde(true);
    toast.success("Brouillon enregistre");
    navigate("/");
  }

  function publierArrete() {
    const num = genNum(typeArrete!.suffixe, nextIdx);
    const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.label || VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
    const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
    const communeChoisie = COMMUNES.find((c) => c.id === communeId);
    // Champs juridiques (arrêté complexe)
    const donneesJuridiques = {
      considerants: considerants.filter((c) => c.trim().length > 0),
      derogations: derogations.filter((d) => d.trim().length > 0),
      articles_personnalises: articlesPerso.filter((a) => a.titre.trim().length > 0 || a.contenu.trim().length > 0),
      clause_fourriere: clauseFourriere,
      clause_recours: clauseRecours,
      perimetre: perimetre.trim() || undefined,
    };

    const nomAuteur = user?.nom ?? "Agent";
    if (arreteExistant) {
      const h = { version: (arreteExistant.versions.length) + 1, date: AUJOURD_HUI.toISOString().split("T")[0]!, auteur: nomAuteur, motif: motifModification || "Modification", titre: arreteExistant.titre };
      dispatch({ type: "UPDATE", id: arreteExistant.id, updates: { titre: titreArrete || arreteExistant.titre, statut: "modifie", voies: tv, troncons: tronconsFlatMap, versions: [h, ...arreteExistant.versions], commune: communeChoisie?.nom ?? "", commune_id: communeId, recurrence, signature, pieces_jointes: piecesJointes.length > 0 ? piecesJointes : undefined, ...donneesJuridiques } });
      setDernierArrete({ numero: arreteExistant.numero, mode: "modifie", titre: titreArrete });
      logAction("modification", "arrete", arreteExistant.id, `Modification de l'arrêté ${arreteExistant.numero} — ${titreArrete || arreteExistant.titre}`, { motif: motifModification || "Modification" });
    } else {
      const arreteId = `a${Date.now()}`;
      const nouvel: Arrete = { id: arreteId, numero: num, type_code: typeArrete!.code, type_label: typeArrete!.label, titre: titreArrete || typeArrete!.label, statut: "publie", cree_par: nomAuteur, date_creation: AUJOURD_HUI.toISOString().split("T")[0]!, date_debut: phases[0]?.date_debut || "", date_fin: phases[phases.length - 1]?.date_fin || "", commune: communeChoisie?.nom ?? "", commune_id: communeId, voies: tv, troncons: tronconsFlatMap, versions: [], arrete_abrogation: null, recurrence, signature, pieces_jointes: piecesJointes.length > 0 ? piecesJointes : undefined, ...donneesJuridiques };
      dispatch({ type: "ADD", arrete: nouvel });
      setDernierArrete({ numero: num, mode: "cree", titre: titreArrete || typeArrete!.label });
      logAction("creation", "arrete", arreteId, `Création de l'arrêté ${num} — ${titreArrete || typeArrete!.label}`);
    }
    // Notification workflow
    const titreNotif = arreteExistant
      ? `Arrete modifie — ${arreteExistant.numero}`
      : `Nouvel arrete publie — ${num}`;
    notifDispatch({
      type: "ADD",
      notification: {
        id: `wf-pub-${Date.now()}`,
        type: "workflow",
        priorite: "haute",
        titre: titreNotif,
        message: arreteExistant
          ? `L'arrete "${titreArrete || arreteExistant.titre}" a ete modifie par ${nomAuteur}.`
          : `L'arrete "${titreArrete || typeArrete!.label}" a ete publie par ${nomAuteur}.`,
        date: new Date().toISOString(),
        lue: false,
        lien: "/actifs",
      },
    });

    setPublie(true);
    setSauvegarde(true);
    toast.success("Arrete publie avec succes");
  }

  return (
    <div style={{ paddingTop: 28, maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 16px 48px" : "28px 24px 48px" }}>
      {/* Modale de confirmation — modifications non sauvegardees */}
      {showQuitterModale && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "24px 28px", maxWidth: 400, width: "90%", boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={18} color="#D97706" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Modifications non sauvegardees</h3>
            </div>
            <p style={{ fontSize: 13, color: "#6B6A60", margin: "0 0 20px", lineHeight: 1.5 }}>
              Vous avez des modifications en cours. Souhaitez-vous quitter sans enregistrer ?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                className="btn-ghost"
                onClick={() => setShowQuitterModale(false)}
                style={{ fontSize: 12 }}
              >
                Continuer l'edition
              </button>
              <button
                onClick={() => { setSauvegarde(true); setShowQuitterModale(false); if (destinationQuitter) navigate(destinationQuitter); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: "#B91C1C", color: "#FAFAF7", fontFamily: "'IBM Plex Sans',sans-serif" }}
              >
                Quitter sans sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
      {!publie && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => naviguerAvecGarde("/")} className="btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }}><ChevronLeft size={12} />Accueil</button>
            <div style={{ width: 1, height: 12, background: "#D8D5C8" }} />
            {(arreteExistant ? ["Renseignements", "Voies", "Récapitulatif"] : ["Type", "Renseignements", "Voies", "Récapitulatif"]).map((lb, i) => {
              const ep = arreteExistant ? i + 1 : i;
              return (
                <div key={lb} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: isMobile ? "3px 7px" : "4px 10px", borderRadius: 20, border: `1px solid ${ep === etape ? "#1E3A5F" : "#E4E1D6"}`, background: ep === etape ? "#1E3A5F" : ep < etape ? "#EDEAE0" : "transparent", color: ep === etape ? "#FAFAF7" : ep < etape ? "#1C1F1B" : "#A6A399", fontSize: isMobile ? 10 : 11 }}>
                    {ep < etape ? <Check size={11} /> : <span className="fm" style={{ fontSize: 9 }}>{i + 1}</span>}
                    <span>{lb}</span>
                  </div>
                  {i < (arreteExistant ? 2 : 3) && <div style={{ width: 10, height: 1, background: "#D8D5C8" }} />}
                </div>
              );
            })}
          </div>
          {arreteExistant && <div style={{ background: "#EBF0F7", border: "1px solid #BFCFDF", borderRadius: 7, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#1E3A5F" }}><Edit2 size={13} /><strong>Modification de {arreteExistant.numero}</strong></div>}
        </>
      )}

      {/* Etape 0 : choix du type */}
      {etape === 0 && !arreteExistant && (
        <div>
          <h2 className="fd" style={{ fontSize: 22, marginBottom: 14 }}>Type d'arrete</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 9 }}>
            {TYPES_ARRETE.map((t) => (
              <button key={t.code} onClick={() => allerFormulaire(t)} className="card-hover" style={{
                textAlign: "left", padding: 13, borderRadius: 7, cursor: "pointer",
                border: t.code === "autre" ? "1.5px dashed #A6A399" : "1px solid #E4E1D6",
                background: t.code === "autre" ? "#FAFAF7" : "#FFFFFF",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  <span className="fm" style={{ fontSize: 9, background: t.code === "autre" ? "#1E3A5F" : "#EDEAE0", color: t.code === "autre" ? "#FAFAF7" : "#6B6A60", padding: "2px 5px", borderRadius: 3 }}>{t.suffixe}</span>
                  {t.multi_phases && <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "2px 5px", borderRadius: 3, display: "flex", alignItems: "center", gap: 2 }}><Layers size={8} />Phase</span>}
                  {t.code === "autre" && <span style={{ fontSize: 9, background: "#DBEAFE", color: "#1E3A5F", padding: "2px 5px", borderRadius: 3 }}>Libre</span>}
                </div>
                <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 2px" }}>{t.label}</p>
                <p style={{ fontSize: 11, color: "#6B6A60", margin: 0 }}>{t.description}</p>
              </button>
            ))}
          </div>

          {/* ─── Modèles sauvegardés ─── */}
          {modeles.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <button
                onClick={() => setShowModeles((s) => !s)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                  cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", padding: 0, marginBottom: 8,
                }}
              >
                <BookOpen size={13} color="#1E3A5F" />
                <span style={{ fontWeight: 600, fontSize: 13, color: "#1C1F1B" }}>Mes modeles</span>
                <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{modeles.length}</span>
                <ChevronDown size={13} color="#6B6A60" style={{ transform: showModeles ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
              </button>
              {showModeles && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 }}>
                  {modeles.map((m) => (
                    <div key={m.id} style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: 12, background: "#FAFAF7", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 12, margin: 0 }}>{m.nom}</p>
                          <p style={{ fontSize: 10, color: "#6B6A60", margin: "2px 0 0" }}>{m.type_label}</p>
                        </div>
                        <button
                          onClick={() => {
                            supprimerModele(m.id);
                            setModeles(getModeles());
                            toast.success("Modele supprime");
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(m.voiesDeclarees?.length ?? 0) > 0 && (
                          <span style={{ fontSize: 9, background: "#EDEAE0", color: "#6B6A60", padding: "1px 5px", borderRadius: 6 }}>
                            {m.voiesDeclarees!.length} voie{m.voiesDeclarees!.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {(m.considerants?.length ?? 0) > 0 && (
                          <span style={{ fontSize: 9, background: "#EDE9FE", color: "#7C3AED", padding: "1px 5px", borderRadius: 6 }}>
                            {m.considerants!.length} considerant{m.considerants!.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => allerDepuisModele(m)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          fontSize: 11, padding: "5px 10px", borderRadius: 5, border: "1px solid #1E3A5F",
                          background: "#FFFFFF", color: "#1E3A5F", fontWeight: 600, cursor: "pointer",
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      >
                        <BookOpen size={10} /> Utiliser
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Etape 1 : formulaire + aperçu carte */}
      {etape === 1 && typeArrete && !publie && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : 20, alignItems: "start" }}>
        <div>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 14 }}>{arreteExistant ? "Modifier" : "Renseignements"}</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Titre <span style={{ color: "#B91C1C" }}>*</span></label>
            <input
              type="text"
              placeholder="Ex. Refection de chaussee --- Rue de la Republique"
              value={titreArrete}
              onChange={(e) => setTitreArrete(e.target.value)}
              onBlur={() => touchField("titre")}
              style={borderErreur(!!(touchedEtape1["titre"] && !erreurTitre.valide))}
            />
            {touchedEtape1["titre"] && !erreurTitre.valide && (
              <p style={styleErreur}>{erreurTitre.erreur}</p>
            )}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Commune <span style={{ color: "#B91C1C" }}>*</span></label>
            <select
              value={communeId}
              onChange={(e) => setCommuneId(e.target.value)}
              style={{ width: "100%", fontSize: 12, padding: "7px 10px", borderRadius: 5, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif", background: "#FFFFFF" }}
            >
              {COMMUNES.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          {arreteExistant && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Motif de la modification <span style={{ color: "#B91C1C" }}>*</span></label>
              <textarea rows={2} value={motifModification} onChange={(e) => setMotifModification(e.target.value)} style={{ resize: "vertical" }} />
            </div>
          )}
          {/* Voies impactees */}
          <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
              <p style={{ fontWeight: 600, fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <Map size={12} /> Voies impactees
              </p>
              <button
                onClick={() => {
                  const impactDefaut: CodeImpact = typeArrete?.code === "stationnement_interdit" || typeArrete?.code === "demenagement"
                    ? "stationnement_interdit"
                    : typeArrete?.code === "occupation_dp" || typeArrete?.code === "marche"
                    ? "zone_reservee"
                    : typeArrete?.code === "alternat"
                    ? "deviation"
                    : typeArrete?.code === "pietonnisation" || typeArrete?.code === "zone_30"
                    ? "zone_reservee"
                    : typeArrete?.code === "peril"
                    ? "circulation_interdite"
                    : "circulation_interdite";
                  setVoiesDeclarees((prev) => [...prev, { id: Date.now(), nom: "", touteRue: true, debut: "", fin: "", impact: impactDefaut }]);
                }}
                style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}
              >
                <Plus size={11} /> Ajouter une voie
              </button>
            </div>
            {voiesDeclarees.length === 0 && (
              <p style={{ fontSize: 11, color: "#A6A399", textAlign: "center", padding: "12px 0", margin: 0 }}>
                Aucune voie declaree. Ajoutez les rues impactees par cet arrete.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {voiesDeclarees.map((v, i) => (
                <div key={v.id} style={{ background: "#FAFAF7", border: "1px solid #E4E1D6", borderRadius: 6, padding: "8px 10px", borderLeft: `3px solid ${TYPES_IMPACT.find((ti) => ti.code === v.impact)?.couleur ?? "#6B6A60"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#1C1F1B" }}>Voie {i + 1}</span>
                    <button onClick={() => setVoiesDeclarees((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}><X size={11} /></button>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <input
                      type="text"
                      placeholder="Nom de la rue (ex. Rue de la Republique)"
                      value={v.nom}
                      onChange={(e) => setVoiesDeclarees((prev) => prev.map((vd, j) => j === i ? { ...vd, nom: e.target.value } : vd))}
                      style={{ width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={v.touteRue}
                        onChange={(e) => setVoiesDeclarees((prev) => prev.map((vd, j) => j === i ? { ...vd, touteRue: e.target.checked, debut: "", fin: "" } : vd))}
                        style={{ width: 14, height: 14 }}
                      />
                      Toute la rue
                    </label>
                    {!v.touteRue && (
                      <>
                        <input
                          type="text"
                          placeholder="Du n°"
                          value={v.debut}
                          onChange={(e) => setVoiesDeclarees((prev) => prev.map((vd, j) => j === i ? { ...vd, debut: e.target.value } : vd))}
                          style={{ width: 70, fontSize: 11, padding: "4px 6px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                        />
                        <span style={{ fontSize: 11, color: "#6B6A60" }}>au</span>
                        <input
                          type="text"
                          placeholder="Au n°"
                          value={v.fin}
                          onChange={(e) => setVoiesDeclarees((prev) => prev.map((vd, j) => j === i ? { ...vd, fin: e.target.value } : vd))}
                          style={{ width: 70, fontSize: 11, padding: "4px 6px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                        />
                      </>
                    )}
                  </div>
                  <select
                    value={v.impact}
                    onChange={(e) => setVoiesDeclarees((prev) => prev.map((vd, j) => j === i ? { ...vd, impact: e.target.value as CodeImpact } : vd))}
                    style={{ width: "100%", fontSize: 11, padding: "4px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                  >
                    {TYPES_IMPACT.map((ti) => (
                      <option key={ti.code} value={ti.code}>{ti.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {typeArrete.multi_phases && <div style={{ background: "#EDE9FE", borderRadius: 5, padding: "8px 12px", marginBottom: 10, display: "flex", gap: 7, alignItems: "flex-start" }}><Layers size={12} color="#7C3AED" style={{ marginTop: 1, flexShrink: 0 }} /><p style={{ fontSize: 11, color: "#5B21B6", margin: 0 }}><strong>Phase :</strong> {typeArrete.aide_phases}</p></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 16 }}>
            {typeArrete.champs.filter((c) => c.type !== "adresse" && (typeArrete.multi_phases ? c.type !== "datetime" : true)).map((c) => (
              <div key={c.id}>
                <ChampFormulaire
                  champ={c}
                  valeur={valeurs[c.id]}
                  onChange={(v) => setValeurs((p) => ({ ...p, [c.id]: v }))}
                />
                {touchedEtape1[c.id] && erreursChamps[c.id] && c.type !== "bool" && (
                  <p style={styleErreur}>{erreursChamps[c.id]}</p>
                )}
              </div>
            ))}
          </div>
          {typeArrete.multi_phases && (
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <p style={{ fontWeight: 600, fontSize: 12, margin: 0, display: "flex", alignItems: "center", gap: 4 }}><Flag size={12} />Phases</p>
                <button onClick={ajouterPhase} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}><Plus size={11} />Ajouter</button>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
                {phases.map((ph, i) => (
                  <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <button onClick={() => setPhaseActive(i)} className={`phase-tab${phaseActive === i ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{ph.label}</button>
                    {phases.length > 1 && <button onClick={() => supprimerPhase(i)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}><X size={10} /></button>}
                  </div>
                ))}
              </div>
              {phases.map((ph, i) => phaseActive === i && (
                <div key={ph.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 7 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Debut</label>
                      <input
                        type="datetime-local"
                        value={ph.date_debut}
                        onChange={(e) => updatePhase(i, "date_debut", e.target.value)}
                        onBlur={() => touchPhaseField(i, "date_debut")}
                        style={borderErreur(!!(touchedPhases[`${i}_date_debut`] && erreursPhases[i]?.["date_debut"]))}
                      />
                      {touchedPhases[`${i}_date_debut`] && erreursPhases[i]?.["date_debut"] && (
                        <p style={styleErreur}>{erreursPhases[i]?.["date_debut"]}</p>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Fin</label>
                      <input
                        type="datetime-local"
                        value={ph.date_fin}
                        onChange={(e) => updatePhase(i, "date_fin", e.target.value)}
                        onBlur={() => touchPhaseField(i, "date_fin")}
                        style={borderErreur(!!(touchedPhases[`${i}_date_fin`] && erreursPhases[i]?.["date_fin"]))}
                      />
                      {touchedPhases[`${i}_date_fin`] && erreursPhases[i]?.["date_fin"] && (
                        <p style={styleErreur}>{erreursPhases[i]?.["date_fin"]}</p>
                      )}
                    </div>
                  </div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Voies</label><input type="text" placeholder="Ex. Rue de la Paix..." value={ph.localisation} onChange={(e) => updatePhase(i, "localisation", e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, fontWeight: 500, display: "block", marginBottom: 3 }}>Libelle</label><input type="text" placeholder={`Phase ${i + 1}`} value={ph.label} onChange={(e) => updatePhase(i, "label", e.target.value)} /></div>
                </div>
              ))}
            </div>
          )}
          {/* ─── Récurrence (arrêté permanent) ─── */}
          <RecurrenceSelector value={recurrence} onChange={setRecurrence} />

          {/* ─── Section contenu juridique (arrêté complexe) ─── */}
          <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, marginBottom: 14, overflow: "hidden" }}>
            {/* Barre titre + bouton générer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: sectionJuridiqueOuverte ? "#F7F6F2" : "#FFFFFF",
              borderBottom: sectionJuridiqueOuverte ? "1px solid #E4E1D6" : "none",
            }}>
              <button
                onClick={() => setSectionJuridiqueOuverte((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, flex: 1,
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', sans-serif", padding: 0,
                }}
              >
                <Scale size={13} color="#7C3AED" />
                <span style={{ fontWeight: 600, fontSize: 12, color: "#1C1F1B" }}>Contenu juridique</span>
                {!sectionJuridiqueOuverte && considerants.length === 0 && (
                  <span style={{ fontSize: 10, color: "#A6A399", fontWeight: 400 }}>
                    — remplissage automatique
                  </span>
                )}
                {!sectionJuridiqueOuverte && considerants.length > 0 && (
                  <span style={{ fontSize: 10, background: "#EDE9FE", color: "#7C3AED", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>
                    ✓ {considerants.length} considérant{considerants.length > 1 ? "s" : ""} · {derogations.length} dérogation{derogations.length > 1 ? "s" : ""}
                  </span>
                )}
                <ChevronDown size={13} color="#6B6A60" style={{ transform: sectionJuridiqueOuverte ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: "auto" }} />
              </button>
              {/* Bouton de génération */}
              <button
                onClick={() => {
                  const ctx: ContexteArrete = {
                    type_code: typeArrete!.code,
                    type_label: typeArrete!.label,
                    titre: titreArrete,
                    voies: voiesDeclarees.map((v) => v.nom).filter((n) => n.length > 0),
                    impacts: [...new Set(voiesDeclarees.map((v) => v.impact))],
                    valeurs,
                  };
                  const contenu = genererContenuJuridique(ctx);
                  setConsiderants(contenu.considerants);
                  setDerogations(contenu.derogations);
                  setArticlesPerso(contenu.articles_personnalises);
                  setClauseFourriere(contenu.clause_fourriere);
                  setClauseRecours(contenu.clause_recours);
                  setPerimetre(contenu.perimetre);
                  setSectionJuridiqueOuverte(true);
                  toast.success("Contenu juridique genere — verifiez et ajustez si besoin");
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                  color: "#FFFFFF", border: "none", cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  boxShadow: "0 1px 3px rgba(124,58,237,0.3)",
                  whiteSpace: "nowrap", flexShrink: 0, marginLeft: 8,
                }}
              >
                ✨ Generer
              </button>
            </div>

            {sectionJuridiqueOuverte && (
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Considérants */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <FileText size={11} color="#1E3A5F" /> Considerants
                    </label>
                    <button
                      onClick={() => setConsiderants((prev) => [...prev, ""])}
                      style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}
                    >
                      <Plus size={11} /> Ajouter
                    </button>
                  </div>
                  {considerants.length === 0 && (
                    <p style={{ fontSize: 11, color: "#A6A399", textAlign: "center", padding: "6px 0", margin: 0, fontStyle: "italic" }}>
                      Cliquez sur ✨ Generer pour pre-remplir les considerants.
                    </p>
                  )}
                  {considerants.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 9, color: "#7C3AED", fontWeight: 600, marginTop: 7, flexShrink: 0, letterSpacing: "0.02em" }}>CONSIDÉRANT</span>
                      <textarea
                        rows={2}
                        value={c}
                        onChange={(e) => setConsiderants((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                        placeholder="qu'en raison de l'organisation de..."
                        style={{ flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif", resize: "vertical" }}
                      />
                      <button onClick={() => setConsiderants((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399", marginTop: 5 }}><X size={11} /></button>
                    </div>
                  ))}
                </div>

                {/* Dérogations */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <Shield size={11} color="#2F6B4F" /> Derogations
                    </label>
                    <button
                      onClick={() => setDerogations((prev) => [...prev, ""])}
                      style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}
                    >
                      <Plus size={11} /> Ajouter
                    </button>
                  </div>
                  {derogations.length === 0 && (
                    <p style={{ fontSize: 11, color: "#A6A399", textAlign: "center", padding: "6px 0", margin: 0, fontStyle: "italic" }}>
                      Cliquez sur ✨ Generer pour pre-remplir les derogations adaptees.
                    </p>
                  )}
                  {derogations.map((d, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#2F6B4F", fontWeight: 600, flexShrink: 0 }}>•</span>
                      <input
                        type="text"
                        value={d}
                        onChange={(e) => setDerogations((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                        placeholder="Véhicules de secours..."
                        style={{ flex: 1, fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif" }}
                      />
                      <button onClick={() => setDerogations((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}><X size={11} /></button>
                    </div>
                  ))}
                </div>

                {/* Périmètre */}
                {perimetre.length > 0 && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <MapPin size={11} color="#0369A1" /> Perimetre
                    </label>
                    <textarea
                      rows={2}
                      value={perimetre}
                      onChange={(e) => setPerimetre(e.target.value)}
                      placeholder="La zone réglementée concerne..."
                      style={{ width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif", resize: "vertical" }}
                    />
                  </div>
                )}

                {/* Articles personnalisés */}
                {articlesPerso.length > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <FileText size={11} color="#D9730D" /> Articles supplementaires
                      </label>
                      <button
                        onClick={() => setArticlesPerso((prev) => [...prev, { id: `art_${Date.now()}`, titre: "", contenu: "" }])}
                        style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#1E3A5F", fontWeight: 600 }}
                      >
                        <Plus size={11} /> Ajouter
                      </button>
                    </div>
                    {articlesPerso.map((art, i) => (
                      <div key={art.id} style={{ background: "#FAFAF7", border: "1px solid #E4E1D6", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#D9730D" }}>ARTICLE</span>
                          <button onClick={() => setArticlesPerso((prev) => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}><X size={11} /></button>
                        </div>
                        <input
                          type="text"
                          value={art.titre}
                          onChange={(e) => setArticlesPerso((prev) => prev.map((a, j) => j === i ? { ...a, titre: e.target.value } : a))}
                          placeholder="Titre (ex. Responsabilité de l'organisateur)"
                          style={{ width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif", marginBottom: 4 }}
                        />
                        <textarea
                          rows={2}
                          value={art.contenu}
                          onChange={(e) => setArticlesPerso((prev) => prev.map((a, j) => j === i ? { ...a, contenu: e.target.value } : a))}
                          placeholder="Contenu de l'article..."
                          style={{ width: "100%", fontSize: 11, padding: "5px 8px", borderRadius: 4, border: "1px solid #E4E1D6", fontFamily: "'IBM Plex Sans', sans-serif", resize: "vertical" }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Clauses standards */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <AlertTriangle size={11} color="#B91C1C" /> Clauses standards
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 5, background: clauseFourriere ? "#FEF2F2" : "transparent", border: `1px solid ${clauseFourriere ? "#FECACA" : "#E4E1D6"}` }}>
                      <input type="checkbox" checked={clauseFourriere} onChange={(e) => setClauseFourriere(e.target.checked)} style={{ width: 14, height: 14, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Mise en fourriere</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6B6A60" }}>
                          Tout vehicule en infraction pourra etre enleve et mis en fourriere aux frais du proprietaire.
                        </p>
                      </div>
                    </label>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 5, background: clauseRecours ? "#EFF6FF" : "transparent", border: `1px solid ${clauseRecours ? "#BFDBFE" : "#E4E1D6"}` }}>
                      <input type="checkbox" checked={clauseRecours} onChange={(e) => setClauseRecours(e.target.checked)} style={{ width: 14, height: 14, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Recours contentieux</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6B6A60" }}>
                          Le present arrete peut faire l'objet d'un recours devant le Tribunal Administratif dans un delai de deux mois.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bouton pour ajouter des éléments supplémentaires */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {!perimetre && (
                    <button
                      onClick={() => setPerimetre("La zone réglementée est délimitée par ")}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, border: "1px dashed #D8D5C8", background: "transparent", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                      + Perimetre
                    </button>
                  )}
                  {articlesPerso.length === 0 && (
                    <button
                      onClick={() => setArticlesPerso([{ id: `art_${Date.now()}`, titre: "", contenu: "" }])}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, border: "1px dashed #D8D5C8", background: "transparent", cursor: "pointer", color: "#6B6A60", fontFamily: "'IBM Plex Sans', sans-serif" }}
                    >
                      + Article supplementaire
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Signature numérique ─── */}
          <div style={{ marginBottom: 14 }}>
            <SignaturePad value={signature} onChange={setSignature} />
          </div>

          {/* ─── Pièces jointes ─── */}
          <div style={{ marginBottom: 14 }}>
            <PiecesJointes pieces={piecesJointes} onChange={setPiecesJointes} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn-ghost" onClick={() => arreteExistant ? naviguerAvecGarde("/") : setEtape(0)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {titreArrete.length > 0 && !arreteExistant && (
                <button
                  className="btn-ghost"
                  onClick={sauvegarderCommeModele}
                  style={{ fontSize: 12, color: "#7C3AED" }}
                >
                  <BookmarkPlus size={12} /> Modele
                </button>
              )}
              {titreArrete.length > 0 && (
                <button
                  className="btn-ghost"
                  onClick={enregistrerBrouillon}
                  style={{ fontSize: 12, color: "#6B6A60" }}
                >
                  <Save size={12} /> Brouillon
                </button>
              )}
              <button
                className="btn-primary"
                onClick={tentativeAllerCarte}
                style={{ fontSize: 12, opacity: etape1Valide ? 1 : 0.55 }}
              >
                Identifier les voies <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
        {/* Colonne droite : aperçu carte */}
        {(() => {
          const voiesPourCarte = voiesDeclarees.map((v) => ({ nom: v.nom, impact: v.impact }));
          const hasVoies = voiesPourCarte.some((v) => v.nom.trim().length >= 3);

          return (
            <>
              {!isMobile && (
                <div style={{ position: "sticky", top: 20, height: "calc(100vh - 140px)", minHeight: 400 }}>
                  <CarteApercu
                    centre={tenant.centre_geo}
                    communeCodePostal={tenant.code_postal}
                    communeNom={tenant.nom.replace(/^Ville de /i, "")}
                    voies={voiesPourCarte}
                  />
                </div>
              )}
              {isMobile && hasVoies && (
                <div style={{ marginTop: 16, height: 300 }}>
                  <CarteApercu
                    centre={tenant.centre_geo}
                    communeCodePostal={tenant.code_postal}
                    communeNom={tenant.nom.replace(/^Ville de /i, "")}
                    voies={voiesPourCarte}
                  />
                </div>
              )}
            </>
          );
        })()}
        </div>
      )}

      {/* Etape 2 : voies — editeur cartographique */}
      {etape === 2 && typeArrete && !publie && (
        <div>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 4 }}>Voies & impacts</h2>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 10 }}>Tracez les rues ou dessinez des zones directement sur la carte.</p>
          {typeArrete.multi_phases && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {phases.map((ph, i) => <button key={ph.id} onClick={() => setPhaseActive(i)} className={`phase-tab${phaseActive === i ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 11 }}>{ph.label} · {ph.troncons.length} voie{ph.troncons.length !== 1 ? "s" : ""}</button>)}
            </div>
          )}
          {touchedPhases[`${phaseActive}_troncons`] && erreursPhases[phaseActive]?.["troncons"] && (
            <p style={styleErreur}>{erreursPhases[phaseActive]?.["troncons"]}</p>
          )}
          <CarteDessin
            troncons={phaseActuelle.troncons}
            rueInitiale=""
            voiesInitiales={voiesDeclarees.filter((v) => v.nom.length >= 3).map((v) => ({ nom: v.nom, impact: v.impact, touteRue: v.touteRue, debut: v.debut, fin: v.fin }))}
            centre={tenant.centre_geo}
            communeCodePostal={tenant.code_postal}
            communeNom={tenant.nom.replace(/^Ville de /i, "")}
            onAdd={(t) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: [...ph.troncons, t] }
              ));
            }}
            onRemove={(idx) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.filter((_, j) => j !== idx) }
              ));
            }}
            onUpdateImpact={(idx, impact) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.map((t, j) => j === idx ? { ...t, impact } : t) }
              ));
            }}
            onUpdateCoords={(idx, coords) => {
              setPhases((prev) => prev.map((ph, i) =>
                i !== phaseActive ? ph : { ...ph, troncons: ph.troncons.map((t, j) => j === idx ? { ...t, coordonnees: coords } : t) }
              ));
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setEtape(1)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-ghost"
                onClick={enregistrerBrouillon}
                style={{ fontSize: 12, color: "#6B6A60" }}
              >
                <Save size={12} /> Brouillon
              </button>
              <button
                className="btn-primary"
                onClick={tentativeAllerRecap}
                disabled={!etape2Valide}
                style={{ background: etape2Valide ? "#1E3A5F" : "#D8D5C8", fontSize: 12 }}
              >
                Valider <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Etape 3 : recapitulatif */}
      {etape === 3 && typeArrete && !publie && (
        <div style={{ maxWidth: 560 }}>
          <h2 className="fd" style={{ fontSize: 20, marginBottom: 12 }}>Recapitulatif</h2>
          <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #E4E1D6" }}>
              <div><p style={{ fontSize: 10, color: "#6B6A60", margin: 0 }}>Numero</p><p className="fm" style={{ fontSize: 14, color: "#1E3A5F", margin: 0 }}>{arreteExistant ? arreteExistant.numero : genNum(typeArrete.suffixe, nextIdx)}</p></div>
              <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "3px 8px", borderRadius: 4, alignSelf: "flex-start" }}>{typeArrete.label}</span>
            </div>
            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>{titreArrete}</p>
            <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{COMMUNES.find((c) => c.id === communeId)?.nom ?? "—"}</p>
            {arreteExistant && <div style={{ background: "#FEF3C7", borderRadius: 5, padding: "8px 11px", marginBottom: 10 }}><p style={{ fontSize: 11, fontWeight: 600, margin: "0 0 2px", color: "#92400E" }}>Motif</p><p style={{ fontSize: 12, margin: 0, color: "#78350F" }}>{motifModification || "Non precise"}</p></div>}
            <div style={{ borderTop: "1px solid #E4E1D6", paddingTop: 10 }}>
              {phases.map((ph) => (
                <div key={ph.id} style={{ marginBottom: 7 }}>
                  {phases.length > 1 && <p style={{ fontSize: 11, fontWeight: 600, color: "#1E3A5F", margin: "0 0 3px" }}>{ph.label}</p>}
                  {ph.troncons.map((t, tIdx) => {
                    const nom = t.label || VOIES.find((x) => x.id === t.voie_id)?.nom || t.voie_id;
                    const ti = TYPES_IMPACT.find((x) => x.code === t.impact);
                    return <p key={`${t.voie_id}_${tIdx}`} style={{ margin: "1px 0", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: ti?.couleur, flexShrink: 0 }} /><strong>{nom}</strong> · {ti?.label}</p>;
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Résumé récurrence */}
          {recurrence && (
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 14, marginBottom: 10 }}>
              <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 5 }}>
                <RefreshCw size={12} color="#7C3AED" /> Récurrence
              </p>
              <p style={{ fontSize: 11, color: "#5B21B6", margin: 0, background: "#EDE9FE", borderRadius: 5, padding: "5px 10px" }}>
                {recurrence.type === "permanent" && "Applicable en permanence, sans limite de durée."}
                {recurrence.type === "hebdomadaire" && (
                  <>
                    {(recurrence.jours?.length ?? 0) === 0
                      ? "Hebdomadaire — jours non précisés"
                      : `Chaque ${recurrence.jours!.join(", ")}`}
                    {recurrence.heure_debut && recurrence.heure_fin && ` de ${recurrence.heure_debut} à ${recurrence.heure_fin}`}
                  </>
                )}
                {recurrence.type === "mensuel" && (
                  <>
                    {(recurrence.jours_mois?.length ?? 0) === 0
                      ? "Mensuel — jours non précisés"
                      : `Le ${recurrence.jours_mois!.join(", ")} de chaque mois`}
                    {recurrence.heure_debut && recurrence.heure_fin && ` de ${recurrence.heure_debut} à ${recurrence.heure_fin}`}
                  </>
                )}
                {recurrence.type === "annuel" && `Saisonnier — chaque année`}
              </p>
            </div>
          )}
          {/* Résumé contenu juridique */}
          {(considerants.some((c) => c.trim()) || derogations.some((d) => d.trim()) || clauseFourriere || clauseRecours || perimetre.trim() || articlesPerso.some((a) => a.titre.trim())) && (
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 14, marginBottom: 10 }}>
              <p style={{ fontWeight: 600, fontSize: 12, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                <Scale size={12} color="#7C3AED" /> Contenu juridique
              </p>
              {considerants.filter((c) => c.trim()).length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#7C3AED", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Considerants</p>
                  {considerants.filter((c) => c.trim()).map((c, i) => (
                    <p key={i} style={{ fontSize: 11, color: "#6B6A60", margin: "1px 0", paddingLeft: 8, borderLeft: "2px solid #E4E1D6" }}>
                      {c.length > 80 ? c.slice(0, 80) + "…" : c}
                    </p>
                  ))}
                </div>
              )}
              {derogations.filter((d) => d.trim()).length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#2F6B4F", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Derogations</p>
                  {derogations.filter((d) => d.trim()).map((d, i) => (
                    <p key={i} style={{ fontSize: 11, color: "#6B6A60", margin: "1px 0", display: "flex", alignItems: "center", gap: 4 }}>
                      <Shield size={9} color="#2F6B4F" /> {d}
                    </p>
                  ))}
                </div>
              )}
              {perimetre.trim() && (
                <p style={{ fontSize: 11, color: "#6B6A60", margin: "0 0 4px" }}>
                  <strong style={{ color: "#0369A1" }}>Périmètre :</strong> {perimetre.length > 80 ? perimetre.slice(0, 80) + "…" : perimetre}
                </p>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {clauseFourriere && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "#FEF2F2", color: "#B91C1C", fontWeight: 600 }}>Mise en fourriere</span>}
                {clauseRecours && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>Recours contentieux</span>}
                {articlesPerso.filter((a) => a.titre.trim()).length > 0 && (
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "#FFF7ED", color: "#D9730D", fontWeight: 600 }}>
                    +{articlesPerso.filter((a) => a.titre.trim()).length} article{articlesPerso.filter((a) => a.titre.trim()).length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Résumé signature + pièces jointes */}
          {(signature || piecesJointes.length > 0) && (
            <div style={{ border: "1px solid #E4E1D6", borderRadius: 8, background: "#FFFFFF", padding: 14, marginBottom: 10 }}>
              {signature && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: piecesJointes.length > 0 ? 8 : 0 }}>
                  <span style={{ fontSize: 10, background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>✓ Signe numeriquement</span>
                  <img src={signature} alt="Signature" style={{ maxHeight: 32, opacity: 0.7 }} />
                </div>
              )}
              {piecesJointes.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#6B6A60", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Pieces jointes ({piecesJointes.length})</p>
                  {piecesJointes.map((pj) => (
                    <p key={pj.id} style={{ fontSize: 11, color: "#6B6A60", margin: "1px 0", display: "flex", alignItems: "center", gap: 4 }}>
                      <FileText size={9} /> {pj.nom}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ background: "#F4F2EC", borderRadius: 7, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#6B6A60" }}>
            <p style={{ fontWeight: 600, margin: "0 0 4px", color: "#1C1F1B", fontSize: 12 }}>A la publication :</p>
            {[[FileText, arreteExistant ? "PDF mis a jour" : "PDF officiel genere"], [MapPin, `Carte mise a jour (${totalTroncons} troncon${totalTroncons > 1 ? "s" : ""})`], [Check, "Diffusion aux services"]].map(([Icon, txt]) => (
              <p key={txt as string} style={{ margin: "2px 0", display: "flex", alignItems: "center", gap: 4 }}>{typeof Icon === "function" ? <Icon size={11} /> : null}{txt as string}</p>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn-ghost" onClick={() => setEtape(2)} style={{ fontSize: 12 }}><ChevronLeft size={13} />Retour</button>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-ghost"
                onClick={enregistrerBrouillon}
                style={{ fontSize: 12, color: "#6B6A60" }}
              >
                <Save size={12} /> Brouillon
              </button>
              <button className="btn-secondary" onClick={() => {
                const tronconsFlatMap = phases.flatMap((ph) => ph.troncons);
                const tv = [...new Set(phases.flatMap((ph) => ph.troncons.map((t) => t.label || VOIES.find((v) => v.id === t.voie_id)?.nom || t.voie_id)))];
                const apercu: Arrete = {
                  id: "apercu",
                  numero: arreteExistant ? arreteExistant.numero : genNum(typeArrete!.suffixe, nextIdx),
                  type_code: typeArrete!.code,
                  type_label: typeArrete!.label,
                  titre: titreArrete || typeArrete!.label,
                  statut: "brouillon",
                  cree_par: "M. Lefevre",
                  date_creation: AUJOURD_HUI.toISOString().split("T")[0]!,
                  date_debut: phases[0]?.date_debut || "",
                  date_fin: phases[phases.length - 1]?.date_fin || "",
                  commune: COMMUNES.find((c) => c.id === communeId)?.nom ?? "",
                  commune_id: communeId,
                  voies: tv,
                  troncons: tronconsFlatMap,
                  versions: [],
                  arrete_abrogation: null,
                  considerants: considerants.filter((c) => c.trim().length > 0),
                  derogations: derogations.filter((d) => d.trim().length > 0),
                  articles_personnalises: articlesPerso.filter((a) => a.titre.trim().length > 0 || a.contenu.trim().length > 0),
                  clause_fourriere: clauseFourriere,
                  clause_recours: clauseRecours,
                  perimetre: perimetre.trim() || undefined,
                  recurrence,
                  signature,
                  pieces_jointes: piecesJointes.length > 0 ? piecesJointes : undefined,
                };
                ouvrirApercuPdf(apercu, references, tenant.nom, tenant.code_postal, tenant);
              }} style={{ fontSize: 12 }}><FileText size={12} />Apercu PDF</button>
              <button
                onClick={publierArrete}
                disabled={!etape1Valide || !etape2Valide}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 20px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: (etape1Valide && etape2Valide) ? "pointer" : "not-allowed", background: (etape1Valide && etape2Valide) ? (arreteExistant ? "#1E3A5F" : "#2F6B4F") : "#D8D5C8", color: "#FAFAF7", fontFamily: "'IBM Plex Sans',sans-serif" }}
              >
                {arreteExistant ? <><RefreshCw size={12} />Enregistrer</> : <><Check size={12} />Publier</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation */}
      {publie && (
        <div style={{ maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: arreteExistant ? "#1E3A5F" : "#2F6B4F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {arreteExistant ? <RefreshCw size={19} color="#FAFAF7" /> : <Check size={19} color="#FAFAF7" />}
            </div>
            <div><h2 className="fd" style={{ fontSize: 20, margin: 0 }}>{arreteExistant ? "Modifie" : "Publie"}</h2><p className="fm" style={{ margin: 0, fontSize: 11, color: "#1E3A5F" }}>{dernierArrete?.numero}</p></div>
          </div>
          <p style={{ color: "#1C1F1B", fontSize: 13, fontWeight: 500, margin: "0 0 3px" }}>{dernierArrete?.titre}</p>
          <p style={{ color: "#6B6A60", fontSize: 12, marginBottom: 16 }}>{arreteExistant ? "Version precedente archivee." : "PDF · Carte · Notifications."}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => navigate("/")} style={{ fontSize: 12 }}><Home size={12} />Accueil</button>
            <button className="btn-secondary" onClick={() => navigate("/carte")} style={{ fontSize: 12 }}><Map size={12} />Voir la carte</button>
            <button className="btn-ghost" onClick={() => { setPublie(false); setEtape(0); setTypeArrete(null); }} style={{ fontSize: 12 }}><Plus size={12} />Nouvel arrete</button>
          </div>
        </div>
      )}
    </div>
  );
}
