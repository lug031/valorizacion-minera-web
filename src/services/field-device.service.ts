import { adminDataClient } from "@/lib/amplify/data-client";
import { peruLocalDateTimeToIso } from "@/lib/datetime/peru-local";
import type {
  AssignFieldDeviceFormValues,
  EnrollmentCodeResult,
  FieldDeviceRecord,
  UpdateFieldDeviceFormValues,
  UsageExtensionCodeResult,
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
  usagePolicy?: "standard" | "trial" | null;
  trialLimitMinutes?: number | null;
  usageQuotaResetAt?: string | null;
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
    usagePolicy: row.usagePolicy ?? "standard",
    trialLimitMinutes: row.trialLimitMinutes ?? null,
    usageQuotaResetAt: row.usageQuotaResetAt ?? null,
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

function toValidUntilIso(
  dateOnly: string | undefined,
  timeHm: string | undefined
): string | undefined {
  return peruLocalDateTimeToIso(dateOnly, timeHm);
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
    validUntil: toValidUntilIso(values.validUntil, values.validUntilTime),
    deviceLabel: values.deviceLabel?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    trialMode: values.trialMode === true,
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
    validUntil: toValidUntilIso(values.validUntil, values.validUntilTime),
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

export async function generateUsageExtensionCode(
  fieldDeviceId: string
): Promise<UsageExtensionCodeResult> {
  const { data, errors } = await adminDataClient.mutations.generateManagedUsageExtensionCode({
    fieldDeviceId,
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join("; "));
  if (!data) throw new Error("No se pudo generar el código de extensión");
  return {
    fieldDeviceId: data.fieldDeviceId,
    extensionCode: data.extensionCode,
    expiresAt: data.expiresAt,
    grantMinutes: data.grantMinutes ?? 120,
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
