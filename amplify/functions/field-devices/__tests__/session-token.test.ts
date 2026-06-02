const mockSend = jest.fn();

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend }),
  },
  ScanCommand: jest.fn((input: unknown) => ({ input })),
  PutCommand: jest.fn((input: unknown) => ({ input })),
  UpdateCommand: jest.fn((input: unknown) => ({ input })),
  TransactWriteCommand: jest.fn((input: unknown) => ({ input })),
}));

import { handler } from "../handler";

const VALID_FP = `vm-sha256:${"a".repeat(64)}`;
const DEVICE_ID = "device-1";
const USER_ID = "user-1";

function enrolledDevice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: DEVICE_ID,
    fieldUserId: USER_ID,
    deviceFingerprintHash: VALID_FP,
    status: "enrolled",
    isBlocked: false,
    ...overrides,
  };
}

function activeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    username: "operador.a",
    displayName: "Operador A",
    role: "operador",
    isActive: true,
    mobilePasswordHash:
      "vm-sha256:fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4", // "secret123"
    ...overrides,
  };
}

async function invokeIssueToken(args: Record<string, unknown> = {}) {
  return handler(
    {
      fieldName: "issueDeviceSessionToken",
      arguments: {
        cloudDeviceId: DEVICE_ID,
        username: "operador.a",
        password: "secret123",
        deviceFingerprintHash: VALID_FP,
        ...args,
      },
    } as never,
    {} as never,
    {} as never
  );
}

async function invokeRefreshToken(args: Record<string, unknown> = {}) {
  const issued = (await invokeIssueToken()) as { sessionToken: string };
  return handler(
    {
      fieldName: "refreshDeviceSessionToken",
      arguments: {
        cloudDeviceId: DEVICE_ID,
        deviceFingerprintHash: VALID_FP,
        sessionToken: issued.sessionToken,
        ...args,
      },
    } as never,
    {} as never,
    {} as never
  );
}

describe("field-devices issueDeviceSessionToken", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("emite token temporal cuando dispositivo y credenciales son válidos", async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [enrolledDevice()] }) // scan devices
      .mockResolvedValueOnce({ Items: [activeUser()] }) // scan users
      .mockResolvedValueOnce({}); // audit log write

    const result = await invokeIssueToken();

    expect(result?.sessionToken).toBeTruthy();
    expect(typeof result?.sessionToken).toBe("string");
    expect(result?.sessionToken.split(".")).toHaveLength(3);
    expect(result?.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result?.serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("rechaza credenciales inválidas", async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [enrolledDevice()] })
      .mockResolvedValueOnce({ Items: [activeUser()] });

    await expect(invokeIssueToken({ password: "incorrecta" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("rechaza fingerprint que no coincide", async () => {
    mockSend
      .mockResolvedValueOnce({
        Items: [enrolledDevice({ deviceFingerprintHash: `vm-sha256:${"b".repeat(64)}` })],
      })
      .mockResolvedValueOnce({ Items: [activeUser()] });

    await expect(invokeIssueToken()).rejects.toMatchObject({
      code: "INVALID_FINGERPRINT",
    });
  });

  it("refresca token cuando sesión vigente es válida", async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [enrolledDevice()] }) // issue: devices
      .mockResolvedValueOnce({ Items: [activeUser()] }) // issue: users
      .mockResolvedValueOnce({}) // issue: audit
      .mockResolvedValueOnce({ Items: [enrolledDevice()] }) // refresh: devices
      .mockResolvedValueOnce({ Items: [activeUser()] }) // refresh: users
      .mockResolvedValueOnce({}); // refresh: audit

    const refreshed = await invokeRefreshToken();
    expect(refreshed?.sessionToken).toBeTruthy();
    expect(refreshed?.sessionToken.split(".")).toHaveLength(3);
  });
});
