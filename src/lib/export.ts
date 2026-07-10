import type { Arrete, Reference, EntreeAudit } from "@/types";

function echapperCSV(valeur: string): string {
  if (valeur.includes(",") || valeur.includes('"') || valeur.includes("\n")) {
    return `"${valeur.replace(/"/g, '""')}"`;
  }
  return valeur;
}

function ligneCSV(colonnes: string[]): string {
  return colonnes.map(echapperCSV).join(",");
}

export function exportArretesCSV(arretes: Arrete[]): string {
  const entete = ligneCSV([
    "Numero",
    "Titre",
    "Type",
    "Statut",
    "Date",
    "Voies concernees",
    "Date debut validite",
    "Date fin validite",
  ]);

  const lignes = arretes.map((a) =>
    ligneCSV([
      a.numero,
      a.titre,
      a.type_label,
      a.statut,
      a.date_creation,
      a.voies.join(" ; "),
      a.date_debut,
      a.date_fin,
    ])
  );

  return [entete, ...lignes].join("\n");
}

export function exportReferencesCSV(refs: Reference[]): string {
  const entete = ligneCSV([
    "Numero",
    "Libelle",
    "Categorie",
    "Titulaire",
    "Date",
    "Validite",
  ]);

  const lignes = refs.map((r) =>
    ligneCSV([
      r.numero,
      r.label,
      r.categorie,
      r.titulaire ?? "",
      r.date,
      r.date_fin_validite ? `${r.date_debut_validite} - ${r.date_fin_validite}` : `Depuis ${r.date_debut_validite}`,
    ])
  );

  return [entete, ...lignes].join("\n");
}

export function exportAuditCSV(entries: EntreeAudit[]): string {
  const entete = ligneCSV([
    "Date",
    "Action",
    "Entite",
    "Description",
    "Auteur",
    "Details",
  ]);

  const lignes = entries.map((e) =>
    ligneCSV([
      e.date,
      e.action,
      e.entite,
      e.description,
      e.auteur,
      e.details ? Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(" | ") : "",
    ])
  );

  return [entete, ...lignes].join("\n");
}

export function telechargerCSV(contenu: string, nomFichier: string): void {
  const blob = new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
