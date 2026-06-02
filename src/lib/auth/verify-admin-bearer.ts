import { createPublicKey, createVerify, type KeyObject } from "node:crypto";
import amplifyOutputs from "../../../amplify_outputs.json";
import { isAdmin } from "./cognito-groups";

export type AdminBearerResult =
  | { ok: true; groups: string[] }
  | { ok: false; reason: string };

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type JwksResponse = {
  keys?: Array<Record<string, unknown>>;
};

const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;
const jwksCache = new Map<string, { expiresAt: number; keysByKid: Map<string, KeyObject> }>();

function base64UrlToBuffer(value: string): Buffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

function groupsFromJwtPayload(payload: Record<string, unknown>): string[] {
  const groups = payload["cognito:groups"];
  if (Array.isArray(groups)) return groups.filter((g): g is string => typeof g === "string");
  if (typeof groups === "string") return [groups];
  return [];
}

function decodeJwtHeader(token: string): JwtHeader | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlToBuffer(parts[0]).toString("utf8");
    return JSON.parse(json) as JwtHeader;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = base64UrlToBuffer(parts[1]).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveAuthConfig() {
  const region = amplifyOutputs?.auth?.aws_region;
  const userPoolId = amplifyOutputs?.auth?.user_pool_id;
  const clientId = amplifyOutputs?.auth?.user_pool_client_id;
  if (!region || !userPoolId || !clientId) {
    return null;
  }
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  return { issuer, clientId };
}

function payloadMatchesAudience(payload: Record<string, unknown>, expectedClientId: string): boolean {
  const aud = payload.aud;
  if (typeof aud === "string") return aud === expectedClientId;
  if (Array.isArray(aud)) {
    return aud.some((item) => typeof item === "string" && item === expectedClientId);
  }
  const clientId = payload.client_id;
  return typeof clientId === "string" && clientId === expectedClientId;
}

async function loadJwks(issuer: string, forceRefresh = false): Promise<Map<string, KeyObject>> {
  const now = Date.now();
  const cached = jwksCache.get(issuer);
  if (!forceRefresh && cached && cached.expiresAt > now) {
    return cached.keysByKid;
  }

  const res = await fetch(`${issuer}/.well-known/jwks.json`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("JWKS_FETCH_FAILED");

  const body = (await res.json()) as JwksResponse;
  const keysByKid = new Map<string, KeyObject>();
  for (const raw of body.keys ?? []) {
    const kid = typeof raw.kid === "string" ? raw.kid : "";
    const kty = typeof raw.kty === "string" ? raw.kty : "";
    if (!kid || kty !== "RSA") continue;
    try {
      const keyObject = createPublicKey({
        key: raw as JsonWebKey,
        format: "jwk",
      });
      keysByKid.set(kid, keyObject);
    } catch {
      // ignore invalid keys
    }
  }
  if (keysByKid.size === 0) throw new Error("JWKS_EMPTY");

  jwksCache.set(issuer, {
    expiresAt: now + JWKS_CACHE_TTL_MS,
    keysByKid,
  });
  return keysByKid;
}

async function verifyJwtSignature(token: string, issuer: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const header = decodeJwtHeader(token);
  if (!header?.kid || header.alg !== "RS256") return false;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlToBuffer(encodedSignature);

  let keysByKid = await loadJwks(issuer);
  let key = keysByKid.get(header.kid);
  if (!key) {
    keysByKid = await loadJwks(issuer, true);
    key = keysByKid.get(header.kid);
  }
  if (!key) return false;

  const verifier = createVerify("RSA-SHA256");
  verifier.update(signingInput, "utf8");
  verifier.end();
  return verifier.verify(key, signature);
}

/** Valida JWT Cognito del header Authorization (grupo admin). */
export async function verifyAdminBearer(authorization: string | null): Promise<AdminBearerResult> {
  if (!authorization?.startsWith("Bearer ")) {
    return { ok: false, reason: "Falta token de autorización" };
  }

  const authConfig = resolveAuthConfig();
  if (!authConfig) {
    return { ok: false, reason: "Configuración de autenticación no disponible" };
  }

  const token = authorization.slice("Bearer ".length).trim();
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { ok: false, reason: "Token inválido" };
  }

  if (payload.iss !== authConfig.issuer) {
    return { ok: false, reason: "Token inválido" };
  }

  if (!payloadMatchesAudience(payload, authConfig.clientId)) {
    return { ok: false, reason: "Token inválido" };
  }

  try {
    const validSignature = await verifyJwtSignature(token, authConfig.issuer);
    if (!validSignature) {
      return { ok: false, reason: "Token inválido" };
    }
  } catch {
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
