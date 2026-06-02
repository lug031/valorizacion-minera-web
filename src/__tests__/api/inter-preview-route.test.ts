import { generateKeyPairSync, sign } from "node:crypto";
import type { KeyObject } from "node:crypto";
import { GET } from "@/app/api/inter/preview/route";
import amplifyOutputs from "../../../amplify_outputs.json";

jest.mock("@/services/inter/inter-spot-provider", () => ({
  INTER_SPOT_PREVIEW_DISCLAIMER: "disclaimer",
  fetchInterSpotFromProvider: jest.fn(async () => ({
    gold: 2300,
    silver: 28,
    fetchedAt: "2026-06-01T00:00:00.000Z",
  })),
}));

function base64UrlEncode(value: string | Buffer): string {
  const raw = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return raw
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJwt(params: {
  kid: string;
  privateKey: KeyObject;
  payload: Record<string, unknown>;
}): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: params.kid,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(params.payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput, "utf8"), params.privateKey);
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function createJwksResponse(publicKey: KeyObject, kid: string) {
  const jwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
  return {
    keys: [{ ...jwk, use: "sig", alg: "RS256", kid }],
  };
}

function buildAuthHeader(token: string): Headers {
  return new Headers({ authorization: `Bearer ${token}` });
}

describe("GET /api/inter/preview JWT hardening", () => {
  const issuer = `https://cognito-idp.${amplifyOutputs.auth.aws_region}.amazonaws.com/${amplifyOutputs.auth.user_pool_id}`;
  const audience = amplifyOutputs.auth.user_pool_client_id;

  beforeEach(() => {
    jest.restoreAllMocks();
    global.fetch = jest.fn();
  });

  it("token válido admin => 200", async () => {
    const kid = "kid-admin-valid";
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const token = createJwt({
      kid,
      privateKey,
      payload: {
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 60,
        "cognito:groups": ["admin"],
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => createJwksResponse(publicKey, kid),
    });

    const res = await GET(new Request("http://localhost/api/inter/preview", { headers: buildAuthHeader(token) }));
    expect(res.status).toBe(200);
  });

  it("token válido no-admin => 401", async () => {
    const kid = "kid-supervisor-valid";
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const token = createJwt({
      kid,
      privateKey,
      payload: {
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 60,
        "cognito:groups": ["supervisor"],
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => createJwksResponse(publicKey, kid),
    });

    const res = await GET(new Request("http://localhost/api/inter/preview", { headers: buildAuthHeader(token) }));
    expect(res.status).toBe(401);
  });

  it("token expirado => 401", async () => {
    const kid = "kid-expired";
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const token = createJwt({
      kid,
      privateKey,
      payload: {
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) - 60,
        "cognito:groups": ["admin"],
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => createJwksResponse(publicKey, kid),
    });

    const res = await GET(new Request("http://localhost/api/inter/preview", { headers: buildAuthHeader(token) }));
    expect(res.status).toBe(401);
  });

  it("token con firma inválida => 401", async () => {
    const kid = "kid-invalid-signature";
    const keyForJwks = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const keyForToken = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const token = createJwt({
      kid,
      privateKey: keyForToken.privateKey,
      payload: {
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 60,
        "cognito:groups": ["admin"],
      },
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => createJwksResponse(keyForJwks.publicKey, kid),
    });

    const res = await GET(new Request("http://localhost/api/inter/preview", { headers: buildAuthHeader(token) }));
    expect(res.status).toBe(401);
  });

  it("token manipulado => 401", async () => {
    const kid = "kid-tampered";
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const originalToken = createJwt({
      kid,
      privateKey,
      payload: {
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 60,
        "cognito:groups": ["admin"],
      },
    });
    const [encodedHeader, , encodedSignature] = originalToken.split(".");
    const tamperedPayload = base64UrlEncode(
      JSON.stringify({
        iss: issuer,
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 60,
        "cognito:groups": ["admin", "supervisor"],
      })
    );
    const tamperedToken = `${encodedHeader}.${tamperedPayload}.${encodedSignature}`;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => createJwksResponse(publicKey, kid),
    });

    const res = await GET(new Request("http://localhost/api/inter/preview", { headers: buildAuthHeader(tamperedToken) }));
    expect(res.status).toBe(401);
  });
});
