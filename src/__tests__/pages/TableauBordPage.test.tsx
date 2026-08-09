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

  it("affiche les KPIs principaux", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Arrêtés actifs")).toBeDefined();
    expect(screen.getByText("Nouveaux ce mois")).toBeDefined();
    expect(screen.getByText("Taux d'abrogation")).toBeDefined();
    expect(screen.getByText("Références actives")).toBeDefined();
  });

  it("affiche les KPIs secondaires", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText("Délai moyen de publication")).toBeDefined();
    expect(screen.getByText("Durée moyenne des arrêtés")).toBeDefined();
    expect(screen.getByText("Taux de renouvellement")).toBeDefined();
  });

  it("affiche les sections graphiques", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText(/Historique des arrêtés par mois/)).toBeDefined();
    expect(screen.getByText(/Répartition par type/)).toBeDefined();
    expect(screen.getByText(/Répartition par statut/)).toBeDefined();
  });

  it("affiche les sections avancées", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText(/Évolution sur 12 mois/)).toBeDefined();
    expect(screen.getByText(/Voies les plus réglementées/)).toBeDefined();
    expect(screen.getByText(/Activité par jour de la semaine/)).toBeDefined();
  });

  it("affiche les sections de références", () => {
    renderWithProviders(<TableauBordPage />);
    expect(screen.getByText(/Expirations de références à venir/)).toBeDefined();
    expect(screen.getByText(/Expirations par mois/)).toBeDefined();
  });
});
