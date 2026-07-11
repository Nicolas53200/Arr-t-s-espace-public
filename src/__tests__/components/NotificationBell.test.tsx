import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";

describe("NotificationBell", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le bouton cloche", () => {
    renderWithProviders(<NotificationBell />);
    expect(screen.getByLabelText(/Notifications/)).toBeDefined();
  });

  it("ouvre le panneau au clic", () => {
    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByLabelText(/Notifications/));
    expect(screen.getByText("Notifications")).toBeDefined();
  });

  it("affiche le lien vers toutes les notifications", () => {
    renderWithProviders(<NotificationBell />);
    fireEvent.click(screen.getByLabelText(/Notifications/));
    expect(screen.getByText("Voir toutes les notifications")).toBeDefined();
  });
});
