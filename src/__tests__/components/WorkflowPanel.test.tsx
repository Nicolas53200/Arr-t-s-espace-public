import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import WorkflowPanel from "@/components/arretes/WorkflowPanel";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";
import type { Arrete } from "@/types";

const ARRETE_BROUILLON: Arrete = {
  id: "a1",
  numero: "ARR-CI-2026-001",
  type_code: "circulation_interdite",
  type_label: "Circulation interdite",
  titre: "Test workflow",
  statut: "brouillon",
  cree_par: "Admin",
  date_creation: "2026-01-01",
  date_debut: "2026-02-01",
  date_fin: "2026-03-01",
  voies: [],
  troncons: [],
  versions: [],
  arrete_abrogation: null,
};

const ARRETE_PUBLIE: Arrete = {
  ...ARRETE_BROUILLON,
  statut: "publie",
};

describe("WorkflowPanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le statut actuel", () => {
    renderWithProviders(<WorkflowPanel arrete={ARRETE_BROUILLON} />);
    expect(screen.getAllByText("Brouillon").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les etapes du workflow", () => {
    renderWithProviders(<WorkflowPanel arrete={ARRETE_BROUILLON} />);
    expect(screen.getByText("En relecture")).toBeDefined();
  });

  it("affiche le bouton de transition pour un brouillon", () => {
    renderWithProviders(<WorkflowPanel arrete={ARRETE_BROUILLON} />);
    expect(screen.getByText(/Soumettre/)).toBeDefined();
  });

  it("affiche le statut Publie", () => {
    renderWithProviders(<WorkflowPanel arrete={ARRETE_PUBLIE} />);
    expect(screen.getAllByText(/Publi/).length).toBeGreaterThanOrEqual(1);
  });

  it("affiche les commentaires si presents", () => {
    const avecCommentaires: Arrete = {
      ...ARRETE_BROUILLON,
      statut: "en_relecture",
      commentaires: [{
        id: "c1",
        auteur: "M. Lefevre",
        texte: "A verifier",
        date: "2026-01-15",
        etape: "en_relecture",
      }],
    };
    renderWithProviders(<WorkflowPanel arrete={avecCommentaires} />);
    expect(screen.getByText("Historique")).toBeDefined();
    expect(screen.getByText(/A verifier/)).toBeDefined();
  });
});
