import { adminDataClient } from "@/lib/amplify/data-client";
import type {
  AssignFieldDeviceFormValues,
  EnrollmentCodeResult,
  FieldDeviceRecord,
  UpdateFieldDeviceFormValues,
} from "@/features/field-devices/schemas/field-device.schema";

function mapFieldDevice(row: {
  id: string;
  fieldUserId: string;
  fieldUserUsername?: string | null;
  fieldUserDisplayName?: string | null;
  fieldUserRole?: "admin" | "operador" | null;
  deviceFingerprintHash?: string | null;
  status?: "pending" | "enrolled" | "revoked" | null;
  isBlocked?: boolean | null;
  validUntil?: string | null;
  graceDaysOffline?: number | null;
  lastSeenAt?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  notes?: string | null;
  metadataJson?: string | null;
  enrolledAt?: string | null;
  revokedAt?: string | null;
  deviceLabel?: string | null;
  hasActiveActivationCode?: boolean | null;
  activationExpiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): FieldDeviceRecord {
  return {
    id: row.id,
    fieldUserId: row.fieldUserId,
    fieldUserUsername: row.fieldUserUsername ?? null,
    fieldUserDisplayName: row.fieldUserDisplayName ?? null,
    fieldUserRole: row.fieldUserRole ?? null,
    deviceFingerprintHash: row.deviceFingerprintHash ?? null,
    status: row.status ?? null,
    isBlocked: row.isBlocked ?? false,
    validUntil: row.validUntil ?? null,
    graceDaysOffline: row.graceDaysOffline ?? null,
    lastSeenAt: row.lastSeenAt ?? null,
    platform: row.platform ?? null,
    appVersion: row.appVersion ?? null,
    notes: row.notes ?? null,
    metadataJson: row.metadataJson ?? null,
    enrolledAt: row.enrolledAt ?? null,
    revokedAt: row.revokedAt ?? null,
    deviceLabel: row.deviceLabel ?? null,
    hasActiveActivationCode: row.hasActiveActivationCode ?? false,
    activationExpiresAt: row.activationExpiresAt ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
  };
}

function toIsoDateEndOfDay(dateOnly: string | undefined): string | undefined {
  const trimmed = dateOnly?.trim();
  if (!trimmed) return undefined;
  const date = new Date(`${trimmed}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Fecha de validez inválida");
  }
  return date.toISOString();
}

export async function listFieldDevices(): Promise<FieldDeviceRecord[]> {
  const { data, errors } = await adminDataClient.queries.listManagedFieldDevices();
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return (data ?? []).filter((row): row is NonNullable<typeof row> => row != null).map(mapFieldDevice);
}

export async function assignFieldDevice(
  values: AssignFieldDeviceFormValues
): Promise<FieldDeviceRecord> {
  const { data, errors } = await adminDataClient.mutations.assignManagedFieldDevice({
    fieldUserId: values.fieldUserId,
    validUntil: toIsoDateEndOfDay(values.validUntil),
    deviceLabel: values.deviceLabel?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo asignar el dispositivo");
  return mapFieldDevice(data);
}

export async function updateFieldDevice(
  id: string,
  values: UpdateFieldDeviceFormValues
): Promise<FieldDeviceRecord> {
  const { data, errors } = await adminDataClient.mutations.updateManagedFieldDevice({
    id,
    isBlocked: values.isBlocked,
    validUntil: toIsoDateEndOfDay(values.validUntil),
    deviceLabel: values.deviceLabel?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo actualizar el dispositivo");
  return mapFieldDevice(data);
}

export async function generateFieldDeviceEnrollmentCode(
  fieldDeviceId: string
): Promise<EnrollmentCodeResult> {
  const { data, errors } = await adminDataClient.mutations.generateManagedFieldDeviceEnrollmentCode({
    fieldDeviceId,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo generar el código de activación");
  return {
    fieldDeviceId: data.fieldDeviceId,
    enrollmentCode: data.enrollmentCode,
    expiresAt: data.expiresAt,
    codeLength: data.codeLength ?? 8,
    singleUse: data.singleUse ?? true,
  };
}

export async function revokeFieldDevice(id: string): Promise<FieldDeviceRecord> {
  const { data, errors } = await adminDataClient.mutations.revokeManagedFieldDevice({ id });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo revocar el dispositivo");
  return mapFieldDevice(data);
}
