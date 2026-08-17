/**
 * Registre réglementaire des arrêtés — conforme art. L2122-29 CGCT.
 *
 * Chaque commune doit tenir un registre chronologique de ses arrêtés.
 * Ce module gère :
 * - La numérotation annuelle automatique (ARR-YYYY-NNNN)
 * - L'historique du registre par année
 * - L'export PDF du registre
 * - La clôture annuelle
 */
import type { Arrete, StatutArrete } from "@/types";

// ──── Types ────

export interface EntreeRegistre {
  /** Numéro d'ordre dans le registre (auto-incrémenté par année) */
  numero_ordre: number;
  /** Numéro officiel de l'arrêté au registre : ARR-YYYY-NNNN */
  numero_registre: string;
  /** ID de l'arrêté dans le système */
  arrete_id: string;
  /** Numéro interne de l'arrêté (AR-2026-xxxx-STA…) */
  numero_arrete: string;
  /** Titre de l'arrêté */
  titre: string;
  /** Type d'arrêté */
  type_label: string;
  /** Date d'inscription au registre (= date de publication) */
  date_inscription: string;
  /** Auteur de l'inscription */
  auteur: string;
  /** Statut au moment de l'inscription */
  statut: StatutArrete;
  /** Voies concernées */
  voies: string[];
  /** Date de début de validité */
  date_debut: string;
  /** Date de fin de validité */
  date_fin: string;
  /** Date d'abrogation (si applicable) */
  date_abrogation?: string;
  /** Observations */
  observations?: string;
}

export interface RegistreAnnuel {
  /** Année du registre */
  annee: number;
  /** ID du tenant */
  tenant_id: string;
  /** Entrées du registre triées par numéro d'ordre */
  entrees: EntreeRegistre[];
  /** Registre clôturé ? */
  cloture: boolean;
  /** Date de clôture */
  date_cloture?: string;
  /** Auteur de la clôture */
  auteur_cloture?: string;
}

// ──── Clé localStorage ────

const CLE_REGISTRE_PREFIX = "registre_officiel_";

function cleRegistre(tenantId: string, annee: number): string {
  return `${CLE_REGISTRE_PREFIX}${tenantId}_${annee}`;
}

