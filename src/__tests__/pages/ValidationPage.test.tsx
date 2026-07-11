import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import ValidationPage from "@/pages/ValidationPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("ValidationPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Validation", () => {
    renderWithProviders(<ValidationPage />);
    expect(screen.getByText("Validation")).toBeDefined();
  });

  it("affiche les onglets de filtre", () => {
    renderWithProviders(<ValidationPage />);
    expect(screen.getByText("Tous")).toBeDefined();
    expect(screen.getByText("A relire")).toBeDefined();
    expect(screen.getByText("A valider")).toBeDefined();
  });
});
