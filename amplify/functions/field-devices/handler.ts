import { createHmac, randomUUID } from "node:crypto";
import type { AppSyncResolverHandler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/field-devices";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { FieldDeviceError, throwFieldDeviceError } from "./errors";
import {
  assertValidFingerprintHash,
  formatEnrollmentCodeForDisplay,
  generateEnrollmentCode,
  hashEnrollmentCode,
  normalizeEnrollmentCode,
  verifyMobilePassword,
} from "./enrollment-crypto";

type FieldRole = "admin" | "operador";
type FieldDeviceStatus = "pending" | "enrolled" | "revoked";
type FieldDeviceRecord = Schema["FieldDeviceRecord"]["type"];
type EnrollmentCodeResult = Schema["EnrollmentCodeResult"]["type"];
type FieldDeviceEnrollmentResult = Schema["FieldDeviceEnrollmentResult"]["type"];
type FieldDeviceStatusSyncResult = Schema["FieldDeviceStatusSyncResult"]["type"];
type DeviceSessionTokenResult = Schema["DeviceSessionTokenResult"]["type"];

type FieldHandlerEvent = {
  fieldName?: string;
  typeName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
};

const MAX_ACTIVE_DEVICES: Record<FieldRole, number> = {
  operador: 1,
  admin: 2,
};

const DEFAULT_GRACE_DAYS_OFFLINE = 7;
const ENROLLMENT_CODE_TTL_MS = 72 * 60 * 60 * 1000;
const ENROLLMENT_CODE_LENGTH = 8;
const MAX_ACTIVATION_ATTEMPTS = 5;
const ACTIVATION_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const DEVICE_SESSION_TOKEN_TTL_SECONDS = 30 * 60;

function resolveFieldName(event: FieldHandlerEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) throw new Error("Operación no soportada: nombre de campo no disponible");
  return field;
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

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

function enrollmentTokenTableName(): string {
  const name = env.ENROLLMENTTOKEN_TABLE_NAME;
  if (!name) throw new Error("Tabla EnrollmentToken no configurada");
  return name;
}

function auditLogTableName(): string {
  const name = env.AUDITLOG_TABLE_NAME;
  return name || "AuditLog";
}

function deviceSessionTokenSecret(): string {
  const secret = env.DEVICE_SESSION_TOKEN_SECRET?.trim();
  if (!secret) throw new Error("Secret de sesión de dispositivo no configurado");
  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signDeviceSessionToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", deviceSessionTokenSecret())
    .update(signingInput, "utf8")
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function decodeBase64UrlJson<T>(encoded: string): T {
  const text = Buffer.from(encoded, "base64url").toString("utf8");
  return JSON.parse(text) as T;
}

function verifyDeviceSessionToken(
  token: string,
  expected: {
    cloudDeviceId: string;
    deviceFingerprintHash: string;
  }
): { sub: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", deviceSessionTokenSecret())
    .update(signingInput, "utf8")
    .digest("base64url");
  if (signature !== expectedSignature) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  const payload = decodeBase64UrlJson<{
    sub?: string;
    cloudDeviceId?: string;
    deviceFingerprintHash?: string;
    exp?: number;
    tokenType?: string;
  }>(encodedPayload);
  const nowEpoch = Math.floor(Date.now() / 1000);
  if (
    payload.tokenType !== "device_session" ||
    typeof payload.sub !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp <= nowEpoch
  ) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida o expirada");
  }
  if (
    payload.cloudDeviceId !== expected.cloudDeviceId ||
    payload.deviceFingerprintHash !== expected.deviceFingerprintHash
  ) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  return { sub: payload.sub };
}

async function writeAuditLog(entry: {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  payload?: unknown;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const payloadJson =
    entry.payload == null ? null : JSON.stringify(entry.payload).slice(0, 4000);
  await doc.send(
    new PutCommand({
      TableName: auditLogTableName(),
      Item: {
        id: randomUUID(),
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        payloadJson,
        userId: entry.userId ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    })
  );
}

async function writeAuditLogSafe(entry: {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  payload?: unknown;
}): Promise<void> {
  try {
    await writeAuditLog(entry);
  } catch (error) {
    console.warn(
      JSON.stringify({
        component: "field-devices",
        event: "audit_log_write_failed",
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "unknown",
      })
    );
  }
}

type FieldUserItem = {
  id: string;
  username: string;
  displayName: string;
  role: FieldRole;
  isActive: boolean;
  mobilePasswordHash: string;
};

type FieldDeviceItem = {
  id: string;
  fieldUserId: string;
  deviceFingerprintHash?: string | null;
  status: FieldDeviceStatus;
  isBlocked: boolean;
  validUntil?: string | null;
  graceDaysOffline: number;
  lastSeenAt?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  notes?: string | null;
  metadataJson?: string | null;
  deviceLabel?: string | null;
  enrolledAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type EnrollmentTokenItem = {
  id: string;
  fieldDeviceId: string;
  activationCodeHash: string;
  activationExpiresAt: string;
  activationConsumedAt?: string | null;
  activationAttemptCount?: number | null;
  lastActivationAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function mapHandlerError(error: unknown): never {
  if (error instanceof FieldDeviceError) throw error;
  if (error instanceof Error && error.message === "INVALID_FINGERPRINT") {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }
  if (error instanceof Error) {
    if (error.message.includes("Usuario de campo no encontrado")) {
      throwFieldDeviceError("FIELD_USER_NOT_FOUND", error.message);
    }
    if (error.message.includes("Dispositivo no encontrado")) {
      throwFieldDeviceError("DEVICE_NOT_FOUND", error.message);
    }
  }
  throw error;
}

async function scanFieldUsers(): Promise<FieldUserItem[]> {
  const res = await doc.send(new ScanCommand({ TableName: fieldUserTableName() }));
  return (res.Items ?? []) as FieldUserItem[];
}

async function scanFieldDevices(): Promise<FieldDeviceItem[]> {
  const res = await doc.send(new ScanCommand({ TableName: fieldDeviceTableName() }));
  return (res.Items ?? []) as FieldDeviceItem[];
}

async function scanEnrollmentTokens(): Promise<EnrollmentTokenItem[]> {
  const res = await doc.send(new ScanCommand({ TableName: enrollmentTokenTableName() }));
  return (res.Items ?? []) as EnrollmentTokenItem[];
}

async function getFieldUserById(id: string): Promise<FieldUserItem> {
  const users = await scanFieldUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("Usuario de campo no encontrado");
  return user;
}

async function getFieldDeviceById(id: string): Promise<FieldDeviceItem> {
  const devices = await scanFieldDevices();
  const device = devices.find((d) => d.id === id);
  if (!device) throw new Error("Dispositivo no encontrado");
  return device;
}

function isActiveDevice(device: FieldDeviceItem): boolean {
  return device.status === "pending" || device.status === "enrolled";
}

function assertDeviceQuota(
  fieldUser: FieldUserItem,
  devices: FieldDeviceItem[],
  excludeDeviceId?: string
): void {
  const active = devices.filter(
    (d) => d.fieldUserId === fieldUser.id && isActiveDevice(d) && d.id !== excludeDeviceId
  ).length;
  const max = MAX_ACTIVE_DEVICES[fieldUser.role];
  if (active >= max) {
    const label = fieldUser.role === "admin" ? "administrador móvil" : "operador";
    throwFieldDeviceError(
      "DEVICE_QUOTA_EXCEEDED",
      `El ${label} «${fieldUser.displayName}» ya tiene ${max} dispositivo(s) activo(s). Revoque uno antes de asignar otro.`
    );
  }
}

function parseOptionalIsoDate(value: unknown, label: string): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throwFieldDeviceError("INVALID_VALID_UNTIL", `${label} inválida`);
  }
  return date.toISOString();
}

function findActiveTokenForDevice(
  tokens: EnrollmentTokenItem[],
  fieldDeviceId: string,
  nowMs: number
): EnrollmentTokenItem | undefined {
  return tokens.find(
    (token) =>
      token.fieldDeviceId === fieldDeviceId &&
      !token.activationConsumedAt &&
      new Date(token.activationExpiresAt).getTime() > nowMs
  );
}

function assertTokenRateLimit(token: EnrollmentTokenItem, nowMs: number): void {
  const attempts = token.activationAttemptCount ?? 0;
  if (attempts < MAX_ACTIVATION_ATTEMPTS) return;
  const lastAttemptMs = token.lastActivationAttemptAt
    ? new Date(token.lastActivationAttemptAt).getTime()
    : 0;
  if (nowMs - lastAttemptMs < ACTIVATION_ATTEMPT_WINDOW_MS) {
    throwFieldDeviceError(
      "RATE_LIMITED",
      "Demasiados intentos fallidos. Espere 15 minutos o pida un código nuevo al administrador."
    );
  }
}

async function invalidateActiveTokensForDevice(fieldDeviceId: string, now: string): Promise<void> {
  const tokens = await scanEnrollmentTokens();
  const active = tokens.filter(
    (token) => token.fieldDeviceId === fieldDeviceId && !token.activationConsumedAt
  );
  await Promise.all(
    active.map((token) =>
      doc.send(
        new UpdateCommand({
          TableName: enrollmentTokenTableName(),
          Key: { id: token.id },
          UpdateExpression:
            "SET activationConsumedAt = :consumedAt, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":consumedAt": now,
            ":updatedAt": now,
          },
        })
      )
    )
  );
}

function assertFingerprintUnique(
  devices: FieldDeviceItem[],
  fingerprintHash: string,
  excludeDeviceId?: string
): void {
  const duplicate = devices.find(
    (device) =>
      device.id !== excludeDeviceId &&
      device.status === "enrolled" &&
      device.deviceFingerprintHash === fingerprintHash
  );
  if (duplicate) {
    throwFieldDeviceError(
      "FINGERPRINT_ALREADY_BOUND",
      "Este teléfono ya está registrado en otra cuenta activa"
    );
  }
}

function toFieldDeviceRecord(
  device: FieldDeviceItem,
  fieldUser: FieldUserItem | undefined,
  activeToken?: EnrollmentTokenItem
): FieldDeviceRecord {
  const nowMs = Date.now();
  const hasActiveActivationCode = Boolean(
    activeToken &&
      !activeToken.activationConsumedAt &&
      new Date(activeToken.activationExpiresAt).getTime() > nowMs
  );

  return {
    id: device.id,
    fieldUserId: device.fieldUserId,
    fieldUserUsername: fieldUser?.username ?? null,
    fieldUserDisplayName: fieldUser?.displayName ?? null,
    fieldUserRole: fieldUser?.role ?? null,
    deviceFingerprintHash: device.deviceFingerprintHash ?? null,
    status: device.status,
    isBlocked: device.isBlocked,
    validUntil: device.validUntil ?? null,
    graceDaysOffline: device.graceDaysOffline,
    lastSeenAt: device.lastSeenAt ?? null,
    platform: device.platform ?? null,
    appVersion: device.appVersion ?? null,
    notes: device.notes ?? null,
    metadataJson: device.metadataJson ?? null,
    deviceLabel: device.deviceLabel ?? null,
    enrolledAt: device.enrolledAt ?? null,
    revokedAt: device.revokedAt ?? null,
    hasActiveActivationCode,
    activationExpiresAt: hasActiveActivationCode
      ? (activeToken?.activationExpiresAt ?? null)
      : null,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

async function handleList(): Promise<FieldDeviceRecord[]> {
  const [devices, users, tokens] = await Promise.all([
    scanFieldDevices(),
    scanFieldUsers(),
    scanEnrollmentTokens(),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const nowMs = Date.now();
  devices.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return devices.map((device) => {
    const activeToken = findActiveTokenForDevice(tokens, device.id, nowMs);
    return toFieldDeviceRecord(device, userById.get(device.fieldUserId), activeToken);
  });
}

async function handleAssign(event: FieldHandlerEvent): Promise<FieldDeviceRecord> {
  const args = event.arguments;
  const fieldUserId = String(args.fieldUserId ?? "").trim();
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const deviceLabel =
    typeof args.deviceLabel === "string" ? args.deviceLabel.trim() || null : null;
  const metadataJson =
    typeof args.metadataJson === "string" ? args.metadataJson.trim() || null : null;
  const validUntil = parseOptionalIsoDate(args.validUntil, "Fecha de validez");

  if (!fieldUserId) throw new Error("Debe seleccionar un usuario de campo");

  const fieldUser = await getFieldUserById(fieldUserId);
  if (!fieldUser.isActive) {
    throwFieldDeviceError(
      "FIELD_USER_INACTIVE",
      "No se puede asignar dispositivo a un usuario de campo inactivo"
    );
  }

  const devices = await scanFieldDevices();
  assertDeviceQuota(fieldUser, devices);

  const now = new Date().toISOString();
  const device: FieldDeviceItem = {
    id: randomUUID(),
    fieldUserId,
    deviceFingerprintHash: null,
    status: "pending",
    isBlocked: false,
    validUntil,
    graceDaysOffline: DEFAULT_GRACE_DAYS_OFFLINE,
    lastSeenAt: null,
    platform: null,
    appVersion: null,
    notes,
    metadataJson,
    deviceLabel,
    enrolledAt: null,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await doc.send(
    new PutCommand({
      TableName: fieldDeviceTableName(),
      Item: device,
    })
  );
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: device.id,
    action: "assignManagedFieldDevice",
    userId: fieldUser.id,
    payload: {
      fieldUserId,
      status: device.status,
      validUntil,
      deviceLabel,
    },
  });

  return toFieldDeviceRecord(device, fieldUser);
}

async function handleGenerateEnrollmentCode(event: FieldHandlerEvent): Promise<EnrollmentCodeResult> {
  const fieldDeviceId = String(event.arguments.fieldDeviceId ?? "").trim();
  if (!fieldDeviceId) throwFieldDeviceError("DEVICE_NOT_FOUND", "Dispositivo no encontrado");

  const device = await getFieldDeviceById(fieldDeviceId);
  if (device.status !== "pending") {
    throwFieldDeviceError(
      "DEVICE_NOT_PENDING",
      "Solo se puede generar código para dispositivos pendientes de enrollment"
    );
  }
  if (device.isBlocked) {
    throwFieldDeviceError("DEVICE_BLOCKED", "El dispositivo está bloqueado por administración");
  }

  const fieldUser = await getFieldUserById(device.fieldUserId);
  if (!fieldUser.isActive) {
    throwFieldDeviceError("FIELD_USER_INACTIVE", "El usuario de campo está inactivo");
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + ENROLLMENT_CODE_TTL_MS).toISOString();
  const normalizedCode = generateEnrollmentCode(ENROLLMENT_CODE_LENGTH);

  await invalidateActiveTokensForDevice(fieldDeviceId, nowIso);

  const token: EnrollmentTokenItem = {
    id: randomUUID(),
    fieldDeviceId,
    activationCodeHash: hashEnrollmentCode(normalizedCode),
    activationExpiresAt: expiresAt,
    activationAttemptCount: 0,
    lastActivationAttemptAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await doc.send(
    new PutCommand({
      TableName: enrollmentTokenTableName(),
      Item: token,
    })
  );
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: fieldDeviceId,
    action: "generateManagedFieldDeviceEnrollmentCode",
    userId: fieldUser.id,
    payload: {
      expiresAt,
      codeLength: ENROLLMENT_CODE_LENGTH,
      singleUse: true,
    },
  });

  return {
    fieldDeviceId,
    enrollmentCode: formatEnrollmentCodeForDisplay(normalizedCode),
    expiresAt,
    codeLength: ENROLLMENT_CODE_LENGTH,
    singleUse: true,
  };
}

async function recordFailedActivationAttempt(token: EnrollmentTokenItem, nowIso: string): Promise<void> {
  await doc.send(
    new UpdateCommand({
      TableName: enrollmentTokenTableName(),
      Key: { id: token.id },
      UpdateExpression:
        "SET activationAttemptCount = :attempts, lastActivationAttemptAt = :lastAttempt, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":attempts": (token.activationAttemptCount ?? 0) + 1,
        ":lastAttempt": nowIso,
        ":updatedAt": nowIso,
      },
    })
  );
}

async function handleEnroll(event: FieldHandlerEvent): Promise<FieldDeviceEnrollmentResult> {
  const args = event.arguments;
  const enrollmentCodeRaw = String(args.enrollmentCode ?? "");
  const username = String(args.username ?? "");
  const password = String(args.password ?? "");
  const deviceFingerprintHash = String(args.deviceFingerprintHash ?? "").trim();
  const fingerprintVersion = String(args.fingerprintVersion ?? "v1").trim();
  const platform = String(args.platform ?? "").trim();
  const appVersion = String(args.appVersion ?? "").trim();
  const deviceLabelArg =
    typeof args.deviceLabel === "string" ? args.deviceLabel.trim() || null : null;

  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  if (!enrollmentCodeRaw.trim()) {
    throwFieldDeviceError("INVALID_ENROLLMENT_CODE", "Código de activación inválido");
  }
  if (!username.trim() || !password) {
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }
  if (fingerprintVersion !== "v1") {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Versión de fingerprint no soportada");
  }
  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }
  if (!platform || !appVersion) {
    throw new Error("platform y appVersion son obligatorios");
  }

  const normalizedCode = normalizeEnrollmentCode(enrollmentCodeRaw);
  const codeHash = hashEnrollmentCode(normalizedCode);
  const tokens = await scanEnrollmentTokens();
  const token = tokens.find((row) => row.activationCodeHash === codeHash);

  if (!token) {
    throwFieldDeviceError("INVALID_ENROLLMENT_CODE", "Código de activación inválido o expirado");
  }
  if (token.activationConsumedAt) {
    throwFieldDeviceError("ENROLLMENT_CODE_USED", "Este código ya fue utilizado");
  }
  if (new Date(token.activationExpiresAt).getTime() <= nowMs) {
    throwFieldDeviceError("ENROLLMENT_CODE_EXPIRED", "El código de activación expiró");
  }

  assertTokenRateLimit(token, nowMs);

  const device = await getFieldDeviceById(token.fieldDeviceId);
  if (device.status !== "pending") {
    throwFieldDeviceError("DEVICE_NOT_PENDING", "Este cupo ya no está disponible para activación");
  }
  if (device.isBlocked) {
    throwFieldDeviceError("DEVICE_BLOCKED", "Dispositivo bloqueado por administración");
  }

  const fieldUser = await getFieldUserById(device.fieldUserId);
  if (!fieldUser.isActive) {
    throwFieldDeviceError("FIELD_USER_INACTIVE", "Usuario de campo desactivado");
  }

  if (normalizeUsername(username) !== normalizeUsername(fieldUser.username)) {
    await recordFailedActivationAttempt(token, nowIso);
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }

  if (!verifyMobilePassword(password, fieldUser.mobilePasswordHash)) {
    await recordFailedActivationAttempt(token, nowIso);
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }
  const devices = await scanFieldDevices();
  assertDeviceQuota(fieldUser, devices, device.id);
  assertFingerprintUnique(devices, deviceFingerprintHash, device.id);
  const mergedDeviceLabel = deviceLabelArg ?? device.deviceLabel ?? null;

  try {
    await doc.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: enrollmentTokenTableName(),
              Key: { id: token.id },
              UpdateExpression:
                "SET activationConsumedAt = :consumedAt, updatedAt = :updatedAt, activationAttemptCount = :zero",
              ConditionExpression:
                "(attribute_not_exists(activationConsumedAt) OR attribute_type(activationConsumedAt, :nullType)) AND activationExpiresAt > :nowIso",
              ExpressionAttributeValues: {
                ":consumedAt": nowIso,
                ":updatedAt": nowIso,
                ":zero": 0,
                ":nullType": "NULL",
                ":nowIso": nowIso,
              },
            },
          },
          {
            Update: {
              TableName: fieldDeviceTableName(),
              Key: { id: device.id },
              UpdateExpression:
                "SET #status = :enrolled, deviceFingerprintHash = :hash, platform = :platform, appVersion = :appVersion, deviceLabel = :deviceLabel, enrolledAt = :enrolledAt, lastSeenAt = :lastSeenAt, updatedAt = :updatedAt",
              ConditionExpression: "#status = :pending AND isBlocked = :false",
              ExpressionAttributeNames: { "#status": "status" },
              ExpressionAttributeValues: {
                ":enrolled": "enrolled",
                ":pending": "pending",
                ":false": false,
                ":hash": deviceFingerprintHash,
                ":platform": platform,
                ":appVersion": appVersion,
                ":deviceLabel": mergedDeviceLabel,
                ":enrolledAt": nowIso,
                ":lastSeenAt": nowIso,
                ":updatedAt": nowIso,
              },
            },
          },
        ],
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TransactionCanceledException") {
      throwFieldDeviceError(
        "DEVICE_NOT_PENDING",
        "Este cupo ya no está disponible para activación"
      );
    }
    throw error;
  }

  const enrolledDevice: FieldDeviceItem = {
    ...device,
    status: "enrolled",
    deviceFingerprintHash,
    platform,
    appVersion,
    deviceLabel: mergedDeviceLabel,
    enrolledAt: nowIso,
    lastSeenAt: nowIso,
    updatedAt: nowIso,
  };
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: enrolledDevice.id,
    action: "enrollFieldDevice",
    userId: fieldUser.id,
    payload: {
      cloudDeviceId: enrolledDevice.id,
      platform,
      appVersion,
    },
  });

  return {
    device: {
      id: enrolledDevice.id,
      fieldUserId: enrolledDevice.fieldUserId,
      status: "enrolled",
      deviceFingerprintHash,
      isBlocked: false,
      validUntil: enrolledDevice.validUntil ?? null,
      graceDaysOffline: enrolledDevice.graceDaysOffline,
      enrolledAt: nowIso,
      platform,
      appVersion,
      deviceLabel: mergedDeviceLabel,
    },
    fieldUser: {
      id: fieldUser.id,
      username: fieldUser.username,
      displayName: fieldUser.displayName,
      role: fieldUser.role,
      isActive: fieldUser.isActive,
      mobilePasswordHash: fieldUser.mobilePasswordHash,
    },
    serverTime: nowIso,
  };
}

