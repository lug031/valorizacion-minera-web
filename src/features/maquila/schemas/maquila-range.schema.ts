import { z } from "zod";

function parseNum(v: string): number {
  return parseFloat(v.replace(",", "."));
}

export const maquilaRangeSchema = z
  .object({
    minLeyOzTc: z
      .string()
      .min(1, "Requerido")
      .refine((v) => !Number.isNaN(parseNum(v)), "Número inválido")
      .refine((v) => parseNum(v) >= 0, "No puede ser negativo"),
    maxLeyOzTc: z
      .string()
      .min(1, "Requerido")
      .refine((v) => !Number.isNaN(parseNum(v)), "Número inválido")
      .refine((v) => parseNum(v) >= 0, "No puede ser negativo"),
    maquila: z
      .string()
      .min(1, "Requerido")
      .refine((v) => !Number.isNaN(parseNum(v)), "Número inválido")
      .refine((v) => parseNum(v) >= 0, "No puede ser negativo"),
    sortOrder: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === undefined || v === "") return 0;
        const n = typeof v === "number" ? v : parseInt(String(v), 10);
        return Number.isNaN(n) ? 0 : n;
      }),
    isActive: z.boolean(),
    notes: z.string().optional(),
  })
  .refine((data) => parseNum(data.maxLeyOzTc) >= parseNum(data.minLeyOzTc), {
    message: "Ley máxima debe ser ≥ ley mínima",
    path: ["maxLeyOzTc"],
  });

export type MaquilaRangeFormInput = z.input<typeof maquilaRangeSchema>;
export type MaquilaRangeFormValues = z.output<typeof maquilaRangeSchema>;

export interface MaquilaRangeRecord {
  id: string;
  minLeyOzTc: string;
  maxLeyOzTc: string;
  maquila: string;
  sortOrder: number | null;
  isActive: boolean | null;
  notes: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
