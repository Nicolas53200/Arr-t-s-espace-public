import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre Actes360", () => {
    renderLanding();
    expect(screen.getByText("Actes")).toBeDefined();
    expect(screen.getByText("360")).toBeDefined();
  });

  it("affiche le champ de code d'acces", () => {
    renderLanding();
    expect(screen.getByLabelText("Code d'acces collectivite")).toBeDefined();
  });

  it("affiche les 4 fonctionnalites", () => {
    renderLanding();
    expect(screen.getByText("Redaction assistee")).toBeDefined();
    expect(screen.getByText("Cartographie interactive")).toBeDefined();
    expect(screen.getByText("Conformite juridique")).toBeDefined();
    expect(screen.getByText("Tableau de bord")).toBeDefined();
  });

  it("affiche une erreur pour un code invalide", () => {
    renderLanding();
    const input = screen.getByLabelText("Code d'acces collectivite") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "INVALID" } });
    fireEvent.click(screen.getByText("Acceder"));
    expect(screen.getByText(/Code d'acces invalide/)).toBeDefined();
  });

  it("affiche une erreur si le champ est vide", () => {
    renderLanding();
    fireEvent.click(screen.getByText("Acceder"));
    expect(screen.getByText(/Veuillez entrer/)).toBeDefined();
  });

  it("ouvre la modal super-admin au clic sur l'engrenage", () => {
    renderLanding();
    fireEvent.click(screen.getByTitle("Administration plateforme"));
    expect(screen.getByText("Administration plateforme")).toBeDefined();
    expect(screen.getByLabelText("Code administrateur plateforme")).toBeDefined();
  });

  it("affiche une erreur pour un code super-admin invalide", () => {
    renderLanding();
    fireEvent.click(screen.getByTitle("Administration plateforme"));
    const input = screen.getByLabelText("Code administrateur plateforme") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "WRONG" } });
    fireEvent.click(screen.getByText("Connexion"));
    expect(screen.getByText("Code incorrect")).toBeDefined();
  });

  it("affiche le code de demo", () => {
    renderLanding();
    expect(screen.getByText("SAINT-AVOYE-2026")).toBeDefined();
  });
});
