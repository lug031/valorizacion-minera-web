import { isAdmin } from "@/lib/auth/cognito-groups";

export type AdminBearerResult =
  | { ok: true; groups: string[] }
  | { ok: false; reason: string };

function groupsFromJwtPayload(payload: Record<string, unknown>): string[] {
  const groups = payload["cognito:groups"];
  if (Array.isArray(groups)) return groups.filter((g): g is string => typeof g === "string");
  if (typeof groups === "string") return [groups];
  return [];
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Valida JWT Cognito del header Authorization (grupo admin). App interna — Fase 1. */
export function verifyAdminBearer(authorization: string | null): AdminBearerResult {
  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, reason: "Falta token de autorización" };
  }

  const token = authorization.slice("Bearer ".length).trim();
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { ok: false, reason: "Token inválido" };
  }

  const exp = payload.exp;
  if (typeof exp === "number" && exp * 1000 < Date.now()) {
    return { ok: false, reason: "Sesión expirada" };
  }

  const groups = groupsFromJwtPayload(payload);
  if (!isAdmin(groups)) {
    return { ok: false, reason: "Se requiere perfil administrador" };
  }

  return { ok: true, groups };
}
