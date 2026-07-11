import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/common/EmptyState";

describe("EmptyState", () => {
  it("affiche le texte fourni", () => {
    render(<EmptyState texte="Aucun resultat." />);
    expect(screen.getByText("Aucun resultat.")).toBeDefined();
  });
});
