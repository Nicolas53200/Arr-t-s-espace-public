import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import AccueilPage from "@/pages/AccueilPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("AccueilPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre principal", () => {
    renderWithProviders(<AccueilPage />);
    expect(screen.getByText(/Arrêtés municipaux/)).toBeDefined();
  });

  it("affiche les 4 cartes statistiques", () => {
    renderWithProviders(<AccueilPage />);
    expect(screen.getByText("Actifs")).toBeDefined();
    expect(screen.getByText("En historique")).toBeDefined();
    expect(screen.getByText("Références")).toBeDefined();
    expect(screen.getByText("Conservation")).toBeDefined();
  });

  it("affiche les boutons d'action", () => {
    renderWithProviders(<AccueilPage />);
    expect(screen.getByText(/Nouvel arrêté/)).toBeDefined();
    expect(screen.getAllByText(/Arrêtés actifs/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Carte/)).toBeDefined();
    expect(screen.getByText(/Historique/)).toBeDefined();
  });

  it("affiche la section arretes actifs recents", () => {
    renderWithProviders(<AccueilPage />);
    expect(screen.getByText("Arrêtés actifs récents")).toBeDefined();
    expect(screen.getByText("Voir tous")).toBeDefined();
  });
});