async function handleSyncStatus(event: FieldHandlerEvent): Promise<FieldDeviceStatusSyncResult> {
  const cloudDeviceId = String(event.arguments.cloudDeviceId ?? "").trim();
  const deviceFingerprintHash = String(event.arguments.deviceFingerprintHash ?? "").trim();
  const sessionToken = String(event.arguments.sessionToken ?? "").trim();
  const platform = typeof event.arguments.platform === "string" ? event.arguments.platform.trim() : null;
  const appVersion =
    typeof event.arguments.appVersion === "string" ? event.arguments.appVersion.trim() : null;

  if (!cloudDeviceId) throwFieldDeviceError("DEVICE_NOT_FOUND", "Dispositivo no encontrado");
  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }
  if (!sessionToken) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  const tokenClaims = verifyDeviceSessionToken(sessionToken, {
    cloudDeviceId,
    deviceFingerprintHash,
  });

  const device = await getFieldDeviceById(cloudDeviceId);
  if (tokenClaims.sub !== device.fieldUserId) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  if (device.deviceFingerprintHash !== deviceFingerprintHash) {
    throwFieldDeviceError("INVALID_FINGERPRINT", "El identificador del dispositivo no coincide");
  }

  const fieldUser = await getFieldUserById(device.fieldUserId);
  const nowIso = new Date().toISOString();

  if (device.status === "revoked") {
    await writeAuditLogSafe({
      entityType: "field_device",
      entityId: device.id,
      action: "syncFieldDeviceStatus_revoked",
      userId: fieldUser.id,
      payload: {
        cloudDeviceId: device.id,
        status: "revoked",
      },
    });
    return {
      cloudDeviceId: device.id,
      status: "revoked" as const,
      isBlocked: device.isBlocked,
      validUntil: device.validUntil ?? null,
      graceDaysOffline: device.graceDaysOffline,
      revokedAt: device.revokedAt ?? nowIso,
      fieldUserIsActive: fieldUser.isActive,
      lastSeenAt: device.lastSeenAt ?? null,
      serverTime: nowIso,
    };
  }

  if (device.status !== "enrolled") {
    throwFieldDeviceError("DEVICE_NOT_FOUND", "El dispositivo no está activado");
  }

  const updateParts = ["lastSeenAt = :lastSeenAt", "updatedAt = :updatedAt"];
  const values: Record<string, unknown> = {
    ":lastSeenAt": nowIso,
    ":updatedAt": nowIso,
  };
  if (platform) {
    updateParts.push("platform = :platform");
    values[":platform"] = platform;
  }
  if (appVersion) {
    updateParts.push("appVersion = :appVersion");
    values[":appVersion"] = appVersion;
  }

  await doc.send(
    new UpdateCommand({
      TableName: fieldDeviceTableName(),
      Key: { id: device.id },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeValues: values,
    })
  );
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: device.id,
    action: "syncFieldDeviceStatus",
    userId: fieldUser.id,
    payload: {
      cloudDeviceId: device.id,
      status: device.status,
      platform: platform ?? undefined,
      appVersion: appVersion ?? undefined,
    },
  });

  return {
    cloudDeviceId: device.id,
    status: device.status,
    isBlocked: device.isBlocked,
    validUntil: device.validUntil ?? null,
    graceDaysOffline: device.graceDaysOffline,
    revokedAt: device.revokedAt ?? null,
    fieldUserIsActive: fieldUser.isActive,
    lastSeenAt: nowIso,
    serverTime: nowIso,
  };
}

