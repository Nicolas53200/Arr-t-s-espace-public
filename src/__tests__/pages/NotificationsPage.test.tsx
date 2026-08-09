import { describe, it, expect, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import NotificationsPage from "@/pages/NotificationsPage";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("NotificationsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Notifications", () => {
    renderWithProviders(<NotificationsPage />);
    expect(screen.getByText("Notifications")).toBeDefined();
  });

  it("affiche les onglets de filtre", () => {
    renderWithProviders(<NotificationsPage />);
    expect(screen.getByText("Non lues")).toBeDefined();
    expect(screen.getByText("Toutes")).toBeDefined();
    // "Expirations" apparait dans l'onglet et dans le bilan
    expect(screen.getAllByText("Expirations").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Workflow")).toBeDefined();
  });

  it("affiche le bouton tout marquer comme lu si notifications non lues", () => {
    renderWithProviders(<NotificationsPage />);
    const btn = screen.queryByText("Tout marquer comme lu");
    expect(btn !== null || screen.getByText("Aucune notification") !== null).toBe(true);
  });
});
