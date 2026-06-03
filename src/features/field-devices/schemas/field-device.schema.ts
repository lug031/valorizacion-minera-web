import { z } from "zod";
import { isoToPeruDateAndTime } from "@/lib/datetime/peru-local";

const optionalTimeHm = z
  .string()
  .optional()
  .refine((v) => !v?.trim() || /^([01]?\d|2[0-3]):[0-5]\d$/.test(v.trim()), {
    message: "Use formato HH:MM (24 h, horario Perú)",
  });

export const assignFieldDeviceSchema = z.object({
  fieldUserId: z.string().min(1, "Seleccione un usuario de campo"),
  deviceLabel: z.string().max(120, "Máximo 120 caracteres").optional(),
  validUntil: z.string().optional(),
  validUntilTime: optionalTimeHm,
  trialMode: z.boolean().optional(),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export const updateFieldDeviceSchema = z.object({
  isBlocked: z.boolean(),
  deviceLabel: z.string().max(120, "Máximo 120 caracteres").optional(),
  validUntil: z.string().optional(),
  validUntilTime: optionalTimeHm,
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export interface EnrollmentCodeResult {
  fieldDeviceId: string;
  enrollmentCode: string;
  expiresAt: string;
  codeLength: number;
  singleUse: boolean;
}

export interface UsageExtensionCodeResult {
  fieldDeviceId: string;
  extensionCode: string;
  expiresAt: string;
  grantMinutes: number;
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
  usagePolicy: "standard" | "trial" | null;
  trialLimitMinutes: number | null;
  usageQuotaResetAt: string | null;
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

export function usagePolicyLabel(policy: FieldDeviceRecord["usagePolicy"]): string {
  if (policy === "trial") return "Demo";
  return "Estándar";
}

export function buildUsageExtensionInstructions(
  device: FieldDeviceRecord,
  extensionCode: string,
  expiresAt: string,
  grantMinutes: number
): string {
  const displayName = device.fieldUserDisplayName ?? device.fieldUserUsername ?? "el operador";
  const expiry = new Date(expiresAt).toLocaleString("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return [
    `Código de extensión de uso — ${displayName}`,
    `Código: ${extensionCode}`,
    `Válido hasta: ${expiry}`,
    `Tiempo concedido: ${grantMinutes} minutos`,
    "",
    "En la app (pantalla de cupo agotado): ingrese este código.",
  ].join("\n");
}

export function fieldDeviceStatusLabel(status: FieldDeviceStatus | null | undefined): string {
  if (status === "pending") return "Pendiente de activación";
  if (status === "enrolled") return "Activo";
  if (status === "revoked") return "Retirado";
  return "—";
}

export function recordToUpdateFormValues(record: FieldDeviceRecord): UpdateFieldDeviceFormInput {
  const { date, time } = isoToPeruDateAndTime(record.validUntil);
  const isEndOfDay = time === "23:59";
  return {
    isBlocked: record.isBlocked ?? false,
    deviceLabel: record.deviceLabel ?? "",
    validUntil: date,
    validUntilTime: isEndOfDay ? "" : time,
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
