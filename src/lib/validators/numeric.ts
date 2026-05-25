import { z } from "zod";

export function parseNumericInput(value: string): number {
  return parseFloat(value.replace(",", "."));
}

/** Numérico requerido, no negativo. Acepta coma decimal. */
export const requiredNonNegativeNumeric = z
  .string()
  .min(1, "Requerido")
  .refine((v) => !Number.isNaN(parseNumericInput(v)), "Número inválido")
  .refine((v) => parseNumericInput(v) >= 0, "No puede ser negativo");

/** Porcentaje 0–100 (REC). */
export const requiredPercentNumeric = requiredNonNegativeNumeric.refine(
  (v) => parseNumericInput(v) <= 100,
  "No puede ser mayor a 100"
);

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

/** Numérico opcional; vacío = sin valor. */
export const optionalNonNegativeNumeric = z
  .string()
  .optional()
  .refine((v) => isBlank(v) || !Number.isNaN(parseNumericInput(v!)), "Número inválido")
  .refine((v) => isBlank(v) || parseNumericInput(v!) >= 0, "No puede ser negativo");

/** Porcentaje opcional 0–100. */
export const optionalPercentNumeric = optionalNonNegativeNumeric.refine(
  (v) => isBlank(v) || parseNumericInput(v!) <= 100,
  "No puede ser mayor a 100"
);
