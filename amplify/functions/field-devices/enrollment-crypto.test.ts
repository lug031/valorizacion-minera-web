import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatEnrollmentCodeForDisplay,
  generateEnrollmentCode,
  hashEnrollmentCode,
  hashMobilePassword,
  normalizeEnrollmentCode,
  verifyMobilePassword,
} from "./enrollment-crypto.ts";

describe("enrollment-crypto", () => {
  it("normaliza y formatea códigos", () => {
    assert.equal(normalizeEnrollmentCode("k7m4-pq9x"), "K7M4PQ9X");
    assert.equal(formatEnrollmentCodeForDisplay("K7M4PQ9X"), "K7M4-PQ9X");
  });

  it("genera códigos de 8 caracteres válidos", () => {
    const code = generateEnrollmentCode();
    assert.equal(code.length, 8);
    assert.match(code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
  });

  it("hashea códigos de forma estable", () => {
    const hashA = hashEnrollmentCode("K7M4PQ9X");
    const hashB = hashEnrollmentCode(normalizeEnrollmentCode("k7m4-pq9x"));
    assert.equal(hashA, hashB);
    assert.match(hashA, /^vm-sha256:[a-f0-9]{64}$/);
  });

  it("verifica contraseñas móviles", () => {
    const hash = hashMobilePassword("MiClave123!");
    assert.equal(verifyMobilePassword("MiClave123!", hash), true);
    assert.equal(verifyMobilePassword("otra", hash), false);
  });
});
