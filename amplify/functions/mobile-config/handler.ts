import { createHmac } from "node:crypto";
import type { AppSyncResolverHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { env } from "$amplify/env/mobile-config";
import { assertValidFingerprintHash } from "../field-devices/enrollment-crypto";
import type { Schema } from "../../data/resource";

type MobileConfigBundleResult = Schema["MobileConfigBundleResult"]["type"];

type MobileConfigEvent = {
  fieldName?: string;
  info?: { fieldName?: string };
  arguments: Record<string, unknown>;
};

type FieldDeviceItem = {
  id: string;
  fieldUserId: string;
  deviceFingerprintHash?: string | null;
  status: "pending" | "enrolled" | "revoked";
  isBlocked: boolean;
};

const doc = DynamoDBDocumentClient.from(new DynamoDBClient());

function resolveFieldName(event: MobileConfigEvent): string {
  const field = event.fieldName ?? event.info?.fieldName;
  if (!field) throw new Error("Operación no soportada: nombre de campo no disponible");
  return field;
}

function requireEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${name} no configurado`);
  return trimmed;
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
    throw new Error("INVALID_SESSION_TOKEN");
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = requireEnv("DEVICE_SESSION_TOKEN_SECRET", env.DEVICE_SESSION_TOKEN_SECRET);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret).update(signingInput, "utf8").digest("base64url");
  if (signature !== expectedSignature) {
    throw new Error("INVALID_SESSION_TOKEN");
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
    throw new Error("INVALID_SESSION_TOKEN");
  }
  if (
    payload.cloudDeviceId !== expected.cloudDeviceId ||
    payload.deviceFingerprintHash !== expected.deviceFingerprintHash
  ) {
    throw new Error("INVALID_SESSION_TOKEN");
  }
  return { sub: payload.sub };
}

async function scanTable<T>(tableName: string): Promise<T[]> {
  const res = await doc.send(new ScanCommand({ TableName: tableName }));
  return (res.Items ?? []) as T[];
}

async function getFieldDeviceById(id: string): Promise<FieldDeviceItem> {
  const tableName = requireEnv("FIELDDEVICE_TABLE_NAME", env.FIELDDEVICE_TABLE_NAME);
  const devices = await scanTable<FieldDeviceItem>(tableName);
  const device = devices.find((d) => d.id === id);
  if (!device) throw new Error("DEVICE_NOT_FOUND");
  return device;
}

async function handleGetMobileConfigBundle(event: MobileConfigEvent): Promise<MobileConfigBundleResult> {
  const cloudDeviceId = String(event.arguments.cloudDeviceId ?? "").trim();
  const deviceFingerprintHash = String(event.arguments.deviceFingerprintHash ?? "").trim();
  const sessionToken = String(event.arguments.sessionToken ?? "").trim();
  if (!cloudDeviceId || !sessionToken) throw new Error("INVALID_SESSION_TOKEN");
  try {
    assertValidFingerprintHash(deviceFingerprintHash);
  } catch {
    throw new Error("INVALID_SESSION_TOKEN");
  }

  const tokenClaims = verifyDeviceSessionToken(sessionToken, {
    cloudDeviceId,
    deviceFingerprintHash,
  });
  const device = await getFieldDeviceById(cloudDeviceId);
  if (
    device.status !== "enrolled" ||
    device.isBlocked ||
    device.deviceFingerprintHash !== deviceFingerprintHash ||
    device.fieldUserId !== tokenClaims.sub
  ) {
    throw new Error("INVALID_SESSION_TOKEN");
  }

  const [
    materialTypes,
    maquilaRanges,
    providers,
    providerDefaults,
    appSettings,
  ] = await Promise.all([
    scanTable(requireEnv("MATERIALTYPE_TABLE_NAME", env.MATERIALTYPE_TABLE_NAME)),
    scanTable(requireEnv("MAQUILARANGE_TABLE_NAME", env.MAQUILARANGE_TABLE_NAME)),
    scanTable(requireEnv("PROVIDER_TABLE_NAME", env.PROVIDER_TABLE_NAME)),
    scanTable(requireEnv("PROVIDERDEFAULTS_TABLE_NAME", env.PROVIDERDEFAULTS_TABLE_NAME)),
    scanTable(requireEnv("APPSETTINGS_TABLE_NAME", env.APPSETTINGS_TABLE_NAME)),
  ]);

  return {
    materialTypes: materialTypes as MobileConfigBundleResult["materialTypes"],
    maquilaRanges: maquilaRanges as MobileConfigBundleResult["maquilaRanges"],
    providers: providers as MobileConfigBundleResult["providers"],
    providerDefaults: providerDefaults as MobileConfigBundleResult["providerDefaults"],
    appSettings: appSettings as MobileConfigBundleResult["appSettings"],
    serverTime: new Date().toISOString(),
  };
}

export const handler: AppSyncResolverHandler<Record<string, unknown>, MobileConfigBundleResult | null> = async (
  event
) => {
  const mobileConfigEvent = event as MobileConfigEvent;
  const field = resolveFieldName(mobileConfigEvent);
  switch (field) {
    case "getMobileConfigBundle":
      return await handleGetMobileConfigBundle(mobileConfigEvent);
    default:
      throw new Error(`Operación no soportada: ${field}`);
  }
};
