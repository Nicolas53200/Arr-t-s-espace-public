import { describe, it, expect } from "vitest";
import { exportArretesCSV, exportReferencesCSV, exportAuditCSV } from "@/lib/export";
import type { Arrete, Reference, EntreeAudit } from "@/types";

const arreteMock: Arrete = {
  id: "a1",
  numero: "ARR-2026-001",
  titre: "Test arrete",
  type_code: "circulation_interdite",
  type_label: "Circulation interdite",
  statut: "publie",
  cree_par: "u1",
  date_creation: "2026-03-15",
  date_debut: "2026-03-20",
  date_fin: "2026-04-20",
  voies: ["Rue de la Paix", "Avenue des Champs"],
  troncons: [],
  versions: [],
  arrete_abrogation: null,
};

describe("exportArretesCSV", () => {
  it("genere un CSV avec entete et lignes", () => {
    const csv = exportArretesCSV([arreteMock]);
    const lignes = csv.split("\n");

    expect(lignes[0]).toBe("Numero,Titre,Type,Statut,Date,Voies concernees,Date debut validite,Date fin validite");
    expect(lignes[1]).toContain("ARR-2026-001");
    expect(lignes[1]).toContain("Test arrete");
    expect(lignes[1]).toContain("Rue de la Paix ; Avenue des Champs");
  });

  it("retourne uniquement l'entete pour une liste vide", () => {
    const csv = exportArretesCSV([]);
    const lignes = csv.split("\n");
    expect(lignes).toHaveLength(1);
  });

  it("echappe les virgules dans les valeurs", () => {
    const arrete = { ...arreteMock, titre: "Arrete avec, virgule" };
    const csv = exportArretesCSV([arrete]);
    expect(csv).toContain('"Arrete avec, virgule"');
  });
});

describe("exportReferencesCSV", () => {
  it("genere un CSV pour les references", () => {
    const ref: Reference = {
      id: "r1",
      code: "ref_001",
      numero: "REF-001",
      label: "Delegation maire",
      categorie: "delegation",
      titulaire: "M. Dupont",
      date: "2026-01-01",
      date_debut_validite: "2026-01-01",
      date_fin_validite: "2027-01-01",
      actif: true,
      historique: [],
    };
    const csv = exportReferencesCSV([ref]);
    const lignes = csv.split("\n");

    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toContain("REF-001");
    expect(lignes[1]).toContain("Delegation maire");
    expect(lignes[1]).toContain("2026-01-01 - 2027-01-01");
  });

  it("affiche 'Depuis' pour les references sans date fin", () => {
    const ref: Reference = {
      id: "r2",
      code: "ref_002",
      numero: "REF-002",
      label: "Arrete permanent",
      categorie: "circulation",
      titulaire: null,
      date: "2026-06-01",
      date_debut_validite: "2026-06-01",
      date_fin_validite: "",
      actif: true,
      historique: [],
    };
    const csv = exportReferencesCSV([ref]);
    expect(csv).toContain("Depuis 2026-06-01");
  });
});

describe("exportAuditCSV", () => {
  it("genere un CSV pour le journal d'audit", () => {
    const entree: EntreeAudit = {
      id: "audit1",
      date: "2026-03-15T10:00:00",
      action: "creation",
      entite: "arrete",
      entiteId: "a1",
      description: "Creation de l'arrete ARR-001",
      auteur: "Admin",
    };
    const csv = exportAuditCSV([entree]);
    const lignes = csv.split("\n");

    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toContain("creation");
    expect(lignes[1]).toContain("Admin");
  });

  it("serialise les details en paires cle-valeur", () => {
    const entree: EntreeAudit = {
      id: "audit2",
      date: "2026-03-15T10:00:00",
      action: "modification",
      entite: "arrete",
      entiteId: "a1",
      description: "Modification",
      auteur: "Admin",
      details: { champ: "titre", ancien: "A", nouveau: "B" },
    };
    const csv = exportAuditCSV([entree]);
    expect(csv).toContain("champ: titre | ancien: A | nouveau: B");
  });
});
