import { z } from "zod";
import type { StaffGroup } from "@/lib/auth/cognito-groups";

export const STAFF_ROLE_OPTIONS: { value: StaffGroup; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
];

export const createStaffUserSchema = z.object({
  email: z.string().min(1, "Requerido").email("Correo inválido"),
  displayName: z.string().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  role: z.enum(["admin", "supervisor"]),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  temporaryPassword: z
    .string()
    .optional()
    .refine((v) => !v || v.trim().length >= 8, "Mínimo 8 caracteres"),
  isActive: z.boolean(),
});

export const updateStaffUserSchema = z.object({
  displayName: z.string().min(1, "Requerido").max(120, "Máximo 120 caracteres"),
  role: z.enum(["admin", "supervisor"]),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
  isActive: z.boolean(),
});

export type CreateStaffUserFormInput = z.input<typeof createStaffUserSchema>;
export type CreateStaffUserFormValues = z.output<typeof createStaffUserSchema>;
export type UpdateStaffUserFormInput = z.input<typeof updateStaffUserSchema>;
export type UpdateStaffUserFormValues = z.output<typeof updateStaffUserSchema>;

export interface StaffUserRecord {
  id: string;
  cognitoSub: string;
  username: string;
  email: string | null;
  displayName: string | null;
  role: StaffGroup | null;
  isActive: boolean | null;
  notes: string | null;
  cognitoEnabled: boolean | null;
  accessStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  temporaryPassword?: string | null;
}

export function recordToCreateFormValues(record: StaffUserRecord): CreateStaffUserFormInput {
  return {
    email: record.email ?? record.username,
    displayName: record.displayName ?? "",
    role: record.role ?? "supervisor",
    notes: record.notes ?? "",
    temporaryPassword: "",
    isActive: record.isActive ?? true,
  };
}

export function recordToUpdateFormValues(record: StaffUserRecord): UpdateStaffUserFormInput {
  return {
    displayName: record.displayName ?? "",
    role: record.role ?? "supervisor",
    notes: record.notes ?? "",
    isActive: record.isActive ?? true,
  };
}

export function accessStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "activo":
      return "Activo";
    case "inactivo":
      return "Inactivo";
    case "pendiente":
      return "Pendiente (cambio de contraseña)";
    default:
      return status ?? "—";
  }
}
