import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import ActifsPage from "@/pages/ActifsPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("ActifsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Arretes actifs", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByText("Arretes actifs")).toBeDefined();
  });

  it("affiche le champ de recherche", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByLabelText("Rechercher dans les arretes actifs")).toBeDefined();
  });

  it("affiche le bouton Filtres", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByText("Filtres")).toBeDefined();
  });

  it("affiche le bouton Nouvel arrete", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByText("Nouvel arrete")).toBeDefined();
  });

  it("affiche le bouton CSV", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByLabelText("Exporter en CSV")).toBeDefined();
  });

  it("affiche la liste des arretes", () => {
    renderWithProviders(<ActifsPage />);
    expect(screen.getByRole("list", { name: "Liste des arretes actifs" })).toBeDefined();
  });
});
