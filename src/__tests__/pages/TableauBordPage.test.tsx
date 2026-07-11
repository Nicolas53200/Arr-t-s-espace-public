import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import TableauBordPage from "@/pages/TableauBordPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("TableauBordPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Tableau de bord")).toBeDefined();
  });

  it("affiche la description", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText(/Vue d'ensemble/)).toBeDefined();
  });

  it("affiche les KPIs", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Arretes actifs")).toBeDefined();
    expect(screen.getByText("Nouveaux ce mois")).toBeDefined();
    expect(screen.getByText("Taux d'abrogation")).toBeDefined();
    expect(screen.getByText("References actives")).toBeDefined();
  });

  it("affiche les sections graphiques", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Arretes par mois")).toBeDefined();
    expect(screen.getByText("Repartition par type")).toBeDefined();
    expect(screen.getByText("Repartition par statut")).toBeDefined();
  });

  it("affiche le delai moyen de publication", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Delai moyen de publication")).toBeDefined();
  });
});
