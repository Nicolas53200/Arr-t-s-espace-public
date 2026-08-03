import type { Arrete, Reference, TenantInfo, Troncon, CodeImpact } from "@/types";

const LABELS_IMPACT: Record<CodeImpact, string> = {
  circulation_interdite: "Circulation interdite",
  stationnement_interdit: "Stationnement interdit",
  deviation: "Deviation",
  zone_reservee: "Zone reservee",
  passage_maintenu: "Passage secours maintenu",
  alternat: "Alternat",
};

function buildVoiesParImpact(
  troncons: Troncon[],
  voies: string[],
): Map<CodeImpact, { label: string; segment: string }[]> {
  const grouped = new Map<CodeImpact, { label: string; segment: string }[]>();

  for (const t of troncons) {
    if (t.impact === "deviation") continue;
    const voieName = t.label || voies.find((v) => v.toLowerCase().includes(t.voie_id.toLowerCase())) || t.voie_id;
    const segment = t.segment_debut && t.segment_fin
      ? `du n°${t.segment_debut} au n°${t.segment_fin}`
      : "toute la rue";
    const list = grouped.get(t.impact) ?? [];
    list.push({ label: voieName, segment });
    grouped.set(t.impact, list);
  }

  return grouped;
}

function buildArticleVoiesHtml(troncons: Troncon[], voies: string[]): string {
  if (troncons.length === 0) {
    const items = voies.map((v) => `<li>${escapeHtml(v)}</li>`).join("\n");
    return `<ul>\n${items}\n</ul>`;
  }

  const grouped = buildVoiesParImpact(troncons, voies);
  if (grouped.size === 0) {
    const items = voies.map((v) => `<li>${escapeHtml(v)}</li>`).join("\n");
    return `<ul>\n${items}\n</ul>`;
  }

  let html = "";
  for (const [impact, entries] of grouped) {
    html += `<p style="margin:6pt 0 2pt;font-weight:bold;">${escapeHtml(LABELS_IMPACT[impact])} :</p>\n<ul>\n`;
    for (const entry of entries) {
      html += `<li>${escapeHtml(entry.label)} (${escapeHtml(entry.segment)})</li>\n`;
    }
    html += `</ul>\n`;
  }
  return html;
}

function buildArticleDeviationHtml(troncons: Troncon[], voies: string[]): string {
  const deviations = troncons.filter((t) => t.impact === "deviation");
  if (deviations.length === 0) return "";

  let html = `<div class="article">
    <p class="article-titre">Article 3 — Itineraire de deviation</p>
    <div class="article-contenu">
      <ul>\n`;
  for (const t of deviations) {
    const voieName = t.label || voies.find((v) => v.toLowerCase().includes(t.voie_id.toLowerCase())) || t.voie_id;
    html += `        <li>${escapeHtml(voieName)}</li>\n`;
  }
  html += `      </ul>
    </div>
  </div>`;
  return html;
}

