export type FieldDeviceErrorCode =
  | "FIELD_USER_NOT_FOUND"
  | "FIELD_USER_INACTIVE"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_NOT_PENDING"
  | "DEVICE_BLOCKED"
  | "DEVICE_QUOTA_EXCEEDED"
  | "INVALID_ENROLLMENT_CODE"
  | "ENROLLMENT_CODE_EXPIRED"
  | "ENROLLMENT_CODE_USED"
  | "INVALID_CREDENTIALS"
  | "FINGERPRINT_ALREADY_BOUND"
  | "RATE_LIMITED"
  | "INVALID_FINGERPRINT"
  | "INVALID_VALID_UNTIL"
  | "DEVICE_ALREADY_REVOKED";

export class FieldDeviceError extends Error {
  readonly code: FieldDeviceErrorCode;

  constructor(code: FieldDeviceErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.code = code;
    this.name = "FieldDeviceError";
  }
}

export function throwFieldDeviceError(code: FieldDeviceErrorCode, message: string): never {
  throw new FieldDeviceError(code, message);
}
