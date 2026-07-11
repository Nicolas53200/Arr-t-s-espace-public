import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BarChart from "@/components/charts/BarChart";

describe("BarChart", () => {
  it("affiche les valeurs et labels", () => {
    const data = [
      { label: "Janvier", value: 4 },
      { label: "Fevrier", value: 7 },
    ];
    render(<BarChart data={data} />);
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Janvier")).toBeDefined();
    expect(screen.getByText("Fevrier")).toBeDefined();
  });

  it("retourne null si data est vide", () => {
    const { container } = render(<BarChart data={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
