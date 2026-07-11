import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChampFormulaire from "@/components/formulaire/ChampFormulaire";
import type { ChampFormulaire as ChampFormDef } from "@/types";

describe("ChampFormulaire", () => {
  it("rend un champ texte avec placeholder", () => {
    const champ: ChampFormDef = { id: "nom", label: "Nom", type: "texte", placeholder: "Entrez un nom" };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur="" onChange={onChange} />);
    expect(screen.getByText("Nom")).toBeDefined();
    expect(screen.getByPlaceholderText("Entrez un nom")).toBeDefined();
  });

  it("appelle onChange pour un champ texte", () => {
    const champ: ChampFormDef = { id: "nom", label: "Nom", type: "texte" };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Test" } });
    expect(onChange).toHaveBeenCalledWith("Test");
  });

  it("rend un select avec les options", () => {
    const champ: ChampFormDef = { id: "motif", label: "Motif", type: "select", options: ["Travaux", "Securite", "Autre"] };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur="" onChange={onChange} />);
    expect(screen.getByText("Motif")).toBeDefined();
    expect(screen.getByText("Travaux")).toBeDefined();
    expect(screen.getByText("Securite")).toBeDefined();
  });

  it("appelle onChange pour un select", () => {
    const champ: ChampFormDef = { id: "motif", label: "Motif", type: "select", options: ["Travaux", "Autre"] };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Travaux" } });
    expect(onChange).toHaveBeenCalledWith("Travaux");
  });

  it("rend un toggle boolean", () => {
    const champ: ChampFormDef = { id: "deviation", label: "Deviation prevue", type: "bool" };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur={false} onChange={onChange} />);
    expect(screen.getByText("Deviation prevue")).toBeDefined();
    fireEvent.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("rend un champ datetime", () => {
    const champ: ChampFormDef = { id: "date_debut", label: "Debut", type: "datetime" };
    const onChange = vi.fn();
    render(<ChampFormulaire champ={champ} valeur="" onChange={onChange} />);
    expect(screen.getByText("Debut")).toBeDefined();
  });
});
