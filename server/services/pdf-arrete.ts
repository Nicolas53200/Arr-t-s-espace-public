import PDFDocument from "pdfkit";
import type { Readable } from "stream";

interface ArreteData {
  numero: string;
  titre: string;
  type_label: string;
  date_creation: string;
  date_debut: string;
  date_fin: string;
  voies: string[];
  troncons: { voie_id: string; impact: string }[];
  cree_par: string;
  statut: string;
}

interface TenantData {
  nom: string;
  code_postal: string;
}

interface ReferenceVisa {
  label: string;
  numero: string;
  date: string;
}

const COULEURS = {
  primaire: "#1E3A5F",
  texte: "#1C1F1B",
  secondaire: "#6B6A60",
  bordure: "#D8D5C8",
  fond: "#F4F2EC",
};

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

export function genererPdfArrete(
  arrete: ArreteData,
  tenant: TenantData,
  references: ReferenceVisa[],
): Readable {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `${arrete.numero} — ${arrete.titre}`,
      Author: tenant.nom,
      Subject: "Arrêté municipal",
    },
  });

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // En-tête : collectivité
  doc
    .fontSize(10)
    .fillColor(COULEURS.secondaire)
    .text("RÉPUBLIQUE FRANÇAISE", { align: "center" })
    .moveDown(0.3)
    .fontSize(14)
    .fillColor(COULEURS.primaire)
    .text(tenant.nom.toUpperCase(), { align: "center" })
    .moveDown(0.2)
    .fontSize(9)
    .fillColor(COULEURS.secondaire)
    .text(`Code postal : ${tenant.code_postal}`, { align: "center" })
    .moveDown(1.5);

  // Ligne de séparation
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(COULEURS.bordure)
    .lineWidth(1)
    .stroke()
    .moveDown(1);

  // Titre de l'arrêté
  doc
    .fontSize(8)
    .fillColor(COULEURS.secondaire)
    .text("ARRÊTÉ MUNICIPAL", { align: "center" })
    .moveDown(0.3)
    .fontSize(11)
    .fillColor(COULEURS.primaire)
    .text(arrete.numero, { align: "center" })
    .moveDown(0.5)
    .fontSize(13)
    .fillColor(COULEURS.texte)
    .text(arrete.titre, { align: "center" })
    .moveDown(0.3)
    .fontSize(9)
    .fillColor(COULEURS.secondaire)
    .text(`Type : ${arrete.type_label}`, { align: "center" })
    .moveDown(1.5);

  // Visas (références permanentes)
  if (references.length > 0) {
    doc
      .fontSize(10)
      .fillColor(COULEURS.texte)
      .text("VU :", { underline: true })
      .moveDown(0.3);

    for (const ref of references) {
      doc
        .fontSize(9)
        .fillColor(COULEURS.texte)
        .text(`• ${ref.label} (n° ${ref.numero} du ${formatDateFr(ref.date)})`, {
          indent: 20,
        })
        .moveDown(0.2);
    }
    doc.moveDown(0.8);
  }

  // Considérants
  doc
    .fontSize(10)
    .fillColor(COULEURS.texte)
    .text("CONSIDÉRANT :", { underline: true })
    .moveDown(0.3)
    .fontSize(9)
    .text(
      `• La nécessité de réglementer la circulation et/ou le stationnement sur la voie publique ;`,
      { indent: 20 },
    )
    .moveDown(0.2)
    .text(`• Les impératifs de sécurité et de commodité de passage ;`, {
      indent: 20,
    })
    .moveDown(1);

  // ARRÊTE
  doc
    .fontSize(12)
    .fillColor(COULEURS.primaire)
    .text("ARRÊTE", { align: "center" })
    .moveDown(0.8);

  // Article 1 : Période
  doc
    .fontSize(10)
    .fillColor(COULEURS.texte)
    .text("Article 1 — Période d'application", { underline: true })
    .moveDown(0.3)
    .fontSize(9)
    .text(
      `Du ${formatDateFr(arrete.date_debut)} au ${formatDateFr(arrete.date_fin)}.`,
      { indent: 20 },
    )
    .moveDown(0.8);

  // Article 2 : Voies concernées
  doc
    .fontSize(10)
    .text("Article 2 — Voies concernées", { underline: true })
    .moveDown(0.3);

  for (const voie of arrete.voies) {
    doc.fontSize(9).text(`• ${voie}`, { indent: 20 }).moveDown(0.15);
  }
  doc.moveDown(0.8);

  // Article 3 : Mesures
  doc
    .fontSize(10)
    .text("Article 3 — Mesures de police", { underline: true })
    .moveDown(0.3)
    .fontSize(9)
    .text(
      "Les mesures de restriction de circulation et/ou de stationnement sont applicables conformément à la signalisation mise en place.",
      { indent: 20 },
    )
    .moveDown(0.8);

  // Article 4 : Exécution
  doc
    .fontSize(10)
    .text("Article 4 — Exécution", { underline: true })
    .moveDown(0.3)
    .fontSize(9)
    .text(
      "Le présent arrêté sera notifié aux services de police municipale, aux services techniques et à toute personne intéressée.",
      { indent: 20 },
    )
    .moveDown(1.5);

  // Signature
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .strokeColor(COULEURS.bordure)
    .lineWidth(0.5)
    .stroke()
    .moveDown(1);

  doc
    .fontSize(9)
    .fillColor(COULEURS.secondaire)
    .text(`Fait à ${tenant.nom.replace(/^Ville de /, "")}, le ${formatDateFr(arrete.date_creation)}`, {
      align: "right",
    })
    .moveDown(0.5)
    .fontSize(10)
    .fillColor(COULEURS.texte)
    .text(arrete.cree_par, { align: "right" })
    .moveDown(0.2)
    .fontSize(8)
    .fillColor(COULEURS.secondaire)
    .text("Par délégation du Maire", { align: "right" });

  // Pied de page
  const bottomY = doc.page.height - doc.page.margins.bottom - 20;
  doc
    .fontSize(7)
    .fillColor(COULEURS.secondaire)
    .text(
      `Document généré automatiquement — ${tenant.nom} — ${arrete.numero}`,
      doc.page.margins.left,
      bottomY,
      { align: "center", width: pageWidth },
    );

  doc.end();
  return doc as unknown as Readable;
}
