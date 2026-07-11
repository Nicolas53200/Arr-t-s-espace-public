import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import NouveauArretePage from "@/pages/NouveauArretePage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("NouveauArretePage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Type d'arrete a l'etape 0", () => {
    renderWithProviders(<NouveauArretePage />);
    expect(screen.getByText("Type d'arrete")).toBeDefined();
  });

  it("affiche les types d'arrete disponibles", () => {
    renderWithProviders(<NouveauArretePage />);
    expect(screen.getByText("Circulation interdite")).toBeDefined();
    expect(screen.getByText("Stationnement interdit")).toBeDefined();
    expect(screen.getByText("Travaux")).toBeDefined();
  });

  it("affiche le bouton Accueil", () => {
    renderWithProviders(<NouveauArretePage />);
    expect(screen.getByText("Accueil")).toBeDefined();
  });

  it("passe a l'etape 1 au clic sur un type", () => {
    renderWithProviders(<NouveauArretePage />);
    const btn = screen.getByText("Circulation interdite").closest("button")!;
    fireEvent.click(btn);
    expect(screen.getByPlaceholderText(/Refection de chaussee/)).toBeDefined();
  });

  it("affiche les etapes du wizard", () => {
    renderWithProviders(<NouveauArretePage />);
    expect(screen.getByText("Type")).toBeDefined();
  });
});
