import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import ArreteLigne from "@/components/arretes/ArreteLigne";
import { renderWithProviders } from "@/__tests__/helpers/renderWithProviders";
import type { Arrete } from "@/types";

const ARRETE_MOCK: Arrete = {
  id: "a1",
  numero: "ARR-CI-2026-001",
  type_code: "circulation_interdite",
  type_label: "Circulation interdite",
  titre: "Travaux rue de la Paix",
  statut: "publie",
  cree_par: "M. Lefèvre",
  date_creation: "2026-01-15",
  date_debut: "2026-02-01",
  date_fin: "2026-03-01",
  voies: ["Rue de la Paix", "Avenue Foch"],
  troncons: [],
  versions: [],
  arrete_abrogation: null,
};

describe("ArreteLigne", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("affiche le titre et le numero", () => {
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} />);
    expect(screen.getByText("Travaux rue de la Paix")).toBeDefined();
    expect(screen.getByText("ARR-CI-2026-001")).toBeDefined();
  });

  it("affiche le statut publie", () => {
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} />);
    expect(screen.getByText("Publié")).toBeDefined();
  });

  it("affiche le type d'arrete", () => {
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} />);
    expect(screen.getByText("Circulation interdite")).toBeDefined();
  });

  it("affiche les voies", () => {
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} />);
    expect(screen.getByText("Rue de la Paix, Avenue Foch")).toBeDefined();
  });

  it("affiche les boutons Modifier et Abroger", () => {
    const onModifier = vi.fn();
    const onAbroger = vi.fn();
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} onModifier={onModifier} onAbroger={onAbroger} />);
    fireEvent.click(screen.getByText("Modifier"));
    expect(onModifier).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Abroger"));
    expect(onAbroger).toHaveBeenCalledTimes(1);
  });

  it("masque les boutons en mode compact", () => {
    renderWithProviders(<ArreteLigne arrete={ARRETE_MOCK} compact />);
    expect(screen.queryByText("Modifier")).toBeNull();
    expect(screen.queryByText("Abroger")).toBeNull();
  });

  it("masque les boutons pour un arrete abroge", () => {
    const abroge: Arrete = { ...ARRETE_MOCK, statut: "abroge" };
    renderWithProviders(<ArreteLigne arrete={abroge} />);
    expect(screen.queryByText("Modifier")).toBeNull();
  });

  it("affiche les versions au clic", () => {
    const avecVersions: Arrete = {
      ...ARRETE_MOCK,
      versions: [{ version: 1, date: "2026-01-20", auteur: "M. Lefèvre", motif: "Correction dates", titre: "v1" }],
    };
    renderWithProviders(<ArreteLigne arrete={avecVersions} />);
    const versionBtn = screen.getByText("1v").closest("button")!;
    fireEvent.click(versionBtn);
    expect(screen.getByText(/Correction dates/)).toBeDefined();
  });
});
