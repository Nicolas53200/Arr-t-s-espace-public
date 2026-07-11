import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModalAbrogation from "@/components/arretes/ModalAbrogation";
import type { Arrete } from "@/types";

const ARRETE: Arrete = {
  id: "a1",
  numero: "ARR-CI-2026-001",
  type_code: "circulation_interdite",
  type_label: "Circulation interdite",
  titre: "Test",
  statut: "publie",
  cree_par: "Admin",
  date_creation: "2026-01-01",
  date_debut: "2026-01-01",
  date_fin: "2026-02-01",
  voies: [],
  troncons: [],
  versions: [],
  arrete_abrogation: null,
};

describe("ModalAbrogation", () => {
  it("affiche le titre Abroger et le numero", () => {
    render(<ModalAbrogation arrete={ARRETE} onOk={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Abroger")).toBeDefined();
    expect(screen.getByText("ARR-CI-2026-001")).toBeDefined();
  });

  it("affiche le message d'avertissement", () => {
    render(<ModalAbrogation arrete={ARRETE} onOk={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/arr.t. d'abrogation sera g.n.r./)).toBeDefined();
  });

  it("appelle onCancel au clic Annuler", () => {
    const onCancel = vi.fn();
    render(<ModalAbrogation arrete={ARRETE} onOk={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onOk si motif vide", () => {
    const onOk = vi.fn();
    render(<ModalAbrogation arrete={ARRETE} onOk={onOk} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText(/G.n.rer l'abrogation/));
    expect(onOk).not.toHaveBeenCalled();
  });

  it("appelle onOk avec le motif saisi", () => {
    const onOk = vi.fn();
    render(<ModalAbrogation arrete={ARRETE} onOk={onOk} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Travaux termines" } });
    fireEvent.click(screen.getByText(/G.n.rer l'abrogation/));
    expect(onOk).toHaveBeenCalledWith("Travaux termines");
  });
});
