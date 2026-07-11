import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModalConfirm from "@/components/arretes/ModalConfirm";

describe("ModalConfirm", () => {
  const defaultProps = {
    titre: "Confirmer l'action",
    message: "Cette action est irreversible.",
    icone: <span>!</span>,
    couleurIcone: "#FEE2E2",
    labelOk: "Supprimer",
    couleurOk: "#B91C1C",
    onOk: vi.fn(),
    onCancel: vi.fn(),
  };

  it("affiche le titre et le message", () => {
    render(<ModalConfirm {...defaultProps} />);
    expect(screen.getByText("Confirmer l'action")).toBeDefined();
    expect(screen.getByText("Cette action est irreversible.")).toBeDefined();
  });

  it("affiche le bouton ok avec le bon label", () => {
    render(<ModalConfirm {...defaultProps} />);
    expect(screen.getByText("Supprimer")).toBeDefined();
  });

  it("appelle onOk au clic sur le bouton", () => {
    const onOk = vi.fn();
    render(<ModalConfirm {...defaultProps} onOk={onOk} />);
    fireEvent.click(screen.getByText("Supprimer"));
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it("appelle onCancel au clic sur Annuler", () => {
    const onCancel = vi.fn();
    render(<ModalConfirm {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Annuler"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