function buildAnnexeHtml(troncons: Troncon[]): string {
  const hasCoords = troncons.some((t) => t.coordonnees && t.coordonnees.length > 0);
  if (!hasCoords) return "";
  return `<div class="article" style="margin-top:18pt;">
    <p class="article-titre">Annexe : Plan de deviation joint</p>
    <p class="article-contenu">Le plan annexe au present arrete materialise les itineraires de deviation et les zones d'impact.</p>
  </div>`;
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extraireNomCommune(nomTenant: string): string {
  return nomTenant.replace(/^Ville de /, "");
}

export function ouvrirApercuPdf(
  arrete: Arrete,
  references: Reference[],
  nomCommune: string,
  codePostal: string,
  tenant?: TenantInfo,
): void {
  const commune = extraireNomCommune(nomCommune);
  const refsActives = references.filter((r) => r.actif);

  const visasHtml = refsActives
    .map(
      (r) =>
        `<p class="visa">VU ${escapeHtml(r.label)} (n° ${escapeHtml(r.numero)} du ${formatDateFr(r.date)}) ;</p>`,
    )
    .join("\n");

  const voiesDetailHtml = buildArticleVoiesHtml(arrete.troncons, arrete.voies);
  const hasDeviation = arrete.troncons.some((t) => t.impact === "deviation");
  const deviationHtml = buildArticleDeviationHtml(arrete.troncons, arrete.voies);
  const annexeHtml = buildAnnexeHtml(arrete.troncons);
  const articleOffset = hasDeviation ? 1 : 0;

  const logoHtml = tenant?.logo
    ? `<img src="${tenant.logo}" alt="" class="logo-mairie" />`
    : "";

  const deviseHtml = tenant?.devise
    ? `<div class="devise">${escapeHtml(tenant.devise)}</div>`
    : "";

  const adresseHtml = tenant?.adresse
    ? `<div class="adresse-mairie">${escapeHtml(tenant.adresse)}</div>`
    : `<div class="code-postal">Code postal : ${escapeHtml(codePostal)}</div>`;

  const contactHtml = [
    tenant?.telephone ? `Tel. ${escapeHtml(tenant.telephone)}` : "",
    tenant?.email_contact ? escapeHtml(tenant.email_contact) : "",
  ].filter(Boolean).join(" — ");

  const titreMaire = tenant?.titre_maire ?? "Le Maire";
  const nomMaire = tenant?.nom_maire ?? arrete.cree_par;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(arrete.numero)} — ${escapeHtml(arrete.titre)}</title>
<style>
  @page {
    size: A4;
    margin: 25mm 20mm 20mm 20mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Times New Roman", "Liberation Serif", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #1C1F1B;
    max-width: 170mm;
    margin: 0 auto;
    padding: 10mm;
  }
  @media print {
    body { padding: 0; max-width: none; }
  }
  .header {
    text-align: center;
    margin-bottom: 20pt;
  }
  .logo-mairie {
    max-height: 60pt;
    max-width: 120pt;
    margin-bottom: 8pt;
    object-fit: contain;
  }
  .header .republique {
    font-size: 10pt;
    color: #6B6A60;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .header .devise {
    font-size: 9pt;
    color: #6B6A60;
    font-style: italic;
    margin: 2pt 0 4pt;
  }
  .header .commune {
    font-size: 16pt;
    font-weight: bold;
    color: #1E3A5F;
    text-transform: uppercase;
    margin: 4pt 0;
  }
  .header .adresse-mairie {
    font-size: 9pt;
    color: #6B6A60;
  }
  .header .code-postal {
    font-size: 9pt;
    color: #6B6A60;
  }
  .header .contact-mairie {
    font-size: 8pt;
    color: #A6A399;
    margin-top: 2pt;
  }
  .separator {
    border: none;
    border-top: 1px solid #D8D5C8;
    margin: 14pt 0;
  }
  .titre-arrete {
    text-align: center;
    margin-bottom: 18pt;
  }
  .titre-arrete .label-arrete {
    font-size: 9pt;
    color: #6B6A60;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }
  .titre-arrete .numero {
    font-size: 13pt;
    font-weight: bold;
    color: #1E3A5F;
    margin: 4pt 0;
    font-family: "Courier New", Courier, monospace;
  }
  .titre-arrete .titre {
    font-size: 14pt;
    font-weight: bold;
    margin: 4pt 0;
  }
  .titre-arrete .type-label {
    font-size: 10pt;
    color: #6B6A60;
  }
  .maire {
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    margin: 14pt 0;
  }
  .visa {
    font-size: 11pt;
    margin: 2pt 0 2pt 20pt;
    text-indent: -20pt;
    padding-left: 20pt;
  }
  .section-titre {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin: 12pt 0 6pt;
  }
  .considerant {
    font-size: 11pt;
    margin: 2pt 0 2pt 20pt;
  }
  .arrete-header {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    color: #1E3A5F;
    margin: 18pt 0 12pt;
    letter-spacing: 0.2em;
  }
  .article {
    margin-bottom: 12pt;
  }
  .article-titre {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin-bottom: 4pt;
  }
  .article-contenu {
    font-size: 11pt;
    margin-left: 20pt;
  }
  .article-contenu ul {
    margin: 4pt 0;
    padding-left: 16pt;
  }
  .article-contenu li {
    margin: 2pt 0;
  }
  .signature {
    margin-top: 24pt;
    text-align: right;
  }
  .signature .lieu-date {
    font-size: 10pt;
    color: #6B6A60;
  }
  .signature .titre-signataire {
    font-size: 10pt;
    color: #6B6A60;
    margin-top: 4pt;
  }
  .signature .auteur {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 6pt;
  }
  .signature .delegation {
    font-size: 9pt;
    color: #6B6A60;
  }
  .footer {
    margin-top: 36pt;
    padding-top: 8pt;
    border-top: 1px solid #D8D5C8;
    font-size: 8pt;
    color: #6B6A60;
    text-align: center;
  }
  @media screen {
    body {
      background: #f5f5f0;
    }
    .page {
      background: white;
      padding: 25mm 20mm;
      max-width: 210mm;
      margin: 10mm auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .print-hint {
      text-align: center;
      padding: 8pt 12pt;
      background: #1E3A5F;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 11pt;
      margin-bottom: 10mm;
      border-radius: 4pt;
      max-width: 210mm;
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
    .page { box-shadow: none; margin: 0; padding: 0; max-width: none; }
  }
</style>
</head>
<body>
<div class="print-hint">
  Utilisez Ctrl+P ou Cmd+P pour enregistrer en PDF
  <button onclick="window.print()">Imprimer</button>
</div>
<div class="page">
  <div class="header">
    ${logoHtml}
    <div class="republique">Republique Francaise</div>
    ${deviseHtml}
    <div class="commune">Mairie de ${escapeHtml(commune)}</div>
    ${adresseHtml}
    ${contactHtml ? `<div class="contact-mairie">${contactHtml}</div>` : ""}
  </div>

  <hr class="separator">

  <div class="titre-arrete">
    <div class="label-arrete">Arrete Municipal</div>
    <div class="numero">${escapeHtml(arrete.numero)}</div>
    <div class="titre">${escapeHtml(arrete.titre)}</div>
    <div class="type-label">Type : ${escapeHtml(arrete.type_label)}</div>
  </div>

  <p class="maire">${escapeHtml(titreMaire.toUpperCase())} DE ${escapeHtml(commune.toUpperCase())},</p>

  ${
    refsActives.length > 0
      ? `<p class="section-titre">VU :</p>\n${visasHtml}`
      : ""
  }

  <p class="section-titre">CONSIDERANT :</p>
  <p class="considerant">La necessite de reglementer la circulation et/ou le stationnement sur la voie publique ;</p>
  <p class="considerant">Les imperatifs de securite et de commodite de passage ;</p>

  <div class="arrete-header">ARRETE</div>

  <div class="article">
    <p class="article-titre">Article 1 — Periode d'application</p>
    <p class="article-contenu">Du ${formatDateFr(arrete.date_debut)} au ${formatDateFr(arrete.date_fin)}.</p>
  </div>

  <div class="article">
    <p class="article-titre">Article 2 — Voies concernees</p>
    <div class="article-contenu">
      ${voiesDetailHtml}
    </div>
  </div>

  ${deviationHtml}

  <div class="article">
    <p class="article-titre">Article ${3 + articleOffset} — Mesures de police</p>
    <p class="article-contenu">Les mesures de restriction de circulation et/ou de stationnement sont applicables conformement a la signalisation mise en place.</p>
  </div>

  <div class="article">
    <p class="article-titre">Article ${4 + articleOffset} — Execution</p>
    <p class="article-contenu">Le present arrete sera notifie aux services de police municipale, aux services techniques et a toute personne interessee.</p>
  </div>

  ${annexeHtml}

  <hr class="separator">

  <div class="signature">
    <p class="lieu-date">Fait a ${escapeHtml(commune)}, le ${formatDateFr(arrete.date_creation)}</p>
    <p class="titre-signataire">${escapeHtml(titreMaire)}</p>
    <p class="auteur">${escapeHtml(nomMaire)}</p>
  </div>

  <div class="footer">
    Document genere automatiquement — Mairie de ${escapeHtml(commune)} — ${escapeHtml(arrete.numero)}
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