async function handleIssueDeviceSessionToken(event: FieldHandlerEvent): Promise<DeviceSessionTokenResult> {
  const cloudDeviceId = String(event.arguments.cloudDeviceId ?? "").trim();
  const username = String(event.arguments.username ?? "").trim();
  const password = String(event.arguments.password ?? "");
  const deviceFingerprintHash = String(event.arguments.deviceFingerprintHash ?? "").trim();
  const now = new Date();
  const nowIso = now.toISOString();

  if (!cloudDeviceId) throwFieldDeviceError("DEVICE_NOT_FOUND", "Dispositivo no encontrado");
  if (!username || !password) {
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }
  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }

  const device = await getFieldDeviceById(cloudDeviceId);
  if (device.status === "revoked") {
    throwFieldDeviceError("DEVICE_ALREADY_REVOKED", "Dispositivo revocado");
  }
  if (device.status !== "enrolled") {
    throwFieldDeviceError("DEVICE_NOT_PENDING", "Este dispositivo aún no está activado");
  }
  if (device.isBlocked) {
    throwFieldDeviceError("DEVICE_BLOCKED", "Dispositivo bloqueado por administración");
  }
  if (device.deviceFingerprintHash !== deviceFingerprintHash) {
    throwFieldDeviceError("INVALID_FINGERPRINT", "El identificador del dispositivo no coincide");
  }

  const fieldUser = await getFieldUserById(device.fieldUserId);
  if (!fieldUser.isActive) {
    throwFieldDeviceError("FIELD_USER_INACTIVE", "Usuario de campo desactivado");
  }
  if (normalizeUsername(username) !== normalizeUsername(fieldUser.username)) {
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }
  if (!verifyMobilePassword(password, fieldUser.mobilePasswordHash)) {
    throwFieldDeviceError("INVALID_CREDENTIALS", "Usuario o contraseña incorrectos");
  }

  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + DEVICE_SESSION_TOKEN_TTL_SECONDS;
  const sessionToken = signDeviceSessionToken({
    sub: fieldUser.id,
    cloudDeviceId: device.id,
    deviceFingerprintHash,
    iat,
    exp,
    tokenType: "device_session",
  });
  const expiresAt = new Date(exp * 1000).toISOString();
  await writeAuditLogSafe({
    entityType: "field_device_session",
    entityId: device.id,
    action: "issueDeviceSessionToken",
    userId: fieldUser.id,
    payload: {
      cloudDeviceId: device.id,
      expiresAt,
    },
  });

  return {
    sessionToken,
    expiresAt,
    serverTime: nowIso,
  };
}

