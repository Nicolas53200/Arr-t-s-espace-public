import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("affiche le texte de chargement par defaut", () => {
    render(<LoadingSpinner />);
    expect(screen.getByText("Chargement...")).toBeDefined();
  });
});
