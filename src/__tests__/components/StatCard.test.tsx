import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatCard from "@/components/common/StatCard";

describe("StatCard", () => {
  it("affiche le label et la valeur numerique", () => {
    render(<StatCard label="Arretes actifs" valeur={42} couleur="#1E3A5F" />);
    expect(screen.getByText("Arretes actifs")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
  });

  it("affiche une valeur textuelle", () => {
    render(<StatCard label="Taux" valeur="85%" couleur="#065F46" />);
    expect(screen.getByText("Taux")).toBeDefined();
    expect(screen.getByText("85%")).toBeDefined();
  });
});