async function handleRefreshDeviceSessionToken(event: FieldHandlerEvent): Promise<DeviceSessionTokenResult> {
  const cloudDeviceId = String(event.arguments.cloudDeviceId ?? "").trim();
  const deviceFingerprintHash = String(event.arguments.deviceFingerprintHash ?? "").trim();
  const sessionToken = String(event.arguments.sessionToken ?? "").trim();
  const now = new Date();
  const nowIso = now.toISOString();

  if (!cloudDeviceId) throwFieldDeviceError("DEVICE_NOT_FOUND", "Dispositivo no encontrado");
  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throwFieldDeviceError("INVALID_FINGERPRINT", "Formato de identificador de dispositivo inválido");
  }
  if (!sessionToken) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }

  const tokenClaims = verifyDeviceSessionToken(sessionToken, {
    cloudDeviceId,
    deviceFingerprintHash,
  });
  const device = await getFieldDeviceById(cloudDeviceId);
  if (device.fieldUserId !== tokenClaims.sub) {
    throwFieldDeviceError("INVALID_SESSION_TOKEN", "Sesión de dispositivo inválida");
  }
  if (device.status === "revoked") {
    throwFieldDeviceError("DEVICE_ALREADY_REVOKED", "Dispositivo revocado");
  }
  if (device.status !== "enrolled") {
    throwFieldDeviceError("DEVICE_NOT_PENDING", "Este dispositivo aún no está activado");
  }
  if (device.isBlocked) {
    throwFieldDeviceError("DEVICE_BLOCKED", "Dispositivo bloqueado por administración");
  }
  if (device.deviceFingerprintHash !== deviceFingerprintHash) {
    throwFieldDeviceError("INVALID_FINGERPRINT", "El identificador del dispositivo no coincide");
  }
  const fieldUser = await getFieldUserById(device.fieldUserId);
  if (!fieldUser.isActive) {
    throwFieldDeviceError("FIELD_USER_INACTIVE", "Usuario de campo desactivado");
  }

  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + DEVICE_SESSION_TOKEN_TTL_SECONDS;
  const refreshedToken = signDeviceSessionToken({
    sub: fieldUser.id,
    cloudDeviceId: device.id,
    deviceFingerprintHash,
    iat,
    exp,
    tokenType: "device_session",
  });
  const expiresAt = new Date(exp * 1000).toISOString();
  await writeAuditLogSafe({
    entityType: "field_device_session",
    entityId: device.id,
    action: "refreshDeviceSessionToken",
    userId: fieldUser.id,
    payload: {
      cloudDeviceId: device.id,
      expiresAt,
    },
  });

  return {
    sessionToken: refreshedToken,
    expiresAt,
    serverTime: nowIso,
  };
}

