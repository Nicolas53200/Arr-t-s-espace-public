import { describe, it, expect } from "vitest";
import { couleurImpact, resoudreTroncons } from "@/lib/voie";

describe("couleurImpact", () => {
  it("retourne la couleur pour circulation_interdite", () => {
    expect(couleurImpact("circulation_interdite")).toBe("#B91C1C");
  });

  it("retourne une couleur par défaut pour un code inconnu", () => {
    expect(couleurImpact("inconnu")).toBe("#C9C6BA");
  });
});

describe("resoudreTroncons", () => {
  it("résout les voies de la République", () => {
    const ids = resoudreTroncons("Rue de la République");
    expect(ids).toContain("v1");
    expect(ids).toContain("v2");
  });

  it("résout plusieurs voies mentionnées", () => {
    const ids = resoudreTroncons("Foch et Tanneurs");
    expect(ids).toContain("v3");
    expect(ids).toContain("v4");
    expect(ids).toContain("v5");
  });

  it("retourne un tableau vide pour un texte vide", () => {
    expect(resoudreTroncons("")).toEqual([]);
    expect(resoudreTroncons(null)).toEqual([]);
    expect(resoudreTroncons(undefined)).toEqual([]);
  });

  it("résout les événements (triathlon)", () => {
    const ids = resoudreTroncons("triathlon");
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain("v1");
  });
});
