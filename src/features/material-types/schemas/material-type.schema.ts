import { z } from "zod";

export function normalizeMaterialTypeCode(value: string): string {
  return value.trim().toUpperCase();
}

export const materialTypeSchema = z.object({
  code: z
    .string()
    .min(1, "Requerido")
    .max(20, "Máximo 20 caracteres")
    .transform(normalizeMaterialTypeCode)
    .refine((v) => /^[A-Z0-9_-]+$/.test(v), "Use letras, números, guion o guion bajo"),
  label: z.string().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
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
});

export type MaterialTypeFormInput = z.input<typeof materialTypeSchema>;
export type MaterialTypeFormValues = z.output<typeof materialTypeSchema>;

export interface MaterialTypeRecord {
  id: string;
  code: string;
  label: string;
  sortOrder: number | null;
  isActive: boolean | null;
  notes: string | null;
  metadataJson: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
