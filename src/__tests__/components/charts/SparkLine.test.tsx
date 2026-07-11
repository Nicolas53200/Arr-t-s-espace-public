import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SparkLine from "@/components/charts/SparkLine";

describe("SparkLine", () => {
  it("rend un SVG avec des paths", () => {
    const { container } = render(<SparkLine data={[1, 3, 2, 5]} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBe(2);
  });

  it("retourne null si moins de 2 points", () => {
    const { container } = render(<SparkLine data={[1]} />);
    expect(container.innerHTML).toBe("");
  });
});
