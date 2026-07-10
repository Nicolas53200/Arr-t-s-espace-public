import { useState, useCallback, useMemo } from "react";
import { validerChamp, validerFormulaire } from "@/lib/validation";
import type { RegleValidation, ReglesFormulaire } from "@/lib/validation";

interface UseFormValidationResult<T extends string> {
  values: Record<T, string>;
  errors: Record<T, string | undefined>;
  touched: Record<T, boolean>;
  handleChange: (champ: T, valeur: string) => void;
  handleBlur: (champ: T) => void;
  validate: () => boolean;
  isValid: boolean;
  reset: (valeursInitiales?: Record<T, string>) => void;
  setValues: React.Dispatch<React.SetStateAction<Record<T, string>>>;
}

export function useFormValidation<T extends string>(
  valeursInitiales: Record<T, string>,
  regles: ReglesFormulaire<T>,
): UseFormValidationResult<T> {
  const [values, setValues] = useState<Record<T, string>>(valeursInitiales);
  const [touched, setTouched] = useState<Record<T, boolean>>(
    () => {
      const t = {} as Record<T, boolean>;
      for (const k of Object.keys(valeursInitiales) as T[]) {
        t[k] = false;
      }
      return t;
    },
  );

  const errors = useMemo(() => {
    return validerFormulaire(values, regles);
  }, [values, regles]);

  const isValid = useMemo(() => {
    return (Object.keys(regles) as T[]).every((k) => !errors[k]);
  }, [errors, regles]);

  const handleChange = useCallback((champ: T, valeur: string) => {
    setValues((prev) => ({ ...prev, [champ]: valeur }));
  }, []);

  const handleBlur = useCallback((champ: T) => {
    setTouched((prev) => ({ ...prev, [champ]: true }));
  }, []);

  const validate = useCallback((): boolean => {
    // Marquer tous les champs comme touched
    setTouched((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(regles) as T[]) {
        next[k] = true;
      }
      return next;
    });
    // Calculer la validité synchrone
    const errs = validerFormulaire(values, regles);
    return (Object.keys(regles) as T[]).every((k) => !errs[k]);
  }, [values, regles]);

  const reset = useCallback((valeursReset?: Record<T, string>) => {
    setValues(valeursReset ?? valeursInitiales);
    setTouched(() => {
      const t = {} as Record<T, boolean>;
      for (const k of Object.keys(valeursInitiales) as T[]) {
        t[k] = false;
      }
      return t;
    });
  }, [valeursInitiales]);

  return { values, errors, touched, handleChange, handleBlur, validate, isValid, reset, setValues };
}

/**
 * Helper : valide un seul champ hors hook (utile pour les phases dynamiques).
 */
export { validerChamp, validerFormulaire };
export type { RegleValidation, ReglesFormulaire };
