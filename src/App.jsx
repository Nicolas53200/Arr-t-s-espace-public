import { useState, useMemo } from "react";
import {
  MapPin, FileText, Check, ChevronRight, ChevronLeft,
  AlertTriangle, X, Building2, Plus, Layers,
  Flag, BookOpen, AlertCircle, History, CheckCircle2,
  Clock, RefreshCw, ChevronDown, ChevronUp, Shield,
  Archive, Edit2, Trash2, Search, AlertOctagon,
  GitBranch, Home, Settings, Map, Calendar,
  Filter, Eye, EyeOff, Info
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
const AUJOURD_HUI = new Date("2026-06-18");
const DUREE_CONSERVATION_ANS = 5;

function estExpire(a){ return a.date_fin && new Date(a.date_fin) < AUJOURD_HUI; }
function estEnHistorique(a){ return estExpire(a) || a.statut==="abroge"; }
function estActif(a){ return !estEnHistorique(a); }

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────────────────────────────────────
const TYPES_IMPACT = [
  {code:"circulation_interdite",  label:"Circulation interdite",    couleur:"#B91C1C"},
  {code:"stationnement_interdit", label:"Stationnement interdit",   couleur:"#D9730D"},
  {code:"deviation",              label:"Déviation",                couleur:"#7C3AED"},
  {code:"zone_reservee",          label:"Zone réservée",            couleur:"#0369A1"},
  {code:"passage_maintenu",       label:"Passage secours maintenu", couleur:"#2F6B4F"},
];

// Voies avec coordonnées SVG — chaque voie a ses tronçons physiques
const VOIES = [
  {id:"v1", nom:"Rue de la République (N)", path:"M 60 40 L 60 180",   cx:60,  cy:110},
  {id:"v2", nom:"Rue de la République (S)", path:"M 60 180 L 60 320",  cx:60,  cy:250},
  {id:"v3", nom:"Avenue Foch (O)",          path:"M 60 180 L 220 180", cx:140, cy:180},
  {id:"v4", nom:"Avenue Foch (E)",          path:"M 220 180 L 340 180",cx:280, cy:180},
  {id:"v5", nom:"Rue des Tanneurs",         path:"M 120 60 L 120 180", cx:120, cy:120},
  {id:"v6", nom:"Rue Victor Hugo",          path:"M 180 40 L 180 180", cx:180, cy:110},
  {id:"v7", nom:"Rue des Lilas",            path:"M 220 100 L 220 180",cx:220, cy:140},
  {id:"v8", nom:"Rue du Commerce",          path:"M 260 180 L 260 300",cx:260, cy:240},
  {id:"v9", nom:"Place de la Mairie",       path:"M 60 180 L 100 180 L 100 220 L 60 220 Z", cx:80, cy:200, isZone:true},
  {id:"v10",nom:"Place du Marché",          path:"M 200 220 L 260 220 L 260 280 L 200 280 Z",cx:230,cy:250,isZone:true},
  {id:"v11",nom:"Rue Pasteur",              path:"M 120 180 L 120 280",cx:120, cy:230},
  {id:"v12",nom:"Quai Sud",                path:"M 20 320 L 340 320",  cx:180, cy:320},
  {id:"v13",nom:"Rue de la Paix",           path:"M 180 180 L 180 280",cx:180, cy:230},
  {id:"v14",nom:"Rue du Général de Gaulle", path:"M 60 120 L 180 120", cx:120, cy:120},
];

// Arrêtés avec tronçons géolocalisés
const ARRETES_INITIAUX = [
  {
    id:"a1", numero:"AR-2026-0142-SPO", type_code:"manifestation_sportive", type_label:"Manifestation sportive",
    titre:"Triathlon de Saint-Avoye",
    statut:"publie", cree_par:"M. Lefèvre", date_creation:"2026-06-18",
    date_debut:"2026-07-05", date_fin:"2026-07-05",
    voies:["Rue de la République (N)","Avenue Foch (O)","Quai Sud"],
    troncons:[
      {voie_id:"v1", impact:"circulation_interdite"},
      {voie_id:"v3", impact:"circulation_interdite"},
      {voie_id:"v12",impact:"circulation_interdite"},
      {voie_id:"v4", impact:"deviation"},
    ],
    versions:[], arrete_abrogation:null,
  },
  {
    id:"a2", numero:"AR-2026-0138-TRX", type_code:"travaux", type_label:"Travaux",
    titre:"Réfection de chaussée — Rue de la République",
    statut:"publie", cree_par:"M. Lefèvre", date_creation:"2026-06-01",
    date_debut:"2026-06-20", date_fin:"2026-07-15",
    voies:["Rue de la République (N)","Rue de la République (S)"],
    troncons:[
      {voie_id:"v1", impact:"circulation_interdite"},
      {voie_id:"v2", impact:"alternat"},
    ],
    versions:[], arrete_abrogation:null,
  },
  {
    id:"a3", numero:"AR-2026-0125-MAN", type_code:"manifestation", type_label:"Manifestation",
    titre:"Fête de la Musique 2026",
    statut:"publie", cree_par:"M. Lefèvre", date_creation:"2026-05-20",
    date_debut:"2026-06-21", date_fin:"2026-06-22",
    voies:["Place de la Mairie","Avenue Foch (O)","Rue de la Paix"],
    troncons:[
      {voie_id:"v9", impact:"zone_reservee"},
      {voie_id:"v3", impact:"stationnement_interdit"},
      {voie_id:"v13",impact:"stationnement_interdit"},
      {voie_id:"v6", impact:"circulation_interdite"},
    ],
    versions:[], arrete_abrogation:null,
  },
  {
    id:"a4", numero:"AR-2026-0099-STA", type_code:"stationnement_interdit", type_label:"Stationnement interdit",
    titre:"Stationnement interdit — Marché hebdomadaire",
    statut:"modifie", cree_par:"Mme Bernard", date_creation:"2026-04-10",
    date_debut:"2026-04-15", date_fin:"2026-12-31",
    voies:["Place du Marché"],
    troncons:[{voie_id:"v10",impact:"stationnement_interdit"}],
    versions:[{version:1,date:"2026-04-10",auteur:"Mme Bernard",motif:"Création initiale",titre:"Stationnement interdit — Marché hebdomadaire"}],
    arrete_abrogation:null,
  },
  {
    id:"a5", numero:"AR-2026-0071-CIR", type_code:"circulation_interdite", type_label:"Circulation interdite",
    titre:"Fermeture — Rue des Tanneurs (fuite de gaz)",
    statut:"abroge", cree_par:"M. Lefèvre", date_creation:"2026-03-05",
    date_debut:"2026-03-05", date_fin:"2026-03-08",
    voies:["Rue des Tanneurs"],
    troncons:[{voie_id:"v5",impact:"circulation_interdite"}],
    versions:[], arrete_abrogation:{numero:"AR-2026-0074-ABR",date:"2026-03-08",motif:"Réparation terminée, voie rouverte."},
  },
  {
    id:"a6", numero:"AR-2026-0045-MAN", type_code:"manifestation", type_label:"Manifestation",
    titre:"Carnaval de printemps",
    statut:"publie", cree_par:"Mme Bernard", date_creation:"2026-03-01",
    date_debut:"2026-03-15", date_fin:"2026-03-15",
    voies:["Place de la Mairie"],
    troncons:[{voie_id:"v9",impact:"zone_reservee"},{voie_id:"v14",impact:"circulation_interdite"}],
    versions:[], arrete_abrogation:null,
  },
  // Arrêté futur
  {
    id:"a7", numero:"AR-2026-0151-TRX", type_code:"travaux", type_label:"Travaux",
    titre:"Travaux fibre optique — Avenue Foch",
    statut:"publie", cree_par:"M. Lefèvre", date_creation:"2026-06-18",
    date_debut:"2026-08-10", date_fin:"2026-09-05",
    voies:["Avenue Foch (E)","Avenue Foch (O)"],
    troncons:[{voie_id:"v3",impact:"alternat"},{voie_id:"v4",impact:"alternat"}],
    versions:[], arrete_abrogation:null,
  },
  {
    id:"a8", numero:"AR-2026-0155-SPO", type_code:"manifestation_sportive", type_label:"Manifestation sportive",
    titre:"Course pédestre — Foulées de Saint-Avoye",
    statut:"publie", cree_par:"Mme Bernard", date_creation:"2026-06-18",
    date_debut:"2026-09-20", date_fin:"2026-09-20",
    voies:["Rue Victor Hugo","Rue de la Paix","Quai Sud"],
    troncons:[{voie_id:"v6",impact:"circulation_interdite"},{voie_id:"v13",impact:"circulation_interdite"},{voie_id:"v12",impact:"circulation_interdite"}],
    versions:[], arrete_abrogation:null,
  },
];

const REFS_INITIALES = [
  {id:"r1",code:"del_sec",categorie:"delegation",label:"Délégation — Sécurité, réglementation",titulaire:"Mme Claire Fontaine",numero:"032/2026",date:"2026-01-15",actif:true,date_debut_validite:"2026-01-15",date_fin_validite:"",historique:[{numero:"018/2022",date:"2022-04-01",titulaire:"M. René Chapuis",date_fin:"2026-01-14"}]},
  {id:"r2",code:"del_voi",categorie:"delegation",label:"Délégation — Voirie et déplacements",titulaire:"M. Patrick Guillou",numero:"033/2026",date:"2026-01-15",actif:true,date_debut_validite:"2026-01-15",date_fin_validite:"",historique:[]},
  {id:"r3",code:"circ",categorie:"circulation",label:"Accès Vieux Centre — riverains",titulaire:null,numero:"AR-2015-646-CIR",date:"2015-10-21",actif:true,date_debut_validite:"2015-10-21",date_fin_validite:"",historique:[]},
  {id:"r4",code:"z30",categorie:"circulation",label:"Zone 30 — Centre-ville",titulaire:null,numero:"AR-2021-312-CIR",date:"2021-09-01",actif:true,date_debut_validite:"2021-09-01",date_fin_validite:"",historique:[]},
  {id:"r5",code:"stat",categorie:"stationnement",label:"Stationnement payant",titulaire:null,numero:"AR-2017-823-STA",date:"2017-12-18",actif:true,date_debut_validite:"2017-12-18",date_fin_validite:"",historique:[]},
];

const CATEGORIES_REF=[{code:"delegation",label:"Délégations",icon:Shield,couleur:"#1E3A5F"},{code:"circulation",label:"Circulation permanente",icon:MapPin,couleur:"#B91C1C"},{code:"stationnement",label:"Stationnement",icon:Archive,couleur:"#D9730D"}];

const TYPES_ARRETE=[
  {code:"circulation_interdite",label:"Circulation interdite",suffixe:"CIR",description:"Fermeture totale d'une voie",multi_phases:false,champs:[{id:"motif",label:"Motif",type:"select",options:["Travaux de voirie","Sécurité publique","Événement","Autre"]},{id:"localisation",label:"Voie concernée",type:"adresse",placeholder:"Ex. Rue de la République"},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"},{id:"deviation",label:"Déviation prévue",type:"bool"}]},
  {code:"stationnement_interdit",label:"Stationnement interdit",suffixe:"STA",description:"Restriction de stationnement",multi_phases:false,champs:[{id:"localisation",label:"Zone concernée",type:"adresse",placeholder:"Ex. Avenue Foch"},{id:"motif",label:"Motif",type:"select",options:["Déménagement","Travaux","Manifestation","Marché","Autre"]},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"},{id:"enlevement",label:"Enlèvement des véhicules",type:"bool"}]},
  {code:"alternat",label:"Alternat",suffixe:"ALT",description:"Circulation alternée",multi_phases:false,champs:[{id:"localisation",label:"Voie concernée",type:"adresse",placeholder:"Ex. Rue des Tanneurs"},{id:"type_gestion",label:"Mode",type:"select",options:["Feux tricolores","Panneaux K10","Homme trafic"]},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"}]},
  {code:"travaux",label:"Travaux",suffixe:"TRX",description:"Chantier sur l'espace public",multi_phases:true,aide_phases:"Une phase par période ou tronçon.",champs:[{id:"nature",label:"Nature",type:"select",options:["Voirie","Réseaux","Fibre","Bâtiment","Espaces verts"]},{id:"entreprise",label:"Entreprise",type:"texte"},{id:"impact_circulation",label:"Impact",type:"select",options:["Aucun","Alternat","Sens unique","Fermeture totale"]}]},
  {code:"manifestation",label:"Manifestation",suffixe:"MAN",description:"Événement public",multi_phases:true,aide_phases:"Une phase par type d'impact.",champs:[{id:"nom_evenement",label:"Nom",type:"texte"},{id:"organisateur",label:"Organisateur",type:"texte"},{id:"frequentation",label:"Fréquentation",type:"select",options:["< 100","100–500","500–2 000","> 2 000"]},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"}]},
  {code:"manifestation_sportive",label:"Manifestation sportive",suffixe:"SPO",description:"Course, triathlon…",multi_phases:true,aide_phases:"Une phase par vague.",champs:[{id:"nom_evenement",label:"Nom",type:"texte"},{id:"type_sport",label:"Type",type:"select",options:["Course à pied","Cyclisme","Triathlon","Duathlon","Autre"]},{id:"organisateur",label:"Organisateur",type:"texte"},{id:"nb_participants",label:"Participants",type:"texte"},{id:"date_debut",label:"Départ",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"}]},
  {code:"marche",label:"Marché",suffixe:"MAR",description:"Occupation pour un marché",multi_phases:false,champs:[{id:"localisation",label:"Emplacement",type:"adresse",placeholder:"Ex. Place du Marché"},{id:"recurrence",label:"Caractère",type:"select",options:["Hebdomadaire","Mensuel","Exceptionnel"]},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"}]},
  {code:"occupation_dp",label:"Occupation domaine public",suffixe:"ODP",description:"Terrasse, échafaudage…",multi_phases:false,champs:[{id:"nature",label:"Nature",type:"select",options:["Terrasse","Échafaudage","Benne","Stand","Autre"]},{id:"localisation",label:"Adresse",type:"adresse",placeholder:"Ex. 24 rue des Lilas"},{id:"demandeur",label:"Demandeur",type:"texte"},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"}]},
  {code:"demenagement",label:"Déménagement",suffixe:"DEM",description:"Réservation déménagement",multi_phases:false,champs:[{id:"localisation",label:"Adresse",type:"adresse",placeholder:"Ex. 7 rue du Commerce"},{id:"demandeur",label:"Demandeur",type:"texte"},{id:"date_debut",label:"Début",type:"datetime"},{id:"date_fin",label:"Fin",type:"datetime"},{id:"vehicule",label:"Véhicule",type:"select",options:["< 10m³","10–20m³","> 20m³"]}]},
];

function couleurImpact(code){ return TYPES_IMPACT.find(t=>t.code===code)?.couleur||"#C9C6BA"; }
function resoudreTroncons(texte){
  if(!texte) return [];
  const t=texte.toLowerCase();
  const map=[{mots:["république"],ids:["v1","v2"]},{mots:["foch"],ids:["v3","v4"]},{mots:["tanneurs"],ids:["v5"]},{mots:["hugo"],ids:["v6"]},{mots:["lilas"],ids:["v7"]},{mots:["commerce"],ids:["v8"]},{mots:["mairie"],ids:["v9","v1"]},{mots:["marché"],ids:["v10"]},{mots:["pasteur"],ids:["v11"]},{mots:["quai"],ids:["v12"]},{mots:["paix"],ids:["v13"]},{mots:["gaulle"],ids:["v14"]},{mots:["musique","fête"],ids:["v9","v3","v13","v6"]},{mots:["triathlon","course"],ids:["v1","v3","v12","v4"]}];
  const s=new Set();
  for(const c of map) if(c.mots.some(m=>t.includes(m))) c.ids.forEach(id=>s.add(id));
  return [...s];
}
function genNum(suf,idx){ return `AR-2026-${String(idx).padStart(4,"0")}-${suf}`; }
function fmtDate(d){ if(!d) return "—"; try{ return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"}); }catch{ return d; } }
function fmtDateCourte(d){ if(!d) return ""; try{ return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}); }catch{ return d; } }

const STATUT_UI={publie:{label:"Publié",bg:"#D1FAE5",color:"#065F46"},modifie:{label:"Modifié",bg:"#DBEAFE",color:"#1E3A5F"},abroge:{label:"Abrogé",bg:"#FEE2E2",color:"#B91C1C"}};

// Couleurs par type d'arrêté (pour la carte et le calendrier)
const COULEUR_TYPE={
  circulation_interdite:"#B91C1C", stationnement_interdit:"#D9730D",
  alternat:"#7C3AED", travaux:"#92400E", manifestation:"#0369A1",
  manifestation_sportive:"#2F6B4F", marche:"#B45309",
  occupation_dp:"#6B7280", demenagement:"#1E3A5F",
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
*{box-sizing:border-box;}
.fd{font-family:'Source Serif 4',serif;}
.fm{font-family:'IBM Plex Mono',monospace;}
body{font-family:'IBM Plex Sans',sans-serif;margin:0;}
select,input[type=text],input[type=datetime-local],textarea{font-family:'IBM Plex Sans',sans-serif;font-size:13px;color:#1C1F1B;background:#fff;border:1px solid #D8D5C8;border-radius:4px;padding:8px 10px;width:100%;}
select:focus,input:focus,textarea:focus{outline:2px solid #1E3A5F;outline-offset:1px;}
.phase-tab{padding:6px 14px;border-radius:20px;font-size:12px;cursor:pointer;border:1px solid #E4E1D6;white-space:nowrap;font-family:'IBM Plex Sans',sans-serif;}
.phase-tab.active{background:#1E3A5F;color:#FAFAF7;border-color:#1E3A5F;}
.phase-tab:not(.active){background:#fff;color:#6B6A60;}
.phase-tab:not(.active):hover{border-color:#1E3A5F;color:#1E3A5F;}
.btn-primary{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:6px;font-size:13px;font-weight:600;border:none;cursor:pointer;background:#1E3A5F;color:#FAFAF7;font-family:'IBM Plex Sans',sans-serif;transition:background .15s;}
.btn-primary:hover{background:#16304F;}
.btn-primary:disabled{background:#D8D5C8;cursor:not-allowed;}
.btn-secondary{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:500;border:1px solid #D8D5C8;cursor:pointer;background:#fff;color:#1C1F1B;font-family:'IBM Plex Sans',sans-serif;transition:border-color .15s;}
.btn-secondary:hover{border-color:#1E3A5F;color:#1E3A5F;}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:500;border:none;cursor:pointer;background:transparent;color:#6B6A60;font-family:'IBM Plex Sans',sans-serif;}
.btn-ghost:hover{background:#F0EDE4;color:#1C1F1B;}
.btn-danger{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:500;border:1px solid #FCA5A5;cursor:pointer;background:#FEF2F2;color:#B91C1C;font-family:'IBM Plex Sans',sans-serif;}
.btn-danger:hover{background:#FEE2E2;}
.card-hover{transition:box-shadow .2s,border-color .2s;}
.card-hover:hover{border-color:#BFCFDF!important;box-shadow:0 2px 12px #1E3A5F11;}
.tr-voie{transition:stroke .18s,stroke-width .18s,opacity .18s;cursor:pointer;}
.tr-voie:hover{opacity:0.82;}
.nav-link{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:4px;font-size:13px;cursor:pointer;border:none;background:none;color:#6B6A60;font-family:'IBM Plex Sans',sans-serif;}
.nav-link:hover{background:#F0EDE4;color:#1C1F1B;}
.nav-link.active{color:#1E3A5F;font-weight:600;}
.filtre-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid #E4E1D6;cursor:pointer;background:#fff;color:#6B6A60;font-family:'IBM Plex Sans',sans-serif;white-space:nowrap;transition:all .15s;}
.filtre-btn.actif{border-color:var(--fc);background:var(--fc);color:#fff;}
.filtre-btn:not(.actif):hover{border-color:#1E3A5F;color:#1E3A5F;}
.cal-day{border-radius:6px;padding:6px;min-height:110px;border:1px solid transparent;transition:background .15s;}
.cal-day:hover{background:#F4F2EC;}
.cal-day.today{border-color:#1E3A5F;}
.cal-day.other-month{opacity:0.35;}
.tooltip{position:absolute;z-index:50;background:#1C1F1B;color:#fff;border-radius:6px;padding:8px 12px;font-size:12px;pointer-events:none;white-space:nowrap;box-shadow:0 4px 20px #0000003A;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [vue, setVue] = useState("accueil");
  const [arretes, setArretes] = useState(ARRETES_INITIAUX);
  const [refs, setRefs] = useState(REFS_INITIALES);
  const [nextIdx, setNextIdx] = useState(156);

  // Formulaire
  const [modeEdition, setModeEdition] = useState(null);
  const [etape, setEtape] = useState(0);
  const [typeArrete, setTypeArrete] = useState(null);
  const [valeurs, setValeurs] = useState({});
  const [titreArrete, setTitreArrete] = useState("");
  const [phases, setPhases] = useState([]);
  const [phaseActive, setPhaseActive] = useState(0);
  const [publie, setPublie] = useState(false);
  const [dernierArrete, setDernierArrete] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [modalAction, setModalAction] = useState(null);
  const [catRefActive, setCatRefActive] = useState("delegation");
  const [historiquesOuverts, setHistoriquesOuverts] = useState(new Set());
  const [refEnEdition, setRefEnEdition] = useState(null);

  const actifs     = useMemo(()=>arretes.filter(estActif),     [arretes]);
  const historique = useMemo(()=>arretes.filter(estEnHistorique),[arretes]);
  const filtrer    = (liste) => { const q=recherche.toLowerCase(); if(!q) return liste; return liste.filter(a=>a.numero.toLowerCase().includes(q)||a.titre.toLowerCase().includes(q)||a.type_label.toLowerCase().includes(q)||a.voies.some(v=>v.toLowerCase().includes(q))); };

  const champsAdresse = useMemo(()=>typeArrete?.champs.find(c=>c.type==="adresse"),[typeArrete]);

  function demarrerNouvel(){ setModeEdition(null);setEtape(0);setTypeArrete(null);setValeurs({});setTitreArrete("");setPhases([]);setPhaseActive(0);setPublie(false);setDernierArrete(null);setVue("nouveau"); }
  function demarrerEdition(a){ setModalAction(null);setModeEdition({arrete:a,motif:"",titre:a.titre});const t=TYPES_ARRETE.find(x=>x.code===a.type_code);setTypeArrete(t);setTitreArrete(a.titre);setValeurs({});setPhases([{id:1,label:"Impact principal",date_debut:"",date_fin:"",localisation:"",troncons:[]}]);setPhaseActive(0);setPublie(false);setDernierArrete(null);setEtape(1);setVue("nouveau"); }
  function initPhases(t){ setPhases([{id:1,label:t.multi_phases?"Phase 1":"Impact principal",date_debut:"",date_fin:"",localisation:"",troncons:[]}]);setPhaseActive(0); }
  function allerFormulaire(t){ setTypeArrete(t);setValeurs({});setTitreArrete("");initPhases(t);setEtape(1); }
  function allerCarte(){ setPhases(prev=>prev.map(ph=>{ const loc=ph.localisation||valeurs[champsAdresse?.id]||"";const detectes=resoudreTroncons(loc);const ex=new Set(ph.troncons.map(t=>t.voie_id));const nv=detectes.filter(id=>!ex.has(id)).map(id=>({voie_id:id,impact:"circulation_interdite",segment_debut:"",segment_fin:"",origine:"auto"}));return {...ph,troncons:[...ph.troncons,...nv]}; }));setEtape(2); }
  function toggleTroncon(vid){ setPhases(prev=>prev.map((ph,i)=>{ if(i!==phaseActive) return ph;const ex=ph.troncons.find(t=>t.voie_id===vid);if(ex) return {...ph,troncons:ph.troncons.filter(t=>t.voie_id!==vid)};return {...ph,troncons:[...ph.troncons,{voie_id:vid,impact:"circulation_interdite",segment_debut:"",segment_fin:"",origine:"manuel"}]}; })); }
  function setImpactTroncon(vid,impact){ setPhases(prev=>prev.map((ph,i)=>i!==phaseActive?ph:{...ph,troncons:ph.troncons.map(t=>t.voie_id===vid?{...t,impact}:t)})); }
  function setSegTroncon(vid,f,v){ setPhases(prev=>prev.map((ph,i)=>i!==phaseActive?ph:{...ph,troncons:ph.troncons.map(t=>t.voie_id===vid?{...t,[f]:v}:t)})); }
  function ajouterPhase(){ const id=phases.length+1;setPhases(prev=>[...prev,{id,label:`Phase ${id}`,date_debut:"",date_fin:"",localisation:"",troncons:[]}]);setPhaseActive(phases.length); }
  function supprimerPhase(i){ if(phases.length===1) return;setPhases(prev=>prev.filter((_,idx)=>idx!==i));setPhaseActive(Math.max(0,phaseActive-1)); }
  function updatePhase(i,f,v){ setPhases(prev=>prev.map((ph,idx)=>idx===i?{...ph,[f]:v}:ph)); }

  function publierArrete(){
    const num=genNum(typeArrete.suffixe,nextIdx);
    const tv=[...new Set(phases.flatMap(ph=>ph.troncons.map(t=>VOIES.find(v=>v.id===t.voie_id)?.nom||t.voie_id)))];
    const tronconsFlatMap=phases.flatMap(ph=>ph.troncons);
    if(modeEdition){
      setArretes(prev=>prev.map(a=>{ if(a.id!==modeEdition.arrete.id) return a;const h={version:(a.versions.length)+1,date:AUJOURD_HUI.toISOString().split("T")[0],auteur:"M. Lefèvre",motif:modeEdition.motif||"Modification",titre:a.titre};return {...a,titre:titreArrete||a.titre,statut:"modifie",voies:tv,troncons:tronconsFlatMap,versions:[h,...a.versions]}; }));
      setDernierArrete({numero:modeEdition.arrete.numero,mode:"modifie",titre:titreArrete});
    } else {
      const nouvel={id:`a${Date.now()}`,numero:num,type_code:typeArrete.code,type_label:typeArrete.label,titre:titreArrete||typeArrete.label,statut:"publie",cree_par:"M. Lefèvre",date_creation:AUJOURD_HUI.toISOString().split("T")[0],date_debut:phases[0]?.date_debut||"",date_fin:phases[phases.length-1]?.date_fin||"",voies:tv,troncons:tronconsFlatMap,versions:[],arrete_abrogation:null};
      setArretes(prev=>[nouvel,...prev]);setDernierArrete({numero:num,mode:"cree",titre:titreArrete||typeArrete.label});setNextIdx(n=>n+1);
    }
    setPublie(true);
  }

  function abrogerArrete(a,motif){ const n=genNum("ABR",nextIdx);setArretes(prev=>prev.map(x=>x.id!==a.id?x:{...x,statut:"abroge",arrete_abrogation:{numero:n,date:AUJOURD_HUI.toISOString().split("T")[0],motif}}));setNextIdx(n=>n+1);setModalAction(null); }
  function retourAccueil(){ setVue("accueil");setPublie(false);setModeEdition(null);setEtape(0);setTypeArrete(null); }
  function mettreAJourRef(rid,vals){ setRefs(prev=>{ const anc=prev.find(r=>r.id===rid);const h={numero:anc.numero,date:anc.date,titulaire:anc.titulaire,date_fin:AUJOURD_HUI.toISOString().split("T")[0]};return prev.map(r=>r.id===rid?{...r,...vals,actif:true,historique:[h,...r.historique]}:r); });setRefEnEdition(null); }
  function ajouterRef(nr){ setRefs(prev=>[...prev,{...nr,id:`r${Date.now()}`,actif:true,historique:[]}]);setRefEnEdition(null); }
  function toggleHistorique(id){ setHistoriquesOuverts(prev=>{ const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n; }); }
  const alertes=refs.filter(r=>{ if(!r.actif||!r.date_fin_validite) return false;const fin=new Date(r.date_fin_validite);const j60=new Date(AUJOURD_HUI);j60.setDate(j60.getDate()+60);return fin<=j60; });

  const phaseActuelle=phases[phaseActive]||{troncons:[]};
  const tronconIdsActifs=new Set(phaseActuelle.troncons.map(t=>t.voie_id));
  const totalTroncons=[...new Set(phases.flatMap(ph=>ph.troncons.map(t=>t.voie_id)))].length;
  const champsValides=typeArrete?typeArrete.champs.filter(c=>c.type!=="bool"&&c.type!=="adresse").every(c=>valeurs[c.id]?.trim())&&titreArrete.trim():false;

  return (
    <div style={{minHeight:"100vh",background:"#FAFAF7",color:"#1C1F1B",fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* Header */}
      <header style={{borderBottom:"1px solid #E4E1D6",background:"#FFFFFF",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
          <button onClick={retourAccueil} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer",padding:0}}>
            <div style={{width:32,height:32,background:"#1E3A5F",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Building2 size={16} color="#FAFAF7" strokeWidth={1.75}/>
            </div>
            <div style={{textAlign:"left"}}>
              <p style={{fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:"#6B6A60",margin:0,lineHeight:1}}>Ville de Saint-Avoye</p>
              <p className="fd" style={{fontSize:13,margin:0,lineHeight:1.2,color:"#1C1F1B"}}>Arrêtés & Espace public</p>
            </div>
          </button>
          <nav style={{display:"flex",gap:2,alignItems:"center"}}>
            <button onClick={retourAccueil} className={`nav-link${vue==="accueil"?" active":""}`}><Home size={13}/>Accueil</button>
            <button onClick={()=>{setVue("actifs");setRecherche("");}} className={`nav-link${vue==="actifs"?" active":""}`}>
              <CheckCircle2 size={13}/>Actifs
              {actifs.length>0&&<span style={{background:"#1E3A5F",color:"#fff",borderRadius:10,fontSize:10,padding:"1px 6px",fontFamily:"'IBM Plex Mono',monospace"}}>{actifs.length}</span>}
            </button>
            <button onClick={()=>{setVue("carte");}} className={`nav-link${vue==="carte"?" active":""}`}><Map size={13}/>Carte</button>
            <button onClick={()=>{setVue("historique");setRecherche("");}} className={`nav-link${vue==="historique"?" active":""}`}><History size={13}/>Historique</button>
            <button onClick={()=>setVue("references")} className={`nav-link${vue==="references"?" active":""}`} style={{position:"relative"}}>
              <BookOpen size={13}/>Références
              {alertes.length>0&&<span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:"#D9730D"}}/>}
            </button>
          </nav>
          <div style={{fontSize:11,color:"#6B6A60",fontFamily:"'IBM Plex Mono',monospace",textAlign:"right"}}>
            <p style={{margin:0}}>M. Lefèvre</p>
            <p style={{margin:0,fontSize:10}}>{AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      </header>

      <main style={vue==="carte" ? {padding:"0 24px 48px"} : {maxWidth:1200,margin:"0 auto",padding:"0 24px 48px"}}>

        {/* ════ ACCUEIL ════ */}
        {vue==="accueil"&&(
          <div style={{paddingTop:48,maxWidth:1200,margin:"0 auto"}}>
            <p style={{fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"#6B6A60",margin:"0 0 8px"}}>Plateforme territoriale</p>
            <h2 className="fd" style={{fontSize:36,margin:"0 0 12px",lineHeight:1.15,maxWidth:500}}>Arrêtés municipaux &amp; espace public</h2>
            <p style={{fontSize:14,color:"#6B6A60",margin:"0 0 28px",maxWidth:460,lineHeight:1.6}}>Rédigez, cartographiez et diffusez vos arrêtés depuis un seul outil.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:40}}>
              <button className="btn-primary" onClick={demarrerNouvel} style={{padding:"11px 22px",fontSize:14}}><Plus size={16}/>Nouvel arrêté</button>
              <button className="btn-secondary" onClick={()=>setVue("actifs")} style={{padding:"11px 22px",fontSize:14}}><CheckCircle2 size={16}/>Arrêtés actifs{actifs.length>0&&<span style={{background:"#1E3A5F",color:"#fff",borderRadius:10,fontSize:11,padding:"1px 7px"}}>{actifs.length}</span>}</button>
              <button className="btn-secondary" onClick={()=>setVue("carte")} style={{padding:"11px 22px",fontSize:14}}><Map size={16}/>Carte &amp; calendrier</button>
              <button className="btn-ghost" onClick={()=>setVue("historique")} style={{padding:"11px 22px",fontSize:14}}><History size={16}/>Historique</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:36}}>
              {[{label:"Actifs",valeur:actifs.length,couleur:"#1E3A5F",bg:"#EBF0F7",icon:CheckCircle2},{label:"En historique",valeur:historique.length,couleur:"#6B6A60",bg:"#F0EDE4",icon:Archive},{label:"Références",valeur:refs.filter(r=>r.actif).length,couleur:"#2F6B4F",bg:"#D1FAE5",icon:Shield},{label:"Conservation",valeur:`${DUREE_CONSERVATION_ANS} ans`,couleur:"#92400E",bg:"#FEF3C7",icon:Clock}].map(({label,valeur,couleur,bg,icon:Icon})=>(
                <div key={label} style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:8,padding:"14px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><div style={{width:28,height:28,borderRadius:5,background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={14} color={couleur}/></div><span style={{fontSize:12,color:"#6B6A60"}}>{label}</span></div>
                  <p style={{fontSize:24,fontWeight:700,color:couleur,margin:0,fontFamily:"'IBM Plex Mono',monospace"}}>{valeur}</p>
                </div>
              ))}
            </div>
            {actifs.length>0&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <h3 className="fd" style={{fontSize:17,margin:0}}>Arrêtés actifs récents</h3>
                  <button className="btn-ghost" onClick={()=>setVue("actifs")} style={{fontSize:12}}>Voir tous<ChevronRight size={12}/></button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {actifs.slice(0,3).map(a=><ArreteLigne key={a.id} arrete={a} compact onModifier={()=>setModalAction({type:"modifier",arrete:a})} onAbroger={()=>setModalAction({type:"abroger",arrete:a})}/>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ CARTE + CALENDRIER (dépliant) ════ */}
        {vue==="carte"&&(
          <VueCarte arretes={arretes} actifs={actifs} onNouvel={demarrerNouvel}/>
        )}

        {/* ════ ACTIFS ════ */}
        {vue==="actifs"&&(
          <div style={{paddingTop:28,maxWidth:1200,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div><h2 className="fd" style={{fontSize:22,margin:"0 0 2px"}}>Arrêtés actifs</h2><p style={{color:"#6B6A60",fontSize:13,margin:0}}>{actifs.length} en cours</p></div>
              <button className="btn-primary" onClick={demarrerNouvel}><Plus size={13}/>Nouvel arrêté</button>
            </div>
            <div style={{position:"relative",marginBottom:14}}><Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#A6A399"}}/><input type="text" placeholder="Rechercher…" value={recherche} onChange={e=>setRecherche(e.target.value)} style={{paddingLeft:30}}/></div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {filtrer(actifs).map(a=><ArreteLigne key={a.id} arrete={a} onModifier={()=>setModalAction({type:"modifier",arrete:a})} onAbroger={()=>setModalAction({type:"abroger",arrete:a})}/>)}
              {filtrer(actifs).length===0&&<Vide texte="Aucun arrêté actif."/>}
            </div>
          </div>
        )}

        {/* ════ HISTORIQUE ════ */}
        {vue==="historique"&&(
          <div style={{paddingTop:28,maxWidth:1200,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
              <div><h2 className="fd" style={{fontSize:22,margin:"0 0 2px"}}>Historique</h2><p style={{color:"#6B6A60",fontSize:13,margin:0}}>{historique.length} archivés · Conservation : {DUREE_CONSERVATION_ANS} ans</p></div>
              <div style={{display:"flex",alignItems:"center",gap:5,background:"#F4F2EC",borderRadius:6,padding:"5px 11px",fontSize:12,color:"#6B6A60"}}><Settings size={12}/>Durée : <strong>{DUREE_CONSERVATION_ANS} ans</strong></div>
            </div>
            <div style={{position:"relative",marginBottom:14}}><Search size={13} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#A6A399"}}/><input type="text" placeholder="Rechercher dans l'historique…" value={recherche} onChange={e=>setRecherche(e.target.value)} style={{paddingLeft:30}}/></div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {filtrer(historique).map(a=><ArreteLigne key={a.id} arrete={a} archive/>)}
              {filtrer(historique).length===0&&<Vide texte="Aucun arrêté en historique."/>}
            </div>
          </div>
        )}

        {/* ════ NOUVEAU ════ */}
        {vue==="nouveau"&&<VueNouveau etape={etape} setEtape={setEtape} typeArrete={typeArrete} valeurs={valeurs} setValeurs={setValeurs} titreArrete={titreArrete} setTitreArrete={setTitreArrete} phases={phases} phaseActive={phaseActive} setPhaseActive={setPhaseActive} phaseActuelle={phaseActuelle} tronconIdsActifs={tronconIdsActifs} totalTroncons={totalTroncons} champsValides={champsValides} modeEdition={modeEdition} setModeEdition={setModeEdition} publie={publie} dernierArrete={dernierArrete} allerFormulaire={allerFormulaire} allerCarte={allerCarte} toggleTroncon={toggleTroncon} setImpactTroncon={setImpactTroncon} setSegTroncon={setSegTroncon} ajouterPhase={ajouterPhase} supprimerPhase={supprimerPhase} updatePhase={updatePhase} publierArrete={publierArrete} retourAccueil={retourAccueil} demarrerNouvel={demarrerNouvel} setVue={setVue} nextIdx={nextIdx} refs={refs}/>}

        {/* ════ RÉFÉRENCES ════ */}
        {vue==="references"&&<VueReferences refs={refs} alertes={alertes} catRefActive={catRefActive} setCatRefActive={setCatRefActive} historiquesOuverts={historiquesOuverts} toggleHistorique={toggleHistorique} refEnEdition={refEnEdition} setRefEnEdition={setRefEnEdition} mettreAJourRef={mettreAJourRef} ajouterRef={ajouterRef}/>}
      </main>

      {modalAction?.type==="modifier"&&<ModalConfirm titre="Modifier" message={`${modalAction.arrete.numero} — "${modalAction.arrete.titre}"`} icone={<Edit2 size={19} color="#1E3A5F"/>} couleurIcone="#EBF0F7" labelOk="Modifier" couleurOk="#1E3A5F" onOk={()=>demarrerEdition(modalAction.arrete)} onCancel={()=>setModalAction(null)}/>}
      {modalAction?.type==="abroger"&&<ModalAbrogation arrete={modalAction.arrete} onOk={(m)=>abrogerArrete(modalAction.arrete,m)} onCancel={()=>setModalAction(null)}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VUE CARTE
// ─────────────────────────────────────────────────────────────────────────────
function VueCarte({ arretes, actifs, onNouvel }) {
  const [filtreTypes, setFiltreTypes] = useState(new Set()); // vide = tout afficher
  const [filtreImpacts, setFiltreImpacts] = useState(new Set());
  const [arreteSelectionne, setArreteSelectionne] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [showFuturs, setShowFuturs] = useState(true);
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);

  const futur = (a) => new Date(a.date_debut) > AUJOURD_HUI;
  const enCours = (a) => new Date(a.date_debut) <= AUJOURD_HUI && new Date(a.date_fin) >= AUJOURD_HUI;

  // Arrêtés visibles selon filtres
  const arretesAffiches = useMemo(() => {
    return actifs.filter(a => {
      if (!showFuturs && futur(a)) return false;
      if (filtreTypes.size > 0 && !filtreTypes.has(a.type_code)) return false;
      return true;
    });
  }, [actifs, filtreTypes, showFuturs]);

  // Pour chaque voie, calculer l'impact consolidé (prend l'impact le plus fort)
  const impactsParVoie = useMemo(() => {
    const map = {};
    for (const a of arretesAffiches) {
      if (!a.troncons) continue;
      for (const t of a.troncons) {
        if (!map[t.voie_id]) map[t.voie_id] = [];
        map[t.voie_id].push({ impact: t.impact, arrete: a });
      }
    }
    return map;
  }, [arretesAffiches]);

  function couleurVoie(vid) {
    const impacts = impactsParVoie[vid];
    if (!impacts || impacts.length === 0) return null;
    // Priorité : circulation > stationnement > déviation > zone > passage
    const priorite = ["circulation_interdite","stationnement_interdit","deviation","zone_reservee","passage_maintenu"];
    for (const p of priorite) {
      if (impacts.some(i => i.impact === p)) return couleurImpact(p);
    }
    return couleurImpact(impacts[0].impact);
  }

  function arretesVoie(vid) {
    return (impactsParVoie[vid] || []).map(i => i.arrete);
  }

  const typesPresents = [...new Set(actifs.map(a => a.type_code))];

  function toggleFiltre(code) {
    setFiltreTypes(prev => {
      const n = new Set(prev);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  }

  return (
    <div style={{paddingTop:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <h2 className="fd" style={{fontSize:22,margin:"0 0 2px"}}>Carte des impacts</h2>
          <p style={{color:"#6B6A60",fontSize:13,margin:0}}>Vue territoriale des arrêtés actifs en cours et à venir</p>
        </div>
        <button className="btn-primary" onClick={onNouvel} style={{padding:"8px 16px",fontSize:13}}><Plus size={13}/>Nouvel arrêté</button>
      </div>

      {/* Filtres */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:14,padding:"10px 14px",background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:8}}>
        <span style={{fontSize:12,color:"#6B6A60",display:"flex",alignItems:"center",gap:4,flexShrink:0}}><Filter size={12}/>Filtrer :</span>

        {/* Tout afficher */}
        <button className={`filtre-btn${filtreTypes.size===0?" actif":""}`} style={{"--fc":"#1E3A5F"}}
          onClick={()=>setFiltreTypes(new Set())}>
          <Eye size={11}/>Tout
        </button>

        {/* Par type */}
        {typesPresents.map(code => {
          const t = TYPES_ARRETE.find(x=>x.code===code);
          const coul = COULEUR_TYPE[code]||"#6B6A60";
          const actif = filtreTypes.has(code);
          return (
            <button key={code} className={`filtre-btn${actif?" actif":""}`} style={{"--fc":coul}}
              onClick={()=>toggleFiltre(code)}>
              <span style={{width:8,height:8,borderRadius:"50%",background:actif?"#fff":coul,display:"inline-block"}}/>
              {t?.label||code}
            </button>
          );
        })}

        <div style={{height:16,width:1,background:"#E4E1D6",margin:"0 4px"}}/>

        {/* Arrêtés futurs */}
        <button className={`filtre-btn${showFuturs?" actif":""}`} style={{"--fc":"#6B7280"}}
          onClick={()=>setShowFuturs(v=>!v)}>
          <Clock size={11}/>{showFuturs?"Futurs visibles":"Futurs masqués"}
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:18,alignItems:"start"}}>
        {/* Carte SVG */}
        <div style={{border:"1px solid #E4E1D6",borderRadius:10,background:"#FFFFFF",padding:20,position:"relative"}}>
          <svg viewBox="0 0 360 340" style={{width:"100%",height:"auto",maxHeight:680}}
            onMouseLeave={()=>setTooltip(null)}>
            {/* Fond */}
            <rect width="360" height="340" fill="#F4F2EC" rx="4"/>
            {/* Îlots bâtis décoratifs */}
            <rect x="30" y="30" width="25" height="25" fill="#E8E4D8" rx="2"/>
            <rect x="130" y="200" width="30" height="30" fill="#E8E4D8" rx="2"/>
            <rect x="280" y="60" width="40" height="35" fill="#E8E4D8" rx="2"/>
            <rect x="200" y="290" width="35" height="25" fill="#E8E4D8" rx="2"/>

            {/* Voies */}
            {VOIES.map(v => {
              const coul = couleurVoie(v.id);
              const asList = arretesVoie(v.id);
              const actif = !!coul;
              const selectionne = arreteSelectionne && asList.some(a=>a.id===arreteSelectionne?.id);

              return v.isZone ? (
                <path key={v.id} d={v.path}
                  className="tr-voie"
                  fill={actif ? `${coul}44` : "#D8D5C822"}
                  stroke={actif ? coul : "#C9C6BA"}
                  strokeWidth={actif ? (selectionne?8:5) : 2}
                  opacity={arreteSelectionne && !selectionne && actif ? 0.4 : 1}
                  onMouseEnter={e => asList.length>0 && setTooltip({x:e.clientX,y:e.clientY,voie:v.nom,arretes:asList})}
                  onMouseLeave={()=>setTooltip(null)}
                  onClick={()=>setArreteSelectionne(asList[0]||null)}
                />
              ) : (
                <path key={v.id} d={v.path}
                  className="tr-voie"
                  fill="none"
                  stroke={actif ? coul : "#C9C6BA"}
                  strokeWidth={actif ? (selectionne?9:6) : 3}
                  strokeLinecap="round"
                  opacity={arreteSelectionne && !selectionne && actif ? 0.35 : 1}
                  onMouseEnter={e => asList.length>0 && setTooltip({x:e.clientX,y:e.clientY,voie:v.nom,arretes:asList})}
                  onMouseLeave={()=>setTooltip(null)}
                  onClick={()=>setArreteSelectionne(asList[0]||null)}
                />
              );
            })}

            {/* Pastilles sur les voies avec plusieurs arrêtés */}
            {Object.entries(impactsParVoie).filter(([,v])=>v.length>1).map(([vid,impacts])=>{
              const voie = VOIES.find(v=>v.id===vid);
              if(!voie) return null;
              return (
                <g key={`multi-${vid}`}>
                  <circle cx={voie.cx} cy={voie.cy} r={10} fill="#1C1F1B" opacity={0.85}/>
                  <text x={voie.cx} y={voie.cy+4} textAnchor="middle" fill="#fff" fontSize={10} fontFamily="'IBM Plex Mono',monospace" fontWeight="bold">{impacts.length}</text>
                </g>
              );
            })}

            {/* Étiquettes voies actives */}
            {VOIES.filter(v=>couleurVoie(v.id)).map(v=>(
              <text key={`lbl-${v.id}`} x={v.cx} y={v.cy-10} textAnchor="middle" fill="#1C1F1B"
                fontSize={8} fontFamily="'IBM Plex Sans',sans-serif" opacity={0.6} style={{pointerEvents:"none"}}>
                {v.nom.length>20?v.nom.slice(0,18)+"…":v.nom}
              </text>
            ))}
          </svg>

          {/* Légende impacts */}
          <div style={{display:"flex",flexWrap:"wrap",gap:"5px 12px",marginTop:10,paddingTop:10,borderTop:"1px solid #F0EDE4"}}>
            {TYPES_IMPACT.map(ti=>(
              <span key={ti.code} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#6B6A60"}}>
                <span style={{width:14,height:4,background:ti.couleur,borderRadius:2,display:"inline-block"}}/>
                {ti.label}
              </span>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip&&(
            <div className="tooltip" style={{position:"fixed",left:tooltip.x+12,top:tooltip.y-8}}>
              <p style={{fontWeight:600,margin:"0 0 4px"}}>{tooltip.voie}</p>
              {tooltip.arretes.map(a=>(
                <p key={a.id} style={{margin:"2px 0",display:"flex",alignItems:"center",gap:5}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:COULEUR_TYPE[a.type_code]||"#6B6A60",display:"inline-block",flexShrink:0}}/>
                  {a.titre}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Stats rapides */}
          <div style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:8,padding:"12px 14px"}}>
            <p style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#A6A399",margin:"0 0 8px"}}>Résumé · {AUJOURD_HUI.toLocaleDateString("fr-FR")}</p>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <Stat label="En cours" valeur={actifs.filter(a=>enCours(a)).length} couleur="#2F6B4F"/>
              <Stat label="À venir" valeur={actifs.filter(a=>futur(a)).length} couleur="#1E3A5F"/>
              <Stat label="Voies impactées" valeur={Object.keys(impactsParVoie).length} couleur="#D9730D"/>
            </div>
          </div>

          {/* Liste arrêtés affichés */}
          <div style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:8,padding:"12px 14px"}}>
            <p style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#A6A399",margin:"0 0 10px"}}>
              Arrêtés affichés ({arretesAffiches.length})
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {arretesAffiches.map(a=>{
                const sel=arreteSelectionne?.id===a.id;
                return(
                  <button key={a.id} onClick={()=>setArreteSelectionne(sel?null:a)}
                    style={{textAlign:"left",padding:"8px 10px",borderRadius:6,border:`1px solid ${sel?"#1E3A5F":"#E4E1D6"}`,background:sel?"#EBF0F7":"#FAFAF7",cursor:"pointer",width:"100%"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{width:9,height:9,borderRadius:"50%",background:COULEUR_TYPE[a.type_code]||"#6B6A60",flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:600,color:COULEUR_TYPE[a.type_code]||"#6B6A60",fontFamily:"'IBM Plex Mono',monospace"}}>{a.numero}</span>
                      {futur(a)&&<span style={{fontSize:9,background:"#EDE9FE",color:"#7C3AED",padding:"1px 5px",borderRadius:10,fontWeight:600}}>À venir</span>}
                    </div>
                    <p style={{fontSize:12,fontWeight:500,margin:"0 0 2px",lineHeight:1.3}}>{a.titre}</p>
                    <p style={{fontSize:11,color:"#A6A399",margin:0}}>{fmtDateCourte(a.date_debut)} → {fmtDateCourte(a.date_fin)}</p>
                  </button>
                );
              })}
              {arretesAffiches.length===0&&<p style={{fontSize:12,color:"#A6A399",textAlign:"center",padding:"12px 0"}}>Aucun arrêté avec ce filtre.</p>}
            </div>
          </div>

          {/* Détail arrêté sélectionné */}
          {arreteSelectionne&&(
            <div style={{background:"#FFFFFF",border:"1px solid #1E3A5F",borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <p style={{fontSize:11,fontWeight:600,color:"#1E3A5F",margin:0,fontFamily:"'IBM Plex Mono',monospace"}}>{arreteSelectionne.numero}</p>
                <button onClick={()=>setArreteSelectionne(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#A6A399",padding:0}}><X size={13}/></button>
              </div>
              <p style={{fontWeight:600,fontSize:13,margin:"0 0 6px"}}>{arreteSelectionne.titre}</p>
              <p style={{fontSize:12,color:"#6B6A60",margin:"0 0 6px"}}>{fmtDate(arreteSelectionne.date_debut)} → {fmtDate(arreteSelectionne.date_fin)}</p>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {(arreteSelectionne.troncons||[]).map(t=>{
                  const v=VOIES.find(x=>x.id===t.voie_id),ti=TYPES_IMPACT.find(x=>x.code===t.impact);
                  return <p key={t.voie_id} style={{margin:0,fontSize:11,display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:ti?.couleur,flexShrink:0}}/>{v?.nom} · {ti?.label}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Panneau Calendrier (dépliant) ── */}
      <div style={{marginTop:18,border:"1px solid #E4E1D6",borderRadius:10,background:"#FFFFFF",overflow:"hidden"}}>
        <button onClick={()=>setCalendrierOuvert(o=>!o)}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",background:calendrierOuvert?"#F4F2EC":"#FFFFFF",border:"none",cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif"}}>
          <span style={{display:"flex",alignItems:"center",gap:9}}>
            <Calendar size={16} color="#1E3A5F"/>
            <span className="fd" style={{fontSize:16,color:"#1C1F1B"}}>Calendrier des arrêtés</span>
            <span style={{fontSize:11,color:"#6B6A60"}}>— voir les arrêtés actifs et à venir par mois</span>
          </span>
          {calendrierOuvert?<ChevronUp size={17} color="#6B6A60"/>:<ChevronDown size={17} color="#6B6A60"/>}
        </button>
        {calendrierOuvert&&(
          <div style={{padding:"4px 18px 20px",borderTop:"1px solid #E4E1D6"}}>
            <VueCalendrier arretes={arretes}/>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({label,valeur,couleur}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:12,color:"#6B6A60"}}>{label}</span>
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:700,color:couleur}}>{valeur}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VUE CALENDRIER
// ─────────────────────────────────────────────────────────────────────────────
function VueCalendrier({ arretes }) {
  const [moisActuel, setMoisActuel] = useState(new Date(AUJOURD_HUI.getFullYear(), AUJOURD_HUI.getMonth(), 1));
  const [filtreTypes, setFiltreTypes] = useState(new Set());
  const [arreteSelectionne, setArreteSelectionne] = useState(null);

  const moisSuivant = () => setMoisActuel(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
  const moisPrecedent = () => setMoisActuel(d => new Date(d.getFullYear(), d.getMonth()-1, 1));

  const arretesVisibles = useMemo(() => {
    return arretes.filter(a => {
      if (a.statut === "abroge") return false;
      if (filtreTypes.size > 0 && !filtreTypes.has(a.type_code)) return false;
      return true;
    });
  }, [arretes, filtreTypes]);

  // Jours du mois
  const jours = useMemo(() => {
    const premier = new Date(moisActuel.getFullYear(), moisActuel.getMonth(), 1);
    const dernier = new Date(moisActuel.getFullYear(), moisActuel.getMonth()+1, 0);
    const debutSemaine = premier.getDay() === 0 ? 6 : premier.getDay()-1; // lundi=0
    const res = [];
    // Jours mois précédent
    for (let i=debutSemaine-1; i>=0; i--) {
      const d = new Date(premier); d.setDate(-i);
      res.push({date:d,autreMois:true});
    }
    // Jours du mois
    for (let d=1; d<=dernier.getDate(); d++) {
      res.push({date:new Date(moisActuel.getFullYear(),moisActuel.getMonth(),d),autreMois:false});
    }
    // Compléter jusqu'à 42 cases
    while (res.length < 42) {
      const last = res[res.length-1].date;
      const next = new Date(last); next.setDate(last.getDate()+1);
      res.push({date:next,autreMois:true});
    }
    return res;
  }, [moisActuel]);

  function arretesJour(date) {
    return arretesVisibles.filter(a => {
      if (!a.date_debut || !a.date_fin) return false;
      const debut = new Date(a.date_debut);
      const fin = new Date(a.date_fin);
      debut.setHours(0,0,0,0); fin.setHours(23,59,59,999);
      const d = new Date(date); d.setHours(12,0,0,0);
      return d >= debut && d <= fin;
    });
  }

  const typesPresents = [...new Set(arretes.filter(a=>a.statut!=="abroge").map(a=>a.type_code))];

  function toggleFiltre(code) {
    setFiltreTypes(prev => { const n=new Set(prev); n.has(code)?n.delete(code):n.add(code); return n; });
  }

  const JOURS_SEMAINE = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const MOIS_NOMS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  return (
    <div style={{paddingTop:16}}>
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button className="btn-ghost" onClick={moisPrecedent} style={{padding:"6px 10px"}}><ChevronLeft size={15}/></button>
          <span className="fd" style={{fontSize:16,minWidth:160,textAlign:"center"}}>
            {MOIS_NOMS[moisActuel.getMonth()]} {moisActuel.getFullYear()}
          </span>
          <button className="btn-ghost" onClick={moisSuivant} style={{padding:"6px 10px"}}><ChevronRight size={15}/></button>
        </div>
      </div>

      {/* Filtres types */}
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",marginBottom:14}}>
        <button className={`filtre-btn${filtreTypes.size===0?" actif":""}`} style={{"--fc":"#1E3A5F"}} onClick={()=>setFiltreTypes(new Set())}><Eye size={11}/>Tous</button>
        {typesPresents.map(code=>{
          const t=TYPES_ARRETE.find(x=>x.code===code);
          const coul=COULEUR_TYPE[code]||"#6B6A60";
          const actif=filtreTypes.has(code);
          return(
            <button key={code} className={`filtre-btn${actif?" actif":""}`} style={{"--fc":coul}} onClick={()=>toggleFiltre(code)}>
              <span style={{width:8,height:8,borderRadius:"50%",background:actif?"#fff":coul,display:"inline-block"}}/>
              {t?.label||code}
            </button>
          );
        })}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:18,alignItems:"start"}}>
        {/* Calendrier */}
        <div style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:10,padding:20}}>
          {/* En-têtes jours */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:8}}>
            {JOURS_SEMAINE.map(j=>(
              <div key={j} style={{textAlign:"center",fontSize:12,fontWeight:600,color:"#A6A399",padding:"4px 0"}}>{j}</div>
            ))}
          </div>
          {/* Cases */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {jours.map(({date,autreMois},i)=>{
              const isToday=date.toDateString()===AUJOURD_HUI.toDateString();
              const aj=arretesJour(date);
              const selDate=arreteSelectionne&&aj.some(a=>a.id===arreteSelectionne.id);
              return(
                <div key={i} className={`cal-day${autreMois?" other-month":""}${isToday?" today":""}`}
                  onClick={()=>aj.length>0&&setArreteSelectionne(selDate?null:aj[0])}
                  style={{cursor:aj.length>0?"pointer":"default",background:selDate?"#EBF0F7":"transparent"}}>
                  <p style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?"#1E3A5F":"#1C1F1B",margin:"0 0 4px",textAlign:"right"}}>{date.getDate()}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {aj.slice(0,4).map(a=>(
                      <div key={a.id} style={{borderRadius:4,padding:"2px 6px",fontSize:10,fontWeight:600,background:COULEUR_TYPE[a.type_code]||"#6B6A60",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.5}}>
                        {a.titre.length>22?a.titre.slice(0,20)+"…":a.titre}
                      </div>
                    ))}
                    {aj.length>4&&<div style={{fontSize:10,color:"#6B6A60",paddingLeft:5}}>+{aj.length-4} autre{aj.length-4>1?"s":""}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau latéral */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* Arrêtés du mois */}
          <div style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:8,padding:"12px 14px"}}>
            <p style={{fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",color:"#A6A399",margin:"0 0 10px"}}>
              {MOIS_NOMS[moisActuel.getMonth()]} {moisActuel.getFullYear()}
            </p>
            {(() => {
              const du_mois = arretesVisibles.filter(a => {
                const d=new Date(a.date_debut),f=new Date(a.date_fin);
                const debut_mois=new Date(moisActuel.getFullYear(),moisActuel.getMonth(),1);
                const fin_mois=new Date(moisActuel.getFullYear(),moisActuel.getMonth()+1,0);
                return d<=fin_mois&&f>=debut_mois;
              });
              if(du_mois.length===0) return <p style={{fontSize:12,color:"#A6A399",textAlign:"center",padding:"8px 0"}}>Aucun arrêté ce mois.</p>;
              return du_mois.map(a=>(
                <button key={a.id} onClick={()=>setArreteSelectionne(arreteSelectionne?.id===a.id?null:a)}
                  style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:6,border:`1px solid ${arreteSelectionne?.id===a.id?"#1E3A5F":"#E4E1D6"}`,background:arreteSelectionne?.id===a.id?"#EBF0F7":"#FAFAF7",cursor:"pointer",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:COULEUR_TYPE[a.type_code]||"#6B6A60",flexShrink:0}}/>
                    <span style={{fontSize:10,fontWeight:600,color:COULEUR_TYPE[a.type_code],fontFamily:"'IBM Plex Mono',monospace"}}>{a.numero}</span>
                    {new Date(a.date_debut)>AUJOURD_HUI&&<span style={{fontSize:9,background:"#EDE9FE",color:"#7C3AED",padding:"1px 5px",borderRadius:10,fontWeight:600}}>À venir</span>}
                  </div>
                  <p style={{fontSize:12,fontWeight:500,margin:"0 0 2px"}}>{a.titre}</p>
                  <p style={{fontSize:11,color:"#A6A399",margin:0}}>{fmtDateCourte(a.date_debut)} → {fmtDateCourte(a.date_fin)}</p>
                </button>
              ));
            })()}
          </div>

          {/* Détail sélectionné */}
          {arreteSelectionne&&(
            <div style={{background:"#FFFFFF",border:"1px solid #1E3A5F",borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <span style={{fontSize:10,fontWeight:600,color:"#1E3A5F",fontFamily:"'IBM Plex Mono',monospace"}}>{arreteSelectionne.numero}</span>
                <button onClick={()=>setArreteSelectionne(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#A6A399",padding:0}}><X size={12}/></button>
              </div>
              <p style={{fontWeight:600,fontSize:13,margin:"0 0 4px"}}>{arreteSelectionne.titre}</p>
              <p style={{fontSize:12,color:"#6B6A60",margin:"0 0 6px"}}>{fmtDate(arreteSelectionne.date_debut)} → {fmtDate(arreteSelectionne.date_fin)}</p>
              <p style={{fontSize:12,color:"#6B6A60",margin:"0 0 4px"}}>Par {arreteSelectionne.cree_par}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                {arreteSelectionne.voies.slice(0,4).map(v=>(
                  <span key={v} style={{fontSize:10,background:"#F4F2EC",color:"#6B6A60",padding:"2px 7px",borderRadius:10}}>{v}</span>
                ))}
                {arreteSelectionne.voies.length>4&&<span style={{fontSize:10,color:"#A6A399"}}>+{arreteSelectionne.voies.length-4}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS PARTAGÉS
// ─────────────────────────────────────────────────────────────────────────────
function Vide({texte}){ return <div style={{textAlign:"center",padding:"36px 20px",color:"#A6A399",fontSize:13}}>{texte}</div>; }

function ArreteLigne({arrete,onModifier,onAbroger,compact,archive}){
  const [ouvert,setOuvert]=useState(false);
  const statut=STATUT_UI[arrete.statut]||STATUT_UI.publie;
  const expire=estExpire(arrete);
  const peutModifier=!archive&&arrete.statut!=="abroge";
  return(
    <div className="card-hover" style={{border:"1px solid #E4E1D6",borderRadius:8,background:"#FFFFFF",padding:compact?"11px 13px":"13px 15px"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600,background:statut.bg,color:statut.color,whiteSpace:"nowrap"}}>
              {arrete.statut==="publie"&&<CheckCircle2 size={9}/>}{arrete.statut==="abroge"&&<AlertOctagon size={9}/>}{arrete.statut==="modifie"&&<GitBranch size={9}/>}{statut.label}
            </span>
            {expire&&arrete.statut!=="abroge"&&<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600,background:"#F3F4F6",color:"#6B7280",whiteSpace:"nowrap"}}><Archive size={9}/>Archivé auto.</span>}
            <span className="fm" style={{fontSize:10,color:"#6B6A60"}}>{arrete.numero}</span>
            <span style={{fontSize:10,color:"#A6A399"}}>{arrete.type_label}</span>
          </div>
          <p style={{fontWeight:600,fontSize:13,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{arrete.titre}</p>
          {!compact&&<p style={{fontSize:11,color:"#6B6A60",margin:"0 0 2px"}}>{fmtDate(arrete.date_debut)} → {fmtDate(arrete.date_fin)} · {arrete.cree_par}</p>}
          <p style={{fontSize:10,color:"#A6A399",margin:0}}>{arrete.voies.slice(0,2).join(", ")}{arrete.voies.length>2?` +${arrete.voies.length-2}`:""}</p>
          {arrete.arrete_abrogation&&<div style={{marginTop:6,background:"#FEE2E2",borderRadius:5,padding:"5px 9px",fontSize:10}}><p style={{fontWeight:600,color:"#B91C1C",margin:"0 0 1px",display:"flex",alignItems:"center",gap:3}}><AlertOctagon size={10}/>Abrogé par {arrete.arrete_abrogation.numero}</p><p style={{color:"#7F1D1D",margin:0}}>{arrete.arrete_abrogation.motif}</p></div>}
        </div>
        {!compact&&(
          <div style={{display:"flex",gap:5,flexShrink:0}}>
            {arrete.versions.length>0&&<button className="btn-secondary" onClick={()=>setOuvert(o=>!o)} style={{padding:"4px 9px",fontSize:10}}><GitBranch size={10}/>{arrete.versions.length}v {ouvert?<ChevronUp size={10}/>:<ChevronDown size={10}/>}</button>}
            {peutModifier&&<button className="btn-secondary" onClick={onModifier} style={{padding:"4px 9px",fontSize:10}}><Edit2 size={10}/>Modifier</button>}
            {peutModifier&&<button className="btn-danger" onClick={onAbroger} style={{padding:"4px 9px",fontSize:10}}><Trash2 size={10}/>Abroger</button>}
          </div>
        )}
      </div>
      {ouvert&&arrete.versions.length>0&&(
        <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #F0EDE4"}}>
          {arrete.versions.map((v,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"6px 8px",background:"#F9F8F5",borderRadius:4,marginBottom:4}}>
              <span className="fm" style={{fontSize:9,background:"#E5E7EB",color:"#6B7280",padding:"1px 4px",borderRadius:3,flexShrink:0,marginTop:1}}>v{v.version}</span>
              <div><p style={{fontWeight:600,fontSize:11,margin:"0 0 1px"}}>{v.titre}</p><p style={{fontSize:11,color:"#6B6A60",margin:"0 0 1px",fontStyle:"italic"}}>"{v.motif}"</p><p style={{fontSize:10,color:"#A6A399",margin:0}}>{fmtDate(v.date)} · {v.auteur}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModalConfirm({titre,message,icone,couleurIcone,labelOk,couleurOk,onOk,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#FFFFFF",borderRadius:12,padding:24,width:"100%",maxWidth:420,boxShadow:"0 20px 60px #0000002A"}}>
        <div style={{display:"flex",gap:12,marginBottom:14}}><div style={{width:40,height:40,borderRadius:"50%",background:couleurIcone,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icone}</div><div><h3 className="fd" style={{fontSize:16,margin:"0 0 4px"}}>{titre}</h3><p style={{fontSize:12,color:"#6B6A60",margin:0}}>{message}</p></div></div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button className="btn-secondary" onClick={onCancel}>Annuler</button><button onClick={onOk} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:couleurOk,color:"#FAFAF7",fontFamily:"'IBM Plex Sans',sans-serif"}}>{labelOk}</button></div>
      </div>
    </div>
  );
}

function ModalAbrogation({arrete,onOk,onCancel}){
  const [motif,setMotif]=useState("");
  return(
    <div style={{position:"fixed",inset:0,background:"#00000055",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#FFFFFF",borderRadius:12,padding:24,width:"100%",maxWidth:460,boxShadow:"0 20px 60px #0000002A"}}>
        <div style={{display:"flex",gap:12,marginBottom:12}}><div style={{width:40,height:40,borderRadius:"50%",background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><AlertOctagon size={18} color="#B91C1C"/></div><div><h3 className="fd" style={{fontSize:16,margin:"0 0 2px"}}>Abroger</h3><p className="fm" style={{fontSize:10,color:"#1E3A5F",margin:0}}>{arrete.numero}</p></div></div>
        <div style={{background:"#FEF3C7",borderRadius:5,padding:"7px 11px",marginBottom:12,fontSize:11,color:"#92400E"}}>Un arrêté d'abrogation sera généré automatiquement. L'original reste consultable.</div>
        <div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4}}>Motif <span style={{color:"#B91C1C"}}>*</span></label><textarea rows={3} placeholder="Ex. Travaux terminés, voie rouverte." value={motif} onChange={e=>setMotif(e.target.value)} style={{resize:"vertical",width:"100%",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:12,border:"1px solid #D8D5C8",borderRadius:4,padding:"7px 9px"}}/></div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:7}}><button className="btn-secondary" onClick={onCancel}>Annuler</button><button className="btn-danger" onClick={()=>motif.trim()&&onOk(motif)} style={{opacity:motif.trim()?1:0.5,cursor:motif.trim()?"pointer":"not-allowed",fontSize:12}}><AlertOctagon size={11}/>Générer l'abrogation</button></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VUE NOUVEAU (inchangée dans sa logique, compactée)
// ─────────────────────────────────────────────────────────────────────────────
function VueNouveau({etape,setEtape,typeArrete,valeurs,setValeurs,titreArrete,setTitreArrete,phases,phaseActive,setPhaseActive,phaseActuelle,tronconIdsActifs,totalTroncons,champsValides,modeEdition,setModeEdition,publie,dernierArrete,allerFormulaire,allerCarte,toggleTroncon,setImpactTroncon,setSegTroncon,ajouterPhase,supprimerPhase,updatePhase,publierArrete,retourAccueil,demarrerNouvel,setVue,nextIdx,refs}){
  return(
    <div style={{paddingTop:28,maxWidth:1200,margin:"0 auto"}}>
      {!publie&&(
        <>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:20,flexWrap:"wrap"}}>
            <button onClick={retourAccueil} className="btn-ghost" style={{padding:"4px 8px",fontSize:11}}><ChevronLeft size={12}/>Accueil</button>
            <div style={{width:1,height:12,background:"#D8D5C8"}}/>
            {(modeEdition?["Renseignements","Voies","Récapitulatif"]:["Type","Renseignements","Voies","Récapitulatif"]).map((lb,i)=>{
              const ep=modeEdition?i+1:i;
              return(
                <div key={lb} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,border:`1px solid ${ep===etape?"#1E3A5F":"#E4E1D6"}`,background:ep===etape?"#1E3A5F":ep<etape?"#EDEAE0":"transparent",color:ep===etape?"#FAFAF7":ep<etape?"#1C1F1B":"#A6A399",fontSize:11}}>
                    {ep<etape?<Check size={11}/>:<span className="fm" style={{fontSize:9}}>{i+1}</span>}
                    <span>{lb}</span>
                  </div>
                  {i<(modeEdition?2:3)&&<div style={{width:10,height:1,background:"#D8D5C8"}}/>}
                </div>
              );
            })}
          </div>
          {modeEdition&&<div style={{background:"#EBF0F7",border:"1px solid #BFCFDF",borderRadius:7,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"center",fontSize:12,color:"#1E3A5F"}}><Edit2 size={13}/><strong>Modification de {modeEdition.arrete.numero}</strong></div>}
        </>
      )}

      {etape===0&&!modeEdition&&(
        <div>
          <h2 className="fd" style={{fontSize:22,marginBottom:14}}>Type d'arrêté</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:9}}>
            {TYPES_ARRETE.map(t=>(
              <button key={t.code} onClick={()=>allerFormulaire(t)} className="card-hover" style={{textAlign:"left",padding:13,borderRadius:7,border:"1px solid #E4E1D6",background:"#FFFFFF",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                  <span className="fm" style={{fontSize:9,background:"#EDEAE0",color:"#6B6A60",padding:"2px 5px",borderRadius:3}}>{t.suffixe}</span>
                  {t.multi_phases&&<span style={{fontSize:9,background:"#EDE9FE",color:"#7C3AED",padding:"2px 5px",borderRadius:3,display:"flex",alignItems:"center",gap:2}}><Layers size={8}/>Phasé</span>}
                </div>
                <p style={{fontWeight:600,fontSize:12,margin:"0 0 2px"}}>{t.label}</p>
                <p style={{fontSize:11,color:"#6B6A60",margin:0}}>{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {etape===1&&typeArrete&&!publie&&(
        <div style={{maxWidth:520}}>
          <h2 className="fd" style={{fontSize:20,marginBottom:14}}>{modeEdition?"Modifier":"Renseignements"}</h2>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4}}>Titre <span style={{color:"#B91C1C"}}>*</span></label>
            <input type="text" placeholder="Ex. Réfection de chaussée — Rue de la République" value={titreArrete} onChange={e=>setTitreArrete(e.target.value)}/>
          </div>
          {modeEdition&&(
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:4}}>Motif de la modification <span style={{color:"#B91C1C"}}>*</span></label>
              <textarea rows={2} value={modeEdition.motif} onChange={e=>setModeEdition(p=>({...p,motif:e.target.value}))} style={{resize:"vertical"}}/>
            </div>
          )}
          {typeArrete.multi_phases&&<div style={{background:"#EDE9FE",borderRadius:5,padding:"8px 12px",marginBottom:10,display:"flex",gap:7,alignItems:"flex-start"}}><Layers size={12} color="#7C3AED" style={{marginTop:1,flexShrink:0}}/><p style={{fontSize:11,color:"#5B21B6",margin:0}}><strong>Phasé :</strong> {typeArrete.aide_phases}</p></div>}
          <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:16}}>
            {typeArrete.champs.filter(c=>typeArrete.multi_phases?c.type!=="adresse"&&c.type!=="datetime":true).map(c=><ChampFormulaire key={c.id} champ={c} valeur={valeurs[c.id]} onChange={v=>setValeurs(p=>({...p,[c.id]:v}))}/>)}
          </div>
          {typeArrete.multi_phases&&(
            <div style={{border:"1px solid #E4E1D6",borderRadius:7,padding:12,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <p style={{fontWeight:600,fontSize:12,margin:0,display:"flex",alignItems:"center",gap:4}}><Flag size={12}/>Phases</p>
                <button onClick={ajouterPhase} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,background:"none",border:"none",cursor:"pointer",color:"#1E3A5F",fontWeight:600}}><Plus size={11}/>Ajouter</button>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
                {phases.map((ph,i)=>(
                  <div key={ph.id} style={{display:"flex",alignItems:"center",gap:2}}>
                    <button onClick={()=>setPhaseActive(i)} className={`phase-tab${phaseActive===i?" active":""}`} style={{padding:"4px 10px",fontSize:11}}>{ph.label}</button>
                    {phases.length>1&&<button onClick={()=>supprimerPhase(i)} style={{background:"none",border:"none",cursor:"pointer",padding:2,color:"#A6A399"}}><X size={10}/></button>}
                  </div>
                ))}
              </div>
              {phases.map((ph,i)=>phaseActive===i&&(
                <div key={ph.id} style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                    <div><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:3}}>Début</label><input type="datetime-local" value={ph.date_debut} onChange={e=>updatePhase(i,"date_debut",e.target.value)}/></div>
                    <div><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:3}}>Fin</label><input type="datetime-local" value={ph.date_fin} onChange={e=>updatePhase(i,"date_fin",e.target.value)}/></div>
                  </div>
                  <div><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:3}}>Voies</label><input type="text" placeholder="Ex. Rue de la Paix…" value={ph.localisation} onChange={e=>updatePhase(i,"localisation",e.target.value)}/></div>
                  <div><label style={{fontSize:11,fontWeight:500,display:"block",marginBottom:3}}>Libellé</label><input type="text" placeholder={`Phase ${i+1}`} value={ph.label} onChange={e=>updatePhase(i,"label",e.target.value)}/></div>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button className="btn-ghost" onClick={()=>modeEdition?retourAccueil():setEtape(0)} style={{fontSize:12}}><ChevronLeft size={13}/>Retour</button>
            <button className="btn-primary" onClick={allerCarte} disabled={!champsValides} style={{fontSize:12}}>Identifier les voies <ChevronRight size={13}/></button>
          </div>
        </div>
      )}

      {etape===2&&typeArrete&&!publie&&(
        <div>
          <h2 className="fd" style={{fontSize:20,marginBottom:4}}>Voies & impacts</h2>
          <p style={{color:"#6B6A60",fontSize:12,marginBottom:10}}>Cliquez pour sélectionner ou retirer un tronçon.</p>
          {typeArrete.multi_phases&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{phases.map((ph,i)=><button key={ph.id} onClick={()=>setPhaseActive(i)} className={`phase-tab${phaseActive===i?" active":""}`} style={{padding:"4px 10px",fontSize:11}}>{ph.label} · {ph.troncons.length} voie{ph.troncons.length!==1?"s":""}</button>)}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:14}}>
            <div style={{border:"1px solid #E4E1D6",borderRadius:8,background:"#FFFFFF",padding:13}}>
              <svg viewBox="0 0 360 340" style={{width:"100%",height:"auto",maxHeight:420}}>
                <rect width="360" height="340" fill="#F4F2EC"/>
                {VOIES.map(v=>{
                  const troncon=phaseActuelle.troncons.find(t=>t.voie_id===v.id);
                  const sel=!!troncon,coul=sel?couleurImpact(troncon.impact):"#C9C6BA",larg=sel?7:3;
                  return v.isZone?<path key={v.id} d={v.path} className="tr-voie" fill={sel?`${coul}33`:"#C9C6BA22"} stroke={coul} strokeWidth={larg} onClick={()=>toggleTroncon(v.id)}/>:<path key={v.id} d={v.path} className="tr-voie" fill="none" stroke={coul} strokeWidth={larg} strokeLinecap="round" onClick={()=>toggleTroncon(v.id)}/>;
                })}
              </svg>
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px 10px",marginTop:8}}>{TYPES_IMPACT.map(ti=><span key={ti.code} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#6B6A60"}}><span style={{width:12,height:3,background:ti.couleur,borderRadius:2,display:"inline-block"}}/>{ti.label}</span>)}</div>
            </div>
            <div>
              <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6B6A60",margin:"0 0 6px"}}>Sélectionnées ({phaseActuelle.troncons.length})</p>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {phaseActuelle.troncons.map(t=>{
                  const v=VOIES.find(x=>x.id===t.voie_id);
                  return(
                    <div key={t.voie_id} style={{background:"#FFFFFF",border:"1px solid #E4E1D6",borderRadius:5,padding:"8px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,fontWeight:500,display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:couleurImpact(t.impact),flexShrink:0}}/>{v?.nom}</span><button onClick={()=>toggleTroncon(t.voie_id)} style={{background:"none",border:"none",cursor:"pointer",color:"#A6A399"}}><X size={11}/></button></div>
                      <select value={t.impact} onChange={e=>setImpactTroncon(t.voie_id,e.target.value)} style={{marginBottom:4,fontSize:11}}>{TYPES_IMPACT.map(ti=><option key={ti.code} value={ti.code}>{ti.label}</option>)}</select>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}><input type="text" placeholder="Début" value={t.segment_debut} onChange={e=>setSegTroncon(t.voie_id,"segment_debut",e.target.value)} style={{fontSize:10,padding:"3px 5px"}}/><input type="text" placeholder="Fin" value={t.segment_fin} onChange={e=>setSegTroncon(t.voie_id,"segment_fin",e.target.value)} style={{fontSize:10,padding:"3px 5px"}}/></div>
                    </div>
                  );
                })}
                {phaseActuelle.troncons.length===0&&<p style={{fontSize:11,color:"#A6A399",display:"flex",alignItems:"center",gap:4}}><AlertTriangle size={11}/>Cliquez sur la carte</p>}
              </div>
              <p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"#6B6A60",margin:"0 0 4px"}}>Autres voies</p>
              {VOIES.filter(v=>!tronconIdsActifs.has(v.id)).map(v=><button key={v.id} onClick={()=>toggleTroncon(v.id)} style={{display:"flex",alignItems:"center",gap:5,width:"100%",textAlign:"left",fontSize:11,color:"#6B6A60",background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}><span style={{width:8,height:8,borderRadius:"50%",border:"1px solid #C9C6BA",flexShrink:0}}/>{v.nom}</button>)}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
            <button className="btn-ghost" onClick={()=>setEtape(1)} style={{fontSize:12}}><ChevronLeft size={13}/>Retour</button>
            <button className="btn-primary" onClick={()=>setEtape(3)} disabled={totalTroncons===0} style={{background:totalTroncons>0?"#1E3A5F":"#D8D5C8",fontSize:12}}>Valider <ChevronRight size={13}/></button>
          </div>
        </div>
      )}

      {etape===3&&typeArrete&&!publie&&(
        <div style={{maxWidth:560}}>
          <h2 className="fd" style={{fontSize:20,marginBottom:12}}>Récapitulatif</h2>
          <div style={{border:"1px solid #E4E1D6",borderRadius:8,background:"#FFFFFF",padding:16,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",paddingBottom:10,marginBottom:10,borderBottom:"1px solid #E4E1D6"}}>
              <div><p style={{fontSize:10,color:"#6B6A60",margin:0}}>Numéro</p><p className="fm" style={{fontSize:14,color:"#1E3A5F",margin:0}}>{modeEdition?modeEdition.arrete.numero:genNum(typeArrete.suffixe,nextIdx)}</p></div>
              <span style={{fontSize:10,background:"#EDEAE0",color:"#6B6A60",padding:"3px 8px",borderRadius:4,alignSelf:"flex-start"}}>{typeArrete.label}</span>
            </div>
            <p style={{fontWeight:600,fontSize:13,margin:"0 0 8px"}}>{titreArrete}</p>
            {modeEdition&&<div style={{background:"#FEF3C7",borderRadius:5,padding:"8px 11px",marginBottom:10}}><p style={{fontSize:11,fontWeight:600,margin:"0 0 2px",color:"#92400E"}}>Motif</p><p style={{fontSize:12,margin:0,color:"#78350F"}}>{modeEdition.motif||"Non précisé"}</p></div>}
            <div style={{borderTop:"1px solid #E4E1D6",paddingTop:10}}>
              {phases.map(ph=>(
                <div key={ph.id} style={{marginBottom:7}}>
                  {phases.length>1&&<p style={{fontSize:11,fontWeight:600,color:"#1E3A5F",margin:"0 0 3px"}}>{ph.label}</p>}
                  {ph.troncons.map(t=>{const v=VOIES.find(x=>x.id===t.voie_id),ti=TYPES_IMPACT.find(x=>x.code===t.impact);return <p key={t.voie_id} style={{margin:"1px 0",fontSize:11,display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:ti?.couleur,flexShrink:0}}/><strong>{v?.nom}</strong> · {ti?.label}</p>;})}
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#F4F2EC",borderRadius:7,padding:"10px 14px",marginBottom:16,fontSize:11,color:"#6B6A60"}}>
            <p style={{fontWeight:600,margin:"0 0 4px",color:"#1C1F1B",fontSize:12}}>À la publication :</p>
            {[[FileText,modeEdition?"PDF mis à jour":"PDF officiel généré"],[MapPin,`Carte mise à jour (${totalTroncons} tronçon${totalTroncons>1?"s":""})`],[Check,"Diffusion aux services"]].map(([Icon,txt])=><p key={txt} style={{margin:"2px 0",display:"flex",alignItems:"center",gap:4}}><Icon size={11}/>{txt}</p>)}
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button className="btn-ghost" onClick={()=>setEtape(2)} style={{fontSize:12}}><ChevronLeft size={13}/>Retour</button>
            <button onClick={publierArrete} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"9px 20px",borderRadius:6,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",background:modeEdition?"#1E3A5F":"#2F6B4F",color:"#FAFAF7",fontFamily:"'IBM Plex Sans',sans-serif"}}>
              {modeEdition?<><RefreshCw size={12}/>Enregistrer</>:<><Check size={12}/>Publier</>}
            </button>
          </div>
        </div>
      )}

      {publie&&(
        <div style={{maxWidth:460}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:44,height:44,borderRadius:"50%",background:modeEdition?"#1E3A5F":"#2F6B4F",display:"flex",alignItems:"center",justifyContent:"center"}}>{modeEdition?<RefreshCw size={19} color="#FAFAF7"/>:<Check size={19} color="#FAFAF7"/>}</div>
            <div><h2 className="fd" style={{fontSize:20,margin:0}}>{modeEdition?"Modifié":"Publié"}</h2><p className="fm" style={{margin:0,fontSize:11,color:"#1E3A5F"}}>{dernierArrete?.numero}</p></div>
          </div>
          <p style={{color:"#1C1F1B",fontSize:13,fontWeight:500,margin:"0 0 3px"}}>{dernierArrete?.titre}</p>
          <p style={{color:"#6B6A60",fontSize:12,marginBottom:16}}>{modeEdition?"Version précédente archivée.":"PDF · Carte · Notifications."}</p>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-primary" onClick={retourAccueil} style={{fontSize:12}}><Home size={12}/>Accueil</button>
            <button className="btn-secondary" onClick={()=>{setVue("carte");}} style={{fontSize:12}}><Map size={12}/>Voir la carte</button>
            <button className="btn-ghost" onClick={demarrerNouvel} style={{fontSize:12}}><Plus size={12}/>Nouvel arrêté</button>
          </div>
        </div>
      )}
    </div>
  );
}

function VueReferences({refs,alertes,catRefActive,setCatRefActive,historiquesOuverts,toggleHistorique,refEnEdition,setRefEnEdition,mettreAJourRef,ajouterRef}){
  const rpc=(cat)=>refs.filter(r=>r.categorie===cat);
  return(
    <div style={{paddingTop:24,maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div><h2 className="fd" style={{fontSize:22,margin:"0 0 2px"}}>Références permanentes</h2><p style={{color:"#6B6A60",fontSize:13,margin:0}}>Insérées automatiquement dans les visas.</p></div>
        <button className="btn-primary" onClick={()=>setRefEnEdition({ref:{code:"",categorie:catRefActive,label:"",titulaire:"",numero:"",date:"",date_debut_validite:"",date_fin_validite:""},mode:"new"})} style={{fontSize:12}}><Plus size={13}/>Nouvelle</button>
      </div>
      {alertes.length>0&&<div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:7,padding:"9px 13px",marginBottom:14,display:"flex",gap:8,alignItems:"flex-start"}}><AlertCircle size={14} color="#92400E" style={{marginTop:1,flexShrink:0}}/><div><p style={{fontWeight:600,fontSize:12,margin:"0 0 3px",color:"#92400E"}}>{alertes.length} référence{alertes.length>1?"s":""} arrivent à expiration</p>{alertes.map(a=><p key={a.id} style={{fontSize:11,color:"#92400E",margin:"1px 0"}}>· {a.label}</p>)}</div></div>}
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:"1px solid #E4E1D6"}}>
        {CATEGORIES_REF.map(cat=>{const Icon=cat.icon;return(<button key={cat.code} onClick={()=>setCatRefActive(cat.code)} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",fontSize:12,border:"none",cursor:"pointer",borderBottom:catRefActive===cat.code?`2px solid ${cat.couleur}`:"2px solid transparent",background:"none",color:catRefActive===cat.code?cat.couleur:"#6B6A60",fontWeight:catRefActive===cat.code?600:400,fontFamily:"'IBM Plex Sans',sans-serif",marginBottom:-1}}><Icon size={12}/>{cat.label}<span style={{fontSize:10,background:"#EDEAE0",color:"#6B6A60",padding:"1px 5px",borderRadius:10,fontFamily:"'IBM Plex Mono',monospace"}}>{rpc(cat.code).length}</span></button>);} )}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {rpc(catRefActive).map(ref=>(
          <div key={ref.id} style={{border:"1px solid #E4E1D6",borderRadius:8,background:"#FFFFFF",padding:13}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:9}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600,background:"#D1FAE5",color:"#065F46"}}><CheckCircle2 size={9}/>Active</span>
                  <span className="fm" style={{fontSize:10,color:"#6B6A60"}}>{ref.numero}</span>
                  <span style={{fontSize:10,color:"#A6A399"}}>du {fmtDate(ref.date)}</span>
                </div>
                <p style={{fontWeight:600,fontSize:13,margin:"0 0 2px"}}>{ref.label}</p>
                {ref.titulaire&&<p style={{fontSize:11,color:"#6B6A60",margin:"0 0 2px",display:"flex",alignItems:"center",gap:4}}><Shield size={10}/>{ref.titulaire}</p>}
                {ref.date_fin_validite&&<p style={{fontSize:10,color:"#92400E",margin:0,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>Expire le {fmtDate(ref.date_fin_validite)}</p>}
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}}>
                {ref.historique?.length>0&&<button className="btn-secondary" onClick={()=>toggleHistorique(ref.id)} style={{padding:"4px 8px",fontSize:10}}><History size={10}/>{ref.historique.length}v {historiquesOuverts.has(ref.id)?<ChevronUp size={10}/>:<ChevronDown size={10}/>}</button>}
                <button className="btn-primary" onClick={()=>setRefEnEdition({ref:{...ref,nouveau_numero:ref.numero,nouvelle_date:new Date().toISOString().split("T")[0],nouveau_titulaire:ref.titulaire||"",date_debut_validite:new Date().toISOString().split("T")[0],date_fin_validite:ref.date_fin_validite||""},mode:"update"})} style={{padding:"4px 10px",fontSize:10}}><RefreshCw size={10}/>MAJ</button>
              </div>
            </div>
            {historiquesOuverts.has(ref.id)&&ref.historique?.length>0&&(
              <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid #F0EDE4"}}>
                {ref.historique.map((h,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 8px",background:"#F9F8F5",borderRadius:4,marginBottom:4,fontSize:10}}><span style={{display:"inline-flex",alignItems:"center",gap:2,padding:"1px 5px",borderRadius:10,fontSize:9,fontWeight:600,background:"#F3F4F6",color:"#6B7280"}}><Archive size={8}/>Archivé</span><span className="fm" style={{color:"#6B6A60"}}>{h.numero}</span><span style={{color:"#A6A399"}}>du {fmtDate(h.date)}</span>{h.titulaire&&<span style={{color:"#6B6A60"}}>· {h.titulaire}</span>}<span style={{marginLeft:"auto",color:"#A6A399"}}>jusqu'au {fmtDate(h.date_fin)}</span></div>)}
              </div>
            )}
          </div>
        ))}
      </div>
      {refEnEdition&&<ModalRef refEnEdition={refEnEdition} onSave={data=>refEnEdition.mode==="new"?ajouterRef(data):mettreAJourRef(refEnEdition.ref.id,data)} onCancel={()=>setRefEnEdition(null)} categorieActive={catRefActive}/>}
    </div>
  );
}

function ModalRef({refEnEdition,onSave,onCancel,categorieActive}){
  const isNew=refEnEdition.mode==="new";
  const [form,setForm]=useState(isNew?{code:"",categorie:categorieActive,label:"",titulaire:"",numero:"",date:new Date().toISOString().split("T")[0],date_debut_validite:new Date().toISOString().split("T")[0],date_fin_validite:""}:{nouveau_numero:refEnEdition.ref.numero,nouvelle_date:new Date().toISOString().split("T")[0],nouveau_titulaire:refEnEdition.ref.titulaire||"",date_debut_validite:new Date().toISOString().split("T")[0],date_fin_validite:refEnEdition.ref.date_fin_validite||""});
  const f=(field,val)=>setForm(p=>({...p,[field]:val}));
  const L=({children})=><label style={{display:"block",fontSize:12,fontWeight:500,marginBottom:4}}>{children}</label>;
  function handleSave(){ isNew?onSave({...form,actif:true}):onSave({numero:form.nouveau_numero,date:form.nouvelle_date,titulaire:form.nouveau_titulaire||null,date_debut_validite:form.date_debut_validite,date_fin_validite:form.date_fin_validite}); }
  return(
    <div style={{position:"fixed",inset:0,background:"#00000044",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#FFFFFF",borderRadius:11,padding:24,width:"100%",maxWidth:470,boxShadow:"0 20px 60px #0000002A"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 className="fd" style={{fontSize:16,margin:0}}>{isNew?"Nouvelle référence":"Mettre à jour"}</h3><button onClick={onCancel} style={{background:"none",border:"none",cursor:"pointer",color:"#6B6A60"}}><X size={16}/></button></div>
        {!isNew&&<div style={{background:"#EBF0F7",borderRadius:5,padding:"8px 11px",marginBottom:11,fontSize:11,color:"#1E3A5F"}}><strong>Note :</strong> L'ancienne version sera archivée. Les arrêtés déjà publiés conservent leur visa.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {isNew&&<><div><L>Libellé</L><input type="text" value={form.label} onChange={e=>f("label",e.target.value)} placeholder="Ex. Zone 30"/></div><div><L>Catégorie</L><select value={form.categorie} onChange={e=>f("categorie",e.target.value)}>{CATEGORIES_REF.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}</select></div>{form.categorie==="delegation"&&<div><L>Titulaire</L><input type="text" value={form.titulaire} onChange={e=>f("titulaire",e.target.value)}/></div>}</>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><L>{isNew?"Numéro":"Nouveau numéro"}</L><input type="text" value={isNew?form.numero:form.nouveau_numero} onChange={e=>f(isNew?"numero":"nouveau_numero",e.target.value)} placeholder="045/2026"/></div>
            <div><L>Date</L><input type="text" value={isNew?form.date:form.nouvelle_date} onChange={e=>f(isNew?"date":"nouvelle_date",e.target.value)} placeholder="AAAA-MM-JJ"/></div>
          </div>
          {!isNew&&refEnEdition.ref.categorie==="delegation"&&<div><L>Nouveau titulaire</L><input type="text" value={form.nouveau_titulaire} onChange={e=>f("nouveau_titulaire",e.target.value)}/></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><L>Valide à partir du</L><input type="text" value={form.date_debut_validite} onChange={e=>f("date_debut_validite",e.target.value)} placeholder="AAAA-MM-JJ"/></div>
            <div><L>Expire le (facultatif)</L><input type="text" value={form.date_fin_validite} onChange={e=>f("date_fin_validite",e.target.value)} placeholder="AAAA-MM-JJ"/></div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:16}}><button className="btn-secondary" onClick={onCancel} style={{fontSize:12}}>Annuler</button><button className="btn-primary" onClick={handleSave} style={{fontSize:12}}><Check size={12}/>{isNew?"Ajouter":"Enregistrer"}</button></div>
      </div>
    </div>
  );
}

function ChampFormulaire({champ,valeur,onChange}){
  const L=({children})=><label style={{display:"block",fontSize:12,fontWeight:500,marginBottom:4}}>{children}</label>;
  if(champ.type==="select") return <div><L>{champ.label}</L><select value={valeur||""} onChange={e=>onChange(e.target.value)}><option value="" disabled>Sélectionner…</option>{champ.options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>;
  if(champ.type==="bool") return <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,fontWeight:500}}>{champ.label}</span><button onClick={()=>onChange(!valeur)} aria-pressed={!!valeur} style={{width:40,height:22,borderRadius:11,background:valeur?"#1E3A5F":"#D8D5C8",border:"none",cursor:"pointer",position:"relative",transition:"background .2s"}}><span style={{position:"absolute",top:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"transform .2s",transform:valeur?"translateX(20px)":"translateX(2px)"}}/></button></div>;
  if(champ.type==="datetime") return <div><L>{champ.label}</L><input type="datetime-local" value={valeur||""} onChange={e=>onChange(e.target.value)}/></div>;
  return <div><L>{champ.label}</L><input type="text" placeholder={champ.placeholder||""} value={valeur||""} onChange={e=>onChange(e.target.value)}/></div>;
}
