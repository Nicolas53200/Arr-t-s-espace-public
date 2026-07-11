import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import HistoriquePage from "@/pages/HistoriquePage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("HistoriquePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Historique", () => {
    renderWithProviders(<HistoriquePage />);
    expect(screen.getByText("Historique")).toBeDefined();
  });

  it("affiche le champ de recherche", () => {
    renderWithProviders(<HistoriquePage />);
    expect(screen.getByLabelText("Rechercher dans l'historique")).toBeDefined();
  });

  it("affiche le bouton Filtres", () => {
    renderWithProviders(<HistoriquePage />);
    expect(screen.getByText("Filtres")).toBeDefined();
  });

  it("affiche la duree de conservation", () => {
    renderWithProviders(<HistoriquePage />);
    expect(screen.getByText(/Conservation/)).toBeDefined();
  });

  it("affiche la liste des arretes archives", () => {
    renderWithProviders(<HistoriquePage />);
    expect(screen.getByRole("list", { name: "Liste des arretes archives" })).toBeDefined();
  });
});
