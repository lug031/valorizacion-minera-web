import { createHash, randomInt } from "node:crypto";

const CROCKFORD_BASE32 = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const FINGERPRINT_HASH_RE = /^vm-sha256:[a-f0-9]{64}$/;

export function hashSecret(value: string): string {
  return `vm-sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function hashMobilePassword(password: string): string {
  return hashSecret(password);
}

export function verifyMobilePassword(password: string, storedHash: string): boolean {
  return hashMobilePassword(password) === storedHash;
}

export function normalizeEnrollmentCode(raw: string): string {
  return raw.replace(/-/g, "").trim().toUpperCase();
}

export function formatEnrollmentCodeForDisplay(normalized: string): string {
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}

export function generateEnrollmentCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CROCKFORD_BASE32[randomInt(CROCKFORD_BASE32.length)];
  }
  return code;
}

export function hashEnrollmentCode(normalizedCode: string): string {
  return hashSecret(`enrollment:${normalizedCode}`);
}

export function assertValidFingerprintHash(deviceFingerprintHash: string): void {
  if (!FINGERPRINT_HASH_RE.test(deviceFingerprintHash)) {
    throw new Error("INVALID_FINGERPRINT");
  }
}
