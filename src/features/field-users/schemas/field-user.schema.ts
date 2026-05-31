import { z } from "zod";

export const FIELD_ROLE_OPTIONS = [
  { value: "admin" as const, label: "Administrador móvil" },
  { value: "operador" as const, label: "Operador de campo" },
];

export const createFieldUserSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(40, "Máximo 40 caracteres")
    .regex(/^[a-z0-9._-]+$/i, "Solo letras, números, punto, guion y guion bajo"),
  displayName: z.string().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  role: z.enum(["admin", "operador"]),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  initialPassword: z
    .string()
    .optional()
    .refine((v) => !v || v.trim().length >= 8, "Mínimo 8 caracteres"),
  isActive: z.boolean(),
});

export const updateFieldUserSchema = z.object({
  displayName: z.string().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  role: z.enum(["admin", "operador"]),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  isActive: z.boolean(),
});

export type CreateFieldUserFormInput = z.input<typeof createFieldUserSchema>;
export type CreateFieldUserFormValues = z.output<typeof createFieldUserSchema>;
export type UpdateFieldUserFormInput = z.input<typeof updateFieldUserSchema>;
export type UpdateFieldUserFormValues = z.output<typeof updateFieldUserSchema>;

export interface FieldUserRecord {
  id: string;
  username: string;
  displayName: string | null;
  role: "admin" | "operador" | null;
  isActive: boolean | null;
  notes: string | null;
  metadataJson: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  initialPassword?: string | null;
}

export function recordToUpdateFormValues(record: FieldUserRecord): UpdateFieldUserFormInput {
  return {
    displayName: record.displayName ?? "",
    role: record.role ?? "operador",
    notes: record.notes ?? "",
    isActive: record.isActive ?? true,
  };
}

export function fieldRoleLabel(role: FieldUserRecord["role"]): string {
  if (role === "admin") return "Administrador móvil";
  if (role === "operador") return "Operador de campo";
  return "—";
}
