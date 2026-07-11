import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/common/ErrorBoundary";

function Bombe(): React.ReactNode {
  throw new Error("Erreur de test");
}

describe("ErrorBoundary", () => {
  it("affiche les enfants quand il n'y a pas d'erreur", () => {
    render(
      <ErrorBoundary>
        <p>Contenu normal</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Contenu normal")).toBeDefined();
  });

  it("affiche le message d'erreur quand un enfant crash", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bombe />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Une erreur est survenue")).toBeDefined();
    expect(screen.getByText("Recharger")).toBeDefined();
    vi.restoreAllMocks();
  });
});
