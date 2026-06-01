import { randomUUID } from "node:crypto";
import type { AppSyncResolverHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/field-valuations";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { assertValidFingerprintHash } from "../field-devices/enrollment-crypto";
import { FieldValuationError, throwFieldValuationError } from "./errors";

type PushMobileValuationResult = Schema["PushMobileValuationResult"]["type"];

type FieldHandlerEvent = {
  fieldName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
};

type FieldUserItem = {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
};

type FieldDeviceItem = {
  id: string;
  fieldUserId: string;
  deviceFingerprintHash?: string | null;
  status: "pending" | "enrolled" | "revoked";
  isBlocked: boolean;
  deviceLabel?: string | null;
};

type ValuationItem = {
  id: string;
  code: string;
  fecha: string;
  materialTypeCode: string;
  providerName?: string | null;
  observaciones?: string | null;
  formulaVersion: string;
  snapshotJson: string;
  syncStatus: string;
  mobileId: string;
  createdByUserId: string;
  createdByUsername?: string | null;
  createdByDisplayName?: string | null;
  fieldDeviceId?: string | null;
  fieldDeviceLabel?: string | null;
  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const MAX_SNAPSHOT_BYTES = 512 * 1024;

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

function resolveFieldName(event: FieldHandlerEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) throw new Error("Operación no soportada: nombre de campo no disponible");
  return field;
}

function valuationTableName(): string {
  const name = env.VALUATION_TABLE_NAME;
  if (!name) throw new Error("Tabla Valuation no configurada");
  return name;
}

function fieldDeviceTableName(): string {
  const name = env.FIELDDEVICE_TABLE_NAME;
  if (!name) throw new Error("Tabla FieldDevice no configurada");
  return name;
}

function fieldUserTableName(): string {
  const name = env.FIELDUSER_TABLE_NAME;
  if (!name) throw new Error("Tabla FieldUser no configurada");
  return name;
}

function requireString(value: unknown, label: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throwFieldValuationError("INVALID_PAYLOAD", `${label} es obligatorio`);
  }
  return text;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

async function scanFieldDevices(): Promise<FieldDeviceItem[]> {
  const res = await doc.send(new ScanCommand({ TableName: fieldDeviceTableName() }));
  return (res.Items ?? []) as FieldDeviceItem[];
}

async function scanFieldUsers(): Promise<FieldUserItem[]> {
  const res = await doc.send(new ScanCommand({ TableName: fieldUserTableName() }));
  return (res.Items ?? []) as FieldUserItem[];
}

async function getFieldDeviceById(id: string): Promise<FieldDeviceItem> {
  const devices = await scanFieldDevices();
  const device = devices.find((d) => d.id === id);
  if (!device) throwFieldValuationError("DEVICE_NOT_FOUND", "Dispositivo no encontrado");
  return device;
}

async function getFieldUserById(id: string): Promise<FieldUserItem> {
  const users = await scanFieldUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throwFieldValuationError("FIELD_USER_NOT_FOUND", "Usuario de campo no encontrado");
  return user;
}

async function findValuationByMobileId(mobileId: string): Promise<ValuationItem | undefined> {
  const res = await doc.send(
    new ScanCommand({
      TableName: valuationTableName(),
      FilterExpression: "mobileId = :mobileId",
      ExpressionAttributeValues: { ":mobileId": mobileId },
      Limit: 1,
    })
  );
  const item = res.Items?.[0] as ValuationItem | undefined;
  return item;
}

function assertDeviceAuthorized(
  device: FieldDeviceItem,
  deviceFingerprintHash: string,
  createdByFieldUserId: string
): void {
  if (device.status === "revoked") {
    throwFieldValuationError("DEVICE_REVOKED", "Dispositivo revocado");
  }
  if (device.status !== "enrolled") {
    throwFieldValuationError("DEVICE_NOT_ENROLLED", "El dispositivo no está activado");
  }
  if (device.isBlocked) {
    throwFieldValuationError("DEVICE_BLOCKED", "Dispositivo bloqueado por administración");
  }
  if (device.deviceFingerprintHash !== deviceFingerprintHash) {
    throwFieldValuationError("FINGERPRINT_MISMATCH", "El identificador del dispositivo no coincide");
  }
  if (device.fieldUserId !== createdByFieldUserId) {
    throwFieldValuationError("USER_DEVICE_MISMATCH", "El usuario no coincide con el dispositivo");
  }
}

async function handlePushMobileValuation(event: FieldHandlerEvent): Promise<PushMobileValuationResult> {
  const args = event.arguments;
  const mobileId = requireString(args.mobileId, "mobileId");
  const code = requireString(args.code, "code");
  const fecha = requireString(args.fecha, "fecha");
  const materialTypeCode = requireString(args.materialTypeCode, "materialTypeCode");
  const formulaVersion = requireString(args.formulaVersion, "formulaVersion");
  const snapshotJson = requireString(args.snapshotJson, "snapshotJson");
  const createdByFieldUserId = requireString(args.createdByFieldUserId, "createdByFieldUserId");
  const createdByUsername = requireString(args.createdByUsername, "createdByUsername");
  const createdByDisplayName = optionalString(args.createdByDisplayName);
  const sourceCreatedAt = requireString(args.sourceCreatedAt, "sourceCreatedAt");
  const sourceUpdatedAt = requireString(args.sourceUpdatedAt, "sourceUpdatedAt");
  const cloudDeviceId = requireString(args.cloudDeviceId, "cloudDeviceId");
  const deviceFingerprintHash = requireString(args.deviceFingerprintHash, "deviceFingerprintHash");
  const providerName = optionalString(args.providerName);
  const observaciones = optionalString(args.observaciones);
  const fieldDeviceLabel = optionalString(args.fieldDeviceLabel);

  if (snapshotJson.length > MAX_SNAPSHOT_BYTES) {
    throwFieldValuationError(
      "PAYLOAD_TOO_LARGE",
      "La cotización supera el tamaño máximo permitido para sincronización"
    );
  }

  try {
    JSON.parse(snapshotJson);
  } catch {
    throwFieldValuationError("INVALID_PAYLOAD", "El snapshot de cálculo no es JSON válido");
  }

  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throwFieldValuationError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }

  const existing = await findValuationByMobileId(mobileId);
  const nowIso = new Date().toISOString();
  if (existing) {
    return {
      cloudValuationId: existing.id,
      mobileId,
      syncStatus: existing.syncStatus ?? "synced",
      alreadyExisted: true,
      serverTime: nowIso,
    };
  }

  const [device, fieldUser] = await Promise.all([
    getFieldDeviceById(cloudDeviceId),
    getFieldUserById(createdByFieldUserId),
  ]);

  assertDeviceAuthorized(device, deviceFingerprintHash, createdByFieldUserId);

  if (!fieldUser.isActive) {
    throwFieldValuationError("FIELD_USER_INACTIVE", "Usuario de campo desactivado");
  }

  const cloudId = randomUUID();
  const item: ValuationItem = {
    id: cloudId,
    code,
    fecha,
    materialTypeCode,
    providerName,
    observaciones,
    formulaVersion,
    snapshotJson,
    syncStatus: "synced",
    mobileId,
    createdByUserId: createdByFieldUserId,
    createdByUsername,
    createdByDisplayName,
    fieldDeviceId: cloudDeviceId,
    fieldDeviceLabel: fieldDeviceLabel ?? device.deviceLabel ?? null,
    sourceCreatedAt,
    sourceUpdatedAt,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await doc.send(
    new PutCommand({
      TableName: valuationTableName(),
      Item: item,
      ConditionExpression: "attribute_not_exists(id)",
    })
  );

  return {
    cloudValuationId: cloudId,
    mobileId,
    syncStatus: "synced",
    alreadyExisted: false,
    serverTime: nowIso,
  };
}

function mapHandlerError(error: unknown): never {
  if (error instanceof FieldValuationError) throw error;
  if (error instanceof Error && error.message === "INVALID_FINGERPRINT") {
    throwFieldValuationError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }
  throw error;
}

export const handler: AppSyncResolverHandler<
  Record<string, unknown>,
  PushMobileValuationResult | null
> = async (event) => {
  try {
    const fieldEvent = event as FieldHandlerEvent;
    const field = resolveFieldName(fieldEvent);
    switch (field) {
      case "pushMobileValuation":
        return await handlePushMobileValuation(fieldEvent);
      default:
        throw new Error(`Operación no soportada: ${field}`);
    }
  } catch (error) {
    mapHandlerError(error);
  }
};
