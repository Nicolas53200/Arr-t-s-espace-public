import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DonutChart from "@/components/charts/DonutChart";

describe("DonutChart", () => {
  it("affiche le total au centre", () => {
    const data = [
      { label: "Travaux", value: 3, couleur: "#1E3A5F" },
      { label: "Manifestation", value: 2, couleur: "#2F6B4F" },
    ];
    render(<DonutChart data={data} />);
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("total")).toBeDefined();
  });

  it("affiche la legende", () => {
    const data = [
      { label: "Travaux", value: 3, couleur: "#1E3A5F" },
      { label: "Manifestation", value: 2, couleur: "#2F6B4F" },
    ];
    render(<DonutChart data={data} />);
    expect(screen.getByText("Travaux")).toBeDefined();
    expect(screen.getByText("Manifestation")).toBeDefined();
  });

  it("retourne null si total est 0", () => {
    const data = [{ label: "Vide", value: 0, couleur: "#ccc" }];
    const { container } = render(<DonutChart data={data} />);
    expect(container.innerHTML).toBe("");
  });
});
