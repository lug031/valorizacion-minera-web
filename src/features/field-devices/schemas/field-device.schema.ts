import { z } from "zod";

export const assignFieldDeviceSchema = z.object({
  fieldUserId: z.string().min(1, "Seleccione un usuario de campo"),
  deviceLabel: z.string().max(120, "Máximo 120 caracteres").optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export const updateFieldDeviceSchema = z.object({
  isBlocked: z.boolean(),
  deviceLabel: z.string().max(120, "Máximo 120 caracteres").optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export interface EnrollmentCodeResult {
  fieldDeviceId: string;
  enrollmentCode: string;
  expiresAt: string;
  codeLength: number;
  singleUse: boolean;
}

export type AssignFieldDeviceFormInput = z.input<typeof assignFieldDeviceSchema>;
export type AssignFieldDeviceFormValues = z.output<typeof assignFieldDeviceSchema>;
export type UpdateFieldDeviceFormInput = z.input<typeof updateFieldDeviceSchema>;
export type UpdateFieldDeviceFormValues = z.output<typeof updateFieldDeviceSchema>;

export type FieldDeviceStatus = "pending" | "enrolled" | "revoked";

export interface FieldDeviceRecord {
  id: string;
  fieldUserId: string;
  fieldUserUsername: string | null;
  fieldUserDisplayName: string | null;
  fieldUserRole: "admin" | "operador" | null;
  deviceFingerprintHash: string | null;
  status: FieldDeviceStatus | null;
  isBlocked: boolean | null;
  validUntil: string | null;
  graceDaysOffline: number | null;
  lastSeenAt: string | null;
  platform: string | null;
  appVersion: string | null;
  notes: string | null;
  metadataJson: string | null;
  enrolledAt: string | null;
  revokedAt: string | null;
  deviceLabel: string | null;
  hasActiveActivationCode: boolean | null;
  activationExpiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function fieldDeviceStatusLabel(status: FieldDeviceStatus | null | undefined): string {
  if (status === "pending") return "Pendiente de activación";
  if (status === "enrolled") return "Activo";
  if (status === "revoked") return "Retirado";
  return "—";
}

export function recordToUpdateFormValues(record: FieldDeviceRecord): UpdateFieldDeviceFormInput {
  return {
    isBlocked: record.isBlocked ?? false,
    deviceLabel: record.deviceLabel ?? "",
    validUntil: record.validUntil ? record.validUntil.slice(0, 10) : "",
    notes: record.notes ?? "",
  };
}

export function buildEnrollmentInstructions(
  device: FieldDeviceRecord,
  enrollmentCode: string,
  expiresAt: string
): string {
  const username = device.fieldUserUsername ?? "su usuario de campo";
  const displayName = device.fieldUserDisplayName ?? username;
  const expiry = new Date(expiresAt).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    `Código de activación — ${displayName}`,
    `Código: ${enrollmentCode}`,
    `Válido hasta: ${expiry}`,
    "",
    "En la app: Activar dispositivo",
    `Usuario: ${username}`,
    "Contraseña: la que le indicó el administrador",
    `Código: ${enrollmentCode}`,
  ].join("\n");
}

export function maxDevicesForRole(role: FieldDeviceRecord["fieldUserRole"]): number {
  return role === "admin" ? 2 : 1;
}