async function handleUpdate(event: FieldHandlerEvent): Promise<FieldDeviceRecord> {
  const args = event.arguments;
  const id = String(args.id ?? "").trim();
  const isBlocked = Boolean(args.isBlocked);
  const notes = typeof args.notes === "string" ? args.notes.trim() || null : null;
  const deviceLabel =
    typeof args.deviceLabel === "string" ? args.deviceLabel.trim() || null : null;
  const metadataJson =
    typeof args.metadataJson === "string" ? args.metadataJson.trim() || null : null;
  const validUntil = parseOptionalIsoDate(args.validUntil, "Fecha de validez");

  const current = await getFieldDeviceById(id);
  if (current.status === "revoked") {
    throwFieldDeviceError("DEVICE_ALREADY_REVOKED", "No se puede editar un dispositivo revocado");
  }

  const fieldUser = await getFieldUserById(current.fieldUserId);
  const now = new Date().toISOString();

  await doc.send(
    new UpdateCommand({
      TableName: fieldDeviceTableName(),
      Key: { id },
      UpdateExpression:
        "SET isBlocked = :isBlocked, validUntil = :validUntil, notes = :notes, metadataJson = :metadataJson, deviceLabel = :deviceLabel, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":isBlocked": isBlocked,
        ":validUntil": validUntil,
        ":notes": notes,
        ":metadataJson": metadataJson,
        ":deviceLabel": deviceLabel ?? current.deviceLabel ?? null,
        ":updatedAt": now,
      },
    })
  );
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: id,
    action: "updateManagedFieldDevice",
    userId: fieldUser.id,
    payload: {
      isBlocked,
      validUntil,
      deviceLabel: deviceLabel ?? current.deviceLabel ?? null,
    },
  });

  const tokens = await scanEnrollmentTokens();
  const activeToken = findActiveTokenForDevice(tokens, id, Date.now());

  return toFieldDeviceRecord(
    {
      ...current,
      isBlocked,
      validUntil,
      notes,
      metadataJson,
      deviceLabel: deviceLabel ?? current.deviceLabel ?? null,
      updatedAt: now,
    },
    fieldUser,
    activeToken
  );
}

