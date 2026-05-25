import { z } from "zod";
import { optionalNonNegativeNumeric, optionalPercentNumeric } from "@/lib/validators/numeric";

export function normalizeProviderName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export const providerDefaultsFields = [
  "recPercentGold",
  "recPercentSilver",
  "rcGold",
  "rcSilver",
  "consumos",
  "flete",
  "interGold",
  "interSilver",
  "factor",
] as const;

export type ProviderDefaultsField = (typeof providerDefaultsFields)[number];

export const providerFormSchema = z.object({
  name: z
    .string()
    .min(1, "Requerido")
    .max(120, "Máximo 120 caracteres")
    .transform(normalizeProviderName),
  sortOrder: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return 0;
      const n = typeof v === "number" ? v : parseInt(String(v), 10);
      return Number.isNaN(n) ? 0 : n;
    }),
  isActive: z.boolean(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  recPercentGold: optionalPercentNumeric,
  recPercentSilver: optionalPercentNumeric,
  rcGold: optionalNonNegativeNumeric,
  rcSilver: optionalNonNegativeNumeric,
  consumos: optionalNonNegativeNumeric,
  flete: optionalNonNegativeNumeric,
  interGold: optionalNonNegativeNumeric,
  interSilver: optionalNonNegativeNumeric,
  factor: optionalNonNegativeNumeric,
});

export type ProviderFormInput = z.input<typeof providerFormSchema>;
export type ProviderFormValues = z.output<typeof providerFormSchema>;

export interface ProviderDefaultsRecord {
  id: string;
  providerId: string;
  recPercentGold: string | null;
  recPercentSilver: string | null;
  rcGold: string | null;
  rcSilver: string | null;
  consumos: string | null;
  flete: string | null;
  interGold: string | null;
  interSilver: string | null;
  factor: string | null;
}

export interface ProviderRecord {
  id: string;
  name: string;
  sortOrder: number | null;
  isActive: boolean | null;
  notes: string | null;
  metadataJson: string | null;
  defaults: ProviderDefaultsRecord | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function hasProviderDefaults(defaults: ProviderDefaultsRecord | null): boolean {
  if (!defaults) return false;
  return providerDefaultsFields.some((field) => {
    const value = defaults[field];
    return value !== null && value !== undefined && value.trim() !== "";
  });
}

export function recordToFormValues(record: ProviderRecord): ProviderFormInput {
  const d = record.defaults;
  return {
    name: record.name,
    sortOrder: String(record.sortOrder ?? 0),
    isActive: record.isActive ?? true,
    notes: record.notes ?? "",
    recPercentGold: d?.recPercentGold ?? "",
    recPercentSilver: d?.recPercentSilver ?? "",
    rcGold: d?.rcGold ?? "",
    rcSilver: d?.rcSilver ?? "",
    consumos: d?.consumos ?? "",
    flete: d?.flete ?? "",
    interGold: d?.interGold ?? "",
    interSilver: d?.interSilver ?? "",
    factor: d?.factor ?? "",
  };
}

export function formHasDefaults(values: ProviderFormValues): boolean {
  return providerDefaultsFields.some((field) => {
    const value = values[field];
    return typeof value === "string" && value.trim() !== "";
  });
}
