import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/common/Modal";

describe("Modal", () => {
  it("affiche le contenu enfant", () => {
    render(<Modal><p>Contenu modal</p></Modal>);
    expect(screen.getByText("Contenu modal")).toBeDefined();
  });

  it("appelle onClose au clic sur l'overlay", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal onClose={onClose}><p>Contenu</p></Modal>);
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ne ferme pas au clic sur le contenu", () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose}><p>Contenu</p></Modal>);
    fireEvent.click(screen.getByText("Contenu"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
