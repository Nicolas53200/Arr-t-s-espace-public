import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import ReferencesPage from "@/pages/ReferencesPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("ReferencesPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre References permanentes", () => {
    renderWithProviders(<ReferencesPage />);
    expect(screen.getByText(/R.f.rences permanentes/)).toBeDefined();
  });

  it("affiche les onglets de categories", () => {
    renderWithProviders(<ReferencesPage />);
    expect(screen.getAllByRole("button").length).toBeGreaterThanOrEqual(1);
  });

  it("affiche le bouton Nouvelle pour un admin", () => {
    renderWithProviders(<ReferencesPage />);
    expect(screen.getByText("Nouvelle")).toBeDefined();
  });
});