function lire<T>(cle: string, defaut: T): T {
  try {
    const raw = localStorage.getItem(cle);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return defaut;
}

function ecrire<T>(cle: string, valeur: T): void {
  localStorage.setItem(cle, JSON.stringify(valeur));
}

// ──── API du registre ────

/** Retourne le registre d'une année donnée pour un tenant. */
export function getRegistre(tenantId: string, annee: number): RegistreAnnuel {
  return lire<RegistreAnnuel>(cleRegistre(tenantId, annee), {
    annee,
    tenant_id: tenantId,
    entrees: [],
    cloture: false,
  });
}

/** Sauvegarde un registre annuel. */
export function sauvegarderRegistre(registre: RegistreAnnuel): void {
  ecrire(cleRegistre(registre.tenant_id, registre.annee), registre);
}

/** Retourne les années pour lesquelles un registre existe. */
export function getAnneesRegistre(tenantId: string): number[] {
  const annees: number[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${CLE_REGISTRE_PREFIX}${tenantId}_`)) {
      const annee = parseInt(key.split("_").pop() ?? "", 10);
      if (!isNaN(annee)) annees.push(annee);
    }
  }
  // Toujours inclure l'année en cours
  const anneeCourante = new Date().getFullYear();
  if (!annees.includes(anneeCourante)) {
    annees.push(anneeCourante);
  }
  return annees.sort((a, b) => b - a);
}

/** Prochain numéro d'ordre pour l'année en cours. */
export function prochainNumeroOrdre(tenantId: string, annee: number): number {
  const registre = getRegistre(tenantId, annee);
  if (registre.entrees.length === 0) return 1;
  return Math.max(...registre.entrees.map((e) => e.numero_ordre)) + 1;
}

/** Génère le numéro officiel du registre : ARR-2026-0001 */
export function genererNumeroRegistre(annee: number, ordre: number): string {
  return `ARR-${annee}-${String(ordre).padStart(4, "0")}`;
}

/**
 * Inscrit un arrêté au registre.
 * Appelé automatiquement lorsqu'un arrêté est publié.
 * Retourne le numéro de registre attribué.
 */
export function inscrireAuRegistre(
  tenantId: string,
  arrete: Arrete,
  auteur: string,
): string {
  const annee = new Date().getFullYear();
  const registre = getRegistre(tenantId, annee);

  // Vérifier que le registre n'est pas clôturé
  if (registre.cloture) {
    throw new Error(`Le registre ${annee} est cloture. Impossible d'inscrire de nouveaux arretes.`);
  }

  // Vérifier que l'arrêté n'est pas déjà inscrit
  const dejaInscrit = registre.entrees.find((e) => e.arrete_id === arrete.id);
  if (dejaInscrit) {
    return dejaInscrit.numero_registre;
  }

  const ordre = prochainNumeroOrdre(tenantId, annee);
  const numeroRegistre = genererNumeroRegistre(annee, ordre);

  const entree: EntreeRegistre = {
    numero_ordre: ordre,
    numero_registre: numeroRegistre,
    arrete_id: arrete.id,
    numero_arrete: arrete.numero,
    titre: arrete.titre,
    type_label: arrete.type_label,
    date_inscription: new Date().toISOString().split("T")[0]!,
    auteur,
    statut: arrete.statut,
    voies: arrete.voies,
    date_debut: arrete.date_debut,
    date_fin: arrete.date_fin,
  };

  registre.entrees.push(entree);
  sauvegarderRegistre(registre);

  return numeroRegistre;
}

/**
 * Met à jour une entrée existante (ex: abrogation).
 */
export function majEntreeRegistre(
  tenantId: string,
  arreteId: string,
  updates: Partial<Pick<EntreeRegistre, "statut" | "date_abrogation" | "observations">>,
): void {
  const annees = getAnneesRegistre(tenantId);
  for (const annee of annees) {
    const registre = getRegistre(tenantId, annee);
    const idx = registre.entrees.findIndex((e) => e.arrete_id === arreteId);
    if (idx >= 0) {
      registre.entrees[idx] = { ...registre.entrees[idx]!, ...updates };
      sauvegarderRegistre(registre);
      return;
    }
  }
}

/**
 * Clôture le registre d'une année.
 * Après clôture, aucun nouvel arrêté ne peut être inscrit sur cette année.
 */
export function cloturerRegistre(
  tenantId: string,
  annee: number,
  auteur: string,
): void {
  const registre = getRegistre(tenantId, annee);
  registre.cloture = true;
  registre.date_cloture = new Date().toISOString().split("T")[0]!;
  registre.auteur_cloture = auteur;
  sauvegarderRegistre(registre);
}

/**
 * Synchronise le registre avec les arrêtés existants.
 * Parcourt tous les arrêtés publiés du tenant et inscrit ceux
 * qui ne sont pas encore au registre.
 */
export function synchroniserRegistre(
  tenantId: string,
  arretes: Arrete[],
  auteur: string,
): number {
  let inscrits = 0;
  const arretesPub = arretes.filter(
    (a) => a.statut === "publie" || a.statut === "modifie" || a.statut === "abroge",
  );

  for (const arrete of arretesPub) {
    // Déterminer l'année d'inscription (basée sur date_creation)
    const annee = arrete.date_creation
      ? new Date(arrete.date_creation).getFullYear()
      : new Date().getFullYear();
    const registre = getRegistre(tenantId, annee);

    if (registre.cloture) continue;

    const dejaInscrit = registre.entrees.some((e) => e.arrete_id === arrete.id);
    if (!dejaInscrit) {
      inscrireAuRegistre(tenantId, arrete, auteur);
      inscrits++;
    }
  }

  return inscrits;
}

// ──── Export PDF du registre ────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateFr(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

/**
 * Ouvre le PDF du registre dans un nouvel onglet.
 */
export function ouvrirPdfRegistre(
  registre: RegistreAnnuel,
  nomCommune: string,
): void {
  const commune = nomCommune.replace(/^Ville de /i, "");
  const statutLabel = (s: StatutArrete): string => {
    const map: Record<StatutArrete, string> = {
      brouillon: "Brouillon",
      en_relecture: "En relecture",
      valide: "Valide",
      publie: "Publie",
      modifie: "Modifie",
      abroge: "Abroge",
    };
    return map[s] ?? s;
  };

  const lignes = registre.entrees
    .sort((a, b) => a.numero_ordre - b.numero_ordre)
    .map(
      (e) => `
      <tr>
        <td style="text-align:center;font-weight:bold;">${e.numero_ordre}</td>
        <td style="font-family:'Courier New',monospace;font-size:9pt;">${escapeHtml(e.numero_registre)}</td>
        <td>${formatDateFr(e.date_inscription)}</td>
        <td>${escapeHtml(e.titre)}</td>
        <td style="font-size:9pt;">${escapeHtml(e.type_label)}</td>
        <td style="font-size:9pt;">${escapeHtml(e.voies.join(", "))}</td>
        <td style="font-size:9pt;">${formatDateFr(e.date_debut)}</td>
        <td style="font-size:9pt;">${formatDateFr(e.date_fin)}</td>
        <td style="text-align:center;">${statutLabel(e.statut)}</td>
        <td style="font-size:8pt;color:#666;">${e.observations ? escapeHtml(e.observations) : ""}</td>
      </tr>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Registre des arretes ${registre.annee} — ${escapeHtml(commune)}</title>
<style>
  @page { size: A4 landscape; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", serif;
    font-size: 11pt;
    color: #1C1F1B;
    max-width: 280mm;
    margin: 0 auto;
    padding: 8mm;
  }
  @media print {
    body { padding: 0; max-width: none; }
  }
  .header { text-align: center; margin-bottom: 16pt; }
  .header .republique {
    font-size: 9pt; color: #666;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .header .commune {
    font-size: 14pt; font-weight: bold;
    color: #1E3A5F; text-transform: uppercase;
    margin: 4pt 0;
  }
  .header .titre-registre {
    font-size: 16pt; font-weight: bold;
    margin: 8pt 0 4pt;
    text-decoration: underline;
  }
  .header .annee {
    font-size: 13pt; font-weight: bold;
    color: #1E3A5F;
  }
  .cloture-info {
    text-align: center;
    font-size: 10pt;
    color: #065F46;
    background: #ECFDF5;
    padding: 4pt 8pt;
    border-radius: 3pt;
    margin: 8pt auto;
    max-width: 400pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12pt;
  }
  th {
    background: #1E3A5F;
    color: white;
    font-size: 9pt;
    padding: 6pt 4pt;
    text-align: left;
    font-weight: bold;
  }
  td {
    padding: 5pt 4pt;
    border-bottom: 0.5pt solid #D8D5C8;
    font-size: 10pt;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #F9F8F5; }
  .footer {
    margin-top: 20pt;
    padding-top: 8pt;
    border-top: 1pt solid #D8D5C8;
    font-size: 8pt;
    color: #666;
    text-align: center;
  }
  .stats {
    margin-top: 16pt;
    font-size: 10pt;
    color: #4A5568;
  }
  @media screen {
    body { background: #f5f5f0; }
    .page {
      background: white;
      padding: 15mm;
      margin: 8mm auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .print-hint {
      text-align: center;
      padding: 6pt 12pt;
      background: #1E3A5F;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 11pt;
      margin-bottom: 8mm;
      border-radius: 4pt;
      max-width: 280mm;
      margin-left: auto;
      margin-right: auto;
    }
    .print-hint button {
      background: white;
      color: #1E3A5F;
      border: none;
      padding: 4pt 14pt;
      border-radius: 3pt;
      font-weight: bold;
      cursor: pointer;
      margin-left: 8pt;
      font-size: 11pt;
    }
  }
  @media print {
    .print-hint { display: none; }
    .page { box-shadow: none; margin: 0; padding: 0; }
  }
</style>
</head>
<body>
<div class="print-hint">
  Registre des arretes ${registre.annee} — Ctrl+P pour imprimer ou enregistrer en PDF
  <button onclick="window.print()">Imprimer</button>
</div>
<div class="page">
  <div class="header">
    <div class="republique">Republique Francaise</div>
    <div class="commune">Mairie de ${escapeHtml(commune)}</div>
    <div class="titre-registre">Registre des Arretes Municipaux</div>
    <div class="annee">Annee ${registre.annee}</div>
  </div>

  ${registre.cloture ? `<div class="cloture-info">Registre cloture le ${formatDateFr(registre.date_cloture ?? "")} par ${escapeHtml(registre.auteur_cloture ?? "")}</div>` : ""}

  <table>
    <thead>
      <tr>
        <th style="width:4%">N°</th>
        <th style="width:10%">N° Registre</th>
        <th style="width:10%">Date</th>
        <th style="width:18%">Objet</th>
        <th style="width:10%">Type</th>
        <th style="width:14%">Voies</th>
        <th style="width:9%">Debut</th>
        <th style="width:9%">Fin</th>
        <th style="width:7%">Statut</th>
        <th style="width:9%">Obs.</th>
      </tr>
    </thead>
    <tbody>
      ${lignes || '<tr><td colspan="10" style="text-align:center;color:#666;padding:20pt;">Aucun arrete inscrit au registre pour cette annee.</td></tr>'}
    </tbody>
  </table>

  <div class="stats">
    <strong>Total :</strong> ${registre.entrees.length} arrete(s) inscrit(s)
    ${registre.entrees.filter((e) => e.statut === "abroge").length > 0
      ? ` dont ${registre.entrees.filter((e) => e.statut === "abroge").length} abroge(s)`
      : ""
    }
  </div>

  <div class="footer">
    Registre officiel des arretes municipaux — Mairie de ${escapeHtml(commune)} — ${registre.annee}
    <br>Document genere le ${formatDateFr(new Date().toISOString().split("T")[0]!)} — Actes360
  </div>
</div>
</body>
</html>`;

  const fenetre = window.open("", "_blank");
  if (fenetre) {
    fenetre.document.write(html);
    fenetre.document.close();
  }
}
