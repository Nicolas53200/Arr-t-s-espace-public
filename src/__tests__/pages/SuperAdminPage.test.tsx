import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SuperAdminPage from "@/pages/SuperAdminPage";
import { ajouterCollectivite, reinitialiser } from "@/lib/registre";

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

function seedRegistre() {
  ajouterCollectivite({
    nom: "Ville de Saint-Avoye",
    code_postal: "56000",
    siren: "215600001",
    email_admin: "admin@saint-avoye.fr",
  });
  ajouterCollectivite({
    nom: "Ville de Vannes",
    code_postal: "56000",
    siren: "215600002",
    email_admin: "admin@vannes.fr",
  });
}

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
    reinitialiser();
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

  it("affiche les collectivites du registre", () => {
    seedRegistre();
    renderPage();
    expect(screen.getByText("Ville de Saint-Avoye")).toBeDefined();
    expect(screen.getByText("Ville de Vannes")).toBeDefined();
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
