import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "@/pages/NotFoundPage";

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("affiche le titre 'Page non trouvee'", () => {
    renderNotFound();
    expect(screen.getByText("Page non trouvee")).toBeDefined();
  });

  it("affiche un bouton de retour a l'accueil", () => {
    renderNotFound();
    expect(screen.getByText("Retour a l'accueil")).toBeDefined();
  });

  it("affiche un message explicatif", () => {
    renderNotFound();
    expect(screen.getByText(/n'existe pas ou a ete deplacee/)).toBeDefined();
  });
});
