import { describe, it, expect } from "vitest";
import { fmtDate, fmtDateCourte, isFutur, isEnCours } from "@/lib/date";

describe("fmtDate", () => {
  it("formate une date ISO en français", () => {
    const result = fmtDate("2026-06-18");
    expect(result).toContain("juin");
    expect(result).toContain("2026");
  });

  it("retourne un tiret pour une valeur nulle", () => {
    expect(fmtDate(null)).toBe("—");
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate("")).toBe("—");
  });
});

describe("fmtDateCourte", () => {
  it("formate en JJ/MM", () => {
    const result = fmtDateCourte("2026-06-18");
    expect(result).toMatch(/18\/06/);
  });

  it("retourne une chaîne vide pour une valeur nulle", () => {
    expect(fmtDateCourte(null)).toBe("");
    expect(fmtDateCourte("")).toBe("");
  });
});

describe("isFutur", () => {
  it("détecte une date future", () => {
    expect(isFutur("2026-09-01")).toBe(true);
  });

  it("détecte une date passée", () => {
    expect(isFutur("2026-01-01")).toBe(false);
  });
});

describe("isEnCours", () => {
  it("détecte une période en cours", () => {
    expect(isEnCours("2026-06-01", "2026-07-01")).toBe(true);
  });

  it("rejette une période entièrement passée", () => {
    expect(isEnCours("2026-01-01", "2026-02-01")).toBe(false);
  });

  it("rejette une période entièrement future", () => {
    expect(isEnCours("2026-09-01", "2026-10-01")).toBe(false);
  });
});
