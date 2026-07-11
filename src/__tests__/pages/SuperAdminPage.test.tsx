import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SuperAdminPage from "@/pages/SuperAdminPage";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

function renderPage() {
  localStorage.setItem("superadmin_auth", "true");
  return render(
    <MemoryRouter>
      <SuperAdminPage />
    </MemoryRouter>,
  );
}

describe("SuperAdminPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirige si pas superadmin", () => {
    const { container } = render(
      <MemoryRouter>
        <SuperAdminPage />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("affiche le titre Collectivites", () => {
    renderPage();
    expect(screen.getByText("Collectivites")).toBeDefined();
  });

  it("affiche les statistiques", () => {
    renderPage();
    expect(screen.getByText("Total collectivites")).toBeDefined();
    expect(screen.getByText("Actives")).toBeDefined();
    expect(screen.getByText("Suspendues")).toBeDefined();
  });

  it("affiche les collectivites initiales", () => {
    renderPage();
    expect(screen.getByText("Ville de Saint-Avoye")).toBeDefined();
    expect(screen.getByText("Ville de Vannes")).toBeDefined();
    expect(screen.getByText("Ville de Lorient")).toBeDefined();
  });

  it("affiche le bouton Nouvelle collectivite", () => {
    renderPage();
    expect(screen.getByText("Nouvelle collectivite")).toBeDefined();
  });

  it("affiche le bouton Deconnexion", () => {
    renderPage();
    expect(screen.getByText("Deconnexion")).toBeDefined();
  });

  it("ouvre la modal d'ajout au clic", () => {
    renderPage();
    fireEvent.click(screen.getByText("Nouvelle collectivite"));
    expect(screen.getByText("Nom de la collectivite")).toBeDefined();
    expect(screen.getByText("Code postal")).toBeDefined();
    expect(screen.getByText("SIREN")).toBeDefined();
  });
});
