import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import JournalPage from "@/pages/JournalPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("JournalPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre", () => {
    renderWithProviders(<JournalPage />);
    expect(screen.getByText("Journal d'activite")).toBeDefined();
  });

  it("affiche le bouton d'export CSV", () => {
    renderWithProviders(<JournalPage />);
    expect(screen.getByText("Exporter CSV")).toBeDefined();
  });

  it("affiche l'onglet Tous", () => {
    renderWithProviders(<JournalPage />);
    expect(screen.getByText("Tous")).toBeDefined();
  });

  it("affiche le champ de recherche", () => {
    renderWithProviders(<JournalPage />);
    expect(screen.getByPlaceholderText("Rechercher...")).toBeDefined();
  });
});