async function handleRevoke(event: FieldHandlerEvent): Promise<FieldDeviceRecord> {
  const id = String(event.arguments.id ?? "").trim();
  const current = await getFieldDeviceById(id);
  if (current.status === "revoked") {
    throwFieldDeviceError("DEVICE_ALREADY_REVOKED", "El dispositivo ya está revocado");
  }

  const fieldUser = await getFieldUserById(current.fieldUserId);
  const now = new Date().toISOString();

  await invalidateActiveTokensForDevice(id, now);

  await doc.send(
    new UpdateCommand({
      TableName: fieldDeviceTableName(),
      Key: { id },
      UpdateExpression:
        "SET #status = :status, revokedAt = :revokedAt, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": "revoked",
        ":revokedAt": now,
        ":updatedAt": now,
      },
    })
  );
  await writeAuditLogSafe({
    entityType: "field_device",
    entityId: id,
    action: "revokeManagedFieldDevice",
    userId: fieldUser.id,
    payload: {
      revokedAt: now,
    },
  });

  return toFieldDeviceRecord(
    {
      ...current,
      status: "revoked",
      revokedAt: now,
      updatedAt: now,
    },
    fieldUser
  );
}

export const handler: AppSyncResolverHandler<
  Record<string, unknown>,
  | FieldDeviceRecord
  | FieldDeviceRecord[]
  | EnrollmentCodeResult
  | FieldDeviceEnrollmentResult
  | FieldDeviceStatusSyncResult
  | DeviceSessionTokenResult
  | null
> = async (event) => {
  try {
    const fieldEvent = event as FieldHandlerEvent;
    const field = resolveFieldName(fieldEvent);
    switch (field) {
      case "listManagedFieldDevices":
        return await handleList();
      case "assignManagedFieldDevice":
        return await handleAssign(fieldEvent);
      case "generateManagedFieldDeviceEnrollmentCode":
        return await handleGenerateEnrollmentCode(fieldEvent);
      case "enrollFieldDevice":
        return await handleEnroll(fieldEvent);
      case "syncFieldDeviceStatus":
        return await handleSyncStatus(fieldEvent);
      case "issueDeviceSessionToken":
        return await handleIssueDeviceSessionToken(fieldEvent);
      case "refreshDeviceSessionToken":
        return await handleRefreshDeviceSessionToken(fieldEvent);
      case "updateManagedFieldDevice":
        return await handleUpdate(fieldEvent);
      case "revokeManagedFieldDevice":
        return await handleRevoke(fieldEvent);
      default:
        throw new Error(`Operación no soportada: ${field}`);
    }
  } catch (error) {
    mapHandlerError(error);
  }
};
