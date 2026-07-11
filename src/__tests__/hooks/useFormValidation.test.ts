import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "@/hooks/useFormValidation";
import type { ReglesFormulaire } from "@/lib/validation";

const regles: ReglesFormulaire<"titre" | "email"> = {
  titre: [{ type: "required" }, { type: "minLength", valeur: 3 }],
  email: [{ type: "required" }, { type: "email" }],
};

const valeursInitiales = { titre: "", email: "" };

describe("useFormValidation", () => {
  it("initialise avec les valeurs fournies", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));
    expect(result.current.values.titre).toBe("");
    expect(result.current.values.email).toBe("");
    expect(result.current.isValid).toBe(false);
  });

  it("handleChange met a jour la valeur", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    act(() => {
      result.current.handleChange("titre", "Mon arrete");
    });

    expect(result.current.values.titre).toBe("Mon arrete");
  });

  it("handleBlur marque le champ comme touched", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    expect(result.current.touched.titre).toBe(false);
    act(() => {
      result.current.handleBlur("titre");
    });
    expect(result.current.touched.titre).toBe(true);
  });

  it("detecte les erreurs de validation", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));
    expect(result.current.errors.titre).toBe("Ce champ est obligatoire");
    expect(result.current.errors.email).toBe("Ce champ est obligatoire");
    expect(result.current.isValid).toBe(false);
  });

  it("isValid passe a true quand tout est valide", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    act(() => {
      result.current.handleChange("titre", "Arrete circulation");
      result.current.handleChange("email", "test@example.fr");
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors.titre).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
  });

  it("validate marque tous les champs touched et retourne la validite", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    let valid: boolean;
    act(() => {
      valid = result.current.validate();
    });
    expect(valid!).toBe(false);
    expect(result.current.touched.titre).toBe(true);
    expect(result.current.touched.email).toBe(true);
  });

  it("reset reinitialise les valeurs et touched", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    act(() => {
      result.current.handleChange("titre", "Test");
      result.current.handleBlur("titre");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.titre).toBe("");
    expect(result.current.touched.titre).toBe(false);
  });

  it("detecte un email invalide", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    act(() => {
      result.current.handleChange("email", "pas-un-email");
    });

    expect(result.current.errors.email).toBe("Adresse email invalide");
  });

  it("detecte un titre trop court", () => {
    const { result } = renderHook(() => useFormValidation(valeursInitiales, regles));

    act(() => {
      result.current.handleChange("titre", "AB");
    });

    expect(result.current.errors.titre).toBe("3 caractères minimum");
  });
});
