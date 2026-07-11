import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import AdminPage from "@/pages/AdminPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("AdminPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Administration pour un admin", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText("Administration")).toBeDefined();
  });

  it("affiche les 3 onglets", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText("Utilisateurs")).toBeDefined();
    expect(screen.getByText("Configuration")).toBeDefined();
    expect(screen.getByText("Modules")).toBeDefined();
  });

  it("affiche la liste des utilisateurs par defaut", () => {
    renderWithProviders(<AdminPage />);
    expect(screen.getByText("Ajouter")).toBeDefined();
    expect(screen.getByText("Nom")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
  });

  it("affiche 'Acces restreint' pour un lecteur", () => {
    renderWithProviders(<AdminPage />, { role: "lecteur" });
    expect(screen.getByText("Acces restreint")).toBeDefined();
  });
});
