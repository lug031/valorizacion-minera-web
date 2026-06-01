export type FieldValuationErrorCode =
  | "FIELD_USER_NOT_FOUND"
  | "FIELD_USER_INACTIVE"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_NOT_ENROLLED"
  | "DEVICE_BLOCKED"
  | "DEVICE_REVOKED"
  | "INVALID_FINGERPRINT"
  | "FINGERPRINT_MISMATCH"
  | "USER_DEVICE_MISMATCH"
  | "INVALID_PAYLOAD"
  | "PAYLOAD_TOO_LARGE";

export class FieldValuationError extends Error {
  readonly code: FieldValuationErrorCode;

  constructor(code: FieldValuationErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
    this.name = "FieldValuationError";
  }
}

export function throwFieldValuationError(code: FieldValuationErrorCode, message: string): never {
  throw new FieldValuationError(code, message);
}
